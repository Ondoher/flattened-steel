import {
	STELLAR_SCREEN_PALETTE_COMPOSITION_FRAGMENT_SHADER,
	STELLAR_SCREEN_PALETTE_COMPOSITION_VERTEX_SHADER,
	composeStellarBoundaryRadiance,
} from './StellarScreenPaletteAtmosphereComposer.js';
import {StellarScreenPaletteGpuResource} from './StellarScreenPaletteGpuResource.js';

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

async function loadProduct(descriptor) {
	const [matrixBuffer, paletteBuffer] = await Promise.all([
		fetch(descriptor.matrixUrl).then((response) => response.arrayBuffer()),
		fetch(descriptor.paletteUrl).then((response) => response.arrayBuffer()),
	]);
	const product = {
		identities: descriptor.identities,
		viewport: descriptor.viewport,
		pixelIndex: new Uint16Array(matrixBuffer),
		palette: new Float32Array(paletteBuffer),
	};
	requireCondition(
		product.pixelIndex.length === product.viewport.width * product.viewport.height,
		'Composition matrix length does not match the viewport.',
	);
	requireCondition(
		product.palette.length === descriptor.paletteEntryCount * 15,
		'Composition palette length does not match its descriptor.',
	);
	return product;
}

function compileShader(gl, type, source) {
	const shader = gl.createShader(type);
	if (!shader) throw new Error('WebGL2 failed to allocate a composition shader.');
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`Composition shader compilation failed: ${log}`);
	}
	return shader;
}

function createProgram(gl) {
	const vertex = compileShader(
		gl,
		gl.VERTEX_SHADER,
		STELLAR_SCREEN_PALETTE_COMPOSITION_VERTEX_SHADER,
	);
	const fragment = compileShader(
		gl,
		gl.FRAGMENT_SHADER,
		STELLAR_SCREEN_PALETTE_COMPOSITION_FRAGMENT_SHADER,
	);
	const program = gl.createProgram();
	if (!program) throw new Error('WebGL2 failed to allocate a composition program.');
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error(`Composition program link failed: ${log}`);
	}
	return program;
}

function createOutput(gl) {
	requireCondition(
		gl.getParameter(gl.MAX_DRAW_BUFFERS) >= 4
			&& gl.getParameter(gl.MAX_COLOR_ATTACHMENTS) >= 4,
		'Native-15 proof requires four floating-point draw buffers.',
	);
	const framebuffer = gl.createFramebuffer();
	if (!framebuffer) throw new Error('WebGL2 failed to allocate the composition framebuffer.');
	const textures = [];
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	for (let attachmentIndex = 0; attachmentIndex < 4; attachmentIndex += 1) {
		const texture = gl.createTexture();
		if (!texture) throw new Error('WebGL2 failed to allocate a composition target.');
		textures.push(texture);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0 + attachmentIndex,
			gl.TEXTURE_2D,
			texture,
			0,
		);
	}
	gl.drawBuffers([
		gl.COLOR_ATTACHMENT0,
		gl.COLOR_ATTACHMENT1,
		gl.COLOR_ATTACHMENT2,
		gl.COLOR_ATTACHMENT3,
	]);
	requireCondition(
		gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE,
		'Native-15 composition framebuffer is incomplete.',
	);
	return {framebuffer, textures};
}

function readNative15(gl) {
	const values = [];
	for (let attachmentIndex = 0; attachmentIndex < 4; attachmentIndex += 1) {
		gl.readBuffer(gl.COLOR_ATTACHMENT0 + attachmentIndex);
		const output = new Float32Array(4);
		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, output);
		const retained = attachmentIndex === 3 ? 3 : 4;
		values.push(...output.slice(0, retained));
	}
	return values;
}

function float32Oracle({pathRadiance, viewTransmittance, stellarBoundaryRadiance, sceneHitMask, horizonMask}) {
	const visibility = sceneHitMask < 0.5 && horizonMask < 0.5 ? 1 : 0;
	return pathRadiance.map((value, channelIndex) => {
		const path = Math.fround(value);
		const transmittance = Math.fround(viewTransmittance[channelIndex]);
		const stellar = Math.fround(stellarBoundaryRadiance[channelIndex]);
		const transported = Math.fround(
			Math.fround(visibility * transmittance) * stellar,
		);
		return Math.fround(path + transported);
	});
}

function errors(actual, expected) {
	let maximumAbsolute = 0;
	let maximumRelative = 0;
	for (let index = 0; index < expected.length; index += 1) {
		const absolute = Math.abs(actual[index] - expected[index]);
		maximumAbsolute = Math.max(maximumAbsolute, absolute);
		maximumRelative = Math.max(
			maximumRelative,
			absolute / Math.max(Math.abs(expected[index]), 1e-30),
		);
	}
	return {maximumAbsolute, maximumRelative};
}

