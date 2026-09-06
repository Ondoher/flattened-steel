#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import {lstat, mkdir, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';

import {
	assertCreatablePathContained,
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	createSelectedFileInventory,
	sha256,
	sha256File,
} from '../harness/lib/hashes.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_ROOT,
	OUTPUT_ROOT,
	REPOSITORY_ROOT,
	assertLexicallyContained,
	assertRepositoryIdentity,
	isPathContained,
	pathComparisonKey,
} from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-flat-local-analytic-disk-raster-gpu-visual-loop.js';
const OUTPUT_PARENT = path.join(OUTPUT_ROOT, 'visual-development', 'flat-local-analytic-raster');
const SNAPSHOT_ROOT = path.join(EXPERIMENT_ROOT, 'production-snapshots', 'sun-appearance-step-5-v1');
const SNAPSHOT_MANIFEST_PATH = path.join(SNAPSHOT_ROOT, 'manifest.json');
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'flat-local-analytic-disk-raster-gpu-proof-v1.json');
const RESULT_BODY_LIMIT_BYTES = 16 * 1024 * 1024;
const PROGRESS_BODY_LIMIT_BYTES = 16 * 1024;
const BROWSER_LOG_LIMIT_BYTES = 4 * 1024 * 1024;
const INACTIVITY_TIMEOUT_MILLISECONDS = 10 * 60 * 1000;
const CHROME_TERMINATION_TIMEOUT_MILLISECONDS = 15 * 1000;
const CHROME_CANDIDATES = [
	process.env.FLAT_LOCAL_ANALYTIC_RASTER_CHROME,
	'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
	'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);
const CONTROL_RELATIVE_PATHS = [
	'fixtures/flat-local-analytic-disk-raster-gpu-proof-v1.json',
	'harness/flat-local-analytic-raster-visual-browser-entry.js',
	'harness/lib/containment.js',
	'harness/lib/flat-local-analytic-disk-raster-gpu-proof-scene.js',
	'harness/lib/flat-local-analytic-disk-raster-oracle.js',
	'harness/lib/flat-local-analytic-disk-raster.js',
	'harness/lib/hashes.js',
	'harness/lib/roots.js',
	'package-lock.json',
	'package.json',
	'production-snapshots/sun-appearance-step-5-v1/manifest.json',
	'runners/run-flat-local-analytic-disk-raster-gpu-visual-loop.js',
];
const ALLOWED_HARNESS_PATHS = new Set([
	'flat-local-analytic-raster-visual-browser-entry.js',
	'lib/flat-local-analytic-disk-raster-gpu-proof-scene.js',
	'lib/flat-local-analytic-disk-raster-oracle.js',
	'lib/flat-local-analytic-disk-raster.js',
]);

/** Require one development-loop invariant. */
function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

/** Return a serializable error packet. */
function serializeError(error) {
	return {
		name: error?.name ?? 'Error',
		message: error?.message ?? String(error),
		stack: error?.stack ?? null,
	};
}

/** Return whether one HTTP peer is loopback-local. */
function isLoopbackAddress(value) {
	return value === '127.0.0.1' || value === '::1' || value === '::ffff:127.0.0.1';
}

/** Return the response content type for one served file. */
function contentType(filePath) {
	switch (path.extname(filePath).toLowerCase()) {
		case '.js':
			return 'text/javascript; charset=utf-8';
		case '.json':
			return 'application/json; charset=utf-8';
		default:
			return 'application/octet-stream';
	}
}

/** Read one bounded JSON request body. */
async function readJsonBody(request, limitBytes) {
	const declaredLength = Number(request.headers['content-length'] ?? 0);
	requireCondition(
		Number.isSafeInteger(declaredLength) && declaredLength >= 0 && declaredLength <= limitBytes,
		'HTTP body length is outside its declared bound.',
	);
	const chunks = [];
	let byteLength = 0;
	for await (const chunk of request) {
		byteLength += chunk.byteLength;
		if (byteLength > limitBytes) throw new RangeError('HTTP body exceeds its streamed bound.');
		chunks.push(chunk);
	}
	requireCondition(
		request.headers['content-length'] === undefined || byteLength === declaredLength,
		'HTTP body differs from its Content-Length.',
	);
	return JSON.parse(Buffer.concat(chunks, byteLength).toString('utf8'));
}

/** Return the nonce-bound browser document for the two-image visual loop. */
function browserIndex(nonce) {
	return `<!doctype html>
<meta charset="utf-8">
<title>Flat local analytic Sun visual loop</title>
<pre id="status">starting</pre>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<script type="module">
const nonce = ${JSON.stringify(nonce)};
const status = document.querySelector('#status');
let sequence = 0;
const post = async (pathname, value) => {
	const response = await fetch(pathname, {
		method: 'POST',
		headers: {'content-type': 'application/json', 'x-visual-loop-nonce': nonce},
		body: JSON.stringify(value),
		cache: 'no-store',
	});
	if (!response.ok) throw new Error(pathname + ' failed with HTTP ' + response.status + '.');
};
const reportProgress = async (event) => {
	sequence += 1;
	status.textContent = event.stage ?? 'working';
	await post('/progress', {sequence, ...event});
};
try {
	await reportProgress({stage: 'browser-start'});
	const {runFlatLocalAnalyticDiskRasterGpuVisualLoop} = await import('/harness/flat-local-analytic-raster-visual-browser-entry.js');
	const fixture = await (await fetch('/fixtures/flat-local-analytic-disk-raster-gpu-proof-v1.json', {cache: 'no-store'})).json();
	const value = await runFlatLocalAnalyticDiskRasterGpuVisualLoop(fixture, reportProgress);
	await reportProgress({stage: 'browser-complete'});
	await post('/result', value);
	status.textContent = 'complete';
} catch (error) {
	await post('/result', {error: {name: error.name, message: error.message, stack: error.stack}});
}
</script>`;
}

/** Load the sealed snapshot inventory used to authorize served source files. */
async function loadSnapshotFiles() {
	const manifest = JSON.parse(await readFile(SNAPSHOT_MANIFEST_PATH, 'utf8'));
	requireCondition(
		manifest?.schemaId === 'production-sun-appearance-snapshot-v1' &&
			Array.isArray(manifest.sealedInventory?.files),
		'Production snapshot manifest is unsupported.',
	);
	return new Map(manifest.sealedInventory.files.map((entry) => [entry.path, entry]));
}

/** Start the loopback-only visual-loop server. */
async function startServer(nonce, snapshotFiles) {
	const servedFiles = new Map();
	let lastActivity = Date.now();
	let expectedProgressSequence = 1;
	let resultSubmitted = false;
	let resolveResult;
	const resultPromise = new Promise((resolve) => {
		resolveResult = resolve;
	});
	const roots = {
		harness: await assertExistingRealPathContained(
			EXPERIMENT_ROOT,
			path.join(EXPERIMENT_ROOT, 'harness'),
			'harness server root',
		),
		fixtures: await assertExistingRealPathContained(
			EXPERIMENT_ROOT,
			path.join(EXPERIMENT_ROOT, 'fixtures'),
			'fixture server root',
		),
		snapshot: await assertExistingRealPathContained(EXPERIMENT_ROOT, SNAPSHOT_ROOT, 'snapshot server root'),
		nodeModules: await assertExistingRealPathContained(
			EXPERIMENT_ROOT,
			EXPERIMENT_NODE_MODULES_ROOT,
			'node_modules server root',
		),
	};
	const server = createServer((request, response) => {
		void (async () => {
			try {
				requireCondition(isLoopbackAddress(request.socket.remoteAddress), 'HTTP peer is not loopback-local.');
				const url = new URL(request.url ?? '/', 'http://127.0.0.1');
				if (url.pathname === '/progress' || url.pathname === '/result') {
					requireCondition(request.method === 'POST', 'Browser evidence endpoints require POST.');
					requireCondition(request.headers['x-visual-loop-nonce'] === nonce, 'Browser nonce differs.');
					const value = await readJsonBody(
						request,
						url.pathname === '/result' ? RESULT_BODY_LIMIT_BYTES : PROGRESS_BODY_LIMIT_BYTES,
					);
					if (url.pathname === '/progress') {
						requireCondition(
							Number.isSafeInteger(value.sequence) && value.sequence === expectedProgressSequence,
							'Browser progress sequence is not contiguous.',
						);
						requireCondition(
							typeof value.stage === 'string' && value.stage.length > 0,
							'Progress stage is absent.',
						);
						expectedProgressSequence += 1;
						lastActivity = Date.now();
						process.stdout.write(`[visual-loop] ${value.stage}\n`);
						response.writeHead(204, {'cache-control': 'no-store'});
						response.end();
						return;
					}
					requireCondition(!resultSubmitted, 'Browser result may be submitted only once.');
					resultSubmitted = true;
					lastActivity = Date.now();
					response.writeHead(204, {'cache-control': 'no-store'});
					response.end();
					resolveResult(value);
					return;
				}
				if (url.pathname === '/') {
					requireCondition(request.method === 'GET', 'Browser index requires GET.');
					const body = Buffer.from(browserIndex(nonce), 'utf8');
					response.writeHead(200, {
						'cache-control': 'no-store',
						'content-type': 'text/html; charset=utf-8',
					});
					response.end(body);
					return;
				}
				requireCondition(request.method === 'GET', 'Static files require GET.');
				const pathname = decodeURIComponent(url.pathname);
				requireCondition(!pathname.includes('\\') && !pathname.includes('\0'), 'Unsafe request path.');
				let root;
				let relativePath;
				let expectedSnapshotEntry = null;
				if (pathname.startsWith('/harness/')) {
					root = roots.harness;
					relativePath = pathname.slice('/harness/'.length);
					requireCondition(
						ALLOWED_HARNESS_PATHS.has(relativePath),
						'Harness request is outside the visual closure.',
					);
				} else if (pathname.startsWith('/fixtures/')) {
					root = roots.fixtures;
					relativePath = pathname.slice('/fixtures/'.length);
					requireCondition(
						relativePath === 'flat-local-analytic-disk-raster-gpu-proof-v1.json',
						'Fixture request is outside the visual closure.',
					);
				} else if (pathname.startsWith('/snapshot/')) {
					root = roots.snapshot;
					relativePath = pathname.slice('/snapshot/'.length);
					expectedSnapshotEntry = snapshotFiles.get(relativePath);
					requireCondition(expectedSnapshotEntry !== undefined, 'Snapshot request is outside its manifest.');
				} else if (pathname.startsWith('/node_modules/')) {
					root = roots.nodeModules;
					relativePath = pathname.slice('/node_modules/'.length);
					requireCondition(
						relativePath.startsWith('three/'),
						'Bare dependency request is outside pinned Three.',
					);
				} else {
					throw new Error('Browser requested an unsupported root.');
				}
				requireCondition(
					relativePath.length > 0 &&
						!relativePath.split('/').includes('..') &&
						!path.posix.isAbsolute(relativePath),
					'Unsafe static relative path.',
				);
				const target = assertLexicallyContained(
					root,
					path.join(root, ...relativePath.split('/')),
					'served file',
				);
				const stats = await lstat(target);
				requireCondition(stats.isFile() && !stats.isSymbolicLink(), 'Served path is not a plain file.');
				const canonicalTarget = await realpath(target);
				requireCondition(
					pathComparisonKey(canonicalTarget) === pathComparisonKey(target) &&
						isPathContained(root, canonicalTarget),
					'Served file escaped its canonical root.',
				);
				const body = await readFile(canonicalTarget);
				const identity = {absolutePath: canonicalTarget, bytes: body.byteLength, sha256: sha256(body)};
				if (expectedSnapshotEntry !== null) {
					requireCondition(
						identity.bytes === expectedSnapshotEntry.bytes &&
							identity.sha256 === expectedSnapshotEntry.sha256,
						`Snapshot bytes differ for ${relativePath}.`,
					);
				}
				const previous = servedFiles.get(pathname);
				requireCondition(
					previous === undefined ||
						(previous.bytes === identity.bytes && previous.sha256 === identity.sha256),
					`Served bytes changed for ${pathname}.`,
				);
				servedFiles.set(pathname, identity);
				response.writeHead(200, {'cache-control': 'no-store', 'content-type': contentType(canonicalTarget)});
				response.end(body);
			} catch (error) {
				if (!response.headersSent) {
					response.writeHead(404, {
						'cache-control': 'no-store',
						'content-type': 'text/plain; charset=utf-8',
					});
				}
				response.end(error?.message ?? String(error));
			}
		})();
	});
	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	const address = server.address();
	requireCondition(address !== null && typeof address === 'object', 'Loopback server acquired no port.');
	return {
		url: `http://127.0.0.1:${address.port}/`,
		resultPromise,
		lastActivity: () => lastActivity,
		servedFiles,
		close: () =>
			new Promise((resolve, reject) => {
				server.close((error) => (error ? reject(error) : resolve()));
				server.closeAllConnections?.();
			}),
	};
}

/** Collect a browser stream under a fixed memory bound. */
function collectBrowserStream(stream, label) {
	const chunks = [];
	let byteLength = 0;
	let overflow = false;
	stream.on('data', (chunk) => {
		byteLength += chunk.byteLength;
		if (byteLength <= BROWSER_LOG_LIMIT_BYTES) chunks.push(chunk);
		else overflow = true;
	});
	return () => {
		requireCondition(!overflow, `${label} exceeded its ${BROWSER_LOG_LIMIT_BYTES}-byte bound.`);
		return Buffer.concat(chunks).toString('utf8');
	};
}

/** Find one installed Chrome executable without changing the host. */
async function findChrome() {
	for (const candidate of CHROME_CANDIDATES) {
		try {
			const stats = await lstat(candidate);
			if (stats.isFile() && !stats.isSymbolicLink()) return realpath(candidate);
		} catch {
			// Continue through the fixed local candidates.
		}
	}
	throw new Error('No supported Chrome executable was found.');
}

/** Launch one network-disabled hardware-GPU Chrome process. */
function launchChrome(chromePath, profileDirectory, url) {
	const arguments_ = [
		'--headless=new',
		`--user-data-dir=${profileDirectory}`,
		`--disk-cache-dir=${path.join(profileDirectory, 'cache')}`,
		'--enable-gpu',
		'--enable-webgl',
		'--ignore-gpu-blocklist',
		'--disable-software-rasterizer',
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
	const child = spawn(chromePath, arguments_, {stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true});
	const readStdout = collectBrowserStream(child.stdout, 'Chrome stdout');
	const readStderr = collectBrowserStream(child.stderr, 'Chrome stderr');
	const exitPromise = new Promise((resolve) => {
		child.once('error', (error) => resolve({kind: 'spawn-error', error: serializeError(error)}));
		child.once('close', (code, signal) => resolve({kind: 'exit', code, signal}));
	});
	return {child, exitPromise, readStdout, readStderr};
}

/** Await browser output while advancing progress renews the inactivity lease. */
async function awaitBrowserResult(browser, server) {
	let intervalId;
	const inactivityPromise = new Promise((resolve) => {
		intervalId = setInterval(() => {
			const inactiveMilliseconds = Date.now() - server.lastActivity();
			if (inactiveMilliseconds > INACTIVITY_TIMEOUT_MILLISECONDS) {
				resolve({kind: 'inactivity', inactiveMilliseconds});
			}
		}, 1000);
	});
	const outcome = await Promise.race([
		server.resultPromise.then((value) => ({kind: 'result', value})),
		browser.exitPromise.then((exit) => ({kind: 'exit', exit})),
		inactivityPromise,
	]);
	clearInterval(intervalId);
	if (outcome.kind === 'result') return outcome.value;
	if (outcome.kind === 'inactivity') {
		throw new Error(`Chrome made no measurable progress for ${outcome.inactiveMilliseconds} ms.`);
	}
	throw new Error(`Chrome exited before returning images: ${JSON.stringify(outcome.exit)}.`);
}

/** Stop the completed browser and require terminal process closure. */
async function terminateChrome(browser) {
	if (browser.child.exitCode === null && browser.child.signalCode === null) browser.child.kill('SIGTERM');
	let timeoutId;
	const outcome = await Promise.race([
		browser.exitPromise,
		new Promise((resolve) => {
			timeoutId = setTimeout(() => resolve({kind: 'timeout'}), CHROME_TERMINATION_TIMEOUT_MILLISECONDS);
		}),
	]);
	clearTimeout(timeoutId);
	if (outcome.kind === 'timeout') {
		browser.child.kill('SIGKILL');
		throw new Error('Chrome did not terminate after returning the visual result.');
	}
	requireCondition(outcome.kind === 'exit', 'Chrome did not report a terminal exit.');
	return outcome;
}

/** Decode one strict PNG data URL. */
function decodePngDataUrl(value, label) {
	requireCondition(
		typeof value === 'string' && value.startsWith('data:image/png;base64,'),
		`${label} is not PNG data.`,
	);
	const bytes = Buffer.from(value.slice('data:image/png;base64,'.length), 'base64');
	requireCondition(
		bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
		`${label} has no PNG signature.`,
	);
	return bytes;
}

/** Re-read every served file and require it to remain byte-identical. */
async function verifyServedFiles(servedFiles) {
	for (const [requestPath, expected] of servedFiles) {
		const stats = await lstat(expected.absolutePath);
		requireCondition(stats.isFile() && !stats.isSymbolicLink(), `${requestPath} is no longer a plain file.`);
		const canonicalPath = await realpath(expected.absolutePath);
		requireCondition(
			pathComparisonKey(canonicalPath) === pathComparisonKey(expected.absolutePath),
			`${requestPath} changed real path.`,
		);
		const bytes = await readFile(canonicalPath);
		requireCondition(
			bytes.byteLength === expected.bytes && sha256(bytes) === expected.sha256,
			`${requestPath} changed after it was served.`,
		);
	}
}

/** Create production-tree fingerprints used only as a write-containment guard. */
async function createProductionInventories() {
	return {
		algorithm32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'algorithm32')),
		flat32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'flat32')),
	};
}

