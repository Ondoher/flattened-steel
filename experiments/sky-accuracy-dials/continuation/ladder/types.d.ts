/** A ladder comparison boundary.
 * - **"screen"** - Complete ordinary rays in one registered screen condition.
 * - **"component"** - Frozen, deliberately selected component probes.
 */
type SkyLadderScope = 'screen' | 'component';
/** An explicit retained field reconstruction selector.
 * - **"grouped"** - Separate raw J1 and cumulative higher-order reconstruction.
 * - **"cumulative"** - Production Float32 cumulative field reconstruction.
 */
type SkyLadderRepresentation = 'grouped' | 'cumulative';
/** Authenticated terminal subset shared by ladder readers. */
type SkyLadderSeal = SkyContinuationAnalysisSeal &
	Readonly<{
		/** Canonical immutable run path. */ run: string;
		/** Original case and resource facts. */ result: Readonly<{
			/** Registered R0-R11 identity. */ caseId: string;
		}>;
	}>;
/** Complete source data kept in memory only for this bounded assessment. */
type SkyLadderSource = Readonly<{
	/** Original capture path. */ run: string;
	/** Authenticated terminal manifest. */ seal: SkyLadderSeal;
	/** Exact original spectra and controls. */ loaded: DialLoadedSpectra;
	/** Fully checked fixed-field envelopes, keyed by channel/probe/representation/order. */ envelopes: ReadonlyMap<
		string,
		SkyContinuationProbeDiagnostic
	>;
	/** Exact retained compressed diagnostic identities. */ diagnostics: readonly DialFileIdentity[];
	/** Optional point-density witnesses, never radiance references. */ ground: readonly SkyLadderGround[];
	/** Memoized ordinary spectrum selections; not retained fields. */ boundaries: Map<string, DialAnalysisBoundary>;
}>;
/** One optional ground-density evidence record with unchanged physical units. */
type SkyLadderGround = Readonly<{
	/** Original case identity. */ caseId: string;
	/** Original numerical channel. */ channel: number;
	/** Exact source containing the evidence. */ artifact: DialFileIdentity;
	/** Validated compact raw-tap/source-density derivation. */ evidence: SkyGroundDensityEvidence;
}>;
/** Fixed geometry-only group; angular/elevation groups may overlap. */
type SkyLadderGroup = Readonly<{
	/** Fully qualified scope/time/angular identity. */ id: string;
	/** Ordinary screen or frozen selected component scope. */ scope: SkyLadderScope;
	/** Exact registered condition. */ time: string;
	/** Sorted canonical y*9+x rays. */ rayIndices: readonly number[];
	/** Numerical channels; scores filter these to the registered measurement channels. */ channels: readonly number[];
	/** Frozen probe identities in ray order; empty for full ordinary groups. */ probes: readonly SkyContinuationProbe[];
}>;
/** Complete or explicitly missing finite vector; null never means zero error. */
type SkyLadderVector = Readonly<{
	/** Radiance estimates in ray-major/channel-major order. */ values: readonly (number | null)[];
	/** Independent fixed-field numerical allowances; ordinary outputs have none. */ allowances: readonly (
		number | null
	)[];
}>;
/** Finite-vector sensitivity metrics, without a convergence claim. */
type SkyLadderDelta = Readonly<{
	/** Number of required scalar coordinates. */ count: number;
	/** Available paired scalar count; missing pairs are not dropped from norms. */ availableCount: number;
	/** L2 norm of the full signed difference; null if any scalar is missing. */ normW: number | null;
	/** Root-mean-square signed-difference magnitude. */ rmsW: number | null;
	/** Signed mean response. */ meanW: number | null;
	/** Twice the observed norm, a sensitivity heuristic only. */ twiceObservedNormW: number | null;
	/** Number above the registered implementation floor; null if incomplete. */ significantCount: number | null;
	/** Number positive above that floor; null if incomplete. */ positiveCount: number | null;
	/** Number negative below that floor; null if incomplete. */ negativeCount: number | null;
}>;
/** Direction/magnitude comparison of two observed responses. */
type SkyLadderResponseComparison = Readonly<{
	/** Norm ratio of final-background response to initial-background response; null at the floor. */ normRatio:
		number | null;
	/** Direction cosine; null when either response is unresolved or negligible. */ cosine: number | null;
	/** Full vector norm of final minus initial response. */ differenceNormW: number | null;
}>;
/** Defined input pair for one component's observed response. */
type SkyLadderPair = Readonly<{
	/** Starting case. */ baseline: string;
	/** Ending case; orientation is candidate minus baseline. */ candidate: string;
}>;
/** Observed/independent evidence for one possible error component. */
type SkyLadderComponent = Readonly<{
	/** Numerical error component name. */ component: string;
	/** Source pair or independent reference recipe. */ support: string;
	/** Twice an observed change; never silently treated as a qualified remainder. */ twiceObservedNormW: number | null;
	/** Accepted component allowance only when independently qualified. */ qualifiedAllowanceW: number | null;
	/** Whether the supplied evidence qualifies this component in the stated scope. */ qualified: boolean;
	/** Exact missing-evidence or interpretation statement. */ reason: string;
}>;
/** Read-only numerical products to be retained through the run owner. */
type SkyLadderEvaluation = Readonly<{
	/** Rung/group/view/order Kider scores with numerical and score scopes separated. */ scores: SkyContinuationAnalysisTable;
	/** Signed rung responses and effective cumulative-increment responses. */ contrasts: SkyContinuationAnalysisTable;
	/** Local independent fixed-field view checks, not solver accuracy checks. */ views: SkyContinuationAnalysisTable;
	/** Source/transport/altitude background dependence and decreasing-change diagnostics. */ backgrounds: SkyContinuationAnalysisTable;
	/** All named component hypotheses and unresolved allowances. */ components: SkyContinuationAnalysisTable;
	/** Per-scope finite-N4 adequacy; missing material terms leave U null. */ adequacy: SkyContinuationAnalysisTable;
	/** Distances to R7/reference members, explicitly not exact-solution errors. */ members: SkyContinuationAnalysisTable;
}>;
/** Focused self-verifying mathematical/admission proof, independent of a GPU run. */
type SkyLadderProof = Readonly<{
	/** Exact proof schema. */ schemaId: string;
	/** Number of successful assertions. */ checks: number;
}>;
/** The exact registered subset needed by the local numerical-reduction predicate. */
type SkyLadderReductionGates = Pick<
	DialContinuationScientificGates,
	'maximumAllowanceToReduction' | 'strictReductionAllowanceMultiplier'
>;
