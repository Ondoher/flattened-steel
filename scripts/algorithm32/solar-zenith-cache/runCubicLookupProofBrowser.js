import {DistantSunSharedCacheCubicLookup} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheCubicLookup.js';
import {
	DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH,
	DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT,
} from '../../../src/algorithm32/implementation/distant-sun/cache/consts.js';

/** Execute the production packet lookup on authenticated four-row input packets. */
export async function runOfflineCompilerBrowser() {
	const control = await (await fetch('/control.json')).json();
	const gl = document.createElement('canvas').getContext('webgl2', {antialias: false});
	if (!gl || !gl.getExtension('EXT_color_buffer_float') || !gl.getExtension('OES_texture_float_linear'))
		throw new Error('Float WebGL2 lookup proof unavailable.');
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
uniform vec3 directionCoordinate;
uniform float zenithCoordinate;
uniform int altitudeIndex;
out vec4 result;
${DistantSunSharedCacheCubicLookup.createShaderSource()}
void main(){bool supported;result=distantCubicDensity(altitudeIndex,directionCoordinate,zenithCoordinate,int(gl_FragCoord.x),supported);if(!supported)result=vec4(-1.0);}`,
		),
	);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
	gl.useProgram(program);
	const packets = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D_ARRAY, packets);
	gl.texStorage3D(
		gl.TEXTURE_2D_ARRAY,
		1,
		gl.RGBA32F,
		DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH,
		DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT,
		1,
	);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.uniform1i(gl.getUniformLocation(program, 'uDistantSunSharedPackets'), 0);
	const coordinates = gl.createTexture();
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, coordinates);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RG16UI, 180, 48);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.uniform1i(gl.getUniformLocation(program, 'uDistantSunSharedCoordinates'), 1);
	const output = gl.createTexture();
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, output);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, 4, 1);
	const framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
		throw new Error('Lookup output framebuffer incomplete.');
	gl.viewport(0, 0, 4, 1);
	const values = [];
	for (const group of control.groups) {
		const payload = new Float32Array(await (await fetch(`/repository/${group.packet}`)).arrayBuffer());
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, packets);
		gl.texSubImage3D(
			gl.TEXTURE_2D_ARRAY,
			0,
			0,
			0,
			0,
			DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH,
			payload.length / (DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH * 4),
			1,
			gl.RGBA,
			gl.FLOAT,
			payload,
		);
		const addresses = new Uint16Array(180 * 48 * 2).fill(65535);
		for (const [row, zenith] of group.zeniths.entries())
			addresses.set([0, row], (group.altitude * 180 + zenith) * 2);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, coordinates);
		gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 180, 48, gl.RG_INTEGER, gl.UNSIGNED_SHORT, addresses);
		gl.uniform1i(gl.getUniformLocation(program, 'altitudeIndex'), group.altitude);
		for (const sample of group.samples) {
			gl.uniform3fv(gl.getUniformLocation(program, 'directionCoordinate'), sample.direction);
			gl.uniform1f(gl.getUniformLocation(program, 'zenithCoordinate'), sample.zenith);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			const spectrum = new Float32Array(16);
			gl.readPixels(0, 0, 4, 1, gl.RGBA, gl.FLOAT, spectrum);
			if (gl.getError() !== gl.NO_ERROR) throw new Error('Production cubic lookup generated a GL error.');
			values.push(...spectrum);
		}
		await globalThis.offlineCompilerProgress?.(`lookup-${group.altitude}-${group.zeniths[1]}`);
	}
	const result = new Float32Array(values);
	const response = await fetch('/artifact/layer-0.f32', {method: 'POST', body: result.buffer});
	if (!response.ok) throw new Error('GPU lookup evidence upload failed.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	return {
		samples: values.length / 16,
		renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
	};
}
