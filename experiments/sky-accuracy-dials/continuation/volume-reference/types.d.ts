/** Terminal boundary of a physical incident ray.
 * - **"ground"** - First forward contact with the opaque ground sphere.
 * - **"top"** - Forward atmosphere exit without prior ground contact.
 */
type SkyVolumeBoundary = 'ground' | 'top';

/** Supported geometry branch, without cache reconstruction.
 * - **"surface-outward"** - Surface origin with nonnegative radial direction.
 * - **"volume-outward"** - Positive-altitude origin with nonnegative radial direction.
 * - **"volume-ground"** - Positive-altitude inward ray terminating at ground.
 * - **"volume-escaping"** - Inward ray passing closest approach and exiting the atmosphere.
 */
type SkyVolumeBranch = 'surface-outward' | 'volume-outward' | 'volume-ground' | 'volume-escaping';

/** One smooth, monotone-radius, constant-source-visibility ray interval. */
type SkyVolumeSegment = Readonly<{
	/** Lower distance from origin in metres. */ startMeters: number;
	/** Upper distance from origin in metres. */ endMeters: number;
	/** Whether the open interval sees the collimated source along +Z. */ sourceVisible: boolean;
}>;

/** Independently constructed finite incident-ray geometry. */
type SkyVolumeGeometry = Readonly<{
	/** Caller-supplied physical origin in metres. */ origin: SkyVector3;
	/** Caller-supplied unit look direction, toward arriving radiance. */ direction: SkyVector3;
	/** First terminating boundary distance in metres. */ lengthMeters: number;
	/** Opaque ground or atmosphere boundary. */ boundary: SkyVolumeBoundary;
	/** Explicit admitted ray branch. */ branch: SkyVolumeBranch;
	/** Finite boundary intersection in metres. */ endpoint: SkyVector3;
	/** Closest approach and direct-source visibility break intervals. */ segments: readonly SkyVolumeSegment[];
}>;

/** Work options; numerical tolerances retain the physical-reference policy. */
type SkyVolumeOptions = Readonly<{
	/** Existing explicit physical reference work profile. */ profile?: SkyPhysicalReferenceProfile;
	/** Outer-only adaptive error allocation; omitted preserves the existing local rule. */ outerStrategy?: SkyPhysicalOuterStrategy;
	/** Cooperative heartbeat/deadline/resource guard; thrown identity propagates. */ guard?: () => void;
	/** Optional lower shared outer-evaluation cap per method, across both passes. */ maximumOuterEvaluations?: number;
	/** Optional lower shared medium-pair cap per method, across both passes. */ maximumMediumEvaluations?: number;
}>;

/** One separated incident component, all values in W m^-2 sr^-1 nm^-1. */
type SkyVolumeComponent = Readonly<{
	/** Distance-Gauss estimate; null if a complete estimate is unavailable. */ gaussWatts: number | null;
	/** Branchwise square-root-altitude Simpson estimate; null when unavailable. */ simpsonWatts: number | null;
	/** Fine-method difference in spectral radiance units; null when unavailable. */ methodDifferenceWatts:
		number | null;
	/** Empirical allowance in spectral radiance units, null unless admitted; not rigorous. */ empiricalAllowanceWatts:
		number | null;
	/** Both formulations, passes and propagated allowances pass numerical admission. */ resolved: boolean;
	/** Explicit admission failures; no unresolved quantity is replaced by zero. */ reasons: readonly string[];
}>;

/** A spectral channel with separately admitted scattering and ground radiance. */
type SkyVolumeChannel = Readonly<{
	/** Direct40 channel index. */ channel: number;
	/** Atmospheric first scattering, excluding reflected ground radiance. */ atmosphere: SkyVolumeComponent;
	/** Direct Lambertian reflection attenuated along the viewing path. */ directGround: SkyVolumeComponent;
	/** Sum of the two physical contributions; both components must be admitted. */ total: SkyVolumeComponent;
}>;

/** Full independent incident reference, without higher-order recursion or storage. */
type SkyVolumeResult = Readonly<{
	/** Distinct volume-first-order evidence schema. */ schemaId: string;
	/** Spectral radiance units of every value and allowance. */ units: string;
	/** First-order atmosphere plus direct-ground reflection; no diffuse ground recursion. */ scope: string;
	/** Ray termination and explicit geometric splits. */ geometry: SkyVolumeGeometry;
	/** Profile owning the original tolerance policy and maximum capacities. */ numericalPolicy: SkyPhysicalReferencePolicy;
	/** Actual outer adaptive error strategy, with all inner columns unchanged. */ outerStrategy: SkyPhysicalOuterStrategy;
	/** Method records in Gauss/Simpson order, component-major atmosphere/ground/total vectors. */ methods: readonly SkyPhysicalMethodResult[];
	/** Independently admitted per-channel separated components. */ channels: readonly SkyVolumeChannel[];
	/** True only if every component of every channel is numerically admitted. */ resolved: boolean;
	/** Shared physics and finite empirical-reference limitations. */ limitations: readonly string[];
}>;

/** Positive-altitude mapping of one monotone-radius segment. */
type SkyVolumeMap = Readonly<{
	/** Coordinate endpoint in sqrt(metres). */ endCoordinate: number;
	/** Returns global ray distance and positive absolute distance Jacobian. */ evaluate: (
		coordinate: number,
	) => SkyPhysicalAltitudeCoordinate;
}>;

