import { execFile as executeFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { createServer } from 'node:http';
import { lstat, readFile } from 'node:fs/promises';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { assertContainmentPreconditions, assertNoReparseEntries, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { CANDIDATE_ROOT, EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT } from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-pre-g9-celestial-replacement-runtime-proof.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const execFile = promisify(executeFile);
function requireCondition(value, message) { if (!value) throw new Error(message); }
function contentType(filePath) { return filePath.endsWith('.js') ? 'text/javascript; charset=utf-8' : filePath.endsWith('.json') ? 'application/json; charset=utf-8' : filePath.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'; }
async function serve(run) {
	const roots = new Map([['/browser/', path.join(run.runDirectory, 'browser')], ['/harness/', path.join(EXPERIMENT_ROOT, 'harness')], ['/candidate/', CANDIDATE_ROOT], ['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')], ['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT]]);
	const server = createServer(async (request, response) => { try { const pathname = new URL(request.url, 'http://127.0.0.1').pathname; const entry = [...roots.entries()].find(([prefix]) => pathname.startsWith(prefix)); if (!entry) throw new Error('Unsupported runtime path.'); const relative = pathname.slice(entry[0].length); if (!relative || relative.includes('..') || path.isAbsolute(relative)) throw new Error('Unsafe runtime path.'); const filePath = path.resolve(entry[1], relative); if (!filePath.startsWith(path.resolve(entry[1]) + path.sep)) throw new Error('Runtime path escaped root.'); const body = await readFile(filePath); response.writeHead(200, { 'content-type': contentType(filePath) }); response.end(body); } catch { response.writeHead(404); response.end('not found'); } });
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)); const address = server.address(); return { url: `http://127.0.0.1:${address.port}/browser/index.html`, close: () => new Promise((resolve) => server.close(resolve)) };
}
async function main() {
	const run = await initializeRunRecord({ slug: 'pre-g9-celestial-replacement-runtime-proof', command: COMMAND, inputs: { fixture: 'scripts/extraterrestrial/fixtures/g4-cpu-sun-disk-transport-v1.json', browser: 'Chrome headless WebGL2', runtime: 'Algorithm32 facade -> ShaderBuilder -> Algorithm32ShaderHandle -> EffectComposer', replacement: 'distant Sun angular radius 0.12 -> 0.18 radians; injected 0.24-radian staged allocation failure' }, provenance: { experiment: 'scripts/extraterrestrial', candidate: 'scripts/extraterrestrial/candidate' }, environment: { node: process.version, platform: process.platform, chromePath: CHROME_PATH }, references: { canonicalDesign: 'agents/topics/extraterrestrial/celestial-contribution-cache-design.md', canonicalPlan: 'agents/topics/extraterrestrial/promotion-plan.md' } });
	let server;
	try {
		const policy = await assertContainmentPreconditions(); const before = await createProtectedTrackedInventory(policy); await Promise.all([lstat(CHROME_PATH), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree')]);
		await run.writeArtifact('browser/index.html', `<!doctype html><meta charset="utf-8"><title>Celestial replacement runtime proof</title><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">import { runCelestialReplacementRuntimeBrowserProof } from '/harness/celestial-replacement-runtime-browser-entry.js'; const result = document.querySelector('#result'); try { result.textContent = JSON.stringify(await runCelestialReplacementRuntimeBrowserProof()); } catch (error) { result.textContent = JSON.stringify({ error: { name: error.name, message: error.message, stack: error.stack } }); }</script>`);
		server = await serve(run);
		const browser = await execFile(CHROME_PATH, ['--headless=new', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--virtual-time-budget=120000', '--dump-dom', server.url], { timeout: 180000, maxBuffer: 16 * 1024 * 1024, windowsHide: true });
		await run.writeArtifact('browser/dom.html', browser.stdout);
		const match = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout); requireCondition(match, 'Headless browser did not emit the replacement result.'); const result = JSON.parse(match[1]); if (result.error) throw new Error(`Celestial replacement runtime proof failed: ${result.error.name}: ${result.error.message}`);
		const assertions = []; const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(result.replacementSnapshotVersion === 2, 'Shader handle commits exactly one successful replacement configuration.');
		check(result.firstProbe !== result.secondProbe, 'Rebuilt source radiance changes the live primary cache sample.');
		check(result.failure.message === 'Injected celestial replacement allocation failure.', 'Injected staging failure is reported without publication.');
		check(result.beforeDispose.primaryAllocated === 2 && result.beforeDispose.primaryDisposed === 1 && result.beforeDispose.primaryLive === 1, 'Replacement retires the prior primary field while preserving the published field.');
		check(result.afterHandleDispose.primaryAllocated === 2 && result.afterHandleDispose.primaryDisposed === 2 && result.afterHandleDispose.primaryLive === 0, 'Shader-handle disposal releases the final primary field.');
		check(result.composerPassCountAfterDispose === 0, 'Shader-handle disposal removes its normal runtime passes from the composer.');
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-pre-g9-celestial-replacement-runtime-proof.js', 'harness/celestial-replacement-runtime-browser-entry.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:http', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] }); const after = await verifyProtectedTrackedInventory(before, policy);
		const proof = { proofId: 'pre-g9-celestial-replacement-runtime-v1', accepted: true, assertions, result, containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } }; await run.writeJsonArtifact('evidence/celestial-replacement-runtime.json', proof);
		const manifest = await run.finalize({ conclusion: 'accepted', result: proof, report: `# ${run.runId}: Celestial replacement runtime proof\n\nConclusion: **accepted**\n\nA real ShaderBuilder and shader-handle installation atomically replaces the primary celestial field, preserves the prior published runtime after injected staging failure, and releases both generations at the required lifecycle boundaries.\n` }); process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256 }, null, 2)}\n`);
	} catch (error) { const detail = { name: error.name, message: error.message, stack: error.stack }; try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: Celestial replacement runtime proof\n\nConclusion: **failed**\n\n${detail.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`); } catch {} process.exitCode = 1; } finally { await server?.close().catch(() => {}); }
}
await main();
