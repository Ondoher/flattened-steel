#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {promisify} from 'node:util';

import {BRIGHT_STAR_CATALOG_V50, canonicalDirectionFromCatalogCoordinate, parseBrightStarCatalogV50, selectBrightestBrightStarCatalogMembers} from '../catalogs/bright-star-catalog-v50.js';
import {loadPicklesV1998, loadSvoJohnsonFilter} from '../catalogs/stellar-photometry-inputs.js';
import {sha256File} from '../harness/lib/atomic-files.js';
import {assertExistingRealPathContained, assertNoReparseEntries} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual, createFileInventory} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, OUTPUT_ROOT, REPOSITORY_ROOT, RUNS_ROOT, assertLexicallyContained, assertRepositoryIdentity} from '../harness/lib/roots.js';
import {STELLAR_CATALOG_FRAME_ID} from '../stellar-screen-palette/contracts.js';
import {FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE} from '../stellar-screen-palette/fixed-san-jose-fixture.js';
import {materializeNative15StellarMembers} from '../stellar-screen-palette/Native15StellarPhotometry.js';
import {StellarScreenPaletteBuilder} from '../stellar-screen-palette/StellarScreenPaletteBuilder.js';
import {createPerspectiveCameraContract} from '../stellar-screen-palette/StellarScreenProjector.js';
import {createNative15ScotopicLuminanceWeights, deriveFerwerdaSteadyStateParameters} from '../stellar-visual-adaptation/FerwerdaVisualAdaptationModel.js';
import {FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER} from '../stellar-visual-adaptation/run-ferwerda-screen-palette-browser.js';

const COMMAND = 'node scripts/extraterrestrial/runners/render-stellar-ferwerda-daylight-san-jose.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFile = promisify(execFile);
const SCREEN_PALETTE_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-screen-palette');
const VISUAL_ADAPTATION_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-visual-adaptation');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const EXPECTED_PACKET_SET_SHA256 = '33d4eaa2a34e6512a943a36a6d541aad07ac30d86383eabea5b4ef874e3e7f47';
const CIE_SCOTOPIC_SHA256 = '6a75d3fdbcbf5e9e9a07478511933eefeda953f3e2cc14b74459e5a099ec3759';
const LOCAL_LIGHT_RUN = Object.freeze({runId: '000302-spectral-color-local-light-record', artifactSetSha256: 'dedb03462344654252096e9879972bfa21a3328ba0b18b5c6db9dfd4bc4cb9c1'});
const CONDITIONS = Object.freeze([
	Object.freeze({id: 'sunset', instant: '2024-06-21T03:26:03.503Z', localLightKey: 'spherical-distant/sunset'}),
	Object.freeze({id: 'solar-noon', instant: '2024-06-20T20:08:00.000Z', localLightKey: 'spherical-distant/noon'}),
]);
const INPUTS = Object.freeze({
	catalog: Object.freeze({relativePath: 'catalogs/bright-star-catalog-v50.tsv', sha256: BRIGHT_STAR_CATALOG_V50.sourceSha256.slice(7)}),
	templates: Object.freeze({relativePath: 'catalogs/pickles-v1998/dat.tar.gz', sha256: 'd25a74fe853d4b343c56fc936b18ebaf640b4946f5776f0797b66a44890a6130'}),
	johnsonB: Object.freeze({relativePath: 'catalogs/svo-johnson/generic-johnson-b.xml', sha256: '887af6b6164fd2e41c5b17d450286819a4758b83e7a6b89bfe9bad73a28ee197'}),
	johnsonV: Object.freeze({relativePath: 'catalogs/svo-johnson/generic-johnson-v.xml', sha256: 'bbbbef8da2f3d074f2ab12307f6c85320d12e1a3306a27086c4564c227abacc6'}),
});

