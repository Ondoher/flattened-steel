#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {appendFile, lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import puppeteer from 'puppeteer';

import {ArtifactManifest} from '../../scripts/animation-evidence/node.js';
import {CHROME_EXECUTABLE, OUTPUT_ROOT, REPOSITORY_ROOT, SOURCE_ROOT} from './consts.js';

const CONTROL_RELATIVE_PATH =
	'experiments/distant-sun-shadow-animation-evidence/controls/initial-still.json';
const PRODUCTION_BUNDLE_RELATIVE_PATH = 'dist/flat32/flat32.js';

/**
 * Call this function to stop when an evidence invariant is false.
 * @param {unknown} value Value that must be truthy.
 * @param {string} message Failure message.
 * @returns {asserts value}
 */
function requireValue(value, message) {
	if (!value) throw new Error(message);
}

/**
 * Call this function to hash bytes with SHA-256.
 * @param {Uint8Array | string} value Bytes or text to hash.
 * @returns {string} Lowercase hexadecimal digest.
 */
function sha256(value) {
	return createHash('sha256').update(value).digest('hex');
}

/**
 * Call this function to decide whether a resolved target remains below a root.
 * @param {string} root Absolute root.
 * @param {string} target Absolute target.
 * @returns {boolean} True when contained.
 */
