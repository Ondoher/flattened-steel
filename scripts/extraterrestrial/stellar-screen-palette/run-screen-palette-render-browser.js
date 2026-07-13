import {StellarScreenPaletteGpuResource} from './StellarScreenPaletteGpuResource.js';

const CHANNEL_COUNT = 15;
const DISPLAY_TONE_MAP_K = 1 / (5 * 683);
const LINEAR_SRGB_WEIGHTS = Object.freeze([
	[14.749358550069186, -12.461809444307793, 87.0946400969207],
	[526.2783136675116, -458.55532519841455, 3237.2612774897575],
	[4860.670464118019, -4772.7836927559265, 39151.920333292415],
	[-3060.0889637085575, 630.8578131011398, 29358.021601771536],
	[-13632.173462494251, 13736.143434391024, 4381.701642849098],
	[-16218.356823408865, 31693.381438654007, -2831.7761080281125],
	[13090.311666839618, 25900.771554214934, -3445.8601281741517],
	[50412.333624759995, 5985.729871526668, -1751.5249369399994],
	[40037.66348377322, -2711.74301170623, -470.97288279674353],
	[10784.85206753291, -1100.5301263483966, -80.95993013896909],
	[1404.8097211248464, -151.91580336427623, -9.471889119435332],
	[162.89272907807108, -17.68227705091523, -1.089886496392673],
	[17.002541340620876, -1.8456545849604458, -0.1137609522231646],
	[1.938132985276144, -0.21038756748325607, -0.012967705204170663],
	[0.21580616718156756, -0.02342611824797461, -0.0014439210507229407],
]);

const VERTEX_SHADER = `#version 300 es
void main() {
	vec2 position = gl_VertexID == 0 ? vec2(-1.0, -1.0)
		: gl_VertexID == 1 ? vec2(3.0, -1.0)
		: vec2(-1.0, 3.0);
	gl_Position = vec4(position, 0.0, 1.0);
}`;

function glslArray(values) {
	return values.map((value) => Number(value).toExponential(17)).join(', ');
}

const RENDER_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;
const int SPECTRAL_CHANNEL_COUNT = 15;
const float DISPLAY_TONE_MAP_K = ${DISPLAY_TONE_MAP_K.toExponential(17)};
const float DISPLAY_LINEAR_SRGB_R_BY_CHANNEL[15] = float[15](${glslArray(LINEAR_SRGB_WEIGHTS.map((value) => value[0]))});
const float DISPLAY_LINEAR_SRGB_G_BY_CHANNEL[15] = float[15](${glslArray(LINEAR_SRGB_WEIGHTS.map((value) => value[1]))});
const float DISPLAY_LINEAR_SRGB_B_BY_CHANNEL[15] = float[15](${glslArray(LINEAR_SRGB_WEIGHTS.map((value) => value[2]))});
uniform usampler2D uStellarScreenIndex;
uniform sampler2D uStellarPalette;
uniform int uViewportHeight;
uniform float uExposureModifier;
uniform int uApplySrgbOutputEncoding;
layout(location = 0) out vec4 outColor;
float linearSrgbChannelToDisplaySrgb(float value) {
	float clamped = clamp(value, 0.0, 1.0);
	return clamped <= 0.0031308
		? 12.92 * clamped
		: 1.055 * pow(clamped, 1.0 / 2.4) - 0.055;
}
void main() {
	ivec2 pixel = ivec2(int(gl_FragCoord.x), uViewportHeight - 1 - int(gl_FragCoord.y));
	uint paletteIndex = texelFetch(uStellarScreenIndex, pixel, 0).r;
	vec3 linearSrgb = vec3(0.0);
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float stellarBoundaryRadiance = texelFetch(uStellarPalette, ivec2(channelIndex, int(paletteIndex)), 0).r;
		linearSrgb.r += stellarBoundaryRadiance * DISPLAY_LINEAR_SRGB_R_BY_CHANNEL[channelIndex];
		linearSrgb.g += stellarBoundaryRadiance * DISPLAY_LINEAR_SRGB_G_BY_CHANNEL[channelIndex];
		linearSrgb.b += stellarBoundaryRadiance * DISPLAY_LINEAR_SRGB_B_BY_CHANNEL[channelIndex];
	}
	vec3 mapped = clamp(vec3(1.0) - exp(-max(linearSrgb, vec3(0.0)) * DISPLAY_TONE_MAP_K * uExposureModifier), vec3(0.0), vec3(1.0));
	vec3 outputRgb = uApplySrgbOutputEncoding == 1
		? vec3(
			linearSrgbChannelToDisplaySrgb(mapped.r),
			linearSrgbChannelToDisplaySrgb(mapped.g),
			linearSrgbChannelToDisplaySrgb(mapped.b)
		)
		: mapped;
	outColor = vec4(outputRgb, 1.0);
}`;

const PRESENT_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uMappedColor;
layout(location = 0) out vec4 outColor;
void main() {
	outColor = texelFetch(uMappedColor, ivec2(gl_FragCoord.xy), 0);
}`;

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function compileShader(gl, type, source) {
	const shader = gl.createShader(type);
	requireCondition(shader, 'WebGL2 failed to allocate a render shader.');
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`Screen-palette render shader compilation failed: ${log}`);
	}
	return shader;
}

