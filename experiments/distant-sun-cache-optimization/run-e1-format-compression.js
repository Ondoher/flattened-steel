#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {open, readFile, stat} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import {constants as zstdConstants, zstdCompressSync, zstdDecompressSync} from 'node:zlib';
import {
	C0_ACCEPTED_INVENTORY_PATH,
	C0_ACCEPTED_MANIFEST_PATH,
	CONTROL_CATALOG_PATH,
	CONTROL_PACKAGE_ROOT,
	E1_CANDIDATE_CONTRACT_PATH,
	E1_CHANNEL_COUNT,
	E1_DIRECTION_LAYOUT_ID,
	E1_DIRECTION_ROW_BYTE_LENGTH,
	E1_LOGICAL_DIRECTION_COUNT,
	E1_UNIQUE_DIRECTION_COUNT,
	EXPERIMENT_SOURCE_ROOT,
	PRODUCTION_DESIGN_PATH,
	PRODUCTION_PLAN_PATH,
	REPOSITORY_ROOT,
} from './consts.js';
import CacheOptimizationByteShuffle from './lib/CacheOptimizationByteShuffle.js';
import CacheOptimizationE1CandidateVerifier from './lib/CacheOptimizationE1CandidateVerifier.js';
import CacheOptimizationContainedFiles from './lib/CacheOptimizationContainedFiles.js';
import CacheOptimizationContracts from './lib/CacheOptimizationContracts.js';
import ExperimentRun from './lib/ExperimentRun.js';
import {verifySealedRun} from './verify-run.js';

const {requireContainedRealFile, requireRealDirectory, sha256File} = CacheOptimizationContainedFiles;
const {
	acceptE1CandidateContract,
	acceptE1CatalogSelection,
	acceptE1Result,
	acceptFileIdentity,
	acceptInventoryPins,
	acceptRuntimeCatalog,
	acceptRowLedger,
	acceptSceneManifest,
	requireRecord,
	requireString,
} = CacheOptimizationContracts;
const executeFile = promisify(execFile);
const COMMAND = 'node experiments/distant-sun-cache-optimization/run-e1-format-compression.js';
const RUN_SLUG = 'e1-format-compression';
const SCRATCH_NAME = 'e1-scratch';

/**
 * Called by E1 proof orchestration to stop immediately when an invariant fails.
 * Throws the supplied diagnostic when `value` is falsy.
 *
 * @param {unknown} value - Invariant value to assert.
 * @param {string} message - Diagnostic used when the invariant fails.
 * @returns {asserts value} - Assertion that narrows the validated value.
 */
function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

/**
 * Called by E1 artifact construction to derive a content identity.
 *
 * @param {string | Uint8Array} value - Bytes or text to hash.
 * @returns {string} - Lowercase SHA-256 digest.
 */
function sha256(value) {
	return createHash('sha256').update(value).digest('hex');
}

/**
 * Called by publication to serialize canonical human-readable JSON bytes.
 * Throws when JSON serialization rejects the supplied value.
 *
 * @param {CacheOptimizationJsonValue} value - JSON-compatible value to serialize.
 * @returns {Buffer} - UTF-8 JSON bytes terminated by one newline.
 */
