import {createHash} from 'node:crypto';
import {readFile, stat} from 'node:fs/promises';
import {zstdDecompressSync} from 'node:zlib';
import {E1_DIRECTION_ROW_BYTE_LENGTH} from '../consts.js';
import CacheOptimizationByteShuffle from './CacheOptimizationByteShuffle.js';
import CacheOptimizationContainedFiles from './CacheOptimizationContainedFiles.js';
import CacheOptimizationContracts from './CacheOptimizationContracts.js';

const {requireContainedRealFile, requireRealDirectory, sha256File} = CacheOptimizationContainedFiles;
const {
	acceptE1BlockIndex,
	acceptE1ConfigurationManifest,
	acceptE1PackageSetReport,
	acceptE1RuntimeCatalog,
	acceptE1SceneManifest,
	acceptFileIdentity,
	acceptInventoryPins,
} = CacheOptimizationContracts;

/** Read-only consumer that validates and reconstructs one published E1 candidate graph. */
export default class CacheOptimizationE1CandidateVerifier {
	/**
	 * Candidate publication root owned by this verifier.
	 * @type {string}
	 */
	_candidateRoot;
	/**
	 * Maximum decoded bytes retained by the LRU.
	 * @type {number}
	 */
	_retentionByteLength;
	/**
	 * Maximum complete serialized candidate bytes.
	 * @type {number}
	 */
	_maximumCompleteByteLength;
	/**
	 * Maximum reconstructed bytes allocated for one scene.
	 * @type {number}
	 */
	_maximumScenePayloadByteLength;
	/**
	 * Decoded-block LRU keyed by logical block index.
	 * @type {Map<number, Buffer>}
	 */
	_decodedBlocks = new Map();
	/**
	 * Current decoded bytes retained by the LRU.
	 * @type {number}
	 */
	_retainedByteLength = 0;
	/**
	 * Encoded artifact paths authenticated during this traversal.
	 * @type {Set<string>}
	 */
	_authenticatedEncodedPaths = new Set();
	/**
	 * Scene progress observer.
	 * @type {CacheOptimizationE1SceneVerifiedOperation}
	 */
	_onSceneVerified;

	/**
	 * Creates a verifier over one real candidate root and a byte-weighted decoded-block limit.
	 *
	 * @param {string} candidateRoot - Absolute candidate publication root.
	 * @param {CacheOptimizationE1CandidateVerificationPolicy} policy - Allocation limits and optional progress observer.
	 * @throws {TypeError} When the root or policy fields have invalid runtime types or bounds.
	 */
	constructor(candidateRoot, policy) {
		if (typeof candidateRoot !== 'string' || candidateRoot.length === 0) throw new TypeError('E1 candidate root must be a nonempty string.');
		if (!Number.isSafeInteger(policy?.decodedRetentionByteLength) || policy.decodedRetentionByteLength <= 0) throw new TypeError('E1 verifier retention limit must be a positive safe integer.');
		if (!Number.isSafeInteger(policy.maximumCompleteByteLength) || policy.maximumCompleteByteLength <= 0) throw new TypeError('E1 verifier complete-size limit must be a positive safe integer.');
		if (!Number.isSafeInteger(policy.maximumScenePayloadByteLength) || policy.maximumScenePayloadByteLength <= 0) throw new TypeError('E1 verifier scene-payload limit must be a positive safe integer.');
		if (policy.onSceneVerified !== undefined && typeof policy.onSceneVerified !== 'function') throw new TypeError('E1 verifier scene observer must be a function.');
		this._candidateRoot = candidateRoot;
		this._retentionByteLength = policy.decodedRetentionByteLength;
		this._maximumCompleteByteLength = policy.maximumCompleteByteLength;
		this._maximumScenePayloadByteLength = policy.maximumScenePayloadByteLength;
		this._onSceneVerified = policy.onSceneVerified ?? (async () => undefined);
	}

