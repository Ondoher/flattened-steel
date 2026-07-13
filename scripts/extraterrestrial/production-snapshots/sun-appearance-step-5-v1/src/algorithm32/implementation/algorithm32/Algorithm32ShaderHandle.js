/**
 * Control one installed Algorithm32 runtime shader integration.
 */
export class Algorithm32ShaderHandle {
	/**
	 * Creates a shader handle.
	 *
	 * @param {Algorithm32ShaderHandleState} state - Supplies facade, setup, and
	 * build state.
	 *
	 */
	constructor(state) {
		this._facade = state.facade;
		this._setup = state.setup;
		this._buildResult = state.buildResult;
		this._disposed = false;
		this._generation = 0;
		this._rebuildCancellation = null;
	}

	/**
	 * Called by the shader handle to collect every independently owned controller from one build result.
	 *
	 * @param {ShaderBuildResult | null | undefined} buildResult - The build result whose controllers are collected.
	 * @returns {ShaderBuildOwnedCacheControllers} - The distinct controller collection.
	 */
	_cacheControllers(buildResult) {
		return /** @type {ShaderBuildOwnedCacheControllers} */ (
			[
				buildResult?.scatteringCacheController,
				buildResult?.distantSunCelestialCacheController,
				buildResult?.stellarPointSetCacheController,
				buildResult?.flatFiniteSunCacheController,
			].filter(
				/**
				 * Called by Array.prototype.filter to retain one owned cache controller.
				 *
				 * @param {ShaderBuildOwnedCacheController | null | undefined} controller - The candidate controller.
				 * @returns {controller is ShaderBuildOwnedCacheController} - Whether the controller is present.
				 */
				(controller) => controller !== null && controller !== undefined,
			)
		);
	}

	/**
	 * Called by algorithm32 shader handle to dispose runtime resources owned by the current build result.
	 *
	 * @param {ShaderBuildResult | null | undefined} buildResult - The build result whose resources are retired.
	 * @param {ShaderBuildPreservedCacheControllers} preservedControllers - The controllers retained by another build result.
	 * @returns {void} - No return value.
	 */
	_disposeBuildResult(buildResult = this._buildResult, preservedControllers = new Set()) {
		const disposalErrors = [];
		try {
			buildResult?.runtime?.dispose?.();
		} catch (error) {
			disposalErrors.push(error);
		}
		for (const controller of new Set(this._cacheControllers(buildResult))) {
			if (!preservedControllers.has(controller)) {
				try {
					controller.dispose();
				} catch (error) {
					disposalErrors.push(error);
				}
			}
		}
		if (disposalErrors.length === 1) {
			throw disposalErrors[0];
		}
		if (disposalErrors.length > 1) {
			throw new AggregateError(disposalErrors, 'Algorithm32 shader resource disposal failed.');
		}
	}

	/**
	 * Called by algorithm32 shader handle to assert that the handle is still usable.
	 *
	 * @returns {void} -
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_assertUsable() {
		if (this._disposed) {
			throw new Error('Algorithm32 shader handle has been disposed.');
		}
	}

	/**
	 * Call this method to replace facade config and refresh runtime shader resources. Replacement failure rejects while retaining the prior installed configuration; cancellation or supersession rejects with an abort error and callers must discard the rejected snapshot.
	 *
	 * @param {Config} config - Supplies the replacement facade config.
	 * @param {ConfigReplacementOptions} [options] - Supplies optional caller cancellation.
	 * @returns {Promise<ConfigSnapshot>} - The accepted config snapshot.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	async setConfig(config, options = {}) {
		this._assertUsable();
		if (options.signal?.aborted) {
			const error = new Error('Algorithm32 shader rebuild was aborted by the caller.');
			error.name = 'AbortError';
			throw error;
		}
		this._generation += 1;
		const generation = this._generation;
		this._rebuildCancellation?.abort();
		const cancellation = new AbortController();
		const abortFromCaller = () => cancellation.abort();
		options.signal?.addEventListener('abort', abortFromCaller, {once: true});
		this._rebuildCancellation = cancellation;
		const prepared = this._facade._prepareConfig(config);
		let nextBuildResult = null;
		let committed = false;

		try {
			nextBuildResult = await prepared.shaderBuilder.build(
				this._facade._createShaderBuildRequest(this._setup, prepared.snapshot, {
					previousBuildResult: this._buildResult,
					signal: cancellation.signal,
				}),
			);
			if (this._disposed || cancellation.signal.aborted || generation !== this._generation) {
				const error = new Error('Algorithm32 shader rebuild was superseded.');
				error.name = 'AbortError';
				throw error;
			}

			const snapshot = this._facade._commitPreparedConfig(prepared);
			committed = true;
			const previousBuildResult = this._buildResult;
			this._buildResult = nextBuildResult;
			this._disposeBuildResult(previousBuildResult, new Set(this._cacheControllers(nextBuildResult)));

			return snapshot;
		} catch (error) {
			if (!committed) {
				if (nextBuildResult) {
					this._disposeBuildResult(nextBuildResult, new Set(this._cacheControllers(this._buildResult)));
				}
				this._facade._discardPreparedConfig(prepared);
			}
			throw error;
		} finally {
			options.signal?.removeEventListener('abort', abortFromCaller);
			if (this._rebuildCancellation === cancellation) {
				this._rebuildCancellation = null;
			}
		}
	}

	/**
	 * Call this method to prepare the installed runtime program for a nonblocking first frame. Preparation rejects when the handle is disposed or runtime compilation fails; it is not cancellable once started.
	 *
	 * @param {ShaderRuntimePassRenderer} renderer - Supplies the runtime renderer.
	 * @returns {Promise<void>} - Resolve when the runtime program is ready.
	 */
	async prepare(renderer) {
		this._assertUsable();
		await this._buildResult.runtime?.prepare?.(renderer);
	}

	/**
	 * Call this method to return runtime shader diagnostics. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @returns {unknown} - Runtime or deferred diagnostics.
	 */
	getDiagnostics() {
		this._assertUsable();

		if (this._buildResult.runtime) {
			return {
				status: 'installed',
				modelVersion: this._buildResult.modelVersion,
				runtime: this._buildResult.runtime.getDiagnostics(),
			};
		}

		return {
			status: 'deferred',
			modelVersion: this._buildResult.modelVersion,
		};
	}

	/**
	 * Call this method to dispose resources owned by this handle.
	 *
	 * @returns {void} -
	 */
	dispose() {
		if (this._disposed) {
			return;
		}

		this._disposed = true;
		this._generation += 1;
		this._rebuildCancellation?.abort();
		this._rebuildCancellation = null;
		const buildResult = this._buildResult;
		this._buildResult = null;
		try {
			this._disposeBuildResult(buildResult);
		} finally {
			this._facade._forgetShaderHandle(this);
		}
	}
}
