import { ShaderRuntimePass } from '../ShaderRuntimePass.js';

/**
 * Create a fake Three namespace.
 *
 * @returns {object} Return fake Three constructors.
 */
function createThreeDouble() {
	return {
		GLSL3: 'GLSL3',
		RawShaderMaterial: class RawShaderMaterial {
			constructor(parameters) {
				this.parameters = parameters;
				this.uniforms = parameters.uniforms;
				this.disposed = false;
			}

			dispose() {
				this.disposed = true;
			}
		},
		PlaneGeometry: class PlaneGeometry {
			constructor(width, height) {
				this.width = width;
				this.height = height;
				this.disposed = false;
			}

			dispose() {
				this.disposed = true;
			}
		},
		Mesh: class Mesh {
			constructor(geometry, material) {
				this.geometry = geometry;
				this.material = material;
			}
		},
		Scene: class Scene {
			constructor() {
				this.children = [];
			}

			add(child) {
				this.children.push(child);
			}
		},
		OrthographicCamera: class OrthographicCamera {
			constructor(left, right, top, bottom, near, far) {
				this.left = left;
				this.right = right;
				this.top = top;
				this.bottom = bottom;
				this.near = near;
				this.far = far;
			}
		},
	};
}

describe('ShaderRuntimePass', () => {
	it('creates a fullscreen material from caller-provided Three constructors', () => {
		const uniforms = {
			uSceneColorTexture: {
				value: null,
			},
		};
		const pass = new ShaderRuntimePass({
			THREE: createThreeDouble(),
			fragmentShaderSource: '#version 300 es\nprecision highp float;\nout vec4 outColor;\nvoid main() { outColor = vec4(1.0); }\n',
			sourceHash: 'hash',
			viewportSize: pixelSize(1, 1),
			uniforms,
		});

		expect(pass.needsSwap).toBe(false);
		expect(pass.material.parameters.fragmentShader).not.toContain('#version');
		expect(pass.material.uniforms).toBe(uniforms);
	});

	it('binds the composer scene color before rendering', () => {
		const sceneTexture = { name: 'captured-scene' };
		const pass = new ShaderRuntimePass({
			THREE: createThreeDouble(),
			fragmentShaderSource: '#version 300 es\nprecision highp float;\nout vec4 outColor;\nvoid main() { outColor = vec4(1.0); }\n',
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
		expect(pass.getDiagnostics()).toEqual(jasmine.objectContaining({
			status: 'ready',
			sourceHash: 'hash',
			frameCount: 1,
			renderErrorCount: 0,
		}));
	});

	it('prepares the runtime program through asynchronous renderer compilation', async () => {
		const pass = new ShaderRuntimePass({
			THREE: createThreeDouble(),
			fragmentShaderSource: 'void main() {}',
			sourceHash: 'hash',
			viewportSize: pixelSize(1, 1),
			uniforms: {},
		});
		const renderer = {
			compileAsync: jasmine.createSpy('compileAsync')
				.and.resolveTo(),
		};

		await pass.prepare(renderer);

		expect(renderer.compileAsync).toHaveBeenCalledTimes(1);
	});

	it('refreshes live uniforms before every render', () => {
		const bindingValues = { scalar: 1 };
		const uniforms = { uScalar: { value: bindingValues.scalar } };
		const pass = new ShaderRuntimePass({
			THREE: createThreeDouble(),
			fragmentShaderSource: 'void main() {}',
			sourceHash: 'hash',
			viewportSize: pixelSize(1, 1),
			uniforms,
			refreshUniformValues() {
				uniforms.uScalar.value = bindingValues.scalar;
			},
		});
		const renderer = {
			setRenderTarget() {},
			render: jasmine.createSpy('render'),
		};

		bindingValues.scalar = 2;
		pass.render(renderer, {}, {});
		expect(pass.uniforms.uScalar.value).toBe(2);

		bindingValues.scalar = 3;
		pass.render(renderer, {}, {});
		expect(pass.uniforms.uScalar.value).toBe(3);
	});

	it('binds captured color, depth, and hit inputs for the same frame', () => {
		const sceneInputCapture = createSceneInputCaptureDouble();
		const pass = new ShaderRuntimePass({
			THREE: createThreeDouble(),
			fragmentShaderSource: '#version 300 es\nprecision highp float;\nout vec4 outColor;\nvoid main() { outColor = vec4(1.0); }\n',
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

		pass.render(renderer, {}, { texture: 'scene-color' });

		expect(sceneInputCapture.capture).not.toHaveBeenCalled();
		expect(pass.uniforms.uSceneColorTexture.value).toBe('scene-color');
		expect(pass.uniforms.uSceneDepthTexture.value).toBe(sceneInputCapture.depthTexture);
		expect(pass.uniforms.uSceneHitTexture.value).toBe(sceneInputCapture.hitTexture);
		expect(pass.getDiagnostics()).toEqual(jasmine.objectContaining({
			sceneInputCapture: jasmine.objectContaining({
				status: 'ready',
			}),
		}));
	});

	it('logs live render failures without throwing', () => {
		const logger = {
			warn: jasmine.createSpy('warn'),
		};
		const pass = new ShaderRuntimePass({
			THREE: createThreeDouble(),
			fragmentShaderSource: '#version 300 es\nprecision highp float;\nout vec4 outColor;\nvoid main() { outColor = vec4(1.0); }\n',
			sourceHash: 'hash',
			viewportSize: pixelSize(1, 1),
			uniforms: {},
			logger,
		});
		const renderer = {
			render() {
				throw new Error('render failed');
			},
		};

		expect(() => pass.render(renderer, {}, {})).not.toThrow();
		expect(logger.warn).toHaveBeenCalled();
		expect(pass.getDiagnostics()).toEqual(jasmine.objectContaining({
			renderErrorCount: 1,
			lastRenderError: 'render failed',
		}));
	});

	it('updates the sole viewport uniform representation and disposes owned resources', () => {
		const sceneInputCapture = createSceneInputCaptureDouble();
		const pass = new ShaderRuntimePass({
			THREE: createThreeDouble(),
			fragmentShaderSource: '#version 300 es\nprecision highp float;\nout vec4 outColor;\nvoid main() { outColor = vec4(1.0); }\n',
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
		expect(pass.getDiagnostics()).toEqual(jasmine.objectContaining({
			status: 'disposed',
			viewportSize: pixelSize(640, 360),
		}));
	});
});

function pixelSize(width, height) {
	return { width, height, units: 'pixels' };
}

/**
 * Create a fake scene input capture helper.
 *
 * @returns {object} Return capture double.
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
		getDiagnostics() {
			return {
				status: 'ready',
			};
		},
	};
}
