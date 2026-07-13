import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

import {Algorithm32} from '../candidate/src/algorithm32/Algorithm32.js';
import {CanonicalAtmosphere} from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import {CUMULATIVE_SCATTERING_CACHE_VALUE_KEY} from
	'../candidate/src/algorithm32/caches/gpu/cacheRuntimeContracts.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
	FIGURE1_DISPLAY_CONSTANTS,
} from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import {BrunetonColorDisplayModel} from
	'../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import {SphericalEarthGeometry} from
	'../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import {sha256Descriptor} from
	'../candidate/src/algorithm32/descriptors/descriptorSupport.js';
import {DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION} from
	'../candidate/src/algorithm32/light-sources/consts.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	SpectralPacket,
} from '../candidate/src/algorithm32/quantities/index.js';
import {Algorithm32ShaderAssembler} from
	'../candidate/src/algorithm32/shader/Algorithm32ShaderAssembler.js';
import {
	createShaderContribution,
	createShaderSourceBlock,
	createShaderTextureDescriptor,
	createShaderUniformDescriptor,
} from '../candidate/src/algorithm32/shader/shaderContribution.js';
import {ThreeCacheBackend} from
	'../candidate/src/algorithm32/three/ThreeCacheBackend.js';
import {ControlledDistantSunLightSource} from
	'./ControlledDistantSunLightSource.js';
import {
	REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_PROVENANCE,
	REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_SELECTION,
	auditReflectionCompletedFibonacci68Control,
} from './ReflectionCompletedFibonacci68Control.js';

const TRACE_DIRECTION_VALUE_KEY = 'diagnostic.fibonacciReflectionTraceDirections';
const TRACE_OUTPUT_CHANNEL_VALUE_KEY = 'diagnostic.fibonacciReflectionTraceOutputChannel';
const TRACE_DIRECTION_UNIFORM_NAME = 'uFibonacciReflectionTraceDirections';
const TRACE_OUTPUT_CHANNEL_UNIFORM_NAME = 'uFibonacciReflectionTraceOutputChannel';
const SUN_ANGULAR_RADIUS_RADIANS = 0.004675;
const PARITY_OFFSETS_DEGREES = [
	-60,
	-58,
	-52,
	-45,
	-31,
	0,
	31,
	45,
	52,
	58,
	60,
];
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

function bytesToHex(bytes) {
	return [...bytes]
		.map((value) => value.toString(16).padStart(2, '0'))
		.join('');
}

