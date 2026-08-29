const OZONE_CROSS_SECTIONS_SQUARE_METERS = Object.freeze([
	1.18e-27, 2.182e-28, 2.818e-28, 6.636e-28,
	1.527e-27, 2.763e-27, 5.52e-27, 8.451e-27,
	1.582e-26, 2.316e-26, 3.669e-26, 4.924e-26,
	7.752e-26, 9.016e-26, 1.48e-25, 1.602e-25,
	2.139e-25, 2.755e-25, 3.091e-25, 3.5e-25,
	4.266e-25, 4.672e-25, 4.398e-25, 4.701e-25,
	5.019e-25, 4.305e-25, 3.74e-25, 3.215e-25,
	2.662e-25, 2.238e-25, 1.852e-25, 1.473e-25,
	1.209e-25, 9.423e-26, 7.455e-26, 6.566e-26,
	5.105e-26, 4.15e-26, 4.228e-26, 3.237e-26,
	2.451e-26, 2.801e-26, 2.534e-26, 1.624e-26,
	1.465e-26, 2.078e-26, 1.383e-26, 7.105e-27,
]);

/** Create the fixed physical and numerical transport specification. */
export function createPocTransportSpec({domains}) {
	if (domains === null || typeof domains !== 'object') {
		throw new TypeError('POC transport domains are required.');
	}
	return Object.freeze({
		id: 'san-jose-nautical-actual-point-n4-transport-v1',
		source: Object.freeze({
			id: 'algorithm32-native-distant-collimated-sun-v1',
			kind: 'distant-collimated-source',
			atmosphericAngularSupport: 'center ray',
			spectralIrradianceDensity: Object.freeze(
				domains.spectrum.channels.map((channel) =>
					channel.sourceIrradianceDensityWattsPerSquareMeterPerNanometer),
			),
			units: 'W m^-2 nm^-1',
		}),
		planet: Object.freeze({
			id: 'algorithm32-spherical-earth-6360-6420km-v1',
			bottomRadiusMeters: 6360000,
			topRadiusMeters: 6420000,
		}),
		atmosphere: Object.freeze({
			id: 'algorithm32-canonical-plus-bruneton-ozone-300du-v1',
			rayleighScaleHeightMeters: 8000,
			mieScaleHeightMeters: 1200,
			rayleighCoefficientScalePerMeter: 0.00000124062,
			mieAngstromAlpha: 0.8,
			mieAngstromBeta: 0.04,
			mieSingleScatteringAlbedo: 0.8,
			miePhaseFunctionG: 0.7,
			ozone: Object.freeze({
				id: 'bruneton-earth-demo-ozone-34f14e7-v1',
				absorptionEnabled: true,
				temperatureKelvin: 233,
				dobsonUnits: 300,
				dobsonUnitMoleculesPerSquareMeter: 2.687e20,
				densityIntegralMeters: 15000,
				profileAltitudesMeters: Object.freeze({
					bottom: 10000,
					peak: 25000,
					top: 40000,
				}),
				crossSectionTable: Object.freeze({
					minimumNanometers: 360,
					maximumNanometers: 830,
					spacingNanometers: 10,
					units: 'm^2',
					values: OZONE_CROSS_SECTIONS_SQUARE_METERS,
				}),
				provenance: Object.freeze({
					commit: '34f14e745cff948f4ca3157d1b62a445ffa7286f',
					sourcePath:
						'references/downloads/bruneton-precomputed-atmosphere-34f14e7/demo.cc',
					sourceSha256:
						'7e3659cdd8c23feca988b49801029e36e201ff0701e693fee2069b441ffa40d2',
				}),
			}),
		}),
		ground: Object.freeze({
			id: 'algorithm32-canonical-black-ground-boundary-v1',
			constructionParticipation: 'none',
		}),
		numerical: Object.freeze({
			viewPathIntervalCount: 15,
			sourcePathTransmittanceIntervalCount: 20,
			transportIntervalCount: 15,
			maximumScatteringOrder: 4,
			wavelengthScheduling: 'one Native15 channel at a time',
		}),
		recurrence: Object.freeze([
			'J1',
			'direct L1',
			'L1 -> J2',
			'J2 -> L2',
			'L2 -> J3',
			'J3 -> L3',
			'L3 -> J4',
			'C4 = J1 + J2 + J3 + J4',
		]),
		storedSemantic: Object.freeze({
			quantity: 'cumulative local spectral scattering density through N4',
			units: 'W m^-3 sr^-1 nm^-1',
		}),
		domains,
		provenance: Object.freeze({
			currentSceneRunId:
				'000493-san-jose-nautical-twilight-ozone-f68-w39-preview',
				canonicalAtmosphereComparisonPath:
				'src/algorithm32/implementation/canonical-atmosphere/consts.js',
			ozoneComparisonPath:
				'scripts/extraterrestrial/ozone/BrunetonOzoneReference.js',
		}),
	});
}

export default createPocTransportSpec;
