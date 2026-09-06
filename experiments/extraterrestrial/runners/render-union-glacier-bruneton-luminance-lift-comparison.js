#!/usr/bin/env node
import {execFile as executeFile} from 'node:child_process';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {promisify} from 'node:util';
import {sha256File} from '../harness/lib/atomic-files.js';
import {assertNoReparseEntries} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual, createFileInventory} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {CANDIDATE_ROOT, EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, OUTPUT_ROOT, REPOSITORY_ROOT, assertLexicallyContained, assertRepositoryIdentity} from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/render-union-glacier-bruneton-luminance-lift-comparison.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFileAsync = promisify(executeFile);
const requireCondition = (condition, message) => { if (!condition) throw new Error(message); };
const pngBytes = (url) => { const match = /^data:image\/png;base64,(.+)$/u.exec(url); if (!match) throw new Error('Browser returned no PNG.'); return Buffer.from(match[1], 'base64'); };
const contentType = (target) => target.endsWith('.js') ? 'text/javascript; charset=utf-8' : target.endsWith('.json') ? 'application/json; charset=utf-8' : target.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream';

async function serve(run) {
	const roots = new Map([['/browser/', path.join(run.runDirectory, 'browser')], ['/harness/', path.join(EXPERIMENT_ROOT, 'harness')], ['/stellar-screen-palette/', path.join(EXPERIMENT_ROOT, 'stellar-screen-palette')], ['/candidate/', CANDIDATE_ROOT], ['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')], ['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT]]);
	const server = createServer(async (request, response) => { try { const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); const route = [...roots].find(([prefix]) => pathname.startsWith(prefix)); if (!route || pathname.includes('..')) throw new Error('Unsafe browser path.'); const [prefix, root] = route; const target = path.resolve(root, pathname.slice(prefix.length)); if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('Browser path escapes root.'); const info = await lstat(target); if (!info.isFile() || info.isSymbolicLink()) throw new Error('Browser target is not a real file.'); const canonicalRoot = await realpath(root); const canonicalTarget = await realpath(target); if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) throw new Error('Browser real path escapes root.'); response.writeHead(200, {'content-type': contentType(target)}); response.end(await readFile(canonicalTarget)); } catch (error) { response.writeHead(404); response.end(String(error.message)); } });
	await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
	return {url: `http://127.0.0.1:${server.address().port}/browser/index.html`, close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))};
}

