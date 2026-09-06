/** Accepted canonical Native-15 spectral channels. @type {readonly SpectralChannelConstant[]} */
export const CANONICAL_SPECTRAL_CHANNELS = [
	{
		name: 'lambda-376',
		wavelength: {value: 375.6666666666667, units: 'nanometers'},
		sourceIrradiance: {value: 1.0688666666666664, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
	{
		name: 'lambda-407',
		wavelength: {value: 407, units: 'nanometers'},
		sourceIrradiance: {value: 1.729673, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
	{
		name: 'lambda-438',
		wavelength: {value: 438.3333333333333, units: 'nanometers'},
		sourceIrradiance: {value: 1.8620716666666661, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
	{
		name: 'lambda-470',
		wavelength: {value: 469.66666666666663, units: 'nanometers'},
		sourceIrradiance: {value: 2.0220633333333335, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
	{
		name: 'lambda-501',
		wavelength: {value: 501, units: 'nanometers'},
		sourceIrradiance: {value: 1.9081540000000001, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
	{
		name: 'lambda-532',
		wavelength: {value: 532.3333333333333, units: 'nanometers'},
		sourceIrradiance: {value: 1.8833910000000003, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
	{
		name: 'lambda-564',
		wavelength: {value: 563.6666666666666, units: 'nanometers'},
		sourceIrradiance: {value: 1.8342466666666666, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
	{
		name: 'lambda-595',
		wavelength: {value: 595, units: 'nanometers'},
		sourceIrradiance: {value: 1.7674400000000001, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
	{
		name: 'lambda-626',
		wavelength: {value: 626.3333333333333, units: 'nanometers'},
		sourceIrradiance: {value: 1.65952, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
	{
		name: 'lambda-658',
		wavelength: {value: 657.6666666666666, units: 'nanometers'},
		sourceIrradiance: {value: 1.548102333333333, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
	{
		name: 'lambda-689',
		wavelength: {value: 689, units: 'nanometers'},
		sourceIrradiance: {value: 1.45078, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
	{
		name: 'lambda-720',
		wavelength: {value: 720.3333333333333, units: 'nanometers'},
		sourceIrradiance: {value: 1.3409603333333335, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
	{
		name: 'lambda-752',
		wavelength: {value: 751.6666666666666, units: 'nanometers'},
		sourceIrradiance: {value: 1.2624333333333335, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
	{
		name: 'lambda-783',
		wavelength: {value: 783, units: 'nanometers'},
		sourceIrradiance: {value: 1.175208, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
	{
		name: 'lambda-814',
		wavelength: {value: 814.3333333333333, units: 'nanometers'},
		sourceIrradiance: {value: 1.090824, units: 'W m^-2 nm^-1'},
		wavelengthBinWidth: {value: 31.333333333333332, units: 'nanometers'},
	},
];

/** Native production-profile schema revision. */
export const PROFILE_SCHEMA_REVISION = 'algorithm32-native-production-profile-v1';

/** Native physical-profile schema revision. */
export const PHYSICAL_PROFILE_SCHEMA_REVISION = 'algorithm32-native-physical-profile-v1';

/** Native numerical-profile schema revision. */
export const NUMERICAL_PROFILE_SCHEMA_REVISION = 'algorithm32-native-numerical-profile-v1';

/** Default native production-profile identifier. */
export const DEFAULT_PROFILE_ID = 'algorithm32-native-production-default-v1';

/** Default native production-profile revision. */
export const DEFAULT_PROFILE_REVISION = 1;

/** Native production-profile role. */
export const DEFAULT_PROFILE_ROLE = 'native-production-default';

/** Canonical Native-15 source-packet provenance identity. */
export const SOURCE_PROVENANCE_IDENTITY = 'algorithm32-canonical-data-native-15-source-v1';

/** Executable Native-15 spectral layer count. */
export const NATIVE_15_SPECTRAL_CHANNEL_COUNT = CANONICAL_SPECTRAL_CHANNELS.length;
