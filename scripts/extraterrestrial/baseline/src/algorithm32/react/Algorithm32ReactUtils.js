import DistanceMath from '../utils/DistanceMath.js';
import SceneMath from '../utils/SceneMath.js';
import { acceptPixelSize, createPixelSize } from '../utils/PixelMath.js';
import { requiredString } from '../descriptors/descriptorSupport.js';

/**
 * Accept an owner-created packet object.
 *
 * @param {unknown} value - Supplies the owner callback result.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {Record<string, unknown>} The accepted packet object.
 */
function acceptOwnerPacket(value, label) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError(`${label} must return an object packet.`);
	}

	return /** @type {Record<string, unknown>} */ (value);
}

/**
 * Accept one required object collection in an owner-created packet.
 *
 * @param {Record<string, unknown>} packet - Supplies the accepted packet.
 * @param {string} key - Supplies the collection property.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {readonly unknown[]} The accepted object collection.
 */
function requiredOwnerObjectCollection(packet, key, label) {
	const value = packet[key];

	if (!Array.isArray(value)) {
		throw new TypeError(`${label}.${key} must be an array.`);
	}

	return value;
}

/**
 * Accept one optional object collection in an owner-created packet.
 *
 * @param {Record<string, unknown>} packet - Supplies the accepted packet.
 * @param {string} key - Supplies the collection property.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {readonly unknown[]} The accepted object collection, or an empty
 * collection when the property is absent.
 */
function optionalOwnerObjectCollection(packet, key, label) {
	if (packet[key] === undefined) {
		return [];
	}

	return requiredOwnerObjectCollection(packet, key, label);
}

/**
 * Require one declared packet property without constraining its value type.
 *
 * @param {Record<string, unknown>} packet - Supplies the accepted packet.
 * @param {string} key - Supplies the required property.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {void}
 */
function requireOwnerPacketProperty(packet, key, label) {
	if (!(key in packet)) {
		throw new TypeError(`${label}.${key} is required.`);
	}
}

/**
 * Accept geometry-owned endpoint objects at the callback boundary.
 *
 * @param {unknown} value - Supplies the geometry callback result.
 * @returns {GeometryThreeEndpointObjects} The accepted endpoint packet.
 */
function acceptGeometryEndpointObjects(value) {
	const packet = acceptOwnerPacket(value, 'Algorithm32 geometry endpoint owner');

	requiredOwnerObjectCollection(packet, 'visualObjects', 'Algorithm32 geometry endpoint owner');
	requiredOwnerObjectCollection(packet, 'raycastObjects', 'Algorithm32 geometry endpoint owner');
	requireOwnerPacketProperty(packet, 'metadata', 'Algorithm32 geometry endpoint owner');

	return /** @type {GeometryThreeEndpointObjects} */ (value);
}

/**
 * Accept source-owned lighting objects at the callback boundary.
 *
 * @param {unknown} value - Supplies the light-source callback result.
 * @returns {LightSourceThreeLightingObjects} The accepted lighting packet.
 */
function acceptLightSourceObjects(value) {
	const packet = acceptOwnerPacket(value, 'Algorithm32 light-source owner');

	requiredOwnerObjectCollection(packet, 'lights', 'Algorithm32 light-source owner');
	optionalOwnerObjectCollection(packet, 'sceneObjects', 'Algorithm32 light-source owner');
	requireOwnerPacketProperty(packet, 'metadata', 'Algorithm32 light-source owner');

	return /** @type {LightSourceThreeLightingObjects} */ (value);
}

/**
 * Accept a required-Three-objects factory result at the React ownership
 * boundary.
 *
 * @param {unknown} value - Supplies the custom or default factory result.
 * @returns {Record<string, unknown> & { objects: readonly unknown[] }} The
 * accepted required-object packet.
 */
export function acceptAlgorithm32RequiredThreeObjectsPacket(value) {
	const packet = acceptOwnerPacket(value, 'Algorithm32 required Three objects factory');
	requiredOwnerObjectCollection(
		packet,
		'objects',
		'Algorithm32 required Three objects factory',
	);

	return /** @type {Record<string, unknown> & { objects: readonly unknown[] }} */ (value);
}

/**
 * Create mutable binding values for the common Algorithm32 camera uniforms.
 *
 * @param {object} THREE - Supplies the Three namespace.
 * @param {Distance | null} [sceneDepthMax] - Supplies an optional app
 * override for the geometry-owned scene-depth cap.
 * @returns {Record<string, unknown>} Mutable shader binding values.
 */
