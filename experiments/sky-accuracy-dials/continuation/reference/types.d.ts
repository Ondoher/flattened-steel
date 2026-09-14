/** One registered physical component probe; selection is frozen by the caller before target generation. */
type SkyReferenceProbe = Readonly<{
	/** Stable identity within the caller's registration. */ id: string;
	/** Registered local capture time. */ time: string;
	/** Registered measurement-grid X coordinate. */ gridX: number;
	/** Registered measurement-grid Y coordinate. */ gridY: number;
	/** Matched physical observer, unit direction, and atmospheric endpoint. */ ray: SkyRayGeometry;
}>;

/** Bounded fixed-field quadrature rules; counts apply within each crossed altitude interval. */
type SkyFixedReferenceRule =
	/** Four-node Gauss rule in each altitude interval. */
	| 'gauss4'
	/** Eight-node Gauss rule in each altitude interval. */
	| 'gauss8'
	/** Eight-node Gauss rule on each half altitude interval. */
	| 'gauss8-split'
	/** Composite Simpson with eight subintervals per altitude interval. */
	| 'simpson8'
	/** Composite Simpson with sixteen subintervals per altitude interval. */
	| 'simpson16'
	/** Composite Simpson with thirty-two subintervals per altitude interval. */
	| 'simpson32';

/** Explicit fixed-field reconstruction whose integration is being checked. */
type SkyFixedReferenceRepresentation =
	/** Reconstruct the Float32 cumulative field once. */
	| 'cumulative'
	/** Reconstruct raw J1 and the Float32 higher-order sum separately. */
	| 'grouped'
	/** Reconstruct caller-declared factored J1 and the unchanged higher-order sum. */
	| 'grouped-factored-n1'
	/** Reconstruct separately stored higher Rayleigh and Mie densities. */
	| 'grouped-split-higher'
	/** Reconstruct higher species lighting before applying query densities. */
	| 'grouped-factored-higher'
	/** Reconstruct both factored first order and factored higher species. */
	| 'grouped-factored-all';

/** Explicit caller-owned grouped density for independent quadrature on fixed fields. */
type SkyFixedDensityEvaluator = (sample: SkyViewSample, order: number) => number;

/** Optional explicitly named first-order operator; never silently applied to cumulative controls. */
type SkyFixedReferenceFirstOrder = Readonly<{
	/** The only currently admitted replacement representation. */ id: 'factored';
	/** Nonnegative density at a predeclared query, in W m^-3 sr^-1 nm^-1. */ density: (
		sample: SkyViewSample,
	) => number;
}>;

/** One positive one-dimensional quadrature query before field-tap expansion. */
type SkyReferenceWeightedDistance = Readonly<{
	/** Observer distance in metres. */ distance: number;
	/** Positive physical integration weight in metres. */ weight: number;
}>;

/** Reusable attenuation prefixes for one independent method and physical ray. */
type SkyReferencePrefixesResult = Readonly<{
	/** Ordered prefix estimates matching the requested unique distances. */ prefixes: readonly SkyReferenceColumnPrefix[];
	/** Actual medium-pair evaluations required by this complete prefix sequence. */ evaluations: number;
}>;

/** One fixed reconstruction query and its observer-distance identity. */
type SkyFixedReferenceNode = Readonly<{
	/** Distance from the observer in metres. */ distance: number;
	/** Position in the union's ordered attenuation-prefix arrays. */ prefixIndex: number;
	/** Positive quadrature weight and exact captured field taps. */ sample: SkyViewSample;
}>;

/** One independently computed prefix of geometric Rayleigh/Mie columns. */
type SkyReferenceColumnPrefix = Readonly<{
	/** Distance from observer in metres. */ distance: number;
	/** Rayleigh exponential-density path integral in metres. */ rayleighMeters: number;
	/** Mie exponential-density path integral in metres. */ mieMeters: number;
	/** Empirical absolute Rayleigh column allowance in metres. */ errorRayleighMeters: number;
	/** Empirical absolute Mie column allowance in metres. */ errorMieMeters: number;
	/** Every contributing column segment met its integration budget/tolerance. */ converged: boolean;
}>;

/** RAM-only quadrature support for one frozen probe. */
type SkyFixedReferenceRay = Readonly<{
	/** Frozen physical and measurement identity. */ probe: SkyReferenceProbe;
	/** Number of positive crossed altitude intervals. */ altitudeSegments: number;
	/** Ordered independent-rule nodes; neighboring Simpson intervals may share endpoints. */ rules: Readonly<
		Record<SkyFixedReferenceRule, readonly SkyFixedReferenceNode[]>
	>;
	/** Unique ordered distances, including both atmospheric endpoints. */ distances: readonly number[];
	/** Separate Gauss and Simpson attenuation-prefix estimates. */ columns: Readonly<
		Record<SkyPhysicalReferenceMethod, readonly SkyReferenceColumnPrefix[]>
	>;
	/** Total geometric medium-pair evaluations per independent attenuation method. */ columnEvaluations: Readonly<
		Record<SkyPhysicalReferenceMethod, number>
	>;
}>;

