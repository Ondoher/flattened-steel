/** Inputs explicitly admitted by the production GPU proof owner. */
type ProductionGpuAssetConfiguration = Readonly<{
	/** Module-derived absolute repository root. */ repositoryRoot: string;
	/** Ordinary module and authenticated cache directories, ending with a slash. */ allowedDirectories: readonly string[];
}>;
/** Complete read-only proof asset with its browser media type. */
type ProductionGpuAssetResponse = Readonly<{
	/** Exact file bytes. */ bytes: Uint8Array;
	/** Media type selected by the asset owner. */ contentType: string;
}>;
