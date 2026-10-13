/** Stable executable identity supplied by one celestial source provider. */
type CelestialSourceIdentity = Readonly<{
	/** Stable source identifier. */
	readonly id: string;
	/** Supported source kind. */
	readonly kind: CelestialSourceKind;
	/** Canonical identity of the source's normalized physical definition. */
	readonly definitionHash: string;
}>;

/** Geometry-neutral placement state supplied by one celestial source. */
type CelestialSourcePlacementState =
	| Readonly<{
			/** Stable distant-Sun source identifier. */
			readonly sourceId: string;
			/** Distant-Sun source discriminator. */
			readonly kind: 'distant-uniform-sun';
			/** Construction-time observation from which geometry derives the distant direction. */
			readonly observation: GeometryObservation;
	  }>
	| Readonly<{
			/** Stable stellar point-set source identifier. */
			readonly sourceId: string;
			/** Static stellar point-set discriminator. */
			readonly kind: 'static-stellar-point-set';
			/** Catalog frame supplied to geometry; the legacy value remains accepted only until the failed spherical resolver is replaced in step 3. */
			readonly frame: StellarCatalogFrame | CelestialFrame;
			/** Static catalog epoch at which the canonical member directions are defined. */
			readonly epoch: CelestialEpoch;
			/** Fixed clock/location snapshot against which geometry transforms the catalog directions. */
			readonly observation: GeometryObservation;
			/** Canonical member directions in exact source-definition order. */
			readonly memberDirections: readonly UnitVector3[];
	  }>
	| Readonly<{
			/** Stable source identifier. */
			readonly sourceId: string;
			/** Finite local-Sun discriminator. */
			readonly kind: 'finite-local-sun';
			/** Named frame containing the position. */
			readonly frame: CelestialFrame;
			/** Epoch at which the position is valid. */
			readonly epoch: CelestialEpoch;
			/** Physical source center in the named frame. */
			readonly position: Position;
	  }>;

/** Distant-Sun support facts retained by one source-owned cache fragment. */
type DistantSunCelestialCacheFragmentSupport = Readonly<{
	/** Positive apparent angular radius of the uniform disk. */
	readonly angularRadius: Angle;
	/** Uniform-disk profile selected by the supported distant-Sun family. */
	readonly profile: 'uniform-disk';
}>;

/** Stellar-point-set support facts retained by one source-owned cache fragment. */
type StellarPointSetCelestialCacheFragmentSupport = Readonly<{
	/** Reviewed catalog and ordered-selection identity. */
	readonly catalog: StellarCatalogIdentity;
	/** Exact supported stellar member count. */
	readonly memberCount: 500 | 2000;
}>;

/** Flat finite-Sun support facts retained by one source-owned cache fragment. */
type FlatFiniteSunCelestialCacheFragmentSupport = Readonly<{
	/** Positive physical body radius. */
	readonly radius: Distance;
	/** Static center height required by the source-relative domain. */
	readonly centerHeight: Distance;
	/** Uniform-disk profile selected by the supported Flat finite-Sun family. */
	readonly profile: 'uniform-disk';
}>;

/** Source-owned logical fragment from which one celestial cache field is built. */
type CelestialCacheFragmentSpec =
	| Readonly<{
			/** Stable distant-Sun source identifier. */
			readonly sourceId: string;
			/** Distant uniform-Sun fragment discriminator. */
			readonly sourceKind: 'distant-uniform-sun';
			/** Spectral radiance-density quantity stored by the fragment. */
			readonly quantity: 'spectral-radiance-density';
			/** Spectral radiance-density units stored by the fragment. */
			readonly units: 'W m^-2 sr^-1 nm^-1';
			/** Spectral channel count aligned to the active profile. */
			readonly channelCount: 15;
			/** Distant-Sun disk support facts. */
			readonly support: DistantSunCelestialCacheFragmentSupport;
	  }>
	| Readonly<{
			/** Stable stellar point-set source identifier. */
			readonly sourceId: string;
			/** Static stellar point-set fragment discriminator. */
			readonly sourceKind: 'static-stellar-point-set';
			/** Spectral irradiance-density quantity stored per stellar member. */
			readonly quantity: 'spectral-irradiance-density';
			/** Spectral irradiance-density units stored per stellar member. */
			readonly units: 'W m^-2 nm^-1';
			/** Spectral channel count aligned to the active profile. */
			readonly channelCount: 15;
			/** Stellar catalog and capacity support facts. */
			readonly support: StellarPointSetCelestialCacheFragmentSupport;
	  }>
	| Readonly<{
			/** Stable Flat finite-Sun source identifier. */
			readonly sourceId: string;
			/** Flat finite-Sun fragment discriminator. */
			readonly sourceKind: 'finite-local-sun';
			/** Spectral radiance-density quantity stored by the fragment. */
			readonly quantity: 'spectral-radiance-density';
			/** Spectral radiance-density units stored by the fragment. */
			readonly units: 'W m^-2 sr^-1 nm^-1';
			/** Spectral channel count aligned to the active profile. */
			readonly channelCount: 15;
			/** Flat finite-Sun body support facts. */
			readonly support: FlatFiniteSunCelestialCacheFragmentSupport;
	  }>;

/** Accepted facts supplied while deriving one source-owned celestial cache fragment. */
type CelestialCacheBuildRequest = Readonly<{
	/** Complete execution model that owns the active profile. */
	readonly model: Algorithm32ExecutionModel;
	/** Geometry-resolved source placement. */
	readonly placement: CelestialResolvedPlacement;
}>;

