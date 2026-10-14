import {CanonicalValueHash} from '../../../../value-identity/CanonicalValueHash.js';
import DistanceMath from '../../../../math/DistanceMath.js';
import {GeometryDirections} from '../../../../geometry-support/GeometryDirections.js';
import {SpectralPacket} from '../../../../spectral-values/index.js';
import {SharedModel} from '../../../algorithm32/model/SharedModel.js';
import {FlatLocalCacheTransform} from '../../../flat-earth/FlatLocalCacheTransform.js';
import {LocalSunCompactConstructionProfile} from '../LocalSunCompactConstructionProfile.js';
import {LocalSunCompactCache} from '../LocalSunCompactCache.js';
import {LocalSunFrameCache} from './LocalSunFrameCache.js';

/** Source-owned canonical cache leases and complete live-frame preparation/publication.
 *
 * @implements {LocalSunFramePublicationController}
 */
export class LocalSunFrameController {
	/** Current externally owned backend and renderer staging operation.
	 *
	 * @type {LocalSunFrameControllerConfiguration}
	 */ _configuration;
	/** Entries include retired resources until their final borrower releases.
	 *
	 * @type {Set<LocalSunFrameCacheEntry>}
	 */ _entries = new Set();
	/** Only controller-created prepared packets may be published.
	 *
	 * @type {Map<PreparedLocalSunFrame,LocalSunFrameRecord>}
	 */ _records = new Map();
	/** Atomically displayed complete frame.
	 *
	 * @type {PreparedLocalSunFrame|null}
	 */ _active = null;
	/** Last successfully published exact request, retained across restoration failures.
	 *
	 * @type {LocalSunFrameRequest|null}
	 */ _lastRequest = null;
	/** Latest accepted preparation cancellation.
	 *
	 * @type {AbortController|null}
	 */ _cancellation = null;
	/** Monotonic requested generation.
	 *
	 * @type {number}
	 */ _generation = 0;
	/** Context revision invalidates every old-context lease.
	 *
	 * @type {number}
	 */ _contextRevision = 0;
	/** Serialized build/stage tail; jobs never compete for construction resources.
	 *
	 * @type {Promise<void>}
	 */ _tail = Promise.resolve();
	/** Lost contexts have no renderable frame.
	 *
	 * @type {boolean}
	 */ _contextLost = false;
	/** Owner disposal prevents future preparation.
	 *
	 * @type {boolean}
	 */ _disposed = false;
	/** Accepted stages still awaiting completion and cleanup.
	 *
	 * @type {number}
	 */ _pendingOperations = 0;
	/** Disposal completion, including the final cache borrower.
	 *
	 * @type {Promise<void>}
	 */ _released;
	/** Completion resolver retained by the resource owner.
	 *
	 * @type {() => void}
	 */ _resolveReleased;

	/** Called by resource release and stage completion to notify the external backend owner.
	 *
	 * @returns {void} - No value.
	 */
	_notifyReleased() {
		if (this._disposed && this._pendingOperations === 0 && this._entries.size === 0) this._resolveReleased();
	}

	/** Called by lease retirement to dispose physical resources only after their final valid borrower releases.
	 * Resource-owner disposal failures propagate after unregistering the retired entry; report them without reusing it.
	 *
	 * @param {LocalSunFrameCacheEntry} entry - Canonical resource registry entry.
	 * @returns {void} - No value.
	 */
	_collect(entry) {
		if (entry.retired && entry.borrowers === 0) {
			try {
				if (!entry.disposed) {
					entry.disposed = true;
					entry.controller.dispose();
				}
			} finally {
				this._entries.delete(entry);
				this._notifyReleased();
			}
		}
	}

