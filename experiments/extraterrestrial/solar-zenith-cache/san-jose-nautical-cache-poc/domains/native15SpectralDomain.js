const CHANNEL_DEFINITIONS = [
	['lambda-376', 375.6666666666667, 1.0688666666666664],
	['lambda-407', 407, 1.729673],
	['lambda-438', 438.3333333333333, 1.8620716666666661],
	['lambda-470', 469.66666666666663, 2.0220633333333335],
	['lambda-501', 501, 1.9081540000000001],
	['lambda-532', 532.3333333333333, 1.8833910000000003],
	['lambda-564', 563.6666666666666, 1.8342466666666666],
	['lambda-595', 595, 1.7674400000000001],
	['lambda-626', 626.3333333333333, 1.65952],
	['lambda-658', 657.6666666666666, 1.548102333333333],
	['lambda-689', 689, 1.45078],
	['lambda-720', 720.3333333333333, 1.3409603333333335],
	['lambda-752', 751.6666666666666, 1.2624333333333335],
	['lambda-783', 783, 1.175208],
	['lambda-814', 814.3333333333333, 1.090824],
];

/** Create the exact Native15 bin-average basis and source packet. */
export function createNative15SpectralDomain() {
	const binWidthNanometers = 31.333333333333332;
	const channels = Object.freeze(CHANNEL_DEFINITIONS.map(
		([id, centerNanometers, sourceIrradianceDensity]) => Object.freeze({
			id,
			centerNanometers,
			binWidthNanometers,
			sourceIrradianceDensityWattsPerSquareMeterPerNanometer:
				sourceIrradianceDensity,
		}),
	));

	return Object.freeze({
		id: 'algorithm32-native-15-spectral-basis-v1',
		kind: 'spectral-basis',
		semantics: 'bin-average',
		channelCount: channels.length,
		channelUnits: 'nanometers',
		sourceQuantity: 'spectral irradiance density',
		sourceUnits: 'W m^-2 nm^-1',
		storage: 'R32F scalar wavelength layers',
		channels,
		provenance: Object.freeze({
			comparisonPath: 'src/algorithm32/profiles/native-15/consts.js',
			sourceIdentity:
				'algorithm32-canonical-data-native-15-source-v1',
		}),
	});
}

export default createNative15SpectralDomain;
