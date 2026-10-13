import {CanonicalExponentialCacheColumn} from '../implementation/canonical-atmosphere/cache/CanonicalExponentialCacheColumn.js';
import {TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME} from './consts.js';
import DistanceMath from '../math/DistanceMath.js';
import {SpectralPacket, SPECTRAL_QUANTITIES, SPECTRAL_UNITS} from '../spectral-values/index.js';

/** Source-neutral final-view integration over complete geometry-resolved flat segments. */
export class PositiveColumnViewTransport {
	/** Called by binary64 view sampling to resolve squared cumulative Rayleigh column distance.
	 *
	 * @param {number} fraction - Closed unit interval fraction.
	 * @param {number} length - Full segment length in meters.
	 * @param {number} verticalDirection - Unit direction vertical component.
	 * @param {number} scaleHeight - Physical Rayleigh scale height in meters.
	 * @returns {number} - Distance in meters along the complete segment.
	 */
	_distance(fraction, length, verticalDirection, scaleHeight) {
		if (fraction === 0) return 0;
		if (fraction === 1) return length;
		let exponent = (-verticalDirection * length) / scaleHeight;
		let squared = fraction * fraction;
		if (Math.abs(exponent) < 0.001) return length * squared;
		let increment = squared * (Math.exp(exponent) - 1);
		let logarithm =
			Math.abs(increment) < 0.001
				? increment - (increment * increment) / 2 + increment ** 3 / 3
				: Math.log(1 + increment);
		return Math.min(length, Math.max(0, (-scaleHeight / verticalDirection) * logarithm));
	}

	/** Call this method to build the binary64 complete-segment schedule for the selected local view policy.
	 *
	 * @param {RaySegment} segment - Geometry-owned supported complete or shortened segment.
	 * @param {number} intervalCount - Positive accepted view interval count.
	 * @param {CanonicalCacheColumnAtmosphere} atmosphere - Existing physical atmosphere.
	 * @returns {readonly PathIntegrationPoint[]} - Endpoint distances and physical interval measures.
	 * @throws {RangeError} - The interval count is not a positive integer.
	 */
	createPathPoints(segment, intervalCount, atmosphere) {
		if (!Number.isInteger(intervalCount) || intervalCount < 1)
			throw new RangeError('Positive integer view interval count required.');
		new CanonicalExponentialCacheColumn(atmosphere);
		let start = DistanceMath.toMeters(segment.startDistance);
		let length = DistanceMath.toMeters(segment.endDistance) - start;
		let height = atmosphere.constants.rayleighScaleHeight.value;
		let distances = Array.from(
			{length: intervalCount + 1},
			(_unused, index) => start + this._distance(index / intervalCount, length, segment.ray.direction[2], height),
		);
		return distances.map((distance, index) => ({
			pointIndex: index,
			distanceAlongRay: DistanceMath.inMeters(distance),
			intervalLengthFromPrevious: DistanceMath.inMeters(index === 0 ? 0 : distance - distances[index - 1]),
			trapezoidWeight: index === 0 || index === intervalCount ? 0.5 : 1,
			measure: DistanceMath.inMeters(
				((distances[index + 1] ?? distance) - (distances[index - 1] ?? distance)) / 2,
			),
		}));
	}

	/** Call this method to transport a qualified CPU cumulative cache through the same complete view policy.
	 *
	 * @param {PositiveColumnViewReferenceRequest} request - Accepted model, physical segment/schedule and borrowed read-only cache.
	 * @returns {PathRadiance} - Physical Native15 radiance and analytic complete-segment transmission.
	 * @throws {RangeError} - A sample or output is nonfinite or extinction is unsupported.
	 */
	computeRadiance(request) {
		let {model, atmosphere, segment, points, scatteringCache} = request;
		let column = new CanonicalExponentialCacheColumn(atmosphere);
		let values = new Float64Array(15);
		let transmission = new Float64Array(15).fill(1);
		let previousSource = null;
		let previousAltitude = 0;
		let previousDistance = 0;
		for (let point of points) {
			let distance = DistanceMath.toMeters(point.distanceAlongRay);
			let position = DistanceMath.positionAlongRay(segment.ray.origin, segment.ray.direction, distance);
			let coordinate = model.geometry.resolveAtmosphereCoordinate(position);
			let medium = atmosphere.sampleMedium(coordinate);
			let density = scatteringCache.sampleCumulativeScatteringDensity({
				context: {position, atmosphereCoordinate: coordinate, physicalOutgoingDirection: segment.ray.direction},
				geometry: model.geometry,
			});
			let source = density.values.map((value, channel) => value / medium.extinction.values[channel]);
			if (source.some((value) => !Number.isFinite(value)))
				throw new RangeError('Finite supported view source functions required.');
			if (previousSource !== null)
				for (let channel = 0; channel < 15; channel++) {
					let opticalDepth = column.opticalDepth({
						startAltitude: DistanceMath.inMeters(previousAltitude),
						endAltitude: coordinate.altitude,
						length: DistanceMath.inMeters(distance - previousDistance),
						wavelengthIndex: channel,
					});
					let total, upper;
					if (opticalDepth < 0.01) {
						total = opticalDepth * (1 - opticalDepth / 2 + opticalDepth ** 2 / 6 - opticalDepth ** 3 / 24);
						upper =
							opticalDepth * (0.5 - opticalDepth / 3 + opticalDepth ** 2 / 8 - opticalDepth ** 3 / 30);
					} else {
						total = 1 - Math.exp(-opticalDepth);
						upper = (total - opticalDepth * Math.exp(-opticalDepth)) / opticalDepth;
					}
					values[channel] +=
						transmission[channel] * ((total - upper) * previousSource[channel] + upper * source[channel]);
					transmission[channel] *= Math.exp(-opticalDepth);
				}
			previousSource = source;
			previousAltitude = coordinate.altitude.value;
			previousDistance = distance;
		}
		let provenanceIdentity = 'positive-column-view-v1:' + scatteringCache.sampleProvenanceIdentity;
		return {
			pathRadiance: /** @type {SpectralRadiancePacket} */ (
				new SpectralPacket({
					basis: column.spectralBasis,
					quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
					values,
					provenanceIdentity,
				})
			),
			transmittance: /** @type {SpectralTransmittancePacket} */ (
				new SpectralPacket({
					basis: column.spectralBasis,
					quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
					units: SPECTRAL_UNITS.DIMENSIONLESS,
					values: transmission,
					provenanceIdentity,
				})
			),
		};
	}

