import assert from 'node:assert/strict';
import test from 'node:test';
import DistantSunSceneCacheAtlas from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheAtlas.js';
import DistantSunSceneCache from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCache.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/index.js';
import B1Direct40CacheAssetManifest, {
	B1_POINT_LOCAL_CACHE_LAYOUT,
	B1_DIRECT40_CACHE_PAYLOAD_CODEC,
	B1_DIRECT40_DIRECTION_INDEX_CODEC,
} from './B1Direct40CacheAssetManifest.js';
import DistantSunPointLocalCacheInventory from '../solar-zenith-cache/DistantSunPointLocalCacheInventory.js';
import {DistantSunPointLocalProfileCompilerInputs} from '../solar-zenith-cache/DistantSunPointLocalProfileCompilerInputs.js';
import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';

test('preserves exact values across all 40 channels, multiple rows, and every W27 seam', () => {
	const directions = Uint16Array.from(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.logicalToUniqueDirectionIndices);
	for (const channels of [15, 40]) {
		const source = Float32Array.from({length: channels * 2 * 4058}, (_value, index) => index);
		const atlas = DistantSunSceneCacheAtlas.pack(source, directions, 2, channels);
		const width = Math.ceil(channels / 4) * 162;
		for (let channel = 0; channel < channels; channel++)
			for (let row = 0; row < 2; row++)
				for (let logical = 0; logical < 4374; logical++) {
					const x = Math.floor(channel / 4) * 162 + Math.floor(logical / 729) * 27 + (logical % 27);
					const y = Math.floor((logical % 729) / 27);
					assert.equal(
						atlas[((row * 27 + y) * width + x) * 4 + (channel % 4)],
						source[(channel * 2 + row) * 4058 + directions[logical]],
					);
				}
	}
	assert.throws(() => DistantSunSceneCacheAtlas.pack(new Float32Array(1), directions, 2, 40), /dimensions/);
});

test('receiver-local asset carries the executable ledger and rejects inconsistent packed rows', () => {
	const condition = {id: 'b1-09:30', localTime: '09:30'};
	const profile = createBrunetonProductionProfile({
		time: '09:30',
		fittedAzimuthDegrees: 90,
		maximumScatteringOrder: 4,
	});
	const input = DistantSunPointLocalProfileCompilerInputs.createBatch([profile], {ids: [condition.id]});
	const inventory = new DistantSunPointLocalCacheInventory().create(
		input.buildRequest,
		[...input.scenes],
		[...input.wavelengths],
	);
	const ledger = inventory.scenes[0].ledger;
	const record = B1Direct40CacheAssetManifest.createRecord({
		...B1Direct40CacheAssetManifest.createProfileBoundary(profile, condition),
		ledger,
		layout: {axisOrder: B1_POINT_LOCAL_CACHE_LAYOUT, scalarType: 'float32-little-endian'},
		cumulativeScatteringDensity: {
			path: 'density.f32',
			codecId: B1_DIRECT40_CACHE_PAYLOAD_CODEC,
			byteLength: ledger.retainedBlockCount * 40 * 4058 * 4,
			sha256: 'a'.repeat(64),
		},
		logicalToUniqueIndex: {
			path: 'directions.u16',
			codecId: B1_DIRECT40_DIRECTION_INDEX_CODEC,
			byteLength: 8748,
			sha256: 'b'.repeat(64),
		},
		derivation: {
			compilerIdentity: 'algorithm32-production-shared-cache-generator',
			productionRevision: 'test',
			operation: 'test',
			inputs: {},
		},
	});
	new B1Direct40CacheAssetManifest(record).requireCompatibility(profile, condition);
	const changed = structuredClone(record);
	changed.ledger.rows[1].firstPackedRow++;
	assert.throws(() => new B1Direct40CacheAssetManifest(B1Direct40CacheAssetManifest.createRecord(changed)), /ledger/);
	const texture = (storage) => ({storage, backendId: 'test', runtimeBinding: {}, dispose() {}});
	const cache = new DistantSunSceneCache({
		spectralChannelCount: 40,
		ledger,
		manifest: {
			record: {
				cacheIdentity: record.assetIdentity,
				exactSeamPayload: record.cumulativeScatteringDensity,
				logicalToUniqueIndex: record.logicalToUniqueIndex,
			},
		},
		cumulativeTexture: texture({format: 'RGBA32F', width: 1620, height: 27, layers: ledger.retainedBlockCount}),
		directionIndexTexture: texture({format: 'R16UI', width: 4374, height: 1, layers: 1}),
	});
	const shader = cache.createShaderContribution().functions[0].code;
	assert.equal(shader.match(/texture\(uDistantSunSceneCumulativeCache/gu).length, 10);
	assert.match(shader, /density.channels\[39\] = supported \? density9.w/u);
	cache.dispose();
});