	/** Called by candidate failure/publication to retire one complete packet without touching other frame resources.
	 * AggregateError reports any packet, lease or final-cache release failures after all releases
	 * are attempted; report every cause and never reuse this retired packet.
	 *
	 * @param {LocalSunFrameRecord} record - Owned frame packet.
	 * @returns {void} - No value.
	 */
	_retireFrame(record) {
		if (record.retired) return;
		record.retired = true;
		this._records.delete(record.frame);
		const errors = [];
		try {
			record.frame.contents.dispose();
		} catch (error) {
			errors.push(error);
		}
		try {
			record.lease.dispose();
		} catch (error) {
			errors.push(error);
		}
		if (this._active?.constructionIdentity !== record.entry.key) {
			record.entry.retired = true;
			try {
				this._collect(record.entry);
			} catch (error) {
				errors.push(error);
			}
		}
		if (errors.length) throw new AggregateError(errors, 'Complete frame retirement failed.');
	}

	/** Called by lifecycle transitions to retire every selected packet before reporting cleanup errors.
	 *
	 * @param {boolean} includeActive - Whether the displayed packet must also retire.
	 * @param {unknown[]} errors - Cleanup-failure accumulator for independent teardown attempts.
	 * @returns {void} - No value.
	 */
	_retireRecords(includeActive, errors) {
		for (const record of [...this._records.values()])
			if (includeActive || record.frame !== this._active) {
				try {
					this._retireFrame(record);
				} catch (error) {
					errors.push(error);
				}
			}
	}

	/** Called by controller operations to reject disposed or unavailable rendering context.
	 * Throws when disposed or context-lost; restore the context or create a new controller before work.
	 *
	 * @returns {void} - No value.
	 */
	_assertUsable() {
		if (this._disposed || this._contextLost)
			throw new Error('Local frame controller is disposed or context-unavailable.');
	}

	/** Called by stage boundaries to reject cancelled or superseded generations.
	 * Unavailable controllers throw; cancelled signals propagate their reason and superseded generations
	 * throw AbortError. Discard that candidate and retain only the latest valid request.
	 *
	 * @param {number} generation - Captured requested generation.
	 * @param {AbortSignal} signal - Owned cancellation.
	 * @returns {void} - No value.
	 */
	_requireCurrent(generation, signal) {
		this._assertUsable();
		signal.throwIfAborted();
		if (generation !== this._generation) throw new DOMException('Local frame was superseded.', 'AbortError');
	}

	/** Called by request acceptance to validate and snapshot one complete physical support ray.
	 * Invalid position, direction or optional distance throws; supply valid physical units and a nonzero direction.
	 *
	 * @param {LocalSunFrameSupportRay} ray - Unit-bearing live ray.
	 * @returns {LocalSunFrameSupportRay} - Immutable owned ray snapshot.
	 */
	_copySupportRay(ray) {
		DistanceMath.assertPosition(ray.origin, 'Frame ray origin');
		const coordinates = DistanceMath.toMetersPosition(ray.origin);
		const direction = GeometryDirections.directionTuple(ray.direction, 'Frame ray direction');
		if (ray.length !== undefined) DistanceMath.assertDistance(ray.length, 'Frame ray length');
		return {
			origin: {
				coordinates: [coordinates[0], coordinates[1], coordinates[2]],
				units: 'meters',
			},
			direction: [direction[0], direction[1], direction[2]],
			...(ray.length === undefined ? {} : {length: {...ray.length}}),
		};
	}

	/** Called by request ingress to validate complete accounting and accepted physical/live state.
	 * Invalid profiles, byte units/values, presentation identity or physical rays throw;
	 * correct the rejected input before preparing another candidate.
	 *
	 * @param {LocalSunFrameRequest} request - Complete frame request.
	 * @returns {LocalSunFrameRequest} - Owned snapshot of accepted exact live facts.
	 */
	_acceptRequest(request) {
		LocalSunCompactConstructionProfile.assert(request?.profile).createExecutionProfile();
		const other = request.otherOwnedGpuBytes;
		if (other?.units !== 'bytes' || !Number.isSafeInteger(other.value) || other.value < 0)
			throw new RangeError('Complete nonnegative additional GPU allocation accounting required.');
		if (
			typeof request.presentationIdentity !== 'string' ||
			!request.presentationIdentity ||
			!Array.isArray(request.viewRays) ||
			request.viewRays.length === 0
		)
			throw new TypeError('Exact presentation identity and complete physical view rays required.');
		const profile = request.profile.createLiveProfile({
			observation: request.profile.models.geometry.configuration.observation,
			receiverPosition: request.profile.models.geometry.configuration.observerPosition,
			sourcePosition: request.profile.models.lightSource.configuration.position,
		});
		return {
			profile,
			presentationIdentity: request.presentationIdentity,
			otherOwnedGpuBytes: {...other},
			viewRays: request.viewRays.map((ray) => this._copySupportRay(ray)),
		};
	}

