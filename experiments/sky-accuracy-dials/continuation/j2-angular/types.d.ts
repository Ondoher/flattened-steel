/** Radial coordinate conventions for the local J2 extension.
 * - **"full-positive"** - Positive nodes from full interval Gauss, inward integrand zero.
 * - **"hemisphere"** - Gauss directly on the outward cosine interval [0,1].
 * - **"squared-hemisphere"** - Gauss on u in [0,1], with cosine u squared and Jacobian 2u.
 */
type SkyAngularRadial = 'full-positive' | 'hemisphere' | 'squared-hemisphere';
/** Independently sealed stages of the angular attribution experiment.
 * - **"derive"** - Reuse old azimuth nodes and add the fixed-azimuth radial control.
 * - **"development"** - Compute outward hemisphere 8 and 16 node rules.
 * - **"predict"** - Freeze qualitative and empirical envelope predictions before fine outputs.
 * - **"fine"** - Compute held hemisphere32 and mapped32 rules and assess frozen predictions.
 */
type SkyAngularStage = 'derive' | 'development' | 'predict' | 'fine';
/** One explicitly admitted angular product rule. */
type SkyAngularRule = Readonly<{
	/** Stable local rule name. */ id: string;
	/** Explicit radial integration coordinate. */ radial: SkyAngularRadial;
	/** Gauss count in the stated coordinate before positive-half selection. */ muCount: number;
	/** Number of full-circle equal-weight azimuth positions. */ azimuthCount: number;
	/** Midpoints or cardinal endpoint-aware placement. */ placement: SkyAzimuthPlacement;
}>;
/** Exact address of a reused original independent L1 value. */
type SkyAngularAddress = Readonly<{
	/** Original localJ2Rules ordinal. */ ruleIndex: number;
	/** Original reflection representative ordinal. */ index: number;
}>;
/** New incident evidence explicitly retaining its actual intended geometry. */
type SkyAngularNode = Readonly<{
	/** Frozen origin time. */ time: string;
	/** Extension rule identifier. */ ruleId: string;
	/** Reflection representative ordinal. */ index: number;
	/** Exact vector, mirror and new solid-angle coefficient. */ incident: SkyJ2Incident;
	/** Original address when reused; null for new physical evaluation. */ reused: SkyAngularAddress | null;
	/** Exact earlier current-run time/rule/index when sharing a physical ray; null otherwise. */ sharedFrom:
		string | null;
	/** Both-method independent estimates and allowances. */ result: SkyJ2NodeResult;
}>;
/** Authenticated immutable original J2 evidence and exact replay. */
type SkyAngularOriginal = Readonly<{
	/** Accepted original terminal identity. */ seal: DialFileIdentity;
	/** Consumed source artifact identities. */ artifacts: readonly DialFileIdentity[];
	/** Frozen targets and original reference sums. */ reference: SkyJ2ReferenceDocument;
	/** Exact original node inventory. */ nodes: readonly SkyJ2NodeRecord[];
	/** Number of original accumulated scalar values reproduced exactly. */ exactReplayValues: number;
}>;
/** One prospective scalar prediction, never an assumed Gaussian order. */
type SkyAngularPrediction = Readonly<{
	/** Frozen outgoing probe. */ targetId: string;
	/** Frozen Direct40 channel. */ channel: number;
	/** Observed hemisphere8 density. */ coarse: number;
	/** Observed hemisphere16 density. */ medium: number;
	/** Retained medium-minus-coarse correction. */ observedCorrection: number;
	/** Engineering density floor; not measurement uncertainty. */ floor: number;
	/** Conservative empirical forecast radius around medium, not a rigorous bound. */ forecastRadius: number;
	/** Propagated independent incident allowance of the two development rules. */ incidentAllowance: number;
	/** No magnitude convergence order is asserted from two Gaussian levels. */ magnitudePredictionResolved: false;
}>;
/** Held scalar outcome retaining all failed and unresolved prediction gates. */
type SkyAngularOutcome = Readonly<{
	/** Frozen outgoing probe. */ targetId: string;
	/** Frozen channel. */ channel: number;
	/** Hemisphere32 density. */ fine: number;
	/** Squared-coordinate32 density. */ mapped: number;
	/** Fine minus medium correction. */ fineCorrection: number;
	/** Mapped minus fine discrepancy. */ mappedDifference: number;
	/** Whether final correction shrank relative to the preceding correction. */ correctionShrinks: boolean;
	/** Whether fine is closer than medium to independently mapped density. */ closerToMapped: boolean;
	/** Whether comparison is resolved above propagated incident error and floor. */ comparisonResolved: boolean;
	/** Whether fine falls inside the frozen empirical forecast interval. */ insideForecast: boolean;
	/** Same-count azimuth midpoint/endpoint difference at hemisphere32. */ placementDifference: number;
	/** Endpoint azimuth128-minus64 difference at hemisphere32. */ azimuthDifference: number;
	/** Whether all explicit local angular adequacy gates passed. */ angularAdequate: boolean;
	/** Empirical density allowance, null if material checks fail. */ empiricalAllowance: number | null;
}>;
/** Conservative comparison of older full-interval controls against the new local reference. */
type SkyAngularRanking = Readonly<{
	/** Frozen outgoing probe. */ targetId: string;
	/** Frozen channel. */ channel: number;
	/** Older full-interval candidate rule. */ ruleId: string;
	/** Candidate density minus new hemisphere32/azimuth128 estimate. */ discrepancy: number;
	/** Baseline full16/azimuth32 error magnitude minus candidate error magnitude. */ errorReduction: number;
	/** Absolute candidate-minus-baseline change, distinct from numerical error reduction D. */ interventionMagnitude: number;
	/** Accepted new-reference allowance; null for inadequate angular reference. */ referenceAllowance: number | null;
	/** Propagated incident L1 allowance in baseline density. */ baselineAllowance: number;
	/** Propagated incident L1 allowance in candidate density. */ candidateAllowance: number;
	/** Reference allowance plus max(baseline,candidate) incident allowance; null when unavailable. */ empiricalAllowance:
		number | null;
	/** Local reduction D clears U<=.2D and D>2U criteria. */ reductionQualified: boolean;
}>;
/** Compact scientific document; successful execution is distinct from adequacy. */
type SkyAngularDocument = Readonly<{
	/** Distinct extension schema. */ schemaId: 'sky-j2-angular-attribution-v1';
	/** Explicit local source-density units. */ units: 'W m^-3 sr^-1 nm^-1';
	/** Distinct scientific extension identity. */ extensionId: 'compensation-attribution-v1';
	/** Sealed stage. */ stage: SkyAngularStage;
	/** Exact original continuation. */ continuationRegistration: string;
	/** Frozen new plan identity. */ plan: DialFileIdentity;
	/** Immediate preceding stage run or null for derive. */ parentRun: string | null;
	/** Exact unchanged ground outputs. */ targets: readonly SkyJ2Target[];
	/** Explicit unchanged spectral indices. */ channels: readonly number[];
	/** Complete admitted angular sums, including inherited rows where stated. */ rules: readonly SkyJ2RuleResult[];
	/** Frozen predictions or their exact inherited copy. */ predictions: readonly SkyAngularPrediction[];
	/** Held outcomes; empty until the fine stage. */ outcomes: readonly SkyAngularOutcome[];
	/** Older-control numerical rankings; empty until the fine stage. */ rankings: readonly SkyAngularRanking[];
	/** Whether all intended stage work completed with resolved incident integrals. */ matrixComplete: boolean;
	/** Numerical or resource stop, never substituted with zero. */ stopReason: string | null;
}>;
/** Verified predecessor with its exact parent artifacts. */
type SkyAngularParent = Readonly<{
	/** Parent immutable terminal identity. */ seal: DialFileIdentity;
	/** Parent reference artifact identity. */ artifact: DialFileIdentity;
	/** Parsed validated scientific document. */ record: SkyAngularDocument;
}>;
/** Stage execution identity and separately stated numerical completion. */
type SkyAngularRunResult = Readonly<{
	/** Newly allocated run. */ run: string;
	/** Exact verified terminal seal. */ seal: DialFileIdentity;
	/** All intended incident and stage evaluations completed. */ matrixComplete: boolean;
	/** Numerical/resource limitation or null. */ stopReason: string | null;
}>;
/** Manufactured proof result, with no benchmark calculations. */
type SkyAngularProof = Readonly<{
	/** Proof schema. */ schemaId: string;
	/** Number of verified assertions. */ checks: number;
	/** Maximum analytically exact moment discrepancy. */ maximumMomentError: number;
	/** Maximum hemisphere solid-angle discrepancy. */ maximumSolidAngleError: number;
}>;
