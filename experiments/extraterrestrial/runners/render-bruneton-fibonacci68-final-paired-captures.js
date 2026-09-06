#!/usr/bin/env node

import {execFile as executeFile} from 'node:child_process';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {promisify} from 'node:util';

import {sha256File} from '../harness/lib/atomic-files.js';
import {
	assertCreatablePathContained,
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	createSelectedFileInventory,
} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	OUTPUT_ROOT,
	REPOSITORY_ROOT,
	RUNS_ROOT,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';
import {
	BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
	DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
} from '../stellar-screen-palette/BrunetonExtraterrestrialVisibilityColorDisplayModel.js';
import {verifyRun} from './verify-run.js';

const COMMAND =
	'node experiments/extraterrestrial/runners/render-bruneton-fibonacci68-final-paired-captures.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFileAsync = promisify(executeFile);
const SCREEN_PALETTE_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-screen-palette');
const CANDIDATE_ROOT = path.join(EXPERIMENT_ROOT, 'candidate');
const BASELINE_ROOT = path.join(EXPERIMENT_ROOT, 'baseline');
const FIXTURES_ROOT = path.join(EXPERIMENT_ROOT, 'fixtures');
const THREE_ROOT = path.join(EXPERIMENT_NODE_MODULES_ROOT, 'three');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const CPU_COLOR_SMOKE_RELATIVE_PATH =
	'stellar-screen-palette/smoke-bruneton-extraterrestrial-visibility-color.js';
const CPU_COLOR_SMOKE_PATH = path.join(
	EXPERIMENT_ROOT,
	...CPU_COLOR_SMOKE_RELATIVE_PATH.split('/'),
);
const FLAT_TRANSPORT_PACKING_SMOKE_RELATIVE_PATH =
	'stellar-screen-palette/smoke-controlled-flat-fibonacci68-transport-packing.js';
const FLAT_TRANSPORT_PACKING_SMOKE_PATH = path.join(
	EXPERIMENT_ROOT,
	...FLAT_TRANSPORT_PACKING_SMOKE_RELATIVE_PATH.split('/'),
);
const FLAT_TRANSPORT_PACKING_POLICY_ID =
	'contained-flat-fibonacci68-transport-query-column-tiling-v1';
const FLAT_TRANSPORT_GPU_PROOF_SCHEMA_ID =
	'flat-fibonacci68-packed-transport-gpu-proof-v1';
const FLAT_TRANSPORT_GPU_PROBE_POLICY_ID =
	'contained-flat-fibonacci68-packed-transport-gpu-probe-v1';
const SOURCE_EXPOSURE_CURVE = Object.freeze({
	brightThreshold: 5,
	darkThreshold: 0.001,
	maximumExposureGain: 131072,
});
const SPHERICAL_SCENE_IDS = Object.freeze([
	'solar-noon',
	'sunset-minus-30-minutes',
	'sunset',
	'sunset-plus-30-minutes',
	'sunset-plus-one-hour',
	'sunset-plus-two-hours',
]);
const FLAT_STATE_IDS = Object.freeze(['flat-0', 'flat-90', 'flat-180']);
const EXPECTED_PARENT_CAMERA = Object.freeze({
	policy: 'fixed synchronized-sunset bearing',
	viewAzimuthDegrees: -59.99625193137896,
	viewElevationDegrees: 5,
});
const EXPECTED_SUBJECTIVE_CAMERA = Object.freeze({
	widthPixels: 640,
	heightPixels: 400,
	verticalFovDegrees: 78,
	observerHeightMeters: 1.7,
	viewElevationDegrees: 5,
});
const EXPECTED_FLAT_CAMERA = Object.freeze({
	widthPixels: 720,
	heightPixels: 414,
	verticalFovDegrees: 70,
	viewElevationDegrees: 0,
	viewAzimuthDegrees: 0,
});
const EXPECTED_FLAT_STATES = Object.freeze([
	Object.freeze({
		id: 'flat-0',
		timeLabel: 'Flat 0 / closest approach',
		centerMeters: Object.freeze([0, 6283427.593407407, 4828032]),
		cacheRadialMaximumMeters: 6283427.593407407,
	}),
	Object.freeze({
		id: 'flat-45',
		timeLabel: 'Flat 45',
		centerMeters: Object.freeze([
			-8882196.550764412,
			9962553.550560005,
			4828032,
		]),
		cacheRadialMaximumMeters: 13347130.35877701,
	}),
	Object.freeze({
		id: 'flat-90',
		timeLabel: 'Flat 90',
		centerMeters: Object.freeze([
			-12561323.593082156,
			18844750.419161934,
			4828032,
		]),
		cacheRadialMaximumMeters: 22647548.846853744,
	}),
	Object.freeze({
		id: 'flat-180',
		timeLabel: 'Flat 180',
		centerMeters: Object.freeze([
			-24595.66610387899,
			31412707.263672166,
			4828032,
		]),
		cacheRadialMaximumMeters: 31412716.886663348,
	}),
]);
const EXPECTED_SPHERICAL_SCENES = Object.freeze([
	Object.freeze({
		id: 'solar-noon',
		timeLabel: 'Solar noon',
		timeIso: '2024-06-20T20:08:00.000Z',
		directionToSourceUpEastNorth: Object.freeze([
			0.9707655273706587,
			0.0033828659702589154,
			-0.24000593135711085,
		]),
		viewAzimuthDegrees: -59.99625193137896,
		viewElevationDegrees: 5,
	}),
	Object.freeze({
		id: 'sunset-minus-30-minutes',
		timeLabel: '30 minutes before sunset',
		timeIso: '2024-06-21T02:56:03.503Z',
		directionToSourceUpEastNorth: Object.freeze([
			0.0923878178525708,
			-0.8980396643282573,
			0.43010376934599287,
		]),
		viewAzimuthDegrees: -59.99625193137896,
		viewElevationDegrees: 5,
	}),
	Object.freeze({
		id: 'sunset',
		timeLabel: 'Sunset',
		timeIso: '2024-06-21T03:26:03.503Z',
		directionToSourceUpEastNorth: Object.freeze([
			0.0007345177958817672,
			-0.8659924602538107,
			0.500056516073093,
		]),
		viewAzimuthDegrees: -59.99625193137896,
		viewElevationDegrees: 5,
	}),
	Object.freeze({
		id: 'sunset-plus-30-minutes',
		timeLabel: '30 minutes after sunset',
		timeIso: '2024-06-21T03:56:03.503Z',
		directionToSourceUpEastNorth: Object.freeze([
			-0.08730392370803039,
			-0.8189490547365188,
			0.5671864513996652,
		]),
		viewAzimuthDegrees: -59.99625193137896,
		viewElevationDegrees: 5,
	}),
	Object.freeze({
		id: 'sunset-plus-one-hour',
		timeLabel: 'One hour after sunset',
		timeIso: '2024-06-21T04:26:03.503Z',
		directionToSourceUpEastNorth: Object.freeze([
			-0.16946677586889025,
			-0.7579900644516986,
			0.6298667113517853,
		]),
		viewAzimuthDegrees: -59.99625193137896,
		viewElevationDegrees: 5,
	}),
	Object.freeze({
		id: 'sunset-plus-two-hours',
		timeLabel: 'Two hours after sunset',
		timeIso: '2024-06-21T05:26:03.503Z',
		directionToSourceUpEastNorth: Object.freeze([
			-0.311423454521898,
			-0.5984405189882708,
			0.7381628392209245,
		]),
		viewAzimuthDegrees: -59.99625193137896,
		viewElevationDegrees: 5,
	}),
]);
const EXPECTED_PRODUCT_FACTS = Object.freeze({
	'solar-noon': Object.freeze({
		paletteEntryCount: 37,
		stellarPaletteEntryCount: 37,
		sunOccupiedPixelCount: 0,
		suppressedStellarPixelCount: 0,
	}),
	'sunset-minus-30-minutes': Object.freeze({
		paletteEntryCount: 49,
		stellarPaletteEntryCount: 39,
		sunOccupiedPixelCount: 10,
		suppressedStellarPixelCount: 0,
	}),
	sunset: Object.freeze({
		paletteEntryCount: 50,
		stellarPaletteEntryCount: 38,
		sunOccupiedPixelCount: 12,
		suppressedStellarPixelCount: 0,
	}),
	'sunset-plus-30-minutes': Object.freeze({
		paletteEntryCount: 48,
		stellarPaletteEntryCount: 39,
		sunOccupiedPixelCount: 9,
		suppressedStellarPixelCount: 0,
	}),
	'sunset-plus-one-hour': Object.freeze({
		paletteEntryCount: 44,
		stellarPaletteEntryCount: 33,
		sunOccupiedPixelCount: 11,
		suppressedStellarPixelCount: 0,
	}),
	'sunset-plus-two-hours': Object.freeze({
		paletteEntryCount: 47,
		stellarPaletteEntryCount: 33,
		sunOccupiedPixelCount: 14,
		suppressedStellarPixelCount: 0,
	}),
});
const EXPECTED_PRODUCT_IDENTITY = Object.freeze({
	source:
		'stellar-spectral-photometry:fnv1a64-canonical-json-v1:05c7b4a0eafc909d+production-sun',
	catalogFrameId: 'eq-fk5-j2000-mean',
	latitudeRadians: 0.6516745267681467,
	longitudeRadians: -2.1273172480735645,
	camera: Object.freeze({
		frameId: 'camera-forward-right-up-v1',
		viewportConventionId: 'top-left-row-major-half-open-v1',
		azimuthRadians: -1.0471321350585698,
		elevationRadians: 0.08726646259971647,
		verticalFieldOfViewRadians: 1.361356816555577,
		viewport: Object.freeze({width: 640, height: 400}),
	}),
	numerical: 'cpu-binary64-accumulation-float32-palette-v1',
	schema: 'stellar-screen-palette-cache-v1',
	palettePolicy: 'exact-one-entry-per-occupied-pixel-v1',
	layerPolicy: 'projected-disk-pixel-overlap-any-positive-owns-v1',
	legacySunContribution: 'disabled',
});
const EXPECTED_CACHE_BUILD_FACTS = Object.freeze({
	'spherical-distant': Object.freeze({
		planId: 'algorithm32-distant-sun-cache-construction-v1',
		domainSelectionId:
			'contained-distant-sun-native48-reflection-completed-fibonacci68-w27-control-v1',
		positionDomainId: 'algorithm32-native-48-position-v1',
		causalPlusOneHourPlanContentHash:
			'sha256:4e649538b4c30191728a4a68156a28e57ad4f411ab9bd47778168816ecfea98d',
		incomingDirectionCount: 68,
		outgoingDirectionCount: 4374,
		positionCount: 48,
		zCount: null,
		rhoCount: null,
	}),
	'flat-local': Object.freeze({
		planId: 'algorithm32-local-sun-cache-construction-v3',
		domainSelectionId:
			'contained-local-sun-z19-rho15-reflection-completed-fibonacci68-w27-control-v1',
		positionDomainId: 'algorithm32-flat-local-z19-rho15-position-v3',
		incomingDirectionCount: 68,
		outgoingDirectionCount: 4374,
		positionCount: 285,
		zCount: 19,
		rhoCount: 15,
	}),
});
const EXPECTED_BRUNETON_DISPLAY = Object.freeze({
	controlId: 'bruneton-figure1-display',
	conversionKind: 'cie-xyz-to-linear-srgb-paper-figure1-tone-map',
	outputColorSpace: 'linear-srgb',
	toneMapping: 'paper-figure1-exponential',
	maxLuminousEfficacy: Object.freeze({
		value: 683,
		units: 'lumens-per-watt',
	}),
	paperFigure1ToneMapK: 1 / (5 * 683),
	demoGammaPowerOmitted: true,
	demoWhitePointOmitted: true,
});
const PRODUCT_PARENT = Object.freeze({
	runId: '000466-bruneton-source-luminance-lift-spherical-comparison',
	artifactSetSha256:
		'62f912ac0fdbfac432b58e3c094a76a3a792f6afbda12de2ee6af7a5fddbd250',
	manifestByteLength: 8237,
	manifestSha256:
		'042ab5b4632f81f0e86fe73a2c21427fd8fd4651a2b20e3579d9b71dc264685c',
});
const FLAT_CONTROL_PARENT = Object.freeze({
	runId: '000467-bruneton-source-luminance-lift-flat-local-comparison',
	artifactSetSha256:
		'b6eda32ac4e3f185f23550c11a230b50ccfecab7df2126e692abed8da3ab803a',
	manifestByteLength: 4083,
	manifestSha256:
		'e889e2b92430bdd886b8b63b16b8fc66214be14609280582692560e093970306',
});
const FIBONACCI_CAUSAL_PARENT = Object.freeze({
	runId: '000471-san-jose-plus-one-hour-fibonacci-reflection-control',
	artifactSetSha256:
		'de0db263796363d29102006e27a3a352cdadde960cac524c4b4e93a27d1bd882',
	manifestByteLength: 5213,
	manifestSha256:
		'2482a0a3ca7cf4789e9d2062cc177b6c716a2988910b12c12c21ced56c98a1aa',
	proof: Object.freeze({
		path: 'evidence/proof.json',
		byteLength: 36791,
		sha256:
			'f9dc3218ff7080a1277034d11a625d183ae2f376a3df110203671a53988da385',
	}),
	scope: Object.freeze({
		conditionId: 'sunset-plus-one-hour',
		domain: 'spherical-distant',
		diagnosticDimensionality: 'one-dimensional horizon profile',
		claim:
			'FIB68 reflection completion removes the FIB34 left/right sampling imbalance in the accepted +1-hour 1D control.',
		claimBoundary:
			'This parent does not qualify a full-frame 2D render, every time, or Flat/local; the nine live pairs in this run are the required 2D follow-on.',
	}),
});
const PRODUCT_PARENT_ARTIFACTS = Object.freeze([
	Object.freeze({
		path: 'browser/config.json',
		byteLength: 10335,
		sha256:
			'fd7d6772644ea810a7c331e92e85e53495cdf7ea9e252df8ee9eb466a21d54d7',
		destination: 'references/000466/browser/config.json',
	}),
	Object.freeze({
		path: 'browser/solar-noon-matrix.u16',
		byteLength: 512000,
		sha256:
			'61a2c0985f77e9661ff8178e7c54882f9be08e0e6e8affe429136329200a2256',
		destination: 'browser/products/solar-noon-matrix.u16',
	}),
	Object.freeze({
		path: 'browser/solar-noon-palette.f32',
		byteLength: 2220,
		sha256:
			'd6f2a1af6161f81bc516d7d87c599672e9a4fe7639e91a6b67d2466aec904f0c',
		destination: 'browser/products/solar-noon-palette.f32',
	}),
	Object.freeze({
		path: 'browser/sunset-minus-30-minutes-matrix.u16',
		byteLength: 512000,
		sha256:
			'a05254fbf623738ca13460dadaa98cf3b00ddb8afdcacfad0fa4814f5ade2068',
		destination: 'browser/products/sunset-minus-30-minutes-matrix.u16',
	}),
	Object.freeze({
		path: 'browser/sunset-minus-30-minutes-palette.f32',
		byteLength: 2940,
		sha256:
			'eaecb9df9c251b15ab988984b0f73fe40a421556efe21e47980fcddefed4a503',
		destination: 'browser/products/sunset-minus-30-minutes-palette.f32',
	}),
	Object.freeze({
		path: 'browser/sunset-matrix.u16',
		byteLength: 512000,
		sha256:
			'ee8902edfbea57dbc97d1df8af328d3f966e132ca71af53923abe258bb3dd371',
		destination: 'browser/products/sunset-matrix.u16',
	}),
	Object.freeze({
		path: 'browser/sunset-palette.f32',
		byteLength: 3000,
		sha256:
			'a662a188f94daab8595535d7fbd6a6982781ce06d56703302e083f34d7722f66',
		destination: 'browser/products/sunset-palette.f32',
	}),
	Object.freeze({
		path: 'browser/sunset-plus-30-minutes-matrix.u16',
		byteLength: 512000,
		sha256:
			'2dc3815c8ea121818bb6961c7334d7821736ca54625c2cb2f335cadb728a529a',
		destination: 'browser/products/sunset-plus-30-minutes-matrix.u16',
	}),
	Object.freeze({
		path: 'browser/sunset-plus-30-minutes-palette.f32',
		byteLength: 2880,
		sha256:
			'82bc06ba1432989f47fc96f844322a95a1baf53848f82277c95aaee9b63a589b',
		destination: 'browser/products/sunset-plus-30-minutes-palette.f32',
	}),
	Object.freeze({
		path: 'browser/sunset-plus-one-hour-matrix.u16',
		byteLength: 512000,
		sha256:
			'e6d8296b3f12bc9bf5868369eadd8d84d12c1055c3d70b7cf3e98974bad3ebf9',
		destination: 'browser/products/sunset-plus-one-hour-matrix.u16',
	}),
	Object.freeze({
		path: 'browser/sunset-plus-one-hour-palette.f32',
		byteLength: 2640,
		sha256:
			'dcb3bd4923503da3259904bdacecf451dd3a3c1ed3c1dd991f78675f8630a6c9',
		destination: 'browser/products/sunset-plus-one-hour-palette.f32',
	}),
	Object.freeze({
		path: 'browser/sunset-plus-two-hours-matrix.u16',
		byteLength: 512000,
		sha256:
			'0e5f8c2969f0cf779531ee4519ee594fbaa5c2a0ffebcb0be2b1d4bfac54f5d3',
		destination: 'browser/products/sunset-plus-two-hours-matrix.u16',
	}),
	Object.freeze({
		path: 'browser/sunset-plus-two-hours-palette.f32',
		byteLength: 2820,
		sha256:
			'90c94db9102616d4df92b4fcfcb6296720ca2bb569a916fb703872ff1bfebc82',
		destination: 'browser/products/sunset-plus-two-hours-palette.f32',
	}),
]);
const HISTORICAL_BRUNETON_CONTROLS = Object.freeze([
	...[
		['solar-noon', 96673,
			'0c47901abe2b06c020b2300548f01d17478960765314b52ee07521cb21a870bb'],
		['sunset-minus-30-minutes', 118072,
			'4c793e090cb0c0c917b12d4dcc21fe8bd7875b16688a12b3b085434daadd85ba'],
		['sunset', 71467,
			'51f4679befc6ba40a230bd1c6eda1260d12cbcbfd422714932d4b861014277a0'],
		['sunset-plus-30-minutes', 11469,
			'd454c82a045f3dd43279470c4c142c023b0847ec779c9808ceb33e5b44b29868'],
		['sunset-plus-one-hour', 6664,
			'e1093a93f878f5289c1e475b278d1b79a2c5504f6c0763a8a599167c81f6b96a'],
		['sunset-plus-two-hours', 6664,
			'e1093a93f878f5289c1e475b278d1b79a2c5504f6c0763a8a599167c81f6b96a'],
	].map(([id, byteLength, sha256]) => Object.freeze({
		id,
		kind: 'spherical-distant',
		parent: PRODUCT_PARENT,
		path: `captures/bruneton-${id}.png`,
		byteLength,
		sha256,
		destination: `browser/historical/000466-bruneton-${id}.png`,
	})),
	...[
		['flat-0', 106431,
			'3be3d9fd35de95dd35ab55d8d00cdc27eb22d78b2ff1d1ab3d4f810fda5b22d8'],
		['flat-90', 96908,
			'352618fbbadbc87e19d5386c9f214a0da3208ca3c176662070d2e955135679a8'],
		['flat-180', 79642,
			'e06e8856341e6c96d3f0859be6e1758958713974468132ca80dd6cc488cff337'],
	].map(([id, byteLength, sha256]) => Object.freeze({
		id,
		kind: 'flat-local',
		parent: FLAT_CONTROL_PARENT,
		path: `captures/bruneton-${id}.png`,
		byteLength,
		sha256,
		destination: `browser/historical/000467-bruneton-${id}.png`,
	})),
]);
const FIXTURES = Object.freeze([
	Object.freeze({
		id: 'subjectiveGlobeContextScenes',
		fileName: 'subjective-globe-context-scenes-v1.json',
		byteLength: 1721,
		sha256:
			'f89e670faf0cd6ad3949c4b5c2acc582a4a809ee071ed0ac62bcfd14e546a8d1',
	}),
	Object.freeze({
		id: 'g4CpuSunDiskTransport',
		fileName: 'g4-cpu-sun-disk-transport-v1.json',
		byteLength: 4350,
		sha256:
			'0cbb56ab49e51357f45f92c2ad8ef7e7250d75b664479cc787059983e786ccfd',
	}),
	Object.freeze({
		id: 'unionGlacierFlatLocal',
		fileName: 'union-glacier-flat-local-closest-approach-v1.json',
		byteLength: 3084,
		sha256:
			'd49b904c5c1aa8a14002b5e9a47e5fb68fea00cd0a5edea32a372e59f0d51287',
	}),
]);
const MODULE_CLOSURE_ENTRY_FILES = Object.freeze([
	'runners/render-bruneton-fibonacci68-final-paired-captures.js',
	'stellar-screen-palette/run-bruneton-fibonacci68-final-paired-captures-browser.js',
	CPU_COLOR_SMOKE_RELATIVE_PATH,
	FLAT_TRANSPORT_PACKING_SMOKE_RELATIVE_PATH,
]);
const MODULE_CLOSURE_ALLOWED_NODE_BUILTINS = Object.freeze([
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
]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function contentType(target) {
	if (target.endsWith('.js')) return 'text/javascript; charset=utf-8';
	if (target.endsWith('.json')) return 'application/json; charset=utf-8';
	if (target.endsWith('.html')) return 'text/html; charset=utf-8';
	if (target.endsWith('.png')) return 'image/png';
	return 'application/octet-stream';
}

function pngBytes(dataUrl) {
	const match = /^data:image\/png;base64,(.+)$/u.exec(dataUrl);
	if (!match) throw new Error('Browser did not return a PNG data URL.');
	return Buffer.from(match[1], 'base64');
}

function gate(id, passed, requirement, observed) {
	return {id, passed: Boolean(passed), requirement, observed};
}

async function inventoryProduction() {
	const [algorithm32, flat32] = await Promise.all([
		createFileInventory(ALGORITHM32_ROOT),
		createFileInventory(FLAT32_ROOT),
	]);
	return {algorithm32, flat32};
}

async function removeBrowserProfile(profilePath) {
	await assertExistingRealPathContained(
		OUTPUT_ROOT,
		profilePath,
		'Final paired-capture Chrome profile',
	);
	await assertNoReparseEntries(
		profilePath,
		'Final paired-capture Chrome profile',
	);
	await rm(profilePath, {recursive: true, force: true});
}

async function serve(run) {
	const requests = [];
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/screen-palette/', SCREEN_PALETTE_ROOT],
		['/candidate/', CANDIDATE_ROOT],
		['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT],
	]);
	const server = createServer(async (request, response) => {
		try {
			const pathname = decodeURIComponent(
				new URL(request.url, 'http://127.0.0.1').pathname,
			);
			requests.push(pathname);
			const route = [...roots].find(([prefix]) => pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) {
				throw new Error('Unsupported final paired-capture path.');
			}
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) {
				throw new Error('Final paired-capture path escapes its route root.');
			}
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) {
				throw new Error('Final paired-capture target is not a real file.');
			}
			const [canonicalRoot, canonicalTarget] = await Promise.all([
				realpath(root),
				realpath(target),
			]);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) {
				throw new Error('Final paired-capture real path escapes its route root.');
			}
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
	return {
		url: `http://127.0.0.1:${server.address().port}/browser/index.html`,
		requests,
		close: () => new Promise((resolve, reject) =>
			server.close((error) => error ? reject(error) : resolve())),
	};
}

