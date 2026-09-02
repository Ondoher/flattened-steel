import {BrunetonColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {
	CR4_GLOBAL_ACHROMATIC_RESPONSE_ID,
	Cr4GlobalAchromaticTwilightColorDisplayModel,
} from '../color/Cr4GlobalAchromaticTwilightColorDisplayModel.js';

const LUMINANCE_WEIGHTS = Object.freeze([0.2126, 0.7152, 0.0722]);
const CANDIDATE_COLORS = Object.freeze(['#54a8ff', '#65d68a', '#ff9f43']);
const CONTROL_COLORS = Object.freeze({bruneton: '#b8c2d9', production: '#d793ff'});
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

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}

function glslFloat(value) {
	requireCondition(Number.isFinite(value), 'CR4 GLSL constant must be finite.');
	return Number.isInteger(value) ? `${value}.0` : String(value);
}

function dataUrlBytes(dataUrl) {
	const marker = ';base64,';
	const markerIndex = dataUrl.indexOf(marker);
	requireCondition(markerIndex >= 0, 'CR4 PNG data URL is not base64 encoded.');
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

async function uploadBytes(artifactPath, bytes, contentType) {
	const response = await fetch('/artifact/' + artifactPath, {
		method: 'POST',
		headers: {'content-type': contentType},
		body: bytes,
	});
	requireCondition(response.ok, `CR4 artifact upload failed for ${artifactPath}: HTTP ${response.status}.`);
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
	requireCondition(context, 'CR4 could not create a 2D canvas context.');
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
		requireCondition(context, `CR4 could not decode ${label}.`);
		context.drawImage(bitmap, 0, 0);
		return {
			pixels: new Uint8ClampedArray(
				context.getImageData(0, 0, expectedWidth, expectedHeight).data,
			),
		};
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
	requireCondition(shader, `CR4 could not allocate ${label} shader.`);
	context.shaderSource(shader, source);
	context.compileShader(shader);
	if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
		const log = context.getShaderInfoLog(shader);
		context.deleteShader(shader);
		throw new Error(`CR4 ${label} shader compilation failed: ${log}`);
	}
	return shader;
}

function compileProgram(context, fragmentSource, label) {
	const vertex = compileShader(context, context.VERTEX_SHADER, VERTEX_SOURCE, `${label} vertex`);
	const fragment = compileShader(context, context.FRAGMENT_SHADER, fragmentSource, `${label} fragment`);
	const program = context.createProgram();
	requireCondition(program, `CR4 could not allocate ${label} program.`);
	context.attachShader(program, vertex);
	context.attachShader(program, fragment);
	context.linkProgram(program);
	context.deleteShader(vertex);
	context.deleteShader(fragment);
	if (!context.getProgramParameter(program, context.LINK_STATUS)) {
		const log = context.getProgramInfoLog(program);
		context.deleteProgram(program);
		throw new Error(`CR4 ${label} program link failed: ${log}`);
	}
	return program;
}

