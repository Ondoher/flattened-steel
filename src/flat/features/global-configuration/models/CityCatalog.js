import {Service} from '@polylith/core';
import administrativeAreas from '../assets/data/admin1-names.json';

/**
 * Call this function to prepare accent-insensitive search text once per catalog record.
 *
 * @param {string} value - Catalog or query text.
 * @returns {string} - Folded text for matching.
 */
function normalizeSearch(value) {
	return value
		.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim()
		.toLowerCase();
}

/**
 * Owns local city-data loading, decoding, caching, and ranked search.
 *
 * @implements {CityCatalogService}
 */
export class CityCatalog extends Service {
	/**
	 * Registers the application-local city-data capability.
	 *
	 * @param {unknown} registry - Optional isolated application registry.
	 */
	constructor(registry) {
		super('city-catalog', registry);
		this.implement(['start', 'ready', 'stop', 'getStatus', 'load', 'search', 'getLocation']);
	}

	/**
	 * Call this method to reset owned data and cancel an earlier request before startup.
	 */
	start() {
		this.stop();
		/** @type {CityCatalogStatus} */
		this.status = 'idle';
		/** @type {Map<string, SearchableCity>} */
		this.records = new Map();
		/** @type {Promise<void>|null} */
		this.pending = null;
		/** @type {AbortController|null} */
		this.abort = null;
	}

	/**
	 * Call this method after dependency readiness to resolve deployment-aware HTTP transport.
	 */
	ready() {
		this.io = /** @type {IoService} */ (this.registry.subscribe('io'));
	}

	/**
	 * Call this method to read the catalog's current loading state.
	 *
	 * @returns {CityCatalogStatus} - Idle, loading, ready, or error.
	 */
	getStatus() {
		return this.status;
	}

	/**
	 * Call this method to load once, share an in-flight request, or retry a failed load.
	 *
	 * @returns {Promise<void>} - Completion of the current catalog load.
	 */
	load() {
		if (this.pending) {
			return this.pending;
		}
		if (this.status === 'ready') {
			return Promise.resolve();
		}
		let abort = new AbortController();
		this.abort = abort;
		this.status = 'loading';
		this.pending = this._load(abort.signal).finally(() => {
			if (this.abort === abort) {
				this.abort = null;
				this.pending = null;
			}
		});
		return this.pending;
	}

	/**
	 * Called by loading to accept only a complete valid city dataset at the JSON boundary.
	 *
	 * @param {unknown} source - Untrusted decoded city JSON.
	 * @returns {Map<string, SearchableCity>} - Validated records with stable identities and prepared search fields.
	 * @throws {TypeError} - The external dataset has an incompatible shape or invalid coordinates.
	 */
	_decode(source) {
		if (!Array.isArray(source) || !source.length) {
			throw new TypeError('The city dataset must be a nonempty array.');
		}
		let records = new Map();
		for (let raw of source) {
			if (
				!raw ||
				typeof raw !== 'object' ||
				typeof raw.n !== 'string' ||
				!raw.n.trim() ||
				typeof raw.c !== 'string' ||
				!raw.c.trim() ||
				typeof raw.a !== 'string' ||
				typeof raw.lat !== 'number' ||
				!Number.isFinite(raw.lat) ||
				Math.abs(raw.lat) > 90 ||
				typeof raw.lon !== 'number' ||
				!Number.isFinite(raw.lon) ||
				Math.abs(raw.lon) > 180
			) {
				throw new TypeError('Invalid city dataset record.');
			}
			let name = raw.n.trim();
			let country = raw.c.trim().toUpperCase();
			let admin1 = raw.a.trim();
			let admin1Name = administrativeAreas[`${country}.${admin1}`];
			let id = JSON.stringify([name, country, admin1, raw.lat, raw.lon]);
			let city = {id, name, country, admin1, admin1Name};
			records.set(id, {
				location: {latitude: raw.lat, longitude: raw.lon, city},
				name: normalizeSearch(name),
				codes: [
					normalizeSearch(country),
					normalizeSearch(admin1),
					...normalizeSearch(admin1Name ?? '').split(' '),
				],
				search: normalizeSearch([name, admin1, admin1Name, country].filter(Boolean).join(' ')),
			});
		}
		return records;
	}

	/**
	 * Called by load to resolve and decode one request without publishing cancelled results.
	 *
	 * @param {AbortSignal} signal - Exact request lifetime.
	 * @returns {Promise<void>} - Completion with ready, error, or cancelled state.
	 */
	async _load(signal) {
		try {
			let response = await this.io.request('features/global-configuration/assets/data/cities.json', {signal});
			if (signal.aborted) {
				return;
			}
			if (!response?.ok) {
				throw new Error('City data is unavailable.');
			}
			let source = await response.json();
			if (signal.aborted) {
				return;
			}
			this.records = this._decode(source);
			this.status = 'ready';
		} catch (error) {
			if (!signal.aborted) {
				this.status = 'error';
			}
		}
	}

	/**
	 * Call this method to cancel an owned request while preserving an already loaded catalog.
	 */
	stop() {
		this.abort?.abort();
		this.abort = null;
		this.pending = null;
		if (this.status === 'loading') {
			this.status = 'idle';
		}
	}

	/**
	 * Call this method to search the whole index before choosing the highest-ranked results.
	 *
	 * @param {string} query - City name and optional country code, region code, or region-name terms.
	 * @returns {ConfiguredCity[]} - Ranked suggestions retaining every exact city-name match.
	 */
	search(query) {
		let normalized = normalizeSearch(query);
		if (!normalized || this.status !== 'ready') {
			return [];
		}
		let terms = normalized.split(/\s+/);
		/** @type {ConfiguredCity[][]} */
		let groups = [[], [], []];
		for (let record of this.records.values()) {
			if (!terms.every((term) => record.search.includes(term))) {
				continue;
			}
			let cityWords = record.name.split(' ');
			let cityQuery = terms.filter((term) => !record.codes.includes(term) || cityWords.includes(term)).join(' ');
			let rank =
				cityQuery && record.name === cityQuery ? 0 : cityQuery && record.name.startsWith(cityQuery) ? 1 : 2;
			if (rank === 0 || groups[rank].length < 18) {
				groups[rank].push({...record.location.city});
			}
		}
		let limit = Math.max(18, groups[0].length);
		return groups.flat().slice(0, limit);
	}

	/**
	 * Call this method to resolve selected-city coordinates independently of result ordering.
	 *
	 * @param {string} id - Stable city identity from a search result.
	 * @returns {ConfiguredLocation|null} - Defensive location, or null for an unavailable selection.
	 */
	getLocation(id) {
		let record = this.records.get(id);
		return record ? {...record.location, city: {...record.location.city}} : null;
	}
}

new CityCatalog();
