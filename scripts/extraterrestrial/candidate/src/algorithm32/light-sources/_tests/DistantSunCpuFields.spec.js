import {
	createDistantSunCpuCumulativeScatteringDensityField,
	createDistantSunCpuPureRadianceField,
	createDistantSunCpuPureScatteringDensityField,
} from '../DistantSunCpuFields.js';
import {
	DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY,
} from '../consts.js';

describe('distant-Sun binary64 CPU fields', () => {
	it('creates pure Fibonacci-34 radiance storage with its physical identities', () => {
		const field = createDistantSunCpuPureRadianceField({
			id: 'test-distant-l1',
			order: 1,
		});

		expect(field.descriptor.quantity).toBe('spectral-radiance-density');
		expect(field.descriptor.directionRole).toBe('incoming-radiance');
		expect(field.descriptor.directionDomain.count).toBe(34);
		expect(field.descriptor.order).toEqual({ kind: 'pure', value: 1 });
		expect(field.descriptor.precision).toBe('binary64');
		expect(field.scalarCount).toBe(24480);
		expect(field.descriptor.layout.storage).toEqual({
			value: 195840,
			units: 'bytes',
		});
		expect(field.descriptor.provenanceIdentity)
			.toBe(DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY,
		);
	});

	it('creates distinct pure and cumulative W27 scattering-density fields', () => {
		const pure = createDistantSunCpuPureScatteringDensityField({
			id: 'test-distant-j2',
			order: 2,
		});
		const cumulative = createDistantSunCpuCumulativeScatteringDensityField({
			id: 'test-distant-j-through-4',
			cumulativeThroughOrder: 4,
		});

		expect(pure.descriptor.quantity).toBe('spectral-scattering-density');
		expect(pure.descriptor.directionRole).toBe('outgoing-scattering-density');
		expect(pure.descriptor.directionDomain.count).toBe(4374);
		expect(pure.descriptor.order).toEqual({ kind: 'pure', value: 2 });
		expect(cumulative.descriptor.order).toEqual({
			kind: 'cumulative-through',
			value: 4,
			included: [1, 2, 3, 4],
		});
		expect(pure.scalarCount).toBe(3149280);
		expect(cumulative.scalarCount).toBe(3149280);
		expect(pure.descriptor.layout.contentHash)
			.toBe(cumulative.descriptor.layout.contentHash,
		);
		expect(pure.descriptor.contentHash).not.toBe(cumulative.descriptor.contentHash);
	});

	it('retains explicitly supplied provenance metadata', () => {
		const custom = createDistantSunCpuPureRadianceField({
			id: 'test-custom-provenance',
			order: 1,
			provenanceIdentity: 'test-provenance-v1',
		});

		expect(custom.descriptor.provenanceIdentity).toBe('test-provenance-v1');
	});

	it('allows internal cumulative-through-3 storage without making N=3 publishable', () => {
		const internal = createDistantSunCpuCumulativeScatteringDensityField({
			id: 'test-internal-j-through-3',
			cumulativeThroughOrder: 3,
		});

		expect(internal.descriptor.order).toEqual({
			kind: 'cumulative-through',
			value: 3,
			included: [1, 2, 3],
		});
	});
});
