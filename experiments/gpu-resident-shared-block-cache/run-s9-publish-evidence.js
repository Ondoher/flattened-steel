#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {
	appendFile,
	copyFile,
	lstat,
	mkdir,
	readFile,
	readdir,
	realpath,
	rm,
	stat,
	writeFile,
} from 'node:fs/promises';
import {createServer} from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import puppeteer from 'puppeteer';

import {CHROME_EXECUTABLE, OUTPUT_ROOT, REPOSITORY_ROOT, SOURCE_ROOT} from './consts.js';

const RUN_SLUG = 's9-published-evidence';
const WIDTH = 3840;
const HEIGHT = 2160;
const FRAME_COUNT = 1200;
const FPS = 60;
const CONTROL = 'experiments/gpu-resident-shared-block-cache/controls/s9-trace-driven-animation-contract.json';
const PARENTS = Object.freeze({
	trace78: Object.freeze({
		runId: '1788918482263-s9-animation-trace',
		root: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788918482263-s9-animation-trace',
		artifactSetSha256: 'd7d5a46042ea00124b50bcdb2b7ef4f68130dec8aa7242996ccc4adba8f265b4',
	}),
	trace55: Object.freeze({
		runId: '1788919164368-s9-animation-trace-fov55',
		root: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788919164368-s9-animation-trace-fov55',
		artifactSetSha256: 'f2e4389e35999bfeab88e5ca0fb26bf05a3b5209158eb23d4a228faba8469589',
	}),
	replay: Object.freeze({
		runId: '1788919958694-s9-presentation-replay',
		root: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788919958694-s9-presentation-replay',
		artifactSetSha256: 'db3b6283a0e37c9ddeb79be0f447b22367e25499e71aa928ec2c9ff423419105',
	}),
	video: Object.freeze({
		runId: '1788923711177-s9-deterministic-video',
		root: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788923711177-s9-deterministic-video',
		artifactSetSha256: '07c014ba6d0e029b4dc0c35721e013a5b4d662d585bd1c17fbea10fe6d745b01',
	}),
});
const FOVS = Object.freeze([
	Object.freeze({id: 'fov78', degrees: 78, traceParent: 'trace78'}),
	Object.freeze({id: 'fov55', degrees: 55, traceParent: 'trace55'}),
]);
const INSPECTION_SECONDS = Object.freeze([0.1, 10, 19.8]);

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

async function collectArtifacts(root, relative = '') {
	const artifacts = [];
	for (const name of (await readdir(path.join(root, relative))).sort()) {
		const childRelative = relative ? `${relative}/${name}` : name;
		if (childRelative === 'artifact-manifest.json') continue;
		const absolute = path.join(root, ...childRelative.split('/'));
		const information = await lstat(absolute);
		fail(!information.isSymbolicLink(), `Unexpected S9.6 symlink: ${childRelative}`);
		if (information.isDirectory()) artifacts.push(...(await collectArtifacts(root, childRelative)));
		else {
			fail(information.isFile(), `Unexpected S9.6 run entry: ${childRelative}`);
			const bytes = await readFile(absolute);
			artifacts.push({path: childRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)});
		}
	}
	return artifacts;
}

async function verifyParent(parent, repositoryRoot) {
	const manifestPath = await requireContainedFile(repositoryRoot, `${parent.root}/artifact-manifest.json`, 'Parent manifest');
	const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
	fail(manifest.artifactSetSha256 === parent.artifactSetSha256, `${parent.runId} artifact-set identity changed.`);
	fail(
		sha256(Buffer.from(JSON.stringify(manifest.artifacts))) === manifest.artifactSetSha256,
		`${parent.runId} manifest set hash changed.`,
	);
	for (const artifact of manifest.artifacts) {
		const absolute = await requireContainedFile(repositoryRoot, `${parent.root}/${artifact.path}`, 'Parent artifact');
		const bytes = await readFile(absolute);
		fail(
			bytes.byteLength === artifact.byteLength && sha256(bytes) === artifact.sha256,
			`${parent.runId}/${artifact.path} identity changed.`,
		);
	}
	const result = JSON.parse(
		await readFile(await requireContainedFile(repositoryRoot, `${parent.root}/result.json`, 'Parent result'), 'utf8'),
	);
	fail(result.accepted === true && result.runId === parent.runId, `${parent.runId} is not the accepted parent.`);
	return {manifest, result};
}

