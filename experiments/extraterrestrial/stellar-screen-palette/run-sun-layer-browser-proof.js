import {
	STELLAR_SCREEN_PALETTE_COMPOSITION_FRAGMENT_SHADER,
	STELLAR_SCREEN_PALETTE_COMPOSITION_VERTEX_SHADER,
} from './StellarScreenPaletteAtmosphereComposer.js';
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

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

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
uniform usampler2D uCelestialScreenIndex;
uniform sampler2D uCelestialPalette;
uniform int uViewportHeight;
uniform float uViewTransmittance[SPECTRAL_CHANNEL_COUNT];
layout(location = 0) out vec4 outColor;
void main() {
	ivec2 pixel = ivec2(int(gl_FragCoord.x), uViewportHeight - 1 - int(gl_FragCoord.y));
	uint paletteIndex = texelFetch(uCelestialScreenIndex, pixel, 0).r;
	vec3 linearSrgb = vec3(0.0);
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float boundaryRadiance = texelFetch(uCelestialPalette, ivec2(channelIndex, int(paletteIndex)), 0).r;
		float transportedRadiance = uViewTransmittance[channelIndex] * boundaryRadiance;
		linearSrgb.r += transportedRadiance * DISPLAY_LINEAR_SRGB_R_BY_CHANNEL[channelIndex];
		linearSrgb.g += transportedRadiance * DISPLAY_LINEAR_SRGB_G_BY_CHANNEL[channelIndex];
		linearSrgb.b += transportedRadiance * DISPLAY_LINEAR_SRGB_B_BY_CHANNEL[channelIndex];
	}
	vec3 mapped = clamp(vec3(1.0) - exp(-max(linearSrgb, vec3(0.0)) * DISPLAY_TONE_MAP_K), vec3(0.0), vec3(1.0));
	outColor = vec4(mapped, 1.0);
}`;

const PRESENT_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D uMappedColor;
layout(location = 0) out vec4 outColor;
void main() { outColor = texelFetch(uMappedColor, ivec2(gl_FragCoord.xy), 0); }`;

function compile(gl, type, source) {
	const shader = gl.createShader(type);
	requireCondition(shader, 'WebGL2 failed to allocate a shader.');
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`Sun-layer shader compilation failed: ${log}`);
	}
	return shader;
}

function program(gl, vertexSource, fragmentSource) {
	const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
	const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
	const output = gl.createProgram();
	requireCondition(output, 'WebGL2 failed to allocate a program.');
	gl.attachShader(output, vertex);
	gl.attachShader(output, fragment);
	gl.linkProgram(output);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(output, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(output);
		gl.deleteProgram(output);
		throw new Error(`Sun-layer program link failed: ${log}`);
	}
	return output;
}

async function loadProduct(config) {
	const [matrix, palette] = await Promise.all([
		fetch(config.matrixUrl).then((response) => response.arrayBuffer()),
		fetch(config.paletteUrl).then((response) => response.arrayBuffer()),
	]);
	return {
		viewport: config.viewport,
		identities: config.identities,
		pixelIndex: new Uint16Array(matrix),
		palette: new Float32Array(palette),
	};
}

function createNative15Target(gl) {
	const framebuffer = gl.createFramebuffer();
	const textures = [];
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	for (let index = 0; index < 4; index += 1) {
		const texture = gl.createTexture();
		textures.push(texture);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + index, gl.TEXTURE_2D, texture, 0);
	}
	gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3]);
	requireCondition(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE, 'Native-15 target is incomplete.');
	return {framebuffer, textures};
}

function readNative15(gl) {
	const values = [];
	for (let index = 0; index < 4; index += 1) {
		gl.readBuffer(gl.COLOR_ATTACHMENT0 + index);
		const channels = new Float32Array(4);
		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, channels);
		values.push(...channels.slice(0, index === 3 ? 3 : 4));
	}
	return values;
}

function executeComposition(gl, compositionProgram, target, resource, testCase) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
	gl.viewport(0, 0, 1, 1);
	gl.useProgram(compositionProgram);
	resource.bindForLookup({matrixTextureUnit: 0, paletteTextureUnit: 1});
	gl.uniform1i(gl.getUniformLocation(compositionProgram, 'uStellarScreenIndex'), 0);
	gl.uniform1i(gl.getUniformLocation(compositionProgram, 'uStellarPalette'), 1);
	gl.uniform2i(gl.getUniformLocation(compositionProgram, 'uPixelCoordinate'), testCase.pixel.x, testCase.pixel.y);
	gl.uniform1fv(gl.getUniformLocation(compositionProgram, 'uPathRadiance[0]'), Float32Array.from(testCase.pathRadiance));
	gl.uniform1fv(gl.getUniformLocation(compositionProgram, 'uViewTransmittance[0]'), Float32Array.from(testCase.viewTransmittance));
	gl.uniform1f(gl.getUniformLocation(compositionProgram, 'uSceneHitMask'), testCase.sceneHitMask);
	gl.uniform1f(gl.getUniformLocation(compositionProgram, 'uHorizonMask'), testCase.horizonMask);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	return readNative15(gl);
}

