import express from 'express';
import registerFlat32Routes from '../../server/flat32-router.js';
import SharedCacheService from '../../server/flat32/features/shared-cache/DistantSunSharedCachePackageService.js';
import {StrobingRun} from './StrobingRun.js';

/** Loopback host of the existing application and read-only production asset routes. */
export class StrobingServer {
	/** @param {string} [candidateRoot] Authenticated sealed experiment package directory.
	 * @returns {Promise<StrobingServerHandle>} Owned server shutdown capability. */
	static async start(candidateRoot) {
		const applicationRoot = await StrobingRun.checkedPath(StrobingRun.repositoryRoot, 'dist/flat32');
		await StrobingRun.checkedPath(StrobingRun.repositoryRoot, 'server/flat32/data');
		const application = express();
		const router = express.Router();
		if (candidateRoot) {
			await StrobingRun.checkedPath(StrobingRun.repositoryRoot, candidateRoot);
			const service = await new SharedCacheService(candidateRoot).load(
				await StrobingRun.identity(candidateRoot, 'package-set.json'),
			);
			router.get('/api/distant-sun-scene-cache', (request, response, next) => {
				try {
					response.json(service.resolve(Number(request.query.solarZenithDegrees), '/flat32/scene-caches/'));
				} catch (error) {
					next(error);
				}
			});
			router.get('/scene-caches/*', async (request, response, next) => {
				try {
					const asset = await service.resolveAsset(request.params[0]);
					response
						.set({'content-type': asset.contentType, 'content-length': String(asset.byteLength)})
						.send(asset.bytes);
				} catch (error) {
					next(error);
				}
			});
		}
		await registerFlat32Routes(application, router, {getRouterRoot: () => '/flat32/'});
		application.use('/flat32', router, express.static(applicationRoot, {fallthrough: false}));
		return new Promise((resolve, reject) => {
			const server = application.listen(8081, '127.0.0.1', () =>
				resolve({
					close: () =>
						new Promise((done, fail) => {
							server.close((error) => (error ? fail(error) : done()));
							server.closeAllConnections();
						}),
				}),
			);
			server.once('error', reject);
		});
	}
}
