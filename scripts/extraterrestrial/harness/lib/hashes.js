import { createHash } from 'node:crypto';
import {
	createReadStream,
} from 'node:fs';
import {
	lstat,
	readdir,
	realpath,
} from 'node:fs/promises';
import path from 'node:path';

import {
	assertLexicallyContained,
	pathComparisonKey,
} from './roots.js';

export const FILE_INVENTORY_SCHEMA_ID =
	'algorithm32-extraterrestrial-file-inventory-v1';

function compareStrings(left, right) {
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}

function toPortableRelativePath(value) {
	return value.split(path.sep).join('/');
}

function acceptRelativePath(value) {
	if (typeof value !== 'string' || value.length === 0) {
		throw new TypeError('Inventory path must be a non-empty string.');
	}
	const normalized = path.posix.normalize(value.replaceAll('\\', '/'));
	if (
		normalized === '.'
		|| normalized === '..'
		|| normalized.startsWith('../')
		|| path.posix.isAbsolute(normalized)
		|| /^[a-zA-Z]:/.test(normalized)
		|| normalized.includes('\0')
	) {
		throw new Error(`Inventory path is not a contained relative path: ${value}`);
	}
	return normalized;
}

async function assertPlainEntry(absolutePath, label) {
	const stats = await lstat(absolutePath);
	if (stats.isSymbolicLink()) {
		throw new Error(`${label} is a symbolic link or junction: ${absolutePath}`);
	}
	if (!stats.isFile() && !stats.isDirectory()) {
		throw new Error(`${label} is not a regular file or directory: ${absolutePath}`);
	}
	const resolved = await realpath(absolutePath);
	if (pathComparisonKey(resolved) !== pathComparisonKey(absolutePath)) {
		throw new Error(
			`${label} resolves through a link or reparse point: `
			+ `${absolutePath} -> ${resolved}`,
		);
	}
	return stats;
}

/**
 * Calculate a lowercase SHA-256 digest for an in-memory value.
 *
 * @param {string | NodeJS.ArrayBufferView} value - Supplies the bytes.
 * @returns {string} The hexadecimal digest.
 */
export function sha256(value) {
	return createHash('sha256').update(value).digest('hex');
}

/**
 * Calculate a SHA-256 digest without buffering the complete file.
 *
 * @param {string} filePath - Supplies the regular file to hash.
 * @returns {Promise<string>} The hexadecimal digest.
 */
export async function sha256File(filePath) {
	await assertPlainEntry(path.resolve(filePath), 'Hash input');
	const digest = createHash('sha256');
	await new Promise((resolve, reject) => {
		const stream = createReadStream(filePath);
		stream.on('data', (chunk) => digest.update(chunk));
		stream.on('error', reject);
		stream.on('end', resolve);
	});
	return digest.digest('hex');
}

function finalizeInventory(entries) {
	const files = entries
		.map((entry) => ({
			path: acceptRelativePath(entry.path),
			bytes: entry.bytes,
			sha256: entry.sha256,
		}))
		.sort((left, right) => compareStrings(left.path, right.path));

	const comparisonKeys = new Set();
	let totalBytes = 0;
	for (const entry of files) {
		if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0) {
			throw new Error(`Invalid byte count for ${entry.path}.`);
		}
		if (!/^[a-f0-9]{64}$/.test(entry.sha256)) {
			throw new Error(`Invalid SHA-256 digest for ${entry.path}.`);
		}
		const comparisonKey = process.platform === 'win32'
			? entry.path.toLocaleLowerCase('en-US')
			: entry.path;
		if (comparisonKeys.has(comparisonKey)) {
			throw new Error(
				`Inventory contains a case-colliding or duplicate path: ${entry.path}`,
			);
		}
		comparisonKeys.add(comparisonKey);
		totalBytes += entry.bytes;
	}

	const aggregateInput = `${FILE_INVENTORY_SCHEMA_ID}\n${JSON.stringify(files)}`;
	return Object.freeze({
		schemaId: FILE_INVENTORY_SCHEMA_ID,
		algorithm: 'sha256',
		fileCount: files.length,
		totalBytes,
		aggregateSha256: sha256(aggregateInput),
		files: Object.freeze(files),
	});
}

/**
 * Create a sorted byte/hash inventory for every selected file below root.
 *
 * @param {string} root - Supplies the existing tree root.
 * @param {{include?: (relativePath: string) => boolean}} [options] -
 * Supplies an optional file predicate.
 * @returns {Promise<ReturnType<typeof finalizeInventory>>} The inventory.
 */
