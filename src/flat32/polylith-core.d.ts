/** Shared event capability exposed by registered Polylith services. */
export class EventBus {}

/** Registry surface used by Flat32 service implementations and startup. */
export class Registry {
	/** Start every registered service and feature in dependency order. */
	start(): Promise<void>;
	/** Resolve one registered service by its public identifier. */
	subscribe(name: string): unknown;
	/** Attach an independent registry through the Polylith 1.3 handoff contract. */
	attach(relationship: string, peer: unknown): unknown;
	/** Read an explicitly attached registry. */
	getAttached(relationship: string): unknown;
}

/** Framework-owned client/package registry. */
export const registry: Registry;

/** Base class used to register one Flat32 application service. */
export class Service {
	/** Registry that owns this service and its dependencies. */
	readonly registry: typeof registry;
	/** Create and register one service under its public identifier. */
	constructor(name: string, overrideRegistry?: typeof registry);
	/** Publish the named implementation methods through the registered service object. */
	implement(names: readonly string[]): void;
}