function jsonBytes(value) {
	return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

/**
 * Called by input authentication to read one repository-contained JSON object.
 * Rejects escaped paths, non-files, malformed JSON, and read failures.
 *
 * @param {string} relativePath - Repository-relative JSON path.
 * @param {string} label - Stable diagnostic label.
 * @returns {Promise<CacheOptimizationJsonObject>} - Parsed JSON object.
 */
async function readRepositoryJson(relativePath, label) {
	const target = await requireContainedRealFile(REPOSITORY_ROOT, relativePath, label);
	return JSON.parse(await readFile(target, 'utf8'));
}

/**
 * Called by provenance capture to authenticate one repository file.
 * Rejects escaped paths, non-files, and unreadable content.
 *
 * @param {string} relativePath - Repository-relative file path.
 * @returns {Promise<CacheOptimizationFileIdentity>} - Immutable file identity.
 */
async function pinRepositoryFile(relativePath) {
	const target = await requireContainedRealFile(REPOSITORY_ROOT, relativePath, relativePath);
	return {path: relativePath, byteLength: (await stat(target)).size, sha256: await sha256File(target)};
}

/**
 * Called by provenance capture to record the current commit and worktree state.
 * Rejects when either read-only Git command fails.
 *
 * @returns {Promise<CacheOptimizationGitIdentity>} - Current Git identity.
 */
async function gitIdentity() {
	const [{stdout: commit}, {stdout: status}] = await Promise.all([
		executeFile('git', ['rev-parse', 'HEAD'], {cwd: REPOSITORY_ROOT, windowsHide: true}),
		executeFile('git', ['status', '--short'], {cwd: REPOSITORY_ROOT, windowsHide: true}),
	]);
	return {commit: commit.trim(), worktreeStatus: status.trim().split(/\r?\n/u).filter(Boolean)};
}

/**
 * Called by staging readers to fill a buffer from one exact file range.
 * Rejects I/O failures and premature end-of-file.
 *
 * @param {CacheOptimizationRandomAccessFileHandle} handle - Open random-access source.
 * @param {Buffer} buffer - Caller-owned destination buffer.
 * @param {number} position - Absolute source byte offset.
 * @param {string} label - Stable diagnostic label.
 * @returns {Promise<void>} - Completion after the buffer is full.
 */
async function readExactly(handle, buffer, position, label) {
	let offset = 0;
	while (offset < buffer.byteLength) {
		const {bytesRead} = await handle.read(buffer, offset, buffer.byteLength - offset, position + offset);
		if (bytesRead === 0) throw new Error(`${label} ended before the declared byte range.`);
		offset += bytesRead;
	}
}

/**
 * Called by staging writers to persist a buffer at one exact file range.
 * Rejects I/O failures and zero-progress writes.
 *
 * @param {CacheOptimizationRandomAccessFileHandle} handle - Open random-access destination.
 * @param {Buffer} buffer - Caller-owned source buffer.
 * @param {number} position - Absolute destination byte offset.
 * @param {string} label - Stable diagnostic label.
 * @returns {Promise<void>} - Completion after every byte is written.
 */
async function writeExactly(handle, buffer, position, label) {
	let offset = 0;
	while (offset < buffer.byteLength) {
		const {bytesWritten} = await handle.write(buffer, offset, buffer.byteLength - offset, position + offset);
		if (bytesWritten === 0) throw new Error(`${label} could not be completely written.`);
		offset += bytesWritten;
	}
}

/**
 * Called by extraction and lookup code to identify one coordinate.
 *
 * @param {number} altitudeIndex - Zero-based altitude index.
 * @param {number} solarZenithIndex - Zero-based solar-zenith index.
 * @returns {string} - Stable coordinate key.
 */
function coordinateKey(altitudeIndex, solarZenithIndex) {
	return `${altitudeIndex}:${solarZenithIndex}`;
}

/**
 * Called by candidate grouping to identify the tile that owns one coordinate.
 *
 * @param {CacheOptimizationE1Layout} layout - Candidate tile dimensions.
 * @param {CacheOptimizationE1SourceCoordinate} coordinate - Coordinate being grouped.
 * @returns {string} - Stable tile key.
 */
function tileKey(layout, coordinate) {
	return `${Math.floor(coordinate.altitudeIndex / layout.altitudeCount)}:${Math.floor(coordinate.solarZenithIndex / layout.solarZenithCount)}`;
}

/**
 * Called by canonical ordering to compare two source coordinates.
 *
 * @param {CacheOptimizationE1SourceCoordinate} left - Left comparison value.
 * @param {CacheOptimizationE1SourceCoordinate} right - Right comparison value.
 * @returns {number} - Negative, zero, or positive ordering value.
 */
function compareCoordinates(left, right) {
	return left.altitudeIndex - right.altitudeIndex || left.solarZenithIndex - right.solarZenithIndex;
}

/**
 * Called by inventory loading to authenticate one production package artifact against C0.
 * Rejects schema, containment, length, hash, and I/O failures.
 *
 * @param {CacheOptimizationInventoryPackage} packagePin - Immutable C0 package record.
 * @param {CacheOptimizationPackageArtifactName} name - Artifact field to authenticate.
 * @returns {Promise<CacheOptimizationFileIdentity>} - Accepted artifact identity.
 */
async function authenticatePackageArtifact(packagePin, name) {
	const identity = acceptFileIdentity(packagePin[name], `${packagePin.id} ${name}`);
	const target = await requireContainedRealFile(CONTROL_PACKAGE_ROOT, identity.path, `${packagePin.id} ${name}`);
	const information = await stat(target);
	requireCondition(information.size === identity.byteLength, `${packagePin.id} ${name} byte length differs from C0.`);
	requireCondition((await sha256File(target)) === identity.sha256, `${packagePin.id} ${name} hash differs from C0.`);
	return identity;
}

/**
 * Called by E1 orchestration to authenticate and normalize the complete source inventory.
 * Rejects any changed artifact, malformed source contract, or inconsistent package relationship.
 *
 * @param {ExperimentRun} run - Active immutable evidence run.
 * @param {CacheOptimizationInventoryPins} inventory - Accepted C0 inventory pins.
 * @returns {Promise<CacheOptimizationE1SourceInventory>} - Authenticated E1 source inventory.
 */
async function loadInventory(run, inventory) {
	const coordinates = new Map();
	const scenes = [];
	/** @type {CacheOptimizationE1SourceConfiguration | undefined} */
	let configuration;
	for (const [packageIndex, packagePin] of inventory.packages.entries()) {
		await run.setPhase('input-authentication', `Authenticating C0 package ${packageIndex + 1}/${inventory.packages.length}.`, {
			completed: packageIndex,
			total: inventory.packages.length,
		});
		const identities = {};
		for (const name of /** @type {const} */ (['manifest', 'ledger', 'payload', 'logicalToUniqueIndex'])) {
			identities[name] = await authenticatePackageArtifact(packagePin, name);
		}
		requireCondition(
			Object.values(identities).reduce((sum, identity) => sum + identity.byteLength, 0) === packagePin.byteLength,
			`${packagePin.id} complete package byte length differs from C0.`,
		);
		const manifest = acceptSceneManifest(
			await readRepositoryJson(
				`${path.relative(REPOSITORY_ROOT, CONTROL_PACKAGE_ROOT).replaceAll('\\', '/')}/${packagePin.manifest.path}`,
				`${packagePin.id} manifest`,
			),
			`${packagePin.id} manifest`,
		);
		requireCondition(manifest.cacheIdentity === packagePin.cacheIdentity, `${packagePin.id} cache identity changed.`);
		requireCondition(
			manifest.ledgerPath === path.posix.basename(identities.ledger.path) && manifest.ledgerSha256 === identities.ledger.sha256,
			`${packagePin.id} manifest ledger reference differs from C0.`,
		);
		for (const [manifestName, identityName] of /** @type {const} */ ([
			['exactSeamPayload', 'payload'],
			['logicalToUniqueIndex', 'logicalToUniqueIndex'],
		])) {
			const reference = /** @type {CacheOptimizationProductionArtifact} */ (manifest[manifestName]);
			const identity = identities[identityName];
			requireCondition(
				reference.path === path.posix.basename(identity.path) &&
					reference.byteLength === identity.byteLength &&
					reference.sha256 === identity.sha256,
				`${packagePin.id} manifest ${manifestName} reference differs from C0.`,
			);
		}
		const ledger = acceptRowLedger(
			await readRepositoryJson(
				`${path.relative(REPOSITORY_ROOT, CONTROL_PACKAGE_ROOT).replaceAll('\\', '/')}/${packagePin.ledger.path}`,
				`${packagePin.id} ledger`,
			),
			`${packagePin.id} ledger`,
		);
		requireCondition(
			manifest.selection.representativeSolarZenithDegrees === packagePin.representativeSolarZenithDegrees &&
				JSON.stringify(manifest.sceneSun) === JSON.stringify(ledger.sceneSun) &&
				ledger.exactSeamByteLength === identities.payload.byteLength + identities.logicalToUniqueIndex.byteLength,
			`${packagePin.id} source manifest and ledger relationships are incoherent.`,
		);
		/** @type {CacheOptimizationE1SourceConfiguration} */
		const candidateConfiguration = {
			atmosphereIdentity: manifest.atmosphereIdentity,
			geometryIdentity: manifest.geometryIdentity,
			groundIdentity: manifest.groundIdentity,
			numericalIdentity: manifest.numericalIdentity,
			directionLayout: {
				id: E1_DIRECTION_LAYOUT_ID,
				uniqueDirectionCount: E1_UNIQUE_DIRECTION_COUNT,
				logicalDirectionCount: E1_LOGICAL_DIRECTION_COUNT,
				logicalToUniqueIndexSha256: manifest.logicalToUniqueIndex.sha256,
			},
			spectralLayout: {id: 'Native15', channelCount: E1_CHANNEL_COUNT, order: 'wavelength-major'},
			coordinateDomains: {
				altitude: {firstIndex: 0, count: 48},
				solarZenith: {firstIndex: 0, count: 180, binWidthDegrees: 1},
			},
		};
		requireCondition(
			manifest.logicalToUniqueIndex.codecId === E1_DIRECTION_LAYOUT_ID &&
				manifest.logicalToUniqueIndex.byteLength / Uint16Array.BYTES_PER_ELEMENT === E1_LOGICAL_DIRECTION_COUNT,
			`${packagePin.id} direction layout is unsupported.`,
		);
		if (configuration === undefined) configuration = candidateConfiguration;
		else requireCondition(JSON.stringify(configuration) === JSON.stringify(candidateConfiguration), 'Package configuration identities disagree.');
		const sceneCoordinates = [];
		for (const row of ledger.rows) {
			for (let solarZenithIndex = row.firstSolarZenithIndex; solarZenithIndex <= row.lastSolarZenithIndex; solarZenithIndex += 1) {
				const key = coordinateKey(row.altitudeIndex, solarZenithIndex);
				const packedRow = row.firstPackedRow + solarZenithIndex - row.firstSolarZenithIndex;
				if (!coordinates.has(key)) {
					coordinates.set(key, {
						key,
						altitudeIndex: row.altitudeIndex,
						solarZenithIndex,
						payloadPath: packagePin.payload.path,
						payloadPackedRow: packedRow,
						payloadRowCount: packagePin.rowCount,
					});
				}
				sceneCoordinates.push(key);
			}
		}
		requireCondition(sceneCoordinates.length === packagePin.rowCount, `${packagePin.id} row count changed.`);
		scenes.push({
			id: packagePin.id,
			representativeSolarZenithDegrees: packagePin.representativeSolarZenithDegrees,
			selection: manifest.selection,
			sceneSun: manifest.sceneSun,
			compatibility: {
				cacheIdentity: manifest.cacheIdentity,
				atmosphereIdentity: manifest.atmosphereIdentity,
				geometryIdentity: manifest.geometryIdentity,
				groundIdentity: manifest.groundIdentity,
				numericalIdentity: manifest.numericalIdentity,
			},
			ledger,
			sourceManifestSha256: packagePin.manifest.sha256,
			payloadSha256: packagePin.payload.sha256,
			payloadByteLength: packagePin.payload.byteLength,
			coordinates: sceneCoordinates,
		});
	}
	await run.setPhase('input-authentication', 'Authenticated every C0 package artifact and manifest relationship.', {
		completed: inventory.packages.length,
		total: inventory.packages.length,
	});
	const orderedCoordinates = [...coordinates.values()].sort(compareCoordinates);
	requireCondition(orderedCoordinates.length === inventory.distinctCoordinateCount, 'Distinct coordinate count changed.');
	return {coordinates, orderedCoordinates, scenes, configuration};
}

/**
 * Called before candidate generation to prove the byte-lane transform against a fixed vector.
 * Throws if forward, inverse, or malformed-input behavior differs from the contract.
 *
 * @returns {CacheOptimizationE1ByteShuffleProof} - Self-verifying shuffle evidence.
 */
function verifyByteShuffleContract() {
	const source = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]);
	const expected = Buffer.from([0, 4, 1, 5, 2, 6, 3, 7]);
	const shuffled = CacheOptimizationByteShuffle.shuffle(source);
	requireCondition(shuffled.equals(expected), 'Byte shuffle differs from the independent fixed vector.');
	requireCondition(CacheOptimizationByteShuffle.inverse(shuffled).equals(source), 'Byte shuffle fixed vector does not invert.');
	for (const operation of [
		() => CacheOptimizationByteShuffle.shuffle(/** @type {any} */ ('invalid')),
		() => CacheOptimizationByteShuffle.inverse(Buffer.from([0, 1, 2])),
	]) {
		let rejected = false;
		try {
			operation();
		} catch (error) {
			rejected = error instanceof TypeError;
		}
		requireCondition(rejected, 'Byte shuffle malformed input was not rejected with TypeError.');
	}
	return {
		schemaId: 'distant-sun-cache-optimization-e1-byte-shuffle-proof-v1',
		source: [...source],
		expected: [...expected],
		actual: [...shuffled],
		inverse: [...CacheOptimizationByteShuffle.inverse(shuffled)],
		malformedInputsRejected: true,
	};
}

