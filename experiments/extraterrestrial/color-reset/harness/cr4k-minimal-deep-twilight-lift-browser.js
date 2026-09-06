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

async function decodePng(bytes, expectedWidth, expectedHeight, label) {
	const bitmap = await createImageBitmap(new Blob([bytes], {type: 'image/png'}), {
		colorSpaceConversion: 'none',
		premultiplyAlpha: 'none',
	});
	try {
		requireCondition(
			bitmap.width === expectedWidth && bitmap.height === expectedHeight,
			`${label} dimensions changed.`,
		);
		const canvas = document.createElement('canvas');
		canvas.width = expectedWidth;
		canvas.height = expectedHeight;
		const context = canvas.getContext('2d', {alpha: true, willReadFrequently: true, colorSpace: 'srgb'});
		requireCondition(context, `${label} could not be decoded.`);
		context.imageSmoothingEnabled = false;
		context.drawImage(bitmap, 0, 0);
		const rgba = new Uint8ClampedArray(context.getImageData(0, 0, expectedWidth, expectedHeight).data);
		canvas.remove();
		return rgba;
	} finally {
		bitmap.close();
	}
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
		model: new Cr4iAnchorPreservingShoulderColorDisplayModel({curve: row}),
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

function compareEmbeddedRgba(output, outputWidth, source, sourceWidth, sourceHeight, x, y) {
	let differingChannelCount = 0;
	let maximumAbsoluteChannelDifference = 0;
	for (let sourceY = 0; sourceY < sourceHeight; sourceY += 1) {
		for (let sourceX = 0; sourceX < sourceWidth; sourceX += 1) {
			const sourceOffset = (sourceY * sourceWidth + sourceX) * 4;
			const outputOffset = ((y + sourceY) * outputWidth + x + sourceX) * 4;
			for (let channel = 0; channel < 4; channel += 1) {
				const difference = Math.abs(output[outputOffset + channel] - source[sourceOffset + channel]);
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
		fixture.schemaId === 'algorithm32-color-reset-cr4k-minimal-deep-twilight-lift-input-v1',
		'CR4K fixture schema changed.',
	);
	requireCondition(!JSON.stringify(fixture).includes('PENDING_'), 'CR4K fixture contains unresolved pins.');
	requireCondition(fixture.viewport?.widthPixels === 640 && fixture.viewport?.heightPixels === 400, 'CR4K viewport changed.');
	requireCondition(fixture.scenes?.length === 12, 'CR4K requires twelve scenes.');
	requireCondition(
		JSON.stringify(fixture.scenes.map(({id}) => id)) === JSON.stringify(fixture.presentation?.sceneOrder),
		'CR4K scene order changed.',
	);
	requireCondition(fixture.response?.rows?.length === 3, 'CR4K requires three response rows.');
	requireCondition(
		JSON.stringify(fixture.response.rows.map(({id}) => id)) === JSON.stringify(fixture.presentation?.responseOrder),
		'CR4K response order changed.',
	);
	for (const scene of fixture.scenes) {
		requireCondition(
			['/cr1/', '/cr4h/', '/cr4f/'].includes(scene.sourcePrefix) &&
			Number.isFinite(scene.solarElevationDegrees) && Number.isFinite(scene.solarZenithDegrees) &&
			scene.totalHorizontalIlluminance?.units === 'lux' &&
			Number.isFinite(scene.totalHorizontalIlluminance.value) && scene.totalHorizontalIlluminance.value >= 0 &&
			scene.controlPng?.path?.startsWith('captures/cr4i-slope-078-p9-control-') &&
			Number.isSafeInteger(scene.controlPng.byteLength) && /^[0-9a-f]{64}$/u.test(scene.controlPng.sha256),
			`CR4K scene declaration changed for ${scene.id}.`,
		);
	}
	const expected = [
		...fixture.presentation.responseOrder.flatMap((id) => fixture.outputs.frames[id]),
		...fixture.presentation.responseOrder.map((id) => fixture.outputs.cadences[id]),
		fixture.outputs.twilightComparison,
		fixture.outputs.amplifiedDifferences,
		fixture.outputs.clippingMasks,
		fixture.outputs.diagnostic,
	];
	requireCondition(
		expected.length === 43 && new Set(expected).size === 43 &&
		JSON.stringify(expected) === JSON.stringify(fixture.outputs.requestedImageUploadOrder),
		'CR4K requires exactly 43 frame-first images.',
	);
	requireCondition(fixture.presentation.twilightComparisonSceneIds?.length === 6, 'CR4K requires six twilight comparison scenes.');
	const [control, restrained, brighter] = fixture.response.rows;
	requireCondition(
		control.id === 'slope-078-p9-control' && control.adaptationPivotIlluminanceLux === 385 &&
		restrained.id === 'deep-lift-015' && restrained.adaptationPivotIlluminanceLux === 439.8971145541154 &&
		brighter.id === 'deep-lift-030' && brighter.adaptationPivotIlluminanceLux === 502.62200361827666,
		'CR4K pivot bracket changed.',
	);
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
	const layout = fixture.presentation.cadenceLayout;
	const padding = layout.outerPaddingPixels;
	const headingHeight = layout.titleHeightPixels;
	const labelHeight = layout.panelLabelHeightPixels;
	const sourceWidth = fixture.viewport.widthPixels;
	const sourceHeight = fixture.viewport.heightPixels;
	const width = padding * 2 + layout.columnCount * sourceWidth + (layout.columnCount - 1) * layout.columnGapPixels;
	const height = padding * 2 + headingHeight + layout.rowCount * (labelHeight + sourceHeight) + (layout.rowCount - 1) * layout.rowGapPixels;
	requireCondition(width === layout.expectedWidthPixels && height === layout.expectedHeightPixels, 'CR4K cadence dimensions changed.');
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: false, willReadFrequently: true});
	context.imageSmoothingEnabled = false;
	context.fillStyle = fixture.presentation.backgroundCss;
	context.fillRect(0, 0, width, height);
	context.fillStyle = fixture.presentation.headingCss;
	context.font = 'bold 22px sans-serif';
	context.fillText(`CR4K cadence - ${response.label}`, padding, padding + 22);
	context.fillStyle = fixture.presentation.secondaryCss;
	context.font = '12px sans-serif';
	context.fillText('Exact immutable fields; native 640 x 400 panels; one global achromatic response.', padding, padding + 46);
	for (const [index, scene] of response.scenes.entries()) {
		const row = Math.floor(index / layout.columnCount);
		const column = index % layout.columnCount;
		const x = padding + column * (sourceWidth + layout.columnGapPixels);
		const labelY = padding + headingHeight + row * (labelHeight + sourceHeight + layout.rowGapPixels);
		const y = labelY + labelHeight;
		const whole = scene.regions.find(({regionId}) => regionId === 'whole-sky');
		context.fillStyle = fixture.presentation.headingCss;
		context.font = 'bold 12px sans-serif';
		context.fillText(scene.label, x, labelY + 13, sourceWidth);
		context.fillStyle = fixture.presentation.secondaryCss;
		context.font = '10px monospace';
		context.fillText(`Sun ${scene.solarElevationDegrees.toFixed(2)} deg | E ${formatNumber(scene.totalHorizontalIlluminance.value, 5)} lx | median ${formatNumber(whole.medianDisplayLuminance, 4)}`, x, labelY + 28, sourceWidth);
		context.putImageData(new ImageData(scene.rgba, sourceWidth, sourceHeight), x, y);
	}
	return canvas;
}

function drawMainDecisionPlate(fixture, responses) {
	const sceneIds = fixture.presentation.twilightComparisonSceneIds;
	const panelWidth = fixture.viewport.widthPixels;
	const panelHeight = fixture.viewport.heightPixels;
	const padding = 20;
	const columnGap = 12;
	const rowGap = 18;
	const headingHeight = 72;
	const rowLabelHeight = 34;
	const width = padding * 2 + sceneIds.length * panelWidth + (sceneIds.length - 1) * columnGap;
	const height = padding * 2 + headingHeight + responses.length * (rowLabelHeight + panelHeight) + (responses.length - 1) * rowGap;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: false, willReadFrequently: true});
	context.imageSmoothingEnabled = false;
	context.fillStyle = fixture.presentation.backgroundCss;
	context.fillRect(0, 0, width, height);
	context.fillStyle = fixture.presentation.headingCss;
	context.font = 'bold 24px sans-serif';
	context.fillText('CR4K sunset-through-nautical comparison', padding, padding + 24);
	context.fillStyle = fixture.presentation.secondaryCss;
	context.font = '13px sans-serif';
	context.fillText('Rows differ only in adaptation pivot; columns run sunset, +10, +20, +30, +45, +60 minutes.', padding, padding + 50);
	for (const [responseIndex, response] of responses.entries()) {
		const labelY = padding + headingHeight + responseIndex * (rowLabelHeight + panelHeight + rowGap);
		const y = labelY + rowLabelHeight;
		context.fillStyle = response.colorCss;
		context.font = 'bold 14px sans-serif';
		context.fillText(response.label, padding, labelY + 20);
		for (const [sceneIndex, sceneId] of sceneIds.entries()) {
			const scene = response.scenes.find((entry) => entry.sceneId === sceneId);
			const x = padding + sceneIndex * (panelWidth + columnGap);
			context.putImageData(new ImageData(scene.rgba, panelWidth, panelHeight), x, y);
		}
	}
	return canvas;
}

