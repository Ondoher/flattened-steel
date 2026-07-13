import * as THREE from
	'../../../../node_modules/three/build/three.module.js';

import { BrunetonColorDisplayModel } from
	'../../color/BrunetonColorDisplayModel.js';
import { ShaderBuilder } from
	'../../implementation/ShaderBuilder.js';
import { SharedModel } from
	'../../models/SharedModel.js';
import { NATIVE_15_SPECTRAL_BASIS } from
	'../../profiles/native-15-profile.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralPacket,
} from '../../quantities/index.js';
import {
	createShaderBindingRequirement,
	createShaderContribution,
	createShaderSourceBlock,
	createShaderUniformDescriptor,
	formatShaderFloatArray,
} from '../../shader/shaderContribution.js';

describe('Stage 10 Star scene-composition browser gate', () => {
	it('composes a captured scene pixel with hit attenuation and background bypass', async () => {
		const renderer = createRenderer();
		const color = new BrunetonColorDisplayModel();
		const pathValues = NATIVE_15_SPECTRAL_BASIS.channels.map(
			(_channel, index) => (index + 1) * 2e-7,
		);
		const transmittanceValues = NATIVE_15_SPECTRAL_BASIS.channels.map(
			(_channel, index) => 0.15 + index * 0.05,
		);
		const automaticSetup = createAutomaticShaderSetup(
			pathValues,
			transmittanceValues,
		);
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
						warn(_message, error) {
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
			renderLinearSceneColor(
				renderer,
				readTarget,
				[0.2, 0.4, 0.8],
			);
			const capturedSceneLinearSrgb = readPixel(
				renderer,
				readTarget,
				3,
				2,
			);
			capturePass.render(renderer);

			expect(runtimePass.uniforms.uStage10HasSceneEndpoint.value)
				.toBe(true);
			runtimePass.render(renderer, writeTarget, readTarget);
			expect(runtimePass.uniforms.uStage10HasSceneEndpoint.value)
				.toBe(true);
			const attenuatedGpu = readPixel(
				renderer,
				writeTarget,
				3,
				2,
			);
			const compositionRequest = {
				pathRadiance: createRadiance(
					pathValues,
					'stage10-browser:path',
				),
				transmittance: createTransmittance(
					transmittanceValues,
					'stage10-browser:transmittance',
				),
				sceneDisplayRgb: capturedSceneLinearSrgb,
				sceneColorSpace: 'linear-srgb',
			};
			const attenuatedCpu =
				color.composeSceneDisplayRgb(
					compositionRequest,
				);

			expectTripletClose(
				attenuatedGpu,
				attenuatedCpu,
				2e-5,
			);

			bindingValues['stage10.hasSceneEndpoint'] = false;
			runtimePass.render(renderer, writeTarget, readTarget);
			expect(runtimePass.uniforms.uStage10HasSceneEndpoint.value)
				.toBe(false);
			const backgroundGpu = readPixel(
				renderer,
				writeTarget,
				3,
				2,
			);
			const backgroundCpu =
				color.composeSceneDisplayRgb({
					...compositionRequest,
					applySceneTransmittance: false,
				});

			expectTripletClose(
				backgroundGpu,
				backgroundCpu,
				2e-5,
			);
			expect(backgroundGpu).not.toEqual(attenuatedGpu);
			expect(runtimePass.uniforms.uSceneColorTexture.value)
				.toBe(readTarget.texture);
			expect(runtimePass.getDiagnostics())
				.toEqual(jasmine.objectContaining({
					frameCount: 2,
					renderErrorCount: 0,
				}));
			expect(automaticSetup.createCacheControllerCalls())
				.toBe(1);
			expect(automaticSetup.createScatteringCacheCalls())
				.toBe(1);
			expect(automaticSetup.installRuntimeBindingsCalls())
				.toBe(1);
			expect(drainErrors(renderer.getContext()))
				.toEqual([]);
		} finally {
			result?.runtime?.dispose();
			result?.cacheController?.dispose();
			expect(composer.passes).toEqual([]);
			expect(automaticSetup.controllerDisposeCalls())
				.toBe(1);
			expect(automaticSetup.cacheDisposeCalls())
				.toBe(1);
			builder.dispose();
			renderer.setRenderTarget(null);
			readTarget.dispose();
			writeTarget.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
		}
	});
});

