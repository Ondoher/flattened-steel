import {Algorithm32Runtime} from './Algorithm32Runtime.js';
import {Flat32SceneControls} from './Flat32SceneControls.js';

/** Own supported-mode preparation, atomic publication, and rollback. */
export class ModeController {
	/**
	 * Creates the supported-mode coordinator borrowing application collaborators.
	 *
	 * @param {Readonly<Flat32ModeControllerConfiguration>} configuration -
	 * Supplies application-owned collaborators.
	 */
	constructor(configuration) {
		this._createMode = configuration.createMode;
		this._createRuntime = configuration.createRuntime ?? this._createAlgorithm32Runtime.bind(this);
		this._endpointScene = configuration.endpointScene;
		this._onPreparing = configuration.onPreparing;
		this._onReverted = configuration.onReverted;
		this._onFailure = configuration.onFailure;
		this._onPublished = configuration.onPublished;
		this._sceneRuntime = configuration.sceneRuntime;
		this._skyRenderMode = Flat32SceneControls.resolve({
			skyRenderMode: configuration.skyRenderMode,
			atmosphereShaderEnabled: configuration.atmosphereEnabled,
		}).skyRenderMode;
		this._sceneObserverHeight = null;
		this._currentObserverHeight = null;
		/** @type {Flat32AlgorithmRuntimeCapability | null} */
		this._activeRuntime = null;
		this._generation = 0;
		/** @type {AbortController | null} */
		this._preparationCancellation = null;
		/** @type {Flat32ModeKind|null} */
		this._currentKind = null;
		/** @type {Flat32ModeKind|null} */
		this._sceneKind = null;
		this._activeMode = null;
		this._activeConfigurationIdentity = '';
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
	 * @param {Flat32AtmosphereComposerResources | null} composer -
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
		if (sceneChanged && this._currentKind !== null && this._activeMode !== null) {
			this._onReverted?.(this._currentKind, this._activeMode);
			this._sceneKind = this._currentKind;
			this._sceneObserverHeight = this._currentObserverHeight;
		}
		if (this._activeRuntime !== null) {
			this._activeRuntime.publish();
		} else {
			this._sceneRuntime.restoreDirectRendering();
		}
	}

	/**
	 * Call this method to prepare then publish one supported mode without disrupting the active one.
	 * Preparation failures reject and retain the last complete published state. A superseded request returns null.
	 * Premeasured environment input requires an already installed shared spherical mode.
	 *
	 * @param {Flat32ModeKind} kind - Supported mode identity.
	 * @param {Flat32ApplicationState} state - Complete selected observation and configuration.
	 * @param {Flat32ScenePublicationRequest} [request] - Optional measured environment input.
	 * @returns {Promise<Flat32AtmosphereSummary | null>} - Published summary, or null after supersession.
	 */
	async switchTo(kind, state, request = {}) {
		if (this._disposed) throw new Error('Flat32 mode controller is disposed.');
		const generation = ++this._generation;
		this._preparationCancellation?.abort();
		const preparationCancellation = new AbortController();
		this._preparationCancellation = preparationCancellation;
		/** @type {Flat32Mode | null} */
		let mode = null;
		/** @type {Flat32AtmosphereComposerResources | null} */
		let composer = null;
		/** @type {Flat32AlgorithmRuntimeCapability | null} */
		let candidate = null;
		let sceneChanged = false;
		const observerHeight = Flat32SceneControls.resolve(state).observerHeight.value;
		const configurationIdentity = JSON.stringify({
			...state,
			skyRenderMode: undefined,
			observation: undefined,
			locationIndex: undefined,
			flatTimeIndex: undefined,
			globeTimeIndex: undefined,
			globeHourOffset: undefined,
			locationLabel: undefined,
			timeLabel: undefined,
			timeBasis: undefined,
		});

		try {
			if (
				kind === this._currentKind &&
				configurationIdentity === this._activeConfigurationIdentity &&
				this._activeRuntime?.canUpdateSharedScene?.()
			) {
				const summary = await this._activeRuntime.updateSharedScene(state, {
					signal: preparationCancellation.signal,
					environmentSample: request.environmentSample,
				});
				if (this._disposed || generation !== this._generation) return null;
				this._onPublished?.(kind, this._activeMode, state);
				return summary;
			}
			if (request.environmentSample) {
				throw new Error('Measured environment publication requires an installed shared spherical mode.');
			}
			mode = await this._createMode(kind, state, {signal: preparationCancellation.signal});
			if (this._disposed || generation !== this._generation) {
				mode.dispose();
				return null;
			}
			sceneChanged = kind !== this._sceneKind || observerHeight !== this._sceneObserverHeight;
			if (sceneChanged) {
				this._onPreparing?.(kind, mode);
				this._sceneKind = kind;
				this._sceneObserverHeight = observerHeight;
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
				skyRenderMode: this._skyRenderMode,
			});
			const summary = await candidate.setup();
			if (this._disposed || generation !== this._generation) {
				candidate.dispose({restoreRendering: false});
				return null;
			}
			candidate.setSkyRenderMode(this._skyRenderMode);
			candidate.publish();
			this._onPublished?.(kind, mode, state);
			const replaced = this._activeRuntime;

			this._activeRuntime = candidate;
			this._currentKind = kind;
			this._currentObserverHeight = observerHeight;
			this._activeMode = mode;
			this._activeConfigurationIdentity = configurationIdentity;
			replaced?.dispose({restoreRendering: false});
			return summary;
		} catch (error) {
			if (candidate !== null) {
				candidate.dispose({restoreRendering: false});
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

	/** Last successfully published supported mode, or null before publication.
	 *
	 * @returns {Flat32ModeKind|null} - Published mode kind.
	 */
	get currentKind() {
		return this._currentKind;
	}

	/** Call this method to select atmosphere composition without rebuilding the physical field.
	 *
	 * @param {boolean} enabled - Whether Algorithm32 composition is selected.
	 * @returns {void} - Selection forwarded to the installed runtime.
	 */
	setAtmosphereEnabled(enabled) {
		if (typeof enabled !== 'boolean') throw new TypeError('Flat32 atmosphere enabled state must be boolean.');
		this.setSkyRenderMode(Flat32SceneControls.resolve({atmosphereShaderEnabled: enabled}).skyRenderMode);
	}

	/** Call this method to forward one canonical view mode without replacing the physical runtime.
	 * Unsupported modes throw before updating the selection; renderer failures propagate.
	 * @param {Flat32SkyRenderMode} mode - Selected sky composition.
	 * @returns {void} - Current and pending runtime publication use this selection.
	 */
	setSkyRenderMode(mode) {
		if (typeof mode !== 'string') throw new TypeError('Flat32 sky render mode must be explicit.');
		this._skyRenderMode = Flat32SceneControls.resolve({skyRenderMode: mode}).skyRenderMode;
		this._activeRuntime?.setSkyRenderMode(this._skyRenderMode);
	}

	/** Call this method to cancel pending preparation and release the installed runtime and mode.
	 *
	 * @returns {void} - Owned runtime and mode disposed idempotently.
	 */
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
