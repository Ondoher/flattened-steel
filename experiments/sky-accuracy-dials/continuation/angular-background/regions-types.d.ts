/** Exact preceding attribution, without changing its numerical evaluator. */
type SkyAngularRegionsBaselineDocument = Readonly<{
	schemaId: 'sky-angular-background-v1';
	components: readonly SkyAngularBackgroundComponent[];
	responses: readonly SkyAngularBackgroundResponse[];
}>;
type SkyAngularRegionsBaseline = Readonly<{
	document: SkyAngularRegionsBaselineDocument;
	identities: readonly DialFileIdentity[];
}>;
/** Fixed smooth angular partition; these labels never select new quadrature nodes. */
type SkyAngularRegion = 'sun' | 'horizon' | 'other';
type SkyAngularRegionValues = Readonly<Record<SkyAngularRegion, SkySourceReconstructionValue>>;
/** Arithmetic-only budgets are distinct from the empirical incident uncertainties. */
type SkyAngularRegionArithmetic = Readonly<Record<SkyAngularRegion, number>>;
type SkyAngularRegionsComponent = SkyAngularBackgroundComponent &
	Readonly<{
		regions: SkyAngularRegionValues;
		arithmeticAllowances: SkyAngularRegionArithmetic;
		partitionTotal: SkySourceReconstructionValue;
		partitionResidual: number;
		partitionArithmeticAllowance: number;
	}>;
type SkyAngularRegionsResponse = SkyAngularBackgroundResponse &
	Readonly<{
		regions: SkyAngularRegionValues;
		arithmeticAllowances: SkyAngularRegionArithmetic;
		partitionTotal: SkySourceReconstructionValue;
		partitionResidual: number;
		partitionArithmeticAllowance: number;
		/** Null means this component/contrast had no registered predicate. */
		sunSameSign: SkySourceAuditState | null;
		sunAtLeastHalf: SkySourceAuditState | null;
		horizonAtMostTenth: SkySourceAuditState | null;
	}>;
type SkyAngularRegionsResult = Readonly<{
	components: readonly SkyAngularRegionsComponent[];
	responses: readonly SkyAngularRegionsResponse[];
	/** Exactly fourteen original total-component tests, preserving failures/nonresolution. */
	predicates: readonly SkySourceAuditState[];
}>;
