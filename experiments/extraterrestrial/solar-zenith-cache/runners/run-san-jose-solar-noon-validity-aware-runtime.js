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
const COMMAND = 'node experiments/extraterrestrial/solar-zenith-cache/runners/run-san-jose-solar-noon-validity-aware-runtime.js';
const RUNNER = 'solar-zenith-cache/runners/run-san-jose-solar-noon-validity-aware-runtime.js';
const LANE = 'solar-zenith-cache/san-jose-nautical-cache-poc';
const LANE_ROOT = path.join(EXPERIMENT_ROOT, LANE);
const POC_POLICY = path.join(LANE_ROOT, 'containment-policy.json');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const CONTROL_RUN = '000511-san-jose-five-scene-actual-point-scattering';
const CONTROL_ROOT = path.join(OUTPUT_ROOT, 'runs', CONTROL_RUN);
const CONTROL_PAGE = path.join(CONTROL_ROOT, 'cache', 'solar-noon-native15-c4-page-v1.f32');
const CONTROL_VALIDITY = path.join(CONTROL_ROOT, 'cache', 'solar-noon-native15-c4-page-v1-validity.u8');
const CONTROL_RENDER = path.join(CONTROL_ROOT, 'captures', 'solar-noon.png');
const RENDER_IDS = ['control-unmasked', 'candidate-validity-aware'];

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function contentType(target) {
	if (target.endsWith('.js')) return 'text/javascript; charset=utf-8';
	if (target.endsWith('.html')) return 'text/html; charset=utf-8';
	return 'application/octet-stream';
}

async function requestBody(request, limit) {
	const chunks = [];
	let length = 0;
	for await (const chunk of request) {
		length += chunk.length;
		if (length > limit) throw new Error('Validity-aware render upload exceeds limit.');
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}

async function serve(run) {
	const renders = new Map();
	const requests = [];
	const exactControls = new Map([
		['/control/page.f32', CONTROL_PAGE],
		['/control/validity.u8', CONTROL_VALIDITY],
	]);
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/lane/', LANE_ROOT],
	]);
	const server = createServer(async (request, response) => {
		try {
			const url = new URL(request.url, 'http://127.0.0.1');
			const pathname = decodeURIComponent(url.pathname);
			requests.push(`${request.method} ${pathname}`);
			if (request.method === 'POST' && pathname.startsWith('/artifact/render/')) {
				const id = pathname.split('/').at(-1);
				requireCondition(RENDER_IDS.includes(id) && !renders.has(id),
					'Invalid or duplicate validity-aware render.');
				renders.set(id, await requestBody(request, 8 * 1024 * 1024));
				response.writeHead(204);
				response.end();
				return;
			}
			if (exactControls.has(pathname)) {
				response.writeHead(200, {'content-type': 'application/octet-stream'});
				response.end(await readFile(exactControls.get(pathname)));
				return;
			}
			const route = [...roots.entries()].find(([prefix]) => pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) throw new Error('Unsupported runtime path.');
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) {
				throw new Error('Runtime path escapes its root.');
			}
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) {
				throw new Error('Runtime target is not a real file.');
			}
			const canonicalRoot = await realpath(root);
			const canonicalTarget = await realpath(target);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) {
				throw new Error('Runtime real path escapes its root.');
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
		renders,
		requests,
		close: () => new Promise((resolve, reject) => server.close((error) =>
			error ? reject(error) : resolve())),
	};
}

