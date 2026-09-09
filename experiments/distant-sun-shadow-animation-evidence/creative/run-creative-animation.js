#!/usr/bin/env node

import {appendFile, mkdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import puppeteer from 'puppeteer';

import {ArtifactManifest} from '../../../scripts/animation-evidence/ArtifactManifest.js';
import {CHROME_EXECUTABLE, REPOSITORY_ROOT} from '../consts.js';
import {CreativeArtifactWriter} from './node/CreativeArtifactWriter.js';
import {CreativeModuleHost} from './node/CreativeModuleHost.js';
import {CreativeResponseInputs} from './node/CreativeResponseInputs.js';
import {CreativeRunFiles} from './node/CreativeRunFiles.js';

/**
 * Called by the launcher to parse native output selection without allocating a run.
 *
 * @param {readonly string[]} argumentsList - Command-line arguments after the script path.
 * @returns {CreativeNodeOptions | undefined} - Selected output, or undefined for help.
 */
function parseOptions(argumentsList) {
	if (argumentsList.length === 1 && argumentsList[0] === '--help') return undefined;
	/** @type {CreativeNodeMode | undefined} */
	let mode;
	let width;
	let height;
	for (let argumentIndex = 0; argumentIndex < argumentsList.length; argumentIndex += 1) {
		const argument = argumentsList[argumentIndex];
		if (argument === '--preview' || argument === '--video') {
			if (mode) throw new Error('Select exactly one of --preview or --video.');
			mode = argument === '--preview' ? 'preview' : 'video';
		} else if (argument === '--width' || argument === '--height') {
			const value = Number(argumentsList[++argumentIndex]);
			if (!Number.isSafeInteger(value) || value < 320 || value > 3840 || value % 2 !== 0) {
				throw new Error('Preview dimensions must be even integers between 320 and 3840.');
			}
			if (argument === '--width') {
				if (width !== undefined) throw new Error('Preview width was supplied more than once.');
				width = value;
			} else {
				if (height !== undefined) throw new Error('Preview height was supplied more than once.');
				height = value;
			}
		} else throw new Error(`Unknown creative-render argument: ${argument}.`);
	}
	if (!mode) throw new Error('Select --preview or --video. Use --help for launcher usage.');
	if (mode === 'video' && (width !== undefined || height !== undefined)) {
		throw new Error('Final video is fixed at native 3840 by 2160; dimension flags are preview-only.');
	}
	return {mode, width: width ?? (mode === 'video' ? 3840 : 1920), height: height ?? (mode === 'video' ? 2160 : 1080)};
}

/**
 * Called by the launcher to snapshot its source and read-only rendering parents.
 *
 * @param {string} repositoryRoot - Canonical repository root derived from checked-in source.
 * @returns {Promise<CreativeNodeInputs>} - Pinned module bytes and parent file identities.
 */
async function snapshotInputs(repositoryRoot) {
	const creativeRoot = 'experiments/distant-sun-shadow-animation-evidence/creative';
	const mediabunnyRoot = 'experiments/gpu-resident-shared-block-cache/node_modules/mediabunny';
	const mediabunnyPath = `${mediabunnyRoot}/dist/bundles/mediabunny.min.mjs`;
	const files = new Set([
		'AGENTS.md',
		'package.json',
		'package-lock.json',
		'experiments/distant-sun-shadow-animation-evidence/AGENTS.md',
		'experiments/distant-sun-shadow-animation-evidence/consts.js',
		'experiments/distant-sun-shadow-animation-evidence/prompts/new-animation.md',
		'scripts/experiments/Random.js',
		'node_modules/three/package.json',
		'node_modules/three/examples/jsm/utils/BufferGeometryUtils.js',
		'node_modules/three/examples/jsm/math/SimplexNoise.js',
		'experiments/gpu-resident-shared-block-cache/package-lock.json',
		`${mediabunnyRoot}/package.json`,
		`${mediabunnyRoot}/LICENSE`,
		mediabunnyPath,
	]);
	for (const tree of [
		creativeRoot,
		'scripts/animation-evidence',
		'src/algorithm32',
		'src/flat32',
		'node_modules/three/build',
	]) {
		for (const relativePath of await CreativeRunFiles.listFiles(repositoryRoot, tree)) files.add(relativePath);
	}
	const productionBundle = await CreativeRunFiles.readSnapshot(repositoryRoot, 'dist/flat32/flat32.js');
	const productionSource = Buffer.from(productionBundle.bytes).toString('utf8');
	for (const match of productionSource.matchAll(/\bfrom\s+['"]\.\/([^'"/]+\.js)['"]/gu)) {
		files.add(`dist/flat32/${match[1]}`);
	}
	/** @type {CreativeNodeFileIdentity[]} */
	const parents = [productionBundle.identity];
	/** @type {Map<string, Uint8Array>} */
	const modules = new Map();
	for (const relativePath of [...files].sort()) {
		const snapshot = await CreativeRunFiles.readSnapshot(repositoryRoot, relativePath);
		parents.push(snapshot.identity);
		const browserModule =
			(relativePath.startsWith(`${creativeRoot}/`) && !relativePath.startsWith(`${creativeRoot}/node/`)) ||
			relativePath.startsWith('scripts/animation-evidence/') ||
			relativePath.startsWith('src/algorithm32/') ||
			relativePath.startsWith('node_modules/three/build/') ||
			relativePath === 'node_modules/three/examples/jsm/utils/BufferGeometryUtils.js' ||
			relativePath === 'node_modules/three/examples/jsm/math/SimplexNoise.js' ||
			relativePath === 'scripts/experiments/Random.js' ||
			relativePath === mediabunnyPath;
		if (browserModule && /\.(?:mjs|js)$/u.test(relativePath)) modules.set(`/${relativePath}`, snapshot.bytes);
	}
	const renderModulePath = `/${creativeRoot}/render-creative-animation.js`;
	if (!modules.has(renderModulePath)) throw new Error('Creative browser renderer module is missing.');
	const exposureNeedle = 'window.__flat32Cleanup = application.dispose.bind(application);';
	if (productionSource.split(exposureNeedle).length !== 2) {
		throw new Error('Production application exposure anchor must occur exactly once.');
	}
	const hasThreeNamespace = /\bimport\s*\{[^}]*\bas THREE\b[^}]*\}/u.test(productionSource);
	for (const declaration of [
		'class SpectralPacket {',
		'const SpectralMath = {',
		'class NeutralLambertianSceneLighting {',
		'const NEUTRAL_LAMBERTIAN_REFLECTANCE = ',
	]) {
		if (productionSource.split(declaration).length !== 2) {
			throw new Error(`Production creative dependency declaration must occur exactly once: ${declaration}.`);
		}
	}
	const instrumentation = [
		'window.__creativeApplication = application;',
		'application._creativeSpectralMath = SpectralMath;',
		'window.__creativeSpectralPacket = SpectralPacket;',
		'window.__creativeNeutralLambertianSceneLighting = NeutralLambertianSceneLighting;',
		'window.__creativeNeutralReflectance = NEUTRAL_LAMBERTIAN_REFLECTANCE;',
		...(hasThreeNamespace ? ['window.__creativeThree = THREE;'] : []),
		'',
	].join('\n');
	const instrumentedBundle = productionSource.replace(exposureNeedle, `${instrumentation}${exposureNeedle}`);
	return {
		parents,
		modules,
		instrumentedBundle,
		renderModulePath,
		mediabunnyModulePath: `/${mediabunnyPath}`,
		threeModulePath: '/node_modules/three/build/three.module.js',
		instrumentation: {
			operation:
				'Expose the existing application, bundled Three namespace, and native spectral and lighting dependencies in the intercepted page only, preserving SpectralPacket class identity.',
			anchor: exposureNeedle,
			injectedSource: instrumentation,
			instrumentedBundleSha256: CreativeRunFiles.sha256(instrumentedBundle),
		},
	};
}