async function buildImplementationClosure() {
	return buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: MODULE_CLOSURE_ENTRY_FILES,
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		allowedNodeBuiltins: MODULE_CLOSURE_ALLOWED_NODE_BUILTINS,
	});
}

async function describeImplementationClosure(closure) {
	const fileArtifacts = [];
	for (const relativePath of closure.files) {
		const absolutePath = await assertExistingRealPathContained(
			EXPERIMENT_ROOT,
			path.join(EXPERIMENT_ROOT, ...relativePath.split('/')),
			`implementation module ${relativePath}`,
		);
		const info = await lstat(absolutePath);
		fileArtifacts.push({
			path: relativePath,
			sha256: await sha256File(absolutePath),
			byteLength: info.size,
		});
	}
	return {...closure, fileArtifacts};
}

async function executeCpuColorSmoke(run) {
	const sourcePath = await assertExistingRealPathContained(
		EXPERIMENT_ROOT,
		CPU_COLOR_SMOKE_PATH,
		'CPU Color smoke source',
	);
	const sourceInfo = await lstat(sourcePath);
	requireCondition(
		sourceInfo.isFile() && !sourceInfo.isSymbolicLink(),
		'CPU Color smoke source must be a real file.',
	);
	const execution = await executeFileAsync(process.execPath, [sourcePath], {
		cwd: REPOSITORY_ROOT,
		timeout: 120000,
		maxBuffer: 16 * 1024 * 1024,
		windowsHide: true,
	});
	const stderrArtifactPath = 'evidence/cpu-color-smoke-stderr.txt';
	await run.writeArtifact(
		stderrArtifactPath,
		execution.stderr,
	);
	let evidence;
	try {
		evidence = JSON.parse(execution.stdout);
	} catch (error) {
		throw new Error(`CPU Color smoke returned invalid JSON: ${error.message}`);
	}
	requireCondition(
		evidence.accepted === true
			&& evidence.smokeId
				=== 'bruneton-extraterrestrial-visibility-color-cpu-smoke-v1'
			&& JSON.stringify(evidence.parameters?.sourceExposureCurve)
				=== JSON.stringify(SOURCE_EXPOSURE_CURVE)
			&& evidence.parameters?.displayHeadroom
				=== DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM
			&& evidence.parameters?.displayShoulderPower === 8
			&& JSON.stringify(evidence.equation) === JSON.stringify({
				input:
					'R=max(linearRGB(already-transported celestial radiance),0)',
				photopicLuminance: 'Y=dot(R,[0.2126,0.7152,0.0722])',
				mappedLuminance: 'Ym=1-exp(-K*G*Y)',
				exposedRgb: 'A=R*(Ym/Y)',
				headroom: 'S=(1+(max(A)/H)^8)^(-1/8); E=A*S',
				composition: 'D=B+(1-B)*E',
			})
			&& evidence.retainedSource?.runId === PRODUCT_PARENT.runId
			&& evidence.retainedSource?.artifactSetSha256
				=== PRODUCT_PARENT.artifactSetSha256
			&& evidence.cpu?.boundedCaseCount === 5
			&& evidence.cpu.exactZeroBruneton?.length === 3
			&& evidence.cpu.exactZeroBruneton.every(Number.isFinite)
			&& evidence.cpu.maximumBoundedChannel >= 0
			&& evidence.cpu.maximumBoundedChannel
				< DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM
			&& evidence.shader?.identityVariantCount === 6
			&& evidence.shader.exposureGain
				=== SOURCE_EXPOSURE_CURVE.maximumExposureGain
			&& evidence.shader.displayHeadroom
				=== DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM
			&& evidence.sameChroma?.rungCount === 7
			&& evidence.sameChroma.outputPhotopicLuminance?.length === 7
			&& evidence.sameChroma.outputPhotopicLuminance.every(
				(value, index, values) => index === 0 || value > values[index - 1],
			)
			&& evidence.retained?.length === 2
			&& JSON.stringify(evidence.retained.map((record) => record.sceneId))
				=== JSON.stringify([
					'sunset-plus-one-hour',
					'sunset-plus-two-hours',
				])
			&& evidence.retained.every((record) =>
				record.entryCount === 32
					&& record.photopicOrder.inversions === 0
					&& record.distinctRgbCount === 32
					&& record.exactWhiteCount === 0)
			&& evidence.flat180?.exposureGain === 1
			&& evidence.flat180?.displayBytes?.[0] >= 240
			&& evidence.flat180?.displayBytes?.[0] <= 242
			&& evidence.flat180.displayBytes.every((value) => value <= 254)
			&& evidence.flat180.outputGreenToRed < 0.5
			&& evidence.flat180.outputBlueToRed < 0.11,
		'CPU Color smoke did not return the exact accepted formula/headroom/rank/Flat180 proof.',
	);
	const artifactPath = 'evidence/cpu-color-smoke.json';
	await run.writeJsonArtifact(artifactPath, evidence);
	const absoluteArtifactPath = path.join(
		run.runDirectory,
		...artifactPath.split('/'),
	);
	const absoluteStderrArtifactPath = path.join(
		run.runDirectory,
		...stderrArtifactPath.split('/'),
	);
	return {
		command: `"${process.execPath}" "${sourcePath}"`,
		source: {
			path: `experiments/extraterrestrial/${CPU_COLOR_SMOKE_RELATIVE_PATH}`,
			byteLength: sourceInfo.size,
			sha256: await sha256File(sourcePath),
		},
		artifact: {
			path: artifactPath,
			byteLength: (await lstat(absoluteArtifactPath)).size,
			sha256: await sha256File(absoluteArtifactPath),
		},
		stderrArtifact: {
			path: stderrArtifactPath,
			byteLength: (await lstat(absoluteStderrArtifactPath)).size,
			sha256: await sha256File(absoluteStderrArtifactPath),
		},
		smokeId: evidence.smokeId,
		accepted: evidence.accepted,
	};
}

