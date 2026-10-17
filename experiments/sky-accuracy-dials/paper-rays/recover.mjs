import assert from 'node:assert/strict';
import {createRun, identity, readRepository, listFiles, verifyRun} from '../io/files.mjs';

/** Admit intact numerical data after the original post-compute cleanup heartbeat defect.
 * The original seal and verifier rejection remain unchanged.
 * @param {string} root @returns {void}
 */
function recover(root) {
	assert.equal(root, 'tmp/experiments/sky-accuracy-dials/runs/00360-h57-libradtran');
	const original = identity(root + '/sealed.json'),
		seal = JSON.parse(readRepository(original.path, original).toString());
	const run = createRun('h57-ref-data', {
		parents: [original],
		operation:
			'Authenticate every original artifact and inventory, require60 successful matched physical solver cases, and copy readings into a new run. Explicitly record the sole39.154-second post-compute cleanup heartbeat gap; do not relabel the original run as verifier-passing.',
		parameters: {
			original: root,
			exceptionScope:
				'Only the final progress interval after all60 calculations completed; no numerical, input, source, inventory or cleanup check is waived.',
		},
	});
	let failure = null;
	try {
		assert.throws(() => verifyRun(root), /Progress heartbeat gap exceeds contract/);
		assert.equal(seal.schemaId, 'sky-accuracy-run-seal-v1');
		assert.equal(seal.run, root);
		assert.equal(seal.state, 'accepted');
		assert.equal(seal.result.failure, null);
		assert.equal(seal.result.cases, 60);
		assert.deepEqual(seal.sourceFailures, []);
		assert.equal(seal.heartbeatFailure, null);
		assert.ok(seal.cleanup.absent);
		assert.equal(seal.cleanup.owner, root);
		const inventory = [original.path];
		for (const [i, a] of seal.artifacts.entries()) {
			assert.ok(a.path.startsWith(root + '/'));
			assert.ok(a.derivation.operation && Array.isArray(a.derivation.parents));
			assert.ok(!inventory.includes(a.path));
			readRepository(a.path, a);
			inventory.push(a.path);
			if (i % 20 === 0)
				run.progress(
					'authenticate',
					`Authenticated original artifacts: ${i}/${seal.artifacts.length}`,
					i,
					seal.artifacts.length,
				);
		}
		assert.deepEqual(listFiles(root), inventory.sort());
		const events = readRepository(root + '/progress.jsonl')
				.toString()
				.trim()
				.split('\n')
				.map((line) => JSON.parse(line)),
			gaps = [];
		for (let i = 1; i < events.length; i++) {
			const gap = Date.parse(events[i].timestamp) - Date.parse(events[i - 1].timestamp);
			if (gap > 35000) gaps.push({index: i, milliseconds: gap, previous: events[i - 1], next: events[i]});
		}
		assert.equal(gaps.length, 1);
		const gap = gaps[0];
		assert.equal(gap.index, events.length - 1);
		assert.equal(gap.milliseconds, 39154);
		assert.equal(gap.previous.message, '60/60 cases complete');
		assert.equal(gap.next.state, 'accepted');
		const input = identity(root + '/readings.json'),
			readings = /** @type {PaperRayLibReading[]} */ (JSON.parse(readRepository(input.path, input).toString()));
		assert.equal(readings.length, 60);
		for (let ray = 0; ray < 3; ray++)
			for (const order of [1, 2, 3, 4, 0])
				for (let repeat = 0; repeat < 4; repeat++) {
					const set = readings.filter(
						(r) => r.config.ray === ray && r.config.order === order && r.config.repeat === repeat,
					);
					assert.equal(set.length, 1);
					const r = set[0];
					assert.deepEqual(
						r.config.channels,
						Array.from({length: 40}, (_, i) => i),
					);
					assert.equal(r.spectrum.length, 40);
					assert.ok(r.spectrum.every((v) => Number.isFinite(v) && v >= 0));
					const manifest = JSON.parse(readRepository(r.toolRun + '/manifest.json').toString());
					assert.equal(manifest.status, 'succeeded');
					readRepository(r.raw.path, r.raw);
					assert.ok(
						manifest.artifacts.some((a) => a.path === 'execution/mc.rad.spc' && a.sha256 === r.raw.sha256),
					);
				}
		run.write('readings.json', readings, {
			parents: [original, input],
			operation:
				'Copy authenticated successful solver readings unchanged; every original case and raw output remains in its prior location.',
		});
		run.write('admission.json', {
			originalRun: root,
			originalVerifierPassing: false,
			originalVerifierRejection: 'Progress heartbeat gap exceeds contract.',
			numericalAndSourceChecks: true,
			artifactCount: seal.artifacts.length,
			cases: 60,
			cleanupAbsent: true,
			gap,
			disposition:
				'Admit intact numerical measurements with the disclosed monitoring defect. The historical seal is unchanged.',
		});
	} catch (e) {
		failure = e;
	}
	run.cleanup();
	run.finish(failure ? 'failed' : 'accepted', {failure: failure ? String(failure) : null});
	verifyRun(run.path);
	assert.equal(failure, null, String(failure));
	console.log(JSON.stringify({run: run.path}));
}
recover(process.argv[2]);
