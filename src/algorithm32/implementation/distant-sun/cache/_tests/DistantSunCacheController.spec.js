import {CacheBuildModules} from '../../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CacheValues} from '../../../../gpu-cache-runtime/CacheValues.js';
import {CUMULATIVE_SCATTERING_CACHE_VALUE_KEY} from '../../../../gpu-cache-runtime/consts.js';
import {UniformLambertianGroundBoundary} from '../../../../implementation/index.js';
import {
	createNativeExecutionProfile,
	NATIVE_15_SPECTRAL_BASIS,
} from '../../../../profiles/native-15/native-15-profile.js';
import {DistantSunCacheController} from '../DistantSunCacheController.js';
import {DistantSunLightSource} from '../../DistantSunLightSource.js';
import {DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION} from '../consts.js';

/**
 * Called by this module to create deferred.
 * @returns - The result produced by the operation.
 */
function createDeferred() {
	let resolve;
	const promise = new Promise(
		/**
		 * Called by promise to handle one invocation of the declared operation.
		 * @param accept - The accept value accepted by the operation.
		 */ (accept) => {
			resolve = accept;
		},
	);
	return {promise, resolve};
}

/**
 * Called by this module to create source.
 * @param overrides - The overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createSource(overrides = {}) {
	const {directionToLight = [1, 0, 0], ...intrinsicOverrides} = overrides;
	const source = new DistantSunLightSource({
		angularRadius: {value: 0.004, units: 'radians'},
		...intrinsicOverrides,
	});
	source.configureGeometryPlacement({kind: 'distant-direction', directionToLight});

	return source;
}

/**
 * Called by this module to create owner module.
 * @param owner - The owner value accepted by the operation.
 * @param identity - The identity value accepted by the operation.
 * @param context - The execution context accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createOwnerModule(owner, identity, context) {
	return CacheBuildModules.createBuildModule({
		id: `controller-spec-${owner}-${identity}-${context.kind}-${context.order}`,
		owner,
		provides: [],
		requires: [],
		blocks: [],
		bindings: [],
	});
}

/**
 * Called by this module to create atmosphere.
 * @param identity - The identity value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createAtmosphere(identity = 'atmosphere-a') {
	return {
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		/**
		 * Call this method to create cache module.
		 * @param context - The execution context accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ createCacheModule(context) {
			return createOwnerModule('atmosphere', identity, context);
		},
	};
}

/**
 * Called by this module to create geometry.
 * @param identity - The identity value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createGeometry(identity = 'geometry-a') {
	return {
		configuration: {
			observation: {
				instant: '2026-03-20T12:00:00.000Z',
				location: {
					latitude: {value: 0, units: 'degrees'},
					longitude: {value: 0, units: 'degrees'},
				},
			},
			directionToSource: [1, 0, 0],
		},
		/**
		 * Call this method to create cache module.
		 * @param context - The execution context accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ createCacheModule(context) {
			return createOwnerModule('geometry', identity, context);
		},
		/**
		 * Call this method to create transport data.
		 * @returns - The result produced by the operation.
		 */ createTransportData() {
			return {
				queryCount: 1,
				tapCount: 1,
				sources: CacheValues.createData({
					id: `controller-spec-${identity}-transport-sources`,
					quantity: 'transport-source-address-and-active-flag',
					units: '1',
					shape: [3, 1],
					values: [0, 0, 0],
				}),
				coefficients: CacheValues.createData({
					id: `controller-spec-${identity}-transport-coefficients`,
					quantity: 'transport-path-coefficient',
					units: 'meters',
					shape: [1, 1, NATIVE_15_SPECTRAL_BASIS.channelCount],
					values: Array.from(
						{length: NATIVE_15_SPECTRAL_BASIS.channelCount},
						/**
						 * Called by the surrounding operation to handle one callback invocation.
						 * @returns - The callback result returned to its caller.
						 */ () => 0,
					),
				}),
			};
		},
	};
}

/**
 * Called by this module to create ground boundary.
 * @param identity - The identity value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createGroundBoundary(identity) {
	return new UniformLambertianGroundBoundary({
		id: identity,
		material: 'grass',
	});
}

/**
 * Called by this module to create backend state.
 * @returns - The result produced by the operation.
 */
