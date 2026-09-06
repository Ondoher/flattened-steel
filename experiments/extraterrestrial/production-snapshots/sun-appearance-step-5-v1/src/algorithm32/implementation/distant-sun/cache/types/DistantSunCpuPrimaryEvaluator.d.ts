/** Profile facts selected for one primary evaluation. */
type DistantSunCpuPrimaryProfileFacts = Readonly<{
	/** Selected execution profile. */
	profile: Algorithm32ExecutionProfile;
	/** Direct-source irradiance-density packet owned by the profile. */
	sourcePacket: SpectralPacket;
	/** Native spectral basis used by the evaluation. */
	spectralBasis: SpectralBasis;
}>;

/** Accepted collaborators and identities for one primary-radiance build. */
type DistantSunCpuPrimaryRadianceInputs = Readonly<{
	/** Atmosphere used by direct-radiance evaluation. */
	atmosphere: DistantSunPrimaryScatteringAtmosphere;
	/** Geometry used to reconstruct direct-radiance paths. */
	geometry: DistantSunPrimaryRadianceGeometry;
	/** Provider-captured configured distant source. */
	lightSource: DistantSunPrimaryScatteringLightSource;
	/** Canonical calculator shared by the recurrence. */
	calculator: DistantSunPrimaryRadianceCalculator;
	/** Selected execution profile. */
	profile: Algorithm32ExecutionProfile;
	/** Native spectral basis used by the evaluation. */
	spectralBasis: SpectralBasis;
	/** Executable construction-domain selection. */
	domainSelection: DistantSunConstructionDomainSelection;
	/** Executed path-integration interval count. */
	transportIntervalCount: number;
	/** Pure-radiance field identity. */
	id: string;
	/** Numerical provenance identity of the field. */
	provenanceIdentity: string;
	/** Optional observer of bounded synchronous construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Accepted collaborators and identities for one primary-scattering build. */
type DistantSunCpuPrimaryScatteringInputs = Readonly<{
	/** Atmosphere used by primary-scattering evaluation. */
	atmosphere: DistantSunPrimaryScatteringAtmosphere;
	/** Geometry used to reconstruct primary-scattering positions. */
	geometry: DistantSunPrimaryScatteringGeometry;
	/** Provider-captured configured distant source. */
	lightSource: DistantSunPrimaryScatteringLightSource;
	/** Selected execution profile. */
	profile: Algorithm32ExecutionProfile;
	/** Direct-source irradiance-density packet owned by the profile. */
	sourcePacket: SpectralPacket;
	/** Executable construction-domain selection. */
	domainSelection: DistantSunConstructionDomainSelection;
	/** Pure-scattering-density field identity. */
	id: string;
	/** Numerical provenance identity of the field. */
	provenanceIdentity: string;
	/** Optional observer of bounded synchronous construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Accepted direct-lighting values for primary scattering. */
type DistantSunCpuDirectLightingInputs = Readonly<{
	/** Top-of-atmosphere source irradiance density by spectral channel. */
	sourceIrradianceWattsPerSquareMeterPerNanometer: readonly number[];
	/** Normalized physical direction from the sample toward the source. */
	directionToLight: UnitVector3;
}>;

/** Source-path request used by primary scattering. */
type DistantSunCpuSourceTransmittanceRequest = Readonly<{
	/** Atmosphere that integrates source-path optical depth. */
	atmosphere: DistantSunPrimaryScatteringAtmosphere;
	/** Geometry that resolves the bounded atmosphere path. */
	geometry: DistantSunPrimaryScatteringGeometry;
	/** Physical ray segment beginning at the cache position. */
	raySegment: RaySegment;
	/** Source-owned path limit for the direct-light ray. */
	sourcePathLimit: SourcePathLimit;
	/** Executed source-path integration interval count. */
	intervalCount: number;
}>;
