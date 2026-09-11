import * as THREE from '../../../../../../node_modules/three/build/three.module.js';
import {CacheGpuExecutor} from '../../../../gpu-cache-runtime/CacheGpuExecutor.js';
import {CacheValues} from '../../../../gpu-cache-runtime/CacheValues.js';
import DistanceMath from '../../../../math/DistanceMath.js';
import {CacheBuildModules} from '../../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CachePassAssembler} from '../../../../shader-assembly/cache-pass/CachePassAssembler.js';
import {createNativeExecutionProfile} from '../../../../profiles/index.js';
import {CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER} from '../../../../sampling-domains/direction/cubed-sphere/consts.js';
import {ThreeCacheBackend} from '../../../three-cache-backend/ThreeCacheBackend.js';
import {LOCAL_SUN_TRANSPORT_INTERVAL_COUNT} from '../../consts.js';
import {LocalSunCacheController} from '../LocalSunCacheController.js';
import {LocalSunCacheSource} from '../LocalSunCacheSource.js';
import LocalSunConstructionDomainSelection from '../LocalSunConstructionDomainSelection.js';
import {LocalSunShellFactCache} from '../LocalSunShellFactCache.js';
import {
	createDefaultAuthorityOwners,
	createDefaultAuthorityProbeCoordinates,
	createSealedAuthorityDomainSelection,
} from './local-sun-gpu-transport-authority.js';

const FIXTURE_ROOT = '/base/src/algorithm32/implementation/local-sun/cache/fixtures';
const ABSOLUTE_RADIANCE_TOLERANCE = 2e-9;
const RELATIVE_RADIANCE_TOLERANCE = 0.005;
const POLICY_SHA256 = '4fe5c88cc8f23ea3e20acbc85533a3a3e17e230a395fb1533df88d4e60364543';
const INDEXED_R32F_SNAPSHOT_SHA256 = '59ee2ac971d0e1cac07ceb14cb47f5daa8badb07640ede2981e276f264002119';
const MANUFACTURED_CONSTANT_SEED = 0.125;
const MANUFACTURED_INDEX_SCALE = 1 / 4096;

/**
 * Called by the fused transport browser proof to read one immutable fixture.
 *
 * @param {string} name - The fixture filename.
 * @returns {Promise<string>} - The exact fixture text.
 */
async function readFixtureText(name) {
	const response = await fetch(`${FIXTURE_ROOT}/${name}`, {cache: 'no-store'});
	if (!response.ok) {
		throw new Error(`Unable to read ${name}: ${response.status}.`);
	}
	return response.text();
}

/**
 * Called by the fused transport browser proof to hash exact fixture text.
 *
 * @param {string} value - The exact text to hash.
 * @returns {Promise<string>} - The lowercase SHA-256 hexadecimal digest.
 */
async function sha256Text(value) {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Called by residual reporting to select the nearest-rank p95 value.
 *
 * @param {readonly number[]} values - The observed residuals.
 * @returns {number} - The nearest-rank p95 value.
 */
function p95(values) {
	const ordered = [...values].sort((left, right) => left - right);
	return ordered[Math.max(0, Math.ceil(0.95 * ordered.length) - 1)];
}

/**
 * Called by residual reporting to compare nonnegative scalar values in R32F
 * representable-value units.
 *
 * @param {number} left - The first scalar.
 * @param {number} right - The second scalar.
 * @returns {number} - The absolute Float32 encoding distance.
 */
function float32UlpDistance(left, right) {
	const buffer = new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT);
	const floats = new Float32Array(buffer);
	const integers = new Uint32Array(buffer);
	floats[0] = left;
	const leftBits = integers[0];
	floats[0] = right;
	return Math.abs(leftBits - integers[0]);
}

/**
 * Called by the fused transport browser proof to compare one selected field
 * with one frozen authority under the declared R32F radiance bound.
 *
 * @param {string} label - The comparison identity.
 * @param {readonly LocalSunGpuTransportProbeSample[]} actual - The candidate samples.
 * @param {readonly LocalSunGpuTransportProbeSample[]} authority - The frozen samples.
 * @returns {LocalSunGpuTransportResidualSummary} - The residual summary.
 */
