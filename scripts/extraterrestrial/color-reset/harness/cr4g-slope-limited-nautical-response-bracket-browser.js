import {
	CR4C_TWO_SCALE_PRE_TONE_RESPONSE_ID,
	Cr4cTwoScalePreToneExposureColorDisplayModel,
} from '../color/Cr4cTwoScalePreToneExposureColorDisplayModel.js';
import {
	CR4G_SLOPE_LIMITED_PRE_TONE_RESPONSE_ID,
	Cr4gSlopeLimitedPreToneExposureColorDisplayModel,
} from '../color/Cr4gSlopeLimitedPreToneExposureColorDisplayModel.js';

const LUMINANCE_WEIGHTS = Object.freeze([0.2126, 0.7152, 0.0722]);
const RESPONSE_COLORS = Object.freeze(['#ff9f43', '#58a6ff', '#65d68a', '#d2a8ff']);
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
const READBACK_SENTINEL = new Float32Array([-11011.25, -22022.5, -33033.75, -44044]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}

function glslFloat(value) {
	requireCondition(Number.isFinite(value), 'CR4G GLSL constant must be finite.');
	return Number.isInteger(value) ? `${value}.0` : String(value);
}

function dataUrlBytes(dataUrl) {
	const marker = ';base64,';
	const markerIndex = dataUrl.indexOf(marker);
	requireCondition(markerIndex >= 0, 'CR4G PNG data URL is not base64 encoded.');
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
	requireCondition(
		declaration &&
			typeof declaration.path === 'string' &&
			Number.isInteger(declaration.byteLength) &&
			/^[0-9a-f]{64}$/u.test(declaration.sha256),
		`${label} declaration is incomplete.`,
	);
	const response = await fetch(prefix + declaration.path);
	requireCondition(response.ok, `${label} fetch failed with HTTP ${response.status}.`);
	const bytes = new Uint8Array(await response.arrayBuffer());
	requireCondition(bytes.byteLength === declaration.byteLength, `${label} byte length changed.`);
	const sha256 = await sha256Hex(bytes);
	requireCondition(sha256 === declaration.sha256, `${label} SHA-256 changed.`);
	return {
		bytes,
		evidence: {
			sourcePrefix: prefix,
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
	requireCondition(response.ok, `CR4G artifact upload failed for ${artifactPath}: HTTP ${response.status}.`);
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
	requireCondition(context, 'CR4G could not create a 2D canvas context.');
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
		requireCondition(context, `CR4G could not decode ${label}.`);
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
	requireCondition(noncanonicalPixelCount === 0, `${label} contains noncanonical values.`);
	requireCondition(skyPixelCount > 0 && geometryPixelCount > 0, `${label} is degenerate.`);
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
	requireCondition(shader, `CR4G could not allocate ${label} shader.`);
	context.shaderSource(shader, source);
	context.compileShader(shader);
	if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
		const log = context.getShaderInfoLog(shader);
		context.deleteShader(shader);
		throw new Error(`CR4G ${label} shader compilation failed: ${log}`);
	}
	return shader;
}

function compileProgram(context, fragmentSource, label) {
	const vertex = compileShader(context, context.VERTEX_SHADER, VERTEX_SOURCE, `${label} vertex`);
	const fragment = compileShader(context, context.FRAGMENT_SHADER, fragmentSource, `${label} fragment`);
	const program = context.createProgram();
	requireCondition(program, `CR4G could not allocate ${label} program.`);
	context.attachShader(program, vertex);
	context.attachShader(program, fragment);
	context.linkProgram(program);
	context.deleteShader(vertex);
	context.deleteShader(fragment);
	if (!context.getProgramParameter(program, context.LINK_STATUS)) {
		const log = context.getProgramInfoLog(program);
		context.deleteProgram(program);
		throw new Error(`CR4G ${label} program link failed: ${log}`);
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
	throw new Error('CR4G WebGL error drain exceeded 32 entries.');
}

function responseFragmentSource(response) {
	const uniformName =
		response.kind === 'control'
			? 'uCr4cTotalHorizontalIlluminanceLux'
			: 'uCr4gTotalHorizontalIlluminanceLux';
	const encodeBlock = response.model._displayEncodeBlock();
	return `#version 300 es
precision highp float;
uniform sampler2D uLinearField;
uniform float ${uniformName};
in vec2 vScreenUv;
out vec4 outputColor;
const float DISPLAY_TONE_MAP_K = ${glslFloat(response.model.displayConstants.paperFigure1ToneMapK)};
${encodeBlock}
void main() {
	vec3 signedProjectedLinearRgb = texture(uLinearField, vec2(vScreenUv.x, 1.0 - vScreenUv.y)).rgb;
	outputColor = encodeDisplayOutput(signedProjectedLinearRgb);
}`;
}

async function createGpuReplay(width, height, responses) {
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
	requireCondition(context, 'CR4G requires a WebGL2 context.');
	requireCondition(
		context.getExtension('EXT_color_buffer_float'),
		'CR4G requires EXT_color_buffer_float for RGBA32F replay.',
	);
	context.disable(context.DITHER);
	context.disable(context.BLEND);
	context.disable(context.DEPTH_TEST);
	context.disable(context.CULL_FACE);
	const vertexArray = context.createVertexArray();
	requireCondition(vertexArray, 'CR4G could not allocate a vertex array.');
	context.bindVertexArray(vertexArray);
	const debug = context.getExtension('WEBGL_debug_renderer_info');
	const renderer = debug
		? context.getParameter(debug.UNMASKED_RENDERER_WEBGL)
		: context.getParameter(context.RENDERER);
	const vendor = debug ? context.getParameter(debug.UNMASKED_VENDOR_WEBGL) : context.getParameter(context.VENDOR);
	const rendererLabel = String(renderer);
	const d3d11CompatibleShaderSurface =
		/(?:Direct3D11|D3D11)/iu.test(rendererLabel) &&
		!/(?:SwiftShader|Microsoft Basic Render Driver|software renderer)/iu.test(rendererLabel);
	const copyProgram = compileProgram(context, COPY_FRAGMENT_SOURCE, 'presentation copy');
	const programs = new Map();
	for (const response of responses) {
		const fragmentSource = responseFragmentSource(response);
		programs.set(response.responseId, {
			program: compileProgram(context, fragmentSource, response.responseId),
			uniformName:
				response.kind === 'control'
					? 'uCr4cTotalHorizontalIlluminanceLux'
					: 'uCr4gTotalHorizontalIlluminanceLux',
			fragmentSourceSha256: await sha256Hex(new TextEncoder().encode(fragmentSource)),
		});
	}
	const startupErrors = drainWebglErrors(context);
	requireCondition(startupErrors.length === 0, 'CR4G WebGL initialization produced errors.');
	return {
		canvas,
		context,
		vertexArray,
		copyProgram,
		programs,
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
			d3d11CompatibleShaderSurface,
			contextAttributes: context.getContextAttributes(),
			startupErrors,
		},
	};
}

function createRgba32fTexture(context, width, height, values = null) {
	const texture = context.createTexture();
	requireCondition(texture, 'CR4G could not allocate an RGBA32F texture.');
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

function renderResponseGpu(gpu, response, fieldValues, width, height, illuminance) {
	const context = gpu.context;
	const programRecord = gpu.programs.get(response.responseId);
	requireCondition(programRecord, `CR4G GPU program is missing for ${response.responseId}.`);
	const inputTexture = createRgba32fTexture(context, width, height, fieldValues);
	const outputTexture = createRgba32fTexture(context, width, height);
	const framebuffer = context.createFramebuffer();
	requireCondition(framebuffer, 'CR4G could not allocate an RGBA32F framebuffer.');
	context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
	context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, outputTexture, 0);
	const framebufferStatus = context.checkFramebufferStatus(context.FRAMEBUFFER);
	requireCondition(
		framebufferStatus === context.FRAMEBUFFER_COMPLETE,
		`CR4G RGBA32F framebuffer is incomplete: ${framebufferStatus}.`,
	);
	context.viewport(0, 0, width, height);
	context.clearBufferfv(context.COLOR, 0, READBACK_SENTINEL);
	context.useProgram(programRecord.program);
	context.activeTexture(context.TEXTURE0);
	context.bindTexture(context.TEXTURE_2D, inputTexture);
	context.uniform1i(context.getUniformLocation(programRecord.program, 'uLinearField'), 0);
	context.uniform1f(
		context.getUniformLocation(programRecord.program, programRecord.uniformName),
		illuminance.value,
	);
	context.drawArrays(context.TRIANGLES, 0, 3);
	context.finish();
	const drawErrors = drainWebglErrors(context);
	requireCondition(drawErrors.length === 0, `CR4G ${response.responseId} draw produced errors.`);

	const floatBottomUp = new Float32Array(width * height * 4);
	floatBottomUp.fill(Number.NaN);
	context.readPixels(0, 0, width, height, context.RGBA, context.FLOAT, floatBottomUp);
	const floatReadErrors = drainWebglErrors(context);
	requireCondition(floatReadErrors.length === 0, `CR4G ${response.responseId} float readback produced errors.`);
	validateFloatReadback(floatBottomUp, `CR4G ${response.responseId} float readback`);

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
		uniformName: programRecord.uniformName,
	};
}