	/**
	 * Call this method to authenticate the complete metadata graph and reconstruct all scenes from published blocks.
	 * Rejects malformed schemas, escaped paths, identity mismatches, incoherent ownership, invalid segments, codec failures, and reconstructed payload differences; callers must reject the candidate without modifying it.
	 *
	 * @param {CacheOptimizationFileIdentity} packageSetIdentity - Root package-set report identity.
	 * @param {CacheOptimizationE1ParentIdentity} expectedParent - Required immutable C0 parent.
	 * @param {unknown} expectedInventory - Frozen C0 inventory oracle.
	 * @returns {Promise<CacheOptimizationE1CandidateVerification>} - Complete semantic and exactness verification.
	 */
	async verify(packageSetIdentity, expectedParent, expectedInventory) {
		this._decodedBlocks.clear();
		this._retainedByteLength = 0;
		this._authenticatedEncodedPaths.clear();
		await requireRealDirectory(this._candidateRoot, 'E1 candidate root');
		const packageSet = acceptE1PackageSetReport(await this._readJson(packageSetIdentity, 'E1 package-set report'));
		const inventory = acceptInventoryPins(expectedInventory);
		if (JSON.stringify(packageSet.parent) !== JSON.stringify(expectedParent)) throw new Error('E1 package-set parent differs from the accepted control.');
		const configuration = acceptE1ConfigurationManifest(await this._readJson(packageSet.configuration, 'E1 configuration'));
		const catalog = acceptE1RuntimeCatalog(await this._readJson(packageSet.catalog, 'E1 runtime catalog'));
		const blockIndex = acceptE1BlockIndex(await this._readJson(configuration.blockIndex, 'E1 block index'));
		if (
			packageSet.configurationIdentity !== configuration.configurationIdentity ||
			JSON.stringify(packageSet.codec) !== JSON.stringify(configuration.codec)
		) {
			throw new Error('E1 package-set configuration or codec identity differs from its manifest.');
		}
		const catalogSelectionIdentity = createHash('sha256')
			.update(`${JSON.stringify(catalog.selection, null, 2)}\n`)
			.digest('hex');
		if (packageSet.catalogSelectionIdentity !== catalogSelectionIdentity) {
			throw new Error('E1 package-set catalog-selection identity differs from its catalog.');
		}
		const configurationSummary = this._validateConfiguration(configuration, blockIndex, expectedParent);
		const scenes = [];
		const metadataIdentities = [
			packageSetIdentity,
			packageSet.configuration,
			packageSet.catalog,
			configuration.blockIndex,
		];
		const metadataPaths = new Set(metadataIdentities.map((identity) => identity.path));
		if (metadataPaths.size !== metadataIdentities.length) throw new Error('E1 fixed metadata path is reused.');
		let metadataArtifactByteLength = metadataIdentities.reduce((sum, identity) => sum + identity.byteLength, 0);
		const sceneIds = new Set();
		for (const entry of catalog.scenes) {
			if (metadataPaths.has(entry.manifest.path)) throw new Error(`E1 metadata path is reused: ${entry.manifest.path}`);
			metadataPaths.add(entry.manifest.path);
			metadataArtifactByteLength += entry.manifest.byteLength;
			if (metadataArtifactByteLength + configurationSummary.encodedByteLength > this._maximumCompleteByteLength) {
				throw new Error('E1 complete candidate exceeds the configured size limit.');
			}
			if (sceneIds.has(entry.id)) throw new Error(`E1 catalog scene is duplicated: ${entry.id}`);
			sceneIds.add(entry.id);
			const scene = acceptE1SceneManifest(await this._readJson(entry.manifest, `E1 scene ${entry.id}`));
			if (scene.id !== entry.id || scene.representativeSolarZenithDegrees !== entry.representativeSolarZenithDegrees) throw new Error(`E1 catalog identity differs for ${entry.id}.`);
			const expectedPackage = inventory.packages[scenes.length];
			const ledgerSha256 = createHash('sha256').update(`${JSON.stringify(scene.ledger, null, 2)}\n`).digest('hex');
			if (
				scene.id !== expectedPackage.id ||
				scene.representativeSolarZenithDegrees !== expectedPackage.representativeSolarZenithDegrees ||
				scene.sourceManifestSha256 !== expectedPackage.manifest.sha256 ||
				scene.payloadSha256 !== expectedPackage.payload.sha256 ||
				scene.payloadByteLength !== expectedPackage.payload.byteLength ||
				ledgerSha256 !== expectedPackage.ledger.sha256 ||
				configuration.directionLayout.logicalToUniqueIndexSha256 !== expectedPackage.logicalToUniqueIndex.sha256
			) {
				throw new Error(`E1 published scene differs from the frozen C0 oracle: ${scene.id}`);
			}
			this._validateScene(scene, blockIndex, configuration);
			scenes.push(scene);
		}
		const exactness = await this._reconstructScenes(scenes, blockIndex, configuration);
		const artifactPaths = [...metadataPaths, ...this._authenticatedEncodedPaths].sort();
		return {
			packageSet: packageSetIdentity,
			artifactPaths,
			layoutId: configuration.layout.id,
			zstandardLevel: configuration.codec.level,
			metadataArtifactCount: 4 + scenes.length,
			metadataByteLength: metadataArtifactByteLength,
			blockCount: blockIndex.blocks.length,
			uniqueBlockArtifactCount: configurationSummary.uniqueBlockArtifactCount,
			encodedByteLength: configurationSummary.encodedByteLength,
			completeByteLength: metadataArtifactByteLength + configurationSummary.encodedByteLength,
			maximumDecodedBlockByteLength: configurationSummary.maximumDecodedBlockByteLength,
			distinctCoordinateCount: blockIndex.distinctCoordinateCount,
			...exactness,
		};
	}

