/** Normalized piecewise-linear aerosol probability per unit direction cosine. */
type DistantSunMiePhaseTable = Readonly<{
	/** Strictly increasing cosine nodes from -1 to 1. */ mu: readonly number[];
	/** Nonnegative PDF samples; its trapezoidal integral is one. */ pdf: readonly number[];
}>;
/** Explicit aerosol material aligned with one compiler spectral channel. */
type DistantSunSpectralAerosolOptics = Readonly<{
	/** Scattering-to-extinction ratio in [0, 1]. */ mieSingleScatteringAlbedo: number;
	/** Optional normalized phase table; omission retains analytic phase. */ miePhaseTable?: DistantSunMiePhaseTable;
}>;

/** Progress from independent binary64 recurrence evaluation. */
type StrobingReferenceProgress = Readonly<{
	/** Number of memoized radiance evaluations. */ evaluations: number;
	/** Pure radiance order currently being evaluated. */ order: number;
}>;

/** Exact scene and support supplied to the offline distant-Sun cache compiler. */
type DistantSunSceneCacheCompilerScene = Readonly<{
	/** Exact scene Sun state. */
	readonly sceneSun: DistantSunSceneSunIdentity;
	/** Fixed scene support closed by the ledger. */
	readonly support: DistantSunSceneCacheSupport;
}>;

/** Serialized recurrence request consumed by the browser GPU compiler. */
type DistantSunSceneCacheCompilerBuildRequest = Readonly<{
	/** Qualified compiler identity. */
	id: string;
	/** Complete serialized numerical inputs. */
	transportSpec: DistantSunSceneCacheTransportSpec;
}>;

/** Coordinate convention used to generate the offline recurrence.
 * - **"scene-cache-receiver-local-v1"** - Receiver-local directions with tabulated local solar zenith.
 * - **"production-source-aligned-v1"** - Production source-aligned directions for one supplied unit source vector.
 */
type DistantSunSceneCacheCoordinateContract = 'scene-cache-receiver-local-v1' | 'production-source-aligned-v1';

/** Readonly shader inputs borrowed during one common-source generation call; optional fields retain compiler defaults. */
type DistantSunSceneCacheCommonShaderRequest = Readonly<{
	/** Explicit normalized phase PDF; omission retains analytic Mie phase. */ miePhaseTable?: DistantSunMiePhaseTable;
	/** Executable scattering correction and outgoing mapping; omission retains legacy. */ scatteringAccuracy?: DistantSunScatteringAccuracyMethod;
	/** Spectral sample center in nanometers. */ wavelengthNanometers: number;
	/** Unattenuated source irradiance density in watts per square meter per nanometer. */ sourceIrradiance: number;
	/** Ozone molecular absorption cross section in square meters. */ ozoneCrossSection: number;
	/** Peak ozone molecules per cubic meter; default 5.374e18. */ ozoneMaximumDensity?: number;
	/** Sea-level Rayleigh scattering per meter; null or omission derives it from wavelength and coefficient scale. */ rayleighScattering?:
		number | null;
	/** Sea-level Mie extinction per meter; null or omission derives it from the Angstrom parameters. */ mieExtinction?:
		number | null;
	/** Dimensionless Lambertian ground reflectance; default zero. */ groundAlbedo?: number;
	/** Spherical ground radius in meters; default 6360000. */ bottomRadiusMeters?: number;
	/** Spherical atmosphere-top radius in meters; default 6420000. */ topRadiusMeters?: number;
	/** Rayleigh exponential density scale height in meters; default 8000. */ rayleighScaleHeightMeters?: number;
	/** Mie exponential density scale height in meters; default 1200. */ mieScaleHeightMeters?: number;
	/** Rayleigh wavelength coefficient per meter with wavelength expressed in micrometers; default 0.00000124062. */ rayleighCoefficientScalePerMeter?: number;
	/** Dimensionless Mie wavelength exponent; default 0.8. */ mieAngstromAlpha?: number;
	/** Dimensionless Mie optical-depth scale; default 0.04. */ mieAngstromBeta?: number;
	/** Dimensionless Mie scattering-to-extinction ratio; default 0.8. */ mieSingleScatteringAlbedo?: number;
	/** Dimensionless Mie phase asymmetry; default 0.7. */ miePhaseFunctionG?: number;
	/** Source-path optical-depth interval count; default 20. */ sourcePathTransmittanceIntervalCount?: number;
	/** Incoming angular quadrature direction count; default 68. */ incomingDirectionCount?: number;
	/** Radiance-transport intervals per integration segment; default 15. */ transportIntervalCount?: number;
	/** Outgoing cubed-sphere nodes along each face edge; default 39. */ outgoingFaceWidth?: number;
	/** Readonly ground-relative heights in meters; null or omission uses 48 nodes with zero at index zero and ((index + 0.5) / 48) * 60000 elsewhere. */ positionAltitudesMeters?:
		readonly number[] | null;
	/** Readonly local solar-zenith angles in degrees; null or omission uses 180 nodes at index + 0.5. */ solarZenithDegrees?:
		readonly number[] | null;
	/** Serialized coordinate identity validated against DistantSunSceneCacheCoordinateContract; default scene-cache-receiver-local-v1. */ coordinateContract?: string;
	/** Readonly three-component unit source direction, required by the source-aligned convention; otherwise ignored. */ sourceDirection?:
		readonly number[] | null;
	/** Readonly explicit geometry policy; omission retains historical geometry equations. */ numericalPolicy?: DistantSunSceneCacheNumericalPolicy;
}>;

/** Readonly texture allocation inputs; upload data is borrowed and never mutated by the compiler. */
type DistantSunSceneCacheTextureRequest = Readonly<{
	/** Texture width in texels. */ width: number;
	/** Texture height in texels. */ height: number;
	/** WebGL sized internal format; default R32F. */ internalFormat?: number;
	/** WebGL upload component format; default RED. */ format?: number;
	/** WebGL upload scalar type; default FLOAT. */ type?: number;
	/** Borrowed upload view; null or omission allocates storage without supplied pixels. */ data?: ArrayBufferView<ArrayBuffer> | null;
}>;

/** Live recurrence field owned and released by one wavelength invocation. */
type DistantSunSceneCacheGpuField = Readonly<{
	/** Invocation-local field identity. */ id: string;
	/** Live texture handle, invalid after release. */ texture: WebGLTexture;
	/** Direction-column count. */ width: number;
	/** Altitude/solar-zenith row count. */ height: number;
	/** Logical allocation size in bytes. */ bytes: number;
}>;

/** Readonly ordered three-component unit vectors borrowed from an accepted incoming or outgoing direction domain. */
type DistantSunSceneCacheDirectionVectors = readonly (readonly number[])[];

/** Readonly sampler binding tuple consumed by a recurrence pass. */
type DistantSunSceneCacheTextureBinding = readonly [
	/** Zero-based texture unit. */ unit: number,
	/** Borrowed live compiler texture. */ texture: WebGLTexture,
	/** GLSL sampler uniform name. */ name: string,
	/** Diagnostic input field identity. */ fieldId: string,
];

/** Independently supplied uniform configuration capability for the currently bound program. */
interface DistantSunSceneCacheUniformApplier {
	/**
	 * Called by drawField to configure pass-specific uniforms before drawing.
	 * @param program - Borrowed linked program for this pass.
	 * @returns Completion after the uniform updates.
	 */
	(program: WebGLProgram): void;
}

