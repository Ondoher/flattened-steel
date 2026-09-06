#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	sha256,
	sha256File,
} from '../../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../../harness/lib/module-closure.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {
	CONTAINMENT_POLICY_PATH,
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	PRODUCTION_SOURCE_ROOT,
	REPOSITORY_ROOT,
	RUNS_ROOT,
	assertRepositoryIdentity,
} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';

const COMMAND =
	'node experiments/extraterrestrial/solar-zenith-cache/runners/'
	+ 'run-zenith-culling-memory-experiment.js';
const RUNNER_RELATIVE_PATH =
	'solar-zenith-cache/runners/run-zenith-culling-memory-experiment.js';
const DECLARED_RUNNER_ROOT =
	'experiments/extraterrestrial/solar-zenith-cache/runners';
const LANE_POLICY_RELATIVE_PATH =
	'solar-zenith-cache/containment-policy.json';
const LANE_POLICY_PATH = path.join(
	EXPERIMENT_ROOT,
	LANE_POLICY_RELATIVE_PATH,
);
const EXPECTED_SHARED_CONTAINMENT_POLICY_SHA256 =
	'228cfb87bdc319277aa3b8aa064914e1d08738d9da5197ab1d99b2aada1a990c';
const EXPECTED_LANE_CONTAINMENT_POLICY_SHA256 =
	'b65c3b021973153fd15f45c803ea3c117b48e4c22eae9ce575ca0c243cd77f24';
const SLUG = 'san-jose-nautical-zenith-culling-memory';

const PARENT = Object.freeze({
	runId: '000493-san-jose-nautical-twilight-ozone-f68-w39-preview',
	artifactSetSha256:
		'63ccccc8ce9e2796781dc6ac0fbd4c912c4340815050215f85dd263ea8ea966f',
	configRelativePath: 'browser/config.json',
	configSha256:
		'84e5c8f5bc713b69ca1e949d704569f9858b75015e2675be2c7e36467c09af70',
	renderRelativePath: 'evidence/render.json',
	renderSha256:
		'ab1d979bc966c9754161d86ee5b12ae47079caeca151f69b6a3b17ecf92ff246',
});

const SCENE = Object.freeze({
	id: 'sunset-plus-one-hour',
	timeIso: '2024-06-21T04:26:03.503Z',
	directionToSourceUpEastNorth: Object.freeze([
		-0.16946677586889025,
		-0.7579900644516986,
		0.6298667113517853,
	]),
	reportedSolarElevationDegrees: -9.756817735470484,
	bottomRadiusMeters: 6360000,
	topRadiusMeters: 6420000,
	observerHeightMeters: 1.7,
});

const TARGET = Object.freeze({
	positionDomainId: 'algorithm32-native-48-position-v2',
	positionCount: 48,
	boundaryAltitudeMeters: 0,
	outgoingDomainId: 'algorithm32-cubed-sphere-w27-outgoing-v1',
	outgoingFaceWidth: 27,
	outgoingDirectionCount: 4374,
	spectralBasisId: 'algorithm32-native-15-spectral-basis-v1',
	spectralBasisContentHash:
		'sha256:a03a3c7f45d9bd4ff8adf6482e9d1aac1acd72423758ecf797ac24f6dffba891',
	spectralChannelCount: 15,
	r32fBytesPerChannel: 4,
	rgba32fLaneCount: 16,
});

const ZENITH_GRID = Object.freeze({
	id: 'uniform-solar-zenith-cell-centers-180x1-degree-v1',
	count: 180,
	firstCenterDegrees: 0.5,
	lastCenterDegrees: 179.5,
	spacingDegrees: 1,
	endpointPolicy: 'clamp physical 0/180-degree endpoints to the nearest center',
	interpolation: 'linear between adjacent angular centers',
});

const EXPECTED_SOURCE_HASHES = Object.freeze({
	'sampling-domains/position/spherical-native/consts.js':
		'e125a351494dcfa6afdae4135b94c50d62576e9715b6469865bd1d2242a6cdc2',
	'sampling-domains/position/spherical-native/SphericalNativePositionDomain.js':
		'88a659d39c699f51398f98ba6ec7d277caee20ec6196084b24dceca00f265db9',
	'implementation/spherical-earth/SphericalScatteringCacheGeometry.js':
		'f360644de41540d7c6e970d2a8bf450f44c96d44302dad2b4f80f435c3f3c9d8',
	'implementation/spherical-earth/SphericalGeometryShaderContributor.js':
		'd407d109c8f61507ef97a17e5524c8cb03a97549d58554d24b481c7e73480b6c',
	'sampling-domains/direction/cubed-sphere/consts.js':
		'e06085d85e892cc79a64c4e9a7ae860e28f521c630c23103fe87f2fac229a5a4',
	'sampling-domains/direction/cubed-sphere/CubedSphereDirectionDomain.js':
		'597ca36a0e5b36c18977f031679b3f35c7bf412c4ecd5a036894e76965fa9531',
	'profiles/native-15/native-15-profile.js':
		'2346df6f74d8a7f372ce0ada16c1c9a6bf9780df1c2ac079e567f8a219f7830b',
	'profiles/native-15/consts.js':
		'2f223b4aef4d2bd8f940b523b735489b14ebaace722b6085923eb749d75ca4ba',
});

const FROZEN_EXPECTED = Object.freeze({
	nodeCenteredBracketCounts: Object.freeze([
		2, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 10,
		10, 10, 11, 11, 11, 12, 12, 12, 12, 13, 13, 13,
		13, 14, 14, 14, 14, 14, 15, 15, 15, 15, 15, 16,
		16, 16, 16, 16, 16, 17, 17, 17, 17, 17, 18, 18,
	]),
	interpolationSafeBracketCounts: Object.freeze([
		5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 10, 10,
		10, 11, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13,
		14, 14, 14, 14, 14, 15, 15, 15, 15, 15, 16, 16,
		16, 16, 16, 16, 17, 17, 17, 17, 17, 18, 18, 18,
	]),
	totals: Object.freeze({
		nodeCenteredBracket: 601,
		nodeCenteredHalo: 697,
		interpolationSafeBracket: 617,
		interpolationSafeHalo: 713,
		fullRectangular: 8640,
	}),
	sweep: Object.freeze({
		stateCount: 721,
		bracketMinimum: 310,
		bracketMedian: 617,
		bracketMaximum: 620,
		haloMinimum: 358,
		haloMedian: 713,
		haloMaximum: 716,
	}),
});

const DEGREES_PER_RADIAN = 180 / Math.PI;
const EPSILON = 1e-12;

function requireCondition(value, message) {
	if (!value) {
		throw new Error(message);
	}
}

function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}

