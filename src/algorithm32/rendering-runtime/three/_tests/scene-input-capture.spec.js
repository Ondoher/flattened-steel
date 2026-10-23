import {readFileSync} from 'node:fs';

import {SceneInputCapture} from '../SceneInputCapture.js';

/**
 * Called by this module to read the implementation source.
 *
 * @returns {string} - Return source text.
 */
function readSource() {
	return readFileSync(new URL('../SceneInputCapture.js', import.meta.url), 'utf8');
}

describe('SceneInputCapture', /** Called by Jasmine to register the named test suite. */ () => {
	it('retains the renderer input-capture policy identity', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = readSource();

		expect(source).toContain('renderer-override-material-distance-plus-hit-mask');
	});

	it('creates reusable depth and hit textures for runtime bindings', /** Called by Jasmine to exercise the named behavior. */ () => {
		const THREE = createThreeDouble();
		const capture = new SceneInputCapture({
			THREE,
			scene: createSceneDouble(),
			camera: createCameraDouble(),
			viewportSize: pixelSize(8, 4),
			sceneDepthMax: {value: 0.25, units: 'kilometers'},
			sceneScale: {value: 3, units: 'meters-per-scene-unit'},
		});
		const bindingValues = capture.bindingValues();

		expect(bindingValues['runtime.sceneDepthTexture']).toBe(capture.depthTexture);
		expect(bindingValues['runtime.sceneHitTexture']).toBe(capture.hitTexture);
		expect(bindingValues['runtime.viewportSize']).toEqual(pixelSize(8, 4));
		expect(capture.needsSwap).toBe(false);
		expect(capture._depthTarget.options.minFilter).toBe('NearestFilter');
		expect(capture._depthTarget.options.magFilter).toBe('NearestFilter');
		expect(capture._depthTarget.texture.generateMipmaps).toBe(false);
		expect(capture._hitTarget.options.minFilter).toBe('NearestFilter');
		expect(capture._hitTarget.options.magFilter).toBe('NearestFilter');
		expect(capture._hitTarget.texture.generateMipmaps).toBe(false);
		expect(capture._depthMaterial.parameters.fragmentShader).toContain('packNormalizedDistance24');
		expect(capture._depthMaterial.uniforms.uSceneDepthMaxMeters.value).toBe(250);
		expect(capture._depthMaterial.uniforms.uMetersPerSceneUnit.value).toBe(3);
		expect(capture._depthMaterial.parameters.vertexShader).toContain(
			'projectionMatrix * modelViewMatrix * vec4(position, 1.0)',
		);
		expect(capture._hitMaterial.parameters.fragmentShader).toContain('gl_FragColor = vec4(1.0);');
		expect(capture.getDiagnostics()).toEqual(
			jasmine.objectContaining({
				kind: 'algorithm32-scene-input-capture-pass',
				status: 'ready',
				sceneDepthMax: {value: 0.25, units: 'kilometers'},
				sceneScale: {value: 3, units: 'meters-per-scene-unit'},
				viewportSize: pixelSize(8, 4),
			}),
		);
	});

	it('renders distance and hit-mask passes while restoring scene and renderer state', /** Called by Jasmine to exercise the named behavior. */ () => {
		const scene = createSceneDouble();
		const camera = createCameraDouble();
		const renderer = createRendererDouble();
		const capture = new SceneInputCapture({
			THREE: createThreeDouble(),
			scene,
			camera,
			viewportSize: pixelSize(2, 2),
		});

		capture.render(renderer, {}, {});

		expect(camera.worldPositionRequests).toBe(2);
		expect(renderer.render.calls.count()).toBe(2);
		expect(renderer.renderedOverrideMaterials).toEqual([capture._depthMaterial, capture._hitMaterial]);
		expect(scene.overrideMaterial).toBe('original-material');
		expect(scene.background).toBe('original-background');
		expect(renderer.currentTarget).toBe('previous-target');
		expect(renderer.clear).toHaveBeenCalledTimes(2);
		expect(capture.getDiagnostics()).toEqual(
			jasmine.objectContaining({
				frameCount: 1,
			}),
		);
	});

	it('encodes each frame with the live physical depth range and rejects invalid changes before rendering', () => {
		let depthMax = {value: 250, units: 'meters'};
		const renderer = createRendererDouble();
		const capture = new SceneInputCapture({
			THREE: createThreeDouble(),
			scene: createSceneDouble(),
			camera: createCameraDouble(),
			viewportSize: pixelSize(2, 2),
			resolveSceneDepthMax: () => depthMax,
		});
		capture.capture(renderer);
		expect(capture._depthMaterial.uniforms.uSceneDepthMaxMeters.value).toBe(250);
		depthMax = {value: 0.5, units: 'kilometers'};
		capture.capture(renderer);
		expect(capture._depthMaterial.uniforms.uSceneDepthMaxMeters.value).toBe(500);
		expect(capture.getDiagnostics().sceneDepthMax).toEqual(depthMax);
		depthMax = {value: 0, units: 'meters'};
		expect(() => capture.capture(renderer)).toThrowError(/must be positive/);
		expect(renderer.render).toHaveBeenCalledTimes(4);
	});

	it('hides scene-input-excluded objects only during capture', /** Called by Jasmine to exercise the named behavior. */ () => {
		const excludedObject = {
			visible: true,
			userData: {
				algorithm32SceneInput: false,
			},
		};
		const includedObject = {
			visible: true,
			userData: {
				algorithm32SceneInput: true,
			},
		};
		const scene = createSceneDouble([excludedObject, includedObject]);
		const renderer = createRendererDouble();
		const capture = new SceneInputCapture({
			THREE: createThreeDouble(),
			scene,
			camera: createCameraDouble(),
			viewportSize: pixelSize(2, 2),
		});

		capture.render(renderer, {}, {});

		expect(renderer.visibilitySnapshots).toEqual([
			[false, true],
			[false, true],
		]);
		expect(excludedObject.visible).toBe(true);
		expect(includedObject.visible).toBe(true);
	});

	it('resizes targets, updates the unit-bearing viewport size, and disposes resources', /** Called by Jasmine to exercise the named behavior. */ () => {
		const capture = new SceneInputCapture({
			THREE: createThreeDouble(),
			scene: createSceneDouble(),
			camera: createCameraDouble(),
			viewportSize: pixelSize(2, 2),
		});

		capture.setSize(16, 9);
		capture.dispose();

		expect(capture.viewportSize).toEqual(pixelSize(16, 9));
		expect(capture._depthTarget.width).toBe(16);
		expect(capture._depthTarget.height).toBe(9);
		expect(capture._hitTarget.width).toBe(16);
		expect(capture._hitTarget.height).toBe(9);
		expect(capture._depthMaterial.disposed).toBe(true);
		expect(capture._hitMaterial.disposed).toBe(true);
		expect(capture._depthTarget.disposed).toBe(true);
		expect(capture._hitTarget.disposed).toBe(true);
		expect(capture.getDiagnostics()).toEqual(
			jasmine.objectContaining({
				status: 'disposed',
			}),
		);
	});

	it('fails loudly when required Three constructors are missing', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new SceneInputCapture({
					THREE: {},
					scene: {},
					camera: {},
					viewportSize: pixelSize(1, 1),
				}),
		).toThrowError(/THREE\.WebGLRenderTarget/);
	});

	it('defaults absent camera coordinates but rejects supplied non-finite coordinates', /** Called by Jasmine to exercise the named behavior. */ () => {
		const capture = new SceneInputCapture({
			THREE: createThreeDouble(),
			scene: createSceneDouble(),
			camera: {},
			viewportSize: pixelSize(1, 1),
		});

		expect(capture._depthMaterial.uniforms.uCameraWorldPosition.value).toEqual(
			jasmine.objectContaining({
				x: 0,
				y: 0,
				z: 0,
			}),
		);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new SceneInputCapture({
					THREE: createThreeDouble(),
					scene: createSceneDouble(),
					camera: {
						position: {x: Number.POSITIVE_INFINITY, y: 0, z: 0},
					},
					viewportSize: pixelSize(1, 1),
				}),
		).toThrowError(/camera\.position\.x must be a finite number/);
	});

	it('defaults only absent physical options', /** Called by Jasmine to exercise the named behavior. */ () => {
		const common = {
			THREE: createThreeDouble(),
			scene: createSceneDouble(),
			camera: createCameraDouble(),
			viewportSize: pixelSize(1, 1),
		};

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new SceneInputCapture({
					...common,
					sceneScale: null,
				}),
		).toThrowError(/sceneScale/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new SceneInputCapture({
					...common,
					sceneDepthMax: null,
				}),
		).toThrowError(/sceneDepthMax/);
	});
});

