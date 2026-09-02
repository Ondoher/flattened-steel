import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

import {Cr1LinearFieldDiagnosticColorDisplayModel} from '../color/Cr1LinearFieldDiagnosticColorDisplayModel.js';
import {
	CR4C_TWO_SCALE_PRE_TONE_RESPONSE_ID,
	Cr4cTwoScalePreToneExposureColorDisplayModel,
} from '../color/Cr4cTwoScalePreToneExposureColorDisplayModel.js';
import {Algorithm32Bindings} from '../controls/production-v1/src/algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {ThreeCacheBackend} from '../controls/production-v1/src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {createDistantSunSceneState} from '../controls/production-v1/src/flat32/DistantSunSceneState.js';
import {SphericalDistantMode} from '../controls/production-v1/src/flat32/SphericalDistantMode.js';
import {measureCr2ReceiverLight} from '../lighting/Cr2ReceiverLightMeasurement.js';

const LUMINANCE_WEIGHTS = Object.freeze([0.2126, 0.7152, 0.0722]);
const MEASUREMENT_STABILITY = Object.freeze({
	repeatAbsoluteIrradianceFloor: 1e-10,
	repeatRelativeIrradianceDifference: 0.000001,
	rotationMaximumSymmetricRelativePhotopicDifference: 0.02,
	rotationChannelSignificanceFloor: 1e-9,
	rotationMaximumSymmetricRelativeChannelDifference: 0.05,
	rotationMaximumAbsoluteSubfloorChannelDifference: 5e-11,
	directProxyMaximumAbsoluteDifferenceCdPerSquareMeter: 1e-8,
	darkMaximumAbsoluteValue: 1e-12,
});
const VERTEX_SOURCE = `#version 300 es
precision highp float;
out vec2 vScreenUv;
void main() {
	vec2 position = gl_VertexID == 0
		? vec2(-1.0, -1.0)
		: (gl_VertexID == 1 ? vec2(3.0, -1.0) : vec2(-1.0, 3.0));
	vScreenUv = position * 0.5 + 0.5;
	gl_Position = vec4(position, 0.0, 1.0);
}`;
const COPY_FRAGMENT_SOURCE = `#version 300 es
precision highp float;
uniform sampler2D uCandidate;
in vec2 vScreenUv;
out vec4 outputColor;
void main() {
	outputColor = clamp(texture(uCandidate, vScreenUv), vec4(0.0), vec4(1.0));
}`;
const READBACK_SENTINEL = new Float32Array([-10101.25, -20202.5, -30303.75, -40404]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function exactJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}

function dataUrlBytes(dataUrl) {
	const marker = ';base64,';
	const markerIndex = dataUrl.indexOf(marker);
	requireCondition(markerIndex >= 0, 'CR4F PNG data URL is not base64 encoded.');
	const binary = atob(dataUrl.slice(markerIndex + marker.length));
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes;
}

async function sha256Hex(bytes) {
	const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	const digest = await crypto.subtle.digest(
		'SHA-256',
		view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength),
	);
	return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}

async function fetchVerifiedBytes(prefix, declaration, label) {
	const response = await fetch(prefix + declaration.path);
	requireCondition(response.ok, `${label} fetch failed with HTTP ${response.status}.`);
	const bytes = new Uint8Array(await response.arrayBuffer());
	requireCondition(bytes.byteLength === declaration.byteLength, `${label} byte length changed.`);
	const sha256 = await sha256Hex(bytes);
	requireCondition(sha256 === declaration.sha256, `${label} SHA-256 changed.`);
	return {
		bytes,
		evidence: {path: declaration.path, byteLength: bytes.byteLength, sha256, verified: true},
	};
}

function parseVerifiedJson(input, label) {
	try {
		return JSON.parse(new TextDecoder().decode(input.bytes));
	} catch (error) {
		throw new Error(`${label} is not valid JSON: ${error.message}`);
	}
}

async function uploadBytes(artifactPath, bytes, contentType) {
	const response = await fetch('/artifact/' + artifactPath, {
		method: 'POST',
		headers: {'content-type': contentType},
		body: bytes,
	});
	requireCondition(response.ok, `CR4F artifact upload failed for ${artifactPath}: HTTP ${response.status}.`);
	return {
		artifactPath,
		byteLength: bytes.byteLength,
		sha256: await sha256Hex(bytes),
		contentType,
	};
}

async function decodePng(bytes, width, height, label) {
	const bitmap = await createImageBitmap(new Blob([bytes], {type: 'image/png'}), {
		colorSpaceConversion: 'none',
		premultiplyAlpha: 'none',
	});
	try {
		requireCondition(bitmap.width === width && bitmap.height === height, `${label} dimensions changed.`);
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext('2d', {alpha: true, willReadFrequently: true, colorSpace: 'srgb'});
		requireCondition(context, `CR4F could not decode ${label}.`);
		context.imageSmoothingEnabled = false;
		context.drawImage(bitmap, 0, 0);
		const rgba = new Uint8ClampedArray(context.getImageData(0, 0, width, height).data);
		canvas.remove();
		return rgba;
	} finally {
		bitmap.close();
	}
}

function cameraDirection(camera) {
	const azimuth = camera.viewAzimuthDegrees * Math.PI / 180;
	const elevation = camera.viewElevationDegrees * Math.PI / 180;
	const horizontal = Math.cos(elevation);
	return new THREE.Vector3(
		Math.sin(azimuth) * horizontal,
		Math.sin(elevation),
		-Math.cos(azimuth) * horizontal,
	).normalize();
}

