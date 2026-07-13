/**
 * Derive one bounded exposure gain from receiver-local direct-source
 * luminance. The transition is smooth in both source-luminance and gain log
 * space, with exact constant endpoints.
 */
export class BrunetonSourceExposureCurve {
	constructor({brightThreshold, darkThreshold, maximumExposureGain}) {
		if (!Number.isFinite(brightThreshold) || brightThreshold <= 0) {
			throw new RangeError('Bright threshold must be positive.');
		}
		if (!Number.isFinite(darkThreshold)
			|| darkThreshold <= 0
			|| darkThreshold >= brightThreshold) {
			throw new RangeError('Dark threshold is invalid.');
		}
		if (!Number.isFinite(maximumExposureGain) || maximumExposureGain < 1) {
			throw new RangeError('Maximum exposure gain must be at least one.');
		}

		this.configuration = {
			brightThreshold,
			darkThreshold,
			maximumExposureGain,
		};
	}

	/** Return the exact endpoint or smooth log-domain exposure gain. */
	derive(localLuminanceCdPerSquareMeter) {
		if (!Number.isFinite(localLuminanceCdPerSquareMeter)
			|| localLuminanceCdPerSquareMeter < 0) {
			throw new RangeError('Local luminance must be finite and nonnegative.');
		}

		const {
			brightThreshold,
			darkThreshold,
			maximumExposureGain,
		} = this.configuration;
		if (localLuminanceCdPerSquareMeter >= brightThreshold) return 1;
		if (localLuminanceCdPerSquareMeter <= darkThreshold) {
			return maximumExposureGain;
		}

		const position = (
			Math.log(brightThreshold) - Math.log(localLuminanceCdPerSquareMeter)
		) / (Math.log(brightThreshold) - Math.log(darkThreshold));
		const smoothPosition = position * position * (3 - 2 * position);

		return Math.exp(Math.log(maximumExposureGain) * smoothPosition);
	}
}

export const BRUNETON_SOURCE_EXPOSURE_CURVE_ID =
	'bruneton-source-exposure-smooth-log-v1';