async function executeFlatTransportPackingSmoke(run) {
	const sourcePath = await assertExistingRealPathContained(
		EXPERIMENT_ROOT,
		FLAT_TRANSPORT_PACKING_SMOKE_PATH,
		'Flat FIB68 transport-packing smoke source',
	);
	const sourceInfo = await lstat(sourcePath);
	requireCondition(
		sourceInfo.isFile() && !sourceInfo.isSymbolicLink(),
		'Flat FIB68 transport-packing smoke source must be a real file.',
	);
	const execution = await executeFileAsync(process.execPath, [sourcePath], {
		cwd: REPOSITORY_ROOT,
		timeout: 120000,
		maxBuffer: 32 * 1024 * 1024,
		windowsHide: true,
	});
	const stderrArtifactPath =
		'evidence/flat-fib68-transport-packing-smoke-stderr.txt';
	await run.writeArtifact(stderrArtifactPath, execution.stderr);
	let evidence;
	try {
		evidence = JSON.parse(execution.stdout);
	} catch (error) {
		throw new Error(
			`Flat FIB68 transport-packing smoke returned invalid JSON: ${error.message}`,
		);
	}
	const hashPattern = /^sha256:[a-f0-9]{64}$/u;
	const worst = evidence.actualWorstCase;
	const physical = worst?.physical;
	const referenceIdentity = evidence.fullDivisibleReferenceIdentity;
	const seamEvidence = evidence.fullFib68SeamEvidence;
	const synthetic = evidence.synthetic;
	const integratedSurface = evidence.integratedReducedPlanSurface;
	const reducedPlan = evidence.reducedRealN4Plan;
	const expectedSeamQueries = [0, 1, 2, 3, 19_377, 19_378, 19_379];
	const expectedTransportPasses = [
		{id: 'local-sun-transport-j2-to-l2', order: 2},
		{id: 'local-sun-transport-j3-to-l3', order: 3},
	];
	const seamAddressesAreExact = seamEvidence?.addressAudits?.length
		=== expectedSeamQueries.length
		&& seamEvidence.addressAudits.every((audit, index) =>
			audit.queryIndex === expectedSeamQueries[index]
				&& audit.tapIndex === 255
				&& audit.sourceComponentIndex === 2
				&& audit.wavelengthIndex === 14
				&& audit.sourceLogicalOffset === audit.sourcePhysicalOffset
				&& audit.coefficientLogicalOffset
					=== audit.coefficientPhysicalOffset)
		&& seamEvidence.addressAudits.at(-1).sourcePhysicalOffset
			=== physical.sources.scalarCount - 1
		&& seamEvidence.addressAudits.at(-1).coefficientPhysicalOffset
			=== physical.coefficients.scalarCount - 1;
	const transportAudits = reducedPlan?.transportModuleAudits ?? [];
	const transportModulesAreIsolated = transportAudits.length === 2
		&& transportAudits.every((audit, index) =>
			audit.passId === expectedTransportPasses[index].id
				&& audit.order === expectedTransportPasses[index].order
				&& audit.queryColumnCount === 3
				&& audit.baselineModule.id
					=== 'algorithm32-flat-earth-transport-module-v3'
				&& audit.controlledModule.id
					=== 'contained-flat-earth-tiled-transport-module-v1'
				&& hashPattern.test(audit.baselineModule.contentHash)
				&& hashPattern.test(audit.controlledModule.contentHash)
				&& audit.baselineModule.contentHash
					!== audit.controlledModule.contentHash)
		&& transportAudits[0].controlledModule.contentHash
			=== transportAudits[1].controlledModule.contentHash;
	requireCondition(
		evidence.accepted === true
			&& evidence.smokeId
				=== 'controlled-flat-fibonacci68-transport-packing-smoke-v1'
			&& evidence.policy?.id === FLAT_TRANSPORT_PACKING_POLICY_ID
			&& evidence.policy.maximumTextureSize === 8192
			&& evidence.policy.minimumQueryColumnCount === 3
			&& evidence.policy.sourceComponentCount === 3
			&& evidence.policy.transportIntervalCount === 15
			&& evidence.policy.pathSampleCount === 16
			&& evidence.policy.maximumPositionStencilTapCount === 4
			&& evidence.policy.maximumDirectionStencilTapCount === 4
			&& evidence.policy.maximumLogicalTapCount === 256
			&& worst?.schemaId === 'controlled-flat-transport-packing-v1'
			&& worst?.policyId === FLAT_TRANSPORT_PACKING_POLICY_ID
			&& hashPattern.test(worst.contentHash)
			&& worst.maximumTextureSize === 8192
			&& worst.minimumQueryColumnCount === 3
			&& worst.logical?.queryCount === 19_380
			&& worst.logical.tapCount === 256
			&& worst.logical.wavelengthCount === 15
			&& JSON.stringify(worst.logical.sourceShape)
				=== JSON.stringify([768, 19_380])
			&& JSON.stringify(worst.logical.coefficientShape)
				=== JSON.stringify([256, 19_380, 15])
			&& worst.logical.sourceScalarCount === 14_883_840
			&& worst.logical.coefficientScalarCount === 74_419_200
			&& physical?.queryColumnCount === 3
			&& physical.queryRowCount === 6_460
			&& physical.querySlotCount === 19_380
			&& physical.unusedQuerySlotCount === 0
			&& JSON.stringify(physical.sources.shape)
				=== JSON.stringify([2_304, 6_460])
			&& JSON.stringify(physical.coefficients.shape)
				=== JSON.stringify([768, 6_460, 15])
			&& physical.sources.paddingScalarCount === 0
			&& physical.coefficients.paddingScalarCount === 0
			&& physical.sources.scalarCount === 14_883_840
			&& physical.coefficients.scalarCount === 74_419_200
			&& physical.allTextureAxesWithinLimit === true
			&& synthetic?.packing?.packing?.logical?.queryCount === 31
			&& synthetic.packing.packing.logical.tapCount === 2
			&& synthetic.packing.packing.logical.wavelengthCount === 3
			&& synthetic.packing.packing.physical.queryColumnCount === 3
			&& synthetic.packing.packing.physical.queryRowCount === 11
			&& synthetic.packing.packing.physical.querySlotCount === 33
			&& synthetic.packing.packing.physical.unusedQuerySlotCount === 2
			&& JSON.stringify(synthetic.packing.packing.physical.sources.shape)
				=== JSON.stringify([18, 11])
			&& JSON.stringify(
				synthetic.packing.packing.physical.coefficients.shape,
			) === JSON.stringify([6, 11, 3])
			&& synthetic.preservedSourceScalarCount === 186
			&& synthetic.preservedCoefficientScalarCount === 186
			&& synthetic.sourcePaddingCount === 12
			&& synthetic.coefficientPaddingCount === 12
			&& hashPattern.test(synthetic.shaderSourceContentHash)
			&& referenceIdentity?.queryCount === 19_380
			&& referenceIdentity.queryColumnCount === 3
			&& referenceIdentity.queryRowCount === 6_460
			&& referenceIdentity.sourceValuesSameObject === true
			&& referenceIdentity.coefficientValuesSameObject === true
			&& seamEvidence?.packingContentHash === worst.contentHash
			&& seamEvidence.sourceValuesSameObject === true
			&& seamEvidence.coefficientValuesSameObject === true
			&& seamEvidence.lastTapIndex === 255
			&& seamEvidence.lastSourceComponentIndex === 2
			&& seamEvidence.lastWavelengthIndex === 14
			&& JSON.stringify(seamEvidence.queryIndices)
				=== JSON.stringify(expectedSeamQueries)
			&& seamAddressesAreExact
			&& integratedSurface?.geometryControlledTransportPacking?.policyId
				=== FLAT_TRANSPORT_PACKING_POLICY_ID
			&& integratedSurface.geometryControlledTransportPacking
				.maximumTextureSize === 8192
			&& integratedSurface.geometryControlledTransportPacking
				.minimumQueryColumnCount === 3
			&& hashPattern.test(
				integratedSurface.geometryControlledTransportPacking.contentHash,
			)
			&& integratedSurface.domainSelectionId
				=== 'contained-local-sun-z2-rho2-reflection-completed-fibonacci68-w27-control-v1'
			&& integratedSurface.incomingDirectionCount === 68
			&& integratedSurface.outgoingDirectionCount === 4_374
			&& integratedSurface.positionCount === 4
			&& integratedSurface.transportQueryCount === 272
			&& integratedSurface.packingDiagnostic?.schemaId
				=== 'controlled-flat-transport-packing-diagnostic-v1'
			&& integratedSurface.packingDiagnostic.policyId
				=== FLAT_TRANSPORT_PACKING_POLICY_ID
			&& integratedSurface.module?.id
				=== 'contained-flat-earth-tiled-transport-module-v1'
			&& integratedSurface.module.queryColumnCount === 3
			&& integratedSurface.module.diagnostic?.baseModule?.id
				=== 'algorithm32-flat-earth-transport-module-v3'
			&& integratedSurface.module.diagnostic.controlledModule?.id
				=== integratedSurface.module.id
			&& integratedSurface.module.diagnostic.controlledModule.contentHash
				=== integratedSurface.module.contentHash
			&& integratedSurface.module.diagnostic.queryColumnCount === 3
			&& integratedSurface.module.diagnostic.untouchedBlockCount === 0
			&& integratedSurface.module.diagnostic.untouchedBindingCount === 3
			&& reducedPlan?.baselineIdentity?.id
				=== 'algorithm32-local-sun-cache-construction-v3'
			&& reducedPlan.controlledIdentity?.id
				=== 'algorithm32-local-sun-cache-construction-v3'
			&& hashPattern.test(reducedPlan.baselineIdentity.contentHash)
			&& hashPattern.test(reducedPlan.controlledIdentity.contentHash)
			&& reducedPlan.baselineIdentity.contentHash
				!== reducedPlan.controlledIdentity.contentHash
			&& reducedPlan.fieldCount === 10
			&& reducedPlan.passCount === 10
			&& reducedPlan.result === 'local-sun-j-through-4'
			&& hashPattern.test(reducedPlan.topologyContentHash)
			&& reducedPlan.tiledTransportModuleCount === 2
			&& reducedPlan.unchangedNontransportModuleCount === 32
			&& reducedPlan.unchangedTransportCompanionModuleCount === 4
			&& reducedPlan.moduleDiagnostics?.length === 2
			&& JSON.stringify(reducedPlan.moduleDiagnostics[0])
				=== JSON.stringify(reducedPlan.moduleDiagnostics[1])
			&& transportModulesAreIsolated,
		'Flat FIB68 transport-packing smoke did not return the exact bounded storage/address, same-value, seam, and real-N4 isolation proof.',
	);
	const artifactPath = 'evidence/flat-fib68-transport-packing-smoke.json';
	await run.writeJsonArtifact(artifactPath, evidence);
	const absoluteArtifactPath = path.join(
		run.runDirectory,
		...artifactPath.split('/'),
	);
	const absoluteStderrArtifactPath = path.join(
		run.runDirectory,
		...stderrArtifactPath.split('/'),
	);
	return {
		command: `"${process.execPath}" "${sourcePath}"`,
		source: {
			path:
				`experiments/extraterrestrial/${FLAT_TRANSPORT_PACKING_SMOKE_RELATIVE_PATH}`,
			byteLength: sourceInfo.size,
			sha256: await sha256File(sourcePath),
		},
		artifact: {
			path: artifactPath,
			byteLength: (await lstat(absoluteArtifactPath)).size,
			sha256: await sha256File(absoluteArtifactPath),
		},
		stderrArtifact: {
			path: stderrArtifactPath,
			byteLength: (await lstat(absoluteStderrArtifactPath)).size,
			sha256: await sha256File(absoluteStderrArtifactPath),
		},
		smokeId: evidence.smokeId,
		accepted: evidence.accepted,
		policyId: evidence.policy.id,
		worstCase: {
			queryCount: worst.logical.queryCount,
			tapCount: worst.logical.tapCount,
			queryColumnCount: physical.queryColumnCount,
			queryRowCount: physical.queryRowCount,
			sourceShape: physical.sources.shape,
			coefficientShape: physical.coefficients.shape,
		},
	};
}

async function verifyParentIdentity(parent) {
	const root = path.join(RUNS_ROOT, parent.runId);
	await assertExistingRealPathContained(RUNS_ROOT, root, `${parent.runId} root`);
	await assertNoReparseEntries(root, `${parent.runId} root`);
	const verification = await verifyRun(parent.runId);
	requireCondition(
		verification.conclusion === 'accepted'
			&& verification.artifactSetSha256 === parent.artifactSetSha256,
		`${parent.runId} no longer verifies as the pinned accepted parent.`,
	);
	const manifestPath = path.join(root, 'artifact-manifest.json');
	const manifestInfo = await lstat(manifestPath);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(
		manifestInfo.size === parent.manifestByteLength
			&& manifestSha256 === parent.manifestSha256,
		`${parent.runId} terminal manifest identity changed.`,
	);
	const manifestBytes = await readFile(manifestPath);
	const manifest = JSON.parse(manifestBytes.toString('utf8'));
	return {root, verification, manifest, manifestBytes, manifestSha256};
}

async function copyVerifiedArtifact({run, parentState, expected}) {
	const record = parentState.manifest.artifacts.find(
		(artifact) => artifact.path === expected.path,
	);
	requireCondition(
		record
			&& record.byteLength === expected.byteLength
			&& record.sha256 === expected.sha256,
		`${parentState.manifest.runId} manifest record changed: ${expected.path}`,
	);
	const sourcePath = await assertExistingRealPathContained(
		parentState.root,
		path.join(parentState.root, ...expected.path.split('/')),
		`${parentState.manifest.runId} ${expected.path}`,
	);
	const sourceInfo = await lstat(sourcePath);
	requireCondition(
		sourceInfo.isFile() && !sourceInfo.isSymbolicLink()
			&& sourceInfo.size === expected.byteLength
			&& await sha256File(sourcePath) === expected.sha256,
		`${parentState.manifest.runId} artifact bytes changed: ${expected.path}`,
	);
	await run.writeArtifact(expected.destination, await readFile(sourcePath));
	const destinationPath = path.join(
		run.runDirectory,
		...expected.destination.split('/'),
	);
	requireCondition(
		await sha256File(destinationPath) === expected.sha256,
		`Run-local copy differs: ${expected.destination}`,
	);
	return {
		parentRunId: parentState.manifest.runId,
		parentArtifactSetSha256: parentState.manifest.artifactSetSha256,
		sourcePath: expected.path,
		destinationPath: expected.destination,
		operation: 'byte-for-byte-copy-after-terminal-manifest-and-content-validation',
		byteLength: expected.byteLength,
		sourceSha256: expected.sha256,
		resultSha256: expected.sha256,
	};
}

async function copyTerminalManifest({run, parent, parentState}) {
	const destination = `references/${parent.runId.slice(0, 6)}/artifact-manifest.json`;
	await run.writeArtifact(destination, parentState.manifestBytes);
	requireCondition(
		await sha256File(path.join(
			run.runDirectory,
			...destination.split('/'),
		)) === parent.manifestSha256,
		`${parent.runId} copied terminal manifest differs.`,
	);
	return {
		parentRunId: parent.runId,
		sourcePath: 'artifact-manifest.json',
		destinationPath: destination,
		operation: 'byte-for-byte-copy',
		byteLength: parent.manifestByteLength,
		sourceSha256: parent.manifestSha256,
		resultSha256: parent.manifestSha256,
		artifactSetSha256: parent.artifactSetSha256,
	};
}

async function copyFixtures(run) {
	const artifacts = {};
	for (const fixture of FIXTURES) {
		const sourcePath = await assertExistingRealPathContained(
			FIXTURES_ROOT,
			path.join(FIXTURES_ROOT, fixture.fileName),
			`${fixture.id} fixture`,
		);
		const info = await lstat(sourcePath);
		const sourceSha256 = await sha256File(sourcePath);
		requireCondition(
			info.isFile() && !info.isSymbolicLink()
				&& info.size === fixture.byteLength
				&& sourceSha256 === fixture.sha256,
			`${fixture.id} fixture identity changed.`,
		);
		const destination = `browser/fixtures/${fixture.fileName}`;
		await run.writeArtifact(destination, await readFile(sourcePath));
		requireCondition(
			await sha256File(path.join(
				run.runDirectory,
				...destination.split('/'),
			)) === fixture.sha256,
			`${fixture.id} run-local copy differs.`,
		);
		artifacts[fixture.id] = {
			sourcePath: `experiments/extraterrestrial/fixtures/${fixture.fileName}`,
			destinationPath: destination,
			operation: 'byte-for-byte-copy',
			byteLength: fixture.byteLength,
			sourceSha256: fixture.sha256,
			resultSha256: fixture.sha256,
		};
	}
	return artifacts;
}

async function assertRunLocalCopiesUnchanged(run, copies, label) {
	for (const copy of copies) {
		const destinationPath = await assertExistingRealPathContained(
			run.runDirectory,
			path.join(run.runDirectory, ...copy.destinationPath.split('/')),
			`${label} ${copy.destinationPath}`,
		);
		const info = await lstat(destinationPath);
		requireCondition(
			info.isFile()
				&& !info.isSymbolicLink()
				&& info.size === copy.byteLength
				&& await sha256File(destinationPath) === copy.resultSha256,
			`${label} changed during execution: ${copy.destinationPath}`,
		);
	}
}

function assertExactJson(actual, expected, message) {
	requireCondition(JSON.stringify(actual) === JSON.stringify(expected), message);
}

