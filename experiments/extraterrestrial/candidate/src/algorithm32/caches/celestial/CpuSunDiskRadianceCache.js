import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	assertSpectralPacket,
	createSpectralPacket,
} from '../../quantities/index.js';

function zero(channelCount) { return new Float64Array(channelCount); }
function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }

function normalize(vector, label) {
	if (!Array.isArray(vector) || vector.length !== 3 || !vector.every(Number.isFinite)) throw new TypeError(`${label} must be a finite 3-vector.`);
	const length = Math.hypot(...vector);
	if (!(length > 0)) throw new RangeError(`${label} must be nonzero.`);
	return vector.map((value) => value / length);
}

function interpolate(field, hStencil, uStencil, channelCount) {
	const result = zero(channelCount);
	for (let hTap = 0; hTap < hStencil.indices.length; hTap += 1) for (let uTap = 0; uTap < uStencil.indices.length; uTap += 1) {
		const weight = hStencil.weights[hTap] * uStencil.weights[uTap];
		const offset = ((hStencil.indices[hTap] * field.uCount + uStencil.indices[uTap]) * channelCount);
		for (let channel = 0; channel < channelCount; channel += 1) result[channel] += field.data[offset + channel] * weight;
	}
	return result;
}

/**
 * Derive and query complete binary64 Sun-disk radiance from one existing
 * atmospheric DistantSunLightSource. This cache owns no Sun definition or
 * transport physics; geometry supplies live placement and the atmosphere
 * supplies transmittance.
 */
export class CpuSunDiskRadianceCache {
	constructor({ geometry, atmosphere, sourceId, atmosphericSun }) {
		if (!geometry || typeof geometry.describeCelestialContributionDomain !== 'function') throw new TypeError('CPU Sun cache requires geometry.');
		if (!atmosphere || typeof atmosphere.integrateOpticalDepth !== 'function') throw new TypeError('CPU Sun cache requires an atmosphere transport owner.');
		if (typeof sourceId !== 'string' || sourceId.length === 0) throw new TypeError('CPU Sun cache requires a canonical sourceId.');
		if (!atmosphericSun?.configuration || typeof atmosphericSun.describe !== 'function') throw new TypeError('CPU Sun cache requires the existing atmospheric Sun light source.');
		const irradiance = assertSpectralPacket(atmosphericSun.configuration.sourceIrradiance, {
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			basis: atmosphere.spectralBasis,
		});
		const angularRadiusRadians = atmosphericSun.configuration.angularRadius?.value;
		if (!Number.isFinite(angularRadiusRadians) || !(angularRadiusRadians > 0 && angularRadiusRadians < Math.PI / 2)) throw new RangeError('Atmospheric Sun must have a positive finite angular radius in radians.');
		this.geometry = geometry;
		this.atmosphere = atmosphere;
		this.sourceId = sourceId;
		this.domain = geometry.describeCelestialContributionDomain();
		this.angularRadiusRadians = angularRadiusRadians;
		this.channelCount = atmosphere.spectralBasis.channelCount;
		const diskSolidAngleSteradians = 2 * Math.PI * (1 - Math.cos(angularRadiusRadians));
		this.sourceRadiance = createSpectralPacket({
			basis: atmosphere.spectralBasis,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			values: irradiance.values.map((value) => value / diskSolidAngleSteradians),
			provenanceIdentity: `derived-uniform-disk-radiance:${sourceId}:${irradiance.contentHash}`,
		});
		this.fieldIdentity = JSON.stringify({
			familyId: this.domain.familyId,
			altitudeNodesMeters: this.domain.altitudeNodesMeters,
			uNodes: this.domain.uNodes,
			atmosphereBasis: atmosphere.spectralBasis.contentHash,
			sourceId,
			atmosphericSunIrradianceHash: irradiance.contentHash,
			angularRadiusRadians,
		});
		this.field = { data: new Float64Array(this.domain.altitudeNodesMeters.length * this.domain.uNodes.length * this.channelCount), uCount: this.domain.uNodes.length };
		this._build();
	}

	_build() {
		for (let hIndex = 0; hIndex < this.domain.altitudeNodesMeters.length; hIndex += 1) for (let uIndex = 0; uIndex < this.domain.uNodes.length; uIndex += 1) {
			const sample = this.geometry.resolveCelestialBuildSample({ h: this.domain.altitudeNodesMeters[hIndex], u: this.domain.uNodes[uIndex] }, { sourceId: this.sourceId });
			const transmittance = sample.stableVisibility === 'ground-horizon' ? zero(this.channelCount) : this.atmosphere.integrateOpticalDepth(sample.atmospherePath).transmittance.values;
			const offset = ((hIndex * this.domain.uNodes.length + uIndex) * this.channelCount);
			for (let channel = 0; channel < this.channelCount; channel += 1) this.field.data[offset + channel] = this.sourceRadiance.values[channel] * transmittance[channel];
		}
	}

	query(receiverPositionModelMeters, sunCenterDirectionModel, sampleDirectionModel) {
		const center = normalize(sunCenterDirectionModel, 'Sun center direction');
		const sampleDirection = normalize(sampleDirectionModel, 'Sun sample direction');
		const angularDistanceRadians = Math.acos(clamp(center[0] * sampleDirection[0] + center[1] * sampleDirection[1] + center[2] * sampleDirection[2], -1, 1));
		if (angularDistanceRadians > this.angularRadiusRadians + 64 * Number.EPSILON) return { classification: 'out-of-support', values: zero(this.channelCount), angularDistanceRadians };
		// Geometry is the sole horizon-classification owner. Preserve the caller's
		// validated vector for that handoff so an extra normalization cannot move a
		// tangent ray across its exact boundary.
		const stencil = this.geometry.resolveCelestialDirectionStencil(receiverPositionModelMeters, sampleDirectionModel);
		if (stencil.classification !== 'clear') return { classification: stencil.classification, values: zero(this.channelCount), stencil, angularDistanceRadians };
		return { classification: 'clear', values: interpolate(this.field, stencil.hStencil, stencil.uStencil, this.channelCount), stencil, angularDistanceRadians };
	}

	queryGeometrySun(geometryQueryPacket, sampleDirectionModel) {
		const sun = geometryQueryPacket?.layerQueries?.sun;
		if (!sun || sun.sourceId !== this.sourceId || !sun.angularSupport) throw new RangeError('Geometry query packet does not describe this shared Sun.');
		if (sun.angularSupport.angularRadiusRadians !== this.angularRadiusRadians) throw new RangeError('Geometry query packet Sun support differs from the atmospheric Sun.');
		if (sun.angularSupport.classification === 'empty') return { classification: 'empty-support', values: zero(this.channelCount), support: sun.angularSupport };
		return { ...this.query(sun.receiverPositionModelMeters, sun.directionToSourceModel, sampleDirectionModel), support: sun.angularSupport };
	}
}

export default CpuSunDiskRadianceCache;