async function fetchJsonWithIdentity(url, expected) {
	const response = await fetch(url);
	requireCondition(response.ok, `Failed to fetch ${url}.`);
	const bytes = await response.arrayBuffer();
	const sha256 = bytesToHex(new Uint8Array(
		await crypto.subtle.digest('SHA-256', bytes),
	));
	requireCondition(
		bytes.byteLength === expected.byteLength,
		`${url} byte length changed from copied evidence.`,
	);
	requireCondition(
		sha256 === expected.sha256,
		`${url} SHA-256 changed from copied evidence.`,
	);
	return {
		identity: {sha256, byteLength: bytes.byteLength},
		value: JSON.parse(new TextDecoder().decode(bytes)),
	};
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

function traceDirectionAtOffset(scene, offsetDegrees, index) {
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
	requireCondition(
		trace.elevationDegrees === 0,
		'The reflection control traces the observer-local geometric horizontal only.',
	);
	const count = Math.round(
		(trace.maximumOffsetDegrees - trace.minimumOffsetDegrees)
			/ trace.stepDegrees,
	) + 1;
	requireCondition(count === 361, 'The reflection control requires exactly 361 rays.');
	return Array.from({length: count}, (_unused, index) =>
		traceDirectionAtOffset(
			scene,
			trace.minimumOffsetDegrees + trace.stepDegrees * index,
			index,
		));
}

function createDirectionTexture(directions) {
	const values = new Float32Array(directions.length * 4);
	for (const direction of directions) {
		values.set(direction.directionModel, direction.index * 4);
		values[direction.index * 4 + 3] = 1;
	}
	const texture = new THREE.DataTexture(
		values,
		directions.length,
		1,
		THREE.RGBAFormat,
		THREE.FloatType,
	);
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
	vec3 direction = normalize(texelFetch(
		${TRACE_DIRECTION_UNIFORM_NAME},
		ivec2(directionIndex, 0),
		0
	).xyz);
	return ViewRay(uCameraWorldPositionMeters, direction);
}`;
}

function traceOutputContribution() {
	return createShaderContribution({
		id: 'diagnostic-fibonacci-reflection-path-radiance-output',
		owner: 'color',
		provides: ['diagnostic.fibonacciReflectionPathRadianceOutput'],
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
			'diagnostic-fibonacci-reflection-output-main',
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
	requireCondition(initialStateReplacementCount === 1, 'Expected one runtime initial-state block.');
	requireCondition(rayReplacementCount === 1, 'Expected one geometry ray block.');
	contributions.push(traceOutputContribution());
	return new Algorithm32ShaderAssembler().assemble({
		descriptor: sourceAssembly.descriptor,
		contributions,
		mainRequiredSymbols: [
			...sourceAssembly.validationReport.requiredSymbols,
			'diagnostic.fibonacciReflectionPathRadianceOutput',
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

function stripVersion(source) {
	return source.replace(/^#version\s+300\s+es\s*/u, '');
}

async function readGpuPathRadiance({renderer, sourceAssembly, sourceRuntime, directions}) {
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
	geometry.setAttribute('position', new THREE.BufferAttribute(
		new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]),
		3,
	));
	const traceScene = new THREE.Scene();
	const mesh = new THREE.Mesh(geometry, material);
	mesh.frustumCulled = false;
	traceScene.add(mesh);
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
	const spectra = Array.from(
		{length: directions.length},
		() => new Float32Array(NATIVE_15_SPECTRAL_BASIS.channelCount),
	);
	try {
		if (typeof renderer.compileAsync === 'function') {
			await renderer.compileAsync(traceScene, camera);
		} else {
			renderer.compile(traceScene, camera);
		}
		const pixels = new Float32Array(directions.length * 4);
		for (let channelIndex = 0;
			channelIndex < NATIVE_15_SPECTRAL_BASIS.channelCount;
			channelIndex += 1) {
			uniforms[TRACE_OUTPUT_CHANNEL_UNIFORM_NAME].value = channelIndex;
			renderer.setRenderTarget(target);
			renderer.render(traceScene, camera);
			renderer.readRenderTargetPixels(
				target,
				0,
				0,
				directions.length,
				1,
				pixels,
			);
			for (let directionIndex = 0;
				directionIndex < directions.length;
				directionIndex += 1) {
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
	return {
		indices: Array.from(stencil.indices),
		weights: Array.from(stencil.weights),
	};
}

function collectReferenceRequests(algorithm, liveCache, directions) {
	let activeRequests = null;
	const requestsByDirection = [];
	const zero = new Float64Array(NATIVE_15_SPECTRAL_BASIS.channelCount);
	const recordingCache = {
		descriptor: liveCache.descriptor,
		sampleResolved(request) {
			requireCondition(activeRequests !== null, 'Reference lookup escaped its trace ray.');
			activeRequests.push({
				positionStencil: cloneStencil(request.positionStencil),
				directionStencil: cloneStencil(request.directionStencil),
			});
			return scatteringPacket(zero, 'fibonacci-reflection-coordinate-discovery');
		},
		dispose() {},
	};
	for (const direction of directions) {
		activeRequests = [];
		const evaluation = algorithm.evaluate({
			viewRay: {direction: direction.directionModel},
			scatteringCache: recordingCache,
			pathIntervalCount: 15,
		});
		requireCondition(
			activeRequests.length === evaluation.pathIntegrationPoints.length,
			'Reference cache-request count changed.',
		);
		requestsByDirection.push(activeRequests);
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
					for (let channelIndex = 0;
						channelIndex < NATIVE_15_SPECTRAL_BASIS.channelCount;
						channelIndex += 1) {
						const key = cacheScalarKey(
							directionIndex,
							positionIndex,
							channelIndex,
						);
						if (!byKey.has(key)) {
							byKey.set(key, {directionIndex, positionIndex, channelIndex});
						}
					}
				}
			}
		}
	}
	return [...byKey.values()];
}

async function readCacheCoordinates({renderer, cacheTexture, coordinates}) {
	const context = renderer.getContext();
	const width = Math.min(
		4096,
		context.getParameter(context.MAX_TEXTURE_SIZE),
		Math.max(1, coordinates.length),
	);
	const height = Math.ceil(coordinates.length / width);
	const encoded = new Float32Array(width * height * 4);
	for (let index = 0; index < coordinates.length; index += 1) {
		const coordinate = coordinates[index];
		encoded.set([
			coordinate.directionIndex,
			coordinate.positionIndex,
			coordinate.channelIndex,
			1,
		], index * 4);
	}
	const coordinateTexture = new THREE.DataTexture(
		encoded,
		width,
		height,
		THREE.RGBAFormat,
		THREE.FloatType,
	);
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
uniform sampler2D uControlCacheCoordinates;
uniform sampler2DArray uControlCumulativeCache;
void main() {
	ivec2 pixel = ivec2(gl_FragCoord.xy);
	ivec3 coordinate = ivec3(floor(texelFetch(
		uControlCacheCoordinates,
		pixel,
		0
	).xyz + vec3(0.5)));
	outColor = vec4(texelFetch(uControlCumulativeCache, coordinate, 0).r, 0.0, 0.0, 1.0);
}`,
		uniforms: {
			uControlCacheCoordinates: {value: coordinateTexture},
			uControlCumulativeCache: {value: cacheTexture},
		},
		depthTest: false,
		depthWrite: false,
		blending: THREE.NoBlending,
	});
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(
		new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]),
		3,
	));
	const traceScene = new THREE.Scene();
	const mesh = new THREE.Mesh(geometry, material);
	mesh.frustumCulled = false;
	traceScene.add(mesh);
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
		if (typeof renderer.compileAsync === 'function') {
			await renderer.compileAsync(traceScene, camera);
		} else {
			renderer.compile(traceScene, camera);
		}
		renderer.setRenderTarget(target);
		renderer.render(traceScene, camera);
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
		values.set(
			cacheScalarKey(
				coordinate.directionIndex,
				coordinate.positionIndex,
				coordinate.channelIndex,
			),
			pixels[index * 4],
		);
	}
	return {values, packedTexture: {width, height}, scalarCount: coordinates.length};
}

function createReadbackCpuCache(liveCache, values, provenanceIdentity) {
	return {
		descriptor: liveCache.descriptor,
		sampleResolved(request) {
			const result = new Float64Array(NATIVE_15_SPECTRAL_BASIS.channelCount);
			for (let positionTap = 0;
				positionTap < request.positionStencil.indices.length;
				positionTap += 1) {
				for (let directionTap = 0;
					directionTap < request.directionStencil.indices.length;
					directionTap += 1) {
					const positionIndex = request.positionStencil.indices[positionTap];
					const directionIndex = request.directionStencil.indices[directionTap];
					const weight = request.positionStencil.weights[positionTap]
						* request.directionStencil.weights[directionTap];
					for (let channelIndex = 0;
						channelIndex < result.length;
						channelIndex += 1) {
						const value = values.get(cacheScalarKey(
							directionIndex,
							positionIndex,
							channelIndex,
						));
						requireCondition(value !== undefined, 'CPU parity requested an ungathered scalar.');
						result[channelIndex] += weight * value;
					}
				}
			}
			return scatteringPacket(result, provenanceIdentity);
		},
		dispose() {},
	};
}

function packetPhotometry(color, packet) {
	return {
		pathRadiance: Array.from(packet.values),
		photopicLuminanceCdPerSquareMeter:
			color.radianceToPhotopicLuminance(packet),
	};
}

function comparison(left, right) {
	let maximumAbsolute = 0;
	let maximumRelative = 0;
	for (let index = 0; index < left.length; index += 1) {
		const absolute = Math.abs(left[index] - right[index]);
		maximumAbsolute = Math.max(maximumAbsolute, absolute);
		maximumRelative = Math.max(
			maximumRelative,
			absolute / Math.max(Math.abs(left[index]), 1e-30),
		);
	}
	return {maximumAbsolute, maximumRelative};
}

