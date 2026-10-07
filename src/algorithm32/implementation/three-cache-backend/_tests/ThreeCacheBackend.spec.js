import {ThreeCacheBackend} from '../ThreeCacheBackend.js';

/** Fake vector4 object. */
class FakeVector4 {
	/**
	 * Creates a fake vector4 instance for the declared contract.
	 *
	 * @param {number} x - The x value accepted by the operation.
	 * @param {number} y - The y value accepted by the operation.
	 * @param {number} z - The z value accepted by the operation.
	 * @param {number} fourthComponent - The fourth component accepted by the operation.
	 */ constructor(x = 0, y = 0, z = 0, fourthComponent = 0) {
		this.set(x, y, z, fourthComponent);
	}

	/**
	 * Call this method to set.
	 *
	 * @param {number} x - The x value accepted by the operation.
	 * @param {number} y - The y value accepted by the operation.
	 * @param {number} z - The z value accepted by the operation.
	 * @param {number} fourthComponent - The fourth component accepted by the operation.
	 * @returns {FakeVector4} - The result produced by the operation.
	 */ set(x, y, z, fourthComponent) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = fourthComponent;
		return this;
	}

	/**
	 * Call this method to clone.
	 *
	 * @returns {FakeVector4} - The result produced by the operation.
	 */ clone() {
		return new FakeVector4(this.x, this.y, this.z, this.w);
	}
}

/** Fake vector3 object. */
class FakeVector3 {
	/**
	 * Creates a fake vector3 instance for the declared contract.
	 *
	 * @param {number} x - The x value accepted by the operation.
	 * @param {number} y - The y value accepted by the operation.
	 * @param {number} z - The z value accepted by the operation.
	 */ constructor(x = 0, y = 0, z = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
}

/** Fake texture object. */
class FakeTexture {
	/**
	 * Creates a fake texture instance for the declared contract.
	 *
	 * @param {ArrayLike<number>|null} values - The values value accepted by the operation.
	 * @param {number} width - The width value accepted by the operation.
	 * @param {number} height - The height value accepted by the operation.
	 * @param {number} depth - The depth value accepted by the operation.
	 */ constructor(values = null, width = 1, height = 1, depth = 1) {
		this.values = values;
		this.width = width;
		this.height = height;
		this.depth = depth;
		this.disposeCount = 0;
	}

	/** Call this method to dispose. */ dispose() {
		this.disposeCount += 1;
	}
}

/** Fake data texture object. */
class FakeDataTexture extends FakeTexture {}
/** Fake data array texture object. */
class FakeDataArrayTexture extends FakeTexture {}

/** Fake array render target object. */
class FakeArrayRenderTarget {
	/**
	 * Creates a fake array render target instance for the declared contract.
	 *
	 * @param {number} width - The width value accepted by the operation.
	 * @param {number} height - The height value accepted by the operation.
	 * @param {number} depth - The depth value accepted by the operation.
	 * @param {object} options - The optional operation choices.
	 */ constructor(width, height, depth, options) {
		this.width = width;
		this.height = height;
		this.depth = depth;
		this.options = options;
		this.texture = new FakeTexture(null, width, height, depth);
		this.layerValues = new Map();
		this.disposeCount = 0;
	}

	/** Call this method to dispose. */ dispose() {
		this.disposeCount += 1;
		this.texture.dispose();
	}
}

/** Fake geometry object. */
class FakeGeometry {
	/** Creates a fake geometry instance for the declared contract. */ constructor() {
		this.attributes = {};
		this.disposeCount = 0;
	}

	/**
	 * Call this method to set attribute.
	 *
	 * @param {string} name - The name value accepted by the operation.
	 * @param {object} value - The value accepted by the operation.
	 */ setAttribute(name, value) {
		this.attributes[name] = value;
	}

	/** Call this method to dispose. */ dispose() {
		this.disposeCount += 1;
	}
}

/** Fake buffer attribute object. */
class FakeBufferAttribute {
	/**
	 * Creates a fake buffer attribute instance for the declared contract.
	 *
	 * @param {ArrayLike<number>} array - The array value accepted by the operation.
	 * @param {number} itemSize - The item size value accepted by the operation.
	 */ constructor(array, itemSize) {
		this.array = array;
		this.itemSize = itemSize;
	}
}

/** Fake material object. */
class FakeMaterial {
	/**
	 * Creates a fake material instance for the declared contract.
	 *
	 * @param {object} configuration - The configuration value accepted by the operation.
	 */ constructor(configuration) {
		Object.assign(this, configuration);
		this.disposeCount = 0;
	}

