#!/usr/bin/env node

import {execFile as executeFile} from 'node:child_process';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {promisify} from 'node:util';

import {canonicalDirectionFromCatalogCoordinate} from '../catalogs/bright-star-catalog-v50.js';
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
import {STELLAR_CATALOG_FRAME_ID} from '../stellar-screen-palette/contracts.js';
import {StellarScreenPaletteBuilder} from '../stellar-screen-palette/StellarScreenPaletteBuilder.js';
import {createPerspectiveCameraContract} from '../stellar-screen-palette/StellarScreenProjector.js';
import {
	composeSunDiskOverStellarPalette,
	deriveUniformSunDiskRadiance,
	projectUniformSunDiskPixelOverlap,
} from '../stellar-screen-palette/SunDiskScreenPaletteComposer.js';

const COMMAND = 'node scripts/extraterrestrial/runners/render-bruneton-source-exposure-comparison.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFileAsync = promisify(executeFile);
const SCREEN_PALETTE_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-screen-palette');
const HARNESS_ROOT = path.join(EXPERIMENT_ROOT, 'harness');
const CANDIDATE_ROOT = path.join(EXPERIMENT_ROOT, 'candidate');
const FIXTURES_ROOT = path.join(EXPERIMENT_ROOT, 'fixtures');
const VISUAL_ADAPTATION_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-visual-adaptation');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const PARENT = Object.freeze({
	runId: '000424-stellar-ferwerda-sunset-facing-solar-noon-sunset-plus-three-hours',
	artifactSetSha256: 'bb25bb1e23d4953ebcc20e8d1d9078bf24680dfcd75939bb732645a8358d324b',
});
const PARENT_ARTIFACTS = Object.freeze([
	'browser/stellar-runtime-input.json',
	'browser/diffuse-adapted-ferwerda-config.json',
]);
const TUNING_RUN = Object.freeze({runId: '000455-bruneton-global-exposure-curve-tuning', artifactSetSha256: '93aaad6091e54437f4724f424447c4ab9640a688965d21dd53226b0020a9b058'});
const LUMINANCE_LIFT_CURVE = Object.freeze({brightThreshold: 5, darkThreshold: 0.001, minimumGamma: 0.125, maximumLuminanceGain: 32768});
const NIGHT_MASK_REFERENCE = Object.freeze({
	runId: '000431-sun-layer-screen-palette-three-scenes',
	artifactSetSha256: 'e44822b5d0f7357103ab7b3d515b23ccb5687fa0d755c074489e2d5262446f19',
	artifactPath: 'captures/san-jose-sunset-facing-sunset-plus-three-hours.png',
	artifactSha256: '6ab4b820250101adadba9e36dff20d211ceebf0d6ec12da856e18dfd46c19c76',
});
const SOURCE_IRRADIANCE = Object.freeze([
	1.0688666666666664, 1.729673, 1.8620716666666661, 2.0220633333333335,
	1.9081540000000001, 1.8833910000000003, 1.8342466666666666,
	1.7674400000000001, 1.65952, 1.548102333333333, 1.45078,
	1.3409603333333335, 1.2624333333333335, 1.175208, 1.090824,
]);
const SUN_ANGULAR_RADIUS_RADIANS = 0.004675;

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
	const [algorithm32, flat32] = await Promise.all([createFileInventory(ALGORITHM32_ROOT), createFileInventory(FLAT32_ROOT)]);
	return {algorithm32, flat32};
}

async function serve(run) {
	const requests = [];
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/screen-palette/', SCREEN_PALETTE_ROOT],
		['/candidate/', CANDIDATE_ROOT],
		['/fixtures/', FIXTURES_ROOT],
		['/stellar-visual-adaptation/', VISUAL_ADAPTATION_ROOT],
		['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT],
	]);
	const server = createServer(async (request, response) => {
		try {
			const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
			requests.push(pathname);
			const route = [...roots].find(([prefix]) => pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) throw new Error('Unsupported three-scene path.');
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('Three-scene path escapes root.');
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) throw new Error('Three-scene target is not a real file.');
			const canonicalRoot = await realpath(root);
			const canonicalTarget = await realpath(target);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) throw new Error('Three-scene real path escapes root.');
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
	return {url: `http://127.0.0.1:${server.address().port}/browser/index.html`, requests, close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))};
}

