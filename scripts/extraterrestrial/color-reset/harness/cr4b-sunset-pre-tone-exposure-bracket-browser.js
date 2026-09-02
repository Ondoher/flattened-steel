import {BrunetonColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {
	CR4B_PRE_TONE_EXPOSURE_RESPONSE_ID,
	Cr4bPreToneExposureColorDisplayModel,
} from '../color/Cr4bPreToneExposureColorDisplayModel.js';

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
const float CR4B_MAXIMUM_GAIN = ${glslFloat(curve.maximumGain)};
const float CR4B_TRANSITION_ILLUMINANCE_LUX = ${glslFloat(curve.transitionIlluminanceLux)};
const float CR4B_ROLLOFF_POWER = ${glslFloat(curve.rolloffPower)};
float cr4bDisplayGain(float totalHorizontalIlluminanceLux) {
	float ratio = max(totalHorizontalIlluminanceLux, 0.0) / CR4B_TRANSITION_ILLUMINANCE_LUX;
	return 1.0 + (CR4B_MAXIMUM_GAIN - 1.0) / (1.0 + pow(ratio, CR4B_ROLLOFF_POWER));
}
void main() {
	vec3 signedProjectedLinearRgb = texture(uLinearField, vec2(vScreenUv.x, 1.0 - vScreenUv.y)).rgb;
	vec3 exposedLinearRgb = signedProjectedLinearRgb * cr4bDisplayGain(uTotalHorizontalIlluminanceLux);
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

function reportOnlyPreservationEnvelope(fixture, illuminanceLux) {
	const maximum = fixture.reportOnlyBrunetonPreservation.maximumAbsoluteRgbCodeDifference;
	const rmse = fixture.reportOnlyBrunetonPreservation.rgbCodeRmse;
	return {
		maximumAbsoluteRgbCodeDifference:
			maximum.daylightFloorCodes +
			maximum.lowSunRelaxationCodes / (1 + (illuminanceLux / maximum.scaleIlluminanceLux) ** maximum.power),
		rgbCodeRmse:
			rmse.daylightFloorCodes +
			rmse.lowSunRelaxationCodes / (1 + (illuminanceLux / rmse.scaleIlluminanceLux) ** rmse.power),
		gatesCandidateEligibility: false,
	};
}

function curveDiagnostics(models, fixture) {
	const proof = fixture.diagnostics.curveProof;
	const minimumPositive = fixture.diagnostics.responsePlot.minimumPlottedIlluminanceLux;
	const maximum = proof.maximumIlluminanceLux;
	return models.map((model) => {
		const samples = [{value: 0, units: 'lux'}];
		for (let index = 0; index < proof.logarithmicSampleCount; index += 1) {
			const fraction = index / (proof.logarithmicSampleCount - 1);
			samples.push({
				value:
					10 **
					(Math.log10(minimumPositive) + (Math.log10(maximum) - Math.log10(minimumPositive)) * fraction),
				units: 'lux',
			});
		}
		let finite = true;
		let monotonicNonincreasing = true;
		let derivativeNonpositive = true;
		let previousGain = Number.POSITIVE_INFINITY;
		let maximumDerivativeAbsoluteError = 0;
		let maximumDerivativeRelativeError = 0;
		for (const sample of samples) {
			const gain = model.displayGain(sample);
			const derivative = model.displayGainDerivative(sample);
			finite &&= Number.isFinite(gain) && Number.isFinite(derivative);
			monotonicNonincreasing &&= gain <= previousGain;
			derivativeNonpositive &&= derivative <= 0;
			previousGain = gain;
			if (sample.value > 0) {
				const step = Math.max(Number.EPSILON, sample.value * proof.finiteDifferenceRelativeStep);
				const lower = Math.max(0, sample.value - step);
				const upper = sample.value + step;
				const numerical =
					(model.displayGain({value: upper, units: 'lux'}) -
						model.displayGain({value: lower, units: 'lux'})) /
					(upper - lower);
				const absoluteError = Math.abs(numerical - derivative);
				maximumDerivativeAbsoluteError = Math.max(maximumDerivativeAbsoluteError, absoluteError);
				maximumDerivativeRelativeError = Math.max(
					maximumDerivativeRelativeError,
					absoluteError / Math.max(1, Math.abs(derivative)),
				);
			}
		}
		return {
			candidateId: model.curve.id,
			curve: model.curve,
			finite,
			monotonicNonincreasing,
			derivativeNonpositive,
			continuousValueAndSlopeByAnalyticContract:
				model.curve.transitionIlluminanceLux > 0 && model.curve.rolloffPower > 1,
			gainAtZeroLux: model.displayGain({value: 0, units: 'lux'}),
			derivativeAtZeroPerLux: model.displayGainDerivative({value: 0, units: 'lux'}),
			gainAtMaximumLux: model.displayGain({value: maximum, units: 'lux'}),
			maximumDerivativeAbsoluteError,
			maximumDerivativeRelativeError,
		};
	});
}

function responseCurveFigure(fixture, models) {
	const specification = fixture.diagnostics.responsePlot;
	const canvas = document.createElement('canvas');
	canvas.width = specification.widthPixels;
	canvas.height = specification.heightPixels;
	const context = canvas.getContext('2d', {alpha: false});
	requireCondition(context, 'CR4B could not create response plot.');
	context.fillStyle = '#10141d';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#f5f7ff';
	context.font = 'bold 32px sans-serif';
	context.fillText('CR4B pre-tone exposure response', 70, 55);
	context.font = '18px sans-serif';
	context.fillStyle = '#b8c2d9';
	context.fillText('g(E;G), common to signed projected linear R, G, and B before unchanged Bruneton', 70, 86);
	const plot = {left: 105, top: 125, width: canvas.width - 175, height: canvas.height - 235};
	context.strokeStyle = '#59647a';
	context.lineWidth = 2;
	context.strokeRect(plot.left, plot.top, plot.width, plot.height);
	const minimum = specification.minimumPlottedIlluminanceLux;
	const maximum = specification.maximumPlottedIlluminanceLux;
	const maximumGain = Math.max(...models.map((model) => model.curve.maximumGain));
	const x = (illuminance) =>
		plot.left +
		((Math.log10(illuminance) - Math.log10(minimum)) / (Math.log10(maximum) - Math.log10(minimum))) * plot.width;
	const y = (gain) =>
		plot.top + plot.height - (Math.log10(Math.max(1, gain)) / Math.log10(maximumGain)) * plot.height;
	for (let decade = -3; decade <= 5; decade += 1) {
		const illuminance = 10 ** decade;
		if (illuminance < minimum || illuminance > maximum) continue;
		context.strokeStyle = '#263044';
		context.beginPath();
		context.moveTo(x(illuminance), plot.top);
		context.lineTo(x(illuminance), plot.top + plot.height);
		context.stroke();
		context.fillStyle = '#b8c2d9';
		context.font = '15px sans-serif';
		context.fillText(`10^${decade}`, x(illuminance) - 18, plot.top + plot.height + 26);
	}
	for (const [index, model] of models.entries()) {
		context.strokeStyle = CANDIDATE_COLORS[index];
		context.lineWidth = 3;
		context.beginPath();
		for (let sample = 0; sample <= 1024; sample += 1) {
			const fraction = sample / 1024;
			const illuminance = 10 ** (Math.log10(minimum) + (Math.log10(maximum) - Math.log10(minimum)) * fraction);
			const gain = model.displayGain({value: illuminance, units: 'lux'});
			if (sample === 0) context.moveTo(x(illuminance), y(gain));
			else context.lineTo(x(illuminance), y(gain));
		}
		context.stroke();
		context.fillStyle = CANDIDATE_COLORS[index];
		context.font = 'bold 18px sans-serif';
		context.fillText(model.curve.id, 110 + index * 330, canvas.height - 50);
	}
	const sceneX = x(fixture.scene.totalHorizontalIlluminance.value);
	context.strokeStyle = '#ffffff';
	context.setLineDash([8, 6]);
	context.beginPath();
	context.moveTo(sceneX, plot.top);
	context.lineTo(sceneX, plot.top + plot.height);
	context.stroke();
	context.setLineDash([]);
	context.fillStyle = '#ffffff';
	context.font = '16px sans-serif';
	context.fillText(
		`sunset E = ${fixture.scene.totalHorizontalIlluminance.value.toFixed(6)} lux`,
		sceneX + 8,
		plot.top + 24,
	);
	context.save();
	context.translate(28, plot.top + plot.height / 2);
	context.rotate(-Math.PI / 2);
	context.fillText('gain (log scale)', 0, 0);
	context.restore();
	context.fillText('total-horizontal receiver illuminance E in lux (log scale)', plot.left + 350, canvas.height - 12);
	return canvas;
}

function decisionPlate(fixture, panelCanvases, masks, differences, responsePlot, candidates) {
	const canvas = document.createElement('canvas');
	canvas.width = 1400;
	canvas.height = 1180;
	const context = canvas.getContext('2d', {alpha: false});
	requireCondition(context, 'CR4B could not create decision plate.');
	context.fillStyle = '#0d1119';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#f5f7ff';
	context.font = 'bold 30px sans-serif';
	context.fillText('CR4B — actual-sunset pre-tone exposure bracket', 45, 45);
	context.font = '17px sans-serif';
	context.fillStyle = '#b8c2d9';
	context.fillText(
		'Accepted CR1 signed linear field + CR2 total-horizontal E; CR4A is qualitative rationale only',
		45,
		74,
	);
	const columns = [
		{id: 'bruneton', label: 'Unchanged Bruneton', gain: 1},
		...candidates.map((candidate) => ({
			id: candidate.candidateId,
			label: candidate.label,
			gain: candidate.gain,
		})),
	];
	const cellWidth = 320;
	const imageHeight = 200;
	const left = 45;
	for (const [columnIndex, column] of columns.entries()) {
		const x = left + columnIndex * 335;
		context.fillStyle = columnIndex === 0 ? '#d7dce8' : CANDIDATE_COLORS[columnIndex - 1];
		context.font = 'bold 17px sans-serif';
		context.fillText(column.label, x, 112);
		context.font = '14px sans-serif';
		context.fillStyle = '#b8c2d9';
		context.fillText(`gain ${column.gain.toFixed(6)}`, x, 134);
		context.drawImage(panelCanvases[columnIndex], x, 150, cellWidth, imageHeight);
		if (columnIndex > 0) {
			context.drawImage(masks[columnIndex - 1], x, 375, cellWidth, imageHeight);
			context.drawImage(differences[columnIndex - 1], x, 600, cellWidth, imageHeight);
			const candidate = candidates[columnIndex - 1];
			context.font = '13px monospace';
			context.fillStyle = '#d7dce8';
			context.fillText(`black ${(100 * candidate.display.blackSkyPixelFraction).toFixed(3)}%`, x, 820);
			context.fillText(`saturated ${(100 * candidate.display.saturatedSkyPixelFraction).toFixed(3)}%`, x, 840);
			context.fillText(
				`vs Bruneton RMSE ${candidate.candidateVsBruneton.rgbCodeRmse.toFixed(3)} (report only)`,
				x,
				860,
			);
		} else {
			context.fillStyle = '#202938';
			context.fillRect(x, 375, cellWidth, imageHeight);
			context.fillRect(x, 600, cellWidth, imageHeight);
			context.fillStyle = '#8e9ab1';
			context.font = '16px sans-serif';
			context.fillText('mask: control', x + 102, 480);
			context.fillText('difference: control', x + 84, 705);
		}
	}
	context.fillStyle = '#b8c2d9';
	context.font = '15px sans-serif';
	context.fillText('candidate display', 45, 146);
	context.fillText('black/saturation mask', 45, 371);
	context.fillText(`|candidate − Bruneton| × ${fixture.diagnostics.differenceAmplification}`, 45, 596);
	context.drawImage(responsePlot, 45, 890, 620, 250);
	context.fillStyle = '#d7dce8';
	context.font = '16px sans-serif';
	context.fillText('Integrity/scientific evidence only; no row is appearance-approved.', 715, 945);
	context.fillText('Legacy sunset preservation envelope is reported, never used to hide a row.', 715, 976);
	context.fillText('Paper pixels are neither a metric nor a target.', 715, 1007);
	context.fillStyle = '#8e9ab1';
	context.font = '14px sans-serif';
	context.fillText('Mask: blue = black sky, magenta = saturated sky, black = geometry.', 715, 1050);
	context.fillText('All twelve requested images are written before runner gates.', 715, 1080);
	return canvas;
}

function expectedPaths(fixture) {
	return [
		fixture.scene.bruneton.path,
		...fixture.response.candidates.map((candidate) => `captures/${candidate.id}-${fixture.scene.id}.png`),
	];
}

function validateConfiguration(configuration) {
	const fixture = configuration.fixture ?? configuration;
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr4b-sunset-pre-tone-exposure-bracket-input-v1',
		'CR4B fixture schema changed.',
	);
	requireCondition(fixture.scene.id === 'sunset', 'CR4B must contain only actual sunset.');
	requireCondition(fixture.response.candidates.length === 3, 'CR4B requires exactly three candidates.');
	requireCondition(fixture.response.id === CR4B_PRE_TONE_EXPOSURE_RESPONSE_ID, 'CR4B response identity changed.');
	requireCondition(
		JSON.stringify(fixture.outputs.panels) === JSON.stringify(expectedPaths(fixture)),
		'CR4B panel declaration or order changed.',
	);
	requireCondition(fixture.outputs.masks.length === 3, 'CR4B requires three masks.');
	requireCondition(fixture.outputs.differences.length === 3, 'CR4B requires three differences.');
	requireCondition(fixture.outputs.figures.length === 2, 'CR4B requires response and decision figures.');
	requireCondition(
		fixture.outputs.figures.at(-1) === fixture.outputs.decisionPlate,
		'CR4B decision plate must be the final figure.',
	);
	requireCondition(
		JSON.stringify(fixture.outputs.requestedImageUploadOrder) ===
			JSON.stringify([
				...fixture.outputs.panels,
				...fixture.outputs.masks,
				...fixture.outputs.differences,
				...fixture.outputs.figures,
			]),
		'CR4B requested image upload order changed.',
	);
	requireCondition(
		fixture.claimBoundary.appearanceAcceptanceGate === false &&
			fixture.claimBoundary.paperSimilarityMetric === false &&
			fixture.reportOnlyBrunetonPreservation.gatesCandidateEligibility === false,
		'CR4B diagnostic claim boundary changed.',
	);
	return fixture;
}

function verifyParentAnalysis(fixture, cr1, cr2, cr4a) {
	requireCondition(
		cr1.schemaId === 'algorithm32-color-reset-cr1-browser-result-v1',
		'CR4B CR1 analysis schema changed.',
	);
	const cr1Scene = cr1.scenes.find((scene) => scene.sceneId === fixture.scene.id);
	requireCondition(cr1Scene, 'CR4B CR1 sunset analysis is missing.');
	requireCondition(
		cr1Scene.field?.rawArtifactPath === fixture.scene.field.path &&
			cr1Scene.hitMask?.artifactPath === fixture.scene.mask.path,
		'CR4B CR1 sunset artifact references changed.',
	);
	requireCondition(
		cr2.schemaId === 'algorithm32-color-reset-cr2-browser-result-v1',
		'CR4B CR2 analysis schema changed.',
	);
	const cr2Scene = cr2.scenes.find((scene) => scene.sceneId === fixture.scene.id);
	const total = cr2Scene?.measurement?.photopic?.totalHorizontal?.illuminance;
	requireCondition(
		total?.units === fixture.scene.totalHorizontalIlluminance.units &&
			total.value === fixture.scene.totalHorizontalIlluminance.value,
		'CR4B CR2 sunset receiver-light scalar changed.',
	);
	const direct = cr2Scene.measurement.photopic.directHorizontal.illuminance.value;
	const diffuse = cr2Scene.measurement.photopic.diffuseHorizontal.illuminance.value;
	const equationDifferenceLux = Math.abs(direct + diffuse - total.value);
	requireCondition(
		equationDifferenceLux <= 1e-9 * Math.max(1, total.value),
		'CR4B CR2 total-horizontal equation changed.',
	);
	requireCondition(
		cr4a.schemaId === 'algorithm32-color-reset-cr4a-native15-sunset-paper-analysis-v1' &&
			cr4a.acceptedForIntegrityEvaluation === true &&
			cr4a.appearanceAccepted === false &&
			cr4a.paperSimilarityMetric === null,
		'CR4B CR4A qualitative-rationale boundary changed.',
	);
	return {
		cr1: {
			fieldArtifactPath: cr1Scene.field.rawArtifactPath,
			hitMaskArtifactPath: cr1Scene.hitMask.artifactPath,
			fieldColorId: cr1Scene.field.colorId,
			brunetonColorId: cr1Scene.frames?.bruneton?.colorId,
		},
		cr2: {
			value: total.value,
			units: total.units,
			directHorizontalLux: direct,
			diffuseHorizontalLux: diffuse,
			equationDifferenceLux,
		},
		cr4a: {
			acceptedForIntegrityEvaluation: cr4a.acceptedForIntegrityEvaluation,
			appearanceAccepted: cr4a.appearanceAccepted,
			paperSimilarityMetric: cr4a.paperSimilarityMetric,
			role: fixture.parents.qualitativeStructure.role,
		},
	};
}

/** Replay and upload the complete CR4B sunset bracket before returning any gate facts. */
export async function runCr4bSunsetPreToneExposureBracketBrowser() {
	const configurationResponse = await fetch('/browser/configuration.json');
	requireCondition(
		configurationResponse.ok,
		`CR4B browser configuration failed with HTTP ${configurationResponse.status}.`,
	);
	const fixture = validateConfiguration(await configurationResponse.json());
	const width = fixture.viewport.widthPixels;
	const height = fixture.viewport.heightPixels;
	const pixelCount = width * height;
	await window.colorResetProgress('parent-input-started');
	const [cr1AnalysisInput, cr2AnalysisInput, cr4aAnalysisInput, fieldInput, maskInput, brunetonInput] =
		await Promise.all([
			fetchVerifiedBytes('/cr1/', fixture.parents.skyField.analysis, 'CR4B CR1 analysis'),
			fetchVerifiedBytes('/cr2/', fixture.parents.receiverLight.analysis, 'CR4B CR2 analysis'),
			fetchVerifiedBytes('/cr4a/', fixture.parents.qualitativeStructure.analysis, 'CR4B CR4A analysis'),
			fetchVerifiedBytes('/cr1/', fixture.scene.field, 'CR4B CR1 sunset field'),
			fetchVerifiedBytes('/cr1/', fixture.scene.mask, 'CR4B CR1 sunset mask'),
			fetchVerifiedBytes('/cr1/', fixture.scene.bruneton, 'CR4B CR1 sunset Bruneton'),
		]);
	const parentVerification = verifyParentAnalysis(
		fixture,
		parseVerifiedJson(cr1AnalysisInput, 'CR4B CR1 analysis'),
		parseVerifiedJson(cr2AnalysisInput, 'CR4B CR2 analysis'),
		parseVerifiedJson(cr4aAnalysisInput, 'CR4B CR4A analysis'),
	);
	const decodedField = decodeFloat32Le(fieldInput.bytes, pixelCount * 4, 'CR4B sunset field');
	const maskFacts = validateMask(maskInput.bytes, pixelCount, 'CR4B sunset mask');
	const parentBruneton = await decodePng(brunetonInput.bytes, width, height, 'CR4B Bruneton control');
	const illuminance = fixture.scene.totalHorizontalIlluminance;
	const brunetonModel = new BrunetonColorDisplayModel();
	const models = fixture.response.candidates.map(
		(candidate) => new Cr4bPreToneExposureColorDisplayModel({curve: candidate}),
	);
	const cpuBruneton = renderCpuBruneton(decodedField.values, width, height, brunetonModel);
	const parentReplay = compareRgbCodes(cpuBruneton.rgba, parentBruneton, maskInput.bytes);
	const gpu = await createGpuReplay(width, height, models);
	requireCondition(gpu.facts.maximumTextureSize >= Math.max(width, height), 'CR4B viewport exceeds GPU limits.');
	const candidates = [];
	const panelCanvases = [rgbaCanvas(parentBruneton, width, height)];
	const maskCanvases = [];
	const differenceCanvases = [];
	try {
		for (const [index, model] of models.entries()) {
			const declaration = fixture.response.candidates[index];
			const cpu = renderCpuCandidate(decodedField.values, width, height, model, illuminance);
			requireCondition(
				Math.abs(cpu.gain - declaration.expectedSunsetGain) <=
					fixture.diagnostics.curveProof.maximumExpectedGainAbsoluteError,
				`CR4B ${declaration.id} sunset gain changed.`,
			);
			const gpuFrame = renderCandidateGpu(gpu, model, decodedField.values, width, height, illuminance);
			const encodedSky = compareRgbCodes(gpuFrame.rgbaTopDown, cpu.rgba, maskInput.bytes);
			const encodedAllPixels = compareRgbCodes(gpuFrame.rgbaTopDown, cpu.rgba);
			const floatSky = compareFloatRgba(gpuFrame.floatTopDown, cpu.displayRgba, maskInput.bytes);
			const candidateVsBruneton = compareRgbCodes(cpu.rgba, cpuBruneton.rgba, maskInput.bytes);
			const envelope = reportOnlyPreservationEnvelope(fixture, illuminance.value);
			const display = summarizeDisplay(gpuFrame.rgbaTopDown, maskInput.bytes);
			const panel = rgbaCanvas(gpuFrame.rgbaTopDown, width, height);
			const mask = rgbaCanvas(
				blackSaturationMaskRgba(gpuFrame.rgbaTopDown, maskInput.bytes, fixture.diagnostics.maskColors),
				width,
				height,
			);
			const difference = rgbaCanvas(
				differenceRgba(cpu.rgba, cpuBruneton.rgba, fixture.diagnostics.differenceAmplification),
				width,
				height,
			);
			panelCanvases.push(panel);
			maskCanvases.push(mask);
			differenceCanvases.push(difference);
			const parity = {encodedSky, encodedAllPixels, floatSky};
			candidates.push({
				candidateId: declaration.id,
				label: declaration.label,
				curve: model.curve,
				gain: cpu.gain,
				gainDerivativePerLux: cpu.gainDerivativePerLux,
				preToneOrdering: cpu.preToneOrdering,
				commonGainProof: cpu.commonGainProof,
				gpu: {
					artifactPath: fixture.outputs.panels[index + 1],
					fragmentSourceSha256: gpuFrame.fragmentSourceSha256,
					framebufferStatus: gpuFrame.framebufferStatus,
					errors: gpuFrame.errors,
					contextLost: gpuFrame.contextLost,
				},
				gpuCpuParity: parity,
				cpuGpuParity: parity,
				display,
				candidateVsBruneton: {
					...candidateVsBruneton,
					reportOnlyEnvelope: envelope,
					insideLegacyEnvelope:
						candidateVsBruneton.maximumAbsoluteRgbCodeDifference <=
							envelope.maximumAbsoluteRgbCodeDifference &&
						candidateVsBruneton.rgbCodeRmse <= envelope.rgbCodeRmse,
					gatesCandidateEligibility: false,
				},
			});
		}

		const responseProof = curveDiagnostics(models, fixture);
		const responsePlot = responseCurveFigure(fixture, models);
		const plate = decisionPlate(fixture, panelCanvases, maskCanvases, differenceCanvases, responsePlot, candidates);
		const imageUploadOrder = [];
		const uploadedImages = [];
		const panelIdentities = [];
		const imageDerivations = [];
		const uploadImage = async (artifactPath, bytes, identity, derivation) => {
			const upload = await uploadBytes(artifactPath, bytes, 'image/png');
			uploadedImages.push(upload);
			imageUploadOrder.push(artifactPath);
			panelIdentities.push({...identity, artifactPath, byteLength: upload.byteLength, sha256: upload.sha256});
			imageDerivations.push({...derivation, artifactPath, resultSha256: upload.sha256});
			if (imageUploadOrder.length === 1) await window.colorResetProgress('first-image-complete');
		};

		await uploadImage(
			fixture.outputs.panels[0],
			brunetonInput.bytes,
			{panelId: 'bruneton', role: 'unchanged accepted CR1 Bruneton sunset control'},
			{
				operation: 'byte-exact copy',
				parentRunId: fixture.parents.skyField.runId,
				parentArtifact: brunetonInput.evidence,
			},
		);
		for (let index = 0; index < candidates.length; index += 1) {
			const candidate = candidates[index];
			await uploadImage(
				fixture.outputs.panels[index + 1],
				canvasPngBytes(panelCanvases[index + 1]),
				{
					panelId: candidate.candidateId,
					role: 'WebGL2 CR4B pre-tone sunset candidate',
					gain: candidate.gain,
				},
				{
					operation: fixture.response.operation,
					parentRunId: fixture.parents.skyField.runId,
					parentField: fieldInput.evidence,
					parentReceiverLightRunId: fixture.parents.receiverLight.runId,
					totalHorizontalIlluminance: illuminance,
					curve: candidate.curve,
					fragmentSourceSha256: candidate.gpu.fragmentSourceSha256,
				},
			);
		}
		for (let index = 0; index < candidates.length; index += 1) {
			await uploadImage(
				fixture.outputs.masks[index],
				canvasPngBytes(maskCanvases[index]),
				{panelId: `black-saturation-${candidates[index].candidateId}`, role: 'candidate black/saturation mask'},
				{
					operation:
						'Classify sky pixels from persisted candidate RGB8; blue black, magenta saturated, black geometry.',
					candidateArtifactPath: fixture.outputs.panels[index + 1],
					parentMask: maskInput.evidence,
					colors: fixture.diagnostics.maskColors,
				},
			);
		}
		for (let index = 0; index < candidates.length; index += 1) {
			await uploadImage(
				fixture.outputs.differences[index],
				canvasPngBytes(differenceCanvases[index]),
				{
					panelId: `difference-${candidates[index].candidateId}`,
					role: 'amplified candidate-versus-Bruneton difference',
				},
				{
					operation: `absolute RGB8 difference times ${fixture.diagnostics.differenceAmplification}, clamped to 255`,
					candidateArtifactPath: fixture.outputs.panels[index + 1],
					controlArtifactPath: fixture.outputs.panels[0],
					metricsAreReportOnly: true,
				},
			);
		}
		await uploadImage(
			fixture.outputs.figures[0],
			canvasPngBytes(responsePlot),
			{panelId: 'response-curves', role: 'analytic response diagnostic'},
			{
				operation: 'Plot the frozen analytic gain family over the declared logarithmic receiver-light domain.',
				response: fixture.response,
				responseProof,
			},
		);
		await uploadImage(
			fixture.outputs.decisionPlate,
			canvasPngBytes(plate),
			{panelId: 'decision-plate', role: 'labeled CR4B sunset decision plate'},
			{
				operation:
					'Arrange the already rendered control, candidates, masks, differences, plot, and report-only metrics.',
				sourceArtifactPaths: fixture.outputs.requestedImageUploadOrder.slice(0, -1),
				appearanceAccepted: false,
			},
		);
		await window.colorResetProgress('decision-plate-complete');
		requireCondition(
			JSON.stringify(imageUploadOrder) === JSON.stringify(fixture.outputs.requestedImageUploadOrder),
			'CR4B image upload order changed.',
		);

		const terminalErrors = drainWebglErrors(gpu.context);
		const allErrors = [
			...gpu.facts.startupErrors,
			...candidates.flatMap((candidate) => candidate.gpu.errors),
			...terminalErrors,
		];
		const uploadedByPath = new Map(uploadedImages.map((image) => [image.artifactPath, image]));
		return {
			schemaId: 'algorithm32-color-reset-cr4b-browser-result-v1',
			renderComplete: true,
			integrityGateEvaluated: false,
			appearanceAccepted: false,
			paperSimilarityMetric: null,
			claimBoundary: fixture.claimBoundary,
			software: {browserUserAgent: navigator.userAgent, webCrypto: 'SubtleCrypto SHA-256'},
			parents: {
				skyField: {...fixture.parents.skyField, analysis: cr1AnalysisInput.evidence},
				receiverLight: {...fixture.parents.receiverLight, analysis: cr2AnalysisInput.evidence},
				qualitativeStructure: {
					...fixture.parents.qualitativeStructure,
					analysis: cr4aAnalysisInput.evidence,
				},
				verification: parentVerification,
			},
			scene: {
				id: fixture.scene.id,
				label: fixture.scene.label,
				timeIso: fixture.scene.timeIso,
				totalHorizontalIlluminance: illuminance,
				field: {...fieldInput.evidence, nonfiniteValueCount: decodedField.nonfiniteValueCount},
				mask: {...maskInput.evidence, ...maskFacts},
				bruneton: brunetonInput.evidence,
				parentBrunetonReplay: parentReplay,
				brunetonCpuReplay: parentReplay,
			},
			receiverLightScalar: {
				...fixture.receiverLightScalar,
				value: illuminance.value,
				verifiedExactFromCr2: true,
			},
			response: fixture.response,
			responseProof,
			oneScalarCommonChannels: {
				passed: candidates.every(
					(candidate) =>
						candidate.commonGainProof.oneScalarForEveryPixelAndChannel === true &&
						candidate.commonGainProof.maximumSignedLinearRgbCrossProductError <=
							fixture.diagnostics.commonGain.maximumSignedLinearRgbCrossProductError,
				),
				receiverValue: illuminance,
				responseId: fixture.response.id,
			},
			preToneOrderingProof: {
				passed: candidates.every(
					(candidate) =>
						candidate.preToneOrdering.maximumIndependentCpuAbsoluteDifference <=
							fixture.diagnostics.preToneOrdering.maximumIndependentCpuAbsoluteDifference &&
						candidate.preToneOrdering.maximumPostToneAlternativeDifference > 0,
				),
				maximumIndependentCpuAbsoluteDifference: Math.max(
					...candidates.map((candidate) => candidate.preToneOrdering.maximumIndependentCpuAbsoluteDifference),
				),
				minimumPostToneAlternativeDifference: Math.min(
					...candidates.map((candidate) => candidate.preToneOrdering.maximumPostToneAlternativeDifference),
				),
			},
			candidates,
			gpu: {
				...gpu.facts,
				candidatePrograms: candidates.map((candidate) => ({
					candidateId: candidate.candidateId,
					fragmentSourceSha256: candidate.gpu.fragmentSourceSha256,
				})),
				terminalErrors,
				errors: allErrors,
				contextLost: gpu.context.isContextLost(),
				d3d11Renderer: /direct3d11|d3d11/iu.test(gpu.facts.renderer),
			},
			preservationMetricsGateCandidateEligibility: false,
			requestedImageCount: fixture.outputs.requestedImageUploadOrder.length,
			uploadedImageCount: uploadedImages.length,
			imageUploadOrder,
			uploadOrder: imageUploadOrder,
			uploadedImages,
			images: uploadedImages,
			panels: fixture.outputs.panels.map((artifactPath) => uploadedByPath.get(artifactPath)),
			masks: fixture.outputs.masks.map((artifactPath) => uploadedByPath.get(artifactPath)),
			differences: fixture.outputs.differences.map((artifactPath) => uploadedByPath.get(artifactPath)),
			figures: fixture.outputs.figures.map((artifactPath) => uploadedByPath.get(artifactPath)),
			allDeclaredImagesUploaded: true,
			panelIdentities,
			imageDerivations,
		};
	} finally {
		for (const canvas of [...panelCanvases, ...maskCanvases, ...differenceCanvases]) canvas.remove();
		disposeGpuReplay(gpu);
	}
}
