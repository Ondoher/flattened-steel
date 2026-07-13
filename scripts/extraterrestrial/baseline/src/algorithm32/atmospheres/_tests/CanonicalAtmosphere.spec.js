import { CanonicalAtmosphere } from '../CanonicalAtmosphere.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralBasis,
} from '../../quantities/index.js';

describe('CanonicalAtmosphere', () => {
	it('describes immutable canonical atmosphere configuration', () => {
		const atmosphere = createAtmosphere();

		expect(atmosphere.id).toBe('canonical-atmosphere');
		expect(atmosphere.describe()).toEqual(jasmine.objectContaining({
			kind: 'canonical-atmosphere',
			spectralChannelCount: 2,
			spectralBasisHash: atmosphere.spectralBasis.contentHash,
			constants: createConstants(),
		}));
		expect(atmosphere.spectralBasis).toEqual(createSpectralBasisValue());
	});

	it('creates one geometry-neutral shader contribution from owner configuration', () => {
		const atmosphere = createAtmosphere();
		const flatDescriptor = createFlatDescriptor();
		flatDescriptor.atmosphere.facts.constants = {
			...createConstants(),
			rayleighCoefficientScale: 999,
		};
		const spherical = atmosphere.createShaderContribution({
			descriptor: createSphericalDescriptor(),
		});
		const flat = atmosphere.createShaderContribution({
			descriptor: flatDescriptor,
		});

		expect(spherical.id).toBe('atmosphere-canonical');
		expect(spherical.owner).toBe('atmosphere');
		expect(flat.id).toBe('atmosphere-canonical');
		expect(flat.owner).toBe('atmosphere');
		expect(flat.provides).toEqual(['atmosphere.sampleMedium']);
		expect(flat.requires).toEqual(['geometry.atmosphereCoordinateTypes']);
		expect(spherical.functions[0].code).toContain(
			'ATMOSPHERE_WAVELENGTH_MICROMETERS[2] = float[2](1.0, 2.0)',
		);
		expect(flat.functions.map((block) => block.code)).toEqual(
			spherical.functions.map((block) => block.code),
		);
		const source = spherical.functions.map((block) => block.code).join('\n');
		expect(source).toContain('MediumSample sampleAtmosphere(AtmosphereCoordinate coordinate)');
		expect(source).not.toContain('sourcePathTransmittance');
		expect(source).not.toContain('GEOMETRY_BOTTOM_RADIUS');
		expect(source).not.toContain('GEOMETRY_TOP_ALTITUDE');
	});

	it('samples Rayleigh and Mie medium coefficients by wavelength and density', () => {
		const atmosphere = createAtmosphere();
		const medium = atmosphere.sampleMedium({ altitude: meters(0) });

		expect(medium.extinction.basis).toBe(atmosphere.spectralBasis);

		expectSpectralPacketClose(
			medium.rayleighScattering,
			SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			[2, 0.125],
		);
		expectSpectralPacketClose(
			medium.mieExtinction,
			SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			[2, 1],
		);
		expectSpectralPacketClose(
			medium.mieScattering,
			SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			[1, 0.5],
		);
		expectSpectralPacketClose(
			medium.extinction,
			SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			[4, 1.125],
		);
		expectSpectralPacketClose(
			medium.scattering,
			SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			[3, 0.625],
		);
		expectSpectralPacketClose(
			medium.absorption,
			SPECTRAL_QUANTITIES.ABSORPTION_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			[0, 0],
		);
		expect(medium.density).toEqual({
			rayleigh: 1,
			mie: 1,
			absorption: 0,
		});
	});

	it('applies exponential density profiles above the ground', () => {
		const medium = createAtmosphere().sampleMedium({ altitude: meters(10) });

		expectSpectralClose(medium.rayleighScattering.values, [2 * Math.exp(-1), 0.125 * Math.exp(-1)]);
		expectSpectralClose(medium.mieExtinction.values, [2 * Math.exp(-2), Math.exp(-2)]);
	});

	it('normalizes supported distance units once at the atmosphere boundary', () => {
		const constants = {
			...createConstants(),
			rayleighScaleHeight: kilometers(0.01),
			mieScaleHeight: kilometers(0.005),
		};
		const medium = createAtmosphere({ constants }).sampleMedium({ altitude: kilometers(0.01) });

		expectSpectralClose(medium.rayleighScattering.values, [2 * Math.exp(-1), 0.125 * Math.exp(-1)]);
		expectSpectralClose(medium.mieExtinction.values, [2 * Math.exp(-2), Math.exp(-2)]);
	});

	it('integrates optical depth and transmittance over path samples', () => {
		const result = createAtmosphere().integrateOpticalDepth({
			samples: [
				{ atmosphereCoordinate: { altitude: meters(0) }, measure: meters(0.5) },
				{ atmosphereCoordinate: { altitude: meters(0) }, measure: meters(0.5) },
			],
		});

		expect(result.blockedByGround).toBeFalse();
		expectSpectralPacketClose(
			result.opticalDepth,
			SPECTRAL_QUANTITIES.OPTICAL_DEPTH,
			SPECTRAL_UNITS.DIMENSIONLESS,
			[4, 1.125],
		);
		expectSpectralPacketClose(
			result.transmittance,
			SPECTRAL_QUANTITIES.TRANSMITTANCE,
			SPECTRAL_UNITS.DIMENSIONLESS,
			[Math.exp(-4), Math.exp(-1.125)],
		);
	});

	it('returns opaque transmittance for ground-blocked source paths', () => {
		const result = createAtmosphere().integrateOpticalDepth({ blockedByGround: true });

		expect(result.blockedByGround).toBeTrue();
		expect(result.opticalDepth).toBeNull();
		expectSpectralPacketClose(
			result.transmittance,
			SPECTRAL_QUANTITIES.TRANSMITTANCE,
			SPECTRAL_UNITS.DIMENSIONLESS,
			[0, 0],
		);
	});

	it('samples Rayleigh and Mie phase values for direction pairs', () => {
		const result = createAtmosphere().samplePhase({
			viewDirection: [1, 0, 0],
			incomingDirection: [1, 0, 0],
		});
		const rayleighPhase = 3 / (8 * Math.PI);
		const miePhase = miePhaseFunction(0.25, 1);

		expect(result.rayleighPhase.units).toBe(SPECTRAL_UNITS.INVERSE_SOLID_ANGLE);
		expect(result.rayleighPhase.value).toBeCloseTo(rayleighPhase, 12);
		expect(result.miePhase.units).toBe(SPECTRAL_UNITS.INVERSE_SOLID_ANGLE);
		expect(result.miePhase.value).toBeCloseTo(miePhase, 12);
		expect('phase' in result).toBeFalse();
	});

	it('fails loudly for invalid configuration or sample packets', () => {
		expect(() => new CanonicalAtmosphere()).toThrowError(/configuration/);
		expect(() => createAtmosphere({ constants: { ...createConstants(), mieScaleHeight: meters(0) } }))
			.toThrowError(/positive/);
		expect(() => createAtmosphere({ spectralBasis: null })).toThrowError(/spectralBasis/);
		expect(() => createAtmosphere().sampleMedium({})).toThrowError(/altitude/);
		expect(() => createAtmosphere().integrateOpticalDepth({})).toThrowError(/samples/);
		expect(() => createAtmosphere().samplePhase({ viewDirection: [1, 0, 0] })).toThrowError(/incomingDirection/);
	});
});

