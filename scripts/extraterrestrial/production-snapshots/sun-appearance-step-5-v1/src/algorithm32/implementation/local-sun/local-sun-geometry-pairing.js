import DistanceMath from '../../math/DistanceMath.js';

/**
 * Call this function to require flat geometry's derived source-relative frame to use the canonical position owned by the configured local Sun.
 *
 * @param {Pick<LocalSunLightSourceConfiguration, "position">} sourceConfiguration -
 * Supplies the source-owned physical position.
 * @param {Pick<FlatEarthGeometryConfiguration, "sourcePosition">} geometryConfiguration -
 * Supplies geometry's paired reconstruction position.
 * @returns {void} -
 * @throws {RangeError} - When an accepted value is outside the supported range.
 */
export function assertLocalSunGeometryPairing(sourceConfiguration, geometryConfiguration) {
	const sourcePositionMeters = DistanceMath.toMetersPosition(sourceConfiguration.position);
	const geometryPositionMeters = DistanceMath.toMetersPosition(geometryConfiguration.sourcePosition);
	if (
		sourcePositionMeters.some(
			/**
			 * Called by Array.prototype.some to test one collection value for a matching condition.
			 * @param value - The value accepted by the operation.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value, index) => value !== geometryPositionMeters[index],
		)
	) {
		throw new RangeError(
			'Flat/local construction requires geometry sourcePosition to ' +
				'match the local Sun source-owned position exactly.',
		);
	}
}
