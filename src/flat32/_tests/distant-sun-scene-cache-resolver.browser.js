import {
	createDistantSunSceneCacheCatalogResolver,
	createDistantSunSceneCacheHttpResolver,
	resolveDistantSunSceneCache,
} from '../DistantSunSceneCacheResolver.js';

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
			return {
				id: `solar-zenith-${String(degrees).padStart(3, '0')}-degrees`,
				representativeSolarZenithDegrees: degrees,
				minimumInputDegrees: Math.max(0, degrees - 0.5),
				maximumInputExclusiveDegrees: degrees === 108 ? 108 : degrees + 0.5,
				assetPath: `packages/${hash}/`,
				manifestPath: `scene-cache-manifest-${hash}.json`,
				manifestSha256: hash,
				cacheIdentity: `algorithm32-distant-sun-scene-cache-sha256:${hash}`,
				expected: {sceneSun: {id: `solar-zenith-${degrees}`}},
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
		expect(lower.representativeSolarZenithDegrees).toBe(10);
		expect(upper.representativeSolarZenithDegrees).toBe(11);
		expect(last.representativeSolarZenithDegrees).toBe(108);
		expect(upper.asset.assetRoot).toMatch(/^\/assets\/distant-sun\/packages\/[a-f0-9]{64}\/$/u);
		expect(upper.asset.loadRequest.manifestSha256).toBe(11..toString(16).padStart(64, '0'));
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
	});

	it('sends only the scalar solar zenith to the HTTP entry point', async () => {
		const expected = resolveDistantSunSceneCache(catalog(), 99.745, '/scene-caches/');
		let requestedUrl = null;
		const resolve = createDistantSunSceneCacheHttpResolver(
			'/api/distant-sun-scene-cache',
			async (url) => {
				requestedUrl = url;
				return {ok: true, status: 200, async json() { return expected; }};
			},
		);
		const actual = await resolve(99.745);

		expect(actual).toEqual(expected);
		expect([...requestedUrl.searchParams.keys()]).toEqual(['solarZenithDegrees']);
		expect(requestedUrl.searchParams.get('solarZenithDegrees')).toBe('99.745');
	});
});