/** Complete separated component estimates from one tolerance pass. */
type SkyVolumePass = Readonly<{
	/** Component-major atmosphere/ground/total vector, or null without complete pass. */ values: number[] | null;
	/** Outer quadrature remainder per component, in spectral radiance units. */ errors: number[] | null;
	/** Propagated optical-depth uncertainty per component, in spectral radiance units. */ innerAllowances:
		number[] | null;
	/** Whether all required geometry columns and intervals converged. */ converged: boolean;
	/** Explicit unresolved cause, null on convergence. */ reason: string | null;
}>;

/** Scalar attenuation calculation with finite empirical optical-depth propagation. */
type SkyVolumeAttenuation = Readonly<{
	/** exp(-tau), dimensionless. */ value: number;
	/** exp(-tau) * expm1(deltaTau), dimensionless empirical allowance. */ allowance: number;
}>;

/** Manufactured in-memory verification; never a scientific evidence run. */
type SkyVolumeProof = Readonly<{
	/** Distinct proof identity. */ schemaId: string;
	/** Number of actual mathematical, boundary and failure assertions. */ checks: number;
	/** Largest constant-integrand geometry error in metres. */ maximumGeometryErrorMeters: number;
	/** Largest analytic manufactured spectral-radiance error in W m^-2 sr^-1 nm^-1. */ maximumRadianceErrorWatts: number;
}>;

/** Caller-selected compact pilot witness; caller owns evidence allocation and provenance. */
type SkyVolumeWitness = Readonly<{
	/** Unique caller-owned probe identity. */ id: string;
	/** Physical receiver position in metres. */ origin: SkyVector3;
	/** Unit look direction. */ direction: SkyVector3;
}>;

/** Measured in-memory pilot row for later caller-owned sealed evidence. */
type SkyVolumePilotRow = Readonly<{
	/** Exact witness identity. */ id: string;
	/** Monotonic elapsed wall time including callbacks, in milliseconds. */ elapsedMilliseconds: number;
	/** Independent physical result with separated components and actual work. */ result: SkyVolumeResult;
}>;

/** Direct Lambertian boundary limit at a fixed illuminated ground point. */
type SkyVolumeGroundLimit = Readonly<{
	/** Spectral radiance units for every estimate and allowance. */ units: string;
	/** Exact ground origin in metres. */ origin: SkyVector3;
	/** Direct-sun cosine at this fixed surface point, dimensionless. */ solarCosine: number;
	/** Independent source-column evidence in Gauss/Simpson order. */ methods: readonly SkyPhysicalMethodResult[];
	/** One independently admitted direct-ground limit per spectral channel. */ channels: readonly SkyVolumeGroundLimitChannel[];
	/** Whether every ground-limit component is independently admitted. */ resolved: boolean;
}>;

/** One spectral direct-ground boundary limit in W m^-2 sr^-1 nm^-1. */
type SkyVolumeGroundLimitChannel = Readonly<{
	/** Direct40 spectral channel index. */ channel: number;
	/** Lambertian direct reflection with zero observer-ground distance. */ directGround: SkyVolumeComponent;
}>;

/** Concrete pilot selector and its geometry derivation, frozen before physical evaluation. */
type SkyVolumeRegisteredWitness = SkyVolumeWitness &
	Readonly<{
		/** Exact original C0 probe identity supplying the ground origin. */ parentProbeId: string;
		/** Radial elevation above the parent origin in metres. */ elevationMeters: number;
		/** Local up cosine used for derived rays; null for exact original direction. */ localCosine: number | null;
		/** Human-readable operation constructing this exact origin and direction. */ derivation: string;
	}>;

/** Preregistered volume-witness check outcome.
 * - **"passed"** - All required independent allowances exist and the declared check passed.
 * - **"failed"** - Required allowances exist and the declared check failed.
 * - **"unresolved"** - A required witness or independently admitted allowance is missing.
 */
type SkyVolumeCheckState = 'passed' | 'failed' | 'unresolved';

/** One explicit component-level pilot assessment, never a Kider accuracy score. */
type SkyVolumeCheck = Readonly<{
	/** Preregistered predicate identity. */ id: string;
	/** Spectral channel, or null for a geometry-only predicate. */ channel: number | null;
	/** Evaluated or missing numerical state. */ state: SkyVolumeCheckState;
	/** Observed signed discrepancy in W m^-2 sr^-1 nm^-1, or null. */ differenceWatts: number | null;
	/** Empirical comparison allowance in the same units, or null. */ allowanceWatts: number | null;
	/** Exact interpretation and scope of this check. */ description: string;
}>;

/** Bounded sealed pilot handoff; execution acceptance differs from scientific admission. */
type SkyVolumeRunResult = Readonly<{
	/** New immutable run path. */ run: string;
	/** Verified terminal seal identity. */ seal: DialFileIdentity;
	/** Every registered physical witness returned a complete report. */ matrixComplete: boolean;
	/** Whether all preregistered checks passed with admitted allowances. */ predictionsPassed: boolean;
	/** Explicit resource/pilot stop cause; null if all witnesses were attempted. */ stopReason: string | null;
}>;
