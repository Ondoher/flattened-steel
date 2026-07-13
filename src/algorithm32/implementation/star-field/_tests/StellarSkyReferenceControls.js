/**
 * Frozen read-only controls copied from immutable run 000435 for production
 * Step 7A/B comparison. These are test expectations, never runtime branches.
 */
export const STELLAR_SKY_REFERENCE_CONTROLS = /** @type {const} */ ({
	sourceRun: {
		id: '000435-sun-layer-screen-palette-three-scenes',
		artifactSetSha256: '15a983c091886402d6a5a3cd0110f9c02b6682697513ec90c267ac59d6c026b0',
		capture: 'captures/san-jose-sunset-facing-sunset-plus-three-hours.png',
	},
	view: {widthPixels: 640, heightPixels: 400, verticalFieldOfViewDegrees: 78},
	ferwerdaWorldAdaptationLuminanceCdPerSquareMeter: {
		solarNoon: 5070.201700912994,
		sunset: 3632.4668027619023,
		sunsetPlusThreeHours: 0.001,
	},
	nightCapture: {
		nonBlackPixelCount: 32,
		minimumNonBlackByte: 43,
		maximumByte: 235,
		exactWhitePixelCount: 0,
	},
});

