import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {ExperimentRun} from '../ExperimentRun.js';
import {repositoryRoot, checkPath, hash} from '../run-boundary.js';
import {
	createWindowsProcessTelemetry,
	powershell,
	processQuery,
	retireAbsentDescendants,
} from './windows-process-telemetry.js';

/** Verify script telemetry with one tiny owned child and explicit failure cases.
 * @returns {Promise<void>} - Immutable readiness evidence, not cache/resource-performance qualification.
 */
async function main() {
	const run = await ExperimentRun.create('script-telemetry');
	const monitor = createWindowsProcessTelemetry();
	let child;
	try {
		const births = new Map([
			[11, 'wrapper'],
			[22, 'root'],
			[33, 'live-child'],
			[44, 'exited-child'],
		]);
		/** @type {Map<number,LocalSunCimProcess>} */ const census = new Map();
		for (const pid of [11, 22, 33])
			census.set(pid, {
				ProcessId: pid,
				ParentProcessId: 0,
				CreationDate: births.get(pid),
				PrivatePageCount: 1,
				WorkingSetSize: 1,
			});
		retireAbsentDescendants(births, census, 11, 22);
		const absentDescendantRetired = !births.has(44) && births.get(33) === 'live-child';
		retireAbsentDescendants(births, new Map(), 11, 22);
		const rootIdentitiesPreserved = births.get(11) === 'wrapper' && births.get(22) === 'root';
		if (!absentDescendantRetired || !rootIdentitiesPreserved)
			throw new Error('Exited-descendant retirement changed ownership boundaries.');
		const before = await monitor.sample(process.pid);
		child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {windowsHide: true, stdio: 'ignore'});
		const closed = new Promise((resolve, reject) => {
			child.once('error', reject);
			child.once('close', resolve);
		});
		void closed.catch(() => {});
		if (!child.pid) throw new Error('Tiny owned child did not launch.');
		let overlapRejected = false,
			unknownRejected = false,
			retiredRejected = false;
		const sampling = monitor.sample(child.pid);
		try {
			await monitor.sample(process.pid);
		} catch {
			overlapRejected = true;
		}
		const during = await sampling;
		if (
			!during.pids.includes(process.pid) ||
			!during.pids.includes(child.pid) ||
			during.privateBytes <= 0 ||
			during.workingSetBytes <= 0 ||
			during.freeBytes <= 0
		)
			throw new Error('Owned resource aggregate is incomplete.');
		try {
			await monitor.sample(2147483647);
		} catch {
			unknownRejected = true;
		}
		child.kill();
		await closed;
		const after = await monitor.sample(child.pid);
		if (after.pids.includes(child.pid)) throw new Error('Exited child was counted.');
		await monitor.stop();
		try {
			await monitor.sample(process.pid);
		} catch {
			retiredRejected = true;
		}
		if (!overlapRejected || !unknownRejected || !retiredRejected)
			throw new Error('Telemetry failure/retirement checks failed.');
		const implementation = [];
		for (const name of [
			'resource-monitor/prove.js',
			'resource-monitor/windows-process-telemetry.js',
			'resource-monitor/types.d.ts',
			'run-resource-bounded.js',
			'ExperimentRun.js',
			'run-boundary.js',
		]) {
			const file = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			await checkPath(repositoryRoot, file);
			const bytes = await readFile(file);
			implementation.push({path: name, sha256: hash(bytes)});
			await run.write('source-' + name.replaceAll('/', '-'), bytes);
		}
		await run.write(
			'provenance.json',
			JSON.stringify(
				{
					implementation,
					tools: {node: process.version, powershell, powershellSha256: hash(await readFile(powershell))},
					processQuery,
					operation:
						'Measure wrapper, tiny child and surviving owned processes; reject overlapping/unknown/retired requests. Exercise no scientific/cache work.',
				},
				null,
				'\t',
			),
		);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'script-telemetry-readiness-v1',
					absentDescendantRetired,
					rootIdentitiesPreserved,
					before,
					during,
					after,
					overlapRejected,
					unknownRejected,
					retiredRejected,
					compiledPrograms: 0,
					claim: 'Script monitor readiness only; sampled census is not an allocation cap or performance qualification.',
				},
				null,
				'\t',
			),
		);
		await run.finish('accepted');
		console.log(run.name);
	} catch (error) {
		await run.finish('failed', String(error));
		throw error;
	} finally {
		if (child?.exitCode === null && child.signalCode === null) child.kill();
		await monitor.stop();
	}
}
await main();
