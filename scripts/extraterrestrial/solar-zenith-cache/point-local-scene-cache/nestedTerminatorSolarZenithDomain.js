import {createSolarZenith180Domain} from
	'../san-jose-nautical-cache-poc/domains/solarZenith180Domain.js';

/** Retain all one-degree centers and add quarter-degree terminator nodes. */
export function createNestedTerminatorSolarZenithDomain() {
	const base = createSolarZenith180Domain();
	const values = [...new Set([...base.nodes.map((node) => node.solarZenithDegrees),
		...Array.from({length: 81}, (_unused, index) => 85 + index * 0.25)])].sort((a, b) => a - b);
	const nodes = Object.freeze(values.map((solarZenithDegrees, index) => Object.freeze({index,
		solarZenithDegrees, solarElevationDegrees: 90 - solarZenithDegrees,
		muS: Math.cos(solarZenithDegrees * Math.PI / 180)})));
	return Object.freeze({...base, id: 'uniform-z180-plus-quarter-degree-terminator-v1',
		count: nodes.length, firstCenterDegrees: nodes[0].solarZenithDegrees,
		lastCenterDegrees: nodes.at(-1).solarZenithDegrees, spacingDegrees: null,
		spacingPolicy: 'retain every Z180 center; add 0.25-degree nodes from 85 through 105', nodes});
}

export default createNestedTerminatorSolarZenithDomain;