function disposeGpuReplay(gpu) {
	for (const record of gpu.programs.values()) gpu.context.deleteProgram(record.program);
	gpu.context.deleteProgram(gpu.copyProgram);
	gpu.context.deleteVertexArray(gpu.vertexArray);
	gpu.canvas.remove();
}

function quantizedChannel(value) {
	return Math.round(clamp(value, 0, 1) * 255);
}

function renderResponseCpu(response, fieldValues, width, height, illuminance) {
	const pixelCount = width * height;
	const rgba = new Uint8ClampedArray(pixelCount * 4);
	const displayRgba = new Float32Array(pixelCount * 4);
	const gain = response.model.displayGain(illuminance);
	const derivative = response.model.displayGainDerivative(illuminance);
	const logElasticity =
		typeof response.model.displayGainLogElasticity === 'function'
			? response.model.displayGainLogElasticity(illuminance)
			: illuminance.value === 0
				? 0
				: (illuminance.value * derivative) / gain;
	for (let pixel = 0; pixel < pixelCount; pixel += 1) {
		const offset = pixel * 4;
		const rgb = response.model.linearSrgbToDisplayRgb(
			[fieldValues[offset], fieldValues[offset + 1], fieldValues[offset + 2]],
			illuminance,
		);
		for (let channel = 0; channel < 3; channel += 1) {
			displayRgba[offset + channel] = rgb[channel];
			rgba[offset + channel] = quantizedChannel(rgb[channel]);
		}
		displayRgba[offset + 3] = 1;
		rgba[offset + 3] = 255;
	}
	return {
		rgba,
		displayRgba,
		gain,
		gainDerivativePerLux: derivative,
		gainLogElasticity: logElasticity,
		positiveGainElasticity: -logElasticity,
	};
}

function compareRgbCodes(actual, expected, mask = null) {
	requireCondition(actual.length === expected.length, 'CR4G RGB comparison sizes differ.');
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
		population: mask ? 'sky-only from immutable R8 scene-hit mask' : 'all pixels',
		comparedPixelCount,
		maximumAbsoluteRgbCodeDifference,
		rgbCodeRmse: Math.sqrt(squaredError / (comparedPixelCount * 3)),
		differingPixelCount,
		differingPixelFraction: differingPixelCount / comparedPixelCount,
	};
}