function createBackendState() {
	return {
		fields: [],
		programs: [],
		publishedFields: [],
		submissionCount: 0,
		runtimeBindingCalls: 0,
		backendDisposeCalls: 0,
		failNextSubmission: false,
	};
}

/**
 * Called by this module to create backend.
 * @param state - The state value accepted by the operation.
 * @param capabilityOverrides - The capability overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createBackend(state, capabilityOverrides = {}) {
	const backend = {
		id: 'controller-spec-backend',
		capabilities: {
			id: 'controller-spec-capabilities',
			api: 'manufactured',
			scalarFormat: 'R32F',
			supportsArrayRenderTargets: true,
			supportsFloatSampling: true,
			maximumTextureSize: 16384,
			maximumArrayLayers: 256,
			...capabilityOverrides,
		},
		/**
		 * Call this method to allocate field.
		 * @param fieldSpecification - The field specification accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ allocateField(fieldSpecification) {
			const field = {
				id: fieldSpecification.id,
				storage: fieldSpecification.storage,
				backendId: backend.id,
				disposeCount: 0,
				/** Call this method to dispose. */ dispose() {
					this.disposeCount += 1;
				},
			};
			state.fields.push(field);
			return field;
		},
		/**
		 * Call this method to compile.
		 * @param shader - The shader value accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ compile(shader) {
			const program = {
				id: shader.id,
				sourceHash: shader.sourceHash,
				disposeCount: 0,
				/** Call this method to dispose. */ dispose() {
					this.disposeCount += 1;
				},
			};
			state.programs.push(program);
			return program;
		},
		/**
		 * Call this method to submit layer.
		 * @throws {Error} - When the operation cannot complete its caller-observable contract.
		 */ submitLayer() {
			state.submissionCount += 1;
			if (state.failNextSubmission) {
				state.failNextSubmission = false;
				throw new Error('manufactured controller submission failure');
			}
		},
		/**
		 * Call this method to create runtime binding.
		 * @param request - The field and runtime value accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ createRuntimeBinding(request) {
			state.runtimeBindingCalls += 1;
			state.publishedFields.push(request.field);
			return {
				id: `controller-spec-binding-${state.runtimeBindingCalls}`,
				valueKey: CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
				fieldId: request.field.id,
				backendId: backend.id,
			};
		},
		/** Call this method to install runtime bindings. */ installRuntimeBindings() {},
		/** Call this method to dispose. */ dispose() {
			state.backendDisposeCalls += 1;
		},
	};
	return backend;
}

/**
 * Called by this module to create scheduler control.
 * @returns - The result produced by the operation.
 */
function createSchedulerControl() {
	let blockedYield = null;
	return {
		scheduler: {
			/**
			 * Call this method to yield control. The promise rejects if the scheduler cannot yield; this scheduling operation is not cancellable once started.
			 */ async yieldControl() {
				if (blockedYield === null) {
					return;
				}
				const current = blockedYield;
				blockedYield = null;
				current.reached.resolve();
				await current.release.promise;
			},
		},
		/**
		 * Call this method to block next yield.
		 * @returns - The result produced by the operation.
		 */ blockNextYield() {
			const reached = createDeferred();
			const release = createDeferred();
			blockedYield = {reached, release};
			return {
				reached: reached.promise,
				/**
				 * Called by block next yield to release.
				 * @returns - The callback result returned to its caller.
				 */ release: () => release.resolve(),
			};
		},
	};
}

/**
 * Called by this module to create harness.
 * @param options - The optional operation choices.
 * @returns - The result produced by the operation.
 */
