/** Create the distant-source scalar-layout module for one pass. */
export function createDistantSunCacheLayoutModule(
	context: CacheBuildContext,
): CacheBuildModule;

/** Derive one exact selected N1, N2, or N4 logical build graph. */
export function createDistantSunCacheBuildPlan(
	request: DistantSunCacheBuildPlanRequest,
): CacheBuildPlan;
