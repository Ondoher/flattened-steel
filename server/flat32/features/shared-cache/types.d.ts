/** One fully authenticated immutable response body owned by the shared-cache feature. */
type SharedCacheServedArtifact = {
	/** Complete file bytes; partial responses are unsupported. */ bytes: Buffer;
	/** Exact byte length authenticated against the manifest. */ byteLength: number;
	/** Content type selected from the admitted artifact path. */ contentType: string;
};
