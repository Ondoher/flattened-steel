import {benchmarkRay} from '../../numerics/view.js';
import {prepareAdaptiveViewPlan} from '../adaptive/support.mjs';
import {evaluateAdaptiveRay, evaluateUniformAdaptiveRay} from '../adaptive/evaluate.mjs';
import {prepareAdaptiveFields, createAdaptiveFieldEvaluator} from '../adaptive/fields.mjs';

/** Prepare adaptive trial support on the registered screen and frozen component rays.
 * @param {SkyBuildRequest} buildRequest - Fixed numerical and physical domains.
 * @param {readonly SkyScene[]} scenes - The three ordinary screen scenes.
 * @param {SkyContinuationCaptureControl} selection - Frozen additional component identities.
 * @returns {SkyAdaptiveCapturePlan} Local support and unambiguous outcome joins.
 */
export function prepareAdaptiveCapture(buildRequest, scenes, selection) {
	if (
		scenes.length !== 3 ||
		JSON.stringify(scenes.map((scene) => scene.time)) !== JSON.stringify(['09:30', '11:15', '13:30'])
	)
		throw new RangeError('Adaptive pilot capture is restricted to the registered three-time screen.');
	/** @type {SkyReferenceProbe[]} */ const probes = [];
	/** @type {SkyAdaptiveCaptureIdentity[]} */ const identities = [];
	const found = new Set();
	for (const scene of scenes)
		for (let gridX = 0; gridX < 9; gridX++)
			for (let gridY = 0; gridY < 9; gridY++) {
				const key = `${scene.time}:${gridX}:${gridY}`;
				const probe = selection.probes.find((p) => `${p.time}:${p.gridX}:${p.gridY}` === key);
				const id = probe?.probeId ?? `screen-${scene.time.replace(':', '')}-${gridX}-${gridY}`;
				identities.push({
					id,
					time: scene.time,
					gridX,
					gridY,
					ordinaryRayIndex: probes.length,
					probeId: probe?.probeId ?? null,
				});
				probes.push({
					id,
					time: scene.time,
					gridX,
					gridY,
					ray: benchmarkRay(buildRequest.transportSpec, scene, gridX, gridY),
				});
				found.add(key);
			}
	for (const probe of selection.probes) {
		const key = `${probe.time}:${probe.gridX}:${probe.gridY}`;
		if (found.has(key)) continue;
		const scene = selection.probeScenes.find((s) => s.time === probe.time);
		if (!scene) throw new RangeError('Adaptive extra-time probe scene is absent.');
		identities.push({
			id: probe.probeId,
			time: probe.time,
			gridX: probe.gridX,
			gridY: probe.gridY,
			ordinaryRayIndex: null,
			probeId: probe.probeId,
		});
		probes.push({
			id: probe.probeId,
			time: probe.time,
			gridX: probe.gridX,
			gridY: probe.gridY,
			ray: benchmarkRay(buildRequest.transportSpec, scene, probe.gridX, probe.gridY),
		});
		found.add(key);
	}
	if (probes.length !== 259 || identities.filter((item) => item.probeId !== null).length !== 40)
		throw new RangeError(
			'Adaptive support must contain 243 ordinary rays and the exact 40 overlapping components.',
		);
	return {support: prepareAdaptiveViewPlan(buildRequest, probes), identities};
}

/** Compare adaptive and uniform rules using the identical counted field evaluator.
 * Trial support construction and GPU readback are recorded separately from the
 * actual joint callback counts. Existing ordinary values serve as parity controls.
 * @param {SkyBuildRequest} buildRequest - Fixed physical and numerical input.
 * @param {SkyAdaptiveCapturePlan} capture - Local sparse support and joins.
 * @param {SkyViewPlan} ordinaryPlan - Original ordinary output layout.
 * @param {SkyOrderEvaluation} ordinary - Independently evaluated grouped controls.
 * @param {number} channel - Current Direct40 channel.
 * @param {readonly Float32Array[]} pureOrders - Four fields in local adaptive tap order.
 * @param {SkyAdaptiveFactoredFirstOrder | null} factored - Optional matching local J1 lighting fields.
 * @returns {SkyAdaptiveCaptureEvidence} Separate operational spectra and exact counters.
 */
