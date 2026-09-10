import DistantSunSharedCacheAtlas from './DistantSunSharedCacheAtlas.js';
import DistantSunSharedCacheMetadata from './DistantSunSharedCacheMetadata.js';
import {
	DISTANT_SUN_SHARED_CACHE_DEFAULT_RESIDENT_LAYER_COUNT,
	DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
} from './consts.js';

/**
 * Predictive preparation and frame-boundary publication owner for one shared-cache runtime.
 */
export default class DistantSunSharedCacheController {
	/**
	 * Borrowed renderer, transport, and authenticated package capabilities.
	 *
	 * @type {DistantSunSharedCacheControllerDefinition}
	 */
	_definition;
	/**
	 * Controller-owned authenticated metadata.
	 *
	 * @type {DistantSunSharedCachePackageGraph}
	 */
	_graph;
	/**
	 * Canonical metadata builder.
	 *
	 * @type {DistantSunSharedCacheMetadata}
	 */
	_metadata;
	/**
	 * Admitted layer count.
	 *
	 * @type {number}
	 */
	_layers;
	/**
	 * Active or initially allocated atlas.
	 *
	 * @type {DistantSunSharedCacheAtlasOwner | undefined}
	 */
	_atlas;
	/**
	 * Current preparation cancellation owner.
	 *
	 * @type {AbortController | undefined}
	 */
	_cancellation;
	/**
	 * Isolated preparation atlas, possibly shared with the publication.
	 *
	 * @type {DistantSunSharedCacheAtlasOwner | undefined}
	 */
	_preparingAtlas;
	/**
	 * Complete unpublished candidate.
	 *
	 * @type {DistantSunSharedCacheFrame | undefined}
	 */
	_candidate;
	/**
	 * Last atomically published frame.
	 *
	 * @type {DistantSunSharedCacheFrame | undefined}
	 */
	_published;
	/**
	 * Monotonic request generation.
	 */
	_generation = 0;
	/**
	 * Last requested ordinal for direction inference.
	 *
	 * @type {number | undefined}
	 */
	_lastRequested;
	/**
	 * Inferred scene progression direction.
	 */
	_direction = 1;
	/**
	 * Declared ordered route.
	 *
	 * @type {number[]}
	 */
	_route = [];
	/**
	 * Terminal owner state.
	 */
	_disposed = false;
	/**
	 * Bounded diagnostics.
	 */
	_counters = {
		requests: 0,
		uploads: 0,
		reused: 0,
		published: 0,
		held: 0,
		canceled: 0,
		failures: 0,
		transitions: 0,
		lastPreparationMilliseconds: 0,
		lastError: '',
		predictedScene: -1,
	};

	/**
	 * Creates a controller under the bounded default or an explicitly qualified route policy.
	 *
	 * @param {DistantSunSharedCacheControllerDefinition} definition - Runtime capabilities and memory admission.
	 */
	constructor(definition) {
		this._definition = {
			...definition,
			routeQualification: structuredClone(definition.routeQualification),
			transitionQualification: structuredClone(definition.transitionQualification),
		};
		this._graph = definition.package.getGraph();
		this._metadata = new DistantSunSharedCacheMetadata(this._graph);
		this._layers = definition.layers ?? DISTANT_SUN_SHARED_CACHE_DEFAULT_RESIDENT_LAYER_COUNT;
		if (!Number.isSafeInteger(this._layers) || this._layers < 1 || this._layers > 89)
			throw new RangeError('Shared-cache layer policy is invalid.');
		const bytes = this._layers * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES;
		if (!Number.isSafeInteger(definition.maximumGpuBytes) || definition.maximumGpuBytes < bytes)
			throw new RangeError('Shared-cache GPU memory policy cannot admit its atlas.');
		if (
			this._layers !== DISTANT_SUN_SHARED_CACHE_DEFAULT_RESIDENT_LAYER_COUNT &&
			(!definition.routeQualification?.evidenceId ||
				!definition.routeQualification.targetId ||
				definition.routeQualification.maximumBytes < bytes ||
				!definition.routeQualification.blockIds.length ||
				definition.routeQualification.blockIds.length > this._layers ||
				new Set(definition.routeQualification.blockIds).size !==
					definition.routeQualification.blockIds.length ||
				definition.routeQualification.blockIds.some(
					(id) => !this._graph.blockIndex.blocks.some((block) => block.id === id),
				))
		)
			throw new RangeError('Shared-cache larger atlas requires exact route and target qualification.');
		if (
			definition.maximumGpuBytes >= bytes * 2 &&
			(!definition.transitionQualification?.evidenceId ||
				!definition.transitionQualification.targetId ||
				definition.transitionQualification.maximumBytes < bytes * 2)
		)
			throw new RangeError('Shared-cache dual-atlas transitions require target memory qualification.');
	}

