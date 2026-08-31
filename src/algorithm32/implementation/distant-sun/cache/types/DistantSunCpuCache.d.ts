/** Object that owns the resident CPU cumulative scattering-density field for one completed distant-Sun oracle build. */
export class DistantSunCpuCache implements CpuScatteringCache {
	/**
	 * Creates a distant sun cpu cache instance that consumes one completed N1, N2, or N4 distant-Sun CPU build result.
	 * @param buildResult - The build result value accepted by the operation.
	 */
	constructor(buildResult: DistantSunCpuCacheResult);

	/** Value that identifies the physical provenance of returned spectral samples. */
	readonly sampleProvenanceIdentity: string;

	/**
	 * Call this method to sample all spectral channels from pairing-neutral physical context.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	sampleCumulativeScatteringDensity(request: ScatteringCacheSampleRequest): SpectralScatteringDensityPacket;

	/** Call this method to release the resident CPU reader. Repeated disposal is safe. */
	dispose(): void;
}
