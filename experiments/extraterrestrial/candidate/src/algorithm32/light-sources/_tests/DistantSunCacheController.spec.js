import { createCacheData, createCacheBuildModule } from '../../caches/gpu/cacheBuildContracts.js';
import {
	CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
} from '../../caches/gpu/cacheRuntimeContracts.js';
import { SpectralBasis } from '../../quantities/SpectralBasis.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../profiles/native-15-profile.js';
import { DistantSunCacheController } from '../DistantSunCacheController.js';
import { DistantSunLightSource } from '../DistantSunLightSource.js';
import { createDistantSunCacheBuildPlan } from '../distant-sun-cache-plan.js';
import {
	createDistantSunCacheFingerprint,
} from '../distant-sun-cache-fingerprint.js';

function createDeferred() {
	let resolve;
	const promise = new Promise((accept) => {
		resolve = accept;
	});
	return { promise, resolve };
}

function createSource(overrides = {}) {
	return new DistantSunLightSource({
		directionToLight: [1, 0, 0],
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: { value: 0.004, units: 'radians' },
		...overrides,
	});
}

function createOwnerModule(owner, identity, context) {
	return createCacheBuildModule({
		id: `controller-spec-${owner}-${identity}-${context.kind}-${context.order}`,
		owner,
		provides: [],
		requires: [],
		blocks: [],
		bindings: [],
	});
}

function createAtmosphere(identity = 'atmosphere-a') {
	return {
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		createCacheModule(context) {
			return createOwnerModule('atmosphere', identity, context);
		},
	};
}

function createGeometry(identity = 'geometry-a') {
	return {
		createCacheModule(context) {
			return createOwnerModule('geometry', identity, context);
		},
		createTransportData() {
			return {
				queryCount: 1,
				tapCount: 1,
				sources: createCacheData({
					id: `controller-spec-${identity}-transport-sources`,
					quantity: 'transport-source-address-and-active-flag',
					units: '1',
					shape: [3, 1],
					values: [0, 0, 0],
				}),
				coefficients: createCacheData({
					id: `controller-spec-${identity}-transport-coefficients`,
					quantity: 'transport-path-coefficient',
					units: 'meters',
					shape: [1, 1, NATIVE_15_SPECTRAL_BASIS.channelCount],
					values: Array.from(
						{ length: NATIVE_15_SPECTRAL_BASIS.channelCount },
						() => 0,
					),
				}),
			};
		},
	};
}

function createGroundBoundary(identity, contentHashCharacter) {
	return {
		describe() {
			return {
				kind: 'algorithm32-ground-boundary',
				id: identity,
				contentHash: `sha256:${contentHashCharacter.repeat(64)}`,
				model: 'manufactured-uniform-lambertian',
			};
		},
		evaluateBrdf() {
			return {
				quantity: 'spectral-brdf',
				unitType: 'inverse-steradian',
				values: Array(
					NATIVE_15_SPECTRAL_BASIS.channelCount,
				).fill(0.1),
			};
		},
		createCacheModule(context) {
			return createCacheBuildModule({
				id: `controller-spec-${identity}-${context.kind}-${context.order}`,
				owner: 'ground',
				provides: ['ground.reflectance'],
				requires: [],
				blocks: [{
					id: `controller-spec-${identity}-brdf`,
					phase: 'function',
					order: 0,
					source:
						'float cacheGroundBrdf(int wavelengthIndex) { return 0.1; }',
				}],
				bindings: [],
			});
		},
	};
}

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
		allocateField(spec) {
			const field = {
				descriptor: spec.descriptor,
				storage: spec.storage,
				backendId: backend.id,
				disposeCount: 0,
				dispose() {
					this.disposeCount += 1;
				},
			};
			state.fields.push(field);
			return field;
		},
		compile(shader) {
			const program = {
				id: shader.id,
				sourceHash: shader.sourceHash,
				disposeCount: 0,
				dispose() {
					this.disposeCount += 1;
				},
			};
			state.programs.push(program);
			return program;
		},
		submitLayer() {
			state.submissionCount += 1;
			if (state.failNextSubmission) {
				state.failNextSubmission = false;
				throw new Error('manufactured controller submission failure');
			}
		},
		createRuntimeBinding(field) {
			state.runtimeBindingCalls += 1;
			state.publishedFields.push(field);
			return {
				id: `controller-spec-binding-${state.runtimeBindingCalls}`,
				valueKey: CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
				descriptor: field.descriptor,
				backendId: backend.id,
			};
		},
		installRuntimeBindings() {},
		dispose() {
			state.backendDisposeCalls += 1;
		},
	};
	return backend;
}

