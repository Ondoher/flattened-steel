/** Finite local-Sun source configuration. */
type LocalSunLightSourceConfig = {
	/** Source-owned identity used for cache compatibility. */
	readonly sourceKey: string;

	/** Optional aligned source irradiance; omission selects the Native-15 packet. */
	readonly sourceIrradiance?: SpectralIrradiancePacket;

	/** Reference distance for incident-scale calibration. */
	readonly referenceDistance: Distance;

	/** Neutral spectral incident scale at the reference distance. */
	readonly referenceSpectralIncidentScale: number;

	/** Physical source radius. */
	readonly radius: Distance;

	/** Optional inverse-square distance-falloff selection. */
	readonly distanceFalloff?: boolean;

	/**
	 * Optional source-path optical-depth integration interval count. Omission
	 * selects the production count of fifteen.
	 */
	readonly sourceTransmittanceIntervalCount?: number;
};

/**
 * Optional input properties replaced by normalized local-Sun configuration values.
 *
 * - **"distanceFalloff"** - Falloff selection replaced by its accepted boolean value.
 * - **"sourceTransmittanceIntervalCount"** - Interval count replaced by its accepted positive integer.
 */
type LocalSunLightSourceConfigurationExcludedProperty = 'distanceFalloff' | 'sourceTransmittanceIntervalCount';

/** Normalized finite local-Sun configuration snapshot. */
type LocalSunLightSourceConfiguration = Omit<
	LocalSunLightSourceConfig,
	LocalSunLightSourceConfigurationExcludedProperty
> &
	Readonly<{
		/** Accepted source spectral irradiance. */
		readonly sourceIrradiance: SpectralIrradiancePacket;
		/** Geometry-resolved source center in meters. */
		readonly position: Position;
		/** Accepted inverse-square falloff selection. */
		readonly distanceFalloff: boolean;
		/** Accepted source-path integration interval count. */
		readonly sourceTransmittanceIntervalCount: number;
	}>;

/** Source-relative physical sample facts accepted by the local Sun. */
type LocalSunPhysicalSampleRequest = Readonly<{
	/** Optional geometry-resolved source-relative position. */
	readonly sourceRelativePosition?: SourceRelativePosition;
}>;

/** Shadow-configuration overrides accepted by the local-Sun public facade. */
type LocalSunThreeShadowConfigurationRequest = Readonly<{
	/** Optional cast-shadow selection. */
	readonly castShadow?: boolean;
	/** Optional receive-shadow selection. */
	readonly receiveShadow?: boolean;
	/** Optional descendant-traversal selection. */
	readonly includeDescendants?: boolean;
	/** Optional source shadow-policy override. */
	readonly shadowPolicy?: string;
	/** Optional source identity override. */
	readonly sourceKey?: string;
	/** Optional renderer layer index. */
	readonly layerIndex?: number;
}>;

/** Aggregate model and transient progress supplied to the public local-Sun CPU build. */
type LocalSunCpuCacheRequest = Readonly<{
	/** Aggregate execution model that owns profile and physical collaborators. */
	model: SharedModel;
	/** Optional observer of bounded CPU construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Completed local-Sun binary64 cache build. */
type LocalSunCpuCacheResult = Readonly<{
	/** Executable domains and basis used to construct the resident artifact. */
	domainSelection: LocalSunConstructionDomainSelection;
	/** Requested and completed maximum scattering order. */
	maximumScatteringOrder: SupportedCacheScatteringOrder;
	/** Sealed pure J fields in ascending order. */
	pureScatteringDensityByOrder: readonly CpuDirectionalSpectralFieldContract[];
	/** Sealed pure L fields in ascending order. */
	pureRadianceByOrder: readonly CpuDirectionalSpectralFieldContract[];
	/** Sealed cumulative J-through-N field. */
	cumulativeScatteringDensity: CpuDirectionalSpectralFieldContract;
	/** Cache-construction options that completed. */
	options: CacheConstructionOptions;
}>;
