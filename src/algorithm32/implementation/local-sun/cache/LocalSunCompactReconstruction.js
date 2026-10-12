import DistanceMath from '../../../math/DistanceMath.js';
import {
	SpectralBasis,
	SpectralPacket as SpectralPacketClass,
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
} from '../../../spectral-values/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/native-15/native-15-profile.js';

/** Cache-owned geometric-density interpolation; physical fields and physical models retain their existing meaning. */
export class LocalSunCompactReconstruction {
	/** Fixed geometry/topology/medium collaborators. @type {LocalSunCompactReconstructionDefinition} */
	_definition;
	/** Independently owned node-major/channel-minor log factors. @type {Float64Array} */
	_nodeLogs;
	/** Accepted shared Native15 basis. @type {SpectralBasis} */
	_basis;

	/** Creates a compact reconstruction policy from geometry-paired topology and an existing Native15 atmosphere.
	 * Only positive finite extinction factors are supported; vacuum or changed bases require another policy.
	 *
	 * @param {LocalSunCompactReconstructionDefinition} definition - Complete physical collaborators.
	 * @throws {RangeError} - Basis, node extent, pairing or positive factor support is invalid.
	 * @throws {TypeError} - Units, medium packet or collaborators violate their contracts.
	 */
	constructor(definition) {
		this._definition = definition;
		this._basis = SpectralBasis.assert(definition.atmosphere.spectralBasis);
		SpectralBasis.assertCompatible(this._basis, NATIVE_15_SPECTRAL_BASIS, 'Compact reconstruction Native15 basis');
		let count = definition.topology.positionCount;
		if (!Number.isSafeInteger(count) || count <= 0)
			throw new RangeError('Compact reconstruction requires allocated positions.');
		this._nodeLogs = new Float64Array(count * this._basis.channelCount);
		for (let positionIndex = 0; positionIndex < count; positionIndex++) {
			let position = definition.geometry.resolveCompactLocalSunCacheNodePosition({
				topology: definition.topology,
				positionIndex,
			});
			this._nodeLogs.set(this._logFactors(position), positionIndex * this._basis.channelCount);
		}
	}

	/** Shared Native15 spectral interpretation.
	 *
	 * @returns {SpectralBasis} - Accepted basis.
	 */
	get spectralBasis() {
		return this._basis;
	}

	/** Called by reconstruction to evaluate log(f/(1 m^-1)) from existing medium and geometry facts.
	 * Only factor ratios enter physical J lookup, so the reference extinction unit cancels exactly.
	 *
	 * @param {Position} position - Physical position inside already checked complete support.
	 * @returns {readonly number[]} - Finite dimensionless log factors in Native15 channel order.
	 * @throws {RangeError} - Distance, extinction or resulting factor lacks positive finite support.
	 * @throws {TypeError} - Medium interpretation or physical units are incompatible.
	 */
	_logFactors(position) {
		let {geometry, atmosphere, topology} = this._definition;
		let coordinate = geometry.resolveAtmosphereCoordinate(position);
		let medium = atmosphere.sampleMedium(coordinate);
		let extinction = SpectralPacketClass.assert(medium.extinction, {
			basis: this._basis,
			quantity: SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
			units: SPECTRAL_UNITS.INVERSE_LENGTH,
		});
		let relative = geometry.resolveSourceRelativePosition({position});
		DistanceMath.assertDistance(relative.distanceFromSource, 'Compact reconstruction source distance');
		DistanceMath.assertDistance(topology.sourceHeight, 'Compact reconstruction source height');
		let distance = DistanceMath.toMeters(relative.distanceFromSource),
			height = DistanceMath.toMeters(topology.sourceHeight);
		if (!(distance > 0 && height > 0)) throw new RangeError('Positive finite source geometry required.');
		let dilutionLog = 2 * Math.log(height / distance);
		return extinction.values.map((value) => {
			let log = Math.log(value) + dilutionLog;
			if (!(value > 0) || !Number.isFinite(log))
				throw new RangeError('Positive finite reconstruction extinction required.');
			return log;
		});
	}

