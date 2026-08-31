/** Canonical spectral channel before assembly into the Native-15 basis and source packet. */
type SpectralChannelConstant = Readonly<{
	/** Channel identifier. */
	name: string;
	/** Unit-bearing channel-center wavelength. */
	wavelength: Wavelength;
	/** Unit-bearing top-of-atmosphere source irradiance density. */
	sourceIrradiance: UnitValue<'W m^-2 nm^-1'>;
	/** Unit-bearing wavelength-bin width. */
	wavelengthBinWidth: Wavelength;
}>;

/** Readonly physical configuration for the Native-15 production profile. */
type NativePhysicalProfile = Readonly<{
	/** Native physical-profile kind. */
	readonly kind: 'algorithm32-native-physical-profile';
	/** Unique identifier for the physical profile. */
	readonly id: string;
	/** Physical-profile schema revision. */
	readonly schemaRevision: string;
	/** Physical-profile value revision. */
	readonly revision: number;
	/** Production role of the profile. */
	readonly role: 'native-production-default';
	/** False because this profile does not target paper-comparison parity. */
	readonly comparisonParity: false;
	/** Spherical geometry dimensions fixed by the Native-15 physical profile. */
	readonly geometry: Readonly<{
		/** Unit-bearing ground radius. */
		readonly bottomRadius: Distance;
		/** Unit-bearing top-of-atmosphere radius. */
		readonly topRadius: Distance;
	}>;
	/** Atmospheric constituent constants fixed by the Native-15 physical profile. */
	readonly atmosphere: Readonly<{
		/** Rayleigh scattering constants. */
		readonly rayleigh: Readonly<{
			/** Unit-bearing Rayleigh density scale height. */
			readonly scaleHeight: Distance;
			/** Unit-bearing Rayleigh coefficient scale. */
			readonly coefficientScale: InverseDistance;
		}>;
		/** Mie scattering constants. */
		readonly mie: Readonly<{
			/** Unit-bearing Mie density scale height. */
			readonly scaleHeight: Distance;
			/** Dimensionless Angstrom alpha exponent. */
			readonly angstromAlpha: Dimensionless;
			/** Dimensionless Angstrom beta coefficient. */
			readonly angstromBeta: Dimensionless;
			/** Dimensionless Mie single-scattering albedo. */
			readonly singleScatteringAlbedo: Dimensionless;
			/** Dimensionless Mie phase-function asymmetry. */
			readonly phaseAsymmetry: Dimensionless;
		}>;
		/** Ozone absorption selection. */
		readonly ozone: Readonly<{
			/** Whether ozone absorption is enabled. */
			readonly absorptionEnabled: boolean;
		}>;
	}>;
	/** Explicitly configured physical ground facts; absent in the documented default. */
	readonly ground?: Readonly<{
		/** Profile-owned spectral hemispherical reflectance. */
		readonly albedo: SpectralReflectancePacket;
	}>;
}>;

/** Readonly numerical configuration for the Native-15 production profile. */
type NativeNumericalProfile = Readonly<{
	/** Native numerical-profile kind. */
	readonly kind: 'algorithm32-native-numerical-profile';
	/** Unique identifier for the numerical profile. */
	readonly id: string;
	/** Numerical-profile schema revision. */
	readonly schemaRevision: string;
	/** Numerical-profile value revision. */
	readonly revision: number;
	/** Production role of the profile. */
	readonly role: 'native-production-default';
	/** False because this profile does not target paper-comparison parity. */
	readonly comparisonParity: false;
	/** View-path integration selection, with a documented default of 15 intervals. */
	readonly viewPath: Readonly<{
		/** View-path integration interval count. */
		readonly intervalCount: number;
		/** Native uniform endpoint/trapezoid placement. */
		readonly sampleDistribution: null;
	}>;
	/** Source-path transmittance selection, with a documented default of 20 intervals. */
	readonly sourcePathTransmittance: Readonly<{
		/** Source-path integration interval count. */
		readonly intervalCount: number;
	}>;
	/** Cache-construction selection, with defaults of 15 transport intervals and scattering through order 4. */
	readonly cacheConstruction: CacheConstructionOptions;
}>;

/** Runtime-validated Native-15 source irradiance-density packet. */
type NativeSourceIrradianceDensity = SpectralIrradiancePacket;

