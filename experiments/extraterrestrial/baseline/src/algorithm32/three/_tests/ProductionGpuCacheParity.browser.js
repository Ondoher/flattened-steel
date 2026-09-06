import * as THREE from '../../../../node_modules/three/build/three.module.js';

import { Algorithm32 } from '../../Algorithm32.js';
import { CanonicalAtmosphere } from '../../atmospheres/CanonicalAtmosphere.js';
import { DEFAULT_CACHE_CONSTRUCTION_CONTROLS } from '../../caches/CacheConstructionControlsDescriptor.js';
import { DEFAULT_CUMULATIVE_SCATTERING_FIELD } from '../../caches/SelectedCacheContract.js';
import { CacheGpuExecutor } from '../../caches/gpu/CacheGpuExecutor.js';
import { CachePassAssembler } from '../../caches/gpu/CachePassAssembler.js';
import { CANONICAL_ATMOSPHERE_CONSTANTS } from '../../constants/Algorithm32CanonicalData.js';
import { BrunetonColorDisplayModel } from '../../color/BrunetonColorDisplayModel.js';
import { sha256Descriptor } from '../../descriptors/descriptorSupport.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	FIBONACCI_34_DIRECTION_DOMAIN,
	NATIVE_48_POSITION_DOMAIN,
} from '../../domains/index.js';
import { SphericalEarthGeometry } from '../../geometries/SphericalEarthGeometry.js';
import { SpectralCalculator } from '../../implementation/SpectralCalculator.js';
import { DistantSunLightSource } from '../../light-sources/DistantSunLightSource.js';
import { DistantSunCache } from '../../light-sources/DistantSunCache.js';
import { createDistantSunCacheBuildPlan } from '../../light-sources/distant-sun-cache-plan.js';
import {
	STAR_PARITY_DISTANT_SUN_CACHE_CONSTRUCTION_CONTROLS,
} from '../../light-sources/fixtures/star-parity-consts.js';
import {
	DEFAULT_NATIVE_NUMERICAL_PROFILE,
	DEFAULT_NATIVE_PHYSICAL_PROFILE,
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../profiles/native-15-profile.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralPacket,
} from '../../quantities/index.js';
import {
	formatShaderFloat,
	formatShaderFloatArray,
	formatShaderVec3,
} from '../../shader/shaderContribution.js';
import { Algorithm32Transport } from '../../transport/Algorithm32Transport.js';
import DistanceMath from '../../utils/DistanceMath.js';
import { ThreeCacheBackend } from '../ThreeCacheBackend.js';

const POLICY_URL = '/base/src/algorithm32/fixtures/gpu-cache-parity-policy.json';
const RUNTIME_POLICY_URL = '/base/src/algorithm32/fixtures/runtime-cache-parity-policy.json';
const ORACLE_URL = '/base/src/algorithm32/light-sources/fixtures/algorithm32-production-native-n4-cpu-gpu-parity-oracle.json';
const BUILD_TIMEOUT = 15 * 60 * 1000;
const RUNTIME_PARITY_PATH_INTERVAL_COUNT = 40;
const MANUFACTURED_DIRECTION_SCALE = 0.00001;
const MANUFACTURED_POSITION_SCALE = 0.0005;
const MANUFACTURED_WAVELENGTH_SCALE = 0.03125;
const CUMULATIVE_CACHE_VALUE_KEY = 'cache.cumulativeScatteringDensity';
const CUMULATIVE_CACHE_SAMPLER = 'uCumulativeScatteringDensityCache';

const FIELD_NAME_BY_ID = {
	'distant-sun-j1': 'J1',
	'distant-sun-j-through-1': 'Jthrough1',
	'distant-sun-l1': 'L1',
	'distant-sun-j2': 'J2',
	'distant-sun-j-through-2': 'Jthrough2',
	'distant-sun-l2': 'L2',
	'distant-sun-j3': 'J3',
	'distant-sun-j-through-3': 'Jthrough3',
	'distant-sun-l3': 'L3',
	'distant-sun-j4': 'J4',
	'distant-sun-j-through-4': 'Jthrough4',
};

/** Fetch one checked JSON fixture from Karma's served repository tree. */
async function fetchJson(url) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Could not load ${url}: HTTP ${response.status}.`);
	}
	return response.json();
}

/** Return the stable paper-style name for one source-owned plan field. */
function fieldName(fieldId) {
	const name = FIELD_NAME_BY_ID[fieldId];
	if (!name) {
		throw new RangeError(`Browser parity has no checked fixture name for ${fieldId}.`);
	}
	return name;
}

/** Select the checked coordinate family for one physical field. */
function policyQueriesForField(name, policy) {
	return name.startsWith('L')
		? policy.radianceQueries
		: policy.scatteringDensityQueries;
}

/** Expand every checked physical query over all 15 declared wavelengths. */
function probeCoordinates(name, policy) {
	return policyQueriesForField(name, policy).flatMap((query) =>
		policy.wavelengthIndices.map((wavelengthIndex) => ({
			directionIndex: query.directionIndex,
			positionIndex: query.positionIndex,
			wavelengthIndex,
		})));
}

/** Select the predeclared bound for one fixture field family. */
function fieldBound(name, policy) {
	if (name.startsWith('L')) {
		return policy.bounds.pureRadiance;
	}
	if (name.startsWith('Jthrough')) {
		return policy.bounds.cumulativeScatteringDensity;
	}
	return policy.bounds.pureScatteringDensity;
}

/** Capture public renderer allocation counters around one complete build. */
function rendererResourceCounts(renderer) {
	return {
		geometries: renderer.info.memory.geometries,
		textures: renderer.info.memory.textures,
		programs: renderer.info.programs?.length ?? 0,
	};
}

/** Describe the active browser renderer without making a hardware claim. */
function rendererDescription(context) {
	const extension = context.getExtension('WEBGL_debug_renderer_info');
	return {
		threeRevision: THREE.REVISION,
		vendor: extension
			? context.getParameter(extension.UNMASKED_VENDOR_WEBGL)
			: context.getParameter(context.VENDOR),
		renderer: extension
			? context.getParameter(extension.UNMASKED_RENDERER_WEBGL)
			: context.getParameter(context.RENDERER),
		webglVersion: context.getParameter(context.VERSION),
	};
}

/**
 * Observe only public backend handles so lifecycle checks do not depend on
 * ThreeCacheBackend's private renderer records.
 */
class ObservedCacheBackend {
	constructor(backend) {
		this._backend = backend;
		this.id = backend.id;
		this.capabilities = backend.capabilities;
		this.liveFields = new Map();
		this.livePrograms = new Set();
		this.probeRequests = [];
	}

	allocateField(spec) {
		const field = this._backend.allocateField(spec);
		const dispose = field.dispose.bind(field);
		let active = true;
		field.dispose = () => {
			if (!active) {
				return;
			}
			dispose();
			active = false;
			this.liveFields.delete(field);
		};
		this.liveFields.set(field, spec.id);
		return field;
	}

	async compile(shader) {
		const program = await this._backend.compile(shader);
		const dispose = program.dispose.bind(program);
		let active = true;
		program.dispose = () => {
			if (!active) {
				return;
			}
			dispose();
			active = false;
			this.livePrograms.delete(program);
		};
		this.livePrograms.add(program);
		return program;
	}

	submitLayer(request) {
		this._backend.submitLayer(request);
	}

	createRuntimeBinding(field) {
		return this._backend.createRuntimeBinding(field);
	}

	installRuntimeBindings(request) {
		this._backend.installRuntimeBindings(request);
	}

	async readSelectedScalars(request) {
		this.probeRequests.push({
			storage: request.field.storage,
			coordinates: request.coordinates.map((coordinate) => ({ ...coordinate })),
		});
		return this._backend.readSelectedScalars(request);
	}

	dispose() {
		this._backend.dispose();
	}
}

/**
 * Construct the exact native default-profile spherical/distant owners.
 *
 * @param {UnitVector3} [directionToSource] - Supplies the selected source axis.
 */
function createNativeOwners(directionToSource = [0, 1, 0]) {
	const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralBasis: profile.spectral.basis,
	});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: profile.physical.geometry.bottomRadius,
		topRadius: profile.physical.geometry.topRadius,
		observerHeight: { value: 2, units: 'meters' },
		observerUpDirection: [1, 0, 0],
		directionToSource,
		cacheAltitudeBinCount: NATIVE_48_POSITION_DOMAIN.count,
		cacheBoundaryAltitude: NATIVE_48_POSITION_DOMAIN.nodes[0].coordinate,
		sourceTransmittanceIntervalCount:
			profile.numerical.sourcePathTransmittance.intervalCount,
	});
	const source = new DistantSunLightSource({
		directionToLight: directionToSource,
		sourceIrradiance: profile.spectral.sourceIrradianceDensity,
		angularRadius: { value: 0.004675, units: 'radians' },
	});

	return { profile, atmosphere, geometry, source };
}

/** Drain WebGL errors and return their numeric identities. */
function drainWebGlErrors(context) {
	const errors = [];
	for (let error = context.getError(); error !== context.NO_ERROR; error = context.getError()) {
		errors.push(error);
	}
	return errors;
}

/** Return the checked function block owned by one production contribution. */
function contributionBlock(contribution, id) {
	const block = contribution.functions.find((candidate) => candidate.id === id);
	if (!block) {
		throw new Error(`${contribution.id} does not provide ${id}.`);
	}
	return block.code;
}

/** Supply contribution identity without making metadata executable. */
function runtimeProbeDescriptor() {
	const section = (id) => ({
		fingerprint: `runtime-probe:${id}`,
		compatibilityTags: [],
	});
	return {
		geometry: section('geometry'),
		atmosphere: section('atmosphere'),
		lightSource: section('light-source'),
		cache: section('cache'),
		transport: section('transport'),
	};
}

/** Create one reusable fullscreen RGBA32F probe pass. */
function createFloatProbePass(renderer, width, fragmentShader, uniforms) {
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
		-1, -1, 0,
		3, -1, 0,
		-1, 3, 0,
	]), 3));
	const material = new THREE.RawShaderMaterial({
		glslVersion: THREE.GLSL3,
		vertexShader: `
