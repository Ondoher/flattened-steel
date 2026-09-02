/** Value that identifies the selected production later-order scattering implementation. */
export const ALGORITHM32_PRODUCTION_LATER_ORDER_SCATTERING_PROVENANCE_IDENTITY =
	'algorithm32-production-selected-lkm1-to-jk-scatter-v1';

/** Value that identifies fields constructed by the selected production transport implementation. */
export const ALGORITHM32_PRODUCTION_TRANSPORT_PROVENANCE_IDENTITY =
	'algorithm32-production-selected-jk-to-lk-transport-v1';

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
export const TRANSPORT_PATH_INTERVAL_COUNT_UNIFORM_NAME = 'uTransportPathIntervalCount';
/** Transport path interval count value key constant. */
export const TRANSPORT_PATH_INTERVAL_COUNT_VALUE_KEY = 'transport.pathIntervalCount';
