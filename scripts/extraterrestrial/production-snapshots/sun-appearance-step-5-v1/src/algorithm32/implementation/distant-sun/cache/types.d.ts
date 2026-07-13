/** Configured facade surface retained by the distant-Sun cache provider. */
type DistantSunCacheProviderSource = DistantSunCacheSource & DistantSunPrimaryScatteringLightSource;

/** Definition of source-owned executable packing for one distant-Sun CPU field. */
type DistantSunFieldPackingDefinition = Readonly<{
	/** Unique identifier for the field packing. */
	id: string;
	/** Number of executable directions. */
	directionCount: number;
	/** Number of executable positions. */
	positionCount: number;
	/** Number of executable wavelengths. */
	wavelengthCount: number;
}>;

/** Source-owned executable packing for one distant-Sun CPU field. */
interface DistantSunFieldPacking extends DirectionalSpectralFieldPacking {
	/** Distant-Sun field-packing contract kind. */
	readonly kind: 'distant-sun-field-packing';
	/** Unique identifier for the field packing. */
	readonly id: string;
	/** Executable direction extent. */
	readonly directionCount: number;
	/** Executable position extent. */
	readonly positionCount: number;
	/** Executable wavelength extent. */
	readonly wavelengthCount: number;
	/**
	 * Call this method to resolve field coordinates for a flat storage offset.
	 *
	 * @param offset - The flat field offset.
	 * @returns - The resolved field coordinates.
	 */
	coordinatesAt(offset: number): DirectionalSpectralFieldCoordinates;
}

/** Definition of one coherent executable distant-Sun construction-domain selection. */
type DistantSunConstructionDomainSelectionDefinition = Readonly<{
	/** Unique identifier for the exact position, direction, and packing selection. */
	readonly id: string;
	/** Owner of the executable spherical-native position facts. */
	readonly positionDomainOwner: SphericalNativePositionDomain;
	/** Owner of the executable incoming-radiance direction facts. */
	readonly incomingDirectionDomainOwner: Fibonacci34DirectionDomain;
	/** Owner of the executable cubed-sphere outgoing-direction facts. */
	readonly outgoingDirectionDomainOwner: CubedSphereDirectionDomain;
	/** Exact spectral basis that determines the field channel count. */
	readonly spectralBasis: SpectralBasis;
	/** Identifier for the incoming-radiance field packing. */
	readonly radiancePackingId: string;
	/** Identifier for the outgoing-scattering field packing. */
	readonly scatteringDensityPackingId: string;
}>;

/** Executable production lattice for distant-Sun construction. */
interface DistantSunConstructionDomainSelection extends CacheConstructionDomains {
	/** Distant-Sun construction-domain-selection contract kind. */
	readonly kind: 'distant-sun-construction-domain-selection';
	/** Unique identifier for the exact position, direction, and packing selection. */
	readonly id: string;
	/** Selected executable physical position domain. */
	readonly positionDomain: SphericalNativePositionDomain;
	/** Selected executable position nodes. */
	readonly positionNodes: readonly PositionDomainNode[];
	/** Selected position extent. */
	readonly positionCount: number;
	/** Executable ground radius. */
	readonly bottomRadius: Distance;
	/** Executable atmosphere-top radius. */
	readonly topRadius: Distance;
	/** Executable incoming-radiance direction domain. */
	readonly incomingDirectionDomain: Fibonacci34DirectionDomain;
	/** Executable incoming-radiance unit vectors. */
	readonly incomingUnitVectors: readonly UnitVector3[];
	/** Solid-angle integration weight for each incoming direction. */
	readonly incomingIntegrationWeights: SolidAngleWeights;
	/** Incoming-radiance direction extent. */
	readonly incomingDirectionCount: number;
	/** Executable outgoing-scattering direction domain. */
	readonly outgoingDirectionDomain: CubedSphereDirectionDomain;
	/** Executable outgoing-scattering unit vectors. */
	readonly outgoingUnitVectors: readonly UnitVector3[];
	/** Outgoing-scattering direction extent. */
	readonly outgoingDirectionCount: number;
	/** Selected positive-axis face-center indices. */
	readonly outgoingPositiveFaceCenterIndices: Readonly<{
		/** Positive-X face-center index. */
		readonly positiveX: number;
		/** Positive-Y face-center index. */
		readonly positiveY: number;
		/** Positive-Z face-center index. */
		readonly positiveZ: number;
	}>;
	/** Executable spectral basis. */
	readonly spectralBasis: SpectralBasis;
	/** Executable spectral channel extent. */
	readonly spectralChannelCount: number;
	/** Executable incoming-radiance field packing. */
	readonly radiancePacking: DistantSunFieldPacking;
	/** Executable outgoing-scattering field packing. */
	readonly scatteringDensityPacking: DistantSunFieldPacking;
	/**
	 * Call this method to resolve one source-local outgoing direction into
	 * selected construction taps.
	 *
	 * @param direction - The source-local outgoing direction.
	 * @returns - The selected construction-direction stencil.
	 */
	resolveOutgoingDirectionStencil(direction: UnitVector3): ScatteringCacheDirectionStencil;
}