	/**
	 * Called to release superseded metadata textures without touching their atlas.
	 *
	 * @param {DistantSunSharedCacheFrame | undefined} frame - Retired candidate or publication.
	 * @returns {void}
	 */
	_releaseMetadata(frame) {
		for (const texture of frame?.metadataTextures ?? []) texture.dispose();
	}

	/**
	 * Called to cancel the current preparation before any successor can reserve slots.
	 *
	 * @returns {void}
	 */
	_cancel() {
		if (this._cancellation && !this._cancellation.signal.aborted) {
			this._cancellation.abort();
			this._counters.canceled += 1;
		}
		this._releaseMetadata(this._candidate);
		this._candidate = undefined;
		if (this._preparingAtlas && this._preparingAtlas !== this._atlas) this._preparingAtlas.dispose();
		this._preparingAtlas = undefined;
		this._atlas?.discardCandidate();
	}

	/**
	 * Called to select required blocks first, then complete future scenes while capacity permits.
	 *
	 * @param {number} ordinal - Current scene.
	 * @param {DistantSunSharedCacheSceneRequest} options - Route position and measured velocity.
	 * @returns {{ids: string[], predicted: number}} - Ordered block window and first predicted scene.
	 */
	_window(ordinal, options) {
		const ids = [...this._graph.scenes[ordinal].requiredBlockIds];
		if (this._layers !== DISTANT_SUN_SHARED_CACHE_DEFAULT_RESIDENT_LAYER_COUNT)
			ids.push(...this._definition.routeQualification.blockIds.filter((id) => !ids.includes(id)));
		if (ids.length > this._layers) throw new RangeError('Shared-cache scene exceeds atlas capacity.');
		const routeIndex = options.routeIndex ?? this._route.indexOf(ordinal);
		if (
			options.routeIndex !== undefined &&
			(!Number.isSafeInteger(routeIndex) || this._route[routeIndex] !== ordinal)
		)
			throw new RangeError('Shared-cache route position does not identify the requested scene.');
		const lookAhead = Math.min(108, Math.max(1, Math.ceil(Math.abs(options.velocityDegreesPerSecond ?? 1))));
		let predicted = -1;
		for (let offset = 1; offset <= lookAhead; offset += 1) {
			const next =
				this._route.length && routeIndex >= 0
					? this._route[routeIndex + offset]
					: ordinal + this._direction * offset;
			if (next === undefined || next < 0 || next > 108) break;
			const union = [...new Set([...ids, ...this._graph.scenes[next].requiredBlockIds])];
			if (union.length > this._layers) break;
			if (predicted < 0) predicted = next;
			ids.splice(0, ids.length, ...union);
		}
		if (
			this._layers !== DISTANT_SUN_SHARED_CACHE_DEFAULT_RESIDENT_LAYER_COUNT &&
			ids.some((id) => !this._definition.routeQualification.blockIds.includes(id))
		)
			throw new RangeError('Shared-cache requested window is outside the qualified route.');
		return {ids, predicted};
	}

	/**
	 * Called to upload immutable metadata only after a complete candidate has been validated.
	 *
	 * @param {DistantSunSharedCachePublicationSnapshot} snapshot - Accepted complete publication.
	 * @returns {CacheImmutableTexture[]} - Owned metadata textures, released on failure or retirement.
	 */
	_uploadMetadata(snapshot) {
		/**
		 * Candidate-owned metadata resources.
		 *
		 * @type {CacheImmutableTexture[]}
		 */
		const textures = [];
		try {
			for (const [table, valueKey] of /** @type {const} */ ([
				[snapshot.rowAddressTable, 'cache.sharedRowAddress'],
				[snapshot.altitudeLedgerTable, 'cache.sharedAltitudeLedger'],
			])) {
				if (!table) continue;
				textures.push(
					this._definition.backend.uploadImmutableTexture({
						id: `${valueKey}:${snapshot.generation}`,
						valueKey,
						storage: {
							format: /** @type {CacheImmutableTextureFormat} */ (table.format),
							width: table.width,
							height: table.height,
							layers: 1,
						},
						values: table.values,
					}),
				);
			}
			return textures;
		} catch (error) {
			for (const texture of textures) texture.dispose();
			throw error;
		}
	}

