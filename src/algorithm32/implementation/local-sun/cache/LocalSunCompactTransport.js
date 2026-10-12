import DistanceMath from '../../../math/DistanceMath.js';
import {
	SpectralPacket as SpectralPacketClass,
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
} from '../../../spectral-values/index.js';
import {CanonicalExponentialCacheColumn} from '../../canonical-atmosphere/cache/CanonicalExponentialCacheColumn.js';
import {LocalSunCompactReconstruction} from './LocalSunCompactReconstruction.js';
import {LOCAL_SUN_COMPACT_TRANSPORT_POLICY} from './compact-transport-consts.js';

/** Cache-owned selected-ray binary64 transport of reconstructed physical J; complete fields and GPU activation remain separate. */
export class LocalSunCompactTransport {
	/** Fixed paired physical owners. @type {LocalSunCompactTransportDefinition} */
	_definition;
	/** Existing selected reconstruction. @type {LocalSunCompactReconstruction} */
	_reconstruction;
	/** Atmosphere-owned cache optical column. @type {CanonicalExponentialCacheColumn} */
	_column;

	/** Creates the explicit Column48/Tail64 reference capability without activating a profile.
	 *
	 * @param {LocalSunCompactTransportDefinition} definition - Paired geometry/topology and unchanged exponential Native15 atmosphere.
	 * @throws {TypeError} - Physical, medium or spectral contracts differ.
	 * @throws {RangeError} - Positive extinction or paired compact support is invalid.
	 */
	constructor(definition) {
		this._definition = definition;
		this._column = new CanonicalExponentialCacheColumn(definition.atmosphere);
		this._reconstruction = new LocalSunCompactReconstruction(definition);
	}

	/** Called by cache integration to calculate retained positive endpoint-linear attenuation weights.
	 *
	 * @param {number} tau - Dimensionless nonnegative cell optical depth.
	 * @returns {readonly number[]} - Lower/upper positive weights.
	 * @throws {RangeError} - Optical depth is negative or nonfinite.
	 */
	attenuationWeights(tau) {
		if (!Number.isFinite(tau) || tau < 0) throw new RangeError('Nonnegative finite cell optical depth required.');
		let total, upper;
		if (tau < 0.01) {
			total = tau * (1 - tau / 2 + (tau * tau) / 6 - tau ** 3 / 24);
			upper = tau * (0.5 - tau / 3 + (tau * tau) / 8 - tau ** 3 / 30);
		} else {
			let transmission = Math.exp(-tau);
			total = 1 - transmission;
			upper = (1 - (1 + tau) * transmission) / tau;
		}
		return [Math.max(0, total - upper), Math.max(0, upper)];
	}

	/** Called by cache sampling to place a squared cumulative-Rayleigh-column node using the retained series branches.
	 *
	 * @param {number} fraction - Closed unit interval fraction.
	 * @param {number} length - Retained physical length in metres.
	 * @param {UnitVector3} direction - Physical unit direction.
	 * @returns {number} - Physical distance in metres along the retained prefix.
	 */
	_pathDistance(fraction, length, direction) {
		if (fraction === 1) return length;
		let q = fraction * fraction,
			height = DistanceMath.toMeters(this._column.rayleighScaleHeight),
			a = (-direction[2] * length) / height;
		if (Math.abs(a) < 0.001) return length * q;
		let x = q * (Math.exp(a) - 1),
			logarithm = Math.abs(x) < 0.001 ? x - (x * x) / 2 + x ** 3 / 3 : Math.log(1 + x);
		return Math.min(length, Math.max(0, (-height / direction[2]) * logarithm));
	}

	/** Called by cache integration to obtain optical depth from its atmosphere owner for geometry-resolved positions.
	 *
	 * @param {FlatCompactRay} ray - Geometry-owned closed physical ray.
	 * @param {number} start - Initial physical distance in metres.
	 * @param {number} end - Final physical distance in metres.
	 * @param {number} channel - Native15 channel.
	 * @returns {number} - Dimensionless atmosphere-owned optical depth.
	 */
	_tau(ray, start, end, channel) {
		let a = DistanceMath.toMetersPosition(ray.positionAt(DistanceMath.inMeters(start))),
			b = DistanceMath.toMetersPosition(ray.positionAt(DistanceMath.inMeters(end)));
		return this._column.opticalDepth({
			startAltitude: DistanceMath.inMeters(a[2]),
			endAltitude: DistanceMath.inMeters(b[2]),
			length: DistanceMath.inMeters(end - start),
			wavelengthIndex: channel,
		});
	}

