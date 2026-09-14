import assert from 'node:assert/strict';

/** Absolute component allowance for independently evaluated binary64 unit-vector arithmetic. */
export const groundDirectionComponentAllowance = 8 * Number.EPSILON;

/** Check the same frozen ray across browser and Node trigonometric implementations.
 * This validates the coordinate address only. It does not normalize/replace the captured vector,
 * change a numerical reference allowance, or excuse a different observer, time, or grid identity.
 * @param {SkyVector3} captured - Original immutable browser direction.
 * @param {SkyVector3} expected - Independently recomputed Node direction for the same registered ray.
 * @returns {void}
 */
export function assertGroundDirection(captured, expected) {
	for (const vector of [captured, expected]) {
		assert.ok(Array.isArray(vector) && vector.length === 3 && vector.every(Number.isFinite));
		assert.ok(
			Math.abs(Math.hypot(...vector) - 1) <= groundDirectionComponentAllowance,
			'Ground witness direction is not a binary64 unit vector.',
		);
	}
	for (const component of [0, 1, 2])
		assert.ok(
			Math.abs(captured[component] - expected[component]) <= groundDirectionComponentAllowance,
			'Ground witness differs from its registered ray beyond binary64 coordinate roundoff.',
		);
}
