import {
	PAIRED_FIBONACCI_34_DIRECTION_DOMAIN,
	PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER,
} from '../index.js';

describe('paired-Fibonacci-34 direction domain', () => {
	it('pins the accepted Star vector sequence and content identity', () => {
		expect(
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER
				.directionCount,
		).toBe(34);
		expect(
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER
				.unitVectors,
		).toHaveSize(34);
		expect(
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER
				.unitVectors[0],
		).toEqual([
			0.029411764705882353,
			0.9995673804686135,
			0,
		]);
		expect(
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER
				.unitVectors[16],
		).toEqual([
			0.5,
			0.813476104932415,
			-0.29708016881640964,
		]);
		expect(
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER
				.unitVectors[32],
		).toEqual([
			0.9705882352941176,
			0.18408593454310446,
			-0.1551478205197947,
		]);
		expect(PAIRED_FIBONACCI_34_DIRECTION_DOMAIN.contentHash).toBe(
			'sha256:9cc84ee3f5509e8935b5ea4352e4f194ea2ecef02ade136afc47dc642ba1c0b9',
		);
	});

	it('preserves exact antipodes, canonical zero, and zero first moment', () => {
		const firstMoment = [0, 0, 0];

		for (let pairIndex = 0; pairIndex < 17; pairIndex += 1) {
			const positive =
				PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER
					.unitVectors[
					pairIndex * 2
				];
			const antipode =
				PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER
					.unitVectors[
					pairIndex * 2 + 1
				];

			expect(
				Math.abs(Math.hypot(...positive) - 1),
			).toBeLessThan(2e-15);
			expect(
				Math.abs(Math.hypot(...antipode) - 1),
			).toBeLessThan(2e-15);

			for (let axis = 0; axis < 3; axis += 1) {
				expect(Object.is(positive[axis], -0)).toBeFalse();
				expect(Object.is(antipode[axis], -0)).toBeFalse();
				expect(positive[axis] + antipode[axis])
					.toBe(0);
				firstMoment[axis] +=
					positive[axis] + antipode[axis];
			}
		}

		expect(firstMoment).toEqual([0, 0, 0]);
	});

	it('uses the selected uniform solid-angle quadrature', () => {
		expect(
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER
				.integrationWeights.units,
		)
			.toBe('steradians');
		expect(
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER
				.integrationWeights.values,
		)
			.toHaveSize(34);
		expect(
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER
				.integrationWeights
				.values.every(
					(weight) =>
						weight ===
							0.36959913571644626,
				),
		).toBeTrue();
		expect(
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER
				.integrationWeights
				.values.reduce(
					(sum, weight) => sum + weight,
					0,
				),
		).toBeCloseTo(4 * Math.PI, 13);
	});

	it('declares the geometry-owned radial, tangent, and vertical frame', () => {
		expect(
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN.frame,
		).toEqual({
			coordinates: 'source-subpoint-local',
			handedness: 'right',
			kind:
				'source-subpoint-radial-tangent-vertical',
			worldProjection: 'geometry-owned-per-position',
			xAxisRole:
				'radial-away-from-source-subpoint',
			yAxisRole: 'positive-planar-tangent',
			zAxisRole: 'vertical-up',
		});
		expect(
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN
				.interpolation.kind,
		).toBe('exact-quadrature-nodes-only');
	});

});
