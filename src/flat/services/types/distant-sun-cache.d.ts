/**
 * Actual package/block preparation facts, independent of scene readiness.
 */
type SphericalCachePreparation = Readonly<{
	/**
	 * Intentional package darkness.
	 */
	dark: boolean;
	/**
	 * Selected content identity.
	 */
	packageIdentity: string;
	/**
	 * Decoded proof block, absent for intentional darkness.
	 */
	blockId: string | null;
	/**
	 * Actual complete decoded packet bytes.
	 */
	packetBytes: number;
	/**
	 * Full scene block requirement; M1 decodes only one proof block.
	 */
	requiredBlocks: number;
}>;

/**
 * Shared accepted metadata, retained once per application lifetime.
 */
type SphericalCachePackageFacts = {
	/**
	 * Authenticated block addressing.
	 */
	source: DistantSunSharedCachePackageSource;
	/**
	 * Privately owned metadata used without revalidation.
	 */
	graph: DistantSunSharedCachePackageGraph;
};

/**
 * App cache capability declared by its own service.
 */
type DistantSunCacheService = import('../distant-sun-cache.js').DistantSunCacheService;
