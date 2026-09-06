/** Declare the base construction capabilities supplied by the atmosphere. */
export const ATMOSPHERE_CACHE_SYMBOLS_BY_PASS = Object.freeze({
	'primary-j1': Object.freeze([
		'atmosphere.medium',
		'atmosphere.phase',
		'atmosphere.sourceTransmittance',
	]),
	'direct-l1': Object.freeze([
		'atmosphere.medium',
		'atmosphere.phase',
		'atmosphere.sourceTransmittance',
	]),
	scatter: Object.freeze([
		'atmosphere.medium',
		'atmosphere.phase',
	]),
	transport: Object.freeze([]),
	accumulate: Object.freeze([]),
});

/** Declare the base construction dependencies of the atmosphere. */
export const ATMOSPHERE_CACHE_REQUIREMENTS_BY_PASS = Object.freeze({
	'primary-j1': Object.freeze([
		'geometry.cachePosition',
		'geometry.sourcePath',
	]),
	'direct-l1': Object.freeze([
		'geometry.cachePosition',
		'geometry.sourcePath',
	]),
	scatter: Object.freeze(['geometry.cachePosition']),
	transport: Object.freeze([]),
	accumulate: Object.freeze([]),
});

/** Identify finite-segment transmittance used by reflected ground radiance. */
export const ATMOSPHERE_FINITE_SEGMENT_TRANSMITTANCE_SYMBOL =
	'atmosphere.finiteSegmentTransmittance';
