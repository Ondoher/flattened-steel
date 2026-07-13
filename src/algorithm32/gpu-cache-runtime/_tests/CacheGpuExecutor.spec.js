import {CacheGpuExecutor} from '../CacheGpuExecutor.js';
import {GpuFieldExecutor} from '../GpuFieldExecutor.js';
import {CacheBuildModules} from '../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CacheValues} from '../CacheValues.js';
import {CUMULATIVE_SCATTERING_CACHE_VALUE_KEY} from '../consts.js';

/** Test field storage constant. */
const TEST_FIELD_STORAGE = {
	format: 'R32F',
	width: 4,
	height: 3,
	layers: 2,
};

/**
 * Called by this module to module for.
 * @param id - The id value accepted by the operation.
 * @param owner - The owner value accepted by the operation.
 * @param symbol - The symbol value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function moduleFor(id, owner, symbol) {
	return CacheBuildModules.createBuildModule({
		id,
		owner,
		provides: [symbol],
		requires: [],
		blocks: [],
		bindings: [],
	});
}

/**
 * Called by this module to create n1 plan.
 * @returns - The result produced by the operation.
 */
function createN1Plan() {
	const primaryScatteringDensity = {
		id: 'j1',
		storage: TEST_FIELD_STORAGE,
	};
	const result = {
		id: 'j-through-1',
		storage: TEST_FIELD_STORAGE,
	};
	const plan = {
		identity: {id: 'plan-pending', contentHash: 'sha256:plan-pending'},
		fields: [primaryScatteringDensity, result],
		passes: [
			{
				id: 'primary-pass',
				kind: 'primary-j1',
				order: 1,
				inputs: [],
				output: primaryScatteringDensity.id,
				modules: [
					CacheBuildModules.createBuildModule({
						id: 'primary-source',
						owner: 'lightSource',
						provides: ['lightSource.primaryJ1'],
						requires: [
							'atmosphere.medium',
							'atmosphere.phase',
							'atmosphere.sourceTransmittance',
							'geometry.cachePosition',
							'geometry.sourceFrame',
							'geometry.sourcePath',
							'cache.outputLayout',
						],
						blocks: [],
						bindings: [],
					}),
					CacheBuildModules.createBuildModule({
						id: 'primary-atmosphere',
						owner: 'atmosphere',
						provides: ['atmosphere.medium', 'atmosphere.phase', 'atmosphere.sourceTransmittance'],
						requires: [],
						blocks: [],
						bindings: [],
					}),
					CacheBuildModules.createBuildModule({
						id: 'primary-geometry',
						owner: 'geometry',
						provides: ['geometry.cachePosition', 'geometry.sourceFrame', 'geometry.sourcePath'],
						requires: [],
						blocks: [],
						bindings: [],
					}),
					moduleFor('primary-cache', 'cache', 'cache.outputLayout'),
				],
			},
			{
				id: 'accumulate-pass',
				kind: 'accumulate',
				order: 1,
				inputs: [primaryScatteringDensity.id],
				output: result.id,
				modules: [
					moduleFor('accumulate-transport', 'transport', 'cache.operation.accumulate'),
					moduleFor('accumulate-cache', 'cache', 'cache.outputLayout'),
				],
			},
		],
		result: result.id,
	};
	plan.identity = CacheValues.createPlanIdentity('plan', plan.fields, plan.passes);
	return plan;
}

/**
 * Called by this module to create assembler.
 * @param state - The state value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createAssembler(state) {
	return {
		/**
		 * Call this method to assemble.
		 * @param pass - The pass value accepted by the operation.
		 * @param output - The output value accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ assemble(pass, output) {
			state.events.push(`assemble:${pass.id}`);
			return {
				id: `shader:${pass.id}`,
				source: `void ${pass.id.replaceAll('-', '_')}() {}`,
				sourceHash: `hash:${pass.id}`,
				bindings: [],
				output,
			};
		},
	};
}

/**
 * Called by this module to create backend.
 * @param state - The state value accepted by the operation.
 * @param options - The optional operation choices.
 * @returns - The result produced by the operation.
 */
