import {PAIRED_ROTATED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER} from '../../../index.js';

describe('paired rotated Fibonacci-68 direction domain', () => {
	it('combines two exact antipodal orientations with zero first moment', () => {
		const owner = PAIRED_ROTATED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER;
		expect(owner.id).toBe('algorithm32-paired-rotated-fibonacci-68-incoming-v1');
		expect(owner.directionCount).toBe(68);
		expect(owner.pairCount).toBe(34);
		expect(owner.unitVectors).toHaveSize(68);
		expect(owner.integrationWeights.values).toHaveSize(68);

		const weightedMoment = [0, 0, 0];
		for (let pairIndex = 0; pairIndex < owner.pairCount; pairIndex += 1) {
			const direction = owner.unitVectors[pairIndex * 2];
			const antipode = owner.unitVectors[pairIndex * 2 + 1];
			for (let componentIndex = 0; componentIndex < direction.length; componentIndex += 1) {
				expect(Math.abs(antipode[componentIndex] + direction[componentIndex])).toBe(0);
			}
			for (let componentIndex = 0; componentIndex < weightedMoment.length; componentIndex += 1) {
				weightedMoment[componentIndex] +=
					direction[componentIndex] * owner.integrationWeights.values[pairIndex * 2] +
					antipode[componentIndex] * owner.integrationWeights.values[pairIndex * 2 + 1];
			}
		}

		expect(weightedMoment).toEqual([0, 0, 0]);
		expect(owner.integrationWeights.values.reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(4 * Math.PI, 13);
	});

	it('retains the selected orientation and appends its quarter-turn copy', () => {
		const owner = PAIRED_ROTATED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER;
		for (let directionIndex = 0; directionIndex < 34; directionIndex += 1) {
			const selected = owner.unitVectors[directionIndex];
			expect(owner.unitVectors[directionIndex + 34]).toEqual([selected[0], -selected[2], selected[1]]);
		}
	});
});
