import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../shader-assembly/base/ShaderSource.js';
import DistanceMath from '../../math/DistanceMath.js';
import {FLAT_GEOMETRY_IDENTITY_MATRIX4} from './consts.js';

/**
 * Provider of the geometry-owned runtime shader contribution for flat atmosphere transport.
 */
export class FlatGeometryShaderContributor {
	/**
	 * Creates the flat geometry shader contributor for one normalized configuration.
	 *
	 * @param {FlatEarthGeometryConfiguration} configuration - The normalized flat geometry configuration.
	 */
	constructor(configuration) {
		this._configuration = configuration;
		this._positionDomain = null;
	}

	/** @param {Algorithm32ExecutionDomains} domains - Accepted execution domains. */
	configureExecutionDomains(domains) {
		this._positionDomain = /** @type {FlatLocalCachePositionDomain} */ (domains.positions);
	}

	/**
	 * Call this method to create the geometry-owned flat shader contribution. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {boolean} [compact] - Explicit compact model supplies its own complete stencils.
	 * @returns {ShaderContribution} - The geometry contribution.
	 */
	createShaderContribution(compact = false) {
		const facts = this._configuration;
		const frame = facts.observerLocalSceneFrame;
		const dome = facts.observerCenteredDome;
		const domeEnabled = Boolean(dome);
		const observerPositionMeters = DistanceMath.toMetersPosition(facts.observerPosition);
		const topAltitudeMeters = DistanceMath.toMeters(facts.topAltitude);
		const sceneSkyRayLimitMeters = facts.sceneSkyRayLimit
			? DistanceMath.toMeters(facts.sceneSkyRayLimit)
			: topAltitudeMeters;
		const domeCenterMeters = domeEnabled ? DistanceMath.toMetersPosition(dome.sphereCenter) : [0, 0, 0];
		const domeRadiusMeters = domeEnabled ? DistanceMath.toMeters(dome.sphereRadius) : 0;
		const cacheAltitudeNodes = this._positionDomain?.zNodes ?? facts.cacheAltitudeNodes;
		const cacheRadialNodes = this._positionDomain?.rhoNodes ?? facts.cacheRadialNodes;
		const cacheAltitudeNodesMeters = cacheAltitudeNodes.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 *
			 * @param {Distance} node - The unit-bearing altitude node.
			 * @returns {number} - The altitude in meters.
			 */ (node) => DistanceMath.toMeters(node),
		);
		const cacheRadialNodesMeters = cacheRadialNodes.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 *
			 * @param {Distance} node - The unit-bearing radial node.
			 * @returns {number} - The radius in meters.
			 */ (node) => DistanceMath.toMeters(node),
		);
		const cacheAxisMaximumNodeCount = Math.max(cacheAltitudeNodesMeters.length, cacheRadialNodesMeters.length);
		const paddedCacheAltitudeNodesMeters = [
			...cacheAltitudeNodesMeters,
			...Array(cacheAxisMaximumNodeCount - cacheAltitudeNodesMeters.length).fill(
				cacheAltitudeNodesMeters[cacheAltitudeNodesMeters.length - 1],
			),
		];
		const paddedCacheRadialNodesMeters = [
			...cacheRadialNodesMeters,
			...Array(cacheAxisMaximumNodeCount - cacheRadialNodesMeters.length).fill(
				cacheRadialNodesMeters[cacheRadialNodesMeters.length - 1],
			),
		];
		const sourceSubpointMeters = DistanceMath.toMetersPosition(facts.sourceSubpoint);
		const cacheRadialFallbackDirection = /** @type {UnitVector3} */ (facts.cacheRadialFallbackDirection);

		return ShaderContributions.createShaderContribution({
			id: 'geometry-flat-earth',
			owner: 'geometry',
			provides: [
				'geometry.reconstructViewRay',
				'geometry.resolveAtmospherePath',
				'geometry.atmosphereCoordinateTypes',
				'geometry.resolveAtmosphereCoordinate',
				...(compact
					? []
					: [
							'geometry.scatteringCacheStencilTypes',
							'geometry.resolveScatteringCachePositionStencil',
							'geometry.resolveScatteringCacheDirectionStencil',
						]),
				'geometry.finiteCelestialAtmosphereSegment',
			],
			requires: ['runtime.initialState', 'runtime.depthTexture', 'runtime.sceneHitTexture'],
			uniforms: [
				ShaderContributions.createShaderUniformDeclaration(
					'GEOMETRY_SOURCE_SUBPOINT_METERS',
					'vec3',
					'geometry.sourceSubpoint',
					sourceSubpointMeters,
				),
				ShaderContributions.createShaderUniformDeclaration(
					'uInverseProjectionMatrix',
					'mat4',
					'geometry.inverseProjectionMatrix',
					FLAT_GEOMETRY_IDENTITY_MATRIX4,
				),
				ShaderContributions.createShaderUniformDeclaration(
					'uInverseViewMatrix',
					'mat4',
					'geometry.inverseViewMatrix',
					FLAT_GEOMETRY_IDENTITY_MATRIX4,
				),
				ShaderContributions.createShaderUniformDeclaration(
					'uCameraWorldPositionMeters',
					'vec3',
					'geometry.cameraWorldPosition',
					observerPositionMeters,
				),
				ShaderContributions.createShaderUniformDeclaration(
					'uSceneTerminationMeters',
					'float',
					'geometry.sceneTermination',
					0,
				),
				ShaderContributions.createShaderUniformDeclaration(
					'uSceneDepthMaxMeters',
					'float',
					'geometry.sceneDepthMax',
					sceneSkyRayLimitMeters,
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'geometry-cache-stencil-types',
					'declareTypes',
					10,
					`struct AtmosphereCoordinate {
	float altitudeMeters;
	float rhoMeters;
};

struct CachePositionStencil {
	ivec4 indices;
	vec4 weights;
};

struct CacheDirectionStencil {
	ivec4 indices;
	vec4 weights;
};`,
				),
				ShaderContributions.createShaderSourceBlock(
					'geometry-constants',
					'declareConstants',
					0,
					`const float GEOMETRY_TOP_ALTITUDE_METERS = ${ShaderSource.formatFloat(topAltitudeMeters)};
const float GEOMETRY_SCENE_SKY_RAY_LIMIT_METERS = ${ShaderSource.formatFloat(sceneSkyRayLimitMeters)};
${
	compact
		? ''
		: `const int GEOMETRY_CACHE_Z_COUNT = ${cacheAltitudeNodesMeters.length};
const int GEOMETRY_CACHE_RHO_COUNT = ${cacheRadialNodesMeters.length};
const float GEOMETRY_CACHE_Z_NODES_METERS[${cacheAxisMaximumNodeCount}] = float[${cacheAxisMaximumNodeCount}](${ShaderSource.formatFloatArray(paddedCacheAltitudeNodesMeters)});
const float GEOMETRY_CACHE_RHO_NODES_METERS[${cacheAxisMaximumNodeCount}] = float[${cacheAxisMaximumNodeCount}](${ShaderSource.formatFloatArray(paddedCacheRadialNodesMeters)});`
}
const vec3 GEOMETRY_CACHE_RADIAL_FALLBACK = ${ShaderSource.formatVec3(cacheRadialFallbackDirection)};
const vec3 GEOMETRY_OBSERVER_UP_DIRECTION = ${ShaderSource.formatVec3(frame.up)};
const vec3 GEOMETRY_OBSERVER_RIGHT_DIRECTION = ${ShaderSource.formatVec3(frame.right)};
const vec3 GEOMETRY_OBSERVER_FORWARD_DIRECTION = ${ShaderSource.formatVec3(frame.forward)};
const bool GEOMETRY_OBSERVER_DOME_ENABLED = ${domeEnabled ? 'true' : 'false'};
const vec3 GEOMETRY_OBSERVER_DOME_CENTER_METERS = ${ShaderSource.formatVec3(domeCenterMeters)};
const float GEOMETRY_OBSERVER_DOME_RADIUS_METERS = ${ShaderSource.formatFloat(domeRadiusMeters)};`,
				),
				ShaderContributions.createShaderSourceBlock(
					'geometry-reconstruct-helper',
					'reconstructRay',
					0,
					`ViewRay reconstructViewRay(vec2 textureCoordinates) {
	vec4 clip = vec4(textureCoordinates * 2.0 - 1.0, 1.0, 1.0);
	vec4 view = uInverseProjectionMatrix * clip;
	view.xyz /= max(view.w, 0.000001);
	vec3 sceneDirection = normalize((uInverseViewMatrix * vec4(normalize(view.xyz), 0.0)).xyz);
	vec3 direction = normalize(
		GEOMETRY_OBSERVER_RIGHT_DIRECTION * sceneDirection.x
		+ GEOMETRY_OBSERVER_UP_DIRECTION * sceneDirection.y
		+ GEOMETRY_OBSERVER_FORWARD_DIRECTION * sceneDirection.z
	);
	return ViewRay(uCameraWorldPositionMeters, direction);
}`,
				),
				ShaderContributions.createShaderSourceBlock(
					'geometry-depth-helper',
					'resolvePathBounds',
					0,
					`float sceneTerminationMetersFromDepth(float sceneDepth) {
	float decodedTerminationMeters = max(sceneDepth * uSceneDepthMaxMeters, 0.0);
	return uSceneTerminationMeters > 0.0 ? uSceneTerminationMeters : decodedTerminationMeters;
}

float positiveBoundaryDistance(float distanceMeters) {
	return max(distanceMeters, 0.0);
}

bool observerDomeBoundaryDistance(vec3 originMeters, vec3 direction, out float distanceMeters) {
	if (!GEOMETRY_OBSERVER_DOME_ENABLED) {
		distanceMeters = 0.0;
		return false;
	}

	vec3 offsetFromCenter = originMeters - GEOMETRY_OBSERVER_DOME_CENTER_METERS;
	float halfLinearCoefficient = dot(offsetFromCenter, direction);
	float constantTerm = dot(offsetFromCenter, offsetFromCenter)
		- GEOMETRY_OBSERVER_DOME_RADIUS_METERS * GEOMETRY_OBSERVER_DOME_RADIUS_METERS;
	float discriminant = halfLinearCoefficient * halfLinearCoefficient - constantTerm;

	if (discriminant < -0.000001) {
		distanceMeters = 0.0;
		return false;
	}

	float root = sqrt(max(discriminant, 0.0));
	float nearDistance = -halfLinearCoefficient - root;
	float farDistance = -halfLinearCoefficient + root;

	if (constantTerm <= 0.000001 && farDistance >= -0.000001) {
		distanceMeters = positiveBoundaryDistance(farDistance);
		return true;
	}
	if (nearDistance >= -0.000001) {
		distanceMeters = positiveBoundaryDistance(nearDistance);
		return true;
	}
	if (farDistance >= -0.000001) {
		distanceMeters = positiveBoundaryDistance(farDistance);
		return true;
	}

	distanceMeters = 0.0;
	return false;
}

void chooseNearestBoundary(float candidateDistanceMeters, bool hasCandidate, inout float selectedDistanceMeters, inout bool hasSelected) {
	if (hasCandidate && (!hasSelected || candidateDistanceMeters < selectedDistanceMeters)) {
		selectedDistanceMeters = candidateDistanceMeters;
		hasSelected = true;
	}
}`,
				),
				ShaderContributions.createShaderSourceBlock(
					'geometry-path-helper',
					'resolvePathBounds',
					0,
					`PathBounds resolveAtmospherePath(ViewRay ray, float sceneTerminationMeters, bool hasSceneEndpoint) {
	bool hasTopBoundary = ray.direction.z > 0.000001;
	bool hasGroundBoundary = ray.direction.z < -0.000001;
	float topDistanceMeters = hasTopBoundary
		? positiveBoundaryDistance((GEOMETRY_TOP_ALTITUDE_METERS - ray.originMeters.z) / ray.direction.z)
		: 0.0;
	float groundDistanceMeters = hasGroundBoundary
		? positiveBoundaryDistance((0.0 - ray.originMeters.z) / ray.direction.z)
		: 0.0;
	float domeDistanceMeters = 0.0;
	bool hasDomeBoundary = observerDomeBoundaryDistance(ray.originMeters, ray.direction, domeDistanceMeters);
	bool hasAtmosphereBoundary = false;
	float boundaryDistanceMeters = 0.0;
	bool usesGroundBoundary = false;

	chooseNearestBoundary(topDistanceMeters, hasTopBoundary, boundaryDistanceMeters, hasAtmosphereBoundary);
	bool groundWouldWin = hasGroundBoundary
		&& (!hasAtmosphereBoundary || groundDistanceMeters <= boundaryDistanceMeters);
	chooseNearestBoundary(groundDistanceMeters, hasGroundBoundary, boundaryDistanceMeters, hasAtmosphereBoundary);
	usesGroundBoundary = groundWouldWin;
	chooseNearestBoundary(domeDistanceMeters, hasDomeBoundary, boundaryDistanceMeters, hasAtmosphereBoundary);

	float fallbackSkyDistanceMeters = max(GEOMETRY_SCENE_SKY_RAY_LIMIT_METERS, 0.0);
	float selectedBoundaryDistanceMeters = hasAtmosphereBoundary
		? boundaryDistanceMeters
		: fallbackSkyDistanceMeters;
	float endDistanceMeters = hasSceneEndpoint
		? min(max(sceneTerminationMeters, 0.0), selectedBoundaryDistanceMeters)
		: selectedBoundaryDistanceMeters;
	bool hasGroundEndpoint = hasGroundBoundary && groundDistanceMeters <= endDistanceMeters;
	bool valid = endDistanceMeters >= 0.0;
	return PathBounds(0.0, max(0.0, endDistanceMeters), sceneTerminationMeters, hasSceneEndpoint, hasGroundEndpoint, valid);
}`,
				),
				ShaderContributions.createShaderSourceBlock(
					'geometry-atmosphere-coordinate',
					'sampleScatteringCache',
					0,
					`AtmosphereCoordinate resolveAtmosphereCoordinate(
	ViewRay ray,
	float distanceMeters
) {
	vec3 positionMeters =
		ray.originMeters + ray.direction * distanceMeters;
	// Resolve analytic boundary coordinates exactly. FP32 multiply/add can place
	// a computed top/ground endpoint one ULP outside its closed physical support.
	if (ray.direction.z > 0.000001
		&& distanceMeters == (GEOMETRY_TOP_ALTITUDE_METERS - ray.originMeters.z) / ray.direction.z) {
		positionMeters.z = GEOMETRY_TOP_ALTITUDE_METERS;
	} else if (ray.direction.z < -0.000001
		&& distanceMeters == -ray.originMeters.z / ray.direction.z) {
		positionMeters.z = 0.0;
	}
	return AtmosphereCoordinate(
		positionMeters.z,
		length(positionMeters.xy - GEOMETRY_SOURCE_SUBPOINT_METERS.xy)
	);
}`,
				),
				...(compact
					? []
					: [
							ShaderContributions.createShaderSourceBlock(
								'geometry-cache-stencils',
								'sampleScatteringCache',
								0,
								`void geometryCacheAxisStencil(
	float coordinateMeters,
	const int nodeCount,
	const float nodesMeters[${Math.max(cacheAltitudeNodesMeters.length, cacheRadialNodesMeters.length)}],
	out int lowerIndex,
	out int upperIndex,
	out float upperWeight
) {
	if (coordinateMeters <= nodesMeters[0]) {
		lowerIndex = 0;
		upperIndex = 0;
		upperWeight = 0.0;
		return;
	}
	int lastIndex = nodeCount - 1;
	if (coordinateMeters >= nodesMeters[lastIndex]) {
		lowerIndex = lastIndex;
		upperIndex = lastIndex;
		upperWeight = 0.0;
		return;
	}
	lowerIndex = 0;
	upperIndex = 1;
	for (int nodeIndex = 1; nodeIndex < nodeCount; ++nodeIndex) {
		if (coordinateMeters <= nodesMeters[nodeIndex]) {
			lowerIndex = nodeIndex - 1;
			upperIndex = nodeIndex;
			break;
		}
	}
	float lowerMeters = nodesMeters[lowerIndex];
	float upperMeters = nodesMeters[upperIndex];
	if (coordinateMeters == lowerMeters) {
		upperIndex = lowerIndex;
		upperWeight = 0.0;
		return;
	}
	if (coordinateMeters == upperMeters) {
		lowerIndex = upperIndex;
		upperWeight = 0.0;
		return;
	}
	upperWeight = (coordinateMeters - lowerMeters)
		/ (upperMeters - lowerMeters);
}

CachePositionStencil resolveScatteringCachePositionStencil(
	AtmosphereCoordinate coordinate
) {
	int zLower;
	int zUpper;
	float zUpperWeight;
	geometryCacheAxisStencil(
		coordinate.altitudeMeters,
		GEOMETRY_CACHE_Z_COUNT,
		GEOMETRY_CACHE_Z_NODES_METERS,
		zLower,
		zUpper,
		zUpperWeight
	);
	int rhoLower;
	int rhoUpper;
	float rhoUpperWeight;
	geometryCacheAxisStencil(
		coordinate.rhoMeters,
		GEOMETRY_CACHE_RHO_COUNT,
		GEOMETRY_CACHE_RHO_NODES_METERS,
		rhoLower,
		rhoUpper,
		rhoUpperWeight
	);
	float zLowerWeight = 1.0 - zUpperWeight;
	float rhoLowerWeight = 1.0 - rhoUpperWeight;
	return CachePositionStencil(
		ivec4(
			zLower * GEOMETRY_CACHE_RHO_COUNT + rhoLower,
			zLower * GEOMETRY_CACHE_RHO_COUNT + rhoUpper,
			zUpper * GEOMETRY_CACHE_RHO_COUNT + rhoLower,
			zUpper * GEOMETRY_CACHE_RHO_COUNT + rhoUpper
		),
		vec4(
			zLowerWeight * rhoLowerWeight,
			zLowerWeight * rhoUpperWeight,
			zUpperWeight * rhoLowerWeight,
			zUpperWeight * rhoUpperWeight
		)
	);
}

vec3 scatteringCacheLocalDirection(
	vec3 positionMeters,
	vec3 physicalDirection
) {
	vec3 radial = vec3(
		positionMeters.xy - GEOMETRY_SOURCE_SUBPOINT_METERS.xy,
		0.0
	);
	if (length(radial) <= 1.0e-10) {
		radial = GEOMETRY_CACHE_RADIAL_FALLBACK;
	} else {
		radial = normalize(radial);
	}
	vec3 tangent = vec3(-radial.y, radial.x, 0.0);
	vec3 direction = normalize(physicalDirection);
	return vec3(
		dot(direction, radial),
		dot(direction, tangent),
		direction.z
	);
}

CacheDirectionStencil resolveScatteringCacheDirectionStencil(
	vec3 positionMeters,
	vec3 physicalDirection
) {
	vec3 direction =
		scatteringCacheLocalDirection(positionMeters, physicalDirection);
	int faceIndex = 0;
	float selectedProjection = direction.x;
	if (-direction.x > selectedProjection) {
		selectedProjection = -direction.x;
		faceIndex = 1;
	}
	if (direction.y > selectedProjection) {
		selectedProjection = direction.y;
		faceIndex = 2;
	}
	if (-direction.y > selectedProjection) {
		selectedProjection = -direction.y;
		faceIndex = 3;
	}
	if (direction.z > selectedProjection) {
		selectedProjection = direction.z;
		faceIndex = 4;
	}
	if (-direction.z > selectedProjection) {
		faceIndex = 5;
	}

	float denominator;
	float faceUCoordinate;
	float faceVCoordinate;
	if (faceIndex == 0) {
		denominator = direction.x;
		faceUCoordinate = direction.y / denominator;
		faceVCoordinate = direction.z / denominator;
	} else if (faceIndex == 1) {
		denominator = -direction.x;
		faceUCoordinate = -direction.y / denominator;
		faceVCoordinate = direction.z / denominator;
	} else if (faceIndex == 2) {
		denominator = direction.y;
		faceUCoordinate = -direction.x / denominator;
		faceVCoordinate = direction.z / denominator;
	} else if (faceIndex == 3) {
		denominator = -direction.y;
		faceUCoordinate = direction.x / denominator;
		faceVCoordinate = direction.z / denominator;
	} else if (faceIndex == 4) {
		denominator = direction.z;
		faceUCoordinate = direction.x / denominator;
		faceVCoordinate = direction.y / denominator;
	} else {
		denominator = -direction.z;
		faceUCoordinate = -direction.x / denominator;
		faceVCoordinate = direction.y / denominator;
	}

	float faceUGridCoordinate =
		clamp((clamp(faceUCoordinate, -1.0, 1.0) + 1.0) * 13.0, 0.0, 26.0);
	float faceVGridCoordinate =
		clamp((clamp(faceVCoordinate, -1.0, 1.0) + 1.0) * 13.0, 0.0, 26.0);
	float uNearest = floor(faceUGridCoordinate + 0.5);
	float vNearest = floor(faceVGridCoordinate + 0.5);
	bool faceUIsExact = abs(faceUGridCoordinate - uNearest) <= 1.0e-10;
	bool faceVIsExact = abs(faceVGridCoordinate - vNearest) <= 1.0e-10;
	int lowerFaceUIndex = faceUIsExact ? int(uNearest) : int(floor(faceUGridCoordinate));
	int lowerFaceVIndex = faceVIsExact ? int(vNearest) : int(floor(faceVGridCoordinate));
	int upperFaceUIndex = faceUIsExact ? lowerFaceUIndex : min(lowerFaceUIndex + 1, 26);
	int upperFaceVIndex = faceVIsExact ? lowerFaceVIndex : min(lowerFaceVIndex + 1, 26);
	float uFraction = faceUIsExact ? 0.0 : faceUGridCoordinate - float(lowerFaceUIndex);
	float vFraction = faceVIsExact ? 0.0 : faceVGridCoordinate - float(lowerFaceVIndex);
	int faceOffset = faceIndex * 729;
	return CacheDirectionStencil(
		ivec4(
			faceOffset + lowerFaceVIndex * 27 + lowerFaceUIndex,
			faceOffset + lowerFaceVIndex * 27 + upperFaceUIndex,
			faceOffset + upperFaceVIndex * 27 + lowerFaceUIndex,
			faceOffset + upperFaceVIndex * 27 + upperFaceUIndex
		),
		vec4(
			(1.0 - uFraction) * (1.0 - vFraction),
			uFraction * (1.0 - vFraction),
			(1.0 - uFraction) * vFraction,
			uFraction * vFraction
		)
	);
}`,
							),
						]),
				ShaderContributions.createShaderSourceBlock(
					'geometry-finite-celestial-atmosphere-segment',
					'resolvePathBounds',
					10,
					`float finiteCelestialAtmosphereSegmentLength(ViewRay ray, float bodyEntryDistanceMeters) {
	if (bodyEntryDistanceMeters <= 0.0 || ray.direction.z <= 0.000001) return 0.0;
	float topDistanceMeters = (GEOMETRY_TOP_ALTITUDE_METERS - ray.originMeters.z) / ray.direction.z;
	return max(0.0, min(bodyEntryDistanceMeters, topDistanceMeters));
}`,
				),
			],
			mainHooks: [
				ShaderContributions.createShaderSourceBlock(
					'geometry-main-ray',
					'reconstructRay',
					0,
					'state.ray = reconstructViewRay(state.textureCoordinates);',
				),
				ShaderContributions.createShaderSourceBlock(
					'geometry-main-bounds',
					'resolvePathBounds',
					0,
					'state.bounds = resolveAtmospherePath(state.ray, sceneTerminationMetersFromDepth(state.sceneDepth), state.sceneHitMask > 0.5);',
				),
			],
		});
	}
}
