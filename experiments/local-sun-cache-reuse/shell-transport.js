import {CanonicalValueHash} from '../../src/algorithm32/value-identity/CanonicalValueHash.js';

/** Replace one complete GLSL function, requiring the collaborator to exist.
 * @param {string} source - Assembled owned shader.
 * @param {string} signature - Unique function prefix.
 * @param {string} replacement - Full replacement function(s).
 * @returns {string} - Adapted source.
 */
function replaceFunction(source,signature,replacement) {
	const start=source.indexOf(signature);if(start<0)throw new Error('Optical transport collaborator missing.');
	const open=source.indexOf('{',start);let depth=1,end=open+1;
	for(;end<source.length && depth;end++){if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
	if(depth)throw new Error('Unbalanced shader collaborator.');
	return source.slice(0,start)+replacement+source.slice(end);
}

const helpers=`
float shellColumn(float z0,float z1,float lengthMeters,float scaleHeight) {
	float q=(z1-z0)/scaleHeight;
	float factor;
	if(abs(q)<0.01) factor=1.0-q*0.5+q*q/6.0-q*q*q/24.0;
	else factor=(1.0-exp(-q))/q;
	return max(0.0,exp(-z0/scaleHeight)*lengthMeters*factor);
}
float shellOpticalDepth(vec3 a,vec3 b,float lengthMeters,int c) {
	vec3 sea=vec3(0.0);
	return cacheRayleighScattering(sea,c)*shellColumn(a.z,b.z,lengthMeters,uCacheRayleighScaleHeight)
		+cacheMieExtinction(sea,c)*shellColumn(a.z,b.z,lengthMeters,uCacheMieScaleHeight);
}
void shellAttenuationWeights(float tau,out float lower,out float upper) {
	float total;
	if(tau<0.01) {
		total=tau*(1.0-tau*0.5+tau*tau/6.0-tau*tau*tau/24.0);
		upper=tau*(0.5-tau/3.0+tau*tau/8.0-tau*tau*tau/30.0);
	} else {
		float t=exp(-tau);total=1.0-t;upper=(1.0-(1.0+tau)*t)/tau;
	}
	lower=max(0.0,total-upper);upper=max(0.0,upper);
}
`;

const direct=`float shellContinuousDensity(vec3 p,vec3 direction,int c) {
	vec3 incoming=cacheSourceDirection(p);
	return cachePathTransmittance(p,incoming,c)*cacheSourceIrradiance(p,c)*(
		cacheRayleighScattering(p,c)*cacheRayleighPhase(direction,incoming)
		+cacheMieScattering(p,c)*cacheMiePhase(direction,incoming));
}
float cacheDirectL1(int positionIndex,int directionIndex,int c) {
	vec3 origin=cachePosition(positionIndex);
	vec3 direction=cacheIncomingDirection(directionIndex,cacheSourceDirection(origin));
	float lengthMeters=cacheReusableBoundaryDistance(origin,direction);
	float ds=lengthMeters/float(CACHE_TRANSPORT_INTERVAL_COUNT);
	vec3 previous=origin;
	float previousSource=shellContinuousDensity(origin,direction,c)/max(cacheExtinction(origin,c),1.0e-30);
	float radiance=0.0;float transmission=1.0;
	for(int i=1;i<=CACHE_TRANSPORT_INTERVAL_COUNT;++i) {
		vec3 p=origin+direction*(ds*float(i));
		if(i==CACHE_TRANSPORT_INTERVAL_COUNT) p.z=clamp(p.z,0.0,uCacheGeometryTopAltitude);
		float source=shellContinuousDensity(p,direction,c)/max(cacheExtinction(p,c),1.0e-30);
		float tau=shellOpticalDepth(previous,p,ds,c);float w0;float w1;
		shellAttenuationWeights(tau,w0,w1);
		radiance+=transmission*(previousSource*w0+source*w1);
		transmission*=exp(-tau);previous=p;previousSource=source;
		if(transmission==0.0)break;
	}
	return radiance;
}`;

const transport=`void main() {
	int di=int(gl_FragCoord.x);int pi=int(gl_FragCoord.y);int c=a32CacheWavelengthLayer;
	CacheTransportRay ray=cacheIntegratedTransportRay(pi,di);
	float ds=ray.distanceMeters/float(CACHE_TRANSPORT_INTERVAL_COUNT);
	float transmission=1.0;float radiance=0.0;float previousSource=0.0;
	vec3 previous=ray.originMeters;
	for(int i=0;i<=CACHE_TRANSPORT_INTERVAL_COUNT;++i) {
		vec3 p=ray.originMeters+ray.direction*(ds*float(i));
		if(i==CACHE_TRANSPORT_INTERVAL_COUNT) p.z=clamp(p.z,0.0,uCacheGeometryTopAltitude);
		shellTransportRhoOverride=i==CACHE_TRANSPORT_INTERVAL_COUNT && ray.endsOnCylinder ? uCacheGeometryRadialMaximum : -1.0;
		CachePositionStencil ps=cacheConstructionPositionStencil(p);
		CacheDirectionStencil directions=cacheConstructionDirectionStencil(p,ray.direction);
		CacheDirectionStencil axisDirections=cacheConstructionDirectionStencil(uCacheGeometrySourceSubpoint,vec3(length(ray.direction.xy),0.0,ray.direction.z));
		float density=0.0;
		for(int a=0;a<4;++a) {
			if(ps.weights[a]==0.0)continue;
			CacheDirectionStencil nodeDirections=directions;
			if(shellNodeExcess(ps.indices[a])==0.0)
				nodeDirections=axisDirections;
			float positionWeight=ps.weights[a]*shellSpectralNodeWeight(ps.indices[a],cacheRho(p),cacheAltitude(p),c);
			for(int b=0;b<4;++b) {
				float weight=positionWeight*nodeDirections.weights[b];if(weight==0.0)continue;
				density+=weight*cacheStoredScatteringDensity(nodeDirections.indices[b],ps.indices[a],c);
			}
		}
		float source=density/max(cacheExtinction(p,c),1.0e-30);
		if(i>0) {
			float tau=shellOpticalDepth(previous,p,ds,c);float w0;float w1;
			shellAttenuationWeights(tau,w0,w1);
			radiance+=transmission*(previousSource*w0+source*w1);
			transmission*=exp(-tau);
		}
		previous=p;previousSource=source;
		if(transmission==0.0)break;
	}
	a32CacheOutput=radiance;
}`;

/** Adapt one candidate construction shader to attenuation-weighted optical integration.
 * Physical extinction/phase/source equations remain unchanged. Source functions
 * are linear between optical-depth endpoints, so thick cells cannot create an
 * unbounded half-interval emission term. Numerical accuracy still needs refinement.
 * @param {CacheShader} shader - Experiment-owned assembled candidate shader.
 * @param {LocalSunShellTransportPolicy} [policy] - Explicit path sampling and tail policy.
 * @returns {CacheShader} - Versioned shader with its actual adapted source identity.
 */
export function opticalShellTransport(shader,policy='uniform120') {
	if(!shader.source.includes('float cacheExtinction('))return shader;
	if(!['uniform120','square48-tail64','square120-tail64','column48-tail64'].includes(policy))throw new Error('Unknown shell integration policy.');
	const square=policy!=='uniform120',intervals=policy==='square48-tail64' || policy==='column48-tail64' ? 48 : 120;
	let source=shader.source.replace(/(#define CACHE_TRANSPORT_INTERVAL_COUNT\s+)15\b/,(_whole,prefix)=>prefix+intervals);
	const medium='float cacheExtinction(';
	const start=source.indexOf(medium),open=source.indexOf('{',start),end=source.indexOf('}',open)+1;
	source=source.slice(0,end)+helpers+source.slice(end);
	if(source.includes('float cachePathTransmittance('))
		source=replaceFunction(source,'float cachePathTransmittance(',`float cachePathTransmittance(vec3 p,vec3 direction,int c) {
	if(cacheRayBlockedByGround(p,direction))return 0.0;
	float lengthMeters=cacheSourcePathDistance(p,direction);
	vec3 end=p+direction*lengthMeters;
	end.z=clamp(end.z,0.0,uCacheGeometryTopAltitude);
	return exp(-shellOpticalDepth(p,end,lengthMeters,c));
}`);
	if(source.includes('float cacheDirectL1('))source=replaceFunction(source,'float cacheDirectL1(',direct);
	if(source.includes('CacheTransportRay ray = cacheIntegratedTransportRay('))source=replaceFunction(source,'void main(',transport);
	if(source.includes('float shellLogFactor(')) {
		source=source.replace('float positionWeight=ps.weights[a]*shellSpectralNodeWeight(ps.indices[a],cacheRho(p),cacheAltitude(p),c);',
			'float positionWeight=ps.weights[a]*shellSpectralNodeWeightFromLog(ps.indices[a],shellQueryLog,c);')
			.replace('for(int a=0;a<4;++a) {','float shellQueryLog=shellLogFactor(cacheRho(p),cacheAltitude(p),c);\n\t\tfor(int a=0;a<4;++a) {');
		if(source.includes('shellSpectralNodeWeightFromLog(ps.indices[a],shellQueryLog,c)') && !source.includes('float shellQueryLog=shellLogFactor'))throw new Error('Construction factor-hoisting anchor changed.');
	}
	if(square) {
		const cap=`float shellRetainedLength(vec3 origin,vec3 direction,float full,int c) {
	vec3 end=origin+direction*full;end.z=clamp(end.z,0.0,uCacheGeometryTopAltitude);
	if(shellOpticalDepth(origin,end,full,c)<=64.0)return full;
	float low=0.0;float high=full;
	for(int i=0;i<24;++i) {float mid=(low+high)*0.5;vec3 p=origin+direction*mid;p.z=clamp(p.z,0.0,uCacheGeometryTopAltitude);if(shellOpticalDepth(origin,p,mid,c)>64.0)high=mid;else low=mid;}
	return high;
}
`;
		source=source.replace('void shellAttenuationWeights(',cap+'void shellAttenuationWeights(');
		if(source.includes('float cacheDirectL1(')) {
			source=source.replace('float ds=lengthMeters/float(CACHE_TRANSPORT_INTERVAL_COUNT);','lengthMeters=shellRetainedLength(origin,direction,lengthMeters,c);\n\tfloat previousDistance=0.0;');
			source=source.replace('vec3 p=origin+direction*(ds*float(i));','float fraction=float(i)/float(CACHE_TRANSPORT_INTERVAL_COUNT);float distance=lengthMeters*fraction*fraction;float ds=distance-previousDistance;previousDistance=distance;\n\t\tvec3 p=origin+direction*distance;');
		}
		if(source.includes('CacheTransportRay ray=cacheIntegratedTransportRay(pi,di);')) {
			source=source.replace('float ds=ray.distanceMeters/float(CACHE_TRANSPORT_INTERVAL_COUNT);','float retainedLength=shellRetainedLength(ray.originMeters,ray.direction,ray.distanceMeters,c);\n\tbool physicalEnd=retainedLength==ray.distanceMeters;float previousDistance=0.0;');
			source=source.replace('vec3 p=ray.originMeters+ray.direction*(ds*float(i));','float fraction=float(i)/float(CACHE_TRANSPORT_INTERVAL_COUNT);float distance=retainedLength*fraction*fraction;float ds=distance-previousDistance;previousDistance=distance;\n\t\tvec3 p=ray.originMeters+ray.direction*distance;');
			source=source.replace('i==CACHE_TRANSPORT_INTERVAL_COUNT && ray.endsOnCylinder','i==CACHE_TRANSPORT_INTERVAL_COUNT && physicalEnd && ray.endsOnCylinder');
		}
		if(policy==='column48-tail64') {
			const warp=`float shellPathDistance(float fraction,float full,vec3 direction) {
	float q=fraction*fraction;
	float a=-direction.z*full/uCacheRayleighScaleHeight;
	if(abs(a)<0.001)return full*q;
	float x=q*(exp(a)-1.0);
	float logarithm=abs(x)<0.001 ? x-x*x*0.5+x*x*x/3.0 : log(1.0+x);
	return clamp(-uCacheRayleighScaleHeight/direction.z*logarithm,0.0,full);
}
`;
			source=source.replace('float shellRetainedLength(',warp+'float shellRetainedLength(');
			source=source.replace('distance=lengthMeters*fraction*fraction','distance=shellPathDistance(fraction,lengthMeters,direction)');
			source=source.replace('distance=retainedLength*fraction*fraction','distance=shellPathDistance(fraction,retainedLength,ray.direction)');
		}
	}
	return {...shader,id:shader.id+'-shell-optical-'+policy,source,sourceHash:CanonicalValueHash.sha256Value(source)};
}
