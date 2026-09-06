import { configureThreeShadowObject } from './ThreeShadowObjectConfigurator.js';
import {
	buildLocalSunCpuCache,
} from './local-sun-cpu-cache-build.js';
import {
	createLocalSunLaterOrderScatteringKernel,
} from './local-sun-later-order-scattering-density.js';
import {
	buildLocalSunCpuTransportedRadiance,
} from './local-sun-scattering-density-transport.js';
import LocalSunConstructionDomainSelection from
	'./LocalSunConstructionDomainSelection.js';
import LocalSunConstructionLightSource from
	'./LocalSunConstructionLightSource.js';
import { LocalSunCacheController } from
	'./LocalSunCacheController.js';
import { LocalSunCacheSource } from
	'./LocalSunCacheSource.js';
import {
	createLocalSunShellFactCache,
} from './create-local-sun-shell-fact-cache.js';
import {
	sha256Descriptor,
} from '../descriptors/descriptorSupport.js';
import { createUnitValue } from '../quantities/UnitValue.js';
import { scaleSpectralPacket } from '../quantities/index.js';
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
} from '../profiles/native-15-profile.js';
import { SpectralCalculator } from
	'../implementation/SpectralCalculator.js';
import {
	LOCAL_SUN_CPU_RECURRENCE_PROVENANCE_IDENTITY,
	LOCAL_SUN_DEFAULT_SCENE_AMBIENT_INTENSITY_RANGE,
	LOCAL_SUN_ENDPOINT_INDIRECT_FILL_REQUEST_PROPERTIES,
	LOCAL_SUN_RUNTIME_SHADER_CONTRIBUTION_ID,
	LOCAL_SUN_SHADOW_OBJECT_REQUEST_PROPERTIES,
	LOCAL_SUN_SHADOW_REQUEST_PROPERTIES,
	LOCAL_SUN_SOURCE_TRANSMITTANCE_INTERVAL_COUNT,
	LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
} from './local-sun-consts.js';
import {
	assertLocalSunGeometryPairing,
} from './local-sun-geometry-pairing.js';
import {
	createShaderContribution,
} from '../shader/shaderContribution.js';
import DistanceMath from '../utils/DistanceMath.js';
import { finiteNumberOrDefault } from '../utils/numericValues.js';
import SceneMath from '../utils/SceneMath.js';
import {
	acceptSourceIrradiance,
	clamp01,
	normalizeDirection,
	pixelDistanceOrDefault,
	pixelSizeOrDefault,
	requiredStringOrDefault,
	scaleRange,
	sceneAmbientIntensityRangeOrDefault,
	sceneDistanceOrDefault,
	scenePositionOrDefault,
} from './lightSourceRequestValues.js';
import {
	addLightingObjectsToScene,
	applyLayerIndex,
	assertOnlyProperties,
	layerIndexOrNull,
} from './threeLightingSupport.js';

/**
 * Own direct and endpoint lighting for a finite local sun source.
 */
export class LocalSunLightSource {
	/** @type {LocalSunLightSourceConfiguration} */
	_configuration;
	/** @type {LocalSunShellFactCache} */
	_constructionShellFactCache;
	/** @type {LocalSunConstructionLightSource} */
	_constructionLightSource;

	/**
	 * Normalize the endpoint scene-light scale policy.
	 *
	 * @param {unknown} value - Supplies candidate policy.
	 * @returns {"endpoint-material-shading" | "observer-incident-scale"} Resolved policy.
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
	 * Describe the directional shadow attenuation policy.
	 *
	 * @param {string} endpointSceneLightScalePolicy - Supplies endpoint policy.
	 * @returns {string} Policy explanation.
	 */
	_distanceAttenuationPolicyForDirectionalShadow(endpointSceneLightScalePolicy) {
		return endpointSceneLightScalePolicy === 'observer-incident-scale'
			? 'Directional shadow light uses the local source direction and observer incident scale for endpoint scene shading/shadows; Algorithm32 transport also applies finite source scale.'
			: 'Directional shadow light uses the local source direction for endpoint material shading/shadows; Algorithm32 transport applies finite source scale.';
	}

	/**
	 * Describe the point-light attenuation policy.
	 *
	 * @param {string} endpointSceneLightScalePolicy - Supplies endpoint policy.
	 * @returns {string} Policy explanation.
	 */
	_distanceAttenuationPolicyForPointLight(endpointSceneLightScalePolicy) {
		return endpointSceneLightScalePolicy === 'observer-incident-scale'
			? 'PointLight uses decay=0 and observer incident scale for endpoint scene shading; Algorithm32 transport also applies finite source scale.'
			: 'PointLight uses decay=0 and transport-neutral endpoint material shading intensity; Algorithm32 transport applies finite source scale.';
	}

