import {
	buildDistantSunCpuCache,
} from './distant-sun-cpu-cache-build.js';
import { DistantSunCacheController } from './DistantSunCacheController.js';
import {
	createDistantSunLaterOrderScatteringKernel,
} from './distant-sun-later-order-scattering-density.js';
import {
	buildDistantSunCpuPrimaryRadiance,
	createDistantSunCpuSpectralCalculator,
} from './distant-sun-primary-radiance.js';
import {
	buildDistantSunCpuTransportedRadiance,
} from './distant-sun-scattering-density-transport.js';
import { configureThreeShadowObject } from './ThreeShadowObjectConfigurator.js';
import {
	createShaderContribution,
	createShaderSourceBlock,
	createShaderUniformDescriptor,
} from '../shader/shaderContribution.js';
import {
	createCacheBuildModule,
} from '../caches/gpu/cacheBuildContracts.js';
import { createUnitValue } from '../quantities/UnitValue.js';
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
} from '../profiles/native-15-profile.js';
import {
	ALGORITHM32_STAR_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY,
} from '../transport/consts.js';
import AngleMath from '../utils/AngleMath.js';
import { finiteNumberOrDefault } from '../utils/numericValues.js';
import SceneMath from '../utils/SceneMath.js';
import VectorMath from '../utils/VectorMath.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	DISTANT_SUN_CACHE_IRRADIANCE_SYMBOL,
	DISTANT_SUN_CACHE_REQUIREMENTS_BY_PASS,
	DISTANT_SUN_CACHE_SYMBOLS_BY_PASS,
	DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT,
} from './consts.js';
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

const DEFAULT_SCENE_AMBIENT_INTENSITY_RANGE = {
	min: 0.06,
	max: 0.5,
};
const SHADOW_REQUEST_PROPERTIES = ['enabled', 'objects'];
const SHADOW_OBJECT_REQUEST_PROPERTIES = [
	'objectKey',
	'layerIndex',
	'focus',
	'extent',
	'cameraLeft',
	'cameraRight',
	'cameraTop',
	'cameraBottom',
	'lightDistance',
	'cameraNear',
	'cameraFar',
	'mapSize',
	'bias',
	'normalBias',
	'radius',
	'shadowIntensity',
];
/**
 * Smoothly map a value between two edge values.
 *
 * @param {number} edge0 - Supplies the lower edge.
 * @param {number} edge1 - Supplies the upper edge.
 * @param {number} value - Supplies the candidate value.
 * @returns {number} Smoothly clamped percentage.
 */
function smoothStep(edge0, edge1, value) {
	if (Math.abs(edge1 - edge0) <= Number.EPSILON) {
		return value >= edge1 ? 1 : 0;
	}

	const t = clamp01((value - edge0) / (edge1 - edge0));

	return t * t * (3 - 2 * t);
}

/**
 * Dot two vectors.
 *
 * @param {readonly number[]} left - Supplies the left vector.
 * @param {readonly number[]} right - Supplies the right vector.
 * @returns {number} Dot product.
 */
function dot(left, right) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

/**
 * Normalize one shadow object request.
 *
 * @param {LightSourceThreeShadowObjectRequest} shadowObject - Supplies candidate shadow object config.
 * @param {ScenePosition} focus - Supplies default focus point.
 * @param {SceneDistance} defaultLightDistance - Supplies default light distance.
 * @param {number} defaultShadowIntensity - Supplies default split-light shadow opacity.
 * @returns {object} Normalized shadow config.
 */
