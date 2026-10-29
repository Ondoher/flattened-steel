/**
 * Public registry contract implemented by the IoService application service.
 */
interface IoService extends EventBus {
	/**
	 * Call this method to request a resource using application-relative API routing when appropriate.
	 *
	 * @param url - Application-relative API path or absolute external resource URL.
	 * @param options - Optional fetch settings and request-specific headers.
	 * @returns - HTTP response, or null after a logged transport failure.
	 */
	request(url: string, options?: RequestInit): Promise<Response | null>;
}
