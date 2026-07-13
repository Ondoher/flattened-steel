import { execFile as executeFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { createServer } from 'node:http';
import { lstat, readFile } from 'node:fs/promises';
import { BRIGHT_STAR_CATALOG_V50, parseBrightStarCatalogV50, selectBrightestBrightStarCatalogMembers } from '../catalogs/bright-star-catalog-v50.js';
import { loadPicklesV1998, loadSvoJohnsonFilter } from '../catalogs/stellar-photometry-inputs.js';
import { StellarCelestialSource } from '../candidate/src/algorithm32/caches/celestial/StellarCelestialSource.js';
import { StellarSpectralPhotometry } from '../candidate/src/algorithm32/caches/celestial/StellarSpectralPhotometry.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { assertContainmentPreconditions, assertExistingRealPathContained, assertNoReparseEntries, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { sha256File } from '../harness/lib/atomic-files.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { CANDIDATE_ROOT, EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT } from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-pre-g9-stellar-live-raster-proof.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const execFile = promisify(executeFile);
const inputs = { catalog: path.join(EXPERIMENT_ROOT, 'catalogs', 'bright-star-catalog-v50.tsv'), templates: path.join(EXPERIMENT_ROOT, 'catalogs', 'pickles-v1998', 'dat.tar.gz'), b: path.join(EXPERIMENT_ROOT, 'catalogs', 'svo-johnson', 'generic-johnson-b.xml'), v: path.join(EXPERIMENT_ROOT, 'catalogs', 'svo-johnson', 'generic-johnson-v.xml') };
const hashes = { catalog: BRIGHT_STAR_CATALOG_V50.sourceSha256, templates: 'sha256:d25a74fe853d4b343c56fc936b18ebaf640b4946f5776f0797b66a44890a6130', b: 'sha256:887af6b6164fd2e41c5b17d450286819a4758b83e7a6b89bfe9bad73a28ee197', v: 'sha256:bbbbef8da2f3d074f2ab12307f6c85320d12e1a3306a27086c4564c227abacc6' };
function requireCondition(value, message) { if (!value) throw new Error(message); }
function contentType(filePath) { return filePath.endsWith('.js') ? 'text/javascript; charset=utf-8' : filePath.endsWith('.json') ? 'application/json; charset=utf-8' : filePath.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'; }
async function serve(run) {
	const roots = new Map([['/browser/', path.join(run.runDirectory, 'browser')], ['/harness/', path.join(EXPERIMENT_ROOT, 'harness')], ['/candidate/', CANDIDATE_ROOT], ['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')], ['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT]]);
	const server = createServer(async (request, response) => { try { const pathname = new URL(request.url, 'http://127.0.0.1').pathname; const entry = [...roots.entries()].find(([prefix]) => pathname.startsWith(prefix)); if (!entry) throw new Error('Unsupported runtime path.'); const relative = pathname.slice(entry[0].length); if (!relative || relative.includes('..') || path.isAbsolute(relative)) throw new Error('Unsafe runtime path.'); const filePath = path.resolve(entry[1], relative); if (!filePath.startsWith(path.resolve(entry[1]) + path.sep)) throw new Error('Runtime path escaped root.'); const body = await readFile(filePath); response.writeHead(200, { 'content-type': contentType(filePath) }); response.end(body); } catch { response.writeHead(404); response.end('not found'); } });
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)); const address = server.address(); return { url: `http://127.0.0.1:${address.port}/browser/index.html`, close: () => new Promise((resolve) => server.close(resolve)) };
}
async function runtimeInput() {
	const actual = Object.fromEntries(await Promise.all(Object.entries(inputs).map(async ([key, target]) => [key, `sha256:${await sha256File(target)}`])));
	requireCondition(Object.keys(hashes).every((key) => actual[key] === hashes[key]), 'Stellar scientific input hash changed.');
	const [catalogText, templates, johnsonB, johnsonV] = await Promise.all([readFile(inputs.catalog, 'utf8'), loadPicklesV1998(inputs.templates), loadSvoJohnsonFilter(inputs.b), loadSvoJohnsonFilter(inputs.v)]);
	const members = selectBrightestBrightStarCatalogMembers(parseBrightStarCatalogV50(catalogText));
	const source = new StellarCelestialSource({ catalog: BRIGHT_STAR_CATALOG_V50, members, stellarSpectralPhotometry: new StellarSpectralPhotometry({ templates, johnsonB, johnsonV, inputIdentity: actual }) });
	const directions = source.describeCanonicalPointDirections();
	const targetMemberIndex = directions.reduce((best, value, index) => value.direction[2] > directions[best].direction[2] ? index : best, 0);
	const photometryIdentity = source.describeStaticIdentity().stellarPhotometry;
	return { hashes: actual, catalog: BRIGHT_STAR_CATALOG_V50, members, transportIdentity: { id: photometryIdentity.kind, contentHash: photometryIdentity.identity }, transportMembers: source.createTransportMembers().map((member) => ({ memberId: member.memberId, values: [...member.sourceIrradiance.values] })), targetMemberIndex, targetDirection: directions[targetMemberIndex].direction };
}
async function main() {
	const run = await initializeRunRecord({ slug: 'pre-g9-stellar-live-raster-proof', command: COMMAND, inputs: { browser: 'Chrome headless WebGL2', runtime: 'Algorithm32 facade -> ShaderBuilder -> EffectComposer', field: 'accepted 500-member 352-by-208-by-15 R32F tiled stellar cache', raster: 'exact spherical pixel-footprint ownership, E / Omega response, renderer scene-hit visibility' }, provenance: { experiment: 'scripts/extraterrestrial', candidate: 'scripts/extraterrestrial/candidate' }, environment: { node: process.version, platform: process.platform, chromePath: CHROME_PATH }, references: { canonicalDesign: 'agents/topics/extraterrestrial/celestial-contribution-cache-design.md', canonicalPlan: 'agents/topics/extraterrestrial/promotion-plan.md' } });
	let server;
	try {
		const policy = await assertContainmentPreconditions(); const before = await createProtectedTrackedInventory(policy); await Promise.all([lstat(CHROME_PATH), ...Object.values(inputs).map((target) => assertExistingRealPathContained(EXPERIMENT_ROOT, target, 'stellar runtime input')), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree')]);
		const runtime = await runtimeInput(); await run.writeJsonArtifact('browser/stellar-runtime-input.json', runtime);
		await run.writeArtifact('browser/index.html', `<!doctype html><meta charset="utf-8"><title>Stellar live raster proof</title><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">import { runStellarLiveRasterBrowserProof } from '/harness/stellar-live-raster-browser-entry.js'; const result = document.querySelector('#result'); try { result.textContent = JSON.stringify(await runStellarLiveRasterBrowserProof()); } catch (error) { result.textContent = JSON.stringify({ error: { name: error.name, message: error.message, stack: error.stack, details: error.details ?? null } }); }</script>`);
		server = await serve(run); const browser = await execFile(CHROME_PATH, ['--headless=new', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--virtual-time-budget=180000', '--dump-dom', server.url], { timeout: 240000, maxBuffer: 16 * 1024 * 1024, windowsHide: true }); await run.writeArtifact('browser/dom.html', browser.stdout);
		const match = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout); requireCondition(match, 'Headless browser did not emit the stellar live-raster result.'); const result = JSON.parse(match[1]); if (result.error) throw new Error(`Stellar live raster proof failed: ${result.error.name}: ${result.error.message}`); await run.writeJsonArtifact('evidence/browser-result.json', result);
		const assertions = []; const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(result.memberCount === 500 && result.cacheStorage.width === 352 && result.cacheStorage.height === 208 && result.cacheStorage.layers === 15, 'Normal runtime binds the complete accepted 500-member tiled R32F field.');
		check(result.selectedReadback > 0, 'A selected transported stellar member is available to the live GPU consumer.');
		check(result.shaderIncludes.stellarRaster && result.shaderIncludes.exactSolidAngle && result.shaderIncludes.runtimeBinding, 'ShaderBuilder includes the point raster, exact solid angle, and stellar runtime binding.');
		check(result.clearMinusBlocked > 0, 'Renderer-produced live scene visibility suppresses the exact centered star response.');
		check(Math.abs(result.offFrameClearMinusBlocked) <= result.clearMinusBlocked * 1e-3, 'The centered target has no retained response in the opposite off-frame camera view.');
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-pre-g9-stellar-live-raster-proof.js', 'harness/stellar-live-raster-browser-entry.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:http', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util', 'node:zlib'] }); const after = await verifyProtectedTrackedInventory(before, policy);
		const proof = { proofId: 'pre-g9-stellar-live-raster-v1', accepted: true, assertions, result, inputHashes: runtime.hashes, containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } }; await run.writeJsonArtifact('evidence/stellar-live-raster.json', proof);
		const manifest = await run.finalize({ conclusion: 'accepted', result: proof, report: `# ${run.runId}: Stellar live raster proof\n\nConclusion: **accepted**\n\nThe normal runtime consumes the real tiled stellar point cache with exact-footprint E/Omega response and renderer scene-hit visibility.\n` }); process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256 }, null, 2)}\n`);
	} catch (error) { const detail = { name: error.name, message: error.message, stack: error.stack }; try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: Stellar live raster proof\n\nConclusion: **failed**\n\n${detail.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`); } catch {} process.exitCode = 1; } finally { await server?.close().catch(() => {}); }
}
await main();
