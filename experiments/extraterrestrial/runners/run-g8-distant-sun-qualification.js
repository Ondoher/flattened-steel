#!/usr/bin/env node
import { execFile as executeFile } from 'node:child_process';
import { readFile, lstat, realpath } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { promisify } from 'node:util';

import { assertContainmentPreconditions, assertNoReparseEntries, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { CANDIDATE_ROOT, EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT } from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-g8-distant-sun-qualification.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const execFile = promisify(executeFile);
function requireCondition(value, message) { if (!value) throw new Error(message); }
function contentType(filePath) { return filePath.endsWith('.js') ? 'text/javascript; charset=utf-8' : filePath.endsWith('.json') ? 'application/json; charset=utf-8' : filePath.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'; }

async function serveBrowserProof(run) {
	const roots = new Map([['/browser/', path.join(run.runDirectory, 'browser')], ['/harness/', path.join(EXPERIMENT_ROOT, 'harness')], ['/candidate/', CANDIDATE_ROOT], ['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')], ['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT]]);
	const server = createServer(async (request, response) => {
		try {
			const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); const route = [...roots.entries()].find(([prefix]) => pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) throw new Error('Unsupported browser proof path.'); const [prefix, root] = route; const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('Browser proof path escapes its root.'); const info = await lstat(target);
			if (info.isSymbolicLink() || !info.isFile()) throw new Error('Browser proof path is not a real file.'); const [canonicalRoot, canonicalTarget] = await Promise.all([realpath(root), realpath(target)]);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) throw new Error('Browser proof real path escapes its root.'); response.writeHead(200, { 'content-type': contentType(target) }); response.end(await readFile(canonicalTarget));
		} catch (error) { response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); response.end(String(error.message)); }
	});
	await new Promise((resolvePromise, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolvePromise); });
	return { url: `http://127.0.0.1:${server.address().port}/browser/index.html`, close: () => new Promise((resolvePromise, reject) => server.close((error) => error ? reject(error) : resolvePromise())) };
}

async function main() {
	const contract = JSON.parse(await readFile(path.join(EXPERIMENT_ROOT, 'decisions', 'g8-distant-sun-qualification-contract-v1.json'), 'utf8'));
	const run = await initializeRunRecord({ slug: 'g8-distant-sun-qualification', command: COMMAND, inputs: { fixture: 'experiments/extraterrestrial/fixtures/g4-cpu-sun-disk-transport-v1.json', contract: 'experiments/extraterrestrial/decisions/g8-distant-sun-qualification-contract-v1.json', browser: 'Chrome headless WebGL2', schemaId: contract.schemaVersion }, provenance: { experiment: 'experiments/extraterrestrial', candidate: 'experiments/extraterrestrial/candidate' }, environment: { node: process.version, platform: process.platform, chromePath: CHROME_PATH }, references: { canonicalDesign: 'agents/topics/extraterrestrial/celestial-contribution-cache-design.md', canonicalPlan: 'agents/topics/extraterrestrial/promotion-plan.md' } });
	let server;
	try {
		const policy = await assertContainmentPreconditions(); const before = await createProtectedTrackedInventory(policy); await Promise.all([lstat(CHROME_PATH), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree')]);
		await run.writeArtifact('browser/index.html', `<!doctype html><meta charset="utf-8"><title>G8 distant Sun qualification</title><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script><script type="module">import { runG8BrowserQualification } from '/harness/g8-browser-entry.js'; const result = document.querySelector('#result'); try { result.textContent = JSON.stringify(await runG8BrowserQualification()); } catch (error) { result.textContent = JSON.stringify({ error: { name: error.name, message: error.message, stack: error.stack } }); }</script>`);
		server = await serveBrowserProof(run); const browser = await execFile(CHROME_PATH, ['--headless=new', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--virtual-time-budget=60000', '--dump-dom', server.url], { timeout: 120_000, maxBuffer: 4 * 1024 * 1024, windowsHide: true }); await run.writeArtifact('browser/dom.html', browser.stdout);
		const match = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout); requireCondition(match, 'Headless browser did not emit a qualification result.'); const result = JSON.parse(match[1]); if (result.error) throw new Error(`Browser qualification failed: ${result.error.name}: ${result.error.message}`);
		const b = contract.budgets; const assertions = []; const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(result.webglVersion.includes('WebGL 2') && result.capabilities.scalarFormat === 'R32F', 'Qualification hardware exposes WebGL2 R32F array-cache support.');
		check(result.exactNodeAbsoluteError <= b.exactNodeAbsoluteError, `Exact node parity stays within ${b.exactNodeAbsoluteError}.`);
		check(result.memory.residentFieldStorage.value <= b.residentFieldStorageBytesMaximum && result.memory.peakTrackedStorage.value <= b.peakTrackedStorageBytesMaximum, 'Resident and peak tracked GPU storage meet the declared ceilings.');
		check(result.initialRenderBuildMilliseconds <= b.initialRenderBuildMillisecondsMaximum, 'Initial cache render-build meets the declared time ceiling.');
		check(result.liveTwoFrameMilliseconds <= b.liveTwoFrameMillisecondsMaximum && result.live.clear.nonzero > 0 && result.live.blocked.nonzero === 0, 'Live clear/blocked rendering and its measured two-frame execution meet the declared contract.');
		check(result.exactReuse, 'An exact repeat request reuses the active generation without another build.');
		check(result.failurePreservesActiveGeneration && result.disposedCacheRejectsUse, 'Injected failure preserves the active generation and repeated disposal invalidates the retired cache.');
		check(result.contextRehydrated === b.contextRehydrationRequired, 'A fresh WebGL2 backend deterministically rehydrates the published cache field.');
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-g8-distant-sun-qualification.js', 'harness/g8-browser-entry.js', 'harness/g7-browser-entry.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:http', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] }); const after = await verifyProtectedTrackedInventory(before, policy);
		const proof = { proofId: 'g8-distant-sun-qualification-v1', accepted: true, contract, assertions, browser: result, containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } }; await run.writeJsonArtifact('evidence/g8-distant-sun-qualification.json', proof);
		const manifest = await run.finalize({ conclusion: 'accepted', result: { proofId: proof.proofId, assertionCount: assertions.length, initialRenderBuildMilliseconds: result.initialRenderBuildMilliseconds, liveTwoFrameMilliseconds: result.liveTwoFrameMilliseconds, memory: result.memory }, report: `# ${run.runId}: G8 distant Sun qualification\n\nConclusion: **accepted**\n\n- Assertions: ${assertions.length}/${assertions.length} accepted.\n- Initial build: ${result.initialRenderBuildMilliseconds} ms.\n- Live two-frame execution: ${result.liveTwoFrameMilliseconds} ms.\n` }); process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256 }, null, 2)}\n`);
	} catch (error) { const detail = { name: error.name, message: error.message, stack: error.stack }; try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: G8 distant Sun qualification\n\nConclusion: **failed**\n\n${detail.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`); } catch {} process.exitCode = 1; } finally { await server?.close().catch(() => {}); }
}
await main();
