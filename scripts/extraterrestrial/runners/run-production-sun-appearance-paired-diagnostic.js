#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {availableParallelism, freemem, totalmem} from 'node:os';
import path from 'node:path';

import {assertExistingRealPathContained, assertNoReparseEntries} from '../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	createSelectedFileInventory,
	sha256,
	sha256File,
} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	assertLexicallyContained,
	assertRepositoryIdentity,
	isPathContained,
	pathComparisonKey,
} from '../harness/lib/roots.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';

const COMMAND = 'node scripts/extraterrestrial/runners/' + 'run-production-sun-appearance-paired-diagnostic.js';
const PROOF_ID = 'production-sun-appearance-paired-diagnostic-v1';
const SNAPSHOT_ROOT = path.join(EXPERIMENT_ROOT, 'production-snapshots', 'sun-appearance-step-5-v1');
const SNAPSHOT_MANIFEST_PATH = path.join(SNAPSHOT_ROOT, 'manifest.json');
const HARNESS_PATH = path.join(EXPERIMENT_ROOT, 'harness', 'production-sun-appearance-browser-entry.js');
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'production-sun-appearance-paired-v1.json');
const CHROME_CANDIDATES = Object.freeze(
	[
		process.env.PRODUCTION_SUN_APPEARANCE_CHROME,
		'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
		'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
	].filter(Boolean),
);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const RESULT_BODY_LIMIT_BYTES = 256 * 1024 * 1024;
const PROGRESS_BODY_LIMIT_BYTES = 16 * 1024;
const PROGRESS_RECEIPT_LIMIT_PER_SHARD = 3;
const BROWSER_LOG_LIMIT_BYTES = 16 * 1024 * 1024;
const RECORDED_SMALLEST_CONDITION_DURATION_MILLISECONDS = 1_723_273;
const RECORDED_SMALLEST_CONDITION_SAMPLE_COUNT = 10;
const LARGEST_CONDITION_SAMPLE_COUNT = 16;
const PROJECTED_LARGEST_CONDITION_DURATION_MILLISECONDS = Math.ceil(
	(RECORDED_SMALLEST_CONDITION_DURATION_MILLISECONDS * LARGEST_CONDITION_SAMPLE_COUNT) /
		RECORDED_SMALLEST_CONDITION_SAMPLE_COUNT,
);
const SHARD_COMPLETION_TIMEOUT_MILLISECONDS = 75 * 60 * 1000;
const SHARD_COMPLETION_TIMEOUT_BASIS =
	'Run 000239 measured 1,723,273 ms for the 10-sample solar-noon condition. ' +
	`Linear projection gives ${PROJECTED_LARGEST_CONDITION_DURATION_MILLISECONDS} ms for a 16-sample condition; ` +
	'the 75-minute per-shard wall bound adds approximately 63% margin to that projection.';
const MAXIMUM_SHARD_CONCURRENCY = 4;
const LOGICAL_CPUS_PER_SHARD = 4;
const MEMORY_BYTES_PER_SHARD = 6 * 1024 ** 3;
const EXPECTED_CONDITION_COUNT = 8;
const EXPECTED_UNIQUE_SAMPLE_COUNT = 104;
const EXPECTED_LOGICAL_PAIR_COUNT = 144;
const EXECUTED_CONTROL_PATHS = Object.freeze([
	'fixtures/production-sun-appearance-paired-v1.json',
	'harness/production-sun-appearance-browser-entry.js',
	'package-lock.json',
	'package.json',
	'runners/run-production-sun-appearance-paired-diagnostic.js',
]);
const THREE_RUNTIME_PATHS = Object.freeze([
	'three/package.json',
	'three/build/three.core.js',
	'three/build/three.module.js',
	'three/examples/jsm/postprocessing/EffectComposer.js',
	'three/examples/jsm/postprocessing/MaskPass.js',
	'three/examples/jsm/postprocessing/Pass.js',
	'three/examples/jsm/postprocessing/RenderPass.js',
	'three/examples/jsm/postprocessing/ShaderPass.js',
	'three/examples/jsm/shaders/CopyShader.js',
]);
const SERVED_CONTROL_PATHS = Object.freeze({
	'/harness/': new Set(['production-sun-appearance-browser-entry.js']),
	'/fixtures/': new Set(['production-sun-appearance-paired-v1.json']),
	'/node_modules/': new Set(THREE_RUNTIME_PATHS),
});

function compareStrings(left, right) {
	return left < right ? -1 : left > right ? 1 : 0;
}

function serializeError(error) {
	return {
		name: error?.name ?? 'Error',
		message: error?.message ?? String(error),
		stack: error?.stack ?? null,
	};
}

