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
	CANDIDATE_ROOT,
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	OUTPUT_ROOT,
	REPOSITORY_ROOT,
	RUNS_ROOT,
	assertLexicallyContained,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';
import {ReceiverLocalDiffuseSkyCalculator} from '../stellar-screen-palette/ReceiverLocalDiffuseSkyCalculator.js';
import {deriveFerwerdaSteadyStateParameters} from '../stellar-visual-adaptation/FerwerdaVisualAdaptationModel.js';

const THREE_TIME_ARGUMENT = '--sunset-facing-three-times';
const threeTimeMode = process.argv[2] === THREE_TIME_ARGUMENT;
const COMMAND = `node scripts/extraterrestrial/runners/render-stellar-ferwerda-diffuse-adapted-full-scene-san-jose.js${threeTimeMode ? ` ${THREE_TIME_ARGUMENT}` : ''}`;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFileAsync = promisify(executeFile);
const HARNESS_ROOT = path.join(EXPERIMENT_ROOT, 'harness');
const FIXTURES_ROOT = path.join(EXPERIMENT_ROOT, 'fixtures');
const VISUAL_ADAPTATION_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-visual-adaptation');
const SCREEN_PALETTE_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-screen-palette');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const STELLAR_PARENT = Object.freeze({runId: '000395-stellar-first-render-san-jose-sunset-plus-three-hours-pure-bruneton', artifactSetSha256: '65ddd198b881fd171e0e0da81e92b49635fe43e23f1168f9989d24dced9c54a2', artifact: 'browser/stellar-runtime-input.json'});
const ATMOSPHERE_PARENT = Object.freeze({runId: '000258-spectral-color-stage1-ledger', artifactSetSha256: 'abe89535535f523d4d04a0a5e9fe5cef86bff441f274cd998103e0121a7cacd5', artifact: 'evidence/spectral-ledger.json'});
const DIRECT_PARENT = Object.freeze({runId: '000302-spectral-color-local-light-record', artifactSetSha256: 'dedb03462344654252096e9879972bfa21a3328ba0b18b5c6db9dfd4bc4cb9c1', artifact: 'evidence/local-light-record.json'});
const PRIOR_RENDER_PARENT = Object.freeze({runId: '000420-stellar-ferwerda-full-scene-sunset-noon-review', artifactSetSha256: 'df557beb07a36b350d8b525cf9d12a57afce7f6688ca350a9680993a15761fa4', artifact: 'evidence/full-scene-review.json'});
const STARLIGHT_REFERENCE_PARENT = Object.freeze({runId: '000417-stellar-ferwerda-steady-state-visibility', artifactSetSha256: '9b25c63c418beba34815e8cb561e80757fe3aa8bcefd696ee368a323d7a8bd72', artifact: 'evidence/ferwerda-visual-adaptation.json'});

function requireCondition(condition, message) { if (!condition) throw new Error(message); }
function pngBytes(value) { const match = /^data:image\/png;base64,(?<body>[A-Za-z0-9+/=]+)$/u.exec(value); if (!match) throw new Error('Diffuse-adapted browser did not return a PNG.'); return Buffer.from(match.groups.body, 'base64'); }
function contentType(target) { if (target.endsWith('.js')) return 'text/javascript; charset=utf-8'; if (target.endsWith('.json')) return 'application/json; charset=utf-8'; if (target.endsWith('.html')) return 'text/html; charset=utf-8'; return 'application/octet-stream'; }
async function inventoryProduction() { const [algorithm32, flat32] = await Promise.all([createFileInventory(ALGORITHM32_ROOT), createFileInventory(FLAT32_ROOT)]); return {algorithm32, flat32}; }

async function loadAcceptedArtifact(parent) {
	const root = path.join(RUNS_ROOT, parent.runId);
	await assertExistingRealPathContained(OUTPUT_ROOT, root, 'Accepted parent run');
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	requireCondition(manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === parent.artifactSetSha256, `Accepted parent ${parent.runId} changed.`);
	const record = manifest.artifacts.find((artifact) => artifact.path === parent.artifact);
	requireCondition(record, `Accepted parent lacks ${parent.artifact}.`);
	const artifactPath = path.join(root, ...parent.artifact.split('/'));
	requireCondition(await sha256File(artifactPath) === record.sha256, `Accepted artifact ${parent.artifact} changed.`);
	return {bytes: await readFile(artifactPath), record};
}

