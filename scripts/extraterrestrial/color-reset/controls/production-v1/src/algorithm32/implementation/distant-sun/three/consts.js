/** Default ambient intensity range for distant-Sun endpoint lighting. */
export const DEFAULT_DISTANT_SUN_SCENE_AMBIENT_INTENSITY_RANGE = {
	min: 0.06,
	max: 0.5,
};

/** Supported properties of a distant-Sun shadow request. */
export const DISTANT_SUN_SHADOW_REQUEST_PROPERTIES = ['enabled', 'objects'];

/** Supported properties of one distant-Sun shadow-object request. */
export const DISTANT_SUN_SHADOW_OBJECT_REQUEST_PROPERTIES = [
	'objectKey',
	'layerIndex',
	'focus',
	'extent',
	'cameraLeft',
	'cameraRight',
	'cameraTop',
	'cameraBottom',
	'lightDistance',
	'cameraNear',
	'cameraFar',
	'mapSize',
	'bias',
	'normalBias',
	'radius',
	'shadowIntensity',
];
