import { createHash, randomBytes } from "node:crypto";
import {
	hostname,
} from "node:os";
import {
	lstat,
	mkdir,
	open,
	readFile,
	readdir,
	realpath,
	rename,
	stat,
	unlink,
} from "node:fs/promises";
import {
	relative,
	resolve,
	sep,
} from "node:path";

import {
	assertDurableJsonValue,
	assertSafeDirectory,
	atomicWriteFile,
	atomicWriteJson,
	ensureSafeDirectory,
	pathExists,
	resolveContainedPath,
	sha256File,
} from "./atomic-files.js";
import {
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	assertRepositoryIdentity,
	pathComparisonKey,
} from "./roots.js";

export const RUN_RESULT_SCHEMA_ID = "extraterrestrial-run-result-v1";
export const ARTIFACT_MANIFEST_SCHEMA_ID =
	"extraterrestrial-run-artifact-manifest-v1";
export const RUN_LOCK_SCHEMA_ID = "extraterrestrial-run-allocation-lock-v1";
export const ARTIFACT_SET_ENCODING =
	"utf8-lines-v1:path-null-byteLength-null-sha256-newline";

export const RUN_NAMESPACES = Object.freeze([
	"default",
	"color-reset",
]);

export const TERMINAL_CONCLUSIONS = Object.freeze([
	"accepted",
	"rejected",
	"failed",
	"interrupted",
]);

export const REQUIRED_RUN_RECORDS = Object.freeze([
	"result.json",
	"report.md",
	"command.txt",
	"inputs.json",
	"provenance.json",
	"environment.json",
	"references/manifest.json",
]);

const RUN_DIRECTORY_PATTERN =
	/^(?<number>[0-9]{6})-(?<slug>[a-z0-9]+(?:-[a-z0-9]+)*)$/u;
const NUMBERED_DIRECTORY_PATTERN = /^[0-9]{6}-.+/u;
const COUNTER_PATTERN = /^[0-9]{6}$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const LOCK_FILE_NAME = ".run-allocation-lock";
const COUNTER_FILE_NAME = ".last-run-number";
const TERMINAL_MANIFEST_NAME = "artifact-manifest.json";
const MAXIMUM_RUN_NUMBER = 999_999;
const MAXIMUM_SLUG_LENGTH = 96;
const LOCK_RETRY_MILLISECONDS = 50;
const LOCK_ACQUISITION_TIMEOUT_MILLISECONDS = 10_000;
const STALE_LOCK_AGE_MILLISECONDS = 5 * 60 * 1000;

/**
 * Derive the experiment paths from this module's repository identity.
 *
 * `runNamespace` selects one explicitly reviewed ledger. Other root values
 * remain exact checks rather than caller-controlled write destinations, so
 * the allocator's complete write boundary stays reviewable here.
 *
 * @param {{
 *   repositoryRoot?: string,
 *   experimentRoot?: string,
 *   outputRoot?: string,
 *   runsRoot?: string,
 *   runNamespace?: "default" | "color-reset",
 * }} [roots]
 * @returns {{
 *   repositoryRoot: string,
 *   experimentRoot: string,
 *   outputRoot: string,
 *   runsRoot: string,
 *   runNamespace: "default" | "color-reset",
 * }}
 */
