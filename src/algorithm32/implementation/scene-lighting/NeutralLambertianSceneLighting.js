import VectorMath from '../../math/VectorMath.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralMath, SpectralPacket} from '../../spectral-values/index.js';

/** Neutral reflectance used by the accepted CR3 production boundary. */
export const NEUTRAL_LAMBERTIAN_REFLECTANCE = 0.18;

/** Unit-bearing neutral Lambertian response derived from receiver irradiance. */
export class NeutralLambertianSceneLighting {
	/**
	 * Evaluate one surface from direct-normal and already-oriented diffuse irradiance.
	 *
	 * @param {NeutralLambertianSceneLightingRequest} request - Physical lighting inputs.
	 * @returns {NeutralLambertianSceneLightingResponse} - Separate and additive irradiance/radiance packets.
	 */
	evaluate(request) {
		if (!request || typeof request !== 'object') {
			throw new TypeError('Neutral Lambertian scene lighting requires a request.');
		}
		if (typeof request.identity !== 'string' || request.identity.length === 0) {
			throw new TypeError('Neutral Lambertian scene lighting requires an identity.');
		}
		const directNormal = this._acceptIrradiance(request.directNormal, 'direct-normal');
		const diffuseIrradiance = this._acceptIrradiance(request.diffuseIrradiance, 'diffuse');
		SpectralPacket.assertCompatible(directNormal, diffuseIrradiance, {
			sameQuantity: true,
			sameUnits: true,
			sameSemantics: true,
		});
		const surfaceNormal = this._normalize(request.surfaceNormal, 'surfaceNormal');
		const directionToSource = this._normalize(request.directionToSource, 'directionToSource');
		const reflectance = request.reflectance ?? NEUTRAL_LAMBERTIAN_REFLECTANCE;
		if (!Number.isFinite(reflectance) || reflectance < 0 || reflectance > 1) {
			throw new RangeError('Neutral Lambertian reflectance must be finite and in [0, 1].');
		}

		const directCosine = Math.max(0, VectorMath.dot(surfaceNormal, directionToSource));
		const directIrradiance = /** @type {SpectralIrradiancePacket} */ (
			SpectralMath.scaleSpectralPacket(directNormal, directCosine, {
				provenanceIdentity: `${request.identity}:direct-irradiance:cosine-${directCosine}`,
			})
		);
		const combinedIrradiance = /** @type {SpectralIrradiancePacket} */ (
			SpectralMath.addSpectralPackets(directIrradiance, diffuseIrradiance, {
				provenanceIdentity: `${request.identity}:combined-irradiance`,
			})
		);
		const lambertianScale = reflectance / Math.PI;
		const directRadiance = this._radianceFromIrradiance(
			directIrradiance,
			lambertianScale,
			`${request.identity}:direct-outgoing-radiance`,
		);
		const diffuseRadiance = this._radianceFromIrradiance(
			diffuseIrradiance,
			lambertianScale,
			`${request.identity}:diffuse-outgoing-radiance`,
		);
		const combinedRadiance = /** @type {SpectralRadiancePacket} */ (
			SpectralMath.addSpectralPackets(directRadiance, diffuseRadiance, {
				provenanceIdentity: `${request.identity}:combined-outgoing-radiance`,
			})
		);

		return Object.freeze({
			identity: request.identity,
			reflectance,
			directCosine,
			directIrradiance,
			diffuseIrradiance,
			combinedIrradiance,
			directRadiance,
			diffuseRadiance,
			combinedRadiance,
		});
	}

	_acceptIrradiance(value, label) {
		const packet = /** @type {SpectralIrradiancePacket} */ (
			SpectralPacket.assert(value, {
				quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
				units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			})
		);
		if (packet.values.some((channel) => !Number.isFinite(channel) || channel < 0)) {
			throw new RangeError(`Neutral Lambertian ${label} irradiance must be finite and nonnegative.`);
		}
		return packet;
	}

	_normalize(value, label) {
		if (!Array.isArray(value) || value.length !== 3 || value.some((entry) => !Number.isFinite(entry))) {
			throw new TypeError(`Neutral Lambertian ${label} must contain three finite values.`);
		}
		if (!(VectorMath.length(value) > 0)) {
			throw new RangeError(`Neutral Lambertian ${label} must have nonzero length.`);
		}
		return VectorMath.normalize(value);
	}

	_radianceFromIrradiance(irradiance, scale, provenanceIdentity) {
		return /** @type {SpectralRadiancePacket} */ (
			new SpectralPacket({
				basis: irradiance.basis,
				quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
				units: SPECTRAL_UNITS.RADIANCE_DENSITY,
				semantics: irradiance.semantics,
				values: irradiance.values.map((value) => value * scale),
				provenanceIdentity,
			})
		);
	}
}