function normalizeShadowObjectRequest(
	shadowObject,
	focus,
	defaultLightDistance,
	defaultShadowIntensity = 1,
) {
	const shadowFocus = scenePositionOrDefault(
		shadowObject.focus,
		focus,
		'DistantSunLightSource',
		'shadow.focus',
	);
	const requestedExtent = sceneDistanceOrDefault(
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
	const requestedLightDistance = sceneDistanceOrDefault(
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
	const requestedCameraNear = sceneDistanceOrDefault(
		shadowObject.cameraNear,
		SceneMath.inSceneUnits(0.1),
		'DistantSunLightSource',
		'shadow.cameraNear',
	);
	if (requestedCameraNear.value <= 0) {
		throw new RangeError('shadow.cameraNear must be greater than zero.');
	}
	const cameraNearSceneUnits = requestedCameraNear.value;
	const requestedCameraFar = sceneDistanceOrDefault(
		shadowObject.cameraFar,
		SceneMath.inSceneUnits(lightDistanceSceneUnits + extentSceneUnits * 4),
		'DistantSunLightSource',
		'shadow.cameraFar',
	);
	if (requestedCameraFar.value <= cameraNearSceneUnits) {
		throw new RangeError('shadow.cameraFar must be greater than shadow.cameraNear.');
	}
	const cameraFarSceneUnits = requestedCameraFar.value;
	const cameraLeftSceneUnits = sceneDistanceOrDefault(
		shadowObject.cameraLeft,
		SceneMath.inSceneUnits(-extentSceneUnits),
		'DistantSunLightSource',
		'shadow.cameraLeft',
	).value;
	const requestedCameraRight = sceneDistanceOrDefault(
		shadowObject.cameraRight,
		SceneMath.inSceneUnits(extentSceneUnits),
		'DistantSunLightSource',
		'shadow.cameraRight',
	).value;
	if (requestedCameraRight <= cameraLeftSceneUnits) {
		throw new RangeError('shadow.cameraRight must be greater than shadow.cameraLeft.');
	}
	const cameraRightSceneUnits = requestedCameraRight;
	const cameraBottomSceneUnits = sceneDistanceOrDefault(
		shadowObject.cameraBottom,
		SceneMath.inSceneUnits(-extentSceneUnits),
		'DistantSunLightSource',
		'shadow.cameraBottom',
	).value;
	const requestedCameraTop = sceneDistanceOrDefault(
		shadowObject.cameraTop,
		SceneMath.inSceneUnits(extentSceneUnits),
		'DistantSunLightSource',
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
		'DistantSunLightSource',
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
 * @param {ScenePosition} focus - Supplies default focus point.
 * @param {SceneDistance} defaultLightDistance - Supplies default light distance.
 * @returns {{ enabled: boolean, objects: readonly object[] }} Normalized shadow config.
 */
function normalizeShadowRequest(shadow, focus, defaultLightDistance) {
	if (shadow === undefined) {
		return { enabled: false, objects: [] };
	}

	if (shadow === null || typeof shadow !== 'object' || Array.isArray(shadow)) {
		throw new TypeError('shadow must contain enabled and objects.');
	}
	assertOnlyProperties(shadow, SHADOW_REQUEST_PROPERTIES, 'shadow');

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
		assertOnlyProperties(object, SHADOW_OBJECT_REQUEST_PROPERTIES, `shadow.objects[${index}]`);

		return normalizeShadowObjectRequest({
			...object,
			objectKey: requiredStringOrDefault(
				object.objectKey,
				`shadow-object-${index}`,
				`shadow.objects[${index}].objectKey`,
			),
		}, focus, defaultLightDistance, defaultShadowIntensity,
		);
	});

	return { enabled: true, objects };
}

/**
 * Apply normalized directional shadow settings.
 *
 * @param {DistantThreeDirectionalLight} light - Supplies a Three directional light.
 * @param {object} shadow - Supplies normalized shadow settings.
 * @returns {void}
 */
function applyDirectionalShadow(light, shadow) {
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
		applyLayerIndex(light.shadow.camera, shadow.layerIndex);
		light.shadow.camera.updateProjectionMatrix?.();
	}
	light.shadow.bias = shadow.bias;
	light.shadow.normalBias = shadow.normalBias.value;
	light.shadow.radius = shadow.radius.value;
	light.shadow.intensity = shadow.shadowIntensity;
}

/**
 * Create a directional source light and target pair.
 *
 * @param {{
 *   THREE: DistantThreeNamespace,
 *   directionToSource: UnitVector3,
 *   intensity: number,
 *   focus: ScenePosition,
 *   lightDistance: SceneDistance,
 *   shadowObject: object | null,
 *   objectIndex: number,
 * }} request - Supplies light facts.
 * @returns {{ light: DistantThreeDirectionalLight, target: DistantThreeObject }} Created pair.
 */
function createDirectionalLight({
	THREE,
	directionToSource,
	intensity,
	focus,
	lightDistance,
	shadowObject,
	objectIndex,
}) {
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
		applyDirectionalShadow(sourceLight, shadowObject);
	}

	return { light: sourceLight, target };
}

/**
 * Require the two geometry operations used only by the N=4 stored-field
 * transport passes. N=2 stops at J2 and does not enter this boundary.
 *
 * @param {unknown} geometry - Supplies the public geometry candidate.
 * @returns {void}
 */
function assertStoredFieldTransportGeometry(geometry) {
	if (!geometry || typeof geometry !== 'object' || Array.isArray(geometry)) {
		throw new TypeError(
			'DistantSunLightSource N=4 stored-field transport geometry must be an object.',
		);
	}
	for (const methodName of [
		'resolveScatteringCacheConstructionPositionStencil',
		'expressScatteringCacheDirection',
	]) {
		if (typeof /** @type {Record<string, unknown>} */ (geometry)[methodName]
			!== 'function') {
			throw new TypeError(
				`DistantSunLightSource N=4 stored-field transport geometry must implement ${methodName}().`,
			);
		}
	}
}

