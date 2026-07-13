import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

import {loadKiderDataset} from './benchmark.js';
import {ProductionGpuHost} from './ProductionGpuHost.js';

const DEFAULT_OUTPUT_ROOT = resolve('tmp/algorithm32-bruneton-paper/exact-j1-diagnostic/006-j2-angular-resolution-gpu');
const CONDITIONS = Object.freeze(['10:15', '11:15', '13:15']);

/**
 * Called by the diagnostic entrypoint to resolve an optional numbered output root.
 *
 * @param {readonly string[]} argv - Command-line arguments after the script path.
 * @returns {string} - Absolute output root.
 */
function parseOutputRoot(argv) {
	if (argv.length === 0) return DEFAULT_OUTPUT_ROOT;
	if (argv.length !== 2 || argv[0] !== '--output-root' || argv[1].length === 0) {
		throw new Error('Usage: diagnose-j2-angular-interpolation.js [--output-root path]');
	}
	return resolve(argv[1]);
}

/**
 * Call this function to run the bounded GPU J2 angular-resolution diagnostic.
 *
 * @param {readonly string[]} argv - Command-line arguments after the script path.
 * @returns {Promise<void>} - Completion after immutable diagnostic output is written.
 */
async function run(argv) {
	const outputRoot = parseOutputRoot(argv);
	if (existsSync(outputRoot)) throw new Error(`J2 angular diagnostic output already exists: ${outputRoot}`);
	mkdirSync(outputRoot, {recursive: true});
	const progressLogPath = join(outputRoot, 'progress.log');
	const host = new ProductionGpuHost({progressLogPath});
	const dataset = loadKiderDataset();
	const report = {
		schema: 'algorithm32-b1-j2-angular-interpolation-diagnostic-v2',
		status: 'COMPLETE',
		backend: 'gpu-production-cache-shaders-r32f',
		conditions: {},
	};
	try {
		await host.open();
		for (const time of CONDITIONS) {
			const condition = dataset.conditions.find((candidate) => candidate.time === time);
			if (!condition) throw new Error(`Kider dataset is missing ${time}.`);
			report.conditions[time] = await host.generateJ2AngularCondition({
				time,
				fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
			});
			writeFileSync(
				join(outputRoot, `condition-${time.replace(':', '')}.json`),
				`${JSON.stringify(report.conditions[time], null, 2)}\n`,
				{
					encoding: 'utf8',
					flag: 'wx',
				},
			);
		}
	} finally {
		await host.close();
	}
	writeFileSync(join(outputRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, {
		encoding: 'utf8',
		flag: 'wx',
	});
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

await run(process.argv.slice(2));
