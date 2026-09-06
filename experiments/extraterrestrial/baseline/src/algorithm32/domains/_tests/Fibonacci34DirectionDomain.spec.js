import {
	FIBONACCI_34_DIRECTION_DOMAIN,
	FIBONACCI_34_DIRECTION_DOMAIN_OWNER,
} from '../consts.js';

describe('Fibonacci34DirectionDomain', () => {
	it('retains the exact pinned source-local 34-vector sequence', () => {
		const unitVectors =
			FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors;
		expect(unitVectors.length).toBe(34);
		expect(unitVectors[0]).toEqual([
			-6.118005084603635e-17,
			2.5299871800168635e-18,
			-1,
		]);
		expect(unitVectors[17]).toEqual([1, 0, 0]);
		expect(unitVectors[33]).toEqual([
			0.2583867092358571,
			-0.21776859209109395,
			0.9411764705882353,
		]);
		for (const vector of unitVectors) {
			expect(Math.abs(Math.hypot(...vector) - 1)).toBeLessThan(2e-15);
		}
	});

	it('declares equal steradian weights summing to four pi', () => {
		const integrationWeights =
			FIBONACCI_34_DIRECTION_DOMAIN_OWNER.integrationWeights;
		expect(integrationWeights.units).toBe('steradians');
		expect(integrationWeights.values.length).toBe(34);
		expect(integrationWeights.values.every(
			(weight) => weight === 0.36959913571644626,
		)).toBeTrue();
		expect(integrationWeights.values.reduce(
			(sum, weight) => sum + weight,
			0,
		)).toBeCloseTo(4 * Math.PI, 13);
	});

	it('pins its distinct source-frame and quadrature identities', () => {
		expect(FIBONACCI_34_DIRECTION_DOMAIN.frame).toEqual(jasmine.objectContaining({
			kind: 'source-local-fibonacci-pinned-frame-v1',
			coordinates: 'source-local',
		}));
		expect(FIBONACCI_34_DIRECTION_DOMAIN.frame.worldProjection)
			.toEqual(jasmine.objectContaining({
				kind: 'threshold-reference-projection-v1',
				switchAtAbsoluteDot: 0.95,
			}));
		expect(FIBONACCI_34_DIRECTION_DOMAIN.interpolation.kind)
			.toBe('exact-quadrature-nodes-only');
		expect(FIBONACCI_34_DIRECTION_DOMAIN_OWNER.descriptor)
			.toBe(FIBONACCI_34_DIRECTION_DOMAIN);
		expect(FIBONACCI_34_DIRECTION_DOMAIN.contentHash).toBe(
			'sha256:1e9784b6b940f154cbd3d69988e23c993c24f9cc12853aac993aa4d14c12141c',
		);
	});

});
