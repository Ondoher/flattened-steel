/** Closed eight-row matrix; every mirror is counted as a separate direction. */
type SkyAngularEndpointRuleId =
	'ring32-a64' | 'mu8-a16' | 'mu16-a32' | 'mu16-a64' | 'mu32-a64' | 'mu64-a64' | 'mu32-a128' | 'theta16-a64';
type SkyAngularEndpointNode = Readonly<{direction: SkyVector3; weight: number; branch: SkyVolumeBranch | null}>;
/** Arithmetic scales for odd cancellation include both underlying phase operands. */
type SkyAngularEndpointRow = Readonly<{
	id: SkyAngularEndpointRuleId;
	coordinate: 'ring-mu' | 'split-mu' | 'split-theta';
	polarCount: number;
	azimuthCount: number;
	directionCount: number;
	phaseEvaluations: number;
	full: SkySourceReconstructionValue;
	even: SkySourceReconstructionValue;
	odd: SkySourceReconstructionValue;
	polynomial: SkySourceReconstructionValue;
	fullError: SkySourceReconstructionValue;
	evenError: SkySourceReconstructionValue;
	decompositionResidual: SkySourceReconstructionValue;
	solidAngle: SkySourceReconstructionValue;
	maximumUnitResidual: number;
	maximumBoundaryResidual: number | null;
	checks: Readonly<Record<string, SkySourceAuditState>>;
}>;
type SkyAngularEndpointForecast = Readonly<{
	source: 'mu32-a64';
	target: 'mu64-a64';
	factor: number;
	polynomial: SkySourceReconstructionValue;
	odd: SkySourceReconstructionValue;
}>;
/** All six frozen groups remain separate from replay/geometry/identity checks. */
type SkyAngularEndpointResult = Readonly<{
	schemaId: 'sky-angular-endpoint-control-v1';
	target: SkyVolumeJ2Target;
	g: number;
	reference: SkyAngularLobesReference;
	referenceAdequate: boolean;
	rows: readonly SkyAngularEndpointRow[];
	replays: Readonly<Record<string, SkySourceReconstructionValue>>;
	heldPrediction: SkyAngularEndpointForecast;
	heldDiscrepancies: Readonly<Record<'polynomial' | 'odd', SkySourceReconstructionValue>>;
	polynomialRatios: readonly Readonly<{
		coarse: SkyAngularEndpointRuleId;
		fine: SkyAngularEndpointRuleId;
		interval: readonly [number, number] | null;
	}>[];
	azimuthChanges: Readonly<Record<'polynomial' | 'odd', SkySourceReconstructionValue>>;
	implementationChecks: Readonly<Record<string, SkySourceAuditState>>;
	predictionGroups: Readonly<Record<string, Readonly<Record<string, SkySourceAuditState>>>>;
	predicates: readonly SkySourceAuditState[];
}>;
