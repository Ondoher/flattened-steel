/** Value that selects the default endpoint ambient-light intensity range. */
export const LOCAL_SUN_DEFAULT_SCENE_AMBIENT_INTENSITY_RANGE = {
	min: 0.06,
	max: 0.5,
};

/** Value that selects the production local-cache transport interval count. */
export const LOCAL_SUN_TRANSPORT_INTERVAL_COUNT = 15;

/** Value that selects production local-source optical-depth integration intervals. */
export const LOCAL_SUN_SOURCE_TRANSMITTANCE_INTERVAL_COUNT = 15;

/** Value that identifies the local point Sun at the shared final-view assembly boundary. */
export const LOCAL_SUN_RUNTIME_SHADER_CONTRIBUTION_ID = 'light-source-local-sun-runtime-identity';
