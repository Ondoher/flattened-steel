import {Cr4gSlopeLimitedPreToneExposureColorDisplayModel} from '../color/Cr4gSlopeLimitedPreToneExposureColorDisplayModel.js';
import {ShaderSource} from '../controls/production-v1/src/algorithm32/shader-assembly/base/ShaderSource.js';
import {
	CR6C_BASE_BOUNDARY_SCALE,
	CR6C_ONE_PIXEL_BRIGHTNESS_CALIBRATION_ID,
	acceptCr6cBrightnessMultiplier,
	composeCr6cLinearRgb,
} from '../stellar/Cr6cOnePixelBrightnessCalibrationV2.js';
import {
	VIEW_PRESENTATION_FILTER_REGISTRY_ID,
	acceptViewPresentationFilterConfiguration,
	applySourceLinearViewPresentationFilters,
} from '../stellar/ViewPresentationFilterRegistry.js';
import {
	HUMAN_LOW_LIGHT_CHROMA_FILTER,
	HUMAN_LOW_LIGHT_CHROMA_FILTER_ID,
	combinedVisualMagnitude,
	humanLowLightChromaRetention,
	humanLowLightLinearLuminance,
} from '../stellar/HumanLowLightChromaFilter.js';

const RESULT_SCHEMA_ID =
	'algorithm32-color-reset-cr6d-toggleable-low-light-stellar-chroma-browser-result-v1';
const FIXTURE_SCHEMA_ID =
	'algorithm32-color-reset-cr6d-toggleable-low-light-stellar-chroma-input-v1';
const SELECTED_BRIGHTNESS_MULTIPLIER = 24;
const FILTER_IMPLEMENTATIONS = new Map([
	[HUMAN_LOW_LIGHT_CHROMA_FILTER_ID, HUMAN_LOW_LIGHT_CHROMA_FILTER],
]);
const RGB_WEIGHTS = Object.freeze([0.2126, 0.7152, 0.0722]);
const PANEL_WIDTH = 640;
const PANEL_HEIGHT = 400;
const SCENE_COUNT = 8;
const ROW_COUNT = 3;

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function exactJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}

function median(values) {
	if (values.length === 0) return null;
	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 1
		? sorted[middle]
		: (sorted[middle - 1] + sorted[middle]) / 2;
}

function encodedLuminance(rgb) {
	return RGB_WEIGHTS.reduce((sum, weight, channel) => sum + weight * rgb[channel], 0);
}

function pearsonCorrelation(records) {
	if (records.length < 3) return null;
	const meanX = records.reduce((sum, record) => sum + record.sourceColorAxis, 0) / records.length;
	const meanY = records.reduce((sum, record) => sum + record.displayColorAxis, 0) / records.length;
	let covariance = 0;
	let varianceX = 0;
	let varianceY = 0;
	for (const record of records) {
		const dx = record.sourceColorAxis - meanX;
		const dy = record.displayColorAxis - meanY;
		covariance += dx * dy;
		varianceX += dx * dx;
		varianceY += dy * dy;
	}
	if (varianceX === 0 || varianceY === 0) return null;
	return covariance / Math.sqrt(varianceX * varianceY);
}

function dataUrlBytes(dataUrl) {
	const marker = ';base64,';
	const markerIndex = dataUrl.indexOf(marker);
	requireCondition(markerIndex >= 0, 'CR6D PNG data URL is not base64 encoded.');
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

async function uploadBytes(artifactPath, bytes, contentType) {
	const response = await fetch('/artifact/' + artifactPath, {
		method: 'POST',
		headers: {'content-type': contentType},
		body: bytes,
	});
	requireCondition(response.ok, `CR6D artifact upload failed for ${artifactPath}: HTTP ${response.status}.`);
	return {
		artifactPath,
		byteLength: bytes.byteLength,
		sha256: await sha256Hex(bytes),
		contentType,
	};
}

async function uploadJson(artifactPath, value) {
	const bytes = new TextEncoder().encode(JSON.stringify(value, null, 2) + '\n');
	return uploadBytes(artifactPath, bytes, 'application/json');
}

function rgbaCanvas(rgba, width = PANEL_WIDTH, height = PANEL_HEIGHT) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: true, colorSpace: 'srgb'});
	requireCondition(context, 'CR6D could not allocate an RGBA canvas.');
	context.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0);
	return canvas;
}

function canvasPngBytes(canvas) {
	return dataUrlBytes(canvas.toDataURL('image/png'));
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
			schemaId: declaration.schemaId,
			byteLength: bytes.byteLength,
			sha256,
			verified: true,
		},
	};
}

async function fetchVerifiedJson(prefix, declaration, label) {
	const fetched = await fetchVerifiedBytes(prefix, declaration, label);
	return {...fetched, value: JSON.parse(new TextDecoder().decode(fetched.bytes))};
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
		const context = canvas.getContext('2d', {
			alpha: true,
			willReadFrequently: true,
			colorSpace: 'srgb',
		});
		requireCondition(context, `CR6D could not decode ${label}.`);
		context.imageSmoothingEnabled = false;
		context.drawImage(bitmap, 0, 0);
		const rgba = new Uint8ClampedArray(context.getImageData(0, 0, width, height).data);
		canvas.remove();
		return rgba;
	} finally {
		bitmap.close();
	}
}

function flipRows(values, width, height, components = 4) {
	const result = new values.constructor(values.length);
	const rowLength = width * components;
	for (let y = 0; y < height; y += 1) {
		const sourceOffset = (height - 1 - y) * rowLength;
		result.set(values.subarray(sourceOffset, sourceOffset + rowLength), y * rowLength);
	}
	return result;
}

function drainWebglErrors(context) {
	const errors = [];
	for (let index = 0; index < 32; index += 1) {
		const error = context.getError();
		if (error === context.NO_ERROR) return errors;
		errors.push(error);
	}
	throw new Error('CR6D WebGL error drain exceeded 32 entries.');
}

function compileShader(context, type, source, label) {
	const shader = context.createShader(type);
	requireCondition(shader, `CR6D could not allocate ${label}.`);
	context.shaderSource(shader, source);
	context.compileShader(shader);
	if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
		const log = context.getShaderInfoLog(shader);
		context.deleteShader(shader);
		throw new Error(`CR6D ${label} compilation failed: ${log}`);
	}
	return shader;
}

function configureFloatTexture(context, texture) {
	context.bindTexture(context.TEXTURE_2D, texture);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
	context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
}

function createGpuReplay(displayModel, width, height) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		premultipliedAlpha: false,
		preserveDrawingBuffer: false,
	});
	requireCondition(context, 'CR6D requires WebGL2.');
	const colorBufferFloat = context.getExtension('EXT_color_buffer_float');
	requireCondition(colorBufferFloat, 'CR6D requires EXT_color_buffer_float.');
	const debugRendererInfo = context.getExtension('WEBGL_debug_renderer_info');
	const renderer = debugRendererInfo
		? context.getParameter(debugRendererInfo.UNMASKED_RENDERER_WEBGL)
		: context.getParameter(context.RENDERER);
	const version = context.getParameter(context.VERSION);
	const curve = displayModel.curve;
	const vertex = compileShader(context, context.VERTEX_SHADER, `#version 300 es
precision highp float;
void main() {
	vec2 position = gl_VertexID == 0 ? vec2(-1.0, -1.0)
		: (gl_VertexID == 1 ? vec2(3.0, -1.0) : vec2(-1.0, 3.0));
	gl_Position = vec4(position, 0.0, 1.0);
}`, 'presentation replay vertex shader');
	const fragment = compileShader(context, context.FRAGMENT_SHADER, `#version 300 es
precision highp float;
uniform sampler2D uSkyLinearRgbY;
uniform sampler2D uTransportedStarLinearRgb;
uniform float uPresentationMultiplier;
uniform float uIlluminanceLux;
out vec4 outColor;
float hill(float E) {
	float ratio = max(E, 0.0) / ${ShaderSource.formatFloat(curve.sunsetTransitionIlluminanceLux)};
	return ${ShaderSource.formatFloat(curve.sunsetAmplitude)} /
		(1.0 + pow(ratio, ${ShaderSource.formatFloat(curve.sunsetRolloffPower)}));
}
float softplus(float value) {
	return max(value, 0.0) + log(1.0 + exp(-abs(value)));
}
float gain(float E) {
	float e = max(E, 0.0);
	float base = 1.0 + hill(e);
	float ratio = log(${ShaderSource.formatFloat(curve.adaptationPivotIlluminanceLux)} /
		(e + ${ShaderSource.formatFloat(curve.adaptationFloorIlluminanceLux)}));
	float softened = ${ShaderSource.formatFloat(curve.adaptationSoftnessLogUnits)} *
		softplus(ratio / ${ShaderSource.formatFloat(curve.adaptationSoftnessLogUnits)});
	return base * exp(${ShaderSource.formatFloat(curve.adaptationExponent)} * softened);
}
void main() {
	ivec2 pixel = ivec2(gl_FragCoord.xy);
	vec3 sky = texelFetch(uSkyLinearRgbY, pixel, 0).rgb;
	vec3 star = texelFetch(uTransportedStarLinearRgb, pixel, 0).rgb;
	vec3 exposed = (sky + uPresentationMultiplier * star) * gain(uIlluminanceLux);
	outColor = vec4(clamp(
		vec3(1.0) - exp(-max(exposed, vec3(0.0)) *
			${ShaderSource.formatFloat(displayModel.displayConstants.paperFigure1ToneMapK)}),
		vec3(0.0),
		vec3(1.0)
	), 1.0);
}`, 'presentation replay fragment shader');
	const program = context.createProgram();
	requireCondition(program, 'CR6D could not allocate the presentation replay program.');
	context.attachShader(program, vertex);
	context.attachShader(program, fragment);
	context.linkProgram(program);
	context.deleteShader(vertex);
	context.deleteShader(fragment);
	if (!context.getProgramParameter(program, context.LINK_STATUS)) {
		const log = context.getProgramInfoLog(program);
		context.deleteProgram(program);
		throw new Error(`CR6D presentation replay link failed: ${log}`);
	}
	const skyTexture = context.createTexture();
	const starTexture = context.createTexture();
	const outputTexture = context.createTexture();
	const framebuffer = context.createFramebuffer();
	const vertexArray = context.createVertexArray();
	requireCondition(
		skyTexture && starTexture && outputTexture && framebuffer && vertexArray,
		'CR6D GPU replay allocation failed.',
	);
	configureFloatTexture(context, skyTexture);
	configureFloatTexture(context, starTexture);
	configureFloatTexture(context, outputTexture);
	context.texImage2D(
		context.TEXTURE_2D,
		0,
		context.RGBA32F,
		width,
		height,
		0,
		context.RGBA,
		context.FLOAT,
		null,
	);
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
		'CR6D RGBA32F replay framebuffer is incomplete.',
	);
	context.bindFramebuffer(context.FRAMEBUFFER, null);
	return {
		canvas,
		context,
		program,
		skyTexture,
		starTexture,
		outputTexture,
		framebuffer,
		vertexArray,
		width,
		height,
		framebufferStatus,
		software: {
			api: version,
			renderer,
			d3d11: /D3D11/iu.test(renderer),
			extColorBufferFloat: true,
		},
	};
}

