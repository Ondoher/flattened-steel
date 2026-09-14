/** Exact prospective C3/C4 construction, frozen before its target exists. */
type SkyMechanismCase = Readonly<{
	/** Unique case name; the generated c- prefix also fits the sixteen-character run label. */ id: string;
	/** C3 or C4 work allocation, enforced by the case reader. */ phase: SkyContinuationJobPhase;
	/** Complete canonical construction and grouped-view selectors. */ controls: SkyControlInput;
	/** Explicit final first-order reconstruction. */ finalFirstOrder: SkyContinuationFirstOrder;
	/** Combined raw, split raw, or query-density higher-order representation. */ higherRepresentation: SkyContinuationHigherRepresentation;
	/** Ordinary component references or the registered adaptive evaluator. */ referenceMode: SkyContinuationReferenceMode;
	/** Whether a sealed quantitative interaction forecast is mandatory. */ predictionRequired: boolean;
	/** Qualitative original mechanism question, independent of future results. */ hypothesis: string;
}>;

/** Complete immutable extension of the original continuation case inventory. */
type SkyMechanismRegistration = Readonly<{
	/** Exact closed schema. */ schemaId: 'sky-mechanism-registration-v1';
	/** Original unchanged C0 seal. */ registration: DialFileIdentity;
	/** Required authenticated phase-allocation amendment. */ allocation: DialFileIdentity;
	/** Existing H screen available only as retained spectra and diagnostics. */ reusedH: DialFileIdentity;
	/** All ten C3 and four C4 definitions. */ cases: readonly SkyMechanismCase[];
	/** Exact ordinary screen selection. */ screen: DialAnalysisSelection;
	/** Frozen component identities retained independently from ordinary screen rays. */ probes: readonly SkyContinuationProbe[];
	/** Required local-J2 query identities at the ground observer. */ groundDensityProbes: readonly SkyContinuationProbe[];
	/** Implementation identities observed at registration; execution has its own immutable snapshot. */ sourceIdentities: readonly DialFileIdentity[];
	/** Explicit method, scope, and cost limitations. */ limitations: readonly string[];
}>;

/** Verified prospective registration and exact record artifact. */
type SkyMechanismRegistrationRead = Readonly<{
	/** Repository-relative immutable run. */ run: string;
	/** Exact terminal identity. */ seal: DialFileIdentity;
	/** Exact mechanism-registration JSON identity. */ artifact: DialFileIdentity;
	/** Validated closed case inventory. */ record: SkyMechanismRegistration;
}>;

/** Optional parents; all dependent defaults remain exact fixed evidence identities. */
type SkyMechanismOptions = Readonly<{
	/** Exact prospective prediction run, required only for the three joint targets. */ predictionRun?: string;
	/** Exact registered allocation run; omission selects the accepted 00106 record. */ allocationRun?: string;
}>;

/** One actual prior mechanism construction debit, including unsuccessful attempts. */
type SkyMechanismAttempt = Readonly<{
	/** Exact immutable terminal run. */ run: string;
	/** Actual terminal state. */ state: DialRunState;
	/** C3 or C4 phase debit. */ phase: SkyContinuationJobPhase;
	/** Registered case, if retained by that attempt. */ caseId?: string;
}>;

/** Authenticated file and its JSON value, retained only while admitting an input. */
type SkyMechanismAcceptedRun = Readonly<{
	/** Normalized source run. */ run: string;
	/** Exact accepted seal. */ seal: DialFileIdentity;
	/** Consumed terminal subset; complete bytes are verified by verifyRun. */ terminal: SkyMechanismTerminal;
}>;

/** Narrow consumed subset of immutable terminal records. */
type SkyMechanismTerminal = Readonly<{
	/** Accepted state is checked by the reader. */ state: DialRunState;
	/** Exact retained file identities. */ artifacts: readonly DialFileIdentity[];
	/** Exact parent and job metadata needed to admit this record. */ recipe: SkyMechanismTerminalRecipe;
}>;

/** Parent records and continuation identity consumed by mechanism admission. */
type SkyMechanismTerminalRecipe = Readonly<{
	/** Exact direct derivation parents. */ parents: readonly DialFileIdentity[];
	/** Consumed fixed job metadata. */ parameters: SkyMechanismTerminalParameters;
}>;

/** Continuation job discriminators checked before reusing an immutable run. */
type SkyMechanismTerminalParameters = Readonly<{
	/** Exact original registration path. */ continuationRegistration: string;
	/** CPU or GPU debit. */ jobKind: SkyContinuationJobKind;
	/** Registered scope. */ scope: SkyContinuationJobScope;
	/** Registered work allocation. */ phase: SkyContinuationJobPhase;
	/** Optional case discriminator, present on constructed targets. */ caseId?: string;
}>;

/** Read-only complete preflight for a single mechanism screen. */
type SkyPreparedMechanism = Readonly<{
	/** Original campaign and immutable limits. */ registration: DialContinuationRegistrationRead;
	/** Prospective mechanism inventory. */ caseRegistration: SkyMechanismRegistrationRead;
	/** Exact selected case. */ candidate: SkyMechanismCase;
	/** Derived physical profile and original scalar-layout estimate. */ profile: SkyDerivedProfile;
	/** Actual recurrence scalar-byte forecast, including sequential species staging. */ estimatedPeakFieldBytes: number;
	/** Current resource admission. */ admission: SkyContinuationAdmission;
	/** Exact ordinary screen axes. */ selection: DialAnalysisSelection;
	/** Authenticated browser control. */ control: SkyGpuControl;
	/** Exact static/dynamic browser implementation closure. */ sources: readonly DialFileIdentity[];
	/** Explicit browser adapter entry. */ browserModulePath: string;
	/** Authenticated production common-shader/compiler module. */ compilerModulePath: string;
	/** Expected terminal compiler schema. */ compilerReportSchema: string;
	/** Actual source callback IDs, separate from the four spectral orders. */ expectedFieldIds: readonly string[];
	/** Accepted mandatory quantitative prediction; null for exploratory/control cases. */ prediction: SkyMechanismAcceptedRun | null;
}>;

/** Prepared geometry for density species spectra, references, and ground queries. */
type SkyMechanismDensityPlan = Readonly<{
	/** Ordinary grouped views with the complete sparse coordinate union. */ view: SkyViewPlan;
	/** Independently generated physical quadrature probes. */ reference: SkyFixedFieldReferencePlan;
	/** Reference-local coordinates mapped into the complete union. */ referenceIndexes: readonly number[];
}>;

/** Focused manufactured case/selector admission proof; no recurrence is executed. */
type SkyMechanismContractProof = Readonly<{
	/** Distinct proof identity. */ schemaId: 'sky-mechanism-contract-proof-v1';
	/** Number of independent case and negative-admission assertions. */ checks: number;
	/** Complete prospective screen count. */ caseCount: number;
	/** Number of exact joint targets requiring a prediction. */ requiredPredictions: number;
	/** Largest admitted sequential-species scalar-field forecast in this matrix. */ maximumSpeciesFieldBytes: number;
}>;
