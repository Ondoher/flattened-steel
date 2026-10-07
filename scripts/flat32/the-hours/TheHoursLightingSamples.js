import {SpectralPacket} from '../../../src/algorithm32/spectral-values/index.js';
import {DistantSunSolarInterpolation} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSolarInterpolation.js';

/** Retained one-second GPU environment endpoints and shared shape-preserving interpolation. */
export class TheHoursLightingSamples {
	/** Creates an empty measured endpoint table. */
	constructor() {
		/** Retained immutable complete measurements. @type {TheHoursLightingSample[]} */
		this._samples = [];
	}

	/**
	 * Call this method to retain one actual measured integer-second endpoint.
	 * Duplicate, noncontiguous or noninteger sample times throw.
	 *
	 * @param {number} seconds - Integer original score time.
	 * @param {ReceiverEnvironmentLightMeasurement} measurement - Complete physical GPU measurement.
	 * @returns {void} - Endpoint retained for later interpolation.
	 */
	add(seconds, measurement) {
		if (!Number.isInteger(seconds) || (this._samples.length && seconds !== this._samples.at(-1).seconds + 1)) {
			throw new Error('The Hours lighting endpoints must be contiguous integer seconds.');
		}
		this._samples.push({seconds, measurement});
	}

	/**
	 * Call this method to derive physical diffuse and adaptation values without changing measured endpoints.
	 * Missing outer samples or an uncovered score position throw. Direct spectra are excluded:
	 * the production shader handle computes them at the exact requested observation.
	 *
	 * @param {number} seconds - Exact original score position.
	 * @returns {ReceiverEnvironmentSample} - Derived environment packet and physical adaptation.
	 */
	sample(seconds) {
		const exact = this._samples.find((sample) => sample.seconds === seconds);
		if (exact)
			return {
				diffuseHorizontal: exact.measurement.diffuseHorizontal,
				stellarAdaptationLuminance: exact.measurement.stellarAdaptationLuminance,
			};
		const index = this._samples.findIndex((sample) => sample.seconds > seconds) - 1;
		if (index < 0 || index + 1 >= this._samples.length)
			throw new Error('The Hours lighting table does not cover this time.');
		const lower = this._samples[index],
			upper = this._samples[index + 1];
		const previous = this._samples[Math.max(0, index - 1)],
			next = this._samples[Math.min(this._samples.length - 1, index + 2)];
		const fraction = seconds - lower.seconds;
		const template = lower.measurement.diffuseHorizontal;
		const stencil = [previous, lower, upper, next];
		const values = template.values.map((_value, channel) =>
			DistantSunSolarInterpolation.sample(
				previous.measurement.diffuseHorizontal.values[channel],
				lower.measurement.diffuseHorizontal.values[channel],
				upper.measurement.diffuseHorizontal.values[channel],
				next.measurement.diffuseHorizontal.values[channel],
				fraction,
			),
		);
		return {
			diffuseHorizontal: /** @type {SpectralIrradiancePacket} */ (
				new SpectralPacket({
					basis: template.basis,
					quantity: template.quantity,
					units: template.units,
					semantics: template.semantics,
					values,
					provenanceIdentity: `the-hours-physical-cubic:${stencil.map((sample) => sample.measurement.diffuseHorizontal.contentHash).join(':')}:${seconds}`,
				})
			),
			stellarAdaptationLuminance: {
				value: DistantSunSolarInterpolation.sample(
					previous.measurement.stellarAdaptationLuminance.value,
					lower.measurement.stellarAdaptationLuminance.value,
					upper.measurement.stellarAdaptationLuminance.value,
					next.measurement.stellarAdaptationLuminance.value,
					fraction,
				),
				units: 'cd m^-2',
			},
		};
	}

	/**
	 * Call this method to retain complete derivation inputs in the run evidence.
	 *
	 * @returns {readonly TheHoursLightingSample[]} - Caller-owned table container.
	 */
	describe() {
		return this._samples.map((sample) => ({...sample}));
	}
}