precision highp float;
in vec3 position;
void main() {
	gl_Position = vec4(position, 1.0);
}
`.trim(),
		fragmentShader,
		uniforms,
		blending: THREE.NoBlending,
		depthTest: false,
		depthWrite: false,
		transparent: false,
	});
	const mesh = new THREE.Mesh(geometry, material);
	mesh.frustumCulled = false;
	const scene = new THREE.Scene();
	scene.add(mesh);
	const camera = new THREE.Camera();
	const target = new THREE.WebGLRenderTarget(width, 1, {
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		internalFormat: 'RGBA32F',
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		generateMipmaps: false,
		depthBuffer: false,
		stencilBuffer: false,
	});

	return {
		material,
		uniforms,
		render() {
			renderer.setRenderTarget(target);
			renderer.render(scene, camera);
			const pixels = new Float32Array(width * 4);
			renderer.readRenderTargetPixels(target, 0, 0, width, 1, pixels);
			return pixels;
		},
		dispose() {
			renderer.setRenderTarget(null);
			target.dispose();
			geometry.dispose();
			material.dispose();
		},
	};
}

/** Evaluate the manufactured R32F tensor at one exact scalar coordinate. */
function manufacturedCacheValue(directionIndex, positionIndex, wavelengthIndex) {
	return directionIndex * MANUFACTURED_DIRECTION_SCALE
		+ positionIndex * MANUFACTURED_POSITION_SCALE
		+ wavelengthIndex * MANUFACTURED_WAVELENGTH_SCALE;
}

/** Normalize one checked policy direction at the UnitVector API boundary. */
function normalizedPolicyDirection(direction) {
	const magnitude = Math.hypot(...direction);
	return direction.map((component) => component / magnitude);
}

/** Expand the complete runtime-policy position surface without inventing cases. */
function runtimePositionCases(runtimePolicy) {
	const cases = NATIVE_48_POSITION_DOMAIN.nodes.map((node, index) => ({
		id: `native-node-${index}`,
		role: 'exact-node',
		altitude: node.coordinate,
	}));
	for (const endpoint of runtimePolicy.positionCases.endpointClamps) {
		cases.push({
			id: endpoint.id,
			role: 'endpoint-clamp',
			altitude: endpoint.altitude,
		});
	}
	const boundaries = runtimePolicy.positionCases.formerBoundaries;
	for (let boundaryIndex = 0; boundaryIndex < boundaries.count; boundaryIndex += 1) {
		const boundaryMeters = boundaries.first.value
			+ boundaryIndex * boundaries.step.value;
		for (const offset of boundaries.offsets) {
			cases.push({
				id: `former-boundary-${boundaryIndex}-${offset.value}`,
				role: 'former-boundary',
				altitude: {
					value: boundaryMeters + offset.value,
					units: boundaries.first.units,
				},
			});
		}
	}
	return cases;
}

/** Build and fill one production-shaped R32F cache with address-sensitive values. */
async function createManufacturedCache(backend) {
	const storage = {
		format: 'R32F',
		width: DEFAULT_CUMULATIVE_SCATTERING_FIELD.layout.shape.direction,
		height: DEFAULT_CUMULATIVE_SCATTERING_FIELD.layout.shape.position,
		layers: DEFAULT_CUMULATIVE_SCATTERING_FIELD.layout.shape.wavelength,
	};
	const fieldSpec = {
		id: 'runtime-policy-manufactured-cumulative-cache',
		storage,
		descriptor: DEFAULT_CUMULATIVE_SCATTERING_FIELD,
	};
	const field = backend.allocateField(fieldSpec);
	const layerBinding = {
		spec: {
			id: 'runtime-policy-wavelength-index',
			name: 'wavelengthIndex',
			kind: 'uniform',
			shaderType: 'int',
			frequency: 'layer',
		},
		value: 0,
	};
	const program = await backend.compile({
		id: 'runtime-policy-manufactured-cache-fill',
		sourceHash: 'runtime-policy-manufactured-cache-fill-v1',
		source: `
