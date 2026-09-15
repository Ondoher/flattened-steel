/** Immutable column-control output plus original finite source columns. */
type SkySourceGridBaseline = Readonly<{
	document: Readonly<{
		schemaId: 'sky-column-reconstruction-v1';
		rows: SkySourcePhaseRow[];
		groups: SkySourceReconstructionGroup[];
		localChecks: Record<string, SkySourceAuditState>[];
	}>;
	prediction: SkySourceAuditPredictionRecord;
	target: SkySourceReconstructionTarget;
	identities: readonly DialFileIdentity[];
}>;
type SkySourceGridMode = 'reference' | 's80' | 's160' | 'predicted160';
