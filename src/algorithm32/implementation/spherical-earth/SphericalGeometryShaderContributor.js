import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../shader-assembly/base/ShaderSource.js';
import VectorMath from '../../math/VectorMath.js';
import {SPHERICAL_GEOMETRY_IDENTITY_MATRIX4} from './consts.js';

/** Geometry-owned spherical final-view shader contribution provider. */
export class SphericalGeometryShaderContributor {
	/**
	 * Creates a spherical shader contributor for normalized geometry.
	 *
	 * @param {SphericalEarthGeometryConfiguration} configuration - The normalized spherical geometry configuration.
	 * @param {PositionDomain} positionDomain - Selected position reconstruction owner.
	 */
	constructor(configuration, positionDomain) {
		this._configuration = configuration;
		this._positionDomain = positionDomain;
	}

	/** @param {Algorithm32ExecutionDomains} domains - Accepted execution domains. */
	configureExecutionDomains(domains) {
		this._positionDomain = domains.positions;
	}

	/**
	 * Call this method to create the geometry-owned spherical shader contribution.
	 *
	 * @returns {ShaderContribution} - The geometry shader contribution.
	 */
	createShaderContribution() {
		const frame = this._configuration.sceneFrame;
		const bottomRadiusMeters = this._configuration.bottomRadius.value;
		const topRadiusMeters = this._configuration.topRadius.value;
		const observerHeightMeters = this._configuration.observerHeight.value;
		const cacheBoundaryAltitudeMeters = this._configuration.cacheBoundaryAltitude.value;
		const observerRadialDirection = this._configuration.observerUpDirection;
		const cameraWorldPositionMeters = VectorMath.scale(
			observerRadialDirection,
			bottomRadiusMeters + observerHeightMeters,
		);
		const cameraGroundRelativePositionMeters = VectorMath.scale(observerRadialDirection, observerHeightMeters);
		const cachePositionNodesMeters = this._positionDomain.nodes.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param node - The node value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (node) => node.coordinate.value,
		);

