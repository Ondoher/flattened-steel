import assert from 'node:assert/strict';
import test from 'node:test';

import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import B1Direct40CacheAssetManifest, {
	B1_DIRECT40_CACHE_LAYOUT,
	B1_DIRECT40_CACHE_PAYLOAD_CODEC,
	B1_DIRECT40_DIRECTION_INDEX_CODEC,
} from './B1Direct40CacheAssetManifest.js';

const HASH = 'a'.repeat(64);
const CONDITION = Object.freeze({id: 'b1-09:30', localTime: '09:30'});

function profile() {
	return createBrunetonProductionProfile({time: '09:30', fittedAzimuthDegrees: 179.5, maximumScatteringOrder: 4});
}

function definition(selectedProfile = profile()) {
	return {
		profile: {
			id: selectedProfile.id,
			contentHash: selectedProfile.contentHash,
			schemaRevision: selectedProfile.schemaRevision,
			provenanceIdentity: selectedProfile.provenanceIdentity,
		},
		condition: {
			...CONDITION,
			instant: selectedProfile.models.sourcePlacement.observation.instant,
			directionToSource: selectedProfile.models.sourcePlacement.placement.directionToLight,
			sourceIdentity: selectedProfile.models.lightSource.id,
		},
		physical: {
			spectralBasisId: selectedProfile.spectral.basis.id,
			spectralBasisContentHash: selectedProfile.spectral.basis.contentHash,
			sourceIrradianceContentHash: selectedProfile.spectral.sourceIrradianceDensity.contentHash,
			atmosphereId: selectedProfile.models.atmosphere.id,
			geometryId: selectedProfile.models.geometry.id,
			groundId: selectedProfile.models.groundBoundary.id,
			groundAlbedoContentHash: selectedProfile.models.groundBoundary.albedo.contentHash,
		},
		domains: {
			position: {id: selectedProfile.domains.positions.id, count: 48},
			incoming: {id: selectedProfile.domains.incomingDirections.id, count: 68},
			outgoing: {
				id: selectedProfile.domains.outgoingDirections.id,
				faceWidth: 27,
				logicalCount: 4374,
				uniqueCount: 4058,
			},
			spectrum: {
				id: selectedProfile.spectral.basis.id,
				contentHash: selectedProfile.spectral.basis.contentHash,
				channelCount: 40,
			},
		},
		numerical: B1Direct40CacheAssetManifest.createProfileBoundary(selectedProfile, CONDITION).numerical,
		layout: {axisOrder: B1_DIRECT40_CACHE_LAYOUT, scalarType: 'float32-little-endian'},
		cumulativeScatteringDensity: {
			path: 'cumulative-scattering-density.f32',
			byteLength: 40 * 48 * 4058 * 4,
			sha256: HASH,
			codecId: B1_DIRECT40_CACHE_PAYLOAD_CODEC,
		},
		logicalToUniqueIndex: {
			path: 'logical-to-unique.u16',
			byteLength: 4374 * 2,
			sha256: HASH,
			codecId: B1_DIRECT40_DIRECTION_INDEX_CODEC,
		},
		derivation: {
			compilerIdentity: 'algorithm32-production-b1-direct40-offline-compiler-v1',
			productionRevision: 'test-production-revision',
			operation: 'construct cumulative J4 scattering density',
			inputs: {profileContentHash: selectedProfile.contentHash},
		},
	};
}

function recordWith(mutation) {
	const value = structuredClone(definition());
	mutation(value);
	return B1Direct40CacheAssetManifest.createRecord(value);
}

test('round-trips one exact content-addressed direct-40 production asset', () => {
	const selectedProfile = profile();
	const record = B1Direct40CacheAssetManifest.createRecord(definition(selectedProfile));
	const decoded = JSON.parse(JSON.stringify(record));
	const manifest = new B1Direct40CacheAssetManifest(decoded);

	manifest.requireCompatibility(selectedProfile, CONDITION);
	assert.deepEqual(manifest.toRecord(), decoded);
	assert.match(record.assetIdentity, /^algorithm32-b1-direct40-cache-sha256:[a-f0-9]{64}$/u);
	assert.equal(record.cumulativeScatteringDensity.byteLength, 31_165_440);
	assert.equal(record.logicalToUniqueIndex.byteLength, 8_748);
});

test('rejects wrong domain shapes, numerical order, payload shapes, hashes, and unsafe paths', () => {
	for (const [mutation, expected] of [
		[(value) => (value.domains.spectrum.channelCount = 15), /domain shape/u],
		[(value) => (value.domains.incoming.count = 34), /domain shape/u],
		[(value) => (value.numerical.maximumScatteringOrder = 3), /numerical controls/u],
		[(value) => (value.numerical.viewPathIntervalCount = 40), /numerical controls/u],
		[(value) => (value.numerical.viewPathSampleDistribution = 'uniform-distance'), /numerical controls/u],
		[(value) => (value.cumulativeScatteringDensity.byteLength -= 4), /byte shape/u],
		[(value) => (value.cumulativeScatteringDensity.sha256 = 'A'.repeat(64)), /lowercase SHA-256/u],
		[(value) => (value.logicalToUniqueIndex.path = '../index.u16'), /asset-relative/u],
		[(value) => (value.logicalToUniqueIndex.path = 'C:/index.u16'), /asset-relative/u],
	]) {
		assert.throws(() => new B1Direct40CacheAssetManifest(recordWith(mutation)), expected);
	}
});

test('rejects a manifest mutation not covered by a new content identity', () => {
	const record = structuredClone(B1Direct40CacheAssetManifest.createRecord(definition()));
	record.condition.localTime = '09:45';
	assert.throws(() => new B1Direct40CacheAssetManifest(record), /identity does not cover/u);
});

test('rejects the wrong profile, condition, source direction, basis, or domain before installation', () => {
	const selectedProfile = profile();
	for (const mutation of [
		(value) => (value.profile.contentHash = `sha256:${'b'.repeat(64)}`),
		(value) => (value.condition.localTime = '09:45'),
		(value) => (value.condition.directionToSource = [0, 0, 1]),
		(value) => (value.physical.spectralBasisContentHash = `sha256:${'b'.repeat(64)}`),
		(value) => (value.domains.incoming.id = 'wrong-incoming-domain'),
	]) {
		const manifest = new B1Direct40CacheAssetManifest(recordWith(mutation));
		assert.throws(
			() => manifest.requireCompatibility(selectedProfile, CONDITION),
			/incompatible with the requested/u,
		);
	}
});
