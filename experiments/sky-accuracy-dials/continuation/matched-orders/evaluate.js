import {benchmarkRay, prepareViewPlan, sampleDensity} from '../../numerics/view.js';
import {evaluateSixOrders} from '../../orders/view.js';
import {prepareGroundDensityCapture} from '../capture/ground.js';
import {
	prepareFixedFieldReference,
	evaluateFixedFieldReference,
	evaluateFixedDensityReference,
} from '../reference/fixed-field.mjs';

/** Exact, explicitly retained temporary-slot derivations. @type {readonly SkyMatchedOrderSlot[]} */
export const matchedOrderSlots = Object.freeze([
	...[1, 2, 3, 4].map((slot) => ({
		invocation: /** @type {const} */ ('original-four'),
		slot,
		actualOrder: /** @type {SkyMatchedScatteringOrder} */ (slot),
		purpose: /** @type {const} */ ('retained'),
	})),
	...[3, 4, 5, 6].map((order, index) => ({
		invocation: /** @type {const} */ ('extension'),
		slot: index + 1,
		actualOrder: /** @type {SkyMatchedScatteringOrder} */ (order),
		purpose: /** @type {'retained'|'prefix-witness'} */ (index < 2 ? 'prefix-witness' : 'retained'),
	})),
]);

/** Canonical lossless finite JSON representation for exact cross-runtime prefix comparisons.
 * @param {unknown} value - A finite JSON record, array or primitive.
 * @returns {string} Stable recursively sorted object encoding.
 */
