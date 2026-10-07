import assert from 'node:assert/strict';
import {appendFileSync, existsSync, rmSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {
	identity,
	readRepository,
	resolveRepository,
	outputRelative,
	listFiles,
	storage,
	verifyRun,
	repositoryRoot,
} from '../../io/files.mjs';

// This recovery is deliberately restricted to the single interrupted, still-open
// attempt. It cannot reopen a seal or alter any original artifact/definition.
const run = `${outputRelative}/runs/00226-remain-observe`;
const scratch = `${outputRelative}/scratch/4e00fd78-c12a-4d4e-ae24-069b56b39c84`;
assert.equal(process.argv[2], '38240', 'Only the observed stalled runner PID is admitted.');
assert.ok(!existsSync(resolveRepository(run + '/sealed.json', run, false)));
const definitionId = identity(run + '/definition.json');
const definition = JSON.parse(readRepository(definitionId.path, definitionId).toString());
assert.equal(definition.run, run);
assert.equal(definition.recipe.parameters.caseId, 'remaining-observation-v1');
const ownerId = identity(scratch + '/owner.json');
const owner = JSON.parse(readRepository(ownerId.path, ownerId).toString());
assert.equal(owner.owner, run);
assert.deepEqual(owner.recipe, definition.recipe);
for (const source of definition.sources) readRepository(source.path, source);
const recoverySource = identity(path.relative(repositoryRoot, fileURLToPath(import.meta.url)).replaceAll('\\', '/'));
const priorArtifacts = listFiles(run).map((file) => identity(file));
assert.deepEqual(
	priorArtifacts.map((id) => id.path.split('/').at(-1)).sort(),
	[
		'definition.json',
		'geometry.json.gz',
		'observation-audit.json',
		'observation-plan.md',
		'progress.jsonl',
		'proof.json',
		'sources.json.gz',
	].sort(),
);
const scratchAbsolute = resolveRepository(scratch, outputRelative + '/scratch');
const scratchBytes = listFiles(scratch).reduce((sum, file) => sum + identity(file).byteLength, 0);
const observedAt = new Date().toISOString();
process.kill(Number(process.argv[2]), 'SIGTERM');
await new Promise((resolve) => setTimeout(resolve, 1000));
assert.throws(() => process.kill(Number(process.argv[2]), 0), 'Stalled runner must be stopped before finalization.');
// Every descendant was real-path checked above, and the exact ownership record
// is reauthenticated immediately before removing only this stopped browser tree.
readRepository(ownerId.path, ownerId);
assert.equal(resolveRepository(scratch, outputRelative + '/scratch'), scratchAbsolute);
rmSync(scratchAbsolute, {recursive: true, force: false});
const cleanup = {path: scratch, owner: run, highWaterBytes: scratchBytes, absent: !existsSync(scratchAbsolute)};
assert.ok(cleanup.absent);
const recovery = {
	schemaId: 'sky-remaining-interruption-finalization-v1',
	observedAt,
	runnerPid: 38240,
	implementation: recoverySource,
	originalDefinition: definitionId,
	priorArtifacts,
	scratchOwner: ownerId,
	operation:
		'Preserve every existing artifact; close the owned responsive blank-page browser through DevTools, terminate the still-waiting runner, remove authenticated owned scratch, append an interrupted terminal event and seal the failed attempt.',
	observation:
		'Browser page setup remained pending for several minutes; both about:blank pages answered read-only Runtime.evaluate. Browser.close did not settle the runner. No GPU output was returned. GPU execution count is unknown; the allocated GPU attempt remains fully charged.',
	scratchHighWaterUnavailable: true,
	measuredScratchBytesAtRecovery: scratchBytes,
};
writeFileSync(resolveRepository(run + '/interruption.json', run, false), JSON.stringify(recovery) + '\n', {flag: 'wx'});
writeFileSync(
	resolveRepository(run + '/recovery-source.mjs', run, false),
	readRepository(recoverySource.path, recoverySource),
	{flag: 'wx'},
);
appendFileSync(
	resolveRepository(run + '/progress.jsonl', run),
	JSON.stringify({
		timestamp: new Date().toISOString(),
		phase: 'terminal',
		message: 'Interrupted browser setup; original evidence preserved by narrow recovery.',
		state: 'interrupted',
	}) + '\n',
);
const artifacts = listFiles(run).map((file) => ({
	...identity(file),
	derivation: {
		parents: [definitionId, recoverySource, ...definition.recipe.parents],
		operation: file.endsWith('interruption.json')
			? recovery.operation
			: 'Preserve bytes produced by the original authenticated runner before interruption; terminal progress append is described in interruption.json.',
	},
}));
const elapsed = Date.now() - Date.parse(definition.recipe.parameters.admission.admittedAt ?? observedAt);
const events = readRepository(run + '/progress.jsonl')
	.toString()
	.trim()
	.split('\n')
	.map((line) => JSON.parse(line));
const allocationTime = Date.parse(events[0].timestamp);
const seal = {
	schemaId: 'sky-accuracy-run-seal-v1',
	run,
	state: 'interrupted',
	finishedAt: new Date().toISOString(),
	result: {
		caseId: 'remaining-observation-v1',
		failure: recovery.observation,
		jobElapsedMilliseconds: Math.max(elapsed, Date.now() - allocationTime + 120000),
		elapsedCharge:
			'Conservative allocation-to-recovery elapsed plus 120 seconds for preallocation admission; original timer unavailable.',
		gpuJobsExecuted: null,
		proofChecks: 42,
		newCpuRadianceIntegrations: 0,
	},
	recipe: definition.recipe,
	sources: definition.sources,
	sourceFailures: [],
	artifacts,
	cleanup,
	storage: storage(),
	heartbeatFailure: null,
};
writeFileSync(resolveRepository(run + '/sealed.json', run, false), JSON.stringify(seal) + '\n', {flag: 'wx'});
console.log(JSON.stringify({seal: verifyRun(run), state: seal.state, result: seal.result, cleanup}));
