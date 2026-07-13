import { ShaderBuilder } from '../ShaderBuilder.js';
import { ShaderDescriptorBuilder } from '../../shader/ShaderDescriptorBuilder.js';
import { createSpectralBasis } from '../../quantities/index.js';

const TEST_SPECTRAL_BASIS = createSpectralBasis({
	id: 'shader-builder-test-basis',
	channels: [{
		id: 'w550',
		center: { value: 550, units: 'nanometers' },
		width: { value: 20, units: 'nanometers' },
	}],
});

describe('ShaderBuilder', () => {
	it('builds a setup-time artifact packet from required attachment handles', async () => {
		const model = {
			version: 7,
		};
		const builder = new ShaderBuilder({ model });
		const setup = {
			composer: {},
			scene: {},
			camera: {},
			viewportSize: pixelSize(1, 1),
		};

		const result = await builder.build({ setup });

		expect(result).toEqual({
			modelVersion: 7,
			setup,
			cacheController: null,
			cache: null,
			cacheIdentity: null,
			diagnostics: {
				status: 'deferred',
			},
		});
	});

	it('defaults only absent collaborators and rejects explicit null collaborators', () => {
		const model = { version: 1 };

		for (const dependencyName of ['assembler', 'descriptorBuilder', 'transport']) {
			expect(() => new ShaderBuilder({ model, [dependencyName]: null }))
				.toThrowError(new RegExp(dependencyName));
		}
	});

	it('rejects null or non-collection build options at setup ingress', async () => {
		const builder = new ShaderBuilder({ model: { version: 1 } });
		const setup = {
			composer: {},
			scene: {},
			camera: {},
			viewportSize: pixelSize(1, 1),
		};
		const invalidOptions = [
			['descriptor', null],
			['contributions', null],
			['mainRequiredSymbols', {}],
			['systemProvidedSymbols', null],
			['bindingValues', []],
			['config', null],
		];

		for (const [fieldName, value] of invalidOptions) {
			await expectAsync(builder.build({ setup, [fieldName]: value }))
				.toBeRejectedWithError(new RegExp(fieldName));
		}

		await expectAsync(builder.build({
			setup,
			config: { config: { shader: null } },
		})).toBeRejectedWithError(/config\.shader/);
		await expectAsync(builder.build({
			setup: { ...setup, sceneScale: null },
		})).toBeRejectedWithError(/sceneScale/);
	});

	it('fails loudly when setup-time attachment handles are missing', async () => {
		const builder = new ShaderBuilder({
			model: {
				version: 1,
			},
		});

		await expectAsync(builder.build({
			setup: {
				composer: {},
				scene: {},
				viewportSize: pixelSize(1, 1),
			},
		})).toBeRejectedWithError(/camera/);
	});

	it('requires the canonical unit-bearing viewport size', async () => {
		const builder = new ShaderBuilder({
			model: {
				version: 1,
			},
		});
		const setup = {
			composer: {},
			scene: {},
			camera: {},
		};

		await expectAsync(builder.build({ setup }))
			.toBeRejectedWithError(/viewportSize/);
		await expectAsync(builder.build({
			setup: {
				...setup,
				viewportSize: [8, 4],
			},
		})).toBeRejectedWithError(/units "pixels"/);
	});

	it('assembles shader source when setup includes descriptor contributions', async () => {
		const builder = new ShaderBuilder({
			model: {
				version: 2,
			},
		});
		const setup = {
			composer: {},
			scene: {},
			camera: {},
			viewportSize: pixelSize(1, 1),
		};

		const result = await builder.build({
			setup,
			descriptor: createDescriptor(),
			contributions: [
				createContribution(),
			],
			mainRequiredSymbols: ['createInitialShaderState'],
		});

		expect(result.modelVersion).toBe(2);
		expect(result.diagnostics).toEqual({
			status: 'assembled',
		});
		expect(result.assembly.status).toBe('accepted');
		expect(result.assembly.fragmentShaderSource).toContain('uniform float uRuntimeGain;');
		expect(result.bindingRequirements.map((binding) => binding.id)).toEqual(['uniform.runtime-gain']);
	});

	it('installs and disposes a composer pass when assembly and Three setup are available', async () => {
		const composer = createComposerDouble();
		const bindingValues = {
			runtimeGain: 4,
		};
		const builder = new ShaderBuilder({
			model: {
				version: 3,
			},
		});

		const result = await builder.build({
			setup: {
				composer,
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
				THREE: createThreeDouble(),
			},
			descriptor: createDescriptor(),
			contributions: [createContribution()],
			mainRequiredSymbols: ['createInitialShaderState'],
			bindingValues,
		});

		expect(result.diagnostics).toEqual({
			status: 'installed',
		});
		expect(composer.passes.length).toBe(1);
		const pass = composer.passes[0];
		expect(pass.uniforms.uRuntimeGain.value).toBe(4);
		const renderer = {
			compileAsync: jasmine.createSpy('compileAsync')
				.and.resolveTo(),
		};

		await result.runtime.prepare(renderer);
		expect(renderer.compileAsync).toHaveBeenCalled();
		bindingValues.runtimeGain = 6;
		pass.render({ render() {} }, {}, {});
		expect(pass.uniforms.uRuntimeGain.value).toBe(6);

		result.runtime.dispose();

		expect(composer.passes).toEqual([]);
		expect(pass.enabled).toBe(false);
	});

	it('fails loudly before installing when a required uniform binding is missing', async () => {
		const composer = createComposerDouble();
		const builder = new ShaderBuilder({
			model: {
				version: 4,
			},
		});

		await expectAsync(builder.build({
			setup: {
				composer,
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
				THREE: createThreeDouble(),
			},
			descriptor: createDescriptor(),
			contributions: [
				createContribution(),
			],
			mainRequiredSymbols: ['createInitialShaderState'],
		})).toBeRejectedWithError(/Required shader binding uniform\.runtime-gain \(runtimeGain\) is missing/);
		expect(composer.passes).toEqual([]);
	});

	it('fails loudly before installing when a required texture binding is missing', async () => {
		const composer = createComposerDouble();
		const builder = new ShaderBuilder({
			model: {
				version: 4,
			},
		});

		await expectAsync(builder.build({
			setup: {
				composer,
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
				THREE: createThreeDouble(),
			},
			descriptor: createDescriptor(),
			contributions: [
				createContribution({
					uniforms: [],
					textures: [
						{
							name: 'uMissingTexture',
							type: 'sampler3D',
							valueKey: 'cache.missingTexture',
						},
					],
					bindingRequirements: [
						{
							id: 'cache.missingTexture',
							owner: 'cache',
							kind: 'texture',
							updateFrequency: 'setup',
							valueKey: 'cache.missingTexture',
							required: true,
						},
					],
				}),
			],
			mainRequiredSymbols: ['createInitialShaderState'],
		})).toBeRejectedWithError(/Required shader binding cache\.missingTexture \(cache\.missingTexture\) is missing/);
		expect(composer.passes).toEqual([]);
	});

	it('uses owner-provided uniform defaults when setup omits a binding value', async () => {
		const composer = createComposerDouble();
		const builder = new ShaderBuilder({
			model: {
				version: 4,
			},
		});

		const result = await builder.build({
			setup: {
				composer,
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
				THREE: createThreeDouble(),
			},
			descriptor: createDescriptor(),
			contributions: [
				createContribution({
					uniforms: [
						{
							name: 'uRuntimeGain',
							type: 'float',
							valueKey: 'runtimeGain',
							defaultValue: 7,
						},
					],
				}),
			],
			mainRequiredSymbols: ['createInitialShaderState'],
		});

		expect(composer.passes[0].uniforms.uRuntimeGain.value).toBe(7);

		result.runtime.dispose();
	});

	it('binds geometry-resolved scene-depth cap without creating capture when no capture textures are required', async () => {
		const composer = createComposerDouble();
		const geometry = {
			resolveSceneDepthMax: jasmine.createSpy('resolveSceneDepthMax')
				.and.returnValue({ value: 0.456, units: 'kilometers' }),
		};
		const builder = new ShaderBuilder({
			model: {
				version: 5,
				geometry,
			},
		});

		const result = await builder.build({
			setup: {
				composer,
				scene: {},
				camera: {
					position: {
						x: 1,
						y: 2,
						z: 3,
					},
				},
				viewportSize: pixelSize(1, 1),
				THREE: createThreeDouble(),
				sceneScale: { value: 1000, units: 'meters-per-scene-unit' },
			},
			descriptor: createDescriptor(),
			contributions: [
				createContribution({
					uniforms: [
						{
							name: 'uSceneDepthMaxMeters',
							type: 'float',
							valueKey: 'geometry.sceneDepthMax',
						},
					],
				}),
			],
			mainRequiredSymbols: ['createInitialShaderState'],
			bindingValues: {
				runtimeGain: 4,
			},
		});

		expect(composer.passes.length).toBe(1);
		expect(geometry.resolveSceneDepthMax).toHaveBeenCalledWith(jasmine.objectContaining({
			cameraScenePosition: { coordinates: [1, 2, 3], units: 'scene-units' },
			sceneScale: { value: 1000, units: 'meters-per-scene-unit' },
		}));
		expect(composer.passes[0].uniforms.uSceneDepthMaxMeters.value).toBe(456);

		result.runtime.dispose();
	});

	it('builds the descriptor from the shared model when contributions do not provide one', async () => {
		const model = {
			version: 9,
			snapshot() {
				return createSharedModelSnapshot();
			},
		};
		const color = createColorDouble();
		const expectedDescriptor = new ShaderDescriptorBuilder().build({
			model,
			config: {
				config: {
					color,
					shader: {
						mode: 'descriptor-test',
					},
				},
			},
		});
		const builder = new ShaderBuilder({ model });

		const result = await builder.build({
			setup: {
				composer: {},
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
			},
			config: {
				config: {
					color,
					shader: {
						mode: 'descriptor-test',
					},
				},
			},
			contributions: [
				createContribution({
					descriptorFingerprint: expectedDescriptor.runtime.fingerprint,
					provides: ['runtime.initialState', 'createInitialShaderState'],
				}),
			],
			mainRequiredSymbols: ['createInitialShaderState'],
		});

		expect(result.assembly.descriptor.fingerprint).toBe(expectedDescriptor.fingerprint);
		expect(result.assembly.descriptor.runtime.facts.mode).toBe('descriptor-test');
	});

	it('collects optional owner-provided shader contributions from configured models', async () => {
		let receivedProviderRequest;
		const model = {
			version: 10,
			spectral: { basis: TEST_SPECTRAL_BASIS },
			geometry: {
				createShaderContribution(request) {
					receivedProviderRequest = request;

					return createContribution({
						id: 'geometry-state',
						owner: 'geometry',
						descriptorFingerprint: request.descriptor.geometry.fingerprint,
						provides: [],
						uniforms: [],
						bindingRequirements: [],
					});
				},
			},
			snapshot() {
				return {
					...createSharedModelSnapshot(),
					version: 10,
				};
			},
		};
		const builder = new ShaderBuilder({ model });

		const result = await builder.build({
			setup: {
				composer: {},
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
			},
			config: {
				config: {
					color: createColorDouble(),
				},
			},
			mainRequiredSymbols: ['createInitialShaderState'],
		});

		expect(receivedProviderRequest.model).toBe(model);
		expect(receivedProviderRequest.descriptor.geometry.facts.id).toBe('geometry-test');
		expect(result.assembly.contributions.map((contribution) => contribution.id)).toContain('geometry-state');
		expect(result.assembly.validationReport.status).toBe('accepted');
	});

	it('adds the shared runtime contribution when owner contributions require runtime initial state', async () => {
		const model = {
			version: 11,
			spectral: { basis: TEST_SPECTRAL_BASIS },
			geometry: {
				createShaderContribution(request) {
					return {
						id: 'geometry-ray',
						owner: 'geometry',
						descriptorFingerprint: request.descriptor.geometry.fingerprint,
						compatibilityTags: [],
						provides: ['geometry.reconstructViewRay'],
						requires: ['runtime.initialState'],
						defines: [],
						uniforms: [],
						textures: [],
						functions: [],
						mainHooks: [],
						bindingRequirements: [],
					};
				},
			},
			snapshot() {
				return {
					...createSharedModelSnapshot(),
					version: 11,
				};
			},
		};
		const builder = new ShaderBuilder({ model });

		const result = await builder.build({
			setup: {
				composer: {},
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
			},
			config: {
				config: {
					color: createColorDouble(),
				},
			},
			mainRequiredSymbols: ['runtime.initialState', 'geometry.reconstructViewRay'],
		});

		expect(result.assembly.contributions.map((contribution) => contribution.id)).toContain('runtime-three-single-camera');
		expect(result.assembly.validationReport.providedSymbols).toContain('runtime.initialState');
		expect(result.assembly.fragmentShaderSource).toContain('ShaderState createInitialShaderState(vec2 uv)');
		expect(result.assembly.fragmentShaderSource).toContain('texelFetch(uSceneDepthTexture, sceneInputPixel, 0)');
		expect(result.assembly.fragmentShaderSource).toContain('texelFetch(uSceneHitTexture, sceneInputPixel, 0)');
		expect(result.assembly.fragmentShaderSource).toContain(
			'state.sceneDisplayRgb = texelFetch(uSceneColorTexture, sceneInputPixel, 0).rgb;',
		);
		expect(result.assembly.fragmentShaderSource).not.toContain(
			'endpointRadiance',
		);
		expect(result.assembly.fragmentShaderSource).toContain('const int SPECTRAL_CHANNEL_COUNT = 1;');
	});

	it('fails loudly when encoded color is required without configured Color', async () => {
		const model = {
			version: 12,
			snapshot() {
				return {
					...createSharedModelSnapshot(),
					version: 12,
				};
			},
		};
		const builder = new ShaderBuilder({ model });

		await expectAsync(builder.build({
			setup: {
				composer: {},
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
			},
			mainRequiredSymbols: ['runtime.initialState', 'color.encodeOutput'],
		})).toBeRejectedWithError(/Color abstraction/);
	});

	it('collects Color shader contributions from the accepted facade config', async () => {
		let receivedProviderRequest;
		const color = {
			describe() {
				return {
					kind: 'algorithm32-color',
					id: 'configured-color',
					colorSpace: 'linear-display',
					fingerprint: 'color:configured',
				};
			},
			convert() {
				return { rgba: [1, 1, 1, 1] };
			},
			createShaderContribution(request) {
				receivedProviderRequest = request;

				return {
					id: 'color-configured-output',
					owner: 'color',
					descriptorFingerprint: request.descriptor.color.fingerprint,
					compatibilityTags: request.descriptor.color.compatibilityTags,
					provides: ['color.encodeOutput'],
					requires: ['runtime.initialState'],
					defines: [],
					uniforms: [],
					textures: [],
					functions: [],
					mainHooks: [
						{
							id: 'configured-color-output',
							slot: 'encodeOutput',
							order: 0,
							code: 'outColor = vec4(1.0);',
						},
					],
					bindingRequirements: [],
				};
			},
		};
		const model = {
			version: 13,
			spectral: { basis: TEST_SPECTRAL_BASIS },
			snapshot() {
				return {
					...createSharedModelSnapshot(),
					version: 13,
				};
			},
		};
		const builder = new ShaderBuilder({ model });

		const result = await builder.build({
			setup: {
				composer: {},
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
			},
			config: {
				config: {
					color,
				},
			},
			mainRequiredSymbols: ['runtime.initialState', 'color.encodeOutput'],
		});

		expect(receivedProviderRequest.config.config.color).toBe(color);
		expect(receivedProviderRequest.descriptor.color.facts.id).toBe('configured-color');
		expect(result.assembly.contributions.map((contribution) => contribution.id)).toContain('color-configured-output');
		expect(result.assembly.fragmentShaderSource).toContain('outColor = vec4(1.0);');
	});

	it('builds and installs one opaque cumulative cache for automatic setup', async () => {
		const composer = createComposerDouble();
		const cache = createShaderCacheDouble();
		const controller = createCacheControllerDouble(cache);
		const model = createAutomaticShaderModel(controller);
		const cacheBackend = createCacheBackendDouble();
		const builder = new ShaderBuilder({
			model,
			transport: createTransportDouble(),
		});

		const result = await builder.build({
			setup: {
				composer,
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
				THREE: createThreeDouble(),
				cacheBackend,
			},
			config: {
				config: {
					color: createColorDouble(),
					execution: {
						maximumScatteringOrder: 2,
					},
				},
			},
		});

		expect(model.lightSource.createCacheController).toHaveBeenCalledWith({
			backend: cacheBackend,
			scheduler: undefined,
		});
		expect(controller.createScatteringCache).toHaveBeenCalledWith(jasmine.objectContaining({
			atmosphere: model.atmosphere,
			geometry: model.geometry,
			groundBoundary: null,
			spectralBasis: TEST_SPECTRAL_BASIS,
			maximumScatteringOrder: 2,
		}));
		expect(result.cacheController).toBe(controller);
		expect(result.cache).toBe(cache);
		expect(result.assembly.descriptor.cache.facts).toEqual(cache.descriptor);
		expect(result.assembly.contributions.map((contribution) => contribution.id)).toEqual(jasmine.arrayContaining([
			'cache-owner-test',
			'transport-core-test',
		]));
		expect(cacheBackend.installRuntimeBindings).toHaveBeenCalledWith(jasmine.objectContaining({
			bindings: cache.getRuntimeBindings(),
			uniforms: jasmine.objectContaining({
				'cache.cumulativeScatteringDensity': jasmine.any(Object),
			}),
		}));
		expect(composer.passes.length).toBe(2);
		const pass = composer.passes[1];
		expect(pass.uniforms.uCumulativeScatteringDensityCache.value)
			.toBe(cacheBackend.runtimeTexture);
		expect(pass.uniforms.uViewportSizePixels.value).toEqual([1, 1]);
		expect(pass.getDiagnostics().viewportSize).toEqual(pixelSize(1, 1));
		expect(model.geometry.resolveSceneDepthMax).toHaveBeenCalledWith(jasmine.objectContaining({
			sceneScale: { value: 1, units: 'meters-per-scene-unit' },
		}));
		expect(pass.uniforms.uSceneDepthMaxMeters.value).toBe(321);

		result.runtime.dispose();
		expect(composer.passes).toEqual([]);
		expect(controller.dispose).not.toHaveBeenCalled();
		controller.dispose();
		expect(cache.dispose).toHaveBeenCalledTimes(1);
	});

	it('routes final-view geometry changes through the existing source controller', async () => {
		const cache = createShaderCacheDouble();
		const controller = createCacheControllerDouble(cache);
		const model = createAutomaticShaderModel(controller);
		const builder = new ShaderBuilder({
			model,
			transport: createTransportDouble(),
		});
		const request = {
			setup: {
				composer: {},
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
				cacheBackend: createCacheBackendDouble(),
			},
			config: {
				config: {
					color: createColorDouble(),
					execution: { maximumScatteringOrder: 4 },
				},
			},
		};
		const baseline = await builder.build(request);
		const exactReuse = await builder.build({
			...request,
			previousBuildResult: baseline,
		});

		expect(model.lightSource.createCacheController).toHaveBeenCalledTimes(1);
		expect(exactReuse.cacheController).toBe(controller);

		const changedDisplay = createColorDouble();
		changedDisplay.describe = () => ({
			kind: 'algorithm32-color',
			id: 'changed-display',
			colorSpace: 'encoded-display',
			fingerprint: 'color:changed-display',
		});
		const visualReuse = await builder.build({
			...request,
			setup: {
				...request.setup,
				camera: { revision: 'changed-camera' },
				viewportSize: pixelSize(1920, 1080),
			},
			config: {
				config: {
					...request.config.config,
					color: changedDisplay,
				},
			},
			previousBuildResult: baseline,
		});

		expect(visualReuse.cacheController).toBe(controller);
		expect(visualReuse.cache).toBe(cache);
		expect(model.lightSource.createCacheController).toHaveBeenCalledTimes(1);
		expect(controller.createScatteringCache).toHaveBeenCalledTimes(1);

		model.geometry.describe().observerPosition = {
			coordinates: [1000, 0, 5],
			units: 'meters',
		};
		const observerRefresh = await builder.build({
			...request,
			previousBuildResult: baseline,
		});

		expect(observerRefresh.cacheController).toBe(controller);
		expect(observerRefresh.cache).toBe(cache);
		expect(model.lightSource.createCacheController).toHaveBeenCalledTimes(1);
		expect(controller.createScatteringCache).toHaveBeenCalledTimes(2);

		model.atmosphere.describe().transportRevision =
			'atmosphere-changed';
		await builder.build({
			...request,
			previousBuildResult: baseline,
		});

		expect(model.lightSource.createCacheController).toHaveBeenCalledTimes(1);
		expect(controller.createScatteringCache).toHaveBeenCalledTimes(3);

		model.lightSource.describe().transportRevision =
			'source-changed';
		await builder.build({
			...request,
			previousBuildResult: baseline,
		});

		expect(model.lightSource.createCacheController).toHaveBeenCalledTimes(2);
		expect(controller.createScatteringCache).toHaveBeenCalledTimes(4);
	});

	it('fails loudly after disposal', async () => {
		const builder = new ShaderBuilder({
			model: {
				version: 1,
			},
		});

		builder.dispose();

		await expectAsync(builder.build({
			setup: {
				composer: {},
				scene: {},
				camera: {},
				viewportSize: pixelSize(1, 1),
			},
		})).toBeRejectedWithError(/disposed/);
	});
});

