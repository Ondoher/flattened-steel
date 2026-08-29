import {createNative48PositionDomain} from
	'../san-jose-nautical-cache-poc/domains/native48PositionDomain.js';

const SUPPLEMENTAL_ALTITUDES_METERS = Object.freeze([10, 50, 100, 250, 500, 1000, 1500]);

/** Retain every Native48 node and add seven near-ground construction/runtime nodes. */
export function createNestedNearGround55PositionDomain() {
	const base = createNative48PositionDomain();
	const values = [...new Set([...base.nodes.map((node) => node.altitudeMeters),
		...SUPPLEMENTAL_ALTITUDES_METERS])].sort((a, b) => a - b);
	const nodes = Object.freeze(values.map((altitudeMeters, index) => Object.freeze({index,
		altitudeMeters, role: base.nodes.some((node) => node.altitudeMeters === altitudeMeters)
			? 'retained-native48-node' : 'supplemental-near-ground-node'})));
	return Object.freeze({...base, id: 'native48-plus-seven-near-ground-position-55-v1',
		count: nodes.length, generatorRevision: 'p8-nested-near-ground-55-v1', nodes,
		supplementalAltitudesMeters: SUPPLEMENTAL_ALTITUDES_METERS});
}

export default createNestedNearGround55PositionDomain;

