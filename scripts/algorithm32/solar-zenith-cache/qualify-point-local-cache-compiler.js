import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import DistantSunPointLocalCacheInventory from './DistantSunPointLocalCacheInventory.js';
import DistantSunPointLocalCacheReader from './DistantSunPointLocalCacheReader.js';
import DistantSunSharedCacheGenerationFiles from './DistantSunSharedCacheGenerationFiles.js';
import {DistantSunPointLocalProfileCompilerInputs} from './DistantSunPointLocalProfileCompilerInputs.js';
import {DISTANT_SUN_POINT_LOCAL_CACHE_SCHEMA_ID} from './DistantSunPointLocalCachePackage.js';
import {DISTANT_SUN_POINT_LOCAL_CACHE_COMPILER_IDENTITY} from './consts.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
const sourceRoot = 'tmp/experiments/point-local-cache-builder/00003-bruneton';
const verifierSealPath = 'tmp/experiments/point-local-cache-builder/00011-verify/sealed.json';
const verifierSealIdentity = Object.freeze({
	path: verifierSealPath,
	byteLength: 74180,
	sha256: '8768021c5d4cfa5878e604893ae10839ee4e101c0e57347936164c0f03746479',
});
const qualificationRoot = `tmp/algorithm32/point-local-cache-compiler/qualification-${new Date()
	.toISOString()
	.replace(/[:.]/gu, '-')}-${randomUUID()}`;

function json(bytes) {
	return JSON.parse(bytes.toString('utf8'));
}

function normalized(value) {
	return JSON.parse(JSON.stringify(value));
}

function shaderValues(value) {
	if (typeof value === 'number') return Math.fround(value);
	if (Array.isArray(value)) return value.map(shaderValues);
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shaderValues(item)]));
	}
	return value;
}

function calculationInputs(spec) {
	return shaderValues(
		normalized({
			coordinateContract: spec.shaderProfile.coordinateContract,
			sourceIrradianceDensity: spec.source.spectralIrradianceDensity,
			planet: {
				bottomRadiusMeters: spec.planet.bottomRadiusMeters,
				topRadiusMeters: spec.planet.topRadiusMeters,
			},
			atmosphere: {
				rayleighScaleHeightMeters: spec.atmosphere.rayleighScaleHeightMeters,
				mieScaleHeightMeters: spec.atmosphere.mieScaleHeightMeters,
				mieAngstromAlpha: spec.atmosphere.mieAngstromAlpha,
				mieAngstromBeta: spec.atmosphere.mieAngstromBeta,
				mieSingleScatteringAlbedo: spec.atmosphere.mieSingleScatteringAlbedo,
				miePhaseFunctionG: spec.atmosphere.miePhaseFunctionG,
				ozone: {
					absorptionEnabled: spec.atmosphere.ozone.absorptionEnabled,
					maximumDensityPerCubicMeter: spec.atmosphere.ozone.maximumDensityPerCubicMeter,
					crossSectionTable: spec.atmosphere.ozone.crossSectionTable,
				},
			},
			numerical: spec.numerical,
			domains: {
				position: spec.domains.position.nodes,
				solarZenith: spec.domains.solarZenith.nodes,
				incoming: {
					directionCount: spec.domains.incoming.directionCount,
					unitVectors: spec.domains.incoming.unitVectors,
					integrationWeightsSteradians: spec.domains.incoming.integrationWeightsSteradians,
				},
				outgoing: {
					faceWidth: spec.domains.outgoing.faceWidth,
					directionCount: spec.domains.outgoing.directionCount,
					unitVectors: spec.domains.outgoing.unitVectors,
				},
				spectrum: spec.domains.spectrum.channels.map((channel) => ({
					centerNanometers: channel.centerNanometers,
					binWidthNanometers: channel.binWidthNanometers,
					sourceIrradianceDensityWattsPerSquareMeterPerNanometer:
						channel.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,
					rayleighScatteringPerMeter: channel.rayleighScatteringPerMeter,
					mieExtinctionPerMeter: channel.mieExtinctionPerMeter,
					groundAlbedo: channel.groundAlbedo,
				})),
			},
		}),
	);
}

