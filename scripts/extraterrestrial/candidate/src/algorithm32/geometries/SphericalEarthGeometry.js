import * as THREE from 'three';

import ExactSphereGroundObject from '../three/ExactSphereGroundObject.js';
import { createSkyIlluminanceProbePlan } from './SkyIlluminanceProbePlan.js';
import {
	createShaderBindingRequirement,
	createShaderContribution,
	createShaderSourceBlock,
	createShaderUniformDescriptor,
	formatShaderFloat,
	formatShaderFloatArray,
	formatShaderVec3,
} from '../shader/shaderContribution.js';
import {
	directionTuple,
	normalizeDirection,
	positionInMeters,
	positionToMeters,
	scenePositionInUnits,
	sceneScaleFromRequest,
	threeVectorTuple,
} from './geometryCoordinates.js';
import {
	clamp,
	displayRgbaOrNull,
	geometryEndpointShadowRequestOrNull,
	optionalDistanceToMeters,
	optionalString,
	positiveDistanceMetersOrDefault,
	positiveIntegerOrDefault,
	sourcePathLimitDistanceToMeters,
	stringOrDefault,
	visualMaterialLightingOrDefault,
} from './geometryRequestNormalization.js';
import DistanceMath from '../utils/DistanceMath.js';
import { finiteNumberOrDefault } from '../utils/numericValues.js';
import SceneMath from '../utils/SceneMath.js';
import VectorMath from '../utils/VectorMath.js';
import {
	CUBED_SPHERE_W27_UNIT_VECTORS,
	FIBONACCI_34_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_NODES,
	createCubedSphereW27DirectionStencil,
} from '../domains/index.js';
import {
	createCacheBuildModule,
	createCacheData,
} from '../caches/gpu/cacheBuildContracts.js';
import {
	NATIVE_15_SPECTRAL_CHANNEL_COUNT,
} from '../profiles/native-15-profile.js';
import {
	localW27Direction,
	physicalFibonacciDirection,
	physicalW27Direction,
} from './scattering-cache-direction-frames.js';
import {
	SPHERICAL_GEOMETRY_CACHE_SYMBOLS_BY_PASS,
	SPHERICAL_GEOMETRY_GROUND_REFLECTION_SYMBOL,
	SPHERICAL_GROUND_BOUNDARY_ROUNDOFF_ULPS,
} from './consts.js';
import SphericalCelestialContributionDomain from './SphericalCelestialContributionDomain.js';
import { PrimaryCelestialCache } from '../caches/celestial/PrimaryCelestialCache.js';
import { PrimaryCelestialGpuCacheController } from '../caches/celestial/PrimaryCelestialGpuCacheController.js';
import { CpuStarPointSetCache } from '../caches/celestial/CpuStarPointSetCache.js';
import { TiledStarPointSetCache } from '../caches/celestial/TiledStarPointSetCache.js';
import { TiledStarPointSetGpuCacheController } from '../caches/celestial/TiledStarPointSetGpuCacheController.js';

const IDENTITY_MATRIX4 = [
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0,
	0, 0, 0, 1,
];
const MODEL_SPACE_SCENE_FRAME = {
	kind: 'model-space',
	up: [0, 1, 0],
	right: [1, 0, 0],
	forward: [0, 0, 1],
};

/**
 * Resolve a positive finite value with fallback.
 *
 * @param {unknown} value - Supplies candidate value.
 * @param {number} fallback - Supplies fallback value.
 * @returns {number} Positive finite value.
 */
function positiveFiniteOrDefault(value, fallback) {
	if (value === undefined) {
		return fallback;
	}

	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
		throw new RangeError('groundVisualMesh.xExtent must be positive and finite.');
	}

	return value;
}

/**
 * Normalize one optional scene distance at its request boundary.
 *
 * @param {unknown} value - Supplies the optional distance.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {SceneDistance | undefined} The accepted distance or undefined.
 */
function optionalSceneDistance(value, label) {
	if (value === undefined) {
		return undefined;
	}
	SceneMath.assertSceneDistance(value, label);
	return /** @type {SceneDistance} */ (value);
}

/**
 * Create an observer-local frame from the observer up direction.
 *
 * @param {UnitVector3} observerUpDirection - Supplies observer up.
 * @returns {object} The frame descriptor.
 */
function makeObserverLocalSceneFrame(observerUpDirection) {
	const reference = /** @type {UnitVector3} */ (
		Math.abs(VectorMath.dot(observerUpDirection, [0, 0, 1])) < 0.95
			? [0, 0, 1]
			: [0, 1, 0]
	);
	const tangentVector = VectorMath.normalize(
		VectorMath.add(reference, VectorMath.scale(observerUpDirection, -VectorMath.dot(reference, observerUpDirection))));
	const tangent = /** @type {UnitVector3} */ ([
		tangentVector[0],
		tangentVector[1],
		tangentVector[2],
	]);
	const rightVector = VectorMath.normalize(VectorMath.cross(tangent, observerUpDirection));
	const forwardVector = VectorMath.scale(tangent, -1);

	return {
		kind: 'observer-local',
		up: observerUpDirection,
		right: /** @type {UnitVector3} */ [rightVector[0], rightVector[1], rightVector[2]],
		forward: /** @type {UnitVector3} */ [forwardVector[0], forwardVector[1], forwardVector[2]],
	};
}

/**
 * Normalize the scene-to-model frame used by shader view-ray reconstruction.
 *
 * @param {unknown} sceneFrame - Supplies the configured frame mode.
 * @param {object} observerLocalSceneFrame - Supplies the derived observer-local frame.
 * @returns {object} Return normalized frame facts.
 */
function normalizeSceneFrame(sceneFrame, observerLocalSceneFrame) {
	if (sceneFrame == null) {
		return observerLocalSceneFrame;
	}
	if (typeof sceneFrame !== 'object' || Array.isArray(sceneFrame)) {
		throw new TypeError('SphericalEarthGeometry sceneFrame must be an object.');
	}
	const candidate = /** @type {{ kind?: unknown }} */ (sceneFrame);

	if (candidate.kind === 'observer-local') {
		return observerLocalSceneFrame;
	}

	if (candidate.kind === 'model-space') {
		return MODEL_SPACE_SCENE_FRAME;
	}

	throw new RangeError('SphericalEarthGeometry sceneFrame.kind must be "observer-local" or "model-space".');
}

/**
 * Project a scene point radially to a sphere surface.
 *
 * @param {readonly number[]} point - Supplies scene point.
 * @param {readonly number[]} center - Supplies sphere center.
 * @param {number} radius - Supplies sphere radius.
 * @param {readonly number[]} fallbackDirection - Supplies
 * fallback surface normal when point equals center.
 * @returns {readonly [number, number, number]} Surface point in scene units.
 */
function projectScenePointToSphereSurface(point, center, radius, fallbackDirection) {
	const offset = VectorMath.subtract(point, center);
	const normal = VectorMath.length(offset) > Number.EPSILON
		? VectorMath.normalize(offset)
		: normalizeDirection(fallbackDirection, 'Ground projection fallback direction');

	const surface = VectorMath.add(center, VectorMath.scale(normal, radius));
	return [surface[0], surface[1], surface[2]];
}

/**
 * Intersect a scene ray with a scene-unit sphere.
 *
 * @param {readonly number[]} origin - Supplies ray origin.
 * @param {UnitVector3} direction - Supplies normalized ray direction.
 * @param {readonly number[]} center - Supplies sphere center.
 * @param {number} radius - Supplies sphere radius.
 * @returns {{ readonly distance: number, readonly point: readonly [number, number, number] } | null} The
 * nearest non-negative hit.
 */
function intersectSceneRayWithSphere(origin, direction, center, radius) {
	const offset = VectorMath.subtract(origin, center);
	const b = VectorMath.dot(offset, direction);
	const c = VectorMath.dot(offset, offset) - radius ** 2;
	const discriminant = b ** 2 - c;

	if (discriminant < 0) {
		return null;
	}

	const root = Math.sqrt(Math.max(0, discriminant));
	const distances = [-b - root, -b + root]
		.filter((distance) => Number.isFinite(distance) && distance >= -Number.EPSILON)
		.map((distance) => Math.max(0, distance))
		.sort((left, right) => left - right);

	if (distances.length === 0) {
		return null;
	}

	const distance = distances[0];
	const pointVector = VectorMath.addScaled(origin, direction, distance);
	const point = /** @type {readonly [number, number, number]} */ ([
		pointVector[0], pointVector[1], pointVector[2],
	]);

	return { distance, point };
}

/**
 * Decide whether a sphere hit belongs to the point's local ground patch.
 *
 * @param {{ readonly distance: number, readonly point: readonly [number, number, number] }} hit - Supplies the hit.
 * @param {readonly number[]} localSurface - Supplies the local surface point.
 * @param {readonly number[]} centerSceneUnits - Supplies the sphere center.
 * @param {number} maxLocalDistanceSceneUnits - Supplies the local distance limit.
 * @param {number} localNormalDotMin - Supplies the minimum normal dot product.
 * @returns {boolean} True when the hit is local.
 */
function isLocalSphereProjectionHit(
	hit,
	localSurface,
	centerSceneUnits,
	maxLocalDistanceSceneUnits,
	localNormalDotMin,
) {
	if (
		Number.isFinite(maxLocalDistanceSceneUnits)
		&& hit.distance > maxLocalDistanceSceneUnits
	) {
		return false;
	}

	const localNormal = VectorMath.normalize(VectorMath.subtract(localSurface, centerSceneUnits));
	const hitNormal = VectorMath.normalize(VectorMath.subtract(hit.point, centerSceneUnits));

	return VectorMath.dot(localNormal, hitNormal) >= localNormalDotMin;
}

/**
 * Project a scene direction onto the local tangent plane.
 *
 * @param {readonly number[]} direction - Supplies scene direction.
 * @param {readonly number[]} up - Supplies normalized up.
 * @returns {UnitVector3} Tangent direction.
 */
function projectOntoTangentPlane(direction, up) {
	const projected = VectorMath.add(direction, VectorMath.scale(up, -VectorMath.dot(direction, up)));

	if (VectorMath.length(projected) <= Number.EPSILON) {
		throw new RangeError('Ground scene offset axes must not be parallel to observer up.');
	}

	const normalized = VectorMath.normalize(projected);
	return /** @type {UnitVector3} */ [normalized[0], normalized[1], normalized[2]];
}

/**
 * Normalize a non-negative scene distance at its owning boundary.
 *
 * @param {SceneDistance} value - Supplies the scene distance.
 * @param {string} label - Supplies the error label.
 * @returns {number} Distance in scene units.
 */
function sceneDistanceToNonNegativeUnits(value, label) {
	SceneMath.assertSceneDistance(value, label);
	if (value.value < 0) {
		throw new RangeError(`${label} must be non-negative.`);
	}
	return value.value;
}

/**
 * Resolve optional camera position in Algorithm32 meters.
 *
 * @param {GeometrySceneDepthMaxRequest} request - Supplies camera position facts.
 * @param {((point: readonly number[], metersPerSceneUnit: number) =>
 * readonly number[]) | null} [scenePointToModelPosition] - Maps
 * renderer-scene coordinates into model-space meters.
 * @returns {readonly [number, number, number] | null} Camera position in meters.
 */
function cameraPositionMetersOrNull(request, scenePointToModelPosition = null) {
	if (request.cameraPosition !== undefined) {
		return positionToMeters(request.cameraPosition, 'Camera position');
	}

	const scenePosition = request.cameraScenePosition;

	if (scenePosition !== undefined) {
		SceneMath.assertScenePosition(scenePosition, 'cameraScenePosition');
		const sceneScale = sceneScaleFromRequest(request);
		const vector = scenePosition.coordinates;

		if (typeof scenePointToModelPosition === 'function') {
			const mapped = scenePointToModelPosition(vector, sceneScale.value);
			return [mapped[0], mapped[1], mapped[2]];
		}

		return SceneMath.toMetersPosition(scenePosition, sceneScale);
	}

	if (request.camera === undefined) {
		return null;
	}
	const camera = /** @type {{ position?: unknown }} */ (request.camera);

	const sceneScale = sceneScaleFromRequest(request);
	const vector = threeVectorTuple(camera.position, 'Camera position in scene units');

	if (typeof scenePointToModelPosition === 'function') {
		const mapped = scenePointToModelPosition(vector, sceneScale.value);
		return [mapped[0], mapped[1], mapped[2]];
	}

	return [
		vector[0] * sceneScale.value,
		vector[1] * sceneScale.value,
		vector[2] * sceneScale.value,
	];
}

