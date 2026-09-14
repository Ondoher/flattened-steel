import {medium} from '../../numerics/direct.js';
import {integrateDensity, sampleDensity} from '../../numerics/view.js';
import {requireDensityMode} from '../density/kernels.js';

/** Validate a sparse nonnegative Float32 coefficient or density field.
 * @param {Float32Array} field - Actual captured field, never a generated substitute.
 * @param {number} count - Exact retained coordinate count.
 * @returns {void} Throws for invalid capture data.
 */
function requireField(field, count) {
	if (!(field instanceof Float32Array) || field.length !== count)
		throw new RangeError('Density field shape mismatch.');
	for (const value of field)
		if (!Number.isFinite(value) || value < 0)
			throw new RangeError('Density fields must be finite and nonnegative.');
}

/** Preserve raw J1 and separately left-fold each higher-order species in Float32.
 * The two species are never combined before nonlinear solar reconstruction.
 * @param {Float32Array} first - Unchanged raw J1 capture.
 * @param {SkyHigherDensitySpeciesFields} species - Pure species J2 through J4.
 * @returns {SkyDensityOrderFields} Four cumulative selectors per species.
 */
export function prepareDensityOrderFields(first, species) {
	if (!(first instanceof Float32Array) || first.length === 0)
		throw new RangeError('A nonempty raw J1 field is required.');
	requireField(first, first.length);
	if (species.rayleigh.length !== 3 || species.mie.length !== 3)
		throw new RangeError('Density recurrence requires exactly three higher orders per species.');
	/** Left-fold one species with explicit zero at N1. @param {readonly Float32Array[]} pure @returns {readonly Float32Array[]} */
	const accumulate = (pure) => {
		const cumulative = [new Float32Array(first.length)];
		for (const field of pure) {
			requireField(field, first.length);
			const previous = cumulative[cumulative.length - 1];
			const next = new Float32Array(first.length);
			for (let index = 0; index < next.length; index++) next[index] = previous[index] + field[index];
			requireField(next, first.length);
			cumulative.push(next);
		}
		return cumulative;
	};
	return {first, rayleigh: accumulate(species.rayleigh), mie: accumulate(species.mie)};
}

/** Reconstruct each higher species with equivalent interpolation and limiting.
 * Factored mode multiplies coefficients by physical density after reconstruction.
 * @param {SkyTransportSpec} spec - Fixed physical controls.
 * @param {number} channel - Direct40 channel ordinal.
 * @param {SkyDensityOrderFields} fields - Explicit species accumulation.
 * @param {SkyViewSample} sample - Query stencil in the shared support.
 * @param {SkySolarInterpolation} solar - Matched solar reconstruction operator.
 * @param {number} order - Cumulative selector 1 through 4.
 * @param {SkyDensityMode} mode - Retained density or query density.
 * @returns {number} Higher density in W m^-3 sr^-1 nm^-1.
 */
export function sampleHigherDensityOrder(spec, channel, fields, sample, solar, order, mode) {
	requireDensityMode(mode);
	if (!Number.isInteger(order) || order < 1 || order > 4) throw new RangeError('Density order must be 1 through 4.');
	if (order === 1) return 0;
	const rayleigh = sampleDensity(fields.rayleigh[order - 1], sample, solar);
	const mie = sampleDensity(fields.mie[order - 1], sample, solar);
	if (mode === 'splitraw') return rayleigh + mie;
	const coefficients = medium(spec, channel, sample.altitude);
	return coefficients[1] * rayleigh + coefficients[2] * mie;
}

/** Provide point density for independent reference formulations.
 * Ordinary output integrates raw J1 and higher density separately to match H.
 * @param {SkyTransportSpec} spec - Fixed physical controls.
 * @param {number} channel - Direct40 channel ordinal.
 * @param {SkyDensityOrderFields} fields - Explicit species accumulation.
 * @param {SkyViewSample} sample - Query stencil in the shared support.
 * @param {SkySolarInterpolation} solar - Matched solar reconstruction operator.
 * @param {number} order - Cumulative selector 1 through 4.
 * @param {SkyDensityMode} mode - Retained density or query density.
 * @returns {number} Raw first plus reconstructed higher density.
 */
export function sampleDensityOrder(spec, channel, fields, sample, solar, order, mode) {
	return (
		sampleDensity(fields.first, sample, solar) +
		sampleHigherDensityOrder(spec, channel, fields, sample, solar, order, mode)
	);
}

/** Evaluate the declared species-grouped N1-N4 outputs with raw final J1.
 * Higher species are reconstructed separately and summed at each physical query.
 * First-order and higher radiance integrals remain separately accumulated as in H.
 * @param {SkyBuildRequest} buildRequest - Fixed physical and numerical request.
 * @param {SkyViewPlan} plan - Ordinary rays plus any captured reference support.
 * @param {number} channel - Direct40 channel ordinal.
 * @param {Float32Array} first - Raw captured J1.
 * @param {SkyHigherDensitySpeciesFields} species - Regenerated higher orders.
 * @param {SkyDensityMode} mode - Explicit reconstruction intervention.
 * @returns {SkyOrderEvaluation} Grouped representation in the ordinary shape.
 */
export function evaluateDensityOrders(buildRequest, plan, channel, first, species, mode) {
	requireDensityMode(mode);
	if (plan.representations.length !== 1 || plan.representations[0] !== 'grouped')
		throw new RangeError('Species density evaluation requires the single grouped representation.');
	if (!Number.isInteger(channel) || channel < 0 || channel >= 40 || first.length !== plan.coordinates.length)
		throw new RangeError('Density view channel or coordinate shape is invalid.');
	const fields = prepareDensityOrderFields(first, species);
	const spec = buildRequest.transportSpec;
	const shape = {representationCount: 1, viewCount: plan.views.length, orderCount: 4, rayCount: plan.rayCount};
	const values = new Float64Array(shape.viewCount * 4 * shape.rayCount);
	for (const [viewIndex, view] of plan.views.entries()) {
		if (view.rays.length !== shape.rayCount) throw new RangeError('Density view ray shape mismatch.');
		for (const [rayIndex, ray] of view.rays.entries()) {
			const firstRadiance = integrateDensity(spec, channel, ray, (sample) =>
				sampleDensity(fields.first, sample, view.solarInterpolation),
			);
			for (let order = 1; order <= 4; order++) {
				const higher =
					order === 1
						? 0
						: integrateDensity(spec, channel, ray, (sample) =>
								sampleHigherDensityOrder(
									spec,
									channel,
									fields,
									sample,
									view.solarInterpolation,
									order,
									mode,
								),
							);
				const value = firstRadiance + higher;
				if (!Number.isFinite(value) || value < 0)
					throw new RangeError('Density evaluation produced invalid radiance.');
				values[(viewIndex * 4 + order - 1) * shape.rayCount + rayIndex] = value;
			}
		}
	}
	return {schemaId: 'sky-order-evaluation-v1', channel, shape, values};
}