export function resolveRunRoots(roots = {}) {
	const repositoryRoot = resolve(
		roots.repositoryRoot ?? REPOSITORY_ROOT,
	);
	const runNamespace = roots.runNamespace ?? "default";
	if (!RUN_NAMESPACES.includes(runNamespace)) {
		throw new RangeError(
			`Unsupported immutable-run namespace: ${String(runNamespace)}.`,
		);
	}
	const requiredExperimentRoot = resolve(
		repositoryRoot,
		"scripts",
		"extraterrestrial",
	);
	const extraterrestrialOutputRoot = resolve(
		repositoryRoot,
		"tmp",
		"extraterrestrial",
	);
	const requiredOutputRoot = runNamespace === "default"
		? extraterrestrialOutputRoot
		: resolve(extraterrestrialOutputRoot, runNamespace);
	const requiredRunsRoot = resolve(requiredOutputRoot, "runs");
	const experimentRoot = resolve(
		roots.experimentRoot ?? EXPERIMENT_ROOT,
	);
	const outputRoot = resolve(roots.outputRoot ?? requiredOutputRoot);
	const runsRoot = resolve(roots.runsRoot ?? requiredRunsRoot);
	if (
		pathComparisonKey(repositoryRoot)
			!== pathComparisonKey(REPOSITORY_ROOT)
		|| pathComparisonKey(experimentRoot)
			!== pathComparisonKey(requiredExperimentRoot)
		|| pathComparisonKey(outputRoot)
			!== pathComparisonKey(requiredOutputRoot)
		|| pathComparisonKey(runsRoot)
			!== pathComparisonKey(requiredRunsRoot)
	) {
		throw new Error(
			"Run roots must use experiments/extraterrestrial and the exact "
				+ `${runNamespace} immutable-run namespace in the selected repository.`,
		);
	}

	resolveContainedPath(
		repositoryRoot,
		experimentRoot,
		"experiment root",
	);
	resolveContainedPath(repositoryRoot, outputRoot, "output root");
	resolveContainedPath(outputRoot, runsRoot, "runs root");
	return Object.freeze({
		repositoryRoot,
		experimentRoot,
		outputRoot,
		runsRoot,
		runNamespace,
	});
}

/**
 * Normalize a descriptive purpose into the canonical run slug.
 *
 * @param {string} requestedSlug
 * @returns {string}
 */
export function normalizeRunSlug(requestedSlug) {
	if (typeof requestedSlug !== "string") {
		throw new TypeError("Run slug must be a string.");
	}
	const slug = requestedSlug
		.normalize("NFKD")
		.replaceAll("*", " star ")
		.replace(/\p{M}+/gu, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-+|-+$/gu, "");
	if (
		slug.length < 1
		|| slug.length > MAXIMUM_SLUG_LENGTH
		|| !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)
	) {
		throw new RangeError(
			"Normalized run slug must be 1-96 kebab-case ASCII characters.",
		);
	}
	return slug;
}

/**
 * Allocate and initialize a new immutable-run attempt.
 *
 * All seven required records are present before this function resolves.
 * Failure during initialization deliberately leaves the partial directory in
 * place; it is evidence and its number is never reused.
 *
 * @param {{
 *   slug: string,
 *   command: string,
 *   inputs: Record<string, unknown>,
 *   provenance: Record<string, unknown>,
 *   environment: Record<string, unknown>,
 *   references: Record<string, unknown>,
 *   roots?: {
 *     repositoryRoot?: string,
 *     experimentRoot?: string,
 *     outputRoot?: string,
 *     runsRoot?: string,
 *     runNamespace?: "default" | "color-reset",
 *   },
 * }} request
 * @returns {Promise<ImmutableRunRecord>}
 */
export async function initializeRunRecord({
	slug: requestedSlug,
	command,
	inputs,
	provenance,
	environment,
	references,
	roots: requestedRoots = {},
}) {
	const roots = resolveRunRoots(requestedRoots);
	await prepareWritableRunRoots(roots);
	const slug = normalizeRunSlug(requestedSlug);
	assertInitialRecord("inputs", inputs);
	assertInitialRecord("provenance", provenance);
	assertInitialRecord("environment", environment);
	assertInitialRecord("references", references);
	const commandText = normalizeCommand(command);

	const allocation = await allocateRunDirectory({ roots, slug });
	const initializedAt = new Date().toISOString();
	const initialResult = {
		schemaId: RUN_RESULT_SCHEMA_ID,
		runId: allocation.runId,
		runNumber: allocation.runNumber,
		slug,
		state: "initialized",
		conclusion: null,
		initializedAt,
	};
	const initialReport = `# ${allocation.runId}\n\n`
		+ "Status: initialized; qualifying work has not concluded.\n";

	await atomicWriteJson(
		resolve(allocation.runDirectory, "result.json"),
		initialResult,
		{
			allowedRoot: allocation.runDirectory,
			replace: false,
		},
	);
	await atomicWriteFile(
		resolve(allocation.runDirectory, "report.md"),
		initialReport,
		{
			allowedRoot: allocation.runDirectory,
			replace: false,
		},
	);
	await atomicWriteFile(
		resolve(allocation.runDirectory, "command.txt"),
		commandText,
		{
			allowedRoot: allocation.runDirectory,
			replace: false,
		},
	);
	await atomicWriteJson(
		resolve(allocation.runDirectory, "inputs.json"),
		inputs,
		{
			allowedRoot: allocation.runDirectory,
			replace: false,
		},
	);
	await atomicWriteJson(
		resolve(allocation.runDirectory, "provenance.json"),
		provenance,
		{
			allowedRoot: allocation.runDirectory,
			replace: false,
		},
	);
	await atomicWriteJson(
		resolve(allocation.runDirectory, "environment.json"),
		environment,
		{
			allowedRoot: allocation.runDirectory,
			replace: false,
		},
	);
	await ensureSafeDirectory(
		allocation.runDirectory,
		resolve(allocation.runDirectory, "references"),
	);
	await atomicWriteJson(
		resolve(allocation.runDirectory, "references", "manifest.json"),
		references,
		{
			allowedRoot: allocation.runDirectory,
			replace: false,
		},
	);

	return new ImmutableRunRecord({
		...allocation,
		initializedAt,
		roots,
	});
}

