#!/usr/bin/env node

import {execFile as executeFile} from 'node:child_process';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {promisify} from 'node:util';

import {sha256File} from '../harness/lib/atomic-files.js';
import {
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
} from '../harness/lib/hashes.js';
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
import {
	BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
} from '../stellar-screen-palette/BrunetonExtraterrestrialVisibilityColorDisplayModel.js';

const COMMAND =
	'node scripts/extraterrestrial/runners/render-bruneton-extraterrestrial-visibility-targeted.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFileAsync = promisify(executeFile);
const SCREEN_PALETTE_ROOT = path.join(
	EXPERIMENT_ROOT,
	'stellar-screen-palette',
);
const FIXTURES_ROOT = path.join(EXPERIMENT_ROOT, 'fixtures');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const SOURCE_EXPOSURE_CURVE = Object.freeze({
	brightThreshold: 5,
	darkThreshold: 0.001,
	maximumExposureGain: 131072,
});
const TARGETS = Object.freeze([
	'spherical-sunset-plus-one-hour',
	'spherical-sunset-plus-two-hours',
	'flat-local-flat-180',
]);
const NUMERIC_GATES = Object.freeze({
	nonCelestialMaximumByteDifference: 1,
	starMedianMinimumByte: 40,
	starPeakMinimumByte: 150,
	starDistinctRgbMinimum: 28,
	starExactWhiteMaximum: 0,
	flatSourceGreenToRedMaximum: 0.7,
	flatSourceBlueToRedMaximum: 0.3,
	flatSourceExactWhiteMaximum: 0,
	flatSourcePixelTopLeft: Object.freeze({x: 359, y: 160}),
	preferenceOnly: Object.freeze({
		starMedianByteRange: Object.freeze([45, 70]),
		starPeakByteRange: Object.freeze([200, 235]),
	}),
});
const SPHERICAL_PARENT = Object.freeze({
	runId: '000466-bruneton-source-luminance-lift-spherical-comparison',
	artifactSetSha256:
		'62f912ac0fdbfac432b58e3c094a76a3a792f6afbda12de2ee6af7a5fddbd250',
	manifestByteLength: 8237,
	manifestSha256:
		'042ab5b4632f81f0e86fe73a2c21427fd8fd4651a2b20e3579d9b71dc264685c',
});
const FLAT_PARENT = Object.freeze({
	runId: '000467-bruneton-source-luminance-lift-flat-local-comparison',
	artifactSetSha256:
		'b6eda32ac4e3f185f23550c11a230b50ccfecab7df2126e692abed8da3ab803a',
	manifestByteLength: 4083,
	manifestSha256:
		'e889e2b92430bdd886b8b63b16b8fc66214be14609280582692560e093970306',
});
const SPHERICAL_PARENT_ARTIFACTS = Object.freeze([
	Object.freeze({
		sourcePath: 'browser/config.json',
		destinationPath: 'parents/000466/browser-config.json',
		byteLength: 10335,
		sha256:
			'fd7d6772644ea810a7c331e92e85e53495cdf7ea9e252df8ee9eb466a21d54d7',
	}),
	Object.freeze({
		sourcePath: 'browser/sunset-plus-one-hour-matrix.u16',
		destinationPath:
			'browser/products/sunset-plus-one-hour-matrix.u16',
		byteLength: 512000,
		sha256:
			'e6d8296b3f12bc9bf5868369eadd8d84d12c1055c3d70b7cf3e98974bad3ebf9',
	}),
	Object.freeze({
		sourcePath: 'browser/sunset-plus-one-hour-palette.f32',
		destinationPath:
			'browser/products/sunset-plus-one-hour-palette.f32',
		byteLength: 2640,
		sha256:
			'dcb3bd4923503da3259904bdacecf451dd3a3c1ed3c1dd991f78675f8630a6c9',
	}),
	Object.freeze({
		sourcePath: 'browser/sunset-plus-two-hours-matrix.u16',
		destinationPath:
			'browser/products/sunset-plus-two-hours-matrix.u16',
		byteLength: 512000,
		sha256:
			'0e5f8c2969f0cf779531ee4519ee594fbaa5c2a0ffebcb0be2b1d4bfac54f5d3',
	}),
	Object.freeze({
		sourcePath: 'browser/sunset-plus-two-hours-palette.f32',
		destinationPath:
			'browser/products/sunset-plus-two-hours-palette.f32',
		byteLength: 2820,
		sha256:
			'90c94db9102616d4df92b4fcfcb6296720ca2bb569a916fb703872ff1bfebc82',
	}),
	Object.freeze({
		sourcePath: 'captures/bruneton-sunset-plus-one-hour.png',
		destinationPath:
			'browser/controls/bruneton-sunset-plus-one-hour.png',
		byteLength: 6664,
		sha256:
			'e1093a93f878f5289c1e475b278d1b79a2c5504f6c0763a8a599167c81f6b96a',
	}),
	Object.freeze({
		sourcePath: 'captures/bruneton-sunset-plus-two-hours.png',
		destinationPath:
			'browser/controls/bruneton-sunset-plus-two-hours.png',
		byteLength: 6664,
		sha256:
			'e1093a93f878f5289c1e475b278d1b79a2c5504f6c0763a8a599167c81f6b96a',
	}),
	Object.freeze({
		sourcePath: 'captures/source-exposure-sunset-plus-one-hour.png',
		destinationPath:
			'browser/rejected/source-exposure-sunset-plus-one-hour.png',
		byteLength: 76870,
		sha256:
			'9b356523fba2047f3397815fa540315a939e33005e3350c305416c60abf6fd38',
	}),
	Object.freeze({
		sourcePath: 'captures/source-exposure-sunset-plus-two-hours.png',
		destinationPath:
			'browser/rejected/source-exposure-sunset-plus-two-hours.png',
		byteLength: 7168,
		sha256:
			'b9fe2b10fc188fbc53196da7ed4a3594c2b336ea2e65b14797d813aa6d22d6ab',
	}),
]);
const FLAT_PARENT_ARTIFACTS = Object.freeze([
	Object.freeze({
		sourcePath: 'captures/bruneton-flat-180.png',
		destinationPath: 'browser/controls/bruneton-flat-180.png',
		byteLength: 79642,
		sha256:
			'e06e8856341e6c96d3f0859be6e1758958713974468132ca80dd6cc488cff337',
	}),
]);

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
		'Targeted Chrome profile',
	);
	await assertNoReparseEntries(profilePath, 'Targeted Chrome profile');
	await rm(profilePath, {recursive: true, force: true});
}

