/** Create the P8-qualified nonuniform local-solar-zenith grid. */
export function createAdaptiveTerminatorSolarZenithDomain() {
	const values = [];
	for (let value = 0.5; value < 85; value += 1.5) values.push(value);
	for (let value = 85; value <= 105; value += 0.25) values.push(value);
	for (let value = 106; value <= 179.5; value += 1.5) values.push(value);
	if (values.at(-1) !== 179.5) values.push(179.5);
	const nodes = Object.freeze(values.map((solarZenithDegrees, index) => Object.freeze({index,
		solarZenithDegrees, solarElevationDegrees: 90 - solarZenithDegrees,
		muS: Math.cos(solarZenithDegrees * Math.PI / 180)})));
	return Object.freeze({id: 'adaptive-terminator-solar-zenith-v1',
		kind: 'local-solar-zenith-domain', count: nodes.length,
		firstCenterDegrees: nodes[0].solarZenithDegrees,
		lastCenterDegrees: nodes.at(-1).solarZenithDegrees,
		spacingPolicy: '1.5 degrees outside 85-105; 0.25 degrees inside 85-105',
		endpointPolicy: 'physical 0/180-degree endpoints clamp to nearest center',
		interpolation: 'linear in solar-zenith angle between adjacent centers', nodes});
}

export default createAdaptiveTerminatorSolarZenithDomain;

