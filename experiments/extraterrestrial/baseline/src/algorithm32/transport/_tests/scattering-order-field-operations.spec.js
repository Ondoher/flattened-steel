import { CpuDirectionalSpectralField } from '../../caches/CpuDirectionalSpectralField.js';
import {
	DIRECTIONAL_FIELD_QUANTITIES,
	DIRECTIONAL_FIELD_UNITS,
	DIRECTION_DOMAIN_ROLES,
	createDirectionalSpectralFieldDescriptor,
} from '../../caches/DirectionalSpectralFieldDescriptor.js';
import { DirectionDomainDescriptor } from '../../domains/DirectionDomainDescriptor.js';
import { PositionDomainDescriptor } from '../../domains/PositionDomainDescriptor.js';
import { DistantSunFieldPacking } from
	'../../light-sources/DistantSunFieldPacking.js';
import { createSpectralBasis } from '../../quantities/spectralBases.js';
import {
	accumulatePureScatteringFields,
	buildNextScatteringOrder,
} from '../scattering-order-field-operations.js';

describe('scattering-order field operations', () => {
	it('builds and seals the next pure order through reader/writer capabilities', () => {
		const context = createContext();
		const previous = createField(context, {
			id: 'previous-radiance-j1',
			kind: 'radiance',
			order: { kind: 'pure', value: 1 },
		});
		writeAndSeal(previous, [1, 2, 3, 4]);
		const output = createField(context, {
			id: 'output-scattering-j2',
			kind: 'scattering',
			order: { kind: 'pure', value: 2 },
		});
		output.createWriter().fill(99);
		let kernelRequest;
		const result = buildNextScatteringOrder({
			previousRadiance: previous,
			outputScattering: output,
			kernel: {
				buildPureScatteringOrder(request) {
					kernelRequest = request;
					request.outputScattering.writeScalarAtOffset(
						0,
						request.previousRadiance.readScalarAtOffset(0) * 2,
					);
					request.outputScattering.writeScalarAtOffset(
						output.scalarCount - 1,
						request.previousRadiance.readScalarAtOffset(
							previous.scalarCount - 1,
						) * 3,
					);
				},
			},
		});

		expect(result).toBe(output);
		expect(output.isSealed).toBeTrue();
		expect(() => kernelRequest.outputScattering.writeScalarAtOffset(0, 9))
			.toThrowError(/no longer active/u);
		expect(output.scalarCount).toBe(6);
		expect(readValues(output)).toEqual([2, 0, 0, 0, 0, 12]);
	});

	it('zeros a mutable scattering target when its kernel fails', () => {
		const context = createContext();
		const previous = createField(context, {
			id: 'failure-previous-radiance',
			kind: 'radiance',
			order: { kind: 'pure', value: 1 },
		});
		writeAndSeal(previous, [1, 2, 3, 4]);
		const output = createField(context, {
			id: 'failure-output-scattering',
			kind: 'scattering',
			order: { kind: 'pure', value: 2 },
		});
		output.createWriter().fill(7);

		expect(() => buildNextScatteringOrder({
			previousRadiance: previous,
			outputScattering: output,
			kernel: {
				buildPureScatteringOrder({ outputScattering }) {
					outputScattering.writeScalarAtOffset(1, 100);
					throw new Error('manufactured kernel failure');
				},
			},
		})).toThrowError(/manufactured kernel failure/u);
		expect(output.isSealed).toBeFalse();
		output.seal();
		expect(readValues(output)).toEqual(Array(6).fill(0));
	});

	it('revokes asynchronous kernels and leaves their target mutable and zeroed', async () => {
		const context = createContext();
		const previous = createField(context, {
			id: 'async-previous-radiance',
			kind: 'radiance',
			order: { kind: 'pure', value: 1 },
		});
		writeAndSeal(previous, [1, 2, 3, 4]);
		const output = createField(context, {
			id: 'async-output-scattering',
			kind: 'scattering',
			order: { kind: 'pure', value: 2 },
		});
		output.createWriter().fill(7);
		let lateWriteFailure;

		expect(() => buildNextScatteringOrder({
			previousRadiance: previous,
			outputScattering: output,
			kernel: {
				buildPureScatteringOrder({ outputScattering }) {
					return Promise.resolve().then(() => {
						try {
							outputScattering.writeScalarAtOffset(0, 42);
						} catch (error) {
							lateWriteFailure = error;
						}
					});
				},
			},
		})).toThrowError(/complete synchronously/u);
		expect(output.isSealed).toBeFalse();
		await Promise.resolve();
		expect(lateWriteFailure).toEqual(jasmine.any(Error));
		expect(lateWriteFailure.message).toMatch(/no longer active/u);
		output.seal();
		expect(readValues(output)).toEqual(Array(6).fill(0));
	});

	it('rejects aliased recurrence fields', () => {
		const context = createContext();
		const aliased = createField(context, {
			id: 'aliased-radiance-field',
			kind: 'radiance',
			order: { kind: 'pure', value: 1 },
		});
		expect(() => buildNextScatteringOrder({
			previousRadiance: aliased,
			outputScattering: aliased,
			kernel: emptyKernel(),
		})).toThrowError(/must not alias/u);
	});

	it('rejects an unsealed previous field', () => {
		const context = createContext();
		const unsealed = createField(context, {
			id: 'unsealed-radiance',
			kind: 'radiance',
			order: { kind: 'pure', value: 1 },
		});
		const output = createField(context, {
			id: 'unsealed-output',
			kind: 'scattering',
			order: { kind: 'pure', value: 2 },
		});
		expect(() => buildNextScatteringOrder({
			previousRadiance: unsealed,
			outputScattering: output,
			kernel: emptyKernel(),
		})).toThrowError(/must be sealed/u);
	});

	it('sums sealed contiguous pure orders and seals the cumulative target', () => {
		const context = createContext();
		const first = scatteringField(context, 'pure-j1', { kind: 'pure', value: 1 });
		const second = scatteringField(context, 'pure-j2', { kind: 'pure', value: 2 });
		writeAndSeal(first, [1, 2, 3, 4, 5, 6]);
		writeAndSeal(second, [0.5, 1, 1.5, 2, 2.5, 3]);
		const cumulative = scatteringField(
			context,
			'cumulative-through-j2',
			{ kind: 'cumulative-through', value: 2 },
		);
		cumulative.createWriter().fill(99);

		expect(accumulatePureScatteringFields({
			pureFields: [first, second],
			cumulativeField: cumulative,
			packing: context.scatteringPacking,
		})).toBe(cumulative);
		expect(cumulative.isSealed).toBeTrue();
		expect(readValues(cumulative)).toEqual([1.5, 3, 4.5, 6, 7.5, 9]);
		expect(readValues(first)).toEqual([1, 2, 3, 4, 5, 6]);
		expect(readValues(second)).toEqual([0.5, 1, 1.5, 2, 2.5, 3]);
	});

	it('rejects unsealed or aliased pure inputs', () => {
		const context = createContext();
		const unsealed = scatteringField(context, 'unsealed-j1', { kind: 'pure', value: 1 });
		const secondTarget = scatteringField(
			context,
			'unsealed-target',
			{ kind: 'cumulative-through', value: 1 },
		);
		expect(() => accumulatePureScatteringFields({
			pureFields: [unsealed],
			cumulativeField: secondTarget,
			packing: context.scatteringPacking,
		})).toThrowError(/must be sealed/u);

		const aliasedTarget = scatteringField(
			context,
			'aliased-target',
			{ kind: 'cumulative-through', value: 1 },
		);
		expect(() => accumulatePureScatteringFields({
			pureFields: [aliasedTarget],
			cumulativeField: aliasedTarget,
			packing: context.scatteringPacking,
		})).toThrowError(/must not alias/u);
	});

	it('rejects duplicate inputs at the pure-order seam', () => {
		const context = createContext();
		const first = scatteringField(context, 'duplicate-j1', { kind: 'pure', value: 1 });
		writeAndSeal(first, Array(6).fill(1));
		const duplicateTarget = scatteringField(
			context,
			'duplicate-target',
			{ kind: 'cumulative-through', value: 2 },
		);
		expect(() => accumulatePureScatteringFields({
			pureFields: [first, first],
			cumulativeField: duplicateTarget,
			packing: context.scatteringPacking,
		})).toThrowError(/must not alias each other/u);
	});

	it('rejects a non-finite accumulated scalar and restores every target scalar', () => {
		const context = createContext();
		const first = scatteringField(context, 'overflow-j1', { kind: 'pure', value: 1 });
		const second = scatteringField(context, 'overflow-j2', { kind: 'pure', value: 2 });
		writeAndSeal(first, Array(6).fill(Number.MAX_VALUE));
		writeAndSeal(second, Array(6).fill(Number.MAX_VALUE));
		const target = scatteringField(
			context,
			'overflow-target',
			{ kind: 'cumulative-through', value: 2 },
		);
		target.createWriter().fill(4);

		expect(() => accumulatePureScatteringFields({
			pureFields: [first, second],
			cumulativeField: target,
			packing: context.scatteringPacking,
		})).toThrowError(/must remain finite/u);
		expect(target.isSealed).toBeFalse();
		target.seal();
		expect(readValues(target)).toEqual(Array(6).fill(0));
	});
});

