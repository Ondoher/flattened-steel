import {appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

import {Algorithm32} from '../../../src/algorithm32/implementation/algorithm32/Algorithm32.js';
import {SharedModel} from '../../../src/algorithm32/implementation/algorithm32/model/SharedModel.js';
import {DistantSunCpuCache} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunCpuCache.js';
import {SpectralCalculator} from '../../../src/algorithm32/atmospheric-transport/spectral/SpectralCalculator.js';
import {loadKiderDataset} from './benchmark.js';
import {createBrunetonProductionProfile, createViewDirection} from './production-profile.js';

const DEFAULT_CURRENT_ROOT = resolve(
	'tmp/algorithm32-bruneton-paper/compile-diagnostics/005-saved-b1-order-comparison/b1-directional-sky-radiance/gpu',
);
const DEFAULT_AUTHORITY_ROOT = resolve('references/results/B1-3 Saved Results/b1-directional-sky-radiance');
const DEFAULT_OUTPUT_ROOT = resolve(
	'tmp/algorithm32-bruneton-paper/exact-j1-diagnostic/002-three-time-order-sweep-observable',
);
const ORDERS = Object.freeze([2, 3, 4]);
const CHANNEL_COUNT = 40;
const RELATIVE_FLOOR = 1e-8;

/**
 * Called by the diagnostic entrypoint to accept optional input and output roots.
 *
 * @param {readonly string[]} argv - Command-line arguments after the executable and script path.
 * @returns {{currentRoot: string, authorityRoot: string, outputRoot: string}} - Resolved diagnostic paths.
 */
function parseArguments(argv) {
	const options = {
		currentRoot: DEFAULT_CURRENT_ROOT,
		authorityRoot: DEFAULT_AUTHORITY_ROOT,
		outputRoot: DEFAULT_OUTPUT_ROOT,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === '--current-root') options.currentRoot = resolve(argv[++index] ?? '');
		else if (argument === '--authority-root') options.authorityRoot = resolve(argv[++index] ?? '');
		else if (argument === '--output-root') options.outputRoot = resolve(argv[++index] ?? '');
		else throw new Error(`Unsupported argument: ${argument}.`);
	}
	return options;
}

/**
 * Called by the diagnostic to parse one direct-40 boundary table.
 *
 * @param {string} path - Boundary table path.
 * @returns {{header: string, rows: Map<string, {model: string, time: string, gridX: number, gridY: number, values: number[]}>}} - Parsed rows by condition and grid location.
 */
function readBoundary(path) {
	const lines = readFileSync(path, 'utf8').trim().split(/\r?\n/u);
	const header = lines.shift();
	if (!header) throw new Error(`Boundary table is empty: ${path}`);
	const columns = header.split('\t');
	if (columns.length !== 4 + CHANNEL_COUNT) {
		throw new Error(`Boundary table does not contain ${CHANNEL_COUNT} spectral channels: ${path}`);
	}
	const rows = new Map();
	for (const line of lines) {
		const fields = line.split('\t');
		const row = {
			model: fields[0],
			time: fields[1],
			gridX: Number(fields[2]),
			gridY: Number(fields[3]),
			values: fields.slice(4).map(Number),
		};
		const key = `${row.time}/${row.gridX}/${row.gridY}`;
		if (rows.has(key) || row.values.some((value) => !Number.isFinite(value))) {
			throw new Error(`Boundary table contains an invalid or duplicate row ${key}: ${path}`);
		}
		rows.set(key, row);
	}
	return {header, rows};
}

/**
 * Called by the diagnostic to preserve direct-40 table spelling.
 *
 * @param {string} header - Source table header.
 * @param {readonly {model: string, time: string, gridX: number, gridY: number, values: readonly number[]}[]} rows - Ordered table rows.
 * @returns {string} - Complete tab-separated table.
 */
function formatBoundary(header, rows) {
	return `${[
		header,
		...rows.map((row) =>
			[row.model, row.time, row.gridX, row.gridY, ...row.values.map((value) => value.toPrecision(17))].join('\t'),
		),
	].join('\n')}\n`;
}

