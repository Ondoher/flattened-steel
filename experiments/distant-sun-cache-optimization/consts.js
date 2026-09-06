import path from 'node:path';
import {fileURLToPath} from 'node:url';

const experimentRoot = path.dirname(fileURLToPath(import.meta.url));

/** Absolute repository root derived from the checked-in experiment source. */
export const REPOSITORY_ROOT = path.resolve(experimentRoot, '..', '..');

/** Absolute authored source root for the contained experiment. */
export const EXPERIMENT_SOURCE_ROOT = experimentRoot;

/** Absolute ignored output root for the contained experiment. */
export const EXPERIMENT_OUTPUT_ROOT = path.join(
	REPOSITORY_ROOT,
	'tmp',
	'experiments',
	'distant-sun-cache-optimization',
);

/** Absolute immutable deployed package root used as the C0 control. */
export const CONTROL_PACKAGE_ROOT = path.join(
	REPOSITORY_ROOT,
	'server',
	'flat32',
	'data',
	'one-degree-bin-covered-runtime-packages-20260830-1',
);

/** Absolute Chrome executable selected for the comparison environment. */
export const CHROME_EXECUTABLE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

/** Repository-relative C0 measurement-contract path. */
export const C0_MEASUREMENT_CONTRACT_PATH =
	'experiments/distant-sun-cache-optimization/controls/c0-measurement-contract.json';

/** Repository-relative deployed package-report path. */
export const CONTROL_PACKAGE_REPORT_PATH =
	'server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1/package-report.json';

/** Repository-relative production design path. */
export const PRODUCTION_DESIGN_PATH =
	'agents/topics/production-algorithm32/caches/distant-sun-cache-optimization-design.md';

/** Repository-relative production implementation-plan path. */
export const PRODUCTION_PLAN_PATH =
	'agents/topics/production-algorithm32/caches/distant-sun-cache-optimization-plan.md';
