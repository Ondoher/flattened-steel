import { DirectionDomainDescriptor } from '../../domains/DirectionDomainDescriptor.js';
import { PositionDomainDescriptor } from '../../domains/PositionDomainDescriptor.js';
import { createDenseScalarArrayLayout } from '../DenseScalarArrayLayout.js';
import {
	DIRECTION_DOMAIN_ROLES,
	DIRECTIONAL_FIELD_QUANTITIES,
	DIRECTIONAL_FIELD_UNITS,
	createDirectionalSpectralFieldDescriptor,
} from '../DirectionalSpectralFieldDescriptor.js';
import { createSpectralBasis } from '../../quantities/spectralBases.js';
import { CpuDirectionalSpectralField } from '../CpuDirectionalSpectralField.js';
import { assertCpuDirectionalSpectralField } from '../cpuDirectionalSpectralFields.js';

describe('CpuDirectionalSpectralField', () => {
	it('owns private binary64 storage through a mutable-then-sealed lifecycle', () => {
		const fixture = createFixture();
		const field = new CpuDirectionalSpectralField(fixture);

		expect(field.descriptor).toBe(fixture.descriptor);
		expect(field.scalarCount).toBe(8);
		expect(field.isSealed).toBeFalse();
		expect(() => field.createReader()).toThrowError(/sealed before reading/u);

		const writer = field.createWriter();
		expect(writer.descriptor).toBe(field.descriptor);
		expect(writer.scalarCount).toBe(field.scalarCount);
		writer.fill(1.5);
		writer.writeScalar({
			directionIndex: 1,
			positionIndex: 0,
			wavelengthIndex: 1,
		}, 7.25);
		writer.writeScalarAtOffset(2, -3.5);

		expect(field.seal()).toBe(field);
		expect(field.seal()).toBe(field);
		expect(field.isSealed).toBeTrue();
		expect(() => field.createWriter()).toThrowError(/sealed/u);
		expect(() => writer.fill(0)).toThrowError(/sealed/u);
		expect(() => writer.writeScalarAtOffset(0, 0)).toThrowError(/sealed/u);
		expect(() => writer.writeScalar({
			directionIndex: 0,
			positionIndex: 0,
			wavelengthIndex: 0,
		}, 0)).toThrowError(/sealed/u);

		const reader = field.createReader();
		expect(reader.descriptor).toBe(field.descriptor);
		expect(reader.scalarCount).toBe(field.scalarCount);
		expect(reader.readScalarAtOffset(0)).toBe(1.5);
		expect(reader.readScalarAtOffset(2)).toBe(-3.5);
		expect(reader.readScalar({
			directionIndex: 1,
			positionIndex: 0,
			wavelengthIndex: 1,
		})).toBe(7.25);
		expect(assertCpuDirectionalSpectralField(field)).toBe(field);
	});

	it('rejects non-finite values and invalid direct or packing offsets', () => {
		const fixture = createFixture();
		const field = new CpuDirectionalSpectralField(fixture);
		const writer = field.createWriter();

		for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
			expect(() => writer.fill(value)).toThrowError(/finite/u);
			expect(() => writer.writeScalarAtOffset(0, value)).toThrowError(/finite/u);
		}

		expect(() => writer.writeScalarAtOffset(0.5, 1)).toThrowError(/integer/u);
		expect(() => writer.writeScalarAtOffset(-1, 1)).toThrowError(/between/u);
		expect(() => writer.writeScalarAtOffset(field.scalarCount, 1)).toThrowError(/between/u);
		expect(() => writer.writeScalar({
			directionIndex: 2,
			positionIndex: 0,
			wavelengthIndex: 0,
		}, 1)).toThrowError(/directionIndex/u);

		field.seal();
		const reader = field.createReader();
		expect(() => reader.readScalarAtOffset(0.5)).toThrowError(/integer/u);
		expect(() => reader.readScalarAtOffset(field.scalarCount)).toThrowError(/between/u);
	});
});

