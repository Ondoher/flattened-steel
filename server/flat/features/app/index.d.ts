/** Public registry contract implemented by the AppRouter application service. */
export interface AppRouter extends EventBus {
	/**
	 * Call this method to invoke the routes service operation.
	 *
	 * @param express - The express value required by this operation.
	 * @param router - The router value required by this operation.
	 * @param application - Polylith's effective deployment paths and mount.
	 */
	routes(express: unknown, router: unknown, application: FlatServerApplication): void;
}
