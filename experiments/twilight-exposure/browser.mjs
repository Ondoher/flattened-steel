/** Install a read-only production-app probe in an owned browser. Its single reflective
 * any boundary accesses private diagnostic collaborators; every returned observation
 * is checked by the Node runner before it becomes accepted evidence.
 */
export function installProbe() {
	const G = /** @type {any} */ (globalThis), a = G.proofApplication, host = a._sceneRuntime;
	const create = host.createAtmosphereComposer.bind(host);
	host.createAtmosphereComposer = (...args) => {
		const resources = create(...args), render = resources.composer.render;
		resources.composer.render = function (...values) {G.twilightComposer = this; return render.apply(this, values);};
		return resources;
	};
	let resources = null, last = null;
	const pack = (array) => {
		const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength); let binary = '';
		for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
		return btoa(binary);
	};
	const dispose = () => {if (resources) {resources.material.dispose(); resources.target.dispose(); resources = null;}};
	G.twilightVariants = async (variants) => {
		if (!last) throw Error('Capture a physical scene before display variants');
		const {pass, input, renderer, width, height} = last, gl = renderer.getContext(), original = pass._material;
		const refresh = pass._refreshUniformValues, screen = pass.renderToScreen, value = original.uniforms.uColorResetTotalHorizontalIlluminanceLux.value;
		const results = [];
		try {
			for (const variant of variants) {
				pass._refreshUniformValues = () => {refresh?.(); original.uniforms.uColorResetTotalHorizontalIlluminanceLux.value = variant.effectiveLux;};
				pass.renderToScreen = true;
				const start = performance.now(); pass.render(renderer, null, input);
				const bytes = new Uint8Array(width * height * 4); gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
				if (gl.getError() !== 0) throw Error('Variant WebGL error');
				results.push({id: variant.id, effectiveLux: variant.effectiveLux, milliseconds: performance.now() - start, pixels: pack(bytes)});
			}
		} finally {pass._refreshUniformValues = refresh; original.uniforms.uColorResetTotalHorizontalIlluminanceLux.value = value; pass.renderToScreen = screen; renderer.setRenderTarget(null);}
		return results;
	};
	G.twilightCapture = async (spec) => {
		const started = performance.now(), scene = a._sceneRuntime, runtime = a._modeController._activeRuntime, mode = a._modeController.currentMode, camera = scene.camera;
		const relative = mode.geometry.resolveSourceRelativePosition({position: mode.geometry.mapObserverLocalScenePointToModelPosition({coordinates: camera.position.toArray(), units: 'scene-units'}, {sceneScale: mode.sceneScale})});
		const sun = mode.geometry.expressCelestialDirectionInScene ? mode.geometry.expressCelestialDirectionInScene(relative.directionToSource) : [relative.directionToSource[0], relative.directionToSource[2], -relative.directionToSource[1]];
		const horizontal = Math.hypot(sun[0], sun[2]);
		if (!G.twilightHeading || spec.resetHeading) G.twilightHeading = [sun[0] / horizontal, 0, sun[2] / horizontal];
		const heading = G.twilightHeading, view = spec.view ?? 'limb';
		let direction;
		if (view === 'sun') direction = sun;
		else if (view === 'zenith') direction = [0, 0.999999, -0.0014142132];
		else {
			const pitch = -6 * Math.PI / 180, sign = view === 'away' ? -1 : 1;
			direction = [heading[0] * Math.cos(pitch) * sign, Math.sin(pitch), heading[2] * Math.cos(pitch) * sign];
		}
		camera.lookAt(camera.position.x + direction[0], camera.position.y + direction[1], camera.position.z + direction[2]); camera.updateMatrixWorld(true);
		scene._renderOperation();
		const composer = runtime._composer ?? G.twilightComposer;
		if (!composer) throw Error('Current composer unavailable');
		const pass = composer.passes.find(p => p._material?.uniforms?.uColorResetTotalHorizontalIlluminanceLux);
		if (!pass) throw Error('Production p2 pass unavailable');
		const renderer = scene.renderer, gl = renderer.getContext(), width = scene.canvas.width, height = scene.canvas.height;
		const native = new Uint8Array(width * height * 4); renderer.setRenderTarget(null); gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, native);
		const input = composer.readBuffer, original = pass._material;
		if (pass.needsSwap !== false || original.uniforms.uSceneColorTexture.value !== input.texture) throw Error('Native pass input buffer identity differs from the retained source');
		if (!resources || resources.pass !== pass || resources.target.width !== width || resources.target.height !== height) {
			dispose();
			const material = original.clone(), needle = /vec4 encodeDisplayOutput\(vec3 linearSrgb\) \{[\s\S]*?\n\}/u;
			if (!needle.test(material.fragmentShader)) throw Error('Production encode boundary not found');
			if (!material.fragmentShader.includes('vec3 filteredStellarLinearSrgb =')) throw Error('Expected stellar source projection unavailable');
			material.fragmentShader = 'uniform highp int uTwilightLayer;\n' + material.fragmentShader.replace(needle, 'vec4 encodeDisplayOutput(vec3 linearSrgb) { return vec4(linearSrgb,1.0);\n}').replace('return pathLinearSrgb + sceneLinearSrgb * sceneTransmittanceRgb;', 'if(uTwilightLayer==1)return filteredStellarLinearSrgb;\n if(uTwilightLayer==2)return spectralRadianceToLinearSrgb(state.pathRadiance);\n return pathLinearSrgb + sceneLinearSrgb * sceneTransmittanceRgb;');
			material.uniforms = {...original.uniforms, uTwilightLayer: {value: 0}};
			const target = new input.constructor(width, height, {type: 1015, format: 1023, depthBuffer: false, stencilBuffer: false});
			resources = {pass, material, target};
		}
		const kMatch = original.fragmentShader.match(/const float DISPLAY_TONE_MAP_K = ([^;]+);/u), layers = {}, oldScreen = pass.renderToScreen, previousTarget = renderer.getRenderTarget();
		try {
			pass._material = resources.material; pass._mesh.material = resources.material; pass.renderToScreen = false;
			await renderer.compileAsync(pass._scene, pass._camera);
			for (const layer of spec.layers ?? [0]) {
				resources.material.uniforms.uTwilightLayer.value = layer;
				pass.render(renderer, resources.target, input);
				renderer.setRenderTarget(resources.target); const pixels = new Float32Array(width * height * 4);
				gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, pixels);
				if (pixels.some(v => !Number.isFinite(v))) throw Error('Nonfinite lossless output');
				layers[layer] = pack(pixels);
			}
		} finally {pass._material = original; pass._mesh.material = original; pass.renderToScreen = oldScreen; renderer.setRenderTarget(previousTarget);}
		if (gl.getError() !== 0) throw Error('Capture WebGL error');
		const debug = gl.getExtension('WEBGL_debug_renderer_info');
		const facts = {state: a._publishedState, width, height, meterLux: original.uniforms.uColorResetTotalHorizontalIlluminanceLux.value, toneMapK: Number(kMatch[1]), viewIntervals: original.uniforms.uTransportPathIntervalCount?.value, camera: {position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, aspect: camera.aspect, direction}, sunScene: sun, sunElevationDegrees: Math.asin(sun[1]) * 180 / Math.PI, solarZenithDegrees: document.querySelector('.flat32-shell').getAttribute('data-flat32-solar-zenith-degrees'), medium: mode.algorithm32.config.config.atmosphere?.constants ?? mode.algorithm32.config.config.profile?.models.atmosphere.constants, renderer: gl.getParameter(debug.UNMASKED_RENDERER_WEBGL), glError: gl.getError(), seconds: (performance.now() - started) / 1000};
		last = {pass, input, renderer, width, height};
		return {facts, native: pack(native), layers};
	};
	G.twilightDispose = dispose;
}
