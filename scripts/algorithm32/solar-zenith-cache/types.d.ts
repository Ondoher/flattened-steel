/** Exact scene and support supplied to the offline distant-Sun cache compiler. */
type DistantSunSceneCacheCompilerScene = Readonly<{
	/** Exact scene Sun state. */
	readonly sceneSun: DistantSunSceneSunIdentity;
	/** Fixed scene support closed by the ledger. */
	readonly support: DistantSunSceneCacheSupport;
}>;

/** Complete normalized input set for one offline distant-Sun scene-cache build. */
type DistantSunSceneCacheCompilerInputSet = Readonly<{
	/** Stable production compiler identity. */
	readonly compilerIdentity: string;
	/** Complete numerical compatibility identity. */
	readonly numericalIdentity: string;
	/** Exact scene and support. */
	readonly scene: DistantSunSceneCacheCompilerScene;
	/** Executable packed-row ledger. */
	readonly ledger: DistantSunSceneCacheLedger;
	/** Browser-GPU recurrence request. */
	readonly buildRequest: Readonly<Record<string, unknown>>;
}>;
