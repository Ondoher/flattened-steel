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
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	OUTPUT_ROOT,
	REPOSITORY_ROOT,
	RUNS_ROOT,
	assertLexicallyContained,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';
import {FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER} from '../stellar-visual-adaptation/run-ferwerda-screen-palette-browser.js';
import {
	FERWERDA_VISUAL_ADAPTATION_CONTRACT,
	createNative15ScotopicLuminanceWeights,
	deriveFerwerdaSteadyStateParameters,
} from '../stellar-visual-adaptation/FerwerdaVisualAdaptationModel.js';
import {
	LOCAL_LIGHT_EXPOSURE_POLICY_CONTRACT,
	LocalLightExposurePolicy,
} from '../stellar-screen-palette/LocalLightExposurePolicy.js';

const COMMAND = 'node experiments/extraterrestrial/runners/render-stellar-ferwerda-san-jose.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFileAsync = promisify(executeFile);
const SCREEN_PALETTE_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-screen-palette');
const VISUAL_ADAPTATION_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-visual-adaptation');
const CIE_SCOTOPIC_PATH = path.join(VISUAL_ADAPTATION_ROOT, 'CIE_sle_scotopic.csv');
const CIE_SCOTOPIC_SHA256 = '6a75d3fdbcbf5e9e9a07478511933eefeda953f3e2cc14b74459e5a099ec3759';
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const PARENT_RUN = Object.freeze({
	runId: '000411-stellar-screen-palette-indexed-gpu-resource-proof',
	artifactSetSha256: 'ebca4daac3175e4486db60c51b6cef0cd64207c934cff7aeff13efe6b7a3cfe0',
});
const PARENT_ARTIFACTS = Object.freeze([
	'browser/fixed-matrix.u16',
	'browser/fixed-palette.f32',
	'browser/config.json',
]);
const SOLAR_SUPPORT_RUN = Object.freeze({
	runId: '000395-stellar-first-render-san-jose-sunset-plus-three-hours-pure-bruneton',
	artifactSetSha256: '65ddd198b881fd171e0e0da81e92b49635fe43e23f1168f9989d24dced9c54a2',
	evidencePath: 'evidence/subjective-globe-stars-render.json',
});
const BRUNETON_REFERENCES = Object.freeze([
	'src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js',
	'src/algorithm32/implementation/bruneton-color/consts.js',
	'src/algorithm32/implementation/bruneton-color/_tests/consts.js',
	'src/algorithm32/implementation/scene-lighting/LocalLightLevelCalculator.js',
]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function pngBytes(dataUrl) {
	const match = /^data:image\/png;base64,(?<body>[A-Za-z0-9+/=]+)$/u.exec(dataUrl);
	if (!match) throw new Error('Screen-palette browser render did not return a PNG.');
	return Buffer.from(match.groups.body, 'base64');
}

function contentType(target) {
	if (target.endsWith('.js')) return 'text/javascript; charset=utf-8';
	if (target.endsWith('.json')) return 'application/json; charset=utf-8';
	if (target.endsWith('.html')) return 'text/html; charset=utf-8';
	return 'application/octet-stream';
}

async function inventoryProduction() {
	const [algorithm32, flat32] = await Promise.all([
		createFileInventory(ALGORITHM32_ROOT),
		createFileInventory(FLAT32_ROOT),
	]);
	return {algorithm32, flat32};
}

async function serve(run) {
	const progress = [];
	const requests = [];
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/visual-adaptation/', VISUAL_ADAPTATION_ROOT],
		['/stellar-screen-palette/', SCREEN_PALETTE_ROOT],
	]);
	const server = createServer(async (request, response) => {
		try {
			const url = new URL(request.url, 'http://127.0.0.1');
			const pathname = decodeURIComponent(url.pathname);
			requests.push(pathname);
			if (pathname === '/progress') {
				progress.push({stage: url.searchParams.get('stage'), time: Date.now()});
				response.writeHead(204);
				response.end();
				return;
			}
			const route = [...roots.entries()].find(([prefix]) => pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) throw new Error('Unsupported render path.');
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('Render path escapes its served root.');
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) throw new Error('Render target is not a real file.');
			const canonicalRoot = await realpath(root);
			const canonicalTarget = await realpath(target);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) throw new Error('Render real path escapes its served root.');
			response.writeHead(200, {'content-type': contentType(target)});
			response.end(await readFile(canonicalTarget));
		} catch (error) {
			response.writeHead(404, {'content-type': 'text/plain; charset=utf-8'});
			response.end(String(error.message));
		}
	});
	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	return {
		url: `http://127.0.0.1:${server.address().port}/browser/index.html`,
		progress,
		requests,
		close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
	};
}

