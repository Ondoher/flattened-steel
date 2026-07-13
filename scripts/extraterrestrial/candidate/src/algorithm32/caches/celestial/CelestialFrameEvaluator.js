import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, assertSpectralPacket, createSpectralPacket } from '../../quantities/index.js';

function requireProbe(probe) {
	if (!probe || !Array.isArray(probe.sunSamples) || !Array.isArray(probe.pointSamples)) throw new TypeError('Celestial frame evaluation requires ray-probe Sun and point samples.');
	if (!Number.isFinite(probe.pixelSolidAngleSteradians) || !(probe.pixelSolidAngleSteradians > 0)) throw new RangeError('Ray probe requires a positive pixel solid angle.');
	const sunWeight = probe.sunSamples.reduce((sum, sample) => sum + sample.weight, 0);
	if (probe.sunSamples.some((sample) => !Number.isFinite(sample.weight) || sample.weight < 0) || (probe.sunSamples.length > 0 && Math.abs(sunWeight - 1) > 1e-12)) throw new RangeError('Ray-probe Sun sample weights must be normalized.');
	return probe;
}

function addScaled(target, source, scale) { for (let index = 0; index < target.length; index += 1) target[index] += source[index] * scale; }

/** Consume ray-probe results and celestial caches without choosing projection or visibility. */
export class CelestialFrameEvaluator {
	constructor({ spectralBasis }) { this.spectralBasis = spectralBasis; }

	evaluate({ pathRadiance, geometryQueryPacket, rayProbe, starCache, sunCache }) {
		const path = assertSpectralPacket(pathRadiance, { quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, basis: this.spectralBasis });
		const probe = requireProbe(rayProbe);
		if (!geometryQueryPacket?.receiverPositionModelMeters) throw new TypeError('Celestial frame evaluation requires a geometry query packet.');
		const celestial = new Float64Array(this.spectralBasis.channelCount);
		for (const sample of probe.sunSamples) {
			if (sample.visible !== true) continue;
			const result = sunCache.queryGeometrySun(geometryQueryPacket, sample.directionToSourceModel);
			if (result.classification === 'clear') addScaled(celestial, result.values, sample.weight);
		}
		for (const sample of probe.pointSamples) {
			if (sample.visible !== true) continue;
			if (!Number.isFinite(sample.responseWeight) || sample.responseWeight < 0) throw new RangeError('Ray-probe point response weight must be finite and nonnegative.');
			const result = starCache.queryMember(sample.memberId, geometryQueryPacket.receiverPositionModelMeters, sample.directionToSourceModel);
			if (result.classification === 'clear') addScaled(celestial, result.values, sample.responseWeight / probe.pixelSolidAngleSteradians);
		}
		const celestialRadiance = createSpectralPacket({ basis: this.spectralBasis, quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, values: celestial, provenanceIdentity: `ray-probe-celestial:${geometryQueryPacket.queryStateFingerprint}` });
		const preDisplayRadiance = createSpectralPacket({ basis: this.spectralBasis, quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, values: path.values.map((value, index) => value + celestial[index]), provenanceIdentity: `pre-display:${path.contentHash}:${celestialRadiance.contentHash}` });
		return { pathRadiance: path, celestialRadiance, preDisplayRadiance };
	}
}

export default CelestialFrameEvaluator;
