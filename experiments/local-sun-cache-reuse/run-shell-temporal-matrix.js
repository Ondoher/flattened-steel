import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';

/** Execute one existing proof launcher and retain its terminal run identity.
 * @param {ExperimentRun} run - New matrix evidence owner.
 * @param {string} script - Experiment-owned launcher basename.
 * @param {string[]} arguments_ - Explicit frozen proof parameters.
 * @returns {Promise<string>} - Identity of the newly sealed child evidence.
 */
async function execute(run, script, arguments_) {
	const file = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', script);
	await checkPath(repositoryRoot, file);
	await run.progress('child', JSON.stringify({script, arguments: arguments_}));
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [file, ...arguments_], {
			cwd: repositoryRoot,
			windowsHide: true,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		let pending = '',
			terminal = '',
			failure = '';
		child.stdout.on('data', (bytes) => {
			pending += String(bytes);
			const lines = pending.split(/\r?\n/u);
			pending = lines.pop() ?? '';
			for (const line of lines) {
				console.log(line);
				void run.progress('child-output', line);
				try {
					const value = JSON.parse(line);
					if (typeof value.run === 'string' && /^\d{5}-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value.run))
						terminal = value.run;
				} catch {
					/* Ordinary progress is not a terminal result. */
				}
			}
		});
		child.stderr.on('data', (bytes) => {
			failure = (failure + String(bytes)).slice(-16384);
		});
		child.once('error', reject);
		child.once('exit', (code) =>
			code === 0 && terminal
				? resolve(terminal)
				: reject(new Error(`Child ${script} exited ${code}: ${failure || 'No sealed terminal identity.'}`)),
		);
	});
}

/** Run the remaining exact-time matrix sequentially on the single declared GPU.
 * @returns {Promise<void>} - Sealed links to actual fresh/reused captures and their individual temporal proofs; no video or overall physical-qualification claim.
 */
async function main() {
	const run = await ExperimentRun.create('p5-time-matrix');
	try {
		const scene = process.argv.includes('--scene');
		const skyAfter = process.argv.includes('--sky-after');
		if (skyAfter && !scene) throw new Error('A subsequent sky workload requires the initial scene workload.');
		const stateArgument = process.argv.find((value) => value.startsWith('--states='))?.slice('--states='.length);
		const states = stateArgument?.split(',') ?? ['flat-0', 'flat-45', 'flat-90', 'flat-135', 'flat-180'];
		if (
			!states.length ||
			new Set(states).size !== states.length ||
			states.some((value) => !['flat-0', 'flat-45', 'flat-90', 'flat-135', 'flat-180'].includes(value))
		)
			throw new Error('Explicit nonduplicated frozen cadence identities required.');
		const workloads = [
			{scene, states},
			...(skyAfter ? [{scene: false, states: ['flat-0', 'flat-45', 'flat-90', 'flat-135', 'flat-180']}] : []),
		];
		const parents = await Promise.all([
			readParent('00281-p3-selection', 'selection.json'),
			readParent('00217-p3-layout-v2', 'layout.json'),
			readParent('00265-p5-time-inputs', 'states.json'),
			readParent('00019-acceptance', 'gates.json'),
		]);
		const implementation = [];
		for (const name of [
			'run-shell-temporal-matrix.js',
			'run-rotation.js',
			'prove-shell-temporal.js',
			'ExperimentRun.js',
			'parent-evidence.js',
			'run-boundary.js',
		]) {
			const target = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			await checkPath(repositoryRoot, target);
			const bytes = await readFile(target);
			implementation.push({
				path: path.relative(repositoryRoot, target).replaceAll('\\', '/'),
				sha256: hash(bytes),
			});
			await run.write('source-' + name, bytes);
		}
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'shell-temporal-matrix-input-v1',
					parents: parents.map(({bytes, ...identity}) => identity),
					implementation,
					command: process.argv.slice(1),
					parameters: {workloads, count: 120},
					tools: {node: process.version},
					operation:
						'Sequential actual fresh/reused worker application captures at every frozen exact state, followed by complete immutable-parent spectral, derivative and PNG comparison. No encoding or presentation interpolation.',
				},
				null,
				'\t',
			),
		);
		const rows = [];
		for (const workload of workloads)
			for (const state of workload.states) {
				const base = [
					'selected',
					'--shell=00217-p3-layout-v2',
					'--application',
					'--application-worker',
					...(workload.scene ? ['--scene'] : []),
				];
				const reused = await execute(run, 'run-rotation.js', [
					...base,
					`--temporal=00265-p5-time-inputs:${state}:reuse`,
				]);
				const fresh = await execute(run, 'run-rotation.js', [
					...base,
					`--temporal=00265-p5-time-inputs:${state}:fresh`,
				]);
				const proof = await execute(run, 'prove-shell-temporal.js', [fresh, reused]);
				const result = await readParent(proof, 'result.json');
				const measured = JSON.parse(new TextDecoder().decode(result.bytes));
				if (measured.temporalQualified !== true)
					throw new Error(`Required temporal cell ${state} did not qualify; preserve all child evidence.`);
				rows.push({
					state,
					scene: workload.scene,
					reused,
					fresh,
					proof: result.run,
					result: (({bytes, ...identity}) => identity)(result),
				});
				await run.write(
					`completed-${workload.scene ? 'scene' : 'sky'}-${state}.json`,
					JSON.stringify(rows.at(-1), null, '\t'),
				);
				await run.progress(
					'matrix',
					`Completed ${rows.length}/${workloads.reduce((sum, value) => sum + value.states.length, 0)} exact-time pairs.`,
				);
			}
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'shell-temporal-matrix-v1',
					rows,
					temporalQualified: true,
					qualified: false,
					limitations:
						'Temporal parity only. Independent physical admission, full workload/resource qualification and required standards review remain separate.',
				},
				null,
				'\t',
			),
		);
		await run.finish('accepted');
		console.log(JSON.stringify({run: run.name, cells: rows.length, temporalQualified: true, qualified: false}));
	} catch (error) {
		await run.finish('failed', error instanceof Error ? error.stack : String(error));
		throw error;
	}
}
await main();