/**
 * Called by E1 orchestration to build one authenticated distinct-coordinate staging file.
 * Rejects source I/O, containment, synchronization, and progress-publication failures.
 *
 * @param {ExperimentRun} run - Active immutable evidence run.
 * @param {string} scratchDirectory - Run-local scratch directory.
 * @param {CacheOptimizationInventoryPins} inventory - Accepted C0 dimensions.
 * @param {CacheOptimizationE1SourceInventory} source - Authenticated source inventory.
 * @returns {Promise<string>} - Absolute path of the canonical staging file.
 */
async function buildCanonicalStore(run, scratchDirectory, inventory, source) {
	await run.setPhase('coordinate-extraction', 'Extracting the canonical distinct-coordinate store.', {completed: 0, total: source.orderedCoordinates.length});
	const canonicalPath = path.join(scratchDirectory, 'canonical-rows.f32');
	const canonical = await open(canonicalPath, 'wx+');
	const payloadHandles = new Map();
	const row = Buffer.allocUnsafe(inventory.rowByteLength);
	try {
		for (let index = 0; index < source.orderedCoordinates.length; index += 1) {
			const coordinate = source.orderedCoordinates[index];
			let payload = payloadHandles.get(coordinate.payloadPath);
			if (!payload) {
				payload = await open(await requireContainedRealFile(CONTROL_PACKAGE_ROOT, coordinate.payloadPath, 'Pinned payload'), 'r');
				payloadHandles.set(coordinate.payloadPath, payload);
			}
			for (let channel = 0; channel < E1_CHANNEL_COUNT; channel += 1) {
				await readExactly(
					payload,
					row.subarray(channel * E1_DIRECTION_ROW_BYTE_LENGTH, (channel + 1) * E1_DIRECTION_ROW_BYTE_LENGTH),
					(channel * coordinate.payloadRowCount + coordinate.payloadPackedRow) * E1_DIRECTION_ROW_BYTE_LENGTH,
					`${coordinate.key} channel ${channel}`,
				);
			}
			coordinate.canonicalRow = index;
			await writeExactly(canonical, row, index * row.byteLength, coordinate.key);
			if ((index + 1) % 256 === 0) {
				await run.setPhase('coordinate-extraction', `Extracted ${index + 1} canonical coordinates.`, {completed: index + 1, total: source.orderedCoordinates.length});
			}
		}
		await canonical.sync();
	} finally {
		await Promise.all([...payloadHandles.values()].map((handle) => handle.close()));
		await canonical.close();
	}
	await run.setPhase('coordinate-extraction', 'Extracted the complete canonical coordinate store.', {completed: source.orderedCoordinates.length, total: source.orderedCoordinates.length});
	return canonicalPath;
}

/**
 * Called by candidate publication to translate source scenes into block segments.
 * Throws if a required coordinate lacks a canonical block location.
 *
 * @param {readonly CacheOptimizationE1SourceScene[]} sourceScenes - Authenticated source scenes.
 * @param {Map<string, CacheOptimizationE1BlockLocation>} coordinateLookup - Canonical block locations by coordinate key.
 * @returns {CacheOptimizationE1SceneMetadata[]} - Publication-ready scene metadata.
 */
function sceneMetadata(sourceScenes, coordinateLookup) {
	return sourceScenes.map((scene) => {
		const segments = [];
		for (const key of scene.coordinates) {
			const location = coordinateLookup.get(key);
			const previous = segments.at(-1);
			if (previous && previous.blockIndex === location.blockIndex && previous.firstBlockRow + previous.rowCount === location.blockRow) previous.rowCount += 1;
			else segments.push({blockIndex: location.blockIndex, firstBlockRow: location.blockRow, rowCount: 1});
		}
		const {coordinates: _coordinates, ...identity} = scene;
		return {
			...identity,
			segments,
		};
	});
}

