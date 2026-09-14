/** Prospectively sealed additive spectral target, never a computation of the changed recurrence. */
type SkyMechanismPrediction = Readonly<{
	/** Closed interaction forecast schema. */ schemaId: 'sky-mechanism-prediction-v1';
	/** Original continuation authority. */ registration: DialFileIdentity;
	/** Exact prospective case catalog. */ mechanismRegistration: DialFileIdentity;
	/** Held case identity. */ targetCaseId: string;
	/** Complete held case definition. */ targetCase: SkyMechanismCase;
	/** The fixed perturbation model Lpred=LA+LB−LH. */ model: 'additive';
	/** Screen outcome scope. */ scope: 'screen';
	/** Registration verifies that no target attempt yet exists. */ targetAlreadyExecuted: false;
	/** Source outcomes used to construct the additive forecast. */ parents: Readonly<{
		baseline: DialFileIdentity;
		first: DialFileIdentity;
		second: DialFileIdentity;
	}>;
	/** Output view subdivision selectors. */ viewIntervals: readonly number[];
	/** Explicit grouped reconstruction selector. */ representations: readonly string[];
	/** Output channel axes; channel39 is diagnostic, never scored. */ channels: readonly number[];
	/** Output time axes. */ times: readonly string[];
	/** Exact authored implementations used by the predictor. */ sourceIdentities: readonly DialFileIdentity[];
	/** Compact f64le outputs in channel order, each view/order/ray. */ predictedSpectrumArtifacts: readonly DialFileIdentity[];
	/** Losslessly compressed locked per-view/order spectral and score predictions. */ forecastArtifact: DialFileIdentity;
	/** Forecast assumptions and unmodelled feedback. */ limitations: readonly string[];
}>;

/** Validated one-vertex source retained only in memory during analysis. */
type SkyInteractionSource = Readonly<{
	/** Accepted original source record. */ input: SkyMechanismAcceptedRun;
	/** Authenticated compact channel spectra and construction control. */ loaded: DialLoadedSpectra;
	/** Exact control, metadata and spectral artifact parents consumed. */ artifacts: readonly DialFileIdentity[];
}>;
/** Sealed score forecast for either all screen times or one time. */
type SkyInteractionScoreForecast = Readonly<{
	/** Null denotes the pooled three-time screen; otherwise one registered time. */ time: string | null;
	/** Number of scored scalars, excluding channel39. */ sampleCount: number;
	/** Measured baseline RMSE in mW spectral-radiance units. */ baselineRmseMilliwatt: number;
	/** Unclipped additive model's predicted RMSE. */ predictedRmseMilliwatt: number;
	/** Baseline minus predicted RMSE; positive means improvement. */ predictedGainMilliwatt: number;
	/** Direct squared-residual sum for the predicted model. */ predictedSquaredError: number;
	/** Physically invalid predictions retained without silently clipping them. */ negativePredictedScalars: number;
	/** Predicted signed residual-cross and quadratic terms. */ sse: DialScoreDeltaIdentity;
}>;
/** One prospectively frozen grouped view/order selector. */
type SkyInteractionForecast = Readonly<{
	/** Eight or sixteen subdivisions per altitude segment. */ view: number;
	/** Cumulative scattering order1 through4. */ order: number;
	/** Exact signed spectral-response prediction, with fixed group gates. */ spectral: DialSpectralPrediction;
	/** SHA256 of JSON.stringify(spectral), sealed before target generation. */ predictionSha256: string;
	/** Aggregate and each condition's locked score prediction. */ scores: readonly SkyInteractionScoreForecast[];
}>;
/** Actual score prediction check, separate from the spectral response gate. */
type SkyInteractionScoreAssessment = SkyInteractionScoreForecast &
	Readonly<{
		/** Target's measured Kider RMSE. */ actualRmseMilliwatt: number;
		/** Baseline minus target RMSE; positive means improvement. */ actualGainMilliwatt: number;
		/** Absolute difference between predicted and observed score gain. */ forecastErrorMilliwatt: number;
		/** max(25percent of predicted magnitude,0.01mW). */ allowanceMilliwatt: number;
		/** Exact observed and predicted gain signs agree, including exact zero. */ directionPassed: boolean;
		/** Direction and magnitude criteria both pass. */ passed: boolean;
	}>;
