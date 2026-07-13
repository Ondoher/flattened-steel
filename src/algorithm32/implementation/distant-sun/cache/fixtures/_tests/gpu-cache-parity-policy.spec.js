import {readFileSync} from 'node:fs';

import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
	SphericalNativePositionDomain,
} from '../../../../../sampling-domains/index.js';

/** Policy constant. */
const policy = JSON.parse(readFileSync(new URL('../gpu-cache-parity-policy.json', import.meta.url), 'utf8'));
const retainedPositionDomain = new SphericalNativePositionDomain({
	id: 'algorithm32-native-48-position-v1',
	count: 48,
	boundaryAltitude: {value: 2, units: 'meters'},
});

describe('retained Algorithm32 GPU cache parity policy', /** Called by Jasmine to register the named test suite. */ () => {
	it('predeclares field-family binary32 bounds before production output', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(policy.status).toBe('predeclared-before-production-gpu-output');
		expect(policy.comparison).toEqual({
			oracle: 'production-binary64-cpu-cache',
			candidate: 'production-r32f-gpu-cache',
			allowedError: 'absolute + relative * abs(oracle)',
		});
		expect(policy.bounds).toEqual({
			pureRadiance: {absolute: 2e-9, relative: 0.005},
			pureScatteringDensity: {absolute: 2e-12, relative: 0.005},
			cumulativeScatteringDensity: {absolute: 8e-12, relative: 0.005},
			exactCopy: {absolute: 0, relative: 0},
		});
		expect(policy.wavelengthIndices).toEqual(
			Array.from(
				{length: 15},
				/**
				 * Called by the surrounding operation to handle one callback invocation.
				 * @param _value - The intentionally unused callback value.
				 * @param index - The zero-based index accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (_value, index) => index,
			),
		);
	});

	it('pins physical Native-48, W27, and reflection-completed Fibonacci-68 probe coordinates', /** Called by Jasmine to exercise the named behavior. */ () => {
		for (const query of policy.scatteringDensityQueries) {
			expect(retainedPositionDomain.nodes[query.positionIndex].coordinate).toEqual(query.altitude);
			expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.unitVectors[query.directionIndex]).toEqual(
				query.cacheDirection,
			);
		}
		for (const query of policy.radianceQueries) {
			expect(retainedPositionDomain.nodes[query.positionIndex].coordinate).toEqual(query.altitude);
			expect(REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.unitVectors[query.directionIndex]).toEqual(
				query.cacheDirection,
			);
		}
	});
});
