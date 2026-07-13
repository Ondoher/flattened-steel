import {FLAT_FINITE_SUN_CACHE_VALUE_KEY} from '../../../celestial-contribution-cache/consts.js';
import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../../shader-assembly/base/ShaderSource.js';
import {FLAT_FINITE_SUN_SAMPLER_NAME} from './consts.js';

/** Completed Flat finite-Sun GPU field and live visible-disk consumer. */
export class FlatFiniteSunCacheResource {
	/** @type {GpuFieldArtifact} */
	_artifact;
	/** @type {boolean} */
	_disposed = false;
	/** @type {string} */
	resourceIdentity;
	/** @type {string} */
	sourceId;
	/** @type {FlatFiniteSunCacheDescriptor} */
	descriptor;

	/**
	 * Creates one resource that owns a completed finite-Sun field artifact.
	 *
	 * @param {FlatFiniteSunCacheResourceConfiguration} request - Completed artifact and plan.
	 */
	constructor(request) {
		this._artifact = request.artifact;
		this.resourceIdentity = request.plan.identity.contentHash;
		this.sourceId = request.plan.sourceId;
		this.descriptor = request.plan.descriptor;
	}

	/** Require the completed resource to remain live. */
	_requireLive() {
		if (this._disposed) {
			throw new Error('FlatFiniteSunCacheResource is disposed.');
		}
	}

	/** @returns {FlatFiniteSunRuntimeBindings} - The exact one-binding collection. */
	getRuntimeBindings() {
		this._requireLive();
		return /** @type {FlatFiniteSunRuntimeBindings} */ (this._artifact.runtimeBindings);
	}

	/** @returns {ShaderContribution} - The one-texel spectral lookup contribution. */
	createShaderContribution() {
		this._requireLive();
		return ShaderContributions.createShaderContribution({
			id: 'cache-flat-finite-sun-radiance',
			owner: 'cache',
			provides: ['cache.sampleFlatFiniteSunRadiance'],
			requires: [],
			textures: [
				ShaderContributions.createShaderTextureDeclaration(
					FLAT_FINITE_SUN_SAMPLER_NAME,
					'sampler2DArray',
					FLAT_FINITE_SUN_CACHE_VALUE_KEY,
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'cache-flat-finite-sun-radiance-lookup',
					'sampleCelestialCache',
					0,
					`SpectralValue sampleFlatFiniteSunRadiance() {
	SpectralValue radiance;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		radiance.channels[channelIndex] = texelFetch(
			${FLAT_FINITE_SUN_SAMPLER_NAME},
			ivec3(0, 0, channelIndex),
			0
		).r;
	}
	return radiance;
}`,
				),
			],
			bindingRequirements: [
				ShaderContributions.createShaderBindingRequirement(
					'cache.flat-finite-sun-radiance',
					'cache',
					'texture',
					'setup',
					FLAT_FINITE_SUN_CACHE_VALUE_KEY,
					true,
				),
			],
		});
	}