function summarizeMirrorPairs(samples) {
	requireCondition(samples.length % 2 === 1, 'Mirror summary requires one center ray.');
	const centerIndex = (samples.length - 1) / 2;
	const pairs = [];
	let maximumNormalizedLuminanceAsymmetry = 0;
	let squaredLuminanceDifference = 0;
	let squaredLuminanceMagnitude = 0;
	let maximumNormalizedSpectralAsymmetry = 0;
	for (let delta = 1; delta <= centerIndex; delta += 1) {
		const negative = samples[centerIndex - delta];
		const positive = samples[centerIndex + delta];
		requireCondition(
			Math.abs(positive.offsetDegrees + negative.offsetDegrees) <= 1e-12,
			'Mirror trace offsets are not exact opposites.',
		);
		const negativeY = negative.photopicLuminanceCdPerSquareMeter;
		const positiveY = positive.photopicLuminanceCdPerSquareMeter;
		const luminanceDifference = positiveY - negativeY;
		const luminanceMeanMagnitude = 0.5
			* (Math.abs(positiveY) + Math.abs(negativeY));
		const normalizedLuminanceAsymmetry = Math.abs(luminanceDifference)
			/ Math.max(luminanceMeanMagnitude, 1e-30);
		let pairMaximumSpectralAsymmetry = 0;
		for (let channelIndex = 0;
			channelIndex < NATIVE_15_SPECTRAL_BASIS.channelCount;
			channelIndex += 1) {
			const negativeValue = negative.pathRadiance[channelIndex];
			const positiveValue = positive.pathRadiance[channelIndex];
			pairMaximumSpectralAsymmetry = Math.max(
				pairMaximumSpectralAsymmetry,
				Math.abs(positiveValue - negativeValue)
					/ Math.max(
						0.5 * (Math.abs(positiveValue) + Math.abs(negativeValue)),
						1e-30,
					),
			);
		}
		maximumNormalizedLuminanceAsymmetry = Math.max(
			maximumNormalizedLuminanceAsymmetry,
			normalizedLuminanceAsymmetry,
		);
		maximumNormalizedSpectralAsymmetry = Math.max(
			maximumNormalizedSpectralAsymmetry,
			pairMaximumSpectralAsymmetry,
		);
		squaredLuminanceDifference += luminanceDifference * luminanceDifference;
		squaredLuminanceMagnitude += 0.5
			* (positiveY * positiveY + negativeY * negativeY);
		pairs.push({
			absoluteOffsetDegrees: positive.offsetDegrees,
			negativePhotopicLuminanceCdPerSquareMeter: negativeY,
			positivePhotopicLuminanceCdPerSquareMeter: positiveY,
			signedLuminanceDifferenceCdPerSquareMeter: luminanceDifference,
			normalizedLuminanceAsymmetry,
			maximumNormalizedSpectralAsymmetry: pairMaximumSpectralAsymmetry,
		});
	}
	const brightest = samples.reduce((selected, sample) =>
		sample.photopicLuminanceCdPerSquareMeter
			> selected.photopicLuminanceCdPerSquareMeter
			? sample
			: selected);
	return {
		policy: 'source-local-y-plane-paired-horizontal-radiance-symmetry-v1',
		pairCount: pairs.length,
		center: samples[centerIndex],
		brightest: {
			offsetDegrees: brightest.offsetDegrees,
			photopicLuminanceCdPerSquareMeter:
				brightest.photopicLuminanceCdPerSquareMeter,
		},
		maximumNormalizedLuminanceAsymmetry,
		normalizedLuminanceMirrorRmse: Math.sqrt(
			squaredLuminanceDifference
				/ Math.max(squaredLuminanceMagnitude, 1e-60),
		),
		maximumNormalizedSpectralAsymmetry,
		pairs,
	};
}

function normalizeParentRollZeroSamples(parentRoll) {
	return parentRoll.samples.map((sample) => ({
		index: sample.index,
		offsetDegrees: sample.offsetDegrees,
		azimuthDegrees: sample.azimuthDegrees,
		directionModel: sample.directionModel,
		pathRadiance: sample.gpu.pathRadiance,
		photopicLuminanceCdPerSquareMeter:
			sample.gpu.photopicLuminanceCdPerSquareMeter,
	}));
}

function compareParentN4Oracle(parentSamples, freshSamples, tolerance) {
	requireCondition(
		parentSamples.length === freshSamples.length,
		'Parent and fresh FIB34 N4 traces have different sample counts.',
	);
	let coordinateMismatchCount = 0;
	let maximumDirectionComponentDelta = 0;
	let maximumAbsoluteSpectralResidual = 0;
	let maximumRelativeSpectralResidual = 0;
	let maximumToleranceRatio = 0;
	let spectralFailureCount = 0;
	let maximumAbsoluteLuminanceResidual = 0;
	let worstSpectralResidual = null;
	for (let sampleIndex = 0; sampleIndex < parentSamples.length; sampleIndex += 1) {
		const parent = parentSamples[sampleIndex];
		const fresh = freshSamples[sampleIndex];
		if (parent.index !== fresh.index
			|| parent.offsetDegrees !== fresh.offsetDegrees
			|| parent.azimuthDegrees !== fresh.azimuthDegrees) {
			coordinateMismatchCount += 1;
		}
		for (let component = 0; component < 3; component += 1) {
			maximumDirectionComponentDelta = Math.max(
				maximumDirectionComponentDelta,
				Math.abs(parent.directionModel[component] - fresh.directionModel[component]),
			);
		}
		maximumAbsoluteLuminanceResidual = Math.max(
			maximumAbsoluteLuminanceResidual,
			Math.abs(
				parent.photopicLuminanceCdPerSquareMeter
					- fresh.photopicLuminanceCdPerSquareMeter,
			),
		);
		for (let channelIndex = 0;
			channelIndex < NATIVE_15_SPECTRAL_BASIS.channelCount;
			channelIndex += 1) {
			const parentValue = parent.pathRadiance[channelIndex];
			const freshValue = fresh.pathRadiance[channelIndex];
			const residual = Math.abs(freshValue - parentValue);
			const relativeResidual = residual / Math.max(Math.abs(parentValue), 1e-30);
			const allowed = tolerance.absolute
				+ tolerance.relative * Math.abs(parentValue);
			const toleranceRatio = residual / Math.max(allowed, 1e-30);
			maximumAbsoluteSpectralResidual = Math.max(
				maximumAbsoluteSpectralResidual,
				residual,
			);
			maximumRelativeSpectralResidual = Math.max(
				maximumRelativeSpectralResidual,
				relativeResidual,
			);
			maximumToleranceRatio = Math.max(maximumToleranceRatio, toleranceRatio);
			if (residual > allowed) spectralFailureCount += 1;
			if (worstSpectralResidual === null
				|| toleranceRatio > worstSpectralResidual.toleranceRatio) {
				worstSpectralResidual = {
					sampleIndex,
					offsetDegrees: fresh.offsetDegrees,
					channelIndex,
					parentValue,
					freshValue,
					residual,
					allowed,
					toleranceRatio,
				};
			}
		}
	}
	return {
		policy: 'fresh-fibonacci34-n4-versus-verified-000469-roll0-all-rays-all-native-channels-v1',
		tolerance,
		sampleCount: parentSamples.length,
		spectralScalarCount:
			parentSamples.length * NATIVE_15_SPECTRAL_BASIS.channelCount,
		coordinateMismatchCount,
		maximumDirectionComponentDelta,
		maximumAbsoluteSpectralResidual,
		maximumRelativeSpectralResidual,
		maximumToleranceRatio,
		spectralFailureCount,
		maximumAbsoluteLuminanceResidual,
		worstSpectralResidual,
	};
}