/**
 * Resolve optional endpoint positions in Algorithm32 meters.
 *
 * @param {GeometrySceneDepthMaxRequest} request - Supplies endpoint positions.
 * @param {((point: readonly number[], metersPerSceneUnit: number) =>
 * readonly number[]) | null} [scenePointToModelPosition] - Maps
 * renderer-scene coordinates into model-space meters.
 * @returns {readonly (readonly [number, number, number])[] | null} Endpoint positions.
 */
function endpointPositionMetersListOrNull(request, scenePointToModelPosition = null) {
	if (request.endpointPositions !== undefined) {
		if (!Array.isArray(request.endpointPositions)) {
			throw new TypeError('endpointPositions must be an array when supplied.');
		}
		return request.endpointPositions.map((position) =>
			positionToMeters(position, 'Endpoint position'));
	}

	if (request.endpointPosition !== undefined) {
		return [positionToMeters(request.endpointPosition, 'Endpoint position')];
	}

	if (request.endpointScenePositions !== undefined
		&& !Array.isArray(request.endpointScenePositions)) {
		throw new TypeError('endpointScenePositions must be an array when supplied.');
	}
	const positions = request.endpointScenePositions !== undefined
		? request.endpointScenePositions
		: (request.endpointScenePosition === undefined
			? null
			: [request.endpointScenePosition]);

	if (!positions) {
		return null;
	}

	const sceneScale = sceneScaleFromRequest(request);

	return positions.map((position) => {
		SceneMath.assertScenePosition(position, 'Endpoint scene position');
		const vector = position.coordinates;

		if (typeof scenePointToModelPosition === 'function') {
			const mapped = scenePointToModelPosition(vector, sceneScale.value);
			return [mapped[0], mapped[1], mapped[2]];
		}

		return SceneMath.toMetersPosition(position, sceneScale);
	});
}

/**
 * Resolve optional endpoint extent in Algorithm32 meters.
 *
 * @param {GeometrySceneDepthMaxRequest} request - Supplies endpoint range facts.
 * @param {readonly [number, number, number] | null} cameraPositionMeters - Supplies camera position.
 * @param {((point: readonly number[], metersPerSceneUnit: number) =>
 * readonly number[]) | null} [scenePointToModelPosition] - Maps
 * renderer-scene coordinates into model-space meters.
 * @returns {number | null} Endpoint extent in meters, or null.
 */
function endpointExtentMetersOrNull(request, cameraPositionMeters, scenePointToModelPosition = null) {
	const endpointPositionMeters = endpointPositionMetersListOrNull(request, scenePointToModelPosition);

	if (endpointPositionMeters && cameraPositionMeters) {
		return endpointPositionMeters.reduce((maximum, position) => Math.max(
			maximum,
			VectorMath.distance(cameraPositionMeters, position)), 0,
		);
	}

	if (request.endpointExtent !== undefined) {
		return positiveDistanceMetersOrDefault(request.endpointExtent, 0, 'endpointExtent');
	}

	if (request.endpointSceneExtent === undefined) {
		return null;
	}

	SceneMath.assertSceneDistance(request.endpointSceneExtent, 'endpointSceneExtent');
	const endpointExtentMeters = SceneMath.toMeters(request.endpointSceneExtent, sceneScaleFromRequest(request));
	return endpointExtentMeters > 0 ? endpointExtentMeters : null;
}

/**
 * Resolve the visible top half of a Y-up sphere at a local x/z point.
 *
 * @param {number} x - Supplies local scene x.
 * @param {number} z - Supplies local scene z.
 * @param {number} radiusSceneUnits - Supplies sphere radius in scene units.
 * @param {readonly [number, number, number]} centerSceneUnits - Supplies sphere center in scene units.
 * @returns {number} Surface y in scene units.
 */
function sphereSurfaceYAt(x, z, radiusSceneUnits, centerSceneUnits) {
	const horizontalDistanceSquared = x ** 2 + z ** 2;
	const offset = Math.sqrt(Math.max(0, radiusSceneUnits ** 2 - horizontalDistanceSquared));

	return centerSceneUnits[1] + offset;
}

/**
 * Normalize optional spherical ground visual mesh policy.
 *
 * @param {unknown} value - Supplies visual mesh request.
 * @returns {object} Normalized visual mesh request.
 */
function normalizeGroundVisualMeshRequest(value) {
	if (value === undefined) {
		return { kind: 'sphere' };
	}

	if (typeof value !== 'string'
		&& (value === null || typeof value !== 'object' || Array.isArray(value))) {
		throw new TypeError('groundVisualMesh must be a supported string or object.');
	}
	const candidate = /** @type {{
	 * kind?: unknown,
	 * xExtent?: unknown,
	 * zMin?: unknown,
	 * zMax?: unknown,
	 * surfaceLift?: unknown,
	 * }} */ (typeof value === 'string' ? { kind: value } : value);
	const kind = candidate.kind === undefined ? 'sphere' : candidate.kind;

	if (kind !== 'sphere' && kind !== 'local-spherical-patch') {
		throw new RangeError('groundVisualMesh.kind must be "sphere" or "local-spherical-patch".');
	}
	const xExtent = optionalSceneDistance(candidate.xExtent, 'groundVisualMesh.xExtent');
	const zMin = optionalSceneDistance(candidate.zMin, 'groundVisualMesh.zMin');
	const zMax = optionalSceneDistance(candidate.zMax, 'groundVisualMesh.zMax');
	const surfaceLift = optionalSceneDistance(candidate.surfaceLift, 'groundVisualMesh.surfaceLift');
	if (surfaceLift !== undefined && surfaceLift.value < 0) {
		throw new RangeError('groundVisualMesh.surfaceLift must be non-negative.');
	}

	return {
		kind,
		xExtent,
		zMin,
		zMax,
		surfaceLift,
	};
}

/**
 * Create a local visual patch sampled from the analytic scaled sphere.
 *
 * @param {object} request - Supplies sphere, observer, and segmentation facts.
 * @returns {THREE.BufferGeometry} Local spherical patch geometry.
 */
function createLocalSphericalGroundPatchGeometry(request) {
	const {
		radius,
		widthSegments,
		heightSegments,
		observerAltitude,
		center,
		groundVisualMesh,
	} = request;
	const radiusSceneUnits = radius.value;
	const observerAltitudeSceneUnits = observerAltitude.value;
	const centerSceneUnits = center.coordinates;
	const horizonDistanceSceneUnits = Math.sqrt(Math.max(
		0,
		(radiusSceneUnits + observerAltitudeSceneUnits) ** 2 - radiusSceneUnits ** 2,
	));
	const surfaceLiftSceneUnits = groundVisualMesh.surfaceLift === undefined
		? 0
		: groundVisualMesh.surfaceLift.value;
	const surfaceRadiusSceneUnits = radiusSceneUnits + surfaceLiftSceneUnits;
	const xExtent = positiveFiniteOrDefault(
		groundVisualMesh.xExtent === undefined
			? undefined
			: groundVisualMesh.xExtent.value,
		Math.max(horizonDistanceSceneUnits * 1.2, 40));
	const zMin = groundVisualMesh.zMin === undefined
		? Math.min(-horizonDistanceSceneUnits * 1.8, -80)
		: groundVisualMesh.zMin.value;
	const zMax = groundVisualMesh.zMax === undefined
		? Math.max(horizonDistanceSceneUnits * 0.25, 12)
		: groundVisualMesh.zMax.value;
	const positions = [];
	const indices = [];

	for (let zIndex = 0; zIndex <= heightSegments; zIndex += 1) {
		const zRatio = zIndex / heightSegments;
		const z = zMin + (zMax - zMin) * zRatio;

		for (let xIndex = 0; xIndex <= widthSegments; xIndex += 1) {
			const xRatio = xIndex / widthSegments;
			const x = -xExtent + xExtent * 2 * xRatio;

			positions.push(x, sphereSurfaceYAt(
				x,
				z,
				surfaceRadiusSceneUnits,
				centerSceneUnits,
			), z,
			);
		}
	}

	for (let zIndex = 0; zIndex < heightSegments; zIndex += 1) {
		for (let xIndex = 0; xIndex < widthSegments; xIndex += 1) {
			const a = zIndex * (widthSegments + 1) + xIndex;
			const b = a + 1;
			const c = (zIndex + 1) * (widthSegments + 1) + xIndex;
			const d = c + 1;

			indices.push(a, c, b, b, c, d);
		}
	}

	const geometry = new THREE.BufferGeometry();

	geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	geometry.userData.algorithm32GroundPatch = {
		kind: 'local-spherical-ground-patch',
		surfacePolicy: 'vertices-sampled-from-analytic-scaled-sphere',
		xRange: [SceneMath.inSceneUnits(-xExtent), SceneMath.inSceneUnits(xExtent)],
		zRange: [SceneMath.inSceneUnits(zMin), SceneMath.inSceneUnits(zMax)],
		xSegments: widthSegments,
		zSegments: heightSegments,
		surfaceLift: SceneMath.inSceneUnits(surfaceLiftSceneUnits),
	};

	return geometry;
}

/**
 * Create the visual ground material requested by the integration.
 *
 * @param {GeometryThreeEndpointObjectsRequest} request - Supplies material options.
 * @returns {THREE.Material} The created material.
 */
function createVisualMaterial(request) {
	const displayRgba = displayRgbaOrNull(request.visualMaterialDisplayRgba);
	const lighting = visualMaterialLightingOrDefault(request.visualMaterialLighting);
	const color = finiteNumberOrDefault(
		request.visualMaterialColor,
		0x4fa33d,
		'visualMaterialColor',
	);
	const materialParameters = {
		color: displayRgba
			? new THREE.Color(displayRgba[0] / 255, displayRgba[1] / 255, displayRgba[2] / 255)
			: color,
	};

	if (displayRgba && displayRgba[3] < 255) {
		materialParameters.transparent = true;
		materialParameters.opacity = displayRgba[3] / 255;
	}

	return lighting === 'lambert'
		? new THREE.MeshLambertMaterial(materialParameters)
		: new THREE.MeshBasicMaterial(materialParameters);
}

/**
 * Own spherical atmosphere geometry for view rays, source paths, and cache
 * coordinates.
 */
export class SphericalEarthGeometry {
	/**
	 * Pack source-local three-component direction rows for scalar R32F data.
	 *
	 * @param {string} id - Supplies the packed-data identity.
	 * @param {string} quantity - Supplies the physical interpretation.
	 * @param {readonly UnitVector3[]} directions - Supplies ordered directions.
	 * @returns {CacheData} The packed scalar rows.
	 */
	_createDirectionCacheData(id, quantity, directions) {
		return createCacheData({
			id,
			quantity,
			units: '1',
			shape: [3, directions.length],
			values: directions.flatMap((direction) => direction),
		});
	}

	/**
	 * Resolve one physical construction position from a native altitude node.
	 *
	 * @param {SphericalEarthGeometryConfig} configuration - Supplies geometry.
	 * @param {number} altitudeMeters - Supplies altitude above ground.
	 * @returns {readonly number[]} The physical position in meters.
	 */
	_cachePositionAtAltitude(configuration, altitudeMeters) {
		return VectorMath.scale(
			configuration.observerUpDirection,
			configuration.bottomRadius.value + altitudeMeters,
		);
	}

	/**
	 * Return the first positive ground intersection, or null when unblocked.
	 *
	 * @param {SphericalEarthGeometryConfig} configuration - Supplies geometry.
	 * @param {readonly number[]} origin - Supplies the physical ray origin.
	 * @param {UnitVector3} direction - Supplies the physical ray direction.
	 * @returns {number | null} The hit distance.
	 */
	_transportGroundDistance(configuration, origin, direction) {
		const radius = VectorMath.length(origin);
		const mu = VectorMath.dot(origin, direction) / radius;
		const bottomRadiusMeters = configuration.bottomRadius.value;
		const discriminant = radius * radius * (mu * mu - 1)
			+ bottomRadiusMeters * bottomRadiusMeters;

		if (mu >= 0 || discriminant < 0) {
			return null;
		}

		const distanceMeters = -radius * mu - Math.sqrt(discriminant);
		return distanceMeters > 0 ? distanceMeters : null;
	}

	/**
	 * Return the selected positive distance to the top atmosphere sphere.
	 *
	 * @param {SphericalEarthGeometryConfig} configuration - Supplies geometry.
	 * @param {readonly number[]} origin - Supplies the physical ray origin.
	 * @param {UnitVector3} direction - Supplies the physical ray direction.
	 * @returns {number} The top-boundary distance.
	 */
	_transportTopDistance(configuration, origin, direction) {
		const radius = VectorMath.length(origin);
		const mu = VectorMath.dot(origin, direction) / radius;
		const topRadiusMeters = configuration.topRadius.value;
		const discriminant = radius * radius * (mu * mu - 1)
			+ topRadiusMeters * topRadiusMeters;

		return Math.max(
			0,
			-radius * mu + Math.sqrt(Math.max(0, discriminant)),
		);
	}

