/** Physical configuration for a distant-Sun light source. */
type DistantSunLightSourceConfig = {
	/** Apparent source angular radius. */
	readonly angularRadius: Angle;
	/** Optional aligned source irradiance; omission selects the Native-15 packet. */
	readonly sourceIrradiance?: SpectralIrradiancePacket;
};

/** Geometry-bound distant-Sun configuration used by its private implementation closure. */
type DistantSunLightSourceConfiguration = DistantSunLightSourceConfig &
	Readonly<{
		/** Accepted source spectral irradiance. */
		readonly sourceIrradiance: SpectralIrradiancePacket;
		/** Geometry-resolved normalized direction toward the source. */
		readonly directionToLight: UnitVector3;
	}>;

/** Distant-source direct CPU primary-radiance request with model-owned physical facts. */
type DistantSunCpuPrimaryRadianceFieldRequest = Readonly<{
	/** Aggregate execution model that owns physical, spectral, domain, and numerical facts. */
	model: SharedModel;
	/** Pure field identity selected by the focused caller. */
	id: string;
	/** Provenance identity selected by the focused caller. */
	provenanceIdentity: string;
}>;

/** Complete supported distant-Sun CPU cache result. */
type DistantSunCpuCacheResult =
	| DistantSunCpuCacheResultN1
	| DistantSunCpuCacheResultN2
	| DistantSunCpuCacheResultN3
	| DistantSunCpuCacheResultN4
	| DistantSunCpuCacheResultN5;

/** Public source-owned N=1, N=2, or default-N=4 CPU cache request. */
type DistantSunCpuCacheRequest = Readonly<{
	/** Aggregate execution model that owns every physical and numerical cache fact. */
	model: SharedModel;
	/** Optional observer of bounded synchronous construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Optional source-shadow flags accepted by the distant-Sun facade. */
type DistantSunShadowObjectConfiguration = Readonly<{
	/** Whether configured nodes cast shadows. */
	castShadow?: boolean;
	/** Whether configured nodes receive shadows. */
	receiveShadow?: boolean;
	/** Whether descendant nodes receive the same configuration. */
	includeDescendants?: boolean;
	/** Optional shadow-policy metadata override. */
	shadowPolicy?: string;
	/** Optional source-key metadata override. */
	sourceKey?: string;
	/** Optional Three layer index enabled on configured nodes. */
	layerIndex?: number;
}>;
