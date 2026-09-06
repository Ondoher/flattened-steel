import {randomUUID} from 'node:crypto';
import {rename, rm, writeFile} from 'node:fs/promises';

/** Atomic publisher of a terminal run marker through a uniquely owned temporary file. */
export default class ExperimentRunTerminalPublisher {
	/** @type {CacheOptimizationTerminalFileWriter} */ _writer;
	/** @type {CacheOptimizationTerminalFileRenamer} */ _renamer;
	/** @type {CacheOptimizationTerminalFileRemover} */ _remover;

	/**
	 * Creates a publisher with its filesystem resource collaborators.
	 *
	 * @param {CacheOptimizationTerminalFileWriter} [writer] - Exclusive temporary-file writer.
	 * @param {CacheOptimizationTerminalFileRenamer} [renamer] - Atomic rename operation.
	 * @param {CacheOptimizationTerminalFileRemover} [remover] - Owned temporary-file cleanup operation.
	 */
	constructor(writer = writeFile, renamer = rename, remover = (target) => rm(target, {force: true})) {
		this._writer = writer;
		this._renamer = renamer;
		this._remover = remover;
	}

	/**
	 * Call this method to publish a complete terminal file atomically.
	 * Rejects write or rename failures after removing only its unique pending path; callers must retain the unsealed run.
	 *
	 * @param {string} target - Validated absolute terminal path.
	 * @param {string} value - Complete terminal bytes.
	 * @returns {Promise<void>} - Completion after atomic publication.
	 */
	async publish(target, value) {
		const pending = `${target}.${process.pid}.${randomUUID()}.tmp`;
		try {
			await this._writer(pending, value, {flag: 'wx'});
			await this._renamer(pending, target);
		} catch (publicationError) {
			try {
				await this._remover(pending);
			} catch (cleanupError) {
				throw new AggregateError(
					[publicationError, cleanupError],
					'Terminal publication and owned temporary-file cleanup failed.',
				);
			}
			throw publicationError;
		}
	}
}
