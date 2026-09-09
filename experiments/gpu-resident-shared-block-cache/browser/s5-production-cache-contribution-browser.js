const requireValue = (value, message) => {
	if (!value) throw new Error(message);
	return value;
};
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const progress = (phase) => fetch('/progress', {method: 'POST', body: phase});
const summarize = (values) => {
	const sorted = [...values].sort((left, right) => left - right);
	return {
		values: sorted,
		mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
		median: sorted[Math.floor(sorted.length / 2)],
		p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
	};
};

export async function runProductionCacheContribution() {
	const canvas = document.querySelector('canvas');
	const gl = requireValue(canvas.getContext('webgl2'), 'WebGL2 is unavailable.');
	const timer = requireValue(
		gl.getExtension('EXT_disjoint_timer_query_webgl2'),
		'GPU timer queries are unavailable.',
	);
	const [seamBytes, mapBytes, metadata] = await Promise.all([
		fetch('/seam').then((response) => response.arrayBuffer()),
		fetch('/map').then((response) => response.arrayBuffer()),
		fetch('/meta').then((response) => response.json()),
	]);
	await progress('inputs-loaded');
	const source = new Float32Array(seamBytes);
	const logicalToUnique = new Uint16Array(mapBytes);
	const layers = metadata.layers;
	const textureArray = (internalFormat, format, width, height, filter) => {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, filter);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, filter);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, internalFormat, width, height, layers, 0, format, gl.FLOAT, null);
		return texture;
	};
	const uploadProduction = () => {
		const texture = textureArray(gl.RGBA32F, gl.RGBA, 648, 27, gl.LINEAR);
		const values = new Float32Array(648 * 27 * 4);
		for (let layer = 0; layer < layers; layer += 1) {
			values.fill(0);
			for (let logical = 0; logical < 4374; logical += 1) {
				const face = Math.floor(logical / 729);
				const local = logical - face * 729;
				const v = Math.floor(local / 27);
				const u = local - v * 27;
				const unique = logicalToUnique[logical];
				for (let channel = 0; channel < 15; channel += 1) {
					const productionX = Math.floor(channel / 4) * 162 + face * 27 + u;
					values[(v * 648 + productionX) * 4 + (channel % 4)] =
						source[channel * layers * 4058 + layer * 4058 + unique];
				}
			}
			gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, 648, 27, 1, gl.RGBA, gl.FLOAT, values);
		}
		return texture;
	};
	const indexTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, indexTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16UI, 4374, 1, 0, gl.RED_INTEGER, gl.UNSIGNED_SHORT, logicalToUnique);
	const rowSlotTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, rowSlotTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texImage2D(
		gl.TEXTURE_2D,
		0,
		gl.R16UI,
		layers,
		1,
		0,
		gl.RED_INTEGER,
		gl.UNSIGNED_SHORT,
		Uint16Array.from({length: layers}, (_, index) => index),
	);
	requireValue(gl.getError() === gl.NO_ERROR, 'Production-derived texture upload failed.');

	const compile = (type, sourceCode) => {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, sourceCode);
		gl.compileShader(shader);
		requireValue(gl.getShaderParameter(shader, gl.COMPILE_STATUS), gl.getShaderInfoLog(shader));
		return shader;
	};
	const vertex = compile(
		gl.VERTEX_SHADER,
		'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID&1)*4-1,(gl_VertexID&2)*2-1);gl_Position=vec4(p,0.,1.);}',
	);
	const createProgram = (fragment) => {
		const program = gl.createProgram();
		gl.attachShader(program, vertex);
		gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
		gl.linkProgram(program);
		requireValue(gl.getProgramParameter(program, gl.LINK_STATUS), gl.getProgramInfoLog(program));
		return program;
	};
	const common = `#version 300 es
precision highp float; precision highp sampler2DArray; precision highp usampler2D;
uniform sampler2DArray cache; uniform usampler2D directionMap; uniform usampler2D rowMap; uniform int layerCount; out vec4 color;
void coordinates(out int face,out int u,out int v,out float fu,out float fv,out ivec4 rows){
 int px=int(gl_FragCoord.x),py=int(gl_FragCoord.y); face=(px+py)%6; u=1+(px%24); v=1+(py%24);
 fu=float((px/24)%16)/16.0; fv=float((py/24)%16)/16.0;
 int base=(px*13+py)%max(1,layerCount-3); rows=ivec4(base,base+1,base+2,base+3);
}`;
	const productionProgram = createProgram(`${common}
void main(){int face,u,v;float fu,fv;ivec4 rows;coordinates(face,u,v,fu,fv,rows);float total=0.0;
 for(int r=0;r<4;r++){float w=float(r+1)*0.1;for(int group=0;group<4;group++){
  float x=(float(group*162+face*27+u)+fu+0.5)/648.0;float y=(float(v)+fv+0.5)/27.0;
  vec4 packet=texture(cache,vec3(x,y,float(rows[r])));total+=w*(packet.x+packet.y+packet.z+(group==3?0.0:packet.w));}}
	 color=vec4(total);}`);
	await progress('shaders-compiled');
	const atlasProgram = createProgram(`${common}
void main(){int face,u,v;float fu,fv;ivec4 rows;coordinates(face,u,v,fu,fv,rows);float total=0.0;
 for(int r=0;r<4;r++){float w=float(r+1)*0.1;int slot=int(texelFetch(rowMap,ivec2(rows[r],0),0).r);for(int group=0;group<4;group++){
  float x=(float(group*162+face*27+u)+fu+0.5)/648.0;float y=(float(v)+fv+0.5)/27.0;
  vec4 packet=texture(cache,vec3(x,y,float(slot)));total+=w*(packet.x+packet.y+packet.z+(group==3?0.0:packet.w));}}
 color=vec4(total);}`);

	const configure = (program, texture) => {
		gl.useProgram(program);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
		gl.uniform1i(gl.getUniformLocation(program, 'cache'), 0);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, indexTexture);
		gl.uniform1i(gl.getUniformLocation(program, 'directionMap'), 1);
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, rowSlotTexture);
		gl.uniform1i(gl.getUniformLocation(program, 'rowMap'), 2);
		gl.uniform1i(gl.getUniformLocation(program, 'layerCount'), layers);
		gl.viewport(0, 0, canvas.width, canvas.height);
	};
	const measureStripe = async (program, texture, y, height) => {
		configure(program, texture);
		gl.enable(gl.SCISSOR_TEST);
		gl.scissor(0, y, canvas.width, height);
		const query = gl.createQuery();
		gl.beginQuery(timer.TIME_ELAPSED_EXT, query);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		gl.endQuery(timer.TIME_ELAPSED_EXT);
		gl.flush();
		while (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) await nextFrame();
		const disjoint = Boolean(gl.getParameter(timer.GPU_DISJOINT_EXT));
		const nanoseconds = gl.getQueryParameter(query, gl.QUERY_RESULT);
		gl.deleteQuery(query);
		return {disjoint, milliseconds: disjoint ? null : nanoseconds / 1_000_000};
	};
	const measure = async (program, texture) => {
		let milliseconds = 0;
		for (let y = 0; y < canvas.height; y += canvas.height) {
			const stripe = await measureStripe(program, texture, y, canvas.height);
			if (stripe.disjoint) return stripe;
			milliseconds += stripe.milliseconds;
		}
		return {disjoint: false, milliseconds};
	};
	const productionSamples = [];
	const atlasSamples = [];
	const productionTexture = uploadProduction();
	await progress('production-texture-uploaded');
	for (let sample = 0; sample < 20; sample += 1) {
		productionSamples.push(await measure(productionProgram, productionTexture));
		atlasSamples.push(await measure(atlasProgram, productionTexture));
	}
	await progress('production-measured');
	await progress('atlas-measured');
	const validProduction = productionSamples.filter((sample) => !sample.disjoint).map((sample) => sample.milliseconds);
	const validAtlas = atlasSamples.filter((sample) => !sample.disjoint).map((sample) => sample.milliseconds);
	return {
		accepted: validProduction.length === 20 && validAtlas.length === 20 && gl.getError() === gl.NO_ERROR,
		resolution: [canvas.width, canvas.height],
		productionPayloadSha256: metadata.manifest.exactSeamPayload.sha256,
		packedRows: layers,
		atlasRepresentation: 'production-compatible-rgba32f-shared-block-slots',
		workload: {rowTaps: 4, spectralChannels: 15, hardwareBilinearDirectionFiltering: true, fullFramePixels: canvas.width * canvas.height, stripeHeight: canvas.height},
		production: summarize(validProduction),
		atlas: summarize(validAtlas),
	};
}
