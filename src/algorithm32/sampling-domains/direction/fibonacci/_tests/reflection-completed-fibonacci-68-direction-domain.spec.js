import {REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER} from '../../../index.js';
import {FIBONACCI_34_DIRECTION_DOMAIN_OWNER} from '../consts.js';

describe('ReflectionCompletedFibonacci68DirectionDomain', () => {
	it('retains every ordinary direction and adds its exact source-plane reflection', () => {
		const domain = REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER;

		expect(domain.id).toBe('algorithm32-reflection-completed-fibonacci-68-incoming-v1');
		expect(domain.directionCount).toBe(68);
		expect(domain.unitVectors).toHaveSize(68);

		FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors.forEach((ordinaryDirection, ordinaryIndex) => {
			const retained = domain.unitVectors[ordinaryIndex * 2];
			const reflected = domain.unitVectors[ordinaryIndex * 2 + 1];

			expect(retained).toEqual(ordinaryDirection);
			expect(reflected).toEqual([ordinaryDirection[0], -ordinaryDirection[1], ordinaryDirection[2]]);
		});
	});

	it('splits every ordinary weight across its pair while preserving 4 pi', () => {
		const domain = REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER;

		expect(domain.integrationWeights.units).toBe('steradians');
		expect(domain.integrationWeights.values).toHaveSize(68);
		FIBONACCI_34_DIRECTION_DOMAIN_OWNER.integrationWeights.values.forEach((ordinaryWeight, ordinaryIndex) => {
			expect(domain.integrationWeights.values[ordinaryIndex * 2]).toBe(ordinaryWeight * 0.5);
			expect(domain.integrationWeights.values[ordinaryIndex * 2 + 1]).toBe(ordinaryWeight * 0.5);
		});
		expect(domain.integrationWeights.values.reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(4 * Math.PI, 12);
	});
});
