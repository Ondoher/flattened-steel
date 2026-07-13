import {StellarScreenPaletteGpuController} from './StellarScreenPaletteGpuController.js';

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

async function loadProduct(descriptor) {
	const [matrixBuffer, paletteBuffer] = await Promise.all([
		fetch(descriptor.matrixUrl).then((response) => {
			if (!response.ok) throw new Error(`Matrix fetch failed: ${response.status}`);
			return response.arrayBuffer();
		}),
		fetch(descriptor.paletteUrl).then((response) => {
			if (!response.ok) throw new Error(`Palette fetch failed: ${response.status}`);
			return response.arrayBuffer();
		}),
	]);
	const product = {
		identities: descriptor.identities,
		viewport: descriptor.viewport,
		pixelIndex: new Uint16Array(matrixBuffer),
		palette: new Float32Array(paletteBuffer),
	};
	requireCondition(
		product.pixelIndex.length === product.viewport.width * product.viewport.height,
		'Loaded matrix byte length does not match its viewport.',
	);
	requireCondition(
		product.palette.length === descriptor.paletteEntryCount * 15,
		'Loaded palette byte length does not match its entry count.',
	);
	return product;
}

function compileShader(gl, type, source) {
	const shader = gl.createShader(type);
	if (!shader) throw new Error('WebGL2 failed to allocate a lookup shader.');
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`Lookup shader compilation failed: ${log}`);
	}
	return shader;
}