/** Readonly recurrence pass inputs; textures and callbacks remain owned by the invocation. */
type DistantSunSceneCacheDrawFieldRequest = Readonly<{
	/** Pass identity for progress, timing, and ledger events. */ id: string;
	/** Linked recurrence program. */ program: WebGLProgram;
	/** Live destination field. */ output: DistantSunSceneCacheGpuField;
	/** Draw width in texels. */ width: number;
	/** Readonly sampler bindings; omission supplies no inputs. */ inputs?: readonly DistantSunSceneCacheTextureBinding[];
	/** Readonly uniform callbacks; omission applies no additional uniforms. */ uniforms?: readonly DistantSunSceneCacheUniformApplier[];
}>;

/** Mutable packed-row accumulator state private to a wavelength invocation. */
type DistantSunSceneCacheGpuAccumulator = {
	/** Borrowed readonly extraction request. */ readonly request: DistantSunSceneCacheCompilerExtraction;
	/** Compiler-owned mapping from packed rows to recurrence rows. */ readonly sourceRows: Int32Array<ArrayBuffer>;
	/** Compiler-owned integer row-map texture, deleted during cleanup. */ readonly rowMapTexture: WebGLTexture;
	/** Compiler-owned ping-pong textures, both deleted during cleanup. */ readonly textures: readonly WebGLTexture[];
	/** Mutable index of the latest complete accumulated field. */ activeIndex: number;
};

/** Mutable readback span assembled for one requested diagnostic row. */
type DistantSunSceneCacheProbeSpan = {
	/** First requested direction column, expanded during grouping. */ first: number;
	/** Last requested direction column, expanded during grouping. */ last: number;
	/** Compiler-owned contiguous readback values, present after row readback. */ values?: Float32Array<ArrayBuffer>;
};

/** Executable stable-root method.
 * - **"stable-factored"** - Factored radial offset and reciprocal near root.
 */
type DistantSunSceneCacheRootMethod = 'stable-factored';

/** Versioned candidate geometry policy; omission explicitly retains the legacy compiler control. */
type DistantSunSceneCacheNumericalPolicy = Readonly<{
	/** Diagnostic policy identity; algorithms use the explicit method and parameters. */ id: string;
	/** Supported serialized policy revision. */ revision: 1 | 2;
	/** Executable intersection method. */ rootMethod: DistantSunSceneCacheRootMethod;
	/** Revision-two precise logical-origin representation. */ positionMethod?: DistantSunSceneCachePositionMethod;
	/** One-sided surface evaluation height with metre units. */ surfaceLimit: Readonly<{
		value: number;
		units: 'meters';
	}>;
	/** Ground classification tolerance with metre units. */ surfaceTolerance: Readonly<{
		value: number;
		units: 'meters';
	}>;
	/** Positive intersection threshold with metre units. */ positiveRootTolerance: Readonly<{
		value: number;
		units: 'meters';
	}>;
}>;

/** Logical-origin representation for revision-two numerical policies.
 * - **"anchored-radial"** - Subtraction-free radial height anchored at the exact logical construction point.
 */
type DistantSunSceneCachePositionMethod = 'anchored-radial';

/** Explicit candidate selections for production compiler projections. */
type DistantSunSceneCacheCompilerOptions = Readonly<{
	/** Explicit matched per-channel aerosol optics; omission preserves canonical atmosphere inputs. */ spectralAerosols?: readonly DistantSunSpectralAerosolOptics[];
	/** Explicit corrected construction/mapping; omission retains deployed legacy. */ scatteringAccuracy?: DistantSunScatteringAccuracyMethod;
	/** Explicit altitude construction owner; omission retains Native48. */ positionDomain?: SphericalNativePositionDomainSelection;
	/** Stable-root surface candidate; omission retains historical equations. */ numericalPolicy?: DistantSunSceneCacheNumericalPolicy;
	/** Required solar lookup support; omission retains the linear control. */ solarInterpolation?: DistantSunSolarInterpolationMethod;
}>;

/** Complete profile with the canonical model facts consumed by the point-local compiler.
 * Native15 and Direct40 retain their own spectra, placement, altitude owner, and numerical controls.
 */
type DistantSunPointLocalExecutionProfile = Algorithm32ExecutionProfile &
	Readonly<{
		/** Canonical physical models, with explicit model-owned atmospheric constants. */
		models: Algorithm32ExecutionModels &
			Readonly<{
				/** Distant uniform source with an executable source-kind discriminator. */
				lightSource: LightSourceModel & Readonly<{/** Executable source category. */ kind: string}>;
				/** Canonical atmosphere and its complete density/phase configuration. */
				atmosphere: AtmosphereModel &
					Readonly<{
						/** Physical atmosphere configuration. */ constants: CanonicalAtmosphereConstants;
						/** Exact sea-level Rayleigh packet aligned to the selected spectral basis. */ seaLevelRayleighScattering: SpectralScatteringCoefficientPacket;
						/** Exact sea-level Mie extinction packet aligned to the selected spectral basis. */ seaLevelMieExtinction: SpectralExtinctionCoefficientPacket;
					}>;
			}>;
		/** Executable domains with the cubed-sphere reconstruction facts required by the compiler. */
		domains: Algorithm32ExecutionDomains &
			Readonly<{
				/** Cubed-sphere outgoing reconstruction domain. */
				outgoingDirections: ReconstructionDirectionDomain &
					Readonly<{
						/** Number of direction nodes along one cube-face edge. */ faceWidth: number;
						/** Canonical positive face-centre probe indexes. */ positiveFaceCenterIndices: CubedSpherePositiveFaceCenterIndices;
					}>;
			}>;
	}>;

/** Accepted projection of one complete profile into the point-local recurrence. */
type DistantSunPointLocalProfileInputSet = Readonly<{
	/** Owner of the profile projection and compiler invocation. */ compilerIdentity: string;
	/** Identity covering every executable construction input. */ numericalIdentity: string;
	/** Provenance identity of the selected physical construction profile. */ constructionProfileIdentity: Readonly<{
		/** Construction-profile name. */ id: string;
		/** Hash of the retained construction-profile facts. */ contentHash: string;
	}>;
	/** Complete serialized receiver-local recurrence input. */ buildRequest: DistantSunSceneCacheCompilerBuildRequest;
}>;

/** Compiler numerics shared by Native15 and direct-40 projections. */
type DistantSunSceneCacheCompilerNumerics = Readonly<{
	/** Executable corrected construction/mapping; omission retains legacy. */ scatteringAccuracy?: DistantSunScatteringAccuracyMethod;
	/** Source optical-depth quadrature interval count. */ sourcePathTransmittanceIntervalCount: number;
	/** Scattered-light transport quadrature interval count. */ transportIntervalCount: number;
	/** Cumulative order ceiling. */ maximumScatteringOrder: number;
	/** Explicit candidate geometry; absent for the historical control. */ geometryPolicy?: DistantSunSceneCacheNumericalPolicy;
	/** Runtime reconstruction contract; omission retains the linear control. */ solarInterpolation?: DistantSunSolarInterpolationMethod;
}>;

