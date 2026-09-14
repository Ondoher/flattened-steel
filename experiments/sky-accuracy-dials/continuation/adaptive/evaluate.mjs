/** Admit the explicit joint-query cost contract shared by uniform and adaptive rules.
 * @param {SkyAdaptiveOptions} options - Runtime counting and diagnostic controls.
 * @returns {void} Returns after checking the complete small option boundary.
 */
function acceptOptions(options) {
	if (![4, 5].includes(options.scalarReconstructionsPerNode) || typeof options.retainMesh !== 'boolean')
		throw new RangeError('Adaptive evaluation requires explicit four/five-field cost and mesh selection.');
}

/** Allocate an algorithm-local lazy cache and charge before invoking the callback.
 * @param {SkyAdaptiveRay} ray - Prepared finite geometric union.
 * @param {SkyAdaptiveNodeEvaluator} evaluate - One joint medium/density evaluator.
 * @param {SkyAdaptiveOptions} options - Fixed callback cost contract.
 * @param {number} initialBudget - Maximum unique invocations currently permitted.
 * @returns {SkyAdaptiveCache} Counted access and immutable counter snapshots.
 */
function createCache(ray, evaluate, options, initialBudget) {
	/** @type {Map<number, SkyAdaptiveNodeValue>} */ const values = new Map();
	let budget = initialBudget,
		queriedNodes = 0,
		cacheHits = 0;
	return {
		get(id) {
			const previous = values.get(id);
			if (previous) {
				cacheHits++;
				return previous;
			}
			if (!Number.isInteger(id) || !ray.nodes[id] || queriedNodes >= budget)
				throw new RangeError('Adaptive joint-query identity or budget was exceeded.');
			queriedNodes++;
			const value = evaluate(ray.nodes[id]);
			if (
				!Number.isFinite(value.extinctionPerMeter) ||
				value.extinctionPerMeter < 0 ||
				value.densities.length !== 4 ||
				value.densities.some((density) => !Number.isFinite(density) || density < 0)
			)
				throw new RangeError(
					'Adaptive joint queries require finite nonnegative extinction and four densities.',
				);
			const retained = {
				extinctionPerMeter: value.extinctionPerMeter,
				densities: /** @type {SkyAdaptiveNodeValue['densities']} */ ([...value.densities]),
			};
			values.set(id, retained);
			return retained;
		},
		setBudget(nextBudget) {
			if (!Number.isInteger(nextBudget) || nextBudget < budget || nextBudget > ray.nodes.length)
				throw new RangeError('Adaptive budgets may only increase within the finite union.');
			budget = nextBudget;
		},
		counters() {
			return {
				queriedNodes,
				mediumEvaluations: queriedNodes,
				scalarReconstructions: options.scalarReconstructionsPerNode * queriedNodes,
				cacheHits,
			};
		},
	};
}

/** Apply the ordinary two-half-step fold to an ordered selection of cached nodes.
 * The four densities retain separate accumulators; no grouped field is reconstructed.
 * @param {SkyAdaptiveRay} ray - Prepared geometry.
 * @param {readonly number[]} ids - Active observer-to-top node order.
 * @param {SkyAdaptiveCache} cache - Counted joint values.
 * @returns {SkyAdaptiveTransfer} Separate source terms and whole-path attenuation.
 */
function foldNodes(ray, ids, cache) {
	let attenuation = 1;
	const sources = [0, 0, 0, 0];
	for (const id of ids) {
		const node = ray.nodes[id],
			value = cache.get(id),
			halfStep = Math.exp(-0.5 * value.extinctionPerMeter * node.step);
		attenuation *= halfStep;
		for (let component = 0; component < 4; component++)
			sources[component] += attenuation * value.densities[component] * node.step;
		attenuation *= halfStep;
	}
	if (!Number.isFinite(attenuation) || sources.some((value) => !Number.isFinite(value)))
		throw new RangeError('Adaptive transport produced a nonfinite result.');
	return {attenuation, sources};
}

/** Combine component radiances only after their independent integration folds.
 * @param {readonly number[]} components - J1 and three cumulative higher-order results.
 * @returns {readonly number[]} Grouped cumulative N1 through N4.
 */
