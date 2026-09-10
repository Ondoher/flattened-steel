import {
	DISTANT_SUN_SHARED_CACHE_PACKET_BLOCK_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
	DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT,
	DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH,
} from './consts.js';

/**
 * Bounded GPU residency, deterministic LRU eviction, and host-pin owner for one atlas.
 *
 * @implements {DistantSunSharedCacheAtlasOwner}
 */
export default class DistantSunSharedCacheAtlas {
	/**
	 * Renderer capability.
	 *
	 * @type {CachePacketAtlasBackend}
	 */
	_backend;
	/**
	 * Opaque persistent allocation.
	 *
	 * @type {CachePersistentArray}
	 */
	array;
	/**
	 * Successfully uploaded slot records.
	 *
	 * @type {Map<number, DistantSunSharedCacheAtlasSlot>}
	 */
	_slots = new Map();
	/**
	 * Complete block set protected by the visible scene.
	 *
	 * @type {Set<string>}
	 */
	_published = new Set();
	/**
	 * Published predictive window whose pins survive request supersession.
	 *
	 * @type {Set<string>}
	 */
	_window = new Set();
	/**
	 * Monotonic residency use counter.
	 */
	_clock = 0;
	/**
	 * Backend generation associated with the records.
	 *
	 * @type {number}
	 */
	_generation;
	/**
	 * Terminal disposal state.
	 */
	_disposed = false;

	/**
	 * Creates a bounded persistent atlas under an admitted memory policy.
	 *
	 * @param {CachePacketAtlasBackend} backend - Renderer capability.
	 * @param {number} layers - Admitted layer count.
	 * @param {string} id - Allocation identity.
	 */
	constructor(backend, layers, id) {
		this._backend = backend;
		this.array = backend.allocatePersistentArray({
			id,
			valueKey: 'cache.sharedPacketAtlas',
			storage: {
				format: 'RGBA32F',
				width: DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH,
				height: DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT,
				layers,
			},
			maximumBytes: layers * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
		});
		this._generation = backend.getPersistentArrayState(this.array).generation;
	}

	/**
	 * Call this method to reject lost/restored or disposed storage before publication.
	 *
	 * @returns {boolean} - Whether the uploaded records still describe live GPU contents.
	 */
	isCurrent() {
		if (this._disposed) return false;
		const state = this._backend.getPersistentArrayState(this.array);
		return !state.unavailable && state.generation === this._generation;
	}

	/**
	 * Call this method to reset invalidated GPU records while releasing their obsolete pins.
	 *
	 * @returns {void}
	 */
	resetAfterRestoration() {
		const state = this._backend.getPersistentArrayState(this.array);
		if (state.unavailable) throw new Error('Shared-cache atlas context is unavailable.');
		for (const slot of this._slots.values()) slot.lease?.release();
		this._slots.clear();
		this._published.clear();
		this._window.clear();
		this._generation = state.generation;
		this._backend.protectPersistentArrayLayers(this.array, []);
	}

	/**
	 * Call this method to inspect whether a candidate fits without overwriting visible blocks.
	 *
	 * @param {readonly string[]} ids - Required candidate and prediction identities.
	 * @returns {boolean} - Whether both sets fit this allocation.
	 */
	canFit(ids) {
		return new Set([...this._published, ...ids]).size <= this.array.storage.layers;
	}

	/**
	 * Call this method to obtain uploaded records whose GPU generation is still current.
	 *
	 * @returns {DistantSunSharedCacheAtlasSlot[]} - Borrowed internal records for metadata construction.
	 */
	getSlots() {
		if (!this.isCurrent()) throw new Error('Shared-cache atlas generation is unavailable.');
		return [...this._slots.values()];
	}

