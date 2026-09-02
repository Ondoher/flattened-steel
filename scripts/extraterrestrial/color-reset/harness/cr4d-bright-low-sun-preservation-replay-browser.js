import {BrunetonColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {
	CR4C_TWO_SCALE_PRE_TONE_RESPONSE_ID,
	Cr4cTwoScalePreToneExposureColorDisplayModel,
} from '../color/Cr4cTwoScalePreToneExposureColorDisplayModel.js';

const LUMINANCE_WEIGHTS = Object.freeze([0.2126, 0.7152, 0.0722]);
const CANDIDATE_COLORS = Object.freeze(['#54a8ff', '#65d68a', '#ff9f43']);
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

function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}

function glslFloat(value) {
	requireCondition(Number.isFinite(value), 'CR4B GLSL constant must be finite.');
	return Number.isInteger(value) ? `${value}.0` : String(value);
}

function dataUrlBytes(dataUrl) {
	const marker = ';base64,';
	const markerIndex = dataUrl.indexOf(marker);
	requireCondition(markerIndex >= 0, 'CR4B PNG data URL is not base64 encoded.');
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
		evidence: {
			path: declaration.path,
			byteLength: bytes.byteLength,
			sha256,
			verified: true,
		},
	};
}

function parseVerifiedJson(input, label) {
	let value;
	try {
		value = JSON.parse(new TextDecoder().decode(input.bytes));
	} catch (error) {
		throw new Error(`${label} is not valid JSON: ${error.message}`);
	}
	return value;
}

async function uploadBytes(artifactPath, bytes, contentType) {
	const response = await fetch('/artifact/' + artifactPath, {
		method: 'POST',
		headers: {'content-type': contentType},
		body: bytes,
	});
	requireCondition(response.ok, `CR4B artifact upload failed for ${artifactPath}: HTTP ${response.status}.`);
	return {
		artifactPath,
		byteLength: bytes.byteLength,
		sha256: await sha256Hex(bytes),
		contentType,
	};
}

function canvasPngBytes(canvas) {
	return dataUrlBytes(canvas.toDataURL('image/png'));
}

function rgbaCanvas(rgba, width, height) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: true, willReadFrequently: true});
	requireCondition(context, 'CR4B could not create a 2D canvas context.');
	context.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0);
	return canvas;
}

async function decodePng(bytes, expectedWidth, expectedHeight, label) {
	const bitmap = await createImageBitmap(new Blob([bytes], {type: 'image/png'}));
	try {
		requireCondition(
			bitmap.width === expectedWidth && bitmap.height === expectedHeight,
			`${label} dimensions changed.`,
		);
		const canvas = document.createElement('canvas');
		canvas.width = expectedWidth;
		canvas.height = expectedHeight;
		const context = canvas.getContext('2d', {alpha: true, willReadFrequently: true});
		requireCondition(context, `CR4B could not decode ${label}.`);
		context.drawImage(bitmap, 0, 0);
		return new Uint8ClampedArray(context.getImageData(0, 0, expectedWidth, expectedHeight).data);
	} finally {
		bitmap.close();
	}
}

function decodeFloat32Le(bytes, expectedValueCount, label) {
	requireCondition(bytes.byteLength === expectedValueCount * 4, `${label} float byte length changed.`);
	const values = new Float32Array(expectedValueCount);
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let nonfiniteValueCount = 0;
	for (let index = 0; index < values.length; index += 1) {
		const value = view.getFloat32(index * 4, true);
		values[index] = value;
		if (!Number.isFinite(value)) nonfiniteValueCount += 1;
	}
	requireCondition(nonfiniteValueCount === 0, `${label} contains nonfinite values.`);
	return {values, nonfiniteValueCount};
}

function validateMask(bytes, expectedPixelCount, label) {
	requireCondition(bytes.byteLength === expectedPixelCount, `${label} mask byte length changed.`);
	let skyPixelCount = 0;
	let geometryPixelCount = 0;
	let noncanonicalPixelCount = 0;
	for (const value of bytes) {
		if (value === 0) skyPixelCount += 1;
		else if (value === 255) geometryPixelCount += 1;
		else noncanonicalPixelCount += 1;
	}
	requireCondition(noncanonicalPixelCount === 0, `${label} contains noncanonical mask values.`);
	requireCondition(skyPixelCount > 0 && geometryPixelCount > 0, `${label} mask is degenerate.`);
	return {skyPixelCount, geometryPixelCount, noncanonicalPixelCount};
}

function flipRows(values, width, height, componentCount) {
	const flipped = new values.constructor(values.length);
	const rowLength = width * componentCount;
	for (let y = 0; y < height; y += 1) {
		const sourceOffset = (height - 1 - y) * rowLength;
		flipped.set(values.subarray(sourceOffset, sourceOffset + rowLength), y * rowLength);
	}
	return flipped;
}

function compileShader(context, type, source, label) {
	const shader = context.createShader(type);
	requireCondition(shader, `CR4B could not allocate ${label} shader.`);
	context.shaderSource(shader, source);
	context.compileShader(shader);
	if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
		const log = context.getShaderInfoLog(shader);
		context.deleteShader(shader);
		throw new Error(`CR4B ${label} shader compilation failed: ${log}`);
	}
	return shader;
}

function compileProgram(context, fragmentSource, label) {
	const vertex = compileShader(context, context.VERTEX_SHADER, VERTEX_SOURCE, `${label} vertex`);
	const fragment = compileShader(context, context.FRAGMENT_SHADER, fragmentSource, `${label} fragment`);
	const program = context.createProgram();
	requireCondition(program, `CR4B could not allocate ${label} program.`);
	context.attachShader(program, vertex);
	context.attachShader(program, fragment);
	context.linkProgram(program);
	context.deleteShader(vertex);
	context.deleteShader(fragment);
	if (!context.getProgramParameter(program, context.LINK_STATUS)) {
		const log = context.getProgramInfoLog(program);
		context.deleteProgram(program);
		throw new Error(`CR4B ${label} program link failed: ${log}`);
	}
	return program;
}

