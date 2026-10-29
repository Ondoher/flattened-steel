/**
 * Public registry contract implemented by the AppRouter application service.
 */
export interface AppRouter extends EventBus {
	/**
	 * Call this method to install application routes using the effective deployment paths.
	 *
	 * @param express - Express framework capability supplied by the host.
	 * @param router - Host-owned router receiving the application's routes.
	 * @param application - Polylith's effective deployment paths and mount.
	 */
	routes(express: unknown, router: unknown, application: FlatServerApplication): void;
}
