import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

import {Algorithm32} from '../candidate/src/algorithm32/Algorithm32.js';
import {CanonicalAtmosphere} from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import {CUMULATIVE_SCATTERING_CACHE_VALUE_KEY} from '../candidate/src/algorithm32/caches/gpu/cacheRuntimeContracts.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
	FIGURE1_DISPLAY_CONSTANTS,
} from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import {BrunetonColorDisplayModel} from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import {
	CUBED_SPHERE_W27_DIRECTION_COUNT,
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	CUBED_SPHERE_W27_FACES,
	CUBED_SPHERE_W27_UNIT_VECTORS,
	flattenCubedSphereW27NodeIndex,
	unflattenCubedSphereW27NodeIndex,
} from '../candidate/src/algorithm32/domains/CubedSphereW27DirectionDomain.js';
import {SphericalEarthGeometry} from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import {DistantSunLightSource} from '../candidate/src/algorithm32/light-sources/DistantSunLightSource.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	SpectralPacket,
} from '../candidate/src/algorithm32/quantities/index.js';
import {Algorithm32ShaderAssembler} from '../candidate/src/algorithm32/shader/Algorithm32ShaderAssembler.js';
import {
	createShaderContribution,
	createShaderSourceBlock,
	createShaderTextureDescriptor,
	createShaderUniformDescriptor,
} from '../candidate/src/algorithm32/shader/shaderContribution.js';
import {ThreeCacheBackend} from '../candidate/src/algorithm32/three/ThreeCacheBackend.js';
import {
	auditCubedSphereW27Field,
	createCubedSphereW27RepresentativeAxisSelection,
	describeCubedSphereW27DirectionStencil,
	planCubedSphereW27GpuFieldReadback,
} from './cubed-sphere-w27-seam-audit.js';
import {RolledW27SphericalEarthGeometry} from './RolledW27SphericalEarthGeometry.js';