/**
 * One-process capability for the newly allocated run only.
 *
 * There is intentionally no API for reopening an existing run as writable.
 */
export class ImmutableRunRecord {
	#finalizationStarted = false;

	#terminal = false;

	/**
	 * @param {{
	 *   roots: ReturnType<typeof resolveRunRoots>,
	 *   runId: string,
	 *   runNumber: number,
	 *   slug: string,
	 *   runDirectory: string,
	 *   initializedAt: string,
	 * }} state
	 */
	constructor(state) {
		this.roots = state.roots;
		this.runId = state.runId;
		this.runNumber = state.runNumber;
		this.slug = state.slug;
		this.runDirectory = state.runDirectory;
		this.initializedAt = state.initializedAt;
		Object.freeze(this);
	}

	/**
	 * Atomically create one additional non-reserved artifact before finalizing.
	 *
	 * @param {string} artifactPath POSIX-style run-relative path.
	 * @param {string | NodeJS.ArrayBufferView} data
	 * @returns {Promise<void>}
	 */
	async writeArtifact(artifactPath, data) {
		this.#assertWritable();
		await this.#assertNoTerminalManifest();
		const normalized = normalizeArtifactPath(artifactPath);
		if (
			REQUIRED_RUN_RECORDS.includes(normalized)
			|| normalized === TERMINAL_MANIFEST_NAME
		) {
			throw new Error(
				"Reserved run records are initialized or finalized by the ledger.",
			);
		}
		await atomicWriteFile(
			resolveRunArtifactPath(this.runDirectory, normalized),
			data,
			{
				allowedRoot: this.runDirectory,
				replace: false,
			},
		);
	}

	/**
	 * Atomically create one additional JSON artifact before finalizing.
	 *
	 * @param {string} artifactPath
	 * @param {unknown} value
	 * @returns {Promise<void>}
	 */
	async writeJsonArtifact(artifactPath, value) {
		this.#assertWritable();
		await this.#assertNoTerminalManifest();
		const normalized = normalizeArtifactPath(artifactPath);
		if (
			REQUIRED_RUN_RECORDS.includes(normalized)
			|| normalized === TERMINAL_MANIFEST_NAME
		) {
			throw new Error(
				"Reserved run records are initialized or finalized by the ledger.",
			);
		}
		await atomicWriteJson(
			resolveRunArtifactPath(this.runDirectory, normalized),
			value,
			{
				allowedRoot: this.runDirectory,
				replace: false,
			},
		);
	}

