import * as THREE from '../../../../../node_modules/three/build/three.module.js';
import {CachePassAssembler} from '../../../shader-assembly/cache-pass/CachePassAssembler.js';
import {CacheBuildModules} from '../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CACHE_WAVELENGTH_LAYER_BINDING_NAME} from '../../../shader-assembly/cache-pass/consts.js';
import {ThreeCacheBackend} from '../ThreeCacheBackend.js';

/**
 * Called by this module to drain pending WebGL errors.
 *
 * @param {WebGL2RenderingContext} context - Supplies the active WebGL context.
 * @returns {number[]} - The drained WebGL error codes.
 */
function drainErrors(context) {
	const errors = [];
	for (;;) {
		const error = context.getError();
		if (error === context.NO_ERROR) {
			return errors;
		}
		errors.push(error);
	}
}

/**
 * Called by this module to classify the browser renderer without treating the classification as a performance claim. Conditional result values are selected from the accepted input and current state.
 *
 * @param {WebGL2RenderingContext} context - Supplies the active WebGL context.
 * @returns {ThreeWebglRendererDiagnostic} - The renderer diagnostic.
 */
function describeRenderer(context) {
	const extension = context.getExtension('WEBGL_debug_renderer_info');
	const vendor = extension
		? context.getParameter(extension.UNMASKED_VENDOR_WEBGL)
		: context.getParameter(context.VENDOR);
	const renderer = extension
		? context.getParameter(extension.UNMASKED_RENDERER_WEBGL)
		: context.getParameter(context.RENDERER);
	const identifyingText = `${vendor} ${renderer}`;
	const softwarePattern = /swiftshader|llvmpipe|softpipe|software rasterizer|microsoft basic render|\bwarp\b/iu;

	return {
		vendor,
		renderer,
		assessment: extension ? (softwarePattern.test(identifyingText) ? 'software' : 'hardware') : 'unknown',
	};
}

/**
 * Called by this module to capture renderer state that cache construction must restore.
 *
 * @param {THREE.WebGLRenderer} renderer - Supplies the renderer to inspect.
 * @returns {ThreeWebglRendererStateRestoration} - The state restoration operation.
 */
function captureRendererState(renderer) {
	const target = renderer.getRenderTarget();
	const layer = renderer.getActiveCubeFace();
	const mipLevel = renderer.getActiveMipmapLevel();
	const viewport = renderer.getViewport(new THREE.Vector4());
	const scissor = renderer.getScissor(new THREE.Vector4());
	const scissorTest = renderer.getScissorTest();

	return {
		/** Call this method to restore. */ restore() {
			renderer.setRenderTarget(target, layer, mipLevel);
			renderer.setViewport(viewport);
			renderer.setScissor(scissor);
			renderer.setScissorTest(scissorTest);
		},
	};
}

/**
 * Called by this module to create one scalar R32F array render target.
 *
 * @returns {THREE.WebGLArrayRenderTarget} - The render target.
 */
function createScalarArrayTarget() {
	const target = new THREE.WebGLArrayRenderTarget(2, 2, 2, {
		format: THREE.RedFormat,
		type: THREE.FloatType,
		internalFormat: 'R32F',
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		generateMipmaps: false,
		depthBuffer: false,
		stencilBuffer: false,
	});
	target.texture.unpackAlignment = 1;
	target.texture.generateMipmaps = false;
	return target;
}

/**
 * Called by this module to create a fullscreen scalar-writing pass.
 *
 * @returns {ThreeWebglScalarPassResources<THREE.RawShaderMaterial, THREE.BufferGeometry, THREE.Scene, THREE.Camera>} - The pass resources.
 */
function createScalarPass() {
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
	const material = new THREE.RawShaderMaterial({
		glslVersion: THREE.GLSL3,
		vertexShader: `
precision highp float;
in vec3 position;
void main() {
	gl_Position = vec4(position, 1.0);
}
`.trim(),
		fragmentShader: `
precision highp float;
uniform float scalarValue;
layout(location = 0) out highp float outputValue;
void main() {
	outputValue = scalarValue;
}
`.trim(),
		uniforms: {
			scalarValue: {value: 0},
		},
		blending: THREE.NoBlending,
		depthTest: false,
		depthWrite: false,
		transparent: false,
	});
	const mesh = new THREE.Mesh(geometry, material);
	mesh.frustumCulled = false;
	const scene = new THREE.Scene();
	scene.add(mesh);

	return {
		material,
		geometry,
		scene,
		camera: new THREE.Camera(),
		/** Call this method to dispose. */ dispose() {
			geometry.dispose();
			material.dispose();
		},
	};
}

