#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {appendFile, lstat, mkdir, readFile, readdir, realpath, stat, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {zstdDecompressSync} from 'node:zlib';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';

import {CHROME_EXECUTABLE, OUTPUT_ROOT, REPOSITORY_ROOT, SOURCE_ROOT} from './consts.js';

const CONTROL_RELATIVE_PATH =
	'experiments/gpu-resident-shared-block-cache/controls/s9-trace-driven-animation-contract.json';
const CANDIDATE_RELATIVE_ROOT =
	'tmp/experiments/distant-sun-cache-optimization/runs/000041-e1-format-compression/candidate';
const BROWSER_MODULE_RELATIVE_PATH = 'browser/s9-whole-route-capacity-browser.js';
const RUN_SLUG = 's9-whole-route-capacity';

const fail = (value, message) => {
	if (!value) throw new Error(message);
};

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function isWithin(root, target) {
	const relative = path.relative(root, target);
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function requireRelativePath(relativePath) {
	fail(
		typeof relativePath === 'string' &&
			relativePath.length > 0 &&
			!path.isAbsolute(relativePath) &&
			!relativePath.includes('\\') &&
			relativePath.split('/').every((segment) => segment && segment !== '.' && segment !== '..'),
		`Unsafe contained path: ${relativePath}`,
	);
	return relativePath;
}

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

async function requireContainedRealFile(root, relativePath, label) {
	requireRelativePath(relativePath);
	const rootReal = await requireRealDirectory(root, `${label} root`);
	const expected = path.join(rootReal, ...relativePath.split('/'));
	const actual = await realpath(expected);
	const information = await lstat(expected);
	fail(isWithin(rootReal, actual), `${label} escapes its root.`);
	fail(
		information.isFile() &&
			!information.isSymbolicLink() &&
			actual.toLowerCase() === expected.toLowerCase(),
		`${label} crosses a symlink, junction, or reparse boundary.`,
	);
	return actual;
}

function inverseShuffle(source) {
	fail(source.byteLength % 4 === 0, 'An E1 shuffled block is not Float32 aligned.');
	const output = Buffer.allocUnsafe(source.byteLength);
	const valueCount = source.byteLength / 4;
	for (let index = 0; index < valueCount; index += 1) {
		for (let lane = 0; lane < 4; lane += 1) output[index * 4 + lane] = source[lane * valueCount + index];
	}
	return output;
}

async function readBoundedBody(request, maximumBytes) {
	const chunks = [];
	let byteLength = 0;
	for await (const chunk of request) {
		byteLength += chunk.byteLength;
		fail(byteLength <= maximumBytes, `Request body exceeds ${maximumBytes} bytes.`);
		chunks.push(chunk);
	}
	return Buffer.concat(chunks).toString('utf8');
}

async function artifactManifest(runDirectory) {
	const entries = [];
	for (const name of (await readdir(runDirectory)).sort()) {
		if (name === 'artifact-manifest.json') continue;
		const absolutePath = path.join(runDirectory, name);
		const information = await lstat(absolutePath);
		fail(information.isFile() && !information.isSymbolicLink(), `Unexpected S9 run entry: ${name}`);
		const bytes = await readFile(absolutePath);
		entries.push({path: name, byteLength: bytes.byteLength, sha256: sha256(bytes)});
	}
	return {
		schemaId: 'gpu-resident-shared-block-cache-s9-artifact-manifest-v1',
		artifacts: entries,
		artifactSetSha256: sha256(Buffer.from(JSON.stringify(entries))),
	};
}

async function main() {
	const repositoryRoot = await requireRealDirectory(REPOSITORY_ROOT, 'Repository root');
	const sourceRoot = await requireRealDirectory(SOURCE_ROOT, 'Experiment source root');
	fail(isWithin(repositoryRoot, sourceRoot), 'Experiment source root escapes the repository.');
	await mkdir(OUTPUT_ROOT, {recursive: true});
	const outputRoot = await requireRealDirectory(OUTPUT_ROOT, 'Experiment output root');
	fail(isWithin(path.join(repositoryRoot, 'tmp'), outputRoot), 'Experiment output root escapes repository tmp.');
	await mkdir(path.join(outputRoot, 'runs'), {recursive: true});
	const runsRoot = await requireRealDirectory(path.join(outputRoot, 'runs'), 'Experiment runs root');

	const controlPath = await requireContainedRealFile(repositoryRoot, CONTROL_RELATIVE_PATH, 'S9 control');
	const controlBytes = await readFile(controlPath);
	const control = JSON.parse(controlBytes);
	fail(
		control.schemaId === 'gpu-resident-shared-block-cache-s9-animation-contract-v1',
		'Unexpected S9 animation contract schema.',
	);

	const runId = `${Date.now()}-${RUN_SLUG}`;
	const runDirectory = path.join(runsRoot, runId);
	await mkdir(runDirectory);
	await requireRealDirectory(runDirectory, 'Allocated S9 run');
	const progressPath = path.join(runDirectory, 'progress.jsonl');
	await writeFile(progressPath, '', {flag: 'wx'});
	let progressTail = Promise.resolve();
	let currentPhase = 'initialize';
	let currentMessage = 'Initializing S9 whole-route capacity evidence.';
	let currentCount;
	const progress = async (phase, message, count, state) => {
		currentPhase = phase;
		currentMessage = message;
		currentCount = count;
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
		() => void progress(currentPhase, currentMessage, currentCount).catch(() => undefined),
		30_000,
	);

	let server;
	let child;
	try {
		const browserModulePath = await requireContainedRealFile(
			sourceRoot,
			BROWSER_MODULE_RELATIVE_PATH,
			'S9 browser capacity module',
		);
		const browserModuleBytes = await readFile(browserModulePath);
		await Promise.all([
			writeFile(
				path.join(runDirectory, 'command.txt'),
				'node experiments/gpu-resident-shared-block-cache/run-s9-whole-route-capacity.js\n',
				{flag: 'wx'},
			),
			writeFile(
				path.join(runDirectory, 'inputs.json'),
				`${JSON.stringify(
					{
						schemaId: 'gpu-resident-shared-block-cache-s9-capacity-input-v1',
						control: {
							path: CONTROL_RELATIVE_PATH,
							byteLength: controlBytes.byteLength,
							sha256: sha256(controlBytes),
						},
						candidateRoot: CANDIDATE_RELATIVE_ROOT,
					},
					null,
					2,
				)}\n`,
				{flag: 'wx'},
			),
			writeFile(
				path.join(runDirectory, 'provenance.json'),
				`${JSON.stringify(
					{
						schemaId: 'gpu-resident-shared-block-cache-s9-capacity-provenance-v1',
						operation:
							're-authenticate every E1 scene manifest and unique encoded/decoded block for the 30-through-90-degree route, derive immutable lookup metadata, then allocate, upload, and exactly probe a 62-layer R32F WebGL2 texture array',
						parents: control.parents,
						sourceIdentities: {
							runner: {
								path: 'experiments/gpu-resident-shared-block-cache/run-s9-whole-route-capacity.js',
								sha256: sha256(await readFile(fileURLToPath(import.meta.url))),
							},
							browserModule: {
								path: `experiments/gpu-resident-shared-block-cache/${BROWSER_MODULE_RELATIVE_PATH}`,
								byteLength: browserModuleBytes.byteLength,
								sha256: sha256(browserModuleBytes),
							},
						},
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
						schemaId: 'gpu-resident-shared-block-cache-s9-capacity-environment-v1',
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
		await progress('initialize', 'Allocated the immutable S9.1 route-capacity run.');

		await progress('parent-authentication', 'Authenticating the frozen S9 parent evidence.');
		for (const [name, parent] of Object.entries(control.parents)) {
			const relativePath = parent.resultPath ?? parent.catalog?.path;
			if (!relativePath) continue;
			const expectedSha256 = parent.sha256 ?? parent.catalog.sha256;
			const expectedByteLength = parent.byteLength ?? parent.catalog.byteLength;
			const bytes = await readFile(await requireContainedRealFile(repositoryRoot, relativePath, `${name} parent`));
			fail(bytes.byteLength === expectedByteLength, `${name} parent length changed.`);
			fail(sha256(bytes) === expectedSha256, `${name} parent identity changed.`);
		}

		const catalogPath = await requireContainedRealFile(
			repositoryRoot,
			control.parents.e1.catalog.path,
			'E1 runtime catalog',
		);
		const catalogBytes = await readFile(catalogPath);
		fail(catalogBytes.byteLength === control.parents.e1.catalog.byteLength, 'Pinned E1 catalog length changed.');
		fail(sha256(catalogBytes) === control.parents.e1.catalog.sha256, 'Pinned E1 catalog identity changed.');
		const catalog = JSON.parse(catalogBytes);
		fail(catalog.schemaId === 'distant-sun-cache-runtime-catalog-v1', 'Unexpected E1 catalog schema.');
		fail(catalog.selection.incrementDegrees === 1, 'E1 catalog is not the frozen one-degree inventory.');

		const blockIndexPath = await requireContainedRealFile(
			repositoryRoot,
			control.parents.e1.blockIndex.path,
			'E1 block index',
		);
		const blockIndexBytes = await readFile(blockIndexPath);
		fail(sha256(blockIndexBytes) === control.parents.e1.blockIndex.sha256, 'Pinned E1 block index changed.');
		const blockIndex = JSON.parse(blockIndexBytes);
		fail(blockIndex.schemaId === 'distant-sun-cache-block-index-v1', 'Unexpected E1 block-index schema.');

		const candidateRoot = await requireRealDirectory(
			path.join(repositoryRoot, ...CANDIDATE_RELATIVE_ROOT.split('/')),
			'E1 candidate root',
		);
		const minimumDegrees = control.scenario.cacheSelection.minimumSolarZenithDegrees;
		const maximumDegrees = control.scenario.cacheSelection.maximumSolarZenithDegrees;
		const sceneCatalogEntries = catalog.scenes.filter(
			(scene) =>
				scene.representativeSolarZenithDegrees >= minimumDegrees &&
				scene.representativeSolarZenithDegrees <= maximumDegrees,
		);
		fail(
			sceneCatalogEntries.length === control.scenario.cacheSelection.expectedSceneCount,
			'Unexpected S9 route scene count.',
		);

		await progress(
			'scene-authentication',
			'Authenticating route scene manifests and deriving lookup metadata.',
			{completed: 0, total: sceneCatalogEntries.length},
		);
		const scenes = [];
		for (const [ordinal, catalogScene] of sceneCatalogEntries.entries()) {
			fail(
				catalogScene.representativeSolarZenithDegrees === minimumDegrees + ordinal,
				'S9 route scenes are not a complete consecutive one-degree sequence.',
			);
			const manifestPath = await requireContainedRealFile(
				candidateRoot,
				catalogScene.manifest.path,
				`Scene ${catalogScene.id}`,
			);
			const manifestBytes = await readFile(manifestPath);
			fail(manifestBytes.byteLength === catalogScene.manifest.byteLength, `${catalogScene.id} length changed.`);
			fail(sha256(manifestBytes) === catalogScene.manifest.sha256, `${catalogScene.id} identity changed.`);
			const manifest = JSON.parse(manifestBytes);
			fail(manifest.schemaId === 'distant-sun-cache-scene-manifest-v1', `${catalogScene.id} schema changed.`);
			fail(
				manifest.representativeSolarZenithDegrees === catalogScene.representativeSolarZenithDegrees,
				`${catalogScene.id} representative angle changed.`,
			);
			const segments = manifest.segments.map(({blockIndex: index, firstBlockRow, rowCount}) => ({
				blockIndex: index,
				firstBlockRow,
				rowCount,
			}));
			const requiredBlockIndices = [...new Set(segments.map((segment) => segment.blockIndex))].sort(
				(left, right) => left - right,
			);
			scenes.push({
				id: manifest.id,
				degrees: manifest.representativeSolarZenithDegrees,
				manifest: catalogScene.manifest,
				payloadByteLength: manifest.payloadByteLength,
				requiredBlockIndices,
				segments,
			});
			await progress(
				'scene-authentication',
				`Authenticated route scene ${catalogScene.id}.`,
				{completed: ordinal + 1, total: sceneCatalogEntries.length},
			);
		}

		const uniqueBlockIndices = [...new Set(scenes.flatMap((scene) => scene.requiredBlockIndices))].sort(
			(left, right) => left - right,
		);
		fail(
			uniqueBlockIndices.length === control.scenario.cacheSelection.expectedUniqueBlockCount,
			'Unexpected S9 route unique-block count.',
		);
		const adjacent = scenes.slice(1).map((scene, index) => {
			const previous = scenes[index];
			return {
				fromDegrees: previous.degrees,
				toDegrees: scene.degrees,
				addedBlockIndices: scene.requiredBlockIndices.filter(
					(block) => !previous.requiredBlockIndices.includes(block),
				),
				removedBlockIndices: previous.requiredBlockIndices.filter(
					(block) => !scene.requiredBlockIndices.includes(block),
				),
				unionBlockCount: new Set([...previous.requiredBlockIndices, ...scene.requiredBlockIndices]).size,
			};
		});
		const fallback = {
			accepted: Math.max(...adjacent.map((entry) => entry.unionBlockCount)) <= control.preparation.fallback.gpuLayers,
			decodedCpuPoolBlocks: uniqueBlockIndices.length,
			decodedCpuPoolBytes: control.preparation.fallback.decodedCpuPoolBytes,
			gpuLayers: control.preparation.fallback.gpuLayers,
			gpuBytes: control.preparation.fallback.gpuBytes,
			maximumAdjacentUnionBlocks: Math.max(...adjacent.map((entry) => entry.unionBlockCount)),
			maximumAdjacentAddedBlocks: Math.max(...adjacent.map((entry) => entry.addedBlockIndices.length)),
			meanAdjacentAddedBlocks:
				adjacent.reduce((total, entry) => total + entry.addedBlockIndices.length, 0) / adjacent.length,
		};
		fail(fallback.accepted, 'The frozen 24-layer fallback cannot retain an adjacent scene union.');

		await progress(
			'block-authentication',
			'Authenticating and decoding every unique S9 route block.',
			{completed: 0, total: uniqueBlockIndices.length},
		);
		const decodedBlocks = new Map();
		const blockRecords = [];
		let totalEncodedBytes = 0;
		let totalDecodedBytes = 0;
		let totalZstandardMilliseconds = 0;
		let totalInverseShuffleMilliseconds = 0;
		for (const [ordinal, blockNumber] of uniqueBlockIndices.entries()) {
			const block = blockIndex.blocks[blockNumber];
			fail(block, `Missing E1 block index ${blockNumber}.`);
			const encodedPath = await requireContainedRealFile(candidateRoot, block.path, `E1 block ${blockNumber}`);
			const encoded = await readFile(encodedPath);
			fail(encoded.byteLength === block.encodedByteLength, `Encoded block ${blockNumber} length changed.`);
			fail(sha256(encoded) === block.encodedSha256, `Encoded block ${blockNumber} identity changed.`);
			const zstandardStarted = performance.now();
			const shuffled = zstdDecompressSync(encoded, {maxOutputLength: block.decodedByteLength});
			const zstandardMilliseconds = performance.now() - zstandardStarted;
			const inverseStarted = performance.now();
			const decoded = inverseShuffle(shuffled);
			const inverseShuffleMilliseconds = performance.now() - inverseStarted;
			fail(decoded.byteLength === block.decodedByteLength, `Decoded block ${blockNumber} length changed.`);
			fail(sha256(decoded) === block.decodedSha256, `Decoded block ${blockNumber} identity changed.`);
			decodedBlocks.set(blockNumber, decoded);
			blockRecords.push({
				blockIndex: blockNumber,
				id: block.id,
				path: block.path,
				encodedByteLength: block.encodedByteLength,
				encodedSha256: block.encodedSha256,
				decodedByteLength: block.decodedByteLength,
				decodedSha256: block.decodedSha256,
				zstandardMilliseconds,
				inverseShuffleMilliseconds,
			});
			totalEncodedBytes += block.encodedByteLength;
			totalDecodedBytes += block.decodedByteLength;
			totalZstandardMilliseconds += zstandardMilliseconds;
			totalInverseShuffleMilliseconds += inverseShuffleMilliseconds;
			await progress(
				'block-authentication',
				`Authenticated and decoded route block ${blockNumber}.`,
				{completed: ordinal + 1, total: uniqueBlockIndices.length},
			);
		}
		fail(totalEncodedBytes === control.scenario.cacheSelection.expectedEncodedBytes, 'Route encoded bytes changed.');
		fail(totalDecodedBytes === control.scenario.cacheSelection.expectedDecodedBytes, 'Route decoded bytes changed.');

		const routeSummary = {
			schemaId: 'gpu-resident-shared-block-cache-s9-route-summary-v1',
			sceneCount: scenes.length,
			minimumDegrees,
			maximumDegrees,
			uniqueBlockCount: uniqueBlockIndices.length,
			uniqueBlockIndices,
			encodedBytes: totalEncodedBytes,
			decodedBytes: totalDecodedBytes,
			minimumBlocksPerScene: Math.min(...scenes.map((scene) => scene.requiredBlockIndices.length)),
			maximumBlocksPerScene: Math.max(...scenes.map((scene) => scene.requiredBlockIndices.length)),
			adjacent,
			fallback,
		};
		await Promise.all([
			writeFile(path.join(runDirectory, 'route-lookups.json'), `${JSON.stringify({scenes}, null, 2)}\n`, {
				flag: 'wx',
			}),
			writeFile(path.join(runDirectory, 'route-summary.json'), `${JSON.stringify(routeSummary, null, 2)}\n`, {
				flag: 'wx',
			}),
			writeFile(path.join(runDirectory, 'block-authentication.json'), `${JSON.stringify({blocks: blockRecords}, null, 2)}\n`, {
				flag: 'wx',
			}),
		]);

		const browserInput = {
			schemaId: 'gpu-resident-shared-block-cache-s9-capacity-browser-input-v1',
			atlas: {
				...control.preparation.wholeRouteGpuCandidate,
				channelCount: 15,
				blockRowCount: 64,
			},
			blocks: blockRecords.map((block) => ({
				blockIndex: block.blockIndex,
				decodedByteLength: block.decodedByteLength,
				decodedSha256: block.decodedSha256,
			})),
			scenes: scenes.map((scene) => ({
				degrees: scene.degrees,
				requiredBlockIndices: scene.requiredBlockIndices,
			})),
			probeCoordinates: [
				{blockRow: 0, wavelengthIndex: 0, uniqueDirectionIndex: 0},
				{blockRow: 31, wavelengthIndex: 7, uniqueDirectionIndex: 2029},
				{blockRow: 63, wavelengthIndex: 14, uniqueDirectionIndex: 4057},
			],
		};
		const browserInputBytes = Buffer.from(`${JSON.stringify(browserInput)}\n`);
		let settleBrowserResult;
		let browserSettled = false;
		const browserResultPromise = new Promise((resolve) => {
			settleBrowserResult = (value) => {
				if (browserSettled) return;
				browserSettled = true;
				resolve(value);
			};
		});
		const document =
			'<!doctype html><meta charset="utf-8"><title>S9 route capacity</title><pre id="status">running</pre><script type="module">import{runS9WholeRouteCapacity as run}from"/module.js";try{const result=await run();await fetch("/result",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(result)});document.querySelector("#status").textContent="complete"}catch(error){await fetch("/result",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}})});document.querySelector("#status").textContent="failed"}</script>';
		server = createServer(async (request, response) => {
			try {
				const url = new URL(request.url ?? '/', 'http://127.0.0.1');
				if (url.pathname === '/' && request.method === 'GET') {
					response.writeHead(200, {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'});
					response.end(document);
					return;
				}
				if (url.pathname === '/module.js' && request.method === 'GET') {
					response.writeHead(200, {
						'content-type': 'text/javascript; charset=utf-8',
						'cache-control': 'no-store',
					});
					response.end(browserModuleBytes);
					return;
				}
				if (url.pathname === '/browser-input.json' && request.method === 'GET') {
					response.writeHead(200, {
						'content-type': 'application/json',
						'content-length': browserInputBytes.byteLength,
						'cache-control': 'no-store',
					});
					response.end(browserInputBytes);
					return;
				}
				const blockMatch = /^\/blocks\/(\d+)$/u.exec(url.pathname);
				if (blockMatch && request.method === 'GET') {
					const blockNumber = Number(blockMatch[1]);
					const decoded = decodedBlocks.get(blockNumber);
					if (!decoded) {
						response.writeHead(404);
						response.end();
						return;
					}
					response.writeHead(200, {
						'content-type': 'application/octet-stream',
						'content-length': decoded.byteLength,
						'cache-control': 'no-store',
					});
					response.end(decoded);
					return;
				}
				if (url.pathname === '/progress' && request.method === 'POST') {
					const body = JSON.parse(await readBoundedBody(request, 4096));
					fail(
						Number.isInteger(body.completed) &&
							Number.isInteger(body.total) &&
							typeof body.message === 'string' &&
							body.message.length <= 256,
						'Invalid browser progress event.',
					);
					await progress('browser-upload', body.message, {
						completed: body.completed,
						total: body.total,
					});
					response.writeHead(204);
					response.end();
					return;
				}
				if (url.pathname === '/result' && request.method === 'POST') {
					const body = JSON.parse(await readBoundedBody(request, 2_000_000));
					settleBrowserResult(body);
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
		fail(address && typeof address !== 'string', 'S9 browser host did not bind to loopback.');
		await progress(
			'browser-allocation',
			'Launching Chrome for the 62-layer whole-route allocation and upload proof.',
			{completed: 0, total: uniqueBlockIndices.length},
		);
		child = spawn(
			CHROME_EXECUTABLE,
			[
				'--headless=new',
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--use-angle=d3d11',
				'--disable-software-rasterizer',
				'--disable-background-timer-throttling',
				'--no-first-run',
				`http://127.0.0.1:${address.port}/`,
			],
			{windowsHide: true},
		);
		child.once('error', (error) =>
			settleBrowserResult({error: {name: error.name, message: error.message, phase: 'chrome-spawn'}}),
		);
		child.once('exit', (code, signal) => {
			if (!browserSettled) {
				settleBrowserResult({
					error: {
						name: 'ChromeExitError',
						message: `Chrome exited before publishing S9 evidence: code=${code}, signal=${signal}.`,
						phase: 'browser-capacity',
					},
				});
			}
		});
		const timeout = setTimeout(
			() =>
				settleBrowserResult({
					error: {
						name: 'TimeoutError',
						message: 'Chrome did not publish S9 whole-route evidence within twenty minutes.',
						phase: 'browser-capacity',
					},
				}),
			20 * 60 * 1000,
		);
		const browserResult = await browserResultPromise;
		clearTimeout(timeout);
		if (child.exitCode === null) child.kill();
		await new Promise((resolve) => server.close(resolve));
		server = undefined;
		await writeFile(path.join(runDirectory, 'browser-result.json'), `${JSON.stringify(browserResult, null, 2)}\n`, {
			flag: 'wx',
		});
		fail(!browserResult.error, `${browserResult.error?.name}: ${browserResult.error?.message}`);
		const wholeRouteAccepted =
			browserResult.accepted === true &&
			browserResult.wholeRouteAllocated === true &&
			browserResult.uploadedBlockCount === uniqueBlockIndices.length &&
			browserResult.uploadedBytes === totalDecodedBytes &&
			browserResult.mismatchCount === 0 &&
			browserResult.contextLost === false;
		const explicitAllocationFailure =
			browserResult.wholeRouteAllocated === false && typeof browserResult.failure === 'string';
		fail(
			wholeRouteAccepted || explicitAllocationFailure,
			'Whole-route browser proof is neither accepted nor an explicit allocation-capacity failure.',
		);
		const selectedPreparationPath = wholeRouteAccepted
			? 'whole-route-gpu-resident'
			: 'decoded-cpu-pool-with-24-layer-sliding-gpu-window';
		const accepted = wholeRouteAccepted || (explicitAllocationFailure && fallback.accepted);
		const result = {
			schemaId: 'gpu-resident-shared-block-cache-s9-capacity-result-v1',
			runId,
			accepted,
			conclusion: accepted ? 'accepted' : 'failed',
			selectedPreparationPath,
			wholeRouteGpuResidency: {
				accepted: wholeRouteAccepted,
				failure: wholeRouteAccepted ? null : browserResult.failure,
				requestedLayers: control.preparation.wholeRouteGpuCandidate.layers,
				requestedBytes: control.preparation.wholeRouteGpuCandidate.decodedBytes,
			},
			fallback,
			route: {
				sceneCount: scenes.length,
				uniqueBlockCount: uniqueBlockIndices.length,
				encodedBytes: totalEncodedBytes,
				decodedBytes: totalDecodedBytes,
			},
			nodePreparation: {
				totalZstandardMilliseconds,
				totalInverseShuffleMilliseconds,
				totalDecodeMilliseconds: totalZstandardMilliseconds + totalInverseShuffleMilliseconds,
				peakRssBytes: process.memoryUsage().rss,
				heapUsedBytes: process.memoryUsage().heapUsed,
				externalBytes: process.memoryUsage().external,
			},
			browser: browserResult,
			playbackBoundary: {
				encodedTransfer: 'none',
				zstandardDecode: 'none',
				inverseShuffle: 'none',
				blockAuthentication: 'none',
				sceneLookupConstruction: 'none',
				decodedGpuUpload: wholeRouteAccepted ? 'none' : 'declared sliding-window work',
			},
		};
		fail(accepted, 'S9 whole-route preparation has no accepted capacity path.');
		await writeFile(path.join(runDirectory, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, {flag: 'wx'});
		await progress(
			'terminal',
			wholeRouteAccepted
				? 'Accepted the fully authenticated 62-layer whole-route GPU-resident preparation path.'
				: 'Rejected whole-route GPU residency and accepted the frozen decoded-CPU sliding-window fallback.',
			undefined,
			'accepted',
		);
		clearInterval(heartbeat);
		await progressTail;
		const manifest = await artifactManifest(runDirectory);
		await writeFile(path.join(runDirectory, 'artifact-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, {
			flag: 'wx',
		});
		process.stdout.write(
			`${JSON.stringify(
				{
					runId,
					accepted,
					selectedPreparationPath,
					route: result.route,
					wholeRouteGpuResidency: result.wholeRouteGpuResidency,
					fallback,
				},
				null,
				2,
			)}\n`,
		);
		return {runId, runDirectory};
	} catch (error) {
		clearInterval(heartbeat);
		if (child?.exitCode === null) child.kill();
		if (server) await new Promise((resolve) => server.close(resolve));
		await progressTail.catch(() => undefined);
		const failure = {
			schemaId: 'gpu-resident-shared-block-cache-s9-capacity-result-v1',
			runId,
			accepted: false,
			conclusion: 'failed',
			error: {
				name: error instanceof Error ? error.name : 'Error',
				message: error instanceof Error ? error.message : String(error),
			},
		};
		try {
			await writeFile(path.join(runDirectory, 'result.json'), `${JSON.stringify(failure, null, 2)}\n`, {flag: 'wx'});
		} catch {
			// Preserve an already written result rather than overwriting evidence.
		}
		await progress(
			'terminal',
			`S9 whole-route capacity proof failed: ${failure.error.message}`,
			undefined,
			'failed',
		).catch(() => undefined);
		await progressTail.catch(() => undefined);
		try {
			const manifest = await artifactManifest(runDirectory);
			await writeFile(path.join(runDirectory, 'artifact-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, {
				flag: 'wx',
			});
		} catch {
			// The primary failure remains authoritative when terminal publication also fails.
		}
		throw error;
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