	/**
	 * Finalize once and write artifact-manifest.json after every other artifact.
	 *
	 * A failed finalization attempt is never retried on this run. Any correction
	 * must allocate the next run number.
	 *
	 * @param {{
	 *   conclusion: "accepted" | "rejected" | "failed" | "interrupted",
	 *   result: Record<string, unknown>,
	 *   report: string,
	 * }} request
	 * @returns {Promise<Record<string, unknown>>}
	 */
	async finalize({ conclusion, result, report }) {
		this.#assertWritable();
		if (!TERMINAL_CONCLUSIONS.includes(conclusion)) {
			throw new RangeError("Unknown terminal run conclusion.");
		}
		assertInitialRecord("terminal result", result);
		if (typeof report !== "string" || report.trim() === "") {
			throw new TypeError("Terminal report must be a non-empty string.");
		}

		this.#finalizationStarted = true;
		const manifestPath = resolve(
			this.runDirectory,
			TERMINAL_MANIFEST_NAME,
		);
		if (await pathExists(manifestPath)) {
			throw new Error("Terminal run manifest already exists.");
		}

		const finalizedAt = new Date().toISOString();
		const terminalResult = {
			...result,
			schemaId: RUN_RESULT_SCHEMA_ID,
			runId: this.runId,
			runNumber: this.runNumber,
			slug: this.slug,
			state: "terminal",
			conclusion,
			initializedAt: this.initializedAt,
			finalizedAt,
		};
		await atomicWriteJson(
			resolve(this.runDirectory, "result.json"),
			terminalResult,
			{
				allowedRoot: this.runDirectory,
				replace: true,
			},
		);
		await atomicWriteFile(
			resolve(this.runDirectory, "report.md"),
			ensureTrailingNewline(report),
			{
				allowedRoot: this.runDirectory,
				replace: true,
			},
		);

		const artifacts = await collectArtifactRecords(this.runDirectory);
		requireCompleteArtifactSet(artifacts);
		const artifactBytes = artifacts.reduce(
			(sum, artifact) => sum + artifact.byteLength,
			0,
		);
		const artifactSetSha256 = computeArtifactSetSha256(artifacts);
		const manifest = {
			schemaId: ARTIFACT_MANIFEST_SCHEMA_ID,
			runId: this.runId,
			runNumber: this.runNumber,
			slug: this.slug,
			conclusion,
			initializedAt: this.initializedAt,
			finalizedAt,
			hashAlgorithm: "sha256",
			artifactSetEncoding: ARTIFACT_SET_ENCODING,
			requiredRecords: [...REQUIRED_RUN_RECORDS],
			artifactCount: artifacts.length,
			artifactBytes,
			artifactSetSha256,
			artifacts,
		};

		// This is the terminal write. Nothing may mutate the run after it.
		await atomicWriteJson(manifestPath, manifest, {
			allowedRoot: this.runDirectory,
			replace: false,
		});
		this.#terminal = true;
		return Object.freeze(manifest);
	}

	/** @returns {void} */
	#assertWritable() {
		if (
			this.#terminal
			|| this.#finalizationStarted
		) {
			throw new Error(
				"This run is terminal or has already attempted finalization.",
			);
		}
	}

	/** @returns {Promise<void>} */
	async #assertNoTerminalManifest() {
		if (
			await pathExists(
				resolve(this.runDirectory, TERMINAL_MANIFEST_NAME),
			)
		) {
			throw new Error("Terminal runs are immutable.");
		}
	}
}

/**
 * Read and hash every terminal artifact except artifact-manifest.json.
 *
 * @param {string} runDirectory
 * @returns {Promise<Array<{
 *   path: string,
 *   byteLength: number,
 *   sha256: string,
 * }>>}
 */
export async function collectArtifactRecords(runDirectory) {
	const canonicalRunDirectory = await assertSafeDirectory(
		runDirectory,
		runDirectory,
	);
	const artifactPaths = [];
	await collectFilesRecursively({
		root: canonicalRunDirectory,
		directory: canonicalRunDirectory,
		artifactPaths,
	});
	artifactPaths.sort(compareStrings);

	const artifacts = [];
	for (const artifactPath of artifactPaths) {
		if (artifactPath === TERMINAL_MANIFEST_NAME) {
			continue;
		}
		if (artifactPath.includes(".atomic-")) {
			throw new Error(
				`Incomplete atomic temporary artifact: ${artifactPath}`,
			);
		}
		const absolutePath = resolveRunArtifactPath(
			canonicalRunDirectory,
			artifactPath,
		);
		const before = await stat(absolutePath, { bigint: true });
		if (!before.isFile()) {
			throw new Error(`Artifact is not a regular file: ${artifactPath}`);
		}
		const sha256 = await sha256File(absolutePath);
		const after = await stat(absolutePath, { bigint: true });
		if (!sameFileSnapshot(before, after)) {
			throw new Error(`Artifact changed while hashing: ${artifactPath}`);
		}
		const byteLength = Number(after.size);
		if (!Number.isSafeInteger(byteLength)) {
			throw new RangeError(`Artifact is too large to record: ${artifactPath}`);
		}
		artifacts.push({
			path: artifactPath,
			byteLength,
			sha256,
		});
	}
	return artifacts;
}

