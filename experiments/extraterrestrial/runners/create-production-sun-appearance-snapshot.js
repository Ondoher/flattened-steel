#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {constants} from 'node:fs';
import {copyFile, lstat, mkdir, readdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';

import {
	assertCreatablePathContained,
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual, createSelectedFileInventory, sha256} from '../harness/lib/hashes.js';
import {extractStaticModuleReferences} from '../harness/lib/module-closure.js';
import {
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	assertLexicallyContained,
	assertRepositoryIdentity,
	isPathContained,
	pathComparisonKey,
} from '../harness/lib/roots.js';

const execFileAsync = promisify(execFile);
const SNAPSHOT_RELATIVE_PATH = 'production-snapshots/sun-appearance-step-5-v1';
const SNAPSHOT_ROOT = path.join(EXPERIMENT_ROOT, ...SNAPSHOT_RELATIVE_PATH.split('/'));
const SNAPSHOT_MANIFEST_PATH = path.join(SNAPSHOT_ROOT, 'manifest.json');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const FLAT32_ENTRIES = Object.freeze([
	'src/flat32/FlatLocalMode.js',
	'src/flat32/SphericalDistantMode.js',
	'src/flat32/consts.js',
]);
const MANIFEST_SCHEMA_ID = 'production-sun-appearance-snapshot-v1';

function compareStrings(left, right) {
	return left < right ? -1 : left > right ? 1 : 0;
}

function portable(value) {
	return value.split(path.sep).join('/');
}

function isExcluded(relativePath) {
	const normalized = portable(relativePath);
	const segments = normalized.split('/');
	const baseName = segments.at(-1);
	return (
		segments.includes('_tests') ||
		segments.includes('tests') ||
		/\.(?:spec|test|browser)\.[cm]?[jt]sx?$/iu.test(baseName) ||
		/\.star-parity\.[cm]?[jt]sx?$/iu.test(baseName)
	);
}

async function assertPlainPath(absolutePath, label, expectedKind = null) {
	const stats = await lstat(absolutePath);
	if (stats.isSymbolicLink()) {
		throw new Error(`${label} is a symbolic link or junction: ${absolutePath}`);
	}
	if (
		(expectedKind === 'file' && !stats.isFile()) ||
		(expectedKind === 'directory' && !stats.isDirectory()) ||
		(!expectedKind && !stats.isFile() && !stats.isDirectory())
	) {
		throw new Error(`${label} has the wrong filesystem type: ${absolutePath}`);
	}
	const canonical = await realpath(absolutePath);
	if (pathComparisonKey(canonical) !== pathComparisonKey(absolutePath)) {
		throw new Error(`${label} resolves through a reparse point: ` + `${absolutePath} -> ${canonical}`);
	}
	return stats;
}

async function collectTreeFiles(root, repositoryRelativeRoot) {
	await assertPlainPath(root, 'Production source root', 'directory');
	const files = [];
	async function visit(directory, relativeDirectory) {
		const entries = await readdir(directory, {withFileTypes: true});
		entries.sort((left, right) => compareStrings(left.name, right.name));
		for (const entry of entries) {
			const absolutePath = path.join(directory, entry.name);
			const relativePath = portable(path.join(relativeDirectory, entry.name));
			await assertPlainPath(absolutePath, `Production entry ${relativePath}`);
			if (entry.isDirectory()) {
				if (!isExcluded(relativePath)) {
					await visit(absolutePath, path.join(relativeDirectory, entry.name));
				}
				continue;
			}
			if (!entry.isFile()) {
				throw new Error(`Production entry is not a regular file: ${absolutePath}`);
			}
			if (!isExcluded(relativePath)) {
				files.push(`${repositoryRelativeRoot}/${relativePath}`);
			}
		}
	}
	await visit(root, '');
	return files;
}

async function collectFlatRuntimeClosure() {
	const pending = FLAT32_ENTRIES.map((entry) => path.join(REPOSITORY_ROOT, ...entry.split('/')));
	const visited = new Set();
	const files = [];
	while (pending.length > 0) {
		const absolutePath = path.resolve(pending.pop());
		const comparisonKey = pathComparisonKey(absolutePath);
		if (visited.has(comparisonKey)) {
			continue;
		}
		visited.add(comparisonKey);
		if (!isPathContained(ALGORITHM32_ROOT, absolutePath) && !isPathContained(FLAT32_ROOT, absolutePath)) {
			throw new Error(`Flat runtime import escapes production roots: ${absolutePath}`);
		}
		const repositoryRelativePath = portable(path.relative(REPOSITORY_ROOT, absolutePath));
		if (isExcluded(repositoryRelativePath)) {
			throw new Error(`Flat runtime closure reached excluded verification code: ` + repositoryRelativePath);
		}
		await assertPlainPath(absolutePath, `Flat runtime module ${repositoryRelativePath}`, 'file');
		files.push(repositoryRelativePath);
		if (!/\.[cm]?js$/iu.test(absolutePath)) {
			continue;
		}
		const source = await readFile(absolutePath, 'utf8');
		for (const reference of extractStaticModuleReferences(source, repositoryRelativePath)) {
			if (!reference.specifier.startsWith('.')) {
				continue;
			}
			const target = path.resolve(path.dirname(absolutePath), reference.specifier);
			if (!isPathContained(ALGORITHM32_ROOT, target) && !isPathContained(FLAT32_ROOT, target)) {
				throw new Error(
					`Relative import ${reference.specifier} from ` +
						`${repositoryRelativePath} escapes the sealed production roots.`,
				);
			}
			pending.push(target);
		}
	}
	return files;
}

async function readGitRecord() {
	const options = {
		cwd: REPOSITORY_ROOT,
		encoding: null,
		maxBuffer: 64 * 1024 * 1024,
		windowsHide: true,
	};
	const [headResult, branchResult, statusResult] = await Promise.all([
		execFileAsync('git', ['rev-parse', 'HEAD'], options),
		execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], options),
		execFileAsync('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all'], options),
	]);
	const head = Buffer.from(headResult.stdout).toString('utf8').trim();
	const branch = Buffer.from(branchResult.stdout).toString('utf8').trim();
	const statusBytes = Buffer.from(statusResult.stdout);
	if (!/^[a-f0-9]{40,64}$/u.test(head)) {
		throw new Error(`Git returned an invalid HEAD revision: ${head}`);
	}
	return Object.freeze({
		head,
		branch,
		statusFormat: 'git-status-porcelain-v1-z',
		statusByteLength: statusBytes.byteLength,
		statusSha256: sha256(statusBytes),
	});
}