	/**
	 * Called by graph traversal to read and authenticate one referenced JSON artifact.
	 *
	 * @param {CacheOptimizationFileIdentity} identity - Candidate-relative artifact identity.
	 * @param {string} label - Stable diagnostic label.
	 * @returns {Promise<CacheOptimizationJsonObject>} - Parsed authenticated JSON document.
	 */
	async _readJson(identity, label) {
		const accepted = acceptFileIdentity(identity, `${label} identity`);
		if (accepted.byteLength > this._maximumCompleteByteLength) throw new Error(`${label} exceeds the complete-size limit.`);
		const target = await requireContainedRealFile(this._candidateRoot, accepted.path, label);
		const information = await stat(target);
		if (information.size !== accepted.byteLength || (await sha256File(target)) !== accepted.sha256) throw new Error(`${label} identity differs.`);
		return JSON.parse(await readFile(target, 'utf8'));
	}

	/**
	 * Called by verification to enforce configuration identity, dimensions, coordinate ownership, and block derivation.
	 *
	 * @param {CacheOptimizationE1ConfigurationManifest} configuration - Accepted candidate configuration.
	 * @param {CacheOptimizationE1BlockIndex} blockIndex - Accepted block index.
	 * @param {CacheOptimizationE1ParentIdentity} expectedParent - Required C0 parent.
	 * @returns {CacheOptimizationE1GraphSizeSummary} - Authenticated unique-block size summary.
	 */
	_validateConfiguration(configuration, blockIndex, expectedParent) {
		if (configuration.rowByteLength !== blockIndex.rowByteLength || configuration.distinctCoordinateCount !== blockIndex.distinctCoordinateCount) throw new Error('E1 configuration and block-index dimensions differ.');
		const facts = {
			atmosphereIdentity: configuration.atmosphereIdentity,
			geometryIdentity: configuration.geometryIdentity,
			groundIdentity: configuration.groundIdentity,
			numericalIdentity: configuration.numericalIdentity,
			directionLayout: configuration.directionLayout,
			spectralLayout: configuration.spectralLayout,
			coordinateDomains: configuration.coordinateDomains,
			blockGrid: configuration.blockGrid,
		};
		const identity = createHash('sha256').update(`${JSON.stringify(facts, null, 2)}\n`).digest('hex');
		if (identity !== configuration.configurationIdentity) throw new Error('E1 configuration identity differs.');
		const coordinates = new Set();
		const encodedArtifacts = new Map();
		const altitudeFirst = configuration.coordinateDomains.altitude.firstIndex;
		const altitudeLimit = altitudeFirst + configuration.coordinateDomains.altitude.count;
		const solarFirst = configuration.coordinateDomains.solarZenith.firstIndex;
		const solarLimit = solarFirst + configuration.coordinateDomains.solarZenith.count;
		for (const block of blockIndex.blocks) {
			if (
				block.tile.altitudeIndex < altitudeFirst ||
				block.tile.altitudeIndex >= altitudeLimit ||
				(block.tile.altitudeIndex - altitudeFirst) % configuration.layout.altitudeCount !== 0 ||
				block.tile.solarZenithIndex < solarFirst ||
				block.tile.solarZenithIndex >= solarLimit ||
				(block.tile.solarZenithIndex - solarFirst) % configuration.layout.solarZenithCount !== 0
			) {
				throw new Error(`E1 block tile lies outside or is misaligned with its coordinate domains: ${block.id}`);
			}
			if (block.id !== `${identity}:${Math.floor(block.tile.altitudeIndex / configuration.layout.altitudeCount)}:${Math.floor(block.tile.solarZenithIndex / configuration.layout.solarZenithCount)}`) throw new Error(`E1 block logical identity differs: ${block.id}`);
			if (block.decodedByteLength !== block.rowCount * blockIndex.rowByteLength || block.decodedByteLength > 16_777_216) throw new Error(`E1 block decoded size is invalid: ${block.id}`);
			if (block.path !== `blocks/${block.encodedSha256}.zst` || block.derivation.configurationIdentity !== identity || block.derivation.parentRunId !== expectedParent.runId || block.derivation.parentArtifactSetSha256 !== expectedParent.artifactSetSha256) throw new Error(`E1 block derivation is invalid: ${block.id}`);
			if (block.encodedByteLength > this._maximumCompleteByteLength) throw new Error(`E1 encoded block exceeds the complete-size limit: ${block.id}`);
			const priorEncodedLength = encodedArtifacts.get(block.path);
			if (priorEncodedLength !== undefined && priorEncodedLength !== block.encodedByteLength) throw new Error(`E1 content-addressed block lengths disagree: ${block.path}`);
			encodedArtifacts.set(block.path, block.encodedByteLength);
			for (const coordinate of block.coordinates) {
				const key = `${coordinate[0]}:${coordinate[1]}`;
				if (
					coordinate[0] < altitudeFirst ||
					coordinate[0] >= altitudeLimit ||
					coordinate[1] < solarFirst ||
					coordinate[1] >= solarLimit
				) {
					throw new Error(`E1 coordinate lies outside its declared domains: ${key}`);
				}
				if (coordinate[0] < block.tile.altitudeIndex || coordinate[0] >= block.tile.altitudeIndex + configuration.layout.altitudeCount || coordinate[1] < block.tile.solarZenithIndex || coordinate[1] >= block.tile.solarZenithIndex + configuration.layout.solarZenithCount) throw new Error(`E1 coordinate lies outside its tile: ${key}`);
				if (coordinates.has(key)) throw new Error(`E1 coordinate has multiple owners: ${key}`);
				coordinates.add(key);
			}
		}
		const encodedByteLength = [...encodedArtifacts.values()].reduce((sum, value) => sum + value, 0);
		if (encodedByteLength > this._maximumCompleteByteLength) throw new Error('E1 encoded artifact set exceeds the complete-size limit.');
		if (coordinates.size !== blockIndex.distinctCoordinateCount) throw new Error('E1 canonical coordinate ownership is incomplete.');
		return {
			uniqueBlockArtifactCount: encodedArtifacts.size,
			encodedByteLength,
			maximumDecodedBlockByteLength: Math.max(...blockIndex.blocks.map((block) => block.decodedByteLength)),
		};
	}