/** Execute the direct two-image visual-development loop. */
async function main() {
	await assertRepositoryIdentity();
	await assertExistingRealPathContained(REPOSITORY_ROOT, OUTPUT_ROOT, 'generated output root');
	await assertCreatablePathContained(OUTPUT_ROOT, OUTPUT_PARENT, 'visual output parent');
	await mkdir(OUTPUT_PARENT, {recursive: true});
	await assertExistingRealPathContained(OUTPUT_ROOT, OUTPUT_PARENT, 'visual output parent');
	const outputName = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
	const outputDirectory = path.join(OUTPUT_PARENT, outputName);
	await assertCreatablePathContained(OUTPUT_ROOT, outputDirectory, 'visual output directory');
	await mkdir(outputDirectory, {recursive: false});
	const profileDirectory = path.join(outputDirectory, 'browser-profile');
	await mkdir(profileDirectory, {recursive: false});
	const controlsBefore = await createSelectedFileInventory(EXPERIMENT_ROOT, CONTROL_RELATIVE_PATHS);
	const productionBefore = await createProductionInventories();
	const snapshotFiles = await loadSnapshotFiles();
	const chromePath = await findChrome();
	const chromeBefore = {path: chromePath, sha256: await sha256File(chromePath)};
	const nonce = randomBytes(32).toString('hex');
	const server = await startServer(nonce, snapshotFiles);
	const browser = launchChrome(chromePath, profileDirectory, server.url);
	let browserResult;
	let browserExit;
	try {
		browserResult = await awaitBrowserResult(browser, server);
		browserExit = await terminateChrome(browser);
	} finally {
		if (browser.child.exitCode === null && browser.child.signalCode === null) browser.child.kill('SIGKILL');
		await server.close();
	}
	const stdout = browser.readStdout();
	const stderr = browser.readStderr();
	requireCondition(
		browserResult?.error === undefined,
		browserResult?.error?.message ?? 'Browser visual loop failed.',
	);
	requireCondition(
		browserResult?.schemaVersion === 'flat-local-analytic-disk-raster-gpu-visual-loop-v1',
		'Browser visual-loop schema differs.',
	);
	requireCondition(
		Array.isArray(browserResult.images) && browserResult.images.length === 2,
		'Browser visual loop did not return exactly two images.',
	);
	const expectedConditionIds = ['flat-medium', 'flat-long'];
	const imageSummaries = [];
	for (let index = 0; index < expectedConditionIds.length; index += 1) {
		const image = browserResult.images[index];
		requireCondition(image.conditionId === expectedConditionIds[index], 'Browser image order or identity differs.');
		requireCondition(
			Number.isSafeInteger(image.width) &&
				image.width > 0 &&
				Number.isSafeInteger(image.height) &&
				image.height > 0,
			`${image.conditionId} image dimensions are invalid.`,
		);
		const bytes = decodePngDataUrl(image.pngDataUrl, image.conditionId);
		const fileName = `${image.conditionId}-analytic.png`;
		await writeFile(path.join(outputDirectory, fileName), bytes, {flag: 'wx'});
		imageSummaries.push({
			conditionId: image.conditionId,
			fileName,
			width: image.width,
			height: image.height,
			verticalFovDegrees: image.verticalFovDegrees,
			bytes: bytes.byteLength,
			sha256: sha256(bytes),
			setupDurationMilliseconds: image.setupDurationMilliseconds,
			programPreparationMilliseconds: image.programPreparationMilliseconds,
		});
	}
	await verifyServedFiles(server.servedFiles);
	const controlsAfter = await createSelectedFileInventory(EXPERIMENT_ROOT, CONTROL_RELATIVE_PATHS);
	assertFileInventoriesEqual(controlsBefore, controlsAfter, 'Visual-loop controls');
	const productionAfter = await createProductionInventories();
	assertFileInventoriesEqual(productionBefore.algorithm32, productionAfter.algorithm32, 'Production Algorithm32');
	assertFileInventoriesEqual(productionBefore.flat32, productionAfter.flat32, 'Production Flat32');
	const chromeAfter = {path: await realpath(chromePath), sha256: await sha256File(chromePath)};
	requireCondition(
		pathComparisonKey(chromeAfter.path) === pathComparisonKey(chromeBefore.path) &&
			chromeAfter.sha256 === chromeBefore.sha256,
		'Chrome changed during the visual loop.',
	);
	await assertNoReparseEntries(profileDirectory, 'visual-loop browser profile');
	await rm(profileDirectory, {recursive: true, force: false});
	const summary = {
		schemaVersion: 'flat-local-analytic-disk-raster-gpu-visual-summary-v1',
		generatedAt: new Date().toISOString(),
		command: COMMAND,
		purpose: 'non-qualifying-short-gpu-visual-development-loop',
		renderer: browserResult.renderer,
		images: imageSummaries,
		browser: {
			exit: browserExit,
			stdout,
			stderr,
		},
		identity: {
			controlsAggregateSha256: controlsAfter.aggregateSha256,
			algorithm32AggregateSha256: productionAfter.algorithm32.aggregateSha256,
			flat32AggregateSha256: productionAfter.flat32.aggregateSha256,
			chromeSha256: chromeAfter.sha256,
			servedFileCount: server.servedFiles.size,
		},
	};
	await writeFile(path.join(outputDirectory, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, {
		encoding: 'utf8',
		flag: 'wx',
	});
	process.stdout.write(`${outputDirectory}\n`);
}

main().catch((error) => {
	process.stderr.write(`${error.stack ?? error.message ?? String(error)}\n`);
	process.exitCode = 1;
});
