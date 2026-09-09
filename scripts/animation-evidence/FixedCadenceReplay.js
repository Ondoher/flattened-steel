/// <reference path="./types.d.ts" />

/**
 * Call this function to require a value and preserve its inferred type.
 * @template T
 * @param {T} value Value to require.
 * @param {string} message Failure message.
 * @returns {NonNullable<T>} Required value.
 */
function requireValue(value, message) {
	if (value === null || value === undefined || value === false) throw new Error(message);
	return /** @type {NonNullable<T>} */ (value);
}

/**
 * Call this function to require a positive integer.
 * @param {number} value Candidate value.
 * @param {string} label Public configuration label.
 * @returns {number} Validated value.
 */
function requirePositiveInteger(value, label) {
	if (!Number.isInteger(value) || value <= 0) throw new TypeError(`${label} must be a positive integer.`);
	return value;
}

/**
 * Call this function to compare source frame identifiers for an optional numeric advance.
 * @param {string | number | null} previous Previous identifier.
 * @param {string | number} current Current identifier.
 * @returns {number | null} Numeric advance when both identifiers are finite numbers.
 */
function frameAdvance(previous, current) {
	if (previous === null) return 0;
	return typeof previous === 'number' && typeof current === 'number' ? current - previous : null;
}

/** Deterministic fixed-cadence replay mapping operations. */
export const FixedCadenceReplay = Object.freeze({
	/**
	 * Call this method to map each fixed-cadence output slot to the latest measured frame not after it.
	 * @param {AnimationEvidenceReplayConfiguration} configuration Caller-owned mapping configuration.
	 * @returns {readonly AnimationEvidenceReplayEntry[]} Deterministic replay mapping.
	 */
	latestFrameAtOrBefore(configuration) {
		if (!configuration || typeof configuration !== 'object')
			throw new TypeError('Replay configuration is required.');
		const outputFrameCount = requirePositiveInteger(configuration.outputFrameCount, 'outputFrameCount');
		const outputFramesPerSecond = requirePositiveInteger(
			configuration.outputFramesPerSecond,
			'outputFramesPerSecond',
		);
		const frames = [...configuration.sourceFrames];
		requireValue(frames.length > 0, 'sourceFrames must contain at least one frame.');
		const timestamps = frames.map((frame) => configuration.getSourceTimestampMicroseconds(frame));
		if (!timestamps.every((value) => Number.isFinite(value) && value >= 0)) {
			throw new TypeError('Every source timestamp must be a finite non-negative number.');
		}
		if (!timestamps.every((value, index) => index === 0 || value >= timestamps[index - 1])) {
			throw new RangeError('Source timestamps must be nondecreasing.');
		}
		if (timestamps[0] !== 0) throw new RangeError('The source trace must begin at timestamp zero.');
		const mappingKind = configuration.mappingKind ?? 'trace-latest-frame-at-or-before-slot';
		const mappingEquationId = configuration.mappingEquationId ?? 'latest-source-not-after-rounded-slot-v1';
		let sourceIndex = 0;
		/** @type {string | number | null} */
		let previousSourceFrameId = null;
		return Object.freeze(
			Array.from({length: outputFrameCount}, (_, slotIndex) => {
				const timestampMicroseconds = Math.round((slotIndex * 1_000_000) / outputFramesPerSecond);
				while (sourceIndex + 1 < frames.length && timestamps[sourceIndex + 1] <= timestampMicroseconds) {
					sourceIndex += 1;
				}
				const frame = frames[sourceIndex];
				const sourceFrameId = configuration.getSourceFrameId(frame);
				const entry = Object.freeze({
					slotIndex,
					timestampMicroseconds,
					mappingKind,
					mappingEquationId,
					sourceFrameId,
					sourceAnimationCallbackMicroseconds: timestamps[sourceIndex],
					heldFromPreviousSlot: previousSourceFrameId === sourceFrameId,
					measuredFrameAdvance: frameAdvance(previousSourceFrameId, sourceFrameId),
					state: configuration.projectState(frame),
				});
				previousSourceFrameId = sourceFrameId;
				return entry;
			}),
		);
	},

	/**
	 * Call this method to summarize the visible holds and measured-frame use in a replay mapping.
	 * @param {readonly AnimationEvidenceReplayEntry[]} mapping Validated fixed-cadence mapping.
	 * @param {number} measuredFrameCount Number of frames in the parent trace.
	 * @param {number} outputFramesPerSecond Fixed output cadence.
	 * @returns {AnimationEvidenceReplaySummary} Mapping summary.
	 */
	summarize(mapping, measuredFrameCount, outputFramesPerSecond) {
		requirePositiveInteger(mapping.length, 'mapping.length');
		requirePositiveInteger(measuredFrameCount, 'measuredFrameCount');
		requirePositiveInteger(outputFramesPerSecond, 'outputFramesPerSecond');
		/** @type {{sourceFrameId: string | number; slotCount: number}[]} */
		const runs = [];
		for (const entry of mapping) {
			const active = runs.at(-1);
			if (active?.sourceFrameId === entry.sourceFrameId) active.slotCount += 1;
			else runs.push({sourceFrameId: entry.sourceFrameId, slotCount: 1});
		}
		const uniqueSourceFrameCount = new Set(mapping.map((entry) => entry.sourceFrameId)).size;
		const maximumConsecutiveSourceSlots = Math.max(...runs.map((run) => run.slotCount));
		const numericAdvances = mapping
			.map((entry) => entry.measuredFrameAdvance)
			.filter((value) => typeof value === 'number');
		const first = mapping[0];
		const last = mapping.at(-1);
		if (!first || !last) throw new RangeError('mapping must not be empty.');
		return Object.freeze({
			slotCount: mapping.length,
			uniqueSourceFrameCount,
			unusedMeasuredFrameCount: measuredFrameCount - uniqueSourceFrameCount,
			heldSlotCount: mapping.filter((entry) => entry.heldFromPreviousSlot).length,
			sourceAdvanceCount: mapping.filter((entry) => (entry.measuredFrameAdvance ?? 0) > 0).length,
			maximumMeasuredFrameAdvance: numericAdvances.length > 0 ? Math.max(...numericAdvances) : null,
			maximumConsecutiveSourceSlots,
			longestMappedVisibleHoldMicroseconds: Math.round(
				(maximumConsecutiveSourceSlots * 1_000_000) / outputFramesPerSecond,
			),
			firstSourceFrameId: first.sourceFrameId,
			lastSourceFrameId: last.sourceFrameId,
			lastSourceAnimationCallbackMicroseconds: last.sourceAnimationCallbackMicroseconds,
		});
	},
});
