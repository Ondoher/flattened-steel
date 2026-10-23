import {CanonicalAtmosphere} from '../algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../algorithm32/implementation/canonical-atmosphere/consts.js';

/** Call this method to create the application-selected fixed-column H2400 atmosphere.
 * Relative to the canonical paper medium, aerosol scale height is2400m,
 * single-scattering albedo is0.95, phase shape is0.85 and loading retains the
 * finite60km column of beta0.01 at1200m. Molecular properties are unchanged.
 *
 * @returns {CanonicalAtmosphere} - Fresh medium for matching cache construction and live transport.
 */
export function createFlat32Atmosphere() {
	const topAltitudeMeters =
		CANONICAL_ATMOSPHERE_CONSTANTS.topRadius.value - CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius.value;
	const mieScaleHeight = {value: 2400, units: /** @type {const} */ ('meters')};
	const mieAngstromBeta =
		(0.01 * -Math.expm1(-topAltitudeMeters / 1200)) / -Math.expm1(-topAltitudeMeters / mieScaleHeight.value);
	return new CanonicalAtmosphere({
		constants: {
			...CANONICAL_ATMOSPHERE_CONSTANTS,
			mieScaleHeight,
			mieAngstromBeta,
			mieSingleScatteringAlbedo: 0.95,
			miePhaseFunctionG: 0.85,
		},
	});
}
