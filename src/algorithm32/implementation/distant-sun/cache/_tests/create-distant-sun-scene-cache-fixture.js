import {NATIVE_15_SPECTRAL_BASIS} from '../../../../profiles/index.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
	SOLAR_ZENITH_180_DOMAIN_OWNER,
} from '../../../../sampling-domains/index.js';
import DistantSunSceneCache from '../DistantSunSceneCache.js';
import DistantSunSceneCacheLedger from '../DistantSunSceneCacheLedger.js';

/** Create one production-shaped resident scene-cache fixture for structural consumers. */
export function createDistantSunSceneCacheFixture() {
	const sceneSun = {
		id: 'structural-test-scene',
		instant: '2024-06-21T03:26:03.503Z',
		directionToSourceUpEastNorth: [0, -Math.sqrt(0.75), 0.5],
		sourceIdentity: 'algorithm32-native-distant-collimated-sun-v1',
	};
	const ledger = new DistantSunSceneCacheLedger({
		sceneSun,
		support: {
			id: 'structural-test-support',
			bottomRadius: {value: 6360000, units: 'meters'},
			topRadius: {value: 6420000, units: 'meters'},
			observerAltitude: {value: 2, units: 'meters'},
			observerSolarZenith: {value: Math.PI / 2, units: 'radians'},
			completeCameraRotation: true,
			arbitraryShortenedEndpoint: true,
		},
		positionDomain: NATIVE_48_POSITION_DOMAIN_OWNER,
		solarZenithDomain: SOLAR_ZENITH_180_DOMAIN_OWNER,
		outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const texture = (id, storage, valueKey) => ({
		id,
		storage,
		backendId: 'scene-cache-fixture-backend',
		runtimeBinding: {id: `${id}:binding`, valueKey, fieldId: id, backendId: 'scene-cache-fixture-backend'},
		dispose() {},
	});
	return new DistantSunSceneCache({
		manifest: {
			record: {
				cacheIdentity: 'structural-test-scene-cache',
				exactSeamPayload: {byteLength: ledger.retainedBlockCount * 4058 * 15 * 4},
				logicalToUniqueIndex: {byteLength: 8748},
			},
			requireCacheIdentity() {},
		},
		ledger,
		cumulativeTexture: texture(
			'structural-scene-values',
			{format: 'RGBA32F', width: 648, height: 27, layers: ledger.retainedBlockCount},
			'cache.sceneCumulativeScatteringDensity',
		),
		directionIndexTexture: texture(
			'structural-scene-index',
			{format: 'R16UI', width: 4374, height: 1, layers: 1},
			'cache.sceneLogicalToUniqueDirection',
		),
	});
}