function createProgram(gl, fragmentSource) {
	const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
	const program = gl.createProgram();
	requireCondition(program, 'WebGL2 failed to allocate a render program.');
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error(`Screen-palette render program link failed: ${log}`);
	}
	return program;
}

async function loadProduct(config) {
	const [matrixBuffer, paletteBuffer] = await Promise.all([
		fetch(config.matrixUrl).then((response) => response.arrayBuffer()),
		fetch(config.paletteUrl).then((response) => response.arrayBuffer()),
	]);
	const product = {
		viewport: config.viewport,
		identities: config.identities,
		pixelIndex: new Uint16Array(matrixBuffer),
		palette: new Float32Array(paletteBuffer),
	};
	requireCondition(product.pixelIndex.length === config.viewport.width * config.viewport.height, 'Render matrix length is invalid.');
	requireCondition(product.palette.length === config.paletteEntryCount * CHANNEL_COUNT, 'Render palette length is invalid.');
	return product;
}

function createFloatTarget(gl, width, height) {
	requireCondition(gl.getExtension('EXT_color_buffer_float'), 'EXT_color_buffer_float is required for the mapped-radiance target.');
	const texture = gl.createTexture();
	const framebuffer = gl.createFramebuffer();
	requireCondition(texture && framebuffer, 'WebGL2 failed to allocate the render target.');
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	requireCondition(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE, 'Mapped-radiance framebuffer is incomplete.');
	return {texture, framebuffer};
}

function summarizeFloatPixels(values) {
	let maximumChannel = 0;
	let nonzeroPixelCount = 0;
	let brightestPixelLinearIndex = 0;
	for (let pixel = 0; pixel < values.length / 4; pixel += 1) {
		const peak = Math.max(values[pixel * 4], values[pixel * 4 + 1], values[pixel * 4 + 2]);
		if (peak > 0) nonzeroPixelCount += 1;
		if (peak > maximumChannel) {
			maximumChannel = peak;
			brightestPixelLinearIndex = pixel;
		}
	}
	return {maximumChannel, nonzeroPixelCount, brightestPixelLinearIndex};
}

function summarizeBytePixels(values) {
	let maximumChannel = 0;
	let nonblackPixelCount = 0;
	for (let pixel = 0; pixel < values.length / 4; pixel += 1) {
		const peak = Math.max(values[pixel * 4], values[pixel * 4 + 1], values[pixel * 4 + 2]);
		if (peak > 0) nonblackPixelCount += 1;
		maximumChannel = Math.max(maximumChannel, peak);
	}
	return {maximumChannel, nonblackPixelCount};
}