function drainWebglErrors(context) {
	const errors = [];
	for (;;) {
		const error = context.getError();
		if (error === context.NO_ERROR) break;
		errors.push(error);
	}
	return errors;
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
const float CR4_MAXIMUM_GAIN = ${glslFloat(curve.maximumGain)};
const float CR4_TRANSITION_ILLUMINANCE_LUX = ${glslFloat(curve.transitionIlluminanceLux)};
const float CR4_ROLLOFF_POWER = ${glslFloat(curve.rolloffPower)};
float cr4DisplayGain(float totalHorizontalIlluminanceLux) {
	float ratio = max(totalHorizontalIlluminanceLux, 0.0) / CR4_TRANSITION_ILLUMINANCE_LUX;
	return 1.0 + (CR4_MAXIMUM_GAIN - 1.0) / (1.0 + pow(ratio, CR4_ROLLOFF_POWER));
}
void main() {
	vec3 linearSrgb = texture(uLinearField, vec2(vScreenUv.x, 1.0 - vScreenUv.y)).rgb;
	vec3 bruneton = clamp(
		vec3(1.0) - exp(-max(linearSrgb, vec3(0.0)) * DISPLAY_TONE_MAP_K),
		vec3(0.0),
		vec3(1.0)
	);
	outputColor = vec4(
		clamp(bruneton * cr4DisplayGain(uTotalHorizontalIlluminanceLux), vec3(0.0), vec3(1.0)),
		1.0
	);
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
	requireCondition(context, 'CR4 requires a WebGL2 context.');
	const colorBufferFloat = context.getExtension('EXT_color_buffer_float');
	requireCondition(colorBufferFloat, 'CR4 requires EXT_color_buffer_float for RGBA32F replay.');
	context.disable(context.DITHER);
	context.disable(context.BLEND);
	context.disable(context.DEPTH_TEST);
	context.disable(context.CULL_FACE);
	const vertexArray = context.createVertexArray();
	requireCondition(vertexArray, 'CR4 could not allocate a vertex array.');
	context.bindVertexArray(vertexArray);
	const debug = context.getExtension('WEBGL_debug_renderer_info');
	const renderer = debug
		? context.getParameter(debug.UNMASKED_RENDERER_WEBGL)
		: context.getParameter(context.RENDERER);
	const vendor = debug
		? context.getParameter(debug.UNMASKED_VENDOR_WEBGL)
		: context.getParameter(context.VENDOR);
	const copyProgram = compileProgram(context, COPY_FRAGMENT_SOURCE, 'presentation copy');
	const candidatePrograms = new Map();
	for (const model of models) {
		const source = candidateFragmentSource(model);
		candidatePrograms.set(model.curve.id, {
			program: compileProgram(context, source, model.curve.id),
			fragmentSource: source,
			fragmentSourceSha256: await sha256Hex(new TextEncoder().encode(source)),
		});
	}
	const startupErrors = drainWebglErrors(context);
	requireCondition(startupErrors.length === 0, 'CR4 WebGL initialization produced errors.');
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
	requireCondition(texture, 'CR4 could not allocate an RGBA32F texture.');
	context.bindTexture(context.TEXTURE_2D, texture);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
	context.pixelStorei(context.UNPACK_ALIGNMENT, 4);
	context.texImage2D(
		context.TEXTURE_2D,
		0,
		context.RGBA32F,
		width,
		height,
		0,
		context.RGBA,
		context.FLOAT,
		values,
	);
	return texture;
}

function renderCandidateGpu(gpu, model, fieldValues, width, height, illuminance) {
	const context = gpu.context;
	const programRecord = gpu.candidatePrograms.get(model.curve.id);
	requireCondition(programRecord, `CR4 GPU program is missing for ${model.curve.id}.`);
	const inputTexture = createRgba32fTexture(context, width, height, fieldValues);
	const outputTexture = createRgba32fTexture(context, width, height);
	const framebuffer = context.createFramebuffer();
	requireCondition(framebuffer, 'CR4 could not allocate an RGBA32F framebuffer.');
	context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
	context.framebufferTexture2D(
		context.FRAMEBUFFER,
		context.COLOR_ATTACHMENT0,
		context.TEXTURE_2D,
		outputTexture,
		0,
	);
	const framebufferStatus = context.checkFramebufferStatus(context.FRAMEBUFFER);
	requireCondition(
		framebufferStatus === context.FRAMEBUFFER_COMPLETE,
		`CR4 RGBA32F framebuffer is incomplete: ${framebufferStatus}.`,
	);
	context.viewport(0, 0, width, height);
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
	const floatBottomUp = new Float32Array(width * height * 4);
	context.readPixels(0, 0, width, height, context.RGBA, context.FLOAT, floatBottomUp);

	context.bindFramebuffer(context.FRAMEBUFFER, null);
	context.useProgram(gpu.copyProgram);
	context.activeTexture(context.TEXTURE0);
	context.bindTexture(context.TEXTURE_2D, outputTexture);
	context.uniform1i(context.getUniformLocation(gpu.copyProgram, 'uCandidate'), 0);
	context.drawArrays(context.TRIANGLES, 0, 3);
	context.finish();
	const rgbaBottomUp = new Uint8Array(width * height * 4);
	context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, rgbaBottomUp);
	const errors = drainWebglErrors(context);
	const contextLost = context.isContextLost();

	context.bindTexture(context.TEXTURE_2D, null);
	context.deleteFramebuffer(framebuffer);
	context.deleteTexture(outputTexture);
	context.deleteTexture(inputTexture);
	return {
		rgbaTopDown: flipRows(rgbaBottomUp, width, height, 4),
		floatTopDown: flipRows(floatBottomUp, width, height, 4),
		framebufferStatus,
		errors,
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

function renderCpuBruneton(fieldValues, width, height, model) {
	const pixelCount = width * height;
	const rgba = new Uint8ClampedArray(pixelCount * 4);
	const displayRgb = new Float64Array(pixelCount * 3);
	for (let pixel = 0; pixel < pixelCount; pixel += 1) {
		const fieldIndex = pixel * 4;
		const displayIndex = pixel * 3;
		const rgb = model.linearSrgbToDisplayRgb([
			fieldValues[fieldIndex],
			fieldValues[fieldIndex + 1],
			fieldValues[fieldIndex + 2],
		]);
		for (let channel = 0; channel < 3; channel += 1) {
			displayRgb[displayIndex + channel] = rgb[channel];
			rgba[fieldIndex + channel] = quantizedChannel(rgb[channel]);
		}
		rgba[fieldIndex + 3] = 255;
	}
	return {rgba, displayRgb};
}

function renderCpuCandidate(fieldValues, width, height, model, illuminance, brunetonDisplayRgb) {
	const pixelCount = width * height;
	const rgba = new Uint8ClampedArray(pixelCount * 4);
	const displayRgba = new Float32Array(pixelCount * 4);
	let maximumUnclippedAchromaticCrossProductError = 0;
	let unclippedPixelCount = 0;
	let clippedPixelCount = 0;
	const gain = model.displayGain(illuminance);
	for (let pixel = 0; pixel < pixelCount; pixel += 1) {
		const fieldIndex = pixel * 4;
		const displayIndex = pixel * 3;
		const candidate = model.linearSrgbToDisplayRgb([
			fieldValues[fieldIndex],
			fieldValues[fieldIndex + 1],
			fieldValues[fieldIndex + 2],
		], illuminance);
		let clipped = false;
		for (let channel = 0; channel < 3; channel += 1) {
			const base = brunetonDisplayRgb[displayIndex + channel];
			if (base * gain > 1) clipped = true;
			displayRgba[fieldIndex + channel] = candidate[channel];
			rgba[fieldIndex + channel] = quantizedChannel(candidate[channel]);
		}
		displayRgba[fieldIndex + 3] = 1;
		rgba[fieldIndex + 3] = 255;
		if (clipped) {
			clippedPixelCount += 1;
		} else {
			unclippedPixelCount += 1;
			const base = brunetonDisplayRgb.subarray(displayIndex, displayIndex + 3);
			for (const [left, right] of [[0, 1], [0, 2], [1, 2]]) {
				maximumUnclippedAchromaticCrossProductError = Math.max(
					maximumUnclippedAchromaticCrossProductError,
					Math.abs(candidate[left] * base[right] - candidate[right] * base[left]),
				);
			}
		}
	}
	return {
		rgba,
		displayRgba,
		gain,
		gainDerivativePerLux: model.displayGainDerivative(illuminance),
		unclippedPixelCount,
		clippedPixelCount,
		maximumUnclippedAchromaticCrossProductError,
	};
}

function compareRgbCodes(actual, expected, mask = null) {
	requireCondition(actual.length === expected.length, 'CR4 RGB comparison sizes differ.');
	const pixelCount = actual.length / 4;
	let comparedPixelCount = 0;
	let differingPixelCount = 0;
	let overOneCodePixelCount = 0;
	let maximumAbsoluteRgbCodeDifference = 0;
	let squaredError = 0;
	const absoluteChannelSums = [0, 0, 0];
	const signedChannelSums = [0, 0, 0];
	for (let pixel = 0; pixel < pixelCount; pixel += 1) {
		if (mask && mask[pixel] !== 0) continue;
		comparedPixelCount += 1;
		const index = pixel * 4;
		let pixelMaximum = 0;
		for (let channel = 0; channel < 3; channel += 1) {
			const signed = actual[index + channel] - expected[index + channel];
			const absolute = Math.abs(signed);
			pixelMaximum = Math.max(pixelMaximum, absolute);
			maximumAbsoluteRgbCodeDifference = Math.max(maximumAbsoluteRgbCodeDifference, absolute);
			squaredError += absolute * absolute;
			absoluteChannelSums[channel] += absolute;
			signedChannelSums[channel] += signed;
		}
		if (pixelMaximum > 0) differingPixelCount += 1;
		if (pixelMaximum > 1) overOneCodePixelCount += 1;
	}
	return {
		population: mask ? 'sky-only from CR1 R8 scene-hit mask' : 'all pixels',
		comparedPixelCount,
		maximumAbsoluteRgbCodeDifference,
		rgbCodeRmse:
			comparedPixelCount === 0 ? null : Math.sqrt(squaredError / (comparedPixelCount * 3)),
		differingPixelCount,
		overOneCodePixelCount,
		differingPixelFraction:
			comparedPixelCount === 0 ? null : differingPixelCount / comparedPixelCount,
		meanAbsoluteRgbCodeDifference: absoluteChannelSums.map((sum) => sum / comparedPixelCount),
		signedMeanRgbCodeDifference: signedChannelSums.map((sum) => sum / comparedPixelCount),
	};
}

function compareFloatRgba(actual, expected, mask) {
	requireCondition(actual.length === expected.length, 'CR4 floating comparison sizes differ.');
	let comparedPixelCount = 0;
	let maximumAbsoluteRgbDifference = 0;
	let squaredError = 0;
	let nonfiniteValueCount = 0;
	for (let pixel = 0; pixel < mask.length; pixel += 1) {
		if (mask[pixel] !== 0) continue;
		comparedPixelCount += 1;
		const index = pixel * 4;
		for (let channel = 0; channel < 3; channel += 1) {
			const left = actual[index + channel];
			const right = expected[index + channel];
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
		rgbRmse: comparedPixelCount === 0 ? null : Math.sqrt(squaredError / (comparedPixelCount * 3)),
		nonfiniteValueCount,
	};
}

function percentile(sorted, requested) {
	if (sorted.length === 0) return null;
	if (sorted.length === 1) return sorted[0];
	const position = clamp(requested, 0, 100) * (sorted.length - 1) / 100;
	const lower = Math.floor(position);
	const upper = Math.ceil(position);
	if (lower === upper) return sorted[lower];
	const fraction = position - lower;
	return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

function summarizeDisplay(rgba, mask) {
	const luminances = [];
	let blackSkyPixelCount = 0;
	let saturatedSkyPixelCount = 0;
	for (let pixel = 0; pixel < mask.length; pixel += 1) {
		if (mask[pixel] !== 0) continue;
		const index = pixel * 4;
		const red = rgba[index];
		const green = rgba[index + 1];
		const blue = rgba[index + 2];
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
		displayLuminanceDefinition: '(0.2126 R_code + 0.7152 G_code + 0.0722 B_code) / 255',
		medianDisplayLuminance: percentile(luminances, 50),
	};
}

function differenceRgba(candidate, bruneton, amplification) {
	requireCondition(candidate.length === bruneton.length, 'CR4 difference image sizes differ.');
	const difference = new Uint8ClampedArray(candidate.length);
	for (let index = 0; index < difference.length; index += 4) {
		for (let channel = 0; channel < 3; channel += 1) {
			difference[index + channel] = Math.min(
				255,
				Math.abs(candidate[index + channel] - bruneton[index + channel]) * amplification,
			);
		}
		difference[index + 3] = 255;
	}
	return difference;
}

function preservationEnvelope(fixture, illuminanceLux) {
	const maximum = fixture.brunetonPreservationEnvelope.maximumAbsoluteRgbCodeDifference;
	const rmse = fixture.brunetonPreservationEnvelope.rgbCodeRmse;
	return {
		maximumAbsoluteRgbCodeDifference:
			maximum.daylightFloorCodes + maximum.lowSunRelaxationCodes /
			(1 + (illuminanceLux / maximum.scaleIlluminanceLux) ** maximum.power),
		rgbCodeRmse:
			rmse.daylightFloorCodes + rmse.lowSunRelaxationCodes /
			(1 + (illuminanceLux / rmse.scaleIlluminanceLux) ** rmse.power),
	};
}

function initializeFigure(width, height, title, subtitle) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: false});
	requireCondition(context, 'CR4 could not create a figure canvas.');
	context.fillStyle = '#10141d';
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#f5f7ff';
	context.font = 'bold 28px sans-serif';
	context.fillText(title, 42, 42);
	context.fillStyle = '#aeb8ce';
	context.font = '16px sans-serif';
	context.fillText(subtitle, 42, 69);
	return {canvas, context};
}

function drawAxes(context, plot, xLabels, yLabels) {
	context.strokeStyle = '#73809a';
	context.lineWidth = 1;
	context.strokeRect(plot.left, plot.top, plot.width, plot.height);
	context.font = '13px sans-serif';
	context.fillStyle = '#aeb8ce';
	context.textAlign = 'center';
	for (const tick of xLabels) {
		const x = plot.left + tick.position * plot.width;
		context.strokeStyle = '#293247';
		context.beginPath();
		context.moveTo(x, plot.top);
		context.lineTo(x, plot.top + plot.height);
		context.stroke();
		context.fillText(tick.label, x, plot.top + plot.height + 22);
	}
	context.textAlign = 'right';
	for (const tick of yLabels) {
		const y = plot.top + (1 - tick.position) * plot.height;
		context.strokeStyle = '#293247';
		context.beginPath();
		context.moveTo(plot.left, y);
		context.lineTo(plot.left + plot.width, y);
		context.stroke();
		context.fillText(tick.label, plot.left - 10, y + 4);
	}
	context.textAlign = 'left';
}

function responseCurveFigure(fixture, models, sceneResults) {
	const spec = fixture.diagnostics.curvePlot;
	const {canvas, context} = initializeFigure(
		spec.widthPixels,
		spec.heightPixels,
		'CR4 global achromatic response',
		'One receiver-total-horizontal illuminance scalar; log illuminance and log gain.',
	);
	const plot = {left: 112, top: 112, width: spec.widthPixels - 170, height: spec.heightPixels - 210};
	const minimumX = Math.log10(spec.minimumIlluminanceLux);
	const maximumX = Math.log10(spec.maximumIlluminanceLux);
	const maximumGain = Math.max(...models.map((model) => model.curve.maximumGain));
	const maximumY = Math.log10(maximumGain);
	const xPosition = (value) => (Math.log10(value) - minimumX) / (maximumX - minimumX);
	const yPosition = (value) => Math.log10(value) / maximumY;
	const xTicks = [-3, -2, -1, 0, 1, 2, 3, 4, 5].map((power) => ({
		position: (power - minimumX) / (maximumX - minimumX),
		label: `1e${power}`,
	})).filter((tick) => tick.position >= 0 && tick.position <= 1);
	const yTicks = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]
		.filter((value) => value <= maximumGain)
		.map((value) => ({position: yPosition(value), label: String(value)}));
	drawAxes(context, plot, xTicks, yTicks);
	const samples = [];
	for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
		const model = models[modelIndex];
		const sampleValues = [];
		context.strokeStyle = CANDIDATE_COLORS[modelIndex];
		context.lineWidth = 3;
		context.beginPath();
		for (let index = 0; index <= 512; index += 1) {
			const logIlluminance = minimumX + (maximumX - minimumX) * index / 512;
			const illuminanceLux = 10 ** logIlluminance;
			const gain = model.displayGain({value: illuminanceLux, units: 'lux'});
			const derivativePerLux = model.displayGainDerivative({value: illuminanceLux, units: 'lux'});
			const x = plot.left + xPosition(illuminanceLux) * plot.width;
			const y = plot.top + (1 - yPosition(gain)) * plot.height;
			if (index === 0) context.moveTo(x, y);
			else context.lineTo(x, y);
			sampleValues.push({illuminanceLux, gain, derivativePerLux});
		}
		context.stroke();
		samples.push({candidateId: model.curve.id, values: sampleValues});
	}
	for (const scene of sceneResults) {
		const x = plot.left + xPosition(scene.totalHorizontalIlluminanceLux) * plot.width;
		context.strokeStyle = '#5a6376';
		context.beginPath();
		context.moveTo(x, plot.top);
		context.lineTo(x, plot.top + plot.height);
		context.stroke();
	}
	context.font = '15px sans-serif';
	models.forEach((model, index) => {
		context.fillStyle = CANDIDATE_COLORS[index];
		context.fillRect(plot.left + index * 260, spec.heightPixels - 48, 24, 4);
		context.fillText(model.curve.id, plot.left + 32 + index * 260, spec.heightPixels - 42);
	});
	context.fillStyle = '#aeb8ce';
	context.fillText('Illuminance (lux)', plot.left + plot.width / 2 - 45, spec.heightPixels - 72);
	return {canvas, samples};
}

