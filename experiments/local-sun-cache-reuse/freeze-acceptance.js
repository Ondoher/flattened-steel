import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {outputRoot, repositoryRoot, checkPath, hash} from './run-boundary.js';
import {calibrateReference} from './continuous-reference.js';

/** Authenticate a sealed parent's complete artifact inventory before reuse.
 * @param {string} name - Unique parent run name.
 * @param {string} artifact - Requested artifact name.
 * @returns {Promise<LocalSunParentArtifact>} - Authenticated bytes and parent identity.
 */
async function parent(name, artifact) {
	if (!/^\d{5}-[a-z0-9-]+$/u.test(name)) throw new Error('Invalid parent run.');
	const root = path.join(outputRoot, 'runs', name);
	await checkPath(outputRoot, root);
	const manifestPath = path.join(root, 'manifest.json');
	await checkPath(root, manifestPath);
	const manifestBytes = await readFile(manifestPath);
	/** @type {LocalSunParentManifest} */
	const manifest = JSON.parse(manifestBytes.toString('utf8'));
	if (
		manifest.schema !== 'local-sun-cache-reuse-run-v1' ||
		manifest.state !== 'accepted' ||
		manifest.run !== name ||
		!Array.isArray(manifest.artifacts)
	)
		throw new Error('Parent is not accepted.');
	let selected;
	for (const identity of manifest.artifacts) {
		const target = path.resolve(root, identity.path);
		await checkPath(root, target);
		const bytes = await readFile(target);
		if (bytes.length !== identity.byteLength || hash(bytes) !== identity.sha256)
			throw new Error('Parent artifact mismatch.');
		if (identity.path === artifact) selected = bytes;
	}
	if (!selected) throw new Error('Artifact missing from parent manifest.');
	return {run: name, manifestSha256: hash(manifestBytes), artifact, artifactSha256: hash(selected), bytes: selected};
}

/** Bind frozen acceptance to measured selected-profile controls.
 * @returns {Promise<void>} - Sealed acceptance and reference calibration.
 */
async function main() {
	const run = await ExperimentRun.create('acceptance');
	let failure = null;
	try {
		const control = await parent(process.argv[2] ?? '00017-control-v0', 'result.json');
		const controls = await parent(process.argv[3] ?? '00018-controls', 'controls.json');
		const environment = await parent('00002-environment', 'result.json');
		/** @type {LocalSunControlCapture} */
		const measured = JSON.parse(new TextDecoder().decode(control.bytes));
		const gatePath = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/gates.json');
		await checkPath(repositoryRoot, gatePath);
		const gateBytes = await readFile(gatePath);
		/** @type {LocalSunGateCalibrationInputs} */
		const gates = JSON.parse(gateBytes.toString('utf8'));
		if (
			gates.schema !== 'local-sun-cache-reuse-gates-v1' ||
			!Array.isArray(gates.quantities) ||
			gates.quantities.length !== 12 ||
			!measured.frameMilliseconds?.length
		)
			throw new Error('Control/gate schema mismatch.');
		const allocationSumBytes =
			measured.allocations.reduce((sum, allocation) => sum + allocation.bytes, 0) +
			measured.immutableAllocations.reduce((sum, allocation) => sum + allocation.bytes, 0);
		const sorted = [...measured.frameMilliseconds].sort((a, b) => a - b);
		const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
		const limits = {...gates.resources, maximumWarmFrameP95Milliseconds: 1.25 * p95 + 2};
		if (
			allocationSumBytes * 2 > limits.maximumCombinedLogicalPayloadBytes ||
			measured.buildMilliseconds > limits.maximumBuildMilliseconds ||
			measured.preparedMilliseconds > limits.maximumPreparedMilliseconds
		)
			throw new Error('Measured baseline exceeds frozen resource calibration.');
		const calibration = calibrateReference();
		await run.write('reference-calibration.json', `${JSON.stringify(calibration, null, '\t')}\n`);
		await run.write('gates.json', gateBytes);
		const inputSources = [];
		for (const relative of [
			'experiments/local-sun-cache-reuse/freeze-acceptance.js',
			'experiments/local-sun-cache-reuse/continuous-reference.js',
			'experiments/local-sun-cache-reuse/ExperimentRun.js',
			'src/algorithm32/implementation/canonical-atmosphere/consts.js',
			'src/algorithm32/profiles/native-15/consts.js',
			'agents/topics/poc-experiments/engineering-studies/local-sun-cache-reuse/reference-method.md',
		]) {
			const target = path.join(repositoryRoot, relative);
			await checkPath(repositoryRoot, target);
			inputSources.push({path: relative, sha256: hash(await readFile(target))});
		}
		const parents = [control, controls, environment].map(({bytes, ...identity}) => identity);
		await run.write(
			'acceptance.json',
			`${JSON.stringify({schema: 'local-sun-frozen-acceptance-v1', gateSha256: hash(gateBytes), parents, inputSources, limits, calibration: {allocationSumBytes, memoryInterpretation: 'Sum of observed public field allocations; conservative all-fields-live accounting. Device bytes and driver overhead are not exposed by this WebGL backend. Active+staging must fit the payload ceiling and allocate successfully in later qualification.', baselineBuildMilliseconds: measured.buildMilliseconds, baselinePreparedMilliseconds: measured.preparedMilliseconds, warmFrameMilliseconds: measured.frameMilliseconds, baselineWarmP95Milliseconds: p95, timingInterpretation: 'Wall time with GPU finish; one profile and five warm samples. Sub-millisecond timer quantization and shared driver shader caching apply. Not a robust live-performance claim.'}, operation: 'Authenticate all parent artifacts; freeze gate bytes; derive warm-frame limit from measured p95; calibrate independent analytic transmission.', evaluation: 'P1 inputs frozen, not candidate qualification; unresolved future reference cells block their acceptance.'}, null, '\t')}\n`,
		);
	} catch (error) {
		failure = String(error.stack ?? error);
	}
	await run.finish(failure ? 'failed' : 'accepted', failure);
	console.log(JSON.stringify({run: run.name, failure}));
	if (failure) process.exitCode = 1;
}

await main();
