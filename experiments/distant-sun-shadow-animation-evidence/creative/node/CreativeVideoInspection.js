/**
 * Called by video inspection to await loaded media data with bounded failure and cleanup.
 *
 * @param {HTMLVideoElement} video - Paused browser decoder.
 * @returns {Promise<void>} - First video frame availability.
 */
function waitForLoadedData(video) {
	return new Promise((resolve, reject) => {
		/**
		 * Called by every completion branch to remove pending listeners and timers.
		 *
		 * @returns {void} - Released event resources.
		 */
		const cleanup = () => {
			clearTimeout(timeout);
			video.removeEventListener('loadeddata', loaded);
			video.removeEventListener('error', failed);
		};
		/**
		 * Called by the decoder when its first frame is available.
		 *
		 * @returns {void} - Resolved frame availability.
		 */
		const loaded = () => {
			cleanup();
			resolve();
		};
		/**
		 * Called by the decoder when media initialization fails.
		 *
		 * @returns {void} - Rejected media initialization.
		 */
		const failed = () => {
			cleanup();
			reject(new Error(`Creative video decode failed: ${video.error?.message ?? video.error?.code}.`));
		};
		const timeout = setTimeout(() => {
			cleanup();
			reject(new Error('Creative video loading timed out.'));
		}, 60_000);
		video.addEventListener('loadeddata', loaded, {once: true});
		video.addEventListener('error', failed, {once: true});
	});
}

/**
 * Called by inspection to seek and require compositor metadata for the exact intended decoded frame.
 *
 * @param {HTMLVideoElement} video - Visible paused native video decoder.
 * @param {number} frameIndex - Desired zero-based presentation frame.
 * @returns {Promise<CreativeVerificationPresentedFrame>} - Exact decoded frame timing facts.
 */
function seekPresentedFrame(video, frameIndex) {
	const expectedSeconds = frameIndex / 30;
	const requestedSeconds = (frameIndex + 0.5) / 30;
	return new Promise((resolve, reject) => {
		let callbackHandle = 0;
		/**
		 * Called by all seek completion branches to release the pending callback and deadline.
		 *
		 * @returns {void} - Released media callback resources.
		 */
		const cleanup = () => {
			clearTimeout(timeout);
			video.cancelVideoFrameCallback(callbackHandle);
			video.removeEventListener('error', failed);
		};
		/**
		 * Called by a decoder error during a seek.
		 *
		 * @returns {void} - Rejected seek operation.
		 */
		const failed = () => {
			cleanup();
			reject(new Error(`Creative frame ${frameIndex} could not be decoded.`));
		};
		/**
		 * Called by the compositor for each presented frame until the exact requested timestamp appears.
		 *
		 * @param {number} _now - Browser high-resolution callback timestamp in milliseconds.
		 * @param {VideoFrameCallbackMetadata} metadata - Decoded frame presentation facts.
		 * @returns {void} - Accepted target frame or scheduled next callback.
		 */
		const presented = (_now, metadata) => {
			if (Math.abs(metadata.mediaTime - expectedSeconds) <= 0.000002) {
				cleanup();
				resolve({
					frameIndex,
					requestedSeconds,
					mediaTimeSeconds: metadata.mediaTime,
					resolvedSeconds: video.currentTime,
					readyState: video.readyState,
				});
			} else callbackHandle = video.requestVideoFrameCallback(presented);
		};
		const timeout = setTimeout(() => {
			cleanup();
			reject(new Error(`Exact decoded creative frame ${frameIndex} was not presented before timeout.`));
		}, 60_000);
		video.addEventListener('error', failed, {once: true});
		callbackHandle = video.requestVideoFrameCallback(presented);
		video.currentTime = requestedSeconds;
	});
}

/**
 * Called by browser inspection to summarize actual decoded pixels at a fixed small diagnostic resolution.
 *
 * @param {HTMLCanvasElement} canvas - Native decoded frame canvas.
 * @returns {CreativeVerificationPixels} - Display-code statistics and deterministic sample pixels.
 */
