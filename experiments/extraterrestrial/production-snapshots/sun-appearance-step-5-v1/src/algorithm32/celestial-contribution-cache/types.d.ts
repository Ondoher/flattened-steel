/**
 * Runtime value key owned by one supported celestial cache resource.
 *
 * - **"cache.celestial.sunTransport"** - The distant-Sun direct-transport field.
 * - **"cache.celestial.starTransport"** - The stellar point-set direct-transport field.
 * - **"cache.celestial.localSunRadiance"** - The Flat finite-Sun radiance field.
 */
type CelestialRuntimeValueKey = Exclude<CacheRuntimeValueKey, 'cache.cumulativeScatteringDensity'>;

/** Renderer-neutral binding description for one celestial cache field. */
type CelestialRuntimeBinding = Readonly<{
	/** Stable runtime binding identifier. */
	readonly id: string;
	/** Shader value populated by the renderer backend. */
	readonly valueKey: CelestialRuntimeValueKey;
	/** Logical field represented by this binding. */
	readonly fieldId: CacheFieldId;
	/** Renderer backend that owns the field. */
	readonly backendId: string;
}>;

/** Runtime binding collection contributed by one celestial cache resource. */
type CelestialRuntimeBindings = Readonly<{
	/** Renderer backend that owns every included binding. */
	readonly backendId: string;
	/** Runtime bindings installed for this resource. */
	readonly bindings: readonly CelestialRuntimeBinding[];
}>;

/** Common lifecycle surface for one source-family celestial GPU resource. */
interface CelestialCacheResource {
	/** Stable identity of the published resource. */
	readonly resourceIdentity: string;
	/**
	 * Call this method to return the renderer bindings owned by this resource.
	 *
	 * @returns - The complete celestial runtime binding collection.
	 */
	getRuntimeBindings(): CelestialRuntimeBindings;
	/**
	 * Call this method to dispose the resource idempotently.
	 *
	 * @returns - No return value.
	 */
	dispose(): void;
}

/** Read-only collection assembled for one complete shader installation. */
type CelestialCacheSet = Readonly<{
	/** Optional spherical distant-Sun resource. */
	readonly distantSun: DistantSunCelestialCacheResource | null;
	/** Optional spherical stellar point-set resource. */
	readonly stellarPointSet: StellarPointSetCacheResource | null;
	/** Optional Flat finite-Sun resource. */
	readonly flatFiniteSun: FlatFiniteSunCacheResource | null;
}>;