	/** Called by preparation and publication to compare every exact requested live fact.
	 *
	 * @param {LocalSunFrameRequest} request - Retained live request.
	 * @param {number} generation - Unique requested generation.
	 * @param {string} construction - Canonical physical entry identity.
	 * @returns {string} - Exact complete frame identity.
	 */
	_frameIdentity(request, generation, construction) {
		return CanonicalValueHash.sha256Value({
			generation,
			context: this._contextRevision,
			construction,
			live: request.profile.contentHash,
			observation: request.profile.models.geometry.configuration.observation,
			source: request.profile.models.lightSource.configuration.position,
			receiver: request.profile.models.geometry.configuration.observerPosition,
			rays: request.viewRays,
			presentation: request.presentationIdentity,
		});
	}

	/** Called by preparation to bind exact live geometry to canonical cache coordinates and validate every ray.
	 * Invalid transforms or rays outside complete cache support throw; correct the geometry or
	 * select a supported view before preparing a replacement, retaining the displayed frame.
	 *
	 * @param {LocalSunFrameRequest} request - Accepted live request.
	 * @param {LocalSunCompactConstructionProfile} canonical - Canonical physical profile.
	 * @returns {FlatLocalCacheTransformCapability} - Complete admitted geometry map.
	 */
	_resolveSupport(request, canonical) {
		const transform = new FlatLocalCacheTransform({
			canonicalSource: canonical.models.lightSource.configuration.position,
			liveSource: request.profile.models.lightSource.configuration.position,
			rotationRadians: 0,
		});
		const receiver = transform.toCanonicalPosition(request.profile.models.geometry.configuration.observerPosition);
		canonical.models.geometry.resolveCompactLocalSunCacheRay({
			topology: canonical.domains.topology,
			position: receiver,
			physicalDirection: [0, 0, 1],
		});
		for (const ray of request.viewRays) {
			const supported = canonical.models.geometry.resolveCompactLocalSunCacheRay({
				topology: canonical.domains.topology,
				position: transform.toCanonicalPosition(ray.origin),
				physicalDirection: transform.toCanonicalDirection(ray.direction),
				...(ray.length === undefined ? {} : {maximumDistance: ray.length}),
			});
			const required = request.profile.models.geometry.resolveViewRaySegment({
				origin: ray.origin,
				direction: ray.direction,
				...(ray.length === undefined ? {} : {endDistance: ray.length}),
			});
			if (DistanceMath.toMeters(required.endDistance) > supported.length.value + 1e-7)
				throw new RangeError(
					'Requested ordinary view segment exits complete cache support; replacement or explicit unsupported status required.',
				);
		}
		return transform;
	}

	/** Called by staging/borrowers to acquire a checked opaque view of one live context's physical cache.
	 * A disposed/lost controller or retired, disposed or old-context entry throws;
	 * acquire from a complete current frame after restoration instead.
	 *
	 * @param {LocalSunFrameCacheEntry} entry - Physical entry, not retired.
	 * @param {FlatLocalCacheTransformCapability} transform - Immutable live geometry mapping.
	 * @returns {GpuScatteringCache & CacheController} - Independently releasable borrow.
	 */
	_acquire(entry, transform) {
		this._assertUsable();
		if (entry.retired || entry.disposed || entry.contextRevision !== this._contextRevision)
			throw new Error('Retired cache cannot acquire new borrowers.');
		entry.borrowers++;
		return new LocalSunFrameCache({
			owner: entry.cache,
			transform,
			/** Release this borrow and collect a retired physical cache after its final borrower leaves.
			 * Resource-owner cleanup failures propagate; report them and do not reuse the released borrow.
			 */
			release: () => {
				entry.borrowers--;
				this._collect(entry);
			},
			/** Reject an unavailable context or disposed entry; the caller must discard the lease and restore a valid frame. */
			validate: () => {
				if (entry.disposed || entry.contextRevision !== this._contextRevision || this._contextLost)
					throw new Error('Cache lease context is unavailable.');
			},
		});
	}

