/** Exact two-condition component-reference domain. */
type SkySecondOrderProbeId = 'p-0930-5-7' | 'p-1230-3-5';
/** Original morning scope or explicitly admitted registered noon transfer. */
type SkySecondOrderCondition = Readonly<{
	probeId: SkySecondOrderProbeId;
	time: '09:30' | '12:30';
	transferPlan: DialFileIdentity | null;
	transferBytes: Uint8Array | null;
	admissionRun: string | null;
	identities: readonly DialFileIdentity[];
}>;
/** Conditional admission consumes the sealed morning numerical reference. */
type SkySecondOrderTransferAdmissionDocument = SkySecondOrderReferenceAssessment & Readonly<{schemaId: string}>;
/** Exact component and score predictions for the second physical condition. */
type SkySecondOrderTransferOutcome = Readonly<{
	probeId: string;
	channel: number;
	referenceAdequate: boolean;
	replacement: SkySecondOrderReplacement;
	correctionAllowanceWatts: number | null;
	beforeResidualAllowanceWatts: number | null;
	scoreAllowanceWattsSquared: number | null;
	referenceBelowH: SkyVolumeCheckState;
	negativeResidual: SkyVolumeCheckState;
	scoreWorsens: SkyVolumeCheckState;
}>;

/** Narrow accepted terminal surface consumed by conditional admission. */
type SkySecondOrderTransferTerminal = Readonly<{result: Readonly<{referenceAdequate: boolean}>}>;
