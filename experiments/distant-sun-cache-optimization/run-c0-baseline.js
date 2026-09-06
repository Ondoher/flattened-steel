#!/usr/bin/env node

import {createReadStream} from 'node:fs';
import {lstat, readFile, realpath, stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {pipeline} from 'node:stream/promises';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import puppeteer from 'puppeteer';
import {
	C0_MEASUREMENT_CONTRACT_PATH,
	CHROME_EXECUTABLE,
	CONTROL_PACKAGE_REPORT_PATH,
	CONTROL_PACKAGE_ROOT,
	EXPERIMENT_SOURCE_ROOT,
	PRODUCTION_DESIGN_PATH,
	PRODUCTION_PLAN_PATH,
	REPOSITORY_ROOT,
} from './consts.js';
import ExperimentRun from './lib/ExperimentRun.js';
import CacheOptimizationContracts from './lib/CacheOptimizationContracts.js';
import CacheOptimizationContainedFiles from './lib/CacheOptimizationContainedFiles.js';

const {
	acceptMeasurementContract,
	acceptBrowserBaselineResult,
	acceptC0Result,
	acceptPackageReport,
	acceptRowLedger,
	acceptRuntimeCatalog,
	acceptSceneManifest,
	requireContractPath,
	requireRecord,
	requireString,
} = CacheOptimizationContracts;
const {requireContainedRealFile, requireRealDirectory, sha256File} = CacheOptimizationContainedFiles;

const executeFile = promisify(execFile);
const COMMAND = 'node experiments/distant-sun-cache-optimization/run-c0-baseline.js';
const RUN_SLUG = 'c0-production-control';
const ROW_BYTE_LENGTH = 4_058 * 15 * 4;
const DELAYED_RESPONSE_MILLISECONDS = 250;
const BROWSER_TIMEOUT_MILLISECONDS = 10 * 60 * 1_000;

/**
 * Require an observable condition.
 *
 * @param {unknown} value - Candidate truthy value.
 * @param {string} message - Failure diagnostic.
 */
function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

/**
 * Read and parse one contained JSON file.
 *
 * @param {string} root - Absolute trusted root.
 * @param {string} relativePath - Root-relative JSON path.
 * @param {string} label - Diagnostic identity.
 * @returns {Promise<unknown>} - Parsed JSON value awaiting boundary validation.
 */
async function readContainedJson(root, relativePath, label) {
	const filePath = await requireContainedRealFile(root, relativePath, label);
	return JSON.parse(await readFile(filePath, 'utf8'));
}

/**
 * Pin one repository file by byte length and SHA-256.
 *
 * @param {string} relativePath - Repository-relative file path.
 * @returns {Promise<CacheOptimizationFileIdentity>} - File identity.
 */
async function pinRepositoryFile(relativePath) {
	const filePath = await requireContainedRealFile(REPOSITORY_ROOT, relativePath, relativePath);
	return {
		path: relativePath,
		byteLength: (await stat(filePath)).size,
		sha256: await sha256File(filePath),
	};
}

/**
 * Capture the current Git identity without modifying repository state.
 *
 * @returns {Promise<CacheOptimizationGitIdentity>} - Commit and dirty-path record.
 */
async function gitIdentity() {
	const [{stdout: commitOutput}, {stdout: statusOutput}] = await Promise.all([
		executeFile('git', ['rev-parse', 'HEAD'], {cwd: REPOSITORY_ROOT, windowsHide: true}),
		executeFile('git', ['status', '--short'], {cwd: REPOSITORY_ROOT, windowsHide: true}),
	]);
	return {
		commit: commitOutput.trim(),
		worktreeStatus: statusOutput.trim().split(/\r?\n/u).filter(Boolean),
	};
}

/**
 * Build the production loader request for one catalog entry.
 *
 * @param {CacheOptimizationCatalogEntry} entry - Deployed catalog entry.
 * @param {boolean} delayed - Whether the proof host delays static responses.
 * @returns {CacheOptimizationBrowserAsset} - Browser asset selection.
 */
function browserAsset(entry, delayed = false) {
	return {
		assetRoot: `/${delayed ? 'delayed-package-root' : 'package-root'}/${entry.assetPath}`,
		loadRequest: {
			manifestPath: entry.manifestPath,
			manifestSha256: entry.manifestSha256,
			cacheIdentity: entry.cacheIdentity,
			expected: entry.expected,
		},
	};
}

/**
 * Build the complete C0 browser control from the deployed catalog.
 *
 * @param {CacheOptimizationRuntimeCatalog} catalog - Deployed runtime catalog.
 * @returns {CacheOptimizationBrowserControl} - Browser lifecycle control.
 */
function browserControl(catalog) {
	const byDegrees = new Map(
		catalog.packages.map((entry) => [entry.representativeSolarZenithDegrees, entry]),
	);
	const select = (degrees) => {
		const entry = byDegrees.get(degrees);
		if (!entry) throw new Error(`Runtime catalog lacks ${degrees}-degree control package.`);
		return entry;
	};
	const cold90 = browserAsset(select(90));
	return {
		catalog,
		assets: {
			cold90,
			adjacent91: browserAsset(select(91)),
			nonadjacent30: browserAsset(select(30)),
			warm90: browserAsset(select(90)),
			delayed91: browserAsset(select(91), true),
			replacement92: browserAsset(select(92)),
			delayed93: browserAsset(select(93), true),
		},
		failedAsset: {
			...cold90,
			loadRequest: {
				...cold90.loadRequest,
				cacheIdentity: `${cold90.loadRequest.cacheIdentity}:c0-incompatible`,
			},
		},
	};
}

/**
 * Authenticate and inventory every deployed package without retaining payload bytes.
 *
 * @param {ExperimentRun} run - Open experiment run.
 * @param {CacheOptimizationPackageReport} packageReport - Deployed package-set report.
 * @param {CacheOptimizationRuntimeCatalog} catalog - Deployed runtime catalog.
 * @returns {Promise<CacheOptimizationInventoryPins>} - Complete immutable inventory pins.
 */
async function authenticateInventory(run, packageReport, catalog) {
	const coordinates = new Set();
	const packages = [];
	let rowOccurrenceCount = 0;
	let totalByteLength = 0;
	const started = performance.now();

	for (let index = 0; index < catalog.packages.length; index += 1) {
		const entry = catalog.packages[index];
		await run.setPhase(
			'inventory-authentication',
			`Authenticating ${entry.id}.`,
			{completed: index, total: catalog.packages.length},
		);
		const manifestRelativePath = `${entry.assetPath}${entry.manifestPath}`;
		const manifestPath = await requireContainedRealFile(
			CONTROL_PACKAGE_ROOT,
			manifestRelativePath,
			`${entry.id} manifest`,
		);
		const manifestBytes = await readFile(manifestPath);
		const manifestSha256 = await sha256File(manifestPath);
		requireCondition(manifestSha256 === entry.manifestSha256, `${entry.id} manifest hash changed.`);
		const manifest = acceptSceneManifest(JSON.parse(manifestBytes.toString('utf8')), `${entry.id} manifest`);
		requireCondition(manifest.cacheIdentity === entry.cacheIdentity, `${entry.id} cache identity changed.`);

		const ledgerRelativePath = `${entry.assetPath}${manifest.ledgerPath}`;
		const ledgerPath = await requireContainedRealFile(
			CONTROL_PACKAGE_ROOT,
			ledgerRelativePath,
			`${entry.id} ledger`,
		);
		const ledgerSha256 = await sha256File(ledgerPath);
		requireCondition(ledgerSha256 === manifest.ledgerSha256, `${entry.id} ledger hash changed.`);
		const ledger = acceptRowLedger(JSON.parse(await readFile(ledgerPath, 'utf8')), `${entry.id} ledger`);
		let packageRowCount = 0;
		for (const row of ledger.rows) {
			requireCondition(
				row.packedRowCount === row.lastSolarZenithIndex - row.firstSolarZenithIndex + 1,
				`${entry.id} ledger row count is inconsistent.`,
			);
			for (
				let solarZenithIndex = row.firstSolarZenithIndex;
				solarZenithIndex <= row.lastSolarZenithIndex;
				solarZenithIndex += 1
			) {
				coordinates.add(`${row.altitudeIndex}:${solarZenithIndex}`);
				packageRowCount += 1;
			}
		}
		requireCondition(
			packageRowCount * ROW_BYTE_LENGTH === manifest.exactSeamPayload.byteLength,
			`${entry.id} spectral row dimensions changed.`,
		);

		const payloadRelativePath = `${entry.assetPath}${manifest.exactSeamPayload.path}`;
		const payloadPath = await requireContainedRealFile(
			CONTROL_PACKAGE_ROOT,
			payloadRelativePath,
			`${entry.id} spectral payload`,
		);
		const payloadInformation = await stat(payloadPath);
		requireCondition(
			payloadInformation.size === manifest.exactSeamPayload.byteLength,
			`${entry.id} spectral payload length changed.`,
		);
		const payloadSha256 = await sha256File(payloadPath);
		requireCondition(
			payloadSha256 === manifest.exactSeamPayload.sha256,
			`${entry.id} spectral payload hash changed.`,
		);

		const indexRelativePath = `${entry.assetPath}${manifest.logicalToUniqueIndex.path}`;
		const indexPath = await requireContainedRealFile(
			CONTROL_PACKAGE_ROOT,
			indexRelativePath,
			`${entry.id} logical-to-unique index`,
		);
		const indexInformation = await stat(indexPath);
		requireCondition(
			indexInformation.size === manifest.logicalToUniqueIndex.byteLength,
			`${entry.id} logical-to-unique index length changed.`,
		);
		const indexSha256 = await sha256File(indexPath);
		requireCondition(
			indexSha256 === manifest.logicalToUniqueIndex.sha256,
			`${entry.id} logical-to-unique index hash changed.`,
		);

		const packageByteLength =
			manifestBytes.byteLength +
			(await stat(ledgerPath)).size +
			payloadInformation.size +
			indexInformation.size;
		requireCondition(packageByteLength === entry.byteLength, `${entry.id} package byte length changed.`);
		totalByteLength += packageByteLength;
		rowOccurrenceCount += packageRowCount;
		packages.push({
			id: entry.id,
			representativeSolarZenithDegrees: entry.representativeSolarZenithDegrees,
			assetPath: entry.assetPath,
			cacheIdentity: entry.cacheIdentity,
			byteLength: packageByteLength,
			rowCount: packageRowCount,
			manifest: {path: manifestRelativePath, byteLength: manifestBytes.byteLength, sha256: manifestSha256},
			ledger: {
				path: ledgerRelativePath,
				byteLength: (await stat(ledgerPath)).size,
				sha256: ledgerSha256,
			},
			payload: {path: payloadRelativePath, byteLength: payloadInformation.size, sha256: payloadSha256},
			logicalToUniqueIndex: {
				path: indexRelativePath,
				byteLength: indexInformation.size,
				sha256: indexSha256,
			},
		});
	}

	requireCondition(packages.length === packageReport.packageCount, 'C0 package count changed.');
	requireCondition(totalByteLength === packageReport.totalByteLength, 'C0 total package bytes changed.');
	requireCondition(coordinates.size === packageReport.sharedCoordinateHashCount, 'C0 coordinate count changed.');
	await run.setPhase(
		'inventory-authentication',
		'Authenticated the complete deployed inventory.',
		{completed: packages.length, total: packages.length},
	);
	return {
		schemaId: 'distant-sun-cache-optimization-c0-inventory-pins-v1',
		accepted: true,
		packageCount: packages.length,
		totalByteLength,
		rowOccurrenceCount,
		distinctCoordinateCount: coordinates.size,
		rowByteLength: ROW_BYTE_LENGTH,
		elapsedMilliseconds: performance.now() - started,
		packages,
	};
}

/**
 * Derive a cumulative proof-host network snapshot.
 *
 * @param {Map<string, CacheOptimizationNetworkPathMetrics>} metrics - Per-path counters.
 * @returns {CacheOptimizationNetworkSnapshot} - Cumulative counters.
 */
function networkSnapshot(metrics) {
	let requestCount = 0;
	let responseByteLength = 0;
	/** @type {CacheOptimizationNetworkPathMap} */
	const paths = {};
	for (const value of metrics.values()) {
		requestCount += value.count;
		responseByteLength += value.byteLength;
	}
	for (const [urlPath, value] of metrics) paths[urlPath] = {...value};
	return {requestCount, responseByteLength, uniqueRequestCount: metrics.size, paths};
}

/**
 * Resolve the response content type for one static artifact.
 *
 * @param {string} target - Absolute static file path.
 * @returns {string} - HTTP content type.
 */
function contentType(target) {
	if (target.endsWith('.js')) return 'text/javascript; charset=utf-8';
	if (target.endsWith('.json')) return 'application/json; charset=utf-8';
	if (target.endsWith('.html')) return 'text/html; charset=utf-8';
	return 'application/octet-stream';
}

/**
 * Wait for a deterministic proof-host delay.
 *
 * @param {number} milliseconds - Delay duration.
 * @returns {Promise<void>} - Completion after the timer.
 */
function delay(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Start sampling Node process resources until the returned owner is stopped.
 *
 * @returns {CacheOptimizationProcessResourceSampler} - Resource-sampling owner.
 */
function startProcessResourceSampler() {
	let peakProcessResidentBytes = 0;
	let peakProcessHeapBytes = 0;
	let stopped = false;
	const sample = () => {
		const memory = process.memoryUsage();
		peakProcessResidentBytes = Math.max(peakProcessResidentBytes, memory.rss);
		peakProcessHeapBytes = Math.max(peakProcessHeapBytes, memory.heapUsed);
	};
	sample();
	const timer = setInterval(sample, 10);
	return {
		stop() {
			if (!stopped) {
				clearInterval(timer);
				sample();
				stopped = true;
			}
			return {peakProcessResidentBytes, peakProcessHeapBytes};
		},
	};
}

/**
 * Create the contained C0 browser proof host.
 *
 * @param {CacheOptimizationBrowserControl} control - Browser control payload.
 * @returns {Promise<CacheOptimizationProofHost>} - Listening server and metric owner.
 */
async function createProofHost(control) {
	const metrics = new Map();
	const errors = [];
	const document =
		'<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="module">const target=document.querySelector("#result");try{const module=await import("/modules/experiment/browser/c0-baseline-browser.js");target.textContent=JSON.stringify(await module.runC0BaselineBrowser());}catch(error){target.textContent=JSON.stringify({error:{name:error?.name??typeof error,message:error?.message??String(error),stack:error?.stack??null}});}</script>';
	const server = createServer(async (request, response) => {
		try {
			if (request.method !== 'GET' && request.method !== 'HEAD') {
				response.writeHead(405, {'content-type': 'text/plain; charset=utf-8', allow: 'GET, HEAD'});
				response.end('Method not allowed.');
				return;
			}
			const url = new URL(request.url, 'http://127.0.0.1');
			if (url.pathname === '/') {
				response.writeHead(200, {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'});
				response.end(document);
				return;
			}
			if (url.pathname === '/favicon.ico') {
				response.writeHead(204, {'cache-control': 'no-store'});
				response.end();
				return;
			}
			if (url.pathname === '/control.json') {
				response.writeHead(200, {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'});
				response.end(JSON.stringify(control));
				return;
			}
			if (url.pathname === '/request-metrics') {
				response.writeHead(200, {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'});
				response.end(JSON.stringify(networkSnapshot(metrics)));
				return;
			}
			const route = [
				{
					prefix: '/modules/experiment/',
					root: EXPERIMENT_SOURCE_ROOT,
					delayed: false,
					allowed: /^(?:browser\/c0-baseline-browser|lib\/CacheOptimizationContracts)\.js$/u,
				},
				{
					prefix: '/modules/algorithm32/',
					root: path.join(REPOSITORY_ROOT, 'src', 'algorithm32'),
					delayed: false,
					allowed: /\.js$/u,
				},
				{
					prefix: '/modules/flat32/',
					root: path.join(REPOSITORY_ROOT, 'src', 'flat32'),
					delayed: false,
					allowed: /^DistantSunSceneCacheResolver\.js$/u,
				},
				{
					prefix: '/modules/vendor/',
					root: path.join(REPOSITORY_ROOT, 'node_modules', 'three', 'build'),
					delayed: false,
					allowed: /^three\.(?:module|core)\.js$/u,
				},
				{prefix: '/package-root/', root: CONTROL_PACKAGE_ROOT, delayed: false},
				{prefix: '/delayed-package-root/', root: CONTROL_PACKAGE_ROOT, delayed: true},
			].find((candidate) => url.pathname.startsWith(candidate.prefix));
			if (!route) throw new Error('C0 static request is outside the declared roots.');
			const relativePath = decodeURIComponent(url.pathname.slice(route.prefix.length));
			requireContractPath(relativePath, 'C0 static request path');
			if (route.allowed && !route.allowed.test(relativePath)) throw new Error('C0 module is not allowlisted.');
			const target = await requireContainedRealFile(route.root, relativePath, 'C0 static target');
			const byteLength = (await stat(target)).size;
			const previous = metrics.get(url.pathname) ?? {count: 0, byteLength: 0};
			metrics.set(url.pathname, {count: previous.count + 1, byteLength: previous.byteLength});
			if (route.delayed) await delay(DELAYED_RESPONSE_MILLISECONDS);
			response.writeHead(200, {
				'content-type': contentType(target),
				'content-length': byteLength,
				'cache-control': 'public, max-age=31536000, immutable',
			});
			if (request.method === 'HEAD') response.end();
			else {
				await pipeline(createReadStream(target), response);
				const completed = metrics.get(url.pathname);
				if (completed) completed.byteLength += byteLength;
			}
		} catch (error) {
			if (response.destroyed) return;
			errors.push({
				url: request.url ?? null,
				name: error?.name ?? typeof error,
				message: error?.message ?? String(error),
				stack: error?.stack ?? null,
			});
			if (!response.headersSent) response.writeHead(404, {'content-type': 'text/plain; charset=utf-8'});
			response.end('Proof resource unavailable.');
		}
	});
	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', () => resolve());
	});
	const address = server.address();
	if (!address || typeof address === 'string') throw new Error('Proof host did not bind a TCP address.');
	return {
		url: `http://127.0.0.1:${address.port}/`,
		server,
		metrics,
		errors,
	};
}

/**
 * Execute the real-browser current-runtime control.
 *
 * @param {ExperimentRun} run - Open experiment run.
 * @param {CacheOptimizationBrowserControl} control - Browser lifecycle control.
 * @returns {Promise<CacheOptimizationBrowserHostResult>} - Browser and host observations.
 */
async function executeBrowserBaseline(run, control) {
	await run.writeJsonArtifact('browser/control.json', control);
	const host = await createProofHost(control);
	const profileRelativePath = 'browser-chrome-profile';
	let profilePath;
	let browser;
	const consoleMessages = [];
	const started = performance.now();
	/** @type {CacheOptimizationBrowserHostResult | undefined} */
	let outcome;
	let executionError;
	try {
		const policyChecks = [];
		for (const request of [
			{path: '', method: 'POST', status: 405, body: 'Method not allowed.'},
			{path: 'modules/experiment/AGENTS.md', method: 'GET', status: 404, body: 'Proof resource unavailable.'},
			{path: 'modules/algorithm32/.git/config', method: 'GET', status: 404, body: 'Proof resource unavailable.'},
		]) {
			const response = await fetch(`${host.url}${request.path}`, {method: request.method});
			const body = await response.text();
			requireCondition(response.status === request.status && body === request.body, 'Proof-host ingress policy changed.');
			policyChecks.push({...request, observedStatus: response.status, observedBody: body});
		}
		await run.writeJsonArtifact('browser/proof-host-policy.json', {
			schemaId: 'distant-sun-cache-optimization-proof-host-policy-v1',
			accepted: true,
			checks: policyChecks,
		});
		host.errors.length = 0;
		profilePath = await run.createScratchDirectory(profileRelativePath);
		browser = await puppeteer.launch({
			executablePath: CHROME_EXECUTABLE,
			headless: 'new',
			userDataDir: profilePath,
			protocolTimeout: BROWSER_TIMEOUT_MILLISECONDS,
			args: [
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--use-angle=d3d11',
				'--disable-software-rasterizer',
				'--enable-precise-memory-info',
				'--disable-background-networking',
				'--disable-component-update',
				'--no-first-run',
			],
		});
		const page = await browser.newPage();
		await page.setCacheEnabled(true);
		page.on('console', (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
		page.on('pageerror', (error) => consoleMessages.push(`pageerror: ${error.message}`));
		page.on('requestfailed', (request) =>
			consoleMessages.push(`requestfailed: ${request.url()} - ${request.failure()?.errorText ?? 'unknown'}`),
		);
		await page.goto(host.url, {waitUntil: 'load', timeout: BROWSER_TIMEOUT_MILLISECONDS});
		await page.waitForFunction(() => document.querySelector('#result')?.textContent !== 'pending', {
			timeout: BROWSER_TIMEOUT_MILLISECONDS,
		});
		const resultText = await page.$eval('#result', (element) => element.textContent);
		await run.writeArtifact('browser/dom.html', await page.content());
		await run.writeJsonArtifact('browser/console.json', consoleMessages);
		await run.writeJsonArtifact('browser/proof-host-errors.json', host.errors);
		const result = requireRecord(JSON.parse(resultText), 'Browser document result');
		if (result.error) {
			const error = requireRecord(result.error, 'Browser document error');
			throw new Error(`${error.name}: ${error.message}\n${error.stack ?? ''}`);
		}
		const browserResult = acceptBrowserBaselineResult(result);
		outcome = {
			schemaId: 'distant-sun-cache-optimization-c0-browser-host-result-v1',
			accepted: true,
			browserVersion: await browser.version(),
			hostWallMilliseconds: performance.now() - started,
			requestTotals: networkSnapshot(host.metrics),
			consoleMessages,
			result: browserResult,
		};
	} catch (error) {
		executionError = error;
	} finally {
		const cleanupErrors = [];
		try {
			await browser?.close();
		} catch (error) {
			cleanupErrors.push(error);
		}
		try {
			await new Promise((resolve, reject) => host.server.close((error) => (error ? reject(error) : resolve())));
		} catch (error) {
			cleanupErrors.push(error);
		}
		if (profilePath) {
			try {
				await run.removeScratchDirectory(profileRelativePath);
			} catch (error) {
				cleanupErrors.push(error);
			}
		}
		if (executionError && cleanupErrors.length) {
			throw new AggregateError([executionError, ...cleanupErrors], 'Browser execution and resource cleanup failed.');
		}
		if (executionError) throw executionError;
		if (cleanupErrors.length) throw new AggregateError(cleanupErrors, 'Browser resource cleanup failed.');
	}
	if (!outcome) throw new Error('Browser execution ended without a result.');
	return outcome;
}

/**
 * Compose the human-readable terminal C0 report.
 *
 * @param {CacheOptimizationC0Result} result - Terminal C0 result.
 * @returns {string} - Markdown report.
 */
function report(result) {
	const inventory = result.inventory;
	const browser = result.browser;
	return `# ${result.runId}: C0 Production Control\n\nConclusion: **${result.conclusion}**.\n\n## Inventory\n\n- Packages: ${inventory.packageCount}\n- Authenticated bytes: ${inventory.totalByteLength}\n- Stored row occurrences: ${inventory.rowOccurrenceCount}\n- Distinct coordinates: ${inventory.distinctCoordinateCount}\n- Authentication time: ${inventory.elapsedMilliseconds.toFixed(3)} ms\n\n## Browser Control\n\n- Browser: ${browser.browserVersion}\n- GPU: ${browser.result.gpu.renderer}\n- Host wall time: ${browser.hostWallMilliseconds.toFixed(3)} ms\n- Measured static requests: ${browser.requestTotals.requestCount}\n- Measured response bytes: ${browser.requestTotals.responseByteLength}\n- Lifecycle scenarios: ${browser.result.stages.length}\n- Dark boundary: ready below 108 degrees; dark at and above 108 degrees\n\nThis run records the unchanged production package and runtime control. It does not qualify a cache optimization candidate.\n`;
}

/**
 * Execute and seal the C0 production control.
 *
 * @returns {Promise<void>} - Completion after terminal publication.
 */
async function main() {
	await Promise.all([
		requireRealDirectory(EXPERIMENT_SOURCE_ROOT, 'Experiment source root'),
		requireRealDirectory(CONTROL_PACKAGE_ROOT, 'Control package root'),
		lstat(CHROME_EXECUTABLE),
	]);
	const [measurementContract, packageReport, git, sourcePins, chromeSha256] = await Promise.all([
		readContainedJson(REPOSITORY_ROOT, C0_MEASUREMENT_CONTRACT_PATH, 'C0 measurement contract').then(
			acceptMeasurementContract,
		),
		readContainedJson(REPOSITORY_ROOT, CONTROL_PACKAGE_REPORT_PATH, 'Control package report').then(
			acceptPackageReport,
		),
		gitIdentity(),
		Promise.all(
			[
				C0_MEASUREMENT_CONTRACT_PATH,
				'experiments/distant-sun-cache-optimization/consts.js',
				'experiments/distant-sun-cache-optimization/types.d.ts',
				'experiments/distant-sun-cache-optimization/lib/CacheOptimizationContracts.js',
				'experiments/distant-sun-cache-optimization/lib/CacheOptimizationContainedFiles.js',
				PRODUCTION_DESIGN_PATH,
				PRODUCTION_PLAN_PATH,
				'experiments/distant-sun-cache-optimization/run-c0-baseline.js',
				'experiments/distant-sun-cache-optimization/browser/c0-baseline-browser.js',
				'experiments/distant-sun-cache-optimization/lib/ExperimentRun.js',
				'experiments/distant-sun-cache-optimization/lib/ExperimentRunAllocation.js',
				'experiments/distant-sun-cache-optimization/lib/ExperimentRunHeartbeat.js',
				'experiments/distant-sun-cache-optimization/lib/ExperimentRunTerminalPublisher.js',
				'node_modules/puppeteer/package.json',
				'node_modules/puppeteer/lib/cjs/puppeteer/puppeteer.js',
				'node_modules/three/package.json',
				'node_modules/three/build/three.module.js',
				'node_modules/three/build/three.core.js',
				'package-lock.json',
				'src/algorithm32/implementation/distant-sun/cache/consts.js',
				'src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheAssetLoader.js',
				'src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheController.js',
				'src/flat32/DistantSunSceneCacheResolver.js',
				'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheCompilerInputs.js',
				'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js',
				'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheOfflineCompiler.js',
				'scripts/algorithm32/solar-zenith-cache/build-one-degree-scene-cache-inventory.js',
				'scripts/algorithm32/solar-zenith-cache/assemble-bin-covered-runtime-packages.js',
			].map(pinRepositoryFile),
		),
		sha256File(CHROME_EXECUTABLE),
	]);
	const puppeteerPackage = requireRecord(
		await readContainedJson(REPOSITORY_ROOT, 'node_modules/puppeteer/package.json', 'Puppeteer package'),
		'Puppeteer package',
	);
	const threePackage = requireRecord(
		await readContainedJson(REPOSITORY_ROOT, 'node_modules/three/package.json', 'Three package'),
		'Three package',
	);
	const catalog = acceptRuntimeCatalog(
		await readContainedJson(CONTROL_PACKAGE_ROOT, packageReport.catalogPath, 'Control runtime catalog'),
	);
	const run = await ExperimentRun.create({
		slug: RUN_SLUG,
		command: COMMAND,
		inputs: {
			schemaId: 'distant-sun-cache-optimization-c0-inputs-v1',
			measurementContract,
			packageRoot: path.relative(REPOSITORY_ROOT, CONTROL_PACKAGE_ROOT).replaceAll('\\', '/'),
			packageReport,
			catalogPath: packageReport.catalogPath,
			expectedCatalogSha256: packageReport.catalogSha256,
			scenarios: measurementContract.runtimeScenarios,
		},
		provenance: {
			schemaId: 'distant-sun-cache-optimization-c0-provenance-v1',
			operation:
				'stream-authenticate every deployed package artifact, independently union ledger coordinates, and exercise the unchanged production loader, controller, resolver, and GPU backend in a cold Chrome profile',
			implementation: sourcePins,
			git,
		},
		environment: {
			schemaId: 'distant-sun-cache-optimization-c0-environment-v1',
			node: process.version,
			versions: process.versions,
			platform: process.platform,
			architecture: process.arch,
			logicalCpuCount: os.cpus().length,
			cpuModel: os.cpus()[0]?.model ?? null,
			totalMemoryBytes: os.totalmem(),
			dependencies: {
				puppeteer: {
					version: requireString(puppeteerPackage.version, 'Puppeteer version'),
					package: sourcePins.find((item) => item.path === 'node_modules/puppeteer/package.json'),
					module: sourcePins.find(
						(item) => item.path === 'node_modules/puppeteer/lib/cjs/puppeteer/puppeteer.js',
					),
				},
				three: {
					version: requireString(threePackage.version, 'Three version'),
					package: sourcePins.find((item) => item.path === 'node_modules/three/package.json'),
					module: sourcePins.find((item) => item.path === 'node_modules/three/build/three.module.js'),
					coreModule: sourcePins.find((item) => item.path === 'node_modules/three/build/three.core.js'),
				},
				lockfile: sourcePins.find((item) => item.path === 'package-lock.json'),
			},
			chrome: {path: CHROME_EXECUTABLE, sha256: chromeSha256},
			angleBackend: 'd3d11',
		},
		references: {
			schemaId: 'distant-sun-cache-optimization-c0-references-v1',
			measurementContract: sourcePins.find((item) => item.path === C0_MEASUREMENT_CONTRACT_PATH),
			productionDesign: sourcePins.find((item) => item.path === PRODUCTION_DESIGN_PATH),
			productionPlan: sourcePins.find((item) => item.path === PRODUCTION_PLAN_PATH),
			packageReport: CONTROL_PACKAGE_REPORT_PATH,
		},
	});
	run.startHeartbeat();
	const processResources = startProcessResourceSampler();
	try {
		const catalogPath = await requireContainedRealFile(
			CONTROL_PACKAGE_ROOT,
			packageReport.catalogPath,
			'Control runtime catalog',
		);
		const catalogSha256 = await sha256File(catalogPath);
		requireCondition(catalogSha256 === packageReport.catalogSha256, 'Control catalog hash changed.');
		await run.writeJsonArtifact('evidence/package-set-identity.json', {
			schemaId: 'distant-sun-cache-optimization-c0-package-set-identity-v1',
			packageReport: await pinRepositoryFile(CONTROL_PACKAGE_REPORT_PATH),
			catalog: {
				path: `${path.relative(REPOSITORY_ROOT, CONTROL_PACKAGE_ROOT).replaceAll('\\', '/')}/${packageReport.catalogPath}`,
				byteLength: (await stat(catalogPath)).size,
				sha256: catalogSha256,
			},
		});

		const inventory = await authenticateInventory(run, packageReport, catalog);
		await run.writeJsonArtifact('evidence/inventory-pins.json', inventory);
		await run.setPhase('browser-control', 'Executing the current production browser lifecycle control.');
		const browser = await executeBrowserBaseline(run, browserControl(catalog));
		requireCondition(browser.accepted === true, 'C0 browser control did not accept.');
		await run.writeJsonArtifact('evidence/browser-baseline.json', browser);
		const processPeaks = processResources.stop();
		const peakBrowserHeapBytes = Math.max(
			...browser.result.stages.map((stage) => stage.peakBrowserHeapBytes ?? 0),
		);
		const peakGpuResidentBytes = Math.max(
			...browser.result.stages.map((stage) => {
				const value = requireRecord(stage.value, `${stage.id} value`);
				if (!value.resources) return 0;
				const resources = requireRecord(value.resources, `${stage.id} resources`);
				const transition = requireRecord(
					resources.lastTransitionTextureBytes,
					`${stage.id} transition bytes`,
				);
				return Number(transition.value);
			}),
		);
		const coldStage = browser.result.stages.find((stage) => stage.id === 'cold-90');
		requireCondition(coldStage, 'C0 browser result lacks the cold stage.');
		const result = acceptC0Result({
			schemaId: 'distant-sun-cache-optimization-c0-result-v2',
			runId: run.runId,
			conclusion: 'accepted',
			accepted: true,
			inventory: {
				packageCount: inventory.packageCount,
				totalByteLength: inventory.totalByteLength,
				rowOccurrenceCount: inventory.rowOccurrenceCount,
				distinctCoordinateCount: inventory.distinctCoordinateCount,
				rowByteLength: inventory.rowByteLength,
				elapsedMilliseconds: inventory.elapsedMilliseconds,
			},
			browser,
			measurements: {
				storage: {
					artifactCount: inventory.packageCount * 4 + 2,
					byteLength:
						inventory.totalByteLength + (await stat(catalogPath)).size + (await stat(await requireContainedRealFile(REPOSITORY_ROOT, CONTROL_PACKAGE_REPORT_PATH, 'Control package report'))).size,
				},
				transport: {
					requestCount: browser.requestTotals.requestCount,
					responseByteLength: browser.requestTotals.responseByteLength,
					uniqueRequestCount: browser.requestTotals.uniqueRequestCount,
				},
				latency: {
					browserElapsedMilliseconds: coldStage.browserElapsedMilliseconds,
					hostWallMilliseconds: browser.hostWallMilliseconds,
				},
				codec: {
					encodeMilliseconds: null,
					decodeMilliseconds: null,
					inverseShuffleMilliseconds: null,
					workerQueueMilliseconds: null,
				},
				memory: {
					browserHeapBeforeBytes: coldStage.browserHeapBeforeBytes,
					browserHeapAfterBytes: coldStage.browserHeapAfterBytes,
					peakBrowserHeapBytes,
					peakWorkerHeapBytes: null,
					...processPeaks,
					peakGpuResidentBytes,
					peakDiskStagingBytes: null,
					activeResidentTextureBytes: browser.result.finalResources.activeResidentTextureBytes.value,
					lastTransitionTextureBytes: browser.result.finalResources.lastTransitionTextureBytes.value,
					lastTransitionWithStagingBytes:
						browser.result.finalResources.lastTransitionWithStagingBytes.value,
				},
				generation: {
					setupMilliseconds: null,
					calculationMilliseconds: null,
					readbackMilliseconds: null,
					stagingMilliseconds: null,
					encodingMilliseconds: null,
					validationMilliseconds: null,
					publicationMilliseconds: null,
					totalMilliseconds: null,
				},
				exactness: {
					checkedByteLength: inventory.totalByteLength,
					expectedSha256: packageReport.catalogSha256,
					actualSha256: catalogSha256,
					matches: true,
				},
			},
			claimBoundary:
				'Current exact production storage and lifecycle control only; no shared-block, compression, generation-speed, or promotion claim.',
		});
		const manifest = await run.finalize({conclusion: 'accepted', result, report: report(result)});
		process.stdout.write(
			`${JSON.stringify({
				runId: run.runId,
				conclusion: 'accepted',
				artifactSetSha256: manifest.artifactSetSha256,
				inventory: result.inventory,
				browser: {
					version: browser.browserVersion,
					gpu: browser.result.gpu,
					hostWallMilliseconds: browser.hostWallMilliseconds,
					requestTotals: browser.requestTotals,
				},
			}, null, 2)}\n`,
		);
	} catch (error) {
		processResources.stop();
		/** @type {CacheOptimizationTerminalResult} */
		const failure = {
			schemaId: 'distant-sun-cache-optimization-c0-result-v1',
			runId: run.runId,
			conclusion: 'failed',
			accepted: false,
			error: {name: error?.name ?? typeof error, message: error?.message ?? String(error), stack: error?.stack ?? null},
		};
		await run.finalize({
			conclusion: 'failed',
			result: failure,
			report: `# ${run.runId}: C0 Production Control\n\nConclusion: **failed**.\n\n${error.name}: ${error.message}\n`,
		});
		throw error;
	}
}

await main();
