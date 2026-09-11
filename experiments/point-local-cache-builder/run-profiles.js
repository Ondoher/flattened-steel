import assert from 'node:assert/strict';
import ExperimentRun from './ExperimentRun.js';
import ProfileInputs from './ProfileInputs.js';
import CacheInventory from './CacheInventory.js';
import reference from './bruneton-inputs.json' with {type: 'json'};

const run = new ExperimentRun();
await run.start('profiles');
try {
	const source = await run.read(reference.derivation.sourcePath);
	assert.equal(run.files.hash(source), reference.derivation.sha256);
	for (const file of [
		'DistantSunSceneCacheCompilerInputs.js',
		'DistantSunSceneCacheGpuCompiler.js',
		'DistantSunSharedCacheGenerationInventory.js',
		'DistantSunSharedCacheGenerationStaging.js',
		'DistantSunSharedCacheGenerationCodec.js',
	])
		await run.read('scripts/algorithm32/solar-zenith-cache/' + file);
	await run.read('src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheLedger.js');
	const targetRoot = 'tmp/extraterrestrial/color-reset/runs/000065-color-reset-qualification';
	const target = await run.read(targetRoot + '/data/b1-point-local-direct40-w27-q30.tsv');
	assert.equal(run.files.hash(target), 'e6d62e23ec0184cc9941e8305d4ea9e69691cf996d5bce8523afb641830ce634');
	await run.read(targetRoot + '/inputs.json');
	await run.read(targetRoot + '/artifact-manifest.json');
	const profiles = new ProfileInputs();
	const application = profiles.application(),
		bruneton = profiles.bruneton();
	assert.equal(application.transportSpec.domains.spectrum.channels.length, 15);
	assert.equal(application.transportSpec.atmosphere.ozone.absorptionEnabled, true);
	assert.equal(application.transportSpec.atmosphere.ozone.dobsonUnits, 300);
	assert.equal(bruneton.transportSpec.domains.spectrum.channels.length, 40);
	assert.equal(bruneton.transportSpec.atmosphere.ozone.absorptionEnabled, false);
	assert(bruneton.transportSpec.atmosphere.ozone.crossSectionTable.values.every((value) => value === 0));
	assert.equal(bruneton.transportSpec.numerical.transportIntervalCount, 40);
	assert(
		bruneton.transportSpec.domains.spectrum.channels.every(
			(channel, index) =>
				channel.groundAlbedo === reference.channels[index].groundAlbedo &&
				channel.rayleighScatteringPerMeter === reference.channels[index].rayleighScatteringPerMeter,
		),
	);
	const scenes = profiles.brunetonScenes();
	const planner = new CacheInventory();
	const inventory = planner.create(
		bruneton,
		scenes,
		reference.channels.map((_, index) => index),
	);
	const duplicate = planner.create(bruneton, [scenes[0], scenes[0]], [0, 39]);
	assert.deepEqual(duplicate.scenes[0].indexes, duplicate.scenes[1].indexes);
	assert.equal(duplicate.coordinates.length, duplicate.scenes[0].indexes.length);
	assert(inventory.blocks.every((block) => block.coordinates.length * 40 * 4058 * 4 <= 16 * 1024 * 1024));
	await assert.rejects(new ExperimentRun().allocate('seventeenlettersx'), /1-16/);
	await run.write('profiles.json', {
		application,
		bruneton,
		scenes,
		viewIntegration: {
			intervalCount: 30,
			distribution: 'quadratic-near-observer',
			source: 'accepted run 65 inherited point-local B1 integrator',
		},
		acceptance: {
			application: 'exact Float32 values and expanded control rows',
			bruneton: {
				allChannelMaximumAbsoluteWatts: 2e-7,
				allChannelRmsWatts: 5e-8,
				scoreDifferenceMilliwatts: 0.001,
			},
			basis: 'Float32 cache calculation with binary64 view integration; compare every radiance, not only aggregate score',
		},
	});
	await run.write('inventory.json', {
		scenes: scenes.length,
		unionRows: inventory.coordinates.length,
		blocks: inventory.blocks.length,
		logicalDirections: inventory.directionCount,
		uniqueDirections: inventory.uniqueCount,
		channelCount: inventory.channelCount,
		duplicateSceneRowsShared: duplicate.coordinates.length,
	});
	await run.finish('accepted', {
		stage: 1,
		profileSourcesPinned: true,
		ozoneSupported: true,
		brunetonOzone: false,
		limitations: ['No GPU calculation or run 65 reproduction has been established by this input proof.'],
	});
} catch (error) {
	await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
}
