import DistanceMath from '../utils/DistanceMath.js';

/**
 * Resolve a boolean with a default used only for omission.
 *
 * @param {unknown} value - Supplies the optional boolean.
 * @param {boolean} defaultValue - Supplies the omission default.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {boolean} The accepted boolean.
 */
function booleanOrDefault(value, defaultValue, label) {
	if (value === undefined) {
		return defaultValue;
	}
	if (typeof value !== 'boolean') {
		throw new TypeError(`${label} must be boolean.`);
	}
	return value;
}

/**
 * Clamp a display channel to a byte.
 *
 * @param {number} value - Supplies channel value.
 * @returns {number} Byte channel.
 */
function clampByte(value) {
	return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Resolve a nonempty string with a default used only for omission.
 *
 * @param {unknown} value - Supplies the optional string.
 * @param {string} defaultValue - Supplies the omission default.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {string} The accepted string.
 */
export function stringOrDefault(value, defaultValue, label) {
	const candidate = value === undefined ? defaultValue : value;

	if (typeof candidate !== 'string' || candidate.trim().length === 0) {
		throw new TypeError(`${label} must be a nonempty string.`);
	}
	return candidate;
}

/**
 * Resolve an optional nonempty string without interpreting null as omission.
 *
 * @param {unknown} value - Supplies the optional string.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {string | undefined} The accepted string or undefined.
 */
export function optionalString(value, label) {
	if (value === undefined) {
		return undefined;
	}
	return stringOrDefault(value, '', label);
}

/**
 * Normalize optional endpoint shadow receiver request.
 *
 * @param {unknown} value - Supplies shadow request.
 * @returns {object | null} Normalized shadow request.
 */
export function geometryEndpointShadowRequestOrNull(value) {
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError('shadow must be an object when supplied.');
	}
	const candidate = /** @type {{
	 * enabled?: unknown,
	 * receiveShadow?: unknown,
	 * shadowPolicy?: unknown,
	 * }} */ (value);
	const enabled = booleanOrDefault(candidate.enabled, false, 'shadow.enabled');
	const receiveShadow = booleanOrDefault(
		candidate.receiveShadow,
		true,
		'shadow.receiveShadow',
	);
	const shadowPolicy = stringOrDefault(
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
 * Resolve a positive physical distance in meters with a local default.
 *
 * @param {Distance | undefined} value - Supplies an optional distance.
 * @param {number} defaultValueMeters - Supplies the default in meters.
 * @param {string} label - Supplies error label.
 * @returns {number} Positive distance in meters.
 */
export function positiveDistanceMetersOrDefault(value, defaultValueMeters, label) {
	if (value === undefined) {
		return defaultValueMeters;
	}

	DistanceMath.assertDistance(value, label);
	const valueMeters = DistanceMath.toMeters(value);

	if (valueMeters <= 0) {
		throw new RangeError(`${label} must be a positive distance.`);
	}

	return valueMeters;
}

/**
 * Normalize an optional physical distance once at the owning boundary.
 *
 * @param {unknown} value - Supplies the optional distance.
 * @param {string} label - Supplies the error label.
 * @returns {number | null} Distance in meters, or null.
 */
export function optionalDistanceToMeters(value, label) {
	if (value === undefined) {
		return null;
	}

	DistanceMath.assertDistance(value, label);
	return DistanceMath.toMeters(/** @type {Distance} */ (value));
}

/**
 * Normalize an optional source-path limit without treating null as omission.
 *
 * @param {unknown} value - Supplies the optional source-path limit.
 * @returns {number | null} The accepted maximum distance in meters, or null.
 */
export function sourcePathLimitDistanceToMeters(value) {
	if (value === undefined) {
		return null;
	}
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError('sourcePathLimit must be an object when supplied.');
	}
	const candidate = /** @type {{ maxDistance?: unknown }} */ (value);
	if (candidate.maxDistance === null) {
		return null;
	}
	return optionalDistanceToMeters(candidate.maxDistance, 'sourcePathLimit.maxDistance');
}

/**
 * Resolve a positive integer with a default.
 *
 * @param {unknown} value - Supplies candidate value.
 * @param {number} defaultValue - Supplies default value.
 * @param {string} label - Supplies error label.
 * @returns {number} Positive integer value.
 */
export function positiveIntegerOrDefault(value, defaultValue, label) {
	const candidate = value === undefined ? defaultValue : value;

	if (typeof candidate !== 'number' || !Number.isSafeInteger(candidate) || candidate < 1) {
		throw new RangeError(`${label} must be a positive integer.`);
	}

	return candidate;
}

/**
 * Normalize optional display rgba values.
 *
 * @param {unknown} value - Supplies candidate rgba tuple.
 * @returns {readonly [number, number, number, number] | null} Normalized rgba.
 */
export function displayRgbaOrNull(value) {
	if (value === undefined) {
		return null;
	}
	if (!Array.isArray(value)
		|| (value.length !== 3 && value.length !== 4)
		|| !value.every((channel) =>
			typeof channel === 'number' && Number.isFinite(channel))) {
		throw new TypeError(
			'visualMaterialDisplayRgba must contain three or four finite channels.',
		);
	}

	return [
		clampByte(value[0]),
		clampByte(value[1]),
		clampByte(value[2]),
		value.length === 4 ? clampByte(value[3]) : 255,
	];
}

/**
 * Resolve visual material lighting with a basic-material default.
 *
 * @param {unknown} value - Supplies the optional lighting policy.
 * @returns {"basic" | "lambert"} The accepted lighting policy.
 */
export function visualMaterialLightingOrDefault(value) {
	if (value === undefined) {
		return 'basic';
	}
	if (value !== 'basic' && value !== 'lambert') {
		throw new RangeError('visualMaterialLighting must be "basic" or "lambert".');
	}
	return value;
}

/**
 * Clamp a value into a range.
 *
 * @param {number} value - Supplies the value.
 * @param {number} min - Supplies the minimum.
 * @param {number} max - Supplies the maximum.
 * @returns {number} The clamped value.
 */
export function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}
