import {Algorithm32Runtime} from './Algorithm32Runtime.js';
import {EndpointScene} from './EndpointScene.js';
import {StagedSceneRuntime} from './StagedSceneRuntime.js';
import {Flat32View} from './Flat32View.js';
import {LocationTimeController} from './LocationTimeController.js';
import {FlatLocalMode} from './FlatLocalMode.js';
import {ModeController} from './ModeController.js';
import {PointerLookController} from './PointerLookController.js';
import {SphericalDistantMode} from './SphericalDistantMode.js';
import SharedDistantCacheAssets from './SharedDistantCacheAssets.js';
import {Flat32SceneControls} from './Flat32SceneControls.js';
import DistanceMath from '../algorithm32/math/DistanceMath.js';
import {createDistantSunSceneState} from './DistantSunSceneState.js';
import {ThreeSceneRuntime} from './ThreeSceneRuntime.js';
import {resolveFlat32ProductionSelections} from './Flat32ProductionSelections.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '../algorithm32/profiles/native-15/native-15-profile.js';
import {
	FLAT32_DELAYED_SCENE_REFRESH_MILLISECONDS,
	ATMOSPHERE_OBSERVER_UP_DIRECTION,
	ATMOSPHERE_SCENE_SCALE,
	ATMOSPHERE_SOURCE_ANGULAR_RADIUS,
} from './consts.js';

