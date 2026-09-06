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
import {
	STELLAR_SCREEN_PALETTE_COMPOSITION_CONTRACT,
	STELLAR_SCREEN_PALETTE_COMPOSITION_FRAGMENT_SHADER,
} from '../stellar-screen-palette/StellarScreenPaletteAtmosphereComposer.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-stellar-screen-palette-atmosphere-composition-proof.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFileAsync = promisify(executeFile);
const SCREEN_PALETTE_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-screen-palette');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const PARENT_RUN = Object.freeze({
	runId: '000411-stellar-screen-palette-indexed-gpu-resource-proof',
	artifactSetSha256: 'ebca4daac3175e4486db60c51b6cef0cd64207c934cff7aeff13efe6b7a3cfe0',
});
const PARENT_ARTIFACTS = Object.freeze([
	'browser/fixed-matrix.u16',
	'browser/fixed-palette.f32',
	'browser/collision-matrix.u16',
	'browser/collision-palette.f32',
	'browser/config.json',
]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
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
		['/screen-palette/', SCREEN_PALETTE_ROOT],
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
			if (!route || pathname.includes('..')) throw new Error('Unsupported composition proof path.');
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) {
				throw new Error('Composition proof path escapes its served root.');
			}
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) throw new Error('Composition proof target is not a real file.');
			const canonicalRoot = await realpath(root);
			const canonicalTarget = await realpath(target);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) {
				throw new Error('Composition proof real path escapes its served root.');
			}
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
		close: () => new Promise((resolve, reject) =>
			server.close((error) => error ? reject(error) : resolve())),
	};
}

function parentArtifact(manifest, relativePath) {
	const artifact = manifest.artifacts.find((candidate) => candidate.path === relativePath);
	if (!artifact) throw new Error(`Parent run lacks required artifact ${relativePath}.`);
	return artifact;
}

function productDescriptor(name, parentDescriptor) {
	return {
		matrixUrl: `/browser/${name}-matrix.u16`,
		paletteUrl: `/browser/${name}-palette.f32`,
		identities: parentDescriptor.identities,
		viewport: parentDescriptor.viewport,
		paletteEntryCount: parentDescriptor.paletteEntryCount,
	};
}

