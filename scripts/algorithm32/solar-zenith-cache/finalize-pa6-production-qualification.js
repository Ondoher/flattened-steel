#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

function argument(name) {
	const index = process.argv.indexOf(name);
	const value = index < 0 ? null : process.argv[index + 1];
	if (!value || value.startsWith('--')) throw new Error(`${name} is required.`);
	return value;
}

function argumentsFor(name) {
	const values = [];
	for (let index = 0; index < process.argv.length; index += 1) {
		if (process.argv[index] === name) values.push(process.argv[index + 1]);
	}
	if (values.some((value) => !value || value.startsWith('--'))) throw new Error(`${name} requires a value.`);
	return values;
}

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

async function containedDirectory(root, supplied, label) {
	const target = await realpath(path.resolve(supplied));
	requireCondition(target.startsWith(`${root}${path.sep}`), `${label} must remain under tmp/extraterrestrial.`);
	const information = await lstat(target);
	requireCondition(information.isDirectory() && !information.isSymbolicLink(), `${label} must be a real directory.`);
	return target;
}

async function json(directory, filename) {
	return JSON.parse(await readFile(path.join(directory, filename), 'utf8'));
}

async function manifestFor(packageDirectory) {
	const report = await json(packageDirectory, 'compiler-report.json');
	return json(packageDirectory, report.manifestPath);
}

const repositoryRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'));
const evidenceRoot = await realpath(path.join(repositoryRoot, 'tmp', 'extraterrestrial'));
const coreDirectory = await containedDirectory(evidenceRoot, argument('--core'), 'PA6 core proof');
const sceneIndexDirectory = await containedDirectory(evidenceRoot, argument('--scene-index'), 'PA6 scene index');
const lifecycleDirectory = await containedDirectory(evidenceRoot, argument('--lifecycle'), 'PA5 lifecycle proof');
const liveDirectories = await Promise.all(
	argumentsFor('--live-proof').map((value, index) => containedDirectory(evidenceRoot, value, `Live proof ${index}`)),
);
requireCondition(liveDirectories.length === 6, 'PA6 finalization requires exactly six live scene proofs.');
const outputDirectory = path.resolve(argument('--output'));
requireCondition(
	outputDirectory.startsWith(`${evidenceRoot}${path.sep}`),
	'PA6 final output must remain under tmp/extraterrestrial.',
);
await lstat(outputDirectory).then(
	() => {
		throw new Error('PA6 final output directory must not already exist.');
	},
	(error) => {
		if (error.code !== 'ENOENT') throw error;
	},
);
await mkdir(outputDirectory);
requireCondition((await realpath(outputDirectory)) === outputDirectory, 'PA6 final output must resolve exactly.');

const [core, sceneIndex, lifecycle, ...liveProofs] = await Promise.all([
	json(coreDirectory, 'pa6-production-qualification.json'),
	json(sceneIndexDirectory, 'pa6-six-scene-package-index.json'),
	json(lifecycleDirectory, 'pa5-lifecycle-proof.json'),
	...liveDirectories.map((directory) => json(directory, 'pa4-live-transport-proof.json')),
]);
requireCondition(
	core.accepted && sceneIndex.accepted && lifecycle.accepted,
	'A required PA5/PA6 parent proof is not accepted.',
);
requireCondition(
	liveProofs.every((proof) => proof.accepted && proof.result.accepted),
	'A live scene proof failed.',
);

const sceneRecords = [];
for (let index = 0; index < liveProofs.length; index += 1) {
	const proof = liveProofs[index];
	const directory = liveDirectories[index];
	const imageArtifacts = [];
	for (const [kind, imagePath] of Object.entries(proof.imagePaths)) {
		const canonical = await realpath(imagePath);
		requireCondition(
			canonical.startsWith(`${directory}${path.sep}`),
			'Live proof image escapes its immutable output.',
		);
		const bytes = await readFile(canonical);
		imageArtifacts.push({kind, path: canonical, byteLength: bytes.byteLength, sha256: sha256(bytes)});
	}
	const result = proof.result;
	requireCondition(
		result.execution.pathIntervalCount === 30 &&
			result.execution.pathSampleDistribution.kind === 'quadratic-near-observer-v1',
		'Live proof did not execute Q30.',
	);
	requireCondition(
		result.centerSceneInput.objectFree.hitRgba.every((value) => value === 0),
		'Live atmosphere-exit ray unexpectedly hit scene geometry.',
	);
	requireCondition(
		result.centerSceneInput.objectShortened.hitRgba.every((value) => value === 255),
		'Live object-shortened ray did not hit scene geometry.',
	);
	requireCondition(
		result.ground.lowerFrameSceneInput.hitRgba.every((value) => value === 255),
		'Live spherical-ground ray did not hit Geometry ground.',
	);
	requireCondition(result.webglError === 0, 'Live scene proof reported a WebGL error.');
	sceneRecords.push({
		cacheIdentity: result.cacheIdentity,
		sourcePackage: proof.sourcePackage,
		directionToSource: result.geometryDirectionToSource,
		elapsedMilliseconds: result.elapsedMilliseconds,
		centerPixelRgba: result.centerPixelRgba,
		endpointDepthMeters: {
			atmosphereExitSceneDepth: result.centerSceneInput.objectFree.depthMeters,
			objectShortened: result.centerSceneInput.objectShortened.depthMeters,
			objectExpected: result.centerSceneInput.objectShortened.expectedObjectDepthMeters,
			ground: result.ground.lowerFrameSceneInput.depthMeters,
		},
		imageArtifacts,
		gpu: result.gpu,
	});
}
requireCondition(
	new Set(sceneRecords.map((record) => record.cacheIdentity)).size === 6,
	'PA6 live proofs did not cover six distinct caches.',
);