function createLookupProgram(gl) {
	const vertex = compileShader(gl, gl.VERTEX_SHADER, `#version 300 es
void main() {
	vec2 position = gl_VertexID == 0 ? vec2(-1.0, -1.0)
		: gl_VertexID == 1 ? vec2(3.0, -1.0)
		: vec2(-1.0, 3.0);
	gl_Position = vec4(position, 0.0, 1.0);
}`);
	const fragment = compileShader(gl, gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;
uniform usampler2D matrixTexture;
uniform sampler2D paletteTexture;
uniform ivec2 pixelCoordinate;
uniform int wavelengthIndex;
out vec4 outputValue;
void main() {
	uint paletteIndex = texelFetch(matrixTexture, pixelCoordinate, 0).r;
	float value = texelFetch(
		paletteTexture,
		ivec2(wavelengthIndex, int(paletteIndex)),
		0
	).r;
	outputValue = vec4(value, float(paletteIndex), 0.0, 1.0);
}`);
	const program = gl.createProgram();
	if (!program) throw new Error('WebGL2 failed to allocate a lookup program.');
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error(`Lookup program link failed: ${log}`);
	}
	return program;
}

function samplePixelAllChannels(gl, resource, pixel) {
	requireCondition(
		gl.getExtension('EXT_color_buffer_float'),
		'EXT_color_buffer_float is required for lookup proof readback.',
	);
	const targetTexture = gl.createTexture();
	const framebuffer = gl.createFramebuffer();
	const vertexArray = gl.createVertexArray();
	const program = createLookupProgram(gl);
	if (!targetTexture || !framebuffer || !vertexArray) {
		throw new Error('WebGL2 failed to allocate lookup proof resources.');
	}
	try {
		gl.bindTexture(gl.TEXTURE_2D, targetTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			targetTexture,
			0,
		);
		requireCondition(
			gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE,
			'Lookup proof framebuffer is incomplete.',
		);
		gl.viewport(0, 0, 1, 1);
		gl.useProgram(program);
		gl.bindVertexArray(vertexArray);
		resource.bindForLookup({matrixTextureUnit: 0, paletteTextureUnit: 1});
		gl.uniform1i(gl.getUniformLocation(program, 'matrixTexture'), 0);
		gl.uniform1i(gl.getUniformLocation(program, 'paletteTexture'), 1);
		gl.uniform2i(gl.getUniformLocation(program, 'pixelCoordinate'), pixel.x, pixel.y);
		const values = [];
		const indices = [];
		for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
			gl.uniform1i(gl.getUniformLocation(program, 'wavelengthIndex'), channelIndex);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			const output = new Float32Array(4);
			gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, output);
			values.push(output[0]);
			indices.push(output[1]);
		}
		requireCondition(gl.getError() === gl.NO_ERROR, 'Lookup proof produced a WebGL error.');
		return {values, indices};
	} finally {
		gl.bindVertexArray(null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.deleteVertexArray(vertexArray);
		gl.deleteProgram(program);
		gl.deleteFramebuffer(framebuffer);
		gl.deleteTexture(targetTexture);
	}
}

function maximumAbsoluteError(actual, expected) {
	let maximum = 0;
	for (let index = 0; index < expected.length; index += 1) {
		maximum = Math.max(maximum, Math.abs(actual[index] - expected[index]));
	}
	return maximum;
}

function verifyProbe(gl, resource, probe) {
	const matrixIndex = resource.readMatrixPixel(probe.pixel.x, probe.pixel.y);
	const paletteEntry = resource.readPaletteEntry(probe.expectedIndex);
	const sampled = samplePixelAllChannels(gl, resource, probe.pixel);
	return {
		kind: probe.kind,
		pixel: probe.pixel,
		expectedIndex: probe.expectedIndex,
		matrixIndex,
		directPaletteMaximumError: maximumAbsoluteError(
			paletteEntry,
			probe.expectedSpectrum,
		),
		shaderPaletteMaximumError: maximumAbsoluteError(
			sampled.values,
			probe.expectedSpectrum,
		),
		shaderIndicesExact: sampled.indices.every((index) => index === probe.expectedIndex),
	};
}

function waitForContextCycle(canvas, controller, extension, gl) {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error('WebGL context restoration timed out.')), 10000);
		canvas.addEventListener('webglcontextlost', (event) => {
			event.preventDefault();
			try {
				controller.handleContextLost();
				setTimeout(() => extension.restoreContext(), 0);
			} catch (error) {
				clearTimeout(timeout);
				reject(error);
			}
		}, {once: true});
		canvas.addEventListener('webglcontextrestored', () => {
			try {
				const publication = controller.handleContextRestored(gl);
				clearTimeout(timeout);
				resolve(publication);
			} catch (error) {
				clearTimeout(timeout);
				reject(error);
			}
		}, {once: true});
		extension.loseContext();
	});
}

/** Run the cache-only WebGL2 upload, lookup, lifecycle, and restoration proof. */
export async function runGpuResourceBrowserProof() {
	const report = async (stage) => {
		if (typeof globalThis.stellarScreenPaletteProgress === 'function') {
			await globalThis.stellarScreenPaletteProgress(stage);
		}
	};
	await report('browser-proof-entered');
	const config = await fetch('/browser/config.json').then((response) => response.json());
	const [fixed, alternate, collision] = await Promise.all([
		loadProduct(config.products.fixed),
		loadProduct(config.products.alternate),
		loadProduct(config.products.collision),
	]);
	await report('cpu-oracles-loaded');
	const canvas = document.createElement('canvas');
	canvas.width = fixed.viewport.width;
	canvas.height = fixed.viewport.height;
	const gl = canvas.getContext('webgl2', {
		antialias: false,
		alpha: false,
		depth: false,
		stencil: false,
		preserveDrawingBuffer: true,
	});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const floatExtension = gl.getExtension('EXT_color_buffer_float');
	if (!floatExtension) throw new Error('EXT_color_buffer_float is unavailable.');
	const loseContext = gl.getExtension('WEBGL_lose_context');
	if (!loseContext) throw new Error('WEBGL_lose_context is unavailable.');
	const debugRenderer = gl.getExtension('WEBGL_debug_renderer_info');
	const controller = new StellarScreenPaletteGpuController({gl});
	try {
		const fixedPublication = controller.build(fixed);
		await report('fixed-uploaded');
		const fixedProbeResults = config.probes.fixed.map((probe) =>
			verifyProbe(gl, fixedPublication.resource, probe));
		const reuse = controller.build(fixed);
		requireCondition(reuse.reused && reuse.resource === fixedPublication.resource, 'Exact identity did not reuse the active resource.');
		let failurePreserved = false;
		try {
			controller.build(alternate, {injectFailureAfterMatrixUpload: true});
		} catch (error) {
			failurePreserved = /injected screen-palette allocation failure/u.test(error.message)
				&& controller.active === fixedPublication.resource;
		}
		const alternatePublication = controller.build(alternate);
		requireCondition(
			alternatePublication.resource !== fixedPublication.resource,
			'Changed view identity did not replace the GPU resource.',
		);
		const collisionPublication = controller.build(collision);
		const collisionProbeResults = config.probes.collision.map((probe) =>
			verifyProbe(gl, collisionPublication.resource, probe));
		await report('collision-uploaded-and-read');
		const beforeLoss = controller.describe();
		const restoredPublication = await waitForContextCycle(
			canvas,
			controller,
			loseContext,
			gl,
		);
		await report('context-restored');
		const restoredProbeResults = config.probes.collision.map((probe) =>
			verifyProbe(gl, restoredPublication.resource, probe));
		const afterRestore = controller.describe();
		const disposedOnce = controller.dispose();
		const disposedTwice = controller.dispose();
		return {
			capabilities: {
				api: gl.getParameter(gl.VERSION),
				shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
				vendor: debugRenderer
					? gl.getParameter(debugRenderer.UNMASKED_VENDOR_WEBGL)
					: gl.getParameter(gl.VENDOR),
				renderer: debugRenderer
					? gl.getParameter(debugRenderer.UNMASKED_RENDERER_WEBGL)
					: gl.getParameter(gl.RENDERER),
				maximumTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
				floatColorBuffer: Boolean(floatExtension),
				loseContext: Boolean(loseContext),
			},
			formats: fixedPublication.resource.describe(),
			fixedProbeResults,
			collisionProbeResults,
			restoredProbeResults,
			reuseExact: reuse.reused,
			failurePreserved,
			beforeLoss,
			afterRestore,
			disposedOnce,
			disposedTwice,
			finalController: controller.describe(),
		};
	} finally {
		controller.dispose();
	}
}