async function serve(run) {
	const requests = [];
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/harness/', HARNESS_ROOT],
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
			if (!route || pathname.includes('..')) throw new Error('Unsupported path.');
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('Path escapes root.');
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) throw new Error('Target is not a real file.');
			const canonicalRoot = await realpath(root);
			const canonicalTarget = await realpath(target);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) throw new Error('Real path escapes root.');
			response.writeHead(200, {'content-type': contentType(target)});
			response.end(await readFile(canonicalTarget));
		} catch (error) {
			response.writeHead(404, {'content-type': 'text/plain'});
			response.end(error.message);
		}
	});
	await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
	return {url: `http://127.0.0.1:${server.address().port}/browser/index.html`, requests, close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))};
}

function uniformSkyControl(calculator, sourceSamples) {
	const luminance = 7.25;
	const radiance = Array(15).fill(0.125);
	const samples = sourceSamples.map((sample) => ({
		role: 'upper-hemisphere',
		geometryClassification: 'valid-sky-ray',
		pathRadiance: radiance,
		projectedSolidAngleSteradians: sample.projectedSolidAngleSteradians,
		derived: {pathRadiance: {luminanceCdPerSquareMeter: luminance}},
	}));
	const measured = calculator.measure(samples);
	return {
		measured,
		expectedSpectralIrradiance: radiance.map((value) => value * Math.PI),
		expectedLuminance: luminance,
	};
}

function report(runId, proof) {
	return [
		`# ${runId}: ${threeTimeMode ? 'sunset-facing three-time' : 'diffuse-data-adapted'} Ferwerda full-scene review`, '',
		'Conclusion: **accepted as a contained data-derivation and visual comparison**', '',
		...proof.scenes.map((scene) => `- ${scene.id}: adaptation ${proof.conditions[scene.id].measurement.adaptingLuminanceProxy.value} cd m^-2; exact white ${scene.image.exactWhitePixelCount}; maximum byte ${scene.image.maximumChannel}; mean RGB ${scene.image.meanRgb.join(', ')}.`),
		'',
		threeTimeMode
			? 'The camera is fixed at the synchronized sunset bearing for all three times. Noon and sunset adaptation use accepted atmosphere-owned native-15 upper-hemisphere path-radiance data; the three-hour scene uses the already-qualified Ferwerda 0.001 cd m^-2 starlight reference because no exact three-hour diffuse hemisphere exists. No parameters were tuned.'
			: 'The adaptation input is derived once per scene from the accepted atmosphere-owned native-15 upper-hemisphere path-radiance data. It is not a framebuffer probe and excludes direct celestial and scene-geometry radiance. No parameters were tuned.', ''
	].join('\n');
}

