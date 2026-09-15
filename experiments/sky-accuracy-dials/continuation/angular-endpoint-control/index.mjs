import assert from 'node:assert/strict';
import {phase} from '../../numerics/direct.js';
import {dot, unit, localDirection, clamp} from '../../numerics/math.js';
import {componentGauss, incidentWorld} from '../j2/angular.mjs';
import {sunFrameGroups} from '../angular-frame/geometry.mjs';
import {
	reconstructionValue as value,
	reconstructionSum as sum,
	reconstructionDifference as difference,
} from '../source-reconstruction/index.mjs';

const matrix = /** @type {const} */ ([
	['ring32-a64', 'ring-mu', 32, 64],
	['mu8-a16', 'split-mu', 8, 16],
	['mu16-a32', 'split-mu', 16, 32],
	['mu16-a64', 'split-mu', 16, 64],
	['mu32-a64', 'split-mu', 32, 64],
	['mu64-a64', 'split-mu', 64, 64],
	['mu32-a128', 'split-mu', 32, 128],
	['theta16-a64', 'split-theta', 16, 64],
]);

/** Same source-radial azimuth zero as sunFrameGroups.
 * @param {SkyVector3} origin @returns {{radial:SkyVector3,first:SkyVector3,second:SkyVector3}}
 */
function frame(origin) {
	const radial = unit(origin);
	assert.ok(Math.hypot(radial[0], radial[1]) > 1e-8);
	const first = unit([radial[0], radial[1], 0]);
	return {radial, first, second: [-first[1], first[0], 0]};
}

/** Boundaries solve a*cos(theta)+b*sin(theta)=q on the registered unique branch.
 * @param {number} a @param {number} b @param {number} q @returns {{theta:number,residual:number}}
 */
function boundary(a, b, q) {
	assert.ok([a, b, q].every(Number.isFinite) && a > Math.abs(q));
	const theta = Math.atan2(b, a) + Math.acos(q / Math.hypot(a, b));
	assert.ok(theta > 0 && theta < Math.PI);
	const residual = Math.abs(a * Math.cos(theta) + b * Math.sin(theta) - q);
	assert.ok(residual <= 256 * Number.EPSILON);
	return {theta, residual};
}

/** Physical theta intervals use the exact analytic boundaries of the old mu
 * construction. The positive sin(theta) Jacobian is never renormalized.
 * @param {number} bottom @param {SkyVector3} origin
 * @returns {{nodes:SkyAngularEndpointNode[],maximumBoundaryResidual:number}}
 */
function thetaNodes(bottom, origin) {
	const {radial, first, second} = frame(origin),
		radius = Math.hypot(...origin),
		height = radius - bottom;
	assert.ok(Number.isFinite(bottom) && bottom > 0 && height > 1e-6);
	const horizon = -Math.sqrt(height * (radius + bottom)) / radius,
		step = (2 * Math.PI) / 64;
	const branches = /** @type {const} */ (['volume-ground', 'volume-escaping', 'volume-outward']);
	/** @type {SkyAngularEndpointNode[]} */ const nodes = [];
	let maximumBoundaryResidual = 0;
	for (let i = 0; i < 32; i++) {
		const phi = (i + 0.5) * step,
			c = Math.cos(phi),
			s = Math.sin(phi);
		const basis = /** @type {SkyVector3} */ ([c * first[0] + s * second[0], c * first[1] + s * second[1], 0]);
		const b = dot(radial, basis),
			ground = boundary(radial[2], b, horizon),
			tangent = boundary(radial[2], b, 0);
		maximumBoundaryResidual = Math.max(maximumBoundaryResidual, ground.residual, tangent.residual);
		const ends = [Math.PI, ground.theta, tangent.theta, 0];
		assert.ok(ends.every((x, index) => index === 0 || x < ends[index - 1]));
		for (let segment = 0; segment < 3; segment++) {
			const low = ends[segment + 1],
				high = ends[segment],
				half = (high - low) / 2,
				centre = (high + low) / 2;
			for (const root of componentGauss(16)) {
				const theta = centre + half * root.node,
					sine = Math.sin(theta),
					cosine = Math.cos(theta);
				const weight = half * root.weight * step * sine;
				assert.ok(theta > low && theta < high && weight > 0);
				for (const sign of [1, -1]) {
					const world = /** @type {SkyVector3} */ ([
						sine * (c * first[0] + sign * s * second[0]),
						sine * (c * first[1] + sign * s * second[1]),
						cosine,
					]);
					const direction = incidentWorld(origin, localDirection(origin, world));
					nodes.push({direction, weight, branch: branches[segment]});
				}
			}
		}
	}
	assert.equal(nodes.length, 3 * 16 * 64);
	return {nodes, maximumBoundaryResidual};
}

