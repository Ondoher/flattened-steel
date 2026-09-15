/** Retrospective lower bound for a fixed measurement and nonnegative later physical orders. */
type SkyPositiveOrderBoundRow = Readonly<{
	probeId: string;
	channel: number;
	physicalFirstWatts: number;
	physicalSecondWatts: number;
	recoveredMeasurementWatts: number;
	firstTwoResidualWatts: number;
	firstAllowanceWatts: number | null;
	secondAllowanceWatts: number | null;
	roundoffAllowanceWatts: number;
	lowerResidualWatts: number | null;
	minimumSquaredResidual: number | null;
	requiredUpwardMeasurementShiftWatts: number | null;
	requiredUpwardMeasurementShiftFraction: number | null;
	frozenThirdFourthWatts: number;
	residualWithFrozenThirdFourthWatts: number;
	state: 'positive-lower-bound' | 'no-positive-bound' | 'unresolved';
}>;

/** Validated reference consumer retains original complete outer/angular gates. */
type SkyPositiveOrderBoundParent = Readonly<{
	probeId: SkySecondOrderProbeId;
	identities: readonly DialFileIdentity[];
	rows: readonly SkyPositiveOrderBoundRow[];
	reference: SkySecondOrderReferenceAssessment;
}>;
