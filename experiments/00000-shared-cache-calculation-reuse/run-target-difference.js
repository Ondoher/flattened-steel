import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import ExperimentRun from './ExperimentRun.js';

const run = new ExperimentRun();
await run.start('target-difference');
try {
	const targetRoot = 'tmp/extraterrestrial/color-reset/runs/000065-color-reset-qualification';
	const targetPath = `${targetRoot}/data/b1-point-local-direct40-w27-q30.tsv`;
	const currentPath =
		'tmp/extraterrestrial/production-color-reset/p8/c1-9-canonical-v8-boundary-000001/b1-directional-sky-radiance/gpu/algorithm32-current-production-gpu-j4.tsv';
	const target = await run.read(targetPath);
	const current = await run.read(currentPath);
	assert.equal(run.files.hash(target), 'e6d62e23ec0184cc9941e8305d4ea9e69691cf996d5bce8523afb641830ce634');
	assert.equal(run.files.hash(current), '30516f2c605d8466170c7ea500eaa95eccb5f0512c9d0e0e67801c1fc1fab6f4');
	for (const name of ['benchmark.js', 'benchmark-domain.js', 'published-oracle.js'])
		await run.read(`scripts/experiments/b1-directional-sky-radiance/${name}`);
	const modulePath = await run.files.resolve('scripts/experiments/b1-directional-sky-radiance/benchmark.js');
	const benchmark = await import(pathToFileURL(modulePath).href);
	const dataset = benchmark.loadKiderDataset();
	assert.equal(dataset.rawAcquisitionSha256, benchmark.EXPECTED_DATASET_FINGERPRINTS.rawAcquisitionSha256);
	assert.equal(dataset.processedGridSha256, benchmark.EXPECTED_DATASET_FINGERPRINTS.processedGridSha256);
	const targetModels = benchmark.parseSpectraTsv(await run.files.resolve(targetPath));
	const currentModels = benchmark.parseSpectraTsv(await run.files.resolve(currentPath));
	assert.equal(targetModels.size, 1);
	assert.equal(currentModels.size, 1);
	const targetGrid = targetModels.values().next().value;
	const currentGrid = currentModels.values().next().value;
	const targetScore = benchmark.scoreModels(dataset, targetModels).values().next().value;
	const currentScore = benchmark.scoreModels(dataset, currentModels).values().next().value;
	assert.equal(targetScore.aggregate.rmseMilliwatt, 11.554012538468113);
	assert.equal(currentScore.aggregate.rmseMilliwatt, 11.831044211622888);
	const samples = [];
	for (const condition of dataset.conditions)
		for (let x = 0; x < 9; x++)
			for (let y = 0; y < 9; y++)
				for (let channel = 0; channel < 40; channel++) {
					const a = targetGrid.get(condition.time)[x][y][channel];
					const b = currentGrid.get(condition.time)[x][y][channel];
					const measured = condition.grid[x][y][channel];
					samples.push({
						time: condition.time,
						x,
						y,
						channel,
						wavelengthNm: 360 + 11.75 * channel,
						target: a,
						current: b,
						measured,
						delta: b - a,
						scored: benchmark.SCORE_SAMPLE_INDICES.includes(channel),
						squaredErrorChange: (b - measured) ** 2 - (a - measured) ** 2,
					});
				}
	assert.equal(samples.length, 17 * 81 * 40);
	const summary = (rows) => ({
		count: rows.length,
		rmseMilliwatt: 1000 * Math.sqrt(rows.reduce((s, r) => s + r.delta ** 2, 0) / rows.length),
		biasMilliwatt: (1000 * rows.reduce((s, r) => s + r.delta, 0)) / rows.length,
		squaredErrorChange: rows.filter((r) => r.scored).reduce((s, r) => s + r.squaredErrorChange, 0),
		maximum: rows.reduce((a, b) => (Math.abs(a.delta) >= Math.abs(b.delta) ? a : b)),
	});
	const scored = samples.filter((r) => r.scored);
	const result = {
		targetScore: targetScore.aggregate,
		currentScore: currentScore.aggregate,
		allChannels: summary(samples),
		scoredChannels: summary(scored),
		perTime: dataset.conditions.map((c) => ({
			time: c.time,
			...summary(samples.filter((r) => r.time === c.time)),
			targetRmse: targetScore.conditionScores.find((s) => s.time === c.time).rmseMilliwatt,
			currentRmse: currentScore.conditionScores.find((s) => s.time === c.time).rmseMilliwatt,
		})),
		perDirection: Array.from({length: 81}, (_, i) => ({
			x: Math.floor(i / 9),
			y: i % 9,
			...summary(scored.filter((r) => r.x === Math.floor(i / 9) && r.y === i % 9)),
		})),
		perWavelength: Array.from({length: 40}, (_, channel) => ({
			channel,
			wavelengthNm: 360 + 11.75 * channel,
			...summary(samples.filter((r) => r.channel === channel)),
		})),
		largestDifferences: [...samples].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 20),
		largestScoreRegressions: [...scored].sort((a, b) => b.squaredErrorChange - a.squaredErrorChange).slice(0, 20),
	};
	await run.write('target-difference.json', result);
	await run.write('derivation.json', {
		operation:
			'Join authenticated tables by time/grid/wavelength; delta=current-target; score change=(current-measured)^2-(target-measured)^2; unchanged benchmark scoring on 31 selected channels.',
		rawAcquisitionSha256: dataset.rawAcquisitionSha256,
		processedGridSha256: dataset.processedGridSha256,
	});
	await run.finish('accepted', {
		target: result.targetScore.rmseMilliwatt,
		current: result.currentScore.rmseMilliwatt,
		sampleCount: samples.length,
		comparison: result.scoredChannels,
	});
} catch (error) {
	await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
}
