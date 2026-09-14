/** Registered CPU-only incoming product rule. */
type SkyJ2Rule = Readonly<{
	/** Stable unambiguous rule identity. */ id: string;
	/** Full [-1,1] Gaussian cosine count. */ muCount: number;
	/** Full circle count, including explicitly represented mirrors. */ azimuthCount: number;
	/** Equal-weight azimuth placement. */ placement: SkyAzimuthPlacement;
}>;
/** Full-interval Gaussian node and its positive weight. */
type SkyJ2GaussNode = Readonly<{
	/** Cosine in (-1,1). */ node: number;
	/** Dimensionless full-rule Gaussian weight. */ weight: number;
}>;
/** One reusable L1 ray with all phase-weighted reflection members. */
type SkyJ2Incident = Readonly<{
	/** Local representative with nonnegative y and positive z. */ direction: SkyVector3;
	/** Distinct negative-y member, null only for an azimuth endpoint. */ mirror: SkyVector3 | null;
	/** Solid angle per member; never renormalized to a hemisphere. */ weight: number;
}>;
/** Selected component output tied to a frozen C0 ray. */
type SkyJ2Target = Readonly<{
	/** Stable frozen target identity. */ id: string;
	/** Frozen scene time. */ time: string;
	/** Original grid column. */ gridX: number;
	/** Original grid row. */ gridY: number;
	/** Exact supplied ground point. */ origin: SkyVector3;
	/** Exact benchmark world outgoing direction. */ direction: SkyVector3;
}>;
/** Compact independently admitted incident-ray result. */
type SkyJ2NodeResult = Readonly<{
	/** Per-channel fine Gauss estimates, null when unavailable. */ gauss: readonly (number | null)[];
	/** Per-channel fine Simpson estimates, null when unavailable. */ simpson: readonly (number | null)[];
	/** Accepted empirical L1 allowances; null for a failed node. */ allowances: readonly (number | null)[];
	/** Whether all four spectral channels passed. */ resolved: boolean;
	/** Both-method medium-pair evaluations. */ mediumEvaluations: number;
	/** Both-method outer-integrand evaluations. */ outerEvaluations: number;
	/** Actual elapsed evaluation milliseconds, including finite controls. */ elapsedMilliseconds: number;
	/** Exact per-node finite S80/T160, S160/T160, S80/T320, S160/T320 controls in that order; empty on finest rules. */ finite: readonly (readonly number[])[];
}>;
/** Mutable accumulator for a complete or interrupted angular rule. */
type SkyJ2Accumulator = {
	/** Frozen target id. */ targetId: string;
	/** Selected Direct40 channel. */ channel: number;
	/** Positive-weight Gauss L1 integral. */ gauss: number;
	/** Positive-weight Simpson L1 integral. */ simpson: number;
	/** Propagated accepted L1 allowance. */ allowance: number;
	/** Four finite S/T comparisons in registered factorial order, or empty for a finest angular rule. */ finite: number[];
};
/** One rule's local J2 outputs and limitation state. */
type SkyJ2RuleResult = Readonly<{
	/** Registered angular identity. */ ruleId: string;
	/** Frozen origin time. */ time: string;
	/** Number of unique incident rays required. */ expectedNodes: number;
	/** Number of completed independent incident evaluations. */ completedNodes: number;
	/** True only for complete, independently admitted L1 angular sums. */ finiteAngularResolved: boolean;
	/** Null unless all nodes completed; unavailable partial sums are never passed off as estimates. */ rows:
		readonly SkyJ2Accumulator[] | null;
}>;
/** Bounded local J2 component execution output. */
type SkyJ2RunResult = Readonly<{
	/** New immutable run path. */ run: string;
	/** Exact terminal seal. */ seal: DialFileIdentity;
	/** Infrastructure verification passed, separately from numerical limits. */ accepted: boolean;
	/** Every registered rule completed with admitted L1 integrands. */ matrixComplete: boolean;
	/** Numerical or resource limitation, null only when matrix is complete. */ stopReason: string | null;
}>;
/** Focused manufactured angular and reflection checks. */
type SkyJ2Proof = Readonly<{
	/** Distinct proof schema. */ schemaId: string;
	/** Number of checked mathematical assertions. */ checks: number;
	/** Maximum full Gaussian polynomial moment discrepancy. */ maximumMomentError: number;
	/** Maximum positive-hemisphere constant solid-angle discrepancy. */ maximumSolidAngleError: number;
	/** Explicit demonstration that doubling one mirror kernel is incorrect. */ asymmetricMirrorDifference: number;
}>;

