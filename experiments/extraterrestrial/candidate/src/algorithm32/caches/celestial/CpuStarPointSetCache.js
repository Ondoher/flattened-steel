import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	assertSpectralPacket,
} from '../../quantities/index.js';

function requireArray(value, label) {
	if (!Array.isArray(value) || value.length === 0) throw new TypeError(`${label} must be a nonempty array.`);
	return value;
}

function zero(channelCount) { return new Float64Array(channelCount); }

function interpolate(values, hStencil, uStencil, channelCount) {
	const result = zero(channelCount);
	for (let hTap = 0; hTap < hStencil.indices.length; hTap += 1) {
		for (let uTap = 0; uTap < uStencil.indices.length; uTap += 1) {
			const weight = hStencil.weights[hTap] * uStencil.weights[uTap];
			const offset = ((hStencil.indices[hTap] * values.uCount + uStencil.indices[uTap]) * channelCount);
			for (let channel = 0; channel < channelCount; channel += 1) result[channel] += values.data[offset + channel] * weight;
		}
	}
	return result;
}

/** Build and query complete binary64 transported point irradiance fields. */
export class CpuStarPointSetCache {
	constructor({ geometry, atmosphere, members }) {
		if (!geometry || typeof geometry.describeCelestialContributionDomain !== 'function') throw new TypeError('CPU star cache requires geometry.');
		if (!atmosphere || typeof atmosphere.integrateOpticalDepth !== 'function') throw new TypeError('CPU star cache requires an atmosphere transport owner.');
		this.geometry = geometry;
		this.atmosphere = atmosphere;
		this.domain = geometry.describeCelestialContributionDomain();
		this.members = requireArray(members, 'Star members').map((member) => {
			if (!member || typeof member.memberId !== 'string') throw new TypeError('Star member requires a memberId.');
			const irradiance = assertSpectralPacket(member.sourceIrradiance, {
				quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
				units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
				basis: atmosphere.spectralBasis,
			});
			return { memberId: member.memberId, sourceIrradiance: irradiance };
		}).sort((left, right) => left.memberId.localeCompare(right.memberId));
		if (new Set(this.members.map((member) => member.memberId)).size !== this.members.length) throw new RangeError('Star member ids must be unique.');
		this.channelCount = atmosphere.spectralBasis.channelCount;
		this.fieldIdentity = JSON.stringify({
			familyId: this.domain.familyId,
			altitudeNodesMeters: this.domain.altitudeNodesMeters,
			uNodes: this.domain.uNodes,
			atmosphereBasis: atmosphere.spectralBasis.contentHash,
			members: this.members.map((member) => ({ memberId: member.memberId, sourceIrradianceHash: member.sourceIrradiance.contentHash })),
		});
		this.memberFields = new Map();
		this._build();
	}

	_build() {
		// For directional point sources the atmospheric path is a geometry/domain
		// fact, not a member-radiometry fact. Compute it once, then apply each
		// source-owned apparent packet. This retains the exact G3 field equation
		// while making catalog-scale construction bounded by the sample lattice.
		const transmittanceField = new Float64Array(this.domain.altitudeNodesMeters.length * this.domain.uNodes.length * this.channelCount);
		for (let hIndex = 0; hIndex < this.domain.altitudeNodesMeters.length; hIndex += 1) {
			for (let uIndex = 0; uIndex < this.domain.uNodes.length; uIndex += 1) {
				const sample = this.geometry.resolveCelestialBuildSample({ h: this.domain.altitudeNodesMeters[hIndex], u: this.domain.uNodes[uIndex] }, { sourceId: this.members[0].memberId });
				const transmittance = sample.stableVisibility === 'ground-horizon'
					? zero(this.channelCount)
					: this.atmosphere.integrateOpticalDepth(sample.atmospherePath).transmittance.values;
				const offset = ((hIndex * this.domain.uNodes.length + uIndex) * this.channelCount);
				for (let channel = 0; channel < this.channelCount; channel += 1) transmittanceField[offset + channel] = transmittance[channel];
			}
		}
		for (const member of this.members) {
			const data = new Float64Array(this.domain.altitudeNodesMeters.length * this.domain.uNodes.length * this.channelCount);
			for (let hIndex = 0; hIndex < this.domain.altitudeNodesMeters.length; hIndex += 1) {
				for (let uIndex = 0; uIndex < this.domain.uNodes.length; uIndex += 1) {
					const offset = ((hIndex * this.domain.uNodes.length + uIndex) * this.channelCount);
					for (let channel = 0; channel < this.channelCount; channel += 1) data[offset + channel] = member.sourceIrradiance.values[channel] * transmittanceField[offset + channel];
				}
			}
			this.memberFields.set(member.memberId, { data, uCount: this.domain.uNodes.length });
		}
	}

	queryMember(memberId, receiverPositionModelMeters, directionToSourceModel) {
		const field = this.memberFields.get(memberId);
		if (!field) throw new RangeError(`Unknown star member: ${memberId}.`);
		const stencil = this.geometry.resolveCelestialDirectionStencil(receiverPositionModelMeters, directionToSourceModel);
		if (stencil.classification !== 'clear') return { memberId, classification: stencil.classification, values: zero(this.channelCount), stencil };
		return { memberId, classification: 'clear', values: interpolate(field, stencil.hStencil, stencil.uStencil, this.channelCount), stencil };
	}

	queryPointSet(receiverPositionModelMeters, directionsByMemberId) {
		const members = this.members.map((member) => this.queryMember(member.memberId, receiverPositionModelMeters, directionsByMemberId[member.memberId]));
		const aggregate = zero(this.channelCount);
		for (const member of members) for (let channel = 0; channel < this.channelCount; channel += 1) aggregate[channel] += member.values[channel];
		return { members, aggregate };
	}
}

export default CpuStarPointSetCache;
