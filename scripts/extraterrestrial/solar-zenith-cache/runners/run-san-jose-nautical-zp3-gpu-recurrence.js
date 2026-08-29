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

const COMMAND = 'node scripts/extraterrestrial/solar-zenith-cache/runners/'
	+ 'run-san-jose-nautical-zp3-gpu-recurrence.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFileAsync = promisify(executeFile);
const RUNNER_RELATIVE_PATH =
	'solar-zenith-cache/runners/run-san-jose-nautical-zp3-gpu-recurrence.js';
const LANE_ROOT_RELATIVE_PATH =
	'solar-zenith-cache/san-jose-nautical-cache-poc';
const LANE_ROOT = path.join(EXPERIMENT_ROOT, LANE_ROOT_RELATIVE_PATH);
const PARENT_POLICY_PATH = path.join(
	EXPERIMENT_ROOT,
	'solar-zenith-cache',
	'containment-policy.json',
);
const POC_POLICY_PATH = path.join(LANE_ROOT, 'containment-policy.json');
const LANE_CONTRACT_PATH = path.join(LANE_ROOT, 'lane-contract.json');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function contentType(target) {
	if (target.endsWith('.js')) return 'text/javascript; charset=utf-8';
	if (target.endsWith('.json')) return 'application/json; charset=utf-8';
	if (target.endsWith('.html')) return 'text/html; charset=utf-8';
	return 'application/octet-stream';
}

