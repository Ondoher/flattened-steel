import {createNative48PositionDomain} from './native48PositionDomain.js';

const INSERTED_ALTITUDES_METERS = Object.freeze([
	1.7,
	10,
	50,
	100,
	250,
	500,
	1000,
]);

/**
 * Extend only the durable scene-page altitude address space. The universal
 * solver remains Native48; projected higher orders still interpolate that
 * field at each exact new actual point.
 */
export function createNearGroundExtended55PositionDomain() {
	const native = createNative48PositionDomain();
	const altitudes = [
		native.nodes[0].altitudeMeters,
		...INSERTED_ALTITUDES_METERS,
		...native.nodes.slice(1).map((node) => node.altitudeMeters),
	];
	const nodes = Object.freeze(altitudes.map((altitudeMeters, index) =>
		Object.freeze({
			index,
			altitudeMeters,
			role: INSERTED_ALTITUDES_METERS.includes(altitudeMeters)
				? altitudeMeters === 1.7
					? 'observer-height-forward-origin'
					: 'near-ground-scene-page-extension'
				: altitudeMeters === 0
					? 'minimum-in-atmosphere-altitude'
					: 'retained-native48-altitude',
		}),
	));
	return Object.freeze({
		id: 'san-jose-scene-page-native48-plus-near-ground-55-v1',
		kind: 'spherical-altitude-domain',
		generatorRevision: 'native48-plus-observer-and-six-near-ground-nodes-v1',
		count: nodes.length,
		bottomRadiusMeters: native.bottomRadiusMeters,
		topRadiusMeters: native.topRadiusMeters,
		atmosphereHeightMeters: native.atmosphereHeightMeters,
		nodes,
		insertedAltitudesMeters: INSERTED_ALTITUDES_METERS,
		parentDomainId: native.id,
		semantics: 'scene-page projection and runtime lookup only; solver remains Native48',
	});
}

export default createNearGroundExtended55PositionDomain;
