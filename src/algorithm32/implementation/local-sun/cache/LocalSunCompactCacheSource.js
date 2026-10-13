import {CacheBuildModules} from '../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CacheValues} from '../../../gpu-cache-runtime/CacheValues.js';
import {LocalSunShellFactCache} from './LocalSunShellFactCache.js';
import {LocalSunCompactConstructionProfile} from './LocalSunCompactConstructionProfile.js';
import {LOCAL_SUN_SHELL_COUNT, LOCAL_SUN_SHELL_SEARCH_ITERATION_COUNT} from './consts.js';

/** Source-owned continuous direct density and separate held-amplitude primary density.
 *
 * @implements {CacheBuildContributor}
 */
export class LocalSunCompactCacheSource {
	/** Complete accepted source and compact profile. @type {LocalSunCompactConstructionProfile} */
	_profile;
	/** Source-owned physical amplitude partition. @type {LocalSunShellFactCache} */
	_shellFacts;

	/** Creates compact source semantics from qualified explicit source-distance support.
	 *
	 * @param {LocalSunCompactConstructionProfile} profile - Genuine accepted profile.
	 */
	constructor(profile) {
		this._profile = profile;
		this._shellFacts = new LocalSunShellFactCache({
			sourceConfiguration: profile.models.lightSource.configuration,
			sourceDistanceBounds: profile.domains.topology.sourceDistanceBounds,
		});
	}

	/** Call this method to declare source facts and primary equations without sampled source transmission.
	 *
	 * @param {CacheBuildContext} _context - Accepted pass context.
	 * @returns {CacheBuildModule} - Source contributor with declared shell partition.
	 */
	createCacheModule(_context) {
		let configuration = this._profile.models.lightSource.configuration;
		let boundaries = CacheValues.createData({
			id: 'compact-source-amplitude-boundaries',
			quantity: 'source-distance-boundary',
			units: 'meters',
			shape: [this._shellFacts.boundaries.length],
			values: this._shellFacts.boundaries,
		});
		return CacheBuildModules.createBuildModule({
			id: 'local-sun-compact-source-v1',
			owner: 'lightSource',
			provides: ['lightSource.compactDensity'],
			requires: ['geometry.compactCache', 'atmosphere.compactColumns'],
			bindings: [
				{
					spec: {
						id: boundaries.id,
						name: 'uCompactAmplitudeBoundaries',
						kind: 'data',
						shaderType: 'sampler2D',
						frequency: 'build',
					},
					value: boundaries,
				},
				{
					spec: {
						id: 'compact-source-irradiance',
						name: 'uCompactSourceIrradiance',
						kind: 'uniform',
						shaderType: 'float[15]',
						frequency: 'build',
					},
					value: configuration.sourceIrradiance,
				},
				{
					spec: {
						id: 'compact-source-reference-distance',
						name: 'uCompactReferenceDistance',
						kind: 'uniform',
						shaderType: 'float',
						frequency: 'build',
					},
					value: configuration.referenceDistance,
				},
				{
					spec: {
						id: 'compact-source-scale',
						name: 'uCompactSourceScale',
						kind: 'uniform',
						shaderType: 'float',
						frequency: 'build',
					},
					value: configuration.referenceSpectralIncidentScale,
				},
			],
			blocks: [
				{
					id: 'local-sun-compact-source-density',
					phase: 'function',
					order: 0,
					source: `
float compactSourceScale(float distance) {return uCompactSourceScale*pow(uCompactReferenceDistance/distance,2.0);}
float compactAmplitudeBoundary(int index) {return texelFetch(uCompactAmplitudeBoundaries,ivec2(index,0),0).r;}
float compactHeldScale(float distance) {
	int lower=0;int upper=${LOCAL_SUN_SHELL_COUNT};
	if(distance>=compactAmplitudeBoundary(${LOCAL_SUN_SHELL_COUNT}))lower=${LOCAL_SUN_SHELL_COUNT - 1};
	else for(int iteration=0;iteration<${LOCAL_SUN_SHELL_SEARCH_ITERATION_COUNT};++iteration) {int middle=(lower+upper)/2;if(compactAmplitudeBoundary(middle)<=distance)lower=middle;else upper=middle;}
	return 0.5*(compactSourceScale(compactAmplitudeBoundary(lower))+compactSourceScale(compactAmplitudeBoundary(lower+1)));
}
float compactPrimaryDensity(vec3 position,vec3 direction,int channel,bool held) {
	vec3 displacement=COMPACT_SOURCE-position;float distance=length(displacement);vec3 incoming=displacement/distance;
	float scale=held ? compactHeldScale(distance) : compactSourceScale(distance);
	return compactSourceTransmittance(position,incoming,channel)*uCompactSourceIrradiance[channel]*scale*(cacheRayleighScattering(position,channel)*cacheRayleighPhase(direction,incoming)+cacheMieScattering(position,channel)*cacheMiePhase(direction,incoming));
}`,
				},
			],
		});
	}
}
