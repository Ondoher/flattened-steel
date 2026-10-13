import {Algorithm32} from '../../../../src/algorithm32/implementation/algorithm32/Algorithm32.js';

/** Real-backend resource cleanup and admission proof preserving an already valid cache. */
export class LocalSunGpuCleanupProof {
	/** Called by observed disposal to release a real resource and remove its successful ownership once.
	 *
	 * @param {LocalSunGpuCandidateState} state - Owned candidate accounting.
	 * @param {LocalSunGpuCandidateHandle} handle - Resource whose ownership is ending.
	 * @param {number} bytes - Declared payload to retire.
	 * @param {LocalSunGpuCandidateHandle['dispose']} dispose - Accepted original disposer.
	 * @returns {void} - Underlying resource released before accounting changes.
	 */
	_releaseCandidateHandle(state, handle, bytes, dispose) {
		dispose();
		if (state.handles.delete(handle)) state.allocatedBytes -= bytes;
	}
	/** Called by candidate instrumentation to account one owned handle and idempotent successful release.
	 *
	 * @template {LocalSunGpuCandidateHandle} Handle
	 * @param {LocalSunGpuCandidateState} state - Owned candidate instrumentation.
	 * @param {Handle} handle - New live candidate resource.
	 * @param {number} bytes - Declared logical resource payload.
	 * @returns {Handle} - The same owned handle with observed disposal.
	 */
	_ownCandidateHandle(state, handle, bytes) {
		state.handles.add(handle);
		state.allocatedBytes += bytes;
		state.peakBytes = Math.max(state.peakBytes, state.allocatedBytes);
		const dispose = handle.dispose.bind(handle);
		handle.dispose = () => this._releaseCandidateHandle(state, handle, bytes, dispose);
		return handle;
	}

	/** Call this method to inject required staging/admission failures and verify owned-resource release.
	 *
	 * @param {LocalSunGpuCleanupProofRequest} request - Actual backend, prior cache and explicit physical-profile constructor.
	 * @returns {Promise<LocalSunGpuCleanupProofReport>} - Resource and prior-binding liveness observations.
	 */
	async verify({backend, priorCache, createProfile}) {
		let observations = [];
		const previousBytes =
			priorCache.resources.executor.residentFieldStorage.value +
			priorCache.resources.retainedAuxiliaryBytes.value;
		/** @type {readonly LocalSunGpuCleanupFault[]} */
		const faults = [
			'budget',
			'capability',
			'pre-abort',
			'compile',
			'allocation',
			'submission',
			'aux-upload',
			'cancel-after-compile',
		];
		for (const fault of faults) {
			let profile = createProfile(1);
			let algorithm = new Algorithm32({profile: profile.createExecutionProfile()});
			let originals = {
				compile: backend.compile.bind(backend),
				allocateField: backend.allocateField.bind(backend),
				submitLayer: backend.submitLayer.bind(backend),
				uploadImmutableTexture: backend.uploadImmutableTexture.bind(backend),
			};
			/** @type {LocalSunGpuCandidateState} */ const state = {
				handles: new Set(),
				allocatedBytes: 0,
				peakBytes: 0,
			};
			let allocations = 0,
				uploads = 0;
			const cancellation = new AbortController();
			if (fault === 'pre-abort') cancellation.abort();
			backend.compile =
				/** Called by candidate execution to inject compile/cancellation failure and account real program ownership.
				 *
				 * @param {CacheShader} shader - Owner-assembled candidate shader.
				 * @returns {Promise<CacheGpuProgram>} - Observed candidate program; injected failures reject before publication.
				 */ async (shader) => {
					if (fault === 'compile') throw new Error('Injected compilation failure');
					let handle = this._ownCandidateHandle(
						state,
						await originals.compile(shader),
						shader.bindings
							.filter((binding) => binding.spec.kind === 'data')
							.reduce(
								(sum, binding) =>
									sum + /** @type {CacheDataBinding} */ (binding).value.values.length * 4,
								0,
							) + 36,
					);
					if (fault === 'cancel-after-compile') cancellation.abort();
					return handle;
				};
			backend.allocateField =
				/** Called by candidate execution to inject allocation failure or account the real output field.
				 *
				 * @param {CacheFieldSpec} field - Actual physical output packing.
				 * @returns {GpuCacheField} - Observed candidate allocation.
				 */ (field) => {
					if (fault === 'allocation') throw new Error('Injected allocation failure');
					allocations++;
					return this._ownCandidateHandle(
						state,
						originals.allocateField(field),
						field.storage.width * field.storage.height * field.storage.layers * 4,
					);
				};
			backend.submitLayer =
				/** Called by candidate execution to inject a render failure before real submission.
				 *
				 * @param {CacheLayerSubmission} request - Actual candidate layer.
				 * @returns {void} - Layer submitted unless the selected fault rejects it.
				 */ (request) => {
					if (fault === 'submission') throw new Error('Injected submission failure');
					return originals.submitLayer(request);
				};
			backend.uploadImmutableTexture =
				/** Called by candidate publication to account auxiliary textures and inject a partial-upload failure.
				 *
				 * @param {CacheImmutableTextureUploadRequest} request - Owned exact auxiliary data.
				 * @returns {CacheImmutableTexture} - Observed live upload unless the selected fault rejects it.
				 */ (request) => {
					if (fault === 'aux-upload' && uploads++ === 2) throw new Error('Injected auxiliary upload failure');
					return this._ownCandidateHandle(
						state,
						originals.uploadImmutableTexture(request),
						request.values.byteLength,
					);
				};
			let candidateBackend =
				fault === 'capability'
					? Object.assign(Object.create(backend), {
							capabilities: {...backend.capabilities, maximumTextureSize: 1024},
						})
					: backend;
			let controller = profile.models.lightSource.createCacheController({
				model: algorithm._model,
				backend: candidateBackend,
			});
			let failure;
			try {
				await controller.createScatteringCache({
					signal: cancellation.signal,
					otherOwnedGpuBytes: {
						value: fault === 'budget' ? 1600000000 : previousBytes + 8 * 1024 ** 2,
						units: 'bytes',
					},
				});
				throw new Error('Expected candidate failure was not raised');
			} catch (error) {
				failure = String(error);
			} finally {
				controller.dispose();
				algorithm.dispose();
				Object.assign(backend, originals);
			}
			if (state.handles.size || state.allocatedBytes)
				throw new Error('Owned candidate resources leaked ' + fault);
			if (['budget', 'capability', 'pre-abort'].includes(fault) && allocations)
				throw new Error('Ingress/admission failure allocated GPU fields');
			if (
				!failure.includes(
					fault === 'pre-abort' || fault === 'cancel-after-compile'
						? 'AbortError'
						: fault === 'budget'
							? 'ceiling'
							: fault === 'capability'
								? 'capabilities'
								: 'Injected',
				)
			)
				throw new Error('Unexpected failure ' + fault + ': ' + failure);
			let uniforms = Object.fromEntries(
				priorCache.getRuntimeBindings().bindings.map((binding) => [binding.valueKey, {value: null}]),
			);
			backend.installRuntimeBindings({bindings: priorCache.getRuntimeBindings(), uniforms});
			observations.push({
				fault,
				failure,
				allocations,
				peakCandidateLogicalBytes: state.peakBytes,
				remainingCandidateHandles: state.handles.size,
				remainingCandidateBytes: state.allocatedBytes,
				priorBindingsRemainLive: true,
			});
			console.log('cleanup passed ' + fault);
		}
		return {observations};
	}
}
