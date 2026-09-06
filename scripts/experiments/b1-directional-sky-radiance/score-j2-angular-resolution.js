import {appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

import {loadKiderDataset, scoreCondition} from './benchmark.js';
import {ProductionGpuHost} from './ProductionGpuHost.js';

const TIMES = Object.freeze(['10:15', '11:15', '13:15']);
const WIDTHS = Object.freeze([27, 39, 55, 81]);
const DEFAULT_OUTPUT_ROOT = resolve('tmp/algorithm32-bruneton-paper/exact-j1-diagnostic/007-j2-angular-score-sweep');
const EXACT_J1_PATH = resolve(
	'tmp/algorithm32-bruneton-paper/exact-j1-diagnostic/002-three-time-order-sweep-observable/algorithm32-j1-exact-binary64.tsv',
);

function parseOutputRoot(argv) {
	if (argv.length === 0) return DEFAULT_OUTPUT_ROOT;
	if (argv.length !== 2 || argv[0] !== '--output-root' || !argv[1]) {
		throw new Error('Usage: score-j2-angular-resolution.js [--output-root path]');
	}
	return resolve(argv[1]);
}

function readExactJ1() {
	const rows = new Map();
	const lines = readFileSync(EXACT_J1_PATH, 'utf8').trim().split(/\r?\n/u);
	lines.shift();
	for (const line of lines) {
		const fields = line.split('\t');
		const key = `${fields[1]}/${fields[2]}/${fields[3]}`;
		rows.set(key, fields.slice(4).map(Number));
	}
	return rows;
}

function makeGrid(values) {
	const grid = Array.from({length: 9}, () => Array(9));
	let index = 0;
	for (let gridX = 0; gridX < 9; gridX += 1) {
		for (let gridY = 0; gridY < 9; gridY += 1) grid[gridX][gridY] = values[index++];
	}
	return grid;
}

function tableHeader() {
	return ['model', 'time', 'grid_x', 'grid_y', ...Array.from({length: 40}, (_, index) => `lambda_${index}`)].join(
		'\t',
	);
}

async function run(argv) {
	const outputRoot = parseOutputRoot(argv);
	if (existsSync(outputRoot)) throw new Error(`J2 angular score output already exists: ${outputRoot}`);
	mkdirSync(outputRoot, {recursive: true});
	const progressPath = join(outputRoot, 'progress.log');
	const progress = (message) => {
		const line = `${new Date().toISOString()} ${message}\n`;
		appendFileSync(progressPath, line, 'utf8');
		process.stderr.write(line);
	};
	const dataset = loadKiderDataset();
	const exactJ1 = readExactJ1();
	const host = new ProductionGpuHost({progressLogPath: join(outputRoot, 'gpu-progress.log')});
	const candidateRows = new Map(WIDTHS.map((width) => [width, []]));
	const report = {
		schema: 'algorithm32-b1-j2-angular-score-sweep-v1',
		status: 'RUNNING',
		scope: TIMES,
		composition: 'exact-binary64-j1-plus-gpu-r32f-pure-j2-with-binary64-final-view-integration',
		candidates: Object.fromEntries(WIDTHS.map((width) => [`w${width}`, {conditionScores: []}])),
	};
	try {
		await host.open();
		for (const time of TIMES) {
			const condition = dataset.conditions.find((item) => item.time === time);
			progress(`${time} angular score condition started`);
			const generated = await host.generateJ2AngularScoreCondition({
				time,
				fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
			});
			for (const width of WIDTHS) {
				const candidate = generated.candidates[`w${width}`];
				const totals = candidate.values.map((j2, index) => {
					const gridX = Math.floor(index / 9);
					const gridY = index % 9;
					const j1 = exactJ1.get(`${time}/${gridX}/${gridY}`);
					if (!j1) throw new Error(`Exact J1 table is missing ${time}/${gridX}/${gridY}.`);
					const values = j2.map((value, channelIndex) => value + j1[channelIndex]);
					candidateRows.get(width).push({time, gridX, gridY, values});
					return values;
				});
				const score = scoreCondition(makeGrid(totals), condition.grid);
				report.candidates[`w${width}`].conditionScores.push({
					time,
					rmseMilliwatt: score.rmseMilliwatt,
					paperRoundedRmseMilliwatt: score.paperRoundedRmseMilliwatt,
					worstAbsoluteResidualW: score.worstAbsoluteResidualW,
					worst: score.worst,
					touchedDirectionCount: candidate.touchedDirectionCount,
					fullGridDirectionCount: candidate.fullGridDirectionCount,
					durationMilliseconds: candidate.durationMilliseconds,
				});
				progress(`${time} W${width} RMSE ${score.rmseMilliwatt.toFixed(6)} mW`);
			}
		}
	} finally {
		await host.close();
	}
	for (const width of WIDTHS) {
		const candidate = report.candidates[`w${width}`];
		candidate.threeConditionRmseMilliwatt = Math.sqrt(
			candidate.conditionScores.reduce((sum, score) => sum + score.rmseMilliwatt ** 2, 0) /
				candidate.conditionScores.length,
		);
		const lines = [
			tableHeader(),
			...candidateRows
				.get(width)
				.map((row) =>
					[
						`j1-exact-plus-j2-w${width}`,
						row.time,
						row.gridX,
						row.gridY,
						...row.values.map((value) => value.toPrecision(17)),
					].join('\t'),
				),
		];
		writeFileSync(join(outputRoot, `algorithm32-j2-w${width}-direct-40.tsv`), `${lines.join('\n')}\n`, {
			encoding: 'utf8',
			flag: 'wx',
		});
	}
	report.status = 'COMPLETE';
	writeFileSync(join(outputRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, {
		encoding: 'utf8',
		flag: 'wx',
	});
	progress('angular score sweep complete');
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

await run(process.argv.slice(2));
