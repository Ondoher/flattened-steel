import { Algorithm32Runtime } from './Algorithm32Runtime.js';

/** Own supported-mode preparation, atomic publication, and rollback. */
export class ModeController {
	/**
	 * @param {Readonly<Flat32ModeControllerConfiguration>} configuration -
	 * Supplies application-owned collaborators.
	 */
	constructor(configuration) {
		this._createMode = configuration.createMode;
		this._createRuntime = configuration.createRuntime
			?? this._createAlgorithm32Runtime.bind(this);
		this._endpointScene = configuration.endpointScene;
		this._onPreparing = configuration.onPreparing;
		this._onReverted = configuration.onReverted;
		this._onFailure = configuration.onFailure;
		this._onPublished = configuration.onPublished;
		this._sceneRuntime = configuration.sceneRuntime;
		/** @type {Algorithm32Runtime | null} */
		this._activeRuntime = null;
		this._generation = 0;
		/** @type {AbortController | null} */
		this._preparationCancellation = null;
		/** @type {'spherical-distant' | 'flat-local' | null} */
		this._currentKind = null;
		/** @type {'spherical-distant' | 'flat-local' | null} */
		this._sceneKind = null;
		this._activeMode = null;
		this._disposed = false;
	}

	/**
	 * Create the ordinary production runtime candidate.
	 *
	 * @param {Flat32AlgorithmRuntimeConfiguration} configuration - Supplies
	 * isolated candidate resources.
	 * @returns {Algorithm32Runtime} Return the candidate runtime.
	 */
	_createAlgorithm32Runtime(configuration) {
		return new Algorithm32Runtime(configuration);
	}

	/**
	 * Dispose preparation resources not yet owned by a runtime candidate.
	 *
	 * @param {Flat32Mode | null} mode - Supplies the prepared mode.
	 * @param {ReturnType<import('./ThreeSceneRuntime.js').ThreeSceneRuntime['createAtmosphereComposer']> | null} composer -
	 * Supplies isolated composer resources.
	 * @returns {void}
	 */
	_disposeUnownedCandidate(mode, composer) {
		mode?.dispose();
		composer?.composer.dispose();
		composer?.renderTarget.dispose();
	}

	/** Restore the last published scene and render operation after failure. */
	_restorePublishedState(sceneChanged) {
		if (sceneChanged
			&& this._currentKind !== null
			&& this._activeMode !== null) {
			this._onReverted?.(this._currentKind, this._activeMode);
			this._sceneKind = this._currentKind;
		}
		if (this._activeRuntime !== null) {
			this._activeRuntime.publish();
		} else {
			this._sceneRuntime.restoreDirectRendering();
		}
	}

	/** Prepare then publish one supported mode without disrupting the active one. */
	async switchTo(kind, state) {
		if (this._disposed) throw new Error('Flat32 mode controller is disposed.');
		const generation = ++this._generation;
		this._preparationCancellation?.abort();
		const preparationCancellation = new AbortController();
		this._preparationCancellation = preparationCancellation;
		/** @type {Flat32Mode | null} */
		let mode = null;
		/** @type {ReturnType<import('./ThreeSceneRuntime.js').ThreeSceneRuntime['createAtmosphereComposer']> | null} */
		let composer = null;
		/** @type {Algorithm32Runtime | null} */
		let candidate = null;
		let sceneChanged = false;

		try {
			mode = await this._createMode(kind, state, {signal: preparationCancellation.signal});
			if (this._disposed || generation !== this._generation) {
				mode.dispose();
				return null;
			}
			sceneChanged = kind !== this._sceneKind;
			if (sceneChanged) {
				this._onPreparing?.(kind, mode);
				this._sceneKind = kind;
			}
			composer = this._sceneRuntime.createAtmosphereComposer();
			candidate = this._createRuntime({
				sceneRuntime: this._sceneRuntime,
				endpointScene: this._endpointScene,
				mode,
				onFailure: this._onFailure,
				composer: composer.composer,
				composerRenderTarget: composer.renderTarget,
				deferPublication: true,
			});
			const summary = await candidate.setup();
			if (this._disposed || generation !== this._generation) {
				candidate.dispose({ restoreRendering: false });
				return null;
			}
			candidate.publish();
			this._onPublished?.(kind, mode, state);
			const replaced = this._activeRuntime;

			this._activeRuntime = candidate;
			this._currentKind = kind;
			this._activeMode = mode;
			replaced?.dispose({ restoreRendering: false });
			return summary;
		} catch (error) {
			if (candidate !== null) {
				candidate.dispose({ restoreRendering: false });
			} else {
				this._disposeUnownedCandidate(mode, composer);
			}
			if (!this._disposed && generation === this._generation) {
				this._restorePublishedState(sceneChanged);
			}
			if (!this._disposed && generation === this._generation) throw error;
			return null;
		} finally {
			if (this._preparationCancellation === preparationCancellation) {
				this._preparationCancellation = null;
			}
		}
	}

	get currentKind() { return this._currentKind; }

	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._generation += 1;
		this._preparationCancellation?.abort();
		this._preparationCancellation = null;
		this._activeRuntime?.dispose();
		this._activeRuntime = null;
		this._activeMode = null;
		this._currentKind = null;
		this._sceneKind = null;
	}
}