/**
 * Called by this module to pixel size.
 * @param width - The width value accepted by the operation.
 * @param height - The height value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function pixelSize(width, height) {
	return {width, height, units: 'pixels'};
}

/**
 * Called by this module to create a fake Three namespace.
 *
 * @returns {object} - Return fake Three constructors.
 */
function createThreeDouble() {
	return {
		RGBAFormat: 'RGBAFormat',
		UnsignedByteType: 'UnsignedByteType',
		NearestFilter: 'NearestFilter',
		ClampToEdgeWrapping: 'ClampToEdgeWrapping',
		Color: /** Color object. */ class Color {
			/**
			 * Creates a color instance for the declared contract.
			 * @param value - The value accepted by the operation.
			 */ constructor(value = 'black') {
				this.value = value;
			}
		},
		Vector2: /** Vector2 object. */ class Vector2 {
			/**
			 * Creates a vector2 instance for the declared contract.
			 * @param x - The x value accepted by the operation.
			 * @param y - The y value accepted by the operation.
			 */ constructor(x, y) {
				this.x = x;
				this.y = y;
			}

			/**
			 * Call this method to set.
			 * @param x - The x value accepted by the operation.
			 * @param y - The y value accepted by the operation.
			 */ set(x, y) {
				this.x = x;
				this.y = y;
			}
		},
		Vector3: /** Vector3 object. */ class Vector3 {
			/**
			 * Creates a vector3 instance for the declared contract.
			 * @param x - The x value accepted by the operation.
			 * @param y - The y value accepted by the operation.
			 * @param z - The z value accepted by the operation.
			 */ constructor(x = 0, y = 0, z = 0) {
				this.set(x, y, z);
			}

			/**
			 * Call this method to set.
			 * @param x - The x value accepted by the operation.
			 * @param y - The y value accepted by the operation.
			 * @param z - The z value accepted by the operation.
			 */ set(x, y, z) {
				this.x = x;
				this.y = y;
				this.z = z;
			}
		},
		WebGLRenderTarget: /** Web gl render target object. */ class WebGLRenderTarget {
			/**
			 * Creates a web gl render target instance for the declared contract.
			 * @param width - The width value accepted by the operation.
			 * @param height - The height value accepted by the operation.
			 * @param options - The optional operation choices.
			 */ constructor(width, height, options) {
				this.width = width;
				this.height = height;
				this.options = options;
				this.texture = {};
				this.disposed = false;
			}

			/**
			 * Call this method to set size.
			 * @param width - The width value accepted by the operation.
			 * @param height - The height value accepted by the operation.
			 */ setSize(width, height) {
				this.width = width;
				this.height = height;
			}

			/** Call this method to dispose. */ dispose() {
				this.disposed = true;
			}
		},
		ShaderMaterial: /** Shader material object. */ class ShaderMaterial {
			/**
			 * Creates a shader material instance for the declared contract.
			 * @param parameters - The parameters value accepted by the operation.
			 */ constructor(parameters) {
				this.parameters = parameters;
				this.uniforms = parameters.uniforms ?? {};
				this.disposed = false;
			}

			/** Call this method to dispose. */ dispose() {
				this.disposed = true;
			}
		},
	};
}