/**
 * Called by metadata construction to serialize and content-address one JSON document.
 * Throws when JSON serialization rejects the supplied value.
 *
 * @template {CacheOptimizationJsonObject} T
 * @param {string} directory - Candidate-relative metadata directory.
 * @param {string} basename - Stable human-readable filename prefix.
 * @param {T} value - Typed JSON object to serialize.
 * @returns {CacheOptimizationE1MetadataDocument<T>} - Value, bytes, and immutable identity.
 */
function metadataDocument(directory, basename, value) {
	const bytes = jsonBytes(value);
	const identity = {path: `${directory}/${basename}-${sha256(bytes)}.json`, byteLength: bytes.byteLength, sha256: sha256(bytes)};
	return {identity, value, bytes};
}

/**
 * Called by each candidate build to derive its configuration facts and identity.
 *
 * @param {CacheOptimizationE1Layout} layout - Candidate tile dimensions.
 * @param {CacheOptimizationE1SourceInventory} source - Authenticated shared configuration.
 * @returns {CacheOptimizationE1ConfigurationContract} - Configuration facts and canonical identity.
 */
function candidateConfiguration(layout, source) {
	const facts = /** @type {CacheOptimizationE1ConfigurationContract['facts']} */ ({
		...source.configuration,
		blockGrid: {
			altitudeCount: layout.altitudeCount,
			solarZenithCount: layout.solarZenithCount,
			coordinateOrder: 'altitude-then-solar-zenith',
			payloadOrder: 'wavelength-then-coordinate-then-direction',
			omitUnpopulatedCoordinates: true,
		},
	});
	return {facts, identity: sha256(jsonBytes(facts))};
}

/**
 * Called after block construction to build the complete content-addressed metadata graph.
 * Throws when any metadata value cannot be serialized.
 *
 * @param {CacheOptimizationE1Layout} layout - Candidate tile dimensions.
 * @param {CacheOptimizationE1ZstandardLevel} level - Candidate Zstandard level.
 * @param {CacheOptimizationE1CandidateContract} contract - Frozen E1 contract.
 * @param {CacheOptimizationInventoryPins} inventory - Accepted C0 dimensions.
 * @param {CacheOptimizationE1Block[]} blocks - Published block descriptors.
 * @param {CacheOptimizationE1SceneMetadata[]} scenes - Publication-ready scene metadata.
 * @param {CacheOptimizationE1ConfigurationContract} configurationContract - Candidate configuration identity.
 * @param {CacheOptimizationE1BuildIdentity} build - Immutable generator and source-catalog identity.
 * @param {CacheOptimizationE1CatalogSelection} catalogSelection - Current catalog-wide selection contract.
 * @returns {CacheOptimizationE1MetadataBundle} - Complete serialized metadata bundle.
 */
function buildMetadataBundle(
	layout,
	level,
	contract,
	inventory,
	blocks,
	scenes,
	configurationContract,
	build,
	catalogSelection,
) {
	const blockIndex = metadataDocument('metadata/indexes', 'block-index', {
		schemaId: 'distant-sun-cache-block-index-v1',
		rowByteLength: inventory.rowByteLength,
		distinctCoordinateCount: inventory.distinctCoordinateCount,
		blocks,
	});
	const sceneDocuments = scenes.map((scene) =>
		metadataDocument('metadata/scenes', scene.id, {
			schemaId: 'distant-sun-cache-scene-manifest-v1',
			...scene,
		}),
	);
	const configuration = metadataDocument('metadata/configurations', 'configuration-manifest', {
		schemaId: 'distant-sun-cache-configuration-manifest-v1',
		configurationIdentity: configurationContract.identity,
		...configurationContract.facts,
		layout: {id: layout.id, altitudeCount: layout.altitudeCount, solarZenithCount: layout.solarZenithCount},
		codec: {id: 'zstandard', level, implementation: `node:${process.version}/zstd:${process.versions.zstd}`},
		shuffle: contract.shuffle,
		rowByteLength: inventory.rowByteLength,
		distinctCoordinateCount: inventory.distinctCoordinateCount,
		blockIndex: blockIndex.identity,
	});
	const catalog = metadataDocument('metadata/catalogs', 'runtime-catalog', {
		schemaId: 'distant-sun-cache-runtime-catalog-v1',
		selection: catalogSelection,
		scenes: sceneDocuments.map((document) => ({
			id: document.value.id,
			representativeSolarZenithDegrees: document.value.representativeSolarZenithDegrees,
			manifest: document.identity,
		})),
	});
	const packageSet = metadataDocument('metadata', 'package-set-report', {
		schemaId: 'distant-sun-cache-package-set-report-v1',
		parent: contract.acceptedC0,
		build,
		configuration: configuration.identity,
		configurationIdentity: configurationContract.identity,
		codec: configuration.value.codec,
		catalog: catalog.identity,
		catalogSelectionIdentity: sha256(jsonBytes(catalogSelection)),
	});
	const artifacts = [packageSet, catalog, configuration, blockIndex, ...sceneDocuments];
	return {
		artifacts,
		blocks,
		scenes,
		rowByteLength: inventory.rowByteLength,
		globalByteLength:
			packageSet.identity.byteLength +
			catalog.identity.byteLength +
			configuration.identity.byteLength +
			blockIndex.identity.byteLength,
		metadataByteLength: artifacts.reduce((total, artifact) => total + artifact.identity.byteLength, 0),
		identitySha256: sha256(jsonBytes(artifacts.map((artifact) => artifact.identity))),
	};
}

/**
 * Called by candidate comparison to model artifact requests, transfer, reuse, and overfetch.
 * Throws if a contract scenario does not resolve to published scene metadata.
 *
 * @param {CacheOptimizationE1MetadataBundle} metadata - Complete candidate metadata.
 * @param {CacheOptimizationE1CandidateContract} contract - Frozen request scenarios.
 * @returns {CacheOptimizationE1RequestMetrics} - Deterministic request-model measurements.
 */