function compareFloatRgba(actual, expected, mask) {
	requireCondition(actual.length === expected.length, 'CR4G float comparison sizes differ.');
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
		population: 'sky-only from immutable R8 scene-hit mask',
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

function summarizeRegions(rgba, mask, width, height, regions) {
	return regions.map((region) => {
		const minimumY = Math.floor(region.minimumYFraction * height);
		const maximumY = Math.ceil(region.maximumYFraction * height);
		const luminances = [];
		let blackSkyPixelCount = 0;
		let saturatedSkyPixelCount = 0;
		for (let y = minimumY; y < maximumY; y += 1) {
			for (let x = 0; x < width; x += 1) {
				const pixel = y * width + x;
				if (mask[pixel] !== 0) continue;
				const offset = pixel * 4;
				const red = rgba[offset];
				const green = rgba[offset + 1];
				const blue = rgba[offset + 2];
				if (red === 0 && green === 0 && blue === 0) blackSkyPixelCount += 1;
				if (red === 255 || green === 255 || blue === 255) saturatedSkyPixelCount += 1;
				luminances.push(
					(red * LUMINANCE_WEIGHTS[0] + green * LUMINANCE_WEIGHTS[1] + blue * LUMINANCE_WEIGHTS[2]) /
						255,
				);
			}
		}
		requireCondition(luminances.length > 0, `CR4G region ${region.id} is empty.`);
		luminances.sort((left, right) => left - right);
		return {
			regionId: region.id,
			label: region.label,
			minimumYFraction: region.minimumYFraction,
			maximumYFraction: region.maximumYFraction,
			pixelCount: luminances.length,
			medianDisplayLuminance: percentile(luminances, 50),
			p95DisplayLuminance: percentile(luminances, 95),
			blackSkyPixelCount,
			blackSkyPixelFraction: blackSkyPixelCount / luminances.length,
			saturatedSkyPixelCount,
			saturatedSkyPixelFraction: saturatedSkyPixelCount / luminances.length,
		};
	});
}

function validateConfiguration(configuration) {
	const fixture = configuration.fixture ?? configuration;
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr4g-slope-limited-nautical-response-bracket-input-v1',
		'CR4G fixture schema changed.',
	);
	requireCondition(
		fixture.viewport?.widthPixels === 640 && fixture.viewport?.heightPixels === 400,
		'CR4G requires the fixed 640 x 400 viewport.',
	);
	requireCondition(Array.isArray(fixture.scenes) && fixture.scenes.length === 6, 'CR4G requires six scenes.');
	const sceneOrder = fixture.scenes.map(({id}) => id);
	requireCondition(
		JSON.stringify(sceneOrder) === JSON.stringify(fixture.presentation?.sceneOrder),
		'CR4G scene order changed.',
	);
	for (const scene of fixture.scenes) {
		requireCondition(
			scene.sourcePrefix === '/cr1/' || scene.sourcePrefix === '/cr4f/',
			`CR4G source prefix changed for ${scene.id}.`,
		);
		requireCondition(
			scene.totalHorizontalIlluminance?.units === 'lux' &&
				Number.isFinite(scene.totalHorizontalIlluminance.value) &&
				scene.totalHorizontalIlluminance.value >= 0,
			`CR4G receiver illuminance changed for ${scene.id}.`,
		);
	}
	requireCondition(
		fixture.response?.control?.id === 'cr4c-control' &&
			fixture.response.control.sunsetAmplitude === 3.5 &&
			fixture.response.control.sunsetTransitionIlluminanceLux === 980 &&
			fixture.response.control.sunsetRolloffPower === 9 &&
			fixture.response.control.nauticalAmplitude === 5300 &&
			fixture.response.control.nauticalTransitionIlluminanceLux === 1 &&
			fixture.response.control.nauticalRolloffPower === 3,
		'CR4G CR4C control response changed.',
	);
	requireCondition(
		Array.isArray(fixture.response.candidates) && fixture.response.candidates.length === 3,
		'CR4G requires exactly three candidate rows.',
	);
	const responseOrder = [fixture.response.control.id, ...fixture.response.candidates.map(({id}) => id)];
	requireCondition(
		JSON.stringify(responseOrder) === JSON.stringify(fixture.presentation.responseOrder),
		'CR4G response order changed.',
	);
	const expectedImages = [
		...responseOrder.flatMap((responseId) => fixture.outputs.frames[responseId]),
		...responseOrder.map((responseId) => fixture.outputs.chronologies[responseId]),
		fixture.outputs.diagnostic,
		fixture.outputs.decisionPlate,
	];
	requireCondition(
		expectedImages.length === 30 &&
			new Set(expectedImages).size === expectedImages.length &&
			JSON.stringify(expectedImages) === JSON.stringify(fixture.outputs.requestedImageUploadOrder),
		'CR4G must declare exactly 30 response-major ordered images.',
	);
	const regions = fixture.diagnostics?.chronologyRegions;
	requireCondition(
		Array.isArray(regions) &&
			regions.length === 3 &&
			regions[0].minimumYFraction === 0 &&
			regions[0].maximumYFraction === 1 &&
			regions[1].minimumYFraction === 0 &&
			regions[1].maximumYFraction === 0.35 &&
			regions[2].minimumYFraction === 0.35 &&
			regions[2].maximumYFraction === 0.56,
		'CR4G chronology regions changed from the exact CR4C fractions.',
	);
	const responseProof = fixture.diagnostics?.responseProof;
	requireCondition(
		Number.isFinite(responseProof?.minimumIlluminanceLux) &&
			responseProof.minimumIlluminanceLux > 0 &&
			Number.isFinite(responseProof.maximumIlluminanceLux) &&
			responseProof.maximumIlluminanceLux > responseProof.minimumIlluminanceLux &&
			Number.isSafeInteger(responseProof.positiveLogSampleCount) &&
			responseProof.positiveLogSampleCount >= 2 &&
			responseProof.deepElasticityMaximumIlluminanceLux ===
				fixture.scenes.find(({id}) => id === 'sunset-plus-20-minutes')
					?.totalHorizontalIlluminance.value &&
			Number.isFinite(responseProof.maximumElasticityExcess) &&
			responseProof.maximumElasticityExcess >= 0 &&
			Number.isFinite(responseProof.maximumHighLightGainExcess) &&
			responseProof.maximumHighLightGainExcess >= 0,
		'CR4G response-proof domain changed or is invalid.',
	);
	return fixture;
}

function createResponses(fixture) {
	const control = {
		responseId: fixture.response.control.id,
		label: fixture.response.control.label ?? 'CR4C control',
		kind: 'control',
		model: new Cr4cTwoScalePreToneExposureColorDisplayModel({curve: fixture.response.control}),
	};
	const candidates = fixture.response.candidates.map((curve) => ({
		responseId: curve.id,
		label: curve.label ?? `Slope ${curve.adaptationExponent.toFixed(2)}`,
		kind: 'candidate',
		model: new Cr4gSlopeLimitedPreToneExposureColorDisplayModel({curve}),
	}));
	return [control, ...candidates];
}

function formatNumber(value, digits = 8) {
	if (value === null || value === undefined) return 'n/a';
	if (!Number.isFinite(value)) return String(value);
	return value.toPrecision(digits);
}