	/** Called by preparation to retain or build the already selected canonical cache.
	 * Accounting reports retained overlap; it does not impose a frontend allocation ceiling.
	 * Invalid canonical profiles reject; correct the profile before retrying. Cancellation rejects
	 * with the build's abort reason; discard that incomplete entry. GPU capability, construction,
	 * packing or upload failures reject; retain the displayed frame and report the backend failure.
	 * An unexpected noncompact result rejects with TypeError; correct the configured cache owner.
	 * AggregateError includes failed controller cleanup; report both construction and cleanup causes.
	 *
	 * @param {LocalSunCompactConstructionProfile} profile - Accepted canonical construction.
	 * @param {LocalSunFrameRequest} request - Complete additional byte accounting.
	 * @param {AbortSignal} signal - Current job cancellation.
	 * @returns {Promise<LocalSunFrameCacheEntry>} - Completed retained resources.
	 */
	async _prepareEntry(profile, request, signal) {
		const key = CanonicalValueHash.sha256Value({
			profile: profile.contentHash,
			backend: this._configuration.backend.capabilities,
		});
		const retained = [...this._entries].reduce((sum, entry) => sum + (entry.disposed ? 0 : entry.retainedBytes), 0);
		const existing = [...this._entries].find((entry) => entry.key === key && !entry.retired && !entry.disposed);
		if (existing) {
			LocalSunCompactConstructionProfile.assert(existing.profile);
			return existing;
		}
		const controller = profile.models.lightSource.createCacheController({
			model: new SharedModel({profile: profile.createExecutionProfile(), version: 0}),
			backend: this._configuration.backend,
			scheduler: this._configuration.scheduler,
		});
		try {
			const cache = await controller.createScatteringCache({
				signal,
				otherOwnedGpuBytes: {value: request.otherOwnedGpuBytes.value + retained, units: 'bytes'},
			});
			if (!(cache instanceof LocalSunCompactCache)) throw new TypeError('Complete compact GPU cache required.');
			const entry = {
				key,
				profile,
				controller,
				cache,
				retainedBytes: cache.resources.runtimeDensityBytes.value + cache.resources.retainedAuxiliaryBytes.value,
				borrowers: 0,
				retired: false,
				disposed: false,
				contextRevision: this._contextRevision,
			};
			this._entries.add(entry);
			return entry;
		} catch (error) {
			try {
				controller.dispose();
			} catch (cleanupError) {
				throw new AggregateError([error, cleanupError], 'Cache construction and cleanup failed.');
			}
			throw error;
		}
	}

	/** Called by preparation to validate receiver/celestial state before a packet can become publishable.
	 * Incomplete shader operations, invalid spectral packets, mismatched identities, adaptation or
	 * celestial placement throw; discard the staged packet and correct its staging owner.
	 *
	 * @param {LocalSunPreparedFrameContents} contents - Renderer-staged complete aggregate.
	 * @param {LocalSunFrameRequest} request - Accepted exact live state.
	 * @param {string} identity - Exact generation/request identity included in the prepared measurement.
	 * @returns {void} - No value.
	 */
	_validateContents(contents, request, identity) {
		if (
			contents?.shaderReady !== true ||
			typeof contents.renderFrame !== 'function' ||
			typeof contents.dispose !== 'function' ||
			!contents.bindingValues
		)
			throw new TypeError('Compiled/preflighted shader and complete owned frame operations required.');
		for (const packet of [
			contents.receiverLight?.directNormal,
			contents.receiverLight?.directHorizontal,
			contents.receiverLight?.diffuseHorizontal,
		])
			SpectralPacket.assert(packet, {
				basis: request.profile.spectral.basis,
				quantity: 'spectral-irradiance-density',
				units: 'W m^-2 nm^-1',
			});
		if (
			contents.receiverLight.identity !== identity &&
			!contents.receiverLight.identity.startsWith(identity + ':basis-')
		)
			throw new RangeError('Receiver measurement must identify the exact prepared frame.');
		const adaptation = contents.receiverLight.stellarAdaptationLuminance;
		if (adaptation?.units !== 'cd m^-2' || !Number.isFinite(adaptation.value) || adaptation.value < 0)
			throw new RangeError('Finite nonnegative measured receiver adaptation required.');
		const expected = {
			observation: request.profile.models.geometry.configuration.observation,
			sourcePosition: request.profile.models.lightSource.configuration.position,
			receiverPosition: request.profile.models.geometry.configuration.observerPosition,
			sourceRadius: request.profile.models.lightSource.configuration.radius,
			stellarAdaptationLuminance: contents.receiverLight.stellarAdaptationLuminance,
			receiverLightIdentity: contents.receiverLight.identity,
		};
		if (CanonicalValueHash.sha256Value(contents.celestialInputs) !== CanonicalValueHash.sha256Value(expected))
			throw new RangeError('Celestial inputs must match exact live placement and measured receiver state.');
	}

