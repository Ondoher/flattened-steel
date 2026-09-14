import {createHash} from 'node:crypto';
import {open} from 'node:fs/promises';
import DistantSunSharedCacheFormat from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheFormat.js';
import {
	DISTANT_SUN_SHARED_CACHE_PACKAGE_SET_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_CONFIGURATION_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_BLOCK_INDEX_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_SCENE_MANIFEST_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_RUNTIME_CATALOG_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_CODEC_PROFILE_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_DERIVATION_SCHEMA_ID,
} from '../../../src/algorithm32/implementation/distant-sun/cache/consts.js';
import DistantSunSharedCacheGenerationCodec from './DistantSunSharedCacheGenerationCodec.js';

/** Authenticated block and production-metadata graph finalizer. */
export default class DistantSunSharedCacheGenerationPackage {
	/**
	 * Run-owned finalization inputs and immutable derivation identities.
	 *
	 * @type {SharedGenerationPackageRequest}
	 */ _options;
	/**
	 * Selected exact block codec owned by this finalizer.
	 *
	 * @type {DistantSunSharedCacheGenerationCodec}
	 */ _codec = new DistantSunSharedCacheGenerationCodec();
	/**
	 * Production metadata parser used before artifact publication.
	 *
	 * @type {DistantSunSharedCacheFormat}
	 */ _format = new DistantSunSharedCacheFormat();

	/**
	 * Creates the finalizer for a complete private staging run.
	 *
	 * @param {SharedGenerationPackageRequest} options - Run-owned inputs and derivation identity.
	 */
	constructor(options) {
		this._options = options;
	}

	/**
	 * Writes an exclusive candidate artifact and returns its package-relative identity.
	 *
	 * @param {string} relativePath - Candidate-relative artifact path.
	 * @param {Uint8Array} bytes - Complete artifact.
	 * @returns {Promise<DistantSunSharedCacheFileIdentity>} - Package-relative identity.
	 */
	async _write(relativePath, bytes) {
		const result = await this._options.files.write(`${this._options.candidateRoot}/${relativePath}`, bytes);
		return {...result, path: relativePath};
	}

	/**
	 * Builds a complete derivation record rooted in the run's authenticated controls and implementation.
	 *
	 * @param {string} operationId - Stable operation identity.
	 * @param {string} equationId - Exact transformation description.
	 * @param {DistantSunSharedCacheDerivationOutput[]} outputs - Result identities.
	 * @param {DistantSunSharedCacheDerivationParent[]} [additionalParents] - Scene-specific immutable parents.
	 * @returns {DistantSunSharedCacheDerivation} - Complete derivation graph edge.
	 */
	_derivation(operationId, equationId, outputs, additionalParents = []) {
		return {
			schemaId: DISTANT_SUN_SHARED_CACHE_DERIVATION_SCHEMA_ID,
			parents: [...this._options.parents, ...additionalParents],
			operationId,
			equationId,
			implementation: this._options.implementation,
			tools: [
				{id: 'node', version: process.version},
				{id: 'zstandard', version: process.versions.zstd},
				{id: 'chrome', version: this._options.browserVersion},
			],
			parametersSha256: this._options.parametersSha256,
			outputs,
		};
	}

	/**
	 * Writes one content-addressed JSON node.
	 *
	 * @param {string} folder - Candidate subdirectory.
	 * @param {unknown} value - Accepted metadata.
	 * @returns {Promise<DistantSunSharedCacheFileIdentity>} - Candidate-relative identity.
	 */
	async _json(folder, value) {
		const bytes = Buffer.from(`${JSON.stringify(value)}\n`);
		return this._write(`${folder}/${this._options.files.hash(bytes)}.json`, bytes);
	}

	/** Reconstruct one scene's exact wavelength-major payload identity from private staging. */
	async _scenePayload(source, owners) {
		const handles = new Map();
		const rowBytes = 4058 * 4;
		const row = Buffer.alloc(rowBytes);
		const hash = createHash('sha256');
		try {
			for (let channel = 0; channel < 15; channel += 1) {
				for (const coordinate of source.coordinates) {
					const owner = owners.get(coordinate);
					if (!owner) throw new Error('Scene reconstruction omits a generated coordinate.');
					let handle = handles.get(owner.ordinal);
					if (!handle) {
						handle = await open(
							await this._options.files.resolve(
								`${this._options.stagingRoot}/block-${String(owner.ordinal).padStart(3, '0')}.f32`,
							),
							'r',
						);
						handles.set(owner.ordinal, handle);
					}
					let offset = 0;
					const position = (channel * owner.count + owner.row) * rowBytes;
					while (offset < rowBytes) {
						const result = await handle.read(row, offset, rowBytes - offset, position + offset);
						if (result.bytesRead === 0) throw new Error('Scene reconstruction staging was truncated.');
						offset += result.bytesRead;
					}
					hash.update(row);
				}
			}
			return {byteLength: source.coordinates.length * 15 * rowBytes, sha256: hash.digest('hex')};
		} finally {
			await Promise.all([...handles.values()].map((handle) => handle.close()));
		}
	}

