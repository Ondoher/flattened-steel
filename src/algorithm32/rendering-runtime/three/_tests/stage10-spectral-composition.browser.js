import * as THREE from '../../../../../node_modules/three/build/three.module.js';

import {BrunetonColorDisplayModel, FerwerdaColorDisplayModel} from '../../../implementation/index.js';
import {ShaderBuilder} from '../../ShaderBuilder.js';
import {SharedModel} from '../../../implementation/algorithm32/model/SharedModel.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/native-15/native-15-profile.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../../spectral-values/index.js';
import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../../shader-assembly/base/ShaderSource.js';

describe('Stage 10 production scene-composition browser gate', /** Called by Jasmine to register the named test suite. */ () => {
	it('composes a captured scene pixel with hit attenuation and background bypass', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const renderer = createRenderer();
		const color = new BrunetonColorDisplayModel();
		const pathValues = NATIVE_15_SPECTRAL_BASIS.channels.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param _channel - The intentionally unused callback value.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (_channel, index) => (index + 1) * 2e-7,
		);
		const transmittanceValues = NATIVE_15_SPECTRAL_BASIS.channels.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param _channel - The intentionally unused callback value.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (_channel, index) => 0.15 + index * 0.05,
		);
		const automaticSetup = createAutomaticShaderSetup(pathValues, transmittanceValues);
		const builder = new ShaderBuilder({
			model: automaticSetup.model,
			transport: automaticSetup.transport,
		});
		const composer = createComposer();
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(60, 4 / 3, 0.1, 10);
		const readTarget = createFloatTarget(4, 3);
		const writeTarget = createFloatTarget(4, 3);
		const bindingValues = {
			'stage10.hasSceneEndpoint': true,
		};
		let result;

		try {
			result = await builder.build({
				setup: {
					THREE,
					composer,
					scene,
					camera,
					viewportSize: {
						width: 4,
						height: 3,
						units: 'pixels',
					},
					cacheBackend: automaticSetup.cacheBackend,
					logger: {
						/**
						 * Call this method to warn.
						 * @param _message - The intentionally unused callback value.
						 * @param error - The error observed by the operation.
						 * @throws {Error} - When the operation cannot complete its caller-observable contract.
						 */ warn(_message, error) {
							throw error;
						},
					},
				},
				config: {
					config: {
						color,
						execution: {
							maximumScatteringOrder: 1,
						},
					},
				},
				bindingValues,
			});

			expect(result.diagnostics.status).toBe('installed');
			expect(composer.passes.length).toBe(2);
			await result.runtime.prepare(renderer);
			const [capturePass, runtimePass] = composer.passes;
			renderLinearSceneColor(renderer, readTarget, [8, 4, 1.5]);
			const capturedSceneLinearSrgb = readPixel(renderer, readTarget, 3, 2);
			expect(capturedSceneLinearSrgb[0]).toBeGreaterThan(1);
			capturePass.render(renderer);

			expect(runtimePass.uniforms.uStage10HasSceneEndpoint.value).toBe(true);
			runtimePass.render(renderer, writeTarget, readTarget);
			expect(runtimePass.uniforms.uStage10HasSceneEndpoint.value).toBe(true);
			const attenuatedGpu = readPixel(renderer, writeTarget, 3, 2);
			const compositionRequest = {
				pathRadiance: createRadiance(pathValues, 'stage10-browser:path'),
				transmittance: createTransmittance(transmittanceValues, 'stage10-browser:transmittance'),
				sceneDisplayRgb: capturedSceneLinearSrgb,
				sceneColorSpace: 'linear-srgb',
			};
			const attenuatedLinear = color.composeSceneLinearSrgb(compositionRequest);
			const attenuatedCpu = color.linearSrgbToDisplayRgb(attenuatedLinear);

			expectTripletClose(attenuatedGpu, attenuatedCpu, 1e-4);

			bindingValues['stage10.hasSceneEndpoint'] = false;
			runtimePass.render(renderer, writeTarget, readTarget);
			expect(runtimePass.uniforms.uStage10HasSceneEndpoint.value).toBe(false);
			const backgroundGpu = readPixel(renderer, writeTarget, 3, 2);
			const backgroundLinear = color.composeSceneLinearSrgb({
				...compositionRequest,
				applySceneTransmittance: false,
			});
			const backgroundCpu = color.linearSrgbToDisplayRgb(backgroundLinear);

			expectTripletClose(backgroundGpu, backgroundCpu, 1e-4);
			expect(backgroundLinear).not.toEqual(attenuatedLinear);
			expect(runtimePass.uniforms.uSceneColorTexture.value).toBe(readTarget.texture);
			expect(runtimePass.getDiagnostics()).toEqual(
				jasmine.objectContaining({
					frameCount: 2,
					renderErrorCount: 0,
				}),
			);
			expect(automaticSetup.createCacheControllerCalls()).toBe(1);
			expect(automaticSetup.createScatteringCacheCalls()).toBe(1);
			expect(automaticSetup.installRuntimeBindingsCalls()).toBe(1);
			expect(drainErrors(renderer.getContext())).toEqual([]);
		} finally {
			result?.runtime?.dispose();
			result?.scatteringCacheController?.dispose();
			expect(composer.passes).toEqual([]);
			expect(automaticSetup.controllerDisposeCalls()).toBe(1);
			expect(automaticSetup.cacheDisposeCalls()).toBe(1);
			builder.dispose();
			renderer.setRenderTarget(null);
			readTarget.dispose();
			writeTarget.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
		}
	});

	it('matches the accepted noon, sunset, and night Ferwerda CPU controls in the production shader', async () => {
		const controls = [
			{
				kind: 'receiver-local-brightness-proxy',
				luminance: 5070.201700912994,
				provenanceId: 'run:000421:solar-noon:E_v_over_pi',
			},
			{
				kind: 'receiver-local-brightness-proxy',
				luminance: 3632.4668027619023,
				provenanceId: 'run:000421:sunset:E_v_over_pi',
			},
			{
				kind: 'qualified-starlight-reference',
				luminance: 0.001,
				provenanceId: 'run:000424:sunset-plus-three-hours:starlight-reference',
			},
		];
		for (const control of controls) await verifyFerwerdaShaderControl(control);
	});
});