/**
 * Create a WebGL2 renderer for the observable Stage 10 boundary.
 *
 * @returns {THREE.WebGLRenderer} Return renderer.
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
		throw new Error(
			'Stage 10 browser gate requires EXT_color_buffer_float.',
		);
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
 * Create a linear floating-point scene or output target.
 *
 * @param {number} width - Supplies width in pixels.
 * @param {number} height - Supplies height in pixels.
 * @returns {THREE.WebGLRenderTarget} Return target.
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
 * Clear one target to a known renderer-linear scene color.
 *
 * @param {THREE.WebGLRenderer} renderer - Supplies renderer.
 * @param {THREE.WebGLRenderTarget} target - Receives the scene color.
 * @param {readonly [number, number, number]} rgb - Supplies linear sRGB.
 * @returns {void}
 */
function renderLinearSceneColor(renderer, target, rgb) {
	const previousColor = renderer.getClearColor(new THREE.Color()).clone();
	const previousAlpha = renderer.getClearAlpha();

	renderer.setRenderTarget(target);
	renderer.setClearColor(
		new THREE.Color().setRGB(rgb[0], rgb[1], rgb[2]),
		1,
	);
	renderer.clear(true, true, true);
	renderer.setClearColor(previousColor, previousAlpha);
}

/**
 * Read one RGB pixel from a floating-point target.
 *
 * @param {THREE.WebGLRenderer} renderer - Supplies renderer.
 * @param {THREE.WebGLRenderTarget} target - Supplies target.
 * @param {number} x - Supplies x.
 * @param {number} y - Supplies y.
 * @returns {readonly [number, number, number]} Return RGB.
 */
function readPixel(renderer, target, x, y) {
	const pixel = new Float32Array(4);
	renderer.readRenderTargetPixels(target, x, y, 1, 1, pixel);
	return [pixel[0], pixel[1], pixel[2]];
}

/**
 * Create the mutable composer surface used by ShaderBuilder.
 *
 * @returns {{passes: unknown[], addPass(pass: unknown): void, removePass(pass: unknown): void}} Return composer.
 */
function createComposer() {
	return {
		passes: [],
		addPass(pass) {
			this.passes.push(pass);
		},
		removePass(pass) {
			const index = this.passes.indexOf(pass);
			if (index !== -1) {
				this.passes.splice(index, 1);
			}
		},
	};
}

/**
 * Supply deterministic post-transport state to the color owner.
 *
 * @param {readonly number[]} pathValues - Supplies path radiance.
 * @param {readonly number[]} transmittanceValues - Supplies transmittance.
 * @param {string} descriptorFingerprint - Supplies transport identity.
 * @returns {ShaderContribution} Return contribution.
 */
