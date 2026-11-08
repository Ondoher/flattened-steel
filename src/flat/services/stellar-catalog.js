import {Service} from '@polylith/core';
import {createBrightest2000StellarCatalogDefinition} from '../../algorithm32/implementation/star-field/Brightest2000StellarCatalogPackage.js';
import {StellarPointSetSource} from '../../algorithm32/implementation/star-field/StellarPointSetSource.js';
import {ViewPresentationFilterRegistry} from '../../algorithm32/implementation/presentation-filter/ViewPresentationFilterRegistry.js';

/**
 * Owns the authenticated stellar catalog and Algorithm32 human presentation shared by application scenes.
 * Renderer resources remain independently owned by each view.
 *
 * @implements {StellarCatalogService}
 */
export class StellarCatalog extends Service {
	/**
	 * Registers the application-owned catalog capability.
	 *
	 * @param {unknown} registry - Owning application registry.
	 */
	constructor(registry) {
		super('stellar-catalog', registry);
		this.implement(['start', 'ready', 'stop', 'load']);
	}

	/**
	 * Call this method to reset owned source data before a new application lifetime.
	 */
	start() {
		this.stop();
		/** @type {StellarResources|null} */
		this.resources = null;
		/** @type {Promise<StellarResources>|null} */
		this.pending = null;
		/** @type {AbortController|null} */
		this.abort = null;
	}

	/**
	 * Call this method after readiness to resolve deployment-aware transport.
	 */
	ready() {
		this.io = /** @type {IoService} */ (this.registry.subscribe('io'));
	}

	/**
	 * Call this method to share a complete load or retry a failed one without cancelling another view's work.
	 *
	 * @param {AbortSignal} [signal] - Calling session's lifetime, independent of the shared request.
	 * @returns {Promise<StellarResources>} - Authenticated source and existing human presentation filters.
	 */
	async load(signal) {
		signal?.throwIfAborted();
		if (this.resources) {
			return this.resources;
		}
		if (!this.pending) {
			let abort = new AbortController();
			this.abort = abort;
			this.pending = this._load(abort.signal)
				.then((resources) => {
					abort.signal.throwIfAborted();
					this.resources = resources;
					return resources;
				})
				.finally(() => {
					if (this.abort === abort) {
						this.pending = null;
						this.abort = null;
					}
				});
		}
		let pending = this.pending;
		if (!signal) {
			return pending;
		}
		let cancel;
		let cancelled = new Promise((_, reject) => {
			cancel = () => reject(signal.reason);
			signal.addEventListener('abort', cancel, {once: true});
		});
		try {
			return await Promise.race([pending, cancelled]);
		} finally {
			signal.removeEventListener('abort', cancel);
		}
	}

	/**
	 * Called by loading to decode only complete authenticated package bytes at the network boundary.
	 *
	 * @param {AbortSignal} signal - Shared request lifetime.
	 * @returns {Promise<StellarResources>} - Catalog and human presentation, ready together.
	 */
	async _load(signal) {
		let [source, scotopicLuminanceWeights] = await Promise.all([
			this._loadStars(signal),
			this._loadHumanVision(signal),
		]);
		signal.throwIfAborted();
		let presentationFilters = new ViewPresentationFilterRegistry(
			[
				{
					id: 'human-mesopic-luminance-v1',
					stage: 'source-linear',
					target: 'stellar',
					enabled: true,
					parameters: {maximumRodContribution: 0.5},
				},
				{
					id: 'human-low-light-chroma-v1',
					stage: 'source-linear',
					target: 'stellar',
					enabled: true,
					parameters: {maximumChromaRetention: 0.65},
				},
			],
			{scotopicLuminanceWeights},
		);
		return Object.freeze({source, presentationFilters});
	}

