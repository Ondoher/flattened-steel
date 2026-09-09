#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {zstdDecompressSync} from 'node:zlib';
import {CHROME_EXECUTABLE, OUTPUT_ROOT, REPOSITORY_ROOT, SOURCE_ROOT} from './consts.js';

const fail = (value, message) => {
	if (!value) throw new Error(message);
};
const hash = (value) => createHash('sha256').update(value).digest('hex');
const inverseShuffle = (source) => {
	const output = Buffer.allocUnsafe(source.length);
	const count = source.length / 4;
	for (let index = 0; index < count; index += 1) {
		for (let lane = 0; lane < 4; lane += 1) output[index * 4 + lane] = source[lane * count + index];
	}
	return output;
};
const writeJson = (filePath, value) => writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);

const parentRoot = path.join(REPOSITORY_ROOT, 'tmp', 'experiments', 'distant-sun-cache-optimization', 'runs', '000041-e1-format-compression', 'candidate');
const index = JSON.parse(await readFile(path.join(parentRoot, 'metadata', 'indexes', 'block-index-087eb111cc978fa870bc9e98f418cfe1b86790b4620ac681002387a5d17a37a7.json')));
const block = index.blocks[10];
const encoded = await readFile(path.join(parentRoot, ...block.path.split('/')));
fail(hash(encoded) === block.encodedSha256, 'Encoded parent block identity failed.');
const decoded = inverseShuffle(zstdDecompressSync(encoded, {maxOutputLength: block.decodedByteLength}));
fail(hash(decoded) === block.decodedSha256, 'Decoded parent block identity failed.');

await mkdir(path.join(OUTPUT_ROOT, 'runs'), {recursive: true});
const runId = `${Date.now()}-s5-shader-lookup-benchmark-v5-4k`;
const run = path.join(OUTPUT_ROOT, 'runs', runId);
await mkdir(run);
let resolveResult;
const browserResult = new Promise((resolve) => {
	resolveResult = resolve;
});
const page = '<!doctype html><canvas width="3840" height="2160"></canvas><script type="module">import{runShaderLookupBenchmark as run}from"/module.js";try{await fetch("/result",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(await run())})}catch(error){await fetch("/result",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accepted:false,error:{name:error.name,message:error.message}})})}</script>';
const server = createServer(async (request, response) => {
	if (request.url === '/') { response.end(page); return; }
	if (request.url === '/module.js') { response.writeHead(200, {'content-type': 'text/javascript'}); response.end(await readFile(path.join(SOURCE_ROOT, 'browser', 's5-shader-lookup-benchmark-browser.js'))); return; }
	if (request.url === '/block') { response.end(decoded); return; }
	if (request.url === '/result') { let body = ''; for await (const chunk of request) body += chunk; resolveResult(JSON.parse(body)); response.end(); return; }
	response.statusCode = 404;
	response.end();
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = spawn(CHROME_EXECUTABLE, ['--headless=new', '--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11', `http://127.0.0.1:${server.address().port}/`], {windowsHide: true});
const timeout = setTimeout(() => resolveResult({accepted: false, error: {name: 'TimeoutError', message: 'No browser result.'}}), 120_000);
const result = await browserResult;
clearTimeout(timeout);
browser.kill();
await new Promise((resolve) => server.close(resolve));
await writeJson(path.join(run, 'browser-result.json'), result);
await writeJson(path.join(run, 'result.json'), {runId, accepted: result.accepted, browser: result});
await writeFile(path.join(run, 'progress.jsonl'), `${JSON.stringify({timestamp: new Date().toISOString(), phase: 'terminal', message: 'GPU timer-query benchmark completed.', state: result.accepted ? 'accepted' : 'failed'})}\n`);
if (!result.accepted) throw new Error(result.reason ?? `${result.error.name}: ${result.error.message}`);
process.stdout.write(`${JSON.stringify({runId, result}, null, 2)}\n`);
