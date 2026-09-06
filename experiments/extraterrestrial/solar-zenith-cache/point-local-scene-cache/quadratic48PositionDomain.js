import {createNative48PositionDomain} from
	'../san-jose-nautical-cache-poc/domains/native48PositionDomain.js';

/** Create the P8-qualified fixed-count radial grid concentrated near ground. */
export function createQuadratic48PositionDomain() {
	const base = createNative48PositionDomain();
	const nodes = Object.freeze(base.nodes.map((node, index) => Object.freeze({...node, index,
		altitudeMeters: 60000 * (index / (base.count - 1)) ** 2,
		role: index === 0 ? 'minimum-in-atmosphere-altitude' : 'quadratic-near-ground-node'})));
	return Object.freeze({...base, id: 'quadratic-near-ground-position-48-v1',
		generatorRevision: 'p8-qualified-quadratic-near-ground-48-v1', nodes});
}

export default createQuadratic48PositionDomain;