function report(runId, proof) {
	return [
		`# ${runId}: Stellar screen-palette atmosphere composition proof`,
		'',
		'Conclusion: **accepted**',
		'',
		`- Numerical cases: ${proof.gpu.caseCount}.`,
		`- GPU draws: ${proof.gpu.drawCount}.`,
		`- Maximum binary32-oracle relative error: ${proof.maximumBinary32RelativeError}.`,
		`- Maximum physical binary64-oracle relative error: ${proof.maximumBinary64RelativeError}.`,
		`- Per-pixel work: one integer index fetch plus ${proof.contract.paletteScalarFetchesPerPixel} fixed native-15 palette fetches.`,
		`- Assertions: ${proof.assertions.length}.`,
		'',
		'This accepts Work Plan step 5 numerically. It does not apply Bruneton Color, render a scene, modify production, compress the palette, or rewrite indices to Uint8.',
		'',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The composition proof accepts no arguments.');
	const run = await initializeRunRecord({
		slug: 'stellar-screen-palette-atmosphere-composition-proof',
		command: COMMAND,
		inputs: {
			schemaId: 'stellar-screen-palette-atmosphere-composition-proof-inputs-v1',
			parentRun: PARENT_RUN,
			parentArtifacts: PARENT_ARTIFACTS,
			contract: STELLAR_SCREEN_PALETTE_COMPOSITION_CONTRACT,
			browser: 'Chrome headless WebGL2 through ANGLE SwiftShader',
		},
		provenance: {
			schemaId: 'stellar-screen-palette-atmosphere-composition-proof-provenance-v1',
			parentRun: PARENT_RUN,
			operation: 'copy immutable accepted CPU matrix/palette artifacts; fetch one index; fetch fixed native-15 palette row; compose path + visibility * shared transmittance * boundary radiance',
			implementation: 'experiments/extraterrestrial/stellar-screen-palette',
		},
		environment: {
			schemaId: 'stellar-screen-palette-atmosphere-composition-proof-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: CHROME_PATH,
		},
		references: {
			schemaId: 'stellar-screen-palette-atmosphere-composition-proof-references-v1',
			canonicalDesign: 'agents/topics/extraterrestrial/stellar-screen-palette-design.md',
			canonicalPlan: 'agents/topics/extraterrestrial/stellar-rendering-plan.md',
		},
	});
	let server;
	let browserProfilePath;
	try {
		await assertRepositoryIdentity();
		await Promise.all([
			lstat(CHROME_PATH),
			assertNoReparseEntries(SCREEN_PALETTE_ROOT, 'Stellar screen-palette implementation tree'),
		]);
		const productionBefore = await inventoryProduction();
		const parentRoot = path.join(RUNS_ROOT, PARENT_RUN.runId);
		await assertExistingRealPathContained(OUTPUT_ROOT, parentRoot, 'Accepted parent run');
		const parentManifestPath = path.join(parentRoot, 'artifact-manifest.json');
		const parentManifest = JSON.parse(await readFile(parentManifestPath, 'utf8'));
		requireCondition(
			parentManifest.conclusion === 'accepted'
				&& parentManifest.artifactSetSha256 === PARENT_RUN.artifactSetSha256,
			'Parent GPU-resource run identity or conclusion changed.',
		);
		const parentArtifactEvidence = {};
		for (const relativePath of PARENT_ARTIFACTS) {
			const manifestEntry = parentArtifact(parentManifest, relativePath);
			const sourcePath = path.join(parentRoot, ...relativePath.split('/'));
			await assertExistingRealPathContained(parentRoot, sourcePath, 'Parent cache artifact');
			const actualSha256 = await sha256File(sourcePath);
			requireCondition(
				actualSha256 === manifestEntry.sha256,
				`Parent artifact checksum changed: ${relativePath}.`,
			);
			parentArtifactEvidence[relativePath] = {
				byteLength: manifestEntry.byteLength,
				sha256: actualSha256,
			};
		}
		const parentConfig = JSON.parse(
			await readFile(path.join(parentRoot, 'browser', 'config.json'), 'utf8'),
		);
		for (const name of ['fixed', 'collision']) {
			for (const [suffix, extension] of [['matrix', 'u16'], ['palette', 'f32']]) {
				const sourceRelativePath = `browser/${name}-${suffix}.${extension}`;
				await run.writeArtifact(
					sourceRelativePath,
					await readFile(path.join(parentRoot, ...sourceRelativePath.split('/'))),
				);
			}
		}
		const emptyPixel = parentConfig.probes.fixed.find((probe) => probe.kind === 'empty').pixel;
		const uniquePixel = parentConfig.probes.fixed.find((probe) => probe.kind === 'unique').pixel;
		const collisionPixel = parentConfig.probes.collision[0].pixel;
		const pathRadiance = Array.from({length: 15}, (_, index) => (index + 1) / 1048576);
		const fractionalTransmittance = Array.from({length: 15}, (_, index) => (index + 1) / 16);
		const zeroTransmittance = Array(15).fill(0);
		const unitTransmittance = Array(15).fill(1);
		const caseFor = (id, product, pixel, viewTransmittance, sceneHitMask = 0, horizonMask = 0) => ({
			id,
			product,
			pixel,
			pathRadiance,
			viewTransmittance,
			sceneHitMask,
			horizonMask,
		});
		const browserConfig = {
			schemaId: 'stellar-screen-palette-atmosphere-composition-browser-config-v1',
			products: {
				fixed: productDescriptor('fixed', parentConfig.products.fixed),
				collision: productDescriptor('collision', parentConfig.products.collision),
			},
			cases: [
				caseFor('empty-clear-fractional', 'fixed', emptyPixel, fractionalTransmittance),
				caseFor('unique-clear-fractional', 'fixed', uniquePixel, fractionalTransmittance),
				caseFor('unique-scene-masked', 'fixed', uniquePixel, fractionalTransmittance, 1, 0),
				caseFor('unique-horizon-masked', 'fixed', uniquePixel, fractionalTransmittance, 0, 1),
				caseFor('unique-zero-transmittance', 'fixed', uniquePixel, zeroTransmittance),
				caseFor('unique-unit-transmittance', 'fixed', uniquePixel, unitTransmittance),
				caseFor('collision-clear-fractional', 'collision', collisionPixel, fractionalTransmittance),
			],
		};
		await run.writeJsonArtifact('browser/config.json', browserConfig);
		await run.writeArtifact(
			'browser/index.html',
			'<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="module">window.stellarCompositionProgress=(stage)=>fetch("/progress?stage="+encodeURIComponent(stage)); const target=document.querySelector("#result"); try { const {runAtmosphereCompositionBrowserProof}=await import("/screen-palette/run-atmosphere-composition-browser-proof.js"); target.textContent=JSON.stringify(await runAtmosphereCompositionBrowserProof()); } catch(error) { target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}}); }</script>',
		);
		server = await serve(run);
		browserProfilePath = assertLexicallyContained(
			OUTPUT_ROOT,
			path.join(OUTPUT_ROOT, 'browser-profiles', run.runId),
			'Chrome composition profile',
		);
		await mkdir(browserProfilePath, {recursive: true});
		let browser;
		try {
			browser = await executeFileAsync(CHROME_PATH, [
				'--headless=new', '--enable-webgl', '--ignore-gpu-blocklist',
				'--use-angle=swiftshader', '--disable-breakpad', '--disable-crash-reporter',
				'--disable-component-update', `--user-data-dir=${browserProfilePath}`,
				'--virtual-time-budget=30000', '--dump-dom', server.url,
			], {timeout: 60000, maxBuffer: 4 * 1024 * 1024, windowsHide: true});
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
		requireCondition(resultText, 'Headless browser emitted no atmosphere composition result.');
		const gpu = JSON.parse(resultText);
		if (gpu.error) throw new Error(`Browser composition proof failed: ${gpu.error.name}: ${gpu.error.message}`);
		const assertions = [];
		const assert = (condition, message) => {
			requireCondition(condition, message);
			assertions.push(message);
		};
		const indexFetchCount = (STELLAR_SCREEN_PALETTE_COMPOSITION_FRAGMENT_SHADER.match(/texelFetch\(uStellarScreenIndex/gu) ?? []).length;
		const paletteFetchCount = (STELLAR_SCREEN_PALETTE_COMPOSITION_FRAGMENT_SHADER.match(/texelFetch\(\s*uStellarPalette/gu) ?? []).length;
		const loopCount = (STELLAR_SCREEN_PALETTE_COMPOSITION_FRAGMENT_SHADER.match(/for \(int channelIndex/gu) ?? []).length;
		assert(indexFetchCount === 1 && paletteFetchCount === 1 && loopCount === 1, 'Shader source contains one screen-index fetch and one palette fetch site inside one fixed spectral loop.');
		assert(STELLAR_SCREEN_PALETTE_COMPOSITION_CONTRACT.indexFetchesPerPixel === 1 && STELLAR_SCREEN_PALETTE_COMPOSITION_CONTRACT.paletteScalarFetchesPerPixel === 15, 'The executable contract fixes one index fetch and 15 scalar palette fetches per pixel.');
		assert(!/memberIndex|memberCount|catalog|paletteSearch|Bruneton|exposure/iu.test(STELLAR_SCREEN_PALETTE_COMPOSITION_FRAGMENT_SHADER), 'The composition shader has no catalog/member traversal, palette search, Color, or exposure branch.');
		assert(gpu.capabilities.api.includes('WebGL 2') && gpu.capabilities.maximumDrawBuffers >= 4, 'Real WebGL2 executes the native-15 four-target numerical proof.');
		assert(gpu.caseCount === 7 && gpu.drawCount === 7, 'All seven composition controls execute as one fixed-cost draw each.');
		const maximumBinary32RelativeError = Math.max(...gpu.results.map((result) => result.binary32Error.maximumRelative));
		const maximumBinary64RelativeError = Math.max(...gpu.results.map((result) => result.binary64Error.maximumRelative));
		assert(maximumBinary32RelativeError <= 2e-7 && maximumBinary64RelativeError <= 2e-7, 'Every native-15 GPU result agrees with binary32 and physical binary64 oracles within the declared float envelope.');
		const pathOnlyIds = new Set(['empty-clear-fractional', 'unique-scene-masked', 'unique-horizon-masked', 'unique-zero-transmittance']);
		assert(gpu.results.filter((result) => pathOnlyIds.has(result.id)).every((result) => result.binary32Error.maximumAbsolute === 0), 'Empty, scene-masked, horizon-masked, and zero-transmittance cases preserve path radiance exactly.');
		const clearFractional = gpu.results.filter((result) => /clear-fractional$/u.test(result.id) && result.paletteIndex !== 0);
		assert(clearFractional.length === 2 && clearFractional.every((result) => result.squaredTransmittanceError.maximumRelative > 1e-3), 'Unique and collided clear controls distinguish one transmittance application from accidental squaring.');
		assert(gpu.results.find((result) => result.id === 'collision-clear-fractional').paletteIndex === 1, 'The collided pixel resolves one already-summed palette entry without member traversal.');
		assert(gpu.results.find((result) => result.id === 'unique-unit-transmittance').binary32Error.maximumRelative <= 2e-7, 'Unit transmittance adds the full stellar boundary spectrum to path radiance.');

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [
				'runners/run-stellar-screen-palette-atmosphere-composition-proof.js',
				'stellar-screen-palette/run-atmosphere-composition-browser-proof.js',
			],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: [
				'node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises',
				'node:http', 'node:module', 'node:os', 'node:path', 'node:url',
				'node:util',
			],
		});
		const productionAfter = await inventoryProduction();
		assertFileInventoriesEqual(productionBefore.algorithm32, productionAfter.algorithm32, 'Algorithm32 production inventory');
		assertFileInventoriesEqual(productionBefore.flat32, productionAfter.flat32, 'Flat32 production inventory');
		const proof = {
			proofId: 'stellar-screen-palette-atmosphere-composition-v1',
			accepted: true,
			contract: STELLAR_SCREEN_PALETTE_COMPOSITION_CONTRACT,
			parentRun: PARENT_RUN,
			parentArtifacts: parentArtifactEvidence,
			shaderTopology: {indexFetchCount, paletteFetchSiteCount: paletteFetchCount, fixedSpectralLoopCount: loopCount},
			gpu,
			maximumBinary32RelativeError,
			maximumBinary64RelativeError,
			assertions,
			containment: {
				algorithm32FileCount: productionAfter.algorithm32.fileCount,
				flat32FileCount: productionAfter.flat32.fileCount,
				moduleClosureFileCount: closure.files.length,
				moduleClosureEdgeCount: closure.edges.length,
				browserProfileRoot: 'tmp/extraterrestrial/browser-profiles/<run-id>; removed before finalization',
			},
		};
		await run.writeJsonArtifact('evidence/atmosphere-composition-proof.json', proof);
		const manifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				proofId: proof.proofId,
				assertionCount: assertions.length,
				caseCount: gpu.caseCount,
				maximumBinary32RelativeError,
				maximumBinary64RelativeError,
			},
			report: report(run.runId, proof),
		});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256}, null, 2)}\n`);
	} catch (error) {
		const serialized = {
			name: error instanceof Error ? error.name : 'Error',
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		};
		try {
			await run.writeJsonArtifact('evidence/failure.json', serialized);
			const manifest = await run.finalize({
				conclusion: 'failed',
				result: {proofId: 'stellar-screen-palette-atmosphere-composition-v1', error: serialized},
				report: `# ${run.runId}: Stellar screen-palette atmosphere composition proof\n\nConclusion: **failed**\n\n${serialized.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: serialized}, null, 2)}\n`);
		} catch (finalizationError) {
			process.stderr.write(`${JSON.stringify({conclusion: 'unsealed-failure', error: serialized, finalizationError: String(finalizationError)}, null, 2)}\n`);
		}
		process.exitCode = 1;
	} finally {
		await server?.close().catch(() => {});
		if (browserProfilePath) await rm(browserProfilePath, {recursive: true, force: true}).catch(() => {});
	}
}

await main();
