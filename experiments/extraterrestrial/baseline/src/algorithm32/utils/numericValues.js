/**
 * Resolve an optional finite number at a request boundary.
 *
 * @param {unknown} value - Supplies the candidate value.
 * @param {number} fallback - Supplies the value used only when omitted.
 * @param {string} label - Supplies the request-property label.
 * @returns {number} The accepted number.
 */
export function finiteNumberOrDefault(value, fallback, label) {
	if (value === undefined) {
		return fallback;
	}

	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new TypeError(`${label} must be finite.`);
	}

	return value;
}
