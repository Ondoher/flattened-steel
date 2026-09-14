import {composeAdaptiveTransfers, evaluateAdaptiveRay, evaluateUniformAdaptiveRay} from './evaluate.mjs';
import {prepareAdaptiveRay} from './support.mjs';

/** Independent manufactured midpoint fold, constructing distances without the support tables.
 * This verifies operation ordering and grouped output while using the stated same equation.
 * @param {readonly SkyPathInterval[]} intervals - Physical segments.
 * @param {4 | 8 | 16} count - Uniform count per segment.
 * @param {(distance: number) => SkyAdaptiveNodeValue} field - Analytic manufactured medium/density.
 * @returns {SkyAdaptiveTransfer} Four separate exact-order midpoint sums.
 */
function independentUniform(intervals, count, field) {
	let attenuation = 1;
	const sources = [0, 0, 0, 0];
	for (const interval of intervals) {
		const length = interval.end - interval.start;
		for (let index = 0; index < count; index++) {
			const start = index === 0 ? interval.start : interval.start + length * (index / count),
				end = index + 1 === count ? interval.end : interval.start + length * ((index + 1) / count),
				value = field((start + end) * 0.5),
				half = Math.exp(-0.5 * value.extinctionPerMeter * (end - start));
			attenuation *= half;
			for (let component = 0; component < 4; component++)
				sources[component] += attenuation * value.densities[component] * (end - start);
			attenuation *= half;
		}
	}
	return {attenuation, sources};
}

/** Pure manufactured checks for finite support, actual query cost, grouping and heuristic limits.
 * These checks execute no browser, GPU, Kider sample, filesystem operation or evidence allocation.
 * @returns {SkyAdaptiveProofResult} Self-verifying mathematical and bookkeeping proof summary.
 */
