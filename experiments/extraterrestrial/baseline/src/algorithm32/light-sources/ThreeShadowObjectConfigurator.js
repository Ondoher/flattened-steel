import { requiredString } from '../descriptors/descriptorSupport.js';
import { layerIndexOrNull } from './threeLightingSupport.js';

/**
 * Resolve a boolean option with fallback only when absent.
 *
 * @param {unknown} value - Supplies candidate value.
 * @param {boolean} fallback - Supplies fallback value.
 * @param {string} label - Supplies the option label.
 * @returns {boolean} The validated boolean.
 */
function booleanOrDefault(value, fallback, label) {
	if (value === undefined) {
		return fallback;
	}

	if (typeof value !== 'boolean') {
		throw new TypeError(`${label} must be boolean.`);
	}

	return value;
}

/**
 * Configure an app-authored Three object tree for source-owned shadows.
 *
 * @param {unknown} object - Supplies a Three object or mesh.
 * @param {object} owner - Supplies source-owned shadow metadata.
 * @param {object} [request] - Supplies shadow flag overrides.
 * @returns {unknown} The configured object.
 */
export function configureThreeShadowObject(object, owner, request = {}) {
	if (!object || typeof object !== 'object') {
		throw new TypeError('configureThreeShadowObject requires a Three object.');
	}

	if (!owner || typeof owner !== 'object' || Array.isArray(owner)) {
		throw new TypeError('configureThreeShadowObject requires owner metadata.');
	}

	if (request === null || typeof request !== 'object' || Array.isArray(request)) {
		throw new TypeError('configureThreeShadowObject request must be an object when supplied.');
	}

	const ownerId = requiredString(owner.owner, 'Shadow owner');
	const ownerShadowPolicy = requiredString(owner.shadowPolicy, 'Shadow owner policy');
	const ownerSourceKey = requiredString(owner.sourceKey, 'Shadow owner sourceKey');

	const castShadow = booleanOrDefault(request.castShadow, true, 'castShadow');
	const receiveShadow = booleanOrDefault(request.receiveShadow, true, 'receiveShadow');
	const includeDescendants = booleanOrDefault(
		request.includeDescendants,
		true,
		'includeDescendants',
	);
	const shadowPolicy = request.shadowPolicy === undefined
		? ownerShadowPolicy
		: requiredString(request.shadowPolicy, 'shadowPolicy');
	const sourceKey = request.sourceKey === undefined
		? ownerSourceKey
		: requiredString(request.sourceKey, 'sourceKey');
	const layerIndex = layerIndexOrNull(request.layerIndex);
	const configuredNodes = [];
	/**
	 * Configure one accepted Three shadow node.
	 *
	 * @param {unknown} node - Supplies the candidate node.
	 * @returns {void}
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
		if (layerIndex !== null
			&& acceptedNode.layers
			&& typeof acceptedNode.layers.enable === 'function') {
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
