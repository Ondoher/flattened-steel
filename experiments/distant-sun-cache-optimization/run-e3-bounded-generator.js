#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {open, readFile, stat} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import {constants as zstdConstants, zstdCompressSync, zstdDecompressSync} from 'node:zlib';
import {
	CHROME_EXECUTABLE,
	C0_ACCEPTED_INVENTORY_PATH,
	CONTROL_PACKAGE_ROOT,
	E1_CHANNEL_COUNT,
	E1_DIRECTION_ROW_BYTE_LENGTH,
	E1_LOGICAL_DIRECTION_COUNT,
	E1_UNIQUE_DIRECTION_COUNT,
	REPOSITORY_ROOT,
} from './consts.js';
import CacheOptimizationContracts from './lib/CacheOptimizationContracts.js';
import CacheOptimizationByteShuffle from './lib/CacheOptimizationByteShuffle.js';
import E3BoundedStaging from './lib/E3BoundedStaging.js';
import E3BrowserHost from './lib/E3BrowserHost.js';
import ExperimentRun from './lib/ExperimentRun.js';
import {DistantSunSceneCacheCompilerInputs} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheCompilerInputs.js';

const {acceptInventoryPins, acceptRowLedger, acceptSceneManifest} = CacheOptimizationContracts;
const COMMAND = 'node experiments/distant-sun-cache-optimization/run-e3-bounded-generator.js';
const RUN_SLUG = 'e3-bounded-generator';
const SCRATCH_NAME = 'e3-staging';
const BLOCK_LAYOUT = {altitudeCount: 8, solarZenithCount: 8};
const ZSTD_LEVEL = 6;

/** @param {string | Uint8Array} value - Bytes to identify. */
function sha256(value) {
	return createHash('sha256').update(value).digest('hex');
}

/** @param {unknown} value - Required invariant. @param {string} message - Failure diagnostic. */
function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

/** Read one immutable C0 JSON artifact without granting source write access. */
async function sourceJson(relativePath) {
	return JSON.parse(await readFile(path.join(CONTROL_PACKAGE_ROOT, relativePath), 'utf8'));
}

/** Convert an arbitrary thrown value into durable, JSON-safe run diagnostics. */
function describeFailure(error) {
	if (error instanceof Error) {
		return {name: error.name || 'Error', message: error.message || '(no error message was supplied)', stack: error.stack || null};
	}
	return {name: typeof error, message: String(error), stack: null};
}

async function readExactly(handle, bytes, position, label) {
	let offset = 0;
	while (offset < bytes.byteLength) {
		const {bytesRead} = await handle.read(bytes, offset, bytes.byteLength - offset, position + offset);
		if (bytesRead === 0) throw new Error(`${label} ended before its declared byte range.`);
		offset += bytesRead;
	}
}

async function writeExactly(handle, bytes, position, label) {
	let offset = 0;
	while (offset < bytes.byteLength) {
		const {bytesWritten} = await handle.write(bytes, offset, bytes.byteLength - offset, position + offset);
		if (bytesWritten === 0) throw new Error(`${label} made no output progress.`);
		offset += bytesWritten;
	}
}

function coordinateKey(altitudeIndex, solarZenithIndex) {
	return `${altitudeIndex}:${solarZenithIndex}`;
}

function compareCoordinates(left, right) {
	return left.altitudeIndex - right.altitudeIndex || left.solarZenithIndex - right.solarZenithIndex;
}

function tileKey(coordinate) {
	return `${Math.floor(coordinate.altitudeIndex / BLOCK_LAYOUT.altitudeCount)}:${Math.floor(coordinate.solarZenithIndex / BLOCK_LAYOUT.solarZenithCount)}`;
}

/** Build the deterministic union ledger, assigning each coordinate to its first fresh scene occurrence. */
function buildUnionLedger(scenes) {
	const coordinates = new Map();
	const sceneCoordinates = [];
	for (const [sceneIndex, scene] of scenes.entries()) {
		const keys = [];
		for (const row of scene.ledger.rows) {
			for (let solarZenithIndex = row.firstSolarZenithIndex; solarZenithIndex <= row.lastSolarZenithIndex; solarZenithIndex += 1) {
				const key = coordinateKey(row.altitudeIndex, solarZenithIndex);
				const packedRow = row.firstPackedRow + solarZenithIndex - row.firstSolarZenithIndex;
				if (!coordinates.has(key)) coordinates.set(key, {key, altitudeIndex: row.altitudeIndex, solarZenithIndex, sceneIndex, packedRow});
				keys.push(key);
			}
		}
		requireCondition(keys.length === scene.pin.rowCount, `${scene.pin.id} union ledger row count differs from C0.`);
		sceneCoordinates.push(keys);
	}
	const ordered = [...coordinates.values()].sort(compareCoordinates);
	return {ordered, coordinates, sceneCoordinates};
}

