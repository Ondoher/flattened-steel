#!/usr/bin/env node
import {execFile as executeFile} from 'node:child_process';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {promisify} from 'node:util';
import {
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	sha256File,
} from '../../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../../harness/lib/module-closure.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {
	CONTAINMENT_POLICY_PATH,
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	OUTPUT_ROOT,
	PRODUCTION_SOURCE_ROOT,
	REPOSITORY_ROOT,
	assertLexicallyContained,
	assertRepositoryIdentity,
} from '../../harness/lib/roots.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFileAsync = promisify(executeFile);
const COMMAND = 'node experiments/extraterrestrial/solar-zenith-cache/runners/run-san-jose-solar-noon-near-ground-page.js';
const RUNNER = 'solar-zenith-cache/runners/run-san-jose-solar-noon-near-ground-page.js';
const LANE = 'solar-zenith-cache/san-jose-nautical-cache-poc';
const LANE_ROOT = path.join(EXPERIMENT_ROOT, LANE);
const POC_POLICY = path.join(LANE_ROOT, 'containment-policy.json');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const CONTROL_RUN = '000511-san-jose-five-scene-actual-point-scattering';
const CONTROL_IMAGE = path.join(OUTPUT_ROOT, 'runs', CONTROL_RUN, 'captures', 'solar-noon.png');
const WIDTH = 9126;
const HEIGHT = 55;
const WAVELENGTHS = 15;
const LAYER_BYTES = WIDTH * HEIGHT * 4;
const VALIDITY_BYTES = WIDTH * HEIGHT;
const PAGE_BYTES = LAYER_BYTES * WAVELENGTHS;

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function contentType(target) {
	if (target.endsWith('.js')) return 'text/javascript; charset=utf-8';
	if (target.endsWith('.json')) return 'application/json; charset=utf-8';
	if (target.endsWith('.html')) return 'text/html; charset=utf-8';
	return 'application/octet-stream';
}

async function requestBody(request, limit) {
	const chunks = [];
	let length = 0;
	for await (const chunk of request) {
		length += chunk.length;
		if (length > limit) throw new Error('Near-ground upload exceeds its declared size.');
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}

async function serve(run) {
	const progress = [];
	const requests = [];
	const layers = new Array(WAVELENGTHS);
	let validity = null;
	let render = null;
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/lane/', LANE_ROOT],
	]);
	const server = createServer(async (request, response) => {
		try {
			const url = new URL(request.url, 'http://127.0.0.1');
			const pathname = decodeURIComponent(url.pathname);
			requests.push(`${request.method} ${pathname}`);
			if (pathname === '/progress') {
				progress.push({stage: url.searchParams.get('stage'), time: Date.now()});
				response.writeHead(204);
				response.end();
				return;
			}
			if (request.method === 'POST' && pathname.startsWith('/artifact/page-layer/')) {
				const wavelength = Number(pathname.split('/').at(-1));
				requireCondition(Number.isInteger(wavelength) && wavelength >= 0 &&
					wavelength < WAVELENGTHS && !layers[wavelength],
				'Invalid or duplicate near-ground page layer.');
				layers[wavelength] = await requestBody(request, LAYER_BYTES);
				requireCondition(layers[wavelength].length === LAYER_BYTES,
					'Near-ground page layer byte count changed.');
				response.writeHead(204);
				response.end();
				return;
			}
			if (request.method === 'POST' && pathname === '/artifact/validity') {
				requireCondition(validity === null, 'Duplicate near-ground validity upload.');
				validity = await requestBody(request, VALIDITY_BYTES);
				requireCondition(validity.length === VALIDITY_BYTES,
					'Near-ground validity byte count changed.');
				response.writeHead(204);
				response.end();
				return;
			}
			if (request.method === 'POST' && pathname === '/artifact/render') {
				requireCondition(render === null, 'Duplicate near-ground render upload.');
				render = await requestBody(request, 8 * 1024 * 1024);
				response.writeHead(204);
				response.end();
				return;
			}
			const route = [...roots.entries()].find(([prefix]) => pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) throw new Error('Unsupported near-ground path.');
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) {
				throw new Error('Near-ground path escapes root.');
			}
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) {
				throw new Error('Near-ground target is not a real file.');
			}
			const canonicalRoot = await realpath(root);
			const canonicalTarget = await realpath(target);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) {
				throw new Error('Near-ground real path escapes root.');
			}
			response.writeHead(200, {'content-type': contentType(target)});
			response.end(await readFile(canonicalTarget));
		} catch (error) {
			response.writeHead(500);
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
		layers,
		getValidity: () => validity,
		getRender: () => render,
		close: () => new Promise((resolve, reject) => server.close((error) =>
			error ? reject(error) : resolve())),
	};
}

