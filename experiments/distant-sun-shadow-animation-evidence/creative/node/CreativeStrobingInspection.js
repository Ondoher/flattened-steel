/**
 * Waits for the accepted creative film to expose its first decoded frame.
 *
 * @param {HTMLVideoElement} video - Contained browser decoder.
 * @returns {Promise<void>} Loaded media completion.
 */
function waitForVideo(video) {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error('Strobing diagnosis video load timed out.')), 60_000);
		video.addEventListener(
			'loadeddata',
			() => {
				clearTimeout(timeout);
				resolve();
			},
			{once: true},
		);
		video.addEventListener(
			'error',
			() => {
				clearTimeout(timeout);
				reject(new Error(`Strobing diagnosis video decode failed: ${video.error?.message ?? video.error?.code}.`));
			},
			{once: true},
		);
	});
}

/**
 * Seeks to one exact presentation frame and checks the compositor timestamp.
 *
 * @param {HTMLVideoElement} video - Paused browser decoder.
 * @param {number} frameIndex - Zero-based 30-fps frame.
 * @returns {Promise<void>} Exact frame presentation.
 */
function seekFrame(video, frameIndex) {
	const expected = frameIndex / 30;
	return new Promise((resolve, reject) => {
		let callback = 0;
		const timeout = setTimeout(() => {
			video.cancelVideoFrameCallback(callback);
			reject(new Error(`Exact diagnosis frame ${frameIndex} was not presented.`));
		}, 60_000);
		/** @param {number} _now @param {VideoFrameCallbackMetadata} metadata */
		const presented = (_now, metadata) => {
			if (Math.abs(metadata.mediaTime - expected) <= 0.000002) {
				clearTimeout(timeout);
				video.cancelVideoFrameCallback(callback);
				resolve();
			} else callback = video.requestVideoFrameCallback(presented);
		};
		callback = video.requestVideoFrameCallback(presented);
		video.currentTime = (frameIndex + 0.5) / 30;
	});
}

/**
 * Measures one rectangular display-code region.
 *
 * @param {Uint8ClampedArray} rgba - Complete diagnostic image bytes.
 * @param {number} width - Diagnostic width.
 * @param {Readonly<{x: number; y: number; width: number; height: number}>} region - Pixel bounds.
 * @returns {Readonly<{meanRed: number; meanGreen: number; meanBlue: number; meanLuma: number}>} Region means.
 */
function measureRegion(rgba, width, region) {
	let red = 0;
	let green = 0;
	let blue = 0;
	for (let y = region.y; y < region.y + region.height; y += 1) {
		for (let x = region.x; x < region.x + region.width; x += 1) {
			const offset = 4 * (y * width + x);
			red += rgba[offset];
			green += rgba[offset + 1];
			blue += rgba[offset + 2];
		}
	}
	const count = region.width * region.height;
	const meanRed = red / count;
	const meanGreen = green / count;
	const meanBlue = blue / count;
	return {
		meanRed,
		meanGreen,
		meanBlue,
		meanLuma: 0.2126 * meanRed + 0.7152 * meanGreen + 0.0722 * meanBlue,
	};
}

/** Browser-owned exact-frame pixel measurement for the immutable film. */
export const CreativeStrobingInspection = {
	/**
	 * Decodes and measures every presentation frame without retaining decoded images.
	 *
	 * @param {Readonly<{videoUrl: string; frameCount: number}>} configuration - Authenticated parent input.
	 * @returns {Promise<Readonly<{width: number; height: number; frames: readonly object[]}>>} Display-code trace.
	 */
	async inspect(configuration) {
		if (configuration.frameCount !== 1800) throw new Error('Strobing diagnosis requires the complete 1,800-frame film.');
		const video = document.createElement('video');
		video.muted = true;
		video.preload = 'auto';
		document.body.append(video);
		try {
			const loaded = waitForVideo(video);
			video.src = configuration.videoUrl;
			video.load();
			await loaded;
			if (video.videoWidth !== 3840 || video.videoHeight !== 2160 || Math.abs(video.duration - 60) > 0.000002)
				throw new Error('Strobing diagnosis parent is not the accepted native-4K sixty-second film.');
			const width = 320;
			const height = 180;
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const context = canvas.getContext('2d', {willReadFrequently: true});
			if (!context) throw new Error('Strobing diagnosis requires a 2D measurement canvas.');
			const regions = {
				full: {x: 0, y: 0, width, height},
				upper: {x: 0, y: 0, width, height: 60},
				horizon: {x: 0, y: 60, width, height: 60},
				lower: {x: 0, y: 120, width, height: 60},
			};
			const frames = [];
			await seekFrame(video, 1);
			for (let frameIndex = 0; frameIndex < configuration.frameCount; frameIndex += 1) {
				await seekFrame(video, frameIndex);
				context.drawImage(video, 0, 0, width, height);
				const rgba = context.getImageData(0, 0, width, height).data;
				frames.push({
					frameIndex,
					full: measureRegion(rgba, width, regions.full),
					upper: measureRegion(rgba, width, regions.upper),
					horizon: measureRegion(rgba, width, regions.horizon),
					lower: measureRegion(rgba, width, regions.lower),
				});
				if (frameIndex % 30 === 0 || frameIndex + 1 === configuration.frameCount) {
					await window.__creativeStrobingProgress({
						phase: 'decode-frames',
						completed: frameIndex + 1,
						total: configuration.frameCount,
						message: `Measured encoded frame ${frameIndex + 1}/${configuration.frameCount}.`,
					});
				}
			}
			return {width, height, frames};
		} finally {
			video.removeAttribute('src');
			video.load();
			video.remove();
		}
	},
};