function compareSelectedRadiance(label, actual, authority) {
	expect(actual).toHaveSize(authority.length);
	const absoluteResiduals = [];
	const relativeResiduals = [];
	const ulpResiduals = [];

	for (let index = 0; index < authority.length; index += 1) {
		const candidate = actual[index];
		const expected = authority[index];
		expect(candidate.coordinates).toEqual(expected.coordinates);
		expect(Number.isFinite(candidate.value)).toBeTrue();
		expect(candidate.value).toBeGreaterThanOrEqual(0);
		const absoluteResidual = Math.abs(candidate.value - expected.value);
		const relativeResidual = expected.value === 0 ? 0 : absoluteResidual / Math.abs(expected.value);
		absoluteResiduals.push(absoluteResidual);
		relativeResiduals.push(relativeResidual);
		ulpResiduals.push(float32UlpDistance(candidate.value, expected.value));
		expect(absoluteResidual)
			.withContext(`${label} sample ${index}`)
			.toBeLessThanOrEqual(ABSOLUTE_RADIANCE_TOLERANCE + RELATIVE_RADIANCE_TOLERANCE * Math.abs(expected.value));
	}

	return {
		label,
		maximumAbsoluteResidual: Math.max(...absoluteResiduals),
		p95AbsoluteResidual: p95(absoluteResiduals),
		maximumRelativeResidual: Math.max(...relativeResiduals),
		p95RelativeResidual: p95(relativeResiduals),
		maximumUlpResidual: Math.max(...ulpResiduals),
		p95UlpResidual: p95(ulpResiduals),
	};
}

/**
 * Called by the fused transport browser proof to report the observed WebGL2
 * implementation without turning diagnostics into a quality selector.
 *
 * @param {WebGL2RenderingContext} context - The active WebGL2 context.
 * @returns {Readonly<Record<string, unknown>>} - The observed GPU facts.
 */
function describeGpu(context) {
	const debug = context.getExtension('WEBGL_debug_renderer_info');
	return {
		version: context.getParameter(context.VERSION),
		shadingLanguageVersion: context.getParameter(context.SHADING_LANGUAGE_VERSION),
		vendor: debug ? context.getParameter(debug.UNMASKED_VENDOR_WEBGL) : context.getParameter(context.VENDOR),
		renderer: debug ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER),
		maximumArrayLayers: context.getParameter(context.MAX_ARRAY_TEXTURE_LAYERS),
		maximumTextureSize: context.getParameter(context.MAX_TEXTURE_SIZE),
		extColorBufferFloat: context.getExtension('EXT_color_buffer_float') !== null,
	};
}

/**
 * Called by the manufactured transport proof to drain every pending WebGL
 * error before or after its draws.
 *
 * @param {WebGL2RenderingContext} context - The active WebGL2 context.
 * @returns {number[]} - The drained WebGL error codes.
 */
function drainWebGlErrors(context) {
	const errors = [];
	for (;;) {
		const error = context.getError();
		if (error === context.NO_ERROR) {
			return errors;
		}
		errors.push(error);
	}
}

/**
 * Called by the manufactured transport proof to create its complete bounded
 * z2/rho2, paired-plus-rotated-Fibonacci-68, W3, native-15 domain.
 *
 * @param {FlatEarthGeometry} geometry - The configured Flat geometry.
 * @returns {LocalSunConstructionDomainSelection} - The bounded executable domains.
 */
function createManufacturedDomainSelection(geometry) {
	return LocalSunConstructionDomainSelection.fromGeometry(geometry, {
		id: 'local-sun-manufactured-z2-rho2-paired-rotated-f68-w3',
		zCount: 2,
		rhoCount: 2,
		outgoingDirectionDomainOwner: CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
		radiancePackingId: 'local-sun-manufactured-z2-rho2-paired-rotated-f68-radiance',
		scatteringDensityPackingId: 'local-sun-manufactured-z2-rho2-w3-density',
	});
}

/**
 * Called by the fused transport browser proof to retain its selected domains
 * and physical owners in the same aggregate-model contract used by production.
 *
 * @param {{atmosphere: CanonicalAtmosphere, geometry: FlatEarthGeometry, lightSource: LocalSunLightSource}} owners - The proof's physical owners.
 * @param {LocalSunConstructionDomainSelection} domains - The proof's executable domains.
 * @returns {SharedModel} - The aggregate execution-model double.
 */
function createExecutionModel(owners, domains) {
	return /** @type {SharedModel} */ (
		/** @type {unknown} */ ({
			lightSource: owners.lightSource,
			atmosphere: owners.atmosphere,
			geometry: owners.geometry,
			groundBoundary: null,
			profile: createNativeExecutionProfile({
				lightSource: owners.lightSource,
				atmosphere: owners.atmosphere,
				geometry: owners.geometry,
				groundBoundary: null,
				observation: owners.geometry.configuration.observation,
				domains: {
					positions: domains.positionDomain,
					incomingDirections: domains.incomingDirectionDomain,
					outgoingDirections: domains.outgoingDirectionDomain,
				},
				execution: {maximumScatteringOrder: 4},
			}),
		})
	);
}