	/** Call this method to dispose. */ dispose() {
		this.disposeCount += 1;
	}
}

/** Fake mesh object. */
class FakeMesh {
	/**
	 * Creates a fake mesh instance for the declared contract.
	 *
	 * @param {FakeGeometry} geometry - The geometry value accepted by the operation.
	 * @param {FakeMaterial} material - The material value accepted by the operation.
	 */ constructor(geometry, material) {
		this.geometry = geometry;
		this.material = material;
		this.frustumCulled = true;
	}
}

/** Fake scene object. */
class FakeScene {
	/** Creates a fake scene instance for the declared contract. */ constructor() {
		this.children = [];
	}

	/**
	 * Call this method to add.
	 *
	 * @param {FakeMesh} child - The child value accepted by the operation.
	 */ add(child) {
		this.children.push(child);
	}
}

/** Fake camera object. */
class FakeCamera {}

/** Fake context object. */
class FakeContext {
	/** Creates a fake context instance for the declared contract. */ constructor() {
		this.FRAMEBUFFER = 0x8d40;
		this.FRAMEBUFFER_COMPLETE = 0x8cd5;
		this.MAX_TEXTURE_SIZE = 0x0d33;
		this.MAX_ARRAY_TEXTURE_LAYERS = 0x88ff;
		this.FRAGMENT_SHADER = 0x8b30;
		this.HIGH_FLOAT = 0x8df2;
		this.READ_BUFFER = 0x0c02;
		this.COLOR_ATTACHMENT0 = 0x8ce0;
		this.BACK = 0x0405;
		this.RED = 0x1903;
		this.FLOAT = 0x1406;
		this.maximumTextureSize = 8192;
		this.maximumArrayLayers = 64;
		this.readBufferValue = this.BACK;
		this.hasColorBufferFloat = true;
		this.framebufferStatus = this.FRAMEBUFFER_COMPLETE;
		this.throwOnRead = false;
		this.renderer = null;
	}

	/**
	 * Call this method to read extension. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {string} name - The name value accepted by the operation.
	 * @returns {object} - The result produced by the operation.
	 */ getExtension(name) {
		return name === 'EXT_color_buffer_float' && this.hasColorBufferFloat ? {} : null;
	}

	/**
	 * Call this method to read parameter. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {string} name - The name value accepted by the operation.
	 * @returns {object} - The result produced by the operation.
	 */ getParameter(name) {
		if (name === this.MAX_TEXTURE_SIZE) {
			return this.maximumTextureSize;
		}
		if (name === this.MAX_ARRAY_TEXTURE_LAYERS) {
			return this.maximumArrayLayers;
		}
		if (name === this.READ_BUFFER) {
			return this.readBufferValue;
		}
		return null;
	}

	/**
	 * Call this method to read shader precision format.
	 *
	 * @returns {object} - The result produced by the operation.
	 */ getShaderPrecisionFormat() {
		return {precision: 23};
	}

	/**
	 * Call this method to check framebuffer status.
	 *
	 * @returns {object} - The result produced by the operation.
	 */ checkFramebufferStatus() {
		return this.framebufferStatus;
	}

	/**
	 * Call this method to read buffer.
	 *
	 * @param {object} value - The value accepted by the operation.
	 */ readBuffer(value) {
		this.readBufferValue = value;
	}

	/**
	 * Call this method to read pixels.
	 *
	 * @param {number} x - The x value accepted by the operation.
	 * @param {number} y - The y value accepted by the operation.
	 * @param {number} width - The width value accepted by the operation.
	 * @param {number} height - The height value accepted by the operation.
	 * @param {number} format - The format value accepted by the operation.
	 * @param {number} type - The type value accepted by the operation.
	 * @param {Float32Array} output - The output value accepted by the operation.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */ readPixels(x, y, width, height, format, type, output) {
		if (this.throwOnRead) {
			throw new Error('synthetic read failure');
		}
		const renderer = this.renderer;
		output[0] = renderer.target.layerValues.get(renderer.layer) ?? 0;
	}
}

/** Fake renderer object. */
class FakeRenderer {
	/**
	 * Creates a fake renderer instance for the declared contract.
	 *
	 * @param {FakeContext} context - The execution context accepted by the operation.
	 */ constructor(context) {
		this.capabilities = {isWebGL2: true};
		this.context = context;
		context.renderer = this;
		this.target = null;
		this.layer = 0;
		this.mipLevel = 0;
		this.viewport = new FakeVector4(0, 0, 4, 4);
		this.scissor = new FakeVector4(0, 0, 4, 4);
		this.scissorTest = false;
		this.compileCount = 0;
		this.lastCompiledScene = null;
		this.renderCount = 0;
		this.throwOnCompile = false;
		this.throwOnRender = false;
		this.initializedTextures = [];
	}

