/** Bounded profile selection/reference proof; memory points are not peak measurements. */
type LocalSunCompactProfileProofReport = Readonly<{
	/** All declared checks passed. */
	readonly status: 'PASSED';
	/** Independent complete physical position comparisons. */
	readonly coordinatesChecked: number;
	/** Frozen independent J1 scalar comparisons. */
	readonly primaryComparisons: number;
	/** Largest absolute physical J residual. */
	readonly maximumPrimaryError: number;
	/** Required ingress/accounting/support rejects observed. */
	readonly rejected: number;
	/** Explicit candidate construction policy. */
	readonly profileId: string;
	/** Identity of actual accepted executable facts. */
	readonly profileContentHash: string;
	/** Logical allocation arithmetic, not measured usage. */
	readonly estimate: LocalSunCompactResourceEstimate;
	/** Actual lazy J1 spectra sampled in this proof. */
	readonly primaryMemoSpectra: number;
	/** Wall-clock duration excluding process startup. */
	readonly elapsedMilliseconds: number;
	/** Free-memory preflight point. */
	readonly freeBeforeBytes: number;
	/** Post-proof process point, not peak usage. */
	readonly rssAfterBytes: number;
	/** Complete physical fields remain open. */
	readonly fullFieldsQualified: false;
	/** Ordinary numerical runtime consumers remain open. */
	readonly ordinaryRuntimeProfileQualified: false;
	/** Existing continuous source output retained exact values. */
	readonly continuousSourceUnchanged: true;
}>;