export function adaptiveViewProof() {
	let checks = 0,
		maximumUniformParityError = 0,
		maximumTransferError = 0;
	/** @param {boolean} condition - Required invariant. @param {string} message - Failure diagnostic. @returns {void} */
	function assert(condition, message) {
		if (!condition) throw new Error(`Adaptive proof failed: ${message}`);
		checks++;
	}
	/** @param {() => unknown} action - Rejected boundary operation. @param {string} message - Failure diagnostic. @returns {void} */
	function rejects(action, message) {
		let rejected = false;
		try {
			action();
		} catch {
			rejected = true;
		}
		assert(rejected, message);
	}
	/** @type {SkyAdaptiveOptions} */ const options = {scalarReconstructionsPerNode: 4, retainMesh: true};
	const intervals = [
			{start: 0, end: 0.07},
			{start: 0.07, end: 0.37},
			{start: 0.37, end: 1},
		],
		ray = prepareAdaptiveRay(intervals);
	assert(ray.nodes.length === 93 && ray.segments.length === 3, 'complete 31P midpoint union');
	for (const [index, segment] of ray.segments.entries()) {
		const unique = new Set();
		for (const level of /** @type {readonly SkyAdaptiveLevel[]} */ ([1, 2, 4, 8, 16])) {
			const ids = segment.levels[level];
			assert(ids.length === level, 'level cardinality');
			let previousEnd = segment.interval.start;
			for (const id of ids) {
				const node = ray.nodes[id];
				assert(
					node.id === id && node.segmentIndex === index && node.level === level,
					'dense local geometry identity',
				);
				assert(
					node.start === previousEnd &&
						node.end > node.start &&
						node.distance > node.start &&
						node.distance < node.end,
					'contiguous positive interior geometry',
				);
				assert(
					node.step === node.end - node.start && node.distance === (node.start + node.end) * 0.5,
					'ordinary midpoint arithmetic',
				);
				previousEnd = node.end;
				unique.add(node.distance);
			}
			assert(previousEnd === segment.interval.end, 'exact physical segment endpoint');
		}
		assert(unique.size === 31, 'disjoint nonnested midpoint sets');
	}
	rejects(() => prepareAdaptiveRay([]), 'empty support rejection');
	rejects(() => prepareAdaptiveRay([{start: 1, end: 2}]), 'nonobserver initial segment rejection');
	rejects(
		() =>
			prepareAdaptiveRay([
				{start: 0, end: 1},
				{start: 0.9, end: 2},
			]),
		'overlapping segment rejection',
	);
	rejects(() => prepareAdaptiveRay([{start: 0, end: Infinity}]), 'nonfinite geometry rejection');
	rejects(() => prepareAdaptiveRay([{start: 0, end: 0}]), 'zero-length segment rejection');
	/** @param {number} distance - Observer distance. @returns {SkyAdaptiveNodeValue} */
	const field = (distance) => ({
		extinctionPerMeter: 0.2 + distance * distance,
		densities: [1 + distance, distance * distance, 2 + distance ** 3, 3 + distance ** 4],
	});
	for (const level of /** @type {readonly (4 | 8 | 16)[]} */ ([4, 8, 16])) {
		let callbacks = 0;
		const visited = new Set();
		const result = evaluateUniformAdaptiveRay(
				ray,
				(node) => {
					callbacks++;
					visited.add(node.id);
					return field(node.distance);
				},
				level,
				options,
			),
			independent = independentUniform(intervals, level, field);
		assert(callbacks === 3 * level && visited.size === callbacks, 'uniform fresh distinct callbacks');
		assert(
			result.counters.queriedNodes === callbacks &&
				result.counters.mediumEvaluations === callbacks &&
				result.counters.scalarReconstructions === 4 * callbacks,
			'uniform honest medium/reconstruction accounting',
		);
		assert(result.transmittance === independent.attenuation, 'uniform attenuation operation parity');
		for (let component = 0; component < 4; component++) {
			const error = Math.abs(result.componentRadiancesW[component] - independent.sources[component]);
			maximumUniformParityError = Math.max(maximumUniformParityError, error);
			assert(error === 0, 'uniform four-accumulator operation parity');
			assert(
				result.groupedRadiancesW[component] ===
					(component === 0
						? independent.sources[0]
						: independent.sources[0] + independent.sources[component]),
				'grouped addition occurs after integration',
			);
		}
	}
	const callbackIds = [];
	const adaptive = evaluateAdaptiveRay(
		ray,
		(node) => {
			callbackIds.push(node.id);
			return field(node.distance);
		},
		options,
	);
	assert(new Set(callbackIds).size === callbackIds.length, 'adaptive cache never repeats callback');
	let previousCount = 0;
	for (const result of adaptive.checkpoints) {
		assert(
			result.counters.queriedNodes <= result.budget && result.counters.queriedNodes >= 9,
			'trial-inclusive budget ceiling',
		);
		assert(result.counters.queriedNodes === 2 * result.activeNodeCount - 3, 'Nquery=2Nactive-P');
		assert(result.counters.queriedNodes >= previousCount, 'monotone callback prefix lengths');
		assert(
			result.counters.queriedNodes + result.nextRefinementCost > result.budget,
			'stop before highest-priority unaffordable refinement',
		);
		assert(
			result.mesh.reduce((sum, level) => sum + level, 0) === result.activeNodeCount,
			'mesh counts only active nodes',
		);
		assert(
			result.counters.scalarReconstructions === 4 * result.counters.queriedNodes && result.counters.cacheHits > 0,
			'coarse/trial and cached reread accounting',
		);
		previousCount = result.counters.queriedNodes;
	}
	assert(callbackIds.length === adaptive.checkpoints.at(-1).counters.queriedNodes, 'final callback accounting');
	const replayIds = [];
	const replay = evaluateAdaptiveRay(
		ray,
		(node) => {
			replayIds.push(node.id);
			return field(node.distance);
		},
		options,
	);
	assert(
		JSON.stringify(replayIds) === JSON.stringify(callbackIds) &&
			JSON.stringify(replay) === JSON.stringify(adaptive),
		'deterministic prefix replay',
	);
	const five = evaluateAdaptiveRay(ray, (node) => field(node.distance), {
		scalarReconstructionsPerNode: 5,
		retainMesh: false,
	});
	for (let index = 0; index < 3; index++) {
		assert(five.checkpoints[index].mesh === null, 'ordinary output omits full mesh');
		assert(
			five.checkpoints[index].counters.scalarReconstructions ===
				5 * five.checkpoints[index].counters.queriedNodes,
			'five-reconstruction factored cost',
		);
		assert(
			JSON.stringify(five.checkpoints[index].groupedRadiancesW) ===
				JSON.stringify(adaptive.checkpoints[index].groupedRadiancesW),
			'cost declaration never changes numerical values',
		);
	}
	rejects(
		() => evaluateAdaptiveRay(ray, () => ({extinctionPerMeter: -1, densities: [0, 0, 0, 0]}), options),
		'negative extinction rejection',
	);
	rejects(
		() => evaluateAdaptiveRay(ray, () => ({extinctionPerMeter: 0, densities: [0, NaN, 0, 0]}), options),
		'nonfinite density rejection',
	);
	const single = prepareAdaptiveRay([{start: 0, end: 1}]);
	/** @param {number} distance - Observer distance. @returns {SkyAdaptiveNodeValue} */
	const vacuum = (distance) => ({extinctionPerMeter: 0, densities: [1, 2 * distance, 3, 4 * distance]});
	const singleResult = evaluateAdaptiveRay(single, (node) => vacuum(node.distance), options);
	for (const [index, result] of singleResult.checkpoints.entries()) {
		assert(
			result.counters.queriedNodes === [3, 7, 15][index] && result.activeNodeCount === [2, 4, 8][index],
			'single-segment nonnested trial cost and unused budget',
		);
		assert(
			result.transmittance === 1 && JSON.stringify(result.componentRadiancesW) === JSON.stringify([1, 1, 3, 2]),
			'exact vacuum constant/linear integrals',
		);
	}
	const slabErrors = [],
		polynomialErrors = [];
	for (const level of /** @type {readonly (4 | 8 | 16)[]} */ ([4, 8, 16])) {
		const slab = evaluateUniformAdaptiveRay(
				single,
				() => ({extinctionPerMeter: 0.8, densities: [2, 0, 0, 0]}),
				level,
				options,
			),
			polynomial = evaluateUniformAdaptiveRay(
				single,
				(node) => ({extinctionPerMeter: 0, densities: [node.distance ** 2, 0, 0, 0]}),
				level,
				options,
			);
		slabErrors.push(Math.abs(slab.componentRadiancesW[0] - (2 * (1 - Math.exp(-0.8))) / 0.8));
		polynomialErrors.push(Math.abs(polynomial.componentRadiancesW[0] - 1 / 3));
		assert(Math.abs(slab.transmittance - Math.exp(-0.8)) < 3e-15, 'constant slab exact optical depth');
	}
	for (let index = 1; index < 3; index++) {
		assert(
			slabErrors[index] < slabErrors[index - 1] &&
				Math.abs(slabErrors[index] / slabErrors[index - 1] - 0.25) < 0.001,
			'manufactured smooth slab convergence',
		);
		assert(
			Math.abs(polynomialErrors[index] / polynomialErrors[index - 1] - 0.25) < 1e-12,
			'manufactured quadratic midpoint convergence',
		);
	}
	const near = independentUniform([{start: 0, end: 0.37}], 8, field),
		far = independentUniform([{start: 0.37, end: 1}], 8, field),
		composed = composeAdaptiveTransfers(near, far),
		whole = independentUniform(
			[
				{start: 0, end: 0.37},
				{start: 0.37, end: 1},
			],
			8,
			field,
		);
	for (let component = 0; component < 4; component++) {
		const error = Math.abs(composed.sources[component] - whole.sources[component]);
		maximumTransferError = Math.max(maximumTransferError, error);
		assert(error < 2e-15, 'A/B transfer composition identity up to declared regrouping roundoff');
	}
	assert(Math.abs(composed.attenuation - whole.attenuation) < 1e-15, 'transfer attenuation composition');
	const four = prepareAdaptiveRay([
		{start: 0, end: 1},
		{start: 1, end: 2},
		{start: 2, end: 3},
		{start: 3, end: 4},
	]);
	const foreground = evaluateAdaptiveRay(
		four,
		(node) => ({
			extinctionPerMeter: node.segmentIndex === 0 ? node.distance ** 2 : 0,
			densities: [
				node.segmentIndex === 3 ? 100 : node.segmentIndex === 1 ? 0.01 * (node.distance - 1) ** 2 : 0,
				0,
				0,
				0,
			],
		}),
		options,
	);
	assert(
		JSON.stringify(foreground.checkpoints[0].mesh) === JSON.stringify([4, 2, 2, 2]),
		'dark foreground with bright background outranks small local source error',
	);
	assert(
		foreground.checkpoints[1].counters.queriedNodes === 24 &&
			foreground.checkpoints[1].nextRefinementCost === 16 &&
			JSON.stringify(foreground.checkpoints[1].mesh) === JSON.stringify([8, 2, 2, 2]),
		'unaffordable top refinement leaves eight queries unused despite cheaper available segments',
	);
	const higherOnly = evaluateAdaptiveRay(
		four,
		(node) => ({
			extinctionPerMeter: 0,
			densities: [0, 0, 0, node.segmentIndex === 2 ? (node.distance - 2) ** 2 : 0],
		}),
		options,
	);
	assert(
		JSON.stringify(higherOnly.checkpoints[0].mesh) === JSON.stringify([2, 2, 4, 2]),
		'common mesh responds to N4-only variation',
	);
	const ties = evaluateAdaptiveRay(four, () => ({extinctionPerMeter: 0, densities: [1, 0, 0, 0]}), options);
	assert(JSON.stringify(ties.checkpoints[0].mesh) === JSON.stringify([4, 2, 2, 2]), 'equal priority lower-index tie');
	assert(
		JSON.stringify(ties.checkpoints[1].mesh) === JSON.stringify([4, 4, 4, 4]),
		'equal priority prefers lower active count before index',
	);
	// A smooth positive narrow bump misses every allowed midpoint. This deliberately
	// establishes that even zero indicators over the entire union are not error bounds.
	const center = 0.01,
		radius = 0.004;
	const alias = evaluateAdaptiveRay(
		single,
		(node) => {
			const t = (node.distance - center) / radius,
				bump = Math.abs(t) < 1 ? (1 - t * t) ** 2 : 0;
			return {extinctionPerMeter: 0, densities: [bump, 0, 0, 0]};
		},
		options,
	);
	const exactBumpIntegral = (16 * radius) / 15;
	assert(
		exactBumpIntegral > 0 && alias.checkpoints.every((result) => result.groupedRadiancesW[0] === 0),
		'finite-union aliasing counterexample retained',
	);
	return {
		schemaId: 'sky-adaptive-proof-v1',
		checks,
		maximumUniformParityError,
		maximumTransferError,
		slabErrors,
		polynomialErrors,
		scope: 'Manufactured geometry, bookkeeping, grouping, uniform parity, transfer and smooth-integral checks only. The retained positive-bump aliasing counterexample disproves treating the retrospective indicator or uniform16 as an exact reference. No atmospheric accuracy or predictable Kider gain is established.',
	};
}