/**
 * Own direct lighting, cache construction, and renderer lighting for a distant Sun.
 */
export class DistantSunLightSource {
	/**
	 * Create a distant sun light source.
	 *
	 * @param {DistantSunLightSourceConfig} configuration - Supplies source
	 * direction, spectral irradiance, and apparent size metadata.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('DistantSunLightSource configuration is required.');
		}

		const {
			directionToLight,
			sourceIrradiance,
			angularRadius,
		} = configuration;

		const acceptedSourceIrradiance = acceptSourceIrradiance(
			sourceIrradiance,
			'DistantSunLightSource',
		);
		AngleMath.assertAngle(angularRadius, 'DistantSunLightSource angularRadius');
		const angularRadiusRadians = AngleMath.toRadians(angularRadius);

		if (angularRadiusRadians < 0) {
			throw new TypeError('DistantSunLightSource angularRadius must be finite and non-negative.');
		}

		this._configuration = {
			directionToLight: normalizeDirection(directionToLight, 'directionToLight'),
			sourceIrradiance: acceptedSourceIrradiance,
			angularRadius: AngleMath.inRadians(angularRadiusRadians),
		};
	}

	/**
	 * Return the immutable source configuration snapshot.
	 *
	 * @returns {DistantSunLightSourceConfig} The source configuration.
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
		return 'distant-sun';
	}

	/**
	 * Return a serializable source descriptor.
	 *
	 * @returns {object} The source descriptor.
	 */
	describe() {
		return {
			kind: 'distant-sun-light-source',
			sourceKey: 'distant-sun',
			directionToLight: this._configuration.directionToLight,
			angularRadius: this._configuration.angularRadius,
			spectralChannelCount: this._configuration.sourceIrradiance.basis.channelCount,
			sourceIrradianceHash: this._configuration.sourceIrradiance.contentHash,
		};
	}

