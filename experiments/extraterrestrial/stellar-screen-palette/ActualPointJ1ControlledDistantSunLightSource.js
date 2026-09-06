import {SpectralCalculator} from
	'../candidate/src/algorithm32/implementation/SpectralCalculator.js';
import {
	createShaderContribution,
	createShaderSourceBlock,
	createShaderUniformDescriptor,
	formatShaderFloatArray,
} from '../candidate/src/algorithm32/shader/shaderContribution.js';
import {ControlledDistantSunLightSource} from
	'./ControlledDistantSunLightSource.js';

export const ACTUAL_POINT_J1_TOGGLE_VALUE_KEY =
	'diagnostic.actualPointJ1.toggle';
export const ACTUAL_POINT_J1_TOGGLE_UNIFORM_NAME =
	'uActualPointJ1Toggle';

export const ACTUAL_POINT_J1_DEFAULT_INTERVAL_COUNT = 15;
export const ACTUAL_POINT_J1_MAXIMUM_INTERVAL_COUNT = 320;
export const ACTUAL_POINT_J1_CONVERGENCE_INTERVAL_COUNTS = Object.freeze([
	15,
	160,
	320,
]);
export const ACTUAL_POINT_J1_PROBE_OFFSETS_DEGREES = Object.freeze([
	-50,
	0,
	50,
]);

export const ACTUAL_POINT_J1_CONTROL = Object.freeze({
	schemaId: 'contained-actual-point-spherical-j1-control-v1',
	storedCacheChange: 'none',
	operation:
		'add directly integrated actual-point spherical first-order radiance after cumulative cached transport and before celestial composition',
	visibility: 'point-source spherical ground intersection',
	sourceTerm:
		'T_source * E_source * (beta_R * P_R(dot(view, source)) + beta_M_sca * P_M(dot(view, source)))',
	viewTerm: 'integral T_view * J1_actual_point ds',
	ozonePolicy:
		'ozone enters source and view extinction through atmosphere.sampleAtmosphere only; it adds no scattering or phase term',
	defaultViewIntervalCount: ACTUAL_POINT_J1_DEFAULT_INTERVAL_COUNT,
	defaultSourceIntervalCount: ACTUAL_POINT_J1_DEFAULT_INTERVAL_COUNT,
	gpuIntervalPolicy:
		'fixed compile-time 15 view intervals by 15 source intervals',
	cpuMaximumIntervalCount: ACTUAL_POINT_J1_MAXIMUM_INTERVAL_COUNT,
	convergenceIntervalCounts: ACTUAL_POINT_J1_CONVERGENCE_INTERVAL_COUNTS,
	phaseDirectionCosine: 'dot(viewDirection, directionToSource)',
});

function requirePositiveIntervalCount(value, label) {
	if (!Number.isSafeInteger(value)
		|| value < 1
		|| value > ACTUAL_POINT_J1_MAXIMUM_INTERVAL_COUNT) {
		throw new RangeError(
			`${label} must be an integer from 1 through ${ACTUAL_POINT_J1_MAXIMUM_INTERVAL_COUNT}.`,
		);
	}
	return value;
}

function requireDirectionToSourceUpEastNorth(value) {
	if (!Array.isArray(value)
		|| value.length !== 3
		|| !value.every(Number.isFinite)) {
		throw new TypeError(
			'Actual-point J1 probes require finite [up, east, north] source direction.',
		);
	}
	return value;
}

function normalizeAzimuthDegrees(degrees) {
	let result = degrees;
	while (result < -180) result += 360;
	while (result >= 180) result -= 360;
	return result;
}

function directionAt(azimuthDegrees, elevationDegrees) {
	const azimuth = azimuthDegrees * Math.PI / 180;
	const elevation = elevationDegrees * Math.PI / 180;
	const horizontal = Math.cos(elevation);
	return /** @type {UnitVector3} */ ([
		Math.sin(azimuth) * horizontal,
		Math.cos(azimuth) * horizontal,
		Math.sin(elevation),
	]);
}