/** One complete condition/angular two-factor attribution. */
type SkyInteractionContrast = Readonly<{
	/** Geometry-only group identity. */ id: string;
	/** Six-channel count used for spectral interaction. */ spectralScalarCount: number;
	/** Five-channel count used for Kider SSE terms. */ scoreScalarCount: number;
	/** Norm of target-A-B+H in W spectral-radiance units. */ interactionNormW: number;
	/** Interaction norm relative to the sum of main-effect norms with fixed floor. */ relativeInteraction: number;
	/** SSE(target)-SSE(A)-SSE(B)+SSE(H). */ squaredErrorInteraction: number;
	/** Twice the dot product of the main effects, present even with additive spectra. */ additiveSquaredErrorCrossTerm: number;
	/** Twice the additive target residual dot spectral interaction. */ interactionResidualCrossTerm: number;
	/** Spectral interaction squared norm over scored channels. */ interactionSquaredNorm: number;
	/** Residual between direct and expanded factorial SSE equations. */ identityResidual: number;
	/** Target-H SSE identity, including signed residual and response-square terms. */ actualSse: DialScoreDeltaIdentity;
}>;
/** Independent outcomes for one locked view/order response. */
type SkyInteractionAssessmentRow = Readonly<{
	/** Matched view subdivision selector. */ view: number;
	/** Cumulative scattering selector. */ order: number;
	/** All condition and nonempty angular spectral gates. */ spectral: DialPredictionEvaluation;
	/** Aggregate and per-time measured-score forecast checks. */ scores: readonly SkyInteractionScoreAssessment[];
	/** Complete two-factor interactions and SSE attribution. */ contrasts: readonly SkyInteractionContrast[];
	/** Every registered spectral group passed. */ spectralPassed: boolean;
	/** Every score direction/magnitude check passed. */ scorePassed: boolean;
}>;
/** Immutable prediction bundle authenticated during assessment. */
type SkyInteractionPredictionRead = Readonly<{
	/** Accepted run and terminal inventory. */ input: SkyMechanismAcceptedRun;
	/** Exact prediction manifest identity. */ artifact: DialFileIdentity;
	/** Canonical manifest with all direct parents. */ record: SkyMechanismPrediction;
	/** Exact catalog that governed target execution. */ catalog: SkyMechanismRegistrationRead;
	/** H,A,B sources, never the held target. */ sources: readonly SkyInteractionSource[];
	/** Six channel-major additive spectra. */ buffers: readonly Buffer[];
	/** Eight locked view/order forecasts. */ forecasts: readonly SkyInteractionForecast[];
	/** ISO terminal publication timestamp. */ lockedAt: string;
}>;
/** Owned bounded CPU-run writer with one-way terminal state. */
type SkyInteractionWriter = Readonly<{
	/** Allocated run capability, including progress. */ run: DialRun;
	/** Exact authenticated CPU import closure and declarations. */ sources: readonly DialFileIdentity[];
	/** Write only after resource, time and terminal-reserve checks. */ write: (
		name: string,
		value: unknown,
		derivation?: DialDerivation,
	) => DialFileIdentity;
	/** Seal an accepted diagnostic, independently of scientific prediction success. */ finish: (
		result: Readonly<Record<string, unknown>>,
	) => DialExecutionResult;
	/** Seal a failed operation if still open, then throw the original failure. */ fail: (error: unknown) => never;
}>;
/** Consumed terminal timestamp; remaining fields remain owned by run verification. */
type SkyInteractionSealTime = Readonly<{
	/** UTC seal publication time. */ finishedAt: string;
}>;
/** Consumed first progress timestamp from the authenticated target artifact. */
type SkyInteractionProgressTime = Readonly<{
	/** UTC time recorded when the target run was allocated. */ timestamp: string;
}>;
/** Compact synthetic implementation check, separate from atmospheric evidence. */
type SkyInteractionImplementationProof = Readonly<{
	/** Exact manufactured proof schema. */ schemaId: 'sky-interaction-implementation-proof-v1';
	/** Explicit successful assertions, including layout scalars. */ checks: number;
	/** All attempted checks succeeded. */ passed: true;
	/** Exact grouped view/order forecast count. */ selectorCount: number;
	/** Nonempty geometry-only angular memberships. */ nonemptyAngularGroupCount: number;
	/** Largest observed floating-point SSE expansion residual. */ maximumSseIdentityResidual: number;
	/** Limits of synthetic evidence. */ scope: string;
}>;
/** Narrow GPU execution artifact consumed by the final-J1 causal comparison. */
type SkyInteractionGpuExecution = Readonly<{
	/** Authenticated successful host report, or null on failed execution. */ execution: SkyGpuHostResult | null;
}>;
/** Mutable accumulation of a separately reported final-J1 invariance diagnostic. */
type SkyInteractionCausalCheck = {
	/** Number of exact matched higher-field hashes across the six channels. */ matchedHigherFields: number;
	/** Source coordinate inventories matched exactly before hashes were compared. */ exactSparseCoordinates: true;
	/** Largest absolute target-minus-additive spectral response. */ maximumInteractionW: number;
	/** Largest per-scalar floating-point allowance used. */ maximumRoundoffAllowanceW: number;
	/** Every interaction is within128eps times the local radiance scale plus1e-20W. */ withinRoundoff: boolean;
};