	/**
	 * Supply the distant-source direction and the executable source-owned J1 or
	 * direct L1 program portions required by one cache construction pass.
	 *
	 * @param {CacheBuildContext} context - Supplies the resolved logical pass.
	 * @returns {CacheBuildModule} Return the source-owned module.
	 */
	createCacheModule(context) {
		const reflectiveScatter = context.kind === 'scatter'
			&& context.groundReflection !== undefined;
		const provides = reflectiveScatter
			? [
				...DISTANT_SUN_CACHE_SYMBOLS_BY_PASS[context.kind],
				DISTANT_SUN_CACHE_IRRADIANCE_SYMBOL,
			]
			: DISTANT_SUN_CACHE_SYMBOLS_BY_PASS[context.kind];
		const requires = DISTANT_SUN_CACHE_REQUIREMENTS_BY_PASS[context.kind];
		/** @type {CacheBinding[]} */
		const bindings = [];
		/** @type {CacheShaderBlock[]} */
		const blocks = [];

		if (context.kind !== 'accumulate') {
			bindings.push({
				spec: {
					id: 'distant-sun-source-direction',
					name: 'uCacheSourceDirection',
					kind: 'uniform',
					shaderType: 'vec3',
					frequency: 'build',
				},
				value: this._configuration.directionToLight,
			});
			blocks.push({
				id: 'distant-sun-cache-direction',
				phase: 'function',
				order: 0,
				source: `vec3 cacheSourceDirection(vec3 positionMeters) {
	return uCacheSourceDirection;
}`,
			});
		}

		if (context.kind === 'primary-j1'
			|| context.kind === 'direct-l1'
			|| reflectiveScatter) {
			bindings.push({
				spec: {
					id: 'distant-sun-source-irradiance',
					name: 'uCacheSourceIrradiance',
					kind: 'uniform',
					shaderType: `float[${this._configuration.sourceIrradiance.basis.channelCount}]`,
					frequency: 'build',
				},
				value: this._configuration.sourceIrradiance,
			});
		}

		if (reflectiveScatter) {
			blocks.push({
				id: 'distant-sun-cache-irradiance',
				phase: 'function',
				order: 5,
				source: `float cacheSourceIrradiance(
	vec3 positionMeters,
	int wavelengthIndex
) {
	return uCacheSourceIrradiance[wavelengthIndex];
}`,
			});
		}

		if (context.kind === 'primary-j1') {
			blocks.push(
				{
					id: 'distant-sun-primary-j1',
					phase: 'function',
					order: 10,
					source: `float cachePrimaryJ1(
	int positionIndex,
	int directionIndex,
	int wavelengthIndex
) {
	vec3 positionMeters = cachePosition(positionIndex);
	vec3 sourceDirection = cacheSourceDirection(positionMeters);
	float sourceTransmittance = cachePathTransmittance(
		positionMeters,
		sourceDirection,
		wavelengthIndex
	);
	vec3 outgoingLocal = cacheOutgoingLocalDirection(directionIndex);
	vec3 sourceLocal = vec3(1.0, 0.0, 0.0);
	float phaseWeightedScattering =
		cacheRayleighScattering(positionMeters, wavelengthIndex)
			* cacheRayleighPhase(outgoingLocal, sourceLocal)
		+ cacheMieScattering(positionMeters, wavelengthIndex)
			* cacheMiePhase(outgoingLocal, sourceLocal);
	return sourceTransmittance
		* uCacheSourceIrradiance[wavelengthIndex]
		* phaseWeightedScattering;
}`,
				},
				{
					id: 'distant-sun-primary-j1-main',
					phase: 'main',
					order: 0,
					source: `int directionIndex = int(gl_FragCoord.x);
int positionIndex = int(gl_FragCoord.y);
a32CacheOutput = cachePrimaryJ1(
	positionIndex,
	directionIndex,
	a32CacheWavelengthLayer
);`,
				},
			);
		}

		if (context.kind === 'direct-l1') {
			blocks.push(
				{
					id: 'distant-sun-direct-l1',
					phase: 'function',
					order: 10,
					source: `float cacheDirectL1(
	int positionIndex,
	int directionIndex,
	int wavelengthIndex
) {
	vec3 positionMeters = cachePosition(positionIndex);
	vec3 sourceDirection = cacheSourceDirection(positionMeters);
	vec3 pathDirection = cacheIncomingDirection(
		directionIndex,
		sourceDirection
	);
	if (cacheRayBlockedByGround(positionMeters, pathDirection)) return 0.0;

	float endDistanceMeters = cacheTopBoundaryDistance(
		positionMeters,
		pathDirection
	);
	float intervalLengthMeters = endDistanceMeters
		/ float(CACHE_TRANSPORT_INTERVAL_COUNT);
	float viewTransmittance = 1.0;
	float previousExtinction = 0.0;
	float radiance = 0.0;

	for (int pointIndex = 0;
		pointIndex <= CACHE_TRANSPORT_INTERVAL_COUNT;
		pointIndex += 1) {
		float distanceMeters = intervalLengthMeters * float(pointIndex);
		vec3 samplePosition = positionMeters + pathDirection * distanceMeters;
		float extinction = cacheExtinction(samplePosition, wavelengthIndex);
		if (pointIndex > 0) {
			viewTransmittance *= exp(
				-0.5 * (previousExtinction + extinction)
				* intervalLengthMeters
			);
		}
		float sourceTransmittance = cachePathTransmittance(
			samplePosition,
			sourceDirection,
			wavelengthIndex
		);
		float phaseWeightedScattering =
			cacheRayleighScattering(samplePosition, wavelengthIndex)
				* cacheRayleighPhase(pathDirection, sourceDirection)
			+ cacheMieScattering(samplePosition, wavelengthIndex)
				* cacheMiePhase(pathDirection, sourceDirection);
		float measureMeters = intervalLengthMeters
			* (pointIndex == 0 || pointIndex == CACHE_TRANSPORT_INTERVAL_COUNT
				? 0.5
				: 1.0);
		radiance += viewTransmittance
			* sourceTransmittance
			* uCacheSourceIrradiance[wavelengthIndex]
			* phaseWeightedScattering
			* measureMeters;
		previousExtinction = extinction;
	}

	return radiance;
}`,
				},
				{
					id: 'distant-sun-direct-l1-main',
					phase: 'main',
					order: 0,
					source: `int directionIndex = int(gl_FragCoord.x);
int positionIndex = int(gl_FragCoord.y);
a32CacheOutput = cacheDirectL1(
	positionIndex,
	directionIndex,
	a32CacheWavelengthLayer
);`,
				},
			);
		}

		return createCacheBuildModule({
			id: `algorithm32-distant-sun-${context.kind}-module-v1`,
			owner: 'lightSource',
			provides,
			requires,
			blocks,
			bindings,
		});
	}

	/**
	 * Create one distant-Sun cache controller for a renderer attachment.
	 *
	 * @param {CacheControllerRequest} request - Supplies the renderer-owned backend and scheduler.
	 * @returns {DistantSunCacheController} The attachment-owned controller.
	 */
	createCacheController({ backend, scheduler }) {
		return new DistantSunCacheController({
			source: this,
			backend,
			scheduler,
		});
	}