function drainWebglErrors(context) {
	const errors = [];
	for (let index = 0; index < 32; index += 1) {
		const error = context.getError();
		if (error === context.NO_ERROR) return errors;
		errors.push(error);
	}
	throw new Error('CR4F WebGL error drain exceeded 32 entries.');
}

function sceneInputCapture(composer) {
	const capture = composer.passes.find(
		(pass) => pass.getDiagnostics?.().kind === 'algorithm32-scene-input-capture-pass',
	);
	if (!capture?._depthTarget || !capture?._hitTarget) {
		throw new Error('CR4F could not inspect the geometry scene-input targets.');
	}
	return capture;
}

function flipRows(values, width, height, componentCount = 4) {
	const flipped = new values.constructor(values.length);
	const rowLength = width * componentCount;
	for (let y = 0; y < height; y += 1) {
		const sourceOffset = (height - 1 - y) * rowLength;
		flipped.set(values.subarray(sourceOffset, sourceOffset + rowLength), y * rowLength);
	}
	return flipped;
}

function readHitTarget(renderer, composer, width, height) {
	const bottomUp = new Uint8Array(width * height * 4);
	renderer.readRenderTargetPixels(sceneInputCapture(composer)._hitTarget, 0, 0, width, height, bottomUp);
	return flipRows(bottomUp, width, height);
}

function encodeTopDownRgbY(bottomUp, width, height) {
	const values = new Float32Array(width * height * 4);
	const bytes = new Uint8Array(values.length * Float32Array.BYTES_PER_ELEMENT);
	const view = new DataView(bytes.buffer);
	let nonfiniteRgbPixelCount = 0;
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const source = ((height - 1 - y) * width + x) * 4;
			const target = (y * width + x) * 4;
			const rgb = [bottomUp[source], bottomUp[source + 1], bottomUp[source + 2]];
			const finite = rgb.every(Number.isFinite);
			if (!finite) nonfiniteRgbPixelCount += 1;
			const luminance = finite
				? Math.max(0, rgb[0] * LUMINANCE_WEIGHTS[0] + rgb[1] * LUMINANCE_WEIGHTS[1] + rgb[2] * LUMINANCE_WEIGHTS[2])
				: Number.NaN;
			for (let channel = 0; channel < 3; channel += 1) {
				values[target + channel] = rgb[channel];
				view.setFloat32((target + channel) * 4, rgb[channel], true);
			}
			values[target + 3] = luminance;
			view.setFloat32((target + 3) * 4, luminance, true);
		}
	}
	return {values, bytes, nonfiniteRgbPixelCount};
}

function captureLinearField({context, renderer, composer, width, height}) {
	composer.renderToScreen = false;
	try {
		composer.render(0);
		requireCondition(composer.writeBuffer?.texture?.type === THREE.FloatType, 'CR4F field target is not FloatType.');
		const bottomUp = new Float32Array(width * height * 4);
		renderer.readRenderTargetPixels(composer.writeBuffer, 0, 0, width, height, bottomUp);
		const encoded = encodeTopDownRgbY(bottomUp, width, height);
		return {
			...encoded,
			hitTopDown: readHitTarget(renderer, composer, width, height),
			webglErrors: drainWebglErrors(context),
			contextLost: context.isContextLost(),
		};
	} finally {
		composer.renderToScreen = true;
	}
}

function extractR8HitMask(hitTopDown, width, height) {
	requireCondition(hitTopDown.length === width * height * 4, 'CR4F hit-target size changed.');
	const bytes = new Uint8Array(width * height);
	let skyPixelCount = 0;
	let geometryPixelCount = 0;
	let noncanonicalPixelCount = 0;
	for (let pixel = 0; pixel < width * height; pixel += 1) {
		const value = hitTopDown[pixel * 4];
		bytes[pixel] = value;
		if (value === 0) skyPixelCount += 1;
		else if (value === 255) geometryPixelCount += 1;
		else noncanonicalPixelCount += 1;
	}
	requireCondition(
		skyPixelCount > 0 && geometryPixelCount > 0 && noncanonicalPixelCount === 0,
		'CR4F live scene-hit mask is invalid or degenerate.',
	);
	return {bytes, skyPixelCount, geometryPixelCount, noncanonicalPixelCount};
}

function glslFloat(value) {
	requireCondition(Number.isFinite(value), 'CR4F GLSL constant must be finite.');
	return Number.isInteger(value) ? `${value}.0` : String(value);
}

function compileShader(context, type, source, label) {
	const shader = context.createShader(type);
	requireCondition(shader, `CR4F could not allocate ${label} shader.`);
	context.shaderSource(shader, source);
	context.compileShader(shader);
	if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
		const log = context.getShaderInfoLog(shader);
		context.deleteShader(shader);
		throw new Error(`CR4F ${label} shader compilation failed: ${log}`);
	}
	return shader;
}

function compileProgram(context, fragmentSource, label) {
	const vertex = compileShader(context, context.VERTEX_SHADER, VERTEX_SOURCE, `${label} vertex`);
	const fragment = compileShader(context, context.FRAGMENT_SHADER, fragmentSource, `${label} fragment`);
	const program = context.createProgram();
	requireCondition(program, `CR4F could not allocate ${label} program.`);
	context.attachShader(program, vertex);
	context.attachShader(program, fragment);
	context.linkProgram(program);
	context.deleteShader(vertex);
	context.deleteShader(fragment);
	if (!context.getProgramParameter(program, context.LINK_STATUS)) {
		const log = context.getProgramInfoLog(program);
		context.deleteProgram(program);
		throw new Error(`CR4F ${label} program link failed: ${log}`);
	}
	return program;
}

