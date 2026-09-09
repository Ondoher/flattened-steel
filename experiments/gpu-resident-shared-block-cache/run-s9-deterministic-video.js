#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {appendFile, lstat, mkdir, open, readFile, readdir, realpath, rm, stat, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {performance} from 'node:perf_hooks';
import {zstdDecompressSync} from 'node:zlib';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

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
const S9_4_RESULT = Object.freeze({
	runId: '1788919958694-s9-presentation-replay',
	path: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788919958694-s9-presentation-replay/result.json',
	byteLength: 3570,
	sha256: '40e2f146893e4806d635d290c066a0ddb1b3525da99d91a1fe4bbdb31ec9ecf6',
});
const REPLAY_ROOT = 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788919958694-s9-presentation-replay';
const OUTPUTS = Object.freeze([
	Object.freeze({
		id: 'fov78-ideal',
		fovDegrees: 78,
		mappingKind: 'ideal-equation',
		mapping: Object.freeze({
			path: `${REPLAY_ROOT}/mappings/fov78-ideal.jsonl`,
			byteLength: 703_950,
			sha256: 'c4c636e818db90b4add8e2d78a27c02c8ec25d6424123a39be4a965edd4801aa',
		}),
	}),
	Object.freeze({
		id: 'fov78-trace',
		fovDegrees: 78,
		mappingKind: 'trace-latest-frame-at-or-before-slot',
		mapping: Object.freeze({
			path: `${REPLAY_ROOT}/mappings/fov78-trace.jsonl`,
			byteLength: 1_082_770,
			sha256: '695d90555e90c9c56cd8253a5c5554e1d04f2aeff704ce892d17b440f2de80a3',
		}),
	}),
	Object.freeze({
		id: 'fov55-ideal',
		fovDegrees: 55,
		mappingKind: 'ideal-equation',
		mapping: Object.freeze({
			path: `${REPLAY_ROOT}/mappings/fov55-ideal.jsonl`,
			byteLength: 703_950,
			sha256: '4959590587f70199e4cb680d76d9eb137477030b32601cfea035ac6f3f65a9e9',
		}),
	}),
	Object.freeze({
		id: 'fov55-trace',
		fovDegrees: 55,
		mappingKind: 'trace-latest-frame-at-or-before-slot',
		mapping: Object.freeze({
			path: `${REPLAY_ROOT}/mappings/fov55-trace.jsonl`,
			byteLength: 1_097_383,
			sha256: '7616e0adf671da921c8315f7232c7c44b97f601fb975a92cb33b1cf32248543a',
		}),
	}),
]);
const HOOK_RELATIVE_PATH = 'browser/s9-shared-packet-shader-hook.js';
const ATLAS_MODULE_RELATIVE_PATH = 'browser/s9-shared-packet-atlas-browser.js';
const RENDER_MODULE_RELATIVE_PATH = 'browser/s9-deterministic-render-browser.js';
const MEDIABUNNY_BUNDLE_RELATIVE_PATH = 'node_modules/mediabunny/dist/bundles/mediabunny.min.mjs';
const MEDIABUNNY_PACKAGE_RELATIVE_PATH = 'node_modules/mediabunny/package.json';
const MEDIABUNNY_LICENSE_RELATIVE_PATH = 'node_modules/mediabunny/LICENSE';
const EXPERIMENT_LOCK_RELATIVE_PATH = 'package-lock.json';
const RUN_SLUG = 's9-deterministic-video';
const WIDTH = 3840;
const HEIGHT = 2160;
const MAXIMUM_VIDEO_BYTES = 1_000_000_000;
const MAXIMUM_TRANSPORT_CHUNK_BYTES = 4 * 1024 * 1024;
const MAXIMUM_CAPTURE_BYTES = 64 * 1024 * 1024;
const CHECKPOINT_SLOTS = new Set([0, 300, 600, 900, 1199]);
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

async function collectArtifacts(root, relative = '') {
	const entries = [];
	for (const name of (await readdir(path.join(root, relative))).sort()) {
		const childRelative = relative ? `${relative}/${name}` : name;
		if (childRelative === 'artifact-manifest.json' || childRelative.startsWith('browser-profile/')) continue;
		const absolute = path.join(root, ...childRelative.split('/'));
		const information = await lstat(absolute);
		fail(!information.isSymbolicLink(), `Unexpected S9.5 symlink: ${childRelative}`);
		if (information.isDirectory()) entries.push(...(await collectArtifacts(root, childRelative)));
		else {
			fail(information.isFile(), `Unexpected S9.5 run entry: ${childRelative}`);
			const bytes = await readFile(absolute);
			entries.push({path: childRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)});
		}
	}
	return entries;
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

