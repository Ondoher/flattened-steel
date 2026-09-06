import {
	isTypedArray,
	requiredString,
} from '../descriptors/descriptorSupport.js';
import {
	ALLOWED_SPECTRAL_QUANTITIES,
	SPECTRAL_QUANTITIES,
	SPECTRAL_QUANTITY_UNITS,
	SPECTRAL_UNITS,
} from './consts.js';

export {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
} from './consts.js';

/**
 * Require one supported spectral quantity.
 *
 * @param {unknown} value - Supplies the candidate quantity.
 * @returns {SpectralQuantity} The supported quantity.
 */
export function requireSpectralQuantity(value) {
	const checked = requiredString(value, 'SpectralPacket.quantity');
	if (!ALLOWED_SPECTRAL_QUANTITIES.has(checked)) {
		throw new RangeError(`Unsupported spectral quantity: ${checked}.`);
	}

	return /** @type {SpectralQuantity} */ (checked);
}

/**
 * Return the canonical units required by a supported quantity.
 *
 * @param {SpectralQuantity} quantity - Supplies the accepted quantity.
 * @returns {SpectralUnits} The required canonical units.
 */
export function spectralUnitsForQuantity(quantity) {
	return SPECTRAL_QUANTITY_UNITS.get(quantity);
}

/**
 * Normalize supported punctuation variants to canonical spectral units.
 *
 * This normalization changes spelling only. It never silently rescales
 * density values between different wavelength measures.
 *
 * @param {unknown} value - Supplies candidate units.
 * @returns {string} Canonical units.
 */
export function normalizeSpectralUnits(value) {
	const checked = requiredString(value, 'SpectralPacket.units');
	return checked
		.trim()
		.replace(/[.\u00b7]/gu, ' ')
		.replace(/\s+/gu, ' ');
}

/**
 * Normalize a spectral numeric vector.
 *
 * @param {unknown} value - Supplies candidate values.
 * @param {number} channelCount - Supplies the exact channel count.
 * @returns {readonly number[]} The normalized vector.
 */
export function normalizeSpectralValues(value, channelCount) {
	if ((!Array.isArray(value) && !isTypedArray(value)) || value.length !== channelCount) {
		throw new RangeError(
			`SpectralPacket.values must contain exactly ${channelCount} channels.`,
		);
	}

	const copy = Array.from(value);
	if (!copy.every(Number.isFinite)) {
		throw new TypeError('SpectralPacket.values must all be finite.');
	}

	return copy;
}
