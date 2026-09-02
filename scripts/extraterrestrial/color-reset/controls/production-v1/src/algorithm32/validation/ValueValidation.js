/**
 * Called by this module to test whether a value is an accepted typed array.
 *
 * @param {unknown} value - The candidate value.
 * @returns {value is (ArrayBufferView & ArrayLike<unknown>)} - True for typed
 * arrays other than DataView.
 *
 */
function isTypedArray(value) {
	return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

/**
 * Called by this module to resolve an optional finite number at a request boundary. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {unknown} value - The candidate value.
 * @param {number} fallback - The value used only when omitted.
 * @param {string} label - The request-property label.
 * @returns {number} - The accepted number.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function finiteNumberOrDefault(value, fallback, label) {
	if (value === undefined) {
		return fallback;
	}

	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new TypeError(`${label} must be finite.`);
	}

	return value;
}

/**
 * Called by this module to accept a non-empty string.
 *
 * @param {unknown} value - The candidate value.
 * @param {string} label - The diagnostic label.
 * @returns {string} - The accepted string.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function requiredString(value, label) {
	if (typeof value !== 'string' || value.trim().length === 0) {
		throw new TypeError(`${label} must be a non-empty string.`);
	}

	return value;
}

/**
 * Called by this module to accept a positive safe integer.
 *
 * @param {unknown} value - The candidate value.
 * @param {string} label - The diagnostic label.
 * @returns {number} - The accepted integer.
 * @throws {RangeError} - When an accepted value is outside the supported range.
 */
function positiveInteger(value, label) {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
		throw new RangeError(`${label} must be a positive safe integer.`);
	}

	return value;
}

/**
 * Called by this module to resolve a boolean with a default used only for omission. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {unknown} value - The optional boolean.
 * @param {boolean} defaultValue - The omission default.
 * @param {string} label - The diagnostic label.
 * @returns {boolean} - The accepted boolean.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
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
 * Called by this module to resolve a nonempty string with an omission default.
 *
 * @param {unknown} value - The optional string.
 * @param {string} defaultValue - The omission default.
 * @param {string} label - The diagnostic label.
 * @returns {string} - The accepted string.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function stringOrDefault(value, defaultValue, label) {
	const candidate = value === undefined ? defaultValue : value;

	if (typeof candidate !== 'string' || candidate.trim().length === 0) {
		throw new TypeError(`${label} must be a nonempty string.`);
	}

	return candidate;
}

/**
 * Called by this module to resolve an optional nonempty string without treating null as omission. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {unknown} value - The optional string.
 * @param {string} label - The diagnostic label.
 * @returns {string | undefined} - The accepted string or undefined.
 */
function optionalString(value, label) {
	if (value === undefined) {
		return undefined;
	}

	return stringOrDefault(value, '', label);
}

/**
 * Called by this module to resolve a positive safe integer with an omission default.
 *
 * @param {unknown} value - The candidate value.
 * @param {number} defaultValue - The omission default.
 * @param {string} label - The diagnostic label.
 * @returns {number} - The accepted integer.
 * @throws {RangeError} - When an accepted value is outside the supported range.
 */
function positiveIntegerOrDefault(value, defaultValue, label) {
	const candidate = value === undefined ? defaultValue : value;

	if (typeof candidate !== 'number' || !Number.isSafeInteger(candidate) || candidate < 1) {
		throw new RangeError(`${label} must be a positive integer.`);
	}

	return candidate;
}

/**
 * Called by this module to accept a non-empty string with an omission default. Conditional result values are selected from the accepted input and current state.
 *
 * @param {unknown} value - The candidate string.
 * @param {string} fallback - The omission default.
 * @param {string} label - The request-property label.
 * @returns {string} - The accepted string.
 */
function requiredStringOrDefault(value, fallback, label) {
	return requiredString(value === undefined ? fallback : value, label);
}

/** General scalar and structural value validation operations. */
export const ValueValidation = {
	booleanOrDefault,
	finiteNumberOrDefault,
	isTypedArray,
	optionalString,
	positiveInteger,
	positiveIntegerOrDefault,
	requiredString,
	requiredStringOrDefault,
	stringOrDefault,
};
