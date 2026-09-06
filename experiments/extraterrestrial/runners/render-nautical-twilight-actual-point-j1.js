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
import {BrunetonOzoneCandidateAtmosphere} from
	'../atmospheres/BrunetonOzoneCandidateAtmosphere.js';
import {BrunetonColorDisplayModel} from
	'../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
	FIGURE1_DISPLAY_CONSTANTS,
} from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
} from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	SpectralPacket,
} from '../candidate/src/algorithm32/quantities/index.js';
import {
	ACTUAL_POINT_J1_CONVERGENCE_INTERVAL_COUNTS,
	ACTUAL_POINT_J1_CONTROL,
	ActualPointJ1ControlledDistantSunLightSource,
	computeActualPointJ1ThreeRayCpuOracle,
} from '../stellar-screen-palette/ActualPointJ1ControlledDistantSunLightSource.js';
import {
	DOUBLED_OUTGOING_DIRECTION_COUNT,
	DOUBLED_OUTGOING_DIRECTION_POLICY_ID,
	DOUBLED_OUTGOING_FACE_WIDTH,
	DoubledOutgoingSphericalEarthGeometry,
} from '../stellar-screen-palette/DoubledOutgoingSphericalEarthGeometry.js';
import {
	REFLECTION_COMPLETED_FIBONACCI_68_W39_CONTROL_SELECTION,
} from '../stellar-screen-palette/ReflectionCompletedFibonacci68W39Control.js';
import {verifyRun} from './verify-run.js';

const COMMAND =
	'node experiments/extraterrestrial/runners/render-nautical-twilight-actual-point-j1.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREEN_PALETTE_ROOT = path.join(
	EXPERIMENT_ROOT,
	'stellar-screen-palette',
);
const CANDIDATE_ROOT = path.join(EXPERIMENT_ROOT, 'candidate');
const ATMOSPHERES_ROOT = path.join(EXPERIMENT_ROOT, 'atmospheres');
const OZONE_ROOT = path.join(EXPERIMENT_ROOT, 'ozone');
const FIXTURES_ROOT = path.join(EXPERIMENT_ROOT, 'fixtures');
const CONTROL_PARENT = Object.freeze({
	runId: '000493-san-jose-nautical-twilight-ozone-f68-w39-preview',
	artifactSetSha256:
		'63ccccc8ce9e2796781dc6ac0fbd4c912c4340815050215f85dd263ea8ea966f',
});
const PRODUCT_ORIGIN = Object.freeze({
	runId: '000466-bruneton-source-luminance-lift-spherical-comparison',
	artifactSetSha256:
		'62f912ac0fdbfac432b58e3c094a76a3a792f6afbda12de2ee6af7a5fddbd250',
});
const CONTROL_PARENT_ARTIFACTS = Object.freeze({
	config: Object.freeze({
		path: 'browser/config.json',
		byteLength: 2558,
		sha256:
			'84e5c8f5bc713b69ca1e949d704569f9858b75015e2675be2c7e36467c09af70',
	}),
	matrix: Object.freeze({
		path: 'browser/product/sunset-plus-one-hour-matrix.u16',
		byteLength: 512000,
		sha256:
			'e6d8296b3f12bc9bf5868369eadd8d84d12c1055c3d70b7cf3e98974bad3ebf9',
	}),
	palette: Object.freeze({
		path: 'browser/product/sunset-plus-one-hour-palette.f32',
		byteLength: 2640,
		sha256:
			'dcb3bd4923503da3259904bdacecf451dd3a3c1ed3c1dd991f78675f8630a6c9',
	}),
	render: Object.freeze({
		path: 'evidence/render.json',
		byteLength: 2032307,
		sha256:
			'ab1d979bc966c9754161d86ee5b12ae47079caeca151f69b6a3b17ecf92ff246',
	}),
	spectralLedger: Object.freeze({
		path: 'evidence/sky-path-radiance-spectra.json',
		byteLength: 841303,
		sha256:
			'dc462d451e9a9e4c9332ba229e24d8beb6ac882ce35e1c5e0b472f989d9ac515',
	}),
});
const PRODUCT_ORIGIN_ARTIFACTS = Object.freeze({
	config: Object.freeze({
		path: 'browser/config.json',
		byteLength: 10335,
		sha256:
			'fd7d6772644ea810a7c331e92e85e53495cdf7ea9e252df8ee9eb466a21d54d7',
	}),
	matrix: Object.freeze({
		path: 'browser/sunset-plus-one-hour-matrix.u16',
		byteLength: 512000,
		sha256: CONTROL_PARENT_ARTIFACTS.matrix.sha256,
	}),
	palette: Object.freeze({
		path: 'browser/sunset-plus-one-hour-palette.f32',
		byteLength: 2640,
		sha256: CONTROL_PARENT_ARTIFACTS.palette.sha256,
	}),
});
const FIXTURE_INPUTS = Object.freeze({
	context: Object.freeze({
		path: 'subjective-globe-context-scenes-v1.json',
		byteLength: 1721,
		sha256:
			'f89e670faf0cd6ad3949c4b5c2acc582a4a809ee071ed0ac62bcfd14e546a8d1',
	}),
	radiometry: Object.freeze({
		path: 'g4-cpu-sun-disk-transport-v1.json',
		byteLength: 4350,
		sha256:
			'0cbb56ab49e51357f45f92c2ad8ef7e7250d75b664479cc787059983e786ccfd',
	}),
});
const SCENE_ID = 'sunset-plus-one-hour';
const SCENE_TIME_ISO = '2024-06-21T04:26:03.503Z';
const CAPTURE_PATHS = Object.freeze({
	baseline: 'captures/san-jose-nautical-twilight-current.png',
	augmented:
		'captures/san-jose-nautical-twilight-current-plus-actual-point-j1.png',
});
const BROWSER_RESULT_SCHEMA =
	'san-jose-nautical-twilight-actual-point-j1-browser-result-v1';
