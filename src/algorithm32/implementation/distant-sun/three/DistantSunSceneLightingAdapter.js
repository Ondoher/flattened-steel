import {LightSourceRequestValues} from '../../../light-source-support/LightSourceRequestValues.js';
import {SceneLightingMath} from '../../../light-source-support/three/SceneLightingMath.js';
import {ThreeLighting} from '../../../light-source-support/three/ThreeLighting.js';
import {PixelMath} from '../../../math/PixelMath.js';
import {UnitMath} from '../../../physical-quantities/UnitMath.js';
import SceneMath from '../../../math/SceneMath.js';
import {ValueValidation} from '../../../validation/ValueValidation.js';
import {
	DEFAULT_DISTANT_SUN_SCENE_AMBIENT_INTENSITY_RANGE,
	DISTANT_SUN_SHADOW_OBJECT_REQUEST_PROPERTIES,
	DISTANT_SUN_SHADOW_REQUEST_PROPERTIES,
} from './consts.js';

/** Distant-Sun adaptation for scene-light scaling and Three lighting objects. */
export class DistantSunSceneLightingAdapter {
	/**
	 * Configured physical source facade.
	 * @type {DistantSunSceneLightingSource}
	 */
	_source;
	/**
	 * Immutable normalized source configuration.
	 * @type {DistantSunLightSourceConfiguration}
	 */
	_configuration;

	/**
	 * Creates a Three scene-lighting adapter for one distant-Sun facade.
	 *
	 * @param {DistantSunSceneLightingSource} source - The configured physical source facade.
	 * @param {DistantSunLightSourceConfiguration} configuration - The normalized source configuration.
	 */
	constructor(source, configuration) {
		this._source = source;
		this._configuration = configuration;
	}

	/**
	 * Called by DistantSunSceneLightingAdapter to map a value smoothly between two edges. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {number} lowerTransitionEdge - The lower edge.
	 * @param {number} upperTransitionEdge - The upper edge.
	 * @param {number} value - The candidate value.
	 * @returns {number} - The smoothly clamped percentage.
	 */
	_smoothStep(lowerTransitionEdge, upperTransitionEdge, value) {
		if (Math.abs(upperTransitionEdge - lowerTransitionEdge) <= Number.EPSILON) {
			return value >= upperTransitionEdge ? 1 : 0;
		}

		const smoothstepFraction = SceneLightingMath.clamp01(
			(value - lowerTransitionEdge) / (upperTransitionEdge - lowerTransitionEdge),
		);

		return smoothstepFraction * smoothstepFraction * (3 - 2 * smoothstepFraction);
	}

	/**
	 * Called by DistantSunSceneLightingAdapter to calculate the dot product of two vectors.
	 *
	 * @param {readonly number[]} left - The left vector.
	 * @param {readonly number[]} right - The right vector.
	 * @returns {number} - The dot product.
	 */
	_dot(left, right) {
		return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
	}