function report(runId, proof) {
	const variant = (id) => proof.gpu.variants.find((candidate) => candidate.id === id);
	const baseline = variant('bruneton-baseline-srgb');
	const ward = variant('bruneton-production-ward-srgb');
	const cones = variant('ferwerda-cone-only-srgb');
	const rods = variant('ferwerda-cone-plus-rod-srgb');
	return [
		`# ${runId}: Ferwerda steady-state stellar visibility`,
		'',
		'Conclusion: **accepted**',
		'',
		`- Cache-occupied pixels: ${proof.gpu.occupiedPixelCount}.`,
		`- Ferwerda world/display adaptation: ${proof.ferwerda.worldAdaptationLuminance} / ${proof.ferwerda.displayAdaptationLuminance} cd m^-2.`,
		`- Ferwerda cone/rod scales: ${proof.ferwerda.coneScale} / ${proof.ferwerda.rodScale}.`,
		`- Bruneton baseline nonblack/max byte: ${baseline.byteSummary.nonblackPixelCount} / ${baseline.byteSummary.maximumChannel}.`,
		`- Production Ward control nonblack/max byte: ${ward.byteSummary.nonblackPixelCount} / ${ward.byteSummary.maximumChannel}.`,
		`- Ferwerda cone-only nonblack/max byte: ${cones.byteSummary.nonblackPixelCount} / ${cones.byteSummary.maximumChannel}.`,
		`- Ferwerda cone+rod nonblack/max byte: ${rods.byteSummary.nonblackPixelCount} / ${rods.byteSummary.maximumChannel}.`,
		'',
		'This is a contained, source-independent steady-state threshold-mapping experiment. It is an unattenuated star-only upper bound on a fixed 80 cd m^-2 reference display; it does not tune or change production and does not claim temporal adaptation, acuity, atmosphere, or scene integration.',
		'',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The Ferwerda render accepts no arguments.');
	const run = await initializeRunRecord({
		slug: 'stellar-ferwerda-steady-state-visibility',
		command: COMMAND,
		inputs: {
			schemaId: 'stellar-ferwerda-steady-state-inputs-v1',
			parentRun: PARENT_RUN,
			parentArtifacts: PARENT_ARTIFACTS,
			observation: 'San Jose fixed 2024-06-21 sunset plus three hours from accepted projection run',
			composition: 'zero path radiance, unit view transmittance, clear visibility; unattenuated upper bound',
			color: 'Bruneton Figure-1 and production Ward+sRGB controls versus Ferwerda 1996 steady-state threshold mapping with CIE scotopic V-prime',
			ferwerdaReferenceConditions: {worldAdaptationLuminance: 0.001, displayMaximumLuminance: 80, displayAdaptationLuminance: 40, units: 'cd m^-2'},
			viewport: {width: 640, height: 400},
		},
		provenance: {
			schemaId: 'stellar-ferwerda-steady-state-provenance-v1',
			parentRun: PARENT_RUN,
			operation: 'copy accepted fixed matrix/palette; integrate official CIE scotopic response over native-15 bins; compare two Bruneton controls with Ferwerda cone-only and cone-plus-rod steady-state mappings',
			implementation: 'experiments/extraterrestrial/stellar-visual-adaptation',
			primaryReference: FERWERDA_VISUAL_ADAPTATION_CONTRACT,
			brunetonReferences: BRUNETON_REFERENCES,
		},
		environment: {
			schemaId: 'stellar-screen-palette-san-jose-render-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: CHROME_PATH,
		},
		references: {
			schemaId: 'stellar-screen-palette-san-jose-render-references-v1',
			canonicalDesign: 'agents/topics/extraterrestrial/stellar-screen-palette-design.md',
			canonicalPlan: 'agents/topics/extraterrestrial/stellar-rendering-plan.md',
		},
	});
	let server;
	let browserProfilePath;
	try {
		await assertRepositoryIdentity();
		const exposurePolicy = new LocalLightExposurePolicy();
		const adaptingLuminanceProxy = Object.freeze({value: 0, units: 'cd m^-2'});
		const exposureModifier = exposurePolicy.deriveExposureModifier(adaptingLuminanceProxy);
		const exposure = Object.freeze({...exposurePolicy.modifyExposure({baselineExposure: 1, exposureModifier}), adaptingLuminanceProxy, policy: LOCAL_LIGHT_EXPOSURE_POLICY_CONTRACT});
		const cieCsv = await readFile(CIE_SCOTOPIC_PATH, 'utf8');
		const cieSha256 = await sha256File(CIE_SCOTOPIC_PATH);
		const scotopicWeights = createNative15ScotopicLuminanceWeights(cieCsv);
		const ferwerda = deriveFerwerdaSteadyStateParameters({worldAdaptationLuminance: 0.001, displayMaximumLuminance: 80, displayAdaptationLuminance: 40});
		await Promise.all([
			lstat(CHROME_PATH),
			assertNoReparseEntries(SCREEN_PALETTE_ROOT, 'Stellar screen-palette implementation tree'),
			assertNoReparseEntries(VISUAL_ADAPTATION_ROOT, 'Stellar visual-adaptation implementation tree'),
		]);
		const productionBefore = await inventoryProduction();
		const parentRoot = path.join(RUNS_ROOT, PARENT_RUN.runId);
		await assertExistingRealPathContained(OUTPUT_ROOT, parentRoot, 'Accepted parent run');
		const parentManifest = JSON.parse(await readFile(path.join(parentRoot, 'artifact-manifest.json'), 'utf8'));
		requireCondition(parentManifest.conclusion === 'accepted' && parentManifest.artifactSetSha256 === PARENT_RUN.artifactSetSha256, 'Parent cache run identity changed.');
		const parentEvidence = {};
		for (const relativePath of PARENT_ARTIFACTS) {
			const entry = parentManifest.artifacts.find((artifact) => artifact.path === relativePath);
			requireCondition(entry, `Parent run lacks ${relativePath}.`);
			const sourcePath = path.join(parentRoot, ...relativePath.split('/'));
			const actualSha256 = await sha256File(sourcePath);
			requireCondition(actualSha256 === entry.sha256, `Parent artifact changed: ${relativePath}.`);
			parentEvidence[relativePath] = {byteLength: entry.byteLength, sha256: actualSha256};
		}
		const parentConfig = JSON.parse(await readFile(path.join(parentRoot, 'browser', 'config.json'), 'utf8'));
		const solarSupportRoot = path.join(RUNS_ROOT, SOLAR_SUPPORT_RUN.runId);
		await assertExistingRealPathContained(OUTPUT_ROOT, solarSupportRoot, 'Accepted solar-support run');
		const solarSupportManifest = JSON.parse(await readFile(path.join(solarSupportRoot, 'artifact-manifest.json'), 'utf8'));
		requireCondition(
			solarSupportManifest.conclusion === 'accepted'
				&& solarSupportManifest.artifactSetSha256 === SOLAR_SUPPORT_RUN.artifactSetSha256,
			'Solar-support run identity changed.',
		);
		const solarSupportEvidencePath = path.join(solarSupportRoot, ...SOLAR_SUPPORT_RUN.evidencePath.split('/'));
		const solarSupportEvidence = JSON.parse(await readFile(solarSupportEvidencePath, 'utf8'));
		requireCondition(
			solarSupportEvidence.directionToSourceUpEastNorth[0] < 0,
			'Fixed observation no longer proves the direct Sun is below the local horizon.',
		);
		for (const [sourceName, destinationName] of [
			['fixed-matrix.u16', 'fixed-matrix.u16'],
			['fixed-palette.f32', 'fixed-palette.f32'],
		]) {
			await run.writeArtifact(`browser/${destinationName}`, await readFile(path.join(parentRoot, 'browser', sourceName)));
		}
		const renderConfig = {
			schemaId: 'stellar-ferwerda-render-browser-config-v1',
			matrixUrl: '/browser/fixed-matrix.u16',
			paletteUrl: '/browser/fixed-palette.f32',
			viewport: parentConfig.products.fixed.viewport,
			identities: parentConfig.products.fixed.identities,
			paletteEntryCount: parentConfig.products.fixed.paletteEntryCount,
			exposure,
			scotopicWeights,
			ferwerda,
		};
		await run.writeJsonArtifact('browser/config.json', renderConfig);
		await run.writeArtifact('browser/index.html', '<!doctype html><meta charset="utf-8"><canvas></canvas><pre id="result">pending</pre><script type="module">window.stellarRenderProgress=(stage)=>fetch("/progress?stage="+encodeURIComponent(stage)); const target=document.querySelector("#result"); try { const {runFerwerdaScreenPaletteBrowser}=await import("/visual-adaptation/run-ferwerda-screen-palette-browser.js"); target.textContent=JSON.stringify(await runFerwerdaScreenPaletteBrowser()); } catch(error) { target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}}); }</script>');
		server = await serve(run);
		browserProfilePath = assertLexicallyContained(OUTPUT_ROOT, path.join(OUTPUT_ROOT, 'browser-profiles', run.runId), 'Chrome screen-palette render profile');
		await mkdir(browserProfilePath, {recursive: true});
		let browser;
		try {
			browser = await executeFileAsync(CHROME_PATH, [
				'--headless=new', '--enable-webgl', '--ignore-gpu-blocklist',
				'--use-angle=swiftshader', '--disable-breakpad', '--disable-crash-reporter',
				'--disable-component-update', `--user-data-dir=${browserProfilePath}`,
				'--virtual-time-budget=30000', '--dump-dom', server.url,
			], {timeout: 60000, maxBuffer: 8 * 1024 * 1024, windowsHide: true});
		} catch (error) {
			await run.writeArtifact('browser/dom-on-failure.html', error.stdout ?? '');
			await run.writeJsonArtifact('browser/progress-on-failure.json', server.progress);
			await run.writeJsonArtifact('browser/requests-on-failure.json', server.requests);
			throw error;
		} finally {
			await rm(browserProfilePath, {recursive: true, force: true});
			browserProfilePath = null;
		}
		await run.writeArtifact('browser/dom.html', browser.stdout);
		await run.writeJsonArtifact('browser/progress.json', server.progress);
		await run.writeJsonArtifact('browser/requests.json', server.requests);
		const resultText = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout)?.[1];
		requireCondition(resultText, 'Headless browser emitted no screen-palette render result.');
		const gpu = JSON.parse(resultText);
		if (gpu.error) throw new Error(`Browser screen-palette render failed: ${gpu.error.name}: ${gpu.error.message}`);
		const captureNames = {
			'bruneton-baseline-srgb': 'san-jose-bruneton-baseline-srgb.png',
			'bruneton-production-ward-srgb': 'san-jose-bruneton-production-ward-srgb.png',
			'ferwerda-cone-only-srgb': 'san-jose-ferwerda-cone-only-srgb.png',
			'ferwerda-cone-plus-rod-srgb': 'san-jose-ferwerda-cone-plus-rod-srgb.png',
		};
		for (const variant of gpu.variants) {
			await run.writeArtifact(`captures/${captureNames[variant.id]}`, pngBytes(variant.imagePngDataUrl));
			delete variant.imagePngDataUrl;
		}
		const brunetonReferenceHashes = {};
		for (const relativePath of BRUNETON_REFERENCES) {
			const absolutePath = path.join(REPOSITORY_ROOT, ...relativePath.split('/'));
			brunetonReferenceHashes[relativePath] = await sha256File(absolutePath);
		}
		const assertions = [];
		const assert = (condition, message) => {
			requireCondition(condition, message);
			assertions.push(message);
		};
		assert(gpu.capabilities.api.includes('WebGL 2'), 'A real WebGL2 context executed the render.');
		assert(gpu.occupiedPixelCount === 52 && gpu.paletteEntryCount === 53, 'The render consumes the accepted fixed 52-pixel, 53-entry cache.');
		assert(gpu.composition.indexFetchesPerPixel === 1 && gpu.composition.paletteScalarFetchesPerPixel === 15 && gpu.composition.catalogIterationsPerPixel === 0, 'The render uses one O(1) screen index and one fixed native-15 palette lookup with no catalog traversal.');
		assert(cieSha256 === CIE_SCOTOPIC_SHA256, 'The official CIE scotopic dataset identity matches its published SHA-256.');
		assert(scotopicWeights.length === 15 && scotopicWeights.every((value) => Number.isFinite(value) && value >= 0), 'Official CIE V-prime integrates to 15 finite nonnegative native-bin weights.');
		assert((FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER.match(/texelFetch\(uStellarScreenIndex/gu) ?? []).length === 1, 'The executable shader contains one screen-index fetch site.');
		assert((FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER.match(/texelFetch\(uStellarPalette/gu) ?? []).length === 1 && /for\(int channelIndex=0;channelIndex<CHANNELS/u.test(FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER), 'The shader contains one palette fetch in one fixed 15-channel loop.');
		assert(!/memberIndex|memberCount|catalog|skyProbe/iu.test(FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER), 'The shader contains no catalog traversal or sky-probe path.');
		assert(/uFerwerdaConeScale/u.test(FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER) && /uFerwerdaRodScale/u.test(FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER), 'The shader separately applies the sourced cone and rod threshold scales.');
		assert(/vec3\(uFerwerdaRodScale/u.test(FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER), 'The first Ferwerda experiment adds the rod response achromatically.');
		assert(/12\.92/u.test(FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER) && /1\.055/u.test(FERWERDA_SCREEN_PALETTE_FRAGMENT_SHADER), 'All controls use the standard sRGB output transfer.');
		assert(ferwerda.coneScale > 1 && ferwerda.rodScale > ferwerda.coneScale && ferwerda.rodBlend > 0 && ferwerda.rodBlend <= 1, 'Ferwerda reference parameters have the expected low-light ordering and bounded rod blend.');
		assert(Math.abs(exposureModifier - 10.50268593548108) <= 1e-12, 'Zero direct-source luminance reproduces the production Ward exposure endpoint.');
		assert(solarSupportEvidence.directionToSourceUpEastNorth[0] < 0 && adaptingLuminanceProxy.value === 0, 'The fixed Sun is below the horizon and supplies exact-zero provisional direct adapting luminance.');
		const variantsById = Object.fromEntries(gpu.variants.map((variant) => [variant.id, variant]));
		const baseline = variantsById['bruneton-baseline-srgb'];
		const ward = variantsById['bruneton-production-ward-srgb'];
		const cones = variantsById['ferwerda-cone-only-srgb'];
		const rods = variantsById['ferwerda-cone-plus-rod-srgb'];
		assert(gpu.variants.length === 4 && baseline && ward && cones && rods, 'Both Bruneton controls and both Ferwerda variants execute.');
		assert(baseline.exposureModifier === 1 && ward.exposureModifier === exposureModifier, 'Bruneton controls retain baseline and production Ward exposure values.');
		assert(gpu.variants.every((variant) => variant.floatSummary.nonzeroPixelCount === 52), 'Every floating-point variant retains all 52 stellar pixels.');
		assert(ward.floatSummary.maximumChannel > baseline.floatSummary.maximumChannel, 'Production Ward exposure increases the Bruneton floating-point control.');
		assert(rods.floatSummary.maximumChannel >= cones.floatSummary.maximumChannel, 'Adding the nonnegative rod response does not reduce the Ferwerda result.');
		const parityLuminances = [0, 0.001, 0.01, 0.1, 1, 5, 100000];
		const parityModifiers = parityLuminances.map((value) => exposurePolicy.deriveExposureModifier({value, units: 'cd m^-2'}));
		assert(parityModifiers.at(-1) === 1 && parityModifiers.at(-2) === 1 && parityModifiers.every(Number.isFinite), 'Contained exposure policy preserves the production photopic baseline and finite low-light range.');
		for (let index = 1; index < parityModifiers.length - 1; index += 1) {
			assert(parityModifiers[index] < parityModifiers[index - 1], `Exposure parity sample ${index} decreases monotonically with luminance.`);
		}

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: ['runners/render-stellar-ferwerda-san-jose.js'],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: [
				'node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises',
				'node:http', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util', 'node:zlib',
			],
		});
		const productionAfter = await inventoryProduction();
		assertFileInventoriesEqual(productionBefore.algorithm32, productionAfter.algorithm32, 'Algorithm32 production inventory');
		assertFileInventoriesEqual(productionBefore.flat32, productionAfter.flat32, 'Flat32 production inventory');
		const proof = {
			proofId: 'stellar-ferwerda-steady-state-visibility-v1',
			accepted: true,
			images: Object.fromEntries(Object.entries(captureNames).map(([id, name]) => [id, `captures/${name}`])),
			gpu,
			exposure: {...exposure, parityLuminances, parityModifiers},
			ferwerda,
			scotopic: {datasetSha256: cieSha256, datasetDoi: FERWERDA_VISUAL_ADAPTATION_CONTRACT.cieScotopicDatasetDoi, native15Weights: scotopicWeights},
			parentRun: PARENT_RUN,
			parentArtifacts: parentEvidence,
			solarSupportRun: SOLAR_SUPPORT_RUN,
			solarDirectionToSourceUpEastNorth: solarSupportEvidence.directionToSourceUpEastNorth,
			brunetonReferenceHashes,
			assertions,
			claimBoundary: 'contained source-independent steady-state threshold-mapping comparison on a fixed 80 cd m^-2 reference display; unattenuated star-only upper bound; no production change, color tuning, temporal adaptation, spatial acuity, secondary ambient, full atmosphere, or scene integration',
			containment: {
				algorithm32FileCount: productionAfter.algorithm32.fileCount,
				flat32FileCount: productionAfter.flat32.fileCount,
				moduleClosureFileCount: closure.files.length,
				moduleClosureEdgeCount: closure.edges.length,
				browserProfileRemovedBeforeFinalization: true,
			},
		};
		await run.writeJsonArtifact('evidence/ferwerda-visual-adaptation.json', proof);
		const manifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				proofId: proof.proofId,
				images: proof.images,
				assertionCount: assertions.length,
				exposureModifier,
				coneScale: ferwerda.coneScale,
				rodScale: ferwerda.rodScale,
				brunetonWardNonblackPixelCount: ward.byteSummary.nonblackPixelCount,
				ferwerdaConeNonblackPixelCount: cones.byteSummary.nonblackPixelCount,
				ferwerdaRodNonblackPixelCount: rods.byteSummary.nonblackPixelCount,
			},
			report: report(run.runId, proof),
		});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, images: proof.images}, null, 2)}\n`);
	} catch (error) {
		const serialized = {name: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined};
		try {
			await run.writeJsonArtifact('evidence/failure.json', serialized);
			const manifest = await run.finalize({conclusion: 'failed', result: {proofId: 'stellar-ferwerda-steady-state-visibility-v1', error: serialized}, report: `# ${run.runId}: Ferwerda steady-state stellar visibility\n\nConclusion: **failed**\n\n${serialized.message}\n`});
			process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: serialized}, null, 2)}\n`);
		} catch (finalizationError) {
			process.stderr.write(`${JSON.stringify({conclusion: 'unsealed-failure', error: serialized, finalizationError: String(finalizationError)}, null, 2)}\n`);
		}
		process.exitCode = 1;
	} finally {
		if (server) await server.close().catch(() => {});
		if (browserProfilePath) await rm(browserProfilePath, {recursive: true, force: true}).catch(() => {});
	}
}

await main();