	/**
	 * Call this method to replace prediction with a declared ordered route and cancel stale preparation.
	 *
	 * @param {readonly number[]} sceneOrdinals - Ordered scene selections, including reversals and repeated scenes.
	 * @returns {void}
	 */
	setRoute(sceneOrdinals) {
		if (this._disposed) throw new Error('Shared-cache controller is disposed.');
		if (
			!Array.isArray(sceneOrdinals) ||
			sceneOrdinals.length > 10000 ||
			sceneOrdinals.some((ordinal) => !Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal > 108)
		)
			throw new RangeError('Shared-cache route is invalid.');
		if (this._layers !== DISTANT_SUN_SHARED_CACHE_DEFAULT_RESIDENT_LAYER_COUNT) {
			const ids = new Set(
				sceneOrdinals
					.filter((ordinal) => ordinal <= 108)
					.flatMap((ordinal) => this._graph.scenes[ordinal].requiredBlockIds),
			);
			const qualified = this._definition.routeQualification.blockIds;
			if (ids.size !== qualified.length || qualified.some((id) => !ids.has(id)))
				throw new RangeError('Shared-cache route differs from its qualified block set.');
		}
		this._cancel();
		this._generation += 1;
		this._route = [...sceneOrdinals];
	}

	/**
	 * Call this method to prepare a current/predicted window outside the presentation path.
	 * Failure or supersession returns false and preserves the last-good publication.
	 *
	 * @param {number | null} sceneOrdinal - Representative scene ordinal, or null when input angle is at least 108 degrees.
	 * @param {DistantSunSharedCacheSceneRequest} options - Optional route position and velocity.
	 * @returns {Promise<boolean>} - Whether this request produced a complete frame candidate.
	 */
	async requestScene(sceneOrdinal, options = {}) {
		if (this._disposed) throw new Error('Shared-cache controller is disposed.');
		if (
			(sceneOrdinal !== null &&
				(!Number.isSafeInteger(sceneOrdinal) || sceneOrdinal < 0 || sceneOrdinal > 108)) ||
			(options.velocityDegreesPerSecond !== undefined && !Number.isFinite(options.velocityDegreesPerSecond))
		)
			throw new RangeError('Shared-cache scene or velocity is invalid.');
		this._cancel();
		const generation = ++this._generation;
		const cancellation = (this._cancellation = new AbortController());
		const signal = cancellation.signal;
		const started = performance.now();
		this._counters.requests += 1;
		const delta =
			options.velocityDegreesPerSecond ??
			(sceneOrdinal === null ? 0 : this._lastRequested === undefined ? 1 : sceneOrdinal - this._lastRequested);
		if (delta) this._direction = Math.sign(delta);
		if (sceneOrdinal !== null) this._lastRequested = sceneOrdinal;
		try {
			if (sceneOrdinal === null) {
				this._candidate = {
					snapshot: this._metadata.build(null, generation, [], this._layers),
					metadataTextures: [],
					bindings: [],
					predictedBlockIds: [],
					atlas: undefined,
				};
				return true;
			}
			const window = this._window(sceneOrdinal, options);
			this._counters.predictedScene = window.predicted;
			if (!this._atlas)
				this._atlas = new DistantSunSharedCacheAtlas(
					this._definition.backend,
					this._layers,
					`shared-atlas:${generation}`,
				);
			if (!this._atlas.isCurrent()) this._atlas.resetAfterRestoration();
			let atlas = this._atlas;
			const required = this._graph.scenes[sceneOrdinal].requiredBlockIds;
			// Predictions must never force a transition allocation when the requested scene fits.
			if (atlas.canFit(required)) {
				while (!atlas.canFit(window.ids) && window.ids.length > required.length) window.ids.pop();
				if (
					window.predicted >= 0 &&
					this._graph.scenes[window.predicted].requiredBlockIds.some((id) => !window.ids.includes(id))
				)
					this._counters.predictedScene = -1;
			}
			if (!atlas.canFit(window.ids)) {
				if (this._definition.maximumGpuBytes < this._layers * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES * 2)
					throw new RangeError('Shared-cache jump requires a qualified dual-atlas transition budget.');
				atlas = new DistantSunSharedCacheAtlas(
					this._definition.backend,
					this._layers,
					`shared-transition:${generation}`,
				);
				this._counters.transitions += 1;
			}
			this._preparingAtlas = atlas;
			const reserved = new Set(window.ids);
			const pinned = new Set(
				atlas
					.getSlots()
					.filter((slot) => slot.lease)
					.map((slot) => slot.block.id),
			);
			const needed = window.ids.filter((id) => !pinned.has(id));
			this._counters.reused += window.ids.length - needed.length;
			// Four complete artifact jobs are admitted by the shared transport. Sequential installation
			// keeps slot choice deterministic while the next requests prepare outside the visible frame.
			for (let start = 0; start < needed.length; start += 4) {
				const results = await Promise.allSettled(
					needed.slice(start, start + 4).map((id) => {
						const block = this._graph.blockIndex.blocks.find((item) => item.id === id);
						return this._definition.transport.request({
							url: this._definition.package.getBlockUrl(id),
							block,
							logicalToUniqueIndex: this._graph.logicalToUniqueIndex,
							logicalToUniqueIndexSha256:
								this._graph.configuration.directionLayout.logicalToUniqueIndex.sha256,
							signal,
							pin: {kind: 'candidate', owner: `shared:${generation}`},
						});
					}),
				);
				let installed = 0;
				try {
					signal.throwIfAborted();
					const failed = results.find((result) => result.status === 'rejected');
					if (failed?.status === 'rejected') throw failed.reason;
					for (let offset = 0; offset < results.length; offset += 1) {
						const result = results[offset];
						if (result.status !== 'fulfilled') continue;
						const block = this._graph.blockIndex.blocks.find((item) => item.id === needed[start + offset]);
						if (atlas.install(block, result.value, reserved)) this._counters.uploads += 1;
						else this._counters.reused += 1;
						installed = offset + 1;
					}
				} catch (error) {
					for (const result of results.slice(installed))
						if (result.status === 'fulfilled') result.value.release();
					throw error;
				}
			}
			signal.throwIfAborted();
			const snapshot = this._metadata.build(sceneOrdinal, generation, atlas.getSlots(), this._layers);
			const metadataTextures = this._uploadMetadata(snapshot);
			this._candidate = {
				snapshot,
				metadataTextures,
				atlas,
				predictedBlockIds: window.ids,
				bindings: [atlas.array.runtimeBinding, ...metadataTextures.map((texture) => texture.runtimeBinding)],
			};
			this._counters.lastPreparationMilliseconds = performance.now() - started;
			this._counters.lastError = '';
			return true;
		} catch (error) {
			if (!signal.aborted && generation === this._generation) {
				this._counters.failures += 1;
				this._counters.lastError = error instanceof Error ? error.message : String(error);
				this._cancel();
			}
			return false;
		}
	}