	/**
	 * Called by DistantSunSceneLightingAdapter to reject non-canonical
	 * properties at its shadow request boundary.
	 *
	 * @param {object} value - The candidate object.
	 * @param {readonly string[]} allowedProperties - The canonical property names.
	 * @param {string} label - The request-object label.
	 * @param {string} [contractName] - The named canonical contract.
	 * @returns {void} - No return value.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_assertOnlyProperties(value, allowedProperties, label, contractName = 'shadow') {
		const unexpectedProperty = Object.keys(value).find(
			/**
			 * Called by Array.prototype.find to test one collection value for selection.
			 * @param property - The property value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (property) => !allowedProperties.includes(property),
		);

		if (unexpectedProperty) {
			throw new TypeError(
				`${label}.${unexpectedProperty} is not part of the canonical ${contractName} contract.`,
			);
		}
	}

	/**
	 * Called by DistantSunSceneLightingAdapter to normalize one shadow-object request.
	 *
	 * @param {LightSourceThreeShadowObjectRequest} shadowObject - The candidate shadow-object configuration.
	 * @param {ScenePosition} focus - The default focus point.
	 * @param {SceneDistance} defaultLightDistance - The default light distance.
	 * @param {number} defaultShadowIntensity - The default split-light shadow opacity.
	 * @returns {DistantSunNormalizedShadowObject} - The normalized shadow-object settings.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_normalizeShadowObjectRequest(shadowObject, focus, defaultLightDistance, defaultShadowIntensity = 1) {
		const shadowFocus = SceneMath.positionOrDefault(
			shadowObject.focus,
			focus,
			'DistantSunLightSource',
			'shadow.focus',
		);
		const requestedExtent = SceneMath.distanceOrDefault(
			shadowObject.extent,
			SceneMath.inSceneUnits(20),
			'DistantSunLightSource',
			'shadow.extent',
		);
		if (requestedExtent.value <= 0) {
			throw new RangeError('shadow.extent must be greater than zero.');
		}
		const extentSceneUnits = requestedExtent.value;
		const extent = SceneMath.inSceneUnits(extentSceneUnits);
		const requestedLightDistance = SceneMath.distanceOrDefault(
			shadowObject.lightDistance,
			defaultLightDistance,
			'DistantSunLightSource',
			'shadow.lightDistance',
		);
		if (requestedLightDistance.value < extentSceneUnits * 2) {
			throw new RangeError('shadow.lightDistance must be at least twice shadow.extent.');
		}
		const lightDistanceSceneUnits = requestedLightDistance.value;
		const lightDistance = SceneMath.inSceneUnits(lightDistanceSceneUnits);
		const requestedCameraNear = SceneMath.distanceOrDefault(
			shadowObject.cameraNear,
			SceneMath.inSceneUnits(0.1),
			'DistantSunLightSource',
			'shadow.cameraNear',
		);
		if (requestedCameraNear.value <= 0) {
			throw new RangeError('shadow.cameraNear must be greater than zero.');
		}
		const cameraNearSceneUnits = requestedCameraNear.value;
		const requestedCameraFar = SceneMath.distanceOrDefault(
			shadowObject.cameraFar,
			SceneMath.inSceneUnits(lightDistanceSceneUnits + extentSceneUnits * 4),
			'DistantSunLightSource',
			'shadow.cameraFar',
		);
		if (requestedCameraFar.value <= cameraNearSceneUnits) {
			throw new RangeError('shadow.cameraFar must be greater than shadow.cameraNear.');
		}
		const cameraFarSceneUnits = requestedCameraFar.value;
		const cameraLeftSceneUnits = SceneMath.distanceOrDefault(
			shadowObject.cameraLeft,
			SceneMath.inSceneUnits(-extentSceneUnits),
			'DistantSunLightSource',
			'shadow.cameraLeft',
		).value;
		const requestedCameraRight = SceneMath.distanceOrDefault(
			shadowObject.cameraRight,
			SceneMath.inSceneUnits(extentSceneUnits),
			'DistantSunLightSource',
			'shadow.cameraRight',
		).value;
		if (requestedCameraRight <= cameraLeftSceneUnits) {
			throw new RangeError('shadow.cameraRight must be greater than shadow.cameraLeft.');
		}
		const cameraRightSceneUnits = requestedCameraRight;
		const cameraBottomSceneUnits = SceneMath.distanceOrDefault(
			shadowObject.cameraBottom,
			SceneMath.inSceneUnits(-extentSceneUnits),
			'DistantSunLightSource',
			'shadow.cameraBottom',
		).value;
		const requestedCameraTop = SceneMath.distanceOrDefault(
			shadowObject.cameraTop,
			SceneMath.inSceneUnits(extentSceneUnits),
			'DistantSunLightSource',
			'shadow.cameraTop',
		).value;
		if (requestedCameraTop <= cameraBottomSceneUnits) {
			throw new RangeError('shadow.cameraTop must be greater than shadow.cameraBottom.');
		}
		const cameraTopSceneUnits = requestedCameraTop;
		const mapSize = PixelMath.sizeOrDefault(
			shadowObject.mapSize,
			{width: 2048, height: 2048, units: 'pixels'},
			'shadow object mapSize',
		);
		const normalBias = SceneMath.distanceOrDefault(
			shadowObject.normalBias,
			SceneMath.inSceneUnits(0.02),
			'DistantSunLightSource',
			'shadow object normalBias',
		);
		if (normalBias.value < 0) {
			throw new RangeError('shadow.normalBias must be non-negative.');
		}
		const radius = PixelMath.distanceOrDefault(
			shadowObject.radius,
			{value: 1, units: 'pixels'},
			'shadow object radius',
		);

		const shadowIntensity = ValueValidation.finiteNumberOrDefault(
			shadowObject.shadowIntensity,
			defaultShadowIntensity,
			'shadow.shadowIntensity',
		);
		if (shadowIntensity < 0) {
			throw new RangeError('shadow.shadowIntensity must be non-negative.');
		}

		return {
			focus: shadowFocus,
			extent,
			lightDistance,
			cameraLeft: SceneMath.inSceneUnits(cameraLeftSceneUnits),
			cameraRight: SceneMath.inSceneUnits(cameraRightSceneUnits),
			cameraTop: SceneMath.inSceneUnits(cameraTopSceneUnits),
			cameraBottom: SceneMath.inSceneUnits(cameraBottomSceneUnits),
			cameraNear: SceneMath.inSceneUnits(cameraNearSceneUnits),
			cameraFar: SceneMath.inSceneUnits(cameraFarSceneUnits),
			mapSize,
			bias: ValueValidation.finiteNumberOrDefault(shadowObject.bias, -0.00002, 'shadow.bias'),
			normalBias,
			radius,
			shadowIntensity,
			objectKey: /** @type {string} */ (shadowObject.objectKey),
			layerIndex: ThreeLighting.layerIndexOrNull(shadowObject.layerIndex),
		};
	}

	/**
	 * Called by DistantSunSceneLightingAdapter to normalize the canonical shadow request. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {LightSourceThreeShadowRequest | undefined} shadow - The candidate shadow configuration.
	 * @param {ScenePosition} focus - The default focus point.
	 * @param {SceneDistance} defaultLightDistance - The default light distance.
	 * @returns {DistantSunNormalizedShadowRequest} - The normalized shadow policy.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_normalizeShadowRequest(shadow, focus, defaultLightDistance) {
		if (shadow === undefined) {
			return {enabled: false, objects: []};
		}

		if (shadow === null || typeof shadow !== 'object' || Array.isArray(shadow)) {
			throw new TypeError('shadow must contain enabled and objects.');
		}
		this._assertOnlyProperties(shadow, DISTANT_SUN_SHADOW_REQUEST_PROPERTIES, 'shadow');

		if (typeof shadow.enabled !== 'boolean') {
			throw new TypeError('shadow.enabled must be boolean.');
		}
		if (!Array.isArray(shadow.objects)) {
			throw new TypeError('shadow.objects must be an array.');
		}
		if (!shadow.enabled) {
			if (shadow.objects.length > 0) {
				throw new RangeError('Disabled shadow requests require an empty objects array.');
			}

			return {enabled: false, objects: []};
		}
		if (shadow.objects.length < 1) {
			throw new RangeError('Enabled shadow requests require at least one shadow object.');
		}

		const defaultShadowIntensity = shadow.objects.length;
		const objects = shadow.objects.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param object - The object value accepted by the operation.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
			 */ (object, index) => {
				if (!object || typeof object !== 'object' || Array.isArray(object)) {
					throw new TypeError(`shadow.objects[${index}] must be an object.`);
				}
				this._assertOnlyProperties(
					object,
					DISTANT_SUN_SHADOW_OBJECT_REQUEST_PROPERTIES,
					`shadow.objects[${index}]`,
				);

				return this._normalizeShadowObjectRequest(
					{
						...object,
						objectKey: ValueValidation.requiredStringOrDefault(
							object.objectKey,
							`shadow-object-${index}`,
							`shadow.objects[${index}].objectKey`,
						),
					},
					focus,
					defaultLightDistance,
					defaultShadowIntensity,
				);
			},
		);

		return {enabled: true, objects};
	}

	/**
	 * Called by DistantSunSceneLightingAdapter to apply normalized directional shadow settings.
	 *
	 * @param {DistantThreeDirectionalLight} light - The Three directional light.
	 * @param {DistantSunNormalizedShadowObject} shadow - The normalized shadow settings.
	 * @returns {void} - No return value.
	 */
	_applyDirectionalShadow(light, shadow) {
		if (!light.shadow) {
			return;
		}

		if (light.shadow.mapSize) {
			light.shadow.mapSize.width = shadow.mapSize.width;
			light.shadow.mapSize.height = shadow.mapSize.height;
		}
		if (light.shadow.camera) {
			light.shadow.camera.left = shadow.cameraLeft.value;
			light.shadow.camera.right = shadow.cameraRight.value;
			light.shadow.camera.top = shadow.cameraTop.value;
			light.shadow.camera.bottom = shadow.cameraBottom.value;
			light.shadow.camera.near = shadow.cameraNear.value;
			light.shadow.camera.far = shadow.cameraFar.value;
			ThreeLighting.applyLayerIndex(light.shadow.camera, shadow.layerIndex);
			light.shadow.camera.updateProjectionMatrix?.();
		}
		light.shadow.bias = shadow.bias;
		light.shadow.normalBias = shadow.normalBias.value;
		light.shadow.radius = shadow.radius.value;
		light.shadow.intensity = shadow.shadowIntensity;
	}

	/**
	 * Called by DistantSunSceneLightingAdapter to create one directional light and target pair.
	 *
	 * @param {DistantSunDirectionalLightRequest} request - The light and target facts.
	 * @returns {DistantSunDirectionalLightPair} - The created pair.
	 */
	_createDirectionalLight({THREE, directionToSource, intensity, focus, lightDistance, shadowObject, objectIndex}) {
		const target = new THREE.Object3D();
		const sourceLight = new THREE.DirectionalLight(0xffffff, intensity);
		const directionToSourceScene = directionToSource;
		const focusSceneUnits = focus.coordinates;
		const lightDistanceSceneUnits = lightDistance.value;

		sourceLight.name = `distant-sun-source-directional-light-${objectIndex}`;
		sourceLight.position.set(
			focusSceneUnits[0] + directionToSourceScene[0] * lightDistanceSceneUnits,
			focusSceneUnits[1] + directionToSourceScene[1] * lightDistanceSceneUnits,
			focusSceneUnits[2] + directionToSourceScene[2] * lightDistanceSceneUnits,
		);
		target.name = `distant-sun-source-directional-target-${objectIndex}`;
		target.position.set(...focusSceneUnits);
		sourceLight.target = target;
		sourceLight.castShadow = shadowObject !== null;
		sourceLight.userData.algorithm32SourceLight = true;
		sourceLight.userData.sourceKey = 'distant-sun';
		sourceLight.userData.lightingRole = 'source-directional-light';
		sourceLight.userData.directionToSource = directionToSourceScene;
		target.userData.algorithm32SourceLight = true;
		target.userData.sourceKey = 'distant-sun';
		target.userData.lightingRole = 'source-directional-target';

		if (shadowObject !== null) {
			sourceLight.userData.shadowObjectKey = shadowObject.objectKey;
			sourceLight.userData.shadowLayerIndex = shadowObject.layerIndex;
			target.userData.shadowObjectKey = shadowObject.objectKey;
			target.userData.shadowLayerIndex = shadowObject.layerIndex;
			this._applyDirectionalShadow(sourceLight, shadowObject);
		}

		return {light: sourceLight, target};
	}

	/**
	 * Call this method to resolve neutral local scene-light scales for a distant source.
	 *
	 * @param {LightSourceSceneLightScalesRequest} [request] - The optional source direction, local up vector, and twilight bounds.
	 * @returns {LightSourceSceneLightScales} - The direct and twilight-aware ambient scales.
	 *
	 */
	resolveSceneLightScales(request = {}) {
		const directionToSourceScene = LightSourceRequestValues.normalizeDirection(
			request.directionToSource === undefined ? this._configuration.directionToLight : request.directionToSource,
			'directionToSource',
		);
		const localUpScene = LightSourceRequestValues.normalizeDirection(
			request.observerUp === undefined ? [0, 1, 0] : request.observerUp,
			'observerUp',
		);
		const sourceUpDot = this._dot(directionToSourceScene, localUpScene);
		const twilightStartSourceUpDot = ValueValidation.finiteNumberOrDefault(
			request.twilightStartSourceUpDot,
			Math.sin((-12 * Math.PI) / 180),
			'twilightStartSourceUpDot',
		);
		const fullAmbientSourceUpDot = ValueValidation.finiteNumberOrDefault(
			request.fullAmbientSourceUpDot,
			Math.sin((12 * Math.PI) / 180),
			'fullAmbientSourceUpDot',
		);
		const ambientLightScaleValue = this._smoothStep(twilightStartSourceUpDot, fullAmbientSourceUpDot, sourceUpDot);
		const directLightScaleValue = SceneLightingMath.clamp01(sourceUpDot);
		/** @type {Dimensionless} */
		const directLightScale = UnitMath.createUnitValue({value: directLightScaleValue, units: '1'});
		/** @type {Dimensionless} */
		const ambientLightScale = UnitMath.createUnitValue({value: ambientLightScaleValue, units: '1'});

		return {
			directLightScale,
			ambientLightScale,
			localLightScale: ambientLightScale,
			sourceUpDot,
			policy: 'distant-source-twilight-aware-scene-light-scale',
		};
	}

	/**
	 * Called by DistantSunSceneLightingAdapter to create the source-owned ambient fill light.
	 *
	 * @param {DistantSunAmbientLightRequest} request - The Three constructor and ambient intensity.
	 * @returns {DistantThreeObject} - The created Three ambient light.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_createThreeAmbientLight(request) {
		const THREE = request.THREE;

		if (!THREE || typeof THREE.AmbientLight !== 'function') {
			throw new TypeError('DistantSunLightSource.addSceneLighting requires THREE.AmbientLight.');
		}

		if (!Number.isFinite(request.ambientIntensity)) {
			throw new TypeError('DistantSunLightSource ambient light requires ambientIntensity.');
		}

		if (request.ambientIntensity < 0) {
			throw new RangeError('DistantSunLightSource ambientIntensity must be non-negative.');
		}
		const ambientIntensity = request.ambientIntensity;
		const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity);

		ambient.name = 'distant-sun-ambient-fill';
		ambient.userData.algorithm32SourceLight = true;
		ambient.userData.sourceKey = 'distant-sun';
		ambient.userData.lightingRole = 'ambient-fill';

		return ambient;
	}

	/**
	 * Call this method to add or create source-owned endpoint scene lighting.
	 *
	 * @param {LightSourceThreeLightingRequest} request - Three, scene, direction, focus, intensity, ambient, and shadow policy.
	 * @returns {LightSourceThreeLightingObjects} - The source-owned Three lights.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	addSceneLighting(request) {
		if (!request || typeof request !== 'object') {
			throw new TypeError('DistantSunLightSource.addSceneLighting requires THREE lighting constructors.');
		}
		const threeCandidate = /** @type {Partial<DistantThreeNamespace>} */ (request.THREE);

		if (
			!threeCandidate ||
			typeof threeCandidate.DirectionalLight !== 'function' ||
			typeof threeCandidate.AmbientLight !== 'function' ||
			typeof threeCandidate.Object3D !== 'function'
		) {
			throw new TypeError('DistantSunLightSource.addSceneLighting requires THREE lighting constructors.');
		}
		const THREE = /** @type {DistantThreeNamespace} */ (threeCandidate);

		const focus = SceneMath.positionOrDefault(
			request.focus,
			SceneMath.positionInSceneUnits([0, 0, 0]),
			'DistantSunLightSource',
			'focus',
		);
		const directionToSourceScene = LightSourceRequestValues.normalizeDirection(
			request.directionToSource === undefined ? this._configuration.directionToLight : request.directionToSource,
			'directionToSource',
		);
		const requestedLightDistance = SceneMath.distanceOrDefault(
			request.lightDistance,
			SceneMath.inSceneUnits(100),
			'DistantSunLightSource',
			'lightDistance',
		);
		if (requestedLightDistance.value <= 0) {
			throw new RangeError('lightDistance must be greater than zero.');
		}
		const lightDistanceSceneUnits = requestedLightDistance.value;
		const lightDistance = SceneMath.inSceneUnits(lightDistanceSceneUnits);
		const intensity = ValueValidation.finiteNumberOrDefault(request.intensity, 3, 'intensity');
		const sceneLightScales = this._source.resolveSceneLightScales({
			...request,
			directionToSource: directionToSourceScene,
		});
		const ambientIntensityRange = SceneLightingMath.ambientIntensityRangeOrDefault(
			request.ambientIntensityRange,
			DEFAULT_DISTANT_SUN_SCENE_AMBIENT_INTENSITY_RANGE.min,
			ValueValidation.finiteNumberOrDefault(
				request.ambientIntensity,
				DEFAULT_DISTANT_SUN_SCENE_AMBIENT_INTENSITY_RANGE.max,
				'ambientIntensity',
			),
		);
		const ambientLightScaleValue = sceneLightScales.ambientLightScale.value;
		const ambientIntensity = SceneLightingMath.scaleRange(ambientIntensityRange, ambientLightScaleValue);
		const shadow = this._normalizeShadowRequest(request.shadow, focus, lightDistance);
		const shadowObjects = shadow.objects;
		const sourceLights =
			shadowObjects.length > 0
				? shadowObjects.map(
						/**
						 * Called by Array.prototype.map to transform one collection value.
						 * @param shadowObject - The shadow object value accepted by the operation.
						 * @param index - The zero-based index accepted by the operation.
						 * @returns - The callback result returned to its caller.
						 */ (shadowObject, index) =>
							this._createDirectionalLight({
								THREE,
								directionToSource: directionToSourceScene,
								intensity: intensity / shadowObjects.length,
								focus: shadowObject.focus,
								lightDistance: shadowObject.lightDistance,
								shadowObject,
								objectIndex: index,
							}),
					)
				: [
						this._createDirectionalLight({
							THREE,
							directionToSource: directionToSourceScene,
							intensity,
							focus,
							lightDistance,
							shadowObject: null,
							objectIndex: 0,
						}),
					];
		const sceneObjects = sourceLights.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ ({target}) => target,
		);
		const lights = /** @type {Array<DistantThreeDirectionalLight | DistantThreeObject>} */ (
			sourceLights.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param input1 - The destructured input accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ ({light}) => light,
			)
		);
		const primaryShadow = shadowObjects[0] ?? null;

		if (ambientIntensity > 0) {
			lights.unshift(
				this._createThreeAmbientLight({
					THREE,
					ambientIntensity,
				}),
			);
		}

		const result = {
			lights,
			sceneObjects,
			metadata: {
				owner: 'DistantSunLightSource',
				sourceKey: 'distant-sun',
				lightingPolicy: 'source-driven-distant-directional-light',
				intensity,
				ambientIntensity,
				ambientIntensityRange,
				ambientLightScale: sceneLightScales.ambientLightScale,
				directLightScale: sceneLightScales.directLightScale,
				directionToSource: directionToSourceScene,
				directionToSourceModel: this._configuration.directionToLight,
				focus: primaryShadow?.focus ?? focus,
				lightDistance: primaryShadow?.lightDistance ?? lightDistance,
				shadowPolicy: shadow.enabled ? 'three-shadow-map-from-distant-source-direction' : 'shadows-disabled',
				shadow,
			},
		};

		ThreeLighting.addObjectsToScene(request.scene, result);

		return result;
	}

	/**
	 * Call this method to configure an app-authored Three object tree for source shadows.
	 *
	 * @param {unknown} object - The Three object to configure.
	 * @param {DistantSunShadowObjectConfiguration} [request] - The shadow flag overrides.
	 * @returns {unknown} - The configured object.
	 *
	 */
	configureThreeShadowObject(object, request = {}) {
		return ThreeLighting.configureShadowObject(
			object,
			{
				owner: 'DistantSunLightSource',
				sourceKey: 'distant-sun',
				shadowPolicy: 'three-shadow-map-from-distant-source-direction',
			},
			request,
		);
	}
}