/** Definition of one pure distant-Sun CPU field. */
type DistantSunCpuPureFieldDefinition = Readonly<{
	/** Unique identifier for the field. */
	id: string;
	/** Pure field order. */
	order: number;
	/** Optional field provenance identity. */
	provenanceIdentity?: string;
	/** Optional executable production domain; omission retains Native48/W27. */
	domainSelection?: DistantSunConstructionDomainSelection;
}>;

/** Operation that allocates one mutable pure distant-Sun CPU field. */
type DistantSunCpuPureFieldAllocator =
	/**
	 * Called by distant-Sun CPU evaluators to allocate one pure field.
	 * @param definition - The pure-field definition.
	 * @returns - The allocated mutable field contract.
	 */ (definition: DistantSunCpuPureFieldDefinition) => CpuDirectionalSpectralFieldContract;

/** Field-allocation operations supplied to the distant-Sun primary evaluator. */
type DistantSunCpuPrimaryFieldAllocators = Readonly<{
	/**
	 * Value used by the primary evaluator to allocate a pure-radiance field through the owning provider.
	 *
	 * @param definition - The pure-radiance field definition.
	 * @returns - The allocated mutable field contract.
	 *
	 */
	createPureRadianceField: DistantSunCpuPureFieldAllocator;
	/**
	 * Value used by the primary evaluator to allocate a pure-scattering-density field through the owning provider.
	 *
	 * @param definition - The pure-scattering-density field definition.
	 * @returns - The allocated mutable field contract.
	 *
	 */
	createPureScatteringDensityField: DistantSunCpuPureFieldAllocator;
}>;

/** Field-allocation operations supplied to the distant-Sun multiple-scattering evaluator. */
type DistantSunCpuMultipleScatteringFieldAllocators = Readonly<{
	/**
	 * Value used by the multiple-scattering evaluator to allocate a pure-radiance field through the owning provider.
	 *
	 * @param definition - The pure-radiance field definition.
	 * @returns - The allocated mutable field contract.
	 *
	 */
	createPureRadianceField: DistantSunCpuPureFieldAllocator;
}>;

/**
 * Atmosphere method names required by distant-Sun primary scattering.
 *
 * - **"sampleMedium"** - Medium-property sampling at one atmosphere coordinate.
 * - **"integrateOpticalDepth"** - Optical-depth integration along one bounded path.
 * - **"samplePhase"** - Phase-function sampling for one scattering angle.
 */
type DistantSunPrimaryScatteringAtmosphereMethod = 'sampleMedium' | 'integrateOpticalDepth' | 'samplePhase';

/** Atmosphere surface required for distant-Sun primary scattering density. */
type DistantSunPrimaryScatteringAtmosphere = Pick<AtmosphereModel, DistantSunPrimaryScatteringAtmosphereMethod> &
	Readonly<{
		/** Atmosphere spectral basis aligned with its spectral outputs. */
		readonly spectralBasis: SpectralBasis;
	}>;

/**
 * Geometry method names required by distant-Sun primary scattering.
 *
 * - **"resolveAtmosphereCoordinate"** - Atmosphere-coordinate resolution for one physical position.
 * - **"resolveAtmospherePath"** - Bounded atmosphere-path resolution for one ray.
 */
type DistantSunPrimaryScatteringGeometryMethod = 'resolveAtmosphereCoordinate' | 'resolveAtmospherePath';

/** Geometry surface required for primary scattering over the selected position domain. */
type DistantSunPrimaryScatteringGeometry = Pick<GeometryModel, DistantSunPrimaryScatteringGeometryMethod> &
	Readonly<{
		/**
		 * Call this method to resolve one native altitude and source direction into
		 * a physical ray.
		 *
		 * @param coordinate - The native cache-build coordinate.
		 * @returns - The bounded physical ray, or null when none exists.
		 */
		resolveCacheBuildRay(coordinate: CacheBuildCoordinate): RaySegment | null;
	}>;

/**
 * Direct-lighting method names shared by distant-Sun scattering paths.
 *
 * - **"sampleDirectLighting"** - Direct source-lighting sampling at one physical position.
 * - **"resolveSourcePathLimit"** - Source-owned transmittance-path limit resolution.
 */
type DistantSunDirectLightingMethod = 'sampleDirectLighting' | 'resolveSourcePathLimit';

/** Distant atmospheric source surface required for primary scattering density. */
type DistantSunPrimaryScatteringLightSource = Pick<LightSourceModel, DistantSunDirectLightingMethod>;