	/** Call this method to inspect independently owned node logs without exposing mutable cache storage.
	 *
	 * @param {number} positionIndex - Allocated compact address.
	 * @returns {readonly number[]} - Copied finite log factors.
	 * @throws {RangeError} - Address is unallocated.
	 */
	nodeLogFactors(positionIndex) {
		if (
			!Number.isSafeInteger(positionIndex) ||
			positionIndex < 0 ||
			positionIndex >= this._definition.topology.positionCount
		)
			throw new RangeError('Unallocated reconstruction factor node.');
		let offset = positionIndex * this._basis.channelCount;
		return Array.from(this._nodeLogs.subarray(offset, offset + this._basis.channelCount));
	}

	/** Call this method to resolve complete spatial/angular support and positive spectral factor ratios.
	 * Spectral scales multiply each original tap weight; their sum is intentionally not renormalized.
	 *
	 * @param {ScatteringCacheDirectionRequest} request - Physical unit-bearing position and outgoing direction.
	 * @returns {readonly LocalSunCompactSpectralTap[]} - Qualified per-tap angular support and channel-wise restoration.
	 * @throws {RangeError} - Complete support or a positive finite factor ratio is unavailable.
	 * @throws {TypeError} - Physical units or collaborator medium interpretation is invalid.
	 */
	resolveStencil(request) {
		let taps = this._definition.geometry.resolveCompactLocalSunCacheStencil({
			...request,
			topology: this._definition.topology,
		});
		let queryLogs = this._logFactors(request.position);
		return taps.map((tap) => {
			let nodeLogs = this.nodeLogFactors(tap.positionIndex);
			let spectralScales = queryLogs.map((log, channel) => {
				let scale = Math.exp(log - nodeLogs[channel]);
				if (!(scale > 0) || !Number.isFinite(scale))
					throw new RangeError('Unsupported reconstruction factor ratio.');
				return scale;
			});
			return {...tap, spectralScales};
		});
	}

	/** Call this method to reconstruct physical spectral J using a read-only physical-field reader.
	 * Zero and signed finite samples retain their sign; no field write, brightness fit or beam attenuation occurs.
	 *
	 * @param {LocalSunCompactDensitySampleRequest} request - Physical query, field reader and parent field identity.
	 * @returns {SpectralScatteringDensityPacket} - Physical J in W m^-3 sr^-1 nm^-1 with Native15 semantics.
	 * @throws {RangeError} - Complete support, factor ratio or field/output finiteness fails.
	 * @throws {TypeError} - Units, packet interpretation, provenance or reader contract is invalid.
	 */
	sampleScatteringDensity(request) {
		if (typeof request.reader?.readScalar !== 'function')
			throw new TypeError('Read-only physical field reader required.');
		let taps = this.resolveStencil(request),
			values = new Float64Array(this._basis.channelCount);
		for (let tap of taps)
			for (let [directionTap, directionIndex] of tap.directionStencil.indices.entries())
				for (let wavelengthIndex = 0; wavelengthIndex < values.length; wavelengthIndex++) {
					let value = request.reader.readScalar({
						positionIndex: tap.positionIndex,
						directionIndex,
						wavelengthIndex,
					});
					if (!Number.isFinite(value)) throw new RangeError('Nonfinite physical field sample.');
					values[wavelengthIndex] +=
						value *
						tap.positionWeight *
						tap.directionStencil.weights[directionTap] *
						tap.spectralScales[wavelengthIndex];
				}
		return /** @type {SpectralScatteringDensityPacket} */ (
			/** @type {unknown} */ (
				new SpectralPacketClass({
					basis: this._basis,
					quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
					units: SPECTRAL_UNITS.SCATTERING_DENSITY,
					values,
					provenanceIdentity: request.provenanceIdentity,
				})
			)
		);
	}
}