/** Compile and compare one immutable Ferwerda control through the production pass. */
async function verifyFerwerdaShaderControl(control) {
	const renderer = createRenderer();
	const color = new FerwerdaColorDisplayModel({
		adaptation: {
			kind: control.kind,
			luminance: {value: control.luminance, units: 'cd m^-2'},
			provenanceId: control.provenanceId,
		},
	});
	const pathValues = NATIVE_15_SPECTRAL_BASIS.channels.map((_channel, index) => (index + 1) * 2e-7);
	const transmittanceValues = NATIVE_15_SPECTRAL_BASIS.channels.map((_channel, index) => 0.15 + index * 0.05);
	const automaticSetup = createAutomaticShaderSetup(pathValues, transmittanceValues);
	const builder = new ShaderBuilder({model: automaticSetup.model, transport: automaticSetup.transport});
	const composer = createComposer();
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(60, 4 / 3, 0.1, 10);
	const readTarget = createFloatTarget(4, 3);
	const writeTarget = createFloatTarget(4, 3);
	const bindingValues = {'stage10.hasSceneEndpoint': true};
	let result;

	try {
		result = await builder.build({
			setup: {
				THREE,
				composer,
				scene,
				camera,
				viewportSize: {width: 4, height: 3, units: 'pixels'},
				cacheBackend: automaticSetup.cacheBackend,
				logger: {
					warn(_message, error) {
						throw error;
					},
				},
			},
			config: {config: {color, execution: {maximumScatteringOrder: 1}}},
			bindingValues,
		});
		await result.runtime.prepare(renderer);
		const [capturePass, runtimePass] = composer.passes;
		renderLinearSceneColor(renderer, readTarget, [0.08, 0.04, 0.015]);
		const sceneLinearSrgb = readPixel(renderer, readTarget, 3, 2);
		capturePass.render(renderer);
		runtimePass.render(renderer, writeTarget, readTarget);
		const gpu = readPixel(renderer, writeTarget, 3, 2);
		const cpu = color.composeSceneDisplayRgb({
			pathRadiance: createRadiance(pathValues, 'ferwerda-browser:path'),
			transmittance: createTransmittance(transmittanceValues, 'ferwerda-browser:transmittance'),
			sceneDisplayRgb: sceneLinearSrgb,
			sceneColorSpace: 'linear-srgb',
		});

		expectTripletClose(gpu, cpu, 1e-4);
		expect(result.assembly.fragmentShaderSource).toContain('encodeFerwerdaDisplayOutput');
		expect(result.assembly.fragmentShaderSource).not.toContain('DISPLAY_TONE_MAP_K * uExposureModifier');
		expect(drainErrors(renderer.getContext())).toEqual([]);
	} finally {
		result?.runtime?.dispose();
		result?.scatteringCacheController?.dispose();
		builder.dispose();
		renderer.setRenderTarget(null);
		readTarget.dispose();
		writeTarget.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
	}
}