function executeCase(gl, program, output, resource, product, testCase) {
	const linearIndex = testCase.pixel.y * product.viewport.width + testCase.pixel.x;
	const paletteIndex = product.pixelIndex[linearIndex];
	const stellarBoundaryRadiance = Array.from(
		product.palette.slice(paletteIndex * 15, paletteIndex * 15 + 15),
	);
	const request = {...testCase, stellarBoundaryRadiance};
	const binary64Expected = composeStellarBoundaryRadiance(request);
	const binary32Expected = float32Oracle(request);
	const squaredTransmittanceExpected = composeStellarBoundaryRadiance({
		...request,
		viewTransmittance: request.viewTransmittance.map((value) => value * value),
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, output.framebuffer);
	gl.viewport(0, 0, 1, 1);
	gl.useProgram(program);
	resource.bindForLookup({matrixTextureUnit: 0, paletteTextureUnit: 1});
	gl.uniform1i(gl.getUniformLocation(program, 'uStellarScreenIndex'), 0);
	gl.uniform1i(gl.getUniformLocation(program, 'uStellarPalette'), 1);
	gl.uniform2i(
		gl.getUniformLocation(program, 'uPixelCoordinate'),
		testCase.pixel.x,
		testCase.pixel.y,
	);
	gl.uniform1fv(
		gl.getUniformLocation(program, 'uPathRadiance[0]'),
		Float32Array.from(testCase.pathRadiance),
	);
	gl.uniform1fv(
		gl.getUniformLocation(program, 'uViewTransmittance[0]'),
		Float32Array.from(testCase.viewTransmittance),
	);
	gl.uniform1f(gl.getUniformLocation(program, 'uSceneHitMask'), testCase.sceneHitMask);
	gl.uniform1f(gl.getUniformLocation(program, 'uHorizonMask'), testCase.horizonMask);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	const actual = readNative15(gl);
	return {
		id: testCase.id,
		product: testCase.product,
		pixel: testCase.pixel,
		paletteIndex,
		actual,
		binary32Expected,
		binary64Expected,
		binary32Error: errors(actual, binary32Expected),
		binary64Error: errors(actual, binary64Expected),
		squaredTransmittanceError: errors(actual, squaredTransmittanceExpected),
	};
}

/** Execute the numerical, cache-only atmosphere composition proof. */
export async function runAtmosphereCompositionBrowserProof() {
	const report = async (stage) => {
		if (typeof globalThis.stellarCompositionProgress === 'function') {
			await globalThis.stellarCompositionProgress(stage);
		}
	};
	await report('composition-browser-entered');
	const config = await fetch('/browser/config.json').then((response) => response.json());
	const products = Object.fromEntries(await Promise.all(
		Object.entries(config.products).map(async ([name, descriptor]) => [
			name,
			await loadProduct(descriptor),
		]),
	));
	const canvas = document.createElement('canvas');
	canvas.width = 1;
	canvas.height = 1;
	const gl = canvas.getContext('webgl2', {
		antialias: false,
		alpha: false,
		depth: false,
		stencil: false,
		preserveDrawingBuffer: true,
	});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	requireCondition(
		gl.getExtension('EXT_color_buffer_float'),
		'EXT_color_buffer_float is required for native-15 readback.',
	);
	const resources = Object.fromEntries(Object.entries(products).map(([name, product]) => [
		name,
		new StellarScreenPaletteGpuResource(gl, product),
	]));
	const program = createProgram(gl);
	const output = createOutput(gl);
	const vertexArray = gl.createVertexArray();
	if (!vertexArray) throw new Error('WebGL2 failed to allocate a composition vertex array.');
	gl.bindVertexArray(vertexArray);
	try {
		const results = config.cases.map((testCase) => executeCase(
			gl,
			program,
			output,
			resources[testCase.product],
			products[testCase.product],
			testCase,
		));
		requireCondition(gl.getError() === gl.NO_ERROR, 'Composition proof produced a WebGL error.');
		await report('composition-cases-complete');
		return {
			capabilities: {
				api: gl.getParameter(gl.VERSION),
				shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
				maximumDrawBuffers: gl.getParameter(gl.MAX_DRAW_BUFFERS),
				maximumColorAttachments: gl.getParameter(gl.MAX_COLOR_ATTACHMENTS),
			},
			caseCount: results.length,
			drawCount: results.length,
			results,
		};
	} finally {
		gl.bindVertexArray(null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.deleteVertexArray(vertexArray);
		gl.deleteProgram(program);
		gl.deleteFramebuffer(output.framebuffer);
		for (const texture of output.textures) gl.deleteTexture(texture);
		for (const resource of Object.values(resources)) resource.dispose();
	}
}
