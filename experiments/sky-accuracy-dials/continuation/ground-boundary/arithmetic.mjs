import assert from 'node:assert/strict';
import {assertGroundArithmeticPrecision} from './arithmetic-precision.js';

/** Published ES3.00 bounds with one-ULP rounding-mode allowance retained explicitly. */
export const groundArithmeticPolicy = Object.freeze({
	schemaId: 'sky-ground-arithmetic-policy-v1',
	specification: 'https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf',
	sections: ['4.5.1', '4.5.2', '4.5.4', '8'],
	basicRelative: 2 ** -23,
	samplerRelative: 2 ** -23,
	divisionUlps: 3.5,
	inverseSquareRootUlps: 3,
	expUlpsConstant: 4,
	expUlpsSlope: 2,
	miePowInputRange: [1 / 16, 4],
	miePowExponent: 1.5,
	incomingCount: 512,
	requiredLowFloatPrecision: 23,
	requiredHighFloatPrecision: 23,
	requiredRangeMin: 126,
	requiredRangeMax: 127,
	primitiveScope:
		'Receiver-local anchored exact ground, positive solar cosine, explicit channel coefficients, disabled ozone.',
});
const epsilon = 2 ** -23,
	minimumNormal = 2 ** -126;
const bits = new DataView(new ArrayBuffer(8));
/** Next binary64 number, providing outward CPU arithmetic independently of host transcendental accuracy.
 * @param {number} value @param {boolean} upward @returns {number}
 */
function adjacent(value, upward) {
	if (!Number.isFinite(value)) return value;
	if (value === 0) return upward ? Number.MIN_VALUE : -Number.MIN_VALUE;
	bits.setFloat64(0, value);
	let word = bits.getBigUint64(0);
	word += value > 0 === upward ? 1n : -1n;
	bits.setBigUint64(0, word);
	return bits.getFloat64(0);
}
/** @param {number} value @returns {SkyGroundArithmeticInterval} */
function exact(value) {
	assert.ok(Number.isFinite(value));
	return [value, value];
}
/** @param {number} lo @param {number} hi @returns {SkyGroundArithmeticInterval} */
function interval(lo, hi) {
	assert.ok(Number.isFinite(lo) && Number.isFinite(hi) && lo <= hi);
	return [lo, hi];
}
/** @param {SkyGroundArithmeticInterval} a @param {SkyGroundArithmeticInterval} b @returns {SkyGroundArithmeticInterval} */
function add(a, b) {
	if (a[0] === 0 && a[1] === 0) return b;
	if (b[0] === 0 && b[1] === 0) return a;
	return interval(adjacent(a[0] + b[0], false), adjacent(a[1] + b[1], true));
}
/** @param {SkyGroundArithmeticInterval} a @returns {SkyGroundArithmeticInterval} */
function neg(a) {
	return [-a[1], -a[0]];
}
/** @param {SkyGroundArithmeticInterval} a @param {SkyGroundArithmeticInterval} b @returns {SkyGroundArithmeticInterval} */
function sub(a, b) {
	return add(a, neg(b));
}
/** @param {SkyGroundArithmeticInterval} a @param {SkyGroundArithmeticInterval} b @returns {SkyGroundArithmeticInterval} */
function mul(a, b) {
	if ((a[0] === 0 && a[1] === 0) || (b[0] === 0 && b[1] === 0)) return exact(0);
	const p = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]];
	return interval(adjacent(Math.min(...p), false), adjacent(Math.max(...p), true));
}
/** @param {SkyGroundArithmeticInterval} a @param {SkyGroundArithmeticInterval} b @returns {SkyGroundArithmeticInterval} */
function div(a, b) {
	assert.ok(b[0] > 0 || b[1] < 0);
	if (a[0] === 0 && a[1] === 0) return exact(0);
	return mul(a, interval(adjacent(1 / b[1], false), adjacent(1 / b[0], true)));
}
/** @param {SkyGroundArithmeticInterval} a @param {number} lo @param {number} hi @returns {SkyGroundArithmeticInterval} */
function clamp(a, lo, hi) {
	return [Math.max(lo, Math.min(hi, a[0])), Math.max(lo, Math.min(hi, a[1]))];
}
/** @param {SkyGroundArithmeticInterval} a @returns {number} */
function magnitude(a) {
	return Math.max(Math.abs(a[0]), Math.abs(a[1]));
}
/** Basic highp rounding plus permitted subnormal flushing; no round-to-nearest assumption.
 * @param {SkyGroundArithmeticInterval} a @param {number} [ulps] @returns {SkyGroundArithmeticInterval}
 */
