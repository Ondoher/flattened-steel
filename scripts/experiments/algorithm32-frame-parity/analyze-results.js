import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {loadKiderDataset, scoreCondition} from '../b1-directional-sky-radiance/benchmark.js';

const CHANNEL_COUNT = 40;
const RELATIVE_FLOOR = 1e-8;

function parseArguments(argv) {
	const options = {values: []};
	for (let index = 0; index < argv.length; index += 1) {
		if (argv[index] === '--values') {
			options.values.push(resolve(argv[++index]));
		} else if (argv[index] === '--current') {
			options.current = resolve(argv[++index]);
		} else if (argv[index] === '--authority') {
			options.authority = resolve(argv[++index]);
		} else if (argv[index] === '--output') {
			options.output = resolve(argv[++index]);
		} else {
			throw new Error(`Unknown argument: ${argv[index]}`);
		}
	}
	if (options.values.length === 0 || !options.current || !options.authority || !options.output) {
		throw new Error('--values, --current, --authority, and --output are required.');
	}
	return options;
}

function loadJsonRows(paths) {
	return paths.flatMap((path) => JSON.parse(readFileSync(path, 'utf8')));
}

function loadTableRows(path) {
	const [header, ...lines] = readFileSync(path, 'utf8').trim().split(/\r?\n/u);
	const columns = header.split('\t');
	if (columns.length !== 4 + CHANNEL_COUNT) throw new Error(`Unexpected table width: ${path}`);
	return lines.map((line) => {
		const values = line.split('\t');
		return {
			time: values[1],
			gridX: Number(values[2]),
			gridY: Number(values[3]),
			values: values.slice(4).map(Number),
		};
	});
}

function indexRows(rows) {
	return new Map(rows.map((row) => [`${row.time}:${row.gridX}:${row.gridY}`, row]));
}

function compareRows(candidateRows, authorityRows) {
	let squaredAbsoluteSum = 0;
	let squaredRelativeSum = 0;
	let signedSum = 0;
	let valueCount = 0;
	let relativeValueCount = 0;
	let maximumAbsolute = {value: -1, location: null, difference: null};
	for (const candidate of candidateRows) {
		const key = `${candidate.time}:${candidate.gridX}:${candidate.gridY}`;
		const authority = authorityRows.get(key);
		if (!authority) throw new Error(`Missing authority row ${key}.`);
		for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
			const difference = candidate.values[channelIndex] - authority.values[channelIndex];
			const absolute = Math.abs(difference);
			squaredAbsoluteSum += difference * difference;
			signedSum += difference;
			valueCount += 1;
			if (Math.abs(authority.values[channelIndex]) >= RELATIVE_FLOOR) {
				const relative = difference / authority.values[channelIndex];
				squaredRelativeSum += relative * relative;
				relativeValueCount += 1;
			}
			if (absolute > maximumAbsolute.value) {
				maximumAbsolute = {value: absolute, location: `${key}:lambda${channelIndex}`, difference};
			}
		}
	}
	return {
		valueCount,
		absoluteRms: Math.sqrt(squaredAbsoluteSum / valueCount),
		signedMean: signedSum / valueCount,
		maximumAbsolute,
		relativeFloor: RELATIVE_FLOOR,
		relativeValueCount,
		relativeRms: Math.sqrt(squaredRelativeSum / relativeValueCount),
	};
}

function createGrid(rows, time) {
	const grid = Array.from({length: 9}, () => Array(9));
	for (const row of rows.filter((candidate) => candidate.time === time)) grid[row.gridX][row.gridY] = row.values;
	return grid;
}

function analyzeCandidate(rows, authorityIndex, dataset) {
	const conditions = [...new Set(rows.map((row) => row.time))].sort();
	return Object.fromEntries(
		conditions.map((time) => {
			const conditionRows = rows.filter((row) => row.time === time);
			const measured = dataset.conditions.find((condition) => condition.time === time);
			if (!measured) throw new Error(`Missing measurement condition ${time}.`);
			const score = scoreCondition(createGrid(conditionRows, time), measured.grid);
			return [
				time,
				{
					authorityParity: compareRows(conditionRows, authorityIndex),
					b1: {
						sampleCount: score.sampleCount,
						rmseMilliwatt: score.rmseMilliwatt,
						paperRoundedRmseMilliwatt: score.paperRoundedRmseMilliwatt,
						worstAbsoluteResidualW: score.worstAbsoluteResidualW,
						worst: score.worst,
					},
				},
			];
		}),
	);
}

const options = parseArguments(process.argv.slice(2));
const authorityRows = options.authority.endsWith('.json')
	? loadJsonRows([options.authority])
	: loadTableRows(options.authority);
const authorityIndex = indexRows(authorityRows);
const counterfactualRows = loadJsonRows(options.values);
const selectedTimes = [...new Set(counterfactualRows.map((row) => row.time))];
const currentRows = loadTableRows(options.current).filter((row) => selectedTimes.includes(row.time));
const dataset = loadKiderDataset();
const result = {
	selectedTimes,
	counterfactual: analyzeCandidate(counterfactualRows, authorityIndex, dataset),
	current: analyzeCandidate(currentRows, authorityIndex, dataset),
};
mkdirSync(options.output, {recursive: true});
writeFileSync(resolve(options.output, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
