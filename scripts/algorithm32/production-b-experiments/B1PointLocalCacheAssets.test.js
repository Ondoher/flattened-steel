import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {B1AssetBackedDistantSunLightSource} from './B1Direct40AssetCache.js';
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

/** Called by point-local tests to assemble exact interpolation and position-domain support.
 *
 * @param {DistantSunSolarInterpolationMethod} solarInterpolation - Selected source-angle interpolation.
 * @param {SphericalNativePositionDomainSelection} positionDomain - Selected altitude construction domain.
 * @returns {object} - Matched request, result, profile, and compiled cache fixture.
 */
function receiverLocalFixture(solarInterpolation, positionDomain) {
	const condition = {id: 'b1-09:30', localTime: '09:30'};
	const profile = createBrunetonProductionProfile({
		time: '09:30',
		fittedAzimuthDegrees: 90,
		maximumScatteringOrder: 4,
		positionDomain,
	});
	const input = DistantSunPointLocalProfileCompilerInputs.createBatch([profile], {
		ids: [condition.id],
		solarInterpolation,
	});
	const inventory = new DistantSunPointLocalCacheInventory().create(
		input.buildRequest,
		[...input.scenes],
		[...input.wavelengths],
	);
	const ledger = inventory.scenes[0].ledger;
	const record = B1Direct40CacheAssetManifest.createRecord({
		...B1Direct40CacheAssetManifest.createProfileBoundary(profile, condition),
		ledger,
		...(solarInterpolation === undefined ? {} : {solarInterpolation}),
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
	return {record, profile, condition, ledger};
}

test('receiver-local asset carries the executable ledger and rejects inconsistent packed rows', () => {
	const {record, profile, condition, ledger} = receiverLocalFixture();
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

test('authenticates the cubic selection and requires its complete receiver-local solar support', () => {
	const {record, profile, condition} = receiverLocalFixture('monotone-cubic');
	const manifest = new B1Direct40CacheAssetManifest(record);
	manifest.requireCompatibility(profile, condition);
	assert.equal(manifest.toRecord().solarInterpolation, 'monotone-cubic');
	const linear = {...record};
	delete linear.solarInterpolation;
	assert.notEqual(B1Direct40CacheAssetManifest.createRecord(linear).assetIdentity, record.assetIdentity);
	assert.throws(
		() => new B1Direct40CacheAssetManifest({...record, solarInterpolation: 'linear'}),
		/identity does not cover/u,
	);
	assert.throws(
		() =>
			new B1Direct40CacheAssetManifest(
				B1Direct40CacheAssetManifest.createRecord({...record, solarInterpolation: 'invalid'}),
			),
		/solar interpolation/u,
	);
	const incomplete = receiverLocalFixture();
	assert.equal(Object.hasOwn(incomplete.record, 'solarInterpolation'), false);
	const missingSupport = new B1Direct40CacheAssetManifest(
		B1Direct40CacheAssetManifest.createRecord({...incomplete.record, solarInterpolation: 'monotone-cubic'}),
	);
	assert.throws(() => missingSupport.requireCompatibility(profile, condition), /required interior solar support/u);
});

test('authenticates every Native51 altitude node and rejects incompatible or shortened refined ledgers', () => {
	const {record, profile, condition} = receiverLocalFixture('monotone-cubic', 'native51-near-ground');
	const manifest = new B1Direct40CacheAssetManifest(record);
	manifest.requireCompatibility(profile, condition);
	assert.equal(record.domains.position.count, 51);
	assert.equal(record.domains.position.selection, 'native51-near-ground');
	assert.equal(record.ledger.rows.length, 51);
	const original = receiverLocalFixture('monotone-cubic');
	assert.throws(() => manifest.requireCompatibility(original.profile, condition), /incompatible/);
	for (const mutate of [
		(value) => {
			value.domains.position.nodes[1].coordinate.value += 1;
		},
		(value) => {
			value.domains.position.selection = 'native50';
		},
		(value) => {
			delete value.domains.position.selection;
		},
		(value) => {
			value.ledger.rows.pop();
		},
	]) {
		const changed = structuredClone(record);
		mutate(changed);
		assert.throws(() => new B1Direct40CacheAssetManifest(B1Direct40CacheAssetManifest.createRecord(changed)));
	}
});

test('loads the authenticated cubic receiver-local asset into the Direct40 runtime', async () => {
	const {record: original, profile, condition, ledger} = receiverLocalFixture('monotone-cubic');
	const density = new Uint8Array(ledger.retainedBlockCount * 40 * 4058 * 4);
	const directions = new Uint8Array(
		Uint16Array.from(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.logicalToUniqueDirectionIndices).buffer,
	);
	const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
	const record = B1Direct40CacheAssetManifest.createRecord({
		...original,
		cumulativeScatteringDensity: {...original.cumulativeScatteringDensity, sha256: hash(density)},
		logicalToUniqueIndex: {...original.logicalToUniqueIndex, sha256: hash(directions)},
	});
	const manifest = new TextEncoder().encode(JSON.stringify(record));
	const previousFetch = globalThis.fetch;
	const previousLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
	const assets = new Map([
		['asset.json', manifest],
		['density.f32', density],
		['directions.u16', directions],
	]);
	const textures = [];
	let controller;
	try {
		Object.defineProperty(globalThis, 'location', {configurable: true, value: {href: 'https://cache.test/'}});
		globalThis.fetch = async (url) => {
			const bytes = assets.get(new URL(url).pathname.split('/').at(-1));
			assert.ok(bytes, `Unexpected asset request: ${url}`);
			return {
				ok: true,
				arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
			};
		};
		const source = new B1AssetBackedDistantSunLightSource({
			profile,
			asset: {
				assetRoot: 'https://cache.test/assets/',
				manifestPath: 'asset.json',
				manifestSha256: hash(manifest),
				assetIdentity: record.assetIdentity,
				condition,
			},
		});
		source.configureGeometryPlacement(profile.models.sourcePlacement.placement);
		controller = source.createCacheController({
			backend: {
				id: 'test',
				uploadImmutableTexture({storage}) {
					const resource = {
						storage,
						backendId: 'test',
						runtimeBinding: {},
						disposeCount: 0,
						dispose() {
							this.disposeCount += 1;
						},
					};
					textures.push(resource);
					return resource;
				},
			},
		});
		const cache = await controller.createScatteringCache();
		assert.equal(cache.cacheIdentity, record.assetIdentity);
		const shader = cache.createShaderContribution().functions[0].code;
		assert.match(shader, /distantSolarHermite/u);
		assert.match(shader, /density9 \+= weight \* distantSceneCubicDensity/u);
		assert.match(shader, /distantSceneBilinear\(plane \* 162/u);
		assert.equal(textures.length, 2);
	} finally {
		controller?.dispose();
		globalThis.fetch = previousFetch;
		if (previousLocation) Object.defineProperty(globalThis, 'location', previousLocation);
		else delete globalThis.location;
	}
	assert.ok(textures.every((resource) => resource.disposeCount === 1));
});