	/** Called by the serialized preparation tail to build a complete packet while keeping the displayed frame unchanged.
	 * Cancellation or supersession rejects with an abort reason; discard the obsolete candidate.
	 * Unavailable controllers, invalid profiles, unsupported rays or changed live facts reject;
	 * restore valid state or correct the request before retrying. Cache construction and complete-frame
	 * staging/validation failures reject; retain the displayed frame and report the failed owner.
	 * AggregateError includes candidate cleanup failures; report all causes without publishing partial state.
	 *
	 * @param {LocalSunFrameRequest} request - Accepted live state.
	 * @param {number} generation - Owned generation.
	 * @param {AbortSignal} signal - Owned cancellation.
	 * @returns {Promise<PreparedLocalSunFrame>} - Unpublished complete candidate.
	 */
	async _prepare(request, generation, signal) {
		this._requireCurrent(generation, signal);
		const canonical = LocalSunCompactConstructionProfile.assert(
			request.profile.createCanonicalConstructionProfile(),
		);
		const transform = this._resolveSupport(request, canonical);
		let entry, lease, contents;
		try {
			entry = await this._prepareEntry(canonical, request, signal);
			this._requireCurrent(generation, signal);
			lease = this._acquire(entry, transform);
			const identity = this._frameIdentity(request, generation, entry.key);
			contents = await this._configuration.stageFrame({
				profile: request.profile,
				cacheController: lease,
				backend: this._configuration.backend,
				identity,
				signal,
				otherOwnedGpuBytes: request.otherOwnedGpuBytes,
			});
			this._requireCurrent(generation, signal);
			LocalSunCompactConstructionProfile.assert(request.profile);
			if (identity !== this._frameIdentity(request, generation, entry.key))
				throw new RangeError('Live request changed during frame preparation.');
			this._validateContents(contents, request, identity);
			const frame = {
				generation,
				constructionIdentity: entry.key,
				identity,
				transform,
				profile: request.profile,
				contents,
				/** Call this method to acquire one independently releasable current-frame cache view.
				 * Retired or unpublished frames and unavailable cache contexts throw;
				 * borrow only from the currently published frame after any context restoration.
				 *
				 * @returns {GpuScatteringCache} - Valid borrow retained until explicit disposal or context loss.
				 */
				borrowCache: () => {
					if (this._active !== frame || !this._records.has(frame))
						throw new Error('Retired/unpublished frame cannot acquire borrowers.');
					return this._acquire(entry, transform);
				},
			};
			this._records.set(frame, {frame, request, entry, lease, retired: false});
			return frame;
		} catch (error) {
			const errors = [error];
			try {
				contents?.dispose();
			} catch (cleanupError) {
				errors.push(cleanupError);
			}
			try {
				lease?.dispose();
			} catch (cleanupError) {
				errors.push(cleanupError);
			}
			if (entry && this._active?.constructionIdentity !== entry.key) {
				entry.retired = true;
				try {
					this._collect(entry);
				} catch (cleanupError) {
					errors.push(cleanupError);
				}
			}
			if (errors.length > 1) throw new AggregateError(errors, 'Frame preparation and cleanup failed.');
			throw error;
		}
	}

