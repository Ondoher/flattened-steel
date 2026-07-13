#!/usr/bin/env node

import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';

import puppeteer from 'puppeteer';

import {sha256File} from '../harness/lib/atomic-files.js';
import {
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../harness/lib/containment.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_ROOT,
	OUTPUT_ROOT,
	RUNS_ROOT,
	assertLexicallyContained,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';

const COMMAND =
	'node scripts/extraterrestrial/runners/render-nautical-twilight-ozone-w39.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREEN_PALETTE_ROOT = path.join(
	EXPERIMENT_ROOT,
	'stellar-screen-palette',
);
const CANDIDATE_ROOT = path.join(EXPERIMENT_ROOT, 'candidate');
const ATMOSPHERES_ROOT = path.join(EXPERIMENT_ROOT, 'atmospheres');
const OZONE_ROOT = path.join(EXPERIMENT_ROOT, 'ozone');
const FIXTURES_ROOT = path.join(EXPERIMENT_ROOT, 'fixtures');
const PARENT = Object.freeze({
	runId: '000466-bruneton-source-luminance-lift-spherical-comparison',
	artifactSetSha256:
		'62f912ac0fdbfac432b58e3c094a76a3a792f6afbda12de2ee6af7a5fddbd250',
});
const PARENT_ARTIFACTS = Object.freeze({
	config: Object.freeze({
		path: 'browser/config.json',
		byteLength: 10335,
		sha256:
			'fd7d6772644ea810a7c331e92e85e53495cdf7ea9e252df8ee9eb466a21d54d7',
	}),
	matrix: Object.freeze({
		path: 'browser/sunset-plus-one-hour-matrix.u16',
		byteLength: 512000,
		sha256:
			'e6d8296b3f12bc9bf5868369eadd8d84d12c1055c3d70b7cf3e98974bad3ebf9',
	}),
	palette: Object.freeze({
		path: 'browser/sunset-plus-one-hour-palette.f32',
		byteLength: 2640,
		sha256:
			'dcb3bd4923503da3259904bdacecf451dd3a3c1ed3c1dd991f78675f8630a6c9',
	}),
});
const SCENE_ID = 'sunset-plus-one-hour';
const SCENE_TIME_ISO = '2024-06-21T04:26:03.503Z';
const OUTGOING = Object.freeze({
	baselineFaceWidth: 27,
	baselineDirectionCount: 4374,
	previewFaceWidth: 39,
	previewDirectionCount: 9126,
	directionCountRatio: 9126 / 4374,
});

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
	if (target.endsWith('.png')) return 'image/png';
	return 'application/octet-stream';
}

async function serve(run) {
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/screen-palette/', SCREEN_PALETTE_ROOT],
		['/candidate/', CANDIDATE_ROOT],
		['/atmospheres/', ATMOSPHERES_ROOT],
		['/ozone/', OZONE_ROOT],
		['/fixtures/', FIXTURES_ROOT],
		['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT],
	]);
	const requests = [];
	const server = createServer(async (request, response) => {
		try {
			const pathname = decodeURIComponent(
				new URL(request.url, 'http://127.0.0.1').pathname,
			);
			requests.push(pathname);
			const route = [...roots].find(([prefix]) =>
				pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) {
				throw new Error('Unsupported browser path.');
			}
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			const resolvedRoot = path.resolve(root);
			if (!target.startsWith(`${resolvedRoot}${path.sep}`)) {
				throw new Error('Browser path escaped its root.');
			}
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) {
				throw new Error('Browser target is not a real file.');
			}
			const [canonicalRoot, canonicalTarget] = await Promise.all([
				realpath(root),
				realpath(target),
			]);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) {
				throw new Error('Browser real path escaped its root.');
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
		requests,
		close: () => new Promise((resolve, reject) =>
			server.close((error) => error ? reject(error) : resolve())),
	};
}