/** Internal behavior required from one configured celestial source provider. */
interface CelestialSourceProvider extends CelestialSource {
	/**
	 * Call this method to return the normalized executable identity of this source.
	 *
	 * @returns - The source-owned executable identity.
	 */
	describeCelestialSourceIdentity(): CelestialSourceIdentity;
	/**
	 * Call this method to create geometry-neutral placement state for one observation.
	 *
	 * @param observation - The construction-time observation.
	 * @returns - The source placement expressed in its named celestial frame.
	 */
	createCelestialPlacementState(observation: GeometryObservation): CelestialSourcePlacementState;
	/**
	 * Call this method to create the logical cache fragment owned by this source.
	 *
	 * @param request - The accepted model and geometry-resolved placement.
	 * @returns - The source-owned cache fragment specification.
	 */
	createCelestialCacheFragment(request: CelestialCacheBuildRequest): CelestialCacheFragmentSpec;
}

/** Accepted inputs for celestial roster validation at profile ingress. */
type CelestialSourceRosterAcceptanceRequest = Readonly<{
	/** Candidate celestial roster or the disabled null value. */
	readonly roster: CelestialSourceRoster | null;
	/** Exact configured atmospheric light source. */
	readonly lightSource: LightSourceModel;
	/** Configured geometry that must declare the matching capability family. */
	readonly geometry: GeometryModel;
	/** Active spectral basis required by every source packet. */
	readonly basis: SpectralBasis;
}>;

/** Canonical executable distant-Sun facts used in profile identity. */
type DistantSunCelestialSourceIdentityFacts = Readonly<{
	/** Stable distant-Sun source identifier. */
	readonly id: string;
	/** Distant uniform-Sun discriminator. */
	readonly kind: 'distant-uniform-sun';
	/** Uniform-disk profile selected by the source. */
	readonly profile: 'uniform-disk';
	/** Accepted apparent angular radius in radians. */
	readonly angularRadiusRadians: number;
	/** Content identity of the accepted surface-radiance packet. */
	readonly surfaceRadiance: string;
}>;

/** Canonical executable Flat finite-Sun facts used in profile identity. */
type FlatFiniteSunCelestialSourceIdentityFacts = Readonly<{
	/** Stable finite-Sun source identifier. */
	readonly id: string;
	/** Flat finite-Sun discriminator. */
	readonly kind: 'finite-local-sun';
	/** Uniform-disk profile selected by the source. */
	readonly profile: 'uniform-disk';
	/** Accepted physical body radius in meters. */
	readonly radiusMeters: number;
	/** Accepted static source-center height in meters. */
	readonly centerHeightMeters: number;
	/** Content identity of the accepted surface-radiance packet. */
	readonly surfaceRadiance: string;
}>;

/** Canonical stellar catalog facts used in profile identity. */
type StellarCatalogIdentityFacts = Readonly<{
	/** Stable catalog identifier. */
	readonly catalogId: string;
	/** Versioned upstream catalog label. */
	readonly catalogVersion: string;
	/** Canonical SHA-256 identity of the checked source input. */
	readonly catalogSha256: string;
	/** Stable member-selection policy identifier. */
	readonly selectionId: string;
	/** Canonical SHA-256 identity of the ordered selected records. */
	readonly selectionSha256: string;
	/** Accepted FK5/J2000 mean-equatorial catalog frame. */
	readonly frame: 'fk5-j2000-mean-equatorial-rh-v1';
	/** Accepted catalog epoch. */
	readonly epoch: CelestialEpoch;
}>;

/** Canonical executable stellar-member facts used in profile identity. */
type StellarSourceMemberIdentityFacts = Readonly<{
	/** Stable stellar member identifier. */
	readonly id: string;
	/** Accepted unit direction in the catalog frame. */
	readonly direction: UnitVector3;
	/** Content identity of the accepted spectral-irradiance packet. */
	readonly spectralIrradiance: string;
}>;

/** Canonical executable stellar point-set facts used in profile identity. */
type StellarPointSetSourceIdentityFacts = Readonly<{
	/** Stable stellar point-set source identifier. */
	readonly id: string;
	/** Static stellar point-set discriminator. */
	readonly kind: 'static-stellar-point-set';
	/** Accepted catalog and ordered-selection facts. */
	readonly catalog: StellarCatalogIdentityFacts;
	/** Accepted members in canonical selection order. */
	readonly members: readonly StellarSourceMemberIdentityFacts[];
}>;

/** Canonical normalized definition facts accepted by shared celestial source support. */
type CelestialSourceDefinitionIdentityFacts =
	| DistantSunCelestialSourceIdentityFacts
	| FlatFiniteSunCelestialSourceIdentityFacts
	| StellarPointSetSourceIdentityFacts;

/** Canonical executable facts used when an enabled roster contributes identity. */
type CelestialSourceRosterIdentityFacts =
	| Readonly<{
			/** Stable spherical roster identifier. */
			readonly id: string;
			/** Spherical distant-Sun and stellar-point-set family discriminator. */
			readonly family: 'spherical-sun-stars-radial-v1';
			/** Accepted distant-Sun identity facts. */
			readonly sun: DistantSunCelestialSourceIdentityFacts;
			/** Accepted stellar identity facts, or null during the Sun-first intermediate. */
			readonly stars: StellarPointSetSourceIdentityFacts | null;
	  }>
	| Readonly<{
			/** Stable Flat roster identifier. */
			readonly id: string;
			/** Flat finite-local-Sun family discriminator. */
			readonly family: 'flat-local-finite-sun-v1';
			/** Optional authenticated stellar identity; projection remains geometry owned. */
			readonly stars: StellarPointSetSourceIdentityFacts | null;
			/** Accepted finite-Sun identity facts. */
			readonly localSun: FlatFiniteSunCelestialSourceIdentityFacts;
	  }>;
