/** Explicit complete-sphere rule identities; mirror members count separately. */
type SkyAngularLobesRuleId = 'r8-a16' | 'r16-a16' | 'r8-a32' | 'r16-a32' | 'radial32-a12' | 'sun32-a12';
/** Arithmetic allowance excludes angular quadrature error. */
type SkyAngularLobesEstimate = Readonly<{
	value: number;
	allowance: number;
	directionCount: number;
	phaseEvaluations: number;
	solidAngle: number;
	maximumUnitResidual: number;
}>;
/** Uniform analytic truncation and empirical arithmetic allowances remain separate. */
type SkyAngularLobesReference = Readonly<{
	value: number;
	allowance: number;
	degree: 128;
	tailAllowance: number;
	arithmeticAllowance: number;
	absoluteTermSum: number;
	crosscheck: SkyAngularLobesEstimate;
	crosscheckDifference: number;
	crosscheckTolerance: number;
	admitted: boolean;
}>;
/** Every rule is compared against the same analytic manufactured integral. */
type SkyAngularLobesRule = Readonly<{
	id: SkyAngularLobesRuleId;
	estimate: SkyAngularLobesEstimate;
	error: SkySourceReconstructionValue;
}>;
/** Qualitative response checks are required only on the morning ray. */
type SkyAngularLobesRow = Readonly<{
	target: SkyVolumeJ2Target;
	cosine: number;
	reference: SkyAngularLobesReference;
	rules: Readonly<Record<SkyAngularLobesRuleId, SkyAngularLobesRule>>;
	responses: Readonly<{
		radial: SkySourceReconstructionValue;
		azimuth: SkySourceReconstructionValue;
		combined: SkySourceReconstructionValue;
		interaction: SkySourceReconstructionValue;
	}>;
	checks: Readonly<Record<string, SkySourceAuditState>>;
}>;
/** Ten fixed scientific predicates; unadmitted references cannot pass accuracy gates. */
type SkyAngularLobesResult = Readonly<{
	schemaId: 'sky-angular-lobes-v1';
	g: number;
	rows: readonly SkyAngularLobesRow[];
	predicates: readonly SkySourceAuditState[];
}>;
