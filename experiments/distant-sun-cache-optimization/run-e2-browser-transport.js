#!/usr/bin/env node

import {createReadStream} from 'node:fs';
import {readFile, stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {pipeline} from 'node:stream/promises';
import puppeteer from 'puppeteer';
import {
	EXPERIMENT_OUTPUT_ROOT,
	EXPERIMENT_SOURCE_ROOT,
	REPOSITORY_ROOT,
} from './consts.js';
import ExperimentRun from './lib/ExperimentRun.js';
import CacheOptimizationContainedFiles from './lib/CacheOptimizationContainedFiles.js';
import CacheOptimizationContracts from './lib/CacheOptimizationContracts.js';
import {verifySealedRun} from './verify-run.js';

const {requireContainedRealFile, requireRealDirectory, sha256File} = CacheOptimizationContainedFiles;
const {acceptE2BrowserResult, requireContractPath, requireRecord, requireString} = CacheOptimizationContracts;
const COMMAND = 'node experiments/distant-sun-cache-optimization/run-e2-browser-transport.js';
const RUN_SLUG = 'e2-browser-transport';
const E1_RUN_ID = '000041-e1-format-compression';
const E1_ARTIFACT_SET_SHA256 = '19d79885512d628ad874501b3c854b86eae2dfc374910bdae1dbc6569c96cf4a';
const E1_CANDIDATE_ROOT = path.join(EXPERIMENT_OUTPUT_ROOT, 'runs', E1_RUN_ID, 'candidate');
const BROWSER_TIMEOUT_MILLISECONDS = 10 * 60 * 1_000;
const DELAY_MILLISECONDS = 250;
const BROWSER_DEBUG_URL = process.env.E2_BROWSER_DEBUG_URL ?? 'http://127.0.0.1:9224';

/** @param {unknown} value - Condition. @param {string} message - Failure diagnostic. */
function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

/** @param {string} relativePath - Repository relative path. @returns {Promise<CacheOptimizationFileIdentity>} - Pinned file identity. */
async function pinRepositoryFile(relativePath) {
	const target = await requireContainedRealFile(REPOSITORY_ROOT, relativePath, relativePath);
	return {path: relativePath, byteLength: (await stat(target)).size, sha256: await sha256File(target)};
}

/**
 * Read the checked-out commit without spawning a child process from the contained runner.
 * The runner separately pins every implementation input; the host-owned invocation records dirty state outside the child-process sandbox.
 *
 * @returns {Promise<CacheOptimizationGitIdentity>} - Current commit and an explicit worktree-observation boundary.
 */
async function gitIdentity() {
	const head = (await readFile(path.join(REPOSITORY_ROOT, '.git', 'HEAD'), 'utf8')).trim();
	const reference = /^ref: (.+)$/u.exec(head)?.[1];
	const commit = reference
		? (await readFile(path.join(REPOSITORY_ROOT, '.git', ...reference.split('/')), 'utf8')).trim()
		: head;
	if (!/^[0-9a-f]{40}$/u.test(commit)) throw new Error('E2 could not read the checked-out Git commit identity.');
	return {
		commit,
		worktreeStatus: ['Not sampled inside the contained runner; all implementation inputs are byte-pinned.'],
	};
}

/** @param {string} target - Static file path. @returns {string} - Response content type. */
function contentType(target) {
	if (target.endsWith('.js')) return 'text/javascript; charset=utf-8';
	if (target.endsWith('.json')) return 'application/json; charset=utf-8';
	return 'application/octet-stream';
}

/** @param {number} milliseconds - Delay duration. @returns {Promise<void>} - Completion after delay. */
function delay(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Create a loopback-only E2 host. It exposes only browser proof modules, the selected pinned decoder, and immutable E1 candidate bytes.
 *
 * @returns {Promise<{url: string, server: import('node:http').Server, errors: Array<Record<string, unknown>>}>} - Listening proof host.
 */
async function createProofHost() {
	const errors = [];
	const document = '<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="module">const target=document.querySelector("#result");try{const module=await import("/modules/experiment/browser/e2-browser.js");target.textContent=JSON.stringify(await module.runE2Browser());}catch(error){target.textContent=JSON.stringify({error:{name:error?.name??typeof error,message:error?.message??String(error),stack:error?.stack??null}});}</script>';
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
			const route = [
				{
					prefix: '/modules/experiment/',
					root: EXPERIMENT_SOURCE_ROOT,
					delayed: false,
					corrupt: false,
					allowed: /^browser\/(?:e2-browser|e2-decode-worker)\.js$/u,
				},
				{
					prefix: '/modules/vendor/',
					root: path.join(REPOSITORY_ROOT, 'node_modules', 'three', 'examples', 'jsm', 'libs'),
					delayed: false,
					corrupt: false,
					allowed: /^zstddec\.module\.js$/u,
				},
				{prefix: '/candidate/', root: E1_CANDIDATE_ROOT, delayed: false, corrupt: false},
				{prefix: '/delayed-candidate/', root: E1_CANDIDATE_ROOT, delayed: true, corrupt: false},
				{prefix: '/corrupt-candidate/', root: E1_CANDIDATE_ROOT, delayed: false, corrupt: true},
			].find((candidate) => url.pathname.startsWith(candidate.prefix));
			if (!route) throw new Error('E2 static request is outside declared proof roots.');
			const relativePath = decodeURIComponent(url.pathname.slice(route.prefix.length));
			requireContractPath(relativePath, 'E2 static request path');
			if (route.allowed && !route.allowed.test(relativePath)) throw new Error('E2 module is not allowlisted.');
			const target = await requireContainedRealFile(route.root, relativePath, 'E2 static target');
			if (route.delayed) await delay(DELAY_MILLISECONDS);
			if (route.corrupt && relativePath.startsWith('blocks/')) {
				const bytes = new Uint8Array(await readFile(target));
				if (bytes.byteLength === 0) throw new Error('E2 corruption target is empty.');
				bytes[0] ^= 0xff;
				response.writeHead(200, {'content-type': contentType(target), 'content-length': bytes.byteLength, 'cache-control': 'no-store'});
				response.end(bytes);
				return;
			}
			const byteLength = (await stat(target)).size;
			response.writeHead(200, {
				'content-type': contentType(target),
				'content-length': byteLength,
				'cache-control': 'public, max-age=31536000, immutable',
			});
			if (request.method === 'HEAD') response.end();
			else await pipeline(createReadStream(target), response);
		} catch (error) {
			if (response.destroyed) return;
			errors.push({url: request.url ?? null, name: error?.name ?? typeof error, message: error?.message ?? String(error), stack: error?.stack ?? null});
			if (!response.headersSent) response.writeHead(404, {'content-type': 'text/plain; charset=utf-8'});
			response.end('Proof resource unavailable.');
		}
	});
	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', () => resolve());
	});
	const address = server.address();
	if (!address || typeof address === 'string') throw new Error('E2 proof host did not bind a TCP address.');
	return {url: `http://127.0.0.1:${address.port}/`, server, errors};
}

