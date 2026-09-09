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
const HOOK_RELATIVE_PATH = 'browser/s9-shared-packet-shader-hook.js';
const ATLAS_MODULE_RELATIVE_PATH = 'browser/s9-shared-packet-atlas-browser.js';
const RUN_SLUG = 's9-shared-packet-renderer';
const WIDTH = 1920;
const HEIGHT = 1080;
const PRODUCTION_URL =
	'http://127.0.0.1:8081/flat32/?diagnostic=spherical-sunset-facing-production-n4&performance=1';
const VISUAL_CONTROLS = Object.freeze([
	Object.freeze({id: 'daylight', sunsetOffsetMinutes: -300}),
	Object.freeze({id: 'late-day', sunsetOffsetMinutes: -150}),
	Object.freeze({id: 'sunset', sunsetOffsetMinutes: 0}),
]);
const ARBITRARY_TIMES_SECONDS = Object.freeze([0, 5, 10, 15, 20]);

const fail = (value, message) => {
	if (!value) throw new Error(message);
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
		information.isDirectory() && !information.isSymbolicLink() && actual.toLowerCase() === expected.toLowerCase(),
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
		fail(total <= maximumBytes, 'S9.2 request body exceeded its bound.');
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
		fail(!information.isSymbolicLink(), `Unexpected S9.2 symlink: ${childRelative}`);
		if (information.isDirectory()) entries.push(...(await collectArtifacts(root, childRelative)));
		else {
			fail(information.isFile(), `Unexpected S9.2 run entry: ${childRelative}`);
			const bytes = await readFile(absolute);
			entries.push({path: childRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)});
		}
	}
	return entries;
}

