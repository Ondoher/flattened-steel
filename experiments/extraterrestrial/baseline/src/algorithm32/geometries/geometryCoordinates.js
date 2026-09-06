import DistanceMath from '../utils/DistanceMath.js';
import SceneMath from '../utils/SceneMath.js';
import VectorMath from '../utils/VectorMath.js';

/**
 * Validate one core direction tuple.
 *
 * @param {unknown} value - Supplies the candidate value.
 * @param {string} label - Supplies the error label.
 * @returns {readonly [number, number, number]} The vector tuple.
 */
export function directionTuple(value, label) {
	if (Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)) {
		return [value[0], value[1], value[2]];
	}

	throw new TypeError(`${label} must be a finite three-component vector.`);
}

/**
 * Normalize a physical position packet to local meter coordinates.
 *
 * @param {unknown} value - Supplies the candidate value.
 * @param {string} label - Supplies the error label.
 * @returns {[number, number, number]} Coordinates in meters.
 */
export function positionToMeters(value, label) {
	DistanceMath.assertPosition(value, label);
	return DistanceMath.toMetersPosition(/** @type {Position} */ (value));
}

/**
 * Create a normalized physical position packet.
 *
 * @param {readonly number[]} coordinates - Supplies meter coordinates.
 * @returns {Position} The position packet.
 */
export function positionInMeters(coordinates) {
	return { coordinates: [coordinates[0], coordinates[1], coordinates[2]], units: 'meters' };
}

/**
 * Create a normalized scene-position packet.
 *
 * @param {readonly number[]} coordinates - Supplies scene coordinates.
 * @returns {ScenePosition} The scene-position packet.
 */
export function scenePositionInUnits(coordinates) {
	return SceneMath.positionInSceneUnits([coordinates[0], coordinates[1], coordinates[2]]);
}

/**
 * Normalize a non-zero direction.
 *
 * @param {unknown} direction - Supplies the direction candidate.
 * @param {string} label - Supplies the error label.
 * @returns {UnitVector3} The normalized direction.
 */
export function normalizeDirection(direction, label) {
	const vector = directionTuple(direction, label);

	if (VectorMath.length(vector) <= Number.EPSILON) {
		throw new RangeError(`${label} must be non-zero.`);
	}

	const normalized = VectorMath.normalize(vector);
	return /** @type {UnitVector3} */ [normalized[0], normalized[1], normalized[2]];
}

/**
 * Resolve and validate scene scale from request.
 *
 * @param {object} request - Supplies scale request.
 * @returns {SceneScale} The accepted scene scale.
 */
export function sceneScaleFromRequest(request) {
	const sceneScale = request.sceneScale === undefined
		? SceneMath.scaleInMetersPerSceneUnit(1)
		: request.sceneScale;
	SceneMath.assertSceneScale(sceneScale, 'sceneScale');
	return sceneScale;
}

/**
 * Read a Three-style vector at the renderer adapter boundary.
 *
 * @param {unknown} value - Supplies a Three vector candidate.
 * @param {string} label - Supplies the error label.
 * @returns {readonly [number, number, number]} The vector tuple.
 */
export function threeVectorTuple(value, label) {
	const candidate = /** @type {{ x?: unknown, y?: unknown, z?: unknown }} */ (value);

	if (typeof candidate?.x === 'number' && Number.isFinite(candidate.x)
		&& typeof candidate.y === 'number' && Number.isFinite(candidate.y)
		&& typeof candidate.z === 'number' && Number.isFinite(candidate.z)) {
		return [candidate.x, candidate.y, candidate.z];
	}

	throw new TypeError(`${label} must be a Three-style vector.`);
}