function createAtmosphere(overrides = {}) {
	return new CanonicalAtmosphere({
		constants: createConstants(),
		spectralBasis: createSpectralBasisValue(),
		...overrides,
	});
}

function createConstants() {
	return {
		bottomRadius: meters(10),
		topRadius: meters(20),
		rayleighScaleHeight: meters(10),
		mieScaleHeight: meters(5),
		rayleighCoefficientScale: 2,
		mieAngstromAlpha: 1,
		mieAngstromBeta: 10,
		mieSingleScatteringAlbedo: 0.5,
		miePhaseFunctionG: 0.25,
		ozoneAbsorptionEnabled: false,
	};
}

function createSpectralBasisValue() {
	return createSpectralBasis({
		id: 'canonical-atmosphere-test-basis',
		channels: [
			{
				id: 'a',
				center: { value: 1000, units: 'nanometers' },
				width: { value: 1000, units: 'nanometers' },
			},
			{
				id: 'b',
				center: { value: 2000, units: 'nanometers' },
				width: { value: 1000, units: 'nanometers' },
			},
		],
	});
}

function createSphericalDescriptor() {
	return createDescriptor({
		geometry: {
			kind: 'spherical-earth-geometry',
			bottomRadius: meters(10),
			topRadius: meters(20),
			observerHeight: meters(1),
			cacheAltitudeBinCount: 2,
			cacheBoundaryAltitude: meters(2),
			sourceTransmittanceIntervalCount: 2,
		},
		lightSource: {
			kind: 'distant-sun-light-source',
			directionToLight: [0, 1, 0],
		},
		cache: {
			cacheKind: 'distant',
			metadata: {
				altitudeBinCount: 2,
				directionCount: 4,
			},
		},
		transport: {
			execution: {
				pathIntervalCount: 2,
				sourceTransmittanceIntervalCount: 2,
			},
		},
	});
}

