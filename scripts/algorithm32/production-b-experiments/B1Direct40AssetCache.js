import {CUMULATIVE_SCATTERING_CACHE_VALUE_KEY} from '../../../src/algorithm32/gpu-cache-runtime/consts.js';
import {DistantSunLightSource} from '../../../src/algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/index.js';
import {ShaderContributions} from '../../../src/algorithm32/shader-assembly/base/ShaderContributions.js';
import DistantSunSceneCache from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCache.js';
import DistantSunSceneCacheAtlas from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheAtlas.js';
import B1Direct40CacheAssetManifest, {B1_POINT_LOCAL_CACHE_ASSET_SCHEMA} from './B1Direct40CacheAssetManifest.js';

const SAMPLER_NAME = 'uCumulativeScatteringDensityCache';

async function sha256(bytes) {
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', copy.buffer));
	return Array.from(digest, (value) => value.toString(16).padStart(2, '0')).join('');
}

function resolveAssetPath(root, relativePath) {
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

async function readAsset(root, relativePath, signal) {
	const response = await fetch(resolveAssetPath(root, relativePath), {signal});
	if (!response.ok) throw new Error(`B1 direct-40 runtime asset load failed (${response.status}).`);
	return new Uint8Array(await response.arrayBuffer());
}

function unpackLogicalField(uniqueValues, logicalToUnique) {
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

class B1Direct40AssetCacheResource {
	constructor({manifest, texture}) {
		this._manifest = manifest;
		this._texture = texture;
		this._disposed = false;
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

	get cacheIdentity() {
		return this._manifest.record.assetIdentity;
	}

	getRuntimeBindings() {
		if (this._disposed) throw new Error('B1 direct-40 asset cache is disposed.');
		return {backendId: this._texture.backendId, bindings: [this._texture.runtimeBinding]};
	}

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

	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._texture.dispose();
	}
}

class B1Direct40AssetCacheLoader {
	constructor({backend, asset, profile}) {
		this._backend = backend;
		this._asset = asset;
		this._profile = profile;
	}

	async load({signal} = {}) {
		const root = new URL(this._asset.assetRoot, globalThis.location.href).href;
		const assetRoot = root.endsWith('/') ? root : `${root}/`;
		const manifestBytes = await readAsset(assetRoot, this._asset.manifestPath, signal);
		if ((await sha256(manifestBytes)) !== this._asset.manifestSha256) {
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
			readAsset(assetRoot, manifest.record.cumulativeScatteringDensity.path, signal),
			readAsset(assetRoot, manifest.record.logicalToUniqueIndex.path, signal),
		]);
		if (
			uniqueBytes.byteLength !== manifest.record.cumulativeScatteringDensity.byteLength ||
			(await sha256(uniqueBytes)) !== manifest.record.cumulativeScatteringDensity.sha256 ||
			indexBytes.byteLength !== manifest.record.logicalToUniqueIndex.byteLength ||
			(await sha256(indexBytes)) !== manifest.record.logicalToUniqueIndex.sha256
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
		const logicalValues = unpackLogicalField(uniqueValues, logicalToUnique);
		const texture = this._backend.uploadImmutableTexture({
			id: `${manifest.record.assetIdentity}:logical-field`,
			storage: {format: 'R32F', width: 4374, height: 48, layers: 40},
			values: logicalValues,
			valueKey: CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
		});
		return new B1Direct40AssetCacheResource({manifest, texture});
	}
}

class B1Direct40AssetCacheController {
	constructor(definition) {
		this._loader = new B1Direct40AssetCacheLoader(definition);
		this._active = null;
		this._disposed = false;
	}

	async createScatteringCache(request = {}) {
		if (this._disposed) throw new Error('B1 direct-40 asset cache controller is disposed.');
		this._active ??= await this._loader.load(request);
		return this._active;
	}

	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._active?.dispose();
		this._active = null;
	}
}

/** Distant-Sun facade whose cache controller can only load one verified B1 asset. */
export class B1AssetBackedDistantSunLightSource extends DistantSunLightSource {
	constructor({profile, asset}) {
		super({
			angularRadius: {value: 0.004675, units: 'radians'},
			sourceIrradiance: profile.spectral.sourceIrradianceDensity,
			sceneCacheAsset: asset,
		});
		this._b1Asset = asset;
		this._b1Profile = profile;
	}

	createCacheController({backend}) {
		this.configuration;
		if (!this._b1Asset) throw new Error('B1 GPU production requires a verified exact cache asset.');
		return new B1Direct40AssetCacheController({backend, asset: this._b1Asset, profile: this._b1Profile});
	}
}