function radiansToDegrees(value) {
	return value * DEGREES_PER_RADIAN;
}

function angularRadiusToLimbRadians(altitudeMeters) {
	const radius = SCENE.bottomRadiusMeters;
	return Math.atan2(
		Math.sqrt(altitudeMeters * (2 * radius + altitudeMeters)),
		radius,
	);
}

function maximumGroundClearCentralAngleDegrees(altitudeMeters) {
	return radiansToDegrees(
		angularRadiusToLimbRadians(SCENE.observerHeightMeters)
		+ angularRadiusToLimbRadians(altitudeMeters),
	);
}

function createNative48Altitudes() {
	const atmosphereHeightMeters =
		SCENE.topRadiusMeters - SCENE.bottomRadiusMeters;
	return Array.from(
		{length: TARGET.positionCount},
		(_unused, index) => index === 0
			? TARGET.boundaryAltitudeMeters
			: ((index + 0.5) / TARGET.positionCount) * atmosphereHeightMeters,
	);
}

function createSolarZenithNodes() {
	return Array.from(
		{length: ZENITH_GRID.count},
		(_unused, index) =>
			ZENITH_GRID.firstCenterDegrees
			+ index * ZENITH_GRID.spacingDegrees,
	);
}

function resolveZenithStencil(solarZenithDegrees) {
	const accepted = clamp(solarZenithDegrees, 0, 180);
	if (accepted <= ZENITH_GRID.firstCenterDegrees) {
		return {lowerIndex: 0, upperIndex: 0};
	}
	if (accepted >= ZENITH_GRID.lastCenterDegrees) {
		return {
			lowerIndex: ZENITH_GRID.count - 1,
			upperIndex: ZENITH_GRID.count - 1,
		};
	}
	const offset =
		(accepted - ZENITH_GRID.firstCenterDegrees)
		/ ZENITH_GRID.spacingDegrees;
	return {
		lowerIndex: Math.floor(offset),
		upperIndex: Math.ceil(offset),
	};
}

function createIndexSpan(firstIndex, lastIndex) {
	return Array.from(
		{length: lastIndex - firstIndex + 1},
		(_unused, offset) => firstIndex + offset,
	);
}

function resolveRange(observerSolarZenithDegrees, maximumCentralAngleDegrees) {
	const minimumSolarZenithDegrees = clamp(
		observerSolarZenithDegrees - maximumCentralAngleDegrees,
		0,
		180,
	);
	const maximumSolarZenithDegrees = clamp(
		observerSolarZenithDegrees + maximumCentralAngleDegrees,
		0,
		180,
	);
	const minimumStencil = resolveZenithStencil(minimumSolarZenithDegrees);
	const maximumStencil = resolveZenithStencil(maximumSolarZenithDegrees);
	const firstIndex = minimumStencil.lowerIndex;
	const lastIndex = maximumStencil.upperIndex;
	const haloFirstIndex = Math.max(0, firstIndex - 1);
	const haloLastIndex = Math.min(ZENITH_GRID.count - 1, lastIndex + 1);
	return {
		minimumSolarZenithDegrees,
		maximumSolarZenithDegrees,
		minimumSolarElevationDegrees: 90 - maximumSolarZenithDegrees,
		maximumSolarElevationDegrees: 90 - minimumSolarZenithDegrees,
		bracket: {
			firstIndex,
			lastIndex,
			count: lastIndex - firstIndex + 1,
			indices: createIndexSpan(firstIndex, lastIndex),
		},
		halo: {
			firstIndex: haloFirstIndex,
			lastIndex: haloLastIndex,
			count: haloLastIndex - haloFirstIndex + 1,
			indices: createIndexSpan(haloFirstIndex, haloLastIndex),
		},
	};
}

function createLedgerRows(altitudesMeters, observerSolarZenithDegrees) {
	const atmosphereHeightMeters =
		SCENE.topRadiusMeters - SCENE.bottomRadiusMeters;
	return altitudesMeters.map((altitudeMeters, altitudeIndex) => {
		const supportMinimumAltitudeMeters = altitudeIndex === 0
			? 0
			: altitudesMeters[altitudeIndex - 1];
		const supportMaximumAltitudeMeters =
			altitudeIndex === altitudesMeters.length - 1
				? atmosphereHeightMeters
				: altitudesMeters[altitudeIndex + 1];
		const nodeCenteredMaximumCentralAngleDegrees =
			maximumGroundClearCentralAngleDegrees(altitudeMeters);
		const interpolationSafeMaximumCentralAngleDegrees =
			maximumGroundClearCentralAngleDegrees(
				supportMaximumAltitudeMeters,
			);
		return {
			altitudeIndex,
			altitudeMeters,
			altitudeInterpolationSupport: {
				minimumAltitudeMeters: supportMinimumAltitudeMeters,
				maximumAltitudeMeters: supportMaximumAltitudeMeters,
			},
			nodeCentered: {
				maximumCentralAngleDegrees:
					nodeCenteredMaximumCentralAngleDegrees,
				...resolveRange(
					observerSolarZenithDegrees,
					nodeCenteredMaximumCentralAngleDegrees,
				),
			},
			interpolationSafe: {
				maximumCentralAngleDegrees:
					interpolationSafeMaximumCentralAngleDegrees,
				...resolveRange(
					observerSolarZenithDegrees,
					interpolationSafeMaximumCentralAngleDegrees,
				),
			},
		};
	});
}

function payloadForBlockCount(blockCount) {
	const spectrumCount = blockCount * TARGET.outgoingDirectionCount;
	const directR32fScalarCount = spectrumCount * TARGET.spectralChannelCount;
	const paddedRgba32fScalarCount = spectrumCount * TARGET.rgba32fLaneCount;
	return {
		blockCount,
		spectrumCount,
		directR32fScalarCount,
		directR32fBytes:
			directR32fScalarCount * TARGET.r32fBytesPerChannel,
		directR32fMiB:
			(directR32fScalarCount * TARGET.r32fBytesPerChannel) / (2 ** 20),
		paddedRgba32fScalarCount,
		paddedRgba32fBytes:
			paddedRgba32fScalarCount * TARGET.r32fBytesPerChannel,
		paddedRgba32fMiB:
			(paddedRgba32fScalarCount * TARGET.r32fBytesPerChannel)
			/ (2 ** 20),
	};
}

