import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {CANONICAL_SPECTRAL_CHANNELS} from '../../src/algorithm32/profiles/native-15/consts.js';

/** Integrate exponential density exactly along a flat-atmosphere segment.
 * @param {number} startAltitude - Start altitude in meters.
 * @param {number} endAltitude - End altitude in meters.
 * @param {number} length - Physical segment length in meters.
 * @param {number} scaleHeight - Density scale height in meters.
 * @returns {number} - Integrated density in meters.
 */
export function densityColumn(startAltitude, endAltitude, length, scaleHeight) {
	if (
		![startAltitude, endAltitude, length, scaleHeight].every(Number.isFinite) ||
		startAltitude < 0 ||
		endAltitude < 0 ||
		startAltitude > 100000 ||
		endAltitude > 100000 ||
		length < Math.abs(endAltitude - startAltitude) ||
		scaleHeight <= 0
	)
		throw new RangeError('Invalid physical segment.');
	const dz = endAltitude - startAltitude;
	if (dz === 0) return Math.exp(-startAltitude / scaleHeight) * length;
	return (Math.exp(-startAltitude / scaleHeight) * -Math.expm1(-dz / scaleHeight) * scaleHeight * length) / dz;
}

/** Compute transmission continuously, independently of cache sampling.
 * @param {number} startAltitude - Start altitude in meters.
 * @param {number} endAltitude - End altitude in meters.
 * @param {number} length - Segment length in meters.
 * @returns {number[]} - Fifteen dimensionless transmissions.
 */
export function transmission(startAltitude, endAltitude, length) {
	const constants = CANONICAL_ATMOSPHERE_CONSTANTS;
	const rayleigh = densityColumn(startAltitude, endAltitude, length, constants.rayleighScaleHeight.value);
	const mie = densityColumn(startAltitude, endAltitude, length, constants.mieScaleHeight.value);
	return CANONICAL_SPECTRAL_CHANNELS.map((channel) => {
		const wavelength = channel.wavelength.value / 1000;
		return Math.exp(
			-constants.rayleighCoefficientScale * wavelength ** -4 * rayleigh -
				(constants.mieAngstromBeta / constants.mieScaleHeight.value) *
					wavelength ** -constants.mieAngstromAlpha *
					mie,
		);
	});
}

/** Verify analytic segment invariants and quadrature convergence.
 * @returns {LocalSunReferenceCalibration} - Measured reference checks.
 */
export function calibrateReference() {
	const path = [5, 100000, 160000];
	const forward = transmission(path[0], path[1], path[2]);
	const reverse = transmission(path[1], path[0], path[2]);
	const half = (path[0] + path[1]) / 2;
	const first = transmission(path[0], half, path[2] / 2);
	const second = transmission(half, path[1], path[2] / 2);
	const reciprocityError = Math.max(...forward.map((value, index) => Math.abs(value - reverse[index])));
	const compositionError = Math.max(...forward.map((value, index) => Math.abs(value - first[index] * second[index])));
	if (reciprocityError > 1e-12 || compositionError > 1e-12 || transmission(5, 5, 0).some((value) => value !== 1))
		throw new Error('Analytic invariants failed.');
	const levels = [60, 120, 240, 480, 960];
	const quadrature = levels.map((intervals) => {
		let integrated = 0;
		for (let sample = 0; sample <= intervals; sample += 1) {
			const altitude = path[0] + ((path[1] - path[0]) * sample) / intervals;
			integrated +=
				((sample === 0 || sample === intervals ? 0.5 : 1) * Math.exp(-altitude / 1200) * path[2]) / intervals;
		}
		return {
			intervals,
			densityColumnErrorMeters: Math.abs(integrated - densityColumn(path[0], path[1], path[2], 1200)),
		};
	});
	return {
		schema: 'local-sun-continuous-reference-calibration-v1',
		reciprocityError,
		compositionError,
		zeroPathPassed: true,
		quadrature,
		claim: 'Analytic transmission invariants only. Higher-order reference convergence and candidate accuracy remain unmeasured.',
	};
}
