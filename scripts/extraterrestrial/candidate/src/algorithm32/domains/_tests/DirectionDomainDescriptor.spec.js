import { DirectionDomainDescriptor } from '../DirectionDomainDescriptor.js';

describe('DirectionDomainDescriptor', () => {
	it('retains explicit unit vectors and solid-angle weights', () => {
		const descriptor = createDomain();

		expect(descriptor.count).toBe(2);
		expect(descriptor.unitVectors).toEqual([
			[1, 0, 0],
			[0, 1, 0],
		]);
		expect(descriptor.integrationWeights).toEqual({
			values: [2 * Math.PI, 2 * Math.PI],
			units: 'steradians',
		});
		expect(descriptor.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/u);
	});

	it('copies vectors, weights, and identity data independently', () => {
		const vectors = [[1, 0, 0], [0, 1, 0]];
		const weights = {
			values: [2 * Math.PI, 2 * Math.PI],
			units: 'steradians',
		};
		const descriptor = createDomain({ unitVectors: vectors, integrationWeights: weights });

		vectors[0][0] = 0;
		weights.values[0] = 1;
		expect(descriptor.unitVectors[0]).toEqual([1, 0, 0]);
		expect(descriptor.integrationWeights.values[0]).toBe(2 * Math.PI);
	});

	it('hashes direction ordering, weights, precision, and topology', () => {
		const baseline = createDomain();
		const changedWeights = createDomain({
			integrationWeights: {
				values: [Math.PI, 3 * Math.PI],
				units: 'steradians',
			},
		});
		const changedOrder = createDomain({
			unitVectors: [[0, 1, 0], [1, 0, 0]],
		});
		const changedPrecision = createDomain({ precision: 'binary32' });
		const changedTopology = createDomain({ topology: { kind: 'changed' } });

		expect(changedWeights.contentHash).not.toBe(baseline.contentHash);
		expect(changedOrder.contentHash).not.toBe(baseline.contentHash);
		expect(changedPrecision.contentHash).not.toBe(baseline.contentHash);
		expect(changedTopology.contentHash).not.toBe(baseline.contentHash);
		expect(createDomain().contentHash).toBe(baseline.contentHash);
	});

	it('allows a reconstruction domain without integration weights', () => {
		const descriptor = createDomain({ integrationWeights: null });

		expect(descriptor.integrationWeights).toBeNull();
	});

});

function createDomain(overrides = {}) {
	return new DirectionDomainDescriptor({
		id: 'test-direction-domain',
		schemaRevision: 'test-schema-v1',
		generatorRevision: 'test-generator-v1',
		frame: { kind: 'test-frame' },
		topology: { kind: 'test-topology' },
		interpolation: { kind: 'test-interpolation' },
		precision: 'binary64',
		unitVectors: [[1, 0, 0], [0, 1, 0]],
		integrationWeights: {
			values: [2 * Math.PI, 2 * Math.PI],
			units: 'steradians',
		},
		...overrides,
	});
}