function calculateSolarDirectionAt(timeIso) {
	const latitudeRadians = 37.3382 * Math.PI / 180;
	const longitudeDegrees = -121.8863;
	const time = new Date(timeIso);
	const yearStart = Date.UTC(time.getUTCFullYear(), 0, 1);
	const dateStart = Date.UTC(time.getUTCFullYear(), time.getUTCMonth(), time.getUTCDate());
	const dayOfYear = Math.floor((dateStart - yearStart) / 86400000) + 1;
	const utcHours = time.getUTCHours() + time.getUTCMinutes() / 60 + time.getUTCSeconds() / 3600 + time.getUTCMilliseconds() / 3600000;
	const gamma = 2 * Math.PI / 366 * (dayOfYear - 1 + (utcHours - 12) / 24);
	const declination = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
	const equationOfTimeMinutes = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
	const trueSolarMinutes = ((utcHours * 60 + equationOfTimeMinutes + 4 * longitudeDegrees) % 1440 + 1440) % 1440;
	const hourAngle = (trueSolarMinutes / 4 - 180) * Math.PI / 180;
	return [
		Math.sin(latitudeRadians) * Math.sin(declination) + Math.cos(latitudeRadians) * Math.cos(declination) * Math.cos(hourAngle),
		-Math.cos(declination) * Math.sin(hourAngle),
		Math.sin(declination) * Math.cos(latitudeRadians) - Math.cos(declination) * Math.sin(latitudeRadians) * Math.cos(hourAngle),
	];
}

function makeMembers(runtimeInput) {
	const transportById = new Map(runtimeInput.transportMembers.map((member) => [member.memberId, member.values]));
	return runtimeInput.members.map((member) => ({
		id: member.memberId,
		direction: canonicalDirectionFromCatalogCoordinate(member),
		spectralIrradiance: transportById.get(member.memberId),
	}));
}

