const NODE_COUNT = 180;
const SPACING_DEGREES = 1;
const FIRST_CENTER_DEGREES = 0.5;

/** Create complete provisional local-solar-zenith construction support. */
export function createSolarZenith180Domain() {
	const nodes = Object.freeze(Array.from(
		{length: NODE_COUNT},
		(_unused, index) => {
			const solarZenithDegrees =
				FIRST_CENTER_DEGREES + index * SPACING_DEGREES;
			return Object.freeze({
				index,
				solarZenithDegrees,
				solarElevationDegrees: 90 - solarZenithDegrees,
				muS: Math.cos(solarZenithDegrees * Math.PI / 180),
			});
		},
	));

	return Object.freeze({
		id: 'uniform-solar-zenith-cell-centers-180x1-degree-v1',
		kind: 'local-solar-zenith-domain',
		count: NODE_COUNT,
		firstCenterDegrees: FIRST_CENTER_DEGREES,
		lastCenterDegrees:
			FIRST_CENTER_DEGREES + (NODE_COUNT - 1) * SPACING_DEGREES,
		spacingDegrees: SPACING_DEGREES,
		endpointPolicy:
			'physical 0/180-degree endpoints clamp to nearest center',
		interpolation: 'linear in solar-zenith angle between adjacent centers',
		nodes,
	});
}

export default createSolarZenith180Domain;
