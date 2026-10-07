import {TheHoursRecorder} from './TheHoursRecorder.js';
import {TheHoursFrameMeasurement} from './TheHoursFrameMeasurement.js';

/** Exact native lossless replay through the original recorder without repeating physical rendering. */
export class TheHoursReplayBrowser {
	/** Creates a replay around authenticated retained source artifacts.
	 * @param {TheHoursReplayConfiguration} configuration - Complete original source means and declared media policy.
	 */
	constructor(configuration) {
		this._configuration = configuration;
		this._canvas = new OffscreenCanvas(configuration.width, configuration.height);
		this._context = this._canvas.getContext('2d', {alpha: false});
		if (!this._context) throw new Error('Native replay canvas is unavailable.');
		this._measurement = new TheHoursFrameMeasurement();
		this._maximumMeanDifference = 0;
	}

	/** Called by recording to reconstruct one exact retained native image.
	 * @param {number} seconds - Original score position.
	 * @returns {Promise<void>} - Complete native pixels validated against source means.
	 */
	async _render(seconds) {
		const index = Math.round(seconds * 30) - this._configuration.startSeconds * 30;
		const response = await fetch(`/cache/frames/${String(index).padStart(4, '0')}.png`);
		if (!response.ok) throw new Error('Authenticated native replay frame is unavailable.');
		const bitmap = await createImageBitmap(await response.blob(), {
			colorSpaceConversion: 'none',
			premultiplyAlpha: 'none',
		});
		try {
			if (bitmap.width !== this._canvas.width || bitmap.height !== this._canvas.height)
				throw new Error('Native replay frame dimensions differ.');
			this._context.drawImage(bitmap, 0, 0);
		} finally {
			bitmap.close();
		}
		const regions = this._measurement.measure(this._canvas),
			original = this._configuration.sourceMeans[index];
		for (const [name, region] of Object.entries(regions)) {
			for (const channel of ['meanRed', 'meanGreen', 'meanBlue', 'meanLuma'])
				this._maximumMeanDifference = Math.max(
					this._maximumMeanDifference,
					Math.abs(region[channel] - original[name][channel]),
				);
		}
		if (this._maximumMeanDifference > 1e-10)
			throw new Error('Native PNG replay changes retained presentation values.');
	}

	/** Call this method to record exact source frames with explicit candidate encoding controls.
	 * @returns {Promise<TheHoursReplayResult>} - Unchanged source proof and original-workflow media facts.
	 */
	async record() {
		const facts = await new TheHoursRecorder({
			...this._configuration,
			presentation: this._canvas,
			render: this._render.bind(this),
		}).record();
		return {...facts, maximumNativeMeanDifference: this._maximumMeanDifference};
	}
}
