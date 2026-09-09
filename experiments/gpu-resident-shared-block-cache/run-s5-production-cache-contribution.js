#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {mkdir, open, readFile, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {CHROME_EXECUTABLE, OUTPUT_ROOT, REPOSITORY_ROOT, SOURCE_ROOT} from './consts.js';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const sha256File = async (filePath) => {
	const digest = createHash('sha256');
	for await (const chunk of createReadStream(filePath)) digest.update(chunk);
	return digest.digest('hex');
};
const packageRoot = path.join(
	REPOSITORY_ROOT,
	'server',
	'flat32',
	'data',
	'one-degree-bin-covered-runtime-packages-20260830-1',
	'packages',
	'0297591778dc34202776714fa7579454966d5922204de8a382eb4cfdc25ef504',
);
const manifestPath = path.join(
	packageRoot,
	'scene-cache-manifest-6a8be5ea13f296801f37f7c0d23e14f30bb60df270c63464cfefb2371b6d974c.json',
);
const manifestBytes = await readFile(manifestPath);
const manifest = JSON.parse(manifestBytes);
const seamPath = path.join(packageRoot, manifest.exactSeamPayload.path);
const [seamSha256, map, ledgerBytes] = await Promise.all([
	sha256File(seamPath),
	readFile(path.join(packageRoot, manifest.logicalToUniqueIndex.path)),
	readFile(path.join(packageRoot, manifest.ledgerPath)),
]);
if (seamSha256 !== manifest.exactSeamPayload.sha256) throw new Error('Production seam identity failed.');
if (sha256(map) !== manifest.logicalToUniqueIndex.sha256) throw new Error('Direction-map identity failed.');
if (sha256(ledgerBytes) !== manifest.ledgerSha256) throw new Error('Ledger identity failed.');
const ledger = JSON.parse(ledgerBytes);
const residentLayers = 24;
const rowByteLength = 4058 * Float32Array.BYTES_PER_ELEMENT;
const residentSeam = Buffer.allocUnsafe(residentLayers * rowByteLength * 15);
const seamFile = await open(seamPath, 'r');
try {
	for (let channel = 0; channel < 15; channel += 1) {
		await seamFile.read(
			residentSeam,
			channel * residentLayers * rowByteLength,
			residentLayers * rowByteLength,
			channel * ledger.retainedBlockCount * rowByteLength,
		);
	}
} finally {
	await seamFile.close();
}

await mkdir(path.join(OUTPUT_ROOT, 'runs'), {recursive: true});
const runId = `${Date.now()}-s5-production-cache-contribution-4k`;
const runRoot = path.join(OUTPUT_ROOT, 'runs', runId);
await mkdir(runRoot);
let resolveResult;
const resultPromise = new Promise((resolve) => {
	resolveResult = resolve;
});
const page = '<!doctype html><canvas width="3840" height="2160"></canvas><script type="module">import{runProductionCacheContribution as run}from"/module.js";try{await fetch("/result",{method:"POST",body:JSON.stringify(await run())})}catch(error){await fetch("/result",{method:"POST",body:JSON.stringify({accepted:false,error:error.message,stack:error.stack})})}</script>';
const server = createServer(async (request, response) => {
	if (request.url === '/') return response.end(page);
	if (request.url === '/module.js') {
		response.writeHead(200, {'content-type': 'text/javascript; charset=utf-8'});
		return response.end(
			await readFile(path.join(SOURCE_ROOT, 'browser', 's5-production-cache-contribution-browser.js')),
		);
	}
	if (request.url === '/seam') return response.end(residentSeam);
	if (request.url === '/map') return response.end(map);
	if (request.url === '/meta')
		return response.end(
			JSON.stringify({layers: residentLayers, parentLayers: ledger.retainedBlockCount, manifest}),
		);
	if (request.url === '/progress') {
		let phase = '';
		for await (const chunk of request) phase += chunk;
		process.stdout.write(`Browser phase: ${phase}\n`);
		return response.end();
	}
	if (request.url === '/result') {
		let body = '';
		for await (const chunk of request) body += chunk;
		resolveResult(JSON.parse(body));
		return response.end();
	}
	response.statusCode = 404;
	response.end();
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = spawn(
	CHROME_EXECUTABLE,
	[
		'--headless=new',
		'--enable-gpu',
		'--enable-webgl',
		'--ignore-gpu-blocklist',
		'--use-angle=d3d11',
		`http://127.0.0.1:${server.address().port}`,
	],
	{windowsHide: true, stdio: ['ignore', 'ignore', 'pipe']},
);
browser.stderr.on('data', (chunk) => process.stderr.write(chunk));
const heartbeat = setInterval(() => process.stdout.write('S5 cache-contribution benchmark active.\n'), 10_000);
const timeout = setTimeout(
	() => resolveResult({accepted: false, error: 'Browser result timed out.'}),
	300_000,
);
const result = await resultPromise;
clearTimeout(timeout);
clearInterval(heartbeat);
browser.kill();
await new Promise((resolve) => server.close(resolve));
const record = {
	runId,
	result,
	inputs: {
		manifestSha256: sha256(manifestBytes),
		seamSha256,
		residentSeamSha256: sha256(residentSeam),
		residentRows: residentLayers,
		parentRows: ledger.retainedBlockCount,
		directionMapSha256: sha256(map),
		ledgerSha256: sha256(ledgerBytes),
	},
};
await writeFile(path.join(runRoot, 'result.json'), `${JSON.stringify(record, null, 2)}\n`);
await writeFile(
	path.join(runRoot, 'progress.jsonl'),
	`${JSON.stringify({timestamp: new Date().toISOString(), phase: 'terminal', state: result.accepted ? 'accepted' : 'failed', message: 'Production cache-contribution comparison completed.'})}\n`,
);
if (!result.accepted) throw new Error(result.error ?? 'Comparison failed.');
process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
