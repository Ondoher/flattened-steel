/** Reviewed static member data from which the standard stellar source is constructed. */
type StandardStellarMemberData = Readonly<{
	/** Stable BSC V/50 member identifier. */
	readonly id: string;
	/** Canonical receiver-to-source direction in the FK5/J2000 mean-equatorial frame. */
	readonly direction: UnitVector3;
	/** Materialized native-15 apparent spectral irradiance density. */
	readonly values: readonly number[];
	readonly visualMagnitude?: number;
}>;

type Brightest2000StellarCatalogDefinition = Readonly<{
	readonly catalog: StellarCatalogIdentity;
	readonly photometryIdentity: string;
	readonly members: readonly Readonly<{
		readonly id: string;
		readonly direction: UnitVector3;
		readonly values: readonly number[];
		readonly visualMagnitude: number;
		readonly derivation: Readonly<Record<string, unknown>>;
	}>[];
	readonly memberTexels: Float32Array;
	readonly spectraTexels: Float32Array;
	readonly proxyMembers: readonly Readonly<{
		readonly id: string;
		readonly derivation: Readonly<Record<string, unknown>>;
	}>[];
}>;

/** Source capability that publishes immutable input for the standard stellar generation shader. */
interface StellarScreenPaletteSource extends StellarPointSetCelestialSource, CelestialSourceProvider {
	/**
	 * Return the ordered catalog table accepted as immutable shader input.
	 *
	 * @returns - Catalog directions, epoch, identity, and native-15 member packets without projected values.
	 */
	createStellarGenerationSourceTable(): StellarGenerationSourceTable;

	/**
	 * Create the ordered point and sparse-palette shader stages for one spherical geometry.
	 *
	 * @param request - Accepted geometry and fixed observation snapshot.
	 * @returns - Point-index and palette stages in standard-pipeline order.
	 */
	createStellarGenerationStages(
		request: StellarGenerationStagesRequest,
	): readonly StellarScreenPaletteGenerationStageDescription[];

	/**
	 * Derive exact compatibility for one captured renderer-neutral view.
	 *
	 * @param request - Accepted geometry, fixed observation, and exact view.
	 * @returns - Complete generation and compatibility identities.
	 */
	createStellarGenerationIdentity(request: StellarGenerationIdentityRequest): StellarScreenPaletteResolvedIdentity;

	/** Create the fixed-cost screen-index/native-15 palette consumer contribution. */
	createStellarScreenPaletteConsumerShaderContribution(): ShaderContribution;
}

/** Trusted inputs for stellar generation-stage source construction. */
type StellarGenerationStagesRequest = Readonly<{
	/** Configured spherical geometry that owns time/location and projection operations. */
	readonly geometry: GeometryModel & StellarScreenPaletteGeometryCapability;
	/** Fixed clock/location snapshot used by the installed configuration. */
	readonly observation: GeometryObservation;
}>;

/** Exact inputs from which one complete stellar generation identity is derived. */
type StellarGenerationIdentityRequest = StellarGenerationStagesRequest &
	Readonly<{
		/** Renderer-neutral view whose declared identity must match all supplied facts. */
		readonly view: CelestialRenderViewSnapshot;
		/** Optional runtime presentation tuple paired with this generated palette. */
		readonly presentation?: StellarPresentationCompatibility;
	}>;

type StellarPresentationCompatibility = Readonly<{
	readonly colorIdentity: string;
	readonly filterRegistryIdentity: string;
	readonly scotopicWeightsIdentity: string | null;
	readonly receiverLightIdentity: string;
	readonly adaptationLuminanceCdM2: number;
}>;

/** Construction inputs for the stellar point and sparse-palette stage owner. */
type StellarScreenPaletteGenerationStagesConfiguration = Readonly<{
	/** Immutable packed stellar shader input. */
	readonly source: StellarGenerationSourceTable;
	/** Geometry-owned transform, classification, and view-projection GLSL. */
	readonly geometry: StellarGenerationGeometryShaderContribution;
}>;

/** Construction input accepted by the stellar capacity and numerical-policy gate. */
type StellarScreenPaletteGenerationPolicyConfiguration = Readonly<{
	/** Source-table facts whose member and channel counts bound generation. */
	readonly sourceLayout: Readonly<{
		readonly schema: string;
		readonly storageFormat: string;
		readonly memberOrder: string;
		readonly memberCount: number;
		readonly spectralChannelCount: number;
	}>;
	/** Complete requested sparse output layout. */
	readonly layout: StellarScreenPaletteLayout;
	/** Complete requested numerical rules. */
	readonly numericalPolicy: StellarScreenPaletteNumericalPolicy;
}>;

