/**
 * Public registry contract implemented by the RoutersService application service.
 */
export interface RoutersService extends EventBus {
	/**
	 * Call this method to register an application router in mounting order.
	 *
	 * @param name - Registry service name of the router to mount.
	 */
	add(name: string): void;

	/**
	 * Call this method to select the router mounted after every ordinary router.
	 *
	 * @param name - Registered router service that handles remaining requests last.
	 */
	setLast(name: string): void;

	/**
	 * Call this method to read router service names in mounting order.
	 *
	 * @returns - Router service names, with the designated final router last.
	 */
	get(): string[];
}
