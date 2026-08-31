#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const DIRECT40_CEILING = 11.820391604126252;
const MATCHED_NATIVE15_CEILING = 12.586323005727962;
const EXPECTED_ORACLE_SHA256 = 'd7948cd1611cf2b5949093e60340be51bff392aeaf3c882145f4521376080b66';
const EXPECTED_SEAM_SHA256 = 'db662148ce282e890b547a4db5deddbbfe5fff980a4f604709ad4739c0bab8d3';
const EXPECTED_INDEX_SHA256 = '9b3873eb3529ecda1aa1569172ccb6bc85c4d22e3e037d3ddf8639452bfe34c8';
const LOGICAL_DIRECTION_COUNT = 4374;
const UNIQUE_DIRECTION_COUNT = 4058;
const WAVELENGTH_COUNT = 15;

function requireArgument(name) {
	const index = process.argv.indexOf(name);
	const value = index < 0 ? null : process.argv[index + 1];
	if (!value || value.startsWith('--')) throw new Error(`${name} is required.`);
	return value;
}

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

async function containedDirectory(root, supplied, label) {
	const resolved = await realpath(path.resolve(supplied));
	requireCondition(resolved.startsWith(`${root}${path.sep}`), `${label} must remain under tmp/extraterrestrial.`);
	const information = await lstat(resolved);
	requireCondition(information.isDirectory() && !information.isSymbolicLink(), `${label} must be a real directory.`);
	return resolved;
}

async function readJson(directory, relativePath) {
	const target = await realpath(path.join(directory, relativePath));
	requireCondition(target.startsWith(`${directory}${path.sep}`), 'Evidence input escapes its immutable run.');
	return JSON.parse(await readFile(target, 'utf8'));
}

async function findManifest(packageDirectory) {
	const report = await readJson(packageDirectory, 'compiler-report.json');
	return readJson(packageDirectory, report.manifestPath);
}

function exhaustiveSeamComparison(oracleBytes, seamBytes, indexBytes, packedRowCount) {
	const oracle = new Uint32Array(oracleBytes.buffer, oracleBytes.byteOffset, oracleBytes.byteLength / 4);
	const seam = new Uint32Array(seamBytes.buffer, seamBytes.byteOffset, seamBytes.byteLength / 4);
	const indices = new Uint16Array(indexBytes.buffer, indexBytes.byteOffset, indexBytes.byteLength / 2);
	requireCondition(indices.length === LOGICAL_DIRECTION_COUNT, 'Production W27 index has the wrong length.');
	requireCondition(
		oracle.length === WAVELENGTH_COUNT * packedRowCount * LOGICAL_DIRECTION_COUNT,
		'Production oracle has the wrong scalar count.',
	);
	requireCondition(
		seam.length === WAVELENGTH_COUNT * packedRowCount * UNIQUE_DIRECTION_COUNT,
		'Production exact-seam payload has the wrong scalar count.',
	);

	let mismatches = 0;
	for (let layer = 0; layer < WAVELENGTH_COUNT; layer += 1) {
		for (let row = 0; row < packedRowCount; row += 1) {
			const logicalBase = (layer * packedRowCount + row) * LOGICAL_DIRECTION_COUNT;
			const uniqueBase = (layer * packedRowCount + row) * UNIQUE_DIRECTION_COUNT;
			for (let direction = 0; direction < LOGICAL_DIRECTION_COUNT; direction += 1) {
				if (oracle[logicalBase + direction] !== seam[uniqueBase + indices[direction]]) mismatches += 1;
			}
		}
	}

	const probes = [];
	for (const layer of [0, 7, 14]) {
		for (const row of [0, Math.floor(packedRowCount / 2), packedRowCount - 1]) {
			for (const direction of [0, 364, 728, 1458, 2187, 3280, 4373]) {
				const logicalIndex = (layer * packedRowCount + row) * LOGICAL_DIRECTION_COUNT + direction;
				const uniqueIndex = (layer * packedRowCount + row) * UNIQUE_DIRECTION_COUNT + indices[direction];
				probes.push({
					layer,
					row,
					logicalDirection: direction,
					uniqueDirection: indices[direction],
					oracleBits: oracle[logicalIndex],
					seamBits: seam[uniqueIndex],
					exact: oracle[logicalIndex] === seam[uniqueIndex],
				});
			}
		}
	}
	return {scalarComparisons: oracle.length, mismatches, probes};
}

const repositoryRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'));
const evidenceRoot = await realpath(path.join(repositoryRoot, 'tmp', 'extraterrestrial'));
const direct40Run = await containedDirectory(evidenceRoot, requireArgument('--direct40-run'), 'Direct40 run');
const native15Run = await containedDirectory(evidenceRoot, requireArgument('--native15-run'), 'Native15 run');
const figuresRun = await containedDirectory(evidenceRoot, requireArgument('--figures-run'), 'B1 figures run');
const previousModelRun = await containedDirectory(
	evidenceRoot,
	requireArgument('--previous-model-run'),
	'Previous-model run',
);
const packageDirectory = await containedDirectory(evidenceRoot, requireArgument('--package'), 'Production package');
const outputDirectory = path.resolve(requireArgument('--output'));
requireCondition(
	outputDirectory.startsWith(`${evidenceRoot}${path.sep}`),
	'PA6 output must remain under tmp/extraterrestrial.',
);
await lstat(outputDirectory).then(
	() => {
		throw new Error('PA6 output directory must not already exist.');
	},
	(error) => {
		if (error.code !== 'ENOENT') throw error;
	},
);
await mkdir(outputDirectory);
requireCondition((await realpath(outputDirectory)) === outputDirectory, 'PA6 output must resolve exactly.');

const [direct40, native15, figures, previousModel, manifest] = await Promise.all([
	readJson(direct40Run, 'result.json'),
	readJson(native15Run, 'result.json'),
	readJson(figuresRun, 'result.json'),
	readJson(previousModelRun, 'result.json'),
	findManifest(packageDirectory),
]);
const direct40Score = direct40.candidateAggregateRmseMilliwatt;
const native15Score = native15.candidateAggregateRmseMilliwatt;
const previousModelScore = previousModel.matrix.previousAlgorithm32.native15;
requireCondition(previousModelScore === MATCHED_NATIVE15_CEILING, 'Frozen previous-model Native15 score drifted.');
requireCondition(
	figures.parentRunId === direct40.runId && figures.figures?.length === 6,
	'PA6 does not have all six figures from the fresh Direct40 run.',
);

const [oracleBytes, seamBytes, indexBytes] = await Promise.all([
	readFile(path.join(packageDirectory, manifest.oraclePayload.path)),
	readFile(path.join(packageDirectory, manifest.exactSeamPayload.path)),
	readFile(path.join(packageDirectory, manifest.logicalToUniqueIndex.path)),
]);
const payloadHashes = {
	oracle: sha256(oracleBytes),
	exactSeam: sha256(seamBytes),
	logicalToUniqueIndex: sha256(indexBytes),
};
requireCondition(
	payloadHashes.oracle === EXPECTED_ORACLE_SHA256 &&
		payloadHashes.exactSeam === EXPECTED_SEAM_SHA256 &&
		payloadHashes.logicalToUniqueIndex === EXPECTED_INDEX_SHA256,
	'Production package differs from the sealed P9/P10 payload identities.',
);
const parity = exhaustiveSeamComparison(
	oracleBytes,
	seamBytes,
	indexBytes,
	oracleBytes.byteLength / (WAVELENGTH_COUNT * LOGICAL_DIRECTION_COUNT * 4),
);
const direct40Passed = direct40Score <= DIRECT40_CEILING;
const matchedNative15Passed = native15Score <= previousModelScore;
const accepted =
	direct40Passed && matchedNative15Passed && parity.mismatches === 0 && parity.probes.every((probe) => probe.exact);
const report = {
	schemaId: 'algorithm32-distant-sun-pa6-production-qualification-v1',
	accepted,
	b1: {
		direct40: {runId: direct40.runId, score: direct40Score, ceiling: DIRECT40_CEILING, passed: direct40Passed},
		matchedNative15: {
			runId: native15.runId,
			score: native15Score,
			previousModelRunId: previousModel.runId,
			ceiling: previousModelScore,
			margin: previousModelScore - native15Score,
			passed: matchedNative15Passed,
		},
		figures: {runId: figures.runId, count: figures.figures.length, artifacts: figures.figures},
	},
	productionPackage: {
		path: packageDirectory,
		cacheIdentity: manifest.cacheIdentity,
		payloadHashes,
		sealedControls: {
			oracleRunId: '000572-point-local-scene-cache-p9-w27-asset',
			exactSeamRunId: '000579-point-local-scene-cache-p10-seam-dedup',
		},
		parity,
	},
	derivation: {
		operation:
			'verify fresh frozen B1 gates and figures; compare every decoded production exact-seam scalar and 63 named probes with the production oracle',
		implementation: 'scripts/algorithm32/solar-zenith-cache/verify-pa6-production-qualification.js',
	},
};
await writeFile(
	path.join(outputDirectory, 'pa6-production-qualification.json'),
	`${JSON.stringify(report, null, 2)}\n`,
	{flag: 'wx'},
);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!accepted) process.exitCode = 2;
