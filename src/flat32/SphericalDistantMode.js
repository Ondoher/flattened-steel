import {Algorithm32} from '../algorithm32/implementation/algorithm32/Algorithm32.js';
import {CanonicalAtmosphere} from '../algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {DistantSunLightSource} from '../algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import {SphericalEarthGeometry} from '../algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {StellarPointSetSource} from '../algorithm32/implementation/star-field/StellarPointSetSource.js';
import {ViewPresentationFilterRegistry} from '../algorithm32/implementation/presentation-filter/ViewPresentationFilterRegistry.js';
import {
	CUBED_SPHERE_W27_DIRECTION_COUNT,
	NATIVE_48_POSITION_COUNT,
	REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
} from '../algorithm32/sampling-domains/index.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '../algorithm32/profiles/native-15/native-15-profile.js';
import {createFlat32ColorDisplayModel} from './Flat32ColorDisplayModel.js';
import {createDistantSunSceneState} from './DistantSunSceneState.js';
import {
	FLAT32_STELLAR_CATALOG_IDS,
	requireImplementedFlat32ProductionSelections,
	resolveFlat32ProductionSelections,
} from './Flat32ProductionSelections.js';

/**
 * Own the fixed spherical-geometry/distant-Sun Algorithm32 application mode.
 *
 * @implements {Flat32Mode}
 * The selected native production profile retains Native48 positions,
 * reflection-completed Fibonacci-68 incoming directions, W27 outgoing directions, and all native
 * 15 spectral channels. Omitted ground selects the canonical-black boundary.
 */
export class SphericalDistantMode {
	/**
	 * @param {Flat32SphericalDistantModeConfiguration<SphericalEarthGeometry>} configuration - Supplies the Flat32 application selections that are
	 * owned by its constants module.
	 */
	constructor(configuration) {
		if (configuration.sharedCache && configuration.maximumScatteringOrder !== 4)
			throw new RangeError('Shared distant-Sun packages require the qualified N4 scattering configuration.');
		const selections = resolveFlat32ProductionSelections(configuration);
		const presentationFilterRegistry = new ViewPresentationFilterRegistry(selections.presentationFilters, {
			scotopicLuminanceWeights: configuration.scotopicLuminanceWeights,
		});
		requireImplementedFlat32ProductionSelections(selections, {
			stellarCatalogUsed: true,
			presentationFilterRegistry,
		});
		const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
		const spectralBasis = profile.spectral.basis;
		const atmosphere = new CanonicalAtmosphere();
		const geometry = configuration.sceneState.geometry;
		const lightSource = new DistantSunLightSource({
			angularRadius: configuration.sourceAngularRadius,
			sceneCacheAsset: configuration.sceneCacheAsset,
			sharedCache: configuration.sharedCache,
			darkScattering: configuration.distantSunCacheState === 'dark' && !configuration.sharedCache,
		});
		const catalogDefinition =
			selections.stellarCatalog === FLAT32_STELLAR_CATALOG_IDS.BRIGHTEST_2000
				? configuration.brightest2000StellarCatalogDefinition
				: undefined;
		if (selections.stellarCatalog === FLAT32_STELLAR_CATALOG_IDS.BRIGHTEST_2000 && !catalogDefinition) {
			throw new RangeError('Flat32 brightest-2000 requires its authenticated local production package.');
		}
		const stars = new StellarPointSetSource({catalogDefinition});
		const celestialSources = /** @type {SphericalSunStarsSourceRoster} */ ({
			id: 'flat32-spherical-distant-sun',
			family: 'spherical-sun-stars-radial-v1',
			sun: lightSource,
			stars,
		});

		this._profile = profile;
		this._geometry = geometry;
		this._lightSource = lightSource;
		this._sceneScale = configuration.sceneScale;
		this._maximumScatteringOrder = configuration.maximumScatteringOrder;
		this._spectralChannelCount = spectralBasis.channelCount;
		this._distantSunCacheState = configuration.distantSunCacheState ?? 'ready';
		this._algorithm32 = new Algorithm32({
			lightSource,
			atmosphere,
			geometry,
			groundBoundary: null,
			celestialSources: selections.celestialSourcesEnabled ? celestialSources : null,
			color: createFlat32ColorDisplayModel(selections.colorDisplayModelConfiguration, presentationFilterRegistry),
			presentationFilterRegistry,
			observation: configuration.sceneState.observation,
			sourcePlacement: {
				kind: /** @type {const} */ ('distant-direction'),
				directionToLight: configuration.sceneState.directionToSourceModel,
			},
			execution: {
				pathIntervalCount: 30,
				pathSampleDistribution: {kind: 'quadratic-near-observer-v1'},
				maximumScatteringOrder: configuration.maximumScatteringOrder,
			},
		});
		if (selections.colorDisplayModelConfiguration.model === 'ferwerda-control') {
			this._algorithm32.setAdaptingLuminance({
				value: selections.colorDisplayModelConfiguration.adaptationLuminanceCdPerSquareMeter,
				units: 'cd m^-2',
			});
		}
		this._disposed = false;
		this._liveSceneState = configuration.sceneState;
	}

