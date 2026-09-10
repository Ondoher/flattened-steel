import {
	createDistantSunSceneCacheCatalogResolver,
	createDistantSunSceneCacheHttpResolver,
	resolveDistantSunSceneCache,
} from '../DistantSunSceneCacheResolver.js';
import {
	FLAT32_DISTANT_SUN_CACHE_RESOLUTION_SCHEMA_ID,
	FLAT32_DISTANT_SUN_DENSE_CACHE_FORMAT_ID,
	FLAT32_DISTANT_SUN_SHARED_CACHE_FORMAT_ID,
} from '../consts.js';

function catalog() {
	return {
		schemaId: 'algorithm32-distant-sun-runtime-catalog-v1',
		accepted: true,
		binning: {
			kind: 'ledger-covered-nearest-integer-half-up-v1',
			startSolarZenithDegrees: 0,
			endSolarZenithDegrees: 108,
			incrementDegrees: 1,
			minimumInputDegrees: 0,
			maximumInputExclusiveDegrees: 108,
		},
		darkFromSolarZenithDegrees: 108,
		packages: Array.from({length: 109}, (_unused, degrees) => {
			const hash = degrees.toString(16).padStart(64, '0');
			const sceneId = `solar-zenith-${String(degrees).padStart(3, '0')}-degrees`;
			return {
				id: sceneId,
				representativeSolarZenithDegrees: degrees,
				minimumInputDegrees: Math.max(0, degrees - 0.5),
				maximumInputExclusiveDegrees: degrees === 108 ? 108 : degrees + 0.5,
				assetPath: `packages/${hash}/`,
				manifestPath: `scene-cache-manifest-${hash}.json`,
				manifestSha256: hash,
				cacheIdentity: `algorithm32-distant-sun-scene-cache-sha256:${hash}`,
				expected: {
					sceneSun: {
						id: sceneId,
						instant: '2026-09-09T12:00:00.000Z',
						directionToSourceUpEastNorth: [1, 0, 0],
						sourceIdentity: 'distant-sun-source:test',
					},
					atmosphereIdentity: 'canonical-atmosphere:test',
					geometryIdentity: 'spherical-earth:test',
					groundIdentity: 'black-ground:test',
					numericalIdentity: 'algorithm32-native15-n4:test',
				},
			};
		}),
	};
}

