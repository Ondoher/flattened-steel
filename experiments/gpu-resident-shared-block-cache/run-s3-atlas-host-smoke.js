#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CHROME_EXECUTABLE, OUTPUT_ROOT, REPOSITORY_ROOT, SOURCE_ROOT} from './consts.js';

const CONTROL_PATH = 'experiments/gpu-resident-shared-block-cache/controls/s0-s2-animation-atlas-contract.json';
const RUN_SLUG = 's3-atlas-host-smoke';
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fail = (value, message) => { if (!value) throw new Error(message); };

async function containedFile(root, relativePath) {
	if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/u.test(relativePath) || relativePath.includes('..')) throw new Error(`Invalid contained path: ${relativePath}`);
	const rootReal = await realpath(root);
	const target = await realpath(path.join(rootReal, ...relativePath.split('/')));
	if (!target.startsWith(`${rootReal}${path.sep}`)) throw new Error(`Path escapes its root: ${relativePath}`);
	return target;
}

async function main() {
	const controlFile = await containedFile(REPOSITORY_ROOT, CONTROL_PATH);
	const controlBytes = await readFile(controlFile);
	const control = JSON.parse(controlBytes);
	fail(control.schemaId === 'gpu-resident-shared-block-cache-s0-s2-contract-v1', 'S3 control schema is invalid.');
	for (const parent of Object.values(control.parents)) {
		if (!parent.path) continue;
		const bytes = await readFile(await containedFile(REPOSITORY_ROOT, parent.path));
		fail(sha256(bytes) === parent.sha256, `Pinned parent changed: ${parent.path}`);
	}
	await mkdir(OUTPUT_ROOT, {recursive: true});
	const runId = `${Date.now()}-${RUN_SLUG}`;
	const runDirectory = path.join(OUTPUT_ROOT, 'runs', runId);
	await mkdir(path.dirname(runDirectory), {recursive: true});
	await mkdir(runDirectory, {recursive: false});
	const progress = async (phase, message, state) => writeFile(path.join(runDirectory, 'progress.jsonl'), `${JSON.stringify({timestamp: new Date().toISOString(), phase, message, ...(state ? {state} : {})})}\n`, {flag: 'a'});
	await Promise.all([
		writeFile(path.join(runDirectory, 'command.txt'), 'node experiments/gpu-resident-shared-block-cache/run-s3-atlas-host-smoke.js\n', {flag: 'wx'}),
		writeFile(path.join(runDirectory, 'inputs.json'), `${JSON.stringify({control: {path: CONTROL_PATH, sha256: sha256(controlBytes)}, parents: control.parents}, null, 2)}\n`, {flag: 'wx'}),
		writeFile(path.join(runDirectory, 'provenance.json'), `${JSON.stringify({operation: 'serve the frozen S0--S2 contract through a loopback-only host and compile the shader-addressable texture-array path in headless Chrome', sourceRoot: 'experiments/gpu-resident-shared-block-cache', parentEvidence: Object.keys(control.parents)}, null, 2)}\n`, {flag: 'wx'}),
		writeFile(path.join(runDirectory, 'environment.json'), `${JSON.stringify({node: process.version, platform: process.platform, architecture: process.arch, logicalCpuCount: os.cpus().length}, null, 2)}\n`, {flag: 'wx'}),
	]);
	await progress('initialize', 'Pinned S0--S2 control and allocated the immutable S3 smoke run.');
	let resolveResult;
	const resultPromise = new Promise((resolve) => { resolveResult = resolve; });
	const document = '<!doctype html><pre id="result">pending</pre><script type="module">import{runS3AtlasHostSmoke}from"/module.js";const target=document.querySelector("#result");try{const result=await runS3AtlasHostSmoke();await fetch("/result",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(result)});target.textContent="ok";}catch(error){await fetch("/result",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({error:{name:error.name,message:error.message}})});target.textContent="error";}</script>';
	const server = createServer(async (request, response) => {
		const url = new URL(request.url ?? '/', 'http://127.0.0.1');
		if (url.pathname === '/') { response.writeHead(200, {'content-type': 'text/html; charset=utf-8'}); response.end(document); return; }
		if (url.pathname === '/control.json') { response.writeHead(200, {'content-type': 'application/json'}); response.end(controlBytes); return; }
		if (url.pathname === '/module.js') { response.writeHead(200, {'content-type': 'text/javascript; charset=utf-8'}); response.end(await readFile(path.join(SOURCE_ROOT, 'browser', 's3-atlas-host-smoke-browser.js'))); return; }
		if (url.pathname === '/S3ProbePaths.js') { response.writeHead(200, {'content-type': 'text/javascript; charset=utf-8'}); response.end(await readFile(path.join(SOURCE_ROOT, 'browser', 'S3ProbePaths.js'))); return; }
		if (url.pathname === '/result' && request.method === 'POST') { let body = ''; for await (const chunk of request) { body += chunk; if (body.length > 65536) throw new Error('S3 result exceeds host bound.'); } resolveResult(JSON.parse(body)); response.writeHead(204); response.end(); return; }
		response.writeHead(404); response.end();
	});
	await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
	const address = server.address();
	fail(address && typeof address !== 'string', 'S3 loopback host did not bind.');
	await progress('browser-smoke', 'Launching loopback-only Chrome atlas capability smoke proof.');
	const child = spawn(CHROME_EXECUTABLE, ['--headless=new', '--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-software-rasterizer', `http://127.0.0.1:${address.port}/`], {windowsHide: true});
	const timeout = setTimeout(() => resolveResult({error: {name: 'TimeoutError', message: 'S3 browser did not return within 60 seconds.'}}), 60_000);
	const result = await resultPromise;
	clearTimeout(timeout);
	if (child.exitCode === null) child.kill();
	await new Promise((resolve) => server.close(resolve));
	await writeFile(path.join(runDirectory, 'browser-result.json'), `${JSON.stringify(result, null, 2)}\n`, {flag: 'wx'});
	if (result.error) throw new Error(`${result.error.name}: ${result.error.message}`);
	await writeFile(path.join(runDirectory, 'result.json'), `${JSON.stringify({schemaId: 'gpu-resident-shared-block-cache-s3-result-v1', runId, conclusion: 'accepted', accepted: true, browser: result}, null, 2)}\n`, {flag: 'wx'});
	await progress('terminal', 'S3 loopback host and WebGL2 atlas shader capability proof passed.', 'accepted');
	process.stdout.write(`${JSON.stringify({runId, result}, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
