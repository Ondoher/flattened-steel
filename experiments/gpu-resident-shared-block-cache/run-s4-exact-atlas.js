#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {zstdDecompressSync} from 'node:zlib';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import {CHROME_EXECUTABLE, OUTPUT_ROOT, REPOSITORY_ROOT, SOURCE_ROOT} from './consts.js';

const CONTROL_PATH = 'experiments/gpu-resident-shared-block-cache/controls/s0-s2-animation-atlas-contract-v2.json';
const CANDIDATE_ROOT = 'tmp/experiments/distant-sun-cache-optimization/runs/000041-e1-format-compression/candidate';
const RUN_SLUG = 's5-animation-measurement';
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fail = (value, message) => { if (!value) throw new Error(message); };

function inverseShuffle(source) {
	fail(source.byteLength % 4 === 0, 'E1 shuffled block is not Float32 aligned.');
	const output = Buffer.allocUnsafe(source.byteLength);
	const values = source.byteLength / 4;
	for (let index = 0; index < values; index += 1) for (let lane = 0; lane < 4; lane += 1) output[index * 4 + lane] = source[lane * values + index];
	return output;
}

async function contained(root, relative) {
	fail(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u.test(relative) && !relative.includes('..'), `Unsafe path: ${relative}`);
	const rootReal = await realpath(root);
	const target = await realpath(path.join(rootReal, ...relative.split('/')));
	fail(target.startsWith(`${rootReal}${path.sep}`), `Path escapes root: ${relative}`);
	return target;
}

