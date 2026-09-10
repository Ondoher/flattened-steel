import {DISTANT_SUN_SHARED_CACHE_LRU_BYTES, DISTANT_SUN_SHARED_CACHE_PACKET_BYTES} from './consts.js';

/** Byte-weighted packet retention with reserved admission and explicit owner pins. */
export default class DistantSunSharedCacheRetention {
	/** Packet entries indexed by authenticated encoded artifact.
	 *
	 * @type {Map<string, DistantSunSharedCacheRetentionEntry>}
	 */
	_entries = new Map();
	/** Monotonic access sequence. */
	_sequence = 0;
	/** Total pinned packet admission ceiling.
	 *
	 * @type {number}
	 */
	_maximumPinnedBytes;
	/** Total evicted packet count. */
	_evictions = 0;

	/**
	 * Creates one bounded packet-retention owner
	 *
	 * @param {number} maximumPinnedBytes - Declared packet admission ceiling.
	 */
	constructor(maximumPinnedBytes) {
		if (
			!Number.isSafeInteger(maximumPinnedBytes) ||
			maximumPinnedBytes < DISTANT_SUN_SHARED_CACHE_PACKET_BYTES ||
			maximumPinnedBytes > 2 ** 31
		)
			throw new RangeError('Shared-cache pin budget is invalid.');
		this._maximumPinnedBytes = maximumPinnedBytes;
	}

	/**
	 * Called before pin admission to enforce global and route-specific budgets, including pending work
	 *
	 * @param {string} key - Encoded artifact identity
	 *
	 * @param {DistantSunSharedCachePin} pin - Explicit lifetime owner.
	 * @returns {void}
	 */
	_requireAdmission(key, pin) {
		if (
			!pin ||
			!['published', 'candidate', 'predicted', 'prepared-route'].includes(pin.kind) ||
			typeof pin.owner !== 'string' ||
			!pin.owner
		)
			throw new TypeError('Shared-cache pin owner is invalid.');
		let pinnedCount = 0;
		let routeCount = 0;
		for (const [entryKey, entry] of this._entries) {
			if (
				pin.kind === 'prepared-route' &&
				Array.from(entry.pins.values()).some(
					(item) =>
						item.kind === 'prepared-route' &&
						item.owner === pin.owner &&
						item.maximumBytes !== pin.maximumBytes,
				)
			)
				throw new RangeError('Shared-cache prepared-route owner has conflicting budgets.');
			if (entry.pins.size && entryKey !== key) pinnedCount += 1;
			if (
				entryKey !== key &&
				Array.from(entry.pins.values()).some(
					(item) => item.kind === 'prepared-route' && item.owner === pin.owner,
				)
			)
				routeCount += 1;
		}
		if ((pinnedCount + 1) * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES > this._maximumPinnedBytes)
			throw new RangeError('Shared-cache pinned packet budget is exhausted.');
		if (
			pin.kind === 'prepared-route' &&
			(!Number.isSafeInteger(pin.maximumBytes) ||
				pin.maximumBytes < DISTANT_SUN_SHARED_CACHE_PACKET_BYTES ||
				(routeCount + 1) * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES > pin.maximumBytes)
		)
			throw new RangeError('Shared-cache prepared-route budget is exhausted.');
	}

	/** Called after release to evict only unpinned packets above the ordinary byte budget. @returns {void} */
	_evict() {
		const unpinned = Array.from(this._entries)
			.filter(([, entry]) => !entry.pins.size)
			.sort((left, right) => left[1].lastUse - right[1].lastUse);
		let bytes = unpinned.filter(([, entry]) => entry.packet).length * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES;
		for (const [key, entry] of unpinned) {
			if (entry.packet && bytes <= DISTANT_SUN_SHARED_CACHE_LRU_BYTES) continue;
			this._entries.delete(key);
			if (entry.packet) {
				bytes -= DISTANT_SUN_SHARED_CACHE_PACKET_BYTES;
				this._evictions += 1;
			}
		}
	}

