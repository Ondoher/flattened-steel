import {Registry} from '@polylith/core';
import {DistantSunCache} from '../distant-sun-cache.js';
import SharedDistantCacheAssets from '../../../flat32/SharedDistantCacheAssets.js';
import DistantSunSharedCachePackage from '../../../algorithm32/implementation/distant-sun/cache/DistantSunSharedCachePackage.js';
import DistantSunSharedCacheWorkerClient from '../../../algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheWorkerClient.js';
import DistantSunSharedCacheTransport from '../../../algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheTransport.js';
import {DISTANT_SUN_SHARED_CACHE_PACKET_BYTES} from '../../../algorithm32/implementation/distant-sun/cache/consts.js';

/**
 * Actual Flat/Flat32 consumer integration within one shared engine module scope.
 */
describe('Flat and Flat32 cache lifetimes', () => {
	for (const first of ['Flat', 'Flat32']) {
		it('survives stopping original ' + first + ' creator and restarting that app', async () => {
			const cache = new DistantSunCache(new Registry());
			cache.start();
			let legacy = new SharedDistantCacheAssets(),
				replacement;
			const signal = new AbortController().signal;
			const block = {
				id: 'proof',
				rowCount: 1,
				encoded: {byteLength: 8, sha256: 'a'.repeat(64)},
				decoded: {byteLength: 243480, sha256: 'b'.repeat(64)},
			};
			const graph = {
				configuration: {directionLayout: {logicalToUniqueIndex: {sha256: 'c'.repeat(64)}}},
				blockIndex: {blocks: [block]},
				scenes: [{representativeSolarZenithDegrees: 20, requiredBlockIds: ['proof']}],
				logicalToUniqueIndex: new Uint16Array(4374),
			};
			const source = {getBlockUrl: () => location.origin + '/proof.zst'};
			const asset = {
				rootUrl: location.origin + '/cache/',
				packageSetIdentity: 'package',
				report: {sha256: 'd'.repeat(64)},
			};
			const resolution = {
				schemaId: 'flat32-distant-sun-cache-resolution-v2',
				cacheFormat: 'algorithm32-distant-sun-shared-block-v1',
				status: 'ready',
				representativeSolarZenithDegrees: 20,
				asset,
			};
			spyOn(DistantSunSharedCachePackage, 'load').and.resolveTo(source);
			spyOn(cache, '_load').and.resolveTo({source, graph});
			spyOn(cache, '_fetch').and.callFake(async (url) =>
				url.includes('api/') ? new Response(JSON.stringify(resolution)) : new Response(new Uint8Array(8)),
			);
			spyOn(window, 'fetch').and.callFake(async () => new Response(new Uint8Array(8)));
			spyOn(DistantSunSharedCacheWorkerClient.prototype, 'prepare').and.resolveTo({
				packet: {values: new Float32Array(DISTANT_SUN_SHARED_CACHE_PACKET_BYTES / 4)},
				timings: {decoder: 'wasm'},
			});
			const disposed = spyOn(DistantSunSharedCacheWorkerClient.prototype, 'dispose').and.callThrough();
			try {
				if (first === 'Flat') {
					await cache.prepare(20, signal);
					await legacy.select(asset, 20, signal);
				} else {
					await legacy.select(asset, 20, signal);
					await cache.prepare(20, signal);
				}
				const shared = DistantSunSharedCacheTransport.current;
				if (first === 'Flat') {
					cache.stop();
				} else {
					legacy.dispose();
				}
				expect(disposed).not.toHaveBeenCalled();
				if (first === 'Flat') {
					const remaining = await legacy.select(asset, 20, signal);
					expect(remaining.transport).toBe(shared);
					cache.start();
					await cache.prepare(20, signal);
				} else {
					await cache.prepare(20, signal);
					replacement = new SharedDistantCacheAssets();
					expect((await replacement.select(asset, 20, signal)).transport).toBe(shared);
				}
				expect(DistantSunSharedCacheTransport.current).toBe(shared);
			} finally {
				cache.stop();
				legacy.dispose();
				replacement?.dispose();
			}
			expect(disposed).toHaveBeenCalledTimes(1);
			expect(DistantSunSharedCacheTransport.current).toBeUndefined();
		});
	}
});