	/**
	 * Identify the reflective branch of the public CPU recurrence union.
	 *
	 * @param {DistantSunCpuCacheRequestN2 | DistantSunCpuCacheRequestN4} request - Supplies the recurrence request.
	 * @returns {request is DistantSunCpuCacheReflectiveGroundRequestN2 | DistantSunCpuCacheReflectiveGroundRequestN4} Return whether reflective requirements apply.
	 */
	_hasReflectiveCpuGround(request) {
		return request.groundBoundary != null;
	}

	/**
	 * Resolve the default or one explicitly selected executable construction
	 * domain set.
	 *
	 * @param {DistantSunConstructionDomainSelection | undefined} value -
	 * Supplies the optional domain selection.
	 * @returns {DistantSunConstructionDomainSelection} Return the resolved
	 * selection.
	 */
	_resolveConstructionDomainSelection(value) {
		return value === undefined
			? DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION
			: value;
	}

	/**
	 * Accept one executable CPU path-integration interval count.
	 *
	 * @param {unknown} value - Supplies an optional comparison count.
	 * @returns {number} The accepted positive integer.
	 */
	_acceptCpuTransportIntervalCount(value) {
		const transportIntervalCount = value === undefined
			? DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT
			: /** @type {number} */ (value);
		if (!Number.isInteger(transportIntervalCount)
			|| transportIntervalCount < 1) {
			throw new RangeError(
				'DistantSunLightSource transportIntervalCount must be a positive integer.',
			);
		}

		return transportIntervalCount;
	}

	/**
	 * Create one order-specific CPU scattering kernel with pure L(k-2)
	 * captured only for reflective-ground illumination.
	 *
	 * @param {DistantSunCpuRecurrenceContext} context - Supplies source-owned physical collaborators.
	 * @param {{
	 *   scatteringOrder: 2 | 3 | 4,
	 *   groundIlluminationRadiance: CpuDirectionalSpectralFieldContract | null,
	 * }} request - Supplies the requested pure order and ground field.
	 * @returns {ScatteringOrderKernel} Return the synchronous order kernel.
	 */
	_createCpuScatteringKernel(context, request) {
		const cacheRequest = context.request;
		if (!this._hasReflectiveCpuGround(cacheRequest)) {
			return createDistantSunLaterOrderScatteringKernel({
				atmosphere: cacheRequest.atmosphere,
				geometry: cacheRequest.geometry,
				calculator: context.calculator,
				directionToLight: context.directionToLight,
				domainSelection: context.domainSelection,
				scatteringOrder: request.scatteringOrder,
				groundIlluminationRadiance: request.groundIlluminationRadiance,
				groundBoundary: null,
			});
		}

		return createDistantSunLaterOrderScatteringKernel({
			geometry: cacheRequest.geometry,
			atmosphere: cacheRequest.atmosphere,
			calculator: context.calculator,
			directionToLight: context.directionToLight,
			domainSelection: context.domainSelection,
			scatteringOrder: request.scatteringOrder,
			groundIlluminationRadiance: request.groundIlluminationRadiance,
			groundBoundary: cacheRequest.groundBoundary,
			lightSource: this,
			sourceTransmittanceIntervalCount:
				context.profile.numerical.sourcePathTransmittance.intervalCount,
		});
	}

	/**
	 * Build one boundary-identified pure stored-field radiance order.
	 *
	 * @param {DistantSunCpuRecurrenceContext} context - Supplies physical transport owners.
	 * @param {{
	 *   scatteringDensity: CpuDirectionalSpectralFieldContract,
	 *   scatteringOrder: 2 | 3,
	 *   id: string,
	 * }} request - Supplies pure Jk and its source-owned Lk id.
	 * @returns {CpuDirectionalSpectralFieldContract} Return sealed pure Lk.
	 */
	_buildCpuTransportedRadiance(context, request) {
		const fourthOrderRequest = /** @type {DistantSunCpuCacheRequestN4} */ (
			context.request
		);

		return buildDistantSunCpuTransportedRadiance({
			scatteringDensity: request.scatteringDensity,
			scatteringOrder: request.scatteringOrder,
			geometry: fourthOrderRequest.geometry,
			atmosphere: fourthOrderRequest.atmosphere,
			calculator: context.calculator,
			domainSelection: context.domainSelection,
			transportIntervalCount: context.transportIntervalCount,
			id: request.id,
		});
	}

	/**
	 * Bind source-owned CPU recurrence methods for N2.
	 *
	 * @param {DistantSunCpuRecurrenceContext} context - Supplies captured physical owners.
	 * @returns {DistantSunCpuCacheOperations} Return N2 operations.
	 */
	_createCpuRecurrenceOperations(context) {
		return {
			createScatteringKernel: this._createCpuScatteringKernel.bind(this, context),
			scatteringProvenanceIdentity:
				ALGORITHM32_STAR_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY,
		};
	}