function createColorTarget(gl, width, height) {
	const texture = gl.createTexture();
	const framebuffer = gl.createFramebuffer();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	requireCondition(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE, 'Color target is incomplete.');
	return {texture, framebuffer};
}

function summarizeBytes(values) {
	let nonblackPixelCount = 0;
	let maximumChannel = 0;
	for (let pixelIndex = 0; pixelIndex < values.length / 4; pixelIndex += 1) {
		const maximum = Math.max(values[pixelIndex * 4], values[pixelIndex * 4 + 1], values[pixelIndex * 4 + 2]);
		if (maximum > 0) nonblackPixelCount += 1;
		maximumChannel = Math.max(maximumChannel, maximum);
	}
	return {nonblackPixelCount, maximumChannel};
}

/** Execute GPU readback, one-pass atmosphere composition, and cache-only Bruneton rendering. */
export async function runSunLayerBrowserProof() {
	const config = await fetch('/browser/config.json').then((response) => response.json());
	const canvas = document.querySelector('canvas');
	canvas.width = config.product.viewport.width;
	canvas.height = config.product.viewport.height;
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true});
	requireCondition(gl && gl.getExtension('EXT_color_buffer_float'), 'Real WebGL2 with EXT_color_buffer_float is required.');
	const product = await loadProduct(config.product);
	const resource = new StellarScreenPaletteGpuResource(gl, product);
	const readbacks = config.probes.map((probe) => {
		const paletteIndex = resource.readMatrixPixel(probe.pixel.x, probe.pixel.y);
		return {id: probe.id, pixel: probe.pixel, paletteIndex, spectrum: Array.from(resource.readPaletteEntry(paletteIndex))};
	});
	const compositionProgram = program(gl, STELLAR_SCREEN_PALETTE_COMPOSITION_VERTEX_SHADER, STELLAR_SCREEN_PALETTE_COMPOSITION_FRAGMENT_SHADER);
	const nativeTarget = createNative15Target(gl);
	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);
	const composition = config.compositionCases.map((testCase) => ({id: testCase.id, actual: executeComposition(gl, compositionProgram, nativeTarget, resource, testCase)}));

	const renderProgram = program(gl, STELLAR_SCREEN_PALETTE_COMPOSITION_VERTEX_SHADER, RENDER_FRAGMENT_SHADER);
	const presentProgram = program(gl, STELLAR_SCREEN_PALETTE_COMPOSITION_VERTEX_SHADER, PRESENT_FRAGMENT_SHADER);
	const colorTarget = createColorTarget(gl, product.viewport.width, product.viewport.height);
	gl.bindFramebuffer(gl.FRAMEBUFFER, colorTarget.framebuffer);
	gl.viewport(0, 0, product.viewport.width, product.viewport.height);
	gl.useProgram(renderProgram);
	resource.bindForLookup({matrixTextureUnit: 0, paletteTextureUnit: 1});
	gl.uniform1i(gl.getUniformLocation(renderProgram, 'uCelestialScreenIndex'), 0);
	gl.uniform1i(gl.getUniformLocation(renderProgram, 'uCelestialPalette'), 1);
	gl.uniform1i(gl.getUniformLocation(renderProgram, 'uViewportHeight'), product.viewport.height);
	gl.uniform1fv(gl.getUniformLocation(renderProgram, 'uViewTransmittance[0]'), Float32Array.from(config.renderTransmittance));
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, product.viewport.width, product.viewport.height);
	gl.useProgram(presentProgram);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, colorTarget.texture);
	gl.uniform1i(gl.getUniformLocation(presentProgram, 'uMappedColor'), 0);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	gl.finish();
	const bytes = new Uint8Array(product.viewport.width * product.viewport.height * 4);
	gl.readPixels(0, 0, product.viewport.width, product.viewport.height, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
	const render = {summary: summarizeBytes(bytes), imagePngDataUrl: canvas.toDataURL('image/png')};

	resource.dispose();
	for (const texture of nativeTarget.textures) gl.deleteTexture(texture);
	gl.deleteFramebuffer(nativeTarget.framebuffer);
	gl.deleteTexture(colorTarget.texture);
	gl.deleteFramebuffer(colorTarget.framebuffer);
	gl.deleteProgram(compositionProgram);
	gl.deleteProgram(renderProgram);
	gl.deleteProgram(presentProgram);
	gl.deleteVertexArray(vao);
	return {
		proofId: 'sun-over-stellar-screen-palette-browser-v1',
		capabilities: {api: gl.getParameter(gl.VERSION), vendor: gl.getParameter(gl.VENDOR), renderer: gl.getParameter(gl.RENDERER)},
		readbacks,
		composition,
		render,
		shaderTopology: {
			legacySunContributionEnabled: false,
			indexFetchSites: (RENDER_FRAGMENT_SHADER.match(/texelFetch\(uCelestialScreenIndex/gu) ?? []).length,
			paletteFetchSites: (RENDER_FRAGMENT_SHADER.match(/texelFetch\(uCelestialPalette/gu) ?? []).length,
			catalogLoopSites: (RENDER_FRAGMENT_SHADER.match(/catalog|memberIndex/giu) ?? []).length,
		},
		display: {colorModel: 'unchanged Bruneton Figure-1 E8 native-15 projection', toneMapK: DISPLAY_TONE_MAP_K},
	};
}