	/**
	 * Resolve the retained containing-altitude-bin construction index.
	 *
	 * @param {SphericalEarthGeometryConfig} configuration - Supplies geometry.
	 * @param {readonly number[]} position - Supplies the physical position.
	 * @param {number} positionCount - Supplies the selected lattice extent.
	 * @returns {number} The construction position index.
	 */
	_transportPositionIndex(
		configuration,
		position,
		positionCount,
	) {
		const altitudeMeters = VectorMath.length(position)
			- configuration.bottomRadius.value;
		const atmosphereHeightMeters = configuration.topRadius.value
			- configuration.bottomRadius.value;
		const normalizedAltitude = clamp(
			altitudeMeters / atmosphereHeightMeters,
			0,
			0.999999999,
		);

		return clamp(
			Math.floor(normalizedAltitude * positionCount),
			0,
			positionCount - 1,
		);
	}

	/**
	 * Build one position-major transport query in Star's selected operation
	 * order.
	 *
	 * @param {object} request - Supplies the physical query.
	 * @returns {readonly object[]} The aggregated active transport taps.
	 */
	_createTransportQueryTaps(request) {
		const {
			atmosphere,
			configuration,
			direction,
			directionStencil,
			intervalCount,
			positionCount,
			positionNode,
		} = request;
		const origin = this._cachePositionAtAltitude(
			configuration,
			positionNode.coordinate.value,
		);
		if (this._transportGroundDistance(
			configuration,
			origin,
			direction,
		) !== null) {
			return [];
		}

		const endDistanceMeters = this._transportTopDistance(
			configuration,
			origin,
			direction,
		);
		const intervalLengthMeters = endDistanceMeters / intervalCount;
		const channelCount = NATIVE_15_SPECTRAL_CHANNEL_COUNT;
		const viewTransmittance = new Float64Array(channelCount).fill(1);
		/** @type {readonly number[] | null} */
		let previousExtinction = null;
		const aggregate = new Map();

		for (let pointIndex = 0;
			pointIndex <= intervalCount;
			pointIndex += 1) {
			const distanceAlongRayMeters = intervalLengthMeters * pointIndex;
			const position = [
				origin[0] + direction[0] * distanceAlongRayMeters,
				origin[1] + direction[1] * distanceAlongRayMeters,
				origin[2] + direction[2] * distanceAlongRayMeters,
			];
			const altitudeMeters = VectorMath.length(position)
				- configuration.bottomRadius.value;
			const medium = atmosphere.sampleMedium({
				altitude: DistanceMath.inMeters(altitudeMeters),
			});
			const extinction = medium.extinction.values;

			if (previousExtinction !== null) {
				for (let wavelengthIndex = 0;
					wavelengthIndex < channelCount;
					wavelengthIndex += 1) {
					viewTransmittance[wavelengthIndex] *= Math.exp(
						-0.5
						* (previousExtinction[wavelengthIndex]
							+ extinction[wavelengthIndex])
						* intervalLengthMeters,
					);
				}
			}

			const sourcePositionIndex =
				this._transportPositionIndex(
					configuration,
					position,
					positionCount,
				);
			const measureMeters = intervalLengthMeters
				* (pointIndex === 0 || pointIndex === intervalCount
					? 0.5
					: 1);

			for (let directionOffset = 0;
				directionOffset < directionStencil.indices.length;
				directionOffset += 1) {
				const sourceDirectionIndex =
					directionStencil.indices[directionOffset];
				const interpolationWeight =
					directionStencil.weights[directionOffset];
				const key = `${sourcePositionIndex}:${sourceDirectionIndex}`;
				let tap = aggregate.get(key);
				if (tap === undefined) {
					tap = {
						sourceDirectionIndex,
						sourcePositionIndex,
						coefficients: new Float64Array(channelCount),
					};
					aggregate.set(key, tap);
				}

				for (let wavelengthIndex = 0;
					wavelengthIndex < channelCount;
					wavelengthIndex += 1) {
					tap.coefficients[wavelengthIndex] +=
						viewTransmittance[wavelengthIndex]
						* measureMeters
						* interpolationWeight;
				}
			}

			previousExtinction = extinction;
		}

		return [...aggregate.values()];
	}

	/**
	 * Identify the established Native48/Fibonacci34/W27 construction lattice.
	 *
	 * @param {CacheConstructionDomains} domains - Supplies executable domains.
	 * @returns {boolean} Whether established default identities must be kept.
	 */
	_usesDefaultConstructionDomains(domains) {
		return domains.positionNodes === NATIVE_48_POSITION_NODES
			&& domains.incomingUnitVectors
				=== FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors
			&& domains.incomingIntegrationWeights
				=== FIBONACCI_34_DIRECTION_DOMAIN_OWNER.integrationWeights
			&& domains.outgoingUnitVectors
				=== CUBED_SPHERE_W27_UNIT_VECTORS;
	}

	/**
	 * Require geometry configuration and source-selected lattice to agree.
	 *
	 * @param {CacheConstructionDomains} domains - Supplies executable domains.
	 * @returns {void}
	 */
	_assertConstructionDomainAlignment(domains) {
		if (domains.positionCount
			!== this._configuration.cacheAltitudeBinCount) {
			throw new RangeError(
				'SphericalEarthGeometry cacheAltitudeBinCount must match the '
					+ 'selected construction position count.',
			);
		}
	}

	/**
	 * Create spherical Earth geometry.
	 *
	 * @param {SphericalEarthGeometryConfig} configuration - Supplies radii,
	 * observer, source, cache, and integration policy.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('SphericalEarthGeometry configuration is required.');
		}

		const {
			bottomRadius,
			topRadius,
			observerHeight = { value: 0, units: 'meters' },
			observerUpDirection = [0, 0, 1],
			sceneFrame = null,
			directionToSource = [0, 0, 1],
			cacheAltitudeBinCount = 1,
			cacheBoundaryAltitude = { value: 2, units: 'meters' },
			sourceTransmittanceIntervalCount = 10,
			celestialContributionDomain = {},
		} = configuration;

		DistanceMath.assertDistance(bottomRadius, 'bottomRadius');
		DistanceMath.assertDistance(topRadius, 'topRadius');
		DistanceMath.assertDistance(observerHeight, 'observerHeight');
		DistanceMath.assertDistance(cacheBoundaryAltitude, 'cacheBoundaryAltitude');
		const bottomRadiusMeters = DistanceMath.toMeters(bottomRadius);
		const topRadiusMeters = DistanceMath.toMeters(topRadius);
		const observerHeightMeters = DistanceMath.toMeters(observerHeight);
		const cacheBoundaryAltitudeMeters = DistanceMath.toMeters(cacheBoundaryAltitude);

		if (bottomRadiusMeters <= 0 || topRadiusMeters <= bottomRadiusMeters) {
			throw new RangeError('SphericalEarthGeometry requires positive radii with top above bottom.');
		}

		if (!Number.isInteger(cacheAltitudeBinCount) || cacheAltitudeBinCount < 1) {
			throw new RangeError('SphericalEarthGeometry cacheAltitudeBinCount must be a positive integer.');
		}

		if (!Number.isInteger(sourceTransmittanceIntervalCount) || sourceTransmittanceIntervalCount < 1) {
			throw new RangeError('SphericalEarthGeometry sourceTransmittanceIntervalCount must be a positive integer.');
		}

		const normalizedObserverUpDirection = normalizeDirection(observerUpDirection, 'observerUpDirection');
		const observerLocalSceneFrame = makeObserverLocalSceneFrame(normalizedObserverUpDirection);

		this._configuration = {
			bottomRadius: DistanceMath.inMeters(bottomRadiusMeters),
			topRadius: DistanceMath.inMeters(topRadiusMeters),
			observerHeight: DistanceMath.inMeters(observerHeightMeters),
			observerUpDirection: normalizedObserverUpDirection,
			observerLocalSceneFrame,
			sceneFrame: normalizeSceneFrame(sceneFrame, observerLocalSceneFrame),
			directionToSource: normalizeDirection(directionToSource, 'directionToSource'),
			cacheAltitudeBinCount,
			cacheBoundaryAltitude: DistanceMath.inMeters(cacheBoundaryAltitudeMeters),
			sourceTransmittanceIntervalCount,
		};
		this._celestialContributionDomain = new SphericalCelestialContributionDomain({
			...celestialContributionDomain,
			bottomRadius: this._configuration.bottomRadius,
			topRadius: this._configuration.topRadius,
		});
	}

	/**
	 * Return immutable geometry configuration.
	 *
	 * @returns {SphericalEarthGeometryConfig} The configuration.
	 */
	get configuration() {
		return this._configuration;
	}

	/**
	 * Identify this configured geometry model instance for compatibility.
	 *
	 * @returns {string} The geometry id.
	 */
	get id() {
		return 'spherical-earth-geometry';
	}

	/**
	 * Provide the camera-independent upper-sky quadrature in this geometry's
	 * observer-local frame. The shader contribution owns the frame transform.
	 *
	 * @returns {ReturnType<typeof createSkyIlluminanceProbePlan>} The probe plan.
	 */
	createSkyIlluminanceProbePlan() {
		return createSkyIlluminanceProbePlan();
	}

	/** Return the geometry-owned first-family celestial domain. */
	describeCelestialContributionDomain() {
		return this._celestialContributionDomain.describe();
	}

	/** Contribute geometry-owned celestial `(h,u)` construction coordinates. */
	createCelestialCacheBuildModule(context) {
		const domain = this.describeCelestialContributionDomain();
		if (context?.domain?.familyId !== domain.familyId) throw new RangeError('Celestial cache build context does not match spherical geometry.');
		const altitudeNodes = createCacheData({ id: 'spherical-celestial-altitude-nodes-v1', quantity: 'altitude-above-ground', units: 'meters', shape: [domain.altitudeNodesMeters.length], values: domain.altitudeNodesMeters });
		const uNodes = createCacheData({ id: 'spherical-celestial-u-nodes-v1', quantity: 'horizon-normalized-direction', units: '1', shape: [domain.uNodes.length], values: domain.uNodes });
		return createCacheBuildModule({
			id: 'spherical-celestial-cache-geometry-module-v1', owner: 'geometry',
			provides: ['geometry.celestialBuildCoordinates'], requires: [],
			bindings: [
				{ spec: { id: 'spherical-celestial-altitudes', name: 'uCelestialAltitudeNodes', kind: 'data', shaderType: 'sampler2D', frequency: 'build' }, value: altitudeNodes },
				{ spec: { id: 'spherical-celestial-u', name: 'uCelestialUNodes', kind: 'data', shaderType: 'sampler2D', frequency: 'build' }, value: uNodes },
				{ spec: { id: 'spherical-celestial-ground-radius', name: 'uCelestialGroundRadius', kind: 'uniform', shaderType: 'float', frequency: 'build' }, value: { value: domain.groundRadiusMeters, units: 'meters' } },
				{ spec: { id: 'spherical-celestial-top-radius', name: 'uCelestialTopRadius', kind: 'uniform', shaderType: 'float', frequency: 'build' }, value: { value: domain.topRadiusMeters, units: 'meters' } },
				{ spec: { id: 'spherical-celestial-path-interval-count', name: 'CELESTIAL_SOURCE_PATH_INTERVAL_COUNT', kind: 'define', shaderType: 'int', frequency: 'build' }, value: this._configuration.sourceTransmittanceIntervalCount },
			],
			blocks: [{
				id: 'spherical-celestial-cache-coordinate-functions', phase: 'function', order: 0,
				source: `vec3 celestialCachePosition(int positionIndex) {
	float altitudeMeters = texelFetch(uCelestialAltitudeNodes, ivec2(positionIndex, 0), 0).r;
	return vec3(0.0, 0.0, uCelestialGroundRadius + altitudeMeters);
}

vec3 celestialCacheDirection(int positionIndex, int directionIndex) {
	vec3 positionMeters = celestialCachePosition(positionIndex);
	float radiusMeters = length(positionMeters);
	float muHorizon = -sqrt(max(0.0, 1.0 - pow(uCelestialGroundRadius / radiusMeters, 2.0)));
	float u = texelFetch(uCelestialUNodes, ivec2(directionIndex, 0), 0).r;
	float mu = muHorizon + u * (1.0 - muHorizon);
	return vec3(sqrt(max(0.0, 1.0 - mu * mu)), 0.0, mu);
}

float celestialCacheAltitude(vec3 positionMeters) {
	return max(0.0, length(positionMeters) - uCelestialGroundRadius);
}

bool celestialCacheRayBlockedByGround(vec3 positionMeters, vec3 direction) {
	float radiusMeters = length(positionMeters);
	float mu = dot(positionMeters, direction) / radiusMeters;
	float discriminant = radiusMeters * radiusMeters * (mu * mu - 1.0)
		+ uCelestialGroundRadius * uCelestialGroundRadius;
	if (mu >= 0.0 || discriminant < 0.0) return false;
	return -radiusMeters * mu - sqrt(discriminant) > 0.0;
}

float celestialCacheSourcePathDistance(vec3 positionMeters, vec3 direction) {
	float radiusMeters = length(positionMeters);
	float mu = dot(positionMeters, direction) / radiusMeters;
	float discriminant = radiusMeters * radiusMeters * (mu * mu - 1.0)
		+ uCelestialTopRadius * uCelestialTopRadius;
	return max(0.0, -radiusMeters * mu + sqrt(max(0.0, discriminant)));
}`,
			}],
		});
	}