	/**
	 * Bind source-owned CPU recurrence methods for N4.
	 *
	 * @param {DistantSunCpuRecurrenceContext} context - Supplies captured physical owners.
	 * @returns {DistantSunCpuCacheOperations & Readonly<{
	 *   buildTransportedRadiance: DistantSunCpuTransportedRadianceBuilder,
	 * }>} Return N4 operations.
	 */
	_createCpuFourthOrderRecurrenceOperations(context) {
		return {
			...this._createCpuRecurrenceOperations(context),
			buildTransportedRadiance:
				this._buildCpuTransportedRadiance.bind(this, context),
		};
	}

	/**
	 * Select the default only for omitted ground and verify that a reflective
	 * boundary retains the explicit profile-owned albedo and basis.
	 *
	 * @param {DistantSunCpuCacheRequestN2 | DistantSunCpuCacheRequestN4} request - Supplies the public recurrence request.
	 * @returns {NativeProductionProfile} Return the accepted recurrence profile.
	 */
	_acceptCpuRecurrenceProfile(request) {
		if (!this._hasReflectiveCpuGround(request)) {
			return request.profile ?? DEFAULT_NATIVE_PRODUCTION_PROFILE;
		}
		const profile = request.profile;
		const albedo = profile?.physical.ground?.albedo;
		if (albedo === undefined) {
			throw new TypeError(
				'reflective distant-Sun CPU construction requires an explicit profile-owned ground albedo.',
			);
		}
		const boundaryAlbedo = request.groundBoundary.albedo;
		if (boundaryAlbedo.contentHash !== albedo.contentHash
			|| boundaryAlbedo.basisHash
				!== profile.spectral.basis.contentHash) {
			throw new TypeError(
				'reflective distant-Sun CPU boundary must match the explicit profile albedo and spectral basis.',
			);
		}

		return profile;
	}

	/**
	 * Build one complete nonresident CPU scattering result owned by this source.
	 *
	 * Plain source construction defaults to N=4. An explicit N=1 request builds
	 * only J1 and its cumulative field; N=2 and N=4 bind the production physical
	 * later-order scatter and stored-field transport operations internally.
	 *
	 * @param {DistantSunCpuCacheRequest} request - Supplies physical collaborators and the requested maximum.
	 * @returns {DistantSunCpuCacheResult}
	 * Return the canonical sealed N=1, N=2, or N=4 build result.
	 */
	buildCpuScatteringCache(request) {
		const maximumScatteringOrder = request.maximumScatteringOrder === undefined
			? 4
			: request.maximumScatteringOrder;
		if (maximumScatteringOrder !== 1
			&& maximumScatteringOrder !== 2
			&& maximumScatteringOrder !== 4) {
			throw new RangeError(
				'distant-Sun CPU maximum scattering order must be one of 1, 2, 4.',
			);
		}
		const transportIntervalCount =
			this._acceptCpuTransportIntervalCount(
				request.transportIntervalCount,
			);
		const domainSelection =
			this._resolveConstructionDomainSelection(
				request.domainSelection,
			);

		if (maximumScatteringOrder === 1) {
			const firstOrderRequest =
				/** @type {DistantSunCpuCacheRequestN1} */ (
					request
				);
			return buildDistantSunCpuCache({
				...firstOrderRequest,
				maximumScatteringOrder: 1,
				lightSource: this,
				domainSelection,
				transportIntervalCount,
			});
		}

		const multipleScatteringRequest = /** @type {DistantSunCpuCacheRequestN2 | DistantSunCpuCacheRequestN4} */ (request);
		const profile = this._acceptCpuRecurrenceProfile(multipleScatteringRequest);
		if (maximumScatteringOrder === 4) {
			assertStoredFieldTransportGeometry(
				multipleScatteringRequest.geometry,
			);
		}
		const calculator = createDistantSunCpuSpectralCalculator({
			atmosphere: multipleScatteringRequest.atmosphere,
			geometry: multipleScatteringRequest.geometry,
			lightSource: this,
			profile,
			transportIntervalCount,
		});
		const recurrenceContext = {
			request: multipleScatteringRequest,
			calculator,
			profile,
			domainSelection,
			transportIntervalCount,
			directionToLight: this._configuration.directionToLight,
		};

		if (maximumScatteringOrder === 2) {
			return buildDistantSunCpuCache({
				...multipleScatteringRequest,
				profile,
				maximumScatteringOrder: 2,
				lightSource: this,
				calculator,
				domainSelection,
				transportIntervalCount,
				operations: this._createCpuRecurrenceOperations(recurrenceContext),
			});
		}
		const fourthOrderRequest =
			/** @type {DistantSunCpuCacheRequestN4} */ (
				multipleScatteringRequest
			);

		return buildDistantSunCpuCache({
			...fourthOrderRequest,
			profile,
			maximumScatteringOrder: 4,
			lightSource: this,
			calculator,
			domainSelection,
			transportIntervalCount,
			operations:
				this._createCpuFourthOrderRecurrenceOperations(recurrenceContext),
		});
	}

