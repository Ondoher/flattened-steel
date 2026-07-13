import {ShaderRuntimePass} from '../ShaderRuntimePass.js';

/**
 * Called by this module to create a fake Three namespace.
 *
 * @returns {object} - Return fake Three constructors.
 */
function createThreeDouble() {
	return {
		GLSL3: 'GLSL3',
		RawShaderMaterial: /** Raw shader material object. */ class RawShaderMaterial {
			/**
			 * Creates a raw shader material instance for the declared contract.
			 * @param parameters - The parameters value accepted by the operation.
			 */ constructor(parameters) {
				this.parameters = parameters;
				this.uniforms = parameters.uniforms;
				this.disposed = false;
			}

			/** Call this method to dispose. */ dispose() {
				this.disposed = true;
			}
		},
		PlaneGeometry: /** Plane geometry object. */ class PlaneGeometry {
			/**
			 * Creates a plane geometry instance for the declared contract.
			 * @param width - The width value accepted by the operation.
			 * @param height - The height value accepted by the operation.
			 */ constructor(width, height) {
				this.width = width;
				this.height = height;
				this.disposed = false;
			}

			/** Call this method to dispose. */ dispose() {
				this.disposed = true;
			}
		},
		Mesh: /** Mesh object. */ class Mesh {
			/**
			 * Creates a mesh instance for the declared contract.
			 * @param geometry - The geometry value accepted by the operation.
			 * @param material - The material value accepted by the operation.
			 */ constructor(geometry, material) {
				this.geometry = geometry;
				this.material = material;
			}
		},
		Scene: /** Scene object. */ class Scene {
			/** Creates a scene instance for the declared contract. */ constructor() {
				this.children = [];
			}

			/**
			 * Call this method to add.
			 * @param child - The child value accepted by the operation.
			 */ add(child) {
				this.children.push(child);
			}
		},
		OrthographicCamera: /** Orthographic camera object. */ class OrthographicCamera {
			/**
			 * Creates a orthographic camera instance for the declared contract.
			 * @param left - The left value accepted by the operation.
			 * @param right - The right value accepted by the operation.
			 * @param topCoordinate - The top coordinate accepted by the operation.
			 * @param bottom - The bottom value accepted by the operation.
			 * @param near - The near value accepted by the operation.
			 * @param farPlaneDistance - The far-plane distance accepted by the operation.
			 */ constructor(left, right, topCoordinate, bottom, near, farPlaneDistance) {
				this.left = left;
				this.right = right;
				this.top = topCoordinate;
				this.bottom = bottom;
				this.near = near;
				this.far = farPlaneDistance;
			}
		},
	};
}