function auditTraceDirectionMirrorGeometry(geometry, directions) {
	requireCondition(directions.length % 2 === 1, 'Direction mirror audit requires one center ray.');
	const centerIndex = (directions.length - 1) / 2;
	let maximumSourceLocalMirrorComponentError = 0;
	for (let delta = 1; delta <= centerIndex; delta += 1) {
		const negative = geometry.expressScatteringCacheDirection({
			physicalOutgoingDirection: directions[centerIndex - delta].directionModel,
		});
		const positive = geometry.expressScatteringCacheDirection({
			physicalOutgoingDirection: directions[centerIndex + delta].directionModel,
		});
		maximumSourceLocalMirrorComponentError = Math.max(
			maximumSourceLocalMirrorComponentError,
			Math.abs(positive[0] - negative[0]),
			Math.abs(positive[1] + negative[1]),
			Math.abs(positive[2] - negative[2]),
		);
	}
	return {
		policy: 'same-physical-horizontal-rays-are-source-local-y-reflection-pairs-v1',
		pairCount: centerIndex,
		maximumSourceLocalMirrorComponentError,
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

async function traceOneCondition({
	renderer,
	context,
	fixture,
	radiometry,
	config,
	directions,
	condition,
}) {
	const width = fixture.camera.widthPixels;
	const height = fixture.camera.heightPixels;
	const composer = new EffectComposer(renderer);
	composer.setSize(width, height);
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	const camera = new THREE.PerspectiveCamera(
		fixture.camera.verticalFovDegrees,
		width / height,
		0.1,
		400000,
	);
	configureCamera(camera, config.scene, fixture.camera.observerHeightMeters);
	composer.addPass(new RenderPass(scene, camera));
	const directionToSun = directionFromUpEastNorth(
		config.scene.directionToSourceUpEastNorth,
	);
	const geometry = new SphericalEarthGeometry({
		...radiometry.geometry,
		observerHeight: {
			value: fixture.camera.observerHeightMeters,
			units: 'meters',
		},
		observerUpDirection: [0, 0, 1],
		sceneFrame: {kind: 'observer-local'},
		directionToSource: directionToSun,
		cacheAltitudeBinCount: 48,
	});
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const selection = condition.quadratureId === 'fibonacci-34'
		? DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION
		: REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_SELECTION;
	const lightSource = new ControlledDistantSunLightSource({
		directionToLight: directionToSun,
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: {value: SUN_ANGULAR_RADIUS_RADIANS, units: 'radians'},
	}, {domainSelection: selection});
	const color = new BrunetonColorDisplayModel({
		displayConstants: FIGURE1_DISPLAY_CONSTANTS,
	});
	const algorithm = new Algorithm32({
		geometry,
		atmosphere,
		lightSource,
		color,
		spectral: NATIVE_15_SPECTRAL_BASIS,
		execution: {
			maximumScatteringOrder: condition.maximumScatteringOrder,
			pathIntervalCount: 15,
		},
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
				'geometry.inverseProjectionMatrix':
					camera.projectionMatrixInverse.clone(),
				'geometry.inverseViewMatrix': camera.matrixWorld.clone(),
				'geometry.cameraWorldPosition': new THREE.Vector3(
					0,
					0,
					radiometry.geometry.bottomRadius.value
						+ fixture.camera.observerHeightMeters,
				),
				'geometry.cameraGroundRelativePosition': new THREE.Vector3(
					0,
					0,
					fixture.camera.observerHeightMeters,
				),
				'light.directionToAtmosphericSource':
					new THREE.Vector3(...directionToSun),
			},
		});
		await handle.prepare(renderer);
		composer.render();
		const buildResult = handle._buildResult;
		requireCondition(buildResult.cache, 'The cumulative scattering cache was not built.');
		requireCondition(buildResult.assembly, 'The runtime assembly is unavailable.');
		requireCondition(buildResult.runtime, 'The runtime bindings are unavailable.');
		requireCondition(
			lightSource.controlledBuildRecords.length === 1,
			'Expected exactly one controlled cache construction.',
		);
		const gpu = await readGpuPathRadiance({
			renderer,
			sourceAssembly: buildResult.assembly,
			sourceRuntime: buildResult.runtime,
			directions,
		});
		const samples = directions.map((direction, index) => {
			const packet = radiancePacket(
				gpu.spectra[index],
				`san-jose-fibonacci-reflection-${condition.quadratureId}-n${condition.maximumScatteringOrder}`,
			);
			return {...direction, ...packetPhotometry(color, packet)};
		});
		const parityDirections = PARITY_OFFSETS_DEGREES.map((offsetDegrees) => {
			const direction = directions.find((candidate) =>
				candidate.offsetDegrees === offsetDegrees);
			requireCondition(direction, `Parity offset ${offsetDegrees} is absent.`);
			return direction;
		});
		const requests = collectReferenceRequests(
			algorithm,
			buildResult.cache,
			parityDirections,
		);
		const coordinates = requiredCacheCoordinates(requests);
		const textureDescriptor = buildResult.assembly.contributions
			.flatMap((contribution) => contribution.textures)
			.find((texture) =>
				texture.valueKey === CUMULATIVE_SCATTERING_CACHE_VALUE_KEY);
		requireCondition(textureDescriptor, 'The cumulative-cache texture descriptor is absent.');
		const cacheTexture = buildResult.runtime.getUniformValue(textureDescriptor.name);
		const readback = await readCacheCoordinates({
			renderer,
			cacheTexture,
			coordinates,
		});
		const cpuCache = createReadbackCpuCache(
			buildResult.cache,
			readback.values,
			`san-jose-fibonacci-reflection-readback-${condition.quadratureId}-n${condition.maximumScatteringOrder}`,
		);
		const parity = parityDirections.map((direction) => {
			const cpuPacket = algorithm.evaluate({
				viewRay: {direction: direction.directionModel},
				scatteringCache: cpuCache,
				pathIntervalCount: 15,
			}).pathRadiance;
			const gpuPacket = radiancePacket(
				gpu.spectra[direction.index],
				`san-jose-fibonacci-reflection-gpu-parity-${condition.quadratureId}-n${condition.maximumScatteringOrder}`,
			);
			return {
				offsetDegrees: direction.offsetDegrees,
				cpu: packetPhotometry(color, cpuPacket),
				gpu: packetPhotometry(color, gpuPacket),
				residual: comparison(cpuPacket.values, gpuPacket.values),
			};
		});
		const maximumCpuGpuAbsoluteResidual = Math.max(
			...parity.map((entry) => entry.residual.maximumAbsolute),
		);
		const maximumCpuGpuRelativeResidual = Math.max(
			...parity.map((entry) => entry.residual.maximumRelative),
		);
		const webglErrors = [];
		for (let error = context.getError();
			error !== context.NO_ERROR;
			error = context.getError()) {
			webglErrors.push(error);
		}
		return {
			id: condition.id,
			quadratureId: condition.quadratureId,
			maximumScatteringOrder: condition.maximumScatteringOrder,
			construction: lightSource.controlledBuildRecords[0],
			physicalOwnerDescriptors: {
				source: lightSource.describe(),
				atmosphere: atmosphere.describe(),
				geometry: geometry.describe(),
				boundary: buildResult.cache.descriptor
					.constructionIdentities.boundary,
			},
			cacheDescriptor: {
				id: buildResult.cache.descriptor.id,
				contentHash: buildResult.cache.descriptor.contentHash,
				field: {
					id: buildResult.cache.descriptor.field.id,
					contentHash: buildResult.cache.descriptor.field.contentHash,
				},
				incomingDirectionDomain: {
					id: buildResult.cache.descriptor.incomingDirectionDomain.id,
					contentHash:
						buildResult.cache.descriptor.incomingDirectionDomain.contentHash,
				},
				controls: {
					id: buildResult.cache.descriptor.controls.id,
					contentHash: buildResult.cache.descriptor.controls.contentHash,
				},
				constructionIdentities:
					buildResult.cache.descriptor.constructionIdentities,
			},
			runtimeDescriptorFingerprint:
				buildResult.assembly.descriptor.fingerprint,
			sourceAssemblyHash: buildResult.assembly.sourceHash,
			traceAssemblyHash: gpu.assembly.sourceHash,
			cacheReadback: {
				scalarCount: readback.scalarCount,
				packedTexture: readback.packedTexture,
			},
			traceDirectionMirrorGeometry:
				auditTraceDirectionMirrorGeometry(geometry, directions),
			mirror: summarizeMirrorPairs(samples),
			samples,
			cpuGpuParity: {
				policy: 'reference-evaluate-over-exact-gather-of-live-cumulative-r32f-field-v1',
				pathIntervalCount: 15,
				offsetsDegrees: PARITY_OFFSETS_DEGREES,
				maximumAbsoluteResidual: maximumCpuGpuAbsoluteResidual,
				maximumRelativeResidual: maximumCpuGpuRelativeResidual,
				samples: parity,
			},
			webglErrors,
		};
	} finally {
		handle?.dispose();
		algorithm.dispose();
		composer.dispose();
		backend.dispose();
	}
}