function inspectPixels(canvas) {
	const probe = document.createElement('canvas');
	probe.width = 480;
	probe.height = 270;
	const context = probe.getContext('2d', {willReadFrequently: true});
	if (!context) throw new Error('Creative pixel inspection requires a 2D context.');
	context.drawImage(canvas, 0, 0, probe.width, probe.height);
	const data = context.getImageData(0, 0, probe.width, probe.height).data;
	let lumaSum = 0;
	let minimumLuma = 255;
	let maximumLuma = 0;
	let litPixels = 0;
	const colors = new Set();
	for (let offset = 0; offset < data.length; offset += 4) {
		const luma = 0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2];
		lumaSum += luma;
		minimumLuma = Math.min(minimumLuma, luma);
		maximumLuma = Math.max(maximumLuma, luma);
		if (luma >= 8) litPixels += 1;
		colors.add((data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2]);
	}
	return {
		width: probe.width,
		height: probe.height,
		meanLuma: lumaSum / (probe.width * probe.height),
		minimumLuma,
		maximumLuma,
		litPixelFraction: litPixels / (probe.width * probe.height),
		uniqueColors: colors.size,
		rgba: data,
	};
}

/**
 * Called by opening-night inspection to measure every native pixel without downsampling.
 * The transient RGBA read is bounded to one native-4K frame and is not retained in the result.
 *
 * @param {HTMLCanvasElement} canvas - Exact native decoded or original frame.
 * @returns {CreativeVerificationNativeStars} - Native star brightness and pixel-count diagnostics.
 */
function inspectNativeStars(canvas) {
	if (canvas.width !== 3840 || canvas.height !== 2160)
		throw new Error('Native star inspection requires one 4K frame.');
	const context = canvas.getContext('2d', {willReadFrequently: true});
	if (!context) throw new Error('Native star inspection requires a 2D context.');
	const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
	let peakRgbCodeValue = 0;
	let nonblackPixelCount = 0;
	let brightPixelCount = 0;
	let integratedRgbCodeValue = 0;
	for (let offset = 0; offset < rgba.length; offset += 4) {
		const maximum = Math.max(rgba[offset], rgba[offset + 1], rgba[offset + 2]);
		peakRgbCodeValue = Math.max(peakRgbCodeValue, maximum);
		if (maximum > 0) nonblackPixelCount += 1;
		if (maximum >= 32) brightPixelCount += 1;
		integratedRgbCodeValue += rgba[offset] + rgba[offset + 1] + rgba[offset + 2];
	}
	return {
		width: canvas.width,
		height: canvas.height,
		brightThresholdRgbCodeValue: 32,
		peakRgbCodeValue,
		nonblackPixelCount,
		brightPixelCount,
		integratedRgbCodeValue,
	};
}

/**
 * Called by opening-night inspection to detect complete disappearance or major native-star collapse.
 * Source-relative thresholds tolerate lossy AVC changes while rejecting a black or severely depleted night frame.
 *
 * @param {CreativeVerificationNativeStars} source - Original lossless native star measurements.
 * @param {CreativeVerificationNativeStars} decoded - Native measurements after AVC decoding.
 * @returns {CreativeVerificationStarPreservation} - Recorded source/decoded metrics, ratios, thresholds, and acceptance.
 */
function compareNativeStars(source, decoded) {
	const thresholds = {minimumPeakRatio: 0.35, minimumBrightPixelRatio: 0.25, minimumIntegratedRgbRatio: 0.25};
	const peakRatio = source.peakRgbCodeValue > 0 ? decoded.peakRgbCodeValue / source.peakRgbCodeValue : 0;
	const brightPixelRatio = source.brightPixelCount > 0 ? decoded.brightPixelCount / source.brightPixelCount : 0;
	const integratedRgbRatio =
		source.integratedRgbCodeValue > 0 ? decoded.integratedRgbCodeValue / source.integratedRgbCodeValue : 0;
	return {
		source,
		decoded,
		thresholds,
		peakRatio,
		brightPixelRatio,
		integratedRgbRatio,
		accepted:
			source.brightPixelCount > 0 &&
			decoded.brightPixelCount > 0 &&
			peakRatio >= thresholds.minimumPeakRatio &&
			brightPixelRatio >= thresholds.minimumBrightPixelRatio &&
			integratedRgbRatio >= thresholds.minimumIntegratedRgbRatio,
	};
}

/**
 * Called by inspection to decode one retained lossless parent capture for compression comparison.
 *
 * @param {string} imageUrl - Validated immutable parent capture URL.
 * @returns {Promise<HTMLImageElement>} - Decoded original lossless frame.
 */
