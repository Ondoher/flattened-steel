import {column,attenuationWeights,pathDistance} from './shell-runtime-math.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {SpectralCalculator} from '../../src/algorithm32/atmospheric-transport/spectral/SpectralCalculator.js';
import {SpectralPacket,SPECTRAL_QUANTITIES,SPECTRAL_UNITS} from '../../src/algorithm32/spectral-values/index.js';

const hr=CANONICAL_ATMOSPHERE_CONSTANTS.rayleighScaleHeight.value;
const hm=CANONICAL_ATMOSPHERE_CONSTANTS.mieScaleHeight.value;

/** CPU companion to the owned analytic-column/positive-interval runtime shader. */
export class ShellRuntimeCalculator extends SpectralCalculator {
	/** Build the exact endpoint inventory for the owned column coordinate.
	 * @param {RaySegment} segment - Complete geometry-resolved physical segment.
	 * @param {number} count - Accepted positive interval count.
	 * @returns {readonly PathIntegrationPoint[]} - Physical endpoint distances and intervals.
	 */
	buildEndpointTrapezoidPathIntegrationPoints(segment,count) {
		if(!Number.isInteger(count) || count<1)throw new Error('Positive runtime interval count required.');
		const start=segment.startDistance.value,full=segment.endDistance.value-start;
		const distances=Array.from({length:count+1},(_,i)=>start+pathDistance(i/count,full,segment.ray.direction[2]));
		return distances.map((d,i)=>({pointIndex:i,distanceAlongRay:{value:d,units:'meters'},intervalLengthFromPrevious:{value:i===0?0:d-distances[i-1],units:'meters'},
			trapezoidWeight:i===0 || i===count ? .5 : 1,measure:{value:((distances[i+1] ?? d)-(distances[i-1] ?? d))/2,units:'meters'}}));
	}
	/** Integrate the same sampled source function with exact interval extinction.
	 * @param {RaySegment} segment - Physical ray and complete endpoints.
	 * @param {readonly PathIntegrationPoint[]} points - Owned column endpoint inventory.
	 * @param {ComputeRadianceOptions} options - Borrowed cumulative CPU cache.
	 * @returns {PathRadiance} - Typed physical radiance and transmission.
	 */
	computeRadiance(segment,points,options) {
		const {model}=this.dependencies,basis=model.spectral.basis;
		const radiance=new Float64Array(basis.channelCount),t=new Float64Array(basis.channelCount).fill(1);
		let previousSource=null,previousZ=0,previousDistance=0;
		const sea=model.atmosphere.sampleMedium({altitude:{value:0,units:'meters'}});
		for(const point of points) {
			const distance=point.distanceAlongRay.value;
			const origin=segment.ray.origin.coordinates,direction=segment.ray.direction;
			const position=/** @type {Position} */({coordinates:[origin[0]+direction[0]*distance,origin[1]+direction[1]*distance,origin[2]+direction[2]*distance],units:'meters'});
			const coordinate=model.geometry.resolveAtmosphereCoordinate(position),medium=model.atmosphere.sampleMedium(coordinate),z=Math.max(0,coordinate.altitude.value);
			const j=options.scatteringCache.sampleCumulativeScatteringDensity({context:{position,atmosphereCoordinate:coordinate,physicalOutgoingDirection:segment.ray.direction},geometry:model.geometry});
			const source=j.values.map((v,c)=>v/Math.max(medium.extinction.values[c],1e-30));
			if(previousSource)for(let c=0;c<basis.channelCount;c++) {
				const ds=distance-previousDistance,tau=sea.rayleighScattering.values[c]*column(previousZ,z,ds,hr)+sea.mieExtinction.values[c]*column(previousZ,z,ds,hm);
				const [lower,upper]=attenuationWeights(Math.max(0,tau));radiance[c]+=t[c]*(lower*previousSource[c]+upper*source[c]);t[c]*=Math.exp(-tau);
			}
			previousSource=source;previousZ=z;previousDistance=distance;
		}
		const packet=(/** @type {SpectralQuantity} */ quantity,/** @type {SpectralUnits} */ units,/** @type {Float64Array} */ values)=>new SpectralPacket({basis,quantity,units,values,
			provenanceIdentity:'shell-column-positive-runtime-v1:'+basis.contentHash+':'+options.scatteringCache.sampleProvenanceIdentity});
		return {pathRadiance:/** @type {SpectralRadiancePacket} */(packet(SPECTRAL_QUANTITIES.RADIANCE_DENSITY,SPECTRAL_UNITS.RADIANCE_DENSITY,radiance)),
			transmittance:/** @type {SpectralTransmittancePacket} */(packet(SPECTRAL_QUANTITIES.TRANSMITTANCE,SPECTRAL_UNITS.DIMENSIONLESS,t))};
	}
}
