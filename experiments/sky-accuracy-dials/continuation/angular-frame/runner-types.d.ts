/** Each completed batch is independently authenticated and decoded in original task order. */
type SkyAngularFrameBatchRecord = Readonly<{
	artifact: DialFileIdentity;
	firstOffset: number;
	count: number;
	uncompressedByteLength: number;
	uncompressedSha256: string;
}>;
/** Actual available task work, separate from job wall time and interrupted unknown work. */
type SkyAngularFrameCosts = Readonly<{
	expectedCount: number;
	retainedNodeCount: number;
	aggregateIncidentMilliseconds: number;
	slowestIncidentMilliseconds: number;
	mediumEvaluations: number;
	outerEvaluations: number;
	compressedNodeBytes: number;
	partialCountsUnavailable: boolean;
}>;
/** Admission and geometry checks are retained without claiming an angular oracle. */
type SkyAngularFrameDocument = Readonly<{
	schemaId: 'sky-angular-frame-stage-v1';
	packageId: 'angular-frame-morning-v1';
	registration: DialFileIdentity;
	plan: DialFileIdentity;
	stage: SkyAngularFrameStage;
	candidate: SkyAngularFrameCase;
	target: SkyVolumeJ2Target;
	channels: readonly [0, 8];
	matrixComplete: boolean;
	expectedCount: number;
	retainedNodeCount: number;
	completedBatches: number;
	partialCountsUnavailable: boolean;
	rows: readonly SkyVolumeJ2Row[] | null;
	checks: readonly SkyVolumeJ2Check[];
	nodeBatches: readonly SkyAngularFrameBatchRecord[];
	costs: SkyAngularFrameCosts;
	failure: string | null;
}>;
/** Assessment records may have another caseId and no stage document. */
type SkyAngularFrameTerminal = SkyMechanismTerminal &
	Readonly<{
		recipe: SkyMechanismTerminalRecipe &
			Readonly<{
				parameters: SkyMechanismTerminalParameters &
					Readonly<{
						packageId: string;
						stage?: SkyAngularFrameStage;
						pilotRun?: string | null;
						sourceIdentities: readonly DialFileIdentity[];
					}>;
			}>;
		result: Readonly<{jobElapsedMilliseconds: number; failure?: string | null}>;
	}>;
type SkyAngularFrameRunEntry = Readonly<{
	run: string;
	seal: DialFileIdentity;
	terminal: SkyAngularFrameTerminal;
	retainedBytes: number;
	document?: SkyAngularFrameDocument;
}>;
/** Package debit counts every new terminal state, including failed and assessment records. */
type SkyAngularFramePackageUsage = Readonly<{retainedBytes: number; elapsedMilliseconds: number; runCount: number}>;
type SkyAngularFrameForecast = Readonly<{
	expectedCount: number;
	overheadBytes: number;
	nodeBytes: number;
	totalBytes: number;
	aggregateRateMilliseconds: number | null;
	slowestIncidentMilliseconds: number | null;
	parallelWorkMilliseconds: number | null;
	startupAndFinalizationMilliseconds: number;
	jobMilliseconds: number;
}>;