function emptyKernel() {
	return {
		buildPureScatteringOrder() {},
	};
}

function scatteringField(context, id, order) {
	return createField(context, { id, kind: 'scattering', order });
}

function createField(context, { id, kind, order }) {
	const radiance = kind === 'radiance';
	const packing = radiance ? context.radiancePacking : context.scatteringPacking;
	const descriptor = createDirectionalSpectralFieldDescriptor({
		id,
		quantity: radiance
			? DIRECTIONAL_FIELD_QUANTITIES.RADIANCE_DENSITY
			: DIRECTIONAL_FIELD_QUANTITIES.SCATTERING_DENSITY,
		units: radiance
			? DIRECTIONAL_FIELD_UNITS.RADIANCE_DENSITY
			: DIRECTIONAL_FIELD_UNITS.SCATTERING_DENSITY,
		directionRole: radiance
			? DIRECTION_DOMAIN_ROLES.INCOMING_RADIANCE
			: DIRECTION_DOMAIN_ROLES.OUTGOING_SCATTERING_DENSITY,
		basis: context.basis,
		positionDomain: context.positionDomain,
		directionDomain: radiance
			? context.radianceDirectionDomain
			: context.scatteringDirectionDomain,
		precision: 'binary64',
		layout: packing.layout,
		order,
		provenanceIdentity: `manufactured:${id}`,
	});

	return new CpuDirectionalSpectralField({ descriptor, packing });
}

