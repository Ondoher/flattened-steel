import { PositionDomainDescriptor } from '../PositionDomainDescriptor.js';

describe('PositionDomainDescriptor', () => {
	it('copies owner-canonical coordinates and derives stable content identity', () => {
		const first = createDomain([
			{ value: 2, units: 'meters' },
			{ value: 1875, units: 'meters' },
		]);
		const second = createDomain([
			{ value: 2, units: 'meters' },
			{ value: 1875, units: 'meters' },
		]);

		expect(first.nodes.map((node) => node.coordinate)).toEqual([
			{ value: 2, units: 'meters' },
			{ value: 1875, units: 'meters' },
		]);
		expect(first.contentHash).toBe(second.contentHash);
		expect(first.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/u);
	});

	it('owns copied identity data independently of caller mutation', () => {
		const mapping = {
			kind: 'test-mapping',
			facts: { label: 'original' },
		};
		const coordinate = { value: 2, units: /** @type {const} */ ('meters') };
		const descriptor = createDomain([
			coordinate,
		], { mapping });

		mapping.facts.label = 'mutated';
		coordinate.value = 3;
		expect(descriptor.mapping.facts.label).toBe('original');
		expect(descriptor.nodes[0].coordinate).toEqual({ value: 2, units: 'meters' });
	});

	it('preserves owner-supplied coordinate units without conversion', () => {
		const descriptor = createDomain([
			{ value: 0.002, units: 'kilometers' },
		]);

		expect(descriptor.nodes[0].coordinate).toEqual({
			value: 0.002,
			units: 'kilometers',
		});
	});

	it('changes identity when physical node data changes', () => {
		const first = createDomain([
			{ value: 2, units: 'meters' },
			{ value: 1875, units: 'meters' },
		]);
		const second = createDomain([
			{ value: 2, units: 'meters' },
			{ value: 1876, units: 'meters' },
		]);

		expect(first.contentHash).not.toBe(second.contentHash);
	});

});

function createDomain(coordinates, overrides = {}) {
	return new PositionDomainDescriptor({
		id: 'test-position-domain',
		schemaRevision: 'test-schema-v1',
		generatorRevision: 'test-generator-v1',
		mapping: { kind: 'test-mapping' },
		frame: { kind: 'test-frame' },
		interpolation: { kind: 'test-interpolation' },
		precision: 'binary64',
		nodes: coordinates.map((coordinate, index) => ({
			index,
			coordinate,
			role: index === 0 ? 'boundary' : 'interior',
			metadata: { sourceIndex: index },
		})),
		...overrides,
	});
}