/**
 * Called by the manufactured transport proof to select every bounded L2
 * scalar across position, incoming-direction, and wavelength axes.
 *
 * @param {LocalSunConstructionDomainSelection} domains - The bounded executable domains.
 * @returns {readonly DirectionalSpectralFieldCoordinates[]} - Every bounded radiance address.
 */
function createManufacturedOutputCoordinates(domains) {
	return Array.from({length: domains.positionCount}, (_positionValue, positionIndex) =>
		Array.from({length: domains.incomingDirectionCount}, (_directionValue, directionIndex) =>
			Array.from({length: domains.spectralChannelCount}, (_wavelengthValue, wavelengthIndex) => ({
				directionIndex,
				positionIndex,
				wavelengthIndex,
			})),
		).flat(),
	).flat();
}

/**
 * Called by the manufactured transport proof to create an exactly
 * representable constant scattering-density seed operation.
 *
 * @returns {CacheBuildModule} - The test-only constant seed module.
 */
function createConstantSeedModule() {
	return CacheBuildModules.createBuildModule({
		id: 'algorithm32-local-sun-manufactured-constant-j-seed-v1',
		owner: 'cache',
		provides: ['cache.operation.manufacturedSeed'],
		requires: [],
		blocks: [
			{
				id: 'local-sun-manufactured-constant-j-seed-main',
				phase: 'main',
				order: 100,
				source: `a32CacheOutput = ${MANUFACTURED_CONSTANT_SEED};`,
			},
		],
		bindings: [],
	});
}

/**
 * Called by the manufactured transport proof to create an index-coded seed
 * operation whose stored values are reproduced exactly with Math.fround.
 *
 * @param {CacheFieldSpec} output - The manufactured scattering-density field.
 * @returns {CacheBuildModule} - The test-only index-coded seed module.
 */
function createIndexCodedSeedModule(output) {
	return CacheBuildModules.createBuildModule({
		id: 'algorithm32-local-sun-manufactured-index-coded-j-seed-v1',
		owner: 'cache',
		provides: ['cache.operation.manufacturedSeed'],
		requires: [],
		blocks: [
			{
				id: 'local-sun-manufactured-index-coded-j-seed-main',
				phase: 'main',
				order: 100,
				source: `int directionIndex = int(gl_FragCoord.x);
int positionIndex = int(gl_FragCoord.y);
int scalarIndex = directionIndex + CACHE_DIRECTION_COUNT
	* (positionIndex + CACHE_POSITION_COUNT * a32CacheWavelengthLayer);
a32CacheOutput = float(scalarIndex + 1) * ${MANUFACTURED_INDEX_SCALE};`,
			},
		],
		bindings: [
			{
				spec: {
					id: 'manufactured-seed-direction-count',
					name: 'CACHE_DIRECTION_COUNT',
					kind: 'define',
					shaderType: 'int',
					frequency: 'pass',
				},
				value: output.storage.width,
			},
			{
				spec: {
					id: 'manufactured-seed-position-count',
					name: 'CACHE_POSITION_COUNT',
					kind: 'define',
					shaderType: 'int',
					frequency: 'pass',
				},
				value: output.storage.height,
			},
		],
	});
}

/**
 * Called by the analytic manufactured transport proof to replace canonical
 * extinction without adding a production atmosphere mode.
 *
 * @returns {CacheBuildModule} - The test-only zero-extinction atmosphere module.
 */
function createZeroExtinctionModule() {
	return CacheBuildModules.createBuildModule({
		id: 'algorithm32-local-sun-manufactured-zero-extinction-v1',
		owner: 'atmosphere',
		provides: ['atmosphere.medium'],
		requires: ['geometry.cachePosition'],
		blocks: [
			{
				id: 'local-sun-manufactured-zero-extinction-function',
				phase: 'function',
				order: 0,
				source: `float cacheExtinction(
	vec3 _samplePositionMeters,
	int _wavelengthIndex
) {
	return 0.0;
}`,
			},
		],
		bindings: [],
	});
}

/**
 * Called by the manufactured proof to reduce the production graph to one GPU
 * seed pass followed by the unchanged fused J2-to-L2 transport pass.
 *
 * @param {LocalSunCachePlan} productionPlan - The source-owned production graph.
 * @param {CacheBuildModule} seedModule - The test-only J-field producer.
 * @param {CacheBuildModule | null} atmosphereReplacement - The optional test-only atmosphere module.
 * @returns {CacheBuildPlan} - The complete test-only two-pass plan.
 */