/** Physical and numerical data consumed by the offline recurrence. */
type DistantSunSceneCacheTransportSpec = Readonly<{
	/** Stable serialized specification identity. */ id: string;
	/** Physical source data. */ source: DistantSunSceneCacheCompilerSource;
	/** Planet radii and identity. */ planet: DistantSunSceneCacheCompilerPlanet;
	/** Atmospheric coefficients and ozone data. */ atmosphere: DistantSunSceneCacheCompilerAtmosphere;
	/** Ground identity. */ ground: Readonly<Record<string, string>>;
	/** Complete interval counts, order and optional candidate policy. */ numerical: DistantSunSceneCacheCompilerNumerics;
	/** Frozen sample domains. */ domains: DistantSunSceneCacheCompilerDomains;
	/** Optional accepted coordinate convention. */ shaderProfile?: DistantSunSceneCacheCompilerShaderProfile;
}>;
/** Serialized source irradiance and optional source-aligned direction. */
type DistantSunSceneCacheCompilerSource = Readonly<{
	/** Source identity. */ id: string;
	/** Native15 irradiance density values. */ spectralIrradianceDensity: readonly number[];
	/** Optional source-aligned direction. */ directionToLight?: readonly number[];
}>;
/** Spherical planet geometry in meters. */
type DistantSunSceneCacheCompilerPlanet = Readonly<{
	/** Geometry identity. */ id: string;
	/** Ground radius in meters. */ bottomRadiusMeters: number;
	/** Atmosphere radius in meters. */ topRadiusMeters: number;
}>;
/** Frozen atmospheric numerical coefficients. */
type DistantSunSceneCacheCompilerAtmosphere = Readonly<{
	/** Atmosphere identity. */ id: string;
	/** Rayleigh density scale in meters. */ rayleighScaleHeightMeters: number;
	/** Mie density scale in meters. */ mieScaleHeightMeters: number;
	/** Rayleigh scattering scale per meter. */ rayleighCoefficientScalePerMeter: number;
	/** Mie wavelength exponent. */ mieAngstromAlpha: number;
	/** Mie extinction scale. */ mieAngstromBeta: number;
	/** Mie single-scattering ratio. */ mieSingleScatteringAlbedo: number;
	/** Mie asymmetry parameter. */ miePhaseFunctionG: number;
	/** Ozone absorption specification. */ ozone: DistantSunSceneCacheCompilerOzone;
}>;
/** Ozone profile and absorption table. */
type DistantSunSceneCacheCompilerOzone = Readonly<{
	/** Stable ozone identity. */ id: string;
	/** Absorption selection. */ absorptionEnabled: boolean;
	/** Table temperature in kelvin. */ temperatureKelvin: number;
	/** Column density in Dobson units. */ dobsonUnits: number;
	/** Dobson-unit molecule conversion. */ dobsonUnitMoleculesPerSquareMeter: number;
	/** Integrated profile extent in meters. */ densityIntegralMeters: number;
	/** Profile knot altitudes in meters. */ profileAltitudesMeters: Readonly<Record<string, number>>;
	/** Cross-section samples. */ crossSectionTable: DistantSunSceneCacheCompilerCrossSections;
	/** Optional peak molecular density per cubic meter. */ maximumDensityPerCubicMeter?: number;
}>;
/** Uniform wavelength-grid molecular cross sections. */
type DistantSunSceneCacheCompilerCrossSections = Readonly<{
	/** First wavelength in nanometers. */ minimumNanometers: number;
	/** Last wavelength in nanometers. */ maximumNanometers: number;
	/** Sample spacing in nanometers. */ spacingNanometers: number;
	/** Cross-section unit identifier. */ units: string;
	/** Cross sections in square meters. */ values: readonly number[];
}>;
/** Optional shader coordinate selection preserved from the accepted compiler. */
type DistantSunSceneCacheCompilerShaderProfile = Readonly<{
	/** Serialized coordinate identity validated at common-shader ingress against DistantSunSceneCacheCoordinateContract. */ coordinateContract?: string;
}>;
/** One frozen coordinate axis with scalar-valued sample records. */
type DistantSunSceneCacheCompilerAxis = Readonly<{
	/** Domain identity. */ id: string;
	/** Sample count. */ count: number;
	/** Exact coordinates and ordinals. */ nodes: readonly Readonly<Record<string, number>>[];
}>;
/** Serialized angular domain and optional cubed-sphere or quadrature data. */
type DistantSunSceneCacheCompilerDirections = Readonly<{
	/** Direction-domain identity. */ id: string;
	/** Direction count. */ directionCount: number;
	/** Unit vectors in established order. */ unitVectors: DistantSunSceneCacheDirectionVectors;
	/** Optional cubed-sphere face width. */ faceWidth?: number;
	/** Optional cubed-sphere face-center indices. */ positiveFaceCenterIndices?: Readonly<Record<string, number>>;
	/** Optional quadrature weights in steradians. */ integrationWeightsSteradians?: readonly number[];
}>;
/** Native spectral sample with optional physical coefficient overrides. */
type DistantSunSceneCacheCompilerChannel = Readonly<{
	/** Explicit scattering-to-extinction ratio for this wavelength. */ mieSingleScatteringAlbedo?: number;
	/** Explicit normalized azimuth-integrated phase PDF for this wavelength. */ miePhaseTable?: DistantSunMiePhaseTable;
	/** Stable sample identity. */ id: string;
	/** Center wavelength in nanometers. */ centerNanometers: number;
	/** Sample width in nanometers. */ binWidthNanometers: number;
	/** Incident irradiance density. */ sourceIrradianceDensityWattsPerSquareMeterPerNanometer: number;
	/** Optional Rayleigh scattering per meter. */ rayleighScatteringPerMeter?: number;
	/** Optional Mie extinction per meter. */ mieExtinctionPerMeter?: number;
	/** Optional ground albedo. */ groundAlbedo?: number;
}>;
/** Frozen spectral basis in compiler serialization. */
type DistantSunSceneCacheCompilerSpectrum = Readonly<{
	/** Spectral-basis identity. */ id: string;
	/** Ordered Native15 samples. */ channels: readonly DistantSunSceneCacheCompilerChannel[];
}>;
/** Exact axes, directions, and wavelengths consumed by the compiler. */
type DistantSunSceneCacheCompilerDomains = Readonly<{
	/** Altitude domain. */ position: DistantSunSceneCacheCompilerAxis;
	/** Solar-zenith domain. */ solarZenith: DistantSunSceneCacheCompilerAxis;
	/** Incoming quadrature domain. */ incoming: DistantSunSceneCacheCompilerDirections;
	/** Outgoing cubed-sphere domain. */ outgoing: DistantSunSceneCacheCompilerDirections;
	/** Native15 spectral domain. */ spectrum: DistantSunSceneCacheCompilerSpectrum;
}>;
/** Complete scene extraction request for one recurrence. */
type DistantSunSceneCacheCompilerExtraction = Readonly<{
	/** Stable cache identity. */ cacheIdentity: string;
	/** Exact populated-row extraction ledger borrowed without mutation. */ ledger: DistantSunSceneCacheLedgerRecord;
}>;
/** Caller-owned spectral layer delivered after GPU readback. */
type DistantSunSceneCacheCompilerLayer = Readonly<{
	/** Extraction ordinal. */ cacheIndex: number;
	/** Wavelength ordinal within the supplied spectral domain. */ wavelengthIndex: number;
	/** Exact logical outgoing-direction values transferred to the callback; the compiler does not reuse this buffer. */ values: Float32Array<ArrayBuffer>;
}>;
/** Bounded contiguous readback tile; each callback settles before the next tile. */
type DistantSunSceneCacheCompilerReadbackTile = DistantSunSceneCacheCompilerLayer &
	Readonly<{
		/** First populated extraction row. */ firstPackedRow: number;
		/** Number of complete rows, from one through 64. */ rowCount: number;
	}>;
