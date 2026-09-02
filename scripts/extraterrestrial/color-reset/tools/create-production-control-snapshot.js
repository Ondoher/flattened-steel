#!/usr/bin/env node

import {constants as fileConstants} from 'node:fs';
import {copyFile, lstat, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

import {assertNoReparseEntries} from '../../harness/lib/containment.js';
import {assertFileInventoriesEqual, createFileInventory} from '../../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../../harness/lib/module-closure.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	REPOSITORY_ROOT,
	assertLexicallyContained,
	assertRepositoryIdentity,
} from '../../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/color-reset/tools/create-production-control-snapshot.js';
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const SOURCE_ROOT = path.join(REPOSITORY_ROOT, 'src');
const SNAPSHOT_ROOT = path.join(COLOR_RESET_ROOT, 'controls', 'production-v1');
const SNAPSHOT_SOURCE_ROOT = path.join(SNAPSHOT_ROOT, 'src');
const ENTRY_FILES = Object.freeze([
	'algorithm32/implementation/react-three/Algorithm32Bindings.js',
	'algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js',
	'flat32/DistantSunSceneCacheResolver.js',
	'flat32/DistantSunSceneState.js',
	'flat32/SphericalDistantMode.js',
]);

async function requireAbsent(target, label) {
	try {
		await lstat(target);
		throw new Error(`${label} already exists.`);
	} catch (error) {
		if (error?.code !== 'ENOENT') throw error;
	}
}

function portableParts(relativePath) {
	if (
		typeof relativePath !== 'string' ||
		relativePath.length === 0 ||
		path.posix.isAbsolute(relativePath) ||
		relativePath.split('/').some((part) => part.length === 0 || part === '.' || part === '..')
	) {
		throw new Error(`Snapshot path is not contained: ${String(relativePath)}`);
	}
	return relativePath.split('/');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The snapshot tool accepts no arguments.');
	await assertRepositoryIdentity();
	assertLexicallyContained(COLOR_RESET_ROOT, SNAPSHOT_ROOT, 'production control snapshot');
	await requireAbsent(SNAPSHOT_ROOT, 'Production control snapshot');
	await assertNoReparseEntries(SOURCE_ROOT, 'Production source');

	const closure = await buildStaticModuleClosure({
		candidateRoot: SOURCE_ROOT,
		entryFiles: [...ENTRY_FILES],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
	});
	const selectedPaths = new Set(closure.files);
	const sourceInventory = await createFileInventory(SOURCE_ROOT, {
		include: (relativePath) => selectedPaths.has(relativePath),
	});
	if (sourceInventory.fileCount !== closure.files.length) {
		throw new Error('Production closure and selected source inventory disagree.');
	}

	await mkdir(SNAPSHOT_SOURCE_ROOT, {recursive: true});
	for (const relativePath of closure.files) {
		const parts = portableParts(relativePath);
		const source = path.join(SOURCE_ROOT, ...parts);
		const destination = path.join(SNAPSHOT_SOURCE_ROOT, ...parts);
		assertLexicallyContained(SOURCE_ROOT, source, 'snapshot source');
		assertLexicallyContained(SNAPSHOT_SOURCE_ROOT, destination, 'snapshot destination');
		await mkdir(path.dirname(destination), {recursive: true});
		await copyFile(source, destination, fileConstants.COPYFILE_EXCL);
	}

	const snapshotInventory = await createFileInventory(SNAPSHOT_SOURCE_ROOT);
	assertFileInventoriesEqual(sourceInventory, snapshotInventory, 'Production control snapshot');
	const manifest = {
		schemaId: 'algorithm32-color-reset-production-control-snapshot-v1',
		createdUtc: new Date().toISOString(),
		command: COMMAND,
		purpose:
			'Byte-identical contained runtime closure for CR0 Bruneton and current production-lift controls.',
		sourceRoot: 'src',
		destinationRoot: 'scripts/extraterrestrial/color-reset/controls/production-v1/src',
		entryFiles: [...ENTRY_FILES],
		closure,
		inventory: snapshotInventory,
	};
	await writeFile(
		path.join(SNAPSHOT_ROOT, 'snapshot-manifest.json'),
		`${JSON.stringify(manifest, null, 2)}\n`,
		{encoding: 'utf8', flag: 'wx'},
	);
	process.stdout.write(
		`${JSON.stringify(
			{
				snapshotRoot: SNAPSHOT_ROOT,
				fileCount: snapshotInventory.fileCount,
				totalBytes: snapshotInventory.totalBytes,
				aggregateSha256: snapshotInventory.aggregateSha256,
			},
			null,
			2,
		)}\n`,
	);
}

await main();