const TRACE_DIRECTION_VALUE_KEY = 'diagnostic.horizonTraceDirections';
const TRACE_OUTPUT_CHANNEL_VALUE_KEY = 'diagnostic.horizonTraceOutputChannel';
const TRACE_DIRECTION_UNIFORM_NAME = 'uHorizonTraceDirections';
const TRACE_OUTPUT_CHANNEL_UNIFORM_NAME = 'uHorizonTraceOutputChannel';
const SUN_ANGULAR_RADIUS_RADIANS = 0.004675;
const FULLSCREEN_VERTEX_SHADER = `
precision highp float;
in vec3 position;
out vec2 vUv;
void main() {
	vUv = position.xy * 0.5 + 0.5;
	gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function fnv1a32(source) {
	let hash = 0x811c9dc5;
	for (const value of new TextEncoder().encode(source)) {
		hash ^= value;
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return `fnv1a32:${hash.toString(16).padStart(8, '0')}`;
}

function cacheBindingIdentity(binding) {
	const value = binding.value;
	return {
		spec: binding.spec,
		value: value && typeof value === 'object' && typeof value.contentHash === 'string'
			? {id: value.id ?? null, contentHash: value.contentHash}
			: value,
	};
}

function cacheModuleSemanticSource(module) {
	return JSON.stringify({
		owner: module.owner,
		provides: module.provides,
		requires: module.requires,
		blocks: module.blocks,
		bindings: module.bindings.map(cacheBindingIdentity),
	});
}

function shaderContributionSemanticSource(contribution) {
	const {id: _id, diagnostics: _diagnostics, ...semantics} = contribution;
	return JSON.stringify(semantics);
}

function maximumVectorComponentDelta(left, right) {
	return Math.max(...left.map((value, index) => Math.abs(value - right[index])));
}

function installCacheModuleAudit({geometry, candidateGeometry, rollDegrees}) {
	const records = [];
	const createRolledModule = geometry.createCacheModule.bind(geometry);
	geometry.createCacheModule = (context) => {
		const module = createRolledModule(context);
		const semanticSource = cacheModuleSemanticSource(module);
		const record = {
			kind: context.kind,
			order: context.order ?? null,
			moduleId: module.id,
			moduleContentHash: module.contentHash,
			semanticSourceHash: fnv1a32(semanticSource),
			blockSourceHash: fnv1a32(module.blocks.map((block) => `${block.id}\n${block.source}`).join('\n')),
		};
		if (rollDegrees === 0) {
			const candidateModule = candidateGeometry.createCacheModule(context);
			const candidateSemanticSource = cacheModuleSemanticSource(candidateModule);
			record.candidateModuleId = candidateModule.id;
			record.candidateModuleContentHash = candidateModule.contentHash;
			record.candidateSemanticSourceHash = fnv1a32(candidateSemanticSource);
			record.candidateSemanticSourceEqual = semanticSource === candidateSemanticSource;
			requireCondition(
				record.candidateSemanticSourceEqual,
				`Zero-roll cache module ${context.kind} changed candidate semantics or GLSL source.`,
			);
		}
		record.moduleIdDiffersOnlyByExperimentalPolicy = rollDegrees === 0
			? record.moduleId !== record.candidateModuleId
			: null;
		record.contentIdentityDiffersByExperimentalPolicy = rollDegrees === 0
			? record.moduleContentHash !== record.candidateModuleContentHash
			: null;
		records.push(record);
		return module;
	};
	return records;
}

function stripVersion(source) {
	return source.replace(/^#version\s+300\s+es\s*/u, '');
}

function radians(degrees) {
	return degrees * Math.PI / 180;
}

function degrees(radiansValue) {
	return radiansValue * 180 / Math.PI;
}

function directionFromUpEastNorth(direction) {
	const [up, east, north] = direction;
	return /** @type {UnitVector3} */ ([east, north, up]);
}

function localHorizontalDirection(azimuthRadians) {
	return /** @type {UnitVector3} */ ([
		Math.sin(azimuthRadians),
		Math.cos(azimuthRadians),
		0,
	]);
}

function traceDirectionAtOffset(scene, offsetDegrees, index = null) {
	const [, sourceEast, sourceNorth] = scene.directionToSourceUpEastNorth;
	const sourceAzimuthRadians = Math.atan2(sourceEast, sourceNorth);
	const azimuthRadians = sourceAzimuthRadians + radians(offsetDegrees);
	return {
		index,
		offsetDegrees,
		azimuthDegrees: degrees(azimuthRadians),
		directionModel: localHorizontalDirection(azimuthRadians),
	};
}

function createTraceDirections(scene, trace) {
	requireCondition(trace.elevationDegrees === 0, 'This diagnostic traces the exact observer-local geometric horizontal only.');
	const count = Math.round((trace.maximumOffsetDegrees - trace.minimumOffsetDegrees) / trace.stepDegrees) + 1;
	requireCondition(Number.isSafeInteger(count) && count > 1, 'Horizon trace direction count is invalid.');
	return Array.from({length: count}, (_, index) => {
		const offsetDegrees = trace.minimumOffsetDegrees + trace.stepDegrees * index;
		return traceDirectionAtOffset(scene, offsetDegrees, index);
	});
}

function createDirectionTexture(directions) {
	const values = new Float32Array(directions.length * 4);
	for (const direction of directions) {
		values.set(direction.directionModel, direction.index * 4);
		values[direction.index * 4 + 3] = 1;
	}
	const texture = new THREE.DataTexture(values, directions.length, 1, THREE.RGBAFormat, THREE.FloatType);
	texture.internalFormat = 'RGBA32F';
	texture.minFilter = THREE.NearestFilter;
	texture.magFilter = THREE.NearestFilter;
	texture.generateMipmaps = false;
	texture.needsUpdate = true;
	return texture;
}

function fixedTraceInitialStateBlock() {
	return `ShaderState createInitialShaderState(vec2 uv) {
	ShaderState state;
	state.uv = uv;
	state.sceneDepth = 0.0;
	state.sceneHitMask = 0.0;
	state.ray = ViewRay(vec3(0.0), vec3(0.0, 0.0, 1.0));
	state.bounds = PathBounds(0.0, 0.0, 0.0, false, false, true);
	state.medium = MediumSample(zeroSpectral(), zeroSpectral(), zeroSpectral(), zeroSpectral());
	state.pathRadiance = zeroSpectral();
	state.celestialRadiance = zeroSpectral();
	state.preDisplayRadiance = zeroSpectral();
	state.transmittance = oneSpectral();
	state.sceneLinearSrgb = vec3(0.0);
	state.outputRgba = vec4(0.0, 0.0, 0.0, 1.0);
	return state;
}`;
}

function fixedTraceRayBlock(directionCount) {
	return `ViewRay reconstructViewRay(vec2 textureCoordinates) {
	int directionIndex = clamp(
		int(floor(textureCoordinates.x * float(${directionCount}))),
		0,
		${directionCount - 1}
	);
	vec3 direction = normalize(texelFetch(${TRACE_DIRECTION_UNIFORM_NAME}, ivec2(directionIndex, 0), 0).xyz);
	return ViewRay(uCameraWorldPositionMeters, direction);
}`;
}

function traceOutputContribution() {
	return createShaderContribution({
		id: 'diagnostic-horizon-path-radiance-output',
		owner: 'color',
		provides: ['diagnostic.horizonPathRadianceOutput'],
		requires: ['transport.evaluatePathRadiance'],
		textures: [createShaderTextureDescriptor(
			TRACE_DIRECTION_UNIFORM_NAME,
			'sampler2D',
			TRACE_DIRECTION_VALUE_KEY,
		)],
		uniforms: [createShaderUniformDescriptor(
			TRACE_OUTPUT_CHANNEL_UNIFORM_NAME,
			'int',
			TRACE_OUTPUT_CHANNEL_VALUE_KEY,
			0,
		)],
		mainHooks: [createShaderSourceBlock(
			'diagnostic-horizon-path-radiance-main',
			'diagnosticOutput',
			1000,
			`outColor = vec4(state.pathRadiance.c[${TRACE_OUTPUT_CHANNEL_UNIFORM_NAME}], 0.0, 0.0, 1.0);`,
		)],
	});
}

function createTraceAssembly(sourceAssembly, directionCount) {
	let initialStateReplacementCount = 0;
	let rayReplacementCount = 0;
	const contributions = sourceAssembly.contributions.map((contribution) => ({
		...contribution,
		functions: contribution.functions.map((block) => {
			if (block.id === 'runtime-initial-state') {
				initialStateReplacementCount += 1;
				return {...block, code: fixedTraceInitialStateBlock()};
			}
			if (block.id === 'geometry-reconstruct-helper') {
				rayReplacementCount += 1;
				return {...block, code: fixedTraceRayBlock(directionCount)};
			}
			return block;
		}),
	}));
	requireCondition(initialStateReplacementCount === 1, `Expected one runtime initial-state block; found ${initialStateReplacementCount}.`);
	requireCondition(rayReplacementCount === 1, `Expected one geometry ray block; found ${rayReplacementCount}.`);
	contributions.push(traceOutputContribution());
	return new Algorithm32ShaderAssembler().assemble({
		descriptor: sourceAssembly.descriptor,
		contributions,
		mainRequiredSymbols: [
			...sourceAssembly.validationReport.requiredSymbols,
			'diagnostic.horizonPathRadianceOutput',
		],
		systemProvidedSymbols: [],
	});
}

function createTraceUniforms(assembly, sourceRuntime, directionTexture) {
	const uniforms = {};
	for (const contribution of assembly.contributions) {
		for (const uniform of contribution.uniforms) {
			const value = uniform.valueKey === TRACE_OUTPUT_CHANNEL_VALUE_KEY
				? 0
				: sourceRuntime.getUniformValue(uniform.name);
			uniforms[uniform.name] = {value: value ?? uniform.defaultValue ?? null};
		}
		for (const texture of contribution.textures) {
			const value = texture.valueKey === TRACE_DIRECTION_VALUE_KEY
				? directionTexture
				: sourceRuntime.getUniformValue(texture.name);
			uniforms[texture.name] = {value: value ?? null};
		}
	}
	return uniforms;
}

async function readGpuPathRadiance({renderer, sourceAssembly, sourceRuntime, directions}) {
	const channelCount = NATIVE_15_SPECTRAL_BASIS.channelCount;
	const directionTexture = createDirectionTexture(directions);
	const assembly = createTraceAssembly(sourceAssembly, directions.length);
	const uniforms = createTraceUniforms(assembly, sourceRuntime, directionTexture);
	const material = new THREE.RawShaderMaterial({
		glslVersion: THREE.GLSL3 ?? '300 es',
		vertexShader: FULLSCREEN_VERTEX_SHADER,
		fragmentShader: stripVersion(assembly.fragmentShaderSource),
		uniforms,
		depthTest: false,
		depthWrite: false,
		blending: THREE.NoBlending,
	});
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
	const scene = new THREE.Scene();
	const mesh = new THREE.Mesh(geometry, material);
	mesh.frustumCulled = false;
	scene.add(mesh);
	const camera = new THREE.Camera();
	const target = new THREE.WebGLRenderTarget(directions.length, 1, {
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		depthBuffer: false,
		stencilBuffer: false,
	});
	target.texture.internalFormat = 'RGBA32F';
	const previousTarget = renderer.getRenderTarget();
	const spectra = Array.from({length: directions.length}, () => new Float32Array(channelCount));
	try {
		if (typeof renderer.compileAsync === 'function') await renderer.compileAsync(scene, camera);
		else renderer.compile(scene, camera);
		const pixels = new Float32Array(directions.length * 4);
		for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
			uniforms[TRACE_OUTPUT_CHANNEL_UNIFORM_NAME].value = channelIndex;
			renderer.setRenderTarget(target);
			renderer.render(scene, camera);
			renderer.readRenderTargetPixels(target, 0, 0, directions.length, 1, pixels);
			for (let directionIndex = 0; directionIndex < directions.length; directionIndex += 1) {
				spectra[directionIndex][channelIndex] = pixels[directionIndex * 4];
			}
		}
	} finally {
		renderer.setRenderTarget(previousTarget);
		target.dispose();
		geometry.dispose();
		material.dispose();
		directionTexture.dispose();
	}
	return {spectra, assembly};
}

function scatteringPacket(values, provenanceIdentity) {
	return new SpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
		units: SPECTRAL_UNITS.SCATTERING_DENSITY,
		values,
		provenanceIdentity,
	});
}

function radiancePacket(values, provenanceIdentity) {
	return new SpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		values,
		provenanceIdentity,
	});
}

function cloneStencil(stencil) {
	return {indices: Array.from(stencil.indices), weights: Array.from(stencil.weights)};
}

function auditZeroRollCandidateParity({geometry, candidateGeometry, descriptor, directions}) {
	const rolledDescription = geometry.describe();
	const {experimentalW27Frame, ...rolledCandidateDescription} = rolledDescription;
	const candidateDescription = candidateGeometry.describe();
	const geometryDescriptionSemanticEqual = JSON.stringify(rolledCandidateDescription)
		=== JSON.stringify(candidateDescription);
	let maximumLocalDirectionComponentDelta = 0;
	let maximumRoundTripDirectionComponentDelta = 0;
	let stencilIndexMismatchCount = 0;
	let maximumStencilWeightDelta = 0;
	for (const direction of directions) {
		const request = {physicalOutgoingDirection: direction.directionModel};
		const rolledLocal = geometry.expressScatteringCacheDirection(request);
		const candidateLocal = candidateGeometry.expressScatteringCacheDirection(request);
		maximumLocalDirectionComponentDelta = Math.max(
			maximumLocalDirectionComponentDelta,
			maximumVectorComponentDelta(rolledLocal, candidateLocal),
		);
		maximumRoundTripDirectionComponentDelta = Math.max(
			maximumRoundTripDirectionComponentDelta,
			maximumVectorComponentDelta(
				geometry.expressPhysicalOutgoingScatteringDirection(rolledLocal),
				candidateGeometry.expressPhysicalOutgoingScatteringDirection(candidateLocal),
			),
		);
		const rolledStencil = geometry.resolveScatteringCacheDirectionStencil(request);
		const candidateStencil = candidateGeometry.resolveScatteringCacheDirectionStencil(request);
		if (rolledStencil.indices.length !== candidateStencil.indices.length
			|| rolledStencil.indices.some((index, tapIndex) => index !== candidateStencil.indices[tapIndex])) {
			stencilIndexMismatchCount += 1;
		}
		for (let tapIndex = 0; tapIndex < rolledStencil.weights.length; tapIndex += 1) {
			maximumStencilWeightDelta = Math.max(
				maximumStencilWeightDelta,
				Math.abs(rolledStencil.weights[tapIndex] - candidateStencil.weights[tapIndex]),
			);
		}
	}
	const rolledContribution = geometry.createShaderContribution({descriptor});
	const candidateContribution = candidateGeometry.createShaderContribution({descriptor});
	const rolledSemanticSource = shaderContributionSemanticSource(rolledContribution);
	const candidateSemanticSource = shaderContributionSemanticSource(candidateContribution);
	const runtimeShaderSemanticSourceEqual = rolledSemanticSource === candidateSemanticSource;
	requireCondition(maximumLocalDirectionComponentDelta === 0, 'Zero-roll local W27 directions differ from the candidate geometry.');
	requireCondition(maximumRoundTripDirectionComponentDelta === 0, 'Zero-roll W27 round trips differ from the candidate geometry.');
	requireCondition(stencilIndexMismatchCount === 0, 'Zero-roll W27 stencil indices differ from the candidate geometry.');
	requireCondition(maximumStencilWeightDelta === 0, 'Zero-roll W27 stencil weights differ from the candidate geometry.');
	requireCondition(runtimeShaderSemanticSourceEqual, 'Zero-roll runtime geometry contribution differs semantically from candidate GLSL.');
	requireCondition(geometryDescriptionSemanticEqual, 'Zero-roll geometry description differs from the candidate apart from the experimental policy tag.');
	return {
		policy: 'alpha-zero-candidate-semantic-and-source-equivalence-v1',
		experimentalW27Frame,
		geometryDescriptionSemanticEqual,
		candidateGeometryDescription: candidateDescription,
		directionCount: directions.length,
		maximumLocalDirectionComponentDelta,
		maximumRoundTripDirectionComponentDelta,
		stencilIndexMismatchCount,
		maximumStencilWeightDelta,
		runtimeShaderSemanticSourceEqual,
		rolledContributionId: rolledContribution.id,
		candidateContributionId: candidateContribution.id,
		rolledSemanticSourceHash: fnv1a32(rolledSemanticSource),
		candidateSemanticSourceHash: fnv1a32(candidateSemanticSource),
	};
}

function collectReferenceRequests(algorithm, liveCache, directions, pathIntervalCount) {
	let activeRequests = null;
	const requestsByDirection = [];
	const zero = new Float64Array(NATIVE_15_SPECTRAL_BASIS.channelCount);
	const recordingCache = {
		descriptor: liveCache.descriptor,
		sampleResolved(request) {
			requireCondition(activeRequests !== null, 'Reference cache request occurred outside one trace ray.');
			activeRequests.push({
				positionStencil: cloneStencil(request.positionStencil),
				directionStencil: cloneStencil(request.directionStencil),
			});
			return scatteringPacket(zero, 'san-jose-horizon-trace-coordinate-discovery');
		},
		dispose() {},
	};
	for (const direction of directions) {
		activeRequests = [];
		const seed = algorithm.evaluate({
			viewRay: {direction: direction.directionModel},
			scatteringCache: recordingCache,
			pathIntervalCount,
		});
		requireCondition(activeRequests.length === seed.pathIntegrationPoints.length, 'Reference cache request count changed.');
		requestsByDirection.push(activeRequests.map((request, index) => ({
			...request,
			pointIndex: index,
			distanceAlongRayMeters: seed.pathIntegrationPoints[index].distanceAlongRay.value,
			measureMeters: seed.pathIntegrationPoints[index].measure.value,
		})));
	}
	activeRequests = null;
	return requestsByDirection;
}

function cacheScalarKey(directionIndex, positionIndex, channelIndex) {
	return `${directionIndex}:${positionIndex}:${channelIndex}`;
}

function requiredCacheCoordinates(requestsByDirection) {
	const byKey = new Map();
	for (const requests of requestsByDirection) {
		for (const request of requests) {
			for (const directionIndex of request.directionStencil.indices) {
				for (const positionIndex of request.positionStencil.indices) {
					for (let channelIndex = 0; channelIndex < NATIVE_15_SPECTRAL_BASIS.channelCount; channelIndex += 1) {
						const key = cacheScalarKey(directionIndex, positionIndex, channelIndex);
						if (!byKey.has(key)) byKey.set(key, {directionIndex, positionIndex, channelIndex});
					}
				}
			}
		}
	}
	return [...byKey.values()];
}

function mergeCacheCoordinates(...coordinateSets) {
	const byKey = new Map();
	for (const coordinates of coordinateSets) {
		for (const coordinate of coordinates) {
			const normalized = {
				directionIndex: coordinate.directionIndex,
				positionIndex: coordinate.positionIndex,
				channelIndex: coordinate.channelIndex ?? coordinate.wavelengthIndex,
			};
			byKey.set(
				cacheScalarKey(normalized.directionIndex, normalized.positionIndex, normalized.channelIndex),
				normalized,
			);
		}
	}
	return [...byKey.values()];
}

function createPackedSeamAudit({field, plan, axisSelection, readbackValues, rollDegrees}) {
	const reader = {
		descriptor: field.descriptor,
		readScalar({directionIndex, positionIndex, wavelengthIndex}) {
			const key = cacheScalarKey(directionIndex, positionIndex, wavelengthIndex);
			requireCondition(readbackValues.has(key), `Packed W27 seam readback omitted ${key}.`);
			return readbackValues.get(key);
		},
	};
	const audit = auditCubedSphereW27Field({
		field: reader,
		label: `roll-${rollDegrees}-cumulative-r32f`,
		topology: plan.topology,
		stencilSweep: plan.stencilSweep,
		positionIndices: plan.positionIndices,
		wavelengthIndices: plan.wavelengthIndices,
		largestDifferenceCount: 32,
	});
	const {groups: _groups, ...topologySummary} = audit.topology;
	const {records: _records, ...stencilSweepSummary} = audit.stencilSweep;
	return {
		schemaId: 'san-jose-plus-one-hour-packed-cumulative-r32f-w27-seam-audit-v1',
		fieldDescriptor: field.descriptor,
		fieldStorage: {...field.storage},
		readbackPlan: {
			schemaId: plan.schemaId,
			mode: 'single-packed-rgba32f-gather-shared-with-cpu-reference',
			directionIndices: plan.directionIndices,
			positionIndices: plan.positionIndices,
			wavelengthIndices: plan.wavelengthIndices,
			positionRoles: axisSelection.positionRoles,
			wavelengthRoles: axisSelection.wavelengthRoles,
			directionCount: plan.directionCount,
			positionCount: plan.positionCount,
			wavelengthCount: plan.wavelengthCount,
			scalarCount: plan.scalarCount,
			maximumScalarCount: plan.maximumScalarCount,
		},
		contract: audit.contract,
		field: audit.field,
		selection: audit.selection,
		topology: topologySummary,
		stencilSweep: stencilSweepSummary,
		duplicateValues: audit.duplicateValues,
		boundaryInterpolation: audit.boundaryInterpolation,
	};
}

async function readCacheCoordinates({renderer, cacheTexture, coordinates}) {
	requireCondition(cacheTexture, 'Live cumulative cache texture is unavailable.');
	const context = renderer.getContext();
	const maximumWidth = context.getParameter(context.MAX_TEXTURE_SIZE);
	const width = Math.min(4096, maximumWidth, Math.max(1, coordinates.length));
	const height = Math.ceil(coordinates.length / width);
	const encoded = new Float32Array(width * height * 4);
	for (let index = 0; index < coordinates.length; index += 1) {
		const coordinate = coordinates[index];
		encoded.set([coordinate.directionIndex, coordinate.positionIndex, coordinate.channelIndex, 1], index * 4);
	}
	const coordinateTexture = new THREE.DataTexture(encoded, width, height, THREE.RGBAFormat, THREE.FloatType);
	coordinateTexture.internalFormat = 'RGBA32F';
	coordinateTexture.minFilter = THREE.NearestFilter;
	coordinateTexture.magFilter = THREE.NearestFilter;
	coordinateTexture.generateMipmaps = false;
	coordinateTexture.needsUpdate = true;
	const material = new THREE.RawShaderMaterial({
		glslVersion: THREE.GLSL3 ?? '300 es',
		vertexShader: FULLSCREEN_VERTEX_SHADER,
		fragmentShader: `