async function serve(run) {
	const requests = [];
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/screen-palette/', SCREEN_PALETTE_ROOT],
		['/candidate/', CANDIDATE_ROOT],
		['/fixtures/', FIXTURES_ROOT],
		['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT],
	]);
	const server = createServer(async (request, response) => {
		try {
			const pathname = decodeURIComponent(
				new URL(request.url, 'http://127.0.0.1').pathname,
			);
			requests.push(pathname);
			const route = [...roots].find(([prefix]) =>
				pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) {
				throw new Error('Unsupported targeted-render path.');
			}
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) {
				throw new Error('Targeted-render path escapes its root.');
			}
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) {
				throw new Error('Targeted-render path is not a real file.');
			}
			const canonicalRoot = await realpath(root);
			const canonicalTarget = await realpath(target);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) {
				throw new Error('Targeted-render real path escapes its root.');
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

async function copyVerifiedParentArtifacts({run, parent, artifacts}) {
	const parentRoot = path.join(RUNS_ROOT, parent.runId);
	await assertExistingRealPathContained(
		OUTPUT_ROOT,
		parentRoot,
		`Immutable parent ${parent.runId}`,
	);
	await assertNoReparseEntries(
		parentRoot,
		`Immutable parent ${parent.runId}`,
	);
	const manifestPath = path.join(parentRoot, 'artifact-manifest.json');
	const manifestBytes = await readFile(manifestPath);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(
		manifestBytes.byteLength === parent.manifestByteLength
			&& manifestSha256 === parent.manifestSha256,
		`Immutable parent manifest changed: ${parent.runId}`,
	);
	const manifest = JSON.parse(manifestBytes.toString('utf8'));
	requireCondition(
		manifest.conclusion === 'accepted'
			&& manifest.artifactSetSha256 === parent.artifactSetSha256,
		`Immutable parent changed: ${parent.runId}`,
	);
	const copiedManifestPath = `parents/${parent.runId}/artifact-manifest.json`;
	await run.writeArtifact(copiedManifestPath, manifestBytes);
	requireCondition(
		await sha256File(path.join(
			run.runDirectory,
			...copiedManifestPath.split('/'),
		)) === parent.manifestSha256,
		`Copied parent manifest differs: ${parent.runId}`,
	);
	const copied = [];
	const bytesBySourcePath = new Map();
	for (const expected of artifacts) {
		const record = manifest.artifacts.find(
			(artifact) => artifact.path === expected.sourcePath,
		);
		requireCondition(
			record
				&& record.byteLength === expected.byteLength
				&& record.sha256 === expected.sha256,
			`Parent manifest artifact changed: ${expected.sourcePath}`,
		);
		const sourcePath = path.join(
			parentRoot,
			...expected.sourcePath.split('/'),
		);
		const sourceSha256 = await sha256File(sourcePath);
		requireCondition(
			sourceSha256 === expected.sha256,
			`Parent artifact bytes changed: ${expected.sourcePath}`,
		);
		const bytes = await readFile(sourcePath);
		requireCondition(
			bytes.byteLength === expected.byteLength,
			`Parent artifact length changed: ${expected.sourcePath}`,
		);
		await run.writeArtifact(expected.destinationPath, bytes);
		const destinationPath = path.join(
			run.runDirectory,
			...expected.destinationPath.split('/'),
		);
		const destinationSha256 = await sha256File(destinationPath);
		requireCondition(
			destinationSha256 === expected.sha256,
			`Copied artifact differs: ${expected.destinationPath}`,
		);
		bytesBySourcePath.set(expected.sourcePath, bytes);
		copied.push({
			parentRunId: parent.runId,
			parentArtifactSetSha256: parent.artifactSetSha256,
			sourcePath: expected.sourcePath,
			destinationPath: expected.destinationPath,
			operation: 'byte-for-byte-copy',
			byteLength: expected.byteLength,
			sourceSha256,
			resultSha256: destinationSha256,
		});
	}
	return {
		copied,
		bytesBySourcePath,
		terminalManifest: {
			sourcePath: `${parent.runId}/artifact-manifest.json`,
			destinationPath: copiedManifestPath,
			operation: 'byte-for-byte-copy',
			byteLength: manifestBytes.byteLength,
			sourceSha256: manifestSha256,
			resultSha256: parent.manifestSha256,
			artifactSetSha256: parent.artifactSetSha256,
		},
	};
}

function createBrowserConfiguration(parentConfig) {
	const sceneIds = [
		'sunset-plus-one-hour',
		'sunset-plus-two-hours',
	];
	const scenes = sceneIds.map((id) => {
		const scene = parentConfig.scenes.find((candidate) => candidate.id === id);
		requireCondition(scene, `Parent config lacks target scene: ${id}`);
		return scene;
	});
	const products = {};
	for (const id of sceneIds) {
		const product = parentConfig.products[id];
		requireCondition(product, `Parent config lacks target product: ${id}`);
		products[id] = {
			...product,
			matrixUrl: `/browser/products/${id}-matrix.u16`,
			paletteUrl: `/browser/products/${id}-palette.f32`,
		};
	}
	return {
		schemaId:
			'bruneton-extraterrestrial-visibility-targeted-browser-config-v1',
		colorModelId: BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
		sourceExposureCurve: SOURCE_EXPOSURE_CURVE,
		spherical: {
			camera: parentConfig.camera,
			scenes,
			products,
			controls: {
				'sunset-plus-one-hour': {
					brunetonUrl:
						'/browser/controls/bruneton-sunset-plus-one-hour.png',
					rejectedUrl:
						'/browser/rejected/source-exposure-sunset-plus-one-hour.png',
				},
				'sunset-plus-two-hours': {
					brunetonUrl:
						'/browser/controls/bruneton-sunset-plus-two-hours.png',
					rejectedUrl:
						'/browser/rejected/source-exposure-sunset-plus-two-hours.png',
				},
			},
		},
		flat: {
			stateId: 'flat-180',
			sourcePixelTopLeft: NUMERIC_GATES.flatSourcePixelTopLeft,
			controls: {
				brunetonUrl: '/browser/controls/bruneton-flat-180.png',
			},
		},
	};
}

function gate(id, passed, requirement, observed) {
	return {id, passed: Boolean(passed), requirement, observed};
}

function evaluateNumericGates(result) {
	const plusOne = result.spherical.find(
		(record) => record.id === 'sunset-plus-one-hour',
	);
	const plusTwo = result.spherical.find(
		(record) => record.id === 'sunset-plus-two-hours',
	);
	requireCondition(plusOne && plusTwo, 'Browser omitted a spherical target.');
	const plusOneBackground =
		plusOne.analysis.candidateVersusBrunetonNonCelestial;
	const plusTwoBackground =
		plusTwo.analysis.candidateVersusBrunetonNonCelestial;
	const oldPlusOneBackground =
		plusOne.analysis.rejectedVersusBrunetonNonCelestial;
	const oldPlusTwoStars = plusTwo.analysis.rejectedStars;
	const newPlusTwoStars = plusTwo.analysis.candidateStars;
	const flatAnalysis = result.flat.analysis;
	const flatSource = flatAnalysis.candidateSourcePixel;
	const flatSurrounding =
		flatAnalysis.candidateVersusBrunetonOutsideSource;
	return [
		gate(
			'spherical-plus-one-noncelestial-bruneton-match',
			plusOneBackground.maximumAbsoluteChannelDifference
				<= NUMERIC_GATES.nonCelestialMaximumByteDifference,
			`Every noncelestial byte differs from Bruneton by at most ${NUMERIC_GATES.nonCelestialMaximumByteDifference}.`,
			plusOneBackground,
		),
		gate(
			'spherical-plus-two-noncelestial-bruneton-match',
			plusTwoBackground.maximumAbsoluteChannelDifference
				<= NUMERIC_GATES.nonCelestialMaximumByteDifference,
			`Every noncelestial byte differs from Bruneton by at most ${NUMERIC_GATES.nonCelestialMaximumByteDifference}.`,
			plusTwoBackground,
		),
		gate(
			'rejected-plus-one-lobe-baseline-present',
			oldPlusOneBackground.candidateNonBlackPixelCount >= 100000,
			'Reused run 000466 must retain at least 100000 nonblack noncelestial pixels.',
			oldPlusOneBackground,
		),
		gate(
			'rejected-plus-two-star-baseline-identified',
			oldPlusTwoStars.maximumChannel === 71
				&& oldPlusTwoStars.distinctRgbCount === 29
				&& oldPlusTwoStars.exactWhiteCount === 0,
			'Run 000466 plus-two-hour baseline remains peak 71, 29 distinct, and zero white.',
			oldPlusTwoStars,
		),
		gate(
			'spherical-plus-two-star-median',
			newPlusTwoStars.peakChannelQuantiles.median
				>= NUMERIC_GATES.starMedianMinimumByte,
			`Median stellar peak is at least ${NUMERIC_GATES.starMedianMinimumByte}.`,
			newPlusTwoStars,
		),
		gate(
			'spherical-plus-two-star-peak',
			newPlusTwoStars.maximumChannel
				>= NUMERIC_GATES.starPeakMinimumByte,
			`Peak stellar channel is at least ${NUMERIC_GATES.starPeakMinimumByte}.`,
			newPlusTwoStars,
		),
		gate(
			'spherical-plus-two-star-variation',
			newPlusTwoStars.distinctRgbCount
				>= NUMERIC_GATES.starDistinctRgbMinimum,
			`At least ${NUMERIC_GATES.starDistinctRgbMinimum} stellar RGB values remain distinct.`,
			newPlusTwoStars,
		),
		gate(
			'spherical-plus-two-no-white-stars',
			newPlusTwoStars.exactWhiteCount
				<= NUMERIC_GATES.starExactWhiteMaximum,
			'No sampled star is exact white.',
			newPlusTwoStars,
		),
		gate(
			'flat-180-bruneton-control-source-is-white',
			flatAnalysis.brunetonSourcePixel.exactWhite,
			'The reused Bruneton control retains its exact-white source pixel.',
			flatAnalysis.brunetonSourcePixel,
		),
		gate(
			'flat-180-candidate-source-is-not-white',
			Number(flatSource.exactWhite)
				<= NUMERIC_GATES.flatSourceExactWhiteMaximum,
			'The candidate source pixel is not exact white.',
			flatSource,
		),
		gate(
			'flat-180-live-source-pixel-identity',
			result.flat.source.projectedPixelTopLeft.x
				=== NUMERIC_GATES.flatSourcePixelTopLeft.x
				&& result.flat.source.projectedPixelTopLeft.y
					=== NUMERIC_GATES.flatSourcePixelTopLeft.y,
			'The live finite source projects to the exact sampled top-left PNG pixel.',
			{
				expected: NUMERIC_GATES.flatSourcePixelTopLeft,
				observed: result.flat.source.projectedPixelTopLeft,
			},
		),
		gate(
			'flat-180-candidate-source-chroma',
			flatSource.greenToRed !== null
				&& flatSource.blueToRed !== null
				&& flatSource.greenToRed
					<= NUMERIC_GATES.flatSourceGreenToRedMaximum
				&& flatSource.blueToRed
					<= NUMERIC_GATES.flatSourceBlueToRedMaximum,
			`Candidate source G/R <= ${NUMERIC_GATES.flatSourceGreenToRedMaximum} and B/R <= ${NUMERIC_GATES.flatSourceBlueToRedMaximum}.`,
			flatSource,
		),
		gate(
			'flat-180-surrounding-bruneton-match',
			flatSurrounding.maximumAbsoluteChannelDifference
				<= NUMERIC_GATES.nonCelestialMaximumByteDifference,
			`Every nonsource Flat byte differs from Bruneton by at most ${NUMERIC_GATES.nonCelestialMaximumByteDifference}.`,
			flatSurrounding,
		),
		gate(
			'source-exposure-endpoints',
			plusOne.sourceLight.exposureGain
				=== SOURCE_EXPOSURE_CURVE.maximumExposureGain
				&& plusTwo.sourceLight.exposureGain
					=== SOURCE_EXPOSURE_CURVE.maximumExposureGain
				&& result.flat.sourceLight.exposureGain === 1,
			'Both blocked spherical sources use maximum gain and bright Flat180 uses exact identity gain.',
			{
				plusOne: plusOne.sourceLight.exposureGain,
				plusTwo: plusTwo.sourceLight.exposureGain,
				flat180: result.flat.sourceLight.exposureGain,
			},
		),
	];
}

function report(runId, conclusion, proof) {
	const plusTwo = proof.browser.spherical.find(
		(record) => record.id === 'sunset-plus-two-hours',
	);
	const flatSource = proof.browser.flat.analysis.candidateSourcePixel;
	return [
		`# ${runId}: targeted extraterrestrial-visibility tuning`,
		'',
		`Conclusion: **${conclusion}**.`,
		'',
		`- Numeric gates: ${proof.gates.filter((item) => item.passed).length}/${proof.gates.length} passed.`,
		`- Plus-two-hour stellar median/peak: ${plusTwo.analysis.candidateStars.peakChannelQuantiles.median}/${plusTwo.analysis.candidateStars.maximumChannel}.`,
		`- Plus-two-hour distinct/exact-white: ${plusTwo.analysis.candidateStars.distinctRgbCount}/${plusTwo.analysis.candidateStars.exactWhiteCount}.`,
		`- Flat180 candidate source RGB: [${flatSource.rgb.join(', ')}].`,
		'',
		'Only the three owner-selected targets were rendered live. Every reused parent artifact was verified and copied byte-for-byte into this run before browser use. Production remained unchanged.',
		'',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) {
		throw new Error('The targeted comparison accepts no arguments.');
	}
	const run = await initializeRunRecord({
		slug: 'bruneton-extraterrestrial-visibility-targeted-tuning',
		command: COMMAND,
		inputs: {
			schemaId:
				'bruneton-extraterrestrial-visibility-targeted-input-v1',
			colorModelId: BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
			targets: TARGETS,
			maximumExposureGain:
				SOURCE_EXPOSURE_CURVE.maximumExposureGain,
			sourceExposureCurve: SOURCE_EXPOSURE_CURVE,
			numericGates: NUMERIC_GATES,
			parents: [SPHERICAL_PARENT, FLAT_PARENT],
			parentArtifacts: {
				spherical: SPHERICAL_PARENT_ARTIFACTS,
				flat: FLAT_PARENT_ARTIFACTS,
			},
		},
		provenance: {
			schemaId:
				'bruneton-extraterrestrial-visibility-targeted-provenance-v1',
			operation:
				'verify and byte-copy immutable Bruneton controls and spherical screen-palette products; render one live candidate for spherical sunset plus one hour, spherical sunset plus two hours, and Flat/local Flat180; compare path/scene pixels, stellar value distribution, and source chroma',
			implementation: [
				'scripts/extraterrestrial/stellar-screen-palette/BrunetonSourceExposureCurve.js',
				'scripts/extraterrestrial/stellar-screen-palette/BrunetonExtraterrestrialVisibilityColorDisplayModel.js',
				'scripts/extraterrestrial/stellar-screen-palette/run-bruneton-extraterrestrial-visibility-targeted-browser.js',
				'scripts/extraterrestrial/runners/render-bruneton-extraterrestrial-visibility-targeted.js',
			],
			parentReuse:
				'each selected source artifact is checked against its terminal manifest and SHA-256, copied byte-for-byte into this new run, and rehashed before use',
			exclusions: [
				'scattered-light adaptation',
				'rod/cone response',
				'night-time branch',
				'source-kind Color branch',
				'production writes',
				'full acceptance matrices',
			],
		},
		environment: {
			schemaId:
				'bruneton-extraterrestrial-visibility-targeted-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: CHROME_PATH,
		},
		references: {
			schemaId:
				'bruneton-extraterrestrial-visibility-targeted-references-v1',
			design:
				'agents/topics/extraterrestrial/stellar-screen-palette-design.md',
			activeTopic: 'agents/topics/active-topic.md',
			sphericalParent: SPHERICAL_PARENT,
			flatParent: FLAT_PARENT,
		},
	});
	let server;
	let browserProfilePath;
	try {
		await assertRepositoryIdentity();
		await Promise.all([
			lstat(CHROME_PATH),
			assertNoReparseEntries(
				SCREEN_PALETTE_ROOT,
				'Screen-palette source',
			),
			assertNoReparseEntries(CANDIDATE_ROOT, 'Contained candidate'),
			assertNoReparseEntries(FIXTURES_ROOT, 'Contained fixtures'),
			assertExistingRealPathContained(
				EXPERIMENT_ROOT,
				EXPERIMENT_NODE_MODULES_ROOT,
				'Contained experiment node_modules',
			),
		]);
		const productionBefore = await inventoryProduction();
		const sphericalParent = await copyVerifiedParentArtifacts({
			run,
			parent: SPHERICAL_PARENT,
			artifacts: SPHERICAL_PARENT_ARTIFACTS,
		});
		const flatParent = await copyVerifiedParentArtifacts({
			run,
			parent: FLAT_PARENT,
			artifacts: FLAT_PARENT_ARTIFACTS,
		});
		const parentConfig = JSON.parse(
			sphericalParent.bytesBySourcePath.get('browser/config.json')
				.toString('utf8'),
		);
		const browserConfiguration = createBrowserConfiguration(parentConfig);
		await run.writeJsonArtifact('browser/config.json', browserConfiguration);
		const browserConfigurationSha256 = await sha256File(
			path.join(run.runDirectory, 'browser', 'config.json'),
		);
		await run.writeJsonArtifact('evidence/parent-derivation.json', {
			schemaId:
				'bruneton-extraterrestrial-visibility-parent-derivation-v1',
			operation: 'byte-for-byte-copy',
			parents: [
				{
					...SPHERICAL_PARENT,
					terminalManifest: sphericalParent.terminalManifest,
					artifacts: sphericalParent.copied,
				},
				{
					...FLAT_PARENT,
					terminalManifest: flatParent.terminalManifest,
					artifacts: flatParent.copied,
				},
			],
			derivedBrowserConfiguration: {
				operation:
					'select exactly the two named spherical scenes and replace their artifact URLs with the verified run-local copies',
				parent:
					`${SPHERICAL_PARENT.runId}/browser/config.json`,
				parentSha256:
					SPHERICAL_PARENT_ARTIFACTS[0].sha256,
				resultPath: 'browser/config.json',
				resultSha256: browserConfigurationSha256,
				sourceExposureCurve: SOURCE_EXPOSURE_CURVE,
			},
		});
		await run.writeArtifact(
			'browser/index.html',
			'<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">const target=document.querySelector("#result");try{const {runBrunetonExtraterrestrialVisibilityTargetedBrowser}=await import("/screen-palette/run-bruneton-extraterrestrial-visibility-targeted-browser.js");target.textContent=JSON.stringify(await runBrunetonExtraterrestrialVisibilityTargetedBrowser());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>',
		);
		server = await serve(run);
		browserProfilePath = assertLexicallyContained(
			OUTPUT_ROOT,
			path.join(OUTPUT_ROOT, 'browser-profiles', run.runId),
			'Targeted Chrome profile',
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
				'--virtual-time-budget=360000',
				'--dump-dom',
				server.url,
			], {
				timeout: 420000,
				maxBuffer: 32 * 1024 * 1024,
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
		requireCondition(resultText, 'Browser emitted no targeted result.');
		const browserResult = JSON.parse(resultText);
		if (browserResult.error) {
			throw new Error(
				`${browserResult.error.name}: ${browserResult.error.message}`,
			);
		}
		requireCondition(
			browserResult.colorModelId
				=== BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
			'Browser used the wrong Color model.',
		);
		requireCondition(
			browserResult.spherical.length === 2
				&& browserResult.flat.id === 'flat-180',
			'Browser did not return exactly the three selected targets.',
		);
		const allRecords = [
			...browserResult.spherical,
			browserResult.flat,
		];
		requireCondition(
			allRecords.every(
				(record) => record.colorModelId
					=== BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
			),
			'One target used the wrong configured Color instance.',
		);
		requireCondition(
			allRecords.every((record) => record.webglErrors.length === 0),
			`A target reported WebGL errors: ${JSON.stringify(allRecords.map((record) => ({id: record.id, errors: record.webglErrors})))}`,
		);
		requireCondition(
			allRecords.every(
				(record) => record.shaderIncludes.bruneton
					&& record.shaderIncludes.extraterrestrialVisibility
					&& record.shaderIncludes.separatePathLedger
					&& record.shaderIncludes.alreadyTransportedBoundary,
			),
			'One target omitted the boundary-aware Bruneton shader path.',
		);
		requireCondition(
			browserResult.spherical.every(
				(record) => record.shaderIncludes.screenPalette
					&& record.shaderIncludes.singleTransmittanceExpression === 1
					&& record.shaderIncludes.cumulativeAtmosphere
					&& record.shaderIncludes.sceneInputCapture,
			),
			'Spherical transport ownership changed.',
		);
		requireCondition(
			browserResult.flat.shaderIncludes.finiteDisk
				&& browserResult.flat.shaderIncludes
					.finiteBoundaryTransmittanceExpression === 1
				&& browserResult.flat.shaderIncludes.normalCache,
			'Flat/local finite-disk, one-pass atmosphere transport, or cache ownership changed.',
		);
		const captures = {};
		const captureDerivation = {};
		for (const record of browserResult.spherical) {
			const candidatePath = `captures/candidate-${record.id}.png`;
			const pairPath = `captures/paired-${record.id}.png`;
			const candidateBytes = pngBytes(record.imagePngDataUrl);
			const pairBytes = pngBytes(record.pairPngDataUrl);
			await run.writeArtifact(
				candidatePath,
				candidateBytes,
			);
			await run.writeArtifact(pairPath, pairBytes);
			captureDerivation[record.id] = {
				candidate: {
					path: candidatePath,
					byteLength: candidateBytes.byteLength,
					sha256: await sha256File(path.join(
						run.runDirectory,
						...candidatePath.split('/'),
					)),
					operation:
						'live Algorithm32 atmosphere and already-transported screen-palette boundary through the configured Color model',
					colorModelId:
						BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
					sourceExposureCurve: SOURCE_EXPOSURE_CURVE,
				},
				pair: {
					path: pairPath,
					byteLength: pairBytes.byteLength,
					sha256: await sha256File(path.join(
						run.runDirectory,
						...pairPath.split('/'),
					)),
					operation:
						'place the verified immutable Bruneton control on the left and the live candidate on the right with labels',
				},
			};
			delete record.imagePngDataUrl;
			delete record.pairPngDataUrl;
			record.capture = candidatePath;
			record.pairCapture = pairPath;
			captures[record.id] = pairPath;
		}
		const flatCandidatePath = 'captures/candidate-flat-180.png';
		const flatPairPath = 'captures/paired-flat-180.png';
		const flatCandidateBytes = pngBytes(
			browserResult.flat.imagePngDataUrl,
		);
		const flatPairBytes = pngBytes(browserResult.flat.pairPngDataUrl);
		await run.writeArtifact(
			flatCandidatePath,
			flatCandidateBytes,
		);
		await run.writeArtifact(
			flatPairPath,
			flatPairBytes,
		);
		captureDerivation['flat-180'] = {
			candidate: {
				path: flatCandidatePath,
				byteLength: flatCandidateBytes.byteLength,
				sha256: await sha256File(path.join(
					run.runDirectory,
					...flatCandidatePath.split('/'),
				)),
				operation:
					'live Flat/local Algorithm32 atmosphere and already-transported finite-source boundary through the configured Color model',
				colorModelId:
					BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
				sourceExposureCurve: SOURCE_EXPOSURE_CURVE,
			},
			pair: {
				path: flatPairPath,
				byteLength: flatPairBytes.byteLength,
				sha256: await sha256File(path.join(
					run.runDirectory,
					...flatPairPath.split('/'),
				)),
				operation:
					'place the verified immutable Bruneton Flat180 control on the left and the live candidate on the right with labels',
			},
		};
		delete browserResult.flat.imagePngDataUrl;
		delete browserResult.flat.pairPngDataUrl;
		browserResult.flat.capture = flatCandidatePath;
		browserResult.flat.pairCapture = flatPairPath;
		captures['flat-180'] = flatPairPath;
		const gates = evaluateNumericGates(browserResult);
		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [
				'runners/render-bruneton-extraterrestrial-visibility-targeted.js',
				'stellar-screen-palette/run-bruneton-extraterrestrial-visibility-targeted-browser.js',
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
			proofId: 'bruneton-extraterrestrial-visibility-targeted-v1',
			accepted: gates.every((item) => item.passed),
			colorModelId: BRUNETON_EXTRATERRESTRIAL_VISIBILITY_COLOR_ID,
			sourceExposureCurve: SOURCE_EXPOSURE_CURVE,
			numericGates: NUMERIC_GATES,
			parents: [SPHERICAL_PARENT, FLAT_PARENT],
			parentDerivation: [
				sphericalParent.terminalManifest,
				...sphericalParent.copied,
				flatParent.terminalManifest,
				...flatParent.copied,
			],
			browserConfiguration: {
				path: 'browser/config.json',
				sha256: browserConfigurationSha256,
			},
			browser: browserResult,
			gates,
			captures,
			captureDerivation,
			containment: {
				algorithm32FileCount: productionAfter.algorithm32.fileCount,
				flat32FileCount: productionAfter.flat32.fileCount,
				moduleClosureFileCount: closure.files.length,
				moduleClosureEdgeCount: closure.edges.length,
			},
		};
		await run.writeJsonArtifact('evidence/targeted-comparison.json', proof);
		const conclusion = proof.accepted ? 'accepted' : 'rejected';
		const finalManifest = await run.finalize({
			conclusion,
			result: {
				proofId: proof.proofId,
				accepted: proof.accepted,
				captures,
				passedGateCount: gates.filter((item) => item.passed).length,
				gateCount: gates.length,
			},
			report: report(run.runId, conclusion, proof),
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion,
			artifactSetSha256: finalManifest.artifactSetSha256,
			captures,
			gates,
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
					proofId:
						'bruneton-extraterrestrial-visibility-targeted-v1',
					accepted: false,
					error: detail,
				},
				report: `# ${run.runId}: targeted extraterrestrial-visibility tuning\n\nConclusion: **failed**.\n\n${detail.message}\n`,
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
			await removeBrowserProfile(browserProfilePath)
				.catch(() => {});
		}
	}
}

await main();