	/**
	 * Call this method to contribute the live finite local-Sun raster.
	 *
	 * @param {FlatFiniteSunLiveShaderContributionRequest} request - Trusted source and geometry facts.
	 * @returns {ShaderContribution} - Live finite-disk contribution.
	 */
	createLiveShaderContribution(request) {
		this._requireLive();
		const definition = request.source.celestialSourceDefinition;
		const centerMeters = request.placement.center.coordinates;
		return ShaderContributions.createShaderContribution({
			id: 'celestial-flat-finite-sun-live-raster',
			owner: 'celestialCache',
			provides: ['celestial.evaluateRadiance'],
			requires: [
				'runtime.initialState',
				'runtime.sceneHitTexture',
				'geometry.reconstructViewRay',
				'geometry.resolveAtmosphereCoordinate',
				'geometry.finiteCelestialAtmosphereSegment',
				'atmosphere.sampleMedium',
				'cache.sampleFlatFiniteSunRadiance',
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'flat-finite-sun-live-constants',
					'declareConstants',
					0,
					`const vec3 FLAT_FINITE_SUN_CENTER_METERS = ${ShaderSource.formatVec3(centerMeters)};
const float FLAT_FINITE_SUN_RADIUS_METERS = ${ShaderSource.formatFloat(definition.radius.value)};
const int FLAT_FINITE_SUN_TRANSMITTANCE_INTERVAL_COUNT = ${request.model.profile.numerical.sourcePathTransmittance.intervalCount};
const vec2 FLAT_FINITE_SUN_SAMPLE_OFFSETS[4] = vec2[4](
	vec2(-0.25, -0.25),
	vec2(0.25, -0.25),
	vec2(-0.25, 0.25),
	vec2(0.25, 0.25)
);
const float FLAT_FINITE_SUN_SAMPLE_WEIGHT = 0.25;`,
				),
				ShaderContributions.createShaderSourceBlock(
					'flat-finite-sun-live-evaluate',
					'evaluateCelestialRadiance',
					0,
					`bool flatFiniteSunSampleIsSceneBlocked(vec2 sampleTextureCoordinates) {
	ivec2 dimensions = textureSize(uSceneHitTexture, 0);
	ivec2 samplePixel = clamp(
		ivec2(floor(sampleTextureCoordinates * uViewportSizePixels)),
		ivec2(0),
		dimensions - ivec2(1)
	);
	return texelFetch(uSceneHitTexture, samplePixel, 0).r > 0.5;
}

bool flatFiniteSunEntryDistance(ViewRay ray, out float entryDistanceMeters) {
	vec3 offset = ray.originMeters - FLAT_FINITE_SUN_CENTER_METERS;
	float projectedOffset = dot(offset, ray.direction);
	float radialTerm = dot(offset, offset)
		- FLAT_FINITE_SUN_RADIUS_METERS * FLAT_FINITE_SUN_RADIUS_METERS;
	float discriminant = projectedOffset * projectedOffset - radialTerm;
	if (discriminant < 0.0) return false;
	float root = sqrt(max(discriminant, 0.0));
	float nearDistanceMeters = -projectedOffset - root;
	float farDistanceMeters = -projectedOffset + root;
	entryDistanceMeters = nearDistanceMeters >= 0.0 ? nearDistanceMeters : farDistanceMeters;
	return entryDistanceMeters >= 0.0;
}

SpectralValue flatFiniteSunTransmittance(ViewRay ray, float bodyEntryDistanceMeters) {
	SpectralValue transmittance;
	float atmosphereLengthMeters = finiteCelestialAtmosphereSegmentLength(ray, bodyEntryDistanceMeters);
	float intervalLengthMeters = atmosphereLengthMeters
		/ float(FLAT_FINITE_SUN_TRANSMITTANCE_INTERVAL_COUNT);
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float opticalDepth = 0.0;
		for (int pointIndex = 0; pointIndex <= FLAT_FINITE_SUN_TRANSMITTANCE_INTERVAL_COUNT; pointIndex += 1) {
			float distanceMeters = intervalLengthMeters * float(pointIndex);
			float weight = pointIndex == 0 || pointIndex == FLAT_FINITE_SUN_TRANSMITTANCE_INTERVAL_COUNT
				? 0.5
				: 1.0;
			MediumSample medium = sampleAtmosphere(resolveAtmosphereCoordinate(ray, distanceMeters));
			opticalDepth += medium.extinction.channels[channelIndex] * intervalLengthMeters * weight;
		}
		transmittance.channels[channelIndex] = exp(-opticalDepth);
	}
	return transmittance;
}

SpectralValue evaluateFlatFiniteSunRadiance(ShaderState state) {
	SpectralValue result = zeroSpectral();
	for (int sampleIndex = 0; sampleIndex < 4; sampleIndex += 1) {
		vec2 sampleTextureCoordinates = state.textureCoordinates
			+ FLAT_FINITE_SUN_SAMPLE_OFFSETS[sampleIndex]
				/ max(uViewportSizePixels, vec2(1.0));
		if (any(lessThan(sampleTextureCoordinates, vec2(0.0)))
			|| any(greaterThanEqual(sampleTextureCoordinates, vec2(1.0)))
			|| flatFiniteSunSampleIsSceneBlocked(sampleTextureCoordinates)) {
			continue;
		}
		ViewRay sampleRay = reconstructViewRay(sampleTextureCoordinates);
		float bodyEntryDistanceMeters;
		if (!flatFiniteSunEntryDistance(sampleRay, bodyEntryDistanceMeters)) continue;
		SpectralValue radiance = sampleFlatFiniteSunRadiance();
		SpectralValue transmittance = flatFiniteSunTransmittance(sampleRay, bodyEntryDistanceMeters);
		for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
			result.channels[channelIndex] += FLAT_FINITE_SUN_SAMPLE_WEIGHT
				* radiance.channels[channelIndex]
				* transmittance.channels[channelIndex];
		}
	}
	return result;
}`,
				),
			],
			mainHooks: [
				ShaderContributions.createShaderSourceBlock(
					'flat-finite-sun-live-main',
					'evaluateCelestialRadiance',
					0,
					'SpectralValue celestialRadiance = evaluateFlatFiniteSunRadiance(state);',
				),
			],
			diagnostics: {sourceId: this.sourceId, sampleCount: 4},
		});
	}

	/** Call this method to release the field exactly once. */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._artifact.dispose();
	}
}