function occupancyFor(rows, rangeName, selectionName) {
	const pages = Array.from(
		{length: ZENITH_GRID.count},
		(_unused, zenithIndex) => ({
			zenithIndex,
			solarZenithDegrees:
				ZENITH_GRID.firstCenterDegrees
				+ zenithIndex * ZENITH_GRID.spacingDegrees,
			solarElevationDegrees:
				90 - (
					ZENITH_GRID.firstCenterDegrees
					+ zenithIndex * ZENITH_GRID.spacingDegrees
				),
			altitudeIndices: [],
		}),
	);
	for (const row of rows) {
		for (const zenithIndex of row[rangeName][selectionName].indices) {
			pages[zenithIndex].altitudeIndices.push(row.altitudeIndex);
		}
	}
	const retainedPages = pages
		.filter((page) => page.altitudeIndices.length > 0)
		.map((page) => ({
			...page,
			altitudeCount: page.altitudeIndices.length,
		}));
	return {
		retainedPageCount: retainedPages.length,
		firstRetainedIndex: retainedPages[0].zenithIndex,
		lastRetainedIndex: retainedPages.at(-1).zenithIndex,
		retainedPages,
	};
}

function summarizeLedger(rows, rangeName, selectionName, fullPayload) {
	const blockCount = rows.reduce(
		(sum, row) => sum + row[rangeName][selectionName].count,
		0,
	);
	const raggedPayload = payloadForBlockCount(blockCount);
	const occupancy = occupancyFor(rows, rangeName, selectionName);
	const wholePageBlockCount =
		occupancy.retainedPageCount * TARGET.positionCount;
	const wholePagePayload = payloadForBlockCount(wholePageBlockCount);
	return {
		rangeName,
		selectionName,
		ragged: {
			...raggedPayload,
			fractionOfFull: blockCount / fullPayload.blockCount,
			reductionFactor: fullPayload.blockCount / blockCount,
			percentSaved: 100 * (1 - blockCount / fullPayload.blockCount),
		},
		wholeZenithPages: {
			...wholePagePayload,
			retainedPageCount: occupancy.retainedPageCount,
			fractionOfFull: wholePageBlockCount / fullPayload.blockCount,
			reductionFactor: fullPayload.blockCount / wholePageBlockCount,
			percentSaved:
				100 * (1 - wholePageBlockCount / fullPayload.blockCount),
		},
		raggedSavingsRelativeToWholePagesPercent:
			100 * (1 - blockCount / wholePageBlockCount),
		occupancy,
	};
}

function segmentMinimumRadius(
	observerRadiusMeters,
	sampleRadiusMeters,
	centralAngleRadians,
) {
	const observer = [observerRadiusMeters, 0];
	const sample = [
		sampleRadiusMeters * Math.cos(centralAngleRadians),
		sampleRadiusMeters * Math.sin(centralAngleRadians),
	];
	const direction = [
		sample[0] - observer[0],
		sample[1] - observer[1],
	];
	const squaredLength = direction[0] ** 2 + direction[1] ** 2;
	const parameter = clamp(
		-(observer[0] * direction[0] + observer[1] * direction[1])
		/ squaredLength,
		0,
		1,
	);
	const closest = [
		observer[0] + parameter * direction[0],
		observer[1] + parameter * direction[1],
	];
	return Math.hypot(...closest);
}

function validateGeometry(rows, observerSolarZenithDegrees) {
	const observerRadiusMeters =
		SCENE.bottomRadiusMeters + SCENE.observerHeightMeters;
	const tangentEpsilonRadians = 1e-8;
	const tangentChecks = [1875, 30625, 60000].map((altitudeMeters) => {
		const centralAngleRadians =
			angularRadiusToLimbRadians(SCENE.observerHeightMeters)
			+ angularRadiusToLimbRadians(altitudeMeters);
		const sampleRadiusMeters = SCENE.bottomRadiusMeters + altitudeMeters;
		const atBoundaryMeters = segmentMinimumRadius(
			observerRadiusMeters,
			sampleRadiusMeters,
			centralAngleRadians,
		);
		const insideClearMeters = segmentMinimumRadius(
			observerRadiusMeters,
			sampleRadiusMeters,
			centralAngleRadians - tangentEpsilonRadians,
		);
		const beyondBlockedMeters = segmentMinimumRadius(
			observerRadiusMeters,
			sampleRadiusMeters,
			centralAngleRadians + tangentEpsilonRadians,
		);
		requireCondition(
			Math.abs(atBoundaryMeters - SCENE.bottomRadiusMeters) <= 1e-6,
			`Tangent cap residual is too large at ${altitudeMeters} m.`,
		);
		requireCondition(
			insideClearMeters > SCENE.bottomRadiusMeters,
			`The inside tangent perturbation is not ground-clear at ${altitudeMeters} m.`,
		);
		requireCondition(
			beyondBlockedMeters < SCENE.bottomRadiusMeters,
			`The outside tangent perturbation is not ground-blocked at ${altitudeMeters} m.`,
		);
		return {
			altitudeMeters,
			centralAngleDegrees: radiansToDegrees(centralAngleRadians),
			atBoundaryResidualMeters:
				atBoundaryMeters - SCENE.bottomRadiusMeters,
			insideClearanceMeters:
				insideClearMeters - SCENE.bottomRadiusMeters,
			beyondPenetrationMeters:
				beyondBlockedMeters - SCENE.bottomRadiusMeters,
		};
	});

	const observerSolarZenithRadians =
		observerSolarZenithDegrees / DEGREES_PER_RADIAN;
	const source = [
		Math.sin(observerSolarZenithRadians),
		0,
		Math.cos(observerSolarZenithRadians),
	];
	let sampledDirectionCount = 0;
	let maximumBoundResidualDegrees = 0;
	for (const row of rows) {
		const range = row.interpolationSafe;
		const capRadians =
			range.maximumCentralAngleDegrees / DEGREES_PER_RADIAN;
		for (let radialStep = 0; radialStep <= 8; radialStep += 1) {
			const centralAngleRadians = capRadians * radialStep / 8;
			for (let azimuthStep = 0; azimuthStep < 64; azimuthStep += 1) {
				const azimuthRadians = 2 * Math.PI * azimuthStep / 64;
				const radial = [
					Math.sin(centralAngleRadians) * Math.cos(azimuthRadians),
					Math.sin(centralAngleRadians) * Math.sin(azimuthRadians),
					Math.cos(centralAngleRadians),
				];
				const cosine = clamp(
					radial[0] * source[0]
					+ radial[1] * source[1]
					+ radial[2] * source[2],
					-1,
					1,
				);
				const zenithDegrees = radiansToDegrees(Math.acos(cosine));
				const lowerResidual =
					range.minimumSolarZenithDegrees - zenithDegrees;
				const upperResidual =
					zenithDegrees - range.maximumSolarZenithDegrees;
				maximumBoundResidualDegrees = Math.max(
					maximumBoundResidualDegrees,
					lowerResidual,
					upperResidual,
				);
				requireCondition(
					lowerResidual <= 1e-10 && upperResidual <= 1e-10,
					`Sampled local zenith escaped row ${row.altitudeIndex}.`,
				);
				const stencil = resolveZenithStencil(zenithDegrees);
				requireCondition(
					stencil.lowerIndex >= range.bracket.firstIndex
					&& stencil.upperIndex <= range.bracket.lastIndex,
					`Sampled stencil escaped row ${row.altitudeIndex}.`,
				);
				sampledDirectionCount += 1;
			}
		}
		const towardSourceZenith =
			observerSolarZenithDegrees
			- range.maximumCentralAngleDegrees;
		const awayFromSourceZenith =
			observerSolarZenithDegrees
			+ range.maximumCentralAngleDegrees;
		requireCondition(
			Math.abs(
				clamp(towardSourceZenith, 0, 180)
				- range.minimumSolarZenithDegrees,
			) <= EPSILON,
			`Toward-source extremum differs at row ${row.altitudeIndex}.`,
		);
		requireCondition(
			Math.abs(
				clamp(awayFromSourceZenith, 0, 180)
				- range.maximumSolarZenithDegrees,
			) <= EPSILON,
			`Away-source extremum differs at row ${row.altitudeIndex}.`,
		);
	}

	return {
		tangentEpsilonRadians,
		tangentChecks,
		sampledDirectionCount,
		maximumBoundResidualDegrees,
	};
}

