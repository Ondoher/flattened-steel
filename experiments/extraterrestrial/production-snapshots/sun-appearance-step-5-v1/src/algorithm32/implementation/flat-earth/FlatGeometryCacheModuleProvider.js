import {CacheBuildModules} from '../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CacheValues} from '../../gpu-cache-runtime/CacheValues.js';
import DistanceMath from '../../math/DistanceMath.js';
import {FLAT_GEOMETRY_CACHE_SYMBOLS_BY_PASS, FLAT_GEOMETRY_GROUND_REFLECTION_SYMBOL} from './consts.js';

/**
 * Provider of geometry-owned flat cache-build modules.
 */
export class FlatGeometryCacheModuleProvider {
	/**
	 * Called by FlatGeometryCacheModuleProvider to pack three-component local directions for scalar R32F construction data.
	 *
	 * @param {string} id - The packed-data identity.
	 * @param {string} quantity - The physical interpretation.
	 * @param {readonly UnitVector3[]} directions - The ordered directions.
	 * @returns {CacheData} - The packed direction rows.
	 */
	_createDirectionCacheData(id, quantity, directions) {
		return CacheValues.createData({
			id,
			quantity,
			units: '1',
			shape: [3, directions.length],
			values: directions.flatMap(
				/**
				 * Called by Array.prototype.flatMap to transform and flatten one collection value.
				 * @param direction - The direction value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (direction) => direction,
			),
		});
	}

	/**
	 * Creates the flat geometry cache-module provider for one normalized configuration.
	 *
	 * @param {FlatEarthGeometryConfiguration} configuration - The normalized flat geometry configuration.
	 */
	constructor(configuration) {
		this._configuration = configuration;
	}

	/**
	 * Call this method to create flat construction coordinates and symbols for one cache pass.
	 *
	 * @param {CacheBuildContext} context - The logical pass.
	 * @returns {CacheBuildModule} - The geometry-owned construction module.
	 *
	 */
	createCacheModule(context) {
		const domains = /** @type {LocalSunConstructionDomainSelection} */ (context.domains);
		const reflectiveScatter = context.kind === 'scatter' && context.groundReflection !== undefined;
		const provides = reflectiveScatter
			? [
					...FLAT_GEOMETRY_CACHE_SYMBOLS_BY_PASS[context.kind],
					'geometry.sourcePath',
					FLAT_GEOMETRY_GROUND_REFLECTION_SYMBOL,
				]
			: FLAT_GEOMETRY_CACHE_SYMBOLS_BY_PASS[context.kind];
		/** @type {CacheBinding[]} */
		const bindings = [];
		/** @type {CacheShaderBlock[]} */
		const blocks = [];
		const usesPhysicalDomain =
			context.kind === 'primary-j1' ||
			context.kind === 'direct-l1' ||
			context.kind === 'scatter' ||
			context.kind === 'transport';

		if (usesPhysicalDomain) {
			const coordinateValues = domains.positionNodes.flatMap(
				/**
				 * Called by Array.prototype.flatMap to transform and flatten one collection value.
				 * @param node - The node value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (node) => {
					const metadata = /** @type {FlatLocalCachePositionNodeMetadata} */ (node.metadata);
					return [DistanceMath.toMeters(metadata.z), DistanceMath.toMeters(metadata.rho)];
				},
			);
			const positionData = CacheValues.createData({
				id: `${domains.id}-flat-local-position-coordinates-v1`,
				quantity: 'flat-local-z-rho-position',
				units: 'meters',
				shape: [2, domains.positionNodes.length],
				values: coordinateValues,
			});
			bindings.push({
				spec: {
					id: 'flat-geometry-position-nodes',
					name: 'uCachePositionNodes',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: positionData,
			});
			bindings.push(
				{
					spec: {
						id: 'flat-geometry-top-altitude',
						name: 'uCacheGeometryTopAltitude',
						kind: 'uniform',
						shaderType: 'float',
						frequency: 'build',
					},
					value: this._configuration.topAltitude,
				},
				{
					spec: {
						id: 'flat-geometry-source-subpoint',
						name: 'uCacheGeometrySourceSubpoint',
						kind: 'uniform',
						shaderType: 'vec3',
						frequency: 'build',
					},
					value: this._configuration.sourceSubpoint,
				},
				{
					spec: {
						id: 'flat-geometry-source-position',
						name: 'uCacheGeometrySourcePosition',
						kind: 'uniform',
						shaderType: 'vec3',
						frequency: 'build',
					},
					value: this._configuration.sourcePosition,
				},
				{
					spec: {
						id: 'flat-geometry-radial-fallback',
						name: 'uCacheGeometryRadialFallback',
						kind: 'uniform',
						shaderType: 'vec3',
						frequency: 'build',
					},
					value: this._configuration.cacheRadialFallbackDirection,
				},
				{
					spec: {
						id: 'flat-geometry-radial-maximum',
						name: 'uCacheGeometryRadialMaximum',
						kind: 'uniform',
						shaderType: 'float',
						frequency: 'build',
					},
					value: this._configuration.cacheRadialMaximum,
				},
				{
					spec: {
						id: 'flat-geometry-rho-count',
						name: 'CACHE_RHO_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'build',
					},
					value: domains.rhoCount,
				},
			);
			if (context.kind === 'transport') {
				const outgoingDirectionDomain = /** @type {CubedSphereDirectionDomain} */ (
					domains.outgoingDirectionDomain
				);
				bindings.push(
					{
						spec: {
							id: 'flat-geometry-z-count',
							name: 'CACHE_Z_COUNT',
							kind: 'define',
							shaderType: 'int',
							frequency: 'build',
						},
						value: domains.zCount,
					},
					{
						spec: {
							id: 'flat-geometry-outgoing-face-width',
							name: 'CACHE_OUTGOING_FACE_WIDTH',
							kind: 'define',
							shaderType: 'int',
							frequency: 'build',
						},
						value: outgoingDirectionDomain.faceWidth,
					},
					{
						spec: {
							id: 'flat-geometry-outgoing-face-cell-width',
							name: 'CACHE_OUTGOING_FACE_CELL_WIDTH',
							kind: 'define',
							shaderType: 'int',
							frequency: 'build',
						},
						value: outgoingDirectionDomain.cellWidth,
					},
					{
						spec: {
							id: 'flat-geometry-outgoing-face-node-count',
							name: 'CACHE_OUTGOING_FACE_NODE_COUNT',
							kind: 'define',
							shaderType: 'int',
							frequency: 'build',
						},
						value: outgoingDirectionDomain.faceNodeCount,
					},
				);
			}
			blocks.push({
				id: 'flat-geometry-cache-position-and-path',
				phase: 'function',
				order: 0,
				source: `float cacheAltitude(vec3 positionMeters) {
	return positionMeters.z;
}

float cacheRho(vec3 positionMeters) {
	return length(positionMeters.xy - uCacheGeometrySourceSubpoint.xy);
}

vec3 cachePosition(int positionIndex) {
	float zMeters = texelFetch(
		uCachePositionNodes,
		ivec2(0, positionIndex),
		0
	).r;
	float rhoMeters = texelFetch(
		uCachePositionNodes,
		ivec2(1, positionIndex),
		0
	).r;
	return vec3(
		uCacheGeometrySourceSubpoint.xy
			+ uCacheGeometryRadialFallback.xy * rhoMeters,
		zMeters
	);
}

float cacheGroundBoundaryDistance(vec3 positionMeters, vec3 direction) {
	if (direction.z >= -1.0e-9) return -1.0;
	float distanceMeters = -positionMeters.z / direction.z;
	return distanceMeters >= -1.0e-9 ? max(0.0, distanceMeters) : -1.0;
}

bool cacheRayBlockedByGround(vec3 positionMeters, vec3 direction) {
	return cacheGroundBoundaryDistance(positionMeters, direction) > 0.0;
}

float cacheTopBoundaryDistance(vec3 positionMeters, vec3 direction) {
	if (direction.z <= 1.0e-9) return -1.0;
	float distanceMeters =
		(uCacheGeometryTopAltitude - positionMeters.z) / direction.z;
	return distanceMeters >= -1.0e-9 ? max(0.0, distanceMeters) : -1.0;
}

float cacheSourcePathDistance(vec3 positionMeters, vec3 direction) {
	float sourceDistanceMeters =
		length(uCacheGeometrySourcePosition - positionMeters);
	float topDistanceMeters =
		cacheTopBoundaryDistance(positionMeters, direction);
	return topDistanceMeters >= 0.0
		? min(sourceDistanceMeters, topDistanceMeters)
		: sourceDistanceMeters;
}

float cacheRadialBoundaryDistance(vec3 positionMeters, vec3 direction) {
	vec2 offset = positionMeters.xy - uCacheGeometrySourceSubpoint.xy;
	float directionMagnitudeSquared = dot(direction.xy, direction.xy);
	if (directionMagnitudeSquared <= 1.0e-18) return -1.0;
	float halfLinearCoefficient = dot(offset, direction.xy);
	float constantTerm = dot(offset, offset)
		- uCacheGeometryRadialMaximum * uCacheGeometryRadialMaximum;
	float discriminant = halfLinearCoefficient * halfLinearCoefficient
		- directionMagnitudeSquared * constantTerm;
	if (discriminant < -1.0e-9) return -1.0;
	float distanceMeters =
		(-halfLinearCoefficient + sqrt(max(0.0, discriminant)))
			/ directionMagnitudeSquared;
	return distanceMeters >= -1.0e-9 ? max(0.0, distanceMeters) : -1.0;
}

void cacheSelectNearestBoundary(
	float candidateMeters,
	inout float selectedMeters
) {
	if (candidateMeters >= 0.0
		&& (selectedMeters < 0.0 || candidateMeters < selectedMeters)) {
		selectedMeters = candidateMeters;
	}
}

float cacheReusableBoundaryDistance(
	vec3 positionMeters,
	vec3 direction
) {
	float selectedMeters = -1.0;
	cacheSelectNearestBoundary(
		cacheGroundBoundaryDistance(positionMeters, direction),
		selectedMeters
	);
	cacheSelectNearestBoundary(
		cacheTopBoundaryDistance(positionMeters, direction),
		selectedMeters
	);
	cacheSelectNearestBoundary(
		cacheRadialBoundaryDistance(positionMeters, direction),
		selectedMeters
	);
	return max(0.0, selectedMeters);
}`.trim(),
			});
		}

		if (reflectiveScatter) {
			blocks.push({
				id: 'flat-geometry-cache-ground-reflection',
				phase: 'function',
				order: 5,
				source: `void cacheGroundConstructionPositionStencil(
	vec3 groundPositionMeters,
	out ivec4 positionIndices,
	out vec4 positionWeights
) {
	float rhoMeters = cacheRho(groundPositionMeters);
	int lastRhoIndex = CACHE_RHO_COUNT - 1;
	int lowerRhoIndex = 0;
	int upperRhoIndex = 0;
	float lowerWeight = 1.0;
	float upperWeight = 0.0;
	float firstRhoMeters = texelFetch(
		uCachePositionNodes,
		ivec2(1, 0),
		0
	).r;

	if (lastRhoIndex > 0 && rhoMeters > firstRhoMeters) {
		float lastRhoMeters = texelFetch(
			uCachePositionNodes,
			ivec2(1, lastRhoIndex),
			0
		).r;
		if (rhoMeters >= lastRhoMeters) {
			lowerRhoIndex = lastRhoIndex;
			upperRhoIndex = lastRhoIndex;
		} else {
			for (int candidateIndex = 1;
				candidateIndex < CACHE_RHO_COUNT;
				++candidateIndex) {
				float candidateRhoMeters = texelFetch(
					uCachePositionNodes,
					ivec2(1, candidateIndex),
					0
				).r;
				if (rhoMeters <= candidateRhoMeters) {
					if (rhoMeters == candidateRhoMeters) {
						lowerRhoIndex = candidateIndex;
						upperRhoIndex = candidateIndex;
					} else {
						lowerRhoIndex = candidateIndex - 1;
						upperRhoIndex = candidateIndex;
						float lowerRhoMeters = texelFetch(
							uCachePositionNodes,
							ivec2(1, lowerRhoIndex),
							0
						).r;
						upperWeight =
							(rhoMeters - lowerRhoMeters)
							/ (candidateRhoMeters - lowerRhoMeters);
						lowerWeight = 1.0 - upperWeight;
					}
					break;
				}
			}
		}
	}

	positionIndices = ivec4(
		lowerRhoIndex,
		upperRhoIndex,
		0,
		0
	);
	positionWeights = vec4(
		lowerWeight,
		upperWeight,
		0.0,
		0.0
	);
}

bool cacheGroundBoundaryHit(
	vec3 positionMeters,
	vec3 direction,
	int positionIndex,
	int incomingDirectionIndex,
	out vec3 groundPositionMeters,
	out vec3 groundNormal,
	out float groundDistanceMeters,
	out ivec4 groundConstructionPositionIndices,
	out vec4 groundConstructionPositionWeights
) {
	groundDistanceMeters =
		cacheGroundBoundaryDistance(positionMeters, direction);
	if (groundDistanceMeters < 0.0) return false;
	groundPositionMeters =
		positionMeters + direction * groundDistanceMeters;
	groundPositionMeters.z = 0.0;
	groundNormal = vec3(0.0, 0.0, 1.0);
	cacheGroundConstructionPositionStencil(
		groundPositionMeters,
		groundConstructionPositionIndices,
		groundConstructionPositionWeights
	);
	return true;
}`.trim(),
			});
		}

		if (
			context.kind === 'primary-j1' ||
			context.kind === 'direct-l1' ||
			context.kind === 'scatter' ||
			context.kind === 'transport'
		) {
			blocks.push({
				id: 'flat-geometry-source-frames',
				phase: 'function',
				order: 10,
				source: `vec3 cacheRadialDirection(vec3 directionToSource) {
	vec3 radial = vec3(-directionToSource.xy, 0.0);
	if (length(radial) <= 1.0e-10) {
		return normalize(uCacheGeometryRadialFallback);
	}
	return normalize(radial);
}

vec3 cachePhysicalDirection(
	vec3 localDirection,
	vec3 directionToSource
) {
	vec3 radial = cacheRadialDirection(directionToSource);
	vec3 tangent = vec3(-radial.y, radial.x, 0.0);
	return normalize(
		radial * localDirection.x
		+ tangent * localDirection.y
		+ vec3(0.0, 0.0, 1.0) * localDirection.z
	);
}`.trim(),
			});
		}

		if (context.kind === 'primary-j1' || context.kind === 'scatter') {
			const outgoingData = this._createDirectionCacheData(
				`${domains.id}-flat-local-outgoing-directions-v1`,
				'source-local-outgoing-direction',
				domains.outgoingUnitVectors,
			);
			bindings.push({
				spec: {
					id: 'flat-geometry-outgoing-directions',
					name: 'uCacheOutgoingDirections',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: outgoingData,
			});
			blocks.push({
				id: 'flat-geometry-outgoing-directions',
				phase: 'function',
				order: 20,
				source: `vec3 cacheOutgoingDirection(
	int directionIndex,
	vec3 directionToSource
) {
	vec3 localDirection = vec3(
		texelFetch(uCacheOutgoingDirections, ivec2(0, directionIndex), 0).r,
		texelFetch(uCacheOutgoingDirections, ivec2(1, directionIndex), 0).r,
		texelFetch(uCacheOutgoingDirections, ivec2(2, directionIndex), 0).r
	);
	return cachePhysicalDirection(localDirection, directionToSource);
}`.trim(),
			});
		}

		if (context.kind === 'direct-l1' || context.kind === 'scatter' || context.kind === 'transport') {
			const incomingData = this._createDirectionCacheData(
				`${domains.id}-flat-local-incoming-directions-v1`,
				'source-local-incoming-direction',
				domains.incomingUnitVectors,
			);
			bindings.push({
				spec: {
					id: 'flat-geometry-incoming-directions',
					name: 'uCacheIncomingDirections',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: incomingData,
			});
			blocks.push({
				id: 'flat-geometry-incoming-directions',
				phase: 'function',
				order: 30,
				source: `vec3 cacheIncomingDirection(
	int directionIndex,
	vec3 directionToSource
) {
	vec3 localDirection = vec3(
		texelFetch(uCacheIncomingDirections, ivec2(0, directionIndex), 0).r,
		texelFetch(uCacheIncomingDirections, ivec2(1, directionIndex), 0).r,
		texelFetch(uCacheIncomingDirections, ivec2(2, directionIndex), 0).r
	);
	return cachePhysicalDirection(localDirection, directionToSource);
}`.trim(),
			});
		}

		if (context.kind === 'transport') {
			blocks.push({
				id: 'flat-geometry-integrated-transport',
				phase: 'function',
				order: 40,
				source: `struct CacheTransportRay {
	vec3 originMeters;
	vec3 direction;
	float distanceMeters;
	bool endsOnGround;
};

struct CachePositionStencil {
	ivec4 indices;
	vec4 weights;
};

struct CacheDirectionStencil {
	ivec4 indices;
	vec4 weights;
};

CacheTransportRay cacheIntegratedTransportRay(
	int positionIndex,
	int incomingDirectionIndex
) {
	vec3 originMeters = cachePosition(positionIndex);
	vec3 directionToSource = normalize(
		uCacheGeometrySourcePosition - originMeters
	);
	vec3 direction = cacheIncomingDirection(
		incomingDirectionIndex,
		directionToSource
	);
	float selectedDistanceMeters = -1.0;
	bool endsOnGround = false;
	float groundDistanceMeters = cacheGroundBoundaryDistance(
		originMeters,
		direction
	);
	if (groundDistanceMeters >= 0.0) {
		selectedDistanceMeters = groundDistanceMeters;
		endsOnGround = true;
	}
	float topDistanceMeters = cacheTopBoundaryDistance(originMeters, direction);
	if (topDistanceMeters >= 0.0
		&& (selectedDistanceMeters < 0.0
			|| topDistanceMeters < selectedDistanceMeters)) {
		selectedDistanceMeters = topDistanceMeters;
		endsOnGround = false;
	}
	float radialDistanceMeters = cacheRadialBoundaryDistance(
		originMeters,
		direction
	);
	if (radialDistanceMeters >= 0.0
		&& (selectedDistanceMeters < 0.0
			|| radialDistanceMeters < selectedDistanceMeters)) {
		selectedDistanceMeters = radialDistanceMeters;
		endsOnGround = false;
	}
	return CacheTransportRay(
		originMeters,
		direction,
		max(0.0, selectedDistanceMeters),
		endsOnGround
	);
}

float cacheConstructionAxisNode(int nodeIndex, bool zAxis) {
	ivec2 coordinate = zAxis
		? ivec2(0, nodeIndex * CACHE_RHO_COUNT)
		: ivec2(1, nodeIndex);
	return texelFetch(uCachePositionNodes, coordinate, 0).r;
}

void cacheConstructionAxisStencil(
	float coordinateMeters,
	int nodeCount,
	bool zAxis,
	out int lowerIndex,
	out int upperIndex,
	out float upperWeight
) {
	float firstNodeMeters = cacheConstructionAxisNode(0, zAxis);
	if (coordinateMeters <= firstNodeMeters) {
		lowerIndex = 0;
		upperIndex = 0;
		upperWeight = 0.0;
		return;
	}
	int lastIndex = nodeCount - 1;
	float lastNodeMeters = cacheConstructionAxisNode(lastIndex, zAxis);
	if (coordinateMeters >= lastNodeMeters) {
		lowerIndex = lastIndex;
		upperIndex = lastIndex;
		upperWeight = 0.0;
		return;
	}
	lowerIndex = 0;
	upperIndex = 1;
	for (int nodeIndex = 1; nodeIndex < nodeCount; ++nodeIndex) {
		float nodeMeters = cacheConstructionAxisNode(nodeIndex, zAxis);
		if (coordinateMeters <= nodeMeters) {
			lowerIndex = nodeIndex - 1;
			upperIndex = nodeIndex;
			break;
		}
	}
	float lowerMeters = cacheConstructionAxisNode(lowerIndex, zAxis);
	float upperMeters = cacheConstructionAxisNode(upperIndex, zAxis);
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

CachePositionStencil cacheConstructionPositionStencil(
	vec3 positionMeters
) {
	int zLowerIndex;
	int zUpperIndex;
	float zUpperWeight;
	cacheConstructionAxisStencil(
		cacheAltitude(positionMeters),
		CACHE_Z_COUNT,
		true,
		zLowerIndex,
		zUpperIndex,
		zUpperWeight
	);
	int rhoLowerIndex;
	int rhoUpperIndex;
	float rhoUpperWeight;
	cacheConstructionAxisStencil(
		cacheRho(positionMeters),
		CACHE_RHO_COUNT,
		false,
		rhoLowerIndex,
		rhoUpperIndex,
		rhoUpperWeight
	);
	float zLowerWeight = 1.0 - zUpperWeight;
	float rhoLowerWeight = 1.0 - rhoUpperWeight;
	return CachePositionStencil(
		ivec4(
			zLowerIndex * CACHE_RHO_COUNT + rhoLowerIndex,
			zLowerIndex * CACHE_RHO_COUNT + rhoUpperIndex,
			zUpperIndex * CACHE_RHO_COUNT + rhoLowerIndex,
			zUpperIndex * CACHE_RHO_COUNT + rhoUpperIndex
		),
		vec4(
			zLowerWeight * rhoLowerWeight,
			zLowerWeight * rhoUpperWeight,
			zUpperWeight * rhoLowerWeight,
			zUpperWeight * rhoUpperWeight
		)
	);
}

vec3 cacheConstructionLocalDirection(
	vec3 positionMeters,
	vec3 physicalDirection
) {
	vec3 radial = vec3(
		positionMeters.xy - uCacheGeometrySourceSubpoint.xy,
		0.0
	);
	if (length(radial) <= 1.0e-10) {
		radial = normalize(uCacheGeometryRadialFallback);
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

CacheDirectionStencil cacheConstructionDirectionStencil(
	vec3 positionMeters,
	vec3 physicalDirection
) {
	vec3 direction = cacheConstructionLocalDirection(
		positionMeters,
		physicalDirection
	);
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

	float faceUGridCoordinate = clamp(
		(clamp(faceUCoordinate, -1.0, 1.0) + 1.0)
			* 0.5 * float(CACHE_OUTGOING_FACE_CELL_WIDTH),
		0.0,
		float(CACHE_OUTGOING_FACE_CELL_WIDTH)
	);
	float faceVGridCoordinate = clamp(
		(clamp(faceVCoordinate, -1.0, 1.0) + 1.0)
			* 0.5 * float(CACHE_OUTGOING_FACE_CELL_WIDTH),
		0.0,
		float(CACHE_OUTGOING_FACE_CELL_WIDTH)
	);
	float uNearest = floor(faceUGridCoordinate + 0.5);
	float vNearest = floor(faceVGridCoordinate + 0.5);
	bool faceUIsExact = abs(faceUGridCoordinate - uNearest) <= 1.0e-10;
	bool faceVIsExact = abs(faceVGridCoordinate - vNearest) <= 1.0e-10;
	int lowerFaceUIndex = faceUIsExact
		? int(uNearest)
		: int(floor(faceUGridCoordinate));
	int lowerFaceVIndex = faceVIsExact
		? int(vNearest)
		: int(floor(faceVGridCoordinate));
	int upperFaceUIndex = faceUIsExact
		? lowerFaceUIndex
		: min(lowerFaceUIndex + 1, CACHE_OUTGOING_FACE_WIDTH - 1);
	int upperFaceVIndex = faceVIsExact
		? lowerFaceVIndex
		: min(lowerFaceVIndex + 1, CACHE_OUTGOING_FACE_WIDTH - 1);
	float uFraction = faceUIsExact
		? 0.0
		: faceUGridCoordinate - float(lowerFaceUIndex);
	float vFraction = faceVIsExact
		? 0.0
		: faceVGridCoordinate - float(lowerFaceVIndex);
	int faceOffset = faceIndex * CACHE_OUTGOING_FACE_NODE_COUNT;
	return CacheDirectionStencil(
		ivec4(
			faceOffset + lowerFaceVIndex * CACHE_OUTGOING_FACE_WIDTH
				+ lowerFaceUIndex,
			faceOffset + lowerFaceVIndex * CACHE_OUTGOING_FACE_WIDTH
				+ upperFaceUIndex,
			faceOffset + upperFaceVIndex * CACHE_OUTGOING_FACE_WIDTH
				+ lowerFaceUIndex,
			faceOffset + upperFaceVIndex * CACHE_OUTGOING_FACE_WIDTH
				+ upperFaceUIndex
		),
		vec4(
			(1.0 - uFraction) * (1.0 - vFraction),
			uFraction * (1.0 - vFraction),
			(1.0 - uFraction) * vFraction,
			uFraction * vFraction
		)
	);
}`.trim(),
			});
		}

		if (context.kind === 'scatter') {
			const weightData = CacheValues.createData({
				id: `${domains.id}-flat-local-incoming-weights-v1`,
				quantity: 'solid-angle-weight',
				units: domains.incomingIntegrationWeights.units,
				shape: [domains.incomingIntegrationWeights.values.length],
				values: domains.incomingIntegrationWeights.values,
			});
			bindings.push({
				spec: {
					id: 'flat-geometry-incoming-weights',
					name: 'uCacheIncomingWeights',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: weightData,
			});
			blocks.push({
				id: 'flat-geometry-incoming-weights',
				phase: 'function',
				order: 40,
				source: `float cacheIncomingWeight(int directionIndex) {
	return texelFetch(
		uCacheIncomingWeights,
		ivec2(directionIndex, 0),
		0
	).r;
}`.trim(),
			});
		}

		if (context.kind === 'direct-l1') {
			bindings.push({
				spec: {
					id: 'flat-geometry-transport-interval-count',
					name: 'CACHE_TRANSPORT_INTERVAL_COUNT',
					kind: 'define',
					shaderType: 'int',
					frequency: 'pass',
				},
				value: /** @type {number} */ (context.pathIntervalCount),
			});
		}

		return CacheBuildModules.createBuildModule({
			id: `algorithm32-flat-earth-${context.kind}-module-v4`,
			owner: 'geometry',
			provides,
			requires: [],
			blocks,
			bindings,
		});
	}
}
