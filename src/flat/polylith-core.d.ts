/**
 * Existing runtime exports; the package does not currently ship event declarations.
 */
export {registry, Registry} from '../../node_modules/@polylith/core/index.js';

/**
 * Registered service base supplied by the existing untyped runtime package.
 */
export class Service extends EventBus {
	/**
	 * Creates a named service in the supplied registry or the application registry.
	 *
	 * @param name - Service registration name.
	 * @param registry - Optional owning registry.
	 */
	constructor(name: string, registry?: unknown);

	/**
	 * Registry selected by the runtime constructor.
	 */
	registry: typeof import('../../node_modules/@polylith/core/index.js').registry;

	/**
	 * Call this method to publish bound methods on the registered service object.
	 *
	 * @param names - Implemented public method names.
	 */
	implement(names: string[]): void;
}

/**
 * Actual event capability exposed by registered Polylith services.
 */
export class EventBus {
	/**
	 * Call this method to register a callback for a named event.
	 *
	 * @param event - Event name observed by the listener.
	 * @param listener - Callback receiving the event's published values.
	 * @returns - Exact listener identity required for removal.
	 */
	listen(event: string, listener: (...values: unknown[]) => void): string;

	/**
	 * Call this method to remove an exact listener from its named event.
	 *
	 * @param event - Event name used when registering the listener.
	 * @param listenerId - Original listener identity to remove.
	 */
	unlisten(event: string, listenerId: string): void;

	/**
	 * Call this method to publish values to the current listeners of a named event.
	 *
	 * @param event - Event name receiving the publication.
	 * @param values - Values delivered to the registered listeners.
	 * @returns - Result supplied by the runtime event implementation.
	 */
	fire(event: string, ...values: unknown[]): unknown;
}
