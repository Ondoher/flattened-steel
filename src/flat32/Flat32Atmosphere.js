import {CanonicalAtmosphere} from '../algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../algorithm32/implementation/canonical-atmosphere/consts.js';

/** Create the application-selected Bruneton atmosphere with zero aerosol amount.
 * Molecular scattering and all other canonical physical parameters retain their values.
 * @returns {CanonicalAtmosphere} - Fresh medium for matching cache construction and live transport.
 */
export function createFlat32Atmosphere() {
	return new CanonicalAtmosphere({constants: {...CANONICAL_ATMOSPHERE_CONSTANTS, mieAngstromBeta: 0}});
}