function gpu(a, ulps = 1) {
	if (a[0] === 0 && a[1] === 0) return a;
	const error = adjacent(ulps * epsilon * magnitude(a) + minimumNormal, true);
	return interval(adjacent(a[0] - error, false), adjacent(a[1] + error, true));
}
/** @param {SkyGroundArithmeticInterval} a @param {SkyGroundArithmeticInterval} b @returns {SkyGroundArithmeticInterval} */
function ga(a, b) {
	return gpu(add(a, b));
}
/** @param {SkyGroundArithmeticInterval} a @param {SkyGroundArithmeticInterval} b @returns {SkyGroundArithmeticInterval} */
function gs(a, b) {
	return gpu(sub(a, b));
}
/** @param {SkyGroundArithmeticInterval} a @param {SkyGroundArithmeticInterval} b @returns {SkyGroundArithmeticInterval} */
function gm(a, b) {
	return gpu(mul(a, b));
}
/** @param {SkyGroundArithmeticInterval} a @param {SkyGroundArithmeticInterval} b @returns {SkyGroundArithmeticInterval} */
function gd(a, b) {
	return gpu(div(a, b), groundArithmeticPolicy.divisionUlps);
}
/** Exact binary64 input and adjacent binary32 representations enclose any permitted literal rounding.
 * @param {number} value @returns {SkyGroundArithmeticInterval}
 */
function literal(value) {
	const rounded = Math.fround(value);
	if (rounded === value) return exact(value);
	const error = epsilon * Math.max(Math.abs(value), Math.abs(rounded));
	return interval(
		adjacent(Math.min(value, rounded) - error, false),
		adjacent(Math.max(value, rounded) + error, true),
	);
}
/** Independently bracket sqrt by verifying squared endpoints; Math.sqrt is only an initial guess.
 * @param {SkyGroundArithmeticInterval} a @returns {SkyGroundArithmeticInterval}
 */
function root(a) {
	assert.ok(a[0] >= 0);
	if (a[1] === 0) return exact(0);
	let lo = a[0] === 0 ? 0 : Math.sqrt(a[0]),
		hi = Math.sqrt(a[1]);
	for (let i = 0; i < 16 && lo > 0 && mul(exact(lo), exact(lo))[1] > a[0]; i++) lo = adjacent(lo, false);
	for (let i = 0; i < 16 && mul(exact(hi), exact(hi))[0] < a[1]; i++) hi = adjacent(hi, true);
	assert.ok((lo === 0 || mul(exact(lo), exact(lo))[1] <= a[0]) && mul(exact(hi), exact(hi))[0] >= a[1]);
	return interval(lo, hi);
}
/** Published sqrt inherits reciprocal of inversesqrt, including the permitted rounding mode.
 * @param {SkyGroundArithmeticInterval} a @returns {SkyGroundArithmeticInterval}
 */
function gr(a) {
	const ideal = root(a);
	if (ideal[1] === 0) return ideal;
	const reciprocal = gpu(div(exact(1), ideal), groundArithmeticPolicy.inverseSquareRootUlps);
	return gd(exact(1), reciprocal);
}
/** Rigorous rational Taylor enclosure of exp for a bounded real interval.
 * @param {SkyGroundArithmeticInterval} x @returns {SkyGroundArithmeticInterval}
 */
