/** Public HTTP contribution for distant-Sun selection and authenticated assets. */
export interface SharedCacheRouter extends EventBus {
	/** Install routes after app readiness. */ routes(
		expressApplication: unknown,
		router: Flat32HttpRouter,
		application: Flat32ServerApplication,
	): void;
}
