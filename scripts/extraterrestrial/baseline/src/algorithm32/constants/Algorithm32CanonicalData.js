/**
 * Source: reconciliation POC canonical constants (script a32-poc-color-032).
 */

/**
 * Create one immutable canonical spectral channel.
 *
 * @param {string} name - Supplies the accepted channel name.
 * @param {number} wavelengthValue - Supplies the channel center wavelength.
 * @param {number} sourceIrradianceWattsPerSquareMeterPerNanometer - Supplies
 * the channel irradiance normalized for this local constant constructor.
 * @returns {SpectralChannelConstant} Return the channel constant.
 */
function createSpectralChannel(
	name,
	wavelengthValue,
	sourceIrradianceWattsPerSquareMeterPerNanometer,
) {
	return {
		name,
		wavelength: {
			value: wavelengthValue,
			units: 'nanometers',
		},
		sourceIrradiance: {
			value: sourceIrradianceWattsPerSquareMeterPerNanometer,
			units: 'W m^-2 nm^-1',
		},
		wavelengthBinWidth: {
			value: 31.333333333333332,
			units: 'nanometers',
		},
	};
}

/**
 * Store the accepted canonical atmosphere constants.
 *
 * @type {CanonicalAtmosphereConstants}
 */
export const CANONICAL_ATMOSPHERE_CONSTANTS = {
	bottomRadius: { value: 6360000, units: 'meters' },
	topRadius: { value: 6420000, units: 'meters' },
	rayleighScaleHeight: { value: 8000, units: 'meters' },
	mieScaleHeight: { value: 1200, units: 'meters' },
	rayleighCoefficientScale: 0.00000124062,
	mieAngstromAlpha: 0.8,
	mieAngstromBeta: 0.04,
	mieSingleScatteringAlbedo: 0.8,
	miePhaseFunctionG: 0.7,
	ozoneAbsorptionEnabled: false,
};

/**
 * Store the accepted canonical spectral channels.
 *
 * @type {readonly SpectralChannelConstant[]}
 */
export const CANONICAL_SPECTRAL_CHANNELS = [
	createSpectralChannel('lambda-376', 375.6666666666667, 1.0688666666666664),
	createSpectralChannel('lambda-407', 407, 1.729673),
	createSpectralChannel('lambda-438', 438.3333333333333, 1.8620716666666661),
	createSpectralChannel('lambda-470', 469.66666666666663, 2.0220633333333335),
	createSpectralChannel('lambda-501', 501, 1.9081540000000001),
	createSpectralChannel('lambda-532', 532.3333333333333, 1.8833910000000003),
	createSpectralChannel('lambda-564', 563.6666666666666, 1.8342466666666666),
	createSpectralChannel('lambda-595', 595, 1.7674400000000001),
	createSpectralChannel('lambda-626', 626.3333333333333, 1.65952),
	createSpectralChannel('lambda-658', 657.6666666666666, 1.548102333333333),
	createSpectralChannel('lambda-689', 689, 1.45078),
	createSpectralChannel('lambda-720', 720.3333333333333, 1.3409603333333335),
	createSpectralChannel('lambda-752', 751.6666666666666, 1.2624333333333335),
	createSpectralChannel('lambda-783', 783, 1.175208),
	createSpectralChannel('lambda-814', 814.3333333333333, 1.090824),
];

/**
 * Store the accepted display-conversion constants for the Figure 1 adapter.
 *
 * @type {Figure1DisplayConstants}
 */
export const FIGURE1_DISPLAY_CONSTANTS = {
	conversionKind: 'cie-xyz-to-linear-srgb-paper-figure1-tone-map',
	outputColorSpace: 'linear-srgb',
	maxLuminousEfficacy: { value: 683, units: 'lumens-per-watt' },
	brunetonComparisonToneMapExposureScale: 5,
	paperFigure1ToneMapK: 1 / (5 * 683),
	xyzToLinearSrgbMatrix: [
		[3.2406, -1.5372, -0.4986],
		[-0.9689, 1.8758, 0.0415],
		[0.0557, -0.204, 1.057],
	],
	demoGammaPowerOmitted: true,
	demoWhitePointOmitted: true,
};

/**
 * Store the accepted runtime numerical controls.
 *
 * @type {Algorithm32NumericalControls}
 */
export const RUNTIME_NUMERICAL_CONTROLS = {
	pathIntervalCount: 15,
	sourceTransmittanceIntervalCount: 20,
};