function compareDenseTraces(left, right, tolerance) {
	requireCondition(left.samples.length === right.samples.length, 'Dense trace lengths differ.');
	let maximumAbsoluteLuminanceDifference = 0;
	let maximumRelativeLuminanceDifference = 0;
	let maximumAbsoluteSpectralDifference = 0;
	let maximumRelativeSpectralDifference = 0;
	let maximumSpectralToleranceRatio = 0;
	let spectralToleranceFailureCount = 0;
	let worstSpectralToleranceResidual = null;
	for (let index = 0; index < left.samples.length; index += 1) {
		const leftSample = left.samples[index];
		const rightSample = right.samples[index];
		const absolute = Math.abs(
			rightSample.photopicLuminanceCdPerSquareMeter
				- leftSample.photopicLuminanceCdPerSquareMeter,
		);
		maximumAbsoluteLuminanceDifference = Math.max(
			maximumAbsoluteLuminanceDifference,
			absolute,
		);
		maximumRelativeLuminanceDifference = Math.max(
			maximumRelativeLuminanceDifference,
			absolute / Math.max(
				Math.abs(leftSample.photopicLuminanceCdPerSquareMeter),
				1e-30,
			),
		);
		for (let channelIndex = 0;
			channelIndex < NATIVE_15_SPECTRAL_BASIS.channelCount;
			channelIndex += 1) {
			const leftValue = leftSample.pathRadiance[channelIndex];
			const rightValue = rightSample.pathRadiance[channelIndex];
			const residual = Math.abs(rightValue - leftValue);
			const relative = residual / Math.max(Math.abs(leftValue), 1e-30);
			const allowed = tolerance.absolute
				+ tolerance.relative * Math.abs(leftValue);
			const toleranceRatio = residual / Math.max(allowed, 1e-30);
			maximumAbsoluteSpectralDifference = Math.max(
				maximumAbsoluteSpectralDifference,
				residual,
			);
			maximumRelativeSpectralDifference = Math.max(
				maximumRelativeSpectralDifference,
				relative,
			);
			maximumSpectralToleranceRatio = Math.max(
				maximumSpectralToleranceRatio,
				toleranceRatio,
			);
			if (residual > allowed) spectralToleranceFailureCount += 1;
			if (worstSpectralToleranceResidual === null
				|| toleranceRatio
					> worstSpectralToleranceResidual.toleranceRatio) {
				worstSpectralToleranceResidual = {
					sampleIndex: index,
					offsetDegrees: leftSample.offsetDegrees,
					channelIndex,
					leftValue,
					rightValue,
					residual,
					allowed,
					toleranceRatio,
				};
			}
		}
	}
	return {
		tolerance,
		maximumAbsoluteLuminanceDifference,
		maximumRelativeLuminanceDifference,
		maximumAbsoluteSpectralDifference,
		maximumRelativeSpectralDifference,
		maximumSpectralToleranceRatio,
		spectralToleranceFailureCount,
		worstSpectralToleranceResidual,
	};
}

