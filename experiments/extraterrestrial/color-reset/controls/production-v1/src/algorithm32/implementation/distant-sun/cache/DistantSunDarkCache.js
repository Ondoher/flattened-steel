import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';

/** Procedural zero-scattering cache shared by every qualified dark Sun state. */
export default class DistantSunDarkCache {
	/** @type {CacheRuntimeBindings} */ _runtimeBindings;
	/** @type {boolean} */ _disposed = false;

	/** @param {string} backendId - Renderer backend that owns this runtime attachment. */
	constructor(backendId) {
		this._runtimeBindings = {backendId, bindings: []};
	}

	/** Return the empty renderer binding collection. */
	getRuntimeBindings() {
		if (this._disposed) throw new Error('DistantSunDarkCache is disposed.');
		return this._runtimeBindings;
	}

	/** Return a texture-free cumulative-density lookup that is black at every wavelength. */
	createShaderContribution() {
		if (this._disposed) throw new Error('DistantSunDarkCache is disposed.');
		return ShaderContributions.createShaderContribution({
			id: 'cache-distant-sun-dark',
			owner: 'cache',
			provides: ['cache.sampleCumulativeScatteringDensity'],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'cache-distant-sun-dark-lookup',
					'sampleScatteringCache',
					0,
					`SpectralValue sampleCumulativeScatteringDensity(
	vec3 positionMeters,
	AtmosphereCoordinate atmosphereCoordinate,
	vec3 physicalOutgoingDirection
) {
	SpectralValue density;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		density.channels[channelIndex] = 0.0;
	}
	return density;
}`,
				),
			],
		});
	}

	/** Release this attachment-local logical resource. */
	dispose() {
		this._disposed = true;
	}
}
