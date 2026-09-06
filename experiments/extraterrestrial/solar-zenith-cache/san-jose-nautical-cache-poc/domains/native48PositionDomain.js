const BOTTOM_RADIUS_METERS = 6360000;
const TOP_RADIUS_METERS = 6420000;
const POSITION_COUNT = 48;

/** Create the lane-local executable Native48 altitude domain. */
export function createNative48PositionDomain() {
	const atmosphereHeightMeters =
		TOP_RADIUS_METERS - BOTTOM_RADIUS_METERS;
	const nodes = Object.freeze(Array.from(
		{length: POSITION_COUNT},
		(_unused, index) => Object.freeze({
			index,
			altitudeMeters: index === 0
				? 0
				: ((index + 0.5) / POSITION_COUNT)
					* atmosphereHeightMeters,
			role: index === 0
				? 'minimum-in-atmosphere-altitude'
				: 'uniform-altitude-bin-center',
		}),
	));

	return Object.freeze({
		id: 'algorithm32-native-48-position-v2',
		kind: 'spherical-altitude-domain',
		generatorRevision: 'native-48-boundary-zero-altitude-nodes-v2',
		count: POSITION_COUNT,
		bottomRadiusMeters: BOTTOM_RADIUS_METERS,
		topRadiusMeters: TOP_RADIUS_METERS,
		atmosphereHeightMeters,
		nodes,
		provenance: Object.freeze({
			comparisonPath:
				'src/algorithm32/sampling-domains/position/spherical-native/SphericalNativePositionDomain.js',
			operation:
				'altitude[0] = 0; altitude[i] = ((i + 0.5) / 48) * 60000',
		}),
	});
}

export default createNative48PositionDomain;