async function main() {
	if ((!threeTimeMode && process.argv.length !== 2) || (threeTimeMode && process.argv.length !== 3)) {
		throw new Error(`The diffuse-adapted full-scene comparison accepts only optional ${THREE_TIME_ARGUMENT}.`);
	}
	const run = await initializeRunRecord({
		slug: threeTimeMode ? 'stellar-ferwerda-sunset-facing-solar-noon-sunset-plus-three-hours' : 'stellar-ferwerda-diffuse-data-adapted-full-scene-sunset-noon',
		command: COMMAND,
		inputs: {schemaId: threeTimeMode ? 'stellar-ferwerda-sunset-facing-three-time-inputs-v1' : 'stellar-ferwerda-diffuse-data-adapted-inputs-v1', conditions: threeTimeMode ? ['solar-noon', 'sunset', 'sunset-plus-three-hours'] : ['sunset', 'solar-noon'], parents: {stellar: STELLAR_PARENT, atmosphere: ATMOSPHERE_PARENT, direct: DIRECT_PARENT, priorRender: PRIOR_RENDER_PARENT, ...(threeTimeMode ? {starlightReference: STARLIGHT_REFERENCE_PARENT} : {})}, display: {maximumLuminance: 80, adaptationLuminance: 40, units: 'cd m^-2'}, resolution: [640, 400]},
		provenance: {schemaId: threeTimeMode ? 'stellar-ferwerda-sunset-facing-three-time-provenance-v1' : 'stellar-ferwerda-diffuse-data-adapted-provenance-v1', operation: threeTimeMode ? 'derive the camera azimuth from the synchronized sunset local direction and hold it fixed; retain accepted diffuse-data adaptation at noon and sunset; reuse the qualified Ferwerda starlight reference at sunset plus three hours' : 'cosine-integrate accepted native-15 atmospheric path-radiance hemisphere samples once per condition; project their accepted photopic luminances through the same weights; divide illuminance by pi; drive one condition-wide Ferwerda mapping', implementation: ['scripts/extraterrestrial/stellar-screen-palette/ReceiverLocalDiffuseSkyCalculator.js','scripts/extraterrestrial/harness/three-subjective-globe-scenes-browser-entry.js','scripts/extraterrestrial/stellar-visual-adaptation/FerwerdaFullSceneColorDisplayModel.js'], exclusions: ['direct celestial radiance','stellar radiance','scene geometry radiance','framebuffer probe','temporal smoothing','parameter tuning']},
		environment: {schemaId: 'stellar-ferwerda-diffuse-data-adapted-environment-v1', node: process.version, platform: process.platform, architecture: process.arch, chromePath: CHROME_PATH},
		references: {schemaId: 'stellar-ferwerda-diffuse-data-adapted-references-v1', plan: 'agents/topics/extraterrestrial/stellar-rendering-plan.md', design: 'agents/topics/extraterrestrial/sun-disk-appearance-design.md', ferwerda: 'https://jamesferwerda.com/wp-content/uploads/2015/06/j03_ferwerda96_sig.pdf'},
	});
	let server;
	let browserProfilePath;
	try {
		await assertRepositoryIdentity();
		await Promise.all([lstat(CHROME_PATH), assertNoReparseEntries(HARNESS_ROOT, 'Harness source'), assertNoReparseEntries(CANDIDATE_ROOT, 'Candidate source'), assertNoReparseEntries(VISUAL_ADAPTATION_ROOT, 'Visual-adaptation source'), assertNoReparseEntries(SCREEN_PALETTE_ROOT, 'Screen-palette source')]);
		const productionBefore = await inventoryProduction();
		const [stellarInput, atmosphereInput, directInput, priorInput, starlightReferenceInput] = await Promise.all([loadAcceptedArtifact(STELLAR_PARENT), loadAcceptedArtifact(ATMOSPHERE_PARENT), loadAcceptedArtifact(DIRECT_PARENT), loadAcceptedArtifact(PRIOR_RENDER_PARENT), threeTimeMode ? loadAcceptedArtifact(STARLIGHT_REFERENCE_PARENT) : null]);
		const ledger = JSON.parse(atmosphereInput.bytes.toString('utf8'));
		const directRecord = JSON.parse(directInput.bytes.toString('utf8'));
		const priorReview = JSON.parse(priorInput.bytes.toString('utf8'));
		const calculator = new ReceiverLocalDiffuseSkyCalculator();
		const conditions = {};
		for (const [id, ledgerId, directKey] of [['sunset', 'sunset', 'spherical-distant/sunset'], ['solar-noon', 'noon', 'spherical-distant/noon']]) {
			const condition = ledger.spherical.conditions.find((candidate) => candidate.id === ledgerId);
			const direct = directRecord.records.find((candidate) => candidate.key === directKey);
			requireCondition(condition?.hemisphere?.length, `Missing ${ledgerId} hemisphere data.`);
			requireCondition(direct, `Missing ${directKey} direct-light data.`);
			const measurement = calculator.measure(condition.hemisphere);
			conditions[id] = {
				timeIso: condition.timeIso,
				measurement,
				directAdaptingLuminanceProxy: direct.adaptingLuminanceProxy,
				ferwerda: deriveFerwerdaSteadyStateParameters({worldAdaptationLuminance: measurement.adaptingLuminanceProxy.value, displayMaximumLuminance: 80, displayAdaptationLuminance: 40}),
			};
		}
		if (threeTimeMode) {
			const starlightReference = JSON.parse(starlightReferenceInput.bytes.toString('utf8')).gpu.ferwerda;
			requireCondition(starlightReference.worldAdaptationLuminance === 0.001, 'Qualified starlight reference adaptation changed.');
			conditions['sunset-plus-three-hours'] = {
				timeIso: '2024-06-21T06:26:03.503Z',
				measurement: {
					method: 'qualified-ferwerda-starlight-reference',
					adaptingLuminanceProxy: {value: starlightReference.worldAdaptationLuminance, units: 'cd m^-2'},
				},
				ferwerda: starlightReference,
			};
		}
		const control = uniformSkyControl(calculator, ledger.spherical.conditions.find((condition) => condition.id === 'sunset').hemisphere);
		await run.writeArtifact('browser/stellar-runtime-input.json', stellarInput.bytes);
		await run.writeJsonArtifact('browser/diffuse-adapted-ferwerda-config.json', {schemaId: threeTimeMode ? 'sunset-facing-three-time-ferwerda-browser-config-v1' : 'diffuse-adapted-ferwerda-browser-config-v1', conditions});
		const browserFunction = threeTimeMode ? 'runThreeSubjectiveGlobeSunsetFacingThreeTimeComparison' : 'runThreeSubjectiveGlobeDiffuseAdaptedFerwerdaFullSceneComparison';
		await run.writeArtifact('browser/index.html', `<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">import {${browserFunction} as run} from "/harness/three-subjective-globe-scenes-browser-entry.js";const target=document.querySelector("#result");try{target.textContent=JSON.stringify(await run());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>`);
		server = await serve(run);
		browserProfilePath = assertLexicallyContained(OUTPUT_ROOT, path.join(OUTPUT_ROOT, 'browser-profiles', run.runId), 'Chrome profile');
		await mkdir(browserProfilePath, {recursive: true});
		let browser;
		try {
			browser = await executeFileAsync(CHROME_PATH, ['--headless=new','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--disable-breakpad','--disable-crash-reporter','--disable-component-update',`--user-data-dir=${browserProfilePath}`,'--virtual-time-budget=360000','--dump-dom',server.url], {timeout: 480000, maxBuffer: 32 * 1024 * 1024, windowsHide: true});
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
		requireCondition(resultText, 'Browser emitted no diffuse-adapted result.');
		const result = JSON.parse(resultText);
		if (result.error) throw new Error(`${result.error.name}: ${result.error.message}`);
		const names = threeTimeMode
			? {sunset: 'san-jose-sunset-facing-sunset.png', 'solar-noon': 'san-jose-sunset-facing-solar-noon.png', 'sunset-plus-three-hours': 'san-jose-sunset-facing-sunset-plus-three-hours.png'}
			: {sunset: 'san-jose-sunset-ferwerda-diffuse-data-adapted-full-scene.png', 'solar-noon': 'san-jose-solar-noon-ferwerda-diffuse-data-adapted-full-scene.png'};
		const scenes = [];
		for (const scene of result.scenes) {
			const id = scene.timeLabel === 'Sunset'
				? 'sunset'
				: scene.timeLabel === 'Solar noon'
					? 'solar-noon'
					: 'sunset-plus-three-hours';
			requireCondition(names[id], `Unexpected rendered time label ${scene.timeLabel}.`);
			await run.writeArtifact(`captures/${names[id]}`, pngBytes(scene.imagePngDataUrl));
			delete scene.imagePngDataUrl;
			scenes.push({...scene, id, imagePath: `captures/${names[id]}`});
		}
		const assertions = [];
		const assert = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		assert(control.measured.sampleCount === 32, 'Uniform-sky control uses the fixed 32-sample hemisphere.');
		assert(Math.abs(control.measured.projectedSolidAngleSteradians - Math.PI) <= 1e-12, 'Hemisphere projected solid angle integrates to pi.');
		assert(Math.abs(control.measured.adaptingLuminanceProxy.value - control.expectedLuminance) <= 1e-12, 'Uniform-sky E_v/pi reproduces its input luminance.');
		assert(control.measured.diffuseSpectralIrradiance.values.every((value, index) => Math.abs(value - control.expectedSpectralIrradiance[index]) <= 1e-15), 'Uniform-sky native-15 irradiance equals pi times radiance in every channel.');
		assert(conditions.sunset.measurement.adaptingLuminanceProxy.value > conditions.sunset.directAdaptingLuminanceProxy.value, 'Sunset diffuse equivalent luminance exceeds the direct-source proxy.');
		assert(conditions['solar-noon'].measurement.adaptingLuminanceProxy.value < conditions['solar-noon'].directAdaptingLuminanceProxy.value, 'Noon diffuse equivalent luminance is below the direct-source proxy.');
		const expectedSceneIds = threeTimeMode ? 'solar-noon,sunset,sunset-plus-three-hours' : 'solar-noon,sunset';
		assert(scenes.map((scene) => scene.id).sort().join(',') === expectedSceneIds, threeTimeMode ? 'All three sunset-facing scenes rendered.' : 'Both diffuse-adapted scenes rendered.');
		assert(scenes.every((scene) => scene.shaderIncludes.ferwerdaFullScene && scene.shaderIncludes.cumulativeAtmosphere && scene.shaderIncludes.sceneInputCapture), 'Every scene executes the full-scene Ferwerda, atmosphere, and scene-capture paths.');
		if (threeTimeMode) {
			assert(Math.abs(result.camera.viewAzimuthDegrees - -59.99625193137896) <= 1e-12, 'Camera azimuth is derived from the synchronized sunset direction in the camera local-north convention.');
			assert(scenes.every((scene) => Math.abs(scene.viewAzimuthDegrees - result.camera.viewAzimuthDegrees) <= 1e-12), 'All three scenes hold the same sunset-facing camera azimuth.');
			assert(conditions['sunset-plus-three-hours'].measurement.adaptingLuminanceProxy.value === 0.001, 'Three-hour scene uses the qualified Ferwerda starlight reference adaptation.');
		}
		const closure = await buildStaticModuleClosure({candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/render-stellar-ferwerda-diffuse-adapted-full-scene-san-jose.js','harness/three-subjective-globe-scenes-browser-entry.js','stellar-screen-palette/ReceiverLocalDiffuseSkyCalculator.js','stellar-visual-adaptation/FerwerdaFullSceneColorDisplayModel.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process','node:crypto','node:fs','node:fs/promises','node:http','node:module','node:os','node:path','node:url','node:util','node:zlib']});
		const productionAfter = await inventoryProduction();
		assertFileInventoriesEqual(productionBefore.algorithm32, productionAfter.algorithm32, 'Algorithm32 production inventory');
		assertFileInventoriesEqual(productionBefore.flat32, productionAfter.flat32, 'Flat32 production inventory');
		const priorScenes = Object.fromEntries(priorReview.scenes.map((scene) => [scene.id, scene.image]));
		const proof = {proofId: threeTimeMode ? 'stellar-ferwerda-sunset-facing-three-time-v1' : 'stellar-ferwerda-diffuse-data-adapted-full-scene-sunset-noon-v1', accepted: true, camera: result.camera ?? null, conditions, uniformSkyControl: control, scenes, comparisonToDirectProxyRender: Object.fromEntries(scenes.filter((scene) => priorScenes[scene.id]).map((scene) => [scene.id, {directProxyImage: priorScenes[scene.id], diffuseDataImage: scene.image}])), parents: {stellar: STELLAR_PARENT, atmosphere: ATMOSPHERE_PARENT, direct: DIRECT_PARENT, priorRender: PRIOR_RENDER_PARENT, ...(threeTimeMode ? {starlightReference: STARLIGHT_REFERENCE_PARENT} : {})}, assertions, claimBoundary: threeTimeMode ? 'contained fixed-sunset-bearing three-time full-scene comparison; noon and sunset use atmosphere-data diffuse adaptation; three hours uses the qualified Ferwerda starlight reference; excludes temporal adaptation, acuity, ambient geometry lighting, tuning, and production change' : 'contained camera-independent atmosphere-data diffuse adaptation and full-scene visual comparison; excludes direct celestial contribution from adaptation, scene-derived adaptation, temporal adaptation, acuity, ambient geometry lighting, tuning, and production change', containment: {algorithm32FileCount: productionAfter.algorithm32.fileCount, flat32FileCount: productionAfter.flat32.fileCount, moduleClosureFileCount: closure.files.length, moduleClosureEdgeCount: closure.edges.length}};
		await run.writeJsonArtifact('evidence/diffuse-data-adapted-full-scene-review.json', proof);
		const manifest = await run.finalize({conclusion: 'accepted', result: {proofId: proof.proofId, adaptingLuminance: Object.fromEntries(Object.entries(conditions).map(([id, condition]) => [id, condition.measurement.adaptingLuminanceProxy])), images: Object.fromEntries(scenes.map((scene) => [scene.id, scene.imagePath])), summaries: Object.fromEntries(scenes.map((scene) => [scene.id, scene.image]))}, report: report(run.runId, proof)});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, adaptingLuminance: Object.fromEntries(Object.entries(conditions).map(([id, condition]) => [id, condition.measurement.adaptingLuminanceProxy.value])), images: Object.fromEntries(scenes.map((scene) => [scene.id, scene.imagePath]))}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({conclusion: 'failed', result: {proofId: threeTimeMode ? 'stellar-ferwerda-sunset-facing-three-time-v1' : 'stellar-ferwerda-diffuse-data-adapted-full-scene-sunset-noon-v1', error: detail}, report: `# ${run.runId}: ${threeTimeMode ? 'sunset-facing three-time' : 'diffuse-data-adapted'} full-scene review\n\nConclusion: **failed**\n\n${detail.message}\n`});
			process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`);
		} catch (finalizationError) {
			process.stderr.write(`${JSON.stringify({conclusion: 'unsealed-failure', error: detail, finalizationError: String(finalizationError)}, null, 2)}\n`);
		}
		process.exitCode = 1;
	} finally {
		if (server) await server.close().catch(() => {});
		if (browserProfilePath) await rm(browserProfilePath, {recursive: true, force: true}).catch(() => {});
	}
}

await main();