function requireCondition(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

function selectShardConcurrency(conditionCount) {
	const logicalCpuCount = availableParallelism();
	const totalMemoryBytes = totalmem();
	const availableMemoryBytes = freemem();
	const logicalCpuBound = Math.max(1, Math.floor(logicalCpuCount / LOGICAL_CPUS_PER_SHARD));
	const memoryBound = Math.max(1, Math.floor(availableMemoryBytes / MEMORY_BYTES_PER_SHARD));
	const selectedConcurrency = Math.min(conditionCount, MAXIMUM_SHARD_CONCURRENCY, logicalCpuBound, memoryBound);
	return Object.freeze({
		logicalCpuCount,
		totalMemoryBytes,
		availableMemoryBytes,
		logicalCpusPerShard: LOGICAL_CPUS_PER_SHARD,
		memoryBytesPerShard: MEMORY_BYTES_PER_SHARD,
		logicalCpuBound,
		memoryBound,
		maximumConcurrency: MAXIMUM_SHARD_CONCURRENCY,
		selectedConcurrency,
		selectionPolicy:
			'min(condition count, cap 4, floor(available logical CPUs / 4), floor(available memory / 6 GiB))',
	});
}

function createConditionShards(fixture) {
	const ordered = [
		...(fixture.distant?.conditions ?? []).map((condition) => ({family: 'distant', condition})),
		...(fixture.flat?.conditions ?? []).map((condition) => ({family: 'flat', condition})),
	];
	requireCondition(
		fixture.id === 'production-sun-appearance-paired-v1',
		'Condition sharding requires the frozen paired fixture identity.',
	);
	requireCondition(
		ordered.length === EXPECTED_CONDITION_COUNT,
		`Condition sharding requires exactly ${EXPECTED_CONDITION_COUNT} fixture conditions.`,
	);
	requireCondition(
		expectedUniqueSampleCount(fixture) === EXPECTED_UNIQUE_SAMPLE_COUNT,
		`Condition sharding requires exactly ${EXPECTED_UNIQUE_SAMPLE_COUNT} unique samples.`,
	);
	requireCondition(
		fixture.sampling?.expectedCounts?.totalPixelPairs === EXPECTED_LOGICAL_PAIR_COUNT,
		`Condition sharding requires exactly ${EXPECTED_LOGICAL_PAIR_COUNT} logical disk/sky pairs.`,
	);
	const identities = new Set();
	return ordered.map(({family, condition}, index) => {
		requireCondition(
			typeof condition.id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(condition.id),
			'Condition shard id source must be kebab-case.',
		);
		const identity = `${family}:${condition.id}`;
		requireCondition(!identities.has(identity), `Duplicate fixture condition identity: ${identity}.`);
		identities.add(identity);
		return Object.freeze({
			id: `condition-${String(index + 1).padStart(2, '0')}-${family}-${condition.id}`,
			family,
			conditionId: condition.id,
			conditionIndex: index + 1,
			conditionCount: ordered.length,
		});
	});
}

function shardIdentityMatches(actual, expected) {
	return (
		actual?.id === expected.id &&
		actual?.family === expected.family &&
		actual?.conditionId === expected.conditionId &&
		actual?.conditionIndex === expected.conditionIndex &&
		actual?.conditionCount === expected.conditionCount
	);
}

function requireShardIdentity(actual, expected, label) {
	requireCondition(shardIdentityMatches(actual, expected), `${label} shard identity does not match its allocation.`);
}

async function findChrome() {
	for (const candidate of CHROME_CANDIDATES) {
		try {
			const stats = await lstat(candidate);
			if (!stats.isSymbolicLink() && stats.isFile()) {
				const canonical = await realpath(candidate);
				if (pathComparisonKey(canonical) === pathComparisonKey(candidate)) {
					return canonical;
				}
			}
		} catch (error) {
			if (error?.code !== 'ENOENT') {
				throw error;
			}
		}
	}
	throw new Error(
		'No plain installed Chrome executable was found. Set ' +
			'PRODUCTION_SUN_APPEARANCE_CHROME to an exact executable path.',
	);
}

function validateSnapshotManifest(manifest) {
	requireCondition(
		manifest?.schemaId === 'production-sun-appearance-snapshot-v1',
		'Production appearance snapshot manifest schema is invalid.',
	);
	requireCondition(
		manifest.snapshotRoot === 'scripts/extraterrestrial/production-snapshots/' + 'sun-appearance-step-5-v1',
		'Production appearance snapshot root identity is invalid.',
	);
	requireCondition(
		manifest.manifestPath === `${manifest.snapshotRoot}/manifest.json`,
		'Production appearance snapshot manifest path identity is invalid.',
	);
	requireCondition(
		manifest.source?.inventory?.aggregateSha256 === manifest.sealedInventory?.aggregateSha256,
		'Source and sealed snapshot aggregate hashes disagree.',
	);
	requireCondition(
		Array.isArray(manifest.sealedInventory?.files) && manifest.sealedInventory.files.length > 0,
		'Production appearance snapshot inventory is empty.',
	);
}

async function verifySnapshot() {
	await assertExistingRealPathContained(EXPERIMENT_ROOT, SNAPSHOT_ROOT, 'Production appearance snapshot');
	await assertNoReparseEntries(SNAPSHOT_ROOT, 'Production appearance snapshot');
	await assertExistingRealPathContained(
		SNAPSHOT_ROOT,
		SNAPSHOT_MANIFEST_PATH,
		'Production appearance snapshot manifest',
	);
	const manifest = JSON.parse(await readFile(SNAPSHOT_MANIFEST_PATH, 'utf8'));
	validateSnapshotManifest(manifest);
	const selected = await createSelectedFileInventory(
		SNAPSHOT_ROOT,
		manifest.sealedInventory.files.map((entry) => entry.path),
	);
	assertFileInventoriesEqual(manifest.sealedInventory, selected, 'Sealed production appearance snapshot');
	const complete = await createFileInventory(SNAPSHOT_ROOT, {
		include: (relativePath) => relativePath !== 'manifest.json',
	});
	assertFileInventoriesEqual(manifest.sealedInventory, complete, 'Complete production appearance snapshot');
	return Object.freeze({
		manifest,
		manifestSha256: await sha256File(SNAPSHOT_MANIFEST_PATH),
		inventory: complete,
	});
}

async function assertServedRoot(root, label) {
	await assertExistingRealPathContained(EXPERIMENT_ROOT, root, label);
	const stats = await lstat(root);
	requireCondition(stats.isDirectory(), `${label} is not a directory.`);
	return realpath(root);
}

function contentType(filePath) {
	switch (path.extname(filePath).toLowerCase()) {
		case '.html':
			return 'text/html; charset=utf-8';
		case '.js':
			return 'text/javascript; charset=utf-8';
		case '.json':
			return 'application/json; charset=utf-8';
		case '.glsl':
			return 'text/plain; charset=utf-8';
		case '.png':
			return 'image/png';
		default:
			return 'application/octet-stream';
	}
}

function browserIndex(resultNonce, executionShard) {
	return `<!doctype html>
<meta charset="utf-8">
<title>Production Sun appearance paired diagnostic</title>
<pre id="result">pending</pre>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<script type="module">
const target = document.querySelector('#result');
const resultNonce = ${JSON.stringify(resultNonce)};
const executionShard = ${JSON.stringify(executionShard)};
let progressSequence = 0;
const postJson = async (pathname, value) => {
	const response = await fetch(pathname, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'x-sun-appearance-result-nonce': resultNonce,
			'x-sun-appearance-shard-id': executionShard.id,
		},
		body: JSON.stringify(value),
		cache: 'no-store',
	});
	if (!response.ok) throw new Error(pathname + ' submission failed with HTTP ' + response.status + '.');
};
const submit = async (value) => {
	await postJson('/result', value);
	target.textContent = 'submitted';
};
const reportProgress = async (event) => {
	progressSequence += 1;
	await postJson('/progress', {
		schemaVersion: 'production-sun-appearance-browser-progress-v1',
		sequence: progressSequence,
		executionShard,
		...event,
	});
};
try {
	const { runProductionSunAppearanceDiagnostic } = await import('/harness/production-sun-appearance-browser-entry.js');
	const fixture = await (await fetch('/fixtures/production-sun-appearance-paired-v1.json', { cache: 'no-store' })).json();
	await submit(await runProductionSunAppearanceDiagnostic(fixture, reportProgress, executionShard));
} catch (error) {
	await submit({ executionShard, error: { name: error.name, message: error.message, stack: error.stack } });
}
</script>`;
}

function isLoopbackAddress(value) {
	return value === '127.0.0.1' || value === '::1' || value === '::ffff:127.0.0.1';
}

function requireProgressDuration(value, label) {
	requireCondition(
		Number.isFinite(value) && value >= 0 && value <= SHARD_COMPLETION_TIMEOUT_MILLISECONDS,
		`${label} is outside the bounded browser execution interval.`,
	);
}

function validateProgressEvent(value, receipts, expectedShard) {
	requireCondition(value && typeof value === 'object' && !Array.isArray(value), 'Progress body must be one object.');
	requireCondition(
		value.schemaVersion === 'production-sun-appearance-browser-progress-v1',
		'Progress schema is invalid.',
	);
	requireCondition(
		Number.isSafeInteger(value.sequence) && value.sequence === receipts.length + 1,
		'Progress sequence is not contiguous.',
	);
	requireShardIdentity(value.executionShard, expectedShard, 'Progress event');
	const previous = receipts.at(-1)?.event ?? null;
	if (value.stage === 'output-contract-complete') {
		requireCondition(value.sequence === 1, 'Output-contract completion must be the first progress event.');
		requireProgressDuration(value.durationMilliseconds, 'Output-contract duration');
		return;
	}
	requireCondition(
		value.stage === 'condition-start' || value.stage === 'condition-complete',
		'Progress stage is unsupported.',
	);
	requireCondition(
		Number.isSafeInteger(value.conditionIndex) && value.conditionIndex === expectedShard.conditionIndex,
		'Progress condition index is invalid.',
	);
	requireCondition(
		Number.isSafeInteger(value.conditionCount) && value.conditionCount === expectedShard.conditionCount,
		'Progress condition count is invalid.',
	);
	requireCondition(value.family === expectedShard.family, 'Progress family is invalid.');
	requireCondition(value.conditionId === expectedShard.conditionId, 'Progress condition id is invalid.');
	if (value.stage === 'condition-start') {
		requireCondition(previous?.stage === 'output-contract-complete', 'Condition-start progress is out of order.');
		return;
	}
	requireCondition(
		previous?.stage === 'condition-start' &&
			value.conditionIndex === previous.conditionIndex &&
			value.conditionCount === previous.conditionCount &&
			value.family === previous.family &&
			value.conditionId === previous.conditionId,
		'Condition-complete progress does not match its start.',
	);
	requireProgressDuration(value.totalDurationMilliseconds, 'Condition total duration');
	requireProgressDuration(value.gpuSetupAndCacheBuildMilliseconds, 'GPU setup/cache-build duration');
	requireProgressDuration(value.cpuScatteringCacheBuildMilliseconds, 'CPU scattering-cache-build duration');
	requireProgressDuration(value.sampleCaptureMilliseconds, 'Sample-capture duration');
}

function progressLogLine(value) {
	const prefix = `[sun-appearance:${value.executionShard.id}]`;
	if (value.stage === 'output-contract-complete') {
		return `${prefix} output-contract complete (${value.durationMilliseconds.toFixed(1)} ms)\n`;
	}
	const identity =
		`condition ${value.conditionIndex}/${value.conditionCount} ` + `${value.family}/${value.conditionId}`;
	if (value.stage === 'condition-start') {
		return `${prefix} ${identity} start\n`;
	}
	return (
		`${prefix} ${identity} complete ` +
		`(total ${value.totalDurationMilliseconds.toFixed(1)} ms; ` +
		`GPU setup/cache ${value.gpuSetupAndCacheBuildMilliseconds.toFixed(1)} ms; ` +
		`CPU cache ${value.cpuScatteringCacheBuildMilliseconds.toFixed(1)} ms; ` +
		`samples ${value.sampleCaptureMilliseconds.toFixed(1)} ms)\n`
	);
}

async function startServer(indexHtml, resultNonce, expectedShard) {
	const roots = new Map([
		['/harness/', path.join(EXPERIMENT_ROOT, 'harness')],
		['/snapshot/', SNAPSHOT_ROOT],
		['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')],
		['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT],
	]);
	const canonicalRoots = new Map();
	for (const [prefix, root] of roots) {
		canonicalRoots.set(prefix, await assertServedRoot(root, `HTTP root ${prefix}`));
	}
	const servedFiles = new Map();
	const progressReceipts = [];
	let submissionStarted = false;
	let resolveSubmission;
	const resultPromise = new Promise((resolve) => {
		resolveSubmission = resolve;
	});
	const recordServedFile = (record) => {
		const prior = servedFiles.get(record.requestPath);
		if (prior && (prior.sha256 !== record.sha256 || prior.byteLength !== record.byteLength)) {
			throw new Error(`Served file bytes changed during execution: ${record.requestPath}`);
		}
		servedFiles.set(record.requestPath, record);
	};
	const server = createServer(async (request, response) => {
		try {
			requireCondition(isLoopbackAddress(request.socket.remoteAddress), 'Browser request is not loopback-local.');
			const url = new URL(request.url ?? '/', 'http://127.0.0.1');
			if (url.pathname === '/progress') {
				requireCondition(request.method === 'POST', 'Progress endpoint requires POST.');
				requireCondition(
					request.headers['x-sun-appearance-result-nonce'] === resultNonce,
					'Progress endpoint nonce is invalid.',
				);
				requireCondition(
					request.headers['x-sun-appearance-shard-id'] === expectedShard.id,
					'Progress endpoint shard identity is invalid.',
				);
				requireCondition(!submissionStarted, 'Progress endpoint is closed after result submission starts.');
				requireCondition(
					progressReceipts.length < PROGRESS_RECEIPT_LIMIT_PER_SHARD,
					'Progress receipt limit reached.',
				);
				const contentTypeHeader = String(request.headers['content-type'] ?? '');
				requireCondition(
					/^application\/json(?:\s*;|$)/iu.test(contentTypeHeader),
					'Progress endpoint requires application/json.',
				);
				const declaredLength = Number(request.headers['content-length'] ?? 0);
				requireCondition(
					Number.isFinite(declaredLength) &&
						declaredLength >= 0 &&
						declaredLength <= PROGRESS_BODY_LIMIT_BYTES,
					'Progress submission exceeds its declared byte bound.',
				);
				const chunks = [];
				let byteLength = 0;
				for await (const chunk of request) {
					byteLength += chunk.byteLength;
					if (byteLength > PROGRESS_BODY_LIMIT_BYTES) {
						throw new RangeError('Progress submission exceeds its streamed byte bound.');
					}
					chunks.push(chunk);
				}
				if (request.headers['content-length'] !== undefined) {
					requireCondition(
						byteLength === declaredLength,
						'Progress submission byte count differs from Content-Length.',
					);
				}
				const body = Buffer.concat(chunks, byteLength);
				const value = JSON.parse(body.toString('utf8'));
				validateProgressEvent(value, progressReceipts, expectedShard);
				const receipt = {
					receivedAt: new Date().toISOString(),
					byteLength,
					sha256: sha256(body),
					event: value,
				};
				progressReceipts.push(receipt);
				response.writeHead(204, {'cache-control': 'no-store'});
				response.end();
				process.stdout.write(progressLogLine(value));
				return;
			}
			if (url.pathname === '/result') {
				requireCondition(request.method === 'POST', 'Result endpoint requires POST.');
				requireCondition(
					request.headers['x-sun-appearance-result-nonce'] === resultNonce,
					'Result endpoint nonce is invalid.',
				);
				requireCondition(
					request.headers['x-sun-appearance-shard-id'] === expectedShard.id,
					'Result endpoint shard identity is invalid.',
				);
				requireCondition(!submissionStarted, 'Result endpoint accepts exactly one submission.');
				const contentTypeHeader = String(request.headers['content-type'] ?? '');
				requireCondition(
					/^application\/json(?:\s*;|$)/iu.test(contentTypeHeader),
					'Result endpoint requires application/json.',
				);
				const declaredLength = Number(request.headers['content-length'] ?? 0);
				requireCondition(
					Number.isFinite(declaredLength) && declaredLength >= 0 && declaredLength <= RESULT_BODY_LIMIT_BYTES,
					'Result submission exceeds its declared byte bound.',
				);
				submissionStarted = true;
				const chunks = [];
				let byteLength = 0;
				try {
					for await (const chunk of request) {
						byteLength += chunk.byteLength;
						if (byteLength > RESULT_BODY_LIMIT_BYTES) {
							throw new RangeError('Result submission exceeds its streamed byte bound.');
						}
						chunks.push(chunk);
					}
					if (request.headers['content-length'] !== undefined) {
						requireCondition(
							byteLength === declaredLength,
							'Result submission byte count differs from Content-Length.',
						);
					}
					const body = Buffer.concat(chunks, byteLength);
					const value = JSON.parse(body.toString('utf8'));
					requireCondition(
						value && typeof value === 'object' && !Array.isArray(value),
						'Result submission must contain one JSON object.',
					);
					requireShardIdentity(value.executionShard, expectedShard, 'Result submission');
					const receipt = {
						executionShard: expectedShard,
						receivedAt: new Date().toISOString(),
						byteLength,
						sha256: sha256(body),
					};
					response.writeHead(204, {'cache-control': 'no-store'});
					response.end();
					resolveSubmission({accepted: true, value, receipt});
				} catch (error) {
					response.writeHead(error instanceof RangeError ? 413 : 400, {
						'cache-control': 'no-store',
						'content-type': 'text/plain; charset=utf-8',
					});
					response.end(error?.message ?? String(error));
					resolveSubmission({accepted: false, error: serializeError(error)});
				}
				return;
			}
			if (url.pathname === '/') {
				requireCondition(request.method === 'GET', 'Browser index requires GET.');
				const body = Buffer.from(indexHtml, 'utf8');
				recordServedFile({
					requestPath: '/',
					root: 'generated-browser-index',
					relativePath: 'index.html',
					byteLength: body.byteLength,
					sha256: sha256(body),
				});
				response.writeHead(200, {
					'cache-control': 'no-store',
					'content-type': 'text/html; charset=utf-8',
				});
				response.end(body);
				return;
			}
			requireCondition(request.method === 'GET', 'Static browser files require GET.');
			const pathname = decodeURIComponent(url.pathname);
			requireCondition(!pathname.includes('\\') && !pathname.includes('\0'), 'Unsafe browser request path.');
			const route = [...canonicalRoots.entries()].find(([prefix]) => pathname.startsWith(prefix));
			requireCondition(route, 'Unsupported browser request root.');
			const [prefix, canonicalRoot] = route;
			const relativePath = pathname.slice(prefix.length);
			requireCondition(
				relativePath.length > 0 &&
					!relativePath.split('/').includes('..') &&
					!path.posix.isAbsolute(relativePath),
				'Unsafe browser request relative path.',
			);
			const allowedPaths = SERVED_CONTROL_PATHS[prefix];
			if (allowedPaths) {
				requireCondition(
					allowedPaths.has(relativePath),
					`Browser request is outside the declared served closure: ${pathname}`,
				);
			}
			const target = assertLexicallyContained(
				canonicalRoot,
				path.join(canonicalRoot, ...relativePath.split('/')),
				'Browser request file',
			);
			const stats = await lstat(target);
			requireCondition(stats.isFile() && !stats.isSymbolicLink(), 'Browser request is not a plain file.');
			const canonicalTarget = await realpath(target);
			requireCondition(
				pathComparisonKey(canonicalTarget) === pathComparisonKey(target) &&
					isPathContained(canonicalRoot, canonicalTarget),
				'Browser request resolves outside its real root.',
			);
			response.writeHead(200, {
				'cache-control': 'no-store',
				'content-type': contentType(canonicalTarget),
			});
			const body = await readFile(canonicalTarget);
			recordServedFile({
				requestPath: pathname,
				root: prefix,
				relativePath,
				byteLength: body.byteLength,
				sha256: sha256(body),
			});
			response.end(body);
		} catch (error) {
			response.writeHead(404, {
				'cache-control': 'no-store',
				'content-type': 'text/plain; charset=utf-8',
			});
			response.end(error?.message ?? String(error));
		}
	});
	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	const address = server.address();
	requireCondition(address && typeof address === 'object', 'Browser server did not acquire a TCP address.');
	return Object.freeze({
		url: `http://127.0.0.1:${address.port}/`,
		executionShard: expectedShard,
		resultPromise,
		progressReceipts: () => progressReceipts.map((receipt) => ({...receipt, event: {...receipt.event}})),
		servedFileRecords: () =>
			[...servedFiles.values()].sort((left, right) => compareStrings(left.requestPath, right.requestPath)),
		close: () =>
			new Promise((resolve, reject) => {
				server.close((error) => (error ? reject(error) : resolve()));
			}),
	});
}

function validateBrowserResult(result, expectedShard) {
	requireShardIdentity(result?.executionShard, expectedShard, 'Browser result');
	if (result?.error) {
		throw new Error(
			`Browser appearance diagnostic shard ${expectedShard.id} failed: ` +
				`${result.error.name}: ${result.error.message}`,
		);
	}
	requireCondition(
		result && typeof result === 'object' && !Array.isArray(result),
		'Browser appearance diagnostic returned no object.',
	);
	requireCondition(
		result.schemaVersion === 'production-sun-appearance-browser-condition-shard-v1',
		`Browser appearance diagnostic shard ${expectedShard.id} returned the wrong schema.`,
	);
	return result;
}

function collectBoundedBrowserStream(stream, label) {
	const chunks = [];
	let byteLength = 0;
	let overflow = false;
	stream.on('data', (chunk) => {
		byteLength += chunk.byteLength;
		if (!overflow && byteLength <= BROWSER_LOG_LIMIT_BYTES) {
			chunks.push(chunk);
		} else {
			overflow = true;
		}
	});
	return () => {
		requireCondition(!overflow, `${label} exceeded ${BROWSER_LOG_LIMIT_BYTES} bytes.`);
		return Buffer.concat(chunks).toString('utf8');
	};
}

function launchChrome(chromePath, arguments_) {
	const launchedAt = new Date().toISOString();
	const child = spawn(chromePath, arguments_, {
		stdio: ['ignore', 'pipe', 'pipe'],
		windowsHide: true,
	});
	const readStdout = collectBoundedBrowserStream(child.stdout, 'Chrome stdout');
	const readStderr = collectBoundedBrowserStream(child.stderr, 'Chrome stderr');
	const exitPromise = new Promise((resolve) => {
		child.once('error', (error) => resolve({kind: 'spawn-error', error: serializeError(error)}));
		child.once('close', (code, signal) =>
			resolve({kind: 'exit', code, signal, exitedAt: new Date().toISOString()}),
		);
	});
	return {child, launchedAt, exitPromise, readStdout, readStderr};
}

async function awaitBrowserSubmission(launched, resultPromise) {
	let timeoutId;
	const timeoutPromise = new Promise((resolve) => {
		timeoutId = setTimeout(() => resolve({kind: 'timeout'}), SHARD_COMPLETION_TIMEOUT_MILLISECONDS);
	});
	const outcome = await Promise.race([
		resultPromise.then((submission) => ({kind: 'submission', submission})),
		launched.exitPromise.then((exit) => ({kind: 'premature-exit', exit})),
		timeoutPromise,
	]);
	clearTimeout(timeoutId);
	if (outcome.kind === 'timeout') {
		throw new Error(
			`Chrome did not submit browser shard evidence within ` + `${SHARD_COMPLETION_TIMEOUT_MILLISECONDS} ms.`,
		);
	}
	if (outcome.kind === 'premature-exit') {
		throw new Error(`Chrome exited before result submission: ${JSON.stringify(outcome.exit)}.`);
	}
	if (!outcome.submission.accepted) {
		throw new Error(
			`Browser result submission was rejected: ` +
				`${outcome.submission.error?.message ?? 'unknown submission error'}.`,
		);
	}
	return outcome.submission;
}

async function terminateChrome(launched) {
	if (launched.child.exitCode === null && launched.child.signalCode === null) {
		launched.child.kill('SIGTERM');
	}
	let timeoutId;
	let outcome = await Promise.race([
		launched.exitPromise,
		new Promise((resolve) => {
			timeoutId = setTimeout(() => resolve({kind: 'termination-timeout'}), 15_000);
		}),
	]);
	clearTimeout(timeoutId);
	if (outcome.kind === 'termination-timeout') {
		launched.child.kill('SIGKILL');
		outcome = await launched.exitPromise;
	}
	return outcome;
}

function chromeArguments(profileDirectory, url) {
	return [
		'--headless=new',
		`--user-data-dir=${profileDirectory}`,
		`--disk-cache-dir=${path.join(profileDirectory, 'cache')}`,
		'--enable-webgl',
		'--ignore-gpu-blocklist',
		'--use-angle=swiftshader',
		'--disable-dev-shm-usage',
		'--disable-background-networking',
		'--disable-breakpad',
		'--disable-component-update',
		'--disable-crash-reporter',
		'--disable-default-apps',
		'--disable-gpu-shader-disk-cache',
		'--disable-sync',
		'--metrics-recording-only',
		'--no-first-run',
		url,
	];
}

async function executeConditionShard({runDirectory, chromePath, shard, resultNonce, indexHtml}) {
	const profileDirectory = path.join(runDirectory, `browser-profile-${shard.id}`);
	const startedAtEpochMilliseconds = Date.now();
	let profileCreated = false;
	let server = null;
	let launched = null;
	let submission = null;
	let exitOutcome = null;
	let browserFailure = null;
	let stdout = '';
	let stderr = '';
	let servedFiles = [];
	let progressReceipts = [];

	try {
		await mkdir(profileDirectory, {recursive: false});
		profileCreated = true;
		await assertExistingRealPathContained(runDirectory, profileDirectory, `${shard.id} Chrome profile`);
		server = await startServer(indexHtml, resultNonce, shard);
		const arguments_ = chromeArguments(profileDirectory, server.url);
		launched = launchChrome(chromePath, arguments_);
		try {
			submission = await awaitBrowserSubmission(launched, server.resultPromise);
		} catch (error) {
			browserFailure = error;
		} finally {
			try {
				exitOutcome = await terminateChrome(launched);
			} catch (error) {
				browserFailure ??= error;
			}
		}
	} catch (error) {
		browserFailure ??= error;
	} finally {
		if (launched !== null) {
			try {
				stdout = launched.readStdout();
				stderr = launched.readStderr();
			} catch (error) {
				browserFailure ??= error;
			}
		}
		if (server !== null) {
			servedFiles = server.servedFileRecords();
			progressReceipts = server.progressReceipts();
			try {
				await server.close();
			} catch (error) {
				browserFailure ??= error;
			}
		}
		if (profileCreated) {
			try {
				await assertExistingRealPathContained(
					runDirectory,
					profileDirectory,
					`${shard.id} Chrome profile cleanup`,
				);
				await rm(profileDirectory, {recursive: true, force: false, maxRetries: 5, retryDelay: 100});
			} catch (error) {
				browserFailure ??= error;
			}
		}
	}

	return {
		shard,
		startedAt: new Date(startedAtEpochMilliseconds).toISOString(),
		completedAt: new Date().toISOString(),
		wallDurationMilliseconds: Date.now() - startedAtEpochMilliseconds,
		pid: launched?.child.pid ?? null,
		launchedAt: launched?.launchedAt ?? null,
		exit: exitOutcome,
		failure: browserFailure ? serializeError(browserFailure) : null,
		submissionReceipt: submission?.receipt ?? null,
		value: submission?.value ?? null,
		progressReceipts,
		servedFiles,
		stdout,
		stderr,
		indexHtmlSha256: sha256(Buffer.from(indexHtml, 'utf8')),
	};
}

async function executeShardPool(requests, concurrency) {
	const results = new Array(requests.length);
	let nextIndex = 0;
	async function worker() {
		while (true) {
			const requestIndex = nextIndex;
			nextIndex += 1;
			if (requestIndex >= requests.length) return;
			const request = requests[requestIndex];
			try {
				results[requestIndex] = await executeConditionShard(request);
			} catch (error) {
				results[requestIndex] = {
					shard: request.shard,
					startedAt: null,
					completedAt: new Date().toISOString(),
					wallDurationMilliseconds: null,
					pid: null,
					launchedAt: null,
					exit: null,
					failure: serializeError(error),
					submissionReceipt: null,
					value: null,
					progressReceipts: [],
					servedFiles: [],
					stdout: '',
					stderr: '',
					indexHtmlSha256: sha256(Buffer.from(request.indexHtml, 'utf8')),
				};
			}
		}
	}
	await Promise.all(Array.from({length: concurrency}, () => worker()));
	return results;
}

function inventoryRecordsByPath(inventory) {
	return new Map((inventory?.files ?? []).map((record) => [record.path, record]));
}

function validateServedShardProvenance(execution, sources) {
	const snapshot = inventoryRecordsByPath(sources.snapshot);
	const controls = inventoryRecordsByPath(sources.controls);
	const three = inventoryRecordsByPath(sources.three);
	const requestPaths = new Set();
	for (const record of execution.servedFiles) {
		requireCondition(!requestPaths.has(record.requestPath), `${execution.shard.id} served a duplicate path.`);
		requestPaths.add(record.requestPath);
		let expected;
		if (record.root === '/snapshot/') {
			expected = snapshot.get(record.relativePath);
		} else if (record.root === '/harness/' || record.root === '/fixtures/') {
			expected = controls.get(`${record.root.slice(1)}${record.relativePath}`);
		} else if (record.root === '/node_modules/') {
			expected = three.get(record.relativePath);
		} else if (record.root === 'generated-browser-index') {
			requireCondition(record.requestPath === '/', `${execution.shard.id} generated index path is invalid.`);
			requireCondition(
				record.sha256 === execution.indexHtmlSha256,
				`${execution.shard.id} served index differs from its recorded input.`,
			);
			continue;
		} else {
			throw new Error(`${execution.shard.id} served an unknown provenance root: ${record.root}.`);
		}
		requireCondition(expected, `${execution.shard.id} served an unrecorded file: ${record.requestPath}.`);
		requireCondition(
			expected.byteLength === record.byteLength && expected.sha256 === record.sha256,
			`${execution.shard.id} served bytes differ from the protected pre-run inventory: ${record.requestPath}.`,
		);
	}
	for (const required of [
		'/',
		'/harness/production-sun-appearance-browser-entry.js',
		'/fixtures/production-sun-appearance-paired-v1.json',
		'/node_modules/three/build/three.module.js',
	]) {
		requireCondition(requestPaths.has(required), `${execution.shard.id} did not serve required path ${required}.`);
	}
	const dependencyRecords = execution.servedFiles.filter((record) => record.requestPath !== '/');
	return {
		servedFileCount: execution.servedFiles.length,
		dependencyFileCount: dependencyRecords.length,
		servedClosureSha256: sha256(Buffer.from(JSON.stringify(execution.servedFiles), 'utf8')),
		dependencyClosureSha256: sha256(Buffer.from(JSON.stringify(dependencyRecords), 'utf8')),
	};
}

function fixtureCondition(fixture, shard) {
	const condition = fixture[shard.family]?.conditions?.find((entry) => entry.id === shard.conditionId);
	requireCondition(condition, `${shard.id} is absent from the frozen fixture.`);
	return condition;
}

function validateCompleteShardResult(execution, fixture) {
	requireCondition(execution.failure === null, `${execution.shard.id} failed: ${execution.failure?.message}.`);
	requireCondition(execution.submissionReceipt !== null, `${execution.shard.id} has no result receipt.`);
	requireCondition(
		execution.progressReceipts.length === PROGRESS_RECEIPT_LIMIT_PER_SHARD,
		`${execution.shard.id} has an incomplete progress receipt inventory.`,
	);
	const result = validateBrowserResult(execution.value, execution.shard);
	requireCondition(result.fixtureId === fixture.id, `${execution.shard.id} fixture identity differs.`);
	requireCondition(
		Array.isArray(result.conditions) && result.conditions.length === 1,
		`${execution.shard.id} must return exactly one complete condition.`,
	);
	const condition = result.conditions[0];
	requireCondition(
		condition.family === execution.shard.family && condition.id === execution.shard.conditionId,
		`${execution.shard.id} returned the wrong condition.`,
	);
	const configured = fixtureCondition(fixture, execution.shard);
	const radialCount = configured.radialOrientations?.length ?? 1;
	const diskSampleCount = fixture.sampling?.diskSamples?.length ?? 0;
	const skySampleCount = fixture.sampling?.circumsolarOffsetsDegrees?.length ?? 0;
	const viewportCount = fixture.viewports?.length ?? 0;
	const samplesPerViewport = diskSampleCount + skySampleCount * radialCount;
	const logicalPairCount = diskSampleCount * skySampleCount * radialCount * viewportCount;
	requireCondition(
		condition.viewports?.length === viewportCount,
		`${execution.shard.id} returned an incomplete viewport inventory.`,
	);
	const configuredViewports = new Map((fixture.viewports ?? []).map((viewport) => [viewport.id, viewport]));
	const returnedViewportIds = new Set();
	const expectedSampleIds = new Set(['disk-center', 'inside-limb-zenithward']);
	for (const offsetDegrees of fixture.sampling?.circumsolarOffsetsDegrees ?? []) {
		for (const orientation of configured.radialOrientations ?? ['zenithward']) {
			expectedSampleIds.add(`circumsolar-${String(offsetDegrees).replace('.', 'p')}-degrees-${orientation}`);
		}
	}
	requireCondition(
		expectedSampleIds.size === samplesPerViewport,
		`${execution.shard.id} fixture sample identities do not match its declared cardinality.`,
	);
	for (const viewport of condition.viewports) {
		const expectedViewport = configuredViewports.get(viewport.id);
		requireCondition(expectedViewport, `${execution.shard.id} returned an unknown viewport ${viewport.id}.`);
		requireCondition(
			!returnedViewportIds.has(viewport.id),
			`${execution.shard.id} returned duplicate viewport ${viewport.id}.`,
		);
		returnedViewportIds.add(viewport.id);
		requireCondition(
			viewport.width === expectedViewport.widthPixels && viewport.height === expectedViewport.heightPixels,
			`${execution.shard.id} viewport ${viewport.id} dimensions differ from the fixture.`,
		);
		requireCondition(
			Array.isArray(viewport.samples) && viewport.samples.length === samplesPerViewport,
			`${execution.shard.id} viewport ${viewport.id} returned an incomplete sample inventory.`,
		);
		const sampleIds = new Set(viewport.samples.map((sample) => sample.id));
		requireCondition(
			sampleIds.size === samplesPerViewport &&
				[...expectedSampleIds].every((sampleId) => sampleIds.has(sampleId)),
			`${execution.shard.id} viewport ${viewport.id} returned incomplete or duplicate sample identities.`,
		);
	}
	requireCondition(
		result.rawOrdering?.comparisonCount === logicalPairCount &&
			result.rawOrdering?.comparisons?.length === logicalPairCount,
		`${execution.shard.id} returned an incomplete logical disk/sky comparison inventory.`,
	);
	const comparisonIds = new Set();
	for (const comparison of result.rawOrdering.comparisons) {
		requireCondition(
			comparison.conditionId === execution.shard.conditionId &&
				comparison.family === execution.shard.family &&
				returnedViewportIds.has(comparison.viewportId),
			`${execution.shard.id} returned a comparison for another condition or viewport.`,
		);
		requireCondition(
			typeof comparison.id === 'string' && !comparisonIds.has(comparison.id),
			`${execution.shard.id} returned a duplicate logical comparison identity.`,
		);
		comparisonIds.add(comparison.id);
	}
	for (const viewportId of returnedViewportIds) {
		for (const diskSampleId of ['disk-center', 'inside-limb-zenithward']) {
			for (const skySampleId of [...expectedSampleIds].filter((id) => id.startsWith('circumsolar-'))) {
				const comparisonId = `${execution.shard.conditionId}:${viewportId}:` + `${diskSampleId}>${skySampleId}`;
				requireCondition(
					comparisonIds.has(comparisonId),
					`${execution.shard.id} omitted logical comparison ${comparisonId}.`,
				);
			}
		}
	}
	const expectedPreviewCount = configured.candidatePreview === true ? 1 : 0;
	requireCondition(
		result.fullFrameSignedLinearCaptures?.length === expectedPreviewCount,
		`${execution.shard.id} returned the wrong full-frame preview count.`,
	);
	requireCondition(
		result.outputContract && result.renderer && result.claimLimits,
		`${execution.shard.id} returned incomplete renderer provenance.`,
	);
	requireCondition(
		result.flatGeometryContract === null,
		`${execution.shard.id} returned an aggregate Flat contract.`,
	);
	return result;
}

function aggregateShardResults(executions, fixture, provenanceSources) {
	requireCondition(
		executions.length === EXPECTED_CONDITION_COUNT,
		`Aggregate requires exactly ${EXPECTED_CONDITION_COUNT} shard executions.`,
	);
	const conditions = [];
	const comparisons = [];
	const fullFrameSignedLinearCaptures = [];
	const identities = new Set();
	const conditionIdentities = new Set();
	const shardRecords = [];
	let uniqueSampleCount = 0;
	let renderer = null;
	let rendererSha256 = null;
	let outputContract = null;
	let outputContractSha256 = null;
	let claimLimits = null;
	let claimLimitsSha256 = null;
	let dependencyClosureSha256 = null;

	const expectedShards = createConditionShards(fixture);
	for (let index = 0; index < executions.length; index += 1) {
		const execution = executions[index];
		requireShardIdentity(execution.shard, expectedShards[index], 'Aggregate execution');
		requireCondition(!identities.has(execution.shard.id), `Duplicate completed shard: ${execution.shard.id}.`);
		identities.add(execution.shard.id);
		const conditionIdentity = `${execution.shard.family}:${execution.shard.conditionId}`;
		requireCondition(
			!conditionIdentities.has(conditionIdentity),
			`Duplicate completed condition: ${conditionIdentity}.`,
		);
		conditionIdentities.add(conditionIdentity);
		const served = validateServedShardProvenance(execution, provenanceSources);
		if (dependencyClosureSha256 === null) dependencyClosureSha256 = served.dependencyClosureSha256;
		requireCondition(
			served.dependencyClosureSha256 === dependencyClosureSha256,
			`${execution.shard.id} executed a different served dependency closure.`,
		);
		const result = validateCompleteShardResult(execution, fixture);
		const actualRendererSha256 = sha256(Buffer.from(JSON.stringify(result.renderer), 'utf8'));
		const actualOutputContractSha256 = sha256(Buffer.from(JSON.stringify(result.outputContract), 'utf8'));
		const actualClaimLimitsSha256 = sha256(Buffer.from(JSON.stringify(result.claimLimits), 'utf8'));
		if (renderer === null) {
			renderer = result.renderer;
			rendererSha256 = actualRendererSha256;
			outputContract = result.outputContract;
			outputContractSha256 = actualOutputContractSha256;
			claimLimits = result.claimLimits;
			claimLimitsSha256 = actualClaimLimitsSha256;
		}
		requireCondition(actualRendererSha256 === rendererSha256, `${execution.shard.id} renderer facts differ.`);
		requireCondition(
			actualOutputContractSha256 === outputContractSha256,
			`${execution.shard.id} output contract differs.`,
		);
		requireCondition(actualClaimLimitsSha256 === claimLimitsSha256, `${execution.shard.id} claim limits differ.`);
		conditions.push(result.conditions[0]);
		uniqueSampleCount += result.conditions[0].viewports.reduce((sum, viewport) => sum + viewport.samples.length, 0);
		comparisons.push(...result.rawOrdering.comparisons);
		fullFrameSignedLinearCaptures.push(...result.fullFrameSignedLinearCaptures);
		shardRecords.push({
			...execution.shard,
			pid: execution.pid,
			wallDurationMilliseconds: execution.wallDurationMilliseconds,
			resultReceipt: execution.submissionReceipt,
			progressReceiptCount: execution.progressReceipts.length,
			...served,
			rendererSha256: actualRendererSha256,
			outputContractSha256: actualOutputContractSha256,
		});
	}
	requireCondition(
		conditions.length === EXPECTED_CONDITION_COUNT,
		`Aggregate requires exactly ${EXPECTED_CONDITION_COUNT} complete conditions.`,
	);
	requireCondition(
		uniqueSampleCount === EXPECTED_UNIQUE_SAMPLE_COUNT,
		`Aggregate requires exactly ${EXPECTED_UNIQUE_SAMPLE_COUNT} unique physical samples.`,
	);
	requireCondition(
		comparisons.length === EXPECTED_LOGICAL_PAIR_COUNT,
		`Aggregate requires exactly ${EXPECTED_LOGICAL_PAIR_COUNT} logical comparisons.`,
	);
	requireCondition(
		fullFrameSignedLinearCaptures.length === 2,
		'Aggregate requires exactly two full-frame signed-linear previews.',
	);
	return {
		browserResult: {
			schemaVersion: 'production-sun-appearance-browser-evidence-v1',
			fixtureId: fixture.id,
			executionShard: null,
			renderer,
			outputContract,
			conditions,
			rawOrdering: {comparisonCount: comparisons.length, comparisons},
			flatGeometryContract: null,
			fullFrameSignedLinearCaptures,
			claimLimits,
		},
		provenance: {
			schemaId: 'production-sun-appearance-condition-shard-aggregate-v1',
			conditionCount: conditions.length,
			uniqueSampleCount,
			logicalPairCount: comparisons.length,
			rendererSha256,
			outputContractSha256,
			claimLimitsSha256,
			dependencyClosureSha256,
			shards: shardRecords,
		},
	};
}

function sanitizeName(value, fallback) {
	const normalized = String(value ?? fallback)
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, '-')
		.replace(/^-+|-+$/gu, '')
		.slice(0, 100);
	return normalized || fallback;
}

