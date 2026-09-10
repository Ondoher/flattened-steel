import {createHash} from 'node:crypto';
import {open} from 'node:fs/promises';
import assert from 'node:assert/strict';
import ExperimentRun from './ExperimentRun.js';
import ApplicationControls from './ApplicationControls.js';
import CacheWorkPlanner from './CacheWorkPlanner.js';

const run = new ExperimentRun();
await run.start('inventory');
const handles = [];
try {
	const controls = await new ApplicationControls().load(run);
	const {inventory, graph, acceptance, parents} = controls;
	const configurationIdentity = graph.configuration.configurationIdentity;
	const requests = inventory.scenes.map((scene) => ({
		id: scene.manifest.sceneSun.id,
		configurationIdentity,
		coordinates: scene.coordinates.map((key) => key.split(':').map(Number)),
	}));
	const planner = new CacheWorkPlanner();
	const plan = planner.plan(requests);
	assert.equal(plan.inventory.length, inventory.coordinates.length);
	assert.equal(planner.plan([]).inventory.length, 0);
	for (const order of [
		[...requests].reverse(),
		[...requests, ...requests],
		[requests[0], requests[1], requests[0]],
	]) {
		const proof = planner.plan(order);
		for (const [ordinal, request] of order.entries()) {
			assert.deepEqual(
				proof.scenes[ordinal].slots.map((slot) => proof.inventory[slot].coordinate),
				request.coordinates,
			);
		}
		assert.ok(proof.inventory.length <= plan.inventory.length);
	}
	const repeated = planner.plan(Array.from({length: 10000}, () => requests[0]));
	assert.equal(repeated.inventory.length, requests[0].coordinates.length);
	assert.equal(repeated.scenes.length, 10000);
	assert.equal(
		planner.plan([requests[0], {...requests[0], configurationIdentity: configurationIdentity + '-changed'}])
			.inventory.length,
		requests[0].coordinates.length * 2,
	);
	assert.throws(() => planner.plan([{...requests[0], coordinates: [[-0, 0]]}]));
	assert.throws(() => planner.plan([{...requests[0], coordinates: [[NaN, 0]]}]));
	await run.write('plan.json', plan);
	const gpu = parents['common-field-gpu-execution'];
	const summary = {
		scenes: requests.length,
		requestedRows: plan.requestedRows,
		uniqueRows: plan.inventory.length,
		channels: inventory.buildRequest.transportSpec.domains.spectrum.channels.length,
		sharedBlocks: graph.blockIndex.blocks.length,
		existingCommonFieldComputations: gpu.wavelengths.length,
		existingFieldPasses: gpu.wavelengths.reduce((sum, wavelength) => sum + wavelength.timings.length, 0),
		existingPerZenithFinishes:
			gpu.wavelengths.reduce((sum, wavelength) => sum + wavelength.timings.length, 0) * 180,
		baselineGpuMilliseconds: gpu.elapsedMilliseconds,
		baselineTotalMilliseconds: acceptance.elapsedMilliseconds,
		additionalCandidates: [
			'retain identical projection program and direction resources',
			'pool exact-layout scratch allocations',
			'batch GPU completion at field boundaries without changing draw order',
			'persist result inventory for overlapping subsequent requests',
		],
		unprovenCandidates: [
			'cross-wavelength geometry intermediates',
			'uniform spectral parameters preserving exact output',
			'cross-frame symmetry',
		],
		plannerCases: {
			empty: true,
			reordered: true,
			repeated: true,
			overlapping: true,
			changedDependency: true,
			largeRequestCount: repeated.scenes.length,
		},
	};
	await run.write('inventory.json', summary);
	run.progress({phase: 'effort-checkpoint', message: JSON.stringify(summary)});
	const owners = new Map();
	for (const [ordinal, block] of graph.blockIndex.blocks.entries()) {
		const relative = `${controls.root}/staging/block-${String(ordinal).padStart(3, '0')}.f32`;
		await run.read(relative, {...block.decoded, path: relative});
		const handle = await open(await run.files.resolve(relative), 'r');
		handles.push(handle);
		for (const [row, coordinate] of block.coordinates.entries())
			owners.set(coordinate.join(':'), {handle, row, count: block.rowCount});
	}
	const rowBytes = 4058 * 4;
	const rowBuffer = Buffer.alloc(rowBytes);
	const reconstructed = [];
	for (const [ordinal, scene] of plan.scenes.entries()) {
		const digest = createHash('sha256');
		for (let channel = 0; channel < summary.channels; channel += 1) {
			for (const slot of scene.slots) {
				const owner = owners.get(plan.inventory[slot].coordinate.join(':'));
				assert.ok(owner);
				const result = await owner.handle.read(
					rowBuffer,
					0,
					rowBytes,
					(channel * owner.count + owner.row) * rowBytes,
				);
				assert.equal(result.bytesRead, rowBytes);
				digest.update(rowBuffer);
			}
		}
		const sha256 = digest.digest('hex');
		assert.equal(sha256, inventory.scenes[ordinal].manifest.exactSeamPayload.sha256);
		reconstructed.push({id: scene.id, sha256, exact: true});
		run.progress({
			phase: 'reconstruction',
			completed: ordinal + 1,
			total: plan.scenes.length,
			message: `Exact reconstruction: ${scene.id}`,
		});
	}
	await run.write('reconstruction.json', {
		operation: 'SHA-256 of channel-major rows addressed through new inventory indexes',
		scenes: reconstructed,
		bufferBytes: rowBytes,
		comparisonAuthority: 'authenticated original control payload digests',
	});
	await Promise.all(handles.splice(0).map((handle) => handle.close()));
	await run.finish('accepted', {
		stages: ['E1', 'E2'],
		summary,
		reconstructedScenes: reconstructed.length,
		limitation: 'Existing-byte inventory reconstruction proves mapping, not new GPU arithmetic.',
	});
} catch (error) {
	await Promise.all(handles.splice(0).map((handle) => handle.close()));
	await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
}
