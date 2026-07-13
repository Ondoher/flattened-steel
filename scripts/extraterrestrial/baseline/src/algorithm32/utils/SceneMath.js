import DistanceMath from './DistanceMath.js';

const SCENE_UNITS = 'scene-units';
const METERS_PER_SCENE_UNIT = 'meters-per-scene-unit';

/**
 * Create one scene-distance packet from a local scene scalar.
 *
 * @param {number} value - Supplies the scene distance.
 * @returns {SceneDistance} The scene-distance packet.
 */
function inSceneUnits(value) {
	return { value, units: SCENE_UNITS };
}

/**
 * Create one scene-position packet from local scene coordinates.
 *
 * @param {readonly [number, number, number]} coordinates - Supplies scene coordinates.
 * @returns {ScenePosition} The scene-position packet.
 */
function positionInSceneUnits(coordinates) {
	return { coordinates: [...coordinates], units: SCENE_UNITS };
}

/**
 * Create one scene-scale packet.
 *
 * @param {number} value - Supplies meters represented by one scene unit.
 * @returns {SceneScale} The scene-scale packet.
 */
function scaleInMetersPerSceneUnit(value) {
	return { value, units: METERS_PER_SCENE_UNIT };
}

/**
 * Assert one scene distance at a system boundary.
 *
 * @param {unknown} distance - Supplies the candidate scene distance.
 * @param {string} [label] - Supplies the error label.
 * @returns {void}
 */
function assertSceneDistance(distance, label = 'scene distance') {
	if (!distance || typeof distance !== 'object') {
		throw new TypeError(`${label} must contain a finite value in scene-units.`);
	}
	const candidate = /** @type {{ value?: unknown, units?: unknown }} */ (distance);

	if (!Number.isFinite(candidate.value)
		|| candidate.units !== SCENE_UNITS) {
		throw new TypeError(`${label} must contain a finite value in scene-units.`);
	}
}

/**
 * Assert one scene position at a system boundary.
 *
 * @param {unknown} position - Supplies the candidate scene position.
 * @param {string} [label] - Supplies the error label.
 * @returns {void}
 */
function assertScenePosition(position, label = 'scene position') {
	if (!position || typeof position !== 'object') {
		throw new TypeError(`${label} must contain three finite coordinates in scene-units.`);
	}
	const candidate = /** @type {{ coordinates?: unknown, units?: unknown }} */ (position);

	if (!Array.isArray(candidate.coordinates)
		|| candidate.coordinates.length !== 3
		|| candidate.units !== SCENE_UNITS
		|| candidate.coordinates.some((value) => !Number.isFinite(value))) {
		throw new TypeError(`${label} must contain three finite coordinates in scene-units.`);
	}
}

/**
 * Assert one scene scale at a system boundary.
 *
 * @param {unknown} scale - Supplies the candidate scale.
 * @param {string} [label] - Supplies the error label.
 * @returns {void}
 */
function assertSceneScale(scale, label = 'scene scale') {
	if (!scale || typeof scale !== 'object') {
		throw new TypeError(`${label} must contain a positive value in meters-per-scene-unit.`);
	}
	const candidate = /** @type {{ value?: unknown, units?: unknown }} */ (scale);

	if (!Number.isFinite(candidate.value)
		|| /** @type {number} */ (candidate.value) <= 0
		|| candidate.units !== METERS_PER_SCENE_UNIT) {
		throw new TypeError(`${label} must contain a positive value in meters-per-scene-unit.`);
	}
}

/**
 * Normalize an accepted scene distance to a local meter scalar.
 *
 * @param {SceneDistance} distance - Supplies the accepted scene distance.
 * @param {SceneScale} scale - Supplies the accepted scene scale.
 * @returns {number} Distance in meters.
 */
function toMeters(distance, scale) {
	return distance.value * scale.value;
}

/**
 * Normalize an accepted scene position to local meter coordinates.
 *
 * @param {ScenePosition} position - Supplies the accepted scene position.
 * @param {SceneScale} scale - Supplies the accepted scene scale.
 * @returns {[number, number, number]} Position in meters.
 */
function toMetersPosition(position, scale) {
	return [
		position.coordinates[0] * scale.value,
		position.coordinates[1] * scale.value,
		position.coordinates[2] * scale.value,
	];
}

/**
 * Normalize an accepted physical distance to a local scene scalar.
 *
 * @param {Distance} distance - Supplies the accepted physical distance.
 * @param {SceneScale} scale - Supplies the accepted scene scale.
 * @returns {number} Distance in scene units.
 */
function toSceneUnits(distance, scale) {
	return DistanceMath.toMeters(distance) / scale.value;
}

/**
 * Normalize an accepted physical position to local scene coordinates.
 *
 * @param {Position} position - Supplies the accepted physical position.
 * @param {SceneScale} scale - Supplies the accepted scene scale.
 * @returns {[number, number, number]} Position in scene units.
 */
function toScenePosition(position, scale) {
	const positionMeters = DistanceMath.toMetersPosition(position);
	return [
		positionMeters[0] / scale.value,
		positionMeters[1] / scale.value,
		positionMeters[2] / scale.value,
	];
}

export default {
	assertSceneDistance,
	assertScenePosition,
	assertSceneScale,
	inSceneUnits,
	positionInSceneUnits,
	scaleInMetersPerSceneUnit,
	toMeters,
	toMetersPosition,
	toScenePosition,
	toSceneUnits,
};