function isShaderText(key, value) {
	return (
		typeof value === 'string' &&
		/(?:shader|glsl|vertexsource|fragmentsource|assembledsource)/iu.test(key) &&
		(value.length > 200 || value.includes('#version') || value.includes('void main'))
	);
}

async function extractReturnedArtifacts(run, result) {
	const records = [];
	let sequence = 0;
	async function visit(value, keyPath) {
		if (typeof value === 'string') {
			const key = keyPath.at(-1) ?? 'value';
			if (value.startsWith('data:image/png;base64,')) {
				const bytes = Buffer.from(value.slice(value.indexOf(',') + 1), 'base64');
				requireCondition(
					bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE),
					`Returned PNG ${keyPath.join('.')} has an invalid signature.`,
				);
				const artifactPath =
					`captures/${String(++sequence).padStart(3, '0')}-` +
					`${sanitizeName(keyPath.join('-'), 'capture')}.png`;
				await run.writeArtifact(artifactPath, bytes);
				records.push({artifactPath, kind: 'png', source: keyPath.join('.')});
				return {artifact: artifactPath, mediaType: 'image/png'};
			}
			if (isShaderText(key, value)) {
				const artifactPath =
					`shaders/${String(++sequence).padStart(3, '0')}-` +
					`${sanitizeName(keyPath.join('-'), 'shader')}.glsl`;
				await run.writeArtifact(artifactPath, value);
				records.push({artifactPath, kind: 'shader', source: keyPath.join('.')});
				return {artifact: artifactPath, mediaType: 'text/x-glsl'};
			}
			return value;
		}
		if (Array.isArray(value)) {
			const sanitized = [];
			for (let index = 0; index < value.length; index += 1) {
				sanitized.push(await visit(value[index], [...keyPath, String(index)]));
			}
			return sanitized;
		}
		if (value && typeof value === 'object') {
			const floatEncoding = String(value.encoding ?? value.dataEncoding ?? '').toLowerCase();
			const floatBase64 = firstDefined(value, [
				'dataBase64',
				'pixelsBase64',
				'rgbaBase64',
				'float32Base64',
				'base64',
			]);
			if (
				typeof floatBase64 === 'string' &&
				floatEncoding.includes('float32') &&
				floatEncoding.includes('base64')
			) {
				const bytes = Buffer.from(floatBase64, 'base64');
				const width = Number(
					value.width ?? value.widthPixels ?? value.viewport?.width ?? value.viewport?.widthPixels,
				);
				const height = Number(
					value.height ?? value.heightPixels ?? value.viewport?.height ?? value.viewport?.heightPixels,
				);
				const channels = Number(value.channels ?? value.channelCount ?? 4);
				requireCondition(
					Number.isSafeInteger(width) &&
						width > 0 &&
						Number.isSafeInteger(height) &&
						height > 0 &&
						Number.isSafeInteger(channels) &&
						channels > 0,
					`Returned float frame ${keyPath.join('.')} has invalid dimensions.`,
				);
				requireCondition(
					bytes.byteLength === width * height * channels * 4,
					`Returned float frame ${keyPath.join('.')} byte count is invalid.`,
				);
				const artifactPath =
					`frames/${String(++sequence).padStart(3, '0')}-` +
					`${sanitizeName(value.id ?? keyPath.join('-'), 'frame')}.rgba32f`;
				await run.writeArtifact(artifactPath, bytes);
				records.push({
					artifactPath,
					kind: 'float32-frame',
					source: keyPath.join('.'),
					width,
					height,
					channels,
				});
				return {
					...Object.fromEntries(
						Object.entries(value).filter(
							([key]) =>
								!['dataBase64', 'pixelsBase64', 'rgbaBase64', 'float32Base64', 'base64'].includes(key),
						),
					),
					artifact: artifactPath,
					byteLength: bytes.byteLength,
					mediaType: 'application/x-float32-rgba',
				};
			}
			const sanitized = {};
			for (const key of Object.keys(value).sort(compareStrings)) {
				sanitized[key] = await visit(value[key], [...keyPath, key]);
			}
			return sanitized;
		}
		return value;
	}
	return {
		sanitized: await visit(result, ['browserResult']),
		records,
	};
}

