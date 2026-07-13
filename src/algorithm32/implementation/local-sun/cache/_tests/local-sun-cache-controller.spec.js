import {
	CanonicalAtmosphere,
	FlatEarthGeometry,
	UniformLambertianGroundBoundary,
} from '../../../../implementation/index.js';
import {CUMULATIVE_SCATTERING_CACHE_VALUE_KEY} from '../../../../gpu-cache-runtime/consts.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../../implementation/canonical-atmosphere/consts.js';
import {
	createNativeExecutionProfile,
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../../../../profiles/native-15/native-15-profile.js';
import {LocalSunLightSource} from '../../LocalSunLightSource.js';
import LocalSunConstructionDomainSelection from '../LocalSunConstructionDomainSelection.js';

describe('LocalSunCacheController Stage 9.6 lifecycle', /** Called by Jasmine to register the named test suite. */ () => {
	it('publishes, reuses, replaces, and preserves complete N1 caches', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const state = createBackendState();
		const backend = createBackend(state);
		const source = createSource();
		const atmosphere = createAtmosphere();
		const geometry = createGeometry({topAltitude: 100_000});
		const model = createModel(source, atmosphere, geometry);
		const controller = source.createCacheController({model, backend});
		const first = await controller.createScatteringCache({});
		const firstSubmissionCount = state.submissionCount;

		expect(controller.active).toBe(first);
		expect(first.getRuntimeBindings().bindings[0].fieldId).toBe('local-sun-j-through-1');
		expect(first.getRuntimeBindings().bindings[0].valueKey).toBe(CUMULATIVE_SCATTERING_CACHE_VALUE_KEY);
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
		expect(first.resources.executor.residentFieldStorage).toEqual({
			value: 74_795_400,
			units: 'bytes',
		});
		expect(first.resources.executor.peakFieldStorage).toEqual({
			value: 149_590_800,
			units: 'bytes',
		});

		const reused = await controller.createScatteringCache({});
		expect(reused).toBe(first);
		expect(state.submissionCount).toBe(firstSubmissionCount);

		backend.capabilities.maximumTextureSize -= 1;
		const capabilityReplacement = await controller.createScatteringCache({});
		expect(capabilityReplacement).not.toBe(first);
		expect(state.submissionCount).toBeGreaterThan(firstSubmissionCount);

		expect(controller.active).toBe(capabilityReplacement);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => first.getRuntimeBindings(),
		).toThrowError(/disposed/u);

		state.failNextSubmission = true;
		backend.capabilities.maximumTextureSize -= 1;
		await expectAsync(controller.createScatteringCache({})).toBeRejectedWithError(
			/manufactured local cache failure/u,
		);
		expect(controller.active).toBe(capabilityReplacement);
		expect(capabilityReplacement.getRuntimeBindings().bindings.length).toBe(1);

		controller.dispose();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => capabilityReplacement.getRuntimeBindings(),
		).toThrowError(/disposed/u);
		expect(state.backendDisposeCalls).toBe(0);
	});

	it('rejects unsupported geometry and source pairings before submission', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const state = createBackendState();
		const source = createSource();
		const atmosphere = createAtmosphere();
		const geometry = createGeometry({
			topAltitude: 100_000,
			projectionRadius: 47_999_990,
		});
		const model = createModel(source, atmosphere, geometry);
		const controller = source.createCacheController({
			model,
			backend: createBackend(state),
		});

		await expectAsync(controller.createScatteringCache({})).toBeRejectedWithError(/source-owned position exactly/u);
		expect(state.submissionCount).toBe(0);

		controller.dispose();
	});

	it('binds cache reuse to one immutable aggregate model per controller', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const state = createBackendState();
		const source = createSource();
		const backend = createBackend(state);
		const baselineAtmosphere = createAtmosphere();
		const baselineGeometry = createGeometry({topAltitude: 100_000, sceneSkyRayLimit: 2_000_000});
		const baselineModel = createModel(source, baselineAtmosphere, baselineGeometry);
		const controller = source.createCacheController({model: baselineModel, backend});
		const baseline = await controller.createScatteringCache({});
		const baselineSubmissions = state.submissionCount;
		const reused = await controller.createScatteringCache({});

		expect(reused).toBe(baseline);
		expect(state.submissionCount).toBe(baselineSubmissions);

		const replacementModel = createModel(
			source,
			createAtmosphere({rayleighScaleHeight: 8_100}),
			createGeometry({topAltitude: 100_000}),
			createReflectiveGround(),
			2,
		);
		const replacementController = source.createCacheController({model: replacementModel, backend});
		const replacement = await replacementController.createScatteringCache({});
		expect(replacement).not.toBe(baseline);

		controller.dispose();
		replacementController.dispose();
	});

	it('preserves the published cache when either fused N4 pass fails', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const state = createBackendState();
		const backend = createBackend(state);
		const source = createSource();
		const atmosphere = createAtmosphere();
		const geometry = createGeometry({topAltitude: 100_000});
		const model = createModel(source, atmosphere, geometry, null, 4);
		const controller = source.createCacheController({model, backend});
		const baseline = await controller.createScatteringCache({});
		const baselineField = state.fields.find(
			/**
			 * Called by Array.prototype.find to select the published baseline field.
			 * @param field - The manufactured cache field.
			 * @returns - Whether the field is the published N1 result.
			 */ (field) => field.id === 'local-sun-j-through-4' && field.disposeCount === 0,
		);
		const failureCases = [
			{kind: 'compile', outputId: 'local-sun-l2'},
			{kind: 'compile', outputId: 'local-sun-l3'},
			{kind: 'submission', outputId: 'local-sun-l2'},
			{kind: 'submission', outputId: 'local-sun-l3'},
		];

		for (const failureCase of failureCases) {
			const fieldStartIndex = state.fields.length;
			const programStartIndex = state.programs.length;
			if (failureCase.kind === 'compile') {
				state.failCompileOutputId = failureCase.outputId;
			} else {
				state.failSubmissionOutputId = failureCase.outputId;
			}
			backend.capabilities.maximumTextureSize -= 1;

			await expectAsync(controller.createScatteringCache({})).toBeRejectedWithError(
				new RegExp(`manufactured ${failureCase.kind} failure for ${failureCase.outputId}`, 'u'),
			);

			const candidateFields = state.fields.slice(fieldStartIndex);
			const candidatePrograms = state.programs.slice(programStartIndex);
			expect(controller.active).toBe(baseline);
			expect(baseline.getRuntimeBindings().bindings[0].fieldId).toBe('local-sun-j-through-4');
			expect(baselineField.disposeCount).toBe(0);
			expect(candidateFields.length).toBeGreaterThan(0);
			expect(
				candidateFields.every(
					/**
					 * Called by Array.prototype.every to verify candidate field disposal.
					 * @param field - The manufactured cache field.
					 * @returns - Whether the field was disposed exactly once.
					 */ (field) => field.disposeCount === 1,
				),
			).toBeTrue();
			expect(candidatePrograms.length).toBeGreaterThan(0);
			expect(
				candidatePrograms.every(
					/**
					 * Called by Array.prototype.every to verify candidate program disposal.
					 * @param program - The manufactured cache program.
					 * @returns - Whether the program was disposed exactly once.
					 */ (program) => program.disposeCount === 1,
				),
			).toBeTrue();
		}

		controller.dispose();
		expect(baselineField.disposeCount).toBe(1);
		expect(state.backendDisposeCalls).toBe(0);
	});

	it('cancels a superseded generation and publishes only the latest complete cache', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const state = createBackendState();
		const source = createSource();
		const controlled = createControlledScheduler();
		const atmosphere = createAtmosphere();
		const geometry = createGeometry({topAltitude: 100_000});
		const model = createModel(source, atmosphere, geometry);
		const controller = source.createCacheController({
			model,
			backend: createBackend(state),
			scheduler: controlled.scheduler,
		});

		controlled.holdNext();
		const firstPromise = controller.createScatteringCache({});
		const firstExpectation = expectAsync(firstPromise).toBeRejectedWith(
			jasmine.objectContaining({
				name: 'AbortError',
			}),
		);
		await controlled.waitForYield();

		const secondPromise = controller.createScatteringCache({});
		controlled.release();
		await firstExpectation;
		expect(controller.active).toBeNull();

		const second = await secondPromise;

		expect(controller.active).toBe(second);
		expect(second.getRuntimeBindings().bindings[0].fieldId).toBe('local-sun-j-through-1');
		expect(second.getRuntimeBindings().bindings.length).toBe(1);
		expect(
			state.fields.filter(
				/**
				 * Called by Array.prototype.filter to test whether one collection value is retained.
				 * @param field - The field value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (field) => field.disposeCount > 0,
			).length,
		).toBeGreaterThan(0);

		controller.dispose();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => second.getRuntimeBindings(),
		).toThrowError(/disposed/u);
		expect(state.backendDisposeCalls).toBe(0);
	});

	it('preserves the last cache when caller cancellation interrupts a rebuild', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const state = createBackendState();
		const source = createSource();
		const controlled = createControlledScheduler();
		const atmosphere = createAtmosphere();
		const geometry = createGeometry({topAltitude: 100_000});
		const model = createModel(source, atmosphere, geometry);
		const backend = createBackend(state);
		const controller = source.createCacheController({
			model,
			backend,
			scheduler: controlled.scheduler,
		});
		const baseline = await controller.createScatteringCache({});
		const cancellation = new AbortController();

		backend.capabilities.maximumTextureSize -= 1;
		controlled.holdNext();
		const cancelledPromise = controller.createScatteringCache({
			signal: cancellation.signal,
		});
		const cancelledExpectation = expectAsync(cancelledPromise).toBeRejectedWith(
			jasmine.objectContaining({
				name: 'AbortError',
			}),
		);

		await controlled.waitForYield();
		cancellation.abort();
		controlled.release();
		await cancelledExpectation;

		expect(controller.active).toBe(baseline);
		expect(baseline.getRuntimeBindings().bindings[0].valueKey).toBe(CUMULATIVE_SCATTERING_CACHE_VALUE_KEY);

		controller.dispose();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => baseline.getRuntimeBindings(),
		).toThrowError(/disposed/u);
		expect(state.backendDisposeCalls).toBe(0);
	});
});

/**
 * Called by this module to create source.
 * @returns - The result produced by the operation.
 */
function createSource() {
	const position = {
		coordinates: [4_800_000, 0, 4_800_000],
		units: 'meters',
	};
	const source = new LocalSunLightSource({
		sourceKey: 'local-sun-controller-test',
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
	source.configureGeometryPlacement({kind: 'finite-position', position});

	return source;
}

/**
 * Called by this module to create atmosphere.
 * @param input1 - The destructured input accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createAtmosphere({rayleighScaleHeight = 8_000} = {}) {
	const constants = /** @type {CanonicalAtmosphereConstants} */ ({
		...CANONICAL_ATMOSPHERE_CONSTANTS,
		rayleighScaleHeight: {
			value: rayleighScaleHeight,
			units: 'meters',
		},
	});

	return new CanonicalAtmosphere({
		constants,
	});
}

/**
 * Called by this module to create geometry. Conditional result values are selected from the accepted input and current state.
 * @param input1 - The destructured input accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createGeometry({
	topAltitude,
	observerPositionCoordinates = [0, 0, 5],
	projectionRadius = 48_000_000,
	sceneSkyRayLimit = null,
}) {
	const geometry = new FlatEarthGeometry({
		observerPosition: {
			coordinates: observerPositionCoordinates,
			units: 'meters',
		},
		topAltitude: {
			value: topAltitude,
			units: 'meters',
		},
		localLightSourceHeight: {value: 4_800_000, units: 'meters'},
		projectionRadius: {value: projectionRadius, units: 'meters'},
		sceneSkyRayLimit:
			sceneSkyRayLimit === null
				? null
				: {
						value: sceneSkyRayLimit,
						units: 'meters',
					},
	});
	geometry.configureLightSource({
		lightSource: {
			geometryPlacementKind: 'finite-position',
			configureGeometryPlacement() {},
		},
		observation: createObservation(),
	});

	return geometry;
}

/** Create the fixed observation that resolves the test source center. */
function createObservation() {
	return {
		instant: '2026-03-20T12:00:00.000Z',
		location: {
			latitude: {value: -0.27940210679735955, units: 'degrees'},
			longitude: {value: -1.5903827852862762, units: 'degrees'},
		},
	};
}

/**
 * Called by this module to build request.
 * @param atmosphere - The atmosphere value accepted by the operation.
 * @param geometry - The geometry value accepted by the operation.
 * @param groundBoundary - The ground boundary value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function buildRequest(atmosphere, geometry, groundBoundary = null) {
	return {atmosphere, geometry, groundBoundary};
}

/**
 * Called by this module to create one immutable aggregate model for a controller lifetime.
 * @param source - The configured local source.
 * @param atmosphere - The atmosphere model.
 * @param geometry - The flat geometry model.
 * @param groundBoundary - The optional ground boundary.
 * @param maximumScatteringOrder - The selected cumulative order.
 * @returns - The aggregate model double.
 */
function createModel(source, atmosphere, geometry, groundBoundary = null, maximumScatteringOrder = 1) {
	const domains = LocalSunConstructionDomainSelection.fromGeometry(geometry);
	return /** @type {SharedModel} */ (
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
				observation: createObservation(),
				domains: {
					positions: domains.positionDomain,
					incomingDirections: domains.incomingDirectionDomain,
					outgoingDirections: domains.outgoingDirectionDomain,
				},
				execution: {maximumScatteringOrder},
			}),
		})
	);
}

