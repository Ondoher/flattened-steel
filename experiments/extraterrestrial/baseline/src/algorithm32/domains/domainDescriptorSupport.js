/**
 * Canonicalize signed zero without changing any nonzero component.
 *
 * @param {number} value - Supplies one physical component.
 * @returns {number} Return canonical zero or the original value.
 */
export function canonicalZero(value) {
	return value === 0 ? 0 : value;
}
