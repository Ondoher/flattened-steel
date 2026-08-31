/** Definition of one uniform cell-center local-solar-zenith domain. */
type SolarZenithDomainDefinition = Readonly<{
	/** Unique executable domain identity. */
	readonly id: string;
	/** Number of ordered cell centers. */
	readonly count: number;
	/** First local-solar-zenith cell center. */
	readonly firstCenter: Angle;
	/** Angular spacing between adjacent cell centers. */
	readonly spacing: Angle;
}>;

/** One ordered local-solar-zenith node. */
type SolarZenithNode = Readonly<{
	/** Zero-based node index. */
	readonly index: number;
	/** Local-solar-zenith angle. */
	readonly angle: Angle;
	/** Cosine of the local-solar-zenith angle. */
	readonly muS: number;
}>;

/** Weighted interpolation stencil in a local-solar-zenith domain. */
type SolarZenithStencil = Readonly<{
	/** One or two ordered node indices. */
	readonly indices: readonly number[];
	/** Normalized interpolation weights corresponding to the indices. */
	readonly weights: readonly number[];
}>;

/** Executable local-solar-zenith interpolation domain. */
interface SolarZenithDomain {
	/** Unique executable domain identity. */
	readonly id: string;
	/** Number of ordered nodes. */
	readonly count: number;
	/** First cell-center angle. */
	readonly firstCenter: Angle;
	/** Angular spacing between nodes. */
	readonly spacing: Angle;
	/** Ordered executable nodes. */
	readonly nodes: readonly SolarZenithNode[];
	/**
	 * Call this method to resolve a physical local-solar-zenith angle.
	 * @param angle - The local-solar-zenith angle.
	 * @returns - The normalized interpolation stencil.
	 */
	resolveStencil(angle: Angle): SolarZenithStencil;
}
