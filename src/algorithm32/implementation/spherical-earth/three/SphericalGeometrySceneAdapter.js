import * as THREE from 'three';

import DistanceMath from '../../../math/DistanceMath.js';
import ScalarMath from '../../../math/ScalarMath.js';
import SceneMath from '../../../math/SceneMath.js';
import VectorMath from '../../../math/VectorMath.js';
import {ValueValidation} from '../../../validation/ValueValidation.js';
import {GeometryDirections} from '../../../geometry-support/GeometryDirections.js';
import {GeometryVisualRequestValues} from '../../../geometry-support/GeometryVisualRequestValues.js';
import ExactSphereGroundObject from './ExactSphereGroundObject.js';

/** Spherical geometry adaptation for Three scene coordinates, endpoints, and depth bounds. */
export class SphericalGeometrySceneAdapter {
	/**
	 * Creates a spherical Three scene adapter for normalized geometry.
	 *
	 * @param {SphericalEarthGeometryConfiguration} configuration - The normalized spherical geometry configuration.
	 */
	constructor(configuration) {
		this._configuration = configuration;
	}

	/**
	 * Called by local patch construction to resolve a positive finite value with fallback.
	 *
	 * @param {unknown} value - The candidate value.
	 * @param {number} fallback - The fallback value.
	 * @returns {number} - The positive finite value.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_positiveFiniteOrDefault(value, fallback) {
		if (value === undefined) {
			return fallback;
		}

		if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
			throw new RangeError('groundVisualMesh.xExtent must be positive and finite.');
		}

		return value;
	}

	/**
	 * Called by ground-mesh policy acceptance to normalize one optional scene distance. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {unknown} value - The optional distance.
	 * @param {string} label - The diagnostic label.
	 * @returns {SceneDistance | undefined} - The accepted distance or undefined.
	 */
	_optionalSceneDistance(value, label) {
		if (value === undefined) {
			return undefined;
		}
		SceneMath.assertSceneDistance(value, label);
		return /** @type {SceneDistance} */ (value);
	}

	/**
	 * Called by ground projection to project a scene point radially to a sphere surface.
	 *
	 * @param {readonly number[]} point - The scene point.
	 * @param {readonly number[]} center - The sphere center.
	 * @param {number} radius - The sphere radius.
	 * @param {readonly number[]} fallbackDirection - The fallback normal at the center.
	 * @returns {SphericalSceneVector3} - The surface point in scene units.
	 */
	_projectScenePointToSphereSurface(point, center, radius, fallbackDirection) {
		const offset = VectorMath.subtract(point, center);
		const normal =
			VectorMath.length(offset) > Number.EPSILON
				? VectorMath.normalize(offset)
				: GeometryDirections.normalizeDirection(fallbackDirection, 'Ground projection fallback direction');

		const surface = VectorMath.add(center, VectorMath.scale(normal, radius));
		return [surface[0], surface[1], surface[2]];
	}