/**
 * Compute the explicitly versioned aggregate over sorted artifact records.
 *
 * @param {readonly {
 *   path: string,
 *   byteLength: number,
 *   sha256: string,
 * }[]} artifacts
 * @returns {string}
 */
export function computeArtifactSetSha256(artifacts) {
	const digest = createHash("sha256");
	let priorPath = null;
	for (const artifact of artifacts) {
		const path = normalizeArtifactPath(artifact.path);
		if (
			priorPath !== null
			&& compareStrings(priorPath, path) >= 0
		) {
			throw new Error("Artifact records must be unique and sorted.");
		}
		if (
			!Number.isSafeInteger(artifact.byteLength)
			|| artifact.byteLength < 0
			|| !SHA256_PATTERN.test(artifact.sha256)
		) {
			throw new TypeError("Malformed artifact hash record.");
		}
		digest.update(path, "utf8");
		digest.update("\0", "utf8");
		digest.update(String(artifact.byteLength), "utf8");
		digest.update("\0", "utf8");
		digest.update(artifact.sha256, "utf8");
		digest.update("\n", "utf8");
		priorPath = path;
	}
	return digest.digest("hex");
}

/**
 * Validate and resolve a run selector without writing.
 *
 * @param {string} selector Run basename or path under runsRoot.
 * @param {ReturnType<typeof resolveRunRoots>} roots
 * @returns {Promise<string>}
 */
export async function resolveExistingRunDirectory(selector, roots) {
	if (typeof selector !== "string" || selector.trim() === "") {
		throw new TypeError("Run selector must be a non-empty string.");
	}
	await assertRepositoryIdentity();
	const requested = /^[^/\\]+$/u.test(selector)
		? resolve(roots.runsRoot, selector)
		: resolve(roots.repositoryRoot, selector);
	const contained = resolveContainedPath(
		roots.runsRoot,
		requested,
		"run selector",
	);
	const canonicalRunsRoot = await assertSafeDirectory(
		roots.runsRoot,
		roots.runsRoot,
	);
	const canonicalRun = await realpath(contained);
	resolveContainedPath(canonicalRunsRoot, canonicalRun, "real run");
	const info = await lstat(contained);
	if (info.isSymbolicLink() || !info.isDirectory()) {
		throw new Error("Run selector must identify a real directory.");
	}
	return canonicalRun;
}

/**
 * Parse and validate a canonical run directory basename.
 *
 * @param {string} runId
 * @returns {{runId: string, runNumber: number, slug: string}}
 */
export function parseRunId(runId) {
	const match = RUN_DIRECTORY_PATTERN.exec(runId);
	if (match === null) {
		throw new Error("Run directory name is not canonical.");
	}
	const runNumber = Number(match.groups.number);
	if (runNumber < 1 || runNumber > MAXIMUM_RUN_NUMBER) {
		throw new RangeError("Run number is outside the supported range.");
	}
	return {
		runId,
		runNumber,
		slug: match.groups.slug,
	};
}

/**
 * @param {ReturnType<typeof resolveRunRoots>} roots
 * @returns {Promise<void>}
 */
async function prepareWritableRunRoots(roots) {
	await assertRepositoryIdentity();
	await assertSafeDirectory(
		roots.repositoryRoot,
		roots.experimentRoot,
	);
	await ensureSafeDirectory(roots.repositoryRoot, roots.outputRoot);
	await ensureSafeDirectory(roots.outputRoot, roots.runsRoot);
}

/**
 * @param {{
 *   roots: ReturnType<typeof resolveRunRoots>,
 *   slug: string,
 * }} request
 * @returns {Promise<{
 *   runId: string,
 *   runNumber: number,
 *   slug: string,
 *   runDirectory: string,
 * }>}
 */