function candidateFragmentSource(model) {
	const curve = model.curve;
	return `#version 300 es
precision highp float;
uniform sampler2D uLinearField;
uniform float uTotalHorizontalIlluminanceLux;
in vec2 vScreenUv;
out vec4 outputColor;
const float DISPLAY_TONE_MAP_K = ${glslFloat(model.displayConstants.paperFigure1ToneMapK)};
const float CR4C_SUNSET_AMPLITUDE = ${glslFloat(curve.sunsetAmplitude)};
const float CR4C_SUNSET_TRANSITION_ILLUMINANCE_LUX = ${glslFloat(curve.sunsetTransitionIlluminanceLux)};
const float CR4C_SUNSET_ROLLOFF_POWER = ${glslFloat(curve.sunsetRolloffPower)};
const float CR4C_NAUTICAL_AMPLITUDE = ${glslFloat(curve.nauticalAmplitude)};
const float CR4C_NAUTICAL_TRANSITION_ILLUMINANCE_LUX = ${glslFloat(curve.nauticalTransitionIlluminanceLux)};
const float CR4C_NAUTICAL_ROLLOFF_POWER = ${glslFloat(curve.nauticalRolloffPower)};
float hill(float illuminanceLux, float amplitude, float transitionLux, float power) {
	float ratio = max(illuminanceLux, 0.0) / transitionLux;
	return amplitude / (1.0 + pow(ratio, power));
}
float gain(float illuminanceLux) {
	return 1.0
		+ hill(illuminanceLux, CR4C_SUNSET_AMPLITUDE, CR4C_SUNSET_TRANSITION_ILLUMINANCE_LUX, CR4C_SUNSET_ROLLOFF_POWER)
		+ hill(illuminanceLux, CR4C_NAUTICAL_AMPLITUDE, CR4C_NAUTICAL_TRANSITION_ILLUMINANCE_LUX, CR4C_NAUTICAL_ROLLOFF_POWER);
}
void main() {
	vec3 inputRgb = texture(uLinearField, vec2(vScreenUv.x, 1.0 - vScreenUv.y)).rgb;
	vec3 exposedRgb = inputRgb * gain(uTotalHorizontalIlluminanceLux);
	vec3 displayRgb = clamp(vec3(1.0) - exp(-max(exposedRgb, vec3(0.0)) * DISPLAY_TONE_MAP_K), vec3(0.0), vec3(1.0));
	outputColor = vec4(displayRgb, 1.0);
}`;
}

async function createGpuReplay(width, height, model) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		premultipliedAlpha: false,
		preserveDrawingBuffer: true,
		powerPreference: 'high-performance',
	});
	requireCondition(context, 'CR4F GPU replay requires WebGL2.');
	requireCondition(context.getExtension('EXT_color_buffer_float'), 'CR4F GPU replay requires EXT_color_buffer_float.');
	context.disable(context.DITHER);
	context.disable(context.BLEND);
	context.disable(context.DEPTH_TEST);
	context.disable(context.CULL_FACE);
	const vertexArray = context.createVertexArray();
	requireCondition(vertexArray, 'CR4F could not allocate a replay vertex array.');
	context.bindVertexArray(vertexArray);
	const fragmentSource = candidateFragmentSource(model);
	const candidateProgram = compileProgram(context, fragmentSource, 'candidate');
	const copyProgram = compileProgram(context, COPY_FRAGMENT_SOURCE, 'presentation copy');
	const debug = context.getExtension('WEBGL_debug_renderer_info');
	const startupErrors = drainWebglErrors(context);
	requireCondition(startupErrors.length === 0, 'CR4F replay initialization produced WebGL errors.');
	return {
		canvas,
		context,
		vertexArray,
		candidateProgram,
		copyProgram,
		fragmentSourceSha256: await sha256Hex(new TextEncoder().encode(fragmentSource)),
		facts: {
			api: 'WebGL2',
			renderer: context.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER),
			vendor: context.getParameter(debug?.UNMASKED_VENDOR_WEBGL ?? context.VENDOR),
			version: context.getParameter(context.VERSION),
			maximumTextureSize: context.getParameter(context.MAX_TEXTURE_SIZE),
			extColorBufferFloat: true,
			startupErrors,
		},
	};
}

function rgba32fTexture(context, width, height, values = null) {
	const texture = context.createTexture();
	requireCondition(texture, 'CR4F could not allocate an RGBA32F texture.');
	context.bindTexture(context.TEXTURE_2D, texture);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
	context.texImage2D(context.TEXTURE_2D, 0, context.RGBA32F, width, height, 0, context.RGBA, context.FLOAT, values);
	return texture;
}

