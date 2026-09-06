#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {lstat, mkdir, readFile, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';

import {assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, assertRepositoryIdentity} from '../harness/lib/roots.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SNAPSHOT_ROOT = path.join(EXPERIMENT_ROOT, 'production-snapshots', 'sun-appearance-step-5-v1');
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'production-sun-appearance-gpu-visual-v1.json');
const CONDITIONS = [
	{id: 'solar-noon', index: 1},
	{id: 'sunset-minus-30-minutes', index: 2},
	{id: 'sunset-minus-10-minutes', index: 4},
	{id: 'sunset', index: 5},
];

function requireCondition(value, message) { if (!value) throw new Error(message); }
function contentType(filePath) { return filePath.endsWith('.js') ? 'text/javascript; charset=utf-8' : filePath.endsWith('.json') ? 'application/json; charset=utf-8' : filePath.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'; }
function pngBytes(dataUrl) { const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/u.exec(dataUrl); requireCondition(match, 'Production GPU base is not a PNG data URL.'); return Buffer.from(match[1], 'base64'); }

function browserHtml(condition) {
	const shard = {id: `distant-${condition.id}`, family: 'distant', conditionId: condition.id, conditionIndex: condition.index, conditionCount: 8};
	return `<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">
const target=document.querySelector('#result');
try {
	const [{runProductionSunAppearanceGpuVisualScene}, authored] = await Promise.all([
		import('/harness/production-sun-appearance-gpu-visual-browser-entry.js'),
		fetch('/fixtures/production-sun-appearance-gpu-visual-v1.json').then(response=>response.json()),
	]);
	const fixture=structuredClone(authored);
	fixture.viewports=[{...fixture.viewports[0],id:'camera-sun-focused',width:481,height:271,verticalFovDegrees:15}]; fixture.sampling.requiredViewportCount=1;
	for (const item of fixture.distant.conditions) { item.requiredPreview=item.id===${JSON.stringify(condition.id)}; if (item.id===${JSON.stringify(condition.id)}) item.radialOrientations=['zenithward']; }
	const value=await runProductionSunAppearanceGpuVisualScene(fixture, async()=>{}, ${JSON.stringify(shard)});
	const preview=value.condition.preview;
	if (!preview?.productionMapperPngDataUrl) throw new Error('Production normal framebuffer preview is absent.');
	const result={schemaId:'spectral-color-production-gpu-base-v1',conditionId:value.condition.id,productionPath:value.productionPath,shaderSourceHash:value.condition.shaderSourceHash,renderer:value.renderer,sceneScale:value.condition.sceneScale,observation:value.condition.observation,preview:{width:preview.width,height:preview.height,verticalFovDegrees:preview.verticalFovDegrees,cameraSampleId:preview.cameraSampleId,productionMapperPngDataUrl:preview.productionMapperPngDataUrl}};
	target.textContent='submitted'; await fetch('/result/${condition.id}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(result)});
} catch(error) { await fetch('/result/${condition.id}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}})}); }
</script>`;
}

async function serve(run) {
	const waiters = new Map();
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/harness/', path.join(EXPERIMENT_ROOT, 'harness')],
		['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')],
		['/snapshot/', SNAPSHOT_ROOT],
		['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT],
	]);
	const server = createServer(async (request, response) => { try { const pathname = new URL(request.url, 'http://127.0.0.1').pathname; if (request.method === 'POST' && pathname.startsWith('/result/')) { const id = pathname.slice('/result/'.length); const chunks=[]; let length=0; for await (const chunk of request) { length += chunk.length; if (length > 16 * 1024 * 1024) throw new Error('Result body is too large.'); chunks.push(chunk); } const waiter=waiters.get(id); if (!waiter) throw new Error('Unexpected result id.'); waiters.delete(id); waiter.resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); response.writeHead(204); response.end(); return; } const root = [...roots.entries()].find(([prefix]) => pathname.startsWith(prefix)); if (!root) throw new Error('Unsupported path.'); const relative = pathname.slice(root[0].length); if (!relative || relative.includes('..') || path.isAbsolute(relative)) throw new Error('Unsafe path.'); const resolved = path.resolve(root[1], relative); if (!resolved.startsWith(`${path.resolve(root[1])}${path.sep}`)) throw new Error('Escaped root.'); response.writeHead(200, {'content-type': contentType(resolved)}); response.end(await readFile(resolved)); } catch { response.writeHead(404); response.end('not found'); } });
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	return {url: `http://127.0.0.1:${server.address().port}`, waitForResult(id) { return new Promise((resolve, reject) => { const timeout=setTimeout(()=>{waiters.delete(id); reject(new Error(`${id} GPU browser result timed out.`));}, 720000); waiters.set(id,{resolve:(value)=>{clearTimeout(timeout); resolve(value);}}); }); }, close: () => new Promise((resolve) => server.close(resolve))};
}