function requestMetrics(metadata, contract) {
	const byDegrees = new Map(metadata.scenes.map((scene) => [scene.representativeSolarZenithDegrees, scene]));
	const blocksByPath = new Map(metadata.blocks.map((block) => [block.path, block]));
	const sceneDocumentsByDegrees = new Map(
		metadata.artifacts
			.filter((artifact) => artifact.value.schemaId === 'distant-sun-cache-scene-manifest-v1')
			.map((artifact) => [artifact.value.representativeSolarZenithDegrees, artifact]),
	);
	/**
	 * Called by the request model to resolve one scene's logical block set.
	 * Throws when the frozen scenario angle has no published scene.
	 *
	 * @param {number} degrees - Representative scene angle.
	 * @returns {Set<string>} - Unique content-addressed block paths required by the scene.
	 */
	const blocks = (degrees) =>
		new Set(byDegrees.get(degrees).segments.map((segment) => metadata.blocks[segment.blockIndex].path));
	/**
	 * Called by request measurement to resolve one authenticated content-addressed block.
	 * Throws instead of silently treating an absent artifact as zero work.
	 *
	 * @param {string} blockPath - Content-addressed candidate-relative path.
	 * @returns {CacheOptimizationE1Block} - Published block descriptor.
	 */
	const blockAtPath = (blockPath) => {
		const block = blocksByPath.get(blockPath);
		requireCondition(block !== undefined, `Request model references an absent block: ${blockPath}`);
		return block;
	};
	/**
	 * Called by the request model to measure one selection against retained blocks and metadata.
	 * Throws when the selected scene metadata is absent.
	 *
	 * @param {number} degrees - Representative scene angle.
	 * @param {Set<string>} required - Content-addressed blocks required by the scene.
	 * @param {Set<string>} [retained] - Content-addressed blocks already retained.
	 * @param {boolean} [includeGlobal] - Whether global metadata must be fetched.
	 * @param {boolean} [includeScene] - Whether scene metadata must be fetched.
	 * @returns {CacheOptimizationE1RequestScenarioMetrics} - Modeled request and transfer totals.
	 */
	const measure = (degrees, required, retained = new Set(), includeGlobal = false, includeScene = true) => {
		const requested = [...required].filter((blockPath) => !retained.has(blockPath));
		const metadataRequestCount = (includeGlobal ? 4 : 0) + (includeScene ? 1 : 0);
		const metadataByteLength =
			(includeGlobal ? metadata.globalByteLength : 0) +
			(includeScene ? sceneDocumentsByDegrees.get(degrees).identity.byteLength : 0);
		return {
			requestCount: requested.length + metadataRequestCount,
			encodedByteLength:
				requested.reduce((total, blockPath) => total + blockAtPath(blockPath).encodedByteLength, 0) +
				metadataByteLength,
			blockRequestCount: requested.length,
			metadataRequestCount,
			metadataByteLength,
		};
	};
	const cold = blocks(contract.scenarios.coldSceneDegrees);
	const adjacent = blocks(contract.scenarios.adjacentSceneDegrees);
	const nonadjacent = blocks(contract.scenarios.nonadjacentSceneDegrees);
	const warm = blocks(contract.scenarios.warmSceneDegrees);
	const sceneOverfetch = metadata.scenes.map((scene) => {
		const unique = new Set(scene.segments.map((segment) => metadata.blocks[segment.blockIndex].path));
		const decodedRows = [...unique].reduce((total, blockPath) => total + blockAtPath(blockPath).rowCount, 0);
		const requestedRows = scene.payloadByteLength / metadata.rowByteLength;
		return {degrees: scene.representativeSolarZenithDegrees, requestedRows, decodedRows, ratio: decodedRows / requestedRows};
	});
	return {
		model: 'pairwise predecessor retention; immutable metadata is retained after first fetch; artifact hashes are coalesced within each scene',
		cold: measure(contract.scenarios.coldSceneDegrees, cold, new Set(), true),
		adjacent: measure(contract.scenarios.adjacentSceneDegrees, adjacent, cold),
		nonadjacent: measure(contract.scenarios.nonadjacentSceneDegrees, nonadjacent, adjacent),
		warm: measure(contract.scenarios.warmSceneDegrees, warm, warm, false, false),
		neighborReuse: {sharedBlockCount: [...adjacent].filter((block) => cold.has(block)).length, requiredBlockCount: adjacent.size},
		overfetch: {
			minimumRatio: Math.min(...sceneOverfetch.map((value) => value.ratio)),
			meanRatio: sceneOverfetch.reduce((sum, value) => sum + value.ratio, 0) / sceneOverfetch.length,
			maximumRatio: Math.max(...sceneOverfetch.map((value) => value.ratio)),
		},
	};
}

/**
 * Called by E1 orchestration to build, round-trip, measure, and optionally publish one candidate.
 * Rejects staging I/O, codec, exactness, publication, and progress failures.
 *
 * @param {ExperimentRun} run - Active immutable evidence run.
 * @param {string} canonicalPath - Authenticated canonical staging-file path.
 * @param {CacheOptimizationE1SourceInventory} source - Authenticated source inventory.
 * @param {CacheOptimizationInventoryPins} inventory - Accepted C0 dimensions.
 * @param {CacheOptimizationE1Layout} layout - Candidate tile dimensions.
 * @param {CacheOptimizationE1ZstandardLevel} level - Candidate Zstandard level.
 * @param {CacheOptimizationE1CandidateContract} contract - Frozen E1 contract.
 * @param {boolean} publish - Whether to write this candidate into the run.
 * @param {CacheOptimizationE1BuildIdentity} build - Immutable generator and source-catalog identity.
 * @param {CacheOptimizationE1CatalogSelection} catalogSelection - Current catalog-wide selection contract.
 * @returns {Promise<CacheOptimizationE1BuiltCandidate>} - Complete candidate measurements and private metadata.
 */
