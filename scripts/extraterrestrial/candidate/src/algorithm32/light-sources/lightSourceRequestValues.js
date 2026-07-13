import { acceptPixelDistance, acceptPixelSize } from '../utils/PixelMath.js';
import { finiteNumberOrDefault } from '../utils/numericValues.js';
import SceneMath from '../utils/SceneMath.js';
import VectorMath from '../utils/VectorMath.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	assertSpectralPacket,
} from '../quantities/index.js';

/**
 * Accept source spectral irradiance at a light-source boundary.
 *
 * @param {unknown} sourceIrradiance - Supplies the candidate packet.
 * @param {string} owner - Supplies the owner label.
 * @returns {SpectralIrradiancePacket} The accepted packet.
 */
export function acceptSourceIrradiance(sourceIrradiance, owner) {
	const packet = assertSpectralPacket(sourceIrradiance, {
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
	});

	if (packet.values.some((value) => value < 0)) {
		throw new RangeError(`${owner} sourceIrradiance values must be non-negative.`);
	}

	return /** @type {SpectralIrradiancePacket} */ (packet);
}

/**
 * Clamp a trusted calculation result to the unit interval.
 *
 * @param {number} value - Supplies the calculated value.
 * @returns {number} The clamped value.
 */
export function clamp01(value) {
	return Math.min(1, Math.max(0, value));
}

/**
 * Accept optional ambient intensity bounds.
 *
 * @param {unknown} range - Supplies the optional requested range.
 * @param {number} defaultMin - Supplies the default minimum intensity.
 * @param {number} defaultMax - Supplies the default maximum intensity.
 * @returns {{ min: number, max: number }} The accepted range.
 */
export function sceneAmbientIntensityRangeOrDefault(range, defaultMin, defaultMax) {
	if (range !== undefined && (!range || typeof range !== 'object' || Array.isArray(range))) {
		throw new TypeError('ambientIntensityRange must be an object.');
	}
	const candidate = /** @type {{ min?: unknown, max?: unknown }} */ (range ?? {});

	const min = finiteNumberOrDefault(
		candidate.min,
		defaultMin,
		'ambientIntensityRange.min',
	);
	const max = finiteNumberOrDefault(
		candidate.max,
		defaultMax,
		'ambientIntensityRange.max',
	);

	if (min < 0) {
		throw new RangeError('ambientIntensityRange.min must be non-negative.');
	}
	if (max < min) {
		throw new RangeError('ambientIntensityRange.max must be greater than or equal to min.');
	}

	return { min, max };
}

/**
 * Scale a unit percentage into an accepted intensity range.
 *
 * @param {{ min: number, max: number }} range - Supplies min/max bounds.
 * @param {number} percent - Supplies a calculated unit percentage.
 * @returns {number} The scaled value.
 */
export function scaleRange(range, percent) {
	return range.min + (range.max - range.min) * clamp01(percent);
}

/**
 * Accept an optional scene position, defaulting only an omitted value.
 *
 * @param {unknown} value - Supplies the candidate position.
 * @param {ScenePosition | null} fallback - Supplies the optional default.
 * @param {string} owner - Supplies the lighting owner label.
 * @param {string} label - Supplies the request-property label.
 * @returns {ScenePosition} The normalized scene position.
 */
export function scenePositionOrDefault(value, fallback, owner, label) {
	const position = value === undefined ? fallback : value;
	SceneMath.assertScenePosition(position, `${owner}.addSceneLighting ${label}`);
	const acceptedPosition = /** @type {ScenePosition} */ (position);

	return SceneMath.positionInSceneUnits(acceptedPosition.coordinates);
}

/**
 * Accept an optional scene distance, defaulting only an omitted value.
 *
 * @param {unknown} value - Supplies the candidate distance.
 * @param {SceneDistance} fallback - Supplies the default distance.
 * @param {string} owner - Supplies the lighting owner label.
 * @param {string} label - Supplies the request-property label.
 * @returns {SceneDistance} The normalized scene distance.
 */
export function sceneDistanceOrDefault(value, fallback, owner, label) {
	const distance = value === undefined ? fallback : value;
	SceneMath.assertSceneDistance(distance, `${owner}.addSceneLighting ${label}`);
	const acceptedDistance = /** @type {SceneDistance} */ (distance);

	return SceneMath.inSceneUnits(acceptedDistance.value);
}

/**
 * Accept a pixel-size packet, defaulting only an omitted value.
 *
 * @param {unknown} value - Supplies the requested pixel size.
 * @param {PixelSize} fallback - Supplies the default pixel size.
 * @param {string} label - Supplies the request-property label.
 * @returns {PixelSize} The accepted pixel-size packet.
 */
export function pixelSizeOrDefault(value, fallback, label) {
	return acceptPixelSize(value === undefined ? fallback : value, label);
}

/**
 * Accept a pixel-distance packet, defaulting only an omitted value.
 *
 * @param {unknown} value - Supplies the requested pixel distance.
 * @param {PixelDistance} fallback - Supplies the default pixel distance.
 * @param {string} label - Supplies the request-property label.
 * @returns {PixelDistance} The accepted pixel-distance packet.
 */
export function pixelDistanceOrDefault(value, fallback, label) {
	return acceptPixelDistance(value === undefined ? fallback : value, label);
}

/**
 * Accept a non-empty string, defaulting only an omitted value.
 *
 * @param {unknown} value - Supplies the candidate string.
 * @param {string} fallback - Supplies the default string.
 * @param {string} label - Supplies the request-property label.
 * @returns {string} The accepted string.
 */
export function requiredStringOrDefault(value, fallback, label) {
	const resolved = value === undefined ? fallback : value;
	if (typeof resolved !== 'string' || resolved.trim().length === 0) {
		throw new TypeError(`${label} must be a non-empty string.`);
	}

	return resolved;
}

/**
 * Normalize a non-zero direction at a request boundary.
 *
 * @param {unknown} direction - Supplies the direction candidate.
 * @param {string} label - Supplies the request-property label.
 * @returns {UnitVector3} The normalized direction.
 */
export function normalizeDirection(direction, label) {
	if (!Array.isArray(direction) || direction.length !== 3 || !direction.every(Number.isFinite)) {
		throw new TypeError(`${label} must be a finite three-component vector.`);
	}

	if (VectorMath.length(direction) <= Number.EPSILON) {
		throw new RangeError(`${label} must be non-zero.`);
	}

	const normalized = VectorMath.normalize(direction);
	return [normalized[0], normalized[1], normalized[2]];
}
