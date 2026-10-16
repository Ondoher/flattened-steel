import assert from 'node:assert/strict';
import {appendFileSync, existsSync, readdirSync, rmdirSync, unlinkSync, writeFileSync} from 'node:fs';
import {identity, readRepository, resolveRepository, storage, verifyRun} from '../io/files.mjs';

/** Close the one stopped, previously unsealed repair attempt without changing any completed evidence.
 * @returns {void} Publishes its first terminal seal; wrong ownership, existing seal, unexpected files or hash failure abort finalization.
 */
function main() {
	const run = 'tmp/experiments/sky-accuracy-dials/runs/00275-h33-recovery';
	const definition = /** @type {HorizonSecondOrderInterruptedDefinition} */ (
		JSON.parse(readRepository(run + '/definition.json').toString())
	);
	assert.equal(definition.run, run);
	assert.ok(!existsSync(resolveRepository(run + '/sealed.json', run, false)));
	assert.deepEqual(readdirSync(resolveRepository(run)).sort(), [
		'definition.json',
		'progress.jsonl',
		'source-reconstruction.json',
	]);
	// Operator observed the process stopped at this captured UTC clock reading.
	// Recording that terminal observation now does not invent intervening heartbeats.
	const stoppedAt = '2026-10-15T23:03:13.000Z';
	const first = JSON.parse(
		readRepository(run + '/progress.jsonl')
			.toString()
			.split('\n')[0],
	);
	const elapsedMilliseconds = Date.parse(stoppedAt) - Date.parse(first.timestamp);
	assert.ok(elapsedMilliseconds > 0 && elapsedMilliseconds < 100000);
	const scratch = 'tmp/experiments/sky-accuracy-dials/scratch/2ab04526-5c1a-4add-8ec9-06c5cfc4f951';
	const directory = resolveRepository(scratch, 'tmp/experiments/sky-accuracy-dials/scratch');
	assert.deepEqual(readdirSync(directory), ['owner.json']);
	const owner = readRepository(scratch + '/owner.json'),
		parsed = JSON.parse(owner.toString());
	assert.equal(parsed.owner, run);
	assert.deepEqual(parsed.recipe, definition.recipe);
	unlinkSync(resolveRepository(scratch + '/owner.json', scratch));
	rmdirSync(directory);
	appendFileSync(
		resolveRepository(run + '/progress.jsonl', run),
		JSON.stringify({
			timestamp: stoppedAt,
			phase: 'terminal',
			state: 'interrupted',
			message:
				'Operator stopped repair because per-direction storage traversal was unexpectedly expensive; no receiver recomputation completed. Terminal observation recorded after stop.',
		}) + '\n',
	);
	const artifacts = ['definition.json', 'source-reconstruction.json', 'progress.jsonl'].map((name) => ({
		...identity(run + '/' + name),
		derivation: definition.recipe,
	}));
	const seal = {
		schemaId: 'sky-accuracy-run-seal-v1',
		run,
		state: 'interrupted',
		finishedAt: stoppedAt,
		result: {
			elapsedMilliseconds,
			reason: 'Costly guard invocation at every direction; bounded repair stopped before further expensive work.',
		},
		recipe: definition.recipe,
		sources: definition.sources,
		sourceFailures: [],
		artifacts,
		cleanup: {path: scratch, owner: run, highWaterBytes: owner.length, absent: !existsSync(directory)},
		storage: storage(),
		heartbeatFailure: null,
		finalizer: identity('experiments/sky-accuracy-dials/horizon-migration/second-order-interrupt.mjs'),
	};
	writeFileSync(resolveRepository(run + '/sealed.json', run, false), JSON.stringify(seal) + '\n', {flag: 'wx'});
	verifyRun(run);
	console.log(JSON.stringify({run, state: seal.state, elapsedMilliseconds}));
}
main();
