import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
	CANONICAL_SPECTRAL_CHANNELS,
	FIGURE1_DISPLAY_CONSTANTS,
	RUNTIME_NUMERICAL_CONTROLS,
} from '../Algorithm32CanonicalData.js';

describe('Algorithm32 canonical data', () => {
	it('promotes the accepted canonical atmosphere constants', () => {
		expect(CANONICAL_ATMOSPHERE_CONSTANTS).toEqual(jasmine.objectContaining({
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
		}));
	});

	it('promotes the accepted canonical spectral channels', () => {
		expect(CANONICAL_SPECTRAL_CHANNELS.length).toBe(15);
		expect(CANONICAL_SPECTRAL_CHANNELS[0]).toEqual({
			name: 'lambda-376',
			wavelength: {
				value: 375.6666666666667,
				units: 'nanometers',
			},
			sourceIrradiance: {
				value: 1.0688666666666664,
				units: 'W m^-2 nm^-1',
			},
			wavelengthBinWidth: {
				value: 31.333333333333332,
				units: 'nanometers',
			},
		});
		expect(CANONICAL_SPECTRAL_CHANNELS[14]).toEqual({
			name: 'lambda-814',
			wavelength: {
				value: 814.3333333333333,
				units: 'nanometers',
			},
			sourceIrradiance: {
				value: 1.090824,
				units: 'W m^-2 nm^-1',
			},
			wavelengthBinWidth: {
				value: 31.333333333333332,
				units: 'nanometers',
			},
		});
	});

	it('promotes the accepted Figure 1 display constants', () => {
		expect(FIGURE1_DISPLAY_CONSTANTS).toEqual(jasmine.objectContaining({
			conversionKind: 'cie-xyz-to-linear-srgb-paper-figure1-tone-map',
			outputColorSpace: 'linear-srgb',
			maxLuminousEfficacy: { value: 683, units: 'lumens-per-watt' },
			brunetonComparisonToneMapExposureScale: 5,
			paperFigure1ToneMapK: 1 / (5 * 683),
			demoGammaPowerOmitted: true,
			demoWhitePointOmitted: true,
		}));
		expect(FIGURE1_DISPLAY_CONSTANTS.xyzToLinearSrgbMatrix[0])
			.toEqual([3.2406, -1.5372, -0.4986]);
	});

	it('promotes the accepted runtime numerical controls', () => {
		expect(RUNTIME_NUMERICAL_CONTROLS).toEqual({
			pathIntervalCount: 15,
			sourceTransmittanceIntervalCount: 20,
		});
	});
});