export async function runScreenPaletteRenderBrowser() {
	await window.stellarRenderProgress?.('browser-start');
	const config = await fetch('/browser/config.json').then((response) => response.json());
	const canvas = document.querySelector('canvas');
	canvas.width = config.viewport.width;
	canvas.height = config.viewport.height;
	const gl = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		preserveDrawingBuffer: true,
	});
	requireCondition(gl, 'A real WebGL2 context is required for the screen-palette render.');
	const product = await loadProduct(config);
	const resource = new StellarScreenPaletteGpuResource(gl, product);
	const renderProgram = createProgram(gl, RENDER_FRAGMENT_SHADER);
	const presentProgram = createProgram(gl, PRESENT_FRAGMENT_SHADER);
	const target = createFloatTarget(gl, config.viewport.width, config.viewport.height);
	const vao = gl.createVertexArray();
	requireCondition(vao, 'WebGL2 failed to allocate the render vertex array.');
	gl.bindVertexArray(vao);
	gl.disable(gl.BLEND);
	gl.disable(gl.DEPTH_TEST);
	const renderVariant = (id, exposureModifier, applySrgbOutputEncoding) => {
		requireCondition(Number.isFinite(exposureModifier) && exposureModifier > 0, 'Render exposure modifier must be positive and finite.');
		gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
		gl.viewport(0, 0, config.viewport.width, config.viewport.height);
		gl.useProgram(renderProgram);
		resource.bindForLookup({matrixTextureUnit: 0, paletteTextureUnit: 1});
		gl.uniform1i(gl.getUniformLocation(renderProgram, 'uStellarScreenIndex'), 0);
		gl.uniform1i(gl.getUniformLocation(renderProgram, 'uStellarPalette'), 1);
		gl.uniform1i(gl.getUniformLocation(renderProgram, 'uViewportHeight'), config.viewport.height);
		gl.uniform1f(gl.getUniformLocation(renderProgram, 'uExposureModifier'), exposureModifier);
		gl.uniform1i(
			gl.getUniformLocation(renderProgram, 'uApplySrgbOutputEncoding'),
			applySrgbOutputEncoding ? 1 : 0,
		);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		const floatPixels = new Float32Array(config.viewport.width * config.viewport.height * 4);
		gl.readPixels(0, 0, config.viewport.width, config.viewport.height, gl.RGBA, gl.FLOAT, floatPixels);
		const floatSummary = summarizeFloatPixels(floatPixels);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, config.viewport.width, config.viewport.height);
		gl.useProgram(presentProgram);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, target.texture);
		gl.uniform1i(gl.getUniformLocation(presentProgram, 'uMappedColor'), 0);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		gl.finish();
		const bytePixels = new Uint8Array(config.viewport.width * config.viewport.height * 4);
		gl.readPixels(0, 0, config.viewport.width, config.viewport.height, gl.RGBA, gl.UNSIGNED_BYTE, bytePixels);
		return {
			id,
			exposureModifier,
			applySrgbOutputEncoding,
			floatSummary,
			byteSummary: summarizeBytePixels(bytePixels),
			imagePngDataUrl: canvas.toDataURL('image/png'),
		};
	};
	const variants = [
		renderVariant('baseline-linear-output', 1, false),
		renderVariant('production-exposure-linear-output', config.exposure.exposureModifier, false),
		renderVariant('baseline-srgb-output', 1, true),
		renderVariant('production-exposure-srgb-output', config.exposure.exposureModifier, true),
	];
	const occupiedPixelCount = product.pixelIndex.reduce((count, index) => count + (index === 0 ? 0 : 1), 0);

	resource.dispose();
	gl.deleteTexture(target.texture);
	gl.deleteFramebuffer(target.framebuffer);
	gl.deleteProgram(renderProgram);
	gl.deleteProgram(presentProgram);
	gl.deleteVertexArray(vao);
	await window.stellarRenderProgress?.('browser-complete');
	return {
		renderId: 'stellar-screen-palette-san-jose-sunset-plus-three-hours-unattenuated-bruneton-v1',
		variants,
		viewport: config.viewport,
		occupiedPixelCount,
		paletteEntryCount: config.paletteEntryCount,
		display: {
			colorModel: 'Bruneton Figure-1 E8 native-15 projection',
			toneMapK: DISPLAY_TONE_MAP_K,
			exposureApplication: 'toneMapK * exposureModifier',
			temporaryOutputEncoding: 'standard sRGB OETF after Bruneton mapping when variant enables it',
		},
		exposure: config.exposure,
		composition: {
			pathRadiance: 'exact zero',
			viewTransmittance: 'exact one (unattenuated upper-bound diagnostic)',
			visibility: 'one for every cache-occupied pixel',
			indexFetchesPerPixel: 1,
			paletteScalarFetchesPerPixel: 15,
			catalogIterationsPerPixel: 0,
		},
		capabilities: {
			api: gl.getParameter(gl.VERSION),
			vendor: gl.getParameter(gl.VENDOR),
			renderer: gl.getParameter(gl.RENDERER),
		},
	};
}

export const SCREEN_PALETTE_RENDER_FRAGMENT_SHADER = RENDER_FRAGMENT_SHADER;