	/**
	 * Called by shared preparation to decode the exact production brightest-2,000 catalog.
	 *
	 * @param {AbortSignal} signal - Shared request lifetime.
	 * @returns {Promise<StellarPointSetSource>} - Engine-owned immutable source.
	 */
	async _loadStars(signal) {
		let base = 'stellar-catalogs/brightest-2000-stellar-package-v1/';
		let response = await this.io.request(base + 'manifest.json', {signal});
		if (!response?.ok) {
			throw new Error('The brightest-2,000 star catalog is unavailable.');
		}
		let manifest = await response.json();
		let [roster, packets, members, spectra] = await Promise.all(
			['roster', 'packets', 'members', 'spectra'].map((key) =>
				this._artifact(base, manifest.artifacts?.[key], signal),
			),
		);
		signal.throwIfAborted();
		let decoder = new TextDecoder();
		let catalogDefinition = createBrightest2000StellarCatalogDefinition({
			manifest,
			roster: JSON.parse(decoder.decode(roster)),
			packets: JSON.parse(decoder.decode(packets)),
			memberTexels: new Float32Array(members),
			spectraTexels: new Float32Array(spectra),
		});
		return new StellarPointSetSource({catalogDefinition});
	}

	/**
	 * Called by shared preparation to authenticate the same CIE-derived weights used by Flat32.
	 *
	 * @param {AbortSignal} signal - Shared request lifetime.
	 * @returns {Promise<readonly number[]>} - Fifteen authenticated Native15 scotopic integration weights.
	 */
	async _loadHumanVision(signal) {
		let base = 'presentation-filters/human-vision-filter-package-v1/';
		let response = await this.io.request(base + 'manifest.json', {signal});
		if (!response?.ok) {
			throw new Error('The human vision presentation package is unavailable.');
		}
		let manifest = await response.json();
		if (
			manifest.schemaId !== 'algorithm32-production-human-vision-filter-package-v1' ||
			manifest.packageId !== 'human-vision-filter-package-v1' ||
			manifest.parents?.sourceSha256 !== '6a75d3fdbcbf5e9e9a07478511933eefeda953f3e2cc14b74459e5a099ec3759' ||
			manifest.artifact?.sha256 !== '85e1d15c93e849550dbe84fdf1df000565eda0f57ac6e10210b5ee200bc91a09'
		) {
			throw new Error('The human vision manifest identity is incompatible.');
		}
		let bytes = await this._artifact(base, manifest.artifact, signal);
		let values = JSON.parse(new TextDecoder().decode(bytes)).values;
		if (
			!Array.isArray(values) ||
			values.length !== 15 ||
			!values.every((value) => Number.isFinite(value) && value >= 0)
		) {
			throw new Error('Human vision presentation requires fifteen finite nonnegative weights.');
		}
		return Object.freeze([...values]);
	}

	/**
	 * Called by package decoding to confine manifest paths and authenticate an exact payload.
	 *
	 * @param {string} base - Application-relative package route.
	 * @param {StellarArtifact} artifact - Untrusted manifest descriptor.
	 * @param {AbortSignal} signal - Shared request lifetime.
	 * @returns {Promise<ArrayBuffer>} - Verified payload.
	 */
	async _artifact(base, artifact, signal) {
		if (!artifact || typeof artifact.path !== 'string' || !/^[\w-]+\.(json|bin)$/.test(artifact.path)) {
			throw new Error('The star catalog contains an invalid artifact path.');
		}
		let response = await this.io.request(base + artifact.path, {
			signal,
			headers: {Accept: 'application/octet-stream'},
		});
		if (!response?.ok) {
			throw new Error(`Star catalog artifact ${artifact.path} is unavailable.`);
		}
		let bytes = await response.arrayBuffer();
		let digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
		let sha256 = Array.from(digest, (value) => value.toString(16).padStart(2, '0')).join('');
		if (bytes.byteLength !== artifact.byteLength || sha256 !== artifact.sha256) {
			throw new Error(`Star catalog artifact ${artifact.path} failed authentication.`);
		}
		return bytes;
	}

	/**
	 * Call this method to cancel shared transport and discard the application's source lifetime.
	 */
	stop() {
		this.abort?.abort();
		this.abort = null;
		this.pending = null;
		this.resources = null;
	}
}
new StellarCatalog();