/**
 * Called by this module to create a WebGL2 renderer for the observable Stage 10 boundary.
 *
 * @returns {THREE.WebGLRenderer} - Return renderer.
 * @throws {Error} - When the operation cannot complete its caller-observable contract.
 */
function createRenderer() {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		preserveDrawingBuffer: false,
	});

	if (!context) {
		throw new Error('Stage 10 browser gate requires WebGL2.');
	}
	if (!context.getExtension('EXT_color_buffer_float')) {
		throw new Error('Stage 10 browser gate requires EXT_color_buffer_float.');
	}

	const renderer = new THREE.WebGLRenderer({
		canvas,
		context,
	});

	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.setPixelRatio(1);
	renderer.setSize(4, 3, false);
	return renderer;
}

/**
 * Called by this module to create a linear floating-point scene or output target.
 *
 * @param {number} width - Supplies width in pixels.
 * @param {number} height - Supplies height in pixels.
 * @returns {THREE.WebGLRenderTarget} - Return target.
 */
function createFloatTarget(width, height) {
	const target = new THREE.WebGLRenderTarget(width, height, {
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		internalFormat: 'RGBA32F',
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		depthBuffer: false,
		stencilBuffer: false,
	});

	target.texture.colorSpace = THREE.NoColorSpace;
	return target;
}

/**
 * Called by this module to clear one target to a known renderer-linear scene color.
 *
 * @param {THREE.WebGLRenderer} renderer - Supplies renderer.
 * @param {THREE.WebGLRenderTarget} target - Receives the scene color.
 * @param {readonly [number, number, number]} linearRgbColor - Supplies linear sRGB.
 * @returns {void} -
 */
function renderLinearSceneColor(renderer, target, linearRgbColor) {
	renderer.setRenderTarget(target);
	renderer
		.getContext()
		.clearBufferfv(
			renderer.getContext().COLOR,
			0,
			new Float32Array([linearRgbColor[0], linearRgbColor[1], linearRgbColor[2], 1]),
		);
}

/**
 * Called by this module to read one RGB pixel from a floating-point target.
 *
 * @param {THREE.WebGLRenderer} renderer - Supplies renderer.
 * @param {THREE.WebGLRenderTarget} target - Supplies target.
 * @param {number} x - Supplies x.
 * @param {number} y - Supplies y.
 * @returns {readonly [number, number, number]} - Return RGB.
 */
function readPixel(renderer, target, x, y) {
	const pixel = new Float32Array(4);
	renderer.readRenderTargetPixels(target, x, y, 1, 1, pixel);
	return [pixel[0], pixel[1], pixel[2]];
}

