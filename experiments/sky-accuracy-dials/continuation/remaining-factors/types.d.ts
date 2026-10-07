/** Prospective, package-scoped GPU allowance after the original 36 attempts. */
type SkyRemainingGpuAuthorization = Readonly<{
	/** Closed schema identity. */ schemaId: 'sky-remaining-gpu-authorization-v1';
	/** Only authorized package. */ packageId: string;
	/** Exact completed accounting record. */ through: DialFileIdentity;
	/** Frozen owner-authorized observation plan. */ plan: DialFileIdentity;
	/** Unchanged original construction cap. */ originalSlots: number;
	/** New attempts belonging only to this package. */ additionalSlots: number;
	/** Absolute package stopping time. */ deadline: string;
	/** Only executable scientific case. */ caseId: string;
}>;
/** Exact retained capture and its effective cumulative orders. */
type SkyRemainingCapture = Readonly<{
	/** Stable capture name. */ name: string;
	/** Retained run path. */ run: string;
	/** Whether it represents a reconstruction, altitude or transport intervention. */ numericalCandidate: boolean;
	/** All consumed per-channel diagnostic rows. */ rows: readonly SkyRemainingOrderRow[];
}>;
/** Accepted four/six-order diagnostic container; each schema owns one row key. */
type SkyRemainingDiagnosticBoundary = Readonly<{
	/** Original schema identity. */ schemaId: string;
	/** Physical units. */ units: string;
	/** Six-order rows, when using the six-order schema. */ rows?: readonly SkyRemainingOrderRow[];
	/** Four-order rows, when using the original schema. */ probes?: readonly SkyRemainingOrderRow[];
}>;
/** Minimal independent P2 assessment boundary. */
type SkyRemainingP2Boundary = Readonly<{
	/** Two qualified spectral references; the owning run supplies the ray identity. */ channels: readonly Omit<
		SkyRemainingP2,
		'probeId'
	>[];
}>;
/** Minimal common boundary of the retained four/six-order diagnostics. */
type SkyRemainingOrderRow = Readonly<{
	/** Matched C0 identity. */ probeId: string;
	/** Spectral channel. */ channel: number;
	/** Actual cumulative order. */ order: number;
	/** Original representation identity. */ representationId: string;
	/** Original integration method. */ methodId: string;
	/** Cumulative spectral radiance in W. */ value: number;
	/** Original fixed-field numerical allowance, when admitted. */ errorAllowance: number | null;
}>;
/** Exact P2 reference at its original ray, without widening its scope. */
type SkyRemainingP2 = Readonly<{
	/** Original ray identity. */ probeId: string;
	/** Original channel. */ channel: number;
	/** Independently integrated second order, W. */ referenceWatts: number;
	/** Retained empirical allowance, W. */ allowanceWatts: number;
	/** Original reference admission. */ adequate: boolean;
}>;
/** All authenticated numerical inputs to the retained-data accounting. */
type SkyRemainingInputs = Readonly<{
	/** New corrected P1 and original measurement rows. */ corrected: readonly SkyTargetedScalar[];
	/** Original selected geometry and physical first-order allowances. */ references: readonly SkyJ1AssessmentRow[];
	/** Matched numerical interventions and order extensions. */ captures: readonly SkyRemainingCapture[];
	/** Four independently referenced P2 scalars. */ physicalSecond: readonly SkyRemainingP2[];
	/** Complete consumed seals and artifact identities. */ parents: readonly DialFileIdentity[];
}>;
/** One frozen-P1 combination and its signed residual budget. */
type SkyRemainingRow = Readonly<{
	/** Probe identity. */ probeId: string;
	/** Time stratum. */ time: string;
	/** Spectral channel. */ channel: number;
	/** Solar angular separation in degrees. */ solarSeparation: number;
	/** Viewing elevation in degrees. */ elevation: number;
	/** Numerical intervention or finite-tail variant. */ candidate: string;
	/** Fixed corrected first order, W. */ first: number;
	/** Original measurement, W. */ measured: number;
	/** Effective second through sixth increments; omitted orders are absent. */ higherOrders: readonly number[];
	/** Fixed-P1 total minus measurement, W. */ residual: number;
	/** Same combination at the earlier P1 viewing level. */ residual8: number;
	/** Change from fixed-P1 plus original H higher light. */ delta: number;
	/** Exact 2*baselineResidual*delta contribution to SSE. */ crossTerm: number;
	/** Squared radiance change contribution to SSE. */ squaredChange: number;
	/** Retained final-view allowance for the higher contribution. */ higherAllowance: number | null;
	/** Original physical P2 error, when independently referenced. */ secondError: number | null;
	/** Necessary lower bound with all later physical orders nonnegative. */ physicalLowerBound: number | null;
}>;
/** Aggregate or explicitly selected residual group. */
type SkyRemainingGroup = Readonly<{
	/** Group identity; groups may overlap. */ group: string;
	/** Intervention identity. */ candidate: string;
	/** Scalar count. */ count: number;
	/** Positive residual count. */ positive: number;
	/** Negative residual count. */ negative: number;
	/** Signed average residual, spectral mW. */ meanMw: number;
	/** Proxy RMSE, spectral mW. */ rmseMw: number;
	/** Proxy RMSE with earlier corrected P1 view level. */ rmse8Mw: number;
	/** Sum of the exact linear SSE change term, W squared. */ crossTerm: number;
	/** Sum of the squared radiance changes, W squared. */ squaredChange: number;
	/** L2 sum of fixed-field higher-light allowances, W. */ allowanceNorm: number | null;
}>;
/** Prospective cache-build priority screen. */
type SkyRemainingGate = Readonly<{
	/** Retained numerical candidate. */ candidate: string;
	/** Aggregate proxy gain relative to original higher light, mW. */ gainMw: number;
	/** Same gain with earlier P1 view level, mW. */ gain8Mw: number;
	/** Independently referenced P2 scalars that reduce absolute numerical error. */ p2Improved: number;
	/** Number of independently referenced P2 scalars available. */ p2Count: number;
	/** Whether the prospective priority screen admits new cache builds. */ admitted: boolean;
}>;
/** Complete retained-data stage, including the stop/continue decision. */
type SkyRemainingAssessment = Readonly<{
	/** Every fixed-field combination. */ rows: readonly SkyRemainingRow[];
	/** Signed and angularly stratified scores. */ groups: readonly SkyRemainingGroup[];
	/** All candidate execution screens. */ gates: readonly SkyRemainingGate[];
	/** Conditional two-build factorial should execute. */ runHigherFactorial: boolean;
	/** Original matched H cumulative-prefix comparisons. */ prefixChecks: number;
}>;
/** One deterministic pointing or cone sample. */
type SkyObservationDirection = Readonly<{
	/** Fixed sensitivity scenario. */ variant: string;
	/** Unit viewing direction in the original Sun frame. */ direction: SkyVector3;
	/** Nonnegative normalized angular weight. */ weight: number;
}>;
/** Ray output address, retaining all original selector identities. */
type SkyObservationRay = SkyTargetedRayLayout & SkyObservationDirection;
/** GPU observation geometry: four RGBA metadata texels per ray sample. */
type SkyObservationPayload = Omit<SkyTargetedPayload, 'rowLayout'> &
	Readonly<{
		/** Expanded fixed directions and view levels. */ rowLayout: readonly SkyObservationRay[];
	}>;
