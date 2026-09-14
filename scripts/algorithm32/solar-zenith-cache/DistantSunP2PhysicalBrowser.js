import {
	compileDistantSunSceneCacheWavelength,
	createDistantSunSceneCacheCommonShaderSource,
} from './DistantSunSceneCacheGpuCompiler.js';

/** Evaluate only continuous N1/source transmittance with production common GLSL.
 * These probe nodes never replace the Native48/Z180 recurrence construction domains.
 */
function directProbes(gl, buildRequest, channelIndex, queries) {
	const spec = buildRequest.transportSpec,
		channel = spec.domains.spectrum.channels[channelIndex];
	const heights = [...new Set(queries.map((query) => query.heightMeters))],
		angles = [...new Set(queries.map((query) => query.solarZenithDegrees))];
	const common = createDistantSunSceneCacheCommonShaderSource({
		wavelengthNanometers: channel.centerNanometers,
		sourceIrradiance: channel.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,
		ozoneCrossSection: 0,
		ozoneMaximumDensity: 0,
		rayleighScattering: channel.rayleighScatteringPerMeter,
		mieExtinction: channel.mieExtinctionPerMeter,
		groundAlbedo: channel.groundAlbedo,
		...spec.planet,
		...spec.atmosphere,
		sourcePathTransmittanceIntervalCount: spec.numerical.sourcePathTransmittanceIntervalCount,
		positionAltitudesMeters: heights,
		solarZenithDegrees: angles,
		numericalPolicy: spec.numerical.geometryPolicy,
	});
	const compile = (type, source) => {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
		return shader;
	};
	const program = gl.createProgram();
	const vertex = compile(
		gl.VERTEX_SHADER,
		'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}',
	);
	const fragment = compile(
		gl.FRAGMENT_SHADER,
		`#version 300 es\nprecision highp float;precision highp int;precision highp sampler2D;\n${common}\nuniform sampler2D queryData;layout(location=0)out vec4 result;void main(){int index=int(gl_FragCoord.x);vec4 a=texelFetch(queryData,ivec2(index,0),0);vec4 b=texelFetch(queryData,ivec2(index,1),0);vec3 point=representativePoint(int(a.w),int(b.x));vec3 direction=incomingPhysicalDirection(point,a.xyz);result=vec4(sourceTransmittance(point),directScatteringDensity(point,direction),0,0);}`,
	);
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
	const width = queries.length;
	if (width > gl.getParameter(gl.MAX_TEXTURE_SIZE))
		throw new Error('Continuous probe inventory exceeds texture limit.');
	const data = new Float32Array(width * 8);
	queries.forEach((query, index) => {
		data.set([...query.localDirection, heights.indexOf(query.heightMeters)], index * 4);
		data[(width + index) * 4] = angles.indexOf(query.solarZenithDegrees);
	});
	const input = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, input);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, width, 2);
	gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, 2, gl.RGBA, gl.FLOAT, data);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	const output = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, output);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, width, 1);
	const framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
		throw new Error('Continuous probe framebuffer incomplete.');
	gl.useProgram(program);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, input);
	gl.uniform1i(gl.getUniformLocation(program, 'queryData'), 0);
	gl.viewport(0, 0, width, 1);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	const pixels = new Float32Array(width * 4);
	gl.readPixels(0, 0, width, 1, gl.RGBA, gl.FLOAT, pixels);
	if (gl.getError() !== gl.NO_ERROR) throw new Error('Continuous probe readback failed.');
	gl.deleteFramebuffer(framebuffer);
	gl.deleteTexture(input);
	gl.deleteTexture(output);
	gl.deleteProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	const values = new Float32Array(width * 2);
	queries.forEach((_query, index) => {
		values[index * 2] = pixels[index * 4];
		values[index * 2 + 1] = pixels[index * 4 + 1];
	});
	return values;
}

/** Compile each complete production recurrence once and retain its sparse physical-matrix dependencies. */
export async function runOfflineCompilerBrowser() {
	const control = await (await fetch('/control.json')).json();
	const gl = document
		.createElement('canvas')
		.getContext('webgl2', {antialias: false, powerPreference: 'high-performance'});
	if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('Physical matrix requires Float32 WebGL2.');
	const reports = [],
		count = control.coordinates.length;
	for (const [requestIndex, request] of control.requests.entries()) {
		const buildRequest = control.profiles[request.profileIndex].buildRequest;
		const values = new Float32Array(count * 4 + control.queries.length * 2);
		const report = await compileDistantSunSceneCacheWavelength({
			gl,
			buildRequest,
			wavelengthIndex: request.channel,
			compileSceneCaches: false,
			fieldProbeCoordinates: Object.fromEntries(['J1', 'J2', 'J3', 'J4'].map((id) => [id, control.coordinates])),
			reportProgress: async (stage) => globalThis.offlineCompilerProgress?.(`${requestIndex}:${stage}`),
			onFieldProbes: async ({fieldId, values: probes}) => {
				const order = Number(fieldId.slice(1)) - 1;
				for (let index = 0; index < probes.length; index++) values[order * count + index] = probes[index].value;
			},
		});
		values.set(directProbes(gl, buildRequest, request.channel, control.queries), count * 4);
		const response = await fetch(`/artifact/layer-${requestIndex}.f32`, {method: 'POST', body: values.buffer});
		if (!response.ok) throw new Error('Physical matrix upload failed.');
		reports.push(report);
	}
	return {reports};
}