/**
 * Called by this module to create the mutable composer surface used by ShaderBuilder.
 *
 * @returns {ShaderRuntimeComposer} - Return composer.
 */
function createComposer() {
	return {
		passes: [],
		/**
		 * Call this method to add pass.
		 * @param pass - The pass value accepted by the operation.
		 */ addPass(pass) {
			this.passes.push(pass);
		},
		/**
		 * Call this method to remove pass.
		 * @param pass - The pass value accepted by the operation.
		 */ removePass(pass) {
			const index = this.passes.indexOf(pass);
			if (index !== -1) {
				this.passes.splice(index, 1);
			}
		},
	};
}

/**
 * Called by this module to supply deterministic post-transport state to the color owner.
 *
 * @param {readonly number[]} pathValues - Supplies path radiance.
 * @param {readonly number[]} transmittanceValues - Supplies transmittance.
 * @returns {ShaderContribution} - Return contribution.
 */
function createTransportContribution(pathValues, transmittanceValues) {
	return ShaderContributions.createShaderContribution({
		id: 'stage10-browser-transport-state',
		owner: 'transport',
		provides: ['transport.evaluatePathRadiance'],
		requires: ['runtime.initialState'],
		uniforms: [
			ShaderContributions.createShaderUniformDeclaration(
				'uStage10HasSceneEndpoint',
				'bool',
				'stage10.hasSceneEndpoint',
			),
		],
		functions: [
			ShaderContributions.createShaderSourceBlock(
				'stage10-browser-transport-values',
				'declareConstants',
				0,
				`const float STAGE10_PATH_RADIANCE[15] = float[15](${ShaderSource.formatFloatArray(pathValues)});
const float STAGE10_TRANSMITTANCE[15] = float[15](${ShaderSource.formatFloatArray(transmittanceValues)});`,
			),
			ShaderContributions.createShaderSourceBlock(
				'stage10-browser-transport-evaluator',
				'evaluateTransport',
				0,
				`void evaluatePathRadiance(inout ShaderState state) {
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		state.pathRadiance.channels[channelIndex] = STAGE10_PATH_RADIANCE[channelIndex];
		state.transmittance.channels[channelIndex] = STAGE10_TRANSMITTANCE[channelIndex];
	}
	state.bounds.hasSceneEndpoint = uStage10HasSceneEndpoint;
	state.bounds.endpointDistanceMeters = 1.0;
	state.bounds.endDistanceMeters = 1.0;
}`,
			),
		],
		mainHooks: [
			ShaderContributions.createShaderSourceBlock(
				'stage10-browser-transport-state-main',
				'evaluateTransport',
				0,
				'evaluatePathRadiance(state);',
			),
		],
		bindingRequirements: [
			ShaderContributions.createShaderBindingRequirement(
				'stage10.scene-endpoint',
				'transport',
				'uniform',
				'frame',
				'stage10.hasSceneEndpoint',
				true,
			),
		],
	});
}

/**
 * Called by this module to supply the minimal atmospheric-meter geometry used by the scene-composition fixture.
 *
 * @returns {ShaderContribution} - Return one complete meter-capable geometry contribution.
 */
function createStage10MeterGeometryContribution() {
	return ShaderContributions.createShaderContribution({
		id: 'stage10-browser-sky-meter-geometry',
		owner: 'geometry',
		uniforms: [
			ShaderContributions.createShaderUniformDeclaration(
				'uCameraWorldPositionMeters',
				'vec3',
				'stage10.cameraWorldPositionMeters',
				[0, 0, 0],
			),
		],
		functions: [
			ShaderContributions.createShaderSourceBlock(
				'stage10-browser-sky-meter-frame',
				'declareConstants',
				0,
				`const vec3 GEOMETRY_OBSERVER_RIGHT_DIRECTION = vec3(1.0, 0.0, 0.0);
const vec3 GEOMETRY_OBSERVER_UP_DIRECTION = vec3(0.0, 1.0, 0.0);
const vec3 GEOMETRY_OBSERVER_FORWARD_DIRECTION = vec3(0.0, 0.0, 1.0);`,
			),
			ShaderContributions.createShaderSourceBlock(
				'stage10-browser-sky-meter-path',
				'resolvePathBounds',
				0,
				`PathBounds resolveAtmospherePath(ViewRay ray, float sceneDepth, bool hasSceneEndpoint) {
	PathBounds bounds;
	bounds.startDistanceMeters = 0.0;
	bounds.endDistanceMeters = 1.0;
	bounds.endpointDistanceMeters = sceneDepth;
	bounds.hasSceneEndpoint = hasSceneEndpoint;
	bounds.hasGroundEndpoint = false;
	bounds.valid = true;
	return bounds;
}`,
			),
		],
	});
}

