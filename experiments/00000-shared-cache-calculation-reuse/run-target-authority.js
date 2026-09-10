import assert from 'node:assert/strict';
import ExperimentRun from './ExperimentRun.js';

const run = new ExperimentRun();
await run.start('target-authority');
try {
	const root = 'tmp/extraterrestrial/color-reset/runs/000065-color-reset-qualification';
	const manifest = JSON.parse((await run.read(`${root}/artifact-manifest.json`)).toString('utf8'));
	assert.equal(manifest.artifactSetSha256, '1f5fa1226d1520847fa900fea14870144e6c07f1cbecd11dc0ff4246d2b8bfe1');
	assert.equal(manifest.conclusion, 'accepted');
	let identityLines = '';
	for (const artifact of manifest.artifacts) {
		await run.read(`${root}/${artifact.path}`, {...artifact, path: `${root}/${artifact.path}`});
		identityLines += `${artifact.path}\0${artifact.byteLength}\0${artifact.sha256}\n`;
	}
	assert.equal(run.files.hash(identityLines), manifest.artifactSetSha256);
	const result = JSON.parse((await run.read(`${root}/result.json`)).toString('utf8'));
	assert.equal(result.accepted, true);
	assert.ok(Object.values(result.gates).every((value) => value === true));
	const tableName = 'data/b1-point-local-direct40-w27-q30.tsv';
	const target = await run.read(`${root}/${tableName}`);
	const earlier = await run.read(
		`tmp/extraterrestrial/color-reset/runs/000064-color-reset-qualification/${tableName}`,
	);
	assert.ok(target.equals(earlier));
	assert.equal(run.files.hash(target), 'e6d62e23ec0184cc9941e8305d4ea9e69691cf996d5bce8523afb641830ce634');
	const evidenceRoots = [
		'tmp/experiments/00000-shared-cache-calculation-reuse/runs/2026-09-10T23-42-42-576Z-target-difference-6f9e7cd2-b54b-422a-9fcb-27a583928284',
		'tmp/experiments/00000-shared-cache-calculation-reuse/runs/2026-09-10T23-48-49-925Z-view-isolation-045710df-bc0a-4765-9965-5b6b73f79232',
	];
	for (const evidenceRoot of evidenceRoots) {
		const seal = JSON.parse((await run.read(`${evidenceRoot}/sealed.json`)).toString('utf8'));
		assert.equal(seal.state, 'accepted');
		for (const artifact of seal.artifacts) {
			assert.ok(artifact.path.startsWith(`${evidenceRoot}/`));
			await run.read(artifact.path, artifact);
		}
	}
	const sources = [
		'scripts/algorithm32/production-b-experiments/DistantSunProfileCompilerInputs.js',
		'scripts/algorithm32/production-b-experiments/B1Direct40AssetCache.js',
		'scripts/experiments/b1-directional-sky-radiance/production-gpu-browser.js',
		'src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCache.js',
		'src/flat32/Algorithm32Runtime.js',
		'experiments/extraterrestrial/solar-zenith-cache/point-local-scene-cache/runB1PointLocalBrowser.js',
		'experiments/extraterrestrial/solar-zenith-cache/point-local-scene-cache/b1PointLocalInputs.js',
	];
	for (const source of sources) await run.read(source);
	const verification = {
		authority: root,
		artifactCount: manifest.artifacts.length,
		artifactSetSha256: manifest.artifactSetSha256,
		b1: result.b1,
		earlierTargetTableIdentical: true,
		reusedEvidence: evidenceRoots,
		operation:
			'Verify all sealed correctness-authority artifacts and aggregate identity; establish exact table equality with the already analyzed target; verify analysis artifacts and identify inspected routing sources.',
		finding:
			'B1 compiler emits a single solar-zenith node and its dedicated runtime indexes altitude/direction/wavelength. Flat32 shared runtime instead interpolates per-point solar zenith and rotates directions into the actual-point frame. B1 is not exercising that accepted local-angle dimension.',
		limitation:
			'Source routing and table differences are established; this is not a corrected end-to-end B1 execution or a decomposition of every numerical contribution.',
	};
	await run.write('authority-and-routing.json', verification);
	await run.finish('accepted', verification);
} catch (error) {
	await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
}
