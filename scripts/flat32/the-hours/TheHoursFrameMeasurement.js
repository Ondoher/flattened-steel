/** Exact native-pixel regional means before encoding, without resampling alias. */
export class TheHoursFrameMeasurement {
	/** Creates an independent native-pixel diagnostic canvas. */
	constructor() {
		/** Native diagnostic copy; no effect on the presentation image. */
		this._canvas = new OffscreenCanvas(1, 1);
		/** Pixel access restricted to the diagnostic copy. */
		this._context = this._canvas.getContext('2d', {willReadFrequently: true});
		if (!this._context) throw new Error('Source frame measurement requires a 2D context.');
	}

	/** Call this method to measure every source pixel without resampling.
	 *
	 * @param {OffscreenCanvas} source - Completed native presentation frame.
	 * @returns {TheHoursPixelRegions} - Measurements before compression.
	 */
	measure(source) {
		const {width, height} = source;
		if (height % 3 !== 0) throw new Error('Native frame height must divide into three equal masks.');
		if (this._canvas.width !== width || this._canvas.height !== height) {
			this._canvas.width = width;
			this._canvas.height = height;
		}
		this._context.drawImage(source, 0, 0);
		const bytes = this._context.getImageData(0, 0, width, height).data;
		/** @type {Record<string, TheHoursPixelRegion>} */ const regions = {};
		for (const [name, first, last] of [
			['upper', 0, height / 3],
			['horizon', height / 3, (height * 2) / 3],
			['lower', (height * 2) / 3, height],
		]) {
			let red = 0,
				green = 0,
				blue = 0;
			for (let offset = Number(first) * width * 4; offset < Number(last) * width * 4; offset += 4) {
				red += bytes[offset];
				green += bytes[offset + 1];
				blue += bytes[offset + 2];
			}
			const count = (Number(last) - Number(first)) * width;
			regions[name] = {
				meanRed: red / count,
				meanGreen: green / count,
				meanBlue: blue / count,
				meanLuma: (0.2126 * red + 0.7152 * green + 0.0722 * blue) / count,
				adjacentRgbMeanAbsolute: null,
				previousFrameRgbCurvature: null,
			};
		}
		const parts = Object.values(regions);
		regions.full = {
			meanRed: parts.reduce((sum, region) => sum + region.meanRed, 0) / 3,
			meanGreen: parts.reduce((sum, region) => sum + region.meanGreen, 0) / 3,
			meanBlue: parts.reduce((sum, region) => sum + region.meanBlue, 0) / 3,
			meanLuma: parts.reduce((sum, region) => sum + region.meanLuma, 0) / 3,
			adjacentRgbMeanAbsolute: null,
			previousFrameRgbCurvature: null,
		};
		return regions;
	}
}
