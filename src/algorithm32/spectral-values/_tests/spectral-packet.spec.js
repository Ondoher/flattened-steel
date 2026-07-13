import {SpectralBasis} from '../SpectralBasis.js';
import {SpectralMath} from '../SpectralMath.js';
import {SpectralPacket} from '../SpectralPacket.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS} from '../consts.js';

/**
 * Called by this module to create basis.
 * @param id - The id value accepted by the operation.
 * @param width - The width value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createBasis(id = 'packet-basis', width = 20) {
	return new SpectralBasis({
		id,
		channels: [
			{
				id: 'a',
				center: {value: 400, units: 'nanometers'},
				width: {value: width, units: 'nanometers'},
			},
			{
				id: 'b',
				center: {value: 400 + width, units: 'nanometers'},
				width: {value: width, units: 'nanometers'},
			},
		],
	});
}

/**
 * Called by this module to packet.
 * @param input1 - The destructured input accepted by the operation.
 * @returns - The result produced by the operation.
 */
function packet({
	basis = createBasis(),
	quantity = SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
	units = SPECTRAL_UNITS.RADIANCE_DENSITY,
	values = [2, 4],
	provenanceIdentity = 'test-source-v1',
} = {}) {
	return new SpectralPacket({
		basis,
		quantity,
		units,
		values,
		provenanceIdentity,
	});
}