function grouped(components) {
	const values = [
		components[0],
		components[0] + components[1],
		components[0] + components[2],
		components[0] + components[3],
	];
	if (values.some((value) => !Number.isFinite(value)))
		throw new RangeError('Adaptive grouped radiances must remain finite.');
	return values;
}

/** Select the largest attenuation-aware retrospective coarse/fine discrepancy per next query.
 * A common mesh uses the maximum indicator across grouped N1-N4. This is a priority
 * heuristic, not an estimate of the unknown next correction or an error bound.
 * @param {readonly SkyAdaptiveSegmentState[]} states - Current coarse/fine transfers.
 * @returns {number | null} Winning segment, or null after the entire finite union is used.
 */
function selectSegment(states) {
	const suffix = Array.from({length: states.length + 1}, () => [0, 0, 0, 0]);
	for (let index = states.length - 1; index >= 0; index--)
		for (let component = 0; component < 4; component++)
			suffix[index][component] =
				states[index].fine.sources[component] + states[index].fine.attenuation * suffix[index + 1][component];
	let prefix = 1,
		bestPriority = -1;
	/** @type {number | null} */ let bestIndex = null;
	for (const [index, state] of states.entries()) {
		if (state.level < 16) {
			const coarse = grouped(state.coarse.sources),
				fine = grouped(state.fine.sources),
				tail = grouped(suffix[index + 1]),
				attenuationDifference = Math.abs(state.fine.attenuation - state.coarse.attenuation),
				priority =
					Math.max(
						...fine.map(
							(value, order) =>
								prefix *
								(Math.abs(value - coarse[order]) + attenuationDifference * Math.abs(tail[order])),
						),
					) /
					(2 * state.level);
			if (
				priority > bestPriority ||
				(priority === bestPriority && bestIndex !== null && state.level < states[bestIndex].level)
			) {
				bestIndex = index;
				bestPriority = priority;
			}
		}
		prefix *= state.fine.attenuation;
	}
	return bestIndex;
}

/** Snapshot one active mesh using the ordinary whole-ray operation order.
 * @param {SkyAdaptiveRay} ray - Finite support.
 * @param {readonly SkyAdaptiveLevel[]} mesh - Active subdivision level per segment.
 * @param {SkyAdaptiveCache} cache - Counted values; the fold only reads cached active nodes.
 * @param {number} budget - Current joint-query ceiling.
 * @param {SkyAdaptiveOptions} options - Sparse mesh-retention contract.
 * @param {number} nextRefinementCost - Highest-priority next cost, or zero when exhausted.
 * @returns {SkyAdaptiveCheckpoint} Independently owned result and counter snapshot.
 */
function checkpoint(ray, mesh, cache, budget, options, nextRefinementCost) {
	const ids = ray.segments.flatMap((segment, index) => [...segment.levels[mesh[index]]]),
		transfer = foldNodes(ray, ids, cache);
	return {
		budget,
		activeNodeCount: ids.length,
		counters: cache.counters(),
		componentRadiancesW: transfer.sources,
		groupedRadiancesW: grouped(transfer.sources),
		transmittance: transfer.attenuation,
		mesh: options.retainMesh ? [...mesh] : null,
		nextRefinementCost,
	};
}

/** Evaluate one common N1-N4 adaptive mesh at three total-query budgets.
 * All level-one and level-two nodes are sampled first (3P queries, 2P active).
 * Refining active n to 2n consumes 2n NEW midpoint nodes. If the top-priority
 * refinement does not fit, leave capacity unused and continue that same prefix
 * at the next budget. There is no cheaper-segment backfill or convergence stop.
 * @param {SkyAdaptiveRay} ray - Geometry returned by prepareAdaptiveRay.
 * @param {SkyAdaptiveNodeEvaluator} evaluate - Identical callback used for uniform controls.
 * @param {SkyAdaptiveOptions} options - Four/five-field cost and sparse diagnostics.
 * @returns {SkyAdaptiveRayResult} 4P, 8P and 16P bounded prefix results.
 */
