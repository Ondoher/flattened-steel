import {
	createCacheConstructionControlsDescriptor,
} from '../../CacheConstructionControlsDescriptor.js';
import {
	DIRECTIONAL_FIELD_QUANTITIES,
	DIRECTIONAL_FIELD_UNITS,
	DIRECTION_DOMAIN_ROLES,
	createDirectionalSpectralFieldDescriptor,
} from '../../DirectionalSpectralFieldDescriptor.js';
import {
	DEFAULT_SCATTERING_DENSITY_LAYOUT,
} from '../../SelectedCacheContract.js';
import {
	BLACK_GROUND_BOUNDARY_IDENTITY,
} from '../../ScatteringCacheDescriptor.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	FIBONACCI_34_DIRECTION_DOMAIN,
	NATIVE_48_POSITION_DOMAIN,
} from '../../../domains/index.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../../../profiles/native-15-profile.js';
import { CacheGpuExecutor } from '../CacheGpuExecutor.js';
import {
	createCacheBuildModule,
	createCacheOwnerIdentity,
	createCachePlanIdentity,
} from '../cacheBuildContracts.js';
import {
	CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
} from '../cacheRuntimeContracts.js';

const TEST_FIELD_STORAGE = {
	format: 'R32F',
	width: DEFAULT_SCATTERING_DENSITY_LAYOUT.shape.direction,
	height: DEFAULT_SCATTERING_DENSITY_LAYOUT.shape.position,
	layers: DEFAULT_SCATTERING_DENSITY_LAYOUT.shape.wavelength,
};

function createScatteringDescriptor(id, order) {
	return createDirectionalSpectralFieldDescriptor({
		id,
		quantity: DIRECTIONAL_FIELD_QUANTITIES.SCATTERING_DENSITY,
		units: DIRECTIONAL_FIELD_UNITS.SCATTERING_DENSITY,
		directionRole: DIRECTION_DOMAIN_ROLES.OUTGOING_SCATTERING_DENSITY,
		basis: NATIVE_15_SPECTRAL_BASIS,
		positionDomain: NATIVE_48_POSITION_DOMAIN,
		directionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN,
		precision: 'binary32',
		layout: DEFAULT_SCATTERING_DENSITY_LAYOUT,
		order,
		provenanceIdentity: 'cache-gpu-executor-spec',
	});
}

function moduleFor(id, owner, symbol) {
	return createCacheBuildModule({
		id,
		owner,
		provides: [symbol],
		requires: [],
		blocks: [],
		bindings: [],
	});
}

function identity(id) {
	return { id, contentHash: `sha256:${id}` };
}