	/** Call this method to emit analytic transmission and positive column15 source-function integration.
	 *
	 * @param {CanonicalCacheColumnAtmosphere} atmosphere - Accepted canonical exponential medium.
	 * @returns {string} - Complete ordinary-runtime path evaluator without macro renaming.
	 */
	createSource(atmosphere) {
		new CanonicalExponentialCacheColumn(atmosphere);
		let rayleighHeight = atmosphere.constants.rayleighScaleHeight.value.toExponential(16);
		let mieHeight = atmosphere.constants.mieScaleHeight.value.toExponential(16);
		return `
const float COLUMN_VIEW_R[15]=float[15](${atmosphere.seaLevelRayleighScattering.values.map((value) => value.toExponential(16)).join(',')});
const float COLUMN_VIEW_M[15]=float[15](${atmosphere.seaLevelMieExtinction.values.map((value) => value.toExponential(16)).join(',')});
float positiveViewColumn(float startAltitude,float endAltitude,float lengthMeters,float scaleHeight) {
	float exponent=(endAltitude-startAltitude)/scaleHeight;
	float factor=abs(exponent)<0.01 ? 1.0-exponent*0.5+exponent*exponent/6.0-exponent*exponent*exponent/24.0 : (1.0-exp(-exponent))/exponent;
	return exp(-startAltitude/scaleHeight)*lengthMeters*factor;
}
float positiveViewDistance(float fraction,float lengthMeters,float verticalDirection) {
	if(fraction==0.0)return 0.0;if(fraction==1.0)return lengthMeters;
	float exponent=-verticalDirection*lengthMeters/${rayleighHeight};float squared=fraction*fraction;
	if(abs(exponent)<0.001)return lengthMeters*squared;
	float increment=squared*(exp(exponent)-1.0);
	float logarithm=abs(increment)<0.001 ? increment-increment*increment*0.5+increment*increment*increment/3.0 : log(1.0+increment);
	return clamp(-${rayleighHeight}/verticalDirection*logarithm,0.0,lengthMeters);
}
void positiveViewWeights(float opticalDepth,out float lower,out float upper) {
	float total;
	if(opticalDepth<0.01) {
		total=opticalDepth*(1.0-opticalDepth*0.5+opticalDepth*opticalDepth/6.0-opticalDepth*opticalDepth*opticalDepth/24.0);
		upper=opticalDepth*(0.5-opticalDepth/3.0+opticalDepth*opticalDepth/8.0-opticalDepth*opticalDepth*opticalDepth/30.0);
	} else {total=1.0-exp(-opticalDepth);upper=(total-opticalDepth*exp(-opticalDepth))/opticalDepth;}
	lower=total-upper;
}
void evaluatePathRadiance(inout ShaderState state) {
	state.pathRadiance=zeroSpectral();state.transmittance=oneSpectral();
	if(!state.bounds.valid)return;
	float start=state.bounds.startDistanceMeters;float full=state.bounds.endDistanceMeters-start;
	SpectralValue previousSource;float previousAltitude=0.0;float previousDistance=0.0;
	for(int pointIndex=0;pointIndex<=${TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME};++pointIndex) {
		float distance=start+positiveViewDistance(float(pointIndex)/float(${TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME}),full,state.ray.direction.z);
		vec3 position=state.ray.originMeters+state.ray.direction*distance;
		AtmosphereCoordinate coordinate=resolveAtmosphereCoordinate(state.ray,distance);
		float altitude=max(0.0,coordinate.altitudeMeters);
		MediumSample medium=sampleAtmosphere(coordinate);
		SpectralValue density=sampleCumulativeScatteringDensity(position,coordinate,state.ray.direction);
		for(int channel=0;channel<SPECTRAL_CHANNEL_COUNT;++channel) {
			float sourceFunction=density.channels[channel]/max(medium.extinction.channels[channel],1.0e-30);
			if(pointIndex>0) {
				float intervalLength=distance-previousDistance;
				float opticalDepth=COLUMN_VIEW_R[channel]*positiveViewColumn(previousAltitude,altitude,intervalLength,${rayleighHeight})+COLUMN_VIEW_M[channel]*positiveViewColumn(previousAltitude,altitude,intervalLength,${mieHeight});
				float lower;float upper;positiveViewWeights(max(0.0,opticalDepth),lower,upper);
				state.pathRadiance.channels[channel]+=state.transmittance.channels[channel]*(lower*previousSource.channels[channel]+upper*sourceFunction);
				state.transmittance.channels[channel]*=exp(-opticalDepth);
			}
			previousSource.channels[channel]=sourceFunction;
		}
		previousAltitude=altitude;previousDistance=distance;
	}
}`;
	}
}
