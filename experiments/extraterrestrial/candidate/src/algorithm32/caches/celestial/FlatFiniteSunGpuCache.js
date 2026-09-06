import {
	createShaderBindingRequirement,
	createShaderContribution,
	createShaderSourceBlock,
	createShaderTextureDescriptor,
	createShaderUniformDescriptor,
} from '../../shader/shaderContribution.js';
import { FLAT_FINITE_SUN_CACHE_VALUE_KEY } from './FlatFiniteSunGpuPlan.js';

const SAMPLER = 'uFlatFiniteSunRadianceCache';
const CENTER_KEY = 'geometry.flatFiniteSun.centerMeters';
const RADIUS_KEY = 'celestial.flatFiniteSun.radiusMeters';

/** Runtime view of a source-relative, R32F finite-Sun radiance cache. */
export class FlatFiniteSunGpuCache {
	constructor({ artifact, sourceId, generationIdentity, radiusMeters, defaultCenterMeters }) {
		if (!(radiusMeters > 0) || !Array.isArray(defaultCenterMeters) || defaultCenterMeters.length !== 3) {
			throw new RangeError('Flat finite Sun GPU cache requires positive radius and a center.');
		}
		this._artifact = artifact;
		this.sourceId = sourceId;
		this.generationIdentity = generationIdentity;
		this.radiusMeters = radiusMeters;
		this.defaultCenterMeters = [...defaultCenterMeters];
		this._disposed = false;
	}

	getRuntimeBindings() {
		if (this._disposed) throw new Error('Flat finite Sun GPU cache is disposed.');
		return this._artifact.runtimeBindings;
	}

	createShaderContribution({ descriptorFingerprint, compatibilityTags = [] }) {
		if (this._disposed) throw new Error('Flat finite Sun GPU cache is disposed.');
		return createShaderContribution({
			id: 'cache-flat-finite-sun-r32f-lookup', owner: 'cache', descriptorFingerprint, compatibilityTags,
			provides: ['cache.sampleFlatFiniteSunRadiance'], requires: [],
			textures: [createShaderTextureDescriptor(SAMPLER, 'sampler2DArray', FLAT_FINITE_SUN_CACHE_VALUE_KEY)],
			functions: [createShaderSourceBlock('cache-flat-finite-sun-r32f-sample', 'sampleCelestialCache', 0, `SpectralValue sampleFlatFiniteSunRadiance() {
	SpectralValue result;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		result.c[channelIndex] = texelFetch(${SAMPLER}, ivec3(0, 0, channelIndex), 0).r;
	}
	return result;
}`)],
			bindingRequirements: [createShaderBindingRequirement('cache.flat-finite-sun-radiance', 'cache', 'texture', 'setup', FLAT_FINITE_SUN_CACHE_VALUE_KEY, true)],
		});
	}