export function evaluateAdaptiveCapture(buildRequest, capture, ordinaryPlan, ordinary, channel, pureOrders, factored) {
	const fields = prepareAdaptiveFields(pureOrders, factored),
		firstOrder = factored ? 'factored' : 'raw',
		scalarReconstructionsPerNode = factored ? 5 : 4;
	const group = ordinaryPlan.representations.indexOf('grouped');
	if (group < 0 || ordinaryPlan.rayCount !== 243)
		throw new RangeError('Adaptive comparison requires grouped ordinary screen controls.');
	let maximumUniformParityError = 0;
	/** @type {SkyAdaptiveCaptureRow[]} */ const rows = [];
	for (const [index, ray] of capture.support.rays.entries()) {
		const identity = capture.identities[index],
			evaluator = createAdaptiveFieldEvaluator(
				buildRequest.transportSpec,
				channel,
				ray,
				fields,
				'monotone-cubic',
			);
		/** @type {SkyAdaptiveOptions} */ const options = {
			scalarReconstructionsPerNode,
			retainMesh: identity.probeId !== null,
		};
		const adaptive = evaluateAdaptiveRay(ray.geometry, evaluator, options),
			uniform = /** @type {const} */ ([4, 8, 16]).map((level) =>
				evaluateUniformAdaptiveRay(ray.geometry, evaluator, level, options),
			);
		if (identity.ordinaryRayIndex !== null)
			for (const [viewIndex, view] of ordinaryPlan.views.entries()) {
				if (view.solarInterpolation !== 'monotone-cubic' || ![4, 8, 16].includes(view.intervalCount)) continue;
				const comparison = uniform[[4, 8, 16].indexOf(view.intervalCount)];
				for (let order = 0; order < 4; order++) {
					const offset =
							((group * ordinaryPlan.views.length + viewIndex) * 4 + order) * ordinaryPlan.rayCount +
							identity.ordinaryRayIndex,
						actual = comparison.groupedRadiancesW[order],
						expected = ordinary.values[offset],
						error = Math.abs(actual - expected);
					maximumUniformParityError = Math.max(maximumUniformParityError, error);
					if (error > 256 * Number.EPSILON * Math.max(1e-12, Math.abs(actual), Math.abs(expected)))
						throw new RangeError(
							`Counted uniform evaluator changed ordinary grouping at ${identity.id}, order ${order + 1}.`,
						);
				}
			}
		rows.push({...identity, segmentCount: ray.geometry.segments.length, adaptive: adaptive.checkpoints, uniform});
	}
	return {
		schemaId: 'sky-adaptive-capture-v1',
		scope: 'registered-screen-and-component',
		units: 'W m^-2 sr^-1 nm^-1',
		firstOrder,
		ordinaryRayCount: 243,
		preparedQueryCount: capture.support.preparedQueryCount,
		scalarReconstructionsPerNode,
		maximumUniformParityError,
		rows,
		limitations: [
			'Adaptive budgets count all evaluated coarse and rejected trial nodes, with one medium call and four/five scalar reconstructions per joint node; precomputed geometry and GPU readback have separate costs.',
			'The priority is a retrospective local difference propagated through current foreground and background estimates. It is not an error bound, a promise of monotonic improvement, or a convergence law.',
			'Only the registered screen is an ordinary scoring boundary. Extra-time component rays remain separate; sparse meshes are retained only for the 40 frozen components.',
		],
	};
}

/** Validate browser-supplied operational outcomes and exact counting identities.
 * This checks evidence structure, not whether a heuristic predicts physical error.
 * @param {unknown} input - Parsed adaptive comparison metadata.
 * @returns {SkyAdaptiveCaptureEvidence} Validated original envelope.
 */
