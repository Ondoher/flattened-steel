import {Service} from '@polylith/core';

/**
 * Adapts authenticated local package assets to routes relative to Flat's deployment mount.
 */
export class StellarCatalogRouter extends Service {
	/**
	 * Registers the narrow package transport adapter.
	 *
	 * @param {unknown} registry - Owning application registry.
	 */
	constructor(registry) {
		super('stellar-catalog-router', registry);
		this.implement(['ready', 'routes']);
	}

	/**
	 * Call this method to resolve the package owner and register before the application fallback.
	 */
	ready() {
		this.catalog = /** @type {FlatStellarCatalog} */ (this.registry.subscribe('stellar-catalog'));
		let routers = /** @type {FlatRoutersService} */ (this.registry.subscribe('routers'));
		routers.add('stellar-catalog-router');
	}

	/**
	 * Call this method to install package routes without exposing filesystem names or failures to the client.
	 *
	 * @param {unknown} _express - Host-owned framework capability.
	 * @param {FlatExpressRouter} router - App-scoped route collection.
	 */
	routes(_express, router) {
		router.get('/stellar-catalogs/brightest-2000-stellar-package-v1/*', (request, response) =>
			this._serve(request.params[0], response, 'stars'),
		);
		router.get('/presentation-filters/human-vision-filter-package-v1/*', (request, response) =>
			this._serve(request.params[0], response, 'human-vision'),
		);
	}

	/**
	 * Called by package routes to translate authenticated domain bytes and operational failures into HTTP.
	 *
	 * @param {string} name - URL-decoded asset name, matched only against the authenticated inventory.
	 * @param {FlatExpressResponse} response - Host-owned transport response.
	 * @param {FlatStellarPackageKind} kind - Package selected by the registered route.
	 * @returns {Promise<void>} - Completed HTTP response.
	 */
	async _serve(name, response, kind) {
		try {
			let assets = await this.catalog.load(kind);
			let asset = assets.get(name);
			if (!asset) {
				response.status(404).json({error: 'stellar-asset-not-found'});
				return;
			}
			response.set('Cache-Control', 'private, max-age=3600').type(asset.mediaType).send(asset.bytes);
		} catch (error) {
			console.error(`Flat stellar package ${kind} is unavailable.`, error);
			response.status(503).json({error: 'stellar-catalog-unavailable'});
		}
	}
}
new StellarCatalogRouter();
