import {
	createShaderBindingRequirement,
	createShaderContribution,
	createShaderSourceBlock,
	createShaderTextureDescriptor,
	createShaderUniformDescriptor,
} from '../../shader/shaderContribution.js';
import { PRIMARY_CELESTIAL_CACHE_VALUE_KEY } from '../gpu/cacheRuntimeContracts.js';

const PRIMARY_CELESTIAL_SAMPLER_NAME = 'uPrimaryCelestialRadianceCache';

/** Own one atomically published primary celestial GPU field and its lookup contract. */
export class PrimaryCelestialGpuCache {
	constructor({ artifact, sourceId, generationIdentity, angularRadiusRadians }) {
		if (!(angularRadiusRadians > 0 && angularRadiusRadians < Math.PI / 2)) throw new RangeError('Primary celestial GPU cache requires a positive angular radius.');
		this._artifact = artifact;
		this.sourceId = sourceId;
		this.generationIdentity = generationIdentity;
		this.angularRadiusRadians = angularRadiusRadians;
		this._disposed = false;
	}

	getRuntimeBindings() {
		if (this._disposed) throw new Error('Primary celestial GPU cache is disposed.');
		return this._artifact.runtimeBindings;
	}

	async readSelectedScalars(probeReader, coordinates) {
		if (this._disposed) throw new Error('Primary celestial GPU cache is disposed.');
		return probeReader.readSelectedScalars({ field: this._artifact.result, coordinates });
	}

	/** Require geometry to supply explicit `(u,h)` bilinear indices and weights. */
	createShaderContribution({ descriptorFingerprint, compatibilityTags = [] }) {
		if (this._disposed) throw new Error('Primary celestial GPU cache is disposed.');
		return createShaderContribution({
			id: 'cache-primary-celestial-r32f-lookup', owner: 'cache', descriptorFingerprint, compatibilityTags,
			provides: ['cache.samplePrimaryCelestialRadiance'], requires: ['geometry.celestialCacheStencilTypes'],
			textures: [createShaderTextureDescriptor(PRIMARY_CELESTIAL_SAMPLER_NAME, 'sampler2DArray', PRIMARY_CELESTIAL_CACHE_VALUE_KEY)],
			functions: [createShaderSourceBlock('cache-primary-celestial-r32f-bilinear', 'sampleCelestialCache', 0, `SpectralValue samplePrimaryCelestialRadiance(
	CelestialCacheBilinearStencil stencil
) {
	SpectralValue result;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float channelRadiance = 0.0;
		for (int positionTap = 0; positionTap < 2; positionTap += 1) {
			for (int directionTap = 0; directionTap < 2; directionTap += 1) {
				channelRadiance += stencil.positionWeights[positionTap]
					* stencil.directionWeights[directionTap]
					* texelFetch(${PRIMARY_CELESTIAL_SAMPLER_NAME}, ivec3(
						stencil.directionIndices[directionTap],
						stencil.positionIndices[positionTap],
						channelIndex
					), 0).r;
			}
		}
		result.c[channelIndex] = channelRadiance;
	}

	return result;
}`)],
			bindingRequirements: [createShaderBindingRequirement('cache.primary-celestial-radiance', 'cache', 'texture', 'setup', PRIMARY_CELESTIAL_CACHE_VALUE_KEY, true)],
		});
	}

	/** Consume this cache as a live, camera-dependent distant uniform disk. */
	createLiveShaderContribution({ descriptorFingerprint, compatibilityTags = [] }) {
		if (this._disposed) throw new Error('Primary celestial GPU cache is disposed.');
		return createShaderContribution({
			id: 'celestial-primary-distant-sun-live-raster', owner: 'cache', descriptorFingerprint, compatibilityTags,
			provides: ['celestial.evaluateRadiance'],
			requires: ['runtime.initialState', 'runtime.sceneHitTexture', 'geometry.reconstructViewRay', 'geometry.resolveCelestialCacheStencil', 'light.directionToAtmosphericSource', 'cache.samplePrimaryCelestialRadiance'],
			uniforms: [createShaderUniformDescriptor('uPrimaryCelestialAngularRadiusRadians', 'float', 'celestial.primary.angularRadiusRadians', this.angularRadiusRadians)],
			functions: [createShaderSourceBlock('celestial-primary-distant-sun-live-evaluate', 'evaluateCelestialRadiance', 0, `bool primaryCelestialSampleIsSceneBlocked(vec2 sampleUv) {
	ivec2 dimensions = textureSize(uSceneHitTexture, 0);
	ivec2 samplePixel = clamp(ivec2(floor(sampleUv * uViewportSizePixels)), ivec2(0), dimensions - ivec2(1));
	return texelFetch(uSceneHitTexture, samplePixel, 0).r > 0.5;
}

void evaluatePrimaryCelestialRadiance(inout ShaderState state) {
	SpectralValue result = zeroSpectral();
	const vec2 OFFSETS[4] = vec2[4](vec2(-0.25, -0.25), vec2(0.25, -0.25), vec2(-0.25, 0.25), vec2(0.25, 0.25));
	float minimumCosine = cos(uPrimaryCelestialAngularRadiusRadians);
	for (int sampleIndex = 0; sampleIndex < 4; sampleIndex += 1) {
		vec2 sampleUv = clamp(state.uv + OFFSETS[sampleIndex] / max(uViewportSizePixels, vec2(1.0)), vec2(0.0), vec2(1.0));
		if (primaryCelestialSampleIsSceneBlocked(sampleUv)) continue;
		ViewRay sampleRay = reconstructViewRay(sampleUv);
		vec3 directionToSun = normalize(directionToAtmosphericSource(sampleRay.originMeters));
		if (dot(sampleRay.direction, directionToSun) < minimumCosine) continue;
		CelestialCacheBilinearStencil stencil = resolveCelestialCacheStencil(sampleRay.originMeters, directionToSun);
		if (!stencil.valid) continue;
		SpectralValue radiance = samplePrimaryCelestialRadiance(stencil);
		for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) result.c[channelIndex] += 0.25 * radiance.c[channelIndex];
	}
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		state.celestialRadiance.c[channelIndex] += result.c[channelIndex];
	}
}`)],
			mainHooks: [createShaderSourceBlock('celestial-primary-distant-sun-live-main', 'evaluateCelestialRadiance', 0, 'evaluatePrimaryCelestialRadiance(state);')],
			bindingRequirements: [createShaderBindingRequirement('celestial.primary-angular-radius', 'cache', 'uniform', 'setup', 'celestial.primary.angularRadiusRadians', true)],
		});
	}

	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._artifact.dispose();
	}
}

export default PrimaryCelestialGpuCache;
