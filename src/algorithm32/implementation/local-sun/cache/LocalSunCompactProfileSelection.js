import {FlatEarthGeometry} from '../../flat-earth/FlatEarthGeometry.js';
import {CanonicalAtmosphere} from '../../canonical-atmosphere/CanonicalAtmosphere.js';
import {LocalSunLightSource} from '../LocalSunLightSource.js';
import {LocalSunCompactConstructionProfile} from './LocalSunCompactConstructionProfile.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '../../../profiles/native-15/native-15-profile.js';

/** Qualified v9 altitude seeds, in meters; refinement remains geometry/medium owned. Derived from the accepted P0 compact controls, SHA-256 74a7cb03fd646d6ec4754e45e46f7ed622c815d09cd82ceeef174819c3513db6.
 *
 * @type {readonly number[]}
 */
const ALTITUDE_METERS = [
	0, 250, 500, 1000, 1500, 3000, 5000, 7000, 10000, 14000, 17000, 20000, 22500, 25000, 31250, 37500, 50000, 62500,
	75000, 87500, 99000, 100000,
];
/** Qualified v9 Euclidean-radius seeds, in meters, from the same P0 control. This is an executable production selection; comparison fixtures are never runtime imports.
 *
 * @type {readonly number[]}
 */
const BAND_RADIUS_METERS = [
	0, 47.28032, 4728.032, 47280.32, 472803.2, 2364016, 4255228.8, 4728032, 4729032, 4740532, 4753032, 4765532, 4778032,
	4781193.516522633, 4790532, 4790665.547779374, 4796782, 4803032, 4805532, 4806410.785373068, 4808032, 4811032,
	4814032, 4818032, 4821032, 4823032, 4825032, 4826532, 4827032, 4827532, 4827782, 4828032, 4828367.859188962,
	4831160.796582749, 4840535.052107385, 4856118.597990638, 4877851.92309576, 4890559.188061244, 4976321.468265892,
	5213588.716867586, 5528682.667962053, 5909166.57056213, 6343284.626715405, 7873807.683303485, 9615626.346890982,
	11472904.064954478, 13397709.519000774, 15364685.094678933, 17359502.031827528, 19373562.10299616,
	21401433.161251705, 23439530.907926656, 25485401.93999349, 27537313.77483376, 29594009.915108226,
	30623850.957271527, 31654557.820456896, 32342135.86570194, 33030040.36757523, 33374108.731780086,
	33718251.345421575, 33725372.89627832,
];

/** Explicit qualified compact candidate; does not select application defaults. */
export class LocalSunCompactProfileSelection {
	/** Call this method to configure genuine physical owners for one exact observation.
	 *
	 * @param {LocalSunCompactProfileSelectionRequest} request - Observation, receiver and ordinary view support.
	 * @returns {LocalSunCompactConstructionProfile} - Complete qualified construction/live profile.
	 */
	create(request) {
		const geometry = new FlatEarthGeometry({
			observerPosition: request.observerPosition,
			topAltitude: {value: 100000, units: 'meters'},
			localLightSourceHeight: {value: 4828032, units: 'meters'},
			projectionRadius: DEFAULT_NATIVE_PRODUCTION_PROFILE.physical.geometry.bottomRadius,
			sceneSkyRayLimit: request.viewRayLimit,
			observerCenteredDome: {
				centerPolicy: 'observer-centered',
				apexAltitude: {value: 100000, units: 'meters'},
				maxObserverViewRayExtent: request.viewRayLimit,
			},
		});
		const lightSource = new LocalSunLightSource({
			sourceKey: 'flat32-compact-local-sun',
			referenceDistance: {value: 4800000, units: 'meters'},
			referenceSpectralIncidentScale: 1,
			radius: {value: 25749.504, units: 'meters'},
			distanceFalloff: true,
		});
		geometry.configureLightSource({lightSource, observation: request.observation});
		return new LocalSunCompactConstructionProfile({
			geometry,
			lightSource,
			atmosphere: request.atmosphere ?? new CanonicalAtmosphere(),
			groundBoundary: null,
			maximumScatteringOrder: request.maximumScatteringOrder,
			topologyControls: {
				coverageRadius: {value: 33378000, units: 'meters'},
				altitudes: ALTITUDE_METERS.map(LocalSunCompactProfileSelection._meters),
				bandRadii: BAND_RADIUS_METERS.map(LocalSunCompactProfileSelection._meters),
				boundaryExtinctionLengthMultiples: [0.25, 0.5, 1, 2, 4, 8, 16],
			},
			provenanceIdentity: 'production-compact-v9-selection:p0-74a7cb03',
		});
	}
	/** Called by seed adaptation to retain explicit physical units.
	 *
	 * @param {number} value - Seed length in meters.
	 * @returns {Distance} - Unit-bearing seed.
	 */
	static _meters(value) {
		return {value, units: 'meters'};
	}
}
