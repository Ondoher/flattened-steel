import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {loadKiderDataset} from '../b1-directional-sky-radiance/benchmark.js';
import {FrameGpuHost} from './FrameGpuHost.js';

const RETAINED_TABLE = resolve(
	'references/results/B1-3 Saved Results/b1-directional-sky-radiance/algorithm32-paper-j2-direct-40.tsv',
);

function parseArguments(argv) {
	const options = {conditions: ['11:15']};
	for (let index = 0; index < argv.length; index += 1) {
		if (argv[index] === '--conditions') options.conditions = argv[++index].split(',');
		else if (argv[index] === '--output') options.output = resolve(argv[++index]);
		else throw new Error(`Unknown argument: ${argv[index]}`);
	}
	if (!options.output) throw new Error('--output is required.');
	return options;
}

function loadRetainedRows(conditionTimes) {
	const [, ...lines] = readFileSync(RETAINED_TABLE, 'utf8').trim().split(/\r?\n/u);
	return new Map(
		lines
			.map((line) => line.split('\t'))
			.filter((values) => conditionTimes.includes(values[1]))
			.map((values) => [`${values[1]}:${values[2]}:${values[3]}`, values.slice(4).map(Number)]),
	);
}

function compareRows(rows, retainedRows) {
	let squared = 0;
	let signed = 0;
	let maximumAbsolute = -1;
	let maximumLocation = null;
	let count = 0;
	for (const row of rows) {
		const retained = retainedRows.get(`${row.time}:${row.gridX}:${row.gridY}`);
		for (let channelIndex = 0; channelIndex < row.values.length; channelIndex += 1) {
			const difference = row.values[channelIndex] - retained[channelIndex];
			const absolute = Math.abs(difference);
			squared += difference * difference;
			signed += difference;
			count += 1;
			if (absolute > maximumAbsolute) {
				maximumAbsolute = absolute;
				maximumLocation = {time: row.time, gridX: row.gridX, gridY: row.gridY, channelIndex, difference};
			}
		}
	}
	return {
		count,
		absoluteRms: Math.sqrt(squared / count),
		signedMean: signed / count,
		maximumAbsolute,
		maximumLocation,
	};
}

async function main() {
	const options = parseArguments(process.argv.slice(2));
	mkdirSync(options.output, {recursive: true});
	const progressLogPath = resolve(options.output, 'progress.log');
	const dataset = loadKiderDataset();
	const host = new FrameGpuHost({progressLogPath});
	const rows = [];
	try {
		await host.open();
		for (const time of options.conditions) {
			const condition = dataset.conditions.find((candidate) => candidate.time === time);
			if (!condition) throw new Error(`Unknown B1 condition ${time}.`);
			const result = await host.generateCondition({
				time,
				fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
				maximumScatteringOrder: 2,
			});
			for (let gridY = 0; gridY < 9; gridY += 1) {
				for (let gridX = 0; gridX < 9; gridX += 1) {
					rows.push({time, gridX, gridY, values: result.values[gridY * 9 + gridX]});
				}
			}
		}
	} finally {
		await host.close();
	}
	const comparison = compareRows(rows, loadRetainedRows(options.conditions));
	writeFileSync(
		resolve(options.output, 'result.json'),
		`${JSON.stringify({conditions: options.conditions, comparison}, null, 2)}\n`,
	);
	writeFileSync(resolve(options.output, 'values.json'), `${JSON.stringify(rows)}\n`);
	process.stdout.write(`${JSON.stringify(comparison)}\n`);
}

await main();
