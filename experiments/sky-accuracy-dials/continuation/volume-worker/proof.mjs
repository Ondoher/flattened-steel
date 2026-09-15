import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {loadInputs} from '../../execution.mjs';
import {readRepository, verifyRun} from '../../io/files.mjs';
import {evaluateVolumeFirstOrder} from '../volume-reference/index.mjs';
import {createVolumeWorkerPool} from './pool.mjs';

/** Remove only measured pass durations; all method values and work remain exact.
 * @param {SkyPhysicalMethodResult} method - Original numerical method record.
 * @returns {SkyVolumeWorkerComparableMethod} Stable numerical and admission diagnostics.
 */
function numericalMethod(method) {
	return {
		...method,
		passes: method.passes.map(({elapsedMilliseconds, ...numerical}) => numerical),
	};
}

/** Replay eight original incident nodes and exercise bounded pool lifecycle failures.
 * Reads authenticated immutable evidence; writes no files and creates no scientific
 * run. The pilot retained complete channels and aggregate work, while fresh serial
 * evaluations provide the full non-timing method comparison for these exact rays.
 * @returns {Promise<SkyVolumeWorkerProof>} Actual focused local verification outcome.
 */
export async function volumeWorkerProof() {
	assert.equal(process.version, 'v25.4.0', 'Use the pinned original Node runtime.');
	const started = performance.now();
	const pilotRoot = 'tmp/experiments/sky-accuracy-dials/runs/00161-volume-j2-pilot';
	const pilotSeal = verifyRun(pilotRoot);
	assert.equal(pilotSeal.sha256, '59b8585633fbd21f2a6bd6fc04ac287000d8c8843f425587267a508cd76e2cdb');
	/** @type {SkyVolumeWorkerPilotSeal} */
	const seal = JSON.parse(readRepository(pilotSeal.path, pilotSeal).toString());
	assert.equal(seal.state, 'accepted');
	/** @param {string} name - Exact retained artifact basename. @returns {Buffer} Authenticated bytes. */
	const artifact = (name) => {
		const identity = seal.artifacts.find((item) => item.path === `${pilotRoot}/${name}`);
		assert.ok(identity, `Missing original pilot artifact: ${name}`);
		return readRepository(identity.path, identity);
	};
	/** @type {SkyVolumeJ2Node[]} */
	const nodes = JSON.parse(
		gunzipSync(artifact('incident-nodes.json.gz'), {maxOutputLength: 16 * 1024 ** 2}).toString(),
	);
	/** @type {SkyVolumeJ2Document} */
	const reference = JSON.parse(artifact('reference.json').toString());
	assert.ok(reference.matrixComplete && reference.predictionsPassed);
	assert.deepEqual(reference.channels, [0, 8]);
	const spec = loadInputs().native48.transportSpec;
	const channels = reference.channels;
	// Start with a costly escaping ray and a short ground ray so genuine worker
	// completion order differs from the input order; remaining nodes span all heights.
	const addresses = [
		['p-1230-3-5:h1000', 84],
		['p-1230-3-5:h0.001', 51],
		['p-0930-5-7:h0.001', 0],
		['p-0930-5-7:h1', 105],
		['p-0930-5-7:h1000', 144],
		['p-0930-5-7:h8000', 0],
		['p-1230-3-5:h1', 180],
		['p-1230-3-5:h8000', -1],
	];
	const selected = addresses.map(([targetId, index]) => {
		const node = nodes.find(
			(item) =>
				item.targetId === targetId &&
				(index === -1 ? item.mirrorOf !== null : item.index === index && item.mirrorOf === null),
		);
		assert.ok(node, `Missing original incident ${targetId}/${index}`);
		return node;
	});
	const tasks = selected.map((node) => {
		const target = reference.targets.find((item) => item.id === node.targetId);
		assert.ok(target, 'Every original incident has its original physical origin.');
		return {
			id: `${node.targetId}/${node.index}/${node.mirrorOf ?? 'representative'}`,
			origin: target.origin,
			direction: node.direction,
		};
	});
	let checks = 0;
	/** @param {unknown} actual - Observed value. @param {unknown} expected - Independent required value.
	 * @param {string} message - Concrete checked claim.
	 */
	function equal(actual, expected, message) {
		assert.deepEqual(actual, expected, message);
		checks++;
	}
	/** @type {string[]} */
	const completionIds = [];
	/** @type {number[]} */
	const completionCounts = [];
	const deadlineEpochMilliseconds = Date.now() + 30_000;
	/** Cooperative serial proof deadline, also exercised as the caller pool guard. */
	const guard = () => {
		if (Date.now() >= deadlineEpochMilliseconds) throw new Error('Local volume worker proof deadline.');
	};
	const pool = createVolumeWorkerPool(spec, channels, {
		workerCount: 2,
		deadlineEpochMilliseconds,
		guard,
		onComplete: (count, id) => {
			completionCounts.push(count);
			completionIds.push(id);
		},
	});
	try {
		const pending = pool.evaluate(tasks);
		await assert.rejects(pool.evaluate(tasks), /active batch/);
		checks++;
		const rows = await pending;
		equal(
			rows.map((row) => row.id),
			tasks.map((task) => task.id),
			'Results preserve exact caller order.',
		);
		equal(completionCounts, [1, 2, 3, 4, 5, 6, 7, 8], 'Completion notification counts actual finished rays.');
		assert.notDeepEqual(
			completionIds,
			tasks.map((task) => task.id),
			'Actual completion order differs from caller order.',
		);
		checks++;
		for (const [index, row] of rows.entries()) {
			const original = selected[index];
			equal(
				row.result.channels,
				original.channels,
				'Complete channel estimates and admissions exactly reproduce the immutable pilot.',
			);
			equal(
				row.result.geometry.branch,
				original.branch,
				'Original independently classified branch is unchanged.',
			);
			equal(
				row.result.methods.reduce((sum, method) => sum + method.mediumEvaluations, 0),
				original.mediumEvaluations,
				'Original medium work is exact.',
			);
			equal(
				row.result.methods.reduce((sum, method) => sum + method.outerEvaluations, 0),
				original.outerEvaluations,
				'Original outer work is exact.',
			);
			const serial = evaluateVolumeFirstOrder(spec, tasks[index].origin, tasks[index].direction, channels, {
				profile: 'simpson-expanded-medium',
				outerStrategy: 'global',
				guard,
			});
			equal(
				row.result.methods.map(numericalMethod),
				serial.methods.map(numericalMethod),
				'Every non-timing numerical method field matches fresh serial evaluation exactly.',
			);
			equal(row.result.geometry, serial.geometry, 'Full physical geometry matches serial evaluation exactly.');
			equal(row.result.numericalPolicy, serial.numericalPolicy, 'Unchanged numerical profile is retained.');
			equal(row.result.resolved, serial.resolved, 'Numerical admission is independent of scheduling.');
			assert.ok(Number.isFinite(row.elapsedMilliseconds) && row.elapsedMilliseconds >= 0);
			checks++;
		}
		const repeated = await pool.evaluate([tasks[1], tasks[0]]);
		equal(
			repeated.map((row) => row.id),
			[tasks[1].id, tasks[0].id],
			'Pool reuse retains each new caller order.',
		);
		equal(completionCounts.slice(-2), [1, 2], 'Completion count resets for each batch.');
		equal(await pool.evaluate([]), [], 'Empty batch returns no invented values.');
		await assert.rejects(
			pool.evaluate(Array.from({length: 4097}, (_, index) => ({...tasks[0], id: String(index)}))),
			/4096/,
		);
		checks++;
		await assert.rejects(pool.evaluate([tasks[0], tasks[0]]), /uniquely/);
		checks++;
	} finally {
		await pool.close();
	}
	await pool.close();
	checks++;

	const signal = new RangeError('Manufactured root guard cancellation.');
	const cancelAfter = Date.now() + 50;
	const cancellationPool = createVolumeWorkerPool(spec, channels, {
		workerCount: 2,
		deadlineEpochMilliseconds,
		guard: () => {
			if (Date.now() >= cancelAfter) throw signal;
		},
	});
	try {
		const busyTasks = Array.from({length: 32}, (_, index) => ({...tasks[0], id: `cancel-${index}`}));
		await assert.rejects(cancellationPool.evaluate(busyTasks), (error) => error === signal);
		checks++;
		await assert.rejects(cancellationPool.evaluate(tasks), (error) => error === signal);
		checks++;
	} finally {
		await cancellationPool.close();
	}

	const timerSignal = new Error('Manufactured periodic root guard.');
	let timerCalls = 0;
	const timerPool = createVolumeWorkerPool(spec, channels, {
		workerCount: 1,
		deadlineEpochMilliseconds,
		guard: () => {
			timerCalls++;
			throw timerSignal;
		},
	});
	try {
		await new Promise((resolve) => setTimeout(resolve, 650));
		equal(timerCalls, 1, 'Periodic root guard runs independently of worker messages and stops after cancellation.');
		await assert.rejects(timerPool.evaluate(tasks), (error) => error === timerSignal);
		checks++;
	} finally {
		await timerPool.close();
	}

	const errorPool = createVolumeWorkerPool(spec, channels, {workerCount: 1, deadlineEpochMilliseconds, guard});
	try {
		await assert.rejects(errorPool.evaluate([{...tasks[0], direction: [0, 0, 0]}]), Error);
		checks++;
	} finally {
		await errorPool.close();
	}

	const deadlinePool = createVolumeWorkerPool(spec, channels, {
		workerCount: 1,
		deadlineEpochMilliseconds: Date.now() + 50,
		guard: () => {},
	});
	try {
		await assert.rejects(deadlinePool.evaluate(tasks), /deadline/i);
		checks++;
	} finally {
		await deadlinePool.close();
	}

	const closingPool = createVolumeWorkerPool(spec, channels, {workerCount: 2, deadlineEpochMilliseconds, guard});
	const closingRejection = assert.rejects(closingPool.evaluate(tasks), /closed before completion/);
	await closingPool.close();
	await closingRejection;
	checks++;
	for (const workerCount of [0, 5, 1.5]) {
		assert.throws(
			() => createVolumeWorkerPool(spec, channels, {workerCount, deadlineEpochMilliseconds, guard}),
			RangeError,
		);
		checks++;
	}
	return {
		schemaId: 'sky-volume-worker-proof-v1',
		pilotSeal,
		selectedIds: tasks.map((task) => task.id),
		checks,
		elapsedMilliseconds: Math.max(0, performance.now() - started),
	};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 2, 'The local worker proof accepts no execution arguments.');
	console.log(JSON.stringify(await volumeWorkerProof(), null, 2));
}