function preservationFigure(fixture, sceneResults, candidates) {
	const spec = fixture.diagnostics.preservationPlot;
	const {canvas, context} = initializeFigure(
		spec.widthPixels,
		spec.heightPixels,
		'CR4 Bruneton preservation',
		'CPU candidate versus CPU Bruneton over fixture-declared preservation sky pixels.',
	);
	const controls = sceneResults.filter((scene) => scene.preservationControl);
	const panels = [
		{
			top: 112,
			height: 280,
			label: 'Maximum absolute RGB-code difference',
			value: (candidate) => candidate.preservation.maximumAbsoluteRgbCodeDifference,
			envelope: (scene) => scene.preservationEnvelope.maximumAbsoluteRgbCodeDifference,
		},
		{
			top: 500,
			height: 280,
			label: 'RGB-code RMSE',
			value: (candidate) => candidate.preservation.rgbCodeRmse,
			envelope: (scene) => scene.preservationEnvelope.rgbCodeRmse,
		},
	];
	for (const panel of panels) {
		const plot = {left: 112, top: panel.top, width: spec.widthPixels - 170, height: panel.height};
		const maximum = Math.max(
			1,
			...controls.map((scene) => panel.envelope(scene)),
			...controls.flatMap((scene) => scene.candidates.map(panel.value)),
		) * 1.15;
		drawAxes(
			context,
			plot,
			controls.map((scene, index) => ({
				position: controls.length === 1 ? 0.5 : index / (controls.length - 1),
				label: scene.shortLabel,
			})),
			[0, 0.25, 0.5, 0.75, 1].map((position) => ({
				position,
				label: (maximum * position).toFixed(2),
			})),
		);
		context.fillStyle = '#f5f7ff';
		context.font = 'bold 16px sans-serif';
		context.fillText(panel.label, plot.left, plot.top - 16);
		context.strokeStyle = '#ffffff';
		context.setLineDash([8, 6]);
		context.lineWidth = 2;
		context.beginPath();
		controls.forEach((scene, index) => {
			const x = plot.left + (controls.length === 1 ? 0.5 : index / (controls.length - 1)) * plot.width;
			const y = plot.top + (1 - panel.envelope(scene) / maximum) * plot.height;
			if (index === 0) context.moveTo(x, y);
			else context.lineTo(x, y);
		});
		context.stroke();
		context.setLineDash([]);
		candidates.forEach((candidate, candidateIndex) => {
			context.strokeStyle = CANDIDATE_COLORS[candidateIndex];
			context.fillStyle = CANDIDATE_COLORS[candidateIndex];
			context.lineWidth = 2;
			context.beginPath();
			controls.forEach((scene, index) => {
				const x = plot.left + (controls.length === 1 ? 0.5 : index / (controls.length - 1)) * plot.width;
				const record = scene.candidates.find((entry) => entry.candidateId === candidate.id);
				const y = plot.top + (1 - panel.value(record) / maximum) * plot.height;
				if (index === 0) context.moveTo(x, y);
				else context.lineTo(x, y);
				context.fillRect(x - 3, y - 3, 6, 6);
			});
			context.stroke();
		});
	}
	context.font = '14px sans-serif';
	candidates.forEach((candidate, index) => {
		context.fillStyle = CANDIDATE_COLORS[index];
		context.fillText(candidate.id, 112 + index * 250, 865);
	});
	context.fillStyle = '#ffffff';
	context.fillText('frozen envelope', 900, 865);
	return canvas;
}

