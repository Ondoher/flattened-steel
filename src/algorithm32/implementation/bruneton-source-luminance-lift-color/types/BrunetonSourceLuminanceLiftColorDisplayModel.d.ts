/** Validated curve facts retained by the source-luminance lift model. */
type AcceptedBrunetonSourceLuminanceLiftCurve = Readonly<{
	readonly brightThreshold: number;
	readonly darkThreshold: number;
	readonly minimumGamma: number;
	readonly maximumLuminanceGain: number;
}>;
