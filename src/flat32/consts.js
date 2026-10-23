/** @type {UnitVector3} */
export const ATMOSPHERE_DIRECTION_TO_SOURCE = [0, 1, 0];
/** @type {Distance} */
export const ATMOSPHERE_OBSERVER_HEIGHT = {
	value: 5,
	units: 'meters',
};
/** @type {UnitVector3} */
export const ATMOSPHERE_OBSERVER_UP_DIRECTION = [0, 0, 1];
export const ATMOSPHERE_SCENE_COLOR_TARGET_NAME = 'Flat32.algorithm32.sceneColor';
/** Versioned HTTP and in-process distant-Sun cache-resolution response identity. */
export const FLAT32_DISTANT_SUN_CACHE_RESOLUTION_SCHEMA_ID = 'flat32-distant-sun-cache-resolution-v2';
/** Rollout discriminator for the currently selected complete dense-scene package format. */
export const FLAT32_DISTANT_SUN_DENSE_CACHE_FORMAT_ID = 'algorithm32-distant-sun-dense-scene-v1';
/** Rollout discriminator reserved for the production shared-block package format. */
export const FLAT32_DISTANT_SUN_SHARED_CACHE_FORMAT_ID = 'algorithm32-distant-sun-shared-block-v1';
/** @type {SceneScale} */
export const ATMOSPHERE_SCENE_SCALE = {
	value: 1000,
	units: 'meters-per-scene-unit',
};
/** @type {Angle} */
export const ATMOSPHERE_SOURCE_ANGULAR_RADIUS = {
	value: 0.004675,
	units: 'radians',
};
export const FLAT32_LOCATION_PRESETS = [
	{label: 'San Jose', latitude: 37.3382, longitude: -121.8863, dateBasis: '2024-06-20T12:00:00.000Z'},
	{label: 'Union Glacier', latitude: -79.768036, longitude: -83.261666, dateBasis: '2024-12-14T12:00:00.000Z'},
	{label: '85°S, 0°', latitude: -85, longitude: 0, dateBasis: '2024-12-14T12:00:00.000Z'},
];
export const FLAT32_TIME_PRESETS = [
	{label: 'Flat 0', offsetDegrees: 0},
	{label: 'Flat 45', offsetDegrees: 45},
	{label: 'Flat 90', offsetDegrees: 90},
	{label: 'Flat 135', offsetDegrees: 135},
	{label: 'Flat 180', offsetDegrees: 180},
];
export const FLAT32_GLOBE_TIME_PRESETS = [
	{label: 'Sunrise', kind: 'sunrise'},
	{label: 'Solar noon', kind: 'solar-noon-offset', offsetHours: 0},
	{label: 'Sunset', kind: 'sunset'},
];
export const FLAT32_DELAYED_SCENE_REFRESH_MILLISECONDS = 450;
/** @type {Distance} */
export const FLAT_ATMOSPHERE_TOP_ALTITUDE = {
	value: 100000,
	units: 'meters',
};
/** @type {Distance} */
export const FLAT_OBSERVER_DOME_MAX_VIEW_RAY_EXTENT = {
	value: 1926774,
	units: 'meters',
};
export const CAMERA_FAR_SCENE_UNITS = 1200;
/** Ordinary globe final-view integration; cache construction and physical optics are independent. */
export const DISTANT_SUN_VIEW_INTERVAL_COUNT = 30;
/** Final-view integration for the 40 km globe preset, qualified by the high-altitude horizon checks. */
export const DISTANT_SUN_HIGH_ALTITUDE_VIEW_INTERVAL_COUNT = 120;
export const CAMERA_FIELD_OF_VIEW_DEGREES = 50;
/** Vertical perspective framing presets; Natural approximates central-view framing, not total human vision. */
export const FLAT32_FIELD_OF_VIEW_PRESETS = [
	{degrees: 120, label: 'Ultra-wide (120°)'},
	{degrees: 90, label: 'Wide (90°)'},
	{degrees: 50, label: 'Default (50°)'},
	{degrees: 35, label: 'Natural (35°)'},
	{degrees: 20, label: 'Close (20°)'},
	{degrees: 5, label: 'Sunset zoom (5°)'},
	{degrees: 2, label: 'Sun close-up (2°)'},
];
/** @type {[number, number, number]} */
export const CAMERA_LOOK_AT_SCENE = [0, 0, -1];
export const CAMERA_NEAR_SCENE_UNITS = 0.002;
/** @type {[number, number, number]} */
export const CAMERA_POSITION_SCENE = [0, 0.005, 0];
export const GROUND_COLOR = 0x4fa33d;
export const GROUND_SIZE_SCENE_UNITS = 1800;
export const LOCAL_SUN_AMBIENT_LIGHT_INTENSITY = 0.37943331351924703;
/** Canonical distant-source brightness that maps source-owned scene lighting to unit scale. */
export const DISTANT_SUN_SCENE_LIGHT_REFERENCE_BRIGHTNESS = {
	value: 42259.92746573373,
	units: 'cd m^-2',
};
export const LOCAL_SUN_DIRECTIONAL_LIGHT_TOTAL_INTENSITY = 1.4677190896762844;
export const LOCAL_SUN_LIGHT_COLOR = 0xffffff;
export const LOCAL_SUN_SHADOW_BIAS = 0;
// One isolated directional shadow map serves each of the six review objects.
// Match the production distant-Sun owner's per-object default so that a caster
// can fully occlude its allocated direct-light contribution.
export const LOCAL_SUN_SHADOW_INTENSITY = 6;
export const LOCAL_SUN_SHADOW_MAP_SIZE = 4096;
export const LOCAL_SUN_SHADOW_NORMAL_BIAS = 0;
export const LOCAL_SUN_SHADOW_RADIUS = 12;
export const LOCAL_SUN_SHADOW_UPDATE_POLICY = 'static-once';
export const LOCAL_SUN_SOURCE_KEY = 'flat32-local-sun';
/**
 * Source application's frozen Union Glacier / Flat 0 source, rigidly recast
 * into this checkpoint's camera-relative review-object frame.
 *
 * @type {[number, number, number]}
 */