function createBackend(state, options = {}) {
	const backend = {
		id: 'executor-spec-backend',
		capabilities: {
			id: 'executor-spec-capabilities',
			api: 'manufactured',
			scalarFormat: 'R32F',
			supportsArrayRenderTargets: true,
			supportsFloatSampling: true,
			maximumTextureSize: 16384,
			maximumArrayLayers: 256,
		},
		/**
		 * Call this method to allocate field.
		 * @param fieldSpecification - The field specification accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ allocateField(fieldSpecification) {
			state.events.push(`allocate:${fieldSpecification.id}`);
			const {id: fieldIdentifier, storage} = fieldSpecification;
			const field = {
				id: fieldIdentifier,
				storage,
				backendId: backend.id,
				disposeCount: 0,
				/** Call this method to dispose. */ dispose() {
					this.disposeCount += 1;
					state.events.push(`dispose-field:${fieldIdentifier}`);
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
			state.events.push(`compile:${shader.id}`);
			const program = {
				id: shader.id,
				sourceHash: shader.sourceHash,
				disposeCount: 0,
				/** Call this method to dispose. */ dispose() {
					this.disposeCount += 1;
					state.events.push(`dispose-program:${shader.id}`);
				},
			};
			state.programs.push(program);
			return program;
		},
		/**
		 * Call this method to submit layer.
		 * @param request - The request accepted by the operation.
		 * @throws {Error} - When the operation cannot complete its caller-observable contract.
		 */ submitLayer(request) {
			state.submissions.push(request);
			state.events.push(`submit:${request.program.id}:${request.layer}`);
			options.onSubmit?.(request);
			if (options.failProgram === request.program.id && request.layer === (options.failLayer ?? 0)) {
				throw new Error('manufactured submission failure');
			}
		},
		/**
		 * Call this method to create runtime binding.
		 * @param request - The field and runtime value accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ createRuntimeBinding(request) {
			state.runtimeBindingCalls += 1;
			state.events.push(`runtime-binding:${request.field.id}`);
			return {
				id: `binding:${request.field.id}`,
				valueKey: request.valueKey,
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
 * Called by this module to create state.
 * @returns - The result produced by the operation.
 */
function createState() {
	return {
		events: [],
		fields: [],
		programs: [],
		submissions: [],
		runtimeBindingCalls: 0,
		backendDisposeCalls: 0,
	};
}

/**
 * Called by this module to create harness.
 * @param options - The optional operation choices.
 * @returns - The result produced by the operation.
 */
function createHarness(options) {
	const state = createState();
	const backend = createBackend(state, options);
	const executor = new CacheGpuExecutor({
		backend,
		assembler: createAssembler(state),
	});
	return {state, backend, executor};
}

/**
 * Called by this module to scalar probe.
 * @param field - The field value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function scalarProbe(field = 'j1') {
	return {
		field,
		coordinates: [
			{
				directionIndex: 0,
				positionIndex: 0,
				wavelengthIndex: 0,
			},
		],
	};
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

describe('CacheGpuExecutor', /** Called by Jasmine to register the named test suite. */ () => {
	it('executes a neutral field graph with the caller-selected runtime value', /**
	 * Called by Jasmine to exercise neutral field execution independently of scattering semantics.
	 */ async () => {
		const state = createState();
		const backend = createBackend(state);
		const executor = new GpuFieldExecutor({
			backend,
			assembler: createAssembler(state),
		});
		const scatteringFixture = createN1Plan();
		const artifact = await executor.execute({
			fields: scatteringFixture.fields,
			passes: scatteringFixture.passes.map(
				/**
				 * Called by Array.prototype.map to retain only neutral execution facts.
				 * @param pass - The scattering fixture pass supplying generic field mechanics.
				 * @returns - The renderer-neutral field pass.
				 */
				(pass) => ({
					id: pass.id,
					inputs: pass.inputs,
					output: pass.output,
					modules: pass.modules,
				}),
			),
			result: scatteringFixture.result,
			valueKey: 'cache.celestial.sunTransport',
		});

		expect(artifact.runtimeBindings.bindings).toEqual([
			{
				id: 'binding:j-through-1',
				valueKey: 'cache.celestial.sunTransport',
				fieldId: 'j-through-1',
				backendId: backend.id,
			},
		]);
		expect(state.submissions.length).toBe(2 * TEST_FIELD_STORAGE.layers);
		artifact.dispose();
		executor.dispose();
	});

	it('executes pass/layer loops, probes producers, and retains only the result', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const {state, backend, executor} = createHarness();
		let schedulerCalls = 0;
		const probeReader = {
			/**
			 * Call this method to read selected scalars. The promise rejects when the operation fails; the operation is not cancellable once started. Callers must discard a rejected result and treat cancellation as an incomplete operation.
			 * @param request - The request accepted by the operation.
			 * @returns - A promise for the completed operation result.
			 */ async readSelectedScalars(request) {
				state.events.push(`probe:${request.field.id}`);
				return {
					fieldId: request.field.id,
					samples: request.coordinates.map(
						/**
						 * Called by Array.prototype.map to transform one collection value.
						 * @param coordinates - The coordinates value accepted by the operation.
						 * @returns - The callback result returned to its caller.
						 */ (coordinates) => ({
							coordinates,
							value: 12.5,
						}),
					),
				};
			},
		};
		const artifact = await executor.execute(createN1Plan(), {
			probeReader,
			probes: [scalarProbe()],
			scheduler: {
				/**
				 * Call this method to yield control. The promise rejects if the scheduler cannot yield; this scheduling operation is not cancellable once started.
				 */ async yieldControl() {
					schedulerCalls += 1;
					state.events.push('yield');
				},
			},
		});

		expect(state.events.slice(0, 2)).toEqual(['assemble:primary-pass', 'assemble:accumulate-pass']);
		expect(state.events[2]).toBe('compile:shader:primary-pass');
		expect(state.submissions.length).toBe(2 * TEST_FIELD_STORAGE.layers);
		expect(
			state.submissions
				.filter(
					/**
					 * Called by Array.prototype.filter to test whether one collection value is retained.
					 * @param submission - The submission value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (submission) => submission.program.id === 'shader:accumulate-pass',
				)
				.every(
					/**
					 * Called by Array.prototype.every to test one collection value against the shared condition.
					 * @param submission - The submission value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (submission) => submission.inputs.length === 1 && submission.inputs[0].id === 'j1',
				),
		).toBeTrue();
		const probeIndex = state.events.indexOf('probe:j1');
		const temporaryDisposeIndex = state.events.indexOf('dispose-field:j1');
		expect(probeIndex).toBeGreaterThan(-1);
		expect(temporaryDisposeIndex).toBeGreaterThan(probeIndex);
		const wavelengthLayerCount = TEST_FIELD_STORAGE.layers;
		expect(schedulerCalls).toBe(2 * (wavelengthLayerCount - 1) + 1);
		expect(
			state.events.slice(
				state.events.indexOf('submit:shader:primary-pass:0'),
				state.events.indexOf('submit:shader:primary-pass:1') + 1,
			),
		).toEqual(['submit:shader:primary-pass:0', 'yield', 'submit:shader:primary-pass:1']);
		expect(
			state.programs.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param program - The program value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (program) => program.disposeCount === 1,
			),
		).toBeTrue();
		expect(state.fields[0].disposeCount).toBe(1);
		expect(state.fields[1].disposeCount).toBe(0);
		expect(state.runtimeBindingCalls).toBe(1);
		expect(artifact.result).toBe(state.fields[1]);
		expect(artifact.runtimeBindings).toEqual({
			backendId: backend.id,
			bindings: [
				{
					id: 'binding:j-through-1',
					valueKey: CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
					fieldId: state.fields[1].id,
					backendId: backend.id,
				},
			],
		});
		expect(artifact.diagnostics.passes.length).toBe(2);
		expect(
			artifact.diagnostics.passes.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param diagnostic - The diagnostic value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (diagnostic) =>
					diagnostic.submissionDuration.units === 'seconds' && diagnostic.submissionDuration.value >= 0,
			),
		).toBeTrue();
		expect(artifact.diagnostics.passes[0].probe.samples[0].value).toBe(12.5);
		const fieldStorage = TEST_FIELD_STORAGE.width * TEST_FIELD_STORAGE.height * TEST_FIELD_STORAGE.layers * 4;
		expect(artifact.diagnostics.memory).toEqual({
			peakFieldStorage: {value: fieldStorage * 2, units: 'bytes'},
			peakPackedDataStorage: {value: 0, units: 'bytes'},
			peakTrackedStorage: {value: fieldStorage * 2, units: 'bytes'},
			residentFieldStorage: {value: fieldStorage, units: 'bytes'},
		});

		artifact.dispose();
		artifact.dispose();
		expect(state.fields[1].disposeCount).toBe(1);
		expect(state.backendDisposeCalls).toBe(0);
	});

	it('enforces probe API bounds before allocation', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const {state, executor} = createHarness();

		await expectAsync(
			executor.execute(createN1Plan(), {
				probes: [scalarProbe()],
			}),
		).toBeRejectedWithError(/require a probe reader/u);
		expect(state.fields.length).toBe(0);

		await expectAsync(
			executor.execute(createN1Plan(), {
				probeReader: {
					/**
					 * Call this method to read selected scalars. The promise rejects when the operation fails; the operation is not cancellable once started. Callers must discard a rejected result and treat cancellation as an incomplete operation.
					 */ async readSelectedScalars() {},
				},
				probes: [
					{
						field: 'j1',
						coordinates: [
							{
								directionIndex: TEST_FIELD_STORAGE.width,
								positionIndex: 0,
								wavelengthIndex: 0,
							},
						],
					},
				],
			}),
		).toBeRejectedWithError(/directionIndex/);
		expect(state.fields.length).toBe(0);
	});

	it('cancels before allocation and between wavelength-layer submissions', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const before = createHarness();
		const preAborted = new AbortController();
		preAborted.abort();
		await expectAbort(
			before.executor.execute(createN1Plan(), {
				signal: preAborted.signal,
			}),
		);
		expect(before.state.fields.length).toBe(0);
		expect(before.state.programs.length).toBe(0);

		const duringAbort = new AbortController();
		const during = createHarness({
			/**
			 * Call this method to on submit.
			 * @param request - The request accepted by the operation.
			 */ onSubmit(request) {
				if (request.program.id === 'shader:primary-pass' && request.layer === 0) {
					duringAbort.abort();
				}
			},
		});
		await expectAbort(
			during.executor.execute(createN1Plan(), {
				signal: duringAbort.signal,
			}),
		);
		expect(during.state.submissions.length).toBe(1);
		expect(
			during.state.fields.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param field - The field value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (field) => field.disposeCount === 1,
			),
		).toBeTrue();
		expect(
			during.state.programs.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param program - The program value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (program) => program.disposeCount === 1,
			),
		).toBeTrue();
	});

	it('checks cancellation after the completed-pass scheduler boundary', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const controller = new AbortController();
		const {state, executor} = createHarness();
		let schedulerCalls = 0;
		const passBoundaryCall = TEST_FIELD_STORAGE.layers;

		await expectAbort(
			executor.execute(createN1Plan(), {
				signal: controller.signal,
				scheduler: {
					/**
					 * Call this method to yield control. The promise rejects if the scheduler cannot yield; this scheduling operation is not cancellable once started.
					 */ async yieldControl() {
						schedulerCalls += 1;
						if (schedulerCalls === passBoundaryCall) {
							controller.abort();
						}
					},
				},
			}),
		);
		expect(schedulerCalls).toBe(passBoundaryCall);
		expect(state.submissions.length).toBe(TEST_FIELD_STORAGE.layers);
		expect(state.programs.length).toBe(1);
		expect(state.programs[0].disposeCount).toBe(1);
		expect(state.fields.length).toBe(1);
		expect(state.fields[0].disposeCount).toBe(1);
	});

	it('checks cancellation after an inter-layer scheduler boundary', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const controller = new AbortController();
		const {state, executor} = createHarness();
		let schedulerCalls = 0;

		await expectAbort(
			executor.execute(createN1Plan(), {
				signal: controller.signal,
				scheduler: {
					/**
					 * Call this method to yield control. The promise rejects if the scheduler cannot yield; this scheduling operation is not cancellable once started.
					 */ async yieldControl() {
						schedulerCalls += 1;
						controller.abort();
					},
				},
			}),
		);
		expect(schedulerCalls).toBe(1);
		expect(state.submissions.length).toBe(1);
		expect(state.programs.length).toBe(1);
		expect(state.programs[0].disposeCount).toBe(1);
		expect(state.fields.length).toBe(1);
		expect(state.fields[0].disposeCount).toBe(1);
	});

	it('cleans every staging resource when a later pass fails', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const {state, executor} = createHarness({
			failProgram: 'shader:accumulate-pass',
			failLayer: 0,
		});

		await expectAsync(executor.execute(createN1Plan())).toBeRejectedWithError(/manufactured submission failure/);
		expect(state.fields.length).toBe(2);
		expect(
			state.fields.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param field - The field value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (field) => field.disposeCount === 1,
			),
		).toBeTrue();
		expect(state.programs.length).toBe(2);
		expect(
			state.programs.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param program - The program value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (program) => program.disposeCount === 1,
			),
		).toBeTrue();
		expect(state.runtimeBindingCalls).toBe(0);
	});

	it('cleans staging resources when a declared probe fails', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const {state, executor} = createHarness();
		await expectAsync(
			executor.execute(createN1Plan(), {
				probes: [scalarProbe()],
				probeReader: {
					/**
					 * Call this method to read selected scalars. The promise rejects when the operation fails; the operation is not cancellable once started. Callers must discard a rejected result and treat cancellation as an incomplete operation.
					 * @throws {Error} - When the operation cannot complete its caller-observable contract.
					 */ async readSelectedScalars() {
						throw new Error('manufactured probe failure');
					},
				},
			}),
		).toBeRejectedWithError(/manufactured probe failure/);
		expect(state.fields.length).toBe(1);
		expect(state.fields[0].disposeCount).toBe(1);
		expect(state.programs.length).toBe(1);
		expect(state.programs[0].disposeCount).toBe(1);
	});

	it('disposes idempotently without taking ownership of the backend', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const {state, executor} = createHarness();
		executor.dispose();
		executor.dispose();

		expect(state.backendDisposeCalls).toBe(0);
		await expectAsync(executor.execute(createN1Plan())).toBeRejectedWithError(/disposed/);
		expect(state.fields.length).toBe(0);
	});
});