/** Runtime-validated Native-15 ground-albedo packet. */
type NativeGroundAlbedo = SpectralReflectancePacket;

/**
 * Caller-supplied overrides for the documented Native-15 production default.
 *
 * These are all configurable selections within this named profile. Its
 * Native-15 spectral basis and canonical atmosphere constants are fixed facts;
 * changing either requires another named profile rather than an override.
 * Executable domains and shader-only path-sample placement remain selections
 * of their geometry, source, and runtime owners rather than profile options.
 */
type NativeProductionProfileOverrides = Readonly<{
	/** Replacement production-profile identifier. */
	readonly id?: string;
	/** Replacement production-profile revision. */
	readonly revision?: number;
	/** Compatible replacement Native-15 source irradiance density. */
	readonly sourceIrradianceDensity?: NativeSourceIrradianceDensity;
	/** Explicit Native-15 ground albedo; omission retains the default without reflective ground. */
	readonly albedo?: NativeGroundAlbedo;
	/** Replacement positive view-path integration interval count. */
	readonly pathIntervalCount?: number;
	/** Replacement positive source-path transmittance interval count. */
	readonly sourceTransmittanceIntervalCount?: number;
	/** Replacement positive cache-transport integration interval count. */
	readonly transportIntervalCount?: number;
	/** Replacement supported maximum scattering order. */
	readonly maximumScatteringOrder?: SupportedCacheScatteringOrder;
}>;

/**
 * Readonly Native-15 production configuration with one documented default.
 *
 * The default differs from the direct-40 paper-comparison configuration in
 * every following fixed selection:
 *
 * - fifteen equal-width bin-average channels instead of the published forty
 *   wavelength coordinates;
 * - the canonical Native-15 production source packet instead of the paper
 *   solar packet;
 * - the canonical production atmosphere with ozone absorption disabled
 *   instead of the paper atmosphere; and
 * - omitted reflective ground instead of profile-owned Lambertian grass.
 *
 * The numerical default uses 15 view-path intervals, 20 source-path
 * transmittance intervals, 15 cache-transport intervals, and cumulative
 * scattering through order 4. `NativeProductionProfileOverrides` contains
 * every caller-configurable selection within this profile.
 */
type NativeProductionProfile = Readonly<{
	/** Native production-profile kind. */
	readonly kind: 'algorithm32-native-production-profile';
	/** Unique identifier for the production profile. */
	readonly id: string;
	/** Production-profile schema revision. */
	readonly schemaRevision: string;
	/** Production-profile value revision. */
	readonly revision: number;
	/** Production role of the profile. */
	readonly role: 'native-production-default';
	/** False because this profile does not target paper-comparison parity. */
	readonly comparisonParity: false;
	/** Native-15 spectral selections. */
	readonly spectral: Readonly<{
		/** Native-15 bin-average spectral basis. */
		readonly basis: SpectralBasis;
		/** Native-15 top-of-atmosphere source irradiance density. */
		readonly sourceIrradianceDensity: NativeSourceIrradianceDensity;
	}>;
	/** Native physical profile, including optional caller-supplied ground albedo. */
	readonly physical: NativePhysicalProfile;
	/** Native numerical profile after caller overrides are applied. */
	readonly numerical: NativeNumericalProfile;
}>;

/** Per-model dependencies used to complete the Native-15 execution profile. */
type NativeExecutionProfileDefinition = Readonly<{
	/** Legacy facade light source. */
	readonly lightSource: LightSourceModel;
	/** Legacy facade atmosphere. */
	readonly atmosphere: AtmosphereModel;
	/** Legacy facade geometry. */
	readonly geometry: GeometryModel;
	/** Legacy facade boundary normalized to black-ground null. */
	readonly groundBoundary: GroundBoundary | null;
	/** Observation retained as the geometry-owned placement authority. */
	readonly observation: GeometryObservation;
	/** Optional exact placement selected instead of deriving one from the observation. */
	readonly sourcePlacement?: GeometryResolvedLightSourcePlacement;
	/** Optional celestial source roster normalized into the complete profile. */
	readonly celestialSources?: CelestialSourceRoster | null;
	/** Source-selected executable domains. */
	readonly domains: Algorithm32ExecutionDomains;
	/** Accepted legacy execution selections. */
	readonly execution: ExecutionConfig;
}>;
