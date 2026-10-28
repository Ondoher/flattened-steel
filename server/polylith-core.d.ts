/** Event capability exposed by implemented Polylith service methods. */
export class EventBus {
	/** Register an event listener and return its identity. */
	listen(event: string, listener: (...values: unknown[]) => void): string;
	/** Remove the listener identified by its registration result. */
	unlisten(event: string, identity: string): void;
	/** Publish an event to the current listeners. */
	fire(event: string, ...values: unknown[]): void;
}

/** External registry contract used by server-owned composition. */
export class Registry {
	/** Attach an independent peer registry under its explicit relationship. */
	attach(relationship: string, attachedRegistry: unknown): unknown;
	/** Read an explicitly attached peer without merging its services. */
	getAttached(relationship: string): unknown;
	/** Initialize local services and their readiness phase. */
	start(): Promise<void>;
	/** Resolve a registered public service capability. */
	subscribe(name: string): unknown;
}

/** Framework-owned package registry used by repository setup. */
export const registry: Registry;

/** Base class registering a capability in an explicit owner registry. */
export class Service extends EventBus {
	/** Owning application registry. */
	readonly registry: Registry;
	/** Creates a registered service using the supplied framework registry. */
	constructor(name: string, ownerRegistry?: unknown);
	/** Publish the named implementation methods. */
	implement(methods: readonly string[]): void;
}
