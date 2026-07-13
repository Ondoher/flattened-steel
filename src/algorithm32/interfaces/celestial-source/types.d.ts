/**
 * Supported production celestial capability family.
 *
 * - **"spherical-sun-stars-radial-v1"** - A spherical distant uniform Sun and optional static-epoch stellar point set over the radial cache domain.
 * - **"flat-local-finite-sun-v1"** - A Flat finite local Sun whose disk definition and construction-time placement are resolved together.
 */
type CelestialCapabilityFamily = 'spherical-sun-stars-radial-v1' | 'flat-local-finite-sun-v1';

/**
 * Supported production celestial source kind.
 *
 * - **"distant-uniform-sun"** - The visible disk of the configured atmospheric distant Sun.
 * - **"static-stellar-point-set"** - The reviewed fixed-epoch stellar roster.
 * - **"finite-local-sun"** - The simulator-configured finite local Sun disk.
 */
type CelestialSourceKind = 'distant-uniform-sun' | 'static-stellar-point-set' | 'finite-local-sun';

/**
 * Named right-handed celestial coordinate frame.
 *
 * - **"celestial-rh-v1"** - Longitude zero at positive X, positive longitude toward positive Y, and north at positive Z.
 */
type CelestialFrame = 'celestial-rh-v1';

/**
 * Supported stellar catalog coordinate frame.
 *
 * - **"fk5-j2000-mean-equatorial-rh-v1"** - FK5/J2000 mean equatorial right-handed directions at the declared catalog epoch.
 */
type StellarCatalogFrame = 'fk5-j2000-mean-equatorial-rh-v1';

/**
 * Supported celestial time scale.
 *
 * - **"utc"** - An ISO-8601 Coordinated Universal Time instant.
 */
type CelestialTimeScale = 'utc';

/** Epoch attached to a static celestial source definition. */
type CelestialEpoch = Readonly<{
	/** ISO-8601 instant with an explicit UTC offset. */
	readonly instant: string;
	/** Time scale used to interpret the instant. */
	readonly timeScale: CelestialTimeScale;
}>;

/** Immutable celestial view derived from the configured atmospheric distant Sun. */
type DistantSunCelestialSourceDefinition = Readonly<{
	/** Stable celestial source identifier. */
	readonly id: string;
	/** Source-kind discriminator. */
	readonly kind: 'distant-uniform-sun';
	/** Positive apparent angular radius retained from the light-source configuration. */
	readonly angularRadius: Angle;
	/** Uniform spectral radiance derived from apparent irradiance and disk support. */
	readonly surfaceRadiance: SpectralRadiancePacket;
	/** Uniform-disk profile required by the first family. */
	readonly profile: 'uniform-disk';
}>;

/** Static source definition shared by local-Sun lighting and visible-disk paths. */
type FiniteLocalSunSourceDefinition = Readonly<{
	/** Stable celestial and atmospheric source identifier. */
	readonly id: string;
	/** Source-kind discriminator. */
	readonly kind: 'finite-local-sun';
	/** Positive physical body radius. */
	readonly radius: Distance;
	/** Static center height required by the source-relative domain. */
	readonly centerHeight: Distance;
	/** Uniform surface radiance used by lighting and disk rendering. */
	readonly surfaceRadiance: SpectralRadiancePacket;
	/** Uniform-disk profile required by this family. */
	readonly profile: 'uniform-disk';
}>;

/** Identity of the reviewed stellar catalog and ordered selection. */
type StellarCatalogIdentity = Readonly<{
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
	/** FK5/J2000 mean-equatorial frame used by every member direction. */
	readonly frame: StellarCatalogFrame;
	/** Epoch of the canonical member directions. */
	readonly epoch: CelestialEpoch;
}>;