async function main() {
	const [pageSha256, validitySha256, controlRenderSha256] = await Promise.all([
		sha256File(CONTROL_PAGE),
		sha256File(CONTROL_VALIDITY),
		sha256File(CONTROL_RENDER),
	]);
	const run = await initializeRunRecord({
		slug: 'san-jose-solar-noon-validity-aware-runtime',
		command: COMMAND,
		inputs: {
			schemaId: 'san-jose-solar-noon-validity-aware-runtime-input-v1',
			scene: 'solar-noon',
			positionDomain: 'Native48',
			controlPageBytes: 26_282_880,
			validityBytes: 438_048,
			renderBothControlAndCandidate: true,
		},
		provenance: {
			schemaId: 'san-jose-solar-noon-validity-aware-runtime-provenance-v1',
			operation: 'render the exact sealed Native48 solar-noon page first with unconditional interpolation and then with Geometry-derived validity masking and weight renormalization',
			runner: `experiments/extraterrestrial/${RUNNER}`,
			implementationRoot: `experiments/extraterrestrial/${LANE}`,
			parents: {
				page: {run: CONTROL_RUN, artifact: 'cache/solar-noon-native15-c4-page-v1.f32', sha256: pageSha256},
				validity: {run: CONTROL_RUN, artifact: 'cache/solar-noon-native15-c4-page-v1-validity.u8', sha256: validitySha256},
				controlRender: {run: CONTROL_RUN, artifact: 'captures/solar-noon.png', sha256: controlRenderSha256},
			},
		},
		environment: {node: process.version, platform: process.platform,
			architecture: process.arch, chromePath: CHROME_PATH, angleBackend: 'd3d11'},
		references: {controlRun: CONTROL_RUN, nearGroundRun: '000513-san-jose-solar-noon-near-ground-page'},
	});
	let server;
	let profile;
	try {
		await assertRepositoryIdentity();
		await Promise.all([
			lstat(CHROME_PATH),
			assertExistingRealPathContained(OUTPUT_ROOT, CONTROL_PAGE, 'control page'),
			assertExistingRealPathContained(OUTPUT_ROOT, CONTROL_VALIDITY, 'control validity'),
			assertExistingRealPathContained(OUTPUT_ROOT, CONTROL_RENDER, 'control render'),
			assertExistingRealPathContained(EXPERIMENT_ROOT, CONTAINMENT_POLICY_PATH, 'shared policy'),
			assertExistingRealPathContained(EXPERIMENT_ROOT, POC_POLICY, 'POC policy'),
			assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source tree'),
		]);
		const [beforeAlgorithm32, beforeFlat32] = await Promise.all([
			createFileInventory(PRODUCTION_SOURCE_ROOT),
			createFileInventory(FLAT32_ROOT),
		]);
		await run.writeArtifact('browser/index.html', '<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="module">const target=document.querySelector("#result");try{const {runSolarNoonValidityAwareBrowser}=await import("/lane/runtime/runSolarNoonValidityAwareBrowser.js");target.textContent=JSON.stringify(await runSolarNoonValidityAwareBrowser());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>');
		server = await serve(run);
		profile = assertLexicallyContained(OUTPUT_ROOT,
			path.join(OUTPUT_ROOT, 'browser-profiles', run.runId), 'Validity-aware Chrome profile');
		await mkdir(profile, {recursive: true});
		let browser;
		try {
			browser = await executeFileAsync(CHROME_PATH, [
				'--headless=new', '--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist',
				'--use-angle=d3d11', '--disable-software-rasterizer', '--disable-breakpad',
				'--disable-crash-reporter', '--disable-component-update',
				'--disable-background-networking', '--disable-gpu-shader-disk-cache',
				'--no-first-run', `--user-data-dir=${profile}`,
				'--virtual-time-budget=120000', '--dump-dom', server.url,
			], {timeout: 180000, maxBuffer: 16 * 1024 * 1024, windowsHide: true});
		} catch (error) {
			await run.writeArtifact('browser/dom-on-failure.html', error.stdout ?? '');
			await run.writeArtifact('browser/stderr-on-failure.txt', error.stderr ?? '');
			throw error;
		} finally {
			await rm(profile, {recursive: true, force: true});
			profile = null;
		}
		await run.writeArtifact('browser/dom.html', browser.stdout);
		await run.writeArtifact('browser/stderr.txt', browser.stderr);
		await run.writeJsonArtifact('browser/requests.json', server.requests);
		const resultText = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout)?.[1];
		requireCondition(resultText, 'Browser emitted no validity-aware result.');
		const result = JSON.parse(resultText);
		if (result.error) throw new Error(`${result.error.name}: ${result.error.message}\n${result.error.stack ?? ''}`);
		requireCondition(server.renders.size === 2, 'Both requested renders were not uploaded.');
		for (const id of RENDER_IDS) {
			await run.writeArtifact(`captures/${id}.png`, server.renders.get(id));
		}
		const controlOutputSha256 = await sha256File(
			path.join(run.runDirectory, 'captures', 'control-unmasked.png'));
		const candidateSha256 = await sha256File(
			path.join(run.runDirectory, 'captures', 'candidate-validity-aware.png'));
		const assertions = [];
		const check = (value, message) => {
			requireCondition(value, message);
			assertions.push(message);
		};
		check(result.page.positionDomainId === 'algorithm32-native-48-position-v2' &&
			result.page.positionCount === 48,
			'The experiment uses the original Native48 page with no added altitude rows.');
		check(result.page.pageBytes === 26_282_880 && result.page.validityBytes === 438_048,
			'The sealed control page and its complete validity mask have exact sizes.');
		check(result.page.validCount > 0 && result.page.invalidCount > 0,
			'The mask retains both valid and invalid geometric page states.');
		check(result.control.validityAwareInterpolation === false &&
			result.candidate.validityAwareInterpolation === true,
			'Only the candidate enables validity-aware interpolation.');
		check(result.control.webglErrors.length === 0 && result.candidate.webglErrors.length === 0,
			'Both requested images render without WebGL errors.');
		check(result.control.image.width === 640 && result.control.image.height === 400 &&
			result.candidate.image.width === 640 && result.candidate.image.height === 400,
			'Both control and candidate preserve the requested 640 by 400 image shape.');
		check(candidateSha256 !== controlOutputSha256,
			'The validity-aware lookup materially changes the rendered image.');
		check(result.gpu.api.includes('WebGL 2') && !/swiftshader|software/iu.test(result.gpu.renderer),
			'Both renders use real WebGL2.');
		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [RUNNER, `${LANE}/runtime/runSolarNoonValidityAwareBrowser.js`],
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
			'The runtime experiment is contained and production remains unchanged.');
		const renderRecords = Object.fromEntries(await Promise.all(RENDER_IDS.map(async (id) =>
			[id, {path: `captures/${id}.png`, bytes: server.renders.get(id).length,
				sha256: await sha256File(path.join(run.runDirectory, 'captures', `${id}.png`))}])));
		await run.writeJsonArtifact('evidence/validity-aware-runtime.json', {
			schemaId: 'san-jose-solar-noon-validity-aware-runtime-evidence-v1',
			accepted: true,
			claimBoundary: 'isolated runtime interpolation diagnostic; no physical-accuracy or final-layout claim',
			assertions,
			result,
			parents: {pageSha256, validitySha256, controlRenderSha256},
			renders: renderRecords,
			containment: {closureFileCount: closure.files.length,
				algorithm32AggregateSha256: afterAlgorithm32.aggregateSha256,
				flat32AggregateSha256: afterFlat32.aggregateSha256},
		});
		const terminal = await run.finalize({
			conclusion: 'accepted',
			result: {accepted: true, assertionCount: assertions.length, renderCount: 2},
			report: `# ${run.runId}: Native48 solar-noon validity-aware runtime\n\nConclusion: **accepted diagnostic execution**.\n\n- Reuses run 000511's sealed Native48 page and validity mask.\n- Preserves unmasked control and validity-aware candidate images.\n- Only invalid-tap exclusion and surviving-weight renormalization change.\n`,
		});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted',
			artifactSetSha256: terminal.artifactSetSha256,
			assertionCount: assertions.length}, null, 2)}\n`);
	} catch (error) {
		const serialized = {name: error instanceof Error ? error.name : 'Error',
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined};
		try {
			await run.writeJsonArtifact('evidence/failure.json', serialized);
			const terminal = await run.finalize({conclusion: 'failed',
				result: {accepted: false, error: serialized},
				report: `# ${run.runId}: Native48 solar-noon validity-aware runtime\n\nConclusion: **failed**.\n\n${serialized.message}\n`});
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