async function allocateRunDirectory({ roots, slug }) {
	return withAllocationLock(roots.runsRoot, async () => {
		const counter = await readRunCounter(roots.runsRoot);
		const greatestDirectoryNumber =
			await greatestExistingRunNumber(roots.runsRoot);
		const runNumber = 1 + Math.max(counter, greatestDirectoryNumber);
		if (runNumber > MAXIMUM_RUN_NUMBER) {
			throw new RangeError("Extraterrestrial run number space is exhausted.");
		}
		const numberText = String(runNumber).padStart(6, "0");
		const runId = `${numberText}-${slug}`;
		const runDirectory = resolve(roots.runsRoot, runId);
		resolveContainedPath(roots.runsRoot, runDirectory, "new run");
		await mkdir(runDirectory, {
			mode: 0o700,
			recursive: false,
		});
		await assertSafeDirectory(roots.runsRoot, runDirectory);

		// If the counter update fails, the exclusive directory still prevents
		// reuse because future allocation takes the maximum of both sources.
		await atomicWriteFile(
			resolve(roots.runsRoot, COUNTER_FILE_NAME),
			`${numberText}\n`,
			{
				allowedRoot: roots.runsRoot,
				replace: true,
			},
		);
		return {
			runId,
			runNumber,
			slug,
			runDirectory,
		};
	});
}

/**
 * @template T
 * @param {string} runsRoot
 * @param {() => Promise<T>} operation
 * @returns {Promise<T>}
 */
async function withAllocationLock(runsRoot, operation) {
	const lock = await acquireAllocationLock(runsRoot);
	try {
		const result = await operation();
		await releaseAllocationLock(lock);
		return result;
	} catch (operationError) {
		try {
			await releaseAllocationLock(lock);
		} catch (releaseError) {
			throw new AggregateError(
				[operationError, releaseError],
				"Run allocation and lock release both failed.",
			);
		}
		throw operationError;
	}
}

/**
 * @param {string} runsRoot
 * @returns {Promise<{
 *   path: string,
 *   token: string,
 * }>}
 */
async function acquireAllocationLock(runsRoot) {
	const lockPath = resolve(runsRoot, LOCK_FILE_NAME);
	const deadline = Date.now() + LOCK_ACQUISITION_TIMEOUT_MILLISECONDS;
	while (true) {
		const token = randomBytes(24).toString("hex");
		let handle = null;
		let created = false;
		try {
			handle = await open(lockPath, "wx", 0o600);
			created = true;
			const acquiredAtEpochMilliseconds = Date.now();
			const owner = {
				schemaId: RUN_LOCK_SCHEMA_ID,
				token,
				processId: process.pid,
				host: hostname(),
				acquiredAt: new Date(
					acquiredAtEpochMilliseconds,
				).toISOString(),
				acquiredAtEpochMilliseconds,
			};
			await handle.writeFile(`${JSON.stringify(owner, null, 2)}\n`);
			await handle.sync();
			await handle.close();
			return { path: lockPath, token };
		} catch (error) {
			await handle?.close().catch(() => {});
			if (created) {
				await unlink(lockPath).catch(() => {});
			}
			if (error?.code !== "EEXIST") {
				throw error;
			}
		}

		if (await recoverStaleLockIfSafe(lockPath)) {
			continue;
		}
		const remaining = deadline - Date.now();
		if (remaining <= 0) {
			throw new Error(
				"Timed out waiting for the extraterrestrial run allocation lock.",
			);
		}
		await delay(Math.min(LOCK_RETRY_MILLISECONDS, remaining));
	}
}

/**
 * Recover only a sufficiently old, well-formed, same-host, dead-process lock.
 *
 * @param {string} lockPath
 * @returns {Promise<boolean>}
 */
async function recoverStaleLockIfSafe(lockPath) {
	let info;
	try {
		info = await lstat(lockPath);
	} catch (error) {
		if (error?.code === "ENOENT") {
			return true;
		}
		throw error;
	}
	if (info.isSymbolicLink() || !info.isFile()) {
		throw new Error("Run allocation lock is not a real regular file.");
	}

	let owner;
	try {
		owner = parseLockOwner(await readFile(lockPath, "utf8"));
	} catch {
		// A partial or malformed owner is never guessed stale automatically.
		return false;
	}

	const now = Date.now();
	const metadataAge = now - owner.acquiredAtEpochMilliseconds;
	const filesystemAge = now - info.mtimeMs;
	if (
		metadataAge < STALE_LOCK_AGE_MILLISECONDS
		|| filesystemAge < STALE_LOCK_AGE_MILLISECONDS
		|| owner.host !== hostname()
		|| isProcessAlive(owner.processId)
	) {
		return false;
	}

	const quarantinePath = `${lockPath}.stale-${owner.token}-`
		+ randomBytes(8).toString("hex");
	try {
		await rename(lockPath, quarantinePath);
	} catch (error) {
		if (error?.code === "ENOENT") {
			return true;
		}
		throw error;
	}
	const quarantinedOwner = parseLockOwner(
		await readFile(quarantinePath, "utf8"),
	);
	if (quarantinedOwner.token !== owner.token) {
		throw new Error("Stale lock identity changed during recovery.");
	}
	await unlink(quarantinePath);
	return true;
}

