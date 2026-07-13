import {CanonicalAtmosphere} from '../CanonicalAtmosphere.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../consts.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_SAMPLE_SEMANTICS,
	SPECTRAL_UNITS,
	SpectralBasis,
	SpectralPacket,
} from '../../../spectral-values/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';

describe('CanonicalAtmosphere', /** Called by Jasmine to register the named test suite. */ () => {
	it('promotes the accepted canonical atmosphere constants', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(CANONICAL_ATMOSPHERE_CONSTANTS).toEqual(
			jasmine.objectContaining({
				bottomRadius: {value: 6360000, units: 'meters'},
				topRadius: {value: 6420000, units: 'meters'},
				rayleighScaleHeight: {value: 8000, units: 'meters'},
				mieScaleHeight: {value: 1200, units: 'meters'},
				rayleighCoefficientScale: 0.00000124062,
				mieAngstromAlpha: 0.8,
				mieAngstromBeta: 0.04,
				mieSingleScatteringAlbedo: 0.8,
				miePhaseFunctionG: 0.7,
				ozoneAbsorptionEnabled: false,
			}),
		);
	});

	it('exposes immutable canonical atmosphere configuration directly', /** Called by Jasmine to exercise the named behavior. */ () => {
		const atmosphere = createAtmosphere();

		expect(atmosphere.id).toBe('canonical-atmosphere');
		expect(atmosphere.constants).toEqual(createConstants());
		expect(atmosphere.spectralBasis).toBe(NATIVE_15_SPECTRAL_BASIS);
	});

	it('creates one geometry-neutral shader contribution from owner configuration', /** Called by Jasmine to exercise the named behavior. */ () => {
		const atmosphere = createAtmosphere();
		const first = atmosphere.createShaderContribution();
		const second = atmosphere.createShaderContribution();

		expect(first.id).toBe('atmosphere-canonical');
		expect(first.owner).toBe('atmosphere');
		expect(first.provides).toEqual(['atmosphere.sampleMedium']);
		expect(first.requires).toEqual(['geometry.atmosphereCoordinateTypes']);
		expect(first.functions[0].code).toContain('ATMOSPHERE_WAVELENGTH_MICROMETERS[15]');
		expect(
			second.functions.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param block - The block value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (block) => block.code,
			),
		).toEqual(
			first.functions.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param block - The block value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (block) => block.code,
			),
		);
		const source = first.functions
			.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param block - The block value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (block) => block.code,
			)
			.join('\n');
		expect(source).toContain('MediumSample sampleAtmosphere(AtmosphereCoordinate coordinate)');
		expect(source).not.toContain('sourcePathTransmittance');
		expect(source).not.toContain('GEOMETRY_BOTTOM_RADIUS');
		expect(source).not.toContain('GEOMETRY_TOP_ALTITUDE');
	});

	it('provides only wavelength extinction to integrated transport', /** Called by Jasmine to exercise the named behavior. */ () => {
		const module = createAtmosphere().createCacheModule(/** @type {CacheBuildContext} */ ({kind: 'transport'}));
		const source = module.blocks.map(({source: blockSource}) => blockSource).join('\n');

		expect(module.provides).toEqual(['atmosphere.medium']);
		expect(module.requires).toEqual(['geometry.cachePosition']);
		expect(source).toContain('float cacheExtinction(vec3 positionMeters, int wavelengthIndex)');
		expect(source).not.toContain('cacheRayleighPhase(');
		expect(source).not.toContain('cachePathTransmittance(');
		expect(source).not.toContain('cacheFiniteSegmentTransmittance(');
	});

	it('uses exact aligned point-sampled sea-level coefficients in CPU and shader paths', /** Called by Jasmine to exercise the named behavior. */ () => {
		const spectralBasis = createDirect40Basis();
		const rayleighValues = Array.from({length: 40}, (_value, index) => (index + 1) * 1e-6);
		const mieValues = Array.from({length: 40}, (_value, index) => (index + 1) * 2e-6);
		const atmosphere = createAtmosphere({
			spectralBasis,
			seaLevelRayleighScattering: createCoefficientPacket(
				spectralBasis,
				SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
				rayleighValues,
			),
			seaLevelMieExtinction: createCoefficientPacket(
				spectralBasis,
				SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
				mieValues,
			),
		});
		const medium = atmosphere.sampleMedium({altitude: meters(0)});
		const runtimeSource = atmosphere
			.createShaderContribution()
			.functions.map(({code}) => code)
			.join('\n');
		const cacheModule = atmosphere.createCacheModule(/** @type {CacheBuildContext} */ ({kind: 'transport'}));
		const cacheSource = cacheModule.blocks.map(({source}) => source).join('\n');

		expect(atmosphere.spectralBasis).toBe(spectralBasis);
		expect(medium.rayleighScattering.values).toEqual(rayleighValues);
		expect(medium.mieExtinction.values).toEqual(mieValues);
		expect(runtimeSource).toContain('ATMOSPHERE_SEA_LEVEL_RAYLEIGH_SCATTERING[40]');
		expect(cacheSource).toContain('uCacheSeaLevelRayleighScattering[wavelengthIndex]');
		expect(cacheModule.bindings.some(({spec}) => spec.name === 'uCacheSeaLevelMieExtinction')).toBeTrue();
	});

	it('samples Rayleigh and Mie medium coefficients by wavelength and density', /** Called by Jasmine to exercise the named behavior. */ () => {
		const atmosphere = createAtmosphere();
		const medium = atmosphere.sampleMedium({altitude: meters(0)});

		expect(medium.extinction.basis).toBe(atmosphere.spectralBasis);

		const rayleighScattering = expectedRayleighScattering();
		const mieExtinction = expectedMieExtinction();
		const mieScattering = mieExtinction.map((value) => value * 0.5);
		const extinction = rayleighScattering.map((value, index) => value + mieExtinction[index]);
		const scattering = rayleighScattering.map((value, index) => value + mieScattering[index]);
		expectSpectralPacketClose(
			medium.rayleighScattering,
			SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			rayleighScattering,
		);
		expectSpectralPacketClose(
			medium.mieExtinction,
			SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			mieExtinction,
		);
		expectSpectralPacketClose(
			medium.mieScattering,
			SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			mieScattering,
		);
		expectSpectralPacketClose(
			medium.extinction,
			SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			extinction,
		);
		expectSpectralPacketClose(
			medium.scattering,
			SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			scattering,
		);
		expectSpectralPacketClose(
			medium.absorption,
			SPECTRAL_QUANTITIES.ABSORPTION_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			zeroSpectrum(),
		);
		expect(medium.density).toEqual({
			rayleigh: 1,
			mie: 1,
			absorption: 0,
		});
	});

	it('creates fresh atmosphere packets with stable owner provenance', /** Called by Jasmine to exercise the named behavior. */ () => {
		const atmosphere = createAtmosphere();
		const first = atmosphere.sampleMedium({altitude: meters(0)});
		const second = atmosphere.sampleMedium({altitude: meters(0)});

		expect(second.extinction).not.toBe(first.extinction);
		expect(second.extinction.values).not.toBe(first.extinction.values);
		expect(second.extinction.values).toEqual(first.extinction.values);
		expect(second.extinction.basis).toBe(atmosphere.spectralBasis);
		expect(second.extinction.provenanceIdentity).toBe(
			`canonical-atmosphere:${atmosphere.spectralBasis.contentHash}:total-extinction`,
		);
		expect(second.extinction.provenanceIdentity).toBe(first.extinction.provenanceIdentity);
	});

	it('applies exponential density profiles above the ground', /** Called by Jasmine to exercise the named behavior. */ () => {
		const medium = createAtmosphere().sampleMedium({altitude: meters(10)});

		expectSpectralClose(medium.rayleighScattering.values, expectedRayleighScattering(Math.exp(-1)));
		expectSpectralClose(medium.mieExtinction.values, expectedMieExtinction(Math.exp(-2)));
	});

	it('normalizes supported distance units once at the atmosphere boundary', /** Called by Jasmine to exercise the named behavior. */ () => {
		const constants = {
			...createConstants(),
			rayleighScaleHeight: kilometers(0.01),
			mieScaleHeight: kilometers(0.005),
		};
		const medium = createAtmosphere({constants}).sampleMedium({altitude: kilometers(0.01)});

		expectSpectralClose(medium.rayleighScattering.values, expectedRayleighScattering(Math.exp(-1)));
		expectSpectralClose(medium.mieExtinction.values, expectedMieExtinction(Math.exp(-2)));
	});

	it('integrates optical depth and transmittance over path samples', /** Called by Jasmine to exercise the named behavior. */ () => {
		const result = createAtmosphere().integrateOpticalDepth({
			samples: [
				{atmosphereCoordinate: {altitude: meters(0)}, measure: meters(0.5)},
				{atmosphereCoordinate: {altitude: meters(0)}, measure: meters(0.5)},
			],
		});

		expect(result.blockedByGround).toBeFalse();
		const rayleighScattering = expectedRayleighScattering();
		const mieExtinction = expectedMieExtinction();
		const opticalDepth = rayleighScattering.map((value, index) => value + mieExtinction[index]);
		expectSpectralPacketClose(
			result.opticalDepth,
			SPECTRAL_QUANTITIES.OPTICAL_DEPTH,
			SPECTRAL_UNITS.DIMENSIONLESS,
			opticalDepth,
		);
		expectSpectralPacketClose(
			result.transmittance,
			SPECTRAL_QUANTITIES.TRANSMITTANCE,
			SPECTRAL_UNITS.DIMENSIONLESS,
			opticalDepth.map((value) => Math.exp(-value)),
		);
	});

	it('returns opaque transmittance for ground-blocked source paths', /** Called by Jasmine to exercise the named behavior. */ () => {
		const result = createAtmosphere().integrateOpticalDepth({blockedByGround: true});

		expect(result.blockedByGround).toBeTrue();
		expect(result.opticalDepth).toBeNull();
		expectSpectralPacketClose(
			result.transmittance,
			SPECTRAL_QUANTITIES.TRANSMITTANCE,
			SPECTRAL_UNITS.DIMENSIONLESS,
			zeroSpectrum(),
		);
	});

	it('samples Rayleigh and Mie phase values for direction pairs', /** Called by Jasmine to exercise the named behavior. */ () => {
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

	it('rejects invalid physical configuration values', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createAtmosphere({constants: {...createConstants(), mieScaleHeight: meters(0)}}),
		).toThrowError(/positive/);
	});
});

