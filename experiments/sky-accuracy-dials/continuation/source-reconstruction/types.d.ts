/** A numerical centre and propagated empirical allowance in the same units. */
type SkySourceReconstructionValue = Readonly<{value: number; allowance: number}>;
/** Reconstruction choices and stored numeric formats are independently controlled. */
type SkySourceReconstructionMode = 'raw' | 'split' | 'factored';
type SkySourceReconstructionPrecision = 'binary64' | 'float32';
type SkySourceReconstructionCount = 's80' | 's160' | 'reference';
/** One immutable column pair, authenticated and replayed from the earlier audit. */
type SkySourceReconstructionColumn = Readonly<{
	coordinate: SkySourceAuditCoordinate;
	channel: number;
	s80: SkySourceReconstructionValue;
	s160: SkySourceReconstructionValue;
	reference: SkySourceReconstructionValue;
}>;
/** Field arrays keep density and illumination physically separate. */
type SkySourceReconstructionFields = Readonly<{
	raw: readonly SkySourceReconstructionValue[];
	rayleighDensity: readonly SkySourceReconstructionValue[];
	mieDensity: readonly SkySourceReconstructionValue[];
	rayleighLighting: readonly SkySourceReconstructionValue[];
	mieLighting: readonly SkySourceReconstructionValue[];
}>;
/** One fixed sample, all controls, and exact algebraic error attribution. */
type SkySourceReconstructionRow = Readonly<{
	probeId: string;
	channel: number;
	sampleIndex: number;
	altitudeMeters: number;
	weightMeters: number;
	direct: Readonly<Record<SkySourceReconstructionCount, SkySourceReconstructionValue>>;
	reconstructed: Readonly<Record<string, SkySourceReconstructionValue>>;
	terms: Readonly<Record<string, SkySourceReconstructionValue>>;
	identityResidual: number;
}>;
/** Bounded input and its complete retained parent identities. */
type SkySourceReconstructionInput = Readonly<{
	input: SkySourceAuditInput;
	columns: readonly SkySourceReconstructionColumn[];
	identities: readonly DialFileIdentity[];
	compatibility: Readonly<{relevantSources: readonly DialFileIdentity[]; originalSnapshot: DialFileIdentity}>;
}>;
/** Group predicates retain failures and unresolved signs. */
type SkySourceReconstructionGroup = Readonly<{
	probeId: string;
	channel: number;
	sampleCount: number;
	projected: Readonly<Record<string, SkySourceReconstructionValue>>;
	rms: Readonly<Record<string, number>>;
	localSigns: Readonly<Record<string, Readonly<{positive: number; negative: number; unresolved: number}>>>;
	checks: Readonly<Record<string, SkySourceAuditState>>;
}>;

/** Retained finite target and its original scalar assessment; no new source solve. */
type SkySourceReconstructionTarget = Readonly<{
	schemaId: 'sky-source-column-target-v1';
	predictionRun: string;
	rows: readonly Readonly<{coordinateId: string; finite: SkySourceAuditFinite}>[];
}>;
type SkySourceReconstructionAssessment = Readonly<{
	schemaId: 'sky-source-column-assessment-v1';
	predictionRun: string;
	rows: readonly SkySourceAuditAssessment[];
}>;
