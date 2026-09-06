/** Source-owned distant-Sun later-order scattering-kernel request. */
type DistantSunLaterOrderScatteringKernelRequest =
	DistantSunBlackGroundScatteringKernelRequest | DistantSunReflectiveGroundScatteringKernelRequest;

/** Source-specific facts accepted once at the adapter boundary. */
type DistantSunLaterOrderScatteringContext = Readonly<{
	/** Accepted adapter request. */
	request: DistantSunLaterOrderScatteringKernelRequest;
	/** Accepted executable position and direction domains. */
	domainSelection: DistantSunConstructionDomainSelection;
}>;

/** Precomputed physical direction resolvers used by one later-order kernel. */
type DistantSunCpuPhysicalDirectionResolvers = Readonly<{
	/** Resolver for selected incoming-radiance directions. */
	incoming: LaterOrderScatteringDirectionResolver;
	/** Resolver for selected outgoing-scattering directions. */
	outgoing: LaterOrderScatteringDirectionResolver;
}>;

/** Accepted allocation facts for one stored-field transport build. */
type DistantSunCpuTransportInputs = Readonly<{
	/** Sealed pure scattering-density input field. */
	scatteringDensity: CpuDirectionalSpectralFieldContract;
	/** Pure scattering order transported into radiance. */
	order: number;
	/** Pure-radiance output field identity. */
	id: string;
	/** Executable construction-domain selection. */
	domainSelection: DistantSunConstructionDomainSelection;
	/** Executed path-integration interval count. */
	transportIntervalCount: number;
}>;
