/** Public authenticated cache capability; unavailable startup is reported separately. */
export interface SharedCacheService extends EventBus {
	/** Whether the selected package is authenticated and available. */
	isAvailable(): boolean;
	/** Resolve a valid solar-zenith input; invalid input or unavailable state throws. */
	resolve(degrees: number, assetBaseUrl: string): Flat32DistantSunCacheResolution;
	/** Read one complete authenticated artifact; invalid paths and I/O failures reject. */
	resolveAsset(name: string): Promise<SharedCacheServedArtifact>;
	/** Release package references; repeated calls are harmless. */
	stop(): void;
}
