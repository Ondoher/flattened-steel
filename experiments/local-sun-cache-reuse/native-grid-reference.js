import {primaryDensity, primaryOpticalDepth, primaryBoundary} from './primary-oracle.js';

/** Find a complete positive tensor bracket without extrapolation.
 * @param {readonly number[]} nodes - Strictly ordered physical support.
 * @param {number} value - Admitted coordinate.
 * @returns {{index:number,weight:number}} - Lower node and upper-node fraction.
 */
function bracket(nodes, value) {
	if (value < nodes[0] - 1e-6 || value > nodes.at(-1) + 1e-6)
		throw new Error('Independent grid query outside support.');
	value = Math.max(nodes[0], Math.min(nodes.at(-1), value));
	let low = 0,
		high = nodes.length - 1;
	while (high - low > 1) {
		const mid = (low + high) >> 1;
		if (value < nodes[mid]) high = mid;
		else low = mid;
	}
	return {index: low, weight: (value - nodes[low]) / (nodes[low + 1] - nodes[low])};
}

/** Reconstruct an independent rho/z/polar/cyclic-azimuth source function.
 * @param {LocalSunNativeFieldGrid} grid - Native binary64 grids, never candidate fields.
 * @param {Float64Array} field - One independently computed normalized spectral order.
 * @param {readonly number[]} point - Canonical source-relative physical point.
 * @param {readonly number[]} direction - Unit physical propagation direction.
 * @returns {number} - Positive source function J/extinction.
 */
export function nativeGridSample(grid, field, point, direction) {
	const stencil = nativeGridStencil(grid, point, direction);
	return stencil.indices.reduce((sum, index, tap) => sum + stencil.weights[tap] * field[index], 0);
}

/** Derive positive tensor taps once for a physical query shared by all spectral orders.
 * @param {LocalSunNativeFieldGrid} grid - Independent tensor support.
 * @param {readonly number[]} point - Admitted source-relative point, meters.
 * @param {readonly number[]} direction - Unit physical propagation direction.
 * @returns {LocalSunNativeTensorStencil} - Complete positive support; no field values are cached.
 */
function nativeGridStencil(grid, point, direction) {
	const rho = Math.hypot(point[0], point[1]),
		r = bracket(grid.radial, rho),
		z = bracket(grid.altitudes, point[2]),
		m = bracket(grid.polar, direction[2]);
	let phi =
		(Math.atan2(direction[1], direction[0]) - (rho === 0 ? 0 : Math.atan2(point[1], point[0]))) % (2 * Math.PI);
	if (phi < 0) phi += 2 * Math.PI;
	const coordinate = (phi * grid.azimuthCount) / (2 * Math.PI),
		p = Math.floor(coordinate),
		pw = coordinate - p;
	const indices = [],
		weights = [];
	for (let zi = 0; zi < 2; zi++)
		for (let ri = 0; ri < 2; ri++)
			for (let mi = 0; mi < 2; mi++)
				for (let pi = 0; pi < 2; pi++) {
					const weight =
						(zi ? z.weight : 1 - z.weight) *
						(ri ? r.weight : 1 - r.weight) *
						(mi ? m.weight : 1 - m.weight) *
						(pi ? pw : 1 - pw);
					if (weight === 0) continue;
					const index =
						(((z.index + zi) * grid.radial.length + r.index + ri) * grid.polar.length + m.index + mi) *
							grid.azimuthCount +
						((p + pi) % grid.azimuthCount);
					indices.push(index);
					weights.push(weight);
				}
	return {indices, weights};
}

/** Derive the actual finite observer-dome path independently of cache sampling.
 * @param {LocalSunFrozenPlacement} state - Frozen physical source, observer and dome facts.
 * @param {number} radius - Independent physical cylinder radius, meters.
 * @param {readonly number[]} direction - Unit physical direction.
 * @returns {LocalSunNativeViewPath} - Canonical source-relative origin and finite path.
 */
export function nativeViewPath(state, radius, direction) {
	const geometry = state.geometry,
		observer = geometry.observerPosition.coordinates,
		source = geometry.sourcePosition.coordinates;
	const point = [observer[0] - source[0], observer[1] - source[1], observer[2]];
	const dome = geometry.observerCenteredDome;
	if (!dome || Math.abs(Math.hypot(...direction) - 1) > 1e-12)
		throw new Error('Pinned dome and unit ingress required.');
	const delta = observer.map((value, index) => value - dome.sphereCenter.coordinates[index]);
	const distance = Math.hypot(...delta),
		inside = (dome.sphereRadius.value - distance) * (dome.sphereRadius.value + distance);
	if (inside < 0 || Math.hypot(point[0], point[1]) > radius)
		throw new Error('Observer is outside the independent dome/cylinder.');
	const projection = delta.reduce((sum, value, index) => sum + value * direction[index], 0),
		root = Math.sqrt(projection * projection + inside);
	const domeEnd = projection >= 0 ? inside / (root + projection) : -projection + root;
	const length = Math.min(domeEnd, primaryBoundary(point, direction, radius, geometry.topAltitude.value));
	const end = point.map((value, index) => value + direction[index] * length);
	return {
		point,
		direction: [...direction],
		length,
		end,
		transmittance: primaryOpticalDepth(
			point[2],
			Math.max(0, Math.min(geometry.topAltitude.value, end[2])),
			Math.max(length, Math.abs(end[2] - point[2])),
		).map((tau) => Math.exp(-tau)),
	};
}

