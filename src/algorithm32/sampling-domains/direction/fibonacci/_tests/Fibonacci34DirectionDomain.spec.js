import {FIBONACCI_34_DIRECTION_DOMAIN_OWNER} from '../consts.js';

describe('Fibonacci34DirectionDomain', /** Called by Jasmine to register the named test suite. */ () => {
	it('retains the exact pinned source-local 34-vector sequence', /** Called by Jasmine to exercise the named behavior. */ () => {
		const unitVectors = FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors;
		expect(unitVectors.length).toBe(34);
		expect(unitVectors[0]).toEqual([-6.118005084603635e-17, 2.5299871800168635e-18, -1]);
		expect(unitVectors[17]).toEqual([1, 0, 0]);
		expect(unitVectors[33]).toEqual([0.2583867092358571, -0.21776859209109395, 0.9411764705882353]);
		for (const vector of unitVectors) {
			expect(Math.abs(Math.hypot(...vector) - 1)).toBeLessThan(2e-15);
		}
	});

	it('declares equal steradian weights summing to four pi', /** Called by Jasmine to exercise the named behavior. */ () => {
		const integrationWeights = FIBONACCI_34_DIRECTION_DOMAIN_OWNER.integrationWeights;
		expect(integrationWeights.units).toBe('steradians');
		expect(integrationWeights.values.length).toBe(34);
		expect(
			integrationWeights.values.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param weight - The weight value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (weight) => weight === 0.36959913571644626,
			),
		).toBeTrue();
		expect(
			integrationWeights.values.reduce(
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

	it('exposes its selected identity on the executable owner', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(FIBONACCI_34_DIRECTION_DOMAIN_OWNER.id).toBe('algorithm32-fibonacci-34-incoming-v1');
	});
});
