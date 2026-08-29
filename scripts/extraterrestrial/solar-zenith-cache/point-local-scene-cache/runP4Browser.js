import {createW39UnitVector} from '../san-jose-nautical-cache-poc/domains/cubedSphereW39DirectionDomain.js';
import {createRepresentativeActualPoint,
	expressActualPointDirectionInWorld,
	createActualPointSourceFrame} from '../san-jose-nautical-cache-poc/geometry/ActualPointCoordinates.js';
import {
	createPointLocalQuery, sampleNative15,
} from './PointLocalSceneCacheRuntime.js';
import {POINT_LOCAL_SCENE_CACHE_CONTRACT as CONTRACT} from './sceneCacheContract.js';

const VERTEX = `#version 300 es
void main(){vec2 p=gl_VertexID==0?vec2(-1,-1):gl_VertexID==1?vec2(3,-1):vec2(-1,3);gl_Position=vec4(p,0,1);}`;
const FRAGMENT = `#version 300 es
precision highp float; precision highp int;
uniform highp sampler2DArray uCache;
uniform int uTapCount; uniform int uRows[16]; uniform int uDirections[16]; uniform float uWeights[16];
layout(location=0) out float outputValue;
void main(){int wavelength=int(gl_FragCoord.x);float value=0.0;for(int i=0;i<16;i++){if(i>=uTapCount)break;value+=uWeights[i]*texelFetch(uCache,ivec3(uDirections[i],uRows[i],wavelength),0).r;}outputValue=value;}`;

function shader(gl, type, source) {
	const value = gl.createShader(type); gl.shaderSource(value, source); gl.compileShader(value);
	if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(value));
	return value;
}

function program(gl) {
	const result = gl.createProgram(); const vertex = shader(gl, gl.VERTEX_SHADER, VERTEX);
	const fragment = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT); gl.attachShader(result, vertex);
	gl.attachShader(result, fragment); gl.linkProgram(result); gl.deleteShader(vertex); gl.deleteShader(fragment);
	if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(result));
	return result;
}

function makeQuery({altitudeMeters, solarZenithDegrees, localDirection, ledger}) {
	const radius = CONTRACT.scenes[0].support.bottomRadiusMeters + altitudeMeters;
	const muS = Math.cos(solarZenithDegrees * Math.PI / 180);
	const point = createRepresentativeActualPoint({radiusMeters: radius, muS});
	const directionToSource = [0, 0, 1];
	const frame = createActualPointSourceFrame({point, directionToSource});
	const worldOutgoingDirection = expressActualPointDirectionInWorld(frame, localDirection);
	return createPointLocalQuery({point, worldOutgoingDirection, directionToSource, ledger});
}

