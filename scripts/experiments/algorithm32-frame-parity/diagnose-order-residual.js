import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const CHANNEL_COUNT = 40;
const CONDITION = '12:45';

/**
 * Called by the residual diagnostic to parse its bounded command-line inputs.
 *
 * @param {readonly string[]} arguments_ - Command-line arguments after the executable and script path.
 * @returns {object} - Paths for each candidate, authority, and the output record.
 */
function parseArguments(arguments_) {
	const options = {};
	for (let index = 0; index < arguments_.length; index += 1) {
		const argument = arguments_[index];
		if (argument === '--j2-values') options.j2Values = resolve(arguments_[++index]);
		else if (argument === '--j3-values') options.j3Values = resolve(arguments_[++index]);
		else if (argument === '--j4-values') options.j4Values = resolve(arguments_[++index]);
		else if (argument === '--j2-authority') options.j2Authority = resolve(arguments_[++index]);
		else if (argument === '--j3-authority') options.j3Authority = resolve(arguments_[++index]);
		else if (argument === '--j4-authority') options.j4Authority = resolve(arguments_[++index]);
		else if (argument === '--output') options.output = resolve(arguments_[++index]);
		else throw new Error(`Unknown argument: ${argument}`);
	}
	const required = [
		'j2Values',
		'j3Values',
		'j4Values',
		'j2Authority',
		'j3Authority',
		'j4Authority',
		'output',
	];
	for (const property of required) {
		if (!options[property]) throw new Error(`--${property.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`)} is required.`);
	}
	return options;
}

/**
 * Called by the residual diagnostic to load one generated JSON boundary.
 *
 * @param {string} path - Generated values path.
 * @returns {Map<string, object>} - Boundary rows keyed by condition and grid location.
 */
function loadJsonBoundary(path) {
	return indexRows(JSON.parse(readFileSync(path, 'utf8')));
}

/**
 * Called by the residual diagnostic to load one retained direct-40 boundary.
 *
 * @param {string} path - Retained table path.
 * @returns {Map<string, object>} - Boundary rows keyed by condition and grid location.
 */
function loadTableBoundary(path) {
	const [header, ...lines] = readFileSync(path, 'utf8').trim().split(/\r?\n/u);
	if (header.split('\t').length !== 4 + CHANNEL_COUNT) throw new Error(`Unexpected table width: ${path}`);
	return indexRows(
		lines.map((line) => {
			const fields = line.split('\t');
			return {
				time: fields[1],
				gridX: Number(fields[2]),
				gridY: Number(fields[3]),
				values: fields.slice(4).map(Number),
			};
		}),
	);
}

/**
 * Called by boundary loaders to establish exact row correspondence.
 *
 * @param {readonly object[]} rows - Boundary rows.
 * @returns {Map<string, object>} - Boundary rows keyed by condition and grid location.
 */
function indexRows(rows) {
	return new Map(
		rows
			.filter((row) => row.time === CONDITION)
			.map((row) => [`${row.time}:${row.gridX}:${row.gridY}`, row]),
	);
}

/**
 * Called by the residual diagnostic to subtract two aligned boundaries.
 *
 * @param {ReadonlyMap<string, object>} leftRows - Minuend boundary.
 * @param {ReadonlyMap<string, object>} rightRows - Subtrahend boundary.
 * @returns {Map<string, number[]>} - Spectral differences keyed by row.
 */
function subtract(leftRows, rightRows) {
	const result = new Map();
	for (const [key, leftRow] of leftRows) {
		const rightRow = rightRows.get(key);
		if (!rightRow) throw new Error(`Missing aligned row: ${key}`);
		result.set(
			key,
			leftRow.values.map((value, channelIndex) => value - rightRow.values[channelIndex]),
		);
	}
	return result;
}

/**
 * Called by the residual diagnostic to subtract two aligned residual fields.
 *
 * @param {ReadonlyMap<string, readonly number[]>} leftRows - Minuend residual field.
 * @param {ReadonlyMap<string, readonly number[]>} rightRows - Subtrahend residual field.
 * @returns {Map<string, number[]>} - Incremental residual field.
 */
function subtractResiduals(leftRows, rightRows) {
	const result = new Map();
	for (const [key, leftValues] of leftRows) {
		const rightValues = rightRows.get(key);
		if (!rightValues) throw new Error(`Missing aligned residual row: ${key}`);
		result.set(
			key,
			leftValues.map((value, channelIndex) => value - rightValues[channelIndex]),
		);
	}
	return result;
}

/**
 * Called by the residual diagnostic to summarize a residual field without hiding its shape.
 *
 * @param {ReadonlyMap<string, readonly number[]>} rows - Residual spectra by location.
 * @returns {object} - Global, row, and spectral residual metrics.
 */
function summarize(rows) {
	let squaredSum = 0;
	let signedSum = 0;
	let valueCount = 0;
	let maximum = {absolute: -1, signed: 0, location: null};
	const rowMetrics = [];
	const channelSquaredSums = Array(CHANNEL_COUNT).fill(0);
	const channelMaximums = Array.from({length: CHANNEL_COUNT}, () => 0);
	for (const [key, values] of rows) {
		let rowSquaredSum = 0;
		let rowMaximum = 0;
		for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
			const residual = values[channelIndex];
			const absolute = Math.abs(residual);
			squaredSum += residual * residual;
			signedSum += residual;
			valueCount += 1;
			rowSquaredSum += residual * residual;
			rowMaximum = Math.max(rowMaximum, absolute);
			channelSquaredSums[channelIndex] += residual * residual;
			channelMaximums[channelIndex] = Math.max(channelMaximums[channelIndex], absolute);
			if (absolute > maximum.absolute) maximum = {absolute, signed: residual, location: `${key}:lambda${channelIndex}`};
		}
		rowMetrics.push({location: key, rms: Math.sqrt(rowSquaredSum / CHANNEL_COUNT), maximumAbsolute: rowMaximum});
	}
	rowMetrics.sort((left, right) => right.rms - left.rms);
	const rowCount = rows.size;
	const channelMetrics = channelSquaredSums.map((sum, channelIndex) => ({
		channelIndex,
		rms: Math.sqrt(sum / rowCount),
		maximumAbsolute: channelMaximums[channelIndex],
	}));
	channelMetrics.sort((left, right) => right.rms - left.rms);
	return {
		valueCount,
		absoluteRms: Math.sqrt(squaredSum / valueCount),
		signedMean: signedSum / valueCount,
		maximum,
		topRows: rowMetrics.slice(0, 10),
		topChannels: channelMetrics.slice(0, 10),
	};
}

const options = parseArguments(process.argv.slice(2));
const candidates = new Map([
	[2, loadJsonBoundary(options.j2Values)],
	[3, loadJsonBoundary(options.j3Values)],
	[4, loadJsonBoundary(options.j4Values)],
]);
const authorities = new Map([
	[2, loadTableBoundary(options.j2Authority)],
	[3, loadTableBoundary(options.j3Authority)],
	[4, loadTableBoundary(options.j4Authority)],
]);
const residuals = new Map();
for (const order of [2, 3, 4]) residuals.set(order, subtract(candidates.get(order), authorities.get(order)));
const result = {
	schema: 'algorithm32-retained-frame-order-residual-v1',
	status: 'COMPLETE',
	condition: CONDITION,
	cumulative: {
		j2: summarize(residuals.get(2)),
		j3: summarize(residuals.get(3)),
		j4: summarize(residuals.get(4)),
	},
	increments: {
		j3MinusJ2: summarize(subtractResiduals(residuals.get(3), residuals.get(2))),
		j4MinusJ3: summarize(subtractResiduals(residuals.get(4), residuals.get(3))),
	},
};
mkdirSync(options.output, {recursive: false});
writeFileSync(resolve(options.output, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, {encoding: 'utf8', flag: 'wx'});
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
