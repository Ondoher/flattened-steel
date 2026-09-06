import DistanceMath from './DistanceMath.js';

/** Scene units constant. */
const SCENE_UNITS = 'scene-units';
/** Meters per scene unit constant. */
const METERS_PER_SCENE_UNIT = 'meters-per-scene-unit';

/**
 * Called by this module to create one scene-distance packet from a local scene scalar.
 *
 * @param {number} value - Supplies the scene distance.
 * @returns {SceneDistance} - The scene-distance packet.
 */
function inSceneUnits(value) {
	return {value, units: SCENE_UNITS};
}

/**
 * Called by this module to create one scene-position packet from local scene coordinates.
 *
 * @param {readonly number[]} coordinates - Supplies scene coordinates.
 * @returns {ScenePosition} - The scene-position packet.
 */
function positionInSceneUnits(coordinates) {
	return {coordinates: [coordinates[0], coordinates[1], coordinates[2]], units: SCENE_UNITS};
}

/**
 * Called by this module to create one scene-scale packet.
 *
 * @param {number} value - Supplies meters represented by one scene unit.
 * @returns {SceneScale} - The scene-scale packet.
 */
function scaleInMetersPerSceneUnit(value) {
	return {value, units: METERS_PER_SCENE_UNIT};
}

/**
 * Called by this module to assert one scene distance at a system boundary.
 *
 * @param {unknown} distance - Supplies the candidate scene distance.
 * @param {string} [label] - Supplies the error label.
 * @returns {void} -
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function assertSceneDistance(distance, label = 'scene distance') {
	if (!distance || typeof distance !== 'object') {
		throw new TypeError(`${label} must contain a finite value in scene-units.`);
	}
	const candidate = /** @type {{ value?: unknown, units?: unknown }} */ (distance);

	if (!Number.isFinite(candidate.value) || candidate.units !== SCENE_UNITS) {
		throw new TypeError(`${label} must contain a finite value in scene-units.`);
	}
}

/**
 * Called by this module to assert one scene position at a system boundary.
 *
 * @param {unknown} position - Supplies the candidate scene position.
 * @param {string} [label] - Supplies the error label.
 * @returns {void} -
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function assertScenePosition(position, label = 'scene position') {
	if (!position || typeof position !== 'object') {
		throw new TypeError(`${label} must contain three finite coordinates in scene-units.`);
	}
	const candidate = /** @type {{ coordinates?: unknown, units?: unknown }} */ (position);

	if (
		!Array.isArray(candidate.coordinates) ||
		candidate.coordinates.length !== 3 ||
		candidate.units !== SCENE_UNITS ||
		candidate.coordinates.some(
			/**
			 * Called by Array.prototype.some to test one collection value for a matching condition.
			 * @param value - The value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value) => !Number.isFinite(value),
		)
	) {
		throw new TypeError(`${label} must contain three finite coordinates in scene-units.`);
	}
}

/**
 * Called by this module to assert one scene scale at a system boundary.
 *
 * @param {unknown} scale - Supplies the candidate scale.
 * @param {string} [label] - Supplies the error label.
 * @returns {void} -
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function assertSceneScale(scale, label = 'scene scale') {
	if (!scale || typeof scale !== 'object') {
		throw new TypeError(`${label} must contain a positive value in meters-per-scene-unit.`);
	}
	const candidate = /** @type {{ value?: unknown, units?: unknown }} */ (scale);

	if (
		!Number.isFinite(candidate.value) ||
		/** @type {number} */ (candidate.value) <= 0 ||
		candidate.units !== METERS_PER_SCENE_UNIT
	) {
		throw new TypeError(`${label} must contain a positive value in meters-per-scene-unit.`);
	}
}

/**
 * Called by this module to normalize an accepted scene distance to a local meter scalar.
 *
 * @param {SceneDistance} distance - Supplies the accepted scene distance.
 * @param {SceneScale} scale - Supplies the accepted scene scale.
 * @returns {number} - Distance in meters.
 */
function toMeters(distance, scale) {
	return distance.value * scale.value;
}

/**
 * Called by this module to normalize an accepted scene position to local meter coordinates.
 *
 * @param {ScenePosition} position - Supplies the accepted scene position.
 * @param {SceneScale} scale - Supplies the accepted scene scale.
 * @returns {[number, number, number]} - Position in meters.
 */
function toMetersPosition(position, scale) {
	return [
		position.coordinates[0] * scale.value,
		position.coordinates[1] * scale.value,
		position.coordinates[2] * scale.value,
	];
}

/**
 * Called by this module to normalize an accepted physical distance to a local scene scalar.
 *
 * @param {Distance} distance - Supplies the accepted physical distance.
 * @param {SceneScale} scale - Supplies the accepted scene scale.
 * @returns {number} - Distance in scene units.
 */
function toSceneUnits(distance, scale) {
	return DistanceMath.toMeters(distance) / scale.value;
}

/**
 * Called by this module to normalize an accepted physical position to local scene coordinates.
 *
 * @param {Position} position - Supplies the accepted physical position.
 * @param {SceneScale} scale - Supplies the accepted scene scale.
 * @returns {[number, number, number]} - Position in scene units.
 */
function toScenePosition(position, scale) {
	const positionMeters = DistanceMath.toMetersPosition(position);
	return [positionMeters[0] / scale.value, positionMeters[1] / scale.value, positionMeters[2] / scale.value];
}

/**
 * Called by this module to resolve and validate a scene scale from a request.
 *
 * @param {SceneScaleRequest} request - The scale request.
 * @returns {SceneScale} - The accepted scene scale.
 *
 */
function scaleFromRequest(request) {
	const sceneScale = request.sceneScale === undefined ? scaleInMetersPerSceneUnit(1) : request.sceneScale;
	assertSceneScale(sceneScale, 'sceneScale');
	return sceneScale;
}

/**
 * Called by this module to accept an optional scene position with an omission default.
 *
 * @param {unknown} value - The candidate position.
 * @param {ScenePosition | null} fallback - The optional default.
 * @param {string} owner - The lighting owner label.
 * @param {string} label - The request-property label.
 * @returns {ScenePosition} - The normalized scene position.
 *
 */
function positionOrDefault(value, fallback, owner, label) {
	const position = value === undefined ? fallback : value;
	assertScenePosition(position, `${owner}.addSceneLighting ${label}`);
	const acceptedPosition = /** @type {ScenePosition} */ (position);

	return positionInSceneUnits(acceptedPosition.coordinates);
}

/**
 * Called by this module to accept an optional scene distance with an omission default.
 *
 * @param {unknown} value - The candidate distance.
 * @param {SceneDistance} fallback - The default distance.
 * @param {string} owner - The lighting owner label.
 * @param {string} label - The request-property label.
 * @returns {SceneDistance} - The normalized scene distance.
 *
 */
function distanceOrDefault(value, fallback, owner, label) {
	const distance = value === undefined ? fallback : value;
	assertSceneDistance(distance, `${owner}.addSceneLighting ${label}`);
	const acceptedDistance = /** @type {SceneDistance} */ (distance);

	return inSceneUnits(acceptedDistance.value);
}

/** Renderer scene-distance, position, and scale operations. */
export default {
	assertSceneDistance,
	assertScenePosition,
	assertSceneScale,
	distanceOrDefault,
	inSceneUnits,
	positionOrDefault,
	positionInSceneUnits,
	scaleFromRequest,
	scaleInMetersPerSceneUnit,
	toMeters,
	toMetersPosition,
	toScenePosition,
	toSceneUnits,
};
