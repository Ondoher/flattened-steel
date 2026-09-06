import {lstat, readFile, realpath, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCHEMA = 'algorithm32-production-brightest-2000-stellar-package-v1';

function requireRelativePath(value) {
	if (
		typeof value !== 'string' ||
		path.isAbsolute(value) ||
		value.split(/[\\/]/u).some((part) => !part || part === '.' || part === '..')
	) {
		throw new RangeError('Stellar catalog asset path must be contained and relative.');
	}
	return value;
}

async function ordinaryRoot(value) {
	const unresolved = path.resolve(value);
	if ((await lstat(unresolved)).isSymbolicLink())
		throw new Error('Stellar catalog package root must not be a symlink or junction.');
	const resolved = await realpath(unresolved);
	if (!(await stat(resolved)).isDirectory()) throw new Error('Stellar catalog package root must be a directory.');
	return resolved;
}

async function ordinaryFile(root, relativePath) {
	const candidate = path.join(root, requireRelativePath(relativePath));
	if ((await lstat(candidate)).isSymbolicLink())
		throw new RangeError('Stellar catalog asset must not be a symlink or junction.');
	const resolved = await realpath(candidate);
	const relative = path.relative(root, resolved);
	if (relative.startsWith('..') || path.isAbsolute(relative))
		throw new RangeError('Stellar catalog asset escapes its package root.');
	const facts = await stat(resolved);
	if (!facts.isFile()) throw new RangeError('Stellar catalog asset must be an ordinary file.');
	return {path: resolved, byteLength: facts.size};
}

export function defaultStellarCatalogPackageRoot() {
	return path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'brightest-2000-stellar-package-v1');
}

/** Validate and expose the fixed local-only production stellar package. */
export async function createStellarCatalogPackageService(configuration = {}) {
	const packageRoot = await ordinaryRoot(
		configuration.packageRoot ?? process.env.FLAT32_STELLAR_CATALOG_ROOT ?? defaultStellarCatalogPackageRoot(),
	);
	const manifestFile = await ordinaryFile(packageRoot, 'manifest.json');
	const manifest = JSON.parse(await readFile(manifestFile.path, 'utf8'));
	if (manifest.schemaId !== SCHEMA || manifest.packageId !== 'brightest-2000-stellar-package-v1') {
		throw new Error('Stellar catalog package manifest is incompatible.');
	}
	for (const artifact of Object.values(manifest.artifacts ?? {})) {
		const file = await ordinaryFile(packageRoot, artifact.path);
		if (file.byteLength !== artifact.byteLength)
			throw new Error('Stellar catalog asset length differs from its manifest.');
	}
	return Object.freeze({packageRoot, resolveAsset: (relativePath) => ordinaryFile(packageRoot, relativePath)});
}
