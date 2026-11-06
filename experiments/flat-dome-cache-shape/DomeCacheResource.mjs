/**
 * Owns one complete cumulative cache and its lookup tables on a Three renderer.
 */
export class DomeCacheResource {
	/**
	 * Retains live textures after pure-order construction intermediates are released.
	 *
	 * @param {DomeThreeTarget} cumulative - J2-J4 source-function target.
	 * @param {DomeThreeTexture} positions - Physical nodes and cap distances.
	 * @param {DomeThreeTexture} rows - Ragged valid-domain rows.
	 * @param {DomeTopology} layout - Physical domain.
	 * @param {Record<string, unknown>} metadata - Measured construction evidence.
	 */
	constructor(cumulative, positions, rows, layout, metadata) {
		this.target = cumulative;
		this.positions = positions;
		this.rows = rows;
		this.layout = layout;
		this.metadata = metadata;
		this.identity = {
			generation: 1,
			cumulative: cumulative.texture.uuid,
			positions: positions.uuid,
			rows: rows.uuid,
		};
		this.disposed = false;
	}

	/**
	 * Supplies direct Three texture uniforms without a context copy or rebuild.
	 *
	 * @returns {DomeThreeUniforms} - Shared live cache bindings.
	 */
	uniforms() {
		if (this.disposed) {
			throw new Error('Completed cache has been released.');
		}
		return {
			uPositions: {value: this.positions},
			uRows: {value: this.rows},
			uSecond: {value: this.target.texture},
			uSunRadius: {value: this.layout.sourceRadius},
		};
	}

	/**
	 * Releases the cache only after the final scene consumer finishes.
	 *
	 * @returns {void} - Disposes owned resources once.
	 */
	dispose() {
		if (!this.disposed) {
			this.target.dispose();
			this.positions.dispose();
			this.rows.dispose();
			this.disposed = true;
		}
	}
}