function createN1Plan() {
	const controls = createCacheConstructionControlsDescriptor({
		id: 'executor-spec-controls',
		transportIntervalCount: 15,
		maximumScatteringOrder: 1,
	});
	const j1 = {
		id: 'j1',
		storage: TEST_FIELD_STORAGE,
		descriptor: createScatteringDescriptor(
			'executor-spec-j1',
			{ kind: 'pure', value: 1 },
		),
	};
	const result = {
		id: 'j-through-1',
		storage: TEST_FIELD_STORAGE,
		descriptor: createScatteringDescriptor(
			'executor-spec-j-through-1',
			{ kind: 'cumulative-through', value: 1 },
		),
	};
	const plan = {
		identity: identity('plan-pending'),
		descriptorDefinition: {
			id: 'executor-spec-cache',
			field: result.descriptor,
			incomingDirectionDomain: FIBONACCI_34_DIRECTION_DOMAIN,
			controls,
			constructionIdentities: {
				source: identity('source'),
				atmosphere: identity('atmosphere'),
				geometry: identity('geometry'),
				boundary: BLACK_GROUND_BOUNDARY_IDENTITY,
			},
		},
		fields: [j1, result],
		passes: [
			{
				id: 'primary-pass',
				kind: 'primary-j1',
				order: 1,
				inputs: [],
				output: j1.id,
				modules: [
					createCacheBuildModule({
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
					createCacheBuildModule({
						id: 'primary-atmosphere',
						owner: 'atmosphere',
						provides: [
							'atmosphere.medium',
							'atmosphere.phase',
							'atmosphere.sourceTransmittance',
						],
						requires: [],
						blocks: [],
						bindings: [],
					}),
					createCacheBuildModule({
						id: 'primary-geometry',
						owner: 'geometry',
						provides: [
							'geometry.cachePosition',
							'geometry.sourceFrame',
							'geometry.sourcePath',
						],
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
				inputs: [j1.id],
				output: result.id,
				modules: [
					moduleFor('accumulate-transport', 'transport', 'cache.operation.accumulate'),
					moduleFor('accumulate-cache', 'cache', 'cache.outputLayout'),
				],
			},
		],
		result: result.id,
	};
	plan.identity = createCachePlanIdentity(
		'plan',
		plan.fields,
		plan.passes,
	);
	for (const owner of /** @type {const} */ (['atmosphere', 'geometry'])) {
		plan.descriptorDefinition.constructionIdentities[owner] = createCacheOwnerIdentity(
			owner,
			owner,
			plan.passes,
		);
	}
	return plan;
}

function createAssembler(state) {
	return {
		assemble(pass, output) {
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
		allocateField(spec) {
			state.events.push(`allocate:${spec.id}`);
			const { descriptor, storage } = spec;
			const field = {
				descriptor,
				storage,
				backendId: backend.id,
				disposeCount: 0,
				dispose() {
					this.disposeCount += 1;
					state.events.push(`dispose-field:${descriptor.id}`);
				},
			};
			state.fields.push(field);
			return field;
		},
		compile(shader) {
			state.events.push(`compile:${shader.id}`);
			const program = {
				id: shader.id,
				sourceHash: shader.sourceHash,
				disposeCount: 0,
				dispose() {
					this.disposeCount += 1;
					state.events.push(`dispose-program:${shader.id}`);
				},
			};
			state.programs.push(program);
			return program;
		},
		submitLayer(request) {
			state.submissions.push(request);
			state.events.push(`submit:${request.program.id}:${request.layer}`);
			options.onSubmit?.(request);
			if (options.failProgram === request.program.id
				&& request.layer === (options.failLayer ?? 0)) {
				throw new Error('manufactured submission failure');
			}
		},
		createRuntimeBinding(field) {
			state.runtimeBindingCalls += 1;
			state.events.push(`runtime-binding:${field.descriptor.id}`);
			return {
				id: `binding:${field.descriptor.id}`,
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

function createHarness(options) {
	const state = createState();
	const backend = createBackend(state, options);
	const executor = new CacheGpuExecutor({
		backend,
		assembler: createAssembler(state),
	});
	return { state, backend, executor };
}

function scalarProbe(field = 'j1') {
	return {
		field,
		coordinates: [{
			directionIndex: 0,
			positionIndex: 0,
			wavelengthIndex: 0,
		}],
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

describe('CacheGpuExecutor', () => {
	it('executes pass/layer loops, probes producers, and retains only the result', async () => {
		const { state, backend, executor } = createHarness();
		let schedulerCalls = 0;
		const probeReader = {
			async readSelectedScalars(request) {
				state.events.push(`probe:${request.field.descriptor.id}`);
				return {
					descriptor: request.field.descriptor,
					samples: request.coordinates.map((coordinates) => ({
						coordinates,
						value: 12.5,
					})),
				};
			},
		};
		const artifact = await executor.execute(createN1Plan(), {
			probeReader,
			probes: [scalarProbe()],
			scheduler: {
				async yieldControl() {
					schedulerCalls += 1;
					state.events.push('yield');
				},
			},
		});

		expect(state.events.slice(0, 2)).toEqual([
			'assemble:primary-pass',
			'assemble:accumulate-pass',
		]);
		expect(state.events[2]).toBe('compile:shader:primary-pass');
		expect(state.submissions.length).toBe(
			2 * DEFAULT_SCATTERING_DENSITY_LAYOUT.shape.wavelength,
		);
		expect(state.submissions
			.filter((submission) => submission.program.id === 'shader:accumulate-pass')
			.every((submission) => submission.inputs.length === 1
				&& submission.inputs[0].id === 'j1')).toBeTrue();
		const probeIndex = state.events.indexOf('probe:executor-spec-j1');
		const temporaryDisposeIndex = state.events.indexOf('dispose-field:executor-spec-j1');
		expect(probeIndex).toBeGreaterThan(-1);
		expect(temporaryDisposeIndex).toBeGreaterThan(probeIndex);
		const wavelengthLayerCount =
			DEFAULT_SCATTERING_DENSITY_LAYOUT.shape.wavelength;
		expect(schedulerCalls).toBe(
			2 * (wavelengthLayerCount - 1) + 1,
		);
		expect(state.events.slice(
			state.events.indexOf('submit:shader:primary-pass:0'),
			state.events.indexOf('submit:shader:primary-pass:1') + 1,
		)).toEqual([
			'submit:shader:primary-pass:0',
			'yield',
			'submit:shader:primary-pass:1',
		]);
		expect(state.programs.every((program) => program.disposeCount === 1)).toBeTrue();
		expect(state.fields[0].disposeCount).toBe(1);
		expect(state.fields[1].disposeCount).toBe(0);
		expect(state.runtimeBindingCalls).toBe(1);
		expect(artifact.descriptor.kind).toBe('scattering-cache');
		expect(artifact.result).toBe(state.fields[1]);
		expect(artifact.runtimeBindings).toEqual({
			backendId: backend.id,
			bindings: [{
				id: 'binding:executor-spec-j-through-1',
				valueKey: CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
				descriptor: state.fields[1].descriptor,
				backendId: backend.id,
			}],
		});
		expect(artifact.diagnostics.passes.length).toBe(2);
		expect(artifact.diagnostics.passes.every((diagnostic) =>
			diagnostic.submissionDuration.units === 'seconds'
			&& diagnostic.submissionDuration.value >= 0)).toBeTrue();
		expect(artifact.diagnostics.passes[0].probe.samples[0].value).toBe(12.5);
		const fieldStorage = TEST_FIELD_STORAGE.width
			* TEST_FIELD_STORAGE.height
			* TEST_FIELD_STORAGE.layers
			* 4;
		expect(artifact.diagnostics.memory).toEqual({
			peakFieldStorage: { value: fieldStorage * 2, units: 'bytes' },
			peakPackedDataStorage: { value: 0, units: 'bytes' },
			peakTrackedStorage: { value: fieldStorage * 2, units: 'bytes' },
			residentFieldStorage: { value: fieldStorage, units: 'bytes' },
		});

		artifact.dispose();
		artifact.dispose();
		expect(state.fields[1].disposeCount).toBe(1);
		expect(state.backendDisposeCalls).toBe(0);
	});

	it('enforces probe API bounds before allocation', async () => {
		const { state, executor } = createHarness();

		await expectAsync(executor.execute(createN1Plan(), {
			probes: [scalarProbe()],
		})).toBeRejectedWithError(/require a probe reader/u);
		expect(state.fields.length).toBe(0);

		await expectAsync(executor.execute(createN1Plan(), {
			probeReader: { async readSelectedScalars() {} },
			probes: [{
				field: 'j1',
				coordinates: [{
					directionIndex: TEST_FIELD_STORAGE.width,
					positionIndex: 0,
					wavelengthIndex: 0,
				}],
			}],
		})).toBeRejectedWithError(/directionIndex/);
		expect(state.fields.length).toBe(0);
	});

	it('cancels before allocation and between wavelength-layer submissions', async () => {
		const before = createHarness();
		const preAborted = new AbortController();
		preAborted.abort();
		await expectAbort(before.executor.execute(createN1Plan(), {
			signal: preAborted.signal,
		}));
		expect(before.state.fields.length).toBe(0);
		expect(before.state.programs.length).toBe(0);

		const duringAbort = new AbortController();
		const during = createHarness({
			onSubmit(request) {
				if (request.program.id === 'shader:primary-pass' && request.layer === 0) {
					duringAbort.abort();
				}
			},
		});
		await expectAbort(during.executor.execute(createN1Plan(), {
			signal: duringAbort.signal,
		}));
		expect(during.state.submissions.length).toBe(1);
		expect(during.state.fields.every((field) => field.disposeCount === 1)).toBeTrue();
		expect(during.state.programs.every((program) => program.disposeCount === 1)).toBeTrue();
	});

	it('checks cancellation after the completed-pass scheduler boundary', async () => {
		const controller = new AbortController();
		const { state, executor } = createHarness();
		let schedulerCalls = 0;
		const passBoundaryCall =
			DEFAULT_SCATTERING_DENSITY_LAYOUT.shape.wavelength;

		await expectAbort(executor.execute(createN1Plan(), {
			signal: controller.signal,
			scheduler: {
				async yieldControl() {
					schedulerCalls += 1;
					if (schedulerCalls === passBoundaryCall) {
						controller.abort();
					}
				},
			},
		}));
		expect(schedulerCalls).toBe(passBoundaryCall);
		expect(state.submissions.length).toBe(
			DEFAULT_SCATTERING_DENSITY_LAYOUT.shape.wavelength,
		);
		expect(state.programs.length).toBe(1);
		expect(state.programs[0].disposeCount).toBe(1);
		expect(state.fields.length).toBe(1);
		expect(state.fields[0].disposeCount).toBe(1);
	});

	it('checks cancellation after an inter-layer scheduler boundary', async () => {
		const controller = new AbortController();
		const { state, executor } = createHarness();
		let schedulerCalls = 0;

		await expectAbort(executor.execute(createN1Plan(), {
			signal: controller.signal,
			scheduler: {
				async yieldControl() {
					schedulerCalls += 1;
					controller.abort();
				},
			},
		}));
		expect(schedulerCalls).toBe(1);
		expect(state.submissions.length).toBe(1);
		expect(state.programs.length).toBe(1);
		expect(state.programs[0].disposeCount).toBe(1);
		expect(state.fields.length).toBe(1);
		expect(state.fields[0].disposeCount).toBe(1);
	});

	it('cleans every staging resource when a later pass fails', async () => {
		const { state, executor } = createHarness({
			failProgram: 'shader:accumulate-pass',
			failLayer: 0,
		});

		await expectAsync(executor.execute(createN1Plan()))
			.toBeRejectedWithError(/manufactured submission failure/);
		expect(state.fields.length).toBe(2);
		expect(state.fields.every((field) => field.disposeCount === 1)).toBeTrue();
		expect(state.programs.length).toBe(2);
		expect(state.programs.every((program) => program.disposeCount === 1)).toBeTrue();
		expect(state.runtimeBindingCalls).toBe(0);
	});

	it('cleans staging resources when a declared probe fails', async () => {
		const { state, executor } = createHarness();
		await expectAsync(executor.execute(createN1Plan(), {
			probes: [scalarProbe()],
			probeReader: {
				async readSelectedScalars() {
					throw new Error('manufactured probe failure');
				},
			},
		})).toBeRejectedWithError(/manufactured probe failure/);
		expect(state.fields.length).toBe(1);
		expect(state.fields[0].disposeCount).toBe(1);
		expect(state.programs.length).toBe(1);
		expect(state.programs[0].disposeCount).toBe(1);
	});

	it('disposes idempotently without taking ownership of the backend', async () => {
		const { state, executor } = createHarness();
		executor.dispose();
		executor.dispose();

		expect(state.backendDisposeCalls).toBe(0);
		await expectAsync(executor.execute(createN1Plan()))
			.toBeRejectedWithError(/disposed/);
		expect(state.fields.length).toBe(0);
	});
});
