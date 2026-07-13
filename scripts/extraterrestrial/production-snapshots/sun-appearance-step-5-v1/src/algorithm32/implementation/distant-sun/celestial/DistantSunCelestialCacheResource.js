import {DISTANT_SUN_CELESTIAL_CACHE_VALUE_KEY} from '../../../celestial-contribution-cache/consts.js';
import {MAXIMUM_GPU_FIELD_PROBE_SCALAR_COUNT} from '../../../gpu-cache-runtime/consts.js';
import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../../shader-assembly/base/ShaderSource.js';
import {DISTANT_SUN_CELESTIAL_SAMPLER_NAME, DISTANT_SUN_CELESTIAL_STORAGE} from './consts.js';

/**
 * Completed distant-Sun celestial GPU field and its renderer-neutral lookup contract.
 *
 * @implements {DistantSunCelestialCacheResource}
 */
export class DistantSunCelestialCacheResource {
	/** @type {GpuFieldArtifact} */
	_artifact;
	/** @type {boolean} */
	_disposed = false;
	/** @type {string} */
	resourceIdentity;
	/** @type {string} */
	sourceId;
	/** @type {DistantSunCelestialCacheDescriptor} */
	descriptor;

	/**
	 * Creates one resource that takes ownership of a completely constructed distant-Sun field artifact.
	 *
	 * @param {DistantSunCelestialCacheResourceConfiguration} request - Completed artifact and trusted plan facts.
	 */
	constructor(request) {
		this._artifact = request.artifact;
		this.resourceIdentity = request.plan.identity.contentHash;
		this.sourceId = request.plan.descriptor.logicalField.sourceId;
		this.descriptor = request.plan.descriptor;
	}

	/**
	 * Called by resource capabilities to require the completed field to remain live.
	 *
	 * @returns {void} - No return value.
	 * @throws {Error} - When the resource was disposed.
	 */
	_requireLive() {
		if (this._disposed) {
			throw new Error('DistantSunCelestialCacheResource is disposed.');
		}
	}

	/**
	 * Called by bounded probes to accept one integer field coordinate.
	 *
	 * @param {number} value - Candidate coordinate.
	 * @param {number} maximum - Exclusive field extent.
	 * @param {string} label - Diagnostic coordinate label.
	 * @returns {number} - Accepted coordinate.
	 * @throws {RangeError} - When the coordinate is outside the field.
	 */
	_boundedCoordinate(value, maximum, label) {
		if (!Number.isSafeInteger(value) || value < 0 || value >= maximum) {
			throw new RangeError(`${label} must be an integer from 0 through ${maximum - 1}.`);
		}
		return value;
	}

	/**
	 * Called by bounded probes to validate, copy, and adapt exact family coordinates.
	 *
	 * @param {readonly DistantSunCelestialFieldCoordinate[]} coordinates - Candidate family coordinates.
	 * @returns {readonly DirectionalSpectralFieldCoordinates[]} - Accepted neutral coordinates.
	 * @throws {RangeError} - When the selection is empty, too large, duplicate, or outside the field.
	 */
	_acceptProbeCoordinates(coordinates) {
		if (coordinates.length === 0 || coordinates.length > MAXIMUM_GPU_FIELD_PROBE_SCALAR_COUNT) {
			throw new RangeError(
				`Distant-Sun celestial probes require 1 through ${MAXIMUM_GPU_FIELD_PROBE_SCALAR_COUNT} scalars.`,
			);
		}
		const accepted = coordinates.map(
			/**
			 * Called by Array.prototype.map to validate and adapt one distant-Sun field coordinate.
			 * @param {DistantSunCelestialFieldCoordinate} coordinate - Family-owned scalar coordinate.
			 * @param {number} index - Coordinate index.
			 * @returns {DirectionalSpectralFieldCoordinates} - Neutral GPU field coordinate.
			 */
			(coordinate, index) => ({
				directionIndex: this._boundedCoordinate(
					coordinate.directionIndex,
					DISTANT_SUN_CELESTIAL_STORAGE.width,
					`Distant-Sun celestial probe ${index}.directionIndex`,
				),
				positionIndex: this._boundedCoordinate(
					coordinate.receiverIndex,
					DISTANT_SUN_CELESTIAL_STORAGE.height,
					`Distant-Sun celestial probe ${index}.receiverIndex`,
				),
				wavelengthIndex: this._boundedCoordinate(
					coordinate.wavelengthIndex,
					DISTANT_SUN_CELESTIAL_STORAGE.layers,
					`Distant-Sun celestial probe ${index}.wavelengthIndex`,
				),
			}),
		);
		const keys = accepted.map(
			/**
			 * Called by Array.prototype.map to identify one accepted probe coordinate.
			 * @param {DirectionalSpectralFieldCoordinates} coordinate - Accepted coordinate.
			 * @returns {string} - Coordinate identity.
			 */
			(coordinate) => `${coordinate.directionIndex}:${coordinate.positionIndex}:${coordinate.wavelengthIndex}`,
		);
		if (new Set(keys).size !== keys.length) {
			throw new RangeError('Distant-Sun celestial probes must not contain duplicate coordinates.');
		}
		return accepted;
	}