/**
 * Called by this module to read one scalar array layer after confirming framebuffer completeness.
 *
 * @param {THREE.WebGLRenderer} renderer - Supplies the renderer.
 * @param {THREE.WebGLArrayRenderTarget} target - Supplies the scalar target.
 * @param {number} layer - Identifies the array layer.
 * @returns {Float32Array} - The scalar values.
 */
function readScalarLayer(renderer, target, layer) {
	const context = renderer.getContext();
	renderer.setRenderTarget(target, layer);
	expect(context.checkFramebufferStatus(context.FRAMEBUFFER)).toBe(context.FRAMEBUFFER_COMPLETE);
	context.readBuffer(context.COLOR_ATTACHMENT0);
	const values = new Float32Array(target.width * target.height);
	context.readPixels(0, 0, target.width, target.height, context.RED, context.FLOAT, values);
	return values;
}

/**
 * Called by this module to create a small physical GPU field for renderer-adapter conformance.
 *
 * @param {string} [id] - Supplies the logical field id.
 * @returns {CacheFieldSpec} - The executable field specification.
 */
function createBackendTestFieldSpec(id = 'test-output') {
	return {
		id,
		storage: {
			format: 'R32F',
			width: 2,
			height: 2,
			layers: 2,
		},
	};
}

/**
 * Called by this module to create the scalar shader consumed by the production backend test.
 *
 * @param {CacheFieldSpec} output - Supplies the output field.
 * @returns {CacheShader} - The cache shader.
 */
function createBackendTestShader(output) {
	return {
		id: 'three-backend-scalar-program',
		sourceHash: 'sha256:three-backend-scalar-program',
		source: `
precision highp float;
uniform float scalarValue;
layout(location = 0) out highp float outputValue;
void main() {
	outputValue = scalarValue;
}
`.trim(),
		bindings: [
			{
				spec: {
					id: 'scalar-value',
					name: 'scalarValue',
					kind: 'uniform',
					shaderType: 'float',
					frequency: 'layer',
				},
				value: 0,
			},
		],
		output,
	};
}

/**
 * Called by this module to create a shader that samples one opaque cache input at the executor-owned wavelength layer.
 *
 * @param {CacheFieldSpec} output - Supplies the output field.
 * @returns {CacheShader} - The cache shader.
 */
function createBackendCopyShader(output) {
	const inputName = CacheBuildModules.fieldInputBindingName('source-field');
	return {
		id: 'three-backend-copy-program',
		sourceHash: 'sha256:three-backend-copy-program',
		source: `
precision highp float;
uniform highp sampler2DArray ${inputName};
uniform int ${CACHE_WAVELENGTH_LAYER_BINDING_NAME};
layout(location = 0) out highp float outputValue;
void main() {
	ivec2 coordinate = ivec2(gl_FragCoord.xy);
	outputValue = texelFetch(
		${inputName},
		ivec3(coordinate, ${CACHE_WAVELENGTH_LAYER_BINDING_NAME}),
		0
	).r * 2.0;
}
`.trim(),
		bindings: [],
		output,
	};
}

/**
 * Called by this module to assemble one define-bearing cache shader through the production assembler.
 *
 * @param {CacheFieldSpec} output - Supplies the output field.
 * @returns {CacheShader} - The assembled cache shader.
 */
function createAssembledBackendShader(output) {
	const module = CacheBuildModules.createBuildModule({
		id: 'three-backend-assembled-module',
		owner: 'cache',
		provides: [],
		requires: [],
		blocks: [
			{
				id: 'three-backend-assembled-main',
				phase: 'main',
				order: 0,
				source: 'a32CacheOutput = browserScalar * float(CACHE_BROWSER_SCALE);',
			},
		],
		bindings: [
			{
				spec: {
					id: 'browser-scale',
					name: 'CACHE_BROWSER_SCALE',
					kind: 'define',
					shaderType: 'int',
					frequency: 'pass',
				},
				value: 2,
			},
			{
				spec: {
					id: 'browser-scalar',
					name: 'browserScalar',
					kind: 'uniform',
					shaderType: 'float',
					frequency: 'layer',
				},
				value: 0.375,
			},
		],
	});
	return new CachePassAssembler().assemble(
		{
			id: 'three-backend-assembled-pass',
			kind: 'accumulate',
			order: 1,
			inputs: [],
			output: output.id,
			modules: [module],
		},
		output,
	);
}

