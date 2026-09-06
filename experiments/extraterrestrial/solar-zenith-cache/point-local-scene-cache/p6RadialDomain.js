const POSITION_COUNT = 48;
const ATMOSPHERE_HEIGHT_METERS = 60000;

/** Fixed-count quadratic altitude redistribution used only by the P6 diagnostic. */
export function createP6NearGround48PositionDomain() {
	const nodes = Object.freeze(Array.from({length: POSITION_COUNT}, (_unused, index) => {
		const coordinate = index / (POSITION_COUNT - 1);
		return Object.freeze({
			index,
			altitudeMeters: ATMOSPHERE_HEIGHT_METERS * coordinate * coordinate,
			role: index === 0 ? 'minimum-in-atmosphere-altitude'
				: index === POSITION_COUNT - 1 ? 'exact-top-atmosphere-altitude'
					: 'quadratic-near-ground-weighted-altitude',
		});
	}));
	return Object.freeze({
		id: 'p6-quadratic-near-ground-48-position-v1',
		kind: 'spherical-altitude-domain',
		generatorRevision: 'fixed-count-quadratic-near-ground-48-v1',
		count: POSITION_COUNT,
		bottomRadiusMeters: 6360000,
		topRadiusMeters: 6420000,
		atmosphereHeightMeters: ATMOSPHERE_HEIGHT_METERS,
		nodes,
		provenance: Object.freeze({
			operation: 'altitude[i] = 60000 * (i / 47)^2',
			isolatedVariable: 'radial construction and reconstruction nodes',
		}),
	});
}

