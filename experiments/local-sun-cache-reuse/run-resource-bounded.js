import path from 'node:path';
import os from 'node:os';
import {readFile, open, unlink} from 'node:fs/promises';
import {spawn, execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID} from 'node:crypto';
import {ExperimentRun} from './ExperimentRun.js';
import {repositoryRoot, outputRoot, checkPath, hash} from './run-boundary.js';

/** Inspect only this wrapper and the descendants of its owned child.
 * @param {number} rootPid - Owned child process identifier.
 * @returns {Promise<LocalSunHostResourceSample>} - Working-set and committed private-memory sums; shared pages may be counted more than once.
 */
async function sample(rootPid) {
	const script = `$all = @(Get-CimInstance Win32_Process); $owned = [System.Collections.Generic.HashSet[int]]::new(); [void]$owned.Add(${rootPid}); do { $changed = $false; foreach ($item in $all) { if ($owned.Contains([int]$item.ParentProcessId) -and $owned.Add([int]$item.ProcessId)) { $changed = $true } } } while ($changed); [void]$owned.Add(${process.pid}); $private = 0L; $working = 0L; $pids = @(); foreach ($id in $owned) { $proc = Get-Process -Id $id -ErrorAction SilentlyContinue; if ($proc) { $private += $proc.PrivateMemorySize64; $working += $proc.WorkingSet64; $pids += $id } }; @{ privateBytes = $private; workingSetBytes = $working; pids = $pids } | ConvertTo-Json -Compress`;
	const {stdout} = await promisify(execFile)('C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',
		['-NoProfile', '-NonInteractive', '-Command', script], {windowsHide: true, timeout: 10000});
	const parsed = JSON.parse(stdout);
	if (!Number.isFinite(parsed.privateBytes) || !Number.isFinite(parsed.workingSetBytes) || !Array.isArray(parsed.pids))
		throw new Error('Owned process resource measurement is unavailable.');
	return {...parsed, freeBytes: os.freemem(), timestamp: new Date().toISOString()};
}

/** Run one experiment proof with exclusive ownership and sampled aggregate resource stop thresholds.
 * @returns {Promise<void>} - New immutable resource record and child output; no video, checkpoint or production mutation.
 */
