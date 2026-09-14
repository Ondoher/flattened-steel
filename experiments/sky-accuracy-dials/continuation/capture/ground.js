import {benchmarkRay, createPointStencilBuilder, sampleDensity} from '../../numerics/view.js';

const expectedProbes = ['09:30:4:7', '09:30:5:7', '12:30:3:5', '12:30:4:4'];

/** Prepare only the four declared physical ground-density witnesses.
 * @param {SkyBuildRequest} buildRequest - Fixed physical and numerical domains.
 * @param {SkyContinuationCaptureControl} selection - Explicit frozen diagnostic controls.
 * @returns {SkyGroundDensityPlan | null} Local support, or null when the caller requested none.
 */
export function prepareGroundDensityCapture(buildRequest, selection) {
	if (selection.groundDensityProbes === undefined) return null;
	const requested = selection.groundDensityProbes;
	if (JSON.stringify(requested.map((p) => `${p.time}:${p.gridX}:${p.gridY}`)) !== JSON.stringify(expectedProbes))
		throw new RangeError('Ground-density capture requires the four preregistered witnesses in order.');
	const builder = createPointStencilBuilder(buildRequest);
	const probes = requested.map((probe) => {
		const scene = selection.probeScenes.find((item) => item.time === probe.time);
		if (!scene) throw new RangeError('Ground-density scene is absent.');
		const ray = benchmarkRay(buildRequest.transportSpec, scene, probe.gridX, probe.gridY);
		return {probe, sceneId: scene.id, ray, sample: builder.sample(ray.origin, ray.direction, 1)};
	});
	return {coordinates: builder.coordinates, probes};
}

/** Retain source-density samples and their exact compact stencil derivation.
 * @param {SkyGroundDensityPlan} plan - Local four-probe support.
 * @param {readonly Float32Array[]} fields - Pure J1 through J4 in local support order.
 * @param {SkySolarInterpolation} solarInterpolation - Explicit reconstruction operator.
 * @returns {SkyGroundDensityEvidence} Density evidence, never spectral radiance.
 */
export function evaluateGroundDensityCapture(plan, fields, solarInterpolation) {
	if (
		fields.length !== 4 ||
		fields.some((field) => field.length !== plan.coordinates.length) ||
		!['linear', 'monotone-cubic'].includes(solarInterpolation)
	)
		throw new RangeError('Ground-density fields do not match their local support.');
	for (const field of fields)
		for (const value of field)
			if (!Number.isFinite(value) || value < 0) throw new RangeError('Ground source density is invalid.');
	return {
		schemaId: 'sky-ground-density-v1',
		scope: 'four-ground-density-probes',
		units: 'W m^-3 sr^-1 nm^-1',
		solarInterpolation,
		fieldIds: ['J1', 'J2', 'J3', 'J4'],
		coordinates: plan.coordinates,
		fields: fields.map((field) => Array.from(field)),
		rows: plan.probes.map(({probe, sceneId, ray, sample}) => ({
			probeId: probe.probeId,
			sceneId,
			time: probe.time,
			gridX: probe.gridX,
			gridY: probe.gridY,
			origin: ray.origin,
			direction: ray.direction,
			sample,
			pureDensities: fields.map((field) => sampleDensity(field, sample, solarInterpolation)),
		})),
		limitations: [
			'Pure source densities at the surface observer use the retained outgoing/solar/altitude stencil. They are not angular quadrature references or integrated Kider predictions.',
			'The exact recurrence ground knot has zero lower-hemisphere L1; the ideal atmospheric-side Lambertian limit is a separate physical boundary diagnostic.',
			'Observer-radius roundoff and any resulting tiny altitude weight are retained explicitly in the sample derivation.',
		],
	};
}

/** Validate and independently reconstruct every browser-supplied ground density.
 * @param {unknown} input - Parsed compact ground-density envelope.
 * @returns {SkyGroundDensityEvidence} Original evidence after structural and numerical checks.
 */
