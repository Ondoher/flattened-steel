/** Public registry contract implemented by the Flat32 HTTP service. */
interface Flat32IoService extends EventBus {
	/**
	 * Call this method to execute one application request and parse its JSON response.
	 * Invalid requests or locale state, cancellation, transport failures, non-success HTTP status, and malformed JSON
	 * reject the promise; callers must stop the feature continuation and apply its own recovery policy.
	 *
	 * @param request - Method, route, optional feature data, and cancellation signal.
	 * @returns - Parsed JSON response value.
	 */
	requestJson(request: Flat32IoJsonRequest): Promise<unknown>;
}