function responseChronologyCanvas(fixture, response, sceneFrames) {
	const width = 688;
	const padding = 24;
	const headingHeight = 76;
	const labelHeight = 58;
	const gap = 16;
	const sourceWidth = fixture.viewport.widthPixels;
	const sourceHeight = fixture.viewport.heightPixels;
	const height = headingHeight + padding + sceneFrames.length * (labelHeight + sourceHeight + gap);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: false});
	requireCondition(context, 'CR4G could not create a chronology canvas.');
	context.fillStyle = '#0d1117';
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#f0f6fc';
	context.font = 'bold 22px sans-serif';
	context.fillText(`CR4G fine twilight cadence - ${response.label}`, padding, 34);
	context.fillStyle = '#9da7b3';
	context.font = '13px sans-serif';
	context.fillText('Exact immutable RGBY fields; one global pre-tone response; owner review only.', padding, 58);
	let y = headingHeight;
	for (const [index, frame] of sceneFrames.entries()) {
		context.fillStyle = '#f0f6fc';
		context.font = 'bold 15px sans-serif';
		context.fillText(`${index + 1}. ${frame.label}`, padding, y + 18);
		context.fillStyle = '#9da7b3';
		context.font = '11px monospace';
		context.fillText(
			`${frame.solarElevationDegrees.toFixed(6)} deg elevation | E ${formatNumber(frame.totalHorizontalIlluminance.value, 9)} lux | g ${formatNumber(frame.gain, 9)} | +elasticity ${formatNumber(frame.positiveGainElasticity, 6)}`,
			padding,
			y + 39,
		);
		y += labelHeight;
		context.drawImage(frame.canvas, padding, y, sourceWidth, sourceHeight);
		context.strokeStyle = '#475569';
		context.strokeRect(padding + 0.5, y + 0.5, sourceWidth - 1, sourceHeight - 1);
		y += sourceHeight + gap;
	}
	return canvas;
}

function drawLogAxes(context, plot, xMinimum, xMaximum, yMinimum, yMaximum, xLabel, yLabel) {
	context.strokeStyle = '#65718a';
	context.lineWidth = 1;
	context.strokeRect(plot.left, plot.top, plot.width, plot.height);
	context.fillStyle = '#9da7b3';
	context.font = '12px sans-serif';
	context.fillText(xLabel, plot.left + plot.width / 2 - 100, plot.top + plot.height + 38);
	context.save();
	context.translate(plot.left - 55, plot.top + plot.height / 2 + 80);
	context.rotate(-Math.PI / 2);
	context.fillText(yLabel, 0, 0);
	context.restore();
	for (let exponent = Math.ceil(Math.log10(xMinimum)); exponent <= Math.floor(Math.log10(xMaximum)); exponent += 1) {
		const value = 10 ** exponent;
		const fraction = (Math.log10(value) - Math.log10(xMinimum)) / (Math.log10(xMaximum) - Math.log10(xMinimum));
		const x = plot.left + fraction * plot.width;
		context.strokeStyle = '#263041';
		context.beginPath();
		context.moveTo(x, plot.top);
		context.lineTo(x, plot.top + plot.height);
		context.stroke();
		context.fillStyle = '#9da7b3';
		context.fillText(`1e${exponent}`, x - 12, plot.top + plot.height + 18);
	}
	for (let exponent = Math.ceil(Math.log10(yMinimum)); exponent <= Math.floor(Math.log10(yMaximum)); exponent += 1) {
		const value = 10 ** exponent;
		const fraction = (Math.log10(value) - Math.log10(yMinimum)) / (Math.log10(yMaximum) - Math.log10(yMinimum));
		const y = plot.top + (1 - fraction) * plot.height;
		context.strokeStyle = '#263041';
		context.beginPath();
		context.moveTo(plot.left, y);
		context.lineTo(plot.left + plot.width, y);
		context.stroke();
		context.fillStyle = '#9da7b3';
		context.fillText(`1e${exponent}`, plot.left - 42, y + 4);
	}
}