/** @param {number} bottom @param {SkyVector3} origin @param {number} polarCount @param {number} azimuthCount
 * @returns {SkyAngularEndpointNode[]}
 */
function muNodes(bottom, origin, polarCount, azimuthCount) {
	return sunFrameGroups(bottom, origin, polarCount, azimuthCount).flatMap(({incident, branch}) => {
		assert.ok(incident.mirror);
		return [incident.direction, incident.mirror].map((local) => ({
			direction: incidentWorld(origin, local),
			weight: incident.weight,
			branch,
		}));
	});
}

/** One fixed shared-mu ring control with radial-projection azimuth zero.
 * @param {SkyVector3} origin @returns {SkyAngularEndpointNode[]}
 */
function ringNodes(origin) {
	const {first, second} = frame(origin),
		step = (2 * Math.PI) / 64;
	return componentGauss(32).flatMap(({node, weight}) => {
		const radius = Math.sqrt(Math.max(0, 1 - node * node));
		return Array.from({length: 64}, (_, i) => {
			const phi = (i + 0.5) * step,
				c = Math.cos(phi),
				s = Math.sin(phi);
			return {
				direction: unit([
					radius * (c * first[0] + s * second[0]),
					radius * (c * first[1] + s * second[1]),
					node,
				]),
				weight: weight * step,
				branch: null,
			};
		});
	});
}

/** Full F retains the old weight*source*scatter operation order. Odd uncertainty
 * scales both pre-subtraction operands rather than the small cancelled result.
 * @param {readonly SkyAngularEndpointNode[]} nodes @param {number} bottom @param {SkyVector3} origin
 * @param {SkyVector3} outgoing @param {(c:number)=>number} density
 * @returns {{full:SkySourceReconstructionValue,even:SkySourceReconstructionValue,odd:SkySourceReconstructionValue,polynomial:SkySourceReconstructionValue,solidAngle:SkySourceReconstructionValue,maximumUnitResidual:number,positiveWeights:boolean,branchesValid:boolean}}
 */
function integrate(nodes, bottom, origin, outgoing, density) {
	const {radial, first} = frame(origin),
		radius = Math.hypot(...origin),
		height = radius - bottom;
	const horizon = -Math.sqrt(height * (radius + bottom)) / radius;
	let full = 0,
		even = 0,
		odd = 0,
		polynomial = 0,
		fullScale = 0,
		pairScale = 0,
		polynomialScale = 0,
		angle = 0,
		weightScale = 0;
	let maximumUnitResidual = 0,
		positiveWeights = true,
		branchesValid = true;
	for (const {direction: w, weight, branch} of nodes) {
		assert.ok(w.length === 3 && w.every(Number.isFinite) && Number.isFinite(weight));
		positiveWeights &&= weight > 0;
		maximumUnitResidual = Math.max(maximumUnitResidual, Math.abs(Math.hypot(...w) - 1));
		if (branch !== null) {
			const cosine = dot(radial, w),
				actual = cosine < horizon ? 'volume-ground' : cosine < 0 ? 'volume-escaping' : 'volume-outward';
			branchesValid &&= actual === branch;
		}
		const turned = /** @type {SkyVector3} */ ([-w[0], -w[1], w[2]]);
		const source = density(clamp(w[2], -1, 1)),
			scatter = density(clamp(dot(outgoing, w), -1, 1)),
			reverse = density(clamp(dot(outgoing, turned), -1, 1));
		assert.ok([source, scatter, reverse].every((x) => Number.isFinite(x) && x >= 0));
		const term = weight * source * scatter,
			paired = weight * source * reverse,
			poly = weight * (1 + w[2]) ** 4 * dot(w, first);
		full += term;
		fullScale += Math.abs(term);
		even += (term + paired) / 2;
		odd += (term - paired) / 2;
		pairScale += (Math.abs(term) + Math.abs(paired)) / 2;
		polynomial += poly;
		polynomialScale += Math.abs(poly);
		angle += weight;
		weightScale += Math.abs(weight);
	}
	return {
		full: value(full, 8192 * Number.EPSILON * fullScale + 1e-13),
		even: value(even, 8192 * Number.EPSILON * pairScale + 1e-13),
		odd: value(odd, 8192 * Number.EPSILON * pairScale + 1e-13),
		polynomial: value(polynomial, 8192 * Number.EPSILON * polynomialScale + 1e-13),
		solidAngle: value(angle, 8192 * Number.EPSILON * (weightScale + 4 * Math.PI)),
		maximumUnitResidual,
		positiveWeights,
		branchesValid,
	};
}