/**
 * @param {{path: string, token: string}} lock
 * @returns {Promise<void>}
 */
async function releaseAllocationLock(lock) {
	const owner = parseLockOwner(await readFile(lock.path, "utf8"));
	if (owner.token !== lock.token) {
		throw new Error("Run allocation lock ownership changed.");
	}
	await unlink(lock.path);
}

/**
 * @param {string} serialized
 * @returns {{
 *   token: string,
 *   processId: number,
 *   host: string,
 *   acquiredAtEpochMilliseconds: number,
 * }}
 */
function parseLockOwner(serialized) {
	let owner;
	try {
		owner = JSON.parse(serialized);
	} catch {
		throw new Error("Run allocation lock owner metadata is malformed.");
	}
	if (
		owner?.schemaId !== RUN_LOCK_SCHEMA_ID
		|| typeof owner.token !== "string"
		|| !/^[a-f0-9]{48}$/u.test(owner.token)
		|| !Number.isSafeInteger(owner.processId)
		|| owner.processId < 1
		|| typeof owner.host !== "string"
		|| owner.host === ""
		|| typeof owner.acquiredAt !== "string"
		|| !Number.isFinite(Date.parse(owner.acquiredAt))
		|| new Date(owner.acquiredAt).toISOString() !== owner.acquiredAt
		|| !Number.isSafeInteger(owner.acquiredAtEpochMilliseconds)
		|| owner.acquiredAtEpochMilliseconds < 0
		|| Date.parse(owner.acquiredAt)
			!== owner.acquiredAtEpochMilliseconds
	) {
		throw new Error("Run allocation lock owner metadata is invalid.");
	}
	return owner;
}

/**
 * @param {number} processId
 * @returns {boolean}
 */
function isProcessAlive(processId) {
	try {
		process.kill(processId, 0);
		return true;
	} catch (error) {
		if (error?.code === "ESRCH") {
			return false;
		}
		if (error?.code === "EPERM") {
			return true;
		}
		throw error;
	}
}

/**
 * @param {string} runsRoot
 * @returns {Promise<number>}
 */
async function readRunCounter(runsRoot) {
	const counterPath = resolve(runsRoot, COUNTER_FILE_NAME);
	try {
		const info = await lstat(counterPath);
		if (info.isSymbolicLink() || !info.isFile()) {
			throw new Error("Run counter must be a real regular file.");
		}
		const value = (await readFile(counterPath, "utf8")).trim();
		if (!COUNTER_PATTERN.test(value)) {
			throw new Error("Run counter is malformed.");
		}
		return Number(value);
	} catch (error) {
		if (error?.code === "ENOENT") {
			return 0;
		}
		throw error;
	}
}

/**
 * @param {string} runsRoot
 * @returns {Promise<number>}
 */
async function greatestExistingRunNumber(runsRoot) {
	let greatest = 0;
	for (const entry of await readdir(runsRoot, { withFileTypes: true })) {
		const match = /^([0-9]{6})-/u.exec(entry.name);
		if (match === null) {
			continue;
		}
		if (entry.isSymbolicLink() || !entry.isDirectory()) {
			throw new Error(
				`Numbered run entry is not a real directory: ${entry.name}`,
			);
		}
		const number = Number(match[1]);
		if (number < 1 || number > MAXIMUM_RUN_NUMBER) {
			throw new RangeError(`Invalid existing run number: ${entry.name}`);
		}
		greatest = Math.max(greatest, number);
	}
	return greatest;
}

/**
 * @param {{
 *   root: string,
 *   directory: string,
 *   artifactPaths: string[],
 * }} request
 * @returns {Promise<void>}
 */
