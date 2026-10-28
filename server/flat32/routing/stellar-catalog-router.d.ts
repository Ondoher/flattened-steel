/** Public HTTP contribution for stellar catalog assets. */
export interface StellarCatalogRouter extends EventBus {
	/** Install routes after app readiness. */ routes(
		expressApplication: unknown,
		router: Flat32HttpRouter,
		application: Flat32ServerApplication,
	): void;
}
