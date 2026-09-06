/**
 * Test whether a value is an accepted typed array.
 *
 * @param {unknown} value - Supplies the candidate value.
 * @returns {value is (ArrayBufferView & ArrayLike<unknown>)} True for typed arrays other than DataView.
 */
export function isTypedArray(value) {
	return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

/**
 * Recursively copy trusted typed descriptor data.
 *
 * @param {unknown} value - Supplies the typed value to copy.
 * @returns {unknown} The copied value.
 */
function copyDescriptorData(value) {
	if (Array.isArray(value) || isTypedArray(value)) {
		return Array.from(value, (entry) => copyDescriptorData(entry));
	}

	if (value !== null && typeof value === 'object') {
		const source = /** @type {Record<string, unknown>} */ (value);
		/** @type {Record<string, unknown>} */
		const result = {};
		for (const key of Object.keys(source).sort()) {
			result[key] = copyDescriptorData(source[key]);
		}
		return result;
	}

	return value;
}

/**
 * Serialize one canonical value.
 *
 * @param {unknown} value - Supplies the typed value to serialize.
 * @returns {string} Canonical text.
 */
function serializeCanonicalDescriptor(value) {
	if (Array.isArray(value) || isTypedArray(value)) {
		return `[${Array.from(value, (entry) =>
			serializeCanonicalDescriptor(entry)).join(',')}]`;
	}

	if (value !== null && typeof value === 'object') {
		const source = /** @type {Record<string, unknown>} */ (value);
		return `{${Object.keys(source).sort().map((key) =>
			`${JSON.stringify(key)}:${serializeCanonicalDescriptor(source[key])}`
		).join(',')}}`;
	}

	return Object.is(value, -0)
		? '-0'
		: /** @type {string} */ (JSON.stringify(value));
}

/**
 * Rotate one unsigned 32-bit word right.
 *
 * @param {number} value - Supplies the unsigned word.
 * @param {number} count - Supplies the rotation count.
 * @returns {number} The rotated word.
 */
function rotateRight(value, count) {
	return (value >>> count) | (value << (32 - count));
}

/**
 * Copy descriptor data into readonly plain values.
 *
 * The ambient descriptor contract supplies ordinary acyclic data. This
 * utility trusts that contract and only copies it; it does not validate the
 * repository-owned metadata. Typed arrays are normalized to ordinary arrays
 * so CPU and browser callers hash the same logical data.
 *
 * @template T
 * @param {T} value - Supplies descriptor data to copy.
 * @returns {DescriptorDataCopy<T>} The independent readonly copy.
 */
export function immutableDescriptorData(value) {
	return /** @type {DescriptorDataCopy<T>} */ (
		copyDescriptorData(value)
	);
}

/**
 * Serialize supported descriptor data with stable key ordering.
 *
 * @param {unknown} value - Supplies descriptor data to serialize.
 * @returns {string} Canonical descriptor text.
 */
export function canonicalDescriptorString(value) {
	return serializeCanonicalDescriptor(value);
}

/**
 * Compute a synchronous browser-safe SHA-256 identity for descriptor data.
 *
 * @param {unknown} value - Supplies descriptor data to identify.
 * @returns {string} A lower-case SHA-256 identity with an algorithm prefix.
 */
export function sha256Descriptor(value) {
	const bytes = new TextEncoder().encode(canonicalDescriptorString(value));
	const bitLength = bytes.length * 8;
	const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
	const padded = new Uint8Array(paddedLength);
	padded.set(bytes);
	padded[bytes.length] = 0x80;

	const view = new DataView(padded.buffer);
	view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
	view.setUint32(paddedLength - 4, bitLength >>> 0, false);

	const hash = new Uint32Array([
		0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
		0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
	]);
	const schedule = new Uint32Array(64);

	for (let offset = 0; offset < paddedLength; offset += 64) {
		for (let index = 0; index < 16; index += 1) {
			schedule[index] = view.getUint32(offset + index * 4, false);
		}

		for (let index = 16; index < 64; index += 1) {
			const left = schedule[index - 15];
			const right = schedule[index - 2];
			const sigma0 = rotateRight(left, 7) ^ rotateRight(left, 18) ^ (left >>> 3);
			const sigma1 = rotateRight(right, 17) ^ rotateRight(right, 19) ^ (right >>> 10);
			schedule[index] = (
				schedule[index - 16]
				+ sigma0
				+ schedule[index - 7]
				+ sigma1
			) >>> 0;
		}

		let [a, b, c, d, e, f, g, h] = hash;

		for (let index = 0; index < 64; index += 1) {
			const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
			const choice = (e & f) ^ (~e & g);
			const temporary1 = (
				h
				+ sum1
				+ choice
				+ SHA256_CONSTANTS[index]
				+ schedule[index]
			) >>> 0;
			const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
			const majority = (a & b) ^ (a & c) ^ (b & c);
			const temporary2 = (sum0 + majority) >>> 0;

			h = g;
			g = f;
			f = e;
			e = (d + temporary1) >>> 0;
			d = c;
			c = b;
			b = a;
			a = (temporary1 + temporary2) >>> 0;
		}

		hash[0] = (hash[0] + a) >>> 0;
		hash[1] = (hash[1] + b) >>> 0;
		hash[2] = (hash[2] + c) >>> 0;
		hash[3] = (hash[3] + d) >>> 0;
		hash[4] = (hash[4] + e) >>> 0;
		hash[5] = (hash[5] + f) >>> 0;
		hash[6] = (hash[6] + g) >>> 0;
		hash[7] = (hash[7] + h) >>> 0;
	}

	return `sha256:${Array.from(hash, (word) =>
		word.toString(16).padStart(8, '0')).join('')}`;
}

/**
 * Assert a non-empty string.
 *
 * @param {unknown} value - Supplies the candidate value.
 * @param {string} label - Supplies a diagnostic label.
 * @returns {string} The validated string.
 */
export function requiredString(value, label) {
	if (typeof value !== 'string' || value.trim().length === 0) {
		throw new TypeError(`${label} must be a non-empty string.`);
	}

	return value;
}

/**
 * Assert a positive safe integer.
 *
 * @param {unknown} value - Supplies the candidate value.
 * @param {string} label - Supplies a diagnostic label.
 * @returns {number} The validated integer.
 */
export function positiveInteger(value, label) {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
		throw new RangeError(`${label} must be a positive safe integer.`);
	}

	return value;
}