/**
 * Called by this module to create reflective ground.
 * @returns - The result produced by the operation.
 */
function createReflectiveGround() {
	return new UniformLambertianGroundBoundary({material: 'grass'});
}

/**
 * Called by this module to create controlled scheduler.
 * @returns - The result produced by the operation.
 */
function createControlledScheduler() {
	/** @type {(() => void) | null} */
	let release = null;
	/** @type {(() => void) | null} */
	let waiter = null;
	let hold = false;

	return {
		scheduler: {
			/**
			 * Call this method to yield control. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
			 * @returns - The result produced by the operation.
			 */ yieldControl() {
				if (!hold) {
					return Promise.resolve();
				}
				hold = false;
				return new Promise(
					/**
					 * Called by yield control to handle one invocation of the declared operation.
					 * @param resolve - The resolve value accepted by the operation.
					 */ (resolve) => {
						release = resolve;
						waiter?.();
						waiter = null;
					},
				);
			},
		},
		/**
		 * Call this method to hold next.
		 * @throws {Error} - When the operation cannot complete its caller-observable contract.
		 */ holdNext() {
			if (hold || release !== null) {
				throw new Error('The controlled scheduler already has a pending hold.');
			}
			hold = true;
		},
		/**
		 * Call this method to wait for yield. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
		 * @returns - The result produced by the operation.
		 */ waitForYield() {
			if (release !== null) {
				return Promise.resolve();
			}

			return new Promise(
				/**
				 * Called by wait for yield to handle one invocation of the declared operation.
				 * @param resolve - The resolve value accepted by the operation.
				 */ (resolve) => {
					waiter = resolve;
				},
			);
		},
		/**
		 * Call this method to release.
		 * @throws {Error} - When the operation cannot complete its caller-observable contract.
		 */ release() {
			if (release === null) {
				throw new Error('No controlled cache-build yield is pending.');
			}
			const current = release;
			release = null;
			current();
		},
	};
}

