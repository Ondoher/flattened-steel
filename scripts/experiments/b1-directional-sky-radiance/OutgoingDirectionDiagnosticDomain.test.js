import assert from 'node:assert/strict';
import test from 'node:test';

import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/index.js';
import {OutgoingDirectionDiagnosticDomain} from './OutgoingDirectionDiagnosticDomain.js';

function normalize(direction) {
	const length = Math.hypot(...direction);
	return direction.map((component) => component / length);
}

test('sparse W27 queries preserve production directions and weights', () => {
	const queries = [
		[1, 0, 0],
		[-1, 0, 0],
		[0.2, 0.8, 0.4],
		[-0.7, 0.3, 0.6],
		[0.4, -0.2, -0.9],
	].map(normalize);
	const diagnostic = new OutgoingDirectionDiagnosticDomain({
		id: 'w27-equivalence-test',
		queryDirections: queries,
		faceWidth: 27,
	});

	for (let queryIndex = 0; queryIndex < queries.length; queryIndex += 1) {
		const expected = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.resolveStencil(queries[queryIndex]);
		const actual = diagnostic.queryStencil(queryIndex);
		assert.equal(actual.indices.length, expected.indices.length);
		for (let tap = 0; tap < expected.indices.length; tap += 1) {
			assert.ok(Math.abs(actual.weights[tap] - expected.weights[tap]) <= 1e-14);
			const actualDirection = diagnostic.unitVectors[actual.indices[tap]];
			const expectedDirection = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.unitVectors[expected.indices[tap]];
			for (let component = 0; component < 3; component += 1) {
				assert.ok(Math.abs(actualDirection[component] - expectedDirection[component]) <= 5e-16);
			}
		}
	}
});
