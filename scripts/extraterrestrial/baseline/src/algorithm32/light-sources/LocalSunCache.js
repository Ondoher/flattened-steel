import {
	CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
} from '../caches/gpu/cacheRuntimeContracts.js';
import {
	createShaderBindingRequirement,
	createShaderContribution,
	createShaderSourceBlock,
	createShaderTextureDescriptor,
} from '../shader/shaderContribution.js';
import {
	LOCAL_SUN_CACHE_SHADER_CONTRIBUTION_ID,
	LOCAL_SUN_CUMULATIVE_SCATTERING_SAMPLER_NAME,
} from './local-sun-consts.js';

/** Own one completed local-Sun cumulative GPU cache artifact. */
export class LocalSunCache {
	/** @type {CacheBuildArtifact} */
	_artifact;
	/** @type {LocalSunCacheResourceReport} */
	_resources;
	_disposed = false;

	/**
	 * Take ownership of one completely constructed staging artifact.
	 *
	 * @param {CacheBuildArtifact} artifact - Supplies the completed cumulative
	 * field and opaque runtime binding.
	 * @param {LocalSunCacheResourceReport} resources - Supplies actual
	 * construction and resident payload reporting.
	 */
	constructor(artifact, resources) {
		this._artifact = artifact;
		this._resources = resources;
	}

	/** @returns {ScatteringCacheDescriptor} The completed cache descriptor. */
	get descriptor() {
		return this._artifact.descriptor;
	}

	/** @returns {LocalSunCacheResourceReport} Actual construction resources. */
	get resources() {
		return this._resources;
	}

	/** Return opaque bindings for the privately owned cumulative field. */
	getRuntimeBindings() {
		if (this._disposed) {
			throw new Error('LocalSunCache is disposed.');
		}

		return this._artifact.runtimeBindings;
	}

	/**
	 * Contribute the local cache's bilinear-position and W27-direction lookup.
	 *
	 * @param {ShaderContributionRequest} request - Supplies the runtime descriptor.
	 * @returns {ShaderContribution} The cumulative-cache contribution.
	 */
	createShaderContribution(request) {
		if (this._disposed) {
			throw new Error('LocalSunCache is disposed.');
		}

		return createShaderContribution({
			id: LOCAL_SUN_CACHE_SHADER_CONTRIBUTION_ID,
			owner: 'cache',
			descriptorFingerprint: request.descriptor.cache.fingerprint,
			compatibilityTags: request.descriptor.cache.compatibilityTags,
			provides: ['cache.sampleCumulativeScatteringDensity'],
			requires: ['geometry.scatteringCacheStencilTypes'],
			textures: [
				createShaderTextureDescriptor(
					LOCAL_SUN_CUMULATIVE_SCATTERING_SAMPLER_NAME,
					'sampler2DArray',
					CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
				),
			],
			functions: [
				createShaderSourceBlock(
					'local-sun-cache-cumulative-scattering-sample',
					'sampleScatteringCache',
					0,
					`SpectralValue sampleCumulativeScatteringDensity(
	CachePositionStencil positionStencil,
	CacheDirectionStencil directionStencil
) {
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
		density.c[channelIndex] = channelDensity;
	}

	return density;
}`,
				),
			],
			bindingRequirements: [
				createShaderBindingRequirement(
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

	/** Release the completed cumulative GPU field exactly once. */
	dispose() {
		if (this._disposed) {
			return;
		}

		this._disposed = true;
		this._artifact.dispose();
	}
}