/** @param {SkySourceReconstructionValue} v @param {1|-1} sign @returns {SkySourceAuditState} */
function signed(v, sign) {
	return sign * v.value > v.allowance ? 'passed' : sign * v.value < -v.allowance ? 'failed' : 'unresolved';
}
/** @param {SkySourceReconstructionValue} v @returns {SkySourceAuditState} */
function zero(v) {
	return Math.abs(v.value) <= v.allowance ? 'passed' : 'failed';
}
/** @param {SkySourceReconstructionValue} candidate @param {SkySourceReconstructionValue} control @param {number} fraction @returns {SkySourceAuditState} */
function smaller(candidate, control, fraction) {
	if (Math.abs(control.value) <= control.allowance) return 'unresolved';
	return Math.abs(candidate.value) + candidate.allowance <= fraction * (Math.abs(control.value) - control.allowance)
		? 'passed'
		: 'failed';
}
/** @param {SkySourceReconstructionValue} fine @param {SkySourceReconstructionValue} coarse @returns {readonly [number,number]|null} */
function ratio(fine, coarse) {
	if (fine.value <= fine.allowance || coarse.value <= coarse.allowance) return null;
	return [
		(fine.value - fine.allowance) / (coarse.value + coarse.allowance),
		(fine.value + fine.allowance) / (coarse.value - coarse.allowance),
	];
}
/** @param {readonly [number,number]|null} interval @returns {SkySourceAuditState} */
function ratioGate(interval) {
	return interval === null ? 'unresolved' : interval[0] >= 1 / 16 && interval[1] <= 1 / 4 ? 'passed' : 'failed';
}
/** @param {SkySourceReconstructionValue} prior @param {SkySourceReconstructionValue} held @returns {SkySourceAuditState} */
function sameSign(prior, held) {
	if (Math.abs(prior.value) <= prior.allowance || Math.abs(held.value) <= held.allowance) return 'unresolved';
	return Math.sign(prior.value) === Math.sign(held.value) ? 'passed' : 'failed';
}

/** Forecast inputs contain mu32 only; held64 is evaluated afterward.
 * @param {{polynomial:SkySourceReconstructionValue,odd:SkySourceReconstructionValue}} coarse @returns {SkyAngularEndpointForecast}
 */
function forecast(coarse) {
	const factor = ((32 + 0.5) / (64 + 0.5)) ** 3;
	return {
		source: 'mu32-a64',
		target: 'mu64-a64',
		factor,
		polynomial: sum([coarse.polynomial], [factor]),
		odd: sum([coarse.odd], [factor]),
	};
}

/** Eight frozen phase-only rules, with retained 00218 replay supplied by the
 * authenticated runner. This entry point is not used by manufactured proofs.
 * @param {SkyAngularFrameControlInput} input @param {readonly SkyAngularFrameControlRule[]} replay
 * @returns {SkyAngularEndpointResult}
 */
