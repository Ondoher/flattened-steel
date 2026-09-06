/**
 * Own the resident CPU cumulative scattering-density field for one completed
 * distant-Sun oracle build.
 */
export class DistantSunCpuCache implements CpuScatteringCache {
	/** Consume one completed N1, N2, or N4 distant-Sun CPU build result. */
	constructor(buildResult: DistantSunCpuCacheResult);

	/** Store the completed cumulative cache identity. */
	readonly descriptor: ScatteringCacheDescriptor;

	/** Sample all spectral channels from already-resolved physical stencils. */
	sampleResolved(request: ScatteringCacheSampleRequest): SpectralScatteringDensityPacket;

	/** Release the resident CPU reader. Repeated disposal is safe. */
	dispose(): void;
}