/**
 * Called by this module to create bounded configured owners for automatic ShaderBuilder setup.
 *
 * @param {readonly number[]} pathValues - Supplies path radiance.
 * @param {readonly number[]} transmittanceValues - Supplies transmittance.
 * @returns {object} - Return owners and lifecycle observations.
 */
function createAutomaticShaderSetup(pathValues, transmittanceValues) {
	let createCacheControllerCallCount = 0;
	let createScatteringCacheCallCount = 0;
	let installRuntimeBindingsCallCount = 0;
	let controllerDisposeCallCount = 0;
	let cacheDisposeCallCount = 0;
	let controllerDisposed = false;
	let cacheDisposed = false;
	const runtimeBindings = {
		bindings: [],
	};
	const cache = {
		/**
		 * Call this method to read runtime bindings.
		 * @returns - The result produced by the operation.
		 */ getRuntimeBindings() {
			return runtimeBindings;
		},
		/**
		 * Call this method to create shader contribution.
		 * @returns - The result produced by the operation.
		 */ createShaderContribution() {
			return [];
		},
		/** Call this method to dispose. */ dispose() {
			if (cacheDisposed) {
				return;
			}
			cacheDisposed = true;
			cacheDisposeCallCount += 1;
		},
	};
	const controller = {
		active: cache,
		/**
		 * Call this method to create scattering cache. The promise rejects when the operation fails; the operation is not cancellable once started. Callers must discard a rejected result and treat cancellation as an incomplete operation.
		 * @returns - A promise for the completed operation result.
		 */ async createScatteringCache() {
			createScatteringCacheCallCount += 1;
			return cache;
		},
		/** Call this method to dispose. */ dispose() {
			if (controllerDisposed) {
				return;
			}
			controllerDisposed = true;
			controllerDisposeCallCount += 1;
			cache.dispose();
		},
	};
	const geometry = {
		/**
		 * Call this method to resolve scene depth max.
		 * @returns - The result produced by the operation.
		 */ resolveSceneDepthMax() {
			return {
				value: 100000,
				units: 'meters',
			};
		},
		/**
		 * Call this method to create shader contribution.
		 * @returns - The result produced by the operation.
		 */ createShaderContribution() {
			return [createStage10MeterGeometryContribution()];
		},
	};
	const atmosphere = {
		/**
		 * Call this method to create shader contribution.
		 * @returns - The result produced by the operation.
		 */ createShaderContribution() {
			return [];
		},
	};
	const lightSource = {
		/**
		 * Call this method to create cache controller.
		 * @returns - The result produced by the operation.
		 */ createCacheController() {
			createCacheControllerCallCount += 1;
			return controller;
		},
		/**
		 * Call this method to create shader contribution.
		 * @returns - The result produced by the operation.
		 */ createShaderContribution() {
			return [];
		},
	};
	const model = new SharedModel({
		version: 10,
		profile: /** @type {Algorithm32ExecutionProfile} */ (
			/** @type {unknown} */ ({
				spectral: {basis: NATIVE_15_SPECTRAL_BASIS},
				models: {lightSource, atmosphere, geometry, groundBoundary: null, celestialSources: null},
			})
		),
	});
	const transport = {
		/**
		 * Call this method to main required shader symbols.
		 * @returns - The result produced by the operation.
		 */ mainRequiredShaderSymbols() {
			return [
				'runtime.initialState',
				'transport.evaluatePathRadiance',
				'color.composeSceneColor',
				'color.encodeOutput',
			];
		},
		/**
		 * Call this method to create shader contribution.
		 * @returns - The result produced by the operation.
		 */ createShaderContribution() {
			return createTransportContribution(pathValues, transmittanceValues);
		},
	};
	const cacheBackend = {
		id: 'stage10-browser-cache-backend',
		capabilities: {
			id: 'stage10-browser-cache-capabilities',
		},
		/** Call this method to install runtime bindings. */ installRuntimeBindings() {
			installRuntimeBindingsCallCount += 1;
		},
	};

	return {
		model,
		transport,
		cacheBackend,
		/**
		 * Called by create automatic shader setup to create cache controller calls.
		 * @returns - The callback result returned to its caller.
		 */ createCacheControllerCalls: () => createCacheControllerCallCount,
		/**
		 * Called by create automatic shader setup to create scattering cache calls.
		 * @returns - The callback result returned to its caller.
		 */ createScatteringCacheCalls: () => createScatteringCacheCallCount,
		/**
		 * Called by create automatic shader setup to install runtime bindings calls.
		 * @returns - The callback result returned to its caller.
		 */ installRuntimeBindingsCalls: () => installRuntimeBindingsCallCount,
		/**
		 * Called by create automatic shader setup to controller dispose calls.
		 * @returns - The callback result returned to its caller.
		 */ controllerDisposeCalls: () => controllerDisposeCallCount,
		/**
		 * Called by create automatic shader setup to cache dispose calls.
		 * @returns - The callback result returned to its caller.
		 */ cacheDisposeCalls: () => cacheDisposeCallCount,
	};
}

