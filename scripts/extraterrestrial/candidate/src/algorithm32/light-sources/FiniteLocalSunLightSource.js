import { LocalSunCacheController } from './LocalSunCacheController.js';
import { LocalSunCacheSource } from './LocalSunCacheSource.js';
import { LOCAL_SUN_SOURCE_TRANSMITTANCE_INTERVAL_COUNT } from './local-sun-consts.js';
import { createShaderContribution } from '../shader/shaderContribution.js';
import DistanceMath from '../utils/DistanceMath.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, assertSpectralPacket } from '../quantities/index.js';

/**
 * Finite local body used by the normal Flat atmospheric-cache path.
 *
 * Its only radiometric input is surface radiance. LocalSunCacheSource derives
 * receiver irradiance from the geometry-resolved visible solid angle.
 */
export class FiniteLocalSunLightSource {
	constructor({ sourceKey = 'local-sun', position, radius, surfaceRadiance, spectralBasis, sourceTransmittanceIntervalCount = LOCAL_SUN_SOURCE_TRANSMITTANCE_INTERVAL_COUNT }) {
		if (!sourceKey || typeof sourceKey !== 'string') throw new TypeError('Finite local Sun requires sourceKey.');
		DistanceMath.assertPosition(position, 'Finite local Sun position');
		DistanceMath.assertDistance(radius, 'Finite local Sun radius');
		if (!(DistanceMath.toMeters(radius) > 0)) throw new RangeError('Finite local Sun radius must be positive.');
		if (!Number.isInteger(sourceTransmittanceIntervalCount) || sourceTransmittanceIntervalCount < 1) throw new RangeError('Finite local Sun source interval count must be positive.');
		this._configuration = Object.freeze({
			sourceKey,
			position: Object.freeze({ coordinates: DistanceMath.toMetersPosition(position), units: 'meters' }),
			radius: DistanceMath.inMeters(DistanceMath.toMeters(radius)),
			surfaceRadiance: assertSpectralPacket(surfaceRadiance, { quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, basis: spectralBasis }),
			sourceTransmittanceIntervalCount,
		});
		this.spectralBasis = this._configuration.surfaceRadiance.basis;
	}

	get id() { return this._configuration.sourceKey; }
	get configuration() { return this._configuration; }

	describe() {
		return {
			kind: 'finite-local-sun-light-source-v1', sourceKey: this.id,
			position: this._configuration.position, radius: this._configuration.radius,
			surfaceRadianceHash: this._configuration.surfaceRadiance.contentHash,
			sourceTransmittanceIntervalCount: this._configuration.sourceTransmittanceIntervalCount,
		};
	}

	createShaderContribution(request) {
		return createShaderContribution({
			id: 'finite-local-sun-runtime-identity', owner: 'lightSource',
			descriptorFingerprint: request.descriptor.lightSource.fingerprint,
			compatibilityTags: request.descriptor.lightSource.compatibilityTags,
			diagnostics: { mode: 'finite-radiance-local-cache', sourceKey: this.id, directViewTerm: false },
		});
	}

	createCacheController({ backend, scheduler }) {
		return new LocalSunCacheController({
			source: new LocalSunCacheSource({ source: this }), backend, scheduler,
		});
	}
}

export default FiniteLocalSunLightSource;