function isWithin(root, target) {
	const relative = path.relative(root, target);
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Call this function to validate the complete checked-in still control.
 * @param {unknown} value Parsed JSON value.
 * @returns {asserts value is ShadowStillControl}
 */
function validateControl(value) {
	requireValue(value !== null && typeof value === 'object', 'Still control must be an object.');
	const control = /** @type {Record<string, unknown>} */ (value);
	requireValue(
		control.schemaId === 'distant-sun-shadow-animation-evidence-initial-still-control-v1',
		'Initial still control schema changed.',
	);
	requireValue(Array.isArray(control.parents) && control.parents.length === 8, 'Parent control changed.');
	for (const parentValue of control.parents) {
		requireValue(parentValue !== null && typeof parentValue === 'object', 'Parent control must be an object.');
		const parent = /** @type {Record<string, unknown>} */ (parentValue);
		requireValue(
			typeof parent.path === 'string' &&
				typeof parent.sha256 === 'string' &&
				/^[0-9a-f]{64}$/u.test(parent.sha256),
			'Parent control identity is invalid.',
		);
	}
	requireValue(
		control.productionUrl ===
			'http://127.0.0.1:8081/flat32/?diagnostic=spherical-sunset-facing-production-n4&performance=1',
		'Production URL is invalid.',
	);
	requireValue(
		control.location === 'San Jose' &&
			control.globeTimePresetIndex === 2 &&
			control.sunsetOffsetMinutes === -120,
		'Scene selection control changed.',
	);
	requireValue(control.camera !== null && typeof control.camera === 'object', 'Camera control must be an object.');
	const camera = /** @type {Record<string, unknown>} */ (control.camera);
	requireValue(
		camera.verticalFieldOfViewDegrees === 55 &&
			typeof camera.directionPolicy === 'string' &&
			typeof camera.futureSunsetDirectionWeight === 'number' &&
			Number.isFinite(camera.futureSunsetDirectionWeight) &&
			typeof camera.canonicalBoxLineDirectionWeight === 'number' &&
			Number.isFinite(camera.canonicalBoxLineDirectionWeight) &&
			typeof camera.downwardFramingComponent === 'number' &&
			Number.isFinite(camera.downwardFramingComponent),
		'Camera control is invalid.',
	);
	requireValue(control.capture !== null && typeof control.capture === 'object', 'Capture control must be an object.');
	const capture = /** @type {Record<string, unknown>} */ (control.capture);
	requireValue(
		capture.width === 3840 && capture.height === 2160 && capture.format === 'png',
		'Capture control changed.',
	);
	requireValue(control.scene !== null && typeof control.scene === 'object', 'Scene control must be an object.');
	const scene = /** @type {Record<string, unknown>} */ (control.scene);
	requireValue(
		scene.expectedReviewObjectCount === 6 &&
			scene.expectedShadowMapCount === 6 &&
			scene.expectedShadowMapWidth === 4096 &&
			scene.expectedShadowMapHeight === 4096,
		'Scene expectation control changed.',
	);
}

/**
 * Call this function to require a real directory without a reparse boundary.
 * @param {string} absolutePath Absolute directory path.
 * @param {string} label Human-readable boundary label.
 * @returns {Promise<string>} Canonical directory path.
 */
async function requireRealDirectory(absolutePath, label) {
	const expected = path.resolve(absolutePath);
	const actual = await realpath(expected);
	const information = await lstat(expected);
	requireValue(
		information.isDirectory() &&
			!information.isSymbolicLink() &&
			actual.toLowerCase() === expected.toLowerCase(),
		`${label} must be a real directory without a reparse boundary.`,
	);
	return actual;
}

/**
 * Call this function to resolve and validate a repository-contained real file.
 * @param {string} repositoryRoot Canonical repository root.
 * @param {string} relativePath Slash-separated repository-relative path.
 * @param {string} label Human-readable boundary label.
 * @returns {Promise<string>} Canonical file path.
 */
async function requireRepositoryFile(repositoryRoot, relativePath, label) {
	requireValue(
		typeof relativePath === 'string' &&
			!path.isAbsolute(relativePath) &&
			!relativePath.includes('\\') &&
			relativePath.split('/').every((segment) => segment && segment !== '.' && segment !== '..'),
		`Unsafe ${label} path.`,
	);
	const expected = path.join(repositoryRoot, ...relativePath.split('/'));
	const actual = await realpath(expected);
	const information = await lstat(expected);
	requireValue(
		isWithin(repositoryRoot, actual) &&
			information.isFile() &&
			!information.isSymbolicLink() &&
			actual.toLowerCase() === expected.toLowerCase(),
		`${label} escaped the repository or crossed a reparse boundary.`,
	);
	return actual;
}

/**
 * Call this function to write formatted JSON without replacing an existing artifact.
 * @param {string} absolutePath Destination path.
 * @param {unknown} value Serializable value.
 * @returns {Promise<void>} Completion promise.
 */
async function writeJson(absolutePath, value) {
	await writeFile(absolutePath, `${JSON.stringify(value, null, 2)}\n`, {encoding: 'utf8', flag: 'wx'});
}

/**
 * Call this function to execute the immutable initial-still evidence run.
 * @returns {Promise<void>} Completion promise.
 */
async function main() {
	const repositoryRoot = await requireRealDirectory(REPOSITORY_ROOT, 'Repository root');
	const sourceRoot = await requireRealDirectory(SOURCE_ROOT, 'Experiment source root');
	requireValue(isWithin(repositoryRoot, sourceRoot), 'Experiment source root escaped the repository.');
	await mkdir(OUTPUT_ROOT, {recursive: true});
	const outputRoot = await requireRealDirectory(OUTPUT_ROOT, 'Experiment output root');
	requireValue(isWithin(repositoryRoot, outputRoot), 'Experiment output root escaped the repository.');
	const runsRootCandidate = path.join(outputRoot, 'runs');
	await mkdir(runsRootCandidate, {recursive: true});
	const runsRoot = await requireRealDirectory(runsRootCandidate, 'Experiment runs root');
	const runId = `${Date.now()}-initial-shadow-still`;
	const runDirectoryCandidate = path.join(runsRoot, runId);
	await mkdir(runDirectoryCandidate);
	const runDirectory = await requireRealDirectory(runDirectoryCandidate, 'New run directory');
	const capturesDirectoryCandidate = path.join(runDirectory, 'captures');
	await mkdir(capturesDirectoryCandidate);
	await requireRealDirectory(capturesDirectoryCandidate, 'Run captures directory');
	const progressPath = path.join(runDirectory, 'progress.jsonl');
	await writeFile(progressPath, '', {flag: 'wx'});
	let current = {phase: 'initialize', message: 'Initializing the initial shadow still.'};
	let progressTail = Promise.resolve();
	/**
	 * Call this function to append one flushed progress event in sequence.
	 * @param {string} phase Current phase.
	 * @param {string} message Human-readable progress message.
	 * @param {ShadowStillProgressTerminalState} [state] Optional terminal state.
	 * @returns {Promise<void>} Completion promise.
	 */
	const progress = async (phase, message, state) => {
		current = {phase, message};
		const event = {timestamp: new Date().toISOString(), phase, message, ...(state ? {state} : {})};
		const append = progressTail.then(() => appendFile(progressPath, `${JSON.stringify(event)}\n`, 'utf8'));
		progressTail = append.catch(() => undefined);
		await append;
	};
	const heartbeat = setInterval(
		() => void progress(current.phase, current.message).catch(() => undefined),
		30_000,
	);
	let browser;
	try {
		await progress('authenticate-inputs', 'Authenticating controls, production sources, and parent evidence.');
		const controlPath = await requireRepositoryFile(repositoryRoot, CONTROL_RELATIVE_PATH, 'Still control');
		const controlBytes = await readFile(controlPath);
		const control = JSON.parse(controlBytes.toString('utf8'));
		validateControl(control);
		const parents = [];
		for (const parent of control.parents) {
			const bytes = await readFile(
				await requireRepositoryFile(repositoryRoot, parent.path, `Parent ${parent.path}`),
			);
			const digest = sha256(bytes);
			requireValue(digest === parent.sha256, `Parent identity changed: ${parent.path}.`);
			parents.push({path: parent.path, byteLength: bytes.byteLength, sha256: digest});
		}
		const productionBundle = await readFile(
			await requireRepositoryFile(repositoryRoot, PRODUCTION_BUNDLE_RELATIVE_PATH, 'Production bundle'),
			'utf8',
		);
		const exposureNeedle = 'window.__flat32Cleanup = application.dispose.bind(application);';
		requireValue(productionBundle.includes(exposureNeedle), 'Production bundle exposure anchor changed.');
		const instrumentedBundle = productionBundle.replace(
			exposureNeedle,
			`application._reviewObjectsEnabled = true;\napplication._cameraFieldOfViewDegrees = ${control.camera.verticalFieldOfViewDegrees};\nwindow.__shadowStillApplication = application;\n${exposureNeedle}`,
		);
		await Promise.all([
			writeFile(
				path.join(runDirectory, 'command.txt'),
				'node experiments/distant-sun-shadow-animation-evidence/run-initial-still.js\n',
				{flag: 'wx'},
			),
			writeJson(path.join(runDirectory, 'inputs.json'), {
				schemaId: 'distant-sun-shadow-animation-evidence-initial-still-input-v1',
				control: {path: CONTROL_RELATIVE_PATH, byteLength: controlBytes.byteLength, sha256: sha256(controlBytes)},
				parents,
			}),
			writeJson(path.join(runDirectory, 'environment.json'), {
				node: process.version,
				platform: process.platform,
				architecture: process.arch,
				logicalCpuCount: os.cpus().length,
				chromeExecutable: CHROME_EXECUTABLE,
			}),
		]);

		await progress('launch-browser', 'Launching native-4K hardware WebGL capture.');
		browser = await puppeteer.launch({
			headless: true,
			executablePath: CHROME_EXECUTABLE,
			protocolTimeout: 1_200_000,
			args: [
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--use-angle=d3d11',
				'--disable-software-rasterizer',
				'--disable-background-timer-throttling',
				`--window-size=${control.capture.width},${control.capture.height}`,
			],
		});
		const page = await browser.newPage();
		const browserMessages = [];
		page.on('console', (message) =>
			browserMessages.push({kind: 'console', type: message.type(), text: message.text()}),
		);
		page.on('pageerror', (error) =>
			browserMessages.push({kind: 'pageerror', name: error.name, message: error.message}),
		);
		await page.setViewport({
			width: control.capture.width,
			height: control.capture.height,
			deviceScaleFactor: 1,
		});
		await page.setRequestInterception(true);
		const productionBundleUrl = new URL('/flat32/flat32.js', control.productionUrl).href;
		let requestFailure = null;
		page.on('request', async (request) => {
			try {
				if (request.url() === productionBundleUrl && request.method() === 'GET') {
					await request.respond({
						status: 200,
						contentType: 'text/javascript; charset=utf-8',
						body: instrumentedBundle,
					});
				} else await request.continue();
			} catch (error) {
				requestFailure = error instanceof Error ? error.message : String(error);
			}
		});
		await page.goto(control.productionUrl, {waitUntil: 'networkidle2', timeout: 180_000});
		requireValue(requestFailure === null, `Bundle interception failed: ${requestFailure}.`);
		await page.waitForFunction(
			() => window.__shadowStillApplication && document.querySelector('.flat32-shell'),
			{timeout: 30_000, polling: 100},
		);
		await page.waitForFunction(
			() => {
				const shell = document.querySelector('.flat32-shell');
				return (
					shell instanceof HTMLElement &&
					['ready', 'failed', 'atmosphere-failed'].includes(shell.dataset.flat32State)
				);
			},
			{timeout: 240_000, polling: 250},
		);
		await progress('select-scene', 'Selecting San Jose and resolving the exact computed sunset direction.');
		await page.evaluate(() => {
			const location = document.querySelector('#flat32-location-control');
			if (!(location instanceof HTMLElement)) throw new Error('Location control is unavailable.');
			location.click();
			location.click();
		});
		await page.waitForFunction(
			() => {
				const shell = document.querySelector('.flat32-shell');
				return (
					shell instanceof HTMLElement &&
					shell.dataset.flat32Location === 'San Jose' &&
					shell.dataset.flat32State === 'ready'
				);
			},
			{timeout: 240_000, polling: 250},
		);
		const sunsetState = await page.evaluate(() => {
			const sunset = document.querySelector('button[data-flat32-globe-time="2"]');
			if (!(sunset instanceof HTMLElement)) throw new Error('Sunset control is unavailable.');
			sunset.click();
			return true;
		});
		requireValue(sunsetState, 'Sunset selection failed.');
		await page.waitForFunction(
			() => {
				const application = window.__shadowStillApplication;
				const shell = document.querySelector('.flat32-shell');
				const dataset = shell instanceof HTMLElement ? shell.dataset : undefined;
				const direction =
					application?._modeController?._activeMode?.geometry?.configuration?.directionToSource;
				const requested = application?._state
					? application._createSphericalDistantSceneState(application._state).directionToSourceModel
					: null;
				const publishedZenith = direction
					? (Math.acos(Math.max(-1, Math.min(1, direction[2]))) * 180) / Math.PI
					: Number.NaN;
				return (
					application?._locationTimeRefreshTimer === null &&
					dataset?.flat32State === 'ready' &&
					dataset.flat32DistantSunCacheState === 'ready' &&
					dataset.flat32Time === 'Sunset' &&
					Math.abs(publishedZenith - Number(dataset.flat32SolarZenithDegrees)) <= 1e-6 &&
					requested?.every((value, index) => Math.abs(value - direction[index]) <= 1e-12)
				);
			},
			{timeout: 240_000, polling: 250},
		);
		const sunsetFacts = await page.evaluate(() => {
			const application = window.__shadowStillApplication;
			const sceneState = application._createSphericalDistantSceneState(application._state);
			const shell = document.querySelector('.flat32-shell');
			return {
				instant: sceneState.observation.instant,
				solarZenithDegrees: sceneState.solarZenithDegrees,
				directionToSunModel: [...sceneState.directionToSourceModel],
			};
		});
		const frameCountBeforeOffset = await page.evaluate(() =>
			Number(
				window.__shadowStillApplication?._sceneRuntime?.canvas?.dataset.flat32AtmosphereFrameCount ?? 0,
			),
		);
		await page.evaluate((offsetMinutes) => {
			const button = document.querySelector('button[data-flat32-minute-offset="-10"]');
			if (!(button instanceof HTMLElement)) throw new Error('Negative minute control is unavailable.');
			for (let step = 0; step < Math.abs(offsetMinutes) / 10; step += 1) button.click();
		}, control.sunsetOffsetMinutes);
		await page.waitForFunction(
			(priorFrameCount) => {
				const application = window.__shadowStillApplication;
				const shell = document.querySelector('.flat32-shell');
				const dataset = shell instanceof HTMLElement ? shell.dataset : undefined;
				const direction =
					application?._modeController?._activeMode?.geometry?.configuration?.directionToSource;
				const requested = application?._state
					? application._createSphericalDistantSceneState(application._state).directionToSourceModel
					: null;
				const publishedZenith = direction
					? (Math.acos(Math.max(-1, Math.min(1, direction[2]))) * 180) / Math.PI
					: Number.NaN;
				const frameCount = Number(
					window.__shadowStillApplication?._sceneRuntime?.canvas?.dataset
						.flat32AtmosphereFrameCount ?? 0,
				);
				return (
					application?._locationTimeRefreshTimer === null &&
					dataset?.flat32State === 'ready' &&
					dataset.flat32DistantSunCacheState === 'ready' &&
					dataset.flat32Time === 'Sunset -2h' &&
					Math.abs(publishedZenith - Number(dataset.flat32SolarZenithDegrees)) <= 1e-6 &&
					requested?.every((value, index) => Math.abs(value - direction[index]) <= 1e-12) &&
					frameCount > priorFrameCount
				);
			},
			{timeout: 240_000, polling: 250},
			frameCountBeforeOffset,
		);

		await progress('compose-frame', 'Aiming at the future sunset and refreshing production shadow maps.');
		const sceneFacts = await page.evaluate((futureSunDirectionModel, cameraControl) => {
			const application = window.__shadowStillApplication;
			const camera = application._sceneRuntime.camera;
			const futureSunsetDirectionScene = [
				futureSunDirectionModel[0],
				futureSunDirectionModel[2],
				-futureSunDirectionModel[1],
			];
			const cameraDirectionUnnormalized = [
				futureSunsetDirectionScene[0] * cameraControl.futureSunsetDirectionWeight,
				cameraControl.downwardFramingComponent,
				futureSunsetDirectionScene[2] * cameraControl.futureSunsetDirectionWeight -
					cameraControl.canonicalBoxLineDirectionWeight,
			];
			const cameraDirectionLength = Math.hypot(...cameraDirectionUnnormalized);
			const cameraDirectionScene = cameraDirectionUnnormalized.map(
				(value) => value / cameraDirectionLength,
			);
			camera.fov = cameraControl.verticalFieldOfViewDegrees;
			camera.updateProjectionMatrix();
			camera.up.set(0, 1, 0);
			camera.lookAt(
				camera.position.x + cameraDirectionScene[0],
				camera.position.y + cameraDirectionScene[1],
				camera.position.z + cameraDirectionScene[2],
			);
			camera.updateMatrixWorld(true);
			application._sceneRuntime.refreshShadowMaps();
			const futureSunsetProjection = camera.position
				.clone()
				.add({
					x: futureSunsetDirectionScene[0],
					y: futureSunsetDirectionScene[1],
					z: futureSunsetDirectionScene[2],
				})
				.project(camera);
			const shell = document.querySelector('.flat32-shell');
			if (!(shell instanceof HTMLElement)) throw new Error('Flat32 shell is unavailable.');
			const mode = application._modeController._activeMode;
			const requestedSceneState = application._createSphericalDistantSceneState(application._state);
			const lighting = application._endpointScene._lighting;
			return {
				location: shell.dataset.flat32Location,
				instant: requestedSceneState.observation.instant,
				solarZenithDegrees: Number(shell.dataset.flat32SolarZenithDegrees),
				currentDirectionToSunModel: [...mode.geometry.configuration.directionToSource],
				requestedDirectionToSunModel: [...requestedSceneState.directionToSourceModel],
				futureSunsetDirectionModel: [...futureSunDirectionModel],
				futureSunsetDirectionScene,
				futureSunsetProjectionNdc: futureSunsetProjection.toArray(),
				cameraDirectionScene,
				cameraFieldOfViewDegrees: camera.fov,
				cameraPositionScene: camera.position.toArray(),
				frameCountBeforePublication: Number(
					application._sceneRuntime.canvas.dataset.flat32AtmosphereFrameCount ?? 0,
				),
				endpoint: application._endpointScene.describe(),
				meshes: application._endpointScene._meshes.map((mesh) => ({
					name: mesh.name,
					position: mesh.position.toArray(),
					castShadow: mesh.castShadow,
					receiveShadow: mesh.receiveShadow,
					shadowObjectKey: mesh.userData.shadowObjectKey ?? null,
				})),
				lights: lighting._lights.map((light) => ({
					name: light.name,
					intensity: light.intensity,
					castShadow: light.castShadow,
					directionToSource: light.userData.directionToSource ?? null,
					shadowMap: light.shadow
						? {width: light.shadow.map?.width ?? 0, height: light.shadow.map?.height ?? 0}
						: null,
				})),
			};
		}, sunsetFacts.directionToSunModel, control.camera);
		await page.addStyleTag({
			content: '.flat32-scene-controls,.flat32-time-panel{visibility:hidden!important}',
		});
		await page.waitForFunction(
			(priorFrameCount) =>
				Number(
					window.__shadowStillApplication?._sceneRuntime?.canvas?.dataset
						.flat32AtmosphereFrameCount ?? 0,
				) > priorFrameCount,
			{timeout: 10_000, polling: 16},
			sceneFacts.frameCountBeforePublication,
		);
		const canvas = await page.$('#flat32-canvas');
		requireValue(canvas, 'Flat32 canvas is unavailable.');
		const png = /** @type {Buffer} */ (await canvas.screenshot({type: 'png'}));
		const captureRelativePath = 'captures/san-jose-two-hours-before-sunset-fov55.png';
		await writeFile(path.join(runDirectory, ...captureRelativePath.split('/')), png, {flag: 'wx'});
		const pixels = await page.evaluate(async (base64) => {
			const image = new Image();
			image.src = `data:image/png;base64,${base64}`;
			await image.decode();
			const inspectionCanvas = document.createElement('canvas');
			inspectionCanvas.width = image.naturalWidth;
			inspectionCanvas.height = image.naturalHeight;
			const context = inspectionCanvas.getContext('2d', {willReadFrequently: true});
			if (context === null) throw new Error('PNG inspection canvas is unavailable.');
			context.drawImage(image, 0, 0);
			const displayPixels = context.getImageData(
				0,
				0,
				inspectionCanvas.width,
				inspectionCanvas.height,
			).data;
			let lumaSum = 0;
			let dark = 0;
			let bright = 0;
			const colors = new Set();
			const pixelCount = inspectionCanvas.width * inspectionCanvas.height;
			for (let pixel = 0; pixel < pixelCount; pixel += 1) {
				const offset = pixel * 4;
				const luma =
					displayPixels[offset] * 0.2126 +
					displayPixels[offset + 1] * 0.7152 +
					displayPixels[offset + 2] * 0.0722;
				lumaSum += luma;
				if (luma < 8) dark += 1;
				if (luma > 247) bright += 1;
				if (pixel % 997 === 0) {
					colors.add(`${displayPixels[offset]},${displayPixels[offset + 1]},${displayPixels[offset + 2]}`);
				}
			}
			return {
				width: inspectionCanvas.width,
				height: inspectionCanvas.height,
				uniqueSampledColors: colors.size,
				meanLuma: lumaSum / pixelCount,
				darkPixelFraction: dark / pixelCount,
				brightPixelFraction: bright / pixelCount,
			};
		}, png.toString('base64'));
		const browserDiagnostics = await page.evaluate(() => {
			const canvas = document.querySelector('#flat32-canvas');
			const shell = document.querySelector('.flat32-shell');
			const gl = canvas instanceof HTMLCanvasElement ? canvas.getContext('webgl2') : null;
			return {
				drawingBuffer: gl ? {width: gl.drawingBufferWidth, height: gl.drawingBufferHeight} : null,
				webglError: gl?.getError() ?? null,
				contextLost: gl?.isContextLost() ?? true,
				shellDataset: {...(shell instanceof HTMLElement ? shell.dataset : {})},
			};
		});
		const reviewMeshes = sceneFacts.meshes.filter((mesh) => mesh.shadowObjectKey !== null);
		const publishedDirectionMatchesRequest = sceneFacts.currentDirectionToSunModel.every(
			(value, index) => Math.abs(value - sceneFacts.requestedDirectionToSunModel[index]) <= 1e-12,
		);
		const accepted =
			pixels.width === control.capture.width &&
			pixels.height === control.capture.height &&
			pixels.uniqueSampledColors > 128 &&
			Math.abs(sceneFacts.futureSunsetProjectionNdc[0]) <= 1 &&
			Math.abs(sceneFacts.futureSunsetProjectionNdc[1]) <= 1 &&
			publishedDirectionMatchesRequest &&
			reviewMeshes.length === control.scene.expectedReviewObjectCount &&
			sceneFacts.endpoint.shadowCasterCount === control.scene.expectedReviewObjectCount &&
			sceneFacts.endpoint.shadowMapsInstalled === true &&
			sceneFacts.endpoint.shadowMapCount === control.scene.expectedShadowMapCount &&
			sceneFacts.endpoint.shadowMapWidth === control.scene.expectedShadowMapWidth &&
			sceneFacts.endpoint.shadowMapHeight === control.scene.expectedShadowMapHeight &&
			browserDiagnostics.drawingBuffer?.width === control.capture.width &&
			browserDiagnostics.drawingBuffer?.height === control.capture.height &&
			browserDiagnostics.webglError === 0 &&
			browserDiagnostics.contextLost === false;
		const terminalState = /** @type {ShadowStillTerminalState} */ (accepted ? 'accepted' : 'rejected');
		const result = {
			schemaId: 'distant-sun-shadow-animation-evidence-initial-still-result-v1',
			state: terminalState,
			rendererBoundary: 'production-one-degree-cache-composition-control',
			sharedRendererIntegration: 'deferred-until-static-composition-owner-review',
			control,
			sunsetFacts,
			sceneFacts,
			pixels,
			browserDiagnostics,
			browserMessages,
			capture: {path: captureRelativePath, byteLength: png.byteLength, sha256: sha256(png)},
		};
		await writeJson(path.join(runDirectory, 'result.json'), result);
		await writeJson(path.join(runDirectory, 'provenance.json'), {
			schemaId: 'distant-sun-shadow-animation-evidence-initial-still-provenance-v1',
			operation:
				'enable the production review-object scene before application start; select San Jose; resolve sunset; offset by minus 120 minutes; frame the exact future-sunset direction together with the canonical box line at 55 degrees; refresh the production shadow maps; capture the native-4K canvas',
			parents,
			source: {
				path: 'experiments/distant-sun-shadow-animation-evidence/run-initial-still.js',
				sha256: sha256(await readFile(fileURLToPath(import.meta.url))),
			},
			resultingArtifact: result.capture,
		});
		await progress('finalize', `Initial shadow still ${result.state}.`, result.state);
		clearInterval(heartbeat);
		await progressTail;
		const artifactManifest = await ArtifactManifest.create(runDirectory);
		await writeJson(path.join(runDirectory, 'artifact-manifest.json'), {
			schemaId: 'distant-sun-shadow-animation-evidence-artifact-manifest-v1',
			state: result.state,
			...artifactManifest,
		});
		console.log(JSON.stringify({runId, runDirectory, state: result.state, capture: result.capture}, null, 2));
		if (!accepted) process.exitCode = 1;
	} catch (error) {
		clearInterval(heartbeat);
		await progress('failed', error instanceof Error ? error.message : String(error), 'failed').catch(() => undefined);
		throw error;
	} finally {
		await browser?.close().catch(() => undefined);
	}
}

await main();
