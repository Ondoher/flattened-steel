/** Public human-vision filter package capability. */
export interface HumanVisionService extends EventBus {
	/** Whether package initialization succeeded. */ isAvailable(): boolean;
	/** Open an ordinary file; unavailable, invalid and failed reads reject or emit stream errors. */ openAsset(
		relativePath: string,
	): Promise<Flat32ServedStream>;
	/** Release retained package references; repeated calls are harmless. */ stop(): void;
}
