import {Algorithm32Runtime} from './Algorithm32Runtime.js';
import {EndpointScene} from './EndpointScene.js';
import {Flat32View} from './Flat32View.js';
import {LocationTimeController} from './LocationTimeController.js';
import {FlatLocalMode} from './FlatLocalMode.js';
import {ModeController} from './ModeController.js';
import {PointerLookController} from './PointerLookController.js';
import {SphericalDistantMode} from './SphericalDistantMode.js';
import SharedDistantCacheAssets from './SharedDistantCacheAssets.js';
import {createDistantSunSceneState} from './DistantSunSceneState.js';
import {ThreeSceneRuntime} from './ThreeSceneRuntime.js';
import {resolveFlat32ProductionSelections} from './Flat32ProductionSelections.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '../algorithm32/profiles/native-15/native-15-profile.js';
import {
	FLAT32_DELAYED_SCENE_REFRESH_MILLISECONDS,
	ATMOSPHERE_OBSERVER_HEIGHT,
	ATMOSPHERE_OBSERVER_UP_DIRECTION,
	ATMOSPHERE_SCENE_SCALE,
	ATMOSPHERE_SOURCE_ANGULAR_RADIUS,
} from './consts.js';

export class Flat32Application {
	/**
	 * Creates the application owner in the supplied root with explicit configuration.
	 *
	 * @param {HTMLElement} root - Hosts the application.
	 * @param {Flat32ApplicationConfiguration} [configuration] - Supplies explicit diagnostic overrides. Omission
	 * retains the ordinary production application configuration.
	 */
	constructor(root, configuration = {}) {
		const productionSelections = resolveFlat32ProductionSelections(configuration);
		this._view = new Flat32View(root);
		this._cameraFieldOfViewDegrees = configuration.cameraFieldOfViewDegrees ?? null;
		this._initialFlatTimeIndex = configuration.initialFlatTimeIndex ?? 0;
		this._initialModeKind = configuration.initialModeKind ?? 'spherical-distant';
		if (
			configuration.localSunCachePolicy !== undefined &&
			configuration.localSunCachePolicy !== 'compact-v9-native15'
		)
			throw new RangeError('Unsupported Flat32 local cache policy.');
		this._localSunCachePolicy = configuration.localSunCachePolicy;
		this._maximumScatteringOrder =
			configuration.maximumScatteringOrder ??
			DEFAULT_NATIVE_PRODUCTION_PROFILE.numerical.cacheConstruction.maximumScatteringOrder;
		this._reviewObjectsEnabled = configuration.reviewObjectsEnabled !== false;
		this._productionSelections = productionSelections;
		this._brightest2000StellarCatalogDefinition = configuration.brightest2000StellarCatalogDefinition;
		this._scotopicLuminanceWeights = configuration.scotopicLuminanceWeights;
		this._cameraDirectionScene = configuration.cameraDirectionScene ?? null;
		this._performanceCallback = configuration.performanceCallback;
		this._atmosphereShaderEnabled = configuration.atmosphereShaderEnabled !== false;
		this._resolveDistantSunSceneCacheAsset =
			configuration.resolveDistantSunSceneCacheAsset ??
			((solarZenithDegrees) => ({status: 'unsupported', requestedSolarZenithDegrees: solarZenithDegrees}));
		/** @type {ThreeSceneRuntime | null} */
		this._sceneRuntime = null;
		/** @type {EndpointScene | null} */
		this._endpointScene = null;
		/** @type {ModeController | null} */
		this._modeController = null;
		/** @type {PointerLookController | null} */
		this._pointerLookController = null;
		/** @type {Flat32SceneSummary | null} */
		this._sceneSummary = null;
		/** @type {Flat32ApplicationState | null} */
		this._state = null;
		/** @type {Flat32ApplicationState | null} */
		this._publishedState = null;
		this._started = false;
		/** @type {number | null} */
		this._locationTimeRefreshTimer = null;
		this._locationTimeController = new LocationTimeController();
		this._disposed = false;
		this._sharedCacheAssets = new SharedDistantCacheAssets();
		this._handleRuntimeFailure = this._handleRuntimeFailure.bind(this);
		this._handleAtmosphereFailure = this._handleAtmosphereFailure.bind(this);
		this._handleBeforeUnload = this._handleBeforeUnload.bind(this);
		this._handlePointerLookChange = this._handlePointerLookChange.bind(this);
	}

