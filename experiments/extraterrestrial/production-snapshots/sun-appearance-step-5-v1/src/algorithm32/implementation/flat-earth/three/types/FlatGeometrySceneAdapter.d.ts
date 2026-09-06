/** Raw three-component vector used only by flat scene adaptation. */
type FlatRawVector3 = readonly [number, number, number];

/** Minimal Three camera packet used while resolving flat scene depth. */
type FlatThreeCameraCandidate = Readonly<{
	/** Optional Three position value. */
	readonly position?: unknown;
}>;
