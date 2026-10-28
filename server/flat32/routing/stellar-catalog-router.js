import {Service} from '@polylith/core';
import {registry} from '../registry.js';
import {HttpResponse} from './HttpResponse.js';

/** HTTP adapter for local-only stellar catalog package assets.
 *
 * @implements {import('./stellar-catalog-router.js').StellarCatalogRouter}
 */
export class StellarCatalogRouter extends Service {
	/** Creates the app's feature router contribution.
	 *
	 * @param {unknown} [ownerRegistry] - Registry owning the feature and routers.
	 */
	constructor(ownerRegistry = registry) {
		super('stellar-catalog-router', ownerRegistry);
		this.implement(['ready', 'routes']);
	}

	/** Call this method after local startup to locate the feature and register its routes.
	 *
	 * @returns {void} - Router contribution registered.
	 */
	ready() {
		this._packages = /** @type {import('../features/stellar-catalog/stellar-catalog.js').StellarCatalogService} */ (
			this.registry.subscribe('stellar-catalog')
		);
		let routers = /** @type {import('../services/routers.js').RoutersService} */ (
			this.registry.subscribe('routers')
		);
		routers.add('stellar-catalog-router');
	}

	/** Called by the HTTP handler to stream one admitted asset.
	 * Missing and invalid assets return 404; other failures are logged and returned as opaque errors.
	 *
	 * @param {Flat32HttpRequest} request - Wildcard asset request.
	 * @param {Flat32HttpResponse} response - Host-owned response stream.
	 * @returns {Promise<void>} - Streaming started or failure reported.
	 */
	async _serve(request, response) {
		if (!this._packages.isAvailable()) {
			HttpResponse.json(response, 503, {error: 'Stellar catalog service is unavailable.'});
			return;
		}
		try {
			let asset = await this._packages.openAsset(request.params[0]);
			HttpResponse.stream(
				response,
				asset,
				'private, max-age=0, must-revalidate',
				'Stellar catalog asset request failed.',
			);
		} catch (error) {
			if (error?.code === 'ENOENT' || error instanceof RangeError) {
				HttpResponse.json(response, 404, {error: 'Stellar catalog asset was not found.'});
				return;
			}
			HttpResponse.failure(response, error, 'Stellar catalog asset request failed.');
		}
	}

	/** Call this method to install the app-relative asset route.
	 *
	 * @param {unknown} _expressApplication - Host-owned Express app.
	 * @param {Flat32HttpRouter} router - App-scoped route collection.
	 * @param {Flat32ServerApplication} _application - Host-owned mount facts.
	 * @returns {void} - Handler installed.
	 */
	routes(_expressApplication, router, _application) {
		router.get('/stellar-catalogs/brightest-2000-stellar-package-v1/*', (request, response) =>
			this._serve(request, response),
		);
	}
}

new StellarCatalogRouter();
