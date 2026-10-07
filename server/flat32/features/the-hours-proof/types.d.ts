/** Exact read-only capabilities for the production qualification asset feature. */
type TheHoursAssetServiceConfiguration = Readonly<{
	/** Authenticated declared parent artifacts. */ inputs: {path(relative: string): Promise<string>};
	/** Active run output path validation. */ run: {outputPath(relative: string): Promise<string>};
	/** Exact admitted ordinary production assets. */ assets: ReadonlyMap<string, string>;
}>;

/** Transport-neutral result of one authenticated asset read. */
type TheHoursAssetResponse = Readonly<{
	/** Complete ordinary-file content. */ bytes: Uint8Array;
	/** Declared browser media type. */ contentType: string;
}>;