export function evaluateAngularEndpointControl(input, replay) {
	const {spec, target, original} = input,
		g = spec.atmosphere.miePhaseFunctionG,
		reference = original.reference;
	assert.equal(target.id, 'p-0930-5-7:h1000');
	assert.equal(target.heightMeters, 1000);
	assert.deepEqual(target, original.target);
	assert.equal(g, 0.7);
	assert.ok((1 - g) ** 2 > 1e-7 && Math.abs(Math.hypot(...target.direction) - 1) <= 128 * Number.EPSILON);
	value(reference.value, reference.allowance);
	const referenceAdequate = reference.admitted && reference.crosscheckDifference <= reference.crosscheckTolerance;
	/** @param {number} c @returns {number} */ const density = (c) => {
		assert.ok(1 + g * g - 2 * g * c > 1e-7);
		return phase(spec, c)[1];
	};
	/** @type {SkyAngularEndpointRow[]} */ const rows = [];
	/** @type {SkyAngularEndpointForecast|null} */ let heldPrediction = null;
	for (const [id, coordinate, polarCount, azimuthCount] of matrix) {
		if (id === 'mu64-a64') {
			assert.equal(rows.at(-1)?.id, 'mu32-a64');
			heldPrediction = forecast(rows[rows.length - 1]);
		}
		const mapped = coordinate === 'split-theta' ? thetaNodes(spec.planet.bottomRadiusMeters, target.origin) : null;
		const nodes = mapped
			? mapped.nodes
			: coordinate === 'ring-mu'
				? ringNodes(target.origin)
				: muNodes(spec.planet.bottomRadiusMeters, target.origin, polarCount, azimuthCount);
		const estimate = integrate(nodes, spec.planet.bottomRadiusMeters, target.origin, target.direction, density);
		assert.equal(nodes.length, polarCount * azimuthCount * (coordinate === 'ring-mu' ? 1 : 3));
		const residual = difference(estimate.full, sum([estimate.even, estimate.odd], [1, 1]));
		/** @type {Record<string,SkySourceAuditState>} */ const checks = {
			positiveWeights: estimate.positiveWeights ? 'passed' : 'failed',
			unitDirections: estimate.maximumUnitResidual <= 128 * Number.EPSILON ? 'passed' : 'failed',
			solidAngle: zero(difference(estimate.solidAngle, value(4 * Math.PI))),
			branches: estimate.branchesValid ? 'passed' : 'failed',
			decomposition: zero(residual),
		};
		if (mapped) checks.boundaries = mapped.maximumBoundaryResidual <= 256 * Number.EPSILON ? 'passed' : 'failed';
		rows.push({
			id,
			coordinate,
			polarCount,
			azimuthCount,
			directionCount: nodes.length,
			phaseEvaluations: 3 * nodes.length,
			full: estimate.full,
			even: estimate.even,
			odd: estimate.odd,
			polynomial: estimate.polynomial,
			fullError: difference(estimate.full, reference),
			evenError: difference(estimate.even, reference),
			decompositionResidual: residual,
			solidAngle: estimate.solidAngle,
			maximumUnitResidual: estimate.maximumUnitResidual,
			maximumBoundaryResidual: mapped?.maximumBoundaryResidual ?? null,
			checks,
		});
	}
	assert.ok(heldPrediction);
	/** @type {Record<string,SkySourceAuditState>} */ const implementationChecks = {};
	for (const row of rows)
		for (const [key, state] of Object.entries(row.checks)) implementationChecks[row.id + ':' + key] = state;
	/** @type {Record<string,SkySourceReconstructionValue>} */ const replays = {};
	for (const [index, oldId] of /** @type {const} */ ([
		[1, 'split8x16'],
		[2, 'split16x32'],
		[4, 'split32x64'],
	])) {
		const matches = replay.filter((r) => r.id === oldId);
		assert.equal(matches.length, 1);
		assert.equal(matches[0].directionCount, rows[index].directionCount);
		replays[rows[index].id] = difference(rows[index].full, matches[0].product);
		implementationChecks[rows[index].id + ':replay'] = zero(replays[rows[index].id]);
	}
	const geometryReady = Object.values(implementationChecks).every((s) => s === 'passed');
	/** @param {SkySourceAuditState} state @param {boolean} [needsReference] @returns {SkySourceAuditState} */ const admitted =
		(state, needsReference = false) =>
			geometryReady && (!needsReference || referenceAdequate) ? state : 'unresolved';
	/** @type {Record<string,Record<string,SkySourceAuditState>>} */ const predictionGroups = {
		ringCancellation: {polynomial: admitted(zero(rows[0].polynomial)), odd: admitted(zero(rows[0].odd))},
		oddAttribution: {},
		polynomialRate: {},
		azimuthControl: {},
		heldCount: {},
		thetaControl: {},
	};
	for (const i of [1, 2, 4]) {
		predictionGroups.oddAttribution[rows[i].id + ':negativeOdd'] = admitted(signed(rows[i].odd, -1));
		predictionGroups.oddAttribution[rows[i].id + ':eightyPercent'] = admitted(
			smaller(rows[i].evenError, rows[i].fullError, 0.2),
			true,
		);
	}
	for (const i of [3, 4, 5])
		predictionGroups.polynomialRate[rows[i].id + ':positive'] = admitted(signed(rows[i].polynomial, 1));
	const polynomialRatios = [4, 5].map((i) => ({
		coarse: rows[i - 1].id,
		fine: rows[i].id,
		interval: ratio(rows[i].polynomial, rows[i - 1].polynomial),
	}));
	for (const r of polynomialRatios)
		predictionGroups.polynomialRate[r.fine + ':ratio'] = admitted(ratioGate(r.interval));
	const azimuthChanges = {
		polynomial: difference(rows[6].polynomial, rows[4].polynomial),
		odd: difference(rows[6].odd, rows[4].odd),
	};
	const heldDiscrepancies = {
		polynomial: difference(rows[5].polynomial, heldPrediction.polynomial),
		odd: difference(rows[5].odd, heldPrediction.odd),
	};
	for (const field of /** @type {const} */ (['polynomial', 'odd'])) {
		predictionGroups.azimuthControl[field] = admitted(smaller(azimuthChanges[field], rows[4][field], 0.01));
		predictionGroups.heldCount[field + ':sameSign'] = admitted(sameSign(rows[4][field], rows[5][field]));
		predictionGroups.heldCount[field + ':prediction'] = admitted(
			smaller(heldDiscrepancies[field], rows[5][field], 0.25),
		);
	}
	predictionGroups.thetaControl.polynomial = admitted(smaller(rows[7].polynomial, rows[3].polynomial, 0.01));
	predictionGroups.thetaControl.phaseProduct = admitted(smaller(rows[7].fullError, rows[3].fullError, 0.01), true);
	const predicates = Object.values(predictionGroups).flatMap((group) => Object.values(group));
	assert.equal(predicates.length, 21);
	return {
		schemaId: 'sky-angular-endpoint-control-v1',
		target,
		g,
		reference,
		referenceAdequate,
		rows,
		replays,
		heldPrediction,
		heldDiscrepancies,
		polynomialRatios,
		azimuthChanges,
		implementationChecks,
		predictionGroups,
		predicates,
	};
}