function diagnosticCanvas(fixture, responseResults) {
	const canvas = document.createElement('canvas');
	canvas.width = 1420;
	canvas.height = 900;
	const context = canvas.getContext('2d', {alpha: false});
	requireCondition(context, 'CR4G could not create the gain/median diagnostic.');
	context.fillStyle = '#0d1117';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#f0f6fc';
	context.font = 'bold 26px sans-serif';
	context.fillText('CR4G response gain and exact encoded-luminance medians', 42, 42);
	context.fillStyle = '#9da7b3';
	context.font = '14px sans-serif';
	context.fillText('Curves are scene-global. Points use immutable CR2 receiver E and exact CR4C regions.', 42, 68);

	const gainPlot = {left: 88, top: 112, width: 550, height: 520};
	const minimumIlluminance = 0.02;
	const maximumIlluminance = 2000;
	const minimumGain = 1;
	const maximumGain = Math.max(
		...responseResults.flatMap(({scenes}) => scenes.map(({gain}) => gain)),
		...responseResults.map(({model}) =>
			model.displayGain({value: minimumIlluminance, units: 'lux'}),
		),
		5304.5,
	);
	drawLogAxes(
		context,
		gainPlot,
		minimumIlluminance,
		maximumIlluminance,
		minimumGain,
		maximumGain,
		'total-horizontal illuminance E (lux, log)',
		'global pre-tone gain g(E) (log)',
	);
	for (const [responseIndex, response] of responseResults.entries()) {
		context.strokeStyle = RESPONSE_COLORS[responseIndex];
		context.lineWidth = 3;
		context.beginPath();
		for (let index = 0; index <= 600; index += 1) {
			const fraction = index / 600;
			const illuminance = minimumIlluminance * (maximumIlluminance / minimumIlluminance) ** fraction;
			const gain = response.model.displayGain({value: illuminance, units: 'lux'});
			const x = gainPlot.left + fraction * gainPlot.width;
			const yFraction = (Math.log10(gain) - Math.log10(minimumGain)) /
				(Math.log10(maximumGain) - Math.log10(minimumGain));
			const y = gainPlot.top + (1 - yFraction) * gainPlot.height;
			if (index === 0) context.moveTo(x, y);
			else context.lineTo(x, y);
		}
		context.stroke();
		for (const scene of response.scenes) {
			const xFraction =
				(Math.log10(scene.totalHorizontalIlluminance.value) - Math.log10(minimumIlluminance)) /
				(Math.log10(maximumIlluminance) - Math.log10(minimumIlluminance));
			const yFraction =
				(Math.log10(scene.gain) - Math.log10(minimumGain)) /
				(Math.log10(maximumGain) - Math.log10(minimumGain));
			context.fillStyle = RESPONSE_COLORS[responseIndex];
			context.beginPath();
			context.arc(
				gainPlot.left + xFraction * gainPlot.width,
				gainPlot.top + (1 - yFraction) * gainPlot.height,
				4,
				0,
				Math.PI * 2,
			);
			context.fill();
		}
	}

	const medianPlot = {left: 760, top: 112, width: 590, height: 520};
	context.strokeStyle = '#65718a';
	context.strokeRect(medianPlot.left, medianPlot.top, medianPlot.width, medianPlot.height);
	for (let line = 0; line <= 5; line += 1) {
		const y = medianPlot.top + (line / 5) * medianPlot.height;
		context.strokeStyle = '#263041';
		context.beginPath();
		context.moveTo(medianPlot.left, y);
		context.lineTo(medianPlot.left + medianPlot.width, y);
		context.stroke();
		context.fillStyle = '#9da7b3';
		context.font = '12px sans-serif';
		context.fillText((1 - line / 5).toFixed(1), medianPlot.left - 30, y + 4);
	}
	const regionDashes = [[], [9, 5], [2, 5]];
	for (const [responseIndex, response] of responseResults.entries()) {
		for (const [regionIndex, region] of fixture.diagnostics.chronologyRegions.entries()) {
			context.setLineDash(regionDashes[regionIndex]);
			context.strokeStyle = RESPONSE_COLORS[responseIndex];
			context.lineWidth = regionIndex === 0 ? 3 : 1.5;
			context.beginPath();
			for (const [sceneIndex, scene] of response.scenes.entries()) {
				const metric = scene.regions.find(({regionId}) => regionId === region.id);
				const x = medianPlot.left + (sceneIndex / (response.scenes.length - 1)) * medianPlot.width;
				const y = medianPlot.top + (1 - metric.medianDisplayLuminance) * medianPlot.height;
				if (sceneIndex === 0) context.moveTo(x, y);
				else context.lineTo(x, y);
			}
			context.stroke();
		}
	}
	context.setLineDash([]);
	context.fillStyle = '#9da7b3';
	context.font = '12px sans-serif';
	for (const [index, scene] of fixture.scenes.entries()) {
		const x = medianPlot.left + (index / (fixture.scenes.length - 1)) * medianPlot.width;
		context.fillText(`+${scene.offsetMinutes}`, x - 10, medianPlot.top + medianPlot.height + 20);
	}
	context.fillText('minutes after sunset', medianPlot.left + 225, medianPlot.top + medianPlot.height + 42);
	context.save();
	context.translate(medianPlot.left - 55, medianPlot.top + medianPlot.height / 2 + 85);
	context.rotate(-Math.PI / 2);
	context.fillText('encoded luminance median', 0, 0);
	context.restore();

	context.font = '13px sans-serif';
	for (const [responseIndex, response] of responseResults.entries()) {
		context.fillStyle = RESPONSE_COLORS[responseIndex];
		context.fillRect(80 + responseIndex * 310, 700, 20, 4);
		context.fillText(response.label, 108 + responseIndex * 310, 705);
	}
	context.fillStyle = '#9da7b3';
	context.fillText('Region line styles: whole solid; upper dashed; horizon dotted.', 80, 752);
	context.font = '12px monospace';
	for (const [responseIndex, response] of responseResults.entries()) {
		const maximumElasticity = Math.max(
			...response.scenes.map(({positiveGainElasticity}) => positiveGainElasticity),
		);
		context.fillStyle = RESPONSE_COLORS[responseIndex];
		context.fillText(
			`${response.responseId.padEnd(14)} max sampled |d ln g / d ln E| ${formatNumber(maximumElasticity, 7)}`,
			80 + (responseIndex % 2) * 650,
			800 + Math.floor(responseIndex / 2) * 28,
		);
	}
	context.fillStyle = '#9da7b3';
	context.font = '13px sans-serif';
	context.fillText('No scientific or appearance gate is evaluated by this figure.', 80, 870);
	return canvas;
}

function decisionPlateCanvas(fixture, responseResults) {
	const canvas = document.createElement('canvas');
	canvas.width = 1500;
	canvas.height = 1520;
	const context = canvas.getContext('2d', {alpha: false});
	requireCondition(context, 'CR4G could not create the matrix decision plate.');
	context.fillStyle = '#0d1117';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#f0f6fc';
	context.font = 'bold 27px sans-serif';
	context.fillText('CR4G slope-limited nautical response bracket', 34, 40);
	context.fillStyle = '#9da7b3';
	context.font = '14px sans-serif';
	context.fillText('CR4C control plus three soft-knee exponents; exact fields and one response per column.', 34, 66);
	const left = 215;
	const top = 126;
	const cellWidth = 288;
	const cellHeight = 180;
	const gapX = 18;
	const gapY = 50;
	for (const [responseIndex, response] of responseResults.entries()) {
		const x = left + responseIndex * (cellWidth + gapX);
		context.fillStyle = RESPONSE_COLORS[responseIndex];
		context.font = 'bold 16px sans-serif';
		context.fillText(response.label, x, 98);
		context.fillStyle = '#9da7b3';
		context.font = '11px monospace';
		context.fillText(response.responseId, x, 116);
	}
	for (const [sceneIndex, sceneSpec] of fixture.scenes.entries()) {
		const y = top + sceneIndex * (cellHeight + gapY);
		context.fillStyle = '#f0f6fc';
		context.font = 'bold 15px sans-serif';
		context.fillText(sceneSpec.label, 34, y + 20);
		context.fillStyle = '#9da7b3';
		context.font = '11px monospace';
		context.fillText(`${sceneSpec.solarElevationDegrees.toFixed(3)} deg`, 34, y + 40);
		context.fillText(`${formatNumber(sceneSpec.totalHorizontalIlluminance.value, 6)} lux`, 34, y + 56);
		for (const [responseIndex, response] of responseResults.entries()) {
			const frame = response.scenes[sceneIndex];
			const x = left + responseIndex * (cellWidth + gapX);
			context.drawImage(frame.canvas, x, y, cellWidth, cellHeight);
			context.strokeStyle = '#475569';
			context.strokeRect(x + 0.5, y + 0.5, cellWidth - 1, cellHeight - 1);
			const whole = frame.regions[0];
			context.fillStyle = '#9da7b3';
			context.font = '10px monospace';
			context.fillText(
				`g ${formatNumber(frame.gain, 6)} | median ${whole.medianDisplayLuminance.toFixed(4)}`,
				x,
				y + cellHeight + 16,
			);
			context.fillText(
				`black ${(whole.blackSkyPixelFraction * 100).toFixed(3)}% | sat ${(whole.saturatedSkyPixelFraction * 100).toFixed(3)}%`,
				x,
				y + cellHeight + 31,
			);
		}
	}
	context.fillStyle = '#9da7b3';
	context.font = '13px sans-serif';
	context.fillText(
		'All 24 full-resolution frames and four chronological plates precede this matrix. Owner review and gates remain pending.',
		34,
		1490,
	);
	return canvas;
}

