/** Consistent JSON response encoding at the app's HTTP boundary. */
export const HttpResponse = {
	/** Call this method to report an opaque unexpected HTTP failure.
	 *
	 * @param {Flat32HttpResponse} response - Host-owned response.
	 * @param {unknown} error - Failure retained only in server diagnostics.
	 * @param {string} message - Stable public failure description.
	 * @returns {void} - Failure sent or partially transmitted connection closed.
	 */
	failure(response, error, message) {
		console.error(message, error);
		if (response.headersSent) response.destroy();
		else this.json(response, 500, {error: message});
	},

	/** Call this method to pipe an admitted stream and release it on response closure.
	 * Stream failures are logged and reported without exposing private paths.
	 *
	 * @param {Flat32HttpResponse} response - Host-owned response.
	 * @param {Flat32ServedStream} asset - Feature-owned stream and content facts.
	 * @param {string} cacheControl - Response cache policy.
	 * @param {string} failureMessage - Stable public failure description.
	 * @returns {void} - Stream connected to the response.
	 */
	stream(response, asset, cacheControl, failureMessage) {
		response.status(200).set({
			'cache-control': cacheControl,
			'content-length': String(asset.byteLength),
			'content-type': asset.contentType,
		});
		response.once('close', () => asset.stream.destroy());
		asset.stream.once('error', (error) => this.failure(response, error, failureMessage));
		asset.stream.pipe(response);
	},

	/** Call this method to send a JSON response with explicit cache policy.
	 *
	 * @param {Flat32HttpResponse} response - Host-owned response.
	 * @param {number} status - HTTP status code.
	 * @param {unknown} value - Serializable response data.
	 * @param {string} [cacheControl] - Response cache policy.
	 * @returns {void} - Response sent.
	 */
	json(response, status, value, cacheControl = 'no-store') {
		response
			.status(status)
			.set({'cache-control': cacheControl, 'content-type': 'application/json; charset=utf-8'})
			.send(`${JSON.stringify(value)}\n`);
	},
};
