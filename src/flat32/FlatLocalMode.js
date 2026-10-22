import {
	Algorithm32,
	CanonicalAtmosphere,
	FlatEarthGeometry,
	LocalSunLightSource,
	LocalSunCompactProfileSelection,
	StellarPointSetSource,
} from '../algorithm32/implementation/index.js';
import {
	CUBED_SPHERE_W27_DIRECTION_COUNT,
	REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
} from '../algorithm32/sampling-domains/index.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '../algorithm32/profiles/native-15/native-15-profile.js';
import DistanceMath from '../algorithm32/math/DistanceMath.js';
import {createFlat32ColorDisplayModel} from './Flat32ColorDisplayModel.js';
import {ViewPresentationFilterRegistry} from '../algorithm32/implementation/presentation-filter/ViewPresentationFilterRegistry.js';
import {Flat32SceneControls} from './Flat32SceneControls.js';
import {
	requireImplementedFlat32ProductionSelections,
	resolveFlat32ProductionSelections,
} from './Flat32ProductionSelections.js';
import {FLAT_ATMOSPHERE_TOP_ALTITUDE, FLAT_OBSERVER_DOME_MAX_VIEW_RAY_EXTENT} from './consts.js';

/** Production flat-geometry/local-source atmosphere mode.
 *
 * @implements {Flat32Mode}
 */
export class FlatLocalMode {
	/**
	 * Creates one production flat/local mode with the caller's runtime selections.
	 *
	 * @param {Flat32LocalModeConfiguration} configuration - Application-owned runtime selections.
	 */
	constructor(configuration) {
		const observerHeight = Flat32SceneControls.resolve(configuration).observerHeight;
		/** Explicit compact successor; omission retains the production control.
		 *
		 * @type {LocalSunCompactConstructionProfile|null}
		 */
		this._compactProfile = null;
		this._configuration = configuration;
		const selections = resolveFlat32ProductionSelections(configuration);
		if (configuration.localSunCachePolicy === 'compact-v9-native15') {
			this._framePresentationRegistry = new ViewPresentationFilterRegistry(selections.presentationFilters, {
				scotopicLuminanceWeights: configuration.scotopicLuminanceWeights,
			});
			requireImplementedFlat32ProductionSelections(selections, {
				stellarCatalogUsed: true,
				supportsStellarFilters: true,
				presentationFilterRegistry: this._framePresentationRegistry,
			});
			if (selections.stellarCatalog === 'brightest-2000' && !configuration.brightest2000StellarCatalogDefinition)
				throw new RangeError('Compact flat stars require the authenticated brightest-2000 package.');
			this._frameStars = selections.celestialSourcesEnabled
				? new StellarPointSetSource({
						catalogDefinition:
							selections.stellarCatalog === 'brightest-2000'
								? configuration.brightest2000StellarCatalogDefinition
								: undefined,
					})
				: null;
			this._compactProfile = new LocalSunCompactProfileSelection().create({
				observation: configuration.observation,
				observerPosition: {
					coordinates: [0, 0, DistanceMath.toMeters(observerHeight)],
					units: 'meters',
				},
				viewRayLimit: FLAT_OBSERVER_DOME_MAX_VIEW_RAY_EXTENT,
				maximumScatteringOrder: configuration.maximumScatteringOrder,
			});
			this._geometry = /** @type {FlatEarthGeometry} */ (this._compactProfile.models.geometry);
			this._sceneScale = configuration.sceneScale;
			this._maximumScatteringOrder = configuration.maximumScatteringOrder;
			this._algorithm32 = new Algorithm32({
				profile: this._compactProfile.createExecutionProfile(),
				color: createFlat32ColorDisplayModel(selections.colorDisplayModelConfiguration),
			});
			this._disposed = false;
			return;
		}
		const presentationFilterRegistry = new ViewPresentationFilterRegistry(selections.presentationFilters);
		requireImplementedFlat32ProductionSelections(selections, {
			presentationFilterRegistry,
			supportsStellarFilters: false,
		});
		const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
		const spectralBasis = profile.spectral.basis;
		const observerPosition = /** @type {Position} */ ({
			coordinates: [0, 0, DistanceMath.toMeters(observerHeight)],
			units: 'meters',
		});
		const geometry = new FlatEarthGeometry({
			observerPosition,
			topAltitude: FLAT_ATMOSPHERE_TOP_ALTITUDE,
			localLightSourceHeight: {value: 3000 * 1609.344, units: 'meters'},
			projectionRadius: profile.physical.geometry.bottomRadius,
			sceneSkyRayLimit: FLAT_OBSERVER_DOME_MAX_VIEW_RAY_EXTENT,
			observerCenteredDome: {
				centerPolicy: 'observer-centered',
				apexAltitude: FLAT_ATMOSPHERE_TOP_ALTITUDE,
				maxObserverViewRayExtent: FLAT_OBSERVER_DOME_MAX_VIEW_RAY_EXTENT,
			},
		});
		const lightSource = new LocalSunLightSource({
			sourceKey: 'flat32-local-sun',
			referenceDistance: {value: 4800000, units: 'meters'},
			referenceSpectralIncidentScale: 1,
			radius: {value: 25749.504, units: 'meters'},
			distanceFalloff: true,
			sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
		});
		const celestialSources = /** @type {FlatLocalFiniteSunSourceRoster} */ ({
			id: 'flat32-local-finite-sun-v1',
			family: 'flat-local-finite-sun-v1',
			localSun: lightSource,
		});

		this._profile = profile;
		this._geometry = geometry;
		this._sceneScale = configuration.sceneScale;
		this._maximumScatteringOrder = configuration.maximumScatteringOrder;
		this._incomingDirectionCount = REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.directionCount;
		this._spectralChannelCount = spectralBasis.channelCount;
		this._algorithm32 = new Algorithm32({
			lightSource,
			atmosphere: new CanonicalAtmosphere(),
			geometry,
			groundBoundary: null,
			color: createFlat32ColorDisplayModel(selections.colorDisplayModelConfiguration, presentationFilterRegistry),
			presentationFilterRegistry,
			observation: configuration.observation,
			celestialSources: selections.celestialSourcesEnabled ? celestialSources : null,
			execution: {
				pathIntervalCount: profile.numerical.viewPath.intervalCount,
				maximumScatteringOrder: configuration.maximumScatteringOrder,
			},
		});
		this._disposed = false;
	}