async function destinationDoesNotExist() {
	try {
		await lstat(SNAPSHOT_ROOT);
	} catch (error) {
		if (error?.code === 'ENOENT') {
			return;
		}
		throw error;
	}
	throw new Error(`Create-once production snapshot already exists: ${SNAPSHOT_ROOT}`);
}

async function copySelectedFiles(relativePaths) {
	for (const repositoryRelativePath of relativePaths) {
		const sourcePath = assertLexicallyContained(
			REPOSITORY_ROOT,
			path.join(REPOSITORY_ROOT, ...repositoryRelativePath.split('/')),
			'Snapshot copy source',
		);
		await assertExistingRealPathContained(REPOSITORY_ROOT, sourcePath, `Snapshot source ${repositoryRelativePath}`);
		const destinationPath = assertLexicallyContained(
			SNAPSHOT_ROOT,
			path.join(SNAPSHOT_ROOT, ...repositoryRelativePath.split('/')),
			'Snapshot copy destination',
		);
		await mkdir(path.dirname(destinationPath), {recursive: true});
		await assertExistingRealPathContained(
			SNAPSHOT_ROOT,
			path.dirname(destinationPath),
			`Snapshot destination parent ${repositoryRelativePath}`,
		);
		await copyFile(sourcePath, destinationPath, constants.COPYFILE_EXCL);
	}
}