await files.directory('tmp/algorithm32/point-local-cache-compiler');
await files.directory(qualificationRoot);
const verifierSealBytes = await files.read(verifierSealPath, verifierSealIdentity);
const verifierSeal = json(verifierSealBytes);
assert.equal(verifierSeal.state, 'accepted');
const sourceSealIdentity = verifierSeal.parents.find((parent) => parent.path === `${sourceRoot}/sealed.json`);
const sourceCacheIdentity = verifierSeal.parents.find((parent) => parent.path === `${sourceRoot}/cache.json`);
assert.ok(sourceSealIdentity && sourceCacheIdentity);
const sourceSeal = json(await files.read(sourceSealIdentity.path, sourceSealIdentity));
const sourceCache = json(await files.read(sourceCacheIdentity.path, sourceCacheIdentity));
assert.equal(sourceSeal.state, 'failed');
assert.equal(sourceCache.schemaId, 'point-local-builder-cache-v1');
const sourceInputIdentity = verifierSeal.parents.find((parent) => parent.path === `${sourceRoot}/input.json`);
const sourceGpuIdentity = verifierSeal.parents.find((parent) => parent.path === `${sourceRoot}/gpu.json`);
const gpuCompilerIdentity = sourceSeal.parents.find(
	(parent) => parent.path === 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js',
);
assert.ok(sourceInputIdentity && sourceGpuIdentity && gpuCompilerIdentity);
const sourceInput = json(await files.read(sourceInputIdentity.path, sourceInputIdentity));
const currentGpuCompiler = await files.read(gpuCompilerIdentity.path);
assert.equal(files.hash(currentGpuCompiler), gpuCompilerIdentity.sha256);

const profiles = sourceInput.scenes.map((scene) =>
	createBrunetonProductionProfile({
		time: scene.time,
		fittedAzimuthDegrees: scene.fittedAzimuthDegrees,
		maximumScatteringOrder: 4,
	}),
);
const productionInput = DistantSunPointLocalProfileCompilerInputs.createBatch(profiles, {
	ids: sourceInput.scenes.map((scene) => scene.id),
});
assert.deepEqual(
	calculationInputs(productionInput.buildRequest.transportSpec),
	calculationInputs(sourceInput.buildRequest.transportSpec),
);
const inventory = new DistantSunPointLocalCacheInventory().create(
	productionInput.buildRequest,
	productionInput.scenes,
	sourceInput.wavelengths,
);
assert.deepEqual(inventory.coordinates, sourceCache.coordinates);
assert.deepEqual(
	inventory.blocks.map((block) => block.coordinates),
	sourceCache.blocks.map((block) => block.coordinates),
);
assert.deepEqual(
	inventory.scenes.map((scene) => ({keys: scene.keys, indexes: scene.indexes})),
	sourceCache.scenes.map((scene) => ({keys: scene.keys, indexes: scene.indexes})),
);

