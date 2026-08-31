import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {resolveDistantSunSceneCache} from '../../src/flat32/DistantSunSceneCacheResolver.js';

const PACKAGE_SET_SCHEMA = 'algorithm32-distant-sun-bin-covered-runtime-package-set-v1';

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

async function ordinaryDirectory(directory, label) {
	const facts = await lstat(directory);
	if (facts.isSymbolicLink()) throw new Error(`${label} must not be a symlink or junction.`);
	const resolved = await realpath(directory);
	if (!(await stat(resolved)).isDirectory()) throw new Error(`${label} must be a directory.`);
	return resolved;
}

function requireContainedRelativePath(relativePath) {
	if (
		typeof relativePath !== 'string' ||
		relativePath.length === 0 ||
		path.isAbsolute(relativePath) ||
		relativePath.split(/[\\/]/u).some((part) => part.length === 0 || part === '.' || part === '..')
	) {
		throw new RangeError('Static cache path must be a contained relative path.');
	}
	return relativePath.split(/[\\/]/u);
}

async function containedOrdinaryFile(root, relativePath) {
	const parts = requireContainedRelativePath(relativePath);
	let candidate = root;
	for (const part of parts) {
		candidate = path.join(candidate, part);
		const facts = await lstat(candidate);
		if (facts.isSymbolicLink()) {
			throw new RangeError('Static cache path must not traverse a symlink or junction.');
		}
	}
	const resolved = await realpath(candidate);
	const relative = path.relative(root, resolved);
	if (relative.startsWith('..') || path.isAbsolute(relative)) {
		throw new RangeError('Static cache path escapes its package root.');
	}
	const facts = await stat(resolved);
	if (!facts.isFile()) throw new RangeError('Static cache target must be an ordinary file.');
	return {path: resolved, byteLength: facts.size};
}

export function defaultDistantSunSceneCachePackageRoot() {
	const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
	return path.join(
		repositoryRoot,
		'tmp',
		'extraterrestrial',
		'production-adoption',
		'one-degree-bin-covered-runtime-packages-20260830-1',
	);
}

/** Load and validate the immutable runtime catalog used by the Flat32 server. */
export async function createDistantSunSceneCachePackageService(configuration = {}) {
	const configuredRoot =
		configuration.packageRoot ??
		process.env.FLAT32_DISTANT_SUN_CACHE_ROOT ??
		defaultDistantSunSceneCachePackageRoot();
	const packageRoot = await ordinaryDirectory(path.resolve(configuredRoot), 'Distant-Sun cache package root');
	const reportFile = await containedOrdinaryFile(packageRoot, 'package-report.json');
	const report = JSON.parse(await readFile(reportFile.path, 'utf8'));
	if (report.schemaId !== PACKAGE_SET_SCHEMA || report.accepted !== true) {
		throw new Error('Distant-Sun runtime package report is incompatible.');
	}
	const catalogFile = await containedOrdinaryFile(packageRoot, report.catalogPath);
	const catalogBytes = await readFile(catalogFile.path);
	if (sha256(catalogBytes) !== report.catalogSha256) {
		throw new Error('Distant-Sun runtime catalog hash does not match its package report.');
	}
	const catalog = JSON.parse(catalogBytes.toString('utf8'));

	return Object.freeze({
		packageRoot,
		resolve(solarZenithDegrees, assetBaseUrl) {
			return resolveDistantSunSceneCache(catalog, solarZenithDegrees, assetBaseUrl);
		},
		resolveAsset(relativePath) {
			return containedOrdinaryFile(packageRoot, relativePath);
		},
	});
}
