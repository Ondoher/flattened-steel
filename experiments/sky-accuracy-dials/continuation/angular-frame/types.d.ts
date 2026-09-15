/** The one registered morning package; each level has a distinct immutable record. */
type SkyAngularFrameStage = 'pilot' | 'sun16' | 'sun32' | 'radial32' | 'radial64';
type SkyAngularFrameCase = Readonly<{
	stage: SkyAngularFrameStage;
	frame: 'sun' | 'radial';
	radialCount: number;
	azimuthCount: number;
	fullDirectionCount: number;
}>;
type SkyAngularFrameInput = Readonly<{
	spec: SkyTransportSpec;
	target: SkyVolumeJ2Target;
	baseline: readonly Readonly<{id: string; rows: readonly SkyVolumeJ2Row[]}>[];
	identities: readonly DialFileIdentity[];
}>;
/** Mutable caller-owned evidence survives a failed or interrupted batch. */
type SkyAngularFrameState = {
	nodes: SkyVolumeJ2Node[];
	unresolvedWitnesses: SkyVolumeResult[];
	completedBatches: number;
	expectedCount: number;
	matrixComplete: boolean;
	partialCountsUnavailable: boolean;
};
type SkyAngularFrameExecutionOptions = Readonly<{
	deadlineEpochMilliseconds: number;
	guard: () => void;
	onBatch: (nodes: readonly SkyVolumeJ2Node[], completed: number, total: number) => void;
}>;
