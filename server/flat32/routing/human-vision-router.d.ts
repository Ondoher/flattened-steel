/** Public HTTP contribution for human-vision filter assets. */
export interface HumanVisionRouter extends EventBus {
	/** Install routes after app readiness. */ routes(
		expressApplication: unknown,
		router: Flat32HttpRouter,
		application: Flat32ServerApplication,
	): void;
}
