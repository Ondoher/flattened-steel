/** Logical field identifier for distant-Sun celestial transport. */
export const DISTANT_SUN_CELESTIAL_FIELD_ID = 'distant-sun-celestial-transport';

/** GPU pass identifier for distant-Sun celestial transport. */
export const DISTANT_SUN_CELESTIAL_PASS_ID = 'distant-sun-celestial-direct-transport';

/** Exact scalar storage selected for distant-Sun celestial transport. */
export const DISTANT_SUN_CELESTIAL_STORAGE = /** @type {const} */ ({
	format: 'R32F',
	width: 11,
	height: 13,
	layers: 15,
});

/** Runtime sampler name for the distant-Sun celestial transport field. */
export const DISTANT_SUN_CELESTIAL_SAMPLER_NAME = 'uDistantSunCelestialTransportCache';