async function imageComparison(page, baseline, candidate) {
	return page.evaluate(
		async (leftBase64, rightBase64) => {
			const decode = async (base64) => {
				const image = new Image();
				image.src = `data:image/png;base64,${base64}`;
				await image.decode();
				const canvas = document.createElement('canvas');
				canvas.width = image.naturalWidth;
				canvas.height = image.naturalHeight;
				const context = canvas.getContext('2d', {willReadFrequently: true});
				context.drawImage(image, 0, 0);
				return {width: canvas.width, height: canvas.height, pixels: context.getImageData(0, 0, canvas.width, canvas.height).data};
			};
			const [left, right] = await Promise.all([decode(leftBase64), decode(rightBase64)]);
			if (left.width !== right.width || left.height !== right.height) throw new Error('S9.2 image dimensions differ.');
			const histogram = new Uint32Array(256);
			let absoluteSum = 0;
			let squaredSum = 0;
			let maximum = 0;
			let differingPixels = 0;
			for (let offset = 0; offset < left.pixels.length; offset += 4) {
				let differs = false;
				for (let channel = 0; channel < 3; channel += 1) {
					const difference = Math.abs(left.pixels[offset + channel] - right.pixels[offset + channel]);
					histogram[difference] += 1;
					absoluteSum += difference;
					squaredSum += difference * difference;
					maximum = Math.max(maximum, difference);
					differs ||= difference !== 0;
				}
				if (differs) differingPixels += 1;
			}
			const channels = left.width * left.height * 3;
			const percentile = (fraction) => {
				const target = Math.ceil(channels * fraction);
				let total = 0;
				for (let index = 0; index < histogram.length; index += 1) {
					total += histogram[index];
					if (total >= target) return index;
				}
				return 255;
			};
			return {
				width: left.width,
				height: left.height,
				maximumAbsoluteCodeDifference: maximum,
				meanAbsoluteCodeDifference: absoluteSum / channels,
				rootMeanSquareCodeDifference: Math.sqrt(squaredSum / channels),
				p99AbsoluteCodeDifference: percentile(0.99),
				differingPixelFraction: differingPixels / (left.width * left.height),
			};
		},
		baseline.toString('base64'),
		candidate.toString('base64'),
	);
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
	await mkdir(path.join(runDirectory, 'captures'));
	const progressPath = path.join(runDirectory, 'progress.jsonl');
	await writeFile(progressPath, '', {flag: 'wx'});
	let progressTail = Promise.resolve();
	let current = {phase: 'initialize', message: 'Initializing S9.2.', count: undefined};
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
		const controlPath = await requireContainedFile(repositoryRoot, CONTROL_RELATIVE_PATH, 'S9 control');
		const controlBytes = await readFile(controlPath);
		const control = JSON.parse(controlBytes);
		fail(control.schemaId === 'gpu-resident-shared-block-cache-s9-animation-contract-v1', 'S9 control schema changed.');
		const hookPath = await requireContainedFile(sourceRoot, HOOK_RELATIVE_PATH, 'S9 shader hook');
		const atlasModulePath = await requireContainedFile(sourceRoot, ATLAS_MODULE_RELATIVE_PATH, 'S9 atlas browser module');
		const [hookSource, atlasModuleBytes, productionBundle] = await Promise.all([
			readFile(hookPath, 'utf8'),
			readFile(atlasModulePath),
			readFile(path.join(repositoryRoot, 'dist', 'flat32', 'flat32.js'), 'utf8'),
		]);
		const exposureNeedle = 'window.__flat32Cleanup = application.dispose.bind(application);';
		fail(productionBundle.includes(exposureNeedle), 'Production bundle exposure anchor changed.');
		const instrumentedBundle = productionBundle.replace(
			exposureNeedle,
			`window.__flat32S9Application = application;\n${exposureNeedle}`,
		);
		await Promise.all([
			writeFile(path.join(runDirectory, 'command.txt'), 'node experiments/gpu-resident-shared-block-cache/run-s9-shared-packet-renderer.js\n', {flag: 'wx'}),
			writeFile(
				path.join(runDirectory, 'inputs.json'),
				`${JSON.stringify({schemaId: 'gpu-resident-shared-block-cache-s9-renderer-input-v1', control: {path: CONTROL_RELATIVE_PATH, byteLength: controlBytes.byteLength, sha256: sha256(controlBytes)}, productionUrl: PRODUCTION_URL, viewport: {width: WIDTH, height: HEIGHT}, visualControls: VISUAL_CONTROLS, arbitraryTimesSeconds: ARBITRARY_TIMES_SECONDS}, null, 2)}\n`,
				{flag: 'wx'},
			),
			writeFile(
				path.join(runDirectory, 'environment.json'),
				`${JSON.stringify({node: process.version, platform: process.platform, architecture: process.arch, logicalCpuCount: os.cpus().length, chromeExecutable: CHROME_EXECUTABLE}, null, 2)}\n`,
				{flag: 'wx'},
			),
		]);
		await progress('parent-authentication', 'Authenticating S9 and E1 parent evidence.');
		for (const [name, parent] of Object.entries(control.parents)) {
			const identity = parent.resultPath ? parent : parent.catalog;
			if (!identity?.path && !parent.resultPath) continue;
			const relativePath = parent.resultPath ?? identity.path;
			const bytes = await readFile(await requireContainedFile(repositoryRoot, relativePath, `${name} parent`));
			fail(bytes.byteLength === (parent.byteLength ?? identity.byteLength), `${name} parent length changed.`);
			fail(sha256(bytes) === (parent.sha256 ?? identity.sha256), `${name} parent identity changed.`);
		}

		const catalogBytes = await readFile(
			await requireContainedFile(repositoryRoot, control.parents.e1.catalog.path, 'E1 catalog'),
		);
		const blockIndexBytes = await readFile(
			await requireContainedFile(repositoryRoot, control.parents.e1.blockIndex.path, 'E1 block index'),
		);
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
		fail(sceneEntries.length === 61, 'S9.2 route scene count changed.');
		const scenes = [];
		for (const [ordinal, entry] of sceneEntries.entries()) {
			const bytes = await readFile(await requireContainedFile(candidateRoot, entry.manifest.path, `E1 scene ${entry.id}`));
			fail(bytes.byteLength === entry.manifest.byteLength && sha256(bytes) === entry.manifest.sha256, `E1 scene ${entry.id} changed.`);
			const manifest = JSON.parse(bytes);
			fail(manifest.representativeSolarZenithDegrees === minimumDegrees + ordinal, 'S9.2 scenes are not consecutive.');
			const segments = manifest.segments.map(({blockIndex: index, firstBlockRow, rowCount}) => ({blockIndex: index, firstBlockRow, rowCount}));
			scenes.push({
				id: manifest.id,
				degrees: manifest.representativeSolarZenithDegrees,
				retainedBlockCount: manifest.ledger.retainedBlockCount,
				rows: manifest.ledger.rows.map(({altitudeIndex, firstSolarZenithIndex, lastSolarZenithIndex, firstPackedRow}) => ({altitudeIndex, firstSolarZenithIndex, lastSolarZenithIndex, firstPackedRow})),
				segments,
			});
			await progress('scene-authentication', `Authenticated S9.2 scene ${entry.id}.`, {completed: ordinal + 1, total: sceneEntries.length});
		}
		const uniqueBlockIndices = [...new Set(scenes.flatMap((scene) => scene.segments.map((segment) => segment.blockIndex)))].sort((left, right) => left - right);
		fail(uniqueBlockIndices.length === 62, 'S9.2 unique block count changed.');
		const decodedBlocks = new Map();
		const blocks = [];
		let decodedBytes = 0;
		let encodedBytes = 0;
		let zstandardMilliseconds = 0;
		let inverseShuffleMilliseconds = 0;
		for (const [ordinal, blockNumber] of uniqueBlockIndices.entries()) {
			const record = blockIndex.blocks[blockNumber];
			fail(record, `E1 block ${blockNumber} is missing.`);
			const encoded = await readFile(await requireContainedFile(candidateRoot, record.path, `E1 block ${blockNumber}`));
			fail(encoded.byteLength === record.encodedByteLength && sha256(encoded) === record.encodedSha256, `Encoded block ${blockNumber} changed.`);
			const zstarted = performance.now();
			const shuffled = zstdDecompressSync(encoded, {maxOutputLength: record.decodedByteLength});
			const ztime = performance.now() - zstarted;
			const istarted = performance.now();
			const decoded = inverseShuffle(shuffled);
			const itime = performance.now() - istarted;
			fail(decoded.byteLength === record.decodedByteLength && sha256(decoded) === record.decodedSha256, `Decoded block ${blockNumber} changed.`);
			decodedBlocks.set(blockNumber, decoded);
			blocks.push({blockIndex: blockNumber, decodedByteLength: decoded.byteLength, decodedSha256: record.decodedSha256, zstandardMilliseconds: ztime, inverseShuffleMilliseconds: itime});
			decodedBytes += decoded.byteLength;
			encodedBytes += encoded.byteLength;
			zstandardMilliseconds += ztime;
			inverseShuffleMilliseconds += itime;
			await progress('block-authentication', `Decoded S9.2 block ${blockNumber}.`, {completed: ordinal + 1, total: uniqueBlockIndices.length});
		}
		fail(decodedBytes === control.scenario.cacheSelection.expectedDecodedBytes, 'S9.2 decoded bytes changed.');
		fail(encodedBytes === control.scenario.cacheSelection.expectedEncodedBytes, 'S9.2 encoded bytes changed.');

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
		fail(directionMap.byteLength === 8748 && sha256(directionMap) === productionManifest.logicalToUniqueIndex.sha256, 'Logical-direction map identity changed.');
		const blockSlots = Object.fromEntries(uniqueBlockIndices.map((blockNumber, slot) => [blockNumber, slot]));
		const browserInput = {
			schemaId: 'gpu-resident-shared-block-cache-s9-packet-browser-input-v1',
			blocks: blocks.map(({blockIndex, decodedByteLength, decodedSha256}) => ({blockIndex, decodedByteLength, decodedSha256})),
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
				if (url.pathname === '/module.js' && request.method === 'GET') {
					response.writeHead(200, {'content-type': 'text/javascript; charset=utf-8'});
					response.end(atlasModuleBytes);
					return;
				}
				if (url.pathname === '/browser-input.json' && request.method === 'GET') {
					response.writeHead(200, {'content-type': 'application/json', 'content-length': browserInputBytes.byteLength});
					response.end(browserInputBytes);
					return;
				}
				if (url.pathname === '/direction-map' && request.method === 'GET') {
					response.writeHead(200, {'content-type': 'application/octet-stream', 'content-length': directionMap.byteLength});
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
					response.writeHead(200, {'content-type': 'application/octet-stream', 'content-length': decoded.byteLength});
					response.end(decoded);
					return;
				}
				if (url.pathname === '/progress' && request.method === 'POST') {
					const body = JSON.parse(await readBody(request, 4096));
					await progress('browser-packet-publication', body.message, {completed: body.completed, total: body.total});
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
		fail(address && typeof address !== 'string', 'S9.2 data host did not bind to loopback.');
		const dataBaseUrl = `http://127.0.0.1:${address.port}`;

		await progress('browser-launch', 'Launching the contained live-renderer integration.');
		browser = await puppeteer.launch({
			headless: true,
			executablePath: CHROME_EXECUTABLE,
			protocolTimeout: 1_200_000,
			args: ['--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-software-rasterizer', '--disable-background-timer-throttling', `--window-size=${WIDTH},${HEIGHT}`],
		});
		const page = await browser.newPage();
		const browserMessages = [];
		page.on('console', (message) => browserMessages.push({kind: 'console', type: message.type(), text: message.text()}));
		page.on('pageerror', (error) =>
			browserMessages.push({kind: 'pageerror', name: error.name, message: error.message, stack: error.stack}),
		);
		await page.setViewport({width: WIDTH, height: HEIGHT, deviceScaleFactor: 1});
		await page.evaluateOnNewDocument(hookSource);
		await page.setRequestInterception(true);
		page.on('request', async (request) => {
			try {
				if (new URL(request.url()).pathname === '/flat32/flat32.js') {
					await request.respond({status: 200, contentType: 'text/javascript; charset=utf-8', body: instrumentedBundle});
				} else await request.continue();
			} catch {
				// Navigation shutdown may finish an intercepted request before this callback.
			}
		});
		await page.goto(PRODUCTION_URL, {waitUntil: 'networkidle2', timeout: 180_000});
		await page.waitForFunction(
			() => window.__flat32S9Application && window.__s9SharedPacketShader && document.querySelector('.flat32-shell'),
			{timeout: 30_000, polling: 100},
		);
		await page.waitForFunction(
			() => ['ready', 'failed', 'atmosphere-failed'].includes(document.querySelector('.flat32-shell')?.dataset.flat32State),
			{timeout: 240_000, polling: 250},
		);
		const startup = await page.evaluate(() => {
			const shell = document.querySelector('.flat32-shell');
			return {
				shellDataset: {...shell.dataset},
				shellText: shell.textContent,
				shaderHook: window.__s9SharedPacketShader.diagnostics(),
			};
		});
		await writeFile(
			path.join(runDirectory, 'browser-startup.json'),
			`${JSON.stringify({startup, browserMessages}, null, 2)}\n`,
			{flag: 'wx'},
		);
		fail(startup.shellDataset.flat32State === 'ready', `Production page failed during S9.2 startup: ${startup.shellText}`);
		fail(startup.shaderHook.linkedPrograms > 0, 'S9.2 did not transform and link the production cache shader.');
		await page.evaluate(() => {
			const location = document.querySelector('#flat32-location-control');
			location.click();
			location.click();
		});
		await page.waitForFunction(
			() => document.querySelector('.flat32-shell')?.dataset.flat32Location === 'San Jose' && document.querySelector('.flat32-shell')?.dataset.flat32State === 'ready',
			{timeout: 240_000, polling: 250},
		);

		await progress('packet-publication', 'Allocating, packing, uploading, and probing the 62-layer RGBA atlas.');
		const atlasResult = await page.evaluate(async (moduleUrl, baseUrl) => {
			const module = await import(moduleUrl);
			return module.installS9SharedPacketAtlas(baseUrl);
		}, `${dataBaseUrl}/module.js`, dataBaseUrl);
		fail(atlasResult.accepted && atlasResult.atlas.bytes === 1_110_786_048, 'S9.2 exact packet-atlas gate failed.');

		await page.addStyleTag({content: '.flat32-scene-controls,.flat32-time-panel{visibility:hidden!important}'});
		const canvas = await page.$('#flat32-canvas');
		fail(canvas, 'S9.2 production canvas is unavailable.');
		const visualComparisons = [];
		for (const [ordinal, controlScene] of VISUAL_CONTROLS.entries()) {
			await progress('visual-equivalence', `Rendering S9.2 ${controlScene.id} production/shared pair.`, {completed: ordinal, total: VISUAL_CONTROLS.length});
			await page.evaluate((offsetMinutes) => {
				window.__s9SharedPacketShader.setEnabled(false);
				const sunset = document.querySelector('button[data-flat32-globe-time="2"]');
				sunset.click();
				if (offsetMinutes !== 0) {
					const selector = offsetMinutes > 0 ? 'button[data-flat32-minute-offset="10"]' : 'button[data-flat32-minute-offset="-10"]';
					const button = document.querySelector(selector);
					for (let step = 0; step < Math.abs(offsetMinutes) / 10; step += 1) button.click();
				}
			}, controlScene.sunsetOffsetMinutes);
			await new Promise((resolve) => setTimeout(resolve, 700));
			await page.waitForFunction(
				() => {
					const shell = document.querySelector('.flat32-shell');
					return shell?.dataset.flat32State === 'ready' && shell?.dataset.flat32DistantSunCacheState === 'ready';
				},
				{timeout: 240_000, polling: 250},
			);
			await new Promise((resolve) => setTimeout(resolve, 1200));
			const sceneFacts = await page.evaluate(() => {
				const shell = document.querySelector('.flat32-shell');
				const mode = window.__flat32S9Application._modeController._activeMode;
				return {
					solarZenithDegrees: Number(shell.dataset.flat32SolarZenithDegrees),
					directionToSunModel: [...mode.geometry.configuration.directionToSource],
					cacheState: shell.dataset.flat32DistantSunCacheState,
				};
			});
			const selectedDegrees = Math.max(30, Math.min(90, Math.floor(sceneFacts.solarZenithDegrees + 0.5)));
			fail(Math.abs(selectedDegrees - sceneFacts.solarZenithDegrees) <= 0.5, `${controlScene.id} fell outside the S9 route.`);
			const baseline = await canvas.screenshot({type: 'png'});
			await page.evaluate((state) => {
				window.__s9SharedPacketShader.setState(state);
				window.__s9SharedPacketShader.setEnabled(true);
			}, {sceneOrdinal: selectedDegrees - 30, directionToSunModel: sceneFacts.directionToSunModel, qualityIntervalCount: 30});
			await new Promise((resolve) => setTimeout(resolve, 1200));
			const candidate = await canvas.screenshot({type: 'png'});
			const baselinePath = `captures/${controlScene.id}-production.png`;
			const candidatePath = `captures/${controlScene.id}-shared.png`;
			await Promise.all([
				writeFile(path.join(runDirectory, ...baselinePath.split('/')), baseline, {flag: 'wx'}),
				writeFile(path.join(runDirectory, ...candidatePath.split('/')), candidate, {flag: 'wx'}),
			]);
			visualComparisons.push({
				...controlScene,
				...sceneFacts,
				selectedCacheDegrees: selectedDegrees,
				baseline: {path: baselinePath, byteLength: baseline.byteLength, sha256: sha256(baseline)},
				candidate: {path: candidatePath, byteLength: candidate.byteLength, sha256: sha256(candidate)},
				comparison: await imageComparison(page, baseline, candidate),
			});
		}

		const arbitraryStates = [];
		for (const seconds of ARBITRARY_TIMES_SECONDS) {
			const state = await page.evaluate((elapsedSeconds) => {
				const progress = Math.max(0, Math.min(1, elapsedSeconds / 20));
				const zenithDegrees = 90 - 60 * Math.sin(Math.PI * progress);
				const azimuthDegrees = 90 + 180 * progress;
				const zenith = (zenithDegrees * Math.PI) / 180;
				const azimuth = (azimuthDegrees * Math.PI) / 180;
				const uen = [Math.cos(zenith), Math.sin(zenith) * Math.sin(azimuth), Math.sin(zenith) * Math.cos(azimuth)];
				const model = [uen[1], uen[2], uen[0]];
				const sceneDirection = [uen[1], uen[0], -uen[2]];
				const selectedDegrees = Math.max(30, Math.min(90, Math.floor(zenithDegrees + 0.5)));
				const application = window.__flat32S9Application;
				const camera = application._sceneRuntime.camera;
				const runtime = application._modeController._activeRuntime;
				const mode = application._modeController._activeMode;
				const celestial = runtime._shaderHandle._buildResult.celestialGenerationParticipant;
				if (!celestial?._sun?._placement) throw new Error('S9.2 Sun generation participant is unavailable.');
				camera.up.set(0, 1, 0);
				camera.lookAt(camera.position.x + sceneDirection[0], camera.position.y + sceneDirection[1], camera.position.z + sceneDirection[2]);
				camera.updateMatrixWorld(true);
				celestial._sun._placement = {
					...celestial._sun._placement,
					directionToSource: [...model],
				};
				celestial._sun.markDirty('view');
				application._endpointScene.updateDistantSunLighting(
					model,
					mode.algorithm32.receiverLight,
					mode.algorithm32.config.config.color,
				);
				application._sceneRuntime.refreshShadowMaps();
				window.__s9SharedPacketShader.setState({sceneOrdinal: selectedDegrees - 30, directionToSunModel: model, qualityIntervalCount: 10});
				window.__s9SharedPacketShader.setEnabled(true);
				return {
					elapsedSeconds,
					progress,
					solarZenithDegrees: zenithDegrees,
					solarAzimuthDegrees: azimuthDegrees,
					directionToSunUpEastNorth: uen,
					directionToSunModel: model,
					cameraTargetScene: sceneDirection,
					selectedCacheDegrees: selectedDegrees,
					qualityIntervalCount: 10,
					frameCountBeforePublication: Number(
						application._sceneRuntime.canvas.dataset.flat32AtmosphereFrameCount ?? 0,
					),
				};
			}, seconds);
			await page.waitForFunction(
				(expectedDirection, priorFrameCount) => {
					const application = window.__flat32S9Application;
					const runtime = application?._modeController?._activeRuntime;
					const sun = runtime?._shaderHandle?._buildResult?.celestialGenerationParticipant?._sun;
					const values = sun?.bindingValues?.();
					const placement = sun?._placement?.directionToSource;
					const center = values?.['runtime.celestial.sunScreenCenterPixels'];
					const frameCount = Number(application?._sceneRuntime?.canvas?.dataset.flat32AtmosphereFrameCount ?? 0);
					return (
						frameCount > priorFrameCount &&
						placement?.length === 3 &&
						expectedDirection.every((value, index) => Math.abs(value - placement[index]) <= 1e-12) &&
						center?.length === 2 &&
						Math.hypot(center[0] - 960, center[1] - 540) <= 1
					);
				},
				{timeout: 10_000, polling: 16},
				state.directionToSunModel,
				state.frameCountBeforePublication,
			);
			const celestialEvidence = await page.evaluate(() => {
				const application = window.__flat32S9Application;
				const sun =
					application._modeController._activeRuntime._shaderHandle._buildResult.celestialGenerationParticipant._sun;
				const values = sun.bindingValues();
				const center = [...values['runtime.celestial.sunScreenCenterPixels']];
				const diagnostics = sun.getDiagnostics();
				return {
					placementDirectionToSunModel: [...sun._placement.directionToSource],
					sunScreenCenterPixels: center,
					expectedSunScreenCenterPixels: [960, 540],
					sunScreenCenterErrorPixels: Math.hypot(center[0] - 960, center[1] - 540),
					generationCount: diagnostics.generationCount,
					reusedFrameCount: diagnostics.reusedFrameCount,
					dirtyReason: diagnostics.publicationState.dirtyReason,
					frameCountAfterPublication: Number(
						application._sceneRuntime.canvas.dataset.flat32AtmosphereFrameCount ?? 0,
					),
				};
			});
			const capture = await canvas.screenshot({type: 'png'});
			const capturePath = `captures/scenario-${String(seconds).padStart(2, '0')}s.png`;
			await writeFile(path.join(runDirectory, ...capturePath.split('/')), capture, {flag: 'wx'});
			arbitraryStates.push({
				...state,
				celestial: celestialEvidence,
				capture: {path: capturePath, byteLength: capture.byteLength, sha256: sha256(capture)},
			});
		}
		const browserDiagnostics = await page.evaluate(() => {
			const canvas = document.querySelector('#flat32-canvas');
			const gl = canvas.getContext('webgl2');
			return {
				drawingBuffer: {width: gl.drawingBufferWidth, height: gl.drawingBufferHeight},
				webglError: gl.getError(),
				contextLost: gl.isContextLost(),
				shaderHook: window.__s9SharedPacketShader.diagnostics(),
			};
		});
		const visualAccepted = visualComparisons.every(
			(entry) => entry.comparison.maximumAbsoluteCodeDifference <= 2 && entry.comparison.p99AbsoluteCodeDifference <= 1,
		);
		const accepted =
			atlasResult.accepted === true &&
			atlasResult.mismatchCount === 0 &&
			atlasResult.contextLost === false &&
			visualAccepted &&
			arbitraryStates.length === ARBITRARY_TIMES_SECONDS.length &&
			arbitraryStates.every(
				(state) =>
					state.celestial.sunScreenCenterErrorPixels <= 1 &&
					state.celestial.dirtyReason === null &&
					state.celestial.frameCountAfterPublication > state.frameCountBeforePublication &&
					state.directionToSunModel.every(
						(value, index) => Math.abs(value - state.celestial.placementDirectionToSunModel[index]) <= 1e-12,
					),
			) &&
			browserDiagnostics.webglError === 0 &&
			browserDiagnostics.contextLost === false &&
			browserDiagnostics.shaderHook.transformErrors.length === 0 &&
			browserDiagnostics.shaderHook.boundDraws > 0;
		const result = {
			schemaId: 'gpu-resident-shared-block-cache-s9-shared-packet-renderer-result-v1',
			runId,
			accepted,
			claimBoundary: 'Contained live production-pass integration evidence. The production bundle was served read-only with an experiment-only application exposure and shader-source cache-addressing transformation. Each arbitrary state also updated the production celestial Sun tile placement and endpoint light direction through the exposed live runtime, then required the published Sun center to match the camera center. Production files were not modified.',
			packetAtlas: atlasResult,
			preparation: {sceneCount: scenes.length, uniqueBlockCount: blocks.length, encodedBytes, decodedBytes, zstandardMilliseconds, inverseShuffleMilliseconds},
			visualComparisons,
			arbitraryScenarioStates: arbitraryStates,
			browser: browserDiagnostics,
		};
		await writeFile(path.join(runDirectory, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, {flag: 'wx'});
		await writeFile(
			path.join(runDirectory, 'provenance.json'),
			`${JSON.stringify({schemaId: 'gpu-resident-shared-block-cache-s9-renderer-provenance-v1', operation: 'authenticate and decode the frozen E1 route; expand each exact unique-direction spectrum into four production-compatible RGBA packets; upload 62 block layers; inject only shared cache addressing into the served production shader; compare dense and shared full-frame output; drive arbitrary deterministic scenario states; update the production celestial Sun tile placement and endpoint light direction; assert joint camera-center publication', parents: control.parents, sourceIdentities: {runner: {path: 'experiments/gpu-resident-shared-block-cache/run-s9-shared-packet-renderer.js', sha256: sha256(await readFile(fileURLToPath(import.meta.url)))}, hook: {path: `experiments/gpu-resident-shared-block-cache/${HOOK_RELATIVE_PATH}`, sha256: sha256(Buffer.from(hookSource))}, atlasModule: {path: `experiments/gpu-resident-shared-block-cache/${ATLAS_MODULE_RELATIVE_PATH}`, sha256: sha256(atlasModuleBytes)}, productionBundle: {path: 'dist/flat32/flat32.js', sha256: sha256(Buffer.from(productionBundle))}, directionMap: {path: `${PRODUCTION_PACKAGE_RELATIVE_ROOT}/${productionManifest.logicalToUniqueIndex.path}`, sha256: sha256(directionMap)}}}, null, 2)}\n`,
			{flag: 'wx'},
		);
		await progress('terminal', accepted ? 'Accepted S9.2 shared packet renderer integration.' : 'S9.2 integration failed an acceptance gate.', undefined, accepted ? 'accepted' : 'failed');
		clearInterval(heartbeat);
		await progressTail;
		const artifacts = await collectArtifacts(runDirectory);
		await writeFile(path.join(runDirectory, 'artifact-manifest.json'), `${JSON.stringify({schemaId: 'gpu-resident-shared-block-cache-s9-renderer-artifact-manifest-v1', artifacts, artifactSetSha256: sha256(Buffer.from(JSON.stringify(artifacts)))}, null, 2)}\n`, {flag: 'wx'});
		process.stdout.write(`${JSON.stringify({runId, runDirectory, accepted, packetAtlas: result.packetAtlas.atlas, visualComparisons: visualComparisons.map((entry) => ({id: entry.id, solarZenithDegrees: entry.solarZenithDegrees, selectedCacheDegrees: entry.selectedCacheDegrees, comparison: entry.comparison})), browser: browserDiagnostics}, null, 2)}\n`);
		if (!accepted) process.exitCode = 1;
	} catch (error) {
		clearInterval(heartbeat);
		await progressTail.catch(() => undefined);
		try {
			await writeFile(path.join(runDirectory, 'result.json'), `${JSON.stringify({schemaId: 'gpu-resident-shared-block-cache-s9-shared-packet-renderer-result-v1', runId, accepted: false, error: {name: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined}}, null, 2)}\n`, {flag: 'wx'});
		} catch {
			// Preserve any result already published before a later failure.
		}
		await progress('terminal', `S9.2 failed: ${error instanceof Error ? error.message : String(error)}`, undefined, 'failed').catch(() => undefined);
		await progressTail.catch(() => undefined);
		try {
			const artifacts = await collectArtifacts(runDirectory);
			await writeFile(path.join(runDirectory, 'artifact-manifest.json'), `${JSON.stringify({schemaId: 'gpu-resident-shared-block-cache-s9-renderer-artifact-manifest-v1', artifacts, artifactSetSha256: sha256(Buffer.from(JSON.stringify(artifacts)))}, null, 2)}\n`, {flag: 'wx'});
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
