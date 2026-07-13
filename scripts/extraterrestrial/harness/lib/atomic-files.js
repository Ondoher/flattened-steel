import { createHash, randomBytes } from "node:crypto";
import {
	createReadStream,
} from "node:fs";
import {
	lstat,
	mkdir,
	open,
	realpath,
	rename,
	unlink,
} from "node:fs/promises";
import {
	basename,
	dirname,
	isAbsolute,
	relative,
	resolve,
	sep,
} from "node:path";

const KNOWN_DIRECTORY_SYNC_LIMITATIONS = new Set([
	"EBADF",
	"EINVAL",
	"EISDIR",
	"ENOTSUP",
	"EPERM",
]);

/**
 * Return true only when a filesystem entry currently exists.
 *
 * @param {string} path
 * @returns {Promise<boolean>}
 */
export async function pathExists(path) {
	try {
		await lstat(path);
		return true;
	} catch (error) {
		if (error?.code === "ENOENT") {
			return false;
		}
		throw error;
	}
}

/**
 * Resolve a candidate lexically inside an allowed root.
 *
 * This check is deliberately separate from the real-path checks below:
 * callers can validate a destination before its leaf exists, while existing
 * ancestors are still checked for symbolic links and junctions.
 *
 * @param {string} allowedRoot
 * @param {string} candidate
 * @param {string} [label]
 * @returns {string}
 */
export function resolveContainedPath(
	allowedRoot,
	candidate,
	label = "path",
) {
	const root = resolve(allowedRoot);
	const result = resolve(candidate);
	const displacement = relative(root, result);
	if (
		displacement === ".."
		|| displacement.startsWith(`..${sep}`)
		|| isAbsolute(displacement)
	) {
		throw new RangeError(`${label} escapes its allowed root.`);
	}
	return result;
}

/**
 * Require an existing directory tree without symbolic-link/junction hops.
 *
 * @param {string} allowedRoot
 * @param {string} directory
 * @returns {Promise<string>} Canonical real path.
 */
export async function assertSafeDirectory(allowedRoot, directory) {
	const root = resolve(allowedRoot);
	const target = resolveContainedPath(root, directory, "directory");
	const rootInfo = await lstat(root);
	if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) {
		throw new Error("The allowed root must be a real directory.");
	}

	let current = root;
	const displacement = relative(root, target);
	for (const component of pathComponents(displacement)) {
		current = resolve(current, component);
		const info = await lstat(current);
		if (info.isSymbolicLink() || !info.isDirectory()) {
			throw new Error(
				`Unsafe directory component: ${relative(root, current)}`,
			);
		}
	}

	const canonicalRoot = await realpath(root);
	const canonicalTarget = await realpath(target);
	resolveContainedPath(canonicalRoot, canonicalTarget, "real directory");
	return canonicalTarget;
}

/**
 * Create missing directory components while rejecting redirected ancestors.
 *
 * @param {string} allowedRoot Existing trusted directory.
 * @param {string} directory Destination at or below allowedRoot.
 * @returns {Promise<string>} Canonical real path.
 */
export async function ensureSafeDirectory(allowedRoot, directory) {
	const root = resolve(allowedRoot);
	const target = resolveContainedPath(root, directory, "directory");
	const rootInfo = await lstat(root);
	if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) {
		throw new Error("The allowed root must be a real directory.");
	}

	let current = root;
	const displacement = relative(root, target);
	for (const component of pathComponents(displacement)) {
		current = resolve(current, component);
		try {
			const info = await lstat(current);
			if (info.isSymbolicLink() || !info.isDirectory()) {
				throw new Error(
					`Unsafe directory component: ${relative(root, current)}`,
				);
			}
		} catch (error) {
			if (error?.code !== "ENOENT") {
				throw error;
			}
			try {
				await mkdir(current, { mode: 0o700 });
			} catch (mkdirError) {
				if (mkdirError?.code !== "EEXIST") {
					throw mkdirError;
				}
			}
			const createdInfo = await lstat(current);
			if (createdInfo.isSymbolicLink() || !createdInfo.isDirectory()) {
				throw new Error(
					`Created directory was redirected: ${relative(root, current)}`,
				);
			}
		}
	}

	const canonicalRoot = await realpath(root);
	const canonicalTarget = await realpath(target);
	resolveContainedPath(canonicalRoot, canonicalTarget, "real directory");
	return canonicalTarget;
}

/**
 * Require one existing regular file inside an allowed root.
 *
 * @param {string} allowedRoot
 * @param {string} file
 * @returns {Promise<string>} Canonical real path.
 */
export async function assertSafeRegularFile(allowedRoot, file) {
	const target = resolveContainedPath(allowedRoot, file, "file");
	await assertSafeDirectory(allowedRoot, dirname(target));
	const info = await lstat(target);
	if (info.isSymbolicLink() || !info.isFile()) {
		throw new Error("Expected a real regular file.");
	}
	const canonicalRoot = await realpath(allowedRoot);
	const canonicalTarget = await realpath(target);
	resolveContainedPath(canonicalRoot, canonicalTarget, "real file");
	return canonicalTarget;
}