const record = {
	schemaId: DISTANT_SUN_POINT_LOCAL_CACHE_SCHEMA_ID,
	compilerIdentity: DISTANT_SUN_POINT_LOCAL_CACHE_COMPILER_IDENTITY,
	implementation: {
		id: DISTANT_SUN_POINT_LOCAL_CACHE_COMPILER_IDENTITY,
		version: '2.0.0',
		sha256: files.hash(currentGpuCompiler),
	},
	buildRequest: productionInput.buildRequest,
	physicalQuantity: {
		name: 'cumulative spectral scattering density through J4',
		units: 'W m^-3 sr^-1 nm^-1',
		spectralBasisId: productionInput.buildRequest.transportSpec.domains.spectrum.id,
	},
	layout: {
		id: 'point-local-block-wavelength-coordinate-unique-direction-f32le-v1',
		channelCount: inventory.channelCount,
		wavelengthIndexes: inventory.wavelengths,
		logicalDirectionCount: inventory.logicalDirectionCount,
		uniqueDirectionCount: inventory.uniqueDirectionCount,
		coordinateCount: inventory.coordinates.length,
		maximumDecodedBlockBytes: inventory.maximumDecodedBlockBytes,
		maximumEncodedBlockBytes: inventory.maximumEncodedBlockBytes,
	},
	coordinates: inventory.coordinates,
	scenes: inventory.scenes,
	blocks: sourceCache.blocks.map((block, ordinal) => ({
		ordinal,
		tile: inventory.blocks[ordinal].tile,
		coordinates: block.coordinates,
		decoded: {byteLength: block.decodedBytes, sha256: block.decodedSha256},
		encoded: block.artifact,
		codec: 'float32-byte-lane-v1+zstandard-level-6',
	})),
	directionMap: sourceCache.directionMap,
	gpu: json(await files.read(sourceGpuIdentity.path, sourceGpuIdentity)),
	derivation: {
		operation: 'authenticated reuse of the unchanged production GPU compiler output for production promotion',
		parents: [
			verifierSealIdentity,
			sourceSealIdentity,
			sourceCacheIdentity,
			sourceGpuIdentity,
			gpuCompilerIdentity,
		],
	},
};
const packet = {...record, packageIdentity: `sha256:${files.hash(JSON.stringify(record))}`};
const reader = new DistantSunPointLocalCacheReader();
await reader.prepareStaging(files, packet, `${sourceRoot}/staging`);
const directions = await reader.readDirectionMap(files, packet);
let comparedExpansionBits = 0;
for (const channelIndex of [0, 19, 39]) {
	const channel = await reader.readChannel(files, packet, channelIndex);
	for (const [sceneIndex, scene] of packet.scenes.entries()) {
		const expanded = reader.expand(files, packet, sceneIndex, channel, directions);
		const words = new Uint32Array(expanded.buffer);
		for (const [row, coordinateIndex] of scene.indexes.entries()) {
			for (const logicalIndex of [0, 1, 4057, 4058, 4373]) {
				const uniqueIndex = directions.readUInt16LE(logicalIndex * Uint16Array.BYTES_PER_ELEMENT);
				assert.equal(
					words[row * packet.layout.logicalDirectionCount + logicalIndex],
					channel.readUInt32LE((coordinateIndex * packet.layout.uniqueDirectionCount + uniqueIndex) * 4),
				);
				comparedExpansionBits += 1;
			}
		}
	}
}
const report = {
	accepted: true,
	qualificationRoot,
	productionCompilerIdentity: DISTANT_SUN_POINT_LOCAL_CACHE_COMPILER_IDENTITY,
	productionProfileCompilerIdentity: productionInput.compilerIdentity,
	unchangedGpuCompilerSha256: gpuCompilerIdentity.sha256,
	sourceVerifierSeal: verifierSealIdentity,
	sourceCache: sourceCacheIdentity,
	sceneCount: inventory.scenes.length,
	channelCount: inventory.channelCount,
	coordinateCount: inventory.coordinates.length,
	blockCount: inventory.blocks.length,
	authenticatedDecodedBlocks: packet.blocks.length,
	selectedExpansionChannels: [0, 19, 39],
	comparedExpansionBits,
	packageIdentity: packet.packageIdentity,
	calculationReuseReason:
		'the GPU compiler bytes and every effective numerical compiler input match the accepted parent; every decoded staging block was authenticated, so recalculation would duplicate unchanged work',
};
const qualification = await files.write(
	`${qualificationRoot}/qualification.json`,
	Buffer.from(`${JSON.stringify(report)}\n`),
);
const seal = {
	schemaId: 'algorithm32-point-local-compiler-qualification-seal-v1',
	state: 'accepted',
	qualification,
	parents: [verifierSealIdentity, sourceSealIdentity, sourceCacheIdentity, sourceInputIdentity, sourceGpuIdentity],
};
const sealed = await files.write(`${qualificationRoot}/sealed.json`, Buffer.from(`${JSON.stringify(seal)}\n`));
process.stdout.write(`${JSON.stringify({...report, seal: sealed}, null, 2)}\n`);
