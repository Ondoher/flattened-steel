import assert from 'node:assert/strict';
import ExperimentRun from './ExperimentRun.js';
import CachePackage from './CachePackage.js';
import BrunetonEvaluation from './BrunetonEvaluation.js';

const run = new ExperimentRun();
await run.start('b1-qualification');
try {
	const source = 'tmp/experiments/point-local-cache-builder/00003-bruneton';
	const seal = JSON.parse((await run.read(source + '/sealed.json')).toString('utf8'));
	const identity = seal.artifacts.find((artifact) => artifact.path === source + '/cache.json');
	assert(identity, 'Parent run must contain a completed, hashed cache package.');
	const packet = JSON.parse((await run.read(identity.path, identity)).toString('utf8'));
	await run.write('parent-cache.json', {
		source,
		parentState: seal.state,
		manifest: identity,
		operation:
			'Read and authenticate the completed serialized cache; perform expansion and accepted Q30 view qualification without GPU regeneration.',
	});
	await run.read('scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationCodec.js');
	const directions = await run.read(packet.directionMap.path, packet.directionMap);
	const result = await new BrunetonEvaluation().run(run, packet, new CachePackage(), directions);
	await run.finish(result.accepted ? 'accepted' : 'rejected', result);
} catch (error) {
	await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
}
