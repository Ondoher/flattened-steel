import {lstat, mkdir, readFile, readdir, rename, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {EXPERIMENT_OUTPUT_ROOT, REPOSITORY_ROOT} from '../consts.js';
import CacheOptimizationContainedFiles from './CacheOptimizationContainedFiles.js';

const {requireContainedRealFile, requireContainedRealPath, requireRealDirectory} = CacheOptimizationContainedFiles;
const ARTIFACT_MANIFEST_NAME = 'artifact-manifest.json';
const RUN_COUNTER_NAME = '.last-run-number';
const RUN_LOCK_NAME = '.run-allocation-lock';
const RUN_ID_PATTERN = /^(\d{6})-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/**
 * Publish the monotonic run counter through an atomic temporary-file replacement.
 *
 * @param {string} counterPath - Absolute counter artifact path.
 * @param {string} temporaryCounterPath - Absolute temporary artifact path.
 * @param {number} next - Monotonic run number being published.
 * @returns {Promise<void>} - Completion after atomic publication.
 */
async function publishCounter(counterPath, temporaryCounterPath, next) {
	try {
		await writeFile(temporaryCounterPath, `${String(next).padStart(6, '0')}\n`, {flag: 'wx'});
		await rename(temporaryCounterPath, counterPath);
	} finally {
		await rm(temporaryCounterPath, {force: true});
	}
}

/** Repository identity, monotonic allocation, and pre-ownership rollback for contained experiment runs. */
export default class ExperimentRunAllocation {
	/** @type {CacheOptimizationRunCounterPublisher} */ _counterPublisher;

	/**
	 * Creates an allocation owner with its counter-publication resource collaborator.
	 *
	 * @param {CacheOptimizationRunCounterPublisher} [counterPublisher] - Transactional counter publisher.
	 */
	constructor(counterPublisher = publishCounter) {
		this._counterPublisher = counterPublisher;
	}

	/**
	 * Call this method to require the checked-in repository identity.
	 * Rejects missing, reparse, or mismatched repository boundaries; callers must not allocate.
	 *
	 * @returns {Promise<void>} - Completion after repository validation.
	 */
	async requireRepositoryIdentity() {
		await requireRealDirectory(REPOSITORY_ROOT, 'Repository root');
		await requireContainedRealPath(REPOSITORY_ROOT, '.git', 'Repository marker');
		await requireContainedRealFile(REPOSITORY_ROOT, 'AGENTS.md', 'Repository instructions');
	}

	/**
	 * Call this method to roll back a directory before its run owner is returned.
	 * Rejects escaped, reparse, sealed, or cleanup-failed paths; callers must preserve the original allocation failure too.
	 *
	 * @param {string} runDirectory - Absolute allocated run directory.
	 * @returns {Promise<void>} - Completion after safe rollback.
	 */
	async rollbackInitialization(runDirectory) {
		const runsRoot = await requireRealDirectory(path.join(EXPERIMENT_OUTPUT_ROOT, 'runs'), 'Experiment runs root');
		const resolved = path.resolve(runDirectory);
		if (path.dirname(resolved) !== runsRoot || !RUN_ID_PATTERN.test(path.basename(resolved))) {
			throw new Error('Failed initialization cleanup escaped the runs root.');
		}
		try {
			await lstat(path.join(resolved, ARTIFACT_MANIFEST_NAME));
			throw new Error('Failed initialization unexpectedly published a terminal manifest.');
		} catch (error) {
			if (error.code !== 'ENOENT') throw error;
		}
		const realRunDirectory = await requireRealDirectory(resolved, 'Failed initialization run');
		if (path.dirname(realRunDirectory) !== runsRoot || path.basename(realRunDirectory) !== path.basename(resolved)) {
			throw new Error('Failed initialization run is not an exact real direct child of the runs root.');
		}
		await rm(realRunDirectory, {recursive: true});
	}

	/**
	 * Call this method to allocate one monotonic run identity under an exclusive lock.
	 * Rejects invalid output boundaries, lock contention, counter publication, or directory creation; it rolls back any directory it allocated before rejecting.
	 *
	 * @param {string} slug - Descriptive run slug.
	 * @returns {Promise<CacheOptimizationExperimentRunIdentity>} - Allocated identity and directory.
	 */
	async allocate(slug) {
		await requireRealDirectory(EXPERIMENT_OUTPUT_ROOT, 'Experiment output root');
		const runsRoot = path.join(EXPERIMENT_OUTPUT_ROOT, 'runs');
		try {
			await mkdir(runsRoot);
		} catch (error) {
			if (error.code !== 'EEXIST') throw error;
		}
		await requireRealDirectory(runsRoot, 'Experiment runs root');
		const lockPath = path.join(runsRoot, RUN_LOCK_NAME);
		try {
			await mkdir(lockPath);
		} catch (error) {
			if (error.code === 'EEXIST') throw new Error('Experiment run allocation is already locked.');
			throw error;
		}
		/** @type {string | undefined} */
		let runDirectory;
		try {
			const names = await readdir(runsRoot);
			let greatest = 0;
			for (const name of names) {
				const match = RUN_ID_PATTERN.exec(name);
				if (match) greatest = Math.max(greatest, Number(match[1]));
			}
			const counterPath = path.join(runsRoot, RUN_COUNTER_NAME);
			try {
				greatest = Math.max(greatest, Number((await readFile(counterPath, 'utf8')).trim()));
			} catch (error) {
				if (error.code !== 'ENOENT') throw error;
			}
			const next = greatest + 1;
			if (!Number.isSafeInteger(next) || next > 999999) throw new RangeError('Experiment run counter is exhausted.');
			const runId = `${String(next).padStart(6, '0')}-${slug}`;
			runDirectory = path.join(runsRoot, runId);
			await mkdir(runDirectory);
			const identity = {runId, runDirectory};
			const temporaryCounterPath = `${counterPath}.${process.pid}.${Date.now()}.tmp`;
			await this._counterPublisher(counterPath, temporaryCounterPath, next);
			return identity;
		} catch (error) {
			if (runDirectory) await this.rollbackInitialization(runDirectory);
			throw error;
		} finally {
			await rm(lockPath, {recursive: true});
		}
	}
}
