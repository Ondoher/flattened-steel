import { createScatteringCacheDescriptor } from '../ScatteringCacheDescriptor.js';
import { durationFromMilliseconds } from '../../utils/durationValues.js';

const MAXIMUM_PROBE_SCALAR_COUNT = 4096;
const R32F_BYTES_PER_SCALAR = 4;

/** Return exact scalar payload bytes for one executable field allocation. */
function fieldStorageBytes(storage) {
	return storage.width
		* storage.height
		* storage.layers
		* R32F_BYTES_PER_SCALAR;
}

/** Return exact scalar payload bytes uploaded with one compiled pass. */
function packedDataBytes(shader) {
	return shader.bindings
		.filter((binding) => binding.spec.kind === 'data')
		.reduce((total, binding) => total
			+ /** @type {CacheData} */ (binding.value).values.length
				* R32F_BYTES_PER_SCALAR, 0);
}

/** Carry a byte count without encoding its unit in a property name. */
function bytes(value) {
	return { value, units: 'bytes' };
}

/** Return monotonic milliseconds where available. */
function nowMilliseconds() {
	return globalThis.performance?.now?.() ?? Date.now();
}

/** Create one ordinary cancellation error without requiring a DOM runtime. */
function createAbortError(message) {
	const error = new Error(message);
	error.name = 'AbortError';
	return error;
}

/** Enforce executor lifecycle and caller cancellation at safe boundaries. */
function requireActiveExecution(executor, signal) {
	if (executor._disposed) {
		throw createAbortError('Cache GPU execution was cancelled because its executor was disposed.');
	}
	if (signal?.aborted === true) {
		throw createAbortError('Cache GPU execution was aborted.');
	}
}

/** Accept one API-supplied coordinate within an executable field extent. */
function boundedCoordinate(value, maximum, label) {
	if (!Number.isSafeInteger(value) || value < 0 || value >= maximum) {
		throw new RangeError(`${label} must be an integer from 0 through ${maximum - 1}.`);
	}
	return value;
}

/** Accept and copy one selected scalar coordinate at the execution API. */
function acceptProbeCoordinate(value, storage, label) {
	return {
		directionIndex: boundedCoordinate(
			value.directionIndex,
			storage.width,
			`${label}.directionIndex`,
		),
		positionIndex: boundedCoordinate(
			value.positionIndex,
			storage.height,
			`${label}.positionIndex`,
		),
		wavelengthIndex: boundedCoordinate(
			value.wavelengthIndex,
			storage.layers,
			`${label}.wavelengthIndex`,
		),
	};
}

/** Build the maps needed to execute one trusted typed plan. */
function indexPlan(plan) {
	const fieldSpecs = new Map(plan.fields.map((field) => [field.id, field]));
	const consumerCounts = new Map(plan.fields.map((field) => [field.id, 0]));
	for (const pass of plan.passes) {
		for (const fieldId of pass.inputs) {
			consumerCounts.set(fieldId, (consumerCounts.get(fieldId) ?? 0) + 1);
		}
	}
	return { fieldSpecs, consumerCounts };
}

/** Accept bounded diagnostic probe values supplied through the execution API. */
function acceptProbes(probes, probeReader, fieldSpecs) {
	const accepted = new Map();
	if (!probes) {
		return accepted;
	}
	if (probes.length > 0 && !probeReader) {
		throw new RangeError('Declared cache probes require a probe reader.');
	}

	let scalarCount = 0;
	for (const [probeIndex, probe] of probes.entries()) {
		const field = fieldSpecs.get(probe.field);
		if (!field) {
			throw new RangeError(`Cache probe ${probeIndex} does not name a plan field.`);
		}
		if (accepted.has(probe.field)) {
			throw new RangeError(`Cache field ${probe.field} has more than one probe.`);
		}
		if (probe.coordinates.length === 0) {
			throw new RangeError(`Cache probe ${probeIndex} must select at least one scalar.`);
		}

		const coordinates = probe.coordinates.map((coordinate, coordinateIndex) =>
			acceptProbeCoordinate(
				coordinate,
				field.storage,
				`Cache probe ${probeIndex} coordinate ${coordinateIndex}`,
			));
		const coordinateKeys = coordinates.map((coordinate) =>
			`${coordinate.directionIndex}:${coordinate.positionIndex}:${coordinate.wavelengthIndex}`);
		if (new Set(coordinateKeys).size !== coordinates.length) {
			throw new RangeError(`Cache probe ${probeIndex} contains a duplicate coordinate.`);
		}

		scalarCount += coordinates.length;
		if (scalarCount > MAXIMUM_PROBE_SCALAR_COUNT) {
			throw new RangeError(
				`Cache execution probes are limited to ${MAXIMUM_PROBE_SCALAR_COUNT} scalars.`,
			);
		}
		accepted.set(probe.field, { field: probe.field, coordinates });
	}
	return accepted;
}

