/** One smooth source-light curve from unchanged Bruneton to a finite shadow lift. */
export class BrunetonGlobalLuminanceLiftCurve {
	constructor({brightThreshold, darkThreshold, minimumGamma, maximumLuminanceGain}) {
		if (!Number.isFinite(brightThreshold) || brightThreshold <= 0) throw new RangeError('Bright threshold must be positive.');
		if (!Number.isFinite(darkThreshold) || darkThreshold <= 0 || darkThreshold >= brightThreshold) throw new RangeError('Dark threshold is invalid.');
		if (!Number.isFinite(minimumGamma) || minimumGamma <= 0 || minimumGamma > 1) throw new RangeError('Minimum gamma must be in (0, 1].');
		if (!Number.isFinite(maximumLuminanceGain) || maximumLuminanceGain < 1) throw new RangeError('Maximum luminance gain must be at least one.');
		this.configuration = {brightThreshold, darkThreshold, minimumGamma, maximumLuminanceGain};
	}

	derive(localLuminanceCdPerSquareMeter) {
		if (!Number.isFinite(localLuminanceCdPerSquareMeter) || localLuminanceCdPerSquareMeter < 0) throw new RangeError('Local luminance must be finite and nonnegative.');
		const {brightThreshold, darkThreshold, minimumGamma} = this.configuration;
		if (localLuminanceCdPerSquareMeter >= brightThreshold) return 1;
		if (localLuminanceCdPerSquareMeter <= darkThreshold) return minimumGamma;
		const position = (Math.log(brightThreshold) - Math.log(localLuminanceCdPerSquareMeter)) / (Math.log(brightThreshold) - Math.log(darkThreshold));
		const smooth = position * position * (3 - 2 * position);
		return Math.exp(Math.log(minimumGamma) * smooth);
	}
}

export const BRUNETON_GLOBAL_LUMINANCE_LIFT_CURVE_ID = 'bruneton-global-luminance-lift-capped-smooth-log-v2';