function pixelSize(width, height) {
	return { width, height, units: 'pixels' };
}

/**
 * Create a complete descriptor for ShaderBuilder assembly specs.
 *
 * @returns {Algorithm32ShaderDescriptor} Return descriptor.
 */
function createDescriptor() {
	return {
		descriptorId: 'descriptor',
		variantId: 'variant',
		fingerprint: 'descriptor',
		compatibilityTags: [],
		spectralBasis: createSection('basis'),
		geometry: createSection('geometry'),
		atmosphere: createSection('atmosphere'),
		lightSource: createSection('light-source'),
		cache: createSection('cache'),
		transport: createSection('transport'),
		color: createSection('color'),
		runtime: createSection('runtime'),
	};
}

/**
 * Create a model snapshot for descriptor-builder integration specs.
 *
 * @returns {SharedModelSnapshot} Return snapshot.
 */
function createSharedModelSnapshot() {
	return {
		version: 9,
		lightSource: {
			kind: 'algorithm32-light-source-model',
			id: 'light-source-test',
			fingerprint: 'light-source:fingerprint',
		},
		atmosphere: {
			kind: 'algorithm32-atmosphere-model',
			id: 'atmosphere-test',
			fingerprint: 'atmosphere:fingerprint',
		},
		geometry: {
			kind: 'algorithm32-geometry-model',
			id: 'geometry-test',
			fingerprint: 'geometry:fingerprint',
		},
		spectral: {
			kind: 'algorithm32-spectral-model',
			basis: TEST_SPECTRAL_BASIS,
			channelCount: 1,
			fingerprint: 'spectral:fingerprint',
			version: 9,
		},
	};
}