describe('SpectralPacket', /** Called by Jasmine to register the named test suite. */ () => {
	it('exposes the complete spectral-math method set through one namespace', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(Object.keys(SpectralMath).sort()).toEqual([
			'acceptMappingResult',
			'acceptOperationOptions',
			'addSpectralPackets',
			'assertResultInterpretation',
			'derivedProvenanceIdentity',
			'divideSpectralPackets',
			'mapSpectralPacket',
			'multiplySpectralPackets',
			'oneSpectralPacket',
			'resolveProvenanceIdentity',
			'scaleSpectralPacket',
			'zeroSpectralPacket',
		]);
	});

	it('owns typed values, normalized units, basis identity, semantics, and provenance', /** Called by Jasmine to exercise the named behavior. */ () => {
		const values = [2, 4];
		const created = packet({units: 'W.m^-2.sr^-1.nm^-1', values});
		const equivalent = packet({units: 'W·m^-2·sr^-1·nm^-1'});

		values[0] = 99;

		expect(equivalent).not.toBe(created);
		expect(created.values).toEqual([2, 4]);
		expect(created.units).toBe(SPECTRAL_UNITS.RADIANCE_DENSITY);
		expect(SpectralPacket.normalizeUnits('W·m^-2·sr^-1·nm^-1')).toBe(SPECTRAL_UNITS.RADIANCE_DENSITY);
		expect(created.basisHash).toBe(created.basis.contentHash);
		expect(created.semantics).toBe(created.basis.semantics);
		expect(created.provenanceIdentity).toBe('test-source-v1');
		expect(created.contentHash).toBe('sha256:58d8a9f2d07a60e99df8346c251f099468577b1b8f813ae2948344e61f357390');
		expect(equivalent.contentHash).toBe(created.contentHash);
		expect(Object.isFrozen(created.values)).toBeFalse();
		expect(SpectralPacket.assert(created)).toBe(created);
		expect(SpectralPacket.assertCompatible(created, equivalent, {sameQuantity: true, sameUnits: true})).toEqual([
			created,
			equivalent,
		]);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralPacket.assert({}),
		).toThrowError('Expected a SpectralPacket.');
	});

	it('includes provenance in immutable packet identity', /** Called by Jasmine to exercise the named behavior. */ () => {
		const first = packet({provenanceIdentity: 'source-a'});
		const second = packet({provenanceIdentity: 'source-b'});

		expect(second.contentHash).not.toBe(first.contentHash);
	});

	it('defaults omitted semantics but rejects explicit null', /** Called by Jasmine to exercise the named behavior. */ () => {
		const basis = createBasis();
		const common = {
			basis,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			values: [1, 2],
			provenanceIdentity: 'source',
		};

		expect(new SpectralPacket(common).semantics).toBe(basis.semantics);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => new SpectralPacket({...common, semantics: null}),
		).toThrowError(/semantics/);
	});

	it('adds only compatible packets and retains a typed result', /** Called by Jasmine to exercise the named behavior. */ () => {
		const left = packet({values: [1, 2], provenanceIdentity: 'left'});
		const right = packet({values: [3, 4], provenanceIdentity: 'right'});
		const sum = SpectralMath.addSpectralPackets(left, right);

		expect(sum.values).toEqual([4, 6]);
		expect(sum.quantity).toBe(SPECTRAL_QUANTITIES.RADIANCE_DENSITY);
		expect(sum.units).toBe(SPECTRAL_UNITS.RADIANCE_DENSITY);
		expect(sum.provenanceIdentity).toMatch(/^derived:add:sha256:/);
		expect(SpectralMath.scaleSpectralPacket(sum, 0.5).values).toEqual([2, 3]);
	});

	it('preserves exact packet provenance and content identities across every operation', /** Called by Jasmine to exercise the named behavior. */ () => {
		const basis = createBasis();
		const definition = {
			basis,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			provenanceIdentity: 'factory-source',
		};
		const left = packet({basis, values: [1, 2], provenanceIdentity: 'left'});
		const right = packet({basis, values: [3, 4], provenanceIdentity: 'right'});
		const coefficient = packet({
			basis,
			quantity: SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
			units: SPECTRAL_UNITS.INVERSE_LENGTH,
			values: [0.5, 0.25],
			provenanceIdentity: 'coefficient',
		});
		const zero = SpectralMath.zeroSpectralPacket(definition);
		const unitSpectralPacket = SpectralMath.oneSpectralPacket(definition);
		const sum = SpectralMath.addSpectralPackets(left, right);
		const scaled = SpectralMath.scaleSpectralPacket(sum, 0.5);
		const product = SpectralMath.multiplySpectralPackets(left, coefficient, {
			quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
			units: SPECTRAL_UNITS.SCATTERING_DENSITY,
		});
		const quotient = SpectralMath.divideSpectralPackets(left, right, {
			quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
			units: SPECTRAL_UNITS.DIMENSIONLESS,
		});
		const mapped = SpectralMath.mapSpectralPacket(
			left,
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @param value - The value accepted by the operation.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value, index) => value + index,
		);

		expect(
			Object.fromEntries(
				Object.entries({zero, one: unitSpectralPacket, sum, scaled, product, quotient, mapped}).map(
					/**
					 * Called by Array.prototype.map to transform one collection value.
					 * @param input1 - The destructured input accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ ([key, value]) => [
						key,
						{
							values: value.values,
							provenanceIdentity: value.provenanceIdentity,
							contentHash: value.contentHash,
						},
					],
				),
			),
		).toEqual({
			zero: {
				values: [0, 0],
				provenanceIdentity: 'factory-source',
				contentHash: 'sha256:590a1f1ae883192aef547b0fdc2157d6dab72a945311ce4a283c2a9644079b8c',
			},
			one: {
				values: [1, 1],
				provenanceIdentity: 'factory-source',
				contentHash: 'sha256:c986d4d0a69f2e18e604d1ad77254c3500cc48edbec0b3bdfe043a51077304fb',
			},
			sum: {
				values: [4, 6],
				provenanceIdentity:
					'derived:add:sha256:d321d590c3b59a0cdee9c0a6af10403cefb8c0fc759b07478dd919edf53f6216',
				contentHash: 'sha256:a970235dd5ce49e73ec58804b2a4b42f45237c63f5f13e25a9180fabb2a1522a',
			},
			scaled: {
				values: [2, 3],
				provenanceIdentity:
					'derived:scale:sha256:be78f67bc39fd3bdf032b2e82d1c4e49c9a2fa710149aabe00f0e22142a076a9',
				contentHash: 'sha256:f483d653e44c91d0814d2d71cba6ee560efbf76b172d95ae4b365d70ce8499fe',
			},
			product: {
				values: [0.5, 0.5],
				provenanceIdentity:
					'derived:multiply:sha256:e33e3239c1c06070f7fa05a0b96a44a1733427287600b81cf1daff4eaa167be4',
				contentHash: 'sha256:572bca756fb342c00c757c7e00208ade8767ad26cedb10c9d9b564548d5a5f9c',
			},
			quotient: {
				values: [1 / 3, 0.5],
				provenanceIdentity:
					'derived:divide:sha256:4418a6d06bcc442b5723e77f13196850a37ca4e23041c0379775d4bc0e46b09d',
				contentHash: 'sha256:5b877277f09d6b1aa3a07a3df5190c03e9f5268ce12aef3d48ea7fc7a1c4630a',
			},
			mapped: {
				values: [1, 3],
				provenanceIdentity:
					'derived:map:sha256:181e798ab53526c540a9df0039b17294b5ffd4f773aeadf6a86fcbf224368c1e',
				contentHash: 'sha256:a4ed3cb7755e2445219fcdcdf5cbcc0fbef813170ce1ac9f0c9048e46ffbc08c',
			},
		});
		expect(SpectralMath.zeroSpectralPacket(definition)).not.toBe(zero);
		expect(SpectralMath.oneSpectralPacket(definition)).not.toBe(unitSpectralPacket);
		expect(sum).not.toBe(left);
	});

	it('defaults only absent factory semantics and rejects explicit null', /** Called by Jasmine to exercise the named behavior. */ () => {
		const basis = createBasis();
		const definition = {
			basis,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			provenanceIdentity: 'factory-source',
		};

		expect(SpectralMath.zeroSpectralPacket(definition).semantics).toBe(basis.semantics);
		expect(SpectralMath.oneSpectralPacket(definition).semantics).toBe(basis.semantics);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralMath.zeroSpectralPacket({...definition, semantics: null}),
		).toThrowError(/semantics/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralMath.oneSpectralPacket({...definition, semantics: null}),
		).toThrowError(/semantics/);
	});

	it('rejects invalid supplied provenance instead of deriving over it', /** Called by Jasmine to exercise the named behavior. */ () => {
		const left = packet({provenanceIdentity: 'left'});
		const right = packet({provenanceIdentity: 'right'});
		const result = {
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			provenanceIdentity: null,
		};

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralMath.scaleSpectralPacket(left, 2, {provenanceIdentity: null}),
		).toThrowError(/provenanceIdentity/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralMath.addSpectralPackets(left, right, {provenanceIdentity: null}),
		).toThrowError(/provenanceIdentity/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralMath.multiplySpectralPackets(left, right, result),
		).toThrowError(/provenanceIdentity/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralMath.divideSpectralPackets(left, right, result),
		).toThrowError(/provenanceIdentity/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				SpectralMath.mapSpectralPacket(
					left,
					/**
					 * Called by the surrounding operation to handle one callback invocation.
					 * @param value - The value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (value) => value,
					{provenanceIdentity: null},
				),
		).toThrowError(/provenanceIdentity/);
	});

	it('rejects non-object supplied operation options and mapping results', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = packet();

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralMath.scaleSpectralPacket(source, 2, 'invalid'),
		).toThrowError('Spectral scale options must be an object when supplied.');
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralMath.addSpectralPackets(source, source, null),
		).toThrowError('Spectral addition options must be an object when supplied.');
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				SpectralMath.mapSpectralPacket(
					source,
					/**
					 * Called by the surrounding operation to handle one callback invocation.
					 * @param value - The value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (value) => value,
					'invalid',
				),
		).toThrowError('Spectral mapping result must be an object when supplied.');
	});

	it('rejects addition across a basis or quantity boundary', /** Called by Jasmine to exercise the named behavior. */ () => {
		const radiance = packet();
		const otherBasis = packet({basis: createBasis('other-basis')});
		const irradiance = packet({
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		});

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralMath.addSpectralPackets(radiance, otherBasis),
		).toThrowError(/bases are incompatible/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralMath.addSpectralPackets(radiance, irradiance),
		).toThrowError(/quantities/);
	});

	it('carries a BRDF as its own inverse-solid-angle quantity', /** Called by Jasmine to exercise the named behavior. */ () => {
		const basis = createBasis('brdf-basis');
		const bidirectionalReflectanceValues = new SpectralPacket({
			basis,
			quantity: SPECTRAL_QUANTITIES.BRDF,
			units: SPECTRAL_UNITS.INVERSE_SOLID_ANGLE,
			values: [0.1, 0.2],
			provenanceIdentity: 'test-brdf-v1',
		});

		expect(bidirectionalReflectanceValues.quantity).toBe('spectral-brdf');
		expect(bidirectionalReflectanceValues.units).toBe('sr^-1');
		expect(bidirectionalReflectanceValues.basis).toBe(basis);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new SpectralPacket({
					basis,
					quantity: SPECTRAL_QUANTITIES.BRDF,
					units: SPECTRAL_UNITS.DIMENSIONLESS,
					values: [0.1, 0.2],
					provenanceIdentity: 'invalid-test-brdf-v1',
				}),
		).toThrowError(/requires units sr\^-1/u);
	});

	it('requires multiplication to declare its result quantity and units', /** Called by Jasmine to exercise the named behavior. */ () => {
		const radiance = packet({values: [2, 4]});
		const coefficient = packet({
			quantity: SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
			units: SPECTRAL_UNITS.INVERSE_LENGTH,
			values: [0.5, 0.25],
		});

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralMath.multiplySpectralPackets(radiance, coefficient),
		).toThrowError('Spectral multiplication requires explicit result quantity and units.');

		const density = SpectralMath.multiplySpectralPackets(radiance, coefficient, {
			quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
			units: SPECTRAL_UNITS.SCATTERING_DENSITY,
		});

		expect(density.values).toEqual([1, 1]);
		expect(density.quantity).toBe(SPECTRAL_QUANTITIES.SCATTERING_DENSITY);
		expect(density.units).toBe(SPECTRAL_UNITS.SCATTERING_DENSITY);
	});

	it('rejects missing units, incorrect units, missing provenance, and invalid channel data', /** Called by Jasmine to exercise the named behavior. */ () => {
		const basis = createBasis();
		const common = {
			basis,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			values: [1, 2],
			provenanceIdentity: 'source',
		};

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => new SpectralPacket(common),
		).toThrowError(/units/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => new SpectralPacket({...common, units: SPECTRAL_UNITS.IRRADIANCE_DENSITY}),
		).toThrowError(/requires units/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new SpectralPacket({
					...common,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
					provenanceIdentity: undefined,
				}),
		).toThrowError(/provenanceIdentity/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new SpectralPacket({
					...common,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
					values: [1],
				}),
		).toThrowError(/exactly 2 channels/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new SpectralPacket({
					...common,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
					values: [1, Number.NaN],
				}),
		).toThrowError(/finite/);
	});
});