	resolveCelestialSourcePlacement(sourceDefinition, placementState, observationState) {
		return this._celestialContributionDomain.resolveCelestialSourcePlacement(sourceDefinition, placementState, observationState);
	}

	resolveCelestialBuildSample(fieldCoordinate, sourceRecord) {
		return this._celestialContributionDomain.resolveCelestialBuildSample(fieldCoordinate, sourceRecord);
	}

	resolveCelestialReceiverStencil(receiver) {
		return this._celestialContributionDomain.resolveCelestialReceiverStencil(receiver);
	}

	resolveCelestialDirectionStencil(receiver, directionToSource) {
		return this._celestialContributionDomain.resolveCelestialDirectionStencil(receiver, directionToSource);
	}

	prepareCelestialContributionQuery(generationDescriptor, sourceDefinitions, placementStates, observationState) {
		return this._celestialContributionDomain.prepareCelestialContributionQuery(generationDescriptor, sourceDefinitions, placementStates, observationState);
	}

	createCelestialContributionCacheController(request) {
		return this._celestialContributionDomain.createCelestialContributionCacheController(request);
	}

	/** Construct the first-family source assembly at the geometry boundary. */
	createPrimaryCelestialCache({ atmosphere, sources }) {
		return new PrimaryCelestialCache({ geometry: this, atmosphere, sources });
	}

	/** Create the geometry-owned GPU controller for a primary celestial field. */
	createPrimaryCelestialGpuCacheController({ backend, scheduler = undefined }) {
		return new PrimaryCelestialGpuCacheController({ backend, scheduler });
	}

	/** Construct the source-owned stellar transport members in this geometry's cache domain. */
	createStellarPointSetCache({ atmosphere, source }) {
		if (!source || typeof source.createTransportMembers !== 'function') throw new TypeError('Spherical stellar cache requires a packet-owning source.');
		return new CpuStarPointSetCache({ geometry: this, atmosphere, members: source.createTransportMembers() });
	}

	/** Pack this geometry's stellar point-set field into its bounded tiled representation. */
	createTiledStellarPointSetCache({ source, pointCache }) {
		return new TiledStarPointSetCache({ source, pointCache });
	}

	/** Create the geometry-owned GPU controller for the bounded stellar point-set field. */
	createStellarPointSetGpuCacheController({ backend, scheduler = undefined }) {
		return new TiledStarPointSetGpuCacheController({ backend, scheduler });
	}

	/**
	 * Return a serializable geometry descriptor.
	 *
	 * @returns {object} The geometry descriptor.
	 */
	describe() {
		return {
			kind: 'spherical-earth-geometry',
			bottomRadius: this._configuration.bottomRadius,
			topRadius: this._configuration.topRadius,
			observerHeight: this._configuration.observerHeight,
			directionToSource: this._configuration.directionToSource,
			cacheAltitudeBinCount: this._configuration.cacheAltitudeBinCount,
			cacheBoundaryAltitude: this._configuration.cacheBoundaryAltitude,
			sourceTransmittanceIntervalCount: this._configuration.sourceTransmittanceIntervalCount,
			observerLocalSceneFrame: this._configuration.observerLocalSceneFrame,
			sceneFrame: this._configuration.sceneFrame,
		};
	}

	/**
	 * Build the selected geometry-resolved packed Jk-to-Lk transport data.
	 *
	 * Geometry owns construction rays and interpolation taps, the supplied
	 * atmosphere owns extinction, and the supplied source direction owns the
	 * source-relative frames. The result preserves Star's position-major query
	 * and spectral T * ds * interpolation-coefficient shape while adapting its
	 * RGBA source records to scalar R32F CacheData.
	 *
	 * @param {CacheTransportDataRequest} request - Supplies trusted physical collaborators.
	 * @returns {CacheTransportData} Return reusable packed transport data.
	 */
	createTransportData(request) {
		const domains = request.domains;
		this._assertConstructionDomainAlignment(domains);
		const defaultDomains =
			this._usesDefaultConstructionDomains(domains);
		const physicalDirections = domains.incomingUnitVectors.map(
			(cacheDirection) => physicalFibonacciDirection(
				cacheDirection,
				request.directionToSource,
			),
		);
		const directionStencils = physicalDirections.map((physicalDirection) =>
			domains.resolveOutgoingDirectionStencil(
				localW27Direction(
					physicalDirection,
					request.directionToSource,
				),
			),
		);
		const tapsByQuery = [];

		for (const positionNode of domains.positionNodes) {
			for (let directionIndex = 0;
				directionIndex < physicalDirections.length;
				directionIndex += 1) {
				tapsByQuery.push(
					this._createTransportQueryTaps({
					atmosphere: request.atmosphere,
					configuration: this._configuration,
					direction: physicalDirections[directionIndex],
					directionStencil: directionStencils[directionIndex],
					intervalCount: request.intervalCount,
					positionCount: domains.positionCount,
					positionNode,
					}),
				);
			}
		}

		const queryCount = tapsByQuery.length;
		const tapCount = Math.max(1, ...tapsByQuery.map((taps) => taps.length));
		const channelCount = NATIVE_15_SPECTRAL_CHANNEL_COUNT;
		const sourceValues = new Float32Array(queryCount * tapCount * 3);
		const coefficientValues = new Float32Array(
			queryCount * tapCount * channelCount,
		);

		for (let queryIndex = 0; queryIndex < queryCount; queryIndex += 1) {
			const taps = tapsByQuery[queryIndex];
			for (let tapIndex = 0; tapIndex < taps.length; tapIndex += 1) {
				const tap = taps[tapIndex];
				const sourceOffset = (queryIndex * tapCount + tapIndex) * 3;
				sourceValues[sourceOffset] = tap.sourceDirectionIndex;
				sourceValues[sourceOffset + 1] = tap.sourcePositionIndex;
				sourceValues[sourceOffset + 2] = 1;

				for (let wavelengthIndex = 0;
					wavelengthIndex < channelCount;
					wavelengthIndex += 1) {
					const coefficientOffset =
						(wavelengthIndex * queryCount + queryIndex) * tapCount
						+ tapIndex;
					coefficientValues[coefficientOffset] =
						tap.coefficients[wavelengthIndex];
				}
			}
		}

		return {
			queryCount,
			tapCount,
			sources: createCacheData({
				id: defaultDomains
					? 'algorithm32-spherical-transport-sources-v1'
					: `${domains.id}-spherical-transport-sources-v1`,
				quantity: 'transport-source-address-and-active-flag',
				units: '1',
				shape: [tapCount * 3, queryCount],
				values: sourceValues,
			}),
			coefficients: createCacheData({
				id: defaultDomains
					? 'algorithm32-spherical-transport-coefficients-v1'
					: `${domains.id}-spherical-transport-coefficients-v1`,
				quantity: 'transport-path-coefficient',
				units: 'meters',
				shape: [tapCount, queryCount, channelCount],
				values: coefficientValues,
			}),
		};
	}

