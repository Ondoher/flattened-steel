import {open} from 'node:fs/promises';
import {createHash} from 'node:crypto';

/** Exact candidate tile comparison against authenticated shared control blocks. */
export default class ApplicationTileProof {
	/** Creates a bounded comparison sink.
	 * @param {CacheReuseRun} run - Evidence owner.
	 * @param {CacheReuseControls} controls - Authenticated inputs.
	 */
	constructor(run, controls) {
		this.run = run;
		this.controls = controls;
		this.handles = [];
		this.owners = new Map();
		this.channelBlocks = new Map();
		this.nextChannel = 0;
		this.nextRow = 0;
		this.comparedBytes = 0;
		this.digest = createHash('sha256');
	}

	/** Call this method to authenticate reference blocks and open exclusive output.
	 * @returns {Promise<void>} - Completion after all references are authenticated.
	 */
	async start() {
		for (const [ordinal, block] of this.controls.graph.blockIndex.blocks.entries()) {
			const relative = `${this.controls.root}/staging/block-${String(ordinal).padStart(3, '0')}.f32`;
			await this.run.read(relative, {...block.decoded, path: relative});
			const handle = await open(await this.run.files.resolve(relative), 'r');
			this.handles.push(handle);
			for (const [row, coordinate] of block.coordinates.entries())
				this.owners.set(coordinate.join(':'), {ordinal, row, count: block.rowCount});
		}
		this.output = await this.run.files.create(`${this.run.root}/candidate-union.f32`);
	}

	/** Call this method to compare and persist one ordered logical-direction tile.
	 * @param {number} job - Input job ordinal.
	 * @param {number} channel - Spectral channel ordinal.
	 * @param {number} firstRow - Union coordinate row offset.
	 * @param {Buffer} bytes - Bounded Float32 tile.
	 * @returns {Promise<void>} - Completion after exact comparison and persistence.
	 */
	async accept(job, channel, firstRow, bytes) {
		const inventory = this.controls.inventory;
		const rowCount = bytes.length / (4374 * 4);
		if (
			job !== 0 ||
			channel !== this.nextChannel ||
			firstRow !== this.nextRow ||
			!Number.isInteger(rowCount) ||
			rowCount < 1 ||
			rowCount > 64 ||
			firstRow + rowCount > inventory.coordinates.length
		)
			throw new Error('Invalid tile order or length.');
		const unique = Buffer.alloc(rowCount * 4058 * 4);
		const seen = new Uint8Array(4058);
		for (let row = 0; row < rowCount; row++) {
			seen.fill(0);
			for (let direction = 0; direction < 4374; direction++) {
				const index = inventory.directionBytes.readUInt16LE(direction * 2);
				const word = bytes.readUInt32LE((row * 4374 + direction) * 4);
				const offset = (row * 4058 + index) * 4;
				if (seen[index] && unique.readUInt32LE(offset) !== word) throw new Error('Exact seam mismatch.');
				unique.writeUInt32LE(word, offset);
				seen[index] = 1;
			}
			const owner = this.owners.get(inventory.coordinates[firstRow + row].join(':'));
			if (!this.channelBlocks.has(owner.ordinal)) {
				const block = Buffer.alloc(owner.count * 4058 * 4);
				const read = await this.handles[owner.ordinal].read(block, 0, block.length, channel * block.length);
				if (read.bytesRead !== block.length) throw new Error('Reference block truncated.');
				this.channelBlocks.set(owner.ordinal, block);
			}
			const expected = this.channelBlocks
				.get(owner.ordinal)
				.subarray(owner.row * 4058 * 4, (owner.row + 1) * 4058 * 4);
			if (!unique.subarray(row * 4058 * 4, (row + 1) * 4058 * 4).equals(expected))
				throw new Error(`GPU differs at wavelength ${channel}, union row ${firstRow + row}.`);
		}
		await this.output.writeFile(unique);
		this.digest.update(unique);
		this.comparedBytes += unique.length;
		this.nextRow += rowCount;
		if (this.nextRow === inventory.coordinates.length) {
			this.nextRow = 0;
			this.nextChannel++;
			this.channelBlocks.clear();
			this.run.progress({
				phase: 'exact-wavelength',
				completed: this.nextChannel,
				total: 15,
				message: 'Candidate wavelength exactly matches the qualified shared inventory.',
			});
		}
	}

	/** Call this method to release handles after success or failure.
	 * @returns {Promise<void>} - Completion after every handle settles.
	 */
	async close() {
		if (this.output) {
			await this.output.sync();
			await this.output.close();
			this.output = null;
		}
		await Promise.all(this.handles.splice(0).map((handle) => handle.close()));
	}

	/** Call this method after complete delivery to identify the exact candidate inventory.
	 * @param {number} channels - Requested number of complete wavelengths.
	 * @returns {DistantSunSharedCacheFileIdentity} - Candidate artifact identity.
	 */
	complete(channels) {
		if (this.nextChannel !== channels || this.nextRow !== 0) throw new Error('Incomplete GPU inventory.');
		return {
			path: `${this.run.root}/candidate-union.f32`,
			byteLength: this.comparedBytes,
			sha256: this.digest.digest('hex'),
		};
	}
}