function firstDefined(object, names) {
	for (const name of names) {
		if (object && object[name] !== undefined && object[name] !== null) {
			return object[name];
		}
	}
	return undefined;
}

function numericArray(value, label) {
	if (typeof value === 'number') {
		value = [value];
	} else if (
		value &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		Object.keys(value).every((key) => /^\d+$/u.test(key))
	) {
		value = Object.keys(value)
			.sort((left, right) => Number(left) - Number(right))
			.map((key) => value[key]);
	}
	requireCondition(Array.isArray(value) && value.length > 0, `${label} is missing.`);
	const accepted = value.map(Number);
	requireCondition(accepted.every(Number.isFinite), `${label} contains a non-finite value.`);
	return accepted;
}

function tolerancePair(value, fallback) {
	if (typeof value === 'number') {
		return {absolute: value, relative: 0};
	}
	return {
		absolute: Number(value?.absolute ?? value?.abs ?? fallback.absolute),
		relative: Number(value?.relative ?? value?.rel ?? fallback.relative),
	};
}

function vectorComparison(left, right, tolerance) {
	requireCondition(left.length === right.length, 'Compared vectors differ in length.');
	let maximumAbsoluteError = 0;
	let maximumRelativeError = 0;
	let passed = true;
	for (let index = 0; index < left.length; index += 1) {
		const absoluteError = Math.abs(left[index] - right[index]);
		const scale = Math.max(Math.abs(left[index]), Math.abs(right[index]));
		const relativeError = scale > 0 ? absoluteError / scale : 0;
		maximumAbsoluteError = Math.max(maximumAbsoluteError, absoluteError);
		maximumRelativeError = Math.max(maximumRelativeError, relativeError);
		if (absoluteError > tolerance.absolute + tolerance.relative * scale) {
			passed = false;
		}
	}
	return {passed, maximumAbsoluteError, maximumRelativeError};
}

function float32OrderedBits(value) {
	const buffer = new ArrayBuffer(4);
	const view = new DataView(buffer);
	view.setFloat32(0, Math.fround(value), false);
	const bits = view.getUint32(0, false);
	return (bits & 0x80000000) !== 0 ? 0x80000000 - (bits & 0x7fffffff) : 0x80000000 + bits;
}

