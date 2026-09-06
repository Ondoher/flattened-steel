import {BrunetonColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {
	CR4I_ANCHOR_PRESERVING_SHOULDER_RESPONSE_ID,
	Cr4iAnchorPreservingShoulderColorDisplayModel,
} from '../color/Cr4iAnchorPreservingShoulderColorDisplayModel.js';

const LUMINANCE_WEIGHTS = Object.freeze([0.2126, 0.7152, 0.0722]);
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

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}

function formatNumber(value, digits = 7) {
	if (!Number.isFinite(value)) return String(value);
	return value.toPrecision(digits);
}

function dataUrlBytes(dataUrl) {
	const marker = ';base64,';
	const index = dataUrl.indexOf(marker);
	requireCondition(index >= 0, 'CR4I PNG data URL is not base64 encoded.');
	const binary = atob(dataUrl.slice(index + marker.length));
	const bytes = new Uint8Array(binary.length);
	for (let byteIndex = 0; byteIndex < binary.length; byteIndex += 1) {
		bytes[byteIndex] = binary.charCodeAt(byteIndex);
	}
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
		declaration && typeof declaration.path === 'string' &&
		Number.isSafeInteger(declaration.byteLength) && declaration.byteLength > 0 &&
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
		evidence: {sourcePrefix: prefix, ...declaration, verified: true},
	};
}

async function uploadBytes(artifactPath, bytes, contentType) {
	const response = await fetch('/artifact/' + artifactPath, {
		method: 'POST',
		headers: {'content-type': contentType},
		body: bytes,
	});
	requireCondition(response.ok, `CR4I upload failed for ${artifactPath}: HTTP ${response.status}.`);
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
	const context = canvas.getContext('2d', {alpha: false, willReadFrequently: true});
	requireCondition(context, 'CR4I could not create a 2D canvas context.');
	context.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0);
	return canvas;
}

function decodeFloat32Le(bytes, expectedCount, label) {
	requireCondition(bytes.byteLength === expectedCount * 4, `${label} byte length changed.`);
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const values = new Float32Array(expectedCount);
	let nonfiniteValueCount = 0;
	for (let index = 0; index < expectedCount; index += 1) {
		const value = view.getFloat32(index * 4, true);
		values[index] = value;
		if (!Number.isFinite(value)) nonfiniteValueCount += 1;
	}
	requireCondition(nonfiniteValueCount === 0, `${label} contains nonfinite values.`);
	return {values, nonfiniteValueCount};
}

function validateMask(bytes, expectedPixels, label) {
	requireCondition(bytes.byteLength === expectedPixels, `${label} byte length changed.`);
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

function flipRows(values, width, height, components) {
	const result = new values.constructor(values.length);
	const rowLength = width * components;
	for (let y = 0; y < height; y += 1) {
		const source = (height - 1 - y) * rowLength;
		result.set(values.subarray(source, source + rowLength), y * rowLength);
	}
	return result;
}

function compileShader(context, type, source, label) {
	const shader = context.createShader(type);
	requireCondition(shader, `CR4I could not allocate ${label} shader.`);
	context.shaderSource(shader, source);
	context.compileShader(shader);
	if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
		const log = context.getShaderInfoLog(shader);
		context.deleteShader(shader);
		throw new Error(`CR4I ${label} shader compilation failed: ${log}`);
	}
	return shader;
}