function renderCandidateGpu(gpu, model, fieldValues, width, height, illuminance) {
	const {context} = gpu;
	const inputTexture = rgba32fTexture(context, width, height, fieldValues);
	const outputTexture = rgba32fTexture(context, width, height);
	const framebuffer = context.createFramebuffer();
	requireCondition(framebuffer, 'CR4F could not allocate a replay framebuffer.');
	context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
	context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, outputTexture, 0);
	const framebufferStatus = context.checkFramebufferStatus(context.FRAMEBUFFER);
	requireCondition(framebufferStatus === context.FRAMEBUFFER_COMPLETE, `CR4F replay framebuffer is incomplete: ${framebufferStatus}.`);
	context.viewport(0, 0, width, height);
	context.clearBufferfv(context.COLOR, 0, READBACK_SENTINEL);
	context.useProgram(gpu.candidateProgram);
	context.activeTexture(context.TEXTURE0);
	context.bindTexture(context.TEXTURE_2D, inputTexture);
	context.uniform1i(context.getUniformLocation(gpu.candidateProgram, 'uLinearField'), 0);
	context.uniform1f(context.getUniformLocation(gpu.candidateProgram, 'uTotalHorizontalIlluminanceLux'), illuminance.value);
	context.drawArrays(context.TRIANGLES, 0, 3);
	context.finish();
	const drawErrors = drainWebglErrors(context);
	const floatBottomUp = new Float32Array(width * height * 4);
	context.readPixels(0, 0, width, height, context.RGBA, context.FLOAT, floatBottomUp);
	const floatErrors = drainWebglErrors(context);
	context.bindFramebuffer(context.FRAMEBUFFER, null);
	context.useProgram(gpu.copyProgram);
	context.activeTexture(context.TEXTURE0);
	context.bindTexture(context.TEXTURE_2D, outputTexture);
	context.uniform1i(context.getUniformLocation(gpu.copyProgram, 'uCandidate'), 0);
	context.drawArrays(context.TRIANGLES, 0, 3);
	context.finish();
	const rgbaBottomUp = new Uint8Array(width * height * 4);
	context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, rgbaBottomUp);
	const presentationErrors = drainWebglErrors(context);
	context.bindTexture(context.TEXTURE_2D, null);
	context.deleteFramebuffer(framebuffer);
	context.deleteTexture(outputTexture);
	context.deleteTexture(inputTexture);
	return {
		rgbaTopDown: flipRows(rgbaBottomUp, width, height),
		floatTopDown: flipRows(floatBottomUp, width, height),
		framebufferStatus,
		errors: [...drawErrors, ...floatErrors, ...presentationErrors],
		contextLost: context.isContextLost(),
		fragmentSourceSha256: gpu.fragmentSourceSha256,
		gain: model.displayGain(illuminance),
	};
}

function disposeGpuReplay(gpu) {
	gpu.context.deleteProgram(gpu.candidateProgram);
	gpu.context.deleteProgram(gpu.copyProgram);
	gpu.context.deleteVertexArray(gpu.vertexArray);
	gpu.canvas.remove();
}

function renderCandidateCpu(model, fieldValues, width, height, illuminance) {
	const rgba = new Uint8ClampedArray(width * height * 4);
	const displayRgba = new Float32Array(width * height * 4);
	for (let pixel = 0; pixel < width * height; pixel += 1) {
		const offset = pixel * 4;
		const rgb = model.linearSrgbToDisplayRgb(
			[fieldValues[offset], fieldValues[offset + 1], fieldValues[offset + 2]],
			illuminance,
		);
		for (let channel = 0; channel < 3; channel += 1) {
			displayRgba[offset + channel] = rgb[channel];
			rgba[offset + channel] = Math.round(clamp(rgb[channel], 0, 1) * 255);
		}
		displayRgba[offset + 3] = 1;
		rgba[offset + 3] = 255;
	}
	return {rgba, displayRgba};
}

function compareArrays(actual, expected, mask = null) {
	requireCondition(actual.length === expected.length, 'CR4F parity arrays have different lengths.');
	let differingValueCount = 0;
	let maximumAbsoluteDifference = 0;
	let squaredDifferenceSum = 0;
	let comparedValueCount = 0;
	for (let pixel = 0; pixel < actual.length / 4; pixel += 1) {
		if (mask !== null && mask[pixel] !== 0) continue;
		for (let channel = 0; channel < 4; channel += 1) {
			const difference = Math.abs(actual[pixel * 4 + channel] - expected[pixel * 4 + channel]);
			if (difference !== 0) differingValueCount += 1;
			maximumAbsoluteDifference = Math.max(maximumAbsoluteDifference, difference);
			squaredDifferenceSum += difference * difference;
			comparedValueCount += 1;
		}
	}
	return {
		differingValueCount,
		maximumAbsoluteDifference,
		rmse: comparedValueCount === 0 ? 0 : Math.sqrt(squaredDifferenceSum / comparedValueCount),
		comparedValueCount,
	};
}

