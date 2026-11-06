import {existsSync, readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {checked, repository} from './io.mjs';

export const runsRoot = 'tmp/experiments/flat-dome-cache-shape/runs';

/**
 * Reads a repository-owned immutable JSON input after resolving its ancestors.
 *
 * @param {string} filename - Repository-relative artifact.
 * @returns {any} - Recorded JSON; callers select the documented run schema.
 */
export function readEvidence(filename) {
	return JSON.parse(readFileSync(checked(path.join(repository, filename)), 'utf8'));
}

/**
 * Finds finalized accepted runs with an exact operation suffix.
 *
 * @param {string} suffix - Selected experiment operation.
 * @returns {string[]} - Ordered repository-relative run paths.
 */
export function acceptedRuns(suffix) {
	return readdirSync(checked(path.join(repository, runsRoot)))
		.filter((name) => name.slice(6) === suffix)
		.map((name) => `${runsRoot}/${name}`)
		.filter(
			(root) =>
				existsSync(path.join(repository, root, 'manifest.json')) &&
				readEvidence(`${root}/manifest.json`).state === 'accepted',
		)
		.sort();
}

/**
 * Indexes discovery builds, excluding repeated-timing or separate refinement series.
 *
 * @returns {{parents: string[], builds: Map<string, string>, counts: number[]}} - Earliest finalized primary build per count/source.
 */
export function discovery() {
	const parents = acceptedRuns('m3-cache-sweep').filter(
		(root) => readEvidence(`${root}/registration.json`).repeats === 1,
	);
	const builds = new Map();
	const counts = new Set();
	for (const root of parents) {
		for (const count of readEvidence(`${root}/registration.json`).counts) {
			counts.add(count);
			for (const source of [375, 500, 625]) {
				const key = `n${count}-s${source}`;
				if (!builds.has(key)) {
					builds.set(key, `${root}/candidate-${key}-r0.json`);
				}
			}
		}
	}
	return {parents, builds, counts: [...counts].sort((a, b) => a - b)};
}