	createLiveShaderContribution({ descriptorFingerprint, compatibilityTags = [] }) {
		if (this._disposed) throw new Error('Flat finite Sun GPU cache is disposed.');
		return createShaderContribution({
			id: 'celestial-flat-finite-sun-live-raster', owner: 'cache', descriptorFingerprint, compatibilityTags,
			provides: ['celestial.evaluateRadiance'],
			requires: ['runtime.initialState', 'runtime.sceneHitTexture', 'geometry.reconstructViewRay', 'geometry.resolveAtmosphereCoordinate', 'geometry.finiteCelestialAtmosphereSegment', 'atmosphere.sampleMedium', 'cache.sampleFlatFiniteSunRadiance'],
			uniforms: [
				createShaderUniformDescriptor('uFlatFiniteSunCenterMeters', 'vec3', CENTER_KEY, this.defaultCenterMeters),
				createShaderUniformDescriptor('uFlatFiniteSunRadiusMeters', 'float', RADIUS_KEY, this.radiusMeters),
			],
			functions: [createShaderSourceBlock('celestial-flat-finite-sun-live-evaluate', 'evaluateCelestialRadiance', 0, `bool flatFiniteSunSampleIsSceneBlocked(vec2 sampleUv) {
	ivec2 dimensions = textureSize(uSceneHitTexture, 0);
	ivec2 samplePixel = clamp(ivec2(floor(sampleUv * uViewportSizePixels)), ivec2(0), dimensions - ivec2(1));
	return texelFetch(uSceneHitTexture, samplePixel, 0).r > 0.5;
}

bool flatFiniteSunRayEntryDistance(ViewRay ray, out float entryDistanceMeters) {
	vec3 offset = ray.originMeters - uFlatFiniteSunCenterMeters;
	float b = dot(offset, ray.direction);
	float c = dot(offset, offset) - uFlatFiniteSunRadiusMeters * uFlatFiniteSunRadiusMeters;
	float discriminant = b * b - c;
	if (discriminant < 0.0) return false;
	float root = sqrt(max(discriminant, 0.0));
	float nearDistance = -b - root;
	float farDistance = -b + root;
	entryDistanceMeters = nearDistance >= 0.0 ? nearDistance : farDistance;
	return entryDistanceMeters >= 0.0;
}

SpectralValue flatFiniteSunTransmittance(ViewRay ray, float bodyEntryDistanceMeters) {
	SpectralValue result;
	float atmosphereLengthMeters = finiteCelestialAtmosphereSegmentLength(ray, bodyEntryDistanceMeters);
	const int INTERVAL_COUNT = 16;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float opticalDepth = 0.0;
		for (int pointIndex = 0; pointIndex <= INTERVAL_COUNT; pointIndex += 1) {
			float distanceMeters = atmosphereLengthMeters * float(pointIndex) / float(INTERVAL_COUNT);
			float weight = pointIndex == 0 || pointIndex == INTERVAL_COUNT ? 0.5 : 1.0;
			MediumSample medium = sampleAtmosphere(resolveAtmosphereCoordinate(ray, distanceMeters));
			opticalDepth += medium.extinction.c[channelIndex] * atmosphereLengthMeters * weight / float(INTERVAL_COUNT);
		}
		result.c[channelIndex] = exp(-opticalDepth);
	}
	return result;
}

void evaluateFlatFiniteSunRadiance(inout ShaderState state) {
	SpectralValue result = zeroSpectral();
	const vec2 OFFSETS[4] = vec2[4](vec2(-0.25, -0.25), vec2(0.25, -0.25), vec2(-0.25, 0.25), vec2(0.25, 0.25));
	for (int sampleIndex = 0; sampleIndex < 4; sampleIndex += 1) {
		vec2 sampleUv = clamp(state.uv + OFFSETS[sampleIndex] / max(uViewportSizePixels, vec2(1.0)), vec2(0.0), vec2(1.0));
		if (flatFiniteSunSampleIsSceneBlocked(sampleUv)) continue;
		ViewRay sampleRay = reconstructViewRay(sampleUv);
		float bodyEntryDistanceMeters;
		if (!flatFiniteSunRayEntryDistance(sampleRay, bodyEntryDistanceMeters)) continue;
		SpectralValue radiance = sampleFlatFiniteSunRadiance();
		SpectralValue transmittance = flatFiniteSunTransmittance(sampleRay, bodyEntryDistanceMeters);
		for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) result.c[channelIndex] += 0.25 * radiance.c[channelIndex] * transmittance.c[channelIndex];
	}
	state.celestialRadiance = result;
}`)],
			mainHooks: [createShaderSourceBlock('celestial-flat-finite-sun-live-main', 'evaluateCelestialRadiance', 0, 'evaluateFlatFiniteSunRadiance(state);')],
			bindingRequirements: [
				createShaderBindingRequirement('celestial.flat-finite-sun-center', 'geometry', 'uniform', 'per-frame', CENTER_KEY, true),
				createShaderBindingRequirement('celestial.flat-finite-sun-radius', 'cache', 'uniform', 'setup', RADIUS_KEY, false),
			],
		});
	}

	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._artifact.dispose();
	}
}

export default FlatFiniteSunGpuCache;
