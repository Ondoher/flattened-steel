const PIXEL_UNITS = 'pixels';

/**
 * Assert one positive integral pixel count.
 *
 * @param {unknown} value - Supplies the candidate count.
 * @param {string} label - Supplies the error label.
 * @returns {void}
 */
function assertPositivePixelCount(value, label) {
	if (!Number.isInteger(value) || /** @type {number} */ (value) <= 0) {
		throw new RangeError(`${label} must be a positive integer.`);
	}
}

/**
 * Accept one exact unit-bearing pixel-size packet at a production boundary.
 *
 * @param {unknown} value - Supplies the candidate packet.
 * @param {string} [label] - Supplies the error label.
 * @returns {PixelSize} The accepted pixel size.
 */
export function acceptPixelSize(value, label = 'Pixel size') {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError(`${label} must carry units "pixels".`);
	}

	const candidate = /** @type {{ width?: unknown, height?: unknown, units?: unknown }} */ (value);
	const keys = Object.keys(candidate).sort();

	if (keys.length !== 3 || keys[0] !== 'height' || keys[1] !== 'units' || keys[2] !== 'width') {
		throw new TypeError(`${label} must have exactly width, height, and units properties.`);
	}

	if (candidate.units !== PIXEL_UNITS) {
		throw new TypeError(`${label} must carry units "pixels".`);
	}

	assertPositivePixelCount(candidate.width, `${label}.width`);
	assertPositivePixelCount(candidate.height, `${label}.height`);

	return {
		width: /** @type {number} */ (candidate.width),
		height: /** @type {number} */ (candidate.height),
		units: PIXEL_UNITS,
	};
}

/**
 * Convert a required renderer API width/height pair into the canonical packet.
 *
 * @param {number} widthPixels - Supplies viewport width in pixels.
 * @param {number} heightPixels - Supplies viewport height in pixels.
 * @param {string} [label] - Supplies the error label.
 * @returns {PixelSize} The pixel-size packet.
 */
export function createPixelSize(widthPixels, heightPixels, label = 'Pixel size') {
	return acceptPixelSize({
		width: widthPixels,
		height: heightPixels,
		units: PIXEL_UNITS,
	}, label);
}

/**
 * Normalize an accepted pixel size to the numeric GLSL vec2 shape.
 *
 * @param {PixelSize} value - Supplies an already accepted pixel size.
 * @returns {[number, number]} The shader-uniform value in pixels.
 */
export function pixelSizeToShaderValue(value) {
	return [value.width, value.height];
}

/**
 * Accept one exact non-negative pixel-distance packet.
 *
 * @param {unknown} value - Supplies the candidate packet.
 * @param {string} [label] - Supplies the error label.
 * @returns {PixelDistance} The accepted pixel distance.
 */
export function acceptPixelDistance(value, label = 'Pixel distance') {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError(`${label} must contain a non-negative finite value in pixels.`);
	}

	const candidate = /** @type {{ value?: unknown, units?: unknown }} */ (value);
	const keys = Object.keys(candidate).sort();

	if (keys.length !== 2 || keys[0] !== 'units' || keys[1] !== 'value') {
		throw new TypeError(`${label} must have exactly value and units properties.`);
	}

	if (
		candidate.units !== PIXEL_UNITS
		|| !Number.isFinite(candidate.value)
		|| /** @type {number} */ (candidate.value) < 0
	) {
		throw new TypeError(`${label} must contain a non-negative finite value in pixels.`);
	}

	return {
		value: /** @type {number} */ (candidate.value),
		units: PIXEL_UNITS,
	};
}

/**
 * Create a scalar pixel-distance packet from a normalized local value.
 *
 * @param {number} valuePixels - Supplies distance in pixels.
 * @param {string} [label] - Supplies the error label.
 * @returns {PixelDistance} The pixel-distance packet.
 */
export function createPixelDistance(valuePixels, label = 'Pixel distance') {
	return acceptPixelDistance({ value: valuePixels, units: PIXEL_UNITS }, label);
}