/** Synthetic geometry/Jacobian/cancellation checks; no retained target values.
 * @returns {{checks:number,scope:string}}
 */
export function angularEndpointProof() {
	let checks = 0;
	/** @param {boolean} condition @returns {void} */ function check(condition) {
		assert.ok(condition, 'Angular endpoint proof ' + (checks + 1));
		checks++;
	}
	for (const a of [0.3, 0.7, 0.95])
		for (const b of [-0.8, 0, 0.8])
			for (const q of [-0.02, 0, 0.02]) {
				const result = boundary(a, b, q);
				check(result.residual <= 256 * Number.EPSILON);
			}
	for (const [low, high] of [
		[0, 0.1],
		[0, 2.5],
		[0.7, 1.4],
		[2.3, Math.PI],
	]) {
		const half = (high - low) / 2,
			centre = (high + low) / 2;
		const terms = componentGauss(16).map((r) => half * r.weight * Math.sin(centre + half * r.node));
		const integrated = terms.reduce((s, x) => s + x, 0),
			exact = Math.cos(low) - Math.cos(high);
		check(terms.every((x) => x > 0));
		check(Math.abs(integrated - exact) <= 8192 * Number.EPSILON * (Math.abs(integrated) + Math.abs(exact)));
	}
	const outgoing = unit([1, 2, 3]),
		bottom = 4.9;
	/** @param {number} c @returns {number} */ const g0 = (c) => (3 * (1 + c * c)) / (16 * Math.PI);
	for (const azimuth of [0, 0.7]) {
		const origin = /** @type {SkyVector3} */ ([3 * Math.cos(azimuth), 3 * Math.sin(azimuth), 4]);
		const ring = integrate(ringNodes(origin), bottom, origin, outgoing, g0);
		check(zero(ring.polynomial) === 'passed');
		check(zero(ring.odd) === 'passed');
		const exact = (1 + (0.05 * (3 * outgoing[2] ** 2 - 1)) / 2) / (4 * Math.PI);
		check(Math.abs(ring.full.value - exact) <= ring.full.allowance);
		const theta = thetaNodes(bottom, origin);
		for (const nodes of [theta.nodes, muNodes(bottom, origin, 16, 64)]) {
			const estimate = integrate(nodes, bottom, origin, outgoing, g0);
			check(nodes.length === 3072);
			check(estimate.positiveWeights && estimate.branchesValid);
			check(estimate.maximumUnitResidual <= 128 * Number.EPSILON);
			check(zero(difference(estimate.solidAngle, value(4 * Math.PI))) === 'passed');
			check(zero(difference(estimate.full, sum([estimate.even, estimate.odd], [1, 1]))) === 'passed');
		}
		check(theta.maximumBoundaryResidual <= 256 * Number.EPSILON);
	}
	check(zero(value(0, 1e-13)) === 'passed');
	check(zero(value(1, 1e-13)) === 'failed');
	check(signed(value(-1, 0.1), -1) === 'passed');
	check(signed(value(1, 0.1), -1) === 'failed');
	check(signed(value(0, 0.1), 1) === 'unresolved');
	check(smaller(value(0.01, 0.001), value(1, 0.01), 0.2) === 'passed');
	check(smaller(value(0.2, 0.001), value(1, 0.01), 0.2) === 'failed');
	check(smaller(value(0), value(0, 0.01), 0.2) === 'unresolved');
	check(ratioGate(ratio(value(0.125, 0.001), value(1, 0.001))) === 'passed');
	check(ratioGate(ratio(value(0.25, 0.01), value(1, 0.01))) === 'failed');
	check(ratioGate(ratio(value(0), value(1))) === 'unresolved');
	check(sameSign(value(-1), value(-0.1)) === 'passed');
	check(sameSign(value(-1), value(0.1)) === 'failed');
	check(sameSign(value(-1), value(0, 1e-13)) === 'unresolved');
	const prediction = forecast({polynomial: value(8, 0.2), odd: value(-4, 0.1)});
	check(prediction.factor === (32.5 / 64.5) ** 3);
	check(prediction.polynomial.value === 8 * prediction.factor && prediction.odd.value === -4 * prediction.factor);
	check(
		prediction.polynomial.allowance >= 0.2 * prediction.factor &&
			prediction.odd.allowance >= 0.1 * prediction.factor,
	);
	assert.throws(() => boundary(0.01, 0.7, -0.02));
	checks++;
	return {
		checks,
		scope: 'Synthetic physical boundary equations, theta Jacobian integrals, unit mirrored frames and branch classification, shared-ring polynomial/odd cancellation, g=0 convolution, E/O identities, held-factor propagation and conservative passed/failed/unresolved gates. No retained geometry or target values.',
	};
}

