import {ShaderContributions} from '../shader-assembly/base/ShaderContributions.js';
import {
	ALGORITHM32_TRANSPORT_MAIN_SYMBOLS,
	TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME,
	TRANSPORT_PATH_INTERVAL_COUNT_VALUE_KEY,
} from './consts.js';

/** Implement the source- and geometry-neutral final-view transport. */
export class Algorithm32Transport {
	/**
	 * Call this method to return symbols needed by the complete Algorithm32 shader main path.
	 * @returns - The result produced by the operation.
	 */
	mainRequiredShaderSymbols() {
		return ALGORITHM32_TRANSPORT_MAIN_SYMBOLS;
	}

	/**
	 * Call this method to create the one cumulative-cache transport contribution.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	createShaderContribution(request) {
		const options = request.model.profile.numerical.viewPath;
		const celestialSourcesEnabled = request.model.celestialSources !== null;
		const pathSampleHelper = this._transportPathSampleHelper(
			options.sampleDistribution?.kind ?? 'uniform-distance',
		);

		const functions = [
			ShaderContributions.createShaderSourceBlock(
				'transport-evaluate-helper',
				'evaluateTransport',
				0,
				this._cumulativeTransportBlock(pathSampleHelper),
			),
		];
		const mainHooks = [
			ShaderContributions.createShaderSourceBlock(
				'transport-main-evaluate',
				'evaluateTransport',
				0,
				'evaluatePathRadiance(state);',
			),
		];
		const provides = ['transport.evaluatePathRadiance'];

		if (celestialSourcesEnabled) {
			provides.push('composition.composeSpectralRadiance');
			functions.push(
				ShaderContributions.createShaderSourceBlock(
					'transport-compose-spectral-helper',
					'composeSpectralRadiance',
					0,
					`SpectralValue composeSpectralRadiance(SpectralValue pathRadiance, SpectralValue celestialRadiance) {
	SpectralValue preDisplayRadiance;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		preDisplayRadiance.channels[channelIndex] = pathRadiance.channels[channelIndex]
			+ celestialRadiance.channels[channelIndex];
	}
	return preDisplayRadiance;
}`,
				),
			);
			mainHooks.push(
				ShaderContributions.createShaderSourceBlock(
					'transport-compose-spectral-main',
					'composeSpectralRadiance',
					0,
					'SpectralValue preDisplayRadiance = composeSpectralRadiance(state.pathRadiance, celestialRadiance);',
				),
			);
		}

		return ShaderContributions.createShaderContribution({
			id: 'transport-algorithm32-cumulative-cache',
			owner: 'transport',
			provides,
			requires: [
				'atmosphere.sampleMedium',
				'geometry.resolveAtmosphereCoordinate',
				'geometry.resolveScatteringCachePositionStencil',
				'geometry.resolveScatteringCacheDirectionStencil',
				'cache.sampleCumulativeScatteringDensity',
			],
			uniforms: [
				ShaderContributions.createShaderUniformDeclaration(
					TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME,
					'int',
					TRANSPORT_PATH_INTERVAL_COUNT_VALUE_KEY,
					options.intervalCount,
				),
			],
			functions,
			mainHooks,
		});
	}

	/**
	 * Called by algorithm32 transport to build the selected view-path sampling GLSL helper. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 * @param kind - The kind value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	_transportPathSampleHelper(kind) {
		if (kind === 'tangent-density-adaptive-v1' || kind === 'tangent-density-adaptive-soft-v1') {
			const adaptiveBlend = kind === 'tangent-density-adaptive-soft-v1' ? '0.35' : '1.0';
			return `float pathSampleFraction(ShaderState state, float uniformFraction) {
	float startDistanceMeters = state.bounds.startDistanceMeters;
	float endDistanceMeters = state.bounds.endDistanceMeters;
	float pathLengthMeters = max(endDistanceMeters - startDistanceMeters, 0.0);
	if (pathLengthMeters <= 0.0) {
		return 0.0;
	}

	float tangentDistanceMeters = clamp(
		-dot(state.ray.originMeters, state.ray.direction),
		startDistanceMeters,
		endDistanceMeters
	);
	float tangentFraction = clamp(
		(tangentDistanceMeters - startDistanceMeters) / pathLengthMeters,
		0.0,
		1.0
	);
	bool hasInteriorTangent = tangentFraction > 0.08 && tangentFraction < 0.92;
	float adaptiveFraction = uniformFraction;

	if (hasInteriorTangent) {
		if (uniformFraction <= tangentFraction) {
			float localFraction = uniformFraction / max(tangentFraction, 0.0001);
			float warpedLocal = 1.0 - pow(1.0 - localFraction, 2.0);
			adaptiveFraction = tangentFraction * warpedLocal;
		} else {
			float remainingFraction = max(1.0 - tangentFraction, 0.0001);
			float localFraction = (uniformFraction - tangentFraction) / remainingFraction;
			float warpedLocal = pow(localFraction, 2.0);
			adaptiveFraction = tangentFraction + remainingFraction * warpedLocal;
		}
	} else {
		adaptiveFraction = pow(uniformFraction, 1.75);
	}

	return mix(uniformFraction, adaptiveFraction, ${adaptiveBlend});
}

float pathSampleDistanceForIndex(ShaderState state, int pointIndex) {
	float uniformFraction = float(pointIndex) / float(max(${TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME}, 1));
	float sampleFraction = pathSampleFraction(state, clamp(uniformFraction, 0.0, 1.0));
	return mix(state.bounds.startDistanceMeters, state.bounds.endDistanceMeters, sampleFraction);
}

float pathSampleMeasureMeters(ShaderState state, int pointIndex) {
	float previousDistanceMeters = pointIndex > 0
		? pathSampleDistanceForIndex(state, pointIndex - 1)
		: pathSampleDistanceForIndex(state, pointIndex);
	float nextDistanceMeters = pointIndex < ${TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME}
		? pathSampleDistanceForIndex(state, pointIndex + 1)
		: pathSampleDistanceForIndex(state, pointIndex);
	return max(0.0, 0.5 * (nextDistanceMeters - previousDistanceMeters));
}`;
		}

		return `float pathSampleDistanceForIndex(ShaderState state, int pointIndex) {
	float uniformFraction = float(pointIndex) / float(max(${TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME}, 1));
	return mix(
		state.bounds.startDistanceMeters,
		state.bounds.endDistanceMeters,
		clamp(uniformFraction, 0.0, 1.0)
	);
}

float pathSampleMeasureMeters(ShaderState state, int pointIndex) {
	float stepMeters = max(state.bounds.endDistanceMeters - state.bounds.startDistanceMeters, 0.0)
		/ float(max(${TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME}, 1));
	return ((pointIndex == 0 || pointIndex == ${TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME}) ? 0.5 : 1.0)
		* stepMeters;
}`;
	}

	/**
	 * Called by algorithm32 transport to integrate one already-cumulative local scattering-density field.
	 * @param pathSampleHelper - The path sample helper value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	_cumulativeTransportBlock(pathSampleHelper) {
		return `SpectralValue computeTrapezoidSegmentTransmittance(MediumSample previousMedium, MediumSample currentMedium, float intervalLengthMeters) {
	SpectralValue transmittance;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		transmittance.channels[channelIndex] = exp(
			-0.5
			* (previousMedium.extinction.channels[channelIndex] + currentMedium.extinction.channels[channelIndex])
			* intervalLengthMeters
		);
	}
	return transmittance;
}

${pathSampleHelper}

void evaluatePathRadiance(inout ShaderState state) {
	if (!state.bounds.valid) {
		state.pathRadiance = zeroSpectral();
		state.transmittance = oneSpectral();
		return;
	}

	SpectralValue viewTransmittance = oneSpectral();
	SpectralValue radiance = zeroSpectral();
	MediumSample previousMedium;
	bool hasPreviousMedium = false;
	float previousDistanceMeters = state.bounds.startDistanceMeters;

	for (int pointIndex = 0; pointIndex <= ${TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME}; pointIndex += 1) {
		float distanceMeters = pathSampleDistanceForIndex(state, pointIndex);
		vec3 positionMeters = state.ray.originMeters + state.ray.direction * distanceMeters;
		AtmosphereCoordinate atmosphereCoordinate = resolveAtmosphereCoordinate(
			state.ray,
			distanceMeters
		);
		MediumSample medium = sampleAtmosphere(atmosphereCoordinate);

		if (hasPreviousMedium) {
			float segmentLengthMeters = max(distanceMeters - previousDistanceMeters, 0.0);
			SpectralValue segmentTransmittance =
				computeTrapezoidSegmentTransmittance(previousMedium, medium, segmentLengthMeters);
			for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
				viewTransmittance.channels[channelIndex] *= segmentTransmittance.channels[channelIndex];
			}
		}

		CachePositionStencil positionStencil =
			resolveScatteringCachePositionStencil(atmosphereCoordinate);
		CacheDirectionStencil directionStencil = resolveScatteringCacheDirectionStencil(
			positionMeters,
			state.ray.direction
		);
		SpectralValue cumulativeScatteringDensity = sampleCumulativeScatteringDensity(
			positionStencil,
			directionStencil
		);
		float measureMeters = pathSampleMeasureMeters(state, pointIndex);
		for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
			radiance.channels[channelIndex] += viewTransmittance.channels[channelIndex]
				* cumulativeScatteringDensity.channels[channelIndex]
				* measureMeters;
		}

		previousMedium = medium;
		previousDistanceMeters = distanceMeters;
		hasPreviousMedium = true;
	}

	state.transmittance = viewTransmittance;
	state.pathRadiance = radiance;
}`;
	}
}
