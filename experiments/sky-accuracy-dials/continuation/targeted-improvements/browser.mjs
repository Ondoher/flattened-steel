/** Execute the fixed matrix in an isolated browser page. All helpers are local
 * so Puppeteer can serialize this function without module dependencies.
 * @param {SkyTargetedPayload} payload @param {SkyTargetedShaders} shaders
 * @returns {Promise<SkyTargetedGpuResult>}
 */
export async function runTargetedGpu(payload, shaders) {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {powerPreference: 'high-performance', antialias: false});
	if (!context) throw new Error('WebGL2 unavailable');
	const gl = context;
	/** @type {WebGLTexture[]} */ const textures = [];
	/** @type {WebGLProgram[]} */ const programs = [];
	/** @type {WebGLShader[]} */ const compiled = [];
	const framebuffer = gl.createFramebuffer();
	/** @param {number} type @param {string} source @returns {WebGLShader} */
	function compile(type, source) {
		const shader = gl.createShader(type);
		if (!shader) throw new Error('Shader allocation failed');
		compiled.push(shader);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(String(gl.getShaderInfoLog(shader)));
		return shader;
	}
	/** @param {string} fragment @returns {WebGLProgram} */
	function program(fragment) {
		const value = gl.createProgram();
		if (!value) throw new Error('Program allocation failed');
		programs.push(value);
		gl.attachShader(value, compile(gl.VERTEX_SHADER, shaders.vertex));
		gl.attachShader(value, compile(gl.FRAGMENT_SHADER, fragment));
		gl.linkProgram(value);
		if (!gl.getProgramParameter(value, gl.LINK_STATUS)) throw new Error(String(gl.getProgramInfoLog(value)));
		return value;
	}
	/** @param {number} width @param {number} height @param {readonly number[]|null} values @returns {WebGLTexture} */
	function texture(width, height, values) {
		if (width > gl.getParameter(gl.MAX_TEXTURE_SIZE) || height > gl.getParameter(gl.MAX_TEXTURE_SIZE))
			throw new Error('Texture limit exceeded');
		const value = gl.createTexture();
		if (!value) throw new Error('Texture allocation failed');
		textures.push(value);
		gl.bindTexture(gl.TEXTURE_2D, value);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		const data = values ? new Float32Array(width * height * 4) : null;
		if (data && values) data.set(values);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, data);
		return value;
	}
	/** @param {WebGLProgram} p @param {string} name @param {WebGLTexture} tex @param {number} unit */
	function bind(p, name, tex, unit) {
		gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.uniform1i(gl.getUniformLocation(p, name), unit);
	}
	/** @param {WebGLProgram} p @param {WebGLTexture} output @param {number} width @param {number} height @returns {number[]} */
	function draw(p, output, width, height) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
			throw new Error('Incomplete framebuffer');
		gl.viewport(0, 0, width, height);
		gl.uniform4fv(gl.getUniformLocation(p, 'uPlanet'), payload.planet);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		gl.finish();
		const values = new Float32Array(width * height * 4);
		gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, values);
		if (gl.getError() !== gl.NO_ERROR || !values.every(Number.isFinite)) throw new Error('Invalid GPU output');
		return Array.from(values);
	}
	try {
		if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('Float framebuffer unavailable');
		const debug = gl.getExtension('WEBGL_debug_renderer_info');
		const renderer = String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
		if (/swiftshader|llvmpipe|software/i.test(renderer)) throw new Error('Hardware GPU required: ' + renderer);
		const version = String(gl.getParameter(gl.VERSION));
		const columnProgram = program(shaders.columns),
			rayProgram = program(shaders.rays);
		const anchorCount = payload.anchors.length / 4,
			width = payload.channels.length * 26,
			height = payload.rowLayout.length;
		if (payload.rowLayout.some((row) => row.sampleCount > 768))
			throw new Error('Fixed outer ray capacity exceeded');
		const anchors = texture(anchorCount, 1, payload.anchors),
			columns = texture(anchorCount, 2, null);
		const samples = texture(1024, Math.ceil(payload.samples.length / 4096), payload.samples);
		const rays = texture(height, 1, payload.rays),
			spectra = texture(payload.channels.length, 1, payload.spectra);
		const output = texture(width, height, null);
		gl.useProgram(columnProgram);
		bind(columnProgram, 'uAnchors', anchors, 0);
		const columnStart = performance.now();
		const columnValues = draw(columnProgram, columns, anchorCount, 2);
		const columnMilliseconds = performance.now() - columnStart;
		gl.useProgram(rayProgram);
		bind(rayProgram, 'uSamples', samples, 0);
		bind(rayProgram, 'uRays', rays, 1);
		bind(rayProgram, 'uColumns', columns, 2);
		bind(rayProgram, 'uSpectra', spectra, 3);
		const rayStart = performance.now();
		const values = draw(rayProgram, output, width, height);
		const rayMilliseconds = performance.now() - rayStart;
		return {
			values,
			columns: columnValues,
			renderer,
			version,
			columnMilliseconds,
			rayMilliseconds,
			width,
			height,
			contextReleased: true,
		};
	} finally {
		for (const tex of textures) gl.deleteTexture(tex);
		for (const p of programs) gl.deleteProgram(p);
		for (const shader of compiled) gl.deleteShader(shader);
		gl.deleteFramebuffer(framebuffer);
		gl.getExtension('WEBGL_lose_context')?.loseContext();
	}
}
