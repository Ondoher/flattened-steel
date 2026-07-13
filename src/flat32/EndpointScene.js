import * as THREE from 'three';

import {LocalSunSceneLighting} from './LocalSunSceneLighting.js';
import {ATMOSPHERE_SCENE_SCALE, GROUND_COLOR, GROUND_SIZE_SCENE_UNITS, SCENE_OBJECTS} from './consts.js';

export class EndpointScene {
	/**
	 * @param {THREE.Scene} scene - Owns the rendered objects.
	 * @param {Readonly<{ reviewObjectsEnabled?: boolean }>} [configuration]
	 * Supplies diagnostic-only scene visibility without changing the default.
	 */
	constructor(scene, configuration = {}) {
		this._scene = scene;
		this._reviewObjectsEnabled = configuration.reviewObjectsEnabled !== false;
		/** @type {THREE.Group | null} */
		this._group = null;
		/** @type {THREE.Mesh[]} */
		this._meshes = [];
		/** @type {LocalSunSceneLighting | null} */
		this._lighting = null;
	}

	/**
	 * Add one owned mesh.
	 *
	 * @param {THREE.Mesh} mesh - Supplies the mesh.
	 * @returns {void}
	 */
	_addMesh(mesh) {
		if (this._group === null) {
			throw new Error('Flat32 endpoint scene is not being installed.');
		}

		this._meshes.push(mesh);
		this._group.add(mesh);
	}

	/** Remove the current geometry-owned ground and review meshes. */
	_clearMeshes() {
		for (const mesh of this._meshes) {
			this._group?.remove(mesh);
			this._disposeMesh(mesh);
		}
		this._meshes.length = 0;
	}

	/**
	 * Create the matte ground plane.
	 *
	 * @returns {THREE.Mesh} Return the ground mesh.
	 */
	_createGround(geometry, kind) {
		const endpoints = geometry.createThreeEndpointObjects({
			sceneScale: ATMOSPHERE_SCENE_SCALE,
			name: kind === 'spherical-distant' ? 'flat32-globe-ground' : 'flat32-flat-ground',
			groundExtent: {
				value: GROUND_SIZE_SCENE_UNITS * ATMOSPHERE_SCENE_SCALE.value,
				units: 'meters',
			},
			visualMaterialColor: GROUND_COLOR,
			visualMaterialLighting: 'lambert',
			shadow: {
				enabled: true,
				receiveShadow: true,
				shadowPolicy: 'flat32-ground-receives-all-local-sun-shadow-layers',
			},
			...(kind === 'spherical-distant'
				? {
						widthSegments: 256,
						heightSegments: 256,
						groundVisualMesh: {
							kind: 'local-spherical-patch',
							xExtentSceneUnits: GROUND_SIZE_SCENE_UNITS / 2,
							zMinSceneUnits: -GROUND_SIZE_SCENE_UNITS / 2,
							zMaxSceneUnits: GROUND_SIZE_SCENE_UNITS / 2,
						},
					}
				: {}),
		});
		const ground = /** @type {THREE.Mesh} */ (endpoints.visualObjects[0]);

		for (let index = 0; index < SCENE_OBJECTS.length; index += 1) {
			ground.layers.enable(index + 1);
		}
		return ground;
	}

	/**
	 * Create one matte review object.
	 *
	 * @param {Flat32ReviewObjectDefinition} definition - Supplies the object definition.
	 * @param {number} index - Identifies the object.
	 * @returns {THREE.Mesh} Return the mesh.
	 */
	_createReviewObject(definition, index, surfaceGeometry) {
		const boxGeometry = new THREE.BoxGeometry(definition.size[0], definition.size[1], definition.size[2]);
		const material = new THREE.MeshStandardMaterial({
			color: definition.color,
			metalness: 0.02,
			roughness: 0.72,
		});
		const mesh = new THREE.Mesh(boxGeometry, material);

		mesh.name = `flat32-review-object-${index + 1}`;
		const center = surfaceGeometry.mapGroundOffsetToScenePoint(
			{
				coordinates: [definition.position[0], 0, definition.position[2]],
				units: 'scene-units',
			},
			{
				sceneScale: ATMOSPHERE_SCENE_SCALE,
				heightAboveGround: {
					value: definition.size[1] / 2,
					units: 'scene-units',
				},
			},
		);

		mesh.position.set(center.coordinates[0], center.coordinates[1], center.coordinates[2]);
		mesh.rotation.y = definition.rotationY;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.layers.enable(index + 1);
		mesh.userData.shadowObjectKey = definition.name;
		mesh.userData.shadowLayerIndex = index + 1;
		mesh.userData.shadowPolicy = 'three-shadow-map-from-local-source-direction';
		return mesh;
	}