const THREE_RAY_SCHEMA = 'actual-point-j1-three-ray-native15-v1';
const NATIVE_SUN_ANGULAR_RADIUS_RADIANS = 0.004675;

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
			response.writeHead(404, {
				'content-type': 'text/plain; charset=utf-8',
			});
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
	await assertExistingRealPathContained(
		parentRoot,
		artifactPath,
		`Parent artifact ${expected.path}`,
	);
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

async function verifyFixture(expected) {
	const fixturePath = path.join(FIXTURES_ROOT, expected.path);
	await assertExistingRealPathContained(
		FIXTURES_ROOT,
		fixturePath,
		`Oracle fixture ${expected.path}`,
	);
	const [info, sha256] = await Promise.all([
		lstat(fixturePath),
		sha256File(fixturePath),
	]);
	requireCondition(
		info.isFile() && !info.isSymbolicLink()
			&& info.size === expected.byteLength
			&& sha256 === expected.sha256,
		`Oracle fixture changed: ${expected.path}.`,
	);
	return fixturePath;
}

function radiancePacket(values, provenanceIdentity) {
	return new SpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		values,
		provenanceIdentity,
	});
}

function sourceVisibilityBranch({
	probe,
	directionToSource,
	bottomRadiusMeters,
	topRadiusMeters,
	observerHeightMeters,
}) {
	const observerRadiusMeters = bottomRadiusMeters + observerHeightMeters;
	const exitDistanceMeters = Math.sqrt(
		topRadiusMeters * topRadiusMeters
			- observerRadiusMeters * observerRadiusMeters,
	);
	const visibleAt = (distanceMeters) => {
		const position = [
			probe.directionModel[0] * distanceMeters,
			probe.directionModel[1] * distanceMeters,
			observerRadiusMeters,
		];
		const positionDotSource = position[0] * directionToSource[0]
			+ position[1] * directionToSource[1]
			+ position[2] * directionToSource[2];
		if (positionDotSource >= 0) return true;
		const radiusSquared = position[0] * position[0]
			+ position[1] * position[1]
			+ position[2] * position[2];
		const impactRadiusSquared = radiusSquared
			- positionDotSource * positionDotSource;
		return impactRadiusSquared >= bottomRadiusMeters * bottomRadiusMeters;
	};
	const observerVisible = visibleAt(0);
	const topBoundaryVisible = visibleAt(exitDistanceMeters);
	let firstVisibleDistanceMeters = null;
	if (!observerVisible && topBoundaryVisible) {
		let blocked = 0;
		let visible = exitDistanceMeters;
		for (let iteration = 0; iteration < 80; iteration += 1) {
			const midpoint = (blocked + visible) * 0.5;
			if (visibleAt(midpoint)) visible = midpoint;
			else blocked = midpoint;
		}
		firstVisibleDistanceMeters = visible;
	} else if (observerVisible) {
		firstVisibleDistanceMeters = 0;
	}
	const firstVisibleAltitudeMeters = firstVisibleDistanceMeters === null
		? null
		: Math.hypot(observerRadiusMeters, firstVisibleDistanceMeters)
			- bottomRadiusMeters;
	return {
		probeId: probe.id,
		sourceAzimuthOffsetDegrees: probe.sourceAzimuthOffsetDegrees,
		observerVisible,
		topBoundaryVisible,
		exitDistanceMeters,
		firstVisibleDistanceMeters,
		firstVisibleAltitudeMeters,
		sunlitViewLengthMeters: firstVisibleDistanceMeters === null
			? 0
			: exitDistanceMeters - firstVisibleDistanceMeters,
	};
}

