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
		this.implement(['start', 'ready', 'stop', 'prepare', 'select', 'getDiagnostics']);
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
	 * Called by scene selection to resolve metadata and borrow transport without decoding unrelated blocks.
	 *
	 * @param {number} solarZenithDegrees - Physical solar angle.
	 * @param {AbortSignal} signal - Independent subscriber lifetime.
	 * @returns {Promise<SphericalCacheSelectionFacts>} - Authenticated private graph and public engine selection.
	 */
	async _selection(solarZenithDegrees, signal) {
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

		return {
			graph,
			signal,
			identity: resolution.asset.packageSetIdentity,
			selection: {
				package: source,
				transport: this.borrow.transport,
				sceneOrdinal: resolution.status === 'dark' ? null : resolution.representativeSolarZenithDegrees,
				solarInterpolation: resolution.asset.solarInterpolation,
				scatteringAccuracy: resolution.asset.scatteringAccuracy,
			},
		};
	}

	/**
	 * Call this method to prepare the shared engine's metadata/transport capability for a complete scene.
	 *
	 * @param {number} solarZenithDegrees - Physical solar angle.
	 * @param {AbortSignal} signal - Independent view cancellation.
	 * @returns {Promise<DistantSunSharedCacheSelection>} - Renderer-independent package selection.
	 */
	async select(solarZenithDegrees, signal) {
		return (await this._selection(solarZenithDegrees, signal)).selection;
	}

	/**
	 * Call this diagnostic method to reproduce M1's one-block connection proof.
	 *
	 * @param {number} solarZenithDegrees - Physical solar angle.
	 * @param {AbortSignal} signal - Independent subscriber lifetime.
	 * @returns {Promise<SphericalCachePreparation>} - Selected proof block facts, separate from rendering.
	 */
	async prepare(solarZenithDegrees, signal) {
		let facts = await this._selection(solarZenithDegrees, signal);
		signal = facts.signal;
		let {selection, graph, identity} = facts;
		if (selection.sceneOrdinal === null) {
			return {dark: true, packageIdentity: identity, blockId: null, packetBytes: 0, requiredBlocks: 0};
		}
		const scene = graph.scenes.find(
			(candidate) => candidate.representativeSolarZenithDegrees === selection.sceneOrdinal,
		);
		if (!scene) {
			throw new RangeError('Spherical scene is absent from the authenticated package.');
		}
		const block = graph.blockIndex.blocks.find((candidate) => candidate.id === scene.requiredBlockIds[0]);
		const lease = await selection.transport.request({
			url: selection.package.getBlockUrl(block.id),
			block,
			logicalToUniqueIndex: graph.logicalToUniqueIndex,
			logicalToUniqueIndexSha256: graph.configuration.directionLayout.logicalToUniqueIndex.sha256,
			pin: {kind: 'candidate', owner: 'spherical-connection-proof'},
			signal,
		});
		try {
			signal.throwIfAborted();
			return {
				dark: false,
				packageIdentity: identity,
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
