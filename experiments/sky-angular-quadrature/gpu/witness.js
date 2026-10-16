import {createPointStencilBuilder, viewPathIntervals} from '../../sky-accuracy-dials/numerics/view.js';

/** Accept exactly three finite vector components. @param {readonly number[]} values @returns {SkyVector3} */
function vector(values) {
	if (values.length !== 3 || !values.every(Number.isFinite)) throw new RangeError('Invalid witness vector.');
	return [values[0], values[1], values[2]];
}

/** Append matched horizon/upper-control rays while preserving every benchmark sample.
 * @param {SkyBuildRequest} request @param {SkyViewPlan} plan @returns {SkyViewPlan}
 */
export function appendWitness(request, plan) {
	const spec = request.transportSpec,
		theta = (14 * Math.PI) / 180,
		up = [Math.sin(theta), 0, Math.cos(theta)],
		tangent = [-Math.cos(theta), 0, Math.sin(theta)],
		across = [0, -1, 0];
	const origin = vector(up.map((x) => x * (spec.planet.bottomRadiusMeters + 5)));
	const builder = createPointStencilBuilder(request);
	const witness = plan.views.map((view) =>
		[0.05, 3, 20].flatMap((elevation) =>
			[0, 90, 180].map((heading) => {
				const e = (elevation * Math.PI) / 180,
					h = (heading * Math.PI) / 180;
				const direction = vector(
					up.map(
						(x, k) => Math.sin(e) * x + Math.cos(e) * (Math.cos(h) * tangent[k] + Math.sin(h) * across[k]),
					),
				);
				const b = origin.reduce((s, x, k) => s + x * direction[k], 0),
					r = spec.planet.topRadiusMeters;
				const length = -b + Math.sqrt(b * b + r * r - origin.reduce((s, x) => s + x * x, 0));
				const ray = {origin, direction, length};
				const samples = viewPathIntervals(spec, ray, view.viewRule, view.intervalCount).map(({start, end}) => {
					const t = (start + end) * 0.5;
					return builder.sample(vector(origin.map((x, k) => x + direction[k] * t)), direction, end - start);
				});
				return {
					sceneIndex: 17,
					sceneId: `horizon-${elevation}-${heading}`,
					time: 'noon-witness',
					gridX: heading / 90,
					gridY: [0.05, 3, 20].indexOf(elevation),
					origin,
					worldDirection: direction,
					length,
					samples,
				};
			}),
		),
	);
	const coordinates = [...plan.coordinates],
		index = new Map(coordinates.map((p, i) => [`${p.x}/${p.y}`, i]));
	const remap = builder.coordinates.map((p) => {
		const key = `${p.x}/${p.y}`;
		if (!index.has(key)) {
			index.set(key, coordinates.length);
			coordinates.push(p);
		}
		return index.get(key);
	});
	return {
		...plan,
		coordinates,
		rayCount: plan.rayCount + 9,
		views: plan.views.map((v, i) => ({
			...v,
			rays: [
				...v.rays,
				...witness[i].map((r) => ({
					...r,
					samples: r.samples.map((s) => ({...s, indices: s.indices.map((k) => remap[k])})),
				})),
			],
		})),
	};
}