describe('Algorithm32 Three WebGL browser lane', /** Called by Jasmine to register the named test suite. */ () => {
	/** @type {HTMLCanvasElement} */
	let canvas;
	/** @type {WebGL2RenderingContext} */
	let context;
	/** @type {THREE.WebGLRenderer} */
	let renderer;

	beforeAll(
		/**
		 * Called by Jasmine to prepare the test context.
		 * @throws {Error} - When the operation cannot complete its caller-observable contract.
		 */ () => {
			canvas = document.createElement('canvas');
			canvas.width = 4;
			canvas.height = 4;
			document.body.appendChild(canvas);
			context = canvas.getContext('webgl2', {
				alpha: false,
				antialias: false,
				depth: false,
				preserveDrawingBuffer: true,
				stencil: false,
			});
			if (!context) {
				throw new Error('Algorithm32 Three testing requires a WebGL2 context.');
			}
			renderer = new THREE.WebGLRenderer({canvas, context});
			renderer.debug.checkShaderErrors = true;
			renderer.setSize(4, 4, false);
		},
	);

	afterAll(
		/** Called by Jasmine to release the test context. */ () => {
			renderer.setRenderTarget(null);
			renderer.dispose();
			renderer.forceContextLoss();
			canvas.remove();
		},
	);

	it('reports the scalar-array capabilities and renderer identity', /** Called by Jasmine to exercise the named behavior. */ () => {
		const capabilities = {
			threeRevision: THREE.REVISION,
			webglVersion: context.getParameter(context.VERSION),
			shadingLanguageVersion: context.getParameter(context.SHADING_LANGUAGE_VERSION),
			renderer: describeRenderer(context),
			maximumArrayLayers: context.getParameter(context.MAX_ARRAY_TEXTURE_LAYERS),
			maximumTextureSize: context.getParameter(context.MAX_TEXTURE_SIZE),
		};
		console.info(`Algorithm32 Three GPU: ${JSON.stringify(capabilities)}`);

		expect(renderer.capabilities.isWebGL2).toBeTrue();
		expect(context.getExtension('EXT_color_buffer_float')).not.toBeNull();
		expect(capabilities.maximumArrayLayers).toBeGreaterThanOrEqual(15);
		expect(context.getShaderPrecisionFormat(context.FRAGMENT_SHADER, context.HIGH_FLOAT).precision).toBeGreaterThan(
			0,
		);
	});

	it('writes and reads explicit R32F array layers while restoring renderer state', /** Called by Jasmine to exercise the named behavior. */ () => {
		const sentinel = new THREE.WebGLRenderTarget(2, 2, {
			depthBuffer: false,
			stencilBuffer: false,
		});
		const target = createScalarArrayTarget();
		const pass = createScalarPass();
		renderer.setRenderTarget(sentinel);
		renderer.setViewport(0, 0, 1, 2);
		renderer.setScissor(0, 0, 2, 1);
		renderer.setScissorTest(true);
		const expectedViewport = renderer.getViewport(new THREE.Vector4());
		const expectedScissor = renderer.getScissor(new THREE.Vector4());
		const state = captureRendererState(renderer);

		try {
			drainErrors(context);
			const expectedByLayer = [0.25, 0.75];
			for (let layer = 0; layer < expectedByLayer.length; layer += 1) {
				pass.material.uniforms.scalarValue.value = expectedByLayer[layer];
				renderer.setRenderTarget(target, layer);
				expect(context.checkFramebufferStatus(context.FRAMEBUFFER)).toBe(context.FRAMEBUFFER_COMPLETE);
				renderer.render(pass.scene, pass.camera);
			}

			for (let layer = 0; layer < expectedByLayer.length; layer += 1) {
				const values = readScalarLayer(renderer, target, layer);
				for (const value of values) {
					expect(value).toBeCloseTo(expectedByLayer[layer], 6);
				}
			}
			expect(drainErrors(context)).toEqual([]);
			expect(renderer.info.programs.length).toBeGreaterThan(0);
			expect(
				renderer.info.programs.every(
					/**
					 * Called by Array.prototype.every to test one collection value against the shared condition.
					 * @param program - The program value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (program) => program.diagnostics?.runnable !== false,
				),
			).toBeTrue();
		} finally {
			state.restore();
			pass.dispose();
			target.dispose();
		}

		expect(renderer.getRenderTarget()).toBe(sentinel);
		expect(renderer.getViewport(new THREE.Vector4()).equals(expectedViewport)).toBeTrue();
		expect(renderer.getScissor(new THREE.Vector4()).equals(expectedScissor)).toBeTrue();
		expect(renderer.getScissorTest()).toBeTrue();
		sentinel.dispose();
		renderer.setRenderTarget(null);
	});

	it('executes the production Three cache backend without leaking renderer resources', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const fieldSpec = createBackendTestFieldSpec();
		const copiedFieldSpec = {...fieldSpec, id: 'test-copy-output'};
		const backend = new ThreeCacheBackend({THREE, renderer});
		const field = backend.allocateField(fieldSpec);
		const copiedField = backend.allocateField(copiedFieldSpec);
		const program = await backend.compile(createBackendTestShader(fieldSpec));
		const copyProgram = await backend.compile(createBackendCopyShader(copiedFieldSpec));
		const sentinel = new THREE.WebGLRenderTarget(2, 2, {
			depthBuffer: false,
			stencilBuffer: false,
		});
		renderer.setRenderTarget(sentinel);
		renderer.setViewport(0, 0, 1, 2);
		renderer.setScissor(0, 0, 2, 1);
		renderer.setScissorTest(true);
		const expectedViewport = renderer.getViewport(new THREE.Vector4());
		const expectedScissor = renderer.getScissor(new THREE.Vector4());

		try {
			for (const [layer, value] of [0.125, 0.625].entries()) {
				backend.submitLayer({
					program,
					inputs: [],
					output: field,
					layer,
					bindings: [
						{
							spec: {
								id: 'scalar-value',
								name: 'scalarValue',
								kind: 'uniform',
								shaderType: 'float',
								frequency: 'layer',
							},
							value,
						},
					],
				});
				backend.submitLayer({
					program: copyProgram,
					inputs: [{id: 'source-field', field}],
					output: copiedField,
					layer,
					bindings: [],
				});
			}

			const probe = await backend.readSelectedScalars({
				field: copiedField,
				coordinates: [
					{directionIndex: 0, positionIndex: 0, wavelengthIndex: 0},
					{directionIndex: 1, positionIndex: 1, wavelengthIndex: 1},
				],
			});
			const runtimeBinding = backend.createRuntimeBinding({
				field: copiedField,
				valueKey: 'cache.cumulativeScatteringDensity',
			});
			const runtimeUniforms = {
				[runtimeBinding.valueKey]: {value: null},
			};
			backend.installRuntimeBindings({
				bindings: {backendId: backend.id, bindings: [runtimeBinding]},
				uniforms: runtimeUniforms,
			});

			expect(probe.samples[0].value).toBeCloseTo(0.25, 6);
			expect(probe.samples[1].value).toBeCloseTo(1.25, 6);
			expect(runtimeBinding.backendId).toBe(backend.id);
			expect(runtimeBinding.valueKey).toBe('cache.cumulativeScatteringDensity');
			expect(/** @type {THREE.Texture} */ (runtimeUniforms[runtimeBinding.valueKey].value).isTexture).toBeTrue();
			expect(Object.keys(field).sort()).toEqual(['backendId', 'dispose', 'id', 'storage']);
			expect(Object.keys(program).sort()).toEqual(['dispose', 'id', 'sourceHash']);
			expect(renderer.getRenderTarget()).toBe(sentinel);
			expect(renderer.getViewport(new THREE.Vector4()).equals(expectedViewport)).toBeTrue();
			expect(renderer.getScissor(new THREE.Vector4()).equals(expectedScissor)).toBeTrue();
			expect(renderer.getScissorTest()).toBeTrue();
		} finally {
			copyProgram.dispose();
			program.dispose();
			copiedField.dispose();
			field.dispose();
			backend.dispose();
			sentinel.dispose();
			renderer.setRenderTarget(null);
		}
	});

	it('compiles and executes an assembler-produced shader through the production backend', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const fieldSpec = createBackendTestFieldSpec('assembled-output');
		const shader = createAssembledBackendShader(fieldSpec);
		const backend = new ThreeCacheBackend({THREE, renderer});
		const field = backend.allocateField(fieldSpec);
		const program = await backend.compile(shader);

		try {
			expect(shader.source).not.toContain('#version');
			expect(shader.source.match(/#define CACHE_BROWSER_SCALE 2/gu)).toHaveSize(1);
			backend.submitLayer({
				program,
				inputs: [],
				output: field,
				layer: 0,
				bindings: shader.bindings,
			});
			const probe = await backend.readSelectedScalars({
				field,
				coordinates: [
					{
						directionIndex: 1,
						positionIndex: 1,
						wavelengthIndex: 0,
					},
				],
			});

			expect(probe.samples[0].value).toBeCloseTo(0.75, 6);
			expect(
				renderer.info.programs.every(
					/**
					 * Called by Array.prototype.every to test one collection value against the shared condition.
					 * @param candidate - The candidate value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (candidate) => candidate.diagnostics?.runnable !== false,
				),
			).toBeTrue();
		} finally {
			program.dispose();
			field.dispose();
			backend.dispose();
		}
	});
});
