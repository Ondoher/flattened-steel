import {CUMULATIVE_SCATTERING_CACHE_VALUE_KEY} from '../../../src/algorithm32/gpu-cache-runtime/consts.js';
import {DistantSunLightSource} from '../../../src/algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/index.js';
import {ShaderContributions} from '../../../src/algorithm32/shader-assembly/base/ShaderContributions.js';
import DistantSunSceneCache from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCache.js';
import DistantSunSceneCacheAtlas from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheAtlas.js';
import B1Direct40CacheAssetManifest, {B1_POINT_LOCAL_CACHE_ASSET_SCHEMA} from './B1Direct40CacheAssetManifest.js';

/** Shader sampler identity shared by the retained direct-40 contribution. */
const SAMPLER_NAME = 'uCumulativeScatteringDensityCache';

/** Attachment-owned immutable legacy B1 field and its renderer binding. */
class B1Direct40AssetCacheResource {
	/**
	 * Creates the sole disposal owner for one authenticated manifest and uploaded texture.
	 *
	 * @param {B1AssetCacheResourceDefinition} definition - Verified manifest and transferred texture ownership.
	 */
	constructor({manifest, texture}) {
		this._manifest = manifest;
		this._texture = texture;
		this._disposed = false;
		/** Logical byte allocations owned by this exact legacy cache. @type {DistantSunSceneCacheResourceReport} */
		this.resources = {
			residentTextureBytes: {value: 40 * 48 * 4374 * Float32Array.BYTES_PER_ELEMENT, units: 'bytes'},
			hostStagingBytes: {
				value:
					40 * 48 * 4374 * Float32Array.BYTES_PER_ELEMENT +
					manifest.record.cumulativeScatteringDensity.byteLength +
					manifest.record.logicalToUniqueIndex.byteLength,
				units: 'bytes',
			},
		};
	}

	/**
	 * Stable authenticated asset identity retained after disposal.
	 *
	 * @returns {string} - Exact authenticated cache identity.
	 */
	get cacheIdentity() {
		return this._manifest.record.assetIdentity;
	}

	/**
	 * Call this method to obtain the live opaque texture binding. Disposed resources throw Error.
	 *
	 * @returns {CacheRuntimeBindings} - Binding packet owned by this cache's backend.
	 */
	getRuntimeBindings() {
		if (this._disposed) throw new Error('B1 direct-40 asset cache is disposed.');
		return {backendId: this._texture.backendId, bindings: [this._texture.runtimeBinding]};
	}

	/**
	 * Call this method to contribute the retained direct-40 cumulative-field lookup. Disposed resources throw Error.
	 *
	 * @returns {ShaderContribution} - Cache-owned source, sampler and binding requirements.
	 */
	createShaderContribution() {
		if (this._disposed) throw new Error('B1 direct-40 asset cache is disposed.');
		return ShaderContributions.createShaderContribution({
			id: 'cache-b1-direct40-asset-backed-cumulative-scattering',
			owner: 'cache',
			provides: ['cache.sampleCumulativeScatteringDensity'],
			requires: [
				'geometry.scatteringCacheStencilTypes',
				'geometry.resolveScatteringCachePositionStencil',
				'geometry.resolveScatteringCacheDirectionStencil',
			],
			textures: [
				ShaderContributions.createShaderTextureDeclaration(
					SAMPLER_NAME,
					'sampler2DArray',
					CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'b1-direct40-asset-cache-sample',
					'sampleScatteringCache',
					0,
					`SpectralValue sampleCumulativeScatteringDensity(
	vec3 positionMeters,
	AtmosphereCoordinate atmosphereCoordinate,
	vec3 physicalOutgoingDirection
) {
	CachePositionStencil positionStencil =
		resolveScatteringCachePositionStencil(atmosphereCoordinate);
	CacheDirectionStencil directionStencil = resolveScatteringCacheDirectionStencil(
		positionMeters,
		physicalOutgoingDirection
	);
	SpectralValue density;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float channelDensity = 0.0;
		for (int positionTapIndex = 0; positionTapIndex < 2; positionTapIndex += 1) {
			for (int directionTapIndex = 0; directionTapIndex < 4; directionTapIndex += 1) {
				float weight = positionStencil.weights[positionTapIndex]
					* directionStencil.weights[directionTapIndex];
				channelDensity += weight * texelFetch(
					${SAMPLER_NAME},
					ivec3(
						directionStencil.indices[directionTapIndex],
						positionStencil.indices[positionTapIndex],
						channelIndex
					),
					0
				).r;
			}
		}
		density.channels[channelIndex] = channelDensity;
	}
	return density;
}`,
				),
			],
			bindingRequirements: [
				ShaderContributions.createShaderBindingRequirement(
					'cache.b1-direct40-cumulative-scattering-density',
					'cache',
					'texture',
					'setup',
					CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
					true,
				),
			],
		});
	}