/**
 * Write bytes to a same-directory temporary file and atomically rename them.
 *
 * A caller selecting `replace: false` must own the destination directory; the
 * final existence check prevents accidental reuse, while the run protocol's
 * exclusive allocation prevents competing writers.
 *
 * @param {string} targetPath
 * @param {string | NodeJS.ArrayBufferView} data
 * @param {{
 *   allowedRoot?: string,
 *   mode?: number,
 *   replace?: boolean,
 * }} [options]
 * @returns {Promise<void>}
 */
export async function atomicWriteFile(
	targetPath,
	data,
	{
		allowedRoot = dirname(targetPath),
		mode = 0o600,
		replace = true,
	} = {},
) {
	const target = resolveContainedPath(allowedRoot, targetPath, "write target");
	const parent = dirname(target);
	await ensureSafeDirectory(allowedRoot, parent);
	await assertReplaceableTarget(target, replace);

	const temporaryPath = resolve(
		parent,
		`.atomic-${basename(target)}-${process.pid}-`
			+ `${randomBytes(12).toString("hex")}.tmp`,
	);
	resolveContainedPath(allowedRoot, temporaryPath, "temporary write");

	let handle = null;
	let renamed = false;
	try {
		handle = await open(temporaryPath, "wx", mode);
		await handle.writeFile(data);
		await handle.sync();
		await handle.close();
		handle = null;

		await assertReplaceableTarget(target, replace);
		await rename(temporaryPath, target);
		renamed = true;
		await syncDirectoryBestEffort(parent);
	} finally {
		if (handle !== null) {
			await handle.close().catch(() => {});
		}
		if (!renamed) {
			await unlink(temporaryPath).catch((error) => {
				if (error?.code !== "ENOENT") {
					throw error;
				}
			});
		}
	}
}

/**
 * Serialize a JSON value without silent undefined, non-finite, or cyclic data.
 *
 * @param {string} targetPath
 * @param {unknown} value
 * @param {{
 *   allowedRoot?: string,
 *   mode?: number,
 *   replace?: boolean,
 * }} [options]
 * @returns {Promise<void>}
 */
export async function atomicWriteJson(targetPath, value, options = {}) {
	assertDurableJsonValue(value);
	const serialized = `${JSON.stringify(value, null, 2)}\n`;
	await atomicWriteFile(targetPath, serialized, options);
}

/**
 * Calculate a regular file's SHA-256 without loading it into memory.
 *
 * @param {string} file
 * @returns {Promise<string>}
 */
export async function sha256File(file) {
	const digest = createHash("sha256");
	for await (const chunk of createReadStream(file)) {
		digest.update(chunk);
	}
	return digest.digest("hex");
}

/**
 * Validate a value before durable JSON serialization.
 *
 * @param {unknown} value
 * @returns {void}
 */
export function assertDurableJsonValue(value) {
	const ancestors = new Set();
	visitJsonValue(value, "$", ancestors);
}

/**
 * @param {unknown} value
 * @param {string} path
 * @param {Set<object>} ancestors
 * @returns {void}
 */
function visitJsonValue(value, path, ancestors) {
	if (
		value === null
		|| typeof value === "string"
		|| typeof value === "boolean"
	) {
		return;
	}
	if (typeof value === "number") {
		if (!Number.isFinite(value)) {
			throw new TypeError(`${path} must be a finite JSON number.`);
		}
		return;
	}
	if (typeof value !== "object") {
		throw new TypeError(`${path} is not durable JSON data.`);
	}
	if (ancestors.has(value)) {
		throw new TypeError(`${path} contains a JSON cycle.`);
	}
	const prototype = Object.getPrototypeOf(value);
	if (
		!Array.isArray(value)
		&& prototype !== Object.prototype
		&& prototype !== null
	) {
		throw new TypeError(`${path} must be a plain JSON object.`);
	}

	ancestors.add(value);
	if (Array.isArray(value)) {
		for (let index = 0; index < value.length; index += 1) {
			visitJsonValue(value[index], `${path}[${index}]`, ancestors);
		}
	} else {
		for (const [key, member] of Object.entries(value)) {
			visitJsonValue(member, `${path}.${key}`, ancestors);
		}
	}
	ancestors.delete(value);
}

/**
 * @param {string} target
 * @param {boolean} replace
 * @returns {Promise<void>}
 */
async function assertReplaceableTarget(target, replace) {
	try {
		const info = await lstat(target);
		if (info.isSymbolicLink() || !info.isFile()) {
			throw new Error("Atomic write target is not a real regular file.");
		}
		if (!replace) {
			const error = new Error(`Refusing to replace ${target}.`);
			error.code = "EEXIST";
			throw error;
		}
	} catch (error) {
		if (error?.code !== "ENOENT") {
			throw error;
		}
	}
}

/**
 * @param {string} displacement
 * @returns {string[]}
 */
function pathComponents(displacement) {
	if (displacement === "") {
		return [];
	}
	return displacement.split(sep).filter((component) => component !== "");
}

/**
 * Best-effort parent-directory synchronization.
 *
 * Some Windows filesystems do not permit opening directories as file
 * handles. The data file itself is always synced before rename.
 *
 * @param {string} directory
 * @returns {Promise<void>}
 */
async function syncDirectoryBestEffort(directory) {
	let handle;
	try {
		handle = await open(directory, "r");
		await handle.sync();
	} catch (error) {
		if (!KNOWN_DIRECTORY_SYNC_LIMITATIONS.has(error?.code)) {
			throw error;
		}
	} finally {
		await handle?.close().catch(() => {});
	}
}
