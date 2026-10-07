import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';

const CONTENT_TYPES = {'.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};

/** Read-only module and cache inputs for the production GPU proof feature. */
export class ProductionGpuAssetService {
	/** Creates a reader without opening transport resources.
	 * @param {ProductionGpuAssetConfiguration} configuration - Module-derived root and exact admitted input directories.
	 */
	constructor(configuration) {
		if (!path.isAbsolute(configuration.repositoryRoot) || !configuration.allowedDirectories.length)
			throw new TypeError('GPU proof input configuration is incomplete.');
		this._root = path.resolve(configuration.repositoryRoot);
		this._allowedDirectories = configuration.allowedDirectories.map((directory) => {
			if (
				!directory.endsWith('/') ||
				directory
					.slice(0, -1)
					.split('/')
					.some((part) => !/^@?[a-zA-Z0-9_.-]+$/u.test(part) || part === '.' || part === '..')
			)
				throw new RangeError('Invalid GPU proof input directory.');
			return directory;
		});
	}

	/** Call this method to read one ordinary repository file, rejecting aliases at every component.
	 * @param {string} relative - Decoded repository-relative file name.
	 * @returns {Promise<ProductionGpuAssetResponse>} - Complete bytes and media type.
	 */
	async read(relative) {
		if (!this._allowedDirectories.some((directory) => relative.startsWith(directory)))
			throw new RangeError('GPU proof asset is outside its admitted inputs.');
		const parts = relative.split('/');
		if (!parts.length || parts.some((part) => !/^@?[a-zA-Z0-9_.-]+$/u.test(part) || part === '.' || part === '..'))
			throw new RangeError('Invalid GPU proof asset name.');
		let absolute = this._root;
		for (const part of [null, ...parts]) {
			if (part !== null) absolute = path.join(absolute, part);
			const facts = await lstat(absolute);
			if (
				facts.isSymbolicLink() ||
				(!facts.isFile() && !facts.isDirectory()) ||
				(await realpath(absolute)).toLowerCase() !== absolute.toLowerCase()
			)
				throw new RangeError('GPU proof asset resolves through an alias.');
		}
		return {
			bytes: await readFile(absolute),
			contentType: CONTENT_TYPES[path.extname(absolute)] ?? 'application/octet-stream',
		};
	}
}