const parseJsonLines = (bytes) =>
	bytes
		.toString('utf8')
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line));

function buildTimeline(ideal, trace, frames, fov) {
	fail(ideal.length === FRAME_COUNT && trace.length === FRAME_COUNT, `${fov.id} mapping length changed.`);
	const framesById = new Map(frames.map((frame) => [frame.frameId, frame]));
	const groupLength = new Array(trace.length).fill(1);
	const groupOrdinal = new Array(trace.length).fill(0);
	for (let start = 0; start < trace.length; ) {
		let end = start + 1;
		while (end < trace.length && trace[end].sourceFrameId === trace[start].sourceFrameId) end += 1;
		for (let index = start; index < end; index += 1) {
			groupLength[index] = end - start;
			groupOrdinal[index] = index - start;
		}
		start = end;
	}
	let previousNewFrame = null;
	return trace.map((entry, slotIndex) => {
		fail(entry.slotIndex === slotIndex && ideal[slotIndex].slotIndex === slotIndex, `${fov.id} slots changed.`);
		const frame = fail(framesById.get(entry.sourceFrameId), `${fov.id} source frame is missing.`);
		let callbackIntervalMicroseconds = null;
		if (!entry.heldFromPreviousSlot) {
			callbackIntervalMicroseconds = previousNewFrame
				? frame.animationCallbackMicroseconds - previousNewFrame.animationCallbackMicroseconds
				: 0;
			previousNewFrame = frame;
		}
		const cacheTransition =
			slotIndex === 0 || entry.state.cacheSceneDegrees !== trace[slotIndex - 1].state.cacheSceneDegrees;
		const idealCacheTransition =
			slotIndex === 0 || ideal[slotIndex].state.cacheSceneDegrees !== ideal[slotIndex - 1].state.cacheSceneDegrees;
		const markers = [];
		if (entry.heldFromPreviousSlot) markers.push('held-presentation-slot');
		if (cacheTransition) markers.push('cache-scene-transition');
		if (entry.measuredFrameAdvance > 1) markers.push('measured-frame-jump');
		return {
			slotIndex,
			timestampMicroseconds: entry.timestampMicroseconds,
			fovDegrees: fov.degrees,
			sourceFrameId: entry.sourceFrameId,
			sourceAnimationCallbackMicroseconds: entry.sourceAnimationCallbackMicroseconds,
			heldFromPreviousSlot: entry.heldFromPreviousSlot,
			holdGroupSlotCount: groupLength[slotIndex],
			holdGroupOrdinal: groupOrdinal[slotIndex],
			measuredFrameAdvance: entry.measuredFrameAdvance,
			callbackIntervalMicroseconds,
			gpuElapsedMicroseconds: frame.gpuElapsedMicroseconds,
			shaderCpuSubmitMicroseconds: frame.shaderCpuSubmitMicroseconds,
			cacheTransition,
			idealCacheTransition,
			markers,
			traceState: entry.state,
			idealState: ideal[slotIndex].state,
		};
	});
}

function summarizeTimeline(timeline) {
	const held = timeline.filter((entry) => entry.heldFromPreviousSlot);
	const transitions = timeline.filter((entry) => entry.cacheTransition);
	const jumps = timeline.filter((entry) => entry.measuredFrameAdvance > 1);
	const holdGroups = timeline.filter((entry) => entry.holdGroupOrdinal === 0 && entry.holdGroupSlotCount > 1);
	return {
		slotCount: timeline.length,
		heldSlotCount: held.length,
		holdGroupCount: holdGroups.length,
		maximumHoldGroupSlotCount: Math.max(...holdGroups.map((entry) => entry.holdGroupSlotCount)),
		cacheTransitionCount: transitions.length,
		measuredFrameJumpCount: jumps.length,
	};
}