function requireCondition(condition, message) { if (!condition) throw new Error(message); }
function typedBytes(value) { return Buffer.from(value.buffer, value.byteOffset, value.byteLength); }
function pngBytes(value) { const match = /^data:image\/png;base64,(?<body>[A-Za-z0-9+/=]+)$/u.exec(value); if (!match) throw new Error('Browser did not return a PNG.'); return Buffer.from(match.groups.body, 'base64'); }
function packetSetSha256(members) { return createHash('sha256').update(JSON.stringify(members.map(({id, spectralIrradiance}) => ({id, spectralIrradiance})))).digest('hex'); }
function contentType(target) { if (target.endsWith('.js')) return 'text/javascript; charset=utf-8'; if (target.endsWith('.json')) return 'application/json; charset=utf-8'; if (target.endsWith('.html')) return 'text/html; charset=utf-8'; return 'application/octet-stream'; }
async function inventoryProduction() { const [algorithm32, flat32] = await Promise.all([createFileInventory(ALGORITHM32_ROOT), createFileInventory(FLAT32_ROOT)]); return {algorithm32, flat32}; }

async function serve(run) {
	const progress = [], requests = [];
	const roots = new Map([['/browser/', path.join(run.runDirectory, 'browser')], ['/visual-adaptation/', VISUAL_ADAPTATION_ROOT], ['/stellar-screen-palette/', SCREEN_PALETTE_ROOT]]);
	const server = createServer(async (request, response) => {
		try {
			const url = new URL(request.url, 'http://127.0.0.1');
			const pathname = decodeURIComponent(url.pathname); requests.push(pathname);
			if (pathname === '/progress') { progress.push({stage: url.searchParams.get('stage'), time: Date.now()}); response.writeHead(204); response.end(); return; }
			const route = [...roots].find(([prefix]) => pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) throw new Error('Unsupported path.');
			const [prefix, root] = route; const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('Path escapes served root.');
			const info = await lstat(target); if (!info.isFile() || info.isSymbolicLink()) throw new Error('Target is not a real file.');
			const canonicalRoot = await realpath(root), canonicalTarget = await realpath(target);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) throw new Error('Real path escapes served root.');
			response.writeHead(200, {'content-type': contentType(target)}); response.end(await readFile(canonicalTarget));
		} catch (error) { response.writeHead(404, {'content-type': 'text/plain'}); response.end(error.message); }
	});
	await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
	return {url: `http://127.0.0.1:${server.address().port}/browser/index.html`, progress, requests, close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))};
}