	/** Creates a frame owner with an external backend and explicit complete staging operation.
	 * Missing backend or staging function throws TypeError; correct the configuration before creating an owner.
	 *
	 * @param {LocalSunFrameControllerConfiguration} configuration - Accepted owners.
	 */
	constructor(configuration) {
		if (!configuration?.backend || typeof configuration.stageFrame !== 'function')
			throw new TypeError('GPU backend and complete frame staging owner required.');
		this._configuration = {...configuration};
		this._released = new Promise((resolve) => {
			this._resolveReleased = resolve;
		});
	}

	/** Displayed complete state, or unavailable after context loss.
	 *
	 * @returns {PreparedLocalSunFrame|null} - Current atomic frame.
	 */
	get active() {
		return this._active;
	}

	/** Call this method to await disposal, pending stage cleanup and the final valid cache borrower.
	 *
	 * @returns {Promise<void>} - External backend disposal is safe after this settles.
	 */
	whenReleased() {
		return this._released;
	}

	/** Call this method to stage an exact live frame; newer accepted requests supersede earlier preparations.
	 * Unavailable controllers, already-aborted signals and invalid requests throw synchronously;
	 * restore the controller or correct the request before retrying. Superseded-packet cleanup can
	 * throw AggregateError; report those retired-resource failures. Once queued, cancellation or
	 * supersession rejects with its abort reason; discard that candidate. Cache construction,
	 * unsupported coverage, staging or state-validation failures reject while retaining the displayed
	 * frame; correct the rejected physical/view input or report the failing backend/staging owner.
	 * AggregateError includes candidate cleanup failures; report every cause and publish no partial frame.
	 *
	 * @param {LocalSunFrameRequest} request - Complete accepted physical/presentation state.
	 * @param {AbortSignal} [signal] - Optional caller cancellation.
	 * @returns {Promise<PreparedLocalSunFrame>} - Complete unpublished packet.
	 */
	prepareLocalFrame(request, signal) {
		this._assertUsable();
		signal?.throwIfAborted();
		const accepted = this._acceptRequest(request);
		this._cancellation?.abort();
		const cancellation = new AbortController();
		this._cancellation = cancellation;
		const generation = ++this._generation;
		const errors = [];
		this._retireRecords(false, errors);
		if (errors.length) throw new AggregateError(errors, 'Superseded frame cleanup failed.');
		/** Forward caller cancellation to the current frame candidate.
		 *
		 * @returns {void} - Candidate cancellation is signalled.
		 */
		const abort = () => cancellation.abort(signal.reason);
		signal?.addEventListener('abort', abort, {once: true});
		this._pendingOperations++;
		const operation = this._tail
			.then(() => this._prepare(accepted, generation, cancellation.signal))
			.finally(() => {
				this._pendingOperations--;
				this._notifyReleased();
			});
		this._tail = operation.then(
			() => {},
			() => {},
		);
		return operation.finally(() => {
			signal?.removeEventListener('abort', abort);
		});
	}

