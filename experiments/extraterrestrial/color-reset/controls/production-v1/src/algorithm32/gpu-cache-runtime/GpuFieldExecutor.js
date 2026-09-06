import {TimeMath} from '../time/TimeMath.js';
import {MAXIMUM_GPU_FIELD_PROBE_SCALAR_COUNT, R32F_BYTES_PER_SCALAR} from './consts.js';

/** Renderer-neutral GPU executor for trusted scalar-field plans. */
export class GpuFieldExecutor {
	/**
	 * Called by execution diagnostics to calculate scalar payload bytes for one field allocation.
	 *
	 * @param {CacheFieldStorage} storage - The executable field storage.
	 * @returns {number} - The scalar payload size in bytes.
	 */
	_fieldStorageBytes(storage) {
		return storage.width * storage.height * storage.layers * R32F_BYTES_PER_SCALAR;
	}

	/**
	 * Called by execution diagnostics to calculate packed-data bytes uploaded with one pass.
	 *
	 * @param {CacheShader} shader - The compiled cache shader.
	 * @returns {number} - The packed-data size in bytes.
	 */
	_packedDataBytes(shader) {
		return shader.bindings
			.filter(
				/**
				 * Called by Array.prototype.filter to test whether one collection value is retained.
				 * @param binding - The binding value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (binding) => binding.spec.kind === 'data',
			)
			.reduce(
				/**
				 * Called by Array.prototype.reduce to accumulate one collection value.
				 * @param total - The total value accepted by the operation.
				 * @param binding - The binding value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (total, binding) =>
					total + /** @type {CacheData} */ (binding.value).values.length * R32F_BYTES_PER_SCALAR,
				0,
			);
	}

	/**
	 * Called by execution diagnostics to carry a byte count as a unit-bearing value.
	 *
	 * @param {number} value - The byte count.
	 * @returns {UnitValue<'bytes'>} - The unit-bearing byte count.
	 */
	_bytes(value) {
		return {value, units: 'bytes'};
	}

	/**
	 * Called by cancellation boundaries to create an ordinary abort error without a DOM runtime.
	 *
	 * @param {string} message - The cancellation message.
	 * @returns {Error} - The abort error.
	 */
	_createAbortError(message) {
		const error = new Error(message);
		error.name = 'AbortError';
		return error;
	}

	/**
	 * Called by execution to enforce executor lifecycle and caller cancellation at safe boundaries.
	 *
	 * @param {AbortSignal | undefined} signal - The optional caller cancellation signal.
	 * @returns {void} - No value.
	 * @throws {Error} - When the executor is disposed or caller cancellation is active.
	 */
	_requireActiveExecution(signal) {
		if (this._disposed) {
			throw this._createAbortError('Cache GPU execution was cancelled because its executor was disposed.');
		}
		if (signal?.aborted === true) {
			throw this._createAbortError('Cache GPU execution was aborted.');
		}
	}

	/**
	 * Called by probe acceptance to require one coordinate within an executable field extent.
	 *
	 * @param {number} value - The candidate coordinate.
	 * @param {number} maximum - The exclusive coordinate bound.
	 * @param {string} label - The diagnostic label.
	 * @returns {number} - The accepted coordinate.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_boundedCoordinate(value, maximum, label) {
		if (!Number.isSafeInteger(value) || value < 0 || value >= maximum) {
			throw new RangeError(`${label} must be an integer from 0 through ${maximum - 1}.`);
		}
		return value;
	}

	/**
	 * Called by probe acceptance to copy one selected scalar coordinate at the execution boundary.
	 *
	 * @param {DirectionalSpectralFieldCoordinates} value - The candidate coordinate.
	 * @param {CacheFieldStorage} storage - The selected field storage.
	 * @param {string} label - The diagnostic label.
	 * @returns {DirectionalSpectralFieldCoordinates} - The accepted coordinate copy.
	 */
	_acceptProbeCoordinate(value, storage, label) {
		return {
			directionIndex: this._boundedCoordinate(value.directionIndex, storage.width, `${label}.directionIndex`),
			positionIndex: this._boundedCoordinate(value.positionIndex, storage.height, `${label}.positionIndex`),
			wavelengthIndex: this._boundedCoordinate(value.wavelengthIndex, storage.layers, `${label}.wavelengthIndex`),
		};
	}

