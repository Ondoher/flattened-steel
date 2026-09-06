import {TimeMath} from '../../time/TimeMath.js';

/**
 * Optional pass-local performance timer for Algorithm32 shader diagnostics.
 */
export class ShaderPassPerformanceTimer {
	/**
	 * Value that tracks globally unique sample ids for callback correlation.
	 *
	 * @type {number}
	 *
	 */
	static _nextSampleId = 1;

	/**
	 * Value that stores the pass name reported to callbacks.
	 *
	 * @type {string}
	 *
	 */
	_passName;

	/**
	 * Value that stores the caller-provided performance callback.
	 *
	 * @type {Function}
	 *
	 */
	_callback;

	/**
	 * Value that stores pending GPU timer queries.
	 *
	 * @type {Array<object>}
	 *
	 */
	_pendingQueries = [];

	/**
	 * Value that stores accepted CPU start timestamps by active sample.
	 *
	 * @type {WeakMap<object, Duration>}
	 *
	 */
	_cpuStartTimes = new WeakMap();

	/**
	 * Value that stores cached timer-query support.
	 *
	 * @type {object | null | undefined}
	 *
	 */
	_querySupport;

	/**
	 * Value that stores how often pass invocations should create a measured sample.
	 *
	 * @type {number}
	 *
	 */
	_sampleIntervalFrames;

	/**
	 * Value that stores the maximum unresolved GPU timer queries this timer may hold.
	 *
	 * @type {number}
	 *
	 */
	_maxPendingQueries;

	/**
	 * Count pass invocations for sampling cadence.
	 *
	 * @type {number}
	 */
	_frameIndex = 0;

	/**
	 * Creates an optional shader pass performance timer.
	 *
	 * @param {object} configuration - Supplies pass name and callback.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('Shader pass performance timer configuration is required.');
		}

		this._passName = configuration.passName;
		this._callback = configuration.performanceCallback;
		this._sampleIntervalFrames = this._optionalPositiveInteger(
			configuration.sampleIntervalFrames,
			1,
			'sampleIntervalFrames',
		);
		this._maxPendingQueries = this._optionalPositiveInteger(
			configuration.maxPendingQueries,
			1,
			'maxPendingQueries',
		);
	}

	/**
	 * Value that returns true when a callback should receive samples.
	 *
	 * @returns {boolean} - True when enabled.
	 */
	get enabled() {
		return typeof this._callback === 'function';
	}

	/**
	 * Called by the constructor to accept a positive integer option or default an absent value.
	 *
	 * @param {unknown} value - Supplies the candidate value.
	 * @param {number} fallback - Supplies the fallback.
	 * @param {string} label - Supplies the option name.
	 * @returns {number} - The accepted positive integer.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_optionalPositiveInteger(value, fallback, label) {
		if (value === undefined) {
			return fallback;
		}

		if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
			throw new RangeError(`${label} must be a positive integer when supplied.`);
		}

		return value;
	}

	/**
	 * Called by shader pass performance timer to emit one sample without letting callback failures affect rendering.
	 *
	 * @param {object} sample - Supplies sample fields.
	 * @returns {void} -
	 */
	_emit(sample) {
		try {
			this._callback({
				passName: this._passName,
				timestamp: TimeMath.durationFromMilliseconds(TimeMath.nowMilliseconds()),
				...sample,
			});
		} catch {
			// Performance callbacks must never affect rendering.
		}
	}

	/**
	 * Called by shader pass performance timer to resolve WebGL2 timer-query support for the renderer. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {unknown} renderer - Supplies the active renderer.
	 * @returns {object | null} - Return support packet or null.
	 */
	_resolveQuerySupport(renderer) {
		if (this._querySupport !== undefined) {
			return this._querySupport;
		}

		const rendererCandidate = /** @type {{ getContext?: () => WebGL2RenderingContext }} */ (renderer);
		const webGlContext =
			typeof rendererCandidate?.getContext === 'function' ? rendererCandidate.getContext() : null;
		const extension = webGlContext?.getExtension?.('EXT_disjoint_timer_query_webgl2');

		if (
			!webGlContext ||
			!extension ||
			typeof webGlContext.createQuery !== 'function' ||
			typeof webGlContext.beginQuery !== 'function' ||
			typeof webGlContext.endQuery !== 'function' ||
			typeof webGlContext.getQueryParameter !== 'function' ||
			typeof webGlContext.deleteQuery !== 'function'
		) {
			this._querySupport = null;
			return null;
		}

		this._querySupport = {
			gl: webGlContext,
			timeElapsed: extension.TIME_ELAPSED_EXT,
			disjoint: extension.GPU_DISJOINT_EXT,
			resultAvailable: webGlContext.QUERY_RESULT_AVAILABLE,
			result: webGlContext.QUERY_RESULT,
		};

		return this._querySupport;
	}

