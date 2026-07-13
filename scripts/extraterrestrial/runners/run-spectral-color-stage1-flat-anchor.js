import { execFile as executeFile } from 'node:child_process';
import { lstat, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { promisify } from 'node:util';

import FIXTURE from '../fixtures/spectral-color-stage1-ledger-v1.json' with { type: 'json' };
import { assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy } from '../harness/lib/containment.js';
import { assertFileInventoriesEqual } from '../harness/lib/hashes.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { CANDIDATE_ROOT, EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, assertRepositoryIdentity } from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-spectral-color-stage1-flat-anchor.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const execFile = promisify(executeFile);
const requireCondition = (value, message) => { if (!value) throw new Error(message); };

function contentType(filePath) { return filePath.endsWith('.js') ? 'text/javascript; charset=utf-8' : filePath.endsWith('.json') ? 'application/json; charset=utf-8' : filePath.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'; }
async function serve(run) {
	const roots = new Map([['/browser/', path.join(run.runDirectory, 'browser')], ['/harness/', path.join(EXPERIMENT_ROOT, 'harness')], ['/candidate/', CANDIDATE_ROOT], ['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')], ['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT]]);
	const server = createServer(async (request, response) => { try { const pathname = new URL(request.url, 'http://127.0.0.1').pathname; const root = [...roots.entries()].find(([prefix]) => pathname.startsWith(prefix)); if (!root) throw new Error('Unsupported path.'); const relative = pathname.slice(root[0].length); if (!relative || relative.includes('..') || path.isAbsolute(relative)) throw new Error('Unsafe path.'); const resolved = path.resolve(root[1], relative); if (!resolved.startsWith(`${path.resolve(root[1])}${path.sep}`)) throw new Error('Escaped root.'); response.writeHead(200, { 'content-type': contentType(resolved) }); response.end(await readFile(resolved)); } catch { response.writeHead(404); response.end('not found'); } });
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)); const address = server.address(); return { url: `http://127.0.0.1:${address.port}/browser/index.html`, close: () => new Promise((resolve) => server.close(resolve)) };
}

async function main() {
	const run = await initializeRunRecord({ slug: 'spectral-color-stage1-flat-anchor', command: COMMAND, inputs: { fixture: 'scripts/extraterrestrial/fixtures/spectral-color-stage1-ledger-v1.json', conditions: ['closest-minus-60', 'closest', 'farthest'], purpose: 'bound placement-dependent current-candidate Flat transport before full Stage 1' }, provenance: { experiment: 'scripts/extraterrestrial', candidate: 'scripts/extraterrestrial/candidate' }, environment: { node: process.version, platform: process.platform, chromePath: CHROME_PATH }, references: { canonicalPlan: 'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md' } });
	let server;
	try {
		await assertRepositoryIdentity(); const policy = await loadContainmentPolicy(); const before = await createProtectedTrackedInventory(policy); await Promise.all([lstat(CHROME_PATH), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree')]);
		await run.writeArtifact('browser/index.html', `<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">import {runStage1FlatAnchorProbe} from '/harness/spectral-color-stage1-browser-entry.js'; const t=document.querySelector('#result'); try {const f=await fetch('/fixtures/spectral-color-stage1-ledger-v1.json').then(r=>r.json()); t.textContent=JSON.stringify(await runStage1FlatAnchorProbe(f));} catch(error){t.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>`);
		server = await serve(run); const started = Date.now();
		const browser = await execFile(CHROME_PATH, ['--headless=new', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--virtual-time-budget=300000', '--dump-dom', server.url], { timeout: 360_000, maxBuffer: 16 * 1024 * 1024, windowsHide: true });
		const hostWallElapsedMilliseconds = Date.now() - started; await run.writeArtifact('browser/dom.html', browser.stdout);
		const match = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout); requireCondition(match, 'Flat anchor browser emitted no result.'); const result = JSON.parse(match[1]); if (result.error) throw new Error(`${result.error.name}: ${result.error.message}\n${result.error.stack ?? ''}`);
		result.hostWallElapsedMilliseconds = hostWallElapsedMilliseconds; const assertions = []; const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(result.conditions.length === 3, 'Off-axis, closest, and farthest Flat placement builds completed.');
		const expected = new Map([[0, [0, 6283427.593407407, 4828032]], [180, [-24595.66610387899, 31412707.263672166, 4828032]]]);
		for (const condition of result.conditions) { const reference = expected.get(condition.unwrappedAngleDegrees); if (reference) { const error = Math.max(...condition.centerMeters.map((value, index) => Math.abs(value - reference[index]))); check(error <= FIXTURE.tolerances.flatAnchorPositionMeters, `${condition.id} current synchronizer placement matches the retained anchor within two meters.`); } check(condition.simulationFrame.kind === 'source-centered-translation', `${condition.id} uses a translation-only source-centered simulation frame.`); check(condition.samples[0].celestialRadiance.some((value) => value > 0), `${condition.id} produces transported finite-Sun radiance.`); }
		const projectedSequentialWallMilliseconds = hostWallElapsedMilliseconds / 3 * FIXTURE.flat.conditions.length;
		const projectedShardedWallMilliseconds = hostWallElapsedMilliseconds / 3 * 5;
		check(hostWallElapsedMilliseconds <= FIXTURE.execution.maximumFlatAnchorHostWallMilliseconds * 1.5, 'Three Flat placement builds finish within the scaled predeclared bound.');
		check(projectedShardedWallMilliseconds <= FIXTURE.execution.maximumTotalHostWallMilliseconds, 'The two-wave Flat shard plan projects below ten minutes.');
		await run.writeJsonArtifact('evidence/flat-anchor.json', result);
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-spectral-color-stage1-flat-anchor.js', 'harness/spectral-color-stage1-browser-entry.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:http', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] });
		const after = await createProtectedTrackedInventory(policy); assertFileInventoriesEqual(before, after, 'Stage 1 Flat anchor protected inventory');
		const proof = { proofId: 'spectral-color-stage1-flat-anchor-v1', accepted: true, assertions, hostWallElapsedMilliseconds, projectedSequentialWallMilliseconds, projectedShardedWallMilliseconds, containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/proof.json', proof); const manifest = await run.finalize({ conclusion: 'accepted', result: proof, report: `# ${run.runId}: Stage 1 Flat anchor preflight\n\nConclusion: **accepted**\n\nOff-axis, closest, and farthest placement-dependent transport builds completed in ${(hostWallElapsedMilliseconds / 1000).toFixed(2)} seconds using translation-only source-centered simulation frames. Sequential projection for all 13 Flat conditions is ${(projectedSequentialWallMilliseconds / 1000).toFixed(2)} seconds; the actual two-wave shard plan projects to ${(projectedShardedWallMilliseconds / 1000).toFixed(2)} seconds.\n` }); process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, hostWallElapsedMilliseconds, projectedSequentialWallMilliseconds, projectedShardedWallMilliseconds }, null, 2)}\n`);
	} catch (error) { const detail = { name: error.name, message: error.message, stack: error.stack }; try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: Stage 1 Flat anchor preflight\n\nConclusion: **failed**\n\n${detail.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`); } catch {} process.exitCode = 1; } finally { await server?.close().catch(() => {}); }
}
await main();
