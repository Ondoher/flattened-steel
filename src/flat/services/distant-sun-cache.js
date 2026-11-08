import {Service} from '@polylith/core';
import DistantSunSharedCachePackage from '../../algorithm32/implementation/distant-sun/cache/DistantSunSharedCachePackage.js';
import DistantSunSharedCacheWorkerClient from '../../algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheWorkerClient.js';
import {DistantSunSharedCacheOwnership} from '../../algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheOwnership.js';

/**
 * App-owned metadata and transport lifetime shared by spherical view subscribers.
 *
 * @implements {DistantSunCacheService}
 */
export class DistantSunCache extends Service {
	/**
	 * Creates the application cache capability.
	 *
	 * @param {unknown} registry - Owning app registry.
	 */
	constructor(registry) {
		super('distant-sun-cache', registry);
		this.implement(['start', 'ready', 'stop', 'prepare', 'getDiagnostics']);
		this.pending = null;
		this.identity = null;
		this.borrow = null;
		this.abort = null;
	}

	/**
	 * Call this method to reset an earlier application lifetime.
	 */
	start() {
		this.stop();
		this.abort = new AbortController();
	}

	/**
	 * Call this method after startup to resolve app-relative HTTP access.
	 */
	ready() {
		this.io = /** @type {IoService} */ (this.registry.subscribe('io'));
	}

	/**
	 * Called by preparation to authenticate metadata once per application lifetime.
	 *
	 * @param {DistantSunCacheResolution} resolution - Accepted HTTP selection.
	 * @returns {Promise<SphericalCachePackageFacts>} - Owned metadata graph and package.
	 */
	_load(resolution) {
		let identity = resolution.asset.report.sha256;
		if (!this.pending || this.identity !== identity) {
			this.identity = identity;
			let pending = DistantSunSharedCachePackage.load({
				rootUrl: new URL(resolution.asset.rootUrl, document.baseURI).href,
				report: resolution.asset.report,
				signal: this.abort.signal,
				fetch: (url, options) => this._fetch(url, options),
			})
				.then((source) => ({source, graph: source.getGraph()}))
				.catch((error) => {
					if (this.pending === pending) {
						this.pending = null;
					}
					throw error;
				});
			this.pending = pending;
		}
		return this.pending;
	}

	/**
	 * Called by engine I/O to use the existing application transport boundary.
	 *
	 * @param {RequestInfo|URL} url - Same-origin artifact.
	 * @param {RequestInit} [options] - Engine cancellation and transfer options.
	 * @returns {Promise<Response>} - HTTP response or transport rejection.
	 */
	async _fetch(url, options) {
		let response = await this.io.request(String(url), options);
		if (!response) {
			throw new Error('Spherical cache transport failed.');
		}
		return response;
	}

	/**
	 * Call this method to resolve cache metadata and decode one required block for the M1 connection proof.
	 * This is cache readiness, not a complete rendered scene. A rejected/cancelled request publishes no result.
	 *
	 * @param {number} solarZenithDegrees - Geometry-derived solar angle.
	 * @param {AbortSignal} signal - Independent view lifetime.
	 * @returns {Promise<SphericalCachePreparation>} - Actual selected-block and package facts.
	 */
	async prepare(solarZenithDegrees, signal) {
		let lifetime = this.abort;
		lifetime.signal.throwIfAborted();
		signal = AbortSignal.any([signal, lifetime.signal]);
		signal.throwIfAborted();
		let response = await this._fetch(`api/distant-sun-scene-cache?solarZenithDegrees=${solarZenithDegrees}`, {
			signal,
		});
		if (!response.ok) {
			throw new Error('Spherical cache is unavailable.');
		}
		signal.throwIfAborted();
		let resolution = /** @type {DistantSunCacheResolution} */ (await response.json());
		if (
			resolution.schemaId !== 'flat32-distant-sun-cache-resolution-v2' ||
			resolution.cacheFormat !== 'algorithm32-distant-sun-shared-block-v1' ||
			!['ready', 'dark'].includes(resolution.status) ||
			!resolution.asset
		) {
			throw new TypeError('Spherical cache response is incompatible.');
		}
		let {source, graph} = await this._load(resolution);
		signal.throwIfAborted();
		lifetime.signal.throwIfAborted();
		if (!this.borrow) {
			this.borrow = DistantSunSharedCacheOwnership.acquire(() => ({
				preparer: new DistantSunSharedCacheWorkerClient({
					workerUrl: new URL('shared-cache-worker.js', document.baseURI).href,
				}),
				fetch: (url, options) => this._fetch(url, options),
			}));
		}
		if (resolution.status === 'dark') {
			return {
				dark: true,
				packageIdentity: resolution.asset.packageSetIdentity,
				blockId: null,
				packetBytes: 0,
				requiredBlocks: 0,
			};
		}
		let scene = graph.scenes.find(
			(candidate) => candidate.representativeSolarZenithDegrees === resolution.representativeSolarZenithDegrees,
		);
		if (!scene) {
			throw new RangeError('Spherical scene is absent from the authenticated package.');
		}
		let block = graph.blockIndex.blocks.find((candidate) => candidate.id === scene.requiredBlockIds[0]);
		let lease = await this.borrow.transport.request({
			url: source.getBlockUrl(block.id),
			block,
			logicalToUniqueIndex: graph.logicalToUniqueIndex,
			logicalToUniqueIndexSha256: graph.configuration.directionLayout.logicalToUniqueIndex.sha256,
			pin: {kind: 'candidate', owner: 'spherical-earth-m1'},
			signal,
		});
		try {
			signal.throwIfAborted();
			lifetime.signal.throwIfAborted();
			return {
				dark: false,
				packageIdentity: resolution.asset.packageSetIdentity,
				blockId: block.id,
				packetBytes: lease.packet.values.byteLength,
				requiredBlocks: scene.requiredBlockIds.length,
			};
		} finally {
			lease.release();
		}
	}

	/**
	 * Call this method to inspect bounded transport counters without exposing mutable resources.
	 *
	 * @returns {DistantSunSharedCacheTransportDiagnostics|null} - Current shared transport telemetry.
	 */
	getDiagnostics() {
		return this.borrow?.transport.diagnostics() ?? null;
	}

	/**
	 * Call this method after view retirement to abort metadata and release this app's transport borrow.
	 */
	stop() {
		this.abort?.abort();
		this.borrow?.release();
		this.borrow = null;
		this.pending = null;
	}
}

new DistantSunCache();