	/**
	 * Call this method to poll pending GPU queries and emit resolved elapsed-time samples.
	 *
	 * @param {unknown} renderer - Supplies the active renderer.
	 * @returns {void} -
	 */
	poll(renderer) {
		if (!this.enabled || this._pendingQueries.length === 0) {
			return;
		}

		const remaining = [];

		for (const entry of this._pendingQueries) {
			const {gl: webGlContext, resultAvailable, result, disjoint} = entry.support;

			if (!webGlContext.getQueryParameter(entry.query, resultAvailable)) {
				remaining.push(entry);
				continue;
			}

			const isDisjoint = Boolean(webGlContext.getParameter(disjoint));
			const elapsedNanoseconds = webGlContext.getQueryParameter(entry.query, result);

			webGlContext.deleteQuery(entry.query);
			this._emit({
				event: 'gpu-elapsed',
				sampleId: entry.sampleId,
				gpuAvailable: true,
				disjoint: isDisjoint,
				gpuDuration: isDisjoint ? null : TimeMath.durationFromNanoseconds(elapsedNanoseconds),
				...entry.metadata,
			});
		}

		this._pendingQueries = remaining;
		this._resolveQuerySupport(renderer);
	}

	/**
	 * Call this method to begin timing one pass invocation. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {unknown} renderer - Supplies the active renderer.
	 * @param {object} [metadata] - Supplies sample metadata.
	 * @returns {object | null} - Return active timing state.
	 */
	begin(renderer, metadata = {}) {
		if (!this.enabled) {
			return null;
		}

		this.poll(renderer);
		this._frameIndex += 1;

		if ((this._frameIndex - 1) % this._sampleIntervalFrames !== 0) {
			return null;
		}

		if (this._pendingQueries.length >= this._maxPendingQueries) {
			return null;
		}

		const support = this._resolveQuerySupport(renderer);
		const sample = {
			id: ShaderPassPerformanceTimer._nextSampleId,
			metadata,
			query: null,
			support,
		};
		this._cpuStartTimes.set(sample, TimeMath.durationFromMilliseconds(TimeMath.nowMilliseconds()));

		ShaderPassPerformanceTimer._nextSampleId += 1;

		if (support) {
			try {
				sample.query = support.gl.createQuery();
				support.gl.beginQuery(support.timeElapsed, sample.query);
			} catch (error) {
				sample.query = null;
				this._emit({
					event: 'gpu-query-error',
					sampleId: sample.id,
					gpuAvailable: false,
					errorMessage: error instanceof Error ? error.message : String(error),
					...metadata,
				});
			}
		}

		return sample;
	}

	/**
	 * Call this method to end timing one pass invocation and emit the immediate CPU sample.
	 *
	 * @param {unknown} renderer - Supplies the active renderer.
	 * @param {object | null} sample - Supplies active timing state.
	 * @param {object} [metadata] - Supplies completion metadata.
	 * @returns {void} -
	 */
	end(renderer, sample, metadata = {}) {
		if (!sample || !this.enabled) {
			return;
		}

		const cpuStart = this._cpuStartTimes.get(sample);
		const cpuSubmitSeconds = cpuStart ? TimeMath.nowMilliseconds() / 1000 - cpuStart.value : 0;
		this._cpuStartTimes.delete(sample);
		const mergedMetadata = {
			...sample.metadata,
			...metadata,
		};

		if (sample.query && sample.support) {
			try {
				sample.support.gl.endQuery(sample.support.timeElapsed);
				this._pendingQueries.push({
					query: sample.query,
					support: sample.support,
					sampleId: sample.id,
					metadata: mergedMetadata,
				});
			} catch (error) {
				sample.support.gl.deleteQuery(sample.query);
				this._emit({
					event: 'gpu-query-error',
					sampleId: sample.id,
					gpuAvailable: false,
					errorMessage: error instanceof Error ? error.message : String(error),
					...mergedMetadata,
				});
			}
		}

		this._emit({
			event: 'cpu-submit',
			sampleId: sample.id,
			cpuSubmitDuration: TimeMath.durationInSeconds(cpuSubmitSeconds),
			gpuAvailable: Boolean(sample.support),
			...mergedMetadata,
		});
		this.poll(renderer);
	}

	/**
	 * Call this method to dispose pending GPU timer queries.
	 *
	 * @returns {void} -
	 */
	dispose() {
		for (const entry of this._pendingQueries) {
			try {
				entry.support?.gl?.deleteQuery?.(entry.query);
			} catch {
				// Timer cleanup is best-effort during teardown.
			}
		}

		this._pendingQueries = [];
		this._cpuStartTimes = new WeakMap();
		this._callback = null;
	}
}
