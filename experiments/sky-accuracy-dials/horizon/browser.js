import * as THREE from 'three';

/** Copy a scalar/vector uniform for evidence, preserving other JSON-compatible values.
 * @param {unknown} value Borrowed uniform value.
 * @returns {unknown} Snapshot-compatible scalar or vector.
 */
function uniformSnapshot(value) {
	if (value && typeof value === 'object' && 'toArray' in value && typeof value.toArray === 'function') return value.toArray();
	return value;
}

/** Observe exact installed shader stages on tiny Float32 targets, without changing live materials.
 * @returns {HorizonObservation} Observations and the exact original/derived shader sources.
 */
function observeHorizon() {
	const app = window.__horizonApplication;
	const renderer = app._sceneRuntime.renderer;
	const camera = app._sceneRuntime.camera;
	const runtime = app._modeController._activeRuntime;
	const pass = (window.__horizonPasses ?? []).filter((candidate) => !candidate._disposed && candidate.material?.fragmentShader?.includes('createInitialShaderState')).at(-1)
		?? runtime._composer.passes.find((candidate) => candidate.material?.fragmentShader?.includes('createInitialShaderState'));
	if (!pass?.material) throw new Error('Installed atmospheric shader unavailable.');
	const original = pass.material;
	const shader = original.fragmentShader;
	const expression = shader.match(/state\.outputRgba = encodeDisplayOutput\(([^;]+)\);/u)?.[1];
	if (!expression || !shader.includes('outColor = state.outputRgba;')) throw new Error('Unsupported display hook.');
	const output = `
	if (horizonStage == 0) outColor = state.outputRgba;
	else if (horizonStage == 1) outColor = vec4(${expression}, 1.0);
	else if (horizonStage == 2) outColor = vec4(spectralRadianceToLinearSrgb(state.pathRadiance), 1.0);
	else if (horizonStage == 3) outColor = vec4(state.ray.direction, state.bounds.endDistanceMeters);
	else if (horizonStage == 4) outColor = vec4(state.sceneHitMask, state.sceneDepth, state.bounds.hasSceneEndpoint ? 1.0 : 0.0, uColorResetTotalHorizontalIlluminanceLux);
	else {
		int offset = (horizonStage - 5) * 4;
		if (offset < 16) outColor = vec4(state.pathRadiance.channels[offset], state.pathRadiance.channels[offset+1], state.pathRadiance.channels[offset+2], offset+3 < 15 ? state.pathRadiance.channels[offset+3] : 0.0);
		else { offset -= 16; outColor = vec4(state.transmittance.channels[offset], state.transmittance.channels[offset+1], state.transmittance.channels[offset+2], offset+3 < 15 ? state.transmittance.channels[offset+3] : 0.0); }
	}`;
	const probeShader = shader.replace('void main() {', 'uniform vec2 horizonUv;\nuniform int horizonStage;\nvoid main() {')
		.replace('createInitialShaderState(screenTextureCoordinates)', 'createInitialShaderState(horizonUv)')
		.replace('outColor = state.outputRgba;', output);
	const uniforms = {...original.uniforms, horizonUv: {value: new THREE.Vector2()}, horizonStage: {value: 0}};
	const material = new THREE.RawShaderMaterial({vertexShader: original.vertexShader, fragmentShader: probeShader,
		glslVersion: THREE.GLSL3, uniforms, depthTest: false, depthWrite: false});
	const controlMaterial = new THREE.RawShaderMaterial({vertexShader: original.vertexShader,
		fragmentShader: shader.replace('void main() {', 'uniform vec2 horizonUv;\nvoid main() {').replace('createInitialShaderState(screenTextureCoordinates)', 'createInitialShaderState(horizonUv)'),
		glslVersion: THREE.GLSL3, uniforms, depthTest: false, depthWrite: false});
	const target = new THREE.WebGLRenderTarget(1, 1, {type: THREE.FloatType, format: THREE.RGBAFormat, depthBuffer: false});
	const geometry = new THREE.PlaneGeometry(2, 2);
	const scene = new THREE.Scene();
	const mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);
	const orthographic = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	const previous = renderer.getRenderTarget();
	const rays = [];
	const quaternion = camera.quaternion.toArray();
	const pitch = Math.asin(new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion(quaternion[0], quaternion[1], quaternion[2], quaternion[3])).y);
	try {
		for (const elevationDegrees of [0.05, 0.25, 1, 3, 10, 20]) {
			const y = 0.5 + Math.tan(elevationDegrees * Math.PI / 180 - pitch) / (2 * Math.tan(camera.getEffectiveFOV() * Math.PI / 360));
			for (const x of [0.2, 0.5, 0.8]) {
				uniforms.horizonUv.value.set(x, y);
				mesh.material = controlMaterial;
				renderer.setRenderTarget(target);
				renderer.render(scene, orthographic);
				const control = new Float32Array(4);
				renderer.readRenderTargetPixels(target, 0, 0, 1, 1, control);
				mesh.material = material;
				const stages = [];
				for (let stage = 0; stage < 13; stage++) {
					uniforms.horizonStage.value = stage;
					renderer.setRenderTarget(target);
					renderer.render(scene, orthographic);
					const values = new Float32Array(4);
					renderer.readRenderTargetPixels(target, 0, 0, 1, 1, values);
					if (![...values].every(Number.isFinite)) throw new Error('Nonfinite shader observation.');
					stages.push([...values]);
				}
				if (Math.abs(Math.hypot(...stages[3].slice(0, 3)) - 1) > 0.0001) throw new Error('Invalid ray readback or shader compilation.');
				if (Math.max(...stages[0].map((value, index) => Math.abs(value - control[index]))) > 0.0001) throw new Error('Probe output differs from unmodified display control.');
				rays.push({uv: [x, y], elevationDegrees, stages});
			}
		}
		const gl = renderer.getContext();
		const debug = gl.getExtension('WEBGL_debug_renderer_info');
		return {facts: {state: app._state, selections: app._productionSelections,
			camera: {position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.getEffectiveFOV(), aspect: camera.aspect},
			uniforms: Object.fromEntries(Object.entries(original.uniforms).filter(([name]) => /Illuminance|DirectionTo|SourcePosition|Viewport|CameraWorld|Observer/.test(name)).map(([name, uniform]) => [name, uniformSnapshot(uniform.value)])),
			renderer: gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER), glError: gl.getError()}, shader, probeShader, rays};
	} finally {
		renderer.setRenderTarget(previous);
		material.dispose(); controlMaterial.dispose(); geometry.dispose(); target.dispose();
	}
}

window.__observeHorizon = observeHorizon;
