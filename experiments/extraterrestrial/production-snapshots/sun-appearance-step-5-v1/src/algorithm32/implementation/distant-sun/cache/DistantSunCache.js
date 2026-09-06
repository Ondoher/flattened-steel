import {CUMULATIVE_SCATTERING_CACHE_VALUE_KEY} from '../../../gpu-cache-runtime/consts.js';
import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';

/** Cumulative scattering sampler name constant. */
const CUMULATIVE_SCATTERING_SAMPLER_NAME = 'uCumulativeScatteringDensityCache';

/** Owner of one completed distant-Sun cumulative GPU cache artifact. */
export class DistantSunCache {
	/**
	 * Artifact value.
	 *
	 *  @type {CacheBuildArtifact}
	 *
	 */
	_artifact;
	/** Disposed value. */ _disposed = false;

	/**
	 * Creates a distant sun cache instance that takes ownership of one completely constructed staging artifact.
	 *
	 * @param {CacheBuildArtifact} artifact - Supplies the completed cumulative
	 * field and its opaque runtime binding.
	 *
	 */
	constructor(artifact) {
		this._artifact = artifact;
	}

	/**
	 * Call this method to return the opaque bindings for the privately owned cumulative field.
	 * @returns - The result produced by the operation.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	getRuntimeBindings() {
		if (this._disposed) {
			throw new Error('DistantSunCache is disposed.');
		}
		return this._artifact.runtimeBindings;
	}

	/**
	 * Call this method to contribute the source-owned final-view tensor-product lookup. Geometry resolves physical position and direction into fixed Native-48 and W27 stencils; this cache owns only scalar-array addressing and accumulation.
	 *
	 * @returns {ShaderContribution} - The cumulative-cache shader contribution.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	createShaderContribution() {
		if (this._disposed) {
			throw new Error('DistantSunCache is disposed.');
		}

		return ShaderContributions.createShaderContribution({
			id: 'cache-distant-sun-cumulative-scattering',
			owner: 'cache',
			provides: ['cache.sampleCumulativeScatteringDensity'],
			requires: ['geometry.scatteringCacheStencilTypes'],
			textures: [
				ShaderContributions.createShaderTextureDeclaration(
					CUMULATIVE_SCATTERING_SAMPLER_NAME,
					'sampler2DArray',
					CUMULATIVE_SCATTERING_CACHE_VALUE_KEY,
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
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
		density.channels[channelIndex] = channelDensity;
	}

	return density;
}`,
				),
			],
			bindingRequirements: [
				ShaderContributions.createShaderBindingRequirement(
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

	/** Call this method to release the completed cumulative GPU field exactly once. */
	dispose() {
		if (this._disposed) {
			return;
		}
		this._disposed = true;
		this._artifact.dispose();
	}
}
