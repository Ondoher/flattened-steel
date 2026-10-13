/** Structural existing two-exponential atmosphere facts consumed only by its cache adapter. */
type CanonicalCacheColumnAtmosphere = Pick<AtmosphereModel, 'spectralBasis' | 'sampleMedium'> &
	Readonly<{
		/** Physical medium constants. */ constants: CanonicalAtmosphereConstants;
		/** Existing exact sea-level Rayleigh coefficients. */ seaLevelRayleighScattering: SpectralPacket;
		/** Existing exact sea-level Mie extinction. */ seaLevelMieExtinction: SpectralPacket;
	}>;
/** A straight cache segment resolved by geometry, with physical quantities in declared units. */
type CanonicalCacheColumnRequest = Readonly<{
	/** Initial altitude. */ startAltitude: Distance;
	/** Final altitude. */ endAltitude: Distance;
	/** Physical path length. */ length: Distance;
	/** Allocated Native15 channel. */ wavelengthIndex: number;
}>;

/** Unit-bearing exponential density integral request, independent of spectral coefficients. */
type CanonicalCacheDensityColumnRequest = Omit<CanonicalCacheColumnRequest, 'wavelengthIndex'> &
	Readonly<{
		/** Positive physical density scale height. */ scaleHeight: Distance;
	}>;
/** Accepted physical atmosphere and common-frame angular inventories for invariant Mie phase. */
type CanonicalMiePhaseMatrixDefinition = Readonly<{
	/** Canonical atmosphere owning the physical phase parameter. */ atmosphere: CanonicalCacheColumnAtmosphere;
	/** Ordered full positive incoming measure. */ incoming: WeightedDirectionDomain;
	/** Ordered outgoing physical cache directions. */ outgoing: CubedSphereDirectionDomain;
}>;
/** Existing canonical medium facts and legitimate construction contributor used by the analytic shader adapter. */
type CanonicalExponentialCacheShaderAtmosphere = CanonicalCacheColumnAtmosphere & CacheBuildContributor;
