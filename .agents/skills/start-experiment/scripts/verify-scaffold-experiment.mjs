#!/usr/bin/env node

import assert from 'node:assert/strict';
import {mkdir, mkdtemp, realpath, rm, rmdir, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

import {nextExperimentPrefix, requirePrefix, validateStructure} from './scaffold-experiment.mjs';

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
 * @param {string} experimentFolder - Experiment folder identity used by the fixture.
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
		[paths.topicReadme, paths.design, paths.plan, paths.status, paths.sourceInstructions].map((target) =>
			writeFile(target, 'fixture\n', 'utf8'),
		),
	);
}

/**
 * Called by the executable proof entry to verify prefix allocation and scaffold validation behavior.
 *
 * Assertion failures reject the returned promise and make the proof command fail. The isolated temporary root is
 * verified as a direct child of the operating-system temporary directory before recursive cleanup.
 *
 * @returns {Promise<void>}
 */
async function run() {
	const temporaryRoot = await realpath(tmpdir());
	const suiteRoot = await mkdtemp(path.join(temporaryRoot, 'start-experiment-prefix-'));
	try {
		const emptyRoot = path.join(suiteRoot, 'empty');
		await createManagedParents(emptyRoot);
		assert.equal(await nextExperimentPrefix(emptyRoot), '00000');

		const incrementRoot = path.join(suiteRoot, 'increment');
		await createManagedParents(incrementRoot);
		await mkdir(path.join(incrementRoot, 'experiments', '00000-first'));
		await mkdir(path.join(incrementRoot, 'tmp', 'experiments', '00002-partial'));
		assert.equal(await nextExperimentPrefix(incrementRoot), '00003');

		const conflictRoot = path.join(suiteRoot, 'conflict');
		await createManagedParents(conflictRoot);
		await mkdir(
			path.join(conflictRoot, 'agents', 'topics', 'poc-experiments', 'engineering-studies', '00004-alpha'),
		);
		await mkdir(path.join(conflictRoot, 'experiments', '00004-beta'));
		await assert.rejects(nextExperimentPrefix(conflictRoot), /prefix 00004 is already used/u);

		const malformedRoot = path.join(suiteRoot, 'malformed');
		await createManagedParents(malformedRoot);
		await writeFile(path.join(malformedRoot, 'tmp', 'experiments', '00005-not-a-directory'), '', 'utf8');
		await assert.rejects(nextExperimentPrefix(malformedRoot), /not a real directory/u);

		const parentLinkRoot = path.join(suiteRoot, 'parent-link');
		await createManagedParents(parentLinkRoot);
		await rmdir(path.join(parentLinkRoot, 'experiments'));
		const linkedParentTarget = path.join(parentLinkRoot, 'linked-parent-target');
		await mkdir(linkedParentTarget);
		await symlink(linkedParentTarget, path.join(parentLinkRoot, 'experiments'), 'junction');
		await assert.rejects(nextExperimentPrefix(parentLinkRoot), /parent is not a real directory/u);

		const exhaustedRoot = path.join(suiteRoot, 'exhausted');
		await createManagedParents(exhaustedRoot);
		await mkdir(path.join(exhaustedRoot, 'experiments', '99999-last'));
		await assert.rejects(nextExperimentPrefix(exhaustedRoot), /No five-digit experiment prefixes remain/u);

		assert.equal(requirePrefix('00000'), '00000');
		assert.throws(() => requirePrefix('0000'), /exactly five decimal digits/u);
		assert.throws(() => requirePrefix('abcde'), /exactly five decimal digits/u);

		const validationRoot = path.join(suiteRoot, 'validation');
		await createManagedParents(validationRoot);
		const paths = scaffoldPaths(validationRoot, '00000-validation');
		await createScaffoldFixture(paths);
		await validateStructure(paths);
		await rmdir(paths.outputRoot);
		await writeFile(paths.outputRoot, '', 'utf8');
		await assert.rejects(validateStructure(paths), /must be a real directory/u);
		await rm(paths.outputRoot);
		const linkedOutputTarget = path.join(validationRoot, 'linked-output-target');
		await mkdir(linkedOutputTarget);
		await symlink(linkedOutputTarget, paths.outputRoot, 'junction');
		await assert.rejects(validateStructure(paths), /must be a real directory/u);

		process.stdout.write(`${JSON.stringify({ok: true, cases: 12})}\n`);
	} finally {
		const resolvedSuiteRoot = await realpath(suiteRoot);
		assert.equal(path.dirname(resolvedSuiteRoot).toLowerCase(), temporaryRoot.toLowerCase());
		await rm(resolvedSuiteRoot, {recursive: true, force: true});
	}
}

await run();
