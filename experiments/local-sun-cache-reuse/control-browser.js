import * as THREE from 'three';
import {FlatLocalMode} from '../../src/flat32/FlatLocalMode.js';
import {LocationTimeController} from '../../src/flat32/LocationTimeController.js';
import {Algorithm32Bindings} from '../../src/algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {ThreeCacheBackend} from '../../src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';

/** Render the unmodified selected Flat32 cache through its public facade.
 * @returns {Promise<LocalSunControlCapture>} - Control facts and lossless image.
 */
async function capture() {
	const canvas = document.createElement('canvas');
	document.body.append(canvas);
	const context = canvas.getContext('webgl2', {antialias: false, preserveDrawingBuffer: true});
	if (!context?.getExtension('EXT_color_buffer_float')) throw new Error('Float WebGL2 unavailable.');
	const renderer = new THREE.WebGLRenderer({canvas, context});
	renderer.setSize(720, 414, false);
	renderer.setPixelRatio(1);
	renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	const camera = new THREE.PerspectiveCamera(70, 720 / 414, 0.002, 500);
	camera.position.set(0, 0.005, 0);
	camera.lookAt(0, 0.005, -1);
	const controller = new LocationTimeController();
	const observation = controller.start().observation;
	const mode = new FlatLocalMode({
		sceneScale: {value: 1000, units: 'meters-per-scene-unit'},
		maximumScatteringOrder: 4,
		observation,
	});
	const backend = new ThreeCacheBackend({THREE, renderer});
	const allocations = [];
	const immutableAllocations = [];
	const upload = backend.uploadImmutableTexture.bind(backend);
	backend.uploadImmutableTexture = (request) => {
		immutableAllocations.push({id: request.id, bytes: request.values.byteLength, storage: request.storage});
		return upload(request);
	};
	const allocate = backend.allocateField.bind(backend);
	// Observe public allocations without changing handles, storage or disposal.
	backend.allocateField = (specification) => {
		allocations.push({
			id: specification.id,
			storage: specification.storage,
			bytes: specification.storage.width * specification.storage.height * specification.storage.layers * 4,
		});
		console.log(`allocate ${specification.id}`);
		return allocate(specification);
	};
	/** @type {ShaderRuntimeComposer} */
	const composer = {
		passes: [],
		addPass(pass) {
			this.passes.push(pass);
		},
		removePass(pass) {
			const index = this.passes.indexOf(pass);
			if (index >= 0) this.passes.splice(index, 1);
		},
	};
	const bindings = Algorithm32Bindings.create(THREE, {value: 500000, units: 'meters'});
	Algorithm32Bindings.update({
		bindingValues: bindings,
		camera,
		props: {config: mode.algorithm32.config.config, sceneScale: mode.sceneScale},
	});
	let handle;
	try {
		const started = performance.now();
		console.log('selected N4 cache setup');
		handle = await mode.algorithm32.setupShader({
			THREE,
			composer,
			scene: new THREE.Scene(),
			camera,
			viewportSize: {width: 720, height: 414, units: 'pixels'},
			sceneScale: mode.sceneScale,
			sceneDepthMax: {value: 500000, units: 'meters'},
			bindingValues: bindings,
			cacheBackend: backend,
		});
		context.finish();
		const buildMilliseconds = performance.now() - started;
		console.log(`cache complete ${buildMilliseconds} ms`);
		await handle.prepare(renderer);
		const receiverLight = await handle.measureReceiverEnvironmentLight({THREE, renderer, backend});
		const preparedMilliseconds = performance.now() - started;
		const pass = /** @type {LocalSunControlViewPass} */ (composer.passes.at(-1));
		if (!pass) throw new Error('No installed view pass.');
		pass.renderToScreen = true;
		const zero = new THREE.DataTexture(new Float32Array(4), 1, 1, THREE.RGBAFormat, THREE.FloatType);
		zero.needsUpdate = true;
		try {
			pass.render(renderer, null, {texture: zero});
			context.finish();
		} finally {
			zero.dispose();
		}
		const frameMilliseconds = [];
		const black = new THREE.DataTexture(new Float32Array(4), 1, 1, THREE.RGBAFormat, THREE.FloatType);
		black.needsUpdate = true;
		try {
			for (let sample = 0; sample < 5; sample += 1) {
				const tick = performance.now();
				pass.render(renderer, null, {texture: black});
				context.finish();
				frameMilliseconds.push(performance.now() - tick);
			}
		} finally {
			black.dispose();
		}
		const errors = [];
		for (let error = context.getError(); error !== context.NO_ERROR; error = context.getError()) errors.push(error);
		if (errors.length) throw new Error(`GL errors: ${errors.join(',')}`);
		const diagnostics = handle.getDiagnostics();
		const debug = context.getExtension('WEBGL_debug_renderer_info');
		return {
			schema: 'local-sun-control-capture-v1',
			observation,
			profile: mode.describe(),
			geometry: mode.geometry.configuration,
			allocations,
			immutableAllocations,
			buildMilliseconds,
			preparedMilliseconds,
			frameMilliseconds,
			receiverLight,
			capabilities: backend.capabilities,
			hardware: String(context.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : context.RENDERER)),
			rendererMemory: {...renderer.info.memory},
			diagnostics,
			image: canvas.toDataURL('image/png'),
		};
	} finally {
		handle?.dispose();
		mode.dispose();
		backend.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
	}
}

const bridge = /** @type {LocalSunControlBridge} */ (/** @type {unknown} */ (globalThis));
bridge.localSunControl = async () => JSON.stringify(await capture());