export function validateGroundDensityCapture(input) {
	const data = /** @type {SkyGroundDensityEvidence} */ (input);
	if (
		!data ||
		typeof data !== 'object' ||
		data.schemaId !== 'sky-ground-density-v1' ||
		data.scope !== 'four-ground-density-probes' ||
		data.units !== 'W m^-3 sr^-1 nm^-1' ||
		!['linear', 'monotone-cubic'].includes(data.solarInterpolation) ||
		JSON.stringify(data.fieldIds) !== JSON.stringify(['J1', 'J2', 'J3', 'J4']) ||
		!Array.isArray(data.coordinates) ||
		data.coordinates.length < 1 ||
		data.coordinates.length > 128 ||
		!Array.isArray(data.fields) ||
		data.fields.length !== 4 ||
		!Array.isArray(data.rows) ||
		data.rows.length !== 4
	)
		throw new RangeError('Ground-density envelope is malformed or unbounded.');
	for (const point of data.coordinates) {
		if (
			!point ||
			![point.x, point.y, point.altitudeIndex, point.solarIndex, point.directionIndex].every(
				(n) => Number.isSafeInteger(n) && n >= 0,
			) ||
			point.x > 15605 ||
			point.y > 11339 ||
			point.altitudeIndex > 62 ||
			point.solarIndex > 179 ||
			point.directionIndex !== point.x ||
			typeof point.label !== 'string' ||
			point.label.length > 96
		)
			throw new RangeError('Ground-density coordinate is invalid.');
	}
	const fields = data.fields.map((field) => {
		if (
			!Array.isArray(field) ||
			field.length !== data.coordinates.length ||
			field.some((value) => !Number.isFinite(value) || value < 0 || Math.fround(value) !== value)
		)
			throw new RangeError('Ground-density raw field is invalid.');
		return Float32Array.from(field);
	});
	for (const [index, row] of data.rows.entries()) {
		if (
			!row ||
			`${row.time}:${row.gridX}:${row.gridY}` !== expectedProbes[index] ||
			![row.probeId, row.sceneId].every(
				(id) => typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/u.test(id),
			)
		)
			throw new RangeError('Ground-density row identity is invalid.');
		const sample = row.sample;
		for (const vector of [row.origin, row.direction, sample?.point])
			if (!Array.isArray(vector) || vector.length !== 3 || vector.some((n) => !Number.isFinite(n)))
				throw new RangeError('Ground-density geometry is invalid.');
		if (
			JSON.stringify(sample.point) !== JSON.stringify(row.origin) ||
			sample.step !== 1 ||
			!Number.isFinite(sample.altitude) ||
			sample.altitude < 0 ||
			sample.altitude > 1e-6 ||
			!Number.isFinite(sample.solarFraction) ||
			sample.solarFraction < 0 ||
			sample.solarFraction > 1 ||
			typeof sample.firstSolarInterval !== 'boolean' ||
			typeof sample.lastSolarInterval !== 'boolean'
		)
			throw new RangeError('Ground-density interpolation metadata is invalid.');
		for (const weights of [sample.altitudeWeights, sample.directionWeights])
			if (
				!Array.isArray(weights) ||
				weights.length < 1 ||
				weights.length > 4 ||
				weights.some((n) => !Number.isFinite(n) || n < 0 || n > 1) ||
				Math.abs(weights.reduce((sum, n) => sum + n, 0) - 1) > 1e-12
			)
				throw new RangeError('Ground-density interpolation weights are invalid.');
		if (
			sample.altitudeWeights.length > 2 ||
			!Array.isArray(sample.indices) ||
			sample.indices.length !== sample.altitudeWeights.length * 4 * sample.directionWeights.length ||
			sample.indices.some((n) => !Number.isSafeInteger(n) || n < 0 || n >= data.coordinates.length) ||
			!Array.isArray(row.pureDensities) ||
			row.pureDensities.length !== 4
		)
			throw new RangeError('Ground-density stencil dimensions are invalid.');
		for (let order = 0; order < 4; order++)
			if (row.pureDensities[order] !== sampleDensity(fields[order], sample, data.solarInterpolation))
				throw new RangeError('Ground-density value does not match its retained tap derivation.');
	}
	if (
		!Array.isArray(data.limitations) ||
		data.limitations.length > 8 ||
		data.limitations.some((s) => typeof s !== 'string' || s.length < 1 || s.length > 1024)
	)
		throw new RangeError('Ground-density limitations are invalid.');
	return data;
}
