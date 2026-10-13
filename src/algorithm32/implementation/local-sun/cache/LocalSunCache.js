import {CUMULATIVE_SCATTERING_CACHE_VALUE_KEY} from '../../../gpu-cache-runtime/consts.js';
import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';
import {LOCAL_SUN_CACHE_SHADER_CONTRIBUTION_ID, LOCAL_SUN_CUMULATIVE_SCATTERING_SAMPLER_NAME} from './consts.js';

/** Object that owns one completed local-Sun cumulative GPU cache artifact.
 *
 * @implements {GpuScatteringCache}
 */
export class LocalSunCache {
	/**
	 * Artifact value.
	 *
	 *  @type {CacheBuildArtifact}
	 *
	 */
	_artifact;
	/**
	 * Resources value.
	 *
	 *  @type {LocalSunCacheResourceReport | LocalSunCompactGpuResourceReport}
	 *
	 */
	_resources;
	/** Disposed value. */ _disposed = false;

	/**
	 * Creates a local sun cache instance that takes ownership of one completely constructed staging artifact.
	 *
	 * @param {CacheBuildArtifact} artifact - Supplies the completed cumulative
	 * field and opaque runtime binding.
	 *
	 * @param {LocalSunCacheResourceReport | LocalSunCompactGpuResourceReport} resources - Supplies actual
	 * construction and resident payload reporting.
	 *
	 */
	constructor(artifact, resources) {
		this._artifact = artifact;
		this._resources = resources;
	}

	/**
	 * Resources value.
	 *
	 *  @returns {LocalSunCacheResourceReport | LocalSunCompactGpuResourceReport} - Actual construction resources.
	 */
	get resources() {
		return this._resources;
	}

	/**
	 * Call this method to return opaque bindings for the privately owned cumulative field.
	 *
	 * @returns {CacheRuntimeBindings} - Backend-owned opaque field bindings.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	getRuntimeBindings() {
		if (this._disposed) {
			throw new Error('LocalSunCache is disposed.');
		}

		return this._artifact.runtimeBindings;
	}

	/**
	 * Call this method to contribute the local cache's bilinear-position and W27-direction lookup.
	 *
	 * @returns {ShaderContribution} - The cumulative-cache contribution.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	createShaderContribution() {
		if (this._disposed) {
			throw new Error('LocalSunCache is disposed.');
		}

		return ShaderContributions.createShaderContribution({
			id: LOCAL_SUN_CACHE_SHADER_CONTRIBUTION_ID,
			owner: 'cache',
			provides: ['cache.sampleCumulativeScatteringDensity'],
			requires: [
				'geometry.scatteringCacheStencilTypes',
				'geometry.resolveScatteringCachePositionStencil',
				'geometry.resolveScatteringCacheDirectionStencil',
			],
			textures: [
				ShaderContributions.createShaderTextureDeclaration(
					LOCAL_SUN_CUMULATIVE_SCATTERING_SAMPLER_NAME,
					'sampler2DArray',
					CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'local-sun-cache-cumulative-scattering-sample',
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

	for (int channelIndex = 0;
		channelIndex < SPECTRAL_CHANNEL_COUNT;
		channelIndex += 1) {
		float channelDensity = 0.0;
		for (int positionTapIndex = 0;
			positionTapIndex < 4;
			positionTapIndex += 1) {
			for (int directionTapIndex = 0;
				directionTapIndex < 4;
				directionTapIndex += 1) {
				float weight = positionStencil.weights[positionTapIndex]
					* directionStencil.weights[directionTapIndex];
				channelDensity += weight * texelFetch(
					${LOCAL_SUN_CUMULATIVE_SCATTERING_SAMPLER_NAME},
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
					'cache.local-sun-cumulative-scattering-density',
					'cache',
					'texture',
					'setup',
					CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
					true,
				),
			],
		});
	}

	/** Call this method to release the completed cumulative GPU field exactly once. */
	dispose() {
		if (this._disposed) {
			return;
		}

		this._disposed = true;
		this._artifact.dispose();
	}
}
