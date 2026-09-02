import {CacheBuildModules} from '../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CacheValues} from '../../gpu-cache-runtime/CacheValues.js';
import DistanceMath from '../../math/DistanceMath.js';
import {SPHERICAL_GEOMETRY_CACHE_SYMBOLS_BY_PASS, SPHERICAL_GEOMETRY_GROUND_REFLECTION_SYMBOL} from './consts.js';
import {SphericalScatteringCacheGeometry} from './SphericalScatteringCacheGeometry.js';

/** Geometry-owned spherical cache-construction module provider. */
export class SphericalGeometryCacheModuleProvider {
	/**
	 * Creates a spherical cache-module provider for normalized geometry and cache coordinates.
	 *
	 * @param {SphericalEarthGeometryConfiguration} configuration - The normalized spherical geometry configuration.
	 * @param {SphericalScatteringCacheGeometry} scatteringCacheGeometry - The spherical cache-coordinate operations.
	 */
	constructor(configuration, scatteringCacheGeometry) {
		this._configuration = configuration;
		this._scatteringCacheGeometry = scatteringCacheGeometry;
	}

	/**
	 * Called by cache-module construction to pack three-component direction rows.
	 *
	 * @param {string} id - The packed-data identity.
	 * @param {string} quantity - The physical interpretation.
	 * @param {readonly UnitVector3[]} directions - The ordered directions.
	 * @returns {CacheData} - The packed scalar rows.
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
	 * Call this method to create spherical coordinates and symbols for one cache pass.
	 *
	 * @param {CacheBuildContext} context - The resolved logical pass.
	 * @returns {CacheBuildModule} - The geometry-owned construction module.
	 */
	createCacheModule(context) {
		const domains = context.domains;
		this._scatteringCacheGeometry.assertConstructionDomainAlignment(domains);
		const defaultDomains = this._scatteringCacheGeometry.usesDefaultConstructionDomains(domains);
		const ordinaryFibonacci34Domains =
			this._scatteringCacheGeometry.usesOrdinaryFibonacci34ConstructionDomains(domains);
		const establishedPositionAndOutgoingDomains = defaultDomains || ordinaryFibonacci34Domains;
		const reflectiveScatter = context.kind === 'scatter' && context.groundReflection !== undefined;
		const provides = reflectiveScatter
			? [
					...SPHERICAL_GEOMETRY_CACHE_SYMBOLS_BY_PASS[context.kind],
					'geometry.sourcePath',
					SPHERICAL_GEOMETRY_GROUND_REFLECTION_SYMBOL,
				]
			: SPHERICAL_GEOMETRY_CACHE_SYMBOLS_BY_PASS[context.kind];
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
			const positionData = CacheValues.createData({
				id: establishedPositionAndOutgoingDomains
					? 'algorithm32-spherical-native-48-altitudes-v1'
					: `${domains.id}-spherical-position-altitudes-v1`,
				quantity: 'altitude-above-ground',
				units: 'meters',
				shape: [domains.positionNodes.length],
				values: domains.positionNodes.map(
					/**
					 * Called by Array.prototype.map to transform one collection value.
					 * @param node - The node value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (node) => DistanceMath.toMeters(node.coordinate),
				),
			});
			bindings.push({
				spec: {
					id: 'spherical-geometry-position-nodes',
					name: 'uCachePositionNodes',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: positionData,
			});
			bindings.push(
				.../** @type {CacheBinding[]} */ ([
					{
						spec: {
							id: 'spherical-geometry-bottom-radius',
							name: 'uCacheGeometryBottomRadius',
							kind: 'uniform',
							shaderType: 'float',
							frequency: 'build',
						},
						value: this._configuration.bottomRadius,
					},
					{
						spec: {
							id: 'spherical-geometry-top-radius',
							name: 'uCacheGeometryTopRadius',
							kind: 'uniform',
							shaderType: 'float',
							frequency: 'build',
						},
						value: this._configuration.topRadius,
					},
					{
						spec: {
							id: 'spherical-geometry-observer-up',
							name: 'uCacheGeometryObserverUp',
							kind: 'uniform',
							shaderType: 'vec3',
							frequency: 'build',
						},
						value: this._configuration.observerUpDirection,
					},
				]),
			);
			blocks.push({
				id: 'spherical-geometry-cache-position-and-path',
				phase: 'function',
				order: 0,
				source: `float cacheAltitude(vec3 positionMeters) {
	return max(0.0, length(positionMeters) - uCacheGeometryBottomRadius);
}

vec3 cachePosition(int positionIndex) {
	float altitudeMeters = texelFetch(
		uCachePositionNodes,
		ivec2(positionIndex, 0),
		0
	).r;
	return uCacheGeometryObserverUp
		* (uCacheGeometryBottomRadius + altitudeMeters);
}

bool cacheRayBlockedByGround(vec3 positionMeters, vec3 direction) {
	float radiusMeters = length(positionMeters);
	float heightMeters = max(0.0, radiusMeters - uCacheGeometryBottomRadius);
	float halfLinearCoefficient = dot(positionMeters, direction);
	float constantTerm = heightMeters
		* (radiusMeters + uCacheGeometryBottomRadius);
	float discriminant = halfLinearCoefficient * halfLinearCoefficient - constantTerm;
	return halfLinearCoefficient < 0.0 && discriminant >= 0.0;
}

float cacheTopBoundaryDistance(vec3 positionMeters, vec3 direction) {
	float radiusMeters = length(positionMeters);
	float radialDirectionCosine = dot(positionMeters, direction) / radiusMeters;
	float discriminant = radiusMeters * radiusMeters
		* (radialDirectionCosine * radialDirectionCosine - 1.0)
		+ uCacheGeometryTopRadius * uCacheGeometryTopRadius;
	return max(
		0.0,
		-radiusMeters * radialDirectionCosine + sqrt(max(0.0, discriminant))
	);
}

float cacheSourcePathDistance(vec3 positionMeters, vec3 direction) {
	return cacheTopBoundaryDistance(positionMeters, direction);
}`,
			});
		}

		if (reflectiveScatter) {
			blocks.push({
				id: 'spherical-geometry-cache-ground-reflection',
				phase: 'function',
				order: 5,
				source: `void cacheGroundConstructionPositionStencil(
	vec3 groundPositionMeters,
	out ivec4 positionIndices,
	out vec4 positionWeights
) {
	float atmosphereHeightMeters =
		uCacheGeometryTopRadius - uCacheGeometryBottomRadius;
	float normalizedAltitude = clamp(
		cacheAltitude(groundPositionMeters) / atmosphereHeightMeters,
		0.0,
		0.999999999
	);
	int positionIndex = clamp(
		int(floor(normalizedAltitude * float(CACHE_POSITION_COUNT))),
		0,
		CACHE_POSITION_COUNT - 1
	);
	positionIndices = ivec4(positionIndex, 0, 0, 0);
	positionWeights = vec4(1.0, 0.0, 0.0, 0.0);
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
	if (positionIndex == 0
		&& texelFetch(uCachePositionNodes, ivec2(0, 0), 0).r == 0.0
		&& texelFetch(
			uCacheIncomingGroundContactMask,
			ivec2(incomingDirectionIndex, 0),
			0
		).r == 0.0) return false;
	float radiusMeters = length(positionMeters);
	float heightMeters = max(
		0.0,
		radiusMeters - uCacheGeometryBottomRadius
	);
	float halfLinearCoefficient = dot(positionMeters, direction);
	float constantTerm = heightMeters
		* (radiusMeters + uCacheGeometryBottomRadius);
	float discriminant = halfLinearCoefficient * halfLinearCoefficient - constantTerm;
	if (halfLinearCoefficient >= 0.0 || discriminant < 0.0) return false;

	float denominator = -halfLinearCoefficient + sqrt(max(0.0, discriminant));
	groundDistanceMeters = denominator == 0.0
		? 0.0
		: max(0.0, constantTerm / denominator);
	groundPositionMeters =
		positionMeters + direction * groundDistanceMeters;
	groundNormal = normalize(groundPositionMeters);
	cacheGroundConstructionPositionStencil(
		groundPositionMeters,
		groundConstructionPositionIndices,
		groundConstructionPositionWeights
	);
	return true;
}`,
			});
		}

		if (
			context.kind === 'primary-j1' ||
			context.kind === 'direct-l1' ||
			context.kind === 'scatter' ||
			context.kind === 'transport'
		) {
			blocks.push({
				id: 'spherical-geometry-source-frames',
				phase: 'function',
				order: 10,
				source: `vec3 cacheLeastAlignedAxis(vec3 direction) {
	vec3 selected = vec3(1.0, 0.0, 0.0);
	if (abs(direction.y) < abs(dot(selected, direction))) {
		selected = vec3(0.0, 1.0, 0.0);
	}
	if (abs(direction.z) < abs(dot(selected, direction))) {
		selected = vec3(0.0, 0.0, 1.0);
	}
	return selected;
}

vec3 cacheFibonacciPhysicalDirection(vec3 localDirection, vec3 directionToSource) {
	vec3 xAxis = directionToSource;
	vec3 reference = abs(dot(xAxis, vec3(0.0, 0.0, 1.0))) < 0.95
		? vec3(0.0, 0.0, 1.0)
		: vec3(0.0, 1.0, 0.0);
	vec3 zAxis = normalize(reference - xAxis * dot(reference, xAxis));
	vec3 yAxis = normalize(cross(zAxis, xAxis));
	return normalize(
		xAxis * localDirection.x
		+ yAxis * localDirection.y
		+ zAxis * localDirection.z
	);
}

vec3 cacheW27PhysicalDirection(vec3 localDirection, vec3 directionToSource) {
	vec3 xAxis = directionToSource;
	vec3 zAxis = vec3(0.0, 0.0, 1.0)
		- xAxis * dot(vec3(0.0, 0.0, 1.0), xAxis);
	if (length(zAxis) <= 1.0e-10) {
		vec3 fallback = cacheLeastAlignedAxis(xAxis);
		zAxis = fallback - xAxis * dot(fallback, xAxis);
	}
	zAxis = normalize(zAxis);
	vec3 yAxis = normalize(cross(zAxis, xAxis));
	return normalize(
		xAxis * localDirection.x
		+ yAxis * localDirection.y
		+ zAxis * localDirection.z
	);
}`,
			});
		}

		if (context.kind === 'primary-j1' || context.kind === 'scatter') {
			const outgoingData = this._createDirectionCacheData(
				establishedPositionAndOutgoingDomains
					? 'algorithm32-spherical-w27-directions-v1'
					: `${domains.id}-spherical-outgoing-directions-v1`,
				'source-local-outgoing-direction',
				domains.outgoingUnitVectors,
			);
			bindings.push({
				spec: {
					id: 'spherical-geometry-outgoing-directions',
					name: 'uCacheOutgoingDirections',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: outgoingData,
			});
			blocks.push({
				id: 'spherical-geometry-outgoing-directions',
				phase: 'function',
				order: 20,
				source: `vec3 cacheOutgoingLocalDirection(int directionIndex) {
	return vec3(
		texelFetch(uCacheOutgoingDirections, ivec2(0, directionIndex), 0).r,
		texelFetch(uCacheOutgoingDirections, ivec2(1, directionIndex), 0).r,
		texelFetch(uCacheOutgoingDirections, ivec2(2, directionIndex), 0).r
	);
}

vec3 cacheOutgoingDirection(int directionIndex, vec3 directionToSource) {
	return cacheW27PhysicalDirection(
		cacheOutgoingLocalDirection(directionIndex),
		directionToSource
	);
}`,
			});
		}

		if (context.kind === 'direct-l1' || context.kind === 'scatter' || context.kind === 'transport') {
			const incomingData = this._createDirectionCacheData(
				defaultDomains
					? 'algorithm32-spherical-reflection-completed-fibonacci-68-directions-v1'
					: ordinaryFibonacci34Domains
						? 'algorithm32-spherical-fibonacci-34-directions-v1'
						: `${domains.id}-spherical-incoming-directions-v1`,
				'source-local-incoming-direction',
				domains.incomingUnitVectors,
			);
			bindings.push({
				spec: {
					id: 'spherical-geometry-incoming-directions',
					name: 'uCacheIncomingDirections',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: incomingData,
			});
			const groundContactMask = CacheValues.createData({
				id: `${domains.id}-spherical-incoming-ground-contact-mask-v1`,
				quantity: 'ground-contact-blocked-flag',
				units: '1',
				shape: [domains.incomingUnitVectors.length],
				values: domains.incomingUnitVectors.map((direction) =>
					this._scatteringCacheGeometry.isIncomingGroundContactBlocked(direction) ? 1 : 0,
				),
			});
			bindings.push({
				spec: {
					id: 'spherical-geometry-incoming-ground-contact-mask',
					name: 'uCacheIncomingGroundContactMask',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: groundContactMask,
			});
			blocks.push({
				id: 'spherical-geometry-incoming-directions',
				phase: 'function',
				order: 30,
				source: `vec3 cacheIncomingDirection(int directionIndex, vec3 directionToSource) {
	vec3 localDirection = vec3(
		texelFetch(uCacheIncomingDirections, ivec2(0, directionIndex), 0).r,
		texelFetch(uCacheIncomingDirections, ivec2(1, directionIndex), 0).r,
		texelFetch(uCacheIncomingDirections, ivec2(2, directionIndex), 0).r
	);
	return cacheFibonacciPhysicalDirection(localDirection, directionToSource);
}

bool cacheIncomingRayBlockedByGround(
	int positionIndex,
	int directionIndex,
	vec3 positionMeters,
	vec3 direction
) {
	if (positionIndex == 0
		&& texelFetch(uCachePositionNodes, ivec2(0, 0), 0).r == 0.0) {
		return texelFetch(
			uCacheIncomingGroundContactMask,
			ivec2(directionIndex, 0),
			0
		).r != 0.0;
	}
	return cacheRayBlockedByGround(positionMeters, direction);
}`,
			});
		}

		if (context.kind === 'scatter') {
			const weightData = CacheValues.createData({
				id: defaultDomains
					? 'algorithm32-spherical-reflection-completed-fibonacci-68-weights-v1'
					: ordinaryFibonacci34Domains
						? 'algorithm32-spherical-fibonacci-34-weights-v1'
						: `${domains.id}-spherical-incoming-weights-v1`,
				quantity: 'solid-angle-weight',
				units: domains.incomingIntegrationWeights.units,
				shape: [domains.incomingIntegrationWeights.values.length],
				values: domains.incomingIntegrationWeights.values,
			});
			bindings.push({
				spec: {
					id: 'spherical-geometry-incoming-weights',
					name: 'uCacheIncomingWeights',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: weightData,
			});
			blocks.push({
				id: 'spherical-geometry-incoming-weights',
				phase: 'function',
				order: 40,
				source: `float cacheIncomingWeight(int directionIndex) {
	return texelFetch(uCacheIncomingWeights, ivec2(directionIndex, 0), 0).r;
}`,
			});
		}

		if (context.kind === 'primary-j1' || context.kind === 'direct-l1' || reflectiveScatter) {
			bindings.push({
				spec: {
					id: 'spherical-geometry-source-path-interval-count',
					name: 'CACHE_SOURCE_PATH_INTERVAL_COUNT',
					kind: 'define',
					shaderType: 'int',
					frequency: 'build',
				},
				value: this._configuration.sourceTransmittanceIntervalCount,
			});
		}

		if (context.kind === 'direct-l1') {
			bindings.push({
				spec: {
					id: 'spherical-geometry-transport-interval-count',
					name: 'CACHE_TRANSPORT_INTERVAL_COUNT',
					kind: 'define',
					shaderType: 'int',
					frequency: 'pass',
				},
				value: context.options.transportIntervalCount,
			});
		}

		if (context.kind === 'transport') {
			const outgoingDirectionDomain = /** @type {CubedSphereDirectionDomain} */ (domains.outgoingDirectionDomain);
			bindings.push(
				{
					spec: {
						id: 'spherical-geometry-outgoing-face-width',
						name: 'CACHE_OUTGOING_FACE_WIDTH',
						kind: 'define',
						shaderType: 'int',
						frequency: 'build',
					},
					value: outgoingDirectionDomain.faceWidth,
				},
				{
					spec: {
						id: 'spherical-geometry-outgoing-face-cell-width',
						name: 'CACHE_OUTGOING_FACE_CELL_WIDTH',
						kind: 'define',
						shaderType: 'int',
						frequency: 'build',
					},
					value: outgoingDirectionDomain.cellWidth,
				},
				{
					spec: {
						id: 'spherical-geometry-outgoing-face-node-count',
						name: 'CACHE_OUTGOING_FACE_NODE_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'build',
					},
					value: outgoingDirectionDomain.faceNodeCount,
				},
			);
			blocks.push({
				id: 'spherical-geometry-integrated-transport',
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
	vec3 directionToSource = cacheSourceDirection(originMeters);
	vec3 direction = cacheIncomingDirection(
		incomingDirectionIndex,
		directionToSource
	);
	if (cacheIncomingRayBlockedByGround(
		positionIndex,
		incomingDirectionIndex,
		originMeters,
		direction
	)) {
		return CacheTransportRay(originMeters, direction, 0.0, true);
	}
	return CacheTransportRay(
		originMeters,
		direction,
		cacheTopBoundaryDistance(originMeters, direction),
		false
	);
}

CachePositionStencil cacheConstructionPositionStencil(
	vec3 positionMeters
) {
	float atmosphereHeightMeters =
		uCacheGeometryTopRadius - uCacheGeometryBottomRadius;
	float normalizedAltitude = clamp(
		cacheAltitude(positionMeters) / atmosphereHeightMeters,
		0.0,
		0.999999999
	);
	int positionIndex = clamp(
		int(floor(normalizedAltitude * float(CACHE_POSITION_COUNT))),
		0,
		CACHE_POSITION_COUNT - 1
	);
	return CachePositionStencil(
		ivec4(positionIndex, 0, 0, 0),
		vec4(1.0, 0.0, 0.0, 0.0)
	);
}

vec3 cacheConstructionLocalDirection(
	vec3 positionMeters,
	vec3 physicalDirection
) {
	vec3 directionToSource = cacheSourceDirection(positionMeters);
	vec3 xAxis = directionToSource;
	vec3 zAxis = vec3(0.0, 0.0, 1.0)
		- xAxis * dot(vec3(0.0, 0.0, 1.0), xAxis);
	if (length(zAxis) <= 1.0e-10) {
		vec3 fallback = cacheLeastAlignedAxis(xAxis);
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
}`,
			});
		}

		return CacheBuildModules.createBuildModule({
			id: `algorithm32-spherical-earth-${context.kind}-module-v4`,
			owner: 'geometry',
			provides,
			requires: context.kind === 'transport' ? ['lightSource.direction'] : [],
			blocks,
			bindings,
		});
	}
}