export async function runP4Browser() {
	const [manifestResponse, ledgerResponse, payloadResponse] = await Promise.all([
		fetch('/p3/cache/solar-noon-cache-manifest.json'),
		fetch('/p3/cache/solar-noon-packed-row-ledger.json'),
		fetch('/p3/cache/solar-noon-native15-c4-w39.f32'),
	]);
	if (!manifestResponse.ok || !ledgerResponse.ok || !payloadResponse.ok) throw new Error('P3 cache fetch failed.');
	const [manifest, ledger, payloadBuffer] = await Promise.all([
		manifestResponse.json(), ledgerResponse.json(), payloadResponse.arrayBuffer()]);
	const payload = new Float32Array(payloadBuffer);
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false,
		depth: false, stencil: false, powerPreference: 'high-performance'});
	if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('Required WebGL2 float support unavailable.');
	const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.R32F, manifest.layout.width,
		manifest.layout.height, manifest.layout.layers, 0, gl.RED, gl.FLOAT, payload);
	if (gl.getError() !== gl.NO_ERROR) throw new Error('Complete P3 cache texture upload failed.');
	const exactAltitudeIndex = 12;
	const exactZenithIndex = Math.floor((ledger.rows[exactAltitudeIndex].retainedZenith.firstIndex
		+ ledger.rows[exactAltitudeIndex].retainedZenith.lastIndex) / 2);
	const exactDirectionIndex = 19 * 39 + 19;
	const exact = makeQuery({
		altitudeMeters: CONTRACT.domains.altitude.nodesMeters[exactAltitudeIndex],
		solarZenithDegrees: 0.5 + exactZenithIndex,
		localDirection: createW39UnitVector(exactDirectionIndex), ledger,
	});
	const offGrid = makeQuery({altitudeMeters: 15625, solarZenithDegrees: 14.2,
		localDirection: [0.93, 0.21, 0.3], ledger});
	let unsupportedFailure = null;
	try {
		makeQuery({altitudeMeters: 1000, solarZenithDegrees: 90,
			localDirection: [1, 0, 0], ledger});
	} catch (error) { unsupportedFailure = error.message; }
	const output = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, output);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 15, 2, 0, gl.RED, gl.FLOAT, null);
	const framebuffer = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
	const pipeline = program(gl); const vertexArray = gl.createVertexArray();
	gl.useProgram(pipeline); gl.bindVertexArray(vertexArray);
	gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
	gl.uniform1i(gl.getUniformLocation(pipeline, 'uCache'), 0);
	for (const [row, query] of [exact, offGrid].entries()) {
		const rows = new Int32Array(16), directions = new Int32Array(16), weights = new Float32Array(16);
		query.taps.forEach((tap, index) => { rows[index] = tap.packedRow;
			directions[index] = tap.directionIndex; weights[index] = tap.weight; });
		gl.uniform1i(gl.getUniformLocation(pipeline, 'uTapCount'), query.taps.length);
		gl.uniform1iv(gl.getUniformLocation(pipeline, 'uRows'), rows);
		gl.uniform1iv(gl.getUniformLocation(pipeline, 'uDirections'), directions);
		gl.uniform1fv(gl.getUniformLocation(pipeline, 'uWeights'), weights);
		gl.viewport(0, row, 15, 1); gl.drawArrays(gl.TRIANGLES, 0, 3);
	}
	gl.finish();
	const gpuValues = new Float32Array(30); gl.readPixels(0, 0, 15, 2, gl.RED, gl.FLOAT, gpuValues);
	if (gl.getError() !== gl.NO_ERROR) throw new Error('P4 runtime lookup failed.');
	const cpuValues = [sampleNative15(payload, ledger, exact), sampleNative15(payload, ledger, offGrid)];
	const comparisons = cpuValues.map((values, row) => ({maximumAbsoluteError: Math.max(...values.map(
		(value, index) => Math.abs(value - gpuValues[row * 15 + index])))}));
	const pathSampleCount = 15;
	const pathLengthMeters = 12000;
	const sampleDistancesMeters = Array.from({length: pathSampleCount},
		(_unused, index) => pathLengthMeters * (index + 0.5) / pathSampleCount);
	const pathSpectrum = Float64Array.from(cpuValues[1], (value) => value * pathLengthMeters);
	gl.deleteTexture(texture); gl.deleteTexture(output); gl.deleteFramebuffer(framebuffer);
	gl.deleteProgram(pipeline); gl.deleteVertexArray(vertexArray);
	return {schemaId: 'point-local-scene-cache-p4-browser-result-v1',
		cacheProvider: 'one complete P3 point-local scene cache', manifestIdentity: manifest.cacheIdentity,
		lookup: 'actual point -> altitude/local mu_s/source-relative W39 -> packed row -> Native15',
		observerProjectionUsed: false, validityMaskUsed: false,
		exact: {tapCount: exact.taps.length, weightSum: exact.weightSum, query: exact},
		offGrid: {tapCount: offGrid.taps.length, weightSum: offGrid.weightSum, query: offGrid},
		unsupportedFailure, comparisons,
		pathIntegration: {geometryRayLengthMeters: pathLengthMeters,
			pathSampleCount, sampleDistancesMeters, native15ChannelCount: pathSpectrum.length,
			finite: [...pathSpectrum].every(Number.isFinite), nonnegative: [...pathSpectrum].every((v) => v >= 0)},
		resources: {textureDeleted: !gl.isTexture(texture), framebufferDeleted: !gl.isFramebuffer(framebuffer)}};
}