/** Optional order-specific extraction used by retained proof callers. */
type DistantSunSceneCacheCompilerOrderLayer = DistantSunSceneCacheCompilerLayer &
	Readonly<{
		/** Completed scattering order. */ order: number;
	}>;
/** Exact diagnostic sample coordinate. */
type DistantSunSceneCacheCompilerProbeCoordinate = Readonly<{
	/** Optional human-readable probe identity retained in the readback. */ label?: string;
	/** Direction column. */ x: number;
	/** Packed source row. */ y: number;
	/** Caller-owned metadata preserved by the coordinate copy. */ [property: string]: unknown;
}>;
/** One diagnostic field readback. */
type DistantSunSceneCacheCompilerFieldProbes = Readonly<{
	/** Field identity. */ fieldId: string;
	/** Wavelength ordinal. */ wavelengthIndex: number;
	/** Readonly probe values in requested order; empty for fields with no requested coordinates. */ values: readonly DistantSunSceneCacheCompilerProbeValue[];
}>;
/** Diagnostic coordinate with its exact GPU value. */
type DistantSunSceneCacheCompilerProbeValue = DistantSunSceneCacheCompilerProbeCoordinate &
	Readonly<{
		/** Readback scalar. */ value: number;
	}>;

/** Independently supplied observer capability; each delivery settles before the compiler continues. */
interface DistantSunSceneCacheCompilerObserver<Value> {
	/**
	 * Called by compileDistantSunSceneCacheWavelength to deliver progress or newly allocated readback data.
	 * A thrown error or rejection aborts this invocation; callers discard incomplete extraction.
	 * @param value - Delivered value with ownership specified by its canonical contract.
	 * @returns Immediate completion or an awaited delivery promise.
	 */
	(value: Value): void | Promise<void>;
}
/** One complete wavelength execution with optional bounded extraction callbacks. */
type DistantSunSceneCacheWavelengthRequest = Readonly<{
	/** Caller-owned WebGL2 context. */ gl: WebGL2RenderingContext;
	/** Exact compiler inputs. */ buildRequest: DistantSunSceneCacheCompilerBuildRequest;
	/** Ordinal within the supplied spectral domain, default seven. */ wavelengthIndex?: number;
	/** Awaited progress observer; omission performs no observation, and rejection aborts execution. */ reportProgress?: DistantSunSceneCacheCompilerObserver<string>;
	/** Whether to accumulate scene extraction fields; default false. */ compileSceneCaches?: boolean;
	/** Readonly extraction definitions in callback index order; default empty. */ sceneCacheRequests?: readonly DistantSunSceneCacheCompilerExtraction[];
	/** Complete-layer receiver when tile delivery is absent; omission discards completed layers. */ onSceneCacheLayer?: DistantSunSceneCacheCompilerObserver<DistantSunSceneCacheCompilerLayer>;
	/** Bounded receiver replacing complete-layer delivery; null or omission disables tiles. */ onSceneCacheTile?: DistantSunSceneCacheCompilerObserver<DistantSunSceneCacheCompilerReadbackTile> | null;
	/** Requested tile bound, one through 64 rows; default 64, checked only when a tile receiver exists. */ sceneCacheReadbackRowCount?: number;
	/** Cumulative order-layer receiver; null or omission disables this diagnostic readback. */ onSceneCacheOrderLayer?: DistantSunSceneCacheCompilerObserver<DistantSunSceneCacheCompilerOrderLayer> | null;
	/** Readonly field-specific probe coordinates, borrowed for this invocation; omission requests none. */ fieldProbeCoordinates?: Readonly<
		Record<string, readonly DistantSunSceneCacheCompilerProbeCoordinate[]>
	>;
	/** Awaited J1, L1, J2, L2, J3, L3, J4 probe deliveries; null or omission disables them. */ onFieldProbes?: DistantSunSceneCacheCompilerObserver<DistantSunSceneCacheCompilerFieldProbes> | null;
}>;

/** Version of the complete offline wavelength diagnostics.
 * - **"algorithm32-distant-sun-offline-wavelength-result-v1"** - Recurrence fields, extraction probes, timings, and logical allocation ledger.
 */
type DistantSunSceneCacheWavelengthResultSchema = 'algorithm32-distant-sun-offline-wavelength-result-v1';

/** Physical sample identity used during one completed recurrence. */
type DistantSunSceneCacheWavelengthIdentity = Readonly<{
	/** Ordinal in the supplied spectral domain. */ index: number;
	/** Spectral sample center in nanometers. */ centerNanometers: number;
	/** Unattenuated source irradiance density in watts per square meter per nanometer. */ sourceIrradianceDensityWattsPerSquareMeterPerNanometer: number;
	/** Interpolated molecular ozone absorption cross section in square meters. */ ozoneCrossSectionSquareMeters: number;
}>;

/** Logical recurrence texture dimensions. */
type DistantSunSceneCacheFieldLayout = Readonly<{
	/** Outgoing direction columns in scattering-density fields. */ widthJ: number;
	/** Incoming direction columns in radiance fields. */ widthL: number;
	/** Altitude count times solar-zenith count. */ height: number;
	/** Bytes per float32 component. */ scalarBytes: number;
}>;

/** Readonly WebGL implementation limits reported by the supplied context. */
type DistantSunSceneCacheGpuCapabilities = Readonly<{
	/** Maximum texture edge length in texels. */ maximumTextureSize: number;
	/** Maximum viewport width and height in pixels, in that order. */ maximumViewport: readonly number[];
}>;

/** Pure scattering-density field samples captured before its release. */
type DistantSunSceneCacheProjectionExposure = Readonly<{
	/** Scattering-order label supplied by the recurrence schedule. */ order: string;
	/** Sampled pure field identity. */ fieldId: string;
	/** Readonly diagnostic values in configured probe order. */ values: readonly DistantSunSceneCacheCompilerProbeValue[];
}>;

/** One packed-row diagnostic comparison of the cumulative float32 sum. */
type DistantSunSceneCacheAccumulationProbe = Readonly<{
	/** Extraction request ordinal. */ cacheIndex: number;
	/** Caller-supplied extraction identity. */ cacheIdentity: string;
	/** Scattering order just accumulated. */ order: number;
	/** Outgoing direction column. */ directionIndex: number;
	/** Diagnostic packed extraction row. */ packedRow: number;
	/** Corresponding full recurrence row. */ sourceRow: number;
	/** Cumulative value before the addition, zero for first order. */ previous: number;
	/** Pure scattering-density value added at this order. */ pure: number;
	/** Read-back cumulative scattering-density value. */ cumulative: number;
	/** Absolute difference from the binary64 sum of the two read-back addends. */ absoluteResidual: number;
}>;

/** Completed extraction measurements for one cache at one wavelength. */
type DistantSunSceneCacheCompiledCache = Readonly<{
	/** Extraction request ordinal. */ cacheIndex: number;
	/** Caller-supplied extraction identity. */ cacheIdentity: string;
	/** Complete packed extraction row count. */ packedRowCount: number;
	/** Outgoing direction count times packed row count. */ scalarCount: number;
	/** Complete logical float32 extraction size in bytes. */ logicalBytes: number;
	/** Whether every extracted scalar is finite. */ finite: boolean;
	/** Whether every extracted scalar is nonnegative. */ nonnegative: boolean;
	/** Maximum extracted scalar, with zero as the initial bound. */ maximum: number;
	/** Accumulated readPixels wall time in milliseconds. */ readbackMilliseconds: number;
	/** Accumulated awaited callback wall time in milliseconds. */ deliveryMilliseconds: number;
}>;