export function validateAdaptiveCapture(input) {
	const data = /** @type {SkyAdaptiveCaptureEvidence} */ (input);
	if (
		!data ||
		data.schemaId !== 'sky-adaptive-capture-v1' ||
		data.scope !== 'registered-screen-and-component' ||
		data.units !== 'W m^-2 sr^-1 nm^-1' ||
		data.ordinaryRayCount !== 243 ||
		!['raw', 'factored'].includes(data.firstOrder) ||
		data.scalarReconstructionsPerNode !== (data.firstOrder === 'raw' ? 4 : 5) ||
		!Array.isArray(data.rows) ||
		data.rows.length !== 259 ||
		!Number.isFinite(data.maximumUniformParityError) ||
		data.maximumUniformParityError < 0
	)
		throw new RangeError('Adaptive operational envelope is invalid.');
	const identities = new Set(),
		ordinary = new Set();
	let prepared = 0,
		meshes = 0;
	for (const row of data.rows) {
		if (
			!row ||
			typeof row.id !== 'string' ||
			!/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/u.test(row.id) ||
			identities.has(row.id) ||
			!['09:30', '10:15', '11:15', '12:30', '13:30'].includes(row.time) ||
			![row.gridX, row.gridY].every((n) => Number.isInteger(n) && n >= 0 && n < 9) ||
			!Number.isInteger(row.segmentCount) ||
			row.segmentCount < 1 ||
			row.segmentCount > 63 ||
			!Array.isArray(row.adaptive) ||
			row.adaptive.length !== 3 ||
			!Array.isArray(row.uniform) ||
			row.uniform.length !== 3
		)
			throw new RangeError('Adaptive ray identity or bounded dimensions are invalid.');
		identities.add(row.id);
		prepared += 31 * row.segmentCount;
		if (row.probeId !== null) {
			if (
				typeof row.probeId !== 'string' ||
				row.probeId !== row.id ||
				!/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/u.test(row.probeId)
			)
				throw new RangeError('Adaptive component identity is invalid.');
			meshes++;
		}
		if (row.ordinaryRayIndex !== null) {
			const scene = ['09:30', '11:15', '13:30'].indexOf(row.time),
				expected = (scene * 9 + row.gridX) * 9 + row.gridY;
			if (scene < 0 || row.ordinaryRayIndex !== expected || ordinary.has(expected))
				throw new RangeError('Adaptive ordinary index is invalid.');
			ordinary.add(expected);
		} else if (!['10:15', '12:30'].includes(row.time) || row.probeId === null)
			throw new RangeError('Adaptive extra-time scope is invalid.');
		for (const [kind, checkpoints] of /** @type {const} */ ([
			['adaptive', row.adaptive],
			['uniform', row.uniform],
		])) {
			let previousQueries = 0;
			/** @type {readonly number[] | null} */ let previousMesh = null;
			for (const [index, result] of checkpoints.entries()) {
				const count = [4, 8, 16][index],
					budget = count * row.segmentCount,
					counters = result?.counters;
				if (
					!result ||
					result.budget !== budget ||
					!counters ||
					![
						result.activeNodeCount,
						counters.queriedNodes,
						counters.mediumEvaluations,
						counters.scalarReconstructions,
						counters.cacheHits,
						result.nextRefinementCost,
					].every((n) => Number.isSafeInteger(n) && n >= 0) ||
					counters.queriedNodes > budget ||
					counters.queriedNodes < previousQueries ||
					counters.mediumEvaluations !== counters.queriedNodes ||
					counters.scalarReconstructions !== counters.queriedNodes * data.scalarReconstructionsPerNode ||
					(kind === 'uniform'
						? counters.queriedNodes !== budget || result.activeNodeCount !== budget
						: counters.queriedNodes !== 2 * result.activeNodeCount - row.segmentCount) ||
					(kind === 'adaptive'
						? counters.queriedNodes < 3 * row.segmentCount ||
							![4, 8, 16].includes(result.nextRefinementCost) ||
							counters.queriedNodes + result.nextRefinementCost <= budget
						: result.nextRefinementCost !== 0) ||
					!Number.isFinite(result.transmittance) ||
					result.transmittance < 0 ||
					result.transmittance > 1
				)
					throw new RangeError('Adaptive work accounting identity is invalid.');
				previousQueries = counters.queriedNodes;
				for (const values of [result.componentRadiancesW, result.groupedRadiancesW])
					if (
						!Array.isArray(values) ||
						values.length !== 4 ||
						values.some((n) => !Number.isFinite(n) || n < 0)
					)
						throw new RangeError('Adaptive radiance vector is invalid.');
				for (let order = 0; order < 4; order++)
					if (
						result.groupedRadiancesW[order] !==
						result.componentRadiancesW[0] + (order ? result.componentRadiancesW[order] : 0)
					)
						throw new RangeError('Adaptive grouping identity is invalid.');
				if (
					row.probeId === null
						? result.mesh !== null
						: !Array.isArray(result.mesh) ||
							result.mesh.length !== row.segmentCount ||
							result.mesh.some((n) => ![1, 2, 4, 8, 16].includes(n)) ||
							result.mesh.reduce((a, b) => a + b, 0) !== result.activeNodeCount
				)
					throw new RangeError('Adaptive sparse mesh is invalid.');
				if (
					result.mesh &&
					(result.mesh.some((level) => (kind === 'adaptive' ? level < 2 : level !== count)) ||
						(kind === 'adaptive' &&
							previousMesh &&
							result.mesh.some((level, segment) => level < previousMesh[segment])))
				)
					throw new RangeError('Adaptive mesh violates initialization, uniformity or prefix refinement.');
				previousMesh = result.mesh;
			}
		}
	}
	if (
		ordinary.size !== 243 ||
		meshes !== 40 ||
		prepared !== data.preparedQueryCount ||
		!Array.isArray(data.limitations) ||
		data.limitations.length > 8 ||
		data.limitations.some((s) => typeof s !== 'string' || s.length < 1 || s.length > 1024)
	)
		throw new RangeError('Adaptive aggregate scope, preparation count or limitations are invalid.');
	return data;
}