function blackSaturationFigure(fixture, sceneResults, candidates) {
	const spec = fixture.diagnostics.blackSaturationPlot;
	const {canvas, context} = initializeFigure(
		spec.widthPixels,
		spec.heightPixels,
		'CR4 sky black and saturation fractions',
		'Full CR1 sky-mask population; encoded RGB-code predicates.',
	);
	const series = [
		{id: 'bruneton', color: CONTROL_COLORS.bruneton, record: (scene) => scene.controls.bruneton.display},
		{id: 'production-lift', color: CONTROL_COLORS.production, record: (scene) => scene.controls.productionLift.display},
		...candidates.map((candidate, index) => ({
			id: candidate.id,
			color: CANDIDATE_COLORS[index],
			record: (scene) => scene.candidates.find((entry) => entry.candidateId === candidate.id).display,
		})),
	];
	const panels = [
		{top: 112, label: 'Black sky fraction', value: (record) => record.blackSkyPixelFraction},
		{top: 505, label: 'Saturated sky fraction', value: (record) => record.saturatedSkyPixelFraction},
	];
	for (const panel of panels) {
		const plot = {left: 112, top: panel.top, width: spec.widthPixels - 170, height: 275};
		drawAxes(
			context,
			plot,
			fixture.scenes.map((scene, index) => ({
				position: index / (fixture.scenes.length - 1),
				label: scene.id.replace('sunset-', '').replace('-minutes', '').replace('solar-noon', 'noon'),
			})),
			[0, 0.25, 0.5, 0.75, 1].map((position) => ({position, label: position.toFixed(2)})),
		);
		context.fillStyle = '#f5f7ff';
		context.font = 'bold 16px sans-serif';
		context.fillText(panel.label, plot.left, plot.top - 16);
		for (const line of series) {
			context.strokeStyle = line.color;
			context.fillStyle = line.color;
			context.lineWidth = 2;
			context.beginPath();
			sceneResults.forEach((scene, index) => {
				const x = plot.left + index / (sceneResults.length - 1) * plot.width;
				const y = plot.top + (1 - panel.value(line.record(scene))) * plot.height;
				if (index === 0) context.moveTo(x, y);
				else context.lineTo(x, y);
				context.fillRect(x - 2, y - 2, 4, 4);
			});
			context.stroke();
		}
	}
	context.font = '13px sans-serif';
	series.forEach((line, index) => {
		context.fillStyle = line.color;
		context.fillText(line.id, 112 + (index % 3) * 300, 842 + Math.floor(index / 3) * 22);
	});
	return canvas;
}

function contactSheet(fixture, panelPixelsByPath) {
	const width = fixture.viewport.widthPixels;
	const height = fixture.viewport.heightPixels;
	const leftLabelWidth = 210;
	const columnLabelHeight = 62;
	const rowLabelHeight = 28;
	const rows = [
		{id: 'bruneton', label: 'Unchanged Bruneton'},
		{id: 'production-lift', label: 'Current production lift'},
		...fixture.response.candidates.map((candidate) => ({id: candidate.id, label: candidate.label})),
	];
	const rowHeight = height + rowLabelHeight;
	const canvas = document.createElement('canvas');
	canvas.width = leftLabelWidth + fixture.scenes.length * width;
	canvas.height = columnLabelHeight + rows.length * rowHeight;
	const context = canvas.getContext('2d', {alpha: false});
	requireCondition(context, 'CR4 could not create the contact-sheet canvas.');
	context.fillStyle = '#0c1018';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#f5f7ff';
	context.font = 'bold 16px sans-serif';
	context.textAlign = 'center';
	fixture.scenes.forEach((scene, column) => {
		const center = leftLabelWidth + column * width + width / 2;
		context.fillText(scene.label, center, 24);
		context.fillStyle = '#aeb8ce';
		context.font = '13px sans-serif';
		context.fillText(`${scene.totalHorizontalIlluminanceLux.toPrecision(5)} lux`, center, 45);
		context.fillStyle = '#f5f7ff';
		context.font = 'bold 16px sans-serif';
	});
	context.textAlign = 'left';
	rows.forEach((row, rowIndex) => {
		const top = columnLabelHeight + rowIndex * rowHeight;
		context.fillStyle = '#f5f7ff';
		context.font = 'bold 15px sans-serif';
		context.fillText(row.label, 12, top + 24);
		fixture.scenes.forEach((scene, column) => {
			const path = `captures/${row.id}-${scene.id}.png`;
			const pixels = panelPixelsByPath.get(path);
			requireCondition(pixels, `CR4 contact sheet is missing ${path}.`);
			context.putImageData(
				new ImageData(new Uint8ClampedArray(pixels), width, height),
				leftLabelWidth + column * width,
				top + rowLabelHeight,
			);
			context.strokeStyle = '#30394c';
			context.strokeRect(
				leftLabelWidth + column * width + 0.5,
				top + rowLabelHeight + 0.5,
				width - 1,
				height - 1,
			);
		});
	});
	return {canvas, rowCount: rows.length, columnCount: fixture.scenes.length, rows};
}

function expectedPanelPaths(fixture) {
	return fixture.scenes.flatMap((scene) => [
		`captures/bruneton-${scene.id}.png`,
		`captures/production-lift-${scene.id}.png`,
		...fixture.response.candidates.map((candidate) => `captures/${candidate.id}-${scene.id}.png`),
	]);
}

function expectedDifferencePaths(fixture) {
	return fixture.scenes.flatMap((scene) =>
		fixture.response.candidates.map(
			(candidate) => `diagnostics/difference-${candidate.id}-${scene.id}.png`,
		),
	);
}

function validateConfiguration(configuration) {
	const fixture = configuration.fixture ?? configuration;
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr4-global-achromatic-twilight-sweep-input-v1',
		'CR4 fixture schema changed.',
	);
	requireCondition(fixture.scenes.length === 6, 'CR4 requires exactly six scenes.');
	requireCondition(fixture.response.candidates.length === 3, 'CR4 requires exactly three candidates.');
	requireCondition(
		fixture.response.id === CR4_GLOBAL_ACHROMATIC_RESPONSE_ID,
		'CR4 response identity changed.',
	);
	requireCondition(
		JSON.stringify(fixture.outputs.panels) === JSON.stringify(expectedPanelPaths(fixture)),
		'CR4 panel declaration or order changed.',
	);
	requireCondition(
		JSON.stringify(fixture.outputs.differences) === JSON.stringify(expectedDifferencePaths(fixture)),
		'CR4 difference declaration or order changed.',
	);
	requireCondition(fixture.outputs.figures.length === 4, 'CR4 requires exactly four figures.');
	requireCondition(
		fixture.outputs.figures.at(-1) === fixture.outputs.contactSheet,
		'CR4 contact sheet must be the last figure.',
	);
	return fixture;
}

function shortSceneLabel(sceneId) {
	return sceneId
		.replace('solar-noon', 'noon')
		.replace('sunset-minus-', '-')
		.replace('sunset-plus-', '+')
		.replace('-minutes', '')
		.replace('sunset', 'set');
}

