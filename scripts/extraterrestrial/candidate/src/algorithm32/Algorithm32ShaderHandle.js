/**
 * Control one installed Algorithm32 runtime shader integration.
 */
export class Algorithm32ShaderHandle {
	/**
	 * Create a shader handle.
	 *
	 * @param {Algorithm32ShaderHandleState} state - Supplies facade, setup, and
	 * build state.
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
	 * Dispose runtime resources owned by the current build result.
	 *
	 * @returns {void}
	 */
	_disposeBuildResult(buildResult = this._buildResult, preservedController = null, preservedCelestialController = null, preservedStellarPointSetController = null) {
		try {
			buildResult?.runtime?.dispose?.();
		} finally {
			if (buildResult?.cacheController
				&& buildResult.cacheController !== preservedController) {
				buildResult.cacheController.dispose();
			}
			if (buildResult?.celestialCacheController
				&& buildResult.celestialCacheController !== preservedCelestialController) {
				buildResult.celestialCacheController.dispose();
			}
			if (buildResult?.stellarPointSetCacheController
				&& buildResult.stellarPointSetCacheController !== preservedStellarPointSetController) {
				buildResult.stellarPointSetCacheController.dispose();
			}
		}
	}

	/**
	 * Assert that the handle is still usable.
	 *
	 * @returns {void}
	 */
	_assertUsable() {
		if (this._disposed) {
			throw new Error('Algorithm32 shader handle has been disposed.');
		}
	}

	/**
	 * Replace facade config and refresh runtime shader resources.
	 *
	 * @param {Config} config - Supplies the replacement facade config.
	 * @returns {Promise<ConfigSnapshot>} The accepted config snapshot.
	 */
	async setConfig(config) {
		this._assertUsable();
		this._generation += 1;
		const generation = this._generation;
		this._rebuildCancellation?.abort();
		const cancellation = new AbortController();
		this._rebuildCancellation = cancellation;
		const prepared = this._facade._prepareConfig(config);
		let nextBuildResult = null;
		let committed = false;

		try {
			nextBuildResult = await prepared.shaderBuilder.build(
				this._facade._createShaderBuildRequest(
					this._setup,
					prepared.snapshot,
					{
						previousBuildResult: this._buildResult,
						signal: cancellation.signal,
					},
				),
			);
			if (this._disposed
				|| cancellation.signal.aborted
				|| generation !== this._generation) {
				const error = new Error('Algorithm32 shader rebuild was superseded.');
				error.name = 'AbortError';
				throw error;
			}

			const snapshot = this._facade._commitPreparedConfig(prepared);
			committed = true;
			const previousBuildResult = this._buildResult;
			this._buildResult = nextBuildResult;
			this._disposeBuildResult(
				previousBuildResult,
				nextBuildResult.cacheController ?? null,
				nextBuildResult.celestialCacheController ?? null,
				nextBuildResult.stellarPointSetCacheController ?? null,
			);

			return snapshot;
		} catch (error) {
			if (!committed) {
				if (nextBuildResult) {
					this._disposeBuildResult(
						nextBuildResult,
						this._buildResult?.cacheController ?? null,
						this._buildResult?.celestialCacheController ?? null,
						this._buildResult?.stellarPointSetCacheController ?? null,
					);
				}
				this._facade._discardPreparedConfig(prepared);
			}
			throw error;
		} finally {
			if (this._rebuildCancellation === cancellation) {
				this._rebuildCancellation = null;
			}
		}
	}

	/**
	 * Prepare the installed runtime program for a nonblocking first frame.
	 *
	 * @param {unknown} renderer - Supplies the runtime renderer.
	 * @returns {Promise<void>} Resolve when the runtime program is ready.
	 */
	async prepare(renderer) {
		this._assertUsable();
		await this._buildResult.runtime?.prepare?.(renderer);
	}

	/**
	 * Return runtime shader diagnostics.
	 *
	 * @returns {unknown} Runtime or deferred diagnostics.
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

	/** Read the Color-owned sky meter for contained qualification only. */
	readSkyIlluminanceLux(renderer) {
		this._assertUsable();
		if (!this._buildResult.runtime?.readSkyIlluminanceLux) {
			throw new Error('Installed runtime does not expose a sky illuminance meter.');
		}
		return this._buildResult.runtime.readSkyIlluminanceLux(renderer);
	}

	/** Read Geometry's sampled sky diffuse irradiance in scene-linear RGB. */
	readSkyIrradianceLinearSrgb(renderer) {
		this._assertUsable();
		if (!this._buildResult.runtime?.readSkyIrradianceLinearSrgb) {
			throw new Error('Installed runtime does not expose sampled sky irradiance.');
		}
		return this._buildResult.runtime.readSkyIrradianceLinearSrgb(renderer);
	}

	/** Read per-ray atmospheric log-luminance diagnostics for contained qualification only. */
	readSkyIlluminanceSampleLogLuminance(renderer) {
		this._assertUsable();
		if (!this._buildResult.runtime?.readSkyIlluminanceSampleLogLuminance) {
			throw new Error('Installed runtime does not expose sky illuminance sample diagnostics.');
		}
		return this._buildResult.runtime.readSkyIlluminanceSampleLogLuminance(renderer);
	}

	/** Refresh the Color-owned live sky meter before an ordinary scene-light pass. */
	updateSkyIlluminance(renderer) {
		this._assertUsable();
		if (!this._buildResult.runtime?.updateSkyIlluminance) {
			throw new Error('Installed runtime does not expose a sky illuminance updater.');
		}
		return this._buildResult.runtime.updateSkyIlluminance(renderer);
	}

	/**
	 * Dispose resources owned by this handle.
	 *
	 * @returns {void}
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
