/**
 * Complete immutable response bytes authenticated by a package owner.
 */
type SharedCacheServedArtifact = {
	/**
	 * Complete file bytes; partial responses are unsupported.
	 */
	bytes: Buffer;
	/**
	 * Exact manifest byte length.
	 */
	byteLength: number;
	/**
	 * Media type derived from the admitted artifact name.
	 */
	contentType: string;
};

/**
 * Neutral package implementation consumed by registered application wrappers.
 */
type DistantSunSharedCachePackageService = import('./DistantSunSharedCachePackageService.js').default;

/**
 * Flat's registered cache capability.
 */
type FlatSphericalCacheService = import('../flat/features/spherical-earth-cache/cache.js').FlatSphericalCacheService;

/**
 * Express request confined to the Flat HTTP boundary.
 */
type FlatExpressRequest = import('express').Request;
/**
 * Shared event capability supplied by registry services.
 */
type EventBus = import('@polylith/core').EventBus;

/**
 * Installation context supplied to repository deployment setup.
 */
type DeploymentContext = {
	/**
	 * Host-owned registry shared across selected applications.
	 */
	sharedRegistry: ServerRegistry;
};

/**
 * Registry capabilities consumed by server composition.
 */
type ServerRegistry = {
	/**
	 * Call this method to initialize registered services and complete readiness.
	 *
	 * @returns - Completed registry startup.
	 */
	start(): Promise<unknown>;
};