export function createAlgorithm32BindingValues(THREE, sceneDepthMax = null) {
	const bindings = {
		'geometry.inverseProjectionMatrix': new THREE.Matrix4(),
		'geometry.inverseViewMatrix': new THREE.Matrix4(),
		'geometry.cameraWorldPosition': new THREE.Vector3(),
		'geometry.cameraGroundRelativePosition': new THREE.Vector3(),
		'geometry.sceneTermination': DistanceMath.inMeters(0),
	};

	if (sceneDepthMax !== null) {
		const sceneDepthMaxMeters = DistanceMath.toMeters(sceneDepthMax);

		if (!Number.isFinite(sceneDepthMaxMeters) || sceneDepthMaxMeters <= 0) {
			throw new RangeError('sceneDepthMax must be a finite distance greater than zero.');
		}

		bindings['geometry.sceneDepthMax'] = DistanceMath.inMeters(sceneDepthMaxMeters);
	}

	return bindings;
}

/**
 * Update the common Algorithm32 camera bindings from one live Three frame.
 * Geometry owns scene-to-model and ground-relative position mapping.
 *
 * @param {object} request - Supplies live camera and configuration state.
 * @param {Record<string, unknown>} request.bindingValues - Supplies mutable shader bindings.
 * @param {import('three').Camera & { updateProjectionMatrix: () => void }} request.camera - Supplies the active Three camera.
 * @param {{ config: Config, sceneScale: SceneScale }} request.props - Supplies geometry and scale.
 * @returns {void}
 */
export function updateAlgorithm32BindingValues({ bindingValues, camera, props }) {
	camera.updateProjectionMatrix();
	camera.updateMatrixWorld();

	const inverseProjectionMatrix = /** @type {import('three').Matrix4} */ (
		bindingValues['geometry.inverseProjectionMatrix']
	);
	const inverseViewMatrix = /** @type {import('three').Matrix4} */ (
		bindingValues['geometry.inverseViewMatrix']
	);
	const cameraWorldPosition = /** @type {import('three').Vector3} */ (
		bindingValues['geometry.cameraWorldPosition']
	);
	const cameraGroundRelativePosition = /** @type {import('three').Vector3} */ (
		bindingValues['geometry.cameraGroundRelativePosition']
	);
	const cameraScenePosition = camera.getWorldPosition(camera.position.clone());
	const geometry = props.config.geometry;
	const modelPosition = geometry.mapObserverLocalScenePointToModelPosition(
		SceneMath.positionInSceneUnits([
			cameraScenePosition.x,
			cameraScenePosition.y,
			cameraScenePosition.z,
		]),
		{ sceneScale: props.sceneScale },
	);
	const modelPositionMeters = DistanceMath.toMetersPosition(modelPosition);
	const groundRelativePosition = geometry.resolveGroundRelativePosition?.(modelPosition);
	const groundRelativePositionMeters = groundRelativePosition === undefined
		? null
		: DistanceMath.toMetersPosition(groundRelativePosition);

	inverseProjectionMatrix.copy(camera.projectionMatrixInverse);
	inverseViewMatrix.copy(camera.matrixWorld);
	cameraWorldPosition.set(...modelPositionMeters);
	if (groundRelativePositionMeters !== null) {
		cameraGroundRelativePosition.set(...groundRelativePositionMeters);
	}
}

/**
 * Resolve an owner request from a direct value or request factory.
 *
 * @param {unknown} value - Supplies the direct request or request factory.
 * @param {unknown} context - Supplies factory evaluation context.
 * @returns {object} Return the resolved owner request.
 */
function resolveOwnerRequest(value, context) {
	if (value === undefined) {
		return {};
	}

	const resolved = typeof value === 'function' ? value(context) : value;

	if (resolved === null || typeof resolved !== 'object' || Array.isArray(resolved)) {
		throw new TypeError('Algorithm32 owner request must resolve to an object.');
	}

	return resolved;
}

/**
 * Create geometry- and light-source-owned Three objects required by Algorithm32.
 *
 * @param {object} request - Supplies config, Three, scale, and owner requests.
 * @returns {object} The created owner object packet.
 */