function createFlatDescriptor() {
	return createDescriptor({
		geometry: {
			kind: 'flat-earth-geometry',
			observerPosition: position([0, 0, 2]),
			sourcePosition: position([10, 0, 5]),
			sourceSubpoint: position([10, 0, 0]),
			topAltitude: meters(12),
			sceneSkyRayLimit: meters(100),
			sourceTransmittanceIntervalCount: 2,
		},
		lightSource: {
			kind: 'local-sun-light-source',
			sourceKey: 'local-test',
			referenceDistance: meters(4800000),
			referenceSpectralIncidentScale: 1.25,
			radius: meters(25749.504),
			distanceFalloff: true,
		},
		cache: {
			cacheKind: 'local',
			metadata: {
				zBinCount: 3,
				rhoBinCount: 3,
				directionCount: 9,
			},
		},
		transport: {
			execution: {
				pathIntervalCount: 2,
				sourceTransmittanceIntervalCount: 2,
			},
		},
	});
}

function createDescriptor(overrides) {
	return {
		descriptorId: 'descriptor',
		variantId: 'variant',
		fingerprint: 'descriptor',
		compatibilityTags: [],
		spectralBasis: createSection('basis', {
			channelCount: 15,
		}),
		geometry: createSection('geometry', overrides.geometry),
		atmosphere: createSection('atmosphere', {
			kind: 'canonical-atmosphere',
			constants: createConstants(),
		}),
		lightSource: createSection('light-source', overrides.lightSource),
		cache: createSection('cache', overrides.cache),
		transport: createSection('transport', overrides.transport),
		color: createSection('color', {}),
		runtime: createSection('runtime', {}),
	};
}

function createSection(fingerprint, facts) {
	return {
		descriptorId: fingerprint,
		fingerprint,
		compatibilityTags: [fingerprint],
		facts,
	};
}

function meters(value) {
	return { value, units: 'meters' };
}

function kilometers(value) {
	return { value, units: 'kilometers' };
}

function position(coordinates) {
	return { coordinates, units: 'meters' };
}

function expectSpectralClose(actual, expected) {
	expect(actual.length).toBe(expected.length);

	for (let index = 0; index < actual.length; index += 1) {
		expect(actual[index]).withContext(`channel ${index}`).toBeCloseTo(expected[index], 12);
	}
}

function expectSpectralPacketClose(actual, quantity, units, expected) {
	expect(actual.quantity).toBe(quantity);
	expect(actual.units).toBe(units);
	expect(actual.basis.channelCount).toBe(expected.length);
	expect(actual.provenanceIdentity).toMatch(/^canonical-atmosphere:/);
	expectSpectralClose(actual.values, expected);
}

function miePhaseFunction(g, nu) {
	const k = (3 / (8 * Math.PI)) * ((1 - g * g) / (2 + g * g));
	const denominator = Math.max(1 + g * g - 2 * g * nu, Number.EPSILON);

	return (k * (1 + nu * nu)) / denominator ** 1.5;
}
