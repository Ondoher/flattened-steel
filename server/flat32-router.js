import {createReadStream} from 'node:fs';
import path from 'node:path';

import {createDistantSunSceneCachePackageService} from './flat32/DistantSunSceneCachePackageService.js';

function sendJson(response, status, value, cacheControl = 'no-store') {
	response
		.status(status)
		.set({
			'cache-control': cacheControl,
			'content-type': 'application/json; charset=utf-8',
		})
		.send(`${JSON.stringify(value)}\n`);
}

function errorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}

/** Mount the scalar resolver and immutable cache assets beneath Flat32's application slug. */
export default async function registerFlat32Routes(_expressApplication, router, flat32Application) {
	let service = null;
	let setupError = null;
	try {
		service = await createDistantSunSceneCachePackageService();
	} catch (error) {
		setupError = error;
	}
	const routerRoot = flat32Application.getRouterRoot().replace(/\/$/u, '');
	const assetBaseUrl = `${routerRoot}/scene-caches/`;

	router.get('/api/distant-sun-scene-cache', (request, response) => {
		if (service === null) {
			sendJson(response, 503, {error: `Distant-Sun cache service is unavailable: ${errorMessage(setupError)}`});
			return;
		}
		if (Object.keys(request.query).some((name) => name !== 'solarZenithDegrees')) {
			sendJson(response, 400, {error: 'Only solarZenithDegrees is accepted.'});
			return;
		}
		const rawDegrees = request.query.solarZenithDegrees;
		const solarZenithDegrees =
			typeof rawDegrees === 'string' && rawDegrees.trim() !== '' ? Number(rawDegrees) : Number.NaN;
		try {
			sendJson(response, 200, service.resolve(solarZenithDegrees, assetBaseUrl));
		} catch (error) {
			sendJson(response, 400, {error: errorMessage(error)});
		}
	});

	router.get('/scene-caches/*', async (request, response, next) => {
		if (service === null) {
			sendJson(response, 503, {error: `Distant-Sun cache service is unavailable: ${errorMessage(setupError)}`});
			return;
		}
		try {
			const asset = await service.resolveAsset(request.params[0]);
			const extension = path.extname(asset.path);
			response.status(200).set({
				'cache-control': 'public, max-age=31536000, immutable',
				'content-length': String(asset.byteLength),
				'content-type': extension === '.json' ? 'application/json' : 'application/octet-stream',
			});
			createReadStream(asset.path).on('error', next).pipe(response);
		} catch (error) {
			if (error?.code === 'ENOENT' || error instanceof RangeError) {
				sendJson(response, 404, {error: 'Distant-Sun cache asset was not found.'});
				return;
			}
			next(error);
		}
	});

	return true;
}
