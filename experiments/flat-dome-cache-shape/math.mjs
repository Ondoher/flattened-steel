import assert from 'node:assert/strict';

/**
 * Computes Gauss-Legendre integration on [0,1], retaining only mathematical nodes.
 *
 * @param {number} count - Number of positive integration weights.
 * @returns {SkyDirectRule} - Mathematical abscissae and weights.
 */
export function gauss(count) {
	assert.ok(Number.isInteger(count) && count >= 2 && count <= 256);
	const nodes = [],
		weights = [];
	for (let i = 0; i < count; i++) {
		let z = Math.cos((Math.PI * (i + 0.75)) / (count + 0.5)),
			derivative = 0;
		for (let iteration = 0; iteration < 40; iteration++) {
			let p = 1,
				previous = 0;
			for (let j = 1; j <= count; j++) {
				const old = p;
				p = ((2 * j - 1) * z * p - (j - 1) * previous) / j;
				previous = old;
			}
			derivative = (count * (z * p - previous)) / (z * z - 1);
			const next = z - p / derivative;
			if (Math.abs(next - z) < 2e-15) {
				z = next;
				break;
			}
			z = next;
		}
		nodes.push((1 + z) / 2);
		weights.push(1 / ((1 - z * z) * derivative * derivative));
	}
	return {nodes, weights};
}