async function acquireLiveScene(configuration, sceneSpec, model, gpu) {
	const cameraSpec = configuration.viewport;
	const {observer, location, physicalControls: physical} = configuration;
	const width = cameraSpec.widthPixels;
	const height = cameraSpec.heightPixels;
	requireCondition(sceneSpec.mode === 'live' && sceneSpec.sceneCacheAsset, `${sceneSpec.id} lacks a live cache asset.`);
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: true,
		stencil: false,
		preserveDrawingBuffer: true,
	});
	requireCondition(context, 'CR4F live acquisition requires WebGL2.');
	requireCondition(context.getExtension('EXT_color_buffer_float'), 'CR4F live acquisition requires EXT_color_buffer_float.');
	const renderer = new THREE.WebGLRenderer({canvas, context});
	renderer.setPixelRatio(1);
	renderer.setSize(width, height, false);
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	const camera = new THREE.PerspectiveCamera(
		cameraSpec.verticalFieldOfViewDegrees,
		width / height,
		cameraSpec.nearSceneUnits,
		cameraSpec.farSceneUnits,
	);
	camera.position.set(0, observer.heightMeters / physical.sceneScaleMetersPerSceneUnit, 0);
	camera.lookAt(camera.position.clone().add(cameraDirection(cameraSpec)));
	camera.updateMatrixWorld(true);
	const sceneScale = {value: physical.sceneScaleMetersPerSceneUnit, units: 'meters-per-scene-unit'};
	const sceneDepthMax = {value: physical.sceneDepthMaxMeters, units: 'meters'};
	const target = new THREE.WebGLRenderTarget(width, height, {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		depthBuffer: true,
		stencilBuffer: false,
	});
	target.texture.colorSpace = THREE.NoColorSpace;
	const composer = new EffectComposer(renderer, target);
	composer.setPixelRatio(1);
	composer.setSize(width, height);
	composer.addPass(new RenderPass(scene, camera));
	const backend = new ThreeCacheBackend({THREE, renderer});
	const sceneState = createDistantSunSceneState({
		observation: {
			instant: sceneSpec.timeIso,
			location: {
				latitude: {value: location.latitudeDegrees, units: 'degrees'},
				longitude: {value: location.longitudeDegrees, units: 'degrees'},
			},
		},
		observerHeight: {value: observer.heightMeters, units: 'meters'},
		observerUpDirection: observer.upDirection,
	});
	requireCondition(
		Math.abs(sceneState.solarZenithDegrees - sceneSpec.solarZenithDegrees) <= 1e-6,
		`${sceneSpec.id} solar zenith changed from the predeclared exact scene.`,
	);
	const mode = new SphericalDistantMode({
		sceneState,
		sceneScale,
		sourceAngularRadius: {value: physical.sourceAngularRadiusRadians, units: 'radians'},
		maximumScatteringOrder: physical.maximumScatteringOrder,
		celestialSourcesEnabled: false,
		colorDisplayModelConfiguration: {model: 'bruneton-control'},
		sceneCacheAsset: sceneSpec.sceneCacheAsset,
		distantSunCacheState: 'ready',
	});
	const algorithm32 = mode.algorithm32;
	const groundEndpoints = mode.geometry.createThreeEndpointObjects({
		name: `cr4f-${sceneSpec.id}-spherical-ground`,
		sceneScale,
		widthSegments: physical.groundWidthSegments,
		heightSegments: physical.groundHeightSegments,
		visualMaterialColor: 0x000000,
		groundVisualMesh: {kind: 'local-spherical-patch'},
	});
	scene.add(...groundEndpoints.visualObjects);
	const bindingValues = Algorithm32Bindings.create(THREE, sceneDepthMax);
	Algorithm32Bindings.update({bindingValues, camera, props: {config: algorithm32.config.config, sceneScale}});
	let handle = null;
	try {
		handle = await algorithm32.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: {width, height, units: 'pixels'},
			sceneScale,
			sceneDepthMax,
			bindingValues,
			cacheBackend: backend,
		});
		await handle.prepare(renderer);
		const measurement = await measureCr2ReceiverLight({
			THREE,
			renderer,
			backend,
			algorithm32,
			handle,
			sceneId: sceneSpec.id,
			cacheIdentity: sceneSpec.cacheIdentity ?? sceneSpec.sceneCacheAsset.loadRequest.cacheIdentity,
			stability: MEASUREMENT_STABILITY,
		});
		const illuminance = measurement.publicResult.photopic.totalHorizontal.illuminance;
		requireCondition(
			illuminance.units === 'lux' && Number.isFinite(illuminance.value) && illuminance.value >= 0,
			`${sceneSpec.id} produced invalid total-horizontal illuminance.`,
		);
		await handle.setConfig({...algorithm32.config.config, color: new Cr1LinearFieldDiagnosticColorDisplayModel()});
		const field = captureLinearField({context, renderer, composer, width, height});
		requireCondition(field.nonfiniteRgbPixelCount === 0, `${sceneSpec.id} field contains nonfinite RGB.`);
		const mask = extractR8HitMask(field.hitTopDown, width, height);
		const [fieldUpload, maskUpload, receiverUpload] = await Promise.all([
			uploadBytes(sceneSpec.output.fieldPath, field.bytes, 'application/octet-stream'),
			uploadBytes(sceneSpec.output.maskPath, mask.bytes, 'application/octet-stream'),
			uploadBytes(sceneSpec.output.rawReceiverRadiancePath, measurement.rawPrimaryBytes, 'application/octet-stream'),
		]);
		const gpuFrame = renderCandidateGpu(gpu, model, field.values, width, height, illuminance);
		const cpuFrame = renderCandidateCpu(model, field.values, width, height, illuminance);
		return {
			sceneId: sceneSpec.id,
			mode: sceneSpec.mode,
			timeIso: sceneSpec.timeIso,
			solarZenithDegrees: sceneState.solarZenithDegrees,
			solarElevationDegrees: 90 - sceneState.solarZenithDegrees,
			totalHorizontalIlluminance: illuminance,
			gain: gpuFrame.gain,
			gainDerivativePerLux: model.displayGainDerivative(illuminance),
			rgba: gpuFrame.rgbaTopDown,
			field: {...fieldUpload, storage: configuration.retainedLiveArtifacts.field.storage},
			mask: {...maskUpload, ...mask, bytes: undefined, storage: configuration.retainedLiveArtifacts.sceneHitMask.storage},
			receiverRadiance: {
				...receiverUpload,
				storage: configuration.retainedLiveArtifacts.receiverDiffuseRadiance.storage,
				quantity: configuration.retainedLiveArtifacts.receiverDiffuseRadiance.quantity,
				units: configuration.retainedLiveArtifacts.receiverDiffuseRadiance.units,
			},
			receiverLight: measurement.publicResult,
			cache: {
				identity: sceneSpec.cacheIdentity ?? sceneSpec.sceneCacheAsset.loadRequest.cacheIdentity,
				selection: sceneSpec.cacheSelectionEvidence ?? null,
			},
			gpu: {
				fragmentSourceSha256: gpuFrame.fragmentSourceSha256,
				framebufferStatus: gpuFrame.framebufferStatus,
				errors: gpuFrame.errors,
				contextLost: gpuFrame.contextLost,
			},
			gpuCpuParity: {
				encodedSky: compareArrays(gpuFrame.rgbaTopDown, cpuFrame.rgba, mask.bytes),
				floatSky: compareArrays(gpuFrame.floatTopDown, cpuFrame.displayRgba, mask.bytes),
			},
			ground: groundEndpoints.metadata,
			runtimeDiagnostics: handle.getDiagnostics(),
			acquisitionWebglErrors: field.webglErrors,
			acquisitionContextLost: field.contextLost,
		};
	} finally {
		handle?.dispose();
		for (const groundObject of groundEndpoints.visualObjects) {
			groundObject.geometry?.dispose();
			groundObject.material?.dispose();
		}
		mode.dispose();
		backend.dispose();
		composer.dispose();
		target.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		canvas.remove();
	}
}