/**
 * Called by this module to create typed native radiance.
 *
 * @param {readonly number[]} values - Supplies values.
 * @param {string} provenanceIdentity - Supplies provenance.
 * @returns {SpectralRadiancePacket} - Return packet.
 */
function createRadiance(values, provenanceIdentity) {
	return /** @type {SpectralRadiancePacket} */ (
		new SpectralPacket({
			basis: NATIVE_15_SPECTRAL_BASIS,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			values,
			provenanceIdentity,
		})
	);
}

/**
 * Called by this module to create typed native transmittance.
 *
 * @param {readonly number[]} values - Supplies values.
 * @param {string} provenanceIdentity - Supplies provenance.
 * @returns {SpectralTransmittancePacket} - Return packet.
 */
function createTransmittance(values, provenanceIdentity) {
	return /** @type {SpectralTransmittancePacket} */ (
		new SpectralPacket({
			basis: NATIVE_15_SPECTRAL_BASIS,
			quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
			units: SPECTRAL_UNITS.DIMENSIONLESS,
			values,
			provenanceIdentity,
		})
	);
}

/**
 * Called by this module to expect two RGB triplets to agree.
 *
 * @param {readonly number[]} actual - Supplies actual.
 * @param {readonly number[]} expected - Supplies expected.
 * @param {number} tolerance - Supplies absolute tolerance.
 * @returns {void} -
 */
function expectTripletClose(actual, expected, tolerance) {
	expect(actual.length).toBe(3);
	for (let index = 0; index < 3; index += 1) {
		expect(Math.abs(actual[index] - expected[index]))
			.withContext(`RGB channel ${index}`)
			.toBeLessThanOrEqual(tolerance);
	}
}

/**
 * Called by this module to drain WebGL errors.
 *
 * @param {WebGL2RenderingContext} context - Supplies context.
 * @returns {number[]} - Return errors.
 */
function drainErrors(context) {
	const errors = [];
	for (let error = context.getError(); error !== context.NO_ERROR; error = context.getError()) {
		errors.push(error);
	}
	return errors;
}