/**
 * Execute the browser proof and retain raw browser evidence in the owned run.
 *
 * @param {ExperimentRun} run - Open immutable E2 evidence run.
 * @returns {Promise<CacheOptimizationE2BrowserResult>} - Browser evidence.
 */
async function executeBrowserProof(run) {
	const host = await createProofHost();
	let browser;
	let page;
	const consoleMessages = [];
	try {
		browser = await puppeteer.connect({browserURL: BROWSER_DEBUG_URL, protocolTimeout: BROWSER_TIMEOUT_MILLISECONDS});
		page = await browser.newPage();
		await page.setCacheEnabled(true);
		page.on('console', (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
		page.on('pageerror', (error) => consoleMessages.push(`pageerror: ${error.message}`));
		page.on('requestfailed', (request) => consoleMessages.push(`requestfailed: ${request.url()} - ${request.failure()?.errorText ?? 'unknown'}`));
		await page.goto(host.url, {waitUntil: 'load', timeout: BROWSER_TIMEOUT_MILLISECONDS});
		await page.waitForFunction(() => document.querySelector('#result')?.textContent !== 'pending', {timeout: BROWSER_TIMEOUT_MILLISECONDS});
		const resultText = await page.$eval('#result', (element) => element.textContent);
		await run.writeArtifact('browser/dom.html', await page.content());
		await run.writeJsonArtifact('browser/console.json', consoleMessages);
		await run.writeJsonArtifact('browser/proof-host-errors.json', /** @type {CacheOptimizationJsonValue} */ (/** @type {unknown} */ (host.errors)));
		const result = requireRecord(JSON.parse(resultText), 'E2 browser document result');
		if (result.error) {
			const error = requireRecord(result.error, 'E2 browser document error');
			throw new Error(`${error.name}: ${error.message}\n${error.stack ?? ''}`);
		}
		if (consoleMessages.some((message) => message.startsWith('pageerror:') || message.startsWith('error:'))) throw new Error('E2 browser emitted an unhandled console or page error.');
		return acceptE2BrowserResult(result);
	} finally {
		await page?.close();
		browser?.disconnect();
		await new Promise((resolve, reject) => host.server.close((error) => (error ? reject(error) : resolve())));
	}
}

/** @param {Record<string, unknown>} result - Accepted E2 result. @returns {string} - Human-readable terminal report. */
function report(result) {
	const browser = acceptE2BrowserResult(result.browser);
	return `# ${result.runId}: E2 Browser Transport\n\nConclusion: **accepted**.\n\n- Decoder: ${browser.decoder.selected}\n- Native Zstandard supported: ${browser.decoder.nativeZstandardSupported}\n- Scheduler concurrency: ${browser.concurrency}\n- Retained decoded bytes: ${browser.retainedBytes}\n- Per-scene decompaction records: ${browser.perSceneDecompaction.length}\n\nThe browser Worker decoded actual sealed E1 blocks, inverse-shuffled them, reconstructed selected scene payloads exactly, measured texture upload and publication, retained an LRU bounded after transaction pins, and preserved the last-good publication during corruption, cancellation, and stale-response exercises.\n`;
}

/** Run the complete contained E2 evidence lifecycle. */
async function main() {
	await Promise.all([requireRealDirectory(EXPERIMENT_SOURCE_ROOT, 'Experiment source root'), requireRealDirectory(E1_CANDIDATE_ROOT, 'Accepted E1 candidate root')]);
	const e1Verification = await verifySealedRun(path.join(EXPERIMENT_OUTPUT_ROOT, 'runs', E1_RUN_ID), E1_RUN_ID);
	requireCondition(e1Verification.artifactSetSha256 === E1_ARTIFACT_SET_SHA256 && e1Verification.conclusion === 'accepted', 'Accepted E1 parent identity changed.');
	const [git, implementation] = await Promise.all([
		gitIdentity(),
		Promise.all([
			'experiments/distant-sun-cache-optimization/consts.js',
			'experiments/distant-sun-cache-optimization/types.d.ts',
			'experiments/distant-sun-cache-optimization/lib/CacheOptimizationContracts.js',
			'experiments/distant-sun-cache-optimization/lib/CacheOptimizationContainedFiles.js',
			'experiments/distant-sun-cache-optimization/lib/ExperimentRun.js',
			'experiments/distant-sun-cache-optimization/lib/ExperimentRunAllocation.js',
			'experiments/distant-sun-cache-optimization/lib/ExperimentRunHeartbeat.js',
			'experiments/distant-sun-cache-optimization/lib/ExperimentRunTerminalPublisher.js',
			'experiments/distant-sun-cache-optimization/browser/e2-browser.js',
			'experiments/distant-sun-cache-optimization/browser/e2-decode-worker.js',
			'experiments/distant-sun-cache-optimization/run-e2-browser-transport.js',
			'experiments/distant-sun-cache-optimization/verify-run.js',
		].map(pinRepositoryFile)),
	]);
	const run = await ExperimentRun.create({
		slug: RUN_SLUG,
		command: COMMAND,
		inputs: {schemaId: 'distant-sun-cache-optimization-e2-inputs-v1', acceptedE1: {runId: E1_RUN_ID, artifactSetSha256: E1_ARTIFACT_SET_SHA256}},
		provenance: {schemaId: 'distant-sun-cache-optimization-e2-provenance-v1', operation: 'serve sealed E1 blocks to a loopback browser, decode and inverse-shuffle in one persistent Worker with transferred buffers, reconstruct selected scenes exactly, and exercise scheduler, coalescing, LRU, failure, cancellation, and transactional publication', implementation, git},
		environment: {schemaId: 'distant-sun-cache-optimization-e2-environment-v1', node: process.version, versions: process.versions, platform: process.platform, architecture: process.arch, logicalCpuCount: os.cpus().length, cpuModel: os.cpus()[0]?.model ?? null, totalMemoryBytes: os.totalmem()},
		references: {schemaId: 'distant-sun-cache-optimization-e2-references-v1', acceptedE1: {runId: E1_RUN_ID, artifactSetSha256: E1_ARTIFACT_SET_SHA256}, decoder: {path: 'node_modules/three/examples/jsm/libs/zstddec.module.js', package: 'three', version: '0.180.0', license: 'MIT', identity: 'three-r180-zstddec-wasm'}},
	});
	run.startHeartbeat();
	try {
		await run.setPhase('browser-transport', 'Executing contained E2 browser decode and transport scenarios.');
		const browser = await executeBrowserProof(run);
		requireCondition(browser.retainedBytes <= 64 * 1024 * 1024, 'E2 decoded LRU remained above its 64 MiB target after transactions completed.');
		const records = browser.perSceneDecompaction;
		requireCondition(records.length >= 7, 'E2 per-scene decompaction evidence is incomplete.');
		await run.writeJsonArtifact('evidence/browser-transport.json', /** @type {CacheOptimizationJsonValue} */ (/** @type {unknown} */ (browser)));
		const result = {
			schemaId: 'distant-sun-cache-optimization-e2-result-v1',
			runId: run.runId,
			conclusion: /** @type {'accepted'} */ ('accepted'),
			accepted: true,
			parent: {runId: E1_RUN_ID, artifactSetSha256: E1_ARTIFACT_SET_SHA256},
			browser: /** @type {CacheOptimizationJsonValue} */ (/** @type {unknown} */ (browser)),
			claimBoundary: 'Contained E2 browser transport evidence only; production integration and bounded fresh generation remain unqualified.',
		};
		const manifest = await run.finalize({conclusion: 'accepted', result, report: report(result)});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: result.conclusion, artifactSetSha256: manifest.artifactSetSha256, retainedBytes: browser.retainedBytes, records: records.length}, null, 2)}\n`);
	} catch (error) {
		const result = {schemaId: 'distant-sun-cache-optimization-e2-result-v1', runId: run.runId, conclusion: /** @type {'failed'} */ ('failed'), accepted: false, error: {name: error?.name ?? typeof error, message: error?.message ?? String(error), stack: error?.stack ?? null}};
		await run.finalize({conclusion: 'failed', result, report: `# ${run.runId}: E2 Browser Transport\n\nConclusion: **failed**.\n\n${requireString(result.error.name, 'Error name')}: ${requireString(result.error.message, 'Error message')}\n`});
		throw error;
	}
}

await main();