function report(runId, proof) {
	return [`# ${runId}: Ferwerda sunset and solar-noon stellar layers`, '', 'Conclusion: **accepted**', '', ...proof.gpu.results.map((result) => `- ${result.id}: ${result.occupiedPixelCount} projected pixels; ${result.byteSummary.nonblackPixelCount} nonblack; maximum byte ${result.byteSummary.maximumChannel}; adaptation ${result.ferwerda.worldAdaptationLuminance} cd m^-2; rod blend ${result.ferwerda.rodBlend}.`), '', 'These are correctly time-reprojected, cone-plus-rod, star-only layers on black. They reuse accepted direct-light adaptation records but intentionally omit the atmospheric sky background and stellar attenuation, so they are visibility diagnostics rather than complete daylight scenes.', ''].join('\n');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The daylight comparison accepts no arguments.');
	const run = await initializeRunRecord({
		slug: 'stellar-ferwerda-sunset-solar-noon-comparison', command: COMMAND,
		inputs: {schemaId: 'stellar-ferwerda-daylight-comparison-inputs-v1', conditions: CONDITIONS, scientificInputs: INPUTS, localLightRun: LOCAL_LIGHT_RUN, camera: FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.camera},
		provenance: {schemaId: 'stellar-ferwerda-daylight-comparison-provenance-v1', operation: 'rebuild exact screen palettes at sunset and solar noon; derive steady-state Ferwerda scales from accepted exact-time receiver-local direct-light records; render cone-plus-achromatic-rod star-only layers', implementation: 'scripts/extraterrestrial/stellar-screen-palette and stellar-visual-adaptation'},
		environment: {schemaId: 'stellar-ferwerda-daylight-comparison-environment-v1', node: process.version, platform: process.platform, architecture: process.arch, chromePath: CHROME_PATH},
		references: {schemaId: 'stellar-ferwerda-daylight-comparison-references-v1', plan: 'agents/topics/extraterrestrial/stellar-rendering-plan.md', ferwerda: 'https://jamesferwerda.com/wp-content/uploads/2015/06/j03_ferwerda96_sig.pdf', cieScotopicDoi: '10.25039/CIE.DS.gr6w4b5g'},
	});
	let server, browserProfilePath;
	try {
		await assertRepositoryIdentity();
		await Promise.all([lstat(CHROME_PATH), assertNoReparseEntries(SCREEN_PALETTE_ROOT, 'Screen-palette source'), assertNoReparseEntries(VISUAL_ADAPTATION_ROOT, 'Visual-adaptation source')]);
		const productionBefore = await inventoryProduction();
		const localRunRoot = path.join(RUNS_ROOT, LOCAL_LIGHT_RUN.runId); await assertExistingRealPathContained(OUTPUT_ROOT, localRunRoot, 'Local-light run');
		const localManifest = JSON.parse(await readFile(path.join(localRunRoot, 'artifact-manifest.json'), 'utf8'));
		requireCondition(localManifest.conclusion === 'accepted' && localManifest.artifactSetSha256 === LOCAL_LIGHT_RUN.artifactSetSha256, 'Accepted local-light run identity changed.');
		const localRecord = JSON.parse(await readFile(path.join(localRunRoot, 'evidence', 'local-light-record.json'), 'utf8'));
		const inputPaths = Object.fromEntries(Object.entries(INPUTS).map(([key, value]) => [key, path.join(EXPERIMENT_ROOT, value.relativePath)]));
		await Promise.all(Object.values(inputPaths).map((value) => assertExistingRealPathContained(EXPERIMENT_ROOT, value, 'Scientific input')));
		const actualHashes = Object.fromEntries(await Promise.all(Object.entries(inputPaths).map(async ([key, value]) => [key, await sha256File(value)])));
		requireCondition(Object.keys(INPUTS).every((key) => actualHashes[key] === INPUTS[key].sha256), 'Scientific input identity changed.');
		const ciePath = path.join(VISUAL_ADAPTATION_ROOT, 'CIE_sle_scotopic.csv'); requireCondition(await sha256File(ciePath) === CIE_SCOTOPIC_SHA256, 'CIE fixture identity changed.');
		const scotopicWeights = createNative15ScotopicLuminanceWeights(await readFile(ciePath, 'utf8'));
		const catalog = selectBrightestBrightStarCatalogMembers(parseBrightStarCatalogV50(await readFile(inputPaths.catalog, 'utf8')), 500);
		const [templates, johnsonB, johnsonV] = await Promise.all([loadPicklesV1998(inputPaths.templates), loadSvoJohnsonFilter(inputPaths.johnsonB), loadSvoJohnsonFilter(inputPaths.johnsonV)]);
		const radiometry = materializeNative15StellarMembers({members: catalog, templates, johnsonB, johnsonV});
		const members = catalog.map((member, index) => ({id: member.memberId, direction: canonicalDirectionFromCatalogCoordinate(member), spectralIrradiance: radiometry[index].spectralIrradiance}));
		const sourceIdentity = `native15-packets-sha256:${packetSetSha256(members)}`; requireCondition(sourceIdentity.endsWith(EXPECTED_PACKET_SET_SHA256), 'Stellar packet identity changed.');
		const camera = createPerspectiveCameraContract(FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.camera);
		const builder = new StellarScreenPaletteBuilder({maximumExpectedOccupiedPixelCount: 500});
		const configConditions = [], buildEvidence = [];
		for (const condition of CONDITIONS) {
			const local = localRecord.records.find((record) => record.key === condition.localLightKey); requireCondition(local?.timeIso === condition.instant, `Missing exact-time local-light record for ${condition.id}.`);
			const ferwerda = deriveFerwerdaSteadyStateParameters({worldAdaptationLuminance: local.adaptingLuminanceProxy.value, displayMaximumLuminance: 80, displayAdaptationLuminance: 40});
			const product = builder.build({members, catalogFrameId: STELLAR_CATALOG_FRAME_ID, observation: {...FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.observation, instant: condition.instant}, camera, sourceIdentity, numericalIdentity: 'cpu-binary64-accumulation-float32-palette-v1'});
			await run.writeArtifact(`browser/${condition.id}-matrix.u16`, typedBytes(product.pixelIndex)); await run.writeArtifact(`browser/${condition.id}-palette.f32`, typedBytes(product.palette));
			configConditions.push({id: condition.id, instant: condition.instant, matrixUrl: `/browser/${condition.id}-matrix.u16`, paletteUrl: `/browser/${condition.id}-palette.f32`, viewport: product.viewport, identities: product.identities, paletteEntryCount: product.metadata.paletteEntryCount, ferwerda});
			buildEvidence.push({id: condition.id, instant: condition.instant, localLight: {photopicDirectIlluminance: local.photopicDirectIlluminance, adaptingLuminanceProxy: local.adaptingLuminanceProxy, visibleFraction: local.geometry.visibleFraction}, ferwerda, metadata: product.metadata});
		}
		const browserConfig = {schemaId: 'stellar-ferwerda-daylight-browser-config-v1', viewport: camera.viewport, scotopicWeights, conditions: configConditions};
		await run.writeJsonArtifact('browser/config.json', browserConfig);
		await run.writeArtifact('browser/index.html', '<!doctype html><meta charset="utf-8"><canvas></canvas><pre id="result">pending</pre><script type="module">window.stellarRenderProgress=(stage)=>fetch("/progress?stage="+encodeURIComponent(stage));const target=document.querySelector("#result");try{const {runFerwerdaDaylightComparisonBrowser}=await import("/visual-adaptation/run-ferwerda-daylight-comparison-browser.js");target.textContent=JSON.stringify(await runFerwerdaDaylightComparisonBrowser());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>');
		server = await serve(run); browserProfilePath = assertLexicallyContained(OUTPUT_ROOT, path.join(OUTPUT_ROOT, 'browser-profiles', run.runId), 'Chrome profile'); await mkdir(browserProfilePath, {recursive: true});
		let browser;
		try { browser = await executeFile(CHROME_PATH, ['--headless=new', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--disable-breakpad', '--disable-crash-reporter', '--disable-component-update', `--user-data-dir=${browserProfilePath}`, '--virtual-time-budget=30000', '--dump-dom', server.url], {timeout: 60000, maxBuffer: 8 * 1024 * 1024, windowsHide: true}); }
		catch (error) { await run.writeArtifact('browser/dom-on-failure.html', error.stdout ?? ''); throw error; }
		finally { await rm(browserProfilePath, {recursive: true, force: true}); browserProfilePath = null; }
		await run.writeArtifact('browser/dom.html', browser.stdout); await run.writeJsonArtifact('browser/progress.json', server.progress); await run.writeJsonArtifact('browser/requests.json', server.requests);
		const resultText = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout)?.[1]; requireCondition(resultText, 'Browser emitted no result.'); const gpu = JSON.parse(resultText); if (gpu.error) throw new Error(`${gpu.error.name}: ${gpu.error.message}`);
		const images = {};
		for (const result of gpu.results) { const name = `san-jose-${result.id}-ferwerda-cone-plus-rod.png`; await run.writeArtifact(`captures/${name}`, pngBytes(result.imagePngDataUrl)); delete result.imagePngDataUrl; images[result.id] = `captures/${name}`; }
		const assertions = []; const assert = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		assert(gpu.capabilities.api.includes('WebGL 2'), 'Real WebGL2 executed both renders.');
		assert(gpu.results.length === 2 && gpu.results.every((result) => result.occupiedPixelCount > 0), 'Both exact-time views project stellar pixels.');
		assert(gpu.results.every((result) => result.byteSummary.nonblackPixelCount <= result.occupiedPixelCount), 'Visible byte pixels are bounded by occupied cache pixels.');
		const sunset = gpu.results.find((result) => result.id === 'sunset'), noon = gpu.results.find((result) => result.id === 'solar-noon');
		assert(sunset && noon && sunset.ferwerda.worldAdaptationLuminance < noon.ferwerda.worldAdaptationLuminance, 'Accepted local-light adaptation is lower at sunset than noon.');
		assert(noon.ferwerda.rodBlend === 0 && sunset.ferwerda.rodBlend > 0, 'Ferwerda suppresses rods at noon and retains a partial sunset rod response.');
		assert((FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER.match(/texelFetch\(uStellarScreenIndex/gu) ?? []).length === 1 && (FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER.match(/texelFetch\(uStellarPalette/gu) ?? []).length === 1, 'The shared shader retains one index and one fixed-loop palette fetch site.');
		const closure = await buildStaticModuleClosure({candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/render-stellar-ferwerda-daylight-san-jose.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process','node:crypto','node:fs','node:fs/promises','node:http','node:module','node:os','node:path','node:url','node:util','node:zlib']});
		const productionAfter = await inventoryProduction(); assertFileInventoriesEqual(productionBefore.algorithm32, productionAfter.algorithm32, 'Algorithm32 production inventory'); assertFileInventoriesEqual(productionBefore.flat32, productionAfter.flat32, 'Flat32 production inventory');
		const proof = {proofId: 'stellar-ferwerda-sunset-solar-noon-comparison-v1', accepted: true, images, gpu, builds: buildEvidence, localLightParent: LOCAL_LIGHT_RUN, assertions, claimBoundary: 'time-reprojected cone-plus-achromatic-rod star-only layers on black; accepted direct-source adaptation; no sky background, stellar atmospheric attenuation, scene geometry, temporal adaptation, acuity, or production change', containment: {algorithm32FileCount: productionAfter.algorithm32.fileCount, flat32FileCount: productionAfter.flat32.fileCount, moduleClosureFileCount: closure.files.length, moduleClosureEdgeCount: closure.edges.length}};
		await run.writeJsonArtifact('evidence/daylight-comparison.json', proof);
		const manifest = await run.finalize({conclusion: 'accepted', result: {proofId: proof.proofId, images, summaries: Object.fromEntries(gpu.results.map((result) => [result.id, {occupiedPixelCount: result.occupiedPixelCount, nonblackPixelCount: result.byteSummary.nonblackPixelCount, maximumByte: result.byteSummary.maximumChannel, adaptation: result.ferwerda.worldAdaptationLuminance, rodBlend: result.ferwerda.rodBlend}]))}, report: report(run.runId, proof)});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, images}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({conclusion: 'failed', result: {proofId: 'stellar-ferwerda-sunset-solar-noon-comparison-v1', error: detail}, report: `# ${run.runId}: Ferwerda daylight comparison\n\nConclusion: **failed**\n\n${detail.message}\n`}); process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`); } catch (finalizationError) { process.stderr.write(`${JSON.stringify({conclusion: 'unsealed-failure', error: detail, finalizationError: String(finalizationError)}, null, 2)}\n`); }
		process.exitCode = 1;
	} finally { if (server) await server.close().catch(() => {}); if (browserProfilePath) await rm(browserProfilePath, {recursive: true, force: true}).catch(() => {}); }
}

await main();