/** Generate positive physical-distance Gauss-Legendre taps independently.
 * @param {number} count - Selected even rule order.
 * @returns {LocalSunNativeGaussianTap[]} - Symmetric unit-interval rule mapped later.
 */
export function gaussRule(count) {
	if (![2, 4, 8, 16, 32, 64, 128, 256].includes(count)) throw new Error('Unsupported independent Gaussian quadrature.');
	const taps = [];
	for (let i = 0; i < count; i++) {
		let x = Math.cos((Math.PI * (i + 0.75)) / (count + 0.5)),
			derivative = 0;
		for (let iteration = 0; iteration < 32; iteration++) {
			let previous = 1,
				current = x;
			for (let degree = 2; degree <= count; degree++) {
				const next = ((2 * degree - 1) * x * current - (degree - 1) * previous) / degree;
				previous = current;
				current = next;
			}
			derivative = (count * (x * current - previous)) / (x * x - 1);
			const step = current / derivative;
			x -= step;
			if (Math.abs(step) < 1e-15) break;
		}
		taps.push({node: x, weight: 2 / ((1 - x * x) * derivative * derivative)});
	}
	if (Math.abs(taps.reduce((sum, tap) => sum + tap.weight, 0) - 2) > 1e-12)
		throw new Error('Independent Gaussian mass mismatch.');
	return taps;
}

/** Split the finite path at independent tensor knots and physical density/tau scales.
 * @param {LocalSunNativeFieldGrid} grid - Complete independent spatial/angular support.
 * @param {LocalSunNativeViewPath} path - Pinned finite viewing segment.
 * @returns {number[]} - Strictly ordered integration cuts, including retained endpoints.
 */
function pathCuts(grid, path) {
	const {point: p, direction: d} = path;
	let length = path.length;
	const altitude = (t) => Math.max(0, Math.min(grid.top, p[2] + d[2] * t));
	if (
		Math.min(...primaryOpticalDepth(p[2], altitude(length), Math.max(length, Math.abs(altitude(length) - p[2])))) >
		32
	) {
		let low = 0,
			high = length;
		for (let i = 0; i < 48; i++) {
			const mid = (low + high) / 2;
			if (
				Math.min(...primaryOpticalDepth(p[2], altitude(mid), Math.max(mid, Math.abs(altitude(mid) - p[2])))) >
				32
			)
				high = mid;
			else low = mid;
		}
		length = high;
	}
	const cuts = [0, length],
		add = (value) => {
			if (Number.isFinite(value) && value > 0 && value < length) cuts.push(value);
		};
	if (d[2] !== 0) {
		for (const z of grid.altitudes) add((z - p[2]) / d[2]);
		for (let z = 0; z <= 12000; z += 250) add((z - p[2]) / d[2]);
		for (let z = 16000; z <= 40000; z += 4000) add((z - p[2]) / d[2]);
		for (let z = 48000; z <= grid.top; z += 8000) add((z - p[2]) / d[2]);
	}
	const a = d[0] * d[0] + d[1] * d[1],
		b = p[0] * d[0] + p[1] * d[1],
		rho = Math.hypot(p[0], p[1]);
	if (a > 0) {
		add(-b / a);
		for (const radius of grid.radial) {
			const discriminant = b * b - a * (rho - radius) * (rho + radius);
			if (discriminant >= 0) {
				const root = Math.sqrt(discriminant);
				add((-b - root) / a);
				add((-b + root) / a);
			}
		}
		const angle = Math.atan2(d[1], d[0]);
		for (let i = 0; i < grid.azimuthCount; i++) {
			const phi = angle - (2 * Math.PI * i) / grid.azimuthCount,
				c = Math.cos(phi),
				s = Math.sin(phi),
				denominator = d[0] * s - d[1] * c;
			if (Math.abs(denominator) < 1e-14) continue;
			const t = -(p[0] * s - p[1] * c) / denominator;
			if ((p[0] + d[0] * t) * c + (p[1] + d[1] * t) * s >= 0) add(t);
		}
	}
	const total = primaryOpticalDepth(p[2], altitude(length), Math.max(length, Math.abs(altitude(length) - p[2])))[0];
	for (const tau of [0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32])
		if (tau < total) {
			let low = 0,
				high = length;
			for (let i = 0; i < 40; i++) {
				const mid = (low + high) / 2;
				if (primaryOpticalDepth(p[2], altitude(mid), Math.max(mid, Math.abs(altitude(mid) - p[2])))[0] > tau)
					high = mid;
				else low = mid;
			}
			add((low + high) / 2);
		}
	return [...new Set(cuts)].sort((x, y) => x - y);
}

