import {DistantSunSharedCacheCubicLookup} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheCubicLookup.js';
import {
	DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH,
	DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT,
} from '../../../src/algorithm32/implementation/distant-sun/cache/consts.js';

/** Execute the unchanged production cubic lookup and explicit Q30 transport equation. */
export async function runOfflineCompilerBrowser() {
	/** @type {P2GpuViewControl} */
	const control = await (await fetch('/control.json')).json();
	const gl = document.createElement('canvas').getContext('webgl2', {antialias: false});
	if (!gl || !gl.getExtension('EXT_color_buffer_float') || !gl.getExtension('OES_texture_float_linear'))
		throw new Error('P2 GPU view proof requires floating-point WebGL2.');
	/** Compile one shader, rejecting diagnostics before use. */
	const compile = (type, source) => {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
		return shader;
	};
	const program = gl.createProgram();
	gl.attachShader(
		program,
		compile(
			gl.VERTEX_SHADER,
			'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}',
		),
	);
	gl.attachShader(
		program,
		compile(
			gl.FRAGMENT_SHADER,
			`#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DArray;
precision highp usampler2D;
uniform sampler2DArray uDistantSunSharedPackets;
uniform usampler2D uDistantSunSharedCoordinates;
uniform vec3 directions[30];
uniform float zeniths[30];
uniform ivec2 altitudeIndices[30];
uniform vec2 altitudeWeights[30];
uniform vec2 heightSteps[30];
uniform vec4 rayleigh[4];
uniform vec4 mie[4];
uniform vec2 scaleHeights;
uniform int sampleCount;
uniform bool integrate;
out vec4 result;
${DistantSunSharedCacheCubicLookup.createShaderSource()}
vec4 densityAt(int index, int plane, out bool supported) {
	supported=true;
	vec4 density=vec4(0.0);
	for(int tap=0;tap<2;tap++) {
		float weight=altitudeWeights[index][tap];
		if(weight<=0.0) continue;
		bool available;
		density+=weight*distantCubicDensity(altitudeIndices[index][tap],directions[index],zeniths[index],plane,available);
		supported=supported&&available;
	}
	return density;
}
void main() {
	int plane=int(gl_FragCoord.x), row=int(gl_FragCoord.y);
	if(row>=2) {
		if(row-2>=sampleCount){result=vec4(0.0);return;}
		bool supported;
		result=densityAt(row-2,plane,supported);
		if(!supported)result=vec4(-1.0);
		return;
	}
	vec4 radiance=vec4(0.0), transmission=vec4(1.0);
	bool supported=true;
	for(int index=0;index<30;index++) {
		if(index>=sampleCount)break;
		bool available;
		vec4 density=densityAt(index,plane,available);
		supported=supported&&available;
		if(!integrate){radiance=density;break;}
		vec2 hs=heightSteps[index];
		vec4 extinction=rayleigh[plane]*exp(-hs.x/scaleHeights.x)+mie[plane]*exp(-hs.x/scaleHeights.y);
		vec4 halfStep=exp(-0.5*extinction*hs.y);
		transmission*=halfStep;
		radiance+=transmission*density*hs.y;
		transmission*=halfStep;
	}
	result=supported?(row==0?radiance:transmission):vec4(-1.0);
}`,
		),
	);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
	gl.useProgram(program);
	const locations = Object.fromEntries(
		['directions', 'zeniths', 'altitudeIndices', 'altitudeWeights', 'heightSteps', 'sampleCount', 'integrate'].map(
			(name) => [name, gl.getUniformLocation(program, name)],
		),
	);
	gl.uniform4fv(gl.getUniformLocation(program, 'rayleigh'), [...control.rayleigh, 0]);
	gl.uniform4fv(gl.getUniformLocation(program, 'mie'), [...control.mie, 0]);
	gl.uniform2f(gl.getUniformLocation(program, 'scaleHeights'), control.rayleighScaleHeight, control.mieScaleHeight);
	gl.uniform1i(gl.getUniformLocation(program, 'uDistantSunSharedPackets'), 0);
	gl.uniform1i(gl.getUniformLocation(program, 'uDistantSunSharedCoordinates'), 1);
	const addresses = gl.createTexture();
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, addresses);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RG16UI, 180, 48);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	const output = gl.createTexture();
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, output);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, 4, 32);
	const framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
		throw new Error('P2 GPU view framebuffer incomplete.');
	gl.viewport(0, 0, 4, 32);
	let upload = 0;
	for (const [batchIndex, batch] of control.batches.entries()) {
		const addressValues = new Uint16Array(await (await fetch(`/repository/${batch.addresses}`)).arrayBuffer());
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, addresses);
		gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 180, 48, gl.RG_INTEGER, gl.UNSIGNED_SHORT, addressValues);
		for (const [orderIndex, packetPaths] of batch.packets.entries()) {
			const packets = gl.createTexture();
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D_ARRAY, packets);
			gl.texStorage3D(
				gl.TEXTURE_2D_ARRAY,
				1,
				gl.RGBA32F,
				DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH,
				DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT,
				packetPaths.length,
			);
			gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			for (const [layer, packetPath] of packetPaths.entries()) {
				const response = await fetch(`/repository/${packetPath}`);
				if (!response.ok || !response.body) throw new Error('P2 packet input unavailable.');
				const values = new Float32Array(
					await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(),
				);
				gl.texSubImage3D(
					gl.TEXTURE_2D_ARRAY,
					0,
					0,
					0,
					layer,
					DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH,
					values.length / (DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH * 4),
					1,
					gl.RGBA,
					gl.FLOAT,
					values,
				);
			}
			const result = new Float32Array(batch.jobs.length * 512);
			for (const [jobIndex, job] of batch.jobs.entries()) {
				if (job.samples.length) {
					gl.uniform3fv(
						locations.directions,
						job.samples.flatMap((sample) => sample.direction),
					);
					gl.uniform1fv(
						locations.zeniths,
						job.samples.map((sample) => sample.zenith),
					);
					gl.uniform2iv(
						locations.altitudeIndices,
						job.samples.flatMap((sample) => [
							sample.altitudes[0].index,
							sample.altitudes[1]?.index ?? sample.altitudes[0].index,
						]),
					);
					gl.uniform2fv(
						locations.altitudeWeights,
						job.samples.flatMap((sample) => [sample.altitudes[0].weight, sample.altitudes[1]?.weight ?? 0]),
					);
					gl.uniform2fv(
						locations.heightSteps,
						job.samples.flatMap((sample) => [sample.altitude, sample.step]),
					);
				}
				gl.uniform1i(locations.sampleCount, job.samples.length);
				gl.uniform1i(locations.integrate, job.integrate ? 1 : 0);
				gl.drawArrays(gl.TRIANGLES, 0, 3);
				gl.readPixels(0, 0, 4, 32, gl.RGBA, gl.FLOAT, result.subarray(jobIndex * 512, (jobIndex + 1) * 512));
				if (gl.getError() !== gl.NO_ERROR) throw new Error('P2 production lookup generated a GL error.');
				if (jobIndex % 100 === 0)
					await globalThis.offlineCompilerProgress?.(`q30-${batchIndex}-${orderIndex}-${jobIndex}`);
			}
			const response = await fetch(`/artifact/layer-${upload++}.f32`, {method: 'POST', body: result.buffer});
			if (!response.ok) throw new Error('P2 GPU view upload failed.');
			gl.deleteTexture(packets);
			await globalThis.offlineCompilerProgress?.(`q30-${batchIndex}-${orderIndex}-complete`);
		}
	}
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	return {
		batches: control.batches.length,
		uploads: upload,
		userAgent: navigator.userAgent,
		webglVersion: gl.getParameter(gl.VERSION),
		shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
		renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
	};
}
