/** Untrusted serialized object after only its object/array distinction has been checked. */
type LocalSunP0SerializedObject = Readonly<Record<string, unknown>>;

/** Unit-bearing length in an independent geometry control. */
type LocalSunP0Distance = Readonly<{
	/** Finite binary64 magnitude. */ value: number;
	/** Metre unit identity. */ units: string;
}>;
/** Production-owned independent geometry and amplitude-bound control payload. */
type LocalSunP0ControlPayload = Readonly<{
	/** Physical quantity of all distance wrappers. */ physicalQuantity: string;
	/** Coordinate/reference meaning. */ coordinateMeaning: string;
	/** Expected-value precision. */ precision: string;
	/** Fixed independent geometry inputs. */ geometry: {
		/** Source-center height above flat ground. */
		sourceHeight: LocalSunP0Distance;
		/** Slab top altitude above flat ground. */
		atmosphereTop: LocalSunP0Distance;
		/** Source-centered coverage radius. */
		coverageRadius: LocalSunP0Distance;
	};
	/** Selected spatial interpolation identity. */ interpolation: string;
	/** Selected density reconstruction identity. */ reconstruction: string;
	/** Physical band identity and radius interval. */ bands: readonly {
		/** Physical band identity. */
		id: number;
		/** Lower Euclidean band radius. */
		innerRadius: LocalSunP0Distance;
		/** Upper Euclidean band radius. */
		outerRadius: LocalSunP0Distance;
		/** Expected complete support; unsupported probes have no fallback. */
		admitted: boolean;
	}[];
	/** Ragged rows; no rectangular axis is implied. */ rows: readonly {
		/** Altitude above flat ground. */
		altitude: LocalSunP0Distance;
		/** Ordered compact support addresses. */
		indices: readonly number[];
	}[];
	/** Exact independent positions and physical addresses. */ nodes: readonly {
		/** Contiguous compact position address. */
		index: number;
		/** Owning altitude-row index. */
		rowIndex: number;
		/** Physical scattering-band identity. */
		bandId: number;
		/** Altitude above flat ground. */
		altitude: LocalSunP0Distance;
		/** Source-axis horizontal distance. */
		horizontalDistance: LocalSunP0Distance;
		/** Euclidean source-center distance. */
		sourceDistance: LocalSunP0Distance;
		/** Stable radius minus source-to-row-axis distance. */
		radiusExcess: LocalSunP0Distance;
	}[];
	/** Physical bands with no scattering allocation. */ omittedBands: readonly number[];
	/** Analytic amplitude partition, separate from scattering topology. */ sourceAmplitude: {
		/** Exactly 2048 amplitude intervals, distinct from scattering bands. */
		bandCount: number;
		/** Nearest source-centered cylinder distance. */
		minimumDistance: LocalSunP0Distance;
		/** Farthest source-centered cylinder distance. */
		maximumDistance: LocalSunP0Distance;
		/** Ordered 2049 independent equal-inverse-square distance endpoints. */
		boundaries: readonly LocalSunP0Distance[];
		/** Physical interpretation of this partition. */
		meaning: string;
	};
	/** Predeclared complete-boundary admission probes. */ queries: readonly {
		/** Source-axis horizontal distance. */
		horizontalDistance: LocalSunP0Distance;
		/** Altitude above flat ground. */
		altitude: LocalSunP0Distance;
		/** Expected complete support; unsupported probes have no fallback. */
		admitted: boolean;
		/** Independent analytic source distance. */
		expectedSourceDistance: LocalSunP0Distance;
		/** Independent positive support addresses; empty for rejection. */
		expectedIndices: readonly number[];
		/** Independent dimensionless positive support weights. */
		expectedWeights: readonly number[];
	}[];
	/** Structural comparison bounds; no physical accuracy claim. */ comparison: {
		/** Predeclared 1e-7 metre coordinate/moment tolerance. */
		lengthAbsolute: LocalSunP0Distance;
		/** Dimensionless constant-density conservation tolerance. */
		weightSumAbsolute: number;
		/** Dimensionless exact-node identity tolerance. */
		nodeWeightAbsolute: number;
		/** False; no absolute physical error claim. */
		physicalAccuracyClaim: boolean;
	};
}>;
/** Parent artifact identity and schema; every original remains immutable. */
type LocalSunP0Parent = Readonly<{
	/** Repository-relative immutable input. */ path: string;
	/** Exact parent byte hash. */ sha256: string;
	/** Authenticated historical schema. */ schema: string;
}>;
/** Checked fixture plus its complete independent derivation record. */
type LocalSunP0Fixture = Readonly<{
	/** Fixture format identity. */ schema: string;
	/** Independent expected values. */ controls: LocalSunP0ControlPayload;
	/** SHA256 of JSON.stringify(controls), excluding descriptive metadata. */ contentHash: string;
	/** Complete parent, operation and tool provenance. */ derivation: {
		/** All original immutable contract/layout/gate inputs. */
		parents: readonly LocalSunP0Parent[];
		/** Original sealed derivation record path. */
		parentProvenancePath: string;
		/** Exact sealed derivation byte hash. */
		parentProvenanceHash: string;
		/** Original UTF-8 record retaining ancestors, operation, tools and implementation identities. */
		parentDerivation: string;
		/** Projection and independent analytic derivation equation. */
		operation: string;
		/** Maintained offline producer path. */
		producer: string;
		/** Exact producer implementation byte hash. */
		producerSha256: string;
		/** Authoring-only retained pure stencil helper path. */
		oraclePath: string;
		/** Predeclared retained helper byte hash. */
		oracleHash: string;
		/** Original derivation runtime identity. */
		nodeVersion: string;
		/** Exact derivation invocation. */
		command: string;
		/** Bounded evidence claims and exclusions. */
		limits: string;
	};
}>;
/** Successful offline control verification, not numerical production acceptance. */
type LocalSunP0VerificationReport = Readonly<{
	/** Successful result label. */ status: string;
	/** Verified production-owned fixture. */ fixture: string;
	/** Complete artifact byte identity. */ sha256: string;
	/** Every independent compact position inspected. */ nodes: number;
	/** Every physical band inspected. */ bands: number;
	/** Every analytic amplitude boundary inspected. */ amplitudeBoundaries: number;
	/** Admission probes inspected. */ queries: number;
	/** Whether original inputs were independently authenticated. */ parentsAuthenticated: boolean;
}>;
