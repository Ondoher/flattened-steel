import {CANONICAL_ATMOSPHERE_CONSTANTS as atmosphere} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';

/** Bound omitted receiver horizon mass using positive source-function envelopes.
 * Since L = integral S exp(-tau) d(tau), L cannot exceed max S. The omitted
 * cosine-weighted solid angle is pi*cutoff^2. Tensor reconstruction is positive;
 * each higher-order envelope is the maximum authenticated binary64 coefficient.
 * The continuous primary envelope bounds inverse-square incidence, phase maxima,
 * attenuation by one and the scattering/extinction ratio by one.
 * @param {LocalSunNativeFieldGrid} grid - Independently computed positive source functions.
 * @param {LocalSunFrozenPlacement} state - Exact independent physical inputs.
 * @param {number} cutoff - First positive independent polar knot, not a fitted value.
 * @returns {number[][]} - Four order-separated Native15 upper bounds in horizontal irradiance units; add their sum once to the complete receiver budget.
 */
export function nativeReceiverHorizonTail(grid, state, cutoff) {
	if (
		!(cutoff > 0 && cutoff < 1) ||
		grid.fields.length !== 3 ||
		state.geometry.sourcePosition.coordinates[2] <= grid.top ||
		state.source.sourceIrradiance.values.length !== 15
	)
		throw new Error('Positive independent source envelopes and a source above the slab required.');
	const g = atmosphere.miePhaseFunctionG;
	if (!(g >= 0 && g < 1 && atmosphere.mieSingleScatteringAlbedo >= 0 && atmosphere.mieSingleScatteringAlbedo <= 1))
		throw new Error('Unsupported physical phase/albedo envelope.');
	const phase = Math.max(3 / (8 * Math.PI), ((((3 / (8 * Math.PI)) * (1 - g * g)) / (2 + g * g)) * 2) / (1 - g) ** 3);
	const distance = Math.max(state.geometry.sourcePosition.coordinates[2] - grid.top, state.source.radius.value);
	const scale =
		state.source.referenceSpectralIncidentScale *
		(state.source.distanceFalloff ? (state.source.referenceDistance.value / distance) ** 2 : 1);
	const mass = Math.PI * cutoff ** 2 * (1 + 64 * Number.EPSILON);
	const primary = Array.from(state.source.sourceIrradiance.values, (value) => mass * value * scale * phase);
	const higher = grid.fields.map((order) =>
		order.map((field) => {
			let maximum = 0;
			for (const value of field) {
				if (!Number.isFinite(value) || value < -1e-12) throw new Error('Invalid independent source envelope.');
				maximum = Math.max(maximum, value);
			}
			return mass * maximum;
		}),
	);
	if (
		[primary, ...higher].some(
			(values) => values.length !== 15 || values.some((value) => !Number.isFinite(value) || value < 0),
		)
	)
		throw new Error('Incomplete or invalid receiver horizon bound.');
	return [primary, ...higher];
}
