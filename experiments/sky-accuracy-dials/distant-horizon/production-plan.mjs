import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER as domain} from '../../../src/algorithm32/sampling-domains/index.js';

/** Build the union of exact production lookup taps for matched quadratic view rays.
 * @param {DistantSunSceneCacheCompilerBuildRequest} request Unmodified production domains with matched physical coefficients.
 * @param {HorizonReferenceMedium} medium Authenticated H40 medium with zero aerosol.
 * @returns {HorizonProductionPlan} Frozen scalar lookup support and physical samples.
 */
export function makePlan(request, medium) {
	const nodes = request.transportSpec.domains.position.nodes.map(n => n.altitudeMeters);
	const coordinates = [], rows = [], coordinateMap = new Map(), rowMap = new Map();
	const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
	const unit = v => v.map(x => x / Math.hypot(...v));
	const source = medium.sourceDirection;
	const origin = [0, 0, medium.radius + 5];
	const jobs = [];
	for (const elevation of [0.05, 3, 20]) for (const intervals of [30, 60, 120]) {
		const angle = elevation * Math.PI / 180;
		const direction = [0, Math.cos(angle), Math.sin(angle)];
		const projection = origin[2] * direction[2];
		const c = (origin[2] - medium.radius - medium.topAltitude) * (origin[2] + medium.radius + medium.topAltitude);
		const length = -projection + Math.sqrt(projection * projection - c);
		const samples = [];
		for (let i = 0; i < intervals; i++) {
			const a = length * (i / intervals) ** 2, b = length * ((i + 1) / intervals) ** 2;
			const point = origin.map((x, k) => x + direction[k] * (a + b) / 2);
			const up = unit(point), mu = dot(up, source);
			const along = unit(source.map((x, k) => x - mu * up[k]));
			const across = [up[1] * along[2] - up[2] * along[1], up[2] * along[0] - up[0] * along[2], up[0] * along[1] - up[1] * along[0]];
			const local = /** @type {UnitVector3} */ ([dot(direction, along), dot(direction, across), dot(direction, up)]);
			const stencil = domain.resolveStencil(local);
			const face = domain.unflattenNodeIndex(stencil.indices[0]).faceIndex;
			const uv = [0, 0];
			stencil.indices.forEach((d, k) => {const n = domain.unflattenNodeIndex(d); uv[0] += n.uIndex * stencil.weights[k]; uv[1] += n.vIndex * stencil.weights[k];});
			const coordinate = [face, ...uv].map(Math.fround);
			const height = Math.max(0, Math.hypot(...point) - medium.radius);
			let upper = nodes.findIndex(x => x >= height); if (upper < 0) upper = nodes.length - 1;
			upper = Math.max(1, upper); const lower = upper - 1;
			const fraction = Math.max(0, Math.min(1, (height - nodes[lower]) / (nodes[upper] - nodes[lower])));
			const zenith = Math.fround(Math.max(0, Math.min(179, Math.acos(Math.max(-1, Math.min(1, mu))) * 180 / Math.PI - 0.5)));
			const lowerSolar = Math.min(178, Math.floor(zenith));
			const taps = [lower, upper].map(p => Array.from({length: 4}, (_, t) => {
				const z = Math.max(0, Math.min(179, lowerSolar + t - 1)), rowKey = `${p}:${z}`;
				if (!rowMap.has(rowKey)) {rowMap.set(rowKey, rows.length); rows.push({position: p, zenith: z});}
				return stencil.indices.map(d => {
					const key = `${p}:${z}:${d}`;
					if (!coordinateMap.has(key)) {coordinateMap.set(key, coordinates.length); coordinates.push({x: d, y: z * nodes.length + p, row: rowMap.get(rowKey)});}
					return coordinateMap.get(key);
				});
			}));
			samples.push({coordinate, zenith, altitudeIndices: [lower, upper], altitudeWeights: [1 - fraction, fraction].map(Math.fround), height: Math.fround(height), step: Math.fround(b - a), taps});
		}
		jobs.push({elevation, intervals, direction, length, samples});
	}
	return {coordinates, rows, jobs};
}