function compareReflectionCompletedEvenProjection(
	fibonacci34,
	fibonacci68,
	tolerance,
) {
	requireCondition(
		fibonacci34.samples.length === fibonacci68.samples.length
			&& fibonacci34.samples.length % 2 === 1,
		'Even-projection comparison requires equal odd trace lengths.',
	);
	let coordinateMismatchCount = 0;
	let maximumAbsoluteSpectralResidual = 0;
	let maximumRelativeSpectralResidual = 0;
	let maximumSpectralToleranceRatio = 0;
	let spectralFailureCount = 0;
	let maximumAbsoluteLuminanceResidual = 0;
	let maximumRelativeLuminanceResidual = 0;
	let maximumLuminanceToleranceRatio = 0;
	let luminanceFailureCount = 0;
	let worstSpectralResidual = null;
	let worstLuminanceResidual = null;
	const samples = [];
	for (let sampleIndex = 0;
		sampleIndex < fibonacci34.samples.length;
		sampleIndex += 1) {
		const mirrorIndex = fibonacci34.samples.length - 1 - sampleIndex;
		const ordinary = fibonacci34.samples[sampleIndex];
		const ordinaryMirror = fibonacci34.samples[mirrorIndex];
		const reflected = fibonacci68.samples[sampleIndex];
		if (ordinary.index !== reflected.index
			|| ordinary.offsetDegrees !== reflected.offsetDegrees
			|| ordinary.azimuthDegrees !== reflected.azimuthDegrees
			|| Math.abs(ordinary.offsetDegrees + ordinaryMirror.offsetDegrees)
				> 1e-12) {
			coordinateMismatchCount += 1;
		}
		const expectedLuminance = 0.5 * (
			ordinary.photopicLuminanceCdPerSquareMeter
				+ ordinaryMirror.photopicLuminanceCdPerSquareMeter
		);
		const actualLuminance =
			reflected.photopicLuminanceCdPerSquareMeter;
		const luminanceResidual = Math.abs(actualLuminance - expectedLuminance);
		const luminanceAllowed = tolerance.absolute
			+ tolerance.relative * Math.abs(expectedLuminance);
		const luminanceRelative = luminanceResidual
			/ Math.max(Math.abs(expectedLuminance), 1e-30);
		const luminanceToleranceRatio = luminanceResidual
			/ Math.max(luminanceAllowed, 1e-30);
		maximumAbsoluteLuminanceResidual = Math.max(
			maximumAbsoluteLuminanceResidual,
			luminanceResidual,
		);
		maximumRelativeLuminanceResidual = Math.max(
			maximumRelativeLuminanceResidual,
			luminanceRelative,
		);
		maximumLuminanceToleranceRatio = Math.max(
			maximumLuminanceToleranceRatio,
			luminanceToleranceRatio,
		);
		if (luminanceResidual > luminanceAllowed) luminanceFailureCount += 1;
		if (worstLuminanceResidual === null
			|| luminanceToleranceRatio
				> worstLuminanceResidual.toleranceRatio) {
			worstLuminanceResidual = {
				sampleIndex,
				offsetDegrees: reflected.offsetDegrees,
				expected: expectedLuminance,
				actual: actualLuminance,
				residual: luminanceResidual,
				allowed: luminanceAllowed,
				toleranceRatio: luminanceToleranceRatio,
			};
		}
		let sampleMaximumSpectralToleranceRatio = 0;
		for (let channelIndex = 0;
			channelIndex < NATIVE_15_SPECTRAL_BASIS.channelCount;
			channelIndex += 1) {
			const expected = 0.5 * (
				ordinary.pathRadiance[channelIndex]
					+ ordinaryMirror.pathRadiance[channelIndex]
			);
			const actual = reflected.pathRadiance[channelIndex];
			const residual = Math.abs(actual - expected);
			const allowed = tolerance.absolute
				+ tolerance.relative * Math.abs(expected);
			const relative = residual / Math.max(Math.abs(expected), 1e-30);
			const toleranceRatio = residual / Math.max(allowed, 1e-30);
			maximumAbsoluteSpectralResidual = Math.max(
				maximumAbsoluteSpectralResidual,
				residual,
			);
			maximumRelativeSpectralResidual = Math.max(
				maximumRelativeSpectralResidual,
				relative,
			);
			maximumSpectralToleranceRatio = Math.max(
				maximumSpectralToleranceRatio,
				toleranceRatio,
			);
			sampleMaximumSpectralToleranceRatio = Math.max(
				sampleMaximumSpectralToleranceRatio,
				toleranceRatio,
			);
			if (residual > allowed) spectralFailureCount += 1;
			if (worstSpectralResidual === null
				|| toleranceRatio > worstSpectralResidual.toleranceRatio) {
				worstSpectralResidual = {
					sampleIndex,
					offsetDegrees: reflected.offsetDegrees,
					channelIndex,
					expected,
					actual,
					residual,
					allowed,
					toleranceRatio,
				};
			}
		}
		samples.push({
			sampleIndex,
			offsetDegrees: reflected.offsetDegrees,
			mirrorOffsetDegrees: ordinaryMirror.offsetDegrees,
			expectedPhotopicLuminanceCdPerSquareMeter: expectedLuminance,
			actualPhotopicLuminanceCdPerSquareMeter: actualLuminance,
			luminanceToleranceRatio,
			maximumSpectralToleranceRatio: sampleMaximumSpectralToleranceRatio,
		});
	}
	return {
		policy: 'n2-reflection-completion-equals-even-projection-of-ordinary-fibonacci-trace-v1',
		derivation: 'At N2, paired half weights require FIB68(theta) = 0.5 * (FIB34(theta) + FIB34(-theta)) for every native channel; photopic Y follows by linear projection.',
		tolerance,
		sampleCount: fibonacci34.samples.length,
		spectralScalarCount:
			fibonacci34.samples.length * NATIVE_15_SPECTRAL_BASIS.channelCount,
		coordinateMismatchCount,
		maximumAbsoluteSpectralResidual,
		maximumRelativeSpectralResidual,
		maximumSpectralToleranceRatio,
		spectralFailureCount,
		maximumAbsoluteLuminanceResidual,
		maximumRelativeLuminanceResidual,
		maximumLuminanceToleranceRatio,
		luminanceFailureCount,
		worstSpectralResidual,
		worstLuminanceResidual,
		samples,
	};
}

