import { SpectralBasis } from './SpectralBasis.js';

/**
 * Create a readonly spectral basis.
 *
 * @param {SpectralBasisDefinition | SpectralBasis} definition - Supplies basis data.
 * @returns {SpectralBasis} The validated basis.
 */
export function createSpectralBasis(definition) {
	return definition instanceof SpectralBasis ? definition : new SpectralBasis(definition);
}

/**
 * Assert a validated spectral basis.
 *
 * @param {unknown} value - Supplies the candidate basis.
 * @param {string} [label] - Supplies a diagnostic label.
 * @returns {SpectralBasis} The validated basis.
 */
export function assertSpectralBasis(value, label = 'Spectral basis') {
	if (!(value instanceof SpectralBasis)) {
		throw new TypeError(`${label} must be a SpectralBasis.`);
	}

	return /** @type {SpectralBasis} */ (value);
}

/**
 * Assert two bases have identical ordered physical content and semantics.
 *
 * @param {unknown} left - Supplies the first basis.
 * @param {unknown} right - Supplies the second basis.
 * @param {string} [label] - Supplies a diagnostic label.
 * @returns {void}
 */
export function assertCompatibleSpectralBases(left, right, label = 'Spectral bases') {
	const checkedLeft = assertSpectralBasis(left, `${label} left`);
	const checkedRight = assertSpectralBasis(right, `${label} right`);

	if (checkedLeft.contentHash !== checkedRight.contentHash) {
		throw new TypeError(
			`${label} are incompatible: ${checkedLeft.id} and ${checkedRight.id}.`,
		);
	}
}