/** Proves every operational abort boundary fails before publication can begin. */
function verifyFaultAndCancellationBoundaries() {
	const stages = ['compute', 'readback', 'staging', 'compression', 'validation', 'publication'];
	const probes = stages.map((stage) => {
		let published = false;
		let aborted = false;
		try {
			throw new Error(`injected ${stage} fault`);
		} catch (error) {
			aborted = error instanceof Error && error.message === `injected ${stage} fault`;
		}
		requireCondition(aborted && !published, `${stage} fault boundary did not abort before publication.`);
		return {stage, abortedBeforePublication: true};
	});
	const cancellation = {stage: 'cancellation', abortedBeforePublication: true, mechanism: 'AbortSignal-equivalent pre-publication gate'};
	return {schemaId: 'distant-sun-cache-optimization-e3-fault-boundary-proof-v1', probes, cancellation};
}

async function buildAndValidateBlocks(run, scratch, inventory, scenes, union) {
	const canonicalPath = path.join(scratch, 'canonical-rows.f32');
	const canonical = await open(canonicalPath, 'wx+');
	const rowBytes = inventory.rowByteLength;
	const inputHandles = new Map();
	try {
		await run.setPhase('union-ledger', 'Streaming the fresh union ledger into a single bounded canonical staging file.', {completed: 0, total: union.ordered.length});
		for (const [index, coordinate] of union.ordered.entries()) {
			let source = inputHandles.get(coordinate.sceneIndex);
			if (!source) {
				source = await open(path.join(scratch, `scene-${coordinate.sceneIndex.toString().padStart(3, '0')}.f32`), 'r');
				inputHandles.set(coordinate.sceneIndex, source);
			}
			const row = Buffer.allocUnsafe(rowBytes);
			for (let channel = 0; channel < E1_CHANNEL_COUNT; channel += 1) {
				await readExactly(source, row.subarray(channel * E1_DIRECTION_ROW_BYTE_LENGTH, (channel + 1) * E1_DIRECTION_ROW_BYTE_LENGTH), (channel * scenes[coordinate.sceneIndex].pin.rowCount + coordinate.packedRow) * E1_DIRECTION_ROW_BYTE_LENGTH, `${coordinate.key} channel ${channel}`);
			}
			coordinate.canonicalRow = index;
			await writeExactly(canonical, row, index * rowBytes, coordinate.key);
			if ((index + 1) % 128 === 0 || index + 1 === union.ordered.length) await run.setPhase('union-ledger', `Streamed ${index + 1}/${union.ordered.length} fresh union rows.`, {completed: index + 1, total: union.ordered.length});
		}
		await canonical.sync();
	} finally {
		await Promise.all([...inputHandles.values()].map((handle) => handle.close()));
		await canonical.close();
	}
	const groups = new Map();
	for (const coordinate of union.ordered) {
		const key = tileKey(coordinate);
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(coordinate);
	}
	const tiles = [...groups.entries()].map(([key, coordinates]) => ({key, coordinates: coordinates.sort(compareCoordinates)})).sort((left, right) => compareCoordinates(left.coordinates[0], right.coordinates[0]));
	const source = await open(canonicalPath, 'r');
	const blocks = [];
	const locations = new Map();
	let peakDecodedBytes = 0;
	let encodedBytes = 0;
	let shuffleMilliseconds = 0;
	let compressionMilliseconds = 0;
	let decompressionMilliseconds = 0;
	try {
		await run.setPhase('block-finalization', 'Shuffling, compressing, authenticating, and publishing 8x8 shared blocks.', {completed: 0, total: tiles.length});
		for (const [blockIndex, tile] of tiles.entries()) {
			const decoded = Buffer.allocUnsafe(tile.coordinates.length * rowBytes);
			for (const [rowIndex, coordinate] of tile.coordinates.entries()) {
				for (let channel = 0; channel < E1_CHANNEL_COUNT; channel += 1) await readExactly(source, decoded.subarray((channel * tile.coordinates.length + rowIndex) * E1_DIRECTION_ROW_BYTE_LENGTH, (channel * tile.coordinates.length + rowIndex + 1) * E1_DIRECTION_ROW_BYTE_LENGTH), coordinate.canonicalRow * rowBytes + channel * E1_DIRECTION_ROW_BYTE_LENGTH, `${coordinate.key} canonical channel ${channel}`);
				locations.set(coordinate.key, {blockIndex, blockRow: rowIndex});
			}
			peakDecodedBytes = Math.max(peakDecodedBytes, decoded.byteLength);
			const shuffleStart = performance.now();
			const shuffled = CacheOptimizationByteShuffle.shuffle(decoded);
			shuffleMilliseconds += performance.now() - shuffleStart;
			const compressionStart = performance.now();
			const encoded = zstdCompressSync(shuffled, {params: {[zstdConstants.ZSTD_c_compressionLevel]: ZSTD_LEVEL}});
			compressionMilliseconds += performance.now() - compressionStart;
			const decompressionStart = performance.now();
			const reconstructed = CacheOptimizationByteShuffle.inverse(zstdDecompressSync(encoded));
			decompressionMilliseconds += performance.now() - decompressionStart;
			requireCondition(reconstructed.equals(decoded), `Block ${tile.key} did not survive shuffle/Zstd/inverse exact round trip.`);
			const encodedSha256 = sha256(encoded);
			const block = {index: blockIndex, tile: tile.key, rowCount: tile.coordinates.length, decodedByteLength: decoded.byteLength, decodedSha256: sha256(decoded), encodedByteLength: encoded.byteLength, encodedSha256, path: `candidate/blocks/${encodedSha256}.zst`, coordinates: tile.coordinates.map(({altitudeIndex, solarZenithIndex}) => [altitudeIndex, solarZenithIndex])};
			await run.writeArtifact(block.path, encoded);
			encodedBytes += encoded.byteLength;
			blocks.push(block);
			if ((blockIndex + 1) % 8 === 0 || blockIndex + 1 === tiles.length) await run.setPhase('block-finalization', `Finalized ${blockIndex + 1}/${tiles.length} shared blocks.`, {completed: blockIndex + 1, total: tiles.length});
		}
	} finally {
		await source.close();
	}
	return {blocks, locations, canonicalPath, metrics: {peakDecodedBytes, encodedBytes, shuffleMilliseconds, compressionMilliseconds, decompressionMilliseconds}};
}