export function evaluateAdaptiveRay(ray, evaluate, options) {
	acceptOptions(options);
	const count = ray.segments.length;
	if (!count || ray.nodes.length !== 31 * count)
		throw new RangeError('Adaptive evaluation requires the complete 31P geometric union.');
	const cache = createCache(ray, evaluate, options, 4 * count);
	/** @type {SkyAdaptiveSegmentState[]} */ const states = ray.segments.map((segment) => ({
		level: 2,
		coarse: foldNodes(ray, segment.levels[1], cache),
		fine: foldNodes(ray, segment.levels[2], cache),
	}));
	/** @type {SkyAdaptiveCheckpoint[]} */ const checkpoints = [];
	for (const budget of [4 * count, 8 * count, 16 * count]) {
		cache.setBudget(budget);
		let selected = selectSegment(states);
		while (selected !== null && cache.counters().queriedNodes + 2 * states[selected].level <= budget) {
			const state = states[selected],
				nextLevel = /** @type {SkyAdaptiveLevel} */ (2 * state.level),
				fine = foldNodes(ray, ray.segments[selected].levels[nextLevel], cache);
			states[selected] = {level: nextLevel, coarse: state.fine, fine};
			selected = selectSegment(states);
		}
		const result = checkpoint(
			ray,
			states.map((state) => state.level),
			cache,
			budget,
			options,
			selected === null ? 0 : 2 * states[selected].level,
		);
		if (result.counters.queriedNodes !== 2 * result.activeNodeCount - count)
			throw new Error('Adaptive query accounting violated the disjoint dyadic-union identity.');
		checkpoints.push(result);
	}
	return {
		schemaId: 'sky-adaptive-ray-result-v1',
		preparedQueryCount: ray.nodes.length,
		checkpoints,
		indicatorPolicy:
			'Maximum grouped N1-N4 retrospective coarse/fine source-plus-downstream-attenuation indicator per NEXT query; no error bound or quarter-law assumption. Ties use lower active level then segment index. All coarse/trial queries count; no cheaper backfill.',
	};
}

/** Evaluate a uniform control through a fresh instance of the same joint counted cache.
 * No adaptive cache values are reused. The final arithmetic is the same four
 * separate whole-ray half-step folds, with grouping only after integration.
 * @param {SkyAdaptiveRay} ray - Shared geometry and precomputed sparse support.
 * @param {SkyAdaptiveNodeEvaluator} evaluate - Same callback as the adaptive comparison.
 * @param {4 | 8 | 16} level - Uniform substeps per physical altitude segment.
 * @param {SkyAdaptiveOptions} options - Identical declared joint callback cost.
 * @returns {SkyAdaptiveCheckpoint} Exact level-times-P counted uniform control.
 */
export function evaluateUniformAdaptiveRay(ray, evaluate, level, options) {
	acceptOptions(options);
	if (![4, 8, 16].includes(level) || !ray.segments.length || ray.nodes.length !== 31 * ray.segments.length)
		throw new RangeError('Uniform adaptive controls require the complete union and level 4, 8 or 16.');
	const budget = level * ray.segments.length,
		cache = createCache(ray, evaluate, options, budget),
		mesh = ray.segments.map(() => level);
	return checkpoint(ray, mesh, cache, budget, options, 0);
}

/** Compose segment transfers for manufactured verification and documented priority semantics.
 * Final runtime radiances still use the whole-ray fold, avoiding composition regrouping.
 * @param {SkyAdaptiveTransfer} near - Transfer nearest the observer.
 * @param {SkyAdaptiveTransfer} far - Following transfer in ray order.
 * @returns {SkyAdaptiveTransfer} A=Anear*Afar and B=Bnear+Anear*Bfar.
 */
export function composeAdaptiveTransfers(near, far) {
	if (near.sources.length !== 4 || far.sources.length !== 4)
		throw new RangeError('Transfer composition requires four separate source components.');
	return {
		attenuation: near.attenuation * far.attenuation,
		sources: near.sources.map((value, component) => value + near.attenuation * far.sources[component]),
	};
}