async function readBoundedBytes(request, maximumBytes, label) {
	const chunks = [];
	let total = 0;
	for await (const chunk of request) {
		total += chunk.byteLength;
		fail(total <= maximumBytes, `${label} exceeded its byte bound.`);
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}

async function writeAll(handle, bytes, label) {
	let offset = 0;
	while (offset < bytes.byteLength) {
		const {bytesWritten} = await handle.write(bytes, offset, bytes.byteLength - offset);
		fail(bytesWritten > 0, `${label} write made no progress.`);
		offset += bytesWritten;
	}
}

function serveRange(request, response, absolutePath, byteLength) {
	response.setHeader('accept-ranges', 'bytes');
	response.setHeader('content-type', 'video/mp4');
	const range = /^bytes=(\d+)-(\d*)$/u.exec(request.headers.range ?? '');
	if (!range) {
		response.writeHead(200, {'content-length': byteLength});
		createReadStream(absolutePath).pipe(response);
		return;
	}
	const start = Number(range[1]);
	const end = range[2] ? Math.min(Number(range[2]), byteLength - 1) : byteLength - 1;
	if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || start >= byteLength) {
		response.writeHead(416, {'content-range': `bytes */${byteLength}`});
		response.end();
		return;
	}
	response.writeHead(206, {
		'content-length': end - start + 1,
		'content-range': `bytes ${start}-${end}/${byteLength}`,
	});
	createReadStream(absolutePath, {start, end}).pipe(response);
}

