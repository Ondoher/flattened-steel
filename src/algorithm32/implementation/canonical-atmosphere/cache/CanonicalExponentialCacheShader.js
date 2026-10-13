import {CacheBuildModules} from '../../../shader-assembly/cache-pass/CacheBuildModules.js';

/** Atmosphere-owned analytic exponential columns and existing physical medium/phase shader semantics.
 *
 * @implements {CacheBuildContributor}
 */
export class CanonicalExponentialCacheShader {
	/** Existing canonical physical atmosphere. @type {CanonicalExponentialCacheShaderAtmosphere} */
	_atmosphere;

	/** Creates the analytic shader contributor without changing the physical atmosphere.
	 *
	 * @param {CanonicalExponentialCacheShaderAtmosphere} atmosphere - Accepted canonical owner.
	 */
	constructor(atmosphere) {
		this._atmosphere = atmosphere;
	}

	/** Call this method to contribute existing physical equations and analytic path columns.
	 *
	 * @param {CacheBuildContext} context - Accepted compact pass.
	 * @returns {CacheBuildModule} - Declared medium and column semantics.
	 */
	createCacheModule(context) {
		let base = this._atmosphere.createCacheModule({...context, kind: 'scatter', groundReflection: undefined});
		return CacheBuildModules.createBuildModule({
			id: 'canonical-exponential-compact-cache-v1',
			owner: 'atmosphere',
			provides: ['atmosphere.compactColumns'],
			requires: ['geometry.compactCache'],
			bindings: base.bindings,
			blocks: [
				...base.blocks,
				{
					id: 'canonical-exponential-compact-columns',
					phase: 'function',
					order: 30,
					source: `
float compactColumn(float startAltitude,float endAltitude,float lengthMeters,float scaleHeight) {
	float exponent=(endAltitude-startAltitude)/scaleHeight;
	float factor=abs(exponent)<0.01 ? 1.0-exponent*0.5+exponent*exponent/6.0-exponent*exponent*exponent/24.0 : (1.0-exp(-exponent))/exponent;
	return max(0.0,exp(-startAltitude/scaleHeight)*lengthMeters*factor);
}
float compactOpticalDepth(vec3 start,vec3 end,float lengthMeters,int channel) {
	return cacheRayleighScattering(vec3(0.0),channel)*compactColumn(start.z,end.z,lengthMeters,uCacheRayleighScaleHeight)
		+cacheMieExtinction(vec3(0.0),channel)*compactColumn(start.z,end.z,lengthMeters,uCacheMieScaleHeight);
}
float compactSourceTransmittance(vec3 position,vec3 direction,int channel) {
	float distance=(COMPACT_TOP-position.z)/direction.z;
	vec3 end=position+direction*distance;end.z=COMPACT_TOP;
	return exp(-compactOpticalDepth(position,end,distance,channel));
}
void compactAttenuationWeights(float opticalDepth,out float lower,out float upper) {
	float total;
	if(opticalDepth<0.01) {
		total=opticalDepth*(1.0-opticalDepth*0.5+opticalDepth*opticalDepth/6.0-opticalDepth*opticalDepth*opticalDepth/24.0);
		upper=opticalDepth*(0.5-opticalDepth/3.0+opticalDepth*opticalDepth/8.0-opticalDepth*opticalDepth*opticalDepth/30.0);
	} else {float transmission=exp(-opticalDepth);total=1.0-transmission;upper=(1.0-(1.0+opticalDepth)*transmission)/opticalDepth;}
	lower=max(0.0,total-upper);upper=max(0.0,upper);
}
float compactRetainedLength(vec3 origin,vec3 direction,float fullLength,int channel) {
	vec3 end=origin+direction*fullLength;end.z=clamp(end.z,0.0,COMPACT_TOP);
	if(compactOpticalDepth(origin,end,fullLength,channel)<=64.0)return fullLength;
	float lower=0.0;float upper=fullLength;
	for(int iteration=0;iteration<24;++iteration) {float middle=(lower+upper)*0.5;vec3 position=origin+direction*middle;position.z=clamp(position.z,0.0,COMPACT_TOP);if(compactOpticalDepth(origin,position,middle,channel)>64.0)upper=middle;else lower=middle;}
	return upper;
}
float compactColumnDistance(float fraction,float lengthMeters,vec3 direction) {
	float squared=fraction*fraction;
	float exponent=-direction.z*lengthMeters/uCacheRayleighScaleHeight;
	if(abs(exponent)<0.001)return lengthMeters*squared;
	float increment=squared*(exp(exponent)-1.0);
	float logarithm=abs(increment)<0.001 ? increment-increment*increment*0.5+increment*increment*increment/3.0 : log(1.0+increment);
	return clamp(-uCacheRayleighScaleHeight/direction.z*logarithm,0.0,lengthMeters);
}`,
				},
			],
		});
	}
}