function drainWebglErrors(context) {
	const errors = [];
	for (let index = 0; index < 32; index += 1) {
		const error = context.getError();
		if (error === context.NO_ERROR) return errors;
		errors.push(error);
	}
	throw new Error('CR4B WebGL error drain exceeded 32 entries.');
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
float cr4cHillTerm(float illuminanceLux, float amplitude, float transitionLux, float power) {
	float ratio = max(illuminanceLux, 0.0) / transitionLux;
	return amplitude / (1.0 + pow(ratio, power));
}
float cr4cDisplayGain(float totalHorizontalIlluminanceLux) {
	return 1.0
		+ cr4cHillTerm(totalHorizontalIlluminanceLux, CR4C_SUNSET_AMPLITUDE, CR4C_SUNSET_TRANSITION_ILLUMINANCE_LUX, CR4C_SUNSET_ROLLOFF_POWER)
		+ cr4cHillTerm(totalHorizontalIlluminanceLux, CR4C_NAUTICAL_AMPLITUDE, CR4C_NAUTICAL_TRANSITION_ILLUMINANCE_LUX, CR4C_NAUTICAL_ROLLOFF_POWER);
}
void main() {
	vec3 signedProjectedLinearRgb = texture(uLinearField, vec2(vScreenUv.x, 1.0 - vScreenUv.y)).rgb;
	vec3 exposedLinearRgb = signedProjectedLinearRgb * cr4cDisplayGain(uTotalHorizontalIlluminanceLux);
	vec3 displayRgb = clamp(
		vec3(1.0) - exp(-max(exposedLinearRgb, vec3(0.0)) * DISPLAY_TONE_MAP_K),
		vec3(0.0),
		vec3(1.0)
	);
	outputColor = vec4(displayRgb, 1.0);
}`;
}

async function createGpuReplay(width, height, models) {
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
	requireCondition(context, 'CR4B requires a WebGL2 context.');
	requireCondition(
		context.getExtension('EXT_color_buffer_float'),
		'CR4B requires EXT_color_buffer_float for RGBA32F replay.',
	);
	context.disable(context.DITHER);
	context.disable(context.BLEND);
	context.disable(context.DEPTH_TEST);
	context.disable(context.CULL_FACE);
	const vertexArray = context.createVertexArray();
	requireCondition(vertexArray, 'CR4B could not allocate a vertex array.');
	context.bindVertexArray(vertexArray);
	const debug = context.getExtension('WEBGL_debug_renderer_info');
	const renderer = debug
		? context.getParameter(debug.UNMASKED_RENDERER_WEBGL)
		: context.getParameter(context.RENDERER);
	const vendor = debug ? context.getParameter(debug.UNMASKED_VENDOR_WEBGL) : context.getParameter(context.VENDOR);
	const copyProgram = compileProgram(context, COPY_FRAGMENT_SOURCE, 'presentation copy');
	const candidatePrograms = new Map();
	for (const model of models) {
		const source = candidateFragmentSource(model);
		candidatePrograms.set(model.curve.id, {
			program: compileProgram(context, source, model.curve.id),
			fragmentSourceSha256: await sha256Hex(new TextEncoder().encode(source)),
		});
	}
	const startupErrors = drainWebglErrors(context);
	requireCondition(startupErrors.length === 0, 'CR4B WebGL initialization produced errors.');
	return {
		canvas,
		context,
		vertexArray,
		copyProgram,
		candidatePrograms,
		facts: {
			api: 'WebGL2',
			renderer,
			vendor,
			version: context.getParameter(context.VERSION),
			shadingLanguageVersion: context.getParameter(context.SHADING_LANGUAGE_VERSION),
			maximumTextureSize: context.getParameter(context.MAX_TEXTURE_SIZE),
			extColorBufferFloat: true,
			inputTextureInternalFormat: 'RGBA32F',
			candidateRenderTargetInternalFormat: 'RGBA32F',
			presentationTarget: 'drawing-buffer RGBA8',
			contextAttributes: context.getContextAttributes(),
			startupErrors,
		},
	};
}

function createRgba32fTexture(context, width, height, values = null) {
	const texture = context.createTexture();
	requireCondition(texture, 'CR4B could not allocate an RGBA32F texture.');
	context.bindTexture(context.TEXTURE_2D, texture);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
	context.pixelStorei(context.UNPACK_ALIGNMENT, 4);
	context.texImage2D(context.TEXTURE_2D, 0, context.RGBA32F, width, height, 0, context.RGBA, context.FLOAT, values);
	return texture;
}

function validateFloatReadback(values, label) {
	let sentinelPixelCount = 0;
	for (let offset = 0; offset < values.length; offset += 4) {
		let sentinel = true;
		for (let component = 0; component < 4; component += 1) {
			requireCondition(Number.isFinite(values[offset + component]), `${label} contains nonfinite data.`);
			if (values[offset + component] !== READBACK_SENTINEL[component]) sentinel = false;
		}
		if (sentinel) sentinelPixelCount += 1;
	}
	requireCondition(sentinelPixelCount === 0, `${label} retained ${sentinelPixelCount} draw sentinels.`);
}

function renderCandidateGpu(gpu, model, fieldValues, width, height, illuminance) {
	const context = gpu.context;
	const programRecord = gpu.candidatePrograms.get(model.curve.id);
	requireCondition(programRecord, `CR4B GPU program is missing for ${model.curve.id}.`);
	const inputTexture = createRgba32fTexture(context, width, height, fieldValues);
	const outputTexture = createRgba32fTexture(context, width, height);
	const framebuffer = context.createFramebuffer();
	requireCondition(framebuffer, 'CR4B could not allocate an RGBA32F framebuffer.');
	context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
	context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, outputTexture, 0);
	const framebufferStatus = context.checkFramebufferStatus(context.FRAMEBUFFER);
	requireCondition(
		framebufferStatus === context.FRAMEBUFFER_COMPLETE,
		`CR4B RGBA32F framebuffer is incomplete: ${framebufferStatus}.`,
	);
	context.viewport(0, 0, width, height);
	context.clearBufferfv(context.COLOR, 0, READBACK_SENTINEL);
	context.useProgram(programRecord.program);
	context.activeTexture(context.TEXTURE0);
	context.bindTexture(context.TEXTURE_2D, inputTexture);
	context.uniform1i(context.getUniformLocation(programRecord.program, 'uLinearField'), 0);
	context.uniform1f(
		context.getUniformLocation(programRecord.program, 'uTotalHorizontalIlluminanceLux'),
		illuminance.value,
	);
	context.drawArrays(context.TRIANGLES, 0, 3);
	context.finish();
	const drawErrors = drainWebglErrors(context);
	requireCondition(drawErrors.length === 0, `CR4B ${model.curve.id} GPU draw produced errors.`);
	const floatBottomUp = new Float32Array(width * height * 4);
	floatBottomUp.fill(Number.NaN);
	context.readPixels(0, 0, width, height, context.RGBA, context.FLOAT, floatBottomUp);
	const floatReadErrors = drainWebglErrors(context);
	requireCondition(floatReadErrors.length === 0, `CR4B ${model.curve.id} float readback produced errors.`);
	validateFloatReadback(floatBottomUp, `CR4B ${model.curve.id} float readback`);

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
	const contextLost = context.isContextLost();

	context.bindTexture(context.TEXTURE_2D, null);
	context.deleteFramebuffer(framebuffer);
	context.deleteTexture(outputTexture);
	context.deleteTexture(inputTexture);
	return {
		rgbaTopDown: flipRows(rgbaBottomUp, width, height, 4),
		floatTopDown: flipRows(floatBottomUp, width, height, 4),
		framebufferStatus,
		errors: [...drawErrors, ...floatReadErrors, ...presentationErrors],
		contextLost,
		fragmentSourceSha256: programRecord.fragmentSourceSha256,
	};
}

function disposeGpuReplay(gpu) {
	for (const record of gpu.candidatePrograms.values()) gpu.context.deleteProgram(record.program);
	gpu.context.deleteProgram(gpu.copyProgram);
	gpu.context.deleteVertexArray(gpu.vertexArray);
	gpu.canvas.remove();
}

function quantizedChannel(value) {
	return Math.round(clamp(value, 0, 1) * 255);
}

function unchangedBrunetonChannel(value, toneMapK) {
	return clamp(1 - Math.exp(-Math.max(value, 0) * toneMapK), 0, 1);
}

function renderCpuBruneton(fieldValues, width, height, model) {
	const pixelCount = width * height;
	const rgba = new Uint8ClampedArray(pixelCount * 4);
	const displayRgba = new Float32Array(pixelCount * 4);
	for (let pixel = 0; pixel < pixelCount; pixel += 1) {
		const offset = pixel * 4;
		const rgb = model.linearSrgbToDisplayRgb([
			fieldValues[offset],
			fieldValues[offset + 1],
			fieldValues[offset + 2],
		]);
		for (let channel = 0; channel < 3; channel += 1) {
			displayRgba[offset + channel] = rgb[channel];
			rgba[offset + channel] = quantizedChannel(rgb[channel]);
		}
		displayRgba[offset + 3] = 1;
		rgba[offset + 3] = 255;
	}
	return {rgba, displayRgba};
}

function renderCpuCandidate(fieldValues, width, height, model, illuminance) {
	const pixelCount = width * height;
	const rgba = new Uint8ClampedArray(pixelCount * 4);
	const displayRgba = new Float32Array(pixelCount * 4);
	const gain = model.displayGain(illuminance);
	const toneMapK = model.displayConstants.paperFigure1ToneMapK;
	let maximumPreToneOrderingError = 0;
	let maximumCommonGainCrossProductError = 0;
	let maximumPostToneAlternativeDifference = 0;
	let signedNegativeInputValueCount = 0;
	for (let pixel = 0; pixel < pixelCount; pixel += 1) {
		const offset = pixel * 4;
		const input = [fieldValues[offset], fieldValues[offset + 1], fieldValues[offset + 2]];
		const exposed = model.applyPreToneGain(input, illuminance);
		const candidate = model.linearSrgbToDisplayRgb(input, illuminance);
		for (let channel = 0; channel < 3; channel += 1) {
			if (input[channel] < 0) signedNegativeInputValueCount += 1;
			const independentPreTone = unchangedBrunetonChannel(input[channel] * gain, toneMapK);
			const postToneAlternative = clamp(unchangedBrunetonChannel(input[channel], toneMapK) * gain, 0, 1);
			maximumPreToneOrderingError = Math.max(
				maximumPreToneOrderingError,
				Math.abs(candidate[channel] - independentPreTone),
			);
			maximumPostToneAlternativeDifference = Math.max(
				maximumPostToneAlternativeDifference,
				Math.abs(candidate[channel] - postToneAlternative),
			);
			displayRgba[offset + channel] = candidate[channel];
			rgba[offset + channel] = quantizedChannel(candidate[channel]);
		}
		for (const [left, right] of [
			[0, 1],
			[0, 2],
			[1, 2],
		]) {
			maximumCommonGainCrossProductError = Math.max(
				maximumCommonGainCrossProductError,
				Math.abs(exposed[left] * input[right] - exposed[right] * input[left]),
			);
		}
		displayRgba[offset + 3] = 1;
		rgba[offset + 3] = 255;
	}
	return {
		rgba,
		displayRgba,
		gain,
		gainDerivativePerLux: model.displayGainDerivative(illuminance),
		preToneOrdering: {
			operation: 'signed projected linear RGB times common gain, then unchanged Bruneton exponential',
			maximumIndependentCpuAbsoluteDifference: maximumPreToneOrderingError,
			maximumPostToneAlternativeDifference,
			signedNegativeInputValueCount,
		},
		commonGainProof: {
			maximumSignedLinearRgbCrossProductError: maximumCommonGainCrossProductError,
			oneScalarForEveryPixelAndChannel: true,
		},
	};
}

function compareRgbCodes(actual, expected, mask = null) {
	requireCondition(actual.length === expected.length, 'CR4B RGB comparison sizes differ.');
	let comparedPixelCount = 0;
	let differingPixelCount = 0;
	let maximumAbsoluteRgbCodeDifference = 0;
	let squaredError = 0;
	for (let pixel = 0; pixel < actual.length / 4; pixel += 1) {
		if (mask && mask[pixel] !== 0) continue;
		comparedPixelCount += 1;
		const offset = pixel * 4;
		let pixelMaximum = 0;
		for (let channel = 0; channel < 3; channel += 1) {
			const difference = Math.abs(actual[offset + channel] - expected[offset + channel]);
			pixelMaximum = Math.max(pixelMaximum, difference);
			maximumAbsoluteRgbCodeDifference = Math.max(maximumAbsoluteRgbCodeDifference, difference);
			squaredError += difference * difference;
		}
		if (pixelMaximum > 0) differingPixelCount += 1;
	}
	return {
		population: mask ? 'sky-only from CR1 R8 scene-hit mask' : 'all pixels',
		comparedPixelCount,
		maximumAbsoluteRgbCodeDifference,
		rgbCodeRmse: Math.sqrt(squaredError / (comparedPixelCount * 3)),
		differingPixelCount,
		differingPixelFraction: differingPixelCount / comparedPixelCount,
	};
}

function compareFloatRgba(actual, expected, mask) {
	requireCondition(actual.length === expected.length, 'CR4B float comparison sizes differ.');
	let comparedPixelCount = 0;
	let maximumAbsoluteRgbDifference = 0;
	let squaredError = 0;
	let nonfiniteValueCount = 0;
	for (let pixel = 0; pixel < mask.length; pixel += 1) {
		if (mask[pixel] !== 0) continue;
		comparedPixelCount += 1;
		const offset = pixel * 4;
		for (let channel = 0; channel < 3; channel += 1) {
			const left = actual[offset + channel];
			const right = expected[offset + channel];
			if (!Number.isFinite(left) || !Number.isFinite(right)) {
				nonfiniteValueCount += 1;
				continue;
			}
			const difference = Math.abs(left - right);
			maximumAbsoluteRgbDifference = Math.max(maximumAbsoluteRgbDifference, difference);
			squaredError += difference * difference;
		}
	}
	return {
		population: 'sky-only from CR1 R8 scene-hit mask',
		comparedPixelCount,
		maximumAbsoluteRgbDifference,
		rgbRmse: Math.sqrt(squaredError / (comparedPixelCount * 3)),
		nonfiniteValueCount,
	};
}

function percentile(sorted, requested) {
	if (sorted.length === 0) return null;
	const position = (clamp(requested, 0, 100) * (sorted.length - 1)) / 100;
	const lower = Math.floor(position);
	const upper = Math.ceil(position);
	if (lower === upper) return sorted[lower];
	return sorted[lower] * (1 - (position - lower)) + sorted[upper] * (position - lower);
}

function summarizeDisplay(rgba, mask) {
	const luminances = [];
	let blackSkyPixelCount = 0;
	let saturatedSkyPixelCount = 0;
	for (let pixel = 0; pixel < mask.length; pixel += 1) {
		if (mask[pixel] !== 0) continue;
		const offset = pixel * 4;
		const red = rgba[offset];
		const green = rgba[offset + 1];
		const blue = rgba[offset + 2];
		if (red === 0 && green === 0 && blue === 0) blackSkyPixelCount += 1;
		if (red === 255 || green === 255 || blue === 255) saturatedSkyPixelCount += 1;
		luminances.push(
			(red * LUMINANCE_WEIGHTS[0] + green * LUMINANCE_WEIGHTS[1] + blue * LUMINANCE_WEIGHTS[2]) / 255,
		);
	}
	luminances.sort((left, right) => left - right);
	return {
		population: 'sky-only from CR1 R8 scene-hit mask',
		skyPixelCount: luminances.length,
		blackSkyPixelCount,
		blackSkyPixelFraction: blackSkyPixelCount / luminances.length,
		saturatedSkyPixelCount,
		saturatedSkyPixelFraction: saturatedSkyPixelCount / luminances.length,
		medianDisplayLuminance: percentile(luminances, 50),
		p95DisplayLuminance: percentile(luminances, 95),
	};
}

function differenceRgba(candidate, bruneton, amplification) {
	const difference = new Uint8ClampedArray(candidate.length);
	for (let offset = 0; offset < difference.length; offset += 4) {
		for (let channel = 0; channel < 3; channel += 1) {
			difference[offset + channel] = Math.min(
				255,
				Math.abs(candidate[offset + channel] - bruneton[offset + channel]) * amplification,
			);
		}
		difference[offset + 3] = 255;
	}
	return difference;
}

function parseHexColor(value) {
	requireCondition(/^#[0-9a-f]{6}$/iu.test(value), `CR4B invalid mask color ${value}.`);
	return [1, 3, 5].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
}

function blackSaturationMaskRgba(candidate, sceneMask, colors) {
	const palette = Object.fromEntries(Object.entries(colors).map(([key, value]) => [key, parseHexColor(value)]));
	const rgba = new Uint8ClampedArray(candidate.length);
	for (let pixel = 0; pixel < sceneMask.length; pixel += 1) {
		const offset = pixel * 4;
		const black = candidate[offset] === 0 && candidate[offset + 1] === 0 && candidate[offset + 2] === 0;
		const saturated = candidate[offset] === 255 || candidate[offset + 1] === 255 || candidate[offset + 2] === 255;
		const color =
			sceneMask[pixel] === 255
				? palette.sceneGeometry
				: black && saturated
					? palette.blackAndSaturatedSky
					: black
						? palette.blackSky
						: saturated
							? palette.saturatedSky
							: palette.ordinarySky;
		rgba.set(color, offset);
		rgba[offset + 3] = 255;
	}
	return rgba;
}

function preservationEnvelope(fixture, illuminanceLux) {
	const envelope = fixture.legacyReceiverLightEnvelope;
	const maximum = envelope.maximumAbsoluteRgbCodeDifference;
	const rmse = envelope.rgbCodeRmse;
	return {
		maximumAbsoluteRgbCodeDifference:
			maximum.daylightFloorCodes +
			maximum.lowSunRelaxationCodes / (1 + (illuminanceLux / maximum.scaleIlluminanceLux) ** maximum.power),
		rgbCodeRmse:
			rmse.daylightFloorCodes +
			rmse.lowSunRelaxationCodes / (1 + (illuminanceLux / rmse.scaleIlluminanceLux) ** rmse.power),
	};
}

function blackSaturationDeltaMask(candidate, control, sceneMask, colors) {
	const palette = Object.fromEntries(Object.entries(colors).map(([key, value]) => [key, parseHexColor(value)]));
	const rgba = new Uint8ClampedArray(candidate.length);
	const counts = {
		ordinaryUnchanged: 0,
		candidateOnlyBlack: 0,
		controlOnlyBlack: 0,
		candidateOnlySaturated: 0,
		controlOnlySaturated: 0,
		bothBlack: 0,
		bothSaturated: 0,
		sceneGeometry: 0,
	};
	for (let pixel = 0; pixel < sceneMask.length; pixel += 1) {
		const offset = pixel * 4;
		let key;
		if (sceneMask[pixel] === 255) {
			key = 'sceneGeometry';
		} else {
			const candidateBlack =
				candidate[offset] === 0 && candidate[offset + 1] === 0 && candidate[offset + 2] === 0;
			const controlBlack = control[offset] === 0 && control[offset + 1] === 0 && control[offset + 2] === 0;
			const candidateSaturated =
				candidate[offset] === 255 || candidate[offset + 1] === 255 || candidate[offset + 2] === 255;
			const controlSaturated =
				control[offset] === 255 || control[offset + 1] === 255 || control[offset + 2] === 255;
			if (candidateBlack && controlBlack) key = 'bothBlack';
			else if (candidateBlack) key = 'candidateOnlyBlack';
			else if (controlBlack) key = 'controlOnlyBlack';
			else if (candidateSaturated && controlSaturated) key = 'bothSaturated';
			else if (candidateSaturated) key = 'candidateOnlySaturated';
			else if (controlSaturated) key = 'controlOnlySaturated';
			else key = 'ordinaryUnchanged';
		}
		counts[key] += 1;
		rgba.set(palette[key], offset);
		rgba[offset + 3] = 255;
	}
	return {rgba, counts};
}

function validateConfiguration(configuration) {
	const fixture = configuration.fixture ?? configuration;
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr4d-bright-low-sun-preservation-replay-input-v1',
		'CR4D fixture schema changed.',
	);
	requireCondition(
		JSON.stringify(fixture.scenes.map(({id}) => id)) ===
			JSON.stringify(['solar-noon', 'sunset-minus-60-minutes', 'sunset-minus-10-minutes', 'sunset']),
		'CR4D scene order changed.',
	);
	requireCondition(
		fixture.response.id === CR4C_TWO_SCALE_PRE_TONE_RESPONSE_ID &&
			fixture.response.selectedCandidate.id === 'pre-tone-two-scale' &&
			fixture.response.unchangedFromAcceptedCr4c === true,
		'CR4D must replay the accepted CR4C response unchanged.',
	);
	requireCondition(
		fixture.claimBoundary.appearanceAcceptanceGate === false &&
			fixture.claimBoundary.paperSimilarityMetric === false &&
			fixture.claimBoundary.paperTarget === false &&
			fixture.claimBoundary.legacyEnvelopeWidened === false &&
			fixture.claimBoundary.sunsetPreservationGatesCandidate === false,
		'CR4D claim boundary changed.',
	);
	requireCondition(
		JSON.stringify(fixture.legacyReceiverLightEnvelope.qualifiedSceneIds) ===
			JSON.stringify(['solar-noon', 'sunset-minus-60-minutes', 'sunset-minus-10-minutes']) &&
			JSON.stringify(fixture.legacyReceiverLightEnvelope.reportOnlySceneIds) === JSON.stringify(['sunset']) &&
			fixture.legacyReceiverLightEnvelope.unchangedFromLegacy === true &&
			fixture.legacyReceiverLightEnvelope.widenedAfterObservation === false,
		'CR4D legacy preservation qualification scope changed.',
	);
	requireCondition(
		fixture.outputs.requestedImageUploadOrder.length === 18 &&
			fixture.outputs.requestedImageUploadOrder.at(-1) === fixture.outputs.decisionPlate &&
			JSON.stringify(fixture.outputs.requestedImageUploadOrder) ===
				JSON.stringify([
					...fixture.outputs.controls,
					...fixture.outputs.candidates,
					...fixture.outputs.differences,
					...fixture.outputs.deltaMasks,
					...fixture.outputs.figures,
				]),
		'CR4D must declare exactly eighteen ordered images with the decision plate last.',
	);
	return fixture;
}

function verifyParentAnalyses(fixture, cr1, cr2, acceptedCr4c) {
	requireCondition(cr1.schemaId === 'algorithm32-color-reset-cr1-browser-result-v1', 'CR4D CR1 schema changed.');
	requireCondition(cr2.schemaId === 'algorithm32-color-reset-cr2-browser-result-v1', 'CR4D CR2 schema changed.');
	requireCondition(
		acceptedCr4c.schemaId === 'algorithm32-color-reset-cr4c-two-scale-browser-result-v1' &&
			acceptedCr4c.renderComplete === true &&
			acceptedCr4c.appearanceAccepted === false &&
			acceptedCr4c.paperSimilarityMetric === null &&
			acceptedCr4c.response?.id === fixture.response.id &&
			JSON.stringify(acceptedCr4c.response?.selectedCandidate) ===
				JSON.stringify(fixture.response.selectedCandidate) &&
			acceptedCr4c.response?.equation === fixture.response.equation &&
			acceptedCr4c.response?.operation === fixture.response.operation,
		'CR4D accepted CR4C response parent changed.',
	);
	const verification = fixture.scenes.map((scene) => {
		const cr1Scene = cr1.scenes.find(({sceneId}) => sceneId === scene.id);
		const cr2Scene = cr2.scenes.find(({sceneId}) => sceneId === scene.id);
		requireCondition(cr1Scene && cr2Scene, `CR4D parent scene ${scene.id} is missing.`);
		requireCondition(
			cr1Scene.field?.rawArtifactPath === scene.field.path &&
				cr1Scene.hitMask?.artifactPath === scene.mask.path &&
				cr1Scene.frames?.bruneton?.colorId === 'bruneton-figure1-display',
			`CR4D CR1 artifact references changed for ${scene.id}.`,
		);
		const total = cr2Scene.measurement?.photopic?.totalHorizontal?.illuminance;
		requireCondition(
			total?.units === scene.totalHorizontalIlluminance.units &&
				total.value === scene.totalHorizontalIlluminance.value,
			`CR4D CR2 receiver illuminance changed for ${scene.id}.`,
		);
		return {sceneId: scene.id, totalHorizontalIlluminance: total};
	});
	const acceptedSunset = acceptedCr4c.scenes.find(({sceneId}) => sceneId === 'sunset');
	requireCondition(
		Math.abs(acceptedSunset?.gain - fixture.scenes.at(-1).expectedCandidateGain) <=
			fixture.diagnostics.expectedGainAbsoluteError &&
			acceptedSunset?.candidateVsBruneton?.maximumAbsoluteRgbCodeDifference ===
				fixture.scenes.at(-1).preservation.expectedObservedMaximumAbsoluteRgbCodeDifference,
		'CR4D accepted CR4C sunset facts changed.',
	);
	return {
		scenes: verification,
		acceptedCr4c: {
			response: acceptedCr4c.response,
			sunsetGain: acceptedSunset.gain,
			sunsetCandidateVsBruneton: acceptedSunset.candidateVsBruneton,
			appearanceAccepted: acceptedCr4c.appearanceAccepted,
		},
	};
}

function responsePreservationFigure(fixture, model, sceneResults) {
	const canvas = document.createElement('canvas');
	canvas.width = fixture.diagnostics.plot.widthPixels;
	canvas.height = fixture.diagnostics.plot.heightPixels;
	const context = canvas.getContext('2d', {alpha: false});
	requireCondition(context, 'CR4D could not create response/preservation plot.');
	context.fillStyle = '#0d1119';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#f5f7ff';
	context.font = 'bold 29px sans-serif';
	context.fillText('CR4D - accepted two-scale response and legacy preservation replay', 42, 45);
	context.fillStyle = '#aeb8ce';
	context.font = '15px sans-serif';
	context.fillText('Legacy envelope is unchanged and gates noon, -60, and -10 only; sunset is report-only.', 42, 73);
	const plot = {left: 80, top: 120, width: 780, height: 430};
	context.strokeStyle = '#65718a';
	context.strokeRect(plot.left, plot.top, plot.width, plot.height);
	const minimum = fixture.diagnostics.plot.minimumIlluminanceLux;
	const maximum = fixture.diagnostics.plot.maximumIlluminanceLux;
	const logMinimum = Math.log10(minimum);
	const logMaximum = Math.log10(maximum);
	const maximumGain = 1 + model.curve.sunsetAmplitude + model.curve.nauticalAmplitude;
	context.beginPath();
	for (let index = 0; index <= 1000; index += 1) {
		const fraction = index / 1000;
		const illuminance = 10 ** (logMinimum + fraction * (logMaximum - logMinimum));
		const gain = model.displayGain({value: illuminance, units: 'lux'});
		const x = plot.left + fraction * plot.width;
		const y = plot.top + (1 - Math.log10(gain) / Math.log10(maximumGain)) * plot.height;
		if (index === 0) context.moveTo(x, y);
		else context.lineTo(x, y);
	}
	context.strokeStyle = '#65d68a';
	context.lineWidth = 3;
	context.stroke();
	const colors = ['#b8c2d9', '#65d68a', '#ffd166', '#ff9f43'];
	for (const [index, scene] of sceneResults.entries()) {
		const fraction = (Math.log10(scene.totalHorizontalIlluminance.value) - logMinimum) / (logMaximum - logMinimum);
		const x = plot.left + fraction * plot.width;
		const y = plot.top + (1 - Math.log10(scene.gain) / Math.log10(maximumGain)) * plot.height;
		context.fillStyle = colors[index];
		context.beginPath();
		context.arc(x, y, 7, 0, 2 * Math.PI);
		context.fill();
		context.font = '15px sans-serif';
		context.fillText(scene.label, 900, 150 + index * 62);
		context.font = '13px monospace';
		context.fillText(
			`E ${scene.totalHorizontalIlluminance.value.toPrecision(7)} lux  g ${scene.gain.toPrecision(10)}`,
			900,
			169 + index * 62,
		);
	}
	context.fillStyle = '#d7dce8';
	context.font = 'bold 17px sans-serif';
	context.fillText('Candidate vs unchanged Bruneton (sky RGB8)', 80, 605);
	context.font = '14px monospace';
	for (const [index, scene] of sceneResults.entries()) {
		const status = scene.preservation.gatesCandidate
			? scene.preservation.passed
				? 'PASS'
				: 'FAIL'
			: 'REPORT ONLY';
		context.fillStyle = scene.preservation.gatesCandidate
			? scene.preservation.passed
				? '#65d68a'
				: '#ff6b6b'
			: '#ffd166';
		context.fillText(
			`${scene.label.padEnd(23)} max ${String(scene.candidateVsBruneton.maximumAbsoluteRgbCodeDifference).padStart(3)} / ${scene.preservation.envelope.maximumAbsoluteRgbCodeDifference.toFixed(6)}  RMSE ${scene.candidateVsBruneton.rgbCodeRmse.toFixed(6)} / ${scene.preservation.envelope.rgbCodeRmse.toFixed(6)}  ${status}`,
			80,
			642 + index * 34,
		);
	}
	context.fillStyle = '#8e9ab1';
	context.font = '14px sans-serif';
	context.fillText('No paper metric, no widened envelope, no sunset appearance acceptance.', 80, 825);
	return canvas;
}

function decisionPlate(fixture, sceneResults, preservationFigure) {
	const canvas = document.createElement('canvas');
	canvas.width = 1700;
	canvas.height = 1510;
	const context = canvas.getContext('2d', {alpha: false});
	requireCondition(context, 'CR4D could not create decision plate.');
	context.fillStyle = '#0d1119';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#f5f7ff';
	context.font = 'bold 29px sans-serif';
	context.fillText('CR4D bright / low-Sun preservation replay', 42, 43);
	context.font = '15px sans-serif';
	context.fillStyle = '#b8c2d9';
	context.fillText(
		'Same CR4C response and shader; only exact CR2 E changes. Sunset is mandatory report-only evidence.',
		42,
		71,
	);
	const left = 42;
	const top = 124;
	const cellWidth = 390;
	const cellHeight = 244;
	const gapX = 20;
	const gapY = 28;
	const rows = [
		{key: 'controlCanvas', label: 'Unchanged Bruneton'},
		{key: 'candidateCanvas', label: 'Accepted CR4C response replay'},
		{key: 'differenceCanvas', label: '|candidate - Bruneton| x 8'},
		{key: 'deltaCanvas', label: 'Black / saturation delta mask'},
	];
	for (const [columnIndex, scene] of sceneResults.entries()) {
		const x = left + columnIndex * (cellWidth + gapX);
		context.fillStyle = '#d7dce8';
		context.font = 'bold 16px sans-serif';
		context.fillText(scene.label, x, 101);
		context.font = '12px monospace';
		context.fillStyle = scene.preservation.gatesCandidate
			? scene.preservation.passed
				? '#65d68a'
				: '#ff6b6b'
			: '#ffd166';
		context.fillText(
			scene.preservation.gatesCandidate
				? `legacy envelope ${scene.preservation.passed ? 'PASS' : 'FAIL'}`
				: 'sunset REPORT ONLY',
			x,
			119,
		);
		for (const [rowIndex, row] of rows.entries()) {
			const y = top + rowIndex * (cellHeight + gapY);
			context.drawImage(scene[row.key], x, y, cellWidth, cellHeight);
			if (columnIndex === 0) {
				context.fillStyle = '#b8c2d9';
				context.font = '13px sans-serif';
				context.fillText(row.label, left, y - 7);
			}
		}
	}
	context.drawImage(preservationFigure, 42, 1225, 700, 250);
	context.fillStyle = '#b8c2d9';
	context.font = '14px sans-serif';
	context.fillText('Delta: blue candidate-only black; cyan control-only black.', 780, 1290);
	context.fillText('Magenta candidate-only saturation; orange control-only saturation.', 780, 1320);
	context.fillText('White both saturated; black geometry.', 780, 1350);
	context.fillText('appearanceAccepted=false; no paper metric or production claim.', 780, 1405);
	return canvas;
}

export async function runCr4dBrightLowSunPreservationReplayBrowser() {
	const configurationResponse = await fetch('/browser/configuration.json');
	requireCondition(configurationResponse.ok, `CR4D configuration failed with HTTP ${configurationResponse.status}.`);
	const fixture = validateConfiguration(await configurationResponse.json());
	const width = fixture.viewport.widthPixels;
	const height = fixture.viewport.heightPixels;
	const pixelCount = width * height;
	await window.colorResetProgress('parent-input-started');
	const [cr1Input, cr2Input, cr4cInput, acceptedSunsetInput] = await Promise.all([
		fetchVerifiedBytes('/cr1/', fixture.parents.skyField.analysis, 'CR4D CR1 analysis'),
		fetchVerifiedBytes('/cr2/', fixture.parents.receiverLight.analysis, 'CR4D CR2 analysis'),
		fetchVerifiedBytes('/cr4c/', fixture.parents.acceptedCr4cRevision.analysis, 'CR4D accepted CR4C analysis'),
		fetchVerifiedBytes('/cr4c/', fixture.parents.acceptedCr4cRevision.sunsetPanel, 'CR4D accepted CR4C sunset'),
	]);
	const parentVerification = verifyParentAnalyses(
		fixture,
		parseVerifiedJson(cr1Input, 'CR4D CR1 analysis'),
		parseVerifiedJson(cr2Input, 'CR4D CR2 analysis'),
		parseVerifiedJson(cr4cInput, 'CR4D accepted CR4C analysis'),
	);
	const acceptedSunsetPixels = await decodePng(acceptedSunsetInput.bytes, width, height, 'CR4D accepted CR4C sunset');
	const brunetonModel = new BrunetonColorDisplayModel();
	const candidateModel = new Cr4cTwoScalePreToneExposureColorDisplayModel({
		curve: fixture.response.selectedCandidate,
	});
	const gpu = await createGpuReplay(width, height, [candidateModel]);
	requireCondition(gpu.facts.maximumTextureSize >= Math.max(width, height), 'CR4D viewport exceeds GPU limits.');
	const sceneResults = [];
	try {
		for (const scene of fixture.scenes) {
			const [fieldInput, maskInput, brunetonInput] = await Promise.all([
				fetchVerifiedBytes('/cr1/', scene.field, `CR4D ${scene.id} field`),
				fetchVerifiedBytes('/cr1/', scene.mask, `CR4D ${scene.id} mask`),
				fetchVerifiedBytes('/cr1/', scene.bruneton, `CR4D ${scene.id} Bruneton`),
			]);
			const decodedField = decodeFloat32Le(fieldInput.bytes, pixelCount * 4, `CR4D ${scene.id} field`);
			const maskFacts = validateMask(maskInput.bytes, pixelCount, `CR4D ${scene.id} mask`);
			const parentBruneton = await decodePng(brunetonInput.bytes, width, height, `CR4D ${scene.id} Bruneton`);
			const cpuBruneton = renderCpuBruneton(decodedField.values, width, height, brunetonModel);
			const parentBrunetonReplay = compareRgbCodes(cpuBruneton.rgba, parentBruneton, maskInput.bytes);
			const cpuCandidate = renderCpuCandidate(
				decodedField.values,
				width,
				height,
				candidateModel,
				scene.totalHorizontalIlluminance,
			);
			requireCondition(
				Math.abs(cpuCandidate.gain - scene.expectedCandidateGain) <=
					fixture.diagnostics.expectedGainAbsoluteError,
				`CR4D expected gain changed for ${scene.id}.`,
			);
			const gpuCandidate = renderCandidateGpu(
				gpu,
				candidateModel,
				decodedField.values,
				width,
				height,
				scene.totalHorizontalIlluminance,
			);
			const candidateVsBruneton = compareRgbCodes(gpuCandidate.rgbaTopDown, parentBruneton, maskInput.bytes);
			const envelope = preservationEnvelope(fixture, scene.totalHorizontalIlluminance.value);
			const gatesCandidate = fixture.legacyReceiverLightEnvelope.qualifiedSceneIds.includes(scene.id);
			const preservation = {
				qualification: gatesCandidate ? 'gate' : 'report-only',
				gatesCandidate,
				envelope,
				passed:
					!gatesCandidate ||
					(candidateVsBruneton.maximumAbsoluteRgbCodeDifference <=
						envelope.maximumAbsoluteRgbCodeDifference &&
						candidateVsBruneton.rgbCodeRmse <= envelope.rgbCodeRmse),
			};
			const delta = blackSaturationDeltaMask(
				gpuCandidate.rgbaTopDown,
				parentBruneton,
				maskInput.bytes,
				fixture.diagnostics.deltaMaskColors,
			);
			const sunsetPixelContinuity =
				scene.id === 'sunset' ? compareRgbCodes(gpuCandidate.rgbaTopDown, acceptedSunsetPixels) : null;
			sceneResults.push({
				sceneId: scene.id,
				label: scene.label,
				timeIso: scene.timeIso,
				totalHorizontalIlluminance: scene.totalHorizontalIlluminance,
				gain: cpuCandidate.gain,
				gainDerivativePerLux: cpuCandidate.gainDerivativePerLux,
				field: {...fieldInput.evidence, nonfiniteValueCount: decodedField.nonfiniteValueCount},
				mask: {...maskInput.evidence, ...maskFacts},
				bruneton: brunetonInput.evidence,
				parentBrunetonReplay,
				candidateGpuCpuParity: {
					encodedSky: compareRgbCodes(gpuCandidate.rgbaTopDown, cpuCandidate.rgba, maskInput.bytes),
					floatSky: compareFloatRgba(gpuCandidate.floatTopDown, cpuCandidate.displayRgba, maskInput.bytes),
				},
				candidateVsBruneton,
				display: summarizeDisplay(gpuCandidate.rgbaTopDown, maskInput.bytes),
				preservation,
				deltaMask: {counts: delta.counts},
				sunsetPixelContinuity,
				gpu: {
					fragmentSourceSha256: gpuCandidate.fragmentSourceSha256,
					framebufferStatus: gpuCandidate.framebufferStatus,
					errors: gpuCandidate.errors,
					contextLost: gpuCandidate.contextLost,
				},
				controlCanvas: rgbaCanvas(parentBruneton, width, height),
				candidateCanvas: rgbaCanvas(gpuCandidate.rgbaTopDown, width, height),
				differenceCanvas: rgbaCanvas(
					differenceRgba(
						gpuCandidate.rgbaTopDown,
						parentBruneton,
						fixture.diagnostics.differenceAmplification,
					),
					width,
					height,
				),
				deltaCanvas: rgbaCanvas(delta.rgba, width, height),
			});
		}

		const shaderHashes = sceneResults.map(({gpu: {fragmentSourceSha256}}) => fragmentSourceSha256);
		const preservationFigure = responsePreservationFigure(fixture, candidateModel, sceneResults);
		const plate = decisionPlate(fixture, sceneResults, preservationFigure);
		const uploadedImages = [];
		const imageUploadOrder = [];
		const panelIdentities = [];
		const imageDerivations = [];
		const uploadImage = async (artifactPath, bytes, identity, derivation) => {
			const uploaded = await uploadBytes(artifactPath, bytes, 'image/png');
			uploadedImages.push(uploaded);
			imageUploadOrder.push(artifactPath);
			panelIdentities.push({...identity, artifactPath, byteLength: uploaded.byteLength, sha256: uploaded.sha256});
			imageDerivations.push({...derivation, artifactPath, resultSha256: uploaded.sha256});
			if (imageUploadOrder.length === 1) await window.colorResetProgress('first-image-complete');
		};
		for (const [index, scene] of sceneResults.entries()) {
			await uploadImage(
				fixture.outputs.controls[index],
				canvasPngBytes(scene.controlCanvas),
				{panelId: `bruneton-${scene.sceneId}`, role: 'unchanged accepted CR1 Bruneton control'},
				{
					operation: 'pixel-exact decoded parent replay',
					parentRunId: fixture.parents.skyField.runId,
					parentArtifact: scene.bruneton,
				},
			);
		}
		for (const [index, scene] of sceneResults.entries()) {
			await uploadImage(
				fixture.outputs.candidates[index],
				canvasPngBytes(scene.candidateCanvas),
				{
					panelId: `pre-tone-two-scale-${scene.sceneId}`,
					role: 'WebGL2 accepted CR4C response replay',
					gain: scene.gain,
				},
				{
					operation: fixture.response.operation,
					parentField: scene.field,
					totalHorizontalIlluminance: scene.totalHorizontalIlluminance,
					fragmentSourceSha256: scene.gpu.fragmentSourceSha256,
				},
			);
		}
		for (const [index, scene] of sceneResults.entries()) {
			await uploadImage(
				fixture.outputs.differences[index],
				canvasPngBytes(scene.differenceCanvas),
				{panelId: `difference-x8-${scene.sceneId}`, role: 'amplified candidate-versus-Bruneton difference'},
				{
					operation: `absolute RGB8 difference times ${fixture.diagnostics.differenceAmplification}, clamped to 255`,
					candidateArtifactPath: fixture.outputs.candidates[index],
					controlArtifactPath: fixture.outputs.controls[index],
				},
			);
		}
		for (const [index, scene] of sceneResults.entries()) {
			await uploadImage(
				fixture.outputs.deltaMasks[index],
				canvasPngBytes(scene.deltaCanvas),
				{
					panelId: `black-saturation-delta-${scene.sceneId}`,
					role: 'candidate-versus-Bruneton black/saturation delta mask',
				},
				{
					operation:
						'Classify candidate-only, control-only, shared black/saturation, ordinary sky, and geometry from RGB8 plus exact CR1 R8 mask.',
					parentMask: scene.mask,
					candidateArtifactPath: fixture.outputs.candidates[index],
					controlArtifactPath: fixture.outputs.controls[index],
				},
			);
		}
		await uploadImage(
			fixture.outputs.figures[0],
			canvasPngBytes(preservationFigure),
			{panelId: 'response-preservation', role: 'response and unchanged legacy preservation envelope report'},
			{
				operation:
					'Plot accepted response and exact receiver states; compare measured RGB8 differences with the unchanged legacy envelope only for the three qualified controls.',
				response: fixture.response,
				envelope: fixture.legacyReceiverLightEnvelope,
			},
		);
		await uploadImage(
			fixture.outputs.decisionPlate,
			canvasPngBytes(plate),
			{panelId: 'decision-plate', role: 'labeled CR4D bright/low-Sun preservation plate'},
			{
				operation:
					'Arrange all rendered controls, candidates, x8 differences, delta masks, and response/preservation plot.',
				sourceArtifactPaths: fixture.outputs.requestedImageUploadOrder.slice(0, -1),
				appearanceAccepted: false,
			},
		);
		await window.colorResetProgress('decision-plate-complete');
		requireCondition(
			JSON.stringify(imageUploadOrder) === JSON.stringify(fixture.outputs.requestedImageUploadOrder),
			'CR4D image upload order changed.',
		);
		const terminalErrors = drainWebglErrors(gpu.context);
		const allErrors = [
			...gpu.facts.startupErrors,
			...sceneResults.flatMap(({gpu: {errors}}) => errors),
			...terminalErrors,
		];
		const uploadedByPath = new Map(uploadedImages.map((image) => [image.artifactPath, image]));
		return {
			schemaId: 'algorithm32-color-reset-cr4d-bright-low-sun-preservation-browser-result-v1',
			renderComplete: true,
			integrityGateEvaluated: false,
			appearanceAccepted: false,
			paperSimilarityMetric: null,
			paperTarget: null,
			claimBoundary: fixture.claimBoundary,
			parents: {
				skyField: {...fixture.parents.skyField, analysis: cr1Input.evidence},
				receiverLight: {...fixture.parents.receiverLight, analysis: cr2Input.evidence},
				acceptedCr4cRevision: {
					...fixture.parents.acceptedCr4cRevision,
					analysis: cr4cInput.evidence,
					sunsetPanel: acceptedSunsetInput.evidence,
				},
				verification: parentVerification,
			},
			response: fixture.response,
			legacyReceiverLightEnvelope: fixture.legacyReceiverLightEnvelope,
			scenes: sceneResults.map(
				({controlCanvas, candidateCanvas, differenceCanvas, deltaCanvas, ...scene}) => scene,
			),
			sunsetPixelContinuity: sceneResults.find(({sceneId}) => sceneId === 'sunset').sunsetPixelContinuity,
			shaderIdentity: {
				fragmentSourceSha256: shaderHashes[0],
				sceneFragmentSourceHashes: shaderHashes,
				uniqueFragmentSourceHashCount: new Set(shaderHashes).size,
				programCompiledOnceAndReusedForAllScenes: true,
				responseConfigurationChangedAcrossScenes: false,
				onlyResponseStateUniformChangedAcrossScenes: 'uTotalHorizontalIlluminanceLux',
				sceneFieldTextureNecessarilyChanges: true,
				sameFragmentSourceAcrossScenes: new Set(shaderHashes).size === 1,
			},
			gpu: {...gpu.facts, terminalErrors, errors: allErrors, contextLost: gpu.context.isContextLost()},
			requestedImageCount: fixture.outputs.requestedImageUploadOrder.length,
			uploadedImageCount: uploadedImages.length,
			imageUploadOrder,
			uploadOrder: imageUploadOrder,
			uploadedImages,
			images: uploadedImages,
			controls: fixture.outputs.controls.map((artifactPath) => uploadedByPath.get(artifactPath)),
			candidates: fixture.outputs.candidates.map((artifactPath) => uploadedByPath.get(artifactPath)),
			differences: fixture.outputs.differences.map((artifactPath) => uploadedByPath.get(artifactPath)),
			deltaMasks: fixture.outputs.deltaMasks.map((artifactPath) => uploadedByPath.get(artifactPath)),
			figures: fixture.outputs.figures.map((artifactPath) => uploadedByPath.get(artifactPath)),
			allDeclaredImagesUploaded: true,
			panelIdentities,
			imageDerivations,
		};
	} finally {
		for (const scene of sceneResults) {
			for (const key of ['controlCanvas', 'candidateCanvas', 'differenceCanvas', 'deltaCanvas']) {
				scene[key]?.remove();
			}
		}
		disposeGpuReplay(gpu);
	}
}