	/**
	 * Call this method to read context.
	 *
	 * @returns {FakeContext} - The result produced by the operation.
	 */ getContext() {
		return this.context;
	}

	/**
	 * Call this method to read render target.
	 *
	 * @returns {FakeArrayRenderTarget|null} - The result produced by the operation.
	 */ getRenderTarget() {
		return this.target;
	}

	/**
	 * Call this method to read active cube face.
	 *
	 * @returns {number} - The result produced by the operation.
	 */ getActiveCubeFace() {
		return this.layer;
	}

	/**
	 * Call this method to read active mipmap level.
	 *
	 * @returns {number} - The result produced by the operation.
	 */ getActiveMipmapLevel() {
		return this.mipLevel;
	}

	/**
	 * Call this method to set render target.
	 *
	 * @param {FakeArrayRenderTarget|null} target - The target value accepted by the operation.
	 * @param {number} layer - The layer value accepted by the operation.
	 * @param {number} mipLevel - The mip level value accepted by the operation.
	 */ setRenderTarget(target, layer = 0, mipLevel = 0) {
		this.target = target;
		this.layer = layer;
		this.mipLevel = mipLevel;
	}

	/**
	 * Call this method to read viewport.
	 *
	 * @param {FakeVector4} target - The target value accepted by the operation.
	 * @returns {FakeVector4} - The result produced by the operation.
	 */ getViewport(target) {
		return target.set(this.viewport.x, this.viewport.y, this.viewport.z, this.viewport.w);
	}

	/**
	 * Call this method to set viewport.
	 *
	 * @param {number|FakeVector4} x - The x value accepted by the operation.
	 * @param {number} y - The y value accepted by the operation.
	 * @param {number} width - The width value accepted by the operation.
	 * @param {number} height - The height value accepted by the operation.
	 */ setViewport(x, y, width, height) {
		const value = x instanceof FakeVector4 ? x : new FakeVector4(x, y, width, height);
		this.viewport = value.clone();
	}

	/**
	 * Call this method to read scissor.
	 *
	 * @param {FakeVector4} target - The target value accepted by the operation.
	 * @returns {FakeVector4} - The result produced by the operation.
	 */ getScissor(target) {
		return target.set(this.scissor.x, this.scissor.y, this.scissor.z, this.scissor.w);
	}

	/**
	 * Call this method to set scissor.
	 *
	 * @param {number|FakeVector4} x - The x value accepted by the operation.
	 * @param {number} y - The y value accepted by the operation.
	 * @param {number} width - The width value accepted by the operation.
	 * @param {number} height - The height value accepted by the operation.
	 */ setScissor(x, y, width, height) {
		const value = x instanceof FakeVector4 ? x : new FakeVector4(x, y, width, height);
		this.scissor = value.clone();
	}

	/**
	 * Call this method to read scissor test.
	 *
	 * @returns {boolean} - The result produced by the operation.
	 */ getScissorTest() {
		return this.scissorTest;
	}

	/**
	 * Call this method to set scissor test.
	 *
	 * @param {boolean} value - The value accepted by the operation.
	 */ setScissorTest(value) {
		this.scissorTest = value;
	}

	/**
	 * Call this method to compile.
	 *
	 * @param {object} scene - The scene value accepted by the operation.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */ compile(scene) {
		this.compileCount += 1;
		this.lastCompiledScene = scene;
		if (this.throwOnCompile) {
			throw new Error('synthetic compile failure');
		}
	}

