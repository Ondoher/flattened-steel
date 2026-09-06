import {
	assertCompatibleSpectralBases,
	createSpectralBasis,
} from '../spectralBases.js';
import { SPECTRAL_SAMPLE_SEMANTICS } from '../spectralBasisContract.js';

function channel(id, center, width, units = 'nanometers') {
	return {
		id,
		center: { value: center, units },
		width: { value: width, units },
	};
}

function basis(overrides = {}) {
	return createSpectralBasis({
		id: 'test-basis',
		channels: [
			channel('blue', 0.4, 0.02, 'micrometers'),
			channel('green', 420, 20),
		],
		...overrides,
	});
}

describe('SpectralBasis', () => {
	it('owns ordered channels with unit-bearing center and width data', () => {
		const input = [
			channel('blue', 0.4, 0.02, 'micrometers'),
			channel('green', 420, 20),
		];
		const created = createSpectralBasis({ id: 'test-basis', channels: input });

		input[0].center.value = 999;

		expect(created.channels).toEqual([
			channel('blue', 400, 20),
			channel('green', 420, 20),
		]);
		expect(created.semantics).toBe(SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE);
		expect(created.channelCount).toBe(2);
		expect(created.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/);
	});

	it('gives equivalent normalized definitions the same content identity', () => {
		const first = basis();
		const second = createSpectralBasis({
			id: 'test-basis',
			channels: [channel('blue', 400, 20), channel('green', 0.42, 0.02, 'micrometers')],
		});
		const changed = basis({
			channels: [channel('blue', 400, 22), channel('green', 422, 22)],
		});

		expect(second.contentHash).toBe(first.contentHash);
		expect(changed.contentHash).not.toBe(first.contentHash);
		expect(() => assertCompatibleSpectralBases(first, second)).not.toThrow();
		expect(() => assertCompatibleSpectralBases(first, changed)).toThrowError(/incompatible/);
	});

	it('defaults omitted optional identity fields but rejects explicit null', () => {
		const created = basis();

		expect(created.schemaRevision).toBe('algorithm32-spectral-basis-v1');
		expect(created.semantics).toBe(SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE);
		expect(() => basis({ schemaRevision: null })).toThrowError(/schemaRevision/);
		expect(() => basis({ semantics: null })).toThrowError(/semantics/);
	});

	it('rejects missing units, duplicate ids, unordered centers, and non-bin semantics', () => {
		expect(() => createSpectralBasis({
			id: 'missing-units',
			channels: [{ id: 'a', center: { value: 400 }, width: { value: 10, units: 'nanometers' } }],
		})).toThrowError(/value and units/);
		expect(() => createSpectralBasis({
			id: 'duplicate',
			channels: [channel('a', 400, 10), channel('a', 500, 10)],
		})).toThrowError(/duplicated/);
		expect(() => createSpectralBasis({
			id: 'unordered',
			channels: [channel('a', 500, 10), channel('b', 400, 10)],
		})).toThrowError(/strictly increasing/);
		expect(() => createSpectralBasis({
			id: 'gap',
			channels: [channel('a', 400, 20), channel('b', 421, 20)],
		})).toThrowError(/contiguous/);
		expect(() => createSpectralBasis({
			id: 'overlap',
			channels: [channel('a', 400, 20), channel('b', 419, 20)],
		})).toThrowError(/contiguous/);
		expect(() => basis({ semantics: 'point-sampled' })).toThrowError(/semantics/);
	});
});