/** Ephemeral sparse plan rebuilt from compact controls and frozen probes before GPU generation. */
type SkyFixedFieldReferencePlan = Readonly<{
	/** Fixed-field reference schema. */ schemaId: 'sky-fixed-field-reference-plan-v1';
	/** Exact build request identity. */ buildRequestId: string;
	/** Reconstruction operator held fixed while integration changes. */ solarInterpolation: SkySolarInterpolation;
	/** Ordered sparse tap union local to this plan. */ coordinates: readonly SkyFieldCoordinate[];
	/** At most forty registered component rays. */ rays: readonly SkyFixedReferenceRay[];
	/** Total rule nodes before endpoint sharing or cross-rule deduplication. */ ruleNodeCount: number;
	/** Total unique observer-distance queries. */ uniqueQueryCount: number;
	/** Allowed wavelength indexes, never an implicit full-score boundary. */ channels: readonly number[];
}>;

/** One fixed-field integral and an empirical attenuation-error contribution. */
type SkyFixedRuleValue = Readonly<{
	/** Estimated radiance in W m^-2 sr^-1 nm^-1. */ radianceW: number;
	/** Attenuation allowance propagated through positive scattering density. */ attenuationAllowanceW: number;
	/** Number of reconstructed density queries. */ evaluations: number;
	/** Whether every optical-depth prefix resolved within the declared cap. */ columnsConverged: boolean;
}>;

/** One component reference outcome; unresolved values remain estimates and never imply zero error. */
type SkyFixedReferenceRow = Readonly<{
	/** Frozen probe identity. */ probeId: string;
	/** Registered time. */ time: string;
	/** Measurement-grid X. */ gridX: number;
	/** Measurement-grid Y. */ gridY: number;
	/** Four-stage cumulative order. */ order: number;
	/** Explicit reconstruction grouping. */ representation: SkyFixedReferenceRepresentation;
	/** All six independently weighted estimates. */ methods: Readonly<
		Record<SkyFixedReferenceRule, SkyFixedRuleValue>
	>;
	/** Finest Gauss estimate; never an exact-field oracle. */ referenceW: number;
	/** Empirical reference allowance, or null if a constituent could not resolve. */ allowanceW: number | null;
	/** Finest Gauss/Simpson disagreement. */ methodDifferenceW: number;
	/** Successive Gauss correction magnitudes, coarse then fine. */ gaussCorrectionsW: readonly number[];
	/** Successive Simpson correction magnitudes, coarse then fine. */ simpsonCorrectionsW: readonly number[];
	/** Whether decreasing corrections, cross-method agreement and attenuation admission all pass. */ resolved: boolean;
	/** Explicit reasons for limitations; empty for admitted references. */ limitations: readonly string[];
}>;

/** Compact one-wavelength fixed-field output for caller-owned immutable recording. */
type SkyFixedFieldReferenceResult = Readonly<{
	/** Output schema. */ schemaId: 'sky-fixed-field-reference-result-v1';
	/** Input identity. */ buildRequestId: string;
	/** Direct40 channel. */ channel: number;
	/** Physical radiance units. */ units: 'W m^-2 sr^-1 nm^-1';
	/** Explicit shared-operator limitations. */ scope: string;
	/** Reference allowance equation and predeclared admission tolerances. */ allowancePolicy: string;
	/** Rule/probe/order estimates, with rejected references retained. */ rows: readonly SkyFixedReferenceRow[];
	/** Original rule samples in the sparse geometric plan. */ ruleNodeCount: number;
	/** Unique observer-distance samples used to construct prefix transmittance. */ uniqueQueryCount: number;
	/** Number of captured scalar field taps. */ coordinateCount: number;
}>;

/** Small exact manufactured proof result for caller-owned immutable recording. */
type SkyFixedReferenceProofResult = Readonly<{
	/** Distinct manufactured-proof schema identity. */ schemaId: 'sky-fixed-field-reference-proof-v1';
	/** Number of checked mathematical and bounded-support assertions. */ checks: number;
	/** Largest absolute polynomial moment discrepancy. */ maximumAbsolutePolynomialError: number;
	/** Limits of what this mathematical proof establishes. */ scope: string;
}>;
