/** Pixel units constant. */
const PIXEL_UNITS = 'pixels';

/** Pixel size, distance, defaulting, viewport, and shader-value methods. */
export const PixelMath = {
	/**
	 * Call this method to assert one positive integral pixel count.
	 *
	 * @param {unknown} value - The candidate count.
	 * @param {string} label - The error label.
	 * @returns {void} - No value.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	assertPositivePixelCount(value, label) {
		if (!Number.isInteger(value) || /** @type {number} */ (value) <= 0) {
			throw new RangeError(`${label} must be a positive integer.`);
		}
	},

	/**
	 * Call this method to accept one exact unit-bearing pixel-size packet at a production boundary.
	 *
	 * @param {unknown} value - The candidate packet.
	 * @param {string} [label] - The error label.
	 * @returns {PixelSize} - The accepted pixel size.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	acceptPixelSize(value, label = 'Pixel size') {
		if (value === null || typeof value !== 'object' || Array.isArray(value)) {
			throw new TypeError(`${label} must carry units "pixels".`);
		}

		const candidate = /** @type {PixelSizeCandidate} */ (value);
		const keys = Object.keys(candidate).sort();

		if (keys.length !== 3 || keys[0] !== 'height' || keys[1] !== 'units' || keys[2] !== 'width') {
			throw new TypeError(`${label} must have exactly width, height, and units properties.`);
		}

		if (candidate.units !== PIXEL_UNITS) {
			throw new TypeError(`${label} must carry units "pixels".`);
		}

		PixelMath.assertPositivePixelCount(candidate.width, `${label}.width`);
		PixelMath.assertPositivePixelCount(candidate.height, `${label}.height`);

		return {
			width: /** @type {number} */ (candidate.width),
			height: /** @type {number} */ (candidate.height),
			units: PIXEL_UNITS,
		};
	},

	/**
	 * Call this method to convert a required renderer width/height pair into a fresh canonical packet.
	 *
	 * @param {number} widthPixels - The viewport width in pixels.
	 * @param {number} heightPixels - The viewport height in pixels.
	 * @param {string} [label] - The error label.
	 * @returns {PixelSize} - The pixel-size packet.
	 */
	createPixelSize(widthPixels, heightPixels, label = 'Pixel size') {
		return PixelMath.acceptPixelSize(
			{
				width: widthPixels,
				height: heightPixels,
				units: PIXEL_UNITS,
			},
			label,
		);
	},

	/**
	 * Call this method to accept a pixel-size packet while defaulting only an omitted value. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {unknown} value - The requested pixel size.
	 * @param {PixelSize} fallback - The default pixel size.
	 * @param {string} label - The request-property label.
	 * @returns {PixelSize} - The accepted pixel-size packet.
	 */
	sizeOrDefault(value, fallback, label) {
		return PixelMath.acceptPixelSize(value === undefined ? fallback : value, label);
	},

	/**
	 * Call this method to normalize an accepted pixel size to the numeric GLSL vec2 shape.
	 *
	 * @param {PixelSize} value - The accepted pixel size.
	 * @returns {[number, number]} - The shader-uniform value in pixels.
	 */
	pixelSizeToShaderValue(value) {
		return [value.width, value.height];
	},

	/**
	 * Call this method to accept one exact non-negative pixel-distance packet.
	 *
	 * @param {unknown} value - The candidate packet.
	 * @param {string} [label] - The error label.
	 * @returns {PixelDistance} - The accepted pixel distance.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	acceptPixelDistance(value, label = 'Pixel distance') {
		if (value === null || typeof value !== 'object' || Array.isArray(value)) {
			throw new TypeError(`${label} must contain a non-negative finite value in pixels.`);
		}

		const candidate = /** @type {PixelDistanceCandidate} */ (value);
		const keys = Object.keys(candidate).sort();

		if (keys.length !== 2 || keys[0] !== 'units' || keys[1] !== 'value') {
			throw new TypeError(`${label} must have exactly value and units properties.`);
		}

		if (
			candidate.units !== PIXEL_UNITS ||
			!Number.isFinite(candidate.value) ||
			/** @type {number} */ (candidate.value) < 0
		) {
			throw new TypeError(`${label} must contain a non-negative finite value in pixels.`);
		}

		return {
			value: /** @type {number} */ (candidate.value),
			units: PIXEL_UNITS,
		};
	},

	/**
	 * Call this method to create a fresh scalar pixel-distance packet from a normalized local value.
	 *
	 * @param {number} valuePixels - The distance in pixels.
	 * @param {string} [label] - The error label.
	 * @returns {PixelDistance} - The pixel-distance packet.
	 */
	createPixelDistance(valuePixels, label = 'Pixel distance') {
		return PixelMath.acceptPixelDistance({value: valuePixels, units: PIXEL_UNITS}, label);
	},

	/**
	 * Call this method to accept a pixel-distance packet while defaulting only an omitted value. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {unknown} value - The requested pixel distance.
	 * @param {PixelDistance} fallback - The default pixel distance.
	 * @param {string} label - The request-property label.
	 * @returns {PixelDistance} - The accepted pixel-distance packet.
	 */
	distanceOrDefault(value, fallback, label) {
		return PixelMath.acceptPixelDistance(value === undefined ? fallback : value, label);
	},

	/**
	 * Call this method to normalize one optional positive viewport dimension. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {unknown} value - The dimension in pixels.
	 * @param {string} label - The diagnostic label.
	 * @returns {number} - The normalized positive integer pixel count.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	viewportCountOrDefault(value, label) {
		if (value === undefined) {
			return 1;
		}

		if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
			throw new RangeError(`${label} must be a positive finite number.`);
		}

		return Math.max(1, Math.floor(value));
	},
};
