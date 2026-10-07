import {Algorithm32ShaderHandle} from '../Algorithm32ShaderHandle.js';
import {SpectralPacket} from '../../../spectral-values/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';

/**
 * Called by this module to create build result. Conditional result values are selected from the accepted input and current state.
 * @param modelVersion - The model version value accepted by the operation.
 * @param controller - The controller value accepted by the operation.
 * @param runtime - The runtime value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createBuildResult(modelVersion, controller = null, runtime = null) {
	return {
		modelVersion,
		setup: {bindingValues: {}},
		scatteringCacheController: controller,
		scatteringCache: controller ? {} : null,
		scatteringCacheControllerIdentity: controller
			? {
					source: /** @type {any} */ ({}),
					backend: /** @type {any} */ ({}),
					scheduler: null,
				}
			: null,
		distantSunCelestialCacheController: null,
		distantSunCelestialCache: null,
		distantSunCelestialCacheIdentity: null,
		stellarPointSetCacheController: null,
		stellarPointSetCache: null,
		stellarPointSetCacheIdentity: null,
		flatFiniteSunCacheController: null,
		flatFiniteSunCache: null,
		flatFiniteSunCacheIdentity: null,
		runtime,
	};
}

/**
 * Called by this module to create controller.
 * @param name - The name value accepted by the operation.
 * @param events - The events value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createController(name, events = []) {
	return {
		name,
		dispose: jasmine.createSpy(`${name}.dispose`).and.callFake(
			/** Called by the Jasmine spy to handle one callback invocation. */ () => {
				events.push(`${name}:controller`);
			},
		),
	};
}

/**
 * Called by this module to create runtime.
 * @param name - The name value accepted by the operation.
 * @param events - The events value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createRuntime(name, events = []) {
	return {
		prepare: jasmine.createSpy(`${name}.prepare`).and.resolveTo(),
		dispose: jasmine.createSpy(`${name}.dispose`).and.callFake(
			/** Called by the Jasmine spy to handle one callback invocation. */ () => {
				events.push(`${name}:runtime`);
			},
		),
		/**
		 * Called by create runtime to read diagnostics.
		 * @returns - The callback result returned to its caller.
		 */ getDiagnostics: () => ({name}),
	};
}

/**
 * Create one externally settled promise for supersession tests.
 *
 * @returns {ShaderHandleDeferredBuildResult} - Deferred build result.
 */
function createDeferredBuildResult() {
	let resolve = /** @type {(value: ShaderBuildResult) => void} */ (() => {});
	const promise = new Promise((resolvePromise) => {
		resolve = resolvePromise;
	});
	return {promise, resolve};
}

/**
 * Called by this module to create state.
 * @param options - The optional operation choices.
 * @returns - The result produced by the operation.
 */