async function closeServer(server) {
	if (!server) return;
	server.closeAllConnections?.();
	await new Promise((resolve) => server.close(resolve));
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
	await Promise.all([
		mkdir(path.join(runDirectory, 'videos')),
		mkdir(path.join(runDirectory, 'captures')),
		mkdir(path.join(runDirectory, 'encoding')),
		mkdir(path.join(runDirectory, 'dependencies')),
	]);
	const browserProfileDirectory = path.join(runDirectory, 'browser-profile');
	fail(isWithin(runDirectory, browserProfileDirectory), 'S9.5 browser profile escaped its run.');
	const progressPath = path.join(runDirectory, 'progress.jsonl');
	await writeFile(progressPath, '', {flag: 'wx'});
	let progressTail = Promise.resolve();
	let current = {phase: 'initialize', message: 'Initializing S9.5.', count: undefined};
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
	const videoStreams = new Map();
	const videoUploads = new Map();
	const captureUploads = new Map();
	try {
		await progress('authentication', 'Authenticating S9.5 controls, replay mappings, and implementation sources.');
		const [
			controlPath,
			hookPath,
			atlasModulePath,
			renderModulePath,
			mediabunnyBundlePath,
			mediabunnyPackagePath,
			mediabunnyLicensePath,
			experimentLockPath,
		] = await Promise.all([
			requireContainedFile(repositoryRoot, CONTROL_RELATIVE_PATH, 'S9 control'),
			requireContainedFile(sourceRoot, HOOK_RELATIVE_PATH, 'S9 shader hook'),
			requireContainedFile(sourceRoot, ATLAS_MODULE_RELATIVE_PATH, 'S9 atlas module'),
			requireContainedFile(sourceRoot, RENDER_MODULE_RELATIVE_PATH, 'S9 render module'),
			requireContainedFile(sourceRoot, MEDIABUNNY_BUNDLE_RELATIVE_PATH, 'Mediabunny bundle'),
			requireContainedFile(sourceRoot, MEDIABUNNY_PACKAGE_RELATIVE_PATH, 'Mediabunny package'),
			requireContainedFile(sourceRoot, MEDIABUNNY_LICENSE_RELATIVE_PATH, 'Mediabunny license'),
			requireContainedFile(sourceRoot, EXPERIMENT_LOCK_RELATIVE_PATH, 'Experiment dependency lock'),
		]);
		const [
			controlBytes,
			hookSource,
			atlasModuleBytes,
			renderModuleBytes,
			mediabunnyBundleBytes,
			mediabunnyPackageBytes,
			mediabunnyLicenseBytes,
			experimentLockBytes,
			productionBundle,
		] = await Promise.all([
			readFile(controlPath),
			readFile(hookPath, 'utf8'),
			readFile(atlasModulePath),
			readFile(renderModulePath),
			readFile(mediabunnyBundlePath),
			readFile(mediabunnyPackagePath),
			readFile(mediabunnyLicensePath),
			readFile(experimentLockPath),
			readFile(path.join(repositoryRoot, 'dist', 'flat32', 'flat32.js'), 'utf8'),
		]);
		const control = JSON.parse(controlBytes);
		const mediabunnyPackage = JSON.parse(mediabunnyPackageBytes);
		fail(control.schemaId === 'gpu-resident-shared-block-cache-s9-animation-contract-v1', 'S9 control changed.');
		fail(
			control.replay.outputWidth === WIDTH &&
				control.replay.outputHeight === HEIGHT &&
				control.replay.outputFramesPerSecond === 60 &&
				control.replay.outputFrameCount === 1200,
			'S9.5 replay output contract changed.',
		);
		fail(
			mediabunnyPackage.name === 'mediabunny' &&
				mediabunnyPackage.version === '1.55.7' &&
				mediabunnyPackage.license === 'MPL-2.0',
			'Mediabunny dependency identity changed.',
		);
		const [s92Bytes, s94Bytes] = await Promise.all([
			readFile(await requireContainedFile(repositoryRoot, S9_2_RESULT.path, 'S9.2 parent')),
			readFile(await requireContainedFile(repositoryRoot, S9_4_RESULT.path, 'S9.4 parent')),
		]);
		fail(
			s92Bytes.byteLength === S9_2_RESULT.byteLength && sha256(s92Bytes) === S9_2_RESULT.sha256,
			'S9.2 accepted parent identity changed.',
		);
		fail(
			s94Bytes.byteLength === S9_4_RESULT.byteLength && sha256(s94Bytes) === S9_4_RESULT.sha256,
			'S9.4 accepted parent identity changed.',
		);
		const mappingBytesById = new Map();
		for (const output of OUTPUTS) {
			const bytes = await readFile(await requireContainedFile(repositoryRoot, output.mapping.path, `${output.id} mapping`));
			fail(
				bytes.byteLength === output.mapping.byteLength && sha256(bytes) === output.mapping.sha256,
				`${output.id} replay mapping identity changed.`,
			);
			const first = JSON.parse(bytes.toString('utf8').split('\n')[0]);
			fail(first.mappingKind === output.mappingKind, `${output.id} mapping kind changed.`);
			mappingBytesById.set(output.id, bytes);
		}
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
				'node experiments/gpu-resident-shared-block-cache/run-s9-deterministic-video.js\n',
				{flag: 'wx'},
			),
			writeFile(
				path.join(runDirectory, 'inputs.json'),
				`${JSON.stringify(
					{
						schemaId: 'gpu-resident-shared-block-cache-s9-video-input-v1',
						control: {path: CONTROL_RELATIVE_PATH, byteLength: controlBytes.byteLength, sha256: sha256(controlBytes)},
						s92Parent: S9_2_RESULT,
						s94Parent: S9_4_RESULT,
						outputs: OUTPUTS,
						productionUrl: PRODUCTION_URL,
						viewport: {width: WIDTH, height: HEIGHT},
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
			writeFile(path.join(runDirectory, 'dependencies', 'mediabunny-1.55.7.min.mjs'), mediabunnyBundleBytes, {flag: 'wx'}),
			writeFile(path.join(runDirectory, 'dependencies', 'mediabunny-1.55.7-package.json'), mediabunnyPackageBytes, {flag: 'wx'}),
			writeFile(path.join(runDirectory, 'dependencies', 'mediabunny-1.55.7-LICENSE.txt'), mediabunnyLicenseBytes, {flag: 'wx'}),
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
		fail(sceneEntries.length === 61, 'S9.5 route scene count changed.');
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
			fail(manifest.representativeSolarZenithDegrees === minimumDegrees + ordinal, 'S9.5 scenes are not consecutive.');
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
			await progress('scene-authentication', `Authenticated S9.5 scene ${entry.id}.`, {
				completed: ordinal + 1,
				total: sceneEntries.length,
			});
		}
		const uniqueBlockIndices = [
			...new Set(scenes.flatMap((scene) => scene.segments.map((segment) => segment.blockIndex))),
		].sort((left, right) => left - right);
		fail(uniqueBlockIndices.length === 62, 'S9.5 unique block count changed.');
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
			blocks.push({blockIndex: blockNumber, decodedByteLength: decoded.byteLength, decodedSha256: record.decodedSha256});
			decodedBytes += decoded.byteLength;
			encodedBytes += encoded.byteLength;
			await progress('block-authentication', `Decoded S9.5 block ${blockNumber}.`, {
				completed: ordinal + 1,
				total: uniqueBlockIndices.length,
			});
		}
		fail(decodedBytes === control.scenario.cacheSelection.expectedDecodedBytes, 'S9.5 decoded bytes changed.');
		fail(encodedBytes === control.scenario.cacheSelection.expectedEncodedBytes, 'S9.5 encoded bytes changed.');

		const productionRoot = await requireRealDirectory(
			path.join(repositoryRoot, ...PRODUCTION_PACKAGE_RELATIVE_ROOT.split('/')),
			'Production package root',
		);
		const productionManifestBytes = await readFile(
			await requireContainedFile(productionRoot, PRODUCTION_MANIFEST, 'Production package manifest'),
		);
		const productionManifest = JSON.parse(productionManifestBytes);
		const directionMap = await readFile(
			await requireContainedFile(
				productionRoot,
				productionManifest.logicalToUniqueIndex.path,
				'Production logical-direction map',
			),
		);
		fail(
			directionMap.byteLength === 8748 && sha256(directionMap) === productionManifest.logicalToUniqueIndex.sha256,
			'Logical-direction map identity changed.',
		);
		const blockSlots = Object.fromEntries(uniqueBlockIndices.map((blockNumber, slot) => [blockNumber, slot]));
		const browserInputBytes = Buffer.from(
			`${JSON.stringify({
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
			})}\n`,
		);

		server = createServer(async (request, response) => {
			try {
				const url = new URL(request.url ?? '/', 'http://127.0.0.1');
				response.setHeader('access-control-allow-origin', '*');
				response.setHeader('access-control-expose-headers', 'content-length, content-range, accept-ranges');
				response.setHeader('cache-control', 'no-store');
				if (request.method === 'OPTIONS') {
					response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
					response.setHeader('access-control-allow-headers', 'content-type, range');
					response.writeHead(204);
					response.end();
					return;
				}
				if (url.pathname === '/atlas-module.js' && request.method === 'GET') {
					response.writeHead(200, {'content-type': 'text/javascript; charset=utf-8'});
					response.end(atlasModuleBytes);
					return;
				}
				if (url.pathname === '/render-module.js' && request.method === 'GET') {
					response.writeHead(200, {'content-type': 'text/javascript; charset=utf-8'});
					response.end(renderModuleBytes);
					return;
				}
				if (url.pathname === '/mediabunny.mjs' && request.method === 'GET') {
					response.writeHead(200, {'content-type': 'text/javascript; charset=utf-8'});
					response.end(mediabunnyBundleBytes);
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
				const mappingMatch = /^\/mappings\/([a-z0-9-]+)\.jsonl$/u.exec(url.pathname);
				if (mappingMatch && request.method === 'GET') {
					const bytes = mappingBytesById.get(mappingMatch[1]);
					if (!bytes) {
						response.writeHead(404);
						response.end();
						return;
					}
					response.writeHead(200, {'content-type': 'application/x-ndjson', 'content-length': bytes.byteLength});
					response.end(bytes);
					return;
				}
				const videoChunkMatch = /^\/video-chunks\/([a-z0-9-]+)\/(\d+)$/u.exec(url.pathname);
				if (videoChunkMatch && request.method === 'POST') {
					const output = OUTPUTS.find((candidate) => candidate.id === videoChunkMatch[1]);
					fail(output, 'S9.5 rejected an unknown video output id.');
					fail(!videoUploads.has(output.id), `${output.id} was already finalized.`);
					const batchIndex = Number(videoChunkMatch[2]);
					let stream = videoStreams.get(output.id);
					if (!stream) {
						fail(batchIndex === 0, `${output.id} did not begin with batch zero.`);
						const relativePath = `videos/${output.id}.mp4`;
						stream = {
							handle: await open(path.join(runDirectory, ...relativePath.split('/')), 'wx'),
							relativePath,
							digest: createHash('sha256'),
							byteLength: 0,
							nextBatchIndex: 0,
						};
						videoStreams.set(output.id, stream);
					}
					fail(batchIndex === stream.nextBatchIndex, `${output.id} video batch ordering changed.`);
					const bytes = await readBoundedBytes(
						request,
						MAXIMUM_TRANSPORT_CHUNK_BYTES,
						`${output.id} video batch`,
					);
					fail(bytes.byteLength > 0, `${output.id} received an empty video batch.`);
					stream.byteLength += bytes.byteLength;
					fail(stream.byteLength <= MAXIMUM_VIDEO_BYTES, `${output.id} video exceeded its byte bound.`);
					stream.digest.update(bytes);
					await writeAll(stream.handle, bytes, `${output.id} video`);
					stream.nextBatchIndex += 1;
					response.writeHead(204);
					response.end();
					return;
				}
				const finalizeMatch = /^\/videos\/([a-z0-9-]+)\/finalize$/u.exec(url.pathname);
				if (finalizeMatch && request.method === 'POST') {
					const stream = fail(videoStreams.get(finalizeMatch[1]), 'S9.5 video stream is unavailable.');
					await stream.handle.close();
					videoStreams.delete(finalizeMatch[1]);
					fail(stream.byteLength > 1024, `${finalizeMatch[1]} video is unexpectedly small.`);
					videoUploads.set(finalizeMatch[1], {
						path: stream.relativePath,
						byteLength: stream.byteLength,
						sha256: stream.digest.digest('hex'),
						batchCount: stream.nextBatchIndex,
					});
					response.writeHead(204);
					response.end();
					return;
				}
				const receiptMatch = /^\/videos\/([a-z0-9-]+)\/receipt$/u.exec(url.pathname);
				if (receiptMatch && request.method === 'GET') {
					const record = videoUploads.get(receiptMatch[1]);
					if (!record) {
						response.writeHead(404);
						response.end();
						return;
					}
					response.writeHead(200, {'content-type': 'application/json'});
					response.end(JSON.stringify(record));
					return;
				}
				const videoMatch = /^\/videos\/([a-z0-9-]+)\.mp4$/u.exec(url.pathname);
				if (videoMatch && request.method === 'GET') {
					const record = videoUploads.get(videoMatch[1]);
					if (!record) {
						response.writeHead(404);
						response.end();
						return;
					}
					serveRange(request, response, path.join(runDirectory, ...record.path.split('/')), record.byteLength);
					return;
				}
				const captureMatch = /^\/captures\/([a-z0-9-]+)-slot-(\d{4})\.png$/u.exec(url.pathname);
				if (captureMatch && request.method === 'POST') {
					const output = OUTPUTS.find((candidate) => candidate.id === captureMatch[1]);
					const slotIndex = Number(captureMatch[2]);
					fail(output && CHECKPOINT_SLOTS.has(slotIndex), 'S9.5 rejected an unknown capture target.');
					const key = `${output.id}:${slotIndex}`;
					fail(!captureUploads.has(key), `S9.5 received duplicate capture ${key}.`);
					const bytes = await readBoundedBytes(request, MAXIMUM_CAPTURE_BYTES, `${key} capture`);
					fail(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${key} is not PNG.`);
					const relativePath = `captures/${output.id}-slot-${String(slotIndex).padStart(4, '0')}.png`;
					await writeFile(path.join(runDirectory, ...relativePath.split('/')), bytes, {flag: 'wx'});
					captureUploads.set(key, {path: relativePath, byteLength: bytes.byteLength, sha256: sha256(bytes)});
					response.writeHead(204);
					response.end();
					return;
				}
				if (url.pathname === '/progress' && request.method === 'POST') {
					const body = JSON.parse((await readBoundedBytes(request, 4096, 'S9.5 progress')).toString('utf8'));
					await progress('deterministic-render', body.message, {completed: body.completed, total: body.total});
					response.writeHead(204);
					response.end();
					return;
				}
				response.writeHead(404);
				response.end();
			} catch (error) {
				response.writeHead(500, {'content-type': 'text/plain; charset=utf-8'});
				response.end(error instanceof Error ? error.message : String(error));
			}
		});
		await new Promise((resolve, reject) => {
			server.once('error', reject);
			server.listen(0, '127.0.0.1', resolve);
		});
		const address = server.address();
		fail(address && typeof address !== 'string', 'S9.5 data host did not bind.');
		const dataBaseUrl = `http://127.0.0.1:${address.port}`;

		await progress('browser-launch', 'Launching the isolated contained 4K S9.5 renderer.');
		browser = await puppeteer.launch({
			headless: true,
			executablePath: CHROME_EXECUTABLE,
			userDataDir: browserProfileDirectory,
			protocolTimeout: 1_200_000,
			args: [
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--use-angle=d3d11',
				'--disable-software-rasterizer',
				'--disable-background-timer-throttling',
				'--disable-breakpad',
				'--disable-crash-reporter',
				'--noerrdialogs',
				`--window-size=${WIDTH},${HEIGHT}`,
			],
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
				// Navigation shutdown may finish an intercepted request first.
			}
		});
		await page.goto(PRODUCTION_URL, {waitUntil: 'networkidle2', timeout: 180_000});
		await page.waitForFunction(() => window.__flat32S9Application && window.__s9SharedPacketShader, {
			timeout: 30_000,
			polling: 100,
		});
		await page.waitForFunction(
			() => ['ready', 'failed', 'atmosphere-failed'].includes(document.querySelector('.flat32-shell')?.dataset.flat32State),
			{timeout: 240_000, polling: 250},
		);
		let startup = await page.evaluate(() => ({
			shellDataset: {...document.querySelector('.flat32-shell').dataset},
			shellText: document.querySelector('.flat32-shell').textContent,
		}));
		fail(startup.shellDataset.flat32State === 'ready', `Production page failed during S9.5 startup: ${startup.shellText}`);
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
				userAgent: navigator.userAgent,
			};
		});
		fail(startup.drawingBuffer.width === WIDTH && startup.drawingBuffer.height === HEIGHT, 'S9.5 4K boundary changed.');
		await page.setRequestInterception(false);

		await progress('codec-probe', 'Capability-testing actual 4K WebCodecs encode configurations.');
		const encoderSelection = await page.evaluate(async (moduleUrl) => {
			const module = await import(moduleUrl);
			return module.selectS9VideoEncoderConfiguration();
		}, `${dataBaseUrl}/render-module.js`);
		fail(encoderSelection.selectedCandidateId, 'S9.5 did not select an encoder configuration.');

		await progress('packet-publication', 'Allocating and populating the whole-route S9.5 packet atlas.');
		const atlasResult = await page.evaluate(
			async (moduleUrl, baseUrl) => {
				const module = await import(moduleUrl);
				return module.installS9SharedPacketAtlas(baseUrl);
			},
			`${dataBaseUrl}/atlas-module.js`,
			dataBaseUrl,
		);
		fail(atlasResult.accepted && atlasResult.atlas.bytes === 1_110_786_048, 'S9.5 packet atlas failed.');

		const videos = [];
		for (const [outputIndex, output] of OUTPUTS.entries()) {
			await progress('deterministic-render', `Rendering and encoding ${output.id}.`, {
				completed: outputIndex,
				total: OUTPUTS.length,
			});
			const browserResult = await page.evaluate(
				async (moduleUrl, configuration) => {
					const module = await import(moduleUrl);
					return module.renderS9DeterministicVideo(configuration);
				},
				`${dataBaseUrl}/render-module.js`,
				{
					dataBaseUrl,
					mediabunnyModuleUrl: `${dataBaseUrl}/mediabunny.mjs`,
					mappingUrl: `${dataBaseUrl}/mappings/${output.id}.jsonl`,
					outputId: output.id,
					fovDegrees: output.fovDegrees,
					encoderSelection,
				},
			);
			const packetBytes = Buffer.from(`${browserResult.packetRecords.map((record) => JSON.stringify(record)).join('\n')}\n`);
			const packetPath = `encoding/${output.id}-packets.jsonl`;
			await writeFile(path.join(runDirectory, ...packetPath.split('/')), packetBytes, {flag: 'wx'});
			const captures = browserResult.captures.map((capture) => {
				const record = fail(captureUploads.get(`${output.id}:${capture.slotIndex}`), `${output.id} capture is missing.`);
				fail(record.byteLength === capture.byteLength, `${output.id} capture byte count changed in transit.`);
				return {slotIndex: capture.slotIndex, pixelProbe: capture.pixelProbe, ...record};
			});
			const video = fail(videoUploads.get(output.id), `${output.id} video upload is missing.`);
			fail(
				JSON.stringify(video) ===
					JSON.stringify({
						path: browserResult.upload.path,
						byteLength: browserResult.upload.byteLength,
						sha256: browserResult.upload.sha256,
						batchCount: browserResult.upload.batchCount,
					}),
				`${output.id} video upload receipt changed.`,
			);
			const inspection = await page.evaluate(
				async (moduleUrl, videoUrl) => {
					const module = await import(moduleUrl);
					return module.inspectS9DeterministicVideo(videoUrl);
				},
				`${dataBaseUrl}/render-module.js`,
				`${dataBaseUrl}/videos/${output.id}.mp4`,
			);
			videos.push({
				id: output.id,
				fovDegrees: output.fovDegrees,
				mappingKind: output.mappingKind,
				mapping: output.mapping,
				video: {...video, transport: browserResult.upload.transport},
				mimeType: browserResult.mimeType,
				frameCount: browserResult.frameCount,
				renderedSourceStateCount: browserResult.renderedSourceStateCount,
				heldOutputSlotCount: browserResult.heldOutputSlotCount,
				maximumSunScreenCenterErrorPixels: browserResult.maximumSunScreenCenterErrorPixels,
				encoderConfigurations: browserResult.encoderConfigurations,
				packetTrace: {
					path: packetPath,
					byteLength: packetBytes.byteLength,
					sha256: sha256(packetBytes),
					packetCount: browserResult.packetRecords.length,
					keyPacketCount: browserResult.packetRecords.filter((packet) => packet.type === 'key').length,
					encodedPayloadBytes: browserResult.packetRecords.reduce((sum, packet) => sum + packet.byteLength, 0),
				},
				captures,
				inspection,
				browser: browserResult.browser,
			});
			await progress('deterministic-render', `Completed ${output.id}.`, {
				completed: outputIndex + 1,
				total: OUTPUTS.length,
			});
		}

		const accepted =
			videos.length === OUTPUTS.length &&
			videoUploads.size === OUTPUTS.length &&
			captureUploads.size === OUTPUTS.length * CHECKPOINT_SLOTS.size &&
			videos.every(
				(video) =>
					video.frameCount === 1200 &&
					video.packetTrace.packetCount === 1200 &&
					video.captures.length === CHECKPOINT_SLOTS.size &&
					video.captures.every(
						(capture) =>
							capture.pixelProbe.nonBlackPixelCount ===
							capture.pixelProbe.width * capture.pixelProbe.height,
					) &&
					video.maximumSunScreenCenterErrorPixels <= 1 &&
					video.inspection.videoWidth === WIDTH &&
					video.inspection.videoHeight === HEIGHT &&
					Math.abs(video.inspection.durationSeconds - 20) <= 1 / 60 &&
					video.inspection.seeks.every((seek) => seek.readyState >= 2) &&
					video.browser.webglError === 0 &&
					video.browser.contextLost === false,
			);
		const result = {
			schemaId: 'gpu-resident-shared-block-cache-s9-deterministic-video-result-v1',
			runId,
			accepted,
			claimBoundary:
				'Offline deterministic S9.5 rendering and encoding only. Generation wall time is not runtime animation performance. Videos preserve the frozen S9.4 ideal or latest-measured-state mappings without interpolation.',
			configuration: {
				viewport: {width: WIDTH, height: HEIGHT},
				framesPerSecond: 60,
				frameCount: 1200,
				durationSeconds: 20,
				qualityIntervalCount: 10,
				checkpointSlots: [...CHECKPOINT_SLOTS],
				container: {kind: 'fragmented-mp4', minimumFragmentDurationSeconds: 1},
				encoderSelection,
				muxer: {
					name: mediabunnyPackage.name,
					version: mediabunnyPackage.version,
					license: mediabunnyPackage.license,
					bundleSha256: sha256(mediabunnyBundleBytes),
					licenseSha256: sha256(mediabunnyLicenseBytes),
					packageLockSha256: sha256(experimentLockBytes),
				},
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
			startup,
			videos,
			browserMessages,
		};
		await Promise.all([
			writeFile(path.join(runDirectory, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, {flag: 'wx'}),
			writeFile(
				path.join(runDirectory, 'provenance.json'),
				`${JSON.stringify(
					{
						schemaId: 'gpu-resident-shared-block-cache-s9-deterministic-video-provenance-v1',
						operation:
							'Authenticate the frozen route, S9.2 renderer, S9.4 mappings, and exact muxer dependency; capability-test a real 4K WebCodecs frame; publish the whole-route packet atlas; offline-render every ideal state and every new trace source state; repeat the retained canvas across mapped holds; encode 1,200 monotonic 60 Hz frames per output through a bounded append-only fragmented-MP4 stream; retain lossless checkpoints and browser decode/seek inspection.',
						parents: {...control.parents, s92SharedPacketRenderer: S9_2_RESULT, s94PresentationReplay: S9_4_RESULT},
						sourceIdentities: {
							runner: {
								path: 'experiments/gpu-resident-shared-block-cache/run-s9-deterministic-video.js',
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
							renderModule: {
								path: `experiments/gpu-resident-shared-block-cache/${RENDER_MODULE_RELATIVE_PATH}`,
								sha256: sha256(renderModuleBytes),
							},
							productionBundle: {path: 'dist/flat32/flat32.js', sha256: sha256(Buffer.from(productionBundle))},
							directionMap: {
								path: `${PRODUCTION_PACKAGE_RELATIVE_ROOT}/${productionManifest.logicalToUniqueIndex.path}`,
								sha256: sha256(directionMap),
							},
							mediabunnyBundle: {
								path: `experiments/gpu-resident-shared-block-cache/${MEDIABUNNY_BUNDLE_RELATIVE_PATH}`,
								sha256: sha256(mediabunnyBundleBytes),
							},
							experimentPackageLock: {
								path: `experiments/gpu-resident-shared-block-cache/${EXPERIMENT_LOCK_RELATIVE_PATH}`,
								sha256: sha256(experimentLockBytes),
							},
						},
					},
					null,
					2,
				)}\n`,
				{flag: 'wx'},
			),
		]);
		await progress(
			'terminal',
			accepted ? 'Accepted deterministic dual-FOV S9.5 videos.' : 'S9.5 videos failed an acceptance gate.',
			undefined,
			accepted ? 'accepted' : 'failed',
		);
		clearInterval(heartbeat);
		await progressTail;
		await browser.close();
		browser = undefined;
		await closeServer(server);
		server = undefined;
		await rm(browserProfileDirectory, {recursive: true, force: true});
		const artifacts = await collectArtifacts(runDirectory);
		const artifactSetSha256 = sha256(Buffer.from(JSON.stringify(artifacts)));
		await writeFile(
			path.join(runDirectory, 'artifact-manifest.json'),
			`${JSON.stringify(
				{
					schemaId: 'gpu-resident-shared-block-cache-s9-deterministic-video-artifact-manifest-v1',
					artifacts,
					artifactSetSha256,
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
					artifactSetSha256,
					encoderSelection,
					videos: videos.map((video) => ({
						id: video.id,
						video: video.video,
						frameCount: video.frameCount,
						renderedSourceStateCount: video.renderedSourceStateCount,
						heldOutputSlotCount: video.heldOutputSlotCount,
						encodedPayloadBytes: video.packetTrace.encodedPayloadBytes,
						inspection: video.inspection,
					})),
				},
				null,
				2,
			)}\n`,
		);
		if (!accepted) process.exitCode = 1;
	} catch (error) {
		clearInterval(heartbeat);
		await progressTail.catch(() => undefined);
		if (browser) await browser.close().catch(() => undefined);
		for (const stream of videoStreams.values()) await stream.handle.close().catch(() => undefined);
		await closeServer(server).catch(() => undefined);
		if (isWithin(runDirectory, browserProfileDirectory)) {
			await rm(browserProfileDirectory, {recursive: true, force: true}).catch(() => undefined);
		}
		try {
			await writeFile(
				path.join(runDirectory, 'result.json'),
				`${JSON.stringify(
					{
						schemaId: 'gpu-resident-shared-block-cache-s9-deterministic-video-result-v1',
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
			`S9.5 failed: ${error instanceof Error ? error.message : String(error)}`,
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
						schemaId: 'gpu-resident-shared-block-cache-s9-deterministic-video-artifact-manifest-v1',
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
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
