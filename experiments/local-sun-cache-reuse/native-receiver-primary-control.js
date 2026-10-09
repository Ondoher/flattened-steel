import {gaussRule} from './native-grid-reference.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS as atmosphere} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';

/** Independently known normalized Rayleigh and Cornette-Shanks phases.
 * @param {number} cosine - Cosine of the physical scattering angle.
 * @returns {number[]} - Rayleigh and Mie phase values, per steradian.
 */
function phases(cosine) {
	const g = atmosphere.miePhaseFunctionG;
	return [3 / (16 * Math.PI) * (1 + cosine * cosine),
		3 / (8 * Math.PI) * (1 - g * g) / (2 + g * g) * (1 + cosine * cosine) / (1 + g * g - 2 * g * cosine) ** 1.5];
}

/** Resolve the observer phase peak using only already measured independent rays.
 * @param {readonly LocalSunNativeWeightedView[]} receiver - Unmodified positive-product transport measurements.
 * @param {number} azimuthCount - Samples per constant-polar row.
 * @param {LocalSunFrozenPlacement} state - Physical observer and source geometry.
 * @returns {LocalSunReceiverPrimaryControl} - Signed primary correction, phase-only quadrature bound and reproducible fitted row models; no extra transport samples.
 */
export function receiverPrimaryControl(receiver, azimuthCount, state) {
	if (!receiver.length || receiver.length % azimuthCount || ![4, 8, 16, 32, 64].includes(azimuthCount))
		throw new Error('Complete measured azimuth products required for primary control.');
	const delta = state.geometry.sourcePosition.coordinates.map((value, axis) => value - state.geometry.observerPosition.coordinates[axis]);
	const norm = Math.hypot(...delta), incoming = delta.map(value => value / norm);
	const correction = new Array(15).fill(0), errorBounds = new Array(15).fill(0), rows = [];
	for (let first = 0; first < receiver.length; first += azimuthCount) {
		const group = receiver.slice(first, first + azimuthCount), mu = group[0].path.direction[2];
		if (group.some(row => row.path.direction[2] !== mu || !(row.weight > 0)))
			throw new Error('Positive constant-polar rows required.');
		const cosines = group.map(row => row.path.direction.reduce((sum, value, axis) => sum + value * incoming[axis], 0));
		const maximum = cosines.indexOf(Math.max(...cosines)), minimum = cosines.indexOf(Math.min(...cosines));
		const a = phases(cosines[maximum]), b = phases(cosines[minimum]), determinant = a[0] * b[1] - b[0] * a[1];
		if (Math.abs(determinant) < 1e-14) continue;
		const coefficients = Array.from({length: 15}, (_, c) => {
			const x = group[maximum].orders[0][c], y = group[minimum].orders[0][c];
			return [(x * b[1] - y * a[1]) / determinant, (a[0] * y - b[0] * x) / determinant];
		});
		const radial = Math.sqrt(1 - mu * mu), horizontal = Math.hypot(incoming[0], incoming[1]);
		const meanRayleigh = 3 / (16 * Math.PI) * (1 + mu * mu * incoming[2] ** 2 + radial * radial * horizontal * horizontal / 2);
		const means = [128, 256].map(count => gaussRule(count).reduce((sum, tap) => {
			const phi = (tap.node + 1) * Math.PI / 2;
			return sum + tap.weight / 2 * phases(mu * incoming[2] + radial * horizontal * Math.cos(phi))[1];
		}, 0));
		const mass = group.reduce((sum, row) => sum + row.weight, 0);
		for (let c = 0; c < 15; c++) {
			const [r, m] = coefficients[c];
			const sampled = group.reduce((sum, row, index) => {const p = phases(cosines[index]); return sum + row.weight * (r * p[0] + m * p[1]);}, 0);
			correction[c] += mass * (r * meanRayleigh + m * means[1]) - sampled;
			errorBounds[c] += mass * Math.abs(m) * (2 * Math.abs(means[1] - means[0]) + 64 * Number.EPSILON * Math.max(...means));
		}
		rows.push({mu, mass, extrema: [maximum, minimum], coefficients, means: {rayleigh: meanRayleigh, mie: means}});
	}
	if ([...correction, ...errorBounds].some(value => !Number.isFinite(value))) throw new Error('Nonfinite primary control result.');
	return {correction, errorBounds, rows, operation: 'Subtract fitted observer Rayleigh/Cornette-Shanks phases from already measured primary rays; restore analytic Rayleigh and positive 256-point Gaussian Mie azimuth means. Retain twice the 128-to-256 phase-only change plus conservative summation roundoff. No candidate or additional transport evaluations.'};
}