/**
 * Called by this module to create backend state.
 * @returns - The result produced by the operation.
 */
function createBackendState() {
	return {
		fields: [],
		programs: [],
		submissionCount: 0,
		runtimeBindingCount: 0,
		backendDisposeCalls: 0,
		failCompileOutputId: null,
		failSubmissionOutputId: null,
		failNextSubmission: false,
	};
}

/**
 * Called by this module to create backend.
 * @param state - The state value accepted by the operation.
 * @returns - The result produced by the operation.
 */
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
			if (state.failCompileOutputId === shader.output.id) {
				state.failCompileOutputId = null;
				throw new Error(`manufactured compile failure for ${shader.output.id}`);
			}
			const program = {
				id: shader.id,
				sourceHash: shader.sourceHash,
				outputId: shader.output.id,
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
		 * @param request - The layer submission request.
		 * @throws {Error} - When the operation cannot complete its caller-observable contract.
		 */ submitLayer(request) {
			state.submissionCount += 1;
			if (state.failSubmissionOutputId === request.output.id && request.layer === 0) {
				const outputId = state.failSubmissionOutputId;
				state.failSubmissionOutputId = null;
				throw new Error(`manufactured submission failure for ${outputId}`);
			}
			if (state.failNextSubmission) {
				state.failNextSubmission = false;
				throw new Error('manufactured local cache failure');
			}
		},
		/**
		 * Call this method to create runtime binding.
		 * @param request - The field and runtime value accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ createRuntimeBinding(request) {
			state.runtimeBindingCount += 1;
			return {
				id: `local-sun-controller-binding-${state.runtimeBindingCount}`,
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
