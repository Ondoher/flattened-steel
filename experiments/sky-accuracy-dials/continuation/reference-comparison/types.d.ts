/** One matched benchmark spectrum with its region selectors. */
type SkyReferenceRow = Readonly<{
	/** Capture time. */ time: string;
	/** Canonical x coordinate. */ x: number;
	/** Canonical y coordinate. */ y: number;
	/** Elevation above horizon. */ elevation: number;
	/** Angular separation from fitted Sun. */ separation: number;
	/** Original 40-channel measurements. */ measured: readonly number[];
	/** Named 40-channel model predictions. */ models: Readonly<Record<string, readonly number[]>>;
}>;
/** Exact decomposition with marginal direct-reference sampling uncertainty. */
type SkyReferenceBalance = Readonly<{
	/** Baseline-minus-direct approximation difference. */ numerical: number;
	/** Direct-minus-measured residual. */ physicalResidual: number;
	/** Baseline-minus-measured scored residual. */ residual: number;
	/** Signed SSE cross term in spectral W squared. */ crossTerm: number;
	/** Direct squared error minus baseline squared error; positive favors baseline. */ benefit: number;
	/** Opposing signs survive the direct sampling interval. */ robustOpposition: boolean;
	/** Baseline improvement survives the direct sampling interval. */ robustBenefit: boolean;
	/** Baseline worsening survives the direct sampling interval. */ robustHarm: boolean;
}>;
/** Descriptive residual relationship on identical measured samples. */
type SkyReferenceRelationship = Readonly<{
	/** Pearson correlation; null for a constant residual vector. */ correlation: number | null;
	/** Same-sign residual count above the fixed floor. */ sameSign: number;
	/** Eligible residual-pair count above the fixed floor. */ eligible: number;
	/** RMS prediction difference, independent of measurement subtraction, in mW. */ modelDifferenceRmsMw: number;
}>;
/** Per-model signed and squared residual summary. */
type SkyReferenceModelSummary = Readonly<{
	/** Equal-weight spectral RMSE, mW. */ rmseMw: number;
	/** Signed average model-minus-measured radiance, mW. */ meanMw: number;
	/** Relationship to the arithmetic mean of the two reference residuals. */ vsShared: SkyReferenceRelationship;
}>;
/** Same-sample regional comparison; no claim of physical truth for the reference mean. */
type SkyReferenceSummary = Readonly<{
	/** Number of directional spectra. */ rays: number;
	/** Number of scored scalar wavelengths. */ count: number;
	/** Summaries keyed by retained model identity. */ models: Readonly<Record<string, SkyReferenceModelSummary>>;
	/** Agreement between Bruneton and libRadtran. */ referenceAgreement: SkyReferenceRelationship;
}>;