function createSchedulerControl() {
	let blockedYield = null;
	return {
		scheduler: {
			async yieldControl() {
				if (blockedYield === null) {
					return;
				}
				const current = blockedYield;
				blockedYield = null;
				current.reached.resolve();
				await current.release.promise;
			},
		},
		blockNextYield() {
			const reached = createDeferred();
			const release = createDeferred();
			blockedYield = { reached, release };
			return {
				reached: reached.promise,
				release: () => release.resolve(),
			};
		},
	};
}

function createHarness(options = {}) {
	const source = options.source ?? createSource();
	const atmosphere = options.atmosphere ?? createAtmosphere();
	const geometry = options.geometry ?? createGeometry();
	const state = options.state ?? createBackendState();
	const backend = options.backend ?? createBackend(state);
	const controller = new DistantSunCacheController({
		source,
		backend,
		scheduler: options.scheduler,
	});
	return { source, atmosphere, geometry, state, backend, controller };
}

function buildRequest(harness, maximumScatteringOrder) {
	return {
		atmosphere: harness.atmosphere,
		geometry: harness.geometry,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		...(maximumScatteringOrder === undefined
			? {}
			: { maximumScatteringOrder }),
	};
}

async function expectAbort(promise) {
	let rejection;
	try {
		await promise;
	} catch (error) {
		rejection = error;
	}
	expect(rejection?.name).toBe('AbortError');
}

