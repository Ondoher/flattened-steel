import { lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIBRARY_ROOT = path.dirname(fileURLToPath(import.meta.url));

export const EXPERIMENT_ROOT = path.resolve(LIBRARY_ROOT, '..', '..');
export const REPOSITORY_ROOT = path.resolve(EXPERIMENT_ROOT, '..', '..');
export const PRODUCTION_SOURCE_ROOT = path.join(
	REPOSITORY_ROOT,
	'src',
	'algorithm32',
);
export const BASELINE_ROOT = path.join(EXPERIMENT_ROOT, 'baseline');
export const BASELINE_SOURCE_ROOT = path.join(
	BASELINE_ROOT,
	'src',
	'algorithm32',
);
export const CANDIDATE_ROOT = path.join(EXPERIMENT_ROOT, 'candidate');
export const CANDIDATE_SOURCE_ROOT = path.join(
	CANDIDATE_ROOT,
	'src',
	'algorithm32',
);
export const BASELINE_MANIFEST_PATH = path.join(
	EXPERIMENT_ROOT,
	'baseline-manifest.json',
);
export const CONTAINMENT_POLICY_PATH = path.join(
	EXPERIMENT_ROOT,
	'containment-policy.json',
);
export const EXPERIMENT_PACKAGE_PATH = path.join(
	EXPERIMENT_ROOT,
	'package.json',
);
export const EXPERIMENT_LOCK_PATH = path.join(
	EXPERIMENT_ROOT,
	'package-lock.json',
);
export const EXPERIMENT_NODE_MODULES_ROOT = path.join(
	EXPERIMENT_ROOT,
	'node_modules',
);
export const OUTPUT_ROOT = path.join(
	REPOSITORY_ROOT,
	'tmp',
	'extraterrestrial',
);
export const RUNS_ROOT = path.join(OUTPUT_ROOT, 'runs');
export const REPOSITORY_PACKAGE_PATH = path.join(
	REPOSITORY_ROOT,
	'package.json',
);
export const REPOSITORY_LOCK_PATH = path.join(
	REPOSITORY_ROOT,
	'package-lock.json',
);

function removeTrailingSeparators(value) {
	const parsed = path.parse(value);
	let result = value;
	while (
		result.length > parsed.root.length
		&& (result.endsWith(path.sep) || result.endsWith(path.posix.sep))
	) {
		result = result.slice(0, -1);
	}
	return result;
}

/**
 * Produce a comparison key which follows the case-insensitive filesystem
 * semantics used by normal Windows worktrees.
 *
 * @param {string} value - Supplies an absolute or relative filesystem path.
 * @returns {string} The normalized comparison key.
 */
export function pathComparisonKey(value) {
	const normalized = removeTrailingSeparators(path.normalize(path.resolve(value)));
	return process.platform === 'win32'
		? normalized.toLocaleLowerCase('en-US')
		: normalized;
}

/**
 * Report whether candidate is root itself or a descendant of root.
 *
 * @param {string} root - Supplies the owning root.
 * @param {string} candidate - Supplies the path to classify.
 * @returns {boolean} True when candidate is contained.
 */
export function isPathContained(root, candidate) {
	const rootKey = pathComparisonKey(root);
	const candidateKey = pathComparisonKey(candidate);
	return candidateKey === rootKey
		|| candidateKey.startsWith(`${rootKey}${path.sep}`);
}

/**
 * Require lexical containment before any filesystem lookup occurs.
 *
 * @param {string} root - Supplies the owning root.
 * @param {string} candidate - Supplies the path to validate.
 * @param {string} [label='path'] - Supplies the diagnostic label.
 * @returns {string} The resolved candidate path.
 */
export function assertLexicallyContained(root, candidate, label = 'path') {
	const resolved = path.resolve(candidate);
	if (!isPathContained(root, resolved)) {
		throw new Error(
			`${label} escapes ${path.resolve(root)}: ${resolved}`,
		);
	}
	return resolved;
}

/**
 * Convert an absolute path below the repository to a slash-normalized path.
 *
 * @param {string} value - Supplies the repository path.
 * @returns {string} The repository-relative path.
 */
export function toRepositoryRelativePath(value) {
	const resolved = assertLexicallyContained(
		REPOSITORY_ROOT,
		value,
		'repository path',
	);
	const relative = path.relative(REPOSITORY_ROOT, resolved);
	return relative.split(path.sep).join('/');
}

/**
 * Validate the fixed location from which this module derived all roots.
 *
 * @returns {Promise<Readonly<Record<string, string>>>} The canonical roots.
 */
export async function assertRepositoryIdentity() {
	const expectedExperimentRelativePath = 'experiments/extraterrestrial';
	const experimentRelativePath = toRepositoryRelativePath(EXPERIMENT_ROOT);
	if (experimentRelativePath !== expectedExperimentRelativePath) {
		throw new Error(
			`Experiment root identity mismatch: expected `
			+ `${expectedExperimentRelativePath}, received ${experimentRelativePath}.`,
		);
	}

	for (const marker of [
		path.join(REPOSITORY_ROOT, '.git'),
		path.join(REPOSITORY_ROOT, 'AGENTS.md'),
		REPOSITORY_PACKAGE_PATH,
		CONTAINMENT_POLICY_PATH,
		EXPERIMENT_PACKAGE_PATH,
	]) {
		await lstat(marker);
	}

	const [
		repositoryRealPath,
		experimentRealPath,
		libraryRealPath,
	] = await Promise.all([
		realpath(REPOSITORY_ROOT),
		realpath(EXPERIMENT_ROOT),
		realpath(LIBRARY_ROOT),
	]);

	if (
		pathComparisonKey(repositoryRealPath)
		!== pathComparisonKey(REPOSITORY_ROOT)
	) {
		throw new Error(
			`Repository root resolves through a link or reparse point: `
			+ `${REPOSITORY_ROOT} -> ${repositoryRealPath}`,
		);
	}
	if (
		pathComparisonKey(experimentRealPath)
		!== pathComparisonKey(EXPERIMENT_ROOT)
	) {
		throw new Error(
			`Experiment root resolves through a link or reparse point: `
			+ `${EXPERIMENT_ROOT} -> ${experimentRealPath}`,
		);
	}
	if (
		pathComparisonKey(libraryRealPath)
		!== pathComparisonKey(LIBRARY_ROOT)
	) {
		throw new Error(
			`Harness library root resolves through a link or reparse point: `
			+ `${LIBRARY_ROOT} -> ${libraryRealPath}`,
		);
	}
	if (!isPathContained(repositoryRealPath, experimentRealPath)) {
		throw new Error('Experiment real path is outside the repository real path.');
	}

	return Object.freeze({
		repositoryRoot: repositoryRealPath,
		experimentRoot: experimentRealPath,
		productionSourceRoot: PRODUCTION_SOURCE_ROOT,
		baselineSourceRoot: BASELINE_SOURCE_ROOT,
		candidateSourceRoot: CANDIDATE_SOURCE_ROOT,
		outputRoot: OUTPUT_ROOT,
	});
}