/** Create the exact three source-relative horizon directions for this test. */
export function createActualPointJ1ThreeRayProbes({
	directionToSourceUpEastNorth,
}) {
	const [up, east, north] = requireDirectionToSourceUpEastNorth(
		directionToSourceUpEastNorth,
	);
	const sourceAzimuthDegrees = Math.atan2(east, north) * 180 / Math.PI;
	return Object.freeze(ACTUAL_POINT_J1_PROBE_OFFSETS_DEGREES.map(
		(sourceAzimuthOffsetDegrees, index) => {
			const azimuthDegrees = normalizeAzimuthDegrees(
				sourceAzimuthDegrees + sourceAzimuthOffsetDegrees,
			);
			return Object.freeze({
				index,
				id: `actual-point-j1-offset-${sourceAzimuthOffsetDegrees}-elevation-0`,
				sourceAzimuthOffsetDegrees,
				azimuthDegrees,
				elevationDegrees: 0,
				directionModel: directionAt(azimuthDegrees, 0),
				sourceDirectionUpComponent: up,
			});
		},
	));
}

/**
 * Compute the direct, actual-point first-order result with the existing
 * binary64 CPU transport oracle. No scattering cache is constructed or read.
 */
export function computeActualPointJ1ThreeRayCpuOracle({
	geometry,
	atmosphere,
	lightSource,
	spectralBasis,
	receiverPosition,
	directionToSourceUpEastNorth,
	viewIntervalCount,
	sourceIntervalCount,
}) {
	const acceptedViewIntervalCount = requirePositiveIntervalCount(
		viewIntervalCount,
		'Actual-point J1 CPU viewIntervalCount',
	);
	const acceptedSourceIntervalCount = requirePositiveIntervalCount(
		sourceIntervalCount,
		'Actual-point J1 CPU sourceIntervalCount',
	);
	const probes = createActualPointJ1ThreeRayProbes({
		directionToSourceUpEastNorth,
	});
	const calculator = new SpectralCalculator({
		geometry,
		atmosphere,
		lightSource,
		spectralBasis,
		executionControls: {
			sourceTransmittanceIntervalCount:
				acceptedSourceIntervalCount,
		},
	});
	const samples = probes.map((probe) => {
		const viewRaySegment = geometry.resolveViewRaySegment({
			origin: receiverPosition,
			direction: probe.directionModel,
		});
		const pathIntegrationPoints =
			calculator.buildEndpointTrapezoidPathIntegrationPoints(
				viewRaySegment,
				acceptedViewIntervalCount,
			);
		const direct = calculator.computeDirectRadiance(
			viewRaySegment,
			pathIntegrationPoints,
		);
		return Object.freeze({
			...probe,
			pathRadiance: Object.freeze([...direct.pathRadiance.values]),
			viewTransmittance: Object.freeze([...direct.transmittance.values]),
		});
	});

	return Object.freeze({
		schemaId: 'actual-point-j1-three-ray-cpu-oracle-v1',
		precision: 'javascript-binary64',
		cacheConstruction: 'none',
		viewIntervalCount: acceptedViewIntervalCount,
		sourceIntervalCount: acceptedSourceIntervalCount,
		spectralBasis: Object.freeze({
			id: spectralBasis.id,
			contentHash: spectralBasis.contentHash,
			channelCount: spectralBasis.channelCount,
		}),
		samples: Object.freeze(samples),
	});
}

