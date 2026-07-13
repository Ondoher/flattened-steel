#!/usr/bin/env node

import {execFile as executeFile} from 'node:child_process';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {promisify} from 'node:util';

import {
	BRIGHT_STAR_CATALOG_V50,
	canonicalDirectionFromCatalogCoordinate,
	parseBrightStarCatalogV50,
	selectBrightestBrightStarCatalogMembers,
} from '../catalogs/bright-star-catalog-v50.js';
import {loadPicklesV1998, loadSvoJohnsonFilter} from '../catalogs/stellar-photometry-inputs.js';
import {sha256File} from '../harness/lib/atomic-files.js';
import {
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual, createFileInventory} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	OUTPUT_ROOT,
	REPOSITORY_ROOT,
	assertLexicallyContained,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';
import {STELLAR_CATALOG_FRAME_ID, STELLAR_SCREEN_PALETTE_CONTRACT} from '../stellar-screen-palette/contracts.js';
import {FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE} from '../stellar-screen-palette/fixed-san-jose-fixture.js';
import {materializeNative15StellarMembers} from '../stellar-screen-palette/Native15StellarPhotometry.js';
import {StellarScreenPaletteBuilder} from '../stellar-screen-palette/StellarScreenPaletteBuilder.js';
import {createPerspectiveCameraContract} from '../stellar-screen-palette/StellarScreenProjector.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-stellar-screen-palette-gpu-resource-proof.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFileAsync = promisify(executeFile);
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const SCREEN_PALETTE_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-screen-palette');
const INPUTS = Object.freeze({
	catalog: Object.freeze({relativePath: 'catalogs/bright-star-catalog-v50.tsv', sha256: BRIGHT_STAR_CATALOG_V50.sourceSha256.slice(7)}),
	templates: Object.freeze({relativePath: 'catalogs/pickles-v1998/dat.tar.gz', sha256: 'd25a74fe853d4b343c56fc936b18ebaf640b4946f5776f0797b66a44890a6130'}),
	johnsonB: Object.freeze({relativePath: 'catalogs/svo-johnson/generic-johnson-b.xml', sha256: '887af6b6164fd2e41c5b17d450286819a4758b83e7a6b89bfe9bad73a28ee197'}),
	johnsonV: Object.freeze({relativePath: 'catalogs/svo-johnson/generic-johnson-v.xml', sha256: 'bbbbef8da2f3d074f2ab12307f6c85320d12e1a3306a27086c4564c227abacc6'}),
});

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
			if (!route || pathname.includes('..')) throw new Error('Unsupported GPU proof path.');
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) {
				throw new Error('GPU proof path escapes its served root.');
			}
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) throw new Error('GPU proof target is not a real file.');
			const canonicalRoot = await realpath(root);
			const canonicalTarget = await realpath(target);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) {
				throw new Error('GPU proof real path escapes its served root.');
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

function binaryArtifact(typedArray) {
	return Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
}

function productDescriptor(name, product) {
	return {
		matrixUrl: `/browser/${name}-matrix.u16`,
		paletteUrl: `/browser/${name}-palette.f32`,
		identities: product.identities,
		viewport: product.viewport,
		paletteEntryCount: product.palette.length / 15,
	};
}

function probeForPixel(kind, product, linearIndex) {
	const expectedIndex = product.pixelIndex[linearIndex];
	return {
		kind,
		pixel: {
			x: linearIndex % product.viewport.width,
			y: Math.floor(linearIndex / product.viewport.width),
		},
		expectedIndex,
		expectedSpectrum: Array.from(
			product.palette.slice(expectedIndex * 15, expectedIndex * 15 + 15),
		),
	};
}

function allProbeResults(result) {
	return [
		...result.fixedProbeResults,
		...result.collisionProbeResults,
		...result.restoredProbeResults,
	];
}

function report(runId, proof) {
	return [
		`# ${runId}: Stellar screen-palette indexed GPU resource proof`,
		'',
		'Conclusion: **accepted**',
		'',
		`- Matrix resource: ${proof.gpu.formats.matrix.format}, ${proof.gpu.formats.matrix.width} by ${proof.gpu.formats.matrix.height}.`,
		`- Palette resource: ${proof.gpu.formats.palette.format}, 15 by ${proof.gpu.formats.palette.height}.`,
		`- Lookup probes: ${proof.lookupProbeCount}, each covering all 15 wavelengths.`,
		`- Maximum direct readback error: ${proof.maximumDirectReadbackError}.`,
		`- Maximum shader lookup error: ${proof.maximumShaderLookupError}.`,
		`- Assertions: ${proof.assertions.length}.`,
		'',
		'This accepts Work Plan step 4 only. It does not connect atmosphere composition, render a scene, compress the palette, rewrite indices to Uint8, or modify production.',
		'',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The GPU resource proof accepts no arguments.');
	const run = await initializeRunRecord({
		slug: 'stellar-screen-palette-indexed-gpu-resource-proof',
		command: COMMAND,
		inputs: {
			schemaId: 'stellar-screen-palette-gpu-resource-proof-inputs-v1',
			files: INPUTS,
			fixture: FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE,
			contract: STELLAR_SCREEN_PALETTE_CONTRACT,
			browser: 'Chrome headless WebGL2 through ANGLE SwiftShader',
		},
		provenance: {
			schemaId: 'stellar-screen-palette-gpu-resource-proof-provenance-v1',
			cpuOracleRun: {
				runId: '000409-stellar-screen-palette-exact-cpu-builder-proof',
				artifactSetSha256: 'e1b684575f10d9b6ca6ea6abe4ab756c167bc6c697a9fdb65f66e68623a93572',
			},
			operation: 'upload Uint16 matrix as R16UI and entry-major Float32 native-15 palette as 15-by-entryCount R32F; resolve with exact texelFetch',
			implementation: 'scripts/extraterrestrial/stellar-screen-palette',
		},
		environment: {
			schemaId: 'stellar-screen-palette-gpu-resource-proof-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: CHROME_PATH,
		},
		references: {
			schemaId: 'stellar-screen-palette-gpu-resource-proof-references-v1',
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
		const inputPaths = Object.fromEntries(Object.entries(INPUTS).map(([key, input]) => [
			key,
			path.join(EXPERIMENT_ROOT, input.relativePath),
		]));
		await Promise.all(Object.values(inputPaths).map((target) =>
			assertExistingRealPathContained(EXPERIMENT_ROOT, target, 'GPU proof scientific input')));
		const actualHashes = Object.fromEntries(await Promise.all(
			Object.entries(inputPaths).map(async ([key, target]) => [key, await sha256File(target)]),
		));
		requireCondition(
			Object.keys(INPUTS).every((key) => actualHashes[key] === INPUTS[key].sha256),
			'One or more checked stellar scientific inputs changed.',
		);
		const catalog = selectBrightestBrightStarCatalogMembers(
			parseBrightStarCatalogV50(await readFile(inputPaths.catalog, 'utf8')),
			500,
		);
		const [templates, johnsonB, johnsonV] = await Promise.all([
			loadPicklesV1998(inputPaths.templates),
			loadSvoJohnsonFilter(inputPaths.johnsonB),
			loadSvoJohnsonFilter(inputPaths.johnsonV),
		]);
		const radiometry = materializeNative15StellarMembers({
			members: catalog,
			templates,
			johnsonB,
			johnsonV,
		});
		const members = catalog.map((member, memberIndex) => ({
			id: member.memberId,
			direction: canonicalDirectionFromCatalogCoordinate(member),
			spectralIrradiance: radiometry[memberIndex].spectralIrradiance,
		}));
		const camera = createPerspectiveCameraContract(FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.camera);
		const builder = new StellarScreenPaletteBuilder({maximumExpectedOccupiedPixelCount: 500});
		const baseRequest = {
			members,
			catalogFrameId: STELLAR_CATALOG_FRAME_ID,
			observation: FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.observation,
			camera,
			sourceIdentity: 'native15-packets-sha256:33d4eaa2a34e6512a943a36a6d541aad07ac30d86383eabea5b4ef874e3e7f47',
			numericalIdentity: 'cpu-binary64-accumulation-float32-palette-v1',
		};
		const fixed = builder.build(baseRequest);
		const alternate = builder.build({
			...baseRequest,
			camera: createPerspectiveCameraContract({
				...FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.camera,
				azimuthRadians: FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.camera.azimuthRadians + 0.2,
			}),
		});
		const occupiedResult = fixed.memberResults.find((result) => result.classification === 'occupied-pixel');
		const collisionDirection = members[occupiedResult.memberIndex].direction;
		const collisionMembers = [1, 2, 3, 0].map((factor, memberIndex) => ({
			id: `gpu-collision-${memberIndex}`,
			direction: collisionDirection,
			spectralIrradiance: Array.from({length: 15}, (_, channelIndex) =>
				factor * (channelIndex + 1) * 1e-10),
		}));
		const collision = new StellarScreenPaletteBuilder({maximumExpectedOccupiedPixelCount: 4}).build({
			...baseRequest,
			members: collisionMembers,
			sourceIdentity: 'constructed-four-member-gpu-collision-control-v1',
		});
		const fixedEmptyLinearIndex = fixed.pixelIndex.findIndex((index) => index === 0);
		const fixedOccupiedLinearIndex = occupiedResult.pixel.linearIndex;
		const collisionOccupiedLinearIndex = collision.pixelIndex.findIndex((index) => index !== 0);
		const browserConfig = {
			schemaId: 'stellar-screen-palette-gpu-browser-config-v1',
			products: {
				fixed: productDescriptor('fixed', fixed),
				alternate: productDescriptor('alternate', alternate),
				collision: productDescriptor('collision', collision),
			},
			probes: {
				fixed: [
					probeForPixel('empty', fixed, fixedEmptyLinearIndex),
					probeForPixel('unique', fixed, fixedOccupiedLinearIndex),
				],
				collision: [probeForPixel('collision', collision, collisionOccupiedLinearIndex)],
			},
		};
		for (const [name, product] of Object.entries({fixed, alternate, collision})) {
			await run.writeArtifact(`browser/${name}-matrix.u16`, binaryArtifact(product.pixelIndex));
			await run.writeArtifact(`browser/${name}-palette.f32`, binaryArtifact(product.palette));
		}
		await run.writeJsonArtifact('browser/config.json', browserConfig);
		await run.writeArtifact(
			'browser/index.html',
			'<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="module">window.stellarScreenPaletteProgress=(stage)=>fetch("/progress?stage="+encodeURIComponent(stage)); const target=document.querySelector("#result"); try { const {runGpuResourceBrowserProof}=await import("/screen-palette/run-gpu-resource-browser-proof.js"); target.textContent=JSON.stringify(await runGpuResourceBrowserProof()); } catch(error) { target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}}); }</script>',
		);
		server = await serve(run);
		browserProfilePath = assertLexicallyContained(
			OUTPUT_ROOT,
			path.join(OUTPUT_ROOT, 'browser-profiles', run.runId),
			'Chrome proof profile',
		);
		await mkdir(browserProfilePath, {recursive: true});
		let browser;
		try {
			browser = await executeFileAsync(CHROME_PATH, [
				'--headless=new',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--use-angle=swiftshader',
				'--disable-breakpad',
				'--disable-crash-reporter',
				'--disable-component-update',
				`--user-data-dir=${browserProfilePath}`,
				'--virtual-time-budget=30000',
				'--dump-dom',
				server.url,
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
		requireCondition(resultText, 'Headless browser emitted no GPU resource result.');
		const gpu = JSON.parse(resultText);
		if (gpu.error) throw new Error(`Browser GPU resource proof failed: ${gpu.error.name}: ${gpu.error.message}`);
		const assertions = [];
		const assert = (condition, message) => {
			requireCondition(condition, message);
			assertions.push(message);
		};
		assert(gpu.capabilities.api.includes('WebGL 2'), 'The proof executed on a real WebGL2 context.');
		assert(gpu.capabilities.floatColorBuffer && gpu.capabilities.loseContext, 'Required float-readback and context-loss extensions are present.');
		assert(gpu.formats.matrix.format === 'R16UI' && gpu.formats.matrix.width === 640 && gpu.formats.matrix.height === 400, 'The screen matrix is a complete 640-by-400 R16UI texture.');
		assert(gpu.formats.palette.format === 'R32F' && gpu.formats.palette.width === 15 && gpu.formats.palette.height === 53, 'The fixed native-15 palette is a 15-by-53 R32F texture.');
		const probes = allProbeResults(gpu);
		assert(probes.length === 4 && probes.some((probe) => probe.kind === 'empty') && probes.some((probe) => probe.kind === 'unique') && probes.some((probe) => probe.kind === 'collision'), 'Readback covers empty, unique, collided, and restored-collision pixels.');
		assert(probes.every((probe) => probe.matrixIndex === probe.expectedIndex && probe.shaderIndicesExact), 'Direct and shader integer lookups reproduce every CPU palette index exactly.');
		assert(probes.every((probe) => probe.directPaletteMaximumError === 0), 'Direct R32F readback reproduces all selected CPU Float32 palette values exactly.');
		assert(probes.every((probe) => probe.shaderPaletteMaximumError === 0), 'Shader texelFetch reproduces all selected CPU Float32 palette values exactly.');
		assert(gpu.reuseExact, 'An identical cache identity reuses the published GPU resource without upload.');
		assert(gpu.failurePreserved && gpu.beforeLoss.metrics.failedBuildCount === 1 && gpu.beforeLoss.metrics.stagingCleanupHandleCount === 1, 'Injected staging failure deletes its partial matrix texture and preserves the published resource.');
		assert(gpu.beforeLoss.metrics.replacementCount === 2 && gpu.beforeLoss.metrics.disposedResourceCount === 2, 'View and source-product changes atomically replace and dispose their prior resources.');
		assert(gpu.afterRestore.metrics.abandonedResourceCount === 1 && gpu.afterRestore.metrics.restoredResourceCount === 1 && gpu.afterRestore.hasActiveResource, 'Real context loss abandons the invalid generation and restoration republishes the retained CPU product.');
		assert(gpu.disposedOnce && !gpu.disposedTwice && !gpu.finalController.hasActiveResource, 'Final GPU-controller disposal is effective exactly once.');
		assert(gpu.finalController.metrics.createdResourceCount === 4 && gpu.finalController.metrics.disposedResourceCount === 3 && gpu.finalController.metrics.abandonedResourceCount === 1, 'Every successfully created GPU resource reaches exactly one disposal or context-loss terminal state.');

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [
				'runners/run-stellar-screen-palette-gpu-resource-proof.js',
				'stellar-screen-palette/run-gpu-resource-browser-proof.js',
			],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: [
				'node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises',
				'node:http', 'node:module', 'node:os', 'node:path', 'node:url',
				'node:util', 'node:zlib',
			],
		});
		const productionAfter = await inventoryProduction();
		assertFileInventoriesEqual(productionBefore.algorithm32, productionAfter.algorithm32, 'Algorithm32 production inventory');
		assertFileInventoriesEqual(productionBefore.flat32, productionAfter.flat32, 'Flat32 production inventory');
		const proof = {
			proofId: 'stellar-screen-palette-indexed-gpu-resource-v1',
			accepted: true,
			inputHashes: actualHashes,
			cpuOracle: {
				fixed: fixed.metadata,
				alternate: alternate.metadata,
				collision: collision.metadata,
			},
			gpu,
			lookupProbeCount: probes.length,
			maximumDirectReadbackError: Math.max(...probes.map((probe) => probe.directPaletteMaximumError)),
			maximumShaderLookupError: Math.max(...probes.map((probe) => probe.shaderPaletteMaximumError)),
			assertions,
			containment: {
				algorithm32FileCount: productionAfter.algorithm32.fileCount,
				flat32FileCount: productionAfter.flat32.fileCount,
				moduleClosureFileCount: closure.files.length,
				moduleClosureEdgeCount: closure.edges.length,
				browserProfileRoot: 'tmp/extraterrestrial/browser-profiles/<run-id>; removed before finalization',
			},
		};
		await run.writeJsonArtifact('evidence/gpu-resource-proof.json', proof);
		const manifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				proofId: proof.proofId,
				assertionCount: assertions.length,
				lookupProbeCount: proof.lookupProbeCount,
				maximumDirectReadbackError: proof.maximumDirectReadbackError,
				maximumShaderLookupError: proof.maximumShaderLookupError,
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
				result: {proofId: 'stellar-screen-palette-indexed-gpu-resource-v1', error: serialized},
				report: `# ${run.runId}: Stellar screen-palette indexed GPU resource proof\n\nConclusion: **failed**\n\n${serialized.message}\n`,
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