	/** Called by this mode's accessors to reject use after disposal.
	 *
	 * @returns {void} - Live mode ownership checked.
	 */
	_assertUsable() {
		if (this._disposed) throw new Error('Flat32 flat/local mode is disposed.');
	}

	/** Configured production facade owned by this mode.
	 *
	 * @returns {Algorithm32Facade} - Live configured facade.
	 */
	get algorithm32() {
		this._assertUsable();
		return this._algorithm32;
	}
	/** Physical flat geometry owned by this mode.
	 *
	 * @returns {FlatEarthGeometry} - Live configured flat geometry.
	 */
	get geometry() {
		this._assertUsable();
		return this._geometry;
	}

	/** Physical observer height above the flat surface.
	 * @returns {Distance} - Geometry-owned height.
	 */
	get observerHeight() {
		return DistanceMath.inMeters(this._geometry.configuration.observerPosition.coordinates[2]);
	}
	/** Physical length represented by one scene unit.
	 *
	 * @returns {SceneScale} - Configured scene scale.
	 */
	get sceneScale() {
		this._assertUsable();
		return this._sceneScale;
	}

	/** Explicit compact selection, otherwise the unchanged rectangular control.
	 *
	 * @returns {LocalSunCompactConstructionProfile|null} - Current live physical selection.
	 */
	get compactProfile() {
		this._assertUsable();
		return this._compactProfile;
	}
	/** Call this method to create an exact ordinary-observation candidate without changing displayed state.
	 *
	 * @param {GeometryObservation} observation - Requested time and location.
	 * @param {UnitValue<'bytes'>} otherOwnedGpuBytes - Complete declared scene/frame overlap.
	 * @param {Flat32LocalFrameViewRequest} view - Current symmetric ordinary camera cone.
	 * @param {Distance} [observerHeight] - Requested receiver elevation; omission retains the accepted height.
	 * @returns {LocalSunFrameRequest} - Complete accepted request, or explicit unsupported coverage.
	 */
	createLocalFrameRequest(observation, otherOwnedGpuBytes, view, observerHeight = this.observerHeight) {
		this._assertUsable();
		if (!this._compactProfile) throw new Error('Compact local selection required.');
		const profile = this._compactProfile.createLiveProfile({
			observation,
			receiverPosition: {
				coordinates: [
					this._geometry.configuration.observerPosition.coordinates[0],
					this._geometry.configuration.observerPosition.coordinates[1],
					DistanceMath.toMeters(observerHeight),
				],
				units: 'meters',
			},
		});
		const geometry = /** @type {FlatEarthGeometry} */ (profile.models.geometry);
		const ray = geometry.resolveCompactViewSupport({
			origin: geometry.mapObserverLocalScenePointToModelPosition(view.cameraPosition, {
				sceneScale: this._sceneScale,
			}),
			forward: geometry.mapObserverLocalSceneDirectionToModelDirection(view.cameraDirection),
			halfAngle: view.halfAngle,
			coverageRadius: profile.domains.topology.coverageRadius,
		});
		return {
			profile,
			viewRays: [ray],
			presentationIdentity: JSON.stringify(resolveFlat32ProductionSelections(this._configuration)),
			otherOwnedGpuBytes,
		};
	}
	/** Call this method to accept the committed live geometry only after successful complete frame publication.
	 *
	 * @param {PreparedLocalSunFrame} frame - Newly committed controller frame.
	 * @returns {void} - Assignment-only live geometry update.
	 */
	acceptPublishedLocalFrame(frame) {
		this._compactProfile = frame.profile;
		this._geometry = /** @type {FlatEarthGeometry} */ (frame.profile.models.geometry);
	}
	/** Call this method to provide selected presentation and celestial collaborators to ordinary staging.
	 *
	 * @param {Flat32LocalFrameSceneCapability} sceneRuntime - Borrowed renderer and scene.
	 * @param {Flat32EndpointLighting} endpointScene - Borrowed endpoint lighting owner.
	 * @param {Distance} sceneDepthMax - Unit-bearing geometry depth cap.
	 * @returns {Flat32LocalFramePreparerConfiguration} - Explicit complete staging inputs.
	 */
	createLocalFramePreparerConfiguration(sceneRuntime, endpointScene, sceneDepthMax) {
		const selections = resolveFlat32ProductionSelections(this._configuration);
		return {
			sceneRuntime,
			endpointScene,
			sceneDepthMax,
			sceneScale: this._sceneScale,
			presentationFilterRegistry: this._framePresentationRegistry,
			createColorModel: () =>
				createFlat32ColorDisplayModel(
					selections.colorDisplayModelConfiguration,
					this._framePresentationRegistry,
				),
			createCelestialSources: (profile) =>
				selections.celestialSourcesEnabled
					? {
							id: 'flat32-compact-sun-stars-v1',
							family: 'flat-local-finite-sun-v1',
							localSun: /** @type {LocalSunLightSource} */ (profile.models.lightSource),
							stars: this._frameStars,
						}
					: null,
		};
	}

