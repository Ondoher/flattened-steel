import {LightSourceRequestValues} from '../../../light-source-support/LightSourceRequestValues.js';
import {SceneLightingMath} from '../../../light-source-support/three/SceneLightingMath.js';
import {ThreeLighting} from '../../../light-source-support/three/ThreeLighting.js';
import {UnitMath} from '../../../physical-quantities/UnitMath.js';
import {LOCAL_SUN_DEFAULT_SCENE_AMBIENT_INTENSITY_RANGE} from '../consts.js';
import SceneMath from '../../../math/SceneMath.js';
import {ValueValidation} from '../../../validation/ValueValidation.js';
import {PixelMath} from '../../../math/PixelMath.js';

/**
 * Endpoint scene-lighting and Three adaptation for a finite local Sun.
 */
export class LocalSunSceneLightingAdapter {
	/**
	 * Physical local-Sun facade retained for dynamic lighting dispatch.
	 * @type {LocalSunSceneLightingSource}
	 */
	_source;
	/**
	 * Normalized physical source configuration retained by reference.
	 * @type {LocalSunLightSourceConfiguration}
	 */
	_configuration;

	/**
	 * Called by LocalSunSceneLightingAdapter to normalize the endpoint scene-light scale policy. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {unknown} value - The candidate policy.
	 * @returns {LocalSunEndpointSceneLightScalePolicy} - The resolved policy.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_endpointSceneLightScalePolicyOrDefault(value) {
		if (value === undefined || value === 'endpoint-material-shading') {
			return 'endpoint-material-shading';
		}
		if (value === 'observer-incident-scale') {
			return 'observer-incident-scale';
		}

		throw new TypeError(
			'endpointSceneLightScalePolicy must be endpoint-material-shading or observer-incident-scale.',
		);
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to describe the directional shadow attenuation policy. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {LocalSunEndpointSceneLightScalePolicy} endpointSceneLightScalePolicy - The endpoint policy.
	 * @returns {string} - The policy explanation.
	 */
	_distanceAttenuationPolicyForDirectionalShadow(endpointSceneLightScalePolicy) {
		return endpointSceneLightScalePolicy === 'observer-incident-scale'
			? 'Directional shadow light uses the local source direction and observer incident scale for endpoint scene shading/shadows; Algorithm32 transport also applies finite source scale.'
			: 'Directional shadow light uses the local source direction for endpoint material shading/shadows; Algorithm32 transport applies finite source scale.';
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to describe the point-light attenuation policy. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {LocalSunEndpointSceneLightScalePolicy} endpointSceneLightScalePolicy - The endpoint policy.
	 * @returns {string} - The policy explanation.
	 */
	_distanceAttenuationPolicyForPointLight(endpointSceneLightScalePolicy) {
		return endpointSceneLightScalePolicy === 'observer-incident-scale'
			? 'PointLight uses decay=0 and observer incident scale for endpoint scene shading; Algorithm32 transport also applies finite source scale.'
			: 'PointLight uses decay=0 and transport-neutral endpoint material shading intensity; Algorithm32 transport applies finite source scale.';
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to create a local-source point light.
	 *
	 * @param {LocalSunPointLightRequest} request - The point-light construction facts.
	 * @returns {LocalThreeLight} - The created Three point light.
	 */
	_createSourcePointLight({
		THREE,
		sourceKey,
		intensity,
		sourcePosition,
		observerIncidentScale,
		endpointSceneIncidentScale,
		calibrationScalar,
		endpointSceneLightScalePolicy,
	}) {
		const pointLight = new THREE.PointLight(0xffffff, intensity, 0, 0);
		const sourcePositionSceneUnits = sourcePosition.coordinates;

		pointLight.name = `${sourceKey}-source-driven-point-light`;
		pointLight.position.set(...sourcePositionSceneUnits);
		pointLight.userData.algorithm32SourceLight = true;
		pointLight.userData.sourceKey = sourceKey;
		pointLight.userData.observerIncidentScale = observerIncidentScale;
		pointLight.userData.endpointSceneIncidentScale = endpointSceneIncidentScale;
		pointLight.userData.endpointSceneLightScalePolicy = endpointSceneLightScalePolicy;
		pointLight.userData.calibrationScalar = calibrationScalar;
		pointLight.userData.distanceAttenuationPolicy =
			this._distanceAttenuationPolicyForPointLight(endpointSceneLightScalePolicy);

		return pointLight;
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to resolve the opposite fill direction.
	 *
	 * @param {UnitVector3} directionToSourceScene - The scene-space source direction.
	 * @returns {UnitVector3} - The fill direction.
	 */
	_oppositeDirectionalFillDirection(directionToSourceScene) {
		const horizontalOpposite = [
			-directionToSourceScene[0],
			Math.abs(directionToSourceScene[1]),
			-directionToSourceScene[2],
		];

		return LightSourceRequestValues.normalizeDirection(horizontalOpposite, 'opposite directional fill direction');
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to resolve the direction between two scene points.
	 *
	 * @param {readonly number[]} from - The start point.
	 * @param {readonly number[]} targetPosition - The end point.
	 * @returns {UnitVector3} - The direction from start to end.
	 */
	_directionBetweenScenePoints(from, targetPosition) {
		const delta = [targetPosition[0] - from[0], targetPosition[1] - from[1], targetPosition[2] - from[2]];

		return LightSourceRequestValues.normalizeDirection(delta, 'source direction in scene space');
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to create a directional shadow light from the shadow focus.
	 *
	 * @param {LocalSunShadowDirectionalLightRequest} request - The directional shadow-light construction facts.
	 * @returns {LocalThreeDirectionalLight} - The created Three directional light.
	 */
	_createShadowDirectionalLight({
		THREE,
		sourceKey,
		intensity,
		sourcePosition,
		shadowObject,
		objectIndex = 0,
		sceneObjects,
	}) {
		const light = new THREE.DirectionalLight(0xffffff, intensity);
		const target = new THREE.Object3D();
		const sourcePositionSceneUnits = sourcePosition.coordinates;
		const focusSceneUnits = shadowObject.focus.coordinates;
		const lightDistanceSceneUnits = shadowObject.lightDistance.value;
		const directionToSourceScene = this._directionBetweenScenePoints(focusSceneUnits, sourcePositionSceneUnits);

		light.name = `${sourceKey}-source-driven-shadow-directional-light-${objectIndex}`;
		light.position.set(
			focusSceneUnits[0] + directionToSourceScene[0] * lightDistanceSceneUnits,
			focusSceneUnits[1] + directionToSourceScene[1] * lightDistanceSceneUnits,
			focusSceneUnits[2] + directionToSourceScene[2] * lightDistanceSceneUnits,
		);
		target.name = `${sourceKey}-source-driven-shadow-target-${objectIndex}`;
		target.position.set(...focusSceneUnits);
		light.target = target;
		light.castShadow = true;

		if (light.shadow) {
			if (light.shadow.mapSize) {
				light.shadow.mapSize.width = shadowObject.mapSize.width;
				light.shadow.mapSize.height = shadowObject.mapSize.height;
			}
			if (light.shadow.camera) {
				light.shadow.camera.left = shadowObject.cameraLeft.value;
				light.shadow.camera.right = shadowObject.cameraRight.value;
				light.shadow.camera.top = shadowObject.cameraTop.value;
				light.shadow.camera.bottom = shadowObject.cameraBottom.value;
				light.shadow.camera.near = shadowObject.cameraNear.value;
				light.shadow.camera.far = shadowObject.cameraFar.value;
				ThreeLighting.applyLayerIndex(light.shadow.camera, shadowObject.layerIndex);
				light.shadow.camera.updateProjectionMatrix?.();
			}
			light.shadow.bias = shadowObject.bias;
			light.shadow.normalBias = shadowObject.normalBias.value;
			light.shadow.radius = shadowObject.radius.value;
			light.shadow.intensity = shadowObject.shadowIntensity;
		}

		light.userData.algorithm32SourceLight = true;
		light.userData.sourceKey = sourceKey;
		light.userData.shadowPolicy = 'three-shadow-map-from-local-source-direction';
		light.userData.shadowObjectKey = shadowObject.objectKey;
		light.userData.shadowLayerIndex = shadowObject.layerIndex;
		light.userData.directionToSource = directionToSourceScene;
		light.userData.shadowFocus = shadowObject.focus;
		light.userData.sourcePosition = sourcePosition;
		target.userData.algorithm32SourceLight = true;
		target.userData.sourceKey = sourceKey;
		target.userData.shadowPolicy = 'three-shadow-map-target';
		target.userData.shadowObjectKey = shadowObject.objectKey;
		target.userData.shadowLayerIndex = shadowObject.layerIndex;
		sceneObjects.push(target);

		return light;
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to create an opposite-direction endpoint fill light.
	 *
	 * @param {LocalSunOppositeDirectionalFillLightRequest} request - The opposite-direction fill construction facts.
	 * @returns {LocalThreeDirectionalLight} - The created Three directional light.
	 */
	_createOppositeDirectionalFillLight({
		THREE,
		sourceKey,
		intensity,
		directionToSource,
		focus,
		distance,
		sceneObjects,
	}) {
		const directionToSourceScene = directionToSource;
		const fillDirection = this._oppositeDirectionalFillDirection(directionToSourceScene);
		const light = new THREE.DirectionalLight(0xffffff, intensity);
		const target = new THREE.Object3D();
		const focusSceneUnits = focus.coordinates;
		const distanceSceneUnits = distance.value;

		light.name = `${sourceKey}-opposite-directional-endpoint-fill`;
		light.position.set(
			focusSceneUnits[0] + fillDirection[0] * distanceSceneUnits,
			focusSceneUnits[1] + fillDirection[1] * distanceSceneUnits,
			focusSceneUnits[2] + fillDirection[2] * distanceSceneUnits,
		);
		target.name = `${sourceKey}-opposite-directional-endpoint-fill-target`;
		target.position.set(...focusSceneUnits);
		light.target = target;
		light.castShadow = false;
		light.userData.algorithm32SourceLight = true;
		light.userData.sourceKey = sourceKey;
		light.userData.lightingRole = 'opposite-directional-endpoint-fill';
		light.userData.endpointColorStatus = 'vacuum-endpoint-directional-fill-approximation';
		target.userData.algorithm32SourceLight = true;
		target.userData.sourceKey = sourceKey;
		target.userData.lightingRole = 'opposite-directional-endpoint-fill-target';
		sceneObjects.push(target);

		return light;
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to create a source-direction falloff endpoint fill light.
	 *
	 * @param {LocalSunSourceDirectionFalloffFillLightRequest} request - The source-direction falloff-fill facts.
	 * @returns {LocalThreeLight} - The created Three point light.
	 */
	_createSourceDirectionFalloffFillLight({
		THREE,
		sourceKey,
		targetIntensity,
		directionToSource,
		focus,
		distance,
		sceneObjects,
	}) {
		const directionToSourceScene = directionToSource;
		const fillDirection = LightSourceRequestValues.normalizeDirection(
			[directionToSourceScene[0], Math.abs(directionToSourceScene[1]), directionToSourceScene[2]],
			'source-direction falloff fill direction',
		);
		const focusSceneUnits = focus.coordinates;
		const lightDistanceSceneUnits = distance.value;
		const calibratedIntensity = targetIntensity * lightDistanceSceneUnits * lightDistanceSceneUnits;
		const light = new THREE.PointLight(0xffffff, calibratedIntensity, 0, 2);
		const marker = new THREE.Object3D();

		light.name = `${sourceKey}-source-direction-falloff-endpoint-fill`;
		light.position.set(
			focusSceneUnits[0] + fillDirection[0] * lightDistanceSceneUnits,
			focusSceneUnits[1] + fillDirection[1] * lightDistanceSceneUnits,
			focusSceneUnits[2] + fillDirection[2] * lightDistanceSceneUnits,
		);
		light.castShadow = false;
		light.userData.algorithm32SourceLight = true;
		light.userData.sourceKey = sourceKey;
		light.userData.lightingRole = 'source-direction-falloff-endpoint-fill';
		light.userData.endpointColorStatus = 'vacuum-endpoint-source-direction-falloff-fill-approximation';
		light.userData.targetIntensityAtFocus = targetIntensity;
		light.userData.distance = SceneMath.inSceneUnits(lightDistanceSceneUnits);
		light.userData.decay = 2;
		marker.name = `${sourceKey}-source-direction-falloff-endpoint-fill-anchor`;
		marker.position.set(...focusSceneUnits);
		marker.userData.algorithm32SourceLight = true;
		marker.userData.sourceKey = sourceKey;
		marker.userData.lightingRole = 'source-direction-falloff-endpoint-fill-anchor';
		sceneObjects.push(marker);

		return light;
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to normalize one shadow object request.
	 *
	 * @param {LocalSunShadowObjectNormalizationRequest} shadowObject - The candidate shadow object configuration.
	 * @param {number} defaultShadowIntensity - The default split-light shadow opacity.
	 * @returns {LocalSunNormalizedShadowObject} - The normalized shadow object.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_normalizeShadowObjectRequest(shadowObject, defaultShadowIntensity = 1) {
		const focus = SceneMath.positionOrDefault(
			shadowObject.focus,
			SceneMath.positionInSceneUnits([0, 0, 0]),
			'LocalSunLightSource',
			'shadow.focus',
		);
		const requestedExtent = SceneMath.distanceOrDefault(
			shadowObject.extent,
			SceneMath.inSceneUnits(20),
			'LocalSunLightSource',
			'shadow.extent',
		);
		if (requestedExtent.value <= 0) {
			throw new RangeError('shadow.extent must be greater than zero.');
		}
		const extentSceneUnits = requestedExtent.value;
		const extent = SceneMath.inSceneUnits(extentSceneUnits);
		const requestedLightDistance = SceneMath.distanceOrDefault(
			shadowObject.lightDistance,
			SceneMath.inSceneUnits(extentSceneUnits * 4),
			'LocalSunLightSource',
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
			'LocalSunLightSource',
			'shadow.cameraNear',
		);
		if (requestedCameraNear.value <= 0) {
			throw new RangeError('shadow.cameraNear must be greater than zero.');
		}
		const cameraNearSceneUnits = requestedCameraNear.value;
		const requestedCameraFar = SceneMath.distanceOrDefault(
			shadowObject.cameraFar,
			SceneMath.inSceneUnits(lightDistanceSceneUnits + extentSceneUnits * 4),
			'LocalSunLightSource',
			'shadow.cameraFar',
		);
		if (requestedCameraFar.value <= cameraNearSceneUnits) {
			throw new RangeError('shadow.cameraFar must be greater than shadow.cameraNear.');
		}
		const cameraFarSceneUnits = requestedCameraFar.value;
		const cameraLeftSceneUnits = SceneMath.distanceOrDefault(
			shadowObject.cameraLeft,
			SceneMath.inSceneUnits(-extentSceneUnits),
			'LocalSunLightSource',
			'shadow.cameraLeft',
		).value;
		const requestedCameraRight = SceneMath.distanceOrDefault(
			shadowObject.cameraRight,
			SceneMath.inSceneUnits(extentSceneUnits),
			'LocalSunLightSource',
			'shadow.cameraRight',
		).value;
		if (requestedCameraRight <= cameraLeftSceneUnits) {
			throw new RangeError('shadow.cameraRight must be greater than shadow.cameraLeft.');
		}
		const cameraRightSceneUnits = requestedCameraRight;
		const cameraBottomSceneUnits = SceneMath.distanceOrDefault(
			shadowObject.cameraBottom,
			SceneMath.inSceneUnits(-extentSceneUnits),
			'LocalSunLightSource',
			'shadow.cameraBottom',
		).value;
		const requestedCameraTop = SceneMath.distanceOrDefault(
			shadowObject.cameraTop,
			SceneMath.inSceneUnits(extentSceneUnits),
			'LocalSunLightSource',
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
			'LocalSunLightSource',
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
			focus,
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
			objectKey: shadowObject.objectKey,
			layerIndex: ThreeLighting.layerIndexOrNull(shadowObject.layerIndex),
		};
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to normalize the canonical shadow request. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {LightSourceThreeShadowRequest | undefined} shadow - The candidate shadow configuration.
	 * @returns {LocalSunNormalizedShadowRequest} - The normalized shadow request.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_normalizeShadowRequest(shadow) {
		if (shadow === undefined) {
			return {enabled: false, objects: []};
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
			 */ (object, index) => {
				return this._normalizeShadowObjectRequest(
					{
						...object,
						objectKey: ValueValidation.requiredStringOrDefault(
							object.objectKey,
							`shadow-object-${index}`,
							`shadow.objects[${index}].objectKey`,
						),
					},
					defaultShadowIntensity,
				);
			},
		);

		return {enabled: true, objects};
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to normalize the endpoint indirect-fill policy. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {unknown} policy - The candidate policy.
	 * @returns {LocalSunEndpointIndirectFillPolicy} - The resolved policy.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_endpointIndirectFillPolicyOrDefault(policy) {
		if (policy === undefined || policy === 'general-ambient-fill') {
			return 'general-ambient-fill';
		}
		if (policy === 'opposite-directional-fill') {
			return 'opposite-directional-fill';
		}
		if (policy === 'source-direction-falloff-fill') {
			return 'source-direction-falloff-fill';
		}

		throw new TypeError(
			'endpointIndirectFill.policy must be general-ambient-fill, opposite-directional-fill, or source-direction-falloff-fill.',
		);
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to normalize an optional endpoint indirect-fill request. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {LightSourceThreeEndpointIndirectFillRequest | undefined} endpointIndirectFill - The candidate fill configuration.
	 * @returns {LocalSunNormalizedEndpointIndirectFill | null} - The normalized fill request.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_endpointIndirectFillRequestOrNull(endpointIndirectFill) {
		if (endpointIndirectFill === undefined) {
			return null;
		}
		const policy = this._endpointIndirectFillPolicyOrDefault(endpointIndirectFill.policy);
		const intensityRatio = ValueValidation.finiteNumberOrDefault(
			endpointIndirectFill.intensityRatio,
			0.25,
			'endpointIndirectFill.intensityRatio',
		);
		if (intensityRatio < 0) {
			throw new RangeError('endpointIndirectFill.intensityRatio must be non-negative.');
		}
		const distance = SceneMath.distanceOrDefault(
			endpointIndirectFill.distance,
			SceneMath.inSceneUnits(100),
			'LocalSunLightSource',
			'endpointIndirectFill.distance',
		);
		if (distance.value <= 0) {
			throw new RangeError('endpointIndirectFill.distance must be greater than zero.');
		}

		if (!endpointIndirectFill.enabled) {
			return null;
		}

		return {
			enabled: true,
			policy,
			intensityRatio,
			distance,
		};
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to resolve the endpoint indirect-fill metadata role. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {LocalSunEndpointIndirectFillPolicy} policy - The fill policy.
	 * @returns {string} - The metadata role.
	 */
	_endpointIndirectFillRole(policy) {
		if (policy === 'opposite-directional-fill') {
			return 'vacuum-endpoint-opposite-directional-approximation';
		}
		if (policy === 'source-direction-falloff-fill') {
			return 'vacuum-endpoint-source-direction-falloff-approximation';
		}
		return 'vacuum-endpoint-general-ambient-approximation';
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to resolve endpoint indirect-fill direction metadata. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {LocalSunEndpointIndirectFillPolicy} policy - The fill policy.
	 * @param {UnitVector3} directionToSourceScene - The scene-space source direction.
	 * @returns {UnitVector3 | null} - The fill direction metadata.
	 */
	_endpointIndirectFillDirection(policy, directionToSourceScene) {
		if (policy === 'opposite-directional-fill') {
			return this._oppositeDirectionalFillDirection(directionToSourceScene);
		}
		if (policy === 'source-direction-falloff-fill') {
			return LightSourceRequestValues.normalizeDirection(
				[directionToSourceScene[0], Math.abs(directionToSourceScene[1]), directionToSourceScene[2]],
				'source-direction falloff fill direction',
			);
		}
		return null;
	}

	/**
	 * Creates the endpoint scene-lighting adapter for one configured local source.
	 *
	 * @param {LocalSunSceneLightingAdapterDefinition} definition - The physical source and its normalized configuration.
	 */
	constructor({source, configuration}) {
		this._source = source;
		this._configuration = configuration;
	}

	/**
	 * Call this method to resolve neutral local scene-light scales for a finite source.
	 *
	 * @param {LightSourceSceneLightScalesRequest} [request] - The source-relative observer facts.
	 * @returns {LightSourceSceneLightScales} - The direct and ambient light scales.
	 *
	 */
	resolveSceneLightScales(request = {}) {
		const directLighting = this._source.sampleDirectLighting({
			sourceRelativePosition: request.sourceRelativePosition,
		});
		const metadata = /** @type {{ readonly incidentScale: number }} */ (directLighting.metadata);
		const referenceScale = Math.max(Number.EPSILON, this._configuration.referenceSpectralIncidentScale);
		const localLightScaleValue = SceneLightingMath.clamp01(metadata.incidentScale / referenceScale);
		/** @type {Dimensionless} */
		const localLightScale = UnitMath.createUnitValue({value: localLightScaleValue, units: '1'});

		return {
			directLightScale: localLightScale,
			ambientLightScale: localLightScale,
			localLightScale,
			policy: 'local-source-reference-incident-scene-light-scale',
		};
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to resolve normalized source-owned endpoint lighting facts.
	 *
	 * @param {LightSourceThreeLightingRequest} request - The accepted endpoint request.
	 * @returns {LocalSunEndpointLightingFacts} - The normalized endpoint lighting facts.
	 */
	_resolveEndpointLightingFacts(request) {
		const directLighting = this._source.sampleDirectLighting({
			sourceRelativePosition: request.sourceRelativePosition,
		});
		const metadata = /** @type {{ readonly incidentScale: number }} */ (directLighting.metadata);
		const observerIncidentScale = metadata.incidentScale;
		const calibrationScalar = ValueValidation.finiteNumberOrDefault(
			request.calibrationScalar,
			2.4,
			'calibrationScalar',
		);
		const sceneLightScales = this._source.resolveSceneLightScales(request);
		const ambientLightScale = sceneLightScales.ambientLightScale;
		const endpointSceneLightScalePolicy = this._endpointSceneLightScalePolicyOrDefault(
			request.endpointSceneLightScalePolicy,
		);
		const endpointSceneIncidentScale =
			endpointSceneLightScalePolicy === 'observer-incident-scale' ? observerIncidentScale : 1;
		const ambientIntensityRange = SceneLightingMath.ambientIntensityRangeOrDefault(
			request.ambientIntensityRange,
			LOCAL_SUN_DEFAULT_SCENE_AMBIENT_INTENSITY_RANGE.min,
			ValueValidation.finiteNumberOrDefault(
				request.ambientIntensity,
				LOCAL_SUN_DEFAULT_SCENE_AMBIENT_INTENSITY_RANGE.max,
				'ambientIntensity',
			),
		);
		const ambientLightScaleValue = ambientLightScale.value;
		const ambientIntensity = SceneLightingMath.scaleRange(ambientIntensityRange, ambientLightScaleValue);

		return {
			directLighting,
			metadata,
			observerIncidentScale,
			calibrationScalar,
			ambientIntensityRange,
			ambientLightScale,
			endpointSceneLightScalePolicy,
			endpointSceneIncidentScale,
			ambientIntensity,
		};
	}

	/**
	 * Called by LocalSunSceneLightingAdapter to create the source-owned ambient fill light.
	 *
	 * @param {LocalSunAmbientLightRequest} request - The Three and source-relative lighting facts.
	 * @returns {LocalThreeLight} - The created Three AmbientLight.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_createThreeAmbientLight(request) {
		const threeCandidate = /** @type {Partial<LocalThreeNamespace>} */ (request.THREE);

		if (!threeCandidate || typeof threeCandidate.AmbientLight !== 'function') {
			throw new TypeError('LocalSunLightSource.addSceneLighting requires THREE.AmbientLight.');
		}
		const THREE = /** @type {LocalThreeNamespace} */ (threeCandidate);

		const ambientIntensityValue =
			request.resolvedAmbientIntensity === undefined
				? this._resolveEndpointLightingFacts(request).ambientIntensity
				: ValueValidation.finiteNumberOrDefault(
						request.resolvedAmbientIntensity,
						0,
						'resolvedAmbientIntensity',
					);
		if (ambientIntensityValue < 0) {
			throw new RangeError('LocalSunLightSource ambient intensity must be non-negative.');
		}
		const ambientIntensity = ambientIntensityValue;
		const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity);

		ambient.name = `${this._configuration.sourceKey}-ambient-fill`;
		ambient.userData.algorithm32SourceLight = true;
		ambient.userData.sourceKey = this._configuration.sourceKey;
		ambient.userData.lightingRole = 'ambient-fill';

		return ambient;
	}

	/**
	 * Call this method to add or create source-owned endpoint scene lighting.
	 *
	 * @param {LightSourceThreeLightingRequest} request - The Three constructors,
	 * optional scene, source-relative facts, scene positions, and shadow/fill policy.
	 * @returns {LightSourceThreeLightingObjects} - The source-owned Three lights.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	addSceneLighting(request) {
		if (!request || typeof request !== 'object') {
			throw new TypeError('LocalSunLightSource.addSceneLighting requires THREE lighting constructors.');
		}
		const threeCandidate = /** @type {Partial<LocalThreeNamespace>} */ (request.THREE);

		if (
			!threeCandidate ||
			typeof threeCandidate.AmbientLight !== 'function' ||
			typeof threeCandidate.PointLight !== 'function' ||
			typeof threeCandidate.DirectionalLight !== 'function' ||
			typeof threeCandidate.Object3D !== 'function'
		) {
			throw new TypeError('LocalSunLightSource.addSceneLighting requires THREE lighting constructors.');
		}
		const THREE = /** @type {LocalThreeNamespace} */ (threeCandidate);

		const sourcePosition = SceneMath.positionOrDefault(
			request.sourcePosition,
			null,
			'LocalSunLightSource',
			'sourcePosition',
		);
		const observerPosition = SceneMath.positionOrDefault(
			request.observerPosition,
			SceneMath.positionInSceneUnits([0, 0, 0]),
			'LocalSunLightSource',
			'observerPosition',
		);
		const sourcePositionSceneUnits = sourcePosition.coordinates;
		const observerPositionSceneUnits = observerPosition.coordinates;
		const lightingFacts = this._resolveEndpointLightingFacts(request);
		const {
			metadata,
			observerIncidentScale,
			calibrationScalar,
			ambientIntensityRange,
			ambientLightScale,
			endpointSceneLightScalePolicy,
			endpointSceneIncidentScale,
			ambientIntensity,
		} = lightingFacts;
		const pointLightIntensity = calibrationScalar * endpointSceneIncidentScale;
		const endpointIndirectFill = this._endpointIndirectFillRequestOrNull(request.endpointIndirectFill);
		const endpointIndirectFillIntensity = endpointIndirectFill
			? pointLightIntensity * endpointIndirectFill.intensityRatio
			: 0;
		const ambient = this._createThreeAmbientLight({
			THREE,
			resolvedAmbientIntensity:
				ambientIntensity +
				(endpointIndirectFill?.policy === 'general-ambient-fill' ? endpointIndirectFillIntensity : 0),
		});
		const directionToSourceScene = this._directionBetweenScenePoints(
			observerPositionSceneUnits,
			sourcePositionSceneUnits,
		);
		const shadow = this._normalizeShadowRequest(request.shadow);
		const shadowObjects = shadow.objects;
		const sceneObjects = [];
		const sourceDrivenLights =
			shadowObjects.length > 0
				? shadowObjects.map(
						/**
						 * Called by Array.prototype.map to transform one collection value.
						 * @param shadowObject - The shadow object value accepted by the operation.
						 * @param index - The zero-based index accepted by the operation.
						 * @returns - The callback result returned to its caller.
						 */ (shadowObject, index) =>
							this._createShadowDirectionalLight({
								THREE,
								sourceKey: this._configuration.sourceKey,
								intensity: pointLightIntensity / shadowObjects.length,
								sourcePosition,
								shadowObject,
								objectIndex: index,
								sceneObjects,
							}),
					)
				: this._createSourcePointLight({
						THREE,
						sourceKey: this._configuration.sourceKey,
						intensity: pointLightIntensity,
						sourcePosition,
						observerIncidentScale,
						endpointSceneIncidentScale,
						calibrationScalar,
						endpointSceneLightScalePolicy,
					});
		const endpointDirectionalFillLight =
			endpointIndirectFill?.policy === 'opposite-directional-fill'
				? this._createOppositeDirectionalFillLight({
						THREE,
						sourceKey: this._configuration.sourceKey,
						intensity: endpointIndirectFillIntensity,
						directionToSource: directionToSourceScene,
						focus: observerPosition,
						distance: endpointIndirectFill.distance,
						sceneObjects,
					})
				: null;
		const endpointSourceFalloffFillLight =
			endpointIndirectFill?.policy === 'source-direction-falloff-fill'
				? this._createSourceDirectionFalloffFillLight({
						THREE,
						sourceKey: this._configuration.sourceKey,
						targetIntensity: endpointIndirectFillIntensity,
						directionToSource: directionToSourceScene,
						focus: observerPosition,
						distance: endpointIndirectFill.distance,
						sceneObjects,
					})
				: null;

		const result = {
			lights: [
				ambient,
				...(Array.isArray(sourceDrivenLights) ? sourceDrivenLights : [sourceDrivenLights]),
				...(endpointDirectionalFillLight ? [endpointDirectionalFillLight] : []),
				...(endpointSourceFalloffFillLight ? [endpointSourceFalloffFillLight] : []),
			],
			sceneObjects: sceneObjects,
			metadata: {
				owner: 'LocalSunLightSource',
				lightingPolicy:
					shadowObjects.length > 0
						? 'source-driven-flat-local-directional-shadow-light'
						: 'source-driven-flat-local-point-light',
				endpointColorStatus: ValueValidation.requiredStringOrDefault(
					request.endpointColorStatus,
					'three-lambert-shading-captured-from-effect-composer-render-pass',
					'endpointColorStatus',
				),
				ambientIntensityRange,
				ambientLightScale,
				observerScaledAmbientIntensity: ambientIntensity,
				ambientIntensity: ambient.intensity,
				pointLightIntensity,
				endpointIndirectFill: endpointIndirectFill
					? {
							...endpointIndirectFill,
							intensity: endpointIndirectFillIntensity,
							role: this._endpointIndirectFillRole(endpointIndirectFill.policy),
							directionToFillScene: this._endpointIndirectFillDirection(
								endpointIndirectFill.policy,
								directionToSourceScene,
							),
						}
					: {
							enabled: false,
							policy: 'none',
						},
				calibrationScalar,
				observerIncidentScale,
				endpointSceneIncidentScale,
				endpointSceneLightScalePolicy,
				falloffScale: metadata.falloffScale,
				distanceFromSource: metadata.distanceFromSource,
				safeDistance: metadata.safeDistance,
				referenceDistance: metadata.referenceDistance,
				referenceSpectralIncidentScale: metadata.referenceSpectralIncidentScale,
				distanceAttenuationPolicy:
					shadowObjects.length > 0
						? this._distanceAttenuationPolicyForDirectionalShadow(endpointSceneLightScalePolicy)
						: this._distanceAttenuationPolicyForPointLight(endpointSceneLightScalePolicy),
				shadowPolicy: shadow.enabled ? 'three-shadow-map-from-local-source-direction' : 'shadows-disabled',
				shadow,
				shadowDirectionPolicy: shadowObjects.length > 0 ? 'per-shadow-focus-to-local-source-position' : 'none',
				directionToSource: directionToSourceScene,
				directionToSourceModel: lightingFacts.directLighting.directionToLight,
				sourcePosition,
				observerPosition,
				sourceKey: this._configuration.sourceKey,
			},
		};

		ThreeLighting.addObjectsToScene(request.scene, result);

		return result;
	}

	/**
	 * Call this method to configure an app-authored Three object tree for source shadows.
	 *
	 * @param {unknown} object - The Three object to configure.
	 * @param {LocalSunThreeShadowConfigurationRequest} [request] - The shadow flag overrides.
	 * @returns {unknown} - The configured object.
	 *
	 */
	configureThreeShadowObject(object, request = {}) {
		return ThreeLighting.configureShadowObject(
			object,
			{
				owner: 'LocalSunLightSource',
				sourceKey: this._configuration.sourceKey,
				shadowPolicy: 'three-shadow-map-from-local-source-direction',
			},
			request,
		);
	}
}