export function matchedOrderCanonical(value) {
	if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
	if (typeof value === 'number' && Number.isFinite(value))
		return Object.is(value, -0) ? '"binary64-negative-zero"' : JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map(matchedOrderCanonical).join(',')}]`;
	if (value && typeof value === 'object')
		return `{${Object.keys(value)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${matchedOrderCanonical(value[key])}`)
			.join(',')}}`;
	throw new RangeError('Prefix identity requires finite JSON values.');
}

/** Reconstruct the exact original H union; no sparse coordinate is inferred from another run.
 * @param {SkyGpuControl} control - Authenticated original H N4 recipe.
 * @param {() => void} [progress] - Preparation work/cancellation callback.
 * @returns {SkyMatchedOrdersPlan} Original ordinary support followed by original reference-only taps.
 */
export function prepareMatchedOrderViews(control, progress = () => {}) {
	const selection = control.continuation;
	if (
		!selection ||
		selection.referenceMode !== 'component' ||
		selection.finalFirstOrder !== 'raw' ||
		(selection.higherRepresentation ?? 'combined-raw') !== 'combined-raw' ||
		![0, 4].includes(selection.groundDensityProbes?.length ?? 0) ||
		selection.probes.length !== 40
	)
		throw new RangeError('Only the original raw H forty-probe capture union is admitted.');
	const normal = prepareViewPlan(control.buildRequest, control.scenes, control.controls);
	const probes = selection.probes.map((probe) => {
		const scene = selection.probeScenes.find((value) => value.time === probe.time);
		if (!scene) throw new RangeError('Missing original C0 probe scene.');
		return {
			id: probe.probeId,
			time: probe.time,
			gridX: probe.gridX,
			gridY: probe.gridY,
			ray: benchmarkRay(control.buildRequest.transportSpec, scene, probe.gridX, probe.gridY),
		};
	});
	const reference = prepareFixedFieldReference(control.buildRequest, probes, progress);
	const coordinates = [...normal.coordinates],
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
	// P55's original N4 prefix includes four ground-probe stencils. Preserve
	// their complete ordered union even though the new six-order diagnostic
	// retains viewing radiance rather than another ground-density result.
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

/** Flatten original method rows in the exact historical order and field layout.
 * @param {readonly SkyFixedReferenceRow[]} rows - Original fixed-field method results.
 * @param {readonly SkyScene[]} scenes - Exact C0 scene identities.
 * @returns {SkyContinuationProbeDiagnostic[]} Original-order seven-method evidence rows.
 */
function flatten(rows, scenes) {
	return rows.flatMap((row) => {
		const scene = scenes.find((value) => value.time === row.time);
		if (!scene) throw new RangeError('Missing original reference scene.');
		const common = {
			probeId: row.probeId,
			sceneId: scene.id,
			time: row.time,
			gridX: row.gridX,
			gridY: row.gridY,
			order: row.order,
			representationId: row.representation,
		};
		return [
			...Object.entries(row.methods).map(([methodId, value]) => ({
				...common,
				methodId,
				value: value.radianceW,
				errorAllowance: value.columnsConverged ? value.attenuationAllowanceW : null,
				evaluationCount: value.evaluations,
			})),
			{
				...common,
				methodId: 'reference-envelope',
				value: row.referenceW,
				errorAllowance: row.allowanceW,
				evaluationCount: 0,
				limitations: row.limitations,
			},
		];
	});
}

/** Evaluate true grouped N1-N6 with unchanged independent view envelopes.
 * The extra invocation maps API slots1/2/3/4 to actual N3/N4/N5/N6. Repeated
 * N3/N4 rows must match exactly and their work remains charged.
 * @param {SkyGpuControl} control - Exact original H recipe.
 * @param {SkyMatchedOrdersPlan} plan - Exact complete union and local tap map.
 * @param {number} channel - Zero or eight.
 * @param {readonly Float32Array[]} pureOrders - Actual J1 through J6 in capture-union order.
 * @param {() => void} [progress] - Cooperative CPU evaluation guard.
 * @returns {SkyMatchedOrdersEvaluation} Six-stage spectra, explicit order diagnostics and original prefix witness.
 */
export function evaluateMatchedOrderViews(control, plan, channel, pureOrders, progress = () => {}) {
	if (
		![0, 8].includes(channel) ||
		pureOrders.length !== 6 ||
		pureOrders.some((field) => field.length !== plan.view.coordinates.length)
	)
		throw new RangeError('Six exact H fields and a declared partial channel are required.');
	const evaluation = evaluateSixOrders(control.buildRequest, plan.view, channel, pureOrders);
	const local = pureOrders.map((field) => Float32Array.from(plan.referenceIndexes, (index) => field[index]));
	const original = evaluateFixedFieldReference(
		control.buildRequest,
		plan.reference,
		channel,
		local.slice(0, 4),
		progress,
	);
	const prefixRows = flatten(original.rows, control.continuation.probeScenes);
	const higher = [new Float32Array(plan.reference.coordinates.length)];
	for (let order = 1; order < 6; order++) {
		const next = new Float32Array(plan.reference.coordinates.length);
		for (let index = 0; index < next.length; index++) next[index] = higher[order - 1][index] + local[order][index];
		higher.push(next);
	}
	const extension = evaluateFixedDensityReference(
		control.buildRequest,
		plan.reference,
		channel,
		'grouped',
		(sample, slot) =>
			sampleDensity(local[0], sample, plan.reference.solarInterpolation) +
			sampleDensity(higher[slot + 1], sample, plan.reference.solarInterpolation),
		progress,
	);
	const mapped = flatten(extension.rows, control.continuation.probeScenes).map((row) => ({
		...row,
		order: row.order + 2,
	}));
	let extensionPrefixComparisons = 0;
	for (const row of mapped.filter((value) => value.order <= 4)) {
		const expected = prefixRows.find(
			(value) =>
				value.probeId === row.probeId &&
				value.order === row.order &&
				value.methodId === row.methodId &&
				value.representationId === 'grouped',
		);
		if (matchedOrderCanonical(row) !== matchedOrderCanonical(expected))
			throw new Error('Extended view evaluator changed the original N3/N4 envelope.');
		extensionPrefixComparisons++;
	}
	const rows = /** @type {SkyMatchedOrderRow[]} */ ([
		...prefixRows.filter((row) => row.representationId === 'grouped'),
		...mapped.filter((row) => row.order > 4),
	]);
	const prefixEvaluationCount = prefixRows.reduce((sum, row) => sum + row.evaluationCount, 0),
		extensionEvaluationCount = mapped.reduce((sum, row) => sum + row.evaluationCount, 0);
	return {
		evaluation,
		prefixRows,
		diagnostics: {
			schemaId: 'sky-matched-order-diagnostics-v1',
			scope: 'original-c0-probes-two-channels',
			units: 'W m^-2 sr^-1 nm^-1',
			channel,
			actualOrders: [1, 2, 3, 4, 5, 6],
			rows,
			slotDerivations: matchedOrderSlots,
			queryCount: plan.reference.uniqueQueryCount,
			preparationEvaluationCount: plan.reference.rays.reduce(
				(sum, ray) => sum + ray.columnEvaluations.gauss + ray.columnEvaluations.simpson,
				0,
			),
			prefixEvaluationCount,
			extensionEvaluationCount,
			evaluationCount: prefixEvaluationCount + extensionEvaluationCount,
			retainedEvaluationCount: rows.reduce((sum, row) => sum + row.evaluationCount, 0),
			prefixReferenceRowCount: prefixRows.length,
			extensionPrefixComparisons,
			allowancePolicy: `${original.allowancePolicy} Actual N5/N6 use unchanged grouped-density quadrature via declared slots; duplicate N3/N4 work is charged. No recurrence accuracy or infinite-order tail bound is established.`,
		},
	};
}
