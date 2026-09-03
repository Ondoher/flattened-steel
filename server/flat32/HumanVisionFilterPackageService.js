import {lstat, realpath, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

function requireRelativePath(value) {
	if (typeof value !== 'string' || path.isAbsolute(value) || value.split(/[\\/]/u).some((part) => !part || part === '.' || part === '..')) {
		throw new RangeError('Human-vision asset path must be contained and relative.');
	}
	return value;
}

async function ordinaryFile(root, relativePath) {
	const candidate = path.join(root, requireRelativePath(relativePath));
	if ((await lstat(candidate)).isSymbolicLink()) throw new RangeError('Human-vision asset must not be a symlink or junction.');
	const resolved = await realpath(candidate);
	const relative = path.relative(root, resolved);
	if (relative.startsWith('..') || path.isAbsolute(relative)) throw new RangeError('Human-vision asset escapes its package root.');
	const facts = await stat(resolved);
	if (!facts.isFile()) throw new RangeError('Human-vision asset must be an ordinary file.');
	return {path: resolved, byteLength: facts.size};
}

export function defaultHumanVisionFilterPackageRoot() {
	return path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'human-vision-filter-package-v1');
}

export async function createHumanVisionFilterPackageService(configuration = {}) {
	const unresolved = path.resolve(configuration.packageRoot ?? process.env.FLAT32_HUMAN_VISION_FILTER_ROOT ?? defaultHumanVisionFilterPackageRoot());
	if ((await lstat(unresolved)).isSymbolicLink()) throw new Error('Human-vision package root must not be a symlink or junction.');
	const root = await realpath(unresolved);
	if (!(await stat(root)).isDirectory()) throw new Error('Human-vision package root must be a directory.');
	return Object.freeze({packageRoot: root, resolveAsset: (relativePath) => ordinaryFile(root, relativePath)});
}
