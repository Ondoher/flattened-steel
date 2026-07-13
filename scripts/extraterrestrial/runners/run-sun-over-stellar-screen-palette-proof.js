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
import {composeStellarBoundaryRadiance} from '../stellar-screen-palette/StellarScreenPaletteAtmosphereComposer.js';
import {createPerspectiveCameraContract} from '../stellar-screen-palette/StellarScreenProjector.js';
import {
	SUN_DISK_SCREEN_PALETTE_POLICY,
	composeSunDiskOverStellarPalette,
	deriveUniformSunDiskRadiance,
	projectUniformSunDiskCoverage,
} from '../stellar-screen-palette/SunDiskScreenPaletteComposer.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-sun-over-stellar-screen-palette-proof.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFileAsync = promisify(executeFile);
const SCREEN_PALETTE_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-screen-palette');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const PARENT = Object.freeze({
	runId: '000411-stellar-screen-palette-indexed-gpu-resource-proof',
	artifactSetSha256: 'ebca4daac3175e4486db60c51b6cef0cd64207c934cff7aeff13efe6b7a3cfe0',
});
const PARENT_ARTIFACTS = Object.freeze([
	'browser/fixed-matrix.u16',
	'browser/fixed-palette.f32',
	'browser/config.json',
]);
const PRODUCTION_SUN = Object.freeze({
	angularRadiusRadians: 0.004675,
	sourceIrradianceHash: 'sha256:b501bad3f86702dbef751b7def0cd9bf189f56816bd54750063a1933591d751e',
	sourceIrradiance: Object.freeze([
		1.0688666666666664, 1.729673, 1.8620716666666661, 2.0220633333333335,
		1.9081540000000001, 1.8833910000000003, 1.8342466666666666,
		1.7674400000000001, 1.65952, 1.548102333333333, 1.45078,
		1.3409603333333335, 1.2624333333333335, 1.175208, 1.090824,
	]),
});
const CONTROLLED_SUBPIXEL_OFFSET = Object.freeze({x: 0.05, y: 0.35});

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function pngBytes(dataUrl) {
	const match = /^data:image\/png;base64,(.+)$/u.exec(dataUrl);
	if (!match) throw new Error('Browser did not return a PNG data URL.');
	return Buffer.from(match[1], 'base64');
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
	const requests = [];
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/screen-palette/', SCREEN_PALETTE_ROOT],
	]);
	const server = createServer(async (request, response) => {
		try {
			const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
			requests.push(pathname);
			const route = [...roots].find(([prefix]) => pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) throw new Error('Unsupported Sun-layer proof path.');
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('Sun-layer proof path escapes root.');
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) throw new Error('Sun-layer target is not a real file.');
			const canonicalRoot = await realpath(root);
			const canonicalTarget = await realpath(target);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) throw new Error('Sun-layer real path escapes root.');
			response.writeHead(200, {'content-type': contentType(target)});
			response.end(await readFile(canonicalTarget));
		} catch (error) {
			response.writeHead(404, {'content-type': 'text/plain; charset=utf-8'});
			response.end(error.message);
		}
	});
	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	return {
		url: `http://127.0.0.1:${server.address().port}/browser/index.html`,
		requests,
		close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
	};
}

function spectrumAt(product, linearIndex) {
	const paletteIndex = product.pixelIndex[linearIndex];
	return Array.from(product.palette.slice(paletteIndex * 15, paletteIndex * 15 + 15));
}

function maximumError(left, right) {
	return Math.max(...left.map((value, index) => Math.abs(value - right[index])));
}

function float32CompositionOracle(product, testCase) {
	const linearIndex = testCase.pixel.y * product.viewport.width + testCase.pixel.x;
	const boundary = spectrumAt(product, linearIndex);
	const visibility = testCase.sceneHitMask < 0.5 && testCase.horizonMask < 0.5 ? 1 : 0;
	return testCase.pathRadiance.map((value, channelIndex) => {
		const pathValue = Math.fround(value);
		const transported = Math.fround(
			Math.fround(visibility * Math.fround(testCase.viewTransmittance[channelIndex]))
				* Math.fround(boundary[channelIndex]),
		);
		return Math.fround(pathValue + transported);
	});
}