	/** Call this method to replace the single complete active packet at a frame boundary.
	 * No asynchronous component update occurs here; every consumer observes the same aggregate.
	 * Unknown, retired, superseded, mutated or invalid complete packets and unavailable contexts throw
	 * before commit; discard the packet and prepare a valid replacement. Installation errors propagate
	 * before controller commit; the installer must restore any partially installed renderer state.
	 * Post-commit retirement failures are returned separately; report them without undoing the new frame.
	 *
	 * @param {PreparedLocalSunFrame} frame - Controller-created current complete packet.
	 * @param {LocalSunFrameRenderInstallation} [install] - Synchronous renderer installation after validation and before commit; failure retains the old frame.
	 * @returns {LocalSunFramePublication} - Published complete frame and any post-commit retirement errors.
	 */
	publishPreparedLocalFrame(frame, install) {
		this._assertUsable();
		const record = this._records.get(frame);
		if (!record || record.retired) throw new RangeError('Unknown or retired local frame.');
		this._requireCurrent(frame.generation, this._cancellation.signal);
		LocalSunCompactConstructionProfile.assert(frame.profile);
		if (this._frameIdentity(record.request, frame.generation, frame.constructionIdentity) !== frame.identity)
			throw new RangeError('Live frame facts changed after preparation.');
		this._validateContents(frame.contents, record.request, frame.identity);
		install?.();
		const previous = this._active;
		this._active = frame;
		this._lastRequest = record.request;
		const retirementErrors = [];
		if (previous && previous !== frame)
			try {
				this._retireFrame(this._records.get(previous));
			} catch (error) {
				retirementErrors.push(error);
			}
		for (const entry of this._entries)
			if (entry !== record.entry) {
				entry.retired = true;
				try {
					this._collect(entry);
				} catch (error) {
					retirementErrors.push(error);
				}
			}
		return {frame, retirementErrors};
	}

	/** Call this method to cancel candidate preparation while keeping the last displayed frame.
	 * AggregateError reports superseded-packet cleanup failures; report them and never reuse cancelled candidates.
	 *
	 * @returns {void} - No value.
	 */
	cancelPreparation() {
		this._cancellation?.abort();
		this._generation++;
		const errors = [];
		this._retireRecords(false, errors);
		if (errors.length) throw new AggregateError(errors, 'Cancelled frame cleanup failed.');
	}

	/** Call this method to invalidate every GPU lease and withdraw the unrenderable lost-context frame.
	 * AggregateError reports resource cleanup failures after invalidation; report every cause and
	 * await a valid restored backend before requesting new frames.
	 *
	 * @returns {void} - No value.
	 */
	handleContextLoss() {
		if (this._disposed || this._contextLost) return;
		this._cancellation?.abort();
		this._generation++;
		this._contextLost = true;
		this._contextRevision++;
		this._active = null;
		const errors = [];
		this._retireRecords(true, errors);
		for (const entry of [...this._entries]) {
			entry.retired = true;
			try {
				if (!entry.disposed) {
					entry.disposed = true;
					entry.controller.dispose();
				}
			} catch (error) {
				errors.push(error);
			}
			this._entries.delete(entry);
		}
		if (errors.length) throw new AggregateError(errors, 'Lost-context cleanup failed.');
	}

	/** Call this method to rebuild the last published complete request on an explicitly valid restored backend.
	 * Disposal, absence of a lost context or a missing backend rejects; correct the lifecycle/backend first.
	 * Rebuilding can reject for cancellation, unsupported request coverage, GPU construction or staging
	 * failures, including aggregate cleanup failures; report the cause and prepare a valid replacement
	 * on the restored controller. No rejected candidate may be published.
	 *
	 * @param {LocalSunFrameBackend} backend - Restored external backend.
	 * @returns {Promise<PreparedLocalSunFrame|null>} - Complete unpublished restoration candidate, or no prior request.
	 */
	async restoreContext(backend) {
		if (this._disposed || !this._contextLost || !backend)
			throw new Error('Lost live context and valid restored backend required.');
		this._configuration = {...this._configuration, backend};
		this._contextLost = false;
		return this._lastRequest ? this.prepareLocalFrame(this._lastRequest) : null;
	}

	/** Call this method to retire all frames and reject future work; borrowed valid resources release on their final lease.
	 * AggregateError reports packet or cache release failures after retirement; report all causes,
	 * never reuse this controller and await whenReleased before disposing the external backend.
	 *
	 * @returns {void} - No value.
	 */
	dispose() {
		if (this._disposed) return;
		this._cancellation?.abort();
		this._generation++;
		this._disposed = true;
		this._active = null;
		const errors = [];
		this._retireRecords(true, errors);
		for (const entry of [...this._entries]) {
			entry.retired = true;
			try {
				this._collect(entry);
			} catch (error) {
				errors.push(error);
			}
		}
		this._notifyReleased();
		if (errors.length) throw new AggregateError(errors, 'Frame owner disposal failed.');
	}
}