function createAutomaticShaderModel(controller) {
	const snapshot = createSharedModelSnapshot();
	const geometryDescriptor = snapshot.geometry;
	const atmosphereDescriptor = snapshot.atmosphere;
	const lightDescriptor = snapshot.lightSource;
	const geometry = {
		describe: () => geometryDescriptor,
		resolveSceneDepthMax: jasmine.createSpy('resolveSceneDepthMax')
			.and.returnValue({ value: 321, units: 'meters' }),
		createShaderContribution(request) {
			return createContribution({
				id: 'geometry-owner-test',
				owner: 'geometry',
				descriptorFingerprint: request.descriptor.geometry.fingerprint,
				provides: ['geometry.test'],
				uniforms: [{
					name: 'uSceneDepthMaxMeters',
					type: 'float',
					valueKey: 'geometry.sceneDepthMax',
				}],
				functions: [],
				bindingRequirements: [],
			});
		},
	};
	const atmosphere = {
		describe: () => atmosphereDescriptor,
		createShaderContribution(request) {
			return createContribution({
				id: 'atmosphere-owner-test',
				owner: 'atmosphere',
				descriptorFingerprint: request.descriptor.atmosphere.fingerprint,
				provides: ['atmosphere.test'],
				uniforms: [],
				functions: [],
				bindingRequirements: [],
			});
		},
	};
	const lightSource = {
		describe: () => lightDescriptor,
		createCacheController: jasmine.createSpy('createCacheController')
			.and.returnValue(controller),
		createShaderContribution(request) {
			return createContribution({
				id: 'light-owner-test',
				owner: 'lightSource',
				descriptorFingerprint: request.descriptor.lightSource.fingerprint,
				provides: ['light.test'],
				uniforms: [],
				functions: [],
				bindingRequirements: [],
			});
		},
	};

	return {
		version: 14,
		geometry,
		atmosphere,
		lightSource,
		spectral: { basis: TEST_SPECTRAL_BASIS },
		snapshot: () => ({ ...snapshot, version: 14 }),
	};
}

