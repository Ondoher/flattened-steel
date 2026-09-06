/**
 * Geometry method names required by local-Sun primary scattering density.
 *
 * - **"resolveAtmosphereCoordinate"** - Atmosphere-coordinate resolution for one physical position.
 * - **"resolveAtmospherePath"** - Bounded atmosphere-path resolution for one ray.
 * - **"resolveSourceRelativePosition"** - Finite-source-relative position resolution.
 */
type LocalSunPrimaryScatteringDensityGeometryMethod =
	'resolveAtmosphereCoordinate' | 'resolveAtmospherePath' | 'resolveSourceRelativePosition';

/** Flat-geometry capabilities required by local-Sun primary J1 construction. */
type LocalSunPrimaryScatteringDensityGeometry = Pick<GeometryModel, LocalSunPrimaryScatteringDensityGeometryMethod> &
	LocalSunPhysicalDirectionGeometry;

/** Physical collaborators and options for local-Sun primary J1 construction. */
type LocalSunPrimaryScatteringDensityBuildRequest = Readonly<{
	/** Atmosphere medium and transmittance owner. */
	atmosphere: AtmosphereModel;
	/** Flat source-relative geometry owner. */
	geometry: LocalSunPrimaryScatteringDensityGeometry;
	/** Construction-only shell-held direct-lighting owner. */
	lightSource: LightSourceModel;
	/** Executable spectral basis. */
	spectralBasis: SpectralBasis;
	/** Number of source-path transmittance intervals. */
	sourceTransmittanceIntervalCount: number;
	/** Executable position, direction, basis, and packing facts. */
	domainSelection: LocalSunConstructionDomainSelection;
	/** Optional allocated pure-J1 identity. */
	id?: string;
	/** Optional primary-J1 provenance identity. */
	provenanceIdentity?: string;
	/** Optional observer of bounded construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Flat-geometry capabilities required by continuous direct-primary L1. */
type LocalSunPrimaryRadianceGeometry = LocalSunPhysicalDirectionGeometry &
	Readonly<{
		/**
		 * Call this method to resolve one construction ray from an executable cache coordinate.
		 * @param coordinate - The coordinate value accepted by the operation.
		 * @returns - The result produced by the operation.
		 */
		resolveCacheBuildRay(coordinate: CacheBuildCoordinate): RaySegment;
	}>;

/** Calculator operations required by continuous direct-primary L1. */
type LocalSunPrimaryRadianceCalculator = Pick<SpectralCalculator, PrimaryRadianceCalculatorMethod>;

/** Geometry, calculator, domains, and options for local-Sun direct-primary L1 construction. */
type LocalSunPrimaryRadianceBuildRequest = Readonly<{
	/** Flat construction-ray and direction-mapping owner. */
	geometry: LocalSunPrimaryRadianceGeometry;
	/** Continuous direct-radiance path-integration owner. */
	calculator: LocalSunPrimaryRadianceCalculator;
	/** Executable position, incoming-direction, basis, and packing facts. */
	domainSelection: LocalSunConstructionDomainSelection;
	/** Accepted construction path interval count. */
	pathIntervalCount: number;
	/** Optional allocated pure-L1 identity. */
	id?: string;
	/** Optional direct-primary provenance identity. */
	provenanceIdentity?: string;
	/** Optional observer of bounded construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Local-Sun later-order request with an explicit reflective ground boundary. */
type LocalSunReflectiveGroundScatteringKernelRequest = LocalSunLaterOrderScatteringKernelRequest &
	Readonly<{
		/** Ground boundary value. */ groundBoundary: GroundBoundary;
	}>;

/** Model-derived owners captured by local-Sun recurrence callbacks. */
type LocalSunCpuRecurrenceContext = Readonly<{
	/** Internal execution request derived from the accepted aggregate model. */
	request: LocalSunCpuCacheBuildRequest;
	/** Spectral transport and scattering operations. */
	calculator: SpectralCalculator;
	/** Executable position, direction, basis, and packing facts. */
	domainSelection: LocalSunConstructionDomainSelection;
	/** Source-path transmittance interval count. */
	sourceTransmittanceIntervalCount: number;
	/** Cache-transport integration interval count. */
	transportIntervalCount: number;
}>;
