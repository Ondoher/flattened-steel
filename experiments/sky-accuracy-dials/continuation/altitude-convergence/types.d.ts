/** Admitted fixed-field P2 increment and its integration allowance, in spectral watts. */
type SkyAltitudeValue = Readonly<{value: number; allowance: number | null}>;
/** A signed linear combination, with numerical and floating-point allowances kept distinct. */
type SkyAltitudeLinearValue = SkyAltitudeValue & Readonly<{roundoffAllowance: number}>;
/** Exact frozen original group; P51 does not accept its own held target. */
type SkyAltitudeGroup = Readonly<{
	probeId: 'p-0930-5-7' | 'p-1230-3-5';
	channel: 0 | 8;
	f1: SkyAltitudeValue;
	f8: SkyAltitudeValue;
	f4?: SkyAltitudeValue;
}>;
/** Prospective input, before the selected target exists. */
type SkyAltitudePredictionInput = Readonly<{stage: 'p51' | 'p63'; groups: readonly SkyAltitudeGroup[]}>;
/** Original three-term law coefficients; b includes unchanged numerical errors. */
type SkyAltitudeCoefficients = Readonly<{
	b: SkyAltitudeLinearValue;
	a: SkyAltitudeLinearValue;
	d: SkyAltitudeLinearValue;
}>;
/** Both absolute target and held response, with parent coefficient ordering stated explicitly. */
type SkyAltitudeModelPrediction = Readonly<{
	model: 'smooth-only' | 'competing-rate';
	parentOrder: readonly ('f1' | 'f4' | 'f8')[];
	targetCoefficients: readonly number[];
	responseCoefficients: readonly number[];
	target: SkyAltitudeLinearValue;
	response: SkyAltitudeLinearValue;
	fit: SkyAltitudeCoefficients;
}>;
/** One fixed group and its complete prospective model inventory. */
type SkyAltitudeGroupPrediction = Readonly<{
	probeId: string;
	channel: number;
	models: readonly SkyAltitudeModelPrediction[];
}>;
/** Fully replayable prospective values. */
type SkyAltitudePrediction = Readonly<{
	schemaId: 'sky-altitude-convergence-prediction-v1';
	inputs: SkyAltitudePredictionInput;
	rows: readonly SkyAltitudeGroupPrediction[];
}>;
/** Held value at the exact original group. */
type SkyAltitudeTarget = SkyAltitudeValue & Readonly<{probeId: string; channel: number}>;
/** Plan-owned magnitude and sign gates for a single response. */
type SkyAltitudeScalarAssessment = Readonly<{
	probeId: string;
	channel: number;
	predictedResponse: number;
	observedResponse: number;
	signedError: number;
	inputAllowance: number | null;
	roundoffAllowance: number;
	magnitudeThreshold: number | null;
	significanceThreshold: number | null;
	magnitude: SkyVolumeCheckState;
	signFloor: number | null;
	sign: SkyVolumeCheckState;
}>;
/** Identical response-only L2 criterion for all four original groups. */
type SkyAltitudeVectorAssessment = Readonly<{
	errorNorm: number;
	predictedResponseNorm: number;
	inputAllowanceNorm: number | null;
	magnitudeThreshold: number | null;
	significanceThreshold: number | null;
	state: SkyVolumeCheckState;
}>;
/** All outcomes for one registered model; no post-target selection. */
type SkyAltitudeModelAssessment = Readonly<{
	model: 'smooth-only' | 'competing-rate';
	rows: readonly SkyAltitudeScalarAssessment[];
	vector: SkyAltitudeVectorAssessment;
	allGroupMagnitudes: SkyVolumeCheckState;
}>;
/** Pure held-response evidence, without claiming physical P2 accuracy. */
type SkyAltitudeAssessment = Readonly<{
	schemaId: 'sky-altitude-convergence-assessment-v1';
	stage: 'p51' | 'p63';
	models: readonly SkyAltitudeModelAssessment[];
	physicalReferenceAdequate: false;
	limitations: readonly string[];
}>;
