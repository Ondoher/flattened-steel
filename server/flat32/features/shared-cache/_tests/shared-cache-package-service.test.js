import assert from 'node:assert/strict';
import {test} from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Service from '../DistantSunSharedCachePackageService.js';

const repository = fileURLToPath(new URL('../../../../../', import.meta.url));
const packageRoot = path.join(
	repository,
	'tmp/production-algorithm32/distant-sun-shared-block-cache/runs/2026-09-10T14-57-40-947Z-f747d2ec-9571-474f-89e6-b0783bbf3752/published/7e80317f53c79d0d5a30ebc006630213a2e758008c62a3abb14d2534a8cc2b99',
);
const report = {
	path: 'package-set.json',
	byteLength: 3268,
	sha256: 'eee22091d2f1deb8e992f22be47243a07e7f4bc9462d25ee89683352cca19069',
};

test('shared service authenticates graph, preserves the final illuminated bin, and returns exact complete files', async () => {
	const service = await new Service(packageRoot).load(report);
	const ready = service.resolve(107.75, '/flat32/scene-caches/');
	assert.equal(ready.status, 'ready');
	assert.equal(ready.representativeSolarZenithDegrees, 108);
	assert.equal(service.resolve(108, '/flat32/scene-caches/').status, 'dark');
	const asset = await service.resolveAsset(`${ready.asset.packageSetIdentity}/package-set.json`);
	assert.equal(asset.byteLength, report.byteLength);
	assert.equal(asset.bytes.byteLength, report.byteLength);
	assert.equal(asset.contentType, 'application/json');
	for (const value of [-1, 181, NaN, Infinity]) assert.throws(() => service.resolve(value, '/flat32/scene-caches/'));
	for (const suffix of [
		'../package-set.json',
		'%2e%2e/package-set.json',
		'package-set.json:stream',
		'unknown.json',
		'/package-set.json',
	])
		await assert.rejects(service.resolveAsset(`${ready.asset.packageSetIdentity}/${suffix}`));
	await assert.rejects(service.resolveAsset(`${'0'.repeat(64)}/package-set.json`));
	await assert.rejects(service.load(report));
});

test('shared service rejects untrusted report bytes, oversized input, and external roots', async () => {
	assert.throws(() => new Service(path.parse(repository).root));
	await assert.rejects(new Service(packageRoot).load({...report, sha256: '0'.repeat(64)}));
	await assert.rejects(new Service(packageRoot).load({...report, byteLength: 33 * 1024 * 1024}));
	await assert.rejects(new Service(packageRoot).load({...report, path: '../package-set.json'}));
});
