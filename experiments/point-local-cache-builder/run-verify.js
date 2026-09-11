import assert from 'node:assert/strict';
import ExperimentRun from './ExperimentRun.js';
import CacheInventory from './CacheInventory.js';
import CachePackage from './CachePackage.js';
import ProfileInputs from './ProfileInputs.js';

const run = new ExperimentRun();
await run.start('verify');
try {
	const names = [
		'00000-profiles',
		'00001-app-proof',
		'00002-app-proof',
		'00003-bruneton',
		'00004-run-controls',
		'00006-b1-qualification',
	];
	const results = [];
	for (const name of names) {
		const root = 'tmp/experiments/point-local-cache-builder/' + name;
		const seal = JSON.parse((await run.read(root + '/sealed.json')).toString('utf8'));
		assert.equal(seal.schemaId, 'point-local-builder-run-v1');
		for (const artifact of seal.artifacts) {
			assert(artifact.path.startsWith(root + '/'));
			await run.read(artifact.path, artifact);
		}
		results.push({root, state: seal.state, artifacts: seal.artifacts.length, result: seal.result});
	}
	const profiles = new ProfileInputs();
	const planner = new CacheInventory();
	const request = profiles.application();
	const scene = {id: 'daylight', zenithDegrees: 40, observerAltitudeMeters: 1.7};
	const original = planner.create(request, [scene], [0, 14]);
	const changed = JSON.parse(JSON.stringify(request));
	changed.transportSpec.domains.solarZenith.nodes[0].solarZenithDegrees = 2;
	assert.throws(() => planner.create(changed, [scene], [0, 14]), /matching executable/);
	const ozone = JSON.parse(JSON.stringify(request));
	ozone.transportSpec.atmosphere.ozone.absorptionEnabled = false;
	assert.throws(() => planner.create(ozone, [scene], [0, 14]), /Disabled ozone/);
	const duplicated = planner.create(
		request,
		Array.from({length: 257}, () => scene),
		[0, 14],
	);
	assert.deepEqual(duplicated.coordinates, original.coordinates);
	assert(
		duplicated.scenes.every((item) => JSON.stringify(item.indexes) === JSON.stringify(original.scenes[0].indexes)),
	);
	const root = 'tmp/experiments/point-local-cache-builder/00003-bruneton';
	const packet = JSON.parse((await run.read(root + '/cache.json')).toString('utf8'));
	const owner = new CachePackage();
	const decoded = await owner.readChannel(run, packet, 0);
	const directions = await run.read(packet.directionMap.path, packet.directionMap);
	const values = owner.expand(packet, 0, decoded, directions);
	assert.equal(values.length, packet.scenes[0].ledger.retainedBlockCount * packet.directionCount);
	const corrupt = structuredClone(packet);
	corrupt.scenes[0].indexes[0] = packet.coordinates.length;
	assert.throws(() => owner.expand(corrupt, 0, decoded, directions), /Invalid scene index/);
	await run.write('verification.json', {
		results,
		inputValidation: true,
		serializedPackageExpansionValues: values.length,
		duplicateRequests: 257,
		uniqueWorkUnchanged: true,
		implementationChange:
			'Additional domain-shape and disabled-ozone consistency rejection only; no calculation or serialization change since qualification.',
	});
	await run.read('tmp/experiments/point-local-cache-builder/00005-b1-qualification/progress.jsonl');
	assert.equal(
		results.find((result) => result.root.endsWith('/00006-b1-qualification')).state,
		'accepted',
		'Bruneton qualification must pass.',
	);
	await run.finish('accepted', {
		verifiedRuns: results.length,
		verifiedArtifacts: results.reduce((n, result) => n + result.artifacts, 0),
		serializedExpansion: true,
	});
} catch (error) {
	await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
}
