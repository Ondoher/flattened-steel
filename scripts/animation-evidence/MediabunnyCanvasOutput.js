/// <reference path="./types.d.ts" />

/** A caller-injected Mediabunny MP4 adapter for deterministic canvas recording. */
export class MediabunnyCanvasOutput {
	/** @type {AnimationEvidenceMediabunnyModule} */
	#module;
	/** @type {CanvasImageSource} */
	#canvas;
	/** @type {WritableStream<Uint8Array>} */
	#writable;
	/** @type {AnimationEvidenceMediabunnyOutputConfiguration} */
	#configuration;
	/** @type {AnimationEvidenceMediabunnyOutput | null} */
	#output = null;
	/** @type {AnimationEvidenceMediabunnyCanvasSource | null} */
	#videoSource = null;
	/** @type {Readonly<Record<string, unknown>>[]} */
	#encoderConfigurations = [];
	/** @type {Readonly<Record<string, unknown>>[]} */
	#packets = [];
	/** @type {string | null} */
	#mimeType = null;
	/** Cancellation has been requested exactly once. */
	#aborted = false;

	/**
	 * Creates a Mediabunny adapter without importing or pinning the caller's module.
	 *
	 * @param {AnimationEvidenceMediabunnyOutputConfiguration} configuration Caller-owned muxer and codec policy.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object')
			throw new TypeError('Mediabunny output configuration is required.');
		if (!configuration.mediabunny || !configuration.canvas || !configuration.writable) {
			throw new TypeError('mediabunny, canvas, and writable are required.');
		}
		if (!Number.isInteger(configuration.framesPerSecond) || configuration.framesPerSecond <= 0) {
			throw new TypeError('framesPerSecond must be a positive integer.');
		}
		this.#module = configuration.mediabunny;
		this.#canvas = configuration.canvas;
		this.#writable = configuration.writable;
		this.#configuration = configuration;
	}

	/**
	 * Call this method to initialize the fragmented MP4 output and canvas video track.
	 *
	 * @returns {Promise<void>} Start completion promise.
	 */
	async start() {
		if (this.#output) throw new Error('Mediabunny output has already started.');
		const {AppendOnlyStreamTarget, CanvasSource, Mp4OutputFormat, Output, Quality} = this.#module;
		this.#output = new Output({
			format: new Mp4OutputFormat({fastStart: 'fragmented', minimumFragmentDuration: 1}),
			target: new AppendOnlyStreamTarget(this.#writable),
		});
		this.#videoSource = new CanvasSource(this.#canvas, {
			codec: this.#configuration.codec,
			quality: new Quality({
				bitrate: this.#configuration.bitrate,
				bitrateMode: this.#configuration.bitrateMode ?? 'variable',
			}),
			keyFrameInterval: this.#configuration.keyFrameIntervalSeconds ?? 1,
			sizeChangeBehavior: 'deny',
			alpha: 'discard',
			latencyMode: this.#configuration.latencyMode ?? 'quality',
			hardwareAcceleration: this.#configuration.hardwareAcceleration ?? 'no-preference',
			fullCodecString: this.#configuration.fullCodecString,
			contentHint: 'detail',
			onEncoderConfig: (/** @type {Readonly<Record<string, unknown>>} */ config) =>
				this.#encoderConfigurations.push({...config}),
			onEncodedPacket: (packet) =>
				this.#packets.push({
					packetIndex: this.#packets.length,
					type: packet.type,
					timestampMicroseconds: packet.microsecondTimestamp,
					durationMicroseconds: packet.microsecondDuration,
					sequenceNumber: packet.sequenceNumber,
					byteLength: packet.byteLength,
				}),
		});
		this.#output.addVideoTrack(this.#videoSource, {frameRate: this.#configuration.framesPerSecond});
		if (this.#configuration.metadata) this.#output.setMetadataTags(this.#configuration.metadata);
		await this.#output.start();
	}

	/**
	 * Call this method to add the current canvas image at an exact media timestamp.
	 *
	 * @param {CanvasImageSource} canvas Presentation canvas; must be the configured canvas.
	 * @param {number} timestampSeconds Exact media timestamp in seconds.
	 * @param {number} durationSeconds Exact frame duration in seconds.
	 * @param {AnimationFrameEncodingOptions} options Frame encoding options.
	 * @returns {Promise<void>} Add completion promise.
	 */
	async addFrame(canvas, timestampSeconds, durationSeconds, options) {
		if (canvas !== this.#canvas) throw new Error('Mediabunny canvas identity changed during recording.');
		if (!this.#videoSource) throw new Error('Mediabunny output has not started.');
		await this.#videoSource.add(timestampSeconds, durationSeconds, options);
	}

	/**
	 * Call this method to finalize the MP4 container and its writable target.
	 *
	 * @returns {Promise<void>} Finalization completion promise.
	 */
	async finalize() {
		if (!this.#output) throw new Error('Mediabunny output has not started.');
		await this.#output.finalize();
		this.#mimeType = await this.#output.getMimeType();
	}

	/** Call this method to release the encoder and output target after recording failure.
	 *
	 * @returns {Promise<void>} - Cancellation and owned resource release complete.
	 */
	async abort() {
		if (!this.#output || this.#mimeType || this.#aborted) return;
		this.#aborted = true;
		await this.#output.cancel();
		this.#videoSource = null;
	}

	/**
	 * Call this method to read immutable codec, packet, and container evidence after finalization.
	 *
	 * @returns {Readonly<Record<string, unknown>>} Output evidence.
	 */
	getResult() {
		if (!this.#mimeType) throw new Error('Mediabunny output has not finalized.');
		return {
			mimeType: this.#mimeType,
			encoderConfigurations: [...this.#encoderConfigurations],
			packets: [...this.#packets],
		};
	}
}
