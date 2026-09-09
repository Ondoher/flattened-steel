const fail = (value, message) => {
	if (!value) throw new Error(message);
};

const nextAnimationFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

async function resolveElapsedQuery(gl, extension, query) {
	const deadline = performance.now() + 30_000;

	while (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) {
		if (performance.now() >= deadline) {
			gl.deleteQuery(query);
			return {available: false, disjoint: null, gpuNanoseconds: null, timeout: true};
		}
		await nextAnimationFrame();
	}

	const disjoint = Boolean(gl.getParameter(extension.GPU_DISJOINT_EXT));
	const gpuNanoseconds = gl.getQueryParameter(query, gl.QUERY_RESULT);
	gl.deleteQuery(query);
	return {available: true, disjoint, gpuNanoseconds: disjoint ? null : gpuNanoseconds, timeout: false};
}

export async function runShaderLookupBenchmark() {
	const canvas = document.querySelector('canvas');
	const gl = canvas.getContext('webgl2');
	fail(gl, 'WebGL2 unavailable.');
	const extension = gl.getExtension('EXT_disjoint_timer_query_webgl2');
	if (!extension) {
		return {
			accepted: false,
			reason: 'EXT_disjoint_timer_query_webgl2 is unavailable on this browser/GPU.',
		};
	}

	const values = new Float32Array(await fetch('/block').then((response) => response.arrayBuffer()));
	const compile = (type, source) => {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		fail(gl.getShaderParameter(shader, gl.COMPILE_STATUS), gl.getShaderInfoLog(shader));
		return shader;
	};
	const vertex = compile(
		gl.VERTEX_SHADER,
		'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID&1)*4-1,(gl_VertexID&2)*2-1);gl_Position=vec4(p,0.,1.);}',
	);
	const createProgram = (source) => {
		const program = gl.createProgram();
		gl.attachShader(program, vertex);
		gl.attachShader(program, compile(gl.FRAGMENT_SHADER, source));
		gl.linkProgram(program);
		fail(gl.getProgramParameter(program, gl.LINK_STATUS), gl.getProgramInfoLog(program));
		return program;
	};
	const header =
		'precision highp float;precision highp sampler2D;precision highp sampler2DArray;out vec4 outColor;';
	const dense = createProgram(`#version 300 es\n${header}uniform sampler2D cache;void main(){int x=int(gl_FragCoord.x)%4058,r=int(gl_FragCoord.y)%64;float s=0.;for(int c=0;c<15;c++)s+=texelFetch(cache,ivec2(x,r*15+c),0).r;outColor=vec4(s);}`);
	const atlas = createProgram(`#version 300 es\n${header}uniform sampler2DArray cache;void main(){int x=int(gl_FragCoord.x)%4058,r=int(gl_FragCoord.y)%64;float s=0.;for(int c=0;c<15;c++)s+=texelFetch(cache,ivec3(x,r*15+c,0),0).r;outColor=vec4(s);}`);
	const configure = (target, texture) => {
		gl.bindTexture(target, texture);
		gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	};
	const denseTexture = gl.createTexture();
	configure(gl.TEXTURE_2D, denseTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 4058, 960, 0, gl.RED, gl.FLOAT, values);
	const atlasTexture = gl.createTexture();
	configure(gl.TEXTURE_2D_ARRAY, atlasTexture);
	gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.R32F, 4058, 960, 1, 0, gl.RED, gl.FLOAT, values);

	const measure = async (program, target, texture) => {
		gl.useProgram(program);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(target, texture);
		gl.uniform1i(gl.getUniformLocation(program, 'cache'), 0);
		gl.viewport(0, 0, canvas.width, canvas.height);
		for (let draw = 0; draw < 16; draw += 1) gl.drawArrays(gl.TRIANGLES, 0, 3);
		gl.finish();
		const query = gl.createQuery();
		fail(query, 'Unable to allocate a GPU timer query.');
		gl.beginQuery(extension.TIME_ELAPSED_EXT, query);
		for (let draw = 0; draw < 512; draw += 1) gl.drawArrays(gl.TRIANGLES, 0, 3);
		gl.endQuery(extension.TIME_ELAPSED_EXT);
		gl.flush();
		return resolveElapsedQuery(gl, extension, query);
	};

	const denseResult = await measure(dense, gl.TEXTURE_2D, denseTexture);
	const atlasResult = await measure(atlas, gl.TEXTURE_2D_ARRAY, atlasTexture);
	return {
		accepted:
			denseResult.available && atlasResult.available && !denseResult.disjoint && !atlasResult.disjoint,
		resolution: [canvas.width, canvas.height],
		draws: 512,
		spectralFetchesPerFragment: 15,
		timerExtension: 'EXT_disjoint_timer_query_webgl2',
		dense: denseResult,
		atlas: atlasResult,
	};
}
