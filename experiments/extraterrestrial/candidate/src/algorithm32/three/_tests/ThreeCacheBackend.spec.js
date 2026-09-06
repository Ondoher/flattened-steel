import {
	DEFAULT_CUMULATIVE_SCATTERING_FIELD,
} from '../../caches/SelectedCacheContract.js';
import { ThreeCacheBackend } from '../ThreeCacheBackend.js';

class FakeVector4 {
	constructor(x = 0, y = 0, z = 0, w = 0) {
		this.set(x, y, z, w);
	}

	set(x, y, z, w) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
		return this;
	}

	clone() {
		return new FakeVector4(this.x, this.y, this.z, this.w);
	}
}

class FakeVector3 {
	constructor(x = 0, y = 0, z = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
}

class FakeTexture {
	constructor(values = null, width = 1, height = 1, depth = 1) {
		this.values = values;
		this.width = width;
		this.height = height;
		this.depth = depth;
		this.disposeCount = 0;
	}

	dispose() {
		this.disposeCount += 1;
	}
}

class FakeDataTexture extends FakeTexture {}
class FakeDataArrayTexture extends FakeTexture {}

class FakeArrayRenderTarget {
	constructor(width, height, depth, options) {
		this.width = width;
		this.height = height;
		this.depth = depth;
		this.options = options;
		this.texture = new FakeTexture(null, width, height, depth);
		this.layerValues = new Map();
		this.disposeCount = 0;
	}

	dispose() {
		this.disposeCount += 1;
		this.texture.dispose();
	}
}

class FakeGeometry {
	constructor() {
		this.attributes = {};
		this.disposeCount = 0;
	}

	setAttribute(name, value) {
		this.attributes[name] = value;
	}

	dispose() {
		this.disposeCount += 1;
	}
}

class FakeBufferAttribute {
	constructor(array, itemSize) {
		this.array = array;
		this.itemSize = itemSize;
	}
}

class FakeMaterial {
	constructor(configuration) {
		Object.assign(this, configuration);
		this.disposeCount = 0;
	}

	dispose() {
		this.disposeCount += 1;
	}
}

class FakeMesh {
	constructor(geometry, material) {
		this.geometry = geometry;
		this.material = material;
		this.frustumCulled = true;
	}
}

class FakeScene {
	constructor() {
		this.children = [];
	}

