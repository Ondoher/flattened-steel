/** Piecewise-linear, nonnegative aerosol model; input coefficients are per meter. */
export function interpolate(nodes, values, altitude) {
	let lo = 0, hi = nodes.length - 1;
	const h = Math.max(nodes[0], Math.min(nodes[hi], altitude));
	while (hi - lo > 1) {const mid = (lo + hi) >> 1; if (nodes[mid] <= h) lo = mid; else hi = mid;}
	return values[lo] + (values[hi] - values[lo]) * (h - nodes[lo]) / (nodes[hi] - nodes[lo]);
}

/** Emit the exact same tabulated density interpolation used by CPU and reference exports. */
export function densityShader(profile) {
	const nodes = profile.altitudesMeters, values = profile.extinction550PerMeter.map(v => v / profile.extinction550PerMeter[0]);
	return `const float ARM_HEIGHT[${nodes.length}]=float[](${nodes.map(v => v.toExponential(12)).join(',')});
const float ARM_DENSITY[${nodes.length}]=float[](${values.map(v => v.toExponential(12)).join(',')});
float armAerosolDensity(float altitude){
 float h=clamp(altitude,ARM_HEIGHT[0],ARM_HEIGHT[${nodes.length - 1}]);int lo=0,hi=${nodes.length - 1};
 for(int i=0;i<${Math.ceil(Math.log2(nodes.length))};i++){int mid=(lo+hi)/2;if(h>=ARM_HEIGHT[mid])lo=mid;else hi=mid;}
 lo=min(lo,${nodes.length-2});float t=clamp((h-ARM_HEIGHT[lo])/(ARM_HEIGHT[lo+1]-ARM_HEIGHT[lo]),0.0,1.0);
 return mix(ARM_DENSITY[lo],ARM_DENSITY[lo+1],t);
}`;
}

/** Adapt the production compiler's medium expression without altering its recurrence or numerics. */
export function adaptCompilerShader(source, profile) {
	const needle = /float mieExtinction = mieSeaLevel\s*\* exp\(-altitudeMeters \/ MIE_SCALE_HEIGHT\);/u;
	if (!needle.test(source)) throw Error('Compiler medium expression changed');
	const anchor = source.indexOf('struct Medium {');
	if (anchor < 0) throw Error('Compiler medium declaration missing');
	return (source.slice(0, anchor) + densityShader(profile) + '\n' + source.slice(anchor))
		.replace(needle, 'float mieExtinction = mieSeaLevel * armAerosolDensity(altitudeMeters);');
}