export function groundArithmeticExp(x) {
	assert.ok(x[0] >= -64 && x[1] <= 64);
	const z = div(x, exact(128));
	let term = exact(1),
		sum = exact(1);
	for (let n = 1; n <= 24; n++) {
		term = div(mul(term, z), exact(n));
		sum = add(sum, term);
	}
	// |z|<=1/2; exp(|z|)<2, so the order24 Lagrange remainder is below 2|z|^25/25!.
	const next = div(mul(term, z), exact(25)),
		remainder = adjacent(2 * magnitude(next), true);
	sum = add(sum, [-remainder, remainder]);
	for (let n = 0; n < 7; n++) sum = mul(sum, sum);
	assert.ok(sum[0] > 0);
	return sum;
}
/** @param {SkyGroundArithmeticInterval} x @returns {SkyGroundArithmeticInterval} */
function ge(x) {
	return gpu(groundArithmeticExp(x), 4 + 2 * magnitude(x));
}

/** Conservative pow(x,1.5) relative bound inherited from log2, multiply, exp2 over [1/16,4].
 * The exact real x^1.5 is computed as x*sqrt(x), avoiding reliance on a CPU pow implementation.
 * @returns {number} Frozen outward relative envelope, independent of target residuals.
 */
export function groundArithmeticPowRelative() {
	const logError = adjacent(Math.max(4 * epsilon * 4, 2 ** -21 + epsilon), true);
	const productError = adjacent(1.5 * logError + epsilon * (6 + 1.5 * logError), true);
	// ln2 < 0.7, and exp(t)-1 <= t/(1-t) for 0<=t<1.
	const argument = adjacent(0.7 * productError, true),
		variation = adjacent(argument / (1 - argument), true);
	const exponential = adjacent((4 + 2 * (6 + productError)) * epsilon, true);
	return adjacent((1 + variation) * (1 + exponential) - 1, true);
}
/** @param {SkyGroundArithmeticInterval} x @returns {SkyGroundArithmeticInterval} */
function gp(x) {
	assert.ok(x[0] >= 1 / 16 && x[1] <= 4);
	const ideal = mul(x, root(x)),
		relative = groundArithmeticPowRelative();
	return mul(ideal, [1 - relative, 1 + relative]);
}

/** Bound actual anchored B0 at one selected positive-solar exact-ground knot.
 * @param {SkySixCommonParameters} p @param {number} solar @returns {SkyGroundArithmeticSource}
 */
function source(p, solar) {
	assert.equal(p.coordinateContract, 'scene-cache-receiver-local-v1');
	assert.equal(p.numericalPolicy.positionMethod, 'anchored-radial');
	assert.equal(p.positionAltitudesMeters[0], 0);
	assert.equal(p.sourcePathTransmittanceIntervalCount, 80);
	assert.ok(p.rayleighScattering > 0 && p.mieExtinction > 0 && p.ozoneCrossSection === 0);
	const R = literal(p.bottomRadiusMeters),
		top = literal(p.topRadiusMeters),
		height = gs(top, R);
	const c = literal(Math.cos((p.solarZenithDegrees[solar] * Math.PI) / 180));
	assert.ok(c[0] > 0 && c[1] < 0.999, 'Only the selected well-separated illuminated solar knots are admitted.');
	const projection = gm(R, c),
		topTerm = gm(neg(height), ga(R, top));
	const distance = gd(neg(topTerm), ga(projection, gr(gs(gm(projection, projection), topTerm))));
	const step = gd(distance, exact(80)),
		rSquared = gm(R, R);
	let tau = exact(0);
	for (let i = 0; i <= 80; i++) {
		const d = gm(step, exact(i)),
			difference = gm(d, ga(gm(exact(2), projection), d));
		const altitude = i === 0 ? exact(0) : clamp(gd(difference, ga(gr(ga(rSquared, difference)), R)), 0, Infinity);
		const r = gm(literal(p.rayleighScattering), ge(neg(gd(altitude, literal(p.rayleighScaleHeightMeters))))),
			m = gm(literal(p.mieExtinction), ge(neg(gd(altitude, literal(p.mieScaleHeightMeters))))),
			extinction = ga(r, m),
			term = gm(gm(extinction, step), exact(i === 0 || i === 80 ? 0.5 : 1));
		tau = ga(tau, term);
	}
	const transmission = ge(neg(tau));
	// The actual intervention uses normalize(representativePoint).z, not the exact solar-cosine table entry.
	const pointX = gm(R, gr(clamp(gs(exact(1), gm(c, c)), 0, Infinity))),
		pointZ = gm(R, c);
	const normSquared = ga(gm(pointX, pointX), gm(pointZ, pointZ));
	const inverseNorm = gpu(div(exact(1), root(normSquared)), groundArithmeticPolicy.inverseSquareRootUlps);
	const incidence = clamp(gm(pointZ, inverseNorm), 0, 1);
	const b0 = gd(
		gm(gm(gm(literal(p.sourceIrradiance), transmission), incidence), literal(p.groundAlbedo)),
		literal(Math.PI),
	);
	const betaR = gm(literal(p.rayleighScattering), ge(exact(0))),
		betaM = gm(gm(literal(p.mieExtinction), ge(exact(0))), literal(p.mieSingleScatteringAlbedo));
	assert.ok(b0[0] > 0 && betaR[0] > 0 && betaM[0] > 0);
	return {b0, betaR, betaM, transmission, incidence, opticalDepth: tau};
}