function createManufacturedTransportPlan(productionPlan, seedModule, atmosphereReplacement) {
	const seedField = productionPlan.fields.find(({id}) => id === 'local-sun-j2');
	const transportField = productionPlan.fields.find(({id}) => id === 'local-sun-l2');
	const productionTransport = productionPlan.passes.find(({id}) => id === 'local-sun-transport-j2-to-l2');
	if (!seedField || !transportField || !productionTransport) {
		throw new Error('The production local-Sun N4 graph does not expose the J2-to-L2 transport boundary.');
	}

	const transportModules = productionTransport.modules.map((module) =>
		atmosphereReplacement !== null && module.owner === 'atmosphere' ? atmosphereReplacement : module,
	);
	if (atmosphereReplacement !== null && !productionTransport.modules.some(({owner}) => owner === 'atmosphere')) {
		throw new Error('The fused production transport pass has no atmosphere module to replace.');
	}

	const passes = [
		{
			id: `${seedModule.id}-pass`,
			kind: /** @type {const} */ ('primary-j1'),
			order: /** @type {const} */ (2),
			inputs: [],
			output: seedField.id,
			modules: [seedModule],
		},
		{
			...productionTransport,
			modules: transportModules,
		},
	];
	for (const pass of passes) {
		const provided = new Set(pass.modules.flatMap(({provides}) => provides));
		for (const module of pass.modules) {
			for (const requirement of module.requires) {
				if (!provided.has(requirement)) {
					throw new Error(`Manufactured pass ${pass.id} does not provide ${requirement}.`);
				}
			}
		}
	}
	const fields = [seedField, transportField];
	return {
		identity: CacheValues.createPlanIdentity(
			`algorithm32-local-sun-manufactured-transport-${seedModule.contentHash}`,
			fields,
			passes,
			{
				productionPlan: productionPlan.identity.contentHash,
				atmosphereReplacement: atmosphereReplacement?.contentHash ?? null,
			},
		),
		fields,
		passes,
		result: transportField.id,
	};
}

/**
 * Called by the manufactured proof to resolve the CPU construction ray for
 * one selected radiance coordinate.
 *
 * @param {FlatEarthGeometry} geometry - The configured Flat geometry.
 * @param {LocalSunConstructionDomainSelection} domains - The selected executable domains.
 * @param {DirectionalSpectralFieldCoordinates} coordinate - The selected radiance coordinate.
 * @returns {RaySegment} - The geometry-owned finite transport ray.
 */
function resolveManufacturedTransportRay(geometry, domains, coordinate) {
	const positionNode = domains.positionNodes[coordinate.positionIndex];
	const metadata = /** @type {FlatLocalCachePositionNodeMetadata} */ (positionNode.metadata);
	const incomingDirection = geometry.expressPhysicalScatteringCacheDirection({
		position: metadata.position,
		cacheDirection: domains.incomingUnitVectors[coordinate.directionIndex],
	});
	return geometry.resolveCacheBuildRay({
		coordinateKey: `manufactured:${coordinate.positionIndex}:${coordinate.directionIndex}`,
		coordinates: [coordinate.positionIndex, coordinate.directionIndex],
		zBinIndex: metadata.zIndex,
		rhoBinIndex: metadata.rhoIndex,
		altitude: metadata.z,
		rho: metadata.rho,
		incomingDirection,
		directionIndex: coordinate.directionIndex,
		metadata: {
			position: metadata.position,
			positionIndex: coordinate.positionIndex,
		},
	});
}

/**
 * Called by the index-coded seed proof to reproduce one exact R32F seed.
 *
 * @param {DirectionalSpectralFieldCoordinates} coordinate - The scattering-density coordinate.
 * @param {CacheFieldStorage} storage - The manufactured field storage.
 * @returns {number} - The exact expected R32F scalar.
 */
function indexCodedSeedValue(coordinate, storage) {
	const scalarIndex =
		coordinate.directionIndex +
		storage.width * (coordinate.positionIndex + storage.height * coordinate.wavelengthIndex);
	return Math.fround((scalarIndex + 1) * MANUFACTURED_INDEX_SCALE);
}

/**
 * Called by seed readback to select addresses spanning every field axis.
 *
 * @param {CacheFieldStorage} storage - The manufactured field storage.
 * @returns {readonly DirectionalSpectralFieldCoordinates[]} - The selected seed addresses.
 */
