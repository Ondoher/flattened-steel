/**
 * Resolve an optional Three layer index, defaulting only omission to no layer.
 *
 * @param {unknown} value - Supplies the candidate layer index.
 * @returns {number | null} The accepted layer index or internal absent marker.
 */
export function layerIndexOrNull(value) {
	if (value === undefined) {
		return null;
	}

	if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 31) {
		throw new RangeError('layerIndex must be an integer from 0 to 31.');
	}

	return value;
}

/**
 * Apply an accepted optional Three layer index.
 *
 * @param {unknown} object - Supplies an object with optional Three layers.
 * @param {number | null} layerIndex - Supplies the accepted layer index.
 * @returns {void}
 */
export function applyLayerIndex(object, layerIndex) {
	const candidate = /** @type {{ layers?: { set?: (layerIndex: number) => void } }} */ (object);
	if (layerIndex === null || !candidate?.layers || typeof candidate.layers.set !== 'function') {
		return;
	}

	candidate.layers.set(layerIndex);
}

/**
 * Reject non-canonical properties at a request boundary.
 *
 * @param {object} value - Supplies the candidate object.
 * @param {readonly string[]} allowedProperties - Supplies canonical property names.
 * @param {string} label - Supplies the request-object label.
 * @param {string} [contractName] - Supplies the named canonical contract.
 * @returns {void}
 */
export function assertOnlyProperties(
	value,
	allowedProperties,
	label,
	contractName = 'shadow',
) {
	const unexpectedProperty = Object.keys(value)
		.find((property) => !allowedProperties.includes(property));

	if (unexpectedProperty) {
		throw new TypeError(
			`${label}.${unexpectedProperty} is not part of the canonical ${contractName} contract.`,
		);
	}
}

/**
 * Add created lighting objects to a supplied Three scene.
 *
 * @param {unknown} scene - Supplies an optional Three scene.
 * @param {LightSourceThreeLightingObjects} lightingObjects - Supplies created lighting objects.
 * @returns {void}
 */
export function addLightingObjectsToScene(scene, lightingObjects) {
	const candidate = /** @type {{ add?: (object: unknown) => void }} */ (scene);
	if (!candidate || typeof candidate.add !== 'function') {
		return;
	}
	const sceneObjects = lightingObjects.sceneObjects === undefined
		? []
		: lightingObjects.sceneObjects;

	for (const object of [...lightingObjects.lights, ...sceneObjects]) {
		candidate.add(object);
	}
}
