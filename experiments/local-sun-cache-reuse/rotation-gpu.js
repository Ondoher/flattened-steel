import * as THREE from 'three';
import {
	ReceiverEnvironmentLightTransportShader,
	DIRECTION_TEXTURE_VALUE_KEY,
} from '../../src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightTransportShader.js';

/** Run the production transport with an experiment-owned arbitrary ray ingress.
 * The adaptation changes only the direction texture size and diagnostic outputs.
 * @param {LocalSunRotationGpuRayRequest} request - Model, live cache, backend and physical directions.
 * @returns {Promise<LocalSunRotationGpuRayResult[]>} - FP32 radiance, transmission and path bounds.
 */
export async function gpuRays(request) {
	const {owners, cache, backend, renderer, directions} = request;
	const assembly = new ReceiverEnvironmentLightTransportShader().create({
		model: owners.model,
		scatteringCache: cache,
	});
	const expected = 'clamp(int(floor(textureCoordinates.x * 32.0)), 0, 31)';
	if (!assembly.fragmentShaderSource.includes(expected)) throw new Error('Production ray ingress changed.');
	let source = assembly.fragmentShaderSource
		.replace(
			expected,
			`clamp(int(floor(textureCoordinates.x * ${directions.length}.0)), 0, ${directions.length - 1})`,
		)
		.replace(
			'outColor = vec4(state.pathRadiance.channels[uReceiverEnvironmentOutputChannel], 0.0, 0.0, 1.0);',
			'outColor = vec4(state.pathRadiance.channels[uReceiverEnvironmentOutputChannel], state.transmittance.channels[uReceiverEnvironmentOutputChannel], state.bounds.startDistanceMeters, state.bounds.endDistanceMeters);',
		);
	const data = new Float32Array(directions.length * 4);
	directions.forEach((d, i) => data.set([...d, 1], i * 4));
	const precise = !request.receiverDirections && assembly.fragmentShaderSource.includes('vec2 p2SelectedEnd');
	const lowData = new Float32Array(directions.length * 4);
	directions.forEach((d, i) =>
		lowData.set(
			d.map((v) => v - Math.fround(v)),
			i * 4,
		),
	);
	const lowTexture = new THREE.DataTexture(lowData, directions.length, 1, THREE.RGBAFormat, THREE.FloatType);
	lowTexture.needsUpdate = true;
	if (precise) {
		source = source
			.replace('vec3 p2DirectionLow = vec3(0.0);', '')
			.replace(
				'ViewRay reconstructViewRay(',
				'uniform sampler2D uP2DirectionLow;\nvec3 p2DirectionLow = vec3(0.0);\nViewRay reconstructViewRay(',
			)
			.replace(
				'vec3 direction = normalize(texelFetch(uReceiverEnvironmentDirections, ivec2(directionIndex, 0), 0).xyz);',
				'p2DirectionLow = texelFetch(uP2DirectionLow, ivec2(directionIndex, 0), 0).xyz;\nvec3 direction = texelFetch(uReceiverEnvironmentDirections, ivec2(directionIndex, 0), 0).xyz;',
			)
			.replace(
				'state.bounds.startDistanceMeters, state.bounds.endDistanceMeters);',
				'p2SelectedEnd.y, p2SelectedEnd.x);',
			);
	}
	const texture = new THREE.DataTexture(data, directions.length, 1, THREE.RGBAFormat, THREE.FloatType);
	texture.needsUpdate = true;
	/** @type {LocalSunRotationUniformMap} */
	const uniforms = {};
	if (precise) uniforms.uP2DirectionLow = {value: lowTexture};
	/** @type {LocalSunRotationUniformMap} */
	const cacheUniforms = {};
	for (const contribution of assembly.contributions) {
		for (const u of contribution.uniforms) {
			let value = u.defaultValue ?? null;
			if (u.name === 'uCameraWorldPositionMeters')
				value = new THREE.Vector3(...owners.geometry.configuration.observerPosition.coordinates);
			else if (u.type === 'vec3' && Array.isArray(value)) value = new THREE.Vector3(...value);
			else if (u.type === 'mat4' && Array.isArray(value)) value = new THREE.Matrix4().fromArray(value);
			uniforms[u.name] = {value};
		}
		for (const t of contribution.textures) {
			uniforms[t.name] = {value: t.valueKey === DIRECTION_TEXTURE_VALUE_KEY ? texture : null};
			if (t.valueKey !== DIRECTION_TEXTURE_VALUE_KEY) cacheUniforms[t.valueKey] = uniforms[t.name];
		}
	}
	backend.installRuntimeBindings({bindings: cache.getRuntimeBindings(), uniforms: cacheUniforms});
	const retained=request.programRetention;
	if(retained?.material && retained.source!==source){retained.material.dispose();retained.material=null;}
	const material = retained?.material ?? new THREE.RawShaderMaterial({
		glslVersion: THREE.GLSL3,
		vertexShader:
			'precision highp float; in vec3 position; out vec2 screenTextureCoordinates; void main(){screenTextureCoordinates=position.xy*0.5+0.5;gl_Position=vec4(position.xy,0.,1.);}',
		fragmentShader: source.replace(/^#version 300 es\s*/u, ''),
		uniforms,
		depthTest: false,
		depthWrite: false,
	});
	if(material.uniforms!==uniforms){for(const [name,value] of Object.entries(uniforms))material.uniforms[name].value=value.value;}
	material.uniformsNeedUpdate=true;
	if(retained){retained.material=material;retained.source=source;}
	const geometry = new THREE.PlaneGeometry(2, 2),
		scene = new THREE.Scene(),
		camera = new THREE.Camera();
	const mesh = new THREE.Mesh(geometry, material);
	mesh.frustumCulled = false;
	scene.add(mesh);
	const target = new THREE.WebGLRenderTarget(directions.length, 1, {
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		depthBuffer: false,
	});
	const previous = renderer.getRenderTarget(),
		pixels = new Float32Array(directions.length * 4);
	const results = directions.map(() => ({radiance: [], transmittance: [], start: 0, end: 0, endHigh: 0, endLow: 0}));
	try {
		request.signal?.throwIfAborted();
		await renderer.compileAsync(scene, camera);
		for (let c = 0; c < 15; c++) {
			request.signal?.throwIfAborted();
			material.uniforms.uReceiverEnvironmentOutputChannel.value = c;
			renderer.setRenderTarget(target);
			renderer.render(scene, camera);
			if(request.cooperativeReadback) {
				const pending=renderer.readRenderTargetPixelsAsync(target,0,0,directions.length,1,pixels);
				renderer.setRenderTarget(previous);
				await pending;
				request.signal?.throwIfAborted();
			} else renderer.readRenderTargetPixels(target, 0, 0, directions.length, 1, pixels);
			for (let i = 0; i < directions.length; i++) {
				results[i].radiance.push(pixels[4 * i]);
				results[i].transmittance.push(pixels[4 * i + 1]);
				results[i].start = precise ? 0 : pixels[4 * i + 2];
				results[i].end = pixels[4 * i + 3] + (precise ? pixels[4 * i + 2] : 0);
				results[i].endHigh = pixels[4 * i + 3];
				results[i].endLow = precise ? pixels[4 * i + 2] : 0;
			}
		}
		return results;
	} finally {
		renderer.setRenderTarget(previous);
		target.dispose();
		geometry.dispose();
		if(!retained)material.dispose();
		texture.dispose();
		lowTexture.dispose();
	}
}