	/**
	 * Called by ground projection to intersect a scene ray with a scene-unit sphere. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {readonly number[]} origin - The ray origin.
	 * @param {UnitVector3} direction - The normalized ray direction.
	 * @param {readonly number[]} center - The sphere center.
	 * @param {number} radius - The sphere radius.
	 * @returns {SphericalSphereRayHit | null} - The nearest non-negative hit.
	 */
	_intersectSceneRayWithSphere(origin, direction, center, radius) {
		const offset = VectorMath.subtract(origin, center);
		const halfLinearCoefficient = VectorMath.dot(offset, direction);
		const constantTerm = VectorMath.dot(offset, offset) - radius ** 2;
		const discriminant = halfLinearCoefficient ** 2 - constantTerm;

		if (discriminant < 0) {
			return null;
		}

		const root = Math.sqrt(Math.max(0, discriminant));
		const distances = [-halfLinearCoefficient - root, -halfLinearCoefficient + root]
			.filter(
				/**
				 * Called by Array.prototype.filter to test whether one collection value is retained.
				 * @param distance - The distance value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (distance) => Number.isFinite(distance) && distance >= -Number.EPSILON,
			)
			.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param distance - The distance value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (distance) => Math.max(0, distance),
			)
			.sort(
				/**
				 * Called by Array.prototype.sort to compare two collection values.
				 * @param left - The left value accepted by the operation.
				 * @param right - The right value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (left, right) => left - right,
			);

		if (distances.length === 0) {
			return null;
		}

		const distance = distances[0];
		const pointVector = VectorMath.addScaled(origin, direction, distance);
		const point = /** @type {SphericalSceneVector3} */ ([pointVector[0], pointVector[1], pointVector[2]]);

		return {distance, point};
	}

	/**
	 * Called by ground projection to decide whether a sphere hit belongs to the local patch.
	 *
	 * @param {SphericalSphereRayHit} groundIntersection - The sphere hit.
	 * @param {readonly number[]} localSurface - The local surface point.
	 * @param {readonly number[]} centerSceneUnits - The sphere center.
	 * @param {number} maxLocalDistanceSceneUnits - The local distance limit.
	 * @param {number} localNormalDotMin - The minimum normal dot product.
	 * @returns {boolean} - Whether the hit is local.
	 */
	_isLocalSphereProjectionHit(
		groundIntersection,
		localSurface,
		centerSceneUnits,
		maxLocalDistanceSceneUnits,
		localNormalDotMin,
	) {
		if (Number.isFinite(maxLocalDistanceSceneUnits) && groundIntersection.distance > maxLocalDistanceSceneUnits) {
			return false;
		}

		const localNormal = VectorMath.normalize(VectorMath.subtract(localSurface, centerSceneUnits));
		const hitNormal = VectorMath.normalize(VectorMath.subtract(groundIntersection.point, centerSceneUnits));

		return VectorMath.dot(localNormal, hitNormal) >= localNormalDotMin;
	}

	/**
	 * Called by ground-offset mapping to project a direction onto the local tangent plane.
	 *
	 * @param {readonly number[]} direction - The scene direction.
	 * @param {readonly number[]} upDirection - The normalized up direction.
	 * @returns {UnitVector3} - The tangent direction.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_projectOntoTangentPlane(direction, upDirection) {
		const projected = VectorMath.add(
			direction,
			VectorMath.scale(upDirection, -VectorMath.dot(direction, upDirection)),
		);

		if (VectorMath.length(projected) <= Number.EPSILON) {
			throw new RangeError('Ground scene offset axes must not be parallel to observer up.');
		}

		const normalized = VectorMath.normalize(projected);
		return /** @type {UnitVector3} */ [normalized[0], normalized[1], normalized[2]];
	}

