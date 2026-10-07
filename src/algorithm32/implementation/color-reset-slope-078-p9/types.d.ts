/** Public response constants shared by the versioned slope-078 models. */
type ColorResetSlope078Curve = Readonly<{
	/** Maximum additional sunset gain. */
	readonly sunsetAmplitude: number;
	/** Receiver illuminance at the sunset transition, in lux. */
	readonly sunsetTransitionIlluminanceLux: number;
	/** Dimensionless sunset rolloff exponent selected by the model version. */
	readonly sunsetRolloffPower: number;
	/** Adaptation pivot receiver illuminance, in lux. */
	readonly adaptationPivotIlluminanceLux: number;
	/** Positive dark adaptation floor, in lux. */
	readonly adaptationFloorIlluminanceLux: number;
	/** Dimensionless logarithmic transition softness. */
	readonly adaptationSoftnessLogUnits: number;
	/** Dimensionless low-light adaptation exponent. */
	readonly adaptationExponent: number;
}>;

/** Inherited Bruneton display and presentation-filter configuration. */
type ColorResetSlope078P9ColorDisplayModelConfiguration = BrunetonColorDisplayModelConfiguration;
