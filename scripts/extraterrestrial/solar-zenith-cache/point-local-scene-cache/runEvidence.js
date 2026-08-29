import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	sha256File,
} from '../../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../../harness/lib/module-closure.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	PRODUCTION_SOURCE_ROOT,
	REPOSITORY_ROOT,
	assertRepositoryIdentity,
} from '../../harness/lib/roots.js';

export async function beginContainedEvidence(entryRelativePath) {
	await assertRepositoryIdentity();
	const laneRoot = path.join(
		EXPERIMENT_ROOT, 'solar-zenith-cache', 'point-local-scene-cache');
	await assertExistingRealPathContained(EXPERIMENT_ROOT, laneRoot, 'successor lane');
	await assertNoReparseEntries(laneRoot, 'successor lane');
	const flat32Root = path.join(REPOSITORY_ROOT, 'src', 'flat32');
	const [algorithm32Before, flat32Before] = await Promise.all([
		createFileInventory(PRODUCTION_SOURCE_ROOT), createFileInventory(flat32Root),
	]);
	const closure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [entryRelativePath],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		allowedNodeBuiltins: [
			'node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises',
			'node:http', 'node:module',
			'node:os', 'node:path', 'node:url', 'node:util',
		],
	});
	if (closure.bareResolutions.length !== 0
		|| closure.files.some((file) => file.startsWith('../') || path.isAbsolute(file))) {
		throw new Error('Static module closure escaped the contained experiment.');
	}
	return {laneRoot, flat32Root, algorithm32Before, flat32Before, closure};
}

export async function finishContainedEvidence(state, sourceRelativePaths) {
	const [algorithm32After, flat32After] = await Promise.all([
		createFileInventory(PRODUCTION_SOURCE_ROOT), createFileInventory(state.flat32Root),
	]);
	assertFileInventoriesEqual(
		state.algorithm32Before, algorithm32After, 'Algorithm32 production inventory');
	assertFileInventoriesEqual(
		state.flat32Before, flat32After, 'Flat32 production inventory');
	const sources = [];
	for (const relativePath of sourceRelativePaths) {
		const absolutePath = path.join(EXPERIMENT_ROOT, relativePath);
		await assertExistingRealPathContained(EXPERIMENT_ROOT, absolutePath, relativePath);
		sources.push({path: `scripts/extraterrestrial/${relativePath}`,
			sha256: await sha256File(absolutePath)});
	}
	return {
		schemaId: 'point-local-scene-cache-source-identities-v1',
		sources,
		staticClosure: {
			entries: state.closure.entries,
			fileCount: state.closure.files.length,
			edgeCount: state.closure.edges.length,
			nodeBuiltins: state.closure.nodeBuiltins,
			bareResolutions: state.closure.bareResolutions,
		},
		productionInventories: {
			algorithm32: algorithm32After,
			flat32: flat32After,
		},
	};
}

export async function readJson(pathname) {
	return JSON.parse(await readFile(pathname, 'utf8'));
}