/** Operation recorded in the logical recurrence-field lifetime ledger.
 * - **"allocate"** - New field allocation and updated live bytes.
 * - **"release"** - Deleted field and updated live bytes, including the post-delete texture check.
 * - **"pass"** - Completed draw pass and its input/output field identities.
 */
type DistantSunSceneCacheLedgerOperation = 'allocate' | 'release' | 'pass';

/** Readonly allocation, release, or pass event; optional facts are present only for their documented operations. */
type DistantSunSceneCacheGpuLedgerEntry = Readonly<{
	/** Recorded lifetime or draw operation. */ operation: DistantSunSceneCacheLedgerOperation;
	/** Field identity for allocation/release, or pass identity for a draw. */ id: string;
	/** Field allocation bytes; present for allocation and release. */ bytes?: number;
	/** Live field bytes after the event; present for allocation and release. */ liveBytes?: number;
	/** WebGL texture status after deletion; present for release. */ isTextureAfterDelete?: boolean;
	/** Destination field identity; present for a pass. */ outputField?: string;
	/** Readonly ordered input field identities; present for a pass. */ inputFields?: readonly string[];
}>;

/** Completed recurrence pass timing, including draws and awaited progress delivery. */
type DistantSunSceneCacheGpuPassTiming = Readonly<{
	/** Pass identity. */ id: string;
	/** Pass wall time in milliseconds. */ milliseconds: number;
	/** Destination field identity. */ outputField: string;
	/** Readonly input field identities in sampler-binding order. */ inputFields: readonly string[];
}>;

/** Complete readonly diagnostics transferred to the caller after recurrence execution and resource cleanup. */
type DistantSunSceneCacheWavelengthResult = Readonly<{
	/** Serialized diagnostics version. */ schemaId: DistantSunSceneCacheWavelengthResultSchema;
	/** Physical spectral sample used for execution. */ wavelength: DistantSunSceneCacheWavelengthIdentity;
	/** Logical recurrence dimensions. */ fieldLayout: DistantSunSceneCacheFieldLayout;
	/** Reported WebGL implementation limits. */ capabilities: DistantSunSceneCacheGpuCapabilities;
	/** Pure J1 through J4 samples in recurrence order. */ projectionExposures: readonly DistantSunSceneCacheProjectionExposure[];
	/** Cumulative extraction sum probes; empty when extraction is disabled. */ accumulationProbes: readonly DistantSunSceneCacheAccumulationProbe[];
	/** Completed extraction diagnostics in request order; empty when extraction is disabled. */ compiledCaches: readonly DistantSunSceneCacheCompiledCache[];
	/** Recurrence-field lifetime and draw events in execution order. */ ledger: readonly DistantSunSceneCacheGpuLedgerEntry[];
	/** Completed pass timings in execution order. */ timings: readonly DistantSunSceneCacheGpuPassTiming[];
	/** Peak logical live recurrence-field bytes, excluding direction and extraction textures. */ peakLiveFieldBytes: number;
	/** Logical live recurrence-field bytes after scheduled releases and before final cleanup. */ finalLiveFieldBytes: number;
}>;

/** One explicitly requested receiver-local scene. */
type DistantSunPointLocalScene = {
	/** Caller-owned scene identity. */ id: string;
	/** Observer-to-Sun zenith angle in degrees. */ zenithDegrees: number;
	/** Observer height above the spherical ground in meters. */ observerAltitudeMeters: number;
	/** Optional observation instant or exact input label. */ instant?: string;
	/** Optional complete per-scene production-profile identity. */ profileIdentity?: Readonly<Record<string, string>>;
};
/** One bounded group of shared altitude/local-Sun-angle coordinates. */
type DistantSunPointLocalBlock = {
	/** Production 8x8 tile origin. */ tile: {altitudeIndex: number; solarZenithIndex: number};
	/** Populated coordinates retained by this bounded block. */ coordinates: number[][];
};
/** One requested scene and its ordered reconstruction indexes. */
type DistantSunPointLocalSceneInventory = {
	/** Position in the caller's scene list. */ ordinal: number;
	/** Exact caller input. */ request: DistantSunPointLocalScene;
	/** Interpolation-closed production ledger. */ ledger: DistantSunSceneCacheLedgerRecord;
	/** Coordinate keys in scene payload order. */ keys: string[];
	/** Index into the shared coordinate inventory for every scene row. */ indexes: number[];
};
/** Complete input-driven receiver-local shared inventory. */
type DistantSunPointLocalInventory = {
	/** Complete physical and numerical compiler request. */ buildRequest: DistantSunSceneCacheCompilerBuildRequest;
	/** Ordered scene consumers, including duplicates. */ scenes: DistantSunPointLocalSceneInventory[];
	/** Sorted unique altitude/local-Sun-angle coordinates. */ coordinates: number[][];
	/** Bounded block ownership. */ blocks: DistantSunPointLocalBlock[];
	/** Little-endian logical-to-unique W27 map. */ directionBytes: Buffer;
	/** Seam-deduplicated outgoing-direction count. */ uniqueDirectionCount: number;
	/** Logical W27 outgoing-direction count. */ logicalDirectionCount: number;
	/** Materialized spectral-channel count. */ channelCount: number;
	/** Materialized indexes into the complete spectral basis. */ wavelengths: number[];
	/** Maximum decoded bytes in one encoded block. */ maximumDecodedBlockBytes: number;
	/** Maximum encoded bytes in one stored block. */ maximumEncodedBlockBytes: number;
	/** Compiler extraction ledger for the complete union. */ unionLedger: DistantSunSceneCacheLedgerRecord;
};
/** One encoded point-local cache block. */
type DistantSunPointLocalPackageBlock = DistantSunPointLocalBlock & {
	/** Canonical block ordinal. */ ordinal: number;
	/** Decoded staging identity. */ decoded: {byteLength: number; sha256: string};
	/** Encoded repository artifact. */ encoded: DistantSunSharedCacheFileIdentity;
	/** Reversible codec identity. */ codec: string;
};
/** Serialized production point-local cache. */
type DistantSunPointLocalPackageRecord = {
	/** Format identity. */ schemaId: string;
	/** Complete package content identity. */ packageIdentity: string;
	/** Compiler identity. */ compilerIdentity: string;
	/** Serialized physical/numerical request. */ buildRequest: DistantSunSceneCacheCompilerBuildRequest;
	/** Physical quantity and units. */ physicalQuantity: Readonly<Record<string, string>>;
	/** Serialized dimensions and ordering. */ layout: {
		id: string;
		channelCount: number;
		wavelengthIndexes: number[];
		logicalDirectionCount: number;
		uniqueDirectionCount: number;
		coordinateCount: number;
		maximumDecodedBlockBytes: number;
		maximumEncodedBlockBytes: number;
	};
	/** Sorted shared coordinate inventory. */ coordinates: number[][];
	/** Ordered scene reconstruction indexes. */ scenes: DistantSunPointLocalSceneInventory[];
	/** Complete bounded block inventory. */ blocks: DistantSunPointLocalPackageBlock[];
	/** Logical-to-unique W27 map. */ directionMap: DistantSunSharedCacheFileIdentity;
};
/** Inputs to the point-local package finalizer. */
type DistantSunPointLocalPackageWriteRequest = {
	/** Repository artifact owner. */ files: SharedGenerationFiles;
	/** New package root. */ root: string;
	/** Completed decoded staging root. */ stagingRoot: string;
	/** Validated inventory. */ inventory: DistantSunPointLocalInventory;
	/** Production implementation identity. */ implementation: DistantSunSharedCacheImplementationIdentity & {
		sources?: Readonly<Record<string, unknown>>[];
	};
	/** Browser/GPU execution evidence. */ gpu: SharedGenerationGpuResult;
	/** Caller cancellation. */ signal: AbortSignal;
	/** Durable packaging progress. */ progress?: (event: Readonly<Record<string, unknown>>) => Promise<void>;
};
/** One production point-local compiler invocation. */
type DistantSunPointLocalCompileRequest = {
	/** New repository-relative run directory. */ outputDirectory: string;
	/** Complete physical/numerical construction request. */ buildRequest: DistantSunSceneCacheCompilerBuildRequest;
	/** Ordered scene list. */ scenes: DistantSunPointLocalScene[];
	/** Selected spectral indexes. */ wavelengths: number[];
	/** Caller-owned cancellation. */ signal: AbortSignal;
	/** Optional durable progress observer. */ onProgress?: (
		event: Readonly<Record<string, unknown>>,
	) => void | Promise<void>;
};
/** Accepted compiler result and work accounting. */
type DistantSunPointLocalCompileResult = {
	/** Successful completion. */ accepted: boolean;
	/** Production compiler identity. */ compilerIdentity: string;
	/** Repository-relative immutable run root. */ outputDirectory: string;
	/** Serialized cache identity. */ packageIdentity: string;
	/** Package manifest artifact. */ manifest: DistantSunSharedCacheFileIdentity;
	/** Input artifact. */ input: DistantSunSharedCacheFileIdentity;
	/** Implementation artifact. */ implementation: DistantSunSharedCacheFileIdentity;
	/** Requested scene count. */ sceneCount: number;
	/** Materialized channel count. */ channelCount: number;
	/** Unique coordinate count. */ coordinateCount: number;
	/** Encoded block count. */ blockCount: number;
	/** Decoded shared staging bytes. */ stagedBytes: number;
	/** Browser/GPU execution evidence. */ gpu: SharedGenerationGpuResult;
	/** Complete wall time in milliseconds. */ elapsedMilliseconds: number;
};