function verifyParentAnalysis(configuration, analysis) {
	requireCondition(
		analysis.schemaId === 'algorithm32-color-reset-cr4c-two-scale-browser-result-v1' &&
			analysis.renderComplete === true &&
			analysis.appearanceAccepted === false &&
			analysis.response?.id === CR4C_TWO_SCALE_PRE_TONE_RESPONSE_ID,
		'CR4F accepted CR4C endpoint response evidence changed.',
	);
	const expectedCurve = {...configuration.response.selectedCandidate};
	delete expectedCurve.label;
	const actualCurve = {...analysis.response.selectedCandidate};
	delete actualCurve.label;
	requireCondition(exactJson(actualCurve, expectedCurve), 'CR4F CR4C response curve changed.');
	for (const endpoint of configuration.parents.acceptedCr4c.endpointEntries) {
		const actual = analysis.scenes.find((scene) => scene.sceneId === endpoint.sceneId);
		requireCondition(
			actual?.totalHorizontalIlluminance?.units === 'lux' &&
				actual.totalHorizontalIlluminance.value === endpoint.totalHorizontalIlluminanceLux &&
				actual.gain === endpoint.gain &&
				actual.gainDerivativePerLux === endpoint.gainDerivativePerLux,
			`CR4F parent response evidence changed for ${endpoint.sceneId}.`,
		);
	}
	return {
		schemaId: analysis.schemaId,
		renderComplete: analysis.renderComplete,
		appearanceAccepted: analysis.appearanceAccepted,
		response: analysis.response,
		endpointSceneCount: configuration.parents.acceptedCr4c.endpointEntries.length,
		verified: true,
	};
}

function formatNumber(value, digits = 10) {
	if (value === 0) return '0';
	if (Math.abs(value) >= 10000 || Math.abs(value) < 0.001) return value.toExponential(4);
	return Number(value.toPrecision(digits)).toString();
}

function composeStack(configuration, scenes) {
	const {layout} = configuration.presentation;
	const width = layout.expectedWidthPixels;
	const height = layout.expectedHeightPixels;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: true, willReadFrequently: true, colorSpace: 'srgb'});
	requireCondition(context, 'CR4F stack requires Canvas2D.');
	context.imageSmoothingEnabled = false;
	context.fillStyle = layout.backgroundCss;
	context.fillRect(0, 0, width, height);
	context.textAlign = 'left';
	context.textBaseline = 'middle';
	context.fillStyle = layout.headingCss;
	context.font = '600 24px sans-serif';
	context.fillText(configuration.presentation.title, layout.outerPaddingPixels, layout.outerPaddingPixels + 18);
	context.fillStyle = layout.secondaryCss;
	context.font = '14px sans-serif';
	context.fillText(configuration.presentation.subtitle, layout.outerPaddingPixels, layout.outerPaddingPixels + 44);
	const placements = [];
	let rowTop = layout.outerPaddingPixels + layout.titleHeightPixels;
	for (const [index, scene] of scenes.entries()) {
		const labelCenter = rowTop + layout.sceneLabelHeightPixels / 2;
		context.fillStyle = layout.headingCss;
		context.font = '600 16px sans-serif';
		context.fillText(`${index + 1}. ${scene.label}`, layout.outerPaddingPixels, labelCenter - 12);
		context.fillStyle = layout.secondaryCss;
		context.font = '12px monospace';
		context.fillText(
			`+${scene.offsetMinutes}m | elevation ${scene.solarElevationDegrees.toFixed(6)} deg | zenith ${scene.solarZenithDegrees.toFixed(6)} deg`,
			layout.outerPaddingPixels,
			labelCenter + 7,
		);
		context.fillText(
			`E ${formatNumber(scene.totalHorizontalIlluminance.value)} lux (${scene.evidenceMode}) | gain ${formatNumber(scene.gain)}`,
			layout.outerPaddingPixels,
			labelCenter + 23,
		);
		const panelY = rowTop + layout.sceneLabelHeightPixels;
		context.strokeStyle = layout.borderCss;
		context.strokeRect(
			layout.outerPaddingPixels - 1,
			panelY - 1,
			configuration.viewport.widthPixels + 2,
			configuration.viewport.heightPixels + 2,
		);
		context.putImageData(
			new ImageData(
				new Uint8ClampedArray(scene.rgba),
				configuration.viewport.widthPixels,
				configuration.viewport.heightPixels,
			),
			layout.outerPaddingPixels,
			panelY,
		);
		placements.push({sceneId: scene.sceneId, x: layout.outerPaddingPixels, y: panelY});
		rowTop = panelY + configuration.viewport.heightPixels + layout.rowGapPixels;
	}
	return {canvas, width, height, placements};
}