async function buildCandidate(
	run,
	canonicalPath,
	source,
	inventory,
	layout,
	level,
	contract,
	publish,
	build,
	catalogSelection,
) {
	const phaseId = `${layout.id}-zstd-${level}`;
	const configurationContract = candidateConfiguration(layout, source);
	await run.setPhase('candidate-build', `Building ${phaseId}.`);
	const groups = new Map();
	for (const coordinate of source.orderedCoordinates) {
		const key = tileKey(layout, coordinate);
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(coordinate);
	}
	const tiles = [...groups.entries()].map(([key, coordinates]) => ({key, coordinates: coordinates.sort(compareCoordinates)})).sort((left, right) => compareCoordinates(left.coordinates[0], right.coordinates[0]));
	const canonical = await open(canonicalPath, 'r');
	const blocks = [];
	const coordinateLookup = new Map();
	const encodedLengths = [];
	const publishedHashes = new Set();
	let encodedByteLength = 0;
	let encodeMilliseconds = 0;
	let decodeMilliseconds = 0;
	let shuffleMilliseconds = 0;
	let inverseShuffleMilliseconds = 0;
	let maximumDecodedBlockByteLength = 0;
	try {
		for (let blockIndex = 0; blockIndex < tiles.length; blockIndex += 1) {
			const tile = tiles[blockIndex];
			const decoded = Buffer.allocUnsafe(tile.coordinates.length * inventory.rowByteLength);
			for (let rowIndex = 0; rowIndex < tile.coordinates.length; rowIndex += 1) {
				const coordinate = tile.coordinates[rowIndex];
				for (let channel = 0; channel < E1_CHANNEL_COUNT; channel += 1) {
					await readExactly(
						canonical,
						decoded.subarray(
							(channel * tile.coordinates.length + rowIndex) * E1_DIRECTION_ROW_BYTE_LENGTH,
							(channel * tile.coordinates.length + rowIndex + 1) * E1_DIRECTION_ROW_BYTE_LENGTH,
						),
						coordinate.canonicalRow * inventory.rowByteLength + channel * E1_DIRECTION_ROW_BYTE_LENGTH,
						`${coordinate.key} channel ${channel}`,
					);
				}
				coordinateLookup.set(coordinate.key, {blockIndex, blockRow: rowIndex});
			}
			maximumDecodedBlockByteLength = Math.max(maximumDecodedBlockByteLength, decoded.byteLength);
			const shuffleStarted = performance.now();
			const shuffled = CacheOptimizationByteShuffle.shuffle(decoded);
			shuffleMilliseconds += performance.now() - shuffleStarted;
			const encodeStarted = performance.now();
			const encoded = zstdCompressSync(shuffled, {params: {[zstdConstants.ZSTD_c_compressionLevel]: level}});
			encodeMilliseconds += performance.now() - encodeStarted;
			const decodeStarted = performance.now();
			const decodedShuffle = zstdDecompressSync(encoded);
			decodeMilliseconds += performance.now() - decodeStarted;
			const inverseStarted = performance.now();
			const roundTrip = CacheOptimizationByteShuffle.inverse(decodedShuffle);
			inverseShuffleMilliseconds += performance.now() - inverseStarted;
			requireCondition(roundTrip.equals(decoded), `${phaseId} block ${tile.key} failed exact round trip.`);
			const encodedSha256 = sha256(encoded);
			const block = {
				id: `${configurationContract.identity}:${tile.key}`,
				tile: {
					altitudeIndex: tile.coordinates[0].altitudeIndex - (tile.coordinates[0].altitudeIndex % layout.altitudeCount),
					solarZenithIndex:
						tile.coordinates[0].solarZenithIndex -
						(tile.coordinates[0].solarZenithIndex % layout.solarZenithCount),
				},
				rowCount: tile.coordinates.length,
				decodedByteLength: decoded.byteLength,
				decodedSha256: sha256(decoded),
				encodedByteLength: encoded.byteLength,
				encodedSha256,
				path: `blocks/${encodedSha256}.zst`,
				coordinates: tile.coordinates.map((coordinate) => [coordinate.altitudeIndex, coordinate.solarZenithIndex]),
				derivation: {
					parentRunId: contract.acceptedC0.runId,
					parentArtifactSetSha256: contract.acceptedC0.artifactSetSha256,
					operation: 'gather canonical wavelength-major coordinate rows, apply float32 byte-lane shuffle, and compress with the pinned Zstandard profile',
					configurationIdentity: configurationContract.identity,
				},
			};
			blocks.push(block);
			encodedLengths.push(encoded.byteLength);
			if (!publishedHashes.has(encodedSha256)) {
				encodedByteLength += encoded.byteLength;
				if (publish) await run.writeArtifact(`candidate/${block.path}`, encoded);
				publishedHashes.add(encodedSha256);
			}
			if ((blockIndex + 1) % 16 === 0 || blockIndex + 1 === tiles.length) {
				await run.setPhase('candidate-build', `Built ${blockIndex + 1}/${tiles.length} blocks for ${phaseId}.`, {completed: blockIndex + 1, total: tiles.length});
			}
		}
	} finally {
		await canonical.close();
	}
	const metadata = buildMetadataBundle(
		layout,
		level,
		contract,
		inventory,
		blocks,
		sceneMetadata(source.scenes, coordinateLookup),
		configurationContract,
		build,
		catalogSelection,
	);
	const metadataByteLength = metadata.metadataByteLength;
	const metrics = requestMetrics(metadata, contract);
	if (publish) {
		for (const artifact of metadata.artifacts) {
			await run.writeArtifact(`candidate/${artifact.identity.path}`, artifact.bytes);
		}
	}
	return {
		id: phaseId,
		layoutId: layout.id,
		zstandardLevel: level,
		blockCount: blocks.length,
		uniqueBlockArtifactCount: publishedHashes.size,
		encodedByteLength,
		metadataByteLength,
		metadataArtifactCount: metadata.artifacts.length,
		completeByteLength: encodedByteLength + metadataByteLength,
		maximumDecodedBlockByteLength,
		codec: {shuffleMilliseconds, encodeMilliseconds, decodeMilliseconds, inverseShuffleMilliseconds},
		requests: metrics,
		exactBlockCount: blocks.length,
		metadata,
	};
}

/**
 * Called by E1 orchestration to authenticate canonical staging against every source payload.
 * Rejects source I/O, progress, or reconstructed identity differences.
 *
 * @param {ExperimentRun} run - Active immutable evidence run.
 * @param {string} canonicalPath - Authenticated canonical staging-file path.
 * @param {CacheOptimizationE1SourceInventory} source - Authenticated source inventory.
 * @param {CacheOptimizationInventoryPins} inventory - Accepted C0 dimensions.
 * @returns {Promise<CacheOptimizationE1Exactness>} - Exact canonical reconstruction summary.
 */
async function verifyScenes(run, canonicalPath, source, inventory) {
	await run.setPhase('scene-reconstruction', 'Reconstructing all scene payload identities.', {completed: 0, total: source.scenes.length});
	const canonical = await open(canonicalPath, 'r');
	const directionRow = Buffer.allocUnsafe(E1_DIRECTION_ROW_BYTE_LENGTH);
	let checkedByteLength = 0;
	try {
		for (let sceneIndex = 0; sceneIndex < source.scenes.length; sceneIndex += 1) {
			const scene = source.scenes[sceneIndex];
			const digest = createHash('sha256');
			for (let channel = 0; channel < E1_CHANNEL_COUNT; channel += 1) {
				for (const key of scene.coordinates) {
					const coordinate = source.coordinates.get(key);
					await readExactly(
						canonical,
						directionRow,
						coordinate.canonicalRow * inventory.rowByteLength + channel * E1_DIRECTION_ROW_BYTE_LENGTH,
						`${key} channel ${channel}`,
					);
					digest.update(directionRow);
				}
			}
			const actualSha256 = digest.digest('hex');
			requireCondition(actualSha256 === scene.payloadSha256, `${scene.id} reconstructed payload hash differs.`);
			checkedByteLength += scene.payloadByteLength;
			await run.setPhase('scene-reconstruction', `Authenticated reconstructed ${scene.id}.`, {completed: sceneIndex + 1, total: source.scenes.length});
		}
	} finally {
		await canonical.close();
	}
	return {sceneCount: source.scenes.length, checkedByteLength, byteDifferenceCount: 0, matches: true};
}

/**
 * Called by evidence publication to remove private metadata bytes from a candidate summary.
 *
 * @param {CacheOptimizationE1BuiltCandidate} candidate - Complete internally built candidate.
 * @returns {CacheOptimizationE1CandidateSummary} - Public comparison fields only.
 */
function publicCandidate(candidate) {
	const {metadata, ...summary} = candidate;
	return summary;
}

/**
 * Called during terminal publication to render the human-readable E1 report.
 *
 * @param {CacheOptimizationE1Result} result - Accepted terminal E1 result.
 * @returns {string} - Markdown evidence report.
 */