	/**
	 * Called by execution to index the fields and remaining consumers of one trusted plan.
	 *
	 * @param {GpuFieldExecutionPlan} plan - The trusted scalar-field execution plan.
	 * @returns {GpuFieldIndexedPlan} - The indexed execution facts.
	 */
	_indexPlan(plan) {
		const fieldSpecs = new Map(
			plan.fields.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param field - The field value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (field) => [field.id, field],
			),
		);
		const consumerCounts = new Map(
			plan.fields.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param field - The field value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (field) => [field.id, 0],
			),
		);
		for (const pass of plan.passes) {
			for (const fieldId of pass.inputs) {
				consumerCounts.set(fieldId, (consumerCounts.get(fieldId) ?? 0) + 1);
			}
		}
		return {fieldSpecs, consumerCounts};
	}

	/**
	 * Called by option acceptance to validate bounded diagnostic probe requests. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {readonly CacheProbe[] | undefined} probes - The optional probe requests.
	 * @param {CacheProbeReader | undefined} probeReader - The optional probe reader.
	 * @param {ReadonlyMap<CacheFieldId, CacheFieldSpec>} fieldSpecs - The indexed field specifications.
	 * @returns {Map<CacheFieldId, GpuFieldAcceptedProbe>} - The accepted probes keyed by field.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_acceptProbes(probes, probeReader, fieldSpecs) {
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

			const coordinates = probe.coordinates.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param coordinate - The coordinate value accepted by the operation.
				 * @param coordinateIndex - The coordinate index value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (coordinate, coordinateIndex) =>
					this._acceptProbeCoordinate(
						coordinate,
						field.storage,
						`Cache probe ${probeIndex} coordinate ${coordinateIndex}`,
					),
			);
			const coordinateKeys = coordinates.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param coordinate - The coordinate value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (coordinate) =>
					`${coordinate.directionIndex}:${coordinate.positionIndex}:${coordinate.wavelengthIndex}`,
			);
			if (new Set(coordinateKeys).size !== coordinates.length) {
				throw new RangeError(`Cache probe ${probeIndex} contains a duplicate coordinate.`);
			}

			scalarCount += coordinates.length;
			if (scalarCount > MAXIMUM_GPU_FIELD_PROBE_SCALAR_COUNT) {
				throw new RangeError(
					`Cache execution probes are limited to ${MAXIMUM_GPU_FIELD_PROBE_SCALAR_COUNT} scalars.`,
				);
			}
			accepted.set(probe.field, {field: probe.field, coordinates});
		}
		return accepted;
	}

	/**
	 * Called by execution to accept runtime options against indexed plan fields.
	 *
	 * @param {CacheExecutionOptions | undefined} options - The optional execution values.
	 * @param {ReadonlyMap<CacheFieldId, CacheFieldSpec>} fieldSpecs - The indexed field specifications.
	 * @returns {GpuFieldAcceptedExecutionOptions} - The accepted execution options.
	 */
	_acceptExecutionOptions(options, fieldSpecs) {
		const accepted = options ?? {};
		return {
			signal: accepted.signal,
			scheduler: accepted.scheduler,
			probeReader: accepted.probeReader,
			probes: this._acceptProbes(accepted.probes, accepted.probeReader, fieldSpecs),
		};
	}

	/**
	 * Called by execution to validate finite diagnostic values returned through the probe API.
	 *
	 * @param {CacheProbeResult} result - The candidate probe result.
	 * @param {readonly DirectionalSpectralFieldCoordinates[]} coordinates - The requested coordinates.
	 * @returns {CacheProbeResult} - The accepted probe result.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_acceptProbeResult(result, coordinates) {
		if (result.samples.length !== coordinates.length) {
			throw new RangeError('Cache probe result count must match its request.');
		}
		for (const [index, sample] of result.samples.entries()) {
			const expected = coordinates[index];
			if (
				sample.coordinates.directionIndex !== expected.directionIndex ||
				sample.coordinates.positionIndex !== expected.positionIndex ||
				sample.coordinates.wavelengthIndex !== expected.wavelengthIndex ||
				!Number.isFinite(sample.value)
			) {
				throw new RangeError(`Cache probe sample ${index} does not match its requested scalar.`);
			}
		}
		return result;
	}

	/**
	 * Called by execution cleanup to dispose one owned resource before removing its ownership record.
	 *
	 * @template {{dispose(): void}} Resource
	 * @param {Resource} resource - The owned resource.
	 * @param {Set<Resource>} owned - The corresponding ownership set.
	 * @returns {void} - No value.
	 */
	_releaseResource(resource, owned) {
		resource.dispose();
		owned.delete(resource);
	}

	/**
	 * Called by failed execution to attempt every remaining cleanup in reverse ownership order.
	 *
	 * @param {Set<CacheGpuProgram>} programs - The owned programs.
	 * @param {Set<GpuCacheField>} fields - The owned fields.
	 * @returns {unknown} - The first disposal failure, or undefined when cleanup succeeds.
	 */
	_cleanOwnedResources(programs, fields) {
		let cleanupError;
		for (const resource of [...programs].reverse()) {
			try {
				this._releaseResource(resource, programs);
			} catch (error) {
				cleanupError ??= error;
			}
		}
		for (const resource of [...fields].reverse()) {
			try {
				this._releaseResource(resource, fields);
			} catch (error) {
				cleanupError ??= error;
			}
		}
		return cleanupError;
	}

	/**
	 * Called by successful execution to create the result owner with idempotent field disposal.
	 *
	 * @param {GpuCacheField} result - The retained result field.
	 * @param {CacheRuntimeBinding} runtimeBinding - The opaque runtime binding.
	 * @param {CacheBuildDiagnostics} diagnostics - The completed build diagnostics.
	 * @param {string} backendId - The owning backend identifier.
	 * @returns {CacheBuildArtifact} - The completed build artifact.
	 */
	_createArtifact(result, runtimeBinding, diagnostics, backendId) {
		let disposed = false;
		return {
			result,
			runtimeBindings: {
				backendId,
				bindings: [runtimeBinding],
			},
			diagnostics,
			/** Call this method to dispose. */ dispose() {
				if (disposed) {
					return;
				}
				disposed = true;
				result.dispose();
			},
		};
	}

	/** Renderer-specific GPU construction backend. @type {CacheGpuBackend} */
	_backend;
	/** Provider-neutral field-pass assembler. @type {GpuFieldAssembler} */
	_assembler;
	/** Whether the executor is unavailable for new work. */
	_disposed = false;
	/** Whether the executor currently owns an active execution transaction. */
	_executing = false;

	/**
	 * Creates a renderer-neutral executor for one backend and cache-pass assembler.
	 *
	 * @param {GpuFieldExecutorConfiguration} request - The construction collaborators.
	 */
	constructor(request) {
		this._backend = request.backend;
		this._assembler = request.assembler;
	}

	/**
	 * Call this method to execute one complete staging graph and retain only its cumulative result. Execution rejects for invalid lifecycle, cancellation, backend, probe, scheduling, or cleanup failure; callers cancel through the supplied signal and must discard a rejected artifact.
	 *
	 * @param {GpuFieldExecutionPlan} plan - Supplies the trusted caller-owned field graph.
	 * @param {GpuFieldExecutionOptions} [options] - Supplies cancellation, scheduling,
	 * and bounded diagnostic probes.
	 * @returns {Promise<GpuFieldArtifact>} - The successful staging artifact.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 * @throws {AggregateError} - When the operation and its required cleanup both fail.
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
			const execution = this._indexPlan(plan);
			const acceptedOptions = this._acceptExecutionOptions(options, execution.fieldSpecs);
			this._requireActiveExecution(acceptedOptions.signal);

			const shaders = plan.passes.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param pass - The pass value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (pass) =>
					this._assembler.assemble(
						pass,
						/** @type {CacheFieldSpec} */ (execution.fieldSpecs.get(pass.output)),
					),
			);
			this._requireActiveExecution(acceptedOptions.signal);

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
				this._requireActiveExecution(acceptedOptions.signal);
				const pass = plan.passes[passIndex];
				const shader = shaders[passIndex];
				const outputSpec = /** @type {CacheFieldSpec} */ (execution.fieldSpecs.get(pass.output));

				const program = await this._backend.compile(shader);
				ownedPrograms.add(program);
				this._requireActiveExecution(acceptedOptions.signal);

				const output = this._backend.allocateField(outputSpec);
				ownedFields.add(output);
				liveFields.set(pass.output, output);
				liveFieldStorage += this._fieldStorageBytes(outputSpec.storage);
				const passPackedDataStorage = this._packedDataBytes(shader);
				peakFieldStorage = Math.max(peakFieldStorage, liveFieldStorage);
				peakPackedDataStorage = Math.max(peakPackedDataStorage, passPackedDataStorage);
				peakTrackedStorage = Math.max(peakTrackedStorage, liveFieldStorage + passPackedDataStorage);

				const inputs = pass.inputs.map(
					/**
					 * Called by Array.prototype.map to transform one collection value.
					 * @param id - The id value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (id) => ({
						id,
						field: /** @type {GpuCacheField} */ (liveFields.get(id)),
					}),
				);
				const submissionStart = TimeMath.nowMilliseconds();
				for (let layer = 0; layer < outputSpec.storage.layers; layer += 1) {
					this._requireActiveExecution(acceptedOptions.signal);
					this._backend.submitLayer({
						program,
						inputs,
						output,
						layer,
						bindings: shader.bindings,
					});
					if (acceptedOptions.scheduler && layer < outputSpec.storage.layers - 1) {
						await acceptedOptions.scheduler.yieldControl();
						this._requireActiveExecution(acceptedOptions.signal);
					}
				}
				const submissionDuration = TimeMath.durationFromMilliseconds(
					Math.max(0, TimeMath.nowMilliseconds() - submissionStart),
				);
				this._requireActiveExecution(acceptedOptions.signal);

				const declaredProbe = acceptedOptions.probes.get(pass.output);
				let probe;
				if (declaredProbe) {
					probe = this._acceptProbeResult(
						await /** @type {CacheProbeReader} */ (acceptedOptions.probeReader).readSelectedScalars({
							field: output,
							coordinates: declaredProbe.coordinates,
						}),
						declaredProbe.coordinates,
					);
					this._requireActiveExecution(acceptedOptions.signal);
				}

				this._releaseResource(program, ownedPrograms);
				for (const input of inputs) {
					const remaining = (remainingConsumers.get(input.id) ?? 0) - 1;
					remainingConsumers.set(input.id, remaining);
					if (remaining === 0 && input.id !== plan.result) {
						this._releaseResource(input.field, ownedFields);
						liveFieldStorage -= this._fieldStorageBytes(input.field.storage);
						liveFields.delete(input.id);
					}
				}
				passDiagnostics.push({
					id: pass.id,
					submissionDuration,
					...(probe ? {probe} : {}),
				});
				this._requireActiveExecution(acceptedOptions.signal);

				if (acceptedOptions.scheduler && passIndex < plan.passes.length - 1) {
					await acceptedOptions.scheduler.yieldControl();
					this._requireActiveExecution(acceptedOptions.signal);
				}
			}

			this._requireActiveExecution(acceptedOptions.signal);
			const result = /** @type {GpuCacheField} */ (liveFields.get(plan.result));
			const runtimeBinding = this._backend.createRuntimeBinding({
				field: result,
				valueKey: plan.valueKey,
			});
			const artifact = this._createArtifact(
				result,
				runtimeBinding,
				{
					passes: passDiagnostics,
					memory: {
						peakFieldStorage: this._bytes(peakFieldStorage),
						peakPackedDataStorage: this._bytes(peakPackedDataStorage),
						peakTrackedStorage: this._bytes(peakTrackedStorage),
						residentFieldStorage: this._bytes(this._fieldStorageBytes(result.storage)),
					},
				},
				this._backend.id,
			);
			ownedFields.delete(result);
			return artifact;
		} catch (error) {
			const cleanupError = this._cleanOwnedResources(ownedPrograms, ownedFields);
			if (cleanupError) {
				throw new AggregateError([error, cleanupError], 'Cache GPU execution and staging cleanup both failed.');
			}
			throw error;
		} finally {
			this._executing = false;
		}
	}

	/**
	 * Call this method to mark the executor unavailable without disposing its backend.
	 *
	 * @returns {void} - No value.
	 */
	dispose() {
		this._disposed = true;
	}
}