function createHarness(options = {}) {
	const source = options.source ?? createSource();
	const atmosphere = options.atmosphere ?? createAtmosphere();
	const geometry = options.geometry ?? createGeometry();
	const state = options.state ?? createBackendState();
	const backend = options.backend ?? createBackend(state);
	const groundBoundary = options.groundBoundary ?? null;
	const domains = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	const model = /** @type {SharedModel} */ (
		/** @type {unknown} */ ({
			lightSource: source,
			atmosphere,
			geometry,
			groundBoundary,
			profile: createNativeExecutionProfile({
				lightSource: source,
				atmosphere,
				geometry,
				groundBoundary,
				observation: geometry.configuration.observation,
				domains: {
					positions: domains.positionDomain,
					incomingDirections: domains.incomingDirectionDomain,
					outgoingDirections: domains.outgoingDirectionDomain,
				},
				execution: {maximumScatteringOrder: options.maximumScatteringOrder ?? 1},
			}),
		})
	);
	const controller = new DistantSunCacheController({
		model,
		backend,
		scheduler: options.scheduler,
	});
	return {source, atmosphere, geometry, groundBoundary, model, state, backend, controller};
}

/**
 * Called by this module to build request. Conditional result values are selected from the accepted input and current state.
 * @param harness - The harness value accepted by the operation.
 * @param maximumScatteringOrder - The maximum scattering order value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function buildRequest(harness, maximumScatteringOrder) {
	return {};
}

/**
 * Called by this module to expect abort. The promise rejects if the supplied operation does not abort as expected; this assertion is not cancellable once started.
 * @param promise - The promise value accepted by the operation.
 */
async function expectAbort(promise) {
	let rejection;
	try {
		await promise;
	} catch (error) {
		rejection = error;
	}
	expect(rejection?.name).toBe('AbortError');
}