function compileProgram(context, fragmentSource, label) {
	const vertex = compileShader(context, context.VERTEX_SHADER, VERTEX_SOURCE, `${label} vertex`);
	const fragment = compileShader(context, context.FRAGMENT_SHADER, fragmentSource, `${label} fragment`);
	const program = context.createProgram();
	requireCondition(program, `CR4I could not allocate ${label} program.`);
	context.attachShader(program, vertex);
	context.attachShader(program, fragment);
	context.linkProgram(program);
	context.deleteShader(vertex);
	context.deleteShader(fragment);
	if (!context.getProgramParameter(program, context.LINK_STATUS)) {
		const log = context.getProgramInfoLog(program);
		context.deleteProgram(program);
		throw new Error(`CR4I ${label} program link failed: ${log}`);
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
	throw new Error('CR4I WebGL error drain exceeded 32 entries.');
}

function responseFragmentSource(response) {
	const uniform = response.kind === 'smooth-response'
		? 'uniform float uCr4gTotalHorizontalIlluminanceLux;\n'
		: '';
	return `#version 300 es
precision highp float;
uniform sampler2D uLinearField;
${uniform}in vec2 vScreenUv;
out vec4 outputColor;
const float DISPLAY_TONE_MAP_K = ${response.model.displayConstants.paperFigure1ToneMapK};
${response.model._displayEncodeBlock()}
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
	requireCondition(context, 'CR4I requires WebGL2.');
	const floatExtension = context.getExtension('EXT_color_buffer_float');
	requireCondition(floatExtension, 'CR4I requires EXT_color_buffer_float.');
	context.disable(context.DITHER);
	context.disable(context.BLEND);
	context.disable(context.DEPTH_TEST);
	context.disable(context.CULL_FACE);
	const vertexArray = context.createVertexArray();
	requireCondition(vertexArray, 'CR4I could not allocate a vertex array.');
	context.bindVertexArray(vertexArray);
	const programs = new Map();
	for (const response of responses) {
		const fragmentSource = responseFragmentSource(response);
		const program = compileProgram(context, fragmentSource, response.responseId);
		programs.set(response.responseId, {
			program,
			fragmentSourceSha256: await sha256Hex(new TextEncoder().encode(fragmentSource)),
			fieldLocation: context.getUniformLocation(program, 'uLinearField'),
			illuminanceLocation: response.kind === 'smooth-response'
				? context.getUniformLocation(program, 'uCr4gTotalHorizontalIlluminanceLux')
				: null,
		});
	}
	const debug = context.getExtension('WEBGL_debug_renderer_info');
	return {
		canvas,
		context,
		vertexArray,
		programs,
		facts: {
			webglVersion: context.getParameter(context.VERSION),
			shadingLanguageVersion: context.getParameter(context.SHADING_LANGUAGE_VERSION),
			vendor: debug ? context.getParameter(debug.UNMASKED_VENDOR_WEBGL) : context.getParameter(context.VENDOR),
			renderer: debug ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER),
			maximumTextureSize: context.getParameter(context.MAX_TEXTURE_SIZE),
			extColorBufferFloat: true,
			startupErrors: drainWebglErrors(context),
			d3d11CompatibleShaderSurface: true,
		},
	};
}

function renderResponseGpu(gpu, response, fieldValues, width, height, illuminance) {
	const {context} = gpu;
	const record = gpu.programs.get(response.responseId);
	const inputTexture = context.createTexture();
	const outputTexture = context.createTexture();
	const framebuffer = context.createFramebuffer();
	requireCondition(inputTexture && outputTexture && framebuffer, 'CR4I could not allocate replay resources.');
	context.activeTexture(context.TEXTURE0);
	context.bindTexture(context.TEXTURE_2D, inputTexture);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
	context.texImage2D(context.TEXTURE_2D, 0, context.RGBA32F, width, height, 0, context.RGBA, context.FLOAT, fieldValues);
	context.bindTexture(context.TEXTURE_2D, outputTexture);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
	context.texImage2D(context.TEXTURE_2D, 0, context.RGBA32F, width, height, 0, context.RGBA, context.FLOAT, null);
	context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
	context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, outputTexture, 0);
	const framebufferStatus = context.checkFramebufferStatus(context.FRAMEBUFFER);
	requireCondition(framebufferStatus === context.FRAMEBUFFER_COMPLETE, 'CR4I float framebuffer is incomplete.');
	context.useProgram(record.program);
	context.uniform1i(record.fieldLocation, 0);
	if (record.illuminanceLocation !== null) {
		context.uniform1f(record.illuminanceLocation, illuminance.value);
	}
	context.activeTexture(context.TEXTURE0);
	context.bindTexture(context.TEXTURE_2D, inputTexture);
	context.bindVertexArray(gpu.vertexArray);
	context.viewport(0, 0, width, height);
	context.drawArrays(context.TRIANGLES, 0, 3);
	const drawErrors = drainWebglErrors(context);
	const floatBottomUp = new Float32Array(width * height * 4);
	floatBottomUp.fill(-12345.5);
	context.readPixels(0, 0, width, height, context.RGBA, context.FLOAT, floatBottomUp);
	const readErrors = drainWebglErrors(context);
	const floatTopDown = flipRows(floatBottomUp, width, height, 4);
	const rgbaTopDown = new Uint8ClampedArray(floatTopDown.length);
	let nonfiniteValueCount = 0;
	for (let index = 0; index < floatTopDown.length; index += 4) {
		for (let channel = 0; channel < 3; channel += 1) {
			const value = floatTopDown[index + channel];
			if (!Number.isFinite(value)) nonfiniteValueCount += 1;
			rgbaTopDown[index + channel] = Math.round(clamp(value, 0, 1) * 255);
		}
		rgbaTopDown[index + 3] = 255;
	}
	context.bindFramebuffer(context.FRAMEBUFFER, null);
	context.deleteFramebuffer(framebuffer);
	context.deleteTexture(outputTexture);
	context.deleteTexture(inputTexture);
	return {
		floatTopDown,
		rgbaTopDown,
		nonfiniteValueCount,
		framebufferStatus,
		errors: [...drawErrors, ...readErrors],
		contextLost: context.isContextLost(),
		fragmentSourceSha256: record.fragmentSourceSha256,
	};
}

function disposeGpuReplay(gpu) {
	for (const record of gpu.programs.values()) gpu.context.deleteProgram(record.program);
	gpu.context.deleteVertexArray(gpu.vertexArray);
	gpu.canvas.remove();
}

function createResponses(fixture) {
	return fixture.response.rows.map((row) => ({
		responseId: row.id,
		label: row.label,
		kind: row.kind,
		colorCss: row.colorCss,
		curve: row.kind === 'smooth-response' ? {...row} : null,
		model: row.kind === 'smooth-response'
			? new Cr4iAnchorPreservingShoulderColorDisplayModel({curve: row})
			: new BrunetonColorDisplayModel(),
	}));
}

function renderResponseCpu(response, fieldValues, illuminance) {
	const rgba = new Uint8ClampedArray(fieldValues.length);
	const displayRgba = new Float32Array(fieldValues.length);
	const gain = response.kind === 'smooth-response' ? response.model.displayGain(illuminance) : 1;
	const derivative = response.kind === 'smooth-response' ? response.model.displayGainDerivative(illuminance) : 0;
	const logElasticity = response.kind === 'smooth-response'
		? response.model.displayGainLogElasticity(illuminance)
		: 0;
	for (let offset = 0; offset < fieldValues.length; offset += 4) {
		const linearRgb = [fieldValues[offset], fieldValues[offset + 1], fieldValues[offset + 2]];
		const rgb = response.kind === 'smooth-response'
			? response.model.linearSrgbToDisplayRgb(linearRgb, illuminance)
			: response.model.linearSrgbToDisplayRgb(linearRgb);
		for (let channel = 0; channel < 3; channel += 1) {
			displayRgba[offset + channel] = rgb[channel];
			rgba[offset + channel] = Math.round(clamp(rgb[channel], 0, 1) * 255);
		}
		displayRgba[offset + 3] = 1;
		rgba[offset + 3] = 255;
	}
	return {rgba, displayRgba, gain, derivative, logElasticity, positiveGainElasticity: -logElasticity};
}

function compareRgbCodes(actual, expected, mask = null) {
	requireCondition(actual.length === expected.length, 'CR4I RGB comparison sizes differ.');
	let comparedPixelCount = 0;
	let differingPixelCount = 0;
	let maximumAbsoluteRgbCodeDifference = 0;
	let squaredError = 0;
	for (let pixel = 0; pixel < actual.length / 4; pixel += 1) {
		if (mask && mask[pixel] !== 0) continue;
		comparedPixelCount += 1;
		const offset = pixel * 4;
		let differs = false;
		for (let channel = 0; channel < 3; channel += 1) {
			const difference = Math.abs(actual[offset + channel] - expected[offset + channel]);
			maximumAbsoluteRgbCodeDifference = Math.max(maximumAbsoluteRgbCodeDifference, difference);
			squaredError += difference * difference;
			if (difference > 0) differs = true;
		}
		if (differs) differingPixelCount += 1;
	}
	return {
		population: mask ? 'sky-only from immutable R8 mask' : 'all pixels',
		comparedPixelCount,
		differingPixelCount,
		differingPixelFraction: differingPixelCount / comparedPixelCount,
		maximumAbsoluteRgbCodeDifference,
		rgbCodeRmse: Math.sqrt(squaredError / (comparedPixelCount * 3)),
	};
}

function compareFloatRgb(actual, expected, mask) {
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
		comparedPixelCount,
		maximumAbsoluteRgbDifference,
		rgbRmse: Math.sqrt(squaredError / (comparedPixelCount * 3)),
		nonfiniteValueCount,
	};
}

function percentile(sorted, requested) {
	if (sorted.length === 0) return null;
	const position = clamp(requested, 0, 100) * (sorted.length - 1) / 100;
	const lower = Math.floor(position);
	const upper = Math.ceil(position);
	if (lower === upper) return sorted[lower];
	return sorted[lower] * (upper - position) + sorted[upper] * (position - lower);
}

function summarizeDisplayRegions(rgba, mask, width, height, regions) {
	return regions.map((region) => {
		const values = [];
		let blackSkyPixelCount = 0;
		let saturatedSkyPixelCount = 0;
		const minimumY = Math.floor(region.minimumYFraction * height);
		const maximumY = Math.ceil(region.maximumYFraction * height);
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
				values.push((red * LUMINANCE_WEIGHTS[0] + green * LUMINANCE_WEIGHTS[1] + blue * LUMINANCE_WEIGHTS[2]) / 255);
			}
		}
		requireCondition(values.length > 0, `CR4I display region ${region.id} is empty.`);
		values.sort((left, right) => left - right);
		return {
			regionId: region.id,
			label: region.label,
			pixelCount: values.length,
			medianDisplayLuminance: percentile(values, 50),
			p95DisplayLuminance: percentile(values, 95),
			blackSkyPixelCount,
			blackSkyPixelFraction: blackSkyPixelCount / values.length,
			saturatedSkyPixelCount,
			saturatedSkyPixelFraction: saturatedSkyPixelCount / values.length,
		};
	});
}

function summarizeRawYRegions(fieldValues, mask, width, height, regions) {
	return regions.map((region) => {
		const values = [];
		const minimumY = Math.floor(region.minimumYFraction * height);
		const maximumY = Math.ceil(region.maximumYFraction * height);
		for (let y = minimumY; y < maximumY; y += 1) {
			for (let x = 0; x < width; x += 1) {
				const pixel = y * width + x;
				if (mask[pixel] !== 0) continue;
				values.push(Math.max(fieldValues[pixel * 4 + 3], Number.MIN_VALUE));
			}
		}
		values.sort((left, right) => left - right);
		return {
			regionId: region.id,
			label: region.label,
			pixelCount: values.length,
			medianRawPhotopicY: percentile(values, 50),
			p95RawPhotopicY: percentile(values, 95),
		};
	});
}

function validateConfiguration(configuration) {
	const fixture = configuration.fixture ?? configuration;
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr4i-smooth-bruneton-shoulder-check-input-v1',
		'CR4I fixture schema changed.',
	);
	requireCondition(!JSON.stringify(fixture).includes('PENDING_'), 'CR4I fixture contains unresolved pins.');
	requireCondition(fixture.viewport?.widthPixels === 640 && fixture.viewport?.heightPixels === 400, 'CR4I viewport changed.');
	requireCondition(fixture.scenes?.length === 12, 'CR4I requires twelve scenes.');
	requireCondition(
		JSON.stringify(fixture.scenes.map(({id}) => id)) === JSON.stringify(fixture.presentation?.sceneOrder),
		'CR4I scene order changed.',
	);
	requireCondition(fixture.response?.rows?.length === 5, 'CR4I requires five response rows.');
	requireCondition(
		JSON.stringify(fixture.response.rows.map(({id}) => id)) === JSON.stringify(fixture.presentation?.responseOrder),
		'CR4I response order changed.',
	);
	for (const scene of fixture.scenes) {
		requireCondition(
			['/cr1/', '/cr4h/', '/cr4f/'].includes(scene.sourcePrefix) &&
			Number.isFinite(scene.solarElevationDegrees) && Number.isFinite(scene.solarZenithDegrees) &&
			scene.totalHorizontalIlluminance?.units === 'lux' &&
			Number.isFinite(scene.totalHorizontalIlluminance.value) && scene.totalHorizontalIlluminance.value >= 0,
			`CR4I scene declaration changed for ${scene.id}.`,
		);
	}
	const expected = [
		...fixture.presentation.responseOrder.flatMap((id) => fixture.outputs.frames[id]),
		...fixture.presentation.responseOrder.map((id) => fixture.outputs.chronologies[id]),
		fixture.outputs.mainDecisionPlate,
		fixture.outputs.responsePlot,
		fixture.outputs.publicationPlot,
	];
	requireCondition(
		expected.length === 68 && new Set(expected).size === 68 &&
		JSON.stringify(expected) === JSON.stringify(fixture.outputs.requestedImageUploadOrder),
		'CR4I requires exactly 68 frame-first images.',
	);
	requireCondition(fixture.presentation.mainDecisionSceneIds?.length === 7, 'CR4I requires seven main decision scenes.');
	return fixture;
}

function responseProof(response, fixture) {
	if (response.kind === 'bruneton') {
		return {
			responseId: response.responseId,
			finite: true,
			positive: true,
			monotonicNonincreasing: true,
			derivativeNonpositive: true,
			continuousFirstDerivativeApplicable: false,
			continuouslyDifferentiableByConstruction: null,
			gainAtHighLightProof: 1,
			highLightGainExcess: 0,
		};
	}
	const declaration = fixture.diagnostics.responseProof;
	const minimum = declaration.minimumIlluminanceLux;
	const maximum = declaration.maximumDenseIlluminanceLux;
	let finite = true;
	let positive = true;
	let monotonicNonincreasing = true;
	let derivativeNonpositive = true;
	let previousGain = Number.POSITIVE_INFINITY;
	let maximumPositiveGainElasticity = 0;
	for (let index = 0; index <= declaration.positiveLogSampleCount; index += 1) {
		const fraction = index / declaration.positiveLogSampleCount;
		const illuminanceLux = minimum * (maximum / minimum) ** fraction;
		const packet = {value: illuminanceLux, units: 'lux'};
		const gain = response.model.displayGain(packet);
		const derivative = response.model.displayGainDerivative(packet);
		const elasticity = -response.model.displayGainLogElasticity(packet);
		finite &&= Number.isFinite(gain) && Number.isFinite(derivative) && Number.isFinite(elasticity);
		positive &&= gain > 0;
		monotonicNonincreasing &&= gain <= previousGain * (1 + 2e-14);
		derivativeNonpositive &&= derivative <= declaration.maximumDerivativePositiveTolerance;
		maximumPositiveGainElasticity = Math.max(maximumPositiveGainElasticity, elasticity);
		previousGain = gain;
	}
	const zeroPacket = {value: 0, units: 'lux'};
	const highPacket = {value: declaration.highLightProofIlluminanceLux, units: 'lux'};
	const gainAtZero = response.model.displayGain(zeroPacket);
	const derivativeAtZero = response.model.displayGainDerivative(zeroPacket);
	const gainAtHighLightProof = response.model.displayGain(highPacket);
	return {
		responseId: response.responseId,
		sampleCount: declaration.positiveLogSampleCount + 1,
		minimumIlluminanceLux: minimum,
		maximumDenseIlluminanceLux: maximum,
		finite,
		positive,
		monotonicNonincreasing,
		derivativeNonpositive,
		maximumPositiveGainElasticity,
		gainAtZero,
		derivativeAtZero,
		gainAtHighLightProof,
		highLightGainExcess: Math.abs(gainAtHighLightProof - 1),
		continuouslyDifferentiableByConstruction:
			response.curve.sunsetAmplitude > 0 && response.curve.sunsetTransitionIlluminanceLux > 0 &&
			response.curve.sunsetRolloffPower > 1 &&
			response.curve.adaptationPivotIlluminanceLux > 0 &&
			response.curve.adaptationFloorIlluminanceLux > 0 &&
			response.curve.adaptationSoftnessLogUnits > 0 &&
			response.curve.adaptationExponent > 0,
		continuousFirstDerivativeBasis: declaration.continuousFirstDerivativeBasis,
	};
}

function drawChronologyCanvas(fixture, response) {
	const width = 688;
	const padding = 24;
	const headingHeight = 76;
	const labelHeight = 52;
	const gap = 14;
	const sourceWidth = fixture.viewport.widthPixels;
	const sourceHeight = fixture.viewport.heightPixels;
	const height = headingHeight + response.scenes.length * (labelHeight + sourceHeight + gap) + padding;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: false});
	context.fillStyle = fixture.presentation.backgroundCss;
	context.fillRect(0, 0, width, height);
	context.fillStyle = fixture.presentation.headingCss;
	context.font = 'bold 21px sans-serif';
	context.fillText(`CR4I chronology - ${response.label}`, padding, 31);
	context.fillStyle = fixture.presentation.secondaryCss;
	context.font = '12px sans-serif';
	context.fillText('Exact immutable RGBY fields; one response for every scene; appearance review only.', padding, 55);
	let y = headingHeight;
	for (const [index, scene] of response.scenes.entries()) {
		const whole = scene.regions.find(({regionId}) => regionId === 'whole-sky');
		context.fillStyle = fixture.presentation.headingCss;
		context.font = 'bold 14px sans-serif';
		context.fillText(`${index + 1}. ${scene.label} (${scene.solarElevationDegrees.toFixed(3)} deg)`, padding, y + 17);
		context.fillStyle = fixture.presentation.secondaryCss;
		context.font = '11px monospace';
		context.fillText(`E ${formatNumber(scene.totalHorizontalIlluminance.value)} lux | g ${formatNumber(scene.gain)} | median ${formatNumber(whole.medianDisplayLuminance, 5)}`, padding, y + 37);
		y += labelHeight;
		context.drawImage(scene.canvas, padding, y);
		context.strokeStyle = fixture.presentation.borderCss;
		context.strokeRect(padding + 0.5, y + 0.5, sourceWidth - 1, sourceHeight - 1);
		y += sourceHeight + gap;
	}
	return canvas;
}

function drawMainDecisionPlate(fixture, responses) {
	const sceneIds = fixture.presentation.mainDecisionSceneIds;
	const scale = 0.5;
	const panelWidth = fixture.viewport.widthPixels * scale;
	const panelHeight = fixture.viewport.heightPixels * scale;
	const padding = 24;
	const columnGap = 12;
	const rowGap = 16;
	const headingHeight = 82;
	const columnLabelHeight = 44;
	const rowLabelHeight = 44;
	const width = padding * 2 + responses.length * panelWidth + (responses.length - 1) * columnGap;
	const height = headingHeight + columnLabelHeight + sceneIds.length * (rowLabelHeight + panelHeight + rowGap) + padding;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: false});
	context.imageSmoothingEnabled = false;
	context.fillStyle = fixture.presentation.backgroundCss;
	context.fillRect(0, 0, width, height);
	context.fillStyle = fixture.presentation.headingCss;
	context.font = 'bold 24px sans-serif';
	context.fillText('CR4I seven-scene Bruneton-to-twilight shoulder check', padding, 34);
	context.fillStyle = fixture.presentation.secondaryCss;
	context.font = '13px sans-serif';
	context.fillText('Each column is one global response. Candidate labels report sky-only max RGB-code difference / RMSE from unchanged Bruneton.', padding, 60);
	for (const [responseIndex, response] of responses.entries()) {
		const x = padding + responseIndex * (panelWidth + columnGap);
		context.fillStyle = response.colorCss;
		context.font = 'bold 13px sans-serif';
		context.fillText(response.label, x, headingHeight + 24, panelWidth);
	}
	let y = headingHeight + columnLabelHeight;
	for (const sceneId of sceneIds) {
		const baseScene = responses[0].scenes.find((scene) => scene.sceneId === sceneId);
		context.fillStyle = fixture.presentation.headingCss;
		context.font = 'bold 14px sans-serif';
		context.fillText(`${baseScene.label} | elevation ${baseScene.solarElevationDegrees.toFixed(3)} deg | E ${formatNumber(baseScene.totalHorizontalIlluminance.value)} lux`, padding, y + 17);
		y += rowLabelHeight;
		for (const [responseIndex, response] of responses.entries()) {
			const scene = response.scenes.find((entry) => entry.sceneId === sceneId);
			const x = padding + responseIndex * (panelWidth + columnGap);
			context.drawImage(scene.canvas, x, y, panelWidth, panelHeight);
			context.strokeStyle = fixture.presentation.borderCss;
			context.strokeRect(x + 0.5, y + 0.5, panelWidth - 1, panelHeight - 1);
			context.fillStyle = 'rgba(0,0,0,0.72)';
			context.fillRect(x, y + panelHeight - 23, panelWidth, 23);
			context.fillStyle = '#ffffff';
			context.font = '10px monospace';
			const text = response.kind === 'bruneton'
				? 'Bruneton control'
				: `max ${scene.brunetonDifference.sky.maximumAbsoluteRgbCodeDifference} | RMSE ${scene.brunetonDifference.sky.rgbCodeRmse.toFixed(3)}`;
			context.fillText(text, x + 6, y + panelHeight - 7, panelWidth - 12);
		}
		y += panelHeight + rowGap;
	}
	return canvas;
}

function drawAxes(context, rectangle, title, xLabel, yLabel) {
	context.strokeStyle = '#64748b';
	context.lineWidth = 1;
	context.strokeRect(rectangle.x + 0.5, rectangle.y + 0.5, rectangle.width - 1, rectangle.height - 1);
	context.fillStyle = '#f0f6fc';
	context.font = 'bold 14px sans-serif';
	context.fillText(title, rectangle.x, rectangle.y - 10);
	context.fillStyle = '#9da7b3';
	context.font = '11px sans-serif';
	context.fillText(xLabel, rectangle.x + rectangle.width / 2 - 60, rectangle.y + rectangle.height + 25);
	context.save();
	context.translate(rectangle.x - 35, rectangle.y + rectangle.height / 2 + 40);
	context.rotate(-Math.PI / 2);
	context.fillText(yLabel, 0, 0);
	context.restore();
}

function plotLine(context, points, rectangle, domains, color, dash = []) {
	const mapX = (value) => rectangle.x + (value - domains.xMinimum) / (domains.xMaximum - domains.xMinimum) * rectangle.width;
	const mapY = (value) => rectangle.y + rectangle.height - (value - domains.yMinimum) / (domains.yMaximum - domains.yMinimum) * rectangle.height;
	context.save();
	context.beginPath();
	context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
	context.clip();
	context.strokeStyle = color;
	context.lineWidth = 2;
	context.setLineDash(dash);
	context.beginPath();
	for (const [index, point] of points.entries()) {
		const x = mapX(point.x);
		const y = mapY(point.y);
		if (index === 0) context.moveTo(x, y);
		else context.lineTo(x, y);
	}
	context.stroke();
	context.restore();
}

function drawResponseMetricPlot(fixture, responses) {
	const canvas = document.createElement('canvas');
	canvas.width = 1400;
	canvas.height = 900;
	const context = canvas.getContext('2d', {alpha: false});
	context.fillStyle = fixture.presentation.backgroundCss;
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = fixture.presentation.headingCss;
	context.font = 'bold 24px sans-serif';
	context.fillText('CR4I response and Bruneton-difference metrics', 44, 38);
	const panels = [
		{x: 85, y: 90, width: 560, height: 300},
		{x: 785, y: 90, width: 560, height: 300},
		{x: 85, y: 500, width: 560, height: 300},
		{x: 785, y: 500, width: 560, height: 300},
	];
	drawAxes(context, panels[0], 'Global gain', 'log10 E (lux)', 'log10 gain');
	drawAxes(context, panels[1], 'Positive log elasticity', 'log10 E (lux)', '-d log(g) / d log(E)');
	drawAxes(context, panels[2], 'Sky max code difference from Bruneton', 'solar elevation (degrees)', 'maximum RGB code');
	drawAxes(context, panels[3], 'Sky RGB-code RMSE from Bruneton', 'solar elevation (degrees)', 'RMSE (codes)');
	const logMinimum = Math.log10(fixture.diagnostics.responseProof.minimumIlluminanceLux);
	const logMaximum = Math.log10(fixture.diagnostics.responseProof.maximumDenseIlluminanceLux);
	let maximumLogGain = 1;
	let maximumElasticity = 1;
	const curveSeries = [];
	for (const response of responses) {
		const gain = [];
		const elasticity = [];
		for (let index = 0; index <= 512; index += 1) {
			const logE = logMinimum + (logMaximum - logMinimum) * index / 512;
			const packet = {value: 10 ** logE, units: 'lux'};
			const value = response.kind === 'bruneton' ? 1 : response.model.displayGain(packet);
			const slope = response.kind === 'bruneton' ? 0 : -response.model.displayGainLogElasticity(packet);
			gain.push({x: logE, y: Math.log10(value)});
			elasticity.push({x: logE, y: slope});
			maximumLogGain = Math.max(maximumLogGain, Math.log10(value));
			maximumElasticity = Math.max(maximumElasticity, slope);
		}
		curveSeries.push({response, gain, elasticity});
	}
	for (const series of curveSeries) {
		plotLine(context, series.gain, panels[0], {xMinimum: logMinimum, xMaximum: logMaximum, yMinimum: 0, yMaximum: maximumLogGain * 1.05}, series.response.colorCss);
		plotLine(context, series.elasticity, panels[1], {xMinimum: logMinimum, xMaximum: logMaximum, yMinimum: 0, yMaximum: maximumElasticity * 1.05}, series.response.colorCss);
	}
	const candidates = responses.filter(({kind}) => kind === 'smooth-response');
	const elevations = fixture.scenes.map(({solarElevationDegrees}) => solarElevationDegrees);
	const xMinimum = Math.min(...elevations);
	const xMaximum = Math.max(...elevations);
	const maxCode = Math.max(1, ...candidates.flatMap(({scenes}) => scenes.map(({brunetonDifference}) => brunetonDifference.sky.maximumAbsoluteRgbCodeDifference)));
	const maxRmse = Math.max(1, ...candidates.flatMap(({scenes}) => scenes.map(({brunetonDifference}) => brunetonDifference.sky.rgbCodeRmse)));
	for (const response of candidates) {
		plotLine(context, response.scenes.map((scene) => ({x: scene.solarElevationDegrees, y: scene.brunetonDifference.sky.maximumAbsoluteRgbCodeDifference})).sort((a, b) => a.x - b.x), panels[2], {xMinimum, xMaximum, yMinimum: 0, yMaximum: maxCode * 1.05}, response.colorCss);
		plotLine(context, response.scenes.map((scene) => ({x: scene.solarElevationDegrees, y: scene.brunetonDifference.sky.rgbCodeRmse})).sort((a, b) => a.x - b.x), panels[3], {xMinimum, xMaximum, yMinimum: 0, yMaximum: maxRmse * 1.05}, response.colorCss);
	}
	let legendX = 100;
	for (const response of responses) {
		context.fillStyle = response.colorCss;
		context.fillRect(legendX, 845, 18, 3);
		context.fillStyle = fixture.presentation.secondaryCss;
		context.font = '11px sans-serif';
		context.fillText(response.label, legendX + 24, 850);
		legendX += 250;
	}
	return canvas;
}

function normalizedPoints(xValues, yValues, anchorIndex) {
	const anchor = yValues[anchorIndex];
	return xValues.map((x, index) => ({x, y: Math.log10(Math.max(yValues[index] / anchor, Number.MIN_VALUE))}));
}

function publicationComparison(fixture, inputs) {
	const koomen = fixture.publicationReferences.koomen1952;
	const patat = fixture.publicationReferences.patat2006;
	const sceneElevations = inputs.map(({spec}) => spec.solarElevationDegrees);
	const receiverValues = inputs.map(({spec}) => spec.totalHorizontalIlluminance.value);
	const sunsetIndex = inputs.findIndex(({spec}) => spec.id === 'sunset');
	const upperRawValues = inputs.map(({rawRegions}) => rawRegions.find(({regionId}) => regionId === 'upper-sky').medianRawPhotopicY);
	const patatBands = patat.coefficients.map((coefficient) => {
		const points = [];
		for (let zeta = patat.validSolarZenithDegrees[0]; zeta <= patat.validSolarZenithDegrees[1] + 1e-9; zeta += 0.25) {
			const delta = zeta - 95;
			const magnitudeDifference = coefficient.a1PerDegree * delta + coefficient.a2PerDegreeSquared * delta * delta;
			points.push({x: 90 - zeta, y: Math.log10(10 ** (-0.4 * magnitudeDifference))});
		}
		return {band: coefficient.band, points, coefficient};
	});
	const [koomenReceiverMinimumElevation, koomenReceiverMaximumElevation] =
		koomen.horizontalPlaneIllumination.validSolarElevationDegrees;
	const [koomenZenithMinimumElevation, koomenZenithMaximumElevation] =
		koomen.zenithLuminanceP90.validSolarElevationDegrees;
	const inKoomenReceiverDomain = (point) =>
		point.x >= koomenReceiverMinimumElevation && point.x <= koomenReceiverMaximumElevation;
	const inKoomenZenithDomain = (point) =>
		point.x >= koomenZenithMinimumElevation && point.x <= koomenZenithMaximumElevation;
	const patatMinimumElevation = 90 - patat.validSolarZenithDegrees[1];
	const patatMaximumElevation = 90 - patat.validSolarZenithDegrees[0];
	const inPatatDomain = (point) => point.x >= patatMinimumElevation && point.x <= patatMaximumElevation;
	const receiverFullContext = normalizedPoints(sceneElevations, receiverValues, sunsetIndex);
	const upperRawFullContext = normalizedPoints(sceneElevations, upperRawValues, sunsetIndex);
	return {
		policy: fixture.publicationReferences.comparisonPolicy,
		domains: {
			koomenReceiverSolarElevationDegreesInclusive: [koomenReceiverMinimumElevation, koomenReceiverMaximumElevation],
			koomenZenithSolarElevationDegreesInclusive: [koomenZenithMinimumElevation, koomenZenithMaximumElevation],
			patatSolarZenithDegreesInclusive: [...patat.validSolarZenithDegrees],
			patatSolarElevationDegreesInclusive: [patatMinimumElevation, patatMaximumElevation],
			allMetricsReportOnly: true,
		},
		receiver: {
			cr4iFullContext: receiverFullContext,
			cr4iKoomenMetricDomain: receiverFullContext.filter(inKoomenReceiverDomain),
			koomenHorizontalPlane: normalizedPoints(
				koomen.horizontalPlaneIllumination.solarElevationDegrees,
				koomen.horizontalPlaneIllumination.lux,
				koomen.horizontalPlaneIllumination.solarElevationDegrees.indexOf(0),
			),
		},
		directional: {
			cr4iUpperSkyRawYFullContext: upperRawFullContext,
			cr4iKoomenMetricDomain: upperRawFullContext.filter(inKoomenZenithDomain),
			cr4iPatatMetricDomain: upperRawFullContext.filter(inPatatDomain),
			koomenZenithP90: normalizedPoints(
				koomen.zenithLuminanceP90.solarElevationDegrees,
				koomen.zenithLuminanceP90.luminanceCandelaPerSquareMeter,
				koomen.zenithLuminanceP90.solarElevationDegrees.indexOf(0),
			),
			patatBands,
			directionMatch: false,
			reportOnly: true,
		},
	};
}

function drawPublicationPlot(fixture, comparison) {
	const canvas = document.createElement('canvas');
	canvas.width = 1400;
	canvas.height = 820;
	const context = canvas.getContext('2d', {alpha: false});
	context.fillStyle = fixture.presentation.backgroundCss;
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = fixture.presentation.headingCss;
	context.font = 'bold 24px sans-serif';
	context.fillText('CR4I publication-reference check - normalized physical slopes only', 44, 38);
	context.fillStyle = fixture.presentation.secondaryCss;
	context.font = '12px sans-serif';
	context.fillText('No display RGB was fitted. Locations, atmospheres, passbands, and directional samples differ.', 44, 61);
	const top = {x: 90, y: 110, width: 1220, height: 260};
	const bottom = {x: 90, y: 480, width: 1220, height: 260};
	drawAxes(context, top, 'Receiver illumination: CR4I total-horizontal E vs Koomen Table III', 'solar elevation (degrees)', 'log10 normalized illumination');
	drawAxes(context, bottom, 'Directional context: CR4I upper-sky raw Y vs Koomen zenith and Patat UBVRI', 'solar elevation (degrees)', 'log10 normalized brightness');
	const allTop = [...comparison.receiver.cr4iFullContext, ...comparison.receiver.koomenHorizontalPlane];
	const topDomain = {
		xMinimum: Math.min(...allTop.map(({x}) => x)), xMaximum: Math.max(...allTop.map(({x}) => x)),
		yMinimum: Math.min(...allTop.map(({y}) => y)), yMaximum: Math.max(...allTop.map(({y}) => y)),
	};
	plotLine(context, comparison.receiver.cr4iFullContext.sort((a, b) => a.x - b.x), top, topDomain, '#58a6ff');
	plotLine(context, comparison.receiver.koomenHorizontalPlane.sort((a, b) => a.x - b.x), top, topDomain, '#ff9f43', [8, 5]);
	const directionalSeries = [
		comparison.directional.cr4iUpperSkyRawYFullContext,
		comparison.directional.koomenZenithP90,
		...comparison.directional.patatBands.map(({points}) => points),
	];
	const allBottom = directionalSeries.flat();
	const bottomDomain = {
		xMinimum: Math.min(...allBottom.map(({x}) => x)), xMaximum: Math.max(...allBottom.map(({x}) => x)),
		yMinimum: Math.min(...allBottom.map(({y}) => y)), yMaximum: Math.max(...allBottom.map(({y}) => y)),
	};
	plotLine(context, comparison.directional.cr4iUpperSkyRawYFullContext.sort((a, b) => a.x - b.x), bottom, bottomDomain, '#58a6ff');
	plotLine(context, comparison.directional.koomenZenithP90.sort((a, b) => a.x - b.x), bottom, bottomDomain, '#ff9f43', [8, 5]);
	const patatColors = {U: '#a78bfa', B: '#60a5fa', V: '#65d68a', R: '#fb7185', I: '#f59e0b'};
	for (const band of comparison.directional.patatBands) {
		plotLine(context, band.points.sort((a, b) => a.x - b.x), bottom, bottomDomain, patatColors[band.band], [3, 4]);
	}
	context.fillStyle = '#58a6ff';
	context.fillText('CR4I', 120, 405);
	context.fillStyle = '#ff9f43';
	context.fillText('Koomen 1952', 210, 405);
	context.fillStyle = fixture.presentation.secondaryCss;
	context.fillText('Top: both normalized near H=0. Bottom: CR4I/Koomen normalized near H=0; Patat bands normalized at H=-5.', 340, 405);
	context.fillText('Bottom panel is non-matched-direction, report-only context: the fixed camera upper region does not include true zenith.', 120, 785);
	return canvas;
}

export async function runCr4iSmoothBrunetonShoulderCheckBrowser() {
	const configurationResponse = await fetch('/browser/configuration.json');
	requireCondition(configurationResponse.ok, `CR4I configuration failed with HTTP ${configurationResponse.status}.`);
	const fixture = validateConfiguration(await configurationResponse.json());
	const width = fixture.viewport.widthPixels;
	const height = fixture.viewport.heightPixels;
	const pixelCount = width * height;
	await window.colorResetProgress('parent-input-started');
	const inputs = await Promise.all(fixture.scenes.map(async (scene) => {
		const [fieldInput, maskInput] = await Promise.all([
			fetchVerifiedBytes(scene.sourcePrefix, scene.field, `CR4I ${scene.id} field`),
			fetchVerifiedBytes(scene.sourcePrefix, scene.mask, `CR4I ${scene.id} mask`),
		]);
		const field = decodeFloat32Le(fieldInput.bytes, pixelCount * 4, `CR4I ${scene.id} field`);
		const maskFacts = validateMask(maskInput.bytes, pixelCount, `CR4I ${scene.id} mask`);
		return {
			spec: scene,
			fieldValues: field.values,
			maskBytes: maskInput.bytes,
			rawRegions: summarizeRawYRegions(field.values, maskInput.bytes, width, height, fixture.diagnostics.chronologyRegions),
			evidence: {
				field: {...fieldInput.evidence, nonfiniteValueCount: field.nonfiniteValueCount},
				mask: {...maskInput.evidence, ...maskFacts},
			},
		};
	}));
	const responseDefinitions = createResponses(fixture);
	const gpu = await createGpuReplay(width, height, responseDefinitions);
	requireCondition(gpu.facts.maximumTextureSize >= Math.max(width, height), 'CR4I viewport exceeds GPU limits.');
	const responses = responseDefinitions.map((response) => ({...response, scenes: []}));
	const uploadedImages = [];
	const imageUploadOrder = [];
	const panelIdentities = [];
	const imageDerivations = [];
	const uploadImage = async (artifactPath, canvas, identity, derivation) => {
		const upload = await uploadBytes(artifactPath, canvasPngBytes(canvas), 'image/png');
		uploadedImages.push(upload);
		imageUploadOrder.push(artifactPath);
		panelIdentities.push({...identity, artifactPath, byteLength: upload.byteLength, sha256: upload.sha256});
		imageDerivations.push({...derivation, artifactPath, resultSha256: upload.sha256});
		if (imageUploadOrder.length === 1) await window.colorResetProgress('first-image-complete');
	};
	try {
		for (const response of responses) {
			for (const [sceneIndex, input] of inputs.entries()) {
				const cpu = renderResponseCpu(response, input.fieldValues, input.spec.totalHorizontalIlluminance);
				const gpuResult = renderResponseGpu(gpu, response, input.fieldValues, width, height, input.spec.totalHorizontalIlluminance);
				const regions = summarizeDisplayRegions(gpuResult.rgbaTopDown, input.maskBytes, width, height, fixture.diagnostics.chronologyRegions);
				const canvas = rgbaCanvas(gpuResult.rgbaTopDown, width, height);
				const bruneton = responses[0].scenes[sceneIndex] ?? null;
				const brunetonDifference = response.kind === 'bruneton' ? null : {
					sky: compareRgbCodes(gpuResult.rgbaTopDown, bruneton.rgba, input.maskBytes),
					all: compareRgbCodes(gpuResult.rgbaTopDown, bruneton.rgba),
				};
				const sceneResult = {
					sceneId: input.spec.id,
					label: input.spec.label,
					timeIso: input.spec.timeIso,
					offsetMinutes: input.spec.offsetMinutes,
					solarZenithDegrees: input.spec.solarZenithDegrees,
					solarElevationDegrees: input.spec.solarElevationDegrees,
					totalHorizontalIlluminance: input.spec.totalHorizontalIlluminance,
					preservationQualification: input.spec.preservationQualification,
					gain: cpu.gain,
					gainDerivativePerLux: cpu.derivative,
					gainLogElasticity: cpu.logElasticity,
					positiveGainElasticity: cpu.positiveGainElasticity,
					regions,
					rawRegions: input.rawRegions,
					brunetonDifference,
					cpuGpuParity: {
						encodedSky: compareRgbCodes(gpuResult.rgbaTopDown, cpu.rgba, input.maskBytes),
						encodedAll: compareRgbCodes(gpuResult.rgbaTopDown, cpu.rgba),
						floatSky: compareFloatRgb(gpuResult.floatTopDown, cpu.displayRgba, input.maskBytes),
					},
					gpu: {
						fragmentSourceSha256: gpuResult.fragmentSourceSha256,
						framebufferStatus: gpuResult.framebufferStatus,
						nonfiniteValueCount: gpuResult.nonfiniteValueCount,
						errors: gpuResult.errors,
						contextLost: gpuResult.contextLost,
					},
					rgba: gpuResult.rgbaTopDown,
					canvas,
				};
				response.scenes.push(sceneResult);
				const artifactPath = fixture.outputs.frames[response.responseId][sceneIndex];
				await uploadImage(
					artifactPath,
					canvas,
					{panelId: `${response.responseId}-${input.spec.id}`, role: 'full-resolution CR4I response replay', responseId: response.responseId, sceneId: input.spec.id},
					{operation: fixture.response.operation, responseId: response.responseId, curve: response.curve, parentId: input.spec.parentId, parentField: input.evidence.field, parentMask: input.evidence.mask, receiverLight: input.spec.totalHorizontalIlluminance, fragmentSourceSha256: gpuResult.fragmentSourceSha256},
				);
			}
		}

		for (const response of responses) {
			const canvas = drawChronologyCanvas(fixture, response);
			await uploadImage(
				fixture.outputs.chronologies[response.responseId],
				canvas,
				{panelId: `chronology-${response.responseId}`, role: 'twelve-scene chronology plate', responseId: response.responseId},
				{operation: 'Arrange twelve fresh response frames at one-to-one resolution with exact scene, receiver-light, gain, and regional-median labels.', sourceArtifactPaths: fixture.outputs.frames[response.responseId], imageSmoothing: false},
			);
			canvas.remove();
		}

		const mainDecision = drawMainDecisionPlate(fixture, responses);
		await uploadImage(
			fixture.outputs.mainDecisionPlate,
			mainDecision,
			{panelId: 'seven-scene-main-decision', role: 'primary owner-review Bruneton/candidate matrix'},
			{operation: 'Arrange seven declared scenes by five response rows with candidate-versus-Bruneton sky metrics.', sourceArtifactPaths: fixture.presentation.responseOrder.flatMap((responseId) => fixture.presentation.mainDecisionSceneIds.map((sceneId) => fixture.outputs.frames[responseId][fixture.presentation.sceneOrder.indexOf(sceneId)])), appearanceAccepted: false},
		);
		mainDecision.remove();
		await window.colorResetProgress('decision-plate-complete');

		const responsePlot = drawResponseMetricPlot(fixture, responses);
		await uploadImage(
			fixture.outputs.responsePlot,
			responsePlot,
			{panelId: 'response-bruneton-metrics', role: 'response gain, elasticity, and Bruneton-difference plot'},
			{operation: 'Plot analytic global gain/elasticity and measured sky-only candidate-versus-Bruneton RGB-code metrics.', responseIds: fixture.presentation.responseOrder, sceneIds: fixture.presentation.sceneOrder},
		);
		responsePlot.remove();

		const publication = publicationComparison(fixture, inputs);
		const publicationPlot = drawPublicationPlot(fixture, publication);
		await uploadImage(
			fixture.outputs.publicationPlot,
			publicationPlot,
			{panelId: 'publication-reference', role: 'normalized physical-slope publication comparison'},
			{operation: 'Compare normalized CR4I total-horizontal receiver E and non-matched upper-sky raw photopic Y with Koomen 1952 and Patat 2006 curves. No screen RGB fit.', references: fixture.publicationReferences, reportOnly: true},
		);
		publicationPlot.remove();
		requireCondition(
			JSON.stringify(imageUploadOrder) === JSON.stringify(fixture.outputs.requestedImageUploadOrder),
			'CR4I image upload order changed.',
		);

		// All 68 requested images exist above this line. The following records
		// expose facts for the Node runner's later gate evaluation.
		const proofs = responses.map((response) => responseProof(response, fixture));
		const authority = responses.find(({responseId}) => responseId === fixture.response.anchors.authorityRowId);
		const anchorComparisons = responses
			.filter(({kind}) => kind === 'smooth-response')
			.map((response) => ({
				responseId: response.responseId,
				anchors: fixture.response.anchors.sceneIds.map((sceneId) => {
					const scene = response.scenes.find((entry) => entry.sceneId === sceneId);
					const authorityScene = authority.scenes.find((entry) => entry.sceneId === sceneId);
					const targetGain = fixture.response.anchors.targetGains[sceneId];
					const rendered = compareRgbCodes(scene.rgba, authorityScene.rgba, inputs[fixture.presentation.sceneOrder.indexOf(sceneId)].maskBytes);
					return {
						sceneId,
						targetGain,
						gain: scene.gain,
						binary64GainResidual: Math.abs(scene.gain - targetGain),
						renderedSky: rendered,
						exactRenderedPixelsPreferred: rendered.maximumAbsoluteRgbCodeDifference === 0,
					};
				}),
			}));
		const chronology = responses.map((response) => ({
			responseId: response.responseId,
			regions: fixture.diagnostics.chronologyRegions.map((region) => {
				const values = response.scenes.map((scene) => scene.regions.find(({regionId}) => regionId === region.id).medianDisplayLuminance);
				return {regionId: region.id, values, strictlyDecreasing: values.every((value, index) => index === 0 || value < values[index - 1])};
			}),
		}));
		for (const record of chronology) record.allStrictlyDecreasing = record.regions.every(({strictlyDecreasing}) => strictlyDecreasing);
		const terminalErrors = drainWebglErrors(gpu.context);
		return {
			schemaId: 'algorithm32-color-reset-cr4i-smooth-bruneton-shoulder-check-browser-result-v1',
			renderComplete: true,
			integrityGateEvaluated: false,
			scientificGateEvaluated: false,
			appearanceAccepted: false,
			automaticCandidateSelection: false,
			productionClaim: false,
			responseModelId: CR4I_ANCHOR_PRESERVING_SHOULDER_RESPONSE_ID,
			sceneOrder: fixture.presentation.sceneOrder,
			responseOrder: fixture.presentation.responseOrder,
			scenes: inputs.map(({spec, rawRegions, evidence}) => ({...spec, rawRegions, evidence})),
			responses: responses.map(({model, scenes, ...response}) => ({
				...response,
				modelId: model.id,
				scenes: scenes.map(({rgba, canvas, ...scene}) => scene),
			})),
			chronology,
			responseProofs: proofs,
			anchorComparisons,
			publicationComparison: publication,
			gpu: {
				...gpu.facts,
				programCount: gpu.programs.size,
				terminalErrors,
				errors: [...gpu.facts.startupErrors, ...responses.flatMap(({scenes}) => scenes.flatMap(({gpu: sceneGpu}) => sceneGpu.errors)), ...terminalErrors],
				contextLost: gpu.context.isContextLost(),
			},
			requestedImageCount: fixture.outputs.requestedImageUploadOrder.length,
			uploadedImageCount: uploadedImages.length,
			allDeclaredImagesUploaded: uploadedImages.length === fixture.outputs.requestedImageUploadOrder.length,
			imageUploadOrder,
			uploadedImages,
			panelIdentities,
			imageDerivations,
		};
	} finally {
		for (const response of responses) {
			for (const scene of response.scenes) scene.canvas?.remove();
		}
		disposeGpuReplay(gpu);
	}
}
