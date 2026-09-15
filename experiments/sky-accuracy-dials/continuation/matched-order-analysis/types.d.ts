/** Authenticated original attribution and actual matched H cumulative stages. */
type SkyMatchedOrderAssessmentInput = Readonly<{
	/** Every consumed immutable parent, including the captured prospective plan. */ identities: readonly DialFileIdentity[];
	/** Original P1 replacement decomposition, unchanged. */ original: readonly SkyOrderAttributionRow[];
	/** Complete channels zero/eight, all original probes, six actual orders. */ diagnostics: readonly SkyMatchedOrderDiagnostics[];
}>;
/** Frozen additive residual intervention, with numerical integration allowances only. */
type SkyMatchedOrderResidualChange = Readonly<{
	beforeResidualWatts: number;
	afterResidualWatts: number;
	additionWatts: number;
	beforeAllowanceWatts: number | null;
	afterAllowanceWatts: number | null;
	additionAllowanceWatts: number | null;
	linearSseTermWattsSquared: number;
	quadraticSseTermWattsSquared: number;
	deltaSseWattsSquared: number;
	deltaSseAllowanceWattsSquared: number | null;
	sseIdentityResidualWattsSquared: number;
}>;
/** One selected original scalar and two descriptive frozen-tail interventions. */
type SkyMatchedOrderAssessmentRow = Readonly<{
	probeId: string;
	time: string;
	channel: number;
	original: SkyOrderAttributionRow;
	/** Actual grouped reference-envelope N1 through N6, retaining original N4. */ cumulativeWatts: readonly number[];
	cumulativeAllowancesWatts: readonly (number | null)[];
	fifthIncrementWatts: number;
	sixthIncrementWatts: number;
	fifthAllowanceWatts: number | null;
	sixthAllowanceWatts: number | null;
	finiteAdditionWatts: number;
	finiteAdditionAllowanceWatts: number | null;
	firstCorrectionWatts: number;
	firstCorrectionAllowanceWatts: number | null;
	raw: SkyMatchedOrderResidualChange;
	physicalFirstOnly: SkyMatchedOrderResidualChange;
	/** 2 * P1 correction * finite addition; a baseline-dependent SSE cross term. */ baselineSensitivityWattsSquared: number;
	baselineSensitivityAllowanceWattsSquared: number | null;
	baselineIdentityResidualWattsSquared: number;
	/** Original first-error compensation term, before/after the same frozen addition. */ firstErrorCrossBeforeWattsSquared: number;
	firstErrorCrossAfterWattsSquared: number;
}>;
/** Deliberately descriptive four-scalar evidence; physical P2 remains caller-owned. */
type SkyMatchedOrderAssessment = Readonly<{
	schemaId: 'sky-matched-h-order-assessment-v1';
	units: 'W m^-2 sr^-1 nm^-1';
	rows: readonly SkyMatchedOrderAssessmentRow[];
	sums: Readonly<{
		rawDeltaSseWattsSquared: number;
		physicalFirstOnlyDeltaSseWattsSquared: number;
		baselineSensitivityWattsSquared: number;
	}>;
	physicalSubstitution: Readonly<{state: 'unresolved'; physicalSecondWatts: null; reason: string}>;
	limitations: readonly string[];
}>;
/** Local algebra, allowance and invalid-input checks without physical computation. */
type SkyMatchedOrderAssessmentProof = Readonly<{schemaId: string; checks: number}>;
/** Optional independently derived prospective prediction, retained before its target capture. */
type SkyMatchedOrderAssessmentExtension = Readonly<{
	/** Authenticated original controls and prospective plan. */ parents: readonly DialFileIdentity[];
	/** New local artifact name, e.g. p55-prediction.json. */ name: string;
	/** Pure result constructed from the authenticated inputs. */ value: unknown;
	/** Exact mathematical derivation. */ operation: string;
}>;
