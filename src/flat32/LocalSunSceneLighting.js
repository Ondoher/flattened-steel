import * as THREE from 'three';

import {DistantSunLightSource} from '../algorithm32/implementation/index.js';

import {
	LOCAL_SUN_AMBIENT_LIGHT_INTENSITY,
	DISTANT_SUN_SCENE_LIGHT_REFERENCE_BRIGHTNESS,
	LOCAL_SUN_DIRECTIONAL_LIGHT_TOTAL_INTENSITY,
	LOCAL_SUN_LIGHT_COLOR,
	LOCAL_SUN_SHADOW_BIAS,
	LOCAL_SUN_SHADOW_INTENSITY,
	LOCAL_SUN_SHADOW_MAP_SIZE,
	LOCAL_SUN_SHADOW_NORMAL_BIAS,
	LOCAL_SUN_SHADOW_RADIUS,
	LOCAL_SUN_SHADOW_UPDATE_POLICY,
	LOCAL_SUN_SOURCE_KEY,
	LOCAL_SUN_SOURCE_POSITION_SCENE,
	SCENE_OBJECTS,
} from './consts.js';

export class LocalSunSceneLighting {
	/**
	 * @param {THREE.Group} parent - Owns the source-light group.
	 */
	constructor(parent) {
		this._parent = parent;
		/** @type {THREE.Group | null} */
		this._group = null;
		/** @type {THREE.Light[]} */
		this._lights = [];
		/** @type {THREE.Object3D[]} */
		this._targets = [];
	}

	/**
	 * Require the installed light group.
	 *
	 * @returns {THREE.Group} Return the installed group.
	 */
	_requireGroup() {
		if (this._group === null) {
			throw new Error('Flat32 local-Sun lighting is not being installed.');
		}

		return this._group;
	}

	/**
	 * Create the source-owned ambient fill.
	 *
	 * @returns {THREE.AmbientLight} Return the ambient light.
	 */
	_createAmbientLight() {
		const light = new THREE.AmbientLight(LOCAL_SUN_LIGHT_COLOR, LOCAL_SUN_AMBIENT_LIGHT_INTENSITY);

		light.name = `${LOCAL_SUN_SOURCE_KEY}-ambient-fill`;
		light.userData.algorithm32SourceLight = true;
		light.userData.sourceKey = LOCAL_SUN_SOURCE_KEY;
		light.userData.lightingRole = 'ambient-fill';
		return light;
	}

	/**
	 * Resolve the finite-source direction from one review object.
	 *
	 * @param {[number, number, number]} focus - Supplies the shadow focus.
	 * @returns {[number, number, number]} Return the normalized source direction.
	 */
	_directionToSource(focus) {
		const x = LOCAL_SUN_SOURCE_POSITION_SCENE[0] - focus[0];
		const y = LOCAL_SUN_SOURCE_POSITION_SCENE[1] - focus[1];
		const z = LOCAL_SUN_SOURCE_POSITION_SCENE[2] - focus[2];
		const length = Math.hypot(x, y, z);

		if (length <= Number.EPSILON) {
			throw new Error('Flat32 local-Sun source must not coincide with a review object.');
		}

		return [x / length, y / length, z / length];
	}

	/**
	 * Apply the source application's exact shadow camera and map policy.
	 *
	 * @param {THREE.DirectionalLight} light - Receives the shadow policy.
	 * @param {Flat32ReviewObjectDefinition} definition - Supplies the source-derived shadow camera.
	 * @param {number} shadowLayer - Isolates this object's shadow pass.
	 * @returns {void}
	 */
	_configureDirectionalShadow(light, definition, shadowLayer) {
		const camera = light.shadow.camera;

		light.castShadow = true;
		light.shadow.mapSize.set(LOCAL_SUN_SHADOW_MAP_SIZE, LOCAL_SUN_SHADOW_MAP_SIZE);
		light.shadow.bias = LOCAL_SUN_SHADOW_BIAS;
		light.shadow.normalBias = LOCAL_SUN_SHADOW_NORMAL_BIAS;
		light.shadow.radius = LOCAL_SUN_SHADOW_RADIUS;
		light.shadow.intensity = LOCAL_SUN_SHADOW_INTENSITY;
		camera.left = definition.shadowCamera.left;
		camera.right = definition.shadowCamera.right;
		camera.top = definition.shadowCamera.top;
		camera.bottom = definition.shadowCamera.bottom;
		camera.near = definition.shadowCamera.near;
		camera.far = definition.shadowCamera.far;
		camera.layers.set(shadowLayer);
		camera.updateProjectionMatrix();
	}

