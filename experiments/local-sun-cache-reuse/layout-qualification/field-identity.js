/** Hash the actual FP32 bytes without redundant whole-field copies.
 * @param {LocalSunRotationField} field - Complete actual GPU readback.
 * @param {number} occupied - Unchanged admitted prefix length.
 * @returns {Promise<LocalSunOccupiedFieldIdentity>} - Physical-prefix identity and explicit zero-slot count.
 */
export async function occupiedFieldIdentity(field, occupied) {
	const {width, height, layers} = field.storage;
	if (!Number.isInteger(occupied) || occupied < 1 || occupied > height)
		throw new Error('Invalid occupied field prefix.');
	let emptyNonzero = 0;
	let values = field.values;
	/** @param {Float32Array} data - Nonshared actual readback bytes.
	 * @returns {Promise<string>} - SHA-256 of its exact view without copying.
	 */
	const digestOf = async (data) => {
		if (!(data.buffer instanceof ArrayBuffer)) throw new Error('Shared readbacks are not admitted.');
		const digest = await crypto.subtle.digest(
			'SHA-256',
			new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
		);
		return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
	};
	const sha256 = await digestOf(values);
	if (occupied !== height) {
		values = new Float32Array(occupied * width * layers);
		for (let c = 0; c < layers; c++) {
			values.set(
				field.values.subarray(c * height * width, (c * height + occupied) * width),
				c * occupied * width,
			);
			for (let p = occupied; p < height; p++)
				for (let d = 0; d < width; d++) if (field.values[(c * height + p) * width + d] !== 0) emptyNonzero++;
		}
	}
	return {
		sha256,
		occupiedSha256: occupied === height ? sha256 : await digestOf(values),
		occupiedNodes: occupied,
		emptyNonzero,
	};
}

/** Observe a completed order field before releasing its diagnostic array.
 * @param {string} id - Pure J or transported L identity.
 * @param {LocalSunRotationField} field - Actual complete readback.
 * @param {number} occupied - Identical occupied prefix length.
 * @returns {Promise<LocalSunObservedOrderField>} - Complete scalar validity and byte identities.
 */
export async function observeOrderField(id, field, occupied) {
	let nonfinite = 0,
		negative = 0,
		negativeBeyondAbsolute = 0;
	const absolute = id.includes('-j') ? 1e-12 : 1e-9;
	for (const value of field.values) {
		if (!Number.isFinite(value)) nonfinite++;
		if (value < 0) negative++;
		if (value < -absolute) negativeBeyondAbsolute++;
	}
	return {
		id,
		...(await occupiedFieldIdentity(field, occupied)),
		storage: field.storage,
		nonfinite,
		negative,
		negativeBeyondAbsolute,
		absolute,
	};
}
