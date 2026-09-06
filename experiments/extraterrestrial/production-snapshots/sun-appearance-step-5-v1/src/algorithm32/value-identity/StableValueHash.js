/**
 * Called by this module to serialize one value with cycle-aware stable ordering. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {unknown} value - Supplies the value to serialize.
 * @param {WeakSet<object>} seenObjects - Tracks visited objects.
 * @returns {string} - Stable text.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function serializeStableValue(value, seenObjects) {
	if (value === null) {
		return 'null';
	}

	const valueType = typeof value;

	if (valueType === 'string') {
		return JSON.stringify(value);
	}

	if (valueType === 'number') {
		if (Number.isNaN(value)) {
			return '"Number.NaN"';
		}

		if (value === Number.POSITIVE_INFINITY) {
			return '"Number.POSITIVE_INFINITY"';
		}

		if (value === Number.NEGATIVE_INFINITY) {
			return '"Number.NEGATIVE_INFINITY"';
		}

		return JSON.stringify(value);
	}

	if (valueType === 'boolean') {
		return value ? 'true' : 'false';
	}

	if (valueType === 'undefined') {
		return '"undefined"';
	}

	if (valueType === 'bigint') {
		return `"BigInt:${value.toString()}"`;
	}

	if (Array.isArray(value)) {
		return `[${value
			.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param entry - The entry value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (entry) => serializeStableValue(entry, seenObjects),
			)
			.join(',')}]`;
	}

	if (ArrayBuffer.isView(value)) {
		const viewEntries = [];
		const viewLength = Reflect.get(value, 'length');

		if (typeof viewLength === 'number') {
			for (let index = 0; index < viewLength; index += 1) {
				viewEntries.push(Reflect.get(value, String(index)));
			}
		}

		return `${value.constructor.name}[${viewEntries
			.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param entry - The entry value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (entry) => serializeStableValue(entry, seenObjects),
			)
			.join(',')}]`;
	}

	if (valueType !== 'object') {
		return JSON.stringify(String(value));
	}

	if (seenObjects.has(value)) {
		throw new TypeError('Cannot stable-hash cyclic values.');
	}

	seenObjects.add(value);

	const entries = Object.keys(value)
		.sort()
		.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param key - The identity key accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (key) => `${JSON.stringify(key)}:${serializeStableValue(value[key], seenObjects)}`,
		);

	seenObjects.delete(value);

	return `{${entries.join(',')}}`;
}

/**
 * Called by this module to serialize a value with sorted object keys and stable typed-array handling.
 *
 * @param {unknown} value - Supplies the value to serialize.
 * @returns {string} - Deterministic JSON-like text.
 *
 */
function stableStringify(value) {
	return serializeStableValue(value, new WeakSet());
}

/**
 * Called by this module to create a deterministic browser-safe FNV-1a identity for shader declarations and source.
 *
 * @param {unknown} value - Supplies the value to hash.
 * @returns {string} - A stable non-cryptographic hash string.
 *
 */
function stableHash(value) {
	const text = stableStringify(value);
	let hash = 2166136261;

	for (let index = 0; index < text.length; index += 1) {
		hash ^= text.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}

	return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/** Cycle-aware stable serialization and FNV-1a identity methods. */
export const StableValueHash = {
	serializeStableValue,
	stableHash,
	stableStringify,
};
