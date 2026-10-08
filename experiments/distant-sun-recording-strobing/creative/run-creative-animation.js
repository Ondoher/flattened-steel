#!/usr/bin/env node

import {appendFile, mkdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import puppeteer from 'puppeteer';

import {StrobingRun} from '../StrobingRun.js';
import {StrobingServer} from '../StrobingServer.js';
import {StrobingCubicPatch} from '../StrobingCubicPatch.js';
import {StrobingColorPatch} from '../StrobingColorPatch.js';
const REPOSITORY_ROOT = StrobingRun.repositoryRoot;
const CHROME_EXECUTABLE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
import {CreativeArtifactWriter} from './node/CreativeArtifactWriter.js';
import {CreativeModuleHost} from '../../distant-sun-shadow-animation-evidence/creative/node/CreativeModuleHost.js';
import {CreativeResponseInputs} from '../../distant-sun-shadow-animation-evidence/creative/node/CreativeResponseInputs.js';
import {CreativeRunFiles} from '../../distant-sun-shadow-animation-evidence/creative/node/CreativeRunFiles.js';

/**
 * Called by the launcher to parse native output selection without allocating a run.
 *
 * @param {readonly string[]} argumentsList - Command-line arguments after the script path.
 * @returns {StrobingRenderOptions} - Selected output, or undefined for help.
 */
function parseOptions(argumentsList) {
	const [operation, candidateRun, colorFlag] = argumentsList;
	if (
		![
			'--control',
			'--ablation',
			'--candidate',
			'--film',
			'--twilight',
			'--twilight-control',
			'--sunrise',
			'--sunset',
		].includes(operation) ||
		argumentsList.length > 3 ||
		(colorFlag !== undefined && !['--color-p2', '--color-no-boost'].includes(colorFlag))
	)
		throw new Error('Use a capture operation and package RUN, optionally --color-p2 or --color-no-boost.');
	const fullFilm = operation === '--film',
		ablation = operation === '--ablation';
	const twilight = operation.startsWith('--twilight');
	const horizon = operation === '--sunrise' || operation === '--sunset';
	const candidate = operation === '--candidate' || fullFilm || twilight || horizon;
	if (colorFlag && !candidate) throw new Error('Color ablations require a pinned candidate package.');
	if (candidate !== Boolean(candidateRun) || (candidateRun && !/^\d{5}-[a-z][a-z0-9-]{0,15}$/u.test(candidateRun)))
		throw new Error('Candidate and film captures require one contained package run id.');
	return {
		mode: ablation ? 'preview' : 'video',
		ablation,
		candidateRun,
		width: fullFilm ? 3840 : 1280,
		height: fullFilm ? 2160 : 720,
		fullFilm,
		durationSeconds: fullFilm ? 60 : 4,
		startSeconds: fullFilm ? 0 : twilight ? 7 : operation === '--sunrise' ? 10 : operation === '--sunset' ? 46 : 16,
		variant: candidate ? 'stable-ground-cubic' : 'control',
		lightingInterpolation: candidate && operation !== '--twilight-control' ? 'monotone-cubic' : 'linear',
		colorResponse:
			colorFlag === '--color-p2'
				? 'monotone-p2'
				: colorFlag === '--color-no-boost'
					? 'no-sunset-boost'
					: 'original-p9',
	};
}

/**
 * Called by the launcher to snapshot its source and read-only rendering parents.
 *
 * @param {string} repositoryRoot - Canonical repository root derived from checked-in source.
 * @param {StrobingRenderOptions} options - Selected cache correction.
 * @returns {Promise<CreativeNodeInputs>} - Pinned module bytes and parent file identities.
 */
async function snapshotInputs(repositoryRoot, options) {
	const creativeRoot = 'experiments/distant-sun-recording-strobing/creative';
	const parentCreativeRoot = 'experiments/distant-sun-shadow-animation-evidence/creative';
	const mediabunnyRoot = 'experiments/gpu-resident-shared-block-cache/node_modules/mediabunny';
	const mediabunnyPath = `${mediabunnyRoot}/dist/bundles/mediabunny.min.mjs`;
	const files = new Set([
		'AGENTS.md',
		'experiments/distant-sun-recording-strobing/AGENTS.md',
		'experiments/distant-sun-recording-strobing/StrobingRun.js',
		'experiments/distant-sun-recording-strobing/StrobingServer.js',
		'experiments/distant-sun-recording-strobing/StrobingCubicPatch.js',
		'experiments/distant-sun-recording-strobing/StrobingColorPatch.js',
		'server/flat32-router.js',
		'server/flat32/features/shared-cache/selection.js',
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
		parentCreativeRoot,
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
			(relativePath.startsWith(`${parentCreativeRoot}/`) &&
				!relativePath.startsWith(`${parentCreativeRoot}/node/`)) ||
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
	const cubic =
		options.variant === 'stable-ground-cubic'
			? StrobingCubicPatch.apply(productionSource)
			: {source: productionSource, injection: ''};
	const color = StrobingColorPatch.apply(cubic.source, options.colorResponse);
	const instrumentedBundle = color.source.replace(exposureNeedle, `${instrumentation}${exposureNeedle}`);
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
			injectedSource: instrumentation + cubic.injection + '\n/* ' + color.description + ' */',
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
	const run = await StrobingRun.allocate(
		options.fullFilm
			? 'fixed-film'
			: options.ablation
				? 'cache-ablation'
				: options.candidateRun
					? 'fixed-capture'
					: 'control-capture',
	);
	const runId = run.id;
	const runDirectory = run.directory;
	await CreativeRunFiles.ensureDirectory(runDirectory, 'captures');
	await CreativeRunFiles.ensureDirectory(runDirectory, 'consumed-inputs');
	const browserProfile = await CreativeRunFiles.ensureDirectory(runDirectory, 'browser-profile');
	const browserTemporary = await CreativeRunFiles.ensureDirectory(runDirectory, 'browser-temp');
	const progress = run.progress.bind(run);
	const current = run.current;
	let productionServer;
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
		let candidateRoot;
		if (options.candidateRun) {
			const parentRoot = await StrobingRun.checkedPath(
				REPOSITORY_ROOT,
				`${StrobingRun.outputRelative}/runs/${options.candidateRun}`,
			);
			const manifest = /** @type {StrobingParentManifest} */ (
				await StrobingRun.readJson(parentRoot, 'artifact-manifest.json')
			);
			if (
				manifest.state !== 'accepted' ||
				(await StrobingRun.inventory(parentRoot, manifest.excludedPaths)).artifactSetSha256 !==
					manifest.artifactSetSha256
			)
				throw new Error('Candidate package run did not authenticate.');
			candidateRoot = await StrobingRun.checkedPath(parentRoot, 'candidate');
			await run.writeJson('candidate-parent.json', {
				root: path.relative(REPOSITORY_ROOT, parentRoot),
				...manifest,
			});
		}
		productionServer = await StrobingServer.start(candidateRoot);
		process.stdout.write(`${JSON.stringify({runId, runDirectory, ...options})}\n`);
		await CreativeRunFiles.writeJson(runDirectory, 'command.json', {
			executable: process.execPath,
			arguments: [
				'experiments/distant-sun-recording-strobing/creative/run-creative-animation.js',
				...process.argv.slice(2),
			],
		});
		await progress({
			phase: 'snapshot-inputs',
			message: 'Hashing creative source, read-only production, and recording dependencies.',
		});
		const inputs = await snapshotInputs(repositoryRoot, options);
		await run.writeJson(
			'harness-source.json',
			await StrobingRun.inventory(path.join(repositoryRoot, 'experiments/distant-sun-recording-strobing'), [
				'node_modules',
			]),
		);
		await CreativeRunFiles.writeJson(runDirectory, 'inputs.json', {
			schemaId: 'distant-sun-creative-animation-inputs-v1',
			parents: inputs.parents,
			instrumentation: inputs.instrumentation,
			browserModulePaths: [...inputs.modules.keys()].sort(),
		});
		if (interrupted) throw new Error('Creative run interrupted during input preparation.');
		host = await CreativeModuleHost.start(inputs.modules);
		/** @type {StrobingRenderConfiguration} */
		const configuration = {
			...options,
			sourceMeasurement: 'native-region-means-v1',
			framesPerSecond: 30,
			durationSeconds: options.durationSeconds,
			baseUrl: host.baseUrl,
			runId,
			seed: 3202609,
			mediabunnyModuleUrl: `${host.baseUrl}${inputs.mediabunnyModulePath}`,
			threeModuleUrl: `${host.baseUrl}${inputs.threeModulePath}`,
		};
		const control = await StrobingRun.readJson(
			REPOSITORY_ROOT,
			`${StrobingRun.outputRelative}/runs/00000-pin-control/control.json`,
		);
		configuration.fixedCamera = /** @type {StrobingControl} */ (control).fixedCamera;
		if ([7, 10, 46].includes(options.startSeconds)) {
			const original =
				'tmp/experiments/distant-sun-shadow-animation-evidence/runs/1788974488678-creative-animation';
			const trace = /** @type {StrobingFilmSceneTrace} */ (
				await StrobingRun.readJson(REPOSITORY_ROOT, `${original}/scene-trace.json`)
			);
			const cameraFrame = (options.startSeconds + 2) * 30;
			configuration.fixedCamera = trace.frames[cameraFrame].camera;
			await run.writeJson('camera-parent.json', {
				frame: cameraFrame,
				parent: await StrobingRun.identity(REPOSITORY_ROOT, `${original}/scene-trace.json`),
			});
		}
		await CreativeRunFiles.writeJson(runDirectory, 'configuration.json', configuration);
		await progress({phase: 'launch-browser', message: 'Launching the contained hardware WebGL renderer.'});
		browser = await puppeteer.launch({
			headless: 'new',
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
		await run.writeJson(
			'runtime-environment.json',
			await page.evaluate(() => {
				const gl = window.__creativeApplication._sceneRuntime.canvas.getContext('webgl2');
				const debug = gl.getExtension('WEBGL_debug_renderer_info');
				return {
					renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
					vendor: gl.getParameter(gl.VENDOR),
					version: gl.getParameter(gl.VERSION),
					width: gl.drawingBufferWidth,
					height: gl.drawingBufferHeight,
				};
			}),
		);
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
		if (run.progressError) throw run.progressError;
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
		clearInterval(run.heartbeat);
		process.removeListener('SIGINT', interrupt);
		process.removeListener('SIGTERM', interrupt);
		const shutdowns = await Promise.allSettled([browser?.close(), host?.close(), productionServer?.close()]);
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
		await run.tail;
		await CreativeRunFiles.writeJson(runDirectory, 'browser-messages.json', browserMessages);
		await CreativeRunFiles.writeJson(runDirectory, 'browser-requests.json', requests);
		await run.finish(
			terminalState,
			{
				purpose: options.fullFilm ? 'full-animation' : 'synchronized-control',
				options,
				captures: artifacts.captures,
				video: artifacts.video,
				trace: artifacts.trace,
				...(failure ? {error: failure instanceof Error ? failure.stack : String(failure)} : {}),
			},
			['browser-profile', 'browser-temp'],
		);
	}
	if (failure) {
		process.exitCode = interrupted ? 130 : 1;
		process.stderr.write(`${failure instanceof Error ? failure.stack : String(failure)}\n`);
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
