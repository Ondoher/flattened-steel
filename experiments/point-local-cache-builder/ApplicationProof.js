/** Exact Float32 comparison against the authenticated production shared inventory. */
export default class ApplicationProof {
	/** Creates a reference reader for selected wavelengths without rebuilding controls.
	 * @param {BuilderRun} run - Current evidence owner.
	 * @param {CacheReuseControls} controls - Authenticated production package graph.
	 * @param {BuilderInventory} inventory - Candidate scene inventory.
	 */
	constructor(run, controls, inventory) {
		this.run = run;
		this.controls = controls;
		this.inventory = inventory;
		this.owners = new Map();
		this.cache = new Map();
		this.comparedValues = 0;
		controls.graph.blockIndex.blocks.forEach((block, ordinal) =>
			block.coordinates.forEach((coordinate, row) =>
				this.owners.set(coordinate.join(':'), {ordinal, row, block}),
			),
		);
		if (!inventory.directionBytes.equals(controls.inventory.directionBytes))
			throw new Error('Direction seam identity changed.');
	}

	/** Call this method to read one authenticated reference row for a selected wavelength.
	 * @param {number[]} coordinate - Altitude/local-Sun-angle indices.
	 * @param {number} wavelength - Original application wavelength index.
	 * @returns {Promise<Buffer>} - Exact unique-direction control row.
	 */
	async row(coordinate, wavelength) {
		const owner = this.owners.get(coordinate.join(':'));
		if (!owner) throw new Error('Candidate coordinate missing from qualified control.');
		if (!this.cache.has(owner.ordinal)) {
			const relative = `${this.controls.root}/staging/block-${String(owner.ordinal).padStart(3, '0')}.f32`;
			const bytes = await this.run.read(relative, {...owner.block.decoded, path: relative});
			const channels = new Map();
			const size = owner.block.coordinates.length * this.inventory.uniqueCount * 4;
			for (const channel of this.inventory.wavelengths)
				channels.set(channel, Buffer.from(bytes.subarray(channel * size, (channel + 1) * size)));
			this.cache.set(owner.ordinal, channels);
		}
		const channel = this.cache.get(owner.ordinal).get(wavelength);
		const size = this.inventory.uniqueCount * 4;
		return channel.subarray(owner.row * size, (owner.row + 1) * size);
	}

	/** Call this method to compare every logical value in an incoming GPU tile.
	 * @param {number} wavelength - Original wavelength index.
	 * @param {number} firstRow - Candidate union row offset.
	 * @param {Buffer} bytes - Complete logical-direction tile.
	 * @returns {Promise<void>} - Completion after exact bit comparison.
	 */
	async tile(wavelength, firstRow, bytes) {
		const count = this.inventory.directionCount;
		for (let row = 0; row < bytes.length / (count * 4); row++) {
			const expected = await this.row(this.inventory.coordinates[firstRow + row], wavelength);
			for (let direction = 0; direction < count; direction++) {
				const unique = this.inventory.directionBytes.readUInt16LE(direction * 2);
				if (bytes.readUInt32LE((row * count + direction) * 4) !== expected.readUInt32LE(unique * 4))
					throw new Error(
						`GPU mismatch: wavelength ${wavelength}, row ${firstRow + row}, direction ${direction}`,
					);
				this.comparedValues++;
			}
		}
	}
}
