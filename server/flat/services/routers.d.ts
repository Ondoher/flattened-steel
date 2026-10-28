/** Public registry contract implemented by the RoutersService application service. */
export interface RoutersService extends EventBus {
	/**
	 * Call this method to register or update a page record.
	 *
	 * @param name - The name value required by this operation.
	 */
	add(name: string): void;
	/**
	 * Call this method to invoke the setLast service operation.
	 *
	 * @param name - The name value required by this operation.
	 */
	setLast(name: string): void;
	/**
	 * Call this method to read the current service value.
	 *
	 * @returns - The get operation result.
	 */
	get(): string[];
}
