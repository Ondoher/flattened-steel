import * as THREE from 'three';
import SceneMath from '../utils/SceneMath.js';
import { requiredString } from '../descriptors/descriptorSupport.js';

const EPSILON = 1e-9;

/**
 * Provide an exact flat ground endpoint for Three raycasters.
 */
export default class ExactFlatGroundObject extends THREE.Object3D {
	/**
	 * Create an exact flat ground endpoint.
	 *
	 * @param {ExactFlatGroundObjectConfig} configuration - Supplies plane
	 * extent, scene scale, metadata, and placement.
	 */
	constructor(configuration) {
		super();

		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('ExactFlatGroundObject configuration is required.');
		}

		const {
			center = SceneMath.positionInSceneUnits([0, 0, 0]),
			width,
			depth,
			sceneScale,
			spectralReferenceId,
			name = 'exact-flat-ground-endpoint',
		} = configuration;

		SceneMath.assertScenePosition(center, 'ExactFlatGroundObject center');
		SceneMath.assertSceneDistance(width, 'ExactFlatGroundObject width');
		SceneMath.assertSceneDistance(depth, 'ExactFlatGroundObject depth');
		SceneMath.assertSceneScale(sceneScale, 'ExactFlatGroundObject sceneScale');

		if (width.value <= 0 || depth.value <= 0) {
			throw new TypeError('ExactFlatGroundObject requires finite plane and scale values.');
		}
		const acceptedName = requiredString(name, 'ExactFlatGroundObject name');
		const acceptedSpectralReferenceId = spectralReferenceId === undefined
			|| spectralReferenceId === null
			? null
			: requiredString(
				spectralReferenceId,
				'ExactFlatGroundObject spectralReferenceId',
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
			width: { ...width },
			depth: { ...depth },
			sceneScale: { ...sceneScale },
		};
	}

	/**
	 * Intersect a Three raycaster with the exact observer-local ground plane.
	 *
	 * @param {THREE.Raycaster} raycaster - Supplies the active raycaster.
	 * @param {THREE.Intersection[]} intersects - Receives intersections.
	 * @returns {void}
	 */
	raycast(raycaster, intersects) {
		const center = new THREE.Vector3();

		center.setFromMatrixPosition(this.matrixWorld);

		const ray = raycaster.ray;
		if (Math.abs(ray.direction.y) <= EPSILON) {
			return;
		}

		const distance = (center.y - ray.origin.y) / ray.direction.y;
		if (!Number.isFinite(distance) || distance < raycaster.near || distance > raycaster.far) {
			return;
		}

		const point = ray.at(distance, new THREE.Vector3());
		const widthSceneUnits = this._configuration.width.value;
		const depthSceneUnits = this._configuration.depth.value;
		const halfWidth = widthSceneUnits / 2;
		const halfDepth = depthSceneUnits / 2;

		if (
			Math.abs(point.x - center.x) > halfWidth
			|| Math.abs(point.z - center.z) > halfDepth
		) {
			return;
		}

		intersects.push({
			distance,
			point,
			object: this,
			normal: new THREE.Vector3(0, 1, 0),
		});
	}
}
