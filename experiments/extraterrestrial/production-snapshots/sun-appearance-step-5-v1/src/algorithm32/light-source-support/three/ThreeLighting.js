import {ValueValidation} from '../../validation/ValueValidation.js';

/**
 * Called by this module to resolve an optional Three layer index, defaulting only omission to no layer. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {unknown} value - The candidate layer index.
 * @returns {number | null} - The accepted layer index or internal absent marker.
 * @throws {RangeError} - When an accepted value is outside the supported range.
 */
function layerIndexOrNull(value) {
	if (value === undefined) {
		return null;
	}

	if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 31) {
		throw new RangeError('layerIndex must be an integer from 0 to 31.');
	}

	return value;
}

/**
 * Called by this module to apply an accepted optional Three layer index.
 *
 * @param {unknown} object - The object with optional Three layers.
 * @param {number | null} layerIndex - The accepted layer index.
 * @returns {void} - No return value.
 *
 */
function applyLayerIndex(object, layerIndex) {
	const candidate = /** @type {{ layers?: { set?: (layerIndex: number) => void } }} */ (object);
	if (layerIndex === null || !candidate?.layers || typeof candidate.layers.set !== 'function') {
		return;
	}

	candidate.layers.set(layerIndex);
}

/**
 * Called by this module to add created lighting objects to a supplied Three scene in source-owned order.
 *
 * @param {unknown} scene - The optional Three scene.
 * @param {LightSourceThreeLightingObjects} lightingObjects - The created lighting objects.
 * @returns {void} - No return value.
 *
 */
function addObjectsToScene(scene, lightingObjects) {
	const candidate = /** @type {{ add?: (object: unknown) => void }} */ (scene);
	if (!candidate || typeof candidate.add !== 'function') {
		return;
	}
	const sceneObjects = lightingObjects.sceneObjects === undefined ? [] : lightingObjects.sceneObjects;

	for (const object of [...lightingObjects.lights, ...sceneObjects]) {
		candidate.add(object);
	}
}

/**
 * Called by this module to configure an app-authored Three object tree for source-owned shadows.
 *
 * @param {unknown} object - The Three object or mesh.
 * @param {LightSourceThreeShadowOwner} owner - The source-owned shadow metadata.
 * @param {LightSourceThreeShadowConfigurationRequest} [request] - The shadow flag overrides.
 * @returns {unknown} - The configured object.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function configureShadowObject(object, owner, request = {}) {
	if (!object || typeof object !== 'object') {
		throw new TypeError('configureThreeShadowObject requires a Three object.');
	}

	if (!owner || typeof owner !== 'object' || Array.isArray(owner)) {
		throw new TypeError('configureThreeShadowObject requires owner metadata.');
	}

	if (request === null || typeof request !== 'object' || Array.isArray(request)) {
		throw new TypeError('configureThreeShadowObject request must be an object when supplied.');
	}

	const ownerId = ValueValidation.requiredString(owner.owner, 'Shadow owner');
	const ownerShadowPolicy = ValueValidation.requiredString(owner.shadowPolicy, 'Shadow owner policy');
	const ownerSourceKey = ValueValidation.requiredString(owner.sourceKey, 'Shadow owner sourceKey');

	const castShadow = ValueValidation.booleanOrDefault(request.castShadow, true, 'castShadow');
	const receiveShadow = ValueValidation.booleanOrDefault(request.receiveShadow, true, 'receiveShadow');
	const includeDescendants = ValueValidation.booleanOrDefault(request.includeDescendants, true, 'includeDescendants');
	const shadowPolicy =
		request.shadowPolicy === undefined
			? ownerShadowPolicy
			: ValueValidation.requiredString(request.shadowPolicy, 'shadowPolicy');
	const sourceKey =
		request.sourceKey === undefined
			? ownerSourceKey
			: ValueValidation.requiredString(request.sourceKey, 'sourceKey');
	const layerIndex = layerIndexOrNull(request.layerIndex);
	const configuredNodes = [];
	/**
	 * Called by ThreeLighting.configureShadowObject to configure one accepted
	 * Three shadow node.
	 *
	 * @param {unknown} node - The candidate node.
	 * @returns {void} - No return value.
	 */
	const configureNode = (node) => {
		if (!node || typeof node !== 'object') {
			return;
		}

		const acceptedNode = /** @type {ThreeShadowNode} */ (node);
		acceptedNode.castShadow = castShadow;
		acceptedNode.receiveShadow = receiveShadow;
		acceptedNode.userData ??= {};
		acceptedNode.userData.algorithm32ShadowObject = true;
		acceptedNode.userData.shadowPolicy = shadowPolicy;
		acceptedNode.userData.shadowSourceKey = sourceKey;
		acceptedNode.userData.shadowConfigurationPolicy = 'source-owned-three-shadow-object-flags';
		if (layerIndex !== null && acceptedNode.layers && typeof acceptedNode.layers.enable === 'function') {
			acceptedNode.layers.enable(layerIndex);
			acceptedNode.userData.shadowLayerIndex = layerIndex;
		}
		configuredNodes.push(acceptedNode);
	};
	const root = /** @type {ThreeShadowNode} */ (object);

	if (includeDescendants && typeof root.traverse === 'function') {
		root.traverse(configureNode);
	} else {
		configureNode(root);
	}

	root.userData ??= {};
	root.userData.algorithm32ShadowConfiguration = {
		owner: ownerId,
		sourceKey,
		shadowPolicy,
		castShadow,
		receiveShadow,
		includeDescendants,
		layerIndex,
		configuredNodeCount: configuredNodes.length,
	};

	return root;
}

/** Three object, layer, scene, and shadow configuration methods. */
export const ThreeLighting = {
	addObjectsToScene,
	applyLayerIndex,
	configureShadowObject,
	layerIndexOrNull,
};