/**
 * Called by the diagnostic to compare one current boundary with its retained authority.
 *
 * @param {ReadonlyMap<string, {values: readonly number[]}>} candidateRows - Candidate rows by location.
 * @param {ReadonlyMap<string, {values: readonly number[]}>} authorityRows - Authority rows by location.
 * @returns {object} - Value-level residual measurements.
 */
function compareBoundaries(candidateRows, authorityRows) {
	let squaredAbsoluteSum = 0;
	let squaredRelativeSum = 0;
	let relativeCount = 0;
	let valueCount = 0;
	let maximumAbsolute = {value: -1, location: null};
	let maximumRelative = {value: -1, location: null};
	for (const [key, candidate] of candidateRows) {
		const authority = authorityRows.get(key);
		if (!authority) throw new Error(`Authority is missing diagnostic row ${key}.`);
		for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
			const residual = candidate.values[channelIndex] - authority.values[channelIndex];
			const absolute = Math.abs(residual);
			const location = `${key}/lambda${channelIndex}`;
			squaredAbsoluteSum += residual * residual;
			valueCount += 1;
			if (absolute > maximumAbsolute.value) maximumAbsolute = {value: absolute, location};
			if (Math.abs(authority.values[channelIndex]) >= RELATIVE_FLOOR) {
				const relative = absolute / Math.abs(authority.values[channelIndex]);
				squaredRelativeSum += relative * relative;
				relativeCount += 1;
				if (relative > maximumRelative.value) maximumRelative = {value: relative, location};
			}
		}
	}
	return {
		valueCount,
		absoluteRms: Math.sqrt(squaredAbsoluteSum / valueCount),
		maximumAbsolute,
		relativeFloor: RELATIVE_FLOOR,
		relativeValueCount: relativeCount,
		relativeRms: Math.sqrt(squaredRelativeSum / relativeCount),
		maximumRelative,
	};
}

/**
 * Called by the diagnostic to construct cached and continuous direct-primary radiance for one condition.
 *
 * @param {{time: string, fittedAzimuthDegrees: number}} condition - Benchmark condition facts.
 * @returns {Map<string, {cached: readonly number[], exact: readonly number[], correction: readonly number[]}>} - J1 components by view-grid location.
 */
function computeJ1Components(condition, reportProgress) {
	const profile = createBrunetonProductionProfile({
		time: condition.time,
		fittedAzimuthDegrees: condition.fittedAzimuthDegrees,
		maximumScatteringOrder: 1,
	});
	const algorithm = new Algorithm32({profile});
	const model = new SharedModel({version: 1, profile});
	const calculator = new SpectralCalculator({model});
	const buildResult = profile.models.lightSource.buildCpuScatteringCache({
		model,
		onProgress(progress) {
			if (progress.completed === 1 || progress.completed === progress.total || progress.completed % 4 === 0) {
				reportProgress(
					`${condition.time} ${progress.phase} J${progress.order} ${progress.completed}/${progress.total}`,
				);
			}
		},
	});
	const cache = new DistantSunCpuCache(buildResult);
	const components = new Map();
	try {
		for (let gridX = 0; gridX < 9; gridX += 1) {
			for (let gridY = 0; gridY < 9; gridY += 1) {
				const direction = createViewDirection(gridX, gridY);
				const cached = algorithm.evaluate({
					viewRay: {direction},
					scatteringCache: cache,
				}).pathRadiance.values;
				const viewRaySegment = model.geometry.resolveViewRaySegment({direction});
				const path = calculator.buildEndpointTrapezoidPathIntegrationPoints(
					viewRaySegment,
					profile.numerical.viewPath.intervalCount,
				);
				const exact = calculator.computeDirectRadiance(viewRaySegment, path).pathRadiance.values;
				components.set(`${condition.time}/${gridX}/${gridY}`, {
					cached: [...cached],
					exact: [...exact],
					correction: exact.map((value, channelIndex) => value - cached[channelIndex]),
				});
			}
			reportProgress(`${condition.time} final J1 rays ${(gridX + 1) * 9}/81`);
		}
		return components;
	} finally {
		cache.dispose();
		algorithm.dispose();
	}
}

/**
 * Call this function to replace only W27-reconstructed J1 in a saved current GPU order sweep and measure J2-J4 independently.
 *
 * @param {readonly string[]} argv - Command-line arguments after the executable and script path.
 * @returns {void} - Writes immutable diagnostic tables and a residual report.
 */