function uploadFloatTexture(replay, texture, topDownValues) {
	const {context, width, height} = replay;
	const bottomUp = flipRows(topDownValues, width, height);
	context.bindTexture(context.TEXTURE_2D, texture);
	context.pixelStorei(context.UNPACK_ALIGNMENT, 1);
	context.texImage2D(
		context.TEXTURE_2D,
		0,
		context.RGBA32F,
		width,
		height,
		0,
		context.RGBA,
		context.FLOAT,
		bottomUp,
	);
}

function renderGpuReplay(replay, skyLinearRgbY, starLinearRgb, illuminanceLux, multiplier) {
	const {context, width, height} = replay;
	uploadFloatTexture(replay, replay.skyTexture, skyLinearRgbY);
	uploadFloatTexture(replay, replay.starTexture, starLinearRgb);
	context.bindFramebuffer(context.FRAMEBUFFER, replay.framebuffer);
	context.viewport(0, 0, width, height);
	context.disable(context.BLEND);
	context.disable(context.DEPTH_TEST);
	context.disable(context.CULL_FACE);
	context.useProgram(replay.program);
	context.bindVertexArray(replay.vertexArray);
	context.activeTexture(context.TEXTURE0);
	context.bindTexture(context.TEXTURE_2D, replay.skyTexture);
	context.uniform1i(context.getUniformLocation(replay.program, 'uSkyLinearRgbY'), 0);
	context.activeTexture(context.TEXTURE1);
	context.bindTexture(context.TEXTURE_2D, replay.starTexture);
	context.uniform1i(context.getUniformLocation(replay.program, 'uTransportedStarLinearRgb'), 1);
	context.uniform1f(
		context.getUniformLocation(replay.program, 'uPresentationMultiplier'),
		acceptCr6cBrightnessMultiplier(multiplier),
	);
	context.uniform1f(context.getUniformLocation(replay.program, 'uIlluminanceLux'), illuminanceLux);
	context.drawArrays(context.TRIANGLES, 0, 3);
	const bottomUp = new Float32Array(width * height * 4);
	context.readPixels(0, 0, width, height, context.RGBA, context.FLOAT, bottomUp);
	const floatTopDown = flipRows(bottomUp, width, height);
	const rgba = new Uint8ClampedArray(width * height * 4);
	let nonfiniteValueCount = 0;
	for (let index = 0; index < floatTopDown.length; index += 1) {
		const value = floatTopDown[index];
		if (!Number.isFinite(value)) nonfiniteValueCount += 1;
		rgba[index] = index % 4 === 3 ? 255 : Math.round(clamp(value, 0, 1) * 255);
	}
	context.bindVertexArray(null);
	context.bindFramebuffer(context.FRAMEBUFFER, null);
	return {
		rgba,
		floatTopDown,
		nonfiniteValueCount,
		webglErrors: drainWebglErrors(context),
	};
}

function disposeGpuReplay(replay) {
	const context = replay.context;
	context.deleteVertexArray(replay.vertexArray);
	context.deleteTexture(replay.skyTexture);
	context.deleteTexture(replay.starTexture);
	context.deleteTexture(replay.outputTexture);
	context.deleteFramebuffer(replay.framebuffer);
	context.deleteProgram(replay.program);
	replay.canvas.remove();
}

function cpuReplay(displayModel, skyLinearRgbY, starLinearRgb, illuminanceLux, multiplier) {
	const q = acceptCr6cBrightnessMultiplier(multiplier);
	const gain = displayModel.displayGain({value: illuminanceLux, units: 'lux'});
	const toneMapK = displayModel.displayConstants.paperFigure1ToneMapK;
	const rgba = new Uint8ClampedArray(skyLinearRgbY.length);
	let nonfiniteValueCount = 0;
	for (let pixel = 0; pixel < skyLinearRgbY.length / 4; pixel += 1) {
		const offset = pixel * 4;
		const linear = composeCr6cLinearRgb(
			skyLinearRgbY.subarray(offset, offset + 3),
			starLinearRgb.subarray(offset, offset + 3),
			q,
		);
		for (let channel = 0; channel < 3; channel += 1) {
			const value = 1 - Math.exp(-Math.max(linear[channel] * gain, 0) * toneMapK);
			if (!Number.isFinite(value)) nonfiniteValueCount += 1;
			rgba[offset + channel] = Math.round(clamp(value, 0, 1) * 255);
		}
		rgba[offset + 3] = 255;
	}
	return {rgba, gain, nonfiniteValueCount};
}

function compareRgbCodes(actual, expected) {
	requireCondition(actual.length === expected.length, 'CR6D RGB comparison lengths differ.');
	let maximumRgbCodeDifference = 0;
	let squaredDifferenceSum = 0;
	let differingChannelCount = 0;
	let comparedChannelCount = 0;
	for (let index = 0; index < actual.length; index += 4) {
		for (let channel = 0; channel < 3; channel += 1) {
			const difference = Math.abs(actual[index + channel] - expected[index + channel]);
			maximumRgbCodeDifference = Math.max(maximumRgbCodeDifference, difference);
			if (difference !== 0) differingChannelCount += 1;
			squaredDifferenceSum += difference * difference;
			comparedChannelCount += 1;
		}
	}
	return {
		maximumRgbCodeDifference,
		rmse: Math.sqrt(squaredDifferenceSum / comparedChannelCount),
		differingChannelCount,
		comparedChannelCount,
	};
}

function expectedCurve(configuration) {
	const source = configuration.frozenSkyDisplay;
	return {
		id: source.id,
		sunsetAmplitude: source.sunsetAmplitude,
		sunsetTransitionIlluminanceLux: source.sunsetTransitionIlluminanceLux,
		sunsetRolloffPower: source.sunsetRolloffPower,
		adaptationPivotIlluminanceLux: source.adaptationPivotIlluminanceLux,
		adaptationFloorIlluminanceLux: source.adaptationFloorIlluminanceLux,
		adaptationSoftnessLogUnits: source.adaptationSoftnessLogUnits,
		adaptationExponent: source.adaptationExponent,
	};
}

function rowFilterConfiguration(row) {
	return {
		schemaId: VIEW_PRESENTATION_FILTER_REGISTRY_ID,
		filters: [row.filter],
	};
}