function createSceneAngleSweep(interpolationSafeCapsDegrees) {
	const rows = [];
	for (let index = 0; index <= 720; index += 1) {
		const observerSolarElevationDegrees = -90 + index * 0.25;
		const observerSolarZenithDegrees =
			90 - observerSolarElevationDegrees;
		let bracketBlockCount = 0;
		let haloBlockCount = 0;
		for (const capDegrees of interpolationSafeCapsDegrees) {
			const range = resolveRange(observerSolarZenithDegrees, capDegrees);
			bracketBlockCount += range.bracket.count;
			haloBlockCount += range.halo.count;
		}
		rows.push({
			observerSolarElevationDegrees,
			observerSolarZenithDegrees,
			bracketBlockCount,
			haloBlockCount,
		});
	}
	function distribution(field) {
		const values = rows.map((row) => row[field]).sort((left, right) => left - right);
		return {
			minimum: values[0],
			median: values[(values.length - 1) / 2],
			maximum: values.at(-1),
		};
	}
	return {
		spacingDegrees: 0.25,
		rows,
		bracket: distribution('bracketBlockCount'),
		halo: distribution('haloBlockCount'),
	};
}

function compareNumberArrays(actual, expected, label) {
	requireCondition(
		actual.length === expected.length
		&& actual.every((value, index) => value === expected[index]),
		`${label} differs from the frozen pre-run values.`,
	);
}

function ledgerCsv(rows) {
	const header = [
		'altitude_index',
		'altitude_m',
		'support_max_altitude_m',
		'maximum_central_angle_deg',
		'minimum_local_solar_zenith_deg',
		'maximum_local_solar_zenith_deg',
		'bracket_first_index',
		'bracket_last_index',
		'bracket_count',
		'halo_first_index',
		'halo_last_index',
		'halo_count',
	];
	const lines = rows.map((row) => {
		const range = row.interpolationSafe;
		return [
			row.altitudeIndex,
			row.altitudeMeters,
			row.altitudeInterpolationSupport.maximumAltitudeMeters,
			range.maximumCentralAngleDegrees,
			range.minimumSolarZenithDegrees,
			range.maximumSolarZenithDegrees,
			range.bracket.firstIndex,
			range.bracket.lastIndex,
			range.bracket.count,
			range.halo.firstIndex,
			range.halo.lastIndex,
			range.halo.count,
		].join(',');
	});
	return `${header.join(',')}\n${lines.join('\n')}\n`;
}

function report(runId, proof) {
	const safeBracket = proof.memory.interpolationSafeBracket;
	const safeHalo = proof.memory.interpolationSafeHalo;
	return [
		`# ${runId}: San Jose nautical solar-zenith culling census`,
		'',
		'Conclusion: **accepted as a geometry and storage census only**.',
		'',
		'Using the exact run-000493 San Jose +1h Sun state with the current',
		'production Native48-v2/W27/Native15 target, the conservative',
		'altitude-interpolation-safe ledger retains:',
		'',
		`- ${safeBracket.ragged.blockCount} of 8,640 altitude/zenith blocks `
			+ `(${safeBracket.ragged.directR32fMiB.toFixed(6)} MiB direct `
			+ `Native15 R32F; ${safeBracket.ragged.percentSaved.toFixed(6)}% saved);`,
		`- ${safeHalo.ragged.blockCount} blocks with one additional angular halo `
			+ `(${safeHalo.ragged.directR32fMiB.toFixed(6)} MiB; `
			+ `${safeHalo.ragged.percentSaved.toFixed(6)}% saved);`,
		`- ${safeBracket.wholeZenithPages.retainedPageCount} complete zenith pages `
			+ `if ragged altitude packing is unavailable `
			+ `(${safeBracket.wholeZenithPages.directR32fMiB.toFixed(6)} MiB); and`,
		`- ${safeHalo.wholeZenithPages.retainedPageCount} complete pages with the halo `
			+ `(${safeHalo.wholeZenithPages.directR32fMiB.toFixed(6)} MiB).`,
		'',
		'This is not an exact replay of run 000493: that parent supplied the',
		'scene state, while this census deliberately targets current Native48-v2',
		'(0 m boundary) and production W27. No scattering cache or spectra were',
		'built. The result does not establish one-degree spectral accuracy, N4',
		'construction closure, a physical packing, a universal all-Sun asset, or',
		'a cache-layout decision.',
		'',
	].join('\n');
}

async function sourceIdentityRecords() {
	const records = [];
	for (const [relativePath, expectedSha256] of Object.entries(
		EXPECTED_SOURCE_HASHES,
	)) {
		const absolutePath = path.join(PRODUCTION_SOURCE_ROOT, relativePath);
		const actualSha256 = await sha256File(absolutePath);
		requireCondition(
			actualSha256 === expectedSha256,
			`Production comparison source changed: ${relativePath}.`,
		);
		records.push({
			path: `src/algorithm32/${relativePath}`,
			sha256: actualSha256,
		});
	}
	return records;
}

