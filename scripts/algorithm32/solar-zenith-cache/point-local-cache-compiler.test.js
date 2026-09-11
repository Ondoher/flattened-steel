import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import {DistantSunSceneCacheCompilerInputs} from './DistantSunSceneCacheCompilerInputs.js';
import DistantSunSharedCacheGenerator from './DistantSunSharedCacheGenerator.js';
import DistantSunPointLocalCacheInventory from './DistantSunPointLocalCacheInventory.js';
import DistantSunPointLocalCachePackage from './DistantSunPointLocalCachePackage.js';
import DistantSunPointLocalCacheReader from './DistantSunPointLocalCacheReader.js';
import DistantSunPointLocalCacheStaging from './DistantSunPointLocalCacheStaging.js';
import DistantSunSharedCacheGenerationFiles from './DistantSunSharedCacheGenerationFiles.js';
import {DistantSunPointLocalProfileCompilerInputs} from './DistantSunPointLocalProfileCompilerInputs.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const proofRoot = 'tmp/algorithm32/point-local-cache-compiler';

async function reference() {
	return JSON.parse(
		await readFile(path.join(repositoryRoot, 'experiments/point-local-cache-builder/bruneton-inputs.json'), 'utf8'),
	);
}

function smallInventory() {
	const directionBytes = Buffer.alloc(4 * Uint16Array.BYTES_PER_ELEMENT);
	[0, 1, 2, 0].forEach((value, index) => directionBytes.writeUInt16LE(value, index * 2));
	return {
		buildRequest: {transportSpec: {domains: {spectrum: {id: 'fixture'}}}},
		directionBytes,
		coordinates: [
			[0, 0],
			[0, 1],
		],
		blocks: [
			{
				tile: {altitudeIndex: 0, solarZenithIndex: 0},
				coordinates: [
					[0, 0],
					[0, 1],
				],
			},
		],
		scenes: [
			{
				ordinal: 0,
				request: {id: 'reverse', zenithDegrees: 1, observerAltitudeMeters: 0},
				ledger: {rows: []},
				keys: ['0:1', '0:0'],
				indexes: [1, 0],
			},
		],
		wavelengths: [2, 5],
		channelCount: 2,
		logicalDirectionCount: 4,
		uniqueDirectionCount: 3,
		maximumDecodedBlockBytes: 16 * 1024 * 1024,
		maximumEncodedBlockBytes: 17 * 1024 * 1024,
		unionLedger: {retainedBlockCount: 2, rows: []},
	};
}

function tile(channel) {
	const bytes = Buffer.alloc(2 * 4 * Float32Array.BYTES_PER_ELEMENT);
	for (let row = 0; row < 2; row += 1) {
		const values = [channel * 100 + row * 10, channel * 100 + row * 10 + 1, channel * 100 + row * 10 + 2];
		for (const [logical, unique] of [0, 1, 2, 0].entries()) {
			bytes.writeFloatLE(values[unique], (row * 4 + logical) * 4);
		}
	}
	return bytes;
}

