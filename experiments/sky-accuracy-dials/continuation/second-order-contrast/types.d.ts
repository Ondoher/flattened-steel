/** Shared-reference absolute-error contrast with a conservative interval for control/candidate uncertainty. */
type SkySecondOrderSharedContrast = Readonly<{
	/** Absolute control error minus absolute candidate error at the supplied central reference. */ reductionWatts: number;
	/** Lower bound over the shared reference interval and both field allowances. */ minimumReductionWatts: number;
	/** Upper bound over the shared reference interval and both field allowances. */ maximumReductionWatts: number;
	/** Whether the entire admitted interval proves a numerical improvement or regression. */ direction:
		'improved' | 'regressed' | 'unresolved';
	/** Reference breakpoints used to calculate the exact piecewise-linear extrema. */ referenceWitnessesWatts: readonly number[];
}>;