function chronologyRecord(response, regions) {
	const chronology = regions.map((region) => {
		const values = response.scenes.map(
			(scene) => scene.regions.find(({regionId}) => region.id === regionId).medianDisplayLuminance,
		);
		return {
			regionId: region.id,
			label: region.label,
			values,
			strictlyDecreasing: values.every((value, index) => index === 0 || value < values[index - 1]),
		};
	});
	return {
		medianConvention:
			'Exact weighted encoded RGB8 luminance median over sky pixels in the CR4C top-down row-fraction region.',
		regions: chronology,
		allStrictlyDecreasing: chronology.every(({strictlyDecreasing}) => strictlyDecreasing),
	};
}

function sampledResponseFacts(response, fixture) {
	const declaration = fixture.diagnostics.responseProof;
	const minimum = declaration.minimumIlluminanceLux;
	const maximum = declaration.maximumIlluminanceLux;
	const positiveSampleCount = declaration.positiveLogSampleCount;
	const deepDomainMaximumIlluminanceLux = declaration.deepElasticityMaximumIlluminanceLux;
	let finite = true;
	let positive = true;
	let monotonicNonincreasing = true;
	let derivativeNonpositive = true;
	let previousGain = Number.POSITIVE_INFINITY;
	let minimumGain = Number.POSITIVE_INFINITY;
	let maximumAbsoluteLogElasticity = 0;
	let maximumDeepNauticalAbsoluteLogElasticity = 0;
	for (let index = 0; index <= positiveSampleCount; index += 1) {
		const positiveIndex = index - 1;
		const fraction = positiveIndex / (positiveSampleCount - 1);
		const illuminance = index === 0 ? 0 : minimum * (maximum / minimum) ** fraction;
		const packet = {value: illuminance, units: 'lux'};
		const gain = response.model.displayGain(packet);
		const derivative = response.model.displayGainDerivative(packet);
		const elasticity =
			typeof response.model.displayGainLogElasticity === 'function'
				? response.model.displayGainLogElasticity(packet)
				: illuminance === 0
					? 0
					: (illuminance * derivative) / gain;
		finite = finite && Number.isFinite(gain) && Number.isFinite(derivative) && Number.isFinite(elasticity);
		positive = positive && gain > 0;
		minimumGain = Math.min(minimumGain, gain);
		monotonicNonincreasing = monotonicNonincreasing && gain <= previousGain;
		derivativeNonpositive = derivativeNonpositive && derivative <= 0;
		maximumAbsoluteLogElasticity = Math.max(maximumAbsoluteLogElasticity, Math.abs(elasticity));
		if (illuminance > 0 && illuminance <= deepDomainMaximumIlluminanceLux) {
			maximumDeepNauticalAbsoluteLogElasticity = Math.max(
				maximumDeepNauticalAbsoluteLogElasticity,
				Math.abs(elasticity),
			);
		}
		previousGain = gain;
	}
	const gainAtZero = response.model.displayGain({value: 0, units: 'lux'});
	const gainAtMaximumIlluminance = response.model.displayGain({value: maximum, units: 'lux'});
	return {
		sampleCount: positiveSampleCount + 1,
		minimumPositiveIlluminanceLux: minimum,
		maximumIlluminanceLux: maximum,
		finite,
		positive,
		minimumGain,
		gainAtZero,
		gainAtMaximumIlluminance,
		highLightGainExcess: Math.abs(gainAtMaximumIlluminance - 1),
		monotonicNonincreasing,
		derivativeNonpositive,
		maximumAbsoluteLogElasticity,
		deepDomainMinimumIlluminanceExclusiveLux: 0,
		deepDomainMaximumIlluminanceLux,
		maximumDeepNauticalAbsoluteLogElasticity,
		maximumDeepNauticalPositiveGainElasticity: maximumDeepNauticalAbsoluteLogElasticity,
		candidateDomainMinimumIlluminanceExclusiveLux: 0,
		candidateDomainMaximumIlluminanceLux: deepDomainMaximumIlluminanceLux,
		maximumCandidateDomainPositiveGainElasticity: maximumDeepNauticalAbsoluteLogElasticity,
	};
}