function drawAmplifiedDifferencePlate(fixture, responses) {
	const control = responses[0];
	const candidates = responses.slice(1);
	const sceneIds = fixture.presentation.twilightComparisonSceneIds;
	const panelWidth = fixture.viewport.widthPixels;
	const panelHeight = fixture.viewport.heightPixels;
	const padding = 20;
	const gap = 12;
	const heading = 70;
	const label = 32;
	const rowGap = 18;
	const canvas = document.createElement('canvas');
	canvas.width = padding * 2 + sceneIds.length * panelWidth + (sceneIds.length - 1) * gap;
	canvas.height = padding * 2 + heading + candidates.length * (label + panelHeight) + (candidates.length - 1) * rowGap;
	const context = canvas.getContext('2d', {alpha: false});
	context.fillStyle = fixture.presentation.backgroundCss;
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = fixture.presentation.headingCss;
	context.font = 'bold 23px sans-serif';
	context.fillText(`CR4K candidate minus control | absolute RGB difference x${fixture.presentation.differenceAmplification}`, padding, padding + 24);
	context.fillStyle = fixture.presentation.secondaryCss;
	context.font = '12px sans-serif';
	context.fillText('Black means encoded equality; differences are diagnostic amplification only.', padding, padding + 48);
	for (const [row, candidate] of candidates.entries()) {
		const labelY = padding + heading + row * (label + panelHeight + rowGap);
		context.fillStyle = candidate.colorCss;
		context.font = 'bold 14px sans-serif';
		context.fillText(candidate.label, padding, labelY + 20);
		for (const [column, sceneId] of sceneIds.entries()) {
			const source = control.scenes.find((scene) => scene.sceneId === sceneId).rgba;
			const target = candidate.scenes.find((scene) => scene.sceneId === sceneId).rgba;
			const rgba = new Uint8ClampedArray(source.length);
			for (let offset = 0; offset < rgba.length; offset += 4) {
				for (let channel = 0; channel < 3; channel += 1) rgba[offset + channel] = Math.min(255, Math.abs(target[offset + channel] - source[offset + channel]) * fixture.presentation.differenceAmplification);
				rgba[offset + 3] = 255;
			}
			const x = padding + column * (panelWidth + gap);
			const y = labelY + label;
			context.putImageData(new ImageData(rgba, panelWidth, panelHeight), x, y);
		}
	}
	return canvas;
}

