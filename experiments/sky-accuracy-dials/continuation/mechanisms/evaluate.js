import {benchmarkRay, integrateDensity, prepareViewPlan, sampleDensity} from '../../numerics/view.js';
import {medium} from '../../numerics/direct.js';
import {speciesFields} from '../../probes/density.mjs';
import {prepareFixedFieldReference, evaluateFixedDensityReference} from '../reference/fixed-field.mjs';
import {evaluateDensityOrders, prepareDensityOrderFields, sampleHigherDensityOrder} from '../density-view/evaluate.js';
import {prepareGroundDensityCapture} from '../capture/ground.js';

/** Prepare ordinary species views and independently located component support.
 * Coordinates are merged by the exact flattened texture address. Each local
 * reference stencil retains its own ordering through the explicit index map.
 * @param {SkyGpuControl} control - Authenticated mechanism screen recipe.
 * @returns {SkyMechanismDensityPlan} RAM-only complete sparse support.
 */
export function prepareMechanismDensityViews(control) {
	const selection = control.continuation;
	if (
		!selection ||
		selection.referenceMode !== 'component' ||
		!['split-raw', 'factored'].includes(selection.higherRepresentation)
	)
		throw new RangeError('Density adapter requires an explicit species mechanism and component references.');
	const normal = prepareViewPlan(control.buildRequest, control.scenes, control.controls);
	const probes = selection.probes.map((probe) => {
		const scene = selection.probeScenes.find((item) => item.time === probe.time);
		if (!scene) throw new RangeError('A frozen reference scene is absent.');
		return {
			id: probe.probeId,
			time: probe.time,
			gridX: probe.gridX,
			gridY: probe.gridY,
			ray: benchmarkRay(control.buildRequest.transportSpec, scene, probe.gridX, probe.gridY),
		};
	});
	const reference = prepareFixedFieldReference(control.buildRequest, probes),
		coordinates = [...normal.coordinates],
		indexes = new Map(coordinates.map((point, index) => [`${point.x}:${point.y}`, index]));
	const referenceIndexes = reference.coordinates.map((point) => {
		const key = `${point.x}:${point.y}`;
		let index = indexes.get(key);
		if (index === undefined) {
			index = coordinates.length;
			indexes.set(key, index);
			coordinates.push(point);
		}
		return index;
	});
	// Preserve the combined-raw adapter's union ordering for P55 parity. These
	// species values are not mislabelled as the raw four-field ground envelope.
	const ground = prepareGroundDensityCapture(control.buildRequest, selection);
	for (const point of ground?.coordinates ?? []) {
		const key = `${point.x}:${point.y}`;
		if (!indexes.has(key)) {
			indexes.set(key, coordinates.length);
			coordinates.push(point);
		}
	}
	return {view: {...normal, coordinates}, reference, referenceIndexes};
}

/** Evaluate actual species fields, never a reconstructed combined scalar surrogate.
 * Final J1 remains separately integrated. An explicit factored J1 intervention
 * follows the existing continuation delta-replacement arithmetic; higher fields
 * are untouched by that final-view intervention.
 * @param {SkyGpuControl} control - Complete registered selectors.
 * @param {SkyMechanismDensityPlan} plan - Shared ordinary/reference geometry.
 * @param {number} channel - Current Direct40 channel.
 * @param {readonly Float32Array[]} captured - J1,J2R,J2M,J3R,J3M,J4R,J4M in exact order.
 * @returns {SkyGpuEvaluation} Grouped spectra and explicitly scoped component references.
 */
