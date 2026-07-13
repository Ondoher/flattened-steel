/** Executable normalized source facts used to derive shell values. */
type LocalSunShellExecutableSourceFacts = Readonly<{
	/** Physical source position. */
	readonly position: Position;
	/** Inverse-square reference distance. */
	readonly referenceDistance: Distance;
	/** Neutral spectral scale at the reference distance. */
	readonly referenceSpectralIncidentScale: number;
	/** Finite source radius. */
	readonly radius: Distance;
	/** Inverse-square falloff state. */
	readonly distanceFalloff: boolean;
}>;

/** Executable whole-flat-world source-distance domain facts. */
type LocalSunShellExecutableDomain = Readonly<{
	/** Minimum represented source distance. */
	readonly minimumDistance: Distance;
	/** Maximum represented source distance. */
	readonly maximumDistance: Distance;
	/** Source horizontal offset. */
	readonly horizontalOffset: Distance;
	/** Source height. */
	readonly sourceHeight: Distance;
	/** Flat-world map radius. */
	readonly mapRadius: Distance;
	/** Atmosphere apex. */
	readonly atmosphereApex: Distance;
}>;
