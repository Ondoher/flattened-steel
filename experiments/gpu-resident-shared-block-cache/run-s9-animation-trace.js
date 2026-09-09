#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {appendFile, lstat, mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {zstdDecompressSync} from 'node:zlib';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';

import puppeteer from 'puppeteer';

import {CHROME_EXECUTABLE, OUTPUT_ROOT, REPOSITORY_ROOT, SOURCE_ROOT} from './consts.js';

const CONTROL_RELATIVE_PATH =
	'experiments/gpu-resident-shared-block-cache/controls/s9-trace-driven-animation-contract.json';
const CANDIDATE_RELATIVE_ROOT =
	'tmp/experiments/distant-sun-cache-optimization/runs/000041-e1-format-compression/candidate';
const PRODUCTION_PACKAGE_RELATIVE_ROOT =
	'server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1/packages/0297591778dc34202776714fa7579454966d5922204de8a382eb4cfdc25ef504';
const PRODUCTION_MANIFEST =
	'scene-cache-manifest-6a8be5ea13f296801f37f7c0d23e14f30bb60df270c63464cfefb2371b6d974c.json';
const S9_2_RESULT = Object.freeze({
	path: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788917159050-s9-shared-packet-renderer/result.json',
	byteLength: 32_888,
	sha256: 'f195ab02076a254a1a18f7cec3bb65c17997eb49873ec8f5a945c5cb88d957ad',
});
const HOOK_RELATIVE_PATH = 'browser/s9-shared-packet-shader-hook.js';
const ATLAS_MODULE_RELATIVE_PATH = 'browser/s9-shared-packet-atlas-browser.js';
const TRACE_MODULE_RELATIVE_PATH = 'browser/s9-animation-trace-browser.js';
const RUN_SLUG = 's9-animation-trace';
const WIDTH = 3840;
const HEIGHT = 2160;
const PRODUCTION_URL =
	'http://127.0.0.1:8081/flat32/?diagnostic=spherical-sunset-facing-production-n4&performance=1';

