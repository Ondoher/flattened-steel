/** Stable source-centered radius excess at a fixed altitude.
 * @param {number} rho - Nonnegative horizontal offset, meters.
 * @param {number} distance - Absolute source-to-altitude axis distance, meters.
 * @returns {number} - Euclidean radius minus axis distance, without cancellation.
 */
export function radiusExcess(rho, distance) {
	if (!Number.isFinite(rho) || rho < 0 || !Number.isFinite(distance) || distance < 0)
		throw new Error('Invalid shell coordinates.');
	return rho === 0 ? 0 : rho * (rho / (Math.hypot(rho, distance) + distance));
}

/** Locate a strictly ordered axis, preserving exact endpoint weights.
 * @param {number[]} values - Physical axis values.
 * @param {number} query - Admitted query value.
 * @returns {LocalSunShellAxisTap} - Adjacent samples and upper weight.
 */
function axis(values, query) {
	if (query <= values[0]) return {lower: 0, upper: 0, weight: 0};
	const last = values.length - 1;
	if (query >= values[last]) return {lower: last, upper: last, weight: 0};
	let upper = 1;
	while (values[upper] < query) upper++;
	if (values[upper] === query) return {lower: upper, upper, weight: 0};
	return {lower: upper - 1, upper, weight: (query - values[upper - 1]) / (values[upper] - values[upper - 1])};
}

/** Derive one atmosphere-clipped Euclidean shell mesh with explicit axis/outer support.
 * Physical shell IDs are independent of compact sample addresses. Empty inner
 * bands never receive samples; no unoccupied rectangular slots are allocated.
 * @param {LocalSunShellLayoutRequest} request - Pinned slab, coverage and resolution.
 * @returns {LocalSunShellLayout} - Executable positions and per-altitude reconstruction rows.
 */
export function createShellLayout(request) {
	const {height, top, maximumRho, altitudes, radialFractions} = request;
	if (!(height > top && top > 0 && maximumRho > 0) || ![height, top, maximumRho].every(Number.isFinite))
		throw new Error('Initial shell layout requires a finite source above the atmosphere.');
	if (altitudes[0] !== 0 || altitudes.at(-1) !== top || radialFractions[0] !== 0 || radialFractions.at(-1) !== 1)
		throw new Error('Complete axis and coverage endpoints are required.');
	for (const values of [altitudes, radialFractions])
		for (let i = 0; i < values.length; i++)
			if (!Number.isFinite(values[i]) || (i > 0 && values[i] <= values[i - 1]))
				throw new Error('Shell controls must be strictly ordered.');
	const minimum = height - top;
	const middle = height - top / 2;
	const radii = [...new Set([
		0, minimum * 0.00001, minimum * 0.001, minimum * 0.01,
		minimum * 0.1, minimum * 0.5, minimum * 0.9, minimum,
		...altitudes.map(z => height - z),
		...radialFractions.map(f => Math.hypot(middle, maximumRho * f)),
		...(request.axisSupport ? radialFractions.filter(f => maximumRho * f <= Math.sqrt(top * (2 * height + top))).map(f => Math.hypot(height, maximumRho * f)) : []),
		Math.hypot(height, maximumRho),
	])].sort((a, b) => a - b);
	const bands = radii.slice(0, -1).map((inner, id) => ({
		id, inner, outer: radii[id + 1], admitted: radii[id + 1] >= minimum,
	}));
	/** @type {LocalSunShellLayoutNode[]} */
	const nodes = [];
	const rows = altitudes.map((z, rowIndex) => {
		const distance = height - z;
		const maximum = Math.hypot(distance, maximumRho);
		const rowRadii = [...new Set([distance, ...radii.filter(r => r > distance && r < maximum), maximum])];
		const indices = rowRadii.map(r => {
			const excess = r === distance ? 0 : r === maximum ? radiusExcess(maximumRho, distance) : r - distance;
			const rho = r === maximum ? maximumRho : Math.sqrt(excess * (2 * distance + excess));
			const next = radii.findIndex(v => v > r);
			const band = next < 0 ? bands.length - 1 : Math.max(0, next - 1);
			const index = nodes.length;
			nodes.push({index, rowIndex, band, z, rho, radius: r, excess});
			return index;
		});
		return {z, indices, excesses: indices.map(i => nodes[i].excess)};
	});
	if (nodes.some(n => !bands[n.band].admitted)) throw new Error('Allocated an empty shell band.');
	return {schema: 'local-sun-shell-layout-v1', interpolation:'euclidean-radius', height, top, maximumRho, radii, bands, nodes, rows,
		omittedBands: bands.filter(b => !b.admitted).map(b => b.id)};
}

