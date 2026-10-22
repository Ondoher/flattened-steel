import {ShaderContributions} from '../shader-assembly/base/ShaderContributions.js';
import {PositiveColumnViewTransport} from './PositiveColumnViewTransport.js';
import {
	ATMOSPHERIC_VIEW_ENABLED_UNIFORM_NAME,
	ATMOSPHERIC_VIEW_ENABLED_VALUE_KEY,
	ALGORITHM32_TRANSPORT_MAIN_SYMBOLS,
	TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME,
	TRANSPORT_PATH_INTERVAL_COUNT_VALUE_KEY,
} from './consts.js';

/** Shared source- and geometry-neutral final-view transport.
 *
 * @implements {Algorithm32Transport}
 */
export class Algorithm32Transport {
	/**
	 * Call this method to return symbols needed by the complete Algorithm32 shader main path.
	 *
	 * @returns {readonly string[]} - Required shared transport symbols.
	 */
	mainRequiredShaderSymbols() {
		return ALGORITHM32_TRANSPORT_MAIN_SYMBOLS;
	}

	/**
	 * Call this method to create the one cumulative-cache transport contribution.
	 *
	 * @param {Algorithm32TransportShaderRequest} request - Accepted physical/numerical execution model.
	 * @returns {ShaderContribution} - Complete shared path evaluator contribution.
	 */
	createShaderContribution(request) {
		const options = request.model.profile.numerical.viewPath;
		const celestialSourcesEnabled = request.model.celestialSources !== null;
		const pathSampleDistributionKind = options.sampleDistribution?.kind ?? 'uniform-distance';
		const pathSampleHelper = this._transportPathSampleHelper(pathSampleDistributionKind);

		const functions = [
			ShaderContributions.createShaderSourceBlock(
				'transport-evaluate-helper',
				'evaluateTransport',
				0,
				options.kind === 'local-positive-column-v1'
					? new PositiveColumnViewTransport().createSource(
							/** @type {PositiveColumnViewAtmosphere} */ (request.model.atmosphere),
						)
					: pathSampleDistributionKind === 'quadratic-near-observer-v1'
						? this._quadraticMidpointTransportBlock(pathSampleHelper)
						: this._cumulativeTransportBlock(pathSampleHelper),
			),
		];
		const mainHooks = [
			ShaderContributions.createShaderSourceBlock(
				'transport-main-evaluate',
				'evaluateTransport',
				0,
				`if (${ATMOSPHERIC_VIEW_ENABLED_UNIFORM_NAME}) {
	evaluatePathRadiance(state);
} else {
	state.pathRadiance = zeroSpectral();
	state.transmittance = oneSpectral();
}`,
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
				'cache.sampleCumulativeScatteringDensity',
			],
			uniforms: [
				ShaderContributions.createShaderUniformDeclaration(
					ATMOSPHERIC_VIEW_ENABLED_UNIFORM_NAME,
					'bool',
					ATMOSPHERIC_VIEW_ENABLED_VALUE_KEY,
					true,
				),
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
	 *
	 * @param {Algorithm32ViewPathSampleKind} kind - Accepted placement policy.
	 * @returns {string} - Source for the selected physical-distance sampler.
	 */
	_transportPathSampleHelper(kind) {
		if (kind === 'quadratic-near-observer-v1') {
			return `float pathIntervalBoundaryDistance(ShaderState state, int boundaryIndex) {
	float fraction = float(boundaryIndex) / float(max(${TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME}, 1));
	return mix(
		state.bounds.startDistanceMeters,
		state.bounds.endDistanceMeters,
		clamp(fraction * fraction, 0.0, 1.0)
	);
}`;
		}
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

	/** Called by shared transport to emit the qualified quadratic-boundary Q30 midpoint operation.
	 *
	 * @param {string} pathSampleHelper - Geometry-neutral distance placement source.
	 * @returns {string} - Complete midpoint path evaluator.
	 */
	_quadraticMidpointTransportBlock(pathSampleHelper) {
		return `${pathSampleHelper}

void evaluatePathRadiance(inout ShaderState state) {
	if (!state.bounds.valid) {
		state.pathRadiance = zeroSpectral();
		state.transmittance = oneSpectral();
		return;
	}

	SpectralValue viewTransmittance = oneSpectral();
	SpectralValue radiance = zeroSpectral();

	for (int intervalIndex = 0; intervalIndex < ${TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME}; intervalIndex += 1) {
		float startDistanceMeters = pathIntervalBoundaryDistance(state, intervalIndex);
		float endDistanceMeters = pathIntervalBoundaryDistance(state, intervalIndex + 1);
		float intervalLengthMeters = max(endDistanceMeters - startDistanceMeters, 0.0);
		float distanceMeters = 0.5 * (startDistanceMeters + endDistanceMeters);
		vec3 positionMeters = state.ray.originMeters + state.ray.direction * distanceMeters;
		AtmosphereCoordinate atmosphereCoordinate = resolveAtmosphereCoordinate(state.ray, distanceMeters);
		MediumSample medium = sampleAtmosphere(atmosphereCoordinate);
		SpectralValue cumulativeScatteringDensity = sampleCumulativeScatteringDensity(
			positionMeters,
			atmosphereCoordinate,
			state.ray.direction
		);

		for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
			float halfIntervalTransmittance = exp(
				-0.5 * medium.extinction.channels[channelIndex] * intervalLengthMeters
			);
			viewTransmittance.channels[channelIndex] *= halfIntervalTransmittance;
			radiance.channels[channelIndex] += viewTransmittance.channels[channelIndex]
				* cumulativeScatteringDensity.channels[channelIndex]
				* intervalLengthMeters;
			viewTransmittance.channels[channelIndex] *= halfIntervalTransmittance;
		}
	}

	state.transmittance = viewTransmittance;
	state.pathRadiance = radiance;
}`;
	}

	/**
	 * Called by algorithm32 transport to integrate one already-cumulative local scattering-density field.
	 *
	 * @param {string} pathSampleHelper - Accepted physical-distance placement source.
	 * @returns {string} - Complete cumulative-cache path evaluator.
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

		SpectralValue cumulativeScatteringDensity = sampleCumulativeScatteringDensity(
			positionMeters,
			atmosphereCoordinate,
			state.ray.direction
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