		return ShaderContributions.createShaderContribution({
			id: 'geometry-spherical-earth',
			owner: 'geometry',
			provides: [
				'geometry.reconstructViewRay',
				'geometry.resolveAtmospherePath',
				'geometry.atmosphereCoordinateTypes',
				'geometry.resolveAtmosphereCoordinate',
				'geometry.scatteringCacheStencilTypes',
				'geometry.resolveScatteringCachePositionStencil',
				'geometry.resolveScatteringCacheDirectionStencil',
			],
			requires: [
				'runtime.initialState',
				'runtime.depthTexture',
				'runtime.sceneHitTexture',
				'light.directionToAtmosphericSource',
			],
			uniforms: [
				ShaderContributions.createShaderUniformDeclaration(
					'uInverseProjectionMatrix',
					'mat4',
					'geometry.inverseProjectionMatrix',
					SPHERICAL_GEOMETRY_IDENTITY_MATRIX4,
				),
				ShaderContributions.createShaderUniformDeclaration(
					'uInverseViewMatrix',
					'mat4',
					'geometry.inverseViewMatrix',
					SPHERICAL_GEOMETRY_IDENTITY_MATRIX4,
				),
				ShaderContributions.createShaderUniformDeclaration(
					'uCameraWorldPositionMeters',
					'vec3',
					'geometry.cameraWorldPosition',
					cameraWorldPositionMeters,
				),
				ShaderContributions.createShaderUniformDeclaration(
					'uCameraGroundRelativePositionMeters',
					'vec3',
					'geometry.cameraGroundRelativePosition',
					cameraGroundRelativePositionMeters,
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
					topRadiusMeters,
				),
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'geometry-cache-stencil-types',
					'declareTypes',
					10,
					`struct AtmosphereCoordinate {
	float altitudeMeters;
};

struct CachePositionStencil {
	ivec2 indices;
	vec2 weights;
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
					`const float GEOMETRY_BOTTOM_RADIUS_METERS = ${ShaderSource.formatFloat(bottomRadiusMeters)};
const float GEOMETRY_TOP_RADIUS_METERS = ${ShaderSource.formatFloat(topRadiusMeters)};
const float GEOMETRY_CACHE_BOUNDARY_ALTITUDE_METERS = ${ShaderSource.formatFloat(cacheBoundaryAltitudeMeters)};
const int GEOMETRY_CACHE_POSITION_COUNT = ${cachePositionNodesMeters.length};
const float GEOMETRY_CACHE_POSITION_NODES_METERS[${cachePositionNodesMeters.length}] = float[${cachePositionNodesMeters.length}](${ShaderSource.formatFloatArray(cachePositionNodesMeters)});
const vec3 GEOMETRY_CACHE_RADIAL_DIRECTION = ${ShaderSource.formatVec3(observerRadialDirection)};
const vec3 GEOMETRY_OBSERVER_UP_DIRECTION = ${ShaderSource.formatVec3(frame.up)};
const vec3 GEOMETRY_OBSERVER_RIGHT_DIRECTION = ${ShaderSource.formatVec3(frame.right)};
const vec3 GEOMETRY_OBSERVER_FORWARD_DIRECTION = ${ShaderSource.formatVec3(frame.forward)};`,
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
}`,
				),
				ShaderContributions.createShaderSourceBlock(
					'geometry-path-helper',
					'resolvePathBounds',
					0,
					`PathBounds resolveAtmospherePath(ViewRay ray, float sceneTerminationMeters, bool hasSceneEndpoint) {
	float radius = length(ray.originMeters);
	float halfLinear = dot(ray.originMeters, ray.direction);
	float constantTerm = (radius - GEOMETRY_TOP_RADIUS_METERS)
		* (radius + GEOMETRY_TOP_RADIUS_METERS);
	float topDiscriminant = halfLinear * halfLinear - constantTerm;
	if (topDiscriminant < 0.0) {
		return PathBounds(0.0, 0.0, 0.0, false, false, false);
	}
	float root = sqrt(topDiscriminant);
	float atmosphereExitMeters = max(0.0, halfLinear >= 0.0
		? -constantTerm / (halfLinear + root)
		: -halfLinear + root);
	float boundaryDistanceMeters = atmosphereExitMeters;
	bool hasGroundEndpoint = false;
	float endDistanceMeters = hasSceneEndpoint ? min(max(sceneTerminationMeters, 0.0), boundaryDistanceMeters) : boundaryDistanceMeters;
	return PathBounds(0.0, max(0.0, endDistanceMeters), sceneTerminationMeters, hasSceneEndpoint, hasGroundEndpoint, true);
}`,
				),
				ShaderContributions.createShaderSourceBlock(
					'geometry-cache-stencils',
					'sampleScatteringCache',
					0,
					`AtmosphereCoordinate resolveAtmosphereCoordinate(ViewRay ray, float distanceMeters) {
	vec3 groundRelativePositionMeters = uCameraGroundRelativePositionMeters
		+ ray.direction * distanceMeters;
	float radialOffsetMeters = dot(
		groundRelativePositionMeters,
		GEOMETRY_CACHE_RADIAL_DIRECTION
	);
	vec3 transverseOffsetMeters = groundRelativePositionMeters
		- GEOMETRY_CACHE_RADIAL_DIRECTION * radialOffsetMeters;
	float transverseDistanceSquaredMeters = dot(
		transverseOffsetMeters,
		transverseOffsetMeters
	);
	float radiusAtRadialOffsetMeters = GEOMETRY_BOTTOM_RADIUS_METERS
		+ radialOffsetMeters;
	float curvatureDenominatorMeters = sqrt(max(
		radiusAtRadialOffsetMeters * radiusAtRadialOffsetMeters
			+ transverseDistanceSquaredMeters,
		0.0
	)) + radiusAtRadialOffsetMeters;
	float altitudeMeters = radialOffsetMeters
		+ transverseDistanceSquaredMeters / max(curvatureDenominatorMeters, 1.0);
	return AtmosphereCoordinate(altitudeMeters);
}

CachePositionStencil resolveScatteringCachePositionStencil(
	AtmosphereCoordinate coordinate
) {
	float altitudeMeters = coordinate.altitudeMeters;
	if (altitudeMeters <= GEOMETRY_CACHE_POSITION_NODES_METERS[0]) {
		return CachePositionStencil(ivec2(0), vec2(1.0, 0.0));
	}
	int lastIndex = GEOMETRY_CACHE_POSITION_COUNT - 1;
	if (altitudeMeters >= GEOMETRY_CACHE_POSITION_NODES_METERS[lastIndex]) {
		return CachePositionStencil(ivec2(lastIndex), vec2(1.0, 0.0));
	}

	int lowerIndex = 0;
	int upperIndex = 1;
	for (int nodeIndex = 1; nodeIndex < GEOMETRY_CACHE_POSITION_COUNT; nodeIndex += 1) {
		float nodeAltitudeMeters = GEOMETRY_CACHE_POSITION_NODES_METERS[nodeIndex];
		if (altitudeMeters == nodeAltitudeMeters) {
			return CachePositionStencil(ivec2(nodeIndex), vec2(1.0, 0.0));
		}
		if (altitudeMeters < nodeAltitudeMeters) {
			upperIndex = nodeIndex;
			lowerIndex = nodeIndex - 1;
			break;
		}
	}
	float lowerAltitudeMeters = GEOMETRY_CACHE_POSITION_NODES_METERS[lowerIndex];
	float upperAltitudeMeters = GEOMETRY_CACHE_POSITION_NODES_METERS[upperIndex];
	float upperWeight = (altitudeMeters - lowerAltitudeMeters)
		/ (upperAltitudeMeters - lowerAltitudeMeters);
	return CachePositionStencil(
		ivec2(lowerIndex, upperIndex),
		vec2(1.0 - upperWeight, upperWeight)
	);
}

vec3 scatteringCacheLeastAlignedAxis(vec3 direction) {
	vec3 selected = vec3(1.0, 0.0, 0.0);
	if (abs(direction.y) < abs(dot(selected, direction))) {
		selected = vec3(0.0, 1.0, 0.0);
	}
	if (abs(direction.z) < abs(dot(selected, direction))) {
		selected = vec3(0.0, 0.0, 1.0);
	}
	return selected;
}

vec3 scatteringCacheLocalW27Direction(vec3 positionMeters, vec3 physicalDirection) {
	vec3 xAxis = normalize(directionToAtmosphericSource(positionMeters));
	vec3 zAxis = vec3(0.0, 0.0, 1.0)
		- xAxis * dot(vec3(0.0, 0.0, 1.0), xAxis);
	if (length(zAxis) <= 1.0e-10) {
		vec3 fallback = scatteringCacheLeastAlignedAxis(xAxis);
		zAxis = fallback - xAxis * dot(fallback, xAxis);
	}
	zAxis = normalize(zAxis);
	vec3 yAxis = normalize(cross(zAxis, xAxis));
	vec3 direction = normalize(physicalDirection);
	return vec3(
		dot(direction, xAxis),
		dot(direction, yAxis),
		dot(direction, zAxis)
	);
}

CacheDirectionStencil resolveScatteringCacheDirectionStencil(
	vec3 positionMeters,
	vec3 physicalDirection
) {
	vec3 direction = scatteringCacheLocalW27Direction(positionMeters, physicalDirection);
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
		selectedProjection = -direction.z;
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
	ivec4 indices = ivec4(
		faceOffset + lowerFaceVIndex * 27 + lowerFaceUIndex,
		faceOffset + lowerFaceVIndex * 27 + upperFaceUIndex,
		faceOffset + upperFaceVIndex * 27 + lowerFaceUIndex,
		faceOffset + upperFaceVIndex * 27 + upperFaceUIndex
	);
	vec4 weights = vec4(
		(1.0 - uFraction) * (1.0 - vFraction),
		uFraction * (1.0 - vFraction),
		(1.0 - uFraction) * vFraction,
		uFraction * vFraction
	);
	return CacheDirectionStencil(indices, weights);
}`,
				),
			],
			bindingRequirements: [
				ShaderContributions.createShaderBindingRequirement(
					'geometry.camera-ground-relative-position',
					'geometry',
					'uniform',
					'frame',
					'geometry.cameraGroundRelativePosition',
					true,
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