function createFixture() {
	const layout = createDenseScalarArrayLayout({
		id: 'test-cpu-field-layout',
		directionCount: 2,
		positionCount: 2,
		wavelengthCount: 2,
	});

	return {
		descriptor: createFieldDescriptor(layout, 'binary64'),
		packing: createPacking(layout),
	};
}

function createFieldDescriptor(layout, precision) {
	return createDirectionalSpectralFieldDescriptor({
		id: `test-${precision}-field`,
		quantity: DIRECTIONAL_FIELD_QUANTITIES.SCATTERING_DENSITY,
		units: DIRECTIONAL_FIELD_UNITS.SCATTERING_DENSITY,
		directionRole: DIRECTION_DOMAIN_ROLES.OUTGOING_SCATTERING_DENSITY,
		basis: createBasis(),
		positionDomain: createPositionDomain(),
		directionDomain: createDirectionDomain(),
		precision,
		layout,
		order: { kind: 'pure', value: 1 },
		provenanceIdentity: 'test-cpu-field-fixture',
	});
}

function createPacking(layout) {
	const { direction, position, wavelength } = layout.shape;

	return ({
		layout,
		scalarCount: layout.scalarCount,
		offset(request = {}) {
			const directionIndex = checkedIndex(request.directionIndex, direction, 'directionIndex');
			const positionIndex = checkedIndex(request.positionIndex, position, 'positionIndex');
			const wavelengthIndex = checkedIndex(request.wavelengthIndex, wavelength, 'wavelengthIndex');
			return directionIndex + direction * (positionIndex + position * wavelengthIndex);
		},
		coordinatesAt(offset) {
			const checkedOffset = checkedIndex(offset, layout.scalarCount, 'offset');
			const wavelengthStride = direction * position;
			const wavelengthIndex = Math.floor(checkedOffset / wavelengthStride);
			const remainder = checkedOffset - wavelengthIndex * wavelengthStride;
			const positionIndex = Math.floor(remainder / direction);

			return ({
				directionIndex: remainder - positionIndex * direction,
				positionIndex,
				wavelengthIndex,
			});
		},
	});
}

function checkedIndex(value, count, label) {
	if (!Number.isInteger(value) || value < 0 || value >= count) {
		throw new RangeError(`${label} must identify a declared packing coordinate.`);
	}

	return value;
}

function createBasis() {
	return createSpectralBasis({
		id: 'test-cpu-field-basis',
		channels: [
			{
				id: 'first',
				center: { value: 400, units: 'nanometers' },
				width: { value: 20, units: 'nanometers' },
			},
			{
				id: 'second',
				center: { value: 420, units: 'nanometers' },
				width: { value: 20, units: 'nanometers' },
			},
		],
	});
}

function createPositionDomain() {
	return new PositionDomainDescriptor({
		id: 'test-cpu-field-position-domain',
		schemaRevision: 'test-schema-v1',
		generatorRevision: 'test-generator-v1',
		mapping: { kind: 'test-mapping' },
		frame: { kind: 'test-frame' },
		interpolation: { kind: 'test-interpolation' },
		precision: 'binary64',
		nodes: [
			{
				index: 0,
				coordinate: { value: 2, units: 'meters' },
				role: 'boundary',
			},
			{
				index: 1,
				coordinate: { value: 4, units: 'meters' },
				role: 'interior',
			},
		],
	});
}

function createDirectionDomain() {
	return new DirectionDomainDescriptor({
		id: 'test-cpu-field-direction-domain',
		schemaRevision: 'test-schema-v1',
		generatorRevision: 'test-generator-v1',
		frame: { kind: 'test-frame' },
		topology: { kind: 'test-topology' },
		interpolation: { kind: 'test-interpolation' },
		precision: 'binary64',
		unitVectors: [[1, 0, 0], [0, 1, 0]],
		integrationWeights: null,
	});
}