function validateConfiguration(configuration) {
	requireCondition(configuration.schemaId === FIXTURE_SCHEMA_ID, 'CR6D fixture schema changed.');
	requireCondition(
		configuration.viewport.widthPixels === PANEL_WIDTH &&
			configuration.viewport.heightPixels === PANEL_HEIGHT &&
			configuration.viewport.pixelCount === PANEL_WIDTH * PANEL_HEIGHT,
		'CR6D viewport changed.',
	);
	requireCondition(configuration.scenes.length === SCENE_COUNT, 'CR6D scene count changed.');
	requireCondition(
		configuration.experiment?.increment === 'CR6D' &&
			configuration.experiment.slug === 'cr6d-toggleable-low-light-stellar-chroma',
		'CR6D experiment identity changed.',
	);
	requireCondition(configuration.rows.length === ROW_COUNT, 'CR6D row count changed.');
	requireCondition(
		exactJson(configuration.rows.map(({id}) => id), [
			'physical-control',
			'moderate-065',
			'strong-040',
		]) && configuration.rows.every(({multiplier}) => multiplier === SELECTED_BRIGHTNESS_MULTIPLIER),
		'CR6D row or multiplier order changed.',
	);
	for (const row of configuration.rows) {
		requireCondition(
			row.effectiveBoundaryScale === configuration.presentation.effectiveBoundaryScale,
			`CR6D ${row.id} effective boundary scale changed.`,
		);
		acceptViewPresentationFilterConfiguration(rowFilterConfiguration(row), FILTER_IMPLEMENTATIONS);
	}
	requireCondition(
		configuration.presentation.registryId === VIEW_PRESENTATION_FILTER_REGISTRY_ID &&
			configuration.presentation.filterId === HUMAN_LOW_LIGHT_CHROMA_FILTER_ID &&
			configuration.presentation.brightnessMultiplier === SELECTED_BRIGHTNESS_MULTIPLIER &&
			configuration.presentation.effectiveBoundaryScale ===
				CR6C_BASE_BOUNDARY_SCALE * SELECTED_BRIGHTNESS_MULTIPLIER,
		'CR6D presentation owner or claim boundary changed.',
	);
	requireCondition(
		configuration.parent.runId === '000044-cr6-stellar-contrast-onset' &&
			configuration.parent.conclusion === 'rejected' &&
			configuration.parent.independentlyVerified === true,
		'CR6D parent authority changed.',
	);
	requireCondition(
		configuration.selectedBrightnessParent?.runId ===
			'000049-cr6c-one-pixel-brightness-calibration-narrowed' &&
			configuration.catalogParent?.runId === '000047-cr6b-brightest-2000-catalog-proof',
		'CR6D selected brightness or catalog parent changed.',
	);
	requireCondition(
		configuration.replayOracle?.parentFinalCompositeAuthorship.includes('CPU-authored') &&
			typeof configuration.replayOracle.cpuQ1Control === 'string' &&
			typeof configuration.replayOracle.gpuQ1Parity === 'string',
		'CR6D replay-oracle declaration changed.',
	);
	requireCondition(
		configuration.outputs.requestedImageUploadOrder.length === 30,
		'CR6D must declare exactly 30 images.',
	);
	const expectedPanelPaths = configuration.rows.flatMap((row) =>
		configuration.scenes.map((scene) =>
			`captures/cr6d-${row.id}-${scene.id}-final-composite.png`),
	);
	const expectedFigurePaths = [
		...configuration.rows.map((row) => `figures/cr6d-${row.id}-cadence.png`),
		'figures/cr6d-complete-decision-matrix.png',
		'figures/cr6d-magnitude-chroma-retention.png',
		'figures/cr6d-fixed-member-luminance-chroma.png',
	];
	requireCondition(
		exactJson(
			configuration.outputs.requestedImageUploadOrder,
			[...expectedPanelPaths, ...expectedFigurePaths],
		),
		'CR6D requested image order changed.',
	);
	requireCondition(
		Date.parse(configuration.scenes[6].timeIso) - Date.parse(configuration.scenes[5].timeIso) === 1,
		'CR6D transition timestamps are no longer consecutive milliseconds.',
	);
	return configuration;
}

function float32FromBytes(bytes, expectedLength, label) {
	requireCondition(bytes.byteLength === expectedLength * 4, `${label} float byte length changed.`);
	const values = new Float32Array(
		bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
	);
	requireCondition(values.length === expectedLength, `${label} float length changed.`);
	for (const value of values) requireCondition(Number.isFinite(value), `${label} contains a nonfinite value.`);
	return values;
}

function uint16FromBytes(bytes, expectedLength, label) {
	requireCondition(bytes.byteLength === expectedLength * 2, `${label} uint16 byte length changed.`);
	return new Uint16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}

function reconstructSparseStarField(
	configuration,
	sceneSpec,
	ledgerScene,
	screenIndex,
	sceneMask,
	visualMagnitudeByMemberId,
) {
	const {widthPixels: width, heightPixels: height, pixelCount} = configuration.viewport;
	requireCondition(ledgerScene.members.length === 500, `${sceneSpec.id} member domain changed.`);
	for (let index = 0; index < ledgerScene.members.length; index += 1) {
		requireCondition(
			ledgerScene.members[index].canonicalMemberIndex === index,
			`${sceneSpec.id} canonical member order changed at ${index}.`,
		);
	}
	const field = new Float32Array(pixelCount * 4);
	const representativeRows = [];
	const representedPixels = new Set();
	let nonzeroScreenIndexPixelCount = 0;
	let maskedScreenIndexPixelCount = 0;
	for (let pixel = 0; pixel < screenIndex.length; pixel += 1) {
		const indexValue = screenIndex[pixel];
		if (indexValue === 0) continue;
		nonzeroScreenIndexPixelCount += 1;
		const canonicalMemberIndex = indexValue - 1;
		const member = ledgerScene.members[canonicalMemberIndex];
		requireCondition(member, `${sceneSpec.id} screen index references a missing member.`);
		requireCondition(
			member.actualScreenIndexRepresentativeMemberId === member.memberId &&
				member.screenIndexAtProjectedPixel === indexValue,
			`${sceneSpec.id} screen index does not name the canonical actual representative.`,
		);
		const x = pixel % width;
		const y = Math.floor(pixel / width);
		requireCondition(
			exactJson(member.projectedTopLeftPixel, [x, y]),
			`${sceneSpec.id} representative pixel differs from the parent R16UI index.`,
		);
		requireCondition(!representedPixels.has(pixel), `${sceneSpec.id} repeats a representative pixel.`);
		representedPixels.add(pixel);
		const maskValue = sceneMask[pixel];
		requireCondition(maskValue === 0 || maskValue === 255, `${sceneSpec.id} has a noncanonical scene mask.`);
		const expectedVisible = maskValue === 0;
		requireCondition(
			member.wholePixelSceneVisible === expectedVisible,
			`${sceneSpec.id} ledger scene visibility differs from the parent R8 mask.`,
		);
		if (!expectedVisible) {
			maskedScreenIndexPixelCount += 1;
			continue;
		}
		requireCondition(
			Array.isArray(member.gpuPreDisplayStarLinearRgb) &&
				member.gpuPreDisplayStarLinearRgb.length === 3 &&
				member.gpuPreDisplayStarLinearRgb.every(Number.isFinite),
			`${sceneSpec.id} representative lacks authoritative GPU-projected stellar RGB.`,
		);
		const offset = pixel * 4;
		for (let channel = 0; channel < 3; channel += 1) {
			field[offset + channel] = Math.fround(member.gpuPreDisplayStarLinearRgb[channel]);
		}
		field[offset + 3] = 1;
		representativeRows.push({
			memberId: member.memberId,
			canonicalMemberIndex,
			projectedTopLeftPixel: [x, y],
			pixelIndex: pixel,
			screenIndex: indexValue,
			collisionGroupMemberIds: member.collisionGroupMemberIds,
			effectiveVisualMagnitude: combinedVisualMagnitude(
				member.collisionGroupMemberIds.map((memberId) => {
					const magnitude = visualMagnitudeByMemberId.get(memberId);
					requireCondition(Number.isFinite(magnitude), `${sceneSpec.id} ${memberId} lacks V magnitude.`);
					return magnitude;
				}),
			),
			wholePixelSceneVisible: member.wholePixelSceneVisible,
			gpuPreDisplayStarLinearRgb: Array.from(field.subarray(offset, offset + 3)),
			sourceColorAxis: member.sourceColorAxis,
			skyOnlyRgb8AtExactPixel: member.skyOnlyRgb8AtExactPixel,
		});
	}
	requireCondition(
		nonzeroScreenIndexPixelCount === sceneSpec.expectedOccupiedPixelCount &&
			representativeRows.length === sceneSpec.expectedOccupiedPixelCount &&
			maskedScreenIndexPixelCount === 0,
		`${sceneSpec.id} occupied/masked representative count changed.`,
	);
	return {
		field,
		representativeRows,
		nonzeroScreenIndexPixelCount,
		maskedScreenIndexPixelCount,
	};
}

