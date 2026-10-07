import assert from 'node:assert/strict';
import test from 'node:test';

import {CAPTURE_TIMES} from '../../experiments/b1-directional-sky-radiance/benchmark-domain.js';
import B1Direct40CacheAssetSetManifest, {B1_DIRECT40_PROFILE_FAMILY} from './B1Direct40CacheAssetSetManifest.js';

const HASH = 'a'.repeat(64);

/** Called by asset-set tests to construct an ordered complete benchmark set.
 *
 * @returns {object} - Valid serialized set fixture.
 */
function definition() {
	return {
		profileFamily: B1_DIRECT40_PROFILE_FAMILY,
		productionRevision: 'test-production-revision',
		assets: CAPTURE_TIMES.map((localTime, index) => ({
			condition: {id: `b1-${localTime}`, localTime, fittedAzimuthDegrees: 160 + index},
			manifestPath: `condition-${localTime.replace(':', '')}/asset-manifest-${HASH}.json`,
			manifestSha256: HASH,
			assetIdentity: `algorithm32-b1-direct40-cache-sha256:${HASH}`,
			profile: {id: `profile-${localTime}`, contentHash: `sha256:${HASH}`},
		})),
	};
}

test('binds the complete ordered 17-condition direct-40 asset set', () => {
	const record = B1Direct40CacheAssetSetManifest.createRecord(definition());
	const decoded = JSON.parse(JSON.stringify(record));
	assert.deepEqual(new B1Direct40CacheAssetSetManifest(decoded).toRecord(), decoded);
	assert.match(record.setIdentity, /^algorithm32-b1-direct40-cache-set-sha256:[a-f0-9]{64}$/u);
});

test('rejects incomplete, reordered, unsafe, and revision-free asset sets', () => {
	for (const [mutation, expected] of [
		[(value) => value.assets.pop(), /all 17/u],
		[(value) => value.assets.reverse(), /canonical order/u],
		[(value) => (value.assets[0].manifestPath = '../asset.json'), /set-relative/u],
		[(value) => (value.assets[0].manifestPath = 'C:/asset.json'), /set-relative/u],
		[(value) => (value.productionRevision = ''), /production revision/u],
	]) {
		const value = definition();
		mutation(value);
		assert.throws(
			() => new B1Direct40CacheAssetSetManifest(B1Direct40CacheAssetSetManifest.createRecord(value)),
			expected,
		);
	}
});

test('rejects mutations not covered by a new set identity', () => {
	const record = structuredClone(B1Direct40CacheAssetSetManifest.createRecord(definition()));
	record.assets[0].manifestSha256 = 'b'.repeat(64);
	assert.throws(() => new B1Direct40CacheAssetSetManifest(record), /identity does not cover/u);
});

test('binds the refined family to its explicit domain while retaining all 17 conditions', () => {
	const value = {
		...definition(),
		positionDomain: 'native51-near-ground',
		profileFamily: B1Direct40CacheAssetSetManifest.profileFamilyFor('native51-near-ground'),
	};
	const record = B1Direct40CacheAssetSetManifest.createRecord(value);
	assert.equal(new B1Direct40CacheAssetSetManifest(record).toRecord().positionDomain, 'native51-near-ground');
	assert.throws(
		() =>
			new B1Direct40CacheAssetSetManifest(
				B1Direct40CacheAssetSetManifest.createRecord({...value, positionDomain: undefined}),
			),
		/family/,
	);
	assert.throws(
		() =>
			new B1Direct40CacheAssetSetManifest(
				B1Direct40CacheAssetSetManifest.createRecord({...value, profileFamily: B1_DIRECT40_PROFILE_FAMILY}),
			),
		/family/,
	);
	assert.throws(
		() =>
			new B1Direct40CacheAssetSetManifest(
				B1Direct40CacheAssetSetManifest.createRecord({...value, assets: value.assets.slice(0, 1)}),
			),
		/all 17/,
	);
});
