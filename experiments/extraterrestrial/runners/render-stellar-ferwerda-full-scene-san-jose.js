#!/usr/bin/env node

import {execFile as executeFile} from 'node:child_process';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {promisify} from 'node:util';

import {sha256File} from '../harness/lib/atomic-files.js';
import {assertExistingRealPathContained, assertNoReparseEntries} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual, createFileInventory} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {CANDIDATE_ROOT, EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, OUTPUT_ROOT, REPOSITORY_ROOT, RUNS_ROOT, assertLexicallyContained, assertRepositoryIdentity} from '../harness/lib/roots.js';
import {deriveFerwerdaSteadyStateParameters} from '../stellar-visual-adaptation/FerwerdaVisualAdaptationModel.js';

const COMMAND = 'node experiments/extraterrestrial/runners/render-stellar-ferwerda-full-scene-san-jose.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFileAsync = promisify(executeFile);
const HARNESS_ROOT = path.join(EXPERIMENT_ROOT, 'harness');
const FIXTURES_ROOT = path.join(EXPERIMENT_ROOT, 'fixtures');
const VISUAL_ADAPTATION_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-visual-adaptation');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const STELLAR_INPUT_PARENT = Object.freeze({runId: '000395-stellar-first-render-san-jose-sunset-plus-three-hours-pure-bruneton', artifactSetSha256: '65ddd198b881fd171e0e0da81e92b49635fe43e23f1168f9989d24dced9c54a2', artifact: 'browser/stellar-runtime-input.json'});
const LOCAL_LIGHT_PARENT = Object.freeze({runId: '000302-spectral-color-local-light-record', artifactSetSha256: 'dedb03462344654252096e9879972bfa21a3328ba0b18b5c6db9dfd4bc4cb9c1', artifact: 'evidence/local-light-record.json'});

function requireCondition(condition, message) { if (!condition) throw new Error(message); }
function pngBytes(value) { const match = /^data:image\/png;base64,(?<body>[A-Za-z0-9+/=]+)$/u.exec(value); if (!match) throw new Error('Full-scene browser did not return a PNG.'); return Buffer.from(match.groups.body, 'base64'); }
function contentType(target) { if (target.endsWith('.js')) return 'text/javascript; charset=utf-8'; if (target.endsWith('.json')) return 'application/json; charset=utf-8'; if (target.endsWith('.html')) return 'text/html; charset=utf-8'; return 'application/octet-stream'; }
async function inventoryProduction() { const [algorithm32, flat32] = await Promise.all([createFileInventory(ALGORITHM32_ROOT), createFileInventory(FLAT32_ROOT)]); return {algorithm32, flat32}; }

async function loadAcceptedArtifact(parent) {
	const root = path.join(RUNS_ROOT, parent.runId);
	await assertExistingRealPathContained(OUTPUT_ROOT, root, 'Accepted parent run');
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	requireCondition(manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === parent.artifactSetSha256, `Accepted parent ${parent.runId} changed.`);
	const record = manifest.artifacts.find((artifact) => artifact.path === parent.artifact);
	requireCondition(record, `Accepted parent lacks ${parent.artifact}.`);
	const artifactPath = path.join(root, ...parent.artifact.split('/'));
	requireCondition(await sha256File(artifactPath) === record.sha256, `Accepted artifact ${parent.artifact} changed.`);
	return {bytes: await readFile(artifactPath), record};
}

async function serve(run) {
	const requests = [];
	const roots = new Map([['/browser/', path.join(run.runDirectory, 'browser')], ['/harness/', HARNESS_ROOT], ['/candidate/', CANDIDATE_ROOT], ['/fixtures/', FIXTURES_ROOT], ['/stellar-visual-adaptation/', VISUAL_ADAPTATION_ROOT], ['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT]]);
	const server = createServer(async (request, response) => {
		try {
			const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); requests.push(pathname);
			const route = [...roots].find(([prefix]) => pathname.startsWith(prefix)); if (!route || pathname.includes('..')) throw new Error('Unsupported path.');
			const [prefix, root] = route; const target = path.resolve(root, pathname.slice(prefix.length)); if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('Path escapes root.');
			const info = await lstat(target); if (!info.isFile() || info.isSymbolicLink()) throw new Error('Target is not a real file.');
			const canonicalRoot = await realpath(root), canonicalTarget = await realpath(target); if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) throw new Error('Real path escapes root.');
			response.writeHead(200, {'content-type': contentType(target)}); response.end(await readFile(canonicalTarget));
		} catch (error) { response.writeHead(404, {'content-type': 'text/plain'}); response.end(error.message); }
	});
	await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
	return {url: `http://127.0.0.1:${server.address().port}/browser/index.html`, requests, close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))};
}