function report(result) {
	const winner = result.recommendation;
	return `# ${result.runId}: E1 Format And Compression\n\nConclusion: **accepted**.\n\nAll ${result.exactness.sceneCount} scene payloads reconstructed byte-for-byte. All ${result.candidates.length} layout/profile candidates round-tripped every block.\n\n## Recommendation\n\nUse **${winner.layoutId} tiles with Zstandard level ${winner.zstandardLevel}** and the float32 byte-lane shuffle. The complete candidate is ${winner.completeByteLength.toLocaleString('en-US')} bytes, including ${winner.metadataByteLength.toLocaleString('en-US')} metadata bytes.\n\nThe result is contained E1 evidence, not production authorization. E2 must qualify browser decoding, request coalescing, cancellation, and the 64 MiB retention policy.\n`;
}

/**
 * Runs the complete E1 evidence lifecycle and seals either accepted or failed evidence.
 * Rejects after sealing a failed run when any authentication, construction, verification, or publication step fails.
 *
 * @returns {Promise<void>} - Completion after terminal publication.
 */
async function main() {
	await Promise.all([
		requireRealDirectory(EXPERIMENT_SOURCE_ROOT, 'Experiment source root'),
		requireRealDirectory(CONTROL_PACKAGE_ROOT, 'Control package root'),
	]);
	const [contractValue, productionCatalogValue, sourceCatalogIdentity, git, implementation] = await Promise.all([
		readRepositoryJson(E1_CANDIDATE_CONTRACT_PATH, 'E1 candidate contract'),
		readRepositoryJson(CONTROL_CATALOG_PATH, 'Production runtime catalog'),
		pinRepositoryFile(CONTROL_CATALOG_PATH),
		gitIdentity(),
		Promise.all([
			E1_CANDIDATE_CONTRACT_PATH,
			'experiments/distant-sun-cache-optimization/consts.js',
			'experiments/distant-sun-cache-optimization/types.d.ts',
			'experiments/distant-sun-cache-optimization/lib/CacheOptimizationContracts.js',
			'experiments/distant-sun-cache-optimization/lib/CacheOptimizationContainedFiles.js',
			'experiments/distant-sun-cache-optimization/lib/CacheOptimizationByteShuffle.js',
			'experiments/distant-sun-cache-optimization/lib/CacheOptimizationE1CandidateVerifier.js',
			'experiments/distant-sun-cache-optimization/lib/ExperimentRun.js',
			'experiments/distant-sun-cache-optimization/lib/ExperimentRunAllocation.js',
			'experiments/distant-sun-cache-optimization/lib/ExperimentRunHeartbeat.js',
			'experiments/distant-sun-cache-optimization/lib/ExperimentRunTerminalPublisher.js',
			'experiments/distant-sun-cache-optimization/run-e1-format-compression.js',
			'experiments/distant-sun-cache-optimization/verify-e1-contracts.js',
			'experiments/distant-sun-cache-optimization/verify-run.js',
			PRODUCTION_DESIGN_PATH,
			PRODUCTION_PLAN_PATH,
		].map(pinRepositoryFile)),
	]);
	const contract = acceptE1CandidateContract(contractValue);
	const productionCatalog = acceptRuntimeCatalog(productionCatalogValue);
	const productionBinning = requireRecord(productionCatalog.binning, 'Production catalog binning');
	const catalogSelection = acceptE1CatalogSelection({
		kind: productionBinning.kind,
		darkFromSolarZenithDegrees: productionCatalog.darkFromSolarZenithDegrees,
		startSolarZenithDegrees: productionBinning.startSolarZenithDegrees,
		endSolarZenithDegrees: productionBinning.endSolarZenithDegrees,
		incrementDegrees: productionBinning.incrementDegrees,
		minimumInputDegrees: productionBinning.minimumInputDegrees,
		maximumInputExclusiveDegrees: productionBinning.maximumInputExclusiveDegrees,
	});
	const generator = implementation.find(
		(identity) => identity.path === 'experiments/distant-sun-cache-optimization/run-e1-format-compression.js',
	);
	requireCondition(generator, 'E1 generator identity is missing from the implementation set.');
	const build = {
		generator,
		implementationSetSha256: sha256(jsonBytes(implementation)),
		sourceCatalog: sourceCatalogIdentity,
	};
	const c0Verification = await verifySealedRun(
		path.dirname(path.join(REPOSITORY_ROOT, C0_ACCEPTED_MANIFEST_PATH)),
		contract.acceptedC0.runId,
	);
	requireCondition(c0Verification.artifactSetSha256 === contract.acceptedC0.artifactSetSha256, 'Accepted C0 artifact-set identity changed.');
	const inventory = acceptInventoryPins(
		await readRepositoryJson(C0_ACCEPTED_INVENTORY_PATH, 'Accepted C0 inventory'),
	);
	requireCondition(
		Math.max(...inventory.packages.map((packagePin) => packagePin.payload.byteLength)) ===
			contract.bounds.maximumScenePayloadByteLength,
		'E1 scene-payload bound differs from the accepted C0 maximum.',
	);
	const run = await ExperimentRun.create({
		slug: RUN_SLUG,
		command: COMMAND,
		inputs: {schemaId: 'distant-sun-cache-optimization-e1-inputs-v1', contract, acceptedC0: contract.acceptedC0, inventory: {path: C0_ACCEPTED_INVENTORY_PATH, sha256: await sha256File(await requireContainedRealFile(REPOSITORY_ROOT, C0_ACCEPTED_INVENTORY_PATH, 'Accepted C0 inventory'))}},
		provenance: {schemaId: 'distant-sun-cache-optimization-e1-provenance-v1', operation: 'extract one canonical copy of each frozen coordinate, tile it under every declared layout, apply reversible byte-lane shuffle and each pinned Zstandard profile, round-trip every block, and reconstruct every scene identity', implementation, git},
		environment: {schemaId: 'distant-sun-cache-optimization-e1-environment-v1', node: process.version, zstandard: process.versions.zstd, versions: process.versions, platform: process.platform, architecture: process.arch, logicalCpuCount: os.cpus().length, cpuModel: os.cpus()[0]?.model ?? null, totalMemoryBytes: os.totalmem()},
		references: {schemaId: 'distant-sun-cache-optimization-e1-references-v1', acceptedC0: contract.acceptedC0, productionDesign: PRODUCTION_DESIGN_PATH, productionPlan: PRODUCTION_PLAN_PATH},
	});
	run.startHeartbeat();
	let scratchCreated = false;
	try {
		const started = performance.now();
		const scratchDirectory = await run.createScratchDirectory(SCRATCH_NAME);
		scratchCreated = true;
		const shuffleProof = verifyByteShuffleContract();
		await run.writeJsonArtifact('evidence/byte-shuffle-proof.json', shuffleProof);
		const source = await loadInventory(run, inventory);
		const canonicalPath = await buildCanonicalStore(run, scratchDirectory, inventory, source);
		const canonicalExactness = await verifyScenes(run, canonicalPath, source, inventory);
		const candidates = [];
		for (const layout of contract.layouts) {
			for (const level of contract.zstandardLevels) {
				candidates.push(
					await buildCandidate(
						run,
						canonicalPath,
						source,
						inventory,
						layout,
						level,
						contract,
						false,
						build,
						catalogSelection,
					),
				);
			}
		}
		const coalescedCandidate = candidates.find(
			(candidate) => candidate.uniqueBlockArtifactCount < candidate.blockCount,
		);
		requireCondition(
			coalescedCandidate !== undefined,
			'E1 matrix contains no repeated block content with which to prove artifact-addressed coalescing.',
		);
		await run.writeJsonArtifact('evidence/artifact-coalescing-proof.json', {
			schemaId: 'distant-sun-cache-optimization-e1-artifact-coalescing-proof-v1',
			candidateId: coalescedCandidate.id,
			logicalBlockCount: coalescedCandidate.blockCount,
			uniqueBlockArtifactCount: coalescedCandidate.uniqueBlockArtifactCount,
			coalescedLogicalBlockCount:
				coalescedCandidate.blockCount - coalescedCandidate.uniqueBlockArtifactCount,
			requestIdentity: 'candidate-relative content-addressed block path',
		});
		const passing = candidates.filter((candidate) => candidate.completeByteLength <= contract.bounds.maximumCompleteByteLength && candidate.maximumDecodedBlockByteLength <= contract.bounds.maximumDecodedBlockByteLength);
		requireCondition(passing.length > 0, 'No E1 candidate meets the declared storage and decoded-block bounds.');
		passing.sort((left, right) => left.completeByteLength - right.completeByteLength);
		const minimumCompleteByteLength = passing[0].completeByteLength;
		const materialCandidates = passing.filter(
			(candidate) =>
				candidate.completeByteLength <=
				minimumCompleteByteLength * (1 + contract.selectionPolicy.maximumGrowthRatioFromMinimum),
		);
		materialCandidates.sort(
			(left, right) =>
				left.requests.cold.encodedByteLength - right.requests.cold.encodedByteLength ||
				left.requests.cold.requestCount - right.requests.cold.requestCount ||
				left.codec.encodeMilliseconds - right.codec.encodeMilliseconds,
		);
		const selected = materialCandidates[0];
		await run.setPhase('candidate-publication', `Regenerating selected ${selected.id} artifacts.`);
		const selectedLayout = contract.layouts.find((layout) => layout.id === selected.layoutId);
		const published = await buildCandidate(
			run,
			canonicalPath,
			source,
			inventory,
			selectedLayout,
			selected.zstandardLevel,
			contract,
			true,
			build,
			catalogSelection,
		);
		requireCondition(published.completeByteLength === selected.completeByteLength, 'Selected candidate regeneration size changed.');
		requireCondition(
			published.metadata.identitySha256 === selected.metadata.identitySha256,
			'Selected candidate metadata changed during publication.',
		);
		await run.setPhase('published-verification', 'Authenticating and reconstructing the serialized candidate graph.');
		const publishedVerification = await new CacheOptimizationE1CandidateVerifier(
			path.join(run.runDirectory, 'candidate'),
			{
				decodedRetentionByteLength: contract.bounds.decodedRetentionByteLength,
				maximumCompleteByteLength: contract.bounds.maximumCompleteByteLength,
				maximumScenePayloadByteLength: contract.bounds.maximumScenePayloadByteLength,
				onSceneVerified: (completed, total, sceneId) => run.setPhase('published-verification', `Authenticated published scene ${sceneId}.`, {completed, total}),
			},
		).verify(published.metadata.artifacts[0].identity, contract.acceptedC0, inventory);
		const exactness = {
			sceneCount: publishedVerification.sceneCount,
			checkedByteLength: publishedVerification.checkedByteLength,
			byteDifferenceCount: publishedVerification.byteDifferenceCount,
			matches: publishedVerification.matches,
		};
		requireCondition(
			JSON.stringify(exactness) === JSON.stringify(canonicalExactness),
			'Published candidate exactness differs from the authenticated canonical control.',
		);
		await run.writeJsonArtifact('evidence/candidate-comparison.json', {schemaId: 'distant-sun-cache-optimization-e1-candidate-comparison-v1', candidates: candidates.map(publicCandidate)});
		await run.writeJsonArtifact('evidence/exactness.json', {schemaId: 'distant-sun-cache-optimization-e1-exactness-v2', ...exactness, distinctCoordinateCount: publishedVerification.distinctCoordinateCount, canonicalOwnershipCount: source.coordinates.size, candidateRoundTripCount: candidates.reduce((sum, candidate) => sum + candidate.exactBlockCount, 0), publishedGraph: publishedVerification});
		await run.removeScratchDirectory(SCRATCH_NAME);
		scratchCreated = false;
		const totalElapsedMilliseconds = performance.now() - started;
		const result = acceptE1Result({
			schemaId: 'distant-sun-cache-optimization-e1-result-v2',
			runId: run.runId,
			conclusion: 'accepted',
			accepted: true,
			parent: contract.acceptedC0,
			exactness,
			candidates: candidates.map(publicCandidate),
			recommendation: publicCandidate(selected),
			bounds: {
				...contract.bounds,
				completeByteLengthPasses: published.completeByteLength <= contract.bounds.maximumCompleteByteLength,
				decodedBlockByteLengthPasses:
					published.maximumDecodedBlockByteLength <= contract.bounds.maximumDecodedBlockByteLength,
				scenePayloadByteLengthPasses:
					Math.max(...source.scenes.map((scene) => scene.payloadByteLength)) <=
					contract.bounds.maximumScenePayloadByteLength,
				totalElapsedMillisecondsPasses:
					totalElapsedMilliseconds <= contract.bounds.maximumTotalElapsedMilliseconds,
			},
			totalElapsedMilliseconds,
			claimBoundary: 'Contained E1 format, compression, metadata, modeled-request, and exact-reconstruction evidence only; browser transport and bounded fresh generation remain unqualified.',
		});
		const manifest = await run.finalize({conclusion: 'accepted', result, report: report(result)});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, recommendation: result.recommendation, exactness, totalElapsedMilliseconds: result.totalElapsedMilliseconds}, null, 2)}\n`);
	} catch (error) {
		if (scratchCreated) await run.removeScratchDirectory(SCRATCH_NAME).catch(() => undefined);
		const result = {schemaId: 'distant-sun-cache-optimization-e1-result-v2', runId: run.runId, conclusion: /** @type {'failed'} */ ('failed'), accepted: false, error: {name: error?.name ?? typeof error, message: error?.message ?? String(error), stack: error?.stack ?? null}};
		await run.finalize({conclusion: 'failed', result, report: `# ${run.runId}: E1 Format And Compression\n\nConclusion: **failed**.\n\n${requireString(result.error.name, 'Error name')}: ${requireString(result.error.message, 'Error message')}\n`});
		throw error;
	}
}

await main();
