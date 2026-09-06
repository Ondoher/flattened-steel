#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';

import {
	CAPTURE_TIMES,
	parseSpectraTsv,
} from '../../experiments/b1-directional-sky-radiance/benchmark.js';
import {
	FIGURE5_SCENES,
	loadPublishedFigure5Panels,
	renderAlgorithm32Figure5Panel,
	renderFigure5ComparisonSvg,
} from '../../experiments/b1-directional-sky-radiance/figure5.js';
import {
	computeB1Scores,
	parseMeasurementPacketBoundary,
	renderB1AggregateFigure,
	renderB1PerTimeFigure,
} from '../../experiments/generate-benchmark-figures.js';
import {makeCube} from '../../experiments/b3-matched-atmosphere-solver/cube.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {sha256File} from '../harness/lib/atomic-files.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
} from '../harness/lib/hashes.js';
import {
	REPOSITORY_ROOT,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';
import {
	BRUNETON_OZONE_B1_FIBONACCI34_CANDIDATE_LABEL,
	BRUNETON_OZONE_B1_PHYSICAL_PROFILE_ID,
	BRUNETON_OZONE_B1_FIBONACCI34_PROFILE_FAMILY,
	createBrunetonProductionProfile,
} from '../ozone/BrunetonOzoneB1Profile.js';
import {OzoneB1ProductionGpuHost} from '../ozone/OzoneB1ProductionGpuHost.js';
import {verifyRun} from './verify-run.js';

const executeFile = promisify(execFile);
const REVIEWED_GPU_FLAG = '--execute-reviewed-gpu';
const COMMAND =
	'node experiments/extraterrestrial/runners/run-b1-ordinary-fibonacci34-ozone.js '
	+ REVIEWED_GPU_FLAG;
const MAXIMUM_SCATTERING_ORDER = 4;
const INCOMING_DIRECTION_VARIANT = 'ordinary-fibonacci-34';
const INCOMING_DOMAIN = 'algorithm32-fibonacci-34-incoming-v1';
const BASELINE_ID = '043-production-retained-parity-j4-all17';
const BASELINE_INTERNAL_RUN_ID = 'current-production-b1-gpu-shaders-20260810T212755395Z';
const BASELINE_MANIFEST_SCHEMA = 'algorithm32-current-production-b1-run-v2';
const BASELINE_PROVENANCE_SCHEMA = 'algorithm32-current-production-b1-provenance-v2';
const BASELINE_PROFILE_ID = 'paper-j4';
const BASELINE_PHYSICAL_PROFILE_ID = 'algorithm32-paper-comparison-v1';
const BASELINE_PHYSICAL_PROFILE_CONTENT_HASH =
	'sha256:d47601d954167ca8775c0a88cd8ca9b9527ae8e74a6f42ae6041eec3244aeecc';
const BASELINE_TABLE_BYTE_LENGTH = 1180691;
const BASELINE_TABLE_SHA256 =
	'50a6df87d73bf0b7979faa21675ecdb50099f4be02229313ab65518727bcd486';
const BASELINE_MANIFEST_SHA256 =
	'6ecc32a0f89c815c221c5087eb003665fe532d3f98e42e069681f20ae32ca66d';
const BASELINE_PROVENANCE_SHA256 =
	'56238d672624eda37cefa21cccabeac89b4b1e38c91f4b18f8a88f3c2dc71518';
const BASELINE_CUBE_SHA256 =
	'2e348e346209bfe45159995c7fd80f1bd814d557f2c14d632cf486f9710dcca7';
const BASELINE_DEFAULT_PROVENANCE_SHA256 =
	'51364b9c21ba094467fbddae3b4c0970622b540bf4f5fcd7b95ccd65b88b3d56';
const BASELINE_NUMERICAL_CONTROLS = Object.freeze({
	pathIntervalCount: 40,
	sourceTransmittanceIntervalCount: 20,
	incidentDirectionCount: 34,
	incidentAltitudeBinCount: 48,
	incomingDirectionDomain: INCOMING_DOMAIN,
	scatteringOutputDomain: 'source-aligned-boundary-inclusive-gnomonic-cubed-sphere-w27',
	scatteringOutputFaceWidth: 27,
	scatteringOutputDirectionCount: 4374,
	positionNodeCount: 48,
	positionLookup: 'view-only-linear-physical-altitude-over-actual-nodes',
	maximumScatteringOrder: MAXIMUM_SCATTERING_ORDER,
});
const BASELINE_DOMAIN_SNAPSHOT = Object.freeze({
	positions: Object.freeze({
		id: 'b1-bruneton-spherical-48-position-boundary-0m-v1',
		count: 48,
	}),
	incomingDirections: Object.freeze({id: INCOMING_DOMAIN, directionCount: 34}),
	outgoingDirections: Object.freeze({
		id: 'algorithm32-cubed-sphere-w27-outgoing-v1',
		faceWidth: 27,
		directionCount: 4374,
	}),
});
const BASELINE_RELATIVE_ROOT =
	`tmp/algorithm32-frame-parity/${BASELINE_ID}/b1-directional-sky-radiance/gpu`;
const BASELINE_TABLE_NAME = 'algorithm32-current-production-gpu-j4.tsv';
const BASELINE_MANIFEST_NAME = 'manifest.json';
const BASELINE_PROVENANCE_NAME = 'algorithm32-current-production-gpu-j4-provenance.json';
const BASELINE_CUBE_NAME = 'algorithm32-current-production-gpu-j4-cube.json';
const BASELINE_DEFAULT_PROVENANCE_NAME =
	'algorithm32-current-production-gpu-default-provenance.json';
const MEASUREMENT_BOUNDARY_SHA256 =
	'a751d56dc0d8deb87958cbc9e811204a38f2b86101c732109c3503dfcfedad74';
const PUBLISHED_MODELS_SHA256 =
	'4e11e9ebc6c8cf2eb85e608d86a750b827a17d13582f4b89f035b71824b204f4';

const B1_ROOT = path.join(
	REPOSITORY_ROOT,
	'scripts',
	'experiments',
	'b1-directional-sky-radiance',
);
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const OZONE_SOURCE_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'ozone');
const ATMOSPHERE_SOURCE_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'atmospheres');
const RUNNER_PATH = path.join(
	REPOSITORY_ROOT,
	'scripts',
	'extraterrestrial',
	'runners',
	'run-b1-ordinary-fibonacci34-ozone.js',
);
const BASELINE_RUN_ROOT = path.join(
	REPOSITORY_ROOT,
	...BASELINE_RELATIVE_ROOT.split('/'),
);
const BASELINE_TABLE = path.join(BASELINE_RUN_ROOT, BASELINE_TABLE_NAME);
const BASELINE_MANIFEST = path.join(BASELINE_RUN_ROOT, BASELINE_MANIFEST_NAME);
const BASELINE_PROVENANCE = path.join(BASELINE_RUN_ROOT, BASELINE_PROVENANCE_NAME);
const BASELINE_CUBE = path.join(BASELINE_RUN_ROOT, BASELINE_CUBE_NAME);
const BASELINE_DEFAULT_PROVENANCE = path.join(
	BASELINE_RUN_ROOT,
	BASELINE_DEFAULT_PROVENANCE_NAME,
);
const MEASUREMENT_BOUNDARY = path.join(
	REPOSITORY_ROOT,
	'references',
	'results',
	'experiments',
	'b1-directional-sky-radiance',
	'measurement-boundary.tsv',
);
const PUBLISHED_MODELS = path.join(
	REPOSITORY_ROOT,
	'references',
	'results',
	'experiments',
	'b1-directional-sky-radiance',
	'published-models.tsv',
);
const STANDARD_FIGURES = Object.freeze([
	'b1-aggregate-rmse.svg',
	'b1-per-time-rmse.svg',
	'b1-figure5-algorithm32-10h15-z41.png',
	'b1-figure5-algorithm32-11h15-z31.png',
	'b1-figure5-algorithm32-13h15-z21.png',
	'b1-figure5-relative-error-domes.svg',
]);

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function sha256Bytes(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function portable(relativePath) {
	return relativePath.split(path.sep).join('/');
}

function baselineIdentity() {
	return {
		schemaId: 'retained-fibonacci34-b1-baseline-identity-v1',
		id: BASELINE_ID,
		repositoryRelativeRoot: BASELINE_RELATIVE_ROOT,
		internalRunId: BASELINE_INTERNAL_RUN_ID,
		manifest: {
			path: `${BASELINE_RELATIVE_ROOT}/${BASELINE_MANIFEST_NAME}`,
			schema: BASELINE_MANIFEST_SCHEMA,
			sha256: BASELINE_MANIFEST_SHA256,
		},
		provenance: {
			path: `${BASELINE_RELATIVE_ROOT}/${BASELINE_PROVENANCE_NAME}`,
			schema: BASELINE_PROVENANCE_SCHEMA,
			sha256: BASELINE_PROVENANCE_SHA256,
		},
		table: {
			path: `${BASELINE_RELATIVE_ROOT}/${BASELINE_TABLE_NAME}`,
			sha256: BASELINE_TABLE_SHA256,
			byteLength: BASELINE_TABLE_BYTE_LENGTH,
		},
		cube: {
			path: `${BASELINE_RELATIVE_ROOT}/${BASELINE_CUBE_NAME}`,
			sha256: BASELINE_CUBE_SHA256,
		},
		defaultProvenance: {
			path: `${BASELINE_RELATIVE_ROOT}/${BASELINE_DEFAULT_PROVENANCE_NAME}`,
			sha256: BASELINE_DEFAULT_PROVENANCE_SHA256,
		},
		profile: {
			profileFamily: 'paper',
			profileId: BASELINE_PROFILE_ID,
			physicalProfileId: BASELINE_PHYSICAL_PROFILE_ID,
			physicalProfileContentHash: BASELINE_PHYSICAL_PROFILE_CONTENT_HASH,
		},
		incomingDirectionVariant: 'production-34',
		numericalControls: {...BASELINE_NUMERICAL_CONTROLS},
		domainSnapshot: {
			positions: {...BASELINE_DOMAIN_SNAPSHOT.positions},
			incomingDirections: {...BASELINE_DOMAIN_SNAPSHOT.incomingDirections},
			outgoingDirections: {...BASELINE_DOMAIN_SNAPSHOT.outgoingDirections},
		},
		conditions: [...CAPTURE_TIMES],
		orders: [MAXIMUM_SCATTERING_ORDER],
	};
}

function tableHeader() {
	return [
		'model',
		'time',
		'grid_x',
		'grid_y',
		...Array.from({length: 40}, (_, index) => `lambda_${index}`),
	].join('\t');
}

function profileControl(profile) {
	const seaLevelMedium = profile.models.atmosphere.sampleMedium({
		altitude: {value: 0, units: 'meters'},
	});
	return {
		incomingDirectionVariant: INCOMING_DIRECTION_VARIANT,
		profileId: profile.id,
		engineLocalProfileContentHash: profile.contentHash,
		atmosphereId: profile.models.atmosphere.id,
		ozoneAbsorptionEnabled: profile.models.atmosphere.constants.ozoneAbsorptionEnabled,
		ozoneComposition: profile.ozoneComposition ?? null,
		spectralBasisContentHash: profile.spectral.basis.contentHash,
		sourceRadiometryContentHash: profile.spectral.sourceIrradianceDensity.contentHash,
		groundAlbedoContentHash: profile.models.groundBoundary.albedo.contentHash,
		atmosphereConstants: profile.models.atmosphere.constants,
		seaLevelMedium: {
			rayleighScattering: Array.from(seaLevelMedium.rayleighScattering.values),
			mieExtinction: Array.from(seaLevelMedium.mieExtinction.values),
		},
		domains: {
			positions: {id: profile.domains.positions.id, count: profile.domains.positions.count},
			incomingDirections: {
				id: profile.domains.incomingDirections.id,
				directionCount: profile.domains.incomingDirections.directionCount,
			},
			outgoingDirections: {
				id: profile.domains.outgoingDirections.id,
				directionCount: profile.domains.outgoingDirections.directionCount,
			},
		},
		numerical: profile.numerical,
		sourcePlacement: profile.models.sourcePlacement,
	};
}

function assertSameProfileControl(nodeControl, browserControl, time) {
	requireCondition(browserControl?.ozoneAbsorptionEnabled === true, `${time}: browser ozone is not enabled.`);
	for (const field of [
		'incomingDirectionVariant',
		'profileId',
		'atmosphereId',
		'spectralBasisContentHash',
		'sourceRadiometryContentHash',
		'groundAlbedoContentHash',
	]) {
		requireCondition(
			browserControl[field] === nodeControl[field],
			`${time}: browser ${field} differs from the reviewed Node profile.`,
		);
	}
	for (const control of [nodeControl, browserControl]) {
		requireCondition(
			/^sha256:[0-9a-f]{64}$/u.test(control.engineLocalProfileContentHash),
			`${time}: invalid engine-local profile content hash.`,
		);
	}
	requireCondition(
		JSON.stringify(browserControl.ozoneComposition) === JSON.stringify(nodeControl.ozoneComposition),
		`${time}: browser ozone composition differs from the reviewed Node profile.`,
	);
	requireCondition(
		JSON.stringify(browserControl.domains) === JSON.stringify(nodeControl.domains)
			&& JSON.stringify(browserControl.numerical) === JSON.stringify(nodeControl.numerical)
			&& JSON.stringify(browserControl.atmosphereConstants)
				=== JSON.stringify(nodeControl.atmosphereConstants),
		`${time}: browser atmosphere, domain, or numerical controls differ from the reviewed Node profile.`,
	);
	for (const packetName of ['rayleighScattering', 'mieExtinction']) {
		const nodeValues = nodeControl.seaLevelMedium?.[packetName];
		const browserValues = browserControl.seaLevelMedium?.[packetName];
		requireCondition(
			Array.isArray(nodeValues)
				&& Array.isArray(browserValues)
				&& nodeValues.length === 40
				&& browserValues.length === 40
				&& nodeValues.every((value, index) => {
					const browserValue = browserValues[index];
					const tolerance = 8 * Number.EPSILON
						* Math.max(Math.abs(value), Math.abs(browserValue), Number.MIN_VALUE);
					return Number.isFinite(value)
						&& Number.isFinite(browserValue)
						&& Math.abs(value - browserValue) <= tolerance;
				}),
			`${time}: browser ${packetName} differs beyond the cross-engine binary64 bound.`,
		);
	}
	const nodePlacement = nodeControl.sourcePlacement;
	const browserPlacement = browserControl.sourcePlacement;
	requireCondition(
		nodePlacement?.kind === browserPlacement?.kind
			&& nodePlacement?.placement?.kind === browserPlacement?.placement?.kind
			&& JSON.stringify(nodePlacement?.observation) === JSON.stringify(browserPlacement?.observation),
		`${time}: browser source-placement facts differ from the reviewed Node profile.`,
	);
	const nodeDirection = nodePlacement?.placement?.directionToLight;
	const browserDirection = browserPlacement?.placement?.directionToLight;
	requireCondition(
		Array.isArray(nodeDirection)
			&& Array.isArray(browserDirection)
			&& nodeDirection.length === 3
			&& browserDirection.length === 3
			&& nodeDirection.every((value, index) =>
				Number.isFinite(value)
					&& Number.isFinite(browserDirection[index])
					&& Math.abs(value - browserDirection[index]) <= 4e-15),
		`${time}: browser source direction differs beyond the cross-engine trigonometric bound.`,
	);
}

function compareB1Scores(ozoneOff, ozoneOn) {
	const perTime = CAPTURE_TIMES.map((time, index) => {
		const off = ozoneOff.conditions[index].rmseMilliwatt;
		const on = ozoneOn.conditions[index].rmseMilliwatt;
		return {
			time,
			ozoneOffRmseMilliwatt: off,
			ozoneOnRmseMilliwatt: on,
			deltaMilliwatt: on - off,
			percentChange: ((on - off) / off) * 100,
			outcome: on < off ? 'improved' : on > off ? 'worsened' : 'unchanged',
		};
	});
	const ozoneOffAggregate = ozoneOff.aggregateRmseMilliwatt;
	const ozoneOnAggregate = ozoneOn.aggregateRmseMilliwatt;
	return {
		schemaId: 'b1-ordinary-f34-ozone-off-vs-on-v1',
		metric: 'spectral RMSE over 17 times x 81 directions x 31 scored wavelengths',
		units: 'mW m^-2 sr^-1 nm^-1',
		ozoneOff: {
			...baselineIdentity(),
			aggregateRmseMilliwatt: ozoneOffAggregate,
		},
		ozoneOn: {aggregateRmseMilliwatt: ozoneOnAggregate},
		aggregateDeltaMilliwatt: ozoneOnAggregate - ozoneOffAggregate,
		aggregatePercentChange: ((ozoneOnAggregate - ozoneOffAggregate) / ozoneOffAggregate) * 100,
		outcome:
			ozoneOnAggregate < ozoneOffAggregate
				? 'improved'
				: ozoneOnAggregate > ozoneOffAggregate
					? 'worsened'
					: 'unchanged',
		improvedConditionCount: perTime.filter((item) => item.outcome === 'improved').length,
		worsenedConditionCount: perTime.filter((item) => item.outcome === 'worsened').length,
		unchangedConditionCount: perTime.filter((item) => item.outcome === 'unchanged').length,
		perTime,
	};
}

function computeTransportDifference(ozoneOffModels, ozoneOnModels) {
	const offByTime = ozoneOffModels.get('proposed');
	const onByTime = ozoneOnModels.get('proposed');
	let squaredDifference = 0;
	let absoluteDifference = 0;
	let signedDifference = 0;
	let maximumAbsoluteDifference = 0;
	let decreasedCount = 0;
	let increasedCount = 0;
	let unchangedCount = 0;
	let count = 0;
	const perTime = [];
	for (const time of CAPTURE_TIMES) {
		const offGrid = offByTime.get(time);
		const onGrid = onByTime.get(time);
		let timeSquare = 0;
		let timeSigned = 0;
		let timeCount = 0;
		for (let x = 0; x < 9; x += 1) {
			for (let y = 0; y < 9; y += 1) {
				for (let wavelengthIndex = 0; wavelengthIndex < 40; wavelengthIndex += 1) {
					const difference = onGrid[x][y][wavelengthIndex] - offGrid[x][y][wavelengthIndex];
					const magnitude = Math.abs(difference);
					squaredDifference += difference * difference;
					absoluteDifference += magnitude;
					signedDifference += difference;
					maximumAbsoluteDifference = Math.max(maximumAbsoluteDifference, magnitude);
					timeSquare += difference * difference;
					timeSigned += difference;
					count += 1;
					timeCount += 1;
					if (difference < 0) decreasedCount += 1;
					else if (difference > 0) increasedCount += 1;
					else unchangedCount += 1;
				}
			}
		}
		perTime.push({
			time,
			rmsDifference: Math.sqrt(timeSquare / timeCount),
			meanSignedDifference: timeSigned / timeCount,
		});
	}
	return {
		schemaId: 'b1-ozone-transport-difference-v1',
		units: 'W m^-2 sr^-1 nm^-1',
		sampleCount: count,
		rmsDifference: Math.sqrt(squaredDifference / count),
		meanAbsoluteDifference: absoluteDifference / count,
		meanSignedDifference: signedDifference / count,
		maximumAbsoluteDifference,
		decreasedCount,
		increasedCount,
		unchangedCount,
		perTime,
	};
}

function comparisonSvg(comparison) {
	const width = 1060;
	const height = 500;
	const left = 70;
	const top = 55;
	const chartWidth = 950;
	const chartHeight = 350;
	const maximum = Math.max(
		...comparison.perTime.flatMap((item) => [item.ozoneOffRmseMilliwatt, item.ozoneOnRmseMilliwatt]),
	) * 1.08;
	const x = (index) => left + (index / (comparison.perTime.length - 1)) * chartWidth;
	const y = (value) => top + chartHeight - (value / maximum) * chartHeight;
	const points = (key) => comparison.perTime.map((item, index) => `${x(index)},${y(item[key])}`).join(' ');
	const labels = comparison.perTime.map(
		(item, index) =>
			`<text x="${x(index)}" y="${top + chartHeight + 24}" text-anchor="middle" font-size="11">${item.time}</text>`,
	).join('');
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="white"/>
<text x="${left}" y="27" font-family="sans-serif" font-size="20">B1 F34 spectral RMSE: Bruneton ozone off vs 300 DU ozone on</text>
<line x1="${left}" y1="${top + chartHeight}" x2="${left + chartWidth}" y2="${top + chartHeight}" stroke="#444"/>
<line x1="${left}" y1="${top}" x2="${left}" y2="${top + chartHeight}" stroke="#444"/>
<polyline points="${points('ozoneOffRmseMilliwatt')}" fill="none" stroke="#595959" stroke-width="3"/>
<polyline points="${points('ozoneOnRmseMilliwatt')}" fill="none" stroke="#2b6cb0" stroke-width="3"/>
${labels}
<text x="${left}" y="${height - 28}" font-family="sans-serif" font-size="14" fill="#595959">Ozone off: ${comparison.ozoneOff.aggregateRmseMilliwatt.toFixed(6)}</text>
<text x="${left + 265}" y="${height - 28}" font-family="sans-serif" font-size="14" fill="#2b6cb0">Ozone on: ${comparison.ozoneOn.aggregateRmseMilliwatt.toFixed(6)}</text>
<text x="${left + 540}" y="${height - 28}" font-family="sans-serif" font-size="14">${comparison.improvedConditionCount}/17 improve; ${comparison.worsenedConditionCount}/17 worsen</text>
<text transform="translate(18 ${top + chartHeight / 2}) rotate(-90)" font-family="sans-serif" font-size="13">RMSE (mW m^-2 sr^-1 nm^-1)</text>
</svg>`;
}

function report(runId, comparison, transport, profile) {
	const rows = comparison.perTime.map(
		(item) =>
			`| ${item.time} | ${item.ozoneOffRmseMilliwatt.toFixed(6)} | ${item.ozoneOnRmseMilliwatt.toFixed(6)} | ${item.deltaMilliwatt.toFixed(6)} | ${item.outcome} |`,
	).join('\n');
	const standardLinks = STANDARD_FIGURES.map(
		(name) => `- [${name}](figures/${name})`,
	).join('\n');
	return `# ${runId}: B1 ordinary Fibonacci-34 with ozone

Conclusion: **accepted as a complete contained B1 execution and figure set**. This accepts the evidence, not ozone as a production default.

Against the same Kider boundary, 300 DU ozone changes aggregate F34 RMSE from ${comparison.ozoneOff.aggregateRmseMilliwatt.toFixed(6)} to ${comparison.ozoneOn.aggregateRmseMilliwatt.toFixed(6)} mW m^-2 sr^-1 nm^-1 (${comparison.aggregatePercentChange.toFixed(3)}%; ${comparison.outcome}). It improves ${comparison.improvedConditionCount} of 17 conditions and worsens ${comparison.worsenedConditionCount}.

[Direct ozone-off/on comparison](figures/b1-ozone-off-vs-on-rmse.svg)

## Standard B1 figures

${standardLinks}

## Per-time comparison

| time | ozone off | ozone on | delta | outcome |
| --- | ---: | ---: | ---: | --- |
${rows}

## Physical change

The candidate retains the B1 Direct40 basis, ordinary Fibonacci-34 incoming quadrature, W27 outgoing cache, J4 order, 48 altitude nodes, 40-interval transport, and 20-interval source paths. It changes only atmosphere extinction by adding the contained Bruneton 300 DU, 233 K ozone composition (${profile.models.atmosphere.id}).

Across all ${transport.sampleCount} native table values, the ozone-on/off RMS transport difference is ${transport.rmsDifference.toExponential(6)} W m^-2 sr^-1 nm^-1 and the mean signed difference is ${transport.meanSignedDifference.toExponential(6)} W m^-2 sr^-1 nm^-1.

The official B1 harness and production Algorithm32 sources were executed read-only. All generated material is contained in this immutable run.
`;
}

async function loadAndVerifyBaseline() {
	for (const [artifactPath, expectedRelativePath] of [
		[BASELINE_RUN_ROOT, BASELINE_RELATIVE_ROOT],
		[BASELINE_TABLE, `${BASELINE_RELATIVE_ROOT}/${BASELINE_TABLE_NAME}`],
		[BASELINE_MANIFEST, `${BASELINE_RELATIVE_ROOT}/${BASELINE_MANIFEST_NAME}`],
		[BASELINE_PROVENANCE, `${BASELINE_RELATIVE_ROOT}/${BASELINE_PROVENANCE_NAME}`],
		[BASELINE_CUBE, `${BASELINE_RELATIVE_ROOT}/${BASELINE_CUBE_NAME}`],
		[
			BASELINE_DEFAULT_PROVENANCE,
			`${BASELINE_RELATIVE_ROOT}/${BASELINE_DEFAULT_PROVENANCE_NAME}`,
		],
	]) {
		requireCondition(
			portable(path.relative(REPOSITORY_ROOT, artifactPath)) === expectedRelativePath,
			`Retained Fibonacci-34 B1 artifact path changed: ${expectedRelativePath}.`,
		);
	}
	const tableBytes = await readFile(BASELINE_TABLE);
	requireCondition(
		tableBytes.byteLength === BASELINE_TABLE_BYTE_LENGTH,
		'Retained Fibonacci-34 B1 table byte length changed.',
	);
	requireCondition(
		await sha256File(BASELINE_TABLE) === BASELINE_TABLE_SHA256,
		'Retained Fibonacci-34 B1 table changed.',
	);
	requireCondition(
		await sha256File(BASELINE_MANIFEST) === BASELINE_MANIFEST_SHA256,
		'Retained Fibonacci-34 B1 manifest changed.',
	);
	requireCondition(
		await sha256File(BASELINE_PROVENANCE) === BASELINE_PROVENANCE_SHA256,
		'Retained Fibonacci-34 B1 provenance changed.',
	);
	requireCondition(
		await sha256File(BASELINE_CUBE) === BASELINE_CUBE_SHA256,
		'Retained Fibonacci-34 B1 cube changed.',
	);
	requireCondition(
		await sha256File(BASELINE_DEFAULT_PROVENANCE)
			=== BASELINE_DEFAULT_PROVENANCE_SHA256,
		'Retained Fibonacci-34 B1 default provenance changed.',
	);
	const manifest = JSON.parse(await readFile(BASELINE_MANIFEST, 'utf8'));
	const output = manifest.outputs?.[0];
	requireCondition(
		manifest.schema === BASELINE_MANIFEST_SCHEMA
			&& manifest.runId === BASELINE_INTERNAL_RUN_ID
			&& manifest.status === 'COMPLETE'
			&& manifest.backend === 'gpu-production-shaders-r32f'
			&& manifest.profileFamily === 'paper'
			&& manifest.incomingDirectionVariant === 'production-34'
			&& JSON.stringify(manifest.conditions) === JSON.stringify(CAPTURE_TIMES)
			&& JSON.stringify(manifest.orders) === '[4]'
			&& manifest.outputs?.length === 1
			&& output?.order === MAXIMUM_SCATTERING_ORDER
			&& output.table === BASELINE_TABLE_NAME
			&& output.tableSha256 === BASELINE_TABLE_SHA256
			&& output.provenance === BASELINE_PROVENANCE_NAME
			&& output.provenanceSha256 === BASELINE_PROVENANCE_SHA256
			&& output.cube === BASELINE_CUBE_NAME
			&& output.cubeSha256 === BASELINE_CUBE_SHA256
			&& output.defaultProvenance === BASELINE_DEFAULT_PROVENANCE_NAME
			&& output.defaultProvenanceSha256 === BASELINE_DEFAULT_PROVENANCE_SHA256,
		'Retained Fibonacci-34 B1 manifest controls changed.',
	);
	const provenance = JSON.parse(await readFile(BASELINE_PROVENANCE, 'utf8'));
	requireCondition(
		provenance.schema === BASELINE_PROVENANCE_SCHEMA
			&& provenance.runId === BASELINE_INTERNAL_RUN_ID
			&& provenance.backend === 'gpu-production-shaders-r32f'
			&& provenance.profileId === BASELINE_PROFILE_ID
			&& provenance.physicalProfileId === BASELINE_PHYSICAL_PROFILE_ID
			&& provenance.physicalProfileContentHash
				=== BASELINE_PHYSICAL_PROFILE_CONTENT_HASH
			&& provenance.completeCanonicalBoundary === true
			&& provenance.order === MAXIMUM_SCATTERING_ORDER
			&& provenance.rowCount === CAPTURE_TIMES.length * 81
			&& provenance.spectralChannelCount === 40
			&& JSON.stringify(provenance.numericalControls)
				=== JSON.stringify(BASELINE_NUMERICAL_CONTROLS)
			&& provenance.table?.name === BASELINE_TABLE_NAME
			&& provenance.table?.sha256 === BASELINE_TABLE_SHA256
			&& provenance.table?.byteLength === BASELINE_TABLE_BYTE_LENGTH,
		'Retained Fibonacci-34 B1 provenance controls changed.',
	);
	return {identity: baselineIdentity(), manifest, provenance};
}

async function createFigures({run, resultRoot, candidateTable, candidateTableSha256, profiles}) {
	const measurementBytes = await readFile(MEASUREMENT_BOUNDARY);
	const publishedBytes = await readFile(PUBLISHED_MODELS);
	const measurements = parseMeasurementPacketBoundary(
		measurementBytes.toString('utf8'),
		MEASUREMENT_BOUNDARY,
	);
	const published = parseSpectraTsv(PUBLISHED_MODELS);
	const candidate = parseSpectraTsv(candidateTable);
	const publishedScores = computeB1Scores(measurements, published);
	const candidateScore = computeB1Scores(measurements, candidate, ['proposed']).get('proposed');
	const figureProvenance = {
		profileFamily: BRUNETON_OZONE_B1_FIBONACCI34_PROFILE_FAMILY,
		candidateLabel: BRUNETON_OZONE_B1_FIBONACCI34_CANDIDATE_LABEL,
		selectedMaximumScatteringOrder: MAXIMUM_SCATTERING_ORDER,
		measurements: {
			path: portable(path.relative(REPOSITORY_ROOT, MEASUREMENT_BOUNDARY)),
			sha256: sha256Bytes(measurementBytes),
		},
		publishedModels: {
			path: portable(path.relative(REPOSITORY_ROOT, PUBLISHED_MODELS)),
			sha256: sha256Bytes(publishedBytes),
		},
		algorithm32Boundary: {
			path: portable(path.relative(REPOSITORY_ROOT, candidateTable)),
			sha256: candidateTableSha256,
			identity:
				`${BRUNETON_OZONE_B1_FIBONACCI34_CANDIDATE_LABEL}; Direct40; J4; ordinary F34; W27`,
			profiles,
		},
	};

	const artifacts = [];
	async function writeStandard(name, bytes) {
		const payload = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes, 'utf8');
		await run.writeArtifact(`generated/b1-directional-sky-radiance/gpu/figures/${name}`, payload);
		await run.writeArtifact(`figures/${name}`, payload);
		artifacts.push({name, byteLength: payload.byteLength, sha256: sha256Bytes(payload)});
	}

	await writeStandard(
		'b1-per-time-rmse.svg',
		renderB1PerTimeFigure(publishedScores, candidateScore, figureProvenance),
	);
	await writeStandard(
		'b1-aggregate-rmse.svg',
		renderB1AggregateFigure(publishedScores, candidateScore, figureProvenance),
	);
	const publishedPanels = loadPublishedFigure5Panels();
	const candidateByTime = candidate.get('proposed');
	const panels = [];
	for (const scene of FIGURE5_SCENES) {
		const panel = renderAlgorithm32Figure5Panel(
			candidateByTime.get(scene.time),
			measurements.get(scene.time),
			scene,
		);
		panels.push(panel);
		await writeStandard(
			`b1-figure5-algorithm32-${scene.fileTime}-z${scene.roundedSolarZenithDegrees}.png`,
			panel.png,
		);
	}
	await writeStandard(
		'b1-figure5-relative-error-domes.svg',
		renderFigure5ComparisonSvg(publishedPanels, panels, {
			generator: 'experiments/extraterrestrial/runners/run-b1-ordinary-fibonacci34-ozone.js',
			observable: 'B1 Figure 5 directional 360-720 nm band-integrated relative error',
			...figureProvenance,
		}),
	);
	requireCondition(
		artifacts.length === STANDARD_FIGURES.length
			&& STANDARD_FIGURES.every((name) => artifacts.some((artifact) => artifact.name === name)),
		'B1 did not emit the complete six-figure inventory.',
	);
	return {artifacts, candidateScore, figureProvenance};
}

async function main() {
	if (!process.argv.slice(2).includes(REVIEWED_GPU_FLAG)) {
		throw new Error(
			`GPU execution is source-review gated; rerun with ${REVIEWED_GPU_FLAG} after approval.`,
		);
	}
	await assertRepositoryIdentity();
	const baseline = await loadAndVerifyBaseline();
	requireCondition(
		await sha256File(MEASUREMENT_BOUNDARY) === MEASUREMENT_BOUNDARY_SHA256,
		'Canonical B1 measurement boundary changed.',
	);
	requireCondition(
		await sha256File(PUBLISHED_MODELS) === PUBLISHED_MODELS_SHA256,
		'Canonical B1 published-model table changed.',
	);
	const datasetModule = await import('../../experiments/b1-directional-sky-radiance/benchmark.js');
	const dataset = datasetModule.loadKiderDataset();
	const profileControls = dataset.conditions.map((condition) => {
		const profile = createBrunetonProductionProfile({
			time: condition.time,
			fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
			maximumScatteringOrder: MAXIMUM_SCATTERING_ORDER,
			incomingDirectionVariant: INCOMING_DIRECTION_VARIANT,
		});
		requireCondition(profile.models.atmosphere.constants.ozoneAbsorptionEnabled === true, 'Ozone profile is disabled.');
		requireCondition(
			profile.domains.positions.id === BASELINE_DOMAIN_SNAPSHOT.positions.id
				&& profile.domains.positions.count === BASELINE_DOMAIN_SNAPSHOT.positions.count
				&& profile.domains.incomingDirections.id
					=== BASELINE_DOMAIN_SNAPSHOT.incomingDirections.id
				&& profile.domains.incomingDirections.directionCount
					=== BASELINE_DOMAIN_SNAPSHOT.incomingDirections.directionCount
				&& profile.domains.outgoingDirections.id
					=== BASELINE_DOMAIN_SNAPSHOT.outgoingDirections.id
				&& profile.domains.outgoingDirections.faceWidth
					=== BASELINE_DOMAIN_SNAPSHOT.outgoingDirections.faceWidth
				&& profile.domains.outgoingDirections.directionCount
					=== BASELINE_DOMAIN_SNAPSHOT.outgoingDirections.directionCount,
			'F34 B1 position, incoming, or outgoing domain snapshot changed.',
		);
		requireCondition(
			profile.domains.positions.count === 48
				&& profile.domains.outgoingDirections.directionCount === 4374
				&& profile.numerical.viewPath.intervalCount === 40
				&& profile.numerical.sourcePathTransmittance.intervalCount === 20
				&& profile.numerical.cacheConstruction.transportIntervalCount === 40
				&& profile.numerical.cacheConstruction.maximumScatteringOrder
					=== MAXIMUM_SCATTERING_ORDER,
			'F34 B1 position, outgoing, path, source, transport, or scattering-order control changed.',
		);
		return {condition, profile, control: profileControl(profile)};
	});
	const composition = profileControls[0].profile.ozoneComposition;
	requireCondition(composition && typeof composition === 'object', 'Ozone profile omitted its composition identity.');
	requireCondition(
		profileControls.every(
			(item) => JSON.stringify(item.profile.ozoneComposition) === JSON.stringify(composition),
		),
		'Ozone composition changed between B1 conditions.',
	);
	const ozoneAuthoritySource = path.join(
		REPOSITORY_ROOT,
		...composition.authoritySourcePath.split('/'),
	);
	requireCondition(
		await sha256File(ozoneAuthoritySource) === composition.authoritySourceSha256,
		'Pinned Bruneton ozone authority source changed.',
	);

	const before = {
		algorithm32: await createFileInventory(ALGORITHM32_ROOT),
		b1: await createFileInventory(B1_ROOT),
		ozoneSources: await createFileInventory(OZONE_SOURCE_ROOT),
		atmosphereSources: await createFileInventory(ATMOSPHERE_SOURCE_ROOT),
		baselineRun: await createFileInventory(BASELINE_RUN_ROOT),
		runnerSha256: await sha256File(RUNNER_PATH),
	};
	const run = await initializeRunRecord({
		slug: 'b1-ordinary-fibonacci34-bruneton-ozone',
		command: COMMAND,
		inputs: {
			schemaId: 'b1-ordinary-f34-bruneton-ozone-inputs-v1',
			backend: 'gpu-production-shaders-r32f',
			conditions: [...CAPTURE_TIMES],
			maximumScatteringOrder: MAXIMUM_SCATTERING_ORDER,
			incomingDirectionVariant: INCOMING_DIRECTION_VARIANT,
			physicalProfileId: BRUNETON_OZONE_B1_PHYSICAL_PROFILE_ID,
			profileHashPolicy:
				'Node and Chrome profile hashes are retained as engine-local diagnostics; authored inputs and derived packets are cross-checked exactly or within the declared binary64 bound.',
			ozoneComposition: composition,
			baseline: baseline.identity,
		},
		provenance: {
			schemaId: 'b1-ordinary-f34-bruneton-ozone-provenance-v1',
			operation:
				'official read-only B1 GPU cache/runtime boundary with import-map replacement of only the contained atmosphere profile; score 17 J4 conditions and emit all six standard B1 figures',
			officialGpuImplementation:
				'scripts/experiments/b1-directional-sky-radiance/production-gpu-browser.js',
			containedProfile: 'experiments/extraterrestrial/ozone/BrunetonOzoneB1Profile.js',
			containedAtmosphere:
				'experiments/extraterrestrial/atmospheres/BrunetonOzoneCanonicalAtmosphere.js',
			containedAtmosphereAudit:
				'experiments/extraterrestrial/ozone/audit-bruneton-ozone-canonical-atmosphere.js',
			containedProfileHostAudit:
				'experiments/extraterrestrial/ozone/audit-b1-ozone-profile-host.js',
			containedRunner:
				'experiments/extraterrestrial/runners/run-b1-ordinary-fibonacci34-ozone.js',
			containedRunnerSha256: before.runnerSha256,
			productionMutation: false,
		},
		environment: {
			schemaId: 'b1-ordinary-f34-bruneton-ozone-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
		},
		references: {
			schemaId: 'b1-ordinary-f34-bruneton-ozone-references-v1',
			measurementBoundarySha256: MEASUREMENT_BOUNDARY_SHA256,
			publishedModelsSha256: PUBLISHED_MODELS_SHA256,
			ozoneAuthoritySource: {
				path: composition.authoritySourcePath,
				sha256: composition.authoritySourceSha256,
			},
			baseline: baseline.identity,
		},
	});
	await run.writeArtifact(
		'work/staging/ledger.txt',
		'Contained B1 ozone staging marker; no prior run is opened for writing.\n',
	);

	try {
		const ozoneAudit = await executeFile(
			process.execPath,
			[path.join(OZONE_SOURCE_ROOT, 'audit-bruneton-ozone-reference.js')],
			{
				cwd: REPOSITORY_ROOT,
				windowsHide: true,
				timeout: 30000,
				maxBuffer: 8 * 1024 * 1024,
			},
		);
		await run.writeArtifact('logs/ozone-reference-audit.stdout.log', ozoneAudit.stdout);
		await run.writeArtifact('logs/ozone-reference-audit.stderr.log', ozoneAudit.stderr);

		const atmosphereAudit = await executeFile(
			process.execPath,
			[path.join(OZONE_SOURCE_ROOT, 'audit-bruneton-ozone-canonical-atmosphere.js')],
			{
				cwd: REPOSITORY_ROOT,
				windowsHide: true,
				timeout: 120000,
				maxBuffer: 8 * 1024 * 1024,
			},
		);
		await run.writeArtifact('logs/ozone-atmosphere-audit.stdout.log', atmosphereAudit.stdout);
		await run.writeArtifact('logs/ozone-atmosphere-audit.stderr.log', atmosphereAudit.stderr);

		const profileHostAudit = await executeFile(
			process.execPath,
			[path.join(OZONE_SOURCE_ROOT, 'audit-b1-ozone-profile-host.js')],
			{
				cwd: REPOSITORY_ROOT,
				windowsHide: true,
				timeout: 120000,
				maxBuffer: 8 * 1024 * 1024,
			},
		);
		await run.writeArtifact('logs/ozone-profile-host-audit.stdout.log', profileHostAudit.stdout);
		await run.writeArtifact('logs/ozone-profile-host-audit.stderr.log', profileHostAudit.stderr);

		const tests = await executeFile(
			process.execPath,
			[
				'--test',
				'--test-isolation=none',
				path.join(B1_ROOT, 'production-profile.test.js'),
				path.join(B1_ROOT, 'generate-production-boundary.test.js'),
				path.join(B1_ROOT, 'ProductionProgressCacheBackend.test.js'),
				path.join(B1_ROOT, 'ProductionRun.test.js'),
				path.join(B1_ROOT, 'compare-production-backends.test.js'),
				path.join(B1_ROOT, 'OutgoingDirectionDiagnosticDomain.test.js'),
			],
			{
				cwd: REPOSITORY_ROOT,
				windowsHide: true,
				timeout: 180000,
				maxBuffer: 32 * 1024 * 1024,
			},
		);
		await run.writeArtifact('logs/b1-tests.stdout.log', tests.stdout);
		await run.writeArtifact('logs/b1-tests.stderr.log', tests.stderr);

		const progressLogPath = path.join(run.runDirectory, 'logs', 'b1-gpu-progress.log');
		const host = new OzoneB1ProductionGpuHost({
			progressLogPath,
			incomingDirectionVariant: INCOMING_DIRECTION_VARIANT,
		});
		const lines = [tableHeader()];
		const cubeValues = [];
		const gpuConditionDiagnostics = [];
		let gpuCapabilities = null;
		try {
			await host.open();
			for (const {condition, profile, control} of profileControls) {
				process.stderr.write(`[B1 ozone ${condition.time} J4 gpu] constructing production cache\n`);
				const result = await host.generateCondition({
					time: condition.time,
					fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
					maximumScatteringOrder: MAXIMUM_SCATTERING_ORDER,
					incomingDirectionVariant: INCOMING_DIRECTION_VARIANT,
				});
				assertSameProfileControl(control, result.profileControl, condition.time);
				requireCondition(result.values.length === 81, `${condition.time}: B1 direction count changed.`);
				const conditionCube = [];
				for (let gridX = 0; gridX < 9; gridX += 1) {
					for (let gridY = 0; gridY < 9; gridY += 1) {
						const values = result.values[gridY * 9 + gridX];
						requireCondition(
							values.length === 40 && values.every((value) => Number.isFinite(value) && value >= 0),
							`${condition.time}/${gridX}/${gridY}: invalid GPU spectrum.`,
						);
						lines.push(
							['proposed', condition.time, gridX, gridY, ...values.map((value) => value.toPrecision(17))].join('\t'),
						);
						conditionCube.push([...values.slice(0, 31)]);
					}
				}
				cubeValues.push(conditionCube);
				gpuCapabilities ??= result.capabilities;
				gpuConditionDiagnostics.push({
					time: condition.time,
					nodeProfileControl: control,
					browserProfileControl: result.profileControl,
					shaderDiagnostics: result.shaderDiagnostics,
					shaderSourceMetrics: result.shaderSourceMetrics,
					executionTimings: result.executionTimings,
				});
				process.stderr.write(`[B1 ozone ${condition.time} J4 gpu] complete\n`);
			}
		} finally {
			await host.close();
		}

		const resultRelative = 'generated/b1-directional-sky-radiance/gpu';
		const resultRoot = path.join(run.runDirectory, ...resultRelative.split('/'));
		const tableText = `${lines.join('\n')}\n`;
		const tableName = 'algorithm32-current-production-gpu-j4.tsv';
		const tableRelative = `${resultRelative}/${tableName}`;
		await run.writeArtifact(tableRelative, tableText);
		const tablePath = path.join(resultRoot, tableName);
		const tableSha256 = sha256Bytes(Buffer.from(tableText));
		requireCondition(
			tableSha256 !== BASELINE_TABLE_SHA256,
			'Ozone-on GPU boundary is byte-identical to the ozone-off control.',
		);
		const profiles = profileControls.map(({condition, control}, index) => ({
			time: condition.time,
			fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
			nodeProfileControl: control,
			browserProfileControl: gpuConditionDiagnostics[index].browserProfileControl,
		}));
		const provenance = {
			schema: 'algorithm32-contained-ozone-b1-provenance-v1',
			runId: run.runId,
			backend: 'gpu-production-shaders-r32f',
			executionBoundary:
				'official production GPU cache construction and final-view transport with contained ozone-bearing atmosphere profile and native spectral readout',
			gpuCapabilities,
			gpuConditionDiagnostics,
			modelNameInBenchmarkTables: 'proposed',
			profileId: BRUNETON_OZONE_B1_FIBONACCI34_PROFILE_FAMILY,
			presentationName: BRUNETON_OZONE_B1_FIBONACCI34_CANDIDATE_LABEL,
			physicalProfileId: BRUNETON_OZONE_B1_PHYSICAL_PROFILE_ID,
			ozoneComposition: composition,
			order: MAXIMUM_SCATTERING_ORDER,
			rowCount: CAPTURE_TIMES.length * 81,
			completeCanonicalBoundary: true,
			spectralChannelCount: 40,
			nativeSpectralBoundary: {
				channelCount: 40,
				centersNanometers: Array.from({length: 40}, (_, index) => 360 + (470 * index) / 40),
				sampleSemantics: 'point-sampled-spectral-density',
				projection: 'identity-direct-40',
			},
			numericalControls: {
				pathIntervalCount: 40,
				sourceTransmittanceIntervalCount: 20,
				incidentDirectionCount: 34,
				incidentAltitudeBinCount: 48,
				incomingDirectionDomain: INCOMING_DOMAIN,
				scatteringOutputDomain: 'source-aligned-boundary-inclusive-gnomonic-cubed-sphere-w27',
				scatteringOutputFaceWidth: 27,
				scatteringOutputDirectionCount: 4374,
				positionNodeCount: 48,
				positionLookup: 'view-only-linear-physical-altitude-over-actual-nodes',
				maximumScatteringOrder: MAXIMUM_SCATTERING_ORDER,
			},
			table: {name: tableName, sha256: tableSha256, byteLength: Buffer.byteLength(tableText)},
			profiles,
		};
		const provenanceName = 'algorithm32-current-production-gpu-j4-provenance.json';
		await run.writeJsonArtifact(`${resultRelative}/${provenanceName}`, provenance);
		const cubeName = 'algorithm32-current-production-gpu-j4-cube.json';
		await run.writeJsonArtifact(
			`${resultRelative}/${cubeName}`,
			makeCube(cubeValues, {
				source: 'contained Algorithm32 B1 GPU ozone boundary',
				runId: run.runId,
				order: MAXIMUM_SCATTERING_ORDER,
				table: tableName,
				tableSha256,
			}),
		);

		const figureResult = await createFigures({
			run,
			resultRoot,
			candidateTable: tablePath,
			candidateTableSha256: tableSha256,
			profiles,
		});
		const ozoneOffModels = parseSpectraTsv(BASELINE_TABLE);
		const ozoneOnModels = parseSpectraTsv(tablePath);
		const measurements = parseMeasurementPacketBoundary(
			await readFile(MEASUREMENT_BOUNDARY, 'utf8'),
			MEASUREMENT_BOUNDARY,
		);
		const ozoneOffScore = computeB1Scores(measurements, ozoneOffModels, ['proposed']).get('proposed');
		const comparison = compareB1Scores(ozoneOffScore, figureResult.candidateScore);
		comparison.ozoneOn.tableSha256 = tableSha256;
		const transport = computeTransportDifference(ozoneOffModels, ozoneOnModels);
		requireCondition(
			transport.rmsDifference > 0
				&& transport.decreasedCount > 0
				&& transport.increasedCount === 0,
			'Ozone-on transport must be measurably and exclusively attenuating.',
		);
		comparison.transportDifference = transport;
		comparison.figures = figureResult.artifacts;
		await run.writeJsonArtifact('evidence/ozone-off-vs-on-comparison.json', comparison);
		await run.writeArtifact('figures/b1-ozone-off-vs-on-rmse.svg', comparisonSvg(comparison));

		const generationManifest = {
			schema: 'algorithm32-contained-ozone-b1-manifest-v1',
			runId: run.runId,
			backend: 'gpu-production-shaders-r32f',
			status: 'COMPLETE',
			conditions: [...CAPTURE_TIMES],
			orders: [MAXIMUM_SCATTERING_ORDER],
			profileFamily: BRUNETON_OZONE_B1_FIBONACCI34_PROFILE_FAMILY,
			incomingDirectionVariant: INCOMING_DIRECTION_VARIANT,
			ozoneComposition: composition,
			outputs: {
				table: tableName,
				tableSha256,
				provenance: provenanceName,
				cube: cubeName,
				figures: figureResult.artifacts,
			},
		};
		await run.writeJsonArtifact(`${resultRelative}/manifest.json`, generationManifest);
		await run.writeArtifact(
			`${resultRelative}/result.md`,
			report(run.runId, comparison, transport, profileControls[0].profile),
		);

		const after = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			b1: await createFileInventory(B1_ROOT),
			ozoneSources: await createFileInventory(OZONE_SOURCE_ROOT),
			atmosphereSources: await createFileInventory(ATMOSPHERE_SOURCE_ROOT),
			baselineRun: await createFileInventory(BASELINE_RUN_ROOT),
			runnerSha256: await sha256File(RUNNER_PATH),
		};
		assertFileInventoriesEqual(before.algorithm32, after.algorithm32, 'Algorithm32 read-only inventory');
		assertFileInventoriesEqual(before.b1, after.b1, 'official B1 read-only inventory');
		assertFileInventoriesEqual(before.ozoneSources, after.ozoneSources, 'contained ozone source inventory');
		assertFileInventoriesEqual(
			before.atmosphereSources,
			after.atmosphereSources,
			'contained atmosphere source inventory',
		);
		assertFileInventoriesEqual(
			before.baselineRun,
			after.baselineRun,
			'retained Fibonacci-34 baseline read-only inventory',
		);
		requireCondition(before.runnerSha256 === after.runnerSha256, 'Contained B1 ozone runner changed during execution.');
		await run.writeJsonArtifact('evidence/read-only-inventories.json', {before, after});

		const finalManifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				proofId: 'b1-ordinary-f34-bruneton-ozone-full-figures-v1',
				accepted: true,
				comparison,
				transport,
				generatedResultRoot: resultRelative,
			},
			report: report(run.runId, comparison, transport, profileControls[0].profile),
		});
		const verification = await verifyRun(run.runDirectory);
		requireCondition(
			verification.verified && verification.artifactSetSha256 === finalManifest.artifactSetSha256,
			'Final immutable-run verification failed.',
		);
		process.stdout.write(
			`${JSON.stringify({
				runId: run.runId,
				conclusion: 'accepted',
				artifactSetSha256: finalManifest.artifactSetSha256,
				comparison,
			}, null, 2)}\n`,
		);
	} catch (error) {
		const detail = {
			name: error?.name ?? 'Error',
			message: error?.message ?? String(error),
			stack: error?.stack ?? null,
		};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({
				conclusion: 'failed',
				result: {
					proofId: 'b1-ordinary-f34-bruneton-ozone-full-figures-v1',
					accepted: false,
					error: detail,
				},
				report: `# ${run.runId}: B1 ordinary F34 with ozone\n\nConclusion: **failed**.\n\n${detail.message}\n`,
			});
			process.stderr.write(
				`${JSON.stringify({
					runId: run.runId,
					conclusion: 'failed',
					artifactSetSha256: manifest.artifactSetSha256,
					error: detail,
				}, null, 2)}\n`,
			);
		} catch (finalizationError) {
			process.stderr.write(
				`${JSON.stringify({
					conclusion: 'unsealed-failure',
					error: detail,
					finalizationError: String(finalizationError),
				}, null, 2)}\n`,
			);
		}
		process.exitCode = 1;
	}
}

await main();