/**
 * Called by the launcher to validate progress payloads at the browser callback boundary.
 *
 * @param {unknown} value - Browser activity record.
 * @returns {CreativeNodeProgress} - Accepted bounded phase and work counts.
 */
function acceptProgress(value) {
	if (!value || typeof value !== 'object') throw new Error('Creative progress must be an object.');
	const record = /** @type {Record<string, unknown>} */ (value);
	if (
		typeof record.phase !== 'string' ||
		!/^[a-z0-9-]{1,80}$/u.test(record.phase) ||
		typeof record.message !== 'string' ||
		record.message.length < 1 ||
		record.message.length > 2000
	) {
		throw new Error('Creative progress phase or message is invalid.');
	}
	for (const field of ['completed', 'total']) {
		if (record[field] !== undefined && (!Number.isSafeInteger(record[field]) || Number(record[field]) < 0)) {
			throw new Error('Creative progress counts must be nonnegative safe integers.');
		}
	}
	if (Number(record.completed ?? 0) > Number(record.total ?? Number.MAX_SAFE_INTEGER)) {
		throw new Error('Creative progress completed count exceeds its total.');
	}
	return /** @type {CreativeNodeProgress} */ (record);
}

/**
 * Call this function to render selected previews or the full-day creative film into a new immutable run.
 * The production application must already be served on loopback port 8081.
 *
 * @returns {Promise<void>} - Terminal artifact-manifest publication.
 */