async function main() {
	const controlImageSha256 = await sha256File(CONTROL_IMAGE);
	const run = await initializeRunRecord({
		slug: 'san-jose-solar-noon-near-ground-page',
		command: COMMAND,
		inputs: {
			schemaId: 'san-jose-solar-noon-near-ground-page-input-v1',
			workPackage: 'solar-noon near-ground altitude diagnostic',
			scene: 'solar-noon',
			solverDomains: {position: 48, solarZenith: 180, incoming: 68, outgoing: 9126, wavelengths: 15},
			pagePositionNodesInsertedMeters: [1.7, 10, 50, 100, 250, 500, 1000],
			pagePositionCount: HEIGHT,
			renderRegardlessOfAppearance: true,
		},
		provenance: {
			schemaId: 'san-jose-solar-noon-near-ground-page-provenance-v1',
			operation: 'execute the unchanged Native48 actual-point N4 solve, project solar noon to a Native48-plus-seven-near-ground-row page, and render through matching page lookup',
			runner: `experiments/extraterrestrial/${RUNNER}`,
			implementationRoot: `experiments/extraterrestrial/${LANE}`,
			control: {run: CONTROL_RUN, artifact: 'captures/solar-noon.png', sha256: controlImageSha256},
		},
		environment: {
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: CHROME_PATH,
			angleBackend: 'd3d11',
		},
		references: {
			controlRun: CONTROL_RUN,
			firstPageRun: '000509-san-jose-nautical-actual-point-cache-poc',
		},
	});
	let server;
	let profile;
	try {
		await assertRepositoryIdentity();
		await Promise.all([
			lstat(CHROME_PATH),
			assertExistingRealPathContained(OUTPUT_ROOT, CONTROL_IMAGE, 'solar-noon control image'),
			assertExistingRealPathContained(EXPERIMENT_ROOT, CONTAINMENT_POLICY_PATH, 'shared policy'),
			assertExistingRealPathContained(EXPERIMENT_ROOT, POC_POLICY, 'POC policy'),
			assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source tree'),
		]);
		const [beforeAlgorithm32, beforeFlat32] = await Promise.all([
			createFileInventory(PRODUCTION_SOURCE_ROOT),
			createFileInventory(FLAT32_ROOT),
		]);
		await run.writeArtifact('browser/index.html', '<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="module">window.nearGroundProgress=(stage)=>fetch("/progress?stage="+encodeURIComponent(stage));const target=document.querySelector("#result");try{const {runSolarNoonNearGroundBrowser}=await import("/lane/gpu/runSolarNoonNearGroundBrowser.js");target.textContent=JSON.stringify(await runSolarNoonNearGroundBrowser());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>');
		server = await serve(run);
		profile = assertLexicallyContained(OUTPUT_ROOT,
			path.join(OUTPUT_ROOT, 'browser-profiles', run.runId), 'Near-ground Chrome profile');
		await mkdir(profile, {recursive: true});
		let browser;
		try {
			browser = await executeFileAsync(CHROME_PATH, [
				'--headless=new', '--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist',
				'--use-angle=d3d11', '--disable-software-rasterizer', '--disable-breakpad',
				'--disable-crash-reporter', '--disable-component-update',
				'--disable-background-networking', '--disable-gpu-shader-disk-cache',
				'--no-first-run', `--user-data-dir=${profile}`,
				'--virtual-time-budget=7200000', '--dump-dom', server.url,
			], {timeout: 7500000, maxBuffer: 16 * 1024 * 1024, windowsHide: true});
		} catch (error) {
			await run.writeArtifact('browser/dom-on-failure.html', error.stdout ?? '');
			await run.writeArtifact('browser/stderr-on-failure.txt', error.stderr ?? '');
			await run.writeJsonArtifact('browser/progress-on-failure.json', server.progress);
			throw error;
		} finally {
			await rm(profile, {recursive: true, force: true});
			profile = null;
		}
		await run.writeArtifact('browser/dom.html', browser.stdout);
		await run.writeArtifact('browser/stderr.txt', browser.stderr);
		await run.writeJsonArtifact('browser/progress.json', server.progress);
		await run.writeJsonArtifact('browser/requests.json', server.requests);
		const resultText = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout)?.[1];
		requireCondition(resultText, 'Browser emitted no near-ground result.');
		const result = JSON.parse(resultText);
		if (result.error) throw new Error(`${result.error.name}: ${result.error.message}\n${result.error.stack ?? ''}`);
		const validity = server.getValidity();
		const render = server.getRender();
		requireCondition(server.layers.every(Boolean) && validity && render,
			'Browser did not upload the complete page, validity, and render.');
		const payload = Buffer.concat(server.layers);
		requireCondition(payload.length === PAGE_BYTES, 'Combined near-ground page byte count changed.');
		const payloadPath = 'cache/solar-noon-native15-c4-near-ground-55-page-v1.f32';
		const validityPath = 'cache/solar-noon-native15-c4-near-ground-55-page-v1-validity.u8';
		const renderPath = 'captures/solar-noon-near-ground-55.png';
		await run.writeArtifact(payloadPath, payload);
		await run.writeArtifact(validityPath, validity);
		await run.writeArtifact(renderPath, render);
		const pageManifest = {
			schemaId: 'solar-zenith-scene-page-manifest-v1',
			pageId: result.page.id,
			scene: result.scene,
			semantic: 'C4 cumulative local spectral scattering density through N4',
			units: 'W m^-3 sr^-1 nm^-1',
			layout: {width: WIDTH, height: HEIGHT, layers: WAVELENGTHS, format: 'R32F'},
			ordering: 'Native15 layer major; near-ground-extended altitude row; W39 direction fastest',
			positionDomain: result.positionDomain,
			payload: payloadPath,
			validity: validityPath,
			invalidPolicy: 'zero payload and validity byte 0',
			compatibilityFamily: 'san-jose-actual-point-n4-native48-solver-near-ground-55-page-z180-f68-w39-native15-v1',
			derivation: {
				controlRun: CONTROL_RUN,
				operation: 'unchanged solve and solar-noon scene with seven additional page projection altitude nodes',
			},
			payloadSha256: await sha256File(path.join(run.runDirectory, ...payloadPath.split('/'))),
			validitySha256: await sha256File(path.join(run.runDirectory, ...validityPath.split('/'))),
		};
		await run.writeJsonArtifact('cache/page-manifest.json', pageManifest);
		const assertions = [];
		const check = (value, message) => {
			requireCondition(value, message);
			assertions.push(message);
		};
		check(result.positionDomain.count === HEIGHT && result.page.height === HEIGHT,
			'The durable page uses all 55 declared altitude rows.');
		check([1.7, 10, 50, 100, 250, 500, 1000].every((node) =>
			result.positionDomain.insertedAltitudesMeters.includes(node)),
			'The page includes every declared near-ground altitude node.');
		check(result.invariants.solverPositionDomain === 'algorithm32-native-48-position-v2',
			'The N4 solver remains on the unchanged Native48 altitude domain.');
		check(result.wavelengthResults.length === WAVELENGTHS &&
			result.wavelengthResults.every((item) => item.compiledPage.finite &&
				item.compiledPage.nonnegative && item.compiledPage.positionCount === HEIGHT),
			'Every Native15 layer projects finite nonnegative values over 55 page rows.');
		check(result.wavelengthResults.every((item) => item.finalLiveFieldBytes === 0),
			'Every wavelength releases all tracked solver fields.');
		check(result.page.logicalBytes === PAGE_BYTES && result.page.validCount > 0 &&
			result.page.invalidCount > 0,
			'The independently loadable page has exact bytes and explicit valid/invalid states.');
		check(result.rendered.image.width === 640 && result.rendered.image.height === 400 &&
			result.rendered.webglErrors.length === 0,
			'The requested solar-noon image is preserved without WebGL errors.');
		check(result.gpu.api.includes('WebGL 2') && !/swiftshader|software/iu.test(result.gpu.renderer),
			'The solve and render use real WebGL2.');
		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [RUNNER, `${LANE}/gpu/runSolarNoonNearGroundBrowser.js`],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs',
				'node:fs/promises', 'node:http', 'node:module', 'node:os', 'node:path',
				'node:url', 'node:util'],
		});
		const [afterAlgorithm32, afterFlat32] = await Promise.all([
			createFileInventory(PRODUCTION_SOURCE_ROOT),
			createFileInventory(FLAT32_ROOT),
		]);
		assertFileInventoriesEqual(beforeAlgorithm32, afterAlgorithm32,
			'Algorithm32 production inventory');
		assertFileInventoriesEqual(beforeFlat32, afterFlat32, 'Flat32 production inventory');
		check(closure.files.length > 0,
			'The near-ground diagnostic is contained and production remains unchanged.');
		const evidence = {
			schemaId: 'san-jose-solar-noon-near-ground-page-evidence-v1',
			accepted: true,
			claimBoundary: 'causal visual diagnostic only; no physical-accuracy, convergence, or production claim',
			assertions,
			result,
			pageManifest,
			control: {run: CONTROL_RUN, artifact: 'captures/solar-noon.png', sha256: controlImageSha256},
			render: {path: renderPath, bytes: render.length,
				sha256: await sha256File(path.join(run.runDirectory, ...renderPath.split('/')))},
			containment: {closureFileCount: closure.files.length,
				algorithm32AggregateSha256: afterAlgorithm32.aggregateSha256,
				flat32AggregateSha256: afterFlat32.aggregateSha256},
		};
		await run.writeJsonArtifact('evidence/solar-noon-near-ground-page.json', evidence);
		const terminal = await run.finalize({
			conclusion: 'accepted',
			result: {accepted: true, assertionCount: assertions.length,
				pageBytes: PAGE_BYTES, renderCount: 1},
			report: `# ${run.runId}: solar-noon near-ground scene page\n\nConclusion: **accepted diagnostic execution**.\n\n- One ${PAGE_BYTES}-byte Native15 W39 page with 55 altitude rows.\n- One 640 x 400 solar-noon render preserved regardless of appearance.\n- Native48 N4 solver and all non-page variables remain fixed.\n`,
		});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted',
			artifactSetSha256: terminal.artifactSetSha256, assertionCount: assertions.length,
			pageBytes: PAGE_BYTES}, null, 2)}\n`);
	} catch (error) {
		const serialized = {name: error instanceof Error ? error.name : 'Error',
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined};
		try {
			await run.writeJsonArtifact('evidence/failure.json', serialized);
			const terminal = await run.finalize({conclusion: 'failed',
				result: {accepted: false, error: serialized},
				report: `# ${run.runId}: solar-noon near-ground scene page\n\nConclusion: **failed**.\n\n${serialized.message}\n`});
			process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed',
				artifactSetSha256: terminal.artifactSetSha256, error: serialized}, null, 2)}\n`);
		} catch {}
		process.exitCode = 1;
	} finally {
		await server?.close().catch(() => {});
		if (profile) await rm(profile, {recursive: true, force: true}).catch(() => {});
	}
}

await main();
