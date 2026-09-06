import { execFile as executeFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { createServer } from 'node:http';
import { lstat, readFile } from 'node:fs/promises';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { assertContainmentPreconditions, assertNoReparseEntries, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { CANDIDATE_ROOT, EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT } from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-g7-three-subjective-globe-scenes.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const execFile = promisify(executeFile);

function requireCondition(value, message) { if (!value) throw new Error(message); }
function pngBytes(dataUrl) { const match = /^data:image\/png;base64,(?<body>[A-Za-z0-9+/=]+)$/u.exec(dataUrl); if (!match) throw new Error('Subjective scene did not return a PNG.'); return Buffer.from(match.groups.body, 'base64'); }
function contentType(filePath) { return filePath.endsWith('.js') ? 'text/javascript; charset=utf-8' : filePath.endsWith('.json') ? 'application/json; charset=utf-8' : filePath.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'; }
async function serve(run) {
	const roots = new Map([['/browser/', path.join(run.runDirectory, 'browser')], ['/harness/', path.join(EXPERIMENT_ROOT, 'harness')], ['/candidate/', CANDIDATE_ROOT], ['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')], ['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT]]);
	const server = createServer(async (request, response) => { try { const pathname = new URL(request.url, 'http://127.0.0.1').pathname; const entry = [...roots.entries()].find(([prefix]) => pathname.startsWith(prefix)); if (!entry) throw new Error('Unsupported runtime path.'); const relative = pathname.slice(entry[0].length); if (!relative || relative.includes('..') || path.isAbsolute(relative)) throw new Error('Unsafe runtime path.'); const filePath = path.resolve(entry[1], relative); if (!filePath.startsWith(path.resolve(entry[1]) + path.sep)) throw new Error('Runtime path escaped root.'); const body = await readFile(filePath); response.writeHead(200, { 'content-type': contentType(filePath) }); response.end(body); } catch { response.writeHead(404); response.end('not found'); } });
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	const address = server.address();
	return { url: `http://127.0.0.1:${address.port}/browser/index.html`, close: () => new Promise((resolve) => server.close(resolve)) };
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'g7-three-subjective-globe-scenes',
		command: COMMAND,
		inputs: { fixture: 'experiments/extraterrestrial/fixtures/subjective-globe-context-scenes-v1.json', archivedLabels: 'ER6 subjective San Jose and Union Glacier location/date labels', runtime: 'Algorithm32 facade -> renderer scene capture -> ShaderBuilder -> EffectComposer', scene: 'SphericalEarthGeometry-owned observer-local spherical ground visual, packed depth, and hit mask', atmosphere: 'candidate-native solar spectrum, native disk radius, order-4 scattering', claim: 'visual context only; no ephemeris/geography/observational validation' },
		provenance: { experiment: 'experiments/extraterrestrial', archivedReferenceReadOnly: 'references/inputs/experiments/065-er8-cpu-convergence-and-poc-cleanup/criteria-results.json', stateDerivationReadOnly: 'src/flat32/LocationTimeController.js' },
		environment: { node: process.version, platform: process.platform, chromePath: CHROME_PATH },
		references: { canonicalDesign: 'agents/topics/extraterrestrial/celestial-contribution-cache-design.md', canonicalPlan: 'agents/topics/extraterrestrial/promotion-plan.md' },
	});
	let server;
	try {
		const policy = await assertContainmentPreconditions();
		const before = await createProtectedTrackedInventory(policy);
		await Promise.all([lstat(CHROME_PATH), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree')]);
		await run.writeArtifact('browser/index.html', `<!doctype html><meta charset="utf-8"><title>Subjective globe contexts</title><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">import { runThreeSubjectiveGlobeScenesBrowserProof } from '/harness/three-subjective-globe-scenes-browser-entry.js'; const result = document.querySelector('#result'); try { result.textContent = JSON.stringify(await runThreeSubjectiveGlobeScenesBrowserProof()); } catch (error) { result.textContent = JSON.stringify({ error: { name: error.name, message: error.message, stack: error.stack } }); }</script>`);
		server = await serve(run);
		const browser = await execFile(CHROME_PATH, ['--headless=new', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--virtual-time-budget=180000', '--dump-dom', server.url], { timeout: 240000, maxBuffer: 32 * 1024 * 1024, windowsHide: true });
		await run.writeArtifact('browser/dom.html', browser.stdout);
		const match = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout);
		requireCondition(match, 'Headless browser did not emit the subjective-scene result.');
		const result = JSON.parse(match[1]);
		if (result.error) throw new Error(`Subjective globe scenes failed: ${result.error.name}: ${result.error.message}`);
		const assertions = [];
		for (const scene of result.scenes) {
			await run.writeArtifact(`captures/${scene.id}.png`, pngBytes(scene.imagePngDataUrl));
			requireCondition(scene.image.nonBlack > 0, `${scene.id} has visible rendered pixels.`);
			requireCondition(scene.shaderIncludes.cumulativeAtmosphere && scene.shaderIncludes.celestialLive, `${scene.id} uses the atmospheric cache and live Sun cache.`);
			requireCondition(scene.shaderIncludes.sceneInputCapture, `${scene.id} consumes renderer-produced ground depth and hit inputs.`);
			requireCondition(scene.ground.owner === 'SphericalEarthGeometry' && scene.ground.endpointKind === 'geometry-ground-boundary' && scene.ground.visualMeshKind === 'local-spherical-patch', `${scene.id} uses SphericalEarthGeometry's local spherical ground endpoint.`);
			assertions.push(`${scene.id}: normal atmospheric, celestial, geometry-ground, and renderer-scene-input passes rendered.`);
		}
		requireCondition(result.scenes.length === 2, 'Exactly two requested subjective contexts rendered.');
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-g7-three-subjective-globe-scenes.js', 'harness/three-subjective-globe-scenes-browser-entry.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:http', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] });
		const after = await verifyProtectedTrackedInventory(before, policy);
		const proof = { proofId: 'g7-three-subjective-globe-context-v1', accepted: true, assertions, claimBoundary: result.claimBoundary, captures: result.scenes.map((scene) => `captures/${scene.id}.png`), result: { nativeSunAngularRadiusRadians: result.nativeSunAngularRadiusRadians, scenes: result.scenes.map(({ imagePngDataUrl, ...scene }) => scene) }, containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/g7-three-subjective-globe-scenes.json', proof);
		const manifest = await run.finalize({ conclusion: 'accepted', result: proof, report: `# ${run.runId}: Three subjective globe contexts\n\nConclusion: **accepted**\n\nTwo retained subjective location/time labels render through the normal cache, live Sun, and renderer scene-input path. This is visual context only.\n` });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256 }, null, 2)}\n`);
	} catch (error) {
		const detail = { name: error.name, message: error.message, stack: error.stack };
		try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: Three subjective globe contexts\n\nConclusion: **failed**\n\n${detail.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`); } catch {}
		process.exitCode = 1;
	} finally { await server?.close().catch(() => {}); }
}

await main();