/** Empirical angular adequacy in local density units, never physical uncertainty. */
type SkyJ2Envelope = Readonly<{
	/** Frozen output identity. */ targetId: string;
	/** Direct40 spectral index. */ channel: number;
	/** Finest midpoint Gauss-L1 density, null when a material comparison is missing. */ estimate: number | null;
	/** Accepted empirical allowance, null unless all independent and angular gates pass. */ empiricalAllowance:
		number | null;
	/** Absolute last midpoint correction. */ lastMidpointChange: number | null;
	/** Absolute finest same-count azimuth difference. */ placementDifference: number | null;
	/** Density-unit engineering floor max(1e-15,1e-6*abs(J2)). */ densityFloor: number | null;
	/** Last correction decreased or is below the floor. */ shrinking: boolean;
	/** All incident nodes resolved and angular adequacy checks pass. */ angularAdequate: boolean;
	/** Explicit limitation, null on empirical admission. */ reason: string | null;
}>;

/** Finite first-order numerical control shared by every selected channel. */
type SkyJ2FiniteControl = Readonly<{
	/** Trapezoid source intervals. */ source: number;
	/** Trapezoid transport intervals per physical branch. */ transport: number;
}>;
/** Compact incident evidence with its reproducible rule/geometry address. */
type SkyJ2NodeRecord = Readonly<
	SkyJ2NodeResult & {
		/** Frozen origin time. */ time: string;
		/** Angular rule ordinal; -1 means first I512 node's distinct mirrored witness. */ ruleIndex: number;
		/** Representative index in that rule. */ index: number;
	}
>;
/** Full independent diagnostics retained for a bounded pilot witness. */
type SkyJ2Witness = Readonly<{
	/** Frozen origin time. */ time: string;
	/** Fixed angular ordinal or -1 for actual reflection. */ ruleIndex: number;
	/** Incident representative ordinal. */ index: number;
	/** Complete independent method/tolerance reports. */ report: SkyPhysicalSurfaceResult;
	/** Actual elapsed incident milliseconds including finite controls when present. */ elapsedMilliseconds: number;
}>;
/** One evaluated node and its richer admission diagnostics. */
type SkyJ2NodeEvaluation = Readonly<{
	/** Compact finite/independent values. */ result: SkyJ2NodeResult;
	/** Complete two-method result. */ report: SkyPhysicalSurfaceResult;
}>;
/** In-process resource observation; never labelled private memory. */
type SkyJ2Memory = Readonly<{
	/** Total job elapsed milliseconds. */ elapsedMilliseconds: number;
	/** Observed Node resident set. */ residentSetBytes: number;
	/** Available system memory. */ availableBytes: number;
}>;
/** Prospective admission of the remaining angular matrix after pilot evidence. */
type SkyJ2PilotAdmission = Readonly<{
	/** Every pilot independent node resolved. */ resolved: boolean;
	/** Number of distinct rule nodes already evaluated. */ completedNodes: number;
	/** Average incident evaluation cost including both methods/accuracy passes. */ meanNodeMilliseconds: number;
	/** Slowest preregistered witness cost. */ maximumWitnessMilliseconds: number;
	/** Fixed conservative projection multiplier. */ projectionMultiplier: number;
	/** Remaining independent rule nodes. */ remainingNodes: number;
	/** Conservative projected completion cost. */ projectedRemainingMilliseconds: number;
	/** Remaining admitted CPU time after protected reporting reserve. */ remainingScientificMilliseconds: number;
	/** Projection fits the live scientific deadline. */ proceed: boolean;
}>;
/** Finite-only point result, never assigned an independent remaining-error allowance. */
type SkyJ2FiniteRow = Readonly<{
	/** Frozen outgoing target. */ targetId: string;
	/** Direct40 spectral channel. */ channel: number;
	/** Positive angular sums in the registered finite control order. */ finite: readonly number[];
}>;
/** Bounded fallback after an independent-reference limitation. */
type SkyJ2FiniteDiagnostic = Readonly<{
	/** First frozen ground-origin time only. */ time: string;
	/** Exact finite I512 midpoint rule. */ ruleId: string;
	/** Registered S/T control order. */ controls: readonly SkyJ2FiniteControl[];
	/** Complete finite angular sums. */ rows: readonly SkyJ2FiniteRow[];
	/** Explicitly false: these are finite sensitivities only. */ independentReferenceAvailable: boolean;
}>;

/** Canonical immutable local J2 reference document shared by scientific assessment and reporting. */
type SkyJ2ReferenceDocument = Readonly<{
	/** Exact producer schema. */ schemaId: 'sky-local-j2-reference-v1';
	/** Source-density units; these values are not sky radiance. */ units: 'W m^-3 sr^-1 nm^-1';
	/** Frozen physical query geometries. */ targets: readonly SkyJ2Target[];
	/** Explicit Direct40 channel ordinals. */ channels: readonly number[];
	/** Complete or explicitly unavailable independent angular sums. */ rules: readonly SkyJ2RuleResult[];
	/** Empirical angular allowances, including unresolved nulls. */ envelopes: readonly SkyJ2Envelope[];
	/** Finite fallback has no independent remaining-error allowance. */ finiteFallback: SkyJ2FiniteDiagnostic | null;
	/** All registered incident evaluations completed; not angular adequacy. */ matrixComplete: boolean;
	/** Numerical or resource stop when present. */ stopReason: string | null;
	/** Preserved physical-boundary, precision and interpretation limits. */ limitations: readonly string[];
}>;
