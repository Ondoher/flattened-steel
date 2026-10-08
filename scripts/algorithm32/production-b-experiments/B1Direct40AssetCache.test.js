import assert from 'node:assert/strict';
import test from 'node:test';

import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import {B1AssetBackedDistantSunLightSource} from './B1AssetBackedDistantSunLightSource.js';

/**
 * Called by these source tests to obtain the canonical registered B1 execution profile.
 *
 * @returns {Algorithm32ExecutionProfile} - Exact Native48/Direct40 production control.
 */
function profile() {
	return createBrunetonProductionProfile({
		time: '09:30',
		fittedAzimuthDegrees: 91.14246195784821,
		maximumScatteringOrder: 4,
	});
}

test('creates only an asset-backed cache controller after geometry placement', () => {
	const selected = profile();
	const source = new B1AssetBackedDistantSunLightSource({
		profile: selected,
		asset: {assetIdentity: 'test-asset'},
	});
	source.configureGeometryPlacement(selected.models.sourcePlacement.placement);
	const controller = source.createCacheController({backend: {id: 'test-backend'}});
	assert.equal(typeof controller.createScatteringCache, 'function');
	assert.equal(typeof controller.dispose, 'function');
	assert.equal(source.sourceIrradiance.contentHash, selected.spectral.sourceIrradianceDensity.contentHash);
});

test('fails closed when no exact B1 asset is supplied', () => {
	const selected = profile();
	const source = new B1AssetBackedDistantSunLightSource({profile: selected, asset: null});
	source.configureGeometryPlacement(selected.models.sourcePlacement.placement);
	assert.throws(() => source.createCacheController({backend: {id: 'test-backend'}}), /verified exact cache asset/u);
});
