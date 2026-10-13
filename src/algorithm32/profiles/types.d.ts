/** Numeric scattering depth accepted by the generic execution-profile contract. */
type Algorithm32ExecutionScatteringOrder = 1 | 2 | 3 | 4 | 5;

/**
 * Source-placement authority used by an execution profile.
 *
 * - **"geometry-observation"** - Geometry derives source placement from the observation.
 * - **"explicit-geometry-placement"** - The profile supplies an exact placement already expressed in geometry coordinates.
 */
type Algorithm32ExecutionSourcePlacementKind = 'geometry-observation' | 'explicit-geometry-placement';

/** Complete placement input for one configured atmospheric source. */
type Algorithm32ExecutionSourcePlacement =
	| Readonly<{
			/** Placement resolved normally by the selected geometry from the observation. */
			readonly kind: 'geometry-observation';
			/** Construction-time observation used by geometry and source placement. */
			readonly observation: GeometryObservation;
	  }>
	| Readonly<{
			/** Placement supplied explicitly after resolution into the selected geometry's coordinates. */
			readonly kind: 'explicit-geometry-placement';
			/** Construction-time observation retained for receiver and provenance facts. */
			readonly observation: GeometryObservation;
			/** Exact geometry-resolved source placement installed instead of deriving it from the observation. */
			readonly placement: GeometryResolvedLightSourcePlacement;
	  }>;

/** Spectral values shared by every physical owner in one complete execution profile. */
type Algorithm32ExecutionSpectralProfile = Readonly<{
	/** Ordered basis and sample semantics used without projection during Algorithm32 calculation. */
	readonly basis: SpectralBasis;
	/** Top-of-atmosphere source irradiance density aligned exactly to the selected basis. */
	readonly sourceIrradianceDensity: SpectralIrradiancePacket;
}>;

/** Executable component models and source placement for one complete execution profile. */
type Algorithm32ExecutionModels = Readonly<{
	/** Atmospheric light source configured with the profile's irradiance and placement. */
	readonly lightSource: LightSourceModel;
	/** Atmosphere model aligned to the profile's spectral basis. */
	readonly atmosphere: AtmosphereModel;
	/** Geometry model that owns coordinate transforms, ray bounds, and cache reconstruction. */
	readonly geometry: GeometryModel;
	/** Ground boundary aligned to the profile basis, or null for a black ground. */
	readonly groundBoundary: GroundBoundary | null;
	/** Normal observation-driven or exact geometry-resolved source-placement selection. */
	readonly sourcePlacement: Algorithm32ExecutionSourcePlacement;
	/** Optional celestial source roster; null retains the atmospheric-only configuration. */
	readonly celestialSources: CelestialSourceRoster | null;
}>;

/** Construction dependency for an aggregate model that retains one complete execution profile. */
type Algorithm32ExecutionModelDependencies = Readonly<{
	/** Complete accepted profile retained for the model's lifetime. */
	readonly profile: Algorithm32ExecutionProfile;
}>;

/** Aggregate model surface that retains one complete execution profile for downstream consumers. */
interface Algorithm32ExecutionModel {
	/** Complete accepted profile retained by this model. */
	readonly profile: Algorithm32ExecutionProfile;
	/** Atmospheric light source selected by the retained profile. */
	readonly lightSource: LightSourceModel;
	/** Atmosphere selected by the retained profile. */
	readonly atmosphere: AtmosphereModel;
	/** Geometry selected by the retained profile. */
	readonly geometry: GeometryModel;
	/** Ground boundary selected by the retained profile, or null for black ground. */
	readonly groundBoundary: GroundBoundary | null;
	/** Celestial source roster selected by the retained profile, or null when disabled. */
	readonly celestialSources: CelestialSourceRoster | null;
}

/** Numerical controls for one complete execution profile. */
type Algorithm32ExecutionNumericalProfile = Readonly<{
	/** Final-view path integration selection. */
	readonly viewPath: Readonly<{
		/** Optional geometry-qualified positive-column policy; omission retains the existing policy. */
		readonly kind?: LocalSunCompactViewPolicyKind;
		/** Positive integration interval count. */
		readonly intervalCount: number;
		/** Selected view-path sample placement; null selects uniform endpoint/trapezoid placement. */
		readonly sampleDistribution: ShaderPathSampleDistribution | null;
	}>;
	/** Sample-to-source optical-depth integration selection. */
	readonly sourcePathTransmittance: Readonly<{
		/** Analytic local transmission, or omitted for existing sampled profiles. */
		readonly kind?: LocalSunCompactSourcePolicyKind;
		/** Positive integration interval count. */
		readonly intervalCount?: number;
	}>;
	/** Cache recurrence and transported-radiance integration selection. */
	readonly cacheConstruction: Readonly<{
		/** Positive transport integration interval count. */
		readonly transportIntervalCount: number;
		/** Maximum cumulative scattering order requested by this profile. */
		readonly maximumScatteringOrder: Algorithm32ExecutionScatteringOrder;
	}>;
}>;

/** Executable construction and reconstruction domains for one complete execution profile. */
type Algorithm32ExecutionDomains = Readonly<{
	/** Ordered physical cache-position domain. */
	readonly positions: PositionDomain;
	/** Weighted incoming-direction quadrature domain used by scattering recurrence. */
	readonly incomingDirections: WeightedDirectionDomain;
	/** Outgoing-direction cache and reconstruction domain. */
	readonly outgoingDirections: ReconstructionDirectionDomain;
}>;

/**
 * Complete value-agnostic Algorithm32 execution profile.
 *
 * The documented default instance is the Native-15 production profile. A
 * benchmark or other trusted configuration owner supplies a complete profile
 * rather than partial overrides. `contentHash` is provenance metadata; ingress
 * validation accepts executable facts directly and then derives compatibility
 * from those accepted facts.
 */
type Algorithm32ExecutionProfile = Readonly<{
	/** Generic execution-profile contract kind. */
	readonly kind: 'algorithm32-execution-profile';
	/** Owner-selected stable identity for this complete configured profile. */
	readonly id: string;
	/** Schema revision governing this profile shape. */
	readonly schemaRevision: string;
	/** Monotonically increasing revision of the owner-selected profile values. */
	readonly revision: number;
	/** Canonical hash reported for the complete normalized profile facts. */
	readonly contentHash: string;
	/** Provenance identity for the authority that supplied the profile values. */
	readonly provenanceIdentity: string;
	/** Spectral basis and top-of-atmosphere source packet. */
	readonly spectral: Algorithm32ExecutionSpectralProfile;
	/** Executable component models and placement retained with this profile. */
	readonly models: Algorithm32ExecutionModels;
	/** Numerical integration and scattering-depth controls. */
	readonly numerical: Algorithm32ExecutionNumericalProfile;
	/** Executable cache-construction and reconstruction domains. */
	readonly domains: Algorithm32ExecutionDomains;
	/** Genuine compact construction capability, present only for the explicitly selected local successor. */
	readonly compactConstruction?: LocalSunCompactConstructionProfile;
}>;