function verifyReceiverLight(fixture, analysis) {
	requireCondition(
		analysis.schemaId === 'algorithm32-color-reset-cr2-browser-result-v1',
		'CR4 CR2 measurement-analysis schema changed.',
	);
	const sourceByScene = new Map(analysis.scenes.map((scene) => [scene.sceneId, scene]));
	return fixture.scenes.map((scene) => {
		const source = sourceByScene.get(scene.id);
		requireCondition(source, `CR4 CR2 measurement is missing ${scene.id}.`);
		const illuminance = source.measurement?.photopic?.totalHorizontal?.illuminance;
		requireCondition(illuminance?.units === 'lux', `CR4 CR2 units changed for ${scene.id}.`);
		requireCondition(
			illuminance.value === scene.totalHorizontalIlluminanceLux,
			`CR4 fixture illuminance changed for ${scene.id}.`,
		);
		const direct = source.measurement.photopic.directHorizontal.illuminance.value;
		const diffuse = source.measurement.photopic.diffuseHorizontal.illuminance.value;
		const equationDifferenceLux = Math.abs((direct + diffuse) - illuminance.value);
		requireCondition(
			equationDifferenceLux <= 1e-9 * Math.max(1, illuminance.value),
			`CR4 CR2 total-horizontal photopic equation changed for ${scene.id}.`,
		);
		return {
			sceneId: scene.id,
			jsonPath: `scenes[${analysis.scenes.indexOf(source)}].measurement.photopic.totalHorizontal.illuminance`,
			fixtureValueLux: scene.totalHorizontalIlluminanceLux,
			parentValueLux: illuminance.value,
			units: illuminance.units,
			exactValueMatch: true,
			directHorizontalLux: direct,
			diffuseHorizontalLux: diffuse,
			equationDifferenceLux,
		};
	});
}

function verifyCr1Analysis(fixture, analysis) {
	requireCondition(
		analysis.schemaId === 'algorithm32-color-reset-cr1-browser-result-v1',
		'CR4 CR1 render-analysis schema changed.',
	);
	const sourceByScene = new Map(analysis.scenes.map((scene) => [scene.sceneId, scene]));
	return fixture.scenes.map((scene) => {
		const source = sourceByScene.get(scene.id);
		requireCondition(source, `CR4 CR1 analysis is missing ${scene.id}.`);
		requireCondition(
			source.field?.rawArtifactPath === scene.field.path,
			`CR4 CR1 field reference changed for ${scene.id}.`,
		);
		requireCondition(
			source.hitMask?.artifactPath === scene.mask.path,
			`CR4 CR1 mask reference changed for ${scene.id}.`,
		);
		return {
			sceneId: scene.id,
			fieldArtifactPath: source.field.rawArtifactPath,
			hitMaskArtifactPath: source.hitMask.artifactPath,
			fieldColorId: source.field.colorId,
			brunetonColorId: source.frames?.bruneton?.colorId,
			productionLiftColorId: source.frames?.['production-lift']?.colorId,
		};
	});
}

function curveDiagnostics(models, fixture) {
	const records = [];
	for (const model of models) {
		const samples = [{value: 0, units: 'lux'}];
		const minimum = fixture.diagnostics.curvePlot.minimumIlluminanceLux;
		const maximum = fixture.diagnostics.curvePlot.maximumIlluminanceLux;
		for (let index = 0; index <= 4096; index += 1) {
			const fraction = index / 4096;
			samples.push({
				value: 10 ** (Math.log10(minimum) + (Math.log10(maximum) - Math.log10(minimum)) * fraction),
				units: 'lux',
			});
		}
		let previousGain = Number.POSITIVE_INFINITY;
		let finite = true;
		let monotonicNonincreasing = true;
		let maximumPositiveGainStep = 0;
		let maximumPositiveDerivative = Number.NEGATIVE_INFINITY;
		for (const sample of samples) {
			const gain = model.displayGain(sample);
			const derivative = model.displayGainDerivative(sample);
			finite &&= Number.isFinite(gain) && Number.isFinite(derivative);
			if (gain > previousGain) {
				monotonicNonincreasing = false;
				maximumPositiveGainStep = Math.max(maximumPositiveGainStep, gain - previousGain);
			}
			maximumPositiveDerivative = Math.max(maximumPositiveDerivative, derivative);
			previousGain = gain;
		}
		records.push({
			candidateId: model.curve.id,
			curve: model.curve,
			finite,
			monotonicNonincreasing,
			maximumPositiveGainStep,
			maximumPositiveDerivative,
			gainAtZeroLux: model.displayGain({value: 0, units: 'lux'}),
			derivativeAtZeroPerLux: model.displayGainDerivative({value: 0, units: 'lux'}),
			gainAtMaximumPlottedLux: model.displayGain({value: maximum, units: 'lux'}),
		});
	}
	return records;
}