	/**
	 * Called by bounded probes to validate the external reader's selected-scalar result.
	 *
	 * @param {CacheProbeResult} result - Candidate backend result.
	 * @param {readonly DirectionalSpectralFieldCoordinates[]} coordinates - Accepted requested coordinates.
	 * @returns {CacheProbeResult} - Validated result.
	 * @throws {RangeError} - When a sample is missing, reordered, nonfinite, or otherwise mismatched.
	 */
	_acceptProbeResult(result, coordinates) {
		if (result.fieldId !== this._artifact.result.id || result.samples.length !== coordinates.length) {
			throw new RangeError('Distant-Sun celestial probe result does not match its field or scalar count.');
		}
		for (const [index, sample] of result.samples.entries()) {
			const expected = coordinates[index];
			if (
				sample.coordinates.directionIndex !== expected.directionIndex ||
				sample.coordinates.positionIndex !== expected.positionIndex ||
				sample.coordinates.wavelengthIndex !== expected.wavelengthIndex ||
				!Number.isFinite(sample.value)
			) {
				throw new RangeError(`Distant-Sun celestial probe sample ${index} does not match its request.`);
			}
		}
		return result;
	}

	/**
	 * Call this method to return the sole opaque distant-Sun runtime binding.
	 *
	 * @returns {DistantSunCelestialRuntimeBindings} - The exact one-binding collection.
	 */
	getRuntimeBindings() {
		this._requireLive();
		return /** @type {DistantSunCelestialRuntimeBindings} */ (this._artifact.runtimeBindings);
	}

	/**
	 * Call this method to contribute cache-owned bilinear scalar-array lookup without a live disk consumer.
	 *
	 * @returns {ShaderContribution} - The distant-Sun celestial lookup contribution.
	 */
	createShaderContribution() {
		this._requireLive();
		return ShaderContributions.createShaderContribution({
			id: 'cache-distant-sun-celestial-transport',
			owner: 'cache',
			provides: ['cache.sampleDistantSunCelestialRadiance'],
			requires: ['geometry.celestialCacheStencilTypes'],
			textures: [
				ShaderContributions.createShaderTextureDeclaration(
					DISTANT_SUN_CELESTIAL_SAMPLER_NAME,
					'sampler2DArray',
					DISTANT_SUN_CELESTIAL_CACHE_VALUE_KEY,
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'cache-distant-sun-celestial-bilinear-lookup',
					'sampleCelestialCache',
					0,
					`SpectralValue sampleDistantSunCelestialRadiance(
	CelestialCacheBilinearStencil stencil
) {
	SpectralValue radiance;

	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float channelRadiance = 0.0;
		for (int receiverTapIndex = 0; receiverTapIndex < 2; receiverTapIndex += 1) {
			for (int directionTapIndex = 0; directionTapIndex < 2; directionTapIndex += 1) {
				float weight = stencil.receiverWeights[receiverTapIndex]
					* stencil.directionWeights[directionTapIndex];
				channelRadiance += weight * texelFetch(
					${DISTANT_SUN_CELESTIAL_SAMPLER_NAME},
					ivec3(
						stencil.directionIndices[directionTapIndex],
						stencil.receiverIndices[receiverTapIndex],
						channelIndex
					),
					0
				).r;
			}
		}
		radiance.channels[channelIndex] = channelRadiance;
	}

	return radiance;
}`,
				),
			],
			bindingRequirements: [
				ShaderContributions.createShaderBindingRequirement(
					'cache.distant-sun-celestial-transport',
					'cache',
					'texture',
					'setup',
					DISTANT_SUN_CELESTIAL_CACHE_VALUE_KEY,
					true,
				),
			],
		});
	}