async function loadSourceImage(imageUrl) {
	const image = new Image();
	image.src = imageUrl;
	await image.decode();
	return image;
}

/** Independent browser decoding, exact-frame seeking, and lossless inspection capture. */
export const CreativeVideoInspection = {
	/**
	 * Call this method to inspect exact decoded frames from the immutable parent MP4.
	 * The Node caller owns all artifact writes through the dedicated capture callback.
	 *
	 * @param {CreativeVerificationBrowserConfiguration} configuration - Validated parent video and checkpoint URLs.
	 * @returns {Promise<CreativeVerificationBrowserResult>} - Native browser metadata and decoded image comparisons.
	 */
	async inspect(configuration) {
		const video = document.createElement('video');
		video.muted = true;
		video.preload = 'auto';
		video.style.width = '960px';
		video.style.height = '540px';
		document.body.append(video);
		try {
			const loaded = waitForLoadedData(video);
			video.src = configuration.videoUrl;
			video.load();
			await loaded;
			if (video.videoWidth !== 3840 || video.videoHeight !== 2160 || Math.abs(video.duration - 60) > 0.000002) {
				throw new Error('Browser-decoded creative video metadata differs from native 4K and sixty seconds.');
			}
			const canvas = document.createElement('canvas');
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			const context = canvas.getContext('2d', {willReadFrequently: true});
			if (!context) throw new Error('Creative decoded capture requires a native 2D canvas.');
			if (configuration.checkpoints[0]?.frameIndex === 0) await seekPresentedFrame(video, 1);
			/** @type {CreativeVerificationCheckpointResult[]} */
			const checkpoints = [];
			for (const checkpoint of configuration.checkpoints) {
				await window.__creativeVerifyProgress({
					phase: 'decode-checkpoints',
					message: `Decoding presentation frame ${checkpoint.frameIndex}.`,
					completed: checkpoints.length,
					total: configuration.checkpoints.length,
				});
				const presentation = await seekPresentedFrame(video, checkpoint.frameIndex);
				context.drawImage(video, 0, 0, canvas.width, canvas.height);
				const decoded = inspectPixels(canvas);
				const decodedNativeStars = checkpoint.frameIndex === 0 ? inspectNativeStars(canvas) : undefined;
				const capture = await window.__creativeVerifyCapture(
					`decoded-frame-${String(checkpoint.frameIndex).padStart(4, '0')}`,
					canvas.toDataURL('image/png'),
				);
				let meanAbsoluteRgbDifference;
				/** @type {CreativeVerificationStarPreservation | undefined} */
				let nativeStarPreservation;
				if (checkpoint.sourceCaptureUrl) {
					const original = await loadSourceImage(checkpoint.sourceCaptureUrl);
					if (original.naturalWidth !== 3840 || original.naturalHeight !== 2160)
						throw new Error('Parent checkpoint dimensions changed.');
					context.drawImage(original, 0, 0, canvas.width, canvas.height);
					if (decodedNativeStars)
						nativeStarPreservation = compareNativeStars(inspectNativeStars(canvas), decodedNativeStars);
					const source = inspectPixels(canvas);
					let difference = 0;
					for (let offset = 0; offset < decoded.rgba.length; offset += 4) {
						for (let component = 0; component < 3; component += 1)
							difference += Math.abs(decoded.rgba[offset + component] - source.rgba[offset + component]);
					}
					meanAbsoluteRgbDifference = difference / (decoded.width * decoded.height * 3);
					if (meanAbsoluteRgbDifference > 15)
						throw new Error(
							`Decoded frame ${checkpoint.frameIndex} differs substantially from its lossless source (${meanAbsoluteRgbDifference}).`,
						);
				}
				const {rgba: _rgba, ...pixels} = decoded;
				checkpoints.push({
					...presentation,
					capture,
					pixels,
					sourceCapture: checkpoint.sourceCapture,
					meanAbsoluteRgbDifference,
					nativeStarPreservation,
				});
			}
			return {
				videoWidth: video.videoWidth,
				videoHeight: video.videoHeight,
				durationSeconds: video.duration,
				checkpoints,
			};
		} finally {
			video.removeAttribute('src');
			video.load();
			video.remove();
		}
	},
};