	/**
	 * Create one per-review-object local-source directional light and target.
	 *
	 * @param {Flat32ReviewObjectDefinition} definition - Supplies the review object.
	 * @param {number} index - Identifies the light.
	 * @returns {THREE.DirectionalLight} Return the source light.
	 */
	_createDirectionalLight(definition, index) {
		const direction = this._directionToSource(definition.shadowFocus);
		const intensity = LOCAL_SUN_DIRECTIONAL_LIGHT_TOTAL_INTENSITY / SCENE_OBJECTS.length;
		const shadowLayer = index + 1;
		const light = new THREE.DirectionalLight(LOCAL_SUN_LIGHT_COLOR, intensity);
		const target = new THREE.Object3D();

		light.name = `${LOCAL_SUN_SOURCE_KEY}-source-driven-shadow-directional-light-${index}`;
		light.position.set(
			definition.shadowFocus[0] + direction[0] * definition.sourceLightDistance,
			definition.shadowFocus[1] + direction[1] * definition.sourceLightDistance,
			definition.shadowFocus[2] + direction[2] * definition.sourceLightDistance,
		);
		target.name = `${LOCAL_SUN_SOURCE_KEY}-source-driven-target-${index}`;
		target.position.set(...definition.shadowFocus);
		light.target = target;
		this._configureDirectionalShadow(light, definition, shadowLayer);
		light.userData.algorithm32SourceLight = true;
		light.userData.sourceKey = LOCAL_SUN_SOURCE_KEY;
		light.userData.lightingRole = 'source-directional-light';
		light.userData.shadowPolicy = 'static-once-source-shadow-map';
		light.userData.shadowLayer = shadowLayer;
		light.userData.reviewObjectKey = definition.name;
		light.userData.directionToSource = direction;
		target.userData.algorithm32SourceLight = true;
		target.userData.sourceKey = LOCAL_SUN_SOURCE_KEY;
		target.userData.lightingRole = 'source-directional-target';
		target.userData.shadowLayer = shadowLayer;
		target.userData.reviewObjectKey = definition.name;
		this._targets.push(target);

		return light;
	}

	/**
	 * Update the checkpoint lights from the active production distant Sun.
	 *
	 * @param {DistantSunLightSource} lightSource - Resolves the selected
	 * source's direct and twilight-aware ambient scales.
	 * @param {UnitVector3} directionToSource - Supplies the spherical model-space
	 * direction in east/north/up order.
	 * @param {UnitValue<'cd m^-2'>} sourceBrightness - Supplies source-owned photopic brightness.
	 * @returns {void}
	 */
	updateFromDistantSun(lightSource, directionToSource, sourceBrightness) {
		if (this._group === null) {
			throw new Error('Flat32 local-Sun lighting is not installed.');
		}
		const direction = [directionToSource[0], directionToSource[2], -directionToSource[1]];
		const scales = lightSource.resolveSceneLightScales({
			directionToSource,
			observerUp: [0, 0, 1],
		});
		if (
			sourceBrightness?.units !== 'cd m^-2' ||
			!Number.isFinite(sourceBrightness.value) ||
			sourceBrightness.value < 0
		) {
			throw new RangeError('Distant-Sun source brightness must be finite, nonnegative, and use cd m^-2.');
		}
		const sourceLightScale = sourceBrightness.value / DISTANT_SUN_SCENE_LIGHT_REFERENCE_BRIGHTNESS.value;
		const ambientIntensity = sourceLightScale * scales.ambientLightScale.value;
		const directionalIntensity = (4 * sourceLightScale * scales.directLightScale.value) / SCENE_OBJECTS.length;

		for (const light of this._lights) {
			if (light instanceof THREE.AmbientLight) {
				light.intensity = ambientIntensity;
				continue;
			}
			if (!(light instanceof THREE.DirectionalLight)) continue;
			const definition = SCENE_OBJECTS.find((candidate) => candidate.name === light.userData.reviewObjectKey);
			if (definition === undefined) continue;
			light.intensity = directionalIntensity;
			light.position.set(
				definition.shadowFocus[0] + direction[0] * definition.sourceLightDistance,
				definition.shadowFocus[1] + direction[1] * definition.sourceLightDistance,
				definition.shadowFocus[2] + direction[2] * definition.sourceLightDistance,
			);
			light.userData.directionToSource = direction;
			light.shadow.needsUpdate = true;
		}
		this._group.userData.shadowMapUpdatePolicy = 'dynamic-from-production-distant-sun';
	}