	/**
	 * Call this method to contribute the fixed live distant-Sun disk raster over this completed field.
	 *
	 * @param {DistantSunCelestialLiveShaderContributionRequest} request - Trusted source and geometry query facts.
	 * @returns {ShaderContribution} - The live distant-Sun raster contribution.
	 */
	createLiveShaderContribution(request) {
		this._requireLive();
		const angularRadiusRadians = request.source.celestialSourceDefinition.angularRadius.value;
		return ShaderContributions.createShaderContribution({
			id: 'celestial-distant-sun-live-raster',
			owner: 'celestialCache',
			provides: ['celestial.evaluateRadiance'],
			requires: [
				'runtime.initialState',
				'runtime.sceneHitTexture',
				'geometry.reconstructViewRay',
				'geometry.resolveCelestialCacheStencil',
				'geometry.resolveDistantSunDiskSupport',
				'light.directionToAtmosphericSource',
				'cache.sampleDistantSunCelestialRadiance',
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'distant-sun-celestial-live-constants',
					'declareConstants',
					0,
					`const float DISTANT_SUN_CELESTIAL_MINIMUM_DISK_COSINE = ${ShaderSource.formatFloat(
						Math.cos(angularRadiusRadians),
					)};
const vec2 DISTANT_SUN_CELESTIAL_SAMPLE_OFFSETS[4] = vec2[4](
	vec2(-0.25, -0.25),
	vec2(0.25, -0.25),
	vec2(-0.25, 0.25),
	vec2(0.25, 0.25)
);
const float DISTANT_SUN_CELESTIAL_SAMPLE_WEIGHT = 0.25;`,
				),
				ShaderContributions.createShaderSourceBlock(
					'distant-sun-celestial-live-evaluate',
					'evaluateCelestialRadiance',
					0,
					`bool distantSunCelestialSampleIsSceneBlocked(vec2 sampleTextureCoordinates) {
	ivec2 sceneHitDimensions = textureSize(uSceneHitTexture, 0);
	ivec2 samplePixel = clamp(
		ivec2(floor(sampleTextureCoordinates * uViewportSizePixels)),
		ivec2(0),
		sceneHitDimensions - ivec2(1)
	);
	return texelFetch(uSceneHitTexture, samplePixel, 0).r > 0.5;
}

SpectralValue evaluateDistantSunCelestialRadiance(ShaderState state) {
	SpectralValue celestialRadiance = zeroSpectral();
	CelestialCacheBilinearStencil stencil = resolveDistantSunCelestialCacheStencil();
	if (!stencil.valid) {
		return celestialRadiance;
	}

	bool visibleSamples[4] = bool[4](false, false, false, false);
	bool anySampleVisible = false;
	for (int sampleIndex = 0; sampleIndex < 4; sampleIndex += 1) {
		vec2 sampleTextureCoordinates =
			state.textureCoordinates
				+ DISTANT_SUN_CELESTIAL_SAMPLE_OFFSETS[sampleIndex]
					/ max(uViewportSizePixels, vec2(1.0));
		if (any(lessThan(sampleTextureCoordinates, vec2(0.0)))
			|| any(greaterThanEqual(sampleTextureCoordinates, vec2(1.0)))) {
			continue;
		}
		if (distantSunCelestialSampleIsSceneBlocked(sampleTextureCoordinates)) {
			continue;
		}

		ViewRay sampleRay = reconstructViewRay(sampleTextureCoordinates);
		vec3 directionToSun = normalize(directionToAtmosphericSource(sampleRay.originMeters));
		if (dot(sampleRay.direction, directionToSun) < DISTANT_SUN_CELESTIAL_MINIMUM_DISK_COSINE) {
			continue;
		}
		if (!distantSunCelestialSampleHasGroundSupport(sampleRay.direction)) {
			continue;
		}
		visibleSamples[sampleIndex] = true;
		anySampleVisible = true;
	}

	if (!anySampleVisible) {
		return celestialRadiance;
	}

	SpectralValue sampleRadiance = sampleDistantSunCelestialRadiance(stencil);
	for (int sampleIndex = 0; sampleIndex < 4; sampleIndex += 1) {
		if (!visibleSamples[sampleIndex]) {
			continue;
		}
		for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
			celestialRadiance.channels[channelIndex] +=
				DISTANT_SUN_CELESTIAL_SAMPLE_WEIGHT * sampleRadiance.channels[channelIndex];
		}
	}
	return celestialRadiance;
}`,
				),
			],
			mainHooks: [
				ShaderContributions.createShaderSourceBlock(
					'distant-sun-celestial-live-main',
					'evaluateCelestialRadiance',
					0,
					'SpectralValue celestialRadiance = evaluateDistantSunCelestialRadiance(state);',
				),
			],
			diagnostics: {
				sourceId: this.sourceId,
				queryIdentity: request.queryPacket.contentHash,
				sampleCount: 4,
			},
		});
	}

	/**
	 * Call this method to read a bounded set of selected field scalars without exposing the full field.
	 *
	 * @param {CacheProbeReader} probeReader - Backend-owned bounded probe capability.
	 * @param {readonly DistantSunCelestialFieldCoordinate[]} coordinates - Exact scalars to inspect.
	 * @returns {Promise<CacheProbeResult>} - Selected resident-field samples.
	 */
	async readSelectedScalars(probeReader, coordinates) {
		this._requireLive();
		if (typeof probeReader?.readSelectedScalars !== 'function') {
			throw new TypeError('Distant-Sun celestial probes require a bounded probe reader.');
		}
		const acceptedCoordinates = this._acceptProbeCoordinates(coordinates);
		const result = await probeReader.readSelectedScalars({
			field: this._artifact.result,
			coordinates: acceptedCoordinates,
		});
		return this._acceptProbeResult(result, acceptedCoordinates);
	}

	/**
	 * Call this method to release the completed distant-Sun celestial field exactly once.
	 *
	 * @returns {void} - No return value.
	 */
	dispose() {
		if (this._disposed) {
			return;
		}
		this._disposed = true;
		this._artifact.dispose();
	}
}
