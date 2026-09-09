/// <reference path="./types.d.ts" />

/**
 * Call this function to compute the arithmetic mean of a non-empty number list.
 * @param {readonly number[]} values Values to aggregate.
 * @returns {number} Arithmetic mean.
 */
function mean(values) {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Call this function to select a nearest-rank percentile from a non-empty number list.
 * @param {readonly number[]} values Values to inspect.
 * @param {number} fraction Percentile fraction in the inclusive zero-to-one range.
 * @returns {number} Selected percentile.
 */
function percentile(values, fraction) {
	const sorted = [...values].sort((left, right) => left - right);
	return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}

/** Generic animation tracing and measurement-association operations. */
export const AnimationTrace = Object.freeze({
	/**
	 * Call this method to measure a caller-rendered animation on its real callback cadence.
	 * @param {AnimationEvidenceTraceConfiguration} configuration Caller-owned scheduler and renderer.
	 * @returns {Promise<readonly AnimationEvidenceTraceFrame[]>} Measured callback trace.
	 */
	async capture(configuration) {
		if (!configuration || typeof configuration !== 'object')
			throw new TypeError('Trace configuration is required.');
		if (!Number.isFinite(configuration.durationMicroseconds) || configuration.durationMicroseconds <= 0) {
			throw new TypeError('durationMicroseconds must be positive and finite.');
		}
		/** @type {AnimationEvidenceTraceFrame[]} */
		const frames = [];
		/** @type {number | null} */
		let animationStartMilliseconds = null;
		let requestIssuedMilliseconds = configuration.nowMilliseconds();
		/** @type {unknown} */
		let activeHandle = null;
		await new Promise((resolve, reject) => {
			/**
			 * Call this function when the caller-owned frame scheduler presents an animation callback.
			 * @param {number} callbackMilliseconds Scheduler timestamp.
			 * @returns {Promise<void>} Completion promise for this callback.
			 */
			const tick = async (callbackMilliseconds) => {
				try {
					if (animationStartMilliseconds === null) animationStartMilliseconds = callbackMilliseconds;
					const elapsedMicroseconds = Math.round((callbackMilliseconds - animationStartMilliseconds) * 1000);
					const state = configuration.stateAt(
						Math.min(configuration.durationMicroseconds, Math.max(0, elapsedMicroseconds)),
						configuration.durationMicroseconds,
					);
					const renderResult = await configuration.render(state, frames.length);
					const frame = {
						frameId: frames.length,
						requestIssuedMicroseconds:
							frames.length === 0
								? 0
								: Math.round((requestIssuedMilliseconds - animationStartMilliseconds) * 1000),
						animationCallbackMicroseconds: elapsedMicroseconds,
						state,
						renderResult,
					};
					frames.push(frame);
					await configuration.afterFrame?.(frame);
					if (elapsedMicroseconds >= configuration.durationMicroseconds) {
						activeHandle = null;
						resolve(undefined);
						return;
					}
					requestIssuedMilliseconds = configuration.nowMilliseconds();
					activeHandle = configuration.requestFrame((timestamp) => void tick(timestamp));
				} catch (error) {
					if (activeHandle !== null) configuration.cancelFrame?.(activeHandle);
					activeHandle = null;
					reject(error);
				}
			};
			activeHandle = configuration.requestFrame((timestamp) => void tick(timestamp));
		});
		return Object.freeze(frames.map((frame) => Object.freeze(frame)));
	},

	/**
	 * Call this method to associate asynchronous CPU/GPU measurement samples with traced frames.
	 * @param {readonly AnimationEvidenceTraceFrame[]} frames Trace frames to associate.
	 * @param {readonly unknown[]} samples Measurement samples.
	 * @param {(frame: AnimationEvidenceTraceFrame) => string | number} getFrameKey Frame key resolver.
	 * @param {(sample: unknown) => string | number | null} getSampleFrameKey Sample key resolver.
	 * @returns {readonly AnimationEvidenceTraceFrame[]} New annotated trace frames.
	 */
	associateSamples(frames, samples, getFrameKey, getSampleFrameKey) {
		const samplesByFrame = new Map();
		for (const sample of samples) {
			const key = getSampleFrameKey(sample);
			if (key === null) continue;
			const group = samplesByFrame.get(key) ?? [];
			group.push(sample);
			samplesByFrame.set(key, group);
		}
		return Object.freeze(
			frames.map((frame) =>
				Object.freeze({
					...frame,
					associatedSamples: Object.freeze(samplesByFrame.get(getFrameKey(frame)) ?? []),
				}),
			),
		);
	},

	/**
	 * Call this method to summarize callback cadence without treating recording work as performance evidence.
	 * @param {readonly AnimationEvidenceTraceFrame[]} frames Measured callback trace.
	 * @param {number} presentationFramesPerSecond Target presentation cadence.
	 * @returns {AnimationEvidenceCadenceSummary} Cadence summary.
	 */
	summarizeCadence(frames, presentationFramesPerSecond) {
		if (!Number.isInteger(presentationFramesPerSecond) || presentationFramesPerSecond <= 0) {
			throw new TypeError('presentationFramesPerSecond must be a positive integer.');
		}
		if (frames.length < 2) throw new RangeError('At least two trace frames are required.');
		const intervals = frames
			.slice(1)
			.map((frame, index) => frame.animationCallbackMicroseconds - frames[index].animationCallbackMicroseconds);
		if (!intervals.every((value) => Number.isFinite(value) && value >= 0)) {
			throw new RangeError('Trace timestamps must be finite and nondecreasing.');
		}
		const first = frames[0];
		const last = frames.at(-1);
		if (!first || !last) throw new RangeError('At least two trace frames are required.');
		const elapsed = last.animationCallbackMicroseconds - first.animationCallbackMicroseconds;
		const frameBudgetMicroseconds = 1_000_000 / presentationFramesPerSecond;
		const expectedPresentationSlotCount =
			Math.floor(last.animationCallbackMicroseconds / frameBudgetMicroseconds) + 1;
		return Object.freeze({
			frameCount: frames.length,
			expectedPresentationSlotCount,
			traceElapsedMicroseconds: last.animationCallbackMicroseconds,
			meanFramesPerSecond: elapsed > 0 ? ((frames.length - 1) * 1_000_000) / elapsed : null,
			missedPresentationSlots: Math.max(0, expectedPresentationSlotCount - frames.length),
			longestVisibleHoldMicroseconds: Math.max(...intervals),
			callbackCadence: Object.freeze({
				meanIntervalMicroseconds: mean(intervals),
				medianIntervalMicroseconds: percentile(intervals, 0.5),
				p95IntervalMicroseconds: percentile(intervals, 0.95),
				p99IntervalMicroseconds: percentile(intervals, 0.99),
			}),
		});
	},
});