precision highp float;
precision highp int;
uniform int wavelengthIndex;
layout(location = 0) out highp float outputValue;
void main() {
	int directionIndex = int(gl_FragCoord.x);
	int positionIndex = int(gl_FragCoord.y);
	outputValue = float(directionIndex) * ${formatShaderFloat(MANUFACTURED_DIRECTION_SCALE)}
		+ float(positionIndex) * ${formatShaderFloat(MANUFACTURED_POSITION_SCALE)}
		+ float(wavelengthIndex) * ${formatShaderFloat(MANUFACTURED_WAVELENGTH_SCALE)};
}
`.trim(),
		bindings: [layerBinding],
		output: fieldSpec,
	});

	try {
		for (let wavelengthIndex = 0; wavelengthIndex < storage.layers; wavelengthIndex += 1) {
			backend.submitLayer({
				program,
				inputs: [],
				output: field,
				layer: wavelengthIndex,
				bindings: [{ ...layerBinding, value: wavelengthIndex }],
			});
		}
	} finally {
		program.dispose();
	}

	const runtimeBinding = backend.createRuntimeBinding(field);
	let disposed = false;
	const artifact = {
		descriptor: {
			cacheKind: 'manufactured-runtime-policy-cache',
			field: DEFAULT_CUMULATIVE_SCATTERING_FIELD,
		},
		result: field,
		runtimeBindings: {
			backendId: backend.id,
			bindings: [runtimeBinding],
		},
		diagnostics: {},
		dispose() {
			if (!disposed) {
				disposed = true;
				field.dispose();
			}
		},
	};
	return { artifact, cache: new DistantSunCache(artifact) };
}

/** Compute the CPU tensor-product expectation for one policy lookup. */
function expectedManufacturedSample(geometry, positionCase, direction, wavelengthIndex) {
	const position = {
		coordinates: [
			DEFAULT_NATIVE_PHYSICAL_PROFILE.geometry.bottomRadius.value
				+ positionCase.altitude.value,
			0,
			0,
		],
		units: 'meters',
	};
	const positionStencil = geometry.resolveScatteringCachePositionStencil({
		position,
		atmosphereCoordinate: { altitude: positionCase.altitude },
	});
	const directionStencil = geometry.resolveScatteringCacheDirectionStencil({
		position,
		physicalOutgoingDirection: direction,
	});
	let value = 0;
	for (let positionTap = 0; positionTap < positionStencil.indices.length; positionTap += 1) {
		for (let directionTap = 0; directionTap < directionStencil.indices.length; directionTap += 1) {
			value += positionStencil.weights[positionTap]
				* directionStencil.weights[directionTap]
				* manufacturedCacheValue(
					directionStencil.indices[directionTap],
					positionStencil.indices[positionTap],
					wavelengthIndex,
				);
		}
	}
	return value;
}

/** Execute the complete runtime policy lookup surface through production GLSL. */
async function exerciseManufacturedRuntimeAddressing(renderer, runtimePolicy) {
	const owners = createNativeOwners([1, 0, 0]);
	const descriptor = runtimeProbeDescriptor();
	const rawBackend = new ThreeCacheBackend({ THREE, renderer });
	const backend = new ObservedCacheBackend(rawBackend);
	const { cache } = await createManufacturedCache(backend);
	const geometryContribution = owners.geometry.createShaderContribution({ descriptor });
	const sourceContribution = owners.source.createShaderContribution({ descriptor });
	const cacheContribution = cache.createShaderContribution({ descriptor });
	const positions = runtimePositionCases(runtimePolicy);
	const directions = runtimePolicy.directionCases.map((entry) => ({
		...entry,
		direction: normalizedPolicyDirection(entry.direction),
	}));
	const probeCount = positions.length * directions.length;
	const altitudeConstants = formatShaderFloatArray(
		positions.map((entry) => entry.altitude.value),
	);
	const directionConstants = directions
		.map((entry) => formatShaderVec3(entry.direction))
		.join(', ');
	const uniforms = {
		[CUMULATIVE_CACHE_SAMPLER]: { value: null },
		uDistantSunDirection: {
			value: sourceContribution.uniforms.find(
				(uniform) => uniform.name === 'uDistantSunDirection',
			)?.defaultValue,
		},
		uCameraGroundRelativePositionMeters: { value: [2, 0, 0] },
		uProbeChannelBase: { value: 0 },
	};
	const fragmentShader = `
precision highp float;
precision highp int;
const int SPECTRAL_CHANNEL_COUNT = 15;
struct SpectralValue { float c[15]; };
struct ViewRay { vec3 originMeters; vec3 direction; };
${contributionBlock(geometryContribution, 'geometry-cache-stencil-types')}
${contributionBlock(geometryContribution, 'geometry-constants')}
uniform vec3 uDistantSunDirection;
${contributionBlock(sourceContribution, 'light-source-direction')}
uniform vec3 uCameraGroundRelativePositionMeters;
${contributionBlock(geometryContribution, 'geometry-cache-stencils')}
uniform highp sampler2DArray ${CUMULATIVE_CACHE_SAMPLER};
${contributionBlock(cacheContribution, 'cache-cumulative-scattering-sample')}
const int RUNTIME_PROBE_POSITION_COUNT = ${positions.length};
const int RUNTIME_PROBE_DIRECTION_COUNT = ${directions.length};
const float RUNTIME_PROBE_ALTITUDES_METERS[${positions.length}] = float[${positions.length}](${altitudeConstants});
const vec3 RUNTIME_PROBE_DIRECTIONS[${directions.length}] = vec3[${directions.length}](${directionConstants});
uniform int uProbeChannelBase;
layout(location = 0) out highp vec4 outputValue;
void main() {
	int probeIndex = int(gl_FragCoord.x);
	int positionCaseIndex = probeIndex / RUNTIME_PROBE_DIRECTION_COUNT;
	int directionCaseIndex = probeIndex - positionCaseIndex * RUNTIME_PROBE_DIRECTION_COUNT;
	float altitudeMeters = RUNTIME_PROBE_ALTITUDES_METERS[positionCaseIndex];
	vec3 positionMeters = vec3(GEOMETRY_BOTTOM_RADIUS_METERS + altitudeMeters, 0.0, 0.0);
	CachePositionStencil positionStencil = resolveScatteringCachePositionStencil(
		AtmosphereCoordinate(altitudeMeters)
	);
	CacheDirectionStencil directionStencil = resolveScatteringCacheDirectionStencil(
		positionMeters,
		RUNTIME_PROBE_DIRECTIONS[directionCaseIndex]
	);
	SpectralValue density = sampleCumulativeScatteringDensity(positionStencil, directionStencil);
	outputValue = vec4(
		density.c[uProbeChannelBase],
		density.c[uProbeChannelBase + 1],
		density.c[uProbeChannelBase + 2],
		1.0
	);
}
`.trim();
	const pass = createFloatProbePass(renderer, probeCount, fragmentShader, uniforms);
	backend.installRuntimeBindings({
		bindings: cache.getRuntimeBindings(),
		uniforms: {
			[CUMULATIVE_CACHE_VALUE_KEY]: uniforms[CUMULATIVE_CACHE_SAMPLER],
		},
	});
	const violations = [];
	let scalarCount = 0;
	let maximumAbsoluteResidual = 0;

	try {
		for (let channelBase = 0; channelBase < 15; channelBase += 3) {
			uniforms.uProbeChannelBase.value = channelBase;
			const pixels = pass.render();
			for (let positionIndex = 0; positionIndex < positions.length; positionIndex += 1) {
				for (let directionIndex = 0; directionIndex < directions.length; directionIndex += 1) {
					const probeIndex = positionIndex * directions.length + directionIndex;
					for (let channelOffset = 0; channelOffset < 3; channelOffset += 1) {
						const wavelengthIndex = channelBase + channelOffset;
						const actual = pixels[probeIndex * 4 + channelOffset];
						const expected = expectedManufacturedSample(
							owners.geometry,
							positions[positionIndex],
							directions[directionIndex].direction,
							wavelengthIndex,
						);
						const allowed = runtimePolicy.bounds.stencilWeight.absolute
							+ runtimePolicy.bounds.stencilWeight.relative * Math.abs(expected);
						const residual = Math.abs(actual - expected);
						maximumAbsoluteResidual = Math.max(maximumAbsoluteResidual, residual);
						scalarCount += 1;
						if (!Number.isFinite(actual) || residual > allowed) {
							violations.push({
								position: positions[positionIndex].id,
								direction: directions[directionIndex].id,
								wavelengthIndex,
								expected,
								actual,
								residual,
								allowed,
							});
						}
					}
				}
			}
		}

		expect(violations)
			.withContext('Manufactured Native48/W27 runtime lookup must match CPU stencils.')
			.toEqual([]);
		expect(drainWebGlErrors(renderer.getContext())).toEqual([]);
		return {
			positionCaseCount: positions.length,
			directionCaseCount: directions.length,
			scalarCount,
			maximumAbsoluteResidual,
		};
	} finally {
		pass.dispose();
		cache.dispose();
		backend.dispose();
	}
}

/** Create the minimal shared runtime types used by production transport GLSL. */
function runtimeTransportTypes() {
	return `const int SPECTRAL_CHANNEL_COUNT = 15;
