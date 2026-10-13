/** Borrowed compact field and geometry-owned lookup transform for one shader or frame consumer.
 *
 * @implements {GpuScatteringCache}
 * @implements {CacheController}
 */
export class LocalSunFrameCache {
	/** Physical owner retained by the lease registry. @type {LocalSunFrameCacheOwner} */ _owner;
	/** Immutable physical coordinate map. @type {FlatLocalCacheTransformCapability} */ _transform;
	/** Once-only ownership release. @type {LocalSunFrameLeaseRelease} */ _release;
	/** Current context/retirement validity check. @type {LocalSunFrameLeaseValidation} */ _validate;
	/** Lease teardown state. @type {boolean} */ _disposed = false;

	/** Called by lease operations to reject released or context-invalid resources.
	 *
	 * @returns {void} - No value.
	 */
	_assertUsable() {
		if (this._disposed) throw new Error('Local frame cache lease is released.');
		this._validate();
	}

	/** Creates a borrowed view without copying or taking direct disposal ownership of the field.
	 *
	 * @param {LocalSunFrameCacheLeaseDefinition} definition - Physical owner, transform and registry operations.
	 */
	constructor({owner, transform, release, validate}) {
		this._owner = owner;
		this._transform = transform;
		this._release = release;
		this._validate = validate;
	}

	/** Current shader-controller view, or no view after release.
	 *
	 * @returns {LocalSunFrameCache|null} - This borrowed view.
	 */
	get active() {
		return this._disposed ? null : this;
	}

	/** Call this method to provide the already admitted view to ordinary shader setup.
	 *
	 * @param {ScatteringCacheBuildRequest} request - Caller cancellation; construction is owned by the registry.
	 * @returns {Promise<LocalSunFrameCache>} - This complete borrowed view.
	 */
	async createScatteringCache(request) {
		request.signal?.throwIfAborted();
		this._assertUsable();
		return this;
	}

	/** Call this method to obtain the canonical field's opaque bindings while this lease is valid.
	 *
	 * @returns {CacheRuntimeBindings} - Same field and auxiliary handles, without public packing access.
	 */
	getRuntimeBindings() {
		this._assertUsable();
		return this._owner.getRuntimeBindings();
	}

	/** Call this method to contribute geometry-transformed lookup with unchanged stored physical density.
	 *
	 * @returns {ShaderContribution} - Complete ordinary cache contribution.
	 */
	createShaderContribution() {
		this._assertUsable();
		return this._owner.createFrameShaderContribution(this._transform);
	}

	/** Call this method to release this borrow once; other borrowers remain valid.
	 *
	 * @returns {void} - No value.
	 */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._release();
	}
}
