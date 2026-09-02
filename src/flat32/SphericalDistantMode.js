import {Algorithm32} from '../algorithm32/implementation/algorithm32/Algorithm32.js';
import {CanonicalAtmosphere} from '../algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {DistantSunLightSource} from '../algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import {SphericalEarthGeometry} from '../algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {StellarPointSetSource} from '../algorithm32/implementation/star-field/StellarPointSetSource.js';
import {
	CUBED_SPHERE_W27_DIRECTION_COUNT,
	NATIVE_48_POSITION_COUNT,
	REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
} from '../algorithm32/sampling-domains/index.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '../algorithm32/profiles/native-15/native-15-profile.js';
import {createFlat32ColorDisplayModel} from './Flat32ColorDisplayModel.js';
import {
	requireImplementedFlat32ProductionSelections,
	resolveFlat32ProductionSelections,
} from './Flat32ProductionSelections.js';

/**
 * Own the fixed spherical-geometry/distant-Sun Algorithm32 application mode.
 *
 * The selected native production profile retains Native48 positions,
 * reflection-completed Fibonacci-68 incoming directions, W27 outgoing directions, and all native
 * 15 spectral channels. Omitted ground selects the canonical-black boundary.
 */
export class SphericalDistantMode {
	/**
	 * @param {Readonly<{
	 *   sceneState: Flat32DistantSunSceneState,
	 *   sceneScale: SceneScale,
	 *   sourceAngularRadius: Angle,
	 *   maximumScatteringOrder: SupportedCacheScatteringOrder,
	 *   sceneCacheAsset?: DistantSunSceneCacheAssetSelection,
	 *   distantSunCacheState?: 'ready' | 'dark',
	 *   celestialSourcesEnabled?: boolean,
	 *   colorDisplayModelConfiguration?: Flat32ColorDisplayModelConfiguration,
	 *   stellarCatalog?: Flat32StellarCatalogId,
	 *   presentationFilters?: readonly Flat32PresentationFilterConfiguration[]
	 * }>} configuration - Supplies the Flat32 application selections that are
	 * owned by its constants module.
	 */
	constructor(configuration) {
		const selections = resolveFlat32ProductionSelections(configuration);
		requireImplementedFlat32ProductionSelections(selections, {stellarCatalogUsed: true});
		const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
		const spectralBasis = profile.spectral.basis;
		const atmosphere = new CanonicalAtmosphere();
		const geometry = configuration.sceneState.geometry;
		const lightSource = new DistantSunLightSource({
			angularRadius: configuration.sourceAngularRadius,
			sceneCacheAsset: configuration.sceneCacheAsset,
			darkScattering: configuration.distantSunCacheState === 'dark',
		});
		const stars = new StellarPointSetSource();
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
			color: createFlat32ColorDisplayModel(selections.colorDisplayModelConfiguration),
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
