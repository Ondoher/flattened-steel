#!/usr/bin/env node

import assert from 'node:assert/strict';
import {mkdir, mkdtemp, realpath, rm, rmdir, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

import {requireExperimentSlug, validateStructure} from './scaffold-experiment.mjs';

/**
 * Called by the proof runner to create the three managed experiment parent roots.
 *
 * @param {string} repoRoot - Isolated proof repository root.
 * @returns {Promise<void>}
 */
async function createManagedParents(repoRoot) {
	await Promise.all([
		mkdir(path.join(repoRoot, 'agents', 'topics', 'poc-experiments', 'engineering-studies'), {recursive: true}),
		mkdir(path.join(repoRoot, 'experiments'), {recursive: true}),
		mkdir(path.join(repoRoot, 'tmp', 'experiments'), {recursive: true}),
	]);
}

/**
 * Called by the proof runner to derive a complete scaffold path fixture.
 *
 * @param {string} repoRoot - Isolated proof repository root.
 * @param {string} experimentFolder - Unnumbered experiment folder identity used by the fixture.
 * @returns {ExperimentScaffoldPaths} - Complete fixture paths.
 */
function scaffoldPaths(repoRoot, experimentFolder) {
	const topicRoot = path.join(repoRoot, 'agents', 'topics', 'poc-experiments', 'engineering-studies', experimentFolder);
	const sourceRoot = path.join(repoRoot, 'experiments', experimentFolder);
	const outputRoot = path.join(repoRoot, 'tmp', 'experiments', experimentFolder);
	return {
		repoRoot,
		topicRoot,
		sourceRoot,
		outputRoot,
		topicReadme: path.join(topicRoot, 'README.md'),
		design: path.join(topicRoot, 'design.md'),
		plan: path.join(topicRoot, 'plan.md'),
		status: path.join(topicRoot, 'status.md'),
		sourceInstructions: path.join(sourceRoot, 'AGENTS.md'),
		typeConfiguration: path.join(sourceRoot, 'jsconfig.json'),
		typeDeclarations: path.join(sourceRoot, 'types.d.ts'),
	};
}

/**
 * Called by the proof runner to create the required scaffold files and roots.
 *
 * @param {ExperimentScaffoldPaths} paths - Fixture paths to populate.
 * @returns {Promise<void>}
 */
async function createScaffoldFixture(paths) {
	await Promise.all([
		mkdir(paths.topicRoot, {recursive: true}),
		mkdir(paths.sourceRoot, {recursive: true}),
		mkdir(paths.outputRoot, {recursive: true}),
	]);
	await Promise.all(
		[
			paths.topicReadme,
			paths.design,
			paths.plan,
			paths.status,
			paths.sourceInstructions,
			paths.typeConfiguration,
			paths.typeDeclarations,
		].map((target) =>
			writeFile(target, 'fixture\n', 'utf8'),
		),
	);
}

/**
 * Called by the executable proof entry to verify unnumbered folder identity and scaffold validation behavior.
 *
 * Assertion failures reject the returned promise and make the proof command fail. The isolated temporary root is
 * verified as a direct child of the operating-system temporary directory before recursive cleanup.
 *
 * @returns {Promise<void>}
 */
async function run() {
	const temporaryRoot = await realpath(tmpdir());
	const suiteRoot = await mkdtemp(path.join(temporaryRoot, 'start-experiment-folder-'));
	try {
		assert.equal(requireExperimentSlug('recording-strobe'), 'recording-strobe');
		assert.throws(() => requireExperimentSlug('00001-recording-strobe'), /unnumbered/u);
		assert.throws(() => requireExperimentSlug('Recording-Strobe'), /unnumbered/u);

		const validationRoot = path.join(suiteRoot, 'validation');
		await createManagedParents(validationRoot);
		const paths = scaffoldPaths(validationRoot, 'recording-strobe');
		await createScaffoldFixture(paths);
		await validateStructure(paths);
		assert.equal(path.basename(paths.topicRoot), 'recording-strobe');
		assert.equal(path.basename(paths.sourceRoot), 'recording-strobe');
		assert.equal(path.basename(paths.outputRoot), 'recording-strobe');
		await rmdir(paths.outputRoot);
		await writeFile(paths.outputRoot, '', 'utf8');
		await assert.rejects(validateStructure(paths), /must be a real directory/u);
		await rm(paths.outputRoot);
		const linkedOutputTarget = path.join(validationRoot, 'linked-output-target');
		await mkdir(linkedOutputTarget);
		await symlink(linkedOutputTarget, paths.outputRoot, 'junction');
		await assert.rejects(validateStructure(paths), /must be a real directory/u);

		process.stdout.write(`${JSON.stringify({ok: true, cases: 9})}\n`);
	} finally {
		const resolvedSuiteRoot = await realpath(suiteRoot);
		assert.equal(path.dirname(resolvedSuiteRoot).toLowerCase(), temporaryRoot.toLowerCase());
		await rm(resolvedSuiteRoot, {recursive: true, force: true});
	}
}

await run();