function diagnosticHtml(fov, timeline, parentIdentities) {
	const safeTimeline = JSON.stringify(timeline).replaceAll('<', '\\u003c');
	const safeParents = JSON.stringify(parentIdentities).replaceAll('<', '\\u003c');
	return String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>S9 ${fov.degrees} degree diagnostic</title>
<style>
html,body{margin:0;background:#101319;color:#eef2f7;font:16px system-ui,sans-serif}main{padding:18px}.head{display:flex;justify-content:space-between;align-items:center;gap:16px}.note{color:#ffd18a}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pane{position:relative;background:#000;border:1px solid #4d5968}.pane video{display:block;width:100%;aspect-ratio:16/9;background:#000}.label{position:absolute;left:12px;top:10px;background:#000c;padding:6px 9px;font-weight:700}.overlay{position:absolute;left:12px;right:12px;bottom:12px;background:#07101be6;padding:8px 10px;font:14px ui-monospace,monospace;white-space:pre-wrap}.controls{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;margin:14px 0}.timeline{height:26px;background:#202733;position:relative}.mark{position:absolute;top:0;width:2px;height:100%;background:#f05}.cache{background:#fc3;height:45%}.readout{display:grid;grid-template-columns:1fr 1fr;gap:14px}.card{background:#171d26;padding:12px;white-space:pre-wrap;font:14px ui-monospace,monospace}button,input{font:inherit}input{width:100%}
</style></head><body><main>
<div class="head"><h1>S9 ${fov.degrees}° trace diagnostic</h1><div>4K source · 60 Hz evidence timeline · 20 seconds</div></div>
<p class="note">The trace view preserves measured holds. Sunrise/sunset appearance is known to look somewhat off in the live renderer; the often-too-gray horizon is deferred and is not attributed to encoding.</p>
<div class="grid"><section class="pane"><video id="ideal" muted preload="auto" src="../videos/${fov.id}-ideal.mp4"></video><div class="label">Ideal timing</div><div id="idealOverlay" class="overlay"></div></section><section class="pane"><video id="trace" muted preload="auto" src="../videos/${fov.id}-trace.mp4"></video><div class="label">Measured trace timing</div><div id="traceOverlay" class="overlay"></div></section></div>
<div class="controls"><button id="toggle">Play</button><input id="seek" type="range" min="0" max="1199" value="0" step="1"><output id="time">0.000 s</output></div>
<div id="timeline" class="timeline" aria-label="Held slots and cache transitions"></div>
<div class="readout"><div id="details" class="card"></div><div class="card">Legend<br>magenta = held presentation slot<br>yellow = cache-scene transition<br><br>Owner conclusion<br>Trace-faithful native-4K animation is smooth enough for the intended large-display use. This is not a sustained-60-FPS claim.</div></div>
<script>
const records=${safeTimeline}; const parents=${safeParents}; const ideal=document.querySelector('#ideal'); const trace=document.querySelector('#trace'); const seek=document.querySelector('#seek'); const time=document.querySelector('#time'); const details=document.querySelector('#details'); const idealOverlay=document.querySelector('#idealOverlay'); const traceOverlay=document.querySelector('#traceOverlay'); const timeline=document.querySelector('#timeline');
for(const r of records){if(r.heldFromPreviousSlot){const m=document.createElement('i');m.className='mark';m.style.left=(100*r.slotIndex/1199)+'%';timeline.append(m)}if(r.cacheTransition){const m=document.createElement('i');m.className='mark cache';m.style.left=(100*r.slotIndex/1199)+'%';timeline.append(m)}}
function update(slot){slot=Math.max(0,Math.min(1199,slot|0));const r=records[slot];seek.value=slot;time.value=(r.timestampMicroseconds/1e6).toFixed(3)+' s';idealOverlay.textContent='slot '+slot+'  zenith '+r.idealState.solarZenithDegrees.toFixed(3)+'°  cache '+r.idealState.cacheSceneDegrees+'°  Q'+r.idealState.qualityIntervalCount;traceOverlay.textContent='slot '+slot+'  source frame '+r.sourceFrameId+'  '+(r.heldFromPreviousSlot?'HELD':'new')+'  hold group '+r.holdGroupSlotCount+' slot(s)';details.textContent='trace solar zenith: '+r.traceState.solarZenithDegrees.toFixed(6)+'°\ncache scene: '+r.traceState.cacheSceneDegrees+'°\ncallback interval: '+(r.callbackIntervalMicroseconds===null?'held':(r.callbackIntervalMicroseconds/1000).toFixed(3)+' ms')+'\nGPU shader: '+(r.gpuElapsedMicroseconds/1000).toFixed(3)+' ms\nCPU shader submit: '+(r.shaderCpuSubmitMicroseconds/1000).toFixed(3)+' ms\nmarkers: '+(r.markers.join(', ')||'none')+'\nparent trace: '+parents.traceRunId+'\nparent replay: '+parents.replayRunId+'\nparent video: '+parents.videoRunId;}
function event(video,name){return new Promise((resolve,reject)=>{const ok=()=>{clean();resolve()};const bad=()=>{clean();reject(new Error('media '+name+' failed'))};const clean=()=>{video.removeEventListener(name,ok);video.removeEventListener('error',bad)};video.addEventListener(name,ok,{once:true});video.addEventListener('error',bad,{once:true})})}
async function metadata(video){if(video.readyState>=1)return;await event(video,'loadedmetadata')}
async function setTime(video,seconds){await metadata(video);if(Math.abs(video.currentTime-seconds)<0.0005)return;const done=event(video,'seeked');video.currentTime=seconds;await done}
async function inspectAt(seconds){await Promise.all([setTime(ideal,seconds),setTime(trace,seconds)]);const slot=Math.min(1199,Math.round(seconds*60));update(slot);await new Promise(requestAnimationFrame);return {seconds,slot,ideal:{width:ideal.videoWidth,height:ideal.videoHeight,duration:ideal.duration,currentTime:ideal.currentTime,readyState:ideal.readyState},trace:{width:trace.videoWidth,height:trace.videoHeight,duration:trace.duration,currentTime:trace.currentTime,readyState:trace.readyState},record:records[slot]}}
seek.addEventListener('input',()=>inspectAt(Number(seek.value)/60));document.querySelector('#toggle').addEventListener('click',async(event)=>{if(ideal.paused){trace.currentTime=ideal.currentTime;await Promise.all([ideal.play(),trace.play()]);event.currentTarget.textContent='Pause'}else{ideal.pause();trace.pause();event.currentTarget.textContent='Play'}});function tick(){if(!ideal.paused){if(Math.abs(trace.currentTime-ideal.currentTime)>.035)trace.currentTime=ideal.currentTime;update(Math.min(1199,Math.floor(ideal.currentTime*60)))}requestAnimationFrame(tick)}
window.__s9Diagnostics={inspectAt,records,parents};Promise.all([metadata(ideal),metadata(trace)]).then(()=>{update(0);window.__s9DiagnosticReady=true;tick()});
</script></main></body></html>`;
}

async function createStaticServer(runDirectory) {
	const server = createServer(async (request, response) => {
		try {
			const url = new URL(request.url, 'http://127.0.0.1');
			const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'diagnostics/fov55.html';
			fail(!relative.includes('..') && !relative.includes('\\'), 'Unsafe diagnostic request path.');
			const absolute = path.join(runDirectory, ...relative.split('/'));
			const actual = await realpath(absolute);
			fail(isWithin(runDirectory, actual), 'Diagnostic request escaped run root.');
			const information = await stat(actual);
			const type = absolute.endsWith('.html')
				? 'text/html; charset=utf-8'
				: absolute.endsWith('.mp4')
					? 'video/mp4'
					: 'application/octet-stream';
			response.setHeader('content-type', type);
			response.setHeader('accept-ranges', 'bytes');
			const range = request.headers.range;
			if (range) {
				const match = /^bytes=(\d+)-(\d*)$/.exec(range);
				fail(match, 'Unsupported range request.');
				const start = Number(match[1]);
				const end = match[2] ? Number(match[2]) : information.size - 1;
				fail(start <= end && end < information.size, 'Invalid range request.');
				response.statusCode = 206;
				response.setHeader('content-range', `bytes ${start}-${end}/${information.size}`);
				response.setHeader('content-length', end - start + 1);
				createReadStream(actual, {start, end}).pipe(response);
			} else {
				response.setHeader('content-length', information.size);
				createReadStream(actual).pipe(response);
			}
		} catch (error) {
			response.statusCode = 404;
			response.end(error instanceof Error ? error.message : String(error));
		}
	});
	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	return {server, port: server.address().port};
}

async function closeServer(server) {
	await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

async function main() {
	const repositoryRoot = await requireRealDirectory(REPOSITORY_ROOT, 'Repository root');
	const sourceRoot = await requireRealDirectory(SOURCE_ROOT, 'Experiment source root');
	fail(isWithin(repositoryRoot, sourceRoot), 'Experiment source escaped repository.');
	await mkdir(OUTPUT_ROOT, {recursive: true});
	const outputRoot = await requireRealDirectory(OUTPUT_ROOT, 'Experiment output root');
	await mkdir(path.join(outputRoot, 'runs'), {recursive: true});
	const runsRoot = await requireRealDirectory(path.join(outputRoot, 'runs'), 'Runs root');
	const runId = `${Date.now()}-${RUN_SLUG}`;
	const runDirectory = path.join(runsRoot, runId);
	await mkdir(runDirectory);
	for (const directory of ['videos', 'captures', 'encoding', 'traces', 'mappings', 'controls', 'parent-metadata', 'diagnostics']) {
		await mkdir(path.join(runDirectory, directory));
	}
	const progressPath = path.join(runDirectory, 'progress.jsonl');
	await writeFile(progressPath, '', {flag: 'wx'});
	const progress = async (phase, message, completed, total, state) =>
		appendFile(
			progressPath,
			`${JSON.stringify({timestamp: new Date().toISOString(), phase, ...(completed === undefined ? {} : {completed, total}), message, ...(state ? {state} : {})})}\n`,
		);
	let browser = null;
	let server = null;
	const browserProfile = path.join(runDirectory, 'browser-profile');
	try {
		await progress('initialize', 'Initializing S9.6 publication and diagnostic evidence.');
		const parents = {};
		for (const [key, parent] of Object.entries(PARENTS)) parents[key] = await verifyParent(parent, repositoryRoot);
		await progress('authenticate', 'Authenticated all sealed S9.3-S9.5 parent artifact sets.', 4, 4);

		const copied = [];
		const copy = async (sourceRelative, destinationRelative) => {
			const source = await requireContainedFile(repositoryRoot, sourceRelative, 'S9.6 copy source');
			const target = path.join(runDirectory, ...destinationRelative.split('/'));
			fail(isWithin(runDirectory, target), 'S9.6 copy target escaped run root.');
			await mkdir(path.dirname(target), {recursive: true});
			await copyFile(source, target);
			const bytes = await readFile(target);
			copied.push({sourcePath: sourceRelative, path: destinationRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)});
			return bytes;
		};
		const controlBytes = await copy(CONTROL, 'controls/s9-trace-driven-animation-contract.json');
		for (const fov of FOVS) {
			const traceParent = PARENTS[fov.traceParent];
			await copy(`${traceParent.root}/trace.jsonl`, `traces/${fov.id}.jsonl`);
			for (const name of ['result.json', 'summary.json', 'environment.json', 'command.txt', 'artifact-manifest.json']) {
				await copy(`${traceParent.root}/${name}`, `parent-metadata/${fov.traceParent}/${name}`);
			}
			for (const kind of ['ideal', 'trace']) {
				await copy(`${PARENTS.replay.root}/mappings/${fov.id}-${kind}.jsonl`, `mappings/${fov.id}-${kind}.jsonl`);
				await copy(`${PARENTS.video.root}/videos/${fov.id}-${kind}.mp4`, `videos/${fov.id}-${kind}.mp4`);
				await copy(
					`${PARENTS.video.root}/encoding/${fov.id}-${kind}-packets.jsonl`,
					`encoding/${fov.id}-${kind}-packets.jsonl`,
				);
				for (const slot of [0, 300, 600, 900, 1199]) {
					const name = `${fov.id}-${kind}-slot-${String(slot).padStart(4, '0')}.png`;
					await copy(`${PARENTS.video.root}/captures/${name}`, `captures/${name}`);
				}
			}
		}
		for (const parent of ['replay', 'video']) {
			for (const name of ['result.json', 'provenance.json', 'environment.json', 'command.txt', 'artifact-manifest.json']) {
				await copy(`${PARENTS[parent].root}/${name}`, `parent-metadata/${parent}/${name}`);
			}
		}
		await progress('package', 'Copied clean videos, traces, mappings, controls, captures, packet traces, and parent metadata.');

		const diagnosticResults = [];
		for (const fov of FOVS) {
			const ideal = parseJsonLines(await readFile(path.join(runDirectory, 'mappings', `${fov.id}-ideal.jsonl`)));
			const trace = parseJsonLines(await readFile(path.join(runDirectory, 'mappings', `${fov.id}-trace.jsonl`)));
			const frames = parseJsonLines(await readFile(path.join(runDirectory, 'traces', `${fov.id}.jsonl`)));
			const timeline = buildTimeline(ideal, trace, frames, fov);
			const timelineBytes = Buffer.from(`${timeline.map((entry) => JSON.stringify(entry)).join('\n')}\n`);
			await writeFile(path.join(runDirectory, 'diagnostics', `${fov.id}-timeline.jsonl`), timelineBytes, {flag: 'wx'});
			const summary = summarizeTimeline(timeline);
			const html = diagnosticHtml(fov, timeline, {
				traceRunId: PARENTS[fov.traceParent].runId,
				replayRunId: PARENTS.replay.runId,
				videoRunId: PARENTS.video.runId,
			});
			await writeFile(path.join(runDirectory, 'diagnostics', `${fov.id}.html`), html, {flag: 'wx'});
			diagnosticResults.push({
				...fov,
				timeline: {path: `diagnostics/${fov.id}-timeline.jsonl`, byteLength: timelineBytes.byteLength, sha256: sha256(timelineBytes)},
				html: {path: `diagnostics/${fov.id}.html`, byteLength: Buffer.byteLength(html), sha256: sha256(Buffer.from(html))},
				summary,
			});
		}

		const hosted = await createStaticServer(runDirectory);
		server = hosted.server;
		await mkdir(browserProfile);
		browser = await puppeteer.launch({
			headless: true,
			executablePath: CHROME_EXECUTABLE,
			userDataDir: browserProfile,
			protocolTimeout: 180_000,
			args: ['--disable-breakpad', '--disable-crash-reporter', '--noerrdialogs', '--autoplay-policy=no-user-gesture-required'],
		});
		const page = await browser.newPage();
		await page.setViewport({width: 1920, height: 1080, deviceScaleFactor: 1});
		for (const diagnostic of diagnosticResults) {
			await page.goto(`http://127.0.0.1:${hosted.port}/diagnostics/${diagnostic.id}.html`, {
				waitUntil: 'networkidle0',
				timeout: 120_000,
			});
			await page.waitForFunction(() => window.__s9DiagnosticReady === true, {timeout: 120_000});
			diagnostic.inspections = [];
			for (const seconds of INSPECTION_SECONDS) {
				const inspection = await page.evaluate((value) => window.__s9Diagnostics.inspectAt(value), seconds);
				for (const kind of ['ideal', 'trace']) {
					fail(
						inspection[kind].width === WIDTH &&
							inspection[kind].height === HEIGHT &&
							Math.abs(inspection[kind].duration - 20) < 0.001 &&
							inspection[kind].readyState >= 2,
						`${diagnostic.id} ${kind} browser decode inspection failed.`,
					);
				}
				const screenshotName = `${diagnostic.id}-annotated-${String(Math.round(seconds * 10)).padStart(3, '0')}.png`;
				await page.screenshot({path: path.join(runDirectory, 'diagnostics', screenshotName), type: 'png'});
				diagnostic.inspections.push({seconds, screenshot: `diagnostics/${screenshotName}`, browser: inspection});
			}
		}
		await browser.close();
		browser = null;
		await closeServer(server);
		server = null;
		await rm(browserProfile, {recursive: true, force: true});
		await progress('inspect', 'Decoded both clean videos for each FOV and retained annotated diagnostic screenshots.', 6, 6);

		const result = {
			schemaId: 'gpu-resident-shared-block-cache-s9-published-evidence-result-v1',
			runId,
			accepted: true,
			claimBoundary:
				'Publishes and verifies traceable animation evidence derived from sealed S9.3-S9.5 parents. It adds no performance measurement and does not claim sustained 60 FPS.',
			ownerConclusion:
				'Trace-faithful native-4K animation is smooth enough for the intended large-display use, including its measured held presentation slots.',
			knownDeferredQualityIssue:
				'Sunrise and sunset look somewhat off overall in the live renderer; the often-too-gray horizon is the clearest symptom. This is sufficient for the Bruneton/cache-animation tests and is deferred.',
			configuration: {width: WIDTH, height: HEIGHT, framesPerSecond: FPS, frameCount: FRAME_COUNT, durationSeconds: 20},
			parents: Object.fromEntries(Object.entries(PARENTS).map(([key, value]) => [key, value])),
			control: {path: 'controls/s9-trace-driven-animation-contract.json', byteLength: controlBytes.byteLength, sha256: sha256(controlBytes)},
			copiedArtifacts: copied,
			diagnostics: diagnosticResults,
		};
		await Promise.all([
			writeFile(path.join(runDirectory, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, {flag: 'wx'}),
			writeFile(
				path.join(runDirectory, 'command.txt'),
				'node experiments/gpu-resident-shared-block-cache/run-s9-publish-evidence.js\n',
				{flag: 'wx'},
			),
			writeFile(
				path.join(runDirectory, 'environment.json'),
				`${JSON.stringify({node: process.version, platform: process.platform, architecture: process.arch, logicalCpuCount: os.cpus().length}, null, 2)}\n`,
				{flag: 'wx'},
			),
			writeFile(
				path.join(runDirectory, 'provenance.json'),
				`${JSON.stringify({schemaId: 'gpu-resident-shared-block-cache-s9-published-evidence-provenance-v1', operation: 'Authenticate sealed S9.3-S9.5 parents; copy exact clean videos, packet traces, frame traces, replay mappings, controls, captures, and parent metadata; construct per-slot diagnostic timelines and synchronized local diagnostic players; independently browser-decode representative timestamps and retain annotated screenshots.', parents: PARENTS, sourceIdentities: {runner: {path: 'experiments/gpu-resident-shared-block-cache/run-s9-publish-evidence.js', sha256: sha256(await readFile(fileURLToPath(import.meta.url)))}}}, null, 2)}\n`,
				{flag: 'wx'},
			),
		]);
		await progress('terminal', 'Accepted complete S9.6 published animation evidence.', undefined, undefined, 'accepted');
		const artifacts = await collectArtifacts(runDirectory);
		const artifactSetSha256 = sha256(Buffer.from(JSON.stringify(artifacts)));
		await writeFile(
			path.join(runDirectory, 'artifact-manifest.json'),
			`${JSON.stringify({schemaId: 'gpu-resident-shared-block-cache-s9-published-evidence-artifact-manifest-v1', artifacts, artifactSetSha256}, null, 2)}\n`,
			{flag: 'wx'},
		);
		process.stdout.write(`${JSON.stringify({runId, runDirectory, accepted: true, artifactSetSha256, diagnostics: diagnosticResults.map(({id, degrees, summary}) => ({id, degrees, summary}))}, null, 2)}\n`);
	} catch (error) {
		if (browser) await browser.close().catch(() => undefined);
		if (server) await closeServer(server).catch(() => undefined);
		await rm(browserProfile, {recursive: true, force: true}).catch(() => undefined);
		await writeFile(
			path.join(runDirectory, 'result.json'),
			`${JSON.stringify({schemaId: 'gpu-resident-shared-block-cache-s9-published-evidence-result-v1', runId, accepted: false, error: {name: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined}}, null, 2)}\n`,
			{flag: 'wx'},
		).catch(() => undefined);
		await progress('terminal', `S9.6 failed: ${error instanceof Error ? error.message : String(error)}`, undefined, undefined, 'failed').catch(() => undefined);
		const artifacts = await collectArtifacts(runDirectory).catch(() => []);
		await writeFile(
			path.join(runDirectory, 'artifact-manifest.json'),
			`${JSON.stringify({schemaId: 'gpu-resident-shared-block-cache-s9-published-evidence-artifact-manifest-v1', artifacts, artifactSetSha256: sha256(Buffer.from(JSON.stringify(artifacts)))}, null, 2)}\n`,
			{flag: 'wx'},
		).catch(() => undefined);
		throw error;
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