async function main() {
	const run = await initializeRunRecord({slug: 'bruneton-source-luminance-lift-flat-local-comparison', command: COMMAND, inputs: {schemaId: 'bruneton-source-luminance-lift-flat-local-input-v2', fixture: 'experiments/extraterrestrial/fixtures/union-glacier-flat-local-closest-approach-v1.json', states: ['flat-0', 'flat-90', 'flat-180'], camera: 'fixed Flat 180 bearing', luminanceLiftCurve: {brightThreshold: 5, darkThreshold: 0.001, minimumGamma: 0.125, maximumLuminanceGain: 32768}}, provenance: {operation: 'finite source surface radiance and receiver distance -> projected irradiance -> atmosphere transmittance -> local direct luminance -> shared global Bruneton luminance-lift Color with a finite gain cap; render Bruneton-left pairs', implementation: ['experiments/extraterrestrial/harness/union-glacier-bruneton-luminance-lift-browser-entry.js', 'experiments/extraterrestrial/stellar-screen-palette/SourceDerivedLocalLuminance.js', 'experiments/extraterrestrial/stellar-screen-palette/BrunetonSourceLuminanceLiftColorDisplayModel.js'], exclusions: ['scattered-light adaptation', 'rod/cone response', 'state-specific Color tuning', 'production writes']}, environment: {node: process.version, platform: process.platform, chromePath: CHROME_PATH}, references: {activeTopic: 'agents/topics/active-topic.md', sphericalAcceptedRun: '000466-bruneton-source-luminance-lift-spherical-comparison'}});
	let server; let browserProfile;
	try {
		await assertRepositoryIdentity();
		const before = {algorithm32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'algorithm32')), flat32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'flat32'))};
		await Promise.all([lstat(CHROME_PATH), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree')]);
		await run.writeArtifact('browser/index.html', '<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">const target=document.querySelector("#result");try{const {runUnionGlacierBrunetonLuminanceLiftComparison}=await import("/harness/union-glacier-bruneton-luminance-lift-browser-entry.js");target.textContent=JSON.stringify(await runUnionGlacierBrunetonLuminanceLiftComparison());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>');
		server = await serve(run); browserProfile = assertLexicallyContained(OUTPUT_ROOT, path.join(OUTPUT_ROOT, 'browser-profiles', run.runId), 'Flat comparison Chrome profile'); await mkdir(browserProfile, {recursive: true});
		const browser = await executeFileAsync(CHROME_PATH, ['--headless=new', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--disable-breakpad', '--disable-crash-reporter', `--user-data-dir=${browserProfile}`, '--virtual-time-budget=900000', '--dump-dom', server.url], {timeout: 960000, maxBuffer: 64 * 1024 * 1024, windowsHide: true});
		await rm(browserProfile, {recursive: true, force: true}); browserProfile = null;
		await run.writeArtifact('browser/dom.html', browser.stdout); await run.writeArtifact('browser/stderr.txt', browser.stderr);
		const text = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout)?.[1]; requireCondition(text, 'Browser emitted no result.'); const result = JSON.parse(text); if (result.error) throw new Error(`${result.error.name}: ${result.error.message}`);
		const hashes = {};
		for (const scene of result.scenes) { scene.capture = `captures/${scene.colorMode}-${scene.stateId}.png`; await run.writeArtifact(scene.capture, pngBytes(scene.imagePngDataUrl)); delete scene.imagePngDataUrl; hashes[`${scene.colorMode}:${scene.stateId}`] = await sha256File(path.join(run.runDirectory, ...scene.capture.split('/'))); }
		for (const pair of result.pairs) { pair.capture = `captures/paired-${pair.id}.png`; await run.writeArtifact(pair.capture, pngBytes(pair.imagePngDataUrl)); delete pair.imagePngDataUrl; }
		const sourceScenes = result.scenes.filter((scene) => scene.colorMode === 'source-luminance-lift');
		const luminances = Object.fromEntries(sourceScenes.map((scene) => [scene.stateId, scene.sourceLight.luminanceCdPerSquareMeter]));
		const assertions = []; const check = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		check(result.pairs.map((pair) => pair.id).join(',') === 'flat-0,flat-90,flat-180' && result.scenes.length === 6, 'All three requested Flat/local pairs rendered through both Color models.');
		check(sourceScenes.every((scene) => scene.sourceLight.gamma === 1 && scene.sourceLight.blockedByGround === false), 'Every Flat/local receiver retains exact Bruneton gamma one from nonblocked direct local light.');
		check(luminances['flat-0'] > luminances['flat-90'] && luminances['flat-90'] > luminances['flat-180'] && luminances['flat-180'] >= 5, 'Finite-source distance falloff is ordered and the farthest state remains on the Bruneton plateau.');
		check(['flat-0', 'flat-90', 'flat-180'].every((id) => hashes[`bruneton:${id}`] === hashes[`source-luminance-lift:${id}`]), 'All three source-model captures are byte-identical to Bruneton.');
		check(result.scenes.every((scene) => scene.shaderIncludes.finiteDisk && scene.shaderIncludes.normalCache && scene.shaderIncludes.bruneton && scene.image.nonBlack > 0), 'Every frame retains the atmosphere-transported finite disk, normal scattering cache, Bruneton boundary, and visible output.');
		const closure = await buildStaticModuleClosure({candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/render-union-glacier-bruneton-luminance-lift-comparison.js', 'harness/union-glacier-bruneton-luminance-lift-browser-entry.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process','node:crypto','node:fs','node:fs/promises','node:http','node:module','node:os','node:path','node:url','node:util']});
		const after = {algorithm32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'algorithm32')), flat32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'flat32'))};
		assertFileInventoriesEqual(before.algorithm32, after.algorithm32, 'Algorithm32 production inventory'); assertFileInventoriesEqual(before.flat32, after.flat32, 'Flat32 production inventory');
		const proof = {proofId: 'bruneton-source-luminance-lift-flat-local-comparison-v2', accepted: true, luminances, scenes: result.scenes, pairs: result.pairs, hashes, assertions, containment: {algorithm32Files: after.algorithm32.fileCount, flat32Files: after.flat32.fileCount, closureFiles: closure.files.length, closureEdges: closure.edges.length}};
		await run.writeJsonArtifact('evidence/flat-local-comparison.json', proof);
		const manifest = await run.finalize({conclusion: 'accepted', result: {proofId: proof.proofId, captures: Object.fromEntries(result.pairs.map((pair) => [pair.id, pair.capture])), luminances}, report: `# ${run.runId}: Bruneton source-luminance-lift Flat/local comparison\n\nConclusion: **accepted**.\n\nFlat 0, 90, and 180 are byte-identical to Bruneton because all remain on the exact gamma-one direct-light plateau.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, captures: Object.fromEntries(result.pairs.map((pair) => [pair.id, pair.capture])), luminances}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({conclusion: 'failed', result: {accepted: false, error: detail}, report: `# ${run.runId}: Flat/local comparison\n\nConclusion: **failed**.\n\n${detail.message}\n`}); process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`); } catch {}
		process.exitCode = 1;
	} finally { await server?.close().catch(() => {}); if (browserProfile) await rm(browserProfile, {recursive: true, force: true}).catch(() => {}); }
}

await main();
