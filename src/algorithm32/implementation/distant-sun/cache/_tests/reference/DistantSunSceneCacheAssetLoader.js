import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
	SOLAR_ZENITH_180_DOMAIN_OWNER,
} from '../../../../../sampling-domains/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../../../profiles/index.js';
import DistantSunSceneCache from '../../DistantSunSceneCache.js';
import DistantSunSceneCacheLedger from '../../DistantSunSceneCacheLedger.js';
import DistantSunSceneCacheManifest from '../../DistantSunSceneCacheManifest.js';

/** External asset loader and validator for one complete point-local distant-Sun cache. */
export default class DistantSunSceneCacheAssetLoader {
	/** @type {CacheGpuBackend} */ _backend;
	/** @type {string} */ _assetRoot;
	/** @type {typeof fetch} */ _fetch;
	/** @type {SubtleCrypto} */ _subtle;

	/** @param {DistantSunSceneCacheAssetLoaderDefinition} definition - Backend, asset root, and optional Web API adapters. */
	constructor(definition) {
		if (!definition.assetRoot) throw new TypeError('Distant-Sun scene-cache asset root is required.');
		this._backend = definition.backend;
		this._assetRoot = new URL(definition.assetRoot, globalThis.location?.href ?? 'http://localhost/').href;
		if (!this._assetRoot.endsWith('/')) this._assetRoot += '/';
		this._fetch = definition.fetch ?? globalThis.fetch.bind(globalThis);
		this._subtle = definition.subtleCrypto ?? globalThis.crypto.subtle;
	}

	/** @param {string} relativePath - Manifest-owned relative path. @returns {string} - Contained asset URL. */
	_resolve(relativePath) {
		if (!relativePath || relativePath.startsWith('/') || relativePath.includes('..')) {
			throw new RangeError('Distant-Sun scene-cache asset path must be relative and contained.');
		}
		const url = new URL(relativePath, this._assetRoot).href;
		if (!url.startsWith(this._assetRoot)) throw new RangeError('Distant-Sun scene-cache asset escapes its root.');
		return url;
	}

	/** @param {Uint8Array} bytes - Exact bytes. @returns {Promise<string>} - Lowercase SHA-256. */
	async _sha256(bytes) {
		const source = new Uint8Array(bytes.byteLength);
		source.set(bytes);
		const digest = new Uint8Array(await this._subtle.digest('SHA-256', source.buffer));
		return Array.from(digest, (value) => value.toString(16).padStart(2, '0')).join('');
	}

	/** @param {string} relativePath - Contained path. @param {AbortSignal | undefined} signal - Cancellation. */
	async _read(relativePath, signal) {
		const response = await this._fetch(this._resolve(relativePath), {signal});
		if (!response.ok) throw new Error(`Distant-Sun scene-cache asset load failed (${response.status}).`);
		return new Uint8Array(await response.arrayBuffer());
	}

	/**
	 * @param {string} relativePath - Contained payload path.
	 * @param {DistantSunSceneCachePayloadReference} reference - Accepted manifest reference.
	 * @param {AbortSignal | undefined} signal - Cancellation.
	 * @returns {Promise<Uint8Array>} - Exact validated bytes.
	 */
	async _readPayload(relativePath, reference, signal) {
		const bytes = await this._read(relativePath, signal);
		if (bytes.byteLength !== reference.byteLength || (await this._sha256(bytes)) !== reference.sha256) {
			throw new Error(`Distant-Sun scene-cache payload identity failed: ${relativePath}.`);
		}
		return bytes;
	}

