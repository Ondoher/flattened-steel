/** Smooth achromatic luminance-lift curve selected by the contained Color evidence. */
type BrunetonSourceLuminanceLiftCurve = Readonly<{
	/** Source-derived luminance at and above which Bruneton remains exact. */
	readonly brightThreshold: number;
	/** Source-derived luminance at and below which the minimum gamma applies. */
	readonly darkThreshold: number;
	/** Smallest positive achromatic luminance gamma. */
	readonly minimumGamma: number;
	/** Largest finite common RGB gain. */
	readonly maximumLuminanceGain: number;
}>;

/** Optional construction values for the Bruneton source-luminance lift model. */
type BrunetonSourceLuminanceLiftColorDisplayModelConfiguration = BrunetonColorDisplayModelConfiguration &
	Readonly<{
		/** Qualified curve supplied instead of the selected production curve. */
		readonly luminanceLiftCurve?: BrunetonSourceLuminanceLiftCurve;
	}>;