/** @param {SkyAngularEndpointResult} result @returns {string} */
export function angularEndpointReport(result) {
	return [
		'# Angular endpoint and azimuth cancellation control',
		'',
		'One prescribed phase-product field and an exact-zero Cartesian polynomial. All arithmetic/reference allowances and failed or unresolved gates remain in JSON. The half-turn is an attribution identity, not an assumption about atmospheric light.',
		'',
		'| Rule | Directions | Full error | Error allowance | Even error | Odd | Polynomial | Polynomial allowance |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
		...result.rows.map(
			(r) =>
				'| ' +
				[
					r.id,
					r.directionCount,
					r.fullError.value,
					r.fullError.allowance,
					r.evenError.value,
					r.odd.value,
					r.polynomial.value,
					r.polynomial.allowance,
				].join(' | ') +
				' |',
		),
		'',
		'Held mu64 factor: ' + result.heldPrediction.factor + '; forecast inputs contain mu32 only.',
		'',
		'| Group | Check | State |',
		'| --- | --- | --- |',
		...Object.entries(result.predictionGroups).flatMap(([group, checks]) =>
			Object.entries(checks).map(([key, state]) => '| ' + [group, key, state].join(' | ') + ' |'),
		),
		'',
		'| Implementation check | State |',
		'| --- | --- |',
		...Object.entries(result.implementationChecks).map(([key, state]) => '| ' + key + ' | ' + state + ' |'),
		'',
		'No atmospheric integration, GPU evaluation or Kider comparison is performed. The endpoint asymptotic law motivates the frozen finite-count predictions; it does not guarantee them.',
		'',
	].join('\n');
}