async function serve(run) {
	const progress = [];
	const requests = [];
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/lane/', LANE_ROOT],
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
			if (!route || pathname.includes('..')) throw new Error('Unsupported ZP3 path.');
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) {
				throw new Error('ZP3 served path escapes its root.');
			}
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) {
				throw new Error('ZP3 served target is not a real file.');
			}
			const canonicalRoot = await realpath(root);
			const canonicalTarget = await realpath(target);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) {
				throw new Error('ZP3 served real path escapes its root.');
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

function allProbeValues(result) {
	return result.projectionExposures.flatMap((exposure) =>
		exposure.values.map((probe) => probe.value));
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'san-jose-nautical-zp3-gpu-recurrence',
		command: COMMAND,
		inputs: {
			schemaId: 'san-jose-nautical-zp3-gpu-recurrence-input-v1',
			workPackage: 'ZP3',
			wavelengthIndex: 7,
			wavelengthNanometers: 595,
			fieldDomains: {position: 48, solarZenith: 180, incoming: 68, outgoing: 9126},
			claimBoundary:
				'one complete Native15 wavelength through actual-point GPU J1/L1/J2/L2/J3/L3/J4 recurrence and pure-order resource flow; no multi-wavelength page, cache payload, render, accuracy, convergence, Bruneton, or production claim',
		},
		provenance: {
			schemaId: 'san-jose-nautical-zp3-gpu-recurrence-provenance-v1',
			operation:
				'execute complete 595-nm R32F actual-point recurrence over Native48 x Z180 x W39/F68 using event-split spherical transport; expose selected GPU readbacks for each pure J order and release fields after last use',
			implementationRoot:
				'scripts/extraterrestrial/solar-zenith-cache/san-jose-nautical-cache-poc',
			runner: `scripts/extraterrestrial/${RUNNER_RELATIVE_PATH}`,
		},
		environment: {
			schemaId: 'san-jose-nautical-zp3-gpu-recurrence-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: CHROME_PATH,
			angleBackend: 'd3d11',
		},
		references: {
			schemaId: 'san-jose-nautical-zp3-gpu-recurrence-references-v1',
			zp2Run: '000506-san-jose-nautical-zp2-geometry-addressing',
			pocPlan:
				'agents/topics/algorithm32/cache/solar-zenith-cache-poc-plan.md',
			laneContract:
				'scripts/extraterrestrial/solar-zenith-cache/san-jose-nautical-cache-poc/lane-contract.json',
		},
	});
	let server;
	let browserProfilePath;
	try {
		await assertRepositoryIdentity();
		await Promise.all([
			lstat(CHROME_PATH),
			assertExistingRealPathContained(
				EXPERIMENT_ROOT,
				CONTAINMENT_POLICY_PATH,
				'shared containment policy',
			),
			assertExistingRealPathContained(
				EXPERIMENT_ROOT,
				PARENT_POLICY_PATH,
				'solar-zenith containment policy',
			),
			assertExistingRealPathContained(
				EXPERIMENT_ROOT,
				POC_POLICY_PATH,
				'POC containment policy',
			),
			assertExistingRealPathContained(
				EXPERIMENT_ROOT,
				LANE_CONTRACT_PATH,
				'POC lane contract',
			),
			assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source/control tree'),
		]);
		const [
			parentPolicyText,
			pocPolicyText,
			laneContractText,
			algorithm32Before,
			flat32Before,
		] = await Promise.all([
			readFile(PARENT_POLICY_PATH, 'utf8'),
			readFile(POC_POLICY_PATH, 'utf8'),
			readFile(LANE_CONTRACT_PATH, 'utf8'),
			createFileInventory(PRODUCTION_SOURCE_ROOT),
			createFileInventory(FLAT32_ROOT),
		]);
		const parentPolicy = JSON.parse(parentPolicyText);
		const pocPolicy = JSON.parse(pocPolicyText);
		const laneContract = JSON.parse(laneContractText);
		requireCondition(
			parentPolicy.policyId
				=== 'algorithm32-solar-zenith-cache-contained-lane-v1'
			&& pocPolicy.policyId
				=== 'algorithm32-san-jose-nautical-actual-point-cache-poc-contained-lane-v1'
			&& pocPolicy.productionComparisonAccess === 'read-only'
			&& pocPolicy.unitTestTree === 'prohibited'
			&& laneContract.physicalModel.actualPointTransport
				=== 'required through J1-J4',
			'ZP3 containment or actual-point recurrence contract changed.',
		);
		await run.writeArtifact(
			'browser/index.html',
			'<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="module">window.zp3Progress=(stage)=>fetch("/progress?stage="+encodeURIComponent(stage));const target=document.querySelector("#result");try{const {runZp3GpuRecurrenceBrowser}=await import("/lane/gpu/runZp3GpuRecurrenceBrowser.js");target.textContent=JSON.stringify(await runZp3GpuRecurrenceBrowser());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>',
		);
		server = await serve(run);
		browserProfilePath = assertLexicallyContained(
			OUTPUT_ROOT,
			path.join(OUTPUT_ROOT, 'browser-profiles', run.runId),
			'ZP3 Chrome profile',
		);
		await mkdir(browserProfilePath, {recursive: true});
		let browser;
		try {
			browser = await executeFileAsync(CHROME_PATH, [
				'--headless=new',
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--use-angle=d3d11',
				'--disable-software-rasterizer',
				'--disable-breakpad',
				'--disable-crash-reporter',
				'--disable-component-update',
				'--disable-background-networking',
				'--disable-gpu-shader-disk-cache',
				'--no-first-run',
				`--user-data-dir=${browserProfilePath}`,
				'--virtual-time-budget=7200000',
				'--dump-dom',
				server.url,
			], {
				timeout: 7500000,
				maxBuffer: 16 * 1024 * 1024,
				windowsHide: true,
			});
		} catch (error) {
			await run.writeArtifact('browser/dom-on-failure.html', error.stdout ?? '');
			await run.writeArtifact('browser/stderr-on-failure.txt', error.stderr ?? '');
			await run.writeJsonArtifact('browser/progress-on-failure.json', server.progress);
			await run.writeJsonArtifact('browser/requests-on-failure.json', server.requests);
			throw error;
		} finally {
			await rm(browserProfilePath, {recursive: true, force: true});
			browserProfilePath = null;
		}
		await run.writeArtifact('browser/dom.html', browser.stdout);
		await run.writeArtifact('browser/stderr.txt', browser.stderr);
		await run.writeJsonArtifact('browser/progress.json', server.progress);
		await run.writeJsonArtifact('browser/requests.json', server.requests);
		const resultText = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browser.stdout)?.[1];
		requireCondition(resultText, 'Headless browser emitted no ZP3 result.');
		const result = JSON.parse(resultText);
		if (result.error) {
			throw new Error(`Browser ZP3 failed: ${result.error.name}: ${result.error.message}\n${result.error.stack ?? ''}`);
		}
		const assertions = [];
		const check = (condition, message) => {
			requireCondition(condition, message);
			assertions.push(message);
		};
		check(
			result.gpu.api.includes('WebGL 2')
			&& !/swiftshader|software/iu.test(result.gpu.renderer)
			&& /nvidia|rtx 2060/iu.test(`${result.gpu.vendor} ${result.gpu.renderer}`),
			'ZP3 executed in real WebGL2 on the measured NVIDIA hardware rather than SwiftShader.',
		);
		check(
			result.wavelength.index === 7
			&& result.wavelength.centerNanometers === 595
			&& result.wavelength.ozoneCrossSectionSquareMeters > 0,
			'One exact Native15 595-nm channel executes with retained ozone absorption.',
		);
		check(
			result.fieldLayout.widthJ === 9126
			&& result.fieldLayout.widthL === 68
			&& result.fieldLayout.height === 8640
			&& result.fieldLayout.scalarBytes === 4,
			'GPU fields cover the complete W39/F68 x Native48 x Z180 one-wavelength domains in R32F.',
		);
		check(
			result.projectionExposures.map((exposure) => exposure.order).join(',')
				=== 'J1,J2,J3,J4'
			&& result.projectionExposures.every((exposure) => exposure.values.length === 3),
			'Every pure J order is exposed independently to the future projection boundary.',
		);
		const values = allProbeValues(result);
		check(
			values.every((value) => Number.isFinite(value) && value >= 0)
			&& result.projectionExposures.every((exposure) =>
				exposure.values.some((probe) => probe.value > 0)),
			'Selected GPU readbacks are finite and nonnegative with a positive value in every pure J order.',
		);
		const passes = result.ledger.filter((entry) => entry.operation === 'pass');
		check(
			passes.map((pass) => pass.id).join(',')
				=== 'direct-base,J1,L1,J2,L2,J3,L3,J4'
			&& passes.find((pass) => pass.id === 'J2').inputFields.includes('L1')
			&& passes.find((pass) => pass.id === 'L2').inputFields.includes('J2')
			&& passes.find((pass) => pass.id === 'J3').inputFields.includes('L2')
			&& passes.find((pass) => pass.id === 'L3').inputFields.includes('J3')
			&& passes.find((pass) => pass.id === 'J4').inputFields.includes('L3'),
			'Pass graph preserves the pure preceding-order J/L recurrence through J4.',
		);
		check(
			passes.every((pass) =>
				!pass.inputFields.some((id) => /through|cumulative/iu.test(id)))
			&& !result.ledger.some((entry) => /through|cumulative/iu.test(entry.id ?? '')),
			'No cumulative field is allocated or fed back into recurrence.',
		);
		const releases = result.ledger.filter((entry) => entry.operation === 'release');
		check(
			result.finalLiveFieldBytes === 0
			&& releases.length === 8
			&& releases.every((entry) => entry.isTextureAfterDelete === false)
			&& result.peakLiveFieldBytes === 320094720,
			'All eight working fields release after last use and peak live field storage matches one J plus two L fields.',
		);
		check(
			result.timings.length === 8
			&& result.timings.every((timing) =>
				Number.isFinite(timing.milliseconds) && timing.milliseconds > 0),
			'Every GPU pass reports a finite positive completion time.',
		);

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [
				RUNNER_RELATIVE_PATH,
				`${LANE_ROOT_RELATIVE_PATH}/gpu/runZp3GpuRecurrenceBrowser.js`,
			],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: [
				'node:child_process',
				'node:crypto',
				'node:fs',
				'node:fs/promises',
				'node:http',
				'node:module',
				'node:os',
				'node:path',
				'node:url',
				'node:util',
			],
		});
		const [algorithm32After, flat32After] = await Promise.all([
			createFileInventory(PRODUCTION_SOURCE_ROOT),
			createFileInventory(FLAT32_ROOT),
		]);
		assertFileInventoriesEqual(
			algorithm32Before,
			algorithm32After,
			'Algorithm32 production inventory',
		);
		assertFileInventoriesEqual(flat32Before, flat32After, 'Flat32 production inventory');
		check(
			closure.files.length > 0
			&& algorithm32Before.aggregateSha256 === algorithm32After.aggregateSha256
			&& flat32Before.aggregateSha256 === flat32After.aggregateSha256,
			'ZP3 module closure is contained and production inventories remain byte-identical.',
		);
		const evidence = {
			schemaId: 'san-jose-nautical-zp3-gpu-recurrence-evidence-v1',
			workPackage: 'ZP3',
			accepted: true,
			claimBoundary:
				'one complete 595-nm actual-point GPU recurrence and lifecycle only; no cache page or appearance claim',
			assertions,
			result,
			identities: {
				parentPolicySha256: await sha256File(PARENT_POLICY_PATH),
				pocPolicySha256: await sha256File(POC_POLICY_PATH),
				laneContractSha256: await sha256File(LANE_CONTRACT_PATH),
				algorithm32AggregateSha256: algorithm32After.aggregateSha256,
				flat32AggregateSha256: flat32After.aggregateSha256,
			},
			containment: {
				closureFileCount: closure.files.length,
				closureEdgeCount: closure.edges.length,
			},
		};
		await run.writeJsonArtifact('evidence/zp3-gpu-recurrence.json', evidence);
		const terminalManifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				workPackage: 'ZP3',
				accepted: true,
				assertionCount: assertions.length,
				wavelengthNanometers: result.wavelength.centerNanometers,
				peakLiveFieldBytes: result.peakLiveFieldBytes,
				passTimingsMilliseconds: Object.fromEntries(
					result.timings.map((timing) => [timing.id, timing.milliseconds]),
				),
			},
			report: `# ${run.runId}: Solar-zenith cache POC ZP3\n\n`
				+ 'Conclusion: **accepted**.\n\n'
				+ `- Assertions: ${assertions.length}/${assertions.length}.\n`
				+ `- Wavelength: ${result.wavelength.centerNanometers} nm.\n`
				+ `- J layout: ${result.fieldLayout.widthJ} x ${result.fieldLayout.height} R32F.\n`
				+ `- Peak live field bytes: ${result.peakLiveFieldBytes}.\n`
				+ '- Claim: complete one-wavelength GPU pure-order recurrence only; no cache page or render.\n',
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion: 'accepted',
			artifactSetSha256: terminalManifest.artifactSetSha256,
			assertionCount: assertions.length,
		}, null, 2)}\n`);
	} catch (error) {
		const serialized = {
			name: error instanceof Error ? error.name : 'Error',
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		};
		try {
			await run.writeJsonArtifact('evidence/failure.json', serialized);
			const terminalManifest = await run.finalize({
				conclusion: 'failed',
				result: {workPackage: 'ZP3', accepted: false, error: serialized},
				report: `# ${run.runId}: Solar-zenith cache POC ZP3\n\n`
					+ `Conclusion: **failed**.\n\n${serialized.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'failed',
				artifactSetSha256: terminalManifest.artifactSetSha256,
				error: serialized,
			}, null, 2)}\n`);
		} catch (finalizationError) {
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'partial-unfinalized',
				error: serialized,
				finalizationError: finalizationError instanceof Error
					? finalizationError.message
					: String(finalizationError),
			}, null, 2)}\n`);
		}
		process.exitCode = 1;
	} finally {
		await server?.close().catch(() => {});
		if (browserProfilePath) {
			await rm(browserProfilePath, {recursive: true, force: true}).catch(() => {});
		}
	}
}

await main();

