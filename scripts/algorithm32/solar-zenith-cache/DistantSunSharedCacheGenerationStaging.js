/**
 * Direct staging owner for bounded logical-direction tiles and wavelength-major shared blocks.
 *
 * @implements {SharedGenerationTileSink}
 */
export default class DistantSunSharedCacheGenerationStaging {
	/**
	 * Authenticated control union and canonical block ownership.
	 *
	 * @type {SharedGenerationInventory}
	 */ _inventory;
	/**
	 * Open staging handles retained until flush and cleanup.
	 *
	 * @type {SharedGenerationFileHandle[]}
	 */ _handles = [];
	/**
	 * Canonical block and populated-row destination for each union coordinate.
	 *
	 * @type {SharedGenerationStagingLocation[]}
	 */ _locations = [];
	/**
	 * Logical W27 direction to unique exact-seam direction mapping.
	 *
	 * @type {Uint16Array}
	 */ _directionIndex;
	/**
	 * Next accepted Native15 wavelength ordinal.
	 *
	 * @type {number}
	 */ _nextChannel = 0;
	/**
	 * Next accepted populated union-row ordinal within the wavelength.
	 *
	 * @type {number}
	 */ _nextRow = 0;
	/**
	 * Total exact unique-direction bytes persisted to staging.
	 *
	 * @type {number}
	 */ _writtenBytes = 0;

	/**
	 * Creates the direct block scatter owner for an authenticated control union. An incomplete or out-of-range seam map throws; callers must stop before staging.
	 *
	 * @param {SharedGenerationInventory} inventory - Accepted inventory and exact seam map.
	 */
	constructor(inventory) {
		this._inventory = inventory;
		this._directionIndex = Uint16Array.from({length: 4374}, (_, logicalDirectionIndex) =>
			inventory.directionBytes.readUInt16LE(logicalDirectionIndex * 2),
		);
		if (
			new Set(this._directionIndex).size !== 4058 ||
			this._directionIndex.some((uniqueDirectionIndex) => uniqueDirectionIndex >= 4058)
		)
			throw new Error('The exact seam map is not a complete 4058-direction mapping.');
		const locations = new Map();
		inventory.blocks.forEach((block, ordinal) =>
			block.coordinates.forEach((coordinate, row) => locations.set(coordinate.join(':'), {block: ordinal, row})),
		);
		this._locations = inventory.coordinates.map((coordinate) => locations.get(coordinate.join(':')));
	}

	/**
	 * Call this method to flush and release every staging handle on success or failure. A flush or close failure rejects after all handles settle; callers must preserve failure status.
	 *
	 * @returns {Promise<void>} - Completion after all handles settle.
	 */
	async close() {
		const handles = this._handles.splice(0);
		const results = await Promise.allSettled(
			handles.map(async (handle) => {
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

	/**
	 * Call this method to allocate each exclusive final-layout staging file once. Allocation failure closes acquired handles and rejects; callers must abandon this run.
	 *
	 * @param {SharedGenerationFiles} files - Contained run filesystem.
	 * @param {string} stagingRoot - New run's staging directory.
	 * @returns {Promise<void>} - Completion after all sparse file lengths are fixed.
	 */
	async allocate(files, stagingRoot) {
		await files.directory(stagingRoot);
		try {
			for (const [blockOrdinal, block] of this._inventory.blocks.entries()) {
				const handle = await files.create(`${stagingRoot}/block-${String(blockOrdinal).padStart(3, '0')}.f32`);
				this._handles.push(handle);
				await handle.truncate(block.coordinates.length * 4058 * 15 * 4);
			}
		} catch (error) {
			await this.close();
			throw error;
		}
	}

	/**
	 * Call this method to authenticate tile ordering and persist exact Float32 bit patterns.
	 * Invalid, repeated, incomplete, or out-of-order input fails the run before publication.
	 *
	 * @param {number} channel - Native15 wavelength ordinal.
	 * @param {number} firstRow - First union row in this tile.
	 * @param {Uint8Array} bytes - At most 64 rows of logical W27 Float32 values.
	 * @returns {Promise<void>} - Completion after every row is written.
	 */
	async accept(channel, firstRow, bytes) {
		const rowCount = bytes.byteLength / (4374 * 4);
		if (
			channel !== this._nextChannel ||
			channel >= 15 ||
			firstRow !== this._nextRow ||
			!Number.isInteger(rowCount) ||
			rowCount < 1 ||
			rowCount > 64 ||
			firstRow + rowCount > this._locations.length
		)
			throw new Error('Generation tile order or extent is incompatible.');
		const source = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		const output = Buffer.alloc(4058 * 4);
		const seen = new Uint8Array(4058);
		for (let row = 0; row < rowCount; row += 1) {
			seen.fill(0);
			for (let logical = 0; logical < 4374; logical += 1) {
				const offset = (row * 4374 + logical) * 4;
				const value = source.getFloat32(offset, true);
				if (!Number.isFinite(value) || value < 0)
					throw new Error('Generation tile contains invalid spectral values.');
				const bits = source.getUint32(offset, true);
				const unique = this._directionIndex[logical];
				if (seen[unique] && output.readUInt32LE(unique * 4) !== bits)
					throw new Error('Logical seam duplicates disagree at the Float32 bit level.');
				output.writeUInt32LE(bits, unique * 4);
				seen[unique] = 1;
			}
			const location = this._locations[firstRow + row];
			const blockRows = this._inventory.blocks[location.block].coordinates.length;
			let offset = 0;
			while (offset < output.byteLength) {
				const result = await this._handles[location.block].write(
					output,
					offset,
					output.byteLength - offset,
					(channel * blockRows + location.row) * output.byteLength + offset,
				);
				if (result.bytesWritten === 0) throw new Error('Direct block staging made no progress.');
				offset += result.bytesWritten;
			}
			this._writtenBytes += output.byteLength;
		}
		this._nextRow += rowCount;
		if (this._nextRow === this._locations.length) {
			this._nextRow = 0;
			this._nextChannel += 1;
		}
	}

	/**
	 * Call this method to require all 15 wavelengths before finalization. Missing rows or wavelengths throw; callers must not finalize incomplete staging.
	 *
	 * @returns {number} - Exact unique staged byte count.
	 */
	complete() {
		if (this._nextChannel !== 15 || this._nextRow !== 0) throw new Error('Shared block staging is incomplete.');
		return this._writtenBytes;
	}
}
