/** Explicit scene geometry supplied to the input-driven builder. */
/** Evidence capability extended with authenticated parent identities. */
interface BuilderRun extends CacheReuseRun {
	/** Parent artifact identities in read order. */ parents: Map<string, DistantSunSharedCacheFileIdentity>;
}
/** Explicit scene geometry supplied to the input-driven builder. */
type BuilderScene = {
	/** Caller-owned identity; duplicate requests remain distinct list entries. */ id: string;
	/** Observer solar zenith in degrees. */ zenithDegrees: number;
	/** Observer height above spherical ground in meters. */ observerAltitudeMeters: number;
	/** Optional source time label. */ time?: string;
	/** B1 fitted source azimuth in degrees for final view integration. */ fittedAzimuthDegrees?: number;
};
/** Shared coordinate inventory with retained production ledger records. */
type BuilderInventory = {
	/** Explicit current-compiler request. */ buildRequest: DistantSunSceneCacheCompilerBuildRequest;
	/** Input scenes and their ordered reconstruction maps. */ scenes: BuilderSceneInventory[];
	/** Sorted unique altitude/local-Sun-angle index pairs. */ coordinates: number[][];
	/** Bounded groups retaining the production 8x8 spatial grouping. */ blocks: BuilderBlock[];
	/** Little-endian logical-to-unique W27 direction map. */ directionBytes: Buffer;
	/** Number of seam-deduplicated directions. */ uniqueCount: number;
	/** Logical outgoing direction count. */ directionCount: number;
	/** Materialized spectral channel count. */ channelCount: number;
	/** Materialized indices into the complete input spectrum. */ wavelengths: number[];
	/** Compiler-only packed union projection; rows may have disjoint spans. */ unionLedger: DistantSunSceneCacheLedgerRecord;
};
/** One scene's logical expansion into the common inventory. */
type BuilderSceneInventory = {
	/** Position in the input list. */ ordinal: number;
	/** Original explicit scene request. */ request: BuilderScene;
	/** Production interpolation-closed scene ledger. */ ledger: DistantSunSceneCacheLedgerRecord;
	/** Coordinate keys retained for auditing. */ keys: string[];
	/** Ordered shared row indexes. */ indexes: number[];
};
/** Bounded shared block coordinates. */
type BuilderBlock = {
	/** Ordered altitude and local-Sun-angle pairs. */ coordinates: number[][];
};
/** Authenticated generic experimental cache package, independent of Native15-only production metadata. */
type BuilderPackage = {
	/** Format identity. */ schemaId: string;
	/** Full physical and numerical configuration. */ buildRequest: DistantSunSceneCacheCompilerBuildRequest;
	/** Indices of materialized spectral channels. */ wavelengths: number[];
	/** Materialized channel count. */ channelCount: number;
	/** Logical outgoing count. */ directionCount: number;
	/** Seam-deduplicated outgoing count. */ uniqueCount: number;
	/** Sorted unique physical sample index pairs. */ coordinates: number[][];
	/** Original scene requests and reconstruction maps. */ scenes: BuilderSceneInventory[];
	/** Encoded shared block identities and coordinate ownership. */ blocks: BuilderPackageBlock[];
	/** Logical-to-unique direction map identity. */ directionMap: DistantSunSharedCacheFileIdentity;
};
/** Complete reversible block identity. */
type BuilderPackageBlock = BuilderBlock & {
	/** Encoded artifact identity. */ artifact: DistantSunSharedCacheFileIdentity;
	/** Exact decoded byte count within the codec budget. */ decodedBytes: number;
	/** SHA-256 of decoded bytes. */ decodedSha256: string;
};
/** B1 numerical qualification summary with durable score and figure evidence. */
/** Bounded cache read and exact expansion capability. */
interface BuilderPackageReader {
	/** Call this method to persist one authenticated decode per block for repeated channel access. */
	prepare(run: BuilderRun, packet: BuilderPackage): Promise<void>;
	/** Call this method to authenticate and decode one spectral inventory. */
	readChannel(run: CacheReuseRun, packet: BuilderPackage, channel: number): Promise<Buffer>;
	/** Call this method to reconstruct a scene's logical values without scattering calculations. */
	expand(packet: BuilderPackage, sceneIndex: number, channel: Buffer, directions: Buffer): Float32Array;
}
/** B1 numerical qualification summary with durable score and figure evidence. */
type BuilderB1Result = {
	/** Whether all predeclared numerical gates pass. */ accepted: boolean;
	/** Number of individual radiances compared. */ comparedValues: number;
	/** Maximum absolute radiance difference in W m^-2 sr^-1 nm^-1. */ maximumAbsoluteWatts: number;
	/** RMS radiance difference in W m^-2 sr^-1 nm^-1. */ rmsWatts: number;
	/** Aggregate benchmark score difference in mW m^-2 sr^-1 nm^-1. */ scoreDifferenceMilliwatts: number;
};
