/** Native-15 linear-sRGB projection weights grouped by display channel. */
type BrunetonLinearSrgbChannelWeights = {
	/** Red-channel projection weight for each native spectral channel. */
	readonly r: readonly number[];
	/** Green-channel projection weight for each native spectral channel. */
	readonly g: readonly number[];
	/** Blue-channel projection weight for each native spectral channel. */
	readonly b: readonly number[];
};
