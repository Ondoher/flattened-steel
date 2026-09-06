import {ValueValidation} from '../validation/ValueValidation.js';

/**
 * Called by this module to clamp a display channel to a byte.
 *
 * @param {number} value - The channel value.
 * @returns {number} - The byte channel.
 *
 */
function clampByte(value) {
	return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Called by this module to normalize an optional endpoint shadow-receiver request. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {unknown} value - The shadow request.
 * @returns {GeometryEndpointShadowRequest | null} - The normalized shadow
 * request, or null when disabled or omitted.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function endpointShadowOrNull(value) {
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError('shadow must be an object when supplied.');
	}
	const candidate = /** @type {GeometryEndpointShadowRequestCandidate} */ (value);
	const enabled = ValueValidation.booleanOrDefault(candidate.enabled, false, 'shadow.enabled');
	const receiveShadow = ValueValidation.booleanOrDefault(candidate.receiveShadow, true, 'shadow.receiveShadow');
	const shadowPolicy = ValueValidation.stringOrDefault(
		candidate.shadowPolicy,
		'geometry-ground-receives-source-shadow-map',
		'shadow.shadowPolicy',
	);

	if (!enabled) {
		return null;
	}

	return {
		enabled: true,
		receiveShadow,
		shadowPolicy,
	};
}

/**
 * Called by this module to normalize optional display RGBA channels. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {unknown} value - The candidate RGBA tuple.
 * @returns {readonly [number, number, number, number] | null} - The normalized
 * byte channels, or null when omitted.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function displayRgbaOrNull(value) {
	if (value === undefined) {
		return null;
	}
	if (
		!Array.isArray(value) ||
		(value.length !== 3 && value.length !== 4) ||
		!value.every(
			/**
			 * Called by Array.prototype.every to test one collection value against the shared condition.
			 * @param channel - The channel value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (channel) => typeof channel === 'number' && Number.isFinite(channel),
		)
	) {
		throw new TypeError('visualMaterialDisplayRgba must contain three or four finite channels.');
	}

	return [
		clampByte(value[0]),
		clampByte(value[1]),
		clampByte(value[2]),
		value.length === 4 ? clampByte(value[3]) : 255,
	];
}

/**
 * Called by this module to resolve visual material lighting with its basic-material default. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {unknown} value - The optional lighting policy.
 * @returns {GeometryVisualMaterialLighting} - The accepted lighting policy.
 * @throws {RangeError} - When an accepted value is outside the supported range.
 */
function materialLightingOrDefault(value) {
	if (value === undefined) {
		return 'basic';
	}
	if (value !== 'basic' && value !== 'lambert') {
		throw new RangeError('visualMaterialLighting must be "basic" or "lambert".');
	}
	return value;
}

/** Geometry endpoint-shadow and visual request-value operations. */
export const GeometryVisualRequestValues = {
	clampByte,
	displayRgbaOrNull,
	endpointShadowOrNull,
	materialLightingOrDefault,
};