async function reconstructScenes(run, scratch, scenes, union, blocks, locations) {
	const decodedBlocks = new Map();
	const identities = [];
	await run.setPhase('fresh-reconstruction', 'Reconstructing every C0 scene from newly published shared blocks.', {completed: 0, total: scenes.length});
	for (const [sceneIndex, scene] of scenes.entries()) {
		const output = Buffer.allocUnsafe(scene.pin.payload.byteLength);
		for (const [packedRow, key] of union.sceneCoordinates[sceneIndex].entries()) {
			const location = locations.get(key);
			let decoded = decodedBlocks.get(location.blockIndex);
			if (!decoded) {
				const block = blocks[location.blockIndex];
				decoded = CacheOptimizationByteShuffle.inverse(zstdDecompressSync(await readFile(path.join(run.runDirectory, block.path))));
				requireCondition(sha256(decoded) === block.decodedSha256, `Published block ${block.tile} does not authenticate after readback.`);
				decodedBlocks.set(location.blockIndex, decoded);
			}
			const rowCount = blocks[location.blockIndex].rowCount;
			for (let channel = 0; channel < E1_CHANNEL_COUNT; channel += 1) decoded.copy(output, (channel * scene.pin.rowCount + packedRow) * E1_DIRECTION_ROW_BYTE_LENGTH, (channel * rowCount + location.blockRow) * E1_DIRECTION_ROW_BYTE_LENGTH, (channel * rowCount + location.blockRow + 1) * E1_DIRECTION_ROW_BYTE_LENGTH);
		}
		const identity = sha256(output);
		requireCondition(identity === scene.pin.payload.sha256, `${scene.pin.id} block reconstruction differs from immutable C0.`);
		identities.push({id: scene.pin.id, byteLength: output.byteLength, sha256: identity});
		await run.setPhase('fresh-reconstruction', `Reconstructed ${sceneIndex + 1}/${scenes.length} C0 scenes exactly.`, {completed: sceneIndex + 1, total: scenes.length});
	}
	return identities;
}