test('projects Direct40 into the receiver-local Z180 compiler and plans the accepted 17-scene union', async () => {
	const control = await reference();
	const profiles = control.scenes.map((scene) =>
		createBrunetonProductionProfile({
			time: scene.time,
			fittedAzimuthDegrees: scene.fittedAzimuthDegrees,
			maximumScatteringOrder: 4,
		}),
	);
	const input = DistantSunPointLocalProfileCompilerInputs.createBatch(profiles, {
		ids: control.scenes.map((scene) => scene.id),
	});
	const inventory = new DistantSunPointLocalCacheInventory().create(
		input.buildRequest,
		input.scenes,
		input.wavelengths,
	);

	assert.equal(input.buildRequest.transportSpec.shaderProfile.coordinateContract, 'scene-cache-receiver-local-v1');
	assert.equal(input.buildRequest.transportSpec.domains.solarZenith.count, 180);
	assert.equal(input.buildRequest.transportSpec.domains.spectrum.channels.length, 40);
	assert.equal(input.buildRequest.transportSpec.source.directionToLight, undefined);
	for (const [index, scene] of input.scenes.entries()) {
		assert.ok(Math.abs(scene.zenithDegrees - control.scenes[index].zenithDegrees) < 1e-12);
	}
	assert.equal(inventory.scenes.length, 17);
	assert.equal(inventory.coordinates.length, 1951);
	assert.equal(inventory.blocks.length, 96);
	assert.equal(inventory.channelCount, 40);
	assert.ok(inventory.blocks.every((block) => block.coordinates.length * 40 * 4058 * 4 <= 16 * 1024 * 1024));

	const duplicates = Array.from({length: 257}, (_unused, index) => ({
		...input.scenes[index % input.scenes.length],
		id: `copy-${index}`,
	}));
	const duplicateInventory = new DistantSunPointLocalCacheInventory().create(input.buildRequest, duplicates, [0]);
	assert.equal(duplicateInventory.scenes.length, 257);
	assert.deepEqual(duplicateInventory.coordinates, inventory.coordinates);
});

test('preserves the fixed Native15 request and ledger identities', () => {
	const input = DistantSunSceneCacheCompilerInputs.createInputSet(
		DistantSunSceneCacheCompilerInputs.createQualifiedSanJoseNauticalScene(),
	);
	assert.equal(
		CanonicalValueHash.sha256Value(input.buildRequest),
		'sha256:364d05afddbe0fec61f8941fa25ae71b70835706102946f025689d29ff65bf04',
	);
	assert.equal(
		CanonicalValueHash.sha256Value(input.ledger.toRecord()),
		'sha256:b5e38741359b0e60ce6155a47941a000192c7aec1b6240d48bf3ab3bb032f671',
	);
});

test('stages variable dimensions and package expansion preserves exact Float32 bits', async () => {
	const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
	await files.directory(proofRoot);
	const runRoot = `${proofRoot}/test-${randomUUID()}`;
	await files.directory(runRoot);
	const inventory = smallInventory();
	const stagingRoot = `${runRoot}/staging`;
	const staging = new DistantSunPointLocalCacheStaging(inventory);
	await staging.allocate(files, stagingRoot);
	try {
		await assert.rejects(staging.accept(1, 0, tile(1)), /order or extent/u);
		await staging.accept(0, 0, tile(0));
		await staging.accept(1, 0, tile(1));
		assert.equal(staging.complete(), 2 * 2 * 3 * 4);
	} finally {
		await staging.close();
	}
	const packaged = await new DistantSunPointLocalCachePackage().write({
		files,
		root: `${runRoot}/package`,
		stagingRoot,
		inventory,
		implementation: {id: 'fixture-compiler', version: '1', sha256: '0'.repeat(64)},
		gpu: {
			accepted: true,
			elapsedMilliseconds: 1,
			wavelengths: [],
			userAgent: 'fixture',
			gpu: {api: 'fixture', renderer: 'fixture'},
			maximumReadbackBytes: 32,
			unionAccumulatorBytes: 64,
		},
		signal: new AbortController().signal,
	});
	const reader = new DistantSunPointLocalCacheReader();
	assert.equal(packaged.packet.layout.maximumEncodedBlockBytes, 17 * 1024 * 1024);
	await reader.prepareStaging(files, packaged.packet, stagingRoot);
	const directions = await reader.readDirectionMap(files, packaged.packet);
	const channel = await reader.readChannel(files, packaged.packet, 1);
	const expanded = reader.expand(files, packaged.packet, 0, channel, directions);
	assert.deepEqual([...expanded], [110, 111, 112, 110, 100, 101, 102, 100]);
	const unique = reader.expandUnique(files, packaged.packet, 0, channel);
	assert.deepEqual(
		[...new Float32Array(unique.buffer, unique.byteOffset, unique.length / 4)],
		[110, 111, 112, 100, 101, 102],
	);

	const corrupt = structuredClone(packaged.packet);
	corrupt.scenes[0].indexes[0] = 0;
	const {packageIdentity: _discarded, ...record} = corrupt;
	corrupt.packageIdentity = `sha256:${files.hash(JSON.stringify(record))}`;
	assert.throws(() => reader.expand(files, corrupt, 0, channel, directions), /reconstruction index/u);
	assert.throws(() => reader.expandUnique(files, corrupt, 0, channel), /reconstruction index/u);

	const unbounded = structuredClone(packaged.packet);
	unbounded.layout.maximumDecodedBlockBytes = Number.MAX_SAFE_INTEGER;
	const {packageIdentity: _unboundedIdentity, ...unboundedRecord} = unbounded;
	unbounded.packageIdentity = `sha256:${files.hash(JSON.stringify(unboundedRecord))}`;
	assert.throws(() => reader.expand(files, unbounded, 0, channel, directions), /dimensions are inconsistent/u);

	const oversizedEncoded = structuredClone(packaged.packet);
	oversizedEncoded.layout.maximumEncodedBlockBytes = Number.MAX_SAFE_INTEGER;
	const {packageIdentity: _encodedIdentity, ...encodedRecord} = oversizedEncoded;
	oversizedEncoded.packageIdentity = `sha256:${files.hash(JSON.stringify(encodedRecord))}`;
	assert.throws(() => reader.expand(files, oversizedEncoded, 0, channel, directions), /dimensions are inconsistent/u);
});

