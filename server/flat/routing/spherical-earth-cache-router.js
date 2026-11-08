import {Service} from '@polylith/core';

/**
 * HTTP boundary for Flat-owned distant-Sun package selection and complete artifacts.
 */
export class SphericalCacheRouter extends Service {
	/**
	 * Creates the app router contribution.
	 *
	 * @param {unknown} registry - Owning application registry.
	 */
	constructor(registry) {
		super('spherical-earth-cache-router', registry);
		this.implement(['ready', 'routes']);
	}

	/**
	 * Call this method to resolve the package capability and ordered route host.
	 */
	ready() {
		this.cache = /** @type {FlatSphericalCacheService} */ (this.registry.subscribe('spherical-earth-cache'));
		/** @type {FlatRoutersService} */ (this.registry.subscribe('routers')).add('spherical-earth-cache-router');
	}

	/**
	 * Called by route handlers to report operational failures without exposing server paths.
	 *
	 * @param {FlatExpressResponse} response - Host response.
	 * @param {unknown} error - Package/transport failure.
	 */
	_failure(response, error) {
		console.error('Spherical cache delivery failed.', error);
		response.status(503).json({error: 'spherical-cache-unavailable'});
	}

	/**
	 * Called by the scalar endpoint to accept external zenith input.
	 *
	 * @param {FlatExpressRequest} request - External request.
	 * @param {FlatExpressResponse} response - Host response.
	 * @param {string} base - Effective mount-relative immutable data directory.
	 */
	async _resolve(request, response, base) {
		let raw = request.query.solarZenithDegrees;
		let angle = typeof raw === 'string' && raw.trim() ? Number(raw) : NaN;
		if (
			Object.keys(request.query).some((name) => name !== 'solarZenithDegrees') ||
			!Number.isFinite(angle) ||
			angle < 0 ||
			angle > 180
		) {
			response.status(400).json({error: 'invalid-solar-zenith'});
			return;
		}
		try {
			response.json((await this.cache.load()).resolve(angle, base));
		} catch (error) {
			this._failure(response, error);
		}
	}

	/**
	 * Called by artifact requests to serve only authenticated declared files.
	 *
	 * @param {FlatExpressRequest} request - External artifact request.
	 * @param {FlatExpressResponse} response - Host response.
	 */
	async _serve(request, response) {
		try {
			let asset = await (await this.cache.load()).resolveAsset(request.params[0]);
			response
				.set({
					'content-type': asset.contentType,
					'content-length': String(asset.byteLength),
					'cache-control': 'public, max-age=31536000, immutable',
					'accept-ranges': 'none',
				})
				.send(asset.bytes);
		} catch (error) {
			if (error instanceof RangeError) {
				response.status(404).json({error: 'spherical-cache-asset-not-found'});
			} else {
				this._failure(response, error);
			}
		}
	}

	/**
	 * Call this method to register app-relative routes before the page fallback.
	 *
	 * @param {unknown} _express - Host framework.
	 * @param {FlatExpressRouter} router - App router.
	 * @param {FlatServerApplication} app - Effective mount provider.
	 */
	routes(_express, router, app) {
		let base = app.getRouterRoot().replace(/\/$/, '') + '/spherical-cache/';
		router.get('/api/distant-sun-scene-cache', (request, response) => this._resolve(request, response, base));
		router.get('/spherical-cache/*', (request, response) => this._serve(request, response));
	}
}

new SphericalCacheRouter();