function actualPointJ1ShaderFunctions(sourceIrradianceValues) {
	return `const int ACTUAL_POINT_J1_INTERVAL_COUNT = ${ACTUAL_POINT_J1_DEFAULT_INTERVAL_COUNT};
const float ACTUAL_POINT_J1_PI = 3.1415926535897932384626433832795;
const float ACTUAL_POINT_J1_SOURCE_IRRADIANCE[SPECTRAL_CHANNEL_COUNT] = float[SPECTRAL_CHANNEL_COUNT](${formatShaderFloatArray(sourceIrradianceValues)});

bool actualPointJ1RayBlockedByGround(
	vec3 positionMeters,
	AtmosphereCoordinate coordinate,
	vec3 direction
) {
	float altitudeMeters = max(coordinate.altitudeMeters, 0.0);
	float radialProjectionMeters = dot(positionMeters, direction);
	float discriminant = radialProjectionMeters * radialProjectionMeters
		- altitudeMeters
			* (2.0 * GEOMETRY_BOTTOM_RADIUS_METERS + altitudeMeters);
	if (radialProjectionMeters >= 0.0 || discriminant < 0.0) return false;
	return -radialProjectionMeters - sqrt(max(discriminant, 0.0)) >= 0.0;
}

float actualPointJ1TopBoundaryDistance(
	vec3 positionMeters,
	AtmosphereCoordinate coordinate,
	vec3 direction
) {
	float altitudeMeters = max(coordinate.altitudeMeters, 0.0);
	float atmosphereHeightMeters =
		GEOMETRY_TOP_RADIUS_METERS - GEOMETRY_BOTTOM_RADIUS_METERS;
	float radialProjectionMeters = dot(positionMeters, direction);
	float discriminant = radialProjectionMeters * radialProjectionMeters
		+ max(atmosphereHeightMeters - altitudeMeters, 0.0)
			* (2.0 * GEOMETRY_BOTTOM_RADIUS_METERS
				+ atmosphereHeightMeters + altitudeMeters);
	return max(
		0.0,
		-radialProjectionMeters + sqrt(max(discriminant, 0.0))
	);
}

AtmosphereCoordinate actualPointJ1CoordinateAlongRay(
	vec3 startPositionMeters,
	AtmosphereCoordinate startCoordinate,
	vec3 direction,
	float distanceMeters
) {
	float startAltitudeMeters = max(
		startCoordinate.altitudeMeters,
		0.0
	);
	float radialProjectionMeters = dot(startPositionMeters, direction);
	float radiusOffsetSquaredMeters = startAltitudeMeters
		* (2.0 * GEOMETRY_BOTTOM_RADIUS_METERS + startAltitudeMeters)
		+ 2.0 * distanceMeters * radialProjectionMeters
		+ distanceMeters * distanceMeters;
	float radiusMeters = sqrt(max(
		GEOMETRY_BOTTOM_RADIUS_METERS * GEOMETRY_BOTTOM_RADIUS_METERS
			+ radiusOffsetSquaredMeters,
		0.0
	));
	float altitudeMeters = radiusOffsetSquaredMeters / max(
		radiusMeters + GEOMETRY_BOTTOM_RADIUS_METERS,
		1.0
	);
	return AtmosphereCoordinate(max(altitudeMeters, 0.0));
}

float actualPointJ1RayleighPhase(float directionCosine) {
	float cosine = clamp(directionCosine, -1.0, 1.0);
	return (3.0 / (16.0 * ACTUAL_POINT_J1_PI))
		* (1.0 + cosine * cosine);
}

float actualPointJ1MiePhase(float directionCosine) {
	float cosine = clamp(directionCosine, -1.0, 1.0);
	float g = ATMOSPHERE_MIE_PHASE_FUNCTION_G;
	float k = (3.0 / (8.0 * ACTUAL_POINT_J1_PI))
		* ((1.0 - g * g) / (2.0 + g * g));
	float denominator = max(
		1.0 + g * g - 2.0 * g * cosine,
		2.220446049250313e-16
	);
	return (k * (1.0 + cosine * cosine)) / pow(denominator, 1.5);
}

SpectralValue actualPointJ1SourceTransmittance(
	vec3 positionMeters,
	AtmosphereCoordinate coordinate,
	vec3 directionToSource
) {
	if (actualPointJ1RayBlockedByGround(
		positionMeters,
		coordinate,
		directionToSource
	)) return zeroSpectral();

	float endDistanceMeters = actualPointJ1TopBoundaryDistance(
		positionMeters,
		coordinate,
		directionToSource
	);
	float intervalLengthMeters = endDistanceMeters
		/ float(ACTUAL_POINT_J1_INTERVAL_COUNT);
	SpectralValue opticalDepth = zeroSpectral();

	for (int pointIndex = 0;
		pointIndex <= ACTUAL_POINT_J1_INTERVAL_COUNT;
		pointIndex += 1) {
		float distanceMeters = intervalLengthMeters * float(pointIndex);
		AtmosphereCoordinate sampleCoordinate =
			actualPointJ1CoordinateAlongRay(
				positionMeters,
				coordinate,
				directionToSource,
				distanceMeters
			);
		MediumSample medium = sampleAtmosphere(sampleCoordinate);
		float weight = pointIndex == 0
			|| pointIndex == ACTUAL_POINT_J1_INTERVAL_COUNT
			? 0.5
			: 1.0;
		for (int channelIndex = 0;
			channelIndex < SPECTRAL_CHANNEL_COUNT;
			channelIndex += 1) {
			opticalDepth.c[channelIndex] +=
				medium.extinction.c[channelIndex]
				* intervalLengthMeters
				* weight;
		}
	}

	SpectralValue transmittance;
	for (int channelIndex = 0;
		channelIndex < SPECTRAL_CHANNEL_COUNT;
		channelIndex += 1) {
		transmittance.c[channelIndex] = exp(
			-opticalDepth.c[channelIndex]
		);
	}
	return transmittance;
}

SpectralValue actualPointJ1ScatteringDensity(
	vec3 positionMeters,
	vec3 viewDirection,
	AtmosphereCoordinate coordinate,
	MediumSample medium
) {
	vec3 directionToSource = normalize(
		directionToAtmosphericSource(positionMeters)
	);
	float directionCosine = clamp(dot(
		normalize(viewDirection),
		directionToSource
	), -1.0, 1.0);
	float rayleighPhase = actualPointJ1RayleighPhase(directionCosine);
	float miePhase = actualPointJ1MiePhase(directionCosine);
	SpectralValue sourceTransmittance =
		actualPointJ1SourceTransmittance(
			positionMeters,
			coordinate,
			directionToSource
		);
	SpectralValue density;

	for (int channelIndex = 0;
		channelIndex < SPECTRAL_CHANNEL_COUNT;
		channelIndex += 1) {
		density.c[channelIndex] = sourceTransmittance.c[channelIndex]
			* ACTUAL_POINT_J1_SOURCE_IRRADIANCE[channelIndex]
			* (
				medium.rayleighScattering.c[channelIndex] * rayleighPhase
				+ medium.mieScattering.c[channelIndex] * miePhase
			);
	}
	return density;
}

void addActualPointJ1Radiance(inout ShaderState state) {
	float enabled = clamp(${ACTUAL_POINT_J1_TOGGLE_UNIFORM_NAME}, 0.0, 1.0);
	if (enabled <= 0.0 || !state.bounds.valid) return;

	float pathLengthMeters = max(
		state.bounds.endDistanceMeters - state.bounds.startDistanceMeters,
		0.0
	);
	float intervalLengthMeters = pathLengthMeters
		/ float(ACTUAL_POINT_J1_INTERVAL_COUNT);
	SpectralValue viewTransmittance = oneSpectral();
	SpectralValue radiance = zeroSpectral();
	MediumSample previousMedium;
	bool hasPreviousMedium = false;

	for (int pointIndex = 0;
		pointIndex <= ACTUAL_POINT_J1_INTERVAL_COUNT;
		pointIndex += 1) {
		float distanceMeters = state.bounds.startDistanceMeters
			+ intervalLengthMeters * float(pointIndex);
		vec3 positionMeters = state.ray.originMeters
			+ state.ray.direction * distanceMeters;
		AtmosphereCoordinate coordinate = resolveAtmosphereCoordinate(
			state.ray,
			distanceMeters
		);
		MediumSample medium = sampleAtmosphere(coordinate);

		if (hasPreviousMedium) {
			SpectralValue segmentTransmittance =
				computeTrapezoidSegmentTransmittance(
					previousMedium,
					medium,
					intervalLengthMeters
				);
			for (int channelIndex = 0;
				channelIndex < SPECTRAL_CHANNEL_COUNT;
				channelIndex += 1) {
				viewTransmittance.c[channelIndex] *=
					segmentTransmittance.c[channelIndex];
			}
		}

		SpectralValue density = actualPointJ1ScatteringDensity(
			positionMeters,
			state.ray.direction,
			coordinate,
			medium
		);
		float measureMeters = intervalLengthMeters
			* (pointIndex == 0
				|| pointIndex == ACTUAL_POINT_J1_INTERVAL_COUNT
				? 0.5
				: 1.0);
		for (int channelIndex = 0;
			channelIndex < SPECTRAL_CHANNEL_COUNT;
			channelIndex += 1) {
			radiance.c[channelIndex] +=
				viewTransmittance.c[channelIndex]
				* density.c[channelIndex]
				* measureMeters;
		}

		previousMedium = medium;
		hasPreviousMedium = true;
	}

	for (int channelIndex = 0;
		channelIndex < SPECTRAL_CHANNEL_COUNT;
		channelIndex += 1) {
		state.pathRadiance.c[channelIndex] +=
			enabled * radiance.c[channelIndex];
		state.preDisplayRadiance.c[channelIndex] =
			state.pathRadiance.c[channelIndex];
	}
}`;
}