/** Resolve altitude and Euclidean-radius interpolation through compact addresses.
 * @param {LocalSunShellLayout} layout - Executable admitted shell mesh.
 * @param {number} rho - Source-relative horizontal distance, meters.
 * @param {number} z - Physical altitude, meters.
 * @returns {ScatteringCachePositionStencil} - Up to four nonzero compact field taps.
 */
export function shellStencil(layout, rho, z) {
	if (!Number.isFinite(rho) || !Number.isFinite(z) || rho < 0 || rho > layout.maximumRho + 1e-6 || z < -1e-6 || z > layout.top + 1e-6)
		throw new Error('Shell query is outside declared atmosphere/coverage.');
	const zs = axis(layout.rows.map(r => r.z), z);
	const euclidean=layout.interpolation==='euclidean-radius';
	const queryExcess=radiusExcess(rho,layout.height-z);
	let lowerExcess=queryExcess+(layout.rows[zs.lower].z-z),upperExcess=queryExcess+(layout.rows[zs.upper].z-z);
	if(euclidean && zs.lower!==zs.upper) {
		if(lowerExcess<0) {lowerExcess=0;upperExcess=queryExcess/zs.weight;}
		else if(upperExcess>layout.rows[zs.upper].excesses.at(-1)) {
			upperExcess=layout.rows[zs.upper].excesses.at(-1);
			lowerExcess=(queryExcess-zs.weight*upperExcess)/(1-zs.weight);
		}
	}
	const taps = new Map();
	for (const [rowIndex, zWeight] of [[zs.lower, 1 - zs.weight], [zs.upper, zs.weight]]) {
		if (zWeight === 0) continue;
		const row = layout.rows[rowIndex];
		const radial = axis(row.excesses, euclidean ? rowIndex===zs.lower ? lowerExcess : upperExcess : radiusExcess(rho, layout.height - row.z));
		for (const [column, radialWeight] of [[radial.lower, 1 - radial.weight], [radial.upper, radial.weight]]) {
			const weight = zWeight * radialWeight;
			if (weight > 0) {
				const index = row.indices[column];
				taps.set(index, (taps.get(index) ?? 0) + weight);
			}
		}
	}
	return {indices: [...taps.keys()], weights: [...taps.values()]};
}

/** Generate identical compact interpolation for runtime and construction GLSL.
 * No absolute-radius subtraction occurs in query arithmetic.
 * @param {LocalSunShellLayout} layout - Proven mesh and address mapping.
 * @returns {string} - GLSL declarations and shellStencil(float,float) function.
 */
