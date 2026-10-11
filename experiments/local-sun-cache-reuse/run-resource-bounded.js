import path from 'node:path';
import os from 'node:os';
import {readFile, open, unlink} from 'node:fs/promises';
import {spawn, execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID} from 'node:crypto';
import {createWindowsProcessTelemetry, powershell, processQuery} from './resource-monitor/windows-process-telemetry.js';
import {ExperimentRun} from './ExperimentRun.js';
import {repositoryRoot, outputRoot, checkPath, hash} from './run-boundary.js';

/** Record script/OS-query provenance and prepare sequential resource monitoring.
 * @param {ExperimentRun} run - Owned new output root and provenance writer.
 * @returns {Promise<LocalSunScriptResourceSampler>} - No compiler or generated executable.
 */
async function prepareTelemetry(run) {
	const source = path.join(
		repositoryRoot,
		'experiments/local-sun-cache-reuse/resource-monitor/windows-process-telemetry.js',
	);
	await checkPath(repositoryRoot, source);
	const bytes = await readFile(source);
	await run.write('windows-process-telemetry.js', bytes);
	await run.write(
		'telemetry-inputs.json',
		JSON.stringify(
			{
				schema: 'script-owned-telemetry-input-v1',
				sourceSha256: hash(bytes),
				powershell,
				powershellSha256: hash(await readFile(powershell)),
				processQuery,
				node: process.version,
				operation:
					'Read-only CIM process census, close wrapper descendant ownership, sum PrivatePageCount and WorkingSetSize; reject missing roots, PID reuse, unavailable counters and query failure.',
				deadlineMilliseconds: 10000,
				limitation:
					'Sampled process census, not an atomic kernel snapshot or allocation cap; GPU/driver allocations and exited processes between samples remain separate.',
			},
			null,
			'\t',
		),
	);
	return createWindowsProcessTelemetry();
}

/** Preserve useful bounded process-failure fields instead of retaining only its message.
 * @param {unknown} error - Original compiler, collector, launcher or cleanup exception.
 * @returns {LocalSunHostResourceFailure} - Safe scalar metadata and bounded output tails.
 */
function failureDetails(error) {
	const original = error instanceof Error && error.cause && typeof error.cause === 'object' ? error.cause : error;
	const code = original && typeof original === 'object' && 'code' in original ? original.code : null;
	const signal = original && typeof original === 'object' && 'signal' in original ? original.signal : null;
	const killed = original && typeof original === 'object' && 'killed' in original ? original.killed : null;
	const stdout = original && typeof original === 'object' && 'stdout' in original ? original.stdout : '';
	const stderr = original && typeof original === 'object' && 'stderr' in original ? original.stderr : '';
	return {
		message: error instanceof Error ? error.message : String(error),
		code: typeof code === 'string' || typeof code === 'number' ? code : null,
		killed: typeof killed === 'boolean' ? killed : null,
		signal: typeof signal === 'string' ? signal : null,
		stdout: String(stdout).slice(-8192),
		stderr: String(stderr).slice(-8192),
	};
}

/** Run one experiment proof with exclusive ownership and sampled aggregate resource stop thresholds.
 * @returns {Promise<void>} - New immutable resource record and child output; no video, checkpoint or production mutation.
 */
