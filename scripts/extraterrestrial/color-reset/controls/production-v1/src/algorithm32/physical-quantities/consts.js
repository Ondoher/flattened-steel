import {UnitMath} from './UnitMath.js';

/** Unit families with explicit conversion support. */
export const UNIT_FAMILIES = {
	DISTANCE: UnitMath.family('meters', ['meters', 'kilometers']),
	INVERSE_DISTANCE: UnitMath.family('m^-1', ['m^-1', 'km^-1']),
	RAYLEIGH_COEFFICIENT_SCALE: UnitMath.family('m^-1 micrometers^4', ['m^-1 micrometers^4']),
	WAVELENGTH: UnitMath.family('nanometers', ['nanometers', 'micrometers']),
	ANGLE: UnitMath.family('radians', ['radians', 'degrees']),
	SOLID_ANGLE: UnitMath.family('steradians', ['steradians']),
	INVERSE_SOLID_ANGLE: UnitMath.family('sr^-1', ['sr^-1']),
	DURATION: UnitMath.family('seconds', ['seconds']),
	SCENE_DISTANCE: UnitMath.family('scene-units', ['scene-units']),
	SCENE_SCALE: UnitMath.family('meters-per-scene-unit', ['meters-per-scene-unit']),
	DIMENSIONLESS: UnitMath.family('1', ['1']),
	PIXEL: UnitMath.family('pixels', ['pixels']),
	STORAGE: UnitMath.family('bytes', ['bytes', 'kibibytes', 'mebibytes']),
};
