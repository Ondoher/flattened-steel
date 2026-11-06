/**
 * Executes isolated deterministic cache builds and common-ray queries on actual WebGL2 hardware.
 * All helpers are local so the function can be serialized into a fresh browser page.
 *
 * @param {DomeGpuRequest} request - Explicit shaders, physical layouts, and comparison rays.
 * @returns {Promise<Record<string, unknown>>} - Hardware, allocation, and measured stage summaries.
 */
export async function executeCandidate(request) {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {antialias: false, powerPreference: 'high-performance'});
	if (!gl || !gl.getExtension('EXT_color_buffer_float')) {
		throw new Error('Floating-point WebGL2 is required.');
	}
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const renderer = String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
	if (/swiftshader|software|llvmpipe/i.test(renderer)) {
		throw new Error('Hardware GPU required for build measurements.');
	}
	const maxTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE));
	/** @type {WebGLProgram[]} */
	const programs = [];
	/** @type {WebGLShader[]} */
	const shaders = [];
	/** @type {WebGLTexture[]} */
	let textures = [];
	/** @type {Record<string, unknown>[]} */
	const summaries = [];
	const framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	/**
	 * Compiles one measured ordinary WebGL program.
	 *
	 * @param {string} fragment - Fragment source.
	 * @returns {WebGLProgram} - Linked program.
	 */
	function program(fragment) {
		const result = gl.createProgram();
		if (!result) {
			throw new Error('Program allocation failed.');
		}
		programs.push(result);
		for (const [kind, source] of [
			[
				gl.VERTEX_SHADER,
				'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}',
			],
			[gl.FRAGMENT_SHADER, fragment],
		]) {
			const shader = gl.createShader(Number(kind));
			shaders.push(shader);
			gl.shaderSource(shader, String(source));
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				throw new Error(String(gl.getShaderInfoLog(shader)));
			}
			gl.attachShader(result, shader);
		}
		gl.linkProgram(result);
		if (!gl.getProgramParameter(result, gl.LINK_STATUS)) {
			throw new Error(String(gl.getProgramInfoLog(result)));
		}
		return result;
	}

	/**
	 * Allocates an explicit RGBA32F texture and authenticates actual device support.
	 *
	 * @param {number} width - Texel width.
	 * @param {number} height - Texel height.
	 * @param {Float32Array|null} [data] - Optional data payload.
	 * @returns {WebGLTexture} - Owned texture.
	 */
	function texture(width, height, data = null) {
		if (width > maxTextureSize || height > maxTextureSize) {
			throw new Error(`Actual device texture limit ${maxTextureSize} exceeded: ${width}x${height}.`);
		}
		const result = gl.createTexture();
		textures.push(result);
		gl.bindTexture(gl.TEXTURE_2D, result);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, data);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		if (gl.getError() !== gl.NO_ERROR) {
			throw new Error('GPU texture allocation failed.');
		}
		return result;
	}

	/**
	 * Binds one named sampler to an explicit owned unit.
	 *
	 * @param {WebGLProgram} target - Active program.
	 * @param {string} name - Sampler uniform.
	 * @param {WebGLTexture} value - Owned texture.
	 * @param {number} unit - Texture unit.
	 */
	function bind(target, name, value, unit) {
		gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(gl.TEXTURE_2D, value);
		gl.uniform1i(gl.getUniformLocation(target, name), unit);
	}

	try {
		const compileStart = performance.now();
		const build = program(request.shaders.build);
		const view = program(request.shaders.view);
		const sum = program(
			'#version 300 es\nprecision highp float;uniform sampler2D a,b,c;out vec4 result;void main(){ivec2 p=ivec2(gl_FragCoord.xy);result=texelFetch(a,p,0)+texelFetch(b,p,0)+texelFetch(c,p,0);}',
		);
		const compilationMilliseconds = performance.now() - compileStart;
		for (const dataset of request.datasets) {
			const started = performance.now();
			const layout = dataset.layout;
			const width = request.directionCount * 4;
			const height = layout.nodes.length;
			const positionValues = new Float32Array(layout.nodes.flatMap((node) => [...node.point, node.distance]));
			const rowValues = new Float32Array(
				layout.rows.flatMap((row) => [row.offset, row.count, row.lower, row.upper]),
			);
			const queryValues = new Float32Array(
				dataset.cases.flatMap((item) => [...item.origin, item.entry, ...item.direction, item.end]),
			);
			const uploadStart = performance.now();
			const positions = texture(1, height, positionValues);
			const rows = texture(layout.betaCount, layout.altitudes.length, rowValues);
			const queryTexture = texture(2, dataset.cases.length, queryValues);
			const fields = [texture(width, height), texture(width, height), texture(width, height)];
			const cumulative = texture(width, height);
			gl.finish();
			const uploadMilliseconds = performance.now() - uploadStart;
			gl.useProgram(build);
			bind(build, 'uPositions', positions, 0);
			bind(build, 'uRows', rows, 1);
			gl.uniform1f(gl.getUniformLocation(build, 'uSunRadius'), layout.sourceRadius);
			gl.viewport(0, 0, width, height);
			gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
			gl.readBuffer(gl.COLOR_ATTACHMENT0);
			const orderMilliseconds = [];
			const fieldDiagnostics = [];
			let inspectionMilliseconds = 0;
			for (let order = 2; order <= 4; order++) {
				const stage = performance.now();
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fields[order - 2], 0);
				if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
					throw new Error('Construction framebuffer incomplete.');
				}
				gl.uniform1i(gl.getUniformLocation(build, 'uOrder'), order);
				// A separately bound data texture avoids sampling the current render attachment.
				bind(build, 'uPrevious', order === 2 ? positions : fields[order - 3], 2);
				gl.enable(gl.SCISSOR_TEST);
				for (let first = 0; first < height; first += 8) {
					gl.scissor(0, first, width, Math.min(8, height - first));
					gl.drawArrays(gl.TRIANGLES, 0, 3);
					gl.finish();
					if (gl.getError() !== gl.NO_ERROR || gl.isContextLost()) {
						throw new Error('Construction draw failed or context was lost.');
					}
					if (first % 128 === 0) {
						await globalThis['retainBuildProgress']({
							count: layout.count,
							order,
							completed: first,
							total: height,
						});
						await new Promise((resolve) => setTimeout(resolve, 0));
					}
				}
				gl.disable(gl.SCISSOR_TEST);
				orderMilliseconds.push(performance.now() - stage);
				const inspectionStart = performance.now();
				const inspection = new Float32Array(width * height * 4);
				gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, inspection);
				let nonfinite = 0;
				let negative = 0;
				let maximum = 0;
				const firstInvalid = [];
				for (let i = 0; i < inspection.length; i++) {
					const value = inspection[i];
					if (!Number.isFinite(value)) {
						nonfinite++;
						if (firstInvalid.length < 8) {
							firstInvalid.push({
								index: i,
								node: Math.floor(i / (width * 4)),
								point: layout.nodes[Math.floor(i / (width * 4))].point,
								value: String(value),
							});
						}
					} else {
						negative += Number(value < 0);
						maximum = Math.max(maximum, value);
					}
				}
				fieldDiagnostics.push({order, nonfinite, negative, maximum, firstInvalid});
				inspectionMilliseconds += performance.now() - inspectionStart;
			}
			const sumStarted = performance.now();
			gl.useProgram(sum);
			bind(sum, 'a', fields[0], 0);
			bind(sum, 'b', fields[1], 1);
			bind(sum, 'c', fields[2], 2);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, cumulative, 0);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			gl.finish();
			const sumMilliseconds = performance.now() - sumStarted;
			const buildWallMilliseconds = performance.now() - started;
			const buildMilliseconds = buildWallMilliseconds - inspectionMilliseconds;
			const queryStart = performance.now();
			const targets = Array.from({length: 4}, () => texture(4, dataset.cases.length));
			for (let i = 0; i < 4; i++) {
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, targets[i], 0);
			}
			gl.drawBuffers([0, 1, 2, 3].map((i) => gl.COLOR_ATTACHMENT0 + i));
			if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
				throw new Error('Query framebuffer incomplete.');
			}
			gl.useProgram(view);
			bind(view, 'uPositions', positions, 0);
			bind(view, 'uRows', rows, 1);
			bind(view, 'uSecond', fields[0], 2);
			bind(view, 'uThird', fields[1], 3);
			bind(view, 'uFourth', fields[2], 4);
			bind(view, 'uQueries', queryTexture, 5);
			gl.uniform1f(gl.getUniformLocation(view, 'uSunRadius'), layout.sourceRadius);
			gl.viewport(0, 0, 4, dataset.cases.length);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			const values = Array.from({length: 4}, () => new Float32Array(4 * dataset.cases.length * 4));
			for (let i = 0; i < 4; i++) {
				gl.readBuffer(gl.COLOR_ATTACHMENT0 + i);
				gl.readPixels(0, 0, 4, dataset.cases.length, gl.RGBA, gl.FLOAT, values[i]);
			}
			const queryError = gl.getError();
			if (values.some((v) => v.some((x) => !Number.isFinite(x) || x < 0)) || queryError !== gl.NO_ERROR) {
				const invalidQueries = values.map((v, order) => ({
					order: order + 1,
					invalid: Array.from(v)
						.flatMap((x, i) =>
							!Number.isFinite(x) || x < 0
								? [{index: i, caseId: dataset.cases[Math.floor(i / 16)].id, value: String(x)}]
								: [],
						)
						.slice(0, 12),
				}));
				await globalThis['retainCandidateFailure']({queryError, fieldDiagnostics, invalidQueries});
				throw new Error('Invalid physical query output.');
			}
			const results = dataset.cases.map((item, i) => ({
				id: item.id,
				orders: values.map((v) => Array.from(v.subarray(i * 16, i * 16 + 15))),
			}));
			const originalQueryMilliseconds = performance.now() - queryStart;
			const retentionStart = performance.now();
			bind(view, 'uSecond', cumulative, 2);
			bind(view, 'uThird', cumulative, 3);
			bind(view, 'uFourth', cumulative, 4);
			for (const field of fields) {
				gl.deleteTexture(field);
			}
			textures = textures.filter((item) => !fields.includes(item));
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			const cumulativeValues = new Float32Array(4 * dataset.cases.length * 4);
			gl.readBuffer(gl.COLOR_ATTACHMENT1);
			gl.readPixels(0, 0, 4, dataset.cases.length, gl.RGBA, gl.FLOAT, cumulativeValues);
			let maximumCumulativeDifference = 0;
			for (let i = 0; i < cumulativeValues.length; i++) {
				const expected = values[1][i] + values[2][i] + values[3][i];
				const actual = cumulativeValues[i];
				if (!Number.isFinite(actual)) {
					throw new Error('Cumulative-only cache query is nonfinite.');
				}
				maximumCumulativeDifference = Math.max(
					maximumCumulativeDifference,
					Math.abs(actual - expected) / Math.max(1e-20, expected),
				);
			}
			if (maximumCumulativeDifference > 1e-4 || gl.getError() !== gl.NO_ERROR) {
				throw new Error(`Cumulative cache retention differs: ${maximumCumulativeDifference}.`);
			}
			const metadata = {
				label: dataset.label,
				count: layout.count,
				sourceRadius: layout.sourceRadius,
				nodes: height,
				boundarySupportNodes: layout.boundarySupportNodes,
				fieldDiagnostics,
				width,
				height,
				compilationMilliseconds,
				uploadMilliseconds,
				orderMilliseconds,
				sumMilliseconds,
				buildMilliseconds,
				buildWallMilliseconds,
				inspectionMilliseconds,
				queryMilliseconds: originalQueryMilliseconds,
				cumulativeValidationMilliseconds: performance.now() - retentionStart,
				maximumCumulativeDifference,
				retainedFieldBytes: width * height * 16,
				verificationFieldBytes: 4 * width * height * 16,
				retainedCacheTextureBytes: width * height * 16 + positionValues.byteLength + rowValues.byteLength,
				peakOwnedTextureBytes:
					4 * width * height * 16 +
					positionValues.byteLength +
					rowValues.byteLength +
					queryValues.byteLength +
					targets.length * 4 * dataset.cases.length * 16,
				cpuTypedInputBytes: positionValues.byteLength + rowValues.byteLength + queryValues.byteLength,
				cpuTypedInspectionBytes: width * height * 16,
				limits: 'Owned texture payload measured from successful RGBA32F allocations; opaque driver/program allocations and JS object heap are not included.',
				timing: 'Browser wall time with gl.finish/readback completion; compilation separately recorded once, not repeated field reuse.',
			};
			await globalThis['retainCandidate']({metadata, results});
			summaries.push(metadata);
			for (let i = 0; i < 4; i++) {
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, null, 0);
			}
			for (const item of textures) {
				gl.deleteTexture(item);
			}
			textures = [];
		}
		return {
			renderer,
			maxTextureSize,
			maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
			compilationMilliseconds,
			summaries,
		};
	} finally {
		for (const item of textures) {
			gl.deleteTexture(item);
		}
		for (const shader of shaders) {
			gl.deleteShader(shader);
		}
		for (const item of programs) {
			gl.deleteProgram(item);
		}
		gl.deleteFramebuffer(framebuffer);
		gl.getExtension('WEBGL_lose_context')?.loseContext();
	}
}