async function main() {
	const run = await ExperimentRun.create('resource-bound');
	const separator = process.argv.indexOf('--');
	const flags = process.argv.slice(2, separator < 0 ? undefined : separator);
	const numberFlag =
		/** @param {string} name - Named positive numeric option. @param {number} fallback - Default. */ (
			name,
			fallback,
		) => {
			const value = Number(flags.find((flag) => flag.startsWith(name + '='))?.slice(name.length + 1) ?? fallback);
			if (!Number.isSafeInteger(value) || value <= 0)
				throw new Error('Positive integral resource limit required.');
			return value;
		};
	let child;
	let failure = null;
	/** @type {LocalSunHostResourceFailure|null} */ let failureDetail = null;
	/** @type {LocalSunScriptResourceSampler|undefined} */ let telemetry;
	let exitCode = null;
	let peakPrivateBytes = 0,
		peakWorkingSetBytes = 0,
		minimumFreeBytes = os.freemem();
	let acquired = false;
	const lock = path.join(outputRoot, 'heavy-execution.lock');
	const ownership = JSON.stringify({pid: process.pid, nonce: randomUUID(), run: run.name});
	try {
		if (process.platform !== 'win32' || separator < 0)
			throw new Error('Windows owned-process telemetry and explicit -- launcher boundary required.');
		const [script, ...arguments_] = process.argv.slice(separator + 1);
		if (
			!script ||
			!/^[a-z0-9-]+\.js$/u.test(script) ||
			arguments_.some((value) => /video|motion|\.mp4/iu.test(value))
		)
			throw new Error('An experiment launcher basename is required; video generation is outside this execution.');
		const file = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', script);
		await checkPath(repositoryRoot, file);
		const maximumBytes = numberFlag('--max-owned-mib', 8192) * 1048576;
		const reserveBytes = numberFlag('--reserve-mib', 8192) * 1048576;
		const maximumMilliseconds = numberFlag('--minutes', 45) * 60000;
		const p3Exception = flags.includes('--p3-c-reserve-exception');
		const p5Exception = flags.includes('--p5-reserve-exception');
		const celestialException = flags.includes('--p5-celestial-reserve-exception');
		if(celestialException && (p3Exception || p5Exception || script!=='run-celestial.js' || arguments_.length!==1 || !['--stage=sun','--stage=combined'].includes(arguments_[0]) || maximumMilliseconds>600000 || reserveBytes!==6144*1048576))throw new Error('P5-Celestial exception requires its bounded stage launcher, ten-minute ceiling and exact 6 GiB reserve.');
		if (
			p5Exception &&
			(p3Exception ||
				script !== 'run-rotation.js' ||
				arguments_[0] !== 'selected' ||
				!arguments_.includes('--current-application') ||
				!arguments_.includes('--shell=00478-p3-contract') ||
				!arguments_.some((v) =>
					/^--temporal=00265-p5-time-inputs:flat-(0|45|90|135|180):(control|reuse)$/.test(v),
				) ||
				arguments_.some(
					(v) =>
						!['selected', '--current-application', '--shell=00478-p3-contract', '--scene'].includes(v) &&
						!/^--temporal=00265-p5-time-inputs:flat-(0|45|90|135|180):(control|reuse)$/.test(v) &&
						!/^--window=\d+:\d+$/.test(v),
				) ||
				maximumMilliseconds > 600000 ||
				reserveBytes !== 6144 * 1048576)
		)
			throw new Error(
				'The approved remaining-P5 exception requires pinned temporal captures, ten-minute ceiling and exact 6 GiB reserve.',
			);
		if (
			p3Exception &&
			(script !== 'run-shell-capture.js' ||
				arguments_[0] !== '--current-contract' ||
				arguments_
					.slice(1)
					.some(
						(v) =>
							!/^--state=flat-(?:0|45|90|135|180)$/u.test(v) &&
							!['--qualify-layout', '--unculled'].includes(v),
					) ||
				maximumMilliseconds > 10 * 60000 ||
				reserveBytes !== 6144 * 1048576)
		)
			throw new Error(
				'The owner-selected P3-C reserve exception requires a current capture, ten-minute ceiling and exact 6 GiB reserve.',
			);
		if (
			maximumMilliseconds > 90 * 60000 ||
			maximumBytes > 8192 * 1048576 ||
			reserveBytes < (p3Exception || p5Exception || celestialException ? 6144 : 8192) * 1048576
		)
			throw new Error(
				'Execution may tighten but cannot relax the owned limit, applicable reserve or duration ceiling.',
			);
		const source = await readFile(file);
		await run.write('launcher.js', source);
		for (const name of ['run-resource-bounded.js', 'ExperimentRun.js', 'run-boundary.js'])
			await run.write(
				'source-' + name,
				await readFile(path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name)),
			);
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'host-resource-bound-input-v1',
					command: process.argv.slice(1),
					launcher: {script, sha256: hash(source), arguments: arguments_},
					limits: {maximumBytes, reserveBytes, maximumMilliseconds, sampleIntervalMilliseconds: 5000},
					temporaryException: p3Exception
						? {
								authorization:
									'Owner: "I\'ll make a short term exception", 2026-10-09; applied to the machine reserve for selected P3-C only.',
								scope: 'P3-C current-contract captures only',
								reserveMiB: 6144,
								defaultReserveMiB: 8192,
								restoration:
									'Omit the explicit exception flag; no default or historical evidence is changed.',
							}
						: p5Exception
							? {
									authorization:
										'Owner: "Approve 6 GiB reserve for remaining P5 captures", 2026-10-10.',
									scope: 'Remaining P5 pinned current-application temporal captures only',
									reserveMiB: 6144,
									defaultReserveMiB: 8192,
									restoration:
										'Omit the explicit P5 exception flag after P5; default 8 GiB reserve is unchanged.',
								}
							: celestialException ? {authorization:'Owner relaxed the 8 GiB free-memory restriction for AFK P5-Celestial, 2026-10-10; execution selects 6 GiB.',scope:'P5-Celestial bounded captures and short preview only; excludes P6',reserveMiB:6144,defaultReserveMiB:8192,restoration:'Omit the explicit celestial exception flag at phase completion; default remains unchanged.'} : null,
					tools: {node: process.version, platform: process.platform},
					totalBytes: os.totalmem(),
					operation:
						'Exclusive one-heavy-job launch, descendant process census and summed private/working-set bytes. Stop only owned child tree on threshold, duration or measurement failure. Limits are sampled stop thresholds, not kernel allocation caps; driver/GPU bytes remain separate.',
				},
				null,
				'\t',
			),
		);
		await checkPath(outputRoot, lock);
		const handle = await open(lock, 'wx');
		acquired = true;
		try {
			await handle.writeFile(ownership);
		} finally {
			await handle.close();
		}
		if (os.freemem() < reserveBytes) throw new Error('Free-memory reserve is unavailable before launch.');
		// Fail closed if process telemetry cannot be collected before computation.
		telemetry = await prepareTelemetry(run);
		const warmed = await telemetry.sample(process.pid);
		peakPrivateBytes = Math.max(peakPrivateBytes, warmed.privateBytes);
		peakWorkingSetBytes = Math.max(peakWorkingSetBytes, warmed.workingSetBytes);
		minimumFreeBytes = Math.min(minimumFreeBytes, warmed.freeBytes);
		await run.progress('telemetry-warmup', JSON.stringify(warmed));
		if (
			warmed.privateBytes > maximumBytes ||
			warmed.workingSetBytes > maximumBytes ||
			warmed.freeBytes < reserveBytes
		)
			throw new Error('Owned memory or free-memory stop threshold exceeded during telemetry warmup.');
		child = spawn(process.execPath, ['--max-old-space-size=2048', file, ...arguments_], {
			cwd: repositoryRoot,
			windowsHide: true,
			stdio: ['ignore', 'pipe', 'pipe'],
			env: {...process.env, NODE_OPTIONS: '--max-old-space-size=2048', LOCAL_SUN_HEAVY_EXECUTION: ownership},
		});
		const launched = Date.now();
		let ended = false;
		const completion = new Promise((resolve, reject) => {
			child.once('error', reject);
			child.once('exit', (code) => {
				exitCode = code;
				ended = true;
				resolve(undefined);
			});
		});
		// Attach immediately so a launch error during telemetry cannot become an
		// unhandled rejection; awaiting the original promise still reports it.
		void completion.catch(() => {});
		let stdout = '',
			stderr = '';
		child.stdout.on('data', (bytes) => {
			const value = String(bytes);
			stdout = (stdout + value).slice(-32768);
			process.stdout.write(value);
		});
		child.stderr.on('data', (bytes) => {
			const value = String(bytes);
			stderr = (stderr + value).slice(-32768);
			process.stderr.write(value);
		});
		while (!ended) {
			if (!child.pid) throw new Error('Owned child PID unavailable.');
			const observed = await telemetry.sample(child.pid);
			peakPrivateBytes = Math.max(peakPrivateBytes, observed.privateBytes);
			peakWorkingSetBytes = Math.max(peakWorkingSetBytes, observed.workingSetBytes);
			minimumFreeBytes = Math.min(minimumFreeBytes, observed.freeBytes);
			await run.progress('resources', JSON.stringify(observed));
			if (
				observed.privateBytes > maximumBytes ||
				observed.workingSetBytes > maximumBytes ||
				observed.freeBytes < reserveBytes
			)
				throw new Error('Owned memory or machine free-memory stop threshold exceeded.');
			if (Date.now() - launched > maximumMilliseconds) throw new Error('Bounded workload duration exceeded.');
			await Promise.race([completion, new Promise((resolve) => setTimeout(resolve, 5000))]);
		}
		await completion;
		await run.write('stdout-tail.txt', stdout);
		await run.write('stderr-tail.txt', stderr);
		if (exitCode !== 0) throw new Error('Owned proof exited unsuccessfully: ' + exitCode);
	} catch (error) {
		failureDetail = failureDetails(error);
		failure = error instanceof Error ? error.message : String(error);
		if (child?.pid && child.exitCode === null && child.signalCode === null) {
			try {
				await promisify(execFile)('C:/Windows/System32/taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
					windowsHide: true,
				});
				await new Promise((resolve) => {
					if (child.exitCode !== null || child.signalCode !== null) resolve(undefined);
					else child.once('exit', resolve);
				});
			} catch (cleanup) {
				failure += '; owned-tree stop: ' + String(cleanup);
			}
		}
	} finally {
		try {
			await telemetry?.stop();
		} catch (error) {
			failureDetail ??= failureDetails(error);
			failure ??= failureDetail.message;
		}
		if (acquired) {
			await checkPath(outputRoot, lock);
			if ((await readFile(lock, 'utf8')) !== ownership)
				throw new Error('Execution lock identity changed; preserve it.');
			await unlink(lock);
		}
	}
	await run.write(
		'result.json',
		JSON.stringify(
			{
				schema: 'host-resource-bound-v1',
				exitCode,
				failure,
				failureDetail,
				peakPrivateBytes,
				peakWorkingSetBytes,
				minimumFreeBytes,
				resourceQualified: !failure,
				claim: 'Sampled workload resource evidence, not physical cache acceptance. Interrupted child artifacts remain incomplete and are never reopened.',
			},
			null,
			'\t',
		),
	);
	await run.finish(failure ? 'failed' : 'accepted', failure);
	console.log(
		JSON.stringify({resourceRun: run.name, failure, peakPrivateBytes, peakWorkingSetBytes, minimumFreeBytes}),
	);
	if (failure) process.exitCode = 1;
}
await main();