precision highp float;
precision highp sampler2D;
precision highp sampler2DArray;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTraceCacheCoordinates;
uniform sampler2DArray uTraceCumulativeCache;
void main() {
	ivec2 pixel = ivec2(gl_FragCoord.xy);
	ivec3 coordinate = ivec3(floor(texelFetch(uTraceCacheCoordinates, pixel, 0).xyz + vec3(0.5)));
	outColor = vec4(texelFetch(uTraceCumulativeCache, coordinate, 0).r, 0.0, 0.0, 1.0);
}`,
		uniforms: {
			uTraceCacheCoordinates: {value: coordinateTexture},
			uTraceCumulativeCache: {value: cacheTexture},
		},
		depthTest: false,
		depthWrite: false,
		blending: THREE.NoBlending,
	});
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
	const scene = new THREE.Scene();
	const mesh = new THREE.Mesh(geometry, material);
	mesh.frustumCulled = false;
	scene.add(mesh);
	const camera = new THREE.Camera();
	const target = new THREE.WebGLRenderTarget(width, height, {
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		depthBuffer: false,
		stencilBuffer: false,
	});
	target.texture.internalFormat = 'RGBA32F';
	const previousTarget = renderer.getRenderTarget();
	const pixels = new Float32Array(width * height * 4);
	try {
		if (typeof renderer.compileAsync === 'function') await renderer.compileAsync(scene, camera);
		else renderer.compile(scene, camera);
		renderer.setRenderTarget(target);
		renderer.render(scene, camera);
		renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
	} finally {
		renderer.setRenderTarget(previousTarget);
		target.dispose();
		geometry.dispose();
		material.dispose();
		coordinateTexture.dispose();
	}
	const values = new Map();
	for (let index = 0; index < coordinates.length; index += 1) {
		const coordinate = coordinates[index];
		values.set(cacheScalarKey(coordinate.directionIndex, coordinate.positionIndex, coordinate.channelIndex), pixels[index * 4]);
	}
	return {values, packedTexture: {width, height}, scalarCount: coordinates.length};
}

function createReadbackCpuCache(liveCache, values) {
	return {
		descriptor: liveCache.descriptor,
		sampleResolved(request) {
			const result = new Float64Array(NATIVE_15_SPECTRAL_BASIS.channelCount);
			for (let positionTap = 0; positionTap < request.positionStencil.indices.length; positionTap += 1) {
				for (let directionTap = 0; directionTap < request.directionStencil.indices.length; directionTap += 1) {
					const positionIndex = request.positionStencil.indices[positionTap];
					const directionIndex = request.directionStencil.indices[directionTap];
					const weight = request.positionStencil.weights[positionTap] * request.directionStencil.weights[directionTap];
					for (let channelIndex = 0; channelIndex < result.length; channelIndex += 1) {
						const value = values.get(cacheScalarKey(directionIndex, positionIndex, channelIndex));
						requireCondition(value !== undefined, 'CPU Reference requested an unrecorded live-cache scalar.');
						result[channelIndex] += weight * value;
					}
				}
			}
			return scatteringPacket(result, 'san-jose-horizon-trace-live-r32f-readback');
		},
		dispose() {},
	};
}

function describeCacheDirection(geometry, directionModel) {
	const localDirection = geometry.expressScatteringCacheDirection({
		physicalOutgoingDirection: directionModel,
	});
	const described = describeCubedSphereW27DirectionStencil(localDirection);
	const u = described.faceCoordinates.u;
	const v = described.faceCoordinates.v;
	return {
		localDirection,
		face: {
			index: described.selectedFace.index,
			id: described.selectedFace.id,
			u,
			v,
			gridU: described.gridCoordinates.u,
			gridV: described.gridCoordinates.v,
			boundaryDistance: 1 - Math.max(Math.abs(u), Math.abs(v)),
		},
		directionStencil: {
			indices: described.taps.map((tap) => tap.index),
			weights: described.taps.map((tap) => tap.weight),
			weightSum: described.weightSum,
			taps: described.taps.map((tap) => ({
				index: tap.index,
				weight: tap.weight,
				...tap.address,
			})),
		},
	};
}

function comparison(cpu, gpu) {
	let maximumAbsolute = 0;
	let maximumRelative = 0;
	for (let channelIndex = 0; channelIndex < cpu.length; channelIndex += 1) {
		const absolute = Math.abs(cpu[channelIndex] - gpu[channelIndex]);
		maximumAbsolute = Math.max(maximumAbsolute, absolute);
		maximumRelative = Math.max(maximumRelative, absolute / Math.max(Math.abs(cpu[channelIndex]), 1e-30));
	}
	return {maximumAbsolute, maximumRelative};
}

function summarizeTrace(samples) {
	const faceTransitions = [];
	let maximumCpuAdjacentYJump = 0;
	let maximumGpuAdjacentYJump = 0;
	let maximumAbsoluteCpuGpuResidual = 0;
	let maximumRelativeCpuGpuResidual = 0;
	for (let index = 1; index < samples.length; index += 1) {
		const previous = samples[index - 1];
		const current = samples[index];
		const cpuYJump = Math.abs(current.cpu.photopicLuminanceCdPerSquareMeter - previous.cpu.photopicLuminanceCdPerSquareMeter);
		const gpuYJump = Math.abs(current.gpu.photopicLuminanceCdPerSquareMeter - previous.gpu.photopicLuminanceCdPerSquareMeter);
		maximumCpuAdjacentYJump = Math.max(maximumCpuAdjacentYJump, cpuYJump);
		maximumGpuAdjacentYJump = Math.max(maximumGpuAdjacentYJump, gpuYJump);
		if (previous.cache.face.id !== current.cache.face.id) {
			faceTransitions.push({
				betweenOffsetsDegrees: [previous.offsetDegrees, current.offsetDegrees],
				fromFace: previous.cache.face.id,
				toFace: current.cache.face.id,
				cpuYJump,
				gpuYJump,
			});
		}
	}
	for (const sample of samples) {
		maximumAbsoluteCpuGpuResidual = Math.max(maximumAbsoluteCpuGpuResidual, sample.cpuVsGpu.maximumAbsolute);
		maximumRelativeCpuGpuResidual = Math.max(maximumRelativeCpuGpuResidual, sample.cpuVsGpu.maximumRelative);
	}
	return {
		sampleCount: samples.length,
		faceTransitions,
		maximumCpuAdjacentYJump,
		maximumGpuAdjacentYJump,
		maximumAbsoluteCpuGpuResidual,
		maximumRelativeCpuGpuResidual,
	};
}

function configureCamera(camera, sceneSpec, observerHeightMeters) {
	camera.up.set(0, 1, 0);
	camera.position.set(0, observerHeightMeters, 0);
	const azimuth = radians(sceneSpec.viewAzimuthDegrees);
	const elevation = radians(sceneSpec.viewElevationDegrees);
	camera.lookAt(
		1000 * Math.sin(azimuth) * Math.cos(elevation),
		observerHeightMeters + 1000 * Math.sin(elevation),
		-1000 * Math.cos(azimuth) * Math.cos(elevation),
	);
	camera.updateMatrixWorld(true);
}

function packetPhotometry(color, packet) {
	return {
		pathRadiance: Array.from(packet.values),
		signedLinearSrgb: color.radianceToLinearSrgb(packet),
		photopicLuminanceCdPerSquareMeter: color.radianceToPhotopicLuminance(packet),
	};
}

function addProbeReason(reasons, index, reason) {
	if (!reasons.has(index)) reasons.set(index, new Set());
	reasons.get(index).add(reason);
}

function findHorizontalFaceBoundary({geometry, scene, leftOffsetDegrees, rightOffsetDegrees, leftFaceId}) {
	let left = leftOffsetDegrees;
	let right = rightOffsetDegrees;
	for (let iteration = 0; iteration < 60; iteration += 1) {
		const middle = (left + right) * 0.5;
		const middleDirection = traceDirectionAtOffset(scene, middle);
		const middleFace = describeCacheDirection(geometry, middleDirection.directionModel).face.id;
		if (middleFace === leftFaceId) left = middle;
		else right = middle;
	}
	return (left + right) * 0.5;
}

function selectSparseProbeDirections({geometry, scene, directions, cacheByDirection, gpuY}) {
	const reasons = new Map();
	for (const offset of [-90, -60, -45, 0, 45, 60, 90]) {
		const index = directions.findIndex((direction) => direction.offsetDegrees === offset);
		if (index >= 0) addProbeReason(reasons, index, offset === 0 ? 'source-azimuth-control' : 'fixed-angular-control');
	}
	const faceTransitions = [];
	for (let index = 1; index < directions.length; index += 1) {
		if (cacheByDirection[index - 1].face.id !== cacheByDirection[index].face.id) {
			faceTransitions.push({leftIndex: index - 1, rightIndex: index});
		}
	}
	const gradients = Array.from({length: directions.length - 1}, (_, zeroIndex) => {
		const index = zeroIndex + 1;
		return {
			index,
			magnitude: Math.abs(Math.log10(Math.max(gpuY[index], 1e-30)) - Math.log10(Math.max(gpuY[index - 1], 1e-30))),
		};
	}).sort((left, right) => right.magnitude - left.magnitude).slice(0, 6);
	for (const gradient of gradients) {
		addProbeReason(reasons, gradient.index - 1, 'strong-gpu-gradient-left');
		addProbeReason(reasons, gradient.index, 'strong-gpu-gradient-right');
	}
	const localMaxima = [];
	for (let index = 1; index < directions.length - 1; index += 1) {
		if (gpuY[index] >= gpuY[index - 1] && gpuY[index] >= gpuY[index + 1]) {
			localMaxima.push({index, value: gpuY[index]});
		}
	}
	for (const maximum of localMaxima.sort((left, right) => right.value - left.value).slice(0, 4)) {
		addProbeReason(reasons, maximum.index, 'bright-local-maximum');
	}
	const selected = [...reasons]
		.sort(([left], [right]) => left - right)
		.map(([index, probeReasons]) => ({
			...directions[index],
			probeId: `dense-${index}`,
			denseIndex: index,
			probeReasons: [...probeReasons].sort(),
		}));
	const epsilonDegrees = degrees(1e-6);
	for (let transitionIndex = 0; transitionIndex < faceTransitions.length; transitionIndex += 1) {
		const transition = faceTransitions[transitionIndex];
		const boundaryOffsetDegrees = findHorizontalFaceBoundary({
			geometry,
			scene,
			leftOffsetDegrees: directions[transition.leftIndex].offsetDegrees,
			rightOffsetDegrees: directions[transition.rightIndex].offsetDegrees,
			leftFaceId: cacheByDirection[transition.leftIndex].face.id,
		});
		selected.push({
			...traceDirectionAtOffset(scene, boundaryOffsetDegrees - epsilonDegrees),
			probeId: `face-boundary-${transitionIndex}-negative-epsilon`,
			denseIndex: null,
			boundaryOffsetDegrees,
			boundaryEpsilonRadians: -1e-6,
			probeReasons: ['w27-face-boundary-negative-epsilon'],
		});
		selected.push({
			...traceDirectionAtOffset(scene, boundaryOffsetDegrees + epsilonDegrees),
			probeId: `face-boundary-${transitionIndex}-positive-epsilon`,
			denseIndex: null,
			boundaryOffsetDegrees,
			boundaryEpsilonRadians: 1e-6,
			probeReasons: ['w27-face-boundary-positive-epsilon'],
		});
	}
	return selected.sort((left, right) => left.offsetDegrees - right.offsetDegrees);
}

/** Exercise sparse selection, including synthetic face-boundary probes, without WebGL or run allocation. */
export function smokeSanJosePlusOneHourHorizonTraceSelection() {
	const scene = {
		directionToSourceUpEastNorth: [
			-0.16946677586889025,
			-0.7579900644516986,
			0.6298667113517853,
		],
	};
	const directions = createTraceDirections(scene, {
		minimumOffsetDegrees: -90,
		maximumOffsetDegrees: 90,
		stepDegrees: 0.5,
		elevationDegrees: 0,
	});
	const identityGeometry = {
		expressScatteringCacheDirection({physicalOutgoingDirection}) {
			return physicalOutgoingDirection;
		},
	};
	const cacheByDirection = directions.map((direction) =>
		describeCacheDirection(identityGeometry, direction.directionModel));
	const gpuY = directions.map((direction) =>
		1e-6 + Math.exp(-(((direction.offsetDegrees - 32) / 11) ** 2)));
	const probes = selectSparseProbeDirections({
		geometry: identityGeometry,
		scene,
		directions,
		cacheByDirection,
		gpuY,
	});
	const boundaryProbes = probes.filter((probe) => probe.boundaryEpsilonRadians !== undefined);
	requireCondition(boundaryProbes.length >= 4, 'Sparse-selection smoke did not create both sides of at least two W27 boundaries.');
	requireCondition(boundaryProbes.every((probe) => probe.index === null && probe.denseIndex === null), 'Boundary probes must not impersonate dense samples.');
	requireCondition(new Set(probes.map((probe) => probe.probeId)).size === probes.length, 'Sparse probe identities must be unique.');
	return {
		denseDirectionCount: directions.length,
		probeCount: probes.length,
		boundaryProbeCount: boundaryProbes.length,
		probeIdsUnique: true,
	};
}

function distance(left, right) {
	return Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]);
}

async function traceOneRoll({renderer, context, fixture, radiometry, config, directions, rollDegrees}) {
	const width = fixture.camera.widthPixels;
	const height = fixture.camera.heightPixels;
	const composer = new EffectComposer(renderer);
	composer.setSize(width, height);
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	const camera = new THREE.PerspectiveCamera(fixture.camera.verticalFovDegrees, width / height, 0.1, 400000);
	configureCamera(camera, config.scene, fixture.camera.observerHeightMeters);
	composer.addPass(new RenderPass(scene, camera));
	const directionToSun = directionFromUpEastNorth(config.scene.directionToSourceUpEastNorth);
	const geometryConfiguration = {
		...radiometry.geometry,
		observerHeight: {value: fixture.camera.observerHeightMeters, units: 'meters'},
		observerUpDirection: [0, 0, 1],
		sceneFrame: {kind: 'observer-local'},
		directionToSource: directionToSun,
		cacheAltitudeBinCount: 48,
	};
	const candidateGeometry = new SphericalEarthGeometry(geometryConfiguration);
	const geometry = new RolledW27SphericalEarthGeometry({
		...geometryConfiguration,
		w27RollRadians: radians(rollDegrees),
	});
	const cacheModuleAudit = installCacheModuleAudit({geometry, candidateGeometry, rollDegrees});
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const lightSource = new DistantSunLightSource({
		directionToLight: directionToSun,
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: {value: SUN_ANGULAR_RADIUS_RADIANS, units: 'radians'},
	});
	const color = new BrunetonColorDisplayModel({displayConstants: FIGURE1_DISPLAY_CONSTANTS});
	const algorithm = new Algorithm32({
		geometry,
		atmosphere,
		lightSource,
		color,
		spectral: NATIVE_15_SPECTRAL_BASIS,
		execution: {maximumScatteringOrder: 4, pathIntervalCount: 15},
	});
	const backend = new ThreeCacheBackend({THREE, renderer});
	let handle;
	try {
		handle = await algorithm.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: {width, height, units: 'pixels'},
			cacheBackend: backend,
			sceneScale: {value: 1, units: 'meters-per-scene-unit'},
			sceneDepthMax: {value: 300000, units: 'meters'},
			bindingValues: {
				'geometry.inverseProjectionMatrix': camera.projectionMatrixInverse.clone(),
				'geometry.inverseViewMatrix': camera.matrixWorld.clone(),
				'geometry.cameraWorldPosition': new THREE.Vector3(0, 0, radiometry.geometry.bottomRadius.value + fixture.camera.observerHeightMeters),
				'geometry.cameraGroundRelativePosition': new THREE.Vector3(0, 0, fixture.camera.observerHeightMeters),
				'light.directionToAtmosphericSource': new THREE.Vector3(...directionToSun),
			},
		});
		await handle.prepare(renderer);
		composer.render();
		const buildResult = handle._buildResult;
		requireCondition(buildResult.cache, 'Live N4 cumulative cache was not built.');
		requireCondition(buildResult.assembly, 'Live runtime assembly is unavailable.');
		requireCondition(buildResult.runtime, 'Live runtime is unavailable.');
		requireCondition(cacheModuleAudit.length > 0, 'Cache construction did not exercise the audited geometry module seam.');
		const zeroRollCandidateParity = rollDegrees === 0
			? auditZeroRollCandidateParity({
				geometry,
				candidateGeometry,
				descriptor: buildResult.assembly.descriptor,
				directions,
			})
			: null;
		const gpu = await readGpuPathRadiance({
			renderer,
			sourceAssembly: buildResult.assembly,
			sourceRuntime: buildResult.runtime,
			directions,
		});
		const gpuPackets = gpu.spectra.map((values) => radiancePacket(values, `san-jose-horizon-trace-live-gpu-pre-color:roll-${rollDegrees}`));
		const gpuY = gpuPackets.map((packet) => color.radianceToPhotopicLuminance(packet));
		const cacheByDirection = directions.map((direction) => describeCacheDirection(geometry, direction.directionModel));
		const sparseDirections = selectSparseProbeDirections({
			geometry,
			scene: config.scene,
			directions,
			cacheByDirection,
			gpuY,
		});
		const denseRequests15 = collectReferenceRequests(algorithm, buildResult.cache, directions, 15);
		const sparseRequests = new Map([
			[15, collectReferenceRequests(algorithm, buildResult.cache, sparseDirections, 15)],
			[40, collectReferenceRequests(algorithm, buildResult.cache, sparseDirections, 40)],
			[160, collectReferenceRequests(algorithm, buildResult.cache, sparseDirections, 160)],
		]);
		const residentCumulativeField = buildResult.cache._artifact?.result;
		requireCondition(residentCumulativeField, 'Live cumulative R32F field is unavailable for the W27 seam audit.');
		const seamAxisSelection = createCubedSphereW27RepresentativeAxisSelection();
		const seamReadbackPlan = planCubedSphereW27GpuFieldReadback({
			field: residentCumulativeField,
			positionIndices: seamAxisSelection.positionIndices,
			wavelengthIndices: seamAxisSelection.wavelengthIndices,
			maximumScalarCount: 25000,
		});
		const coordinates = mergeCacheCoordinates(
			requiredCacheCoordinates([
				...denseRequests15,
				...sparseRequests.get(15),
				...sparseRequests.get(40),
				...sparseRequests.get(160),
			]),
			seamReadbackPlan.coordinates,
		);
		const cacheTextureDescriptor = buildResult.assembly.contributions
			.flatMap((contribution) => contribution.textures)
			.find((texture) => texture.valueKey === CUMULATIVE_SCATTERING_CACHE_VALUE_KEY);
		requireCondition(cacheTextureDescriptor, 'Cumulative cache texture descriptor is unavailable.');
		const cacheTexture = buildResult.runtime.getUniformValue(cacheTextureDescriptor.name);
		const readback = await readCacheCoordinates({renderer, cacheTexture, coordinates});
		const cpuCache = createReadbackCpuCache(buildResult.cache, readback.values);
		const residentCumulativeW27SeamAudit = createPackedSeamAudit({
			field: residentCumulativeField,
			plan: seamReadbackPlan,
			axisSelection: seamAxisSelection,
			readbackValues: readback.values,
			rollDegrees,
		});
		const samples = directions.map((direction, index) => {
			const cpuEvaluation = algorithm.evaluate({
				viewRay: {direction: direction.directionModel},
				scatteringCache: cpuCache,
				pathIntervalCount: 15,
			});
			const cpuPacket = cpuEvaluation.pathRadiance;
			const gpuPacket = gpuPackets[index];
			const cpuValues = Array.from(cpuPacket.values);
			const gpuValues = Array.from(gpuPacket.values);
			return {
				...direction,
				cache: cacheByDirection[index],
				pathSamples: denseRequests15[index].map((request) => ({
					pointIndex: request.pointIndex,
					distanceAlongRayMeters: request.distanceAlongRayMeters,
					measureMeters: request.measureMeters,
					positionStencil: request.positionStencil,
					directionStencil: request.directionStencil,
				})),
				cpu: packetPhotometry(color, cpuPacket),
				gpu: packetPhotometry(color, gpuPacket),
				cpuVsGpu: comparison(cpuValues, gpuValues),
			};
		});
		const sparseIntegration = sparseDirections.map((direction, sparseIndex) => {
			const evaluations = [15, 40, 160].map((pathIntervalCount) => {
				const packet = algorithm.evaluate({
					viewRay: {direction: direction.directionModel},
					scatteringCache: cpuCache,
					pathIntervalCount,
				}).pathRadiance;
				return {
					pathIntervalCount,
					...packetPhotometry(color, packet),
					pathSamples: sparseRequests.get(pathIntervalCount)[sparseIndex].map((request) => ({
						pointIndex: request.pointIndex,
						distanceAlongRayMeters: request.distanceAlongRayMeters,
						measureMeters: request.measureMeters,
						positionStencil: request.positionStencil,
						directionStencil: request.directionStencil,
					})),
				};
			});
			const reference160 = evaluations.find((entry) => entry.pathIntervalCount === 160);
			for (const evaluation of evaluations) {
				evaluation.deltaFrom160 = {
					photopicLuminanceCdPerSquareMeter: evaluation.photopicLuminanceCdPerSquareMeter - reference160.photopicLuminanceCdPerSquareMeter,
					relativePhotopicLuminance: (evaluation.photopicLuminanceCdPerSquareMeter - reference160.photopicLuminanceCdPerSquareMeter) / Math.max(Math.abs(reference160.photopicLuminanceCdPerSquareMeter), 1e-30),
					maximumAbsoluteSpectral: comparison(reference160.pathRadiance, evaluation.pathRadiance).maximumAbsolute,
				};
			}
			return {
				probeId: direction.probeId,
				denseIndex: direction.denseIndex,
				offsetDegrees: direction.offsetDegrees,
				azimuthDegrees: direction.azimuthDegrees,
				directionModel: direction.directionModel,
				boundaryOffsetDegrees: direction.boundaryOffsetDegrees ?? null,
				boundaryEpsilonRadians: direction.boundaryEpsilonRadians ?? null,
				probeReasons: direction.probeReasons,
				cache: describeCacheDirection(geometry, direction.directionModel),
				evaluations,
			};
		});
		const webglErrors = [];
		for (let error = context.getError(); error !== context.NO_ERROR; error = context.getError()) webglErrors.push(error);
		const cacheGeometryModuleSetHash = fnv1a32(JSON.stringify(cacheModuleAudit.map((record) => ({
			kind: record.kind,
			order: record.order,
			moduleId: record.moduleId,
			moduleContentHash: record.moduleContentHash,
			semanticSourceHash: record.semanticSourceHash,
		}))));
		return {
			rollDegrees,
			mechanicalControls: {
				geometryDescription: geometry.describe(),
				cacheModuleAudit,
				zeroRollCandidateParity,
			},
			numerics: {
				maximumScatteringOrder: 4,
				gpuPathIntervalCount: 15,
				cpuSparsePathIntervalCounts: [15, 40, 160],
				spectralChannelCount: NATIVE_15_SPECTRAL_BASIS.channelCount,
				cacheDirectionDomain: buildResult.cache.descriptor.directionDomain,
				cachePositionDomain: buildResult.cache.descriptor.positionDomain,
				cpuReference: 'Reference.evaluate over an exact gathered readback of the same live cumulative R32F field',
				gpuPath: 'live assembled common transport with output intercepted before Color',
				cacheReadback: {scalarCount: readback.scalarCount, packedTexture: readback.packedTexture},
				cacheDescriptorContentHash: buildResult.cache.descriptor.contentHash,
				cacheConstructionGeometryIdentity: buildResult.cache.descriptor.constructionIdentities?.geometry ?? null,
				cacheGeometryModuleSetHash,
				runtimeDescriptorFingerprint: buildResult.assembly.descriptor.fingerprint,
				geometryDescriptorFingerprint: buildResult.assembly.descriptor.geometry.fingerprint,
				sourceAssemblyHash: buildResult.assembly.sourceHash,
				traceAssemblyHash: gpu.assembly.sourceHash,
			},
			residentCumulativeW27SeamAudit,
			summary: summarizeTrace(samples),
			samples,
			sparseIntegration,
			webglErrors,
		};
	} finally {
		handle?.dispose();
		algorithm.dispose();
		composer.dispose();
		backend.dispose();
	}
}

function compareRolls(baseline, rolled) {
	requireCondition(baseline.samples.length === rolled.samples.length, 'Roll traces have different physical sample counts.');
	return rolled.samples.map((sample, index) => {
		const control = baseline.samples[index];
		const baselineY = control.gpu.photopicLuminanceCdPerSquareMeter;
		const rolledY = sample.gpu.photopicLuminanceCdPerSquareMeter;
		return {
			index,
			offsetDegrees: sample.offsetDegrees,
			physicalDirectionDeltaNorm: distance(control.directionModel, sample.directionModel),
			baselineFace: control.cache.face.id,
			rolledFace: sample.cache.face.id,
			photopicLuminanceDeltaCdPerSquareMeter: rolledY - baselineY,
			relativePhotopicLuminanceDelta: (rolledY - baselineY) / Math.max(Math.abs(baselineY), 1e-30),
			log10PhotopicLuminanceRatio: Math.log10(Math.max(rolledY, 1e-30) / Math.max(baselineY, 1e-30)),
		};
	});
}

function quarterTurnPhysicalDirectionKey(physicalDirectionKey) {
	const [x, y, z] = physicalDirectionKey.split(',').map(Number);
	return [x, z, -y].map((value) => Object.is(value, -0) ? 0 : value).join(',');
}

function coalescedStencilEntries(taps, keyTransform = (value) => value) {
	const weightsByPhysicalDirection = new Map();
	for (const tap of taps) {
		if (tap.weight === 0) continue;
		const physicalDirectionKey = keyTransform(tap.physicalDirectionKey);
		weightsByPhysicalDirection.set(
			physicalDirectionKey,
			(weightsByPhysicalDirection.get(physicalDirectionKey) ?? 0) + tap.weight,
		);
	}
	return [...weightsByPhysicalDirection]
		.filter(([_physicalDirectionKey, weight]) => weight !== 0)
		.map(([physicalDirectionKey, weight]) => ({physicalDirectionKey, weight}))
		.sort((left, right) => left.physicalDirectionKey.localeCompare(right.physicalDirectionKey));
}

function dotIntegerVector(left, right) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function quarterTurnVector(vector) {
	return [vector[0], vector[2], -vector[1]];
}

function equalIntegerVector(left, right) {
	return left.every((value, index) => value === right[index]);
}

function quarterTurnStoredAddress(index) {
	const address = unflattenCubedSphereW27NodeIndex(index);
	const sourceFace = CUBED_SPHERE_W27_FACES[address.faceIndex];
	const cellWidth = CUBED_SPHERE_W27_DIRECTION_DOMAIN.topology.faceWidth - 1;
	const sourceU = 2 * address.uIndex - cellWidth;
	const sourceV = 2 * address.vIndex - cellWidth;
	const cubePoint = [0, 1, 2].map((component) =>
		sourceFace.normal[component] * cellWidth
		+ sourceFace.uAxis[component] * sourceU
		+ sourceFace.vAxis[component] * sourceV);
	const rotatedPoint = quarterTurnVector(cubePoint);
	const rotatedNormal = quarterTurnVector(sourceFace.normal);
	const targetFaceIndex = CUBED_SPHERE_W27_FACES.findIndex((face) =>
		equalIntegerVector(face.normal, rotatedNormal));
	requireCondition(targetFaceIndex >= 0, 'Quarter-turn W27 face normal has no canonical target face.');
	const targetFace = CUBED_SPHERE_W27_FACES[targetFaceIndex];
	const targetU = dotIntegerVector(rotatedPoint, targetFace.uAxis);
	const targetV = dotIntegerVector(rotatedPoint, targetFace.vAxis);
	requireCondition(
		Number.isInteger(targetU) && Number.isInteger(targetV)
			&& Math.abs(targetU) <= cellWidth && Math.abs(targetV) <= cellWidth
			&& (targetU + cellWidth) % 2 === 0 && (targetV + cellWidth) % 2 === 0,
		'Quarter-turn W27 address did not land on the exact target grid.',
	);
	return flattenCubedSphereW27NodeIndex(
		targetFaceIndex,
		(targetU + cellWidth) / 2,
		(targetV + cellWidth) / 2,
	);
}

function auditQuarterTurnStoredAddressPermutation() {
	const targets = new Set();
	let fourthPowerMismatchCount = 0;
	let maximumRotatedUnitVectorComponentDelta = 0;
	for (let index = 0; index < CUBED_SPHERE_W27_DIRECTION_COUNT; index += 1) {
		const target = quarterTurnStoredAddress(index);
		targets.add(target);
		let fourthPower = index;
		for (let turn = 0; turn < 4; turn += 1) fourthPower = quarterTurnStoredAddress(fourthPower);
		if (fourthPower !== index) fourthPowerMismatchCount += 1;
		maximumRotatedUnitVectorComponentDelta = Math.max(
			maximumRotatedUnitVectorComponentDelta,
			maximumVectorComponentDelta(
				quarterTurnVector(CUBED_SPHERE_W27_UNIT_VECTORS[index]),
				CUBED_SPHERE_W27_UNIT_VECTORS[target],
			),
		);
	}
	const faceCoordinateMap = CUBED_SPHERE_W27_FACES.map((sourceFace, sourceFaceIndex) => {
		const rotatedNormal = quarterTurnVector(sourceFace.normal);
		const rotatedUAxis = quarterTurnVector(sourceFace.uAxis);
		const rotatedVAxis = quarterTurnVector(sourceFace.vAxis);
		const targetFaceIndex = CUBED_SPHERE_W27_FACES.findIndex((face) =>
			equalIntegerVector(face.normal, rotatedNormal));
		const targetFace = CUBED_SPHERE_W27_FACES[targetFaceIndex];
		return {
			sourceFaceIndex,
			sourceFaceId: sourceFace.id,
			targetFaceIndex,
			targetFaceId: targetFace.id,
			targetUFromSourceUV: [
				dotIntegerVector(rotatedUAxis, targetFace.uAxis),
				dotIntegerVector(rotatedVAxis, targetFace.uAxis),
			],
			targetVFromSourceUV: [
				dotIntegerVector(rotatedUAxis, targetFace.vAxis),
				dotIntegerVector(rotatedVAxis, targetFace.vAxis),
			],
		};
	});
	const addressBijection = targets.size === CUBED_SPHERE_W27_DIRECTION_COUNT;
	requireCondition(addressBijection, 'Quarter-turn W27 stored-address mapping is not bijective.');
	requireCondition(fourthPowerMismatchCount === 0, 'Quarter-turn W27 stored-address mapping does not satisfy P^4 = identity.');
	requireCondition(
		maximumRotatedUnitVectorComponentDelta <= Number.EPSILON,
		'Quarter-turn W27 address mapping changes a stored physical direction beyond binary64 roundoff.',
	);
	return {
		policy: 'canonical-cubed-sphere-w27-exact-quarter-turn-address-permutation-v1',
		storedAddressCount: CUBED_SPHERE_W27_DIRECTION_COUNT,
		uniqueTargetAddressCount: targets.size,
		addressBijection,
		fourthPowerMismatchCount,
		maximumRotatedUnitVectorComponentDelta,
		faceCoordinateMap,
	};
}

/** Exercise the exact full-domain +90-degree W27 address permutation without WebGL or run allocation. */
export function smokeW27QuarterTurnStoredAddressPermutation() {
	return auditQuarterTurnStoredAddressPermutation();
}

function compareQuarterTurnCubeSymmetry(baseline, quarterTurn) {
	requireCondition(quarterTurn.rollDegrees === 90, 'Quarter-turn cube control requires the +90-degree roll.');
	requireCondition(baseline.samples.length === quarterTurn.samples.length, 'Quarter-turn cube traces have different sample counts.');
	let maximumLocalCoordinateComponentDelta = 0;
	let stencilTapCountMismatchCount = 0;
	let physicalNodeKeyMismatchCount = 0;
	let maximumStencilWeightDelta = 0;
	for (let index = 0; index < baseline.samples.length; index += 1) {
		const control = baseline.samples[index];
		const rolled = quarterTurn.samples[index];
		const expectedLocal = [
			control.cache.localDirection[0],
			control.cache.localDirection[2],
			-control.cache.localDirection[1],
		];
		maximumLocalCoordinateComponentDelta = Math.max(
			maximumLocalCoordinateComponentDelta,
			maximumVectorComponentDelta(expectedLocal, rolled.cache.localDirection),
		);
		const expectedTaps = coalescedStencilEntries(
			control.cache.directionStencil.taps,
			quarterTurnPhysicalDirectionKey,
		);
		const rolledTaps = coalescedStencilEntries(rolled.cache.directionStencil.taps);
		if (expectedTaps.length !== rolledTaps.length) stencilTapCountMismatchCount += 1;
		for (let tapIndex = 0; tapIndex < Math.min(expectedTaps.length, rolledTaps.length); tapIndex += 1) {
			if (expectedTaps[tapIndex].physicalDirectionKey !== rolledTaps[tapIndex].physicalDirectionKey) {
				physicalNodeKeyMismatchCount += 1;
			}
			maximumStencilWeightDelta = Math.max(
				maximumStencilWeightDelta,
				Math.abs(expectedTaps[tapIndex].weight - rolledTaps[tapIndex].weight),
			);
		}
	}
	return {
		policy: 'cubed-sphere-quarter-turn-coordinate-permutation-v1',
		interpretation: 'The +90-degree roll must permute W27 local coordinates and tap-node addresses exactly. Path-radiance equality is measured but is deliberately not an acceptance predicate because any difference is the diagnostic signal under investigation.',
		sampleCount: baseline.samples.length,
		maximumLocalCoordinateComponentDelta,
		stencilTapCountMismatchCount,
		physicalNodeKeyMismatchCount,
		maximumStencilWeightDelta,
		storedAddressPermutation: auditQuarterTurnStoredAddressPermutation(),
	};
}

/** Execute the exact San Jose sunset-plus-one-hour pre-Color horizon trace. */
export async function runSanJosePlusOneHourHorizonTraceBrowser() {
	const [config, fixture, radiometry] = await Promise.all([
		fetch('/browser/config.json').then((response) => response.json()),
		fetch('/fixtures/subjective-globe-context-scenes-v1.json').then((response) => response.json()),
		fetch('/fixtures/g4-cpu-sun-disk-transport-v1.json').then((response) => response.json()),
	]);
	requireCondition(config.scene.id === 'sunset-plus-one-hour', 'Trace config is not the exact plus-one-hour scene.');
	requireCondition(JSON.stringify(config.w27RollDegrees) === JSON.stringify([0, 45, 90]), 'Trace requires the fixed 0/45/90-degree W27 roll controls.');
	const directions = createTraceDirections(config.scene, config.trace);
	const canvas = document.createElement('canvas');
	canvas.width = fixture.camera.widthPixels;
	canvas.height = fixture.camera.heightPixels;
	const context = canvas.getContext('webgl2', {antialias: false, preserveDrawingBuffer: true});
	requireCondition(context, 'WebGL2 is unavailable.');
	requireCondition(context.getExtension('EXT_color_buffer_float'), 'EXT_color_buffer_float is unavailable.');
	const renderer = new THREE.WebGLRenderer({canvas, context, antialias: false});
	renderer.setSize(fixture.camera.widthPixels, fixture.camera.heightPixels, false);
	try {
		const rolls = [];
		for (const rollDegrees of config.w27RollDegrees) {
			rolls.push(await traceOneRoll({renderer, context, fixture, radiometry, config, directions, rollDegrees}));
		}
		const baseline = rolls.find((roll) => roll.rollDegrees === 0);
		const quarterTurn = rolls.find((roll) => roll.rollDegrees === 90);
		requireCondition(baseline && quarterTurn, 'The baseline and +90-degree cube controls are required.');
		return {
			schemaId: 'san-jose-plus-one-hour-horizon-path-radiance-roll-trace-v2',
			inputArtifacts: {
				parent: config.parent,
				parentArtifacts: config.parentArtifacts,
				fixtureArtifacts: config.fixtureArtifacts,
			},
			scene: config.scene,
			trace: {
				...config.trace,
				interpretation: 'The same observer-local physical horizontal directions (zero elevation), centered on the plus-one-hour source azimuth, are evaluated against fresh 0/45/90-degree W27 cache rolls.',
				sourceAzimuthDegrees: degrees(Math.atan2(config.scene.directionToSourceUpEastNorth[1], config.scene.directionToSourceUpEastNorth[2])),
				sourceElevationDegrees: degrees(Math.asin(config.scene.directionToSourceUpEastNorth[0])),
			},
			rolls,
			rollComparisons: rolls
				.filter((roll) => roll !== baseline)
				.map((roll) => ({rollDegrees: roll.rollDegrees, samples: compareRolls(baseline, roll)})),
			quarterTurnCubeSymmetry: compareQuarterTurnCubeSymmetry(baseline, quarterTurn),
		};
	} finally {
		renderer.dispose();
	}
}