	add(child) {
		this.children.push(child);
	}
}

class FakeCamera {}

class FakeContext {
	constructor() {
		this.FRAMEBUFFER = 0x8D40;
		this.FRAMEBUFFER_COMPLETE = 0x8CD5;
		this.MAX_TEXTURE_SIZE = 0x0D33;
		this.MAX_ARRAY_TEXTURE_LAYERS = 0x88FF;
		this.FRAGMENT_SHADER = 0x8B30;
		this.HIGH_FLOAT = 0x8DF2;
		this.READ_BUFFER = 0x0C02;
		this.COLOR_ATTACHMENT0 = 0x8CE0;
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

	getExtension(name) {
		return name === 'EXT_color_buffer_float' && this.hasColorBufferFloat ? {} : null;
	}

	getParameter(name) {
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

	getShaderPrecisionFormat() {
		return { precision: 23 };
	}

	checkFramebufferStatus() {
		return this.framebufferStatus;
	}

	readBuffer(value) {
		this.readBufferValue = value;
	}

	readPixels(x, y, width, height, format, type, output) {
		if (this.throwOnRead) {
			throw new Error('synthetic read failure');
		}
		const renderer = this.renderer;
		output[0] = renderer.target.layerValues.get(renderer.layer) ?? 0;
	}
}

class FakeRenderer {
	constructor(context) {
		this.capabilities = { isWebGL2: true };
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
	}

	getContext() {
		return this.context;
	}

	getRenderTarget() {
		return this.target;
	}

	getActiveCubeFace() {
		return this.layer;
	}

	getActiveMipmapLevel() {
		return this.mipLevel;
	}

	setRenderTarget(target, layer = 0, mipLevel = 0) {
		this.target = target;
		this.layer = layer;
		this.mipLevel = mipLevel;
	}

	getViewport(target) {
		return target.set(this.viewport.x, this.viewport.y, this.viewport.z, this.viewport.w);
	}

	setViewport(x, y, width, height) {
		const value = x instanceof FakeVector4 ? x : new FakeVector4(x, y, width, height);
		this.viewport = value.clone();
	}

	getScissor(target) {
		return target.set(this.scissor.x, this.scissor.y, this.scissor.z, this.scissor.w);
	}

	setScissor(x, y, width, height) {
		const value = x instanceof FakeVector4 ? x : new FakeVector4(x, y, width, height);
		this.scissor = value.clone();
	}

	getScissorTest() {
		return this.scissorTest;
	}

	setScissorTest(value) {
		this.scissorTest = value;
	}

	compile(scene) {
		this.compileCount += 1;
		this.lastCompiledScene = scene;
		if (this.throwOnCompile) {
			throw new Error('synthetic compile failure');
		}
	}

	render(scene) {
		this.renderCount += 1;
		if (this.throwOnRender) {
			throw new Error('synthetic render failure');
		}
		const scalar = scene.children[0].material.uniforms.scalarValue?.value ?? 0;
		this.target.layerValues.set(this.layer, scalar);
	}
}

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
	GLSL3: 'glsl3',
	NearestFilter: 'nearest',
	NoBlending: 'none',
	RedFormat: 'red',
};

function createHarness() {
	const context = new FakeContext();
	const renderer = new FakeRenderer(context);
	return { context, renderer };
}

const TEST_FIELD_STORAGE = {
	format: 'R32F',
	width: DEFAULT_CUMULATIVE_SCATTERING_FIELD.layout.shape.direction,
	height: DEFAULT_CUMULATIVE_SCATTERING_FIELD.layout.shape.position,
	layers: DEFAULT_CUMULATIVE_SCATTERING_FIELD.layout.shape.wavelength,
};

function testFieldSpec(id = 'test-output') {
	return {
		id,
		storage: TEST_FIELD_STORAGE,
		descriptor: DEFAULT_CUMULATIVE_SCATTERING_FIELD,
	};
}

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

function expectState(renderer, context, expected) {
	expect(renderer.target).toBe(expected.target);
	expect(renderer.layer).toBe(expected.layer);
	expect(renderer.mipLevel).toBe(expected.mipLevel);
	expect(renderer.viewport).toEqual(expected.viewport);
	expect(renderer.scissor).toEqual(expected.scissor);
	expect(renderer.scissorTest).toBe(expected.scissorTest);
	expect(context.readBufferValue).toBe(expected.readBuffer);
}

describe('ThreeCacheBackend', () => {
	it('validates the selected WebGL2 R32F capability boundary', () => {
		const { context, renderer } = createHarness();
		const backend = new ThreeCacheBackend({ THREE: FAKE_THREE, renderer });

		expect(backend.capabilities.scalarFormat).toBe('R32F');
		expect(backend.capabilities.supportsArrayRenderTargets).toBeTrue();
		expect(backend.capabilities.supportsFloatSampling).toBeTrue();
		expect(backend.capabilities.maximumTextureSize).toBe(8192);
		expect(backend.capabilities.maximumArrayLayers).toBe(64);

		backend.dispose();
		renderer.capabilities.isWebGL2 = false;
		expect(() => new ThreeCacheBackend({ THREE: FAKE_THREE, renderer }))
			.toThrowError(/requires WebGL2/u);
		renderer.capabilities.isWebGL2 = true;
		context.hasColorBufferFloat = false;
		expect(() => new ThreeCacheBackend({ THREE: FAKE_THREE, renderer }))
			.toThrowError(/EXT_color_buffer_float/u);
	});

	it('allocates opaque fields, executes layers, probes selected scalars, and disposes once', async () => {
		const { renderer } = createHarness();
		const backend = new ThreeCacheBackend({ THREE: FAKE_THREE, renderer });
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
			coordinates: [{
				directionIndex: 12,
				positionIndex: 3,
				wavelengthIndex: 2,
			}],
		});
		const runtimeBinding = backend.createRuntimeBinding(field);
		const runtimeUniforms = {
			[runtimeBinding.valueKey]: { value: null },
		};
		backend.installRuntimeBindings({
			bindings: {
				backendId: backend.id,
				bindings: [runtimeBinding],
			},
			uniforms: runtimeUniforms,
		});

		expect(result.samples).toEqual([{
			coordinates: {
				directionIndex: 12,
				positionIndex: 3,
				wavelengthIndex: 2,
			},
			value: 0.375,
		}]);
		expect(Object.keys(field).sort()).toEqual(['backendId', 'descriptor', 'dispose', 'storage']);
		expect(Object.keys(program).sort()).toEqual(['dispose', 'id', 'sourceHash']);
		expect(Object.keys(runtimeBinding).sort()).toEqual([
			'backendId',
			'descriptor',
			'id',
			'valueKey',
		]);
		expect(runtimeBinding.valueKey).toBe('cache.cumulativeScatteringDensity');
		expect(runtimeUniforms[runtimeBinding.valueKey].value)
			.toEqual(jasmine.any(FakeTexture));
		expect(runtimeBinding).not.toEqual(jasmine.objectContaining({
			target: jasmine.anything(),
		}));
		expect(runtimeBinding).not.toEqual(jasmine.objectContaining({
			texture: jasmine.anything(),
		}));
		expect(field).not.toEqual(jasmine.objectContaining({ target: jasmine.anything() }));
		expect(program).not.toEqual(jasmine.objectContaining({ material: jasmine.anything() }));
		expect(renderer.compileCount).toBe(1);
		expect(renderer.renderCount).toBe(1);

		program.dispose();
		program.dispose();
		field.dispose();
		field.dispose();
		backend.dispose();
		backend.dispose();
	});

