import { CpuSunDiskRadianceCache } from './CpuSunDiskRadianceCache.js';

/** Geometry-owned assembly of source fragments into a common celestial cache. */
export class PrimaryCelestialCache {
	constructor({ geometry, atmosphere, sources }) {
		if (!Array.isArray(sources) || sources.length === 0) throw new TypeError('Primary celestial cache requires sources.');
		this.geometry = geometry; this.atmosphere = atmosphere;
		this.fragments = sources.flatMap((source) => source.buildCacheFragments({ geometryFamily: geometry.describeCelestialContributionDomain().familyId }));
		this.fragments.forEach((fragment, index) => { if (fragment.kind !== 'uniform-disk' || this.fragments.findIndex((other) => other.sourceId === fragment.sourceId) !== index) throw new RangeError('Primary cache accepts one unique uniform-disk fragment per source.'); });
		this.sourceSlots = new Map(this.fragments.map((fragment, index) => [fragment.sourceId, index]));
		this.sources = new Map(sources.map((source) => [source.sourceId, source]));
		this.payloads = new Map(sources.map((source) => [source.sourceId, new CpuSunDiskRadianceCache({ geometry, atmosphere, sourceId: source.sourceId, atmosphericSun: source.atmosphericSun })]));
		this.generationIdentity = JSON.stringify({ geometry: geometry.describeCelestialContributionDomain().familyId, sources: sources.map((source) => source.describeStaticIdentity()), fragments: this.fragments.map((fragment) => ({ sourceId: fragment.sourceId, kind: fragment.kind, width: fragment.width, height: fragment.height })) });
	}

	sampleLight({ geometryQueryPacket, sourceId, sampleDirectionModel }) {
		const slot = this.sourceSlots.get(sourceId);
		if (slot === undefined) throw new RangeError(`Unknown celestial source: ${sourceId}.`);
		const result = this.payloads.get(sourceId).queryGeometrySun(geometryQueryPacket, sampleDirectionModel);
		return { ...result, sourceId, sourceSlot: slot, generationIdentity: this.generationIdentity };
	}
}

export default PrimaryCelestialCache;