/** Compact binary transfer avoids decimal expansion of the prepared sample texture. */
type SkyObservationTransfer = Omit<SkyObservationPayload, 'samples'> &
	Readonly<{
		/** Little-endian Float32 sample texture bytes encoded as base64. */ samplesBase64: string;
	}>;
/** One independently reported directional/acceptance sensitivity. */
type SkyObservationScalar = Readonly<{
	/** Original probe identity. */ probeId: string;
	/** Measurement time. */ time: string;
	/** Spectral channel. */ channel: number;
	/** Fixed perturbation scenario. */ variant: string;
	/** First-order radiance at view level eight, W. */ first8: number;
	/** First-order radiance at view level sixteen, W. */ first16: number;
	/** Original-direction first-order radiance at level sixteen, W. */ originalFirst: number;
	/** First-order response to the observation scenario, W. */ delta: number;
	/** Residual with original higher light frozen, W. */ residual: number;
	/** Same residual at level eight, W. */ residual8: number;
	/** Original-direction residual with original higher light, W. */ originalResidual: number;
	/** Known physical-first plus physical-second lower bound, when available. */ physicalLowerBound: number | null;
	/** That lower bound shifted only by the measured first-order response. */ shiftedLowerDiagnostic: number | null;
}>;
/** Scenario response and score across an explicit group. */
type SkyObservationGroup = Readonly<{
	/** Aggregate, time or channel selector. */ group: string;
	/** Fixed scenario identity. */ variant: string;
	/** Number of spectral scalars. */ count: number;
	/** First-order response RMS, spectral mW. */ deltaRmsMw: number;
	/** Signed mean first-order response, spectral mW. */ deltaMeanMw: number;
	/** Frozen-higher proxy RMSE, spectral mW. */ rmseMw: number;
	/** Same proxy RMSE at earlier view level. */ rmse8Mw: number;
	/** Positive means aggregate proxy improvement. */ gainMw: number;
	/** Positive means aggregate proxy improvement at earlier view level. */ gain8Mw: number;
	/** Spectral response signs differing across view levels. */ unstableSigns: number;
}>;
/** Deliberately generous independent-per-scalar scenario envelope. */
type SkyObservationEnvelope = Readonly<{
	/** Original probe. */ probeId: string;
	/** Time stratum. */ time: string;
	/** Spectral channel. */ channel: number;
	/** Unmodified residual, W. */ residual: number;
	/** Most negative scenario response, W. */ minimumDelta: number;
	/** Most positive scenario response, W. */ maximumDelta: number;
	/** Whether this component envelope can reach zero residual. */ spansResidual: boolean;
}>;
/** Complete observation first-order sensitivity result. */
type SkyObservationAudit = Readonly<{
	/** Exact raw inputs and provenance sources. */ parents: readonly DialFileIdentity[];
	/** Fixed measurement scalars independently reproduced. */ scalarChecks: number;
	/** Consumed original spectral files. */ rawFiles: number;
	/** Scalars using the existing index-zero anomaly repair. */ repairedScalars: number;
	/** Largest reconstructed measurement difference, W. */ maximumDifferenceW: number;
	/** Physical channel wavelengths. */ wavelengthsNm: readonly number[];
	/** Original coordinate and spectral processing convention. */ convention: string;
	/** Instrument metadata limits governing interpretation. */ metadata: string;
}>;
/** Complete observation first-order sensitivity result. */
type SkyObservationAssessment = Readonly<{
	/** Every fixed variant and scalar. */ rows: readonly SkyObservationScalar[];
	/** Every time/channel/aggregate comparison. */ groups: readonly SkyObservationGroup[];
	/** Original-direction comparisons against 00224. */ parity: readonly SkyTargetedParity[];
	/** Non-calibratable per-scalar magnitude envelope. */ envelopes: readonly SkyObservationEnvelope[];
}>;
/** Minimal validated discovery boundary from the owned Chrome instance. */
type SkyObservationDevToolsTarget = Readonly<{
	/** Chrome target category. */ type: string;
	/** Page location; only the owned blank page is admitted. */ url: string;
	/** Loopback endpoint belonging to the verified owned browser port. */ webSocketDebuggerUrl: string;
}>;
/** Minimal browser protocol response, narrowed at each command boundary. */
type SkyObservationDevToolsReply = Readonly<{
	/** Remote object or serialized computation result. */ result?: Readonly<{
		/** Remote global object used to select an existing execution context. */ objectId?: string;
		/** Untrusted by-value browser return, validated by the assessment. */ value?: unknown;
	}>;
	/** Browser exception details, treated as fatal. */ exceptionDetails?: unknown;
}>;