function maximumFloat32UlpDistance(left, right) {
	requireCondition(left.length === right.length, 'Float32 ULP vectors differ in length.');
	return left.reduce(
		(maximum, value, index) =>
			Math.max(maximum, Math.abs(float32OrderedBits(value) - float32OrderedBits(right[index]))),
		0,
	);
}

function clamp01(value) {
	return Math.min(1, Math.max(0, value));
}

function srgbEncode(value) {
	const accepted = clamp01(value);
	return accepted <= 0.0031308 ? 12.92 * accepted : 1.055 * accepted ** (1 / 2.4) - 0.055;
}

function quantizeCodes(rgb, encoding) {
	return rgb.map((value) => Math.round(255 * (encoding === 'srgb' ? srgbEncode(value) : clamp01(value))));
}

function maxCodeError(left, right) {
	requireCondition(left.length === right.length, 'Code vectors differ in length.');
	return left.reduce((maximum, value, index) => Math.max(maximum, Math.abs(value - right[index])), 0);
}

function normalizeCodes(value, label) {
	const codes = numericArray(value, label);
	const normalized = codes.every((entry) => entry >= 0 && entry <= 1)
		? codes.map((entry) => Math.round(entry * 255))
		: codes.map((entry) => Math.round(entry));
	requireCondition(
		normalized.every((entry) => entry >= 0 && entry <= 255),
		`${label} is outside the 8-bit code range.`,
	);
	return normalized.slice(0, 3);
}

function normalizeExpectedEncoding(value) {
	const normalized = String(value ?? '').toLowerCase();
	if (normalized.includes('srgb')) return 'srgb';
	if (normalized.includes('direct') || normalized.includes('linear') || normalized.includes('identity'))
		return 'direct';
	return null;
}

function evaluateOutputTransfer(result, fixture) {
	const contract = result.outputContract ?? result.outputTransfer;
	requireCondition(
		contract && typeof contract === 'object',
		'Browser result is missing mandatory output-contract evidence.',
	);
	const probes = firstDefined(contract, ['probes', 'transferProbes', 'samples']);
	requireCondition(
		Array.isArray(probes) && probes.length > 0,
		'Output-contract evidence contains no transfer probes.',
	);
	const toleranceRoot = fixture.diagnosticTolerances ?? fixture.tolerances ?? fixture.acceptance ?? {};
	const codeTolerance = Number(
		firstDefined(toleranceRoot, ['outputCodeLsb', 'codeLsb', 'maximumCodeError']) ??
			(toleranceRoot.quantizedCodesMustMatchExactly ? 0 : 1),
	);
	requireCondition(Number.isFinite(codeTolerance) && codeTolerance >= 0, 'Output code tolerance is invalid.');
	const observations = probes.map((probe, index) => {
		const mapper = numericArray(
			firstDefined(probe, ['mapperRgb', 'mapperFloatRgb', 'mapperOutputRgb', 'mapperOutput']),
			`Output probe ${index} mapper RGB`,
		).slice(0, 3);
		const framebuffer = normalizeCodes(
			firstDefined(probe, ['framebufferCodes', 'defaultFramebufferCodes', 'framebufferRgb8']),
			`Output probe ${index} framebuffer codes`,
		);
		const png = normalizeCodes(
			firstDefined(probe, ['pngCodes', 'finalCodes', 'roundTripCodes', 'pngRgb8']),
			`Output probe ${index} PNG codes`,
		);
		requireCondition(
			mapper.length === 3 && framebuffer.length === 3 && png.length === 3,
			`Output probe ${index} must provide RGB triplets.`,
		);
		const directCodes = quantizeCodes(mapper, 'direct');
		const srgbCodes = quantizeCodes(mapper, 'srgb');
		const directError = maxCodeError(framebuffer, directCodes);
		const srgbError = maxCodeError(framebuffer, srgbCodes);
		const roundTripError = maxCodeError(framebuffer, png);
		const discriminating = maxCodeError(directCodes, srgbCodes) > 2 * codeTolerance;
		let classification = 'other';
		if (directError <= codeTolerance && srgbError > codeTolerance) {
			classification = 'direct';
		} else if (srgbError <= codeTolerance && directError > codeTolerance) {
			classification = 'srgb';
		} else if (!discriminating && directError <= codeTolerance) {
			classification = 'nondiscriminating';
		} else if (directError <= codeTolerance && srgbError <= codeTolerance) {
			classification = 'ambiguous';
		}
		return {
			id: probe.id ?? probe.probeId ?? `probe-${index}`,
			mapper,
			framebuffer,
			png,
			directCodes,
			srgbCodes,
			directError,
			srgbError,
			roundTripError,
			discriminating,
			classification,
			passedRoundTrip: roundTripError <= codeTolerance,
		};
	});
	const discriminating = observations.filter((entry) => entry.discriminating);
	requireCondition(discriminating.length > 0, 'Output probes cannot discriminate direct from sRGB encoding.');
	const classifications = new Set(discriminating.map((entry) => entry.classification));
	const measuredEncoding =
		classifications.size === 1 && ['direct', 'srgb'].includes([...classifications][0])
			? [...classifications][0]
			: 'unresolved';
	const expectedEncoding = normalizeExpectedEncoding(
		fixture.outputContract?.expectedEncoding ?? fixture.expectedOutputEncoding ?? contract.expectedEncoding,
	);
	const requiredMeasuredEncoding = 'direct';
	const requiredOfficialCtlEncoding = 'sRGB-piecewise';
	const passed =
		measuredEncoding !== 'unresolved' &&
		measuredEncoding === requiredMeasuredEncoding &&
		observations.every((entry) => entry.passedRoundTrip) &&
		(!expectedEncoding || measuredEncoding === expectedEncoding);
	return {
		passed,
		codeTolerance,
		expectedEncoding,
		measuredEncoding,
		requiredMeasuredEncoding,
		requiredOfficialCtlEncoding,
		semanticMapping:
			'direct framebuffer storage requires official sRGB-piecewise CTL final codes; automatic sRGB would double-encode',
		probeCount: observations.length,
		discriminatingProbeCount: discriminating.length,
		observations,
	};
}

const FIELD_ALIASES = Object.freeze({
	spectrum: ['spectrum', 'nativeSpectrum', 'preDisplaySpectrum'],
	xyz: ['xyz', 'cieXyz', 'cieXYZ'],
	directY: ['directY', 'photopicY', 'cieY', 'luminanceY'],
	signedLinearRgb: ['signedLinearRgb', 'linearRgb', 'linearSrgb'],
	mapperRgb: ['mapperRgb', 'mapperFloatRgb', 'displayMapperRgb'],
});

function fieldValue(record, field) {
	return firstDefined(record, FIELD_ALIASES[field]);
}

function fieldTolerance(fixture, field) {
	const toleranceRoot = fixture.diagnosticTolerances ?? fixture.tolerances ?? fixture.acceptance ?? {};
	const cpuGpu = toleranceRoot.cpuGpu ?? toleranceRoot.pair ?? {};
	const named = field === 'spectrum' ? toleranceRoot.cacheVersusBinary64 : toleranceRoot.gpuCpuTransform;
	return tolerancePair(cpuGpu[field] ?? named ?? cpuGpu, {absolute: 1e-6, relative: 0.005});
}

function compositionTriplet(record) {
	const composition = record?.composition ?? record;
	return {
		path: firstDefined(composition, ['pathSpectrum', 'pathRadiance']),
		celestial: firstDefined(composition, ['celestialSpectrum', 'celestialRadiance']),
		preDisplay: firstDefined(composition, ['preDisplaySpectrum', 'preDisplayRadiance', 'composedSpectrum']),
	};
}

function flattenPairs(result) {
	const direct = firstDefined(result, ['pairs', 'pairedSamples', 'samples']);
	if (Array.isArray(direct) && direct.length > 0) {
		return direct;
	}
	const pairs = [];
	for (const condition of result.conditions ?? []) {
		for (const viewport of condition.viewports ?? []) {
			for (const sample of viewport.samples ?? []) {
				pairs.push({
					...sample,
					id: sample.id ?? sample.sampleId,
					conditionId: condition.id ?? condition.conditionId,
					sceneId: condition.family ?? condition.sceneId,
					viewportId: viewport.id ?? viewport.viewportId,
					fovDegrees: viewport.verticalFovDegrees ?? viewport.fovDegrees,
					metadata: {
						...(sample.metadata ?? {}),
						conditionId: condition.id ?? condition.conditionId,
						sceneId: condition.family ?? condition.sceneId,
						viewportId: viewport.id ?? viewport.viewportId,
						fovDegrees: viewport.verticalFovDegrees ?? viewport.fovDegrees,
					},
				});
			}
		}
	}
	return pairs;
}

function expectedUniqueSampleCount(fixture) {
	const diskSampleCount = fixture.sampling?.diskSamples?.length ?? 0;
	const skySampleCount = fixture.sampling?.circumsolarOffsetsDegrees?.length ?? 0;
	const viewportCount = fixture.viewports?.length ?? 0;
	if (!(diskSampleCount > 0 && skySampleCount > 0 && viewportCount > 0)) {
		return null;
	}
	let perViewport = 0;
	for (const family of [fixture.distant, fixture.flat]) {
		for (const condition of family?.conditions ?? []) {
			const radialCount = condition.radialOrientations?.length ?? 1;
			perViewport += diskSampleCount + skySampleCount * radialCount;
		}
	}
	return perViewport * viewportCount;
}

function evaluatePairs(result, fixture) {
	const pairs = flattenPairs(result);
	requireCondition(
		Array.isArray(pairs) && pairs.length > 0,
		'Browser result is missing mandatory CPU/GPU pair evidence.',
	);
	const requiredFields = fixture.requiredPairedFields ??
		fixture.gates?.requiredPairedFields ?? ['spectrum', 'xyz', 'directY', 'signedLinearRgb', 'mapperRgb'];
	requireCondition(
		Array.isArray(requiredFields) && requiredFields.length > 0,
		'Fixture requiredPairedFields is invalid.',
	);
	const toleranceRoot = fixture.diagnosticTolerances ?? fixture.tolerances ?? fixture.acceptance ?? {};
	const compositionTolerance = tolerancePair(toleranceRoot.composition ?? toleranceRoot.float32Composition, {
		absolute: 1e-6,
		relative: 0.00005,
	});
	const observations = pairs.map((pair, pairIndex) => {
		const cpu = pair.cpu ?? pair.reference;
		const gpu = pair.gpu ?? pair.shader;
		requireCondition(cpu && gpu, `Pair ${pairIndex} does not contain both CPU and GPU records.`);
		const fields = {};
		for (const field of requiredFields) {
			requireCondition(FIELD_ALIASES[field], `Fixture requests unknown paired field ${field}.`);
			const cpuValue = numericArray(fieldValue(cpu, field), `Pair ${pairIndex} CPU ${field}`);
			const gpuValue = numericArray(fieldValue(gpu, field), `Pair ${pairIndex} GPU ${field}`);
			fields[field] = {
				tolerance: fieldTolerance(fixture, field),
				...vectorComparison(cpuValue, gpuValue, fieldTolerance(fixture, field)),
			};
		}
		const composition = {};
		for (const [lane, record] of [
			['cpu', cpu],
			['gpu', gpu],
		]) {
			const triplet = compositionTriplet(record);
			const pathSpectrum = numericArray(triplet.path, `Pair ${pairIndex} ${lane} path spectrum`);
			const celestialSpectrum = numericArray(triplet.celestial, `Pair ${pairIndex} ${lane} celestial spectrum`);
			const preDisplaySpectrum = numericArray(
				triplet.preDisplay,
				`Pair ${pairIndex} ${lane} pre-display spectrum`,
			);
			requireCondition(
				pathSpectrum.length === celestialSpectrum.length && pathSpectrum.length === preDisplaySpectrum.length,
				`Pair ${pairIndex} ${lane} composition vector lengths disagree.`,
			);
			if (lane === 'gpu' && Number.isFinite(toleranceRoot.float32Composition?.maximumUlp)) {
				const expected = pathSpectrum.map((value, index) =>
					Math.fround(Math.fround(value) + Math.fround(celestialSpectrum[index])),
				);
				const maximumUlp = maximumFloat32UlpDistance(expected, preDisplaySpectrum);
				composition[lane] = {
					operation: 'f32(f32(path)+f32(celestial))',
					maximumUlp,
					maximumAllowedUlp: toleranceRoot.float32Composition.maximumUlp,
					passed: maximumUlp <= toleranceRoot.float32Composition.maximumUlp,
				};
			} else {
				const sum = pathSpectrum.map((value, index) => value + celestialSpectrum[index]);
				composition[lane] = {
					tolerance: compositionTolerance,
					...vectorComparison(sum, preDisplaySpectrum, compositionTolerance),
				};
			}
		}
		return {
			id: pair.id ?? pair.sampleId ?? `pair-${pairIndex}`,
			metadata: pair.metadata ?? pair.sample ?? null,
			fields,
			composition,
			passed:
				Object.values(fields).every((entry) => entry.passed) &&
				Object.values(composition).every((entry) => entry.passed),
		};
	});
	const expectedPairCount = Number(expectedUniqueSampleCount(fixture) ?? observations.length);
	requireCondition(
		Number.isSafeInteger(expectedPairCount) && expectedPairCount > 0,
		'Fixture total expected pair count is invalid.',
	);
	return {
		passed: observations.length === expectedPairCount && observations.every((entry) => entry.passed),
		pairCount: observations.length,
		expectedPairCount,
		requiredFields,
		observations,
		rawPairs: pairs,
	};
}

