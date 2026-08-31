import * as THREE from '../../../node_modules/three/build/three.module.js';
import DistantSunSceneCacheController from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheController.js';
import {ThreeCacheBackend} from '../../../src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';

/** @param {EventTarget} target - Event source. @param {string} name - One-shot event. */
function event(target, name) {
	const observed = new Promise((resolve) =>
		target.addEventListener(
			name,
			(eventValue) => {
				if (name === 'webglcontextlost') eventValue.preventDefault();
				resolve(eventValue);
			},
			{once: true},
		),
	);
	return Promise.race([
		observed,
		new Promise((_, reject) => setTimeout(() => reject(new Error(`PA5 timed out waiting for ${name}.`)), 30_000)),
	]);
}

/** @param {string} value - Observable browser-proof phase. */
function phase(value) {
	console.log(`PA5 phase: ${value}`);
}

/** Load, reuse, preserve, restore, swap, and dispose the complete PA5 cache on real WebGL2. */
export async function runPa5LifecycleBrowser() {
	const control = await fetch('/control.json').then((response) => response.json());
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, stencil: false});
	if (!context) throw new Error('PA5 lifecycle proof requires WebGL2.');
	const renderer = new THREE.WebGLRenderer({canvas, context});
	const backend = new ThreeCacheBackend({THREE, renderer});
	const controller = new DistantSunSceneCacheController({
		backend,
		asset: control.asset,
	});
	let first = null;
	let swapped = null;
	let restored = null;

	try {
		phase('initial-load');
		const loadStarted = performance.now();
		first = await controller.createScatteringCache();
		const initialLoadMilliseconds = performance.now() - loadStarted;
		const reused = await controller.createScatteringCache();
		if (reused !== first) throw new Error('PA5 exact reuse returned a different cache.');

		let failedReplacement = null;
		try {
			await controller.replaceSceneCache(control.failedAsset);
		} catch (error) {
			failedReplacement = {name: error.name, message: error.message};
		}
		if (!failedReplacement || controller.active !== first) {
			throw new Error('PA5 failed replacement did not preserve the active cache.');
		}
		first.getRuntimeBindings();
		phase('atomic-complete-cache-swap');
		swapped = await controller.restoreSceneCache();
		if (swapped === first || controller.active !== swapped) {
			throw new Error('PA5 same-context replacement did not publish a new complete cache.');
		}
		let replacedCacheDisposed = false;
		try {
			first.getRuntimeBindings();
		} catch (error) {
			replacedCacheDisposed = /disposed/u.test(error.message);
		}
		if (!replacedCacheDisposed) throw new Error('PA5 same-context replacement did not retire the old cache.');
		const atomicTransitionResources = controller.resources;

		phase('context-loss');
		const extension = context.getExtension('WEBGL_lose_context');
		if (!extension) throw new Error('PA5 lifecycle proof requires WEBGL_lose_context.');
		const lost = event(canvas, 'webglcontextlost');
		extension.loseContext();
		await lost;
		controller.handleContextLoss();
		if (controller.active !== null) throw new Error('PA5 context loss retained invalid renderer resources.');
		const lostCacheDisposed = (() => {
			try {
				swapped.getRuntimeBindings();
				return false;
			} catch (error) {
				return /disposed/u.test(error.message);
			}
		})();
		if (!lostCacheDisposed) throw new Error('PA5 context loss did not release the invalid cache.');
		await new Promise((resolve) => setTimeout(resolve, 100));
		const contextRestored = event(canvas, 'webglcontextrestored');
		extension.restoreContext();
		await contextRestored;

		phase('exact-restoration-reload');
		const restoreStarted = performance.now();
		restored = await controller.restoreSceneCache();
		const restorationMilliseconds = performance.now() - restoreStarted;
		if (restored === first || controller.active !== restored) {
			throw new Error('PA5 context restoration did not publish a complete replacement cache.');
		}
		const uniforms = {
			'cache.sceneCumulativeScatteringDensity': {value: null},
			'cache.sceneLogicalToUniqueDirection': {value: null},
		};
		backend.installRuntimeBindings({bindings: restored.getRuntimeBindings(), uniforms});
		const debugRenderer = context.getExtension('WEBGL_debug_renderer_info');
		const resources = controller.resources;
		const result = {
			accepted: true,
			cacheIdentity: restored.cacheIdentity,
			gpu: {
				api: context.getParameter(context.VERSION),
				renderer: debugRenderer
					? context.getParameter(debugRenderer.UNMASKED_RENDERER_WEBGL)
					: context.getParameter(context.RENDERER),
			},
			initialLoadMilliseconds,
			restorationMilliseconds,
			reuse: true,
			failedReplacement,
			failedReplacementPreservedActive: true,
			contextLossRestored: true,
			completeCacheSwapped: true,
			replacedCacheDisposed: true,
			lostCacheDisposed: true,
			atomicTransitionResources,
			restoredResources: resources,
			textures: [
				uniforms['cache.sceneCumulativeScatteringDensity'].value.image,
				uniforms['cache.sceneLogicalToUniqueDirection'].value.image,
			].map((image) => ({width: image.width, height: image.height, depth: image.depth ?? 1})),
			webglError: context.getError(),
		};
		if (result.webglError !== context.NO_ERROR) {
			throw new Error(`PA5 lifecycle produced WebGL error ${result.webglError}.`);
		}
		phase('complete');
		return result;
	} finally {
		controller.dispose();
		controller.dispose();
		backend.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		canvas.remove();
	}
}
