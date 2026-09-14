import {sampleDensity} from '../numerics/view.js';
import {directDensity, medium} from '../numerics/direct.js';

/** Shared midpoint transport, with the production two half-step equation.
 * @param {SkyTransportSpec} spec - Physical model.
 * @param {number} channel - Direct40 index.
 * @param {SkyViewRay} ray - Prepared physical ray.
 * @param {(sample: SkyViewSample) => number} density - Density evaluator.
 * @returns {number} Directional spectral radiance.
 */
function integrateDensity(spec, channel, ray, density) {
	let radiance = 0,
		transmittance = 1;
	for (const sample of ray.samples) {
		const halfStep = Math.exp(-0.5 * medium(spec, channel, sample.altitude)[0] * sample.step);
		transmittance *= halfStep;
		radiance += transmittance * density(sample) * sample.step;
		transmittance *= halfStep;
	}
	if (!Number.isFinite(radiance) || radiance < 0) throw new RangeError('View integration returned invalid radiance.');
	return radiance;
}

/** Evaluate all actual cumulative stages and named representations for one wavelength.
 * Both cumulative and higher-only fields use left-fold Float32 addition. Nonlinear
 * cubic grouping is explicit; frozen-increment replacement keeps later orders fixed.
 * Flattening is representation, view, order, then scene/X/Y ray.
 * @param {SkyBuildRequest} buildRequest - Fixed compiler request.
 * @param {SkyViewPlan} viewPlan - Sparse support and output operators.
 * @param {number} channel - Direct40 index.
 * @param {readonly Float32Array[]} pureOrders - J1 through J6 in sparse coordinate order.
 * @returns {SkyOrderEvaluation} Compact spectral result.
 */
export function evaluateSixOrders(buildRequest, viewPlan, channel, pureOrders) {
	const spec = buildRequest.transportSpec,
		count = viewPlan.coordinates.length;
	if (
		!Number.isInteger(channel) ||
		channel < 0 ||
		channel >= 40 ||
		pureOrders.length !== 6 ||
		pureOrders.some((values) => !(values instanceof Float32Array) || values.length !== count)
	)
		throw new RangeError('Six exact sparse Float32 orders and a Direct40 channel are required.');
	for (const field of pureOrders)
		for (const value of field)
			if (!Number.isFinite(value) || value < 0)
				throw new RangeError('Pure scattering fields must be finite and nonnegative.');
	const cumulative = [],
		higher = [];
	for (let order = 0; order < 6; order++) {
		const c = new Float32Array(count),
			h = new Float32Array(count);
		for (let index = 0; index < count; index++) {
			c[index] = order === 0 ? pureOrders[0][index] : cumulative[order - 1][index] + pureOrders[order][index];
			h[index] = order === 0 ? 0 : higher[order - 1][index] + pureOrders[order][index];
		}
		cumulative.push(c);
		higher.push(h);
	}
	const shape = {
			representationCount: viewPlan.representations.length,
			viewCount: viewPlan.views.length,
			orderCount: 6,
			rayCount: viewPlan.rayCount,
		},
		values = new Float64Array(shape.representationCount * shape.viewCount * 6 * shape.rayCount);
	const needsAnalytic = viewPlan.representations.some((representation) => representation.includes('analytic-n1')),
		needsHigher = viewPlan.representations.some(
			(representation) => representation === 'grouped' || representation === 'analytic-n1',
		);
	for (const [viewIndex, view] of viewPlan.views.entries())
		for (const [rayIndex, ray] of view.rays.entries()) {
			const cached = cumulative.map((field) =>
				integrateDensity(spec, channel, ray, (sample) => sampleDensity(field, sample, view.solarInterpolation)),
			);
			const grouped = needsHigher
				? higher.map((field) =>
						integrateDensity(spec, channel, ray, (sample) =>
							sampleDensity(field, sample, view.solarInterpolation),
						),
					)
				: [0, 0, 0, 0, 0, 0];
			const analytic = needsAnalytic
				? integrateDensity(spec, channel, ray, (sample) =>
						directDensity(spec, channel, sample.point, ray.worldDirection),
					)
				: 0;
			for (const [representationIndex, representation] of viewPlan.representations.entries())
				for (let order = 0; order < 6; order++) {
					const value =
						representation === 'cumulative'
							? cached[order]
							: representation === 'grouped'
								? cached[0] + grouped[order]
								: representation === 'analytic-n1'
									? analytic + grouped[order]
									: cached[order] - cached[0] + analytic;
					if (!Number.isFinite(value)) throw new RangeError('Representation produced nonfinite radiance.');
					values[
						((representationIndex * shape.viewCount + viewIndex) * 6 + order) * shape.rayCount + rayIndex
					] = value;
				}
		}
	return {schemaId: 'sky-six-order-evaluation-v1', channel, shape, values};
}