/** Accept execution values whose runtime bounds cannot be expressed by types. */
function acceptExecutionOptions(options, fieldSpecs) {
	const accepted = options ?? {};
	return {
		signal: accepted.signal,
		scheduler: accepted.scheduler,
		probeReader: accepted.probeReader,
		probes: acceptProbes(accepted.probes, accepted.probeReader, fieldSpecs),
	};
}

/** Accept finite diagnostic values returned through the probe API. */
function acceptProbeResult(result, coordinates) {
	if (result.samples.length !== coordinates.length) {
		throw new RangeError('Cache probe result count must match its request.');
	}
	for (const [index, sample] of result.samples.entries()) {
		const expected = coordinates[index];
		if (sample.coordinates.directionIndex !== expected.directionIndex
			|| sample.coordinates.positionIndex !== expected.positionIndex
			|| sample.coordinates.wavelengthIndex !== expected.wavelengthIndex
			|| !Number.isFinite(sample.value)) {
			throw new RangeError(`Cache probe sample ${index} does not match its requested scalar.`);
		}
	}
	return result;
}

/** Dispose one owned resource and remove it only after successful release. */
function releaseResource(resource, owned) {
	resource.dispose();
	owned.delete(resource);
}

/** Attempt every remaining cleanup and return the first disposal failure. */
function cleanOwnedResources(programs, fields) {
	let cleanupError;
	for (const resource of [...programs].reverse()) {
		try {
			releaseResource(resource, programs);
		} catch (error) {
			cleanupError ??= error;
		}
	}
	for (const resource of [...fields].reverse()) {
		try {
			releaseResource(resource, fields);
		} catch (error) {
			cleanupError ??= error;
		}
	}
	return cleanupError;
}

/** Create the successful result owner with idempotent field disposal. */
function createArtifact(descriptor, result, runtimeBinding, diagnostics, backendId) {
	let disposed = false;
	return /** @type {CacheBuildArtifact} */ ({
		descriptor,
		result,
		runtimeBindings: {
			backendId,
			bindings: [runtimeBinding],
		},
		diagnostics,
		dispose() {
			if (disposed) {
				return;
			}
			disposed = true;
			result.dispose();
		},
	});
}

/** Execute one trusted source-owned cache plan through a renderer-neutral backend. */
export class CacheGpuExecutor {
	/** @type {CacheGpuBackend} */
	_backend;
	/** @type {CacheAssembler} */
	_assembler;
	_disposed = false;
	_executing = false;

	/**
	 * @param {Readonly<{ backend: CacheGpuBackend, assembler: CacheAssembler }>} request
	 * Supplies construction collaborators.
	 */
	constructor(request) {
		this._backend = request.backend;
		this._assembler = request.assembler;
	}