/** Replay and upload the complete CR4 sweep before returning any metrics. */
export async function runCr4GlobalAchromaticTwilightSweepBrowser() {
	const browserConfiguration = await fetch('/browser/config.json').then((response) => {
		requireCondition(response.ok, `CR4 browser configuration failed with HTTP ${response.status}.`);
		return response.json();
	});
	const fixture = validateConfiguration(browserConfiguration);
	const width = fixture.viewport.widthPixels;
	const height = fixture.viewport.heightPixels;
	const pixelCount = width * height;

	await window.colorResetProgress('parent-input-started');
	const [cr1AnalysisInput, cr2AnalysisInput, ...sceneInputGroups] = await Promise.all([
		fetchVerifiedBytes('/cr1/', fixture.parents.skyField.analysis, 'CR4 CR1 render analysis'),
		fetchVerifiedBytes('/cr2/', fixture.parents.receiverLight.analysis, 'CR4 CR2 measurement analysis'),
		...fixture.scenes.map(async (scene) => {
			const [field, mask, bruneton, productionLift] = await Promise.all([
				fetchVerifiedBytes('/cr1/', scene.field, `CR4 ${scene.id} float field`),
				fetchVerifiedBytes('/cr1/', scene.mask, `CR4 ${scene.id} hit mask`),
				fetchVerifiedBytes('/cr1/', scene.bruneton, `CR4 ${scene.id} Bruneton PNG`),
				fetchVerifiedBytes('/cr1/', scene.productionLift, `CR4 ${scene.id} production PNG`),
			]);
			return {scene, field, mask, bruneton, productionLift};
		}),
	]);
	const cr1Analysis = JSON.parse(new TextDecoder().decode(cr1AnalysisInput.bytes));
	const cr2Analysis = JSON.parse(new TextDecoder().decode(cr2AnalysisInput.bytes));
	const cr1References = verifyCr1Analysis(fixture, cr1Analysis);
	const receiverLightVerification = verifyReceiverLight(fixture, cr2Analysis);

	const brunetonModel = new BrunetonColorDisplayModel();
	const candidateModels = fixture.response.candidates.map(
		(candidate) => new Cr4GlobalAchromaticTwilightColorDisplayModel({curve: candidate}),
	);
	const gpu = await createGpuReplay(width, height, candidateModels);
	requireCondition(gpu.facts.maximumTextureSize >= Math.max(width, height), 'CR4 viewport exceeds GPU limits.');
	const uploadOrder = [];
	const panels = [];
	const differences = [];
	const figures = [];
	const panelPixelsByPath = new Map();
	const sceneResults = [];
	let firstImageEventWritten = false;

	try {
		for (let sceneIndex = 0; sceneIndex < sceneInputGroups.length; sceneIndex += 1) {
			const inputs = sceneInputGroups[sceneIndex];
			const scene = inputs.scene;
			const decodedField = decodeFloat32Le(
				inputs.field.bytes,
				pixelCount * 4,
				`CR4 ${scene.id} field`,
			);
			const maskFacts = validateMask(inputs.mask.bytes, pixelCount, `CR4 ${scene.id}`);
			const [parentBruneton, parentProductionLift] = await Promise.all([
				decodePng(inputs.bruneton.bytes, width, height, `CR4 ${scene.id} Bruneton PNG`),
				decodePng(inputs.productionLift.bytes, width, height, `CR4 ${scene.id} production PNG`),
			]);

			const brunetonPath = `captures/bruneton-${scene.id}.png`;
			const brunetonUpload = await uploadBytes(brunetonPath, inputs.bruneton.bytes, 'image/png');
			const brunetonPanel = {
				...brunetonUpload,
				kind: 'parent-control-copy',
				controlId: 'bruneton',
				panelId: 'bruneton',
				sceneId: scene.id,
				totalHorizontalIlluminanceLux: scene.totalHorizontalIlluminanceLux,
				gain: null,
				width,
				height,
				parent: inputs.bruneton.evidence,
				parents: [{
					namespace: fixture.parents.skyField.namespace,
					runId: fixture.parents.skyField.runId,
					role: 'byte-exact Bruneton control PNG',
					...inputs.bruneton.evidence,
				}],
				operation: 'Byte-exact upload of the authenticated CR1 Bruneton control PNG.',
			};
			panels.push(brunetonPanel);
			uploadOrder.push(brunetonPath);
			panelPixelsByPath.set(brunetonPath, parentBruneton.pixels);
			if (!firstImageEventWritten) {
				await window.colorResetProgress('first-image-complete');
				firstImageEventWritten = true;
			}

			const productionPath = `captures/production-lift-${scene.id}.png`;
			const productionUpload = await uploadBytes(
				productionPath,
				inputs.productionLift.bytes,
				'image/png',
			);
			panels.push({
				...productionUpload,
				kind: 'parent-control-copy',
				controlId: 'production-lift',
				panelId: 'production-lift',
				sceneId: scene.id,
				totalHorizontalIlluminanceLux: scene.totalHorizontalIlluminanceLux,
				gain: null,
				width,
				height,
				parent: inputs.productionLift.evidence,
				parents: [{
					namespace: fixture.parents.skyField.namespace,
					runId: fixture.parents.skyField.runId,
					role: 'byte-exact production-lift control PNG',
					...inputs.productionLift.evidence,
				}],
				operation: 'Byte-exact upload of the authenticated CR1 production-lift control PNG.',
			});
			uploadOrder.push(productionPath);
			panelPixelsByPath.set(productionPath, parentProductionLift.pixels);

			const cpuBruneton = renderCpuBruneton(decodedField.values, width, height, brunetonModel);
			const parentReplay = compareRgbCodes(
				cpuBruneton.rgba,
				parentBruneton.pixels,
				inputs.mask.bytes,
			);
			const preservationControl =
				scene.totalHorizontalIlluminanceLux >=
				fixture.brunetonPreservationEnvelope.applicability.minimumIlluminanceLux;
			const preservationLimit = preservationEnvelope(fixture, scene.totalHorizontalIlluminanceLux);
			const publicCandidates = [];
			const internalCandidates = [];
			for (let candidateIndex = 0; candidateIndex < candidateModels.length; candidateIndex += 1) {
				const model = candidateModels[candidateIndex];
				const candidate = fixture.response.candidates[candidateIndex];
				const illuminance = {value: scene.totalHorizontalIlluminanceLux, units: 'lux'};
				const cpu = renderCpuCandidate(
					decodedField.values,
					width,
					height,
					model,
					illuminance,
					cpuBruneton.displayRgb,
				);
				const gpuFrame = renderCandidateGpu(
					gpu,
					model,
					decodedField.values,
					width,
					height,
					illuminance,
				);
				const gpuCpuParity = {
					encodedSky: compareRgbCodes(gpuFrame.rgbaTopDown, cpu.rgba, inputs.mask.bytes),
					encodedAllPixels: compareRgbCodes(gpuFrame.rgbaTopDown, cpu.rgba),
					floatSky: compareFloatRgba(gpuFrame.floatTopDown, cpu.displayRgba, inputs.mask.bytes),
				};
				const preservation = compareRgbCodes(cpu.rgba, cpuBruneton.rgba, inputs.mask.bytes);
				const display = summarizeDisplay(gpuFrame.rgbaTopDown, inputs.mask.bytes);
				const candidatePath = `captures/${candidate.id}-${scene.id}.png`;
				const candidateCanvas = rgbaCanvas(gpuFrame.rgbaTopDown, width, height);
				const candidateUpload = await uploadBytes(
					candidatePath,
					canvasPngBytes(candidateCanvas),
					'image/png',
				);
				candidateCanvas.remove();
				panels.push({
					...candidateUpload,
					kind: 'webgl2-rgba32f-candidate-replay',
					candidateId: candidate.id,
					panelId: candidate.id,
					sceneId: scene.id,
					totalHorizontalIlluminanceLux: scene.totalHorizontalIlluminanceLux,
					gain: cpu.gain,
					width,
					height,
					inputField: inputs.field.evidence,
					mask: inputs.mask.evidence,
					parents: [
						{
							namespace: fixture.parents.skyField.namespace,
							runId: fixture.parents.skyField.runId,
							role: 'CR1 pre-display linear RGBY float32 field',
							...inputs.field.evidence,
						},
						{
							namespace: fixture.parents.receiverLight.namespace,
							runId: fixture.parents.receiverLight.runId,
							role: 'CR2 receiver-light measurement analysis',
							...cr2AnalysisInput.evidence,
						},
					],
					operation:
						'WebGL2 RGBA32F replay of unchanged Bruneton exponential followed by the exact CR4 scene-global achromatic gain and explicit clamp.',
				});
				uploadOrder.push(candidatePath);
				panelPixelsByPath.set(candidatePath, gpuFrame.rgbaTopDown);
				publicCandidates.push({
					candidateId: candidate.id,
					label: candidate.label,
					modelId: model.id,
					curve: model.curve,
					gain: cpu.gain,
					gainDerivativePerLux: cpu.gainDerivativePerLux,
					gpu: {
						artifactPath: candidatePath,
						inputInternalFormat: 'RGBA32F',
						renderTargetInternalFormat: 'RGBA32F',
						framebufferStatus: gpuFrame.framebufferStatus,
						fragmentSourceSha256: gpuFrame.fragmentSourceSha256,
						errors: gpuFrame.errors,
						contextLost: gpuFrame.contextLost,
					},
					gpuCpuParity: {
						...gpuCpuParity.encodedSky,
						encodedSky: gpuCpuParity.encodedSky,
						encodedAllPixels: gpuCpuParity.encodedAllPixels,
						floatSky: gpuCpuParity.floatSky,
					},
					cpuGpuParity: gpuCpuParity,
					candidateVsBruneton: preservation,
					preservation: {
						...preservation,
						envelope: preservationLimit,
						applicable: preservationControl,
					},
					display,
					sky: {
						population: display.population,
						pixelCount: display.skyPixelCount,
						blackPixelCount: display.blackSkyPixelCount,
						blackFraction: display.blackSkyPixelFraction,
						saturatedPixelCount: display.saturatedSkyPixelCount,
						saturatedFraction: display.saturatedSkyPixelFraction,
						medianDisplayLuminance: display.medianDisplayLuminance,
					},
					achromaticity: {
						population: 'all unclipped CPU pixels',
						unclippedPixelCount: cpu.unclippedPixelCount,
						clippedPixelCount: cpu.clippedPixelCount,
						maximumCrossProductError: cpu.maximumUnclippedAchromaticCrossProductError,
					},
				});
				internalCandidates.push({candidateId: candidate.id, cpuRgba: cpu.rgba});
			}

			sceneResults.push({
				sceneId: scene.id,
				label: scene.label,
				shortLabel: shortSceneLabel(scene.id),
				timeIso: scene.timeIso,
				totalHorizontalIlluminanceLux: scene.totalHorizontalIlluminanceLux,
				preservationControl,
				preservationEnvelope: preservationLimit,
				inputs: {
					field: {...inputs.field.evidence, nonfiniteValueCount: decodedField.nonfiniteValueCount},
					mask: {...inputs.mask.evidence, ...maskFacts},
				},
				controls: {
					bruneton: {
						artifactPath: brunetonPath,
						display: summarizeDisplay(parentBruneton.pixels, inputs.mask.bytes),
						cpuReplay: parentReplay,
					},
					productionLift: {
						artifactPath: productionPath,
						display: summarizeDisplay(parentProductionLift.pixels, inputs.mask.bytes),
					},
				},
				brunetonParentReplay: parentReplay,
				candidates: publicCandidates,
				internal: {cpuBrunetonRgba: cpuBruneton.rgba, candidates: internalCandidates},
			});
		}

		requireCondition(
			JSON.stringify(uploadOrder) === JSON.stringify(fixture.outputs.panels),
			'CR4 panel upload order changed.',
		);

		for (const scene of sceneResults) {
			for (const candidate of fixture.response.candidates) {
				const internal = scene.internal.candidates.find(
					(record) => record.candidateId === candidate.id,
				);
				const candidateResult = scene.candidates.find(
					(record) => record.candidateId === candidate.id,
				);
				requireCondition(internal, `CR4 difference source is missing ${scene.sceneId}/${candidate.id}.`);
				requireCondition(
					candidateResult,
					`CR4 difference metrics are missing ${scene.sceneId}/${candidate.id}.`,
				);
				const rgba = differenceRgba(
					internal.cpuRgba,
					scene.internal.cpuBrunetonRgba,
					fixture.diagnostics.differenceAmplification,
				);
				const artifactPath = `diagnostics/difference-${candidate.id}-${scene.sceneId}.png`;
				const canvas = rgbaCanvas(rgba, width, height);
				const upload = await uploadBytes(artifactPath, canvasPngBytes(canvas), 'image/png');
				canvas.remove();
				differences.push({
					...upload,
					kind: 'amplified-absolute-rgb-code-difference',
					sceneId: scene.sceneId,
					candidateId: candidate.id,
					panelId: `difference-${candidate.id}`,
					totalHorizontalIlluminanceLux: scene.totalHorizontalIlluminanceLux,
					gain: candidateResult.gain,
					width,
					height,
					amplification: fixture.diagnostics.differenceAmplification,
					source: 'CPU candidate RGB codes versus independent CPU Bruneton RGB codes',
					parents: [
						{
							namespace: fixture.parents.skyField.namespace,
							runId: fixture.parents.skyField.runId,
							role: 'CR1 pre-display linear RGBY float32 field',
							...scene.inputs.field,
						},
						{
							namespace: fixture.parents.receiverLight.namespace,
							runId: fixture.parents.receiverLight.runId,
							role: 'CR2 receiver-light measurement analysis',
							...cr2AnalysisInput.evidence,
						},
					],
					operation:
						`Absolute per-channel RGB-code difference between independent CPU CR4 and CPU Bruneton replays, multiplied by ${fixture.diagnostics.differenceAmplification} and clamped to 255.`,
				});
				uploadOrder.push(artifactPath);
			}
		}
		requireCondition(
			JSON.stringify(differences.map((record) => record.artifactPath)) ===
				JSON.stringify(fixture.outputs.differences),
			'CR4 difference upload order changed.',
		);

		const responseFigure = responseCurveFigure(fixture, candidateModels, sceneResults);
		const responseUpload = await uploadBytes(
			fixture.outputs.figures[0],
			canvasPngBytes(responseFigure.canvas),
			'image/png',
		);
		figures.push({
			...responseUpload,
			kind: 'response-curves',
			panelId: 'response-curves',
			width: responseFigure.canvas.width,
			height: responseFigure.canvas.height,
			parents: [{
				namespace: fixture.parents.receiverLight.namespace,
				runId: fixture.parents.receiverLight.runId,
				role: 'CR2 receiver-light measurement analysis',
				...cr2AnalysisInput.evidence,
			}],
			operation:
				'Plot the exact CR4 gain and analytic illuminance derivative for all three predeclared rows over the fixed log-illuminance domain.',
		});
		uploadOrder.push(fixture.outputs.figures[0]);
		responseFigure.canvas.remove();

		const preservationCanvas = preservationFigure(
			fixture,
			sceneResults,
			fixture.response.candidates,
		);
		const preservationUpload = await uploadBytes(
			fixture.outputs.figures[1],
			canvasPngBytes(preservationCanvas),
			'image/png',
		);
		figures.push({
			...preservationUpload,
			kind: 'bruneton-preservation',
			panelId: 'bruneton-preservation',
			width: preservationCanvas.width,
			height: preservationCanvas.height,
			parents: panels.filter(({controlId}) => controlId === 'bruneton').map((panel) => ({
				artifactPath: panel.artifactPath,
				byteLength: panel.byteLength,
				sha256: panel.sha256,
			})),
			operation:
				'Plot candidate-versus-independent-CPU-Bruneton sky RGB-code maxima and RMSE against the frozen illuminance-indexed preservation envelope.',
		});
		uploadOrder.push(fixture.outputs.figures[1]);
		preservationCanvas.remove();

		const blackSaturationCanvas = blackSaturationFigure(
			fixture,
			sceneResults,
			fixture.response.candidates,
		);
		const blackSaturationUpload = await uploadBytes(
			fixture.outputs.figures[2],
			canvasPngBytes(blackSaturationCanvas),
			'image/png',
		);
		figures.push({
			...blackSaturationUpload,
			kind: 'black-saturation-summary',
			panelId: 'black-saturation-summary',
			width: blackSaturationCanvas.width,
			height: blackSaturationCanvas.height,
			parents: panels.map(({artifactPath, byteLength, sha256}) => ({
				artifactPath,
				byteLength,
				sha256,
			})),
			operation:
				'Summarize sky-only black fraction, saturated fraction, and median encoded display luminance from the authenticated CR1 R8 masks.',
		});
		uploadOrder.push(fixture.outputs.figures[2]);
		blackSaturationCanvas.remove();

		const sheet = contactSheet(fixture, panelPixelsByPath);
		const contactSheetUpload = await uploadBytes(
			fixture.outputs.contactSheet,
			canvasPngBytes(sheet.canvas),
			'image/png',
		);
		figures.push({
			...contactSheetUpload,
			kind: 'decision-contact-sheet',
			panelId: 'decision-contact-sheet',
			width: sheet.canvas.width,
			height: sheet.canvas.height,
			rowCount: sheet.rowCount,
			columnCount: sheet.columnCount,
			rows: sheet.rows,
			panelArtifactPaths: [...fixture.outputs.panels],
			parents: panels.map(({artifactPath, byteLength, sha256}) => ({
				artifactPath,
				byteLength,
				sha256,
			})),
			operation:
				'Arrange all 30 previously uploaded control and candidate panels in the frozen chronological scene and response-row order.',
		});
		uploadOrder.push(fixture.outputs.contactSheet);
		sheet.canvas.remove();
		await window.colorResetProgress('decision-plate-complete');

		const expectedUploadOrder = [
			...fixture.outputs.panels,
			...fixture.outputs.differences,
			...fixture.outputs.figures,
		];
		requireCondition(
			JSON.stringify(uploadOrder) === JSON.stringify(expectedUploadOrder),
			'CR4 complete image upload order changed.',
		);

		const responseDiagnostics = curveDiagnostics(candidateModels, fixture);
		const candidateSummary = fixture.response.candidates.map((candidate) => {
			const records = sceneResults.map((scene) => ({
				sceneId: scene.sceneId,
				preservationControl: scene.preservationControl,
				...scene.candidates.find((entry) => entry.candidateId === candidate.id),
			}));
			const preservationRecords = records.filter((record) => record.preservationControl);
			const sunsetSequence = ['sunset', 'sunset-plus-10-minutes', 'sunset-plus-60-minutes'].map(
				(sceneId) => records.find((record) => record.sceneId === sceneId),
			);
			const plus60 = records.find((record) => record.sceneId === 'sunset-plus-60-minutes');
			const twilight = records.filter((record) =>
				['sunset-plus-10-minutes', 'sunset-plus-60-minutes'].includes(record.sceneId),
			);
			return {
				candidateId: candidate.id,
				preservationPassed: preservationRecords.every(
					(record) =>
						record.preservation.maximumAbsoluteRgbCodeDifference <=
							record.preservation.envelope.maximumAbsoluteRgbCodeDifference &&
						record.preservation.rgbCodeRmse <=
							record.preservation.envelope.rgbCodeRmse,
				),
				gpuCpuParityPassed: records.every(
					(record) =>
						record.cpuGpuParity.encodedSky.maximumAbsoluteRgbCodeDifference <=
							fixture.diagnostics.gpuCpuParity.maximumAbsoluteRgbCodeDifference &&
						record.cpuGpuParity.encodedSky.rgbCodeRmse <=
							fixture.diagnostics.gpuCpuParity.maximumRgbCodeRmse,
				),
				twilightSaturationPassed: twilight.every(
					(record) =>
						record.display.saturatedSkyPixelFraction <=
						fixture.diagnostics.twilight.maximumSkySaturatedFraction,
				),
				plus60Visible:
					1 - plus60.display.blackSkyPixelFraction >=
						fixture.diagnostics.twilight.minimumPlus60NonblackSkyFraction &&
					plus60.preservation.rgbCodeRmse >=
						fixture.diagnostics.twilight.minimumCandidateVsBrunetonRgbCodeRmse,
				strictlyFallingMedianFromSunset:
					sunsetSequence[0].display.medianDisplayLuminance >
						sunsetSequence[1].display.medianDisplayLuminance &&
					sunsetSequence[1].display.medianDisplayLuminance >
						sunsetSequence[2].display.medianDisplayLuminance,
			};
		});

		const parentControlPanels = panels.filter(({kind}) => kind === 'parent-control-copy');
		const parentControlsCopiedExactly =
			parentControlPanels.length === fixture.scenes.length * 2 &&
			parentControlPanels.every(
				({byteLength, sha256, parent}) =>
					byteLength === parent.byteLength && sha256 === parent.sha256,
			);
		const receiverScalarReplayedExactly =
			receiverLightVerification.length === fixture.scenes.length &&
			receiverLightVerification.every(
				(record) =>
					record.exactValueMatch === true &&
					record.units === fixture.receiverLightScalar.units &&
					record.equationDifferenceLux <=
						1e-9 * Math.max(1, record.parentValueLux),
			);
		const responseProofCandidates = responseDiagnostics.map((record) => ({
			...record,
			zeroIlluminanceDerivativePass:
				record.derivativeAtZeroPerLux ===
				fixture.response.properties.zeroIlluminanceDerivativePerLux,
			positiveDerivativeAbsent: record.maximumPositiveDerivative <= 0,
			passed:
				record.finite === true &&
				record.monotonicNonincreasing === true &&
				record.maximumPositiveGainStep === 0 &&
				record.maximumPositiveDerivative <= 0 &&
				record.derivativeAtZeroPerLux ===
					fixture.response.properties.zeroIlluminanceDerivativePerLux,
		}));
		const responseProof = {
			method:
				'Independent CPU evaluation of the contained analytic model at zero plus 4097 logarithmic illuminance samples per candidate.',
			declaredValueAndSlopeContinuous:
				fixture.response.properties.continuousValueAndSlope === true,
			candidates: responseProofCandidates,
			passed:
				fixture.response.properties.continuousValueAndSlope === true &&
				responseProofCandidates.every((record) => record.passed),
		};
		const oneScalarOneEquation =
			receiverScalarReplayedExactly &&
			fixture.receiverLightScalar.sameValueForEveryPixel === true &&
			fixture.receiverLightScalar.namedTimeInput === false &&
			fixture.receiverLightScalar.solarZenithInput === false &&
			fixture.receiverLightScalar.sourceKindInput === false &&
			fixture.response.id === CR4_GLOBAL_ACHROMATIC_RESPONSE_ID &&
			candidateModels.every(
				(model) =>
					model.curve.transitionIlluminanceLux === fixture.response.transitionIlluminanceLux &&
					model.curve.rolloffPower === fixture.response.rolloffPower,
			);
		const achromaticCrossProductTolerance =
			fixture.diagnostics.achromaticity.maximumUnclippedCrossProductError;
		const maximumAchromaticCrossProductError = Math.max(
			...sceneResults.flatMap((scene) =>
				scene.candidates.map(
					(candidate) => candidate.achromaticity.maximumCrossProductError,
				),
			),
		);
		const achromaticBeforeClip =
			Number.isFinite(maximumAchromaticCrossProductError) &&
			maximumAchromaticCrossProductError <= achromaticCrossProductTolerance;
		const plus60Scene = sceneResults.find(
			({sceneId}) => sceneId === 'sunset-plus-60-minutes',
		);
		requireCondition(plus60Scene, 'CR4 plus-60-minute scene result is missing.');
		const plus60MinimumNonblackFraction = Math.min(
			...plus60Scene.candidates.map(({sky}) => 1 - sky.blackFraction),
		);
		const chronologicalMedianStrictlyFalling = candidateSummary.every(
			({strictlyFallingMedianFromSunset}) => strictlyFallingMedianFromSunset,
		);
		const terminalWebglErrors = drainWebglErrors(gpu.context);
		const webglErrors = [
			...gpu.facts.startupErrors,
			...sceneResults.flatMap((scene) =>
				scene.candidates.flatMap(({gpu: candidateGpu}) => candidateGpu.errors),
			),
			...terminalWebglErrors,
		];
		const contextLost =
			gpu.context.isContextLost() ||
			sceneResults.some((scene) =>
				scene.candidates.some(({gpu: candidateGpu}) => candidateGpu.contextLost),
			);
		const webgl = {
			contextName: 'webgl2',
			renderer: gpu.facts.renderer,
			vendor: gpu.facts.vendor,
			version: gpu.facts.version,
			shadingLanguageVersion: gpu.facts.shadingLanguageVersion,
			contextAttributes: gpu.facts.contextAttributes,
			d3d11Renderer: /direct3d11|d3d11/iu.test(gpu.facts.renderer),
			contextLost,
			errors: webglErrors,
			extColorBufferFloat: gpu.facts.extColorBufferFloat,
			inputTextureInternalFormat: gpu.facts.inputTextureInternalFormat,
			candidateRenderTargetInternalFormat: gpu.facts.candidateRenderTargetInternalFormat,
			presentationTarget: gpu.facts.presentationTarget,
		};
		const publicScenes = sceneResults.map(({internal, ...scene}) => scene);
		return {
			schemaId: 'algorithm32-color-reset-cr4-browser-result-v1',
			claimBoundary: fixture.claimBoundary,
			software: {
				browserUserAgent: navigator.userAgent,
				webCrypto: 'SubtleCrypto SHA-256',
			},
			parents: {
				skyField: {
					namespace: fixture.parents.skyField.namespace,
					runId: fixture.parents.skyField.runId,
					artifactSetSha256: fixture.parents.skyField.artifactSetSha256,
					analysis: cr1AnalysisInput.evidence,
					sceneReferences: cr1References,
				},
				receiverLight: {
					namespace: fixture.parents.receiverLight.namespace,
					runId: fixture.parents.receiverLight.runId,
					artifactSetSha256: fixture.parents.receiverLight.artifactSetSha256,
					analysis: cr2AnalysisInput.evidence,
				},
			},
			receiverLightScalar: {
				...fixture.receiverLightScalar,
				verification: receiverLightVerification,
				allFixtureValuesExact: receiverLightVerification.every((entry) => entry.exactValueMatch),
			},
			response: {
				id: fixture.response.id,
				equation: fixture.response.equation,
				operationSpace: fixture.response.operationSpace,
				curveDiagnostics: responseDiagnostics,
				figureSamples: responseFigure.samples,
			},
			responseProof,
			oneScalarOneEquation,
			achromaticBeforeClip,
			achromaticityProof: {
				population: 'All CPU candidate pixels for which no RGB channel reaches the explicit display clamp.',
				maximumCrossProductError: maximumAchromaticCrossProductError,
				tolerance: achromaticCrossProductTolerance,
				passed: achromaticBeforeClip,
			},
			parentControlsCopiedExactly,
			receiverScalarReplayedExactly,
			plus60MinimumNonblackFraction,
			chronologicalMedianStrictlyFalling,
			webgl,
			gpu: {
				...gpu.facts,
				candidatePrograms: candidateModels.map((model) => ({
					candidateId: model.curve.id,
					fragmentSourceSha256:
						gpu.candidatePrograms.get(model.curve.id).fragmentSourceSha256,
				})),
				contextLost,
				terminalErrors: terminalWebglErrors,
				errors: webglErrors,
			},
			scenes: publicScenes,
			candidateSummary,
			panels,
			differences,
			figures,
			images: [...panels, ...differences, ...figures],
			uploadOrder,
			contactSheet: figures.at(-1),
			allDeclaredImagesUploaded: true,
		};
	} finally {
		disposeGpuReplay(gpu);
	}
}