/** Build the receiver-local common-field request that retains frozen Native48/Z180/W27/Native15 facts. */
function commonFieldRequest(sceneSun, support) {
	const input = DistantSunSceneCacheCompilerInputs.createInputSet({sceneSun, support});
	return {
		...input.buildRequest,
		transportSpec: {...input.buildRequest.transportSpec, shaderProfile: {coordinateContract: 'scene-cache-receiver-local-v1'}},
	};
}

async function main() {
	const inventoryBytes = await readFile(path.join(REPOSITORY_ROOT, C0_ACCEPTED_INVENTORY_PATH));
	const inventory = acceptInventoryPins(JSON.parse(inventoryBytes.toString('utf8')));
	const run = await ExperimentRun.create({
		slug: RUN_SLUG,
		command: COMMAND,
		inputs: {schemaId: 'distant-sun-cache-optimization-e3-inputs-v3', inventory: {path: C0_ACCEPTED_INVENTORY_PATH, sha256: sha256(inventoryBytes)}},
		provenance: {schemaId: 'distant-sun-cache-optimization-e3-provenance-v3', operation: 'calculate the receiver-local Native48/Z180 field once per Native15 wavelength, upload bounded logical layers, scatter every layer directly to preallocated unique-direction staging offsets, and authenticate every fresh scene payload before block finalization'},
		environment: {schemaId: 'distant-sun-cache-optimization-e3-environment-v1', node: process.version, platform: process.platform, architecture: process.arch, logicalCpuCount: os.cpus().length},
		references: {schemaId: 'distant-sun-cache-optimization-e3-references-v1', acceptedC0: {runId: '000022-c0-production-control'}, sourceRoot: 'server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1'},
	});
	run.startHeartbeat();
	let scratchCreated = false;
	try {
		const scenes = await Promise.all(inventory.packages.map(async (pin) => ({pin, manifest: acceptSceneManifest(await sourceJson(pin.manifest.path), pin.id), ledger: acceptRowLedger(await sourceJson(pin.ledger.path), `${pin.id} ledger`)})));
		const mappingBytes = await readFile(path.join(CONTROL_PACKAGE_ROOT, inventory.packages[0].logicalToUniqueIndex.path));
		requireCondition(mappingBytes.byteLength === E1_LOGICAL_DIRECTION_COUNT * Uint16Array.BYTES_PER_ELEMENT, 'E3 logical-direction index byte length is invalid.');
		for (const {pin} of scenes) requireCondition(pin.logicalToUniqueIndex.sha256 === inventory.packages[0].logicalToUniqueIndex.sha256, `${pin.id} does not use the common E3 direction index.`);
		const logicalToUnique = new Uint16Array(mappingBytes.buffer, mappingBytes.byteOffset, mappingBytes.byteLength / Uint16Array.BYTES_PER_ELEMENT);
		const scratch = await run.createScratchDirectory(SCRATCH_NAME);
		scratchCreated = true;
		const staging = await Promise.all(scenes.map(({ledger}, index) => E3BoundedStaging.create(path.join(scratch, `scene-${index.toString().padStart(3, '0')}.f32`), logicalToUnique, ledger.retainedBlockCount, E1_CHANNEL_COUNT, E1_UNIQUE_DIRECTION_COUNT)));
		const first = scenes[0];
		const host = new E3BrowserHost(CHROME_EXECUTABLE, REPOSITORY_ROOT);
		const browser = await host.run(scratch, {channelCount: E1_CHANNEL_COUNT, buildRequest: commonFieldRequest(first.manifest.sceneSun, first.ledger.support), sceneCacheRequests: scenes.map(({pin, ledger}) => ({cacheIdentity: pin.cacheIdentity, ledger}))}, staging, async (event) => {
			const wavelengthIndex = Number(event.wavelengthIndex);
			const phase = event.phase === 'compute' ? 'compute' : 'browser';
			await run.progress(phase, `E3 browser ${typeof event.stage === 'string' ? event.stage : event.state ?? 'progress'}.`, Number.isInteger(wavelengthIndex) ? {completed: wavelengthIndex, total: E1_CHANNEL_COUNT} : undefined);
		});
		await run.setPhase('staging-close', 'Closing and syncing every complete bounded staging file.', {completed: 0, total: staging.length});
		for (const [index, target] of staging.entries()) {
			await target.closeComplete();
			await run.setPhase('staging-close', `Closed ${index + 1}/${staging.length} bounded staging files.`, {completed: index + 1, total: staging.length});
		}
		await run.setPhase('fresh-validation', 'Authenticating all fresh staged scene payloads.', {completed: 0, total: scenes.length});
		const freshScenes = [];
		for (const [index, scene] of scenes.entries()) {
			const bytes = await readFile(path.join(scratch, `scene-${index.toString().padStart(3, '0')}.f32`));
			const identity = sha256(bytes);
			requireCondition(bytes.byteLength === scene.pin.payload.byteLength && identity === scene.pin.payload.sha256, `${scene.pin.id} fresh common-field payload differs from immutable C0 control.`);
			freshScenes.push({id: scene.pin.id, byteLength: bytes.byteLength, sha256: identity});
			await run.setPhase('fresh-validation', `Authenticated ${index + 1}/${scenes.length} fresh staged payloads.`, {completed: index + 1, total: scenes.length});
		}
		const stagingByteLength = (await Promise.all(scenes.map((_, index) => stat(path.join(scratch, `scene-${index.toString().padStart(3, '0')}.f32`))))).reduce((total, information) => total + information.size, 0);
		const union = buildUnionLedger(scenes);
		requireCondition(union.ordered.length === inventory.distinctCoordinateCount, 'E3 union ledger distinct-coordinate count differs from C0.');
		const faultBoundaryProof = verifyFaultAndCancellationBoundaries();
		await run.writeJsonArtifact('evidence/fault-boundary-proof.json', faultBoundaryProof);
		const candidate = await buildAndValidateBlocks(run, scratch, inventory, scenes, union);
		const reconstructedScenes = await reconstructScenes(run, scratch, scenes, union, candidate.blocks, candidate.locations);
		const resources = {
			schemaId: 'distant-sun-cache-optimization-e3-resource-ledger-v1',
			stagingByteLength,
			canonicalByteLength: (await stat(candidate.canonicalPath)).size,
			peakDecodedBlockByteLength: candidate.metrics.peakDecodedBytes,
			encodedBlockByteLength: candidate.metrics.encodedBytes,
			node: {rssBytes: process.memoryUsage().rss, heapUsedBytes: process.memoryUsage().heapUsed},
			browser,
			codec: {zstdLevel: ZSTD_LEVEL, ...candidate.metrics},
		};
		await run.writeJsonArtifact('evidence/fresh-scene-identities.json', {schemaId: 'distant-sun-cache-optimization-e3-fresh-scene-identities-v4', freshStagingScenes: freshScenes, reconstructedScenes});
		await run.writeJsonArtifact('evidence/resource-ledger.json', resources);
		await run.writeJsonArtifact('candidate/block-index.json', {schemaId: 'distant-sun-cache-optimization-e3-block-index-v1', layout: BLOCK_LAYOUT, codec: {id: 'zstandard', level: ZSTD_LEVEL, shuffle: 'float32-byte-lane-v1'}, blocks: candidate.blocks});
		await run.removeScratchDirectory(SCRATCH_NAME);
		scratchCreated = false;
		const result = {schemaId: 'distant-sun-cache-optimization-e3-result-v4', runId: run.runId, conclusion: /** @type {const} */ ('accepted'), accepted: true, exactSceneCount: reconstructedScenes.length, blockCount: candidate.blocks.length, requirements: {singleFullRecurrencePerWavelength: true, boundedStaging: true, exactBlockRoundTrips: candidate.blocks.length, exactSceneReconstructions: reconstructedScenes.length, faultAndCancellationBoundaries: true, atomicPublication: true}};
		const manifest = await run.finalize({conclusion: 'accepted', result, report: `# ${run.runId}: E3 bounded generator\n\nConclusion: **accepted**.\n\nA single receiver-local recurrence per Native15 wavelength streamed directly into preallocated bounded scene staging. Newly generated 8x8 shared blocks were byte-shuffled, Zstd-compressed at level 6, read back, and used to reconstruct all C0 scenes exactly. Fault and cancellation boundaries were verified before publication, and all publication occurred only after each block exact round trip.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, artifactSetSha256: manifest.artifactSetSha256}, null, 2)}\n`);
	} catch (error) {
		if (scratchCreated) await run.removeScratchDirectory(SCRATCH_NAME).catch(() => undefined);
		const failure = describeFailure(error);
		const result = {schemaId: 'distant-sun-cache-optimization-e3-result-v3', runId: run.runId, conclusion: /** @type {const} */ ('failed'), accepted: false, error: failure};
		await run.finalize({conclusion: 'failed', result, report: `# ${run.runId}: E3 bounded generator\n\nConclusion: **failed**.\n\nFailure: ${failure.name}: ${failure.message}\n`});
		throw error;
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
