import {PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER} from '../../../index.js';

describe('paired-Fibonacci-34 direction domain', /** Called by Jasmine to register the named test suite. */ () => {
	it('pins the accepted production vector sequence and owner identity', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.id).toBe('algorithm32-paired-fibonacci-34-incoming-v1');
		expect(PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.directionCount).toBe(34);
		expect(PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors).toHaveSize(34);
		expect(PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors[0]).toEqual([
			0.029411764705882353, 0.9995673804686135, 0,
		]);
		expect(PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors[16]).toEqual([
			0.5, 0.813476104932415, -0.29708016881640964,
		]);
		expect(PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors[32]).toEqual([
			0.9705882352941176, 0.18408593454310446, -0.1551478205197947,
		]);
	});

	it('preserves exact antipodes, canonical zero, and zero first moment', /** Called by Jasmine to exercise the named behavior. */ () => {
		const firstMoment = [0, 0, 0];

		for (let pairIndex = 0; pairIndex < 17; pairIndex += 1) {
			const positive = PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors[pairIndex * 2];
			const antipode = PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors[pairIndex * 2 + 1];

			expect(Math.abs(Math.hypot(...positive) - 1)).toBeLessThan(2e-15);
			expect(Math.abs(Math.hypot(...antipode) - 1)).toBeLessThan(2e-15);

			for (let axis = 0; axis < 3; axis += 1) {
				expect(Object.is(positive[axis], -0)).toBeFalse();
				expect(Object.is(antipode[axis], -0)).toBeFalse();
				expect(positive[axis] + antipode[axis]).toBe(0);
				firstMoment[axis] += positive[axis] + antipode[axis];
			}
		}

		expect(firstMoment).toEqual([0, 0, 0]);
	});

	it('uses the selected uniform solid-angle quadrature', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.integrationWeights.units).toBe('steradians');
		expect(PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.integrationWeights.values).toHaveSize(34);
		expect(
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.integrationWeights.values.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param weight - The weight value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (weight) => weight === 0.36959913571644626,
			),
		).toBeTrue();
		expect(
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.integrationWeights.values.reduce(
				/**
				 * Called by Array.prototype.reduce to accumulate one collection value.
				 * @param sum - The sum value accepted by the operation.
				 * @param weight - The weight value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (sum, weight) => sum + weight,
				0,
			),
		).toBeCloseTo(4 * Math.PI, 13);
	});
});