	it('lets Three own GLSL versioning without re-emitting assembler-owned defines', async () => {
		const { renderer } = createHarness();
		const backend = new ThreeCacheBackend({ THREE: FAKE_THREE, renderer });
		const shader = scalarShader();
		shader.bindings = [...shader.bindings, {
			spec: {
				id: 'test-scale',
				name: 'CACHE_TEST_SCALE',
				kind: 'define',
				shaderType: 'float',
				frequency: 'pass',
			},
			value: 2,
		}];
		shader.source = `#define CACHE_TEST_SCALE 2\n${shader.source}`;
		const program = await backend.compile(shader);
		const material = renderer.lastCompiledScene.children[0].material;

		expect(material.glslVersion).toBe(FAKE_THREE.GLSL3);
		expect(Object.hasOwn(material, 'defines')).toBeFalse();

		program.dispose();
		backend.dispose();
	});

	it('restores caller renderer state after successful and failed submission and readback', async () => {
		const { context, renderer } = createHarness();
		const backend = new ThreeCacheBackend({ THREE: FAKE_THREE, renderer });
		const field = backend.allocateField(testFieldSpec());
		const program = await backend.compile(scalarShader());
		const sentinel = { id: 'sentinel-target' };
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
		expect(() => backend.submitLayer(request)).toThrowError(/synthetic render failure/u);
		expectState(renderer, context, expected);
		renderer.throwOnRender = false;
		context.throwOnRead = true;
		await expectAsync(backend.readSelectedScalars({
			field,
			coordinates: [{
				directionIndex: 0,
				positionIndex: 0,
				wavelengthIndex: 1,
			}],
		})).toBeRejectedWithError(/synthetic read failure/u);
		expectState(renderer, context, expected);

		backend.dispose();
	});

	it('normalizes build uniforms once and reapplies only layer-frequency values', async () => {
		const { renderer } = createHarness();
		const backend = new ThreeCacheBackend({ THREE: FAKE_THREE, renderer });
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
			bindings: [{ ...buildBinding, value: 0.75 }],
		});

		expect(material.uniforms.scalarValue.value).toBe(0.25);
		program.dispose();
		field.dispose();
		backend.dispose();
	});

	it('rejects foreign, disposed, and out-of-range resources at the backend boundary', async () => {
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
		const runtimeBinding = first.createRuntimeBinding(field);

		expect(() => second.createRuntimeBinding(field)).toThrowError(/owned by this backend/u);
		expect(() => second.installRuntimeBindings({
			bindings: { backendId: first.id, bindings: [runtimeBinding] },
			uniforms: {
				[runtimeBinding.valueKey]: { value: null },
			},
		})).toThrowError(/owned by this backend/u);
		expect(() => first.installRuntimeBindings({
			bindings: {
				backendId: first.id,
				bindings: [{ ...runtimeBinding }],
			},
			uniforms: {
				[runtimeBinding.valueKey]: { value: null },
			},
		})).toThrowError(/opaque binding owned by this backend/u);
		expect(() => first.installRuntimeBindings({
			bindings: { backendId: first.id, bindings: [runtimeBinding] },
			uniforms: {},
		})).toThrowError(/uniform .* unavailable/u);
		expect(() => first.submitLayer({
			program,
			inputs: [],
			output: field,
			layer: TEST_FIELD_STORAGE.layers,
			bindings: [scalarBinding(0)],
		})).toThrowError(/wavelength layer/u);
		await expectAsync(first.readSelectedScalars({
			field,
			coordinates: [{
				directionIndex: TEST_FIELD_STORAGE.width,
				positionIndex: 0,
				wavelengthIndex: 0,
			}],
		})).toBeRejectedWithError(/directionIndex/u);

		field.dispose();
		expect(() => first.createRuntimeBinding(field)).toThrowError(/disposed/u);
		expect(() => first.installRuntimeBindings({
			bindings: { backendId: first.id, bindings: [runtimeBinding] },
			uniforms: {
				[runtimeBinding.valueKey]: { value: null },
			},
		})).toThrowError(/disposed/u);
		first.dispose();
		second.dispose();
	});
});
