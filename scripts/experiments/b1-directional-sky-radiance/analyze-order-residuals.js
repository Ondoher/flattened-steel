import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const CURRENT_ROOT = resolve(
	'tmp/algorithm32-bruneton-paper/compile-diagnostics/005-saved-b1-order-comparison/b1-directional-sky-radiance/gpu',
);
const AUTHORITY_ROOT = resolve('references/results/B1-3 Saved Results/b1-directional-sky-radiance');
const J1_ROOT = resolve('tmp/algorithm32-bruneton-paper/exact-j1-diagnostic/002-three-time-order-sweep-observable');
const OUTPUT_ROOT = resolve('tmp/algorithm32-bruneton-paper/exact-j1-diagnostic/003-order-increment-analysis');
const ORDERS = Object.freeze([2, 3, 4]);
const CHANNEL_COUNT = 40;

/**
 * Called by order-residual analysis to parse one direct-40 boundary.
 *
 * @param {string} path - Boundary table path.
 * @returns {Map<string, {time: string, gridX: number, gridY: number, values: number[]}>} - Rows by condition and view location.
 */
function readBoundary(path) {
	const lines = readFileSync(path, 'utf8').trim().split(/\r?\n/u);
	lines.shift();
	const rows = new Map();
	for (const line of lines) {
		const fields = line.split('\t');
		const row = {
			time: fields[1],
			gridX: Number(fields[2]),
			gridY: Number(fields[3]),
			values: fields.slice(4).map(Number),
		};
		rows.set(`${row.time}/${row.gridX}/${row.gridY}`, row);
	}
	return rows;
}

/**
 * Called by order-residual analysis to subtract aligned spectral boundaries.
 *
 * @param {ReadonlyMap<string, {values: readonly number[]}>} minuend - Left boundary.
 * @param {ReadonlyMap<string, {values: readonly number[]}>} subtrahend - Right boundary.
 * @returns {Map<string, {values: number[]}>} - Difference boundary.
 */
function subtract(minuend, subtrahend) {
	const difference = new Map();
	for (const [key, left] of minuend) {
		const right = subtrahend.get(key);
		if (!right) throw new Error(`Difference boundary is missing row ${key}.`);
		difference.set(key, {values: left.values.map((value, index) => value - right.values[index])});
	}
	return difference;
}

/**
 * Called by order-residual analysis to measure one difference boundary against zero.
 *
 * @param {ReadonlyMap<string, {values: readonly number[]}>} residualRows - Residual values by location.
 * @returns {object} - RMS, signed mean, and maximum residual evidence.
 */
function measureResidual(residualRows) {
	let valueCount = 0;
	let sum = 0;
	let squaredSum = 0;
	let maximumAbsolute = {value: -1, signedValue: 0, location: null};
	const byCondition = {};
	for (const [key, row] of residualRows) {
		const time = key.split('/')[0];
		byCondition[time] ??= {valueCount: 0, squaredSum: 0};
		for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
			const residual = row.values[channelIndex];
			const absolute = Math.abs(residual);
			valueCount += 1;
			sum += residual;
			squaredSum += residual * residual;
			byCondition[time].valueCount += 1;
			byCondition[time].squaredSum += residual * residual;
			if (absolute > maximumAbsolute.value) {
				maximumAbsolute = {value: absolute, signedValue: residual, location: `${key}/lambda${channelIndex}`};
			}
		}
	}
	return {
		valueCount,
		signedMean: sum / valueCount,
		absoluteRms: Math.sqrt(squaredSum / valueCount),
		maximumAbsolute,
		byCondition: Object.fromEntries(
			Object.entries(byCondition).map(([time, values]) => [
				time,
				{absoluteRms: Math.sqrt(values.squaredSum / values.valueCount)},
			]),
		),
	};
}

/** Call this function to isolate J1 reconstruction and J2-J4 incremental residuals. */
function run() {
	if (existsSync(OUTPUT_ROOT)) throw new Error(`Order-residual output already exists: ${OUTPUT_ROOT}`);
	mkdirSync(OUTPUT_ROOT, {recursive: true});
	const current = new Map();
	const authority = new Map();
	const corrected = new Map();
	for (const order of ORDERS) {
		current.set(order, readBoundary(join(CURRENT_ROOT, `algorithm32-current-production-gpu-j${order}.tsv`)));
		authority.set(order, readBoundary(join(AUTHORITY_ROOT, `algorithm32-paper-j${order}-direct-40.tsv`)));
		corrected.set(
			order,
			readBoundary(join(J1_ROOT, `algorithm32-current-gpu-j${order}-exact-j1-counterfactual.tsv`)),
		);
	}
	const cachedJ1 = readBoundary(join(J1_ROOT, 'algorithm32-j1-cached-binary64.tsv'));
	const exactJ1 = readBoundary(join(J1_ROOT, 'algorithm32-j1-exact-binary64.tsv'));
	const report = {
		schema: 'algorithm32-b1-order-increment-residual-analysis-v1',
		status: 'COMPLETE',
		conditions: ['10:15', '11:15', '13:15'],
		j1W27MinusExact: measureResidual(subtract(cachedJ1, exactJ1)),
		remainingJ2AfterExactJ1: measureResidual(subtract(corrected.get(2), authority.get(2))),
		j3Increment: measureResidual(
			subtract(subtract(current.get(3), current.get(2)), subtract(authority.get(3), authority.get(2))),
		),
		j4Increment: measureResidual(
			subtract(subtract(current.get(4), current.get(3)), subtract(authority.get(4), authority.get(3))),
		),
		interpretation:
			'J3 and J4 increments cancel all lower orders. The J2 residual assumes the retained continuous direct evaluator is the J1 authority; it is diagnostic until independently pinned.',
	};
	writeFileSync(join(OUTPUT_ROOT, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, {
		encoding: 'utf8',
		flag: 'wx',
	});
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

run();