function assertExpectedScreenProduct(scene, product) {
	const expectedFacts = EXPECTED_PRODUCT_FACTS[scene.id];
	requireCondition(expectedFacts, `No expected product facts for ${scene.id}.`);
	requireCondition(
		product.id === scene.id
			&& product.paletteEntryCount === expectedFacts.paletteEntryCount
			&& product.stellarPaletteEntryCount
				=== expectedFacts.stellarPaletteEntryCount
			&& product.sunOccupiedPixelCount
				=== expectedFacts.sunOccupiedPixelCount
			&& product.suppressedStellarPixelCount
				=== expectedFacts.suppressedStellarPixelCount,
		`Run 000466 product cardinalities changed for ${scene.id}.`,
	);
	assertExactJson(
		product.viewport,
		EXPECTED_PRODUCT_IDENTITY.camera.viewport,
		`Run 000466 product viewport changed for ${scene.id}.`,
	);
	let identity;
	try {
		identity = JSON.parse(product.identity);
	} catch (error) {
		throw new Error(
			`Run 000466 product identity is not JSON for ${scene.id}: ${error.message}`,
		);
	}
	requireCondition(
		identity.source === EXPECTED_PRODUCT_IDENTITY.source
			&& identity.view?.catalogFrameId
				=== EXPECTED_PRODUCT_IDENTITY.catalogFrameId
			&& identity.view?.observation?.instant === scene.timeIso
			&& identity.view?.observation?.latitudeRadians
				=== EXPECTED_PRODUCT_IDENTITY.latitudeRadians
			&& identity.view?.observation?.longitudeRadians
				=== EXPECTED_PRODUCT_IDENTITY.longitudeRadians
			&& identity.numerical === EXPECTED_PRODUCT_IDENTITY.numerical
			&& identity.schema === EXPECTED_PRODUCT_IDENTITY.schema
			&& identity.palettePolicy === EXPECTED_PRODUCT_IDENTITY.palettePolicy
			&& identity.layerPolicy === EXPECTED_PRODUCT_IDENTITY.layerPolicy
			&& identity.legacySunContribution
				=== EXPECTED_PRODUCT_IDENTITY.legacySunContribution,
		`Run 000466 physical/product identity changed for ${scene.id}.`,
	);
	assertExactJson(
		identity.view.camera,
		EXPECTED_PRODUCT_IDENTITY.camera,
		`Run 000466 view binding changed for ${scene.id}.`,
	);
}

function validateCopiedFixtureFacts({subjectiveFixture, geometryFixture, flatFixture}) {
	requireCondition(
		subjectiveFixture.schemaVersion
			=== 'subjective-globe-context-scenes-v1',
		'Subjective spherical fixture schema identity changed.',
	);
	assertExactJson(
		subjectiveFixture.camera,
		EXPECTED_SUBJECTIVE_CAMERA,
		'Subjective spherical camera facts changed.',
	);
	requireCondition(
		geometryFixture.schemaVersion === 'g4-cpu-sun-disk-transport-v1'
			&& geometryFixture.fixtureId === 'g4-cpu-sun-disk-transport-v1'
			&& geometryFixture.geometry?.bottomRadius?.value === 6360000
			&& geometryFixture.geometry?.bottomRadius?.units === 'meters'
			&& geometryFixture.geometry?.topRadius?.value === 6420000
			&& geometryFixture.geometry?.topRadius?.units === 'meters',
		'G4 spherical-geometry fixture facts changed.',
	);
	requireCondition(
		flatFixture.schemaVersion
			=== 'union-glacier-flat-local-closest-approach-v1'
			&& flatFixture.location === 'Union Glacier'
			&& flatFixture.source?.sourceId === 'flat-local-sun'
			&& flatFixture.source?.radiusMeters === 25749.504
			&& flatFixture.source?.surfaceRadianceValues?.length === 15
			&& flatFixture.source.surfaceRadianceValues.every(
				(value) => Number.isFinite(value) && value > 0,
			)
			&& flatFixture.geometry?.topAltitudeMeters === 100000
			&& flatFixture.geometry?.observerDomeApexMeters === 100000
			&& flatFixture.geometry?.observerDomeMaxViewRayMeters === 1926774,
		'Union Glacier Flat/local fixture physical facts changed.',
	);
	assertExactJson(
		flatFixture.camera,
		EXPECTED_FLAT_CAMERA,
		'Union Glacier Flat/local camera facts changed.',
	);
	assertExactJson(
		flatFixture.states,
		EXPECTED_FLAT_STATES,
		'Union Glacier Flat/local state positions changed.',
	);
}

function createBrowserConfiguration(
	parentConfig,
	subjectiveFixture,
	productCopies,
	historicalControlCopies,
) {
	assertExactJson(
		parentConfig.camera,
		EXPECTED_PARENT_CAMERA,
		'Run 000466 parent camera identity changed.',
	);
	assertExactJson(
		parentConfig.scenes,
		EXPECTED_SPHERICAL_SCENES,
		'Run 000466 parent does not contain the exact final San Jose scene/time/direction sequence.',
	);
	assertExactJson(
		Object.keys(parentConfig.products),
		SPHERICAL_SCENE_IDS,
		'Run 000466 product keys changed.',
	);
	const products = {};
	for (const scene of EXPECTED_SPHERICAL_SCENES) {
		const {id} = scene;
		const parentProduct = parentConfig.products[id];
		requireCondition(parentProduct, `Run 000466 omits product ${id}.`);
		assertExpectedScreenProduct(scene, parentProduct);
		const matrix = productCopies.find(
			(copy) => copy.sourcePath === `browser/${id}-matrix.u16`,
		);
		const palette = productCopies.find(
			(copy) => copy.sourcePath === `browser/${id}-palette.f32`,
		);
		requireCondition(matrix && palette, `Missing copied product pair ${id}.`);
		products[id] = {
			...parentProduct,
			matrixUrl: `/browser/products/${id}-matrix.u16`,
			paletteUrl: `/browser/products/${id}-palette.f32`,
			derivation: {
				parentRunId: PRODUCT_PARENT.runId,
				parentArtifactSetSha256: PRODUCT_PARENT.artifactSetSha256,
				matrix: {
					sourcePath: matrix.sourcePath,
					sha256: matrix.sourceSha256,
					byteLength: matrix.byteLength,
				},
				palette: {
					sourcePath: palette.sourcePath,
					sha256: palette.sourceSha256,
					byteLength: palette.byteLength,
				},
				compatibility:
					'screen-space external-radiance product only; independent of atmospheric multiple-scattering incoming quadrature; live FIB68 atmosphere is built in this run',
			},
		};
	}
	return {
		schemaId: 'bruneton-fibonacci68-final-paired-captures-browser-config-v1',
		colorModelId: BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
		sourceExposureCurve: SOURCE_EXPOSURE_CURVE,
		extraterrestrialDisplayHeadroom:
			DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
		identityContract: {
			parentCamera: EXPECTED_PARENT_CAMERA,
			subjectiveCamera: EXPECTED_SUBJECTIVE_CAMERA,
			sphericalScenes: EXPECTED_SPHERICAL_SCENES,
			flatCamera: EXPECTED_FLAT_CAMERA,
			flatStates: EXPECTED_FLAT_STATES,
			productFacts: EXPECTED_PRODUCT_FACTS,
			productIdentity: EXPECTED_PRODUCT_IDENTITY,
			cacheBuildFacts: EXPECTED_CACHE_BUILD_FACTS,
			causalScope: FIBONACCI_CAUSAL_PARENT.scope,
		},
		spherical: {
			location: 'San Jose',
			camera: {
				...subjectiveFixture.camera,
				policy: parentConfig.camera.policy,
				viewAzimuthDegrees: parentConfig.camera.viewAzimuthDegrees,
				viewElevationDegrees: parentConfig.camera.viewElevationDegrees,
			},
			scenes: parentConfig.scenes,
			products,
		},
		flat: {
			location: 'Union Glacier camp',
			cameraBearingPolicy: 'fixed Flat 180 source bearing',
			stateIds: FLAT_STATE_IDS,
		},
		historicalBrunetonControls: Object.fromEntries(
			historicalControlCopies.map((copy) => [copy.id, {
				id: copy.id,
				kind: copy.kind,
				url: `/${copy.destinationPath}`,
				parentRunId: copy.parentRunId,
				parentArtifactSetSha256: copy.parentArtifactSetSha256,
				sourcePath: copy.sourcePath,
				byteLength: copy.byteLength,
				sha256: copy.sourceSha256,
				claimBoundary:
					'historical Bruneton drift reference only; never used as the live left side or as rendering input',
			}]),
		),
		parents: {
			product: PRODUCT_PARENT,
			flatControl: FLAT_CONTROL_PARENT,
			fibonacciCausal: FIBONACCI_CAUSAL_PARENT,
		},
	};
}

function cacheBuildMatchesExpected(record) {
	const expected = EXPECTED_CACHE_BUILD_FACTS[record.kind];
	const build = record.cacheReuse.buildRecord;
	return Boolean(expected)
		&& build.planIdentity?.id === expected.planId
		&& /^sha256:[a-f0-9]{64}$/u.test(build.planIdentity?.contentHash)
		&& (record.id !== 'sunset-plus-one-hour'
			|| record.kind !== 'spherical-distant'
			|| build.planIdentity.contentHash
				=== expected.causalPlusOneHourPlanContentHash)
		&& build.domainSelectionId === expected.domainSelectionId
		&& build.positionDomainId === expected.positionDomainId
		&& build.incomingDirectionCount === expected.incomingDirectionCount
		&& build.outgoingDirectionCount === expected.outgoingDirectionCount
		&& build.positionCount === expected.positionCount
		&& build.zCount === expected.zCount
		&& build.rhoCount === expected.rhoCount
		&& build.outgoingDirectionDomainId
			=== 'algorithm32-cubed-sphere-w27-outgoing-v1'
		&& build.maximumScatteringOrder === 4
		&& build.planResult === (record.kind === 'spherical-distant'
			? 'distant-sun-j-through-4'
			: 'local-sun-j-through-4')
		&& build.fieldCount === 10
		&& build.passCount === 10;
}

function deriveExpectedExposureGain(sourceLuminance) {
	const {
		brightThreshold,
		darkThreshold,
		maximumExposureGain,
	} = SOURCE_EXPOSURE_CURVE;
	if (sourceLuminance >= brightThreshold) return 1;
	if (sourceLuminance <= darkThreshold) return maximumExposureGain;
	const position = (
		Math.log(brightThreshold) - Math.log(sourceLuminance)
	) / (Math.log(brightThreshold) - Math.log(darkThreshold));
	const smoothPosition = position * position * (3 - 2 * position);
	return Math.exp(Math.log(maximumExposureGain) * smoothPosition);
}

function summarizeSourceDerivedCurveEvidence(records) {
	const points = records.map((record) => {
		const source = record.sourceLight;
		const channelEquationMaximumAbsoluteResidual = Math.max(
			...source.transmittedIrradiance.map((value, channel) => Math.abs(
				value - source.incidentIrradiance[channel]
					* source.transmittance[channel]
			)),
		);
		const expectedGain = deriveExpectedExposureGain(
			source.luminanceCdPerSquareMeter,
		);
		return {
			id: record.id,
			kind: record.kind,
			contractId: source.contractId,
			luminanceCdPerSquareMeter: source.luminanceCdPerSquareMeter,
			illuminanceLux: source.illuminanceLux,
			exposureGain: source.exposureGain,
			expectedGain,
			curve: source.exposureCurve,
			channelEquationMaximumAbsoluteResidual,
			luminanceEquationAbsoluteResidual: Math.abs(
				source.luminanceCdPerSquareMeter - source.illuminanceLux / Math.PI,
			),
			descriptorGain:
				record.color.candidateDescriptor.displayConversion.metadata
					.extraterrestrialVisibility.exposureGain,
		};
	});
	const ordered = [...points].sort(
		(left, right) =>
			left.luminanceCdPerSquareMeter - right.luminanceCdPerSquareMeter,
	);
	return {
		points,
		contractExact: points.every((point) => point.contractId
			=== 'atmosphere-transmitted-direct-source-local-luminance-v1'),
		monotonic: ordered.every((point, index) => index === 0
			|| point.exposureGain <= ordered[index - 1].exposureGain),
		equationsExact: points.every((point) =>
			point.channelEquationMaximumAbsoluteResidual === 0
				&& point.luminanceEquationAbsoluteResidual === 0
				&& point.exposureGain === point.expectedGain
				&& point.descriptorGain === point.exposureGain),
		configurationExact: points.every((point) =>
			JSON.stringify(point.curve) === JSON.stringify(SOURCE_EXPOSURE_CURVE)),
	};
}

function brunetonDisplayMetadataIsExact(descriptor) {
	const conversion = descriptor.displayConversion;
	const metadata = conversion?.metadata;
	return conversion?.conversionKind === EXPECTED_BRUNETON_DISPLAY.conversionKind
		&& conversion?.outputColorSpace === EXPECTED_BRUNETON_DISPLAY.outputColorSpace
		&& metadata?.paperFigure1ToneMapK
			=== EXPECTED_BRUNETON_DISPLAY.paperFigure1ToneMapK
		&& JSON.stringify(metadata?.maxLuminousEfficacy)
			=== JSON.stringify(EXPECTED_BRUNETON_DISPLAY.maxLuminousEfficacy)
		&& metadata?.demoGammaPowerOmitted
			=== EXPECTED_BRUNETON_DISPLAY.demoGammaPowerOmitted
		&& metadata?.demoWhitePointOmitted
			=== EXPECTED_BRUNETON_DISPLAY.demoWhitePointOmitted;
}

function colorRecordMatchesExpected(record) {
	const control = record.color.controlDescriptor;
	const candidate = record.color.candidateDescriptor;
	const visibility = candidate.displayConversion?.metadata
		?.extraterrestrialVisibility;
	return record.color.controlId === EXPECTED_BRUNETON_DISPLAY.controlId
		&& control.id === EXPECTED_BRUNETON_DISPLAY.controlId
		&& control.displayConversion?.toneMapping
			=== EXPECTED_BRUNETON_DISPLAY.toneMapping
		&& brunetonDisplayMetadataIsExact(control)
		&& record.color.candidateId
			=== BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID
		&& candidate.id === BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID
		&& brunetonDisplayMetadataIsExact(candidate)
		&& candidate.displayConversion?.toneMapping
			=== 'paper-figure1-base-plus-source-conditioned-extraterrestrial-shoulder'
		&& visibility?.inputLedger
			=== 'already-atmosphere-transported-celestial-radiance'
		&& visibility?.responseCoordinate === 'rec709-photopic-luminance'
		&& visibility?.sourceDerivedLocalLuminance
			=== record.sourceLight.luminanceCdPerSquareMeter
		&& JSON.stringify(visibility?.sourceExposureCurve)
			=== JSON.stringify(SOURCE_EXPOSURE_CURVE)
		&& visibility?.exposureGain === record.sourceLight.exposureGain
		&& visibility?.displayHeadroom
			=== DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM
		&& visibility?.displayShoulderPower === 8
		&& visibility?.composition === 'bounded-display-screen-blend';
}

