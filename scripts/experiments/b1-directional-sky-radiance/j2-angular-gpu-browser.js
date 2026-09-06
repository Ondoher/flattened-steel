import * as THREE from '../../../node_modules/three/build/three.module.js';

import {CacheGpuExecutor} from '../../../src/algorithm32/gpu-cache-runtime/CacheGpuExecutor.js';
import {Algorithm32} from '../../../src/algorithm32/implementation/algorithm32/Algorithm32.js';
import {SharedModel} from '../../../src/algorithm32/implementation/algorithm32/model/SharedModel.js';
import {DistantSunCacheController} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunCacheController.js';
import {DistantSunCpuCache} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunCpuCache.js';
import {ThreeCacheBackend} from '../../../src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {CachePassAssembler} from '../../../src/algorithm32/shader-assembly/cache-pass/CachePassAssembler.js';
import {SpectralCalculator} from '../../../src/algorithm32/atmospheric-transport/spectral/SpectralCalculator.js';
import {createBrunetonProductionProfile, createViewDirection} from './production-profile.js';
import {OutgoingDirectionDiagnosticDomain} from './OutgoingDirectionDiagnosticDomain.js';

const FACE_WIDTHS = Object.freeze([27, 39, 55, 81]);
const POSITION_INDICES = Object.freeze([0, 1, 4, 12, 24, 47]);
const CHANNEL_INDICES = Object.freeze([0, 5, 10, 15, 20, 25, 30, 39]);
const GRID_INDICES = Object.freeze(
	[0, 2, 4, 6, 8].flatMap((gridX) => [0, 4, 8].map((gridY) => Object.freeze({gridX, gridY}))),
);
let session = null;

/** Call this function to initialize the retained angular-diagnostic WebGL session. */
export function initializeJ2AngularGpuSession() {
	if (session) return;
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, stencil: false});
	if (!context || !context.getExtension('EXT_color_buffer_float')) {
		throw new Error('J2 angular interpolation diagnostic requires WebGL2 float rendering.');
	}
	const renderer = new THREE.WebGLRenderer({canvas, context});
	renderer.debug.checkShaderErrors = true;
	renderer.setSize(2, 2, false);
	const backend = new ThreeCacheBackend({THREE, renderer});
	session = {
		canvas,
		context,
		renderer,
		backend,
		executor: new CacheGpuExecutor({backend, assembler: new CachePassAssembler()}),
	};
}

/** Call this function to dispose the retained angular-diagnostic WebGL session. */
export function disposeJ2AngularGpuSession() {
	if (!session) return;
	const current = session;
	session = null;
	current.executor.dispose();
	current.backend.dispose();
	current.renderer.dispose();
	current.renderer.forceContextLoss();
	current.canvas.remove();
}

/**
 * Called by the diagnostic to derive an N2 profile with one sparse outgoing domain.
 *
 * @param {Algorithm32ExecutionProfile} profile - Configured benchmark profile.
 * @param {OutgoingDirectionDiagnosticDomain} outgoingDirections - Sparse outgoing domain.
 * @returns {Algorithm32ExecutionProfile} - Derived diagnostic profile.
 */
function createDiagnosticProfile(profile, outgoingDirections) {
	return {
		...profile,
		id: `${profile.id}-${outgoingDirections.id}`,
		domains: {...profile.domains, outgoingDirections},
		numerical: {
			...profile.numerical,
			cacheConstruction: {...profile.numerical.cacheConstruction, maximumScatteringOrder: 2},
		},
	};
}

/**
 * Called by the diagnostic to build probe coordinates for every retained sparse direction.
 *
 * @param {OutgoingDirectionDiagnosticDomain} domain - Sparse outgoing domain.
 * @returns {readonly CacheProbeCoordinate[]} - Selected J2 field coordinates.
 */
function createProbeCoordinates(domain) {
	return Array.from({length: domain.directionCount}, (_unused, directionIndex) => directionIndex).flatMap(
		(directionIndex) =>
			POSITION_INDICES.flatMap((positionIndex) =>
				CHANNEL_INDICES.map((wavelengthIndex) => ({directionIndex, positionIndex, wavelengthIndex})),
			),
	);
}