async function main() {
	const run = await ExperimentRun.create('resource-bound');
	const separator = process.argv.indexOf('--');
	const flags = process.argv.slice(2, separator < 0 ? undefined : separator);
	const numberFlag = /** @param {string} name - Named positive numeric option. @param {number} fallback - Default. */ (name, fallback) => {
		const value = Number(flags.find(flag => flag.startsWith(name + '='))?.slice(name.length + 1) ?? fallback);
		if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Positive integral resource limit required.');
		return value;
	};
	let child;
	let failure = null;
	let exitCode = null;
	let peakPrivateBytes = 0, peakWorkingSetBytes = 0, minimumFreeBytes = os.freemem();
	let acquired = false;
	const lock = path.join(outputRoot, 'heavy-execution.lock');
	const ownership = JSON.stringify({pid: process.pid, nonce: randomUUID(), run: run.name});
	try {
		if (process.platform !== 'win32' || separator < 0) throw new Error('Windows owned-process telemetry and explicit -- launcher boundary required.');
		const [script, ...arguments_] = process.argv.slice(separator + 1);
		if (!script || !/^[a-z0-9-]+\.js$/u.test(script) || arguments_.some(value => /video|motion|\.mp4/iu.test(value)))
			throw new Error('An experiment launcher basename is required; video generation is outside this execution.');
		const file = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', script);
		await checkPath(repositoryRoot, file);
		const maximumBytes = numberFlag('--max-owned-mib', 8192) * 1048576;
		const reserveBytes = numberFlag('--reserve-mib', 8192) * 1048576;
		const maximumMilliseconds = numberFlag('--minutes', 45) * 60000;
		if (maximumMilliseconds > 90 * 60000 || maximumBytes > 8192 * 1048576 || reserveBytes < 8192 * 1048576)
			throw new Error('Execution may tighten but cannot relax the 8 GiB owned limit, 8 GiB reserve or 90-minute ceiling.');
		const source = await readFile(file);
		await run.write('launcher.js', source);
		for (const name of ['run-resource-bounded.js', 'ExperimentRun.js', 'run-boundary.js'])
			await run.write('source-' + name, await readFile(path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name)));
		await run.write('inputs.json', JSON.stringify({schema: 'host-resource-bound-input-v1', command: process.argv.slice(1),
			launcher: {script, sha256: hash(source), arguments: arguments_}, limits: {maximumBytes, reserveBytes, maximumMilliseconds, sampleIntervalMilliseconds: 5000},
			tools: {node: process.version, platform: process.platform}, totalBytes: os.totalmem(), operation:
			'Exclusive one-heavy-job launch, descendant process census and summed private/working-set bytes. Stop only owned child tree on threshold, duration or measurement failure. Limits are sampled stop thresholds, not kernel allocation caps; driver/GPU bytes remain separate.'}, null, '\t'));
		await checkPath(outputRoot, lock);
		const handle = await open(lock, 'wx');
		acquired = true;
		try {await handle.writeFile(ownership);} finally {await handle.close();}
		if (os.freemem() < reserveBytes) throw new Error('Free-memory reserve is unavailable before launch.');
		// Fail closed if process telemetry cannot be collected before computation.
		await sample(process.pid);
		child = spawn(process.execPath, ['--max-old-space-size=2048', file, ...arguments_], {
			cwd: repositoryRoot, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
			env: {...process.env, NODE_OPTIONS: '--max-old-space-size=2048', LOCAL_SUN_HEAVY_EXECUTION: ownership},
		});
		const launched = Date.now();
		let ended = false;
		const completion = new Promise((resolve, reject) => {
			child.once('error', reject);
			child.once('exit', code => {exitCode = code; ended = true; resolve(undefined);});
		});
		// Attach immediately so a launch error during telemetry cannot become an
		// unhandled rejection; awaiting the original promise still reports it.
		void completion.catch(() => {});
		let stdout = '', stderr = '';
		child.stdout.on('data', bytes => {const value = String(bytes); stdout = (stdout + value).slice(-32768); process.stdout.write(value);});
		child.stderr.on('data', bytes => {const value = String(bytes); stderr = (stderr + value).slice(-32768); process.stderr.write(value);});
		while (!ended) {
			if (!child.pid) throw new Error('Owned child PID unavailable.');
			const observed = await sample(child.pid);
			peakPrivateBytes = Math.max(peakPrivateBytes, observed.privateBytes);
			peakWorkingSetBytes = Math.max(peakWorkingSetBytes, observed.workingSetBytes);
			minimumFreeBytes = Math.min(minimumFreeBytes, observed.freeBytes);
			await run.progress('resources', JSON.stringify(observed));
			if (observed.privateBytes > maximumBytes || observed.workingSetBytes > maximumBytes || observed.freeBytes < reserveBytes)
				throw new Error('Owned memory or machine free-memory stop threshold exceeded.');
			if (Date.now() - launched > maximumMilliseconds) throw new Error('Bounded workload duration exceeded.');
			await Promise.race([completion, new Promise(resolve => setTimeout(resolve, 5000))]);
		}
		await completion;
		await run.write('stdout-tail.txt', stdout);
		await run.write('stderr-tail.txt', stderr);
		if (exitCode !== 0) throw new Error('Owned proof exited unsuccessfully: ' + exitCode);
	} catch (error) {
		failure = error instanceof Error ? error.message : String(error);
		if (child?.pid && child.exitCode === null && child.signalCode === null) {
			try {
				await promisify(execFile)('C:/Windows/System32/taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {windowsHide: true});
				await new Promise(resolve => {if (child.exitCode !== null || child.signalCode !== null) resolve(undefined); else child.once('exit', resolve);});
			} catch (cleanup) {failure += '; owned-tree stop: ' + String(cleanup);}
		}
	} finally {
		if (acquired) {
			await checkPath(outputRoot, lock);
			if (await readFile(lock, 'utf8') !== ownership) throw new Error('Execution lock identity changed; preserve it.');
			await unlink(lock);
		}
	}
	await run.write('result.json', JSON.stringify({schema: 'host-resource-bound-v1', exitCode, failure,
		peakPrivateBytes, peakWorkingSetBytes, minimumFreeBytes, resourceQualified: !failure,
		claim: 'Sampled workload resource evidence, not physical cache acceptance. Interrupted child artifacts remain incomplete and are never reopened.'}, null, '\t'));
	await run.finish(failure ? 'failed' : 'accepted', failure);
	console.log(JSON.stringify({resourceRun: run.name, failure, peakPrivateBytes, peakWorkingSetBytes, minimumFreeBytes}));
	if (failure) process.exitCode = 1;
}
await main();
