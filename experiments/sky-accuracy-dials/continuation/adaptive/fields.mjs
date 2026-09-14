import {medium} from '../../numerics/direct.js';
import {sampleDensity} from '../../numerics/view.js';

/** Prepare once-per-wavelength grouped fields in local adaptive coordinate order.
 * Higher fields use the established Float32 left fold beginning with zero+J2.
 * @param {readonly Float32Array[]} pureOrders - Exact captured raw J1 through J4.
 * @param {SkyAdaptiveFactoredFirstOrder | null} [factored=null] - Optional unchanged later-order J1 correction.
 * @returns {SkyAdaptiveFieldSet} Four retained density fields and optional species lighting.
 */
export function prepareAdaptiveFields(pureOrders, factored = null) {
	const count = pureOrders[0]?.length;
	if (
		pureOrders.length !== 4 ||
		!count ||
		pureOrders.some((field) => !(field instanceof Float32Array) || field.length !== count) ||
		(factored &&
			[factored.rayleighLighting, factored.mieLighting].some(
				(field) => !(field instanceof Float32Array) || field.length !== count,
			))
	)
		throw new RangeError(
			'Adaptive fields require four equally sized nonempty Float32 orders and matched species support.',
		);
	for (const field of [...pureOrders, ...(factored ? [factored.rayleighLighting, factored.mieLighting] : [])])
		for (const value of field)
			if (!Number.isFinite(value) || value < 0)
				throw new RangeError('Adaptive captured fields must be finite and nonnegative.');
	const components = [pureOrders[0]];
	for (let order = 1; order < 4; order++) {
		const field = new Float32Array(count);
		for (let index = 0; index < count; index++)
			field[index] = (order === 1 ? 0 : components[order - 1][index]) + pureOrders[order][index];
		components.push(field);
	}
	return {components, factored};
}

/** Bind the same joint medium/reconstruction callback for adaptive and uniform work.
 * Raw uses four sampleDensity calls per node; factored J1 uses five. Medium is
 * evaluated once and shared between extinction and optional local species density.
 * @param {SkyTransportSpec} spec - Fixed physical medium.
 * @param {number} channel - Direct40 index.
 * @param {SkyAdaptiveViewRay} ray - Prepared geometry and local reconstruction samples.
 * @param {SkyAdaptiveFieldSet} fields - Shared wavelength fields in local coordinate order.
 * @param {SkySolarInterpolation} interpolation - Explicit unchanged solar reconstruction.
 * @returns {SkyAdaptiveNodeEvaluator} One physical-medium call and four/five scalar reconstructions.
 */
export function createAdaptiveFieldEvaluator(spec, channel, ray, fields, interpolation) {
	if (
		!Number.isInteger(channel) ||
		channel < 0 ||
		channel >= 40 ||
		!['monotone-cubic', 'linear'].includes(interpolation)
	)
		throw new RangeError('Adaptive field queries require a Direct40 channel and an explicit solar operator.');
	if (ray.samples.length !== ray.geometry.nodes.length)
		throw new RangeError('Adaptive ray samples must exactly cover its geometric query union.');
	return (node) => {
		if (ray.geometry.nodes[node.id] !== node) throw new RangeError('Adaptive query belongs to a different ray.');
		const sample = ray.samples[node.id],
			coefficients = medium(spec, channel, sample.altitude),
			first = fields.factored
				? coefficients[1] * sampleDensity(fields.factored.rayleighLighting, sample, interpolation) +
					coefficients[2] * sampleDensity(fields.factored.mieLighting, sample, interpolation)
				: sampleDensity(fields.components[0], sample, interpolation);
		return {
			extinctionPerMeter: coefficients[0],
			densities: [
				first,
				sampleDensity(fields.components[1], sample, interpolation),
				sampleDensity(fields.components[2], sample, interpolation),
				sampleDensity(fields.components[3], sample, interpolation),
			],
		};
	};
}
