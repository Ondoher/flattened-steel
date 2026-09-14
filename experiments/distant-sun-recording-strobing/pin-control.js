import path from 'node:path';
import {StrobingRun} from './StrobingRun.js';

const run = await StrobingRun.allocate('pin-control');
try {
	const repository = StrobingRun.repositoryRoot;
	const parentRoot = 'tmp/experiments/distant-sun-shadow-animation-evidence/runs';
	const parents = [
		{
			runId: '1788974488678-creative-animation',
			expected: '25953f738ece16e4a82fa90f27893a58d6e8f045582a89f616a7a32fec8a4807',
		},
		{
			runId: '1789171222384-creative-strobing-diagnosis',
			expected: 'd11dfb90549a3d0df8dc9a540b2c416ace03dc01a4c5774c25449d68cf9cd4e0',
		},
	];
	for (const parent of parents) {
		await run.progress({phase: 'authenticate-parent', message: `Hashing immutable parent ${parent.runId}.`});
		const root = await StrobingRun.checkedPath(repository, `${parentRoot}/${parent.runId}`);
		const manifest = /** @type {StrobingParentManifest} */ (
			await StrobingRun.readJson(root, 'artifact-manifest.json')
		);
		const actual = await StrobingRun.inventory(root, manifest.excludedPaths);
		if (
			manifest.state !== 'accepted' ||
			manifest.artifactSetSha256 !== parent.expected ||
			actual.artifactSetSha256 !== parent.expected ||
			JSON.stringify(actual.artifacts) !== JSON.stringify(manifest.artifacts)
		)
			throw new Error(`Parent evidence authentication failed: ${parent.runId}`);
		await run.writeJson(`parent-${parent.runId}.json`, {
			sourceRoot: `${parentRoot}/${parent.runId}`,
			manifest,
			verified: true,
		});
	}
	const filmRoot = `${parentRoot}/${parents[0].runId}`;
	const trace = /** @type {StrobingParentTrace} */ (
		await StrobingRun.readJson(repository, `${filmRoot}/scene-trace.json`)
	);
	const selected = trace.frames.filter((frame) => frame.animationSeconds >= 16 && frame.animationSeconds < 20);
	if (selected.length !== 120) throw new Error('Control score must contain 120 retained states.');
	const packageRoot =
		'server/flat32/data/shared-block/2243c1ab2c2d529131759b32d72cee2a2e4b32098e1cc450c0d48cf34ed4edc7';
	const inputs = await Promise.all(
		[
			`${filmRoot}/scene-trace.json`,
			`${filmRoot}/configuration.json`,
			`${packageRoot}/package-set.json`,
			'server/flat32/features/shared-cache/selection.js',
			'dist/flat32/flat32.js',
			'experiments/distant-sun-recording-strobing/StrobingRun.js',
			'experiments/distant-sun-recording-strobing/pin-control.js',
		].map((file) => StrobingRun.identity(repository, file)),
	);
	await run.writeJson('control.json', {
		schemaId: 'strobing-control-v1',
		framesPerSecond: 30,
		durationSeconds: 4,
		width: 1280,
		height: 720,
		seed: trace.seed,
		parentAnimationIntervalSeconds: [16, 20],
		fixedCamera: selected[60].camera,
		frames: selected,
		targetPackageIdentity: path.basename(packageRoot),
		regions: {
			full: [0, 0, 1, 1],
			upper: [0, 0, 1, 1 / 3],
			horizon: [0, 1 / 3, 1, 1 / 3],
			lower: [0, 2 / 3, 1, 1 / 3],
		},
		maximumBoundaryCurvatureRatio: 1.5,
		capturePaths: ['lossless-renderer', 'retained-frame-encode', 'original-deterministic-recorder'],
		realTimeQualification: false,
	});
	await run.writeJson('provenance.json', {
		command: [process.execPath, ...process.argv.slice(1)],
		node: process.version,
		operation:
			'Authenticate complete parent artifact manifests; select original frame states 480 through 599 and fix camera to original frame 540; pin current package and build identities.',
		inputs,
		parents,
		output: 'control.json',
		limitations:
			'Control pinning does not yet establish current-package visual reproduction or completed P0-P1 review.',
	});
	await run.finish('accepted', {
		purpose: 'parent-authentication-and-control-pinning',
		frameCount: selected.length,
		cacheTransitionsInParentInterval: selected.filter((frame) => frame.modeChanged).length,
	});
} catch (error) {
	await run.finish('failed', {message: error instanceof Error ? error.message : String(error)});
	process.exitCode = 1;
}