	/**
	 * Repack 15 layer-major exact-seam channels into a logical face-grid RGBA atlas.
	 * The sixteenth component is exact zero padding and never enters spectral arithmetic.
	 *
	 * @param {Float32Array} values - Validated layer-major Native15 values.
	 * @param {Uint16Array} logicalToUnique - Logical W27 to exact-seam indices.
	 * @param {number} retainedBlockCount - Packed altitude/zenith rows.
	 * @returns {Float32Array} - Row-layered 648-by-27 RGBA32F atlas.
	 */
	_packRgbaChannels(values, logicalToUnique, retainedBlockCount) {
		const sourceLayerTexelCount = retainedBlockCount * 4058;
		const atlasWidth = 648;
		const packed = new Float32Array(retainedBlockCount * atlasWidth * 27 * 4);
		for (let rowIndex = 0; rowIndex < retainedBlockCount; rowIndex += 1) {
			for (let logicalIndex = 0; logicalIndex < 4374; logicalIndex += 1) {
				const faceIndex = Math.floor(logicalIndex / 729);
				const faceLocalIndex = logicalIndex - faceIndex * 729;
				const vIndex = Math.floor(faceLocalIndex / 27);
				const uIndex = faceLocalIndex - vIndex * 27;
				const uniqueIndex = logicalToUnique[logicalIndex];
				for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
					const value = values[channelIndex * sourceLayerTexelCount + rowIndex * 4058 + uniqueIndex];
					if (!Number.isFinite(value) || value < 0) {
						throw new RangeError('Distant-Sun scene-cache spectra must be finite and nonnegative.');
					}
					const groupIndex = Math.floor(channelIndex / 4);
					const componentIndex = channelIndex % 4;
					const atlasX = groupIndex * 162 + faceIndex * 27 + uIndex;
					packed[((rowIndex * 27 + vIndex) * atlasWidth + atlasX) * 4 + componentIndex] = value;
				}
			}
		}
		return packed;
	}

	/** @param {DistantSunSceneCacheManifest} manifest - Accepted manifest. @param {DistantSunSceneCacheLoadRequest} request - Exact requested identities. */
	_requireCompatibility(manifest, request) {
		manifest.requireCacheIdentity(request.cacheIdentity);
		const record = manifest.record;
		const expected = request.expected;
		if (
			JSON.stringify(record.sceneSun) !== JSON.stringify(expected.sceneSun) ||
			record.atmosphereIdentity !== expected.atmosphereIdentity ||
			record.geometryIdentity !== expected.geometryIdentity ||
			record.groundIdentity !== expected.groundIdentity ||
			record.numericalIdentity !== expected.numericalIdentity
		) {
			throw new RangeError('Distant-Sun scene-cache manifest is physically incompatible with the request.');
		}
	}

	/**
	 * Load, validate, upload, and return one complete cache without publishing a partial result.
	 *
	 * @param {DistantSunSceneCacheLoadRequest} request - Content-addressed manifest and exact compatibility request.
	 * @returns {Promise<DistantSunSceneCache>} - Completely uploaded point-local cache.
	 */
	async load(request) {
		const manifestBytes = await this._read(request.manifestPath, request.signal);
		if ((await this._sha256(manifestBytes)) !== request.manifestSha256) {
			throw new Error('Distant-Sun scene-cache manifest hash is incompatible.');
		}
		const manifest = new DistantSunSceneCacheManifest(
			JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(manifestBytes)),
		);
		this._requireCompatibility(manifest, request);

		const ledgerBytes = await this._read(manifest.record.ledgerPath, request.signal);
		if ((await this._sha256(ledgerBytes)) !== manifest.record.ledgerSha256) {
			throw new Error('Distant-Sun scene-cache ledger hash is incompatible.');
		}
		const ledger = DistantSunSceneCacheLedger.fromRecord(
			JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(ledgerBytes)),
			{
				positionDomain: NATIVE_48_POSITION_DOMAIN_OWNER,
				solarZenithDomain: SOLAR_ZENITH_180_DOMAIN_OWNER,
				outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
				spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			},
		);
		if (JSON.stringify(ledger.sceneSun) !== JSON.stringify(manifest.record.sceneSun)) {
			throw new RangeError('Distant-Sun scene-cache ledger and manifest identify different Sun states.');
		}

		const [seamBytes, indexBytes] = await Promise.all([
			this._readPayload(manifest.record.exactSeamPayload.path, manifest.record.exactSeamPayload, request.signal),
			this._readPayload(
				manifest.record.logicalToUniqueIndex.path,
				manifest.record.logicalToUniqueIndex,
				request.signal,
			),
		]);
		const expectedSeamBytes = ledger.retainedBlockCount * 4058 * 15 * Float32Array.BYTES_PER_ELEMENT;
		if (
			seamBytes.byteLength !== expectedSeamBytes ||
			indexBytes.byteLength !== 4374 * Uint16Array.BYTES_PER_ELEMENT
		) {
			throw new RangeError('Distant-Sun scene-cache payload shapes do not match the executable ledger.');
		}
		const seamBuffer = seamBytes.buffer.slice(seamBytes.byteOffset, seamBytes.byteOffset + seamBytes.byteLength);
		const seamValues = new Float32Array(seamBuffer);
		const indexBuffer = indexBytes.buffer.slice(
			indexBytes.byteOffset,
			indexBytes.byteOffset + indexBytes.byteLength,
		);
		const indexValues = new Uint16Array(indexBuffer);
		if (
			indexValues.some(
				(value, index) =>
					value !== CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.logicalToUniqueDirectionIndices[index],
			)
		) {
			throw new RangeError('Distant-Sun scene-cache direction index is not the executable exact seam map.');
		}
		const packedSeamValues = this._packRgbaChannels(seamValues, indexValues, ledger.retainedBlockCount);

		let cumulativeTexture = null;
		let directionIndexTexture = null;
		try {
			cumulativeTexture = this._backend.uploadImmutableTexture({
				id: `${manifest.record.cacheIdentity}:exact-seam`,
				storage: {format: 'RGBA32F', width: 648, height: 27, layers: ledger.retainedBlockCount},
				values: packedSeamValues,
				valueKey: 'cache.sceneCumulativeScatteringDensity',
			});
			directionIndexTexture = this._backend.uploadImmutableTexture({
				id: `${manifest.record.cacheIdentity}:logical-index`,
				storage: {format: 'R16UI', width: 4374, height: 1, layers: 1},
				values: indexValues,
				valueKey: 'cache.sceneLogicalToUniqueDirection',
			});
			return new DistantSunSceneCache({manifest, ledger, cumulativeTexture, directionIndexTexture});
		} catch (error) {
			directionIndexTexture?.dispose();
			cumulativeTexture?.dispose();
			throw error;
		}
	}
}