/** Bound highp phase arithmetic on bounded lowp fetches of packed local vectors; no world-frame rotation enters this shader.
 * @param {SkyVector3} outgoing @param {SkyVector3} incoming @param {number} asymmetry
 * @returns {SkyGroundArithmeticPhase}
 */
function phase(outgoing, incoming, asymmetry) {
	const products = outgoing.map((value, i) => gm(gpu(exact(value)), gpu(exact(incoming[i]))));
	const cosine = clamp(ga(ga(products[0], products[1]), products[2]), -1, 1),
		onePlus = ga(exact(1), gm(cosine, cosine));
	const pi = literal(Math.PI),
		g = literal(asymmetry),
		g2 = gm(g, g);
	const rayleigh = gm(gd(exact(3), gm(exact(16), pi)), onePlus);
	const normalization = gm(gd(exact(3), gm(exact(8), pi)), gd(gs(exact(1), g2), ga(exact(2), g2)));
	const denominator = clamp(gs(ga(exact(1), g2), gm(gm(exact(2), g), cosine)), 1e-7, Infinity);
	const mie = gd(gm(normalization, onePlus), gp(denominator));
	const idealCosine = Math.max(
			-1,
			Math.min(
				1,
				outgoing.reduce((s, v, i) => s + v * incoming[i], 0),
			),
		),
		idealRayleigh = (3 / (16 * Math.PI)) * (1 + idealCosine ** 2),
		idealDenominator = 1 + asymmetry ** 2 - 2 * asymmetry * idealCosine,
		idealMie =
			((((3 / (8 * Math.PI)) * (1 - asymmetry ** 2)) / (2 + asymmetry ** 2)) * (1 + idealCosine ** 2)) /
			(idealDenominator * Math.sqrt(idealDenominator));
	assert.ok(rayleigh[0] > 0 && mie[0] > 0);
	return {rayleigh, mie, idealRayleigh, idealMie, powBase: denominator};
}

/** Freeze source/phase/rounding intervals before any corrected target values exist.
 * @param {SkyGroundBoundaryPredictionInputs} inputs - Exact independently reconstructed driver inputs.
 * @param {readonly SkyGroundArithmeticNode[]} nodes - Selected original ground coordinates and packed outgoing vectors.
 * @returns {SkyGroundArithmeticPlan} Operand-dependent prospective enclosure coefficients.
 */
