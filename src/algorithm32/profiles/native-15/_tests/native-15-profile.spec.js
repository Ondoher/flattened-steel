import {
	DEFAULT_NATIVE_NUMERICAL_PROFILE,
	DEFAULT_NATIVE_PHYSICAL_PROFILE,
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
	createNativeProductionProfile,
} from '../../index.js';
import {CANONICAL_SPECTRAL_CHANNELS} from '../consts.js';
import {
	SpectralBasis,
	SpectralPacket,
	SPECTRAL_BASIS_SCHEMA_REVISION,
	SPECTRAL_QUANTITIES,
	SPECTRAL_SAMPLE_SEMANTICS,
	SPECTRAL_UNITS,
} from '../../../spectral-values/index.js';

describe('native Algorithm32 production profile', /** Called by Jasmine to register the named test suite. */ () => {
	it('preserves the exact canonical Native-15 spectral-channel table', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(CANONICAL_SPECTRAL_CHANNELS.length).toBe(15);
		expect(
			CANONICAL_SPECTRAL_CHANNELS.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param channel - The channel value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (channel) => channel.name,
			),
		).toEqual([
			'lambda-376',
			'lambda-407',
			'lambda-438',
			'lambda-470',
			'lambda-501',
			'lambda-532',
			'lambda-564',
			'lambda-595',
			'lambda-626',
			'lambda-658',
			'lambda-689',
			'lambda-720',
			'lambda-752',
			'lambda-783',
			'lambda-814',
		]);
		expect(
			CANONICAL_SPECTRAL_CHANNELS.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param channel - The channel value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (channel) => channel.wavelength.value,
			),
		).toEqual([
			375.6666666666667, 407, 438.3333333333333, 469.66666666666663, 501, 532.3333333333333, 563.6666666666666,
			595, 626.3333333333333, 657.6666666666666, 689, 720.3333333333333, 751.6666666666666, 783,
			814.3333333333333,
		]);
		expect(
			CANONICAL_SPECTRAL_CHANNELS.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param channel - The channel value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (channel) => channel.sourceIrradiance.value,
			),
		).toEqual([
			1.0688666666666664, 1.729673, 1.8620716666666661, 2.0220633333333335, 1.9081540000000001,
			1.8833910000000003, 1.8342466666666666, 1.7674400000000001, 1.65952, 1.548102333333333, 1.45078,
			1.3409603333333335, 1.2624333333333335, 1.175208, 1.090824,
		]);
		for (const channel of CANONICAL_SPECTRAL_CHANNELS) {
			expect(channel.wavelength.units).toBe('nanometers');
			expect(channel.sourceIrradiance.units).toBe('W m^-2 nm^-1');
			expect(channel.wavelengthBinWidth).toEqual({
				value: 31.333333333333332,
				units: 'nanometers',
			});
		}
		expect(new Set(CANONICAL_SPECTRAL_CHANNELS).size).toBe(15);
		expect(
			new Set(
				CANONICAL_SPECTRAL_CHANNELS.map(
					/**
					 * Called by Array.prototype.map to transform one collection value.
					 * @param channel - The channel value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (channel) => channel.wavelength,
				),
			).size,
		).toBe(15);
		expect(
			new Set(
				CANONICAL_SPECTRAL_CHANNELS.map(
					/**
					 * Called by Array.prototype.map to transform one collection value.
					 * @param channel - The channel value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (channel) => channel.sourceIrradiance,
				),
			).size,
		).toBe(15);
		expect(
			new Set(
				CANONICAL_SPECTRAL_CHANNELS.map(
					/**
					 * Called by Array.prototype.map to transform one collection value.
					 * @param channel - The channel value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (channel) => channel.wavelengthBinWidth,
				),
			).size,
		).toBe(15);
	});

	it('owns the exact native 15-channel wavelength-bin basis', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(NATIVE_15_SPECTRAL_BASIS.id).toBe('algorithm32-native-15-spectral-basis-v1');
		expect(NATIVE_15_SPECTRAL_BASIS.schemaRevision).toBe(SPECTRAL_BASIS_SCHEMA_REVISION);
		expect(NATIVE_15_SPECTRAL_BASIS.semantics).toBe(SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE);
		expect(NATIVE_15_SPECTRAL_BASIS.channelCount).toBe(15);
		expect(NATIVE_15_SPECTRAL_BASIS.channels[0]).toEqual({
			id: 'lambda-376',
			center: {value: 375.6666666666667, units: 'nanometers'},
			width: {value: 31.333333333333332, units: 'nanometers'},
		});
		expect(NATIVE_15_SPECTRAL_BASIS.channels[14]).toEqual({
			id: 'lambda-814',
			center: {value: 814.3333333333333, units: 'nanometers'},
			width: {value: 31.333333333333332, units: 'nanometers'},
		});
		expect(NATIVE_15_SPECTRAL_BASIS.contentHash).toBe(
			'sha256:a03a3c7f45d9bd4ff8adf6482e9d1aac1acd72423758ecf797ac24f6dffba891',
		);
	});

	it('carries all source values only as a typed irradiance-density packet', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.quantity).toBe(SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.units).toBe(SPECTRAL_UNITS.IRRADIANCE_DENSITY);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.semantics).toBe(SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.basisHash).toBe(NATIVE_15_SPECTRAL_BASIS.contentHash);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.values.length).toBe(15);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.values[0]).toBe(1.0688666666666664);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.values[14]).toBe(1.090824);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.provenanceIdentity).toBe(
			'algorithm32-canonical-data-native-15-source-v1',
		);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.contentHash).toBe(
			'sha256:b501bad3f86702dbef751b7def0cd9bf189f56816bd54750063a1933591d751e',
		);
	});

	it('owns unit-bearing native physical values under unit-neutral keys', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(DEFAULT_NATIVE_PHYSICAL_PROFILE).toEqual(
			jasmine.objectContaining({
				kind: 'algorithm32-native-physical-profile',
				id: 'algorithm32-native-physical-default-v1',
				schemaRevision: 'algorithm32-native-physical-profile-v1',
				revision: 1,
				role: 'native-production-default',
				comparisonParity: false,
			}),
		);
		expect(DEFAULT_NATIVE_PHYSICAL_PROFILE.geometry).toEqual({
			bottomRadius: {value: 6360000, units: 'meters'},
			topRadius: {value: 6420000, units: 'meters'},
		});
		expect(DEFAULT_NATIVE_PHYSICAL_PROFILE.atmosphere.rayleigh).toEqual({
			coefficientScale: {value: 0.00000124062, units: 'm^-1'},
			scaleHeight: {value: 8000, units: 'meters'},
		});
		expect(DEFAULT_NATIVE_PHYSICAL_PROFILE.atmosphere.mie).toEqual({
			angstromAlpha: {value: 0.8, units: '1'},
			angstromBeta: {value: 0.04, units: '1'},
			phaseAsymmetry: {value: 0.7, units: '1'},
			scaleHeight: {value: 1200, units: 'meters'},
			singleScatteringAlbedo: {value: 0.8, units: '1'},
		});
		expect(DEFAULT_NATIVE_PHYSICAL_PROFILE.atmosphere.ozone).toEqual({absorptionEnabled: false});
	});

	it('owns direct numerical options without unused domain references', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(DEFAULT_NATIVE_NUMERICAL_PROFILE).toEqual(
			jasmine.objectContaining({
				kind: 'algorithm32-native-numerical-profile',
				id: 'algorithm32-native-numerical-default-v1',
				schemaRevision: 'algorithm32-native-numerical-profile-v1',
				revision: 1,
				role: 'native-production-default',
				comparisonParity: false,
			}),
		);
		expect(DEFAULT_NATIVE_NUMERICAL_PROFILE.viewPath).toEqual({intervalCount: 15, sampleDistribution: null});
		expect(DEFAULT_NATIVE_NUMERICAL_PROFILE.sourcePathTransmittance).toEqual({intervalCount: 20});
		expect(DEFAULT_NATIVE_NUMERICAL_PROFILE.cacheConstruction).toEqual({
			transportIntervalCount: 15,
			maximumScatteringOrder: 4,
		});
		expect('domains' in DEFAULT_NATIVE_NUMERICAL_PROFILE).toBeFalse();
	});

	it('marks the default as native production rather than comparison parity', /** Called by Jasmine to exercise the named behavior. */ () => {
		const constructedDefault = createNativeProductionProfile();

		expect(DEFAULT_NATIVE_PRODUCTION_PROFILE).toEqual(
			jasmine.objectContaining({
				kind: 'algorithm32-native-production-profile',
				id: 'algorithm32-native-production-default-v1',
				schemaRevision: 'algorithm32-native-production-profile-v1',
				revision: 1,
				role: 'native-production-default',
				comparisonParity: false,
			}),
		);
		expect(DEFAULT_NATIVE_PRODUCTION_PROFILE.id).not.toContain('paper');
		expect(DEFAULT_NATIVE_PRODUCTION_PROFILE.spectral.basis).toBe(NATIVE_15_SPECTRAL_BASIS);
		expect(DEFAULT_NATIVE_PRODUCTION_PROFILE.spectral.sourceIrradianceDensity).toBe(
			NATIVE_SOURCE_IRRADIANCE_DENSITY,
		);
		expect('albedo' in DEFAULT_NATIVE_PRODUCTION_PROFILE.spectral).toBeFalse();
		expect(DEFAULT_NATIVE_PRODUCTION_PROFILE.physical).toBe(DEFAULT_NATIVE_PHYSICAL_PROFILE);
		expect(DEFAULT_NATIVE_PRODUCTION_PROFILE.numerical).toBe(DEFAULT_NATIVE_NUMERICAL_PROFILE);
		expect('ground' in DEFAULT_NATIVE_PHYSICAL_PROFILE).toBeFalse();
		expect(constructedDefault).toEqual(DEFAULT_NATIVE_PRODUCTION_PROFILE);
		expect(constructedDefault).not.toBe(DEFAULT_NATIVE_PRODUCTION_PROFILE);
		expect(constructedDefault.spectral).not.toBe(DEFAULT_NATIVE_PRODUCTION_PROFILE.spectral);
		expect(constructedDefault.spectral.basis).toBe(NATIVE_15_SPECTRAL_BASIS);
		expect(constructedDefault.spectral.sourceIrradianceDensity).toBe(NATIVE_SOURCE_IRRADIANCE_DENSITY);
		expect(constructedDefault.physical).toBe(DEFAULT_NATIVE_PHYSICAL_PROFILE);
		expect(constructedDefault.numerical).toBe(DEFAULT_NATIVE_NUMERICAL_PROFILE);
	});

	it('applies every numerical override without mutating or copying the documented default', /** Called by Jasmine to exercise the named behavior. */ () => {
		const overrides = {
			pathIntervalCount: 7,
			sourceTransmittanceIntervalCount: 8,
			transportIntervalCount: 9,
			maximumScatteringOrder: /** @type {const} */ (2),
		};
		const first = createNativeProductionProfile(overrides);
		const second = createNativeProductionProfile(overrides);

		expect(first.numerical).toEqual({
			...DEFAULT_NATIVE_NUMERICAL_PROFILE,
			viewPath: {intervalCount: 7, sampleDistribution: null},
			sourcePathTransmittance: {intervalCount: 8},
			cacheConstruction: {
				transportIntervalCount: 9,
				maximumScatteringOrder: 2,
			},
		});
		expect(first.numerical).not.toBe(DEFAULT_NATIVE_NUMERICAL_PROFILE);
		expect(first.numerical).not.toBe(second.numerical);
		expect(first.numerical.viewPath).not.toBe(second.numerical.viewPath);
		expect(first.numerical.sourcePathTransmittance).not.toBe(second.numerical.sourcePathTransmittance);
		expect(first.numerical.cacheConstruction).not.toBe(second.numerical.cacheConstruction);
		expect(first.physical).toBe(DEFAULT_NATIVE_PHYSICAL_PROFILE);
		expect(first.spectral.basis).toBe(NATIVE_15_SPECTRAL_BASIS);
		expect(first.spectral.sourceIrradianceDensity).toBe(NATIVE_SOURCE_IRRADIANCE_DENSITY);
		expect(DEFAULT_NATIVE_NUMERICAL_PROFILE).toEqual({
			kind: 'algorithm32-native-numerical-profile',
			id: 'algorithm32-native-numerical-default-v1',
			schemaRevision: 'algorithm32-native-numerical-profile-v1',
			revision: 1,
			role: 'native-production-default',
			comparisonParity: false,
			viewPath: {intervalCount: 15, sampleDistribution: null},
			sourcePathTransmittance: {intervalCount: 20},
			cacheConstruction: {
				transportIntervalCount: 15,
				maximumScatteringOrder: 4,
			},
		});
	});

	it('retains explicit albedo only under the configured physical profile', /** Called by Jasmine to exercise the named behavior. */ () => {
		const albedo = new SpectralPacket({
			quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
			units: SPECTRAL_UNITS.DIMENSIONLESS,
			basis: NATIVE_15_SPECTRAL_BASIS,
			values: NATIVE_15_SPECTRAL_BASIS.channels.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param _channel - The intentionally unused callback value.
				 * @param index - The zero-based index accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (_channel, index) => index / 14,
			),
			provenanceIdentity: 'native-profile-ground-albedo-test-v1',
		});
		const first = createNativeProductionProfile({albedo});
		const second = createNativeProductionProfile({albedo});

		expect(first.physical.ground.albedo).toBe(albedo);
		expect(second.physical.ground.albedo).toBe(albedo);
		expect('albedo' in first.spectral).toBeFalse();
		expect(first.physical).not.toBe(DEFAULT_NATIVE_PHYSICAL_PROFILE);
		expect(first.physical).not.toBe(second.physical);
		expect(first.physical.ground).toEqual(second.physical.ground);
		expect(first.physical.ground).not.toBe(second.physical.ground);
	});

	it('rejects nonphysical or incompatible profile albedo', /** Called by Jasmine to exercise the named behavior. */ () => {
		/**
		 * Called by create albedo to create albedo.
		 * @param values - The values value accepted by the operation.
		 * @param basis - The basis value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ const createAlbedo = (values, basis = NATIVE_15_SPECTRAL_BASIS) =>
			new SpectralPacket({
				quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
				units: SPECTRAL_UNITS.DIMENSIONLESS,
				basis,
				values,
				provenanceIdentity: 'invalid-native-profile-ground-albedo-test-v1',
			});
		const validValues = NATIVE_15_SPECTRAL_BASIS.channels.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @returns - The callback result returned to its caller.
			 */ () => 0.2,
		);
		const nonphysicalValues = [...validValues];
		nonphysicalValues[4] = 1.01;
		const incompatibleBasis = new SpectralBasis({
			id: 'incompatible-native-ground-basis',
			channels: NATIVE_15_SPECTRAL_BASIS.channels,
			semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
		});

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createNativeProductionProfile({
					albedo: createAlbedo(nonphysicalValues),
				}),
		).toThrowError(/in \[0, 1\]/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createNativeProductionProfile({
					albedo: createAlbedo(validValues, incompatibleBasis),
				}),
		).toThrowError(/incompatible/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createNativeProductionProfile({albedo: validValues}),
		).toThrowError(/SpectralPacket/u);
	});

	it('retains accepted identity and source overrides by exact value identity', /** Called by Jasmine to exercise the named behavior. */ () => {
		const sourceIrradianceDensity = new SpectralPacket({
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			basis: NATIVE_15_SPECTRAL_BASIS,
			values: NATIVE_SOURCE_IRRADIANCE_DENSITY.values,
			provenanceIdentity: 'native-profile-source-override-test-v1',
		});
		const profile = createNativeProductionProfile({
			id: 'native-profile-override-test-v1',
			revision: 3,
			sourceIrradianceDensity,
		});

		expect(profile.id).toBe('native-profile-override-test-v1');
		expect(profile.revision).toBe(3);
		expect(profile.spectral.sourceIrradianceDensity).toBe(sourceIrradianceDensity);
		expect(profile.spectral.basis).toBe(NATIVE_15_SPECTRAL_BASIS);
		expect(profile.physical).toBe(DEFAULT_NATIVE_PHYSICAL_PROFILE);
		expect(profile.numerical).toBe(DEFAULT_NATIVE_NUMERICAL_PROFILE);
	});

	it('rejects raw or basis-incompatible source values', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createNativeProductionProfile({
					sourceIrradianceDensity: [1, 2, 3],
				}),
		).toThrowError(/SpectralPacket/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createNativeProductionProfile({
					sourceIrradianceDensity: {
						...NATIVE_SOURCE_IRRADIANCE_DENSITY,
					},
				}),
		).toThrowError(/SpectralPacket/);

		const incompatibleBasis = new SpectralBasis({
			id: 'incompatible-native-profile-basis',
			channels: NATIVE_15_SPECTRAL_BASIS.channels,
			semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
		});
		const incompatiblePacket = new SpectralPacket({
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			basis: incompatibleBasis,
			semantics: incompatibleBasis.semantics,
			values: NATIVE_SOURCE_IRRADIANCE_DENSITY.values,
			provenanceIdentity: 'incompatible-profile-test',
		});

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createNativeProductionProfile({
					sourceIrradianceDensity: incompatiblePacket,
				}),
		).toThrowError(/incompatible/);
	});

	it('defaults only omitted profile options and rejects invalid override values', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createNativeProductionProfile(null),
		).toThrowError(TypeError, 'Native production profile options must be an object.');
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createNativeProductionProfile([]),
		).toThrowError(TypeError, 'Native production profile options must be an object.');
		for (const overrides of [{id: null}, {revision: null}, {sourceIrradianceDensity: null}, {albedo: null}]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => createNativeProductionProfile(overrides),
			).toThrow();
		}

		for (const property of ['pathIntervalCount', 'sourceTransmittanceIntervalCount', 'transportIntervalCount']) {
			for (const invalidValue of [0, 1.5, Number.MAX_SAFE_INTEGER + 1, null]) {
				expect(
					/**
					 * Called by Jasmine to invoke the operation whose outcome is asserted.
					 * @returns - The callback result returned to its caller.
					 */ () => createNativeProductionProfile({[property]: invalidValue}),
				).toThrowError(RangeError, /positive safe integer/u);
			}
		}

		for (const maximumScatteringOrder of [0, 3, 5, null]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => createNativeProductionProfile({maximumScatteringOrder}),
			).toThrowError(RangeError, 'Native production profile maximum scattering order must be one of 1, 2, or 4.');
		}

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createNativeProductionProfile({
					sourceIrradianceDensity: [1, 2, 3],
					pathIntervalCount: 0,
				}),
		).toThrowError(/SpectralPacket/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createNativeProductionProfile({
					albedo: [],
					pathIntervalCount: 0,
				}),
		).toThrowError(/SpectralPacket/u);
	});

	it('keeps physical units in values rather than public property names', /** Called by Jasmine to exercise the named behavior. */ () => {
		expectNoUnitSuffixKeys(DEFAULT_NATIVE_PRODUCTION_PROFILE);
	});
});

/**
 * Called by this module to reject dimensional-unit spellings embedded in public property names.
 * @param value - The value accepted by the operation.
 * @param path - The path value accepted by the operation.
 * @param seen - The seen value accepted by the operation.
 */
function expectNoUnitSuffixKeys(value, path = 'profile', seen = new Set()) {
	if (value === null || typeof value !== 'object' || seen.has(value)) {
		return;
	}

	seen.add(value);
	for (const [key, child] of Object.entries(value)) {
		expect(key)
			.withContext(`${path}.${key} must carry units as data`)
			.not.toMatch(/(?:meters|kilometers|nanometers|micrometers|radians|degrees|steradians)$/i);
		expectNoUnitSuffixKeys(child, `${path}.${key}`, seen);
	}
}