export async function createFileInventory(root, options = {}) {
	const absoluteRoot = path.resolve(root);
	const include = options.include ?? (() => true);
	const rootStats = await assertPlainEntry(absoluteRoot, 'Inventory root');
	if (!rootStats.isDirectory()) {
		throw new Error(`Inventory root is not a directory: ${absoluteRoot}`);
	}

	const entries = [];
	async function visit(directory, relativeDirectory) {
		const children = await readdir(directory, { withFileTypes: true });
		children.sort((left, right) => compareStrings(left.name, right.name));
		for (const child of children) {
			const absolutePath = path.join(directory, child.name);
			const relativePath = toPortableRelativePath(
				path.join(relativeDirectory, child.name),
			);
			const stats = await assertPlainEntry(
				absolutePath,
				`Inventory entry ${relativePath}`,
			);
			if (stats.isDirectory()) {
				await visit(absolutePath, path.join(relativeDirectory, child.name));
				continue;
			}
			if (!include(relativePath)) {
				continue;
			}
			entries.push({
				path: relativePath,
				bytes: stats.size,
				sha256: await sha256File(absolutePath),
			});
		}
	}

	await visit(absoluteRoot, '');
	return finalizeInventory(entries);
}

/**
 * Inventory a deny-by-default set of already selected paths below root.
 *
 * @param {string} root - Supplies the common root.
 * @param {string[]} relativePaths - Supplies repository-relative files.
 * @returns {Promise<ReturnType<typeof finalizeInventory>>} The inventory.
 */
export async function createSelectedFileInventory(root, relativePaths) {
	const absoluteRoot = path.resolve(root);
	const rootStats = await assertPlainEntry(absoluteRoot, 'Selected inventory root');
	if (!rootStats.isDirectory()) {
		throw new Error(`Selected inventory root is not a directory: ${absoluteRoot}`);
	}

	const acceptedPaths = [...new Set(relativePaths.map(acceptRelativePath))]
		.sort(compareStrings);
	const entries = [];
	for (const relativePath of acceptedPaths) {
		const platformRelativePath = relativePath.split('/').join(path.sep);
		const absolutePath = assertLexicallyContained(
			absoluteRoot,
			path.join(absoluteRoot, platformRelativePath),
			`Selected inventory path ${relativePath}`,
		);
		const stats = await assertPlainEntry(
			absolutePath,
			`Selected inventory entry ${relativePath}`,
		);
		if (!stats.isFile()) {
			throw new Error(
				`Selected inventory entry is not a regular file: ${relativePath}`,
			);
		}
		entries.push({
			path: relativePath,
			bytes: stats.size,
			sha256: await sha256File(absolutePath),
		});
	}
	return finalizeInventory(entries);
}

/**
 * Return human-readable differences between two file inventories.
 *
 * @param {{files: Array<{path: string, bytes: number, sha256: string}>}} left -
 * Supplies the expected inventory.
 * @param {{files: Array<{path: string, bytes: number, sha256: string}>}} right -
 * Supplies the observed inventory.
 * @returns {string[]} The differences.
 */
export function compareFileInventories(left, right) {
	const expected = new Map(left.files.map((entry) => [entry.path, entry]));
	const observed = new Map(right.files.map((entry) => [entry.path, entry]));
	const paths = [...new Set([...expected.keys(), ...observed.keys()])]
		.sort(compareStrings);
	const differences = [];
	for (const relativePath of paths) {
		const expectedEntry = expected.get(relativePath);
		const observedEntry = observed.get(relativePath);
		if (!expectedEntry) {
			differences.push(`unexpected:${relativePath}`);
			continue;
		}
		if (!observedEntry) {
			differences.push(`missing:${relativePath}`);
			continue;
		}
		if (
			expectedEntry.bytes !== observedEntry.bytes
			|| expectedEntry.sha256 !== observedEntry.sha256
		) {
			differences.push(`changed:${relativePath}`);
		}
	}
	return differences;
}

/**
 * Require two inventories to contain exactly the same paths and bytes.
 *
 * @param {object} expected - Supplies the expected inventory.
 * @param {object} observed - Supplies the observed inventory.
 * @param {string} [label='File inventory'] - Supplies the diagnostic label.
 */
export function assertFileInventoriesEqual(
	expected,
	observed,
	label = 'File inventory',
) {
	const differences = compareFileInventories(expected, observed);
	if (
		expected.aggregateSha256 !== observed.aggregateSha256
		|| differences.length > 0
	) {
		throw new Error(
			`${label} mismatch: ${differences.slice(0, 20).join(', ')}`
			+ (differences.length > 20 ? ` (+${differences.length - 20} more)` : ''),
		);
	}
}