export function prepareGroundArithmetic(inputs, nodes) {
	const p = inputs.commonParameters,
		packed = inputs.incomingPackedFloat32;
	assert.equal(p.incomingDirectionCount, 512);
	assert.equal(p.miePhaseFunctionG, 0.7);
	assert.equal(inputs.groundHemisphere, 'incomingRecord.z < 0');
	assert.equal(inputs.sourceTransmittanceOperation, 'multiply');
	assert.equal(packed.length, 2048);
	assert.ok(packed.every((v) => Number.isFinite(v) && Math.fround(v) === v));
	assert.ok(nodes.length > 0 && nodes.length <= 128);
	const sources = new Map(),
		phases = new Map(),
		powRelative = groundArithmeticPowRelative();
	const gamma = adjacent((514 * epsilon) / (1 - 514 * epsilon), true),
		flushAllowance = 2 ** -108;
	const rows = nodes.map((node) => {
		assert.ok(
			Number.isSafeInteger(node.x) &&
				Number.isSafeInteger(node.y) &&
				node.y % p.positionAltitudesMeters.length === 0,
		);
		const solar = node.y / p.positionAltitudesMeters.length;
		assert.ok(solar >= 0 && solar < p.solarZenithDegrees.length);
		const sourceKey = String(solar);
		if (!sources.has(sourceKey)) sources.set(sourceKey, source(p, solar));
		const local = /** @type {SkyGroundArithmeticSource} */ (sources.get(sourceKey));
		assert.ok(node.outgoingDirectionFloat32.every((v) => Number.isFinite(v) && Math.fround(v) === v));
		const phaseKey = JSON.stringify(node.outgoingDirectionFloat32);
		if (!phases.has(phaseKey)) {
			const all = Array.from({length: 512}, (_, i) =>
				phase(
					node.outgoingDirectionFloat32,
					/** @type {SkyVector3} */ ([packed[i * 4], packed[i * 4 + 1], packed[i * 4 + 2]]),
					p.miePhaseFunctionG,
				),
			);
			phases.set(phaseKey, all);
		}
		const all = /** @type {SkyGroundArithmeticPhase[]} */ (phases.get(phaseKey));
		let added = exact(0),
			rayleighSum = 0,
			mieSum = 0,
			maxScatteringRatio = 1,
			maxWeightedFactorRatio = 1,
			halfCount = 0;
		let minimumPowBase = Infinity,
			maximumPowBase = 0;
		for (let i = 0; i < 512; i++) {
			const item = all[i],
				weight = packed[i * 4 + 3],
				z = packed[i * 4 + 2];
			assert.ok(weight > 0 && Math.abs(z) > 1e-5);
			const scattering = ga(gm(local.betaR, item.rayleigh), gm(local.betaM, item.mie));
			assert.ok(scattering[0] > 0);
			maxScatteringRatio = Math.max(maxScatteringRatio, div(exact(scattering[1]), exact(scattering[0]))[1]);
			const fetchedWeight = gpu(exact(weight));
			assert.ok(fetchedWeight[0] > 0 && scattering[1] * fetchedWeight[1] < 1);
			maxWeightedFactorRatio = Math.max(
				maxWeightedFactorRatio,
				div(
					mul(exact(scattering[1]), exact(fetchedWeight[1])),
					mul(exact(scattering[0]), exact(fetchedWeight[0])),
				)[1],
			);
			minimumPowBase = Math.min(minimumPowBase, item.powBase[0]);
			maximumPowBase = Math.max(maximumPowBase, item.powBase[1]);
			if (z < 0) {
				halfCount++;
				added = add(added, mul(mul(local.b0, scattering), fetchedWeight));
				rayleighSum += weight * item.idealRayleigh;
				mieSum += weight * item.idealMie;
			}
		}
		assert.equal(halfCount, 256);
		const fetchRatio = div(add(exact(1), exact(epsilon)), sub(exact(1), exact(epsilon)));
		const maxUpperTermRatio = mul(exact(maxWeightedFactorRatio), fetchRatio)[1];
		assert.ok(maxUpperTermRatio <= 1.01);
		const oldMultiplier = sub(
			mul(div(add(exact(1), exact(gamma)), sub(exact(1), exact(gamma))), exact(maxUpperTermRatio)),
			exact(1),
		)[1];
		const b0Mid = (local.b0[0] + local.b0[1]) / 2,
			idealPacked =
				b0Mid * (p.rayleighScattering * rayleighSum + p.mieExtinction * p.mieSingleScatteringAlbedo * mieSum),
			analyticRayleigh = (b0Mid * p.rayleighScattering) / 2,
			packedRayleighDeviation = b0Mid * p.rayleighScattering * Math.abs(rayleighSum - 0.5);
		return {
			...node,
			solarZenithIndex: solar,
			source: local,
			addedUnaccumulated: added,
			maxScatteringRatio,
			maxUpperTermRatio,
			minimumPowBase,
			maximumPowBase,
			oldShadowMultiplier: oldMultiplier,
			idealPacked,
			analyticRayleigh,
			packedRayleighDeviation,
			packedRayleighHalfspace: rayleighSum,
			packedMieHalfspace: mieSum,
		};
	});
	return {
		schemaId: 'sky-ground-arithmetic-plan-v1',
		policy: groundArithmeticPolicy,
		powRelative,
		gamma,
		flushAllowance,
		rows,
		prerequisite:
			'Actual fragment LOW_FLOAT and HIGH_FLOAT must advertise at least23 precision bits and the declared range; one-part-in2^23 sampler uncertainty remains included; otherwise reject before target recurrence.',
		scope: 'Conditional on exact original L1 sharing and anchored inward-ground zero proved by the source schedule; all upper-hemisphere arithmetic differences remain covered by the observed nonnegative shadow times the frozen multiplier.',
	};
}