function mirrorComparisonSummary(mirror) {
	return {
		pairCount: mirror.pairCount,
		centerPhotopicLuminanceCdPerSquareMeter:
			mirror.center.photopicLuminanceCdPerSquareMeter,
		brightest: mirror.brightest,
		maximumNormalizedLuminanceAsymmetry:
			mirror.maximumNormalizedLuminanceAsymmetry,
		normalizedLuminanceMirrorRmse:
			mirror.normalizedLuminanceMirrorRmse,
		maximumNormalizedSpectralAsymmetry:
			mirror.maximumNormalizedSpectralAsymmetry,
	};
}

function compareQuadraturesByOrder(conditions, tolerances) {
	return [1, 2, 4].map((maximumScatteringOrder) => {
		const fibonacci34 = conditions.find((condition) =>
			condition.quadratureId === 'fibonacci-34'
				&& condition.maximumScatteringOrder === maximumScatteringOrder);
		const fibonacci68 = conditions.find((condition) =>
			condition.quadratureId === 'reflection-completed-fibonacci-68'
				&& condition.maximumScatteringOrder === maximumScatteringOrder);
		requireCondition(fibonacci34 && fibonacci68, 'Quadrature/order comparison is incomplete.');
		return {
			maximumScatteringOrder,
			fibonacci34ConditionId: fibonacci34.id,
			fibonacci68ConditionId: fibonacci68.id,
			fibonacci34Mirror: mirrorComparisonSummary(fibonacci34.mirror),
			fibonacci68Mirror: mirrorComparisonSummary(fibonacci68.mirror),
			maximumAsymmetryCollapseFactor:
				fibonacci68.mirror.maximumNormalizedLuminanceAsymmetry
				/ Math.max(
					fibonacci34.mirror.maximumNormalizedLuminanceAsymmetry,
					1e-30,
				),
			mirrorRmseCollapseFactor:
				fibonacci68.mirror.normalizedLuminanceMirrorRmse
				/ Math.max(
					fibonacci34.mirror.normalizedLuminanceMirrorRmse,
					1e-30,
				),
			denseTraceDifference: compareDenseTraces(
				fibonacci34,
				fibonacci68,
				tolerances.spectralEquivalence,
			),
			...(maximumScatteringOrder === 2 ? {
				evenProjection: compareReflectionCompletedEvenProjection(
					fibonacci34,
					fibonacci68,
					tolerances.n2EvenProjection,
				),
			} : {}),
		};
	});
}

function auditDomainRelationship() {
	const fibonacci34 = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	const fibonacci68 = REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_SELECTION;
	const selectionIdentity = (selection) => {
		const body = {
			kind: selection.kind,
			id: selection.id,
			positionDomain: {
				id: selection.positionDomain.id,
				contentHash: selection.positionDomain.contentHash,
			},
			incomingDirectionDomain: {
				id: selection.incomingDirectionDomain.id,
				contentHash: selection.incomingDirectionDomain.contentHash,
			},
			outgoingDirectionDomain: {
				id: selection.outgoingDirectionDomain.id,
				contentHash: selection.outgoingDirectionDomain.contentHash,
			},
			spectralBasis: {
				id: selection.spectralBasis.id,
				contentHash: selection.spectralBasis.contentHash,
			},
			radiancePacking: {
				id: selection.radiancePacking.id,
				layoutContentHash: selection.radiancePacking.layout.contentHash,
			},
			scatteringDensityPacking: {
				id: selection.scatteringDensityPacking.id,
				layoutContentHash:
					selection.scatteringDensityPacking.layout.contentHash,
			},
		};
		return {...body, contentHash: sha256Descriptor(body)};
	};
	let originalMismatchCount = 0;
	for (let index = 0; index < fibonacci34.incomingDirectionCount; index += 1) {
		const original = fibonacci34.incomingUnitVectors[index];
		const retained = fibonacci68.incomingUnitVectors[index * 2];
		if (original.some((value, component) => value !== retained[component])) {
			originalMismatchCount += 1;
		}
	}
	return {
		policy: 'same-native48-and-w27-only-incoming-quadrature-changes-v1',
		fibonacci34SelectionIdentity: selectionIdentity(fibonacci34),
		fibonacci68SelectionIdentity: selectionIdentity(fibonacci68),
		fibonacci34SelectionId: fibonacci34.id,
		fibonacci34IncomingDirectionDomainId:
			fibonacci34.incomingDirectionDomain.id,
		fibonacci34IncomingDirectionDomainContentHash:
			fibonacci34.incomingDirectionDomain.contentHash,
		fibonacci68SelectionId: fibonacci68.id,
		fibonacci68IncomingDirectionDomainId:
			fibonacci68.incomingDirectionDomain.id,
		fibonacci68IncomingDirectionDomainContentHash:
			fibonacci68.incomingDirectionDomain.contentHash,
		originalMismatchCount,
		positionNodesSameObject:
			fibonacci34.positionNodes === fibonacci68.positionNodes,
		outgoingUnitVectorsSameObject:
			fibonacci34.outgoingUnitVectors === fibonacci68.outgoingUnitVectors,
		spectralBasisSameObject:
			fibonacci34.spectralBasis === fibonacci68.spectralBasis,
		fibonacci34IncomingDirectionCount: fibonacci34.incomingDirectionCount,
		fibonacci68IncomingDirectionCount: fibonacci68.incomingDirectionCount,
	};
}

/** Exercise the exact reflected-domain construction without WebGL or run allocation. */
export function smokeReflectionCompletedFibonacci68Control() {
	const construction = auditReflectionCompletedFibonacci68Control();
	const relationship = auditDomainRelationship();
	requireCondition(construction.directionCount === 68, 'Control direction count is not 68.');
	requireCondition(construction.reflectionMismatchCount === 0, 'Control reflection closure failed.');
	requireCondition(construction.partnerWeightMismatchCount === 0, 'Control partner weights differ.');
	requireCondition(construction.totalWeightErrorSteradians <= 1e-12, 'Control weights do not sum to 4 pi.');
	requireCondition(relationship.originalMismatchCount === 0, 'Control changed an ordinary direction.');
	requireCondition(relationship.positionNodesSameObject, 'Control changed Native48 positions.');
	requireCondition(relationship.outgoingUnitVectorsSameObject, 'Control changed W27 directions.');
	requireCondition(relationship.spectralBasisSameObject, 'Control changed the native spectral basis.');
	return {construction, relationship};
}

