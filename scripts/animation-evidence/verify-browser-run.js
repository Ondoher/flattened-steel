#!/usr/bin/env node

import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {ArtifactManifest} from './node.js';

const SOURCE_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SOURCE_DIRECTORY, '..', '..');
const OUTPUT_ROOT = path.join(REPOSITORY_ROOT, 'tmp', 'animation-evidence');
const DEFAULT_RUN_ID = '1788929186108-browser-compatibility';

/**
 * Call this function to test whether a resolved path remains within a root.
 * @param {string} root Resolved root path.
 * @param {string} target Resolved target path.
 * @returns {boolean} Whether the target is contained.
 */
function isWithin(root, target) {
	const relative = path.relative(root, target);
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Call this function to verify one completed browser-compatibility qualification run.
 * @returns {Promise<void>} Verification completion promise.
 */
async function main() {
	const runId = process.argv[2] ?? DEFAULT_RUN_ID;
	if (!/^[0-9]+-browser-compatibility$/u.test(runId)) throw new Error('Invalid browser qualification run id.');
	const outputRoot = await realpath(OUTPUT_ROOT);
	const runDirectory = path.join(outputRoot, runId);
	const resolvedRunDirectory = await realpath(runDirectory);
	const information = await lstat(runDirectory);
	if (
		!information.isDirectory() ||
		information.isSymbolicLink() ||
		resolvedRunDirectory.toLowerCase() !== runDirectory.toLowerCase() ||
		!isWithin(outputRoot, resolvedRunDirectory)
	) {
		throw new Error('Browser qualification run crossed its output boundary.');
	}
	const result = JSON.parse(await readFile(path.join(runDirectory, 'result.json'), 'utf8'));
	const manifest = JSON.parse(await readFile(path.join(runDirectory, 'artifact-manifest.json'), 'utf8'));
	if (
		result.schemaId !== 'animation-evidence-browser-compatibility-v1' ||
		result.toolVersion !== '1.0.0' ||
		result.runId !== runId ||
		result.accepted !== true ||
		result.probe?.outcomes?.some(
			(/** @type {Readonly<Record<string, unknown>>} */ outcome) => outcome.configured === true,
		) !== true
	) {
		throw new Error('Browser qualification result is not accepted or compatible.');
	}
	if (manifest.schemaId !== 'animation-evidence-artifact-manifest-v1') {
		throw new Error('Browser qualification artifact-manifest schema changed.');
	}
	await ArtifactManifest.verify(runDirectory, manifest);
	process.stdout.write(
		`${JSON.stringify(
			{
				runId,
				accepted: true,
				browserVersion: result.browserVersion,
				selectedCandidateId: result.probe.selectedCandidateId,
				artifactSetSha256: manifest.artifactSetSha256,
			},
			null,
			2,
		)}\n`,
	);
}

await main();
