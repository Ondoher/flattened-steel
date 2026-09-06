import { readFileSync } from 'node:fs';

import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	FIBONACCI_34_DIRECTION_DOMAIN,
	NATIVE_48_POSITION_DOMAIN,
} from '../../domains/index.js';

const policy = JSON.parse(readFileSync(new URL(
	'../gpu-cache-parity-policy.json',
	import.meta.url,
), 'utf8'));

describe('Algorithm32 production GPU cache parity policy', () => {
	it('predeclares field-family binary32 bounds before production output', () => {
		expect(policy.status).toBe('predeclared-before-production-gpu-output');
		expect(policy.comparison).toEqual({
			oracle: 'production-binary64-cpu-cache',
			candidate: 'production-r32f-gpu-cache',
			allowedError: 'absolute + relative * abs(oracle)',
		});
		expect(policy.bounds).toEqual({
			pureRadiance: { absolute: 2e-9, relative: 0.005 },
			pureScatteringDensity: { absolute: 2e-12, relative: 0.005 },
			cumulativeScatteringDensity: { absolute: 8e-12, relative: 0.005 },
			exactCopy: { absolute: 0, relative: 0 },
		});
		expect(policy.wavelengthIndices).toEqual(
			Array.from({ length: 15 }, (_value, index) => index),
		);
	});

	it('pins physical Native-48, W27, and Fibonacci-34 probe coordinates', () => {
		for (const query of policy.scatteringDensityQueries) {
			expect(NATIVE_48_POSITION_DOMAIN.nodes[query.positionIndex].coordinate)
				.toEqual(query.altitude);
			expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN.unitVectors[query.directionIndex])
				.toEqual(query.cacheDirection);
		}
		for (const query of policy.radianceQueries) {
			expect(NATIVE_48_POSITION_DOMAIN.nodes[query.positionIndex].coordinate)
				.toEqual(query.altitude);
			expect(FIBONACCI_34_DIRECTION_DOMAIN.unitVectors[query.directionIndex])
				.toEqual(query.cacheDirection);
		}
	});
});