function run(argv) {
	const options = parseArguments(argv);
	if (existsSync(options.outputRoot)) {
		throw new Error(`J1 diagnostic output already exists: ${options.outputRoot}`);
	}
	mkdirSync(options.outputRoot, {recursive: true});
	const progressPath = join(options.outputRoot, 'progress.log');
	const reportProgress = (message) => {
		const line = `${new Date().toISOString()} ${message}\n`;
		appendFileSync(progressPath, line, 'utf8');
		process.stderr.write(line);
	};
	reportProgress('diagnostic initialized');

	const currentByOrder = new Map();
	const authorityByOrder = new Map();
	for (const order of ORDERS) {
		currentByOrder.set(
			order,
			readBoundary(join(options.currentRoot, `algorithm32-current-production-gpu-j${order}.tsv`)),
		);
		authorityByOrder.set(
			order,
			readBoundary(join(options.authorityRoot, `algorithm32-paper-j${order}-direct-40.tsv`)),
		);
	}

	const currentJ2 = currentByOrder.get(2);
	const times = [...new Set([...currentJ2.rows.values()].map((row) => row.time))];
	const dataset = loadKiderDataset();
	const allComponents = new Map();
	for (const time of times) {
		const datasetCondition = dataset.conditions.find((condition) => condition.time === time);
		if (!datasetCondition) throw new Error(`Kider dataset is missing condition ${time}.`);
		reportProgress(`${time} constructing J1-only CPU cache`);
		const components = computeJ1Components(
			{
				time,
				fittedAzimuthDegrees: datasetCondition.sun.fittedAzimuthDegrees,
			},
			reportProgress,
		);
		for (const [key, value] of components) allComponents.set(key, value);
		reportProgress(`${time} exact and W27 J1 complete`);
	}

	const componentHeader = [
		'model',
		'time',
		'grid_x',
		'grid_y',
		...Array.from({length: CHANNEL_COUNT}, (_, index) => `lambda_${index}`),
	].join('\t');
	for (const componentName of ['cached', 'exact', 'correction']) {
		const rows = [...currentJ2.rows.values()].map((row) => ({
			...row,
			model: `j1-${componentName}`,
			values: allComponents.get(`${row.time}/${row.gridX}/${row.gridY}`)[componentName],
		}));
		writeFileSync(
			join(options.outputRoot, `algorithm32-j1-${componentName}-binary64.tsv`),
			formatBoundary(componentHeader, rows),
			{encoding: 'utf8', flag: 'wx'},
		);
	}

	const report = {
		schema: 'algorithm32-b1-j1-representation-diagnostic-v1',
		status: 'COMPLETE',
		inputs: {
			currentRoot: options.currentRoot,
			authorityRoot: options.authorityRoot,
			conditions: times,
			orders: ORDERS,
			profile: 'Bruneton direct-40, 40/20/34/48, W27',
		},
		method: 'corrected cumulative = saved current GPU cumulative - binary64 W27-reconstructed J1 + binary64 exact-direction J1',
		orders: {},
	};
	for (const order of ORDERS) {
		const current = currentByOrder.get(order);
		const authority = authorityByOrder.get(order);
		const correctedRows = new Map();
		for (const [key, row] of current.rows) {
			const correction = allComponents.get(key)?.correction;
			if (!correction) throw new Error(`J1 correction is missing row ${key}.`);
			correctedRows.set(key, {
				...row,
				values: row.values.map((value, channelIndex) => value + correction[channelIndex]),
			});
		}
		writeFileSync(
			join(options.outputRoot, `algorithm32-current-gpu-j${order}-exact-j1-counterfactual.tsv`),
			formatBoundary(current.header, [...correctedRows.values()]),
			{encoding: 'utf8', flag: 'wx'},
		);
		report.orders[`j${order}`] = {
			currentVersusRetained: compareBoundaries(current.rows, authority.rows),
			exactJ1CounterfactualVersusRetained: compareBoundaries(correctedRows, authority.rows),
		};
	}
	writeFileSync(join(options.outputRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, {
		encoding: 'utf8',
		flag: 'wx',
	});
	reportProgress('diagnostic complete');
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

run(process.argv.slice(2));