	/**
	 * Describe spherical construction coordinates and symbols for one cache
	 * pass without exposing renderer resources.
	 *
	 * @param {CacheBuildContext} context - Supplies the resolved logical pass.
	 * @returns {CacheBuildModule} Return the geometry-owned module.
	 */
	createCacheModule(context) {
		const domains = context.domains;
		this._assertConstructionDomainAlignment(domains);
		const defaultDomains =
			this._usesDefaultConstructionDomains(domains);
		const reflectiveScatter = context.kind === 'scatter'
			&& context.groundReflection !== undefined;
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
		const usesPhysicalDomain = context.kind === 'primary-j1'
			|| context.kind === 'direct-l1'
			|| context.kind === 'scatter';

		if (usesPhysicalDomain) {
			const positionData = createCacheData({
				id: defaultDomains
					? 'algorithm32-spherical-native-48-altitudes-v1'
					: `${domains.id}-spherical-position-altitudes-v1`,
				quantity: 'altitude-above-ground',
				units: 'meters',
				shape: [domains.positionNodes.length],
				values: domains.positionNodes.map((node) =>
					DistanceMath.toMeters(node.coordinate)),
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
			bindings.push(.../** @type {CacheBinding[]} */ ([
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
			]));
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
	float mu = dot(positionMeters, direction) / radiusMeters;
	float discriminant = radiusMeters * radiusMeters * (mu * mu - 1.0)
		+ uCacheGeometryBottomRadius * uCacheGeometryBottomRadius;
	if (mu >= 0.0 || discriminant < 0.0) return false;
	return -radiusMeters * mu - sqrt(discriminant) > 0.0;
}

float cacheTopBoundaryDistance(vec3 positionMeters, vec3 direction) {
	float radiusMeters = length(positionMeters);
	float mu = dot(positionMeters, direction) / radiusMeters;
	float discriminant = radiusMeters * radiusMeters * (mu * mu - 1.0)
		+ uCacheGeometryTopRadius * uCacheGeometryTopRadius;
	return max(0.0, -radiusMeters * mu + sqrt(max(0.0, discriminant)));
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
	out vec3 groundPositionMeters,
	out vec3 groundNormal,
	out float groundDistanceMeters,
	out ivec4 groundConstructionPositionIndices,
	out vec4 groundConstructionPositionWeights
) {
	float radiusMeters = length(positionMeters);
	float heightMeters = max(
		0.0,
		radiusMeters - uCacheGeometryBottomRadius
	);
	float halfB = dot(positionMeters, direction);
	float c = heightMeters
		* (radiusMeters + uCacheGeometryBottomRadius);
	float discriminant = halfB * halfB - c;
	if (halfB >= 0.0 || discriminant < 0.0) return false;

	float denominator = -halfB + sqrt(max(0.0, discriminant));
	groundDistanceMeters = denominator == 0.0
		? 0.0
		: max(0.0, c / denominator);
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

		if (context.kind === 'primary-j1'
			|| context.kind === 'direct-l1'
			|| context.kind === 'scatter') {
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
			const outgoingData =
				this._createDirectionCacheData(
				defaultDomains
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

		if (context.kind === 'direct-l1' || context.kind === 'scatter') {
			const incomingData =
				this._createDirectionCacheData(
				defaultDomains
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
}`,
			});
		}

		if (context.kind === 'scatter') {
			const weightData = createCacheData({
				id: defaultDomains
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

		if (context.kind === 'primary-j1'
			|| context.kind === 'direct-l1'
			|| reflectiveScatter) {
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
				value: context.controls.transportIntervalCount,
			});
		}

		if (context.kind === 'transport') {
			const transportData = /** @type {CacheTransportData} */ (context.transportData);
			bindings.push(
				{
					spec: {
						id: 'spherical-geometry-transport-sources',
						name: 'uCacheTransportSources',
						kind: 'data',
						shaderType: 'sampler2D',
						frequency: 'build',
					},
					value: transportData.sources,
				},
				{
					spec: {
						id: 'spherical-geometry-transport-coefficients',
						name: 'uCacheTransportCoefficients',
						kind: 'data',
						shaderType: 'sampler2DArray',
						frequency: 'build',
					},
					value: transportData.coefficients,
				},
				{
					spec: {
						id: 'spherical-geometry-transport-tap-count',
						name: 'CACHE_TRANSPORT_TAP_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'build',
					},
					value: transportData.tapCount,
				},
			);
			blocks.push({
				id: 'spherical-geometry-transport-data',
				phase: 'function',
				order: 0,
				source: `int cacheTransportQueryIndex(
	int outputDirectionIndex,
	int outputPositionIndex
) {
	return outputPositionIndex * CACHE_DIRECTION_COUNT + outputDirectionIndex;
}

ivec3 cacheTransportSource(
	int outputDirectionIndex,
	int outputPositionIndex,
	int tapIndex
) {
	int queryIndex = cacheTransportQueryIndex(
		outputDirectionIndex,
		outputPositionIndex
	);
	int sourceOffset = tapIndex * 3;
	return ivec3(
		int(texelFetch(uCacheTransportSources, ivec2(sourceOffset, queryIndex), 0).r + 0.5),
		int(texelFetch(uCacheTransportSources, ivec2(sourceOffset + 1, queryIndex), 0).r + 0.5),
		int(texelFetch(uCacheTransportSources, ivec2(sourceOffset + 2, queryIndex), 0).r + 0.5)
	);
}

float cacheTransportCoefficient(
	int outputDirectionIndex,
	int outputPositionIndex,
	int tapIndex,
	int wavelengthIndex
) {
	int queryIndex = cacheTransportQueryIndex(
		outputDirectionIndex,
		outputPositionIndex
	);
	return texelFetch(
		uCacheTransportCoefficients,
		ivec3(tapIndex, queryIndex, wavelengthIndex),
		0
	).r;
}`,
			});
		}

		return createCacheBuildModule({
			id: `algorithm32-spherical-earth-${context.kind}-module-v2`,
			owner: 'geometry',
			provides,
			requires: [],
			blocks,
			bindings,
		});
	}

	/**
	 * Convert one Three scene point into spherical model coordinates.
	 *
	 * @param {readonly number[]} vector - Supplies scene coordinates.
	 * @param {number} metersPerSceneUnit - Supplies the accepted scene scale.
	 * @returns {readonly number[]} Return the model position in meters.
	 */
	_scenePointToModelPosition(vector, metersPerSceneUnit) {
		if (this._configuration.sceneFrame.kind === 'model-space') {
			return [
				vector[0] * metersPerSceneUnit,
				vector[1] * metersPerSceneUnit,
				vector[2] * metersPerSceneUnit,
			];
		}

		const frame = this._configuration.sceneFrame;

		return VectorMath.add(
			VectorMath.add(
				VectorMath.scale(frame.up, this._configuration.bottomRadius.value + vector[1] * metersPerSceneUnit),
				VectorMath.scale(frame.right, vector[0] * metersPerSceneUnit)),
			VectorMath.scale(frame.forward, vector[2] * metersPerSceneUnit));
	}

	/**
	 * Convert one Three scene direction into the spherical model frame.
	 *
	 * @param {readonly number[]} vector - Supplies the finite scene direction.
	 * @returns {UnitVector3} Return the normalized model direction.
	 */
	_sceneDirectionToModelDirection(vector) {
		if (this._configuration.sceneFrame.kind === 'model-space') {
			return normalizeDirection(vector, 'Observer-local scene direction');
		}

		const frame = this._configuration.sceneFrame;

		return normalizeDirection(VectorMath.add(
			VectorMath.add(
				VectorMath.scale(frame.up, vector[1]),
				VectorMath.scale(frame.right, vector[0])),
			VectorMath.scale(frame.forward, vector[2])), 'Observer-local scene direction',
		);
	}

	/**
	 * Create the geometry-owned spherical shader contribution.
	 *
	 * @param {Algorithm32ShaderDescriptor} descriptor - Supplies the active descriptor.
	 * @returns {ShaderContribution} Return the geometry contribution.
	 */
	_createShaderContribution(descriptor) {
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
		const cameraGroundRelativePositionMeters = VectorMath.scale(
			observerRadialDirection,
			observerHeightMeters,
		);
		const cachePositionNodesMeters = NATIVE_48_POSITION_NODES.map(
			(node) => node.coordinate.value,
		);
		const celestialDomain = this.describeCelestialContributionDomain();
		const celestialAltitudeNodesMeters = celestialDomain.altitudeNodesMeters;
		const celestialUNodes = celestialDomain.uNodes;

		return createShaderContribution({
			id: 'geometry-spherical-earth',
			owner: 'geometry',
			descriptorFingerprint: descriptor.geometry.fingerprint,
			compatibilityTags: descriptor.geometry.compatibilityTags,
			provides: [
				'geometry.reconstructViewRay',
				'geometry.resolveAtmospherePath',
				'geometry.atmosphereCoordinateTypes',
				'geometry.resolveAtmosphereCoordinate',
				'geometry.scatteringCacheStencilTypes',
				'geometry.resolveScatteringCachePositionStencil',
				'geometry.resolveScatteringCacheDirectionStencil',
				'geometry.celestialCacheStencilTypes',
				'geometry.resolveCelestialCacheStencil',
			],
			requires: [
				'runtime.initialState',
				'runtime.depthTexture',
				'runtime.sceneHitTexture',
				'light.directionToAtmosphericSource',
			],
			uniforms: [
				createShaderUniformDescriptor('uInverseProjectionMatrix', 'mat4', 'geometry.inverseProjectionMatrix', IDENTITY_MATRIX4),
				createShaderUniformDescriptor('uInverseViewMatrix', 'mat4', 'geometry.inverseViewMatrix', IDENTITY_MATRIX4),
				createShaderUniformDescriptor('uCameraWorldPositionMeters', 'vec3', 'geometry.cameraWorldPosition', cameraWorldPositionMeters),
				createShaderUniformDescriptor('uCameraGroundRelativePositionMeters', 'vec3', 'geometry.cameraGroundRelativePosition', cameraGroundRelativePositionMeters),
				createShaderUniformDescriptor('uSceneTerminationMeters', 'float', 'geometry.sceneTermination', 0),
				createShaderUniformDescriptor('uSceneDepthMaxMeters', 'float', 'geometry.sceneDepthMax', topRadiusMeters),
			],
			functions: [
				createShaderSourceBlock('geometry-cache-stencil-types', 'declareTypes', 10, `struct AtmosphereCoordinate {
	float altitudeMeters;
};

struct CachePositionStencil {
	ivec2 indices;
	vec2 weights;
};

struct CacheDirectionStencil {
	ivec4 indices;
	vec4 weights;

};

struct CelestialCacheBilinearStencil {
	ivec2 directionIndices;
	ivec2 positionIndices;
	vec2 directionWeights;
	vec2 positionWeights;
	bool valid;
};`),
				createShaderSourceBlock('geometry-constants', 'declareConstants', 0, `const float GEOMETRY_BOTTOM_RADIUS_METERS = ${formatShaderFloat(bottomRadiusMeters)};
const float GEOMETRY_TOP_RADIUS_METERS = ${formatShaderFloat(topRadiusMeters)};
const float GEOMETRY_CACHE_BOUNDARY_ALTITUDE_METERS = ${formatShaderFloat(cacheBoundaryAltitudeMeters)};
const int GEOMETRY_CACHE_POSITION_COUNT = ${cachePositionNodesMeters.length};
const float GEOMETRY_CACHE_POSITION_NODES_METERS[${cachePositionNodesMeters.length}] = float[${cachePositionNodesMeters.length}](${formatShaderFloatArray(cachePositionNodesMeters)});
const vec3 GEOMETRY_CACHE_RADIAL_DIRECTION = ${formatShaderVec3(observerRadialDirection)};
const vec3 GEOMETRY_OBSERVER_UP_DIRECTION = ${formatShaderVec3(frame.up)};
const vec3 GEOMETRY_OBSERVER_RIGHT_DIRECTION = ${formatShaderVec3(frame.right)};
const vec3 GEOMETRY_OBSERVER_FORWARD_DIRECTION = ${formatShaderVec3(frame.forward)};
const int CELESTIAL_CACHE_POSITION_COUNT = ${celestialAltitudeNodesMeters.length};
const int CELESTIAL_CACHE_DIRECTION_COUNT = ${celestialUNodes.length};
const float CELESTIAL_CACHE_ALTITUDE_NODES_METERS[${celestialAltitudeNodesMeters.length}] = float[${celestialAltitudeNodesMeters.length}](${formatShaderFloatArray(celestialAltitudeNodesMeters)});
const float CELESTIAL_CACHE_U_NODES[${celestialUNodes.length}] = float[${celestialUNodes.length}](${formatShaderFloatArray(celestialUNodes)});`),
				createShaderSourceBlock('geometry-reconstruct-helper', 'reconstructRay', 0, `ViewRay reconstructViewRay(vec2 uv) {
	vec4 clip = vec4(uv * 2.0 - 1.0, 1.0, 1.0);
	vec4 view = uInverseProjectionMatrix * clip;
	view.xyz /= max(view.w, 0.000001);
	vec3 sceneDirection = normalize((uInverseViewMatrix * vec4(normalize(view.xyz), 0.0)).xyz);
	vec3 direction = normalize(
		GEOMETRY_OBSERVER_RIGHT_DIRECTION * sceneDirection.x
		+ GEOMETRY_OBSERVER_UP_DIRECTION * sceneDirection.y
		+ GEOMETRY_OBSERVER_FORWARD_DIRECTION * sceneDirection.z
	);
	return ViewRay(uCameraWorldPositionMeters, direction);
}`),
				createShaderSourceBlock('geometry-depth-helper', 'resolvePathBounds', 0, `float sceneTerminationMetersFromDepth(float sceneDepth) {
	float decodedTerminationMeters = max(sceneDepth * uSceneDepthMaxMeters, 0.0);
	return uSceneTerminationMeters > 0.0 ? uSceneTerminationMeters : decodedTerminationMeters;
}`),
				createShaderSourceBlock('geometry-path-helper', 'resolvePathBounds', 0, `PathBounds resolveAtmospherePath(ViewRay ray, float sceneTerminationMeters, bool hasSceneEndpoint) {
	float radius = length(ray.originMeters);
	float mu = dot(ray.originMeters, ray.direction) / max(radius, 1.0);
	float topDiscriminant =
		radius * radius * (mu * mu - 1.0)
		+ GEOMETRY_TOP_RADIUS_METERS * GEOMETRY_TOP_RADIUS_METERS;
	if (topDiscriminant < 0.0) {
		return PathBounds(0.0, 0.0, 0.0, false, false, false);
	}
	float atmosphereExitMeters = max(0.0, -radius * mu + sqrt(topDiscriminant));
	float boundaryDistanceMeters = atmosphereExitMeters;
	bool hasGroundEndpoint = false;
	float endDistanceMeters = hasSceneEndpoint ? min(max(sceneTerminationMeters, 0.0), boundaryDistanceMeters) : boundaryDistanceMeters;
	return PathBounds(0.0, max(0.0, endDistanceMeters), sceneTerminationMeters, hasSceneEndpoint, hasGroundEndpoint, true);
}`),
				createShaderSourceBlock('geometry-cache-stencils', 'sampleScatteringCache', 0, `AtmosphereCoordinate resolveAtmosphereCoordinate(ViewRay ray, float distanceMeters) {
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
	float u;
	float v;
	if (faceIndex == 0) {
		denominator = direction.x;
		u = direction.y / denominator;
		v = direction.z / denominator;
	} else if (faceIndex == 1) {
		denominator = -direction.x;
		u = -direction.y / denominator;
		v = direction.z / denominator;
	} else if (faceIndex == 2) {
		denominator = direction.y;
		u = -direction.x / denominator;
		v = direction.z / denominator;
	} else if (faceIndex == 3) {
		denominator = -direction.y;
		u = direction.x / denominator;
		v = direction.z / denominator;
	} else if (faceIndex == 4) {
		denominator = direction.z;
		u = direction.x / denominator;
		v = direction.y / denominator;
	} else {
		denominator = -direction.z;
		u = -direction.x / denominator;
		v = direction.y / denominator;
	}

	float uGrid = clamp((clamp(u, -1.0, 1.0) + 1.0) * 13.0, 0.0, 26.0);
	float vGrid = clamp((clamp(v, -1.0, 1.0) + 1.0) * 13.0, 0.0, 26.0);
	float uNearest = floor(uGrid + 0.5);
	float vNearest = floor(vGrid + 0.5);
	bool uExact = abs(uGrid - uNearest) <= 1.0e-10;
	bool vExact = abs(vGrid - vNearest) <= 1.0e-10;
	int uLower = uExact ? int(uNearest) : int(floor(uGrid));
	int vLower = vExact ? int(vNearest) : int(floor(vGrid));
	int uUpper = uExact ? uLower : min(uLower + 1, 26);
	int vUpper = vExact ? vLower : min(vLower + 1, 26);
	float uFraction = uExact ? 0.0 : uGrid - float(uLower);
	float vFraction = vExact ? 0.0 : vGrid - float(vLower);
	int faceOffset = faceIndex * 729;
	ivec4 indices = ivec4(
		faceOffset + vLower * 27 + uLower,
		faceOffset + vLower * 27 + uUpper,
		faceOffset + vUpper * 27 + uLower,
		faceOffset + vUpper * 27 + uUpper
	);
	vec4 weights = vec4(
		(1.0 - uFraction) * (1.0 - vFraction),
		uFraction * (1.0 - vFraction),
		(1.0 - uFraction) * vFraction,
		uFraction * vFraction
	);
	return CacheDirectionStencil(indices, weights);
}

CelestialCacheBilinearStencil resolveCelestialCacheStencil(
	vec3 receiverPositionMeters,
	vec3 directionToSource
) {
	float radiusMeters = length(receiverPositionMeters);
	float altitudeMeters = radiusMeters - GEOMETRY_BOTTOM_RADIUS_METERS;
	if (radiusMeters <= 0.0 || altitudeMeters < 0.0
		|| altitudeMeters > CELESTIAL_CACHE_ALTITUDE_NODES_METERS[CELESTIAL_CACHE_POSITION_COUNT - 1]) {
		return CelestialCacheBilinearStencil(ivec2(0), ivec2(0), vec2(0.0), vec2(0.0), false);
	}
	float mu = dot(receiverPositionMeters / radiusMeters, normalize(directionToSource));
	float horizonMu = -sqrt(max(0.0, 1.0 - pow(GEOMETRY_BOTTOM_RADIUS_METERS / radiusMeters, 2.0)));
	if (mu <= horizonMu) {
		return CelestialCacheBilinearStencil(ivec2(0), ivec2(0), vec2(0.0), vec2(0.0), false);
	}
	float u = (mu - horizonMu) / max(1.0 - horizonMu, 0.000001);
	if (u < CELESTIAL_CACHE_U_NODES[0] || u > CELESTIAL_CACHE_U_NODES[CELESTIAL_CACHE_DIRECTION_COUNT - 1]) {
		return CelestialCacheBilinearStencil(ivec2(0), ivec2(0), vec2(0.0), vec2(0.0), false);
	}
	int lowerPosition = 0;
	int upperPosition = 0;
	for (int nodeIndex = 1; nodeIndex < CELESTIAL_CACHE_POSITION_COUNT; nodeIndex += 1) {
		if (altitudeMeters > CELESTIAL_CACHE_ALTITUDE_NODES_METERS[nodeIndex]) {
			lowerPosition = nodeIndex;
			upperPosition = nodeIndex;
		} else if (altitudeMeters == CELESTIAL_CACHE_ALTITUDE_NODES_METERS[nodeIndex]) {
			lowerPosition = nodeIndex;
			upperPosition = nodeIndex;
			break;
		} else {
			lowerPosition = nodeIndex - 1;
			upperPosition = nodeIndex;
			break;
		}
	}
	int lowerDirection = 0;
	int upperDirection = 0;
	for (int nodeIndex = 1; nodeIndex < CELESTIAL_CACHE_DIRECTION_COUNT; nodeIndex += 1) {
		if (u > CELESTIAL_CACHE_U_NODES[nodeIndex]) {
			lowerDirection = nodeIndex;
			upperDirection = nodeIndex;
		} else if (u == CELESTIAL_CACHE_U_NODES[nodeIndex]) {
			lowerDirection = nodeIndex;
			upperDirection = nodeIndex;
			break;
		} else {
			lowerDirection = nodeIndex - 1;
			upperDirection = nodeIndex;
			break;
		}
	}
	float positionSpan = CELESTIAL_CACHE_ALTITUDE_NODES_METERS[upperPosition] - CELESTIAL_CACHE_ALTITUDE_NODES_METERS[lowerPosition];
	float directionSpan = CELESTIAL_CACHE_U_NODES[upperDirection] - CELESTIAL_CACHE_U_NODES[lowerDirection];
	float upperPositionWeight = positionSpan == 0.0 ? 0.0 : (altitudeMeters - CELESTIAL_CACHE_ALTITUDE_NODES_METERS[lowerPosition]) / positionSpan;
	float upperDirectionWeight = directionSpan == 0.0 ? 0.0 : (u - CELESTIAL_CACHE_U_NODES[lowerDirection]) / directionSpan;
	return CelestialCacheBilinearStencil(
		ivec2(lowerDirection, upperDirection),
		ivec2(lowerPosition, upperPosition),
		vec2(1.0 - upperDirectionWeight, upperDirectionWeight),
		vec2(1.0 - upperPositionWeight, upperPositionWeight),
		true
	);
}`),
			],
			bindingRequirements: [
				createShaderBindingRequirement(
					'geometry.camera-ground-relative-position',
					'geometry',
					'uniform',
					'frame',
					'geometry.cameraGroundRelativePosition',
					true,
				),
			],
			mainHooks: [
				createShaderSourceBlock('geometry-main-ray', 'reconstructRay', 0, 'state.ray = reconstructViewRay(state.uv);'),
				createShaderSourceBlock('geometry-main-bounds', 'resolvePathBounds', 0, 'state.bounds = resolveAtmospherePath(state.ray, sceneTerminationMetersFromDepth(state.sceneDepth), state.sceneHitMask > 0.5);'),
			],
		});
	}

	/**
	 * Return distance to the top atmosphere sphere.
	 *
	 * @param {Position} origin - Supplies
	 * ray origin.
	 * @param {UnitVector3} direction - Supplies ray direction.
	 * @returns {number} Distance to boundary.
	 */
	distanceToTopAtmosphereBoundary(origin, direction) {
		const originVector = positionToMeters(origin, 'Top boundary origin');
		const directionVector = normalizeDirection(direction, 'Top boundary direction');
		const radius = VectorMath.length(originVector);
		const mu = VectorMath.dot(originVector, directionVector) / radius;
		const discriminant =
			radius * radius * (mu * mu - 1)
			+ this._configuration.topRadius.value * this._configuration.topRadius.value;

		return Math.max(0, -radius * mu + Math.sqrt(Math.max(0, discriminant)));
	}

	/**
	 * Return distance to the ground sphere, if the ray hits it.
	 *
	 * @param {Position} origin - Supplies
	 * ray origin.
	 * @param {UnitVector3} direction - Supplies ray direction.
	 * @returns {number | null} Distance to boundary, or null.
	 */
	distanceToGroundBoundary(origin, direction) {
		const originVector = positionToMeters(origin, 'Ground boundary origin');
		const directionVector = normalizeDirection(direction, 'Ground boundary direction');
		const radius = VectorMath.length(originVector);
		const mu = VectorMath.dot(originVector, directionVector) / radius;
		const discriminant =
			radius * radius * (mu * mu - 1)
			+ this._configuration.bottomRadius.value * this._configuration.bottomRadius.value;

		if (mu >= 0 || discriminant < 0) {
			return null;
		}

		const distance = -radius * mu - Math.sqrt(discriminant);
		const boundaryTolerance = SPHERICAL_GROUND_BOUNDARY_ROUNDOFF_ULPS
			* Number.EPSILON
			* Math.max(1, this._configuration.bottomRadius.value, radius);

		return distance >= -boundaryTolerance ? Math.max(0, distance) : null;
	}

	/**
	 * Resolve the nearest spherical ground hit along a physical ray.
	 *
	 * @param {Ray} ray - Supplies the physical ray.
	 * @returns {GroundIntersection | null} The geometry-owned ground hit, or null.
	 */
	resolveGroundIntersection(ray) {
		const origin = positionToMeters(ray.origin, 'Ground intersection origin');
		const direction = normalizeDirection(ray.direction, 'Ground intersection direction');
		const distance = this.distanceToGroundBoundary(positionInMeters(origin), direction);

		if (distance === null) {
			return null;
		}

		const hitPosition = VectorMath.addScaled(origin, direction, distance);
		const normalVector = VectorMath.normalize(hitPosition);
		const normal = /** @type {UnitVector3} */ ([
			normalVector[0],
			normalVector[1],
			normalVector[2],
		]);

		return {
			position: positionInMeters(hitPosition),
			normal,
			distance: DistanceMath.inMeters(distance),
		};
	}

	/**
	 * Resolve the first spherical atmosphere or ground boundary along a ray.
	 *
	 * @param {readonly number[]} origin - Supplies the normalized ray origin in meters.
	 * @param {UnitVector3} direction - Supplies the normalized ray direction.
	 * @returns {number} Return the non-negative exit distance in meters.
	 */
	_resolveAtmosphereExitDistance(origin, direction) {
		const originPosition = positionInMeters(origin);
		const topDistance = this.distanceToTopAtmosphereBoundary(originPosition, direction);
		const groundDistance = this.distanceToGroundBoundary(originPosition, direction);

		if (groundDistance !== null && groundDistance >= 0 && groundDistance < topDistance) {
			return groundDistance;
		}

		return topDistance;
	}

	/**
	 * Resolve a physical model position at an altitude along observer up.
	 *
	 * @param {number} altitudeMeters - Supplies altitude above ground in meters.
	 * @returns {readonly number[]} Return the model position in meters.
	 */
	_originAtAltitude(altitudeMeters) {
		return VectorMath.scale(
			this._configuration.observerUpDirection,
			this._configuration.bottomRadius.value + altitudeMeters,
		);
	}

	/**
	 * Resolve model-space position into altitude-only atmosphere coordinates.
	 *
	 * @param {Position} position - Supplies
	 * model-space position.
	 * @returns {AtmosphereCoordinate} The atmosphere coordinate.
	 */
	resolveAtmosphereCoordinate(position) {
		const vector = positionToMeters(position, 'Atmosphere position');

		return {
			altitude: DistanceMath.inMeters(VectorMath.length(vector) - this._configuration.bottomRadius.value),
		};
	}

	/**
	 * Reconstruct one executable native construction position along the
	 * geometry-owned observer-up axis.
	 *
	 * @param {PositionDomainNode} positionNode - Supplies the selected altitude node.
	 * @returns {Position} Return the physical construction position.
	 */
	resolveScatteringCacheConstructionPosition(positionNode) {
		return positionInMeters(this._originAtAltitude(
			DistanceMath.toMeters(positionNode.coordinate),
		));
	}

	/**
	 * Express a model-space position relative to the configured observer-side
	 * ground anchor. Keeping this offset small lets the runtime shader recover
	 * spherical altitude without subtracting two Earth-scale float32 radii.
	 *
	 * @param {Position} position - Supplies a model-space position.
	 * @returns {Position} Return the ground-anchor-relative position in meters.
	 */
	resolveGroundRelativePosition(position) {
		const modelPositionMeters = positionToMeters(
			position,
			'Ground-relative model position',
		);
		const groundAnchorMeters = VectorMath.scale(
			this._configuration.observerUpDirection,
			this._configuration.bottomRadius.value,
		);

		return positionInMeters(VectorMath.subtract(
			modelPositionMeters,
			groundAnchorMeters,
		));
	}

	/**
	 * Build trapezoidal atmosphere-path samples over a normalized ray segment.
	 *
	 * @param {{
	 *   readonly origin: readonly [number, number, number],
	 *   readonly direction: UnitVector3,
	 * }} ray - Supplies the normalized physical ray.
	 * @param {number} startDistanceMeters - Supplies the segment start in meters.
	 * @param {number} endDistanceMeters - Supplies the segment end in meters.
	 * @param {number} sampleCount - Supplies the positive interval count.
	 * @returns {readonly AtmospherePathSample[]} Return the weighted path samples.
	 */
	_buildAtmospherePathSamples(ray, startDistanceMeters, endDistanceMeters, sampleCount) {
		if (!Number.isInteger(sampleCount) || sampleCount < 1) {
			throw new RangeError('Atmosphere path sampleCount must be a positive integer.');
		}

		const intervalLengthMeters = (endDistanceMeters - startDistanceMeters) / sampleCount;
		const samples = [];

		for (let pointIndex = 0; pointIndex <= sampleCount; pointIndex += 1) {
			const isEndpoint = pointIndex === 0 || pointIndex === sampleCount;
			const distance = startDistanceMeters + intervalLengthMeters * pointIndex;
			const position = VectorMath.addScaled(ray.origin, ray.direction, distance);

			samples.push({
				atmosphereCoordinate: this.resolveAtmosphereCoordinate(positionInMeters(position)),
				intervalLengthFromPrevious: DistanceMath.inMeters(pointIndex === 0 ? 0 : intervalLengthMeters),
				measure: DistanceMath.inMeters(intervalLengthMeters * (isEndpoint ? 0.5 : 1)),
			});
		}

		return samples;
	}

	/**
	 * Build a zero-length atmosphere path blocked by spherical ground.
	 *
	 * @param {readonly number[]} position - Supplies the physical position in meters.
	 * @returns {AtmospherePath} Return the blocked path.
	 */
	_blockedPath(position) {
		const coordinate = this.resolveAtmosphereCoordinate(positionInMeters(position));

		return {
			start: coordinate,
			end: coordinate,
			length: DistanceMath.inMeters(0),
			samples: [],
			blockedByGround: true,
		};
	}

	/**
	 * Resolve an altitude into a cache bin index.
	 *
	 * @param {number} altitudeMeters - Supplies altitude in meters.
	 * @returns {number} Cache altitude bin index.
	 */
	altitudeToCacheBinIndex(altitudeMeters) {
		const atmosphereHeight = this._configuration.topRadius.value - this._configuration.bottomRadius.value;
		const normalized = clamp(altitudeMeters / atmosphereHeight, 0, 0.999999999);

		return clamp(
			Math.floor(normalized * this._configuration.cacheAltitudeBinCount),
			0,
			this._configuration.cacheAltitudeBinCount - 1,
		);
	}

	/**
	 * Create the geometry-owned spherical shader contribution.
	 *
	 * @param {ShaderContributionRequest} request - Supplies the active shader descriptor.
	 * @returns {ShaderContribution} The geometry shader contribution.
	 */
	createShaderContribution(request) {
		return this._createShaderContribution(request?.descriptor);
	}

	/**
	 * Return the model-space frame descriptor.
	 *
	 * @returns {object} The frame descriptor.
	 */
	getFrameDescriptor() {
		return {
			kind: this._configuration.sceneFrame.kind === 'model-space'
				? 'model-space-spherical-frame'
				: 'observer-local-spherical-frame',
			observerUpDirection: this._configuration.observerUpDirection,
			observerLocalSceneFrame: this._configuration.observerLocalSceneFrame,
			sceneFrame: this._configuration.sceneFrame,
		};
	}

	/**
	 * Resolve a finite view ray segment for atmosphere transport.
	 *
	 * @param {object} [request] - Supplies ray request facts.
	 * @returns {RaySegment} The clipped ray segment.
	 */
	resolveViewRaySegment(request = {}) {
		const originValue = request.origin;
		const origin = originValue === undefined
			? this._originAtAltitude(this._configuration.observerHeight.value)
			: positionToMeters(originValue, 'View ray origin');
		const direction = normalizeDirection(
			request.direction === undefined ? [0, 0, 1] : request.direction,
			'View ray direction',
		);
		const groundBoundaryMode = request.groundBoundaryMode === undefined
			? 'clip'
			: request.groundBoundaryMode;

		if (!['clip', 'scene-hit-owned'].includes(groundBoundaryMode)) {
			throw new RangeError('groundBoundaryMode must be "clip" or "scene-hit-owned".');
		}

		let endDistanceMeters = groundBoundaryMode === 'scene-hit-owned'
			? this.distanceToTopAtmosphereBoundary(positionInMeters(origin), direction)
			: this._resolveAtmosphereExitDistance(origin, direction);
		const requestedEndDistanceMeters = optionalDistanceToMeters(request.endDistance, 'endDistance');

		if (Number.isFinite(requestedEndDistanceMeters)) {
			endDistanceMeters = Math.min(endDistanceMeters, requestedEndDistanceMeters);
		}

		return {
			ray: {
				origin: positionInMeters(origin),
				direction,
			},
			startDistance: DistanceMath.inMeters(0),
			endDistance: DistanceMath.inMeters(Math.max(0, endDistanceMeters)),
		};
	}

	/**
	 * Resolve a model-space ray into an atmosphere path.
	 *
	 * @param {{
	 *   readonly ray: Ray,
	 *   readonly startDistance?: Distance,
	 *   readonly endDistance?: Distance,
	 *   readonly sourcePathLimit?: SourcePathLimit,
	 *   readonly sampleCount?: number,
	 * }} request - Supplies path request facts.
	 * @returns {AtmospherePath} The atmosphere path.
	 */
	resolveAtmospherePath(request) {
		if (!request?.ray) {
			throw new TypeError('Spherical atmosphere path requires ray.');
		}

		const ray = request.ray;
		const origin = positionToMeters(ray.origin, 'Atmosphere path origin');
		const direction = normalizeDirection(ray.direction, 'Atmosphere path direction');
		const startDistanceMeters = optionalDistanceToMeters(request.startDistance, 'startDistance') ?? 0;
		let endDistanceMeters = optionalDistanceToMeters(request.endDistance, 'endDistance');

		if (endDistanceMeters === null) {
			const originPosition = positionInMeters(origin);
			const groundDistance = this.distanceToGroundBoundary(originPosition, direction);

			if (groundDistance !== null && groundDistance >= 0) {
				return this._blockedPath(origin);
			}

			endDistanceMeters = this.distanceToTopAtmosphereBoundary(originPosition, direction);
		}

		const sourceLimitMeters = sourcePathLimitDistanceToMeters(request.sourcePathLimit);
		if (sourceLimitMeters !== null) {
			endDistanceMeters = Math.min(endDistanceMeters, sourceLimitMeters);
		}

		const sampleCount = request.sampleCount === undefined
			? this._configuration.sourceTransmittanceIntervalCount
			: request.sampleCount;
		const samples = this._buildAtmospherePathSamples(
			{ origin, direction },
			startDistanceMeters,
			Math.max(startDistanceMeters, endDistanceMeters),
			sampleCount,
		);
		const start = samples[0]?.atmosphereCoordinate ?? this.resolveAtmosphereCoordinate(positionInMeters(origin));
		const end = samples[samples.length - 1]?.atmosphereCoordinate ?? start;

		return {
			start,
			end,
			length: DistanceMath.inMeters(Math.max(0, endDistanceMeters - startDistanceMeters)),
			samples,
			metadata: {
				startDistance: DistanceMath.inMeters(startDistanceMeters),
				endDistance: DistanceMath.inMeters(endDistanceMeters),
			},
		};
	}

	/**
	 * Resolve a sample point into source-relative facts.
	 *
	 * @param {object} [request] - Supplies position facts.
	 * @returns {SourceRelativePosition} The source-relative packet.
	 */
	resolveSourceRelativePosition(request = {}) {
		if (!request.position) {
			throw new TypeError('resolveSourceRelativePosition requires position.');
		}
		DistanceMath.assertPosition(request.position, 'position');

		const directionToSource = this._configuration.directionToSource;
		const directionFromSourceVector = VectorMath.scale(directionToSource, -1);
		const directionFromSource = /** @type {UnitVector3} */ ([
			directionFromSourceVector[0],
			directionFromSourceVector[1],
			directionFromSourceVector[2],
		]);

		return {
			directionFromSource,
			directionToSource,
			distanceFromSource: null,
		};
	}

	/**
	 * Resolve the selected final-view interpolation over actual physical
	 * altitude nodes.
	 *
	 * This lookup is intentionally separate from the retained construction
	 * lookup below. Cache construction continues to use one containing-bin tap;
	 * only final view sampling blends neighboring stored nodes.
	 *
	 * @param {ScatteringCachePositionStencilRequest} request - Supplies the
	 * physical position and its resolved atmosphere coordinate. This geometry
	 * owns the executable Native-48 nodes.
	 * @returns {ScatteringCachePositionStencil} Return one exact/clamped tap or
	 * two adjacent weighted taps.
	 */
	resolveScatteringCachePositionStencil(request) {
		const nodes = NATIVE_48_POSITION_NODES;
		const altitudeMeters = DistanceMath.toMeters(request.atmosphereCoordinate.altitude);
		const lastIndex = nodes.length - 1;
		if (altitudeMeters < nodes[0].coordinate.value) {
			return { indices: [0], weights: [1] };
		}
		if (altitudeMeters === nodes[0].coordinate.value) {
			return { indices: [0], weights: [1] };
		}
		if (altitudeMeters > nodes[lastIndex].coordinate.value) {
			return { indices: [lastIndex], weights: [1] };
		}
		if (altitudeMeters === nodes[lastIndex].coordinate.value) {
			return { indices: [lastIndex], weights: [1] };
		}

		let lowerIndex = 0;
		let upperIndex = lastIndex;
		while (upperIndex - lowerIndex > 1) {
			const middleIndex = Math.floor((lowerIndex + upperIndex) / 2);
			if (nodes[middleIndex].coordinate.value <= altitudeMeters) {
				lowerIndex = middleIndex;
			} else {
				upperIndex = middleIndex;
			}
		}

		const lowerAltitudeMeters = nodes[lowerIndex].coordinate.value;
		const upperAltitudeMeters = nodes[upperIndex].coordinate.value;
		if (altitudeMeters === lowerAltitudeMeters) {
			return { indices: [lowerIndex], weights: [1] };
		}
		if (altitudeMeters === upperAltitudeMeters) {
			return { indices: [upperIndex], weights: [1] };
		}

		const upperWeight = (altitudeMeters - lowerAltitudeMeters)
			/ (upperAltitudeMeters - lowerAltitudeMeters);

		return {
			indices: [lowerIndex, upperIndex],
			weights: [1 - upperWeight, upperWeight],
		};
	}

	/**
	 * Resolve the retained containing-altitude-bin construction lookup.
	 *
	 * Final view lookup uses the separately declared actual-node interpolation;
	 * recurrence transport must not call that view-only policy.
	 *
	 * @param {ScatteringCachePositionStencilRequest} request - Supplies the
	 * physical position and its resolved atmosphere coordinate.
	 * @returns {ScatteringCachePositionStencil} Return the exact construction tap.
	 */
	resolveScatteringCacheConstructionPositionStencil(request) {
		const altitudeBinIndex = this.altitudeToCacheBinIndex(
			DistanceMath.toMeters(request.atmosphereCoordinate.altitude),
		);

		return {
			indices: [altitudeBinIndex],
			weights: [1],
		};
	}

	/**
	 * Express a physical direction in this geometry's executable W27 frame.
	 *
	 * @param {ScatteringCacheDirectionRequest} request - Supplies the physical
	 * position and outgoing direction.
	 * @returns {UnitVector3} Return the source-local direction.
	 */
	expressScatteringCacheDirection(request) {
		return localW27Direction(
			request.physicalOutgoingDirection,
			this._configuration.directionToSource,
		);
	}

	/**
	 * Resolve a physical outgoing direction through this geometry's executable
	 * source-framed W27 reconstruction.
	 *
	 * @param {ScatteringCacheDirectionRequest} request - Supplies the physical
	 * position and outgoing direction.
	 * @returns {ScatteringCacheDirectionStencil} Return the W27 stencil.
	 */
	resolveScatteringCacheDirectionStencil(request) {
		return createCubedSphereW27DirectionStencil(
			this.expressScatteringCacheDirection(request),
		);
	}

	/**
	 * Express one executable W27 scattering direction in physical model space.
	 *
	 * @param {ScatteringCacheFramedDirectionRequest} request - Supplies the
	 * executable cache direction.
	 * @returns {UnitVector3} Return the physical direction.
	 */
	expressPhysicalScatteringCacheDirection(request) {
		return this.expressPhysicalOutgoingScatteringDirection(
			request.cacheDirection,
		);
	}

	/**
	 * Express one executable incoming-radiance direction in physical space.
	 *
	 * @param {UnitVector3} cacheDirection - Supplies the Fibonacci direction.
	 * @returns {UnitVector3} Return the physical direction.
	 */
	expressPhysicalIncomingRadianceDirection(cacheDirection) {
		return physicalFibonacciDirection(
			cacheDirection,
			this._configuration.directionToSource,
		);
	}

	/**
	 * Express one executable outgoing-scattering direction in physical space.
	 *
	 * @param {UnitVector3} cacheDirection - Supplies the W27 direction.
	 * @returns {UnitVector3} Return the physical direction.
	 */
	expressPhysicalOutgoingScatteringDirection(cacheDirection) {
		return physicalW27Direction(
			cacheDirection,
			this._configuration.directionToSource,
		);
	}

	/**
	 * Map observer-local Three scene point to spherical model-space meters.
	 *
	 * @param {ScenePosition} point - Supplies observer-local point.
	 * @param {object} [request] - Supplies scale facts.
	 * @returns {Position} Model-space position.
	 */
	mapObserverLocalScenePointToModelPosition(point, request = {}) {
		SceneMath.assertScenePosition(point, 'Observer-local scene point');
		const sceneScale = sceneScaleFromRequest(request);

		return positionInMeters(this._scenePointToModelPosition(point.coordinates, sceneScale.value));
	}

	/**
	 * Map observer-local Three scene direction to spherical model-space direction.
	 *
	 * @param {UnitVector3} direction - Supplies observer-local direction.
	 * @returns {UnitVector3} Model-space direction.
	 */
	mapObserverLocalSceneDirectionToModelDirection(direction) {
		const vector = directionTuple(direction, 'Observer-local scene direction');

		return this._sceneDirectionToModelDirection(vector);
	}

	/**
	 * Resolve a cache-owned coordinate into its construction ray.
	 *
	 * @param {CacheBuildCoordinate} coordinate - Supplies cache coordinate.
	 * @returns {RaySegment | null} The ray segment, or null when ground-blocked.
	 */
	resolveCacheBuildRay(coordinate) {
		DistanceMath.assertDistance(coordinate.altitude, 'altitude');
		const altitudeMeters = DistanceMath.toMeters(coordinate.altitude);
		const incomingDirection = coordinate.incomingDirection;

		if (!incomingDirection) {
			throw new TypeError('Cache build coordinate requires altitude and incomingDirection.');
		}

		const origin = this._originAtAltitude(altitudeMeters);
		const direction = normalizeDirection(incomingDirection, 'Cache build incomingDirection');
		const originPosition = positionInMeters(origin);
		const groundDistance = this.distanceToGroundBoundary(originPosition, direction);

		if (groundDistance !== null && groundDistance >= 0) {
			return null;
		}

		return {
			ray: { origin: originPosition, direction },
			startDistance: DistanceMath.inMeters(0),
			endDistance: DistanceMath.inMeters(this.distanceToTopAtmosphereBoundary(originPosition, direction)),
		};
	}

	/**
	 * Map an app-authored ground offset to the configured Three scene point.
	 *
	 * The input offset is expressed in the active Three scene's horizontal
	 * ground plane as `[x, z]`. Spherical geometry owns the projection from
	 * that tangent-plane offset onto the curved ground surface and applies
	 * height along the normalized local surface normal.
	 *
	 * @param {ScenePosition} offset - Supplies horizontal scene offset.
	 * @param {object} [request] - Supplies scene scale and optional height.
	 * @returns {ScenePosition} Configured Three scene point.
	 */
	mapGroundOffsetToScenePoint(offset, request = {}) {
		SceneMath.assertScenePosition(offset, 'Ground scene offset');
		const vector = offset.coordinates;
		const sceneScale = sceneScaleFromRequest(request);
		const metersPerSceneUnit = sceneScale.value;
		const heightAboveGround = request.heightAboveGround === undefined
			? SceneMath.inSceneUnits(0)
			: request.heightAboveGround;
		SceneMath.assertSceneDistance(heightAboveGround, 'heightAboveGround');
		const heightAboveGroundSceneUnits = heightAboveGround.value;
		const radiusSceneUnits = this._configuration.bottomRadius.value / metersPerSceneUnit;
		const centerSceneUnits = this._configuration.sceneFrame.kind === 'model-space'
			? [0, 0, 0]
			: [0, -radiusSceneUnits, 0];
		const upSceneUnits = this._configuration.sceneFrame.kind === 'model-space'
			? this._configuration.observerUpDirection
			: [0, 1, 0];
		const rightSceneUnits = projectOntoTangentPlane([1, 0, 0], upSceneUnits);
		const forwardSceneUnits = projectOntoTangentPlane([0, 0, 1], upSceneUnits);
		const horizontalOffset = VectorMath.add(
			VectorMath.scale(rightSceneUnits, vector[0]),
			VectorMath.scale(forwardSceneUnits, vector[2]));
		const horizontalDistanceSquared = VectorMath.dot(horizontalOffset, horizontalOffset);
		const radialDistanceSceneUnits = Math.sqrt(Math.max(
			0,
			radiusSceneUnits ** 2 - horizontalDistanceSquared,
		));
		const surfacePoint = VectorMath.add(
			VectorMath.add(centerSceneUnits, horizontalOffset),
			VectorMath.scale(upSceneUnits, radialDistanceSceneUnits));
		const surfaceNormal = VectorMath.normalize(VectorMath.subtract(surfacePoint, centerSceneUnits));

		return scenePositionInUnits(VectorMath.add(
			surfacePoint,
			VectorMath.scale(surfaceNormal, heightAboveGroundSceneUnits)));
	}

	/**
	 * Project a scene point to the local spherical ground along a scene direction.
	 *
	 * @param {ScenePosition} point - Supplies the scene point to project.
	 * @param {unknown} direction - Supplies the scene projection direction.
	 * @param {object} [request] - Supplies scene scale and locality guards.
	 * @returns {ScenePosition} Projected local ground point in scene units.
	 */
	projectScenePointToGroundAlongDirection(point, direction, request = {}) {
		SceneMath.assertScenePosition(point, 'Ground projection scene point');
		const vector = point.coordinates;
		const directionVector = normalizeDirection(direction, 'Ground projection scene direction');
		const metersPerSceneUnit = sceneScaleFromRequest(request).value;
		const radiusSceneUnits = this._configuration.bottomRadius.value / metersPerSceneUnit;
		const centerSceneUnits = this._configuration.sceneFrame.kind === 'model-space'
			? [0, 0, 0]
			: [0, -radiusSceneUnits, 0];
		const fallbackUpSceneUnits = this._configuration.sceneFrame.kind === 'model-space'
			? this._configuration.observerUpDirection
			: [0, 1, 0];
		const localSurface = projectScenePointToSphereSurface(
			vector,
			centerSceneUnits,
			radiusSceneUnits,
			fallbackUpSceneUnits,
		);
		const offsetFromCenter = VectorMath.subtract(vector, centerSceneUnits);
		const heightAboveSurface = VectorMath.length(offsetFromCenter) - radiusSceneUnits;
		const surfaceTolerance = request.surfaceTolerance === undefined
			? SceneMath.inSceneUnits(1e-6)
			: request.surfaceTolerance;
		SceneMath.assertSceneDistance(surfaceTolerance, 'surfaceTolerance');
		const surfaceToleranceSceneUnits = surfaceTolerance.value;

		if (heightAboveSurface <= surfaceToleranceSceneUnits) {
			return scenePositionInUnits(localSurface);
		}

		const maxLocalDistanceSceneUnits = request.maxLocalDistance === undefined
			? Infinity
			: sceneDistanceToNonNegativeUnits(request.maxLocalDistance, 'maxLocalDistance');
		const localNormalDotMin = clamp(
			finiteNumberOrDefault(request.localNormalDotMin, 0, 'localNormalDotMin'),
			-1,
			1,
		);
		const hit = intersectSceneRayWithSphere(
			vector,
			directionVector,
			centerSceneUnits,
			radiusSceneUnits,
		);

		if (
			hit
		&& isLocalSphereProjectionHit(
			hit,
			localSurface,
			centerSceneUnits,
			maxLocalDistanceSceneUnits,
			localNormalDotMin,
		)
		) {
			return scenePositionInUnits(hit.point);
		}

		return scenePositionInUnits(localSurface);
	}

	/**
	 * Create geometry-owned Three ground endpoint objects.
	 *
	 * @param {GeometryThreeEndpointObjectsRequest} request - Supplies scene
	 * scale, material, segmentation, and metadata overrides.
	 * @returns {GeometryThreeEndpointObjects} The geometry-owned endpoint objects.
	 */
	createThreeEndpointObjects(request = {}) {
		const sceneScale = sceneScaleFromRequest(request);
		const metersPerSceneUnit = sceneScale.value;
		const radiusSceneUnits = this._configuration.bottomRadius.value / metersPerSceneUnit;
		const observerAltitudeSceneUnits = this._configuration.observerHeight.value / metersPerSceneUnit;
		const centerSceneUnits = this._configuration.sceneFrame.kind === 'model-space'
			? [0, 0, 0]
			: [0, -radiusSceneUnits, 0];
		const spectralReferenceId = stringOrDefault(
			request.spectralReferenceId,
			'algorithm32-spherical-ground-object-matte',
			'spectralReferenceId',
		);
		const objectName = optionalString(request.name, 'name');
		const widthSegments = positiveIntegerOrDefault(request.widthSegments, 128, 'widthSegments');
		const heightSegments = positiveIntegerOrDefault(request.heightSegments, 64, 'heightSegments');
		const shadow = geometryEndpointShadowRequestOrNull(request.shadow);
		const groundVisualMesh = normalizeGroundVisualMeshRequest(request.groundVisualMesh);
		const visualGeometry = groundVisualMesh.kind === 'local-spherical-patch'
			? createLocalSphericalGroundPatchGeometry({
				radius: SceneMath.inSceneUnits(radiusSceneUnits),
				widthSegments,
				heightSegments,
				observerAltitude: SceneMath.inSceneUnits(observerAltitudeSceneUnits),
				center: scenePositionInUnits(centerSceneUnits),
				groundVisualMesh,
			})
			: new THREE.SphereGeometry(
				radiusSceneUnits,
				widthSegments,
				heightSegments,
			);
		const visualObject = new THREE.Mesh(
			visualGeometry,
			createVisualMaterial(request));
		const visualPosition = groundVisualMesh.kind === 'local-spherical-patch'
			? [0, 0, 0]
			: centerSceneUnits;
		const visualShape = groundVisualMesh.kind === 'local-spherical-patch'
			? 'local-spherical-patch'
			: 'sphere';
		const raycastObject = new ExactSphereGroundObject({
			radius: SceneMath.inSceneUnits(radiusSceneUnits),
			center: scenePositionInUnits(centerSceneUnits),
			sceneScale,
			spectralReferenceId,
			name: objectName === undefined ? 'spherical-earth-ground-endpoint' : objectName,
		});

		visualObject.name = `${objectName === undefined ? 'spherical-earth-ground' : objectName}-visual`;
		visualObject.position.set(visualPosition[0], visualPosition[1], visualPosition[2]);
		visualObject.userData.algorithm32SceneInput = true;
		visualObject.userData.algorithm32EndpointRole = 'geometry-ground-visual';
		visualObject.userData.endpointKind = 'geometry-ground-boundary';
		visualObject.userData.spectralReferenceId = spectralReferenceId;
		visualObject.userData.sceneScale = sceneScale;
		if (shadow) {
			visualObject.receiveShadow = shadow.receiveShadow;
			visualObject.userData.shadowPolicy = shadow.shadowPolicy;
			visualObject.userData.shadowReceiverPolicy = 'geometry-owned-ground-receives-three-shadow-map';
		}
		visualObject.userData.algorithm32GroundVisualMesh = {
			kind: groundVisualMesh.kind,
			shape: visualShape,
			hitPolicy: 'visual-mesh-not-semantic-hit-authority',
			...(shadow ? { shadowReceiverPolicy: visualObject.userData.shadowReceiverPolicy } : {}),
			...(visualGeometry.userData.algorithm32GroundPatch
				? { groundPatch: visualGeometry.userData.algorithm32GroundPatch }
				: {}),
		};

		return {
			visualObjects: [visualObject],
			raycastObjects: [raycastObject],
			metadata: {
				owner: 'SphericalEarthGeometry',
				endpointKind: 'geometry-ground-boundary',
				shape: visualShape,
				raycastPolicy: 'geometry-owned-exact-sphere-raycast',
				sceneCapturePolicy: 'visual-mesh-raster-depth',
				visualMeshKind: groundVisualMesh.kind,
				sceneFrameKind: this._configuration.sceneFrame.kind,
				bottomRadius: this._configuration.bottomRadius,
				radius: SceneMath.inSceneUnits(radiusSceneUnits),
				center: scenePositionInUnits(centerSceneUnits),
				visualPosition: scenePositionInUnits(visualPosition),
				observerHeight: this._configuration.observerHeight,
				observerAltitude: SceneMath.inSceneUnits(observerAltitudeSceneUnits),
				sceneScale,
				spectralReferenceId,
				widthSegments,
				heightSegments,
				shadow: shadow ? { ...shadow } : null,
				...(visualGeometry.userData.algorithm32GroundPatch
					? { groundPatch: visualGeometry.userData.algorithm32GroundPatch }
					: {}),
			},
		};
	}

	/**
	 * Resolve the scene-depth capture cap for geometry-owned spherical endpoints.
	 *
	 * @param {GeometrySceneDepthMaxRequest} request - Supplies optional
	 * camera position and minimum cap policy.
	 * @returns {Distance} Scene-depth cap.
	 */
	resolveSceneDepthMax(request = {}) {
		const scenePointToModelPosition = (position, metersPerSceneUnit) =>
			this._scenePointToModelPosition(position, metersPerSceneUnit);
		const cameraPositionMeters = cameraPositionMetersOrNull(request, scenePointToModelPosition);
		const observerHeightMeters = cameraPositionMeters
			? Math.max(0, VectorMath.length(cameraPositionMeters) - this._configuration.bottomRadius.value)
			: this._configuration.observerHeight.value;
		const observerRadiusMeters = this._configuration.bottomRadius.value + observerHeightMeters;
		const horizonDistanceMeters = Math.sqrt(Math.max(
			0,
			observerRadiusMeters ** 2 - this._configuration.bottomRadius.value ** 2,
		));
		const endpointExtentMeters = endpointExtentMetersOrNull(
			request,
			cameraPositionMeters,
			scenePointToModelPosition,
		);

		return DistanceMath.inMeters(Math.max(
			positiveDistanceMetersOrDefault(request.minimum, 1, 'minimum'),
			observerHeightMeters,
			horizonDistanceMeters,
			endpointExtentMeters ?? 0,
		));
	}
}
