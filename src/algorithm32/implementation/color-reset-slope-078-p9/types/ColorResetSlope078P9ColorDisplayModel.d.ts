/** Internal adaptation state used by the slope-078 gain equation. */
type ColorResetSlope078AdaptationState = Readonly<{
	/** Multiplicative dark-adaptation gain. */
	readonly factor: number;
	/** Logistic activation used by the analytic gain derivative. */
	readonly activation: number;
}>;
