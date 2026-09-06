import {GpuFieldExecutor} from './GpuFieldExecutor.js';
import {CUMULATIVE_SCATTERING_CACHE_VALUE_KEY} from './consts.js';

/** Scattering-plan adapter over the neutral scalar-field GPU executor. */
export class CacheGpuExecutor {
	/** Neutral scalar-field execution owner. @type {GpuFieldExecutor} */
	_executor;

	/**
	 * Creates the retained scattering executor over neutral field mechanics.
	 *
	 * @param {CacheGpuExecutorConfiguration} request - The scattering backend and pass assembler.
	 */
	constructor(request) {
		this._executor = new GpuFieldExecutor({
			backend: request.backend,
			assembler: {
				/**
				 * Called by neutral execution to assemble a retained scattering pass.
				 *
				 * @param {GpuFieldPass} pass - The scattering pass carried without neutral interpretation.
				 * @param {GpuFieldSpec} output - The executor-resolved output field.
				 * @returns {CacheShader} - The unchanged scattering cache shader.
				 */
				assemble(pass, output) {
					return request.assembler.assemble(/** @type {CachePass} */ (pass), output);
				},
			},
		});
	}

	/**
	 * Call this method to execute the retained scattering graph and bind its cumulative result. Execution rejects for invalid lifecycle, cancellation, backend, probe, scheduling, or cleanup failure; callers cancel through the supplied signal and must discard a rejected artifact.
	 *
	 * @param {CacheBuildPlan} plan - The complete source-owned scattering graph.
	 * @param {CacheExecutionOptions} [options] - Cancellation, scheduling, and bounded diagnostic probes.
	 * @returns {Promise<CacheBuildArtifact>} - The unchanged scattering staging artifact.
	 */
	execute(plan, options) {
		return this._executor.execute(
			{
				fields: plan.fields,
				passes: plan.passes,
				result: plan.result,
				valueKey: CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
			},
			options,
		);
	}

	/**
	 * Call this method to mark the scattering adapter unavailable without disposing its backend.
	 *
	 * @returns {void} - No value.
	 */
	dispose() {
		this._executor.dispose();
	}
}