/**
 * Called by the diagnostic to build one sparse J2 field and read its selected coordinates.
 *
 * @param {Algorithm32ExecutionProfile} baseProfile - Configured benchmark profile.
 * @param {OutgoingDirectionDiagnosticDomain} domain - Sparse outgoing domain.
 * @returns {Promise<{values: Map<string, number>, durationMilliseconds: number}>} - Selected GPU J2 values and duration.
 */
async function buildJ2Field(baseProfile, domain) {
	const profile = createDiagnosticProfile(baseProfile, domain);
	const model = new SharedModel({version: 1, profile});
	const controller = new DistantSunCacheController({model, backend: session.backend});
	const plan = controller.createBuildPlan();
	controller.dispose();
	const coordinates = createProbeCoordinates(domain);
	if (coordinates.length > 4096) throw new Error(`J2 diagnostic probe has ${coordinates.length} scalars.`);
	const startedAt = performance.now();
	let artifact;
	try {
		artifact = await session.executor.execute(plan, {
			probeReader: session.backend,
			probes: [{field: 'distant-sun-j2', coordinates}],
		});
		const pass = artifact.diagnostics.passes.find((candidate) => candidate.id === 'distant-sun-scatter-l1-to-j2');
		if (!pass?.probe) throw new Error('J2 angular diagnostic did not retain its pure-J2 probe.');
		return {
			values: new Map(
				pass.probe.samples.map((sample) => [
					`${sample.coordinates.directionIndex}/${sample.coordinates.positionIndex}/${sample.coordinates.wavelengthIndex}`,
					sample.value,
				]),
			),
			durationMilliseconds: performance.now() - startedAt,
		};
	} finally {
		artifact?.dispose();
	}
}

/**
 * Called by the score diagnostic to build and read one complete sparse pure-J2 field.
 *
 * @param {Algorithm32ExecutionProfile} baseProfile - Configured benchmark profile.
 * @param {OutgoingDirectionDiagnosticDomain} domain - Sparse outgoing domain.
 * @returns {Promise<{storage: CacheFieldStorage, values: Float32Array, durationMilliseconds: number}>} - GPU field readback.
 */
async function buildCompleteJ2Field(baseProfile, domain) {
	const profile = createDiagnosticProfile(baseProfile, domain);
	const model = new SharedModel({version: 1, profile});
	const controller = new DistantSunCacheController({model, backend: session.backend});
	const productionPlan = controller.createBuildPlan();
	controller.dispose();
	const plan = {...productionPlan, result: 'distant-sun-j2'};
	const startedAt = performance.now();
	let artifact;
	try {
		artifact = await session.executor.execute(plan);
		const binding = artifact.runtimeBindings.bindings[0];
		const field = await session.backend.readRuntimeBindingField(binding);
		return {...field, durationMilliseconds: performance.now() - startedAt};
	} finally {
		artifact?.dispose();
	}
}

/**
 * Called by the score diagnostic to integrate one sparse pure-J2 field along all 81 B1 view rays.
 *
 * @param {Algorithm32ExecutionProfile} profile - Candidate profile.
 * @param {OutgoingDirectionDiagnosticDomain} domain - Candidate reconstruction domain.
 * @param {{storage: CacheFieldStorage, values: Float32Array}} field - Complete GPU J2 readback.
 * @returns {number[][]} - Pure-J2 path-radiance spectra in grid-x-major benchmark order.
 */