test('terminalizes package-directory setup failure inside a new compiler run', async () => {
	const runRoot = `${proofRoot}/test-${randomUUID()}`;
	const originalDirectory = DistantSunSharedCacheGenerationFiles.prototype.directory;
	DistantSunSharedCacheGenerationFiles.prototype.directory = function (relativePath) {
		if (relativePath === `${runRoot}/package`) throw new Error('fixture package setup failure');
		return originalDirectory.call(this, relativePath);
	};
	try {
		const compiler = new DistantSunSharedCacheGenerator({chromePath: path.join(repositoryRoot, 'chrome.exe')});
		await assert.rejects(
			compiler.compile({
				outputDirectory: runRoot,
				buildRequest: {},
				scenes: [],
				wavelengths: [],
				signal: new AbortController().signal,
			}),
			/fixture package setup failure/u,
		);
	} finally {
		DistantSunSharedCacheGenerationFiles.prototype.directory = originalDirectory;
	}
	const failure = JSON.parse(await readFile(path.join(repositoryRoot, runRoot, 'failure.json'), 'utf8'));
	assert.equal(failure.accepted, false);
});

test('rejects unsupported coordinate contracts and selections before GPU execution', async () => {
	const control = await reference();
	const profile = createBrunetonProductionProfile({
		time: control.scenes[0].time,
		fittedAzimuthDegrees: control.scenes[0].fittedAzimuthDegrees,
		maximumScatteringOrder: 4,
	});
	const input = DistantSunPointLocalProfileCompilerInputs.createInputSet(profile);
	const scene = DistantSunPointLocalProfileCompilerInputs.createScene(profile);
	assert.throws(
		() =>
			new DistantSunPointLocalCacheInventory().create(
				{
					...input.buildRequest,
					transportSpec: {
						...input.buildRequest.transportSpec,
						shaderProfile: {coordinateContract: 'production-source-aligned-v1'},
					},
				},
				[scene],
				[0],
			),
		/receiver-local/u,
	);
	assert.throws(
		() => new DistantSunPointLocalCacheInventory().create(input.buildRequest, [scene], [0, 0]),
		/unique in-range/u,
	);
	const compiler = new DistantSunSharedCacheGenerator({chromePath: path.join(repositoryRoot, 'chrome.exe')});
	const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
	await assert.rejects(compiler._createRun(files, 'src/generated-cache'), /must be below/u);
	await assert.rejects(compiler._createRun(files, proofRoot), /must be below/u);
});
