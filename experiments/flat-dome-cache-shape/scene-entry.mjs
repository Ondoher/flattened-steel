import * as THREE from 'three';
import {DomeCacheBuilder} from './DomeCacheBuilder.mjs';
import {DomeSceneRenderer} from './DomeSceneRenderer.mjs';

/**
 * Owns the single live Three renderer and its cache for one evidence execution.
 *
 * @param {DomeSceneRequest} request - Frozen physical inputs and rendering scope.
 * @returns {Promise<Record<string, unknown>>} - Stage telemetry.
 */
async function execute(request) {
	const renderer = new THREE.WebGLRenderer({antialias: false, preserveDrawingBuffer: true});
	renderer.autoClear = false;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
	renderer.debug.checkShaderErrors = true;
	document.body.appendChild(renderer.domElement);
	const gl = renderer.getContext();
	const extension = gl.getExtension('WEBGL_debug_renderer_info');
	const device = String(gl.getParameter(extension ? extension.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
	if (!gl.getExtension('EXT_color_buffer_float') || /swiftshader|software|llvmpipe/i.test(device)) {
		renderer.dispose();
		throw new Error('Actual float-capable hardware renderer required.');
	}
	let cache;
	let scene;
	try {
		await window.domeProgress('three', 'Building a completed cache on the actual Three renderer.');
		cache = await new DomeCacheBuilder(renderer).build(request);
		const frames = [];
		let cameraControls = [];
		if (request.stage !== 'cache') {
			scene = new DomeSceneRenderer(renderer, cache, request);
			cameraControls = await scene.cameraProof();
			frames.push(await scene.render('inward', -1, request.width, request.height));
			frames.push(await scene.render('outward', 1, request.width, request.height));
			if (request.stage === 'pilot') {
				frames.push(await scene.render('rim-native-scale', 1, 1280, 720, 328, 64));
			}
		}
		return {
			device,
			threeRevision: THREE.REVISION,
			identity: cache.identity,
			cache: cache.metadata,
			frames,
			cameraControls,
		};
	} finally {
		const before = {...renderer.info.memory};
		scene?.dispose();
		cache?.dispose();
		const after = {...renderer.info.memory};
		renderer.dispose();
		renderer.forceContextLoss();
		await window.domeArtifact('cleanup.json', {
			before,
			after,
			contextLossRequested: true,
			cacheDisposed: cache?.disposed ?? true,
			scope: 'Three-owned resource counters; opaque driver/program allocations are not measured.',
		});
	}
}

window.domeScene = {execute};