/** Integrate continuous J1 and native J2/J3/J4 along the actual finite view.
 * @param {LocalSunNativeFieldGrid} grid - Independent source functions, medium and support.
 * @param {LocalSunFrozenPlacement} state - Exact compatible physical state.
 * @param {readonly number[]} direction - Unit physical propagation direction.
 * @param {number} order - Independent Gaussian path refinement.
 * @returns {LocalSunNativeViewResult} - Complete per-order and total binary64 spectra.
 */
export function nativeViewRadiance(grid, state, direction, order) {
	const path = nativeViewPath(state, grid.radius, direction),
		cuts = pathCuts(grid, path),
		taps = gaussRule(order);
	const values = Array.from({length: 4}, () => new Array(15).fill(0)),
		corrections = Array.from({length: 4}, () => new Array(15).fill(0));
	let samples = 0;
	for (let i = 1; i < cuts.length; i++) {
		const half = (cuts[i] - cuts[i - 1]) / 2,
			mid = cuts[i - 1] + half;
		for (const tap of taps) {
			const t = mid + half * tap.node,
				p = path.point.map((value, index) => value + path.direction[index] * t);
			p[2] = Math.max(0, Math.min(grid.top, p[2]));
			const transmission = primaryOpticalDepth(
				path.point[2],
				p[2],
				Math.max(t, Math.abs(p[2] - path.point[2])),
			).map((tau) => Math.exp(-tau));
			const primary = primaryDensity(state, p, path.direction);
			const stencil = nativeGridStencil(grid, p, path.direction);
			for (let c = 0; c < 15; c++) {
				const extinction =
					grid.betaR[c] * Math.exp(-p[2] / grid.rayleighHeight) +
					grid.betaM[c] * Math.exp(-p[2] / grid.mieHeight);
				for (let n = 0; n < 4; n++) {
					const density =
						n === 0
							? primary[c]
							: extinction *
								stencil.indices.reduce(
									(sum, index, tap) => sum + stencil.weights[tap] * grid.fields[n - 1][c][index],
									0,
								);
					const add = half * tap.weight * transmission[c] * density - corrections[n][c],
						next = values[n][c] + add;
					corrections[n][c] = next - values[n][c] - add;
					values[n][c] = next;
				}
			}
			samples++;
		}
	}
	return {
		path,
		orders: values,
		total: values[0].map((_, c) => values.reduce((sum, v) => sum + v[c], 0)),
		samples,
		retainedLength: cuts.at(-1),
	};
}

/** Measure the finite view's positive attenuation/extinction operator without any source fields.
 * @param {LocalSunNativeFieldGrid} grid - Authenticated independent geometry and medium; fields are unused.
 * @param {LocalSunFrozenPlacement} state - Exact physical view state.
 * @param {readonly number[]} direction - Unit physical direction.
 * @param {number} order - The consumer's Gaussian path order.
 * @returns {LocalSunNativeKernelMassResult} - Per-channel positive mass and actual quadrature count.
 */
export function nativeViewKernelMass(grid, state, direction, order) {
	const path=nativeViewPath(state,grid.radius,direction),cuts=pathCuts(grid,path),taps=gaussRule(order),mass=new Array(15).fill(0);
	let samples=0;
	for(let i=1;i<cuts.length;i++) {
		const half=(cuts[i]-cuts[i-1])/2,mid=cuts[i-1]+half;
		for(const tap of taps) {
			const t=mid+half*tap.node,z=Math.max(0,Math.min(grid.top,path.point[2]+path.direction[2]*t));
			const tau=primaryOpticalDepth(path.point[2],z,Math.max(t,Math.abs(z-path.point[2])));
			for(let c=0;c<15;c++)mass[c]+=half*tap.weight*Math.exp(-tau[c])*(grid.betaR[c]*Math.exp(-z/grid.rayleighHeight)+grid.betaM[c]*Math.exp(-z/grid.mieHeight));
			samples++;
		}
	}
	if(mass.some(value=>!Number.isFinite(value) || value<0))throw new Error('Invalid positive view kernel mass.');
	return {mass,samples};
}
