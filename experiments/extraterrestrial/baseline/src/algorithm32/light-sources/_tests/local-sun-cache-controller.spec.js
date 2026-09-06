import { CanonicalAtmosphere } from
	'../../atmospheres/CanonicalAtmosphere.js';
import {
	CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
} from '../../caches/gpu/cacheRuntimeContracts.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
} from '../../constants/Algorithm32CanonicalData.js';
import { FlatEarthGeometry } from
	'../../geometries/FlatEarthGeometry.js';
import {
	UniformLambertianGroundBoundary,
} from '../../ground-boundaries/index.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../profiles/native-15-profile.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralPacket,
} from '../../quantities/index.js';
import { LocalSunLightSource } from '../LocalSunLightSource.js';

describe('LocalSunCacheController Stage 9.6 lifecycle', () => {
	it('publishes, reuses, replaces, and preserves complete N1 caches', async () => {
		const state = createBackendState();
		const backend = createBackend(state);
		const source = createSource();
		const controller = source.createCacheController({ backend });
		const atmosphere = createAtmosphere();
		const firstRequest = buildRequest(
			atmosphere,
			createGeometry({ topAltitude: 100_000 }),
		);
		const first = await controller.createScatteringCache(firstRequest);
		const firstSubmissionCount = state.submissionCount;

		expect(controller.active).toBe(first);
		expect(first.descriptor.field.order).toEqual({
			kind: 'cumulative-through',
			value: 1,
			included: [1],
		});
		expect(first.getRuntimeBindings().bindings[0].valueKey)
			.toBe(CUMULATIVE_SCATTERING_CACHE_VALUE_KEY);
		expect(first.resources.sourceFacts).toEqual({
			boundaries: {
				value: 16_392,
				units: 'bytes',
			},
			heldIncidentScales: {
				value: 16_384,
				units: 'bytes',
			},
			total: {
				value: 32_776,
				units: 'bytes',
			},
		});
		expect(first.resources.boundaryTexture).toEqual({
			value: 8_196,
			units: 'bytes',
		});
		expect(first.resources.packedTransportData).toEqual({
			value: 0,
			units: 'bytes',
		});
		expect(first.resources.executor.residentFieldStorage)
			.toEqual({
				value: 74_795_400,
				units: 'bytes',
			});
		expect(first.resources.executor.peakFieldStorage)
			.toEqual({
				value: 149_590_800,
				units: 'bytes',
			});

		const reused = await controller.createScatteringCache(firstRequest);
		expect(reused).toBe(first);
		expect(state.submissionCount).toBe(firstSubmissionCount);

		const replacement = await controller.createScatteringCache(
			buildRequest(
				atmosphere,
				createGeometry({ topAltitude: 90_000 }),
			),
		);
		expect(replacement).not.toBe(first);
		expect(controller.active).toBe(replacement);
		expect(() => first.getRuntimeBindings())
			.toThrowError(/disposed/u);

		state.failNextSubmission = true;
		await expectAsync(controller.createScatteringCache(buildRequest(
			atmosphere,
			createGeometry({ topAltitude: 80_000 }),
		))).toBeRejectedWithError(/manufactured local cache failure/u);
		expect(controller.active).toBe(replacement);
		expect(replacement.getRuntimeBindings().bindings.length).toBe(1);

		controller.dispose();
		expect(() => replacement.getRuntimeBindings())
			.toThrowError(/disposed/u);
		expect(state.backendDisposeCalls).toBe(0);
	});

	it('rejects unsupported geometry and source pairings before submission', async () => {
		const state = createBackendState();
		const source = createSource();
		const controller = source.createCacheController({
			backend: createBackend(state),
		});

		await expectAsync(controller.createScatteringCache({
			atmosphere: createAtmosphere(),
			geometry: /** @type {any} */ ({
				configuration: {
					sourcePosition: {
						coordinates: [4_800_000, 0, 4_800_000],
						units: 'meters',
					},
				},
			}),
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			maximumScatteringOrder: 1,
		})).toBeRejected();
		expect(state.submissionCount).toBe(0);

		await expectAsync(controller.createScatteringCache(buildRequest(
			createAtmosphere(),
			createGeometry({
				topAltitude: 100_000,
				sourcePositionCoordinates:
					[4_799_999, 0, 4_800_000],
			}),
		))).toBeRejectedWithError(/source-owned position exactly/u);
		expect(state.submissionCount).toBe(0);

		controller.dispose();
	});

	it('ignores camera/display state and rebuilds atmosphere, ground, order, or geometry', async () => {
		const state = createBackendState();
		const source = createSource();
		const controller = source.createCacheController({
			backend: createBackend(state),
		});
		const baselineAtmosphere = createAtmosphere();
		const baseline = await controller.createScatteringCache(
			buildRequest(
				baselineAtmosphere,
				createGeometry({
					topAltitude: 100_000,
					sceneSkyRayLimit: 2_000_000,
				}),
			),
		);
		const baselineSubmissions = state.submissionCount;
		const viewOnly = await controller.createScatteringCache(
			buildRequest(
				baselineAtmosphere,
				createGeometry({
					topAltitude: 100_000,
					observerPositionCoordinates:
						[500, -250, 100],
					sceneSkyRayLimit: 3_000_000,
				}),
			),
		);

		expect(viewOnly).toBe(baseline);
		expect(state.submissionCount).toBe(baselineSubmissions);

		const atmosphereReplacement =
			await controller.createScatteringCache(
				buildRequest(
					createAtmosphere({
						rayleighScaleHeight: 8_100,
					}),
					createGeometry({
						topAltitude: 100_000,
					}),
				),
			);
		expect(atmosphereReplacement).not.toBe(baseline);

		const groundReplacement =
			await controller.createScatteringCache(
				buildRequest(
					createAtmosphere({
						rayleighScaleHeight: 8_100,
					}),
					createGeometry({
						topAltitude: 100_000,
					}),
					createReflectiveGround(),
				),
			);
		expect(groundReplacement)
			.not.toBe(atmosphereReplacement);

		const orderReplacement =
			await controller.createScatteringCache({
				...buildRequest(
					createAtmosphere({
						rayleighScaleHeight: 8_100,
					}),
					createGeometry({
						topAltitude: 100_000,
					}),
					createReflectiveGround(),
				),
				maximumScatteringOrder: 2,
			});
		expect(orderReplacement).not.toBe(groundReplacement);

		controller.dispose();
	});

	it('cancels a superseded generation and publishes only the latest complete cache', async () => {
		const state = createBackendState();
		const source = createSource();
		const controlled = createControlledScheduler();
		const controller = source.createCacheController({
			backend: createBackend(state),
			scheduler: controlled.scheduler,
		});
		const atmosphere = createAtmosphere();

		controlled.holdNext();
		const firstPromise = controller.createScatteringCache(
			buildRequest(
				atmosphere,
				createGeometry({ topAltitude: 100_000 }),
			),
		);
		const firstExpectation = expectAsync(firstPromise)
			.toBeRejectedWith(
				jasmine.objectContaining({
					name: 'AbortError',
				}),
			);
		await controlled.waitForYield();

		const secondPromise = controller.createScatteringCache(
			buildRequest(
				atmosphere,
				createGeometry({ topAltitude: 90_000 }),
			),
		);
		controlled.release();
		await firstExpectation;
		expect(controller.active).toBeNull();

		const second = await secondPromise;

		expect(controller.active).toBe(second);
		expect(second.descriptor.field.order.value).toBe(1);
		expect(second.getRuntimeBindings().bindings.length).toBe(1);
		expect(
			state.fields.filter(
				(field) => field.disposeCount > 0,
			).length,
		).toBeGreaterThan(0);

		controller.dispose();
		expect(() => second.getRuntimeBindings())
			.toThrowError(/disposed/u);
		expect(state.backendDisposeCalls).toBe(0);
	});

	it('preserves the last cache when caller cancellation interrupts a rebuild', async () => {
		const state = createBackendState();
		const source = createSource();
		const controlled = createControlledScheduler();
		const controller = source.createCacheController({
			backend: createBackend(state),
			scheduler: controlled.scheduler,
		});
		const atmosphere = createAtmosphere();
		const baseline = await controller.createScatteringCache(
			buildRequest(
				atmosphere,
				createGeometry({
					topAltitude: 100_000,
				}),
			),
		);
		const cancellation = new AbortController();

		controlled.holdNext();
		const cancelledPromise =
			controller.createScatteringCache({
				...buildRequest(
					atmosphere,
					createGeometry({
						topAltitude: 90_000,
					}),
				),
				signal: cancellation.signal,
			});
		const cancelledExpectation =
			expectAsync(cancelledPromise)
				.toBeRejectedWith(
					jasmine.objectContaining({
						name: 'AbortError',
					}),
				);

		await controlled.waitForYield();
		cancellation.abort();
		controlled.release();
		await cancelledExpectation;

		expect(controller.active).toBe(baseline);
		expect(
			baseline.getRuntimeBindings().bindings[0]
				.valueKey,
		).toBe(CUMULATIVE_SCATTERING_CACHE_VALUE_KEY);

		controller.dispose();
		expect(() => baseline.getRuntimeBindings())
			.toThrowError(/disposed/u);
		expect(state.backendDisposeCalls).toBe(0);
	});
});

