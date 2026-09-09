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

/** Repository-relative E1 candidate-contract path. */
export const E1_CANDIDATE_CONTRACT_PATH =
	'experiments/distant-sun-cache-optimization/controls/e1-candidate-contract.json';

/** Repository-relative accepted C0 inventory evidence. */
export const C0_ACCEPTED_INVENTORY_PATH =
	'tmp/experiments/distant-sun-cache-optimization/runs/000022-c0-production-control/evidence/inventory-pins.json';

/** Repository-relative accepted C0 terminal manifest. */
export const C0_ACCEPTED_MANIFEST_PATH =
	'tmp/experiments/distant-sun-cache-optimization/runs/000022-c0-production-control/artifact-manifest.json';

/** Repository-relative deployed package-report path. */
export const CONTROL_PACKAGE_REPORT_PATH =
	'server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1/package-report.json';

/** Repository-relative deployed runtime-catalog path authenticated by C0. */
export const CONTROL_CATALOG_PATH =
	'server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1/distant-sun-runtime-catalog-2dbf92ad616c5461954fc15f8eb1654c49f4b1e3ddbd948aa7bda7a40c76d7ac.json';

/** Supported E1 production direction-table codec identity. */
export const E1_DIRECTION_LAYOUT_ID = 'algorithm32-distant-sun-w27-exact-seam-u16-v1';

/** Supported E1 unique direction count. */
export const E1_UNIQUE_DIRECTION_COUNT = 4_058;

/** Supported E1 logical direction-index count. */
export const E1_LOGICAL_DIRECTION_COUNT = 4_374;

/** Supported E1 spectral channel count. */
export const E1_CHANNEL_COUNT = 15;

/** Bytes occupied by one channel of one coordinate row. */
export const E1_DIRECTION_ROW_BYTE_LENGTH = E1_UNIQUE_DIRECTION_COUNT * Float32Array.BYTES_PER_ELEMENT;

/** Repository-relative production design path. */
export const PRODUCTION_DESIGN_PATH =
	'agents/topics/production-algorithm32/caches/distant-sun-cache-optimization-design.md';

/** Repository-relative production implementation-plan path. */
export const PRODUCTION_PLAN_PATH =
	'agents/topics/production-algorithm32/caches/distant-sun-cache-optimization-plan.md';
