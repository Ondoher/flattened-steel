import {DistantSunSceneCacheCompilerInputs as Inputs} from './DistantSunSceneCacheCompilerInputs.js';
import {DistantSunPointLocalProfileCompilerInputs as ProfileInputs} from './DistantSunPointLocalProfileCompilerInputs.js';
import {DistantSunSceneCacheNumerics} from './DistantSunSceneCacheNumerics.js';
import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';

/** Construct fresh physical profiles only when the proof is not consuming authenticated profile data.
 * @returns {P2PhysicalProfile[]} - Separate Native15 and Direct40 profiles with their own integration settings.
 */
export function createP2PhysicalProfiles() {
	const options = {
		numericalPolicy: DistantSunSceneCacheNumerics.createAnchoredRadial(),
		solarInterpolation: /** @type {const} */ ('monotone-cubic'),
	};
	return [
		{
			id: 'native15',
			buildRequest: Inputs.createInputSet(Inputs.createQualifiedSanJoseNauticalScene(), options).buildRequest,
		},
		{
			id: 'direct40',
			buildRequest: ProfileInputs.createInputSet(
				createBrunetonProductionProfile({
					time: '10:15',
					fittedAzimuthDegrees: 98.59994923191232,
					maximumScatteringOrder: 4,
				}),
				options,
			).buildRequest,
		},
	];
}
