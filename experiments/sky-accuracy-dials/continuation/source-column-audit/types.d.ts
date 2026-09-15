/** One exact query or cache anchor in the bounded source-column pilot. */
type SkySourceAuditCoordinate = Readonly<{
	id: string;
	kind: 'sample' | 'knot';
	probeIds: readonly string[];
	point: SkyVector3;
	altitudeMeters: number;
	solarCosine: number;
}>;
/** Independent physical geometry retaining the compiler anchor altitude/cosine. */
type SkySourceAuditGeometry = Readonly<{
	radius: number;
	projection: number;
	height: number;
	length: number;
	referenceLength: number;
	referenceOrigin: SkyVector3;
	referenceDirection: SkyVector3;
	convex: boolean;
}>;
/** Mutable accounting includes interrupted independent-column work. */
type SkySourceAuditWork = {mediumEvaluations: number; columnCalls: number; trapezoidEvaluations: number};
/** A complete finite source rule; geometric columns are shared across channels. */
type SkySourceAuditFinite = Readonly<{
	intervals: number;
	rayleighMeters: number;
	mieMeters: number;
	evaluations: number;
}>;
/** Original independent rule output, including failed convergence evidence. */
type SkySourceAuditPass = Readonly<{
	method: SkyPhysicalReferenceMethod;
	scale: number;
	columns: SkyPhysicalColumnResult;
}>;
/** Dimensionless optical-depth reference; allowance is empirical, never rigorous. */
type SkySourceAuditReference = Readonly<{
	channel: number;
	tau: number | null;
	allowance: number | null;
	transmission: number | null;
	transmissionAllowance: number | null;
	geometryAllowance: number;
	resolved: boolean;
	reasons: readonly string[];
}>;
/** Forecast contains no S160 evaluation or inferred target value. */
type SkySourceAuditForecast = Readonly<{
	coordinateId: string;
	channel: number;
	convex: boolean;
	baselineTau: number;
	baselineTransmission: number;
	endpointDerivativeDifference: number;
	predictedDeltaTau: number;
	predictedDeltaTransmission: number;
	expectedErrorRatio: number;
	reference: SkySourceAuditReference;
}>;
/** Qualified or unresolved baseline evidence, written before any held target. */
type SkySourceAuditPredictionRow = Readonly<{
	coordinate: SkySourceAuditCoordinate;
	geometry: SkySourceAuditGeometry;
	baseline: SkySourceAuditFinite;
	passes: readonly SkySourceAuditPass[];
	forecasts: readonly SkySourceAuditForecast[];
}>;
/** Assessment states distinguish absent significance from failed predictions. */
type SkySourceAuditState = 'passed' | 'failed' | 'unresolved';
/** Every scalar target and every original gate are retained. */
type SkySourceAuditAssessment = Readonly<{
	coordinateId: string;
	channel: number;
	targetTau: number;
	targetTransmission: number;
	actualDeltaTau: number;
	actualDeltaTransmission: number;
	baselineErrorTau: number | null;
	targetErrorTau: number | null;
	errorRatio: number | null;
	errorRatioInterval: readonly number[] | null;
	checks: Readonly<Record<string, SkySourceAuditState>>;
}>;
/** Full bounded geometry and exact sparse reconstruction support; no density evaluation. */
type SkySourceAuditInput = Readonly<{
	buildRequest: SkyBuildRequest;
	coordinates: readonly SkySourceAuditCoordinate[];
	samples: readonly {
		probeId: string;
		sampleIndex: number;
		start: number;
		end: number;
		distance: number;
		coordinateId: string;
		stencil: SkyViewSample;
	}[];
	knots: readonly SkyFieldCoordinate[];
	rays: readonly {probeId: string; ray: SkyRayGeometry}[];
}>;
/** Serialized forecast owner for the separate CPU target record. */
type SkySourceAuditPredictionRecord = Readonly<{
	schemaId: 'sky-source-column-prediction-v1';
	registration: DialFileIdentity;
	forecastPlan: DialFileIdentity;
	targetCaseId: 'source-column-s160';
	targetAlreadyExecuted: false;
	rows: readonly SkySourceAuditPredictionRow[];
}>;