	/** Render every control from the one authoritative application state. */
	_renderControls() {
		if (this._state !== null) {
			this._view.showApplicationState(
				this._localSunCachePolicy && this._publishedState ? this._publishedState : this._state,
			);
		}
	}

	/** Cancel a pending delayed scene update. */
	_cancelLocationTimeRefresh() {
		if (this._locationTimeRefreshTimer !== null) {
			window.clearTimeout(this._locationTimeRefreshTimer);
			this._locationTimeRefreshTimer = null;
		}
	}

	/** Replace application state, render controls, then update the scene. */
	_commitState(state, delayedSceneUpdate) {
		this._state = state;
		this._renderControls();
		if (!this._started || this._disposed) return;

		if (delayedSceneUpdate) {
			this._scheduleLocationTimeRefresh();
			return;
		}

		this._cancelLocationTimeRefresh();
		void this._setupAtmosphere(state);
	}

	/** Merge a legacy location/time transition into application state. */
	_commitLocationTimeState(locationTimeState) {
		const modeKind = this._state?.modeKind ?? 'spherical-distant';

		this._commitState(
			{
				...locationTimeState,
				modeKind,
			},
			true,
		);
	}

	/** Apply a pure location/time transition to current application state. */
	_transitionLocationTime(transition) {
		if (this._state === null) return;
		this._commitLocationTimeState(transition(this._state));
	}

	/** Coalesce legacy source-control changes before replacing the runtime. */
	_scheduleLocationTimeRefresh() {
		if (!this._started || this._disposed) return;
		this._cancelLocationTimeRefresh();
		this._locationTimeRefreshTimer = window.setTimeout(() => {
			this._locationTimeRefreshTimer = null;
			const state = this._state;

			if (this._disposed || state === null) return;
			void this._setupAtmosphere(state);
		}, FLAT32_DELAYED_SCENE_REFRESH_MILLISECONDS);
	}

	/**
	 * Normalize a caught setup failure for presentation.
	 *
	 * @param {unknown} error - Supplies the caught value.
	 * @returns {string} Return a readable message.
	 */
	_errorMessage(error) {
		return error instanceof Error ? error.message : String(error);
	}

	/**
	 * Present a renderer failure.
	 *
	 * @param {string} message - Describes the failure.
	 * @returns {void}
	 */
	_handleRuntimeFailure(message) {
		if (!this._disposed) {
			this._view.showFailure(message);
		}
	}

	/**
	 * Preserve the direct scene after a post-install atmosphere failure.
	 *
	 * @param {string} message - Describes the atmosphere failure.
	 * @returns {void}
	 */
	_handleAtmosphereFailure(message) {
		if (!this._disposed && this._sceneSummary !== null) {
			this._view.showAtmosphereFailure(this._sceneSummary, message);
		}
	}

	/**
	 * Release resources during page teardown.
	 *
	 * @returns {void}
	 */
	_handleBeforeUnload() {
		this.dispose();
	}

	/**
	 * Present mouse-look lock state supplied by the interaction owner.
	 *
	 * @param {boolean} locked - Reports whether the pointer is locked.
	 * @returns {void}
	 */
	_handlePointerLookChange(locked) {
		if (!this._disposed) {
			this._view.showPointerLookState(locked);
		}
	}

	/**
	 * Create the live spherical/distant scene state before cache resolution.
	 *
	 * @returns {Flat32DistantSunSceneState<SphericalDistantMode['geometry']>} Return geometry and the scalar resolver input.
	 */
	_createSphericalDistantSceneState(state) {
		return createDistantSunSceneState({
			observation: state.observation,
			observerHeight: ATMOSPHERE_OBSERVER_HEIGHT,
			observerUpDirection: ATMOSPHERE_OBSERVER_UP_DIRECTION,
		});
	}

