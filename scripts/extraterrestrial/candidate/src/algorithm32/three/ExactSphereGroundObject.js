import * as THREE from 'three';
import SceneMath from '../utils/SceneMath.js';
import { requiredString } from '../descriptors/descriptorSupport.js';

/**
 * Provide an exact spherical ground endpoint for Three raycasters.
 */
export default class ExactSphereGroundObject extends THREE.Object3D {
	/**
	 * Create an exact spherical ground endpoint.
	 *
	 * @param {ExactSphereGroundObjectConfig} configuration - Supplies sphere
	 * radius, scene scale, metadata, and placement.
	 */
	constructor(configuration) {
		super();

		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('ExactSphereGroundObject configuration is required.');
		}

		const {
			radius,
			center,
			sceneScale,
			spectralReferenceId,
			name = 'exact-sphere-ground-endpoint',
		} = configuration;

		SceneMath.assertSceneDistance(radius, 'ExactSphereGroundObject radius');
		SceneMath.assertScenePosition(center, 'ExactSphereGroundObject center');
		SceneMath.assertSceneScale(sceneScale, 'ExactSphereGroundObject sceneScale');

		if (radius.value <= 0) {
			throw new TypeError('ExactSphereGroundObject requires finite sphere and scale values.');
		}
		const acceptedName = requiredString(name, 'ExactSphereGroundObject name');
		const acceptedSpectralReferenceId = spectralReferenceId === undefined
			|| spectralReferenceId === null
			? null
			: requiredString(
				spectralReferenceId,
				'ExactSphereGroundObject spectralReferenceId',
			);

		this.name = acceptedName;
		const centerSceneUnits = center.coordinates;
		this.position.set(centerSceneUnits[0], centerSceneUnits[1], centerSceneUnits[2]);
		this.userData.algorithm32SceneInput = true;
		this.userData.algorithm32EndpointRole = 'geometry-ground-exact-raycast';
		this.userData.endpointKind = 'geometry-ground-boundary';
		this.userData.spectralReferenceId = acceptedSpectralReferenceId;
		this.userData.sceneScale = { ...sceneScale };
		this._configuration = {
			radius: { ...radius },
			sceneScale: { ...sceneScale },
		};
	}

	/**
	 * Intersect a Three raycaster with the exact sphere.
	 *
	 * @param {THREE.Raycaster} raycaster - Supplies the active raycaster.
	 * @param {THREE.Intersection[]} intersects - Receives intersections.
	 * @returns {void}
	 */
	raycast(raycaster, intersects) {
		const center = new THREE.Vector3();

		center.setFromMatrixPosition(this.matrixWorld);

		const ray = raycaster.ray;
		const oc = new THREE.Vector3().subVectors(ray.origin, center);
		const b = oc.dot(ray.direction);
		const radiusSceneUnits = this._configuration.radius.value;
		const c = oc.dot(oc) - radiusSceneUnits ** 2;
		const discriminant = b * b - c;

		if (discriminant < 0) {
			return;
		}

		const root = Math.sqrt(discriminant);
		const near = -b - root;
		const far = -b + root;
		const distance = near >= raycaster.near ? near : far >= raycaster.near ? far : null;

		if (!Number.isFinite(distance) || distance < raycaster.near || distance > raycaster.far) {
			return;
		}

		const point = ray.at(distance, new THREE.Vector3());
		const normal = new THREE.Vector3().subVectors(point, center).normalize();

		intersects.push({
			distance,
			point,
			object: this,
			normal,
		});
	}
}