	/**
	 * Called by graph traversal to validate one scene's compatibility, ledger, and block segments.
	 *
	 * @param {CacheOptimizationE1SceneManifest} scene - Accepted scene manifest.
	 * @param {CacheOptimizationE1BlockIndex} blockIndex - Accepted block index.
	 * @param {CacheOptimizationE1ConfigurationManifest} configuration - Accepted candidate configuration.
	 * @returns {void}
	 */
	_validateScene(scene, blockIndex, configuration) {
		for (const key of ['atmosphereIdentity', 'geometryIdentity', 'groundIdentity', 'numericalIdentity']) {
			if (scene.compatibility[key] !== configuration[key]) throw new Error(`E1 scene compatibility differs from its configuration: ${scene.id}`);
		}
		if (
			scene.selection.representativeSolarZenithDegrees !== scene.representativeSolarZenithDegrees ||
			scene.sceneSun.id !== scene.id ||
			scene.ledger.sceneSun.id !== scene.id ||
			JSON.stringify(scene.sceneSun) !== JSON.stringify(scene.ledger.sceneSun)
		) {
			throw new Error(`E1 scene identity is incoherent: ${scene.id}`);
		}
		let rowCount = 0;
		const actualCoordinates = [];
		for (const segment of scene.segments) {
			const block = blockIndex.blocks[segment.blockIndex];
			if (!block || segment.rowCount === 0 || segment.firstBlockRow + segment.rowCount > block.rowCount) throw new Error(`E1 scene segment is outside its block: ${scene.id}`);
			rowCount += segment.rowCount;
			actualCoordinates.push(...block.coordinates.slice(segment.firstBlockRow, segment.firstBlockRow + segment.rowCount));
		}
		if (
			rowCount !== scene.ledger.retainedBlockCount ||
			scene.payloadByteLength !== rowCount * blockIndex.rowByteLength ||
			scene.payloadByteLength > this._maximumScenePayloadByteLength
		) {
			throw new Error(`E1 scene row dimensions or allocation bound differ: ${scene.id}`);
		}
		const expectedCoordinates = [];
		for (const row of scene.ledger.rows) {
			for (let solarZenithIndex = row.firstSolarZenithIndex; solarZenithIndex <= row.lastSolarZenithIndex; solarZenithIndex += 1) expectedCoordinates.push([row.altitudeIndex, solarZenithIndex]);
		}
		if (JSON.stringify(actualCoordinates) !== JSON.stringify(expectedCoordinates)) throw new Error(`E1 scene segments differ from its source ledger: ${scene.id}`);
	}