async function main() {
	const command = 'node experiments/extraterrestrial/runners/render-spectral-color-production-gpu-bases.js';
	const run = await initializeRunRecord({slug: 'spectral-color-production-gpu-sun-focused-bases', command, inputs: {fixture: 'experiments/extraterrestrial/fixtures/production-sun-appearance-gpu-visual-v1.json', conditions: CONDITIONS.map(({id}) => id), viewport: {widthPixels: 481, heightPixels: 271, verticalFovDegrees: 15, aim: 'disk-center'}}, provenance: {implementation: 'sealed production snapshot sun-appearance-step-5-v1', path: 'Algorithm32.setupShader/prepare + ThreeCacheBackend + installed composer runtime pass + composer.render normal mode + canvas PNG'}, environment: {node: process.version, platform: process.platform, chromePath: CHROME_PATH}, references: {plan: 'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md'}});
	let server;
	try {
		await assertRepositoryIdentity(); const policy = await loadContainmentPolicy(); const before = await createProtectedTrackedInventory(policy); await Promise.all([lstat(CHROME_PATH), lstat(FIXTURE_PATH), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree')]);
		for (const condition of CONDITIONS) await run.writeArtifact(`browser/${condition.id}.html`, browserHtml(condition));
		server = await serve(run); const results = [];
		for (const condition of CONDITIONS) {
			const profile = path.join(run.runDirectory, `browser-profile-${condition.id}`); await mkdir(profile);
			try {
				const resultPromise=server.waitForResult(condition.id); const child=spawn(CHROME_PATH, ['--headless=new', `--user-data-dir=${profile}`, '--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-software-rasterizer', '--disable-background-networking', '--disable-gpu-shader-disk-cache', '--no-first-run', `${server.url}/browser/${condition.id}.html`], {windowsHide:true,stdio:'ignore'});
				let result; try { result=await resultPromise; } finally { child.kill(); await new Promise((resolve)=>{if(child.exitCode!==null) resolve(); else {child.once('exit',resolve); setTimeout(resolve,5000);}}); }
				if (result.error) throw new Error(`${condition.id}: ${result.error.name}: ${result.error.message}`); requireCondition(result.conditionId === condition.id && result.productionPath.includes('Algorithm32.setupShader'), `${condition.id} returned another path.`);
				const png = pngBytes(result.preview.productionMapperPngDataUrl); await run.writeArtifact(`renders/${condition.id}.png`, png); delete result.preview.productionMapperPngDataUrl; results.push(result);
			} finally { await rm(profile, {recursive: true, force: true}); }
		}
		await run.writeJsonArtifact('evidence/production-gpu-bases.json', {schemaId: 'spectral-color-production-gpu-bases-result-v1', results});
		const closure = await buildStaticModuleClosure({candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/render-spectral-color-production-gpu-bases.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process','node:crypto','node:fs','node:fs/promises','node:http','node:module','node:os','node:path','node:url','node:util']}); const after = await createProtectedTrackedInventory(policy); assertFileInventoriesEqual(before, after, 'Production GPU base protected inventory');
		const shaderSourceHashes = Object.fromEntries(results.map((result) => [result.conditionId, result.shaderSourceHash])); const proof = {proofId: 'spectral-color-production-gpu-bases-v1', accepted: true, assertions: ['All four images are direct PNG captures of the sealed production GPU normal framebuffer.', 'No spectral diagnostic override, CPU Color reconstruction, alternate exposure, or replacement presentation formula produced the images.', 'Each image retains the exact assembled production shader source hash used for its condition.'], summary: {conditionCount: results.length, shaderSourceHashes, renderer: results[0].renderer.webgl.unmaskedRenderer, images: CONDITIONS.map(({id}) => `renders/${id}.png`)}};
		await run.writeJsonArtifact('evidence/production-gpu-bases-proof.json', proof); const manifest = await run.finalize({conclusion: 'accepted', result: proof, report: `# ${run.runId}: production GPU base images\n\nConclusion: **accepted as direct normal-framebuffer base images; appearance remains owner-reviewed**.\n`}); process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, summary: proof.summary}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack}; try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({conclusion: 'failed', result: {error: detail}, report: `# ${run.runId}: production GPU base images\n\nConclusion: **failed**.\n\n${detail.message}\n`}); process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`); } catch {} process.exitCode=1;
	} finally { await server?.close().catch(()=>{}); }
}

await main();