struct SpectralValue { float c[15]; };
struct ViewRay { vec3 originMeters; vec3 direction; };
struct PathBounds {
	float startDistanceMeters;
	float endDistanceMeters;
	float endpointDistanceMeters;
	bool hasSceneEndpoint;
	bool hasGroundEndpoint;
	bool valid;
};
struct MediumSample {
	SpectralValue rayleighScattering;
	SpectralValue mieScattering;
	SpectralValue scattering;
	SpectralValue extinction;
};
struct ShaderState {
	vec2 uv;
	float sceneDepth;
	float sceneHitMask;
	ViewRay ray;
	PathBounds bounds;
	MediumSample medium;
	SpectralValue pathRadiance;
	SpectralValue transmittance;
	vec3 sceneDisplayRgb;
	vec4 outputRgba;
};
SpectralValue zeroSpectral() {
	SpectralValue value;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		value.c[channelIndex] = 0.0;
	}
	return value;
}
SpectralValue oneSpectral() {
	SpectralValue value;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		value.c[channelIndex] = 1.0;
	}
	return value;
}`;
}

/** Create a complete-ray GPU probe from the production owner contributions. */
function createRuntimeTransportProbe(
	artifact,
	owners,
	backend,
	renderer,
	pathIntervalCount = RUNTIME_PARITY_PATH_INTERVAL_COUNT,
) {
	const descriptor = runtimeProbeDescriptor();
	const cache = new DistantSunCache(artifact);
	const geometryContribution = owners.geometry.createShaderContribution({ descriptor });
	const atmosphereContribution = owners.atmosphere.createShaderContribution({ descriptor });
	const sourceContribution = owners.source.createShaderContribution({ descriptor });
	const cacheContribution = cache.createShaderContribution({ descriptor });
	const transportContribution = new Algorithm32Transport().createShaderContribution({
		descriptor,
		config: {
			config: {
				execution: {
					pathIntervalCount,
				},
			},
		},
	});
	const transportCode = contributionBlock(
		transportContribution,
		'transport-evaluate-helper',
	);
	expect((transportCode.match(/sampleCumulativeScatteringDensity\s*\(/gu) ?? []).length)
		.withContext('Production transport must issue one cumulative-cache query per path point.')
		.toBe(1);
	expect(transportCode).not.toMatch(/sourceIrradiance|sampleDirect|incomingDirection/gu);
	const sourceDirection = sourceContribution.uniforms.find(
		(uniform) => uniform.name === 'uDistantSunDirection',
	)?.defaultValue;
	const transportIntervalUniform = transportContribution.uniforms.find(
		(uniform) => uniform.valueKey === 'transport.pathIntervalCount',
	);
	expect(transportIntervalUniform).toBeDefined();
	const uniforms = {
		[CUMULATIVE_CACHE_SAMPLER]: { value: null },
		uDistantSunDirection: { value: sourceDirection },
		[transportIntervalUniform.name]: {
			value: transportIntervalUniform.defaultValue,
		},
		uCameraGroundRelativePositionMeters: { value: [2, 0, 0] },
		uProbeRayOriginMeters: { value: [6360002, 0, 0] },
		uProbeRayDirection: { value: [1, 0, 0] },
		uProbeSceneTerminationMeters: { value: 0 },
		uProbeHasSceneEndpoint: { value: false },
		uProbeChannelBase: { value: 0 },
		uProbeOutputKind: { value: 0 },
	};
	const fragmentShader = `
