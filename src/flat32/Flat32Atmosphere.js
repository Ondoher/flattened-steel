import {CanonicalAtmosphere} from '../algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';

/** Call this method to create the application-selected original Bruneton atmosphere.
 * Both cache construction and live transport use the canonical physical profile.
 *
 * @returns {CanonicalAtmosphere} - Fresh medium shared by both app modes.
 */
export function createFlat32Atmosphere() {
	return new CanonicalAtmosphere();
}