async function createSnapshot() {
	await assertRepositoryIdentity();
	await assertExistingRealPathContained(REPOSITORY_ROOT, ALGORITHM32_ROOT, 'Algorithm32 source root');
	await assertExistingRealPathContained(REPOSITORY_ROOT, FLAT32_ROOT, 'Flat32 source root');
	await destinationDoesNotExist();
	await assertCreatablePathContained(EXPERIMENT_ROOT, SNAPSHOT_ROOT, 'Production snapshot');

	const [algorithmFiles, flatClosureFiles, git] = await Promise.all([
		collectTreeFiles(ALGORITHM32_ROOT, 'src/algorithm32'),
		collectFlatRuntimeClosure(),
		readGitRecord(),
	]);
	const relativePaths = [...new Set([...algorithmFiles, ...flatClosureFiles])].sort(compareStrings);
	if (relativePaths.length === 0) {
		throw new Error('Production snapshot selection is empty.');
	}
	const sourceInventory = await createSelectedFileInventory(REPOSITORY_ROOT, relativePaths);

	const snapshotsParent = path.dirname(SNAPSHOT_ROOT);
	await mkdir(snapshotsParent, {recursive: true});
	await assertExistingRealPathContained(EXPERIMENT_ROOT, snapshotsParent, 'Production snapshots parent');
	await mkdir(SNAPSHOT_ROOT, {recursive: false});
	await assertExistingRealPathContained(EXPERIMENT_ROOT, SNAPSHOT_ROOT, 'Production snapshot root');
	await copySelectedFiles(relativePaths);
	await assertNoReparseEntries(SNAPSHOT_ROOT, 'Production appearance snapshot');

	const copiedInventory = await createSelectedFileInventory(SNAPSHOT_ROOT, relativePaths);
	assertFileInventoriesEqual(
		sourceInventory,
		copiedInventory,
		'Production appearance snapshot copied-byte inventory',
	);
	const manifest = {
		schemaId: MANIFEST_SCHEMA_ID,
		createdAt: new Date().toISOString(),
		creationPolicy: 'create-once; immutable after manifest seal',
		snapshotRoot: `experiments/extraterrestrial/${SNAPSHOT_RELATIVE_PATH}`,
		manifestPath: `experiments/extraterrestrial/${SNAPSHOT_RELATIVE_PATH}/manifest.json`,
		source: {
			git,
			selection: {
				algorithm32: 'complete tree excluding tests/spec/browser files',
				flat32Entries: [...FLAT32_ENTRIES],
				flat32Policy: 'static runtime closure of named mode entries',
				excluded: ['tests/', '_tests/', '*.spec.*', '*.test.*', '*.browser.*'],
			},
			inventory: sourceInventory,
		},
		sealedInventory: copiedInventory,
	};
	await writeFile(SNAPSHOT_MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, {encoding: 'utf8', flag: 'wx'});
	await assertNoReparseEntries(SNAPSHOT_ROOT, 'Sealed production snapshot');
	return manifest;
}

async function main() {
	if (process.argv.length !== 2) {
		throw new Error('create-production-sun-appearance-snapshot accepts no arguments.');
	}
	const manifest = await createSnapshot();
	process.stdout.write(
		`${JSON.stringify(
			{
				status: 'created',
				schemaId: manifest.schemaId,
				snapshotRoot: manifest.snapshotRoot,
				head: manifest.source.git.head,
				dirtyStatusSha256: manifest.source.git.statusSha256,
				fileCount: manifest.sealedInventory.fileCount,
				totalBytes: manifest.sealedInventory.totalBytes,
				aggregateSha256: manifest.sealedInventory.aggregateSha256,
			},
			null,
			2,
		)}\n`,
	);
}

main().catch((error) => {
	process.stderr.write(`Production Sun appearance snapshot creation failed: ` + `${error.stack ?? error}\n`);
	process.exitCode = 1;
});