	/**
	 * Create one mode from a resolved live state and optional exact package.
	 *
	 * @param {Flat32DistantSunSceneState<SphericalDistantMode['geometry']>} sceneState - Live geometry and source placement.
	 * @param {DistantSunSceneCacheAssetSelection | undefined} sceneCacheAsset - Optional exact non-dark package.
	 * @param {Flat32DistantSunCacheState} [distantSunCacheState] - Selected scattering-cache state.
	 * @returns {SphericalDistantMode} The configured mode.
	 */
	_createSphericalDistantMode(sceneState, sceneCacheAsset, distantSunCacheState = 'ready', sharedCache = undefined) {
		return new SphericalDistantMode({
			sceneState,
			sceneScale: ATMOSPHERE_SCENE_SCALE,
			sourceAngularRadius: ATMOSPHERE_SOURCE_ANGULAR_RADIUS,
			maximumScatteringOrder: this._maximumScatteringOrder,
			sceneCacheAsset,
			sharedCache,
			distantSunCacheState,
			...this._productionSelections,
			brightest2000StellarCatalogDefinition: this._brightest2000StellarCatalogDefinition,
			scotopicLuminanceWeights: this._scotopicLuminanceWeights,
		});
	}

	/** Resolve one exact offline package before constructing the runtime mode. */
	async _prepareSphericalDistantMode(state, request) {
		const sceneState = this._createSphericalDistantSceneState(state);
		if (this._sceneSummary !== null) {
			this._view.showDistantSunCacheState(this._sceneSummary, 'resolving', sceneState.solarZenithDegrees);
		}
		const resolution = await this._resolveDistantSunSceneCacheAsset(sceneState.solarZenithDegrees, request);
		if (request.signal.aborted) {
			let error = new Error('Distant-Sun cache resolution was cancelled or superseded.');
			error.name = 'AbortError';
			throw error;
		}
		if ('cacheFormat' in resolution && resolution.cacheFormat === 'algorithm32-distant-sun-shared-block-v1') {
			const sharedCache = await this._sharedCacheAssets.select(
				resolution.asset,
				resolution.status === 'dark' ? null : resolution.representativeSolarZenithDegrees,
				request.signal,
				this._sceneRuntime.renderer.getContext(),
			);
			return this._createSphericalDistantMode(sceneState, undefined, resolution.status, sharedCache);
		}
		throw new RangeError('The production distant-Sun runtime requires a qualified shared package.');
	}

	/** Create the fixed selected production flat/local mode. */
	_createFlatLocalMode(state) {
		return new FlatLocalMode({
			localSunCachePolicy: this._localSunCachePolicy,
			sceneScale: ATMOSPHERE_SCENE_SCALE,
			observation: state.observation,
			maximumScatteringOrder: this._maximumScatteringOrder,
			...this._productionSelections,
			// The retained rectangular control has no stellar source. The explicit
			// compact candidate keeps the selected shared stellar filters.
			presentationFilters: this._localSunCachePolicy ? this._productionSelections.presentationFilters : [],
			brightest2000StellarCatalogDefinition: this._brightest2000StellarCatalogDefinition,
			scotopicLuminanceWeights: this._scotopicLuminanceWeights,
		});
	}

	/**
	 * Build and publish the atmosphere without blocking the direct scene.
	 *
	 * @returns {Promise<void>} Resolve after setup reaches a terminal state.
	 */
	async _setupAtmosphere(state) {
		if (this._modeController === null || this._sceneSummary === null) return;
		this._view.showAtmosphereSetup(this._sceneSummary, state);
		try {
			const atmosphereSummary = await this._modeController.switchTo(state.modeKind, state);
			if (atmosphereSummary !== null && !this._disposed) {
				this._publishedState = state;
				this._renderControls();
				const solarZenithDegrees =
					state.modeKind === 'spherical-distant'
						? this._createSphericalDistantSceneState(state).solarZenithDegrees
						: undefined;
				this._view.showAtmosphereReady(this._sceneSummary, atmosphereSummary, solarZenithDegrees);
			}
		} catch (error) {
			if (!this._disposed && this._sceneSummary !== null) {
				if (this._state === state && this._publishedState !== null) {
					this._state = this._publishedState;
					this._renderControls();
				}
				this._view.showAtmosphereFailure(
					this._sceneSummary,
					this._errorMessage(error),
					this._publishedState !== null,
				);
			}
		}
	}

