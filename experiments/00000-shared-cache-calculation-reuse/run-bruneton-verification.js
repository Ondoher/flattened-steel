import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ExperimentRun from './ExperimentRun.js';

const run = new ExperimentRun();
await run.start('bruneton-verification');
try {
	const git = (...args) =>
		execFileSync('git', ['-C', run.repository, ...args], {encoding: 'utf8', windowsHide: true}).trim();
	const scorerRevision = git('rev-parse', 'HEAD');
	assert.equal(
		git(
			'status',
			'--porcelain=v1',
			'--untracked-files=all',
			'--',
			'scripts',
			'src',
			'references',
			'package.json',
			'package-lock.json',
		),
		'',
		'Scorer, dependencies, and reference inputs must match the recorded revision.',
	);
	const previous = 'tmp/extraterrestrial/production-color-reset/p8/c1-9-execution-000001';
	const assets = 'tmp/extraterrestrial/production-color-reset/p8/c1-9-canonical-v8-assets-000001';
	const boundary =
		'tmp/extraterrestrial/production-color-reset/p8/c1-9-canonical-v8-boundary-000001/b1-directional-sky-radiance/gpu';
	const candidate =
		'tmp/experiments/00000-shared-cache-calculation-reuse/runs/2026-09-10T22-23-13-107Z-direct40-321ad547-9fd1-4443-b89a-d5ad5b8a576d';
	const indexBytes = await run.read(`${previous}/artifact-index.json`);
	assert.equal(run.files.hash(indexBytes), 'bc7a64cad139b54bc3c71b92bca358dbb34c7f39b6856bc4b5eeb1268c19aa68');
	const index = JSON.parse(indexBytes.toString('utf8'));
	/** Authenticate an original artifact against the previously published index. */
	const readOriginal = async (relative) => {
		const identity = index.artifacts.find((entry) => entry.path === relative);
		assert.ok(identity, `Unindexed original artifact: ${relative}`);
		return run.read(relative, identity);
	};
	const manifest = JSON.parse((await readOriginal(`${boundary}/manifest.json`)).toString('utf8'));
	const seal = JSON.parse((await run.read(`${candidate}/sealed.json`)).toString('utf8'));
	assert.equal(seal.state, 'accepted');
	assert.equal(seal.result.results.length, manifest.assetSet.assets.length);
	const mappings = [];
	for (const entry of manifest.assetSet.assets) {
		const original = JSON.parse((await readOriginal(`${assets}/${entry.manifestPath}`)).toString('utf8'));
		const result = seal.result.results.find((item) => item.id === entry.condition.id);
		assert.ok(result?.exact);
		const parent = index.artifacts.find(
			(item) => item.sha256 === original.cumulativeScatteringDensity.sha256 && item.path.endsWith('.f32'),
		);
		assert.ok(parent);
		assert.equal(result.artifact.sha256, parent.sha256);
		assert.equal(result.artifact.byteLength, parent.byteLength);
		assert.ok(result.artifact.path.startsWith(`${candidate}/`));
		const actual = await run.read(result.artifact.path, result.artifact);
		assert.ok(actual.equals(await readOriginal(parent.path)));
		mappings.push({condition: entry.condition, candidate: result.artifact, original: parent});
		run.progress({
			phase: 'cache-equivalence',
			completed: mappings.length,
			total: manifest.assetSet.assets.length,
			message: `${entry.condition.id}: exact cache bytes permit reuse of the existing final-view measurement.`,
		});
	}
	// Authenticate all files consumed from the measured production boundary, including figures.
	const figures = [];
	for (const artifact of index.artifacts.filter((item) => item.path.startsWith(`${boundary}/`))) {
		const bytes = await readOriginal(artifact.path);
		if (/\.(svg|png)$/u.test(artifact.path)) {
			const copied = await run.write(path.posix.basename(artifact.path), bytes);
			figures.push({
				parent: artifact,
				copy: copied,
				operation:
					'Exact byte copy of the original Basic Bruneton figure for an identical numerical candidate.',
			});
		}
	}
	assert.equal(figures.length, 6);
	/** Load an unchanged benchmark entry and retain its implementation identity. */
	const load = async (relative) => {
		await run.read(relative);
		return import(pathToFileURL(await run.files.resolve(relative)).href);
	};
	const b1Module = await load('scripts/experiments/b1-directional-sky-radiance/run.js');
	const b2Module = await load('scripts/experiments/b2-hemispherical-sky-irradiance/run.js');
	const b3Module = await load('scripts/experiments/b3-matched-atmosphere-solver/run.js');
	const scoring = await load('scripts/experiments/b1-directional-sky-radiance/score-production-run.js');
	const productionRunPath = await run.files.resolve(`${boundary}/manifest.json`);
	run.progress({
		phase: 'scoring',
		message: 'Rescoring authenticated final-view data with unchanged B1, B2 and B3 algorithms.',
	});
	const b1 = b1Module.runExperiment({productionRunPath});
	const b2 = b2Module.runExperiment({productionRunPath});
	await run.write('b1-result.md', Buffer.from(b1Module.renderReport(b1)));
	const b3 = b3Module.runExperiment({
		productionRunPath,
		b1ResultPath: await run.files.resolve(`${run.root}/b1-result.md`),
	});
	await run.write('b2-result.md', Buffer.from(b2Module.renderReport(b2)));
	await run.write('b3-result.md', Buffer.from(b3Module.renderReport(b3)));
	const baseline = JSON.parse((await readOriginal(`${previous}/b-family-result.json`)).toString('utf8'));
	assert.deepEqual(b1.proposedStage.score, baseline.b1.score);
	assert.deepEqual(b2.proposedScore, baseline.b2.score);
	assert.deepEqual(b3.proposed, baseline.b3.proposed);
	assert.deepEqual(b1.proposedStage.assessment, baseline.b1.assessment);
	assert.deepEqual(b2.proposedAssessment, baseline.b2.assessment);
	assert.deepEqual(b3.proposedAssessment, baseline.b3.assessment);
	let rejection = null;
	try {
		scoring.assertProductionBFamilyCloseout({b1, b2, b3});
	} catch (error) {
		rejection = error.message;
	}
	assert.equal(rejection, baseline.rejection);
	const result = {
		verification: 'accepted',
		benchmarkCloseout: rejection ? 'rejected' : 'accepted',
		rejection,
		b1: {
			rmseMilliwatt: b1.proposedStage.score.aggregate.rmseMilliwatt,
			maximumRmseMilliwatt: scoring.PRODUCTION_B1_CLOSEOUT_MAXIMUM_RMSE_MILLIWATT,
			classification: b1.proposedStage.assessment.classification,
		},
		b2: {
			rmseWattsPerSquareMeter: b2.proposedScore.rmseWattsPerSquareMeter,
			classification: b2.proposedAssessment.classification,
		},
		b3: b3.proposedAssessment,
		cacheCount: mappings.length,
		figureCount: figures.length,
		newGpuCalculations: 0,
		derivation:
			'Exact candidate/parent cache-byte comparison -> authenticated existing final-view table and cube -> unchanged B1/B2/B3 scoring. Verification acceptance is distinct from benchmark closeout.',
	};
	await run.write('derivation.json', {
		scorerRevision,
		scorerWorktree:
			'Clean tracked and untracked state under scripts, src, references, package.json and package-lock.json at execution start; existing generated measurement inputs are separately authenticated.',
		mappings,
		figures,
		measurementManifest: `${boundary}/manifest.json`,
		scoringInputs: {b1: b1.inputs, b2: b2.inputs, b3: b3.inputs},
	});
	await run.write('benchmark-verification.json', result);
	await run.finish('accepted', result);
} catch (error) {
	await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
}