function computeNodeOracle({scene, contextFixture, radiometryFixture}) {
	const [up, east, north] = scene.directionToSourceUpEastNorth;
	const directionToSource = [east, north, up];
	const observerHeightMeters = contextFixture.camera.observerHeightMeters;
	const geometry = new DoubledOutgoingSphericalEarthGeometry({
		...radiometryFixture.geometry,
		observerHeight: {value: observerHeightMeters, units: 'meters'},
		observerUpDirection: [0, 0, 1],
		sceneFrame: {kind: 'observer-local'},
		directionToSource,
		cacheAltitudeBinCount: 48,
	});
	const atmosphere = new BrunetonOzoneCandidateAtmosphere({
		constants: {
			...CANONICAL_ATMOSPHERE_CONSTANTS,
			ozoneAbsorptionEnabled: true,
		},
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const lightSource = new ActualPointJ1ControlledDistantSunLightSource({
		directionToLight: directionToSource,
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		angularRadius: {
			value: NATIVE_SUN_ANGULAR_RADIUS_RADIANS,
			units: 'radians',
		},
	}, {
		domainSelection:
			REFLECTION_COMPLETED_FIBONACCI_68_W39_CONTROL_SELECTION,
	});
	const receiverPosition = {
		coordinates: [
			0,
			0,
			radiometryFixture.geometry.bottomRadius.value
				+ observerHeightMeters,
		],
		units: 'meters',
	};
	const color = new BrunetonColorDisplayModel({
		displayConstants: FIGURE1_DISPLAY_CONSTANTS,
	});
	const convergence = ACTUAL_POINT_J1_CONVERGENCE_INTERVAL_COUNTS.map(
		(intervalCount) => {
			const result = computeActualPointJ1ThreeRayCpuOracle({
				geometry,
				atmosphere,
				lightSource,
				spectralBasis: NATIVE_15_SPECTRAL_BASIS,
				receiverPosition,
				directionToSourceUpEastNorth:
					scene.directionToSourceUpEastNorth,
				viewIntervalCount: intervalCount,
				sourceIntervalCount: intervalCount,
			});
			return {
				...result,
				samples: result.samples.map((sample, sampleIndex) => ({
					...sample,
					photopicLuminanceCdPerSquareMeter:
						color.radianceToPhotopicLuminance(radiancePacket(
							sample.pathRadiance,
							`actual-point-j1-node-${intervalCount}-${sampleIndex}`,
						)),
				})),
			};
		},
	);
	requireCondition(
		lightSource.controlledBuildRecords.length === 0,
		'The binary64 direct-L1 oracle unexpectedly constructed a cache.',
	);
	const probes = convergence[0].samples;
	const visibilityBranches = probes.map((probe) => sourceVisibilityBranch({
		probe,
		directionToSource,
		bottomRadiusMeters: radiometryFixture.geometry.bottomRadius.value,
		topRadiusMeters: radiometryFixture.geometry.topRadius.value,
		observerHeightMeters,
	}));
	return {
		schemaId: 'san-jose-actual-point-j1-node-binary64-oracle-v1',
		precision: 'javascript-binary64',
		cacheConstruction: 'none',
		control: ACTUAL_POINT_J1_CONTROL,
		scene,
		configuration: {
			geometry: {
				bottomRadius: radiometryFixture.geometry.bottomRadius,
				topRadius: radiometryFixture.geometry.topRadius,
				observerHeight: {value: observerHeightMeters, units: 'meters'},
				outgoingDirectionPolicy: DOUBLED_OUTGOING_DIRECTION_POLICY_ID,
				outgoingFaceWidth: DOUBLED_OUTGOING_FACE_WIDTH,
				outgoingDirectionCount: DOUBLED_OUTGOING_DIRECTION_COUNT,
			},
			incomingDirectionCount:
				REFLECTION_COMPLETED_FIBONACCI_68_W39_CONTROL_SELECTION
					.incomingDirectionCount,
			ozoneIdentity: atmosphere.ozoneIdentity,
			spectralBasis: {
				id: NATIVE_15_SPECTRAL_BASIS.id,
				contentHash: NATIVE_15_SPECTRAL_BASIS.contentHash,
				channelCount: NATIVE_15_SPECTRAL_BASIS.channelCount,
			},
		},
		visibilityBranches,
		convergence,
	};
}

function extractAcceptedBaseline(spectralLedger) {
	const offsets = [-50, 0, 50];
	return offsets.map((offset) => {
		const sample = spectralLedger.samples.find((candidate) =>
			candidate.elevationDegrees === 0
				&& candidate.sourceAzimuthOffsetDegrees === offset);
		requireCondition(
			sample && Array.isArray(sample.pathRadiance)
				&& sample.pathRadiance.length === 15,
			`Run 000493 lacks the ${offset}-degree horizon baseline sample.`,
		);
		return sample;
	});
}

function validateSamples(samples, label) {
	requireCondition(
		Array.isArray(samples) && samples.length === 3,
		`${label} must contain three samples.`,
	);
	for (let index = 0; index < samples.length; index += 1) {
		const sample = samples[index];
		requireCondition(
			sample.sourceAzimuthOffsetDegrees === [-50, 0, 50][index]
				&& sample.elevationDegrees === 0
				&& Array.isArray(sample.pathRadiance)
				&& sample.pathRadiance.length === 15
				&& sample.pathRadiance.every(Number.isFinite)
				&& Number.isFinite(sample.photopicLuminanceCdPerSquareMeter),
			`${label} sample ${index} is malformed.`,
		);
	}
}

function compareSpectralSamples(observed, reference) {
	let maximumAbsoluteError = 0;
	let maximumRelativeError = 0;
	for (let probeIndex = 0; probeIndex < 3; probeIndex += 1) {
		for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
			const expected = reference[probeIndex].pathRadiance[channelIndex];
			const difference = observed[probeIndex].pathRadiance[channelIndex]
				- expected;
			maximumAbsoluteError = Math.max(
				maximumAbsoluteError,
				Math.abs(difference),
			);
			maximumRelativeError = Math.max(
				maximumRelativeError,
				Math.abs(difference) / Math.max(Math.abs(expected), 1e-30),
			);
		}
	}
	return {maximumAbsoluteError, maximumRelativeError};
}

function topologyClosure(baseline, addedJ1) {
	const baselineCenter = baseline[1].photopicLuminanceCdPerSquareMeter;
	const baselineFlankMean = (
		baseline[0].photopicLuminanceCdPerSquareMeter
			+ baseline[2].photopicLuminanceCdPerSquareMeter
	) * 0.5;
	const addedCenter = addedJ1[1].photopicLuminanceCdPerSquareMeter;
	const addedFlankMean = (
		addedJ1[0].photopicLuminanceCdPerSquareMeter
			+ addedJ1[2].photopicLuminanceCdPerSquareMeter
	) * 0.5;
	const baselineGap = baselineFlankMean - baselineCenter;
	const addedCenterAdvantage = addedCenter - addedFlankMean;
	const augmentedCenter = baselineCenter + addedCenter;
	const augmentedFlankMean = baselineFlankMean + addedFlankMean;
	const augmentedGap = augmentedFlankMean - augmentedCenter;
	return {
		definition:
			'closure = (added L1 center - added L1 flank mean) / (baseline flank mean - baseline center)',
		baselineCenterCdPerSquareMeter: baselineCenter,
		baselineFlankMeanCdPerSquareMeter: baselineFlankMean,
		baselineGapCdPerSquareMeter: baselineGap,
		addedJ1CenterCdPerSquareMeter: addedCenter,
		addedJ1FlankMeanCdPerSquareMeter: addedFlankMean,
		addedJ1CenterAdvantageCdPerSquareMeter: addedCenterAdvantage,
		augmentedCenterCdPerSquareMeter: augmentedCenter,
		augmentedFlankMeanCdPerSquareMeter: augmentedFlankMean,
		augmentedGapCdPerSquareMeter: augmentedGap,
		closureFraction: baselineGap === 0
			? null
			: addedCenterAdvantage / baselineGap,
	};
}

function validateBrowserResult(result, scene) {
	requireCondition(
		result.schemaId === BROWSER_RESULT_SCHEMA,
		'Browser returned the wrong actual-point J1 result schema.',
	);
	requireCondition(
		result.scene?.id === SCENE_ID
			&& result.scene?.timeIso === SCENE_TIME_ISO
			&& JSON.stringify(result.scene.directionToSourceUpEastNorth)
				=== JSON.stringify(scene.directionToSourceUpEastNorth),
		'Browser did not retain the exact run-000493 scene.',
	);
	requireCondition(
		result.product?.viewport?.width === 640
			&& result.product?.viewport?.height === 400,
		'Browser did not retain the exact 640x400 product.',
	);
	requireCondition(
		result.configuration?.maximumScatteringOrder === 4
			&& result.configuration?.incomingDirectionCount === 68
			&& result.configuration?.outgoingFaceWidth === 39
			&& result.configuration?.outgoingDirectionCount === 9126
			&& result.configuration?.ozoneAbsorptionEnabled === true,
		'Browser changed the retained ozone/F68/W39/N4 control.',
	);
	requireCondition(
		result.baseline?.toggle === 0
			&& result.augmented?.toggle === 1
			&& result.baseline?.viewIntervalCount === 15
			&& result.baseline?.sourceIntervalCount === 15
			&& result.augmented?.viewIntervalCount === 15
			&& result.augmented?.sourceIntervalCount === 15,
		'Browser did not render the exact toggle-off and 15x15 toggle-on pair.',
	);
	requireCondition(
		result.structural?.setupCount === 1
			&& result.structural?.cacheBuildCount === 1
			&& result.structural?.handleCount === 1
			&& result.structural?.renderCount === 2
			&& result.structural?.usesActualPointGroundVisibility === true
			&& result.structural?.usesActualPointTopBoundary === true
			&& result.structural?.usesOzoneAwareAtmosphereSampling === true
			&& result.structural?.retainsCachedCumulativeTransport === true,
		'Browser did not retain one shared cache/handle and the actual-point seam.',
	);
	requireCondition(
		result.runtime?.status === 'ready'
			&& result.runtime?.frameCount >= 2
			&& result.contextLost === false
			&& Array.isArray(result.webglErrors)
			&& result.webglErrors.length === 0
			&& Array.isArray(result.programDiagnostics)
			&& result.programDiagnostics.every((diagnostic) =>
				diagnostic === null || diagnostic.runnable !== false),
		'Browser runtime did not complete cleanly.',
	);
	const threeRay = result.threeRaySpectra;
	requireCondition(
		threeRay?.schemaId === THREE_RAY_SCHEMA
			&& threeRay.spectralBasis?.channelCount === 15
			&& threeRay.spectralBasis?.contentHash
				=== NATIVE_15_SPECTRAL_BASIS.contentHash,
		'Browser returned the wrong three-ray spectral contract.',
	);
	validateSamples(threeRay.baseline, 'Browser baseline');
	validateSamples(threeRay.augmented, 'Browser augmented');
	validateSamples(threeRay.addedJ1, 'Browser added J1');
	requireCondition(
		threeRay.convergence?.browserGpu?.length === 1
			&& threeRay.convergence.browserGpu[0].viewIntervalCount === 15
			&& threeRay.convergence.browserGpu[0].sourceIntervalCount === 15
			&& JSON.stringify(
				threeRay.convergence.binary64CpuOracleIntervalCounts,
			) === JSON.stringify([15, 160, 320]),
		'Browser returned the wrong GPU/CPU convergence declaration.',
	);
	return threeRay;
}

function report(runId, evidence) {
	const converged = evidence.closure.nodeBinary64.find(
		(entry) => entry.viewIntervalCount === 320,
	);
	return [
		`# ${runId}: San Jose nautical twilight actual-point J1 diagnostic`,
		'',
		'Conclusion: **completed diagnostic render and numerical control**.',
		'',
		'This run has no appearance acceptance gate and no Bruneton side-by-side.',
		'',
		`- Exact current control: ${CONTROL_PARENT.runId} (${CONTROL_PARENT.artifactSetSha256})`,
		`- Product origin: ${PRODUCT_ORIGIN.runId} (${PRODUCT_ORIGIN.artifactSetSha256})`,
		`- Baseline PNG: ${CAPTURE_PATHS.baseline}`,
		`- Current + actual-point J1 PNG: ${CAPTURE_PATHS.augmented}`,
		'- Both PNGs were materialized before structural qualification.',
		'- Full augmented frame: fixed GPU 15 view intervals x 15 source intervals.',
		'- Binary64 direct-L1 oracle: 15x15, 160x160, and 320x320; no cache construction.',
		`- Converged 320x320 closure fraction: ${converged.metrics.closureFraction}`,
		`- Converged residual center/flank gap: ${converged.metrics.augmentedGapCdPerSquareMeter} cd/m^2`,
		'- Closure uses baseline center/flank and added-L1 center/flank; it is not inferred from display pixels.',
		'- Evidence: evidence/render.json, evidence/three-ray-native15.json, evidence/node-binary64-direct-l1-oracle.json.',
		'',
		'Production and both parent runs remain unchanged.',
		'',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) {
		throw new Error('The actual-point J1 diagnostic accepts no arguments.');
	}
	const run = await initializeRunRecord({
		slug: 'san-jose-nautical-twilight-actual-point-j1-control',
		command: COMMAND,
		inputs: {
			schemaId: 'san-jose-nautical-twilight-actual-point-j1-input-v1',
			controlParent: CONTROL_PARENT,
			controlParentArtifacts: CONTROL_PARENT_ARTIFACTS,
			productOrigin: PRODUCT_ORIGIN,
			productOriginArtifacts: PRODUCT_ORIGIN_ARTIFACTS,
			fixtureInputs: FIXTURE_INPUTS,
			scene: {id: SCENE_ID, timeIso: SCENE_TIME_ISO},
			configuration: {
				atmosphere: 'contained Bruneton 300 DU ozone absorption enabled',
				incomingDirectionCount: 68,
				outgoingFaceWidth: 39,
				outgoingDirectionCount: 9126,
				maximumScatteringOrder: 4,
				spectralChannelCount: 15,
				viewport: [640, 400],
			},
			images: {
				baseline: 'exact current run-000493 algorithm',
				augmented:
					'exact current algorithm plus additive actual-point spherical direct J1',
				fullFrameIntervals: {view: 15, source: 15},
			},
			nodeBinary64Oracle: {
				cacheConstruction: 'none',
				probeOffsetsDegrees: [-50, 0, 50],
				elevationDegrees: 0,
				intervalCounts: [15, 160, 320],
			},
			closureEquation:
				'(addedJ1Center - mean(addedJ1Flanks)) / (mean(baselineFlanks) - baselineCenter)',
		},
		provenance: {
			schemaId: 'san-jose-nautical-twilight-actual-point-j1-provenance-v1',
			operation:
				'copy and verify the exact accepted run-000493 scene/product/configuration, retain its exact run-000466 product derivation, construct the same ozone/F68/W39/N4 cache once, render toggle-off current and toggle-on current-plus-actual-point-J1 frames through one handle, then independently recompute direct J1 for the three horizon rays in Node binary64 without constructing or reading a cache',
			implementation: [
				'experiments/extraterrestrial/stellar-screen-palette/ActualPointJ1ControlledDistantSunLightSource.js',
				'experiments/extraterrestrial/stellar-screen-palette/run-nautical-twilight-actual-point-j1-browser.js',
				'experiments/extraterrestrial/runners/render-nautical-twilight-actual-point-j1.js',
			],
			materializationPolicy:
				'write both returned PNGs before structural/runtime checks and preserve them in a failed immutable run',
			exclusions: [
				'appearance acceptance gate',
				'Bruneton side-by-side',
				'higher-order feedback from added actual-point J1',
				'production changes',
			],
		},
		environment: {
			schemaId: 'san-jose-nautical-twilight-actual-point-j1-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: CHROME_PATH,
			angleBackend: 'd3d11',
		},
		references: {
			schemaId: 'san-jose-nautical-twilight-actual-point-j1-references-v1',
			controlParent: CONTROL_PARENT,
			productOrigin: PRODUCT_ORIGIN,
			design:
				'agents/topics/algorithm32/cache/solar-zenith-cache-design.md',
			diagnostic:
				'agents/topics/extraterrestrial/celestial-contribution-cache-design.md#spherical-twilight-cache-coordinate-correction',
		},
	});
	let server;
	let browserProfilePath;
	let materializedCapturePaths = null;
	let nodeOracleEvidencePath = null;
	try {
		await assertRepositoryIdentity();
		await Promise.all([
			lstat(CHROME_PATH),
			assertNoReparseEntries(SCREEN_PALETTE_ROOT, 'Screen-palette source'),
			assertNoReparseEntries(CANDIDATE_ROOT, 'Contained candidate'),
			assertNoReparseEntries(ATMOSPHERES_ROOT, 'Contained atmosphere adapters'),
			assertNoReparseEntries(OZONE_ROOT, 'Contained ozone source'),
			assertNoReparseEntries(FIXTURES_ROOT, 'Contained fixtures'),
		]);
		const [controlVerification, originVerification] = await Promise.all([
			verifyRun(CONTROL_PARENT.runId),
			verifyRun(PRODUCT_ORIGIN.runId),
		]);
		requireCondition(
			controlVerification.verified
				&& controlVerification.conclusion === 'accepted'
				&& controlVerification.artifactSetSha256
					=== CONTROL_PARENT.artifactSetSha256,
			'Run 000493 failed immutable accepted-parent verification.',
		);
		requireCondition(
			originVerification.verified
				&& originVerification.conclusion === 'accepted'
				&& originVerification.artifactSetSha256
					=== PRODUCT_ORIGIN.artifactSetSha256,
			'Run 000466 failed immutable accepted-parent verification.',
		);
		const controlRoot = path.join(RUNS_ROOT, CONTROL_PARENT.runId);
		const originRoot = path.join(RUNS_ROOT, PRODUCT_ORIGIN.runId);
		await Promise.all([
			assertExistingRealPathContained(
				OUTPUT_ROOT,
				controlRoot,
				'Run 000493 control parent',
			),
			assertExistingRealPathContained(
				OUTPUT_ROOT,
				originRoot,
				'Run 000466 product origin',
			),
		]);
		const [controlManifest, originManifest] = await Promise.all([
			readFile(path.join(controlRoot, 'artifact-manifest.json'), 'utf8')
				.then(JSON.parse),
			readFile(path.join(originRoot, 'artifact-manifest.json'), 'utf8')
				.then(JSON.parse),
		]);
		const [
			controlConfigPath,
			controlMatrixPath,
			controlPalettePath,
			controlSpectralPath,
			originConfigPath,
			_contextFixturePath,
			_radiometryFixturePath,
		] = await Promise.all([
			verifyParentArtifact(
				controlRoot,
				controlManifest,
				CONTROL_PARENT_ARTIFACTS.config,
			),
			verifyParentArtifact(
				controlRoot,
				controlManifest,
				CONTROL_PARENT_ARTIFACTS.matrix,
			),
			verifyParentArtifact(
				controlRoot,
				controlManifest,
				CONTROL_PARENT_ARTIFACTS.palette,
			),
			verifyParentArtifact(
				controlRoot,
				controlManifest,
				CONTROL_PARENT_ARTIFACTS.spectralLedger,
			),
			verifyParentArtifact(
				originRoot,
				originManifest,
				PRODUCT_ORIGIN_ARTIFACTS.config,
			),
			verifyFixture(FIXTURE_INPUTS.context),
			verifyFixture(FIXTURE_INPUTS.radiometry),
		]);
		await Promise.all([
			verifyParentArtifact(
				originRoot,
				originManifest,
				PRODUCT_ORIGIN_ARTIFACTS.matrix,
			),
			verifyParentArtifact(
				originRoot,
				originManifest,
				PRODUCT_ORIGIN_ARTIFACTS.palette,
			),
		]);
		const [
			controlConfigBytes,
			controlMatrixBytes,
			controlPaletteBytes,
			controlSpectralLedger,
			originConfig,
			contextFixture,
			radiometryFixture,
		] = await Promise.all([
			readFile(controlConfigPath),
			readFile(controlMatrixPath),
			readFile(controlPalettePath),
			readFile(controlSpectralPath, 'utf8').then(JSON.parse),
			readFile(originConfigPath, 'utf8').then(JSON.parse),
			readFile(path.join(FIXTURES_ROOT, FIXTURE_INPUTS.context.path), 'utf8')
				.then(JSON.parse),
			readFile(
				path.join(FIXTURES_ROOT, FIXTURE_INPUTS.radiometry.path),
				'utf8',
			).then(JSON.parse),
		]);
		const controlConfig = JSON.parse(controlConfigBytes.toString('utf8'));
		const scene = controlConfig.scene;
		const originScene = originConfig.scenes.find(
			(candidate) => candidate.id === SCENE_ID,
		);
		const originProduct = originConfig.products[SCENE_ID];
		requireCondition(
			scene?.id === SCENE_ID
				&& scene.timeIso === SCENE_TIME_ISO
				&& controlConfig.parent?.runId === PRODUCT_ORIGIN.runId
				&& controlConfig.parent?.artifactSetSha256
					=== PRODUCT_ORIGIN.artifactSetSha256,
			'Run 000493 no longer pins the exact scene and run-000466 origin.',
		);
		requireCondition(
			originScene?.timeIso === scene.timeIso
				&& originProduct?.identity === controlConfig.product?.identity
				&& JSON.stringify(originConfig.luminanceLiftCurve)
					=== JSON.stringify(controlConfig.luminanceLiftCurve),
			'Run 000493 product derivation no longer matches run 000466.',
		);
		const acceptedBaseline = extractAcceptedBaseline(controlSpectralLedger);
		await Promise.all([
			run.writeArtifact('browser/config.json', controlConfigBytes),
			run.writeArtifact(
				'browser/product/sunset-plus-one-hour-matrix.u16',
				controlMatrixBytes,
			),
			run.writeArtifact(
				'browser/product/sunset-plus-one-hour-palette.f32',
				controlPaletteBytes,
			),
		]);
		await run.writeJsonArtifact('evidence/parent-chain.json', {
			schemaId: 'san-jose-actual-point-j1-parent-chain-v1',
			control: {
				...CONTROL_PARENT,
				verification: controlVerification,
				artifacts: CONTROL_PARENT_ARTIFACTS,
			},
			productOrigin: {
				...PRODUCT_ORIGIN,
				verification: originVerification,
				artifacts: PRODUCT_ORIGIN_ARTIFACTS,
			},
			derivation: {
				sceneId: scene.id,
				timeIso: scene.timeIso,
				productIdentity: controlConfig.product.identity,
				matrixSha256: CONTROL_PARENT_ARTIFACTS.matrix.sha256,
				paletteSha256: CONTROL_PARENT_ARTIFACTS.palette.sha256,
				operation:
					'run 000493 copied the exact run-000466 matrix/palette and changed only the contained atmosphere/cache diagnostic configuration',
			},
		});
		await run.writeArtifact(
			'browser/index.html',
			'<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">const target=document.querySelector("#result");try{const {runNauticalTwilightActualPointJ1Browser}=await import("/screen-palette/run-nautical-twilight-actual-point-j1-browser.js");target.textContent=JSON.stringify(await runNauticalTwilightActualPointJ1Browser());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>',
		);
		server = await serve(run);
		browserProfilePath = assertLexicallyContained(
			OUTPUT_ROOT,
			path.join(OUTPUT_ROOT, 'browser-profiles', run.runId),
			'Chrome actual-point J1 profile',
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
				defaultViewport: {
					width: 640,
					height: 400,
					deviceScaleFactor: 1,
				},
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
			resultText = await page.$eval(
				'#result',
				(node) => node.textContent,
			);
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
		requireCondition(resultText, 'Browser emitted no actual-point J1 result.');
		const result = JSON.parse(resultText);
		if (result.error) {
			throw new Error(`${result.error.name}: ${result.error.message}`);
		}

		const captureBytes = {
			baseline: pngBytes(result.baselineImagePngDataUrl),
			augmented: pngBytes(result.augmentedImagePngDataUrl),
		};
		// Preserve both requested images before any structural/runtime checks.
		await Promise.all([
			run.writeArtifact(CAPTURE_PATHS.baseline, captureBytes.baseline),
			run.writeArtifact(CAPTURE_PATHS.augmented, captureBytes.augmented),
		]);
		materializedCapturePaths = CAPTURE_PATHS;
		delete result.baselineImagePngDataUrl;
		delete result.augmentedImagePngDataUrl;
		const [baselineSha256, augmentedSha256] = await Promise.all([
			sha256File(path.join(run.runDirectory, CAPTURE_PATHS.baseline)),
			sha256File(path.join(run.runDirectory, CAPTURE_PATHS.augmented)),
		]);
		result.baseline.capture = {
			path: CAPTURE_PATHS.baseline,
			byteLength: captureBytes.baseline.length,
			sha256: baselineSha256,
		};
		result.augmented.capture = {
			path: CAPTURE_PATHS.augmented,
			byteLength: captureBytes.augmented.length,
			sha256: augmentedSha256,
		};

		const nodeOracle = computeNodeOracle({
			scene,
			contextFixture,
			radiometryFixture,
		});
		nodeOracleEvidencePath =
			'evidence/node-binary64-direct-l1-oracle.json';
		await run.writeJsonArtifact(nodeOracleEvidencePath, nodeOracle);

		const browserThreeRay = validateBrowserResult(result, scene);
		for (const entry of nodeOracle.convergence) {
			validateSamples(
				entry.samples,
				`Node ${entry.viewIntervalCount}x${entry.sourceIntervalCount}`,
			);
		}
		const browserGpu15 = browserThreeRay.convergence.browserGpu[0];
		const node15 = nodeOracle.convergence.find(
			(entry) => entry.viewIntervalCount === 15,
		);
		const closure = {
			schemaId: 'actual-point-j1-center-flank-closure-v1',
			acceptedBaselineParent: CONTROL_PARENT,
			browserGpu15: {
				viewIntervalCount: 15,
				sourceIntervalCount: 15,
				metrics: topologyClosure(
					browserThreeRay.baseline,
					browserThreeRay.addedJ1,
				),
			},
			nodeBinary64: nodeOracle.convergence.map((entry) => ({
				viewIntervalCount: entry.viewIntervalCount,
				sourceIntervalCount: entry.sourceIntervalCount,
				metrics: topologyClosure(acceptedBaseline, entry.samples),
			})),
		};
		const comparison = {
			liveBaselineVsAcceptedRun000493:
				compareSpectralSamples(
					browserThreeRay.baseline,
					acceptedBaseline,
				),
			browserGpu15AddedJ1VsNodeBinary64_15:
				compareSpectralSamples(browserThreeRay.addedJ1, node15.samples),
			browserGpu15AugmentedVsDeclaredConvergence:
				compareSpectralSamples(
					browserThreeRay.augmented,
					browserGpu15.augmented,
				),
		};
		const threeRayEvidence = {
			schemaId: 'san-jose-actual-point-j1-three-ray-evidence-v1',
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			derivation: {
				baseline:
					'exact run-000493 live control and its accepted three-ray subset',
				addedJ1:
					'actual-point spherical direct-first-order integration only; no cache construction for Node oracle and no feedback into J2-J4',
				closure:
					'combine baseline center/flank with added-L1 center/flank at matching spectral-to-photopic projection',
			},
			acceptedRun000493Baseline: acceptedBaseline,
			browserGpu15: browserThreeRay,
			nodeBinary64: nodeOracle,
			comparison,
			closure,
		};
		await run.writeJsonArtifact(
			'evidence/three-ray-native15.json',
			threeRayEvidence,
		);
		result.derivation = {
			schemaId: 'san-jose-actual-point-j1-render-derivation-v1',
			controlParent: CONTROL_PARENT,
			productOrigin: PRODUCT_ORIGIN,
			materializedBeforeQualification: [
				result.baseline.capture,
				result.augmented.capture,
			],
			nodeOracle: nodeOracleEvidencePath,
			threeRayEvidence: 'evidence/three-ray-native15.json',
			comparison,
			closure,
		};
		await run.writeJsonArtifact('evidence/render.json', result);
		const finalManifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				scope:
					'diagnostic render and direct-L1 numerical evidence only; no appearance validation',
				captures: CAPTURE_PATHS,
				evidence: 'evidence/render.json',
				threeRayEvidence: 'evidence/three-ray-native15.json',
				nodeOracle: nodeOracleEvidencePath,
			},
			report: report(run.runId, threeRayEvidence),
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion: 'accepted-diagnostic-render',
			artifactSetSha256: finalManifest.artifactSetSha256,
			captures: CAPTURE_PATHS,
			evidence: 'evidence/render.json',
			threeRayEvidence: 'evidence/three-ray-native15.json',
			nodeOracle: nodeOracleEvidencePath,
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
					scope: 'diagnostic render and direct-L1 numerical evidence only',
					captures: materializedCapturePaths,
					nodeOracle: nodeOracleEvidencePath,
					error: detail,
				},
				report: `# ${run.runId}: San Jose nautical twilight actual-point J1 diagnostic\n\nConclusion: **failed**.\n\n${materializedCapturePaths ? `Both requested captures were materialized before structural qualification and remain preserved: ${materializedCapturePaths.baseline}, ${materializedCapturePaths.augmented}.` : 'The browser did not return both PNGs, so the requested pair could not be materialized.'}\n\n${nodeOracleEvidencePath ? `The binary64 oracle is preserved at ${nodeOracleEvidencePath}.` : 'The binary64 oracle was not completed.'}\n\n${detail.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'failed',
				artifactSetSha256: finalManifest.artifactSetSha256,
				captures: materializedCapturePaths,
				nodeOracle: nodeOracleEvidencePath,
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