	/**
	 * Call this method to render.
	 *
	 * @param {object} scene - The scene value accepted by the operation.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */ render(scene) {
		this.renderCount += 1;
		if (this.throwOnRender) {
			throw new Error('synthetic render failure');
		}
		const scalar = scene.children[0].material.uniforms.scalarValue?.value ?? 0;
		this.target.layerValues.set(this.layer, scalar);
	}

	/** @param {FakeTexture} texture - Texture accepted for eager upload. */
	initTexture(texture) {
		this.initializedTextures.push(texture);
	}
}

/** Fake three constant. */
const FAKE_THREE = {
	REVISION: 'test',
	BufferAttribute: FakeBufferAttribute,
	BufferGeometry: FakeGeometry,
	Camera: FakeCamera,
	DataArrayTexture: FakeDataArrayTexture,
	DataTexture: FakeDataTexture,
	Mesh: FakeMesh,
	RawShaderMaterial: FakeMaterial,
	Scene: FakeScene,
	Vector3: FakeVector3,
	Vector4: FakeVector4,
	WebGLArrayRenderTarget: FakeArrayRenderTarget,
	ClampToEdgeWrapping: 'clamp',
	FloatType: 'float',
	UnsignedShortType: 'unsigned-short',
	GLSL3: 'glsl3',
	NearestFilter: 'nearest',
	NoBlending: 'none',
	RedFormat: 'red',
	RedIntegerFormat: 'red-integer',
};

/**
 * Called by this module to create harness.
 *
 * @returns {object} - The result produced by the operation.
 */
function createHarness() {
	const context = new FakeContext();
	const renderer = new FakeRenderer(context);
	return {context, renderer};
}

/** Test field storage constant. */
const TEST_FIELD_STORAGE = {
	format: 'R32F',
	width: 16,
	height: 4,
	layers: 3,
};

/**
 * Called by this module to test field spec.
 *
 * @param {string} id - The id value accepted by the operation.
 * @returns {object} - The result produced by the operation.
 */
function testFieldSpec(id = 'test-output') {
	return {
		id,
		storage: TEST_FIELD_STORAGE,
	};
}

/**
 * Called by this module to scalar binding.
 *
 * @param {number} value - The value accepted by the operation.
 * @returns {object} - The result produced by the operation.
 */
function scalarBinding(value) {
	return {
		spec: {
			id: 'scalar-value',
			name: 'scalarValue',
			kind: 'uniform',
			shaderType: 'float',
			frequency: 'layer',
		},
		value,
	};
}

/**
 * Called by this module to scalar shader.
 *
 * @param {ShaderUniformBinding} binding - The binding value accepted by the operation.
 * @returns {object} - The result produced by the operation.
 */
function scalarShader(binding = scalarBinding(0)) {
	return {
		id: 'test-scalar-cache-shader',
		sourceHash: 'sha256:test-scalar-cache-shader',
		source: `
precision highp float;
uniform float scalarValue;
layout(location = 0) out highp float outputValue;
void main() {
	outputValue = scalarValue;
}
`.trim(),
		bindings: [binding],
		output: testFieldSpec(),
	};
}

/**
 * Called by this module to capture state.
 *
 * @param {FakeRenderer} renderer - The renderer value accepted by the operation.
 * @param {FakeContext} context - The execution context accepted by the operation.
 * @returns {object} - The result produced by the operation.
 */
function captureState(renderer, context) {
	return {
		target: renderer.target,
		layer: renderer.layer,
		mipLevel: renderer.mipLevel,
		viewport: renderer.viewport.clone(),
		scissor: renderer.scissor.clone(),
		scissorTest: renderer.scissorTest,
		readBuffer: context.readBufferValue,
	};
}

/**
 * Called by this module to expect state.
 *
 * @param {FakeRenderer} renderer - The renderer value accepted by the operation.
 * @param {FakeContext} context - The execution context accepted by the operation.
 * @param {object} expected - The expected value accepted by the operation.
 */
function expectState(renderer, context, expected) {
	expect(renderer.target).toBe(expected.target);
	expect(renderer.layer).toBe(expected.layer);
	expect(renderer.mipLevel).toBe(expected.mipLevel);
	expect(renderer.viewport).toEqual(expected.viewport);
	expect(renderer.scissor).toEqual(expected.scissor);
	expect(renderer.scissorTest).toBe(expected.scissorTest);
	expect(context.readBufferValue).toBe(expected.readBuffer);
}

describe('ThreeCacheBackend', /** Called by Jasmine to register the named test suite. */ () => {
	it('rejects a float scene texture without linear float sampling before upload', /** Called by Jasmine to prove the float-filter capability boundary. */ () => {
		const {renderer} = createHarness();
		const backend = new ThreeCacheBackend({THREE: FAKE_THREE, renderer});
		expect(
			/** Called by Jasmine to exercise unsupported float filtering. */ () =>
				backend.uploadImmutableTexture({
					id: 'unsupported-float',
					valueKey: 'cache.test',
					identity: 'float-filter-proof',
					storage: {format: 'RGBA32F', width: 1, height: 1, layers: 1, xFastest: true, flipY: false},
					values: new Float32Array(4),
				}),
		).toThrowError(/OES_texture_float_linear/u);
		backend.dispose();
	});
	it('validates the selected WebGL2 R32F capability boundary', /** Called by Jasmine to exercise the named behavior. */ () => {
		const {context, renderer} = createHarness();
		const backend = new ThreeCacheBackend({THREE: FAKE_THREE, renderer});

		expect(backend.capabilities.scalarFormat).toBe('R32F');
		expect(backend.capabilities.supportsArrayRenderTargets).toBeTrue();
		expect(backend.capabilities.supportsFloatSampling).toBeTrue();
		expect(backend.capabilities.maximumTextureSize).toBe(8192);
		expect(backend.capabilities.maximumArrayLayers).toBe(64);

		backend.dispose();
		renderer.capabilities.isWebGL2 = false;
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 *
			 * @returns {object} - The callback result returned to its caller.
			 */ () => new ThreeCacheBackend({THREE: FAKE_THREE, renderer}),
		).toThrowError(/requires WebGL2/u);
		renderer.capabilities.isWebGL2 = true;
		context.hasColorBufferFloat = false;
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 *
			 * @returns {object} - The callback result returned to its caller.
			 */ () => new ThreeCacheBackend({THREE: FAKE_THREE, renderer}),
		).toThrowError(/EXT_color_buffer_float/u);
	});

