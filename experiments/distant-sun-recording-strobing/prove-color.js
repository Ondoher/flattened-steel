import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {StrobingRun} from './StrobingRun.js';
import {StrobingColorPatch} from './StrobingColorPatch.js';

const run = await StrobingRun.allocate('color-proof');
try {
	const modelPath =
		'src/algorithm32/implementation/color-reset-slope-078-p9/ColorResetSlope078P9ColorDisplayModel.js';
	const constantsPath = 'src/algorithm32/implementation/color-reset-slope-078-p9/consts.js';
	const modelFile = await StrobingRun.checkedPath(StrobingRun.repositoryRoot, modelPath);
	const constantsFile = await StrobingRun.checkedPath(StrobingRun.repositoryRoot, constantsPath);
	const modelSource = await readFile(modelFile, 'utf8');
	const constantsSource = await readFile(constantsFile, 'utf8');
	const results = [];
	/** @type {StrobingColorResponse[]} */
	const responses = ['original-p9', 'no-sunset-boost', 'monotone-p2'];
	for (const response of responses) {
		const constants = StrobingColorPatch.apply(constantsSource, response);
		const constantsUrl = `data:text/javascript;base64,${Buffer.from(constants.source).toString('base64')}`;
		const source = modelSource.replace(
			/from '([^']+)'/gu,
			(_, relative) =>
				`from '${relative === './consts.js' ? constantsUrl : new URL(relative, pathToFileURL(modelFile)).href}'`,
		);
		await writeFile(path.join(run.directory, `${response}.js`), source, {flag: 'wx'});
		const loaded = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
		const model = /** @type {StrobingColorProofModel} */ (new loaded.ColorResetSlope078P9ColorDisplayModel());
		const rows = Array.from({length: 6001}, (_, index) => {
			const lux = 10 ** (-6 + (index * 13) / 6000);
			const input = {value: lux, units: /** @type {const} */ ('lux')};
			const gain = model.displayGain(input);
			const elasticity = model.displayGainLogElasticity(input);
			return {lux, gain, elasticity, response: lux * gain, responseLogSlope: 1 + elasticity};
		});
		const minimumResponseLogSlope = Math.min(...rows.map((row) => row.responseLogSlope));
		const monotone = rows.every((row, index) => index === 0 || row.response > rows[index - 1].response);
		if (
			response === 'original-p9'
				? monotone || minimumResponseLogSlope >= 0
				: !monotone || minimumResponseLogSlope <= 0
		)
			throw new Error(`Unexpected physical-to-display response for ${response}.`);
		await run.writeJson(`${response}.json`, rows);
		const shader = model._displayEncodeBlock();
		const expectedPower = response === 'monotone-p2' ? 2 : 9;
		if (!shader.includes(`COLOR_RESET_SUNSET_ROLLOFF_POWER = ${expectedPower.toFixed(1)};`))
			throw new Error('Generated shader differs from the CPU curve constants.');
		await writeFile(path.join(run.directory, `${response}.glsl`), shader, {flag: 'wx'});
		results.push({response, monotone, minimumResponseLogSlope, curve: model.curve});
	}
	// For p2, b(E) = -d(log baseGain)/d(log E) rises up to E=980*(4.5)^0.25.
	// The adaptation contribution is <=0.78*sigmoid(log(385/(E+0.02))/0.1).
	// These independent bounds cover the entire nonnegative illuminance axis.
	/** @param {number} lux */
	const baseElasticity = (lux) => {
		const q = (lux / 980) ** 2;
		return (7 * q) / ((1 + q) * (4.5 + q));
	};
	/** @param {number} lux */
	const adaptationBound = (lux) => 0.78 / (1 + ((lux + 0.02) / 385) ** 10);
	const intervals = [
		{lux: [0, 385], upperNegativeElasticity: baseElasticity(385) + 0.78},
		{lux: [385, 500], upperNegativeElasticity: baseElasticity(500) + adaptationBound(385)},
		{
			lux: [500, 'infinity'],
			upperNegativeElasticity: (2 * (Math.sqrt(4.5) - 1)) / (Math.sqrt(4.5) + 1) + adaptationBound(500),
		},
	];
	if (intervals.some((interval) => interval.upperNegativeElasticity >= 1))
		throw new Error('Analytic monotonicity bound failed.');
	await run.writeJson('proof.json', {
		results,
		intervals,
		claim: 'For every E>=0, d(E*gain(E))/dE>0 for p2. This proportional-radiance response proof does not replace actual spectral sky captures.',
		mechanism:
			'p9 gain has elasticity below -1; a continuous but steep gain creates a broad brightness reversal without a code branch.',
	});
	await run.writeJson('provenance.json', {
		parents: [
			await StrobingRun.identity(StrobingRun.repositoryRoot, modelPath),
			await StrobingRun.identity(StrobingRun.repositoryRoot, constantsPath),
		],
		nativeDependencies: await StrobingRun.inventory(path.join(StrobingRun.repositoryRoot, 'src/algorithm32')),
		operation:
			'Derive executable native models from read-only source using the same constants patch as the frozen browser bundle; inspect CPU response and generated GLSL, plus analytic interval bounds.',
		implementation: await StrobingRun.inventory(
			path.join(StrobingRun.repositoryRoot, 'experiments/distant-sun-recording-strobing'),
			['node_modules'],
		),
		node: process.version,
	});
	await run.finish('accepted', {results, intervals});
} catch (error) {
	await run.finish('failed', {error: error instanceof Error ? error.stack : String(error)});
	process.exitCode = 1;
}
