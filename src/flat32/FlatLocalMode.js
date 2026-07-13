import {
	Algorithm32,
	CanonicalAtmosphere,
	FlatEarthGeometry,
	LocalSunLightSource,
} from '../algorithm32/implementation/index.js';
import {
	CUBED_SPHERE_W27_DIRECTION_COUNT,
	REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
} from '../algorithm32/sampling-domains/index.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '../algorithm32/profiles/native-15/native-15-profile.js';
import DistanceMath from '../algorithm32/math/DistanceMath.js';
import {createFlat32ColorDisplayModel} from './Flat32ColorDisplayModel.js';
import {
	ATMOSPHERE_OBSERVER_HEIGHT,
	FLAT_ATMOSPHERE_TOP_ALTITUDE,
	FLAT_OBSERVER_DOME_MAX_VIEW_RAY_EXTENT,
} from './consts.js';

/** Own Flat32's accepted production flat-geometry/local-Sun configuration. */
export class FlatLocalMode {
	/**
	 * @param {Readonly<{
	 *   sceneScale: SceneScale,
	 *   observation: GeometryObservation,
	 *   maximumScatteringOrder: SupportedCacheScatteringOrder,
	 *   colorDisplayModelConfiguration?: object
	 * }>} configuration - Supplies application-owned runtime selections.
	 */
	constructor(configuration) {
		const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
		const spectralBasis = profile.spectral.basis;
		const observerPosition = /** @type {Position} */ ({
			coordinates: [0, 0, DistanceMath.toMeters(ATMOSPHERE_OBSERVER_HEIGHT)],
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
			color: createFlat32ColorDisplayModel(configuration.colorDisplayModelConfiguration),
			observation: configuration.observation,
			celestialSources:
				configuration.colorDisplayModelConfiguration?.model === 'bruneton-control'
					? null
					: celestialSources,
			execution: {
				pathIntervalCount: profile.numerical.viewPath.intervalCount,
				maximumScatteringOrder: configuration.maximumScatteringOrder,
			},
		});
		this._disposed = false;
	}

	_assertUsable() {
		if (this._disposed) throw new Error('Flat32 flat/local mode is disposed.');
	}

	get algorithm32() {
		this._assertUsable();
		return this._algorithm32;
	}
	get geometry() {
		this._assertUsable();
		return this._geometry;
	}
	get sceneScale() {
		this._assertUsable();
		return this._sceneScale;
	}

	/** Describe the selected production flat/local realization. */
	describe() {
		this._assertUsable();
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

	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._algorithm32.dispose();
	}
}