/** Execute the San Jose +1h direct Fibonacci-34/Fibonacci-68 causal control. */
export async function runSanJosePlusOneHourFibonacciReflectionControlBrowser() {
	const config = await fetch('/browser/config.json')
		.then((response) => response.json());
	const parentTraceIdentity = config.parentArtifacts?.['evidence/horizon-trace.json'];
	requireCondition(
		parentTraceIdentity,
		'Browser config omits the copied run-000469 horizon-trace identity.',
	);
	const [fixture, radiometry, parentTraceArtifact] = await Promise.all([
		fetch('/fixtures/subjective-globe-context-scenes-v1.json')
			.then((response) => response.json()),
		fetch('/fixtures/g4-cpu-sun-disk-transport-v1.json')
			.then((response) => response.json()),
		fetchJsonWithIdentity(
			'/parent-000469/evidence/horizon-trace.json',
			parentTraceIdentity,
		),
	]);
	requireCondition(
		config.scene.id === 'sunset-plus-one-hour',
		'The control config is not the exact San Jose +1h scene.',
	);
	requireCondition(
		JSON.stringify(config.maximumScatteringOrders) === JSON.stringify([1, 2, 4]),
		'The control requires N1, N2, and N4.',
	);
	const parentEvidence = parentTraceArtifact.value;
	requireCondition(
		parentEvidence.result?.schemaId
			=== 'san-jose-plus-one-hour-horizon-path-radiance-roll-trace-v2',
		'Copied run-000469 evidence has the wrong horizon-trace schema.',
	);
	requireCondition(
		JSON.stringify(parentEvidence.result.scene) === JSON.stringify(config.scene),
		'Copied run-000469 evidence does not contain the configured scene.',
	);
	for (const key of [
		'minimumOffsetDegrees',
		'maximumOffsetDegrees',
		'stepDegrees',
		'elevationDegrees',
	]) {
		requireCondition(
			parentEvidence.result.trace[key] === config.trace[key],
			`Copied run-000469 trace ${key} differs from the configured control.`,
		);
	}
	const parentRollZero = parentEvidence.result.rolls.filter((roll) =>
		roll.rollDegrees === 0);
	requireCondition(
		parentRollZero.length === 1
			&& parentRollZero[0].samples.length === 361,
		'Copied run-000469 evidence must contain exactly one 361-ray roll-zero trace.',
	);
	const parentRollZeroSamples = normalizeParentRollZeroSamples(parentRollZero[0]);
	requireCondition(
		parentRollZeroSamples.every((sample, index) =>
			sample.index === index
				&& sample.pathRadiance.length === NATIVE_15_SPECTRAL_BASIS.channelCount
				&& [
					...sample.directionModel,
					...sample.pathRadiance,
					sample.photopicLuminanceCdPerSquareMeter,
				].every(Number.isFinite)),
		'Copied run-000469 roll-zero samples are not complete finite native-15 evidence.',
	);
	const domainAudit = smokeReflectionCompletedFibonacci68Control();
	const directions = createTraceDirections(config.scene, config.trace);
	const canvas = document.createElement('canvas');
	canvas.width = fixture.camera.widthPixels;
	canvas.height = fixture.camera.heightPixels;
	const context = canvas.getContext('webgl2', {
		antialias: false,
		preserveDrawingBuffer: true,
	});
	requireCondition(context, 'WebGL2 is unavailable.');
	requireCondition(
		context.getExtension('EXT_color_buffer_float'),
		'EXT_color_buffer_float is unavailable.',
	);
	const renderer = new THREE.WebGLRenderer({canvas, context, antialias: false});
	renderer.setSize(fixture.camera.widthPixels, fixture.camera.heightPixels, false);
	try {
		const conditions = [];
		for (const maximumScatteringOrder of config.maximumScatteringOrders) {
			for (const quadratureId of [
				'fibonacci-34',
				'reflection-completed-fibonacci-68',
			]) {
				conditions.push(await traceOneCondition({
					renderer,
					context,
					fixture,
					radiometry,
					config,
					directions,
					condition: {
						id: `${quadratureId}-n${maximumScatteringOrder}`,
						quadratureId,
						maximumScatteringOrder,
					},
				}));
			}
		}
		const freshFibonacci34N4 = conditions.find((condition) =>
			condition.quadratureId === 'fibonacci-34'
				&& condition.maximumScatteringOrder === 4);
		requireCondition(freshFibonacci34N4, 'Fresh FIB34 N4 trace is absent.');
		const parentN4Reproduction = compareParentN4Oracle(
			parentRollZeroSamples,
			freshFibonacci34N4.samples,
			config.parentReproductionTolerance,
		);
		return {
			schemaId: 'san-jose-plus-one-hour-fibonacci-reflection-causal-control-v1',
			inputArtifacts: {
				parent: config.parent,
				parentArtifacts: config.parentArtifacts,
				fixtureArtifacts: config.fixtureArtifacts,
			},
			provenance: REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_PROVENANCE,
			parentRollZeroOracle: {
				runId: config.parent.runId,
				artifact: 'evidence/horizon-trace.json',
				artifactIdentity: parentTraceArtifact.identity,
				schemaId: parentEvidence.result.schemaId,
				scene: parentEvidence.result.scene,
				trace: parentEvidence.result.trace,
				rollDegrees: parentRollZero[0].rollDegrees,
				sampleCount: parentRollZeroSamples.length,
				mirror: mirrorComparisonSummary(
					summarizeMirrorPairs(parentRollZeroSamples),
				),
			},
			parentN4Reproduction,
			domainAudit,
			scene: config.scene,
			trace: {
				...config.trace,
				sourceAzimuthDegrees: degrees(Math.atan2(
					config.scene.directionToSourceUpEastNorth[1],
					config.scene.directionToSourceUpEastNorth[2],
				)),
				sourceElevationDegrees: degrees(Math.asin(
					config.scene.directionToSourceUpEastNorth[0],
				)),
				interpretation: 'Every condition evaluates the same 361 physical horizontal rays with fixed Native48/W27/native-15 owners. Only the incoming angular quadrature changes. For this San Jose +1h horizontal trace, N1 is an exact-zero control and nonzero higher-order path radiance begins at N2.',
			},
			conditions,
			quadratureComparisons: compareQuadraturesByOrder(conditions, {
				spectralEquivalence: config.spectralEquivalenceTolerance,
				n2EvenProjection: config.n2EvenProjectionTolerance,
			}),
		};
	} finally {
		renderer.dispose();
	}
}