describe('DistantSunCacheController', () => {
	it('publishes complete N1, N2, and default-N4 artifacts atomically', async () => {
		const harness = createHarness();
		const n1 = await harness.controller.createScatteringCache(
			buildRequest(harness, 1),
		);
		expect(harness.controller.active).toBe(n1);
		expect(n1.descriptor.controls.maximumScatteringOrder).toBe(1);
		expect(n1.descriptor.controls.transportIntervalCount).toBe(15);
		expect(harness.state.publishedFields[0].disposeCount).toBe(0);

		const n2 = await harness.controller.createScatteringCache(
			buildRequest(harness, 2),
		);
		expect(harness.controller.active).toBe(n2);
		expect(n2.descriptor.controls.maximumScatteringOrder).toBe(2);
		expect(n2.descriptor.controls.transportIntervalCount).toBe(15);
		expect(harness.state.publishedFields[0].disposeCount).toBe(1);

		const n4 = await harness.controller.createScatteringCache(
			buildRequest(harness),
		);
		expect(harness.controller.active).toBe(n4);
		expect(n4.descriptor.controls.maximumScatteringOrder).toBe(4);
		expect(n4.descriptor.controls.transportIntervalCount).toBe(15);
		expect(harness.state.publishedFields[1].disposeCount).toBe(1);
		expect(n4.getRuntimeBindings().backendId).toBe(harness.backend.id);
		expect(harness.state.runtimeBindingCalls).toBe(3);

		harness.controller.dispose();
		harness.controller.dispose();
		expect(harness.controller.active).toBeNull();
		expect(harness.state.publishedFields.map((field) => field.disposeCount))
			.toEqual([1, 1, 1]);
		expect(harness.state.backendDisposeCalls).toBe(0);
	});

	it('reuses only its own exact active fingerprint and rebuilds changed owners', async () => {
		const harness = createHarness();
		const first = await harness.controller.createScatteringCache(
			buildRequest(harness, 1),
		);
		const reused = await harness.controller.createScatteringCache(
			buildRequest(harness, 1),
		);

		expect(reused).toBe(first);
		expect(harness.state.runtimeBindingCalls).toBe(1);

		harness.geometry = createGeometry('geometry-b');
		const geometryChange = await harness.controller.createScatteringCache(
			buildRequest(harness, 1),
		);
		expect(geometryChange).not.toBe(first);
		expect(harness.state.runtimeBindingCalls).toBe(2);

		harness.atmosphere = createAtmosphere('atmosphere-b');
		const atmosphereChange = await harness.controller.createScatteringCache(
			buildRequest(harness, 1),
		);
		expect(atmosphereChange).not.toBe(geometryChange);
		expect(harness.state.runtimeBindingCalls).toBe(3);
	});

	it('reuses an unchanged reflective boundary and rebuilds when its content changes', async () => {
		const harness = createHarness();
		const firstBoundary = createGroundBoundary('ground-a', 'a');
		const secondBoundary = createGroundBoundary('ground-b', 'b');
		const firstRequest = {
			...buildRequest(harness, 2),
			groundBoundary: firstBoundary,
		};
		const first = await harness.controller.createScatteringCache(firstRequest);
		const reused = await harness.controller.createScatteringCache(firstRequest);

		expect(reused).toBe(first);
		expect(harness.state.runtimeBindingCalls).toBe(1);

		const changed = await harness.controller.createScatteringCache({
			...buildRequest(harness, 2),
			groundBoundary: secondBoundary,
		});

		expect(changed).not.toBe(first);
		expect(harness.controller.active).toBe(changed);
		expect(harness.state.runtimeBindingCalls).toBe(2);
		expect(harness.state.publishedFields[0].disposeCount).toBe(1);
	});

	it('keeps controllers from one source independent and never owns the backend', async () => {
		const source = createSource();
		const state = createBackendState();
		const backend = createBackend(state);
		const first = createHarness({ source, state, backend });
		const second = createHarness({ source, state, backend });

		const firstCache = await first.controller.createScatteringCache(
			buildRequest(first, 1),
		);
		const secondCache = await second.controller.createScatteringCache(
			buildRequest(second, 1),
		);
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

	it('preserves the active cache when replacement execution fails', async () => {
		const harness = createHarness();
		const active = await harness.controller.createScatteringCache(
			buildRequest(harness, 1),
		);
		harness.state.failNextSubmission = true;

		await expectAsync(harness.controller.createScatteringCache(
			buildRequest(harness, 2),
		)).toBeRejectedWithError(/manufactured controller submission failure/);

		expect(harness.controller.active).toBe(active);
		expect(harness.state.publishedFields[0].disposeCount).toBe(0);
		expect(harness.state.runtimeBindingCalls).toBe(1);
		expect(harness.state.fields.slice(2).every((field) => field.disposeCount === 1))
			.toBeTrue();

		const replacement = await harness.controller.createScatteringCache(
			buildRequest(harness, 2),
		);
		expect(replacement).not.toBe(active);
		expect(harness.controller.active).toBe(replacement);
	});

	it('supersedes staging B and returns active A when A becomes latest again', async () => {
		const schedulerControl = createSchedulerControl();
		const harness = createHarness({ scheduler: schedulerControl.scheduler });
		const activeA = await harness.controller.createScatteringCache(
			buildRequest(harness, 1),
		);
		const blocked = schedulerControl.blockNextYield();
		const stagingB = harness.controller.createScatteringCache(
			buildRequest(harness, 2),
		);
		await blocked.reached;

		const latestA = harness.controller.createScatteringCache(
			buildRequest(harness, 1),
		);
		expect(harness.controller.active).toBe(activeA);
		blocked.release();

		await expectAbort(stagingB);
		expect(await latestA).toBe(activeA);
		expect(harness.controller.active).toBe(activeA);
		expect(harness.state.runtimeBindingCalls).toBe(1);
	});

	it('preserves active state on caller cancellation and cancels on disposal', async () => {
		const schedulerControl = createSchedulerControl();
		const harness = createHarness({ scheduler: schedulerControl.scheduler });
		const active = await harness.controller.createScatteringCache(
			buildRequest(harness, 1),
		);
		const blocked = schedulerControl.blockNextYield();
		const cancellation = new AbortController();
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
		const disposedStaging = harness.controller.createScatteringCache(
			buildRequest(harness, 2),
		);
		await disposalBlock.reached;
		harness.controller.dispose();
		disposalBlock.release();

		await expectAbort(disposedStaging);
		expect(harness.controller.active).toBeNull();
		expect(harness.state.publishedFields[0].disposeCount).toBe(1);
		expect(harness.state.backendDisposeCalls).toBe(0);
	});

	it('rejects unsupported public semantic values before scheduling work', async () => {
		const harness = createHarness();
		const aborted = new AbortController();
		aborted.abort();
		const incompatibleBasis = new SpectralBasis({
			id: 'controller-spec-incompatible-basis',
			channels: NATIVE_15_SPECTRAL_BASIS.channels,
		});

		await expectAsync(harness.controller.createScatteringCache(
			buildRequest(harness, 3),
		)).toBeRejectedWithError(RangeError, /one of 1, 2, 4/);
		await expectAsync(harness.controller.createScatteringCache({
			...buildRequest(harness, 1),
			groundBoundary: { createCacheModule() {} },
		})).toBeRejectedWithError(TypeError, /boundary and cache-contributor contracts/);
		await expectAsync(harness.controller.createScatteringCache({
			...buildRequest(harness, 1),
			spectralBasis: incompatibleBasis,
		})).toBeRejectedWithError(RangeError, /native-15/);
		await expectAbort(harness.controller.createScatteringCache({
			...buildRequest(harness, 1),
			signal: aborted.signal,
		}));
		expect(harness.state.submissionCount).toBe(0);
	});

	it('fingerprints executable plans and backend capabilities deterministically', () => {
		const atmosphere = createAtmosphere();
		const geometry = createGeometry();
		const source = createSource();
		const createPlan = (overrides = {}) => createDistantSunCacheBuildPlan({
			source: overrides.source ?? source,
			atmosphere: overrides.atmosphere ?? atmosphere,
			geometry: overrides.geometry ?? geometry,
			groundBoundary: overrides.groundBoundary ?? null,
			maximumScatteringOrder: overrides.maximumScatteringOrder ?? 1,
		});
		const capabilities = createBackend(createBackendState()).capabilities;
		const baselinePlan = createPlan();
		const baseline = createDistantSunCacheFingerprint(
			baselinePlan,
			capabilities,
		);

		expect(createDistantSunCacheFingerprint(createPlan(), capabilities))
			.toBe(baseline);
		expect(createDistantSunCacheFingerprint(createPlan({
			source: createSource({ directionToLight: [0, 1, 0] }),
		}), capabilities)).not.toBe(baseline);
		expect(createDistantSunCacheFingerprint(createPlan({
			atmosphere: createAtmosphere('atmosphere-b'),
		}), capabilities)).not.toBe(baseline);
		expect(createDistantSunCacheFingerprint(createPlan({
			geometry: createGeometry('geometry-b'),
		}), capabilities)).not.toBe(baseline);
		expect(createDistantSunCacheFingerprint(createPlan({
			groundBoundary: createGroundBoundary('ground-a', 'a'),
			maximumScatteringOrder: 2,
		}), capabilities)).not.toBe(
			createDistantSunCacheFingerprint(createPlan({
				groundBoundary: createGroundBoundary('ground-b', 'b'),
				maximumScatteringOrder: 2,
			}), capabilities),
		);
		expect(createDistantSunCacheFingerprint(createPlan({
			maximumScatteringOrder: 2,
		}), capabilities)).not.toBe(baseline);
		expect(createDistantSunCacheFingerprint(baselinePlan, {
			...capabilities,
			maximumTextureSize: capabilities.maximumTextureSize / 2,
		})).not.toBe(baseline);
		expect(baselinePlan.identity).not.toEqual(
			baselinePlan.descriptorDefinition.constructionIdentities.source,
		);
	});
});