async function main() {
	requireCondition(
		process.argv.length === 2,
		'The zenith-culling memory experiment accepts no arguments.',
	);
	const run = await initializeRunRecord({
		slug: SLUG,
		command: COMMAND,
		inputs: {
			schemaId: 'solar-zenith-culling-memory-inputs-v1',
			claimBoundary:
				'geometry/storage census only; no spectral accuracy, cache construction, packing selection, plan-gate completion, or production claim',
			parent: PARENT,
			scene: SCENE,
			target: TARGET,
			zenithGrid: ZENITH_GRID,
			frozenExpected: FROZEN_EXPECTED,
		},
		provenance: {
			schemaId: 'solar-zenith-culling-memory-provenance-v1',
			operation:
				'combine the immutable run-000493 San Jose +1h Sun/observer geometry with current production Native48-v2, W27, and Native15 counts; derive the full ground-clear spherical cap at every altitude; close each range over the global one-degree solar-zenith interpolation stencil; then count ragged and whole-page R32F payloads',
			hybridBoundary:
				'run 000493 used legacy Native48-v1 at 2 m and W39; it supplies scene geometry only, while the target byte census uses current Native48-v2 at 0 m and W27',
			implementation: `experiments/extraterrestrial/${RUNNER_RELATIVE_PATH}`,
		},
		environment: {
			schemaId: 'solar-zenith-culling-memory-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		},
		references: {
			schemaId: 'solar-zenith-culling-memory-references-v1',
			canonicalDesign:
				'agents/topics/algorithm32/cache/solar-zenith-cache-design.md',
			canonicalPlan:
				'agents/topics/algorithm32/cache/distant-sun-solar-zenith-cache-plan.md',
			implementedContract:
				'agents/topics/algorithm32/cache/cache-contract.md',
			diagnosticEvidence:
				'agents/topics/extraterrestrial/celestial-contribution-cache-design.md#spherical-twilight-cache-coordinate-correction',
		},
	});

	try {
		await assertRepositoryIdentity();
		const parentDirectory = path.join(RUNS_ROOT, PARENT.runId);
		await Promise.all([
			assertExistingRealPathContained(
				EXPERIMENT_ROOT,
				CONTAINMENT_POLICY_PATH,
				'shared containment policy',
			),
			assertExistingRealPathContained(
				EXPERIMENT_ROOT,
				LANE_POLICY_PATH,
				'solar-zenith lane containment policy',
			),
			assertExistingRealPathContained(
				RUNS_ROOT,
				parentDirectory,
				'run-000493 parent',
			),
			assertNoReparseEntries(
				EXPERIMENT_ROOT,
				'Experiment source/control tree',
			),
		]);
		const [
			sharedContainmentPolicyText,
			laneContainmentPolicyText,
			sharedContainmentPolicySha256Before,
			laneContainmentPolicySha256Before,
		] =
			await Promise.all([
				readFile(CONTAINMENT_POLICY_PATH, 'utf8'),
				readFile(LANE_POLICY_PATH, 'utf8'),
				sha256File(CONTAINMENT_POLICY_PATH),
				sha256File(LANE_POLICY_PATH),
			]);
		const sharedContainmentPolicy = JSON.parse(
			sharedContainmentPolicyText,
		);
		const laneContainmentPolicy = JSON.parse(laneContainmentPolicyText);
		requireCondition(
			sharedContainmentPolicy.policyId
				=== 'algorithm32-extraterrestrial-g0-containment-v1'
			&& sharedContainmentPolicy.proofPolicy?.unitTestTree === 'prohibited'
			&& sharedContainmentPolicy.proofPolicy?.testFrameworkDependency
				=== 'prohibited'
			&& sharedContainmentPolicySha256Before
				=== EXPECTED_SHARED_CONTAINMENT_POLICY_SHA256,
			'Shared containment policy differs from the pinned tracked v1 input.',
		);
		requireCondition(
			laneContainmentPolicy.schemaVersion === 1
			&& laneContainmentPolicy.policyId
				=== 'algorithm32-solar-zenith-cache-contained-lane-v1'
			&& laneContainmentPolicy.implementationRoot
				=== 'experiments/extraterrestrial/solar-zenith-cache'
			&& laneContainmentPolicy.generatedOutputRoot
				=== 'tmp/extraterrestrial'
			&& laneContainmentPolicy.qualifyingRunnerRoot
				=== DECLARED_RUNNER_ROOT
			&& JSON.stringify(laneContainmentPolicy.productionComparisonRoots)
				=== JSON.stringify(['src/algorithm32', 'src/flat32'])
			&& laneContainmentPolicy.productionComparisonAccess === 'read-only'
			&& laneContainmentPolicy.unitTestTree === 'prohibited'
			&& laneContainmentPolicy.testFrameworkDependency === 'prohibited'
			&& laneContainmentPolicy.immutableRunProtocol
				=== 'experiments/extraterrestrial/harness/lib/run-record.js'
			&& laneContainmentPolicySha256Before
				=== EXPECTED_LANE_CONTAINMENT_POLICY_SHA256
			&& `experiments/extraterrestrial/${RUNNER_RELATIVE_PATH}`.startsWith(
				`${DECLARED_RUNNER_ROOT}/`,
			),
			'Solar-zenith lane policy does not authorize this focused runner.',
		);

		const flat32Root = path.join(REPOSITORY_ROOT, 'src', 'flat32');
		const [algorithm32Before, flat32Before] = await Promise.all([
			createFileInventory(PRODUCTION_SOURCE_ROOT),
			createFileInventory(flat32Root),
		]);

		const parentVerificationBefore = await verifyRun(PARENT.runId);
		requireCondition(
			parentVerificationBefore.verified
			&& parentVerificationBefore.conclusion === 'accepted'
			&& parentVerificationBefore.artifactSetSha256
				=== PARENT.artifactSetSha256,
			'Run-000493 parent verification failed.',
		);
		const parentConfigPath = path.join(
			parentDirectory,
			PARENT.configRelativePath,
		);
		const parentRenderPath = path.join(
			parentDirectory,
			PARENT.renderRelativePath,
		);
		await Promise.all([
			assertExistingRealPathContained(
				parentDirectory,
				parentConfigPath,
				'run-000493 config',
			),
			assertExistingRealPathContained(
				parentDirectory,
				parentRenderPath,
				'run-000493 render evidence',
			),
		]);
		const [configSha256, renderSha256, parentConfigText, parentRenderText] =
			await Promise.all([
				sha256File(parentConfigPath),
				sha256File(parentRenderPath),
				readFile(parentConfigPath, 'utf8'),
				readFile(parentRenderPath, 'utf8'),
			]);
		requireCondition(
			configSha256 === PARENT.configSha256,
			'Run-000493 config hash changed.',
		);
		requireCondition(
			renderSha256 === PARENT.renderSha256,
			'Run-000493 render hash changed.',
		);
		const parentConfig = JSON.parse(parentConfigText);
		const parentRender = JSON.parse(parentRenderText);
		const scene = parentConfig.scene;
		requireCondition(
			scene.id === SCENE.id
			&& scene.timeIso === SCENE.timeIso
			&& JSON.stringify(scene.directionToSourceUpEastNorth)
				=== JSON.stringify(SCENE.directionToSourceUpEastNorth)
			&& scene.sunElevationDegrees
				=== SCENE.reportedSolarElevationDegrees,
			'Run-000493 scene identity changed.',
		);
		requireCondition(
			parentRender.geometry.bottomRadius.value
				=== SCENE.bottomRadiusMeters
			&& parentRender.geometry.topRadius.value
				=== SCENE.topRadiusMeters
			&& parentRender.geometry.observerHeight.value
				=== SCENE.observerHeightMeters
			&& parentRender.geometry.cacheBoundaryAltitude.value === 2
			&& parentRender.geometry.containedOutgoingDirectionDomain.directionCount
				=== 9126,
			'Run-000493 geometry identity changed.',
		);
		requireCondition(
			parentRender.skyPathRadianceSpectra.spectralBasis.id
				=== TARGET.spectralBasisId
			&& parentRender.skyPathRadianceSpectra.spectralBasis.contentHash
				=== TARGET.spectralBasisContentHash
			&& parentRender.skyPathRadianceSpectra.spectralBasis.channelCount
				=== TARGET.spectralChannelCount,
			'Run-000493 Native15 identity changed.',
		);

		const sourceIdentities = await sourceIdentityRecords();
		const sourceDirectionNorm = Math.hypot(
			...SCENE.directionToSourceUpEastNorth,
		);
		requireCondition(
			Math.abs(sourceDirectionNorm - 1) <= 1e-15,
			'Scene source direction is not unit length.',
		);
		const observerMuS = SCENE.directionToSourceUpEastNorth[0];
		const calculatedSolarElevationDegrees = radiansToDegrees(
			Math.asin(observerMuS),
		);
		const observerSolarZenithDegrees = radiansToDegrees(
			Math.acos(observerMuS),
		);
		requireCondition(
			calculatedSolarElevationDegrees
				=== SCENE.reportedSolarElevationDegrees,
			'Reported and calculated scene solar elevations differ.',
		);

		const altitudesMeters = createNative48Altitudes();
		const solarZenithNodesDegrees = createSolarZenithNodes();
		requireCondition(
			altitudesMeters.length === 48
			&& altitudesMeters[0] === 0
			&& altitudesMeters[1] === 1875
			&& altitudesMeters.at(-1) === 59375
			&& altitudesMeters.every(
				(value, index) => index === 0 || value > altitudesMeters[index - 1],
			),
			'Current Native48 altitude lattice differs from the frozen contract.',
		);
		requireCondition(
			solarZenithNodesDegrees.length === 180
			&& solarZenithNodesDegrees[0] === 0.5
			&& solarZenithNodesDegrees.at(-1) === 179.5
			&& solarZenithNodesDegrees.every(
				(value, index) => index === 0
					|| value - solarZenithNodesDegrees[index - 1] === 1,
			),
			'Solar-zenith grid differs from its frozen convention.',
		);

		const rows = createLedgerRows(
			altitudesMeters,
			observerSolarZenithDegrees,
		);
		compareNumberArrays(
			rows.map((row) => row.nodeCentered.bracket.count),
			FROZEN_EXPECTED.nodeCenteredBracketCounts,
			'Node-centered bracket counts',
		);
		compareNumberArrays(
			rows.map((row) => row.interpolationSafe.bracket.count),
			FROZEN_EXPECTED.interpolationSafeBracketCounts,
			'Interpolation-safe bracket counts',
		);
		for (const row of rows) {
			requireCondition(
				row.nodeCentered.bracket.indices.every(
					(index) => row.interpolationSafe.bracket.indices.includes(index),
				),
				`Node-centered range is not a subset at row ${row.altitudeIndex}.`,
			);
			requireCondition(
				row.interpolationSafe.bracket.indices.every(
					(index) => row.interpolationSafe.halo.indices.includes(index),
				),
				`Bracket range is not a halo subset at row ${row.altitudeIndex}.`,
			);
		}

		const fullPayload = payloadForBlockCount(
			TARGET.positionCount * ZENITH_GRID.count,
		);
		const memory = {
			fullRectangular: fullPayload,
			nodeCenteredBracket: summarizeLedger(
				rows,
				'nodeCentered',
				'bracket',
				fullPayload,
			),
			nodeCenteredHalo: summarizeLedger(
				rows,
				'nodeCentered',
				'halo',
				fullPayload,
			),
			interpolationSafeBracket: summarizeLedger(
				rows,
				'interpolationSafe',
				'bracket',
				fullPayload,
			),
			interpolationSafeHalo: summarizeLedger(
				rows,
				'interpolationSafe',
				'halo',
				fullPayload,
			),
		};
		requireCondition(
			memory.fullRectangular.blockCount
				=== FROZEN_EXPECTED.totals.fullRectangular
			&& memory.nodeCenteredBracket.ragged.blockCount
				=== FROZEN_EXPECTED.totals.nodeCenteredBracket
			&& memory.nodeCenteredHalo.ragged.blockCount
				=== FROZEN_EXPECTED.totals.nodeCenteredHalo
			&& memory.interpolationSafeBracket.ragged.blockCount
				=== FROZEN_EXPECTED.totals.interpolationSafeBracket
			&& memory.interpolationSafeHalo.ragged.blockCount
				=== FROZEN_EXPECTED.totals.interpolationSafeHalo,
			'One or more frozen block totals changed.',
		);
		requireCondition(
			memory.fullRectangular.directR32fBytes === 2267481600
			&& memory.fullRectangular.paddedRgba32fBytes === 2418647040
			&& memory.interpolationSafeBracket.ragged.directR32fBytes
				=== 161925480
			&& memory.interpolationSafeHalo.ragged.directR32fBytes
				=== 187119720
			&& memory.interpolationSafeBracket.wholeZenithPages.directR32fBytes
				=== 226748160
			&& memory.interpolationSafeHalo.wholeZenithPages.directR32fBytes
				=== 251942400,
			'Exact byte arithmetic changed.',
		);

		const geometryValidation = validateGeometry(
			rows,
			observerSolarZenithDegrees,
		);
		const sceneAngleSweep = createSceneAngleSweep(
			rows.map(
				(row) => row.interpolationSafe.maximumCentralAngleDegrees,
			),
		);
		requireCondition(
			sceneAngleSweep.rows.length === FROZEN_EXPECTED.sweep.stateCount
			&& sceneAngleSweep.bracket.minimum
				=== FROZEN_EXPECTED.sweep.bracketMinimum
			&& sceneAngleSweep.bracket.median
				=== FROZEN_EXPECTED.sweep.bracketMedian
			&& sceneAngleSweep.bracket.maximum
				=== FROZEN_EXPECTED.sweep.bracketMaximum
			&& sceneAngleSweep.halo.minimum
				=== FROZEN_EXPECTED.sweep.haloMinimum
			&& sceneAngleSweep.halo.median
				=== FROZEN_EXPECTED.sweep.haloMedian
			&& sceneAngleSweep.halo.maximum
				=== FROZEN_EXPECTED.sweep.haloMaximum,
			'Scene-angle sweep differs from the frozen census.',
		);

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [RUNNER_RELATIVE_PATH],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: [
				'node:child_process',
				'node:crypto',
				'node:fs',
				'node:fs/promises',
				'node:module',
				'node:os',
				'node:path',
				'node:url',
				'node:util',
			],
		});
		requireCondition(
			closure.files.every(
				(file) => !file.startsWith('../') && !path.isAbsolute(file),
			)
			&& closure.bareResolutions.length === 0,
			'Static module closure escaped the contained experiment or used a bare dependency.',
		);

		const [algorithm32After, flat32After] = await Promise.all([
			createFileInventory(PRODUCTION_SOURCE_ROOT),
			createFileInventory(flat32Root),
		]);
		assertFileInventoriesEqual(
			algorithm32Before,
			algorithm32After,
			'Algorithm32 production inventory',
		);
		assertFileInventoriesEqual(
			flat32Before,
			flat32After,
			'Flat32 production inventory',
		);
		const parentVerificationAfter = await verifyRun(PARENT.runId);
		requireCondition(
			JSON.stringify(parentVerificationAfter)
				=== JSON.stringify(parentVerificationBefore),
			'Run-000493 parent changed during the experiment.',
		);
		const [
			sharedContainmentPolicySha256After,
			laneContainmentPolicySha256After,
		] = await Promise.all([
			sha256File(CONTAINMENT_POLICY_PATH),
			sha256File(LANE_POLICY_PATH),
		]);
		requireCondition(
			sharedContainmentPolicySha256After
				=== sharedContainmentPolicySha256Before
			&& laneContainmentPolicySha256After
				=== laneContainmentPolicySha256Before,
			'One or more containment policies changed during the experiment.',
		);

		const runnerPath = path.join(EXPERIMENT_ROOT, RUNNER_RELATIVE_PATH);
		const sourceIdentity = {
			schemaId: 'solar-zenith-culling-source-identities-v1',
			runId: run.runId,
			runner: {
				path: `experiments/extraterrestrial/${RUNNER_RELATIVE_PATH}`,
				sha256: await sha256File(runnerPath),
			},
			containmentPolicies: {
				shared: {
					path: 'experiments/extraterrestrial/containment-policy.json',
					sha256: sharedContainmentPolicySha256After,
					policyId: sharedContainmentPolicy.policyId,
				},
				lane: {
					path:
						`experiments/extraterrestrial/${LANE_POLICY_RELATIVE_PATH}`,
					sha256: laneContainmentPolicySha256After,
					policyId: laneContainmentPolicy.policyId,
					qualifyingRunnerRoot:
						laneContainmentPolicy.qualifyingRunnerRoot,
				},
			},
			productionComparisonSources: sourceIdentities,
			productionInventories: {
				algorithm32: {
					fileCount: algorithm32After.fileCount,
					totalBytes: algorithm32After.totalBytes,
					aggregateSha256: algorithm32After.aggregateSha256,
				},
				flat32: {
					fileCount: flat32After.fileCount,
					totalBytes: flat32After.totalBytes,
					aggregateSha256: flat32After.aggregateSha256,
				},
			},
			staticClosure: {
				schemaId: closure.schemaId,
				entries: closure.entries,
				fileCount: closure.files.length,
				edgeCount: closure.edges.length,
				nodeBuiltins: closure.nodeBuiltins,
				bareResolutions: closure.bareResolutions,
			},
		};

		const sceneRecord = {
			schemaId: 'solar-zenith-culling-scene-v1',
			runId: run.runId,
			parent: {
				...PARENT,
				verification: parentVerificationAfter,
			},
			scene: {
				...SCENE,
				sourceDirectionNorm,
				observerMuS,
				calculatedSolarElevationDegrees,
				observerSolarZenithDegrees,
				observerRadiusMeters:
					SCENE.bottomRadiusMeters + SCENE.observerHeightMeters,
				horizonDipDegrees: radiansToDegrees(
					angularRadiusToLimbRadians(SCENE.observerHeightMeters),
				),
			},
			target: {
				...TARGET,
				notExactParentCacheReplay: true,
				parentPositionBoundaryAltitudeMeters:
					parentRender.geometry.cacheBoundaryAltitude.value,
				parentOutgoingDirectionCount:
					parentRender.geometry.containedOutgoingDirectionDomain.directionCount,
			},
		};

		const ledger = {
			schemaId: 'solar-zenith-culling-altitude-ledger-v1',
			runId: run.runId,
			claimBoundary:
				'conservative full ground-clear cap from the fixed run-000493 ground observer; all W27 directions retained; no refraction, elevated/space observer, probe, secondary-query, or construction-dependency closure claim',
			formula: {
				observerHorizonDip:
					'delta_o = atan2(sqrt(h_o * (2 R + h_o)), R)',
				pointLimbAngle:
					'delta_h = atan2(sqrt(h * (2 R + h)), R)',
				maximumGroundClearCap: 'gamma(h) = delta_o + delta_h',
				localSolarZenithRange:
					'[max(0, theta_observer - gamma), min(180, theta_observer + gamma)]',
				altitudeInterpolationSupport:
					'row i uses the next Native48 altitude as its conservative upper support; the final row uses atmosphere top',
			},
			zenithGrid: {
				...ZENITH_GRID,
				nodesDegrees: solarZenithNodesDegrees,
			},
			altitudeDomain: {
				id: TARGET.positionDomainId,
				nodesMeters: altitudesMeters,
				nodesSha256: sha256(JSON.stringify(altitudesMeters)),
			},
			rows,
			pageOccupancy: {
				interpolationSafeBracket:
					memory.interpolationSafeBracket.occupancy,
				interpolationSafeHalo:
					memory.interpolationSafeHalo.occupancy,
			},
			sceneAngleSweep,
		};

		const memoryCensus = {
			schemaId: 'solar-zenith-culling-memory-census-v1',
			runId: run.runId,
			units: {
				byte: 'byte',
				MiB: '2^20 bytes',
			},
			blockDefinition:
				'one altitude node by one solar-zenith node, retaining all 4,374 W27 outgoing spectra',
			bytesPerBlock: payloadForBlockCount(1),
			memory,
			interpretation: {
				primary:
					'interpolationSafeBracket.ragged is the minimum analytically closed per-altitude ledger',
				robustness:
					'interpolationSafeHalo.ragged adds one stored angular node beyond both interpolation brackets',
				physicalPacking:
					'ragged savings require a packing that does not allocate unused altitude rows inside every retained zenith page',
				construction:
					'the census does not prove that N4 can be constructed from only the retained runtime subset; an offline full solution may still be required before culling',
				assetReuse:
					'this is a fixed-observer-Sun-state subset, not a universal all-Sun asset',
			},
		};

		const derivation = {
			schemaId: 'solar-zenith-culling-derivation-v1',
			runId: run.runId,
			parents: [
				{
					runId: PARENT.runId,
					artifactSetSha256: PARENT.artifactSetSha256,
					consumedArtifacts: [
						{
							path: PARENT.configRelativePath,
							sha256: PARENT.configSha256,
						},
						{
							path: PARENT.renderRelativePath,
							sha256: PARENT.renderSha256,
						},
					],
				},
			],
			operation:
				'for each current Native48 row, derive the supremum ground-clear spherical cap over every altitude that can interpolate through that row, convert the cap to a local solar-zenith interval, close it over a frozen 180-center one-degree interpolation grid, retain all production W27 outgoing directions and Native15 channels, and multiply exact R32F scalar counts',
			implementation: sourceIdentity.runner,
			materialParameters: {
				scene: sceneRecord.scene,
				target: TARGET,
				zenithGrid: ZENITH_GRID,
			},
			outputs: [
				'solar-zenith-culling-altitude-ledger-v1',
				'solar-zenith-culling-memory-census-v1',
				'solar-zenith-culling-geometry-validation-v1',
				'solar-zenith-culling-proof-v1',
			],
			resultIdentity:
				`${run.runId}:solar-zenith-culling-geometry-storage-census-v1`,
		};

		const assertions = [
			'Immutable run 000493 remains accepted and byte-identical.',
			'Run-000493 scene vector, Sun elevation, radii, observer height, and Native15 identity match the pinned inputs.',
			'Current production Native48-v2, its adjacent-node CPU/shader interpolation owners, W27, and Native15 comparison source hashes match the frozen inputs.',
			'The current Native48-v2 node sequence has 48 ordered nodes from 0 m through 59,375 m.',
			'The hypothetical solar-zenith grid has 180 one-degree cell centers from 0.5 through 179.5 degrees with endpoint clamping.',
			'Tangent-segment geometry independently reproduces the ground-clear cap boundary.',
			'Every sampled cap direction and its solar-zenith interpolation stencil remain inside the analytic row ledger.',
			'Every node-centered range is contained by its altitude-interpolation-safe row range.',
			'Every bracket-closed range is contained by its optional one-node halo.',
			'Frozen row counts, totals, scene-angle sweep, and exact R32F byte products agree.',
			'Algorithm32 and Flat32 production inventories are byte-identical before and after the run.',
			'The static module closure remains contained and has no bare runtime dependency.',
			'The pinned tracked shared containment policy is unchanged, and the lane policy explicitly authorizes the focused runner root while prohibiting an experimental unit-test tree.',
		];
		const proof = {
			proofId: 'solar-zenith-culling-proof-v1',
			accepted: true,
			claimBoundary:
				'accepted geometry and storage census only; no scattering values were built or compared',
			assertions,
			geometryValidation,
			memory: {
				fullRectangular: memory.fullRectangular,
				interpolationSafeBracket: memory.interpolationSafeBracket,
				interpolationSafeHalo: memory.interpolationSafeHalo,
			},
			sceneSweepSummary: {
				spacingDegrees: sceneAngleSweep.spacingDegrees,
				stateCount: sceneAngleSweep.rows.length,
				bracket: sceneAngleSweep.bracket,
				halo: sceneAngleSweep.halo,
			},
			containment: {
				algorithm32AggregateSha256: algorithm32After.aggregateSha256,
				flat32AggregateSha256: flat32After.aggregateSha256,
				closureFileCount: closure.files.length,
				closureEdgeCount: closure.edges.length,
			},
			limitations: [
				'One-degree solar-zenith interpolation accuracy is not measured.',
				'N4 construction dependency closure is not measured.',
				'Ragged physical texture packing and driver allocation are not measured.',
				'The ledger is tied to one ground observer and one Sun state.',
				'Refraction, probes, elevated or space observers, and other query families are excluded.',
			],
		};

		await run.writeJsonArtifact('evidence/scene-input.json', sceneRecord);
		await run.writeJsonArtifact('evidence/zenith-culling-ledger.json', ledger);
		await run.writeArtifact(
			'evidence/zenith-culling-ledger.csv',
			ledgerCsv(rows),
		);
		await run.writeJsonArtifact('evidence/memory-census.json', memoryCensus);
		await run.writeJsonArtifact(
			'evidence/geometry-validation.json',
			{
				schemaId: 'solar-zenith-culling-geometry-validation-v1',
				runId: run.runId,
				...geometryValidation,
			},
		);
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentity);
		await run.writeJsonArtifact('evidence/derivation.json', derivation);
		await run.writeJsonArtifact('evidence/proof.json', proof);

		const terminalManifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				proofId: proof.proofId,
				accepted: true,
				claimBoundary: proof.claimBoundary,
				interpolationSafeBracket: {
					blockCount:
						memory.interpolationSafeBracket.ragged.blockCount,
					directR32fBytes:
						memory.interpolationSafeBracket.ragged.directR32fBytes,
					percentSaved:
						memory.interpolationSafeBracket.ragged.percentSaved,
				},
				interpolationSafeHalo: {
					blockCount:
						memory.interpolationSafeHalo.ragged.blockCount,
					directR32fBytes:
						memory.interpolationSafeHalo.ragged.directR32fBytes,
					percentSaved:
						memory.interpolationSafeHalo.ragged.percentSaved,
				},
			},
			report: report(run.runId, proof),
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion: 'accepted',
			artifactSetSha256: terminalManifest.artifactSetSha256,
			interpolationSafeBracket:
				proof.memory.interpolationSafeBracket.ragged,
			interpolationSafeHalo:
				proof.memory.interpolationSafeHalo.ragged,
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
				result: {
					proofId: 'solar-zenith-culling-proof-v1',
					accepted: false,
					error: serialized,
				},
				report: `# ${run.runId}: San Jose nautical solar-zenith culling census\n\n`
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
				finalizationError:
					finalizationError instanceof Error
						? finalizationError.message
						: String(finalizationError),
			}, null, 2)}\n`);
		}
		process.exitCode = 1;
	}
}

await main();