function compareEmbeddedRegion(outputRgba, outputWidth, sourceRgba, sourceWidth, sourceHeight, x, y) {
	let differingChannelCount = 0;
	let maximumAbsoluteChannelDifference = 0;
	for (let sourceY = 0; sourceY < sourceHeight; sourceY += 1) {
		for (let sourceX = 0; sourceX < sourceWidth; sourceX += 1) {
			const sourceOffset = (sourceY * sourceWidth + sourceX) * 4;
			const outputOffset = ((y + sourceY) * outputWidth + x + sourceX) * 4;
			for (let channel = 0; channel < 4; channel += 1) {
				const difference = Math.abs(outputRgba[outputOffset + channel] - sourceRgba[sourceOffset + channel]);
				if (difference !== 0) differingChannelCount += 1;
				maximumAbsoluteChannelDifference = Math.max(maximumAbsoluteChannelDifference, difference);
			}
		}
	}
	return {
		exact: differingChannelCount === 0,
		differingChannelCount,
		maximumAbsoluteChannelDifference,
		comparedChannelCount: sourceWidth * sourceHeight * 4,
	};
}

/** Acquire only missing twilight states, replay the frozen CR4C response, and upload all requested images before gates. */
export async function runCr4fFineTwilightCadenceBrowser() {
	const configurationResponse = await fetch('/browser/configuration.json');
	requireCondition(configurationResponse.ok, 'CR4F browser configuration fetch failed.');
	const configuration = await configurationResponse.json();
	requireCondition(
		configuration.schemaId === 'algorithm32-color-reset-cr4f-fine-twilight-cadence-input-v1',
		'CR4F browser fixture schema changed.',
	);
	requireCondition(configuration.response.id === CR4C_TWO_SCALE_PRE_TONE_RESPONSE_ID, 'CR4F response identity changed.');
	const width = configuration.viewport.widthPixels;
	const height = configuration.viewport.heightPixels;
	await window.colorResetProgress('parent-input-started');
	const parentAnalysisInput = await fetchVerifiedBytes(
		'/parent/',
		configuration.parents.acceptedCr4c.analysis,
		'CR4F accepted CR4C analysis',
	);
	const parentAnalysisVerification = verifyParentAnalysis(
		configuration,
		parseVerifiedJson(parentAnalysisInput, 'CR4F accepted CR4C analysis'),
	);
	const parentInputs = new Map();
	for (const scene of configuration.scenes.filter(({mode}) => mode === 'parent')) {
		const input = await fetchVerifiedBytes('/parent/', scene.parentCandidate, `CR4F ${scene.id} parent candidate`);
		parentInputs.set(scene.id, {
			input,
			rgba: await decodePng(input.bytes, width, height, `CR4F ${scene.id} parent candidate`),
		});
	}
	const model = new Cr4cTwoScalePreToneExposureColorDisplayModel({
		curve: configuration.response.selectedCandidate,
	});
	const gpu = await createGpuReplay(width, height, model);
	requireCondition(gpu.facts.maximumTextureSize >= Math.max(width, height), 'CR4F viewport exceeds GPU replay limits.');
	const uploadedImages = [];
	const imageUploadOrder = [];
	const panelIdentities = [];
	const imageDerivations = [];
	const uploadImage = async (scene, bytes, identity, derivation) => {
		const upload = await uploadBytes(scene.output.image, bytes, 'image/png');
		uploadedImages.push(upload);
		imageUploadOrder.push(scene.output.image);
		panelIdentities.push({...identity, artifactPath: scene.output.image, output: upload});
		imageDerivations.push({...derivation, artifactPath: scene.output.image, result: upload});
		if (imageUploadOrder.length === 1) await window.colorResetProgress('first-image-complete');
		return upload;
	};
	const results = [];
	try {
		for (const scene of configuration.scenes) {
			let result;
			if (scene.mode === 'parent') {
				const parent = parentInputs.get(scene.id);
				const illuminance = {
					value: scene.totalHorizontalIlluminance.value,
					units: scene.totalHorizontalIlluminance.units,
				};
				const gain = model.displayGain(illuminance);
				requireCondition(
					Math.abs(gain - scene.expectedGain.value) <= 1e-12,
					`CR4F parent gain changed for ${scene.id}.`,
				);
				const upload = await uploadImage(
					scene,
					parent.input.bytes,
					{sceneId: scene.id, mode: 'parent', role: 'byte-exact accepted CR4C candidate endpoint'},
					{
						operation: 'byte-exact authenticated parent copy',
						parentRunId: configuration.parents.acceptedCr4c.runId,
						parentArtifact: parent.input.evidence,
						responseEvidence: parentAnalysisInput.evidence,
					},
				);
				result = {
					sceneId: scene.id,
					label: scene.label,
					timeIso: scene.timeIso,
					offsetMinutes: scene.offsetMinutes,
					mode: scene.mode,
					evidenceMode: configuration.presentation.labelContract.parentEvidenceModeLabel,
					solarZenithDegrees: scene.solarZenithDegrees,
					solarElevationDegrees: scene.solarElevationDegrees,
					totalHorizontalIlluminance: illuminance,
					gain,
					gainDerivativePerLux: model.displayGainDerivative(illuminance),
					rgba: parent.rgba,
					parentCandidate: parent.input.evidence,
					output: upload,
					cache: {identity: scene.cacheExpectation.cacheIdentity, replayedParentEvidence: true},
				};
			} else {
				const live = await acquireLiveScene(configuration, scene, model, gpu);
				const imageBytes = dataUrlBytes((() => {
					const canvas = document.createElement('canvas');
					canvas.width = width;
					canvas.height = height;
					const context = canvas.getContext('2d', {alpha: true});
					context.putImageData(new ImageData(new Uint8ClampedArray(live.rgba), width, height), 0, 0);
					const dataUrl = canvas.toDataURL('image/png');
					canvas.remove();
					return dataUrl;
				})());
				const upload = await uploadImage(
					scene,
					imageBytes,
					{sceneId: scene.id, mode: 'live', role: 'CR4C GPU replay over freshly acquired signed RGBY field'},
					{
						operation: configuration.response.operation,
						field: live.field,
						mask: live.mask,
						receiverRadiance: live.receiverRadiance,
						totalHorizontalIlluminance: live.totalHorizontalIlluminance,
						gain: live.gain,
						fragmentSourceSha256: live.gpu.fragmentSourceSha256,
					},
				);
				result = {
					...live,
					label: scene.label,
					offsetMinutes: scene.offsetMinutes,
					evidenceMode: configuration.presentation.labelContract.liveEvidenceModeLabel,
					output: upload,
				};
			}
			results.push(result);
			await window.colorResetProgress(`image-${scene.id}`);
		}
		const stack = composeStack(configuration, results);
		const stackBytes = dataUrlBytes(stack.canvas.toDataURL('image/png'));
		const stackUpload = await uploadBytes(configuration.outputs.stack, stackBytes, 'image/png');
		uploadedImages.push(stackUpload);
		imageUploadOrder.push(configuration.outputs.stack);
		const decodedStack = await decodePng(stackBytes, stack.width, stack.height, 'CR4F stack');
		const embeddings = results.map((scene, index) => ({
			sceneId: scene.sceneId,
			placement: stack.placements[index],
			comparison: compareEmbeddedRegion(
				decodedStack,
				stack.width,
				scene.rgba,
				width,
				height,
				stack.placements[index].x,
				stack.placements[index].y,
			),
		}));
		requireCondition(embeddings.every(({comparison}) => comparison.exact), 'CR4F stack changed source panel pixels.');
		panelIdentities.push(...embeddings.map((embedding) => ({
			artifactPath: configuration.outputs.stack,
			sceneId: embedding.sceneId,
			role: '1:1 embedded chronological panel',
			placement: embedding.placement,
			embedding: embedding.comparison,
			output: stackUpload,
		})));
		imageDerivations.push({
			artifactPath: configuration.outputs.stack,
			operation: 'Place all six decoded RGBA panels at 1:1 in one chronological column and add labels outside panel bounds.',
			inputs: results.map(({sceneId, output}) => ({sceneId, output})),
			parameters: {viewport: configuration.viewport, layout: configuration.presentation.layout},
			result: stackUpload,
		});
		stack.canvas.remove();
		await window.colorResetProgress('decision-plate-complete');
		requireCondition(
			exactJson(imageUploadOrder, configuration.outputs.requestedImageUploadOrder),
			'CR4F requested image upload order changed.',
		);
		const terminalErrors = drainWebglErrors(gpu.context);
		return {
			schemaId: 'algorithm32-color-reset-cr4f-fine-twilight-cadence-browser-result-v1',
			renderComplete: true,
			integrityGateEvaluated: false,
			appearanceAccepted: false,
			ownerAppearanceReviewRequired: true,
			continuityAccepted: false,
			continuityGateEvaluated: false,
			allDeclaredImagesUploaded: true,
			allDeclaredArtifactsUploaded: true,
			software: {browserUserAgent: navigator.userAgent, webCrypto: 'SubtleCrypto SHA-256'},
			claimBoundary: configuration.claimBoundary,
			response: {id: configuration.response.id, selectedCandidate: model.curve},
			parent: {
				declaration: configuration.parents.acceptedCr4c,
				analysis: parentAnalysisInput.evidence,
				verification: parentAnalysisVerification,
			},
			gpuReplay: {...gpu.facts, fragmentSourceSha256: gpu.fragmentSourceSha256, terminalErrors},
			scenes: results.map(({rgba, ...result}) => result),
			stack: {artifactPath: configuration.outputs.stack, width: stack.width, height: stack.height, embeddings},
			panelIdentities,
			imageDerivations,
			uploadedImages,
			imageUploadOrder,
		};
	} finally {
		disposeGpuReplay(gpu);
	}
}