precision highp float;
precision highp int;
${runtimeTransportTypes()}
${contributionBlock(geometryContribution, 'geometry-cache-stencil-types')}
${contributionBlock(geometryContribution, 'geometry-constants')}
${contributionBlock(atmosphereContribution, 'atmosphere-constants')}
uniform vec3 uDistantSunDirection;
${contributionBlock(sourceContribution, 'light-source-direction')}
${contributionBlock(geometryContribution, 'geometry-path-helper')}
uniform vec3 uCameraGroundRelativePositionMeters;
${contributionBlock(geometryContribution, 'geometry-cache-stencils')}
${contributionBlock(atmosphereContribution, 'atmosphere-sample-medium')}
uniform highp sampler2DArray ${CUMULATIVE_CACHE_SAMPLER};
${contributionBlock(cacheContribution, 'cache-cumulative-scattering-sample')}
uniform int ${transportIntervalUniform.name};
${transportCode}
uniform vec3 uProbeRayOriginMeters;
uniform vec3 uProbeRayDirection;
uniform float uProbeSceneTerminationMeters;
uniform bool uProbeHasSceneEndpoint;
uniform int uProbeChannelBase;
uniform int uProbeOutputKind;
layout(location = 0) out highp vec4 outputValue;
void main() {
	ShaderState state;
	state.ray = ViewRay(uProbeRayOriginMeters, normalize(uProbeRayDirection));
	state.bounds = resolveAtmospherePath(
		state.ray,
		uProbeSceneTerminationMeters,
		uProbeHasSceneEndpoint
	);
	state.pathRadiance = zeroSpectral();
	state.transmittance = oneSpectral();
	evaluatePathRadiance(state);
	if (uProbeOutputKind == 0) {
		outputValue = vec4(
			state.pathRadiance.c[uProbeChannelBase],
			state.pathRadiance.c[uProbeChannelBase + 1],
			state.pathRadiance.c[uProbeChannelBase + 2],
			1.0
		);
	} else {
		outputValue = vec4(
			state.transmittance.c[uProbeChannelBase],
			state.transmittance.c[uProbeChannelBase + 1],
			state.transmittance.c[uProbeChannelBase + 2],
			1.0
		);
	}
}
`.trim();
	const pass = createFloatProbePass(renderer, 1, fragmentShader, uniforms);
	backend.installRuntimeBindings({
		bindings: cache.getRuntimeBindings(),
		uniforms: {
			[CUMULATIVE_CACHE_VALUE_KEY]: uniforms[CUMULATIVE_CACHE_SAMPLER],
		},
	});

	return {
		render(rayCase) {
			const origin = rayCase.origin.coordinates;
			uniforms.uProbeRayOriginMeters.value = [...origin];
			uniforms.uProbeRayDirection.value = [...rayCase.direction];
			uniforms.uCameraGroundRelativePositionMeters.value = [
				...owners.geometry.resolveGroundRelativePosition(rayCase.origin).coordinates,
			];
			uniforms.uProbeSceneTerminationMeters.value =
				rayCase.endpointDistance?.value ?? 0;
			uniforms.uProbeHasSceneEndpoint.value = rayCase.termination === 'object';
			const output = {
				pathRadiance: new Float32Array(15),
				transmittance: new Float32Array(15),
			};
			for (const [outputKind, key] of ['pathRadiance', 'transmittance'].entries()) {
				uniforms.uProbeOutputKind.value = outputKind;
				for (let channelBase = 0; channelBase < 15; channelBase += 3) {
					uniforms.uProbeChannelBase.value = channelBase;
					const pixels = pass.render();
					output[key][channelBase] = pixels[0];
					output[key][channelBase + 1] = pixels[1];
					output[key][channelBase + 2] = pixels[2];
				}
			}
			return output;
		},
		dispose() {
			pass.dispose();
		},
	};
}

/** Resolve one checked ray into the CPU segment used by the transport oracle. */
function runtimePolicyRaySegment(geometry, rayCase) {
	return geometry.resolveViewRaySegment({
		origin: rayCase.origin,
		direction: rayCase.direction,
		groundBoundaryMode: 'scene-hit-owned',
		endDistance: rayCase.termination === 'object'
			? rayCase.endpointDistance
			: undefined,
	});
}

/** Create a synchronous CPU sampler over selected scalars from one R32F field. */
async function createSelectedR32fCpuCache(artifact, backend, owners, segment, points) {
	const requests = [];
	for (const point of points) {
		const distanceMeters = DistanceMath.toMeters(point.distanceAlongRay);
		const originMeters = segment.ray.origin.coordinates;
		const direction = segment.ray.direction;
		const position = {
			coordinates: [
				originMeters[0] + direction[0] * distanceMeters,
				originMeters[1] + direction[1] * distanceMeters,
				originMeters[2] + direction[2] * distanceMeters,
			],
			units: 'meters',
		};
		const atmosphereCoordinate = owners.geometry.resolveAtmosphereCoordinate(position);
		const positionStencil = owners.geometry.resolveScatteringCachePositionStencil({
			position,
			atmosphereCoordinate,
		});
		const directionStencil = owners.geometry.resolveScatteringCacheDirectionStencil({
			position,
			physicalOutgoingDirection: direction,
		});
		for (const positionIndex of positionStencil.indices) {
			for (const directionIndex of directionStencil.indices) {
				for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
					requests.push({ directionIndex, positionIndex, wavelengthIndex });
				}
			}
		}
	}
	const coordinates = [...new Map(requests.map((coordinate) => [
		`${coordinate.directionIndex}:${coordinate.positionIndex}:${coordinate.wavelengthIndex}`,
		coordinate,
	])).values()];
	const samples = [];
	for (let start = 0; start < coordinates.length; start += 4096) {
		const result = await backend.readSelectedScalars({
			field: artifact.result,
			coordinates: coordinates.slice(start, start + 4096),
		});
		samples.push(...result.samples);
	}
	const scalars = new Map(samples.map((sample) => [
		`${sample.coordinates.directionIndex}:${sample.coordinates.positionIndex}:${sample.coordinates.wavelengthIndex}`,
		sample.value,
	]));
	let sampleCount = 0;

	return {
		cache: {
			descriptor: artifact.descriptor,
			sampleResolved({ positionStencil, directionStencil }) {
				sampleCount += 1;
				const values = new Float64Array(15);
				for (let positionTap = 0; positionTap < positionStencil.indices.length; positionTap += 1) {
					for (let directionTap = 0; directionTap < directionStencil.indices.length; directionTap += 1) {
						const weight = positionStencil.weights[positionTap]
							* directionStencil.weights[directionTap];
						for (let wavelengthIndex = 0; wavelengthIndex < values.length; wavelengthIndex += 1) {
							const key = `${directionStencil.indices[directionTap]}:${positionStencil.indices[positionTap]}:${wavelengthIndex}`;
							values[wavelengthIndex] += weight * scalars.get(key);
						}
					}
				}
				return createSpectralPacket({
					basis: NATIVE_15_SPECTRAL_BASIS,
					quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
					units: SPECTRAL_UNITS.SCATTERING_DENSITY,
					semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
					values,
					provenanceIdentity: 'runtime-parity-selected-r32f-cache',
				});
			},
			dispose() {},
		},
		coordinateCount: coordinates.length,
		getSampleCount: () => sampleCount,
	};
}

/** Compare a complete ray against the CPU transport over the same R32F field. */
async function compareCompleteRayTransport(
	maximumScatteringOrder,
	rayCase,
	artifact,
	owners,
	backend,
	renderer,
	runtimePolicy,
	pathIntervalCount = RUNTIME_PARITY_PATH_INTERVAL_COUNT,
) {
	const segment = runtimePolicyRaySegment(owners.geometry, rayCase);
	const calculator = new SpectralCalculator({
		geometry: owners.geometry,
		atmosphere: owners.atmosphere,
		spectralBasis: owners.profile.spectral.basis,
	});
	const points = calculator.buildEndpointTrapezoidPathIntegrationPoints(
		segment,
		pathIntervalCount,
	);
	const selectedCache = await createSelectedR32fCpuCache(
		artifact,
		backend,
		owners,
		segment,
		points,
	);
	const cpu = calculator.computeRadiance(segment, points, {
		scatteringCache: selectedCache.cache,
	});
	expect(selectedCache.getSampleCount())
		.withContext('CPU oracle must issue one cumulative query per path point.')
		.toBe(points.length);
	const gpuProbe = createRuntimeTransportProbe(
		artifact,
		owners,
		backend,
		renderer,
		pathIntervalCount,
	);
	let gpu;
	try {
		gpu = gpuProbe.render(rayCase);
	} finally {
		gpuProbe.dispose();
	}
	const comparisons = [
		{
			name: 'completeRayRadiance',
			expected: cpu.pathRadiance.values,
			actual: gpu.pathRadiance,
			bound: runtimePolicy.bounds.completeRayRadiance,
		},
		{
			name: 'transmittance',
			expected: cpu.transmittance.values,
			actual: gpu.transmittance,
			bound: runtimePolicy.bounds.transmittance,
		},
	];
	const violations = [];
	let maximumAbsoluteResidual = 0;
	let maximumAllowedErrorRatio = 0;
	for (const comparison of comparisons) {
		for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
			const expected = comparison.expected[wavelengthIndex];
			const actual = comparison.actual[wavelengthIndex];
			const allowed = comparison.bound.absolute
				+ comparison.bound.relative * Math.abs(expected);
			const residual = Math.abs(actual - expected);
			maximumAbsoluteResidual = Math.max(maximumAbsoluteResidual, residual);
			maximumAllowedErrorRatio = Math.max(
				maximumAllowedErrorRatio,
				allowed === 0 ? (residual === 0 ? 0 : Number.POSITIVE_INFINITY) : residual / allowed,
			);
			if (!Number.isFinite(actual) || residual > allowed) {
				violations.push({
					quantity: comparison.name,
					wavelengthIndex,
					expected,
					actual,
					residual,
					allowed,
				});
			}
		}
	}
	expect(violations)
		.withContext(`N${maximumScatteringOrder} ${rayCase.id} complete-ray parity.`)
		.toEqual([]);
	expect(drainWebGlErrors(renderer.getContext())).toEqual([]);
	return {
		id: rayCase.id,
		pathPointCount: points.length,
		selectedCacheScalarCount: selectedCache.coordinateCount,
		maximumAbsoluteResidual,
		maximumAllowedErrorRatio,
	};
}

/**
 * Compile and execute the production final-view assembly against the already
 * completed opaque cache. This keeps construction parity and runtime shader
 * integration in one browser boundary without rebuilding the field.
 */
async function exerciseRuntimeCutover(
	artifact,
	owners,
	backend,
	renderer,
	maximumScatteringOrder,
	executeRender = true,
) {
	const cache = new DistantSunCache(artifact);
	const controller = {
		active: cache,
		createScatteringCache: jasmine.createSpy('createScatteringCache')
			.and.resolveTo(cache),
		dispose: jasmine.createSpy('disposeRuntimeController'),
	};
	const source = new Proxy(owners.source, {
		get(target, property) {
			if (property === 'createCacheController') {
				return () => controller;
			}
			const value = target[property];
			return typeof value === 'function' ? value.bind(target) : value;
		},
	});
	const algorithm32 = new Algorithm32({
		lightSource: source,
		atmosphere: owners.atmosphere,
		geometry: owners.geometry,
		groundBoundary: null,
		color: new BrunetonColorDisplayModel(),
		spectral: owners.profile.spectral.basis,
		execution: {
			maximumScatteringOrder,
		},
	});
	const composer = {
		passes: [],
		addPass(pass) {
			this.passes.push(pass);
		},
		removePass(pass) {
			const index = this.passes.indexOf(pass);
			if (index !== -1) {
				this.passes.splice(index, 1);
			}
		},
	};
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10);
	const readBuffer = new THREE.WebGLRenderTarget(1, 1, {
		depthBuffer: false,
		stencilBuffer: false,
	});
	const writeBuffer = new THREE.WebGLRenderTarget(1, 1, {
		depthBuffer: false,
		stencilBuffer: false,
	});
	let handle;

	try {
		drainWebGlErrors(renderer.getContext());
		handle = await algorithm32.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: { width: 1, height: 1, units: 'pixels' },
			sceneScale: { value: 1, units: 'meters-per-scene-unit' },
			cacheBackend: backend,
			logger: {
				warn(_message, error) {
					throw error;
				},
			},
		});
		expect(composer.passes.length).toBe(2);
		const [capturePass, runtimePass] = composer.passes;
		let pixel = null;
		if (executeRender) {
			await handle.prepare(renderer);
			renderer.setRenderTarget(readBuffer);
			renderer.setClearColor(0x000000, 1);
			renderer.clear(true, true, true);
			capturePass.render(renderer);
			runtimePass.render(renderer, writeBuffer, readBuffer);
			pixel = new Uint8Array(4);
			renderer.readRenderTargetPixels(writeBuffer, 0, 0, 1, 1, pixel);
		}

		expect(controller.createScatteringCache).toHaveBeenCalledWith(
			jasmine.objectContaining({ maximumScatteringOrder }),
		);
		expect(handle.getDiagnostics().status).toBe('installed');
		expect(runtimePass.getDiagnostics().renderErrorCount).toBe(0);
		if (pixel) {
			expect(runtimePass.getDiagnostics().frameCount).toBe(1);
			expect(pixel.every(Number.isFinite)).toBeTrue();
			expect(pixel[3]).toBe(255);
		} else {
			expect(runtimePass.getDiagnostics().frameCount).toBe(0);
		}
		expect(drainWebGlErrors(renderer.getContext())).toEqual([]);
		expect(renderer.info.programs.every((program) => (
			program.diagnostics?.runnable !== false
		))).toBeTrue();
	} finally {
		handle?.dispose();
		algorithm32.dispose();
		readBuffer.dispose();
		writeBuffer.dispose();
		renderer.setRenderTarget(null);
		expect(composer.passes).toEqual([]);
		expect(controller.dispose).toHaveBeenCalledTimes(1);
	}
}

/** Return one fixture field after checking its policy-owned query identity. */
function oracleField(name, oracle, policy) {
	const field = oracle.fields.find((candidate) => candidate.name === name);
	expect(field).withContext(`CPU oracle is missing ${name}.`).toBeDefined();
	if (!field) {
		throw new Error(`CPU oracle is missing ${name}.`);
	}

	const declaredQueries = policyQueriesForField(name, policy);
	expect(field.queries.length)
		.withContext(`${name} must cover every checked physical query.`)
		.toBe(declaredQueries.length);
	for (const [index, declared] of declaredQueries.entries()) {
		const query = field.queries[index];
		expect({
			positionIndex: query.positionIndex,
			altitude: query.altitude,
			directionIndex: query.directionIndex,
			cacheDirection: query.cacheDirection,
		}).withContext(`${name} query ${index} must match the checked policy.`).toEqual(declared);
		expect(query.values.length)
			.withContext(`${name} query ${index} must carry all declared wavelengths.`)
			.toBe(policy.wavelengthIndices.length);
	}
	return field;
}

/** Flatten fixture values in exactly the order used to declare GPU probes. */
function oracleValues(field, policy) {
	return field.queries.flatMap((query) =>
		policy.wavelengthIndices.map((_wavelengthIndex, offset) => query.values[offset]));
}

/** Compare every sampled scalar under its checked field-family bound. */
function compareField(name, samples, oracle, policy) {
	const field = oracleField(name, oracle, policy);
	const expectedValues = oracleValues(field, policy);
	const coordinates = probeCoordinates(name, policy);
	const bound = fieldBound(name, policy);
	const violations = [];
	let maximumAbsoluteResidual = 0;
	let maximumAllowedErrorRatio = 0;

	expect(samples.length)
		.withContext(`${name} GPU probe must return every declared scalar.`)
		.toBe(expectedValues.length);
	for (let index = 0; index < expectedValues.length; index += 1) {
		const sample = samples[index];
		const expected = expectedValues[index];
		const allowed = bound.absolute + bound.relative * Math.abs(expected);
		const residual = Math.abs(sample.value - expected);
		maximumAbsoluteResidual = Math.max(maximumAbsoluteResidual, residual);
		maximumAllowedErrorRatio = Math.max(
			maximumAllowedErrorRatio,
			allowed === 0 ? (residual === 0 ? 0 : Number.POSITIVE_INFINITY) : residual / allowed,
		);
		if (sample.coordinates.directionIndex !== coordinates[index].directionIndex
			|| sample.coordinates.positionIndex !== coordinates[index].positionIndex
			|| sample.coordinates.wavelengthIndex !== coordinates[index].wavelengthIndex
			|| !Number.isFinite(sample.value)
			|| residual > allowed) {
			violations.push({
				coordinates: coordinates[index],
				expected,
				actual: sample.value,
				residual,
				allowed,
			});
		}
	}

	expect(violations)
		.withContext(`${name} must satisfy its predeclared CPU/R32F parity bound.`)
		.toEqual([]);
	return {
		name,
		scalarCount: samples.length,
		maximumAbsoluteResidual,
		maximumAllowedErrorRatio,
	};
}

/** Capture pass probes by their stable fixture names and verify parity. */
function inspectPassProbes(plan, artifact, oracle, policy) {
	const probes = new Map();
	const comparisons = [];
	expect(artifact.diagnostics.passes.length).toBe(plan.passes.length);

	for (const [index, pass] of plan.passes.entries()) {
		const diagnostic = artifact.diagnostics.passes[index];
		const name = fieldName(pass.output);
		expect(diagnostic.id).toBe(pass.id);
		expect(diagnostic.probe)
			.withContext(`${pass.id} must be probed immediately after submission.`)
			.toBeDefined();
		if (!diagnostic.probe) {
			continue;
		}
		const samples = diagnostic.probe.samples;
		probes.set(name, samples.map((sample) => sample.value));
		comparisons.push(compareField(name, samples, oracle, policy));
	}
	return { probes, comparisons };
}

/** Assert two executions produced bit-identical binary32 probe values. */
function expectExactSharedFields(left, right, names, label) {
	const mismatches = [];
	for (const name of names) {
		const leftValues = left.get(name);
		const rightValues = right.get(name);
		expect(leftValues).withContext(`${label} left ${name} probe is missing.`).toBeDefined();
		expect(rightValues).withContext(`${label} right ${name} probe is missing.`).toBeDefined();
		if (!leftValues || !rightValues) {
			continue;
		}
		expect(rightValues.length).toBe(leftValues.length);
		for (let index = 0; index < leftValues.length; index += 1) {
			if (leftValues[index] !== rightValues[index]) {
				mismatches.push({ name, index, left: leftValues[index], right: rightValues[index] });
			}
		}
	}
	expect(mismatches).withContext(label).toEqual([]);
}

/** Execute, probe, report, and fully release one requested cache order. */
async function executeOrder(
	maximumScatteringOrder,
	renderer,
	oracle,
	policy,
	runtimePolicy,
) {
	const owners = createNativeOwners();
	const resourcesBefore = rendererResourceCounts(renderer);
	const planStart = performance.now();
	const plan = createDistantSunCacheBuildPlan({
		atmosphere: owners.atmosphere,
		geometry: owners.geometry,
		source: owners.source,
		maximumScatteringOrder,
		constructionControls:
			STAR_PARITY_DISTANT_SUN_CACHE_CONSTRUCTION_CONTROLS[
				maximumScatteringOrder
			],
	});
	const planDuration = performance.now() - planStart;
	const rawBackend = new ThreeCacheBackend({ THREE, renderer });
	const backend = new ObservedCacheBackend(rawBackend);
	const executor = new CacheGpuExecutor({
		backend,
		assembler: new CachePassAssembler(),
	});
	const probes = plan.fields.map((field) => ({
		field: field.id,
		coordinates: probeCoordinates(fieldName(field.id), policy),
	}));
	const buildStart = performance.now();
	let artifact;

	try {
		artifact = await executor.execute(plan, {
			probeReader: backend,
			probes,
			scheduler: {
				yieldControl: () => new Promise((resolve) => setTimeout(resolve, 0)),
			},
		});
		const buildDuration = performance.now() - buildStart;
		const inspection = inspectPassProbes(plan, artifact, oracle, policy);
		const constructionProbeRequests = [...backend.probeRequests];
		expect(constructionProbeRequests.length).toBe(plan.passes.length);
		const expectedProbeSize = policy.scatteringDensityQueries.length
			* policy.wavelengthIndices.length;
		for (const request of constructionProbeRequests) {
			expect(request.coordinates.length).toBe(expectedProbeSize);
			expect(request.coordinates.length)
				.withContext('Diagnostics must use bounded selected-scalar reads, not full-field readback.')
				.toBeLessThan(request.storage.width * request.storage.height * request.storage.layers);
		}
		await exerciseRuntimeCutover(
			artifact,
			owners,
			backend,
			renderer,
			maximumScatteringOrder,
		);
		const rayCaseIndex = maximumScatteringOrder === 1
			? 0
			: maximumScatteringOrder === 2 ? 1 : 2;
		const runtimeComparison = await compareCompleteRayTransport(
			maximumScatteringOrder,
			runtimePolicy.rayCases[rayCaseIndex],
			artifact,
			owners,
			backend,
			renderer,
			runtimePolicy,
		);

		expect([...backend.liveFields.values()])
			.withContext(`N${maximumScatteringOrder} must retain only its published result.`)
			.toEqual([plan.result]);
		expect(backend.livePrograms.size)
			.withContext(`N${maximumScatteringOrder} must release every construction program.`)
			.toBe(0);

		const residentStorage = artifact.result.storage.width
			* artifact.result.storage.height
			* artifact.result.storage.layers
			* 4;
		expect(artifact.diagnostics.memory.residentFieldStorage)
			.toEqual({ value: residentStorage, units: 'bytes' });
		for (const amount of Object.values(artifact.diagnostics.memory)) {
			expect(amount.units).toBe('bytes');
			expect(Number.isSafeInteger(amount.value)).toBeTrue();
			expect(amount.value).toBeGreaterThan(0);
		}
		expect(artifact.diagnostics.memory.peakFieldStorage.value)
			.toBeGreaterThanOrEqual(residentStorage);
		expect(artifact.diagnostics.memory.peakTrackedStorage.value)
			.toBeGreaterThanOrEqual(artifact.diagnostics.memory.peakFieldStorage.value);

		console.info(`Algorithm32 GPU N${maximumScatteringOrder}: ${JSON.stringify({
			profile: owners.profile.id,
			planDuration: { value: planDuration, units: 'milliseconds' },
			buildDuration: { value: buildDuration, units: 'milliseconds' },
			passDurations: artifact.diagnostics.passes.map((pass) => ({
				id: pass.id,
				duration: pass.submissionDuration,
			})),
			memory: artifact.diagnostics.memory,
			comparisons: inspection.comparisons,
			runtimeComparison,
		})}`);

		return inspection.probes;
	} finally {
		artifact?.dispose();
		executor.dispose();
		backend.dispose();
		expect(backend.liveFields.size).toBe(0);
		expect(backend.livePrograms.size).toBe(0);
		const resourcesAfter = rendererResourceCounts(renderer);
		expect(resourcesAfter.geometries).toBeLessThanOrEqual(resourcesBefore.geometries);
		expect(resourcesAfter.textures).toBeLessThanOrEqual(resourcesBefore.textures);
		expect(resourcesAfter.programs).toBeLessThanOrEqual(resourcesBefore.programs);
	}
}

describe('Algorithm32 production GPU cache parity', () => {
	let canvas;
	let context;
	let renderer;
	let policy;
	let runtimePolicy;
	let oracle;
	let n1Probes;
	let n2Probes;

	beforeAll(async () => {
		[policy, runtimePolicy, oracle] = await Promise.all([
			fetchJson(POLICY_URL),
			fetchJson(RUNTIME_POLICY_URL),
			fetchJson(ORACLE_URL),
		]);
		canvas = document.createElement('canvas');
		context = canvas.getContext('webgl2', {
			alpha: false,
			antialias: false,
			depth: false,
			preserveDrawingBuffer: false,
			stencil: false,
		});
		if (!context) {
			throw new Error('Algorithm32 production GPU parity requires WebGL2.');
		}
		renderer = new THREE.WebGLRenderer({ canvas, context });
		renderer.debug.checkShaderErrors = true;
		console.info(`Algorithm32 GPU parity renderer: ${JSON.stringify(rendererDescription(context))}`);
		console.info(`Algorithm32 browser descriptor identities: ${JSON.stringify({
			vectors: {
				empty: sha256Descriptor(''),
				abc: sha256Descriptor('abc'),
				object: sha256Descriptor({ a: 1 }),
			},
			profile: DEFAULT_NATIVE_PRODUCTION_PROFILE.contentHash,
			physical: DEFAULT_NATIVE_PHYSICAL_PROFILE.contentHash,
			numerical: DEFAULT_NATIVE_NUMERICAL_PROFILE.contentHash,
			basis: NATIVE_15_SPECTRAL_BASIS.contentHash,
			source: NATIVE_SOURCE_IRRADIANCE_DENSITY.contentHash,
			controls: DEFAULT_CACHE_CONSTRUCTION_CONTROLS.contentHash,
			positionDomain: NATIVE_48_POSITION_DOMAIN.contentHash,
			incomingDirectionDomain: FIBONACCI_34_DIRECTION_DOMAIN.contentHash,
			outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN.contentHash,
		})}`);

		expect(policy.schema).toBe('algorithm32-production-gpu-cache-parity-policy-v1');
		expect(policy.status).toBe('predeclared-before-production-gpu-output');
		expect(runtimePolicy.schema)
			.toBe('algorithm32-production-runtime-cache-parity-policy-v1');
		expect(runtimePolicy.status).toBe('predeclared-before-runtime-cache-output');
		expect(oracle.schema).toBe('algorithm32-production-native-n4-cpu-gpu-parity-oracle-v1');
		expect(DEFAULT_NATIVE_PRODUCTION_PROFILE.comparisonParity).toBeFalse();
		expect(FIBONACCI_34_DIRECTION_DOMAIN.contentHash).toBe(
			'sha256:1e9784b6b940f154cbd3d69988e23c993c24f9cc12853aac993aa4d14c12141c',
		);
		expect(DEFAULT_NATIVE_NUMERICAL_PROFILE.contentHash).toBe(
			'sha256:aeef17c3ccc59122e1375b61e440ce7786f23bb77cebd350539f9d8a8563605f',
		);
		expect(DEFAULT_NATIVE_PRODUCTION_PROFILE.contentHash).toBe(
			'sha256:aceb50e3578f622658a6f1bcadcd13ecff90f36a177022af64f69209981faea9',
		);
		expect(oracle.configuration.profile).toEqual({
			id: DEFAULT_NATIVE_PRODUCTION_PROFILE.id,
			contentHash: DEFAULT_NATIVE_PRODUCTION_PROFILE.contentHash,
			role: DEFAULT_NATIVE_PRODUCTION_PROFILE.role,
			comparisonParity: false,
		});
		expect(oracle.configuration.sourceTransmittanceIntervalCount).toBe(20);
		expect(oracle.configuration.transportIntervalCount).toBe(40);
		expect(oracle.configuration.geometry.cacheAltitudeBinCount).toBe(48);
		expect(oracle.configuration.geometry.observerHeight)
			.toEqual({ value: 2, units: 'meters' });
		expect(oracle.configuration.geometry.directionToSource).toEqual([0, 1, 0]);
		expect(oracle.configuration.lightSource.directionToLight).toEqual([0, 1, 0]);
	}, BUILD_TIMEOUT);

	afterAll(() => {
		renderer?.setRenderTarget(null);
		renderer?.dispose();
		renderer?.forceContextLoss();
		canvas?.remove();
	});

	it('matches the full checked Native48/W27 lookup surface in real WebGL', async () => {
		const report = await exerciseManufacturedRuntimeAddressing(renderer, runtimePolicy);
		expect(report.positionCaseCount).toBe(191);
		expect(report.directionCaseCount).toBe(5);
		expect(report.scalarCount).toBe(191 * 5 * 15);
		console.info(`Algorithm32 runtime addressing parity: ${JSON.stringify(report)}`);
	}, BUILD_TIMEOUT);

	it('matches complete-ray transport and installs public N1, N2, and N4 cutovers over a manufactured field', async () => {
		const owners = createNativeOwners();
		const rawBackend = new ThreeCacheBackend({ THREE, renderer });
		const backend = new ObservedCacheBackend(rawBackend);
		const manufactured = await createManufacturedCache(backend);
		try {
			const report = await compareCompleteRayTransport(
				1,
				runtimePolicy.rayCases[0],
				manufactured.artifact,
				owners,
				backend,
				renderer,
				runtimePolicy,
				4,
			);
			expect(report.pathPointCount).toBe(5);
			console.info(`Algorithm32 manufactured complete-ray parity: ${JSON.stringify(report)}`);
			for (const maximumScatteringOrder of runtimePolicy.orders) {
				await exerciseRuntimeCutover(
					manufactured.artifact,
					owners,
					backend,
					renderer,
					maximumScatteringOrder,
					maximumScatteringOrder === 1,
				);
			}
		} finally {
			manufactured.cache.dispose();
			backend.dispose();
		}
	}, BUILD_TIMEOUT);

	it('executes N1, proves Jthrough1 is an exact GPU copy, and cleans up', async () => {
		n1Probes = await executeOrder(1, renderer, oracle, policy, runtimePolicy);
		expectExactSharedFields(
			n1Probes,
			n1Probes,
			['J1'],
			'N1 J1 probe must exist.',
		);
		const j1 = n1Probes.get('J1');
		const cumulative = n1Probes.get('Jthrough1');
		expect(j1).toBeDefined();
		expect(cumulative).toBeDefined();
		if (j1 && cumulative) {
			expectExactSharedFields(
				new Map([['J1', j1]]),
				new Map([['J1', cumulative]]),
				['J1'],
				'N1 Jthrough1 must be a bit-exact GPU copy of J1.',
			);
		}
	}, BUILD_TIMEOUT);

	it('executes N2 and preserves its N1 field independently of requested order', async () => {
		n2Probes = await executeOrder(2, renderer, oracle, policy, runtimePolicy);
		expect(n1Probes).toBeDefined();
		if (n1Probes) {
			expectExactSharedFields(
				n1Probes,
				n2Probes,
				['J1'],
				'N1 and N2 must produce the same pure J1 binary32 field.',
			);
		}
	}, BUILD_TIMEOUT);

	it('executes N4, conforms every pass, preserves N2 fields, and retains only Jthrough4', async () => {
		const n4Probes = await executeOrder(4, renderer, oracle, policy, runtimePolicy);
		expect(n2Probes).toBeDefined();
		if (n2Probes) {
			expectExactSharedFields(
				n2Probes,
				n4Probes,
				['J1', 'L1', 'J2', 'Jthrough2'],
				'N2 and N4 shared fields must be bit-identical and order-independent.',
			);
		}
	}, BUILD_TIMEOUT);
});