	/**
	 * Call this method to release the owned texture exactly once; repeated disposal is safe.
	 *
	 * @returns {void} - No return value.
	 */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._texture.dispose();
	}
}

/** Attachment-local loader for an exact B1 condition and production profile. */
class B1Direct40AssetCacheLoader {
	/**
	 * Creates a loader that borrows its renderer backend and immutable selection facts.
	 *
	 * @param {B1AssetCacheLoaderDefinition} definition - Backend, verified asset selection and execution profile.
	 */
	constructor({backend, asset, profile}) {
		this._backend = backend;
		this._asset = asset;
		this._profile = profile;
	}

	/**
	 * Called by asset loading to authenticate the exact borrowed payload bytes.
	 *
	 * @param {Uint8Array} bytes - Read-only payload bytes.
	 * @returns {Promise<string>} - Lowercase SHA-256 identity; digest failures reject the load.
	 */
	async _sha256(bytes) {
		const copy = new Uint8Array(bytes.byteLength);
		copy.set(bytes);
		const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', copy.buffer));
		return Array.from(digest, (value) => value.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Called by asset reads to resolve one contained relative URL. Invalid or escaping paths throw RangeError.
	 *
	 * @param {string} root - Absolute asset-root URL with a trailing slash.
	 * @param {string} relativePath - Asset-relative payload path.
	 * @returns {string} - Contained absolute payload URL.
	 */
	_resolveAssetPath(root, relativePath) {
		if (
			!relativePath ||
			relativePath.startsWith('/') ||
			relativePath.includes(':') ||
			relativePath.includes('..') ||
			relativePath.includes('\\')
		) {
			throw new RangeError('B1 direct-40 runtime asset path must be relative and contained.');
		}
		const resolved = new URL(relativePath, root).href;
		if (!resolved.startsWith(root)) throw new RangeError('B1 direct-40 runtime asset escapes its root.');
		return resolved;
	}

	/**
	 * Called by asset loading to read one payload. Invalid paths, failed HTTP responses and fetch cancellation reject
	 * the load; the caller retains its prior cache and may retry with a new request.
	 *
	 * @param {string} root - Absolute asset-root URL with a trailing slash.
	 * @param {string} relativePath - Asset-relative payload path.
	 * @param {AbortSignal} [signal] - Optional cancellation owned by the current load request.
	 * @returns {Promise<Uint8Array>} - Newly owned exact response bytes.
	 */
	async _readAsset(root, relativePath, signal) {
		const response = await fetch(this._resolveAssetPath(root, relativePath), {signal});
		if (!response.ok) throw new Error(`B1 direct-40 runtime asset load failed (${response.status}).`);
		return new Uint8Array(await response.arrayBuffer());
	}

	/**
	 * Called by legacy asset loading to expand exact W27 seam copies. Nonfinite or negative values throw RangeError.
	 *
	 * @param {Float32Array} uniqueValues - Borrowed wavelength/altitude/unique-direction scalar field.
	 * @param {Uint16Array} logicalToUnique - Borrowed logical-to-unique direction index map.
	 * @returns {Float32Array} - Newly owned wavelength/altitude/logical-direction field.
	 */
	_unpackLogicalField(uniqueValues, logicalToUnique) {
		const uniqueCount = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.uniqueDirectionCount;
		const logicalCount = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount;
		const positionCount = 48;
		const channelCount = 40;
		const logical = new Float32Array(channelCount * positionCount * logicalCount);
		for (let channel = 0; channel < channelCount; channel += 1) {
			for (let position = 0; position < positionCount; position += 1) {
				const sourceBase = (channel * positionCount + position) * uniqueCount;
				const targetBase = (channel * positionCount + position) * logicalCount;
				for (let direction = 0; direction < logicalCount; direction += 1) {
					const value = uniqueValues[sourceBase + logicalToUnique[direction]];
					if (!Number.isFinite(value) || value < 0) {
						throw new RangeError('B1 direct-40 runtime cache values must be finite and nonnegative.');
					}
					logical[targetBase + direction] = value;
				}
			}
		}
		return logical;
	}

	/**
	 * Call this method to authenticate and upload one exact B1 cache. Path, hash, compatibility, fetch and upload
	 * failures reject; cancellation rejects through fetch. Partial uploads are disposed before rejection, and the
	 * caller must retain any prior published cache rather than publish a partial replacement.
	 *
	 * @param {ScatteringCacheBuildRequest} [request] - Optional per-attempt cancellation.
	 * @returns {Promise<GpuScatteringCache>} - Complete newly owned legacy or receiver-local GPU cache.
	 */
	async load({signal} = {}) {
		const root = new URL(this._asset.assetRoot, globalThis.location.href).href;
		const assetRoot = root.endsWith('/') ? root : `${root}/`;
		const manifestBytes = await this._readAsset(assetRoot, this._asset.manifestPath, signal);
		if ((await this._sha256(manifestBytes)) !== this._asset.manifestSha256) {
			throw new Error('B1 direct-40 runtime manifest hash is incompatible.');
		}
		const manifest = new B1Direct40CacheAssetManifest(
			JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(manifestBytes)),
		);
		if (manifest.record.assetIdentity !== this._asset.assetIdentity) {
			throw new Error('B1 direct-40 runtime asset identity is incompatible.');
		}
		manifest.requireCompatibility(this._profile, this._asset.condition);
		const [uniqueBytes, indexBytes] = await Promise.all([
			this._readAsset(assetRoot, manifest.record.cumulativeScatteringDensity.path, signal),
			this._readAsset(assetRoot, manifest.record.logicalToUniqueIndex.path, signal),
		]);
		if (
			uniqueBytes.byteLength !== manifest.record.cumulativeScatteringDensity.byteLength ||
			(await this._sha256(uniqueBytes)) !== manifest.record.cumulativeScatteringDensity.sha256 ||
			indexBytes.byteLength !== manifest.record.logicalToUniqueIndex.byteLength ||
			(await this._sha256(indexBytes)) !== manifest.record.logicalToUniqueIndex.sha256
		) {
			throw new Error('B1 direct-40 runtime payload identity failed.');
		}
		const uniqueValues = new Float32Array(
			uniqueBytes.buffer.slice(uniqueBytes.byteOffset, uniqueBytes.byteOffset + uniqueBytes.byteLength),
		);
		const logicalToUnique = new Uint16Array(
			indexBytes.buffer.slice(indexBytes.byteOffset, indexBytes.byteOffset + indexBytes.byteLength),
		);
		if (
			logicalToUnique.some(
				(value, index) =>
					value !== CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.logicalToUniqueDirectionIndices[index],
			)
		) {
			throw new Error('B1 direct-40 runtime direction map is incompatible.');
		}
		if (manifest.record.schemaId === B1_POINT_LOCAL_CACHE_ASSET_SCHEMA) {
			const ledger = manifest.record.ledger;
			const values = DistantSunSceneCacheAtlas.pack(uniqueValues, logicalToUnique, ledger.retainedBlockCount, 40);
			let cumulativeTexture = null;
			let directionIndexTexture = null;
			try {
				cumulativeTexture = this._backend.uploadImmutableTexture({
					id: `${manifest.record.assetIdentity}:receiver-local`,
					storage: {format: 'RGBA32F', width: 1620, height: 27, layers: ledger.retainedBlockCount},
					values,
					valueKey: 'cache.sceneCumulativeScatteringDensity',
				});
				directionIndexTexture = this._backend.uploadImmutableTexture({
					id: `${manifest.record.assetIdentity}:logical-index`,
					storage: {format: 'R16UI', width: 4374, height: 1, layers: 1},
					values: logicalToUnique,
					valueKey: 'cache.sceneLogicalToUniqueDirection',
				});
				return new DistantSunSceneCache({
					spectralChannelCount: 40,
					positionDomain: this._profile.domains.positions,
					directionInterpolation: 'shader-bilinear',
					solarInterpolation: manifest.record.solarInterpolation,
					ledger,
					cumulativeTexture,
					directionIndexTexture,
					manifest: {
						record: {
							cacheIdentity: manifest.record.assetIdentity,
							exactSeamPayload: manifest.record.cumulativeScatteringDensity,
							logicalToUniqueIndex: manifest.record.logicalToUniqueIndex,
						},
						/**
						 * Call this method to require the authenticated cache identity; a mismatch throws Error.
						 *
						 * @param {string} identity - Required exact cache identity.
						 * @returns {void} - No return value.
						 */
						requireCacheIdentity(identity) {
							if (identity !== manifest.record.assetIdentity)
								throw new Error('Receiver-local asset identity is incompatible.');
						},
					},
				});
			} catch (error) {
				directionIndexTexture?.dispose();
				cumulativeTexture?.dispose();
				throw error;
			}
		}
		const logicalValues = this._unpackLogicalField(uniqueValues, logicalToUnique);
		const texture = this._backend.uploadImmutableTexture({
			id: `${manifest.record.assetIdentity}:logical-field`,
			storage: {format: 'R32F', width: 4374, height: 48, layers: 40},
			values: logicalValues,
			valueKey: CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
		});
		return new B1Direct40AssetCacheResource({manifest, texture});
	}
}

/** Renderer-attachment owner of one lazily loaded exact B1 cache. */
class B1Direct40AssetCacheController {
	/**
	 * Creates an attachment-local cache loader and empty publication state.
	 *
	 * @param {B1AssetCacheLoaderDefinition} definition - Borrowed backend, asset selection and execution profile.
	 */
	constructor(definition) {
		this._loader = new B1Direct40AssetCacheLoader(definition);
		this._active = null;
		this._disposed = false;
	}