	/**
	 * Called by ground projection to normalize a non-negative scene distance.
	 *
	 * @param {SceneDistance} value - The scene distance.
	 * @param {string} label - The error label.
	 * @returns {number} - The distance in scene units.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_sceneDistanceToNonNegativeUnits(value, label) {
		SceneMath.assertSceneDistance(value, label);
		if (value.value < 0) {
			throw new RangeError(`${label} must be non-negative.`);
		}
		return value.value;
	}

	/**
	 * Called by scene-depth resolution to resolve an optional camera position. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {GeometrySceneDepthMaxRequest} request - The camera-position facts.
	 * @param {SphericalScenePointToModelPosition | null} [scenePointToModelPosition] - The scene-to-model mapping.
	 * @returns {SphericalSceneVector3 | null} - The camera position in meters.
	 */
	_cameraPositionMetersOrNull(request, scenePointToModelPosition = null) {
		if (request.cameraPosition !== undefined) {
			return DistanceMath.acceptPositionInMeters(request.cameraPosition, 'Camera position');
		}

		const scenePosition = request.cameraScenePosition;

		if (scenePosition !== undefined) {
			SceneMath.assertScenePosition(scenePosition, 'cameraScenePosition');
			const sceneScale = SceneMath.scaleFromRequest(request);
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
		const camera = /** @type {SphericalThreeCameraCandidate} */ (request.camera);

		const sceneScale = SceneMath.scaleFromRequest(request);
		const vector = GeometryDirections.threeVectorTuple(camera.position, 'Camera position in scene units');

		if (typeof scenePointToModelPosition === 'function') {
			const mapped = scenePointToModelPosition(vector, sceneScale.value);
			return [mapped[0], mapped[1], mapped[2]];
		}

		return [vector[0] * sceneScale.value, vector[1] * sceneScale.value, vector[2] * sceneScale.value];
	}

	/**
	 * Called by scene-depth resolution to resolve optional endpoint positions. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {GeometrySceneDepthMaxRequest} request - The endpoint-position facts.
	 * @param {SphericalScenePointToModelPosition | null} [scenePointToModelPosition] - The scene-to-model mapping.
	 * @returns {readonly SphericalSceneVector3[] | null} - The endpoint positions in meters.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_endpointPositionMetersListOrNull(request, scenePointToModelPosition = null) {
		if (request.endpointPositions !== undefined) {
			if (!Array.isArray(request.endpointPositions)) {
				throw new TypeError('endpointPositions must be an array when supplied.');
			}
			return request.endpointPositions.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param position - The position value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (position) => DistanceMath.acceptPositionInMeters(position, 'Endpoint position'),
			);
		}

		if (request.endpointPosition !== undefined) {
			return [DistanceMath.acceptPositionInMeters(request.endpointPosition, 'Endpoint position')];
		}

		if (request.endpointScenePositions !== undefined && !Array.isArray(request.endpointScenePositions)) {
			throw new TypeError('endpointScenePositions must be an array when supplied.');
		}
		const positions =
			request.endpointScenePositions !== undefined
				? request.endpointScenePositions
				: request.endpointScenePosition === undefined
					? null
					: [request.endpointScenePosition];

		if (!positions) {
			return null;
		}

		const sceneScale = SceneMath.scaleFromRequest(request);

		return positions.map(
			/**
			 * Called by Array.prototype.map to transform one collection value. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
			 * @param position - The position value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (position) => {
				SceneMath.assertScenePosition(position, 'Endpoint scene position');
				const vector = position.coordinates;

				if (typeof scenePointToModelPosition === 'function') {
					const mapped = scenePointToModelPosition(vector, sceneScale.value);
					return [mapped[0], mapped[1], mapped[2]];
				}

				return SceneMath.toMetersPosition(position, sceneScale);
			},
		);
	}

	/**
	 * Called by scene-depth resolution to resolve an optional endpoint extent. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {GeometrySceneDepthMaxRequest} request - The endpoint-range facts.
	 * @param {SphericalSceneVector3 | null} cameraPositionMeters - The camera position.
	 * @param {SphericalScenePointToModelPosition | null} [scenePointToModelPosition] - The scene-to-model mapping.
	 * @returns {number | null} - The endpoint extent in meters, or null.
	 */
	_endpointExtentMetersOrNull(request, cameraPositionMeters, scenePointToModelPosition = null) {
		const endpointPositionMeters = this._endpointPositionMetersListOrNull(request, scenePointToModelPosition);

		if (endpointPositionMeters && cameraPositionMeters) {
			return endpointPositionMeters.reduce(
				/**
				 * Called by Array.prototype.reduce to accumulate one collection value.
				 * @param maximum - The maximum value accepted by the operation.
				 * @param position - The position value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (maximum, position) => Math.max(maximum, VectorMath.distance(cameraPositionMeters, position)),
				0,
			);
		}

		if (request.endpointExtent !== undefined) {
			return DistanceMath.positiveMetersOrDefault(request.endpointExtent, 0, 'endpointExtent');
		}

		if (request.endpointSceneExtent === undefined) {
			return null;
		}

		SceneMath.assertSceneDistance(request.endpointSceneExtent, 'endpointSceneExtent');
		const endpointExtentMeters = SceneMath.toMeters(
			request.endpointSceneExtent,
			SceneMath.scaleFromRequest(request),
		);
		return endpointExtentMeters > 0 ? endpointExtentMeters : null;
	}

	/**
	 * Called by local patch construction to resolve the visible sphere surface height.
	 *
	 * @param {number} x - The local scene x coordinate.
	 * @param {number} z - The local scene z coordinate.
	 * @param {number} radiusSceneUnits - The sphere radius in scene units.
	 * @param {SphericalSceneVector3} centerSceneUnits - The sphere center.
	 * @returns {number} - The surface y coordinate in scene units.
	 */
	_sphereSurfaceYAt(x, z, radiusSceneUnits, centerSceneUnits) {
		const horizontalDistanceSquared = x ** 2 + z ** 2;
		const offset = Math.sqrt(Math.max(0, radiusSceneUnits ** 2 - horizontalDistanceSquared));

		return centerSceneUnits[1] + offset;
	}

	/**
	 * Called by endpoint construction to normalize the spherical ground visual-mesh policy. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {unknown} value - The visual mesh request.
	 * @returns {SphericalGroundVisualMesh} - The normalized visual mesh request.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_normalizeGroundVisualMeshRequest(value) {
		if (value === undefined) {
			return {kind: 'sphere'};
		}

		if (typeof value !== 'string' && (value === null || typeof value !== 'object' || Array.isArray(value))) {
			throw new TypeError('groundVisualMesh must be a supported string or object.');
		}
		const candidate = /** @type {SphericalGroundVisualMeshCandidate} */ (
			typeof value === 'string' ? {kind: value} : value
		);
		const kind = candidate.kind === undefined ? 'sphere' : candidate.kind;

		if (kind !== 'sphere' && kind !== 'local-spherical-patch') {
			throw new RangeError('groundVisualMesh.kind must be "sphere" or "local-spherical-patch".');
		}
		const xExtent = this._optionalSceneDistance(candidate.xExtent, 'groundVisualMesh.xExtent');
		const zMin = this._optionalSceneDistance(candidate.zMin, 'groundVisualMesh.zMin');
		const zMax = this._optionalSceneDistance(candidate.zMax, 'groundVisualMesh.zMax');
		const surfaceLift = this._optionalSceneDistance(candidate.surfaceLift, 'groundVisualMesh.surfaceLift');
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
	 * Called by endpoint construction to create a visual patch sampled from the analytic sphere.
	 *
	 * @param {SphericalLocalGroundPatchRequest} request - The sphere, observer, and segmentation facts.
	 * @returns {THREE.BufferGeometry} - The local spherical patch geometry.
	 */
	_createLocalSphericalGroundPatchGeometry(request) {
		const {radius, widthSegments, heightSegments, observerAltitude, center, groundVisualMesh} = request;
		const radiusSceneUnits = radius.value;
		const observerAltitudeSceneUnits = observerAltitude.value;
		const centerSceneUnits = center.coordinates;
		const horizonDistanceSceneUnits = Math.sqrt(
			Math.max(0, (radiusSceneUnits + observerAltitudeSceneUnits) ** 2 - radiusSceneUnits ** 2),
		);
		const surfaceLiftSceneUnits =
			groundVisualMesh.surfaceLift === undefined ? 0 : groundVisualMesh.surfaceLift.value;
		const surfaceRadiusSceneUnits = radiusSceneUnits + surfaceLiftSceneUnits;
		const xExtent = this._positiveFiniteOrDefault(
			groundVisualMesh.xExtent === undefined ? undefined : groundVisualMesh.xExtent.value,
			Math.max(horizonDistanceSceneUnits * 1.2, 40),
		);
		const zMin =
			groundVisualMesh.zMin === undefined
				? Math.min(-horizonDistanceSceneUnits * 1.8, -80)
				: groundVisualMesh.zMin.value;
		const zMax =
			groundVisualMesh.zMax === undefined
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

				positions.push(x, this._sphereSurfaceYAt(x, z, surfaceRadiusSceneUnits, centerSceneUnits), z);
			}
		}

		for (let zIndex = 0; zIndex < heightSegments; zIndex += 1) {
			for (let xIndex = 0; xIndex < widthSegments; xIndex += 1) {
				const lowerLeftVertexIndex = zIndex * (widthSegments + 1) + xIndex;
				const lowerRightVertexIndex = lowerLeftVertexIndex + 1;
				const upperLeftVertexIndex = (zIndex + 1) * (widthSegments + 1) + xIndex;
				const upperRightVertexIndex = upperLeftVertexIndex + 1;

				indices.push(
					lowerLeftVertexIndex,
					upperLeftVertexIndex,
					lowerRightVertexIndex,
					lowerRightVertexIndex,
					upperLeftVertexIndex,
					upperRightVertexIndex,
				);
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
	 * Called by endpoint construction to create the requested visual ground material. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {GeometryThreeEndpointObjectsRequest} request - The material options.
	 * @returns {THREE.Material} - The created material.
	 */
	_createVisualMaterial(request) {
		const displayRgba = GeometryVisualRequestValues.displayRgbaOrNull(request.visualMaterialDisplayRgba);
		const lighting = GeometryVisualRequestValues.materialLightingOrDefault(request.visualMaterialLighting);
		const color = ValueValidation.finiteNumberOrDefault(
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
	 * Called by scene mapping to convert one Three scene point into model coordinates. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {readonly number[]} vector - The scene coordinates.
	 * @param {number} metersPerSceneUnit - The accepted scene scale.
	 * @returns {readonly number[]} - The model position in meters.
	 */
	_scenePointToModelPosition(vector, metersPerSceneUnit) {
		if (this._configuration.sceneFrame.kind === 'model-space') {
			return [vector[0] * metersPerSceneUnit, vector[1] * metersPerSceneUnit, vector[2] * metersPerSceneUnit];
		}

		const frame = this._configuration.sceneFrame;

		return VectorMath.add(
			VectorMath.add(
				VectorMath.scale(frame.up, this._configuration.bottomRadius.value + vector[1] * metersPerSceneUnit),
				VectorMath.scale(frame.right, vector[0] * metersPerSceneUnit),
			),
			VectorMath.scale(frame.forward, vector[2] * metersPerSceneUnit),
		);
	}

	/**
	 * Called by scene mapping to convert one Three direction into the model frame. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {readonly number[]} vector - The finite scene direction.
	 * @returns {UnitVector3} - The normalized model direction.
	 */
	_sceneDirectionToModelDirection(vector) {
		if (this._configuration.sceneFrame.kind === 'model-space') {
			return GeometryDirections.normalizeDirection(vector, 'Observer-local scene direction');
		}

		const frame = this._configuration.sceneFrame;

		return GeometryDirections.normalizeDirection(
			VectorMath.add(
				VectorMath.add(VectorMath.scale(frame.up, vector[1]), VectorMath.scale(frame.right, vector[0])),
				VectorMath.scale(frame.forward, vector[2]),
			),
			'Observer-local scene direction',
		);
	}

	/**
	 * Call this method to map an observer-local scene point into spherical model space.
	 *
	 * @param {ScenePosition} point - The observer-local point.
	 * @param {GeometrySceneScaleRequest} [request] - The scene-scale facts.
	 * @returns {Position} - The model-space position.
	 */
	mapObserverLocalScenePointToModelPosition(point, request = {}) {
		SceneMath.assertScenePosition(point, 'Observer-local scene point');
		const sceneScale = SceneMath.scaleFromRequest(request);

		return DistanceMath.positionInMeters(this._scenePointToModelPosition(point.coordinates, sceneScale.value));
	}

	/**
	 * Call this method to map an observer-local scene direction into spherical model space.
	 *
	 * @param {UnitVector3} direction - The observer-local direction.
	 * @returns {UnitVector3} - The model-space direction.
	 */
	mapObserverLocalSceneDirectionToModelDirection(direction) {
		const vector = GeometryDirections.directionTuple(direction, 'Observer-local scene direction');

		return this._sceneDirectionToModelDirection(vector);
	}

	/**
	 * Call this method to map an app-authored ground offset into the configured Three scene.
	 *
	 * @param {ScenePosition} offset - The horizontal scene offset.
	 * @param {GeometryGroundOffsetScenePointRequest} [request] - The scene scale and optional height.
	 * @returns {ScenePosition} - The configured Three scene point.
	 */
	mapGroundOffsetToScenePoint(offset, request = {}) {
		SceneMath.assertScenePosition(offset, 'Ground scene offset');
		const vector = offset.coordinates;
		const sceneScale = SceneMath.scaleFromRequest(request);
		const metersPerSceneUnit = sceneScale.value;
		const heightAboveGround =
			request.heightAboveGround === undefined ? SceneMath.inSceneUnits(0) : request.heightAboveGround;
		SceneMath.assertSceneDistance(heightAboveGround, 'heightAboveGround');
		const heightAboveGroundSceneUnits = heightAboveGround.value;
		const radiusSceneUnits = this._configuration.bottomRadius.value / metersPerSceneUnit;
		const centerSceneUnits =
			this._configuration.sceneFrame.kind === 'model-space' ? [0, 0, 0] : [0, -radiusSceneUnits, 0];
		const upSceneUnits =
			this._configuration.sceneFrame.kind === 'model-space' ? this._configuration.observerUpDirection : [0, 1, 0];
		const rightSceneUnits = this._projectOntoTangentPlane([1, 0, 0], upSceneUnits);
		const forwardSceneUnits = this._projectOntoTangentPlane([0, 0, 1], upSceneUnits);
		const horizontalOffset = VectorMath.add(
			VectorMath.scale(rightSceneUnits, vector[0]),
			VectorMath.scale(forwardSceneUnits, vector[2]),
		);
		const horizontalDistanceSquared = VectorMath.dot(horizontalOffset, horizontalOffset);
		const radialDistanceSceneUnits = Math.sqrt(Math.max(0, radiusSceneUnits ** 2 - horizontalDistanceSquared));
		const surfacePoint = VectorMath.add(
			VectorMath.add(centerSceneUnits, horizontalOffset),
			VectorMath.scale(upSceneUnits, radialDistanceSceneUnits),
		);
		const surfaceNormal = VectorMath.normalize(VectorMath.subtract(surfacePoint, centerSceneUnits));

		return SceneMath.positionInSceneUnits(
			VectorMath.add(surfacePoint, VectorMath.scale(surfaceNormal, heightAboveGroundSceneUnits)),
		);
	}

	/**
	 * Call this method to project a scene point to the local spherical ground. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {ScenePosition} point - The scene point to project.
	 * @param {unknown} direction - The scene projection direction.
	 * @param {GeometryGroundProjectionRequest} [request] - The scene scale and locality guards.
	 * @returns {ScenePosition} - The projected local ground point.
	 */
	projectScenePointToGroundAlongDirection(point, direction, request = {}) {
		SceneMath.assertScenePosition(point, 'Ground projection scene point');
		const vector = point.coordinates;
		const directionVector = GeometryDirections.normalizeDirection(direction, 'Ground projection scene direction');
		const metersPerSceneUnit = SceneMath.scaleFromRequest(request).value;
		const radiusSceneUnits = this._configuration.bottomRadius.value / metersPerSceneUnit;
		const centerSceneUnits =
			this._configuration.sceneFrame.kind === 'model-space' ? [0, 0, 0] : [0, -radiusSceneUnits, 0];
		const fallbackUpSceneUnits =
			this._configuration.sceneFrame.kind === 'model-space' ? this._configuration.observerUpDirection : [0, 1, 0];
		const localSurface = this._projectScenePointToSphereSurface(
			vector,
			centerSceneUnits,
			radiusSceneUnits,
			fallbackUpSceneUnits,
		);
		const offsetFromCenter = VectorMath.subtract(vector, centerSceneUnits);
		const heightAboveSurface = VectorMath.length(offsetFromCenter) - radiusSceneUnits;
		const surfaceTolerance =
			request.surfaceTolerance === undefined ? SceneMath.inSceneUnits(1e-6) : request.surfaceTolerance;
		SceneMath.assertSceneDistance(surfaceTolerance, 'surfaceTolerance');
		const surfaceToleranceSceneUnits = surfaceTolerance.value;

		if (heightAboveSurface <= surfaceToleranceSceneUnits) {
			return SceneMath.positionInSceneUnits(localSurface);
		}

		const maxLocalDistanceSceneUnits =
			request.maxLocalDistance === undefined
				? Infinity
				: this._sceneDistanceToNonNegativeUnits(request.maxLocalDistance, 'maxLocalDistance');
		const localNormalDotMin = ScalarMath.clamp(
			ValueValidation.finiteNumberOrDefault(request.localNormalDotMin, 0, 'localNormalDotMin'),
			-1,
			1,
		);
		const groundIntersection = this._intersectSceneRayWithSphere(
			vector,
			directionVector,
			centerSceneUnits,
			radiusSceneUnits,
		);

		if (
			groundIntersection &&
			this._isLocalSphereProjectionHit(
				groundIntersection,
				localSurface,
				centerSceneUnits,
				maxLocalDistanceSceneUnits,
				localNormalDotMin,
			)
		) {
			return SceneMath.positionInSceneUnits(groundIntersection.point);
		}

		return SceneMath.positionInSceneUnits(localSurface);
	}

	/**
	 * Call this method to create geometry-owned Three ground endpoint objects. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {GeometryThreeEndpointObjectsRequest} request - The scene-scale, material, segmentation, and metadata options.
	 * @returns {GeometryThreeEndpointObjects} - The geometry-owned endpoint objects.
	 */
	createThreeEndpointObjects(request = {}) {
		const sceneScale = SceneMath.scaleFromRequest(request);
		const metersPerSceneUnit = sceneScale.value;
		const radiusSceneUnits = this._configuration.bottomRadius.value / metersPerSceneUnit;
		const observerAltitudeSceneUnits = this._configuration.observerHeight.value / metersPerSceneUnit;
		const centerSceneUnits =
			this._configuration.sceneFrame.kind === 'model-space' ? [0, 0, 0] : [0, -radiusSceneUnits, 0];
		const spectralReferenceId = ValueValidation.stringOrDefault(
			request.spectralReferenceId,
			'algorithm32-spherical-ground-object-matte',
			'spectralReferenceId',
		);
		const objectName = ValueValidation.optionalString(request.name, 'name');
		const widthSegments = ValueValidation.positiveIntegerOrDefault(request.widthSegments, 128, 'widthSegments');
		const heightSegments = ValueValidation.positiveIntegerOrDefault(request.heightSegments, 64, 'heightSegments');
		const shadow = GeometryVisualRequestValues.endpointShadowOrNull(request.shadow);
		const groundVisualMesh = this._normalizeGroundVisualMeshRequest(request.groundVisualMesh);
		const visualGeometry =
			groundVisualMesh.kind === 'local-spherical-patch'
				? this._createLocalSphericalGroundPatchGeometry({
						radius: SceneMath.inSceneUnits(radiusSceneUnits),
						widthSegments,
						heightSegments,
						observerAltitude: SceneMath.inSceneUnits(observerAltitudeSceneUnits),
						center: SceneMath.positionInSceneUnits(centerSceneUnits),
						groundVisualMesh,
					})
				: new THREE.SphereGeometry(radiusSceneUnits, widthSegments, heightSegments);
		const visualObject = new THREE.Mesh(visualGeometry, this._createVisualMaterial(request));
		const visualPosition = groundVisualMesh.kind === 'local-spherical-patch' ? [0, 0, 0] : centerSceneUnits;
		const visualShape = groundVisualMesh.kind === 'local-spherical-patch' ? 'local-spherical-patch' : 'sphere';
		const raycastObject = new ExactSphereGroundObject({
			radius: SceneMath.inSceneUnits(radiusSceneUnits),
			center: SceneMath.positionInSceneUnits(centerSceneUnits),
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
			...(shadow ? {shadowReceiverPolicy: visualObject.userData.shadowReceiverPolicy} : {}),
			...(visualGeometry.userData.algorithm32GroundPatch
				? {groundPatch: visualGeometry.userData.algorithm32GroundPatch}
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
				center: SceneMath.positionInSceneUnits(centerSceneUnits),
				visualPosition: SceneMath.positionInSceneUnits(visualPosition),
				observerHeight: this._configuration.observerHeight,
				observerAltitude: SceneMath.inSceneUnits(observerAltitudeSceneUnits),
				sceneScale,
				spectralReferenceId,
				widthSegments,
				heightSegments,
				shadow: shadow ? {...shadow} : null,
				...(visualGeometry.userData.algorithm32GroundPatch
					? {groundPatch: visualGeometry.userData.algorithm32GroundPatch}
					: {}),
			},
		};
	}

	/**
	 * Call this method to resolve the scene-depth cap for spherical endpoints.
	 *
	 * @param {GeometrySceneDepthMaxRequest} request - The optional camera and minimum-cap policy.
	 * @returns {Distance} - The scene-depth cap.
	 */
	resolveSceneDepthMax(request = {}) {
		/**
		 * Called by scene point to model position to scene point to model position.
		 * @param position - The position value accepted by the operation.
		 * @param metersPerSceneUnit - The meters per scene unit value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ const scenePointToModelPosition = (position, metersPerSceneUnit) =>
			this._scenePointToModelPosition(position, metersPerSceneUnit);
		const cameraPositionMeters = this._cameraPositionMetersOrNull(request, scenePointToModelPosition);
		const observerHeightMeters = cameraPositionMeters
			? Math.max(0, VectorMath.length(cameraPositionMeters) - this._configuration.bottomRadius.value)
			: this._configuration.observerHeight.value;
		const observerRadiusMeters = this._configuration.bottomRadius.value + observerHeightMeters;
		const horizonDistanceMeters = Math.sqrt(
			Math.max(0, observerRadiusMeters ** 2 - this._configuration.bottomRadius.value ** 2),
		);
		const endpointExtentMeters = this._endpointExtentMetersOrNull(
			request,
			cameraPositionMeters,
			scenePointToModelPosition,
		);

		return DistanceMath.inMeters(
			Math.max(
				DistanceMath.positiveMetersOrDefault(request.minimum, 1, 'minimum'),
				observerHeightMeters,
				horizonDistanceMeters,
				endpointExtentMeters ?? 0,
			),
		);
	}
}
