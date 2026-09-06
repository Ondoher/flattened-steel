import {
	DEFAULT_NATIVE_NUMERICAL_PROFILE,
	DEFAULT_NATIVE_PHYSICAL_PROFILE,
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
	createNativeProductionProfile,
} from '../index.js';
import {
	createSpectralBasis,
	createSpectralPacket,
	SPECTRAL_BASIS_SCHEMA_REVISION,
	SPECTRAL_QUANTITIES,
	SPECTRAL_SAMPLE_SEMANTICS,
	SPECTRAL_UNITS,
} from '../../quantities/index.js';
import { UniformLambertianGroundBoundary } from '../../ground-boundaries/index.js';

describe('native Algorithm32 production profile', () => {
	it('owns the exact native 15-channel wavelength-bin basis', () => {
		expect(NATIVE_15_SPECTRAL_BASIS.id)
			.toBe('algorithm32-native-15-spectral-basis-v1');
		expect(NATIVE_15_SPECTRAL_BASIS.schemaRevision)
			.toBe(SPECTRAL_BASIS_SCHEMA_REVISION);
		expect(NATIVE_15_SPECTRAL_BASIS.semantics)
			.toBe(SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE);
		expect(NATIVE_15_SPECTRAL_BASIS.channelCount).toBe(15);
		expect(NATIVE_15_SPECTRAL_BASIS.channels[0]).toEqual({
			id: 'lambda-376',
			center: { value: 375.6666666666667, units: 'nanometers' },
			width: { value: 31.333333333333332, units: 'nanometers' },
		});
		expect(NATIVE_15_SPECTRAL_BASIS.channels[14]).toEqual({
			id: 'lambda-814',
			center: { value: 814.3333333333333, units: 'nanometers' },
			width: { value: 31.333333333333332, units: 'nanometers' },
		});
		expect(NATIVE_15_SPECTRAL_BASIS.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
	});

	it('carries all source values only as a typed irradiance-density packet', () => {
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.quantity)
			.toBe(SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.units)
			.toBe(SPECTRAL_UNITS.IRRADIANCE_DENSITY);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.semantics)
			.toBe(SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.basisHash)
			.toBe(NATIVE_15_SPECTRAL_BASIS.contentHash);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.values.length).toBe(15);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.values[0]).toBe(1.0688666666666664);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.values[14]).toBe(1.090824);
		expect(NATIVE_SOURCE_IRRADIANCE_DENSITY.provenanceIdentity)
			.toBe('algorithm32-canonical-data-native-15-source-v1');
	});

	it('owns unit-bearing native physical values under unit-neutral keys', () => {
		expect(DEFAULT_NATIVE_PHYSICAL_PROFILE.geometry).toEqual({
			bottomRadius: { value: 6360000, units: 'meters' },
			topRadius: { value: 6420000, units: 'meters' },
		});
		expect(DEFAULT_NATIVE_PHYSICAL_PROFILE.atmosphere.rayleigh).toEqual({
			coefficientScale: { value: 0.00000124062, units: 'm^-1' },
			scaleHeight: { value: 8000, units: 'meters' },
		});
		expect(DEFAULT_NATIVE_PHYSICAL_PROFILE.atmosphere.mie).toEqual({
			angstromAlpha: { value: 0.8, units: '1' },
			angstromBeta: { value: 0.04, units: '1' },
			phaseAsymmetry: { value: 0.7, units: '1' },
			scaleHeight: { value: 1200, units: 'meters' },
			singleScatteringAlbedo: { value: 0.8, units: '1' },
		});
		expect(DEFAULT_NATIVE_PHYSICAL_PROFILE.atmosphere.ozone)
			.toEqual({ absorptionEnabled: false });
	});

	it('references selected controls and domains without copying their values', () => {
		expect(DEFAULT_NATIVE_NUMERICAL_PROFILE.sourcePathTransmittance)
			.toEqual({ intervalCount: 20 });
		expect(DEFAULT_NATIVE_NUMERICAL_PROFILE.cacheConstruction.id)
			.toBe('algorithm32-default-cache-construction-controls-v1');
		expect('transportIntervalCount' in DEFAULT_NATIVE_NUMERICAL_PROFILE.cacheConstruction)
			.toBeFalse();
		expect(DEFAULT_NATIVE_NUMERICAL_PROFILE.domains.position.id)
			.toBe('algorithm32-native-48-position-v1');
		expect(DEFAULT_NATIVE_NUMERICAL_PROFILE.domains.incomingDirection.id)
			.toBe('algorithm32-fibonacci-34-incoming-v1');
		expect(DEFAULT_NATIVE_NUMERICAL_PROFILE.domains.outgoingDirection.id)
			.toBe('algorithm32-cubed-sphere-w27-outgoing-v1');
		expect('nodes' in DEFAULT_NATIVE_NUMERICAL_PROFILE.domains.position).toBeFalse();
		expect('unitVectors' in DEFAULT_NATIVE_NUMERICAL_PROFILE.domains.incomingDirection)
			.toBeFalse();
	});

	it('marks the default as native production rather than comparison parity', () => {
		expect(DEFAULT_NATIVE_PRODUCTION_PROFILE).toEqual(jasmine.objectContaining({
			kind: 'algorithm32-native-production-profile',
			id: 'algorithm32-native-production-default-v1',
			revision: 1,
			role: 'native-production-default',
			comparisonParity: false,
		}));
		expect(DEFAULT_NATIVE_PRODUCTION_PROFILE.id).not.toContain('paper');
		expect(DEFAULT_NATIVE_PRODUCTION_PROFILE.spectral.basis)
			.toBe(NATIVE_15_SPECTRAL_BASIS);
		expect(DEFAULT_NATIVE_PRODUCTION_PROFILE.spectral.sourceIrradianceDensity)
			.toBe(NATIVE_SOURCE_IRRADIANCE_DENSITY);
		expect('albedo' in DEFAULT_NATIVE_PRODUCTION_PROFILE.spectral).toBeFalse();
		expect(DEFAULT_NATIVE_PRODUCTION_PROFILE.physical)
			.toBe(DEFAULT_NATIVE_PHYSICAL_PROFILE);
		expect('ground' in DEFAULT_NATIVE_PHYSICAL_PROFILE).toBeFalse();
		expect(createNativeProductionProfile().contentHash)
			.toBe(DEFAULT_NATIVE_PRODUCTION_PROFILE.contentHash);
		expect(() => new UniformLambertianGroundBoundary({
			albedo: DEFAULT_NATIVE_PRODUCTION_PROFILE.physical.ground?.albedo,
		})).toThrowError(/SpectralPacket/u);
	});

	it('retains explicit albedo only under the configured physical profile', () => {
		const albedo = createSpectralPacket({
			quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
			units: SPECTRAL_UNITS.DIMENSIONLESS,
			basis: NATIVE_15_SPECTRAL_BASIS,
			values: NATIVE_15_SPECTRAL_BASIS.channels.map((_channel, index) => index / 14),
			provenanceIdentity: 'native-profile-ground-albedo-test-v1',
		});
		const first = createNativeProductionProfile({ albedo });
		const second = createNativeProductionProfile({ albedo });

		expect(first.physical.ground.albedo).toBe(albedo);
		expect('albedo' in first.spectral).toBeFalse();
		expect(first.physical.contentHash).toBe(second.physical.contentHash);
		expect(first.physical.contentHash)
			.not.toBe(DEFAULT_NATIVE_PHYSICAL_PROFILE.contentHash);
		expect(first.contentHash).toBe(second.contentHash);
		expect(first.contentHash).not.toBe(DEFAULT_NATIVE_PRODUCTION_PROFILE.contentHash);
	});

	it('hands physical ground albedo to the Lambertian boundary by exact identity', () => {
		const albedo = createSpectralPacket({
			quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
			units: SPECTRAL_UNITS.DIMENSIONLESS,
			basis: NATIVE_15_SPECTRAL_BASIS,
			values: NATIVE_15_SPECTRAL_BASIS.channels.map(() => 0.25),
			provenanceIdentity: 'native-profile-ground-boundary-handoff-test-v1',
		});
		const profile = createNativeProductionProfile({ albedo });
		const boundary = new UniformLambertianGroundBoundary({
			id: 'native-profile-ground-boundary-handoff-v1',
			albedo: profile.physical.ground.albedo,
		});

		expect(boundary.albedo).toBe(albedo);
		expect(boundary.describe()).toEqual(jasmine.objectContaining({
			albedoHash: albedo.contentHash,
			spectralBasisHash: NATIVE_15_SPECTRAL_BASIS.contentHash,
		}));
	});

	it('rejects nonphysical or incompatible profile albedo', () => {
		const createAlbedo = (values, basis = NATIVE_15_SPECTRAL_BASIS) =>
			createSpectralPacket({
				quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
				units: SPECTRAL_UNITS.DIMENSIONLESS,
				basis,
				values,
				provenanceIdentity: 'invalid-native-profile-ground-albedo-test-v1',
			});
		const validValues = NATIVE_15_SPECTRAL_BASIS.channels.map(() => 0.2);
		const nonphysicalValues = [...validValues];
		nonphysicalValues[4] = 1.01;
		const incompatibleBasis = createSpectralBasis({
			id: 'incompatible-native-ground-basis',
			channels: NATIVE_15_SPECTRAL_BASIS.channels,
			semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
		});

		expect(() => createNativeProductionProfile({
			albedo: createAlbedo(nonphysicalValues),
		})).toThrowError(/in \[0, 1\]/u);
		expect(() => createNativeProductionProfile({
			albedo: createAlbedo(validValues, incompatibleBasis),
		})).toThrowError(/incompatible/u);
		expect(() => createNativeProductionProfile({ albedo: validValues }))
			.toThrowError(/SpectralPacket/u);
	});

	it('rejects raw or basis-incompatible source values', () => {
		expect(() => createNativeProductionProfile({
			sourceIrradianceDensity: [1, 2, 3],
		})).toThrowError(/SpectralPacket/);
		expect(() => createNativeProductionProfile({
			sourceIrradianceDensity: {
				...NATIVE_SOURCE_IRRADIANCE_DENSITY,
			},
		})).toThrowError(/SpectralPacket/);

		const incompatibleBasis = createSpectralBasis({
			id: 'incompatible-native-profile-basis',
			channels: NATIVE_15_SPECTRAL_BASIS.channels,
			semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
		});
		const incompatiblePacket = createSpectralPacket({
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			basis: incompatibleBasis,
			semantics: incompatibleBasis.semantics,
			values: NATIVE_SOURCE_IRRADIANCE_DENSITY.values,
			provenanceIdentity: 'incompatible-profile-test',
		});

		expect(() => createNativeProductionProfile({
			sourceIrradianceDensity: incompatiblePacket,
		})).toThrowError(/incompatible/);
	});

	it('defaults only omitted profile options', () => {
		for (const overrides of [
			{ id: null },
			{ revision: null },
			{ sourceIrradianceDensity: null },
			{ albedo: null },
		]) {
			expect(() => createNativeProductionProfile(overrides)).toThrow();
		}
	});

	it('keeps physical units in values rather than public property names', () => {
		expectNoUnitSuffixKeys(DEFAULT_NATIVE_PRODUCTION_PROFILE);
	});
});

/** Reject dimensional-unit spellings embedded in public property names. */
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
