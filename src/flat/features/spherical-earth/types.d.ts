/**
 * Visible M1 states.
 * - **"missing-location"** - Shared location or timestamp is absent.
 * - **"loading"** - Real metadata/block preparation is pending.
 * - **"cache-ready"** - M1 cache proof complete; rendering belongs to M2.
 * - **"error"** - Data preparation failed and can be retried.
 */
type SphericalEarthPageStatus = 'missing-location' | 'loading' | 'cache-ready' | 'error';

/**
 * State published by the model-service for one workspace view.
 */
type SphericalEarthPageState = Readonly<{
	/**
	 * Current presentation phase.
	 */
	status: SphericalEarthPageStatus;
	/**
	 * Completed cache facts, absent until success.
	 */
	preparation: SphericalCachePreparation | null;
}>;

/**
 * Scoped controller/view state notification.
 */
type SphericalEarthStateChange = {viewId: string; state: SphericalEarthPageState};

/**
 * Controller capability exported by the owning implementation declaration.
 */
type SphericalEarthControllerService = import('./controller.js').SphericalEarthController;

/**
 * View capability exported by the owning implementation declaration.
 */
type SphericalEarthViewService = import('./views/spherical-earth.js').SphericalEarthView;

/**
 * State service capability exported by the owning implementation declaration.
 */
type SphericalEarthModelService = import('./models/spherical-earth-model.js').SphericalEarthModel;