	/** Switch to the other supported production geometry/source pairing. */
	_switchMode() {
		if (this._state === null) return;
		const nextKind = this._state.modeKind === 'flat-local' ? 'spherical-distant' : 'flat-local';

		this._commitState(
			{
				...this._state,
				modeKind: nextKind,
			},
			false,
		);
	}

	/** Toggle only final Algorithm32 composition, retaining the lit Three scene. */
	_toggleAtmosphereShader() {
		this._atmosphereShaderEnabled = !this._atmosphereShaderEnabled;
		this._modeController?.setAtmosphereEnabled(this._atmosphereShaderEnabled);
		this._view.showAtmosphereShaderState(this._atmosphereShaderEnabled);
	}

	/**
	 * Call this method to build the direct scene, then attach Algorithm32 asynchronously.
	 *
	 * @returns {void}
	 */
	start() {
		if (this._disposed) {
			throw new Error('Cannot start a disposed Flat32 application.');
		}
		if (this._started) {
			return;
		}

		this._view.start();
		this._view.showProductionSelections(this._productionSelections);
		this._view.installLocationTimeControls(
			() => this._transitionLocationTime((state) => this._locationTimeController.nextLocation(state)),
			(index) => this._transitionLocationTime((state) => this._locationTimeController.selectTime(state, index)),
			() => this._transitionLocationTime((state) => this._locationTimeController.toggleTimeBasis(state)),
			(index) =>
				this._transitionLocationTime((state) => this._locationTimeController.selectGlobeTime(state, index)),
			(deltaHours) =>
				this._transitionLocationTime((state) =>
					this._locationTimeController.adjustGlobeHourOffset(state, deltaHours),
				),
			(deltaMinutes) =>
				this._transitionLocationTime((state) =>
					this._locationTimeController.adjustGlobeMinuteOffset(state, deltaMinutes),
				),
		);
		this._view.installModeControl(() => this._switchMode());
		this._view.installAtmosphereControl(() => this._toggleAtmosphereShader());
		this._view.showAtmosphereShaderState(this._atmosphereShaderEnabled);
		const initialLocationTimeState = this._locationTimeController.start();
		this._state = {
			...this._locationTimeController.selectTime(initialLocationTimeState, this._initialFlatTimeIndex),
			modeKind: this._initialModeKind,
		};
		this._renderControls();
		try {
			this._sceneRuntime = new ThreeSceneRuntime(this._view.canvas, this._handleRuntimeFailure, {
				sceneColorPrecision: this._productionSelections.sceneColorPrecision,
			});
			if (this._cameraDirectionScene !== null) {
				const camera = this._sceneRuntime.camera;
				camera.lookAt(
					camera.position.x + this._cameraDirectionScene[0],
					camera.position.y + this._cameraDirectionScene[1],
					camera.position.z + this._cameraDirectionScene[2],
				);
				camera.updateMatrixWorld(true);
			}
			this._endpointScene = new EndpointScene(this._sceneRuntime.scene, {
				reviewObjectsEnabled: this._reviewObjectsEnabled,
			});
			if (this._cameraFieldOfViewDegrees !== null) {
				this._sceneRuntime.camera.fov = this._cameraFieldOfViewDegrees;
				this._sceneRuntime.camera.updateProjectionMatrix();
			}
			this._endpointScene.install();
			const initialSceneMode =
				this._state.modeKind === 'spherical-distant'
					? this._createSphericalDistantMode(this._createSphericalDistantSceneState(this._state), undefined)
					: this._createFlatLocalMode(this._state);

			this._endpointScene.applyMode(this._state.modeKind, initialSceneMode.geometry);
			initialSceneMode.dispose();
			this._modeController = new ModeController({
				atmosphereEnabled: this._atmosphereShaderEnabled,
				sceneRuntime: this._sceneRuntime,
				endpointScene: this._endpointScene,
				onPreparing: (kind, mode) => {
					this._endpointScene?.applyMode(kind, mode.geometry);
					this._sceneSummary = this._endpointScene?.describe() ?? null;
				},
				onReverted: (kind, mode) => {
					this._endpointScene?.applyMode(kind, mode.geometry);
					if (kind === 'spherical-distant') {
						const distantMode = /** @type {SphericalDistantMode} */ (mode);
						this._endpointScene?.updateDistantSunLighting(
							distantMode.geometry.configuration.directionToSource,
							distantMode.algorithm32.receiverLight,
							distantMode.algorithm32.config.config.color,
						);
					} else if (!(mode instanceof FlatLocalMode) || !mode.compactProfile) {
						const localMode = /** @type {FlatLocalMode} */ (mode);
						this._endpointScene?.updateLocalSunLighting(
							localMode.geometry.mapModelPositionToObserverLocalScenePoint(
								localMode.geometry.configuration.sourcePosition,
								{sceneScale: localMode.sceneScale},
							),
						);
					}
					this._sceneSummary = this._endpointScene?.describe() ?? null;
				},
				onFailure: this._handleAtmosphereFailure,
				createMode: (kind, state, request) =>
					kind === 'spherical-distant'
						? this._prepareSphericalDistantMode(state, request)
						: this._createFlatLocalMode(state),
				createRuntime: (runtimeConfiguration) =>
					new Algorithm32Runtime({
						...runtimeConfiguration,
						performanceCallback: this._performanceCallback,
					}),
				onPublished: (kind, mode, state) => {
					if (kind === 'spherical-distant') {
						const distantMode = /** @type {SphericalDistantMode} */ (mode);
						this._endpointScene?.updateDistantSunLighting(
							distantMode.geometry.configuration.directionToSource,
							distantMode.algorithm32.receiverLight,
							distantMode.algorithm32.config.config.color,
						);
					} else if (!(mode instanceof FlatLocalMode) || !mode.compactProfile) {
						const localMode = /** @type {FlatLocalMode} */ (mode);
						this._endpointScene?.updateLocalSunLighting(
							localMode.geometry.mapModelPositionToObserverLocalScenePoint(
								localMode.geometry.configuration.sourcePosition,
								{sceneScale: localMode.sceneScale},
							),
						);
					}
					this._sceneRuntime?.refreshShadowMaps();
					this._sceneSummary = this._endpointScene?.describe() ?? null;
				},
			});
			this._sceneRuntime.start();
			this._pointerLookController = new PointerLookController(
				this._view.canvas,
				this._sceneRuntime.camera,
				this._handlePointerLookChange,
			);
			this._pointerLookController.start();
			const sceneSummary = this._endpointScene.describe();

			if (!sceneSummary.shadowMapsInstalled) {
				throw new Error('Flat32 did not allocate all six 4096-pixel shadow maps.');
			}
			this._sceneSummary = sceneSummary;
			window.addEventListener('beforeunload', this._handleBeforeUnload);
			this._started = true;
			void this._setupAtmosphere(this._state);
		} catch (error) {
			this._modeController?.dispose();
			this._modeController = null;
			this._pointerLookController?.dispose();
			this._pointerLookController = null;
			this._endpointScene?.dispose();
			this._endpointScene = null;
			this._sceneRuntime?.dispose();
			this._sceneRuntime = null;
			this._sceneSummary = null;
			this._view.showFailure(this._errorMessage(error));
		}
	}

	/**
	 * Call this method to release the scene in reverse ownership order.
	 *
	 * @returns {void}
	 */
	dispose() {
		if (this._disposed) {
			return;
		}

		this._disposed = true;
		this._cancelLocationTimeRefresh();
		window.removeEventListener('beforeunload', this._handleBeforeUnload);
		this._modeController?.dispose();
		this._modeController = null;
		this._sharedCacheAssets.dispose();
		this._pointerLookController?.dispose();
		this._pointerLookController = null;
		this._endpointScene?.dispose();
		this._endpointScene = null;
		this._sceneRuntime?.dispose();
		this._sceneRuntime = null;
		this._sceneSummary = null;
		this._state = null;
		this._publishedState = null;
		this._view.dispose();
	}
}