	/**
	 * Dispose one owned mesh.
	 *
	 * @param {THREE.Mesh} mesh - Supplies the mesh to release.
	 * @returns {void}
	 */
	_disposeMesh(mesh) {
		mesh.geometry.dispose();
		if (Array.isArray(mesh.material)) {
			for (const material of mesh.material) {
				material.dispose();
			}
			return;
		}
		mesh.material.dispose();
	}

	/**
	 * Install the ordinary matte scene.
	 *
	 * @returns {Flat32SceneSummary} Return aggregate scene-light facts.
	 */
	install() {
		if (this._group !== null) {
			return this.describe();
		}

		this._group = new THREE.Group();
		this._group.name = 'flat32-endpoint-scene';
		this._scene.add(this._group);
		this._lighting = new LocalSunSceneLighting(this._group);
		this._lighting.install();

		return this.describe();
	}

	/** Rebuild geometry-owned visual endpoints for a supported atmosphere mode. */
	applyMode(kind, geometry) {
		if (this._group === null) {
			throw new Error('Flat32 endpoint scene is not installed.');
		}

		this._clearMeshes();
		this._addMesh(this._createGround(geometry, kind));
		if (this._reviewObjectsEnabled) {
			for (const [index, definition] of SCENE_OBJECTS.entries()) {
				this._addMesh(this._createReviewObject(definition, index, geometry));
			}
		}
	}

	/**
	 * Report the current observable scene and shadow state.
	 *
	 * @returns {Flat32SceneSummary} Return aggregate scene facts.
	 */
	describe() {
		if (this._group === null || this._lighting === null) {
			throw new Error('Flat32 endpoint scene is not installed.');
		}

		let shadowCasterCount = 0;
		let shadowReceiverCount = 0;

		for (const mesh of this._meshes) {
			if (mesh.castShadow) {
				shadowCasterCount += 1;
			}
			if (mesh.receiveShadow) {
				shadowReceiverCount += 1;
			}
		}

		return {
			...this._lighting.describe(),
			shadowCasterCount,
			shadowReceiverCount,
		};
	}

	/** Update scene lighting to match the active spherical/distant atmosphere. */
	updateDistantSunLighting(lightSource, directionToSource, sourceBrightness) {
		if (this._lighting === null) {
			throw new Error('Flat32 endpoint scene is not installed.');
		}

		this._lighting.updateFromDistantSun(lightSource, directionToSource, sourceBrightness);
	}

	/**
	 * Update scene lights from the active finite flat/local source.
	 *
	 * @param {ScenePosition} sourceScenePosition - Supplies the geometry-mapped
	 * observer-local source point.
	 */
	updateLocalSunLighting(sourceScenePosition) {
		if (this._lighting === null) throw new Error('Flat32 endpoint scene is not installed.');
		this._lighting.updateFromLocalSun(sourceScenePosition);
	}

	/**
	 * Return scene-space corners that bound all opaque scene geometry.
	 *
	 * @returns {readonly ScenePosition[]} Return typed endpoint positions.
	 */
	getSceneDepthEndpointPositions() {
		if (this._group === null) {
			throw new Error('Flat32 endpoint scene is not installed.');
		}

		/** @type {ScenePosition[]} */
		const positions = [];

		this._group.updateWorldMatrix(true, true);
		for (const mesh of this._meshes) {
			const bounds = new THREE.Box3().setFromObject(mesh, true);

			if (bounds.isEmpty()) {
				continue;
			}
			for (const x of [bounds.min.x, bounds.max.x]) {
				for (const y of [bounds.min.y, bounds.max.y]) {
					for (const z of [bounds.min.z, bounds.max.z]) {
						positions.push({
							coordinates: [x, y, z],
							units: 'scene-units',
						});
					}
				}
			}
		}

		return positions;
	}

	/**
	 * Remove and dispose every owned scene object.
	 *
	 * @returns {void}
	 */
	dispose() {
		if (this._group === null) {
			return;
		}

		this._clearMeshes();
		this._lighting?.dispose();
		this._lighting = null;
		this._scene.remove(this._group);
		this._group.clear();
		this._group = null;
	}
}
