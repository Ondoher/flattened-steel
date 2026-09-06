import {
	Algorithm32,
	BrunetonColorDisplayModel,
	CanonicalAtmosphere,
	DistantSunLightSource,
	SphericalEarthGeometry,
} from '../algorithm32/implementation/index.js';
import {
	CUBED_SPHERE_W27_DIRECTION_COUNT,
	NATIVE_48_POSITION_DOMAIN_OWNER,
	NATIVE_48_POSITION_COUNT,
	REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
} from '../algorithm32/sampling-domains/index.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '../algorithm32/profiles/native-15/native-15-profile.js';

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
	 *   observation: GeometryObservation,
	 *   observerHeight: Distance,
	 *   observerUpDirection: UnitVector3,
	 *   sceneScale: SceneScale,
	 *   sourceAngularRadius: Angle,
	 *   maximumScatteringOrder: SupportedCacheScatteringOrder
	 * }>} configuration - Supplies the Flat32 application selections that are
	 * owned by its constants module.
	 */
	constructor(configuration) {
		const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
		const spectralBasis = profile.spectral.basis;
		const atmosphere = new CanonicalAtmosphere();
		const geometry = new SphericalEarthGeometry({
			bottomRadius: profile.physical.geometry.bottomRadius,
			topRadius: profile.physical.geometry.topRadius,
			observerHeight: configuration.observerHeight,
			observerUpDirection: configuration.observerUpDirection,
			sceneFrame: {
				kind: 'observer-local',
			},
			cacheAltitudeBinCount: NATIVE_48_POSITION_DOMAIN_OWNER.count,
			cacheBoundaryAltitude: NATIVE_48_POSITION_DOMAIN_OWNER.nodes[0].coordinate,
			sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
		});
		const lightSource = new DistantSunLightSource({
			angularRadius: configuration.sourceAngularRadius,
		});
		const celestialSources = /** @type {SphericalSunStarsSourceRoster} */ ({
			id: 'flat32-spherical-distant-sun',
			family: 'spherical-sun-stars-radial-v1',
			sun: lightSource,
			stars: null,
		});

		this._profile = profile;
		this._geometry = geometry;
		this._lightSource = lightSource;
		this._sceneScale = configuration.sceneScale;
		this._maximumScatteringOrder = configuration.maximumScatteringOrder;
		this._spectralChannelCount = spectralBasis.channelCount;
		this._algorithm32 = new Algorithm32({
			lightSource,
			atmosphere,
			geometry,
			groundBoundary: null,
			celestialSources,
			color: new BrunetonColorDisplayModel(),
			observation: configuration.observation,
			execution: {
				pathIntervalCount: profile.numerical.viewPath.intervalCount,
				maximumScatteringOrder: configuration.maximumScatteringOrder,
			},
		});
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
