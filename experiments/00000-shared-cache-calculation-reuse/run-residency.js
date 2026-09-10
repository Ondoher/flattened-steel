import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import ExperimentRun from './ExperimentRun.js';
import PersistedInventory from './PersistedInventory.js';
import ApplicationControls from './ApplicationControls.js';
import CacheWorkPlanner from './CacheWorkPlanner.js';

const run = new ExperimentRun();
await run.start('residency');
let reader;
try {
	const parent =
		'tmp/experiments/00000-shared-cache-calculation-reuse/runs/2026-09-10T22-20-27-162Z-application-96ad80bd-facf-410b-a6e5-50c5d4dc3e0b';
	const seal = JSON.parse((await run.read(`${parent}/sealed.json`)).toString('utf8'));
	assert.equal(seal.state, 'accepted');
	const artifact = seal.result.candidate;
	const hash = createHash('sha256');
	for await (const bytes of createReadStream(await run.files.resolve(artifact.path))) hash.update(bytes);
	assert.equal(hash.digest('hex'), artifact.sha256);
	run.parents.set(artifact.path, artifact);
	const controls = await new ApplicationControls().load(run);
	const definition = {
		configurationIdentity: controls.graph.configuration.configurationIdentity,
		artifact,
		coordinates: controls.inventory.coordinates,
		channels: 15,
		rowBytes: 4058 * 4,
	};
	await run.write('inventory-definition.json', definition);
	reader = new PersistedInventory(run, definition, 2);
	await reader.start();
	const requested = [
		definition.coordinates[0],
		definition.coordinates[1],
		definition.coordinates.at(-1),
		definition.coordinates[0],
	];
	const references = [];
	for (const coordinate of requested)
		references.push(await reader.read(definition.configurationIdentity, coordinate, 0));
	assert.ok(references[0].equals(references[3]));
	assert.equal(reader.stats.evictions, 2);
	const repeated = await reader.read(definition.configurationIdentity, requested[0], 0);
	assert.ok(repeated.equals(references[0]));
	assert.equal(reader.stats.hits, 1);
	assert.equal(reader.stats.peakResidentBytes, definition.rowBytes * 2);
	await assert.rejects(reader.read(definition.configurationIdentity + '-changed', requested[0], 0));
	await assert.rejects(reader.read(definition.configurationIdentity, [999, 999], 0));
	await assert.rejects(reader.read(definition.configurationIdentity, requested[0], 15));
	const planner = new CacheWorkPlanner();
	const sizes = [1, 17, 109, 10000];
	const scaling = sizes.map((count) => {
		const plan = planner.plan(
			Array.from({length: count}, (_, index) => ({
				id: `request-${index}`,
				configurationIdentity: definition.configurationIdentity,
				coordinates: requested,
			})),
		);
		assert.equal(plan.inventory.length, 3);
		return {
			requests: count,
			uniqueRows: plan.inventory.length,
			newCalculations: 0,
			indexCount: plan.requestedRows,
			reason: 'Every complete dependency key is present in the authenticated inventory.',
		};
	});
	for (const coordinate of requested) assert.ok(reader.locations.has(JSON.stringify(coordinate)));
	const stats = {...reader.stats};
	await reader.close();
	await run.write('residency-proof.json', {
		definition,
		stats,
		scaling,
		invalidation: true,
		operation: 'Authenticated persisted-row reload and LRU eviction; no GPU or arithmetic execution.',
	});
	await run.finish('accepted', {
		stage: 'E4-residency',
		stats,
		scaling,
		limitations: [
			'Request metadata grows with input size; only active row storage is bounded.',
			'The source candidate remains immutable; this run owns only the derived inventory definition and proof.',
		],
	});
} catch (error) {
	await reader?.close();
	await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
}
