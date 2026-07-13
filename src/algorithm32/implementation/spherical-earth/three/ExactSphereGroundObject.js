import * as THREE from 'three';
import SceneMath from '../../../math/SceneMath.js';
import {ValueValidation} from '../../../validation/ValueValidation.js';

/** Object that provides an exact spherical ground endpoint for Three raycasters. */
export default class ExactSphereGroundObject extends THREE.Object3D {
	/**
	 * Creates an exact spherical ground endpoint.
	 *
	 * @param {ExactSphereGroundObjectConfig} configuration - Supplies sphere
	 * radius, scene scale, metadata, and placement.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	constructor(configuration) {
		super();

		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('ExactSphereGroundObject configuration is required.');
		}

		const {radius, center, sceneScale, spectralReferenceId, name = 'exact-sphere-ground-endpoint'} = configuration;

		SceneMath.assertSceneDistance(radius, 'ExactSphereGroundObject radius');
		SceneMath.assertScenePosition(center, 'ExactSphereGroundObject center');
		SceneMath.assertSceneScale(sceneScale, 'ExactSphereGroundObject sceneScale');

		if (radius.value <= 0) {
			throw new TypeError('ExactSphereGroundObject requires finite sphere and scale values.');
		}
		const acceptedName = ValueValidation.requiredString(name, 'ExactSphereGroundObject name');
		const acceptedSpectralReferenceId =
			spectralReferenceId === undefined || spectralReferenceId === null
				? null
				: ValueValidation.requiredString(spectralReferenceId, 'ExactSphereGroundObject spectralReferenceId');

		this.name = acceptedName;
		const centerSceneUnits = center.coordinates;
		this.position.set(centerSceneUnits[0], centerSceneUnits[1], centerSceneUnits[2]);
		this.userData.algorithm32SceneInput = true;
		this.userData.algorithm32EndpointRole = 'geometry-ground-exact-raycast';
		this.userData.endpointKind = 'geometry-ground-boundary';
		this.userData.spectralReferenceId = acceptedSpectralReferenceId;
		this.userData.sceneScale = {...sceneScale};
		this._configuration = {
			radius: {...radius},
			sceneScale: {...sceneScale},
		};
	}

	/**
	 * Call this method to intersect a Three raycaster with the exact sphere.
	 *
	 * @param {THREE.Raycaster} raycaster - Supplies the active raycaster.
	 * @param {THREE.Intersection[]} intersects - Receives intersections.
	 * @returns {void} -
	 */
	raycast(raycaster, intersects) {
		const center = new THREE.Vector3();

		center.setFromMatrixPosition(this.matrixWorld);

		const viewRay = raycaster.ray;
		const originToCenterOffset = new THREE.Vector3().subVectors(viewRay.origin, center);
		const halfLinearCoefficient = originToCenterOffset.dot(viewRay.direction);
		const radiusSceneUnits = this._configuration.radius.value;
		const constantTerm = originToCenterOffset.dot(originToCenterOffset) - radiusSceneUnits ** 2;
		const discriminant = halfLinearCoefficient * halfLinearCoefficient - constantTerm;

		if (discriminant < 0) {
			return;
		}

		const root = Math.sqrt(discriminant);
		const near = -halfLinearCoefficient - root;
		const farIntersectionDistance = -halfLinearCoefficient + root;
		const distance =
			near >= raycaster.near ? near : farIntersectionDistance >= raycaster.near ? farIntersectionDistance : null;

		if (!Number.isFinite(distance) || distance < raycaster.near || distance > raycaster.far) {
			return;
		}

		const point = viewRay.at(distance, new THREE.Vector3());
		const normal = new THREE.Vector3().subVectors(point, center).normalize();

		intersects.push({
			distance,
			point,
			object: this,
			normal,
		});
	}
}