	/**
	 * Execute one complete staging graph and retain only its cumulative result.
	 *
	 * @param {CacheBuildPlan} plan - Supplies the trusted source-owned graph.
	 * @param {CacheExecutionOptions} [options] - Supplies cancellation, scheduling,
	 * and bounded diagnostic probes.
	 * @returns {Promise<CacheBuildArtifact>} The successful staging artifact.
	 */
	async execute(plan, options) {
		if (this._disposed) {
			throw new Error('CacheGpuExecutor is disposed.');
		}
		if (this._executing) {
			throw new Error('CacheGpuExecutor already has an active execution.');
		}
		this._executing = true;
		/** @type {Set<GpuCacheField>} */
		const ownedFields = new Set();
		/** @type {Set<CacheGpuProgram>} */
		const ownedPrograms = new Set();

		try {
			const execution = indexPlan(plan);
			const acceptedOptions = acceptExecutionOptions(options, execution.fieldSpecs);
			requireActiveExecution(this, acceptedOptions.signal);

			const shaders = plan.passes.map((pass) => this._assembler.assemble(
				pass,
				/** @type {CacheFieldSpec} */ (execution.fieldSpecs.get(pass.output)),
			));
			requireActiveExecution(this, acceptedOptions.signal);

			/** @type {Map<CacheFieldId, GpuCacheField>} */
			const liveFields = new Map();
			const remainingConsumers = new Map(execution.consumerCounts);
			/** @type {CachePassDiagnostic[]} */
			const passDiagnostics = [];
			let liveFieldStorage = 0;
			let peakFieldStorage = 0;
			let peakPackedDataStorage = 0;
			let peakTrackedStorage = 0;

			for (let passIndex = 0; passIndex < plan.passes.length; passIndex += 1) {
				requireActiveExecution(this, acceptedOptions.signal);
				const pass = plan.passes[passIndex];
				const shader = shaders[passIndex];
				const outputSpec = /** @type {CacheFieldSpec} */ (
					execution.fieldSpecs.get(pass.output)
				);

				const program = await this._backend.compile(shader);
				ownedPrograms.add(program);
				requireActiveExecution(this, acceptedOptions.signal);

				const output = this._backend.allocateField(outputSpec);
				ownedFields.add(output);
				liveFields.set(pass.output, output);
				liveFieldStorage += fieldStorageBytes(outputSpec.storage);
				const passPackedDataStorage = packedDataBytes(shader);
				peakFieldStorage = Math.max(peakFieldStorage, liveFieldStorage);
				peakPackedDataStorage = Math.max(
					peakPackedDataStorage,
					passPackedDataStorage,
				);
				peakTrackedStorage = Math.max(
					peakTrackedStorage,
					liveFieldStorage + passPackedDataStorage,
				);

				const inputs = pass.inputs.map((id) => ({
					id,
					field: /** @type {GpuCacheField} */ (liveFields.get(id)),
				}));
				const submissionStart = nowMilliseconds();
				for (let layer = 0; layer < outputSpec.storage.layers; layer += 1) {
					requireActiveExecution(this, acceptedOptions.signal);
					this._backend.submitLayer({
						program,
						inputs,
						output,
						layer,
						bindings: shader.bindings,
					});
					if (acceptedOptions.scheduler
						&& layer < outputSpec.storage.layers - 1) {
						await acceptedOptions.scheduler.yieldControl();
						requireActiveExecution(this, acceptedOptions.signal);
					}
				}
				const submissionDuration = durationFromMilliseconds(
					Math.max(0, nowMilliseconds() - submissionStart),
				);
				requireActiveExecution(this, acceptedOptions.signal);

				const declaredProbe = acceptedOptions.probes.get(pass.output);
				let probe;
				if (declaredProbe) {
					probe = acceptProbeResult(
						await acceptedOptions.probeReader.readSelectedScalars({
							field: output,
							coordinates: declaredProbe.coordinates,
						}),
						declaredProbe.coordinates,
					);
					requireActiveExecution(this, acceptedOptions.signal);
				}

				releaseResource(program, ownedPrograms);
				for (const input of inputs) {
					const remaining = (remainingConsumers.get(input.id) ?? 0) - 1;
					remainingConsumers.set(input.id, remaining);
					if (remaining === 0 && input.id !== plan.result) {
						releaseResource(input.field, ownedFields);
						liveFieldStorage -= fieldStorageBytes(input.field.storage);
						liveFields.delete(input.id);
					}
				}
				passDiagnostics.push({
					id: pass.id,
					submissionDuration,
					...(probe ? { probe } : {}),
				});
				requireActiveExecution(this, acceptedOptions.signal);

				if (acceptedOptions.scheduler && passIndex < plan.passes.length - 1) {
					await acceptedOptions.scheduler.yieldControl();
					requireActiveExecution(this, acceptedOptions.signal);
				}
			}

			requireActiveExecution(this, acceptedOptions.signal);
			const result = /** @type {GpuCacheField} */ (liveFields.get(plan.result));
			const descriptor = createScatteringCacheDescriptor(plan.descriptorDefinition);
			const runtimeBinding = this._backend.createRuntimeBinding(result);
			const artifact = createArtifact(
				descriptor,
				result,
				runtimeBinding,
				{
					passes: passDiagnostics,
					memory: {
						peakFieldStorage: bytes(peakFieldStorage),
						peakPackedDataStorage: bytes(peakPackedDataStorage),
						peakTrackedStorage: bytes(peakTrackedStorage),
						residentFieldStorage: bytes(fieldStorageBytes(result.storage)),
					},
				},
				this._backend.id,
			);
			ownedFields.delete(result);
			return artifact;
		} catch (error) {
			const cleanupError = cleanOwnedResources(ownedPrograms, ownedFields);
			if (cleanupError) {
				throw new AggregateError(
					[error, cleanupError],
					'Cache GPU execution and staging cleanup both failed.',
				);
			}
			throw error;
		} finally {
			this._executing = false;
		}
	}

	/** Mark this executor unavailable without disposing its backend. */
	dispose() {
		this._disposed = true;
	}
}

export default CacheGpuExecutor;