function integrateJ2ViewRays(profile, domain, field) {
	const model = new SharedModel({version: 1, profile: createDiagnosticProfile(profile, domain)});
	const geometry = model.geometry;
	const calculator = new SpectralCalculator({model});
	const layerSize = field.storage.width * field.storage.height;
	const cache = new DistantSunCpuCache({
		cumulativeScatteringDensity: {
			provenanceIdentity: `${domain.id}:gpu-r32f-j2-readback`,
			createReader() {
				return {
					readScalar({directionIndex, positionIndex, wavelengthIndex}) {
						return field.values[
							wavelengthIndex * layerSize + positionIndex * field.storage.width + directionIndex
						];
					},
				};
			},
		},
		domainSelection: {spectralBasis: profile.spectral.basis},
	});
	const originalResolver = geometry.resolveScatteringCacheDirectionStencil;
	geometry.resolveScatteringCacheDirectionStencil = (request) =>
		domain.resolveStencil(geometry.expressScatteringCacheDirection(request));
	try {
		const values = [];
		for (let gridX = 0; gridX < 9; gridX += 1) {
			for (let gridY = 0; gridY < 9; gridY += 1) {
				const direction = createViewDirection(gridX, gridY);
				const segment = geometry.resolveViewRaySegment({direction});
				const path = calculator.buildEndpointTrapezoidPathIntegrationPoints(
					segment,
					profile.numerical.viewPath.intervalCount,
				);
				values.push([
					...calculator.computeRadiance(segment, path, {scatteringCache: cache}).pathRadiance.values,
				]);
			}
		}
		return values;
	} finally {
		geometry.resolveScatteringCacheDirectionStencil = originalResolver;
		cache.dispose();
	}
}

/**
 * Called by the diagnostic to sample a sparse field through one query stencil.
 *
 * @param {Map<string, number>} field - Selected sparse field values.
 * @param {ScatteringCacheDirectionStencil} stencil - Query reconstruction stencil.
 * @param {number} positionIndex - Selected elevation index.
 * @param {number} channelIndex - Selected wavelength index.
 * @returns {number} - Reconstructed J2 scalar.
 */
function sampleField(field, stencil, positionIndex, channelIndex) {
	let value = 0;
	for (let tap = 0; tap < stencil.indices.length; tap += 1) {
		value += field.get(`${stencil.indices[tap]}/${positionIndex}/${channelIndex}`) * stencil.weights[tap];
	}
	return value;
}

/**
 * Called by the diagnostic to measure one reconstructed field against exact outgoing J2.
 *
 * @param {Map<string, number>} candidate - Candidate sparse field.
 * @param {OutgoingDirectionDiagnosticDomain} candidateDomain - Candidate stencils.
 * @param {Map<string, number>} exact - Exact sparse field.
 * @param {OutgoingDirectionDiagnosticDomain} exactDomain - Exact stencils.
 * @returns {object} - Absolute and normalized residual measurements.
 */
function measure(candidate, candidateDomain, exact, exactDomain) {
	let valueCount = 0;
	let squaredResidualSum = 0;
	let squaredExactSum = 0;
	let maximumAbsolute = {value: -1, gridX: -1, gridY: -1, positionIndex: -1, channelIndex: -1};
	for (let queryIndex = 0; queryIndex < GRID_INDICES.length; queryIndex += 1) {
		for (const positionIndex of POSITION_INDICES) {
			for (const channelIndex of CHANNEL_INDICES) {
				const expected = sampleField(exact, exactDomain.queryStencil(queryIndex), positionIndex, channelIndex);
				const actual = sampleField(
					candidate,
					candidateDomain.queryStencil(queryIndex),
					positionIndex,
					channelIndex,
				);
				const residual = actual - expected;
				const absolute = Math.abs(residual);
				valueCount += 1;
				squaredResidualSum += residual * residual;
				squaredExactSum += expected * expected;
				if (absolute > maximumAbsolute.value) {
					maximumAbsolute = {value: absolute, ...GRID_INDICES[queryIndex], positionIndex, channelIndex};
				}
			}
		}
	}
	return {
		valueCount,
		absoluteRms: Math.sqrt(squaredResidualSum / valueCount),
		normalizedRms: Math.sqrt(squaredResidualSum / squaredExactSum),
		maximumAbsolute,
	};
}

/**
 * Call this function to compare exact J2 with increasingly dense outgoing cubed-sphere reconstruction.
 *
 * @param {{time: string, fittedAzimuthDegrees: number}} request - Benchmark Sun condition.
 * @returns {Promise<object>} - Angular-resolution report for one condition.
 */
