import { CpuDirectionalSpectralField } from './CpuDirectionalSpectralField.js';

/**
 * Assert and return one CPU directional spectral field.
 *
 * @param {unknown} value - Supplies the candidate field.
 * @param {string} [label] - Supplies a diagnostic label.
 * @returns {CpuDirectionalSpectralField} Return the validated field.
 */
export function assertCpuDirectionalSpectralField(
	value,
	label = 'CPU directional spectral field',
) {
	if (!(value instanceof CpuDirectionalSpectralField)) {
		throw new TypeError(`${label} must be a CpuDirectionalSpectralField.`);
	}

	return value;
}