function filteredReconstructionForRow(reconstruction, row) {
	const filterConfiguration = rowFilterConfiguration(row);
	const field = new Float32Array(reconstruction.field);
	const representativeRows = [];
	let maximumLuminanceAbsoluteDifference = 0;
	let maximumDisabledLinearScalarDifference = 0;
	for (const representative of reconstruction.representativeRows) {
		const sourceRgb = representative.gpuPreDisplayStarLinearRgb;
		const filteredRgb = applySourceLinearViewPresentationFilters(
			sourceRgb,
			{target: 'stellar', visualMagnitude: representative.effectiveVisualMagnitude},
			filterConfiguration,
			FILTER_IMPLEMENTATIONS,
		);
		const sourceLuminance = humanLowLightLinearLuminance(sourceRgb);
		const filteredLuminance = humanLowLightLinearLuminance(filteredRgb);
		maximumLuminanceAbsoluteDifference = Math.max(
			maximumLuminanceAbsoluteDifference,
			Math.abs(filteredLuminance - sourceLuminance),
		);
		const offset = representative.pixelIndex * 4;
		for (let channel = 0; channel < 3; channel += 1) {
			maximumDisabledLinearScalarDifference = Math.max(
				maximumDisabledLinearScalarDifference,
				row.filter.enabled ? 0 : Math.abs(filteredRgb[channel] - sourceRgb[channel]),
			);
			field[offset + channel] = Math.fround(filteredRgb[channel]);
		}
		const neutralRgb = [sourceLuminance, sourceLuminance, sourceLuminance];
		const sourceChroma = Math.hypot(...sourceRgb.map((value, channel) => value - neutralRgb[channel]));
		const filteredChroma = Math.hypot(...filteredRgb.map((value) => value - sourceLuminance));
		representativeRows.push({
			...representative,
			physicalGpuPreDisplayStarLinearRgb: sourceRgb,
			gpuPreDisplayStarLinearRgb: Array.from(field.subarray(offset, offset + 3)),
			filterEnabled: row.filter.enabled,
			effectiveVisualMagnitude: representative.effectiveVisualMagnitude,
			chromaRetention: row.filter.enabled
				? humanLowLightChromaRetention(
					representative.effectiveVisualMagnitude,
					row.filter.parameters,
				)
				: 1,
			sourceLinearLuminance: sourceLuminance,
			filteredLinearLuminance: filteredLuminance,
			luminanceAbsoluteDifference: Math.abs(filteredLuminance - sourceLuminance),
			sourceChroma,
			filteredChroma,
			measuredChromaRetention: sourceChroma === 0 ? 0 : filteredChroma / sourceChroma,
		});
	}
	return {
		...reconstruction,
		field,
		representativeRows,
		maximumLuminanceAbsoluteDifference,
		maximumDisabledLinearScalarDifference,
	};
}

function compareOutsideRepresentatives(actual, control, representativeRows) {
	const occupied = new Uint8Array(actual.length / 4);
	for (const {pixelIndex} of representativeRows) occupied[pixelIndex] = 1;
	let differingRgbChannelCount = 0;
	let maximumRgbCodeDifference = 0;
	let comparedRgbChannelCount = 0;
	for (let pixel = 0; pixel < occupied.length; pixel += 1) {
		if (occupied[pixel] !== 0) continue;
		for (let channel = 0; channel < 3; channel += 1) {
			const difference = Math.abs(actual[pixel * 4 + channel] - control[pixel * 4 + channel]);
			if (difference !== 0) differingRgbChannelCount += 1;
			maximumRgbCodeDifference = Math.max(maximumRgbCodeDifference, difference);
			comparedRgbChannelCount += 1;
		}
	}
	return {differingRgbChannelCount, maximumRgbCodeDifference, comparedRgbChannelCount};
}

function analyzeRowScene(
	configuration,
	sceneInput,
	row,
	gpu,
	cpu,
	controlRgba,
	q1Rgba,
) {
	const records = [];
	let robustPixelCount = 0;
	let encodedPixelCount = 0;
	let fourCodePixelCount = 0;
	let eightCodePixelCount = 0;
	let peakMaximumAbsoluteRgbCode = 0;
	let saturatedStellarPixelCount = 0;
	let exactWhiteStellarPixelCount = 0;
	for (const representative of sceneInput.reconstruction.representativeRows) {
		const offset = representative.pixelIndex * 4;
		const finalRgb8 = Array.from(gpu.rgba.subarray(offset, offset + 3));
		const skyRgb8 = representative.skyOnlyRgb8AtExactPixel;
		requireCondition(
			Array.isArray(skyRgb8) && skyRgb8.length === 3,
			`${sceneInput.sceneSpec.id} representative lacks exact sky-only RGB.`,
		);
		const deltaRgb8 = finalRgb8.map((value, channel) => value - skyRgb8[channel]);
		const maximumAbsoluteDeltaRgbCode = Math.max(...deltaRgb8.map(Math.abs));
		const deltaEncodedLuminanceCodes =
			encodedLuminance(finalRgb8) - encodedLuminance(skyRgb8);
		const robust = maximumAbsoluteDeltaRgbCode >= configuration.metrics.robustThresholdMaximumAbsoluteRgbCode;
		if (maximumAbsoluteDeltaRgbCode >= 1) encodedPixelCount += 1;
		if (robust) robustPixelCount += 1;
		if (maximumAbsoluteDeltaRgbCode >= 4) fourCodePixelCount += 1;
		if (maximumAbsoluteDeltaRgbCode >= 8) eightCodePixelCount += 1;
		peakMaximumAbsoluteRgbCode = Math.max(peakMaximumAbsoluteRgbCode, maximumAbsoluteDeltaRgbCode);
		if (maximumAbsoluteDeltaRgbCode > 0 && finalRgb8.some((value) => value === 255)) {
			saturatedStellarPixelCount += 1;
		}
		if (maximumAbsoluteDeltaRgbCode > 0 && finalRgb8.every((value) => value === 255)) {
			exactWhiteStellarPixelCount += 1;
		}
		const displayDenominator = Math.max(1, deltaRgb8.reduce((sum, value) => sum + Math.abs(value), 0));
		records.push({
			...representative,
			rowId: row.id,
			filter: row.filter,
			finalRgb8,
			deltaRgb8,
			deltaEncodedLuminanceCodes,
			maximumAbsoluteDeltaRgbCode,
			robust,
			displayColorAxis: (deltaRgb8[0] - deltaRgb8[2]) / displayDenominator,
		});
	}
	return {
		sceneId: sceneInput.sceneSpec.id,
		rowId: row.id,
		multiplier: row.multiplier,
		effectiveBoundaryScale: row.effectiveBoundaryScale,
		filter: row.filter,
		maximumLuminanceAbsoluteDifference:
			sceneInput.reconstruction.maximumLuminanceAbsoluteDifference,
		maximumDisabledLinearScalarDifference:
			sceneInput.reconstruction.maximumDisabledLinearScalarDifference,
		occupiedPixelCount: sceneInput.reconstruction.representativeRows.length,
		encodedPixelCount,
		robustPixelCount,
		fourCodePixelCount,
		eightCodePixelCount,
		peakMaximumAbsoluteRgbCode,
		saturatedStellarPixelCount,
		exactWhiteStellarPixelCount,
		gpuNonfiniteValueCount: gpu.nonfiniteValueCount,
		cpuNonfiniteValueCount: cpu.nonfiniteValueCount,
		gpuCpuComparison: compareRgbCodes(gpu.rgba, cpu.rgba),
		cpuControlParentComparison: row.id === 'physical-control'
			? compareRgbCodes(cpu.rgba, controlRgba)
			: null,
		gpuControlCpuComparison: row.id === 'physical-control'
			? compareRgbCodes(gpu.rgba, cpu.rgba)
			: null,
		gpuControlParentComparison: row.id === 'physical-control'
			? compareRgbCodes(gpu.rgba, controlRgba)
			: null,
		nonoccupiedControlComparison: compareOutsideRepresentatives(
			gpu.rgba,
			q1Rgba ?? gpu.rgba,
			sceneInput.reconstruction.representativeRows,
		),
		representatives: records,
	};
}

function createFigure(width, height, title, subtitle = '') {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: false, colorSpace: 'srgb'});
	requireCondition(context, 'CR6D could not allocate a figure canvas.');
	context.fillStyle = '#07101f';
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#f2f6ff';
	context.font = '600 22px sans-serif';
	context.fillText(title, 24, 32);
	context.fillStyle = '#aebbd2';
	context.font = '13px sans-serif';
	context.fillText(subtitle, 24, 55);
	return {canvas, context};
}

function drawNativePanel(context, rgba, x, y, label) {
	context.fillStyle = '#d9e3f5';
	context.font = '12px sans-serif';
	context.fillText(label, x, y - 8);
	const panel = rgbaCanvas(rgba);
	context.imageSmoothingEnabled = false;
	context.drawImage(panel, x, y);
	panel.remove();
	context.strokeStyle = '#40506b';
	context.strokeRect(x - 0.5, y - 0.5, PANEL_WIDTH + 1, PANEL_HEIGHT + 1);
}