export const LOCAL_SUN_SOURCE_POSITION_SCENE = [0, 4828.032, -6283.427593407407];
export const SCENE_BACKGROUND_COLOR = 0x000000;
/**
 * @type {{
 *   color: number,
 *   name: string,
 *   position: [number, number, number],
 *   rotationY: number,
 *   shadowCamera: {
 *     bottom: number,
 *     far: number,
 *     left: number,
 *     near: number,
 *     right: number,
 *     top: number
 *   },
 *   shadowFocus: [number, number, number],
 *   sourceLightDistance: number,
 *   size: [number, number, number]
 * }[]}
 */
export const SCENE_OBJECTS = [
	{
		color: 0xe2b222,
		name: 'union-review-near-yellow-box',
		position: [-0.26, 0.11, -1.6],
		rotationY: 0,
		shadowCamera: {
			bottom: -0.28428244738738445,
			far: 0.875445065909202,
			left: -0.14500982048386385,
			near: 0.001,
			right: 0.14500583229327568,
			top: 0.10984605306096004,
		},
		shadowFocus: [-0.26000791816315705, 0.11, -1.456868237110044],
		sourceLightDistance: 0.5685648947747689,
		size: [0.18, 0.22, 0.18],
	},
	{
		color: 0x1c69b9,
		name: 'union-review-close-single-story-building-box',
		position: [-0.012, 0.003, -0.03],
		rotationY: 0,
		shadowCamera: {
			bottom: -0.01780414392589462,
			far: 0.12777712448162337,
			left: -0.01700002247801593,
			near: 0.001,
			right: 0.01700001401835193,
			top: 0.013046439256608415,
		},
		shadowFocus: [-0.012000011686300813, 0.003, -0.026095668773479234],
		sourceLightDistance: 0.06888856304460282,
		size: [0.014, 0.006, 0.01],
	},
	{
		color: 0xdcd6be,
		name: 'union-review-mid-white-box',
		position: [0.62, 0.25, -3.6],
		rotationY: 0,
		shadowCamera: {
			bottom: -0.6494150342086517,
			far: 2.0005401011994963,
			left: -0.3350530616142473,
			near: 0.001,
			right: 0.33503190652075737,
			top: 0.2530052619950195,
		},
		shadowFocus: [0.6200215318281848, 0.25, -3.2747775812917213],
		sourceLightDistance: 1.2988300684173033,
		size: [0.42, 0.5, 0.42],
	},
	{
		color: 0xda5f1c,
		name: 'union-review-far-orange-box',
		position: [-1.3, 0.45, -8.2],
		rotationY: 0,
		shadowCamera: {
			bottom: -1.2128191608551868,
			far: 3.7454692197865795,
			left: -0.6752179234616938,
			near: 0.001,
			right: 0.6751363467520753,
			top: 0.49944750106224867,
		},
		shadowFocus: [-1.300161985243924, 0.45, -7.614952375554708],
		sourceLightDistance: 2.4256383217103736,
		size: [0.9, 0.9, 0.9],
	},
	{
		color: 0x2aaabc,
		name: 'union-review-distant-cyan-box',
		position: [18, 2.5, -60],
		rotationY: 0,
		shadowCamera: {
			bottom: -7.296278613056329,
			far: 22.552862036991275,
			left: -4.513301181063716,
			near: 0.001,
			right: 4.51026408972814,
			top: 3.343725334191893,
		},
		shadowFocus: [18.00781801008106, 2.5, -56.77219291680921],
		sourceLightDistance: 14.592557226112659,
		size: [6, 5, 6],
	},
	{
		color: 0xe05f20,
		name: 'union-review-denali-200km-orange-box',
		position: [100, 3.1, -250],
		rotationY: 0,
		shadowCamera: {
			bottom: -61.332745038925495,
			far: 192.03357966203902,
			left: -50.87447562246963,
			near: 0.001,
			right: 50.842009347394914,
			top: 56.485145846251456,
		},
		shadowFocus: [100.04866075084571, 3.1, -246.08516289083036],
		sourceLightDistance: 122.66549007785099,
		size: [50, 6.2, 100],
	},
];
