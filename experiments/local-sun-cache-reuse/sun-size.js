/** Mean apparent solar diameter at one astronomical unit: 1919 arcseconds.
 * Source: https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html
 * This is a fixed angular reference, not a date-dependent ephemeris.
 */
export const SOLAR_ANGULAR_DIAMETER_DEGREES = 1919 / 3600;

/** Derive selectable physical radii without changing parent controls or source power.
 * @param {readonly LocalSunCelestialControlState[]} states - Frozen placements with metre-normalized geometry and source configuration.
 * @param {LocalSunSunSizeMode} mode - Fixed historical radius or overhead angular calibration.
 * @returns {LocalSunSunSizeSelection} - Detached derivative states and complete calibration facts.
 * @throws {RangeError} - For unsupported selection or invalid height/radius/reference-distance relationships.
 */
export function selectSunSize(states, mode) {
	if (!['fixed-16mi', 'overhead-calibrated'].includes(mode) || !states.length)
		throw new RangeError('Sun size requires a supported mode and nonempty controls.');
	const targetRadians = SOLAR_ANGULAR_DIAMETER_DEGREES * Math.PI / 180;
	const rows = states.map((state) => {
		const height = state.geometry.localLightSourceHeight,
			reference = state.source.referenceDistance,
			radius = mode === 'fixed-16mi' ? 16 * 1609.344 : height.value * Math.sin(targetRadians / 2);
		if (height.units !== 'meters' || reference.units !== 'meters' ||
			!Number.isFinite(height.value) || !(height.value > 0) ||
			state.geometry.sourcePosition.units !== 'meters' || state.geometry.sourcePosition.coordinates[2] !== height.value ||
			state.source.position.units !== 'meters' || state.source.position.coordinates[2] !== height.value ||
			state.source.radius.units !== 'meters' || !Number.isFinite(state.source.radius.value) || !(state.source.radius.value > 0) ||
			!Number.isFinite(reference.value) || !(radius > 0) || !(radius < height.value) || !(radius < reference.value))
			throw new RangeError('Sun-size calibration requires a positive metre height, matching placement and external reference distance.');
		return {
			id: state.id, sourceHeightMeters: height.value,
			inputRadiusMeters: state.source.radius.value, radiusMeters: radius,
			overheadAngularDiameterDegrees: 2 * Math.asin(radius / height.value) * 180 / Math.PI,
		};
	});
	return {
		states: states.map((state, index) => ({...state, source: {...state.source, radius: {value: rows[index].radiusMeters, units: 'meters'}}})),
		calibration: {
			mode, referenceAngularDiameterDegrees: SOLAR_ANGULAR_DIAMETER_DEGREES,
			angularReference: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html',
			calibrationObserverAltitudeMeters: 0,
			operation: mode === 'fixed-16mi' ? 'radius = 16 * 1609.344 metres' : 'radius = sourceHeight * sin(meanSolarAngularDiameter / 2); angles in radians; ground observer directly below source',
			brightnessPolicy: 'Keep reference irradiance, distance, scale and falloff. Shared finite-source owner recomputes uniform-disc radiance from the selected solid angle.',
			rows,
		},
	};
}
