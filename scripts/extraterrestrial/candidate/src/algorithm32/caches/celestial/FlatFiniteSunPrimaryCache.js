import { sha256Descriptor } from '../../descriptors/descriptorSupport.js';

/**
 * Geometry-owned assembly for a local finite-body source.
 *
 * The one-by-one cache is intentionally source-relative: it contains only
 * static emitted radiance. The Flat geometry's center, support, and
 * atmospheric segment are evaluated during the live raster.
 */
export class FlatFiniteSunPrimaryCache {
	constructor({ geometry, atmosphere, sources }) {
		if (!geometry || geometry.id !== 'flat-earth-geometry') {
			throw new TypeError('Flat finite Sun cache requires FlatEarthGeometry.');
		}
		if (!atmosphere || typeof atmosphere.createShaderContribution !== 'function') {
			throw new TypeError('Flat finite Sun cache requires an atmosphere shader owner.');
		}
		if (!Array.isArray(sources) || sources.length !== 1) {
			throw new RangeError('Flat finite Sun cache accepts exactly one source.');
		}
		const [source] = sources;
		if (source?.describeStaticIdentity?.().kind !== 'finite-uniform-disk'
			|| typeof source.createCacheBuildModule !== 'function') {
			throw new TypeError('Flat finite Sun cache requires a finite-uniform-disk source.');
		}
		const fragments = source.buildCacheFragments({ geometryFamily: 'flat-local-finite-sun-v1' });
		if (!Array.isArray(fragments) || fragments.length !== 1
			|| fragments[0].kind !== 'finite-uniform-disk') {
			throw new RangeError('Flat finite Sun source must return one finite-uniform-disk fragment.');
		}
		this.geometry = geometry;
		this.atmosphere = atmosphere;
		this.sources = new Map([[source.sourceId, source]]);
		this.fragments = fragments;
		this.generationIdentity = sha256Descriptor({
			family: 'flat-local-finite-sun-v1',
			geometry: geometry.id,
			source: source.describeStaticIdentity(),
			fragment: fragments[0],
		});
	}
}

export default FlatFiniteSunPrimaryCache;
