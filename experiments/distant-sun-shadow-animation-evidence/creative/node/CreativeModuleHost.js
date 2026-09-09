import {createServer} from 'node:http';

/** Read-only loopback host for a frozen explicit set of browser modules. */
export const CreativeModuleHost = {
	/**
	 * Call this method to host only the supplied module snapshots on an ephemeral loopback port.
	 * Cross-origin access is limited to the production application on port 8081.
	 *
	 * @param {ReadonlyMap<string, Uint8Array>} modules - Exact URL paths and frozen input bytes.
	 * @returns {Promise<CreativeNodeModuleHost>} - Bound origin and owned shutdown operation.
	 */
	async start(modules) {
		const allowedOrigins = new Set(['http://127.0.0.1:8081', 'http://localhost:8081']);
		const server = createServer((request, response) => {
			const origin = request.headers.origin;
			response.setHeader('cache-control', 'no-store');
			response.setHeader('x-content-type-options', 'nosniff');
			if (origin && !allowedOrigins.has(origin)) {
				response.writeHead(403);
				response.end();
				return;
			}
			if (origin) {
				response.setHeader('access-control-allow-origin', origin);
				response.setHeader('vary', 'Origin');
			}
			if (request.method !== 'GET') {
				response.writeHead(405, {allow: 'GET'});
				response.end();
				return;
			}
			const bytes = modules.get(request.url ?? '');
			if (!bytes) {
				response.writeHead(404);
				response.end();
				return;
			}
			response.writeHead(200, {
				'content-type': 'text/javascript; charset=utf-8',
				'content-length': bytes.byteLength,
			});
			response.end(bytes);
		});
		server.requestTimeout = 30_000;
		server.headersTimeout = 10_000;
		await new Promise((resolve, reject) => {
			server.once('error', reject);
			server.listen(0, '127.0.0.1', () => resolve(undefined));
		});
		const address = server.address();
		if (!address || typeof address === 'string') throw new Error('Creative module host did not bind TCP.');
		return {
			baseUrl: `http://127.0.0.1:${address.port}`,
			/**
			 * Call this method to close this run's module host and outstanding connections.
			 *
			 * @returns {Promise<void>} - Listener shutdown completion.
			 */
			async close() {
				await new Promise((resolve, reject) => {
					server.close((error) => (error ? reject(error) : resolve(undefined)));
					server.closeAllConnections();
				});
			},
		};
	},
};
