import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {ExperimentRun} from './ExperimentRun.js';
import {repositoryRoot, outputRoot, checkPath, hash, hashFile} from './run-boundary.js';
import {flatStarDirection, flatStarAngle} from './flat-star-geometry.js';

/** Verify bounded admission refusals and the documented flat rotation/overhead convention.
 *
 * Each child must refuse admission before allocating a heavy process or taking
 * the execution lock. Any mismatch rejects this new proof run; retain failures
 * and repair the selected contract rather than treating them as accepted work.
 * @returns {Promise<void>} - Immutable focused proof, without GPU construction.
 */
async function main() {
	const run = await ExperimentRun.create('celestial-guard');
	let failure = null;
	try {
		const launcher = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/run-resource-bounded.js');
		await checkPath(repositoryRoot, launcher);
		const base = ['--p5-celestial-reserve-exception', '--reserve-mib=6144', '--minutes=10'];
		const cases = [
				{
					id: 'other-launcher',
					args: [...base, '--', 'run-rotation.js'],
					expected: 'P5-Celestial exception requires',
				},
				{
					id: 'mixed-exceptions',
					args: [...base, '--p5-reserve-exception', '--', 'run-celestial.js', '--stage=sun'],
					expected: 'P5-Celestial exception requires',
				},
				{
					id: 'lower-reserve',
					args: [
						'--p5-celestial-reserve-exception',
						'--reserve-mib=5120',
						'--minutes=10',
						'--',
						'run-celestial.js',
						'--stage=sun',
					],
					expected: 'P5-Celestial exception requires',
				},
				{
					id: 'longer-duration',
					args: [
						'--p5-celestial-reserve-exception',
						'--reserve-mib=6144',
						'--minutes=11',
						'--',
						'run-celestial.js',
						'--stage=sun',
					],
					expected: 'P5-Celestial exception requires',
				},
				{
					id: 'owned-ceiling',
					args: [...base, '--max-owned-mib=8193', '--', 'run-celestial.js', '--stage=sun'],
					expected: 'Execution may tighten',
				},
				{
					id: 'default-reserve',
					args: ['--reserve-mib=6144', '--minutes=10', '--', 'run-celestial.js', '--stage=sun'],
					expected: 'Execution may tighten',
				},
			],
			rows = [];
		for (const cell of cases) {
			let stdout = '';
			try {
				await promisify(execFile)(process.execPath, [launcher, ...cell.args], {
					windowsHide: true,
					timeout: 30000,
					maxBuffer: 1048576,
				});
				throw new Error('Invalid launch succeeded: ' + cell.id);
			} catch (error) {
				if (
					!error ||
					typeof error !== 'object' ||
					!('stdout' in error) ||
					!('code' in error) ||
					error.code !== 1
				)
					throw error;
				stdout = String(error.stdout);
			}
			const summary = JSON.parse(stdout.trim().split('\n').at(-1));
			if (!summary.failure?.includes(cell.expected)) throw new Error('Wrong admission rejection: ' + cell.id);
			const root = path.join(outputRoot, 'runs', summary.resourceRun);
			await checkPath(outputRoot, root);
			const manifestBytes = await readFile(path.join(root, 'manifest.json')),
				manifest = JSON.parse(manifestBytes.toString());
			if (manifest.state !== 'failed' || manifest.run !== summary.resourceRun)
				throw new Error('Negative admission run was not sealed failed.');
			for (const artifact of manifest.artifacts) {
				const file = path.resolve(root, artifact.path);
				await checkPath(root, file);
				const observed = await hashFile(root, file);
				if (observed.sha256 !== artifact.sha256 || observed.byteLength !== artifact.byteLength)
					throw new Error('Negative parent evidence changed.');
			}
			const resultBytes = await readFile(path.join(root, 'result.json')),
				result = JSON.parse(resultBytes.toString());
			if (result.exitCode !== null || result.peakPrivateBytes !== 0 || result.resourceQualified)
				throw new Error('Negative admission launched heavy work.');
			rows.push({
				id: cell.id,
				arguments: cell.args,
				run: summary.resourceRun,
				manifestSha256: hash(manifestBytes),
				resultSha256: hash(resultBytes),
				failure: summary.failure,
				heavyChildLaunched: false,
			});
		}
		const policy = {
				epochMilliseconds: 0,
				periodMilliseconds: 86164090.5,
				projectionRadiusMeters: 6371000,
				domeHeightMeters: Math.PI * 6371000,
			},
			overhead = [];
		for (const latitude of [-80, -45, 0, 45, 80])
			for (const longitude of [-135, 0, 135]) {
				const lat = (latitude * Math.PI) / 180,
					lon = (longitude * Math.PI) / 180,
					observation = {
						instant: '1970-01-01T00:00:00.000Z',
						location: {
							latitude: {value: latitude, units: /** @type {const} */ ('degrees')},
							longitude: {value: longitude, units: /** @type {const} */ ('degrees')},
						},
					};
				const direction = flatStarDirection(
					[Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)],
					observation,
					policy,
					[0, 0, 0],
				);
				if (Math.hypot(direction[0], direction[1]) > 1e-12 || Math.abs(direction[2] - 1) > 1e-12)
					throw new Error('Base-epoch overhead invariant failed.');
				const quarter = {...observation, instant: new Date(policy.periodMilliseconds / 4).toISOString()},
					angle = flatStarAngle(quarter, policy);
				if (Math.abs(angle - Math.PI / 2) > 1e-6) throw new Error('Pole period/sign convention failed.');
				const rotated = flatStarDirection(
					[Math.cos(lat) * Math.cos(lon + angle), Math.cos(lat) * Math.sin(lon + angle), Math.sin(lat)],
					quarter,
					policy,
					[0, 0, 0],
				);
				if (Math.hypot(rotated[0], rotated[1]) > 1e-12) throw new Error('Westward live rotation failed.');
				overhead.push({latitude, longitude, direction});
			}
		const sources = [];
		for (const name of [
			'prove-celestial-admission.js',
			'run-resource-bounded.js',
			'flat-star-geometry.js',
			'ExperimentRun.js',
			'run-boundary.js',
		]) {
			const file = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			await checkPath(repositoryRoot, file);
			sources.push({path: path.relative(repositoryRoot, file), ...(await hashFile(repositoryRoot, file))});
		}
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					command: process.argv,
					node: process.version,
					sources,
					policy,
					operation:
						'Invoke real guard with six invalid launch configurations; authenticate every failed child; verify Rz(-theta) and equal-latitude/longitude overhead away from the dome rim.',
				},
				null,
				'\t',
			),
		);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'p5-celestial-admission-conventions-v1',
					rows,
					overhead,
					defaultReserveGiB: 8,
					selectedExceptionGiB: 6,
					ownedCeilingGiB: 8,
					selectedMaximumMinutes: 10,
					scope: 'negative admission and analytic simulator convention; positive admission is established by the guarded GPU captures',
				},
				null,
				'\t',
			),
		);
	} catch (error) {
		failure = error instanceof Error ? error.stack : String(error);
		process.exitCode = 1;
	} finally {
		await run.finish(failure ? 'failed' : 'accepted', failure);
		console.log(run.name);
		if (failure) console.log(failure);
	}
}
await main();