	/**
	 * Update checkpoint lights from the active finite flat/local source.
	 *
	 * @param {ScenePosition} sourceScenePosition - Supplies the geometry-mapped
	 * observer-local source point.
	 */
	updateFromLocalSun(sourceScenePosition) {
		if (this._group === null) throw new Error('Flat32 local-Sun lighting is not installed.');
		const sourceCoordinates = sourceScenePosition.coordinates;
		for (const light of this._lights) {
			if (light instanceof THREE.AmbientLight) {
				light.intensity = LOCAL_SUN_AMBIENT_LIGHT_INTENSITY;
				continue;
			}
			if (!(light instanceof THREE.DirectionalLight)) continue;
			const definition = SCENE_OBJECTS.find((candidate) => candidate.name === light.userData.reviewObjectKey);
			if (definition === undefined) continue;
			const direction = this._directionBetween(definition.shadowFocus, sourceCoordinates);

			light.intensity = LOCAL_SUN_DIRECTIONAL_LIGHT_TOTAL_INTENSITY / SCENE_OBJECTS.length;
			light.position.set(
				definition.shadowFocus[0] + direction[0] * definition.sourceLightDistance,
				definition.shadowFocus[1] + direction[1] * definition.sourceLightDistance,
				definition.shadowFocus[2] + direction[2] * definition.sourceLightDistance,
			);
			light.userData.directionToSource = direction;
			light.shadow.needsUpdate = true;
		}
	}

	_directionBetween(from, to) {
		const direction = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
		const length = Math.hypot(...direction);
		if (length <= Number.EPSILON)
			throw new Error('Flat32 local-Sun source must not coincide with a review object.');
		return [direction[0] / length, direction[1] / length, direction[2] / length];
	}

	/**
	 * Add one owned source light.
	 *
	 * @param {THREE.Light} light - Supplies the light.
	 * @returns {void}
	 */
	_addLight(light) {
		this._lights.push(light);
		this._requireGroup().add(light);
	}

	/**
	 * Report the installed public lighting result.
	 *
	 * @returns {LocalSunLightingSummary} Return aggregate scene-light facts.
	 */
	_createSummary() {
		let ambientLightCount = 0;
		let directionalLightCount = 0;
		let ambientIntensity = 0;
		let directionalIntensity = 0;
		let shadowMapCount = 0;
		let shadowMapHeight = 0;
		let shadowMapWidth = 0;
		const shadowLayerMasks = new Set();

		for (const light of this._lights) {
			if (light instanceof THREE.AmbientLight) {
				ambientLightCount += 1;
				ambientIntensity += light.intensity;
			}
			if (light instanceof THREE.DirectionalLight) {
				directionalLightCount += 1;
				directionalIntensity += light.intensity;
				shadowLayerMasks.add(light.shadow.camera.layers.mask);
				if (light.shadow.map !== null) {
					shadowMapCount += 1;
					if (shadowMapCount === 1) {
						shadowMapWidth = light.shadow.map.width;
						shadowMapHeight = light.shadow.map.height;
					} else if (
						shadowMapWidth !== light.shadow.map.width ||
						shadowMapHeight !== light.shadow.map.height
					) {
						shadowMapWidth = 0;
						shadowMapHeight = 0;
					}
				}
			}
		}

		const shadowMapsInstalled =
			directionalLightCount === SCENE_OBJECTS.length &&
			shadowMapCount === directionalLightCount &&
			shadowMapWidth === LOCAL_SUN_SHADOW_MAP_SIZE &&
			shadowMapHeight === LOCAL_SUN_SHADOW_MAP_SIZE;

		return {
			sourceLightCount: this._lights.length,
			ambientLightCount,
			directionalLightCount,
			targetCount: this._targets.length,
			ambientIntensity,
			directionalIntensity,
			shadowMapsInstalled,
			shadowMapCount,
			shadowMapWidth,
			shadowMapHeight,
			shadowLayerCount: shadowLayerMasks.size,
		};
	}

	/**
	 * Report the current installed and allocated lighting state.
	 *
	 * @returns {LocalSunLightingSummary} Return aggregate source-light facts.
	 */
	describe() {
		if (this._group === null) {
			throw new Error('Flat32 local-Sun lighting is not installed.');
		}

		return this._createSummary();
	}

	/**
	 * Install every source-app Three light and shadow camera.
	 *
	 * @returns {LocalSunLightingSummary} Return aggregate source-light facts.
	 */
	install() {
		if (this._group !== null) {
			return this._createSummary();
		}

		this._group = new THREE.Group();
		this._group.name = 'flat32-local-sun-scene-lighting';
		this._group.userData.sourceKey = LOCAL_SUN_SOURCE_KEY;
		this._group.userData.shadowMapsConfigured = true;
		this._group.userData.shadowMapUpdatePolicy = LOCAL_SUN_SHADOW_UPDATE_POLICY;
		this._addLight(this._createAmbientLight());
		for (const [index, definition] of SCENE_OBJECTS.entries()) {
			const light = this._createDirectionalLight(definition, index);

			this._addLight(light);
			this._requireGroup().add(this._targets[index]);
		}
		this._parent.add(this._group);

		return this.describe();
	}

	/**
	 * Remove every owned source light and target.
	 *
	 * @returns {void}
	 */
	dispose() {
		if (this._group === null) {
			return;
		}

		this._parent.remove(this._group);
		for (const light of this._lights) {
			light.dispose();
		}
		this._lights.length = 0;
		this._targets.length = 0;
		this._group.clear();
		this._group = null;
	}
}
