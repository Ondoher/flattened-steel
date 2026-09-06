import DistanceMath from '../utils/DistanceMath.js';

/**
 * Require flat geometry's derived source-relative frame to use the canonical
 * position owned by the configured local Sun.
 *
 * @param {Pick<LocalSunLightSourceConfig, "position">} sourceConfiguration -
 * Supplies the source-owned physical position.
 * @param {Pick<FlatEarthGeometryConfiguration, "sourcePosition">} geometryConfiguration -
 * Supplies geometry's paired reconstruction position.
 * @returns {void}
 */
export function assertLocalSunGeometryPairing(
	sourceConfiguration,
	geometryConfiguration,
) {
	const sourcePositionMeters = DistanceMath.toMetersPosition(
		sourceConfiguration.position,
	);
	const geometryPositionMeters = DistanceMath.toMetersPosition(
		geometryConfiguration.sourcePosition,
	);
	if (sourcePositionMeters.some(
		(value, index) => value !== geometryPositionMeters[index],
	)) {
		throw new RangeError(
			'Flat/local construction requires geometry sourcePosition to '
				+ 'match the local Sun source-owned position exactly.',
		);
	}
}