function recordRuntimeAndImageHealthIsValid(record) {
	const runtimePhases = Object.values(record.runtimeHealth ?? {});
	const expectedRuntimePhaseCount = 3;
	const expectedDimensions = record.kind === 'spherical-distant'
		? {width: 640, height: 400}
		: {width: 720, height: 414};
	const imageEntries = Object.entries(record.analysis.imageHealth ?? {});
	return runtimePhases.length === expectedRuntimePhaseCount
		&& runtimePhases.every((health) =>
			health.status === 'installed'
				&& health.runtimeStatus === 'ready'
				&& typeof health.sourceHash === 'string'
				&& health.sourceHash === health.expectedSourceHash
				&& health.frameCount >= 1
				&& health.renderErrorCount === 0
				&& health.lastRenderError === null
				&& health.programCount > 0
				&& health.programDiagnostics.length === health.programCount
				&& health.programDiagnostics.every((diagnostic) => diagnostic === null)
				&& health.webglErrors.length === 0
				&& Array.isArray(health.webglStageLedger)
				&& health.webglStageLedger.length > 0
				&& health.webglStageLedger.every((stage) =>
					stage.contextLost === false
						&& Array.isArray(stage.codes)
						&& stage.codes.length === 0
						&& Array.isArray(stage.errors)
						&& stage.errors.length === 0)
				&& health.sceneInputCaptureFrameCount >= 1)
		&& imageEntries.length === expectedRuntimePhaseCount
		&& imageEntries.every(([phase, health]) => {
			const allowExactBlack = record.id === 'sunset-plus-two-hours'
				&& (phase === 'control' || phase === 'zeroCelestial');
			const normal = health.nonBlackPixelCount > 0
				&& health.nonWhitePixelCount > 0
				&& health.distinctRgbCount > 1;
			const exactBlack = allowExactBlack
				&& health.maximumChannel === 0
				&& health.nonBlackPixelCount === 0
				&& health.nonWhitePixelCount === health.pixelCount
				&& health.distinctRgbCount === 1;
			return health.width === expectedDimensions.width
				&& health.height === expectedDimensions.height
				&& health.pixelCount
					=== expectedDimensions.width * expectedDimensions.height
				&& health.minimumChannel >= 0
				&& health.maximumChannel <= 255
				&& (normal || exactBlack);
		});
}

function flatTransportPackingRecordIsValid(record) {
	if (record?.kind !== 'flat-local') return false;
	const evidence = record.transportPacking;
	const diagnostic = evidence?.diagnostic;
	const packing = diagnostic?.packing;
	const logical = packing?.logical;
	const physical = packing?.physical;
	const moduleDiagnostics = evidence?.moduleDiagnostics ?? [];
	const gpuProof = evidence?.gpuProof;
	const selectedPairs = gpuProof?.probeSelection?.selectedPairs ?? [];
	const mandatoryPairs = [
		[0, 0],
		[1, 14],
		[2, 0],
		[3, 14],
		[19_379, 0],
	];
	const hashPattern = /^sha256:[a-f0-9]{64}$/u;
	const expectedTransportPasses = [
		{id: 'local-sun-transport-j2-to-l2', kind: 'transport', order: 2},
		{id: 'local-sun-transport-j3-to-l3', kind: 'transport', order: 3},
	];
	const sameModuleDiagnostic = moduleDiagnostics.length === 2
		&& JSON.stringify(moduleDiagnostics[0])
			=== JSON.stringify(moduleDiagnostics[1]);
	const module = moduleDiagnostics[0];
	return evidence?.accepted === true
		&& evidence.addressBijectionMismatchCount === 0
		&& evidence.allPhysicalAxesWithinBackend === true
		&& evidence.backendCapabilities?.maximumTextureSize === 8192
		&& evidence.backendCapabilities.maximumArrayLayers >= 15
		&& evidence.geometryDescriptor?.policyId
			=== FLAT_TRANSPORT_PACKING_POLICY_ID
		&& evidence.geometryDescriptor.maximumTextureSize === 8192
		&& evidence.geometryDescriptor.minimumQueryColumnCount === 3
		&& diagnostic?.schemaId
			=== 'controlled-flat-transport-packing-diagnostic-v1'
		&& diagnostic?.policyId === FLAT_TRANSPORT_PACKING_POLICY_ID
		&& hashPattern.test(diagnostic.contentHash)
		&& diagnostic.sourceValuesSameObject === true
		&& diagnostic.coefficientValuesSameObject === true
		&& diagnostic.packingContentHash === packing?.contentHash
		&& logical?.queryCount === 19_380
		&& logical.wavelengthCount === 15
		&& Number.isSafeInteger(logical.tapCount)
		&& logical.tapCount >= 1
		&& logical.tapCount <= 256
		&& JSON.stringify(logical.sourceShape)
			=== JSON.stringify([logical.tapCount * 3, 19_380])
		&& JSON.stringify(logical.coefficientShape)
			=== JSON.stringify([logical.tapCount, 19_380, 15])
		&& logical.sourceScalarCount === logical.tapCount * 3 * 19_380
		&& logical.coefficientScalarCount
			=== logical.tapCount * 19_380 * 15
		&& physical?.queryColumnCount === 3
		&& physical.queryRowCount === 6_460
		&& physical.querySlotCount === 19_380
		&& physical.unusedQuerySlotCount === 0
		&& JSON.stringify(physical.sources.shape)
			=== JSON.stringify([logical.tapCount * 9, 6_460])
		&& JSON.stringify(physical.coefficients.shape)
			=== JSON.stringify([logical.tapCount * 3, 6_460, 15])
		&& physical.sources.paddingScalarCount === 0
		&& physical.coefficients.paddingScalarCount === 0
		&& physical.sources.scalarCount === logical.sourceScalarCount
		&& physical.coefficients.scalarCount === logical.coefficientScalarCount
		&& physical.allTextureAxesWithinLimit === true
		&& evidence.seamQueries?.length === 7
		&& JSON.stringify(evidence.seamQueries.map((query) => query.queryIndex))
			=== JSON.stringify([0, 1, 2, 3, 19_377, 19_378, 19_379])
		&& evidence.seamQueries.every((query) =>
			query.lastTapIndex === logical.tapCount - 1
				&& query.lastSourceComponentIndex === 2
				&& query.lastWavelengthIndex === 14
				&& query.reconstructedQueryIndex === query.queryIndex
				&& query.sourceLogicalOffset === query.sourcePhysicalOffset
				&& query.coefficientLogicalOffset
					=== query.coefficientPhysicalOffset)
		&& evidence.seamQueries.at(-1).sourcePhysicalOffset
			=== physical.sources.scalarCount - 1
		&& evidence.seamQueries.at(-1).coefficientPhysicalOffset
			=== physical.coefficients.scalarCount - 1
		&& JSON.stringify(evidence.transportPasses)
			=== JSON.stringify(expectedTransportPasses)
		&& sameModuleDiagnostic
		&& module?.policyId === FLAT_TRANSPORT_PACKING_POLICY_ID
		&& module.schemaId
			=== 'controlled-flat-transport-module-diagnostic-v1'
		&& hashPattern.test(module.contentHash)
		&& module.baseModule?.id
			=== 'algorithm32-flat-earth-transport-module-v3'
		&& module.controlledModule?.id
			=== 'contained-flat-earth-tiled-transport-module-v1'
		&& hashPattern.test(module.baseModule.contentHash)
		&& hashPattern.test(module.controlledModule.contentHash)
		&& module.baseModule.contentHash !== module.controlledModule.contentHash
		&& module.queryColumnCount === 3
		&& module.untouchedBlockCount === 0
		&& module.untouchedBindingCount === 3
		&& diagnostic.inputs?.sources?.scalarCount
			=== logical.sourceScalarCount
		&& diagnostic.inputs.coefficients?.scalarCount
			=== logical.coefficientScalarCount
		&& diagnostic.outputs?.sources?.scalarCount
			=== physical.sources.scalarCount
		&& diagnostic.outputs.coefficients?.scalarCount
			=== physical.coefficients.scalarCount
		&& JSON.stringify(diagnostic.inputs.sources.shape)
			=== JSON.stringify(logical.sourceShape)
		&& JSON.stringify(diagnostic.inputs.coefficients.shape)
			=== JSON.stringify(logical.coefficientShape)
		&& JSON.stringify(diagnostic.outputs.sources.shape)
			=== JSON.stringify(physical.sources.shape)
		&& JSON.stringify(diagnostic.outputs.coefficients.shape)
			=== JSON.stringify(physical.coefficients.shape)
		&& hashPattern.test(diagnostic.inputs.sources.contentHash)
		&& hashPattern.test(diagnostic.inputs.coefficients.contentHash)
		&& hashPattern.test(diagnostic.outputs.sources.contentHash)
		&& hashPattern.test(diagnostic.outputs.coefficients.contentHash)
		&& diagnostic.inputs.sources.contentHash
			!== diagnostic.outputs.sources.contentHash
		&& diagnostic.inputs.coefficients.contentHash
			!== diagnostic.outputs.coefficients.contentHash
		&& gpuProof?.schemaId === FLAT_TRANSPORT_GPU_PROOF_SCHEMA_ID
		&& gpuProof.policyId
			=== FLAT_TRANSPORT_GPU_PROBE_POLICY_ID
		&& gpuProof.accepted === true
		&& hashPattern.test(gpuProof.contentHash)
		&& JSON.stringify(gpuProof.planIdentity)
			=== JSON.stringify(record.cacheReuse.buildRecord.planIdentity)
		&& gpuProof.controlledModule?.instanceCount === 2
		&& gpuProof.controlledModule.id === module.controlledModule.id
		&& gpuProof.controlledModule.contentHash
			=== module.controlledModule.contentHash
		&& gpuProof.transportData?.tapCount === logical.tapCount
		&& gpuProof.transportData.queryColumnCount === 3
		&& gpuProof.transportData.sources?.id
			=== diagnostic.outputs.sources.id
		&& gpuProof.transportData.sources.contentHash
			=== diagnostic.outputs.sources.contentHash
		&& JSON.stringify(gpuProof.transportData.sources.shape)
			=== JSON.stringify(physical.sources.shape)
		&& gpuProof.transportData.coefficients?.id
			=== diagnostic.outputs.coefficients.id
		&& gpuProof.transportData.coefficients.contentHash
			=== diagnostic.outputs.coefficients.contentHash
		&& JSON.stringify(gpuProof.transportData.coefficients.shape)
			=== JSON.stringify(physical.coefficients.shape)
		&& gpuProof.probeSelection?.probeScalarCount > 0
		&& gpuProof.probeSelection.probeScalarCount <= 4_096
		&& gpuProof.probeSelection.maximumProbeScalarCount === 4_096
		&& gpuProof.probeSelection.selectedPairCount === selectedPairs.length
		&& record.cacheReuse.buildRecord.probeScalarCount
			=== gpuProof.probeSelection.probeScalarCount
		&& mandatoryPairs.every(([queryIndex, wavelengthIndex]) =>
			selectedPairs.some((pair) =>
				pair.queryIndex === queryIndex
					&& pair.wavelengthIndex === wavelengthIndex))
		&& JSON.stringify(gpuProof.transportPasses?.map((pass) => pass.id))
			=== JSON.stringify(['j2-to-l2', 'j3-to-l3'])
		&& gpuProof.transportPasses.every((pass) =>
			pass.accepted === true
				&& ((pass.id === 'j2-to-l2'
					&& pass.inputProducerPassId
						=== 'local-sun-scatter-l1-to-j2'
					&& pass.transportPassId
						=== 'local-sun-transport-j2-to-l2')
					|| (pass.id === 'j3-to-l3'
						&& pass.inputProducerPassId
							=== 'local-sun-scatter-l2-to-j3'
						&& pass.transportPassId
							=== 'local-sun-transport-j3-to-l3'))
				&& pass.pairCount === selectedPairs.length
				&& pass.nonzeroPairCount === pass.pairCount
				&& Number.isFinite(pass.maximumAbsoluteError)
				&& Number.isFinite(pass.maximumRelativeError)
				&& Number.isFinite(pass.maximumTolerance)
				&& pass.maximumAbsoluteError <= pass.maximumTolerance
				&& pass.pairs?.length === pass.pairCount
				&& pass.pairs.every((pair) =>
					pair.accepted === true
						&& Number.isFinite(pair.absoluteError)
						&& Number.isFinite(pair.tolerance)
						&& pair.absoluteError <= pair.tolerance));
}