	/**
	 * Create a local-source point light.
	 *
	 * @param {object} request - Supplies light construction facts.
	 * @returns {LocalThreeLight} The created Three point light.
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
			this._distanceAttenuationPolicyForPointLight(
				endpointSceneLightScalePolicy,
			);

		return pointLight;
	}

	/**
	 * Resolve the opposite fill direction.
	 *
	 * @param {UnitVector3} directionToSourceScene - Supplies scene source direction.
	 * @returns {UnitVector3} Fill direction.
	 */
	_oppositeDirectionalFillDirection(directionToSourceScene) {
		const horizontalOpposite = [
			-directionToSourceScene[0],
			Math.abs(directionToSourceScene[1]),
			-directionToSourceScene[2],
		];

		return normalizeDirection(horizontalOpposite, 'opposite directional fill direction');
	}

	/**
	 * Resolve the direction between two scene points.
	 *
	 * @param {readonly number[]} from - Supplies start point.
	 * @param {readonly number[]} to - Supplies end point.
	 * @returns {UnitVector3} Direction from start to end.
	 */
	_directionBetweenScenePoints(from, to) {
		const delta = [
			to[0] - from[0],
			to[1] - from[1],
			to[2] - from[2],
		];

		return normalizeDirection(delta, 'source direction in scene space');
	}