/** Request for one synchronous distant-Sun pure-J1 CPU construction. */
type DistantSunPrimaryScatteringDensityBuildRequest = Readonly<{
	/** Aggregate execution model that owns profile and physical collaborators. */
	model: SharedModel;
	/** Wavelength-aligned physical atmosphere. */
	atmosphere: DistantSunPrimaryScatteringAtmosphere;
	/** Spherical geometry that reconstructs native altitude nodes. */
	geometry: DistantSunPrimaryScatteringGeometry;
	/** Distant-source direction and path policy. */
	lightSource: DistantSunPrimaryScatteringLightSource;
	/** Aggregate profile retained by the execution model. */
	profile?: Algorithm32ExecutionProfile;
	/** Optional pure-J1 field identity override. */
	id?: string;
	/** Optional field provenance identity override. */
	provenanceIdentity?: string;
	/** Optional observer of bounded synchronous construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Spherical geometry required by the source-owned direct-L1 build. */
type DistantSunPrimaryRadianceGeometry = DistantSunPrimaryScatteringGeometry &
	Pick<GeometryModel, 'resolveSourceRelativePosition'> &
	Readonly<{
		/**
		 * Call this method to express one executable Fibonacci radiance direction
		 * in physical space.
		 *
		 * @param cacheDirection - The executable cache direction.
		 * @returns - The physical-space incoming-radiance direction.
		 */
		expressPhysicalIncomingRadianceDirection(cacheDirection: UnitVector3): UnitVector3;
	}>;

/** Canonical calculator surface shared by direct L1 and later-order recurrence. */
type DistantSunPrimaryRadianceCalculator = Pick<SpectralCalculator, PrimaryRadianceCalculatorMethod>;

/** Request for one synchronous distant-Sun pure-L1 CPU construction. */
type DistantSunPrimaryRadianceBuildRequest = Omit<DistantSunPrimaryScatteringDensityBuildRequest, 'geometry'> &
	Readonly<{
		/** Spherical geometry and its source-relative direction mapping. */
		geometry: DistantSunPrimaryRadianceGeometry;
		/** Source-created canonical spectral calculator. */
		calculator: DistantSunPrimaryRadianceCalculator;
		/** Accepted executable path-integration interval count. */
		transportIntervalCount: number;
	}>;

/**
 * Properties excluded from a distant-Sun CPU spectral-calculator request.
 *
 * - **"calculator"** - Calculator reconstructed from the retained physical collaborators.
 * - **"id"** - Field identity owned by the subsequent build operation.
 * - **"provenanceIdentity"** - Numerical provenance identity owned by the subsequent build operation.
 */
type DistantSunCpuSpectralCalculatorRequestExcludedProperty = 'calculator' | 'id' | 'provenanceIdentity';

/** Aggregate-model input for the one source-owned calculator. */
type DistantSunCpuSpectralCalculatorRequest = Readonly<{
	/** Aggregate execution model that owns profile and physical collaborators. */
	model: SharedModel;
}>;

/** Primary-scattering request accepted by the configured evaluator. */
type DistantSunCpuPrimaryScatteringEvaluationRequest = Omit<
	DistantSunPrimaryScatteringDensityBuildRequest,
	'lightSource'
>;

/** Primary-radiance request accepted by the configured evaluator. */
type DistantSunCpuPrimaryRadianceEvaluationRequest = Omit<DistantSunPrimaryRadianceBuildRequest, 'lightSource'>;

/** Spectral-calculator request accepted by the configured evaluator. */
type DistantSunCpuSpectralCalculatorEvaluationRequest = DistantSunCpuSpectralCalculatorRequest;

/** Spherical distant-Sun geometry used by later-order scattering. */
type DistantSunLaterOrderScatteringGeometry = LaterOrderScatteringGeometry &
	Readonly<{
		/**
		 * Call this method to reconstruct one executable native position through
		 * geometry-owned facts.
		 *
		 * @param positionNode - The executable native-position node.
		 * @returns - The reconstructed physical position.
		 */
		resolveScatteringCacheConstructionPosition(positionNode: PositionDomainNode): Position;
		/**
		 * Call this method to express one executable Fibonacci incoming direction
		 * in physical space.
		 *
		 * @param cacheDirection - The executable cache direction.
		 * @returns - The physical-space incoming-radiance direction.
		 */
		expressPhysicalIncomingRadianceDirection(cacheDirection: UnitVector3): UnitVector3;
		/**
		 * Call this method to express one executable W27 outgoing direction in
		 * physical space.
		 *
		 * @param cacheDirection - The executable cache direction.
		 * @returns - The physical-space outgoing-scattering direction.
		 */
		expressPhysicalOutgoingScatteringDirection(cacheDirection: UnitVector3): UnitVector3;
	}>;

/**
 * Geometry method names required only by distant-Sun ground reflection.
 *
 * - **"resolveAtmospherePath"** - Atmosphere-path resolution between construction endpoints.
 * - **"resolveGroundIntersection"** - Ground-hit resolution for one physical ray.
 * - **"resolveScatteringCacheConstructionPositionStencil"** - Construction-position stencil resolution at a ground hit.
 */
type DistantSunGroundReflectionGeometryMethod =
	'resolveAtmospherePath' | 'resolveGroundIntersection' | 'resolveScatteringCacheConstructionPositionStencil';

/** Geometry operations required only by reflective-ground scattering. */
type DistantSunGroundReflectionGeometry = DistantSunLaterOrderScatteringGeometry &
	Pick<GeometryModel, DistantSunGroundReflectionGeometryMethod>;

/** Atmosphere transport required only by reflective-ground scattering. */
type DistantSunGroundReflectionAtmosphere = LaterOrderScatteringAtmosphere &
	Pick<AtmosphereModel, 'integrateOpticalDepth'>;

/** Direct-source operations used by the J2 ground term. */
type DistantSunGroundReflectionLightSource = Pick<LightSourceModel, DistantSunDirectLightingMethod>;

/** Physical collaborators shared by every ground mode. */
type DistantSunLaterOrderScatteringKernelConfigurationBase = Readonly<{
	/** Executable domains selected by the retained profile. */
	domainSelection: DistantSunConstructionDomainSelection;
	/** Spherical native-domain geometry. */
	geometry: DistantSunLaterOrderScatteringGeometry;
	/** Atmosphere-owned medium and phase sampling. */
	atmosphere: LaterOrderScatteringAtmosphere;
	/** Phase-weighted spectral coefficient calculation. */
	calculator: LaterOrderScatteringCalculator;
	/** Executable physical direction from a sample toward the source. */
	directionToLight: UnitVector3;
	/** Pure L(k-2) field when the requested order can illuminate ground. */
	groundIlluminationRadiance?: CpuDirectionalSpectralFieldContract | null;
	/** Optional observer of bounded synchronous construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Exact omitted-boundary configuration. */
type DistantSunBlackGroundScatteringKernelConfiguration = DistantSunLaterOrderScatteringKernelConfigurationBase &
	Readonly<{
		/** Null reflective boundary that preserves the canonical black path. */
		groundBoundary?: null;
	}>;

/**
 * Base properties replaced by reflective-ground scattering collaborators.
 *
 * - **"geometry"** - Geometry strengthened with ground-reflection operations.
 * - **"atmosphere"** - Atmosphere strengthened with optical-depth integration.
 */
type DistantSunReflectiveGroundScatteringKernelConfigurationExcludedProperty = 'geometry' | 'atmosphere';

/** Source-owned reflective-ground transport configuration. */
type DistantSunReflectiveGroundScatteringKernelConfiguration = Omit<
	DistantSunLaterOrderScatteringKernelConfigurationBase,
	DistantSunReflectiveGroundScatteringKernelConfigurationExcludedProperty
> &
	Readonly<{
		/** Geometry-owned ground hits and atmosphere paths. */
		geometry: DistantSunGroundReflectionGeometry;
		/** Atmosphere-owned optical-depth integration. */
		atmosphere: DistantSunGroundReflectionAtmosphere;
		/** Configured BRDF owner. */
		groundBoundary: GroundBoundary;
		/** Distant source for direct J2 illumination. */
		lightSource: DistantSunGroundReflectionLightSource;
		/** Selected source/hit transport interval count. */
		sourceTransmittanceIntervalCount: number;
	}>;

/** Distant-Sun later-order kernel configuration independent of its order. */
type DistantSunLaterOrderScatteringKernelConfiguration =
	DistantSunBlackGroundScatteringKernelConfiguration | DistantSunReflectiveGroundScatteringKernelConfiguration;

/** Omitted-boundary distant-Sun later-order kernel request. */
type DistantSunBlackGroundScatteringKernelRequest = DistantSunBlackGroundScatteringKernelConfiguration &
	Readonly<{
		/** Pure Jk order being constructed. */
		scatteringOrder: 2 | 3 | 4 | 5;
	}>;

/** Reflective-ground distant-Sun later-order kernel request. */
type DistantSunReflectiveGroundScatteringKernelRequest = DistantSunReflectiveGroundScatteringKernelConfiguration &
	Readonly<{
		/** Pure Jk order being constructed. */
		scatteringOrder: 2 | 3 | 4 | 5;
	}>;

/** Omitted-boundary kernel request accepted by the configured evaluator. */
type DistantSunCpuBlackGroundKernelEvaluationRequest = Omit<
	DistantSunBlackGroundScatteringKernelRequest,
	'directionToLight'
>;

/**
 * Provider-captured properties excluded from reflective-ground evaluator requests.
 *
 * - **"directionToLight"** - Configured source direction captured by the evaluator.
 * - **"lightSource"** - Configured source facade captured by the evaluator.
 */
type DistantSunCpuReflectiveGroundKernelEvaluationExcludedProperty = 'directionToLight' | 'lightSource';

/** Reflective-ground kernel request accepted by the configured evaluator. */
type DistantSunCpuReflectiveGroundKernelEvaluationRequest = Omit<
	DistantSunReflectiveGroundScatteringKernelRequest,
	DistantSunCpuReflectiveGroundKernelEvaluationExcludedProperty
>;

/** Later-order kernel request accepted by the configured evaluator. */
type DistantSunCpuLaterOrderKernelEvaluationRequest =
	DistantSunCpuBlackGroundKernelEvaluationRequest | DistantSunCpuReflectiveGroundKernelEvaluationRequest;

/** Spherical distant-Sun geometry required by stored-field transport. */
type DistantSunScatteringDensityTransportGeometry = PureScatteringDensityTransportGeometry &
	Readonly<{
		/**
		 * Call this method to express one executable Fibonacci radiance direction
		 * in physical space.
		 *
		 * @param cacheDirection - The executable cache direction.
		 * @returns - The physical-space incoming-radiance direction.
		 */
		expressPhysicalIncomingRadianceDirection(cacheDirection: UnitVector3): UnitVector3;
		/**
		 * Call this method to resolve construction-time position taps from
		 * geometry-owned facts.
		 *
		 * @param request - The position-stencil request.
		 * @returns - The resolved construction-position stencil.
		 */
		resolveScatteringCacheConstructionPositionStencil(
			request: ScatteringCachePositionStencilRequest,
		): ScatteringCachePositionStencil;
	}>;

/** Request for one source-owned distant-Sun stored-field transport build. */
type DistantSunScatteringDensityTransportRequest = Readonly<{
	/** Sealed Native48/W27/Native-15 pure-Jk input field. */
	scatteringDensity: CpuDirectionalSpectralFieldContract;
	/** Diagnostic J1 or production J2/J3 order being transported. */
	scatteringOrder: 1 | 2 | 3 | 4;
	/** Spherical construction and source-frame operations. */
	geometry: DistantSunScatteringDensityTransportGeometry;
	/** Atmosphere medium sampling. */
	atmosphere: PureScatteringDensityTransportAtmosphere;
	/** Endpoint-trapezoid and transmittance operations. */
	calculator: PureScatteringDensityTransportCalculator;
	/** Executable production domain selected by the retained profile. */
	domainSelection: DistantSunConstructionDomainSelection;
	/** Accepted executable path-integration interval count. */
	transportIntervalCount: number;
	/** Optional allocated pure-Lk field identity override. */
	id?: string;
	/** Optional observer of bounded synchronous construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Common completed nonresident CPU cache result data. */
type DistantSunCpuCacheResultBase = Readonly<{
	/** Executable domains and basis used to construct the resident artifact. */
	domainSelection: DistantSunConstructionDomainSelection;
	/** Final sealed cumulative scattering-density field. */
	cumulativeScatteringDensity: CpuDirectionalSpectralFieldContract;
	/** Cache-construction options that completed. */
	options: CacheConstructionOptions;
}>;

/** Complete requested N=1 CPU build result. */
type DistantSunCpuCacheResultN1 = DistantSunCpuCacheResultBase &
	Readonly<{
		/** Requested recurrence-graph discriminator. */
		maximumScatteringOrder: 1;
		/** Pure J1 field in ascending order. */
		pureScatteringDensityByOrder: readonly [CpuDirectionalSpectralFieldContract];
		/** N=1 constructs no transported-radiance field. */
		pureRadianceByOrder: readonly [];
	}>;

/** Complete requested N=2 CPU build result. */
type DistantSunCpuCacheResultN2 = DistantSunCpuCacheResultBase &
	Readonly<{
		/** Requested recurrence-graph discriminator. */
		maximumScatteringOrder: 2;
		/** Pure J1 and J2 fields in ascending order. */
		pureScatteringDensityByOrder: readonly [
			CpuDirectionalSpectralFieldContract,
			CpuDirectionalSpectralFieldContract,
		];
		/** Direct-primary L1 field; N=2 constructs no L2 field. */
		pureRadianceByOrder: readonly [CpuDirectionalSpectralFieldContract];
	}>;

/** Complete requested N=3 CPU build result. */
type DistantSunCpuCacheResultN3 = DistantSunCpuCacheResultBase &
	Readonly<{
		/** Requested recurrence-graph discriminator. */
		maximumScatteringOrder: 3;
		/** Pure J1 through J3 fields in ascending order. */
		pureScatteringDensityByOrder: readonly CpuDirectionalSpectralFieldContract[];
		/** Pure L1 and L2 fields in ascending order. */
		pureRadianceByOrder: readonly CpuDirectionalSpectralFieldContract[];
	}>;

/** Complete requested N=4 CPU build result. */
type DistantSunCpuCacheResultN4 = DistantSunCpuCacheResultBase &
	Readonly<{
		/** Requested recurrence-graph discriminator. */
		maximumScatteringOrder: 4;
		/** Pure J1 through J4 fields in ascending order. */
		pureScatteringDensityByOrder: readonly [
			CpuDirectionalSpectralFieldContract,
			CpuDirectionalSpectralFieldContract,
			CpuDirectionalSpectralFieldContract,
			CpuDirectionalSpectralFieldContract,
		];
		/** Direct L1 followed by transported L2 and L3 fields; L4 is absent. */
		pureRadianceByOrder: readonly [
			CpuDirectionalSpectralFieldContract,
			CpuDirectionalSpectralFieldContract,
			CpuDirectionalSpectralFieldContract,
		];
	}>;

/** Complete requested N=5 CPU build result. */
type DistantSunCpuCacheResultN5 = DistantSunCpuCacheResultBase &
	Readonly<{
		/** Requested recurrence-graph discriminator. */
		maximumScatteringOrder: 5;
		/** Pure J1 through J5 fields in ascending order. */
		pureScatteringDensityByOrder: readonly CpuDirectionalSpectralFieldContract[];
		/** Pure L1 through L4 fields in ascending order. */
		pureRadianceByOrder: readonly CpuDirectionalSpectralFieldContract[];
	}>;

/**
 * Identity properties excluded from the common distant-Sun CPU cache build request.
 *
 * - **"id"** - Per-field identity assigned by recurrence orchestration.
 * - **"provenanceIdentity"** - Per-field provenance assigned by recurrence orchestration.
 */
type DistantSunCpuCacheBuildRequestBaseExcludedProperty = 'id' | 'provenanceIdentity';

/** Physical collaborators and identities shared by every CPU build. */
type DistantSunCpuCacheBuildRequestBase = Omit<
	DistantSunPrimaryScatteringDensityBuildRequest,
	DistantSunCpuCacheBuildRequestBaseExcludedProperty
> &
	Readonly<{
		/** Configured BRDF owner, or null for black ground. */
		groundBoundary?: GroundBoundary | null;
		/** Executable construction domains selected by the retained profile. */
		domainSelection: DistantSunConstructionDomainSelection;
		/** Profile-selected executable interval count. */
		transportIntervalCount: number;
	}>;

/** Stronger geometry surface required when direct L1 is built. */
type DistantSunCpuCacheMultipleScatteringBuildRequestBase = Omit<DistantSunCpuCacheBuildRequestBase, 'geometry'> &
	Readonly<{
		/** Geometry surface required for direct L1. */
		geometry: DistantSunPrimaryRadianceGeometry;
		/** Source-created calculator shared with direct-primary L1. */
		calculator: DistantSunPrimaryRadianceCalculator;
	}>;

/** Physical inputs supplied to the source-owned public N=1 build. */
type DistantSunCpuCacheRequestN1Base = Omit<DistantSunCpuCacheBuildRequestBase, 'lightSource'>;

/**
 * Provider-owned properties excluded from public distant-Sun multiple-scattering requests.
 *
 * - **"lightSource"** - Configured source captured by the provider.
 * - **"geometry"** - Geometry replaced by the combined direct and later-order surface.
 * - **"calculator"** - Spectral calculator constructed by the provider.
 */
type DistantSunCpuCacheMultipleScatteringRequestBaseExcludedProperty = 'lightSource' | 'geometry' | 'calculator';

/** Physical inputs supplied to public multiple-scattering builds. */
type DistantSunCpuCacheMultipleScatteringRequestBase = Omit<
	DistantSunCpuCacheMultipleScatteringBuildRequestBase,
	DistantSunCpuCacheMultipleScatteringRequestBaseExcludedProperty
> &
	Readonly<{
		/** Geometry surface shared by direct and later-order scattering. */
		geometry: DistantSunPrimaryRadianceGeometry & DistantSunLaterOrderScatteringGeometry;
	}>;

/**
 * Native-profile sections replaced by explicit reflective-ground facts.
 *
 * - **"spectral"** - Spectral section strengthened with the exact configured basis.
 * - **"physical"** - Physical section strengthened with explicit ground albedo.
 */
type DistantSunReflectiveGroundProfileExcludedProperty = 'spectral' | 'physical';

/** Explicit profile facts owned by reflective ground. */
type DistantSunReflectiveGroundProfile = Omit<
	NativeProductionProfile,
	DistantSunReflectiveGroundProfileExcludedProperty
> &
	Readonly<{
		/** Exact native basis used by the configured boundary. */
		spectral: NativeProductionProfile['spectral'] &
			Readonly<{
				/** Native spectral basis used by the configured boundary. */
				basis: SpectralBasis;
			}>;
		/** Explicitly configured profile-owned albedo. */
		physical: NativePhysicalProfile &
			Readonly<{
				/** Explicit physical ground facts. */
				ground: Readonly<{
					/** Profile-owned spectral albedo. */
					albedo: SpectralReflectancePacket;
				}>;
			}>;
	}>;

/** Multiple-scattering request with the exact omitted-black boundary. */
type DistantSunCpuCacheBlackGroundMultipleScatteringRequestBase = Omit<
	DistantSunCpuCacheMultipleScatteringRequestBase,
	'groundBoundary'
> &
	Readonly<{
		/** Null reflective boundary that preserves the canonical black path. */
		groundBoundary?: null;
	}>;

/**
 * Properties replaced by an explicit reflective-ground CPU cache request.
 *
 * - **"groundBoundary"** - Boundary replaced by the required configured BRDF owner.
 * - **"geometry"** - Geometry strengthened with ground-reflection operations.
 * - **"atmosphere"** - Atmosphere strengthened with optical-depth integration.
 * - **"profile"** - Profile strengthened with explicit boundary-owned spectral facts.
 */
type DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBaseExcludedProperty =
	'groundBoundary' | 'geometry' | 'atmosphere' | 'profile';

/** Multiple-scattering request with an explicit profile-owned boundary. */
type DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase = Omit<
	DistantSunCpuCacheMultipleScatteringRequestBase,
	DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBaseExcludedProperty
> &
	Readonly<{
		/** Geometry-owned ground hits, position sampling, and paths. */
		geometry: DistantSunCpuCacheMultipleScatteringRequestBase['geometry'] & DistantSunGroundReflectionGeometry;
		/** Atmosphere-owned optical-depth integration. */
		atmosphere: DistantSunCpuCacheMultipleScatteringRequestBase['atmosphere'] &
			DistantSunGroundReflectionAtmosphere;
		/** BRDF owner configured from the same profile albedo. */
		groundBoundary: GroundBoundary;
		/** Explicit profile that owns the boundary albedo. */
		profile: DistantSunReflectiveGroundProfile;
	}>;

/** Explicit public N=1 build request without later-order collaborators. */
type DistantSunCpuCacheRequestN1 = DistantSunCpuCacheRequestN1Base &
	Readonly<{
		/** Explicit J1-only pass-graph selection. */
		maximumScatteringOrder: 1;
	}>;

/** Omitted-black public N=2 build request. */
type DistantSunCpuCacheBlackGroundRequestN2 = DistantSunCpuCacheBlackGroundMultipleScatteringRequestBase &
	Readonly<{
		/** Explicit J1, L1, and J2 pass-graph selection. */
		maximumScatteringOrder: 2;
	}>;

/** Reflective-ground public N=2 build request. */
type DistantSunCpuCacheReflectiveGroundRequestN2 = DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase &
	Readonly<{
		/** Explicit J1, L1, and J2 pass-graph selection. */
		maximumScatteringOrder: 2;
	}>;

/** Explicit public N=2 build request. */
type DistantSunCpuCacheRequestN2 = DistantSunCpuCacheBlackGroundRequestN2 | DistantSunCpuCacheReflectiveGroundRequestN2;

/** Omitted-black explicit or default public N=4 build request. */
type DistantSunCpuCacheBlackGroundRequestN4 = Omit<
	DistantSunCpuCacheBlackGroundMultipleScatteringRequestBase,
	'geometry'
> &
	Readonly<{
		/** Explicit or default J1-through-J4 pass-graph selection. */
		maximumScatteringOrder?: 4;
		/** Geometry surface required by the complete N4 recurrence. */
		geometry: DistantSunCpuCacheBlackGroundMultipleScatteringRequestBase['geometry'] &
			DistantSunScatteringDensityTransportGeometry;
	}>;

/** Reflective-ground explicit or default public N=4 build request. */
type DistantSunCpuCacheReflectiveGroundRequestN4 = Omit<
	DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase,
	'geometry'
> &
	Readonly<{
		/** Explicit or default J1-through-J4 pass-graph selection. */
		maximumScatteringOrder?: 4;
		/** Geometry surface required by the complete reflective N4 recurrence. */
		geometry: DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase['geometry'] &
			DistantSunScatteringDensityTransportGeometry;
	}>;

/** Explicit or default public N=4 build request. */
type DistantSunCpuCacheRequestN4 = DistantSunCpuCacheBlackGroundRequestN4 | DistantSunCpuCacheReflectiveGroundRequestN4;

/** Explicit public N=3 build request using the higher-order geometry surface. */
type DistantSunCpuCacheRequestN3 = Omit<DistantSunCpuCacheRequestN4, 'maximumScatteringOrder'> &
	Readonly<{maximumScatteringOrder?: 3}>;

/** Explicit public N=5 build request using the higher-order geometry surface. */
type DistantSunCpuCacheRequestN5 = Omit<DistantSunCpuCacheRequestN4, 'maximumScatteringOrder'> &
	Readonly<{maximumScatteringOrder?: 5}>;

/** Owners and options shared by every controller-derived distant-Sun GPU build plan. */
type DistantSunCacheControllerPlanRequestBase = Readonly<{
	/** Configured atmosphere construction contributor. */
	atmosphere: CacheBuildContributor &
		Readonly<{
			/** Spectral basis value. */ spectralBasis: SpectralBasis;
		}>;
	/**
	 * Optional scoped construction lattice; omission retains production
	 * Native48/Fibonacci34/W27.
	 */
	domainSelection?: DistantSunConstructionDomainSelection;
	/**
	 * Optional direct-plan comparison options; omission retains the production
	 * order-specific 15-interval options.
	 */
	constructionOptions?: CacheConstructionOptions;
	/** Optional executable reflective boundary; omission retains canonical black. */
	groundBoundary?: (GroundBoundary & CacheBuildContributor) | null;
}>;

/** Controller plan request that stops before stored-field transport. */
type DistantSunCacheControllerPlanRequestN1OrN2 = DistantSunCacheControllerPlanRequestBase &
	Readonly<{
		/** Geometry construction contributor. */
		geometry: CacheBuildContributor &
			Readonly<{
				/** Geometry configuration containing observation and placement identity. */
				configuration: SphericalEarthGeometryConfiguration;
			}>;
		/** Requested J1-only or J1-through-J2 graph. */
		maximumScatteringOrder: 1 | 2;
	}>;

/** Controller N4 plan request with packed transport-data ownership. */
type DistantSunCacheControllerPlanRequestN4 = DistantSunCacheControllerPlanRequestBase &
	Readonly<{
		/** Atmosphere contributor with transport sampling. */
		atmosphere: DistantSunCacheControllerPlanRequestBase['atmosphere'] & Pick<AtmosphereModel, 'sampleMedium'>;
		/** Geometry contributor with packed transport-data construction. */
		geometry: CacheBuildContributor &
			CacheTransportDataProvider &
			Readonly<{
				/** Geometry configuration containing observation and placement identity. */
				configuration: SphericalEarthGeometryConfiguration;
			}>;
		/** Requested J1-through-J4 graph. */
		maximumScatteringOrder: 4;
	}>;

/** Concrete owner request for one controller-derived distant-Sun GPU plan. */
type DistantSunCacheControllerPlanRequest =
	DistantSunCacheControllerPlanRequestN1OrN2 | DistantSunCacheControllerPlanRequestN4;

/** Configured distant source used by its per-runtime controller. */
type DistantSunCacheSource = CacheBuildContributor &
	Readonly<{
		/** Normalized source-owned construction values. */
		configuration: DistantSunLightSourceConfiguration;
	}>;

/** Construction collaborators for one distant-Sun GPU cache controller. */
type DistantSunCacheControllerConfiguration = Readonly<{
	/** Aggregate execution model retained for the controller lifetime. */
	model: SharedModel;
	/** Externally owned GPU backend. */
	backend: CacheGpuBackend;
	/** Optional cache-build scheduler. */
	scheduler?: CacheBuildScheduler;
}>;

/**
 * Geometry method names observed by the distant-Sun primary-radiance evaluator fixture.
 *
 * - **"expressPhysicalIncomingRadianceDirection"** - Physical incoming-direction mapping observed by the fixture.
 * - **"resolveCacheBuildRay"** - Construction-ray resolution observed by the fixture.
 */
type DistantSunPrimaryRadianceGeometrySpyMethod = 'expressPhysicalIncomingRadianceDirection' | 'resolveCacheBuildRay';

/** Ground-contribution controls for one distant-Sun evaluator fixture. */
type DistantSunGroundContributionEvaluationOptions = Readonly<{
	/** Pure J2, J3, or J4 order under evaluation. */
	scatteringOrder: 2 | 3 | 4 | 5;
	/** Physical normal at the selected ground hit. */
	normal: UnitVector3;
	/** Source-to-ground transmittance scalar. */
	sourceTransmittance: number;
	/** Ground-to-construction-position transmittance scalar. */
	groundToPositionTransmittance: number;
	/** Optional pure L1 ground illumination used by J3. */
	groundIlluminationRadiance?: CpuDirectionalSpectralFieldContract | null;
	/** Optional explicit-ground selection. */
	reflectiveGround?: boolean;
	/** Optional explicit BRDF scalar. */
	brdfValue?: number;
	/** Optional preceding pure-radiance scalar. */
	previousRadianceValue?: number;
	/** Optional construction-position stencil. */
	positionStencil?: ScatteringCachePositionStencil;
	/** Optional distinct final-view position stencil. */
	finalViewPositionStencil?: ScatteringCachePositionStencil;
	/** Optional distance to the selected ground hit. */
	groundHitDistance?: number;
}>;

/** Selected distant-Sun ground contribution and observed operation counts. */
type DistantSunGroundContributionEvaluationResult = Readonly<{
	/** Selected output scalar. */
	value: number;
	/** Number of source-path resolutions. */
	sourcePathCount: number;
	/** Number of return-path resolutions. */
	returnPathCount: number;
	/** Number of direct source-lighting samples. */
	sourceLightingCount: number;
	/** Legacy construction-position stencil count. */
	positionStencilCount: number;
	/** Number of construction-position stencil resolutions. */
	constructionPositionStencilCount: number;
	/** Number of final-view position stencil resolutions. */
	finalViewPositionStencilCount: number;
}>;