export function createAlgorithm32RequiredThreeObjects(request = {}) {
	const config = request.config;
	const geometry = config?.geometry;
	const lightSource = config?.lightSource;
	const sceneScale = request.sceneScale;
	const geometryRequest = resolveOwnerRequest(request.geometryEndpointRequest, request);
	const lightingRequest = resolveOwnerRequest(request.lightingRequest, request);
	const endpointObjects = typeof geometry?.createThreeEndpointObjects === 'function'
		? acceptGeometryEndpointObjects(geometry.createThreeEndpointObjects({
			sceneScale,
			...geometryRequest,
		}))
		: null;
	const createLightingObjects = typeof lightSource?.addSceneLighting === 'function'
		? lightSource.addSceneLighting.bind(lightSource)
		: null;
	const lightingObjects = typeof createLightingObjects === 'function'
		? acceptLightSourceObjects(createLightingObjects({
			THREE: request.THREE,
			...lightingRequest,
		}))
		: null;
	const endpointVisualObjects = endpointObjects === null ? [] : endpointObjects.visualObjects;
	const endpointRaycastObjects = endpointObjects === null ? [] : endpointObjects.raycastObjects;
	const lights = lightingObjects === null ? [] : lightingObjects.lights;
	const lightingSceneObjects = lightingObjects === null
		? []
		: lightingObjects.sceneObjects === undefined
			? []
			: lightingObjects.sceneObjects;

	for (const object of [
		...lights,
		...lightingSceneObjects,
	]) {
		const candidate = /** @type {{ userData?: Record<string, unknown> } | null} */ (object);
		if (candidate?.userData) {
			candidate.userData.algorithm32SceneInput = false;
		}
	}

	return {
		objects: [
			...endpointVisualObjects,
			...endpointRaycastObjects,
			...lights,
			...lightingSceneObjects,
		],
		endpointObjects,
		lightingObjects,
		metadata: {
			geometry: endpointObjects === null ? null : endpointObjects.metadata,
			lighting: lightingObjects === null ? null : lightingObjects.metadata,
		},
	};
}

/**
 * Create the default Algorithm32 scene-color render target.
 *
 * @param {object} request - Supplies render target facts.
 * @param {object} request.THREE - Supplies the Three namespace.
 * @param {PixelSize} request.viewportSize - Supplies unit-bearing target size.
 * @param {number} [request.type] - Supplies the texture type.
 * @param {string} [request.name] - Supplies the texture name.
 * @param {string} [request.colorSpace] - Supplies optional texture color space.
 * @returns {unknown} The created render target.
 */
export function createAlgorithm32SceneColorRenderTarget({
	THREE,
	viewportSize,
	type = THREE.UnsignedByteType,
	name = 'Algorithm32.sceneColor',
	colorSpace,
}) {
	const acceptedViewportSize = acceptPixelSize(
		viewportSize,
		'Algorithm32 scene-color render target viewportSize',
	);
	if (typeof type !== 'number' || !Number.isFinite(type)) {
		throw new TypeError('Algorithm32 scene-color render target type must be a finite number.');
	}
	const acceptedName = requiredString(
		name,
		'Algorithm32 scene-color render target name',
	);
	const acceptedColorSpace = colorSpace === undefined
		? undefined
		: requiredString(
			colorSpace,
			'Algorithm32 scene-color render target colorSpace',
		);
	const widthPixels = acceptedViewportSize.width;
	const heightPixels = acceptedViewportSize.height;
	const target = new THREE.WebGLRenderTarget(widthPixels, heightPixels, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat,
		type,
		depthBuffer: true,
		stencilBuffer: false,
	});

	target.texture.name = acceptedName;

	if (acceptedColorSpace !== undefined) {
		target.texture.colorSpace = acceptedColorSpace;
	}

	return target;
}

/**
 * Normalize one optional viewport dimension.
 *
 * @param {unknown} value - Supplies the dimension in pixels.
 * @param {string} label - Supplies a diagnostic label.
 * @returns {number} The normalized positive integer pixel count.
 */
function viewportPixelCount(value, label) {
	if (value === undefined) {
		return 1;
	}

	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
		throw new RangeError(`${label} must be a positive finite number.`);
	}

	return Math.max(1, Math.floor(value));
}

/**
 * Resolve a positive integer viewport size from R3F size state.
 *
 * @param {unknown} size - Supplies a size-like object.
 * @returns {PixelSize} Unit-bearing viewport width and height.
 */
export function algorithm32ViewportSize(size) {
	if (size !== undefined && (size === null || typeof size !== 'object' || Array.isArray(size))) {
		throw new TypeError('Algorithm32 R3F viewport size must be an object when supplied.');
	}

	const candidate = /** @type {{ width?: unknown, height?: unknown }} */ (size ?? {});
	const widthPixels = viewportPixelCount(candidate.width, 'Algorithm32 R3F viewport width');
	const heightPixels = viewportPixelCount(candidate.height, 'Algorithm32 R3F viewport height');

	return createPixelSize(
		widthPixels,
		heightPixels,
		'Algorithm32 R3F viewport size',
	);
}

/**
 * Resolve the optional R3F render priority.
 *
 * @param {unknown} value - Supplies an optional render priority.
 * @returns {number} The accepted finite render priority.
 */
export function algorithm32RenderPriority(value) {
	if (value === undefined) {
		return 1;
	}

	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new TypeError('Algorithm32 R3F renderPriority must be a finite number.');
	}

	return value;
}