	/**
	 * Create a directional shadow light from the shadow focus toward the local source.
	 *
	 * @param {object} request - Supplies light construction facts.
	 * @returns {LocalThreeDirectionalLight} The created Three directional light.
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
		const directionToSourceScene =
			this._directionBetweenScenePoints(
				focusSceneUnits,
				sourcePositionSceneUnits,
			);

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
				applyLayerIndex(light.shadow.camera, shadowObject.layerIndex);
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
	 * Create an opposite-direction endpoint fill light.
	 *
	 * @param {object} request - Supplies light construction facts.
	 * @returns {LocalThreeDirectionalLight} The created Three directional light.
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
		const fillDirection =
			this._oppositeDirectionalFillDirection(
				directionToSourceScene,
			);
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
	 * Create a source-direction falloff endpoint fill light.
	 *
	 * @param {object} request - Supplies light construction facts.
	 * @returns {LocalThreeLight} The created Three point light.
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
		const fillDirection = normalizeDirection([
			directionToSourceScene[0],
			Math.abs(directionToSourceScene[1]),
			directionToSourceScene[2],
		], 'source-direction falloff fill direction',
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
	 * Normalize one shadow object request.
	 *
	 * @param {LightSourceThreeShadowObjectRequest} shadowObject - Supplies candidate shadow object config.
	 * @param {number} defaultShadowIntensity - Supplies default split-light shadow opacity.
	 * @returns {object} Normalized shadow config.
	 */
	_normalizeShadowObjectRequest(shadowObject, defaultShadowIntensity = 1) {
		const focus = scenePositionOrDefault(
			shadowObject.focus,
			SceneMath.positionInSceneUnits([0, 0, 0]),
			'LocalSunLightSource',
			'shadow.focus',
		);
		const requestedExtent = sceneDistanceOrDefault(
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
		const requestedLightDistance = sceneDistanceOrDefault(
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
		const requestedCameraNear = sceneDistanceOrDefault(
			shadowObject.cameraNear,
			SceneMath.inSceneUnits(0.1),
			'LocalSunLightSource',
			'shadow.cameraNear',
		);
		if (requestedCameraNear.value <= 0) {
			throw new RangeError('shadow.cameraNear must be greater than zero.');
		}
		const cameraNearSceneUnits = requestedCameraNear.value;
		const requestedCameraFar = sceneDistanceOrDefault(
			shadowObject.cameraFar,
			SceneMath.inSceneUnits(lightDistanceSceneUnits + extentSceneUnits * 4),
			'LocalSunLightSource',
			'shadow.cameraFar',
		);
		if (requestedCameraFar.value <= cameraNearSceneUnits) {
			throw new RangeError('shadow.cameraFar must be greater than shadow.cameraNear.');
		}
		const cameraFarSceneUnits = requestedCameraFar.value;
		const cameraLeftSceneUnits = sceneDistanceOrDefault(
			shadowObject.cameraLeft,
			SceneMath.inSceneUnits(-extentSceneUnits),
			'LocalSunLightSource',
			'shadow.cameraLeft',
		).value;
		const requestedCameraRight = sceneDistanceOrDefault(
			shadowObject.cameraRight,
			SceneMath.inSceneUnits(extentSceneUnits),
			'LocalSunLightSource',
			'shadow.cameraRight',
		).value;
		if (requestedCameraRight <= cameraLeftSceneUnits) {
			throw new RangeError('shadow.cameraRight must be greater than shadow.cameraLeft.');
		}
		const cameraRightSceneUnits = requestedCameraRight;
		const cameraBottomSceneUnits = sceneDistanceOrDefault(
			shadowObject.cameraBottom,
			SceneMath.inSceneUnits(-extentSceneUnits),
			'LocalSunLightSource',
			'shadow.cameraBottom',
		).value;
		const requestedCameraTop = sceneDistanceOrDefault(
			shadowObject.cameraTop,
			SceneMath.inSceneUnits(extentSceneUnits),
			'LocalSunLightSource',
			'shadow.cameraTop',
		).value;
		if (requestedCameraTop <= cameraBottomSceneUnits) {
			throw new RangeError('shadow.cameraTop must be greater than shadow.cameraBottom.');
		}
		const cameraTopSceneUnits = requestedCameraTop;
		const mapSize = pixelSizeOrDefault(
			shadowObject.mapSize,
			{ width: 2048, height: 2048, units: 'pixels' },
			'shadow object mapSize',
		);
		const normalBias = sceneDistanceOrDefault(
			shadowObject.normalBias,
			SceneMath.inSceneUnits(0.02),
			'LocalSunLightSource',
			'shadow object normalBias',
		);
		if (normalBias.value < 0) {
			throw new RangeError('shadow.normalBias must be non-negative.');
		}
		const radius = pixelDistanceOrDefault(
			shadowObject.radius,
			{ value: 1, units: 'pixels' },
			'shadow object radius',
		);

		const shadowIntensity = finiteNumberOrDefault(
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
			bias: finiteNumberOrDefault(shadowObject.bias, -0.00002, 'shadow.bias'),
			normalBias,
			radius,
			shadowIntensity,
			objectKey: shadowObject.objectKey,
			layerIndex: layerIndexOrNull(shadowObject.layerIndex),
		};
	}

	/**
	 * Normalize the canonical shadow request.
	 *
	 * @param {LightSourceThreeShadowRequest | undefined} shadow - Supplies candidate shadow config.
	 * @returns {{ enabled: boolean, objects: readonly object[] }} Normalized shadow config.
	 */
	_normalizeShadowRequest(shadow) {
		if (shadow === undefined) {
			return { enabled: false, objects: [] };
		}

		if (shadow === null || typeof shadow !== 'object' || Array.isArray(shadow)) {
			throw new TypeError('shadow must contain enabled and objects.');
		}
		assertOnlyProperties(
			shadow,
			LOCAL_SUN_SHADOW_REQUEST_PROPERTIES,
			'shadow',
		);

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

			return { enabled: false, objects: [] };
		}
		if (shadow.objects.length < 1) {
			throw new RangeError('Enabled shadow requests require at least one shadow object.');
		}

		const defaultShadowIntensity = shadow.objects.length;
		const objects = shadow.objects.map((object, index) => {
			if (!object || typeof object !== 'object' || Array.isArray(object)) {
				throw new TypeError(`shadow.objects[${index}] must be an object.`);
			}
			assertOnlyProperties(
				object,
				LOCAL_SUN_SHADOW_OBJECT_REQUEST_PROPERTIES,
				`shadow.objects[${index}]`,
			);

			return this._normalizeShadowObjectRequest({
				...object,
				objectKey: requiredStringOrDefault(
					object.objectKey,
					`shadow-object-${index}`,
					`shadow.objects[${index}].objectKey`,
				),
			}, defaultShadowIntensity,
			);
		});

		return { enabled: true, objects };
	}

	/**
	 * Normalize endpoint indirect-fill policy.
	 *
	 * @param {unknown} policy - Supplies candidate policy.
	 * @returns {string} Resolved policy.
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
	 * Normalize optional endpoint indirect-fill request.
	 *
	 * @param {LightSourceThreeEndpointIndirectFillRequest | undefined} endpointIndirectFill - Supplies candidate fill config.
	 * @returns {object | null} Normalized fill config.
	 */
	_endpointIndirectFillRequestOrNull(endpointIndirectFill) {
		if (endpointIndirectFill === undefined) {
			return null;
		}
		if (
			endpointIndirectFill === null
			|| typeof endpointIndirectFill !== 'object'
			|| Array.isArray(endpointIndirectFill)
		) {
			throw new TypeError('endpointIndirectFill must be an object.');
		}
		assertOnlyProperties(
			endpointIndirectFill,
			LOCAL_SUN_ENDPOINT_INDIRECT_FILL_REQUEST_PROPERTIES,
			'endpointIndirectFill',
			'endpoint indirect-fill',
		);
		if (typeof endpointIndirectFill.enabled !== 'boolean') {
			throw new TypeError('endpointIndirectFill.enabled must be boolean.');
		}

		const policy =
			this._endpointIndirectFillPolicyOrDefault(
				endpointIndirectFill.policy,
			);
		const intensityRatio = finiteNumberOrDefault(
			endpointIndirectFill.intensityRatio,
			0.25,
			'endpointIndirectFill.intensityRatio',
		);
		if (intensityRatio < 0) {
			throw new RangeError('endpointIndirectFill.intensityRatio must be non-negative.');
		}
		const distance = sceneDistanceOrDefault(
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
	 * Resolve endpoint indirect-fill metadata role.
	 *
	 * @param {string} policy - Supplies fill policy.
	 * @returns {string} Metadata role.
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
	 * Resolve endpoint indirect-fill direction metadata.
	 *
	 * @param {string} policy - Supplies fill policy.
	 * @param {UnitVector3} directionToSourceScene - Supplies scene source direction.
	 * @returns {UnitVector3 | null} Fill direction metadata.
	 */
	_endpointIndirectFillDirection(policy, directionToSourceScene) {
		if (policy === 'opposite-directional-fill') {
			return this._oppositeDirectionalFillDirection(
				directionToSourceScene,
			);
		}
		if (policy === 'source-direction-falloff-fill') {
			return normalizeDirection([
				directionToSourceScene[0],
				Math.abs(directionToSourceScene[1]),
				directionToSourceScene[2],
			], 'source-direction falloff fill direction',
			);
		}
		return null;
	}

	/**
	 * Accept the native profile and its explicit reflective-boundary pairing.
	 *
	 * @param {LocalSunCpuCacheRequest} request - Supplies profile and boundary.
	 * @returns {NativeProductionProfile} The accepted profile.
	 */
	_acceptCpuProfile(request) {
		const profile = request.profile
			?? DEFAULT_NATIVE_PRODUCTION_PROFILE;
		if (request.groundBoundary == null) {
			return profile;
		}
		const albedo = profile.physical.ground?.albedo;
		const spectralBasis = /** @type {SpectralBasis} */ (
			profile.spectral.basis
		);
		if (albedo === undefined
			|| request.groundBoundary.albedo.contentHash
				!== albedo.contentHash
			|| request.groundBoundary.albedo.basisHash
				!== spectralBasis.contentHash) {
			throw new TypeError(
				'reflective local-Sun CPU construction requires its matching profile-owned ground albedo.',
			);
		}

		return profile;
	}

	/**
	 * Accept the source-owned or explicitly diagnostic local source-path
	 * integration count. This is independent of the spherical profile control.
	 *
	 * @param {LocalSunCpuCacheRequest} request - Supplies flat geometry.
	 * @returns {number} The accepted interval count.
	 */
	_acceptCpuSourceTransmittanceIntervalCount(request) {
		const intervalCount =
			request.sourceTransmittanceIntervalCount
			?? this._configuration.sourceTransmittanceIntervalCount;
		if (!Number.isInteger(intervalCount) || intervalCount < 1) {
			throw new RangeError(
				'local-Sun CPU sourceTransmittanceIntervalCount must be a positive integer.',
			);
		}

		return intervalCount;
	}

	/**
	 * Bind the unchanged pure-order operations to this local source.
	 *
	 * @param {LocalSunCpuRecurrenceContext} context - Supplies physical owners.
	 * @returns {LocalSunCpuCacheOperations} The recurrence operations.
	 */
	_createCpuRecurrenceOperations(context) {
		return {
			createScatteringKernel: ({
				scatteringOrder,
				groundIlluminationRadiance,
			}) => createLocalSunLaterOrderScatteringKernel({
				geometry: context.request.geometry,
				atmosphere: context.request.atmosphere,
				calculator: context.calculator,
				domainSelection: context.domainSelection,
				scatteringOrder,
				groundIlluminationRadiance,
				groundBoundary:
					context.request.groundBoundary ?? null,
				lightSource: this,
				sourceTransmittanceIntervalCount:
					context.sourceTransmittanceIntervalCount,
			}),
			buildTransportedRadiance: ({
				scatteringDensity,
				scatteringOrder,
				id,
			}) => buildLocalSunCpuTransportedRadiance({
				scatteringDensity,
				scatteringOrder,
				geometry: context.request.geometry,
				atmosphere: context.request.atmosphere,
				calculator: context.calculator,
				domainSelection: context.domainSelection,
				pathIntervalCount:
					LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
				id,
			}),
			scatteringProvenanceIdentity:
				LOCAL_SUN_CPU_RECURRENCE_PROVENANCE_IDENTITY,
		};
	}

	/**
	 * Create a local sun light source.
	 *
	 * @param {LocalSunLightSourceConfig} configuration - Supplies source key,
	 * spectral irradiance and finite-source scale.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('LocalSunLightSource configuration is required.');
		}
		const {
			sourceKey,
			position,
			sourceIrradiance,
			referenceDistance,
			referenceSpectralIncidentScale,
			radius,
			distanceFalloff = true,
			sourceTransmittanceIntervalCount =
				LOCAL_SUN_SOURCE_TRANSMITTANCE_INTERVAL_COUNT,
		} = configuration;

		if (!sourceKey || typeof sourceKey !== 'string') {
			throw new TypeError('LocalSunLightSource requires sourceKey.');
		}
		DistanceMath.assertPosition(
			position,
			'LocalSunLightSource position',
		);

		const acceptedSourceIrradiance = acceptSourceIrradiance(
			sourceIrradiance,
			'LocalSunLightSource',
		);
		DistanceMath.assertDistance(referenceDistance, 'LocalSunLightSource referenceDistance');
		DistanceMath.assertDistance(radius, 'LocalSunLightSource radius');
		const referenceDistanceMeters = DistanceMath.toMeters(referenceDistance);
		const radiusMeters = DistanceMath.toMeters(radius);

		if (!Number.isFinite(referenceSpectralIncidentScale)) {
			throw new TypeError('LocalSunLightSource distance, scale, and radius must be finite.');
		}
		if (typeof distanceFalloff !== 'boolean') {
			throw new TypeError('LocalSunLightSource distanceFalloff must be boolean.');
		}
		if (
			!Number.isInteger(sourceTransmittanceIntervalCount)
			|| sourceTransmittanceIntervalCount < 1
		) {
			throw new RangeError(
				'LocalSunLightSource sourceTransmittanceIntervalCount must be a positive integer.',
			);
		}
		if (referenceDistanceMeters <= 0 || referenceSpectralIncidentScale < 0 || radiusMeters < 0) {
			throw new RangeError('LocalSunLightSource distance, scale, and radius must be in valid ranges.');
		}

		const normalizedConfiguration = {
			sourceKey,
			position: /** @type {Position} */ ({
				coordinates: DistanceMath.toMetersPosition(position),
				units: 'meters',
			}),
			sourceIrradiance: acceptedSourceIrradiance,
			referenceDistance: DistanceMath.inMeters(referenceDistanceMeters),
			referenceSpectralIncidentScale,
			radius: DistanceMath.inMeters(radiusMeters),
			distanceFalloff,
			sourceTransmittanceIntervalCount,
		};
		this._configuration = normalizedConfiguration;
		this._constructionShellFactCache =
			createLocalSunShellFactCache({
				sourceConfiguration:
					normalizedConfiguration,
			});
		this._constructionLightSource =
			new LocalSunConstructionLightSource({
				source: this,
				shellFactCache:
					this._constructionShellFactCache,
			});
	}

	/**
	 * Return the immutable source configuration snapshot.
	 *
	 * @returns {LocalSunLightSourceConfiguration} The source configuration.
	 */
	get configuration() {
		return this._configuration;
	}

	/**
	 * Identify this configured source model instance for compatibility.
	 *
	 * @returns {string} The source id.
	 */
	get id() {
		return this._configuration.sourceKey;
	}

	/**
	 * Return a serializable source descriptor.
	 *
	 * @returns {object} The source descriptor.
	 */
	describe() {
		return {
			kind: 'local-sun-light-source',
			sourceKey: this._configuration.sourceKey,
			position: this._configuration.position,
			referenceDistance: this._configuration.referenceDistance,
			referenceSpectralIncidentScale: this._configuration.referenceSpectralIncidentScale,
			radius: this._configuration.radius,
			distanceFalloff: this._configuration.distanceFalloff,
			sourceTransmittanceIntervalCount:
				this._configuration.sourceTransmittanceIntervalCount,
			spectralChannelCount: this._configuration.sourceIrradiance.basis.channelCount,
			sourceIrradianceHash: this._configuration.sourceIrradiance.contentHash,
			constructionLight: {
				kind: 'shell-held-arithmetic-mean',
				factIdentity:
					this._constructionShellFactCache
						.descriptor.identity,
				shellCount:
					this._constructionShellFactCache
						.descriptor.shellCount,
				application: 'primary-j1-amplitude-only',
				primaryRadiance: 'continuous-direct-l1',
			},
		};
	}

	/**
	 * Identify the configured local point Sun during final-view assembly.
	 *
	 * The completed cumulative cache already contains every atmospheric source
	 * term. Flat geometry owns the source-relative runtime frame, so this
	 * contribution intentionally adds no direct-view lighting or GLSL branch.
	 *
	 * @param {ShaderContributionRequest} request - Supplies the active descriptor.
	 * @returns {ShaderContribution} The source-owned runtime identity.
	 */
	createShaderContribution(request) {
		return createShaderContribution({
			id: LOCAL_SUN_RUNTIME_SHADER_CONTRIBUTION_ID,
			owner: 'lightSource',
			descriptorFingerprint:
				request.descriptor.lightSource.fingerprint,
			compatibilityTags:
				request.descriptor.lightSource
					.compatibilityTags,
			diagnostics: {
				mode: 'cumulative-cache-only',
				sourceKey: this._configuration.sourceKey,
				directViewTerm: false,
			},
		});
	}

	/**
	 * Create one local-Sun cache controller for a renderer attachment.
	 *
	 * @param {CacheControllerRequest} request - Supplies backend and scheduler.
	 * @returns {LocalSunCacheController} The attachment-owned controller.
	 */
	createCacheController({ backend, scheduler }) {
		const constructionSource = new LocalSunCacheSource({
			source: this,
			shellFactCache:
				this._constructionShellFactCache,
		});

		return new LocalSunCacheController({
			source: constructionSource,
			backend,
			scheduler,
		});
	}

	/**
	 * Build one complete nonresident local-Sun binary64 cache result.
	 *
	 * @param {LocalSunCpuCacheRequest} request - Supplies flat geometry, atmosphere, identity, and order.
	 * @returns {LocalSunCpuCacheResult} The completed N1, N2, or N4 result.
	 */
	buildCpuScatteringCache(request) {
		assertLocalSunGeometryPairing(
			this._configuration,
			request.geometry.configuration,
		);
		const maximumScatteringOrder =
			request.maximumScatteringOrder ?? 4;
		if (maximumScatteringOrder !== 1
			&& maximumScatteringOrder !== 2
			&& maximumScatteringOrder !== 4) {
			throw new RangeError(
				'local-Sun CPU maximum scattering order must be one of 1, 2, 4.',
			);
		}
		const profile = this._acceptCpuProfile(request);
		const domainSelection =
			LocalSunConstructionDomainSelection
				.fromGeometry(request.geometry);
		const spectralBasis = /** @type {SpectralBasis} */ (
			profile.spectral.basis
		);
		const sourceTransmittanceIntervalCount =
			this._acceptCpuSourceTransmittanceIntervalCount(
				request,
			);
		const calculator = new SpectralCalculator({
			geometry: request.geometry,
			atmosphere: request.atmosphere,
			lightSource: this,
			spectralBasis,
			executionControls: {
				pathIntervalCount:
					LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
				sourceTransmittanceIntervalCount,
			},
		});
		const context = {
			request,
			calculator,
			domainSelection,
			sourceTransmittanceIntervalCount,
		};
		const sourceDescription = this.describe();

		return buildLocalSunCpuCache({
			...request,
			constructionIdentities: {
				...request.constructionIdentities,
				source: {
					id: this.id,
					contentHash:
						sha256Descriptor(sourceDescription),
				},
			},
			profile,
			spectralBasis,
			maximumScatteringOrder,
			lightSource: this._constructionLightSource,
			calculator,
			domainSelection,
			sourceTransmittanceIntervalCount,
			...(maximumScatteringOrder === 1
				? {}
				: {
					operations:
						this._createCpuRecurrenceOperations(
							context,
						),
				}),
		});
	}

	/**
	 * Sample direct lighting from the finite source.
	 *
	 * @param {object} [request] - Supplies source-relative sample facts.
	 * @returns {DirectLightingSample} The direct lighting sample.
	 */
	sampleDirectLighting(request = {}) {
		const sourceRelativePosition = request.sourceRelativePosition;

		if (!sourceRelativePosition) {
			throw new TypeError('LocalSunLightSource.sampleDirectLighting requires sourceRelativePosition.');
		}

		const distanceFromSource = sourceRelativePosition.distanceFromSource;
		const hasDistanceFromSource = distanceFromSource != null;
		let distanceFromSourceMeters = null;

		if (hasDistanceFromSource) {
			DistanceMath.assertDistance(
				distanceFromSource,
				'LocalSunLightSource sourceRelativePosition.distanceFromSource',
			);
			distanceFromSourceMeters = DistanceMath.toMeters(distanceFromSource);
		}

		const directionToLight = normalizeDirection(
			sourceRelativePosition.directionToSource,
			'sourceRelativePosition.directionToSource',
		);
		const radiusMeters = this._configuration.radius.value;
		const referenceDistanceMeters = this._configuration.referenceDistance.value;
		const safeDistanceMeters = Math.max(
			radiusMeters,
			hasDistanceFromSource
				? distanceFromSourceMeters
				: referenceDistanceMeters);
		const falloffScale = this._configuration.distanceFalloff
			? (referenceDistanceMeters / safeDistanceMeters) ** 2
			: 1;
		const incidentScale = this._configuration.referenceSpectralIncidentScale * falloffScale;
		const sourceIrradiance = /** @type {SpectralIrradiancePacket} */ (
			scaleSpectralPacket(this._configuration.sourceIrradiance, incidentScale)
		);

		return {
			sourceIrradiance,
			directionToLight,
			metadata: {
				sourceKey: this._configuration.sourceKey,
				distanceFromSource: hasDistanceFromSource
					? DistanceMath.inMeters(distanceFromSourceMeters)
					: null,
				safeDistance: DistanceMath.inMeters(safeDistanceMeters),
				radius: this._configuration.radius,
				referenceDistance: this._configuration.referenceDistance,
				referenceSpectralIncidentScale: this._configuration.referenceSpectralIncidentScale,
				falloffScale,
				incidentScale,
				distanceClampedToRadius: safeDistanceMeters !== distanceFromSourceMeters,
				spectralScaleKind: 'neutral-no-tint',
			},
		};
	}

	/**
	 * Resolve neutral local scene-light scales for a finite source.
	 *
	 * @param {LightSourceSceneLightScalesRequest} [request] - Supplies source-relative observer facts.
	 * @returns {LightSourceSceneLightScales} Direct and ambient light scales.
	 */
	resolveSceneLightScales(request = {}) {
		const directLighting = this.sampleDirectLighting({
			sourceRelativePosition: request.sourceRelativePosition,
		});
		const metadata = /** @type {{ readonly incidentScale: number }} */ (directLighting.metadata);
		const referenceScale = Math.max(
			Number.EPSILON,
			this._configuration.referenceSpectralIncidentScale,
		);
		const localLightScaleValue = clamp01(metadata.incidentScale / referenceScale);
		/** @type {Dimensionless} */
		const localLightScale = createUnitValue({ value: localLightScaleValue, units: '1' });

		return {
			directLightScale: localLightScale,
			ambientLightScale: localLightScale,
			localLightScale,
			policy: 'local-source-reference-incident-scene-light-scale',
		};
	}

	/**
	 * Resolve normalized source-owned endpoint lighting facts once per request.
	 *
	 * @param {LightSourceThreeLightingRequest} request - Supplies the accepted endpoint request.
	 * @returns {LocalSunEndpointLightingFacts} Return normalized endpoint lighting facts.
	 */
	_resolveEndpointLightingFacts(request) {
		const directLighting = this.sampleDirectLighting({
			sourceRelativePosition: request.sourceRelativePosition,
		});
		const metadata = /** @type {{ readonly incidentScale: number }} */ (directLighting.metadata);
		const observerIncidentScale = metadata.incidentScale;
		const calibrationScalar = finiteNumberOrDefault(
			request.calibrationScalar,
			2.4,
			'calibrationScalar',
		);
		const sceneLightScales = this.resolveSceneLightScales(request);
		const ambientLightScale = sceneLightScales.ambientLightScale;
		const endpointSceneLightScalePolicy =
			this._endpointSceneLightScalePolicyOrDefault(
				request.endpointSceneLightScalePolicy,
			);
		const endpointSceneIncidentScale = endpointSceneLightScalePolicy === 'observer-incident-scale'
			? observerIncidentScale
			: 1;
		const ambientIntensityRange = sceneAmbientIntensityRangeOrDefault(
			request.ambientIntensityRange,
			LOCAL_SUN_DEFAULT_SCENE_AMBIENT_INTENSITY_RANGE.min,
			finiteNumberOrDefault(
				request.ambientIntensity,
				LOCAL_SUN_DEFAULT_SCENE_AMBIENT_INTENSITY_RANGE.max,
				'ambientIntensity',
			));
		const ambientLightScaleValue = ambientLightScale.value;
		const ambientIntensity = scaleRange(ambientIntensityRange, ambientLightScaleValue);

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
	 * Create the source-owned ambient fill light for endpoint scene rendering.
	 *
	 * @param {LightSourceThreeLightingRequest & { resolvedAmbientIntensity?: number }} request - Supplies Three and source-relative lighting facts.
	 * @returns {LocalThreeLight} The created Three AmbientLight.
	 */
	_createThreeAmbientLight(request) {
		const threeCandidate = /** @type {Partial<LocalThreeNamespace>} */ (request.THREE);

		if (!threeCandidate || typeof threeCandidate.AmbientLight !== 'function') {
			throw new TypeError('LocalSunLightSource.addSceneLighting requires THREE.AmbientLight.');
		}
		const THREE = /** @type {LocalThreeNamespace} */ (threeCandidate);

		const ambientIntensityValue = request.resolvedAmbientIntensity === undefined
			? this._resolveEndpointLightingFacts(request).ambientIntensity
			: finiteNumberOrDefault(
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
	 * Add or create source-owned scene lighting for endpoint rendering.
	 *
	 * @param {LightSourceThreeLightingRequest & { scene?: unknown }} request - Supplies Three,
	 * optional scene, source-relative facts, scene positions, and shadow/fill policy.
	 * @returns {LightSourceThreeLightingObjects} The source-owned Three lights.
	 */
	addSceneLighting(request) {
		if (!request || typeof request !== 'object') {
			throw new TypeError('LocalSunLightSource.addSceneLighting requires THREE lighting constructors.');
		}
		const threeCandidate = /** @type {Partial<LocalThreeNamespace>} */ (request.THREE);

		if (
			!threeCandidate
			|| typeof threeCandidate.AmbientLight !== 'function'
			|| typeof threeCandidate.PointLight !== 'function'
			|| typeof threeCandidate.DirectionalLight !== 'function'
			|| typeof threeCandidate.Object3D !== 'function'
		) {
			throw new TypeError('LocalSunLightSource.addSceneLighting requires THREE lighting constructors.');
		}
		const THREE = /** @type {LocalThreeNamespace} */ (threeCandidate);

		const sourcePosition = scenePositionOrDefault(
			request.sourcePosition,
			null,
			'LocalSunLightSource',
			'sourcePosition',
		);
		const observerPosition = scenePositionOrDefault(
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
		const endpointIndirectFill =
			this._endpointIndirectFillRequestOrNull(
				request.endpointIndirectFill,
			);
		const endpointIndirectFillIntensity = endpointIndirectFill
			? pointLightIntensity * endpointIndirectFill.intensityRatio
			: 0;
		const ambient = this._createThreeAmbientLight({
			THREE,
			resolvedAmbientIntensity: ambientIntensity
				+ (endpointIndirectFill?.policy === 'general-ambient-fill' ? endpointIndirectFillIntensity : 0),
		});
		const directionToSourceScene =
			this._directionBetweenScenePoints(
				observerPositionSceneUnits,
				sourcePositionSceneUnits,
			);
		const shadow =
			this._normalizeShadowRequest(request.shadow);
		const shadowObjects = shadow.objects;
		const sceneObjects = [];
		const sourceDrivenLights = shadowObjects.length > 0
			? shadowObjects.map((shadowObject, index) =>
				this._createShadowDirectionalLight({
					THREE,
					sourceKey: this._configuration.sourceKey,
					intensity: pointLightIntensity / shadowObjects.length,
					sourcePosition,
					shadowObject,
					objectIndex: index,
					sceneObjects,
				}))
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
		const endpointDirectionalFillLight = endpointIndirectFill?.policy === 'opposite-directional-fill'
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
		const endpointSourceFalloffFillLight = endpointIndirectFill?.policy === 'source-direction-falloff-fill'
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
				lightingPolicy: shadowObjects.length > 0
					? 'source-driven-flat-local-directional-shadow-light'
					: 'source-driven-flat-local-point-light',
				endpointColorStatus: requiredStringOrDefault(
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
						role:
							this._endpointIndirectFillRole(
								endpointIndirectFill.policy,
							),
						directionToFillScene:
							this._endpointIndirectFillDirection(
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
				distanceAttenuationPolicy: shadowObjects.length > 0
					? this._distanceAttenuationPolicyForDirectionalShadow(
							endpointSceneLightScalePolicy,
						)
					: this._distanceAttenuationPolicyForPointLight(
							endpointSceneLightScalePolicy,
						),
				shadowPolicy: shadow.enabled ? 'three-shadow-map-from-local-source-direction' : 'shadows-disabled',
				shadow,
				shadowDirectionPolicy: shadowObjects.length > 0
					? 'per-shadow-focus-to-local-source-position'
					: 'none',
				directionToSource: directionToSourceScene,
				directionToSourceModel: lightingFacts.directLighting.directionToLight,
				sourcePosition,
				observerPosition,
				sourceKey: this._configuration.sourceKey,
			},
		};

		addLightingObjectsToScene(request.scene, result);

		return result;
	}

	/**
	 * Configure an app-authored Three mesh or object tree for source shadows.
	 *
	 * @param {unknown} object - Supplies the Three object to configure.
	 * @param {object} [request] - Supplies shadow flag overrides.
	 * @returns {unknown} The configured object.
	 */
	configureThreeShadowObject(object, request = {}) {
		return configureThreeShadowObject(object, {
			owner: 'LocalSunLightSource',
			sourceKey: this._configuration.sourceKey,
			shadowPolicy: 'three-shadow-map-from-local-source-direction',
		}, request,
		);
	}

	/**
	 * Resolve the finite source path limit for one sample.
	 *
	 * @param {object} [request] - Supplies source-relative sample facts.
	 * @returns {SourcePathLimit} The source path limit.
	 */
	resolveSourcePathLimit(request = {}) {
		const distance = request.sourceRelativePosition?.distanceFromSource;

		if (distance != null) {
			DistanceMath.assertDistance(
				distance,
				'LocalSunLightSource sourceRelativePosition.distanceFromSource',
			);
		}

		const hasDistance = distance != null;
		const distanceMeters = hasDistance ? DistanceMath.toMeters(distance) : null;

		return {
			maxDistance: hasDistance
				? DistanceMath.inMeters(Math.max(0, distanceMeters))
				: null,
			reason: 'finite-local-source-distance',
		};
	}
}
