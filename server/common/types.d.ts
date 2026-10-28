/** Shared event capability supplied by registry services. */
type EventBus = import('@polylith/core').EventBus;

/** Installation context supplied to repository deployment setup. */
type DeploymentContext = {
	/** Host-owned registry, shared across the selected repositories and apps. */
	sharedRegistry: ServerRegistry;
};

/** Registry capabilities consumed by server composition. */
type ServerRegistry = {
	/** Initialize registered services and complete their readiness phase. */
	start(): Promise<unknown>;
};