/** Trusted complete inputs to stellar generation identity derivation. */
type StellarScreenPaletteGenerationIdentityConfiguration = Readonly<{
	/** Immutable canonical source table. */
	readonly source: StellarGenerationSourceTable;
	/** Fixed observation snapshot for this installed configuration. */
	readonly observation: GeometryObservation;
	/** Named epoch-relative transform selected by geometry. */
	readonly epochTransform: StellarEpochRelativeTransformIdentity;
	/** Exact geometry shader contribution identity for the fixed observation. */
	readonly geometryIdentity: string;
	/** Current exact renderer-neutral view snapshot. */
	readonly view: CelestialRenderViewSnapshot;
	/** Already validated sparse capacity and numerical policy. */
	readonly policy: StellarScreenPaletteGenerationPolicy;
	/** Optional runtime presentation tuple paired with this generated palette. */
	readonly presentation?: StellarPresentationCompatibility;
}>;

/** Exact published-field description owned by a stellar point-set plan. */
type StellarPointSetCacheDescriptor = Readonly<{
	/** Canonical identity of the complete descriptor. */
	readonly contentHash: string;
	/** Stable stellar point-set source identifier. */
	readonly sourceId: string;
	/** Geometry-owned domain identity. */
	readonly domainIdentity: string;
	/** Scalar tiled R32F field storage. */
	readonly storage: CacheFieldStorage;
	/** Spectral channel count stored per member. */
	readonly channelCount: 15;
	/** Number of individually retained stellar members. */
	readonly memberCount: 500 | 2000;
	/** Spectral irradiance-density quantity stored per member. */
	readonly quantity: 'spectral-irradiance-density';
	/** Spectral irradiance-density units stored per member. */
	readonly units: 'W m^-2 nm^-1';
	/** Runtime binding key owned by the stellar point-set field. */
	readonly valueKey: 'cache.celestial.starTransport';
	/** Complete source identity represented by the field. */
	readonly sourceIdentity: CelestialSourceIdentity;
	/** Canonical atmosphere and source-path numerical identity. */
	readonly atmosphereIdentity: string;
}>;

/** Exact one-field stellar GPU execution graph. */
type StellarPointSetGpuExecutionPlan = Readonly<{
	readonly fields: readonly CacheFieldSpec[];
	readonly passes: readonly GpuFieldPass[];
	readonly result: CacheFieldId;
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
	readonly memberCount: 500 | 2000;
	/** Selected tiled cache layout. */
	readonly layout: Readonly<{
		readonly memberCount: 500 | 2000;
		readonly tileColumns: number;
		readonly tileRows: number;
		readonly directionCount: 11;
		readonly receiverCount: 13;
		readonly channelCount: 15;
		readonly directionTableRowStart: number;
		readonly storage: CacheFieldStorage;
	}>;
	/** Celestial field descriptor owned by this plan. */
	readonly descriptor: StellarPointSetCacheDescriptor;
	/** Executable packed-field copy graph. */
	readonly execution: StellarPointSetGpuExecutionPlan;
}>;

/** Exact reuse inputs for one stellar point-set controller. */
type StellarPointSetCacheControllerIdentity = Readonly<{
	/** Concrete backend instance across which resources never move. */
	readonly backend: CacheGpuBackend;
	/** Optional build scheduler. */
	readonly scheduler: CacheBuildScheduler | null;
	/** Exact stellar source owner. */
	readonly source: StellarPointSetCelestialSource & CelestialSourceProvider;
	/** Exact geometry owner. */
	readonly geometry: GeometryModel & CelestialGeometryCapability;
	/** Exact atmosphere owner. */
	readonly atmosphere: AtmosphereModel;
}>;

/** Published tiled stellar point-set resource. */
interface StellarPointSetCacheResource extends CelestialCacheResource {
	/** Stellar source represented by this resource. */
	readonly sourceId: string;
	/** Number of individually retained stellar members. */
	readonly memberCount: 500 | 2000;
	/** Complete physical and layout descriptor. */
	readonly descriptor: StellarPointSetCacheDescriptor;
	/** Contribute tiled irradiance lookup. */
	createShaderContribution(): ShaderContribution;
	/** Contribute the fixed live point raster. */
	createLiveShaderContribution(request: Readonly<{queryPacket: SphericalCelestialQueryPacket}>): ShaderContribution;
}

/** Request to construct or reuse one stellar point-set resource. */
type StellarPointSetCacheBuildRequest = Readonly<{
	/** Geometry-resolved static stellar placement. */
	readonly placement: Extract<CelestialResolvedPlacement, {readonly kind: 'static-stellar-point-set'}>;
	/** Matching complete spherical query packet. */
	readonly query: SphericalCelestialQueryPacket;
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

/** Inputs for a dedicated stellar point-set controller. */
type StellarPointSetCacheControllerConfiguration = Readonly<{
	readonly model: SharedModel;
	readonly backend: CacheGpuBackend;
	readonly scheduler?: CacheBuildScheduler;
}>;