	/**
	 * Build the source-owned direct CPU primary-radiance field.
	 *
	 * This focused seam exposes the selected direct L1 seed for recurrence
	 * diagnostics; it is not an alternate cache-build result contract.
	 *
	 * @param {DistantSunCpuPrimaryRadianceFieldRequest} request - Supplies the atmosphere, spherical geometry, and selected native profile.
	 * @returns {CpuDirectionalSpectralFieldContract} Sealed pure L1.
	 */
	buildCpuPrimaryRadianceField(request) {
		const domainSelection =
			this._resolveConstructionDomainSelection(
				request.domainSelection,
			);
		const transportIntervalCount =
			this._acceptCpuTransportIntervalCount(
				request.transportIntervalCount,
			);
		const calculator = createDistantSunCpuSpectralCalculator({
			...request,
			lightSource: this,
			domainSelection,
			transportIntervalCount,
		});

		return buildDistantSunCpuPrimaryRadiance({
			...request,
			lightSource: this,
			calculator,
			domainSelection,
			transportIntervalCount,
		});
	}

	/**
	 * Sample direct source lighting at a transport point.
	 *
	 * @returns {DirectLightingSample} The direct lighting sample.
	 */
	sampleDirectLighting() {
		return {
			sourceIrradiance: this._configuration.sourceIrradiance,
			directionToLight: this._configuration.directionToLight,
			metadata: {
				directionFromSource: VectorMath.scale(this._configuration.directionToLight, -1),
				angularRadius: this._configuration.angularRadius,
			},
		};
	}

	/**
	 * Resolve neutral local scene-light scales for a distant source.
	 *
	 * @param {LightSourceSceneLightScalesRequest} [request] - Supplies optional scene light direction, local
	 * up vector, and twilight bounds.
	 * @returns {LightSourceSceneLightScales} Direct and twilight-aware ambient light scales.
	 */
	resolveSceneLightScales(request = {}) {
		const directionToSourceScene = normalizeDirection(
			request.directionToSource === undefined
				? this._configuration.directionToLight
				: request.directionToSource,
			'directionToSource',
		);
		const localUpScene = normalizeDirection(
			request.observerUp === undefined ? [0, 1, 0] : request.observerUp,
			'observerUp',
		);
		const sourceUpDot = dot(directionToSourceScene, localUpScene);
		const twilightStartSourceUpDot = finiteNumberOrDefault(
			request.twilightStartSourceUpDot,
			Math.sin(-12 * Math.PI / 180),
			'twilightStartSourceUpDot',
		);
		const fullAmbientSourceUpDot = finiteNumberOrDefault(
			request.fullAmbientSourceUpDot,
			Math.sin(12 * Math.PI / 180),
			'fullAmbientSourceUpDot',
		);
		const ambientLightScaleValue = smoothStep(
			twilightStartSourceUpDot,
			fullAmbientSourceUpDot,
			sourceUpDot,
		);
		const directLightScaleValue = clamp01(sourceUpDot);
		/** @type {Dimensionless} */
		const directLightScale = createUnitValue({ value: directLightScaleValue, units: '1' });
		/** @type {Dimensionless} */
		const ambientLightScale = createUnitValue({ value: ambientLightScaleValue, units: '1' });

		return {
			directLightScale,
			ambientLightScale,
			localLightScale: ambientLightScale,
			sourceUpDot,
			policy: 'distant-source-twilight-aware-scene-light-scale',
		};
	}