/** Complete normalized input set for one offline distant-Sun scene-cache build. */
type DistantSunSceneCacheCompilerInputSet = Readonly<{
	/** Stable production compiler identity. */
	readonly compilerIdentity: string;
	/** Complete numerical compatibility identity. */
	readonly numericalIdentity: string;
	/** Exact scene and support. */
	readonly scene: DistantSunSceneCacheCompilerScene;
	/** Executable packed-row ledger. */
	readonly ledger: DistantSunSceneCacheLedger;
	/** Browser-GPU recurrence request. */
	readonly buildRequest: DistantSunSceneCacheCompilerBuildRequest;
}>;

/** Canonical destination of one union coordinate in direct block staging. */
type SharedGenerationStagingLocation = {
	/** Ordered canonical block index. */ block: number;
	/** Populated row within that block. */ row: number;
};
/** Exact result of a bounded source read. */
type SharedGenerationReadResult = {
	/** Number of bytes actually read. */ bytesRead: number;
};
/** Exact result of a bounded destination write. */
type SharedGenerationWriteResult = {
	/** Number of bytes actually persisted. */ bytesWritten: number;
};
/** Required ordinary-file facts. */
type SharedGenerationFileFacts = {
	/** Logical file length. */ size: number;
};
/** Narrow offline file capability implemented by the Node-owned handle. */
interface SharedGenerationFileHandle {
	/** Reads at an absolute offset into bounded storage. */ read(
		bytes: Uint8Array,
		offset: number,
		length: number,
		position: number,
	): Promise<SharedGenerationReadResult>;
	/** Writes a bounded range at an absolute offset. */ write(
		bytes: Uint8Array,
		offset: number,
		length: number,
		position: number,
	): Promise<SharedGenerationWriteResult>;
	/** Persists one complete artifact. */ writeFile(bytes: Uint8Array): Promise<void>;
	/** Flushes outstanding writes. */ sync(): Promise<void>;
	/** Releases the handle. */ close(): Promise<void>;
	/** Fixes the target's logical extent. */ truncate(length: number): Promise<void>;
	/** Returns the source's logical extent. */ stat(): Promise<SharedGenerationFileFacts>;
}
/** Repository-contained offline artifact capability. */
interface SharedGenerationFiles {
	/** Resolves a real ordinary repository path. */ resolve(relativePath: string): Promise<string>;
	/** Creates contained ordinary directories. */ directory(relativePath: string): Promise<string>;
	/** Exclusively creates an open-run file. */ create(relativePath: string): Promise<SharedGenerationFileHandle>;
	/** Reads a bounded authenticated artifact. */ read(
		relativePath: string,
		expected?: DistantSunSharedCacheFileIdentity | null,
		maximumBytes?: number,
	): Promise<Buffer>;
	/** Writes an exclusive complete artifact. */ write(
		relativePath: string,
		bytes: Uint8Array,
	): Promise<DistantSunSharedCacheFileIdentity>;
	/** Replaces the current open run's progress. */ progress(relativePath: string, value: unknown): Promise<void>;
	/** Computes exact byte identity. */ hash(bytes: string | Uint8Array): string;
}
/** Private host's tile-delivery capability. */
interface SharedGenerationTileSink {
	/** Persists an ordered bounded tile. */ accept(
		channel: number,
		firstRow: number,
		bytes: Uint8Array,
	): Promise<void>;
}
/** Bounded request stream consumed by the private host. */
interface SharedGenerationIncomingMessage extends AsyncIterable<Buffer> {}
/** Local response-writing capability. */
interface SharedGenerationServerResponse {
	/** Emits explicit response framing. */ writeHead(
		status: number,
		headers: Readonly<Record<string, string>>,
	): unknown;
	/** Completes the response body. */ end(body: string | Uint8Array): unknown;
}
/** Canonical production tile origin. */
type SharedGenerationTile = DistantSunSharedCacheBlockDescriptor['tile'];
/** Measured graphics implementation. */
type SharedGenerationGpuIdentity = {
	/** WebGL API identity. */ api: string;
	/** Driver renderer identity. */ renderer: string;
};
/** Independently reconstructed control payload. */
type SharedGenerationSceneVerification = {
	/** Canonical scene identity. */ id: string;
	/** Payload byte count. */ byteLength: number;
	/** Exact reconstructed digest. */ sha256: string;
	/** Whether every byte matched. */ exact: boolean;
};
/** Expected persisted metadata root before publication. */
type SharedGenerationGraphRequest = {
	/** Contained artifact reader. */ files: SharedGenerationFiles;
	/** Unpublished package directory. */ candidateRoot: string;
	/** Authenticated package-set root. */ reportArtifact: DistantSunSharedCacheFileIdentity;
	/** Caller-owned cancellation. */ signal: AbortSignal;
};
/** Fully authenticated persisted metadata graph. */
type SharedGenerationGraph = {
	/** Persisted package-set report. */ report: DistantSunSharedCachePackageSetReport;
	/** Persisted configuration. */ configuration: DistantSunSharedCacheConfigurationManifest;
	/** Persisted block ownership. */ blockIndex: DistantSunSharedCacheBlockIndex;
	/** Persisted scene catalog. */ catalog: DistantSunSharedCacheRuntimeCatalog;
	/** Persisted scene manifests in ordinal order. */ scenes: DistantSunSharedCacheSceneManifest[];
	/** Authenticated metadata size. */ metadataBytes: number;
	/** Authenticated metadata and direction-index artifacts. */ metadataArtifactCount: number;
};
/** A verified immutable control scene and its exact coordinate order. */
type SharedGenerationScene = {
	/** Canonical scene ordinal. */ ordinal: number;
	/** Contained control directory. */ base: string;
	/** Accepted dense manifest. */ manifest: DistantSunSceneCacheManifestRecord;
	/** Accepted packed-row ledger. */ ledger: DistantSunSceneCacheLedgerRecord;
	/** Altitude:zenith keys in packed-row order. */ coordinates: string[];
	/** Immutable parent manifest identity. */ manifestArtifact: DistantSunSharedCacheFileIdentity;
};
/** A populated 8x8 tile before encoding. */
type SharedGenerationBlock = {
	/** Aligned tile origin. */ tile: SharedGenerationTile;
	/** Populated coordinates in canonical order. */ coordinates: DistantSunSharedCacheCoordinate[];
};
/** Authenticated shared union and exact compiler parameters. */
type SharedGenerationInventory = {
	/** Complete ordered control set. */ scenes: SharedGenerationScene[];
	/** Exact sorted union. */ coordinates: DistantSunSharedCacheCoordinate[];
	/** Complete sorted block set. */ blocks: SharedGenerationBlock[];
	/** Common extraction ledger. */ unionLedger: DistantSunSceneCacheLedgerRecord;
	/** Serialized compiler request. */ buildRequest: DistantSunSceneCacheCompilerBuildRequest;
	/** Physical and numerical identities of the field being generated. */
	configuration: {
		atmosphereIdentity: string;
		geometryIdentity: string;
		groundIdentity: string;
		numericalIdentity: string;
	};
	/** Exact logical-to-unique u16 bytes. */ directionBytes: Buffer;
	/** Authenticated catalog parent. */ catalogArtifact: DistantSunSharedCacheFileIdentity;
};
/** Browser-produced execution measurements for the common-field recurrence. */
type SharedGenerationGpuResult = {
	/** Successful completion. */ accepted: boolean;
	/** Entire GPU host execution time. */ elapsedMilliseconds: number;
	/** Per-wavelength compiler evidence. */ wavelengths: Readonly<Record<string, unknown>>[];
	/** Browser implementation identity. */ userAgent: string;
	/** Actual renderer and API identifiers. */ gpu: SharedGenerationGpuIdentity;
	/** Largest requested readback allocation. */ maximumReadbackBytes: number;
	/** Simultaneously live union accumulators. */ unionAccumulatorBytes: number;
};
/** Common host request shared by the private compiler and run owner. */
type SharedGenerationHostRequest = {
	/** Optional stricter host deadline in milliseconds; defaults to the 900,000 ms production ceiling. */ maximumMilliseconds?: number;
	/** Repository filesystem owner. */ files: SharedGenerationFiles;
	/** Exclusive open run root. */ runRoot: string;
	/** Accepted control union. */ inventory: SharedGenerationInventory;
	/** Direct tile receiver. */ staging: SharedGenerationTileSink;
	/** Local Chrome executable. */ chromePath: string;
	/** Caller-owned cancellation signal. */ signal: AbortSignal;
	/** Durable progress receiver. */ progress: (event: Readonly<Record<string, unknown>>) => Promise<void>;
};
/** Complete finalizer request with immutable derivation parents. */
type SharedGenerationPackageRequest = {
	/** Contained artifact owner. */ files: SharedGenerationFiles;
	/** Accepted control metadata. */ inventory: SharedGenerationInventory;
	/** Unpublished package root. */ candidateRoot: string;
	/** Complete block staging root. */ stagingRoot: string;
	/** Exact implementation identity. */ implementation: DistantSunSharedCacheImplementationIdentity;
	/** Derivation parents. */ parents: DistantSunSharedCacheDerivationParent[];
	/** Exact numerical parameter digest. */ parametersSha256: string;
	/** Browser implementation identity. */ browserVersion: string;
	/** Caller cancellation. */ signal: AbortSignal;
	/** Durable progress receiver. */ progress: (event: Readonly<Record<string, unknown>>) => Promise<void>;
};
/** Complete candidate metadata graph returned by the finalizer. */
type SharedGenerationPackageResult = {
	/** Executable package root. */ report: DistantSunSharedCachePackageSetReport;
	/** Root artifact identity. */ reportArtifact: DistantSunSharedCacheFileIdentity;
	/** Accepted physical/numerical configuration. */ configuration: DistantSunSharedCacheConfigurationManifest;
	/** Accepted block index. */ blockIndex: DistantSunSharedCacheBlockIndex;
	/** Accepted ordered catalog. */ catalog: DistantSunSharedCacheRuntimeCatalog;
	/** Total compressed payload bytes. */ encodedBytes: number;
};
/** Independent reconstruction inputs. */
type SharedGenerationVerificationRequest = {
	/** Contained filesystem. */ files: SharedGenerationFiles;
	/** Immutable control set. */ inventory: SharedGenerationInventory;
	/** Candidate metadata. */ candidate: SharedGenerationPackageResult;
	/** Unpublished candidate root. */ candidateRoot: string;
	/** Exact decoded staging root. */ stagingRoot: string;
	/** Cancellation signal. */ signal: AbortSignal;
	/** Durable progress receiver. */ progress: (event: Readonly<Record<string, unknown>>) => Promise<void>;
};
/** All-scene exactness and allocation evidence. */
type SharedGenerationVerificationResult = {
	/** True only after every exact comparison. */ accepted: boolean;
	/** Independently reconstructed identities. */ scenes: SharedGenerationSceneVerification[];
	/** Total reconstructed generated-scene bytes verified. */ comparedBytes: number;
	/** Encoded block validation time. */ blockVerificationMilliseconds: number;
	/** Full verification time. */ elapsedMilliseconds: number;
	/** Bounded row comparison allocation. */ comparisonBufferBytes: number;
	/** Authenticated persisted metadata artifacts. */ metadataArtifactCount: number;
	/** Authenticated persisted metadata byte count. */ metadataBytes: number;
};
/** Explicit generator execution dependencies. */
type SharedGenerationRequest = DistantSunSceneCacheCompilerOptions & {
	/** Optional exclusive contained run destination; omission retains the ordinary generated run root. */ outputDirectory?: string;
	/** Local GPU-capable Chrome executable. */ chromePath: string;
	/** Caller-owned cancellation. */ signal: AbortSignal;
	/** Observes completed durable progress events; rejection cancels generation before publication. */ onProgress?: (
		event: Readonly<Record<string, unknown>>,
	) => void | Promise<void>;
};
/** Accepted immutable run and measured production limits. */
type SharedGenerationRunResult = {
	/** Successful acceptance. */ accepted: boolean;
	/** Unique run identity. */ runId: string;
	/** New content-addressed publication directory. */ publishedRoot: string;
	/** Package graph identity. */ packageSetIdentity: string;
	/** Root report digest. */ packageSetSha256: string;
	/** Complete candidate bytes. */ candidateBytes: number;
	/** Complete open run footprint before final acceptance records. */ workingBytesBeforePublication: number;
	/** Declared logical working-disk ceiling. */ maximumWorkingBytes: number;
	/** Declared Node process memory ceiling, excluding browser/driver overhead. */ maximumNodeRssBytes: number;
	/** Unique block staging bytes. */ stagedBytes: number;
	/** Eliminated duplicated scene staging bytes. */ avoidedSceneStagingBytes: number;
	/** Complete generation wall time. */ elapsedMilliseconds: number;
	/** Compression and metadata wall time. */ compressionAndMetadataMilliseconds: number;
	/** Independent verification wall time. */ verificationMilliseconds: number;
	/** Observed peak host RSS. */ peakRssBytes: number;
	/** Observed peak Node array-buffer allocation. */ peakArrayBufferBytes: number;
	/** Maximum requested GPU readback bytes. */ maximumReadbackBytes: number;
	/** Exact union accumulator allocation. */ unionAccumulatorBytes: number;
	/** Verified scene count. */ sceneCount: number;
	/** Complete block count. */ blockCount: number;
	/** Exact source implementation. */ implementation: DistantSunSharedCacheImplementationIdentity;
	/** Immutable derivation roots. */ parents: DistantSunSharedCacheDerivationParent[];
};
/** Chromium's optional measured JavaScript heap extension. */
type SharedQualificationPerformance = Performance & {
	/** Browser-observed heap allocation, excluding GPU and native process memory. */
	memory?: {usedJSHeapSize: number};
};
/** CommonJS plugin's callable runtime export across its legacy declaration boundary. */
type SharedQualificationCommonJsFactory = () => import('rollup').Plugin;