	/**
	 * Call this method to reserve one independently releasable packet pin before preparation.
	 * Invalid or over-budget owners throw without changing retention
	 *
	 * @param {string} key - Encoded artifact identity
	 *
	 * @param {DistantSunSharedCachePin} pin - Explicit lifetime owner
	 *
	 * @param {string} signature - Decoded and direction-layout compatibility identity.
	 * @returns {symbol} - Opaque pin token.
	 */
	reserve(key, pin, signature = '') {
		this._requireAdmission(key, pin);
		const entry = this._entries.get(key) ?? {pins: new Map(), lastUse: 0, signature};
		if (entry.signature !== signature)
			throw new RangeError('Shared-cache coalesced artifact has conflicting decoded identities.');
		const token = Symbol();
		entry.pins.set(token, {...pin});
		entry.lastUse = ++this._sequence;
		this._entries.set(key, entry);
		return token;
	}

	/**
	 * Call this method to change a live pin's category without dropping its packet reservation
	 *
	 * @param {string} key - Encoded artifact identity
	 *
	 * @param {symbol} token - Live pin token
	 *
	 * @param {DistantSunSharedCachePin} pin - New lifetime owner.
	 * @returns {void}
	 */
	repin(key, token, pin) {
		const entry = this._entries.get(key);
		if (!entry?.pins.has(token)) throw new Error('Shared-cache pin has been released.');
		this._requireAdmission(key, pin);
		entry.pins.set(token, {...pin});
	}

	/**
	 * Call this method to retain a completed authenticated packet for its reserved owners
	 *
	 * @param {string} key - Encoded artifact identity
	 *
	 * @param {DistantSunSharedCachePacketBlock} packet - Complete packet.
	 * @returns {void}
	 */
	publish(key, packet) {
		const entry = this._entries.get(key);
		if (!entry?.pins.size || packet.values.byteLength !== DISTANT_SUN_SHARED_CACHE_PACKET_BYTES)
			throw new Error('Shared-cache packet has no live reservation or has an invalid shape.');
		entry.packet = packet;
		entry.lastUse = ++this._sequence;
	}

	/**
	 * Call this method to borrow a retained packet while holding a pin
	 *
	 * @param {string} key - Encoded artifact identity.
	 * @returns {DistantSunSharedCachePacketBlock | undefined} - Retained complete packet.
	 */
	get(key) {
		const entry = this._entries.get(key);
		if (entry) entry.lastUse = ++this._sequence;
		return entry?.packet;
	}

	/**
	 * Call this method to release one pin; repeated release is harmless
	 *
	 * @param {string} key - Encoded artifact identity
	 *
	 * @param {symbol} token - Pin token.
	 * @returns {void}
	 */
	release(key, token) {
		this._entries.get(key)?.pins.delete(token);
		this._evict();
	}

	/** Call this method to inspect bounded aggregate retention facts. @returns {DistantSunSharedCacheRetentionDiagnostics} - Current resource totals. */
	diagnostics() {
		let pinnedBytes = 0,
			unpinnedBytes = 0,
			pendingBytes = 0;
		const pins = {published: 0, candidate: 0, predicted: 0, 'prepared-route': 0};
		for (const entry of this._entries.values()) {
			if (entry.pins.size) pinnedBytes += DISTANT_SUN_SHARED_CACHE_PACKET_BYTES;
			else if (entry.packet) unpinnedBytes += DISTANT_SUN_SHARED_CACHE_PACKET_BYTES;
			if (!entry.packet) pendingBytes += DISTANT_SUN_SHARED_CACHE_PACKET_BYTES;
			for (const pin of entry.pins.values()) pins[pin.kind] += 1;
		}
		return {
			pinnedBytes,
			unpinnedBytes,
			pendingBytes,
			pins,
			evictions: this._evictions,
			maximumPinnedBytes: this._maximumPinnedBytes,
		};
	}

	/** Call this method to drop all retained buffers and invalidate all pins. @returns {void} */
	dispose() {
		this._entries.clear();
	}
}