function createSource() {
	return new LocalSunLightSource({
		sourceKey: 'local-sun-controller-test',
		position: {
			coordinates: [4_800_000, 0, 4_800_000],
			units: 'meters',
		},
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		referenceDistance: {
			value: 4_800_000,
			units: 'meters',
		},
		referenceSpectralIncidentScale: 1,
		radius: {
			value: 25_749.504,
			units: 'meters',
		},
		distanceFalloff: true,
		sourceTransmittanceIntervalCount: 15,
	});
}

function createAtmosphere({
	rayleighScaleHeight = 8_000,
} = {}) {
	const constants = /** @type {CanonicalAtmosphereConstants} */ ({
		...CANONICAL_ATMOSPHERE_CONSTANTS,
		rayleighScaleHeight: {
			value: rayleighScaleHeight,
			units: 'meters',
		},
	});

	return new CanonicalAtmosphere({
		constants,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
}

function createGeometry({
	topAltitude,
	observerPositionCoordinates = [0, 0, 5],
	sourcePositionCoordinates = [4_800_000, 0, 4_800_000],
	sceneSkyRayLimit = null,
}) {
	return new FlatEarthGeometry({
		observerPosition: {
			coordinates: observerPositionCoordinates,
			units: 'meters',
		},
		sourcePosition: {
			coordinates: sourcePositionCoordinates,
			units: 'meters',
		},
		topAltitude: {
			value: topAltitude,
			units: 'meters',
		},
		cacheRadialMaximum: {
			value: 4_800_000,
			units: 'meters',
		},
		sceneSkyRayLimit: sceneSkyRayLimit === null
			? null
			: {
				value: sceneSkyRayLimit,
				units: 'meters',
			},
	});
}

function buildRequest(atmosphere, geometry, groundBoundary = null) {
	return {
		atmosphere,
		geometry,
		groundBoundary,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		maximumScatteringOrder: 1,
	};
}

function createReflectiveGround() {
	const albedo = createSpectralPacket({
		quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
		units: SPECTRAL_UNITS.DIMENSIONLESS,
		basis: NATIVE_15_SPECTRAL_BASIS,
		values: Array(15).fill(0.25),
		provenanceIdentity:
			'local-sun-controller-test-ground',
	});

	return new UniformLambertianGroundBoundary({ albedo });
}

function createControlledScheduler() {
	/** @type {(() => void) | null} */
	let release = null;
	/** @type {(() => void) | null} */
	let waiter = null;
	let hold = false;

	return {
		scheduler: {
			yieldControl() {
				if (!hold) {
					return Promise.resolve();
				}
				hold = false;
				return new Promise((resolve) => {
					release = resolve;
					waiter?.();
					waiter = null;
				});
			},
		},
		holdNext() {
			if (hold || release !== null) {
				throw new Error(
					'The controlled scheduler already has a pending hold.',
				);
			}
			hold = true;
		},
		waitForYield() {
			if (release !== null) {
				return Promise.resolve();
			}

			return new Promise((resolve) => {
				waiter = resolve;
			});
		},
		release() {
			if (release === null) {
				throw new Error(
					'No controlled cache-build yield is pending.',
				);
			}
			const current = release;
			release = null;
			current();
		},
	};
}

function createBackendState() {
	return {
		fields: [],
		submissionCount: 0,
		runtimeBindingCount: 0,
		backendDisposeCalls: 0,
		failNextSubmission: false,
	};
}

function createBackend(state) {
	const backend = {
		id: 'local-sun-controller-test-backend',
		capabilities: {
			id: 'local-sun-controller-test-capabilities',
			api: 'manufactured',
			scalarFormat: 'R32F',
			supportsArrayRenderTargets: true,
			supportsFloatSampling: true,
			maximumTextureSize: 16_384,
			maximumArrayLayers: 256,
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
			return {
				id: shader.id,
				sourceHash: shader.sourceHash,
				dispose() {},
			};
		},
		submitLayer() {
			state.submissionCount += 1;
			if (state.failNextSubmission) {
				state.failNextSubmission = false;
				throw new Error(
					'manufactured local cache failure',
				);
			}
		},
		createRuntimeBinding(field) {
			state.runtimeBindingCount += 1;
			return {
				id: `local-sun-controller-binding-${
					state.runtimeBindingCount
				}`,
				valueKey:
					CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
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
