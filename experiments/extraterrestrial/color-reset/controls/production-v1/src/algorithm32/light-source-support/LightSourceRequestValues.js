import VectorMath from '../math/VectorMath.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket as SpectralPacketClass} from '../spectral-values/index.js';

/**
 * Called by this module to accept source spectral irradiance at a light-source boundary.
 *
 * @param {unknown} sourceIrradiance - The candidate packet.
 * @param {string} owner - The owner label.
 * @returns {SpectralIrradiancePacket} - The accepted packet.
 * @throws {RangeError} - When an accepted value is outside the supported range.
 */
function acceptSourceIrradiance(sourceIrradiance, owner) {
	const packet = SpectralPacketClass.assert(sourceIrradiance, {
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
	});

	if (
		packet.values.some(
			/**
			 * Called by Array.prototype.some to test one collection value for a matching condition.
			 * @param value - The value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value) => value < 0,
		)
	) {
		throw new RangeError(`${owner} sourceIrradiance values must be non-negative.`);
	}

	return /** @type {SpectralIrradiancePacket} */ (packet);
}

/**
 * Called by this module to normalize a non-zero direction at a light-source request boundary.
 *
 * @param {unknown} direction - The direction candidate.
 * @param {string} label - The request-property label.
 * @returns {UnitVector3} - The normalized direction.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 * @throws {RangeError} - When an accepted value is outside the supported range.
 */
function normalizeDirection(direction, label) {
	const vector = /** @type {readonly number[]} */ (direction);

	if (!vector.every(Number.isFinite)) {
		throw new TypeError(`${label} must be a finite three-component vector.`);
	}

	if (VectorMath.length(vector) <= Number.EPSILON) {
		throw new RangeError(`${label} must be non-zero.`);
	}

	const normalized = VectorMath.normalize(vector);
	return [normalized[0], normalized[1], normalized[2]];
}

/** Physical light-source request acceptance and normalization methods. */
export const LightSourceRequestValues = {
	acceptSourceIrradiance,
	normalizeDirection,
};
