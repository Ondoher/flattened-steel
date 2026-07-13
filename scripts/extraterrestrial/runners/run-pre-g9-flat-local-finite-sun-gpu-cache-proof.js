#!/usr/bin/env node
import { execFile as executeFile } from 'node:child_process';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { promisify } from 'node:util';
import { assertContainmentPreconditions, assertNoReparseEntries, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { CANDIDATE_ROOT, EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT } from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-pre-g9-flat-local-finite-sun-gpu-cache-proof.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const execFile = promisify(executeFile);
const requireCondition = (value, message) => { if (!value) throw new Error(message); };

function contentType(target) { return target.endsWith('.js') ? 'text/javascript; charset=utf-8' : target.endsWith('.json') ? 'application/json; charset=utf-8' : target.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'; }
async function serve(run) {
	const roots = new Map([['/browser/', path.join(run.runDirectory, 'browser')], ['/harness/', path.join(EXPERIMENT_ROOT, 'harness')], ['/candidate/', CANDIDATE_ROOT], ['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')], ['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT]]);
	const server = createServer(async (request, response) => {
		try {
			const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
			const route = [...roots.entries()].find(([prefix]) => pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) throw new Error('Unsupported browser proof path.');
			const [prefix, root] = route; const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('Browser proof path escapes its root.');
			const info = await lstat(target); if (!info.isFile() || info.isSymbolicLink()) throw new Error('Browser proof path is not a real file.');
			const canonicalRoot = await realpath(root); const canonicalTarget = await realpath(target);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) throw new Error('Browser proof real path escapes its root.');
			response.writeHead(200, { 'content-type': contentType(target) }); response.end(await readFile(canonicalTarget));
		} catch (error) { response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); response.end(String(error.message)); }
	});
	await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
	return { url: `http://127.0.0.1:${server.address().port}/browser/index.html`, close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) };
}

async function main() {
	const run = await initializeRunRecord({ slug: 'pre-g9-flat-local-finite-sun-gpu-cache-proof', command: COMMAND, inputs: { fixture: 'scripts/extraterrestrial/fixtures/flat-local-finite-sun-v1.json', browser: 'Chrome headless WebGL2' }, provenance: { experiment: 'scripts/extraterrestrial', candidate: 'scripts/extraterrestrial/candidate' }, environment: { node: process.version, platform: process.platform, chromePath: CHROME_PATH }, references: { canonicalDesign: 'agents/topics/extraterrestrial/celestial-contribution-cache-design.md', canonicalPlan: 'agents/topics/extraterrestrial/promotion-plan.md' } });
	let server;
	try {
		const policy = await assertContainmentPreconditions(); const before = await createProtectedTrackedInventory(policy);
		await Promise.all([lstat(CHROME_PATH), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree')]);
		await run.writeArtifact('browser/index.html', '<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script><script type="module">import { runFlatFiniteSunBrowserProof } from \'/harness/flat-finite-sun-browser-entry.js\'; const result=document.querySelector(\'#result\'); try { result.textContent=JSON.stringify(await runFlatFiniteSunBrowserProof()); } catch (error) { result.textContent=JSON.stringify({ error: { name:error.name, message:error.message, stack:error.stack } }); }</script>');
		server = await serve(run);
		const browser = await execFile(CHROME_PATH, ['--headless=new', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--virtual-time-budget=20000', '--dump-dom', server.url], { timeout: 60000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
		await run.writeArtifact('browser/dom.html', browser.stdout);
		const match = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout); requireCondition(match, 'Headless browser did not emit a proof result.');
		const result = JSON.parse(match[1]); if (result.error) throw new Error(`Browser proof failed: ${result.error.name}: ${result.error.message}`);
		const assertions = []; const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(result.capabilities.api.includes('WebGL2') && result.resource.format === 'R32F' && result.resource.width === 1 && result.resource.height === 1 && result.resource.layers === 15, 'One source-relative R32F texel is rendered for every native local-Sun channel.');
		check(result.readbackCount === 15 && result.maximumError <= 2e-6, `GPU source-radiance cache matches configured channels within binary32 tolerance (${result.maximumError}).`);
		check(result.cacheRenderPassCount === 1 && result.cacheRenderSubmissionCount === 15 && result.lookupUsesSingleTexel, 'The cache uses one actual render pass and a uniform source-relative texel lookup.');
		check(result.liveUsesFiniteBodyAndAtmosphere && Array.isArray(result.liveCenterBinding), 'Live raster owns ray/body support and uses geometry path plus atmosphere medium for disk transmittance.');
		check(result.failurePreserved, 'Injected allocation failure preserves the published flat finite-Sun cache generation.');
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-pre-g9-flat-local-finite-sun-gpu-cache-proof.js', 'harness/flat-finite-sun-browser-entry.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:http', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] });
		const after = await verifyProtectedTrackedInventory(before, policy);
		const proof = { proofId: 'pre-g9-flat-local-finite-sun-gpu-cache-v1', accepted: true, assertions, resource: result.resource, maximumError: result.maximumError, containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/flat-local-finite-sun-gpu-cache.json', proof);
		const manifest = await run.finalize({ conclusion: 'accepted', result: { proofId: proof.proofId, assertionCount: assertions.length, maximumError: proof.maximumError }, report: `# ${run.runId}: flat/local finite-Sun GPU cache proof\n\nConclusion: **accepted**\n\n- Assertions: ${assertions.length}/${assertions.length} accepted.\n- Maximum source-radiance error: ${proof.maximumError}.\n` });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256 }, null, 2)}\\n`);
	} catch (error) {
		const detail = { name: error.name, message: error.message, stack: error.stack };
		try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: flat/local finite-Sun GPU cache proof\n\nConclusion: **failed**\n\n${detail.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\\n`); } catch {}
		process.exitCode = 1;
	} finally { await server?.close().catch(() => {}); }
}
await main();
