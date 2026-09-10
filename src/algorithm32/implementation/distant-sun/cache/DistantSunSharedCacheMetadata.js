import DistantSunSharedCacheRuntimeContracts from './DistantSunSharedCacheRuntimeContracts.js';
import {
	DISTANT_SUN_SHARED_CACHE_ALTITUDE_LEDGER_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_PUBLICATION_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_RESIDENT_SLOT_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_ROW_ADDRESS_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS,
} from './consts.js';

/**
 * Canonical authenticated coordinate-to-slot metadata and publication builder.
 */
export default class DistantSunSharedCacheMetadata {
	/**
	 * Independent authenticated graph snapshot.
	 *
	 * @type {DistantSunSharedCachePackageGraph}
	 */
	_graph;
	/**
	 * Complete coordinate ownership.
	 *
	 * @type {Map<string, {id: string, row: number}>}
	 */
	_coordinates = new Map();
	/**
	 * Immutable scene/altitude ledger values.
	 *
	 * @type {Int32Array}
	 */
	_altitudes = new Int32Array(48 * 109 * 4);
	/**
	 * Packed-row extent for every scene.
	 *
	 * @type {number[]}
	 */
	_counts;
	/**
	 * Maximum scene packed-row extent.
	 *
	 * @type {number}
	 */
	_width;
	/**
	 * Publication validation owner.
	 */
	_contracts = new DistantSunSharedCacheRuntimeContracts();

	/**
	 * Creates metadata from one authenticated package snapshot.
	 *
	 * @param {DistantSunSharedCachePackageGraph} graph - Authenticated graph.
	 */
	constructor(graph) {
		this._graph = graph;
		this._counts = graph.scenes.map((scene) => scene.coordinates.length);
		this._width = Math.max(...this._counts);
		for (const block of graph.blockIndex.blocks)
			block.coordinates.forEach((coordinate, row) =>
				this._coordinates.set(coordinate.join(','), {id: block.id, row}),
			);
		graph.scenes.forEach((scene, ordinal) => {
			for (const row of scene.ledger.rows)
				this._altitudes.set(
					[row.firstSolarZenithIndex, row.lastSolarZenithIndex, row.firstPackedRow, 0],
					(ordinal * 48 + row.altitudeIndex) * 4,
				);
		});
	}

	/**
	 * Call this method to build one complete current-generation publication without exposing mutable slot state.
	 *
	 * @param {number | null} sceneOrdinal - Requested scene ordinal, or null for texture-free darkness.
	 * @param {number} generation - Current transaction generation.
	 * @param {readonly DistantSunSharedCacheAtlasSlot[]} slots - Successfully uploaded slots.
	 * @param {number} layerCount - Allocated atlas capacity.
	 * @returns {DistantSunSharedCachePublicationSnapshot} - Validated complete snapshot.
	 */
	build(sceneOrdinal, generation, slots, layerCount) {
		if (sceneOrdinal === null)
			return this._contracts.acceptPublicationSnapshot({
				schemaId: DISTANT_SUN_SHARED_CACHE_PUBLICATION_SCHEMA_ID,
				generation,
				status: 'dark',
				sceneOrdinal: null,
				representativeSolarZenithDegrees: null,
				requiredBlockIds: [],
				residentSlots: [],
				rowAddressTable: null,
				altitudeLedgerTable: null,
			});
		const byId = new Map(slots.map((slot) => [slot.block.id, slot]));
		const values = new Uint16Array(this._width * 109 * 2).fill(DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS);
		this._graph.scenes.forEach((scene, ordinal) =>
			scene.coordinates.forEach((coordinate, packedRow) => {
				const owner = this._coordinates.get(coordinate.join(','));
				const slot = owner && byId.get(owner.id);
				if (slot) values.set([slot.index, owner.row], (ordinal * this._width + packedRow) * 2);
			}),
		);
		return this._contracts.acceptPublicationSnapshot({
			schemaId: DISTANT_SUN_SHARED_CACHE_PUBLICATION_SCHEMA_ID,
			generation,
			status: 'ready',
			sceneOrdinal,
			representativeSolarZenithDegrees: sceneOrdinal,
			requiredBlockIds: [...this._graph.scenes[sceneOrdinal].requiredBlockIds],
			residentSlots: slots.map((slot) => ({
				schemaId: DISTANT_SUN_SHARED_CACHE_RESIDENT_SLOT_SCHEMA_ID,
				generation,
				slotIndex: slot.index,
				state: 'uploaded',
				logicalBlockId: slot.block.id,
				decodedSha256: slot.block.decoded.sha256,
				blockRowCount: slot.block.rowCount,
			})),
			rowAddressTable: {
				schemaId: DISTANT_SUN_SHARED_CACHE_ROW_ADDRESS_SCHEMA_ID,
				generation,
				format: 'RG16UI',
				width: this._width,
				height: 109,
				residentLayerCount: layerCount,
				sceneRowCounts: [...this._counts],
				unavailableValue: DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS,
				values,
			},
			altitudeLedgerTable: {
				schemaId: DISTANT_SUN_SHARED_CACHE_ALTITUDE_LEDGER_SCHEMA_ID,
				generation,
				format: 'RGBA32I',
				width: 48,
				height: 109,
				values: new Int32Array(this._altitudes),
			},
		});
	}
}