function exactCoverageControl(sunRadiance) {
	const starSpectrum = Float32Array.from({length: 15}, (_, channelIndex) => (channelIndex + 1) / 1048576);
	const stellarProduct = {
		contract: Object.freeze({schemaId: 'stellar-screen-palette-cache-v1'}),
		identities: Object.freeze({source: 'constructed-five-pixel-star-control'}),
		viewport: Object.freeze({width: 5, height: 1}),
		pixelIndex: new Uint16Array([1, 1, 1, 1, 1]),
		palette: Float32Array.from([...Array(15).fill(0), ...starSpectrum]),
	};
	const coverage = Object.freeze({
		policyIdentity: SUN_DISK_SCREEN_PALETTE_POLICY.id,
		sampleHits: new Uint8Array([0, 1, 2, 3, 4]),
		classifications: Object.freeze({zero: 1, quarter: 1, half: 1, threeQuarter: 1, full: 1}),
	});
	const output = composeSunDiskOverStellarPalette({
		stellarProduct,
		coverage,
		sunRadiance,
		sourceIdentity: 'production-sun-over-constructed-five-pixel-star-control',
	});
	return {
		coverageValues: [0, 0.25, 0.5, 0.75, 1],
		inputStarSpectrum: Array.from(starSpectrum),
		outputSpectra: [0, 1, 2, 3, 4].map((linearIndex) => spectrumAt(output, linearIndex)),
		metadata: output.metadata,
	};
}

function directionAtSubpixelOffset(camera, offset) {
	const ndcX = 2 * offset.x / camera.viewport.width;
	const ndcY = 2 * offset.y / camera.viewport.height;
	const direction = [0, 1, 2].map((axis) => camera.forward[axis]
		+ ndcX * camera.tangentHalfVerticalFieldOfView * camera.aspectRatio * camera.right[axis]
		+ ndcY * camera.tangentHalfVerticalFieldOfView * camera.up[axis]);
	const length = Math.hypot(...direction);
	return direction.map((value) => value / length);
}

