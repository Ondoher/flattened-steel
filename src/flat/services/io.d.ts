/** Public registry contract implemented by the IoService application service. */
interface IoService extends EventBus {
	/**
	 * Call this method to invoke the request service operation.
	 *
	 * @param url - The url value required by this operation.
	 * @param options - The options value required by this operation.
	 * @returns - The request operation result.
	 */
	request(url: string, options?: RequestInit): Promise<Response | null>;
}
