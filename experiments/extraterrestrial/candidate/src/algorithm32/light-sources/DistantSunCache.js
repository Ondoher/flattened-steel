import {
	CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
} from '../caches/gpu/cacheRuntimeContracts.js';
import {
	createShaderBindingRequirement,
	createShaderContribution,
	createShaderSourceBlock,
	createShaderTextureDescriptor,
} from '../shader/shaderContribution.js';

const CUMULATIVE_SCATTERING_SAMPLER_NAME =
	'uCumulativeScatteringDensityCache';

/** Own one completed distant-Sun cumulative GPU cache artifact. */
export class DistantSunCache {
	/** @type {CacheBuildArtifact} */
	_artifact;
	_disposed = false;

	/**
	 * Take ownership of one completely constructed staging artifact.
	 *
	 * @param {CacheBuildArtifact} artifact - Supplies the completed cumulative
	 * field and its opaque runtime binding.
	 */
	constructor(artifact) {
		this._artifact = artifact;
	}

	/** @returns {ScatteringCacheDescriptor} The completed cache descriptor. */
	get descriptor() {
		return this._artifact.descriptor;
	}

	/** Return the opaque bindings for the privately owned cumulative field. */
	getRuntimeBindings() {
		if (this._disposed) {
			throw new Error('DistantSunCache is disposed.');
		}
		return this._artifact.runtimeBindings;
	}

	/**
	 * Contribute the source-owned final-view tensor-product lookup. Geometry
	 * resolves physical position and direction into fixed Native-48 and W27
	 * stencils; this cache owns only scalar-array addressing and accumulation.
	 *
	 * @param {ShaderContributionRequest} request - Supplies the active runtime descriptor.
	 * @returns {ShaderContribution} The cumulative-cache shader contribution.
	 */
	createShaderContribution(request) {
		if (this._disposed) {
			throw new Error('DistantSunCache is disposed.');
		}

		return createShaderContribution({
			id: 'cache-distant-sun-cumulative-scattering',
			owner: 'cache',
			descriptorFingerprint: request.descriptor.cache.fingerprint,
			compatibilityTags: request.descriptor.cache.compatibilityTags,
			provides: ['cache.sampleCumulativeScatteringDensity'],
			requires: [
				'geometry.scatteringCacheStencilTypes',
			],
			textures: [
				createShaderTextureDescriptor(
					CUMULATIVE_SCATTERING_SAMPLER_NAME,
					'sampler2DArray',
					CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
				),
			],
			functions: [
				createShaderSourceBlock(
					'cache-cumulative-scattering-sample',
					'sampleScatteringCache',
					0,
					`SpectralValue sampleCumulativeScatteringDensity(
	CachePositionStencil positionStencil,
	CacheDirectionStencil directionStencil
) {
	SpectralValue density;

	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float channelDensity = 0.0;
		for (int positionTapIndex = 0; positionTapIndex < 2; positionTapIndex += 1) {
			for (int directionTapIndex = 0; directionTapIndex < 4; directionTapIndex += 1) {
				float weight = positionStencil.weights[positionTapIndex]
					* directionStencil.weights[directionTapIndex];
				channelDensity += weight * texelFetch(
					${CUMULATIVE_SCATTERING_SAMPLER_NAME},
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
					'cache.cumulative-scattering-density',
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

export default DistantSunCache;