/** Static stellar member supplied by the selected catalog source. */
type StellarSourceMemberDefinition = Readonly<{
	/** Stable member identifier. */
	readonly id: string;
	/** Canonical unit direction in the catalog frame. */
	readonly direction: UnitVector3;
	/** Apparent top-of-atmosphere spectral irradiance density. */
	readonly spectralIrradiance: SpectralIrradiancePacket;
}>;

/** Static first-family stellar point-set source. */
type StellarPointSetSourceDefinition = Readonly<{
	/** Stable point-set source identifier. */
	readonly id: string;
	/** Source-kind discriminator. */
	readonly kind: 'static-stellar-point-set';
	/** Catalog and ordered-selection identity. */
	readonly catalog: StellarCatalogIdentity;
	/** Exactly 500 members in canonical selection order. */
	readonly members: readonly StellarSourceMemberDefinition[];
}>;

/** Static definition exposed by one supported celestial source capability. */
type CelestialSourceDefinition =
	DistantSunCelestialSourceDefinition | FiniteLocalSunSourceDefinition | StellarPointSetSourceDefinition;

/** Common public capability implemented by a configured celestial source. */
interface CelestialSource {
	/** Stable source identity used by roster and cache compatibility. */
	readonly id: string;
	/** Source-kind discriminator. */
	readonly kind: CelestialSourceKind;
	/** Immutable source-specific static definition. */
	readonly celestialSourceDefinition: CelestialSourceDefinition;
	/** Describe the immutable source definition used for compatibility identity. */
	describeCelestialSourceIdentity(): CelestialSourceIdentity;
}

/** Capability implemented by a configured distant atmospheric Sun. */
interface DistantSunCelestialSource extends CelestialSource {
	/** Distant-Sun discriminator. */
	readonly kind: 'distant-uniform-sun';
	/** Static distant-Sun definition backed by this light-source owner. */
	readonly celestialSourceDefinition: DistantSunCelestialSourceDefinition;
}

/** Capability implemented by a configured finite local atmospheric Sun. */
interface FiniteLocalSunCelestialSource extends CelestialSource {
	/** Finite-local-Sun discriminator. */
	readonly kind: 'finite-local-sun';
	/** Static finite-Sun definition shared by lighting and disk transport. */
	readonly celestialSourceDefinition: FiniteLocalSunSourceDefinition;
}

/** Capability implemented by a configured static stellar point-set source. */
interface StellarPointSetCelestialSource extends CelestialSource {
	/** Static-stellar-point-set discriminator. */
	readonly kind: 'static-stellar-point-set';
	/** Static catalog-backed stellar definition. */
	readonly celestialSourceDefinition: StellarPointSetSourceDefinition;
}

/** Immutable capability roster for the spherical distant-Sun and star family. */
type SphericalSunStarsSourceRoster = Readonly<{
	/** Stable roster identity. */
	readonly id: string;
	/** Selected capability family. */
	readonly family: 'spherical-sun-stars-radial-v1';
	/** Exact configured light-source object implementing the distant-Sun capability. */
	readonly sun: DistantSunCelestialSource;
	/** Stellar capability implementation, omitted only during the bounded Sun-first port. */
	readonly stars?: StellarScreenPaletteSource | null;
}>;

/** Immutable capability roster for the Flat/local finite-Sun family. */
type FlatLocalFiniteSunSourceRoster = Readonly<{
	/** Stable roster identity. */
	readonly id: string;
	/** Selected capability family. */
	readonly family: 'flat-local-finite-sun-v1';
	/** Exact configured light-source object implementing the finite-local capability. */
	readonly localSun: FiniteLocalSunCelestialSource;
}>;

/** Immutable celestial capability roster accepted by the production facade. */
type CelestialSourceRoster = SphericalSunStarsSourceRoster | FlatLocalFiniteSunSourceRoster;

/** Optional cancellation input for one static configuration replacement. */
type ConfigReplacementOptions = Readonly<{
	/** Caller cancellation for this replacement transaction. */
	readonly signal?: AbortSignal;
}>;
