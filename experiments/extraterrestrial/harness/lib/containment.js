import { execFile } from 'node:child_process';
import {
	lstat,
	readFile,
	readdir,
	realpath,
} from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import {
	CONTAINMENT_POLICY_PATH,
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	assertLexicallyContained,
	assertRepositoryIdentity,
	isPathContained,
	pathComparisonKey,
} from './roots.js';
import {
	assertFileInventoriesEqual,
	createSelectedFileInventory,
} from './hashes.js';

const execFileAsync = promisify(execFile);

function compareStrings(left, right) {
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}

function normalizeGitPath(value) {
	const normalized = path.posix.normalize(value.replaceAll('\\', '/'));
	return normalized.startsWith('./') ? normalized.slice(2) : normalized;
}

function gitPathComparisonKey(value) {
	const normalized = normalizeGitPath(value);
	return process.platform === 'win32'
		? normalized.toLocaleLowerCase('en-US')
		: normalized;
}

function gitPathMatchesPrefix(value, prefix) {
	const valueKey = gitPathComparisonKey(value);
	const prefixKey = gitPathComparisonKey(prefix).replace(/\/+$/, '');
	return valueKey === prefixKey || valueKey.startsWith(`${prefixKey}/`);
}

async function runGit(arguments_, options = {}) {
	try {
		const { stdout } = await execFileAsync(
			'git',
			['-C', REPOSITORY_ROOT, ...arguments_],
			{
				encoding: 'utf8',
				maxBuffer: 64 * 1024 * 1024,
				windowsHide: true,
			},
		);
		return stdout;
	} catch (error) {
		if (options.allowFailure) {
			return null;
		}
		throw new Error(
			`Git command failed (${arguments_.join(' ')}): `
			+ `${error.stderr || error.message}`,
		);
	}
}

/**
 * Read the tracked containment contract which owns mutable documentation.
 *
 * @returns {Promise<object>} The validated policy.
 */
export async function loadContainmentPolicy() {
	const policy = JSON.parse(await readFile(CONTAINMENT_POLICY_PATH, 'utf8'));
	if (
		policy?.schemaVersion !== 1
		|| policy.trackedSourceRoot !== 'experiments/extraterrestrial'
		|| policy.generatedOutputRoot !== 'tmp/extraterrestrial'
		|| !Array.isArray(policy.writePolicy?.canonicalDocumentation)
	) {
		throw new Error('Containment policy identity or schema is invalid.');
	}
	return policy;
}

/**
 * Require that an existing path resolves below root without traversing a
 * symlink, junction, mount, or other redirecting reparse entry.
 *
 * @param {string} root - Supplies the owning existing root.
 * @param {string} candidate - Supplies the existing path.
 * @param {string} [label='path'] - Supplies the diagnostic label.
 * @returns {Promise<string>} The candidate real path.
 */
export async function assertExistingRealPathContained(
	root,
	candidate,
	label = 'path',
) {
	const absoluteRoot = path.resolve(root);
	const absoluteCandidate = assertLexicallyContained(root, candidate, label);
	const [rootStats, candidateStats] = await Promise.all([
		lstat(absoluteRoot),
		lstat(absoluteCandidate),
	]);
	if (rootStats.isSymbolicLink() || candidateStats.isSymbolicLink()) {
		throw new Error(`${label} is or traverses a symbolic link or junction.`);
	}
	const [rootRealPath, candidateRealPath] = await Promise.all([
		realpath(absoluteRoot),
		realpath(absoluteCandidate),
	]);
	if (
		pathComparisonKey(rootRealPath) !== pathComparisonKey(absoluteRoot)
		|| pathComparisonKey(candidateRealPath)
			!== pathComparisonKey(absoluteCandidate)
		|| !isPathContained(rootRealPath, candidateRealPath)
	) {
		throw new Error(
			`${label} does not remain inside its canonical real root: `
			+ `${absoluteCandidate} -> ${candidateRealPath}`,
		);
	}
	return candidateRealPath;
}

/**
 * Validate the existing ancestor chain for a destination that may not exist.
 *
 * @param {string} root - Supplies the existing owning root.
 * @param {string} candidate - Supplies the prospective destination.
 * @param {string} [label='destination'] - Supplies the diagnostic label.
 * @returns {Promise<string>} The lexically resolved destination.
 */
