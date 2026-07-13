import { readFileSync } from 'node:fs';

import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	NATIVE_48_POSITION_DOMAIN,
} from '../../domains/index.js';

const policy = JSON.parse(readFileSync(new URL(
	'../runtime-cache-parity-policy.json',
	import.meta.url,
), 'utf8'));

describe('Algorithm32 production runtime-cache parity policy', () => {
	it('predeclares the cumulative final-view comparison before runtime output', () => {
		expect(policy.status).toBe('predeclared-before-runtime-cache-output');
		expect(policy.authority.algorithm)
			.toBe('algorithm32-star cumulative-final-view-transport');
		expect(policy.orders).toEqual([1, 2, 4]);
		expect(policy.wavelengthIndices).toEqual(
			Array.from({ length: 15 }, (_value, index) => index),
		);
		expect(policy.invariants).toEqual({
			cumulativeQueriesPerPathPointAndSource: 1,
			separateDirectSourceTerm: false,
			incidentDirectionLoop: false,
			cumulativeFieldFeedsRecurrence: false,
			objectShorteningPreserved: true,
			atmosphereExitPreserved: true,
		});
	});

	it('pins the complete position surface and representative W27 topology', () => {
		expect(policy.positionCases.exactNodes).toBe('all-native-48-nodes');
		expect(NATIVE_48_POSITION_DOMAIN.nodes.length).toBe(48);
		expect(policy.positionCases.formerBoundaries).toEqual({
			first: { value: 1250, units: 'meters' },
			step: { value: 1250, units: 'meters' },
			count: 47,
			offsets: [
				{ value: -0.25, units: 'meters' },
				{ value: 0, units: 'meters' },
				{ value: 0.25, units: 'meters' },
			],
		});
		expect(CUBED_SPHERE_W27_DIRECTION_DOMAIN.count).toBe(4374);
		expect(policy.directionCases.map((entry) => entry.role))
			.toEqual(['exact-node', 'exact-node', 'interior', 'seam', 'corner']);
	});
});