function createManufacturedSeedProbeCoordinates(storage) {
	return [
		{directionIndex: 0, positionIndex: 0, wavelengthIndex: 0},
		{directionIndex: storage.width - 1, positionIndex: 0, wavelengthIndex: 0},
		{directionIndex: 0, positionIndex: storage.height - 1, wavelengthIndex: 0},
		{directionIndex: 0, positionIndex: 0, wavelengthIndex: storage.layers - 1},
		{
			directionIndex: Math.floor(storage.width / 2),
			positionIndex: Math.floor(storage.height / 2),
			wavelengthIndex: Math.floor(storage.layers / 2),
		},
		{
			directionIndex: storage.width - 1,
			positionIndex: storage.height - 1,
			wavelengthIndex: storage.layers - 1,
		},
	];
}

/**
 * Called by the constant-field proof to derive the analytic zero-extinction
 * result L = J times resolved ray length.
 *
 * @param {readonly DirectionalSpectralFieldCoordinates[]} coordinates - The selected radiance addresses.
 * @param {FlatEarthGeometry} geometry - The configured Flat geometry.
 * @param {LocalSunConstructionDomainSelection} domains - The selected executable domains.
 * @returns {readonly LocalSunGpuTransportProbeSample[]} - The analytic radiance values.
 */
function createConstantTransportAuthority(coordinates, geometry, domains) {
	return coordinates.map((coordinate) => {
		const ray = resolveManufacturedTransportRay(geometry, domains, coordinate);
		const rayLengthMeters = DistanceMath.toMeters(ray.endDistance) - DistanceMath.toMeters(ray.startDistance);
		return {
			coordinates: coordinate,
			value: MANUFACTURED_CONSTANT_SEED * rayLengthMeters,
		};
	});
}

/**
 * Called by the index-coded proof to evaluate selected canonical-extinction
 * transport queries without constructing any secondary-scattering field.
 *
 * @param {readonly DirectionalSpectralFieldCoordinates[]} coordinates - The selected radiance addresses.
 * @param {FlatEarthGeometry} geometry - The configured Flat geometry.
 * @param {CanonicalAtmosphere} atmosphere - The canonical atmosphere.
 * @param {LocalSunConstructionDomainSelection} domains - The selected executable domains.
 * @param {CacheFieldStorage} seedStorage - The manufactured J-field storage.
 * @returns {readonly LocalSunGpuTransportProbeSample[]} - The selected CPU transport values.
 */
function createIndexCodedTransportAuthority(coordinates, geometry, atmosphere, domains, seedStorage) {
	return coordinates.map((coordinate) => {
		const ray = resolveManufacturedTransportRay(geometry, domains, coordinate);
		const intervalLengthMeters =
			(DistanceMath.toMeters(ray.endDistance) - DistanceMath.toMeters(ray.startDistance)) /
			LOCAL_SUN_TRANSPORT_INTERVAL_COUNT;
		const rayMetadata = ray.metadata;
		const endsOnGround =
			typeof rayMetadata === 'object' &&
			rayMetadata !== null &&
			'terminatedByGround' in rayMetadata &&
			rayMetadata.terminatedByGround === true;
		let transmittance = 1;
		let previousExtinction = 0;
		let radiance = 0;

		for (let pointIndex = 0; pointIndex <= LOCAL_SUN_TRANSPORT_INTERVAL_COUNT; pointIndex += 1) {
			let samplePosition = DistanceMath.positionAlongRay(
				ray.ray.origin,
				ray.ray.direction,
				intervalLengthMeters * pointIndex,
			);
			if (pointIndex === LOCAL_SUN_TRANSPORT_INTERVAL_COUNT && endsOnGround) {
				samplePosition = DistanceMath.positionInMeters([
					samplePosition.coordinates[0],
					samplePosition.coordinates[1],
					0,
				]);
			}
			const atmosphereCoordinate = geometry.resolveAtmosphereCoordinate(samplePosition);
			const extinction =
				atmosphere.sampleMedium(atmosphereCoordinate).extinction.values[coordinate.wavelengthIndex];
			if (pointIndex > 0) {
				transmittance *= Math.exp(-0.5 * (previousExtinction + extinction) * intervalLengthMeters);
			}
			const positionStencil = geometry.resolveScatteringCacheConstructionPositionStencil({
				position: samplePosition,
				atmosphereCoordinate,
				positionAxes: domains,
			});
			const directionStencil = domains.resolveOutgoingDirectionStencil(
				geometry.expressScatteringCacheDirection({
					position: samplePosition,
					physicalOutgoingDirection: ray.ray.direction,
				}),
			);
			let density = 0;
			for (let positionTapIndex = 0; positionTapIndex < positionStencil.indices.length; positionTapIndex += 1) {
				for (
					let directionTapIndex = 0;
					directionTapIndex < directionStencil.indices.length;
					directionTapIndex += 1
				) {
					density +=
						indexCodedSeedValue(
							{
								directionIndex: directionStencil.indices[directionTapIndex],
								positionIndex: positionStencil.indices[positionTapIndex],
								wavelengthIndex: coordinate.wavelengthIndex,
							},
							seedStorage,
						) *
						positionStencil.weights[positionTapIndex] *
						directionStencil.weights[directionTapIndex];
				}
			}
			const measureMeters =
				intervalLengthMeters *
				(pointIndex === 0 || pointIndex === LOCAL_SUN_TRANSPORT_INTERVAL_COUNT ? 0.5 : 1);
			radiance += transmittance * density * measureMeters;
			previousExtinction = extinction;
		}

		return {coordinates: coordinate, value: radiance};
	});
}