function evaluateSamplingContract(result, fixture, rawPairs) {
	const fixtureViewports = new Map((fixture.viewports ?? []).map((viewport) => [viewport.id, viewport]));
	const expectedConditions = [
		...(fixture.distant?.conditions ?? []).map((condition) => ({family: 'distant', ...condition})),
		...(fixture.flat?.conditions ?? []).map((condition) => ({family: 'flat', ...condition})),
	];
	const actualConditions = result.conditions ?? [];
	const failures = [];
	if (actualConditions.length !== expectedConditions.length) {
		failures.push(`condition-count:${actualConditions.length}/${expectedConditions.length}`);
	}
	for (const expected of expectedConditions) {
		const condition = actualConditions.find(
			(entry) => entry.id === expected.id && entry.family === expected.family,
		);
		if (!condition) {
			failures.push(`missing-condition:${expected.family}:${expected.id}`);
			continue;
		}
		if (condition.viewports?.length !== fixtureViewports.size) {
			failures.push(`viewport-count:${expected.id}`);
			continue;
		}
		const expectedSampleCount =
			(fixture.sampling?.diskSamples?.length ?? 0) +
			(fixture.sampling?.circumsolarOffsetsDegrees?.length ?? 0) * (expected.radialOrientations?.length ?? 1);
		for (const viewport of condition.viewports) {
			const configured = fixtureViewports.get(viewport.id);
			if (!configured) {
				failures.push(`unexpected-viewport:${expected.id}:${viewport.id}`);
				continue;
			}
			const width = Number(viewport.width ?? viewport.widthPixels);
			const height = Number(viewport.height ?? viewport.heightPixels);
			if (
				width !== Number(configured.width ?? configured.widthPixels) ||
				height !== Number(configured.height ?? configured.heightPixels) ||
				width % 2 !== 1 ||
				height % 2 !== 1
			) {
				failures.push(`viewport-identity:${expected.id}:${viewport.id}`);
			}
			if (viewport.samples?.length !== expectedSampleCount) {
				failures.push(
					`sample-count:${expected.id}:${viewport.id}:` +
						`${viewport.samples?.length ?? 0}/${expectedSampleCount}`,
				);
			}
			const insideFactor = Number(
				fixture.sampling?.insideLimbRadiusFactor ??
					fixture.sampling?.diskSamples?.find((entry) => entry.id === 'inside-limb')?.apparentRadiusFactor ??
					0.95,
			);
			const expectedOffsets = new Map([
				['disk-center', 0],
				['inside-limb-zenithward', Number(condition.source?.apparentRadiusRadians) * insideFactor],
			]);
			for (const offsetDegrees of fixture.sampling?.circumsolarOffsetsDegrees ?? []) {
				for (const orientation of expected.radialOrientations ?? ['zenithward']) {
					expectedOffsets.set(
						`circumsolar-${String(offsetDegrees).replace('.', 'p')}-degrees-${orientation}`,
						(offsetDegrees * Math.PI) / 180,
					);
				}
			}
			const actualSampleIds = new Set((viewport.samples ?? []).map((sample) => sample.id));
			for (const [sampleId, angularOffsetRadians] of expectedOffsets) {
				const sample = (viewport.samples ?? []).find((entry) => entry.id === sampleId);
				if (!sample) {
					failures.push(`missing-sample:${expected.id}:${viewport.id}:${sampleId}`);
					continue;
				}
				if (
					!Number.isFinite(angularOffsetRadians) ||
					Math.abs(sample.angularOffsetRadians - angularOffsetRadians) > 1e-12
				) {
					failures.push(`sample-offset:${expected.id}:${viewport.id}:${sampleId}`);
				}
				if (
					!Number.isFinite(sample.requestedRayAngularResidualRadians) ||
					sample.requestedRayAngularResidualRadians > 1e-5
				) {
					failures.push(`ray-residual:${expected.id}:${viewport.id}:${sampleId}`);
				}
			}
			for (const actualSampleId of actualSampleIds) {
				if (!expectedOffsets.has(actualSampleId)) {
					failures.push(`unexpected-sample:${expected.id}:${viewport.id}:${actualSampleId}`);
				}
			}
			for (const sample of viewport.samples ?? []) {
				const centerX = (width - 1) / 2;
				const centerY = (height - 1) / 2;
				if (sample.pixel?.x !== centerX || sample.pixel?.y !== centerY) {
					failures.push(`noncentral-pixel:${expected.id}:${viewport.id}:${sample.id}`);
				}
				const subsamples = sample.rasterSubsamples;
				if (
					!Array.isArray(subsamples) ||
					subsamples.length !== 4 ||
					subsamples.some((value) => typeof value !== 'boolean')
				) {
					failures.push(`raster-subsamples:${expected.id}:${viewport.id}:${sample.id}`);
					continue;
				}
				const expectedCoverage = subsamples.filter(Boolean).length / 4;
				if (Math.abs(Number(sample.coverage) - expectedCoverage) > 1e-5) {
					failures.push(`coverage:${expected.id}:${viewport.id}:${sample.id}`);
				}
				if (String(sample.id).startsWith('circumsolar-') && expectedCoverage !== 0) {
					failures.push(`circumsolar-coverage:${expected.id}:${viewport.id}:${sample.id}`);
				}
				if (sample.id === 'disk-center' && expectedCoverage <= 0) {
					failures.push(`center-coverage:${expected.id}:${viewport.id}`);
				}
				if (
					sample.state?.pathValid === true &&
					sample.state?.hasSceneEndpoint === true &&
					sample.state?.hasGroundEndpoint === true
				) {
					failures.push(`endpoint-state:${expected.id}:${viewport.id}:${sample.id}`);
				}
				if (sample.state?.pathValid !== true) {
					failures.push(`path-state:${expected.id}:${viewport.id}:${sample.id}`);
				}
			}
		}
	}

	const viewportComparisons = [];
	const grouped = new Map();
	for (const pair of rawPairs) {
		const key = `${pair.conditionId}|${pair.id}`;
		const group = grouped.get(key) ?? [];
		group.push(pair);
		grouped.set(key, group);
	}
	for (const [key, group] of grouped) {
		if (group.length !== fixtureViewports.size) {
			failures.push(`viewport-pair-count:${key}`);
			continue;
		}
		const left = numericArray(
			fieldValue(group[0].gpu ?? group[0].shader, 'spectrum'),
			`${key} first viewport spectrum`,
		);
		const right = numericArray(
			fieldValue(group[1].gpu ?? group[1].shader, 'spectrum'),
			`${key} second viewport spectrum`,
		);
		const comparison = vectorComparison(left, right, fieldTolerance(fixture, 'spectrum'));
		const sampleId = group[0].id ?? group[0].sampleId;
		const gated = sampleId === 'disk-center' || String(sampleId).startsWith('circumsolar-');
		viewportComparisons.push({
			key,
			sampleId,
			gated,
			classification: gated
				? 'center/circumsolar FOV invariance gate'
				: 'inside-limb raster-footprint delta recorded without cross-FOV equality gate',
			...comparison,
		});
		if (gated && !comparison.passed) failures.push(`viewport-invariance:${key}`);
	}
	return {
		passed: failures.length === 0,
		conditionCount: actualConditions.length,
		sampleCount: rawPairs.length,
		viewportComparisonCount: viewportComparisons.length,
		failures,
		viewportComparisons,
	};
}

function evaluateFlatGeometryContract(result, fixture) {
	const observations = [];
	const toleranceMeters = 1e-6;
	for (const expected of fixture.flat?.conditions ?? []) {
		const actual = (result.conditions ?? []).find(
			(condition) => condition.family === 'flat' && condition.id === expected.id,
		);
		if (!actual) {
			observations.push({
				id: expected.id,
				passed: false,
				reason: 'missing Flat condition',
			});
			continue;
		}
		const centerMeters = numericArray(
			actual.geometryContract?.centerMeters ?? actual.source?.centerMeters,
			`Flat condition ${expected.id} actual center`,
		);
		const expectedCenterMeters = numericArray(
			expected.expectedCenterMeters,
			`Flat condition ${expected.id} expected center`,
		);
		const center = vectorComparison(centerMeters, expectedCenterMeters, {absolute: toleranceMeters, relative: 0});
		const cacheRadialMaximumMeters = Number(
			actual.geometryContract?.cacheRadialMaximumMeters ?? Math.hypot(centerMeters[0], centerMeters[1]),
		);
		const expectedCacheRadialMaximumMeters = Number(expected.expectedCacheRadialMaximumMeters);
		const radialAbsoluteError = Math.abs(cacheRadialMaximumMeters - expectedCacheRadialMaximumMeters);
		observations.push({
			id: expected.id,
			distanceClass: expected.distanceClass,
			centerMeters,
			expectedCenterMeters,
			center,
			cacheRadialMaximumMeters,
			expectedCacheRadialMaximumMeters,
			radialAbsoluteError,
			passed: center.passed && radialAbsoluteError <= toleranceMeters,
		});
	}
	const byDistanceClass = new Map(observations.map((entry) => [entry.distanceClass, entry]));
	const close = byDistanceClass.get('close')?.cacheRadialMaximumMeters;
	const medium = byDistanceClass.get('medium')?.cacheRadialMaximumMeters;
	const long = byDistanceClass.get('long')?.cacheRadialMaximumMeters;
	const ordered =
		Number.isFinite(close) && Number.isFinite(medium) && Number.isFinite(long) && close < medium && medium < long;
	return {
		passed:
			observations.length === (fixture.flat?.conditions?.length ?? 0) &&
			observations.every((entry) => entry.passed) &&
			ordered,
		toleranceMeters,
		orderedCloseMediumLong: ordered,
		observations,
	};
}

function convergenceLevels(record) {
	const convergence =
		record?.sourcePathConvergence ??
		record?.convergence ??
		record?.cpu?.sourcePathConvergence ??
		record?.cpu?.convergence;
	if (!convergence) return [];
	const directLevels = convergence.levels ?? convergence.refinements ?? convergence.samples ?? convergence.entries;
	if (Array.isArray(directLevels)) {
		return directLevels.map((level) => ({
			intervalCount: Number(level.intervalCount ?? level.intervals),
			spectrum: numericArray(
				firstDefined(level, ['spectrum', 'values', 'transmittedSpectrum', 'celestialSpectrum']),
				'Source-path convergence spectrum',
			),
		}));
	}
	const intervalCounts = convergence.intervalCounts;
	const spectra = convergence.spectra ?? convergence.valuesByIntervalCount;
	if (Array.isArray(intervalCounts) && Array.isArray(spectra)) {
		return intervalCounts.map((intervalCount, index) => ({
			intervalCount: Number(intervalCount),
			spectrum: numericArray(spectra[index], `Source-path convergence ${intervalCount}`),
		}));
	}
	if (spectra && typeof spectra === 'object') {
		return Object.entries(spectra).map(([intervalCount, spectrum]) => ({
			intervalCount: Number(intervalCount),
			spectrum: numericArray(spectrum, `Source-path convergence ${intervalCount}`),
		}));
	}
	return [];
}

function maximumDifference(left, right) {
	requireCondition(left.length === right.length, 'Convergence spectra differ in length.');
	return left.reduce((maximum, value, index) => Math.max(maximum, Math.abs(value - right[index])), 0);
}