function drawCadence(configuration, row, sceneResults) {
	const gap = 8;
	const margin = 24;
	const header = 86;
	const width = margin * 2 + SCENE_COUNT * PANEL_WIDTH + (SCENE_COUNT - 1) * gap;
	const height = header + PANEL_HEIGHT + 24;
	const {canvas, context} = createFigure(
		width,
		height,
		`CR6D ${row.label} stellar presentation cadence`,
		`q=24; ${row.filter.enabled ? `filter on, max chroma ${row.filter.parameters.maximumChromaRetention}` : 'filter off'}; native 1:1 panels`,
	);
	for (let index = 0; index < sceneResults.length; index += 1) {
		const x = margin + index * (PANEL_WIDTH + gap);
		drawNativePanel(context, sceneResults[index].rgba, x, header, configuration.scenes[index].label);
	}
	return canvas;
}

function drawDecisionMatrix(configuration, rowResults) {
	const gapX = 8;
	const gapY = 30;
	const margin = 24;
	const header = 88;
	const width = margin * 2 + SCENE_COUNT * PANEL_WIDTH + (SCENE_COUNT - 1) * gapX;
	const height = header + ROW_COUNT * PANEL_HEIGHT + (ROW_COUNT - 1) * gapY + 28;
	const {canvas, context} = createFigure(
		width,
		height,
		'CR6D toggleable low-light stellar chroma decision matrix',
		'Columns are the exact eight-scene cadence; rows change only the source-linear stellar perception filter.',
	);
	for (let rowIndex = 0; rowIndex < rowResults.length; rowIndex += 1) {
		for (let sceneIndex = 0; sceneIndex < SCENE_COUNT; sceneIndex += 1) {
			const x = margin + sceneIndex * (PANEL_WIDTH + gapX);
			const y = header + rowIndex * (PANEL_HEIGHT + gapY);
			drawNativePanel(
				context,
				rowResults[rowIndex].scenes[sceneIndex].rgba,
				x,
				y,
				`${configuration.rows[rowIndex].label} | ${configuration.scenes[sceneIndex].label}`,
			);
		}
	}
	return canvas;
}

function drawAxes(context, rectangle, xLabel, yLabel) {
	context.strokeStyle = '#71819e';
	context.lineWidth = 1;
	context.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
	context.fillStyle = '#aebbd2';
	context.font = '12px sans-serif';
	context.fillText(xLabel, rectangle.x + rectangle.width / 2 - 40, rectangle.y + rectangle.height + 30);
	context.save();
	context.translate(rectangle.x - 42, rectangle.y + rectangle.height / 2 + 38);
	context.rotate(-Math.PI / 2);
	context.fillText(yLabel, 0, 0);
	context.restore();
}

function drawProgression(configuration) {
	const {canvas, context} = createFigure(
		1200,
		690,
		'CR6D magnitude-driven stellar chroma retention',
		'Physical color remains toggleable; candidates smoothly approach neutral at V=3.2.',
	);
	const rectangle = {x: 90, y: 115, width: 1020, height: 470};
	drawAxes(context, rectangle, 'effective visual magnitude', 'retained chroma fraction');
	const colors = ['#86a8ff', '#57d3a0', '#ffb45c'];
	const minimumMagnitude = -1.5;
	const maximumMagnitude = 5.2;
	for (let rowIndex = 0; rowIndex < configuration.rows.length; rowIndex += 1) {
		const row = configuration.rows[rowIndex];
		context.strokeStyle = colors[rowIndex];
		context.fillStyle = colors[rowIndex];
		context.lineWidth = 3;
		context.beginPath();
		for (let sample = 0; sample <= 256; sample += 1) {
			const magnitude = minimumMagnitude +
				(maximumMagnitude - minimumMagnitude) * sample / 256;
			const retention = row.filter.enabled
				? humanLowLightChromaRetention(magnitude, row.filter.parameters)
				: 1;
			const x = rectangle.x + sample * rectangle.width / 256;
			const y = rectangle.y + rectangle.height - retention * rectangle.height;
			if (sample === 0) context.moveTo(x, y);
			else context.lineTo(x, y);
		}
		context.stroke();
		context.fillText(row.label, 100 + rowIndex * 350, 88);
	}
	context.fillStyle = '#aebbd2';
	context.font = '12px sans-serif';
	for (const magnitude of [-1, 0, 1, 2, 3, 3.2, 4, 5]) {
		const x = rectangle.x + (magnitude - minimumMagnitude) /
			(maximumMagnitude - minimumMagnitude) * rectangle.width;
		context.fillText(String(magnitude), x - 8, rectangle.y + rectangle.height + 22);
	}
	for (const retention of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
		const y = rectangle.y + rectangle.height - retention * rectangle.height;
		context.fillText(retention.toFixed(1), rectangle.x - 38, y + 4);
	}
	return canvas;
}

function drawFixedMemberFigure(configuration, fixedAnalysis) {
	const {canvas, context} = createFigure(
		1320,
		720,
		'CR6D fixed-member dark brightness and color',
		'Only robust members enter the source/display color correlation. Invisible members remain plotted as open marks.',
	);
	const colors = ['#86a8ff', '#57d3a0', '#ffb45c'];
	const panelWidth = 390;
	const panelHeight = 500;
	const top = 105;
	for (let rowIndex = 0; rowIndex < fixedAnalysis.rows.length; rowIndex += 1) {
		const row = fixedAnalysis.rows[rowIndex];
		const rectangle = {x: 70 + rowIndex * 420, y: top, width: panelWidth, height: panelHeight};
		drawAxes(context, rectangle, 'source red-minus-blue axis', 'dark delta Y8 codes');
		const maxY = Math.max(1, ...row.members.map((member) => Math.max(0, member.deltaEncodedLuminanceCodes)));
		for (const member of row.members) {
			const x = rectangle.x + clamp((member.sourceColorAxis + 1) / 2, 0, 1) * rectangle.width;
			const y = rectangle.y + rectangle.height -
				clamp(member.deltaEncodedLuminanceCodes / maxY, 0, 1) * rectangle.height;
			context.beginPath();
			context.arc(x, y, member.robust ? 5 : 4, 0, 2 * Math.PI);
			if (member.robust) {
				context.fillStyle = colors[rowIndex];
				context.fill();
			} else {
				context.strokeStyle = '#78859b';
				context.stroke();
			}
		}
		context.fillStyle = '#e5ebf7';
		context.font = '600 14px sans-serif';
		context.fillText(configuration.rows[rowIndex].label, rectangle.x, 84);
		context.fillStyle = '#aebbd2';
		context.font = '12px sans-serif';
		context.fillText(
			`top median ${row.topBrightnessQuartileMedianDeltaY8?.toFixed(3)} | bottom ${row.bottomBrightnessQuartileMedianDeltaY8?.toFixed(3)}`,
			rectangle.x,
			rectangle.y + rectangle.height + 52,
		);
		context.fillText(
			`robust n=${row.robustMemberCount} | color r=${row.robustColorAxisPearsonCorrelation?.toFixed(4) ?? 'n/a'}`,
			rectangle.x,
			rectangle.y + rectangle.height + 70,
		);
	}
	return canvas;
}

function buildFixedMemberAnalysis(configuration, parentFixedTracks, rowMetrics) {
	const brightnessOrdering = configuration.metrics.brightnessOrdering;
	const darkSceneId = brightnessOrdering.sceneId;
	requireCondition(
		darkSceneId === configuration.metrics.fixedMemberDarkSceneId,
		'CR6D fixed-member brightness-ordering scene changed.',
	);
	const fixedById = new Map(parentFixedTracks.tracks.map((track) => [track.memberId, track]));
	const candidateDarkSceneFinalComposites = [];
	const rows = rowMetrics.map((row) => {
		const scene = row.scenes.find((entry) => entry.sceneId === darkSceneId);
		candidateDarkSceneFinalComposites.push({
			rowId: row.rowId,
			multiplier: row.multiplier,
			sceneId: darkSceneId,
			result: scene.output,
		});
		const representativeById = new Map(scene.representatives.map((entry) => [entry.memberId, entry]));
		const members = parentFixedTracks.preDisplayBrightnessRanking.map((ranking) => {
			const representative = representativeById.get(ranking.memberId);
			requireCondition(representative, `CR6D fixed member ${ranking.memberId} is missing from ${darkSceneId}.`);
			requireCondition(fixedById.has(ranking.memberId), `CR6D fixed track ${ranking.memberId} is missing.`);
			return {
				memberId: ranking.memberId,
				brightnessScore: ranking.brightnessScore,
				brightnessQuartile: ranking.brightnessQuartile,
				sourceColorAxis: representative.sourceColorAxis,
				displayColorAxis: representative.displayColorAxis,
				deltaRgb8: representative.deltaRgb8,
				deltaEncodedLuminanceCodes: representative.deltaEncodedLuminanceCodes,
				maximumAbsoluteDeltaRgbCode: representative.maximumAbsoluteDeltaRgbCode,
				robust: representative.robust,
			};
		});
		const top = members.filter(
			({brightnessQuartile}) => brightnessQuartile === brightnessOrdering.topQuartile,
		);
		const bottom = members.filter(
			({brightnessQuartile}) => brightnessQuartile === brightnessOrdering.bottomQuartile,
		);
		const robust = members.filter(({robust}) => robust);
		return {
			rowId: row.rowId,
			multiplier: row.multiplier,
			darkSceneId,
			members,
			topBrightnessQuartileMedianDeltaY8: median(top.map((member) => member.deltaEncodedLuminanceCodes)),
			bottomBrightnessQuartileMedianDeltaY8: median(bottom.map((member) => member.deltaEncodedLuminanceCodes)),
			robustMemberCount: robust.length,
			robustColorAxisPearsonCorrelation: pearsonCorrelation(robust),
		};
	});
	return {
		schemaId: 'algorithm32-color-reset-cr6d-fixed-member-analysis-v1',
		fixedCohortSelection: parentFixedTracks.selection,
		fixedCohortCount: parentFixedTracks.metrics.fixedCohortCount,
		darkSceneId,
		brightnessOrdering,
		rows,
		derivation: {
			parents: {
				parentMemberLedger: configuration.parent.memberLedger,
				parentFixedMemberTracks: configuration.parent.fixedMemberTracks,
				candidateDarkSceneFinalComposites,
			},
			operation:
				'Join the parent candidate-independent fixed cohort to each CR6D dark-scene representative result; retain parent brightness quartiles; compute delta Y8 and Pearson source/display color-axis relationship only over robust members.',
			metrics: configuration.metrics.colorRelationship,
			implementation: configuration.implementation,
			materialParameters: {
				darkSceneId,
				robustThresholdMaximumAbsoluteRgbCode:
					configuration.metrics.robustThresholdMaximumAbsoluteRgbCode,
				colorRelationship: configuration.metrics.colorRelationship,
			},
		},
	};
}