function drawClippingMaskPlate(fixture, responses, inputs) {
	const sceneIds = fixture.presentation.twilightComparisonSceneIds;
	const panelWidth = fixture.viewport.widthPixels;
	const panelHeight = fixture.viewport.heightPixels;
	const padding = 20;
	const gap = 12;
	const heading = 70;
	const label = 32;
	const rowGap = 18;
	const canvas = document.createElement('canvas');
	canvas.width = padding * 2 + sceneIds.length * panelWidth + (sceneIds.length - 1) * gap;
	canvas.height = padding * 2 + heading + responses.length * (label + panelHeight) + (responses.length - 1) * rowGap;
	const context = canvas.getContext('2d', {alpha: false});
	context.fillStyle = fixture.presentation.backgroundCss;
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = fixture.presentation.headingCss;
	context.font = 'bold 23px sans-serif';
	context.fillText('CR4K twilight clipping masks', padding, padding + 24);
	context.fillStyle = fixture.presentation.secondaryCss;
	context.font = '12px sans-serif';
	context.fillText('Cyan = exact black sky; yellow = saturated sky; dark gray = unclipped sky; black = geometry.', padding, padding + 48);
	for (const [row, response] of responses.entries()) {
		const labelY = padding + heading + row * (label + panelHeight + rowGap);
		context.fillStyle = response.colorCss;
		context.font = 'bold 14px sans-serif';
		context.fillText(response.label, padding, labelY + 20);
		for (const [column, sceneId] of sceneIds.entries()) {
			const scene = response.scenes.find((entry) => entry.sceneId === sceneId);
			const input = inputs.find(({spec}) => spec.id === sceneId);
			const rgba = new Uint8ClampedArray(scene.rgba.length);
			for (let pixel = 0; pixel < input.maskBytes.length; pixel += 1) {
				const offset = pixel * 4;
				if (input.maskBytes[pixel] !== 0) {
					rgba[offset + 3] = 255;
					continue;
				}
				const black = scene.rgba[offset] === 0 && scene.rgba[offset + 1] === 0 && scene.rgba[offset + 2] === 0;
				const saturated = scene.rgba[offset] === 255 || scene.rgba[offset + 1] === 255 || scene.rgba[offset + 2] === 255;
				const color = black ? [0, 210, 255] : saturated ? [255, 220, 0] : [28, 34, 43];
				rgba[offset] = color[0]; rgba[offset + 1] = color[1]; rgba[offset + 2] = color[2]; rgba[offset + 3] = 255;
			}
			const x = padding + column * (panelWidth + gap);
			const y = labelY + label;
			context.putImageData(new ImageData(rgba, panelWidth, panelHeight), x, y);
		}
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
	context.fillText('CR4K response gain and regional-median diagnostics', 44, 38);
	const panels = [
		{x: 85, y: 90, width: 560, height: 300},
		{x: 785, y: 90, width: 560, height: 300},
		{x: 85, y: 500, width: 560, height: 300},
		{x: 785, y: 500, width: 560, height: 300},
	];
	drawAxes(context, panels[0], 'Global gain', 'log10 E (lux)', 'log10 gain');
	drawAxes(context, panels[1], 'Candidate/control gain ratio', 'log10 E (lux)', 'ratio');
	drawAxes(context, panels[2], 'Whole / upper median from sunset', 'minutes after sunset', 'encoded luminance');
	drawAxes(context, panels[3], 'Horizon median from sunset', 'minutes after sunset', 'encoded luminance');
	const logMinimum = Math.log10(fixture.diagnostics.responseProof.minimumIlluminanceLux);
	const logMaximum = Math.log10(fixture.diagnostics.responseProof.maximumDenseIlluminanceLux);
	let maximumLogGain = 1;
	const curveSeries = [];
	const control = responses[0];
	for (const response of responses) {
		const gain = [];
		const ratio = [];
		for (let index = 0; index <= 512; index += 1) {
			const logE = logMinimum + (logMaximum - logMinimum) * index / 512;
			const packet = {value: 10 ** logE, units: 'lux'};
			const value = response.model.displayGain(packet);
			const controlValue = control.model.displayGain(packet);
			gain.push({x: logE, y: Math.log10(value)});
			ratio.push({x: logE, y: value / controlValue});
			maximumLogGain = Math.max(maximumLogGain, Math.log10(value));
		}
		curveSeries.push({response, gain, ratio});
	}
	for (const series of curveSeries) {
		plotLine(context, series.gain, panels[0], {xMinimum: logMinimum, xMaximum: logMaximum, yMinimum: 0, yMaximum: maximumLogGain * 1.05}, series.response.colorCss);
		plotLine(context, series.ratio, panels[1], {xMinimum: logMinimum, xMaximum: logMaximum, yMinimum: 0.98, yMaximum: 1.25}, series.response.colorCss);
	}
	const twilightIds = fixture.presentation.twilightComparisonSceneIds;
	const medianMaximum = Math.max(...responses.flatMap((response) => response.scenes.filter((scene) => twilightIds.includes(scene.sceneId)).flatMap((scene) => scene.regions.map((region) => region.medianDisplayLuminance))));
	for (const response of responses) {
		for (const [regionId, dash] of [['whole-sky', []], ['upper-sky', [5, 4]]]) {
			const points = twilightIds.map((sceneId) => {
				const scene = response.scenes.find((entry) => entry.sceneId === sceneId);
				return {x: scene.offsetMinutes, y: scene.regions.find((region) => region.regionId === regionId).medianDisplayLuminance};
			});
			plotLine(context, points, panels[2], {xMinimum: 0, xMaximum: 60, yMinimum: 0, yMaximum: medianMaximum * 1.05}, response.colorCss, dash);
		}
		const horizon = twilightIds.map((sceneId) => {
			const scene = response.scenes.find((entry) => entry.sceneId === sceneId);
			return {x: scene.offsetMinutes, y: scene.regions.find((region) => region.regionId === 'horizon-band').medianDisplayLuminance};
		});
		plotLine(context, horizon, panels[3], {xMinimum: 0, xMaximum: 60, yMinimum: 0, yMaximum: medianMaximum * 1.05}, response.colorCss);
	}
	let legendX = 100;
	for (const response of responses) {
		context.fillStyle = response.colorCss;
		context.fillRect(legendX, 845, 18, 3);
		context.fillStyle = fixture.presentation.secondaryCss;
		context.font = '11px sans-serif';
		context.fillText(response.label, legendX + 24, 850);
		legendX += 330;
	}
	return canvas;
}

export async function runCr4kMinimalDeepTwilightLiftBrowser() {
	const configurationResponse = await fetch('/browser/configuration.json');
	requireCondition(configurationResponse.ok, 'CR4K configuration fetch failed.');
	const fixture = validateConfiguration(await configurationResponse.json());
	const width = fixture.viewport.widthPixels;
	const height = fixture.viewport.heightPixels;
	const pixelCount = width * height;
	await window.colorResetProgress('parent-input-started');
	const inputs = await Promise.all(fixture.scenes.map(async (scene) => {
		const [fieldInput, maskInput, controlPngInput] = await Promise.all([
			fetchVerifiedBytes(scene.sourcePrefix, scene.field, 'CR4K ' + scene.id + ' field'),
			fetchVerifiedBytes(scene.sourcePrefix, scene.mask, 'CR4K ' + scene.id + ' mask'),
			fetchVerifiedBytes('/cr4i/', scene.controlPng, 'CR4K ' + scene.id + ' CR4I control PNG'),
		]);
		const field = decodeFloat32Le(fieldInput.bytes, pixelCount * 4, 'CR4K ' + scene.id + ' field');
		const maskFacts = validateMask(maskInput.bytes, pixelCount, 'CR4K ' + scene.id + ' mask');
		const controlPngRgba = await decodePng(controlPngInput.bytes, width, height, 'CR4K ' + scene.id + ' CR4I control PNG');
		return {
			spec: scene,
			fieldValues: field.values,
			maskBytes: maskInput.bytes,
			controlPngRgba,
			rawRegions: summarizeRawYRegions(field.values, maskInput.bytes, width, height, fixture.diagnostics.chronologyRegions),
			evidence: {
				field: {...fieldInput.evidence, nonfiniteValueCount: field.nonfiniteValueCount},
				mask: {...maskInput.evidence, ...maskFacts},
				controlPng: controlPngInput.evidence,
			},
		};
	}));
	const responseDefinitions = createResponses(fixture);
	const gpu = await createGpuReplay(width, height, responseDefinitions);
	requireCondition(gpu.facts.maximumTextureSize >= Math.max(width, height), 'CR4K viewport exceeds GPU limits.');
	const responses = responseDefinitions.map((response) => ({...response, scenes: []}));
	const uploadedImages = [];
	const imageUploadOrder = [];
	const panelIdentities = [];
	const imageDerivations = [];
	const cadenceEmbeddings = [];
	const uploadImage = async (artifactPath, canvas, identity, derivation) => {
		const bytes = canvasPngBytes(canvas);
		const upload = await uploadBytes(artifactPath, bytes, 'image/png');
		uploadedImages.push(upload);
		imageUploadOrder.push(artifactPath);
		panelIdentities.push({...identity, artifactPath, byteLength: upload.byteLength, sha256: upload.sha256});
		imageDerivations.push({...derivation, artifactPath, resultSha256: upload.sha256});
		if (imageUploadOrder.length === 1) await window.colorResetProgress('first-image-complete');
		return {upload, bytes};
	};
	try {
		for (const [responseIndex, response] of responses.entries()) {
			for (const [sceneIndex, input] of inputs.entries()) {
				const cpu = renderResponseCpu(response, input.fieldValues, input.spec.totalHorizontalIlluminance);
				const gpuResult = renderResponseGpu(gpu, response, input.fieldValues, width, height, input.spec.totalHorizontalIlluminance);
				const regions = summarizeDisplayRegions(gpuResult.rgbaTopDown, input.maskBytes, width, height, fixture.diagnostics.chronologyRegions);
				const canvas = rgbaCanvas(gpuResult.rgbaTopDown, width, height);
				const freshControl = responses[0].scenes[sceneIndex] ?? null;
				const comparisonRgba = responseIndex === 0 ? input.controlPngRgba : freshControl.rgba;
				const controlDifference =
					compareRgbCodes(gpuResult.rgbaTopDown, comparisonRgba, input.maskBytes);
				const controlDifferenceAll = compareRgbCodes(gpuResult.rgbaTopDown, comparisonRgba);
				const sceneResult = {
					sceneId: input.spec.id,
					label: input.spec.label,
					timeIso: input.spec.timeIso,
					offsetMinutes: input.spec.offsetMinutes,
					solarZenithDegrees: input.spec.solarZenithDegrees,
					solarElevationDegrees: input.spec.solarElevationDegrees,
					totalHorizontalIlluminance: input.spec.totalHorizontalIlluminance,
					gain: cpu.gain,
					gainDerivativePerLux: cpu.derivative,
					gainLogElasticity: cpu.logElasticity,
					positiveGainElasticity: cpu.positiveGainElasticity,
					regions,
					rawRegions: input.rawRegions,
					controlDifference,
					controlDifferenceAll,
					controlComparisonKind: responseIndex === 0 ? 'authenticated CR4I slope-078 PNG' : 'fresh CR4K slope-078 replay',
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
					{panelId: response.responseId + '-' + input.spec.id, role: 'full-resolution CR4K immutable-field replay', responseId: response.responseId, sceneId: input.spec.id},
					{operation: fixture.response.operation, responseId: response.responseId, curve: response.curve, parentId: input.spec.parentId, parentField: input.evidence.field, parentMask: input.evidence.mask, authenticatedControlPng: input.evidence.controlPng, receiverLight: input.spec.totalHorizontalIlluminance, fragmentSourceSha256: gpuResult.fragmentSourceSha256},
				);
			}
		}

		for (const response of responses) {
			const cadence = drawChronologyCanvas(fixture, response);
			const cadenceUpload = await uploadImage(
				fixture.outputs.cadences[response.responseId],
				cadence,
				{panelId: 'cadence-' + response.responseId, role: 'native 6-column by 2-row CR4K cadence', responseId: response.responseId},
				{operation: 'Copy the twelve fresh 640 x 400 replay frames without resampling into the declared six-column cadence.', sourceArtifactPaths: fixture.outputs.frames[response.responseId], imageSmoothing: false},
			);
			const decodedCadence = await decodePng(cadenceUpload.bytes, cadence.width, cadence.height, 'CR4K ' + response.responseId + ' cadence');
			const layout = fixture.presentation.cadenceLayout;
			const embeddings = response.scenes.map((scene, index) => {
				const row = Math.floor(index / layout.columnCount);
				const column = index % layout.columnCount;
				const x = layout.outerPaddingPixels + column * (width + layout.columnGapPixels);
				const y = layout.outerPaddingPixels + layout.titleHeightPixels + row * (layout.panelLabelHeightPixels + height + layout.rowGapPixels) + layout.panelLabelHeightPixels;
				return {sceneId: scene.sceneId, ...compareEmbeddedRgba(decodedCadence, cadence.width, scene.rgba, width, height, x, y)};
			});
			cadenceEmbeddings.push({responseId: response.responseId, artifactPath: fixture.outputs.cadences[response.responseId], embeddings});
			cadence.remove();
		}

		const comparison = drawMainDecisionPlate(fixture, responses);
		await uploadImage(
			fixture.outputs.twilightComparison,
			comparison,
			{panelId: 'sunset-through-plus-60-comparison', role: 'three-response by six-scene owner-review plate'},
			{operation: 'Copy the sunset-through-plus-60 frames without resampling into a three-response comparison matrix.', sourceArtifactPaths: fixture.presentation.responseOrder.flatMap((responseId) => fixture.presentation.twilightComparisonSceneIds.map((sceneId) => fixture.outputs.frames[responseId][fixture.presentation.sceneOrder.indexOf(sceneId)])), appearanceAccepted: false},
		);
		comparison.remove();
		await window.colorResetProgress('decision-plate-complete');

		const differences = drawAmplifiedDifferencePlate(fixture, responses);
		await uploadImage(
			fixture.outputs.amplifiedDifferences,
			differences,
			{panelId: 'amplified-candidate-control-differences', role: 'diagnostic encoded RGB absolute differences'},
			{operation: 'Absolute encoded candidate-minus-control RGB difference multiplied by the declared diagnostic amplification.', amplification: fixture.presentation.differenceAmplification, sourceArtifactPaths: fixture.presentation.responseOrder.flatMap((responseId) => fixture.presentation.twilightComparisonSceneIds.map((sceneId) => fixture.outputs.frames[responseId][fixture.presentation.sceneOrder.indexOf(sceneId)]))},
		);
		differences.remove();

		const clippingMasks = drawClippingMaskPlate(fixture, responses, inputs);
		await uploadImage(
			fixture.outputs.clippingMasks,
			clippingMasks,
			{panelId: 'black-saturation-masks', role: 'twilight clipping diagnostic'},
			{operation: 'Classify authenticated sky-mask pixels as exact encoded black, saturated in any channel, or unclipped.', sceneIds: fixture.presentation.twilightComparisonSceneIds, responseIds: fixture.presentation.responseOrder},
		);
		clippingMasks.remove();

		const diagnostic = drawResponseMetricPlot(fixture, responses);
		await uploadImage(
			fixture.outputs.diagnostic,
			diagnostic,
			{panelId: 'response-gain-regional-medians', role: 'analytic response and sampled chronology diagnostic'},
			{operation: 'Plot analytic gain, candidate/control ratio, and measured whole/upper/horizon encoded medians.', responseIds: fixture.presentation.responseOrder, sceneIds: fixture.presentation.twilightComparisonSceneIds},
		);
		diagnostic.remove();

		requireCondition(
			JSON.stringify(imageUploadOrder) === JSON.stringify(fixture.outputs.requestedImageUploadOrder),
			'CR4K image upload order changed.',
		);

		// All 43 requested images exist above this line. The following facts
		// are consumed by the Node runner's later gate evaluation.
		const responseProofs = responses.map((response) => responseProof(response, fixture));
		const twilightIds = fixture.diagnostics.strictRegionalCadenceSceneIds;
		const chronology = responses.map((response) => ({
			responseId: response.responseId,
			sceneIds: twilightIds,
			regions: fixture.diagnostics.chronologyRegions.map((region) => {
				const values = twilightIds.map((sceneId) => response.scenes.find((scene) => scene.sceneId === sceneId).regions.find((entry) => entry.regionId === region.id).medianDisplayLuminance);
				return {regionId: region.id, values, strictlyDecreasing: values.every((value, index) => index === 0 || value < values[index - 1])};
			}),
		}));
		for (const record of chronology) record.allStrictlyDecreasing = record.regions.every((region) => region.strictlyDecreasing);
		const control = responses[0];
		const zeroPacket = {value: fixture.diagnostics.pivotProof.deepProofIlluminanceLux, units: 'lux'};
		const controlDeepGain = control.model.displayGain(zeroPacket);
		const pivotProofs = responses.map((response) => {
			const expectedPivot = fixture.diagnostics.pivotProof.controlPivotIlluminanceLux * 2 ** (response.curve.intendedDeepLiftStops / response.curve.adaptationExponent);
			const gain = response.model.displayGain(zeroPacket);
			return {
				responseId: response.responseId,
				intendedDeepLiftStops: response.curve.intendedDeepLiftStops,
				declaredPivotIlluminanceLux: response.curve.adaptationPivotIlluminanceLux,
				expectedPivotIlluminanceLux: expectedPivot,
				pivotResidualLux: Math.abs(response.curve.adaptationPivotIlluminanceLux - expectedPivot),
				deepGain: gain,
				deepGainRatioFromControl: gain / controlDeepGain,
				expectedDeepGainRatioFromControl: response.curve.expectedDeepGainRatioFromControl,
				deepGainRatioResidual: Math.abs(gain / controlDeepGain - response.curve.expectedDeepGainRatioFromControl),
				sampledGainRatiosFromControl: response.scenes.map((scene, sceneIndex) => ({
					sceneId: scene.sceneId,
					ratio: scene.gain / control.scenes[sceneIndex].gain,
				})),
			};
		});
		const inheritedJoin = responses.map((response) => {
			const from = response.scenes.find((scene) => scene.sceneId === fixture.diagnostics.reportOnlyInheritedJoin.fromSceneId);
			const to = response.scenes.find((scene) => scene.sceneId === fixture.diagnostics.reportOnlyInheritedJoin.toSceneId);
			return {
				responseId: response.responseId,
				fromSceneId: from.sceneId,
				toSceneId: to.sceneId,
				reportOnly: true,
				regions: fixture.diagnostics.chronologyRegions.map((region) => {
					const fromValue = from.regions.find((entry) => entry.regionId === region.id).medianDisplayLuminance;
					const toValue = to.regions.find((entry) => entry.regionId === region.id).medianDisplayLuminance;
					return {regionId: region.id, fromValue, toValue, fractionalChange: toValue / fromValue - 1};
				}),
			};
		});
		const terminalErrors = drainWebglErrors(gpu.context);
		return {
			schemaId: 'algorithm32-color-reset-cr4k-minimal-deep-twilight-lift-browser-result-v1',
			renderComplete: true,
			integrityGateEvaluated: false,
			scientificGateEvaluated: false,
			appearanceAccepted: false,
			automaticCandidateSelection: false,
			productionClaim: false,
			photographsUsedAsRuntimeInput: false,
			photographsUsedAsQuantitativeOracle: false,
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
			responseProofs,
			pivotProofs,
			inheritedJoin,
			cadenceEmbeddings,
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