function report(runId, proof) {
	return [
		`# ${runId}: Bruneton source-exposure spherical comparison`, '',
		'Conclusion: **accepted as a contained visual review**', '',
		...proof.pairs.map((pair) => `- ${pair.id}: paired Bruneton-left/source-exposure-right capture.`),
		'',
		'Every frame uses the screen index/native-15 palette as its sole visible celestial path and applies atmosphere transmittance before one condition-wide global luminance lift with a finite gain cap. Production remains unchanged.', '',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The comparison render accepts no arguments.');
	const run = await initializeRunRecord({
		slug: 'bruneton-source-luminance-lift-spherical-comparison',
		command: COMMAND,
		inputs: {schemaId: 'bruneton-source-luminance-lift-spherical-input-v2', parent: PARENT, parentArtifacts: PARENT_ARTIFACTS, tuningRun: TUNING_RUN, luminanceLiftCurve: LUMINANCE_LIFT_CURVE, times: ['solar-noon', 'sunset-minus-30-minutes', 'sunset', 'sunset-plus-30-minutes', 'sunset-plus-one-hour', 'sunset-plus-two-hours'], viewport: [640, 400]},
		provenance: {schemaId: 'bruneton-source-luminance-lift-spherical-provenance-v2', operation: 'rebuild accepted stellar/Sun screen palette; apply atmosphere transport once; derive receiver-local direct source luminance from atmosphere-transmitted source irradiance; apply unchanged Bruneton Figure-1 mapping followed by one condition-wide chroma-preserving luminance power curve whose effective gain is globally capped', implementation: ['scripts/extraterrestrial/stellar-screen-palette/BrunetonGlobalLuminanceLiftCurve.js', 'scripts/extraterrestrial/stellar-screen-palette/SourceDerivedLocalLuminance.js', 'scripts/extraterrestrial/stellar-screen-palette/BrunetonSourceLuminanceLiftColorDisplayModel.js', 'scripts/extraterrestrial/stellar-screen-palette/run-bruneton-source-exposure-comparison-browser.js'], exclusions: ['scattered-light adaptation', 'rod/cone response', 'night branch', 'scene-specific exposure', 'production change']},
		environment: {schemaId: 'sun-layer-screen-palette-three-scenes-environment-v1', node: process.version, platform: process.platform, architecture: process.arch, chromePath: CHROME_PATH},
		references: {schemaId: 'sun-layer-screen-palette-three-scenes-references-v1', design: 'agents/topics/extraterrestrial/stellar-screen-palette-design.md', plan: 'agents/topics/extraterrestrial/stellar-rendering-plan.md'},
	});
	let server;
	let browserProfilePath;
	try {
		await assertRepositoryIdentity();
		await Promise.all([lstat(CHROME_PATH), assertNoReparseEntries(SCREEN_PALETTE_ROOT, 'Screen-palette source'), assertNoReparseEntries(CANDIDATE_ROOT, 'Contained candidate'), assertNoReparseEntries(VISUAL_ADAPTATION_ROOT, 'Visual adaptation source')]);
		const productionBefore = await inventoryProduction();
		const parentRoot = path.join(RUNS_ROOT, PARENT.runId);
		await assertExistingRealPathContained(OUTPUT_ROOT, parentRoot, 'Accepted three-scene parent');
		const manifest = JSON.parse(await readFile(path.join(parentRoot, 'artifact-manifest.json'), 'utf8'));
		requireCondition(manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === PARENT.artifactSetSha256, 'Accepted three-scene parent changed.');
		const parentEvidence = {};
		for (const relativePath of PARENT_ARTIFACTS) {
			const record = manifest.artifacts.find((artifact) => artifact.path === relativePath);
			requireCondition(record, `Parent lacks ${relativePath}.`);
			const artifactPath = path.join(parentRoot, ...relativePath.split('/'));
			const sha256 = await sha256File(artifactPath);
			requireCondition(sha256 === record.sha256, `Parent artifact changed: ${relativePath}.`);
			parentEvidence[relativePath] = {byteLength: record.byteLength, sha256};
		}
		const tuningRoot = path.join(RUNS_ROOT, TUNING_RUN.runId);
		await assertExistingRealPathContained(OUTPUT_ROOT, tuningRoot, 'Accepted exposure tuning parent');
		const tuningManifest = JSON.parse(await readFile(path.join(tuningRoot, 'artifact-manifest.json'), 'utf8'));
		requireCondition(tuningManifest.conclusion === 'accepted' && tuningManifest.artifactSetSha256 === TUNING_RUN.artifactSetSha256, 'Accepted exposure tuning parent changed.');
		const runtimeInput = JSON.parse(await readFile(path.join(parentRoot, 'browser', 'stellar-runtime-input.json'), 'utf8'));
		const adaptation = JSON.parse(await readFile(path.join(parentRoot, 'browser', 'diffuse-adapted-ferwerda-config.json'), 'utf8'));
		const fixture = JSON.parse(await readFile(path.join(FIXTURES_ROOT, 'subjective-globe-context-scenes-v1.json'), 'utf8'));
		const sunsetFixture = fixture.scenes.find((scene) => scene.id === 'san-jose-globe-sunset');
		requireCondition(sunsetFixture, 'San Jose sunset fixture is missing.');
		const sunsetAzimuthDegrees = Math.atan2(sunsetFixture.directionToSourceUpEastNorth[1], sunsetFixture.directionToSourceUpEastNorth[2]) * 180 / Math.PI;
		const camera = createPerspectiveCameraContract({azimuthRadians: sunsetAzimuthDegrees * Math.PI / 180, elevationRadians: fixture.camera.viewElevationDegrees * Math.PI / 180, verticalFieldOfViewRadians: fixture.camera.verticalFovDegrees * Math.PI / 180, viewport: {width: fixture.camera.widthPixels, height: fixture.camera.heightPixels}});
		const sunsetMilliseconds = Date.parse(adaptation.conditions.sunset.timeIso);
		const timedScene = (id, timeLabel, offsetMinutes) => { const timeIso = new Date(sunsetMilliseconds + offsetMinutes * 60000).toISOString(); return {id, timeLabel, timeIso, directionToSourceUpEastNorth: offsetMinutes === 0 ? sunsetFixture.directionToSourceUpEastNorth : calculateSolarDirectionAt(timeIso)}; };
		const sceneDefinitions = [
			{id: 'solar-noon', timeLabel: 'Solar noon', timeIso: adaptation.conditions['solar-noon'].timeIso, directionToSourceUpEastNorth: calculateSolarDirectionAt(adaptation.conditions['solar-noon'].timeIso)},
			timedScene('sunset-minus-30-minutes', '30 minutes before sunset', -30),
			timedScene('sunset', 'Sunset', 0),
			timedScene('sunset-plus-30-minutes', '30 minutes after sunset', 30),
			timedScene('sunset-plus-one-hour', 'One hour after sunset', 60),
			timedScene('sunset-plus-two-hours', 'Two hours after sunset', 120),
		].map((scene) => ({...scene, viewAzimuthDegrees: sunsetAzimuthDegrees, viewElevationDegrees: fixture.camera.viewElevationDegrees}));
		const members = makeMembers(runtimeInput);
		const stellarSourceIdentity = `${runtimeInput.transportIdentity.id}:${runtimeInput.transportIdentity.contentHash}`;
		const builder = new StellarScreenPaletteBuilder();
		const sunRadiance = deriveUniformSunDiskRadiance(SOURCE_IRRADIANCE, SUN_ANGULAR_RADIUS_RADIANS);
		const products = {};
		const productEvidence = {};
		for (const scene of sceneDefinitions) {
			const start = performance.now();
			const stars = builder.build({members, catalogFrameId: STELLAR_CATALOG_FRAME_ID, observation: {instant: scene.timeIso, latitudeRadians: sunsetFixture.latitudeDegrees * Math.PI / 180, longitudeRadians: sunsetFixture.longitudeDegrees * Math.PI / 180}, camera, sourceIdentity: stellarSourceIdentity, numericalIdentity: 'cpu-binary64-accumulation-float32-palette-v1'});
			const [up, east, north] = scene.directionToSourceUpEastNorth;
			const coverage = projectUniformSunDiskPixelOverlap({camera, directionToSun: [east, north, up], angularRadiusRadians: SUN_ANGULAR_RADIUS_RADIANS});
			const composed = composeSunDiskOverStellarPalette({stellarProduct: stars, coverage, sunRadiance: sunRadiance.values, sourceIdentity: `${stellarSourceIdentity}+production-sun`});
			const milliseconds = performance.now() - start;
			const matrixPath = `browser/${scene.id}-matrix.u16`;
			const palettePath = `browser/${scene.id}-palette.f32`;
			await run.writeArtifact(matrixPath, Buffer.from(composed.pixelIndex.buffer, composed.pixelIndex.byteOffset, composed.pixelIndex.byteLength));
			await run.writeArtifact(palettePath, Buffer.from(composed.palette.buffer, composed.palette.byteOffset, composed.palette.byteLength));
			products[scene.id] = {id: scene.id, matrixUrl: `/${matrixPath}`, paletteUrl: `/${palettePath}`, viewport: composed.viewport, paletteEntryCount: composed.metadata.paletteEntryCount, stellarPaletteEntryCount: stars.metadata.paletteEntryCount, identity: JSON.stringify(composed.identities), sunOccupiedPixelCount: composed.metadata.sunOccupiedPixelCount, suppressedStellarPixelCount: composed.metadata.suppressedStellarPixelCount};
			productEvidence[scene.id] = {stellarOccupiedPixelCount: stars.metadata.occupiedPixelCount, stellarPaletteEntryCount: stars.metadata.paletteEntryCount, composed: composed.metadata, coverage: {policyIdentity: coverage.policyIdentity, classifications: coverage.classifications, boundarySegmentCount: coverage.boundarySegmentCount, footprint: coverage.footprint, projectedDiskAreaPixels: coverage.projectedDiskAreaPixels, coveredAreaPixels: coverage.coveredAreaPixels, minimumPositiveCoverage: coverage.minimumPositiveCoverage, maximumCoverage: coverage.maximumCoverage}, buildMilliseconds: milliseconds};
		}
		await run.writeJsonArtifact('browser/config.json', {schemaId: 'bruneton-source-luminance-lift-spherical-browser-config-v2', camera: {policy: 'fixed synchronized-sunset bearing', viewAzimuthDegrees: sunsetAzimuthDegrees, viewElevationDegrees: fixture.camera.viewElevationDegrees}, colorPolicy: 'Bruneton control versus one direct-source-derived global luminance lift with a finite gain cap', luminanceLiftCurve: LUMINANCE_LIFT_CURVE, scenes: sceneDefinitions, products});
		await run.writeArtifact('browser/index.html', '<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">const target=document.querySelector("#result");try{const {runBrunetonSourceExposureComparisonBrowser}=await import("/screen-palette/run-bruneton-source-exposure-comparison-browser.js");target.textContent=JSON.stringify(await runBrunetonSourceExposureComparisonBrowser());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>');
		server = await serve(run);
		browserProfilePath = assertLexicallyContained(OUTPUT_ROOT, path.join(OUTPUT_ROOT, 'browser-profiles', run.runId), 'Chrome comparison profile');
		await mkdir(browserProfilePath, {recursive: true});
		let browser;
		try {
			browser = await executeFileAsync(CHROME_PATH, ['--headless=new', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--disable-breakpad', '--disable-crash-reporter', '--disable-component-update', `--user-data-dir=${browserProfilePath}`, '--virtual-time-budget=360000', '--dump-dom', server.url], {timeout: 480000, maxBuffer: 32 * 1024 * 1024, windowsHide: true});
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
		requireCondition(resultText, 'Browser emitted no three-scene result.');
		const result = JSON.parse(resultText);
		if (result.error) throw new Error(`${result.error.name}: ${result.error.message}`);
		const captureSha256 = {};
		for (const scene of result.scenes) {
			const relativeCapturePath = `captures/${scene.colorMode}-${scene.id}.png`;
			await run.writeArtifact(relativeCapturePath, pngBytes(scene.imagePngDataUrl));
			captureSha256[`${scene.colorMode}:${scene.id}`] = await sha256File(path.join(run.runDirectory, ...relativeCapturePath.split('/')));
			delete scene.imagePngDataUrl;
			scene.capture = relativeCapturePath;
			scene.product = productEvidence[scene.id];
		}
		for (const pair of result.pairs) {
			pair.capture = `captures/paired-${pair.id}.png`;
			await run.writeArtifact(pair.capture, pngBytes(pair.imagePngDataUrl));
			delete pair.imagePngDataUrl;
			captureSha256[`paired:${pair.id}`] = await sha256File(path.join(run.runDirectory, ...pair.capture.split('/')));
		}
		const assertions = [];
		const assert = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		const expectedIds = 'solar-noon,sunset-minus-30-minutes,sunset,sunset-plus-30-minutes,sunset-plus-one-hour,sunset-plus-two-hours';
		assert(result.pairs.map((pair) => pair.id).join(',') === expectedIds, 'All six requested spherical scene pairs rendered in order.');
		assert(result.scenes.length === 12, 'Each spherical condition rendered through both Color models.');
		assert(result.singleCelestialOwner === true && result.scenes.every((scene) => scene.shaderIncludes.screenPalette && !scene.shaderIncludes.legacySun && !scene.shaderIncludes.legacyStars), 'Every frame uses the screen palette as its sole visible celestial owner.');
		assert(result.scenes.every((scene) => scene.shaderIncludes.singleTransmittanceExpression === 1), 'Every frame applies the shared view transmittance to the boundary palette exactly once.');
		assert(result.scenes.every((scene) => scene.shaderIncludes.bruneton && scene.shaderIncludes.cumulativeAtmosphere && scene.shaderIncludes.sceneInputCapture), 'Every frame retains Bruneton Color, cumulative atmosphere, and scene masking.');
		assert(result.scenes.every((scene) => scene.webglErrors.length === 0), `Every frame completes without a WebGL error: ${JSON.stringify(result.scenes.map((scene) => ({id: scene.id, errors: scene.webglErrors, programs: scene.programDiagnostics})))}`);
		assert(productEvidence.sunset.composed.sunOccupiedPixelCount > 0, 'The sunset-facing sunset cache contains the resolved Sun disk.');
		assert(productEvidence.sunset.coverage.classifications.partial > 0, 'The sunset disk contributes geometric fractional radiance to edge pixels.');
		assert(Math.abs(productEvidence.sunset.coverage.coveredAreaPixels - productEvidence.sunset.coverage.projectedDiskAreaPixels) <= 1e-9, 'Pixel overlap fractions conserve the in-viewport projected Sun area.');
		assert(result.scenes.filter((scene) => scene.colorMode === 'source-exposure').every((scene) => scene.image.nonBlack > 0), 'Every new-model full scene contains visible output.');
		const brightNew = result.scenes.filter((scene) => scene.colorMode === 'source-exposure' && ['solar-noon', 'sunset-minus-30-minutes', 'sunset'].includes(scene.id));
		const darkNew = result.scenes.filter((scene) => scene.colorMode === 'source-exposure' && ['sunset-plus-30-minutes', 'sunset-plus-one-hour', 'sunset-plus-two-hours'].includes(scene.id));
		const stellarDarkNew = darkNew.filter((scene) => ['sunset-plus-one-hour', 'sunset-plus-two-hours'].includes(scene.id));
		assert(brightNew.every((scene) => scene.sourceLight.gamma === 1), 'Solar noon through sunset retain exact Bruneton identity gamma one.');
		assert(['solar-noon', 'sunset-minus-30-minutes', 'sunset'].every((id) => captureSha256[`bruneton:${id}`] === captureSha256[`source-exposure:${id}`]), 'Solar noon through sunset are byte-identical to Bruneton.');
		assert(darkNew.every((scene) => scene.sourceLight.gamma === LUMINANCE_LIFT_CURVE.minimumGamma), 'All three below-horizon conditions reach the same finite shadow lift without a night branch.');
		assert(darkNew.every((scene) => scene.shaderIncludes.boundedLuminanceGain), 'Every lifted frame caps the global luminance gain without a pixel or source classification.');
		assert(darkNew[0].image.maximumChannel <= 220 && darkNew[0].image.exactWhitePixelCount === 0, 'The 30-minute twilight frame retains substantial headroom below white.');
		const meanDisplayLuminance = (scene) => scene.image.meanRgb[0] * 0.2126 + scene.image.meanRgb[1] * 0.7152 + scene.image.meanRgb[2] * 0.0722;
		assert(meanDisplayLuminance(darkNew[1]) <= meanDisplayLuminance(darkNew[0]) * 0.15, 'The one-hour frame remains a dark continuation of twilight rather than exposing sub-byte residual sky into a bright field.');
		assert(stellarDarkNew.every((scene) => scene.stellarImage.visibleCount >= 30 && scene.stellarImage.maximumChannel >= 50 && scene.stellarImage.exactWhiteCount === 0 && scene.stellarImage.distinctRgbCount >= 20), 'Atmosphere-transmitted one- and two-hour stars are visibly bright, nonwhite, and brightness-varied.');
		const closure = await buildStaticModuleClosure({candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/render-bruneton-source-exposure-comparison.js', 'stellar-screen-palette/run-bruneton-source-exposure-comparison-browser.js', 'stellar-screen-palette/ScreenPaletteCelestialRuntimeParticipant.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:http', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util']});
		const productionAfter = await inventoryProduction();
		assertFileInventoriesEqual(productionBefore.algorithm32, productionAfter.algorithm32, 'Algorithm32 production inventory');
		assertFileInventoriesEqual(productionBefore.flat32, productionAfter.flat32, 'Flat32 production inventory');
		const proof = {proofId: 'bruneton-source-luminance-lift-spherical-comparison-v2', accepted: true, parent: PARENT, parentArtifacts: parentEvidence, tuningRun: TUNING_RUN, luminanceLiftCurve: LUMINANCE_LIFT_CURVE, camera: result.camera, colorPolicy: result.colorPolicy, products: productEvidence, captureSha256, scenes: result.scenes, pairs: result.pairs, assertions, containment: {algorithm32FileCount: productionAfter.algorithm32.fileCount, flat32FileCount: productionAfter.flat32.fileCount, moduleClosureFileCount: closure.files.length, moduleClosureEdgeCount: closure.edges.length}};
		await run.writeJsonArtifact('evidence/spherical-comparison.json', proof);
		const finalManifest = await run.finalize({conclusion: 'accepted', result: {proofId: proof.proofId, captures: Object.fromEntries(result.pairs.map((pair) => [pair.id, pair.capture]))}, report: report(run.runId, proof)});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: finalManifest.artifactSetSha256, captures: Object.fromEntries(result.pairs.map((pair) => [pair.id, pair.capture]))}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const finalManifest = await run.finalize({conclusion: 'failed', result: {proofId: 'sun-layer-screen-palette-three-scenes-v1', error: detail}, report: `# ${run.runId}: Screen-palette Sun three-scene review\n\nConclusion: **failed**\n\n${detail.message}\n`});
			process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: finalManifest.artifactSetSha256, error: detail}, null, 2)}\n`);
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