function evaluateGates(result) {
	const records = [...result.spherical, ...result.flat];
	const sourceCurveEvidence = summarizeSourceDerivedCurveEvidence(records);
	const strictHistoricalDriftIds = new Set([
		'solar-noon',
		'sunset-minus-30-minutes',
		'sunset',
		'flat-0',
		'flat-90',
		'flat-180',
	]);
	const postSunsetHistoricalDiagnosticIds = new Set([
		'sunset-plus-30-minutes',
		'sunset-plus-two-hours',
	]);
	const plusOne = result.spherical.find(
		(record) => record.id === 'sunset-plus-one-hour',
	);
	const plusTwo = result.spherical.find(
		(record) => record.id === 'sunset-plus-two-hours',
	);
	const plusThirty = result.spherical.find(
		(record) => record.id === 'sunset-plus-30-minutes',
	);
	const sunsetMinusThirty = result.spherical.find(
		(record) => record.id === 'sunset-minus-30-minutes',
	);
	const sunset = result.spherical.find((record) => record.id === 'sunset');
	const flat0 = result.flat.find((record) => record.id === 'flat-0');
	const flat90 = result.flat.find((record) => record.id === 'flat-90');
	const flat180 = result.flat.find((record) => record.id === 'flat-180');
	const brightSpherical = result.spherical.filter((record) => [
		'solar-noon',
		'sunset-minus-30-minutes',
		'sunset',
	].includes(record.id));
	return [
		gate(
			'complete-live-matrix',
			JSON.stringify(result.spherical.map((record) => record.id))
				=== JSON.stringify(SPHERICAL_SCENE_IDS)
				&& JSON.stringify(result.flat.map((record) => record.id))
					=== JSON.stringify(FLAT_STATE_IDS),
			'Exactly six San Jose and three Union Glacier live pairs are present.',
			{
				spherical: result.spherical.map((record) => record.id),
				flat: result.flat.map((record) => record.id),
			},
		),
		gate(
			'all-fibonacci68-one-build-same-cache',
			records.every((record) =>
				cacheBuildMatchesExpected(record)
					&& record.cacheReuse.buildRecordCount === 1
					&& record.cacheReuse.sameControllerObject
					&& record.cacheReuse.sameCacheObject
					&& record.cacheReuse.sameCacheIdentity
					&& record.cacheReuse.samePlanIdentity
					&& record.cacheReuse.sameCelestialControllerObject
					&& record.cacheReuse.sameCelestialCacheObject
					&& record.cacheReuse.sameCelestialCacheIdentity
					&& record.cacheReuse.sameNonColorAssemblyDescriptor
					&& record.cacheReuse.expectedModelVersionTransition
					&& (record.kind !== 'flat-local'
						|| (record.zeroCelestialIsolation.samePrimaryControllerObject
							&& record.zeroCelestialIsolation.samePrimaryCacheObject
							&& record.zeroCelestialIsolation.samePrimaryCacheIdentity
							&& record.zeroCelestialIsolation.exactZeroCelestialCache
							&& record.zeroCelestialIsolation.sameColorFingerprint
							&& record.zeroCelestialIsolation.finiteDiskFunctionAbsent
							&& record.zeroCelestialIsolation.buildRecordCount === 1))),
			'Every live left/right pair uses the exact distant-v1 or local-v3 plan axes, one reflection-completed-FIB68 build, and identical cache/controller/plan physics; Flat zero-celestial isolation also preserves that primary cache and Color.',
			records.map((record) => ({id: record.id, cache: record.cacheReuse})),
		),
		gate(
			'flat-fibonacci68-bounded-transport-packing',
			result.flat.every(flatTransportPackingRecordIsValid)
				&& new Set(result.flat.map((record) =>
					record.cacheReuse.buildRecord.planIdentity.contentHash)).size === 3,
			'Flat0/90/180 each use a distinct live local-v3 N4 plan whose 19,380 FIB68 transport queries are retained under the bounded three-column texture layout; both higher-order GPU transport passes independently reproduce selected packed dot products within binary32 error bounds.',
			result.flat.map((record) => ({
				id: record.id,
				planIdentity: record.cacheReuse.buildRecord.planIdentity,
				packing: {
					accepted: record.transportPacking?.accepted ?? false,
					backendCapabilities:
						record.transportPacking?.backendCapabilities ?? null,
					logical:
						record.transportPacking?.diagnostic?.packing?.logical ?? null,
					physical:
						record.transportPacking?.diagnostic?.packing?.physical ?? null,
					moduleDiagnostics:
						record.transportPacking?.moduleDiagnostics ?? null,
					gpuProof: record.transportPacking?.gpuProof
						? {
							schemaId: record.transportPacking.gpuProof.schemaId,
							contentHash: record.transportPacking.gpuProof.contentHash,
							probeSelection:
								record.transportPacking.gpuProof.probeSelection,
							transportPasses:
								record.transportPacking.gpuProof.transportPasses,
						}
						: null,
				},
			})),
		),
		gate(
			'all-noncelestial-bruneton-parity',
			records.every((record) =>
				record.analysis.nonCelestialParity.maximumAbsoluteChannelDifference <= 1
					&& record.analysis.zeroCelestialOutsideSupportParity
						.maximumAbsoluteChannelDifference <= 1),
			'Every byte outside the complete external-celestial support mask differs from live Bruneton by at most one, and removing the celestial product changes no such candidate byte by more than one.',
			records.map((record) => ({
				id: record.id,
				brunetonParity: record.analysis.nonCelestialParity,
				zeroCelestialParity:
					record.analysis.zeroCelestialOutsideSupportParity,
			})),
		),
		gate(
			'historical-bruneton-drift-scoped',
			records.every((record) => {
				const drift = record.analysis.historicalBrunetonDrift;
				const metrics = drift?.metrics;
				if (!metrics
					|| metrics.pixelCount <= 0
					|| !Number.isFinite(metrics.rootMeanSquareChannelDifference)
					|| !Number.isFinite(metrics.p99AbsoluteChannelDifference)) {
					return false;
				}
				if (strictHistoricalDriftIds.has(record.id)) {
					return drift.classification
						=== 'strict-close-match-outside-celestial-support'
						&& metrics.maximumAbsoluteChannelDifference <= 8
						&& metrics.p99AbsoluteChannelDifference <= 2
						&& metrics.rootMeanSquareChannelDifference <= 1;
				}
				if (record.id === 'sunset-plus-one-hour') {
					return drift.classification
						=== 'intentional-fib68-lobe-correction-full-frame-owner-review'
						&& metrics.differingPixelCount > 0;
				}
				return postSunsetHistoricalDiagnosticIds.has(record.id)
					&& drift.classification === 'post-sunset-diagnostic';
			}),
			'Strict daylight/through-sunset and Flat controls remain within max/p99/RMSE <=8/2/1 bytes outside celestial support; +30m/+2h are reported diagnostics; +1h is separately classified as the intentional FIB68 lobe-correction owner-review scope.',
			records.map((record) => ({
				id: record.id,
				drift: record.analysis.historicalBrunetonDrift ?? null,
			})),
		),
		gate(
			'all-color-descriptor-and-shader-identities',
			result.colorIdentityAudit.sameConfigurationStable
				&& result.colorIdentityAudit.allMaterialInputsChangeFingerprint
				&& result.colorIdentityAudit.baseGain
					=== result.colorIdentityAudit.sameEndpointGainDifferentSourceGain
				&& JSON.stringify(Object.keys(
					result.colorIdentityAudit.variantFingerprints,
				)) === JSON.stringify([
					'sameEndpointGainDifferentSource',
					'brightThreshold',
					'darkThreshold',
					'maximumExposureGain',
					'headroom',
				])
				&& new Set(records.map((record) =>
					record.color.controlDescriptor.fingerprint)).size === 1
				&& records.every((record) => {
					const audit = record.color.candidateShaderAudit;
					const controlAudit = record.color.controlShaderAudit;
					return colorRecordMatchesExpected(record)
						&& controlAudit.brunetonConstants
						&& controlAudit.baseInvocationCount === 1
						&& controlAudit.v2InvocationCount === 0
						&& controlAudit.bakedToneMapK === Number(
							EXPECTED_BRUNETON_DISPLAY.paperFigure1ToneMapK
								.toPrecision(12),
						)
						&& record.color.controlDescriptor.fingerprint
						!== record.color.candidateDescriptor.fingerprint
						&& audit.v2InvocationCount === 1
						&& audit.staleBaseInvocationCount === 0
						&& audit.externalSectionTransmittanceReferenceCount === 0
						&& audit.separatePathLedger
						&& audit.alreadyTransportedExternalLedger
						&& audit.baked.exposureGain
							=== audit.descriptorMetadata.exposureGain
						&& audit.baked.displayHeadroom
							=== audit.descriptorMetadata.displayHeadroom
						&& audit.baked.displayShoulderPower
							=== audit.descriptorMetadata.displayShoulderPower
						&& audit.baked.toneMapK === Number(
							EXPECTED_BRUNETON_DISPLAY.paperFigure1ToneMapK
								.toPrecision(12),
						);
				}),
			'Color fingerprints bind every material input and each assembly bakes the descriptor gain/headroom/power with one V2 encoder and no external re-transmittance.',
			result.colorIdentityAudit,
		),
		gate(
			'source-derived-local-luminance-curve',
			sourceCurveEvidence.contractExact
				&& sourceCurveEvidence.monotonic
				&& sourceCurveEvidence.equationsExact
				&& sourceCurveEvidence.configurationExact,
			'Every exposure point is derived only from atmosphere-transmitted local source irradiance, follows the exact smooth log curve, is monotonic, and matches the Color descriptor.',
			sourceCurveEvidence,
		),
		gate(
			'bright-source-identity-exposure',
			brightSpherical.every((record) => record.sourceLight.exposureGain === 1)
				&& result.flat.every((record) =>
					record.sourceLight.exposureGain === 1),
			'Solar noon through sunset and Flat 0/90/180 retain exact exposure gain one.',
			{
				spherical: Object.fromEntries(brightSpherical.map(
					(record) => [record.id, record.sourceLight.exposureGain],
				)),
				flat: Object.fromEntries(result.flat.map(
					(record) => [record.id, record.sourceLight.exposureGain],
				)),
			},
		),
		gate(
			'plus-one-hour-stars-visible-ranked-distinct-bounded',
			plusOne.analysis.candidateStars.eligibleCount === 32
				&& plusOne.analysis.candidateStars.visibleCount === 32
				&& plusOne.analysis.candidateStars.distinctRgbCount >= 28
				&& plusOne.analysis.candidateStars.maximumChannel <= 254
				&& plusOne.analysis.candidateStars.exactWhiteCount === 0
				&& plusOne.analysis.candidateStars.negativeUpliftChannelCount === 0
				&& plusOne.analysis.candidateStars.peakChannelQuantiles.minimum >= 1
				&& plusOne.analysis.candidateStars.peakChannelQuantiles.median >= 32
				&& plusOne.analysis.candidateStars.rank.spearmanCorrelation >= 0.5,
			'At +1 hour all 32 isolated stellar uplifts are positive (median >=32), nonnegative, at least 28 uplift RGBs remain distinct, raw-palette rank correlation is at least 0.5, total candidate peak is <=254, and none is white.',
			plusOne.analysis.candidateStars,
		),
		gate(
			'plus-two-hour-stars-visible-ranked-distinct-bounded',
			plusTwo.analysis.candidateStars.eligibleCount === 32
				&& plusTwo.analysis.candidateStars.visibleCount >= 31
				&& plusTwo.analysis.candidateStars.distinctRgbCount >= 28
				&& plusTwo.analysis.candidateStars.maximumChannel <= 254
				&& plusTwo.analysis.candidateStars.exactWhiteCount === 0
				&& plusTwo.analysis.candidateStars.negativeUpliftChannelCount === 0
				&& plusTwo.analysis.candidateStars.peakChannelQuantiles.firstQuartile >= 1
				&& plusTwo.analysis.candidateStars.peakChannelQuantiles.median >= 32
				&& plusTwo.analysis.candidateStars.rank.spearmanCorrelation >= 0.5,
			'At +2 hours at least 31 of 32 isolated stellar uplifts are positive (first quartile >=1, median >=32), nonnegative, at least 28 uplift RGBs remain distinct, raw-palette rank correlation is at least 0.5, total candidate peak is <=254, and none is white.',
			plusTwo.analysis.candidateStars,
		),
		gate(
			'post-sunset-sun-support-does-not-uplift',
			[[plusThirty, 9], [plusOne, 11], [plusTwo, 14]].every(
				([record, expectedCount]) =>
				record.analysis.sunEntryUplift.eligibleCount === expectedCount
					&& record.analysis.sunEntryUplift.maximumPositiveChannelUplift <= 1
					&& record.analysis.sunEntryUplift.maximumAbsoluteChannelDifference <= 1),
			'The exact 9/11/14 below-horizon +30m/+1h/+2h Sun-product entries contribute at most one display byte over the same-Color zero-celestial frame.',
			[plusThirty, plusOne, plusTwo].map((record) => ({
				id: record.id,
				sunEntryUplift: record.analysis.sunEntryUplift,
			})),
		),
		gate(
			'visible-spherical-solar-discs-bounded',
			[[sunsetMinusThirty, 10], [sunset, 12]].every(
				([record, expectedCount]) => {
					const sun = record.analysis.sunEntryUplift;
					return sun.eligibleCount === expectedCount
						&& sun.changedPixelCount > 0
						&& sun.maximumPositiveChannelUplift >= 64
						&& sun.peak !== null
						&& sun.changedPeak !== null
						&& sun.peak.maximum <= 254
						&& sun.exactWhiteCount === 0;
				}),
			'The exact sunset-minus-30m and sunset disk supports are live, peak at least 64, remain <=254, and contain no exact-white pixel.',
			[sunsetMinusThirty, sunset].map((record) => ({
				id: record.id,
				sunEntryUplift: record.analysis.sunEntryUplift,
			})),
		),
		gate(
			'flat-finite-disc-support-and-offscreen-control',
			flat0.analysis.support.supportPixelCount === 0
				&& flat0.source.projectedCenterNdc[1] > 1
				&& [flat90, flat180].every((record) =>
					record.analysis.support.supportPixelCount > 0
						&& record.analysis.support.changedPixelCount > 0
						&& record.analysis.support.changedPeak !== null
						&& record.analysis.support.maximumPositiveChannelUplift >= 64
						&& record.analysis.support.negativeUpliftChannelCount === 0
						&& record.analysis.support.peak.maximum <= 254
						&& record.analysis.support.exactWhiteCount === 0),
			'Flat0 is analytically outside the fixed Flat180 camera; Flat90/180 have live changed finite-disk support, peak at least 64, remain <=254, and contain no exact-white pixel.',
			[flat0, flat90, flat180].map((record) => ({
				id: record.id,
				projectedCenterNdc: record.source.projectedCenterNdc,
				support: record.analysis.support,
			})),
		),
		gate(
			'flat180-combined-sun-warm-bounded',
			flat180.analysis.support.supportPixelCount > 0
				&& flat180.analysis.support.changedPixelCount > 0
				&& flat180.analysis.support.exactWhiteCount === 0
				&& flat180.analysis.support.peak.maximum <= 254
				&& flat180.analysis.support.changedPeak !== null
				&& flat180.analysis.support.changedPeak.maximum >= 128
				&& flat180.analysis.support.changedPeak.greenToRed <= 0.7
				&& flat180.analysis.support.changedPeak.blueToRed <= 0.3,
			'Actual full-composite Flat180 finite-Sun support is nonempty, changed, warm (G/R<=0.7, B/R<=0.3), <=254, and never exact white.',
			flat180.analysis.support,
		),
		gate(
			'all-nine-runtime-and-image-health',
			records.every((record) =>
				record.webglErrors.length === 0
					&& record.sceneInputCaptureFrameCount >= 1
					&& record.programDiagnostics.length > 0
					&& record.programDiagnostics.every(
						(diagnostic) => diagnostic === null,
					)
					&& recordRuntimeAndImageHealthIsValid(record)),
			'All live control/candidate/diagnostic phases are installed, execute scene-input frames, have runnable/null program diagnostics and zero WebGL errors, and decode to exact-size nondegenerate images.',
			records.map((record) => ({
				id: record.id,
				runtimeHealth: record.runtimeHealth,
				imageHealth: record.analysis.imageHealth,
			})),
		),
	];
}

async function writeCapture(run, pathName, dataUrl, expectedDimensions) {
	const bytes = pngBytes(dataUrl);
	const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
	requireCondition(
		bytes.length >= 24
			&& bytes.subarray(0, 8).equals(pngSignature)
			&& bytes.toString('ascii', 12, 16) === 'IHDR',
		`Capture is not a structurally valid PNG: ${pathName}`,
	);
	const dimensions = {
		width: bytes.readUInt32BE(16),
		height: bytes.readUInt32BE(20),
	};
	assertExactJson(
		dimensions,
		expectedDimensions,
		`Capture dimensions changed: ${pathName}`,
	);
	await run.writeArtifact(pathName, bytes);
	const absolutePath = path.join(run.runDirectory, ...pathName.split('/'));
	return {
		path: pathName,
		byteLength: bytes.byteLength,
		sha256: await sha256File(absolutePath),
		dimensions,
	};
}

