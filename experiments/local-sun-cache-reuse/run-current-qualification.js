import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {ExperimentRun} from './ExperimentRun.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';

/** Execute one serialized current-contract job through the existing heavy guard.
 * @param {ExperimentRun} run - Matrix progress and output owner.
 * @param {string[]} args - Explicit launcher options, never a shell command.
 * @param {boolean} p5Exception - Explicit owner-selected remaining-P5 reserve exception.
 * @returns {Promise<LocalSunCurrentJobIdentity>} - Sealed application and resource identities.
 */
async function execute(run, args, p5Exception) {
	const file = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/run-resource-bounded.js');
	await checkPath(repositoryRoot, file);
	await run.progress('job', JSON.stringify(args));
	return new Promise((resolve, reject) => {
		const child = spawn(
			process.execPath,
			[
				file,
				'--minutes=10',
				...(p5Exception ? ['--reserve-mib=6144', '--p5-reserve-exception'] : []),
				'--',
				'run-rotation.js',
				...args,
			],
			{
				cwd: repositoryRoot,
				windowsHide: true,
				stdio: ['ignore', 'pipe', 'pipe'],
			},
		);
		let pending = '',
			error = '',
			capture = '',
			guard = '';
		child.stdout.on('data', (bytes) => {
			pending += String(bytes);
			const lines = pending.split(/\r?\n/u);
			pending = lines.pop() ?? '';
			for (const line of lines) {
				console.log(line);
				void run.progress('child-output', line);
				try {
					const item = JSON.parse(line);
					if (typeof item.run === 'string') capture = item.run;
					if (typeof item.resourceRun === 'string') guard = item.resourceRun;
				} catch {
					/* Ordinary progress. */
				}
			}
		});
		child.stderr.on('data', (bytes) => {
			error = (error + String(bytes)).slice(-8192);
		});
		child.once('error', reject);
		child.once('exit', (code) =>
			code === 0 && capture && guard
				? resolve({capture, guard})
				: reject(new Error('Guarded current job failed ' + code + ': ' + error)),
		);
	});
}

/** Capture all selected exact-time states without generating video or rebuilding per frame.
 * @returns {Promise<void>} - New immutable matrix links; qualification is separate.
 */
async function main() {
	const run = await ExperimentRun.create('p5-app-matrix');
	try {
		const states = process.argv
			.find((v) => v.startsWith('--states='))
			?.slice(9)
			.split(',') ?? ['flat-0', 'flat-45', 'flat-90', 'flat-135', 'flat-180'];
		const workload = process.argv.find((v) => v.startsWith('--workload='))?.slice(11) ?? 'both';
		const modeSelection = process.argv.find((v) => v.startsWith('--mode='))?.slice(7) ?? 'both';
		const window = process.argv.find((v) => v.startsWith('--window='));
		const p5Exception = process.argv.includes('--p5-reserve-exception');
		if (
			new Set(states).size !== states.length ||
			!states.length ||
			states.some((s) => !['flat-0', 'flat-45', 'flat-90', 'flat-135', 'flat-180'].includes(s)) ||
			!['sky', 'scene', 'both'].includes(workload) ||
			!['control', 'reuse', 'both'].includes(modeSelection) ||
			process.argv
				.slice(2)
				.some(
					(v) =>
						!v.startsWith('--states=') &&
						!v.startsWith('--workload=') &&
						!v.startsWith('--mode=') &&
						v !== '--p5-reserve-exception' &&
						!/^--window=\d+:\d+$/.test(v),
				)
		)
			throw new Error('Explicit frozen state/workload/window required.');
		await checkPath(repositoryRoot, fileURLToPath(import.meta.url));
		const source = await readFile(new URL(import.meta.url));
		await run.write('source-runner.js', source);
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'current-matrix-input-v1',
					command: process.argv.slice(1),
					states,
					workload,
					modeSelection,
					window,
					p5Exception,
					implementationSha256: hash(source),
					node: process.version,
					operation:
						'Sequential guarded application jobs; each control/reuse job independently constructs one canonical field and evaluates exact states. No per-frame cache-build claim, interpolation or encoding.',
				},
				null,
				'\t',
			),
		);
		/** @type {LocalSunCurrentMatrixJob[]} */ const jobs = [];
		for (const scene of workload === 'both' ? [false, true] : [workload === 'scene'])
			for (const state of states)
				for (const mode of modeSelection === 'both' ? ['control', 'reuse'] : [modeSelection]) {
					const args = [
						'selected',
						'--current-application',
						'--shell=00478-p3-contract',
						'--temporal=00265-p5-time-inputs:' + state + ':' + mode,
						...(scene ? ['--scene'] : []),
						...(window ? [window] : []),
					];
					const started = performance.now(),
						identity = await execute(run, args, p5Exception);
					jobs.push({
						state,
						scene,
						mode: /** @type {LocalSunShellTemporalMode} */ (mode),
						...identity,
						elapsedMilliseconds: performance.now() - started,
					});
					await run.write('job-' + jobs.length + '.json', JSON.stringify(jobs.at(-1), null, '\t'));
				}
		await run.write('result.json', JSON.stringify({schema: 'current-matrix-v1', jobs}, null, '\t'));
		await run.finish('accepted');
		console.log(JSON.stringify({run: run.name, jobs: jobs.length}));
	} catch (error) {
		await run.finish('failed', String(error.stack ?? error));
		throw error;
	}
}
await main();
