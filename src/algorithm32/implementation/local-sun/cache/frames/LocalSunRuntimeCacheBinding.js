/**
 * Retains a shader-facing binding while frame packets own and retire individual cache leases.
 *
 * @implements {GpuScatteringCache}
 * @implements {CacheController}
 */
export class LocalSunRuntimeCacheBinding {
	/**
	 * Creates a non-owning publication of the initial frame lease.
	 *
	 * @param {GpuScatteringCache} cache - Lease retained by its complete frame owner.
	 */
	constructor(cache) {
		this.cache = cache;
		this.bindings = cache.getRuntimeBindings();
	}

	/**
	 * Call this method to switch to another lease of the same backend-owned physical field.
	 *
	 * @param {GpuScatteringCache} cache - Complete compatible frame lease.
	 */
	publish(cache) {
		const next = cache.getRuntimeBindings();
		if (
			!this.cache ||
			next.backendId !== this.bindings.backendId ||
			next.bindings.length !== this.bindings.bindings.length ||
			next.bindings.some((binding, index) => binding.id !== this.bindings.bindings[index].id)
		) {
			throw new Error('Retained shader binding requires the same live physical GPU field.');
		}
		this.cache = cache;
	}

	/**
	 * Current shader-facing cache, without transferring lease ownership.
	 *
	 * @returns {LocalSunRuntimeCacheBinding|null} - Installed binding, or null after disposal.
	 */
	get active() {
		return this.cache ? this : null;
	}

	/**
	 * Call this method during shader setup to reuse the already prepared field.
	 *
	 * @param {ScatteringCacheBuildRequest} request - Setup cancellation.
	 * @returns {Promise<LocalSunRuntimeCacheBinding>} - This stable non-owning binding.
	 */
	async createScatteringCache(request) {
		request.signal?.throwIfAborted();
		this.getRuntimeBindings();
		return this;
	}

	/**
	 * Call this method to obtain the current valid opaque physical bindings.
	 *
	 * @returns {CacheRuntimeBindings} - Backend-owned field handles.
	 */
	getRuntimeBindings() {
		if (!this.cache) {
			throw new Error('Local runtime cache binding is disposed.');
		}
		return this.cache.getRuntimeBindings();
	}

	/**
	 * Call this method to assemble lookup using the initial lease's geometry transform.
	 * Live transform values are subsequently supplied through ordinary runtime bindings.
	 *
	 * @param {ShaderContributionRequest} request - Accepted shader assembly facts.
	 * @returns {ShaderContribution|readonly ShaderContribution[]} - Compatible physical lookup program.
	 */
	createShaderContribution(request) {
		this.getRuntimeBindings();
		return this.cache.createShaderContribution(request);
	}

	/**
	 * Call this method to withdraw the shader binding; frame owners retain lease disposal responsibility.
	 */
	dispose() {
		this.cache = null;
	}
}