async function collectFilesRecursively({
	root,
	directory,
	artifactPaths,
}) {
	const entries = await readdir(directory, { withFileTypes: true });
	if (directory !== root && entries.length === 0) {
		throw new Error(
			`Run contains an unmanifested empty directory: `
				+ `${toPortableRelativePath(relative(root, directory))}`,
		);
	}
	entries.sort((left, right) => compareStrings(left.name, right.name));
	for (const entry of entries) {
		const absolutePath = resolve(directory, entry.name);
		resolveContainedPath(root, absolutePath, "artifact");
		if (entry.isSymbolicLink()) {
			throw new Error(
				`Run contains a symbolic link or junction: ${entry.name}`,
			);
		}
		const artifactPath = toPortableRelativePath(
			relative(root, absolutePath),
		);
		if (entry.isDirectory()) {
			if (NUMBERED_DIRECTORY_PATTERN.test(entry.name)) {
				throw new Error(
					`Nested numbered run directory is prohibited: ${artifactPath}`,
				);
			}
			await collectFilesRecursively({
				root,
				directory: absolutePath,
				artifactPaths,
			});
		} else if (entry.isFile()) {
			artifactPaths.push(normalizeArtifactPath(artifactPath));
		} else {
			throw new Error(`Run contains a special filesystem entry: ${artifactPath}`);
		}
	}
}

/**
 * @param {readonly {path: string}[]} artifacts
 * @returns {void}
 */
function requireCompleteArtifactSet(artifacts) {
	const paths = new Set(artifacts.map((artifact) => artifact.path));
	for (const required of REQUIRED_RUN_RECORDS) {
		if (!paths.has(required)) {
			throw new Error(`Run is missing required record: ${required}`);
		}
	}
	if (paths.has(TERMINAL_MANIFEST_NAME)) {
		throw new Error("Terminal manifest cannot cover itself.");
	}
}

/**
 * @param {string} artifactPath
 * @returns {string}
 */
function normalizeArtifactPath(artifactPath) {
	if (
		typeof artifactPath !== "string"
		|| artifactPath === ""
		|| artifactPath.includes("\\")
		|| artifactPath.includes("\0")
		|| artifactPath.startsWith("/")
	) {
		throw new TypeError("Artifact path must be a portable relative path.");
	}
	const components = artifactPath.split("/");
	if (
		components.some(
			(component) =>
				component === ""
				|| component === "."
				|| component === "..",
		)
	) {
		throw new RangeError("Artifact path contains an unsafe component.");
	}
	if (
		components
			.slice(0, -1)
			.some((component) => NUMBERED_DIRECTORY_PATTERN.test(component))
	) {
		throw new RangeError("Nested numbered run directories are prohibited.");
	}
	return components.join("/");
}

/**
 * @param {string} runDirectory
 * @param {string} artifactPath
 * @returns {string}
 */
function resolveRunArtifactPath(runDirectory, artifactPath) {
	const normalized = normalizeArtifactPath(artifactPath);
	return resolveContainedPath(
		runDirectory,
		resolve(runDirectory, ...normalized.split("/")),
		"artifact",
	);
}

/**
 * @param {string} command
 * @returns {string}
 */
function normalizeCommand(command) {
	if (
		typeof command !== "string"
		|| command.trim() === ""
		|| command.includes("\0")
	) {
		throw new TypeError("Run command must be non-empty text.");
	}
	return ensureTrailingNewline(command);
}

/**
 * @param {string} value
 * @returns {string}
 */
function ensureTrailingNewline(value) {
	return value.endsWith("\n") ? value : `${value}\n`;
}

/**
 * @param {string} label
 * @param {unknown} value
 * @returns {void}
 */
function assertInitialRecord(label, value) {
	if (
		value === null
		|| typeof value !== "object"
		|| Array.isArray(value)
	) {
		throw new TypeError(`${label} must be a JSON object.`);
	}
	assertDurableJsonValue(value);
}

/**
 * @param {import("node:fs").BigIntStats} left
 * @param {import("node:fs").BigIntStats} right
 * @returns {boolean}
 */
function sameFileSnapshot(left, right) {
	return left.dev === right.dev
		&& left.ino === right.ino
		&& left.size === right.size
		&& left.mtimeNs === right.mtimeNs
		&& left.ctimeNs === right.ctimeNs;
}

/**
 * @param {string} path
 * @returns {string}
 */
function toPortableRelativePath(path) {
	return sep === "/" ? path : path.split(sep).join("/");
}

/**
 * @param {string} left
 * @param {string} right
 * @returns {number}
 */
function compareStrings(left, right) {
	return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
function delay(milliseconds) {
	return new Promise((resolvePromise) => {
		setTimeout(resolvePromise, milliseconds);
	});
}
