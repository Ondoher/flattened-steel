export const STELLAR_SCREEN_PROJECTION_SCHEMA_ID =
	'stellar-screen-projection-contract-v1';
export const STELLAR_SCREEN_PALETTE_SCHEMA_ID =
	'stellar-screen-palette-cache-v1';

export const STELLAR_CATALOG_FRAME_ID = 'eq-fk5-j2000-mean';
export const STELLAR_LOCAL_FRAME_ID = 'local-enu-rh-v1';
export const STELLAR_CAMERA_FRAME_ID = 'camera-forward-right-up-v1';
export const STELLAR_VIEWPORT_CONVENTION_ID =
	'top-left-row-major-half-open-v1';
export const STELLAR_TIME_MODEL_ID =
	'usno-circular-179-iau2000-mean-utc-as-ut1-v1';

export const STELLAR_PROJECTION_CLASSIFICATIONS = Object.freeze({
	OCCUPIED_PIXEL: 'occupied-pixel',
	OFF_FRAME: 'off-frame',
	BELOW_HORIZON: 'below-horizon',
	UNSUPPORTED: 'unsupported',
	INVALID: 'invalid-input',
});

export const STELLAR_SCREEN_PROJECTION_CONTRACT = Object.freeze({
	schemaId: STELLAR_SCREEN_PROJECTION_SCHEMA_ID,
	catalogFrameId: STELLAR_CATALOG_FRAME_ID,
	catalogEpoch: Object.freeze({
		julianDateTt: 2451545.0,
		label: 'J2000.0',
		timeScale: 'TT',
	}),
	localFrameId: STELLAR_LOCAL_FRAME_ID,
	cameraFrameId: STELLAR_CAMERA_FRAME_ID,
	viewportConventionId: STELLAR_VIEWPORT_CONVENTION_ID,
	timeModelId: STELLAR_TIME_MODEL_ID,
	pointSemantics: 'one-unresolved-member-to-one-pixel',
	pixelOrigin: 'top-left',
	pixelOrder: 'row-major',
	clipInterval: Object.freeze({minimum: 'inclusive', maximum: 'exclusive'}),
	horizonPolicy: 'local-up-component-must-be-positive',
	invalidMemberPolicy: 'classify-never-drop',
	initialIndexStorage: Object.freeze({
		arrayType: 'Uint16Array',
		gpuFormat: 'R16UI',
		reservedZeroIndex: 0,
		maximumPaletteEntriesIncludingZero: 65536,
	}),
	stellarSpectrum: Object.freeze({
		channelCount: 15,
		collisionOperation: 'channel-wise-addition',
	}),
	excludedFirstProfileEffects: Object.freeze([
		'catalog proper motion',
		'nutation and equation of the equinoxes',
		'annual and diurnal aberration',
		'gravitational light deflection',
		'topocentric parallax for finite-distance objects',
		'atmospheric refraction',
		'polar motion',
		'measured UT1 minus UTC',
	]),
});

export const STELLAR_SCREEN_PALETTE_CONTRACT = Object.freeze({
	schemaId: STELLAR_SCREEN_PALETTE_SCHEMA_ID,
	projectionSchemaId: STELLAR_SCREEN_PROJECTION_SCHEMA_ID,
	spectralBasisId: 'algorithm32-native-15-spectral-basis-v1',
	spectralQuantity: 'top-of-atmosphere spectral radiance density',
	spectralUnits: 'W m^-2 sr^-1 nm^-1',
	pointResponse: 'unit-weight single-pixel response',
	pointConversion: 'spectral irradiance density divided by exact pixel solid angle',
	workingPrecision: 'binary64',
	packedPalettePrecision: 'binary32',
	indexStorage: STELLAR_SCREEN_PROJECTION_CONTRACT.initialIndexStorage,
	paletteLayout: 'entry-major-contiguous-native-15',
	publication: 'complete-matrix-and-palette-atomic-generation',
});

export function requireFiniteNumber(value, label) {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new TypeError(`${label} must be a finite number.`);
	}
	return value;
}

export function requireUnitDirection(value, label = 'direction') {
	if (!Array.isArray(value) || value.length !== 3) {
		throw new TypeError(`${label} must contain exactly three coordinates.`);
	}
	const direction = value.map((coordinate, index) =>
		requireFiniteNumber(coordinate, `${label}[${index}]`));
	const length = Math.hypot(...direction);
	if (!(length > 0) || Math.abs(length - 1) > 1e-12) {
		throw new RangeError(`${label} must be unit length.`);
	}
	return Object.freeze(direction);
}

export function requireViewportSize(value) {
	if (
		value === null
		|| typeof value !== 'object'
		|| !Number.isSafeInteger(value.width)
		|| !Number.isSafeInteger(value.height)
		|| value.width < 1
		|| value.height < 1
	) {
		throw new RangeError('Viewport width and height must be positive safe integers.');
	}
	return Object.freeze({width: value.width, height: value.height});
}