	/** Call this method to prepare an independent physical scene snapshot for shared-cache playback.
	 * @param {GeometryObservation} observation - Requested time and location.
	 * @returns {Flat32PreparedDistantScene} - Independent geometry/source and an assignment-only mode publication.
	 */
	prepareLiveScene(observation) {
		this._assertUsable();
		const sceneState = createDistantSunSceneState({
			observation,
			observerHeight: this._geometry.configuration.observerHeight,
			observerUpDirection: this._geometry.configuration.observerUpDirection,
		});
		const source = new DistantSunLightSource({
			angularRadius: this._lightSource.configuration.angularRadius,
			sourceIrradiance: this._lightSource.configuration.sourceIrradiance,
		});
		sceneState.geometry.configureLightSource({
			lightSource: source,
			observation,
			placement: {kind: 'distant-direction', directionToLight: sceneState.directionToSourceModel},
		});
		const publishSource = this._lightSource.prepareSharedDirection(
			sceneState.directionToSourceModel,
			sceneState.solarZenithDegrees >= 108 ? null : Math.floor(sceneState.solarZenithDegrees + 0.5),
		);
		const publishGeometry = this._geometry.prepareSharedPublication(sceneState.geometry, this._lightSource);
		return {
			sceneState,
			source,
			publish: () => {
				publishSource();
				publishGeometry();
				this._liveSceneState = sceneState;
				this._distantSunCacheState = sceneState.solarZenithDegrees >= 108 ? 'dark' : 'ready';
			},
		};
	}

	/**
	 * Require this owner to remain live.
	 *
	 * @returns {void}
	 */
	_assertUsable() {
		if (this._disposed) {
			throw new Error('Flat32 spherical/distant mode is disposed.');
		}
	}

	/**
	 * Return the configured production facade.
	 *
	 * @returns {Algorithm32} The live Algorithm32 facade.
	 */
	get algorithm32() {
		this._assertUsable();

		return this._algorithm32;
	}

	/** Call this method after context loss to rebuild from the last published observation.
	 * @returns {void}
	 */
	prepareContextRestoration() {
		if (!this._lightSource.configuration.sharedCache) return;
		const configuration = /** @type {LegacyConfig} */ (this._algorithm32.config.config);
		const restored = createDistantSunSceneState({
			observation: this._liveSceneState.observation,
			observerHeight: this._geometry.configuration.observerHeight,
			observerUpDirection: this._geometry.configuration.observerUpDirection,
		});
		this._algorithm32.setConfig({
			...configuration,
			geometry: restored.geometry,
			observation: this._liveSceneState.observation,
			sourcePlacement: {kind: 'distant-direction', directionToLight: this._liveSceneState.directionToSourceModel},
		});
		this._geometry = restored.geometry;
	}

	/**
	 * Return the geometry used to map live scene positions into model space.
	 *
	 * @returns {SphericalEarthGeometry} The live spherical geometry.
	 */
	get geometry() {
		this._assertUsable();

		return this._geometry;
	}

	/** Return the production distant-Sun owner used by this mode. */
	get lightSource() {
		this._assertUsable();

		return this._lightSource;
	}

	/**
	 * Return the native production profile selected by this mode.
	 *
	 * @returns {NativeProductionProfile} The selected profile.
	 */
	get profile() {
		this._assertUsable();

		return this._profile;
	}

	/**
	 * Return the physical scale of one Flat32 scene unit.
	 *
	 * @returns {SceneScale} The scene scale.
	 */
	get sceneScale() {
		this._assertUsable();

		return this._sceneScale;
	}

	/**
	 * Describe the exact executable domains selected by this fixed mode.
	 *
	 * @returns {SphericalDistantModeSummary} Return the mode facts.
	 */
	describe() {
		this._assertUsable();

		return {
			pairing: 'spherical/distant',
			distantSunCacheState: this._distantSunCacheState,
			maximumScatteringOrder: this._maximumScatteringOrder,
			positionCount: NATIVE_48_POSITION_COUNT,
			incomingDirectionCount: REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.directionCount,
			outgoingDirectionCount: CUBED_SPHERE_W27_DIRECTION_COUNT,
			spectralChannelCount: this._spectralChannelCount,
		};
	}

	/**
	 * Dispose the facade and every shader handle it owns.
	 *
	 * @returns {void}
	 */
	dispose() {
		if (this._disposed) {
			return;
		}

		this._disposed = true;
		this._algorithm32.dispose();
	}
}