function createState(options = {}) {
	const oldController = options.oldController ?? createController('old');
	const oldRuntime = options.oldRuntime ?? createRuntime('old');
	const nextController = options.nextController ?? createController('next');
	const nextRuntime = options.nextRuntime ?? createRuntime('next');
	const nextBuildResult = options.nextBuildResult ?? createBuildResult(2, nextController, nextRuntime);
	const shaderBuilder = {
		build: jasmine.createSpy('build').and.resolveTo(nextBuildResult),
		dispose: jasmine.createSpy('builder.dispose'),
	};
	const prepared = {
		baseVersion: 1,
		version: 2,
		config: {},
		model: {},
		reference: {dispose: jasmine.createSpy('reference.dispose')},
		shaderBuilder,
		snapshot: {version: 2},
	};
	const facade = {
		_model: {profile: {contentHash: `sha256:${'0'.repeat(64)}`}},
		_publishReceiverEnvironmentLight: jasmine.createSpy('publishReceiverEnvironmentLight').and.resolveTo({
			identity: 'accepted',
		}),
		_prepareConfig: jasmine.createSpy('prepareConfig').and.returnValue(prepared),
		_commitPreparedConfig: jasmine.createSpy('commitPreparedConfig').and.returnValue(prepared.snapshot),
		_discardPreparedConfig: jasmine.createSpy('discardPreparedConfig'),
		_createShaderBuildRequest: jasmine.createSpy('createShaderBuildRequest').and.callFake(
			/**
			 * Called by the Jasmine spy to handle one callback invocation.
			 * @param setup - The setup value accepted by the operation.
			 * @param config - The config value accepted by the operation.
			 * @param lifecycle - The lifecycle value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (setup, config, lifecycle) => ({
				setup,
				config,
				...lifecycle,
			}),
		),
		_forgetShaderHandle: jasmine.createSpy('forgetShaderHandle'),
	};

	return {
		facade,
		prepared,
		oldController,
		oldRuntime,
		nextController,
		nextRuntime,
		state: {
			facade,
			setup: {composer: {}},
			buildResult: createBuildResult(1, oldController, oldRuntime),
		},
	};
}

describe('Algorithm32ShaderHandle', /** Called by Jasmine to register the named test suite. */ () => {
	it('combines measured environment endpoints with newly sampled exact-time direct light', async () => {
		const context = createState(),
			handle = new Algorithm32ShaderHandle(context.state);
		const direct = new SpectralPacket({
			basis: NATIVE_15_SPECTRAL_BASIS,
			quantity: 'spectral-irradiance-density',
			units: 'W m^-2 nm^-1',
			semantics: 'contiguous-wavelength-bin-average',
			values: Array(15).fill(2),
			provenanceIdentity: 'p3-exact-direct-fixture',
		});
		const diffuse = new SpectralPacket({
			basis: NATIVE_15_SPECTRAL_BASIS,
			quantity: 'spectral-irradiance-density',
			units: 'W m^-2 nm^-1',
			semantics: 'contiguous-wavelength-bin-average',
			values: Array(15).fill(3),
			provenanceIdentity: 'p3-measured-environment-fixture',
		});
		const source = {
			sampleDirectLighting: jasmine
				.createSpy('exact-time-direct')
				.and.returnValue({sourceIrradiance: direct, directionToLight: [0, 0, 1]}),
		};
		const geometry = {
			resolveViewRaySegment: () => ({ray: {origin: {coordinates: [0, 0, 1], units: 'meters'}}}),
			resolveSourceRelativePosition: () => ({}),
		};
		const result = await handle.prepareReceiverEnvironmentLight(
			/** @type {any} */ ({
				geometry,
				lightSource: source,
				identity: 'p3-exact-publication',
				signal: new AbortController().signal,
				environmentSample: {
					diffuseHorizontal: diffuse,
					stellarAdaptationLuminance: {value: 0.25, units: 'cd m^-2'},
				},
			}),
		);
		expect(source.sampleDirectLighting).toHaveBeenCalledTimes(1);
		expect(result.identity).toBe('p3-exact-publication');
		expect(result.directNormal.values).toEqual(Array(15).fill(2));
		expect(result.directHorizontal.values).toEqual(Array(15).fill(2));
		expect(result.diffuseHorizontal).toBe(diffuse);
		expect(result.totalHorizontal.values).toEqual(Array(15).fill(5));
		expect(result.stellarAdaptationLuminance).toEqual({value: 0.25, units: 'cd m^-2'});
		handle.dispose();
	});
	it('routes the installed cache and GPU reduction through atomic facade publication', async () => {
		const context = createState();
		const handle = new Algorithm32ShaderHandle(context.state);
		const cancellation = new AbortController();
		const measurement = await handle.measureReceiverEnvironmentLight({
			THREE: {},
			renderer: {},
			backend: {capabilities: {scalarFormat: 'R32F', supportsArrayRenderTargets: true}},
			signal: cancellation.signal,
		});
		expect(measurement.identity).toBe('accepted');
		expect(context.facade._publishReceiverEnvironmentLight).toHaveBeenCalledTimes(1);
		const request = context.facade._publishReceiverEnvironmentLight.calls.mostRecent().args[0];
		expect(request.identity).toContain('receiver-environment-light:model-1');
		expect(request.identity).toContain('runtime-cache-');
		expect(request.signal).toBe(cancellation.signal);
		expect(typeof request.sampleIncomingRadiance).toBe('function');
		expect(typeof request.reduceIncomingRadiance).toBe('function');
		handle.dispose();
	});
	it('forwards view and WebGL lifecycle changes to the installed generation participant', () => {
		const context = createState();
		const participant = {
			markDirty: jasmine.createSpy('markDirty'),
			handleContextLoss: jasmine.createSpy('handleContextLoss'),
			handleContextRestoration: jasmine.createSpy('handleContextRestoration'),
		};
		/** @type {any} */ (context.state.buildResult).celestialGenerationParticipant = participant;
		const handle = new Algorithm32ShaderHandle(context.state);

		handle.markCelestialViewDirty();
		handle.handleContextLoss();
		handle.handleContextRestoration();
		expect(participant.markDirty).toHaveBeenCalledOnceWith('view');
		expect(participant.handleContextLoss).toHaveBeenCalledTimes(1);
		expect(participant.handleContextRestoration).toHaveBeenCalledTimes(1);
		handle.dispose();
	});
	it('rejects caller-cancelled replacement before preparing successor state', /** Called by Jasmine to exercise the named behavior. */ async () => {
		const context = createState();
		const handle = new Algorithm32ShaderHandle(context.state);
		const cancellation = new AbortController();
		cancellation.abort();

		await expectAsync(handle.setConfig({}, {signal: cancellation.signal})).toBeRejectedWith(
			jasmine.objectContaining({name: 'AbortError'}),
		);
		expect(context.facade._prepareConfig).not.toHaveBeenCalled();
		expect(context.oldRuntime.dispose).not.toHaveBeenCalled();
		expect(context.oldController.dispose).not.toHaveBeenCalled();
	});

	it('publishes a completed replacement before disposing the previous attachment', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const context = createState();
		const handle = new Algorithm32ShaderHandle(context.state);
		const config = {};
		const renderer = {};

		await handle.prepare(renderer);
		await expectAsync(handle.setConfig(config)).toBeResolvedTo({version: 2});
		expect(context.oldRuntime.prepare).toHaveBeenCalledOnceWith(renderer);
		expect(context.nextRuntime.prepare).toHaveBeenCalledOnceWith(renderer);
		expect(context.facade._prepareConfig).toHaveBeenCalledOnceWith(config);
		expect(context.prepared.shaderBuilder.build).toHaveBeenCalledWith(
			jasmine.objectContaining({
				previousBuildResult: context.state.buildResult,
				signal: jasmine.any(AbortSignal),
			}),
		);
		expect(context.facade._commitPreparedConfig).toHaveBeenCalledOnceWith(context.prepared);
		expect(context.oldRuntime.dispose).toHaveBeenCalledTimes(1);
		expect(context.oldController.dispose).toHaveBeenCalledTimes(1);
		expect(handle.getDiagnostics()).toEqual({
			status: 'installed',
			modelVersion: 2,
			runtime: {name: 'next'},
		});
	});

	it('retains the installed attachment when successor celestial preparation cannot publish', async () => {
		const context = createState();
		const renderer = {};
		context.nextRuntime.prepare.and.rejectWith(new Error('successor Sun tile generation failed'));
		const handle = new Algorithm32ShaderHandle(context.state);

		await handle.prepare(renderer);
		await expectAsync(handle.setConfig({})).toBeRejectedWithError(/successor Sun tile generation failed/);

		expect(context.facade._commitPreparedConfig).not.toHaveBeenCalled();
		expect(context.facade._discardPreparedConfig).toHaveBeenCalledOnceWith(context.prepared);
		expect(context.oldRuntime.dispose).not.toHaveBeenCalled();
		expect(context.oldController.dispose).not.toHaveBeenCalled();
		expect(context.nextRuntime.dispose).toHaveBeenCalledTimes(1);
		expect(context.nextController.dispose).toHaveBeenCalledTimes(1);
		expect(handle.getDiagnostics()).toEqual({
			status: 'installed',
			modelVersion: 1,
			runtime: {name: 'old'},
		});
	});

	it('retains an exactly reused controller while replacing only the runtime pass', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const controller = createController('shared');
		const context = createState({
			oldController: controller,
			nextController: controller,
		});
		const handle = new Algorithm32ShaderHandle(context.state);

		await handle.setConfig({});

		expect(context.oldRuntime.dispose).toHaveBeenCalledTimes(1);
		expect(controller.dispose).not.toHaveBeenCalled();
		handle.dispose();
		expect(controller.dispose).toHaveBeenCalledTimes(1);
	});

	it('preserves and retires scattering and celestial controllers independently', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const sharedScatteringController = createController('shared-scattering');
		const sharedSunController = createController('shared-sun');
		const oldStellarController = createController('old-stellar');
		const nextStellarController = createController('next-stellar');
		const oldFlatController = createController('old-flat');
		const context = createState({
			oldController: sharedScatteringController,
			nextController: sharedScatteringController,
		});
		context.state.buildResult = {
			...context.state.buildResult,
			distantSunCelestialCacheController: sharedSunController,
			stellarPointSetCacheController: oldStellarController,
			flatFiniteSunCacheController: oldFlatController,
		};
		context.prepared.shaderBuilder.build.and.resolveTo({
			...createBuildResult(2, sharedScatteringController, context.nextRuntime),
			distantSunCelestialCacheController: sharedSunController,
			stellarPointSetCacheController: nextStellarController,
		});
		const handle = new Algorithm32ShaderHandle(context.state);

		await handle.setConfig({});

		expect(sharedScatteringController.dispose).not.toHaveBeenCalled();
		expect(sharedSunController.dispose).not.toHaveBeenCalled();
		expect(oldStellarController.dispose).toHaveBeenCalledTimes(1);
		expect(oldFlatController.dispose).toHaveBeenCalledTimes(1);
		expect(nextStellarController.dispose).not.toHaveBeenCalled();

		handle.dispose();

		expect(sharedScatteringController.dispose).toHaveBeenCalledTimes(1);
		expect(sharedSunController.dispose).toHaveBeenCalledTimes(1);
		expect(nextStellarController.dispose).toHaveBeenCalledTimes(1);
	});

	it('keeps the installed runtime and config when replacement construction fails', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const context = createState();
		context.prepared.shaderBuilder.build.and.rejectWith(new Error('cache build failed'));
		const handle = new Algorithm32ShaderHandle(context.state);

		await expectAsync(handle.setConfig({})).toBeRejectedWithError(/cache build failed/);

		expect(context.facade._commitPreparedConfig).not.toHaveBeenCalled();
		expect(context.facade._discardPreparedConfig).toHaveBeenCalledOnceWith(context.prepared);
		expect(context.oldRuntime.dispose).not.toHaveBeenCalled();
		expect(context.oldController.dispose).not.toHaveBeenCalled();
		expect(handle.getDiagnostics().modelVersion).toBe(1);
	});

	it('keeps installed scattering and celestial controllers when successor construction fails', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const scatteringController = createController('installed-scattering');
		const celestialController = createController('installed-celestial');
		const context = createState({oldController: scatteringController});
		context.state.buildResult = {
			...context.state.buildResult,
			distantSunCelestialCacheController: celestialController,
		};
		context.prepared.shaderBuilder.build.and.rejectWith(new Error('successor celestial build failed'));
		const handle = new Algorithm32ShaderHandle(context.state);

		await expectAsync(handle.setConfig({})).toBeRejectedWithError(/successor celestial build failed/);

		expect(context.oldRuntime.dispose).not.toHaveBeenCalled();
		expect(scatteringController.dispose).not.toHaveBeenCalled();
		expect(celestialController.dispose).not.toHaveBeenCalled();
		expect(handle.getDiagnostics().modelVersion).toBe(1);

		handle.dispose();
		expect(scatteringController.dispose).toHaveBeenCalledTimes(1);
		expect(celestialController.dispose).toHaveBeenCalledTimes(1);
	});

	it('retires a superseded completed build without disturbing controllers preserved by the current build', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const installedScatteringController = createController('installed-scattering');
		const installedCelestialController = createController('installed-celestial');
		const supersededScatteringController = createController('superseded-scattering');
		const supersededCelestialController = createController('superseded-celestial');
		const currentCelestialController = createController('current-celestial');
		const supersededRuntime = createRuntime('superseded');
		const currentRuntime = createRuntime('current');
		const deferred = createDeferredBuildResult();
		const context = createState({oldController: installedScatteringController});
		context.state.buildResult = {
			...context.state.buildResult,
			distantSunCelestialCacheController: installedCelestialController,
		};
		const supersededResult = {
			...createBuildResult(2, supersededScatteringController, supersededRuntime),
			distantSunCelestialCacheController: supersededCelestialController,
		};
		const currentResult = {
			...createBuildResult(3, installedScatteringController, currentRuntime),
			distantSunCelestialCacheController: currentCelestialController,
		};
		const supersededBuilder = {
			build: jasmine.createSpy('superseded.build').and.returnValue(deferred.promise),
		};
		const currentBuilder = {
			build: jasmine.createSpy('current.build').and.resolveTo(currentResult),
		};
		const supersededPrepared = {
			...context.prepared,
			shaderBuilder: supersededBuilder,
			snapshot: {version: 2},
		};
		const currentPrepared = {
			...context.prepared,
			version: 3,
			shaderBuilder: currentBuilder,
			snapshot: {version: 3},
		};
		context.facade._prepareConfig.and.returnValues(supersededPrepared, currentPrepared);
		context.facade._commitPreparedConfig.and.callFake((prepared) => prepared.snapshot);
		const handle = new Algorithm32ShaderHandle(context.state);

		const supersededOperation = handle.setConfig({version: 2});
		await expectAsync(handle.setConfig({version: 3})).toBeResolvedTo({version: 3});
		deferred.resolve(supersededResult);
		await expectAsync(supersededOperation).toBeRejectedWithError(/superseded/);

		expect(installedScatteringController.dispose).not.toHaveBeenCalled();
		expect(installedCelestialController.dispose).toHaveBeenCalledTimes(1);
		expect(supersededRuntime.dispose).toHaveBeenCalledTimes(1);
		expect(supersededScatteringController.dispose).toHaveBeenCalledTimes(1);
		expect(supersededCelestialController.dispose).toHaveBeenCalledTimes(1);
		expect(currentCelestialController.dispose).not.toHaveBeenCalled();

		handle.dispose();
		expect(installedScatteringController.dispose).toHaveBeenCalledTimes(1);
		expect(currentCelestialController.dispose).toHaveBeenCalledTimes(1);
	});

	it('disposes the runtime before its controller exactly once', /** Called by Jasmine to exercise the named behavior. */ () => {
		const events = [];
		const controller = createController('active', events);
		const runtime = createRuntime('active', events);
		const context = createState({oldController: controller, oldRuntime: runtime});
		const handle = new Algorithm32ShaderHandle(context.state);

		handle.dispose();
		handle.dispose();

		expect(events).toEqual(['active:runtime', 'active:controller']);
		expect(context.facade._forgetShaderHandle).toHaveBeenCalledOnceWith(handle);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => handle.getDiagnostics(),
		).toThrowError(/disposed/);
	});

	it('still disposes the controller and forgets the handle when runtime disposal fails', /** Called by Jasmine to exercise the named behavior. */ () => {
		const controller = createController('active');
		const runtime = createRuntime('active');
		runtime.dispose.and.throwError('runtime disposal failed');
		const context = createState({oldController: controller, oldRuntime: runtime});
		const handle = new Algorithm32ShaderHandle(context.state);

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => handle.dispose(),
		).toThrowError(/runtime disposal failed/);
		expect(runtime.dispose).toHaveBeenCalledTimes(1);
		expect(controller.dispose).toHaveBeenCalledTimes(1);
		expect(context.facade._forgetShaderHandle).toHaveBeenCalledOnceWith(handle);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => handle.getDiagnostics(),
		).toThrowError(/disposed/);
	});

	it('attempts every distinct controller disposal and reports all failures', /** Called by Jasmine to exercise the named behavior. */ () => {
		const scatteringController = createController('scattering');
		const distantSunController = createController('distant-sun');
		const stellarController = createController('stellar');
		const flatController = createController('flat');
		scatteringController.dispose.and.throwError('scattering disposal failed');
		stellarController.dispose.and.throwError('stellar disposal failed');
		const context = createState({oldController: scatteringController});
		context.state.buildResult = {
			...context.state.buildResult,
			distantSunCelestialCacheController: distantSunController,
			stellarPointSetCacheController: stellarController,
			flatFiniteSunCacheController: flatController,
		};
		const handle = new Algorithm32ShaderHandle(context.state);
		let disposalError;

		try {
			handle.dispose();
		} catch (error) {
			disposalError = error;
		}

		expect(disposalError).toEqual(jasmine.any(AggregateError));
		expect(disposalError.errors).toEqual([
			jasmine.objectContaining({message: 'scattering disposal failed'}),
			jasmine.objectContaining({message: 'stellar disposal failed'}),
		]);
		expect(scatteringController.dispose).toHaveBeenCalledTimes(1);
		expect(distantSunController.dispose).toHaveBeenCalledTimes(1);
		expect(stellarController.dispose).toHaveBeenCalledTimes(1);
		expect(flatController.dispose).toHaveBeenCalledTimes(1);
		expect(context.facade._forgetShaderHandle).toHaveBeenCalledOnceWith(handle);
	});
});
