/** Identify the selected Algorithm32-star later-order scattering promotion. */
export const ALGORITHM32_STAR_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY =
	'algorithm32-star-selected-lkm1-to-jk-scatter-98aa61f7-v1';

/** Identify fields constructed by the selected Algorithm32-star transport port. */
export const ALGORITHM32_STAR_TRANSPORT_PROVENANCE_IDENTITY =
	'algorithm32-star-selected-jk-to-lk-transport-98aa61f7-v1';

/** Name the complete final-view Algorithm32 shader main dependency set. */
export const ALGORITHM32_TRANSPORT_MAIN_SYMBOLS = [
	'runtime.initialState',
	'geometry.reconstructViewRay',
	'geometry.resolveAtmospherePath',
	'atmosphere.sampleMedium',
	'cache.sampleCumulativeScatteringDensity',
	'transport.evaluatePathRadiance',
	'color.composeSceneColor',
	'color.encodeOutput',
];

/** Name the runtime path-interval uniform and its owner-facing value key. */
export const TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME =
	'uTransportPathIntervalCount';
export const TRANSPORT_PATH_INTERVAL_COUNT_VALUE_KEY =
	'transport.pathIntervalCount';
