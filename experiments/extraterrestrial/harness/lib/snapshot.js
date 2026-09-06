import {
	constants as fsConstants,
} from 'node:fs';
import {
	chmod,
	copyFile,
	lstat,
	mkdir,
	readFile,
	realpath,
	writeFile,
} from 'node:fs/promises';
import path from 'node:path';

import {
	BASELINE_MANIFEST_PATH,
	BASELINE_ROOT,
	BASELINE_SOURCE_ROOT,
	CANDIDATE_ROOT,
	CANDIDATE_SOURCE_ROOT,
	CONTAINMENT_POLICY_PATH,
	EXPERIMENT_LOCK_PATH,
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	PRODUCTION_SOURCE_ROOT,
	REPOSITORY_LOCK_PATH,
	REPOSITORY_PACKAGE_PATH,
	REPOSITORY_ROOT,
	assertLexicallyContained,
	pathComparisonKey,
	toRepositoryRelativePath,
} from './roots.js';
import {
	assertContainmentPreconditions,
	assertCreatablePathContained,
	assertExistingRealPathContained,
	assertGitScopeClean,
	assertNoReparseEntries,
	createProtectedTrackedInventory,
	readSourceGitIdentity,
	verifyProtectedTrackedInventory,
} from './containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	sha256File,
} from './hashes.js';
import {
	buildStaticModuleClosure,
	isExcludedCandidateRunnablePath,
	listExcludedCopiedFiles,
} from './module-closure.js';

export const G0_SNAPSHOT_MANIFEST_SCHEMA_ID =
	'algorithm32-extraterrestrial-g0-snapshot-v1';

function compareStrings(left, right) {
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}

async function pathExists(value) {
	try {
		await lstat(value);
		return true;
	} catch (error) {
		if (error?.code === 'ENOENT') {
			return false;
		}
		throw error;
	}
}

async function refuseExistingSnapshotTargets() {
	const conflicts = [];
	for (const target of [
		BASELINE_ROOT,
		CANDIDATE_ROOT,
		BASELINE_MANIFEST_PATH,
	]) {
		if (await pathExists(target)) {
			conflicts.push(toRepositoryRelativePath(target));
		}
	}
	if (conflicts.length > 0) {
		throw new Error(
			`Create-once G0 snapshot target already exists: `
			+ `${conflicts.join(', ')}`,
		);
	}
}

async function readJson(filePath, label) {
	let result;
	try {
		result = JSON.parse(await readFile(filePath, 'utf8'));
	} catch (error) {
		throw new Error(`${label} is not valid JSON: ${error.message}`);
	}
	if (result === null || typeof result !== 'object' || Array.isArray(result)) {
		throw new Error(`${label} must contain a JSON object.`);
	}
	return result;
}

async function fingerprintFile(filePath) {
	const stats = await lstat(filePath);
	if (stats.isSymbolicLink() || !stats.isFile()) {
		throw new Error(`Fingerprint input is not a plain file: ${filePath}`);
	}
	const realPath = await realpath(filePath);
	if (pathComparisonKey(realPath) !== pathComparisonKey(filePath)) {
		throw new Error(
			`Fingerprint input is a link, junction, or reparse path: ${filePath}`,
		);
	}
	return Object.freeze({
		path: toRepositoryRelativePath(filePath),
		bytes: stats.size,
		sha256: await sha256File(filePath),
	});
}