function report(runId, proof) {
	return [`# ${runId}: Ferwerda full-scene sunset/noon review`, '', 'Conclusion: **accepted as generated visual evidence**', '', ...proof.scenes.map((scene) => `- ${scene.id}: nonblack ${scene.image.nonBlack}; exact white ${scene.image.exactWhitePixelCount}; maximum byte ${scene.image.maximumChannel}; mean RGB ${scene.image.meanRgb.join(', ')}.`), '', 'The same source-independent cone-plus-achromatic-rod mapping processed the atmosphere, celestial contribution, ground, and review objects. The renderer-scene RGB bridge uses completed linear-sRGB luminance as the rod proxy because captured geometry is not native-15 spectral data. No condition-specific tuning was applied.', ''].join('\n');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The full-scene comparison accepts no arguments.');
	const run = await initializeRunRecord({
		slug: 'stellar-ferwerda-full-scene-sunset-noon-review', command: COMMAND,
		inputs: {schemaId: 'stellar-ferwerda-full-scene-inputs-v1', conditions: ['sunset', 'solar-noon'], stellarInputParent: STELLAR_INPUT_PARENT, localLightParent: LOCAL_LIGHT_PARENT, display: {maximumLuminance: 80, adaptationLuminance: 40, units: 'cd m^-2'}, resolution: [640, 400]},
		provenance: {schemaId: 'stellar-ferwerda-full-scene-provenance-v1', operation: 'normal contained spherical scene assembly at sunset and solar noon; one uniform Ferwerda cone-plus-achromatic-rod Color mapping after spectral and renderer-scene composition', implementation: ['experiments/extraterrestrial/harness/three-subjective-globe-scenes-browser-entry.js', 'experiments/extraterrestrial/stellar-visual-adaptation/FerwerdaFullSceneColorDisplayModel.js'], approximation: 'completed renderer linear-sRGB luminance proxies rod stimulus because captured scene geometry has no native-15 spectrum'},
		environment: {schemaId: 'stellar-ferwerda-full-scene-environment-v1', node: process.version, platform: process.platform, architecture: process.arch, chromePath: CHROME_PATH},
		references: {schemaId: 'stellar-ferwerda-full-scene-references-v1', plan: 'agents/topics/extraterrestrial/stellar-rendering-plan.md', ferwerda: 'https://jamesferwerda.com/wp-content/uploads/2015/06/j03_ferwerda96_sig.pdf'},
	});
	let server, browserProfilePath;
	try {
		await assertRepositoryIdentity();
		await Promise.all([lstat(CHROME_PATH), assertNoReparseEntries(HARNESS_ROOT, 'Harness source'), assertNoReparseEntries(CANDIDATE_ROOT, 'Candidate source'), assertNoReparseEntries(VISUAL_ADAPTATION_ROOT, 'Visual-adaptation source')]);
		const productionBefore = await inventoryProduction();
		const [stellarInput, localInput] = await Promise.all([loadAcceptedArtifact(STELLAR_INPUT_PARENT), loadAcceptedArtifact(LOCAL_LIGHT_PARENT)]);
		const localRecord = JSON.parse(localInput.bytes.toString('utf8'));
		const conditions = {};
		for (const [id, key] of [['sunset', 'spherical-distant/sunset'], ['solar-noon', 'spherical-distant/noon']]) {
			const record = localRecord.records.find((candidate) => candidate.key === key); requireCondition(record, `Missing ${key} local-light input.`);
			conditions[id] = deriveFerwerdaSteadyStateParameters({worldAdaptationLuminance: record.adaptingLuminanceProxy.value, displayMaximumLuminance: 80, displayAdaptationLuminance: 40});
		}
		await run.writeArtifact('browser/stellar-runtime-input.json', stellarInput.bytes);
		await run.writeJsonArtifact('browser/ferwerda-full-scene-config.json', {schemaId: 'ferwerda-full-scene-browser-config-v1', conditions});
		await run.writeArtifact('browser/index.html', '<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">import {runThreeSubjectiveGlobeFerwerdaFullSceneComparison as run} from "/harness/three-subjective-globe-scenes-browser-entry.js";const target=document.querySelector("#result");try{target.textContent=JSON.stringify(await run());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>');
		server = await serve(run); browserProfilePath = assertLexicallyContained(OUTPUT_ROOT, path.join(OUTPUT_ROOT, 'browser-profiles', run.runId), 'Chrome profile'); await mkdir(browserProfilePath, {recursive: true});
		let browser;
		try { browser = await executeFileAsync(CHROME_PATH, ['--headless=new','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--disable-breakpad','--disable-crash-reporter','--disable-component-update',`--user-data-dir=${browserProfilePath}`,'--virtual-time-budget=360000','--dump-dom',server.url], {timeout: 480000, maxBuffer: 32 * 1024 * 1024, windowsHide: true}); }
		catch (error) { await run.writeArtifact('browser/dom-on-failure.html', error.stdout ?? ''); throw error; }
		finally { await rm(browserProfilePath, {recursive: true, force: true}); browserProfilePath = null; }
		await run.writeArtifact('browser/dom.html', browser.stdout); await run.writeArtifact('browser/stderr.txt', browser.stderr); await run.writeJsonArtifact('browser/requests.json', server.requests);
		const resultText = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout)?.[1]; requireCondition(resultText, 'Browser emitted no full-scene result.'); const result = JSON.parse(resultText); if (result.error) throw new Error(`${result.error.name}: ${result.error.message}`);
		const names = {sunset: 'san-jose-sunset-ferwerda-full-scene.png', 'solar-noon': 'san-jose-solar-noon-ferwerda-full-scene.png'}; const scenes = [];
		for (const scene of result.scenes) { const id = scene.timeLabel === 'Sunset' ? 'sunset' : 'solar-noon'; await run.writeArtifact(`captures/${names[id]}`, pngBytes(scene.imagePngDataUrl)); delete scene.imagePngDataUrl; scenes.push({...scene, id, imagePath: `captures/${names[id]}`}); }
		const assertions = []; const assert = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		assert(scenes.length === 2 && scenes.map((scene) => scene.id).sort().join(',') === 'solar-noon,sunset', 'Both requested complete scenes rendered.');
		assert(scenes.every((scene) => scene.shaderIncludes.cumulativeAtmosphere && scene.shaderIncludes.celestialLive && scene.shaderIncludes.stellarLive && scene.shaderIncludes.sceneInputCapture), 'Both scenes execute atmosphere, celestial, stellar, and captured-scene paths.');
		assert(scenes.every((scene) => scene.shaderIncludes.ferwerdaFullScene), 'Both scenes execute the uniform Ferwerda full-scene Color branch.');
		assert(scenes.every((scene) => scene.reviewBoxes.count === 2 && scene.ground.owner), 'Both scenes include ground and both review objects.');
		const closure = await buildStaticModuleClosure({candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/render-stellar-ferwerda-full-scene-san-jose.js','harness/three-subjective-globe-scenes-browser-entry.js','stellar-visual-adaptation/FerwerdaFullSceneColorDisplayModel.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process','node:crypto','node:fs','node:fs/promises','node:http','node:module','node:os','node:path','node:url','node:util','node:zlib']});
		const productionAfter = await inventoryProduction(); assertFileInventoriesEqual(productionBefore.algorithm32, productionAfter.algorithm32, 'Algorithm32 production inventory'); assertFileInventoriesEqual(productionBefore.flat32, productionAfter.flat32, 'Flat32 production inventory');
		const proof = {proofId: 'stellar-ferwerda-full-scene-sunset-noon-v1', accepted: true, conditions, scenes, parents: {stellar: STELLAR_INPUT_PARENT, localLight: LOCAL_LIGHT_PARENT}, assertions, claimBoundary: 'contained full-scene visual review; renderer scene RGB uses luminance rod proxy; no temporal adaptation, acuity, color tuning, output calibration, or production change', containment: {algorithm32FileCount: productionAfter.algorithm32.fileCount, flat32FileCount: productionAfter.flat32.fileCount, moduleClosureFileCount: closure.files.length, moduleClosureEdgeCount: closure.edges.length}};
		await run.writeJsonArtifact('evidence/full-scene-review.json', proof);
		const manifest = await run.finalize({conclusion: 'accepted', result: {proofId: proof.proofId, images: Object.fromEntries(scenes.map((scene) => [scene.id, scene.imagePath])), summaries: Object.fromEntries(scenes.map((scene) => [scene.id, scene.image]))}, report: report(run.runId, proof)});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, images: Object.fromEntries(scenes.map((scene) => [scene.id, scene.imagePath]))}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({conclusion: 'failed', result: {proofId: 'stellar-ferwerda-full-scene-sunset-noon-v1', error: detail}, report: `# ${run.runId}: Ferwerda full-scene review\n\nConclusion: **failed**\n\n${detail.message}\n`}); process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`); } catch (finalizationError) { process.stderr.write(`${JSON.stringify({conclusion: 'unsealed-failure', error: detail, finalizationError: String(finalizationError)}, null, 2)}\n`); }
		process.exitCode = 1;
	} finally { if (server) await server.close().catch(() => {}); if (browserProfilePath) await rm(browserProfilePath, {recursive: true, force: true}).catch(() => {}); }
}

await main();
