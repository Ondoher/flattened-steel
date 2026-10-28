import {Service} from '@polylith/core';
import {registry} from '../registry.js';
import {HttpResponse} from './HttpResponse.js';

/** HTTP adapter for authenticated distant-Sun package selection and bytes.
 *
 * @implements {import('./shared-cache-router.js').SharedCacheRouter}
 */
export class SharedCacheRouter extends Service {
	/** Creates the feature router contribution.
	 *
	 * @param {unknown} [ownerRegistry] - Registry owning router and feature services.
	 */
	constructor(ownerRegistry = registry) {
		super('shared-cache-router', ownerRegistry);
		this.implement(['ready', 'routes']);
	}

	/** Call this method after local startup to locate capabilities and register HTTP contribution.
	 *
	 * @returns {void} - Router registered in app installation order.
	 */
	ready() {
		this._packages = /** @type {import('../features/shared-cache/shared-cache.js').SharedCacheService} */ (
			this.registry.subscribe('shared-cache')
		);
		/** @type {import('../services/routers.js').RoutersService} */ (this.registry.subscribe('routers')).add(
			'shared-cache-router',
		);
	}

	/** Called by the scalar route to validate transport input and resolve a cache.
	 *
	 * @param {Flat32HttpRequest} request - Host-owned request.
	 * @param {Flat32HttpResponse} response - Host-owned response.
	 * @param {string} assetBaseUrl - Effective app asset mount.
	 * @returns {void} - JSON response sent.
	 */
	_resolve(request, response, assetBaseUrl) {
		if (!this._packages.isAvailable()) {
			HttpResponse.json(response, 503, {error: 'Distant-Sun cache service is unavailable.'});
			return;
		}
		if (Object.keys(request.query).some((name) => name !== 'solarZenithDegrees')) {
			HttpResponse.json(response, 400, {error: 'Only solarZenithDegrees is accepted.'});
			return;
		}
		const raw = request.query.solarZenithDegrees;
		const degrees = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : Number.NaN;
		try {
			HttpResponse.json(response, 200, this._packages.resolve(degrees, assetBaseUrl));
		} catch (error) {
			if (error instanceof RangeError || error instanceof TypeError) {
				HttpResponse.json(response, 400, {error: error.message});
				return;
			}
			console.error('Flat32 cache resolution failed.', error);
			HttpResponse.json(response, 500, {error: 'Distant-Sun cache resolution failed.'});
		}
	}

	/** Called by the asset route to deliver complete authenticated bytes.
	 * Unexpected read failures are logged and returned as opaque errors.
	 *
	 * @param {Flat32HttpRequest} request - Wildcard artifact request.
	 * @param {Flat32HttpResponse} response - Host-owned response.
	 * @returns {Promise<void>} - Response sent or opaque failure reported.
	 */
	async _serve(request, response) {
		if (!this._packages.isAvailable()) {
			HttpResponse.json(response, 503, {error: 'Distant-Sun cache service is unavailable.'});
			return;
		}
		try {
			let asset = await this._packages.resolveAsset(request.params[0]);
			response
				.status(200)
				.set({
					'cache-control': 'public, max-age=31536000, immutable',
					'content-length': String(asset.byteLength),
					'content-type': asset.contentType,
					'accept-ranges': 'none',
				})
				.send(asset.bytes);
		} catch (error) {
			if (error?.code === 'ENOENT' || error instanceof RangeError) {
				HttpResponse.json(response, 404, {error: 'Distant-Sun cache asset was not found.'});
				return;
			}
			HttpResponse.failure(response, error, 'Distant-Sun cache asset request failed.');
		}
	}

	/** Call this method to mount this feature below its effective app router.
	 *
	 * @param {unknown} _expressApplication - Host-owned Express app.
	 * @param {Flat32HttpRouter} router - App-scoped route collection.
	 * @param {Flat32ServerApplication} application - Effective app mount.
	 * @returns {void} - Selection and asset handlers installed.
	 */
	routes(_expressApplication, router, application) {
		const base = `${application.getRouterRoot().replace(/\/$/u, '')}/scene-caches/`;
		router.get('/api/distant-sun-scene-cache', (request, response) => this._resolve(request, response, base));
		router.get('/scene-caches/*', (request, response) => this._serve(request, response));
	}
}

new SharedCacheRouter();