function createShaderCacheDouble() {
	const runtimeBindings = {
		bindings: [{
			id: 'test-cumulative-cache-binding',
			valueKey: 'cache.cumulativeScatteringDensity',
			descriptor: {},
			backendId: 'test-cache-backend',
		}],
	};
	return {
		descriptor: {
			kind: 'algorithm32-scattering-cache',
			id: 'test-cumulative-cache',
			fingerprint: 'test-cumulative-cache:fingerprint',
		},
		getRuntimeBindings: () => runtimeBindings,
		createShaderContribution(request) {
			return createContribution({
				id: 'cache-owner-test',
				owner: 'cache',
				descriptorFingerprint: request.descriptor.cache.fingerprint,
				provides: ['cache.sampleCumulativeScatteringDensity'],
				uniforms: [],
				textures: [{
					name: 'uCumulativeScatteringDensityCache',
					type: 'sampler2DArray',
					valueKey: 'cache.cumulativeScatteringDensity',
				}],
				functions: [],
				bindingRequirements: [{
					id: 'cache.cumulative-scattering-density',
					owner: 'cache',
					kind: 'texture',
					updateFrequency: 'setup',
					valueKey: 'cache.cumulativeScatteringDensity',
					required: true,
				}],
			});
		},
		dispose: jasmine.createSpy('cache.dispose'),
	};
}

