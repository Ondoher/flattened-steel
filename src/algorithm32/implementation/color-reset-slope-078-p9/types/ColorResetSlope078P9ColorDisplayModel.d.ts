/** Fixed accepted slope-078/p9 response constants. */
type ColorResetSlope078P9Curve = Readonly<{
	readonly sunsetAmplitude: number;
	readonly sunsetTransitionIlluminanceLux: number;
	readonly sunsetRolloffPower: number;
	readonly adaptationPivotIlluminanceLux: number;
	readonly adaptationFloorIlluminanceLux: number;
	readonly adaptationSoftnessLogUnits: number;
	readonly adaptationExponent: number;
}>;
