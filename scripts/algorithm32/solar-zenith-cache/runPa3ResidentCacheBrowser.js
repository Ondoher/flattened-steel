import * as THREE from '../../../node_modules/three/build/three.module.js';
import {ThreeCacheBackend} from '../../../src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import DistantSunSceneCacheAssetLoader from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheAssetLoader.js';

/** Load and eagerly upload the complete PA3 scene cache in a real WebGL2 renderer. */
export async function runPa3ResidentCacheBrowser() {
	const control = await fetch('/control.json').then((response) => response.json());
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, stencil: false});
	if (!context) throw new Error('PA3 resident cache proof requires WebGL2.');
	const renderer = new THREE.WebGLRenderer({canvas, context});
	const backend = new ThreeCacheBackend({THREE, renderer});
	const loader = new DistantSunSceneCacheAssetLoader({backend, assetRoot: '/package/'});
	const started = performance.now();
	let cache = null;

	try {
		cache = await loader.load(control.loadRequest);
		const bindings = cache.getRuntimeBindings();
		const uniforms = {
			'cache.sceneCumulativeScatteringDensity': {value: null},
			'cache.sceneLogicalToUniqueDirection': {value: null},
		};
		backend.installRuntimeBindings({bindings, uniforms});
		const valuesTexture = uniforms['cache.sceneCumulativeScatteringDensity'].value;
		const indexTexture = uniforms['cache.sceneLogicalToUniqueDirection'].value;
		const debugRenderer = context.getExtension('WEBGL_debug_renderer_info');
		const result = {
			accepted: true,
			cacheIdentity: cache.cacheIdentity,
			elapsedMilliseconds: performance.now() - started,
			gpu: {
				api: context.getParameter(context.VERSION),
				renderer: debugRenderer
					? context.getParameter(debugRenderer.UNMASKED_RENDERER_WEBGL)
					: context.getParameter(context.RENDERER),
			},
			bindings: bindings.bindings.map((binding) => ({
				id: binding.id,
				valueKey: binding.valueKey,
				fieldId: binding.fieldId,
			})),
			textures: [
				{
					valueKey: 'cache.sceneCumulativeScatteringDensity',
					internalFormat: valuesTexture.internalFormat,
					width: valuesTexture.image.width,
					height: valuesTexture.image.height,
					depth: valuesTexture.image.depth,
				},
				{
					valueKey: 'cache.sceneLogicalToUniqueDirection',
					internalFormat: indexTexture.internalFormat,
					width: indexTexture.image.width,
					height: indexTexture.image.height,
					depth: 1,
				},
			],
			shaderIdentity: cache.createShaderContribution().id,
			webglError: context.getError(),
		};
		if (result.webglError !== context.NO_ERROR)
			throw new Error(`PA3 upload produced WebGL error ${result.webglError}.`);
		return result;
	} finally {
		cache?.dispose();
		backend.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		canvas.remove();
	}
}
