import {column} from './shell-runtime-math.js';
import {SpectralPacket,SPECTRAL_QUANTITIES,SPECTRAL_UNITS} from '../../src/algorithm32/spectral-values/index.js';
import {CanonicalAtmosphere} from '../../src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {ShaderContributions} from '../../src/algorithm32/shader-assembly/base/ShaderContributions.js';
import {TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME} from '../../src/algorithm32/atmospheric-transport/consts.js';

const hr=CANONICAL_ATMOSPHERE_CONSTANTS.rayleighScaleHeight.value;
const hm=CANONICAL_ATMOSPHERE_CONSTANTS.mieScaleHeight.value;

/** Create an owned flat-medium/runtime adapter through existing public contracts.
 * Physical coefficient and cache-build services delegate to a private canonical
 * instance. A separate transport contribution replaces the inherited function
 * at assembly using ordered rename/restore blocks; no global prototype changes.
 * Both view and receiver assemblies therefore use identical actual shader code.
 * @param {number} [mieAlbedo] - Bounded physical Mie single-scattering albedo; extinction/density scales stay pinned.
 * @returns {AtmosphereModel & CacheBuildContributor} - Explicit flat optical and runtime numerical identity.
 */
export function createShellAtmosphere(mieAlbedo=CANONICAL_ATMOSPHERE_CONSTANTS.mieSingleScatteringAlbedo) {
	if(!Number.isFinite(mieAlbedo) || mieAlbedo<0 || mieAlbedo>1)throw new Error('Physical Mie albedo must be between zero and one.');
	const physical=new CanonicalAtmosphere({constants:{...CANONICAL_ATMOSPHERE_CONSTANTS,mieSingleScatteringAlbedo:mieAlbedo}});
	const r=physical.seaLevelRayleighScattering.values,m=physical.seaLevelMieExtinction.values;
	const packet=(/** @type {SpectralQuantity} */ quantity,/** @type {number[]} */ values)=>new SpectralPacket({basis:physical.spectralBasis,quantity,units:SPECTRAL_UNITS.DIMENSIONLESS,values,
		provenanceIdentity:'shell-flat-analytic-columns-runtime-v1:'+quantity});
	return {
		id:physical.id+':shell-flat-analytic-columns-column-runtime-v1',spectralBasis:physical.spectralBasis,
		sampleMedium:coordinate=>physical.sampleMedium(coordinate),samplePhase:request=>physical.samplePhase(request),
		createCacheModule:context=>physical.createCacheModule(context),
		integrateOpticalDepth(path) {
			if(path.blockedByGround)return physical.integrateOpticalDepth(path);
			const a=path.start.altitude.value,b=path.end.altitude.value,length=path.length.value;
			if(path.start.altitude.units!=='meters' || path.end.altitude.units!=='meters' || path.length.units!=='meters' ||
				![a,b,length].every(Number.isFinite) || a< -1e-6 || b< -1e-6 || a>100000+1e-6 || b>100000+1e-6 || length<0)
				throw new Error('Shell optical path outside admitted flat slab.');
			const rc=column(Math.max(0,a),Math.max(0,b),length,hr),mc=column(Math.max(0,a),Math.max(0,b),length,hm);
			const tau=r.map((v,c)=>v*rc+m[c]*mc);
			return {blockedByGround:false,opticalDepth:/** @type {SpectralOpticalDepthPacket} */(packet(SPECTRAL_QUANTITIES.OPTICAL_DEPTH,tau)),
				transmittance:/** @type {SpectralTransmittancePacket} */(packet(SPECTRAL_QUANTITIES.TRANSMITTANCE,tau.map(v=>Math.exp(-v))))};
		},
		createShaderContribution() {
			const transport=ShaderContributions.createShaderContribution({id:'shell-column-positive-view-transport-v1',owner:'transport',
				provides:['shell.columnPositiveViewTransport'],requires:['transport.evaluatePathRadiance','cache.sampleCumulativeScatteringDensity','atmosphere.sampleMedium'],
				functions:[
					ShaderContributions.createShaderSourceBlock('shell-rename-inherited-transport','evaluateTransport',-1,'#define evaluatePathRadiance shellInheritedEvaluatePathRadiance'),
					ShaderContributions.createShaderSourceBlock('shell-column-positive-transport','evaluateTransport',1,runtimeShader(r,m)),
				]});
			return [physical.createShaderContribution(),transport];
		},
	};
}

