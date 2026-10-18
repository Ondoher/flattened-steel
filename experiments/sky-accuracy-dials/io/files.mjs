import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {
	appendFileSync,
	closeSync,
	existsSync,
	fsyncSync,
	lstatSync,
	mkdirSync,
	openSync,
	readFileSync,
	readdirSync,
	realpathSync,
	rmSync,
	statfsSync,
	unlinkSync,
	writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Repository identity is derived from this authored module, never the working directory. */
export const repositoryRoot = path.resolve(fileURLToPath(new URL('../../../', import.meta.url)));
/** The only generated-output boundary owned by this POC. */
export const outputRelative = 'tmp/experiments/sky-accuracy-dials';
const sourceRelative = 'experiments/sky-accuracy-dials';
const MiB = 1024 ** 2;
const minimumFreeBytes = 40 * 1024 ** 3;
// H75-H82:896MiB retained under owner's explicit AFK budget-decision authority.
const retainedLimit = 896 * MiB;
const scratchLimit = 1024 * MiB;

/** Hash exact bytes. @param {Uint8Array|string} bytes @returns {string} */
export function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

/** Reject links along an absolute path, including its existing ancestors.
 * @param {string} absolute @param {boolean} [mustExist] @returns {string}
 */
export function checkedAbsolute(absolute, mustExist = true) {
	assert.equal(path.resolve(absolute), absolute, 'Path must already be absolute and normalized.');
	let cursor = path.parse(absolute).root;
	for (const component of absolute.slice(cursor.length).split(path.sep).filter(Boolean)) {
		cursor = path.join(cursor, component);
		if (!existsSync(cursor)) {
			assert.ok(!mustExist, `Missing path: ${cursor}`);
			continue;
		}
		assert.ok(!lstatSync(cursor).isSymbolicLink(), `Links and junctions are forbidden: ${cursor}`);
		assert.equal(realpathSync.native(cursor).toLowerCase(), cursor.toLowerCase(), `Noncanonical path: ${cursor}`);
	}
	return absolute;
}

/** Resolve a normalized repository-relative path under an explicit boundary.
 * @param {string} relative @param {string} [boundary] @param {boolean} [mustExist] @returns {string}
 */
export function resolveRepository(relative, boundary = '', mustExist = true) {
	assert.ok(relative && !path.isAbsolute(relative) && !relative.includes('\\'));
	assert.ok(relative.split('/').every((part) => part && part !== '.' && part !== '..'));
	assert.ok(
		!boundary || relative === boundary || relative.startsWith(`${boundary}/`),
		'Path escapes declared boundary.',
	);
	const absolute = path.resolve(repositoryRoot, relative);
	assert.ok(absolute.toLowerCase().startsWith(`${repositoryRoot.toLowerCase()}${path.sep}`));
	return checkedAbsolute(absolute, mustExist);
}

checkedAbsolute(repositoryRoot);
assert.ok(lstatSync(resolveRepository('AGENTS.md')).isFile());
assert.ok(lstatSync(resolveRepository('package.json')).isFile());

/** Read an ordinary bounded file and optionally authenticate it.
 * @param {string} relative @param {string|DialFileIdentity} [expected] @param {number} [limit] @returns {Buffer}
 */
export function readRepository(relative, expected, limit = 16 * MiB) {
	const absolute = resolveRepository(relative);
	const facts = lstatSync(absolute);
	assert.ok(facts.isFile() && facts.size <= limit, `Input is not a bounded ordinary file: ${relative}`);
	const bytes = readFileSync(absolute);
	assert.equal(bytes.length, facts.size);
	if (expected) {
		assert.equal(
			sha256(bytes),
			typeof expected === 'string' ? expected : expected.sha256,
			`Hash mismatch: ${relative}`,
		);
		if (typeof expected !== 'string') assert.equal(bytes.length, expected.byteLength);
	}
	return bytes;
}

/** Identify bounded bytes already read from a repository file.
 * @param {string} relative @param {Uint8Array} [bytes] @returns {DialFileIdentity}
 */
export function identity(relative, bytes = readRepository(relative)) {
	return {path: relative, byteLength: bytes.length, sha256: sha256(bytes)};
}

/** Enumerate an ordinary tree, rejecting every encountered link.
 * @param {string} relative @returns {string[]}
 */
export function listFiles(relative) {
	const absolute = resolveRepository(relative);
	const result = [];
	for (const entry of readdirSync(absolute, {withFileTypes: true})) {
		const next = `${relative}/${entry.name}`;
		const facts = lstatSync(resolveRepository(next));
		if (facts.isDirectory()) result.push(...listFiles(next));
		else {
			assert.ok(facts.isFile());
			result.push(next);
		}
	}
	return result.sort();
}

/** Measure a changing scratch tree without following links.
 * @param {string} absolute @returns {number}
 */
function treeBytes(absolute) {
	checkedAbsolute(absolute);
	return scanTreeBytes(absolute);
}

/** Traverse an already checked root, rejecting every child link before descending.
 * @param {string} absolute @returns {number}
 */
function scanTreeBytes(absolute) {
	let total = 0;
	for (const entry of readdirSync(absolute, {withFileTypes: true})) {
		const next = path.join(absolute, entry.name);
		try {
			const facts = lstatSync(next);
			assert.ok(!facts.isSymbolicLink(), `Linked output: ${next}`);
			total += facts.isDirectory() ? scanTreeBytes(next) : facts.size;
		} catch (error) {
			if (error.code !== 'ENOENT') throw error;
		}
	}
	return total;
}

/** Current total retained/scratch/free bytes. @returns {DialStorage} */
export function storage() {
	const root = resolveRepository(outputRelative);
	const runs = path.join(root, 'runs'),
		scratch = path.join(root, 'scratch');
	const facts = statfsSync(root, {bigint: true});
	return {
		freeBytes: Number(facts.bavail * facts.bsize),
		retainedBytes: existsSync(runs) ? treeBytes(runs) : 0,
		scratchBytes: existsSync(scratch) ? treeBytes(scratch) : 0,
	};
}

/** All locally authored files and exact runtime tool identity, captured once per run.
 * @returns {DialFileIdentity[]}
 */
export function sourceIdentities() {
	return listFiles(sourceRelative).map((name) => identity(name));
}

/** Reserve a sequence under a short exclusive lock shared by all allocator processes.
 * Existing evidence, including historical shared prefixes, is never changed.
 * @param {string} name @returns {string}
 */
function reserveRunDirectory(name) {
	const lock = resolveRepository(`${outputRelative}/scratch/run-allocation.lock`, `${outputRelative}/scratch`, false);
	const token = JSON.stringify({pid: process.pid, token: randomUUID()});
	const deadline = Date.now() + 5000;
	let descriptor;
	while (descriptor === undefined) {
		try { descriptor = openSync(lock, 'wx'); }
		catch (error) {
			if (error.code !== 'EEXIST' || Date.now() >= deadline) throw error;
			Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
		}
	}
	try {
		writeFileSync(descriptor, token); fsyncSync(descriptor);
		let maximum = -1;
		for (const entry of readdirSync(resolveRepository(`${outputRelative}/runs`))) {
			assert.match(entry, /^\d{5}-[a-z0-9]+(?:-[a-z0-9]+)*$/u, 'Malformed run entry.');
			assert.ok(entry.length <= 22);
			assert.ok(lstatSync(resolveRepository(`${outputRelative}/runs/${entry}`)).isDirectory());
			maximum = Math.max(maximum, Number(entry.slice(0, 5)));
		}
		assert.ok(maximum < 99999);
		const runPath = `${outputRelative}/runs/${String(maximum + 1).padStart(5, '0')}-${name}`;
		mkdirSync(resolveRepository(runPath, `${outputRelative}/runs`, false));
		return runPath;
	} finally {
		closeSync(descriptor);
		assert.equal(readFileSync(checkedAbsolute(lock), 'utf8'), token, 'Allocator lock ownership changed.');
		unlinkSync(checkedAbsolute(lock));
	}
}

/** Allocate a new immutable evidence run and its separately disposable scratch.
 * @param {string} name @param {DialDerivation} recipe @returns {DialRun}
 */
export function createRun(name, recipe) {
	assert.match(name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
	assert.ok(name.length <= 16);
	const initial = storage();
	assert.ok(
		initial.freeBytes >= minimumFreeBytes &&
			initial.retainedBytes < retainedLimit - 2 * MiB &&
			initial.scratchBytes < scratchLimit,
		'Storage budget prevents starting another run.',
	);
	for (const directory of [`${outputRelative}/runs`, `${outputRelative}/scratch`])
		mkdirSync(resolveRepository(directory, outputRelative, false), {recursive: true});
	const runPath = reserveRunDirectory(name);
	const scratchRelative = `${outputRelative}/scratch/${randomUUID()}`;
	const scratchPath = resolveRepository(scratchRelative, `${outputRelative}/scratch`, false);
	mkdirSync(scratchPath);
	const ownership = {schemaId: 'sky-accuracy-scratch-owner-v1', owner: runPath, recipe};
	writeFileSync(path.join(scratchPath, 'owner.json'), `${JSON.stringify(ownership)}\n`, {flag: 'wx'});
	const ownershipHash = sha256(readFileSync(path.join(scratchPath, 'owner.json')));
	const sources = sourceIdentities();
	const artifacts = /** @type {DialArtifact[]} */ ([]);
	let closed = false,
		highWaterBytes = 0,
		cleanupRecord = /** @type {DialCleanup|null} */ (null);
	let lastPhase = 'initializing',
		lastMessage = 'Run allocated.',
		lastProgressAt = Date.now(),
		heartbeatFailure = null;
	const progressPath = resolveRepository(`${runPath}/progress.jsonl`, runPath, false);
	const progressFd = openSync(progressPath, 'wx');
	/** @param {string} phase @param {string} message @param {number} [completed] @param {number} [total] @param {DialRunState} [state] */
	function event(phase, message, completed, total, state) {
		assert.ok(!closed, 'Run is already terminal.');
		lastPhase = phase;
		lastMessage = message;
		appendFileSync(
			progressFd,
			`${JSON.stringify({timestamp: new Date().toISOString(), phase, message, ...(completed === undefined ? {} : {completed}), ...(total === undefined ? {} : {total}), ...(state ? {state} : {})})}\n`,
		);
		fsyncSync(progressFd);
		lastProgressAt = Date.now();
	}
	/** Flush during synchronous work as well as from the event-loop timer. */
	function flushHeartbeat() {
		if (Date.now() - lastProgressAt >= 20000) event(lastPhase, lastMessage);
	}
	/** @returns {DialStorage} */
	function guard() {
		if (heartbeatFailure) throw heartbeatFailure;
		flushHeartbeat();
		const current = storage();
		if (!cleanupRecord) highWaterBytes = Math.max(highWaterBytes, treeBytes(scratchPath));
		assert.ok(current.freeBytes >= minimumFreeBytes, 'Free space fell below 40 GiB.');
		assert.ok(current.retainedBytes < retainedLimit - 2 * MiB, 'Retained evidence budget exhausted.');
		assert.ok(current.scratchBytes < scratchLimit, 'Scratch budget exhausted.');
		flushHeartbeat();
		return current;
	}
	/** @param {string} file @param {unknown} value @param {DialDerivation} [derivation] @returns {DialFileIdentity} */
	function write(file, value, derivation = recipe) {
		assert.ok(!closed);
		const current = guard();
		assert.ok(file !== 'sealed.json' && file !== 'progress.jsonl');
		const bytes =
			Buffer.isBuffer(value) || value instanceof Uint8Array
				? Buffer.from(value)
				: Buffer.from(typeof value === 'string' ? value : `${JSON.stringify(value)}\n`);
		assert.ok(current.retainedBytes + bytes.length < retainedLimit - 2 * MiB);
		const relative = `${runPath}/${file}`;
		const absolute = resolveRepository(relative, runPath, false);
		mkdirSync(path.dirname(absolute), {recursive: true});
		checkedAbsolute(path.dirname(absolute));
		writeFileSync(absolute, bytes, {flag: 'wx'});
		const record = identity(relative, bytes);
		artifacts.push({...record, derivation});
		return record;
	}
	/** @returns {DialCleanup} */
	function cleanup() {
		assert.ok(!closed);
		if (cleanupRecord) return cleanupRecord;
		assert.equal(resolveRepository(scratchRelative, `${outputRelative}/scratch`), scratchPath);
		assert.ok(scratchPath.startsWith(`${resolveRepository(`${outputRelative}/scratch`)}${path.sep}`));
		assert.equal(sha256(readFileSync(checkedAbsolute(path.join(scratchPath, 'owner.json')))), ownershipHash);
		highWaterBytes = Math.max(highWaterBytes, treeBytes(scratchPath));
		// treeBytes checks the complete tree; the owning browser must already be stopped.
		rmSync(scratchPath, {recursive: true, force: false});
		cleanupRecord = {path: scratchRelative, owner: runPath, highWaterBytes, absent: !existsSync(scratchPath)};
		assert.ok(cleanupRecord.absent);
		return cleanupRecord;
	}
	const heartbeat = setInterval(() => {
		try {
			guard();
			event(lastPhase, `Heartbeat: ${lastMessage}`);
		} catch (error) {
			heartbeatFailure ??= error;
		}
	}, 25000);
	heartbeat.unref();
	event('initializing', 'Run allocated with bounded storage and exclusive output.');
	write('definition.json', {
		schemaId: 'sky-accuracy-run-v1',
		run: runPath,
		command: process.argv,
		node: {version: process.version, executable: checkedAbsolute(process.execPath)},
		sources,
		recipe,
		budgets: {minimumFreeBytes, retainedLimit, scratchLimit},
		initialStorage: initial,
	});
	return {
		path: runPath,
		scratchPath,
		write,
		progress: event,
		guard,
		cleanup,
		finish(state, result) {
			assert.ok(!closed);
			assert.ok(['accepted', 'rejected', 'failed', 'interrupted'].includes(state));
			clearInterval(heartbeat);
			if (!cleanupRecord) cleanup();
			const sourceFailures = [];
			for (const source of sources) {
				try {
					readRepository(source.path, source);
				} catch (error) {
					sourceFailures.push({path: source.path, message: String(error)});
				}
			}
			if (sourceFailures.length || heartbeatFailure) state = 'failed';
			for (const artifact of artifacts) readRepository(artifact.path, artifact, retainedLimit);
			event('terminal', `Run ${state}.`, undefined, undefined, state);
			closeSync(progressFd);
			artifacts.push({
				...identity(`${runPath}/progress.jsonl`),
				derivation: {
					parents: recipe.parents,
					operation: 'Append and flush execution phase events and 25-second heartbeats.',
				},
			});
			const seal = {
				schemaId: 'sky-accuracy-run-seal-v1',
				run: runPath,
				state,
				finishedAt: new Date().toISOString(),
				result,
				recipe,
				sources,
				sourceFailures,
				artifacts,
				cleanup: cleanupRecord,
				storage: storage(),
				heartbeatFailure: heartbeatFailure ? String(heartbeatFailure) : null,
			};
			// Compact only new records; parsed values and prior immutable records are unchanged.
			const bytes = Buffer.from(`${JSON.stringify(seal)}\n`);
			const sealRelative = `${runPath}/sealed.json`;
			writeFileSync(resolveRepository(sealRelative, runPath, false), bytes, {flag: 'wx'});
			closed = true;
			return identity(sealRelative, bytes);
		},
	};
}

/** Verify a terminal run without mutating it.
 * @param {string} runPath @returns {DialFileIdentity}
 */
export function verifyRun(runPath) {
	resolveRepository(runPath, `${outputRelative}/runs`);
	const sealPath = `${runPath}/sealed.json`,
		bytes = readRepository(sealPath);
	const seal = JSON.parse(bytes.toString());
	assert.equal(seal.schemaId, 'sky-accuracy-run-seal-v1');
	assert.equal(seal.run, runPath);
	assert.ok(['accepted', 'rejected', 'failed', 'interrupted'].includes(seal.state));
	if (seal.state === 'accepted') assert.ok(!seal.heartbeatFailure && !seal.sourceFailures?.length);
	assert.ok(seal.cleanup.absent && seal.cleanup.owner === runPath);
	const inventory = new Set([sealPath]);
	for (const artifact of seal.artifacts) {
		resolveRepository(artifact.path, runPath);
		assert.ok(
			!inventory.has(artifact.path) &&
				artifact.derivation.operation &&
				Array.isArray(artifact.derivation.parents),
		);
		readRepository(artifact.path, artifact, retainedLimit);
		inventory.add(artifact.path);
	}
	assert.deepEqual(listFiles(runPath), [...inventory].sort());
	const events = readRepository(`${runPath}/progress.jsonl`)
		.toString()
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line));
	assert.equal(events.at(-1).state, seal.state);
	for (let index = 1; index < events.length; index++)
		assert.ok(
			Date.parse(events[index].timestamp) - Date.parse(events[index - 1].timestamp) <= 35000,
			'Progress heartbeat gap exceeds contract.',
		);
	return identity(sealPath, bytes);
}
