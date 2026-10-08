import {createReadStream} from 'node:fs';
import path from 'node:path';

import {createProductionSharedCacheService} from './flat32/features/shared-cache/index.js';
import {createStellarCatalogPackageService} from './flat32/StellarCatalogPackageService.js';
import {createHumanVisionFilterPackageService} from './flat32/HumanVisionFilterPackageService.js';

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
	let stellarService = null;
	let humanVisionService = null;
	try {
		service = await createProductionSharedCacheService();
	} catch (error) {
		console.error('Flat32 Distant-Sun cache setup failed.', error);
	}
	try {
		stellarService = await createStellarCatalogPackageService();
	} catch (error) {
		console.error('Flat32 stellar catalog setup failed.', error);
	}
	try {
		humanVisionService = await createHumanVisionFilterPackageService();
	} catch (error) {
		console.error('Flat32 human-vision filter setup failed.', error);
	}
	const routerRoot = flat32Application.getRouterRoot().replace(/\/$/u, '');
	const assetBaseUrl = `${routerRoot}/scene-caches/`;

	router.get('/api/distant-sun-scene-cache', (request, response) => {
		if (service === null) {
			sendJson(response, 503, {error: 'Distant-Sun cache service is unavailable.'});
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
			sendJson(response, 503, {error: 'Distant-Sun cache service is unavailable.'});
			return;
		}
		try {
			const asset = await service.resolveAsset(request.params[0]);
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
				sendJson(response, 404, {error: 'Distant-Sun cache asset was not found.'});
				return;
			}
			next(error);
		}
	});

	router.get('/stellar-catalogs/brightest-2000-stellar-package-v1/*', async (request, response, next) => {
		if (stellarService === null) {
			sendJson(response, 503, {
				error: 'Stellar catalog service is unavailable.',
			});
			return;
		}
		try {
			const asset = await stellarService.resolveAsset(request.params[0]);
			response.status(200).set({
				'cache-control': 'private, max-age=0, must-revalidate',
				'content-length': String(asset.byteLength),
				'content-type': path.extname(asset.path) === '.json' ? 'application/json' : 'application/octet-stream',
			});
			createReadStream(asset.path).on('error', next).pipe(response);
		} catch (error) {
			if (error?.code === 'ENOENT' || error instanceof RangeError) {
				sendJson(response, 404, {error: 'Stellar catalog asset was not found.'});
				return;
			}
			next(error);
		}
	});

	router.get('/presentation-filters/human-vision-filter-package-v1/*', async (request, response, next) => {
		if (humanVisionService === null) {
			sendJson(response, 503, {
				error: 'Human-vision filter service is unavailable.',
			});
			return;
		}
		try {
			const asset = await humanVisionService.resolveAsset(request.params[0]);
			response.status(200).set({
				'cache-control': 'private, max-age=0, must-revalidate',
				'content-length': String(asset.byteLength),
				'content-type': 'application/json',
			});
			createReadStream(asset.path).on('error', next).pipe(response);
		} catch (error) {
			if (error?.code === 'ENOENT' || error instanceof RangeError) {
				sendJson(response, 404, {error: 'Human-vision filter asset was not found.'});
				return;
			}
			next(error);
		}
	});

	return true;
}