/** Emit experiment-owned view/receiver integration over the complete physical segment.
 * @param {readonly number[]} r - Public Native15 sea-level Rayleigh coefficients.
 * @param {readonly number[]} m - Public Native15 sea-level Mie extinction coefficients.
 * @returns {string} - Actual shader source, including analytic transmission and positive radiance weights.
 */
function runtimeShader(r,m) {
	const literal=(/** @type {number} */ n)=>n.toExponential(16);
	return `#undef evaluatePathRadiance
const float SHELL_VIEW_R[15]=float[15](${r.map(literal).join(',')});
const float SHELL_VIEW_M[15]=float[15](${m.map(literal).join(',')});
float shellViewColumn(float a,float b,float lengthMeters,float scale) {
	float q=(b-a)/scale;
	float f=abs(q)<0.01 ? 1.0-q*0.5+q*q/6.0-q*q*q/24.0 : (1.0-exp(-q))/q;
	return exp(-a/scale)*lengthMeters*f;
}
float shellViewDistance(float fraction,float lengthMeters,float dz) {
	if(fraction==0.0)return 0.0;if(fraction==1.0)return lengthMeters;
	float a=-dz*lengthMeters/${literal(hr)},q=fraction*fraction;
	if(abs(a)<0.001)return lengthMeters*q;
	float x=q*(exp(a)-1.0);
	float logarithm=abs(x)<0.001 ? x-x*x*0.5+x*x*x/3.0 : log(1.0+x);
	return clamp(-${literal(hr)}/dz*logarithm,0.0,lengthMeters);
}
void shellViewWeights(float tau,out float lower,out float upper) {
	float total;
	if(tau<0.01) {
		total=tau*(1.0-tau*0.5+tau*tau/6.0-tau*tau*tau/24.0);
		upper=tau*(0.5-tau/3.0+tau*tau/8.0-tau*tau*tau/30.0);
	} else { total=1.0-exp(-tau);upper=(total-tau*exp(-tau))/tau; }
	lower=total-upper;
}
void evaluatePathRadiance(inout ShaderState state) {
	state.pathRadiance=zeroSpectral();state.transmittance=oneSpectral();
	if(!state.bounds.valid)return;
	float start=state.bounds.startDistanceMeters,full=state.bounds.endDistanceMeters-start;
	SpectralValue previousSource;
	float previousZ=0.0,previousDistance=0.0;
	for(int i=0;i<=${TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME};i++) {
		float distanceMeters=start+shellViewDistance(float(i)/float(${TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME}),full,state.ray.direction.z);
		vec3 position=state.ray.originMeters+state.ray.direction*distanceMeters;
		AtmosphereCoordinate coordinate=resolveAtmosphereCoordinate(state.ray,distanceMeters);
		float z=max(0.0,coordinate.altitudeMeters);
		MediumSample medium=sampleAtmosphere(coordinate);
		SpectralValue j=sampleCumulativeScatteringDensity(position,coordinate,state.ray.direction);
		for(int c=0;c<SPECTRAL_CHANNEL_COUNT;c++) {
			float sourceFunction=j.channels[c]/max(medium.extinction.channels[c],1.0e-30);
			if(i>0) {
				float ds=distanceMeters-previousDistance;
				float tau=SHELL_VIEW_R[c]*shellViewColumn(previousZ,z,ds,${literal(hr)})+SHELL_VIEW_M[c]*shellViewColumn(previousZ,z,ds,${literal(hm)});
				float lower;float upper;shellViewWeights(max(0.0,tau),lower,upper);
				state.pathRadiance.channels[c]+=state.transmittance.channels[c]*(lower*previousSource.channels[c]+upper*sourceFunction);
				state.transmittance.channels[c]*=exp(-tau);
			}
			previousSource.channels[c]=sourceFunction;
		}
		previousZ=z;previousDistance=distanceMeters;
	}
}`;
}