const fail = (value, message) => {
	if (!value) throw new Error(message);
	return value;
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const isWithin = (root, target) => {
	const relative = path.relative(root, target);
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

async function requireRealDirectory(absolutePath, label) {
	const expected = path.resolve(absolutePath);
	const actual = await realpath(expected);
	const information = await lstat(expected);
	fail(
		information.isDirectory() &&
			!information.isSymbolicLink() &&
			actual.toLowerCase() === expected.toLowerCase(),
		`${label} must be a real directory without a reparse boundary.`,
	);
	return actual;
}

async function requireContainedFile(root, relativePath, label) {
	fail(
		typeof relativePath === 'string' &&
			!path.isAbsolute(relativePath) &&
			!relativePath.includes('\\') &&
			relativePath.split('/').every((segment) => segment && segment !== '.' && segment !== '..'),
		`Unsafe ${label} path.`,
	);
	const rootReal = await requireRealDirectory(root, `${label} root`);
	const expected = path.join(rootReal, ...relativePath.split('/'));
	const actual = await realpath(expected);
	const information = await lstat(expected);
	fail(
		isWithin(rootReal, actual) &&
			information.isFile() &&
			!information.isSymbolicLink() &&
			actual.toLowerCase() === expected.toLowerCase(),
		`${label} escaped or crossed a reparse boundary.`,
	);
	return actual;
}

function inverseShuffle(source) {
	fail(source.byteLength % 4 === 0, 'An E1 shuffled block is not Float32 aligned.');
	const output = Buffer.allocUnsafe(source.byteLength);
	const count = source.byteLength / 4;
	for (let index = 0; index < count; index += 1) {
		for (let lane = 0; lane < 4; lane += 1) output[index * 4 + lane] = source[lane * count + index];
	}
	return output;
}

async function readBody(request, maximumBytes) {
	const chunks = [];
	let total = 0;
	for await (const chunk of request) {
		total += chunk.byteLength;
		fail(total <= maximumBytes, 'S9.3 request body exceeded its bound.');
		chunks.push(chunk);
	}
	return Buffer.concat(chunks).toString('utf8');
}

async function collectArtifacts(root, relative = '') {
	const entries = [];
	for (const name of (await readdir(path.join(root, relative))).sort()) {
		const childRelative = relative ? `${relative}/${name}` : name;
		if (childRelative === 'artifact-manifest.json') continue;
		const absolute = path.join(root, ...childRelative.split('/'));
		const information = await lstat(absolute);
		fail(!information.isSymbolicLink(), `Unexpected S9.3 symlink: ${childRelative}`);
		if (information.isDirectory()) entries.push(...(await collectArtifacts(root, childRelative)));
		else {
			fail(information.isFile(), `Unexpected S9.3 run entry: ${childRelative}`);
			const bytes = await readFile(absolute);
			entries.push({path: childRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)});
		}
	}
	return entries;
}

async function main() {
	const repositoryRoot = await requireRealDirectory(REPOSITORY_ROOT, 'Repository root');
	const sourceRoot = await requireRealDirectory(SOURCE_ROOT, 'Experiment source root');
	fail(isWithin(repositoryRoot, sourceRoot), 'Experiment source root escaped the repository.');
	await mkdir(OUTPUT_ROOT, {recursive: true});
	const outputRoot = await requireRealDirectory(OUTPUT_ROOT, 'Experiment output root');
	fail(isWithin(path.join(repositoryRoot, 'tmp'), outputRoot), 'Experiment output escaped repository tmp.');
	await mkdir(path.join(outputRoot, 'runs'), {recursive: true});
	const runsRoot = await requireRealDirectory(path.join(outputRoot, 'runs'), 'Experiment runs root');
	const runId = `${Date.now()}-${RUN_SLUG}`;
	const runDirectory = path.join(runsRoot, runId);
	await mkdir(runDirectory);
	const progressPath = path.join(runDirectory, 'progress.jsonl');
	await writeFile(progressPath, '', {flag: 'wx'});
	let progressTail = Promise.resolve();
	let current = {phase: 'initialize', message: 'Initializing S9.3.', count: undefined};
	const progress = async (phase, message, count, state) => {
		current = {phase, message, count};
		const event = {
			timestamp: new Date().toISOString(),
			phase,
			...(count ? {completed: count.completed, total: count.total} : {}),
			message,
			...(state ? {state} : {}),
		};
		const append = progressTail.then(() => appendFile(progressPath, `${JSON.stringify(event)}\n`, 'utf8'));
		progressTail = append.catch(() => undefined);
		await append;
	};
	const heartbeat = setInterval(
		() => void progress(current.phase, current.message, current.count).catch(() => undefined),
		30_000,
	);
	let browser;
	let server;
	try {
		await progress('authentication', 'Authenticating S9.3 controls and parent evidence.');
		const [controlPath, hookPath, atlasModulePath, traceModulePath] = await Promise.all([
			requireContainedFile(repositoryRoot, CONTROL_RELATIVE_PATH, 'S9 control'),
			requireContainedFile(sourceRoot, HOOK_RELATIVE_PATH, 'S9 shader hook'),
			requireContainedFile(sourceRoot, ATLAS_MODULE_RELATIVE_PATH, 'S9 atlas module'),
			requireContainedFile(sourceRoot, TRACE_MODULE_RELATIVE_PATH, 'S9 trace module'),
		]);
		const [controlBytes, hookSource, atlasModuleBytes, traceModuleBytes, productionBundle] =
			await Promise.all([
				readFile(controlPath),
				readFile(hookPath, 'utf8'),
				readFile(atlasModulePath),
				readFile(traceModulePath),
				readFile(path.join(repositoryRoot, 'dist', 'flat32', 'flat32.js'), 'utf8'),
			]);
		const control = JSON.parse(controlBytes);
		fail(control.schemaId === 'gpu-resident-shared-block-cache-s9-animation-contract-v1', 'S9 control changed.');
		const s92Bytes = await readFile(await requireContainedFile(repositoryRoot, S9_2_RESULT.path, 'S9.2 parent'));
		fail(
			s92Bytes.byteLength === S9_2_RESULT.byteLength && sha256(s92Bytes) === S9_2_RESULT.sha256,
			'S9.2 accepted parent identity changed.',
		);
		const exposureNeedle = 'window.__flat32Cleanup = application.dispose.bind(application);';
		const sampleNeedle = 'if (performanceSamples.length > 256) performanceSamples.shift();';
		fail(productionBundle.includes(exposureNeedle), 'Production bundle exposure anchor changed.');
		fail(productionBundle.includes(sampleNeedle), 'Production performance-buffer anchor changed.');
		const instrumentedBundle = productionBundle
			.replace(exposureNeedle, `window.__flat32S9Application = application;\n${exposureNeedle}`)
			.replace(sampleNeedle, 'if (performanceSamples.length > 8192) performanceSamples.shift();');

		await Promise.all([
			writeFile(
				path.join(runDirectory, 'command.txt'),
				'node experiments/gpu-resident-shared-block-cache/run-s9-animation-trace.js\n',
				{flag: 'wx'},
			),
			writeFile(
				path.join(runDirectory, 'inputs.json'),
				`${JSON.stringify(
					{
						schemaId: 'gpu-resident-shared-block-cache-s9-trace-input-v1',
						control: {path: CONTROL_RELATIVE_PATH, byteLength: controlBytes.byteLength, sha256: sha256(controlBytes)},
						s92Parent: S9_2_RESULT,
						productionUrl: PRODUCTION_URL,
						viewport: {width: WIDTH, height: HEIGHT},
						cameraVerticalFieldOfViewDegrees: 78,
						durationMicroseconds: control.scenario.durationMicroseconds,
					},
					null,
					2,
				)}\n`,
				{flag: 'wx'},
			),
			writeFile(
				path.join(runDirectory, 'environment.json'),
				`${JSON.stringify(
					{
						node: process.version,
						platform: process.platform,
						architecture: process.arch,
						logicalCpuCount: os.cpus().length,
						chromeExecutable: CHROME_EXECUTABLE,
					},
					null,
					2,
				)}\n`,
				{flag: 'wx'},
			),
		]);

		for (const [name, parent] of Object.entries(control.parents)) {
			const identity = parent.resultPath ? parent : parent.catalog;
			if (!identity?.path && !parent.resultPath) continue;
			const relativePath = parent.resultPath ?? identity.path;
			const bytes = await readFile(await requireContainedFile(repositoryRoot, relativePath, `${name} parent`));
			fail(bytes.byteLength === (parent.byteLength ?? identity.byteLength), `${name} parent length changed.`);
			fail(sha256(bytes) === (parent.sha256 ?? identity.sha256), `${name} parent identity changed.`);
		}

		const [catalogBytes, blockIndexBytes] = await Promise.all([
			readFile(await requireContainedFile(repositoryRoot, control.parents.e1.catalog.path, 'E1 catalog')),
			readFile(await requireContainedFile(repositoryRoot, control.parents.e1.blockIndex.path, 'E1 block index')),
		]);
		fail(sha256(catalogBytes) === control.parents.e1.catalog.sha256, 'E1 catalog identity changed.');
		fail(sha256(blockIndexBytes) === control.parents.e1.blockIndex.sha256, 'E1 block-index identity changed.');
		const catalog = JSON.parse(catalogBytes);
		const blockIndex = JSON.parse(blockIndexBytes);
		const candidateRoot = await requireRealDirectory(
			path.join(repositoryRoot, ...CANDIDATE_RELATIVE_ROOT.split('/')),
			'E1 candidate root',
		);
		const minimumDegrees = control.scenario.cacheSelection.minimumSolarZenithDegrees;
		const maximumDegrees = control.scenario.cacheSelection.maximumSolarZenithDegrees;
		const sceneEntries = catalog.scenes.filter(
			(scene) =>
				scene.representativeSolarZenithDegrees >= minimumDegrees &&
				scene.representativeSolarZenithDegrees <= maximumDegrees,
		);
		fail(sceneEntries.length === 61, 'S9.3 route scene count changed.');
		const scenes = [];
		for (const [ordinal, entry] of sceneEntries.entries()) {
			const bytes = await readFile(
				await requireContainedFile(candidateRoot, entry.manifest.path, `E1 scene ${entry.id}`),
			);
			fail(
				bytes.byteLength === entry.manifest.byteLength && sha256(bytes) === entry.manifest.sha256,
				`E1 scene ${entry.id} changed.`,
			);
			const manifest = JSON.parse(bytes);
			fail(manifest.representativeSolarZenithDegrees === minimumDegrees + ordinal, 'S9.3 scenes are not consecutive.');
			scenes.push({
				id: manifest.id,
				degrees: manifest.representativeSolarZenithDegrees,
				retainedBlockCount: manifest.ledger.retainedBlockCount,
				rows: manifest.ledger.rows.map(
					({altitudeIndex, firstSolarZenithIndex, lastSolarZenithIndex, firstPackedRow}) => ({
						altitudeIndex,
						firstSolarZenithIndex,
						lastSolarZenithIndex,
						firstPackedRow,
					}),
				),
				segments: manifest.segments.map(({blockIndex: index, firstBlockRow, rowCount}) => ({
					blockIndex: index,
					firstBlockRow,
					rowCount,
				})),
			});
			await progress('scene-authentication', `Authenticated S9.3 scene ${entry.id}.`, {
				completed: ordinal + 1,
				total: sceneEntries.length,
			});
		}
		const uniqueBlockIndices = [
			...new Set(scenes.flatMap((scene) => scene.segments.map((segment) => segment.blockIndex))),
		].sort((left, right) => left - right);
		fail(uniqueBlockIndices.length === 62, 'S9.3 unique block count changed.');
		const decodedBlocks = new Map();
		const blocks = [];
		let decodedBytes = 0;
		let encodedBytes = 0;
		let zstandardMilliseconds = 0;
		let inverseShuffleMilliseconds = 0;
		for (const [ordinal, blockNumber] of uniqueBlockIndices.entries()) {
			const record = fail(blockIndex.blocks[blockNumber], `E1 block ${blockNumber} is missing.`);
			const encoded = await readFile(
				await requireContainedFile(candidateRoot, record.path, `E1 block ${blockNumber}`),
			);
			fail(
				encoded.byteLength === record.encodedByteLength && sha256(encoded) === record.encodedSha256,
				`Encoded block ${blockNumber} changed.`,
			);
			const zstarted = performance.now();
			const shuffled = zstdDecompressSync(encoded, {maxOutputLength: record.decodedByteLength});
			zstandardMilliseconds += performance.now() - zstarted;
			const istarted = performance.now();
			const decoded = inverseShuffle(shuffled);
			inverseShuffleMilliseconds += performance.now() - istarted;
			fail(
				decoded.byteLength === record.decodedByteLength && sha256(decoded) === record.decodedSha256,
				`Decoded block ${blockNumber} changed.`,
			);
			decodedBlocks.set(blockNumber, decoded);
			blocks.push({
				blockIndex: blockNumber,
				decodedByteLength: decoded.byteLength,
				decodedSha256: record.decodedSha256,
			});
			decodedBytes += decoded.byteLength;
			encodedBytes += encoded.byteLength;
			await progress('block-authentication', `Decoded S9.3 block ${blockNumber}.`, {
				completed: ordinal + 1,
				total: uniqueBlockIndices.length,
			});
		}
		fail(decodedBytes === control.scenario.cacheSelection.expectedDecodedBytes, 'S9.3 decoded bytes changed.');
		fail(encodedBytes === control.scenario.cacheSelection.expectedEncodedBytes, 'S9.3 encoded bytes changed.');

		const productionRoot = await requireRealDirectory(
			path.join(repositoryRoot, ...PRODUCTION_PACKAGE_RELATIVE_ROOT.split('/')),
			'Production package root',
		);
		const productionManifestBytes = await readFile(
			await requireContainedFile(productionRoot, PRODUCTION_MANIFEST, 'Production package manifest'),
		);
		const productionManifest = JSON.parse(productionManifestBytes);
		const mapPath = await requireContainedFile(
			productionRoot,
			productionManifest.logicalToUniqueIndex.path,
			'Production logical-direction map',
		);
		const directionMap = await readFile(mapPath);
		fail(
			directionMap.byteLength === 8748 &&
				sha256(directionMap) === productionManifest.logicalToUniqueIndex.sha256,
			'Logical-direction map identity changed.',
		);
		const blockSlots = Object.fromEntries(uniqueBlockIndices.map((blockNumber, slot) => [blockNumber, slot]));
		const browserInput = {
			schemaId: 'gpu-resident-shared-block-cache-s9-packet-browser-input-v1',
			blocks,
			blockSlots,
			scenes,
			directionMap: {byteLength: directionMap.byteLength, sha256: sha256(directionMap)},
			probeCoordinates: [
				{blockRow: 0, wavelengthIndex: 0, logicalDirectionIndex: 0},
				{blockRow: 31, wavelengthIndex: 7, logicalDirectionIndex: 2029},
				{blockRow: 63, wavelengthIndex: 14, logicalDirectionIndex: 4373},
			],
		};
		const browserInputBytes = Buffer.from(`${JSON.stringify(browserInput)}\n`);
		server = createServer(async (request, response) => {
			try {
				const url = new URL(request.url ?? '/', 'http://127.0.0.1');
				response.setHeader('access-control-allow-origin', '*');
				response.setHeader('cache-control', 'no-store');
				if (request.method === 'OPTIONS') {
					response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
					response.setHeader('access-control-allow-headers', 'content-type');
					response.writeHead(204);
					response.end();
					return;
				}
				if (url.pathname === '/atlas-module.js' && request.method === 'GET') {
					response.writeHead(200, {'content-type': 'text/javascript; charset=utf-8'});
					response.end(atlasModuleBytes);
					return;
				}
				if (url.pathname === '/trace-module.js' && request.method === 'GET') {
					response.writeHead(200, {'content-type': 'text/javascript; charset=utf-8'});
					response.end(traceModuleBytes);
					return;
				}
				if (url.pathname === '/browser-input.json' && request.method === 'GET') {
					response.writeHead(200, {
						'content-type': 'application/json',
						'content-length': browserInputBytes.byteLength,
					});
					response.end(browserInputBytes);
					return;
				}
				if (url.pathname === '/direction-map' && request.method === 'GET') {
					response.writeHead(200, {
						'content-type': 'application/octet-stream',
						'content-length': directionMap.byteLength,
					});
					response.end(directionMap);
					return;
				}
				const blockMatch = /^\/blocks\/(\d+)$/u.exec(url.pathname);
				if (blockMatch && request.method === 'GET') {
					const decoded = decodedBlocks.get(Number(blockMatch[1]));
					if (!decoded) {
						response.writeHead(404);
						response.end();
						return;
					}
					response.writeHead(200, {
						'content-type': 'application/octet-stream',
						'content-length': decoded.byteLength,
					});
					response.end(decoded);
					return;
				}
				if (url.pathname === '/progress' && request.method === 'POST') {
					const body = JSON.parse(await readBody(request, 4096));
					await progress('browser-packet-publication', body.message, {
						completed: body.completed,
						total: body.total,
					});
					response.writeHead(204);
					response.end();
					return;
				}
				response.writeHead(404);
				response.end();
			} catch (error) {
				response.writeHead(500);
				response.end(error instanceof Error ? error.message : String(error));
			}
		});
		await new Promise((resolve, reject) => {
			server.once('error', reject);
			server.listen(0, '127.0.0.1', resolve);
		});
		const address = server.address();
		fail(address && typeof address !== 'string', 'S9.3 data host did not bind.');
		const dataBaseUrl = `http://127.0.0.1:${address.port}`;

		await progress('browser-launch', 'Launching the contained 4K S9.3 live renderer.');
		browser = await puppeteer.launch({
			headless: true,
			executablePath: CHROME_EXECUTABLE,
			protocolTimeout: 1_200_000,
			args: [
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--use-angle=d3d11',
				'--disable-software-rasterizer',
				'--disable-background-timer-throttling',
				`--window-size=${WIDTH},${HEIGHT}`,
			],
		});
		const page = await browser.newPage();
		const browserMessages = [];
		page.on('console', (message) =>
			browserMessages.push({kind: 'console', type: message.type(), text: message.text()}),
		);
		page.on('pageerror', (error) =>
			browserMessages.push({kind: 'pageerror', name: error.name, message: error.message, stack: error.stack}),
		);
		await page.setViewport({width: WIDTH, height: HEIGHT, deviceScaleFactor: 1});
		await page.evaluateOnNewDocument(hookSource);
		await page.setRequestInterception(true);
		page.on('request', async (request) => {
			try {
				if (new URL(request.url()).pathname === '/flat32/flat32.js') {
					await request.respond({
						status: 200,
						contentType: 'text/javascript; charset=utf-8',
						body: instrumentedBundle,
					});
				} else await request.continue();
			} catch {
				// Navigation shutdown may finish an intercepted request first.
			}
		});
		await page.goto(PRODUCTION_URL, {waitUntil: 'networkidle2', timeout: 180_000});
		await page.waitForFunction(
			() => window.__flat32S9Application && window.__s9SharedPacketShader,
			{timeout: 30_000, polling: 100},
		);
		await page.waitForFunction(
			() => ['ready', 'failed', 'atmosphere-failed'].includes(document.querySelector('.flat32-shell')?.dataset.flat32State),
			{timeout: 240_000, polling: 250},
		);
		let startup = await page.evaluate(() => {
			const shell = document.querySelector('.flat32-shell');
			return {shellDataset: {...shell.dataset}, shellText: shell.textContent};
		});
		fail(startup.shellDataset.flat32State === 'ready', `Production page failed during S9.3 startup: ${startup.shellText}`);
		await page.evaluate(() => {
			const location = document.querySelector('#flat32-location-control');
			location.click();
			location.click();
		});
		await page.waitForFunction(
			() =>
				document.querySelector('.flat32-shell')?.dataset.flat32Location === 'San Jose' &&
				document.querySelector('.flat32-shell')?.dataset.flat32State === 'ready',
			{timeout: 240_000, polling: 250},
		);
		startup = await page.evaluate(() => {
			const application = window.__flat32S9Application;
			const canvas = document.querySelector('#flat32-canvas');
			const gl = canvas.getContext('webgl2');
			return {
				shellDataset: {...document.querySelector('.flat32-shell').dataset},
				drawingBuffer: {width: gl.drawingBufferWidth, height: gl.drawingBufferHeight},
				cameraVerticalFieldOfViewDegrees: application._sceneRuntime.camera.fov,
				shaderHook: window.__s9SharedPacketShader.diagnostics(),
			};
		});
		await writeFile(
			path.join(runDirectory, 'browser-startup.json'),
			`${JSON.stringify({startup, browserMessages}, null, 2)}\n`,
			{flag: 'wx'},
		);
		fail(
			startup.drawingBuffer.width === WIDTH &&
				startup.drawingBuffer.height === HEIGHT &&
				startup.cameraVerticalFieldOfViewDegrees === 78,
			'S9.3 4K/FOV boundary changed.',
		);

		await progress('packet-publication', 'Allocating and populating the whole-route S9.3 packet atlas.');
		const atlasResult = await page.evaluate(
			async (moduleUrl, baseUrl) => {
				const module = await import(moduleUrl);
				return module.installS9SharedPacketAtlas(baseUrl);
			},
			`${dataBaseUrl}/atlas-module.js`,
			dataBaseUrl,
		);
		fail(atlasResult.accepted && atlasResult.atlas.bytes === 1_110_786_048, 'S9.3 packet atlas failed.');

		await progress('animation-trace', 'Running the unencoded 20-second 4K animation trace.');
		const traceResult = await page.evaluate(
			async (moduleUrl, configuration) => {
				const module = await import(moduleUrl);
				return module.runS9AnimationTrace(configuration);
			},
			`${dataBaseUrl}/trace-module.js`,
			{durationMicroseconds: control.scenario.durationMicroseconds, width: WIDTH, height: HEIGHT},
		);
		const traceBytes = Buffer.from(traceResult.frames.map((frame) => JSON.stringify(frame)).join('\n') + '\n');
		await Promise.all([
			writeFile(path.join(runDirectory, 'trace.jsonl'), traceBytes, {flag: 'wx'}),
			writeFile(
				path.join(runDirectory, 'summary.json'),
				`${JSON.stringify(traceResult.summary, null, 2)}\n`,
				{flag: 'wx'},
			),
			writeFile(
				path.join(runDirectory, 'browser-final.json'),
				`${JSON.stringify({browser: traceResult.browser, browserMessages}, null, 2)}\n`,
				{flag: 'wx'},
			),
		]);
		const framesClosed = traceResult.frames.every(
			(frame) =>
				typeof frame.gpuTimerOutcome === 'string' &&
				frame.sunScreenCenterErrorPixels <= 1 &&
				frame.cpuSubmissionEndMicroseconds >= frame.cpuSubmissionStartMicroseconds,
		);
		const accepted =
			atlasResult.accepted === true &&
			traceResult.frames.length > 10 &&
			traceResult.frames[0].animationCallbackMicroseconds === 0 &&
			traceResult.frames.at(-1).animationCallbackMicroseconds >= control.scenario.durationMicroseconds &&
			framesClosed &&
			traceResult.summary.gpuTimer.completeFraction >= 0.99 &&
			traceResult.summary.gpuTimer.drain.pendingQueryCount === 0 &&
			traceResult.browser.webglError === 0 &&
			traceResult.browser.contextLost === false &&
			traceResult.browser.drawingBuffer.width === WIDTH &&
			traceResult.browser.drawingBuffer.height === HEIGHT;
		const result = {
			schemaId: 'gpu-resident-shared-block-cache-s9-animation-trace-result-v1',
			runId,
			accepted,
			claimBoundary:
				'Unencoded, no-readback 20-second browser requestAnimationFrame trace at a 3840-by-2160 drawing buffer and 78-degree vertical FOV. Browser callback cadence is the presentation boundary; disjoint-safe EXT_disjoint_timer_query_webgl2 results attribute GPU cost without claiming physical monitor scanout.',
			configuration: {
				durationMicroseconds: control.scenario.durationMicroseconds,
				viewport: {width: WIDTH, height: HEIGHT},
				cameraVerticalFieldOfViewDegrees: 78,
				qualityIntervalCount: 10,
				cacheSelection: 'nearest-integer-half-up',
				recordingOrImageReadback: false,
			},
			preparation: {
				sceneCount: scenes.length,
				uniqueBlockCount: blocks.length,
				encodedBytes,
				decodedBytes,
				zstandardMilliseconds,
				inverseShuffleMilliseconds,
				packetAtlas: atlasResult.atlas,
			},
			trace: {
				path: 'trace.jsonl',
				byteLength: traceBytes.byteLength,
				sha256: sha256(traceBytes),
			},
			summary: traceResult.summary,
			browser: traceResult.browser,
		};
		await writeFile(path.join(runDirectory, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, {
			flag: 'wx',
		});
		await writeFile(
			path.join(runDirectory, 'provenance.json'),
			`${JSON.stringify(
				{
					schemaId: 'gpu-resident-shared-block-cache-s9-animation-trace-provenance-v1',
					operation:
						'Authenticate and decode the frozen E1 route; repack and publish the S9.2-compatible whole-route RGBA atlas; take ownership of the production browser frame loop; drive a 20-second wall-clock Sun/camera/cache/celestial/endpoint-light state sequence; correlate production CPU and EXT_disjoint_timer_query_webgl2 events by shader frame; retain every frame and explicit timer outcome without recording or readback.',
					parents: {...control.parents, s92SharedPacketRenderer: S9_2_RESULT},
					sourceIdentities: {
						runner: {
							path: 'experiments/gpu-resident-shared-block-cache/run-s9-animation-trace.js',
							sha256: sha256(await readFile(fileURLToPath(import.meta.url))),
						},
						hook: {
							path: `experiments/gpu-resident-shared-block-cache/${HOOK_RELATIVE_PATH}`,
							sha256: sha256(Buffer.from(hookSource)),
						},
						atlasModule: {
							path: `experiments/gpu-resident-shared-block-cache/${ATLAS_MODULE_RELATIVE_PATH}`,
							sha256: sha256(atlasModuleBytes),
						},
						traceModule: {
							path: `experiments/gpu-resident-shared-block-cache/${TRACE_MODULE_RELATIVE_PATH}`,
							sha256: sha256(traceModuleBytes),
						},
						productionBundle: {
							path: 'dist/flat32/flat32.js',
							sha256: sha256(Buffer.from(productionBundle)),
						},
						directionMap: {
							path: `${PRODUCTION_PACKAGE_RELATIVE_ROOT}/${productionManifest.logicalToUniqueIndex.path}`,
							sha256: sha256(directionMap),
						},
					},
				},
				null,
				2,
			)}\n`,
			{flag: 'wx'},
		);
		await progress(
			'terminal',
			accepted ? 'Accepted S9.3 animation trace.' : 'S9.3 trace failed an acceptance gate.',
			undefined,
			accepted ? 'accepted' : 'failed',
		);
		clearInterval(heartbeat);
		await progressTail;
		const artifacts = await collectArtifacts(runDirectory);
		await writeFile(
			path.join(runDirectory, 'artifact-manifest.json'),
			`${JSON.stringify(
				{
					schemaId: 'gpu-resident-shared-block-cache-s9-animation-trace-artifact-manifest-v1',
					artifacts,
					artifactSetSha256: sha256(Buffer.from(JSON.stringify(artifacts))),
				},
				null,
				2,
			)}\n`,
			{flag: 'wx'},
		);
		process.stdout.write(
			`${JSON.stringify(
				{
					runId,
					runDirectory,
					accepted,
					configuration: result.configuration,
					summary: {
						...result.summary,
						hitches: `${result.summary.hitches.length} entries retained in result.json and trace.jsonl`,
					},
					browser: result.browser,
				},
				null,
				2,
			)}\n`,
		);
		if (!accepted) process.exitCode = 1;
	} catch (error) {
		clearInterval(heartbeat);
		await progressTail.catch(() => undefined);
		try {
			await writeFile(
				path.join(runDirectory, 'result.json'),
				`${JSON.stringify(
					{
						schemaId: 'gpu-resident-shared-block-cache-s9-animation-trace-result-v1',
						runId,
						accepted: false,
						error: {
							name: error instanceof Error ? error.name : 'Error',
							message: error instanceof Error ? error.message : String(error),
							stack: error instanceof Error ? error.stack : undefined,
						},
					},
					null,
					2,
				)}\n`,
				{flag: 'wx'},
			);
		} catch {
			// Preserve any result already published before a later failure.
		}
		await progress(
			'terminal',
			`S9.3 failed: ${error instanceof Error ? error.message : String(error)}`,
			undefined,
			'failed',
		).catch(() => undefined);
		await progressTail.catch(() => undefined);
		try {
			const artifacts = await collectArtifacts(runDirectory);
			await writeFile(
				path.join(runDirectory, 'artifact-manifest.json'),
				`${JSON.stringify(
					{
						schemaId: 'gpu-resident-shared-block-cache-s9-animation-trace-artifact-manifest-v1',
						artifacts,
						artifactSetSha256: sha256(Buffer.from(JSON.stringify(artifacts))),
					},
					null,
					2,
				)}\n`,
				{flag: 'wx'},
			);
		} catch {
			// The primary failure remains authoritative.
		}
		throw error;
	} finally {
		if (browser) await browser.close().catch(() => undefined);
		if (server) await new Promise((resolve) => server.close(resolve));
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
