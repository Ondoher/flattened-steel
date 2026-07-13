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
	'node scripts/extraterrestrial/runners/render-nautical-twilight-ozone-f68-front-back.js';
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
const VIEW_ROTATION_DEGREES = 180;
const OUTGOING = Object.freeze({
	baselineFaceWidth: 27,
	baselineDirectionCount: 4374,
	faceWidth: 39,
	directionCount: 9126,
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
	return [
		`# ${runId}: San Jose nautical twilight front/back orientation diagnostic`,
		'',
		'Conclusion: **completed diagnostic render**.',
		'',
		'This run intentionally has no appearance acceptance gates and no Bruneton side-by-side.',
		'',
		`- Scene: ${evidence.scene.id}, ${evidence.scene.timeIso}`,
		`- Sun elevation: ${evidence.scene.sunElevationDegrees} degrees`,
		`- Ozone absorption: enabled (${evidence.configuration.ozoneIdentity?.id ?? 'contained Bruneton 300 DU'})`,
		`- Shared outgoing cache: W${evidence.configuration.outgoingFaceWidth}, ${evidence.configuration.outgoingDirectionCount} stored directions (${evidence.configuration.outgoingDirectionCountRatio.toFixed(6)}x W27)`,
		`- Incoming quadrature: ${evidence.configuration.incomingDirectionCount} directions (reflection-completed F68)`,
		`- Front view: ${evidence.views.front.viewAzimuthDegrees} degrees azimuth; ${evidence.views.front.capture.path}`,
		`- Back view: ${evidence.views.back.viewAzimuthDegrees} degrees azimuth; ${evidence.views.back.capture.path}`,
		`- Exact camera rotation: ${evidence.diagnostics.exactRotationDegrees} degrees`,
		`- Cache builds: ${evidence.cacheBuild.controlledBuildRecordCount}; rendered frames: ${evidence.runtime.frameCount}`,
		'- Both views use the same atmosphere cache and installed shader handle.',
		'- Ground caveat: the front uses the existing local spherical ground visual; the back selects its 180-degree-mirrored companion so reverse-camera ground coverage is comparable. This scene-only swap does not change the atmosphere cache.',
		`- Caveat: the copied run-000466 stellar/Sun matrix and palette are screen-space products for the front camera. They are intentionally reused unchanged in the back image as a fixed ${evidence.diagnostics.fixedScreenPaletteOverlay.pixelCount}-pixel overlay/control and are not a physically reprojected back-view celestial field. Ignore or mask those sparse pixels when comparing diffuse sky structure.`,
		'- Evidence: evidence/render.json',
		'',
		'Production and all source runs remain unchanged.',
		'',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) {
		throw new Error('The nautical-twilight front/back diagnostic accepts no arguments.');
	}
	const run = await initializeRunRecord({
		slug: 'san-jose-nautical-twilight-ozone-f68-front-back',
		command: COMMAND,
		inputs: {
			schemaId: 'san-jose-nautical-twilight-ozone-f68-front-back-input-v1',
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
			views: {
				front: 'exact run-000466 camera orientation',
				back:
					'exactly 180 degrees of azimuth behind the front camera; elevation, FOV, viewport, observer, time, atmosphere, cache, and Color unchanged',
			},
			stellarOverlayCaveat: {
				policy:
					'reuse the exact front-camera screen-space stellar/Sun matrix and palette unchanged in both images',
				interpretation:
					'the sparse celestial overlay is a fixed control, not a physical reprojection in the back view; mask its nonzero pixels for diffuse-sky comparison',
			},
			groundPatchPolicy: {
				front:
					'use the exact run-000493 local spherical ground visualization',
				back:
					'add or select the 180-degree-mirrored local ground visualization so the reverse camera retains comparable ground coverage',
				cacheEffect:
					'visual scene geometry only; does not rebuild or modify the shared atmosphere cache',
			},
		},
		provenance: {
			schemaId: 'san-jose-nautical-twilight-ozone-f68-front-back-provenance-v1',
			operation: 'copy and verify the exact run-000466 +1h config, front-camera stellar/Sun screen product, scene, Native48 altitude domain, N4 recurrence, native-15 basis, geometry, and source-luminance-lift Color; retain the contained Bruneton 300-DU ozone total-extinction extension, reflection-completed F68 incoming quadrature, and W39 outgoing storage/reconstruction from run 000493; build one cache and one installed shader handle, render the exact front camera, then rotate only camera azimuth by exactly 180 degrees and render the back view through that same cache and handle',
			implementation: [
				'scripts/extraterrestrial/atmospheres/BrunetonOzoneCandidateAtmosphere.js',
				'scripts/extraterrestrial/ozone/BrunetonOzoneReference.js',
				'scripts/extraterrestrial/stellar-screen-palette/DoubledOutgoingSphericalEarthGeometry.js',
				'scripts/extraterrestrial/stellar-screen-palette/ReflectionCompletedFibonacci68Control.js',
				'scripts/extraterrestrial/stellar-screen-palette/ReflectionCompletedFibonacci68W39Control.js',
				'scripts/extraterrestrial/stellar-screen-palette/run-nautical-twilight-ozone-f68-front-back-browser.js',
				'scripts/extraterrestrial/runners/render-nautical-twilight-ozone-f68-front-back.js',
			],
			exclusions: [
				'Bruneton comparison panel',
				'appearance acceptance gates',
				'camera-facing outgoing patch from run 000494',
				'physical reprojection of the copied front-camera stellar/Sun overlay for the back view',
				'production changes',
			],
		},
		environment: {
			schemaId: 'san-jose-nautical-twilight-ozone-f68-front-back-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: CHROME_PATH,
			angleBackend: 'd3d11',
		},
		references: {
			schemaId: 'san-jose-nautical-twilight-ozone-f68-front-back-references-v1',
			parentRun: PARENT,
			sharedF68W39OzoneControl: {
				runId: '000493-san-jose-nautical-twilight-ozone-f68-w39-preview',
				artifactSetSha256:
					'63ccccc8ce9e2796781dc6ac0fbd4c912c4340815050215f85dd263ea8ea966f',
				captureSha256:
					'cbf7ddaa40d568361e92e1e4b3da9a6b230ca330094930cc6cd75545b6c9d6a4',
				renderEvidenceSha256:
					'ab1d979bc966c9754161d86ee5b12ae47079caeca151f69b6a3b17ecf92ff246',
				spectralLedgerSha256:
					'dc462d451e9a9e4c9332ba229e24d8beb6ac882ce35e1c5e0b472f989d9ac515',
			},
			cameraPatchNegativeControl: {
				runId: '000494-san-jose-nautical-twilight-ozone-f68-camera-patch-preview',
				artifactSetSha256:
					'74f1724881af45188802a178819a8e737bb94f5c3d05c7b3112a18e365b84084',
			},
			design: 'agents/topics/extraterrestrial/sun-disk-appearance-design.md',
		},
	});
	let server;
	let browserProfilePath;
	let materializedCapturePaths = null;
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
		const parentConfigBytes = await readFile(parentConfigPath);
		const parentConfig = JSON.parse(parentConfigBytes.toString('utf8'));
		const scene = parentConfig.scenes.find((entry) => entry.id === SCENE_ID);
		const parentProduct = parentConfig.products[SCENE_ID];
		requireCondition(
			scene?.timeIso === SCENE_TIME_ISO && parentProduct,
			'Run 000466 no longer contains the exact +1h scene/product.',
		);
		requireCondition(
			Number.isFinite(scene.viewAzimuthDegrees)
				&& Number.isFinite(scene.viewElevationDegrees),
			'Run 000466 +1h scene no longer declares the exact camera orientation.',
		);
		const sunElevationDegrees = Math.asin(
			scene.directionToSourceUpEastNorth[0],
		) * 180 / Math.PI;
		const views = {
			front: {
				id: 'front',
				viewAzimuthDegrees: scene.viewAzimuthDegrees,
				viewElevationDegrees: scene.viewElevationDegrees,
			},
			back: {
				id: 'back-180',
				viewAzimuthDegrees:
					scene.viewAzimuthDegrees + VIEW_ROTATION_DEGREES,
				viewElevationDegrees: scene.viewElevationDegrees,
			},
		};
		const product = {
			...parentProduct,
			matrixUrl: '/browser/product/sunset-plus-one-hour-matrix.u16',
			paletteUrl: '/browser/product/sunset-plus-one-hour-palette.f32',
		};
		await Promise.all([
			run.writeArtifact(
				'browser/parent/run-000466-config.json',
				parentConfigBytes,
			),
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
			schemaId:
				'san-jose-nautical-twilight-ozone-f68-front-back-browser-config-v1',
			scene: {...scene, sunElevationDegrees},
			views,
			product,
			luminanceLiftCurve: parentConfig.luminanceLiftCurve,
			parent: PARENT,
			parentConfigCopy: {
				path: '/browser/parent/run-000466-config.json',
				byteLength: PARENT_ARTIFACTS.config.byteLength,
				sha256: PARENT_ARTIFACTS.config.sha256,
			},
			stellarOverlayCaveat: {
				fixedScreenSpaceProduct: true,
				frontViewPhysicalProduct: true,
				backViewPhysicalReprojection: false,
				nonzeroPixelPolicy:
					'mask or ignore copied nonzero product pixels for diffuse-sky comparison',
			},
			groundPatchPolicy: {
				front: 'original local spherical ground visual',
				back:
					'180-degree-mirrored local spherical ground visual selected for reverse-camera coverage',
				atmosphereCacheInvariant: true,
			},
			changes: {
				ozoneAbsorptionEnabled: true,
				incomingDirections: {
					baselineCount: 34,
					previewCount: 68,
					policy:
						'contained-reflection-completed-ordinary-fibonacci-68-control-v1',
				},
				outgoingDirections: OUTGOING,
				cameraRotationDegrees: VIEW_ROTATION_DEGREES,
				sharedCacheAndHandle: true,
			},
		});
		await run.writeArtifact(
			'browser/index.html',
			'<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">const target=document.querySelector("#result");try{const {runNauticalTwilightOzoneF68FrontBackBrowser}=await import("/screen-palette/run-nautical-twilight-ozone-f68-front-back-browser.js");target.textContent=JSON.stringify(await runNauticalTwilightOzoneF68FrontBackBrowser());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>',
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
		requireCondition(resultText, 'Browser emitted no front/back result.');
		const result = JSON.parse(resultText);
		if (result.error) {
			throw new Error(`${result.error.name}: ${result.error.message}`);
		}
		const capturePaths = {
			front: 'captures/san-jose-nautical-twilight-front.png',
			back: 'captures/san-jose-nautical-twilight-back-180.png',
		};
		const captureBytes = {
			front: pngBytes(result.views?.front?.imagePngDataUrl),
			back: pngBytes(result.views?.back?.imagePngDataUrl),
		};
		// Preserve both requested images before applying any structural/runtime
		// qualification. There are intentionally no appearance gates.
		await Promise.all([
			run.writeArtifact(capturePaths.front, captureBytes.front),
			run.writeArtifact(capturePaths.back, captureBytes.back),
		]);
		materializedCapturePaths = capturePaths;
		delete result.views.front.imagePngDataUrl;
		delete result.views.back.imagePngDataUrl;
		const [frontSha256, backSha256] = await Promise.all([
			sha256File(path.join(run.runDirectory, capturePaths.front)),
			sha256File(path.join(run.runDirectory, capturePaths.back)),
		]);
		result.views.front.capture = {
			path: capturePaths.front,
			byteLength: captureBytes.front.length,
			sha256: frontSha256,
		};
		result.views.back.capture = {
			path: capturePaths.back,
			byteLength: captureBytes.back.length,
			sha256: backSha256,
		};

		requireCondition(
			result.schemaId
				=== 'algorithm32.nautical-twilight-ozone-f68-front-back-browser-result.v1',
			'Browser returned the wrong front/back result schema.',
		);
		requireCondition(
			result.views.front.id === 'front'
				&& result.views.back.id === 'back-180'
				&& result.views.front.viewAzimuthDegrees
					=== scene.viewAzimuthDegrees
				&& result.views.back.viewAzimuthDegrees
					=== scene.viewAzimuthDegrees + VIEW_ROTATION_DEGREES
				&& result.views.front.viewElevationDegrees
					=== scene.viewElevationDegrees
				&& result.views.back.viewElevationDegrees
					=== scene.viewElevationDegrees,
			'Browser did not render the exact front and 180-degree-back views.',
		);
		requireCondition(
			result.configuration?.incomingDirectionCount === 68
				&& result.configuration?.outgoingFaceWidth === OUTGOING.faceWidth
				&& result.configuration?.outgoingDirectionCount
					=== OUTGOING.directionCount,
			'Browser did not use the intended shared F68/W39 configuration.',
		);
		requireCondition(
			result.cacheBuild?.controlledBuildRecordCount === 1
				&& result.cacheBuild?.buildRecord
				&& result.diagnostics?.sharedCacheAndHandle === true,
			'Browser did not prove one shared cache build and shader handle.',
		);
		requireCondition(
			result.runtime?.status === 'ready'
				&& result.runtime?.frameCount >= 2
				&& result.diagnostics?.exactRotationDegrees
					=== VIEW_ROTATION_DEGREES
				&& result.diagnostics?.contextLost === false
				&& Array.isArray(result.diagnostics?.webglErrors)
				&& result.diagnostics.webglErrors.length === 0
				&& result.diagnostics?.runtimeRenderErrorCount === 0
				&& Array.isArray(result.diagnostics?.programDiagnostics)
				&& result.diagnostics.programDiagnostics.every(
					(diagnostic) => diagnostic === null
						|| diagnostic.runnable !== false,
				),
			'Browser front/back runtime did not complete cleanly.',
		);
		requireCondition(
			result.configuration?.stellarOverlay?.fixedScreenSpaceProduct === true
				&& result.configuration?.stellarOverlay?.backViewPhysicalReprojection
					=== false
				&& result.configuration?.groundPatch?.policy
					=== 'front-default-plus-exact-z-mirror-with-per-view-visibility',
			'Browser did not retain the declared overlay and mirrored-ground policies.',
		);
		result.parentInputs = PARENT_ARTIFACTS;
		result.derivation = {
			schemaId:
				'san-jose-nautical-twilight-ozone-f68-front-back-derivation-v1',
			parentScene: PARENT,
			operation:
				'render the exact run-000466 front camera, copy its inverse camera matrices into the installed runtime bindings, then rotate camera azimuth by exactly 180 degrees, copy the new inverse camera matrices, and render again through the same F68/W39/ozone N4 cache and installed shader handle',
			materializedBeforeQualification: [
				result.views.front.capture,
				result.views.back.capture,
			],
			stellarOverlay: {
				sourceMatrix: PARENT_ARTIFACTS.matrix,
				sourcePalette: PARENT_ARTIFACTS.palette,
				operation:
					'copy exact bytes and reuse unchanged for both screen images',
				caveat:
					'physically aligned only with the front camera; not reprojected for the back camera; sparse nonzero pixels must be masked or ignored for diffuse-sky interpretation',
			},
			groundPatch: {
				operation:
					'use the original local spherical ground visual for the front and its 180-degree-mirrored companion for the reverse camera',
				cacheEffect:
					'none; the visual scene selection is outside atmosphere cache construction',
			},
		};
		await run.writeJsonArtifact('evidence/render.json', result);
		const finalManifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				scope: 'diagnostic render only; no appearance validation',
				captures: capturePaths,
				evidence: 'evidence/render.json',
				sharedCacheAndHandle: true,
				stellarOverlayCaveat:
					'fixed front-camera screen product; mask sparse nonzero pixels in back-view diffuse-sky comparisons',
			},
			report: report(run.runId, result),
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion: 'accepted-diagnostic-render',
			artifactSetSha256: finalManifest.artifactSetSha256,
			captures: capturePaths,
			evidence: 'evidence/render.json',
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
				result: {
					scope: 'diagnostic render only',
					captures: materializedCapturePaths,
					error: detail,
				},
				report: `# ${run.runId}: San Jose nautical twilight front/back orientation diagnostic\n\nConclusion: **failed**.\n\n${materializedCapturePaths ? `Both requested captures were materialized before structural qualification and remain preserved: ${materializedCapturePaths.front}, ${materializedCapturePaths.back}.` : 'The browser did not return both requested PNGs, so the pair could not be materialized.'}\n\n${detail.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'failed',
				artifactSetSha256: finalManifest.artifactSetSha256,
				captures: materializedCapturePaths,
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
