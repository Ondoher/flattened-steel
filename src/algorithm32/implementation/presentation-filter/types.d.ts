/** Optional authenticated local inputs borrowed while the ordered filter registry is created. */
type ViewPresentationFilterRegistryConfiguration = Readonly<{
	/** Optional authenticated Native15 scotopic weights, copied by the registry; omission leaves mesopic stellar filtering unavailable. */
	readonly scotopicLuminanceWeights?: ArrayLike<number>;
}>;

/** Immutable source-linear stellar hook owned by its selected presentation-filter registry. */
type ViewPresentationStellarSourceLinearShaderHook = Readonly<{
	/** Stable hook implementation identifier. */
	readonly id: string;
	/** Identity of the exact selected ordered filter registry. */
	readonly registryIdentity: string;
	/** Identity of authenticated scotopic weights, or null when no weights were supplied. */
	readonly scotopicWeightsIdentity: string | null;
	/** Source-linear application stage, before ordinary display projection. */
	readonly stage: 'source-linear';
	/** Stellar source target for this hook. */
	readonly target: 'stellar';
	/** Complete GLSL hook source consumed by the stellar producer. */
	readonly source: string;
}>;

/** Ordered presentation-filter capability and immutable executable identities. */
interface ViewPresentationFilterRegistry {
	/** Stable registry implementation identifier. */
	readonly id: string;
	/** Identity of the selected filter order, settings and authenticated local data. */
	readonly identity: string;
	/** Whether any selected registered filter is enabled. */
	readonly enabled: boolean;
	/** Accepted immutable filter selections in execution order. */
	readonly filters: readonly Readonly<Record<string, unknown>>[];
	/** Call this method to contribute the selected hook and live adaptation scalar. */
	createShaderContribution(): ShaderContribution;
	/** Call this method to expose the immutable stellar source-linear hook. */
	createStellarSourceLinearShaderHook(): ViewPresentationStellarSourceLinearShaderHook;
}