export class Flat32Application {
	/**
	 * Creates the application owner in the supplied root with explicit configuration.
	 * Unsupported cache policies or presentation selections throw before a usable application is returned.
	 * The caller must correct its configuration before creating a replacement application.
	 * Omitted order retains distant N4; an explicitly selected compact local cache defaults independently to N1.
	 *
	 * @param {HTMLElement} root - Hosts the application.
	 * @param {Flat32ApplicationConfiguration} [configuration] - Supplies explicit diagnostic overrides. Omission
	 * retains the ordinary production application configuration.
	 */
	constructor(root, configuration = {}) {
		const productionSelections = resolveFlat32ProductionSelections(configuration);
		this._view = new Flat32View(root);
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
		this._localMaximumScatteringOrder =
			configuration.maximumScatteringOrder ?? (this._localSunCachePolicy ? 1 : this._maximumScatteringOrder);
		this._reviewObjectsEnabled = configuration.reviewObjectsEnabled !== false;
		this._productionSelections = productionSelections;
		this._brightest2000StellarCatalogDefinition = configuration.brightest2000StellarCatalogDefinition;
		this._scotopicLuminanceWeights = configuration.scotopicLuminanceWeights;
		this._cameraDirectionScene = configuration.cameraDirectionScene ?? null;
		this._performanceCallback = configuration.performanceCallback;
		this._initialSceneControls = Flat32SceneControls.resolve(configuration);
		if (
			this._initialModeKind === 'flat-local' &&
			!this._localSunCachePolicy &&
			this._initialSceneControls.skyRenderMode === 'no-atmosphere'
		)
			throw new RangeError('No atmosphere is unavailable for the legacy flat mode (no stellar source).');
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
		/** Latest physical request; independent presentation changes do not supersede it. */ this._sceneRequestVersion = 0;
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
			if (this._endpointScene) {
				this._sceneSummary = this._endpointScene.describe();
				this._view.showSceneSummary(this._sceneSummary);
			}
			const visible = this._publishedState
				? {
						...this._publishedState,
						skyRenderMode: this._state.skyRenderMode,
						reviewObjectsEnabled: this._state.reviewObjectsEnabled,
						sunIlluminationScale: this._state.sunIlluminationScale,
						sunDiscBrightnessScale: this._state.sunDiscBrightnessScale,
						cameraFieldOfViewDegrees: this._state.cameraFieldOfViewDegrees,
					}
				: this._state;
			this._view.showApplicationState(visible);
			this._view.showSceneControls(
				visible,
				visible.modeKind !== 'flat-local' || Boolean(this._localSunCachePolicy),
				this._publishedState && this._state.observerHeight?.value !== this._publishedState.observerHeight?.value
					? this._state.observerHeight
					: null,
				!this._localSunCachePolicy &&
					visible.modeKind === 'spherical-distant' &&
					visible.skyRenderMode === 'no-atmosphere',
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

	/** Replace application state, render controls, then update the scene.
	 *
	 * @param {Flat32ApplicationState} state - Complete desired controls and observation.
	 * @param {boolean} delayedSceneUpdate - Coalesce source changes before preparation when true.
	 */
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

	/** Merge a location/time transition while preserving the selected mode.
	 *
	 * @param {Flat32LocationTimeState} locationTimeState - Selected observation and control labels.
	 */
	_commitLocationTimeState(locationTimeState) {
		const modeKind = this._state?.modeKind ?? 'spherical-distant';

		this._commitState(
			{
				...this._state,
				...locationTimeState,
				modeKind,
			},
			true,
		);
	}

	/** Apply a pure location/time transition to current application state.
	 *
	 * @param {(state: Flat32ApplicationState) => Flat32LocationTimeState} transition - Existing location/time operation.
	 */
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
	 * Invalid observation or geometry input throws; the mode controller rejects that candidate and
	 * retains the last complete frame. The caller must correct the observation before retrying.
	 *
	 * @param {Flat32ApplicationState} state - Exact current observer and observation.
	 * @returns {Flat32DistantSunSceneState<SphericalDistantMode['geometry']>} Return geometry and the scalar resolver input.
	 */
	_createSphericalDistantSceneState(state) {
		return createDistantSunSceneState({
			observation: state.observation,
			observerHeight: state.observerHeight ?? this._initialSceneControls.observerHeight,
			observerUpDirection: ATMOSPHERE_OBSERVER_UP_DIRECTION,
		});
	}

	/**
	 * Create one mode from a resolved live state and optional exact package.
	 * Incompatible shared-cache order, physical inputs or missing authenticated stellar data throw.
	 * The caller must correct the selection; candidate failure retains the last published mode.
	 *
	 * @param {Flat32DistantSunSceneState<SphericalDistantMode['geometry']>} sceneState - Live geometry and source placement.
	 * @param {DistantSunSceneCacheAssetSelection | undefined} sceneCacheAsset - Optional exact non-dark package.
	 * @param {Flat32DistantSunCacheState} [distantSunCacheState] - Selected scattering-cache state.
	 * @param {DistantSunSharedCacheSelection} [sharedCache] - Borrowed qualified distant cache, when resolved.
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

	/** Resolve one exact offline package before constructing the runtime mode.
	 * Cancellation or unsupported packages reject; the mode controller preserves the last published frame.
	 *
	 * @param {Flat32ApplicationState} state - Exact selected observation.
	 * @param {Parameters<Flat32ModeControllerConfiguration['createMode']>[2]} request - Cancellation signal for this candidate.
	 * @returns {Promise<SphericalDistantMode>} - Resolved mode borrowing the selected shared package.
	 */
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

	/** Create the selected flat/local mode with its independent default order.
	 * Invalid physical or stellar inputs throw; the caller retains the last published frame.
	 * Correct unsupported inputs or load the required authenticated catalog before retrying.
	 *
	 * @param {Flat32ApplicationState} state - Exact selected local observation.
	 * @returns {FlatLocalMode} - Candidate compact N1 mode, or the explicitly retained rectangular control.
	 */
	_createFlatLocalMode(state) {
		return new FlatLocalMode({
			observerHeight: state.observerHeight ?? this._initialSceneControls.observerHeight,
			localSunCachePolicy: this._localSunCachePolicy,
			sceneScale: ATMOSPHERE_SCENE_SCALE,
			observation: state.observation,
			maximumScatteringOrder: this._localMaximumScatteringOrder,
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
	 * @param {Flat32ApplicationState} state - Complete desired observation and mode.
	 * @returns {Promise<void>} Resolve after setup reaches a terminal state.
	 */
	async _setupAtmosphere(state) {
		if (this._modeController === null || this._sceneSummary === null) return;
		const requestVersion = ++this._sceneRequestVersion;
		this._view.showAtmosphereSetup(this._sceneSummary, state);
		try {
			const atmosphereSummary = await this._modeController.switchTo(state.modeKind, state);
			if (atmosphereSummary !== null && !this._disposed) {
				this._publishedState = {
					...state,
					skyRenderMode: this._state?.skyRenderMode ?? state.skyRenderMode,
					sunIlluminationScale: this._state?.sunIlluminationScale ?? state.sunIlluminationScale,
					sunDiscBrightnessScale: this._state?.sunDiscBrightnessScale ?? state.sunDiscBrightnessScale,
					reviewObjectsEnabled: this._state?.reviewObjectsEnabled ?? state.reviewObjectsEnabled,
					cameraFieldOfViewDegrees: this._state?.cameraFieldOfViewDegrees ?? state.cameraFieldOfViewDegrees,
				};
				this._renderControls();
				const solarZenithDegrees =
					state.modeKind === 'spherical-distant'
						? this._createSphericalDistantSceneState(state).solarZenithDegrees
						: undefined;
				this._view.showAtmosphereReady(this._sceneSummary, atmosphereSummary, solarZenithDegrees);
				this._renderControls();
			}
		} catch (error) {
			if (requestVersion !== this._sceneRequestVersion) return;
			if (!this._disposed && this._sceneSummary !== null) {
				if (this._publishedState !== null) {
					this._state = {
						...this._publishedState,
						skyRenderMode: this._state.skyRenderMode,
						reviewObjectsEnabled: this._state.reviewObjectsEnabled,
						sunIlluminationScale: this._state.sunIlluminationScale,
						sunDiscBrightnessScale: this._state.sunDiscBrightnessScale,
						cameraFieldOfViewDegrees: this._state.cameraFieldOfViewDegrees,
					};
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
		if (
			!this._localSunCachePolicy &&
			this._state.modeKind === 'spherical-distant' &&
			this._state.skyRenderMode === 'no-atmosphere'
		)
			return;
		const nextKind = this._state.modeKind === 'flat-local' ? 'spherical-distant' : 'flat-local';

		this._commitState(
			{
				...this._state,
				modeKind: nextKind,
			},
			false,
		);
	}

	/** Call this method to select sky composition without replacing physical caches.
	 * Invalid or unsupported legacy selections throw before mutation; select an available mode.
	 * @param {Flat32SkyRenderMode} mode - Explicit Full, No atmosphere or Shader off selection.
	 * @returns {void} - Current and pending frames retain the accepted selection.
	 */
	setSkyRenderMode(mode) {
		if (typeof mode !== 'string') throw new TypeError('Flat32 sky render mode must be explicit.');
		if (!this._state) return;
		const skyRenderMode = Flat32SceneControls.resolve({skyRenderMode: mode}).skyRenderMode;
		if (skyRenderMode === 'no-atmosphere' && this._state.modeKind === 'flat-local' && !this._localSunCachePolicy)
			throw new RangeError('No atmosphere requires the compact local stellar source.');
		this._modeController?.setSkyRenderMode(skyRenderMode);
		this._state = {...this._state, skyRenderMode};
		if (this._publishedState) this._publishedState = {...this._publishedState, skyRenderMode};
		this._renderControls();
	}

	/** Call this method to select illustrative Sun illumination and disc radiance without changing physical caches.
	 * An unstarted application throws; start it first. Invalid scales throw before mutation;
	 * supply finite 0-1 fractions. Runtime publication failures propagate for host reporting.
	 * @param {Flat32SunPresentationConfiguration} selection - Independent No-atmosphere Sun choices; omission of a field restores one.
	 * @returns {void} - Current and pending publication retain these selections.
	 */
	setSunPresentation(selection) {
		if (!this._state || this._disposed) throw new Error('Sun presentation requires a live started application.');
		const accepted = Flat32SceneControls.resolveSunPresentation(selection);
		this._modeController?.setSunPresentation(accepted);
		this._state = {...this._state, ...accepted};
		if (this._publishedState) this._publishedState = {...this._publishedState, ...accepted};
		this._renderControls();
	}

	/** Call this method to show or hide review boxes while retaining ground and lights.
	 * Invalid booleans throw; use true or false. Renderer failures propagate for reporting.
	 * @param {boolean} visible - Whether review boxes cast shadows and participate in scene depth.
	 * @returns {void} - Active and pending presentation retain the selection.
	 */
	setObjectsVisible(visible) {
		if (typeof visible !== 'boolean') throw new TypeError('Object visibility must be boolean.');
		if (!this._state) return;
		this._endpointScene?.setObjectsVisible(visible);
		this._sceneSummary = this._endpointScene?.describe() ?? this._sceneSummary;
		this._sceneRuntime?.refreshShadowMaps();
		this._state = {...this._state, reviewObjectsEnabled: visible};
		if (this._publishedState) this._publishedState = {...this._publishedState, reviewObjectsEnabled: visible};
		this._renderControls();
	}

	/** Call this method to prepare a complete scene at a supported physical height.
	 * Unsupported heights throw before preparation; choose 5, 100, 500 or 2000 metres.
	 * @param {Distance} height - Actual height above the model surface.
	 * @returns {void} - Accepted labels remain until the requested frame publishes.
	 */
	setObserverHeight(height) {
		if (!this._state) return;
		if (this._state.modeKind === 'flat-local' && !this._localSunCachePolicy)
			throw new RangeError('Live elevation requires the compact local runtime.');
		const observerHeight = Flat32SceneControls.resolve({observerHeight: height}).observerHeight;
		this._commitState({...this._state, observerHeight}, false);
	}

	/** Change perspective framing on the retained camera without rebuilding the scene or scattering cache.
	 * @param {number} degrees - Requested vertical field of view in degrees.
	 * @returns {void} - Projection and current/published selections updated synchronously.
	 * @throws {RangeError} - An invalid perspective angle leaves state and projection unchanged.
	 * @throws {Error} - Start the application before selecting its live framing.
	 */
	setFieldOfView(degrees) {
		const cameraFieldOfViewDegrees = Flat32SceneControls.resolveFieldOfView(degrees);
		if (!this._state || !this._sceneRuntime || this._disposed)
			throw new Error('Field of view requires a live application camera.');
		const camera = this._sceneRuntime.camera;
		camera.fov = cameraFieldOfViewDegrees;
		camera.updateProjectionMatrix();
		this._state = {...this._state, cameraFieldOfViewDegrees};
		if (this._publishedState) this._publishedState = {...this._publishedState, cameraFieldOfViewDegrees};
		this._renderControls();
		this._sceneRuntime.requestRender();
	}

	/** Called by geometry preparation and rollback to place the camera at the geometry-owned height.
	 * The adapters map scene Y above ground, so the observer offset is applied exactly once.
	 * @param {Flat32Mode} mode - Candidate or last accepted physical mode.
	 * @returns {void} - Position updated without changing yaw, pitch or endpoint anchoring.
	 */
	_applyObserverHeight(mode) {
		if (!this._sceneRuntime) return;
		this._sceneRuntime.camera.position.y = DistanceMath.toMeters(mode.observerHeight) / mode.sceneScale.value;
		this._sceneRuntime.camera.updateMatrixWorld(true);
	}

	/**
	 * Call this method to build the direct scene, then attach Algorithm32 asynchronously.
	 * Calling after disposal throws; create a new application instead. Synchronous failures before
	 * renderer setup propagate to the caller. Renderer/scene initialization failures are caught,
	 * release owned candidates and display a failure, including missing required shadow maps.
	 * Inspect that failure and dispose the failed instance before creating a corrected replacement.
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
			(index) =>
				this._transitionLocationTime((state) => this._locationTimeController.selectLocation(state, index)),
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
		this._view.installSceneControls({
			onSky: (mode) => this.setSkyRenderMode(mode),
			onSun: (selection) => this.setSunPresentation(selection),
			onObjects: () => this.setObjectsVisible(this._state?.reviewObjectsEnabled === false),
			onElevation: (height) => this.setObserverHeight(height),
			onFieldOfView: (degrees) => this.setFieldOfView(degrees),
		});
		const initialLocationTimeState = this._locationTimeController.start();
		this._state = {
			...this._initialSceneControls,
			...this._locationTimeController.selectTime(initialLocationTimeState, this._initialFlatTimeIndex),
			modeKind: this._initialModeKind,
			reviewObjectsEnabled: this._reviewObjectsEnabled,
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
			this._sceneRuntime.camera.fov = this._state.cameraFieldOfViewDegrees;
			this._sceneRuntime.camera.updateProjectionMatrix();
			this._endpointScene.install();
			const initialSceneMode =
				this._state.modeKind === 'spherical-distant'
					? this._createSphericalDistantMode(this._createSphericalDistantSceneState(this._state), undefined)
					: this._createFlatLocalMode(this._state);

			this._applyObserverHeight(initialSceneMode);
			this._endpointScene.applyMode(this._state.modeKind, initialSceneMode.geometry);
			initialSceneMode.dispose();
			this._modeController = new ModeController({
				skyRenderMode: this._state.skyRenderMode,
				sunIlluminationScale: this._state.sunIlluminationScale,
				sunDiscBrightnessScale: this._state.sunDiscBrightnessScale,
				sceneRuntime: this._sceneRuntime,
				/** Create isolated visual resources; the displayed camera/endpoints remain unchanged.
				 * @param {Flat32Mode} mode - Candidate physical mode.
				 * @returns {Flat32SceneStage} - Reversible scene publication and owned resources.
				 */
				createSceneStage: (mode) =>
					new StagedSceneRuntime(this._sceneRuntime, mode, () => this._state?.reviewObjectsEnabled !== false),
				onFailure: this._handleAtmosphereFailure,
				/** Construct the requested candidate; synchronous errors and resolver rejection propagate to rollback.
				 * @param {Flat32ModeKind} kind - Requested geometry/source pairing.
				 * @param {Flat32ApplicationState} state - Exact candidate observation.
				 * @param {Parameters<Flat32ModeControllerConfiguration['createMode']>[2]} request - Candidate cancellation signal.
				 * @returns {Flat32Mode|Promise<Flat32Mode>} - Candidate owned by the mode controller.
				 */
				createMode: (kind, state, request) =>
					kind === 'spherical-distant'
						? this._prepareSphericalDistantMode(state, request)
						: this._createFlatLocalMode(state),
				/** Create an unpublished runtime; setup failures retain the prior published runtime.
				 * @param {Flat32AlgorithmRuntimeConfiguration} runtimeConfiguration - Candidate scene and mode resources.
				 * @returns {Algorithm32Runtime} - Runtime owned by the mode controller.
				 */
				createRuntime: (runtimeConfiguration) =>
					new Algorithm32Runtime({
						...runtimeConfiguration,
						performanceCallback: this._performanceCallback,
					}),
				/** Apply lighting and control labels for the complete accepted frame.
				 * @param {Flat32ModeKind} kind - Published geometry/source pairing.
				 * @param {Flat32Mode} mode - Accepted mode supplying geometry and lighting.
				 * @param {Flat32ApplicationState} state - Accepted exact observation.
				 * @param {Flat32SceneStage} stage - Accepted camera and endpoint resources.
				 */
				onPublished: (kind, mode, state, stage) => {
					const previous = this._endpointScene;
					this._endpointScene = /** @type {EndpointScene} */ (stage.endpointScene);
					this._endpointScene.setObjectsVisible(this._state?.reviewObjectsEnabled !== false);
					this._pointerLookController?.setCamera(this._sceneRuntime.camera);
					if (this._publishedState === null && previous !== this._endpointScene) previous?.dispose();
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
				() => this._sceneRuntime?.requestRender(),
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