	/**
	 * Call this method to load or reuse this attachment's complete exact cache. A disposed controller throws Error;
	 * authentication, compatibility, cancellation and backend failures reject without publishing an incomplete cache.
	 *
	 * @param {ScatteringCacheBuildRequest} [request] - Optional per-attempt cancellation.
	 * @returns {Promise<GpuScatteringCache>} - Complete cache retained until this controller is disposed.
	 */
	async createScatteringCache(request = {}) {
		if (this._disposed) throw new Error('B1 direct-40 asset cache controller is disposed.');
		this._active ??= await this._loader.load(request);
		return this._active;
	}

	/**
	 * Call this method to dispose the retained cache and prevent later loading; repeated disposal is safe.
	 *
	 * @returns {void} - No return value.
	 */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._active?.dispose();
		this._active = null;
	}
}

/** Distant-Sun facade whose cache controller can only load one verified B1 asset. */
export class B1AssetBackedDistantSunLightSource extends DistantSunLightSource {
	/**
	 * Creates a distant source whose renderer attachment can load only the selected exact B1 cache.
	 *
	 * @param {B1AssetBackedSourceDefinition} definition - Execution profile and optional exact asset selection.
	 */
	constructor({profile, asset}) {
		super({
			angularRadius: {value: 0.004675, units: 'radians'},
			sourceIrradiance: profile.spectral.sourceIrradianceDensity,
			sceneCacheAsset: asset,
		});
		this._b1Asset = asset;
		this._b1Profile = profile;
	}

	/**
	 * Call this method to create the renderer-owned exact-asset controller. Missing geometry placement or an absent
	 * verified asset throws Error; callers must configure placement and supply the qualified selection first.
	 *
	 * @param {B1AssetCacheBackendRequest} request - Renderer-owned immutable-texture upload capability.
	 * @returns {B1AssetCacheControllerCapability} - Attachment-local cache construction and disposal owner.
	 */
	createCacheController({backend}) {
		this.configuration;
		if (!this._b1Asset) throw new Error('B1 GPU production requires a verified exact cache asset.');
		return new B1Direct40AssetCacheController({backend, asset: this._b1Asset, profile: this._b1Profile});
	}
}
