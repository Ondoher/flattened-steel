/**
 * Base construction capabilities supplied by the atmosphere, keyed by cache pass.
 *
 * @type {Readonly<Record<CachePassKind, readonly string[]>>}
 */
export const ATMOSPHERE_CACHE_SYMBOLS_BY_PASS = {
	'primary-j1': ['atmosphere.medium', 'atmosphere.phase', 'atmosphere.sourceTransmittance'],
	'direct-l1': ['atmosphere.medium', 'atmosphere.phase', 'atmosphere.sourceTransmittance'],
	scatter: ['atmosphere.medium', 'atmosphere.phase'],
	transport: ['atmosphere.medium'],
	accumulate: [],
};

/**
 * Base construction dependencies of the atmosphere, keyed by cache pass.
 *
 * @type {Readonly<Record<CachePassKind, readonly string[]>>}
 */
export const ATMOSPHERE_CACHE_REQUIREMENTS_BY_PASS = {
	'primary-j1': ['geometry.cachePosition', 'geometry.sourcePath'],
	'direct-l1': ['geometry.cachePosition', 'geometry.sourcePath'],
	scatter: ['geometry.cachePosition'],
	transport: ['geometry.cachePosition'],
	accumulate: [],
};

/** Shader symbol for finite-segment transmittance used by reflected ground radiance. */
export const ATMOSPHERE_FINITE_SEGMENT_TRANSMITTANCE_SYMBOL = 'atmosphere.finiteSegmentTransmittance';

/**
 * Value that stores the accepted canonical atmosphere constants.
 *
 * @type {CanonicalAtmosphereConstants}
 *
 */
export const CANONICAL_ATMOSPHERE_CONSTANTS = {
	bottomRadius: {value: 6360000, units: 'meters'},
	topRadius: {value: 6420000, units: 'meters'},
	rayleighScaleHeight: {value: 8000, units: 'meters'},
	mieScaleHeight: {value: 1200, units: 'meters'},
	rayleighCoefficientScale: 0.00000124062,
	mieAngstromAlpha: 0.8,
	mieAngstromBeta: 0.04,
	mieSingleScatteringAlbedo: 0.8,
	miePhaseFunctionG: 0.7,
	ozoneAbsorptionEnabled: false,
};