async function main() {
	const controlBytes = await readFile(await contained(REPOSITORY_ROOT, CONTROL_PATH));
	const control = JSON.parse(controlBytes);
	fail(control.schemaId === 'gpu-resident-shared-block-cache-s0-s2-contract-v2', 'Invalid S4 control.');
	for (const parent of Object.values(control.parents)) if (parent.path) fail(sha256(await readFile(await contained(REPOSITORY_ROOT, parent.path))) === parent.sha256, `Changed parent: ${parent.path}`);
	const candidate = await contained(REPOSITORY_ROOT, CANDIDATE_ROOT);
	const indexBytes = await readFile(await contained(REPOSITORY_ROOT, `${CANDIDATE_ROOT}/${control.parents.e1.blockIndex.path.replace(/^.*candidate\//u, '')}`));
	fail(sha256(indexBytes) === control.parents.e1.blockIndex.sha256, 'Pinned E1 block index changed.');
	const index = JSON.parse(indexBytes);
	const required = [...new Set(Object.values(control.animation.requiredBlockIndices).flat())].sort((a, b) => a - b);
	const blocks = new Map();
	let nodeDecodeMilliseconds = 0;
	let nodeZstandardMilliseconds = 0;
	let nodeInverseShuffleMilliseconds = 0;
	let encodedTransferBytes = 0;
	for (const number of required) {
		const block = index.blocks[number];
		fail(block, `Missing frozen block index ${number}.`);
		const encoded = await readFile(await contained(candidate, block.path));
		fail(encoded.byteLength === block.encodedByteLength && sha256(encoded) === block.encodedSha256, `Encoded identity failed for block ${number}.`);
		const decodeStarted = performance.now();
		const shuffled = zstdDecompressSync(encoded, {maxOutputLength: block.decodedByteLength});
		const zstandardMilliseconds = performance.now() - decodeStarted;
		nodeZstandardMilliseconds += zstandardMilliseconds;
		const inverseStarted = performance.now();
		const decoded = inverseShuffle(shuffled);
		const inverseShuffleMilliseconds = performance.now() - inverseStarted;
		nodeInverseShuffleMilliseconds += inverseShuffleMilliseconds;
		nodeDecodeMilliseconds += performance.now() - decodeStarted;
		encodedTransferBytes += encoded.byteLength;
		fail(decoded.byteLength === block.decodedByteLength && sha256(decoded) === block.decodedSha256, `Decoded identity failed for block ${number}.`);
		blocks.set(number, {block, decoded, zstandardMilliseconds, inverseShuffleMilliseconds});
	}
	await mkdir(OUTPUT_ROOT, {recursive: true});
	const runId = `${Date.now()}-${RUN_SLUG}`;
	const runDirectory = path.join(OUTPUT_ROOT, 'runs', runId);
	await mkdir(path.join(OUTPUT_ROOT, 'runs'), {recursive: true});
	await mkdir(runDirectory);
	const progress = async (phase, message, state) => writeFile(path.join(runDirectory, 'progress.jsonl'), `${JSON.stringify({timestamp: new Date().toISOString(), phase, message, ...(state ? {state} : {})})}\n`, {flag: 'a'});
	await Promise.all([
		writeFile(path.join(runDirectory, 'command.txt'), 'node experiments/gpu-resident-shared-block-cache/run-s4-exact-atlas.js (S5 measurement mode)\n', {flag: 'wx'}),
		writeFile(path.join(runDirectory, 'inputs.json'), `${JSON.stringify({control: {path: CONTROL_PATH, sha256: sha256(controlBytes)}, e1BlockIndex: control.parents.e1.blockIndex, requiredBlockIndices: required}, null, 2)}\n`, {flag: 'wx'}),
		writeFile(path.join(runDirectory, 'provenance.json'), `${JSON.stringify({operation: 'authenticate real E1 compressed and decoded blocks, then upload only authenticated Float32 blocks to a bounded WebGL2 texture array and compare shader readback against decoded dense references', parentRun: control.parents.e1.runId, blockCount: required.length}, null, 2)}\n`, {flag: 'wx'}),
		writeFile(path.join(runDirectory, 'environment.json'), `${JSON.stringify({node: process.version, platform: process.platform, architecture: process.arch, logicalCpuCount: os.cpus().length}, null, 2)}\n`, {flag: 'wx'}),
	]);
	await progress('authenticate', `Authenticated ${required.length} E1 blocks before browser upload.`);
	let resolveResult;
	const resultPromise = new Promise((resolve) => { resolveResult = resolve; });
	const document = '<!doctype html><pre id="result">pending</pre><script type="module">import{runS4ExactAtlas}from"/module.js";try{const r=await runS4ExactAtlas();await fetch("/result",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(r)});document.querySelector("#result").textContent="ok"}catch(e){await fetch("/result",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({error:{name:e.name,message:e.message}})});document.querySelector("#result").textContent="error"}</script>';
	const server = createServer(async (request, response) => {
		const url = new URL(request.url ?? '/', 'http://127.0.0.1');
		if (url.pathname === '/') { response.writeHead(200, {'content-type': 'text/html'}); response.end(document); return; }
		if (url.pathname === '/control.json') { response.writeHead(200, {'content-type': 'application/json'}); response.end(controlBytes); return; }
		if (url.pathname === '/module.js') { response.writeHead(200, {'content-type': 'text/javascript'}); response.end(await readFile(path.join(SOURCE_ROOT, 'browser', 's4-exact-atlas-browser.js'))); return; }
		if (url.pathname.startsWith('/blocks/')) { const number = Number(url.pathname.slice('/blocks/'.length)); const entry = blocks.get(number); if (!entry) { response.writeHead(404); response.end(); return; } response.writeHead(200, {'content-type': 'application/octet-stream', 'content-length': entry.decoded.byteLength, 'x-decoded-sha256': entry.block.decodedSha256, 'x-encoded-byte-length': entry.block.encodedByteLength, 'x-zstandard-milliseconds': entry.zstandardMilliseconds, 'x-inverse-shuffle-milliseconds': entry.inverseShuffleMilliseconds}); response.end(entry.decoded); return; }
		if (url.pathname.startsWith('/corrupt-blocks/')) { const number = Number(url.pathname.slice('/corrupt-blocks/'.length)); const entry = blocks.get(number); if (!entry) { response.writeHead(404); response.end(); return; } const corrupt = Buffer.from(entry.decoded); corrupt[0] ^= 0xff; response.writeHead(200, {'content-type': 'application/octet-stream', 'content-length': corrupt.byteLength, 'x-decoded-sha256': entry.block.decodedSha256}); response.end(corrupt); return; }
		if (url.pathname === '/result' && request.method === 'POST') { let body = ''; for await (const chunk of request) { body += chunk; if (body.length > 1_000_000) throw new Error('S4 result exceeds bound.'); } resolveResult(JSON.parse(body)); response.writeHead(204); response.end(); return; }
		response.writeHead(404); response.end();
	});
	await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
	const address = server.address(); fail(address && typeof address !== 'string', 'S4 host did not bind.');
	await progress('browser-exactness', 'Launching Chrome exact shader-readback qualification.');
	const heartbeat = setInterval(() => void progress('browser-exactness', 'Chrome exact shader-readback qualification remains active.'), 30_000);
	const child = spawn(CHROME_EXECUTABLE, ['--headless=new', '--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-software-rasterizer', `http://127.0.0.1:${address.port}/`], {windowsHide: true});
	const timeout = setTimeout(() => resolveResult({error: {name: 'TimeoutError', message: 'S4 browser did not return within ten minutes.'}}), 600_000);
	const result = await resultPromise;
	clearTimeout(timeout); clearInterval(heartbeat); if (child.exitCode === null) child.kill(); await new Promise((resolve) => server.close(resolve));
	await writeFile(path.join(runDirectory, 'browser-result.json'), `${JSON.stringify(result, null, 2)}\n`, {flag: 'wx'});
	if (result.error) throw new Error(`${result.error.name}: ${result.error.message}`);
	fail(result.accepted === true && result.mismatches === 0, 'S4 exactness result is not accepted.');
	const frames = result.frames;
	fail(frames.length === control.animation.sequenceDegrees.length, 'S5 frame count is incomplete.');
	fail(frames[1].predictorHit && frames[1].reusedBlocks === frames[1].requiredBlocks, 'S5 91-degree prefetch hit failed.');
	fail(frames[2].predictorHit && frames[2].uploadedBlocks === 0, 'S5 92-degree prefetch hit failed.');
	fail(frames[3].predictorCancellation && frames[4].predictorCancellation, 'S5 capacity cancellation controls failed.');
	const totals = (field) => frames.reduce((sum, frame) => sum + frame[field], 0);
	const summary = {
		sequenceDegrees: control.animation.sequenceDegrees,
		residencyBudgetBlocks: control.atlas.maximumResidentLayers,
		predictorHorizonScenes: 1,
		predictorHitFrames: frames.filter((frame) => frame.predictorHit).map((frame) => frame.degrees),
		predictorCancellationFrames: frames.filter((frame) => frame.predictorCancellation).map((frame) => frame.degrees),
		totalUploadedBlocks: totals('uploadedBlocks'),
		totalUploadedBytes: totals('uploadedBytes'),
		totalEncodedTransferBytes: totals('encodedTransferBytes'),
		totalGpuUploadMilliseconds: totals('gpuUploadMilliseconds'),
		totalTransferMilliseconds: totals('transferMilliseconds'),
		totalDenseReconstructionMilliseconds: totals('denseReconstructionMilliseconds'),
		totalDenseGpuUploadMilliseconds: totals('denseGpuUploadMilliseconds'),
		peakBrowserMainBytes: Math.max(...frames.map((frame) => frame.peakBrowserMainBytes ?? 0)),
		adjacentReuseAccepted:
			frames[1].reusedBlocks === frames[1].requiredBlocks &&
			frames[2].reusedBlocks === frames[2].requiredBlocks &&
			frames[2].uploadedBlocks === 0,
		measurementBoundary:
			'Selection elapsed is measured browser wall time. Zstandard and inverse-shuffle values are sums of independently measured synchronous Node preparation for blocks selected by each frame; they are not concurrent wall-time intervals.',
	};
	const resultRecord = {schemaId: 'gpu-resident-shared-block-cache-s5-result-v2', runId, conclusion: 'accepted', accepted: true, nodeMeasurement: {queueMilliseconds: 0, nodeDecodeMilliseconds, nodeZstandardMilliseconds, nodeInverseShuffleMilliseconds, encodedTransferBytes, peakRssBytes: process.memoryUsage().rss}, summary, browser: result};
	await writeFile(path.join(runDirectory, 'result.json'), `${JSON.stringify(resultRecord, null, 2)}\n`, {flag: 'wx'});
	await progress('terminal', 'S5 predictive animation and resource measurement passed.', 'accepted');
	process.stdout.write(`${JSON.stringify({runId, summary}, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