function evaluateConvergence(rawPairs, fixture) {
	const policy = fixture.sourcePathConvergence;
	requireCondition(policy && typeof policy === 'object', 'Fixture is missing source-path convergence policy.');
	const requiredCounts = policy.refinedIntervalCounts;
	requireCondition(
		Array.isArray(requiredCounts) && requiredCounts.length >= 2,
		'Source-path convergence interval sequence is invalid.',
	);
	const tailTolerance = tolerancePair(policy.spectralTailTolerance, {absolute: 1e-10, relative: 0.0001});
	const contractionPolicy = policy.requiredContraction ?? {};
	const observations = rawPairs.map((pair, pairIndex) => {
		const levels = convergenceLevels(pair);
		const byCount = new Map(levels.map((level) => [level.intervalCount, level.spectrum]));
		const missingCounts = requiredCounts.filter((count) => !byCount.has(count));
		const diagnostics = {
			id: pair.id ?? pair.sampleId ?? `pair-${pairIndex}`,
			missingCounts,
			levelCount: levels.length,
			tailEstimateMaximum: Number.POSITIVE_INFINITY,
			tailBoundMaximum: 0,
			contractions: [],
			passed: false,
		};
		if (missingCounts.length > 0) return diagnostics;
		const lastCount = requiredCounts.at(-1);
		const previousCount = requiredCounts.at(-2);
		const last = byCount.get(lastCount);
		const previous = byCount.get(previousCount);
		const richardsonDivisor = 2 ** Number(policy.richardsonOrder ?? 2) - 1;
		const tailEstimates = last.map((value, index) => Math.abs(value - previous[index]) / richardsonDivisor);
		diagnostics.tailEstimateMaximum = Math.max(...tailEstimates);
		diagnostics.tailBoundMaximum = Math.max(
			...last.map((value) => tailTolerance.absolute + tailTolerance.relative * Math.abs(value)),
		);
		const tailPassed = tailEstimates.every(
			(estimate, index) => estimate <= tailTolerance.absolute + tailTolerance.relative * Math.abs(last[index]),
		);
		const production = byCount.get(Number(policy.productionIntervalCount));
		requireCondition(
			production,
			`Convergence evidence lacks production interval count ${policy.productionIntervalCount}.`,
		);
		const productionTolerance = tolerancePair(fixture.diagnosticTolerances?.cacheVersusBinary64, {
			absolute: 0.0005,
			relative: 0.00005,
		});
		diagnostics.productionVersusRefined = vectorComparison(production, last, productionTolerance);
		diagnostics.productionVersusRefined.tolerance = productionTolerance;
		diagnostics.productionVersusRefined.classification =
			'recorded production-resolution bias; not an acceptance gate';
		let contractionPassed = true;
		for (const [name, rule] of Object.entries(contractionPolicy)) {
			const counts = /d(\d+)MaximumFromD(\d+)/u.exec(name);
			requireCondition(counts, `Unknown convergence contraction rule ${name}.`);
			const fineCount = Number(counts[1]);
			const coarseCount = Number(counts[2]);
			const fineIndex = requiredCounts.indexOf(fineCount);
			const coarseIndex = requiredCounts.indexOf(coarseCount);
			requireCondition(
				fineIndex > 0 && coarseIndex > 0,
				`Convergence contraction rule ${name} names an absent level.`,
			);
			const fineDifference = maximumDifference(
				byCount.get(fineCount),
				byCount.get(requiredCounts[fineIndex - 1]),
			);
			const coarseDifference = maximumDifference(
				byCount.get(coarseCount),
				byCount.get(requiredCounts[coarseIndex - 1]),
			);
			const maximumAllowed = Number(rule.factor) * coarseDifference + Number(rule.absoluteFloor ?? 0);
			const passed = fineDifference <= maximumAllowed;
			contractionPassed &&= passed;
			diagnostics.contractions.push({
				name,
				fineDifference,
				coarseDifference,
				maximumAllowed,
				passed,
			});
		}
		diagnostics.passed = tailPassed && contractionPassed;
		return diagnostics;
	});
	return {
		passed: observations.length > 0 && observations.every((entry) => entry.passed),
		requiredIntervalCounts: requiredCounts,
		observationCount: observations.length,
		observations,
	};
}

function sampleRole(pair) {
	const text = [pair.role, pair.sampleRole, pair.id, pair.sampleId, pair.metadata?.role, pair.metadata?.sampleId]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();
	if (/circum|outside|sky|0[.-]?5|1[.-]?0|2[.-]?0/u.test(text)) return 'sky';
	if (/center|inside|limb|disk/u.test(text)) return 'disk';
	const angularOffset = Number(pair.angularOffsetDegrees ?? pair.metadata?.angularOffsetDegrees);
	const angularRadius = Number(pair.sunAngularRadiusDegrees ?? pair.metadata?.sunAngularRadiusDegrees);
	if (Number.isFinite(angularOffset) && Number.isFinite(angularRadius)) {
		return angularOffset <= angularRadius ? 'disk' : 'sky';
	}
	return null;
}

function groupKey(pair) {
	return [
		pair.sceneId ?? pair.metadata?.sceneId ?? 'scene',
		pair.conditionId ?? pair.metadata?.conditionId ?? 'condition',
		pair.viewportId ?? pair.metadata?.viewportId ?? 'viewport',
		pair.fovDegrees ?? pair.metadata?.fovDegrees ?? 'fov',
	].join('|');
}

function extractOrderingComparisons(result, rawPairs) {
	const supplied = result.rawOrdering?.comparisons ?? result.ordering?.comparisons;
	if (Array.isArray(supplied) && supplied.length > 0) {
		return supplied.flatMap((entry, index) => {
			const shared = {
				conditionId: entry.conditionId ?? null,
				family: entry.family ?? null,
				viewportId: entry.viewportId ?? null,
				diskSampleId: entry.diskSampleId ?? null,
				skySampleId: entry.skySampleId ?? null,
			};
			if (entry.cpuDiskY !== undefined || entry.gpuDiskY !== undefined) {
				return [
					{
						...shared,
						id: `${entry.id ?? `ordering-${index}`}:cpu`,
						lane: 'cpu',
						diskY: Number(entry.cpuDiskY),
						skyY: Number(entry.cpuSkyY),
						diskYUncertainty: Number(entry.cpuDiskYUncertainty),
						skyYUncertainty: Number(entry.cpuSkyYUncertainty),
						declaredStrictlyOrdered: entry.cpuStrictlyOrdered,
					},
					{
						...shared,
						id: `${entry.id ?? `ordering-${index}`}:gpu`,
						lane: 'gpu',
						diskY: Number(entry.gpuDiskY),
						skyY: Number(entry.gpuSkyY),
						diskYUncertainty: Number(entry.gpuDiskYUncertainty ?? 0),
						skyYUncertainty: Number(entry.gpuSkyYUncertainty ?? 0),
						declaredStrictlyOrdered: entry.gpuStrictlyOrdered,
					},
				];
			}
			return [
				{
					...shared,
					id: entry.id ?? `ordering-${index}`,
					diskY: Number(entry.diskY ?? entry.diskYRefined ?? entry.diskDirectY),
					diskYUncertainty: Number(entry.diskYUncertainty ?? 0),
					skyY: Number(entry.skyY ?? entry.skyYRefined ?? entry.skyDirectY),
					skyYUncertainty: Number(entry.skyYUncertainty ?? 0),
				},
			];
		});
	}
	const groups = new Map();
	for (const pair of rawPairs) {
		const role = sampleRole(pair);
		if (!role) continue;
		const gpu = pair.gpu ?? pair.shader;
		const directY = numericArray(
			fieldValue(gpu, 'directY'),
			`Ordering sample ${pair.id ?? pair.sampleId} GPU direct Y`,
		)[0];
		const key = groupKey(pair);
		const group = groups.get(key) ?? {disk: [], sky: []};
		group[role].push({id: pair.id ?? pair.sampleId ?? role, directY});
		groups.set(key, group);
	}
	const comparisons = [];
	for (const [key, group] of groups) {
		for (const disk of group.disk) {
			for (const sky of group.sky) {
				comparisons.push({
					id: `${key}:${disk.id}>${sky.id}`,
					diskSampleId: disk.id,
					skySampleId: sky.id,
					diskY: disk.directY,
					skyY: sky.directY,
				});
			}
		}
	}
	return comparisons;
}

function evaluateRawOrdering(result, fixture, rawPairs) {
	const comparisons = extractOrderingComparisons(result, rawPairs);
	requireCondition(comparisons.length > 0, 'No numeric raw disk/sky ordering comparisons can be formed.');
	const suppliedLogicalCount =
		result.rawOrdering?.comparisons?.length ?? result.ordering?.comparisons?.length ?? null;
	const expectedLogicalCount = fixture.sampling?.expectedCounts?.totalPixelPairs;
	if (Number.isSafeInteger(expectedLogicalCount) && suppliedLogicalCount !== null) {
		requireCondition(
			suppliedLogicalCount === expectedLogicalCount,
			`Raw ordering evidence has ${suppliedLogicalCount} logical comparison(s); ` +
				`expected ${expectedLogicalCount}.`,
		);
	}
	const minimumRatio = Number(
		fixture.gates?.rawOrderingMinimumRatio ?? fixture.tolerances?.rawOrderingMinimumRatio ?? 1,
	);
	requireCondition(Number.isFinite(minimumRatio) && minimumRatio >= 1, 'Raw ordering minimum ratio is invalid.');
	const observations = comparisons.map((entry) => {
		requireCondition(
			Number.isFinite(entry.diskY) && Number.isFinite(entry.skyY),
			`Raw ordering comparison ${entry.id} is not finite.`,
		);
		requireCondition(
			Number.isFinite(entry.diskYUncertainty ?? 0) &&
				Number.isFinite(entry.skyYUncertainty ?? 0) &&
				(entry.diskYUncertainty ?? 0) >= 0 &&
				(entry.skyYUncertainty ?? 0) >= 0,
			`Raw ordering comparison ${entry.id} has invalid uncertainty.`,
		);
		const diskLowerBound = entry.diskY - (entry.diskYUncertainty ?? 0);
		const skyUpperBound = entry.skyY + (entry.skyYUncertainty ?? 0);
		const ratio =
			entry.skyY > 0 ? entry.diskY / entry.skyY : entry.diskY > entry.skyY ? Number.POSITIVE_INFINITY : 0;
		return {
			...entry,
			diskLowerBound,
			skyUpperBound,
			ratio,
			passed: diskLowerBound > skyUpperBound && ratio >= minimumRatio && entry.declaredStrictlyOrdered !== false,
		};
	});
	const cpuComparisons = observations.filter((entry) => entry.lane === 'cpu');
	requireCondition(
		cpuComparisons.length > 0 &&
			cpuComparisons.every(
				(entry) => Number.isFinite(entry.diskYUncertainty) && Number.isFinite(entry.skyYUncertainty),
			),
		'Raw CPU ordering evidence lacks finite refined-reference uncertainty.',
	);
	return {
		passed: observations.every((entry) => entry.passed),
		minimumRatio,
		comparisonCount: observations.length,
		observations,
	};
}

function evaluateReturnedArtifacts(result, records) {
	const floatFrames = records.filter((entry) => entry.kind === 'float32-frame');
	const shaders = records.filter((entry) => entry.kind === 'shader');
	const pngs = records.filter((entry) => entry.kind === 'png');
	const declaredFrames = result.fullFrameSignedLinearCaptures;
	const framesFinite =
		Array.isArray(declaredFrames) &&
		declaredFrames.length >= 2 &&
		declaredFrames.every((entry) => entry.finite === true);
	return {
		passed: floatFrames.length >= 2 && shaders.length > 0 && pngs.length > 0 && framesFinite,
		floatFrameCount: floatFrames.length,
		shaderCount: shaders.length,
		pngCount: pngs.length,
		declaredFrameCount: Array.isArray(declaredFrames) ? declaredFrames.length : 0,
		framesFinite,
	};
}

function reportText(runId, conclusion, gates, artifacts) {
	return `# ${runId}: production Sun appearance paired diagnostic

Conclusion: **${conclusion}**

- Output transfer: ${gates.outputTransfer.passed ? 'accepted' : 'rejected'}; measured encoding \`${gates.outputTransfer.measuredEncoding}\` from ${gates.outputTransfer.discriminatingProbeCount} discriminating probe(s).
- CPU/GPU and composition pairs: ${gates.pairs.passed ? 'accepted' : 'rejected'}; ${gates.pairs.pairCount} pair(s).
- Sampling/FOV contract: ${gates.sampling.passed ? 'accepted' : 'rejected'}; ${gates.sampling.sampleCount} sample(s), ${gates.sampling.viewportComparisonCount} cross-viewport comparison(s).
- Flat placement contract: ${gates.flatGeometry.passed ? 'accepted' : 'rejected'}; close < medium < long ${gates.flatGeometry.orderedCloseMediumLong ? 'confirmed' : 'not confirmed'}.
- Source-path convergence: ${gates.convergence.passed ? 'accepted' : 'rejected'}; ${gates.convergence.observationCount} sample observation(s).
- Raw disk/sky ordering: ${gates.rawOrdering.passed ? 'accepted' : 'rejected'}; ${gates.rawOrdering.comparisonCount} comparison(s).
- Review inputs: ${gates.artifacts.passed ? 'accepted' : 'rejected'}; ${gates.artifacts.floatFrameCount} signed-float frame(s), ${gates.artifacts.shaderCount} shader(s), ${gates.artifacts.pngCount} PNG(s).
- Returned shader/PNG artifacts: ${artifacts.length}.
- Claim boundary: sealed offline Step 5.1 renderer contract and Step 5.2 normal-path diagnostic only.
`;
}

async function verifyProtectedExecutionState(before) {
	const snapshot = await verifySnapshot();
	assertFileInventoriesEqual(
		before.snapshot.inventory,
		snapshot.inventory,
		'Production appearance snapshot before/after execution',
	);
	requireCondition(
		before.snapshot.manifestSha256 === snapshot.manifestSha256,
		'Production appearance snapshot manifest mutated during execution.',
	);
	const production = await createSelectedFileInventory(
		REPOSITORY_ROOT,
		before.snapshot.manifest.sealedInventory.files.map((entry) => entry.path),
	);
	assertFileInventoriesEqual(before.production, production, 'Protected production source before/after execution');
	const controls = await createSelectedFileInventory(EXPERIMENT_ROOT, EXECUTED_CONTROL_PATHS);
	assertFileInventoriesEqual(before.controls, controls, 'Executed experiment controls before/after execution');
	const three = await createSelectedFileInventory(EXPERIMENT_NODE_MODULES_ROOT, THREE_RUNTIME_PATHS);
	assertFileInventoriesEqual(before.three, three, 'Installed Three runtime before/after execution');
	return {snapshot, production, controls, three};
}