/**
 * Identify ordinary data for the remaining legacy descriptor assertion API.
 * Trusted metadata copying and hashing do not call this helper.
 *
 * @param {unknown} value - Supplies the assertion candidate.
 * @returns {value is Record<PropertyKey, unknown>} Whether the value is ordinary data.
 */
function isPlainObject(value) {
	if (value === null || typeof value !== 'object') {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

/**
 * Require one descriptor record to be exact declarative plain data.
 *
 * This closes the gap where a content hash can correctly cover the declared
 * fields while an unchecked mutable or executable property remains attached
 * to the accepted object.
 *
 * @param {unknown} value - Supplies the candidate record.
 * @param {readonly string[]} expectedKeys - Supplies its complete own-key set.
 * @param {string} label - Supplies a diagnostic label.
 * @returns {Readonly<Record<string, unknown>>} Return the validated record.
 */
export function assertImmutableDescriptorRecord(value, expectedKeys, label) {
	if (!isPlainObject(value)) {
		throw new TypeError(`${label} must be declarative plain data.`);
	}

	const ownKeys = Reflect.ownKeys(value);
	const expected = new Set(expectedKeys);
	const hasUnexpectedKey = ownKeys.some((key) =>
		typeof key !== 'string' || !expected.has(key));

	if (hasUnexpectedKey || ownKeys.length !== expected.size) {
		throw new TypeError(
			`${label} must contain exactly its declared metadata fields.`,
		);
	}

	return /** @type {Readonly<Record<string, unknown>>} */ (value);
}

const SHA256_CONSTANTS = new Uint32Array([
	0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
	0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
	0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
	0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
	0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
	0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
	0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
	0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
	0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
	0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
	0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