/** Compare actual raw ground differences with the frozen operand-based intervals.
 * @param {SkyGroundArithmeticPlan} plan - Prepared before corrected field computation.
 * @param {SkyGroundArithmeticPrecision} precision - Actual admitted same-context formats.
 * @param {readonly SkyGroundBoundaryGroundSample[]} samples - Actual shadow/corrected endpoint observations.
 * @returns {SkyGroundArithmeticAssessment} No threshold is fitted to the measured residuals.
 */
export function assessGroundArithmetic(plan, precision, samples) {
	assertGroundArithmeticPrecision(precision);
	assert.equal(plan.schemaId, 'sky-ground-arithmetic-plan-v1');
	assert.equal(samples.length, plan.rows.length);
	const rows = samples.map((sample, i) => {
		const row = plan.rows[i];
		assert.equal(sample.x, row.x);
		assert.equal(sample.y, row.y);
		assert.deepEqual(sample.outgoingDirectionFloat32, row.outgoingDirectionFloat32);
		assert.ok(
			Number.isFinite(sample.shadowValue) &&
				sample.shadowValue >= 0 &&
				sample.shadowValue <= 1 &&
				Number.isFinite(sample.correctedValue) &&
				sample.correctedValue >= 0 &&
				sample.correctedValue <= 1,
		);
		assert.equal(Math.fround(sample.shadowValue), sample.shadowValue);
		assert.equal(Math.fround(sample.correctedValue), sample.correctedValue);
		assert.equal(sample.difference, sample.correctedValue - sample.shadowValue);
		const shadow = sample.shadowValue,
			comparisonAllowance = adjacent(shadow * row.oldShadowMultiplier, true);
		const accumulationAllowance = add(
			mul(exact(plan.gamma), exact(row.addedUnaccumulated[1])),
			exact(plan.flushAllowance),
		)[1];
		const lower = sub(
				sub(exact(row.addedUnaccumulated[0]), exact(comparisonAllowance)),
				exact(accumulationAllowance),
			)[0],
			upper = add(
				add(exact(row.addedUnaccumulated[1]), exact(comparisonAllowance)),
				exact(accumulationAllowance),
			)[1];
		return {
			x: row.x,
			y: row.y,
			expected: row.idealPacked,
			actualDifference: sample.difference,
			lower,
			upper,
			sourceAndPhaseAllowance: Math.max(
				Math.abs(row.idealPacked - row.addedUnaccumulated[0]),
				Math.abs(row.addedUnaccumulated[1] - row.idealPacked),
			),
			originalShadowComparisonAllowance: comparisonAllowance,
			accumulationAllowance,
			packedRayleighDeviation: row.packedRayleighDeviation,
			state: sample.difference >= lower && sample.difference <= upper ? 'passed' : 'failed',
		};
	});
	return {
		schemaId: 'sky-ground-arithmetic-assessment-v1',
		rows,
		state: rows.every((r) => r.state === 'passed') ? 'passed' : 'failed',
		scope: 'Local J2-only ground arithmetic under advertised storage precision; not a whole-view, later-order boundary or physical-reference qualification.',
	};
}
