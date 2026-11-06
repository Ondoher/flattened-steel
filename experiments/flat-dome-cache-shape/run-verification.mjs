import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {createRun, checked, identity, repository} from './io.mjs';
import {acceptedRuns, discovery, readEvidence, runsRoot} from './evidence.mjs';
import {cases, transportDirections} from './physical.mjs';
import {clearance, interval} from './geometry.mjs';
import {candidateShader} from './candidate-shader.mjs';
import {gauss} from './math.mjs';

const report = acceptedRuns('m4-report').at(-1);
assert.ok(report, 'Finalize the owner-readable report before final evidence verification.');
const roots = [
	...new Set([
		report,
		...readEvidence(`${report}/results.json`).parents,
		...discovery().parents,
		`${runsRoot}/00001-m1-boundary`,
		`${runsRoot}/00002-m1-contract`,
		`${runsRoot}/00017-m3-probe-dev`,
		`${runsRoot}/00018-m3-lib-guide`,
		`${runsRoot}/00019-m3-guide-proof`,
		`${runsRoot}/00029-m3-probe-val`,
	]),
].sort();
const previousVerification = acceptedRuns('m4-verification').at(-1);
for (let index = 0; index < roots.length; index++) {
	for (const parent of readEvidence(`${roots[index]}/manifest.json`).derivation.parents) {
		if (parent.path.startsWith(runsRoot + '/') && parent.path.endsWith('/manifest.json')) {
			const root = parent.path.slice(0, -'/manifest.json'.length);
			assert.equal(identity(parent.path).sha256, parent.sha256, 'A recorded parent manifest changed.');
			if (!roots.includes(root)) {
				roots.push(root);
			}
		}
	}
}
const previous = previousVerification ? readEvidence(`${previousVerification}/results.json`) : null;
const previousInputs = previousVerification ? readEvidence(`${previousVerification}/started.json`).parents : [];
const run = createRun('m4-verification', [
	...roots.map((root) => identity(`${root}/manifest.json`)),
	...(previousVerification ? [identity(`${previousVerification}/manifest.json`)] : []),
]);
try {
	const checkedDirectories = new Set();
	const manifests = [];
	let verifiedFiles = 0;
	let verifiedBytes = 0;
	let reusedFiles = 0;
	let lastProgress = performance.now();
	for (const root of roots) {
		const prior = previous?.manifests.find((entry) => entry.root === root);
		const priorInput = previousInputs.find((entry) => entry.path === `${root}/manifest.json`);
		if (root !== report && prior && priorInput && priorInput.sha256 === identity(`${root}/manifest.json`).sha256) {
			manifests.push({...prior, reusedFrom: previousVerification});
			reusedFiles += prior.files;
			continue;
		}
		const runRoot = checked(path.join(repository, root));
		const manifest = readEvidence(`${root}/manifest.json`);
		for (const artifact of manifest.artifacts) {
			const filename = path.resolve(repository, artifact.path);
			assert.ok(filename.startsWith(runRoot + path.sep));
			const directory = path.dirname(filename);
			if (!checkedDirectories.has(directory)) {
				checked(directory, runRoot);
				checkedDirectories.add(directory);
			}
			assert.ok(!lstatSync(filename).isSymbolicLink());
			assert.equal(realpathSync(filename).toLowerCase(), filename.toLowerCase());
			const bytes = readFileSync(filename);
			assert.equal(bytes.length, artifact.bytes, artifact.path);
			assert.equal(createHash('sha256').update(bytes).digest('hex'), artifact.sha256, artifact.path);
			verifiedFiles++;
			verifiedBytes += bytes.length;
			if (performance.now() - lastProgress > 20000) {
				run.progress('hashes', `Verified ${verifiedFiles} immutable artifacts.`, {completed: verifiedFiles});
				lastProgress = performance.now();
				await new Promise((resolve) => setTimeout(resolve, 0));
			}
		}
		const progress = readFileSync(checked(path.join(runRoot, 'progress.jsonl'), runRoot), 'utf8')
			.trim()
			.split(/\r?\n/)
			.map((line) => JSON.parse(line));
		const gaps = progress
			.slice(1)
			.map((event, i) => Date.parse(event.timestamp) - Date.parse(progress[i].timestamp));
		const maximumEventGapMilliseconds = Math.max(0, ...gaps);
		const terminalToManifestMilliseconds = Date.parse(manifest.completed) - Date.parse(progress.at(-1).timestamp);
		manifests.push({
			root,
			state: manifest.state,
			files: manifest.artifacts.length,
			maximumEventGapMilliseconds,
			terminalToManifestMilliseconds,
			monitorLimitations: maximumEventGapMilliseconds > 30000 || terminalToManifestMilliseconds > 30000,
		});
		run.progress('run-verified', `Verified immutable evidence in ${root}.`);
	}
	const primary = identity(`${runsRoot}/00014-m3-cache-sweep/build.glsl`);
	const timing = acceptedRuns('m3-timing').at(-1);
	assert.equal(
		identity(`${timing}/build.glsl`).sha256,
		primary.sha256,
		'Repeated timings must use the same build shader as discovery.',
	);
	assert.equal(identity(`${timing}/view.glsl`).sha256, identity(`${runsRoot}/00014-m3-cache-sweep/view.glsl`).sha256);
	const angular = transportDirections();
	const currentShader = candidateShader(angular, gauss(24), gauss(64));
	assert.equal(createHash('sha256').update(currentShader.build).digest('hex'), primary.sha256);
	assert.equal(
		createHash('sha256').update(currentShader.view).digest('hex'),
		identity(`${runsRoot}/00014-m3-cache-sweep/view.glsl`).sha256,
	);
	assert.ok(Math.abs(angular.reduce((sum, d) => sum + d.weight, 0) - 4 * Math.PI) < 1e-12);
	for (const d of angular) {
		assert.ok(Math.abs(Math.hypot(...d.vector) - 1) < 1e-12);
		const reflected = angular[d.mirror];
		assert.ok(
			Math.hypot(
				d.vector[0] - reflected.vector[0],
				d.vector[1] + reflected.vector[1],
				d.vector[2] - reflected.vector[2],
			) < 1e-12,
		);
	}
	let maximumRotatedIntervalDifference = 0;
	for (const item of cases()) {
		const rotate = (v) => [
			v[0] * Math.cos(0.437) - v[1] * Math.sin(0.437),
			v[0] * Math.sin(0.437) + v[1] * Math.cos(0.437),
			v[2],
		];
		const original = interval(item.origin, item.direction);
		const rotated = interval(rotate(item.origin), rotate(item.direction));
		maximumRotatedIntervalDifference = Math.max(
			maximumRotatedIntervalDifference,
			Math.abs(original.entry - rotated.entry),
			Math.abs(original.exit - rotated.exit),
		);
		assert.ok(Math.abs(clearance(item.origin) - clearance(rotate(item.origin))) < 1e-6);
	}
	assert.ok(maximumRotatedIntervalDifference < 0.02);
	const dev = readEvidence(`${acceptedRuns('m3-dev-analysis').at(-1)}/results.json`);
	const referenceBatches = readEvidence(`${runsRoot}/00017-m3-probe-dev/batches.json`);
	const groupedBatches = new Map();
	for (const batch of referenceBatches) {
		if (!groupedBatches.has(batch.group)) {
			groupedBatches.set(batch.group, []);
		}
		groupedBatches.get(batch.group).push(batch);
	}
	const groupingChecks = [...groupedBatches.keys()].filter((_, index) => index % 769 === 0);
	for (const group of groupingChecks) {
		assert.deepEqual(
			groupedBatches.get(group),
			referenceBatches.filter((batch) => batch.group === group),
		);
	}
	let maximumMirrorDifference = 0;
	for (const result of dev.results) {
		for (const control of result.controls.filter((row) => row.id.startsWith('control-mirror'))) {
			const source = control.id.slice('control-mirror-'.length);
			const original = result.physical.find((row) => row.id === `${source}-z1000-d0.25-sunward`);
			maximumMirrorDifference = Math.max(
				maximumMirrorDifference,
				...original.spectra[0].map((value, c) => Math.abs(value - control.spectra[0][c])),
			);
		}
	}
	assert.ok(maximumMirrorDifference < 1e-7);
	run.write('results.json', {
		reductionGroupingChecks: groupingChecks.length,
		previousVerification,
		reusedFiles,
		verifiedFiles,
		verifiedBytes,
		manifests,
		angularCount: angular.length,
		incomingWeightCount: angular.filter((d) => d.weight > 0).length,
		maximumRotatedIntervalDifference,
		maximumMirrorDifference,
		buildShaderMatches: true,
		viewShaderMatches: true,
		limitations:
			'Older sealed native finalization emitted its terminal event before lengthy synchronous artifact hashing. Its exact timing/progress gap is reported above, not rewritten. The current finalizer emits ongoing hash progress and a terminal event after hashing. This verification is not a standards-compliance audit.',
	});
	run.finish('accepted', {
		message:
			'Immutable parent hashes, actual shader identity, current angular reflection/weights, cap rotations, and cached mirror pairs verified; historical monitoring limitations explicitly retained.',
		verifiedFiles,
		verifiedBytes,
	});
	console.log(
		JSON.stringify({
			run: run.root,
			verifiedFiles,
			verifiedBytes,
			maximumRotatedIntervalDifference,
			maximumMirrorDifference,
			monitoringLimitations: manifests.filter((m) => m.monitorLimitations),
		}),
	);
} catch (error) {
	run.write('failure.json', {error: String(error), stack: error.stack});
	run.finish('failed', {message: String(error)});
	throw error;
}
