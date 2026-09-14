import path from 'node:path';
import GenerationFiles from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationFiles.js';
import {StrobingRun} from './StrobingRun.js';

/** Compiler file capabilities restricted to one new experiment run.
 * @implements {SharedGenerationFiles}
 */
export class StrobingCompilerFiles extends GenerationFiles {
	/** @param {StrobingRun} run Newly allocated exclusive output owner. */
	constructor(run) {
		super(StrobingRun.repositoryRoot);
		/** Exact write boundary, relative to the repository. */
		this._runRoot = path.relative(StrobingRun.repositoryRoot, run.directory).replaceAll('\\', '/');
	}

	/** @param {string} relativePath Candidate output path. @returns {void} */
	_requireOutput(relativePath) {
		if (relativePath !== this._runRoot && !relativePath.startsWith(`${this._runRoot}/`))
			throw new Error('Compiler write escaped the new experiment run.');
	}

	/** @param {string} relativePath New directory. @returns {Promise<string>} */
	async directory(relativePath) {
		this._requireOutput(relativePath);
		return super.directory(relativePath);
	}

	/** @param {string} relativePath New exclusive file. @returns {Promise<SharedGenerationFileHandle>} */
	async create(relativePath) {
		this._requireOutput(relativePath);
		return super.create(relativePath);
	}

	/** Serve the experiment compiler at the reused host's module route.
	 * @param {string} relativePath Requested input.
	 * @param {DistantSunSharedCacheFileIdentity | null} [expected] Optional required original identity.
	 * @param {number} [maximumBytes] Bounded read size.
	 * @returns {Promise<Buffer>}
	 */
	async read(relativePath, expected = null, maximumBytes = 16 * 1024 * 1024) {
		if (relativePath === 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js') {
			if (expected) throw new Error('The derivative compiler cannot claim the original source identity.');
			return super.read(
				'experiments/distant-sun-recording-strobing/compiler/DistantSunSceneCacheGpuCompiler.js',
				null,
				maximumBytes,
			);
		}
		return super.read(relativePath, expected, maximumBytes);
	}
}
