/** Only the two prospectively registered matched H altitude targets. */
type SkyAltitudeTargetCase = 'altitude-p51' | 'altitude-p63';
/** Accepted prospective prediction with authenticated current plan and model. */
type SkyAltitudeTargetPredictionRead = Readonly<{
	run: string;
	identities: readonly DialFileIdentity[];
	prediction: SkyAltitudePrediction;
	plan: DialFileIdentity;
	planBytes: Buffer;
}>;
/** Four original physical values for later held-response assessment. */
type SkyAltitudeTargetRead = Readonly<{
	run: string;
	caseId: SkyAltitudeTargetCase;
	identities: readonly DialFileIdentity[];
	control: SkyGpuControl;
	prediction: SkyAltitudeTargetPredictionRead;
	diagnostics: readonly SkyContinuationChannelDiagnostics[];
	targets: readonly SkyAltitudeTarget[];
	sharedKnots: SkyAltitudeSharedKnotEvidence;
}>;
/** A comparison uses physical receiver height and unchanged solar/outgoing domains, not texture row identity. */
type SkyAltitudeSharedKnotRow = Readonly<{
	channel: number;
	altitudeMeters: number;
	solarIndex: number;
	directionIndex: number;
	parentCoordinate: SkyFieldCoordinate;
	targetCoordinate: SkyFieldCoordinate;
	parentValues: readonly number[];
	targetValues: readonly number[];
	firstExact: boolean;
	secondExact: boolean;
}>;
/** Raw J1/J2 equality on the retained P55 ground-stencil intersection only. */
type SkyAltitudeSharedKnotEvidence = Readonly<{
	schemaId: 'sky-altitude-shared-ground-knots-v1';
	parentRun: string;
	rows: readonly SkyAltitudeSharedKnotRow[];
	state: SkyVolumeCheckState;
	scope: string;
	limitations: readonly string[];
}>;
/** Historical attempts are immutable and count even when they failed. */
type SkyAltitudeTargetAttempt = Readonly<{run: string; caseId: SkyAltitudeTargetCase; state: string}>;
/** Focused manufactured physical-address and failed-knot checks, without a target GPU run. */
type SkyAltitudeTargetProof = Readonly<{
	schemaId: 'sky-altitude-target-proof-v1';
	checks: number;
	sharedSurfaceTaps: readonly number[];
	physicalTargetExecuted: false;
}>;
