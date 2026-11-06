import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {
	existsSync,
	lstatSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	realpathSync,
	renameSync,
	writeFileSync,
	appendFileSync,
} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * Repository identity derived from this checked-in runner location.
 */
export const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Owns authored implementation for this lane.
 */
export const sourceRoot = path.join(repository, 'experiments/flat-dome-cache-shape');

/**
 * Owns generated artifacts for this lane.
 */
export const outputRoot = path.join(repository, 'tmp/experiments/flat-dome-cache-shape');

/**
 * Resolves a path and rejects linked ancestors or an escaped declared boundary.
 *
 * @param {string} filename - Existing path to validate.
 * @param {string} boundary - Declared ancestor.
 * @returns {string} - Verified absolute path.
 */
export function checked(filename, boundary = repository) {
	const absolute = path.resolve(filename);
	const relative = path.relative(path.resolve(boundary), absolute);
	assert.ok(!relative.startsWith('..') && !path.isAbsolute(relative), 'Path escapes its declared boundary.');
	let prefix = path.parse(absolute).root;
	for (const component of absolute.slice(prefix.length).split(path.sep).filter(Boolean)) {
		prefix = path.join(prefix, component);
		assert.ok(!lstatSync(prefix).isSymbolicLink(), `Linked path: ${prefix}`);
		assert.equal(realpathSync(prefix).toLowerCase(), prefix.toLowerCase(), `Redirected path: ${prefix}`);
	}
	return absolute;
}

/**
 * Identifies a read-only repository input without modifying its bytes.
 *
 * @param {string} relative - Repository-relative file.
 * @returns {DomeFileIdentity} - Byte identity.
 */
export function identity(relative) {
	const filename = checked(path.join(repository, relative));
	assert.ok(lstatSync(filename).isFile());
	const bytes = readFileSync(filename);
	return {
		path: relative.replaceAll('\\', '/'),
		bytes: bytes.length,
		sha256: createHash('sha256').update(bytes).digest('hex'),
	};
}

/**
 * Enumerates source files deterministically without following links.
 *
 * @param {string} directory - Source directory.
 * @returns {DomeFileIdentity[]} - Complete source identities.
 */
export function sourceIdentities(directory = sourceRoot) {
	const result = [];
	for (const name of readdirSync(checked(directory, sourceRoot)).sort()) {
		const filename = checked(path.join(directory, name), sourceRoot);
		if (lstatSync(filename).isDirectory()) {
			result.push(...sourceIdentities(filename));
		} else {
			result.push(identity(path.relative(repository, filename)));
		}
	}
	return result;
}

/**
 * Allocates one immutable-evidence run with append-only monitoring.
 *
 * @param {string} name - Descriptive kebab-case suffix of at most sixteen characters.
 * @param {DomeFileIdentity[]} parents - Inputs and derivation ancestors.
 * @returns {DomeRun} - Owned run writer, progress, and finalizer.
 */
export function createRun(name, parents = []) {
	assert.ok(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name) && name.length <= 16);
	assert.ok(existsSync(path.join(repository, '.git')));
	assert.match(readFileSync(checked(path.join(repository, 'AGENTS.md')), 'utf8'), /Topics folder: agents\/topics/);
	checked(sourceRoot);
	checked(outputRoot);
	const runs = path.join(outputRoot, 'runs');
	if (!existsSync(runs)) {
		mkdirSync(runs);
	}
	checked(runs, outputRoot);
	let id;
	let root;
	for (;;) {
		let highest = -1;
		for (const entry of readdirSync(runs)) {
			assert.match(entry, /^\d{5}-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/, 'Malformed run entry.');
			assert.ok(entry.length <= 22);
			checked(path.join(runs, entry), outputRoot);
			highest = Math.max(highest, Number(entry.slice(0, 5)));
		}
		assert.ok(highest < 99999);
		const sequence = String(highest + 1).padStart(5, '0');
		const allocation = path.join(runs, `${sequence}-allocate`);
		try {
			mkdirSync(allocation);
		} catch (error) {
			if (error.code === 'EEXIST') {
				continue;
			}
			throw error;
		}
		id = `${sequence}-${name}`;
		root = path.join(runs, id);
		checked(allocation, outputRoot);
		assert.ok(path.dirname(root) === checked(runs, outputRoot));
		renameSync(allocation, root);
		break;
	}
	checked(root, outputRoot);
	let sealed = false;
	const start = performance.now();
	const sources = sourceIdentities();
	/** @type {DomeRun['write']} */
	const write = (filename, value) => {
		assert.ok(!sealed, 'Run is sealed.');
		assert.ok(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(filename), 'Artifact must be a direct run member.');
		checked(root, outputRoot);
		const bytes = Buffer.isBuffer(value)
			? value
			: typeof value === 'string'
				? value
				: JSON.stringify(value, null, 2) + '\n';
		writeFileSync(path.join(root, filename), bytes, {flag: 'wx'});
	};
	/** @type {DomeRun['progress']} */
	const progress = (phase, message, counts = {}) => {
		assert.ok(!sealed);
		appendFileSync(
			path.join(root, 'progress.jsonl'),
			JSON.stringify({timestamp: new Date().toISOString(), phase, message, ...counts}) + '\n',
		);
	};
	write('started.json', {
		id,
		started: new Date().toISOString(),
		command: process.argv,
		node: process.version,
		platform: process.platform,
		sources,
		parents,
	});
	for (const source of sources) {
		const name = source.path.slice('experiments/flat-dome-cache-shape/'.length).replaceAll('/', '__');
		write(`source-${name}`, readFileSync(checked(path.join(repository, source.path), sourceRoot)));
	}
	progress('start', name);
	const heartbeat = setInterval(() => progress('active', 'Run remains active.'), 25000);
	heartbeat.unref();
	/** @type {DomeRun['finish']} */
	const finish = (state, summary) => {
		assert.ok(!sealed);
		clearInterval(heartbeat);
		progress('finalize', 'Closing and hashing all owned evidence artifacts.');
		let lastProgress = performance.now();
		/**
		 * Hashes closed artifacts recursively while retaining finalization progress.
		 *
		 * @param {string} directory - Owned artifact directory.
		 * @returns {DomeFileIdentity[]} - Recursive byte identities.
		 */
		const collect = (directory) =>
			readdirSync(checked(directory, outputRoot))
				.sort()
				.flatMap((name) => {
					if (performance.now() - lastProgress > 25000) {
						progress('finalize', 'Artifact hashing remains active.');
						lastProgress = performance.now();
					}
					const filename = checked(path.join(directory, name), outputRoot);
					return lstatSync(filename).isDirectory()
						? collect(filename)
						: [identity(path.relative(repository, filename))];
				});
		const artifacts = collect(root);
		progress('terminal', String(summary?.message ?? state), {state});
		const progressIndex = artifacts.findIndex((artifact) => artifact.path.endsWith('/progress.jsonl'));
		artifacts[progressIndex] = identity(path.relative(repository, path.join(root, 'progress.jsonl')));
		write('manifest.json', {
			id,
			state,
			completed: new Date().toISOString(),
			milliseconds: performance.now() - start,
			derivation: {parents, operation: name, sources},
			artifacts,
			summary,
		});
		sealed = true;
	};
	return {id, root, write, progress, finish};
}