describe('ShaderRuntimePass', /** Called by Jasmine to register the named test suite. */ () => {
	it('creates a fullscreen material from caller-provided Three constructors', /** Called by Jasmine to exercise the named behavior. */ () => {
		const uniforms = {
			uSceneColorTexture: {
				value: null,
			},
		};
		const pass = new ShaderRuntimePass({
			THREE: createThreeDouble(),
			fragmentShaderSource:
				'#version 300 es\nprecision highp float;\nout vec4 outColor;\nvoid main() { outColor = vec4(1.0); }\n',
			sourceHash: 'hash',
			viewportSize: pixelSize(1, 1),
			uniforms,
		});

		expect(pass.needsSwap).toBe(false);
		expect(pass.material.parameters.fragmentShader).not.toContain('#version');
		expect(pass.material.uniforms).toBe(uniforms);
	});

	it('binds the composer scene color before rendering', /** Called by Jasmine to exercise the named behavior. */ () => {
		const sceneTexture = {name: 'captured-scene'};
		const pass = new ShaderRuntimePass({
			THREE: createThreeDouble(),
			fragmentShaderSource:
				'#version 300 es\nprecision highp float;\nout vec4 outColor;\nvoid main() { outColor = vec4(1.0); }\n',
			sourceHash: 'hash',
			viewportSize: pixelSize(1, 1),
			uniforms: {
				uSceneColorTexture: {
					value: null,
				},
			},
		});
		const renderer = {
			setRenderTarget: jasmine.createSpy('setRenderTarget'),
			render: jasmine.createSpy('render'),
		};
		const writeBuffer = {};
		const readBuffer = {
			texture: sceneTexture,
		};

		pass.render(renderer, writeBuffer, readBuffer);

		expect(pass.uniforms.uSceneColorTexture.value).toBe(sceneTexture);
		expect(renderer.setRenderTarget).toHaveBeenCalledOnceWith(writeBuffer);
		expect(renderer.render).toHaveBeenCalled();
		expect(pass.getDiagnostics()).toEqual(
			jasmine.objectContaining({
				status: 'ready',
				sourceHash: 'hash',
				frameCount: 1,
				renderErrorCount: 0,
			}),
		);
	});

	it('prepares the runtime program through asynchronous renderer compilation', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const pass = new ShaderRuntimePass({
			THREE: createThreeDouble(),
			fragmentShaderSource: 'void main() {}',
			sourceHash: 'hash',
			viewportSize: pixelSize(1, 1),
			uniforms: {},
		});
		const renderer = {
			compileAsync: jasmine.createSpy('compileAsync').and.resolveTo(),
		};

		await pass.prepare(renderer);

		expect(renderer.compileAsync).toHaveBeenCalledTimes(1);
	});

	it('refreshes live uniforms before every render', /** Called by Jasmine to exercise the named behavior. */ () => {
		const bindingValues = {scalar: 1};
		const uniforms = {uScalar: {value: bindingValues.scalar}};
		const pass = new ShaderRuntimePass({
			THREE: createThreeDouble(),
			fragmentShaderSource: 'void main() {}',
			sourceHash: 'hash',
			viewportSize: pixelSize(1, 1),
			uniforms,
			/** Call this method to refresh uniform values. */ refreshUniformValues() {
				uniforms.uScalar.value = bindingValues.scalar;
			},
		});
		const renderer = {
			/** Call this method to set render target. */ setRenderTarget() {},
			render: jasmine.createSpy('render'),
		};

		bindingValues.scalar = 2;
		pass.render(renderer, {}, {});
		expect(pass.uniforms.uScalar.value).toBe(2);

		bindingValues.scalar = 3;
		pass.render(renderer, {}, {});
		expect(pass.uniforms.uScalar.value).toBe(3);
	});

	it('binds captured color, depth, and hit inputs for the same frame', /** Called by Jasmine to exercise the named behavior. */ () => {
		const sceneInputCapture = createSceneInputCaptureDouble();
		const pass = new ShaderRuntimePass({
			THREE: createThreeDouble(),
			fragmentShaderSource:
				'#version 300 es\nprecision highp float;\nout vec4 outColor;\nvoid main() { outColor = vec4(1.0); }\n',
			sourceHash: 'hash',
			viewportSize: pixelSize(1, 1),
			uniforms: {
				uSceneColorTexture: {
					value: null,
				},
				uSceneDepthTexture: {
					value: null,
				},
				uSceneHitTexture: {
					value: null,
				},
			},
			sceneInputCapture,
		});
		const renderer = {
			setRenderTarget: jasmine.createSpy('setRenderTarget'),
			render: jasmine.createSpy('render'),
		};

		pass.render(renderer, {}, {texture: 'scene-color'});

		expect(sceneInputCapture.capture).not.toHaveBeenCalled();
		expect(pass.uniforms.uSceneColorTexture.value).toBe('scene-color');
		expect(pass.uniforms.uSceneDepthTexture.value).toBe(sceneInputCapture.depthTexture);
		expect(pass.uniforms.uSceneHitTexture.value).toBe(sceneInputCapture.hitTexture);
		expect(pass.getDiagnostics()).toEqual(
			jasmine.objectContaining({
				sceneInputCapture: jasmine.objectContaining({
					status: 'ready',
				}),
			}),
		);
	});

	it('logs live render failures without throwing', /** Called by Jasmine to exercise the named behavior. */ () => {
		const logger = {
			warn: jasmine.createSpy('warn'),
		};
		const pass = new ShaderRuntimePass({
			THREE: createThreeDouble(),
			fragmentShaderSource:
				'#version 300 es\nprecision highp float;\nout vec4 outColor;\nvoid main() { outColor = vec4(1.0); }\n',
			sourceHash: 'hash',
			viewportSize: pixelSize(1, 1),
			uniforms: {},
			logger,
		});
		const renderer = {
			/**
			 * Call this method to render.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ render() {
				throw new Error('render failed');
			},
		};

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => pass.render(renderer, {}, {}),
		).not.toThrow();
		expect(logger.warn).toHaveBeenCalled();
		expect(pass.getDiagnostics()).toEqual(
			jasmine.objectContaining({
				renderErrorCount: 1,
				lastRenderError: 'render failed',
			}),
		);
	});

	it('updates the sole viewport uniform representation and disposes owned resources', /** Called by Jasmine to exercise the named behavior. */ () => {
		const sceneInputCapture = createSceneInputCaptureDouble();
		const pass = new ShaderRuntimePass({
			THREE: createThreeDouble(),
			fragmentShaderSource:
				'#version 300 es\nprecision highp float;\nout vec4 outColor;\nvoid main() { outColor = vec4(1.0); }\n',
			sourceHash: 'hash',
			viewportSize: pixelSize(1, 1),
			uniforms: {
				uViewportSizePixels: {
					value: [1, 1],
				},
			},
			sceneInputCapture,
		});

		pass.setSize(640, 360);
		pass.dispose();

		expect(pass.uniforms.uViewportSizePixels.value).toEqual([640, 360]);
		expect(sceneInputCapture.setSize).not.toHaveBeenCalled();
		expect(sceneInputCapture.dispose).not.toHaveBeenCalled();
		expect(pass.enabled).toBe(false);
		expect(pass.getDiagnostics()).toEqual(
			jasmine.objectContaining({
				status: 'disposed',
				viewportSize: pixelSize(640, 360),
			}),
		);
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
 * Called by this module to create a fake scene input capture helper.
 *
 * @returns {object} - Return capture double.
 */
function createSceneInputCaptureDouble() {
	return {
		depthTexture: {
			name: 'depth',
		},
		hitTexture: {
			name: 'hit',
		},
		capture: jasmine.createSpy('capture'),
		setSize: jasmine.createSpy('setSize'),
		dispose: jasmine.createSpy('dispose'),
		/**
		 * Call this method to read diagnostics.
		 * @returns - The result produced by the operation.
		 */ getDiagnostics() {
			return {
				status: 'ready',
			};
		},
	};
}
