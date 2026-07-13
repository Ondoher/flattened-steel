import {
	assertSpectralPacket,
	createSpectralPacket,
} from '../spectral-packets.js';
import { createSpectralBasis } from '../spectralBases.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
} from '../spectral-packet-contract.js';
import {
	addSpectralPackets,
	divideSpectralPackets,
	mapSpectralPacket,
	multiplySpectralPackets,
	oneSpectralPacket,
	scaleSpectralPacket,
	zeroSpectralPacket,
} from '../SpectralMath.js';

function createBasis(id = 'packet-basis', width = 20) {
	return createSpectralBasis({
		id,
		channels: [
			{
				id: 'a',
				center: { value: 400, units: 'nanometers' },
				width: { value: width, units: 'nanometers' },
			},
			{
				id: 'b',
				center: { value: 400 + width, units: 'nanometers' },
				width: { value: width, units: 'nanometers' },
			},
		],
	});
}

function packet({
	basis = createBasis(),
	quantity = SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
	units = SPECTRAL_UNITS.RADIANCE_DENSITY,
	values = [2, 4],
	provenanceIdentity = 'test-source-v1',
} = {}) {
	return createSpectralPacket({
		basis,
		quantity,
		units,
		values,
		provenanceIdentity,
	});
}

describe('SpectralPacket', () => {
	it('owns typed values, normalized units, basis identity, semantics, and provenance', () => {
		const values = [2, 4];
		const created = packet({ units: 'W.m^-2.sr^-1.nm^-1', values });

		values[0] = 99;

		expect(created.values).toEqual([2, 4]);
		expect(created.units).toBe(SPECTRAL_UNITS.RADIANCE_DENSITY);
		expect(created.basisHash).toBe(created.basis.contentHash);
		expect(created.semantics).toBe(created.basis.semantics);
		expect(created.provenanceIdentity).toBe('test-source-v1');
		expect(created.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
		expect(Object.isFrozen(created.values)).toBeFalse();
		expect(assertSpectralPacket(created)).toBe(created);
	});

	it('includes provenance in immutable packet identity', () => {
		const first = packet({ provenanceIdentity: 'source-a' });
		const second = packet({ provenanceIdentity: 'source-b' });

		expect(second.contentHash).not.toBe(first.contentHash);
	});

	it('defaults omitted semantics but rejects explicit null', () => {
		const basis = createBasis();
		const common = {
			basis,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			values: [1, 2],
			provenanceIdentity: 'source',
		};

		expect(createSpectralPacket(common).semantics).toBe(basis.semantics);
		expect(() => createSpectralPacket({ ...common, semantics: null }))
			.toThrowError(/semantics/);
	});

	it('adds only compatible packets and retains a typed result', () => {
		const left = packet({ values: [1, 2], provenanceIdentity: 'left' });
		const right = packet({ values: [3, 4], provenanceIdentity: 'right' });
		const sum = addSpectralPackets(left, right);

		expect(sum.values).toEqual([4, 6]);
		expect(sum.quantity).toBe(SPECTRAL_QUANTITIES.RADIANCE_DENSITY);
		expect(sum.units).toBe(SPECTRAL_UNITS.RADIANCE_DENSITY);
		expect(sum.provenanceIdentity).toMatch(/^derived:add:sha256:/);
		expect(scaleSpectralPacket(sum, 0.5).values).toEqual([2, 3]);
	});

	it('defaults only absent factory semantics and rejects explicit null', () => {
		const basis = createBasis();
		const definition = {
			basis,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			provenanceIdentity: 'factory-source',
		};

		expect(zeroSpectralPacket(definition).semantics).toBe(basis.semantics);
		expect(oneSpectralPacket(definition).semantics).toBe(basis.semantics);
		expect(() => zeroSpectralPacket({ ...definition, semantics: null }))
			.toThrowError(/semantics/);
		expect(() => oneSpectralPacket({ ...definition, semantics: null }))
			.toThrowError(/semantics/);
	});

	it('rejects invalid supplied provenance instead of deriving over it', () => {
		const left = packet({ provenanceIdentity: 'left' });
		const right = packet({ provenanceIdentity: 'right' });
		const result = {
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			provenanceIdentity: null,
		};

		expect(() => scaleSpectralPacket(left, 2, { provenanceIdentity: null }))
			.toThrowError(/provenanceIdentity/);
		expect(() => addSpectralPackets(left, right, { provenanceIdentity: null }))
			.toThrowError(/provenanceIdentity/);
		expect(() => multiplySpectralPackets(left, right, result))
			.toThrowError(/provenanceIdentity/);
		expect(() => divideSpectralPackets(left, right, result))
			.toThrowError(/provenanceIdentity/);
		expect(() => mapSpectralPacket(left, (value) => value, { provenanceIdentity: null }))
			.toThrowError(/provenanceIdentity/);
	});

	it('rejects non-object supplied operation options and mapping results', () => {
		const source = packet();

		expect(() => scaleSpectralPacket(source, 2, 'invalid')).toThrowError(/options/);
		expect(() => addSpectralPackets(source, source, null)).toThrowError(/options/);
		expect(() => mapSpectralPacket(source, (value) => value, 'invalid'))
			.toThrowError(/result/);
	});

	it('rejects addition across a basis or quantity boundary', () => {
		const radiance = packet();
		const otherBasis = packet({ basis: createBasis('other-basis') });
		const irradiance = packet({
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		});

		expect(() => addSpectralPackets(radiance, otherBasis)).toThrowError(/bases are incompatible/);
		expect(() => addSpectralPackets(radiance, irradiance)).toThrowError(/quantities/);
	});

	it('carries a BRDF as its own inverse-solid-angle quantity', () => {
		const basis = createBasis('brdf-basis');
		const brdf = createSpectralPacket({
			basis,
			quantity: SPECTRAL_QUANTITIES.BRDF,
			units: SPECTRAL_UNITS.INVERSE_SOLID_ANGLE,
			values: [0.1, 0.2],
			provenanceIdentity: 'test-brdf-v1',
		});

		expect(brdf.quantity).toBe('spectral-brdf');
		expect(brdf.units).toBe('sr^-1');
		expect(brdf.basis).toBe(basis);
		expect(() => createSpectralPacket({
			basis,
			quantity: SPECTRAL_QUANTITIES.BRDF,
			units: SPECTRAL_UNITS.DIMENSIONLESS,
			values: [0.1, 0.2],
			provenanceIdentity: 'invalid-test-brdf-v1',
		})).toThrowError(/requires units sr\^-1/u);
	});

	it('requires multiplication to declare its result quantity and units', () => {
		const radiance = packet({ values: [2, 4] });
		const coefficient = packet({
			quantity: SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
			units: SPECTRAL_UNITS.INVERSE_LENGTH,
			values: [0.5, 0.25],
		});

		expect(() => multiplySpectralPackets(radiance, coefficient))
			.toThrowError(/result quantity/);

		const density = multiplySpectralPackets(radiance, coefficient, {
			quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
			units: SPECTRAL_UNITS.SCATTERING_DENSITY,
		});

		expect(density.values).toEqual([1, 1]);
		expect(density.quantity).toBe(SPECTRAL_QUANTITIES.SCATTERING_DENSITY);
		expect(density.units).toBe(SPECTRAL_UNITS.SCATTERING_DENSITY);
	});

	it('rejects missing units, incorrect units, missing provenance, and invalid channel data', () => {
		const basis = createBasis();
		const common = {
			basis,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			values: [1, 2],
			provenanceIdentity: 'source',
		};

		expect(() => createSpectralPacket(common)).toThrowError(/units/);
		expect(() => createSpectralPacket({ ...common, units: SPECTRAL_UNITS.IRRADIANCE_DENSITY }))
			.toThrowError(/requires units/);
		expect(() => createSpectralPacket({
			...common,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			provenanceIdentity: undefined,
		})).toThrowError(/provenanceIdentity/);
		expect(() => createSpectralPacket({
			...common,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			values: [1],
		})).toThrowError(/exactly 2 channels/);
		expect(() => createSpectralPacket({
			...common,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			values: [1, Number.NaN],
		})).toThrowError(/finite/);
	});
});
