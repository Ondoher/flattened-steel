import {AtlasProbePath, DenseProbePath, sameFloat32} from './S3ProbePaths.js';

/** Establish the WebGL2 atlas capability needed before real block ingestion begins in S4. */
export async function runS3AtlasHostSmoke() {
	const control = await fetch('/control.json', {cache: 'no-store'}).then((response) => response.json());
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2');
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const maximumTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
	const maximumArrayLayers = gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS);
	if (maximumTextureSize < control.atlas.widthTexels || maximumArrayLayers < control.atlas.maximumResidentLayers) throw new Error('WebGL2 atlas capability is below the frozen S0--S2 requirement.');
	const vertex = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertex, '#version 300 es\nin vec2 position; void main(){gl_Position=vec4(position,0.,1.);}');
	gl.compileShader(vertex);
	const fragment = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragment, '#version 300 es\nprecision highp float; precision highp sampler2DArray; uniform sampler2DArray blockArray; out vec4 color; void main(){color=vec4(texelFetch(blockArray,ivec3(0,0,0),0).r);}');
	gl.compileShader(fragment);
	if (!gl.getShaderParameter(vertex, gl.COMPILE_STATUS) || !gl.getShaderParameter(fragment, gl.COMPILE_STATUS)) throw new Error(`Atlas shader did not compile: ${gl.getShaderInfoLog(vertex)} ${gl.getShaderInfoLog(fragment)}`);
	const dense = new DenseProbePath(new Float32Array([0, 1.5, -0, 42]));
	const atlas = new AtlasProbePath(new Map([[10, new Float32Array([0, 1.5])], [11, new Float32Array([-0, 42])]]));
	const probeLocations = [[0, {block: 10, ordinal: 0}], [1, {block: 10, ordinal: 1}], [2, {block: 11, ordinal: 0}], [3, {block: 11, ordinal: 1}]];
	if (!probeLocations.every(([ordinal, location]) => sameFloat32(dense.probe(ordinal), atlas.probe(location)))) throw new Error('Common dense and atlas probe contract failed.');
	return {schemaId: 'gpu-resident-shared-block-cache-s3-browser-v1', webglVersion: gl.getParameter(gl.VERSION), renderer: gl.getParameter(gl.RENDERER), maximumTextureSize, maximumArrayLayers, frozenRequiredLayers: control.atlas.maximumResidentLayers, atlasShaderCompiled: true, commonProbeContract: true};
}
