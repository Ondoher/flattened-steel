/**
 * Application-owned celestial-source roster for the first runtime family.
 * Geometry remains responsible for primary-cache construction and coordinates.
 */
export class CelestialRuntimeParticipant {
	constructor({ sources, primarySourceId = undefined }) {
		if (!Array.isArray(sources) || sources.length < 1) {
			throw new TypeError('Celestial runtime participant requires at least one source.');
		}
		if (!sources.every((source) => source && typeof source.sourceId === 'string'
			&& typeof source.describeStaticIdentity === 'function')) {
			throw new TypeError('Celestial runtime sources must expose sourceId and describeStaticIdentity().');
		}
		const ids = sources.map((source) => source.sourceId);
		if (new Set(ids).size !== ids.length) {
			throw new RangeError('Celestial runtime source identifiers must be unique.');
		}
		this.sources = Object.freeze([...sources]);
		this.primarySourceId = primarySourceId ?? ids[0];
		if (!ids.includes(this.primarySourceId)) {
			throw new RangeError('Celestial primary source must belong to the participant roster.');
		}
		this.cacheSources = Object.freeze(this.sources.filter((source) => typeof source.buildCacheFragments === 'function'));
		this.pointSources = Object.freeze(this.sources.filter((source) => typeof source.describePointSourceDefinitions === 'function'
			&& typeof source.createPointPlacementStates === 'function'));
		this.stellarPointSource = this.pointSources.length === 0 ? null : this.pointSources.length === 1
			&& typeof this.pointSources[0].createTransportMembers === 'function'
			&& typeof this.pointSources[0].describeCanonicalPointDirections === 'function'
			? this.pointSources[0]
			: (() => { throw new RangeError('The first runtime supports at most one packet-owning stellar point source.'); })();
	}

	describe() {
		return Object.freeze({
			kind: 'celestial-runtime-participant',
			primarySourceId: this.primarySourceId,
			cacheSourceIds: this.cacheSources.map((source) => source.sourceId),
			pointSourceIds: this.pointSources.map((source) => source.sourceId),
			stellarPointSourceId: this.stellarPointSource?.sourceId ?? null,
			sources: this.sources.map((source) => source.describeStaticIdentity()),
		});
	}

	/** Collect only source-owned static point definitions for geometry query assembly. */
	describePointSourceDefinitions(options = undefined) {
		const definitions = this.pointSources.flatMap((source) => source.describePointSourceDefinitions(options));
		if (new Set(definitions.map((definition) => definition.sourceId)).size !== definitions.length) {
			throw new RangeError('Celestial point-source definitions must have unique source ids.');
		}
		return Object.freeze(definitions);
	}

	/** Collect only source-owned epoch-bound canonical placements for geometry. */
	createPointPlacementStates(options = undefined) {
		const placements = this.pointSources.flatMap((source) => source.createPointPlacementStates(options));
		if (new Set(placements.map((placement) => placement.sourceId)).size !== placements.length) {
			throw new RangeError('Celestial point-source placements must have unique source ids.');
		}
		return Object.freeze(placements);
	}

	createPrimaryCache({ geometry, atmosphere }) {
		if (!geometry || typeof geometry.createPrimaryCelestialCache !== 'function') {
			throw new TypeError('Celestial runtime requires geometry primary-cache construction.');
		}
		return geometry.createPrimaryCelestialCache({ atmosphere, sources: this.cacheSources });
	}

	createGpuCacheController({ geometry, backend, scheduler = undefined }) {
		if (!geometry || typeof geometry.createPrimaryCelestialGpuCacheController !== 'function') {
			throw new TypeError('Celestial runtime requires geometry GPU-controller construction.');
		}
		return geometry.createPrimaryCelestialGpuCacheController({ backend, scheduler });
	}

	/** Construct the geometry-owned static stellar transport/tile field, if configured. */
	createStellarPointSetCache({ geometry, atmosphere }) {
		if (!this.stellarPointSource) return null;
		if (!geometry || typeof geometry.createStellarPointSetCache !== 'function'
			|| typeof geometry.createTiledStellarPointSetCache !== 'function') {
			throw new TypeError('Celestial runtime requires geometry stellar cache construction.');
		}
		const pointCache = geometry.createStellarPointSetCache({ atmosphere, source: this.stellarPointSource });
		return geometry.createTiledStellarPointSetCache({ source: this.stellarPointSource, pointCache });
	}

	/** Create the geometry-owned controller for the bounded stellar field, if configured. */
	createStellarPointSetGpuCacheController({ geometry, backend, scheduler = undefined }) {
		if (!this.stellarPointSource) return null;
		if (!geometry || typeof geometry.createStellarPointSetGpuCacheController !== 'function') {
			throw new TypeError('Celestial runtime requires geometry stellar GPU-controller construction.');
		}
		return geometry.createStellarPointSetGpuCacheController({ backend, scheduler });
	}
}

export default CelestialRuntimeParticipant;