describe('DistantSunCacheController', /** Called by Jasmine to register the named test suite. */ () => {
	it('publishes complete N1, N2, and default-N4 artifacts atomically', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const firstHarness = createHarness({maximumScatteringOrder: 1});
		const firstOrderResult = await firstHarness.controller.createScatteringCache({});
		expect(firstHarness.controller.active).toBe(firstOrderResult);
		expect(firstOrderResult.getRuntimeBindings().bindings[0].fieldId).toBe('distant-sun-j-through-1');
		const secondHarness = createHarness({maximumScatteringOrder: 2});
		const secondOrderResult = await secondHarness.controller.createScatteringCache({});
		expect(secondOrderResult.getRuntimeBindings().bindings[0].fieldId).toBe('distant-sun-j-through-2');
		const fourthHarness = createHarness({maximumScatteringOrder: 4});
		const fourthOrderResult = await fourthHarness.controller.createScatteringCache({});
		expect(fourthOrderResult.getRuntimeBindings().bindings[0].fieldId).toBe('distant-sun-j-through-4');
		expect(fourthOrderResult.getRuntimeBindings().backendId).toBe(fourthHarness.backend.id);

		firstHarness.controller.dispose();
		secondHarness.controller.dispose();
		fourthHarness.controller.dispose();
		expect(firstHarness.state.backendDisposeCalls).toBe(0);
	});

	it('reuses only its own exact active model and backend identity', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const harness = createHarness();
		const first = await harness.controller.createScatteringCache(buildRequest(harness, 1));
		const reused = await harness.controller.createScatteringCache(buildRequest(harness, 1));

		expect(reused).toBe(first);
		expect(harness.state.runtimeBindingCalls).toBe(1);

		harness.backend.capabilities.maximumTextureSize -= 1;
		const capabilityChange = await harness.controller.createScatteringCache({});
		expect(capabilityChange).not.toBe(first);
		expect(harness.state.runtimeBindingCalls).toBe(2);
	});

	it('accepts profile-owned grass Lambertian facts and keys plans by boundary id', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const first = createHarness({maximumScatteringOrder: 2, groundBoundary: createGroundBoundary('ground-a')});
		const equivalent = createHarness({
			maximumScatteringOrder: 2,
			groundBoundary: createGroundBoundary('ground-a'),
		});
		const changed = createHarness({maximumScatteringOrder: 2, groundBoundary: createGroundBoundary('ground-b')});

		expect(first.controller.createBuildPlan().identity.contentHash).toBe(
			equivalent.controller.createBuildPlan().identity.contentHash,
		);
		expect(first.controller.createBuildPlan().identity.contentHash).not.toBe(
			changed.controller.createBuildPlan().identity.contentHash,
		);
	});

	it('keeps controllers from one source independent and never owns the backend', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const source = createSource();
		const state = createBackendState();
		const backend = createBackend(state);
		const first = createHarness({source, state, backend});
		const second = createHarness({source, state, backend});

		const firstCache = await first.controller.createScatteringCache(buildRequest(first, 1));
		const secondCache = await second.controller.createScatteringCache(buildRequest(second, 1));
		expect(firstCache).not.toBe(secondCache);
		expect(first.controller.active).toBe(firstCache);
		expect(second.controller.active).toBe(secondCache);

		first.controller.dispose();
		expect(state.publishedFields[0].disposeCount).toBe(1);
		expect(state.publishedFields[1].disposeCount).toBe(0);
		expect(state.backendDisposeCalls).toBe(0);

		second.controller.dispose();
		expect(state.publishedFields[1].disposeCount).toBe(1);
		expect(state.backendDisposeCalls).toBe(0);
	});

	it('preserves the active cache when replacement execution fails', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const harness = createHarness();
		const active = await harness.controller.createScatteringCache(buildRequest(harness, 1));
		harness.backend.capabilities.maximumTextureSize -= 1;
		harness.state.failNextSubmission = true;

		await expectAsync(harness.controller.createScatteringCache(buildRequest(harness, 2))).toBeRejectedWithError(
			/manufactured controller submission failure/,
		);

		expect(harness.controller.active).toBe(active);
		expect(harness.state.publishedFields[0].disposeCount).toBe(0);
		expect(harness.state.runtimeBindingCalls).toBe(1);
		expect(
			harness.state.fields.slice(2).every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param field - The field value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (field) => field.disposeCount === 1,
			),
		).toBeTrue();

		const replacement = await harness.controller.createScatteringCache(buildRequest(harness, 2));
		expect(replacement).not.toBe(active);
		expect(harness.controller.active).toBe(replacement);
	});

	it('supersedes staging B and returns active A when A becomes latest again', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const schedulerControl = createSchedulerControl();
		const harness = createHarness({scheduler: schedulerControl.scheduler});
		const activeA = await harness.controller.createScatteringCache(buildRequest(harness, 1));
		const originalMaximumTextureSize = harness.backend.capabilities.maximumTextureSize;
		const blocked = schedulerControl.blockNextYield();
		harness.backend.capabilities.maximumTextureSize -= 1;
		const stagingB = harness.controller.createScatteringCache(buildRequest(harness, 2));
		await blocked.reached;

		harness.backend.capabilities.maximumTextureSize = originalMaximumTextureSize;
		const latestA = harness.controller.createScatteringCache(buildRequest(harness, 1));
		expect(harness.controller.active).toBe(activeA);
		blocked.release();

		await expectAbort(stagingB);
		expect(await latestA).toBe(activeA);
		expect(harness.controller.active).toBe(activeA);
		expect(harness.state.runtimeBindingCalls).toBe(1);
	});

	it('preserves active state on caller cancellation and cancels on disposal', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const schedulerControl = createSchedulerControl();
		const harness = createHarness({scheduler: schedulerControl.scheduler});
		const active = await harness.controller.createScatteringCache(buildRequest(harness, 1));
		const blocked = schedulerControl.blockNextYield();
		const cancellation = new AbortController();
		harness.backend.capabilities.maximumTextureSize -= 1;
		const staging = harness.controller.createScatteringCache({
			...buildRequest(harness, 2),
			signal: cancellation.signal,
		});
		await blocked.reached;
		cancellation.abort();
		blocked.release();

		await expectAbort(staging);
		expect(harness.controller.active).toBe(active);
		expect(harness.state.publishedFields[0].disposeCount).toBe(0);

		const disposalBlock = schedulerControl.blockNextYield();
		const disposedStaging = harness.controller.createScatteringCache(buildRequest(harness, 2));
		await disposalBlock.reached;
		harness.controller.dispose();
		disposalBlock.release();

		await expectAbort(disposedStaging);
		expect(harness.controller.active).toBeNull();
		expect(harness.state.publishedFields[0].disposeCount).toBe(1);
		expect(harness.state.backendDisposeCalls).toBe(0);
	});

	it('rejects an already-aborted transient request before scheduling work', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const harness = createHarness();
		const aborted = new AbortController();
		aborted.abort();
		await expectAbort(
			harness.controller.createScatteringCache({
				signal: aborted.signal,
			}),
		);
		expect(harness.state.submissionCount).toBe(0);
	});

	it('keys executable plans and backend capabilities deterministically', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const atmosphere = createAtmosphere();
		const geometry = createGeometry();
		const source = createSource();
		const state = createBackendState();
		const backend = createBackend(state);
		/**
		 * Called by create plan to create plan.
		 * @param overrides - The overrides value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ const createPlan = (overrides = {}) => {
			const harness = createHarness({
				source: overrides.source ?? source,
				atmosphere: overrides.atmosphere ?? atmosphere,
				geometry: overrides.geometry ?? geometry,
				groundBoundary: overrides.groundBoundary ?? null,
				maximumScatteringOrder: overrides.maximumScatteringOrder ?? 1,
				backend,
				state,
			});
			const plan = harness.controller.createBuildPlan();
			harness.controller.dispose();

			return plan;
		};
		const baselinePlan = createPlan();
		const repeatedPlan = createPlan();
		const baseline = baselinePlan.identity.contentHash;

		expect(repeatedPlan).not.toBe(baselinePlan);
		expect(repeatedPlan.identity).not.toBe(baselinePlan.identity);
		expect(repeatedPlan.fields).not.toBe(baselinePlan.fields);
		expect(repeatedPlan.passes).not.toBe(baselinePlan.passes);
		expect(repeatedPlan.passes[0]).not.toBe(baselinePlan.passes[0]);
		expect(repeatedPlan.passes[0].modules).not.toBe(baselinePlan.passes[0].modules);
		expect(repeatedPlan.identity.contentHash).toBe(baseline);
		expect(createPlan({source: createSource({directionToLight: [0, 1, 0]})}).identity.contentHash).not.toBe(
			baseline,
		);
		expect(createPlan({atmosphere: createAtmosphere('atmosphere-b')}).identity.contentHash).not.toBe(baseline);
		expect(createPlan({geometry: createGeometry('geometry-b')}).identity.contentHash).not.toBe(baseline);
		expect(
			createPlan({
				groundBoundary: createGroundBoundary('ground-a'),
				maximumScatteringOrder: 2,
			}).identity.contentHash,
		).not.toBe(
			createPlan({
				groundBoundary: createGroundBoundary('ground-b'),
				maximumScatteringOrder: 2,
			}).identity.contentHash,
		);
		expect(createPlan({maximumScatteringOrder: 2}).identity.contentHash).not.toBe(baseline);
		expect(baselinePlan.identity.id).toBe('algorithm32-distant-sun-cache-construction-v1');
		expect(baselinePlan.identity.contentHash).toMatch(/^sha256:/u);

		const harness = createHarness();
		const first = await harness.controller.createScatteringCache(buildRequest(harness, 1));
		harness.backend.capabilities.maximumTextureSize /= 2;
		const capabilityChange = await harness.controller.createScatteringCache(buildRequest(harness, 1));

		expect(capabilityChange).not.toBe(first);
		expect(harness.state.runtimeBindingCalls).toBe(2);
	});

	it('constructs deterministic cumulative J3 and J5 recurrence graphs', /** Called by Jasmine to exercise the named behavior. */ () => {
		const thirdOrder = createHarness({maximumScatteringOrder: 3}).controller.createBuildPlan();
		const fifthOrder = createHarness({maximumScatteringOrder: 5}).controller.createBuildPlan();

		expect(thirdOrder.result).toBe('distant-sun-j-through-3');
		expect(thirdOrder.passes.map((pass) => pass.id).slice(-3)).toEqual([
			'distant-sun-transport-j2-to-l2',
			'distant-sun-scatter-l2-to-j3',
			'distant-sun-accumulate-j-through-2-j3',
		]);
		expect(fifthOrder.result).toBe('distant-sun-j-through-5');
		expect(fifthOrder.passes.map((pass) => pass.id).slice(-3)).toEqual([
			'distant-sun-transport-j4-to-l4',
			'distant-sun-scatter-l4-to-j5',
			'distant-sun-accumulate-j-through-4-j5',
		]);
	});
});