/**
 * Called by this module to create a fake Three scene.
 *
 * @param objects - The objects value accepted by the operation.
 * @returns {object} - Return scene double.
 */
function createSceneDouble(objects = []) {
	return {
		overrideMaterial: 'original-material',
		background: 'original-background',
		objects,
		/**
		 * Call this method to traverse.
		 * @param callback - The callback value accepted by the operation.
		 */ traverse(callback) {
			for (const object of objects) {
				callback(object);
			}
		},
	};
}

/**
 * Called by this module to create a fake Three camera.
 *
 * @returns {object} - Return camera double.
 */
function createCameraDouble() {
	return {
		worldPositionRequests: 0,
		/**
		 * Call this method to read world position.
		 * @param target - The target value accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ getWorldPosition(target) {
			this.worldPositionRequests += 1;
			target.set(1, 2, 3);
			return target;
		},
	};
}

/**
 * Called by this module to create a fake renderer.
 *
 * @returns {object} - Return renderer double.
 */
function createRendererDouble() {
	const renderer = {
		currentTarget: 'previous-target',
		/**
		 * Call this method to read render target.
		 * @returns - The result produced by the operation.
		 */ getRenderTarget() {
			return this.currentTarget;
		},
		setRenderTarget: jasmine.createSpy('setRenderTarget').and.callFake(
			/**
			 * Called by the Jasmine spy to handle one callback invocation.
			 * @param target - The target value accepted by the operation.
			 */ function setRenderTarget(target) {
				renderer.currentTarget = target;
			},
		),
		getClearColor: jasmine.createSpy('getClearColor').and.callFake(
			/**
			 * Called by the Jasmine spy to handle one callback invocation.
			 * @param color - The color value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (color) => color,
		),
		getClearAlpha: jasmine.createSpy('getClearAlpha').and.returnValue(0.5),
		setClearColor: jasmine.createSpy('setClearColor'),
		clear: jasmine.createSpy('clear'),
		renderedOverrideMaterials: [],
		visibilitySnapshots: [],
		render: jasmine.createSpy('render').and.callFake(
			/**
			 * Called by the Jasmine spy to handle one callback invocation.
			 * @param scene - The scene value accepted by the operation.
			 */ (scene) => {
				renderer.renderedOverrideMaterials.push(scene.overrideMaterial);
				if (Array.isArray(scene.objects)) {
					renderer.visibilitySnapshots.push(
						scene.objects.map(
							/**
							 * Called by Array.prototype.map to transform one collection value.
							 * @param object - The object value accepted by the operation.
							 * @returns - The callback result returned to its caller.
							 */ (object) => object.visible,
						),
					);
				}
			},
		),
	};

	return renderer;
}