export async function runCr4gSlopeLimitedNauticalResponseBracketBrowser() {
	const configurationResponse = await fetch('/browser/configuration.json');
	requireCondition(configurationResponse.ok, `CR4G configuration failed with HTTP ${configurationResponse.status}.`);
	const fixture = validateConfiguration(await configurationResponse.json());
	const width = fixture.viewport.widthPixels;
	const height = fixture.viewport.heightPixels;
	const pixelCount = width * height;
	await window.colorResetProgress('parent-input-started');

	const inputs = await Promise.all(
		fixture.scenes.map(async (scene) => {
			const [fieldInput, maskInput, controlInput] = await Promise.all([
				fetchVerifiedBytes(scene.sourcePrefix, scene.field, `CR4G ${scene.id} field`),
				fetchVerifiedBytes(scene.sourcePrefix, scene.mask, `CR4G ${scene.id} mask`),
				fetchVerifiedBytes('/cr4f/', scene.control, `CR4G ${scene.id} CR4F control`),
			]);
			const decodedField = decodeFloat32Le(fieldInput.bytes, pixelCount * 4, `CR4G ${scene.id} field`);
			const maskFacts = validateMask(maskInput.bytes, pixelCount, `CR4G ${scene.id} mask`);
			const controlRgba = await decodePng(controlInput.bytes, width, height, `CR4G ${scene.id} CR4F control`);
			return {
				spec: scene,
				fieldValues: decodedField.values,
				maskBytes: maskInput.bytes,
				controlRgba,
				evidence: {
					sceneId: scene.id,
					sourcePrefix: scene.sourcePrefix,
					field: {...fieldInput.evidence, nonfiniteValueCount: decodedField.nonfiniteValueCount},
					mask: {...maskInput.evidence, ...maskFacts},
					control: controlInput.evidence,
				},
			};
		}),
	);
	const responses = createResponses(fixture);
	const gpu = await createGpuReplay(width, height, responses);
	requireCondition(gpu.facts.maximumTextureSize >= Math.max(width, height), 'CR4G viewport exceeds GPU limits.');
	const responseResults = responses.map((response) => ({
		...response,
		modelId: response.model.id,
		curve: response.model.curve,
		scenes: [],
	}));
	const uploadedImages = [];
	const imageUploadOrder = [];
	const panelIdentities = [];
	const imageDerivations = [];

	const uploadImage = async (artifactPath, canvas, identity, derivation) => {
		const uploaded = await uploadBytes(artifactPath, canvasPngBytes(canvas), 'image/png');
		uploadedImages.push(uploaded);
		imageUploadOrder.push(artifactPath);
		panelIdentities.push({...identity, artifactPath, byteLength: uploaded.byteLength, sha256: uploaded.sha256});
		imageDerivations.push({...derivation, artifactPath, resultSha256: uploaded.sha256});
		if (imageUploadOrder.length === 1) await window.colorResetProgress('first-image-complete');
	};

	try {
		for (const response of responseResults) {
			for (const [sceneIndex, input] of inputs.entries()) {
				const cpu = renderResponseCpu(
					response,
					input.fieldValues,
					width,
					height,
					input.spec.totalHorizontalIlluminance,
				);
				const gpuResult = renderResponseGpu(
					gpu,
					response,
					input.fieldValues,
					width,
					height,
					input.spec.totalHorizontalIlluminance,
				);
				const canvas = rgbaCanvas(gpuResult.rgbaTopDown, width, height);
				const regions = summarizeRegions(
					gpuResult.rgbaTopDown,
					input.maskBytes,
					width,
					height,
					fixture.diagnostics.chronologyRegions,
				);
				const cpuGpuEncodedSky = compareRgbCodes(
					gpuResult.rgbaTopDown,
					cpu.rgba,
					input.maskBytes,
				);
				const cpuGpuEncodedAll = compareRgbCodes(gpuResult.rgbaTopDown, cpu.rgba);
				const cpuGpuFloatSky = compareFloatRgba(
					gpuResult.floatTopDown,
					cpu.displayRgba,
					input.maskBytes,
				);
				const controlParentSky =
					response.kind === 'control'
						? compareRgbCodes(gpuResult.rgbaTopDown, input.controlRgba, input.maskBytes)
						: null;
				const controlParentAll =
					response.kind === 'control'
						? compareRgbCodes(gpuResult.rgbaTopDown, input.controlRgba)
						: null;
				const parentControlRegions =
					response.kind === 'control'
						? summarizeRegions(
								input.controlRgba,
								input.maskBytes,
								width,
								height,
								fixture.diagnostics.chronologyRegions,
							)
						: null;
				const sceneResult = {
					sceneId: input.spec.id,
					label: input.spec.label,
					timeIso: input.spec.timeIso,
					offsetMinutes: input.spec.offsetMinutes,
					solarZenithDegrees: input.spec.solarZenithDegrees,
					solarElevationDegrees: input.spec.solarElevationDegrees,
					totalHorizontalIlluminance: input.spec.totalHorizontalIlluminance,
					gain: cpu.gain,
					gainDerivativePerLux: cpu.gainDerivativePerLux,
					gainLogElasticity: cpu.gainLogElasticity,
					positiveGainElasticity: cpu.positiveGainElasticity,
					regions,
					parentControlRegions,
					cpuGpuParity: {
						encodedSky: cpuGpuEncodedSky,
						encodedAll: cpuGpuEncodedAll,
						floatSky: cpuGpuFloatSky,
					},
					controlParentReplay: response.kind === 'control'
						? {sky: controlParentSky, all: controlParentAll}
						: null,
					gpu: {
						fragmentSourceSha256: gpuResult.fragmentSourceSha256,
						uniformName: gpuResult.uniformName,
						framebufferStatus: gpuResult.framebufferStatus,
						errors: gpuResult.errors,
						contextLost: gpuResult.contextLost,
					},
					canvas,
				};
				response.scenes.push(sceneResult);
				const artifactPath = fixture.outputs.frames[response.responseId][sceneIndex];
				await uploadImage(
					artifactPath,
					canvas,
					{
						panelId: `${response.responseId}-${input.spec.id}`,
						role: response.kind === 'control'
							? 'fresh WebGL2 CR4C control replay'
							: 'fresh WebGL2 CR4G slope-limited candidate replay',
						responseId: response.responseId,
						sceneId: input.spec.id,
						gain: cpu.gain,
						gainDerivativePerLux: cpu.gainDerivativePerLux,
						gainLogElasticity: cpu.gainLogElasticity,
						positiveGainElasticity: cpu.positiveGainElasticity,
					},
					{
						operation:
							'signed projected linear RGB times one scene-global response gain, followed by unchanged Bruneton exponential and RGBA8 presentation',
						modelId: response.modelId,
						curve: response.curve,
						parentField: input.evidence.field,
						parentMask: input.evidence.mask,
						parentRun: input.spec.sourcePrefix === '/cr1/' ? fixture.parents.cr1 : fixture.parents.cr4f,
						controlOracle: response.kind === 'control' ? input.evidence.control : null,
						controlOracleRun: response.kind === 'control' ? fixture.parents.cr4f : null,
						totalHorizontalIlluminance: input.spec.totalHorizontalIlluminance,
						fragmentSourceSha256: gpuResult.fragmentSourceSha256,
					},
				);
			}
		}

		const chronologyCanvases = new Map();
		for (const response of responseResults) {
			const canvas = responseChronologyCanvas(fixture, response, response.scenes);
			chronologyCanvases.set(response.responseId, canvas);
			await uploadImage(
				fixture.outputs.chronologies[response.responseId],
				canvas,
				{
					panelId: `chronology-${response.responseId}`,
					role: 'six-scene chronological response plate',
					responseId: response.responseId,
				},
				{
					operation:
						'Arrange six freshly rendered response panels at one-to-one resolution with exact scene, receiver-light, gain, and elasticity labels.',
					sourceArtifactPaths: fixture.outputs.frames[response.responseId],
					imageInterpolation: false,
				},
			);
		}

		const diagnostic = diagnosticCanvas(fixture, responseResults);
		await uploadImage(
			fixture.outputs.diagnostic,
			diagnostic,
			{panelId: 'gain-median-diagnostic', role: 'gain and exact regional-median diagnostic'},
			{
				operation:
					'Plot analytic response gain across receiver illuminance and exact weighted encoded RGB8 medians for the whole, upper, and horizon CR4C regions.',
				responseIds: responseResults.map(({responseId}) => responseId),
				sceneIds: fixture.scenes.map(({id}) => id),
			},
		);

		const decisionPlate = decisionPlateCanvas(fixture, responseResults);
		await uploadImage(
			fixture.outputs.decisionPlate,
			decisionPlate,
			{panelId: 'decision-matrix', role: 'complete CR4G owner-review response matrix'},
			{
				operation:
					'Arrange all 24 fresh full-resolution response/scene panels into a response-column and chronological-row matrix with exact gain, median, and clipping labels.',
				sourceArtifactPaths: fixture.presentation.responseOrder.flatMap(
					(responseId) => fixture.outputs.frames[responseId],
				),
				appearanceAccepted: false,
			},
		);
		await window.colorResetProgress('decision-plate-complete');
		requireCondition(
			JSON.stringify(imageUploadOrder) === JSON.stringify(fixture.outputs.requestedImageUploadOrder),
			'CR4G image upload order changed.',
		);

		// All requested images now exist. Only below this point are the
		// chronology and one-code relationships reduced to pass/fail facts.
		for (const response of responseResults) {
			for (const scene of response.scenes) {
				for (const comparison of [
					scene.cpuGpuParity.encodedSky,
					scene.cpuGpuParity.encodedAll,
				]) {
					comparison.withinOneCode =
						comparison.maximumAbsoluteRgbCodeDifference <=
						fixture.diagnostics.maximumCpuGpuRgbCodeDifference;
				}
				if (scene.controlParentReplay !== null) {
					for (const comparison of [
						scene.controlParentReplay.sky,
						scene.controlParentReplay.all,
					]) {
						comparison.withinOneCode =
							comparison.maximumAbsoluteRgbCodeDifference <=
							fixture.diagnostics.maximumControlReplayRgbCodeDifference;
					}
				}
			}
			response.chronology = chronologyRecord(response, fixture.diagnostics.chronologyRegions);
			response.sampledResponse = sampledResponseFacts(response, fixture);
			response.cpuGpuWithinOneCode = response.scenes.every(
				({cpuGpuParity}) =>
					cpuGpuParity.encodedSky.withinOneCode && cpuGpuParity.encodedAll.withinOneCode,
			);
		}
		const controlResult = responseResults[0];
		const controlParentReplayWithinOneCode = controlResult.scenes.every(
			({controlParentReplay}) =>
				controlParentReplay.sky.withinOneCode && controlParentReplay.all.withinOneCode,
		);
		const controlParentChronology = {
			medianConvention:
				'Exact decoded immutable CR4F CR4C-control PNG weighted encoded RGB8 luminance medians.',
			regions: fixture.diagnostics.chronologyRegions.map((region) => {
				const values = controlResult.scenes.map(
					(scene) =>
						scene.parentControlRegions.find(({regionId}) => regionId === region.id)
							.medianDisplayLuminance,
				);
				return {
					regionId: region.id,
					label: region.label,
					values,
					strictlyDecreasing: values.every(
						(value, index) => index === 0 || value < values[index - 1],
					),
				};
			}),
		};
		controlParentChronology.allStrictlyDecreasing = controlParentChronology.regions.every(
			({strictlyDecreasing}) => strictlyDecreasing,
		);
		const terminalErrors = drainWebglErrors(gpu.context);
		const allErrors = [
			...gpu.facts.startupErrors,
			...responseResults.flatMap(({scenes}) => scenes.flatMap(({gpu: sceneGpu}) => sceneGpu.errors)),
			...terminalErrors,
		];
		const uploadedByPath = new Map(uploadedImages.map((image) => [image.artifactPath, image]));
		return {
			schemaId: 'algorithm32-color-reset-cr4g-slope-limited-nautical-response-bracket-browser-result-v1',
			renderComplete: true,
			integrityGateEvaluated: false,
			scientificGateEvaluated: false,
			appearanceAccepted: false,
			productionClaim: false,
			responseIdentities: {
				control: CR4C_TWO_SCALE_PRE_TONE_RESPONSE_ID,
				candidate: CR4G_SLOPE_LIMITED_PRE_TONE_RESPONSE_ID,
			},
			parents: fixture.parents,
			sceneOrder: fixture.presentation.sceneOrder,
			responseOrder: fixture.presentation.responseOrder,
			scenes: inputs.map(({spec, evidence}) => ({
				sceneId: spec.id,
				label: spec.label,
				timeIso: spec.timeIso,
				offsetMinutes: spec.offsetMinutes,
				solarZenithDegrees: spec.solarZenithDegrees,
				solarElevationDegrees: spec.solarElevationDegrees,
				totalHorizontalIlluminance: spec.totalHorizontalIlluminance,
				...evidence,
			})),
			responses: responseResults.map(({model, scenes, ...response}) => ({
				...response,
				scenes: scenes.map(({canvas, ...scene}) => scene),
			})),
			controlParentReplayWithinOneCode,
			controlParentChronology,
			gpu: {
				...gpu.facts,
				programFragmentSourceSha256: Object.fromEntries(
					Array.from(gpu.programs.entries(), ([responseId, record]) => [
						responseId,
						record.fragmentSourceSha256,
					]),
				),
				programCount: gpu.programs.size,
				terminalErrors,
				errors: allErrors,
				contextLost: gpu.context.isContextLost(),
			},
			requestedImageCount: fixture.outputs.requestedImageUploadOrder.length,
			uploadedImageCount: uploadedImages.length,
			imageUploadOrder,
			uploadOrder: imageUploadOrder,
			uploadedImages,
			images: uploadedImages,
			frames: fixture.presentation.responseOrder.map((responseId) => ({
				responseId,
				images: fixture.outputs.frames[responseId].map((artifactPath) => uploadedByPath.get(artifactPath)),
			})),
			chronologyFigures: fixture.presentation.responseOrder.map((responseId) =>
				uploadedByPath.get(fixture.outputs.chronologies[responseId]),
			),
			diagnostic: uploadedByPath.get(fixture.outputs.diagnostic),
			decisionPlate: uploadedByPath.get(fixture.outputs.decisionPlate),
			allDeclaredImagesUploaded: true,
			panelIdentities,
			imageDerivations,
		};
	} finally {
		for (const response of responseResults) {
			for (const scene of response.scenes) scene.canvas?.remove();
		}
		disposeGpuReplay(gpu);
	}
}
