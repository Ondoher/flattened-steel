/** Direct bounded staging for a variable-size point-local shared inventory. */
export default class DistantSunPointLocalCacheStaging {
	/** @type {SharedGenerationFileHandle[]} */ _handles = [];
	/** @type {SharedGenerationStagingLocation[]} */ _locations;
	/** @type {Uint16Array} */ _directionIndexes;
	/** @type {number} */ _nextChannel = 0;
	/** @type {number} */ _nextRow = 0;
	/** @type {number} */ _writtenBytes = 0;

	/**
	 * @param {DistantSunPointLocalInventory} inventory - Validated shared inventory.
	 */
	constructor(inventory) {
		this.inventory = inventory;
		this._directionIndexes = Uint16Array.from({length: inventory.logicalDirectionCount}, (_unused, index) =>
			inventory.directionBytes.readUInt16LE(index * Uint16Array.BYTES_PER_ELEMENT),
		);
		if (
			new Set(this._directionIndexes).size !== inventory.uniqueDirectionCount ||
			this._directionIndexes.some((index) => index >= inventory.uniqueDirectionCount)
		) {
			throw new RangeError('The logical-to-unique direction map is incomplete or out of range.');
		}
		const locations = new Map();
		inventory.blocks.forEach((block, blockIndex) => {
			block.coordinates.forEach((coordinate, row) =>
				locations.set(coordinate.join(':'), {block: blockIndex, row}),
			);
		});
		this._locations = inventory.coordinates.map((coordinate) => locations.get(coordinate.join(':')));
		if (this._locations.some((location) => location === undefined)) {
			throw new RangeError('Every inventory coordinate must have one staging block owner.');
		}
	}

	/** Allocate every final-layout staging file exactly once. */
	async allocate(files, stagingRoot) {
		await files.directory(stagingRoot);
		try {
			for (const [index, block] of this.inventory.blocks.entries()) {
				const handle = await files.create(`${stagingRoot}/block-${String(index).padStart(3, '0')}.f32`);
				this._handles.push(handle);
				await handle.truncate(
					block.coordinates.length *
						this.inventory.uniqueDirectionCount *
						this.inventory.channelCount *
						Float32Array.BYTES_PER_ELEMENT,
				);
			}
		} catch (error) {
			await this.close();
			throw error;
		}
	}

	/** Accept one ordered logical-direction tile and preserve exact Float32 bits after seam collapse. */
	async accept(channel, firstRow, bytes) {
		const logicalRowBytes = this.inventory.logicalDirectionCount * Float32Array.BYTES_PER_ELEMENT;
		const rowCount = bytes.byteLength / logicalRowBytes;
		if (
			channel !== this._nextChannel ||
			channel >= this.inventory.channelCount ||
			firstRow !== this._nextRow ||
			!Number.isInteger(rowCount) ||
			rowCount < 1 ||
			rowCount > 64 ||
			firstRow + rowCount > this._locations.length
		) {
			throw new RangeError('Point-local staging tile order or extent is incompatible.');
		}
		const source = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		const output = Buffer.alloc(this.inventory.uniqueDirectionCount * Float32Array.BYTES_PER_ELEMENT);
		const seen = new Uint8Array(this.inventory.uniqueDirectionCount);
		for (let row = 0; row < rowCount; row += 1) {
			seen.fill(0);
			for (let logical = 0; logical < this.inventory.logicalDirectionCount; logical += 1) {
				const sourceOffset = (row * this.inventory.logicalDirectionCount + logical) * 4;
				const value = source.getFloat32(sourceOffset, true);
				if (!Number.isFinite(value) || value < 0) {
					throw new RangeError('Point-local staging received a nonfinite or negative spectral value.');
				}
				const unique = this._directionIndexes[logical];
				const bits = source.getUint32(sourceOffset, true);
				if (seen[unique] && output.readUInt32LE(unique * 4) !== bits) {
					throw new RangeError('Logical seam duplicates disagree at the Float32 bit level.');
				}
				output.writeUInt32LE(bits, unique * 4);
				seen[unique] = 1;
			}
			const location = this._locations[firstRow + row];
			const blockRows = this.inventory.blocks[location.block].coordinates.length;
			const destinationOffset = (channel * blockRows + location.row) * output.byteLength;
			let written = 0;
			while (written < output.byteLength) {
				const result = await this._handles[location.block].write(
					output,
					written,
					output.byteLength - written,
					destinationOffset + written,
				);
				if (result.bytesWritten === 0) throw new Error('Point-local staging write made no progress.');
				written += result.bytesWritten;
			}
			this._writtenBytes += output.byteLength;
		}
		this._nextRow += rowCount;
		if (this._nextRow === this._locations.length) {
			this._nextRow = 0;
			this._nextChannel += 1;
		}
	}

	/** Require every requested wavelength and union row before packaging. */
	complete() {
		if (this._nextChannel !== this.inventory.channelCount || this._nextRow !== 0) {
			throw new Error('Point-local cache staging is incomplete.');
		}
		return this._writtenBytes;
	}

	/** Flush and release all staging files on success or failure. */
	async close() {
		const results = await Promise.allSettled(
			this._handles.splice(0).map(async (handle) => {
				try {
					await handle.sync();
				} finally {
					await handle.close();
				}
			}),
		);
		const failed = results.find((result) => result.status === 'rejected');
		if (failed?.status === 'rejected') throw failed.reason;
	}
}