export async function generateJ2AngularCondition(request) {
	if (!session) throw new Error('J2 angular GPU session must be initialized before generation.');
	const baseProfile = createBrunetonProductionProfile({...request, maximumScatteringOrder: 2});
	const algorithm = new Algorithm32({profile: baseProfile});
	try {
		const queryDirections = GRID_INDICES.map(({gridX, gridY}) =>
			baseProfile.models.geometry.expressScatteringCacheDirection({
				physicalOutgoingDirection: createViewDirection(gridX, gridY),
			}),
		);
		const exactDomain = new OutgoingDirectionDiagnosticDomain({
			id: `${request.time.replace(':', '')}-exact-${queryDirections.length}`,
			queryDirections,
		});
		console.log(`[B1 GPU progress] ${request.time} exact J2 started with ${exactDomain.directionCount} directions`);
		const exact = await buildJ2Field(baseProfile, exactDomain);
		const candidates = {};
		for (const faceWidth of FACE_WIDTHS) {
			const domain = new OutgoingDirectionDiagnosticDomain({
				id: `${request.time.replace(':', '')}-sparse-w${faceWidth}`,
				queryDirections,
				faceWidth,
			});
			console.log(
				`[B1 GPU progress] ${request.time} W${faceWidth} J2 started with ${domain.directionCount} touched directions`,
			);
			const candidate = await buildJ2Field(baseProfile, domain);
			candidates[`w${faceWidth}`] = {
				fullGridDirectionCount: 6 * faceWidth * faceWidth,
				touchedDirectionCount: domain.directionCount,
				durationMilliseconds: candidate.durationMilliseconds,
				...measure(candidate.values, domain, exact.values, exactDomain),
			};
		}
		return {
			time: request.time,
			queryGridIndices: GRID_INDICES,
			positionIndices: POSITION_INDICES,
			channelIndices: CHANNEL_INDICES,
			exactDirectionCount: exactDomain.directionCount,
			exactDurationMilliseconds: exact.durationMilliseconds,
			candidates,
		};
	} finally {
		algorithm.dispose();
	}
}

/**
 * Call this function to generate complete J2 view-path spectra for W27/W39/W55/W81.
 *
 * @param {{time: string, fittedAzimuthDegrees: number}} request - Benchmark Sun condition.
 * @returns {Promise<object>} - Candidate pure-J2 spectra and construction facts.
 */
export async function generateJ2AngularScoreCondition(request) {
	if (!session) throw new Error('J2 angular GPU session must be initialized before generation.');
	const baseProfile = createBrunetonProductionProfile({...request, maximumScatteringOrder: 2});
	const algorithm = new Algorithm32({profile: baseProfile});
	try {
		const queryDirections = [];
		for (let gridX = 0; gridX < 9; gridX += 1) {
			for (let gridY = 0; gridY < 9; gridY += 1) {
				queryDirections.push(
					baseProfile.models.geometry.expressScatteringCacheDirection({
						physicalOutgoingDirection: createViewDirection(gridX, gridY),
					}),
				);
			}
		}
		const candidates = {};
		for (const faceWidth of FACE_WIDTHS) {
			const domain = new OutgoingDirectionDiagnosticDomain({
				id: `${request.time.replace(':', '')}-score-sparse-w${faceWidth}`,
				queryDirections,
				faceWidth,
			});
			console.log(
				`[B1 GPU progress] ${request.time} W${faceWidth} complete J2 field started with ${domain.directionCount} touched directions`,
			);
			const field = await buildCompleteJ2Field(baseProfile, domain);
			candidates[`w${faceWidth}`] = {
				faceWidth,
				fullGridDirectionCount: 6 * faceWidth * faceWidth,
				touchedDirectionCount: domain.directionCount,
				durationMilliseconds: field.durationMilliseconds,
				values: integrateJ2ViewRays(baseProfile, domain, field),
			};
			console.log(`[B1 GPU progress] ${request.time} W${faceWidth} complete J2 view integration complete`);
		}
		return {time: request.time, candidates};
	} finally {
		algorithm.dispose();
	}
}
