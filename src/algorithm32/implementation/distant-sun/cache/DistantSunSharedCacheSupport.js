import {NATIVE_48_POSITION_DOMAIN_OWNER, SOLAR_ZENITH_180_DOMAIN_OWNER} from '../../../sampling-domains/index.js';
import {DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS} from './consts.js';

/** Complete cubic coordinate support derived from authenticated block and scene inventories. */
export default class DistantSunSharedCacheSupport {
	/** Complete cubic block requirements per scene. @type {string[][]} */
	_required;

	/** Create support for a package containing every interior neighbor; incomplete packages throw.
	 * @param {DistantSunSharedCacheSupportInventory} graph - Already authenticated scene and block inventories.
	 */
	constructor(graph) {
		const owners = new Map();
		for (const block of graph.blockIndex.blocks) {
			for (const coordinate of block.coordinates) owners.set(coordinate.join(':'), block.id);
		}
		this._required = graph.scenes.map((scene) => {
			const required = new Set(scene.requiredBlockIds);
			for (const row of scene.ledger.rows) {
				const first = Math.max(0, row.firstSolarZenithIndex - 1);
				const last = Math.min(SOLAR_ZENITH_180_DOMAIN_OWNER.count - 1, row.lastSolarZenithIndex + 1);
				for (let zenith = first; zenith <= last; zenith++) {
					const owner = owners.get(`${row.altitudeIndex}:${zenith}`);
					if (!owner)
						throw new RangeError(
							`Cubic cache omits interior coordinate ${row.altitudeIndex}:${zenith} for scene ${scene.id}.`,
						);
					required.add(owner);
				}
			}
			return [...required];
		});
	}

	/** Return a caller-owned complete support list, without prediction.
	 * @param {number} ordinal - Accepted scene ordinal.
	 * @returns {string[]} - Required block identities.
	 */
	getRequiredBlocks(ordinal) {
		return [...this._required[ordinal]];
	}

	/** Build direct coordinate addresses from successfully uploaded slots.
	 * The controller validates complete required residency before publication.
	 * @param {readonly DistantSunSharedCacheAtlasSlot[]} slots - Uploaded atlas slots.
	 * @returns {DistantSunSharedCacheCoordinateTable} - Domain-sized immutable upload description.
	 */
	buildCoordinateTable(slots) {
		const width = SOLAR_ZENITH_180_DOMAIN_OWNER.count;
		const height = NATIVE_48_POSITION_DOMAIN_OWNER.count;
		const values = new Uint16Array(width * height * 2).fill(DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS);
		for (const slot of slots) {
			for (const [row, coordinate] of slot.block.coordinates.entries()) {
				values.set([slot.index, row], (coordinate[0] * width + coordinate[1]) * 2);
			}
		}
		return {format: 'RG16UI', width, height, values};
	}
}