	/**
	 * Called by exactness verification to obtain one authenticated decoded block through the bounded LRU.
	 *
	 * @param {number} blockIndexValue - Zero-based logical block index.
	 * @param {CacheOptimizationE1Block} block - Accepted block descriptor.
	 * @returns {Promise<Buffer>} - Authenticated unshuffled block bytes.
	 */
	async _decodedBlock(blockIndexValue, block) {
		const retained = this._decodedBlocks.get(blockIndexValue);
		if (retained) {
			this._decodedBlocks.delete(blockIndexValue);
			this._decodedBlocks.set(blockIndexValue, retained);
			return retained;
		}
		const encodedPath = await requireContainedRealFile(this._candidateRoot, block.path, `E1 block ${block.id}`);
		const information = await stat(encodedPath);
		if (information.size !== block.encodedByteLength) throw new Error(`E1 encoded block length differs: ${block.id}`);
		const encoded = await readFile(encodedPath);
		if (!this._authenticatedEncodedPaths.has(block.path)) {
			if (createHash('sha256').update(encoded).digest('hex') !== block.encodedSha256) throw new Error(`E1 encoded block identity differs: ${block.id}`);
			this._authenticatedEncodedPaths.add(block.path);
		}
		const decoded = CacheOptimizationByteShuffle.inverse(
			zstdDecompressSync(encoded, {maxOutputLength: block.decodedByteLength}),
		);
		if (decoded.byteLength !== block.decodedByteLength || createHash('sha256').update(decoded).digest('hex') !== block.decodedSha256) throw new Error(`E1 decoded block identity differs: ${block.id}`);
		if (decoded.byteLength > this._retentionByteLength) throw new Error(`E1 decoded block exceeds the retention limit: ${block.id}`);
		while (this._retainedByteLength + decoded.byteLength > this._retentionByteLength && this._decodedBlocks.size > 0) {
			const oldestIndex = this._decodedBlocks.keys().next().value;
			const oldest = this._decodedBlocks.get(oldestIndex);
			this._decodedBlocks.delete(oldestIndex);
			this._retainedByteLength -= oldest.byteLength;
		}
		this._decodedBlocks.set(blockIndexValue, decoded);
		this._retainedByteLength += decoded.byteLength;
		return decoded;
	}

	/**
	 * Called by verification to reconstruct production wavelength-major payload hashes solely from published artifacts.
	 *
	 * @param {readonly CacheOptimizationE1SceneManifest[]} scenes - Ordered accepted scene manifests.
	 * @param {CacheOptimizationE1BlockIndex} blockIndex - Accepted block index.
	 * @param {CacheOptimizationE1ConfigurationManifest} configuration - Accepted executable layout contract.
	 * @returns {Promise<CacheOptimizationE1Exactness>} - Exact reconstruction summary.
	 */
	async _reconstructScenes(scenes, blockIndex, configuration) {
		const channelCount = configuration.spectralLayout.channelCount;
		const directionRowByteLength =
			configuration.directionLayout.uniqueDirectionCount * Float32Array.BYTES_PER_ELEMENT;
		if (directionRowByteLength !== E1_DIRECTION_ROW_BYTE_LENGTH) {
			throw new Error('E1 accepted direction row stride differs from the supported implementation.');
		}
		let checkedByteLength = 0;
		for (const [sceneIndex, scene] of scenes.entries()) {
			const sceneRowCount = scene.payloadByteLength / blockIndex.rowByteLength;
			const payload = Buffer.allocUnsafe(scene.payloadByteLength);
			let sceneRow = 0;
			for (const segment of scene.segments) {
				const block = blockIndex.blocks[segment.blockIndex];
				const decoded = await this._decodedBlock(segment.blockIndex, block);
				for (let channel = 0; channel < channelCount; channel += 1) {
					const firstByte = (channel * block.rowCount + segment.firstBlockRow) * directionRowByteLength;
					const targetByte = (channel * sceneRowCount + sceneRow) * directionRowByteLength;
					decoded.copy(payload, targetByte, firstByte, firstByte + segment.rowCount * directionRowByteLength);
				}
				sceneRow += segment.rowCount;
			}
			if (createHash('sha256').update(payload).digest('hex') !== scene.payloadSha256) throw new Error(`E1 published candidate reconstructs different bytes: ${scene.id}`);
			checkedByteLength += scene.payloadByteLength;
			await this._onSceneVerified(sceneIndex + 1, scenes.length, scene.id);
		}
		return {sceneCount: scenes.length, checkedByteLength, byteDifferenceCount: 0, matches: true};
	}
}
