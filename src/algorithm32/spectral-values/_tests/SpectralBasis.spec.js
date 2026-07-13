import {SpectralBasis} from '../SpectralBasis.js';
import {SPECTRAL_SAMPLE_SEMANTICS} from '../consts.js';

/**
 * Called by this module to channel.
 * @param id - The id value accepted by the operation.
 * @param center - The center value accepted by the operation.
 * @param width - The width value accepted by the operation.
 * @param units - The units value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function channel(id, center, width, units = 'nanometers') {
	return {
		id,
		center: {value: center, units},
		width: {value: width, units},
	};
}

/**
 * Called by this module to basis.
 * @param overrides - The overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function basis(overrides = {}) {
	return new SpectralBasis({
		id: 'test-basis',
		channels: [channel('blue', 0.4, 0.02, 'micrometers'), channel('green', 420, 20)],
		...overrides,
	});
}

describe('SpectralBasis', /** Called by Jasmine to register the named test suite. */ () => {
	it('owns ordered channels with unit-bearing center and width data', /** Called by Jasmine to exercise the named behavior. */ () => {
		const input = [channel('blue', 0.4, 0.02, 'micrometers'), channel('green', 420, 20)];
		const created = new SpectralBasis({id: 'test-basis', channels: input});

		input[0].center.value = 999;

		expect(created.channels).toEqual([channel('blue', 400, 20), channel('green', 420, 20)]);
		expect(created.semantics).toBe(SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE);
		expect(created.channelCount).toBe(2);
		expect(created.contentHash).toBe('sha256:ecd39bb8c4aa5591d5d6d5043c68f881d92cdde893c3f602dc3930a2ce57d971');
		expect(SpectralBasis.assert(created)).toBe(created);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralBasis.assert({}, 'selected basis'),
		).toThrowError('selected basis must be a SpectralBasis.');
	});

	it('gives equivalent normalized definitions the same content identity', /** Called by Jasmine to exercise the named behavior. */ () => {
		const first = basis();
		const second = new SpectralBasis({
			id: 'test-basis',
			channels: [channel('blue', 400, 20), channel('green', 0.42, 0.02, 'micrometers')],
		});
		const changed = basis({
			channels: [channel('blue', 400, 22), channel('green', 422, 22)],
		});

		expect(second).not.toBe(first);
		expect(second.contentHash).toBe(first.contentHash);
		expect(changed.contentHash).not.toBe(first.contentHash);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralBasis.assertCompatible(first, second),
		).not.toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => SpectralBasis.assertCompatible(first, changed),
		).toThrowError(/incompatible/);
	});

	it('defaults omitted optional identity fields but rejects explicit null', /** Called by Jasmine to exercise the named behavior. */ () => {
		const created = basis();

		expect(created.schemaRevision).toBe('algorithm32-spectral-basis-v1');
		expect(created.semantics).toBe(SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => basis({schemaRevision: null}),
		).toThrowError(/schemaRevision/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => basis({semantics: null}),
		).toThrowError(/semantics/);
	});

	it('accepts noncontiguous point-sampled spectral-density coordinates', /** Called by Jasmine to exercise the named behavior. */ () => {
		const created = basis({
			semantics: SPECTRAL_SAMPLE_SEMANTICS.POINT_SAMPLED_SPECTRAL_DENSITY,
			channels: [
				channel('sample-0', 360, 11.75),
				channel('sample-1', 371.75, 2),
				channel('sample-2', 818.25, 50),
			],
		});

		expect(created.semantics).toBe(SPECTRAL_SAMPLE_SEMANTICS.POINT_SAMPLED_SPECTRAL_DENSITY);
		expect(created.channels.map(({center}) => center.value)).toEqual([360, 371.75, 818.25]);
		expect(created.channelCount).toBe(3);
	});

	it('rejects missing units, duplicate ids, unordered centers, and unsupported semantics', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new SpectralBasis({
					id: 'missing-units',
					channels: [{id: 'a', center: {value: 400}, width: {value: 10, units: 'nanometers'}}],
				}),
		).toThrowError(/value and units/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new SpectralBasis({
					id: 'duplicate',
					channels: [channel('a', 400, 10), channel('a', 500, 10)],
				}),
		).toThrowError(/duplicated/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new SpectralBasis({
					id: 'unordered',
					channels: [channel('a', 500, 10), channel('b', 400, 10)],
				}),
		).toThrowError(/strictly increasing/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new SpectralBasis({
					id: 'gap',
					channels: [channel('a', 400, 20), channel('b', 421, 20)],
				}),
		).toThrowError(/contiguous/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new SpectralBasis({
					id: 'overlap',
					channels: [channel('a', 400, 20), channel('b', 419, 20)],
				}),
		).toThrowError(/contiguous/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => basis({semantics: 'point-sampled'}),
		).toThrowError(/semantics/);
	});
});
