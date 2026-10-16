import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createRun, readRepository, verifyRun} from './io/files.mjs';

const started = performance.now(),
	source = verifyRun('tmp/experiments/sky-angular-quadrature/runs/00007-q2-base-full');
const seal = JSON.parse(readRepository(source.path, source, 64 * 1024 ** 2).toString());
assert.equal(seal.state, 'accepted');
assert.equal(seal.sourceFailures.length, 0);
assert.equal(seal.heartbeatFailure, null);
assert.ok(seal.storage.retainedBytes + source.byteLength < 64 * 1024 ** 2);
const allocation = verifyRun('tmp/experiments/sky-angular-quadrature/runs/00006-q2-allocation');
const run = createRun('q2-base-verify', {
	parents: [source, allocation],
	operation:
		'Verify the original immutable baseline seal, every artifact hash, exact inventory, progress timing and cleanup using the registered64MiB evidence ceiling. Preserve the original seal; no recurrence or view calculation is rerun.',
	parameters: {
		originalProcessExit: 1,
		reason: 'Original generic16MiB reader rejected the26MiB manifest after successful terminal publication. Repeated configuration inflated metadata; subsequent manifests use one definition parent.',
	},
});
try {
	run.write('verification.json', {
		source,
		terminalState: seal.state,
		artifacts: seal.artifacts.length,
		sourceFailures: seal.sourceFailures,
		heartbeatFailure: seal.heartbeatFailure,
		withinRegisteredRetainedCeiling: true,
		allArtifactHashesAndInventoryVerified: true,
		numericalReplay: false,
	});
	run.finish('accepted', {elapsedMilliseconds: performance.now() - started, baselineVerified: true});
	verifyRun(run.path);
	console.log(JSON.stringify({run: run.path, baselineVerified: true, sourceSeal: source.sha256}));
} catch (error) {
	run.finish('failed', {elapsedMilliseconds: performance.now() - started, message: String(error)});
	throw error;
}