	/** Call this method to construct one complete geometry-owned ray with independently shortened spectral prefixes.
	 * Tau64 prefixes remain interior samples and never inherit physical-boundary correction.
	 *
	 * @param {LocalSunCompactTransportRayRequest} request - Physical origin/direction and optional explicit shortening.
	 * @returns {LocalSunCompactTransportRayPlan} - Supported physical ray and 49 ordered samples per Native15 channel.
	 * @throws {RangeError} - Geometry support or resulting sampling is invalid.
	 */
	createRayPlan(request) {
		let ray = this._definition.geometry.resolveCompactLocalSunCacheRay({
			...request,
			topology: this._definition.topology,
		});
		let full = DistanceMath.toMeters(ray.length),
			policy = LOCAL_SUN_COMPACT_TRANSPORT_POLICY;
		let channels = this._column.spectralBasis.channels.map((_value, channel) => {
			let retained = full;
			if (this._tau(ray, 0, full, channel) > policy.opticalDepthCutoff) {
				let low = 0,
					high = full;
				for (let i = 0; i < policy.prefixSearchIterations; i++) {
					let mid = (low + high) / 2;
					if (this._tau(ray, 0, mid, channel) > policy.opticalDepthCutoff) high = mid;
					else low = mid;
				}
				retained = high;
			}
			let distances = Array.from({length: policy.intervalCount + 1}, (_unused, i) =>
				DistanceMath.inMeters(this._pathDistance(i / policy.intervalCount, retained, ray.direction)),
			);
			for (let i = 0; i < distances.length; i++)
				if (i > 0 && distances[i].value < distances[i - 1].value)
					throw new RangeError('Ordered compact transport samples required.');
			return Object.freeze({
				retainedLength: DistanceMath.inMeters(retained),
				physicalEnd: retained === full,
				distances: Object.freeze(distances),
			});
		});
		return Object.freeze({policyId: policy.id, ray, channels: Object.freeze(channels)});
	}

	/** Call this method to integrate reconstructed physical scattering density without rewriting stored field values.
	 * Sourcefunction J/kappa is linear between optical-depth endpoints; finite signed values are preserved without clamping.
	 *
	 * @param {LocalSunCompactTransportRequest} request - Supported physical ray and read-only physical J field identity.
	 * @returns {LocalSunCompactTransportResult} - Native15 physical radiance and retained-prefix transmittance with complete ray plan.
	 * @throws {TypeError} - Field/medium quantity or spectral interpretation is incompatible.
	 * @throws {RangeError} - Samples, extinction or resulting output are unsupported/nonfinite.
	 */
	integrate(request) {
		let plan = this.createRayPlan(request),
			radiance = [],
			transmission = [];
		let {geometry, atmosphere} = this._definition;
		for (let [channel, prefix] of plan.channels.entries()) {
			let value = 0,
				transmittance = 1,
				previousSource = 0,
				previousDistance = 0;
			for (let [i, distance] of prefix.distances.entries()) {
				let position = plan.ray.positionAt(distance);
				let packet = this._reconstruction.sampleScatteringDensity({
					position,
					physicalOutgoingDirection: plan.ray.direction,
					reader: request.reader,
					provenanceIdentity: request.provenanceIdentity,
				});
				let extinction = SpectralPacketClass.assert(
					atmosphere.sampleMedium(geometry.resolveAtmosphereCoordinate(position)).extinction,
					{
						basis: this._column.spectralBasis,
						quantity: SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
						units: SPECTRAL_UNITS.INVERSE_LENGTH,
					},
				).values[channel];
				let source = packet.values[channel] / extinction;
				if (!(extinction > 0) || !Number.isFinite(source))
					throw new RangeError('Positive extinction and finite cache sourcefunction required.');
				if (i > 0) {
					let tau = this._tau(plan.ray, previousDistance, distance.value, channel),
						weights = this.attenuationWeights(tau);
					value += transmittance * (previousSource * weights[0] + source * weights[1]);
					transmittance *= Math.exp(-tau);
				}
				previousSource = source;
				previousDistance = distance.value;
			}
			if (!Number.isFinite(value) || !Number.isFinite(transmittance))
				throw new RangeError('Finite compact radiance/transmittance required.');
			radiance.push(value);
			transmission.push(transmittance);
		}
		let basis = this._column.spectralBasis,
			provenanceIdentity = request.provenanceIdentity + ':' + plan.policyId;
		return {
			plan,
			radiance: new SpectralPacketClass({
				basis,
				quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
				units: SPECTRAL_UNITS.RADIANCE_DENSITY,
				values: radiance,
				provenanceIdentity,
			}),
			transmittance: new SpectralPacketClass({
				basis,
				quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
				units: SPECTRAL_UNITS.DIMENSIONLESS,
				values: transmission,
				provenanceIdentity,
			}),
		};
	}
}
