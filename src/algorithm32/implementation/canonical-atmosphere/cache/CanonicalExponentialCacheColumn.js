import DistanceMath from '../../../math/DistanceMath.js';
import {
	SpectralBasis as SpectralBasisClass,
	SpectralPacket as SpectralPacketClass,
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
} from '../../../spectral-values/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/native-15/native-15-profile.js';

/** Atmosphere-owned cache-column adapter for the selected two-exponential Native15 medium; physical models are unchanged. */
export class CanonicalExponentialCacheColumn {
	/** Fixed accepted atmosphere facts. @type {CanonicalCacheColumnAtmosphere} */
	_atmosphere;
	/** Physical Rayleigh scale height in metres. @type {number} */
	_rayleighHeight;
	/** Physical Mie scale height in metres. @type {number} */
	_mieHeight;
	/** Creates an atmosphere-owned numerical cache adapter from existing physical facts.
	 *
	 * @param {CanonicalCacheColumnAtmosphere} atmosphere - Two-exponential Native15 medium with no ozone.
	 * @throws {TypeError} - Basis, units or coefficient quantities differ.
	 * @throws {RangeError} - Scale heights or positive extinction support are invalid, or ozone is enabled.
	 */
	constructor(atmosphere) {
		SpectralBasisClass.assertCompatible(
			atmosphere.spectralBasis,
			NATIVE_15_SPECTRAL_BASIS,
			'Cache column Native15',
		);
		if (atmosphere.constants.ozoneAbsorptionEnabled) throw new RangeError('Ozone cache columns are unsupported.');
		DistanceMath.assertDistance(atmosphere.constants.rayleighScaleHeight, 'Rayleigh column scale height');
		DistanceMath.assertDistance(atmosphere.constants.mieScaleHeight, 'Mie column scale height');
		this._rayleighHeight = DistanceMath.toMeters(atmosphere.constants.rayleighScaleHeight);
		this._mieHeight = DistanceMath.toMeters(atmosphere.constants.mieScaleHeight);
		if (!(this._rayleighHeight > 0 && this._mieHeight > 0))
			throw new RangeError('Positive column scale heights required.');
		let rayleigh = SpectralPacketClass.assert(atmosphere.seaLevelRayleighScattering, {
			basis: atmosphere.spectralBasis,
			quantity: SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
			units: SPECTRAL_UNITS.INVERSE_LENGTH,
		});
		let mie = SpectralPacketClass.assert(atmosphere.seaLevelMieExtinction, {
			basis: atmosphere.spectralBasis,
			quantity: SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
			units: SPECTRAL_UNITS.INVERSE_LENGTH,
		});
		if (rayleigh.values.some((v, i) => v < 0 || mie.values[i] < 0 || !(v + mie.values[i] > 0)))
			throw new RangeError('Positive exponential extinction support required.');
		this._atmosphere = atmosphere;
	}

	/** Physical placement scale, taken from the accepted atmosphere rather than a cache constant.
	 *
	 * @returns {Distance} - Rayleigh scale height.
	 */
	get rayleighScaleHeight() {
		return DistanceMath.inMeters(this._rayleighHeight);
	}

	/** Spectral interpretation shared by the cache.
	 *
	 * @returns {SpectralBasis} - Accepted Native15 basis.
	 */
	get spectralBasis() {
		return this._atmosphere.spectralBasis;
	}

	/** Called by optical depth to apply the retained exponential-column cubic branch.
	 *
	 * @param {CanonicalCacheDensityColumnRequest} request - Unit-bearing physical segment and density scale height.
	 * @returns {Distance} - Nonnegative integrated density with physical length units.
	 * @throws {RangeError} - Physical values are nonfinite, negative or unsupported.
	 */
	densityColumn(request) {
		for (let value of [request.startAltitude, request.endAltitude, request.length, request.scaleHeight])
			DistanceMath.assertDistance(value, 'Cache density column');
		let z0 = DistanceMath.toMeters(request.startAltitude),
			z1 = DistanceMath.toMeters(request.endAltitude),
			length = DistanceMath.toMeters(request.length),
			scaleHeight = DistanceMath.toMeters(request.scaleHeight);
		if (![z0, z1, length, scaleHeight].every(Number.isFinite) || z0 < 0 || z1 < 0 || length < 0 || scaleHeight <= 0)
			throw new RangeError('Supported physical exponential segment required.');
		let q = (z1 - z0) / scaleHeight;
		let factor = Math.abs(q) < 0.01 ? 1 - q / 2 + (q * q) / 6 - q ** 3 / 24 : (1 - Math.exp(-q)) / q;
		return DistanceMath.inMeters(Math.max(0, Math.exp(-z0 / scaleHeight) * length * factor));
	}

	/** Call this method to resolve dimensionless cache optical depth from unchanged atmosphere coefficient packets.
	 *
	 * @param {CanonicalCacheColumnRequest} request - Unit-bearing altitudes, length and Native15 channel.
	 * @returns {number} - Nonnegative dimensionless optical depth.
	 * @throws {TypeError} - Physical units differ.
	 * @throws {RangeError} - Channel, segment or resulting depth is unsupported.
	 */
	opticalDepth(request) {
		for (let value of [request.startAltitude, request.endAltitude, request.length])
			DistanceMath.assertDistance(value, 'Cache optical column');
		let c = request.wavelengthIndex;
		if (!Number.isSafeInteger(c) || c < 0 || c >= this.spectralBasis.channelCount)
			throw new RangeError('Allocated column channel required.');
		let z0 = DistanceMath.toMeters(request.startAltitude),
			z1 = DistanceMath.toMeters(request.endAltitude),
			length = DistanceMath.toMeters(request.length);
		let segment = {
			startAltitude: DistanceMath.inMeters(z0),
			endAltitude: DistanceMath.inMeters(z1),
			length: DistanceMath.inMeters(length),
		};
		let tau =
			this._atmosphere.seaLevelRayleighScattering.values[c] *
				DistanceMath.toMeters(
					this.densityColumn({...segment, scaleHeight: DistanceMath.inMeters(this._rayleighHeight)}),
				) +
			this._atmosphere.seaLevelMieExtinction.values[c] *
				DistanceMath.toMeters(
					this.densityColumn({...segment, scaleHeight: DistanceMath.inMeters(this._mieHeight)}),
				);
		if (!Number.isFinite(tau) || tau < 0) throw new RangeError('Finite nonnegative optical column required.');
		return tau;
	}
}