async function materializeCaptures(
	run,
	browserResult,
	productCopies,
	historicalControlCopies,
) {
	const captures = {};
	const derivation = {};
	for (const record of browserResult.spherical) {
		const prefix = `san-jose-${record.id}`;
		const control = await writeCapture(
			run,
			`captures/bruneton-${prefix}.png`,
			record.controlPngDataUrl,
			{width: 640, height: 400},
		);
		const candidate = await writeCapture(
			run,
			`captures/extraterrestrial-visibility-${prefix}.png`,
			record.candidatePngDataUrl,
			{width: 640, height: 400},
		);
		const pair = await writeCapture(
			run,
			`captures/paired-${prefix}.png`,
			record.pairPngDataUrl,
			{width: 1280, height: 430},
		);
		const zeroCelestialDiagnostic = await writeCapture(
			run,
			`diagnostics/zero-celestial-${prefix}.png`,
			record.zeroCelestialPngDataUrl,
			{width: 640, height: 400},
		);
		const sourceArtifacts = productCopies.filter((copy) =>
			copy.sourcePath === `browser/${record.id}-matrix.u16`
				|| copy.sourcePath === `browser/${record.id}-palette.f32`);
		const historicalBrunetonControl = historicalControlCopies.find(
			(copy) => copy.id === record.id && copy.kind === record.kind,
		);
		requireCondition(
			historicalBrunetonControl,
			`Missing historical Bruneton drift input for ${record.id}.`,
		);
		captures[record.id] = pair.path;
		derivation[record.id] = {
			kind: record.kind,
			inputs: {
				browserConfiguration: 'browser/config.json',
				screenPaletteProducts: sourceArtifacts,
				historicalBrunetonDriftControl: historicalBrunetonControl,
				liveCachePlanIdentity:
					record.cacheReuse.candidatePlanIdentity,
				colorDescriptors: {
					control: record.color.controlDescriptor,
					candidate: record.color.candidateDescriptor,
				},
				zeroCelestialIsolation: {
					policy:
						'zero the already-bound screen matrix in-place without changing the candidate handle, primary cache, Color, palette, scene, or camera',
					runtimeHealth: record.runtimeHealth.zeroCelestial,
				},
			},
			operation:
				'build one live reflection-completed-FIB68 N4 atmosphere cache; render unchanged Bruneton; Color-only setConfig on the same handle; assert identical cache/controller/plan objects; render V2; zero only the same live screen-product matrix and render the same-Color isolated-celestial diagnostic; place control left and V2 right',
			outputs: {control, candidate, pair},
			diagnostics: {zeroCelestial: zeroCelestialDiagnostic},
		};
		delete record.controlPngDataUrl;
		delete record.candidatePngDataUrl;
		delete record.zeroCelestialPngDataUrl;
		delete record.pairPngDataUrl;
		record.captures = {
			control: control.path,
			candidate: candidate.path,
			pair: pair.path,
		};
	}
	for (const record of browserResult.flat) {
		const prefix = `union-glacier-${record.id}`;
		const control = await writeCapture(
			run,
			`captures/bruneton-${prefix}.png`,
			record.controlPngDataUrl,
			{width: 720, height: 414},
		);
		const candidate = await writeCapture(
			run,
			`captures/extraterrestrial-visibility-${prefix}.png`,
			record.candidatePngDataUrl,
			{width: 720, height: 414},
		);
		const pair = await writeCapture(
			run,
			`captures/paired-${prefix}.png`,
			record.pairPngDataUrl,
			{width: 1440, height: 444},
		);
		const zeroCelestialDiagnostic = await writeCapture(
			run,
			`diagnostics/zero-celestial-${prefix}.png`,
			record.zeroCelestialPngDataUrl,
			{width: 720, height: 414},
		);
		const historicalBrunetonControl = historicalControlCopies.find(
			(copy) => copy.id === record.id && copy.kind === record.kind,
		);
		requireCondition(
			historicalBrunetonControl,
			`Missing historical Bruneton drift input for ${record.id}.`,
		);
		captures[record.id] = pair.path;
		derivation[record.id] = {
			kind: record.kind,
			inputs: {
				browserConfiguration: 'browser/config.json',
				fixture:
					'browser/fixtures/union-glacier-flat-local-closest-approach-v1.json',
				historicalBrunetonDriftControl: historicalBrunetonControl,
				liveCachePlanIdentity:
					record.cacheReuse.candidatePlanIdentity,
				transportPacking: record.transportPacking,
				colorDescriptors: {
					control: record.color.controlDescriptor,
					candidate: record.color.candidateDescriptor,
				},
				zeroCelestialIsolation: record.zeroCelestialIsolation,
			},
			operation:
				'derive finite-source reference calibration from source irradiance, surface radiance, and radius; reinterpret the complete logical Flat FIB68 transport table through the identity-bound bounded three-column storage/address map without changing any physical value or equation; build one live reflection-completed-FIB68 N4 Flat/local atmosphere cache and independently replay selected live L2/L3 packed GPU dot products; render unchanged Bruneton; Color-only setConfig on the same handle; assert identical cache/controller/plan objects; render V2; omit only the finite celestial participant while preserving the same primary cache and candidate Color and render the isolated diagnostic; place control left and V2 right',
			outputs: {control, candidate, pair},
			diagnostics: {zeroCelestial: zeroCelestialDiagnostic},
		};
		delete record.controlPngDataUrl;
		delete record.candidatePngDataUrl;
		delete record.zeroCelestialPngDataUrl;
		delete record.pairPngDataUrl;
		record.captures = {
			control: control.path,
			candidate: candidate.path,
			pair: pair.path,
		};
	}
	return {captures, derivation};
}

function summarizeMaterializedCaptureHealth(captureEvidence) {
	const sceneIds = Object.keys(captureEvidence.derivation);
	const outputRecords = Object.values(captureEvidence.derivation).flatMap(
		(record) => Object.values(record.outputs),
	);
	const diagnosticRecords = Object.values(captureEvidence.derivation).flatMap(
		(record) => Object.values(record.diagnostics ?? {}),
	);
	return {
		sceneCount: sceneIds.length,
		outputCount: outputRecords.length,
		diagnosticCount: diagnosticRecords.length,
		pngArtifactCount: outputRecords.length + diagnosticRecords.length,
		allNonempty: [...outputRecords, ...diagnosticRecords].every(
			(record) => record.byteLength > 24,
		),
		allContentAddressed: [...outputRecords, ...diagnosticRecords].every((record) =>
			/^sha256:[a-f0-9]{64}$/u.test(`sha256:${record.sha256}`)),
		allDimensionsExact: Object.values(captureEvidence.derivation).every(
			(record) =>
				(record.kind === 'spherical-distant'
					? record.outputs.control.dimensions.width === 640
						&& record.outputs.control.dimensions.height === 400
						&& record.outputs.candidate.dimensions.width === 640
						&& record.outputs.candidate.dimensions.height === 400
						&& record.outputs.pair.dimensions.width === 1280
						&& record.outputs.pair.dimensions.height === 430
					: record.outputs.control.dimensions.width === 720
						&& record.outputs.control.dimensions.height === 414
						&& record.outputs.candidate.dimensions.width === 720
						&& record.outputs.candidate.dimensions.height === 414
						&& record.outputs.pair.dimensions.width === 1440
						&& record.outputs.pair.dimensions.height === 444),
		),
		sceneIds,
	};
}

