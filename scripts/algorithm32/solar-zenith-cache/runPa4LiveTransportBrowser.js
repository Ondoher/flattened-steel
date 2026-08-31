import * as THREE from '../../../node_modules/three/build/three.module.js';
import {EffectComposer} from '../../../node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '../../../node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import {Algorithm32Bindings} from '../../../src/algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {ThreeCacheBackend} from '../../../src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {createDistantSunSceneState} from '../../../src/flat32/DistantSunSceneState.js';
import {SphericalDistantMode} from '../../../src/flat32/SphericalDistantMode.js';

/** Render one production-assembled nautical-twilight frame through the PA4 point-local Q30 path. */
export async function runPa4LiveTransportBrowser() {
	const control = await fetch('/control.json').then((response) => response.json());
	const width = 640;
	const height = 360;
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: true,
		stencil: false,
		preserveDrawingBuffer: true,
	});
	if (!context) throw new Error('PA4 live transport proof requires WebGL2.');
	const renderer = new THREE.WebGLRenderer({canvas, context});
	renderer.setPixelRatio(1);
	renderer.setSize(width, height, false);
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	const camera = new THREE.PerspectiveCamera(78, width / height, 0.002, 500);
	camera.position.set(0, 0.0017, 0);
	const sceneDepthMax = {value: 500000, units: 'meters'};
	const sceneScale = {value: 1000, units: 'meters-per-scene-unit'};
	const target = new THREE.WebGLRenderTarget(width, height, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat,
		type: THREE.HalfFloatType,
		depthBuffer: true,
		stencilBuffer: false,
	});
	target.texture.colorSpace = THREE.NoColorSpace;
	const composer = new EffectComposer(renderer, target);
	composer.setPixelRatio(1);
	composer.setSize(width, height);
	composer.addPass(new RenderPass(scene, camera));
	const backend = new ThreeCacheBackend({THREE, renderer});
	const sceneState = createDistantSunSceneState({
		observation: control.observation,
		observerHeight: {value: 1.7, units: 'meters'},
		observerUpDirection: [0, 0, 1],
	});
	const mode = new SphericalDistantMode({
		sceneState,
		sceneScale,
		sourceAngularRadius: {value: 0.004675, units: 'radians'},
		maximumScatteringOrder: 4,
		celestialSourcesEnabled: false,
		sceneCacheAsset: control.sceneCacheAsset,
	});
	const algorithm32 = mode.algorithm32;
	const groundEndpoints = mode.geometry.createThreeEndpointObjects({
		name: 'pa4-nautical-spherical-ground',
		sceneScale,
		widthSegments: 192,
		heightSegments: 96,
		visualMaterialLighting: 'lambert',
		groundVisualMesh: {kind: 'local-spherical-patch'},
	});
	scene.add(...groundEndpoints.visualObjects);
	const sunScene = mode.geometry.expressCelestialDirectionInScene(mode.geometry.configuration.directionToSource);
	const horizontal = new THREE.Vector3(sunScene[0], 0, sunScene[2]).normalize();
	camera.lookAt(camera.position.clone().add(horizontal));
	camera.updateMatrixWorld(true);
	const bindingValues = Algorithm32Bindings.create(THREE, sceneDepthMax);
	Algorithm32Bindings.update({
		bindingValues,
		camera,
		props: {config: algorithm32.config.config, sceneScale},
	});
	const started = performance.now();
	let handle = null;
	const objectGeometry = new THREE.BoxGeometry(1, 1, 1);
	const objectMaterial = new THREE.MeshBasicMaterial({color: 0x805020});
	const object = new THREE.Mesh(objectGeometry, objectMaterial);
	object.position.copy(camera.position).addScaledVector(horizontal, 2);
	object.position.y = 0.5;
	object.visible = false;
	scene.add(object);

	try {
		handle = await algorithm32.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: {width, height, units: 'pixels'},
			sceneScale,
			sceneDepthMax,
			bindingValues,
			cacheBackend: backend,
		});
		await handle.prepare(renderer);
		const sceneInputCapture = composer.passes.find(
			(pass) => pass.getDiagnostics?.().kind === 'algorithm32-scene-input-capture-pass',
		);
		if (!sceneInputCapture?._depthTarget || !sceneInputCapture?._hitTarget) {
			throw new Error('PA4 proof could not inspect the live scene-input capture targets.');
		}
		const readSceneInput = (x = Math.floor(width / 2), y = Math.floor(height / 2)) => {
			const depthRgba = new Uint8Array(4);
			const hitRgba = new Uint8Array(4);
			renderer.readRenderTargetPixels(sceneInputCapture._depthTarget, x, y, 1, 1, depthRgba);
			renderer.readRenderTargetPixels(sceneInputCapture._hitTarget, x, y, 1, 1, hitRgba);
			const packedDepth = depthRgba[0] * 65536 + depthRgba[1] * 256 + depthRgba[2];
			return {
				depthRgba: Array.from(depthRgba),
				hitRgba: Array.from(hitRgba),
				depthMeters: (packedDepth / 16777214) * sceneDepthMax.value,
			};
		};
		composer.render(0);
		const objectFreeSceneInput = readSceneInput();
		const objectFreeGroundSceneInput = readSceneInput(Math.floor(width / 2), Math.floor(height * 0.05));
		const objectFreePixel = new Uint8Array(4);
		context.readPixels(
			Math.floor(width / 2),
			Math.floor(height / 2),
			1,
			1,
			context.RGBA,
			context.UNSIGNED_BYTE,
			objectFreePixel,
		);
		const objectFreeImageDataUrl = canvas.toDataURL('image/png');

		object.visible = true;
		object.updateMatrixWorld(true);
		const expectedObjectIntersection = new THREE.Raycaster(camera.position, horizontal, 0, 10).intersectObject(
			object,
			false,
		)[0];
		if (!expectedObjectIntersection) {
			throw new Error('PA4 proof ray did not intersect its opaque control object.');
		}
		const expectedObjectDepthMeters = expectedObjectIntersection.distance * sceneScale.value;
		composer.render(0);
		const objectShortenedSceneInput = readSceneInput();
		const objectShortenedPixel = new Uint8Array(4);
		context.readPixels(
			Math.floor(width / 2),
			Math.floor(height / 2),
			1,
			1,
			context.RGBA,
			context.UNSIGNED_BYTE,
			objectShortenedPixel,
		);
		const objectShortenedImageDataUrl = canvas.toDataURL('image/png');
		if (objectFreeSceneInput.hitRgba[0] !== 0) {
			throw new Error('PA4 object-free center ray unexpectedly reported a scene-object endpoint.');
		}
		if (objectFreeGroundSceneInput.hitRgba[0] !== 255) {
			throw new Error('PA4 spherical ground probe did not report a geometry-owned scene endpoint.');
		}
		if (objectShortenedSceneInput.hitRgba[0] !== 255) {
			throw new Error('PA4 opaque-object center ray did not report a scene-object endpoint.');
		}
		if (Math.abs(objectShortenedSceneInput.depthMeters - expectedObjectDepthMeters) > 10) {
			throw new Error(
				`PA4 opaque-object center endpoint was ${objectShortenedSceneInput.depthMeters} meters; expected ${expectedObjectDepthMeters}.`,
			);
		}
		const webglError = context.getError();
		if (webglError !== context.NO_ERROR) throw new Error(`PA4 live render produced WebGL error ${webglError}.`);
		return {
			accepted: true,
			cacheIdentity: control.sceneCacheAsset.loadRequest.cacheIdentity,
			elapsedMilliseconds: performance.now() - started,
			execution: algorithm32.config.config.execution,
			geometryDirectionToSource: mode.geometry.configuration.directionToSource,
			color: {
				id: algorithm32.config.config.color.id,
				qualifiedByRuns: [
					'000466-bruneton-source-luminance-lift-spherical-comparison',
					'000467-bruneton-source-luminance-lift-flat-local-comparison',
				],
				sourceDerivedLocalLuminance: algorithm32.brightnessProxy,
			},
			centerPixelRgba: {
				objectFree: Array.from(objectFreePixel),
				objectShortened: Array.from(objectShortenedPixel),
			},
			centerSceneInput: {
				objectFree: objectFreeSceneInput,
				objectShortened: {
					...objectShortenedSceneInput,
					expectedObjectDepthMeters,
				},
			},
			ground: {
				metadata: groundEndpoints.metadata,
				lowerFrameSceneInput: objectFreeGroundSceneInput,
			},
			diagnostics: handle.getDiagnostics(),
			gpu: {
				api: context.getParameter(context.VERSION),
				renderer: context.getParameter(
					context.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER,
				),
			},
			webglError,
			imageDataUrls: {
				objectFree: objectFreeImageDataUrl,
				objectShortened: objectShortenedImageDataUrl,
			},
		};
	} finally {
		handle?.dispose();
		objectGeometry?.dispose();
		objectMaterial?.dispose();
		for (const groundObject of groundEndpoints.visualObjects) {
			groundObject.geometry?.dispose();
			groundObject.material?.dispose();
		}
		mode.dispose();
		backend.dispose();
		composer.dispose();
		target.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		canvas.remove();
	}
}
