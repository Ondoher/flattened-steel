/** Frozen analytic factors and normalized synthetic-field controls; physical field accuracy is outside scope. */
type LocalSunNormalizationReport = Readonly<{
	/** Successful selected capability. */ status: 'PASSED';
	/** Independently compared node/channel factors. */ nodeFactors: number;
	/** Exact-node physical J channel comparisons. */ exactNodeChannels: number;
	/** Query/node spectral-ratio comparisons. */ ratioComparisons: number;
	/** Direction-dependent synthetic J channel comparisons. */ mixedComparisons: number;
	/** Largest dimensionless log-factor error. */ maximumLogError: number;
	/** Largest dimensionless factor-ratio error. */ maximumRatioError: number;
	/** Largest synthetic J error, W m^-3 sr^-1 nm^-1. */ maximumDensityError: number;
	/** Read-only synthetic stored field hash unchanged. */ physicalValuesUnchanged: true;
	/** Zero and signed values retained without clamping. */ signedSamplesPreserved: true;
	/** Explicit numerical/support rejection count. */ rejected: number;
	/** No physical-field accuracy acceptance. */ physicalFieldsQualified: false;
}>;

/** Frozen analytic factors and normalized synthetic-field controls; physical field accuracy is outside scope. */
type LocalSunNormalizationFixture = Readonly<{
	/** Exact portable schema. */ schema: 'local-sun-normalization-controls-v1';
	/** Selected interpolation policy, excluding beam attenuation. */ policy: 'geometric-density';
	/** Independent fixed source-centered dimensions in metres. */ geometry: Readonly<{
		/** Source-center height. */ sourceHeight: number;
		/** Slab top. */ atmosphereTop: number;
		/** Coverage cylinder radius. */ coverageRadius: number;
	}>;
	/** Shared literal Native15 centres in nanometres. */ wavelengthsNanometers: readonly number[];
	/** Complete ordered independent factor vector in m^-1. */ nodes: readonly Readonly<{
		/** Compact address. */ index: number;
		/** Fifteen positive spectral factors. */ factors: readonly number[];
	}>[];
	/** Independent spatial/angular-independent normalization controls. */ queries: readonly Readonly<{
		/** Source-centered horizontal distance in metres. */ horizontalDistance: number;
		/** Altitude in metres. */ altitude: number;
		/** Independent compact support. */ indices: readonly number[];
		/** Independent spatial weights. */ weights: readonly number[];
		/** Positive query factors in m^-1. */ factors: readonly number[];
		/** Dimensionless query/node ratios, tap-major/channel-minor. */ ratios: readonly (readonly number[])[];
		/** Expected restored synthetic J in W m^-3 sr^-1 nm^-1. */ expectedAffine: readonly number[];
	}>[];
	/** Predeclared algebraic limits; no physical accuracy claim. */ limits: Readonly<{
		/** Absolute log-factor difference relative to 1 m^-1. */ logAbsolute: number;
		/** Relative factor/ratio/synthetic comparison tolerance. */ relative: number;
		/** Absolute dimensionless ratio tolerance. */ ratioAbsolute: number;
		/** Absolute synthetic J tolerance, W m^-3 sr^-1 nm^-1. */ scatteringAbsolute: number;
		/** Retained spatial exact-node relative allowance. */ exactNodeRelative: number;
	}>;
	/** Full immutable derivation and tool identities. */ derivation: Readonly<{
		/** Read-only parent identity list. */ parents: readonly Readonly<{
			/** Repository-relative artifact path. */ path: string;
			/** Complete artifact hash. */ sha256: string;
		}>[];
		/** Original P0 derivation record. */ p0Derivation: LocalSunP0Fixture['derivation'];
		/** Original snapshot input ancestry. */ historicalInputs: string;
		/** Original snapshot manifest. */ historicalManifest: string;
		/** Independent equations and sample semantics. */ operation: string;
		/** Exact offline producer. */ producer: Readonly<{
			/** Repository tool path. */ path: string;
			/** Complete source hash. */ sha256: string;
		}>;
		/** Authoring runtime. */ tools: Readonly<{/** Node version. */ node: string}>;
	}>;
}>;