	/**
	 * Create the source-owned ambient fill light for endpoint scene rendering.
	 *
	 * @param {{ THREE: DistantThreeNamespace, ambientIntensity: number }} request - Supplies Three and the ambient intensity.
	 * @returns {DistantThreeObject} The created Three AmbientLight.
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
	 * Add or create source-owned scene lighting for endpoint rendering.
	 *
	 * @param {LightSourceThreeLightingRequest & { scene?: unknown }} request - Supplies Three,
	 * optional scene, direction, focus, intensity, ambient, and shadow policy.
	 * @returns {LightSourceThreeLightingObjects} The source-owned Three lights.
	 */
	addSceneLighting(request) {
		if (!request || typeof request !== 'object') {
			throw new TypeError('DistantSunLightSource.addSceneLighting requires THREE lighting constructors.');
		}
		const threeCandidate = /** @type {Partial<DistantThreeNamespace>} */ (request.THREE);

		if (
			!threeCandidate
			|| typeof threeCandidate.DirectionalLight !== 'function'
			|| typeof threeCandidate.AmbientLight !== 'function'
			|| typeof threeCandidate.Object3D !== 'function'
		) {
			throw new TypeError('DistantSunLightSource.addSceneLighting requires THREE lighting constructors.');
		}
		const THREE = /** @type {DistantThreeNamespace} */ (threeCandidate);

		const focus = scenePositionOrDefault(
			request.focus,
			SceneMath.positionInSceneUnits([0, 0, 0]),
			'DistantSunLightSource',
			'focus',
		);
		const focusSceneUnits = focus.coordinates;
		const directionToSourceScene = normalizeDirection(
			request.directionToSource === undefined
				? this._configuration.directionToLight
				: request.directionToSource,
			'directionToSource',
		);
		const requestedLightDistance = sceneDistanceOrDefault(
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
		const intensity = finiteNumberOrDefault(request.intensity, 3, 'intensity');
		const sceneLightScales = this.resolveSceneLightScales({
			...request,
			directionToSource: directionToSourceScene,
		});
		const ambientIntensityRange = sceneAmbientIntensityRangeOrDefault(
			request.ambientIntensityRange,
			DEFAULT_SCENE_AMBIENT_INTENSITY_RANGE.min,
			finiteNumberOrDefault(
				request.ambientIntensity,
				DEFAULT_SCENE_AMBIENT_INTENSITY_RANGE.max,
				'ambientIntensity',
			));
		const ambientLightScaleValue = sceneLightScales.ambientLightScale.value;
		const ambientIntensity = scaleRange(
			ambientIntensityRange,
			ambientLightScaleValue,
		);
		const shadow = normalizeShadowRequest(request.shadow, focus, lightDistance);
		const shadowObjects = shadow.objects;
		const sourceLights = shadowObjects.length > 0
			? shadowObjects.map((shadowObject, index) => createDirectionalLight({
				THREE,
				directionToSource: directionToSourceScene,
				intensity: intensity / shadowObjects.length,
				focus: shadowObject.focus,
				lightDistance: shadowObject.lightDistance,
				shadowObject,
				objectIndex: index,
			}))
			: [createDirectionalLight({
				THREE,
				directionToSource: directionToSourceScene,
				intensity,
				focus,
				lightDistance,
				shadowObject: null,
				objectIndex: 0,
			})];
		const sceneObjects = sourceLights.map(({ target }) => target);
		const lights = /** @type {Array<DistantThreeDirectionalLight | DistantThreeObject>} */ (
			sourceLights.map(({ light }) => light)
		);
		const primaryShadow = shadowObjects[0] ?? null;

		if (ambientIntensity > 0) {
			lights.unshift(this._createThreeAmbientLight({
				THREE,
				ambientIntensity,
			}));
		}

		const result = {
			lights: lights,
			sceneObjects: sceneObjects,
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
			owner: 'DistantSunLightSource',
			sourceKey: 'distant-sun',
			shadowPolicy: 'three-shadow-map-from-distant-source-direction',
		}, request,
		);
	}

	/**
	 * Resolve the source path limit for a directional source.
	 *
	 * @returns {SourcePathLimit} The source path limit.
	 */
	resolveSourcePathLimit() {
		return {
			maxDistance: null,
			reason: 'distant-source-to-atmosphere-boundary',
		};
	}

	/**
	 * Create the light-source-owned distant sun shader contribution.
	 *
	 * @param {Algorithm32ShaderDescriptor} descriptor - Supplies the active descriptor.
	 * @returns {ShaderContribution} Return the light-source contribution.
	 */
	_createShaderContribution(descriptor) {
		return createShaderContribution({
			id: 'light-distant-sun',
			owner: 'lightSource',
			descriptorFingerprint: descriptor.lightSource.fingerprint,
			compatibilityTags: descriptor.lightSource.compatibilityTags,
			provides: ['light.directionToAtmosphericSource'],
			requires: [],
			uniforms: [
				createShaderUniformDescriptor(
					'uDistantSunDirection',
					'vec3',
					'lightSource.direction',
					this._configuration.directionToLight,
				),
			],
			functions: [
				createShaderSourceBlock('light-source-direction', 'sampleLightSource', 0, `vec3 directionToAtmosphericSource(vec3 positionMeters) {
	return normalize(uDistantSunDirection);
}`),
			],
		});
	}

	/**
	 * Create the light-source-owned distant sun shader contribution.
	 *
	 * @param {ShaderContributionRequest} request - Supplies the active shader descriptor.
	 * @returns {ShaderContribution} Return the light-source shader contribution.
	 */
	createShaderContribution(request) {
		return this._createShaderContribution(request?.descriptor);
	}
}
