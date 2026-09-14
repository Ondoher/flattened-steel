import {createPointStencilBuilder, viewPathIntervals} from '../../numerics/view.js';

/** Construct the disjoint midpoint union without evaluating medium or cached density.
 * Exact subinterval arithmetic matches viewPathIntervals, including endpoint handling.
 * @param {readonly SkyPathInterval[]} intervals - Contiguous positive observer-distance segments.
 * @returns {SkyAdaptiveRay} Geometric finite support with exactly 31 nodes per segment.
 */
export function prepareAdaptiveRay(intervals) {
	if (!intervals.length || intervals.length > 128)
		throw new RangeError('Adaptive rays require one to 128 physical segments.');
	/** @type {SkyAdaptiveNode[]} */ const nodes = [];
	/** @type {SkyAdaptiveSegment[]} */ const segments = [];
	for (const [segmentIndex, interval] of intervals.entries()) {
		if (
			!Number.isFinite(interval.start) ||
			!Number.isFinite(interval.end) ||
			!(interval.end > interval.start) ||
			interval.start !== (segmentIndex === 0 ? 0 : intervals[segmentIndex - 1].end)
		)
			throw new RangeError('Adaptive physical segments must start at zero and join exactly.');
		/** @type {Record<SkyAdaptiveLevel, number[]>} */ const levels = {1: [], 2: [], 4: [], 8: [], 16: []};
		const length = interval.end - interval.start;
		for (const level of /** @type {readonly SkyAdaptiveLevel[]} */ ([1, 2, 4, 8, 16])) {
			for (let substepIndex = 0; substepIndex < level; substepIndex++) {
				const start = substepIndex === 0 ? interval.start : interval.start + length * (substepIndex / level),
					end =
						substepIndex === level - 1
							? interval.end
							: interval.start + length * ((substepIndex + 1) / level),
					distance = (start + end) * 0.5;
				if (!(end > start) || !(distance > start && distance < end))
					throw new RangeError('Adaptive subdivisions must have distinct interior binary64 midpoints.');
				const id = nodes.length;
				levels[level].push(id);
				nodes.push({id, segmentIndex, level, substepIndex, start, end, distance, step: end - start});
			}
		}
		const segmentNodes = nodes.slice(nodes.length - 31);
		if (new Set(segmentNodes.map((node) => node.distance)).size !== 31)
			throw new RangeError('Adaptive midpoint levels must remain disjoint in binary64 geometry.');
		segments.push({interval: {...interval}, levels});
	}
	return {segments, nodes};
}

/** Prepare all permitted reconstruction queries without treating them as runtime samples.
 * The returned coordinate identities are local; callers may remap them into a capture union.
 * @param {SkyBuildRequest} buildRequest - Fixed physical/cache geometry.
 * @param {readonly SkyReferenceProbe[]} probes - Caller-frozen ordinary or sparse diagnostic rays.
 * @returns {SkyAdaptiveViewPlan} Ephemeral 31P support and ordered reconstruction samples.
 */
export function prepareAdaptiveViewPlan(buildRequest, probes) {
	if (!probes.length || probes.length > 1417 || new Set(probes.map((probe) => probe.id)).size !== probes.length)
		throw new RangeError('Adaptive support requires one to 1417 uniquely identified rays.');
	const stencil = createPointStencilBuilder(buildRequest);
	const rays = probes.map((probe) => {
		const geometry = prepareAdaptiveRay(
			viewPathIntervals(buildRequest.transportSpec, probe.ray, 'altitude-segmented', 1),
		);
		const samples = geometry.nodes.map((node) => {
			const point = /** @type {SkyVector3} */ ([
				probe.ray.origin[0] + probe.ray.direction[0] * node.distance,
				probe.ray.origin[1] + probe.ray.direction[1] * node.distance,
				probe.ray.origin[2] + probe.ray.direction[2] * node.distance,
			]);
			return stencil.sample(point, probe.ray.direction, node.step);
		});
		return {probe, geometry, samples};
	});
	return {
		schemaId: 'sky-adaptive-view-plan-v1',
		coordinates: stencil.coordinates,
		rays,
		preparedQueryCount: rays.reduce((sum, ray) => sum + ray.geometry.nodes.length, 0),
		levels: [1, 2, 4, 8, 16],
	};
}