function report(runId, proof) {
	return [
		`# ${runId}: Sun over stellar screen-palette proof`, '',
		'Conclusion: **accepted**', '',
		`- Production four-sample coverage: ${JSON.stringify(proof.coverage.classifications)}.`,
		`- Sun-owned pixels: ${proof.composed.metadata.sunOccupiedPixelCount}; suppressed controlled stellar pixels: ${proof.composed.metadata.suppressedStellarPixelCount}.`,
		`- Persistent storage: ${proof.composed.metadata.matrixBytes} matrix bytes plus ${proof.composed.metadata.paletteBytes} palette bytes.`,
		`- Construction time: ${proof.timing.compositionMilliseconds.toFixed(3)} ms.`,
		`- Render: ${proof.browser.render.summary.nonblackPixelCount} nonblack pixels; maximum byte ${proof.browser.render.summary.maximumChannel}.`,
		`- Assertions: ${proof.assertions.length}.`, '',
		'This accepts contained Work Plan step 13. The palette-composed Sun is the only Sun path in the proof render. Production remains unchanged; Moon behavior and production promotion are not evaluated.', '',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The Sun-over-stellar proof accepts no arguments.');
	const run = await initializeRunRecord({
		slug: 'sun-over-stellar-screen-palette-proof',
		command: COMMAND,
		inputs: {
			schemaId: 'sun-over-stellar-screen-palette-inputs-v1',
			parent: PARENT,
			parentArtifacts: PARENT_ARTIFACTS,
			productionSun: PRODUCTION_SUN,
			controlledSubpixelOffset: CONTROLLED_SUBPIXEL_OFFSET,
			policy: SUN_DISK_SCREEN_PALETTE_POLICY,
		},
		provenance: {
			schemaId: 'sun-over-stellar-screen-palette-provenance-v1',
			operation: 'copy accepted stellar matrix/palette; project unchanged production four-sample Sun support; flatten any-positive opaque Sun over stars; apply shared transmittance once; apply unchanged Bruneton Figure-1 Color once',
			implementation: 'scripts/extraterrestrial/stellar-screen-palette',
			exclusions: ['legacy independent Sun contribution', 'Moon', 'Color tuning', 'production promotion'],
		},
		environment: {schemaId: 'sun-over-stellar-screen-palette-environment-v1', node: process.version, platform: process.platform, architecture: process.arch, chromePath: CHROME_PATH},
		references: {schemaId: 'sun-over-stellar-screen-palette-references-v1', design: 'agents/topics/extraterrestrial/stellar-screen-palette-design.md', plan: 'agents/topics/extraterrestrial/stellar-rendering-plan.md'},
	});
	let server;
	let browserProfilePath;
	try {
		await assertRepositoryIdentity();
		await Promise.all([lstat(CHROME_PATH), assertNoReparseEntries(SCREEN_PALETTE_ROOT, 'Stellar screen-palette implementation')]);
		const productionBefore = await inventoryProduction();
		const parentRoot = path.join(RUNS_ROOT, PARENT.runId);
		await assertExistingRealPathContained(OUTPUT_ROOT, parentRoot, 'Accepted GPU parent run');
		const parentManifest = JSON.parse(await readFile(path.join(parentRoot, 'artifact-manifest.json'), 'utf8'));
		requireCondition(parentManifest.conclusion === 'accepted' && parentManifest.artifactSetSha256 === PARENT.artifactSetSha256, 'Accepted GPU parent identity changed.');
		const parentEvidence = {};
		for (const relativePath of PARENT_ARTIFACTS) {
			const record = parentManifest.artifacts.find((artifact) => artifact.path === relativePath);
			requireCondition(record, `Accepted parent lacks ${relativePath}.`);
			const artifactPath = path.join(parentRoot, ...relativePath.split('/'));
			const sha256 = await sha256File(artifactPath);
			requireCondition(sha256 === record.sha256, `Accepted parent artifact changed: ${relativePath}.`);
			parentEvidence[relativePath] = {byteLength: record.byteLength, sha256};
		}
		const parentConfig = JSON.parse(await readFile(path.join(parentRoot, 'browser', 'config.json'), 'utf8'));
		const descriptor = parentConfig.products.fixed;
		const fixedMatrixBytes = await readFile(path.join(parentRoot, 'browser', 'fixed-matrix.u16'));
		const fixedPaletteBytes = await readFile(path.join(parentRoot, 'browser', 'fixed-palette.f32'));
		const stellarProduct = {
			contract: Object.freeze({schemaId: 'stellar-screen-palette-cache-v1'}),
			identities: descriptor.identities,
			viewport: descriptor.viewport,
			pixelIndex: new Uint16Array(
				fixedMatrixBytes.buffer,
				fixedMatrixBytes.byteOffset,
				fixedMatrixBytes.byteLength / Uint16Array.BYTES_PER_ELEMENT,
			).slice(),
			palette: new Float32Array(
				fixedPaletteBytes.buffer,
				fixedPaletteBytes.byteOffset,
				fixedPaletteBytes.byteLength / Float32Array.BYTES_PER_ELEMENT,
			).slice(),
		};
		requireCondition(stellarProduct.pixelIndex.length === descriptor.viewport.width * descriptor.viewport.height, 'Accepted stellar matrix length changed.');
		requireCondition(stellarProduct.palette.length === descriptor.paletteEntryCount * 15, 'Accepted stellar palette length changed.');
		const cameraDefinition = descriptor.identities.view.camera;
		const camera = createPerspectiveCameraContract({
			azimuthRadians: cameraDefinition.azimuthRadians,
			elevationRadians: cameraDefinition.elevationRadians,
			verticalFieldOfViewRadians: cameraDefinition.verticalFieldOfViewRadians,
			viewport: cameraDefinition.viewport,
		});
		const sunDefinition = deriveUniformSunDiskRadiance(PRODUCTION_SUN.sourceIrradiance, PRODUCTION_SUN.angularRadiusRadians);
		const controlledSunDirection = directionAtSubpixelOffset(camera, CONTROLLED_SUBPIXEL_OFFSET);
		const coverage = projectUniformSunDiskCoverage({camera, directionToSun: controlledSunDirection, angularRadiusRadians: PRODUCTION_SUN.angularRadiusRadians});
		const fullPixel = coverage.sampleHits.findIndex((value) => value === 4);
		requireCondition(fullPixel >= 0, 'Centered production Sun produced no full-coverage pixel.');
		const controlledMatrix = stellarProduct.pixelIndex.slice();
		controlledMatrix[fullPixel] = 1;
		const controlledStellarProduct = {...stellarProduct, pixelIndex: controlledMatrix};
		const start = performance.now();
		const composed = composeSunDiskOverStellarPalette({
			stellarProduct: controlledStellarProduct,
			coverage,
			sunRadiance: sunDefinition.values,
			sourceIdentity: `accepted-stars-plus-production-sun:${PRODUCTION_SUN.sourceIrradianceHash}`,
		});
		const compositionMilliseconds = performance.now() - start;
		const exactControl = exactCoverageControl(sunDefinition.values);
		const originalUnique = parentConfig.probes.fixed.find((probe) => probe.kind === 'unique').pixel;
		const originalUniqueLinear = originalUnique.y * composed.viewport.width + originalUnique.x;
		requireCondition(coverage.sampleHits[originalUniqueLinear] === 0, 'Accepted retained-star probe unexpectedly overlaps the centered Sun.');
		const probes = [
			{id: 'controlled-full-sun-over-star', pixel: {x: fullPixel % composed.viewport.width, y: Math.floor(fullPixel / composed.viewport.width)}},
			{id: 'off-disk-retained-star', pixel: originalUnique},
		];
		for (const hitCount of [1, 2, 3]) {
			const linearIndex = coverage.sampleHits.findIndex((value) => value === hitCount);
			if (linearIndex >= 0) probes.push({id: `projected-${hitCount}-of-4`, pixel: {x: linearIndex % composed.viewport.width, y: Math.floor(linearIndex / composed.viewport.width)}});
		}
		const pathRadiance = Array.from({length: 15}, (_, channelIndex) => (channelIndex + 1) / 16777216);
		const viewTransmittance = Array.from({length: 15}, (_, channelIndex) => 0.25 + channelIndex / 32);
		const compositionCases = probes.slice(0, 2).map((probe) => ({...probe, pathRadiance, viewTransmittance, sceneHitMask: 0, horizonMask: 0}));
		compositionCases.push({...probes[0], id: 'controlled-full-scene-masked', pathRadiance, viewTransmittance, sceneHitMask: 1, horizonMask: 0});
		await run.writeArtifact('browser/composed-matrix.u16', Buffer.from(composed.pixelIndex.buffer, composed.pixelIndex.byteOffset, composed.pixelIndex.byteLength));
		await run.writeArtifact('browser/composed-palette.f32', Buffer.from(composed.palette.buffer, composed.palette.byteOffset, composed.palette.byteLength));
		await run.writeJsonArtifact('browser/config.json', {
			schemaId: 'sun-over-stellar-screen-palette-browser-config-v1',
			product: {matrixUrl: '/browser/composed-matrix.u16', paletteUrl: '/browser/composed-palette.f32', viewport: composed.viewport, identities: composed.identities, paletteEntryCount: composed.metadata.paletteEntryCount},
			probes,
			compositionCases,
			renderTransmittance: Array(15).fill(1),
			legacySunContributionEnabled: false,
		});
		await run.writeArtifact('browser/index.html', '<!doctype html><meta charset="utf-8"><canvas></canvas><pre id="result">pending</pre><script type="module">const target=document.querySelector("#result");try{const {runSunLayerBrowserProof}=await import("/screen-palette/run-sun-layer-browser-proof.js");target.textContent=JSON.stringify(await runSunLayerBrowserProof());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>');
		server = await serve(run);
		browserProfilePath = assertLexicallyContained(OUTPUT_ROOT, path.join(OUTPUT_ROOT, 'browser-profiles', run.runId), 'Chrome Sun-layer profile');
		await mkdir(browserProfilePath, {recursive: true});
		let browser;
		try {
			browser = await executeFileAsync(CHROME_PATH, ['--headless=new', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--disable-breakpad', '--disable-crash-reporter', '--disable-component-update', `--user-data-dir=${browserProfilePath}`, '--virtual-time-budget=60000', '--dump-dom', server.url], {timeout: 120000, maxBuffer: 16 * 1024 * 1024, windowsHide: true});
		} catch (error) {
			await run.writeArtifact('browser/dom-on-failure.html', error.stdout ?? '');
			throw error;
		} finally {
			await rm(browserProfilePath, {recursive: true, force: true});
			browserProfilePath = null;
		}
		await run.writeArtifact('browser/dom.html', browser.stdout);
		await run.writeArtifact('browser/stderr.txt', browser.stderr);
		await run.writeJsonArtifact('browser/requests.json', server.requests);
		const resultText = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout)?.[1];
		requireCondition(resultText, 'Browser emitted no Sun-layer result.');
		const browserResult = JSON.parse(resultText);
		if (browserResult.error) throw new Error(`${browserResult.error.name}: ${browserResult.error.message}`);
		await run.writeArtifact('captures/controlled-sun-over-stars-bruneton.png', pngBytes(browserResult.render.imagePngDataUrl));
		delete browserResult.render.imagePngDataUrl;
		const assertions = [];
		const assert = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		assert(exactControl.outputSpectra[0].every((value, channelIndex) => value === exactControl.inputStarSpectrum[channelIndex]), 'Exact zero coverage preserves all 15 stellar channels.');
		for (let hitCount = 1; hitCount <= 4; hitCount += 1) {
			const scale = hitCount * 0.25;
			assert(exactControl.outputSpectra[hitCount].every((value, channelIndex) => value === Math.fround(sunDefinition.values[channelIndex] * scale)), `Coverage ${scale} writes only the matching coverage-scaled Sun spectrum.`);
		}
		assert(coverage.classifications.quarter > 0 && coverage.classifications.half > 0 && coverage.classifications.threeQuarter > 0 && coverage.classifications.full > 0, 'The declared subpixel projection exercises every positive four-sample coverage class.');
		assert(composed.metadata.suppressedStellarPixelCount >= 1, 'The controlled star behind the Sun is suppressed.');
		assert(maximumError(spectrumAt(composed, originalUniqueLinear), spectrumAt(stellarProduct, originalUniqueLinear)) === 0, 'The off-disk accepted stellar spectrum remains bit-exact.');
		assert(composed.metadata.legacySunContributionEnabled === false && composed.identities.legacySunContribution === 'disabled', 'The composed product declares the prior independent Sun path disabled.');
		assert(browserResult.shaderTopology.legacySunContributionEnabled === false && browserResult.shaderTopology.indexFetchSites === 1 && browserResult.shaderTopology.paletteFetchSites === 1 && browserResult.shaderTopology.catalogLoopSites === 0, 'The render contains one cache lookup path and no legacy Sun or catalog path.');
		for (const readback of browserResult.readbacks) {
			const linearIndex = readback.pixel.y * composed.viewport.width + readback.pixel.x;
			assert(readback.paletteIndex === composed.pixelIndex[linearIndex] && maximumError(readback.spectrum, spectrumAt(composed, linearIndex)) === 0, `GPU matrix and palette readback match the CPU product for ${readback.id}.`);
		}
		for (const result of browserResult.composition) {
			const testCase = compositionCases.find((candidate) => candidate.id === result.id);
			const binary32 = float32CompositionOracle(composed, testCase);
			const boundary = spectrumAt(composed, testCase.pixel.y * composed.viewport.width + testCase.pixel.x);
			const binary64 = composeStellarBoundaryRadiance({...testCase, stellarBoundaryRadiance: boundary});
			assert(maximumError(result.actual, binary32) <= 1e-6 && maximumError(result.actual, binary64) / Math.max(...binary64.map(Math.abs), 1e-30) <= 2e-7, `Shared atmospheric transmittance is applied once for ${result.id}.`);
		}
		assert(browserResult.render.summary.nonblackPixelCount >= composed.metadata.sunOccupiedPixelCount && browserResult.render.summary.maximumChannel > 0, 'The unchanged Bruneton render contains the resolved Sun disk.');
		const closure = await buildStaticModuleClosure({candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-sun-over-stellar-screen-palette-proof.js', 'stellar-screen-palette/run-sun-layer-browser-proof.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:http', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util']});
		const productionAfter = await inventoryProduction();
		assertFileInventoriesEqual(productionBefore.algorithm32, productionAfter.algorithm32, 'Algorithm32 production inventory');
		assertFileInventoriesEqual(productionBefore.flat32, productionAfter.flat32, 'Flat32 production inventory');
		const proof = {
			proofId: 'sun-over-stellar-screen-palette-v1', accepted: true,
			parent: PARENT, parentArtifacts: parentEvidence,
			productionSun: {...PRODUCTION_SUN, controlledSubpixelOffset: CONTROLLED_SUBPIXEL_OFFSET, controlledDirectionToSun: controlledSunDirection, diskSolidAngleSteradians: sunDefinition.solidAngleSteradians, radiance: sunDefinition.values},
			policy: SUN_DISK_SCREEN_PALETTE_POLICY,
			coverage: {footprint: coverage.footprint, classifications: coverage.classifications, evaluatedPixelCount: coverage.evaluatedPixelCount, evaluatedSampleCount: coverage.evaluatedSampleCount, groundRejectedSampleCount: coverage.groundRejectedSampleCount},
			exactCoverageControl: exactControl,
			composed: {identities: composed.identities, metadata: composed.metadata, controlledSuppressedPixel: probes[0], retainedStarPixel: probes[1]},
			timing: {compositionMilliseconds}, browser: browserResult,
			capture: 'captures/controlled-sun-over-stars-bruneton.png', assertions,
			containment: {algorithm32FileCount: productionAfter.algorithm32.fileCount, flat32FileCount: productionAfter.flat32.fileCount, moduleClosureFileCount: closure.files.length, moduleClosureEdgeCount: closure.edges.length},
		};
		await run.writeJsonArtifact('evidence/sun-over-stellar-screen-palette-proof.json', proof);
		const manifest = await run.finalize({conclusion: 'accepted', result: {proofId: proof.proofId, sunOccupiedPixelCount: composed.metadata.sunOccupiedPixelCount, suppressedStellarPixelCount: composed.metadata.suppressedStellarPixelCount, paletteEntryCount: composed.metadata.paletteEntryCount, capture: proof.capture}, report: report(run.runId, proof)});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, capture: proof.capture}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({conclusion: 'failed', result: {proofId: 'sun-over-stellar-screen-palette-v1', error: detail}, report: `# ${run.runId}: Sun over stellar screen-palette proof\n\nConclusion: **failed**\n\n${detail.message}\n`});
			process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`);
		} catch (finalizationError) {
			process.stderr.write(`${JSON.stringify({conclusion: 'unsealed-failure', error: detail, finalizationError: String(finalizationError)}, null, 2)}\n`);
		}
		process.exitCode = 1;
	} finally {
		await server?.close().catch(() => {});
		if (browserProfilePath) await rm(browserProfilePath, {recursive: true, force: true}).catch(() => {});
	}
}

await main();