async function main() {
	const options = parseOptions(process.argv.slice(2));
	if (!options) {
		process.stdout.write(
			'Usage: node experiments/distant-sun-shadow-animation-evidence/creative/run-creative-animation.js --preview [--width 1920 --height 1080]\n       node experiments/distant-sun-shadow-animation-evidence/creative/run-creative-animation.js --video\nFinal video: 3840x2160, 30 fps, 60 seconds. Existing production server: http://127.0.0.1:8081.\n',
		);
		return;
	}
	const repositoryRoot = await CreativeRunFiles.requireRealPath(REPOSITORY_ROOT);
	await CreativeRunFiles.readSnapshot(repositoryRoot, 'AGENTS.md');
	await CreativeRunFiles.requireRealPath(fileURLToPath(import.meta.url));
	const runsRoot = await CreativeRunFiles.ensureDirectory(
		repositoryRoot,
		'tmp/experiments/distant-sun-shadow-animation-evidence/runs',
	);
	const runId = `${Date.now()}-creative-animation`;
	const runDirectory = CreativeRunFiles.resolve(runsRoot, runId);
	await mkdir(runDirectory);
	await CreativeRunFiles.requireRealPath(runDirectory);
	await CreativeRunFiles.ensureDirectory(runDirectory, 'captures');
	await CreativeRunFiles.ensureDirectory(runDirectory, 'consumed-inputs');
	const browserProfile = await CreativeRunFiles.ensureDirectory(runDirectory, 'browser-profile');
	const browserTemporary = await CreativeRunFiles.ensureDirectory(runDirectory, 'browser-temp');
	const progressPath = path.join(runDirectory, 'progress.jsonl');
	await writeFile(progressPath, '', {flag: 'wx'});
	/** @type {CreativeNodeProgress} */
	let current = {phase: 'initialize', message: 'Initializing the creative full-day render.'};
	let progressTail = Promise.resolve();
	/** @type {Error | undefined} */
	let progressFailure;
	/**
	 * Called by the lifecycle and browser to append a flushed ordered activity record.
	 *
	 * @param {CreativeNodeProgress} event - Accepted activity.
	 * @param {CreativeNodeTerminalState} [state] - Terminal state when closing the run.
	 * @returns {Promise<void>} - Appended and closed progress write.
	 */
	const progress = async (event, state) => {
		current = event;
		const line = {timestamp: new Date().toISOString(), ...event, ...(state ? {state} : {})};
		const append = progressTail.then(() => appendFile(progressPath, `${JSON.stringify(line)}\n`, 'utf8'));
		progressTail = append.catch((error) => {
			progressFailure = error instanceof Error ? error : new Error(String(error));
		});
		await append;
		process.stdout.write(`${JSON.stringify(line)}\n`);
	};
	const heartbeat = setInterval(() => void progress(current).catch(() => undefined), 30_000);
	const artifacts = new CreativeArtifactWriter(runDirectory, options);
	const responseInputs = new CreativeResponseInputs(runDirectory);
	let responseInputsFinalized = false;
	/** @type {CreativeNodeModuleHost | undefined} */
	let host;
	/** @type {Awaited<ReturnType<typeof puppeteer.launch>> | undefined} */
	let browser;
	let interrupted = false;
	/** @type {CreativeNodeTerminalState} */
	let terminalState = 'failed';
	/** @type {Record<string, unknown>[]} */
	const browserMessages = [];
	/** @type {Record<string, unknown>[]} */
	const requests = [];
	/** @type {unknown} */
	let failure;
	/**
	 * Called by process signals to close the owned browser and let the terminal lifecycle finish.
	 *
	 * @returns {void} - Pending rendering interrupted through browser closure.
	 */
	const interrupt = () => {
		interrupted = true;
		if (browser) void browser.close().catch(() => undefined);
	};
	process.once('SIGINT', interrupt);
	process.once('SIGTERM', interrupt);
	try {
		await progress(current);
		process.stdout.write(`${JSON.stringify({runId, runDirectory, ...options})}\n`);
		await CreativeRunFiles.writeJson(runDirectory, 'command.json', {
			executable: process.execPath,
			arguments: [
				'experiments/distant-sun-shadow-animation-evidence/creative/run-creative-animation.js',
				...process.argv.slice(2),
			],
		});
		await progress({
			phase: 'snapshot-inputs',
			message: 'Hashing creative source, read-only production, and recording dependencies.',
		});
		const inputs = await snapshotInputs(repositoryRoot);
		await CreativeRunFiles.writeJson(runDirectory, 'inputs.json', {
			schemaId: 'distant-sun-creative-animation-inputs-v1',
			parents: inputs.parents,
			instrumentation: inputs.instrumentation,
			browserModulePaths: [...inputs.modules.keys()].sort(),
		});
		if (interrupted) throw new Error('Creative run interrupted during input preparation.');
		host = await CreativeModuleHost.start(inputs.modules);
		const configuration = {
			...options,
			framesPerSecond: 30,
			durationSeconds: 60,
			baseUrl: host.baseUrl,
			runId,
			seed: 3202609,
			mediabunnyModuleUrl: `${host.baseUrl}${inputs.mediabunnyModulePath}`,
			threeModuleUrl: `${host.baseUrl}${inputs.threeModulePath}`,
		};
		await CreativeRunFiles.writeJson(runDirectory, 'configuration.json', configuration);
		await progress({phase: 'launch-browser', message: 'Launching the contained hardware WebGL renderer.'});
		browser = await puppeteer.launch({
			headless: true,
			executablePath: CHROME_EXECUTABLE,
			userDataDir: browserProfile,
			protocolTimeout: 7_200_000,
			env: {...process.env, TEMP: browserTemporary, TMP: browserTemporary, TMPDIR: browserTemporary},
			args: [
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--use-angle=d3d11',
				'--disable-software-rasterizer',
				'--disable-background-timer-throttling',
				'--disable-renderer-backgrounding',
				'--disable-backgrounding-occluded-windows',
				'--disable-background-networking',
				'--disable-component-update',
				'--disable-breakpad',
				'--disable-crash-reporter',
				'--noerrdialogs',
				'--no-first-run',
				'--no-default-browser-check',
				`--disk-cache-dir=${path.join(browserProfile, 'cache')}`,
				`--crash-dumps-dir=${browserTemporary}`,
				`--window-size=${options.width},${options.height}`,
			],
		});
		await CreativeRunFiles.writeJson(runDirectory, 'environment.json', {
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			logicalCpuCount: os.cpus().length,
			chromeExecutable: CHROME_EXECUTABLE,
			browserVersion: await browser.version(),
			browserUserAgent: await browser.userAgent(),
			browserProfile: 'browser-profile',
			browserTemporary: 'browser-temp',
		});
		const page = await browser.newPage();
		await page.setViewport({width: options.width, height: options.height, deviceScaleFactor: 1});
		page.on('console', (message) => {
			if (browserMessages.length < 5000)
				browserMessages.push({kind: 'console', type: message.type(), message: message.text().slice(0, 6000)});
		});
		page.on('pageerror', (error) =>
			browserMessages.push({kind: 'pageerror', message: error.message, stack: error.stack}),
		);
		page.on('requestfailed', (request) =>
			requests.push({url: request.url(), failure: request.failure()?.errorText}),
		);
		page.on('response', (response) => {
			responseInputs.observe(response);
			if (requests.length < 20000)
				requests.push({
					url: response.url(),
					status: response.status(),
					contentLength: response.headers()['content-length'],
				});
		});
		await page.exposeFunction('__creativeCapture', artifacts.capture.bind(artifacts));
		await page.exposeFunction('__creativeWriteVideoChunk', artifacts.writeVideoChunk.bind(artifacts));
		await page.exposeFunction('__creativeFinalizeVideo', artifacts.finalizeVideo.bind(artifacts));
		await page.exposeFunction('__creativeWriteTrace', artifacts.writeTrace.bind(artifacts));
		await page.exposeFunction('__creativeProgress', async (/** @type {unknown} */ value) =>
			progress(acceptProgress(value)),
		);
		await page.setRequestInterception(true);
		/** @type {string | undefined} */
		let requestFailure;
		let bundleInterceptions = 0;
		const productionUrl =
			'http://127.0.0.1:8081/flat32/?diagnostic=spherical-sunset-facing-production-n4&performance=1';
		page.on('request', async (request) => {
			try {
				if (request.url() === 'http://127.0.0.1:8081/flat32/flat32.js' && request.method() === 'GET') {
					bundleInterceptions += 1;
					await request.respond({
						status: 200,
						contentType: 'text/javascript; charset=utf-8',
						body: inputs.instrumentedBundle,
					});
				} else {
					const url = new URL(request.url());
					if (
						(url.protocol === 'http:' || url.protocol === 'https:') &&
						!['127.0.0.1', 'localhost'].includes(url.hostname)
					) {
						await request.abort('blockedbyclient');
					} else await request.continue();
				}
			} catch (error) {
				requestFailure = error instanceof Error ? error.message : String(error);
			}
		});
		await progress({
			phase: 'load-production',
			message: 'Loading the read-only production Algorithm32 sky and source renderer.',
		});
		const navigation = await page.goto(productionUrl, {waitUntil: 'networkidle2', timeout: 180_000});
		if (!navigation?.ok()) throw new Error('Existing loopback production server did not return a successful page.');
		await page.waitForFunction(
			() =>
				Object.prototype.hasOwnProperty.call(window, '__creativeApplication') &&
				document.querySelector('.flat32-shell'),
			{timeout: 60_000, polling: 100},
		);
		await page.waitForFunction(
			() => {
				const shell = document.querySelector('.flat32-shell');
				return (
					shell instanceof HTMLElement &&
					['ready', 'failed', 'atmosphere-failed'].includes(shell.dataset.flat32State ?? '')
				);
			},
			{timeout: 300_000, polling: 250},
		);
		const applicationState = await page.evaluate(() => {
			const shell = document.querySelector('.flat32-shell');
			return shell instanceof HTMLElement ? shell.dataset.flat32State : undefined;
		});
		if (applicationState !== 'ready')
			throw new Error(`Production initialization failed with state ${applicationState}.`);
		if (requestFailure || bundleInterceptions !== 1)
			throw new Error(`Creative bundle interception failed: ${requestFailure ?? bundleInterceptions}.`);
		await page.evaluate(
			(threeModuleUrl, geometryUtilsModuleUrl, simplexNoiseModuleUrl) => {
				const importMap = document.createElement('script');
				importMap.type = 'importmap';
				importMap.textContent = JSON.stringify({
					imports: {
						three: threeModuleUrl,
						'three/addons/utils/BufferGeometryUtils.js': geometryUtilsModuleUrl,
						'three/addons/math/SimplexNoise.js': simplexNoiseModuleUrl,
					},
				});
				document.head.append(importMap);
			},
			configuration.threeModuleUrl,
			`${host.baseUrl}/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js`,
			`${host.baseUrl}/node_modules/three/examples/jsm/math/SimplexNoise.js`,
		);
		await progress({
			phase: 'creative-render',
			message:
				options.mode === 'video'
					? 'Rendering and recording the complete full-day journey.'
					: 'Rendering selected full-day composition previews.',
		});
		const renderResult = await page.evaluate(
			async (moduleUrl, renderConfiguration) => {
				const module = await import(moduleUrl);
				return module.renderCreativeAnimation(renderConfiguration);
			},
			`${host.baseUrl}${inputs.renderModulePath}`,
			configuration,
		);
		if (requestFailure) throw new Error(`Creative browser request failed: ${requestFailure}.`);
		if (artifacts.captures.length === 0 || !artifacts.trace)
			throw new Error('Creative render did not publish its previews and scene trace.');
		if (options.mode === 'video' && !artifacts.video) throw new Error('Creative video was not finalized.');
		if (progressFailure) throw progressFailure;
		const consumedInputs = await responseInputs.finalize();
		responseInputsFinalized = true;
		await CreativeRunFiles.writeJson(runDirectory, 'render-result.json', renderResult);
		await CreativeRunFiles.writeJson(runDirectory, 'provenance.json', {
			schemaId: 'distant-sun-creative-animation-provenance-v1',
			operation:
				'Construct seeded scene geometry and ideal full-day camera/time states; replay the retained scene trace through production Algorithm32 rendering and creative cloned lighting; capture lossless checkpoints and append ordered WebCodecs/Mediabunny MP4 chunks.',
			parentIdentityArtifact: 'inputs.json',
			consumedInputIdentityArtifact: 'consumed-inputs.json',
			consumedInputResponseCount: consumedInputs.responseCount,
			configurationArtifact: 'configuration.json',
			trace: artifacts.trace,
			captures: artifacts.captures,
			video: artifacts.video,
			derivationDetailsArtifact: 'render-result.json',
		});
		terminalState = 'accepted';
	} catch (error) {
		failure = error;
		terminalState = interrupted ? 'interrupted' : 'failed';
	} finally {
		clearInterval(heartbeat);
		process.removeListener('SIGINT', interrupt);
		process.removeListener('SIGTERM', interrupt);
		const shutdowns = await Promise.allSettled([browser?.close(), host?.close()]);
		const artifactShutdowns = await Promise.allSettled([
			artifacts.close(),
			responseInputsFinalized ? undefined : responseInputs.finalize(),
		]);
		for (const shutdown of [...shutdowns, ...artifactShutdowns]) {
			if (shutdown.status === 'rejected') {
				failure ??= shutdown.reason;
				terminalState = interrupted ? 'interrupted' : 'failed';
			}
		}
		await progressTail;
		await CreativeRunFiles.writeJson(runDirectory, 'browser-messages.json', browserMessages);
		await CreativeRunFiles.writeJson(runDirectory, 'browser-requests.json', requests);
		await CreativeRunFiles.writeJson(runDirectory, 'result.json', {
			schemaId: 'distant-sun-creative-animation-result-v1',
			runId,
			state: terminalState,
			...options,
			captures: artifacts.captures,
			video: artifacts.video,
			trace: artifacts.trace,
			...(failure
				? {
						error: {
							name: failure instanceof Error ? failure.name : 'Error',
							message: failure instanceof Error ? failure.message : String(failure),
							stack: failure instanceof Error ? failure.stack : undefined,
						},
					}
				: {}),
		});
		await progress(
			{
				phase: 'terminal',
				message:
					terminalState === 'accepted'
						? 'Creative artifacts completed and closed.'
						: `Creative run ${terminalState}: ${failure instanceof Error ? failure.message : String(failure)}.`,
			},
			terminalState,
		);
		await progressTail;
		const excludedPaths = ['artifact-manifest.json', 'browser-profile', 'browser-temp'];
		const manifest = await ArtifactManifest.create(runDirectory, excludedPaths);
		await CreativeRunFiles.writeJson(runDirectory, 'artifact-manifest.json', {
			schemaId: 'distant-sun-creative-animation-artifact-manifest-v1',
			state: terminalState,
			runId,
			excludedPaths,
			exclusionReason:
				'Browser profile and browser temporary files are retained operational scratch, not evidence artifacts.',
			...manifest,
		});
		process.stdout.write(
			`${JSON.stringify({runId, runDirectory, state: terminalState, artifactSetSha256: manifest.artifactSetSha256, captures: artifacts.captures, video: artifacts.video})}\n`,
		);
	}
	if (failure) {
		process.exitCode = interrupted ? 130 : 1;
		process.stderr.write(`${failure instanceof Error ? failure.stack : String(failure)}\n`);
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