	/**
	 * Call this method to upload one authenticated block, evicting only an unprotected LRU slot.
	 * Lease ownership transfers only on success; callers release a rejected lease.
	 *
	 * @param {DistantSunSharedCacheBlockDescriptor} block - Authenticated descriptor.
	 * @param {DistantSunSharedCachePacketLease} lease - Authenticated packet pin.
	 * @param {ReadonlySet<string>} reserved - Complete candidate and prediction block set.
	 * @returns {boolean} - Whether a GPU upload was necessary.
	 */
	install(block, lease, reserved) {
		if (!this.isCurrent()) throw new Error('Shared-cache atlas generation is unavailable.');
		const packet = lease.packet;
		// The preparation Worker owns the full value/padding proof. Recheck only the
		// authenticated transport capability's identity and fixed upload shape here.
		if (
			packet.logicalBlockId !== block.id ||
			packet.decodedSha256 !== block.decoded.sha256 ||
			packet.blockRowCount !== block.rowCount ||
			packet.schemaId !== DISTANT_SUN_SHARED_CACHE_PACKET_BLOCK_SCHEMA_ID ||
			packet.storage.format !== 'RGBA32F' ||
			packet.storage.width !== DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH ||
			packet.storage.height !== DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT ||
			packet.storage.layers !== 1 ||
			packet.storage.flipY ||
			!packet.storage.xFastest ||
			!(packet.values instanceof Float32Array) ||
			packet.values.byteLength !== DISTANT_SUN_SHARED_CACHE_PACKET_BYTES
		)
			throw new Error('Shared-cache uploaded packet identity or shape is incompatible.');
		const existing = [...this._slots.values()].find((slot) => slot.block.id === block.id);
		if (existing) {
			if (existing.lease) lease.release();
			else existing.lease = lease;
			existing.lastUse = ++this._clock;
			return false;
		}
		let index = Array.from({length: this.array.storage.layers}, (_, value) => value).find(
			(value) => !this._slots.has(value),
		);
		if (index === undefined) {
			const victim = [...this._slots.values()]
				.filter((slot) => !this._published.has(slot.block.id) && !reserved.has(slot.block.id))
				.sort((left, right) => left.lastUse - right.lastUse || left.index - right.index)[0];
			if (!victim) throw new RangeError('Shared-cache atlas has no unprotected slot.');
			index = victim.index;
			victim.lease?.release();
			this._slots.delete(index);
		}
		this._backend.uploadPersistentArrayLayer({
			array: this.array,
			layer: index,
			identity: block.decoded.sha256,
			values: packet.values,
		});
		this._slots.set(index, {index, block, lease, lastUse: ++this._clock});
		return true;
	}

	/**
	 * Call this method to protect a complete visible scene and retain only its active predictive window.
	 *
	 * @param {readonly string[]} published - Blocks used by the published scene.
	 * @param {readonly string[]} predicted - Additional prepared look-ahead blocks.
	 * @param {string} owner - Current publication owner.
	 * @returns {void}
	 */
	protect(published, predicted, owner) {
		const slots = this.getSlots();
		const required = new Set(published);
		if (published.some((id) => !slots.some((slot) => slot.block.id === id && slot.lease)))
			throw new Error('Shared-cache publication has an unpinned or missing block.');
		this._backend.protectPersistentArrayLayers(
			this.array,
			slots.filter((slot) => required.has(slot.block.id)).map((slot) => slot.index),
		);
		this._published = required;
		this._window = new Set([...published, ...predicted]);
		for (const slot of slots) {
			if (required.has(slot.block.id)) slot.lease?.repin({kind: 'published', owner});
			else if (predicted.includes(slot.block.id)) slot.lease?.repin({kind: 'predicted', owner});
			else {
				slot.lease?.release();
				slot.lease = undefined;
			}
		}
	}

	/**
	 * Call this method to release candidate pins while preserving the current publication.
	 *
	 * @returns {void}
	 */
	discardCandidate() {
		for (const slot of this._slots.values())
			if (!this._window.has(slot.block.id)) {
				slot.lease?.release();
				slot.lease = undefined;
			}
	}

	/**
	 * Call this method to release every owned host pin and GPU resource once.
	 *
	 * @returns {void}
	 */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		for (const slot of this._slots.values()) slot.lease?.release();
		this._slots.clear();
		this.array.dispose();
	}
}
