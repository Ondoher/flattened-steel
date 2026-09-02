import {
	Cr4gSlopeLimitedPreToneExposureColorDisplayModel,
} from './Cr4gSlopeLimitedPreToneExposureColorDisplayModel.js';

/** Stable identity of the CR4I anchor-preserving smooth-shoulder response. */
export const CR4I_ANCHOR_PRESERVING_SHOULDER_RESPONSE_ID =
	'color-reset-cr4i-anchor-preserving-smooth-shoulder-v1';

/**
 * The CR4I candidate deliberately keeps CR4G's one global achromatic
 * pre-tone equation. CR4I changes only the authored curve parameters so a
 * broader sunset shoulder can be checked while the selected CR4G gains at
 * sunset, plus ten minutes, and plus sixty minutes remain fixed.
 *
 * No scene id, clock, solar angle, pixel, source kind, or RGB channel enters
 * this owner. The only varying runtime state remains total-horizontal
 * receiver illuminance in lux.
 *
 * @implements {Color}
 */
export class Cr4iAnchorPreservingShoulderColorDisplayModel extends
	Cr4gSlopeLimitedPreToneExposureColorDisplayModel {
	/** @param {{curve: Cr4gSlopeLimitedCurve, displayConstants?: Figure1DisplayConstants}} configuration */
	constructor(configuration) {
		super(configuration);
		if (configuration?.curve?.adaptationExponent !== 0.78) {
			throw new RangeError('CR4I requires the fixed CR4G adaptation exponent q = 0.78.');
		}
		if (configuration.curve.adaptationFloorIlluminanceLux !== 0.02) {
			throw new RangeError('CR4I requires the fixed 0.02-lux adaptation floor.');
		}
		if (configuration.curve.adaptationSoftnessLogUnits !== 0.1) {
			throw new RangeError('CR4I requires the fixed 0.1-log-unit softplus width.');
		}
	}

	get id() {
		return `${CR4I_ANCHOR_PRESERVING_SHOULDER_RESPONSE_ID}:${this.curve.id}`;
	}
}
