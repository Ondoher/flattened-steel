/// <reference path="./types.d.ts" />

/**
 * Call this function to require a contiguous, fixed-cadence mapping.
 * @param {readonly AnimationEvidenceReplayEntry[]} mapping Candidate replay mapping.
 * @returns {void}
 */
function validateMapping(mapping) {
	if (!Array.isArray(mapping) || mapping.length === 0) throw new TypeError('mapping must contain at least one slot.');
	if (!mapping.every((entry, index) => entry.slotIndex === index)) {
		throw new RangeError('mapping slot indexes must be contiguous and begin at zero.');
	}
	if (
		!mapping.every(
			(entry, index) =>
				Number.isFinite(entry.timestampMicroseconds) &&
				entry.timestampMicroseconds >= 0 &&
				(index === 0 || entry.timestampMicroseconds > mapping[index - 1].timestampMicroseconds),
		)
	) {
		throw new RangeError('mapping timestamps must be finite, non-negative, and strictly increasing.');
	}
}

/** Deterministic fixed-cadence canvas replay and recording orchestration. */
export class DeterministicCanvasRecorder {
	/** @type {AnimationEvidenceRecorderConfiguration} */
	#configuration;

	/**
	 * Creates a recorder around caller-owned rendering, canvas, encoding, and evidence callbacks.
	 * @param {AnimationEvidenceRecorderConfiguration} configuration Recorder configuration.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object')
			throw new TypeError('Recorder configuration is required.');
		validateMapping(configuration.mapping);
		if (!Number.isInteger(configuration.framesPerSecond) || configuration.framesPerSecond <= 0) {
			throw new TypeError('framesPerSecond must be a positive integer.');
		}
		if (!configuration.presentationCanvas) throw new TypeError('presentationCanvas is required.');
		if (!configuration.videoOutput) throw new TypeError('videoOutput is required.');
		this.#configuration = configuration;
	}

	/**
	 * Call this method to deterministically replay and record every configured presentation slot.
	 * @returns {Promise<AnimationEvidenceRecorderResult>} Recording result and caller-owned output result.
	 */
	async record() {
		const configuration = this.#configuration;
		const frameDurationSeconds = 1 / configuration.framesPerSecond;
		const shouldRender = configuration.shouldRender ?? ((entry) => !entry.heldFromPreviousSlot);
		const keyFrame = configuration.keyFrame ?? ((entry) => entry.slotIndex % configuration.framesPerSecond === 0);
		const progressIntervalFrames = configuration.progressIntervalFrames ?? configuration.framesPerSecond;
		if (!Number.isInteger(progressIntervalFrames) || progressIntervalFrames <= 0) {
			throw new TypeError('progressIntervalFrames must be a positive integer.');
		}
		let renderedSourceStateCount = 0;
		let heldOutputSlotCount = 0;
		const captures = [];
		await configuration.videoOutput.start();
		for (const entry of configuration.mapping) {
			if (shouldRender(entry)) {
				await configuration.render(entry, configuration.presentationCanvas);
				renderedSourceStateCount += 1;
			} else {
				heldOutputSlotCount += 1;
			}
			if (configuration.capture && configuration.captureSlots?.has(entry.slotIndex)) {
				captures.push(
					Object.freeze({
						slotIndex: entry.slotIndex,
						result: await configuration.capture(entry, configuration.presentationCanvas),
					}),
				);
			}
			await configuration.videoOutput.addFrame(
				configuration.presentationCanvas,
				entry.timestampMicroseconds / 1_000_000,
				frameDurationSeconds,
				{keyFrame: keyFrame(entry)},
			);
			if (
				configuration.reportProgress &&
				((entry.slotIndex + 1) % progressIntervalFrames === 0 ||
					entry.slotIndex === configuration.mapping.length - 1)
			) {
				await configuration.reportProgress(entry.slotIndex + 1, configuration.mapping.length);
			}
		}
		await configuration.videoOutput.finalize();
		return Object.freeze({
			frameCount: configuration.mapping.length,
			renderedSourceStateCount,
			heldOutputSlotCount,
			captures: Object.freeze(captures),
			output: await configuration.videoOutput.getResult(),
		});
	}
}