export function evaluateMechanismDensityViews(control, plan, channel, captured) {
	if (captured.length !== 7) throw new RangeError('Seven actual species source fields are required.');
	const selection = control.continuation;
	/** @type {SkyDensityMode} */
	const mode = selection.higherRepresentation === 'split-raw' ? 'splitraw' : 'factored';
	const buildRequest = control.buildRequest,
		spec = buildRequest.transportSpec;
	/** @type {SkyHigherDensitySpeciesFields} */
	const species = {rayleigh: [captured[1], captured[3], captured[5]], mie: [captured[2], captured[4], captured[6]]};
	const result = evaluateDensityOrders(buildRequest, plan.view, channel, captured[0], species, mode);
	const firstFields =
		selection.finalFirstOrder === 'factored' ? speciesFields(spec, plan.view, channel, () => {}) : null;
	if (firstFields) {
		for (const [viewIndex, view] of plan.view.views.entries())
			for (const [rayIndex, ray] of view.rays.entries()) {
				const first = integrateDensity(spec, channel, ray, (sample) => {
					const coefficients = medium(spec, channel, sample.altitude);
					return (
						coefficients[1] * sampleDensity(firstFields.rayleighLighting, sample, view.solarInterpolation) +
						coefficients[2] * sampleDensity(firstFields.mieLighting, sample, view.solarInterpolation)
					);
				});
				const base = viewIndex * 4 * plan.view.rayCount + rayIndex,
					delta = first - result.values[base];
				for (let order = 0; order < 4; order++) result.values[base + order * plan.view.rayCount] += delta;
			}
	}
	if (!plan.reference.channels.includes(channel)) return result;
	const local = captured.map((field) => Float32Array.from(plan.referenceIndexes, (index) => field[index]));
	const fields = prepareDensityOrderFields(local[0], {
		rayleigh: [local[1], local[3], local[5]],
		mie: [local[2], local[4], local[6]],
	});
	const firstR = firstFields
			? Float32Array.from(plan.referenceIndexes, (index) => firstFields.rayleighLighting[index])
			: null,
		firstM = firstFields
			? Float32Array.from(plan.referenceIndexes, (index) => firstFields.mieLighting[index])
			: null;
	/** @type {SkyFixedReferenceRepresentation} */
	const representation = firstFields
		? 'grouped-factored-all'
		: mode === 'factored'
			? 'grouped-factored-higher'
			: 'grouped-split-higher';
	const evaluated = evaluateFixedDensityReference(
		buildRequest,
		plan.reference,
		channel,
		representation,
		(sample, order) => {
			const coefficients = firstFields ? medium(spec, channel, sample.altitude) : null;
			const first = firstFields
				? coefficients[1] * sampleDensity(firstR, sample, 'monotone-cubic') +
					coefficients[2] * sampleDensity(firstM, sample, 'monotone-cubic')
				: sampleDensity(fields.first, sample, 'monotone-cubic');
			return first + sampleHigherDensityOrder(spec, channel, fields, sample, 'monotone-cubic', order, mode);
		},
	);
	/** @type {SkyContinuationProbeDiagnostic[]} */ const rows = [];
	for (const row of evaluated.rows) {
		const scene = selection.probeScenes.find((item) => item.time === row.time);
		const common = {
			probeId: row.probeId,
			sceneId: scene.id,
			time: row.time,
			gridX: row.gridX,
			gridY: row.gridY,
			order: row.order,
			representationId: row.representation,
		};
		for (const [method, value] of Object.entries(row.methods))
			rows.push({
				...common,
				methodId: method,
				value: value.radianceW,
				errorAllowance: value.columnsConverged ? value.attenuationAllowanceW : null,
				evaluationCount: value.evaluations,
			});
		rows.push({
			...common,
			methodId: 'reference-envelope',
			value: row.referenceW,
			errorAllowance: row.allowanceW,
			evaluationCount: 0,
			limitations: row.limitations,
		});
	}
	return {
		...result,
		diagnostics: {
			schemaId: 'sky-continuation-channel-diagnostics-v1',
			scope: 'component-probes',
			units: 'W m^-2 sr^-1 nm^-1',
			queryCount: plan.reference.uniqueQueryCount,
			preparationEvaluationCount: plan.reference.rays.reduce(
				(sum, ray) => sum + ray.columnEvaluations.gauss + ray.columnEvaluations.simpson,
				0,
			),
			allowancePolicy: `Species are reconstructed separately before physical-density application and summation. No combined scalar surrogate is interpolated. ${evaluated.allowancePolicy} ${evaluated.scope}`,
			evaluationCount: rows.reduce((sum, row) => sum + row.evaluationCount, 0),
			probes: rows,
		},
	};
}
