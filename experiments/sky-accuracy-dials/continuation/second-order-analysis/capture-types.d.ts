/** Fixed historical comparison, selected before the new refined physical reference. */
type SkySecondOrderDialSelection = Readonly<{
	/** Original registered case identity. */ caseId: string;
	/** Exact accepted run basename. */ runName: string;
	/** Original matched control, or null for H. */ controlCaseId: string | null;
	/** Original nonlinear reconstruction/operator grouping. */ representation: string;
}>;

/** One original field's complete, revalidated grouped order vector at a selected ray. */
type SkySecondOrderDialRow = Readonly<{
	/** Original frozen view address. */ probeId: string;
	/** Original benchmark time. */ time: string;
	/** Direct40 spectral index. */ channel: number;
	/** Original grouped N1-N4 fixed-field envelopes. */ envelopes: readonly SkyContinuationProbeDiagnostic[];
	/** N2-N1 under the original field's own reconstruction operator. */ secondOrderWatts: number;
	/** Sum of the original N1/N2 view-integration allowances; null when unresolved. */ allowanceWatts: number | null;
}>;

/** Authenticated historical control with explicit input/evidence ancestry. */
type SkySecondOrderDialCapture = Readonly<{
	/** Frozen matched comparison descriptor. */ selection: SkySecondOrderDialSelection;
	/** Consumed original terminal, controls and channel diagnostics. */ identities: readonly DialFileIdentity[];
	/** Actual original construction controls. */ controls: SkyControls;
	/** Actual original final J1 operator. */ finalFirstOrder: SkyContinuationFirstOrder;
	/** Actual original higher-order storage and reconstruction operator. */ higherRepresentation: SkyContinuationHigherRepresentation;
	/** Exact selected rays/channels with original allowances. */ rows: readonly SkySecondOrderDialRow[];
}>;