function buildTransitionAnalysis(configuration, parentTransition, rowMetrics) {
	const {belowSceneId, aboveSceneId, maximumPerMemberDeltaDifferenceCodes} =
		configuration.metrics.transition;
	const candidateTransitionFinalComposites = [];
	const rows = rowMetrics.map((row) => {
		const below = row.scenes.find((entry) => entry.sceneId === belowSceneId);
		const above = row.scenes.find((entry) => entry.sceneId === aboveSceneId);
		candidateTransitionFinalComposites.push(
			{rowId: row.rowId, multiplier: row.multiplier, sceneId: belowSceneId, result: below.output},
			{rowId: row.rowId, multiplier: row.multiplier, sceneId: aboveSceneId, result: above.output},
		);
		const belowById = new Map(below.representatives.map((entry) => [entry.memberId, entry]));
		const aboveById = new Map(above.representatives.map((entry) => [entry.memberId, entry]));
		requireCondition(
			exactJson([...belowById.keys()], [...aboveById.keys()]),
			`CR6D ${row.rowId} transition representative membership changed.`,
		);
		let robustMembershipMismatchCount = 0;
		let projectedPixelMismatchCount = 0;
		let maximumPerStarDisplayedDeltaRgbCodeDifference = 0;
		const perMember = [];
		for (const [memberId, belowMember] of belowById) {
			const aboveMember = aboveById.get(memberId);
			const maximumDifference = Math.max(...belowMember.deltaRgb8.map(
				(value, channel) => Math.abs(value - aboveMember.deltaRgb8[channel]),
			));
			maximumPerStarDisplayedDeltaRgbCodeDifference = Math.max(
				maximumPerStarDisplayedDeltaRgbCodeDifference,
				maximumDifference,
			);
			if (belowMember.robust !== aboveMember.robust) robustMembershipMismatchCount += 1;
			const projectedPixelExact = exactJson(
				belowMember.projectedTopLeftPixel,
				aboveMember.projectedTopLeftPixel,
			);
			if (!projectedPixelExact) projectedPixelMismatchCount += 1;
			perMember.push({
				memberId,
				projectedPixelExact,
				robustMembershipExact: belowMember.robust === aboveMember.robust,
				displayedDeltaRgbMaximumCodeDifference: maximumDifference,
			});
		}
		return {
			rowId: row.rowId,
			multiplier: row.multiplier,
			projectedPixelMismatchCount,
			robustMembershipMismatchCount,
			maximumPerStarDisplayedDeltaRgbCodeDifference,
			withinDeclaredBoundary:
				projectedPixelMismatchCount === 0 &&
				robustMembershipMismatchCount === 0 &&
				maximumPerStarDisplayedDeltaRgbCodeDifference <= maximumPerMemberDeltaDifferenceCodes,
			perMember,
		};
	});
	return {
		schemaId: 'algorithm32-color-reset-cr6d-transition-analysis-v1',
		belowSceneId,
		aboveSceneId,
		timestampSeparationMilliseconds:
			Date.parse(configuration.scenes.find(({id}) => id === aboveSceneId).timeIso) -
			Date.parse(configuration.scenes.find(({id}) => id === belowSceneId).timeIso),
		parentGeometryFacts: parentTransition.facts,
		parentGeometryInheritedExact:
			parentTransition.facts.projectedPixelsExact === true &&
			parentTransition.facts.eligibilityExact === true &&
			parentTransition.facts.collisionMembershipExact === true &&
			parentTransition.facts.sceneMaskExact === true &&
			parentTransition.facts.presentationFactorExact === true,
		rows,
		derivation: {
			parents: {
				parentMemberLedger: configuration.parent.memberLedger,
				parentTransitionAnalysis: configuration.parent.transitionAnalysis,
				candidateTransitionFinalComposites,
			},
			operation:
				'Retain the parent consecutive-millisecond geometry facts and compare CR6D displayed stellar deltas and robust membership for identical canonical actual representatives at each fixed multiplier.',
			maximumPerMemberDeltaDifferenceCodes,
			implementation: configuration.implementation,
			materialParameters: configuration.metrics.transition,
		},
	};
}

async function loadParentInputs(configuration) {
	const prefix = configuration.browserParent.prefix;
	const [analysisInput, ledgerInput, fixedInput, transitionInput, catalogInput] = await Promise.all([
		fetchVerifiedJson(prefix, configuration.parent.analysis, 'CR6D parent analysis'),
		fetchVerifiedJson(prefix, configuration.parent.memberLedger, 'CR6D parent member ledger'),
		fetchVerifiedJson(prefix, configuration.parent.fixedMemberTracks, 'CR6D parent fixed-member tracks'),
		fetchVerifiedJson(prefix, configuration.parent.transitionAnalysis, 'CR6D parent transition analysis'),
		fetchVerifiedJson(
			configuration.browserCatalog.prefix,
			configuration.catalogParent.roster,
			'CR6D catalog roster',
		),
	]);
	requireCondition(
		analysisInput.value.schemaId === configuration.parent.analysis.schemaId &&
			analysisInput.value.renderComplete === true &&
			analysisInput.value.scientificGateEvaluated === false,
		'CR6D parent analysis authority changed.',
	);
	requireCondition(
		ledgerInput.value.schemaId === configuration.parent.memberLedger.schemaId &&
			fixedInput.value.schemaId === configuration.parent.fixedMemberTracks.schemaId &&
			transitionInput.value.schemaId === configuration.parent.transitionAnalysis.schemaId,
		'CR6D parent evidence schema changed.',
	);
	requireCondition(
		catalogInput.value.schemaId === configuration.catalogParent.roster.schemaId &&
			catalogInput.value.members.length === 2000,
		'CR6D catalog roster schema or member count changed.',
	);
	const visualMagnitudeByMemberId = new Map();
	for (let index = 0; index < 500; index += 1) {
		const member = catalogInput.value.members[index];
		requireCondition(
			member.canonicalIndex === index && Number.isFinite(member.visualMagnitude),
			`CR6D catalog member ${index} changed.`,
		);
		visualMagnitudeByMemberId.set(member.memberId, member.visualMagnitude);
	}
	requireCondition(
		exactJson(
			analysisInput.value.sceneOrder,
			configuration.scenes.map(({id}) => id),
		) &&
			exactJson(
				ledgerInput.value.scenes.map(({sceneId}) => sceneId),
				configuration.scenes.map(({id}) => id),
			),
		'CR6D parent scene order changed.',
	);
	const ledgerByScene = new Map(ledgerInput.value.scenes.map((scene) => [scene.sceneId, scene]));
	const sceneInputs = [];
	for (const sceneSpec of configuration.scenes) {
		const selectedFrame = configuration.selectedBrightnessParent.controlFrames.find(
			({sceneId}) => sceneId === sceneSpec.id,
		);
		requireCondition(selectedFrame, `CR6D ${sceneSpec.id} selected q24 frame is missing.`);
		const [skyInput, controlInput, selectedControlInput, indexInput, maskInput] = await Promise.all([
			fetchVerifiedBytes(prefix, sceneSpec.skyField, `CR6D ${sceneSpec.id} sky field`),
			fetchVerifiedBytes(prefix, sceneSpec.controlPng, `CR6D ${sceneSpec.id} control PNG`),
			fetchVerifiedBytes(
				configuration.browserSelectedBrightness.prefix,
				selectedFrame,
				`CR6D ${sceneSpec.id} selected q24 control PNG`,
			),
			fetchVerifiedBytes(prefix, sceneSpec.stellarScreenIndex, `CR6D ${sceneSpec.id} screen index`),
			fetchVerifiedBytes(prefix, sceneSpec.sceneHitMask, `CR6D ${sceneSpec.id} scene mask`),
		]);
		const skyLinearRgbY = float32FromBytes(
			skyInput.bytes,
			configuration.viewport.pixelCount * 4,
			`CR6D ${sceneSpec.id} sky field`,
		);
		const screenIndex = uint16FromBytes(
			indexInput.bytes,
			configuration.viewport.pixelCount,
			`CR6D ${sceneSpec.id} screen index`,
		);
		const sceneMask = new Uint8Array(
			maskInput.bytes.buffer.slice(maskInput.bytes.byteOffset, maskInput.bytes.byteOffset + maskInput.bytes.byteLength),
		);
		requireCondition(
			sceneMask.length === configuration.viewport.pixelCount,
			`CR6D ${sceneSpec.id} scene mask length changed.`,
		);
		const ledgerScene = ledgerByScene.get(sceneSpec.id);
		requireCondition(ledgerScene, `CR6D ${sceneSpec.id} parent ledger scene is missing.`);
		const analysisScene = analysisInput.value.scenes.find(({sceneId}) => sceneId === sceneSpec.id);
		requireCondition(
			analysisScene && analysisScene.timeIso === sceneSpec.timeIso &&
				analysisScene.totalHorizontalIlluminance.value === sceneSpec.totalHorizontalIlluminanceLux,
			`CR6D ${sceneSpec.id} parent time or illuminance changed.`,
		);
		const reconstruction = reconstructSparseStarField(
			configuration,
			sceneSpec,
			ledgerScene,
			screenIndex,
			sceneMask,
			visualMagnitudeByMemberId,
		);
		sceneInputs.push({
			sceneSpec,
			skyLinearRgbY,
			screenIndex,
			sceneMask,
			controlRgba: await decodePng(
				selectedControlInput.bytes,
				configuration.viewport.widthPixels,
				configuration.viewport.heightPixels,
				`CR6D ${sceneSpec.id} selected q24 control PNG`,
			),
			reconstruction,
			parentArtifacts: {
				skyField: skyInput.evidence,
				controlPng: controlInput.evidence,
				selectedQ24ControlPng: selectedControlInput.evidence,
				stellarScreenIndex: indexInput.evidence,
				sceneHitMask: maskInput.evidence,
			},
		});
	}
	return {
		analysis: analysisInput.value,
		memberLedger: ledgerInput.value,
		fixedMemberTracks: fixedInput.value,
		transitionAnalysis: transitionInput.value,
		catalogRoster: catalogInput.value,
		sceneInputs,
		artifacts: {
			analysis: analysisInput.evidence,
			memberLedger: ledgerInput.evidence,
			fixedMemberTracks: fixedInput.evidence,
			transitionAnalysis: transitionInput.evidence,
			catalogRoster: catalogInput.evidence,
		},
	};
}