function createTransportContribution(
	pathValues,
	transmittanceValues,
	descriptorFingerprint,
) {
	return createShaderContribution({
		id: 'stage10-browser-transport-state',
		owner: 'transport',
		descriptorFingerprint,
		compatibilityTags: [],
		provides: ['transport.evaluatePathRadiance'],
		requires: ['runtime.initialState'],
		uniforms: [
			createShaderUniformDescriptor(
				'uStage10HasSceneEndpoint',
				'bool',
				'stage10.hasSceneEndpoint',
			),
		],
		functions: [
			createShaderSourceBlock(
				'stage10-browser-transport-values',
				'declareConstants',
				0,
				`const float STAGE10_PATH_RADIANCE[15] = float[15](${formatShaderFloatArray(pathValues)});
const float STAGE10_TRANSMITTANCE[15] = float[15](${formatShaderFloatArray(transmittanceValues)});`,
			),
		],
		mainHooks: [
			createShaderSourceBlock(
				'stage10-browser-transport-state-main',
				'evaluateTransport',
				0,
				`for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
	state.pathRadiance.c[channelIndex] =
		STAGE10_PATH_RADIANCE[channelIndex];
	state.transmittance.c[channelIndex] =
		STAGE10_TRANSMITTANCE[channelIndex];
}
state.bounds.hasSceneEndpoint = uStage10HasSceneEndpoint;
state.bounds.endpointDistanceMeters = 1.0;
state.bounds.endDistanceMeters = 1.0;`,
			),
		],
		bindingRequirements: [
			createShaderBindingRequirement(
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
 * Create bounded configured owners for automatic ShaderBuilder setup.
 *
 * @param {readonly number[]} pathValues - Supplies path radiance.
 * @param {readonly number[]} transmittanceValues - Supplies transmittance.
 * @returns {object} Return owners and lifecycle observations.
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
		descriptor: {
			kind: 'algorithm32-scattering-cache',
			id: 'stage10-browser-cumulative-cache',
			fingerprint: 'stage10-browser-cumulative-cache',
		},
		getRuntimeBindings() {
			return runtimeBindings;
		},
		createShaderContribution() {
			return [];
		},
		dispose() {
			if (cacheDisposed) {
				return;
			}
			cacheDisposed = true;
			cacheDisposeCallCount += 1;
		},
	};
	const controller = {
		active: cache,
		async createScatteringCache() {
			createScatteringCacheCallCount += 1;
			return cache;
		},
		dispose() {
			if (controllerDisposed) {
				return;
			}
			controllerDisposed = true;
			controllerDisposeCallCount += 1;
			cache.dispose();
		},
	};
	const geometry = {
		describe() {
			return createOwnerDescriptor(
				'algorithm32-geometry-model',
				'stage10-browser-geometry',
			);
		},
		resolveSceneDepthMax() {
			return {
				value: 100000,
				units: 'meters',
			};
		},
		createShaderContribution() {
			return [];
		},
	};
	const atmosphere = {
		describe() {
			return createOwnerDescriptor(
				'algorithm32-atmosphere-model',
				'stage10-browser-atmosphere',
			);
		},
		createShaderContribution() {
			return [];
		},
	};
	const lightSource = {
		describe() {
			return createOwnerDescriptor(
				'algorithm32-light-source-model',
				'stage10-browser-light-source',
			);
		},
		createCacheController() {
			createCacheControllerCallCount += 1;
			return controller;
		},
		createShaderContribution() {
			return [];
		},
	};
	const model = new SharedModel({
		version: 10,
		lightSource,
		atmosphere,
		geometry,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const transport = {
		mainRequiredShaderSymbols() {
			return [
				'runtime.initialState',
				'transport.evaluatePathRadiance',
				'color.composeSceneColor',
				'color.encodeOutput',
			];
		},
		createShaderContribution(request) {
			return createTransportContribution(
				pathValues,
				transmittanceValues,
				request.descriptor.transport.fingerprint,
			);
		},
	};
	const cacheBackend = {
		id: 'stage10-browser-cache-backend',
		capabilities: {
			id: 'stage10-browser-cache-capabilities',
		},
		installRuntimeBindings() {
			installRuntimeBindingsCallCount += 1;
		},
	};

	return {
		model,
		transport,
		cacheBackend,
		createCacheControllerCalls: () =>
			createCacheControllerCallCount,
		createScatteringCacheCalls: () =>
			createScatteringCacheCallCount,
		installRuntimeBindingsCalls: () =>
			installRuntimeBindingsCallCount,
		controllerDisposeCalls: () =>
			controllerDisposeCallCount,
		cacheDisposeCalls: () =>
			cacheDisposeCallCount,
	};
}

/**
 * Describe one bounded model owner.
 *
 * @param {string} kind - Supplies owner kind.
 * @param {string} id - Supplies owner id.
 * @returns {object} Return descriptor.
 */
function createOwnerDescriptor(kind, id) {
	return {
		kind,
		id,
		fingerprint: id,
	};
}

/**
 * Create typed native radiance.
 *
 * @param {readonly number[]} values - Supplies values.
 * @param {string} provenanceIdentity - Supplies provenance.
 * @returns {SpectralRadiancePacket} Return packet.
 */
function createRadiance(values, provenanceIdentity) {
	return /** @type {SpectralRadiancePacket} */ (createSpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		values,
		provenanceIdentity,
	}));
}

/**
 * Create typed native transmittance.
 *
 * @param {readonly number[]} values - Supplies values.
 * @param {string} provenanceIdentity - Supplies provenance.
 * @returns {SpectralTransmittancePacket} Return packet.
 */
function createTransmittance(values, provenanceIdentity) {
	return /** @type {SpectralTransmittancePacket} */ (createSpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
		units: SPECTRAL_UNITS.DIMENSIONLESS,
		values,
		provenanceIdentity,
	}));
}

/**
 * Expect two RGB triplets to agree.
 *
 * @param {readonly number[]} actual - Supplies actual.
 * @param {readonly number[]} expected - Supplies expected.
 * @param {number} tolerance - Supplies absolute tolerance.
 * @returns {void}
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
 * Drain WebGL errors.
 *
 * @param {WebGL2RenderingContext} context - Supplies context.
 * @returns {number[]} Return errors.
 */
function drainErrors(context) {
	const errors = [];
	for (
		let error = context.getError();
		error !== context.NO_ERROR;
		error = context.getError()
	) {
		errors.push(error);
	}
	return errors;
}