	it('allocates opaque fields, executes layers, probes selected scalars, and disposes once', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const {renderer} = createHarness();
		const backend = new ThreeCacheBackend({THREE: FAKE_THREE, renderer});
		const field = backend.allocateField(testFieldSpec());
		const program = await backend.compile(scalarShader());
		const binding = scalarBinding(0.375);

		backend.submitLayer({
			program,
			inputs: [],
			output: field,
			layer: 2,
			bindings: [binding],
		});
		const result = await backend.readSelectedScalars({
			field,
			coordinates: [
				{
					directionIndex: 12,
					positionIndex: 3,
					wavelengthIndex: 2,
				},
			],
		});
		const runtimeBinding = backend.createRuntimeBinding({
			field,
			valueKey: 'cache.celestial.sunTransport',
		});
		const runtimeUniforms = {
			[runtimeBinding.valueKey]: {value: null},
		};
		backend.installRuntimeBindings({
			bindings: {
				backendId: backend.id,
				bindings: [runtimeBinding],
			},
			uniforms: runtimeUniforms,
		});

		expect(result.samples).toEqual([
			{
				coordinates: {
					directionIndex: 12,
					positionIndex: 3,
					wavelengthIndex: 2,
				},
				value: 0.375,
			},
		]);
		expect(result.fieldId).toBe(field.id);
		expect(Object.keys(field).sort()).toEqual(['backendId', 'dispose', 'id', 'storage']);
		expect(Object.keys(program).sort()).toEqual(['dispose', 'id', 'sourceHash']);
		expect(Object.keys(runtimeBinding).sort()).toEqual(['backendId', 'fieldId', 'id', 'valueKey']);
		expect(runtimeBinding.valueKey).toBe('cache.celestial.sunTransport');
		expect(runtimeUniforms[runtimeBinding.valueKey].value).toEqual(jasmine.any(FakeTexture));
		expect(runtimeBinding).not.toEqual(
			jasmine.objectContaining({
				target: jasmine.anything(),
			}),
		);
		expect(runtimeBinding).not.toEqual(
			jasmine.objectContaining({
				texture: jasmine.anything(),
			}),
		);
		expect(field).not.toEqual(jasmine.objectContaining({target: jasmine.anything()}));
		expect(program).not.toEqual(jasmine.objectContaining({material: jasmine.anything()}));
		expect(renderer.compileCount).toBe(1);
		expect(renderer.renderCount).toBe(1);

		program.dispose();
		program.dispose();
		field.dispose();
		field.dispose();
		backend.dispose();
		backend.dispose();
	});

	it('uploads and installs immutable R32F and R16UI textures as opaque bindings', () => {
		const {renderer} = createHarness();
		const backend = new ThreeCacheBackend({THREE: FAKE_THREE, renderer});
		const values = backend.uploadImmutableTexture({
			id: 'scene-values',
			storage: {format: 'R32F', width: 2, height: 2, layers: 2},
			values: new Float32Array(8),
			valueKey: 'cache.sceneCumulativeScatteringDensity',
		});
		const index = backend.uploadImmutableTexture({
			id: 'scene-index',
			storage: {format: 'R16UI', width: 4, height: 1, layers: 1},
			values: new Uint16Array([0, 1, 1, 2]),
			valueKey: 'cache.sceneLogicalToUniqueDirection',
		});
		const uniforms = {
			'cache.sceneCumulativeScatteringDensity': {value: null},
			'cache.sceneLogicalToUniqueDirection': {value: null},
		};
		backend.installRuntimeBindings({
			bindings: {backendId: backend.id, bindings: [values.runtimeBinding, index.runtimeBinding]},
			uniforms,
		});

		expect(renderer.initializedTextures).toHaveSize(2);
		expect(renderer.initializedTextures[0]).toEqual(jasmine.any(FakeDataArrayTexture));
		expect(renderer.initializedTextures[0].internalFormat).toBe('R32F');
		expect(renderer.initializedTextures[1]).toEqual(jasmine.any(FakeDataTexture));
		expect(renderer.initializedTextures[1].internalFormat).toBe('R16UI');
		expect(uniforms['cache.sceneCumulativeScatteringDensity'].value).toBe(renderer.initializedTextures[0]);
		expect(uniforms['cache.sceneLogicalToUniqueDirection'].value).toBe(renderer.initializedTextures[1]);

		values.dispose();
		values.dispose();
		index.dispose();
		backend.dispose();
		expect(renderer.initializedTextures[0].disposeCount).toBe(1);
		expect(renderer.initializedTextures[1].disposeCount).toBe(1);
	});

	it('lets Three own GLSL versioning without re-emitting assembler-owned defines', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const {renderer} = createHarness();
		const backend = new ThreeCacheBackend({THREE: FAKE_THREE, renderer});
		const shader = scalarShader();
		shader.bindings = [
			...shader.bindings,
			{
				spec: {
					id: 'test-scale',
					name: 'CACHE_TEST_SCALE',
					kind: 'define',
					shaderType: 'float',
					frequency: 'pass',
				},
				value: 2,
			},
		];
		shader.source = `#define CACHE_TEST_SCALE 2\n${shader.source}`;
		const program = await backend.compile(shader);
		const material = renderer.lastCompiledScene.children[0].material;

		expect(material.glslVersion).toBe(FAKE_THREE.GLSL3);
		expect(Object.hasOwn(material, 'defines')).toBeFalse();

		program.dispose();
		backend.dispose();
	});

	it('restores caller renderer state after successful and failed submission and readback', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const {context, renderer} = createHarness();
		const backend = new ThreeCacheBackend({THREE: FAKE_THREE, renderer});
		const field = backend.allocateField(testFieldSpec());
		const program = await backend.compile(scalarShader());
		const sentinel = {id: 'sentinel-target'};
		renderer.setRenderTarget(sentinel, 7, 3);
		renderer.setViewport(1, 2, 3, 4);
		renderer.setScissor(4, 3, 2, 1);
		renderer.setScissorTest(true);
		context.readBuffer(12345);
		const expected = captureState(renderer, context);
		const request = {
			program,
			inputs: [],
			output: field,
			layer: 1,
			bindings: [scalarBinding(0.5)],
		};

		backend.submitLayer(request);
		expectState(renderer, context, expected);
		renderer.throwOnRender = true;
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 *
			 * @returns {object} - The callback result returned to its caller.
			 */ () => backend.submitLayer(request),
		).toThrowError(/synthetic render failure/u);
		expectState(renderer, context, expected);
		renderer.throwOnRender = false;
		context.throwOnRead = true;
		await expectAsync(
			backend.readSelectedScalars({
				field,
				coordinates: [
					{
						directionIndex: 0,
						positionIndex: 0,
						wavelengthIndex: 1,
					},
				],
			}),
		).toBeRejectedWithError(/synthetic read failure/u);
		expectState(renderer, context, expected);

		backend.dispose();
	});

	it('normalizes build uniforms once and reapplies only layer-frequency values', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const {renderer} = createHarness();
		const backend = new ThreeCacheBackend({THREE: FAKE_THREE, renderer});
		const field = backend.allocateField(testFieldSpec());
		const buildBinding = {
			...scalarBinding(0.25),
			spec: {
				...scalarBinding(0.25).spec,
				frequency: 'build',
			},
		};
		const program = await backend.compile(scalarShader(buildBinding));
		const material = renderer.lastCompiledScene.children[0].material;

		backend.submitLayer({
			program,
			inputs: [],
			output: field,
			layer: 0,
			bindings: [{...buildBinding, value: 0.75}],
		});

		expect(material.uniforms.scalarValue.value).toBe(0.25);
		program.dispose();
		field.dispose();
		backend.dispose();
	});

	it('rejects foreign, disposed, and out-of-range resources at the backend boundary', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const firstHarness = createHarness();
		const secondHarness = createHarness();
		const first = new ThreeCacheBackend({
			THREE: FAKE_THREE,
			renderer: firstHarness.renderer,
		});
		const second = new ThreeCacheBackend({
			THREE: FAKE_THREE,
			renderer: secondHarness.renderer,
		});
		const field = first.allocateField(testFieldSpec());
		const program = await first.compile(scalarShader());
		const runtimeBinding = first.createRuntimeBinding({
			field,
			valueKey: 'cache.cumulativeScatteringDensity',
		});

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 *
			 * @returns {object} - The callback result returned to its caller.
			 */ () =>
				second.createRuntimeBinding({
					field,
					valueKey: 'cache.cumulativeScatteringDensity',
				}),
		).toThrowError(/owned by this backend/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 *
			 * @returns {object} - The callback result returned to its caller.
			 */ () =>
				second.installRuntimeBindings({
					bindings: {backendId: first.id, bindings: [runtimeBinding]},
					uniforms: {
						[runtimeBinding.valueKey]: {value: null},
					},
				}),
		).toThrowError(/owned by this backend/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 *
			 * @returns {object} - The callback result returned to its caller.
			 */ () =>
				first.installRuntimeBindings({
					bindings: {
						backendId: first.id,
						bindings: [{...runtimeBinding}],
					},
					uniforms: {
						[runtimeBinding.valueKey]: {value: null},
					},
				}),
		).toThrowError(/opaque binding owned by this backend/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 *
			 * @returns {object} - The callback result returned to its caller.
			 */ () =>
				first.installRuntimeBindings({
					bindings: {backendId: first.id, bindings: [runtimeBinding]},
					uniforms: {},
				}),
		).toThrowError(/uniform .* unavailable/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 *
			 * @returns {object} - The callback result returned to its caller.
			 */ () =>
				first.submitLayer({
					program,
					inputs: [],
					output: field,
					layer: TEST_FIELD_STORAGE.layers,
					bindings: [scalarBinding(0)],
				}),
		).toThrowError(/wavelength layer/u);
		await expectAsync(
			first.readSelectedScalars({
				field,
				coordinates: [
					{
						directionIndex: TEST_FIELD_STORAGE.width,
						positionIndex: 0,
						wavelengthIndex: 0,
					},
				],
			}),
		).toBeRejectedWithError(/directionIndex/u);

		field.dispose();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 *
			 * @returns {object} - The callback result returned to its caller.
			 */ () =>
				first.createRuntimeBinding({
					field,
					valueKey: 'cache.cumulativeScatteringDensity',
				}),
		).toThrowError(/disposed/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 *
			 * @returns {object} - The callback result returned to its caller.
			 */ () =>
				first.installRuntimeBindings({
					bindings: {backendId: first.id, bindings: [runtimeBinding]},
					uniforms: {
						[runtimeBinding.valueKey]: {value: null},
					},
				}),
		).toThrowError(/disposed/u);
		first.dispose();
		second.dispose();
	});
});