	/** Call this method to describe the selected production flat/local realization.
	 *
	 * @returns {Flat32ModeSummary} - Selected physical domains and pairing.
	 */
	describe() {
		this._assertUsable();
		if (this._compactProfile)
			return {
				pairing: 'flat/local',
				maximumScatteringOrder: this._maximumScatteringOrder,
				positionCount: this._compactProfile.domains.topology.positionCount,
				incomingDirectionCount: this._compactProfile.domains.incomingDirections.directionCount,
				outgoingDirectionCount: CUBED_SPHERE_W27_DIRECTION_COUNT,
				spectralChannelCount: this._compactProfile.spectral.basis.channelCount,
				observerDomeEnabled: true,
			};
		return {
			pairing: 'flat/local',
			maximumScatteringOrder: this._maximumScatteringOrder,
			positionCount: this._geometry.createLocalSunCachePositionDomain().count,
			incomingDirectionCount: this._incomingDirectionCount,
			outgoingDirectionCount: CUBED_SPHERE_W27_DIRECTION_COUNT,
			spectralChannelCount: this._spectralChannelCount,
			observerDomeEnabled: this._geometry.configuration.observerCenteredDome !== null,
		};
	}

	/** Call this method to release the mode's facade and shader resources once.
	 *
	 * @returns {void} - Owned resources released.
	 */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._algorithm32.dispose();
	}
}
