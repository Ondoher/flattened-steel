/**
 * Flat32-equivalent vertical framing presets; labels are resolved by feature presentation.
 */
export const FIELD_OF_VIEW_PRESETS = [
	{value: 120, label: 'spherical-earth.camera.fov.ultra'},
	{value: 90, label: 'spherical-earth.camera.fov.wide'},
	{value: 50, label: 'spherical-earth.camera.fov.default'},
	{value: 35, label: 'spherical-earth.camera.fov.natural'},
	{value: 20, label: 'spherical-earth.camera.fov.close'},
	{value: 5, label: 'spherical-earth.camera.fov.sunset'},
	{value: 2, label: 'spherical-earth.camera.fov.sun'},
];

/**
 * Flat32-equivalent elevation choices in meters; these UI choices are not a physical admissibility allow-list.
 */
export const ELEVATION_PRESETS = [
	{value: 5, label: 'spherical-earth.camera.height.current'},
	{value: 100, label: 'spherical-earth.camera.height.100'},
	{value: 500, label: 'spherical-earth.camera.height.500'},
	{value: 2000, label: 'spherical-earth.camera.height.2000'},
	{value: 10000, label: 'spherical-earth.camera.height.10000'},
	{value: 40000, label: 'spherical-earth.camera.height.40000'},
];
