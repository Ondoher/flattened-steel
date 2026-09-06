import { readFileSync } from 'node:fs';

import { SceneInputCapture } from '../SceneInputCapture.js';

/**
 * Read the implementation source.
 *
 * @returns {string} Return source text.
 */
function readSource() {
	return readFileSync(new URL('../SceneInputCapture.js', import.meta.url), 'utf8');
}

describe('SceneInputCapture', () => {
	it('retains the renderer input-capture policy identity', () => {
		const source = readSource();

		expect(source).toContain('renderer-override-material-distance-plus-hit-mask');
	});

	it('creates reusable depth and hit textures for runtime bindings', () => {
		const THREE = createThreeDouble();
		const capture = new SceneInputCapture({
			THREE,
			scene: createSceneDouble(),
			camera: createCameraDouble(),
			viewportSize: pixelSize(8, 4),
			sceneDepthMax: { value: 0.25, units: 'kilometers' },
			sceneScale: { value: 3, units: 'meters-per-scene-unit' },
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
		expect(capture._depthMaterial.parameters.vertexShader).toContain('projectionMatrix * modelViewMatrix * vec4(position, 1.0)');
		expect(capture._hitMaterial.parameters.fragmentShader).toContain('gl_FragColor = vec4(1.0);');
		expect(capture.getDiagnostics()).toEqual(jasmine.objectContaining({
			kind: 'algorithm32-scene-input-capture-pass',
			status: 'ready',
			sceneDepthMax: { value: 0.25, units: 'kilometers' },
			sceneScale: { value: 3, units: 'meters-per-scene-unit' },
			viewportSize: pixelSize(8, 4),
		}));
	});

	it('renders distance and hit-mask passes while restoring scene and renderer state', () => {
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
		expect(renderer.renderedOverrideMaterials).toEqual([
			capture._depthMaterial,
			capture._hitMaterial,
		]);
		expect(scene.overrideMaterial).toBe('original-material');
		expect(scene.background).toBe('original-background');
		expect(renderer.currentTarget).toBe('previous-target');
		expect(renderer.clear).toHaveBeenCalledTimes(2);
		expect(capture.getDiagnostics()).toEqual(jasmine.objectContaining({
			frameCount: 1,
		}));
	});

	it('hides scene-input-excluded objects only during capture', () => {
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

	it('resizes targets, updates the unit-bearing viewport size, and disposes resources', () => {
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
		expect(capture.getDiagnostics()).toEqual(jasmine.objectContaining({
			status: 'disposed',
		}));
	});

	it('fails loudly when required Three constructors are missing', () => {
		expect(() => new SceneInputCapture({
			THREE: {},
			scene: {},
			camera: {},
			viewportSize: pixelSize(1, 1),
		})).toThrowError(/THREE\.WebGLRenderTarget/);
	});

	it('defaults absent camera coordinates but rejects supplied non-finite coordinates', () => {
		const capture = new SceneInputCapture({
			THREE: createThreeDouble(),
			scene: createSceneDouble(),
			camera: {},
			viewportSize: pixelSize(1, 1),
		});

		expect(capture._depthMaterial.uniforms.uCameraWorldPosition.value).toEqual(jasmine.objectContaining({
			x: 0,
			y: 0,
			z: 0,
		}));
		expect(() => new SceneInputCapture({
			THREE: createThreeDouble(),
			scene: createSceneDouble(),
			camera: {
				position: { x: Number.POSITIVE_INFINITY, y: 0, z: 0 },
			},
			viewportSize: pixelSize(1, 1),
		})).toThrowError(/camera\.position\.x must be a finite number/);
	});

	it('defaults only absent physical controls', () => {
		const common = {
			THREE: createThreeDouble(),
			scene: createSceneDouble(),
			camera: createCameraDouble(),
			viewportSize: pixelSize(1, 1),
		};

		expect(() => new SceneInputCapture({
			...common,
			sceneScale: null,
		})).toThrowError(/sceneScale/);
		expect(() => new SceneInputCapture({
			...common,
			sceneDepthMax: null,
		})).toThrowError(/sceneDepthMax/);
	});
});

function pixelSize(width, height) {
	return { width, height, units: 'pixels' };
}

/**
 * Create a fake Three namespace.
 *
 * @returns {object} Return fake Three constructors.
 */
function createThreeDouble() {
	return {
		RGBAFormat: 'RGBAFormat',
		UnsignedByteType: 'UnsignedByteType',
		NearestFilter: 'NearestFilter',
		ClampToEdgeWrapping: 'ClampToEdgeWrapping',
		Color: class Color {
			constructor(value = 'black') {
				this.value = value;
			}
		},
		Vector2: class Vector2 {
			constructor(x, y) {
				this.x = x;
				this.y = y;
			}

			set(x, y) {
				this.x = x;
				this.y = y;
			}
		},
		Vector3: class Vector3 {
			constructor(x = 0, y = 0, z = 0) {
				this.set(x, y, z);
			}

			set(x, y, z) {
				this.x = x;
				this.y = y;
				this.z = z;
			}
		},
		WebGLRenderTarget: class WebGLRenderTarget {
			constructor(width, height, options) {
				this.width = width;
				this.height = height;
				this.options = options;
				this.texture = {};
				this.disposed = false;
			}

			setSize(width, height) {
				this.width = width;
				this.height = height;
			}

			dispose() {
				this.disposed = true;
			}
		},
		ShaderMaterial: class ShaderMaterial {
			constructor(parameters) {
				this.parameters = parameters;
				this.uniforms = parameters.uniforms ?? {};
				this.disposed = false;
			}

			dispose() {
				this.disposed = true;
			}
		},
	};
}

/**
 * Create a fake Three scene.
 *
 * @returns {object} Return scene double.
 */
function createSceneDouble(objects = []) {
	return {
		overrideMaterial: 'original-material',
		background: 'original-background',
		objects,
		traverse(callback) {
			for (const object of objects) {
				callback(object);
			}
		},
	};
}

/**
 * Create a fake Three camera.
 *
 * @returns {object} Return camera double.
 */
function createCameraDouble() {
	return {
		worldPositionRequests: 0,
		getWorldPosition(target) {
			this.worldPositionRequests += 1;
			target.set(1, 2, 3);
			return target;
		},
	};
}

/**
 * Create a fake renderer.
 *
 * @returns {object} Return renderer double.
 */
function createRendererDouble() {
	const renderer = {
		currentTarget: 'previous-target',
		getRenderTarget() {
			return this.currentTarget;
		},
		setRenderTarget: jasmine.createSpy('setRenderTarget').and.callFake(function setRenderTarget(target) {
			renderer.currentTarget = target;
		}),
		getClearColor: jasmine.createSpy('getClearColor').and.callFake((color) => color),
		getClearAlpha: jasmine.createSpy('getClearAlpha').and.returnValue(0.5),
		setClearColor: jasmine.createSpy('setClearColor'),
		clear: jasmine.createSpy('clear'),
		renderedOverrideMaterials: [],
		visibilitySnapshots: [],
		render: jasmine.createSpy('render').and.callFake((scene) => {
			renderer.renderedOverrideMaterials.push(scene.overrideMaterial);
			if (Array.isArray(scene.objects)) {
				renderer.visibilitySnapshots.push(scene.objects.map((object) => object.visible));
			}
		}),
	};

	return renderer;
}
