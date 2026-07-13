import {ShaderBuilder} from '../ShaderBuilder.js';
import {ShaderBuilderTestSupport} from './ShaderBuilderTestSupport.js';

/** { pixel size, test spectral basis, create automatic shader model, create shader cache double, create cache controller double, create cache backend double, create transport double, create color double, create contribution, create composer double, create three double, } constant. */
const {
	pixelSize,
	TEST_SPECTRAL_BASIS,
	createAutomaticShaderModel,
	createShaderCacheDouble,
	createCelestialShaderCacheDouble,
	createCacheControllerDouble,
	createCelestialCacheControllerDouble,
	createCacheBackendDouble,
	createTransportDouble,
	createColorDouble,
	createContribution,
	createComposerDouble,
	createThreeDouble,
} = ShaderBuilderTestSupport;

describe('ShaderBuilder runtime', /** Called by Jasmine to register the named test suite. */ () => {
	it('installs and disposes a composer pass when assembly and Three setup are available', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
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
			compileAsync: jasmine.createSpy('compileAsync').and.resolveTo(),
		};

		await result.runtime.prepare(renderer);
		expect(renderer.compileAsync).toHaveBeenCalled();
		bindingValues.runtimeGain = 6;
		pass.render({/** Call this method to render. */ render() {}}, {}, {});
		expect(pass.uniforms.uRuntimeGain.value).toBe(6);

		result.runtime.dispose();

		expect(composer.passes).toEqual([]);
		expect(pass.enabled).toBe(false);
	});

	it('fails loudly before installing when a required uniform binding is missing', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const composer = createComposerDouble();
		const builder = new ShaderBuilder({
			model: {
				version: 4,
			},
		});

		await expectAsync(
			builder.build({
				setup: {
					composer,
					scene: {},
					camera: {},
					viewportSize: pixelSize(1, 1),
					THREE: createThreeDouble(),
				},
				contributions: [createContribution()],
				mainRequiredSymbols: ['createInitialShaderState'],
			}),
		).toBeRejectedWithError(/Required shader binding uniform\.runtime-gain \(runtimeGain\) is missing/);
		expect(composer.passes).toEqual([]);
	});

	it('fails loudly before installing when a required texture binding is missing', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const composer = createComposerDouble();
		const builder = new ShaderBuilder({
			model: {
				version: 4,
			},
		});

		await expectAsync(
			builder.build({
				setup: {
					composer,
					scene: {},
					camera: {},
					viewportSize: pixelSize(1, 1),
					THREE: createThreeDouble(),
				},
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
			}),
		).toBeRejectedWithError(/Required shader binding cache\.missingTexture \(cache\.missingTexture\) is missing/);
		expect(composer.passes).toEqual([]);
	});

	it('uses owner-provided uniform defaults when setup omits a binding value', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
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

	it('binds geometry-resolved scene-depth cap without creating capture when no capture textures are required', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const composer = createComposerDouble();
		const geometry = {
			resolveSceneDepthMax: jasmine
				.createSpy('resolveSceneDepthMax')
				.and.returnValue({value: 0.456, units: 'kilometers'}),
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
				sceneScale: {value: 1000, units: 'meters-per-scene-unit'},
			},
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
		expect(geometry.resolveSceneDepthMax).toHaveBeenCalledWith(
			jasmine.objectContaining({
				cameraScenePosition: {coordinates: [1, 2, 3], units: 'scene-units'},
				sceneScale: {value: 1000, units: 'meters-per-scene-unit'},
			}),
		);
		expect(composer.passes[0].uniforms.uSceneDepthMaxMeters.value).toBe(456);

		result.runtime.dispose();
	});

	it('builds and installs one opaque cumulative cache for automatic setup', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
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
			model,
			backend: cacheBackend,
			scheduler: undefined,
		});
		expect(controller.createScatteringCache).toHaveBeenCalledWith({signal: undefined});
		expect(result.scatteringCacheController).toBe(controller);
		expect(result.scatteringCache).toBe(cache);
		expect(result.scatteringCacheControllerIdentity).toEqual({
			source: model.lightSource,
			backend: cacheBackend,
			scheduler: null,
		});
		expect(result.distantSunCelestialCacheController).toBeNull();
		expect(result.distantSunCelestialCache).toBeNull();
		expect(result.distantSunCelestialCacheIdentity).toBeNull();
		expect(result.stellarPointSetCacheController).toBeNull();
		expect(result.stellarPointSetCache).toBeNull();
		expect(result.stellarPointSetCacheIdentity).toBeNull();
		expect(result.flatFiniteSunCacheController).toBeNull();
		expect(result.flatFiniteSunCache).toBeNull();
		expect(result.flatFiniteSunCacheIdentity).toBeNull();
		expect(
			result.assembly.contributions.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param contribution - The contribution value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (contribution) => contribution.id,
			),
		).toEqual(jasmine.arrayContaining(['cache-owner-test', 'transport-core-test']));
		expect(cacheBackend.installRuntimeBindings).toHaveBeenCalledWith(
			jasmine.objectContaining({
				bindings: cache.getRuntimeBindings(),
				uniforms: jasmine.objectContaining({
					'cache.cumulativeScatteringDensity': jasmine.any(Object),
				}),
			}),
		);
		expect(composer.passes.length).toBe(2);
		const pass = composer.passes[1];
		expect(pass.uniforms.uCumulativeScatteringDensityCache.value).toBe(cacheBackend.runtimeTexture);
		expect(pass.uniforms.uViewportSizePixels.value).toEqual([1, 1]);
		expect(pass.getDiagnostics().viewportSize).toEqual(pixelSize(1, 1));
		expect(model.geometry.resolveSceneDepthMax).toHaveBeenCalledWith(
			jasmine.objectContaining({
				sceneScale: {value: 1, units: 'meters-per-scene-unit'},
			}),
		);
		expect(pass.uniforms.uSceneDepthMaxMeters.value).toBe(321);

		result.runtime.dispose();
		expect(composer.passes).toEqual([]);
		expect(controller.dispose).not.toHaveBeenCalled();
		controller.dispose();
		expect(cache.dispose).toHaveBeenCalledTimes(1);
	});

	it('adds celestial runtime state only for an enabled roster and restores the exact null-roster source', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const cache = createShaderCacheDouble();
		const controller = createCacheControllerDouble(cache);
		const model = createAutomaticShaderModel(controller);
		const cacheBackend = createCacheBackendDouble();
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
				cacheBackend,
			},
			config: {
				config: {
					color: createColorDouble(),
					execution: {maximumScatteringOrder: 2},
				},
			},
		};
		const nullRosterResult = await builder.build(request);
		const nullRosterSource = nullRosterResult.assembly.fragmentShaderSource;

		expect(nullRosterSource).not.toContain('celestialRadiance');
		expect(nullRosterSource).not.toContain('preDisplayRadiance');

		model.celestialSources = {
			id: 'shader-builder-enabled-roster',
			family: 'spherical-sun-stars-radial-v1',
			sun: model.lightSource,
		};
		const enabledRosterResult = await builder.build({
			...request,
			previousBuildResult: nullRosterResult,
		});
		const enabledRosterSource = enabledRosterResult.assembly.fragmentShaderSource;

		expect(enabledRosterSource).toContain('evaluateScreenPaletteCelestialRadiance');
		expect(enabledRosterSource).toContain('sampleSunCoverageTile');
		expect(enabledRosterSource).not.toContain('sampleDistantSunCelestialRadiance');

		model.celestialSources = null;
		const restoredNullRosterResult = await builder.build({
			...request,
			previousBuildResult: enabledRosterResult,
		});

		expect(restoredNullRosterResult.assembly.fragmentShaderSource).toBe(nullRosterSource);
		expect(restoredNullRosterResult.assembly.sourceHash).toBe(nullRosterResult.assembly.sourceHash);

		controller.dispose();
	});

	it('assembles the source-local Sun consumer without constructing a superseded visible-Sun cache', async () => {
		const scatteringCache = createShaderCacheDouble();
		const scatteringController = createCacheControllerDouble(scatteringCache);
		const legacyCelestialCache = createCelestialShaderCacheDouble();
		const legacyCelestialController = createCelestialCacheControllerDouble(legacyCelestialCache);
		const model = createAutomaticShaderModel(scatteringController, legacyCelestialController);
		model.celestialSources = {
			id: 'shader-builder-sun-tile-roster',
			family: 'spherical-sun-stars-radial-v1',
			sun: model.lightSource,
		};
		const builder = new ShaderBuilder({model, transport: createTransportDouble()});
		const result = await builder.build({
			setup: {
				composer: {},
				scene: {},
				camera: {},
				viewportSize: pixelSize(8, 6),
				cacheBackend: createCacheBackendDouble(),
			},
			config: {
				config: {
					color: createColorDouble(),
					execution: {maximumScatteringOrder: 2},
				},
			},
		});

		expect(model.lightSource.createDistantSunCelestialCacheController).not.toHaveBeenCalled();
		expect(legacyCelestialController.build).not.toHaveBeenCalled();
		expect(result.distantSunCelestialCacheController).toBeNull();
		expect(result.distantSunCelestialCache).toBeNull();
		expect(result.assembly.fragmentShaderSource).toContain('sampleSunCoverageTile');
		expect(result.assembly.fragmentShaderSource).toContain('sunCoverage > 0.0');
		expect(result.assembly.fragmentShaderSource).not.toContain('sampleDistantSunCelestialRadiance');
		expect(scatteringController.createScatteringCache).toHaveBeenCalledTimes(1);

		result.runtime?.dispose();
		scatteringController.dispose();
	});

	it('reuses atmospheric scattering while a static source-local Sun successor is assembled', async () => {
		const scatteringCache = createShaderCacheDouble();
		const scatteringController = createCacheControllerDouble(scatteringCache);
		const model = createAutomaticShaderModel(scatteringController);
		model.celestialSources = {
			id: 'shader-builder-first-sun-tile-roster',
			family: 'spherical-sun-stars-radial-v1',
			sun: model.lightSource,
		};
		const builder = new ShaderBuilder({model, transport: createTransportDouble()});
		const request = {
			setup: {
				composer: {},
				scene: {},
				camera: {},
				viewportSize: pixelSize(8, 6),
				cacheBackend: createCacheBackendDouble(),
			},
			config: {
				config: {
					color: createColorDouble(),
					execution: {maximumScatteringOrder: 2},
				},
			},
		};
		const baseline = await builder.build(request);
		const successor = await builder.build({...request, previousBuildResult: baseline});

		expect(successor.scatteringCacheController).toBe(scatteringController);
		expect(scatteringController.createScatteringCache).toHaveBeenCalledTimes(2);
		expect(model.lightSource.createDistantSunCelestialCacheController).not.toHaveBeenCalled();
		expect(successor.distantSunCelestialCacheController).toBeNull();
		expect(successor.assembly.sourceHash).toBe(baseline.assembly.sourceHash);

		baseline.runtime?.dispose();
		successor.runtime?.dispose();
		scatteringController.dispose();
	});

	it('reuses controllers by source, backend, and scheduler ownership while delegating every cache selection', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const cache = createShaderCacheDouble();
		const controller = createCacheControllerDouble(cache);
		const model = createAutomaticShaderModel(controller);
		const scheduler = {};
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
				cacheBuildScheduler: scheduler,
			},
			config: {
				config: {
					color: createColorDouble(),
					execution: {maximumScatteringOrder: 4},
				},
			},
		};
		const baseline = await builder.build(request);
		const exactReuse = await builder.build({
			...request,
			previousBuildResult: baseline,
		});

		expect(model.lightSource.createCacheController).toHaveBeenCalledTimes(1);
		expect(exactReuse.scatteringCacheController).toBe(controller);
		expect(controller.createScatteringCache).toHaveBeenCalledTimes(2);

		const changedDisplay = createColorDouble();
		const visualReuse = await builder.build({
			...request,
			setup: {
				...request.setup,
				camera: {revision: 'changed-camera'},
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

		expect(visualReuse.scatteringCacheController).toBe(controller);
		expect(visualReuse.scatteringCache).toBe(cache);
		expect(model.lightSource.createCacheController).toHaveBeenCalledTimes(1);
		expect(controller.createScatteringCache).toHaveBeenCalledTimes(3);

		model.geometry = {...model.geometry};
		const observerRefresh = await builder.build({
			...request,
			previousBuildResult: baseline,
		});

		expect(observerRefresh.scatteringCacheController).toBe(controller);
		expect(observerRefresh.scatteringCache).toBe(cache);
		expect(model.lightSource.createCacheController).toHaveBeenCalledTimes(1);
		expect(controller.createScatteringCache).toHaveBeenCalledTimes(4);

		model.atmosphere = {...model.atmosphere};
		await builder.build({
			...request,
			previousBuildResult: baseline,
		});

		expect(model.lightSource.createCacheController).toHaveBeenCalledTimes(1);
		expect(controller.createScatteringCache).toHaveBeenCalledTimes(5);

		const replacementCache = createShaderCacheDouble();
		const replacementController = createCacheControllerDouble(replacementCache);
		const replacementLightSource = {
			...model.lightSource,
			createCacheController: jasmine
				.createSpy('replacement.createCacheController')
				.and.returnValue(replacementController),
		};
		model.lightSource = replacementLightSource;
		const sourceRefresh = await builder.build({
			...request,
			previousBuildResult: baseline,
		});

		expect(sourceRefresh.scatteringCacheController).toBe(replacementController);
		expect(sourceRefresh.scatteringCache).toBe(replacementCache);
		expect(replacementLightSource.createCacheController).toHaveBeenCalledWith({
			model,
			backend: request.setup.cacheBackend,
			scheduler,
		});
		expect(replacementController.createScatteringCache).toHaveBeenCalledTimes(1);
	});

	it('fails loudly after disposal', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const builder = new ShaderBuilder({
			model: {
				version: 1,
			},
		});

		builder.dispose();

		await expectAsync(
			builder.build({
				setup: {
					composer: {},
					scene: {},
					camera: {},
					viewportSize: pixelSize(1, 1),
				},
			}),
		).toBeRejectedWithError(/disposed/);
	});
});