function createCacheControllerDouble(cache) {
	return {
		active: cache,
		createScatteringCache: jasmine.createSpy('createScatteringCache')
			.and.resolveTo(cache),
		dispose: jasmine.createSpy('controller.dispose').and.callFake(() => cache.dispose()),
	};
}

function createCacheBackendDouble() {
	const runtimeTexture = {};
	return {
		id: 'test-cache-backend',
		capabilities: { id: 'test-cache-capabilities' },
		runtimeTexture,
		installRuntimeBindings: jasmine.createSpy('installRuntimeBindings')
			.and.callFake(({ bindings, uniforms }) => {
				for (const binding of bindings.bindings) {
					uniforms[binding.valueKey].value = runtimeTexture;
				}
			}),
	};
}

function createTransportDouble() {
	return {
		mainRequiredShaderSymbols() {
			return [
				'runtime.initialState',
				'cache.sampleCumulativeScatteringDensity',
				'transport.evaluatePathRadiance',
				'color.encodeOutput',
			];
		},
		createShaderContribution(request) {
			return createContribution({
				id: 'transport-core-test',
				owner: 'transport',
				descriptorFingerprint: request.descriptor.transport.fingerprint,
				provides: ['transport.evaluatePathRadiance'],
				requires: ['cache.sampleCumulativeScatteringDensity'],
				uniforms: [],
				functions: [],
				bindingRequirements: [],
			});
		},
	};
}