/**
 * Called by manufactured comparisons to require one completed pass probe.
 *
 * @param {CacheBuildArtifact} artifact - The completed two-pass artifact.
 * @param {string} passId - The pass whose selected samples are required.
 * @returns {readonly CacheProbeSample[]} - The selected pass samples.
 */
function requirePassProbeSamples(artifact, passId) {
	const samples = artifact.diagnostics.passes.find(({id}) => id === passId)?.probe?.samples;
	if (!samples) {
		throw new Error(`Cache pass ${passId} did not produce its declared probe.`);
	}
	return samples;
}

describe('local-Sun fused GPU transport', /** Called by Jasmine to register the named suite. */ () => {
	it('passes the manufactured transport micro-gate without secondary scattering', async () => {
		const canvas = document.createElement('canvas');
		canvas.width = 4;
		canvas.height = 4;
		document.body.appendChild(canvas);
		const context = canvas.getContext('webgl2', {
			alpha: false,
			antialias: false,
			depth: false,
			preserveDrawingBuffer: true,
			stencil: false,
		});
		if (!context) {
			canvas.remove();
			throw new Error('Manufactured local-Sun transport requires WebGL2.');
		}

		/** @type {THREE.WebGLRenderer | null} */
		let renderer = null;
		/** @type {ThreeCacheBackend | null} */
		let backend = null;
		/** @type {LocalSunCacheController | null} */
		let controller = null;
		/** @type {CacheGpuExecutor | null} */
		let executor = null;
		try {
			renderer = new THREE.WebGLRenderer({canvas, context});
			renderer.debug.checkShaderErrors = true;
			renderer.setSize(4, 4, false);
			drainWebGlErrors(context);
			backend = new ThreeCacheBackend({THREE, renderer});
			const owners = createDefaultAuthorityOwners();
			const {geometry, lightSource} = owners;
			const source = new LocalSunCacheSource({
				source: lightSource,
				shellFactCache: new LocalSunShellFactCache({
					sourceConfiguration: lightSource.configuration,
				}),
			});
			const domains = createManufacturedDomainSelection(geometry);
			controller = new LocalSunCacheController({model: createExecutionModel(owners, domains), source, backend});
			executor = new CacheGpuExecutor({
				backend,
				assembler: new CachePassAssembler(),
			});
			const productionPlan = controller.createBuildPlan();
			const seedField = productionPlan.fields.find(({id}) => id === 'local-sun-j2');
			if (!seedField) {
				throw new Error('The production local-Sun N4 graph does not expose J2 storage.');
			}
			expect(seedField.storage).toEqual({format: 'R32F', width: 54, height: 4, layers: 15});
			const seedScalarCount = seedField.storage.width * seedField.storage.height * seedField.storage.layers;
			expect(seedScalarCount).toBe(3240);
			const indexCodedValues = new Set();
			for (let linearIndex = 0; linearIndex < seedScalarCount; linearIndex += 1) {
				indexCodedValues.add(Math.fround((linearIndex + 1) * MANUFACTURED_INDEX_SCALE));
			}
			expect(indexCodedValues.size).toBe(seedScalarCount);
			const outputCoordinates = createManufacturedOutputCoordinates(domains);
			expect(outputCoordinates).toHaveSize(4080);
			const seedCoordinates = createManufacturedSeedProbeCoordinates(seedField.storage);
			let yieldCount = 0;
			const executionOptions = {
				probeReader: backend,
				probes: [
					{field: seedField.id, coordinates: seedCoordinates},
					{field: 'local-sun-l2', coordinates: outputCoordinates},
				],
				scheduler: {
					async yieldControl() {
						yieldCount += 1;
						await new Promise((resolve) => setTimeout(resolve, 0));
					},
				},
			};
			const residuals = [];

			console.info('MANUFACTURED_TRANSPORT_PHASE=constant-zero-extinction-start');
			const constantSeedModule = createConstantSeedModule();
			const constantPlan = createManufacturedTransportPlan(
				productionPlan,
				constantSeedModule,
				createZeroExtinctionModule(),
			);
			const constantArtifact = await executor.execute(constantPlan, executionOptions);
			try {
				const seedSamples = requirePassProbeSamples(constantArtifact, `${constantSeedModule.id}-pass`);
				expect(seedSamples).toHaveSize(seedCoordinates.length);
				for (let index = 0; index < seedSamples.length; index += 1) {
					expect(seedSamples[index].coordinates).toEqual(seedCoordinates[index]);
					expect(seedSamples[index].value)
						.withContext(`constant seed sample ${index}`)
						.toBe(MANUFACTURED_CONSTANT_SEED);
				}
				residuals.push(
					compareSelectedRadiance(
						'manufactured constant J with zero extinction',
						requirePassProbeSamples(constantArtifact, 'local-sun-transport-j2-to-l2'),
						createConstantTransportAuthority(outputCoordinates, geometry, domains),
					),
				);
			} finally {
				constantArtifact.dispose();
			}

			console.info('MANUFACTURED_TRANSPORT_PHASE=index-coded-canonical-extinction-start');
			const indexCodedSeedModule = createIndexCodedSeedModule(seedField);
			const indexCodedPlan = createManufacturedTransportPlan(productionPlan, indexCodedSeedModule, null);
			const indexCodedAuthority = createIndexCodedTransportAuthority(
				outputCoordinates,
				geometry,
				owners.atmosphere,
				domains,
				seedField.storage,
			);
			const indexCodedArtifact = await executor.execute(indexCodedPlan, executionOptions);
			try {
				const seedSamples = requirePassProbeSamples(indexCodedArtifact, `${indexCodedSeedModule.id}-pass`);
				expect(seedSamples).toHaveSize(seedCoordinates.length);
				for (let index = 0; index < seedSamples.length; index += 1) {
					expect(seedSamples[index].coordinates).toEqual(seedCoordinates[index]);
					expect(seedSamples[index].value)
						.withContext(`index-coded seed sample ${index}`)
						.toBe(indexCodedSeedValue(seedCoordinates[index], seedField.storage));
				}
				residuals.push(
					compareSelectedRadiance(
						'manufactured index-coded J with canonical extinction',
						requirePassProbeSamples(indexCodedArtifact, 'local-sun-transport-j2-to-l2'),
						indexCodedAuthority,
					),
				);
			} finally {
				indexCodedArtifact.dispose();
			}

			expect(drainWebGlErrors(context)).toEqual([]);
			expect(
				renderer.info.programs.every(
					/**
					 * Called by the manufactured transport proof to reject a failed shader program.
					 * @param program - The renderer program diagnostic.
					 * @returns - Whether the program remained runnable.
					 */ (program) => program.diagnostics?.runnable !== false,
				),
			).toBeTrue();
			console.info(
				`MANUFACTURED_TRANSPORT_RESULT=${JSON.stringify({
					gpu: describeGpu(context),
					outputSampleCount: outputCoordinates.length,
					seedSampleCount: seedCoordinates.length,
					yieldCount,
					residuals,
				})}`,
			);
		} finally {
			executor?.dispose();
			controller?.dispose();
			backend?.dispose();
			renderer?.dispose();
			renderer?.forceContextLoss();
			canvas.remove();
		}
	});

	it('executes the sealed paired-Fibonacci-34 N4 graph and matches both frozen authorities', async () => {
		const canvas = document.createElement('canvas');
		canvas.width = 4;
		canvas.height = 4;
		document.body.appendChild(canvas);
		const context = canvas.getContext('webgl2', {
			alpha: false,
			antialias: false,
			depth: false,
			preserveDrawingBuffer: true,
			stencil: false,
		});
		if (!context) {
			canvas.remove();
			throw new Error('Fused local-Sun transport requires WebGL2.');
		}

		/** @type {THREE.WebGLRenderer | null} */
		let renderer = null;
		/** @type {ThreeCacheBackend | null} */
		let backend = null;
		/** @type {LocalSunCacheController | null} */
		let controller = null;
		/** @type {CacheGpuExecutor | null} */
		let executor = null;
		try {
			renderer = new THREE.WebGLRenderer({canvas, context});
			renderer.debug.checkShaderErrors = true;
			renderer.setSize(4, 4, false);
			backend = new ThreeCacheBackend({THREE, renderer});
			const owners = createDefaultAuthorityOwners();
			const {geometry, lightSource} = owners;
			const source = new LocalSunCacheSource({
				source: lightSource,
				shellFactCache: new LocalSunShellFactCache({
					sourceConfiguration: lightSource.configuration,
				}),
			});
			const domains = createSealedAuthorityDomainSelection(geometry);
			controller = new LocalSunCacheController({model: createExecutionModel(owners, domains), source, backend});
			executor = new CacheGpuExecutor({
				backend,
				assembler: new CachePassAssembler(),
			});
			const coordinates = createDefaultAuthorityProbeCoordinates();
			let yieldCount = 0;

			console.info('FUSED_TRANSPORT_PHASE=plan-start');
			const plan = controller.createBuildPlan();
			console.info('FUSED_TRANSPORT_PHASE=plan-complete');
			expect(plan.resources.packedTransportData).toEqual({
				value: 0,
				units: 'bytes',
			});

			const startedAt = performance.now();
			const artifact = await executor.execute(plan, {
				probeReader: backend,
				probes: [
					{field: 'local-sun-l2', coordinates},
					{field: 'local-sun-l3', coordinates},
				],
				scheduler: {
					async yieldControl() {
						yieldCount += 1;
						if (yieldCount % 15 === 0) {
							console.info(`FUSED_TRANSPORT_YIELDS=${yieldCount}`);
						}
						await new Promise((resolve) => setTimeout(resolve, 0));
					},
				},
			});
			const executionDuration = performance.now() - startedAt;

			try {
				const l2 = artifact.diagnostics.passes.find(({id}) => id === 'local-sun-transport-j2-to-l2')?.probe
					?.samples;
				const l3 = artifact.diagnostics.passes.find(({id}) => id === 'local-sun-transport-j3-to-l3')?.probe
					?.samples;
				expect(l2).toHaveSize(960);
				expect(l3).toHaveSize(960);

				const policyText = await readFixtureText('local-sun-gpu-transport-offload-policy.json');
				expect(await sha256Text(policyText)).toBe(POLICY_SHA256);
				const policy = JSON.parse(policyText);
				expect(policy.status).toBe('sealed');
				expect(policy.defaultProfile).toEqual({
					maximumScatteringOrder: 4,
					positionDomain: 'z19-rho15',
					incomingDirectionDomain: 'paired-fibonacci-34',
					outgoingDirectionDomain: 'w27',
					spectralBasis: 'native-15',
					transportIntervalCount: 15,
				});
				const [cpuText, indexedText] = await Promise.all([
					readFixtureText(policy.authority.cpuSnapshot),
					readFixtureText(policy.authority.packedR32fSnapshot),
				]);
				expect(await sha256Text(cpuText)).toBe(policy.authority.cpuSnapshotSha256);
				expect(await sha256Text(indexedText)).toBe(INDEXED_R32F_SNAPSHOT_SHA256);
				const cpu = /** @type {LocalSunGpuTransportSnapshot} */ (JSON.parse(cpuText));
				const indexed = /** @type {LocalSunGpuTransportSnapshot} */ (JSON.parse(indexedText));
				expect(cpu.id).toBe('algorithm32-local-sun-gpu-transport-cpu-authority-v2');
				expect(indexed.id).toBe('algorithm32-local-sun-gpu-transport-indexed-r32f-v2');
				const residuals = [
					compareSelectedRadiance('L2 versus binary64 CPU', l2, cpu.l2),
					compareSelectedRadiance('L3 versus binary64 CPU', l3, cpu.l3),
					compareSelectedRadiance('L2 versus indexed R32F', l2, indexed.l2),
					compareSelectedRadiance('L3 versus indexed R32F', l3, indexed.l3),
				];

				console.info(
					`FUSED_TRANSPORT_RESULT=${JSON.stringify({
						gpu: describeGpu(context),
						executionDuration,
						yieldCount,
						memory: artifact.diagnostics.memory,
						residuals,
					})}`,
				);
			} finally {
				artifact.dispose();
			}
		} finally {
			executor?.dispose();
			controller?.dispose();
			backend?.dispose();
			renderer?.dispose();
			renderer?.forceContextLoss();
			canvas.remove();
		}
	});
});
