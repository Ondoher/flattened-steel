const FINGERPRINT_VERSION = 'fnv1a64-canonical-json-v1';

function requireObject(value, label) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
	return value;
}

function requireId(value, label) {
	if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${label} must be a nonempty string.`);
	return value;
}

function canonical(value) {
	if (Array.isArray(value)) return value.map(canonical);
	if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
	if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError('Generation identity contains a non-finite number.');
	return value;
}

function fingerprint(value) {
	let hash = 0xcbf29ce484222325n;
	for (const character of JSON.stringify(canonical(value))) {
		hash ^= BigInt(character.codePointAt(0));
		hash = BigInt.asUintN(64, hash * 0x100000001b3n);
	}
	return `${FINGERPRINT_VERSION}:${hash.toString(16).padStart(16, '0')}`;
}

function abortError(message) {
	const error = new Error(message);
	error.name = 'AbortError';
	return error;
}

function disposeOnce(resource) {
	resource?.dispose?.();
}

function disposeAll(resources) {
	for (const resource of resources) disposeOnce(resource);
}

function validateLayers(value) {
	if (!Array.isArray(value) || value.length !== 2) throw new RangeError('The first family requires exactly star and Sun layers.');
	const layers = value.map((layer) => requireObject(layer, 'celestial layer'));
	const ids = new Set(layers.map((layer) => requireId(layer.layerId, 'celestial layer id')));
	if (ids.size !== layers.length) throw new RangeError('Celestial layer ids must be unique.');
	const stars = layers.find((layer) => layer.kind === 'infinite-point-set');
	const sun = layers.find((layer) => layer.kind === 'distant-extended');
	if (!stars || !sun || layers.some((layer) => layer.compositionPolicy !== 'additive')) throw new RangeError('The first family requires additive star and distant Sun layers.');
	if (!Number.isSafeInteger(stars.fixedCapacity) || stars.fixedCapacity < 1 || !Array.isArray(stars.members) || stars.members.length < 1 || stars.members.length > stars.fixedCapacity) throw new RangeError('Star layer members must fit its fixed capacity.');
	const members = [...stars.members].map((id) => requireId(id, 'star member id')).sort();
	if (new Set(members).size !== members.length) throw new RangeError('Star member ids must be unique.');
	const sourceId = requireId(sun.sourceId, 'Sun source id');
	return {
		layers: [
			{ layerId: stars.layerId, kind: stars.kind, compositionPolicy: 'additive', fixedCapacity: stars.fixedCapacity, members },
			{ layerId: sun.layerId, kind: sun.kind, compositionPolicy: 'additive', sourceId },
		],
		pointMemberIds: members,
		extendedSourceId: sourceId,
	};
}

/** One complete, generation-scoped celestial cache publication. */
export class CelestialContributionCacheGeneration {
	constructor({ descriptor, pointPayloads, extendedPayloads, resourceReport }) {
		this.descriptor = Object.freeze(descriptor);
		this.pointPayloads = Object.freeze([...pointPayloads]);
		this.extendedPayloads = Object.freeze([...extendedPayloads]);
		this.resourceReport = Object.freeze({ ...resourceReport });
		this._disposed = false;
	}

	get disposed() { return this._disposed; }

	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		disposeAll([...this.pointPayloads, ...this.extendedPayloads]);
	}
}

/** Geometry-created, attachment-owned controller for complete celestial generations. */
export class CelestialContributionCacheController {
	constructor({ geometry, backend, scheduler = null }) {
		if (!geometry || typeof geometry.describeCelestialContributionDomain !== 'function') throw new TypeError('Celestial controller requires its owning geometry.');
		if (!backend || typeof backend !== 'object') throw new TypeError('Celestial controller requires an externally owned backend.');
		this._geometry = geometry;
		this._backend = backend;
		this._scheduler = scheduler;
		this._active = null;
		this._activeIdentity = null;
		this._tail = Promise.resolve();
		this._latestCancellation = null;
		this._requestGeneration = 0;
		this._publishedGeneration = 0;
		this._disposed = false;
	}

	get active() { return this._active; }

	deriveBuildPlan(request) {
		const input = requireObject(request, 'celestial cache build request');
		if (input.foregroundEdges !== undefined && (!Array.isArray(input.foregroundEdges) || input.foregroundEdges.length !== 0)) throw new RangeError('The first celestial family rejects foreground edges.');
		const roster = validateLayers(input.layers);
		const identities = {
			familyId: this._geometry.describeCelestialContributionDomain().familyId,
			physicalFieldFingerprint: requireId(input.physicalFieldFingerprint, 'physicalFieldFingerprint'),
			representationFingerprint: requireId(input.representationFingerprint, 'representationFingerprint'),
			runtimeCompatibilityFingerprint: requireId(input.runtimeCompatibilityFingerprint, 'runtimeCompatibilityFingerprint'),
			roster,
		};
		return Object.freeze({
			...identities,
			generationIdentity: fingerprint(identities),
			geometryDomain: this._geometry.describeCelestialContributionDomain(),
		});
	}

	_createAbortController(signal) {
		const cancellation = new AbortController();
		if (!signal) return { cancellation, unlink: () => {} };
		if (signal.aborted) cancellation.abort();
		const abort = () => cancellation.abort();
		signal.addEventListener('abort', abort, { once: true });
		return { cancellation, unlink: () => signal.removeEventListener('abort', abort) };
	}

	_assertCurrent(requestGeneration, cancellation) {
		if (this._disposed || cancellation.signal.aborted || requestGeneration !== this._requestGeneration) throw abortError('Celestial cache construction was cancelled or superseded.');
	}

	_validatePayloads(plan, payloads) {
		const result = requireObject(payloads, 'synthetic celestial payloads');
		if (!Array.isArray(result.pointPayloads) || !Array.isArray(result.extendedPayloads)) throw new TypeError('Synthetic payloads must provide point and extended arrays.');
		if (result.pointPayloads.length !== plan.roster.pointMemberIds.length || result.extendedPayloads.length !== 1) throw new RangeError('Synthetic payloads do not complete the aggregate layer roster.');
		for (const payload of [...result.pointPayloads, ...result.extendedPayloads]) {
			if (!payload || typeof payload.dispose !== 'function') throw new TypeError('Every synthetic payload must be an owned disposable resource.');
		}
		return result;
	}

	async _stage(requestGeneration, request, plan, cancellation) {
		this._assertCurrent(requestGeneration, cancellation);
		let payloads = null;
		try {
			if (typeof request.buildPayloads !== 'function') throw new TypeError('G2 requires a synthetic buildPayloads function.');
			payloads = await request.buildPayloads({
				plan,
				signal: cancellation.signal,
				scheduler: this._scheduler,
			});
			payloads = this._validatePayloads(plan, payloads);
			this._assertCurrent(requestGeneration, cancellation);
			const resourceReport = {
				logicalBytes: payloads.logicalBytes ?? 0,
				packedBytes: payloads.packedBytes ?? 0,
				peakBytes: payloads.peakBytes ?? 0,
				residentBytes: payloads.residentBytes ?? 0,
			};
			if (Object.values(resourceReport).some((value) => !Number.isSafeInteger(value) || value < 0)) throw new RangeError('Synthetic resource report must contain non-negative integer bytes.');
			const generationId = `${plan.generationIdentity}:${this._publishedGeneration + 1}`;
			return new CelestialContributionCacheGeneration({
				descriptor: { cacheKind: 'celestial-contribution-cache', familyId: plan.familyId, generationId, physicalFieldFingerprint: plan.physicalFieldFingerprint, representationFingerprint: plan.representationFingerprint, runtimeCompatibilityFingerprint: plan.runtimeCompatibilityFingerprint, generationIdentity: plan.generationIdentity, layers: plan.roster.layers },
				pointPayloads: payloads.pointPayloads,
				extendedPayloads: payloads.extendedPayloads,
				resourceReport,
			});
		} catch (error) {
			disposeAll([...(payloads?.pointPayloads ?? []), ...(payloads?.extendedPayloads ?? []), ...(error?.payloads ?? [])]);
			throw error;
		}
	}

	/** Create, reuse, or atomically publish one complete synthetic generation. */
	createCelestialContributionCache(request) {
		if (this._disposed) return Promise.reject(new Error('CelestialContributionCacheController is disposed.'));
		let plan;
		try { plan = this.deriveBuildPlan(request); } catch (error) { return Promise.reject(error); }
		if (this._active && this._activeIdentity === plan.generationIdentity) return Promise.resolve(this._active);
		const requestGeneration = ++this._requestGeneration;
		this._latestCancellation?.abort();
		const { cancellation, unlink } = this._createAbortController(request.signal);
		this._latestCancellation = cancellation;
		const operation = this._tail.then(async () => {
			const staged = await this._stage(requestGeneration, request, plan, cancellation);
			try {
				this._assertCurrent(requestGeneration, cancellation);
				const prior = this._active;
				this._active = staged;
				this._activeIdentity = plan.generationIdentity;
				this._publishedGeneration += 1;
				prior?.dispose();
				return staged;
			} catch (error) {
				staged.dispose();
				throw error;
			}
		});
		this._tail = operation.then(() => {}, () => {});
		return operation.finally(() => {
			unlink();
			if (this._latestCancellation === cancellation) this._latestCancellation = null;
		});
	}

	/** Return deliberately distinct build-result slots for future ShaderBuilder integration. */
	createBuildResultSlots() {
		return Object.freeze({
			celestialCacheController: this,
			celestialCacheGeneration: this._active,
			celestialCacheIdentity: this._activeIdentity,
		});
	}

	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._requestGeneration += 1;
		this._latestCancellation?.abort();
		this._latestCancellation = null;
		this._active?.dispose();
		this._active = null;
		this._activeIdentity = null;
	}
}

export default CelestialContributionCacheController;