/** Candidate shared packet rendering or immutable dense numerical control. */
type SharedQualificationSelection = 'shared' | 'dense';
/** Coherence observed after actual production render calls. */
type SharedQualificationCoherence = {
	/** Maximum simultaneous atlas bytes observed after render. */ peakGpuBytes: number;
	/** Maximum explicit host pins observed after render. */ peakPinnedBytes: number;
	/** Maximum browser JavaScript heap bytes observed after render. */ peakHeapBytes: number;
	/** Rendered frame count. */ frames: number;
	/** Bounded failed selection comparisons. */ failures: {
		ordinal: number | null;
		actual: number | null;
		identity: string;
	}[];
	/** Published generation changes. */ generations: {generation: number; ordinal: number | null; identity: string}[];
};
/** Measured application state at a qualification boundary. */
type SharedQualificationSnapshot = {
	/** Public rendering diagnostics. */ canvas: DOMStringMap;
	/** Atmospheric source direction. */ direction: number[];
	/** Geometry source direction. */ geometryDirection: number[];
	/** Receiver-light snapshot identity. */ receiverIdentity: string;
	/** Whether the initial runtime is retained. */ sameRuntime: boolean;
	/** Whether the initial shader handle is retained. */ sameHandle: boolean;
	/** Compiled program identities. */ programs: number[];
	/** Renderer-owned live counts. */ rendererMemory: {geometries: number; textures: number};
	/** Shared residency facts, absent for the dense control. */ cache?: DistantSunSharedCacheControllerDiagnostics;
	/** Worker and host retention facts. */ transport?: DistantSunSharedCacheTransportDiagnostics;
	/** WebGL error code. */ glError: number;
	/** Physical framebuffer dimensions. */ drawingBuffer: number[];
	/** Reported driver identity. */ gpu: string;
	/** Browser-observed JavaScript heap bytes. */ heapBytes?: number;
	/** Post-render selection observations. */ coherence: SharedQualificationCoherence;
};
/** Complete rendered RGBA8 framebuffer in WebGL row order. */
type SharedQualificationPixels = {width: number; height: number; base64: string};
/** One physical time change through the production controller. */
type SharedQualificationTransition = {
	/** Requested solar zenith. */ degrees: number;
	/** Preparation and publication wall time. */ elapsedMilliseconds: number;
	/** State before the request. */ before: SharedQualificationSnapshot;
	/** State after publication. */ after: SharedQualificationSnapshot;
	/** GPU query observations collected during preparation. */ samples: ShaderPerformanceSample[];
	/** Bounded receiver-light stage timings. */ preparationStages: {operation: string; milliseconds: number}[];
};
/** Timing observations outside recording work. */
type SharedQualificationMeasurement = {
	/** Completed-frame wall durations in milliseconds. */ durations: number[];
	/** Asynchronously available GPU timing queries. */ samples: ShaderPerformanceSample[];
	/** State after measurement. */ state: SharedQualificationSnapshot;
};
/** Exact resident block comparison counts. */
type SharedQualificationProbe = {blocks: number; scalars: number; totalBlocks: number};
/** Entire catalog traversal while visible rendering is paused. */
type SharedQualificationInventoryEntry = SharedQualificationProbe & {
	/** Catalog ordinal. */ ordinal: number;
	/** Residency after publication. */ diagnostics: DistantSunSharedCacheControllerDiagnostics;
};
/** Actual application fault and restoration observations. */
type SharedQualificationLifecycle = {
	/** Superseded request was rejected. */ supersession: boolean;
	/** Complete last-good state. */ beforeMiss: SharedQualificationSnapshot;
	/** Preserved state after an unqualified jump. */ afterMiss: SharedQualificationSnapshot;
	/** Texture-free data state. */ dark: SharedQualificationTransition;
	/** Latest observation before losing the context. */ beforeLoss: SharedQualificationSnapshot;
	/** Restored matching observation. */ afterLoss: SharedQualificationSnapshot;
};
/** Independent dense-control bit oracle for one shared block. */
type SharedQualificationOracleBlock = {
	/** Authenticated block identity. */ blockId: string;
	/** Populated row count. */ rowCount: number;
	/** Immutable dense payload identities or authenticated candidate decode. */ parents: (
		| {
				row: number;
				coordinate: readonly number[];
				artifact: DistantSunSharedCacheFileIdentity;
				denseRow: number;
				denseRowCount: number;
		  }
		| {
				/** Authenticated encoded candidate block. */ artifact: DistantSunSharedCacheFileIdentity;
				/** Expected decoded identity. */ decoded: Readonly<{byteLength: number; sha256: string}>;
		  }
	)[];
	/** Exact expected RGBA bits at independently chosen packet coordinates. */ samples: {
		row: number;
		face: number;
		u: number;
		v: number;
		packet: number;
		expected: number[];
	}[];
	/** Equation used to derive expected bits from dense inputs. */ operation: string;
};

/** Browser settings for the unified production compiler. */
type SharedCompilerDefinition = {
	/** Absolute installed Chrome executable; required for explicit-input compilation. */ chromePath?: string;
	/** Positive GPU deadline in milliseconds, at most 900000. */ maximumMilliseconds?: number;
};
/** Completed common compilation before package serialization. */
type SharedCompilerComputation = {
	/** Complete browser execution evidence. */ gpu: SharedGenerationGpuResult;
	/** Exact unique-direction bytes written into staging. */ stagedBytes: number;
};

/** Execution settings accepted by the common compiler lifecycle. */
type SharedCompilerExecution = SharedCompilerDefinition & {
	/** Caller-owned cancellation, retained only for this invocation. */ signal: AbortSignal;
};
/** Source-authenticated identity of the expanded compilation implementation. */
type SharedCompilerImplementation = DistantSunSharedCacheImplementationIdentity & {
	/** Complete direct source identities used to derive the implementation digest. */ sources: DistantSunSharedCacheFileIdentity[];
};
