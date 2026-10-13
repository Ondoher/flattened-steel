import {CacheBuildModules} from '../../shader-assembly/cache-pass/CacheBuildModules.js';

/** Positive source-function integration using geometry-owned rays and atmosphere-owned exponential columns.
 *
 * @implements {CacheBuildContributor}
 */
export class PositiveColumnCacheTransport {
	/** Call this method to integrate continuous primary or reconstructed stored density on a compact construction ray.
	 *
	 * @param {CacheBuildContext} context - Complete accepted transport policy and input.
	 * @returns {CacheBuildModule} - Source-independent positive transport operation.
	 */
	createCacheModule(context) {
		let direct = context.kind === 'direct-l1';
		let density = direct
			? 'compactPrimaryDensity(position,ray.direction,channel,false)'
			: 'compactStoredDensity(position,ray.direction,channel,rho)';
		return CacheBuildModules.createBuildModule({
			id: 'positive-column-cache-' + context.kind + '-v1',
			owner: 'transport',
			provides: ['cache.operation.' + context.kind],
			requires: [
				'geometry.compactCache',
				'atmosphere.compactColumns',
				direct ? 'lightSource.compactDensity' : 'cache.compactStoredDensity',
			],
			bindings: [],
			blocks: [
				{
					id: 'positive-column-cache-transport',
					phase: 'main',
					order: 100,
					source: `
int directionIndex=int(gl_FragCoord.x);int positionIndex=int(gl_FragCoord.y);int channel=a32CacheWavelengthLayer;
CompactRay ray=compactRay(positionIndex,directionIndex);
float retainedLength=compactRetainedLength(ray.origin,ray.direction,ray.lengthMeters,channel);
bool physicalEnd=retainedLength==ray.lengthMeters;
float radiance=0.0;float transmission=1.0;float previousSource=0.0;float previousDistance=0.0;
vec3 previous=ray.origin;
for(int pointIndex=0;pointIndex<=${context.options.transportIntervalCount};++pointIndex) {
	float fraction=float(pointIndex)/float(${context.options.transportIntervalCount});
	float distance=compactColumnDistance(fraction,retainedLength,ray.direction);
	float intervalLength=distance-previousDistance;previousDistance=distance;
	vec3 position=ray.origin+ray.direction*distance;
	if(pointIndex==${context.options.transportIntervalCount})position.z=clamp(position.z,0.0,COMPACT_TOP);
	float rho=pointIndex==${context.options.transportIntervalCount} && physicalEnd && ray.endsOnCylinder ? COMPACT_RADIUS : compactRho(position);
	float sourceFunction=${density}/max(cacheExtinction(position,channel),1.0e-30);
	if(pointIndex>0) {
		float opticalDepth=compactOpticalDepth(previous,position,intervalLength,channel);float lower;float upper;
		compactAttenuationWeights(opticalDepth,lower,upper);
		radiance+=transmission*(previousSource*lower+sourceFunction*upper);transmission*=exp(-opticalDepth);
	}
	previous=position;previousSource=sourceFunction;
	if(transmission==0.0)break;
}
a32CacheOutput=radiance;`,
				},
			],
		});
	}
}
