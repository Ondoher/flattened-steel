/** Continuous direct-light metadata consumed by J1 construction. */
type LocalSunContinuousDirectLightingMetadata = Readonly<{
	/** Normalized physical source distance. */
	readonly distanceFromSource: Distance;
	/** Continuous incident scale. */
	readonly incidentScale: number;
}> &
	Readonly<Record<string, unknown>>;