function createContext({
	identitySuffix = 'base',
	radianceIntegrationWeights = {
		values: [2 * Math.PI, 2 * Math.PI],
		units: 'steradians',
	},
} = {}) {
	const basis = createSpectralBasis({
		id: `manufactured-basis-${identitySuffix}`,
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
	const positionDomain = new PositionDomainDescriptor({
		id: `manufactured-position-${identitySuffix}`,
		schemaRevision: 'manufactured-position-schema-v1',
		generatorRevision: 'manufactured-position-generator-v1',
		mapping: { kind: 'manufactured-position-mapping' },
		frame: { kind: 'manufactured-position-frame' },
		interpolation: { kind: 'manufactured-position-interpolation' },
		precision: 'binary64',
		nodes: [{
			index: 0,
			coordinate: { value: 2, units: 'meters' },
			role: 'manufactured-node',
		}],
	});
	const radianceDirectionDomain = createDirectionDomain(
		`manufactured-radiance-direction-${identitySuffix}`,
		[[1, 0, 0], [0, 1, 0]],
		radianceIntegrationWeights,
	);
	const scatteringDirectionDomain = createDirectionDomain(
		`manufactured-scattering-direction-${identitySuffix}`,
		[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
		null,
	);
	const radiancePacking = new DistantSunFieldPacking({
		id: `manufactured-radiance-packing-${identitySuffix}`,
		directionCount: 2,
		positionCount: 1,
		wavelengthCount: 2,
	});
	const scatteringPacking = new DistantSunFieldPacking({
		id: `manufactured-scattering-packing-${identitySuffix}`,
		directionCount: 3,
		positionCount: 1,
		wavelengthCount: 2,
	});

	return {
		basis,
		positionDomain,
		radianceDirectionDomain,
		scatteringDirectionDomain,
		radiancePacking,
		scatteringPacking,
	};
}

function createDirectionDomain(id, unitVectors, integrationWeights) {
	return new DirectionDomainDescriptor({
		id,
		schemaRevision: 'manufactured-direction-schema-v1',
		generatorRevision: 'manufactured-direction-generator-v1',
		frame: { kind: 'manufactured-direction-frame' },
		topology: { kind: 'manufactured-direction-topology' },
		interpolation: { kind: 'manufactured-direction-interpolation' },
		precision: 'binary64',
		unitVectors,
		integrationWeights,
	});
}

function writeAndSeal(field, values) {
	if (values.length !== field.scalarCount) {
		throw new Error('manufactured values must match the field scalar count.');
	}

	const writer = field.createWriter();
	values.forEach((value, offset) => writer.writeScalarAtOffset(offset, value));
	field.seal();
	return field;
}

function readValues(field) {
	const reader = field.createReader();
	return Array.from(
		{ length: field.scalarCount },
		(_unused, offset) => reader.readScalarAtOffset(offset),
	);
}
