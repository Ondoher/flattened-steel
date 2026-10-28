/** Shared Polylith event API implemented by server services. */
type EventBus = import('@polylith/core').EventBus;

/** Polylith-owned deployment metadata consumed by Flat's page router. */
interface FlatServerApplication {
	/** Call this method to resolve the generated index in the active output directory.
	 * @returns - Absolute generated index filename.
	 */
	getIndexFile(): string;
	/** Call this method to read the effective application URL mount.
	 * @returns - Normalized URL mount.
	 */
	getRouterRoot(): string;
}

/** App-owned route capability installed after registry startup. */
interface FlatRouteContribution {
	/** Call this method to install routes on the host-provided app router.
	 * @param express - Host-owned Express application.
	 * @param router - App-scoped route collection.
	 * @param application - Polylith application with deployment metadata.
	 */
	routes(express: unknown, router: unknown, application: FlatServerApplication): void;
}