export async function assertCreatablePathContained(
	root,
	candidate,
	label = 'destination',
) {
	const absoluteRoot = path.resolve(root);
	const absoluteCandidate = assertLexicallyContained(root, candidate, label);
	await assertExistingRealPathContained(
		absoluteRoot,
		absoluteRoot,
		`${label} root`,
	);
	const relative = path.relative(absoluteRoot, absoluteCandidate);
	let current = absoluteRoot;
	for (const segment of relative.split(path.sep).filter(Boolean)) {
		current = path.join(current, segment);
		try {
			await assertExistingRealPathContained(
				absoluteRoot,
				current,
				`${label} ancestor`,
			);
		} catch (error) {
			if (error?.code === 'ENOENT' || error?.cause?.code === 'ENOENT') {
				break;
			}
			throw error;
		}
	}
	return absoluteCandidate;
}

/**
 * Recursively reject links, junctions, and non-plain filesystem entries.
 *
 * @param {string} root - Supplies the existing tree.
 * @param {string} [label='tree'] - Supplies the diagnostic label.
 * @returns {Promise<void>}
 */
export async function assertNoReparseEntries(root, label = 'tree') {
	const absoluteRoot = path.resolve(root);
	await assertExistingRealPathContained(
		absoluteRoot,
		absoluteRoot,
		`${label} root`,
	);
	async function visit(directory) {
		const entries = await readdir(directory, { withFileTypes: true });
		entries.sort((left, right) => compareStrings(left.name, right.name));
		for (const entry of entries) {
			const entryPath = path.join(directory, entry.name);
			const stats = await lstat(entryPath);
			if (stats.isSymbolicLink()) {
				throw new Error(
					`${label} contains a symbolic link or junction: ${entryPath}`,
				);
			}
			const entryRealPath = await realpath(entryPath);
			if (
				pathComparisonKey(entryRealPath)
				!== pathComparisonKey(entryPath)
			) {
				throw new Error(
					`${label} contains a redirecting reparse entry: `
					+ `${entryPath} -> ${entryRealPath}`,
				);
			}
			if (stats.isDirectory()) {
				await visit(entryPath);
			} else if (!stats.isFile()) {
				throw new Error(
					`${label} contains a non-regular filesystem entry: ${entryPath}`,
				);
			}
		}
	}
	await visit(absoluteRoot);
}

function parsePorcelainZ(output) {
	const tokens = output.split('\0');
	const records = [];
	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index];
		if (!token) {
			continue;
		}
		if (token.length < 4 || token[2] !== ' ') {
			throw new Error(`Cannot parse Git status token: ${token}`);
		}
		const status = token.slice(0, 2);
		const paths = [normalizeGitPath(token.slice(3))];
		if (
			status[0] === 'R'
			|| status[0] === 'C'
			|| status[1] === 'R'
			|| status[1] === 'C'
		) {
			const sourcePath = tokens[index + 1];
			if (!sourcePath) {
				throw new Error(`Git rename/copy status lacks a source: ${token}`);
			}
			paths.push(normalizeGitPath(sourcePath));
			index += 1;
		}
		records.push({ status, paths });
	}
	return records;
}

/**
 * Return all tracked paths without consulting the process working directory.
 *
 * @returns {Promise<string[]>} Slash-normalized repository-relative paths.
 */
export async function listTrackedFiles() {
	const output = await runGit(['ls-files', '-z']);
	return output
		.split('\0')
		.filter(Boolean)
		.map(normalizeGitPath)
		.sort(compareStrings);
}

/**
 * Return all tracked and untracked working-tree changes.
 *
 * @returns {Promise<Array<{status: string, paths: string[]}>>} Status records.
 */
export async function readWorkingTreeStatus() {
	const output = await runGit([
		'status',
		'--porcelain=v1',
		'-z',
		'--untracked-files=all',
	]);
	return parsePorcelainZ(output);
}

function mutablePathClassifier(policy) {
	const experimentPrefix = normalizeGitPath(policy.trackedSourceRoot);
	const canonicalDocuments = new Set(
		policy.writePolicy.canonicalDocumentation.map(gitPathComparisonKey),
	);
	return (relativePath) => (
		gitPathMatchesPrefix(relativePath, experimentPrefix)
		|| canonicalDocuments.has(gitPathComparisonKey(relativePath))
	);
}

/**
 * Fail on any tracked or untracked worktree mutation outside the experiment
 * and the canonical current-state documents named by policy.
 *
 * @param {object} [policy] - Supplies an already loaded policy.
 * @returns {Promise<Array<{status: string, paths: string[]}>>} Allowed changes.
 */
