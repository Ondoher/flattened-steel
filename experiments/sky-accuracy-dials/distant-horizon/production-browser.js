import {compileDistantSunSceneCacheWavelength} from '../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
import {DistantSunSharedCacheCubicLookup} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheCubicLookup.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER as domain} from '../../../src/algorithm32/sampling-domains/index.js';
import {setTorontoMaterial} from './toronto-phase.js';

/** Replay canonical recurrence, exact cubic packet lookup and Q30/refined view equation on hardware.
 * @param {HorizonProductionControl} control Authenticated request and complete sparse support.
 * @returns {Promise<HorizonProductionResult>} Spectra per order/channel and raw sparse values; failures reject after GPU cleanup.
 */
async function evaluate(control) {
	if (control.material) setTorontoMaterial(control.material);
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {antialias: false, powerPreference: 'high-performance'});
	if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('Float WebGL2 unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const renderer = String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
	if (/swiftshader|llvmpipe|software rasterizer/i.test(renderer)) throw new Error('Hardware GPU required.');
	const shaders = [], textures = []; let program, framebuffer, vao;
	const progress = async message => window.__h43Progress(message);
	try {
		const vertex = `#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}`;
		const fragment = `#version 300 es
precision highp float; precision highp int; precision highp sampler2DArray; precision highp usampler2D;
uniform sampler2DArray uDistantSunSharedPackets; uniform usampler2D uDistantSunSharedCoordinates;
uniform vec3 directions[120]; uniform float zeniths[120]; uniform ivec2 altitudeIndices[120];
uniform vec2 altitudeWeights[120]; uniform vec2 heightSteps[120]; uniform int sampleCount;
uniform float rayleigh; uniform float scaleHeight; uniform float mie; uniform float mieHeight; out vec4 result;
${DistantSunSharedCacheCubicLookup.createShaderSource()}
void main(){float radiance=0.0, transmission=1.0; bool supported=true;
 for(int i=0;i<120;i++){if(i>=sampleCount)break; float density=0.0;
  for(int t=0;t<2;t++){if(altitudeWeights[i][t]<=0.0)continue; bool available;
   density+=altitudeWeights[i][t]*distantCubicDensity(altitudeIndices[i][t],directions[i],zeniths[i],0,available).x;
   supported=supported&&available;}
  float halfStep=exp(-0.5*(rayleigh*exp(-heightSteps[i].x/scaleHeight)+mie*exp(-heightSteps[i].x/mieHeight))*heightSteps[i].y);
  transmission*=halfStep; radiance+=transmission*density*heightSteps[i].y; transmission*=halfStep;
 } result=supported?vec4(radiance,transmission,0,1):vec4(-1);}`;
		for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
			const shader = gl.createShader(Number(type)); shaders.push(shader); gl.shaderSource(shader, String(source)); gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
		}
		program = gl.createProgram(); shaders.forEach(s => gl.attachShader(program, s)); gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
		framebuffer = gl.createFramebuffer(); vao = gl.createVertexArray();
		const addresses = new Uint16Array(180 * 48 * 2).fill(65535);
		control.plan.rows.forEach((r, i) => {const a = 2 * (r.position * 180 + r.zenith); addresses[a] = Math.floor(i / 64); addresses[a + 1] = i % 64;});
		const address = gl.createTexture(); textures.push(address); gl.bindTexture(gl.TEXTURE_2D, address);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RG16UI, 180, 48); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 180, 48, gl.RG_INTEGER, gl.UNSIGNED_SHORT, addresses);
		const layers = Math.ceil(control.plan.rows.length / 64);
		const packet = gl.createTexture(); textures.push(packet); gl.bindTexture(gl.TEXTURE_2D_ARRAY, packet);
		gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA32F, 162, 1728, layers);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		const output = gl.createTexture(); textures.push(output); gl.bindTexture(gl.TEXTURE_2D, output); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, 1, 1);
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('Readback framebuffer incomplete.');
		const reports = [];
		for (const channel of control.channels) {
			const pure = [], cumulative = new Float32Array(control.plan.coordinates.length);
			await progress(`Compile Native15 channel ${channel}.`);
			const buildRequest=control.material?{...control.request,transportSpec:{...control.request.transportSpec,atmosphere:{...control.request.transportSpec.atmosphere,mieSingleScatteringAlbedo:control.material.albedos[channel]}}}:control.request;
			const report = await compileDistantSunSceneCacheWavelength({gl, buildRequest, wavelengthIndex: channel,
				fieldProbeCoordinates: Object.fromEntries(['J1', 'J2', 'J3', 'J4'].map(id => [id, control.plan.coordinates])),
				reportProgress: async stage => progress(`${channel}: ${stage}`),
				onFieldProbes: async ({fieldId, values}) => {if (fieldId.startsWith('L')) return;
					if (fieldId !== `J${pure.length + 1}` || values.length !== cumulative.length) throw new Error('Changed sparse order/length.');
					pure.push(values.map((v, i) => {const p = control.plan.coordinates[i]; if (v.x !== p.x || v.y !== p.y || !Number.isFinite(v.value) || v.value < 0) throw new Error('Invalid sparse field.'); return v.value;}));
				}});
			if (pure.length !== 4 || report.finalLiveFieldBytes !== 0) throw new Error('Incomplete production compile.');
			const spectra = [];
			for (let order = 0; order < 4; order++) {
				pure[order].forEach((x, i) => {cumulative[i] = order === 0 ? x : Math.fround(cumulative[i] + x);});
				for (let layer = 0; layer < layers; layer++) {
					const data = new Float32Array(162 * 1728 * 4);
					control.plan.coordinates.forEach((p, i) => {if (Math.floor(p.row / 64) !== layer) return;
						const d = domain.unflattenNodeIndex(p.x), x = d.faceIndex * 27 + d.uIndex, y = (p.row % 64) * 27 + d.vIndex;
						data[4 * (y * 162 + x)] = cumulative[i];});
					gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, packet);
					gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, 162, 1728, 1, gl.RGBA, gl.FLOAT, data);
				}
				gl.useProgram(program); gl.bindVertexArray(vao); gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); gl.viewport(0, 0, 1, 1);
				gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, address);
				gl.uniform1i(gl.getUniformLocation(program, 'uDistantSunSharedPackets'), 0); gl.uniform1i(gl.getUniformLocation(program, 'uDistantSunSharedCoordinates'), 1);
				gl.uniform1f(gl.getUniformLocation(program, 'rayleigh'), control.rayleigh[channel]); gl.uniform1f(gl.getUniformLocation(program, 'scaleHeight'), control.scaleHeight);
				gl.uniform1f(gl.getUniformLocation(program, 'mie'), control.mie?.[channel] ?? 0); gl.uniform1f(gl.getUniformLocation(program, 'mieHeight'), control.mieHeight ?? 1200);
				const values = [];
				for (const job of control.plan.jobs) {
					gl.uniform3fv(gl.getUniformLocation(program, 'directions'), job.samples.flatMap(s => s.coordinate));
					gl.uniform1fv(gl.getUniformLocation(program, 'zeniths'), job.samples.map(s => s.zenith));
					gl.uniform2iv(gl.getUniformLocation(program, 'altitudeIndices'), job.samples.flatMap(s => s.altitudeIndices));
					gl.uniform2fv(gl.getUniformLocation(program, 'altitudeWeights'), job.samples.flatMap(s => s.altitudeWeights));
					gl.uniform2fv(gl.getUniformLocation(program, 'heightSteps'), job.samples.flatMap(s => [s.height, s.step]));
					gl.uniform1i(gl.getUniformLocation(program, 'sampleCount'), job.samples.length); gl.drawArrays(gl.TRIANGLES, 0, 3);
					const pixel = new Float32Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, pixel);
					if (gl.getError() !== gl.NO_ERROR || ![...pixel].every(Number.isFinite) || pixel[0] < 0) throw new Error('Production lookup unsupported/invalid.');
					values.push(pixel[0]);
				} spectra.push(values);
			}
			reports.push({channel, report, pure, spectra});
			await progress(`Channel ${channel} complete: all four cumulative orders sampled.`);
		}
		return {renderer, reports, fragment};
	} finally {
		textures.forEach(t => gl.deleteTexture(t)); shaders.forEach(s => gl.deleteShader(s));
		if (program) gl.deleteProgram(program); if (framebuffer) gl.deleteFramebuffer(framebuffer); if (vao) gl.deleteVertexArray(vao);
		gl.getExtension('WEBGL_lose_context')?.loseContext();
	}
}

window.__h43Evaluate = evaluate;