export function shellStencilGlsl(layout) {
	const literal = (/** @type {number} */ n) => Number.isInteger(n) ? `${n}.0` : n.toPrecision(17);
	const zs = layout.rows.map(r => literal(r.z));
	const offsets = layout.rows.map(r => r.indices[0]);
	const counts = layout.rows.map(r => r.indices.length);
	const excesses = layout.nodes.map(n => literal(n.excess));
	const excessDeclaration=layout.reconstruction ?
		'float shellNodeExcess(int index) { return texelFetch(uShellExcessNodes,ivec2(index,0),0).r; }' :
		`const float SHELL_E[${excesses.length}] = float[${excesses.length}](${excesses.join(',')});\nfloat shellNodeExcess(int index) { return SHELL_E[index]; }`;
	const rowQueries=layout.interpolation==='euclidean-radius' ? `float axisDistance=${literal(layout.height)}-z;
	float queryExcess=rho==0.0 ? 0.0 : rho*(rho/(length(vec2(rho,axisDistance))+axisDistance));
	float lowerExcess=queryExcess+(SHELL_Z[zl]-z),upperExcess=queryExcess+(SHELL_Z[zu]-z);
	if(zw>0.0 && zw<1.0) {
		float upperMaximum=shellNodeExcess(SHELL_OFFSET[zu]+SHELL_COUNT[zu]-1);
		if(lowerExcess<0.0) {lowerExcess=0.0;upperExcess=queryExcess/zw;}
		else if(upperExcess>upperMaximum) {upperExcess=upperMaximum;lowerExcess=(queryExcess-zw*upperMaximum)/(1.0-zw);}
	}
	shellRowExcess(lowerExcess,zl,a,b,rw0);shellRowExcess(upperExcess,zu,c,d,rw1);` :
		'shellRow(rho,zl,a,b,rw0); shellRow(rho,zu,c,d,rw1);';
	return `const int SHELL_Z_COUNT = ${zs.length};
const float SHELL_Z[${zs.length}] = float[${zs.length}](${zs.join(',')});
const int SHELL_OFFSET[${zs.length}] = int[${zs.length}](${offsets.join(',')});
const int SHELL_COUNT[${zs.length}] = int[${zs.length}](${counts.join(',')});
${excessDeclaration}
void shellRowExcess(float e, int row, out int low, out int high, out float weight) {
	int first = SHELL_OFFSET[row];
	int last = first + SHELL_COUNT[row] - 1;
	low = first; high = first; weight = 0.0;
	if (e <= shellNodeExcess(first)) return;
	if (e >= shellNodeExcess(last)) { low = last; high = last; return; }
	low=first;high=last;
	for(int iteration=0;iteration<${Math.ceil(Math.log2(Math.max(...layout.rows.map(r=>r.indices.length))))};++iteration) {
		if(high-low<=1)break;
		int middle=(low+high)/2;
		if(e<=shellNodeExcess(middle))high=middle;else low=middle;
	}
	weight=(e-shellNodeExcess(low))/(shellNodeExcess(high)-shellNodeExcess(low));
}
void shellRow(float rho, int row, out int low, out int high, out float weight) {
	float d = ${literal(layout.height)} - SHELL_Z[row];
	float e = rho == 0.0 ? 0.0 : rho * (rho / (length(vec2(rho,d)) + d));
	shellRowExcess(e,row,low,high,weight);
}
CachePositionStencil shellStencil(float rho, float z) {
	int zl = 0; int zu = 0; float zw = 0.0;
	if (z >= SHELL_Z[SHELL_Z_COUNT-1]) { zl = SHELL_Z_COUNT-1; zu = zl; }
	else if (z > SHELL_Z[0]) {
		for (int i=1; i<SHELL_Z_COUNT; ++i) if(z <= SHELL_Z[i]) {
			zl=i-1; zu=i; zw=(z-SHELL_Z[zl])/(SHELL_Z[zu]-SHELL_Z[zl]); break;
		}
	}
	int a; int b; int c; int d; float rw0; float rw1;
	${rowQueries}
	vec4 weights=vec4((1.0-zw)*(1.0-rw0),(1.0-zw)*rw0,zw*(1.0-rw1),zw*rw1);
	if(rho<0.0 || rho>${literal(layout.maximumRho)}+1.0 || z< -1.0 || z>${literal(layout.top)}+1.0)
		weights=vec4(uintBitsToFloat(0x7fc00000u));
	return CachePositionStencil(ivec4(a,b,c,d), weights);
}`;
}