function report(runId, conclusion, proof) {
	const records = [...proof.browser.spherical, ...proof.browser.flat];
	const flatPackingSummary = proof.browser.flat.map((record) => {
		const packing = record.transportPacking.diagnostic.packing;
		const probe = record.transportPacking.gpuProof.probeSelection;
		return `${record.id}=q${packing.logical.queryCount}/C${packing.physical.queryColumnCount}/rows${packing.physical.queryRowCount}/probes${probe.probeScalarCount}`;
	}).join('; ');
	const plusOne = proof.browser.spherical.find(
		(record) => record.id === 'sunset-plus-one-hour',
	);
	const plusTwo = proof.browser.spherical.find(
		(record) => record.id === 'sunset-plus-two-hours',
	);
	const flat180 = proof.browser.flat.find((record) => record.id === 'flat-180');
	const strictHistoricalDrift = records
		.filter((record) => record.analysis.historicalBrunetonDrift
			?.classification === 'strict-close-match-outside-celestial-support');
	const plusOneHistorical = plusOne.analysis.historicalBrunetonDrift;
	const maximumBrunetonOutsideSupportDelta = Math.max(...records.map(
		(record) => record.analysis.nonCelestialParity
			.maximumAbsoluteChannelDifference,
	));
	const maximumZeroCelestialOutsideSupportDelta = Math.max(...records.map(
		(record) => record.analysis.zeroCelestialOutsideSupportParity
			.maximumAbsoluteChannelDifference,
	));
	return [
		`# ${runId}: final live Bruneton/FIB68 paired captures`,
		'',
		`Conclusion: **${conclusion}**.`,
		'',
		`- Gates: ${proof.gates.filter((item) => item.passed).length}/${proof.gates.length} passed.`,
		`- CPU Color smoke: ${proof.cpuColorSmoke.smokeId}; accepted=${proof.cpuColorSmoke.accepted}; evidence=${proof.cpuColorSmoke.artifact.path}.`,
		`- Flat transport-packing smoke: ${proof.flatTransportPackingSmoke.smokeId}; accepted=${proof.flatTransportPackingSmoke.accepted}; evidence=${proof.flatTransportPackingSmoke.artifact.path}.`,
		`- Live bounded Flat FIB68 transport: ${flatPackingSummary}. Both L2/L3 packed GPU dot-product proofs passed.`,
		`- Maximum outside-support byte delta, candidate vs live Bruneton / candidate vs same-Color zero celestial: ${maximumBrunetonOutsideSupportDelta}/${maximumZeroCelestialOutsideSupportDelta}.`,
		`- +1-hour isolated stellar uplift eligible/visible/distinct/median/total-peak/white: ${plusOne.analysis.candidateStars.eligibleCount}/${plusOne.analysis.candidateStars.visibleCount}/${plusOne.analysis.candidateStars.distinctRgbCount}/${plusOne.analysis.candidateStars.peakChannelQuantiles.median}/${plusOne.analysis.candidateStars.maximumChannel}/${plusOne.analysis.candidateStars.exactWhiteCount}.`,
		`- +2-hour isolated stellar uplift eligible/visible/distinct/median/total-peak/white: ${plusTwo.analysis.candidateStars.eligibleCount}/${plusTwo.analysis.candidateStars.visibleCount}/${plusTwo.analysis.candidateStars.distinctRgbCount}/${plusTwo.analysis.candidateStars.peakChannelQuantiles.median}/${plusTwo.analysis.candidateStars.maximumChannel}/${plusTwo.analysis.candidateStars.exactWhiteCount}.`,
		`- Flat180 full-support maximum RGB: [${flat180.analysis.support.peak.rgb.join(', ')}]; changed-source warm sample RGB: [${flat180.analysis.support.changedPeak.rgb.join(', ')}].`,
		`- Strict historical Bruneton drift max/p99/RMSE byte metrics: ${strictHistoricalDrift.map((record) => `${record.id}=${record.analysis.historicalBrunetonDrift.metrics.maximumAbsoluteChannelDifference}/${record.analysis.historicalBrunetonDrift.metrics.p99AbsoluteChannelDifference}/${record.analysis.historicalBrunetonDrift.metrics.rootMeanSquareChannelDifference}`).join('; ')}.`,
		`- +1-hour historical drift classification: ${plusOneHistorical.classification}; differing pixels: ${plusOneHistorical.metrics.differingPixelCount}.`,
		'',
		'Each left side is live unchanged Bruneton. Each right side is live V2 Color. Both sides of every pair use the same one-build reflection-completed-FIB68 cache object and plan; historical rendered controls are used only as drift-analysis oracles, never as a live panel or rendering input.',
		'Run 000471 supplies only the accepted +1-hour one-dimensional FIB68 causal control. The final +1-hour pair is the full-frame owner-review surface and is not presented as a prior-FIB34 similarity result.',
		'Run 000467 is only the historical FIB34/untiled Flat visual-drift oracle. Bounded Flat transport storage is qualified here by the retained source-level packing smoke, live setup/error ledger, and independent L2/L3 packed GPU dot-product probes.',
		'Nine same-Color zero-celestial diagnostic PNGs support isolated stellar/Sun-uplift measurements; they are evidence only and are not user-facing paired captures.',
		'',
		'## Final paired captures',
		'',
		...Object.entries(proof.captures).map(
			([id, capture]) => `- ${id}: ${capture}`,
		),
		'',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) {
		throw new Error('The final paired-capture runner accepts no arguments.');
	}
	const run = await initializeRunRecord({
		slug: 'bruneton-fibonacci68-final-paired-captures',
		command: COMMAND,
		inputs: {
			schemaId: 'bruneton-fibonacci68-final-paired-captures-input-v1',
			colorModelId: BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
			sourceExposureCurve: SOURCE_EXPOSURE_CURVE,
			extraterrestrialDisplayHeadroom:
				DEFAULT_EXTRATERRESTRIAL_DISPLAY_HEADROOM,
			sphericalScenes: SPHERICAL_SCENE_IDS,
			flatStates: FLAT_STATE_IDS,
			productParent: PRODUCT_PARENT,
			flatControlParent: FLAT_CONTROL_PARENT,
			fibonacciCausalParent: FIBONACCI_CAUSAL_PARENT,
			productParentArtifacts: PRODUCT_PARENT_ARTIFACTS,
			historicalBrunetonControls: HISTORICAL_BRUNETON_CONTROLS,
			fixtures: FIXTURES,
			cpuColorSmoke: {
				path:
					`experiments/extraterrestrial/${CPU_COLOR_SMOKE_RELATIVE_PATH}`,
				expectedSmokeId:
					'bruneton-extraterrestrial-visibility-color-cpu-smoke-v1',
			},
			flatTransportPackingSmoke: {
				path:
					`experiments/extraterrestrial/${FLAT_TRANSPORT_PACKING_SMOKE_RELATIVE_PATH}`,
				expectedSmokeId:
					'controlled-flat-fibonacci68-transport-packing-smoke-v1',
				policyId: FLAT_TRANSPORT_PACKING_POLICY_ID,
			},
		},
		provenance: {
			schemaId: 'bruneton-fibonacci68-final-paired-captures-provenance-v1',
			operation:
				'verify and byte-copy immutable screen-space stellar/Sun products and historical Bruneton drift oracles; bind the accepted FIB68 causal proof; execute and retain the contained self-verifying CPU Color and bounded Flat FIB68 transport-packing smokes; for every scene build one live FIB68 N4 atmosphere cache, including identity-bound three-column Flat transport storage and independent live L2/L3 packed GPU dot-product probes; render live unchanged Bruneton, compare that fresh control to history only outside complete celestial support, switch only Color on the same handle, prove cache/controller/plan object reuse, render live V2, isolate celestial uplift with the same primary cache and candidate Color, and compose labeled Bruneton-left/V2-right captures',
			implementation: [
				'experiments/extraterrestrial/stellar-screen-palette/BrunetonExtraterrestrialVisibilityColorDisplayModel.js',
				'experiments/extraterrestrial/stellar-screen-palette/ControlledDistantSunLightSource.js',
				'experiments/extraterrestrial/stellar-screen-palette/ControlledLocalSunLightSource.js',
				'experiments/extraterrestrial/stellar-screen-palette/ControlledFlatEarthFibonacci68TransportGeometry.js',
				'experiments/extraterrestrial/stellar-screen-palette/FlatFibonacci68TransportGpuProbe.js',
				'experiments/extraterrestrial/stellar-screen-palette/ReflectionCompletedFibonacci68Control.js',
				'experiments/extraterrestrial/stellar-screen-palette/smoke-bruneton-extraterrestrial-visibility-color.js',
				'experiments/extraterrestrial/stellar-screen-palette/smoke-controlled-flat-fibonacci68-transport-packing.js',
				'experiments/extraterrestrial/stellar-screen-palette/run-bruneton-fibonacci68-final-paired-captures-browser.js',
				'experiments/extraterrestrial/runners/render-bruneton-fibonacci68-final-paired-captures.js',
			],
			parentReuse:
				'prior run terminal manifest and artifact-set identity are verified; selected artifacts are checked against pinned byte length and SHA-256, copied byte-for-byte into the new run, and rehashed before use',
			exclusions: [
				'historical FIB34 rendered controls as a live left panel, rendering input, or user-facing final capture; pinned copies are drift-analysis oracles only',
				'run 000467 as Flat transport-packing or FIB68 causal evidence; it is an untiled historical FIB34 visual-drift oracle only',
				'production runtime dependency',
				'production/candidate/baseline mutation',
				'scattered-light adaptation',
				'rod/cone response',
				'time, location, source-kind, night, scene, or camera Color branch',
				'ozone change',
			],
		},
		environment: {
			schemaId: 'bruneton-fibonacci68-final-paired-captures-environment-v1',
			node: process.version,
			nodeExecutablePath: process.execPath,
			platform: process.platform,
			architecture: process.arch,
			chromePath: CHROME_PATH,
		},
		references: {
			schemaId: 'bruneton-fibonacci68-final-paired-captures-references-v1',
			activeTopic: 'agents/topics/active-topic.md',
			design:
				'agents/topics/extraterrestrial/stellar-screen-palette-design.md',
			appearanceArchitecture:
				'agents/topics/extraterrestrial/sun-disk-appearance-design.md',
			productParent: PRODUCT_PARENT,
			flatControlParent: FLAT_CONTROL_PARENT,
			fibonacciCausalParent: FIBONACCI_CAUSAL_PARENT,
		},
	});
	let server;
	let browserProfilePath;
	try {
		await assertRepositoryIdentity();
		await Promise.all([
			assertNoReparseEntries(SCREEN_PALETTE_ROOT, 'Screen-palette source'),
			assertNoReparseEntries(CANDIDATE_ROOT, 'Contained candidate'),
			assertNoReparseEntries(BASELINE_ROOT, 'Contained baseline'),
			assertNoReparseEntries(FIXTURES_ROOT, 'Contained fixtures'),
		]);
		const chromeInfo = await lstat(CHROME_PATH);
		requireCondition(
			chromeInfo.isFile() && !chromeInfo.isSymbolicLink(),
			'Chrome executable must be a real non-symlink file.',
		);
		const chromeIdentity = {
			path: CHROME_PATH,
			sha256: await sha256File(CHROME_PATH),
			byteLength: chromeInfo.size,
		};
		const nodeInfo = await lstat(process.execPath);
		requireCondition(
			nodeInfo.isFile() && !nodeInfo.isSymbolicLink(),
			'Node executable must be a real non-symlink file.',
		);
		const nodeIdentity = {
			path: process.execPath,
			version: process.version,
			sha256: await sha256File(process.execPath),
			byteLength: nodeInfo.size,
		};
		const closureBefore = await buildImplementationClosure();
		const [
			implementationClosure,
			experimentPackageInventory,
			threeDependencyInventory,
			candidateInventory,
			baselineInventory,
		] = await Promise.all([
			describeImplementationClosure(closureBefore),
			createSelectedFileInventory(
				EXPERIMENT_ROOT,
				['package.json', 'package-lock.json'],
			),
			createFileInventory(THREE_ROOT),
			createFileInventory(CANDIDATE_ROOT),
			createFileInventory(BASELINE_ROOT),
		]);
		const productionBefore = await inventoryProduction();
		await run.writeJsonArtifact(
			'evidence/implementation-closure.json',
			implementationClosure,
		);
		await run.writeJsonArtifact('evidence/tooling.json', {
			node: nodeIdentity,
			chrome: chromeIdentity,
			experimentPackageInventory,
			threeDependencyInventory,
			candidateInventory,
			baselineInventory,
		});

		const productParentState = await verifyParentIdentity(PRODUCT_PARENT);
		const flatControlParentState = await verifyParentIdentity(
			FLAT_CONTROL_PARENT,
		);
		const causalParentState = await verifyParentIdentity(
			FIBONACCI_CAUSAL_PARENT,
		);
		const parentTerminalManifests = [
			await copyTerminalManifest({
				run,
				parent: PRODUCT_PARENT,
				parentState: productParentState,
			}),
			await copyTerminalManifest({
				run,
				parent: FLAT_CONTROL_PARENT,
				parentState: flatControlParentState,
			}),
			await copyTerminalManifest({
				run,
				parent: FIBONACCI_CAUSAL_PARENT,
				parentState: causalParentState,
			}),
		];
		const productCopies = [];
		for (const expected of PRODUCT_PARENT_ARTIFACTS) {
			productCopies.push(await copyVerifiedArtifact({
				run,
				parentState: productParentState,
				expected,
			}));
		}
		const historicalControlCopies = [];
		for (const expected of HISTORICAL_BRUNETON_CONTROLS) {
			const parentState = expected.parent.runId === PRODUCT_PARENT.runId
				? productParentState
				: flatControlParentState;
			historicalControlCopies.push({
				...await copyVerifiedArtifact({run, parentState, expected}),
				id: expected.id,
				kind: expected.kind,
			});
		}
		const causalProofCopy = await copyVerifiedArtifact({
			run,
			parentState: causalParentState,
			expected: {
				...FIBONACCI_CAUSAL_PARENT.proof,
				destination: 'references/000471/evidence/proof.json',
			},
		});
		const causalProof = JSON.parse(await readFile(
			path.join(
				run.runDirectory,
				'references',
				'000471',
				'evidence',
				'proof.json',
			),
			'utf8',
		));
		requireCondition(
			causalProof.accepted === true
				&& causalProof.proofId
					=== 'san-jose-plus-one-hour-fibonacci-reflection-control-v1'
				&& causalProof.analysis?.parentRollZeroOracle?.scene?.id
					=== 'sunset-plus-one-hour'
				&& causalProof.analysis?.parentRollZeroOracle?.trace?.elevationDegrees
					=== 0
				&& causalProof.analysis?.parentRollZeroOracle?.sampleCount === 361
				&& causalProof.analysis?.conclusion?.includes(
					'This control does not by itself prove removal of the complete two-dimensional twilight lobes.',
				)
				&& causalProof.assertions.includes(
					'Every FIB68 partner is the exact [x,-y,z] reflection of its retained ordinary direction.',
				),
			'Run 000471 copied proof does not bind the accepted +1-hour one-dimensional FIB68 cause and its explicit 2D claim boundary.',
		);
		const fixtureCopies = await copyFixtures(run);
		const parentConfigCopy = productCopies.find(
			(copy) => copy.sourcePath === 'browser/config.json',
		);
		const parentConfig = JSON.parse(await readFile(
			path.join(
				run.runDirectory,
				...parentConfigCopy.destinationPath.split('/'),
			),
			'utf8',
		));
		const subjectiveFixture = JSON.parse(await readFile(
			path.join(
				run.runDirectory,
				...fixtureCopies.subjectiveGlobeContextScenes.destinationPath
					.split('/'),
			),
			'utf8',
		));
		const geometryFixture = JSON.parse(await readFile(
			path.join(
				run.runDirectory,
				...fixtureCopies.g4CpuSunDiskTransport.destinationPath.split('/'),
			),
			'utf8',
		));
		const flatFixture = JSON.parse(await readFile(
			path.join(
				run.runDirectory,
				...fixtureCopies.unionGlacierFlatLocal.destinationPath.split('/'),
			),
			'utf8',
		));
		validateCopiedFixtureFacts({
			subjectiveFixture,
			geometryFixture,
			flatFixture,
		});
		const cpuColorSmoke = await executeCpuColorSmoke(run);
		const flatTransportPackingSmoke =
			await executeFlatTransportPackingSmoke(run);
		const browserConfiguration = createBrowserConfiguration(
			parentConfig,
			subjectiveFixture,
			productCopies,
			historicalControlCopies,
		);
		await run.writeJsonArtifact('browser/config.json', browserConfiguration);
		const browserConfigurationPath = path.join(
			run.runDirectory,
			'browser',
			'config.json',
		);
		const browserConfigurationSha256 = await sha256File(
			browserConfigurationPath,
		);
		await run.writeJsonArtifact('evidence/input-derivation.json', {
			schemaId: 'bruneton-fibonacci68-final-input-derivation-v1',
			parents: {
				terminalManifests: parentTerminalManifests,
				productArtifacts: productCopies,
				historicalBrunetonControls: historicalControlCopies,
				fibonacciCausalProof: causalProofCopy,
				verifications: {
					product: productParentState.verification,
					flatControl: flatControlParentState.verification,
					fibonacciCausal: causalParentState.verification,
				},
			},
			fixtures: fixtureCopies,
			cpuColorSmoke,
			flatTransportPackingSmoke,
			browserConfiguration: {
				operation:
					'combine the verified 000466 six-scene/product descriptors with copied canonical spherical/Flat fixture facts, replace product URLs with verified run-local byte copies, bind pinned 000466/000467 Bruneton controls only as masked drift-analysis oracles, and add the current generic V2 policy',
				parent: parentConfigCopy,
				resultPath: 'browser/config.json',
				resultSha256: browserConfigurationSha256,
			},
		});
		await run.writeArtifact(
			'browser/index.html',
			'<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">const target=document.querySelector("#result");try{const {runBrunetonFibonacci68FinalPairedCapturesBrowser}=await import("/screen-palette/run-bruneton-fibonacci68-final-paired-captures-browser.js");target.textContent=JSON.stringify(await runBrunetonFibonacci68FinalPairedCapturesBrowser());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>',
		);
		server = await serve(run);
		browserProfilePath = await assertCreatablePathContained(
			OUTPUT_ROOT,
			path.join(OUTPUT_ROOT, 'browser-profiles', run.runId),
			'Final paired-capture Chrome profile',
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
				'--virtual-time-budget=1800000',
				'--dump-dom',
				server.url,
			], {
				timeout: 1860000,
				maxBuffer: 128 * 1024 * 1024,
				windowsHide: true,
			});
		} catch (error) {
			await run.writeArtifact(
				'browser/dom-on-failure.html',
				error.stdout ?? '',
			);
			throw error;
		} finally {
			await removeBrowserProfile(browserProfilePath);
			browserProfilePath = null;
		}
		await run.writeArtifact('browser/dom.html', browser.stdout);
		await run.writeArtifact('browser/stderr.txt', browser.stderr);
		await run.writeJsonArtifact('browser/requests.json', server.requests);
		const resultText = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(
			browser.stdout,
		)?.[1];
		requireCondition(resultText, 'Browser emitted no final paired-capture result.');
		const browserResult = JSON.parse(resultText);
		if (browserResult.error) {
			throw new Error(
				`${browserResult.error.name}: ${browserResult.error.message}`,
			);
		}
		requireCondition(
			browserResult.renderId
				=== 'bruneton-fibonacci68-final-paired-captures-v1'
				&& browserResult.colorModelId
					=== BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID
				&& browserResult.preflight.passed === true,
			'Browser returned the wrong final render identity or failed preflight.',
		);
		const captureEvidence = await materializeCaptures(
			run,
			browserResult,
			productCopies,
			historicalControlCopies,
		);
		const gates = evaluateGates(browserResult);
		gates.push(gate(
			'cpu-color-formula-smoke',
			cpuColorSmoke.accepted === true
				&& cpuColorSmoke.smokeId
					=== 'bruneton-extraterrestrial-visibility-color-cpu-smoke-v1',
			'The immutable run owns an accepted CPU proof of the V2 formula, exact-zero Bruneton behavior, bounded headroom, stellar rank/distinction, Color identity, and Flat180 warmth.',
			cpuColorSmoke,
		));
		gates.push(gate(
			'flat-fibonacci68-transport-packing-smoke',
			flatTransportPackingSmoke.accepted === true
				&& flatTransportPackingSmoke.smokeId
					=== 'controlled-flat-fibonacci68-transport-packing-smoke-v1'
				&& flatTransportPackingSmoke.policyId
					=== FLAT_TRANSPORT_PACKING_POLICY_ID,
			'The immutable run owns an accepted source-level proof that the bounded three-column Flat FIB68 storage map preserves every logical scalar and changes only the two intended N4 transport modules.',
			flatTransportPackingSmoke,
		));
		const captureHealth = summarizeMaterializedCaptureHealth(captureEvidence);
		gates.push(gate(
			'all-nine-pairs-materialized-and-healthy',
			captureHealth.sceneCount === 9
				&& captureHealth.outputCount === 27
				&& captureHealth.diagnosticCount === 9
				&& captureHealth.pngArtifactCount === 36
				&& captureHealth.allNonempty
				&& captureHealth.allContentAddressed
				&& captureHealth.allDimensionsExact,
			'All nine live pairs and nine isolated-celestial diagnostics materialize as 36 nonempty, content-addressed PNGs; the 27 user-facing control/candidate/pair PNGs have exact dimensions.',
			captureHealth,
		));
		await run.writeJsonArtifact(
			'evidence/capture-derivation.json',
			captureEvidence.derivation,
		);
		await Promise.all([
			assertRunLocalCopiesUnchanged(
				run,
				productCopies,
				'Run-local parent product',
			),
			assertRunLocalCopiesUnchanged(
				run,
				Object.values(fixtureCopies),
				'Run-local fixture',
			),
			assertRunLocalCopiesUnchanged(
				run,
				historicalControlCopies,
				'Run-local historical Bruneton control',
			),
		]);
		requireCondition(
			await sha256File(browserConfigurationPath)
				=== browserConfigurationSha256,
			'Run-local browser configuration changed during execution.',
		);

		const closureAfter = await buildImplementationClosure();
		const [
			implementationClosureAfter,
			experimentPackageInventoryAfter,
			threeDependencyInventoryAfter,
			candidateInventoryAfter,
			baselineInventoryAfter,
		] = await Promise.all([
			describeImplementationClosure(closureAfter),
			createSelectedFileInventory(
				EXPERIMENT_ROOT,
				['package.json', 'package-lock.json'],
			),
			createFileInventory(THREE_ROOT),
			createFileInventory(CANDIDATE_ROOT),
			createFileInventory(BASELINE_ROOT),
		]);
		requireCondition(
			JSON.stringify(implementationClosureAfter)
				=== JSON.stringify(implementationClosure),
			'Executed implementation closure changed during the run.',
		);
		assertFileInventoriesEqual(
			experimentPackageInventory,
			experimentPackageInventoryAfter,
			'Experiment package manifest/lock inventory',
		);
		assertFileInventoriesEqual(
			threeDependencyInventory,
			threeDependencyInventoryAfter,
			'Installed Three dependency inventory',
		);
		assertFileInventoriesEqual(
			candidateInventory,
			candidateInventoryAfter,
			'Sealed contained candidate inventory',
		);
		assertFileInventoriesEqual(
			baselineInventory,
			baselineInventoryAfter,
			'Sealed contained baseline inventory',
		);
		requireCondition(
			await sha256File(process.execPath) === nodeIdentity.sha256,
			'Node executable changed during the run.',
		);
		requireCondition(
			await sha256File(CHROME_PATH) === chromeIdentity.sha256,
			'Chrome executable changed during the run.',
		);
		const productionAfter = await inventoryProduction();
		assertFileInventoriesEqual(
			productionBefore.algorithm32,
			productionAfter.algorithm32,
			'Algorithm32 production inventory',
		);
		assertFileInventoriesEqual(
			productionBefore.flat32,
			productionAfter.flat32,
			'Flat32 production inventory',
		);
		const proof = {
			proofId: 'bruneton-fibonacci68-final-paired-captures-v1',
			accepted: gates.every((item) => item.passed),
			parents: {
				product: {
					...PRODUCT_PARENT,
					verification: productParentState.verification,
				},
				flatControl: {
					...FLAT_CONTROL_PARENT,
					verification: flatControlParentState.verification,
				},
				fibonacciCausal: {
					...FIBONACCI_CAUSAL_PARENT,
					verification: causalParentState.verification,
				},
			},
			browserConfiguration: {
				path: 'browser/config.json',
				sha256: browserConfigurationSha256,
			},
			cpuColorSmoke,
			flatTransportPackingSmoke,
			browser: browserResult,
			gates,
			captures: captureEvidence.captures,
			captureDerivation: 'evidence/capture-derivation.json',
			containment: {
				algorithm32FileCount: productionAfter.algorithm32.fileCount,
				flat32FileCount: productionAfter.flat32.fileCount,
				moduleClosureFileCount: closureBefore.files.length,
				moduleClosureEdgeCount: closureBefore.edges.length,
				candidateFileCount: candidateInventoryAfter.fileCount,
				baselineFileCount: baselineInventoryAfter.fileCount,
			},
		};
		await run.writeJsonArtifact('evidence/final-paired-captures.json', proof);
		const conclusion = proof.accepted ? 'accepted' : 'rejected';
		const finalManifest = await run.finalize({
			conclusion,
			result: {
				proofId: proof.proofId,
				accepted: proof.accepted,
				captures: proof.captures,
				passedGateCount: gates.filter((item) => item.passed).length,
				gateCount: gates.length,
			},
			report: report(run.runId, conclusion, proof),
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion,
			artifactSetSha256: finalManifest.artifactSetSha256,
			captures: proof.captures,
			gates,
		}, null, 2)}\n`);
		if (!proof.accepted) process.exitCode = 1;
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
					proofId: 'bruneton-fibonacci68-final-paired-captures-v1',
					accepted: false,
					error: detail,
				},
				report: `# ${run.runId}: final live Bruneton/FIB68 paired captures\n\nConclusion: **failed**.\n\n${detail.message}\n`,
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
			await removeBrowserProfile(browserProfilePath).catch(() => {});
		}
	}
}

await main();