function createColorDouble() {
	return {
		describe() {
			return {
				kind: 'algorithm32-color',
				id: 'configured-color',
				colorSpace: 'linear-display',
				fingerprint: 'color:configured',
			};
		},
		createShaderContribution(request) {
			return createContribution({
				id: 'color-configured-output',
				owner: 'color',
				descriptorFingerprint: request.descriptor.color.fingerprint,
				provides: [
					'color.composeSceneColor',
					'color.encodeOutput',
				],
				requires: ['runtime.initialState'],
				uniforms: [],
				functions: [],
				mainHooks: [
					{
						id: 'color-compose-test',
						slot: 'composeSceneColor',
						order: 0,
						code: 'state.outputRgba = vec4(1.0);',
					},
					{
						id: 'color-encode-test',
						slot: 'encodeOutput',
						order: 0,
						code: 'outColor = state.outputRgba;',
					},
				],
				bindingRequirements: [],
			});
		},
	};
}

/**
 * Create one descriptor section.
 *
 * @param {string} fingerprint - Store the section fingerprint.
 * @param {unknown} [facts] - Store section-owned facts.
 * @returns {ShaderDescriptorSection} Return section.
 */
function createSection(fingerprint, facts = {}) {
	return {
		descriptorId: fingerprint,
		fingerprint,
		compatibilityTags: [],
		facts,
	};
}

