/** Maximum scalar count accepted by one Three cache probe request. */
export const MAXIMUM_THREE_CACHE_PROBE_SCALAR_COUNT = 4096;

/** Canonical multipliers for units accepted by the Three GPU boundary. */
export const THREE_CACHE_CANONICAL_UNIT_SCALE = /** @type {Readonly<Record<string, number>>} */ ({
	meters: 1,
	kilometers: 1000,
	'm^-1': 1,
	'km^-1': 0.001,
	'm^-1 micrometers^4': 1,
	nanometers: 1,
	micrometers: 1000,
	radians: 1,
	degrees: Math.PI / 180,
	steradians: 1,
	'sr^-1': 1,
	seconds: 1,
	'scene-units': 1,
	'meters-per-scene-unit': 1,
	1: 1,
	pixels: 1,
	bytes: 1,
	kibibytes: 1024,
	mebibytes: 1024 * 1024,
});

/** Fullscreen-triangle vertex shader shared by Three cache construction passes. */
export const THREE_CACHE_FULLSCREEN_VERTEX_SHADER = `
precision highp float;
in vec3 position;
void main() {
	gl_Position = vec4(position, 1.0);
}
`.trim();
