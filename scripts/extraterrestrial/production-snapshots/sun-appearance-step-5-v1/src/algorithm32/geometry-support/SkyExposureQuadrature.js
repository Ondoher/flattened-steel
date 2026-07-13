import {PixelMath} from '../math/PixelMath.js';
import {SKY_EXPOSURE_METER_AZIMUTH_COUNT, SKY_EXPOSURE_METER_PLAN_ID, SKY_EXPOSURE_METER_RING_COUNT} from './consts.js';

/** Fixed observer-local sky-exposure quadrature operations. */
export const SkyExposureQuadrature = {
	/**
	 * Call this method to derive one equal-solid-angle midpoint sample from its fixed target coordinate.
	 *
	 * @param {number} ringIndex - Zero-based cosine-elevation row.
	 * @param {number} azimuthIndex - Zero-based azimuth column.
	 * @returns {SkyExposureMeterSample} - The observer-local quadrature sample.
	 */
	createSample(ringIndex, azimuthIndex) {
		const cosineElevation = (ringIndex + 0.5) / SKY_EXPOSURE_METER_RING_COUNT;
		const horizontalLength = Math.sqrt(1 - cosineElevation * cosineElevation);
		const azimuthRadians = (2 * Math.PI * (azimuthIndex + 0.5)) / SKY_EXPOSURE_METER_AZIMUTH_COUNT;
		const solidAngleSteradians = (2 * Math.PI) / (SKY_EXPOSURE_METER_RING_COUNT * SKY_EXPOSURE_METER_AZIMUTH_COUNT);

		return {
			localDirection: /** @type {UnitVector3} */ ([
				horizontalLength * Math.cos(azimuthRadians),
				cosineElevation,
				horizontalLength * Math.sin(azimuthRadians),
			]),
			solidAngleSteradians,
			projectedSolidAngleSteradians: cosineElevation * solidAngleSteradians,
		};
	},

	/**
	 * Call this method to create the fixed camera-independent observer-local sky-exposure plan.
	 *
	 * @returns {SkyExposureMeterPlan} - The complete ring-major quadrature plan.
	 */
	createMeterPlan() {
		/** @type {SkyExposureMeterSample[]} */
		const samples = [];

		for (let ringIndex = 0; ringIndex < SKY_EXPOSURE_METER_RING_COUNT; ringIndex += 1) {
			for (let azimuthIndex = 0; azimuthIndex < SKY_EXPOSURE_METER_AZIMUTH_COUNT; azimuthIndex += 1) {
				samples.push(SkyExposureQuadrature.createSample(ringIndex, azimuthIndex));
			}
		}

		return {
			id: SKY_EXPOSURE_METER_PLAN_ID,
			ringCount: SKY_EXPOSURE_METER_RING_COUNT,
			azimuthCount: SKY_EXPOSURE_METER_AZIMUTH_COUNT,
			sampleGridSize: PixelMath.createPixelSize(
				SKY_EXPOSURE_METER_AZIMUTH_COUNT,
				SKY_EXPOSURE_METER_RING_COUNT,
				'Sky-exposure sample grid size',
			),
			samples,
			uniformLuminanceIntegralSteradians: Math.PI,
		};
	},
};