async function persistShardExecution(run, execution) {
	const root = `evidence/shards/${execution.shard.id}`;
	const dependencyFiles = execution.servedFiles.filter((record) => record.requestPath !== '/');
	const servedClosure = {
		servedFileCount: execution.servedFiles.length,
		dependencyFileCount: dependencyFiles.length,
		servedClosureSha256: sha256(Buffer.from(JSON.stringify(execution.servedFiles), 'utf8')),
		dependencyClosureSha256: sha256(Buffer.from(JSON.stringify(dependencyFiles), 'utf8')),
	};
	await run.writeArtifact(`browser/shards/${execution.shard.id}/chrome-stdout.txt`, execution.stdout);
	await run.writeArtifact(`browser/shards/${execution.shard.id}/chrome-stderr.txt`, execution.stderr);
	await run.writeJsonArtifact(`${root}/completion.json`, {
		schemaId: 'production-sun-appearance-browser-shard-completion-v1',
		executionShard: execution.shard,
		strategy: 'isolated-process-one-shot-loopback-result-with-bounded-progress-v1',
		startedAt: execution.startedAt,
		completedAt: execution.completedAt,
		wallDurationMilliseconds: execution.wallDurationMilliseconds,
		launchedAt: execution.launchedAt,
		pid: execution.pid,
		timeoutMilliseconds: SHARD_COMPLETION_TIMEOUT_MILLISECONDS,
		timeoutBasis: SHARD_COMPLETION_TIMEOUT_BASIS,
		resultBodyLimitBytes: RESULT_BODY_LIMIT_BYTES,
		progressBodyLimitBytes: PROGRESS_BODY_LIMIT_BYTES,
		progressReceiptLimit: PROGRESS_RECEIPT_LIMIT_PER_SHARD,
		progressReceiptCount: execution.progressReceipts.length,
		receipt: execution.submissionReceipt,
		exit: execution.exit,
		failure: execution.failure,
		pidIsolation: 'one exact Chrome child process with a shard-owned contained profile and cache',
		servedClosure,
	});
	await run.writeJsonArtifact(`${root}/progress.json`, {
		schemaId: 'production-sun-appearance-browser-progress-receipts-v1',
		executionShard: execution.shard,
		claimBoundary: 'Operational completion receipts only; no partial event is scientific or oracle evidence.',
		bodyLimitBytes: PROGRESS_BODY_LIMIT_BYTES,
		receiptLimit: PROGRESS_RECEIPT_LIMIT_PER_SHARD,
		receipts: execution.progressReceipts,
	});
	await run.writeJsonArtifact(`${root}/served-browser-files.json`, {
		schemaId: 'production-sun-appearance-served-browser-files-v1',
		executionShard: execution.shard,
		...servedClosure,
		files: execution.servedFiles,
	});
	await run.writeJsonArtifact(
		`${root}/browser-result.json`,
		execution.value ?? {
			executionShard: execution.shard,
			error: execution.failure ?? {name: 'Error', message: 'No browser result submission was received.'},
		},
	);
}

async function main() {
	if (process.argv.length !== 2) {
		throw new Error('run-production-sun-appearance-paired-diagnostic accepts no arguments.');
	}
	const executionResources = selectShardConcurrency(EXPECTED_CONDITION_COUNT);
	const run = await initializeRunRecord({
		slug: 'production-sun-appearance-paired-diagnostic',
		command: COMMAND,
		inputs: {
			schemaId: PROOF_ID,
			fixture: 'scripts/extraterrestrial/fixtures/' + 'production-sun-appearance-paired-v1.json',
			snapshot: 'scripts/extraterrestrial/production-snapshots/' + 'sun-appearance-step-5-v1',
			browserApi: 'runProductionSunAppearanceDiagnostic(fixture, reportProgress, executionShard)',
			execution: 'eight independent condition shards aggregated once without generated input reuse',
		},
		provenance: {
			experiment: 'scripts/extraterrestrial',
			productionRuntime: 'sealed create-once snapshot; no live source import',
			aggregation: 'complete validated shard results only; no partial shard is scientific evidence',
		},
		environment: {
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			browser: 'installed Chrome headless WebGL2 / SwiftShader',
			conditionShardResources: executionResources,
		},
		references: {
			canonicalDesign: 'agents/topics/extraterrestrial/sun-disk-appearance-design.md',
			canonicalPlan: 'agents/topics/extraterrestrial/' + 'sun-disk-appearance-implementation-plan.md',
			acesRelease: 'v2.0.0+2025.04.04',
			acesReleaseZipSha256: 'b9a7eb69dc57e1732b2bd63a060a94ad10fb9c61de2cdc33055f95594a3b08fa',
		},
	});
	let protectedBefore = null;
	let protectedAfter = null;
	try {
		await assertRepositoryIdentity();
		requireCondition(
			executionResources.selectedConcurrency >= 2,
			'Condition sharding requires resources for at least two concurrent independent browser processes.',
		);
		const snapshotBefore = await verifySnapshot();
		const productionBefore = await createSelectedFileInventory(
			REPOSITORY_ROOT,
			snapshotBefore.manifest.sealedInventory.files.map((entry) => entry.path),
		);
		await assertExistingRealPathContained(EXPERIMENT_ROOT, HARNESS_PATH, 'Production appearance browser harness');
		await assertExistingRealPathContained(EXPERIMENT_ROOT, FIXTURE_PATH, 'Production appearance fixture');
		const [fixture, chromePath] = await Promise.all([
			readFile(FIXTURE_PATH, 'utf8').then(JSON.parse),
			findChrome(),
		]);
		const shards = createConditionShards(fixture);
		const controlsBefore = await createSelectedFileInventory(EXPERIMENT_ROOT, EXECUTED_CONTROL_PATHS);
		const threeBefore = await createSelectedFileInventory(EXPERIMENT_NODE_MODULES_ROOT, THREE_RUNTIME_PATHS);
		protectedBefore = {
			snapshot: snapshotBefore,
			production: productionBefore,
			controls: controlsBefore,
			three: threeBefore,
		};
		const chromeStats = await lstat(chromePath);
		const chromeExecutable = {
			path: chromePath,
			byteLength: chromeStats.size,
			sha256: await sha256File(chromePath),
		};
		await run.writeJsonArtifact('evidence/snapshot-before.json', {
			manifestSha256: snapshotBefore.manifestSha256,
			git: snapshotBefore.manifest.source.git,
			inventory: snapshotBefore.inventory,
			productionSourceAtRunStart: productionBefore,
			executedControls: controlsBefore,
			threeRuntime: threeBefore,
			chromeExecutable,
		});
		await run.writeJsonArtifact('evidence/condition-shard-plan.json', {
			schemaId: 'production-sun-appearance-condition-shard-plan-v1',
			fixtureId: fixture.id,
			conditionCount: shards.length,
			uniqueSampleCount: expectedUniqueSampleCount(fixture),
			logicalPairCount: fixture.sampling.expectedCounts.totalPixelPairs,
			executionResources,
			perShardTimeoutMilliseconds: SHARD_COMPLETION_TIMEOUT_MILLISECONDS,
			perShardTimeoutBasis: SHARD_COMPLETION_TIMEOUT_BASIS,
			generatedInputReuse: false,
			shards,
		});
		const shardRequests = [];
		for (const shard of shards) {
			const resultNonce = randomBytes(32).toString('hex');
			const indexHtml = browserIndex(resultNonce, shard);
			await run.writeArtifact(`browser/shards/${shard.id}/index.html`, indexHtml);
			shardRequests.push({
				runDirectory: run.runDirectory,
				chromePath,
				shard,
				resultNonce,
				indexHtml,
			});
		}
		const executions = await executeShardPool(shardRequests, executionResources.selectedConcurrency);
		for (const execution of executions) {
			await persistShardExecution(run, execution);
		}

		protectedAfter = await verifyProtectedExecutionState(protectedBefore);
		await run.writeJsonArtifact('evidence/snapshot-after.json', {
			manifestSha256: protectedAfter.snapshot.manifestSha256,
			inventory: protectedAfter.snapshot.inventory,
			productionSourceAtRunEnd: protectedAfter.production,
			executedControls: protectedAfter.controls,
			threeRuntime: protectedAfter.three,
		});

		const aggregated = aggregateShardResults(executions, fixture, {
			snapshot: snapshotBefore.inventory,
			controls: controlsBefore,
			three: threeBefore,
		});
		const browserResult = aggregated.browserResult;
		await run.writeJsonArtifact('evidence/condition-shard-aggregate.json', aggregated.provenance);
		const extracted = await extractReturnedArtifacts(run, browserResult);
		await run.writeJsonArtifact('evidence/browser-result.json', extracted.sanitized);
		await run.writeJsonArtifact('evidence/returned-artifacts.json', {
			artifacts: extracted.records,
		});

		const outputTransfer = evaluateOutputTransfer(browserResult, fixture);
		const pairs = evaluatePairs(browserResult, fixture);
		const sampling = evaluateSamplingContract(browserResult, fixture, pairs.rawPairs);
		const flatGeometry = evaluateFlatGeometryContract(browserResult, fixture);
		const convergence = evaluateConvergence(pairs.rawPairs, fixture);
		const rawOrdering = evaluateRawOrdering(browserResult, fixture, pairs.rawPairs);
		const artifacts = evaluateReturnedArtifacts(browserResult, extracted.records);
		delete pairs.rawPairs;
		const gates = {
			proofId: PROOF_ID,
			outputTransfer,
			pairs,
			sampling,
			flatGeometry,
			convergence,
			rawOrdering,
			artifacts,
			accepted:
				outputTransfer.passed &&
				pairs.passed &&
				sampling.passed &&
				flatGeometry.passed &&
				convergence.passed &&
				rawOrdering.passed &&
				artifacts.passed,
		};
		await run.writeJsonArtifact('evidence/gates.json', gates);

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: ['runners/run-production-sun-appearance-paired-diagnostic.js'],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: [
				'node:child_process',
				'node:crypto',
				'node:fs',
				'node:fs/promises',
				'node:http',
				'node:module',
				'node:os',
				'node:path',
				'node:url',
				'node:util',
			],
		});
		await run.writeJsonArtifact('evidence/runtime-closure.json', closure);
		await run.writeJsonArtifact('evidence/condition-shard-tool-closures.json', {
			schemaId: 'production-sun-appearance-condition-shard-tool-closures-v1',
			staticRuntimeClosureSha256: sha256(Buffer.from(JSON.stringify(closure), 'utf8')),
			servedDependencyClosureSha256: aggregated.provenance.dependencyClosureSha256,
			shards: aggregated.provenance.shards.map((shard) => ({
				id: shard.id,
				pid: shard.pid,
				wallDurationMilliseconds: shard.wallDurationMilliseconds,
				servedClosureSha256: shard.servedClosureSha256,
				dependencyClosureSha256: shard.dependencyClosureSha256,
			})),
		});
		const conclusion = gates.accepted ? 'accepted' : 'rejected';
		const terminalManifest = await run.finalize({
			conclusion,
			result: {
				proofId: PROOF_ID,
				accepted: gates.accepted,
				measuredOutputEncoding: outputTransfer.measuredEncoding,
				requiredOfficialCtlEncoding: outputTransfer.requiredOfficialCtlEncoding,
				pairCount: pairs.pairCount,
				rawOrderingComparisonCount: rawOrdering.comparisonCount,
				returnedArtifactCount: extracted.records.length,
				conditionShardCount: executions.length,
				conditionShardConcurrency: executionResources.selectedConcurrency,
				snapshotAggregateSha256: protectedAfter.snapshot.inventory.aggregateSha256,
			},
			report: reportText(run.runId, conclusion, gates, extracted.records),
		});
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion,
					measuredOutputEncoding: outputTransfer.measuredEncoding,
					artifactSetSha256: terminalManifest.artifactSetSha256,
				},
				null,
				2,
			)}\n`,
		);
		if (!gates.accepted) {
			process.exitCode = 2;
		}
	} catch (error) {
		const detail = serializeError(error);
		if (protectedBefore !== null && protectedAfter === null) {
			try {
				protectedAfter = await verifyProtectedExecutionState(protectedBefore);
				await run.writeJsonArtifact('evidence/failure-protected-after.json', {
					manifestSha256: protectedAfter.snapshot.manifestSha256,
					inventory: protectedAfter.snapshot.inventory,
					productionSourceAtRunEnd: protectedAfter.production,
					executedControls: protectedAfter.controls,
					threeRuntime: protectedAfter.three,
				});
			} catch (protectedError) {
				detail.protectedVerificationError = serializeError(protectedError);
			}
		}
		try {
			const snapshot = await verifySnapshot();
			await run.writeJsonArtifact('evidence/failure-snapshot.json', {
				manifestSha256: snapshot.manifestSha256,
				inventory: snapshot.inventory,
			});
		} catch (snapshotError) {
			detail.snapshotVerificationError = serializeError(snapshotError);
		}
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const terminalManifest = await run.finalize({
				conclusion: 'failed',
				result: {proofId: PROOF_ID, accepted: false, error: detail},
				report: `# ${run.runId}: production Sun appearance paired diagnostic

Conclusion: **failed**

${detail.message}
`,
			});
			process.stderr.write(
				`${JSON.stringify(
					{
						runId: run.runId,
						conclusion: 'failed',
						error: detail,
						artifactSetSha256: terminalManifest.artifactSetSha256,
					},
					null,
					2,
				)}\n`,
			);
		} catch (finalizationError) {
			process.stderr.write(
				`${JSON.stringify(
					{
						runId: run.runId,
						conclusion: 'partial-unfinalized',
						error: detail,
						finalizationError: serializeError(finalizationError),
					},
					null,
					2,
				)}\n`,
			);
		}
		process.exitCode = 1;
	}
}

main().catch((error) => {
	process.stderr.write(
		`Production Sun appearance paired diagnostic initialization failed: ` + `${error.stack ?? error}\n`,
	);
	process.exitCode = 1;
});