/**
 * Retain the exact controlled distant-Sun cache and add one runtime-only,
 * toggleable actual-point J1 diagnostic contribution.
 */
export class ActualPointJ1ControlledDistantSunLightSource
	extends ControlledDistantSunLightSource {
	describe() {
		return {
			...super.describe(),
			containedActualPointJ1Control: ACTUAL_POINT_J1_CONTROL,
		};
	}

	createShaderContribution(request) {
		const base = super.createShaderContribution(request);
		const descriptor = request.descriptor;
		const sourceIrradianceValues = this.configuration.sourceIrradiance.values;
		if (sourceIrradianceValues.length
			!== this.configuration.sourceIrradiance.basis.channelCount) {
			throw new RangeError(
				'Actual-point J1 source irradiance does not match its spectral basis.',
			);
		}

		const control = createShaderContribution({
			id: 'diagnostic-actual-point-spherical-j1-addition',
			owner: 'lightSource',
			descriptorFingerprint: descriptor.lightSource.fingerprint,
			compatibilityTags: descriptor.lightSource.compatibilityTags,
			provides: ['diagnostic.actualPointJ1Radiance'],
			requires: [
				'runtime.initialState',
				'geometry.resolveAtmosphereCoordinate',
				'atmosphere.sampleMedium',
				'light.directionToAtmosphericSource',
				'transport.evaluatePathRadiance',
			],
			uniforms: [
				createShaderUniformDescriptor(
					ACTUAL_POINT_J1_TOGGLE_UNIFORM_NAME,
					'float',
					ACTUAL_POINT_J1_TOGGLE_VALUE_KEY,
					0,
				),
			],
			functions: [
				createShaderSourceBlock(
					'diagnostic-actual-point-j1-functions',
					'evaluateTransport',
					10,
					actualPointJ1ShaderFunctions(sourceIrradianceValues),
				),
			],
			mainHooks: [
				createShaderSourceBlock(
					'diagnostic-actual-point-j1-main',
					'evaluateTransport',
					10,
					'addActualPointJ1Radiance(state);',
				),
			],
			diagnostics: ACTUAL_POINT_J1_CONTROL,
		});

		return [base, control];
	}
}

export default ActualPointJ1ControlledDistantSunLightSource;