/**
 * Render every CR6D image before publishing browser evidence. The Node runner
 * owns all scientific gates and never suppresses a row after observing it.
 */
export async function runCr6dToggleableLowLightStellarChromaBrowser() {
	const configurationResponse = await fetch('/browser/configuration.json');
	requireCondition(configurationResponse.ok, 'CR6D browser configuration fetch failed.');
	const configuration = validateConfiguration(await configurationResponse.json());
	requireCondition(
		new Uint8Array(new Uint16Array([1]).buffer)[0] === 1,
		'CR6D parent binary artifacts require a little-endian browser.',
	);
	await window.colorResetProgress('parent-input-started');
	const parent = await loadParentInputs(configuration);
	await window.colorResetProgress('parent-input-authenticated');
	const displayModel = new Cr4gSlopeLimitedPreToneExposureColorDisplayModel({
		curve: expectedCurve(configuration),
	});
	const gpuReplay = createGpuReplay(
		displayModel,
		configuration.viewport.widthPixels,
		configuration.viewport.heightPixels,
	);
	const uploadedImages = [];
	const uploadedEvidence = [];
	const imageUploadOrder = [];
	const panelIdentities = [];
	const imageDerivations = [];
	const uploadImage = async (artifactPath, canvasOrRgba, identity, derivation) => {
		const temporaryCanvas = canvasOrRgba instanceof HTMLCanvasElement
			? null
			: rgbaCanvas(canvasOrRgba);
		const bytes = canvasPngBytes(temporaryCanvas ?? canvasOrRgba);
		temporaryCanvas?.remove();
		const output = await uploadBytes(artifactPath, bytes, 'image/png');
		uploadedImages.push(output);
		imageUploadOrder.push(artifactPath);
		panelIdentities.push({...identity, artifactPath, output});
		imageDerivations.push({...derivation, artifactPath, result: output});
		await window.colorResetProgress(`image-${imageUploadOrder.length}`);
		return output;
	};
	const rowResults = [];
	let gpuDiagnostics = null;
	try {
		for (let rowIndex = 0; rowIndex < configuration.rows.length; rowIndex += 1) {
			const row = configuration.rows[rowIndex];
			const scenes = [];
			for (let sceneIndex = 0; sceneIndex < parent.sceneInputs.length; sceneIndex += 1) {
				const sceneInput = parent.sceneInputs[sceneIndex];
				const filteredReconstruction = filteredReconstructionForRow(
					sceneInput.reconstruction,
					row,
				);
				const filteredSceneInput = {...sceneInput, reconstruction: filteredReconstruction};
				const gpu = renderGpuReplay(
					gpuReplay,
					sceneInput.skyLinearRgbY,
					filteredReconstruction.field,
					sceneInput.sceneSpec.totalHorizontalIlluminanceLux,
					SELECTED_BRIGHTNESS_MULTIPLIER,
				);
				const cpu = cpuReplay(
					displayModel,
					sceneInput.skyLinearRgbY,
					filteredReconstruction.field,
					sceneInput.sceneSpec.totalHorizontalIlluminanceLux,
					SELECTED_BRIGHTNESS_MULTIPLIER,
				);
				const metrics = analyzeRowScene(
					configuration,
					filteredSceneInput,
					row,
					gpu,
					cpu,
					sceneInput.controlRgba,
					rowIndex === 0 ? gpu.rgba : rowResults[0].scenes[sceneIndex].rgba,
				);
				const artifactPath = configuration.outputs.requestedImageUploadOrder[
					rowIndex * SCENE_COUNT + sceneIndex
				];
				const output = await uploadImage(
					artifactPath,
					gpu.rgba,
					{
						panelId: `${row.id}-${sceneInput.sceneSpec.id}`,
						rowId: row.id,
						sceneId: sceneInput.sceneSpec.id,
						role: 'CR6D toggleable stellar perception composite',
						fullResolution: true,
					},
					{
						parents: [
							sceneInput.parentArtifacts.skyField,
							sceneInput.parentArtifacts.stellarScreenIndex,
							sceneInput.parentArtifacts.sceneHitMask,
							parent.artifacts.memberLedger,
						],
						operation: configuration.presentation.operation,
						implementation: configuration.implementation,
						materialParameters: {
							rowId: row.id,
							filter: row.filter,
							multiplier: SELECTED_BRIGHTNESS_MULTIPLIER,
							effectiveBoundaryScale: row.effectiveBoundaryScale,
							illuminanceLux: sceneInput.sceneSpec.totalHorizontalIlluminanceLux,
							frozenSkyDisplay: configuration.frozenSkyDisplay,
						},
					},
				);
				scenes.push({...metrics, rgba: gpu.rgba, output});
			}
			rowResults.push({
				rowId: row.id,
				label: row.label,
				multiplier: row.multiplier,
				effectiveBoundaryScale: row.effectiveBoundaryScale,
				filter: row.filter,
				scenes,
			});
		}
		gpuDiagnostics = {
			...gpuReplay.software,
			contextLost: gpuReplay.context.isContextLost(),
			terminalWebglErrors: drainWebglErrors(gpuReplay.context),
		};
	} finally {
		disposeGpuReplay(gpuReplay);
	}

	for (let rowIndex = 0; rowIndex < configuration.rows.length; rowIndex += 1) {
		const row = configuration.rows[rowIndex];
		const canvas = drawCadence(configuration, row, rowResults[rowIndex].scenes);
		const artifactPath = configuration.outputs.requestedImageUploadOrder[24 + rowIndex];
		await uploadImage(
			artifactPath,
			canvas,
			{panelId: `${row.id}-cadence`, rowId: row.id, role: 'native eight-scene cadence'},
			{
				parents: rowResults[rowIndex].scenes.map(({output}) => output),
				operation: 'Copy the eight full-resolution row images at native 1:1 into one labeled chronological cadence.',
				implementation: configuration.implementation,
				materialParameters: {rowId: row.id, imageSmoothing: false},
			},
		);
		canvas.remove();
	}
	const matrix = drawDecisionMatrix(configuration, rowResults);
	await uploadImage(
		configuration.outputs.requestedImageUploadOrder[27],
		matrix,
		{panelId: 'complete-decision-matrix', role: 'native eight-by-three decision matrix'},
		{
			parents: rowResults.flatMap((row) => row.scenes.map(({output}) => output)),
			operation: 'Copy all 24 final-composite images at native 1:1 into the declared eight-column by three-row matrix.',
			implementation: configuration.implementation,
			materialParameters: {imageSmoothing: false, rowOrder: configuration.rows.map(({id}) => id)},
		},
	);
	matrix.remove();
	await window.colorResetProgress('decision-plate-complete');

	const progression = drawProgression(configuration);
	await uploadImage(
		configuration.outputs.requestedImageUploadOrder[28],
		progression,
		{panelId: 'magnitude-chroma-retention', role: 'perception-filter diagnostic'},
		{
			parents: [parent.artifacts.memberLedger, ...rowResults.flatMap((row) => row.scenes.map(({output}) => output))],
			operation: 'Plot the exact physical, moderate, and strong retained-chroma relationships over apparent magnitude.',
			implementation: configuration.implementation,
			materialParameters: {rows: configuration.rows.map(({id, filter}) => ({id, filter}))},
		},
	);
	progression.remove();

	const fixedMemberAnalysis = buildFixedMemberAnalysis(
		configuration,
		parent.fixedMemberTracks,
		rowResults,
	);
	const fixedFigure = drawFixedMemberFigure(configuration, fixedMemberAnalysis);
	await uploadImage(
		configuration.outputs.requestedImageUploadOrder[29],
		fixedFigure,
		{panelId: 'fixed-member-dark-color-brightness', role: 'fixed-member diagnostic'},
		{
			parents: [
				parent.artifacts.memberLedger,
				parent.artifacts.fixedMemberTracks,
				...fixedMemberAnalysis.derivation.parents.candidateDarkSceneFinalComposites
					.map(({result}) => result),
			],
			operation: fixedMemberAnalysis.derivation.operation,
			implementation: configuration.implementation,
			materialParameters: configuration.metrics.colorRelationship,
		},
	);
	fixedFigure.remove();
	requireCondition(
		exactJson(imageUploadOrder, configuration.outputs.requestedImageUploadOrder),
		'CR6D requested image upload order changed.',
	);
	await window.colorResetProgress('all-images-complete');

	const transitionAnalysis = buildTransitionAnalysis(
		configuration,
		parent.transitionAnalysis,
		rowResults,
	);
	const replayLedger = {
		schemaId: 'algorithm32-color-reset-cr6d-replay-ledger-v1',
		parent: {
			runId: configuration.parent.runId,
			artifactSetSha256: configuration.parent.artifactSetSha256,
			manifest: configuration.parent.manifest,
		},
		replayOracle: configuration.replayOracle,
		selectedBrightnessParent: configuration.selectedBrightnessParent,
		catalogParent: configuration.catalogParent,
		presentationOwner: {
			brightnessId: CR6C_ONE_PIXEL_BRIGHTNESS_CALIBRATION_ID,
			baseBoundaryScale: CR6C_BASE_BOUNDARY_SCALE,
			multiplier: SELECTED_BRIGHTNESS_MULTIPLIER,
			registryId: VIEW_PRESENTATION_FILTER_REGISTRY_ID,
			filterId: HUMAN_LOW_LIGHT_CHROMA_FILTER_ID,
		},
		compositionEquation: configuration.presentation.operation,
		frozenSkyDisplay: configuration.frozenSkyDisplay,
		rows: rowResults.map((row) => ({
			...row,
			scenes: row.scenes.map(({rgba, output, ...scene}) => ({...scene, output})),
		})),
		derivation: {
			parents: {
				parentEvidence: parent.artifacts,
				parentSceneArtifacts: parent.sceneInputs.map(({sceneSpec, parentArtifacts}) => ({
					sceneId: sceneSpec.id,
					...parentArtifacts,
				})),
			},
			operation:
				'For each scene, authenticate CR6 raw sky/geometry/transport evidence, the selected CR6C q=24 control, and CR6B visual magnitudes; reconstruct the exact sparse one-pixel field; apply the disabled, moderate, or strong source-linear stellar filter; retain q=24; then evaluate GPU and independent CPU display paths through frozen slope-078/p9 plus Bruneton exponential.',
			implementation: configuration.implementation,
			materialParameters: {
				rows: configuration.rows,
				viewport: configuration.viewport,
				metrics: configuration.metrics,
				precisionContract: {
					candidate: 'binary64 filter evaluation, Float32 field storage, and WebGL2 RGBA32F display replay',
					reference: 'independent binary64 JavaScript composition and display evaluation',
					referenceIsNotFroundedToMirrorGpu: true,
				},
			},
		},
	};
	const replayLedgerUpload = await uploadJson(configuration.outputs.evidence.replayLedger, replayLedger);
	uploadedEvidence.push(replayLedgerUpload);
	const replayLedgerIdentity = {
		artifactPath: replayLedgerUpload.artifactPath,
		schemaId: replayLedger.schemaId,
		byteLength: replayLedgerUpload.byteLength,
		sha256: replayLedgerUpload.sha256,
	};
	fixedMemberAnalysis.derivation.parentReplayLedger = replayLedgerIdentity;
	transitionAnalysis.derivation.parentReplayLedger = replayLedgerIdentity;
	const fixedUpload = await uploadJson(
		configuration.outputs.evidence.fixedMemberAnalysis,
		fixedMemberAnalysis,
	);
	uploadedEvidence.push(fixedUpload);
	const transitionUpload = await uploadJson(
		configuration.outputs.evidence.transitionAnalysis,
		transitionAnalysis,
	);
	uploadedEvidence.push(transitionUpload);
	const evidenceDerivations = {
		replayLedger: {...replayLedger.derivation, result: replayLedgerUpload},
		fixedMemberAnalysis: {
			...fixedMemberAnalysis.derivation,
			result: fixedUpload,
		},
		transitionAnalysis: {
			...transitionAnalysis.derivation,
			result: transitionUpload,
		},
	};
	return {
		schemaId: RESULT_SCHEMA_ID,
		renderComplete: true,
		integrityGateEvaluated: false,
		scientificGateEvaluated: false,
		appearanceAccepted: false,
		ownerAppearanceReviewRequired: true,
		automaticCandidateSelection: false,
		productionClaim: false,
		claimBoundary: configuration.claimBoundary,
		replayOracle: configuration.replayOracle,
		parent: {
			runId: configuration.parent.runId,
			artifactSetSha256: configuration.parent.artifactSetSha256,
			manifest: configuration.parent.manifest,
			artifacts: parent.artifacts,
		},
		selectedBrightnessParent: {
			runId: configuration.selectedBrightnessParent.runId,
			artifactSetSha256: configuration.selectedBrightnessParent.artifactSetSha256,
		},
		catalogParent: {
			runId: configuration.catalogParent.runId,
			artifactSetSha256: configuration.catalogParent.artifactSetSha256,
		},
		presentationOwner: {
			brightnessId: CR6C_ONE_PIXEL_BRIGHTNESS_CALIBRATION_ID,
			baseBoundaryScale: CR6C_BASE_BOUNDARY_SCALE,
			multiplier: SELECTED_BRIGHTNESS_MULTIPLIER,
			registryId: VIEW_PRESENTATION_FILTER_REGISTRY_ID,
			filterId: HUMAN_LOW_LIGHT_CHROMA_FILTER_ID,
			equation: configuration.presentation.operation,
		},
		frozenColorEvidence: {
			modelId: displayModel.id,
			curve: displayModel.curve,
			curveExact: exactJson(displayModel.curve, expectedCurve(configuration)),
			sharedStarAndSkyEvaluation: true,
			extraExposureOperation: false,
			stellarChromaticOperationIsExplicitAndToggleable: true,
		},
		rowOrder: configuration.rows.map(({id}) => id),
		sceneOrder: configuration.scenes.map(({id}) => id),
		rows: replayLedger.rows,
		fixedMemberAnalysis,
		transitionAnalysis,
		gpu: gpuDiagnostics,
		requestedImageCount: configuration.outputs.requestedImageUploadOrder.length,
		uploadedImageCount: uploadedImages.length,
		imageUploadOrder,
		uploadedImages,
		uploadedEvidence,
		panelIdentities,
		imageDerivations,
		evidenceDerivations,
		allDeclaredImagesUploaded: uploadedImages.length === 30,
		allDeclaredBrowserEvidenceUploaded: uploadedEvidence.length === 3,
		software: {
			browserUserAgent: navigator.userAgent,
			webCrypto: 'SubtleCrypto SHA-256',
			filterEvaluation: 'binary64 source-linear registered filter with Float32 storage',
			gpuComposition: 'WebGL2 RGBA32F two-input q24 replay',
			cpuReference: 'binary64 q24 frozen slope-078/p9 plus Bruneton exponential',
		},
	};
}
