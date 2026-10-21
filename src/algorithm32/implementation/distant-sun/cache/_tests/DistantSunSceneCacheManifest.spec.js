import {
	DISTANT_SUN_SCENE_CACHE_EXACT_SEAM_CODEC_ID,
	DISTANT_SUN_RUNTIME_SCENE_CACHE_MANIFEST_SCHEMA_ID,
	DISTANT_SUN_ACCURACY_RUNTIME_SCENE_CACHE_MANIFEST_SCHEMA_ID,
} from '../consts.js';
import DistantSunSceneCacheManifest from '../DistantSunSceneCacheManifest.js';

describe('DistantSunSceneCacheManifest', /** Called by Jasmine to register the named test suite. */ () => {
	it('requires matching schema and explicit corrected policy for a focused dense asset', /** Called by Jasmine to prove dense policy ingress. */ () => {
		const candidate = {
			...createRecord(),
			schemaId: DISTANT_SUN_ACCURACY_RUNTIME_SCENE_CACHE_MANIFEST_SCHEMA_ID,
			scatteringAccuracy: 'corrected60-sun035',
		};
		expect(new DistantSunSceneCacheManifest(candidate).record.scatteringAccuracy).toBe('corrected60-sun035');
		expect(
			() =>
				new DistantSunSceneCacheManifest({
					...candidate,
					schemaId: DISTANT_SUN_RUNTIME_SCENE_CACHE_MANIFEST_SCHEMA_ID,
				}),
		).toThrowError(/policy differ/u);
		expect(() => new DistantSunSceneCacheManifest({...candidate, scatteringAccuracy: undefined})).toThrowError(
			/policy differ/u,
		);
	});
	it('accepts one complete content-addressed scene asset', /** Called by Jasmine to exercise the named behavior. */ () => {
		const record = createRecord();
		const manifest = new DistantSunSceneCacheManifest(record);

		expect(manifest.record).toBe(record);
		expect(
			/** Called by Jasmine to invoke exact identity acceptance. */ () =>
				manifest.requireCacheIdentity('cache:test'),
		).not.toThrow();
	});

	it('rejects an incompatible schema, unsafe path, or mismatched identity', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/** Called by Jasmine to invoke rejected schema acceptance. */ () =>
				new DistantSunSceneCacheManifest({...createRecord(), schemaId: 'unknown'}),
		).toThrowError(/schema/u);
		expect(
			/** Called by Jasmine to invoke rejected path acceptance. */ () =>
				new DistantSunSceneCacheManifest({...createRecord(), ledgerPath: '../ledger.json'}),
		).toThrowError(/asset-relative/u);
		expect(
			/** Called by Jasmine to invoke rejected identity acceptance. */ () =>
				new DistantSunSceneCacheManifest(createRecord()).requireCacheIdentity('different'),
		).toThrowError(/requested cache identity/u);
	});
});

/** Called by this module to create one complete valid manifest record. */
function createRecord() {
	const hash = 'a'.repeat(64);
	return {
		schemaId: DISTANT_SUN_RUNTIME_SCENE_CACHE_MANIFEST_SCHEMA_ID,
		cacheIdentity: 'cache:test',
		selection: {
			representativeSolarZenithDegrees: 100,
			minimumInputDegrees: 99.5,
			maximumInputExclusiveDegrees: 100.5,
		},
		sceneSun: {
			id: 'scene:test',
			instant: '2024-06-21T04:26:03.503Z',
			directionToSourceUpEastNorth: [0, 0, 1],
			sourceIdentity: 'source:test',
		},
		atmosphereIdentity: 'atmosphere:test',
		geometryIdentity: 'geometry:test',
		groundIdentity: 'ground:test',
		numericalIdentity: 'native48-z180-w27-f68-native15-n4-q30:test',
		ledgerPath: 'ledger.json',
		ledgerSha256: hash,
		exactSeamPayload: {
			path: 'seam.f32',
			byteLength: 4,
			sha256: hash,
			codecId: DISTANT_SUN_SCENE_CACHE_EXACT_SEAM_CODEC_ID,
		},
		logicalToUniqueIndex: {
			path: 'map.u16',
			byteLength: 2,
			sha256: hash,
			codecId: DISTANT_SUN_SCENE_CACHE_EXACT_SEAM_CODEC_ID,
		},
		derivation: {compilerIdentity: 'compiler:test'},
	};
}
