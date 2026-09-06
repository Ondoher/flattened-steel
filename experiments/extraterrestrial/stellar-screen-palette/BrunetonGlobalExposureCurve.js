/**
 * One smooth, bounded global-exposure curve driven only by receiver-local
 * extraterrestrial luminance.
 */
export class BrunetonGlobalExposureCurve {
	/**
	 * @param {Readonly<{brightThreshold: number, darkThreshold: number, maximumExposure: number}>} configuration
	 */
	constructor(configuration) {
		const {brightThreshold, darkThreshold, maximumExposure} = configuration;
		if (!Number.isFinite(brightThreshold) || brightThreshold <= 0) {
			throw new RangeError('The bright threshold must be positive and finite.');
		}
		if (!Number.isFinite(darkThreshold) || darkThreshold <= 0 || darkThreshold >= brightThreshold) {
			throw new RangeError('The dark threshold must be positive, finite, and below the bright threshold.');
		}
		if (!Number.isFinite(maximumExposure) || maximumExposure < 1) {
			throw new RangeError('The maximum exposure must be finite and at least one.');
		}
		this.configuration = {brightThreshold, darkThreshold, maximumExposure};
	}

	/** @type {Readonly<{brightThreshold: number, darkThreshold: number, maximumExposure: number}>} */
	configuration;

	/** Return one finite global exposure for a nonnegative cd m^-2 value. */
	derive(localLuminanceCdPerSquareMeter) {
		if (!Number.isFinite(localLuminanceCdPerSquareMeter) || localLuminanceCdPerSquareMeter < 0) {
			throw new RangeError('Local luminance must be finite and nonnegative.');
		}
		const {brightThreshold, darkThreshold, maximumExposure} = this.configuration;
		if (localLuminanceCdPerSquareMeter >= brightThreshold) return 1;
		if (localLuminanceCdPerSquareMeter <= darkThreshold) return maximumExposure;
		const position =
			(Math.log(brightThreshold) - Math.log(localLuminanceCdPerSquareMeter)) /
			(Math.log(brightThreshold) - Math.log(darkThreshold));
		const smoothPosition = position * position * (3 - 2 * position);
		return Math.exp(Math.log(maximumExposure) * smoothPosition);
	}
}

export const BRUNETON_GLOBAL_EXPOSURE_CURVE_ID = 'bruneton-global-exposure-smooth-log-v1';