/**
 * Called by this module to create atmosphere.
 * @param overrides - The overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createAtmosphere(overrides = {}) {
	return new CanonicalAtmosphere({
		constants: createConstants(),
		...overrides,
	});
}

/** Create the exact coordinate shape used by the direct-40 execution seam. */
function createDirect40Basis() {
	return new SpectralBasis({
		id: 'canonical-atmosphere-direct-40-test',
		semantics: SPECTRAL_SAMPLE_SEMANTICS.POINT_SAMPLED_SPECTRAL_DENSITY,
		channels: Array.from({length: 40}, (_value, index) => ({
			id: `sample-${index}`,
			center: {value: 360 + (470 * index) / 40, units: 'nanometers'},
			width: {value: 470 / 40, units: 'nanometers'},
		})),
	});
}

/** Create one aligned sea-level coefficient packet. */
function createCoefficientPacket(basis, quantity, values) {
	return new SpectralPacket({
		basis,
		quantity,
		units: SPECTRAL_UNITS.INVERSE_LENGTH,
		values,
		provenanceIdentity: `canonical-atmosphere-test:${quantity}`,
	});
}

/**
 * Called by this module to create constants.
 * @returns - The result produced by the operation.
 */
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

/** Return the expected native-basis Rayleigh coefficients at one density. */
function expectedRayleighScattering(density = 1) {
	return NATIVE_15_SPECTRAL_BASIS.channels.map((channel) => 2 * (channel.center.value / 1000) ** -4 * density);
}