export async function assertDenyByDefaultWorkingTree(policy = null) {
	const acceptedPolicy = policy ?? await loadContainmentPolicy();
	const isMutable = mutablePathClassifier(acceptedPolicy);
	const status = await readWorkingTreeStatus();
	const prohibited = status.filter((record) => (
		record.paths.some((relativePath) => !isMutable(relativePath))
	));
	if (prohibited.length > 0) {
		const details = prohibited
			.flatMap((record) => record.paths.map(
				(relativePath) => `${record.status}:${relativePath}`,
			))
			.slice(0, 40);
		throw new Error(
			`Protected worktree paths are dirty: ${details.join(', ')}`
			+ (prohibited.length > 40 ? ' (additional changes omitted)' : ''),
		);
	}
	return status;
}

/**
 * Capture a scoped Git cleanliness fact without relying on status prose.
 *
 * @param {string[]} repositoryRelativePaths - Supplies files or roots.
 * @returns {Promise<{clean: true, paths: string[]}>} The clean scope record.
 */
export async function assertGitScopeClean(repositoryRelativePaths) {
	const acceptedPaths = repositoryRelativePaths.map(normalizeGitPath);
	const status = await readWorkingTreeStatus();
	const matching = status.filter((record) => record.paths.some(
		(changedPath) => acceptedPaths.some(
			(scopePath) => gitPathMatchesPrefix(changedPath, scopePath),
		),
	));
	if (matching.length > 0) {
		throw new Error(
			`Required Git scope is dirty: ${matching.flatMap(
				(record) => record.paths,
			).join(', ')}`,
		);
	}
	return Object.freeze({
		clean: true,
		paths: [...acceptedPaths].sort(compareStrings),
	});
}

/**
 * Capture source revision and tree identity for the sealed snapshot.
 *
 * @returns {Promise<object>} The Git identity.
 */
export async function readSourceGitIdentity() {
	const [revision, branch, sourceTree] = await Promise.all([
		runGit(['rev-parse', 'HEAD']),
		runGit(['rev-parse', '--abbrev-ref', 'HEAD']),
		runGit(['rev-parse', 'HEAD:src/algorithm32']),
	]);
	return Object.freeze({
		revision: revision.trim(),
		branch: branch.trim(),
		sourceTree: sourceTree.trim(),
	});
}

/**
 * Build the complete fingerprint inventory for every tracked path which is
 * not an allowed experiment/control write or canonical document.
 *
 * @param {object} [policy] - Supplies an already loaded policy.
 * @returns {Promise<object>} The sorted protected inventory.
 */
export async function createProtectedTrackedInventory(policy = null) {
	await assertRepositoryIdentity();
	const acceptedPolicy = policy ?? await loadContainmentPolicy();
	const isMutable = mutablePathClassifier(acceptedPolicy);
	const trackedFiles = await listTrackedFiles();
	const protectedPaths = trackedFiles.filter((relativePath) => (
		!isMutable(relativePath)
	));
	const generatedPrefix = normalizeGitPath(
		acceptedPolicy.generatedOutputRoot,
	);
	const trackedGenerated = trackedFiles.filter((relativePath) => (
		gitPathMatchesPrefix(relativePath, generatedPrefix)
	));
	if (trackedGenerated.length > 0) {
		throw new Error(
			`Generated output paths are tracked: ${trackedGenerated.join(', ')}`,
		);
	}
	return createSelectedFileInventory(REPOSITORY_ROOT, protectedPaths);
}

/**
 * Verify both the protected tracked inventory and deny-by-default status.
 *
 * @param {object} expectedInventory - Supplies the sealed fingerprints.
 * @param {object} [policy] - Supplies an already loaded policy.
 * @returns {Promise<object>} The observed matching inventory.
 */
export async function verifyProtectedTrackedInventory(
	expectedInventory,
	policy = null,
) {
	const acceptedPolicy = policy ?? await loadContainmentPolicy();
	await assertDenyByDefaultWorkingTree(acceptedPolicy);
	const observed = await createProtectedTrackedInventory(acceptedPolicy);
	assertFileInventoriesEqual(
		expectedInventory,
		observed,
		'Protected tracked-file inventory',
	);
	return observed;
}

/**
 * Run all non-mutating containment preconditions shared by G0 controls.
 *
 * @returns {Promise<object>} The accepted policy.
 */
export async function assertContainmentPreconditions() {
	await assertRepositoryIdentity();
	const policy = await loadContainmentPolicy();
	await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source/control tree');
	await assertDenyByDefaultWorkingTree(policy);
	return policy;
}