	/**
	 * Call this method to finalize one block at a time and emit the validated package graph.
	 * Invalid staging, codec failure, I/O failure, or cancellation rejects; callers must leave the candidate unpublished.
	 *
	 * @returns {Promise<SharedGenerationPackageResult>} - Candidate metadata and complete byte accounting.
	 */
	async finalize() {
		const {files, inventory, candidateRoot, stagingRoot, implementation, signal, progress} = this._options;
		for (const folder of ['blocks', 'direction', 'indexes', 'scenes', 'configurations'])
			await files.directory(`${candidateRoot}/${folder}`);
		const codecProfile = {
			schemaId: DISTANT_SUN_SHARED_CACHE_CODEC_PROFILE_SCHEMA_ID,
			id: 'algorithm32-distant-sun-shared-cache-zstandard-level-6-v1',
			compression: 'zstandard',
			level: 6,
			shuffle: 'float32-byte-lane-v1',
			decodedScalar: 'float32-little-endian',
			implementation: {id: 'node-zstd', version: process.versions.zstd, sha256: implementation.sha256},
		};
		const physical = inventory.configuration;
		const configurationIdentity = files.hash(
			JSON.stringify({
				atmosphere: physical.atmosphereIdentity,
				geometry: physical.geometryIdentity,
				ground: physical.groundIdentity,
				numerical: physical.numericalIdentity,
				direction: files.hash(inventory.directionBytes),
				codecProfile,
				grid: [8, 8],
			}),
		);
		const blocks = [];
		let encodedBytes = 0;
		for (const [ordinal, source] of inventory.blocks.entries()) {
			signal.throwIfAborted();
			const decoded = await files.read(`${stagingRoot}/block-${String(ordinal).padStart(3, '0')}.f32`);
			if (decoded.byteLength !== source.coordinates.length * 4058 * 15 * 4)
				throw new Error('Final block length differs from its populated coordinates.');
			const encoded = this._codec.encode(decoded);
			const decodedIdentity = {byteLength: decoded.byteLength, sha256: files.hash(decoded)};
			const encodedIdentity = await this._write(`blocks/${files.hash(encoded)}.zst`, encoded);
			encodedBytes += encoded.byteLength;
			blocks.push({
				id: `algorithm32-distant-sun-shared-block:${configurationIdentity}:a${String(source.tile.altitudeIndex).padStart(2, '0')}:z${String(source.tile.solarZenithIndex).padStart(3, '0')}`,
				tile: source.tile,
				rowCount: source.coordinates.length,
				coordinates: source.coordinates,
				decoded: decodedIdentity,
				encoded: encodedIdentity,
				codecProfileId: codecProfile.id,
				shuffle: codecProfile.shuffle,
				derivation: this._derivation(
					'common-field-block-extraction',
					'J1+J2+J3+J4; logical-W27-to-exact-seam; wavelength-row-direction; byte-lane-shuffle; zstd-level-6',
					[
						{role: 'decoded-block', ...decodedIdentity},
						{role: 'encoded-block', byteLength: encodedIdentity.byteLength, sha256: encodedIdentity.sha256},
					],
				),
			});
			await progress({phase: 'compression', completed: ordinal + 1, total: inventory.blocks.length});
		}
		const blockIndex = {
			schemaId: DISTANT_SUN_SHARED_CACHE_BLOCK_INDEX_SCHEMA_ID,
			configurationIdentity,
			rowByteLength: 4058 * 15 * 4,
			distinctCoordinateCount: inventory.coordinates.length,
			blocks,
		};
		const indexArtifact = await this._json('indexes', blockIndex);
		const directionArtifact = await this._write('direction/logical-to-unique.u16', inventory.directionBytes);
		const configuration = {
			schemaId: DISTANT_SUN_SHARED_CACHE_CONFIGURATION_SCHEMA_ID,
			configurationIdentity,
			atmosphereIdentity: physical.atmosphereIdentity,
			geometryIdentity: physical.geometryIdentity,
			groundIdentity: physical.groundIdentity,
			numericalIdentity: physical.numericalIdentity,
			directionLayout: {
				id: 'algorithm32-distant-sun-w27-exact-seam-u16-v1',
				uniqueDirectionCount: 4058,
				logicalDirectionCount: 4374,
				logicalToUniqueIndex: directionArtifact,
			},
			spectralLayout: {
				id: 'Native15',
				channelCount: 15,
				order: 'wavelength-major',
				scalar: 'float32-little-endian',
			},
			coordinateDomains: {
				altitude: {firstIndex: 0, count: 48},
				solarZenith: {firstIndex: 0, count: 180, binWidthDegrees: 1},
			},
			blockGrid: {
				altitudeCount: 8,
				solarZenithCount: 8,
				coordinateOrder: 'altitude-then-solar-zenith',
				payloadOrder: 'wavelength-then-coordinate-then-direction',
				omitUnpopulatedCoordinates: true,
			},
			codecProfile,
			blockIndex: indexArtifact,
		};
		this._format.acceptBlockIndex(blockIndex, configuration);
		const configurationArtifact = await this._json('configurations', configuration);
		const owners = new Map();
		for (const [ordinal, block] of blocks.entries())
			for (const [row, coordinate] of block.coordinates.entries())
				owners.set(coordinate.join(':'), {id: block.id, ordinal, row, count: block.rowCount});
		const scenes = [];
		for (const [sceneOrdinal, source] of inventory.scenes.entries()) {
			signal.throwIfAborted();
			const reconstructedPayload = await this._scenePayload(source, owners);
			const scene = {
				schemaId: DISTANT_SUN_SHARED_CACHE_SCENE_MANIFEST_SCHEMA_ID,
				id: source.manifest.sceneSun.id,
				representativeSolarZenithDegrees: source.ordinal,
				selection: source.manifest.selection,
				sceneSun: source.manifest.sceneSun,
				compatibility: {
					configurationIdentity,
					atmosphereIdentity: physical.atmosphereIdentity,
					geometryIdentity: physical.geometryIdentity,
					groundIdentity: physical.groundIdentity,
					numericalIdentity: physical.numericalIdentity,
				},
				ledger: source.ledger,
				coordinates: source.coordinates.map((key) => key.split(':').map(Number)),
				requiredBlockIds: [...new Set(source.coordinates.map((key) => owners.get(key).id))],
				reconstructedPayload,
				derivation: this._derivation(
					'shared-block-scene-reconstruction',
					'scene-ledger-row-to-shared-block-row; wavelength-major-exact-Float32-copy',
					[{role: 'reconstructed-scene', ...reconstructedPayload}],
					[{role: 'control-scene-layout', artifact: source.manifestArtifact}],
				),
			};
			this._format.acceptSceneManifest(scene, configuration, blockIndex);
			scenes.push({
				id: scene.id,
				representativeSolarZenithDegrees: source.ordinal,
				manifest: await this._json('scenes', scene),
			});
			await progress({phase: 'scene-manifest', completed: sceneOrdinal + 1, total: inventory.scenes.length});
		}
		const catalog = {
			schemaId: DISTANT_SUN_SHARED_CACHE_RUNTIME_CATALOG_SCHEMA_ID,
			configurationIdentity,
			selection: {
				kind: 'ledger-covered-nearest-integer-half-up-v1',
				darkFromSolarZenithDegrees: 108,
				startSolarZenithDegrees: 0,
				endSolarZenithDegrees: 108,
				incrementDegrees: 1,
				minimumInputDegrees: 0,
				maximumInputExclusiveDegrees: 108,
			},
			scenes,
		};
		this._format.acceptRuntimeCatalog(catalog);
		const runtimeCatalog = await this._json('indexes', catalog);
		const packageSetIdentity = files.hash(JSON.stringify({configuration: configurationArtifact, runtimeCatalog}));
		const report = {
			schemaId: DISTANT_SUN_SHARED_CACHE_PACKAGE_SET_SCHEMA_ID,
			packageSetIdentity,
			derivation: this._derivation(
				'shared-package-set-finalization',
				'authenticated-block-index+configuration+ordered-scene-catalog',
				[
					{
						role: 'configuration',
						byteLength: configurationArtifact.byteLength,
						sha256: configurationArtifact.sha256,
					},
					{role: 'runtime-catalog', byteLength: runtimeCatalog.byteLength, sha256: runtimeCatalog.sha256},
				],
			),
			generator: implementation,
			codecProfile,
			configurations: [configurationArtifact],
			runtimeCatalog,
		};
		this._format.acceptPackageSetReport(report);
		const reportArtifact = await this._write('package-set.json', Buffer.from(`${JSON.stringify(report)}\n`));
		return {report, reportArtifact, configuration, blockIndex, catalog, encodedBytes};
	}
}
