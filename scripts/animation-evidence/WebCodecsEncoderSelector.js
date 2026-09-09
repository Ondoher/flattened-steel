/// <reference path="./types.d.ts" />

/**
 * Call this function to convert bytes to a browser-safe base64 string.
 * @param {Uint8Array} bytes Bytes to encode.
 * @returns {string} Base64 representation.
 */
function bytesToBase64(bytes) {
	let binary = '';
	for (let index = 0; index < bytes.length; index += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
	}
	return btoa(binary);
}

/**
 * Call this function to project a browser-resolved encoder configuration into stable evidence fields.
 * @param {VideoEncoderConfig} configuration Encoder configuration.
 * @returns {Readonly<Record<string, unknown>>} Stable configuration projection.
 */
function normalizedConfiguration(configuration) {
	return Object.freeze({
		codec: configuration.codec,
		width: configuration.width,
		height: configuration.height,
		bitrate: configuration.bitrate,
		framerate: configuration.framerate,
		hardwareAcceleration: configuration.hardwareAcceleration,
		latencyMode: configuration.latencyMode,
		bitrateMode: configuration.bitrateMode,
		scalabilityMode: configuration.scalabilityMode,
		alpha: configuration.alpha,
		avc: configuration.avc,
	});
}

/**
 * Call this function to probe one supported WebCodecs configuration with an encoded frame.
 * @param {AnimationEvidenceEncoderCandidate} candidate Candidate to test.
 * @returns {Promise<AnimationEvidenceEncoderProbe>} Probe outcome.
 */
async function probe(candidate) {
	const support = await VideoEncoder.isConfigSupported(candidate.config);
	if (!support.supported) return Object.freeze({id: candidate.id, supported: false, configured: false});
	const resolvedConfig = support.config;
	if (!resolvedConfig) throw new Error(`WebCodecs returned no resolved configuration for ${candidate.id}.`);
	const canvas = new OffscreenCanvas(resolvedConfig.width, resolvedConfig.height);
	const context = canvas.getContext('2d', {alpha: false});
	if (!context) throw new Error('Could not create the encoder-probe canvas.');
	context.fillStyle = '#5d7690';
	context.fillRect(0, 0, canvas.width, canvas.height);
	let outputCount = 0;
	let outputByteLength = 0;
	let decoderConfig = null;
	let encodingError = null;
	const encoder = new VideoEncoder({
		output: (chunk, metadata) => {
			outputCount += 1;
			outputByteLength += chunk.byteLength;
			if (metadata?.decoderConfig) {
				const description = metadata.decoderConfig.description;
				decoderConfig = Object.freeze({
					codec: metadata.decoderConfig.codec,
					codedWidth: metadata.decoderConfig.codedWidth,
					codedHeight: metadata.decoderConfig.codedHeight,
					descriptionBase64: description
						? bytesToBase64(new Uint8Array(/** @type {ArrayBuffer} */ (description)))
						: null,
				});
			}
		},
		error: (error) => {
			encodingError = Object.freeze({name: error.name, message: error.message});
		},
	});
	try {
		encoder.configure(resolvedConfig);
		const frame = new VideoFrame(canvas, {timestamp: 0, duration: 16_667, alpha: 'discard'});
		encoder.encode(frame, {keyFrame: true});
		frame.close();
		await encoder.flush();
		return Object.freeze({
			id: candidate.id,
			supported: true,
			configured: encodingError === null && outputCount === 1 && outputByteLength > 0,
			requestedConfig: normalizedConfiguration(candidate.config),
			resolvedConfig: normalizedConfiguration(resolvedConfig),
			outputCount,
			outputByteLength,
			decoderConfig,
			encodingError,
		});
	} catch (error) {
		return Object.freeze({
			id: candidate.id,
			supported: true,
			configured: false,
			requestedConfig: normalizedConfiguration(candidate.config),
			resolvedConfig: normalizedConfiguration(resolvedConfig),
			encodingError: Object.freeze({
				name: error instanceof Error ? error.name : 'Error',
				message: error instanceof Error ? error.message : String(error),
			}),
		});
	} finally {
		encoder.close();
	}
}

/** WebCodecs capability selection that proves a candidate by encoding one frame. */
export const WebCodecsEncoderSelector = Object.freeze({
	/**
	 * Call this method to choose the first candidate that successfully encodes a probe frame.
	 * @param {readonly AnimationEvidenceEncoderCandidate[]} candidates Ordered candidate policy owned by the caller.
	 * @returns {Promise<Readonly<{selectedCandidateId: string; selectedConfig: Readonly<Record<string, unknown>>; outcomes: readonly AnimationEvidenceEncoderProbe[]}>>} Selected configuration and complete probe evidence.
	 */
	async select(candidates) {
		if (typeof VideoEncoder !== 'function' || typeof VideoFrame !== 'function') {
			throw new Error('WebCodecs VideoEncoder and VideoFrame are required.');
		}
		if (!Array.isArray(candidates) || candidates.length === 0) {
			throw new TypeError('At least one encoder candidate is required.');
		}
		const outcomes = [];
		for (const candidate of candidates) {
			if (!candidate.id || !candidate.config)
				throw new TypeError('Every encoder candidate needs an id and config.');
			const outcome = await probe(candidate);
			outcomes.push(outcome);
			if (outcome.configured === true) {
				return Object.freeze({
					selectedCandidateId: candidate.id,
					selectedConfig: normalizedConfiguration(candidate.config),
					outcomes: Object.freeze(outcomes),
				});
			}
		}
		throw new Error(`No WebCodecs candidate encoded a probe frame: ${JSON.stringify(outcomes)}`);
	},
});
