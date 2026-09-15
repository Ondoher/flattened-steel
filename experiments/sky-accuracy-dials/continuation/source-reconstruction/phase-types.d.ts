/** Named consumed metadata for the prior matching-sample attribution. */
type SkySourcePhaseParentParameters = Readonly<{
	continuationRegistration: string;
	caseId: string;
	jobKind: string;
	phase: string;
	predictionRun: string;
	targetRun: string;
	sourceIdentities: readonly DialFileIdentity[];
}>;
/** Exact replay boundary, excluding report-only metadata. */
type SkySourcePhaseBaselineDocument = Readonly<{
	schemaId: 'sky-source-reconstruction-v1';
	rows: SkySourceReconstructionRow[];
	groups: SkySourceReconstructionGroup[];
}>;
type SkySourcePhaseBaseline = Readonly<{
	document: SkySourcePhaseBaselineDocument;
	identities: readonly DialFileIdentity[];
}>;
/** New phase controls preserve every original sample result and add identities. */
type SkySourcePhaseRow = SkySourceReconstructionRow &
	Readonly<{
		phaseIdentityResidual: number;
		transmissionIdentityResidual: number;
	}>;