/** Return the expected native-basis Mie extinction coefficients at one density. */
function expectedMieExtinction(density = 1) {
	return NATIVE_15_SPECTRAL_BASIS.channels.map((channel) => 2 * (channel.center.value / 1000) ** -1 * density);
}

/** Return a native-basis zero spectrum. */
function zeroSpectrum() {
	return new Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(0);
}

/**
 * Called by this module to meters.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function meters(value) {
	return {value, units: 'meters'};
}

/**
 * Called by this module to kilometers.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function kilometers(value) {
	return {value, units: 'kilometers'};
}

/**
 * Called by this module to expect spectral close.
 * @param actual - The actual value accepted by the operation.
 * @param expected - The expected value accepted by the operation.
 */
function expectSpectralClose(actual, expected) {
	expect(actual.length).toBe(expected.length);

	for (let index = 0; index < actual.length; index += 1) {
		expect(actual[index]).withContext(`channel ${index}`).toBeCloseTo(expected[index], 12);
	}
}

/**
 * Called by this module to expect spectral packet close.
 * @param actual - The actual value accepted by the operation.
 * @param quantity - The quantity value accepted by the operation.
 * @param units - The units value accepted by the operation.
 * @param expected - The expected value accepted by the operation.
 */
function expectSpectralPacketClose(actual, quantity, units, expected) {
	expect(actual.quantity).toBe(quantity);
	expect(actual.units).toBe(units);
	expect(actual.basis.channelCount).toBe(expected.length);
	expect(actual.provenanceIdentity).toMatch(/^canonical-atmosphere:/);
	expectSpectralClose(actual.values, expected);
}

/**
 * Called by this module to mie phase function.
 * @param mieAsymmetryParameter - The Mie asymmetry parameter accepted by the operation.
 * @param phaseDirectionCosine - The phase direction cosine accepted by the operation.
 * @returns - The result produced by the operation.
 */
function miePhaseFunction(mieAsymmetryParameter, phaseDirectionCosine) {
	const phaseNormalizationFactor =
		(3 / (8 * Math.PI)) *
		((1 - mieAsymmetryParameter * mieAsymmetryParameter) / (2 + mieAsymmetryParameter * mieAsymmetryParameter));
	const denominator = Math.max(
		1 + mieAsymmetryParameter * mieAsymmetryParameter - 2 * mieAsymmetryParameter * phaseDirectionCosine,
		Number.EPSILON,
	);

	return (phaseNormalizationFactor * (1 + phaseDirectionCosine * phaseDirectionCosine)) / denominator ** 1.5;
}