async function verifyParentArtifact(parentRoot, manifest, expected) {
	const record = manifest.artifacts.find(
		(artifact) => artifact.path === expected.path,
	);
	requireCondition(record, `Parent lacks ${expected.path}.`);
	requireCondition(
		record.byteLength === expected.byteLength
			&& record.sha256 === expected.sha256,
		`Parent manifest identity changed for ${expected.path}.`,
	);
	const artifactPath = path.join(parentRoot, ...expected.path.split('/'));
	const [info, sha256] = await Promise.all([
		lstat(artifactPath),
		sha256File(artifactPath),
	]);
	requireCondition(
		info.isFile() && !info.isSymbolicLink()
			&& info.size === expected.byteLength
			&& sha256 === expected.sha256,
		`Parent bytes changed for ${expected.path}.`,
	);
	return artifactPath;
}

function report(runId, evidence) {
	const spectral = evidence.skyPathRadianceSpectra;
	return [
		`# ${runId}: San Jose nautical twilight, ozone + F68 + W39 preview`,
		'',
		'Conclusion: **completed diagnostic render**.',
		'',
		'This run intentionally has no appearance acceptance gates and no Bruneton side-by-side.',
		'',
		`- Scene: ${evidence.scene.id}, ${evidence.scene.timeIso}`,
		`- Sun elevation: ${evidence.scene.sunElevationDegrees} degrees`,
		`- Ozone absorption: enabled (${evidence.configuration.ozoneIdentity?.id ?? 'contained Bruneton 300 DU'})`,
		`- Outgoing cache: W${evidence.configuration.outgoingFaceWidth}, ${evidence.configuration.outgoingDirectionCount} stored directions (${evidence.configuration.outgoingDirectionCountRatio.toFixed(6)}x W27)`,
		`- Incoming quadrature: ${evidence.configuration.incomingDirectionCount} directions (reflection-completed F68)`,
		`- Raw sky spectra: ${spectral.summary.sampleCount} Native-15 probes, including ${spectral.summary.horizonSampleCount} at 0-2 degrees elevation`,
		`- Positive shortwave sky spectra: ${spectral.summary.positiveBlueSpectrumCount}/${spectral.summary.sampleCount}; horizon ${spectral.summary.horizon.positiveBlueSpectrumCount}/${spectral.summary.horizonSampleCount}`,
		`- Positive signed linear-sRGB blue: ${spectral.summary.positiveSignedLinearBlueCount}/${spectral.summary.sampleCount}; horizon ${spectral.summary.horizon.positiveSignedLinearBlueCount}/${spectral.summary.horizonSampleCount}`,
		`- Capture: ${evidence.capture.path}`,
		'- Spectral ledger: evidence/sky-path-radiance-spectra.json',
		'',
		'Production and run 000466 remain unchanged.',
		'',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) {
		throw new Error('The nautical-twilight preview accepts no arguments.');
	}
	const run = await initializeRunRecord({
		slug: 'san-jose-nautical-twilight-ozone-f68-w39-preview',
		command: COMMAND,
		inputs: {
			schemaId: 'san-jose-nautical-twilight-ozone-f68-w39-input-v1',
			parent: PARENT,
			parentArtifacts: PARENT_ARTIFACTS,
			scene: {
				id: SCENE_ID,
				timeIso: SCENE_TIME_ISO,
				meaning: 'one hour after stored San Jose sunset',
			},
			atmosphere: 'contained Bruneton 300 DU ozone absorption enabled',
			outgoingDirections: OUTGOING,
			incomingDirectionCount: 68,
			incomingDirectionPolicy:
				'contained-reflection-completed-ordinary-fibonacci-68-control-v1',
			maximumScatteringOrder: 4,
			viewport: [640, 400],
			skySpectralProbe: {
				quantity:
					'diffuse state.pathRadiance before celestial composition and Color',
				spectralChannelCount: 15,
				azimuthOffsets:
					'-90..+90 degrees at 5-degree spacing plus -31 and +52 degrees',
				elevationsDegrees: [
					0, 0.25, 0.5, 1, 2, 3, 5, 7.5, 10, 15, 20, 30, 45, 60, 75,
				],
				sampleCount: 585,
			},
		},
		provenance: {
			schemaId: 'san-jose-nautical-twilight-ozone-f68-w39-provenance-v1',
			operation: 'reuse the exact run-000466 +1h scene, camera, stellar/Sun screen product, Native48 altitude domain, N4 recurrence, native-15 basis, geometry, and source-luminance-lift Color; retain the run-000492 Bruneton 300-DU ozone total-extinction extension and W39 outgoing storage/reconstruction, replace only ordinary F34 incoming quadrature with the reflection-completed F68 control, and read the already-built cache through a diagnostic pre-Color path-radiance shader',
			implementation: [
				'scripts/extraterrestrial/atmospheres/BrunetonOzoneCandidateAtmosphere.js',
				'scripts/extraterrestrial/ozone/BrunetonOzoneReference.js',
				'scripts/extraterrestrial/stellar-screen-palette/DoubledOutgoingSphericalEarthGeometry.js',
				'scripts/extraterrestrial/stellar-screen-palette/ReflectionCompletedFibonacci68Control.js',
				'scripts/extraterrestrial/stellar-screen-palette/ReflectionCompletedFibonacci68W39Control.js',
				'scripts/extraterrestrial/stellar-screen-palette/SkyPathRadianceSpectralProbe.js',
				'scripts/extraterrestrial/stellar-screen-palette/run-nautical-twilight-ozone-w39-browser.js',
				'scripts/extraterrestrial/runners/render-nautical-twilight-ozone-w39.js',
			],
			exclusions: [
				'Bruneton comparison panel',
				'appearance acceptance gates',
				'production changes',
			],
		},
		environment: {
			schemaId: 'san-jose-nautical-twilight-ozone-f68-w39-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: CHROME_PATH,
			angleBackend: 'd3d11',
		},
		references: {
			schemaId: 'san-jose-nautical-twilight-ozone-f68-w39-references-v1',
			parentRun: PARENT,
			previousOzoneW39Diagnostic: {
				runId: '000492-san-jose-nautical-twilight-ozone-w39-preview',
				artifactSetSha256:
					'9d85fc81b1f1a268279a113cadd6958d464259d4b82fe5cb15c544091dc7ac6d',
			},
			reflectionCompletedF68Proof: {
				runId: '000471-san-jose-plus-one-hour-fibonacci-reflection-control',
				artifactSetSha256:
					'de0db263796363d29102006e27a3a352cdadde960cac524c4b4e93a27d1bd882',
			},
			design: 'agents/topics/extraterrestrial/sun-disk-appearance-design.md',
		},
	});
	let server;
	let browserProfilePath;
	try {
		await assertRepositoryIdentity();
		await Promise.all([
			lstat(CHROME_PATH),
			assertNoReparseEntries(SCREEN_PALETTE_ROOT, 'Screen-palette source'),
			assertNoReparseEntries(CANDIDATE_ROOT, 'Contained candidate'),
			assertNoReparseEntries(ATMOSPHERES_ROOT, 'Contained atmosphere adapters'),
			assertNoReparseEntries(OZONE_ROOT, 'Contained ozone source'),
		]);
		const parentRoot = path.join(RUNS_ROOT, PARENT.runId);
		await assertExistingRealPathContained(
			OUTPUT_ROOT,
			parentRoot,
			'Run 000466 parent',
		);
		const manifest = JSON.parse(await readFile(
			path.join(parentRoot, 'artifact-manifest.json'),
			'utf8',
		));
		requireCondition(
			manifest.conclusion === 'accepted'
				&& manifest.artifactSetSha256 === PARENT.artifactSetSha256,
			'Run 000466 parent identity changed.',
		);
		const [parentConfigPath, parentMatrixPath, parentPalettePath] =
			await Promise.all([
				verifyParentArtifact(parentRoot, manifest, PARENT_ARTIFACTS.config),
				verifyParentArtifact(parentRoot, manifest, PARENT_ARTIFACTS.matrix),
				verifyParentArtifact(parentRoot, manifest, PARENT_ARTIFACTS.palette),
			]);
		const parentConfig = JSON.parse(await readFile(parentConfigPath, 'utf8'));
		const scene = parentConfig.scenes.find((entry) => entry.id === SCENE_ID);
		const parentProduct = parentConfig.products[SCENE_ID];
		requireCondition(
			scene?.timeIso === SCENE_TIME_ISO && parentProduct,
			'Run 000466 no longer contains the exact +1h scene/product.',
		);
		const sunElevationDegrees = Math.asin(
			scene.directionToSourceUpEastNorth[0],
		) * 180 / Math.PI;
		const product = {
			...parentProduct,
			matrixUrl: '/browser/product/sunset-plus-one-hour-matrix.u16',
			paletteUrl: '/browser/product/sunset-plus-one-hour-palette.f32',
		};
		await Promise.all([
			run.writeArtifact(
				'browser/product/sunset-plus-one-hour-matrix.u16',
				await readFile(parentMatrixPath),
			),
			run.writeArtifact(
				'browser/product/sunset-plus-one-hour-palette.f32',
				await readFile(parentPalettePath),
			),
		]);
		await run.writeJsonArtifact('browser/config.json', {
			schemaId: 'san-jose-nautical-twilight-ozone-f68-w39-browser-config-v1',
			scene: {...scene, sunElevationDegrees},
			product,
			luminanceLiftCurve: parentConfig.luminanceLiftCurve,
			parent: PARENT,
			changes: {
				ozoneAbsorptionEnabled: true,
				incomingDirections: {
					baselineCount: 34,
					previewCount: 68,
					policy:
						'contained-reflection-completed-ordinary-fibonacci-68-control-v1',
				},
				outgoingDirections: OUTGOING,
				skyPathRadianceSpectralProbe: true,
			},
		});
		await run.writeArtifact(
			'browser/index.html',
			'<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">const target=document.querySelector("#result");try{const {runNauticalTwilightOzoneW39Browser}=await import("/screen-palette/run-nautical-twilight-ozone-w39-browser.js");target.textContent=JSON.stringify(await runNauticalTwilightOzoneW39Browser());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>',
		);
		server = await serve(run);
		browserProfilePath = assertLexicallyContained(
			OUTPUT_ROOT,
			path.join(OUTPUT_ROOT, 'browser-profiles', run.runId),
			'Chrome nautical-twilight profile',
		);
		await mkdir(browserProfilePath, {recursive: true});
		let browser;
		let page;
		const browserEvents = [];
		let browserDom;
		let resultText;
		try {
			browser = await puppeteer.launch({
				executablePath: CHROME_PATH,
				headless: 'new',
				protocolTimeout: 1020000,
				userDataDir: browserProfilePath,
				defaultViewport: {width: 640, height: 400, deviceScaleFactor: 1},
				args: [
					'--enable-gpu',
					'--enable-webgl',
					'--ignore-gpu-blocklist',
					'--use-angle=d3d11',
					'--disable-breakpad',
					'--disable-crash-reporter',
					'--disable-component-update',
				],
			});
			page = await browser.newPage();
			page.setDefaultTimeout(1020000);
			page.on('console', (message) => browserEvents.push({
				type: message.type(),
				text: message.text(),
			}));
			page.on('pageerror', (error) => browserEvents.push({
				type: 'pageerror',
				text: `${error.name}: ${error.message}`,
			}));
			page.on('requestfailed', (request) => browserEvents.push({
				type: 'requestfailed',
				text: `${request.url()} ${request.failure()?.errorText ?? ''}`,
			}));
			await page.goto(server.url, {
				waitUntil: 'networkidle0',
				timeout: 1020000,
			});
			await page.waitForFunction(
				() => document.querySelector('#result')?.textContent !== 'pending',
				{timeout: 1020000, polling: 250},
			);
			resultText = await page.$eval('#result', (node) => node.textContent);
			browserDom = await page.content();
		} catch (error) {
			await run.writeArtifact(
				'browser/dom-on-failure.html',
				page ? await page.content().catch(() => '') : '',
			);
			await run.writeJsonArtifact(
				'browser/events-on-failure.json',
				browserEvents,
			);
			throw error;
		} finally {
			await browser?.close().catch(() => {});
			await rm(browserProfilePath, {recursive: true, force: true});
			browserProfilePath = null;
		}
		await run.writeArtifact('browser/dom.html', browserDom);
		await run.writeJsonArtifact('browser/events.json', browserEvents);
		await run.writeJsonArtifact('browser/requests.json', server.requests);
		requireCondition(resultText, 'Browser emitted no preview result.');
		const result = JSON.parse(resultText);
		if (result.error) {
			throw new Error(`${result.error.name}: ${result.error.message}`);
		}
		const capturePath =
			'captures/san-jose-nautical-twilight-ozone-f68-w39.png';
		const captureBytes = pngBytes(result.imagePngDataUrl);
		await run.writeArtifact(capturePath, captureBytes);
		delete result.imagePngDataUrl;
		result.capture = {
			path: capturePath,
			byteLength: captureBytes.length,
			sha256: await sha256File(path.join(run.runDirectory, capturePath)),
		};
		requireCondition(
			result.skyPathRadianceSpectra?.samples?.length === 585,
			'Browser did not return the complete 585-sample sky spectral ledger.',
		);
		await run.writeJsonArtifact(
			'evidence/sky-path-radiance-spectra.json',
			{
				...result.skyPathRadianceSpectra,
				derivation: {
					parentScene: PARENT,
					quantity:
						'diffuse state.pathRadiance before celestial composition and Color',
					operation:
						'execute the diagnostic output hook against the same live F68/W39/ozone N4 cache used for the capture',
				},
			},
		);
		result.parentInputs = PARENT_ARTIFACTS;
		await run.writeJsonArtifact('evidence/render.json', result);
		const finalManifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				scope: 'diagnostic render only; no appearance validation',
				capture: capturePath,
				evidence: 'evidence/render.json',
				spectralEvidence: 'evidence/sky-path-radiance-spectra.json',
			},
			report: report(run.runId, result),
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion: 'accepted-diagnostic-render',
			artifactSetSha256: finalManifest.artifactSetSha256,
			capture: capturePath,
			spectralEvidence: 'evidence/sky-path-radiance-spectra.json',
		}, null, 2)}\n`);
	} catch (error) {
		const detail = {
			name: error.name,
			message: error.message,
			stack: error.stack,
		};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const finalManifest = await run.finalize({
				conclusion: 'failed',
				result: {scope: 'diagnostic render only', error: detail},
				report: `# ${run.runId}: San Jose nautical twilight ozone/F68/W39 preview\n\nConclusion: **failed**.\n\n${detail.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'failed',
				artifactSetSha256: finalManifest.artifactSetSha256,
				error: detail,
			}, null, 2)}\n`);
		} catch (finalizationError) {
			process.stderr.write(`${JSON.stringify({
				conclusion: 'unsealed-failure',
				error: detail,
				finalizationError: String(finalizationError),
			}, null, 2)}\n`);
		}
		process.exitCode = 1;
	} finally {
		await server?.close().catch(() => {});
		if (browserProfilePath) {
			await rm(browserProfilePath, {recursive: true, force: true})
				.catch(() => {});
		}
	}
}

await main();
