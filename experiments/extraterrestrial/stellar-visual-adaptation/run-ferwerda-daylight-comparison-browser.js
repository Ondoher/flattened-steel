import {StellarScreenPaletteGpuResource} from '../stellar-screen-palette/StellarScreenPaletteGpuResource.js';
import {FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER} from './run-ferwerda-screen-palette-browser.js';

const VERTEX_SHADER = `#version 300 es
void main(){vec2 p=gl_VertexID==0?vec2(-1,-1):gl_VertexID==1?vec2(3,-1):vec2(-1,3);gl_Position=vec4(p,0,1);}`;
const PRESENT_SHADER = `#version 300 es
precision highp float;uniform sampler2D uMappedColor;layout(location=0)out vec4 outColor;void main(){outColor=texelFetch(uMappedColor,ivec2(gl_FragCoord.xy),0);}`;

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function compile(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
	return shader;
}

function createProgram(gl, fragmentSource) {
	const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
	const program = gl.createProgram();
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
	return program;
}

async function loadProduct(condition) {
	const [matrix, palette] = await Promise.all([
		fetch(condition.matrixUrl).then((response) => response.arrayBuffer()),
		fetch(condition.paletteUrl).then((response) => response.arrayBuffer()),
	]);
	const product = {
		viewport: condition.viewport,
		identities: condition.identities,
		pixelIndex: new Uint16Array(matrix),
		palette: new Float32Array(palette),
	};
	requireCondition(product.pixelIndex.length === condition.viewport.width * condition.viewport.height, 'Invalid matrix length.');
	requireCondition(product.palette.length === condition.paletteEntryCount * 15, 'Invalid palette length.');
	return product;
}

function createTarget(gl, width, height) {
	requireCondition(gl.getExtension('EXT_color_buffer_float'), 'EXT_color_buffer_float is required.');
	const texture = gl.createTexture();
	const framebuffer = gl.createFramebuffer();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	requireCondition(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE, 'Float framebuffer incomplete.');
	return {texture, framebuffer};
}

function summarize(values, stride, maximumValue) {
	let maximumChannel = 0;
	let nonblackPixelCount = 0;
	for (let index = 0; index < values.length; index += stride) {
		const peak = Math.max(values[index], values[index + 1], values[index + 2]);
		if (peak > 0) nonblackPixelCount += 1;
		maximumChannel = Math.max(maximumChannel, peak);
	}
	return {maximumChannel, nonblackPixelCount, maximumValue};
}

export async function runFerwerdaDaylightComparisonBrowser() {
	await window.stellarRenderProgress?.('browser-start');
	const config = await fetch('/browser/config.json').then((response) => response.json());
	const canvas = document.querySelector('canvas');
	canvas.width = config.viewport.width;
	canvas.height = config.viewport.height;
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true});
	requireCondition(gl, 'WebGL2 is required.');
	const renderProgram = createProgram(gl, FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER);
	const presentProgram = createProgram(gl, PRESENT_SHADER);
	const target = createTarget(gl, config.viewport.width, config.viewport.height);
	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);
	gl.disable(gl.BLEND);
	gl.disable(gl.DEPTH_TEST);
	const results = [];
	for (const condition of config.conditions) {
		const product = await loadProduct(condition);
		const resource = new StellarScreenPaletteGpuResource(gl, product);
		gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
		gl.viewport(0, 0, config.viewport.width, config.viewport.height);
		gl.useProgram(renderProgram);
		resource.bindForLookup({matrixTextureUnit: 0, paletteTextureUnit: 1});
		gl.uniform1i(gl.getUniformLocation(renderProgram, 'uStellarScreenIndex'), 0);
		gl.uniform1i(gl.getUniformLocation(renderProgram, 'uStellarPalette'), 1);
		gl.uniform1i(gl.getUniformLocation(renderProgram, 'uViewportHeight'), config.viewport.height);
		gl.uniform1i(gl.getUniformLocation(renderProgram, 'uColorModel'), 1);
		gl.uniform1f(gl.getUniformLocation(renderProgram, 'uExposureModifier'), 1);
		gl.uniform1fv(gl.getUniformLocation(renderProgram, 'uScotopicWeights[0]'), config.scotopicWeights);
		gl.uniform1f(gl.getUniformLocation(renderProgram, 'uFerwerdaConeScale'), condition.ferwerda.coneScale);
		gl.uniform1f(gl.getUniformLocation(renderProgram, 'uFerwerdaRodScale'), condition.ferwerda.rodScale);
		gl.uniform1f(gl.getUniformLocation(renderProgram, 'uFerwerdaRodBlend'), condition.ferwerda.rodBlend);
		gl.uniform1f(gl.getUniformLocation(renderProgram, 'uFerwerdaDisplayMaximum'), condition.ferwerda.displayMaximumLuminance);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		const floats = new Float32Array(config.viewport.width * config.viewport.height * 4);
		gl.readPixels(0, 0, config.viewport.width, config.viewport.height, gl.RGBA, gl.FLOAT, floats);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, config.viewport.width, config.viewport.height);
		gl.useProgram(presentProgram);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, target.texture);
		gl.uniform1i(gl.getUniformLocation(presentProgram, 'uMappedColor'), 0);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		gl.finish();
		const bytes = new Uint8Array(config.viewport.width * config.viewport.height * 4);
		gl.readPixels(0, 0, config.viewport.width, config.viewport.height, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
		results.push({
			id: condition.id,
			instant: condition.instant,
			ferwerda: condition.ferwerda,
			occupiedPixelCount: product.pixelIndex.reduce((count, value) => count + (value === 0 ? 0 : 1), 0),
			paletteEntryCount: condition.paletteEntryCount,
			floatSummary: summarize(floats, 4, 1),
			byteSummary: summarize(bytes, 4, 255),
			imagePngDataUrl: canvas.toDataURL('image/png'),
		});
		resource.dispose();
	}
	gl.deleteTexture(target.texture);
	gl.deleteFramebuffer(target.framebuffer);
	gl.deleteProgram(renderProgram);
	gl.deleteProgram(presentProgram);
	gl.deleteVertexArray(vao);
	await window.stellarRenderProgress?.('browser-complete');
	return {
		renderId: 'stellar-ferwerda-cone-plus-rod-daylight-comparison-v1',
		results,
		composition: {indexFetchesPerPixel: 1, paletteScalarFetchesPerPixel: 15, catalogIterationsPerPixel: 0, atmosphere: 'unattenuated star-only upper bound', background: 'pure black'},
		capabilities: {api: gl.getParameter(gl.VERSION), vendor: gl.getParameter(gl.VENDOR), renderer: gl.getParameter(gl.RENDERER)},
	};
}
