/** Reviewed static member data from which the standard stellar source is constructed. */
type StandardStellarMemberData = Readonly<{
	/** Stable BSC V/50 member identifier. */
	readonly id: string;
	/** Canonical receiver-to-source direction in celestial-rh-v1. */
	readonly direction: UnitVector3;
	/** Materialized native-15 apparent spectral irradiance density. */
	readonly values: readonly number[];
}>;

/** Exact published-field description owned by a stellar point-set plan. */
type StellarPointSetCacheDescriptor = Readonly<{
	/** Stable stellar point-set source identifier. */
	readonly sourceId: string;
	/** Geometry-owned domain identity. */
	readonly domainIdentity: string;
	/** Scalar tiled R32F field storage. */
	readonly storage: CacheFieldStorage;
	/** Spectral channel count stored per member. */
	readonly channelCount: 15;
	/** Number of individually retained stellar members. */
	readonly memberCount: 500;
	/** Spectral irradiance-density quantity stored per member. */
	readonly quantity: 'spectral-irradiance-density';
	/** Spectral irradiance-density units stored per member. */
	readonly units: 'W m^-2 nm^-1';
	/** Runtime binding key owned by the stellar point-set field. */
	readonly valueKey: 'cache.celestial.starTransport';
}>;

/** Logical direct-transport plan for the tiled stellar point-set field. */
type StellarPointSetCachePlan = Readonly<{
	/** Stable executable plan identity. */
	readonly identity: CacheReuseIdentity;
	/** Stellar point-set source represented by the field. */
	readonly sourceId: string;
	/** Geometry-owned domain used for construction and lookup. */
	readonly domain: CelestialContributionDomainDescription;
	/** Canonical point-member count. */
	readonly memberCount: 500;
	/** Celestial field descriptor owned by this plan. */
	readonly descriptor: StellarPointSetCacheDescriptor;
}>;

/** Exact reuse inputs for one stellar point-set controller. */
type StellarPointSetCacheControllerIdentity = Readonly<{
	/** Concrete backend instance across which resources never move. */
	readonly backend: CacheGpuBackend;
	/** Optional build scheduler. */
	readonly scheduler: CacheBuildScheduler | null;
	/** Stable stellar source identity. */
	readonly sourceIdentity: string;
	/** Stable geometry-domain identity. */
	readonly geometryIdentity: string;
	/** Stable atmosphere direct-transport identity. */
	readonly atmosphereIdentity: string;
}>;

/** Published tiled stellar point-set resource. */
interface StellarPointSetCacheResource extends CelestialCacheResource {
	/** Stellar source represented by this resource. */
	readonly sourceId: string;
	/** Number of individually retained stellar members. */
	readonly memberCount: 500;
}

/** Request to construct or reuse one stellar point-set resource. */
type StellarPointSetCacheBuildRequest = Readonly<{
	/** Logical stellar cache plan. */
	readonly plan: StellarPointSetCachePlan;
	/** Optional cancellation signal. */
	readonly signal?: AbortSignal;
}>;

/** Controller for only the tiled stellar point-set resource. */
interface StellarPointSetCacheController {
	/** Currently published resource, or null before a successful build. */
	readonly active: StellarPointSetCacheResource | null;
	/**
	 * Call this method to construct, reuse, or replace the stellar point-set resource. Construction failure or cancellation rejects without replacing the currently published resource.
	 *
	 * @param request - The accepted stellar point-set plan and optional cancellation signal.
	 * @returns - The completely constructed or exactly reused resource.
	 */
	build(request: StellarPointSetCacheBuildRequest): Promise<StellarPointSetCacheResource>;
	/**
	 * Call this method to dispose controller-owned resources idempotently.
	 *
	 * @returns - No return value.
	 */
	dispose(): void;
}

/** Stellar-point-set-specific runtime binding collection. */
type StellarPointSetRuntimeBindings = CelestialRuntimeBindings;
