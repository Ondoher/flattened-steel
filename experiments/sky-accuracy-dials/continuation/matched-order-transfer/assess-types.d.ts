/** A frozen numerical comparison, with unresolved input retained explicitly. */
type SkyOrderTransferNormCheck = Readonly<{
	count: number;
	errorNormWatts: number | null;
	predictionNormWatts: number | null;
	summedAllowanceNormWatts: number | null;
	thresholdWatts: number | null;
	state: SkyVolumeCheckState;
}>;
/** Two distinct declared allowances: the registered gate and a conservative superiority comparison. */
type SkyOrderTransferModelComparison = Readonly<{
	primaryErrorNormWatts: number | null;
	comparatorErrorNormWatts: number | null;
	primaryAllowanceNormWatts: number | null;
	comparatorAllowanceNormWatts: number | null;
	targetAllowanceNormWatts: number | null;
	noninferiorityAllowanceWatts: number | null;
	superiorityAllowanceWatts: number | null;
	noninferiority: SkyVolumeCheckState;
	primarySuperiority: SkyVolumeCheckState;
	superiorModel: 'primary' | 'comparator' | null;
	allowanceExplanation: string;
}>;
/** A held sign is resolved only when both values exceed the shared prescribed floor. */
type SkyOrderTransferSign = Readonly<{
	floorWatts: number | null;
	state: SkyVolumeCheckState;
}>;
/** The sign-rate gate covers resolved scalars only. */
type SkyOrderTransferSignSummary = Readonly<{
	total: number;
	resolved: number;
	passed: number;
	failed: number;
	unresolved: number;
	agreementRate: number | null;
	state: SkyVolumeCheckState;
}>;
/** One held group, never providing target N5/N6 to the predictor. */
type SkyOrderTransferAssessmentInput = Readonly<{
	frozen: SkyOrderTransferInput;
	prediction: SkyOrderTransferPrediction;
	target: readonly SkyOrderTransferValue[];
	original: SkyOrderAttributionRow;
}>;
/** One effective altitude response at actual order five or six. */
type SkyOrderTransferScalarAssessment = Readonly<{
	probeId: string;
	channel: number;
	order: 5 | 6;
	observed: SkyOrderTransferValue;
	primary: SkyOrderTransferForecastValue | null;
	comparator: SkyOrderTransferForecastValue | null;
	sign: SkyOrderTransferSign;
}>;
/** Exact finite N4/N6 contrast at the measurement implied by the original attribution. */
type SkyOrderTransferSseAssessment = Readonly<{
	measurementWatts: number;
	measurementDerivation: string;
	hN4Watts: number;
	pN4Watts: number;
	hN6Watts: number;
	pN6Watts: number;
	hFiniteTailWatts: number;
	pFiniteTailWatts: number;
	knownN4ResponseWatts: number;
	knownN4ResponseAllowanceWatts: number | null;
	observedTailInteractionWatts: number;
	observedTailInteractionAllowanceWatts: number | null;
	n6ResponseWatts: number;
	contrastIdentityResidualWatts: number;
	n4: SkyMatchedOrderResidualChange;
	n6: SkyMatchedOrderResidualChange;
	/** Change in the P55-minus-H SSE contrast between N4 and N6. */ deltaContrastSseWattsSquared: number;
	/** Common H tail changes the residual against the already-known N4 intervention. */ sharedTailCrossWattsSquared: number;
	/** Additional observed altitude-by-order interaction against the N6 baseline. */ interactionLinearWattsSquared: number;
	interactionQuadraticWattsSquared: number;
	sseIdentityResidualWattsSquared: number;
}>;
/** A finite tail is descriptive and never added to the response scoring denominator. */
type SkyOrderTransferTailAssessment = Readonly<{
	probeId: string;
	channel: number;
	observed: SkyOrderTransferValue;
	primary: SkyOrderTransferForecastValue | null;
	comparator: SkyOrderTransferForecastValue | null;
	primaryErrorWatts: number | null;
	comparatorErrorWatts: number | null;
}>;
/** One two-order ray/channel gate and its independently retained exact SSE contrast. */
type SkyOrderTransferGroupAssessment = Readonly<{
	probeId: string;
	channel: number;
	inputAdmitted: boolean;
	targetAdmitted: boolean;
	primaryNorm: SkyOrderTransferNormCheck;
	comparatorNorm: SkyOrderTransferNormCheck;
	sse: SkyOrderTransferSseAssessment;
}>;
/** Every preregistered gate, including all scalar signs and failed individual groups. */
type SkyOrderTransferAssessment = Readonly<{
	schemaId: 'sky-matched-p55-response-assessment-v1';
	units: 'W m^-2 sr^-1 nm^-1';
	groups: readonly SkyOrderTransferGroupAssessment[];
	scalars: readonly SkyOrderTransferScalarAssessment[];
	tails: readonly SkyOrderTransferTailAssessment[];
	inputAdmission: SkyVolumeCheckState;
	primaryAggregateNorm: SkyOrderTransferNormCheck;
	comparatorAggregateNorm: SkyOrderTransferNormCheck;
	allPrimaryGroupNorms: SkyVolumeCheckState;
	signs: SkyOrderTransferSignSummary;
	modelComparison: SkyOrderTransferModelComparison;
	primaryQualification: SkyVolumeCheckState;
	limitations: readonly string[];
}>;
/** Authenticated inputs and exact source derivation for the CPU assessor. */
type SkyOrderTransferAssessmentRead = Readonly<{
	identities: readonly DialFileIdentity[];
	inputs: readonly SkyOrderTransferAssessmentInput[];
	predictionRun: string;
	targetRun: string;
	plan: DialFileIdentity;
	planBytes: Buffer;
	targetEnvelopeCounts: Readonly<{total: number; admitted: number}>;
}>;
/** Local manufactured arithmetic and gate checks only. */
type SkyOrderTransferAssessmentProof = Readonly<{schemaId: string; checks: number}>;
