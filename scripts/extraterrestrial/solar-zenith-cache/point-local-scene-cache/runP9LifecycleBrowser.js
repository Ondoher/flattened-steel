const WIDTH = 4374;
const HEIGHT = 617;
const LAYERS = 15;
const SCALAR_BYTES = 4;
const PAYLOAD_BYTES = WIDTH * HEIGHT * LAYERS * SCALAR_BYTES;

function requireCondition(value, message) { if (!value) throw new Error(message); }

function compile(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
	return shader;
}

function createProgram(gl) {
	const vertex = compile(gl, gl.VERTEX_SHADER, `#version 300 es
void main(){vec2 p=gl_VertexID==0?vec2(-1):gl_VertexID==1?vec2(3,-1):vec2(-1,3);gl_Position=vec4(p,0,1);}`);
	const fragment = compile(gl, gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;precision highp int;uniform highp sampler2DArray uCache;layout(location=0)out vec4 color;
void main(){float total=0.0;int row=int(mod(gl_FragCoord.y,617.0));int base=int(mod(gl_FragCoord.x,4370.0));for(int c=0;c<15;c++){for(int t=0;t<16;t++){total+=texelFetch(uCache,ivec3((base+t*271)%4374,row,c),0).r;}}color=vec4(total,total*0.5,total*0.25,1.0);}`);
	const program = gl.createProgram();
	gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
	gl.deleteShader(vertex); gl.deleteShader(fragment);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
	return program;
}

function allocateCache(gl, payload, uploadLayers = LAYERS) {
	const texture = gl.createTexture();
	requireCondition(texture, 'Could not create cache texture.');
	gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.R32F, WIDTH, HEIGHT, LAYERS);
	const layerScalars = WIDTH * HEIGHT;
	for (let layer = 0; layer < uploadLayers; layer += 1) {
		const values = payload.subarray(layer * layerScalars, (layer + 1) * layerScalars);
		gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, WIDTH, HEIGHT, 1,
			gl.RED, gl.FLOAT, values);
	}
	gl.finish();
	requireCondition(gl.getError() === gl.NO_ERROR, 'Cache allocation/upload produced a WebGL error.');
	return texture;
}

function readProbe(gl, texture, layer = 7, x = 2187, y = 308) {
	const framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, texture, 0, layer);
	requireCondition(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE,
		'Cache probe framebuffer is incomplete.');
	const value = new Float32Array(1);
	gl.readPixels(x, y, 1, 1, gl.RED, gl.FLOAT, value);
	gl.deleteFramebuffer(framebuffer);
	requireCondition(gl.getError() === gl.NO_ERROR, 'Cache probe readback failed.');
	return value[0];
}

async function contextCycle(canvas, gl) {
	const extension = gl.getExtension('WEBGL_lose_context');
	if (!extension) return {supported: false, restored: false};
	await new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error('Context restoration timed out.')), 10000);
		canvas.addEventListener('webglcontextlost', (event) => {
			event.preventDefault();
			setTimeout(() => extension.restoreContext(), 0);
		}, {once: true});
		canvas.addEventListener('webglcontextrestored', () => {
			clearTimeout(timeout);
			resolve();
		}, {once: true});
		extension.loseContext();
	});
	return {supported: true, restored: !gl.isContextLost()};
}

function measureLookupFrames(gl, texture) {
	const program = createProgram(gl);
	const vertexArray = gl.createVertexArray();
	gl.bindVertexArray(vertexArray);
	gl.useProgram(program);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
	gl.uniform1i(gl.getUniformLocation(program, 'uCache'), 0);
	gl.viewport(0, 0, 640, 400);
	for (let index = 0; index < 3; index += 1) gl.drawArrays(gl.TRIANGLES, 0, 3);
	gl.finish();
	const samples = [];
	for (let index = 0; index < 12; index += 1) {
		const started = performance.now();
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		gl.finish();
		samples.push(performance.now() - started);
	}
	gl.deleteProgram(program);
	gl.deleteVertexArray(vertexArray);
	return {kernel: '640x400, one 16-tap Native15 cache reconstruction per pixel', samples,
		meanMilliseconds: samples.reduce((sum, value) => sum + value, 0) / samples.length,
		maximumMilliseconds: Math.max(...samples)};
}

export async function runP9LifecycleBrowser() {
	const mark = async (stage) => globalThis.pointLocalProgress?.(`p9-lifecycle:${stage}`);
	const canvas = document.createElement('canvas');
	canvas.width = 640; canvas.height = 400;
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false,
		depth: false, stencil: false, preserveDrawingBuffer: true,
		powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	requireCondition(gl.getExtension('EXT_color_buffer_float'), 'EXT_color_buffer_float is required.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const gpu = {api: gl.getParameter(gl.VERSION),
		renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)};
	const capabilities = {maximumTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
		maximumArrayTextureLayers: gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS),
		maximum3dTextureSize: gl.getParameter(gl.MAX_3D_TEXTURE_SIZE)};
	requireCondition(WIDTH <= capabilities.maximumTextureSize && HEIGHT <= capabilities.maximumTextureSize
		&& LAYERS <= capabilities.maximumArrayTextureLayers, 'Selected cache exceeds WebGL texture limits.');
	await mark('load-start');
	const loadStarted = performance.now();
	const response = await fetch('/asset/cache/nautical-twilight-native15-c4-w27.f32');
	requireCondition(response.ok, 'Selected W27 cache asset is unavailable.');
	const buffer = await response.arrayBuffer();
	const loadMilliseconds = performance.now() - loadStarted;
	await mark('load-complete');
	requireCondition(buffer.byteLength === PAYLOAD_BYTES, 'Selected W27 cache byte length changed.');
	const payload = new Float32Array(buffer);

	await mark('upload-a-start');
	const uploadAStarted = performance.now();
	const cacheA = allocateCache(gl, payload);
	const uploadAMilliseconds = performance.now() - uploadAStarted;
	await mark('upload-a-complete');
	let active = {id: 'cache-a', texture: cacheA};
	const initialProbe = readProbe(gl, active.texture);
	const publicationStarted = performance.now();
	const firstPublication = {published: active.id, milliseconds: performance.now() - publicationStarted};

	const failedCandidate = allocateCache(gl, payload, 1);
	gl.deleteTexture(failedCandidate);
	const failurePreservation = {activeBefore: active.id, activeAfter: active.id,
		probeAfter: readProbe(gl, active.texture), abandonedDeleted: !gl.isTexture(failedCandidate)};

	await mark('upload-b-start');
	const uploadBStarted = performance.now();
	const cacheB = allocateCache(gl, payload);
	const uploadBMilliseconds = performance.now() - uploadBStarted;
	await mark('upload-b-complete');
	const previous = active;
	active = {id: 'cache-b', texture: cacheB};
	const replacementProbe = readProbe(gl, active.texture);
	gl.deleteTexture(previous.texture);
	const atomicReplacement = {previousId: previous.id, activeId: active.id,
		previousDeletedAfterPublication: !gl.isTexture(previous.texture),
		probeBefore: initialProbe, probeAfter: replacementProbe};

	const superseded = allocateCache(gl, payload, 1);
	gl.deleteTexture(superseded);
	const supersession = {activeId: active.id, activeProbe: readProbe(gl, active.texture),
		supersededDeleted: !gl.isTexture(superseded)};
	await mark('frame-kernel-start');
	const frameCost = measureLookupFrames(gl, active.texture);
	await mark('frame-kernel-complete');

	await mark('context-cycle-start');
	const cycle = await contextCycle(canvas, gl);
	await mark('context-cycle-complete');
	requireCondition(cycle.restored, 'WebGL context did not restore.');
	requireCondition(gl.getExtension('EXT_color_buffer_float'),
		'EXT_color_buffer_float was not restored with the WebGL context.');
	await mark('restore-upload-start');
	const restoreStarted = performance.now();
	const restoredTexture = allocateCache(gl, payload);
	const restoreMilliseconds = performance.now() - restoreStarted;
	await mark('restore-upload-complete');
	active = {id: 'cache-restored', texture: restoredTexture};
	const restoredProbe = readProbe(gl, active.texture);
	gl.deleteTexture(active.texture);
	const disposal = {disposedId: active.id, deleted: !gl.isTexture(active.texture)};
	return {schemaId: 'point-local-p9-lifecycle-browser-result-v1',
		gpu,
		capabilities, payloadBytes: PAYLOAD_BYTES,
		timings: {loadMilliseconds, uploadAMilliseconds, uploadBMilliseconds,
			restoreMilliseconds, firstPublication, frameCost},
		probes: {initialProbe, replacementProbe, restoredProbe},
		failurePreservation, atomicReplacement, supersession,
		contextRestoration: {...cycle, restoredProbe}, disposal,
		memory: {stagingPayloadBytes: PAYLOAD_BYTES, steadyResidentTexelBytes: PAYLOAD_BYTES,
			transitionResidentTexelBytes: PAYLOAD_BYTES * 2,
			transitionIncludingStagingBytes: PAYLOAD_BYTES * 3,
			driverAllocation: {observedCommittedTexelLowerBoundBytes: PAYLOAD_BYTES,
				opaqueDriverOverheadObservableThroughWebGL: false}},
	};
}
