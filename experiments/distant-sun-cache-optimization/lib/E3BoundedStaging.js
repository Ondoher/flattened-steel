import {open} from 'node:fs/promises';

/** Owns one preallocated scene staging file and bounded logical-to-unique scatter writes. */
export default class E3BoundedStaging {
	/** @type {import('node:fs/promises').FileHandle} */ _handle;
	/** @type {Uint16Array} */ _logicalToUnique;
	/** @type {number} */ _rowCount;
	/** @type {number} */ _channelCount;
	/** @type {number} */ _logicalDirectionCount;
	/** @type {number} */ _uniqueDirectionCount;
	/** @type {number} */ _rowByteLength;
	/** @type {Set<number>} */ _writtenChannels = new Set();

	/**
	 * Creates an exclusively opened bounded scatter target.
	 *
	 * @param {import('node:fs/promises').FileHandle} handle - Newly allocated staging file.
	 * @param {Uint16Array} logicalToUnique - Canonical W27 logical-to-unique mapping.
	 * @param {number} rowCount - Scene packed-row count.
	 * @param {number} channelCount - Fixed wavelength count.
	 * @param {number} uniqueDirectionCount - Canonical unique-direction count.
	 */
	constructor(handle, logicalToUnique, rowCount, channelCount, uniqueDirectionCount) {
		this._handle = handle;
		this._logicalToUnique = logicalToUnique;
		this._rowCount = rowCount;
		this._channelCount = channelCount;
		this._logicalDirectionCount = logicalToUnique.length;
		this._uniqueDirectionCount = uniqueDirectionCount;
		this._rowByteLength = uniqueDirectionCount * Float32Array.BYTES_PER_ELEMENT;
	}

	/**
	 * Allocate one exact-size, exclusively created staging target.
	 *
	 * @param {string} filePath - New run-local staging-file path.
	 * @param {Uint16Array} logicalToUnique - Canonical mapping.
	 * @param {number} rowCount - Scene packed-row count.
	 * @param {number} channelCount - Fixed wavelength count.
	 * @param {number} uniqueDirectionCount - Canonical unique-direction count.
	 * @returns {Promise<E3BoundedStaging>} - Ready bounded staging owner.
	 */
	static async create(filePath, logicalToUnique, rowCount, channelCount, uniqueDirectionCount) {
		if (!Number.isSafeInteger(rowCount) || rowCount < 1 || !Number.isSafeInteger(channelCount) || channelCount < 1) {
			throw new RangeError('E3 staging dimensions must be positive safe integers.');
		}
		if (logicalToUnique.length === 0 || !Number.isSafeInteger(uniqueDirectionCount) || uniqueDirectionCount < 1) {
			throw new RangeError('E3 staging direction layout is invalid.');
		}
		for (const uniqueIndex of logicalToUnique) {
			if (uniqueIndex >= uniqueDirectionCount) throw new RangeError('E3 logical direction mapping escapes the unique domain.');
		}
		const handle = await open(filePath, 'wx+');
		const byteLength = rowCount * channelCount * uniqueDirectionCount * Float32Array.BYTES_PER_ELEMENT;
		try {
			await handle.truncate(byteLength);
			return new E3BoundedStaging(handle, logicalToUnique, rowCount, channelCount, uniqueDirectionCount);
		} catch (error) {
			await handle.close();
			throw error;
		}
	}

	/**
	 * Scatter exactly one logical GPU layer into its final unique-row offsets.
	 *
	 * @param {number} channelIndex - Wavelength ordinal.
	 * @param {Float32Array} logicalValues - W27 values ordered by packed row.
	 * @returns {Promise<void>} - Completion after every unique row has been persisted.
	 */
	async writeLogicalLayer(channelIndex, logicalValues) {
		if (!Number.isInteger(channelIndex) || channelIndex < 0 || channelIndex >= this._channelCount) {
			throw new RangeError('E3 channel index is outside the declared staging range.');
		}
		if (this._writtenChannels.has(channelIndex)) throw new Error('E3 staging channel was already written.');
		if (logicalValues.length !== this._rowCount * this._logicalDirectionCount) {
			throw new RangeError('E3 logical layer length differs from the declared ledger shape.');
		}
		const unique = new Float32Array(this._uniqueDirectionCount);
		for (let rowIndex = 0; rowIndex < this._rowCount; rowIndex += 1) {
			unique.fill(Number.NaN);
			const logicalStart = rowIndex * this._logicalDirectionCount;
			for (let logicalIndex = 0; logicalIndex < this._logicalDirectionCount; logicalIndex += 1) {
				const uniqueIndex = this._logicalToUnique[logicalIndex];
				const value = logicalValues[logicalStart + logicalIndex];
				if (!Number.isFinite(value) || value < 0) throw new RangeError('E3 GPU layer contains an invalid radiance value.');
				if (Number.isNaN(unique[uniqueIndex])) unique[uniqueIndex] = value;
				else if (unique[uniqueIndex] !== value) throw new Error('E3 logical seam values disagree for one unique direction.');
			}
			if (unique.some(Number.isNaN)) throw new Error('E3 logical layer omits a unique direction.');
			const position = (channelIndex * this._rowCount + rowIndex) * this._rowByteLength;
			await this._writeExactly(Buffer.from(unique.buffer), position);
		}
		this._writtenChannels.add(channelIndex);
	}

	/** @returns {number} - Declared Native15 channel count for host ingress validation. */
	get channelCount() {
		return this._channelCount;
	}

	/** Require every declared wavelength before consumers read the file. */
	async closeComplete() {
		if (this._writtenChannels.size !== this._channelCount) throw new Error('E3 staging file is incomplete.');
		await this._handle.sync();
		await this._handle.close();
	}

	/** Close an incomplete staging file after a failed or interrupted run. */
	async close() {
		await this._handle.close();
	}

	/** @param {Buffer} bytes - Exact output bytes. @param {number} position - File offset. */
	async _writeExactly(bytes, position) {
		let offset = 0;
		while (offset < bytes.byteLength) {
			const {bytesWritten} = await this._handle.write(bytes, offset, bytes.byteLength - offset, position + offset);
			if (bytesWritten === 0) throw new Error('E3 staging write made no progress.');
			offset += bytesWritten;
		}
	}
}
