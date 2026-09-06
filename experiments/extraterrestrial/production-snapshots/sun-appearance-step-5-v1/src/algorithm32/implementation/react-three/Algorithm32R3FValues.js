import {PixelMath} from '../../math/PixelMath.js';

/** R3F viewport-packet and render-priority value methods. */
export const Algorithm32R3FValues = {
	/**
	 * Call this method to resolve a positive integer viewport size from R3F size state.
	 *
	 * @param {unknown} size - The size-like value.
	 * @returns {PixelSize} - The unit-bearing viewport width and height.
	 */
	viewportSize(size) {
		const candidate = /** @type {PixelSizeCandidate} */ (size === undefined ? {} : size);
		const widthPixels = PixelMath.viewportCountOrDefault(candidate.width, 'Algorithm32 R3F viewport width');
		const heightPixels = PixelMath.viewportCountOrDefault(candidate.height, 'Algorithm32 R3F viewport height');

		return PixelMath.createPixelSize(widthPixels, heightPixels, 'Algorithm32 R3F viewport size');
	},

	/**
	 * Call this method to resolve the optional R3F render priority. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {unknown} value - The optional render priority.
	 * @returns {number} - The accepted finite render priority.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	renderPriority(value) {
		if (value === undefined) {
			return 1;
		}

		if (typeof value !== 'number' || !Number.isFinite(value)) {
			throw new TypeError('Algorithm32 R3F renderPriority must be a finite number.');
		}

		return value;
	},
};