	/** Call this method to inspect a borrowed complete candidate for off-frame lighting preparation.
	 * @returns {DistantSunSharedCacheFrame | undefined} - Complete candidate, invalidated by supersession.
	 */
	getPreparedFrame() {
		return this._candidate;
	}

	/** Call this method to cancel candidate preparation while preserving the visible scene.
	 * @returns {void}
	 */
	cancelPreparation() {
		this._cancel();
		this._generation += 1;
	}

	/**
	 * Call this method once at the frame boundary, then install the returned bindings and coherent light state before rendering.
	 * A missing or invalid candidate holds the last publication; unavailable contexts return no renderable frame.
	 *
	 * @returns {DistantSunSharedCacheFrame | undefined} - Complete current frame, or no renderable publication.
	 */
	publishFrame() {
		if (this._disposed) return undefined;
		const candidate = this._candidate;
		if (!candidate) {
			this._counters.held += 1;
			return this._published?.atlas && !this._published.atlas.isCurrent() ? undefined : this._published;
		}
		if (candidate.snapshot.generation !== this._generation || (candidate.atlas && !candidate.atlas.isCurrent())) {
			this._cancel();
			this._counters.held += 1;
			return this._published?.atlas && !this._published.atlas.isCurrent() ? undefined : this._published;
		}
		candidate.atlas?.protect(
			candidate.snapshot.requiredBlockIds,
			candidate.predictedBlockIds,
			`shared:${this._generation}`,
		);
		const previous = this._published;
		const oldAtlas = this._atlas;
		this._published = candidate;
		this._candidate = undefined;
		this._preparingAtlas = undefined;
		this._atlas = candidate.atlas;
		this._releaseMetadata(previous);
		if (oldAtlas && oldAtlas !== candidate.atlas) oldAtlas.dispose();
		this._counters.published += 1;
		return candidate;
	}

	/**
	 * Call this method to inspect bounded preparation, hold, prediction, and resource diagnostics.
	 *
	 * @returns {DistantSunSharedCacheControllerDiagnostics} - Current bounded state.
	 */
	diagnostics() {
		return {
			...this._counters,
			generation: this._generation,
			sceneOrdinal: this._published?.snapshot.sceneOrdinal ?? null,
			candidateReady: Boolean(this._candidate),
			gpuBytes:
				(Number(Boolean(this._atlas)) +
					Number(Boolean(this._preparingAtlas && this._preparingAtlas !== this._atlas))) *
				this._layers *
				DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
		};
	}

	/**
	 * Call this method to cancel preparation and release all owned GPU resources and host pins.
	 * The process-wide transport remains owned by the application.
	 *
	 * @returns {void}
	 */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._cancel();
		this._generation += 1;
		this._releaseMetadata(this._published);
		this._published = undefined;
		this._atlas?.dispose();
		this._atlas = undefined;
	}
}