describe('DistantSunSceneCacheResolver', () => {
	it('owns deterministic nearest-integer half-up bins and content-addressed descriptors', () => {
		const resolve = createDistantSunSceneCacheCatalogResolver(catalog(), '/assets/distant-sun');
		const lower = resolve(10.499999);
		const upper = resolve(10.5);
		const last = resolve(107.999999);

		expect(lower.status).toBe('ready');
		expect(lower.schemaId).toBe(FLAT32_DISTANT_SUN_CACHE_RESOLUTION_SCHEMA_ID);
		expect(lower.cacheFormat).toBe(FLAT32_DISTANT_SUN_DENSE_CACHE_FORMAT_ID);
		expect(lower.representativeSolarZenithDegrees).toBe(10);
		expect(upper.representativeSolarZenithDegrees).toBe(11);
		expect(last.representativeSolarZenithDegrees).toBe(108);
		expect(upper.asset.assetRoot).toMatch(/^\/assets\/distant-sun\/packages\/[a-f0-9]{64}\/$/u);
		expect(upper.asset.loadRequest.manifestSha256).toBe((11).toString(16).padStart(64, '0'));
	});

	it('returns explicit unsupported and dark results without clamping', () => {
		const value = catalog();
		expect(resolveDistantSunSceneCache(value, 108).status).toBe('dark');
		expect(resolveDistantSunSceneCache(value, 180).status).toBe('dark');
	});

	it('rejects malformed inputs and catalogs', () => {
		expect(() => resolveDistantSunSceneCache(catalog(), Number.NaN)).toThrowError(/finite/u);
		expect(() => resolveDistantSunSceneCache(catalog(), -0.01)).toThrowError(/between 0 and 180/u);
		expect(() => createDistantSunSceneCacheCatalogResolver({...catalog(), packages: []})).toThrowError(
			/incompatible/u,
		);
		const traversalCatalog = catalog();
		traversalCatalog.packages[0].assetPath = 'packages/../../foreign/';
		expect(() => createDistantSunSceneCacheCatalogResolver(traversalCatalog)).toThrowError(/incompatible/u);
	});

	it('sends only the scalar solar zenith to the HTTP entry point', async () => {
		const expected = resolveDistantSunSceneCache(catalog(), 99.745, '/scene-caches/');
		let requestedUrl = null;
		let requestedSignal = null;
		const io = {
			async requestJson(request) {
				requestedUrl = request.route;
				requestedSignal = request.signal;
				return expected;
			},
		};
		const resolve = createDistantSunSceneCacheHttpResolver('/api/distant-sun-scene-cache', io);
		const controller = new AbortController();
		const actual = await resolve(99.745, {signal: controller.signal});

		expect(actual).toEqual(expected);
		expect([...requestedUrl.searchParams.keys()]).toEqual(['solarZenithDegrees']);
		expect(requestedUrl.searchParams.get('solarZenithDegrees')).toBe('99.745');
		expect(requestedSignal).toBe(controller.signal);
	});

	it('rejects unversioned responses and dense descriptors mislabeled as shared', async () => {
		const expected = resolveDistantSunSceneCache(catalog(), 10, '/scene-caches/');
		for (const incompatible of [
			{...expected, schemaId: undefined},
			{...expected, cacheFormat: FLAT32_DISTANT_SUN_SHARED_CACHE_FORMAT_ID},
		]) {
			const resolve = createDistantSunSceneCacheHttpResolver('/api/distant-sun-scene-cache', {
				async requestJson() {
					return incompatible;
				},
			});
			await expectAsync(resolve(10)).toBeRejectedWithError(/incompatible/u);
		}
	});

	it('rejects an HTTP response for a different requested scalar', async () => {
		const expected = resolveDistantSunSceneCache(catalog(), 10, '/scene-caches/');
		const resolve = createDistantSunSceneCacheHttpResolver('/api/distant-sun-scene-cache', {
			async requestJson() {
				return {...expected, requestedSolarZenithDegrees: 11};
			},
		});

		await expectAsync(resolve(10)).toBeRejectedWithError(/response is incompatible/u);
	});

	it('rejects out-of-domain HTTP scalars and malformed request options before transport', async () => {
		let requestCount = 0;
		const resolve = createDistantSunSceneCacheHttpResolver('/api/distant-sun-scene-cache', {
			async requestJson() {
				requestCount += 1;
				return null;
			},
		});

		await expectAsync(resolve(-0.01)).toBeRejectedWithError(/between 0 and 180/u);
		await expectAsync(resolve(180.01)).toBeRejectedWithError(/between 0 and 180/u);
		await expectAsync(resolve(10, null)).toBeRejectedWithError(/request is incompatible/u);
		await expectAsync(resolve(10, {signal: {}})).toBeRejectedWithError(/request is incompatible/u);
		expect(requestCount).toBe(0);
	});

	it('rejects uncontained and internally inconsistent ready responses', async () => {
		const expected = resolveDistantSunSceneCache(catalog(), 10, '/scene-caches/');
		const resolveWith = (incompatible) =>
			createDistantSunSceneCacheHttpResolver('/api/distant-sun-scene-cache', {
				async requestJson() {
					return incompatible;
				},
			});
		const foreignAsset = {
			...expected,
			asset: {...expected.asset, assetRoot: 'https://foreign.invalid/scene-caches/packages/ignored/'},
		};
		const wrongManifestHash = {
			...expected,
			asset: {
				...expected.asset,
				loadRequest: {...expected.asset.loadRequest, manifestSha256: 'f'.repeat(64)},
			},
		};
		const wrongCacheIdentity = {
			...expected,
			asset: {
				...expected.asset,
				loadRequest: {
					...expected.asset.loadRequest,
					cacheIdentity: `algorithm32-distant-sun-scene-cache-sha256:${'e'.repeat(64)}`,
				},
			},
		};

		for (const incompatible of [foreignAsset, wrongManifestHash, wrongCacheIdentity]) {
			await expectAsync(resolveWith(incompatible)(10)).toBeRejectedWithError(
				/identity is incompatible or uncontained/u,
			);
		}
	});
});
