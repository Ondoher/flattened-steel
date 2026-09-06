import * as THREE from 'three';

import ExactFlatGroundObject from './ExactFlatGroundObject.js';
import {GeometryDirections} from '../../../geometry-support/GeometryDirections.js';
import {GeometryVisualRequestValues} from '../../../geometry-support/GeometryVisualRequestValues.js';
import DistanceMath from '../../../math/DistanceMath.js';
import SceneMath from '../../../math/SceneMath.js';
import VectorMath from '../../../math/VectorMath.js';
import {ValueValidation} from '../../../validation/ValueValidation.js';

/**
 * Observer-local scene mapping and Three endpoint adaptation for flat geometry.
 */
export class FlatGeometrySceneAdapter {
	/**
	 * Called by FlatGeometrySceneAdapter to resolve a renderable flat-ground extent in meters.
	 *
	 * @param {FlatEarthGeometryConfiguration} configuration - The geometry.
	 * @returns {number} - The full ground width and depth.
	 */
	_flatGroundExtentMeters(configuration) {
		const extentCandidates = [
			configuration.sceneSkyRayLimit?.value,
			configuration.observerCenteredDome?.maxObserverViewRayExtent.value,
			configuration.topAltitude.value * 20,
			10000,
		].filter(
			/**
			 * Called by Array.prototype.filter to test whether one collection value is retained.
			 * @param value - The value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value) => Number.isFinite(value) && value > 0,
		);

		return Math.max(...extentCandidates) * 2;
	}

	/**
	 * Called by FlatGeometrySceneAdapter to resolve an optional camera position in flat model-space meters. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {GeometrySceneDepthMaxRequest} request - The camera facts.
	 * @param {FlatRawVector3} observerPositionMeters - The observer position.
	 * @returns {FlatRawVector3 | null} - The camera position.
	 */
	_cameraPositionMetersOrNull(request, observerPositionMeters) {
		if (request.cameraPosition !== undefined) {
			return DistanceMath.acceptPositionInMeters(request.cameraPosition, 'Camera position');
		}

		const scenePosition = request.cameraScenePosition;
		if (scenePosition !== undefined) {
			SceneMath.assertScenePosition(scenePosition, 'cameraScenePosition');
			const sceneScale = SceneMath.scaleFromRequest(request);
			const vectorMeters = SceneMath.toMetersPosition(scenePosition, sceneScale);

			return [
				observerPositionMeters[0] + vectorMeters[0],
				observerPositionMeters[1] - vectorMeters[2],
				vectorMeters[1],
			];
		}
		if (request.camera === undefined) {
			return null;
		}

		const camera = /** @type {FlatThreeCameraCandidate} */ (request.camera);
		const sceneScale = SceneMath.scaleFromRequest(request);
		const vector = GeometryDirections.threeVectorTuple(camera.position, 'Camera position in scene units');

		return [
			observerPositionMeters[0] + vector[0] * sceneScale.value,
			observerPositionMeters[1] - vector[2] * sceneScale.value,
			vector[1] * sceneScale.value,
		];
	}

	/**
	 * Called by FlatGeometrySceneAdapter to create the visual ground material requested by the integration. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {GeometryThreeEndpointObjectsRequest} request - The options.
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
			side: THREE.DoubleSide,
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
	 * Called by FlatGeometrySceneAdapter to convert one model position into the observer-local Three scene frame.
	 *
	 * @param {FlatRawVector3} position - The physical model position in meters.
	 * @param {number} metersPerSceneUnit - The accepted scene scale.
	 * @returns {FlatRawVector3} - The observer-local scene coordinates.
	 */
	_modelPositionToObserverLocalScenePoint(position, metersPerSceneUnit) {
		const observer = this._configuration.observerPosition.coordinates;

		return [
			(position[0] - observer[0]) / metersPerSceneUnit,
			position[2] / metersPerSceneUnit,
			-(position[1] - observer[1]) / metersPerSceneUnit,
		];
	}

	/**
	 * Creates the flat geometry scene adapter for one normalized configuration.
	 *
	 * @param {FlatEarthGeometryConfiguration} configuration - The normalized flat geometry configuration.
	 */
	constructor(configuration) {
		this._configuration = configuration;
	}

	/**
	 * Call this method to map an observer-local scene point to flat model-space meters.
	 *
	 * @param {ScenePosition} point - The observer-local point.
	 * @param {GeometrySceneScaleRequest} [request] - The scale facts.
	 * @returns {Position} - The model-space position.
	 *
	 */
	mapObserverLocalScenePointToModelPosition(point, request = {}) {
		SceneMath.assertScenePosition(point, 'Observer-local scene point');
		const sceneScale = SceneMath.scaleFromRequest(request);
		const vectorMeters = SceneMath.toMetersPosition(point, sceneScale);
		const observer = this._configuration.observerPosition.coordinates;

		return DistanceMath.positionInMeters([
			observer[0] + vectorMeters[0],
			observer[1] - vectorMeters[2],
			vectorMeters[1],
		]);
	}

	/**
	 * Call this method to map an observer-local scene direction to flat model-space direction.
	 *
	 * @param {UnitVector3} direction - The observer-local direction.
	 * @returns {UnitVector3} - The model-space direction.
	 *
	 */
	mapObserverLocalSceneDirectionToModelDirection(direction) {
		const vector = GeometryDirections.directionTuple(direction, 'Observer-local scene direction');

		return GeometryDirections.normalizeDirection(
			[vector[0], -vector[2], vector[1]],
			'Observer-local scene direction',
		);
	}

	/**
	 * Call this method to map an app-authored ground offset to the configured Three scene point.
	 *
	 * @param {ScenePosition} offset - The horizontal scene offset.
	 * @param {GeometryGroundOffsetScenePointRequest} [request] - The optional height above ground.
	 * @returns {ScenePosition} - The configured Three scene point.
	 *
	 */
	mapGroundOffsetToScenePoint(offset, request = {}) {
		SceneMath.assertScenePosition(offset, 'Ground scene offset');
		const heightAboveGround =
			request.heightAboveGround === undefined ? SceneMath.inSceneUnits(0) : request.heightAboveGround;
		SceneMath.assertSceneDistance(heightAboveGround, 'heightAboveGround');
		const vector = offset.coordinates;
		const heightAboveGroundSceneUnits = heightAboveGround.value;

		return SceneMath.positionInSceneUnits([vector[0], heightAboveGroundSceneUnits, vector[2]]);
	}

	/**
	 * Call this method to project a scene point to the flat ground plane along a scene direction. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {ScenePosition} point - The scene point to project.
	 * @param {unknown} direction - The scene projection direction.
	 * @returns {ScenePosition} - The projected ground point in scene units.
	 */
	projectScenePointToGroundAlongDirection(point, direction) {
		SceneMath.assertScenePosition(point, 'Ground projection scene point');
		const vector = point.coordinates;
		const directionVector = GeometryDirections.normalizeDirection(direction, 'Ground projection scene direction');

		if (Math.abs(directionVector[1]) <= Number.EPSILON) {
			return SceneMath.positionInSceneUnits([vector[0], 0, vector[2]]);
		}

		const distance = -vector[1] / directionVector[1];

		if (!Number.isFinite(distance) || distance < 0) {
			return SceneMath.positionInSceneUnits([vector[0], 0, vector[2]]);
		}

		const projected = VectorMath.addScaled(vector, directionVector, distance);

		return SceneMath.positionInSceneUnits([projected[0], 0, projected[2]]);
	}

	/**
	 * Call this method to map a flat model-space position to an observer-local scene point.
	 *
	 * @param {Position} position - The model-space position.
	 * @param {GeometrySceneScaleRequest} [request] - The scale facts.
	 * @returns {ScenePosition} - The observer-local scene point.
	 *
	 */
	mapModelPositionToObserverLocalScenePoint(position, request = {}) {
		const vector = DistanceMath.acceptPositionInMeters(position, 'Model-space position');
		const sceneScale = SceneMath.scaleFromRequest(request);

		return SceneMath.positionInSceneUnits(this._modelPositionToObserverLocalScenePoint(vector, sceneScale.value));
	}

	/**
	 * Call this method to create geometry-owned Three ground endpoint objects. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {GeometryThreeEndpointObjectsRequest} [request] - The scene
	 * scale, material, segmentation, and metadata overrides.
	 * @returns {GeometryThreeEndpointObjects} - The geometry-owned endpoint objects.
	 */
	createThreeEndpointObjects(request = {}) {
		const sceneScale = SceneMath.scaleFromRequest(request);
		const metersPerSceneUnit = sceneScale.value;
		const groundExtentMeters = DistanceMath.positiveMetersOrDefault(
			request.groundExtent,
			this._flatGroundExtentMeters(this._configuration),
			'groundExtent',
		);
		const widthSceneUnits = groundExtentMeters / metersPerSceneUnit;
		const depthSceneUnits = groundExtentMeters / metersPerSceneUnit;
		const centerSceneUnits = this._modelPositionToObserverLocalScenePoint(
			[
				this._configuration.observerPosition.coordinates[0],
				this._configuration.observerPosition.coordinates[1],
				0,
			],
			metersPerSceneUnit,
		);
		const spectralReferenceId = ValueValidation.stringOrDefault(
			request.spectralReferenceId,
			'algorithm32-flat-ground-object-matte',
			'spectralReferenceId',
		);
		const objectName = ValueValidation.optionalString(request.name, 'name');
		const widthSegments = ValueValidation.positiveIntegerOrDefault(request.widthSegments, 32, 'widthSegments');
		const heightSegments = ValueValidation.positiveIntegerOrDefault(request.heightSegments, 32, 'heightSegments');
		const shadow = GeometryVisualRequestValues.endpointShadowOrNull(request.shadow);
		const visualObject = new THREE.Mesh(
			new THREE.PlaneGeometry(widthSceneUnits, depthSceneUnits, widthSegments, heightSegments),
			this._createVisualMaterial(request),
		);
		const raycastObject = new ExactFlatGroundObject({
			center: SceneMath.positionInSceneUnits(centerSceneUnits),
			width: SceneMath.inSceneUnits(widthSceneUnits),
			depth: SceneMath.inSceneUnits(depthSceneUnits),
			sceneScale,
			spectralReferenceId,
			name: objectName === undefined ? 'flat-earth-ground-endpoint' : objectName,
		});

		visualObject.name = `${objectName === undefined ? 'flat-earth-ground' : objectName}-visual`;
		visualObject.rotation.x = -Math.PI / 2;
		visualObject.position.set(centerSceneUnits[0], centerSceneUnits[1], centerSceneUnits[2]);
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

		return {
			visualObjects: [visualObject],
			raycastObjects: [raycastObject],
			metadata: {
				owner: 'FlatEarthGeometry',
				endpointKind: 'geometry-ground-boundary',
				shape: 'plane',
				groundPlane: 'z-equals-zero',
				groundExtent: DistanceMath.inMeters(groundExtentMeters),
				width: SceneMath.inSceneUnits(widthSceneUnits),
				depth: SceneMath.inSceneUnits(depthSceneUnits),
				center: SceneMath.positionInSceneUnits(centerSceneUnits),
				observerPosition: this._configuration.observerPosition,
				sceneScale,
				spectralReferenceId,
				widthSegments,
				heightSegments,
				shadow: shadow ? {...shadow} : null,
			},
		};
	}

	/**
	 * Call this method to resolve the scene-depth capture cap for geometry-owned flat endpoints.
	 *
	 * @param {GeometrySceneDepthMaxRequest} [request] - The optional
	 * endpoint extent and minimum cap policy.
	 * @returns {Distance} - The scene-depth cap.
	 *
	 */
	resolveSceneDepthMax(request = {}) {
		const groundExtentMeters = DistanceMath.positiveMetersOrDefault(
			request.groundExtent,
			this._flatGroundExtentMeters(this._configuration),
			'groundExtent',
		);
		const halfExtentMeters = groundExtentMeters / 2;
		const observerPositionMeters = this._configuration.observerPosition.coordinates;
		const cameraPositionMeters =
			this._cameraPositionMetersOrNull(request, observerPositionMeters) ?? observerPositionMeters;
		const groundCenterMeters = [observerPositionMeters[0], observerPositionMeters[1], 0];
		const farthestGroundEndpointMeters = Math.max(
			VectorMath.distance(cameraPositionMeters, [
				groundCenterMeters[0] - halfExtentMeters,
				groundCenterMeters[1] - halfExtentMeters,
				groundCenterMeters[2],
			]),
			VectorMath.distance(cameraPositionMeters, [
				groundCenterMeters[0] - halfExtentMeters,
				groundCenterMeters[1] + halfExtentMeters,
				groundCenterMeters[2],
			]),
			VectorMath.distance(cameraPositionMeters, [
				groundCenterMeters[0] + halfExtentMeters,
				groundCenterMeters[1] - halfExtentMeters,
				groundCenterMeters[2],
			]),
			VectorMath.distance(cameraPositionMeters, [
				groundCenterMeters[0] + halfExtentMeters,
				groundCenterMeters[1] + halfExtentMeters,
				groundCenterMeters[2],
			]),
		);

		return DistanceMath.inMeters(
			Math.max(DistanceMath.positiveMetersOrDefault(request.minimum, 1, 'minimum'), farthestGroundEndpointMeters),
		);
	}
}
