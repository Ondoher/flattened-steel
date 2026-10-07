import {BoundedChunkSink, DeterministicCanvasRecorder, MediabunnyCanvasOutput, WebCodecsEncoderSelector} from '../../animation-evidence/index.js';

/** Original ideal-cadence recording workflow shared by live rendering and exact lossless replay. */
export class TheHoursRecorder {
	/** Creates a recorder around a caller-owned native presentation.
	 * @param {TheHoursRecorderConfiguration} configuration - Explicit source, cadence and encoder policy.
	 */
	constructor(configuration) {this._configuration = configuration;}

	/** Called by the original byte bridge to deliver bounded batches without argument-spread overflow.
	 * @param {Uint8Array} bytes - Complete bounded bytes.
	 * @returns {string} - Base64 bridge payload.
	 */
	_encodeBytes(bytes) {let binary = ''; for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)); return btoa(binary);}

	/** Call this method to record every original ideal slot through the retained reusable workflow.
	 * @returns {Promise<TheHoursRecordingResult>} - Complete codec, cadence and byte-delivery facts.
	 */
	async record() {
		const configuration = this._configuration, frameCount = configuration.durationSeconds * 30;
		const mediabunny = await import(configuration.mediabunnyModuleUrl);
		/** Declared high-profile AVC controls. @type {Omit<VideoEncoderConfig, 'codec'>} */
		const encoderConfig = {width: configuration.width, height: configuration.height, framerate: 30, bitrate: configuration.bitrate ?? 40_000_000, bitrateMode: 'variable', latencyMode: 'quality', avc: {format: 'avc'}};
		const candidates = configuration.hardwareAcceleration === 'prefer-software' ? [
			{id: 'avc-high-5.2-software', config: {...encoderConfig, codec: 'avc1.640034', hardwareAcceleration: 'prefer-software'}},
		] : [
			{id: 'avc-high-5.2-hardware', config: {...encoderConfig, codec: 'avc1.640034', hardwareAcceleration: 'prefer-hardware'}},
			{id: 'avc-high-5.2-auto', config: {...encoderConfig, codec: 'avc1.640034', hardwareAcceleration: 'no-preference'}},
		];
		const encoderSelection = await WebCodecsEncoderSelector.select(candidates);
		const chunks = new BoundedChunkSink({maximumBatchBytes: 4 * 1024 * 1024, publishBatch: (bytes, index) => window.__theHoursVideoChunk(index, this._encodeBytes(bytes)), finalize: () => window.__theHoursVideoFinalize()});
		const output = new MediabunnyCanvasOutput({mediabunny, canvas: configuration.presentation, writable: chunks.writable(), framesPerSecond: 30, codec: 'avc', fullCodecString: 'avc1.640034', hardwareAcceleration: String(encoderSelection.selectedConfig.hardwareAcceleration), bitrate: encoderConfig.bitrate,
			metadata: {title: 'The Hours — An Observatory of Light', comment: 'Algorithm32 sky and spectral illumination. Ideal offline choreography, not a runtime performance measurement.'}});
		const mapping = Array.from({length: frameCount}, (_value, slotIndex) => ({slotIndex, mappingKind: 'ideal-choreography', timestampMicroseconds: Math.round(slotIndex * 1_000_000 / 30), mappingEquationId: 'the-hours-ideal-cadence-v1', sourceFrameId: slotIndex,
			sourceAnimationCallbackMicroseconds: Math.round(slotIndex * 1_000_000 / 30), heldFromPreviousSlot: false, measuredFrameAdvance: slotIndex === 0 ? 0 : 1, state: {animationSeconds: (configuration.startSeconds * 30 + slotIndex) / 30}}));
		const captureSlots = configuration.capture ? new Set(configuration.durationSeconds === 60 ? [0, 7, 12, 18, 30, 42, 48, 53, 59].map((second) => second * 30).concat([110, 111, 112, 113, 114, 123, 124, 125, 126, 127]) : mapping.map((entry) => entry.slotIndex)) : new Set();
		const recording = await new DeterministicCanvasRecorder({mapping, framesPerSecond: 30, presentationCanvas: configuration.presentation, videoOutput: output, render: (entry) => configuration.render(/** @type {TheHoursReplayState} */ (entry.state).animationSeconds), captureSlots,
			capture: configuration.capture ? (entry) => configuration.capture(entry.slotIndex) : undefined, reportProgress: (completed, total) => window.__theHoursProgress({phase: 'record', completed, total})}).record();
		return {recording, encoderSelection, chunkSink: chunks.diagnostics()};
	}
}
