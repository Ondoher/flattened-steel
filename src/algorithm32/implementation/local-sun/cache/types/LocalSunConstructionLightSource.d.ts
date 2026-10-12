/** Continuous direct-light metadata consumed by J1 construction. */
type LocalSunContinuousDirectLightingMetadata = Readonly<{
	/** Normalized physical source distance. */
	readonly distanceFromSource: Distance;
	/** Continuous incident scale. */
	readonly incidentScale: number;
}> &
	Readonly<Record<string, unknown>>;

/** Object-checked collaborator metadata; each consumed physical field is validated before narrowing. */
type LocalSunConstructionMetadataIngress = Readonly<Record<string, unknown>>;