/**
 * Create one shader contribution.
 *
 * @returns {ShaderContribution} Return contribution.
 */
function createContribution(overrides = {}) {
	return {
		id: 'runtime-state',
		owner: 'runtime',
		descriptorFingerprint: 'runtime',
		compatibilityTags: [],
		provides: ['createInitialShaderState'],
		requires: [],
		defines: [],
		uniforms: [
			{
				name: 'uRuntimeGain',
				type: 'float',
				valueKey: 'runtimeGain',
			},
		],
		textures: [],
		functions: [
			{
				id: 'state-type',
				slot: 'declareTypes',
				order: 0,
				code: 'struct ShaderState { vec2 uv; vec3 color; };',
			},
			{
				id: 'create-state',
				slot: 'declareHelpers',
				order: 0,
				code: 'ShaderState createInitialShaderState(vec2 uv) { return ShaderState(uv, vec3(0.0)); }',
			},
		],
		mainHooks: [],
		bindingRequirements: [
			{
				id: 'uniform.runtime-gain',
				owner: 'runtime',
				kind: 'uniform',
				updateFrequency: 'config',
				valueKey: 'runtimeGain',
				required: true,
			},
		],
		...overrides,
	};
}

/**
 * Create a fake composer with add/remove pass support.
 *
 * @returns {object} Return fake composer.
 */
function createComposerDouble() {
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
 * Create a fake Three namespace.
 *
 * @returns {object} Return fake Three constructors.
 */
function createThreeDouble() {
	return {
		GLSL3: 'GLSL3',
		RGBAFormat: 'RGBAFormat',
		UnsignedByteType: 'UnsignedByteType',
		FloatType: 'FloatType',
		NearestFilter: 'NearestFilter',
		LinearFilter: 'LinearFilter',
		ClampToEdgeWrapping: 'ClampToEdgeWrapping',
		Color: class Color {},
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
		Data3DTexture: class Data3DTexture {
			constructor(data, width, height, depth) {
				this.image = {
					data,
					width,
					height,
					depth,
				};
				this.disposed = false;
			}

			dispose() {
				this.disposed = true;
			}
		},
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
		ShaderMaterial: class ShaderMaterial {
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