function acceptExactDependencyMap(value, label) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${label} must be an object.`);
	}
	const entries = Object.entries(value).sort(([left], [right]) => (
		compareStrings(left, right)
	));
	for (const [name, version] of entries) {
		if (
			typeof name !== 'string'
			|| !name
			|| typeof version !== 'string'
			|| !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)
		) {
			throw new Error(
				`${label} must pin exact semantic versions; received `
				+ `${name}@${version}.`,
			);
		}
	}
	return Object.fromEntries(entries);
}

export async function captureDependencyState(policy) {
	const [
		experimentPackage,
		experimentLock,
	] = await Promise.all([
		readJson(EXPERIMENT_PACKAGE_PATH, 'Experiment package'),
		readJson(EXPERIMENT_LOCK_PATH, 'Experiment package lock'),
	]);
	const dependencies = acceptExactDependencyMap(
		experimentPackage.dependencies ?? {},
		'Experiment dependencies',
	);
	const devDependencies = experimentPackage.devDependencies ?? {};
	if (Object.keys(devDependencies).length > 0) {
		throw new Error(
			'The G0 package may not declare experimental development/test '
			+ 'dependencies.',
		);
	}
	const allowedDependencies = [
		...(policy.runtimePolicy?.allowedBareDependencies ?? []),
	].sort(compareStrings);
	if (
		JSON.stringify(Object.keys(dependencies))
		!== JSON.stringify(allowedDependencies)
	) {
		throw new Error(
			`Experiment dependencies do not exactly match containment policy: `
			+ `${Object.keys(dependencies).join(', ')}`,
		);
	}
	if (experimentLock.lockfileVersion !== 3) {
		throw new Error('Experiment package lock must use lockfileVersion 3.');
	}
	const lockRoot = experimentLock.packages?.[''];
	if (!lockRoot || typeof lockRoot !== 'object') {
		throw new Error('Experiment package lock lacks its root package entry.');
	}
	const lockedRootDependencies = acceptExactDependencyMap(
		lockRoot.dependencies ?? {},
		'Locked root dependencies',
	);
	if (
		JSON.stringify(lockedRootDependencies)
		!== JSON.stringify(dependencies)
	) {
		throw new Error(
			'Experiment package and package-lock direct dependencies differ.',
		);
	}

	await assertExistingRealPathContained(
		EXPERIMENT_ROOT,
		EXPERIMENT_NODE_MODULES_ROOT,
		'Experiment dependency root',
	);
	await assertNoReparseEntries(
		EXPERIMENT_NODE_MODULES_ROOT,
		'Experiment dependency tree',
	);

	const resolvedDependencies = [];
	for (const [name, expectedVersion] of Object.entries(dependencies)) {
		const lockKey = `node_modules/${name}`;
		const lockEntry = experimentLock.packages?.[lockKey];
		if (!lockEntry || lockEntry.version !== expectedVersion) {
			throw new Error(
				`Locked dependency ${name} does not resolve to `
				+ `${expectedVersion}.`,
			);
		}
		const packageRoot = path.join(
			EXPERIMENT_NODE_MODULES_ROOT,
			...name.split('/'),
		);
		await assertExistingRealPathContained(
			EXPERIMENT_NODE_MODULES_ROOT,
			packageRoot,
			`Installed dependency ${name}`,
		);
		const installedPackagePath = path.join(packageRoot, 'package.json');
		const installedPackage = await readJson(
			installedPackagePath,
			`Installed dependency ${name}`,
		);
		if (installedPackage.version !== expectedVersion) {
			throw new Error(
				`Installed dependency ${name} is ${installedPackage.version}; `
				+ `expected ${expectedVersion}.`,
			);
		}
		const packageStats = await lstat(installedPackagePath);
		resolvedDependencies.push({
			name,
			version: expectedVersion,
			lockIntegrity: lockEntry.integrity ?? null,
			packageJson: {
				path: toRepositoryRelativePath(installedPackagePath),
				bytes: packageStats.size,
				sha256: await sha256File(installedPackagePath),
			},
		});
	}

	return Object.freeze({
		packageManager: 'npm',
		lockfileVersion: experimentLock.lockfileVersion,
		nodeVersion: process.version,
		directDependencies: resolvedDependencies,
		controlFiles: await Promise.all([
			fingerprintFile(REPOSITORY_PACKAGE_PATH),
			fingerprintFile(REPOSITORY_LOCK_PATH),
			fingerprintFile(EXPERIMENT_PACKAGE_PATH),
			fingerprintFile(EXPERIMENT_LOCK_PATH),
			fingerprintFile(CONTAINMENT_POLICY_PATH),
		]),
	});
}

async function copyInventoryTree(sourceRoot, destinationRoot, inventory) {
	await mkdir(destinationRoot, { recursive: true });
	for (const entry of inventory.files) {
		const platformRelativePath = entry.path.split('/').join(path.sep);
		const sourcePath = assertLexicallyContained(
			sourceRoot,
			path.join(sourceRoot, platformRelativePath),
			`Snapshot source ${entry.path}`,
		);
		const destinationPath = assertLexicallyContained(
			destinationRoot,
			path.join(destinationRoot, platformRelativePath),
			`Snapshot destination ${entry.path}`,
		);
		await mkdir(path.dirname(destinationPath), { recursive: true });
		await copyFile(sourcePath, destinationPath, fsConstants.COPYFILE_EXCL);
		const sourceStats = await lstat(sourcePath);
		await chmod(destinationPath, sourceStats.mode & 0o777);
	}
}

function runnableEntryFiles(inventory) {
	return inventory.files
		.map((entry) => entry.path)
		.filter((relativePath) => (
			/\.(?:[cm]?js|jsx)$/i.test(relativePath)
			&& !isExcludedCandidateRunnablePath(relativePath)
		))
		.sort(compareStrings);
}

function inventorySummary(inventory, includeFiles = false) {
	const result = {
		schemaId: inventory.schemaId,
		algorithm: inventory.algorithm,
		fileCount: inventory.fileCount,
		totalBytes: inventory.totalBytes,
		aggregateSha256: inventory.aggregateSha256,
	};
	if (includeFiles) {
		result.files = inventory.files;
	}
	return result;
}

/**
 * Create the immutable production snapshot and byte-identical candidate.
 * This operation is intentionally create-once and leaves any interrupted
 * partial target in place so it cannot be mistaken for a retryable snapshot.
 *
 * @returns {Promise<object>} The sealed manifest.
 */
export async function createG0Snapshot() {
	const policy = await assertContainmentPreconditions();
	await refuseExistingSnapshotTargets();
	await Promise.all([
		assertCreatablePathContained(
			EXPERIMENT_ROOT,
			BASELINE_ROOT,
			'Baseline root',
		),
		assertCreatablePathContained(
			EXPERIMENT_ROOT,
			CANDIDATE_ROOT,
			'Candidate root',
		),
		assertCreatablePathContained(
			EXPERIMENT_ROOT,
			BASELINE_MANIFEST_PATH,
			'Baseline manifest',
		),
	]);
	await assertExistingRealPathContained(
		REPOSITORY_ROOT,
		PRODUCTION_SOURCE_ROOT,
		'Production source snapshot input',
	);
	await assertNoReparseEntries(
		PRODUCTION_SOURCE_ROOT,
		'Production source snapshot input',
	);

	const scopedCleanliness = await assertGitScopeClean([
		'src/algorithm32',
		'package.json',
		'package-lock.json',
	]);
	const [
		sourceGitIdentity,
		sourceInventory,
		dependencyState,
		protectedTrackedFiles,
	] = await Promise.all([
		readSourceGitIdentity(),
		createFileInventory(PRODUCTION_SOURCE_ROOT),
		captureDependencyState(policy),
		createProtectedTrackedInventory(policy),
	]);
	const excludedCopiedFiles = listExcludedCopiedFiles(sourceInventory);

	await mkdir(BASELINE_ROOT);
	await mkdir(CANDIDATE_ROOT);
	await Promise.all([
		copyInventoryTree(
			PRODUCTION_SOURCE_ROOT,
			BASELINE_SOURCE_ROOT,
			sourceInventory,
		),
		copyInventoryTree(
			PRODUCTION_SOURCE_ROOT,
			CANDIDATE_SOURCE_ROOT,
			sourceInventory,
		),
	]);
	await Promise.all([
		assertNoReparseEntries(BASELINE_ROOT, 'Sealed baseline'),
		assertNoReparseEntries(CANDIDATE_ROOT, 'Initial candidate'),
	]);

	const [
		baselineInventory,
		candidateInventory,
	] = await Promise.all([
		createFileInventory(BASELINE_SOURCE_ROOT),
		createFileInventory(CANDIDATE_SOURCE_ROOT),
	]);
	assertFileInventoriesEqual(
		sourceInventory,
		baselineInventory,
		'Production-to-baseline copy',
	);
	assertFileInventoriesEqual(
		sourceInventory,
		candidateInventory,
		'Production-to-candidate copy',
	);

	const moduleClosure = await buildStaticModuleClosure({
		candidateRoot: CANDIDATE_SOURCE_ROOT,
		entryFiles: runnableEntryFiles(candidateInventory),
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
	});

	await verifyProtectedTrackedInventory(protectedTrackedFiles, policy);
	await assertGitScopeClean([
		'src/algorithm32',
		'package.json',
		'package-lock.json',
	]);
	const finalSourceGitIdentity = await readSourceGitIdentity();
	if (
		JSON.stringify(finalSourceGitIdentity)
		!== JSON.stringify(sourceGitIdentity)
	) {
		throw new Error('Source Git identity changed while creating the snapshot.');
	}

	const manifest = {
		schemaId: G0_SNAPSHOT_MANIFEST_SCHEMA_ID,
		createdAt: new Date().toISOString(),
		experiment: {
			root: toRepositoryRelativePath(EXPERIMENT_ROOT),
			baselineRoot: toRepositoryRelativePath(BASELINE_ROOT),
			candidateRoot: toRepositoryRelativePath(CANDIDATE_ROOT),
			manifest: toRepositoryRelativePath(BASELINE_MANIFEST_PATH),
		},
		source: {
			root: toRepositoryRelativePath(PRODUCTION_SOURCE_ROOT),
			git: sourceGitIdentity,
			scopedCleanliness,
			inventory: inventorySummary(sourceInventory, true),
		},
		copies: {
			baseline: inventorySummary(baselineInventory),
			candidate: inventorySummary(candidateInventory),
			byteIdentical: true,
		},
		runnableBoundary: {
			excludedCopiedTestAndBrowserFiles: excludedCopiedFiles,
			excludedFileCount: excludedCopiedFiles.length,
			entryFiles: moduleClosure.entries,
			closureFiles: moduleClosure.files,
			importEdges: moduleClosure.edges,
			bareResolutions: moduleClosure.bareResolutions,
			dynamicImports: 'rejected',
			absoluteAndFileUrlImports: 'rejected',
		},
		dependencies: dependencyState,
		protectedTrackedFiles: inventorySummary(protectedTrackedFiles, true),
	};

	await writeFile(
		BASELINE_MANIFEST_PATH,
		`${JSON.stringify(manifest, null, 2)}\n`,
		{
			encoding: 'utf8',
			flag: 'wx',
		},
	);
	return Object.freeze(manifest);
}