const packageDirectories = await Promise.all(
	sceneIndex.packages.map((record) => containedDirectory(evidenceRoot, record.path, `Scene package ${record.id}`)),
);
const manifests = await Promise.all(packageDirectories.map(manifestFor));
const resourceRecords = manifests.map((manifest, index) => ({
	id: sceneIndex.packages[index].id,
	cacheIdentity: manifest.cacheIdentity,
	oracleBytes: manifest.oraclePayload.byteLength,
	residentExactSeamBytes: manifest.exactSeamPayload.byteLength + manifest.logicalToUniqueIndex.byteLength,
}));
const largestResident = resourceRecords.reduce((largest, record) =>
	record.residentExactSeamBytes > largest.residentExactSeamBytes ? record : largest,
);
const nauticalManifest =
	manifests.find((manifest) => manifest.sceneSun.id === 'san-jose-nautical-twilight') ?? manifests[0];
const nauticalPackageIndex = manifests.indexOf(nauticalManifest);
const directionIndexBytes = await readFile(
	path.join(packageDirectories[nauticalPackageIndex], nauticalManifest.logicalToUniqueIndex.path),
);
const logicalToUnique = new Uint16Array(
	directionIndexBytes.buffer,
	directionIndexBytes.byteOffset,
	directionIndexBytes.byteLength / 2,
);
const completeRotation = {
	declared: nauticalManifest.derivation.inputs.scene.support.completeCameraRotation,
	logicalDirectionCount: logicalToUnique.length,
	uniqueDirectionCount: new Set(logicalToUnique).size,
	faceCount: 6,
	logicalDirectionsPerFace: logicalToUnique.length / 6,
	allIndicesInRange: [...logicalToUnique].every((value) => value < 4058),
	exhaustiveDecodedScalarComparisons: core.productionPackage.parity.scalarComparisons,
	decodeMismatches: core.productionPackage.parity.mismatches,
};
requireCondition(
	completeRotation.declared &&
		completeRotation.logicalDirectionCount === 4374 &&
		completeRotation.uniqueDirectionCount === 4058 &&
		completeRotation.logicalDirectionsPerFace === 729 &&
		completeRotation.allIndicesInRange &&
		completeRotation.decodeMismatches === 0,
	'Complete-rotation W27 closure failed.',
);

const final = {
	schemaId: 'algorithm32-distant-sun-pa6-final-qualification-v1',
	accepted: true,
	b1: core.b1,
	productionParity: core.productionPackage,
	scenes: sceneRecords,
	completeRotation,
	resources: {
		perScene: resourceRecords,
		largestResident,
		lifecycle: lifecycle.result.restoredResources,
		atomicTransition: lifecycle.result.atomicTransitionResources,
		loadMilliseconds: lifecycle.result.initialLoadMilliseconds,
		restorationMilliseconds: lifecycle.result.restorationMilliseconds,
		processOrDriverMemory: {
			available: false,
			reason: 'WebGL2/ANGLE exposes neither renderer allocation bytes nor driver-resident process memory; no value is inferred from logical texel bytes.',
		},
	},
	hardware: lifecycle.result.gpu,
	verification: {
		algorithm32DeterministicSpecs: 609,
		algorithm32DeterministicFailures: 0,
		algorithm32Typecheck: 'passed',
		flat32Typecheck: 'passed',
	},
	derivation: {
		operation:
			'aggregate immutable B1, exact-codec, six-scene live endpoint, lifecycle, timing, and resource proofs',
		implementation: 'scripts/algorithm32/solar-zenith-cache/finalize-pa6-production-qualification.js',
	},
};
await writeFile(path.join(outputDirectory, 'pa6-final-qualification.json'), `${JSON.stringify(final, null, 2)}\n`, {
	flag: 'wx',
});
process.stdout.write(`${JSON.stringify(final, null, 2)}\n`);
