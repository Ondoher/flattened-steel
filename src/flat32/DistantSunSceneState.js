import {SphericalEarthGeometry} from '../algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '../algorithm32/profiles/native-15/native-15-profile.js';
import {NATIVE_48_POSITION_DOMAIN_OWNER} from '../algorithm32/sampling-domains/index.js';
import AngleMath from '../algorithm32/math/AngleMath.js';

/**
 * Create the one Flat32 owner for live spherical/distant placement and the
 * scalar solar zenith used to select an offline cache package.
 *
 * @param {Flat32DistantSunSceneConfiguration} configuration - Scene observation and observer geometry.
 * @returns {Flat32DistantSunSceneState<SphericalEarthGeometry>} - Geometry plus live source state.
 */
export function createDistantSunSceneState(configuration) {
	const profile = DEFAULT_NATIVE_PRODUCTION_PROFILE;
	const geometry = new SphericalEarthGeometry({
		bottomRadius: profile.physical.geometry.bottomRadius,
		topRadius: profile.physical.geometry.topRadius,
		observerHeight: configuration.observerHeight,
		observerUpDirection: configuration.observerUpDirection,
		sceneFrame: {kind: 'observer-local'},
		cacheAltitudeBinCount: NATIVE_48_POSITION_DOMAIN_OWNER.count,
		cacheBoundaryAltitude: NATIVE_48_POSITION_DOMAIN_OWNER.nodes[0].coordinate,
		sourceTransmittanceIntervalCount: profile.numerical.sourcePathTransmittance.intervalCount,
	});
	const placement = geometry.resolveDistantSunSceneState(configuration.observation);

	return {
		observation: configuration.observation,
		geometry,
		directionToSourceModel: placement.directionToSourceModel,
		observerSolarZenith: placement.observerSolarZenith,
		solarZenithDegrees: AngleMath.toDegrees(placement.observerSolarZenith),
	};
}
