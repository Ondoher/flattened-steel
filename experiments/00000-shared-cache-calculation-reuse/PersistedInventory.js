import {open} from 'node:fs/promises';

/** Read-only persisted result inventory with a bounded row cache. */
export default class PersistedInventory {
	/** Creates a reader with a caller-selected row residency limit.
	 * @param {CacheReuseRun} run - Contained evidence reader.
	 * @param {CacheReusePersistedDefinition} definition - Authenticated complete inventory layout.
	 * @param {number} maximumRows - Maximum resident result rows.
	 */
	constructor(run, definition, maximumRows) {
		if (!Number.isSafeInteger(maximumRows) || maximumRows < 1) throw new Error('Invalid row residency budget.');
		this.run = run;
		this.definition = definition;
		this.maximumRows = maximumRows;
		this.rows = new Map();
		this.locations = new Map();
		this.stats = {reads: 0, hits: 0, evictions: 0, peakResidentBytes: 0};
		for (const [row, coordinate] of definition.coordinates.entries()) {
			const key = JSON.stringify(coordinate);
			if (this.locations.has(key)) throw new Error('Duplicate inventory coordinate.');
			this.locations.set(key, row);
		}
	}

	/** Call this method to open the authenticated payload for positional reads.
	 * @returns {Promise<void>} - Completion after the payload length is checked.
	 */
	async start() {
		const expectedBytes = this.definition.coordinates.length * this.definition.channels * this.definition.rowBytes;
		if (expectedBytes !== this.definition.artifact.byteLength) throw new Error('Inventory layout length differs.');
		this.handle = await open(await this.run.files.resolve(this.definition.artifact.path), 'r');
		if ((await this.handle.stat()).size !== expectedBytes) {
			await this.close();
			throw new Error('Inventory payload length changed.');
		}
	}

	/** Call this method to read an exact result, evicting memory without recomputing it.
	 * @param {string} configurationIdentity - Complete requested dependency identity.
	 * @param {readonly number[]} coordinate - Requested altitude/Sun-angle indexes.
	 * @param {number} channel - Requested spectral channel.
	 * @returns {Promise<Buffer>} - Owned copy of the exact persisted row.
	 */
	async read(configurationIdentity, coordinate, channel) {
		if (configurationIdentity !== this.definition.configurationIdentity)
			throw new Error('Inventory configuration mismatch.');
		if (!Number.isInteger(channel) || channel < 0 || channel >= this.definition.channels)
			throw new Error('Invalid spectral channel.');
		const row = this.locations.get(JSON.stringify(coordinate));
		if (row === undefined) throw new Error('Requested work is absent from the persisted inventory.');
		const key = `${channel}:${row}`;
		if (this.rows.has(key)) {
			const value = this.rows.get(key);
			this.rows.delete(key);
			this.rows.set(key, value);
			this.stats.hits++;
			return Buffer.from(value);
		}
		const value = Buffer.alloc(this.definition.rowBytes);
		const read = await this.handle.read(
			value,
			0,
			value.length,
			(channel * this.definition.coordinates.length + row) * value.length,
		);
		if (read.bytesRead !== value.length) throw new Error('Inventory row truncated.');
		while (this.rows.size >= this.maximumRows) {
			this.rows.delete(this.rows.keys().next().value);
			this.stats.evictions++;
		}
		this.rows.set(key, value);
		this.stats.reads++;
		this.stats.peakResidentBytes = Math.max(this.stats.peakResidentBytes, this.rows.size * value.length);
		return Buffer.from(value);
	}

	/** Call this method to close the file and release all row buffers.
	 * @returns {Promise<void>} - Completion after the handle closes.
	 */
	async close() {
		if (this.handle) {
			await this.handle.close();
			this.handle = null;
		}
		this.rows.clear();
	}
}
