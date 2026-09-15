/** Declared local angular comparison; none alone is an error bound. */
type SkySecondOrderAngularRule = 'ordinary-coarse' | 'ordinary-fine' | 'mapped-fine';

/** A fixed Gaussian query on the original viewing ray. */
type SkySecondOrderViewNode = SkyVolumeJ2Target &
	Readonly<{
		/** Zero-based physical altitude interval. */ interval: number;
		/** Global position in the complete viewing rule. */ index: number;
		/** Positive path-distance integration weight in metres. */ weightMeters: number;
	}>;

/** Four independent column evaluations, in method-major coarse/fine order. */
type SkySecondOrderViewColumns = Readonly<{
	/** Column quadrature family. */ method: SkyPhysicalReferenceMethod;
	/** Original tolerance multiplier, four or one. */ toleranceScale: number;
	/** Complete exponential density columns. */ columns: SkyPhysicalColumnResult;
}>;

/** Admitted final-view attenuation, with its own dimensionless uncertainty. */
type SkySecondOrderAttenuation = Readonly<{
	/** Original spectral index. */ channel: number;
	/** Fine distance-Gauss attenuation. */ gauss: number | null;
	/** Fine Simpson attenuation. */ simpson: number | null;
	/** Mean of admitted fine formulations. */ mean: number | null;
	/** Method/pass/column empirical allowance, excluding local J2 error. */ allowance: number | null;
	/** All column convergence and optical-depth comparisons passed. */ resolved: boolean;
}>;

/** Independent view attenuation and retained work. */
type SkySecondOrderTransmission = Readonly<{
	/** Unmodified column diagnostics. */ columns: readonly SkySecondOrderViewColumns[];
	/** Per-channel independently admitted attenuation. */ channels: readonly SkySecondOrderAttenuation[];
	/** Actual density-pair evaluations. */ mediumEvaluations: number;
}>;

/** One angular rule's complete physical local source. */
type SkySecondOrderAngularResult = Readonly<{
	/** Preregistered sampling identity. */ rule: SkySecondOrderAngularRule;
	/** Complete separated local J2 values in W m^-3 sr^-1 nm^-1. */ rows: readonly SkyVolumeJ2Row[];
	/** Number of actual independent incident solves. */ incidentCount: number;
	/** Every independent branch matched its planned interval. */ geometryPassed: boolean;
	/** Every incident component passed unchanged numerical admission. */ incidentsPassed: boolean;
}>;

/** Compact reusable physical-point evidence; incident arrays are reproducible. */
type SkySecondOrderPoint = Readonly<{
	/** Exact point, direction and original outer weight. */ node: SkySecondOrderViewNode;
	/** Independent original-observer attenuation. */ transmission: SkySecondOrderTransmission;
	/** Three fixed angular comparisons. */ angular: readonly SkySecondOrderAngularResult[];
	/** Complete point wall duration including queued incident work. */ elapsedMilliseconds: number;
	/** Sum of worker task wall durations; distinct from CPU-job ledger. */ workerMilliseconds: number;
	/** Actual first-order medium-pair work. */ mediumEvaluations: number;
	/** Actual first-order outer-integrand work. */ outerEvaluations: number;
}>;

/** Component keys shared by physical local and viewing integrals. */
type SkySecondOrderComponent = 'atmosphereRayleigh' | 'atmosphereMie' | 'groundRayleigh' | 'groundMie' | 'combined';

/** One complete path or physical-interval integral under a fixed angular rule. */
type SkySecondOrderIntegral = Readonly<{
	/** Full view or zero-based interval address. */ interval: number | 'all';
	/** Direct40 channel index. */ channel: number;
	/** Exact angular rule. */ rule: SkySecondOrderAngularRule;
	/** Separated physical source. */ component: SkySecondOrderComponent;
	/** Admitted incident mean times admitted transmission mean. */ valueWatts: number | null;
	/** Positive-weight propagated incident uncertainty only. */ incidentAllowanceWatts: number | null;
	/** Positive-weight propagated final-view attenuation uncertainty and cross term. */ viewAllowanceWatts:
		number | null;
	/** Every required value exists and passes inner admission; outer/angular error remains separate. */ complete: boolean;
}>;

/** One geometry, numerical admission or physical identity predicate. */
type SkySecondOrderCheck = Readonly<{
	/** Unambiguous predicate address. */ id: string;
	/** Actual outcome, without promoting unavailable values to zero. */ state: SkyVolumeCheckState;
}>;

/** Preregistered first-altitude-shell ground-light size prediction. */
type SkySecondOrderGroundEnvelope = Readonly<{
	/** Original spectral index. */ channel: number;
	/** Exact angular comparison used in the viewing integral. */ rule: SkySecondOrderAngularRule;
	/** Computed shell ground radiance, in W m^-2 sr^-1 nm^-1. */ actualWatts: number;
	/** Original 1mm density times exact shell length, without the 10% envelope. */ baselineScaleWatts: number;
	/** Propagated baseline, incident and view allowances. */ allowanceWatts: number;
	/** Full prospectively specified comparison threshold. */ thresholdWatts: number;
	/** Actual inequality outcome. */ passed: boolean;
}>;

/** Bounded result reader used for exact parent reuse. */
type SkySecondOrderDocument = Readonly<{
	/** Explicit evidence version. */ schemaId: string;
	/** Original C0 identity. */ continuationRegistration: string;
	/** Complete prepared outer geometry, even for a pilot. */ nodes: readonly SkySecondOrderViewNode[];
	/** Incident channel identities. */ channels: readonly number[];
	/** Completed, reusable physical points. */ points: readonly SkySecondOrderPoint[];
	/** All points selected for this stage returned. */ matrixComplete: boolean;
	/** All inner admission and geometry/identity predictions passed. */ predictionsPassed: boolean;
}>;

/** Focused manufactured mathematics proof, never a physical reference. */
type SkySecondOrderProof = Readonly<{
	/** Versioned proof identity. */ schemaId: string;
	/** Actual assertion count. */ checks: number;
	/** Largest independent constant-source path integral error in metres. */ maximumPathErrorMeters: number;
	/** Largest attenuated manufactured integral error in metres. */ maximumAttenuatedErrorMeters: number;
}>;
