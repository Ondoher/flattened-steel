import assert from 'node:assert/strict';
import {phase} from '../../numerics/direct.js';
import {dot, unit, cross, clamp} from '../../numerics/math.js';
import {componentGauss, incidentWorld} from '../j2/angular.mjs';
import {volumeJ2Groups} from '../volume-j2/angular.mjs';
import {
	reconstructionValue as value,
	reconstructionDifference as difference,
	reconstructionSum as sum,
} from '../source-reconstruction/index.mjs';

const sun = /** @type {SkyVector3} */ ([0, 0, 1]);
const originalRules = /** @type {const} */ ([
	['r8-a16', 8, 16],
	['r16-a16', 16, 16],
	['r8-a32', 8, 32],
	['r16-a32', 16, 32],
]);

/** Normalized CS moment from HG moments and the twice-applied Legendre recurrence.
 * @param {number} g @param {number} degree @returns {number}
 */
function moment(g, degree) {
	assert.ok(Number.isFinite(g) && g >= 0 && g <= 0.95);
	assert.ok(Number.isInteger(degree) && degree >= 0);
	if (g === 0) return degree === 0 ? 1 : degree === 2 ? 0.1 : 0;
	const l = degree,
		k = 3 / (2 * (2 + g * g));
	const middle = (l + 1) ** 2 / ((2 * l + 1) * (2 * l + 3)) + (l === 0 ? 0 : (l * l) / ((2 * l + 1) * (2 * l - 1)));
	const lower = l < 2 ? 0 : ((l * (l - 1)) / ((2 * l - 1) * (2 * l + 1))) * g ** (l - 2);
	const upper = (((l + 1) * (l + 2)) / ((2 * l + 3) * (2 * l + 1))) * g ** (l + 2);
	return k * ((1 + middle) * g ** l + lower + upper);
}

/** @param {number} cosine @param {number} degree @returns {number[]} */
function legendre(cosine, degree) {
	assert.ok(Number.isFinite(cosine) && Math.abs(cosine) <= 1 && Number.isInteger(degree) && degree >= 1);
	const result = [1, cosine];
	for (let l = 2; l <= degree; l++) result.push(((2 * l - 1) * cosine * result[l - 1] - (l - 1) * result[l - 2]) / l);
	return result;
}

/** Uniform omitted tail for l>L; arithmetic is accounted independently.
 * @param {number} g @param {number} degree @returns {number}
 */
function tail(g, degree) {
	assert.ok(g >= 0 && g <= 0.95 && Number.isInteger(degree) && degree >= 2);
	if (g === 0) return 0;
	const q = g * g,
		k = 3 / (2 * (2 + q));
	return ((k * k) / Math.PI) * g ** (2 * degree - 2) * ((2 * degree + 3) / (1 - q) + (2 * q) / (1 - q) ** 2);
}

/** @param {number} g @param {number} cosine @param {number} degree
 * @returns {{value:number,allowance:number,tailAllowance:number,arithmeticAllowance:number,absoluteTermSum:number}}
 */
function analytic(g, cosine, degree) {
	const polynomials = legendre(cosine, degree);
	let centre = 0,
		absoluteTermSum = 0;
	for (let l = 0; l <= degree; l++) {
		const term = ((2 * l + 1) * moment(g, l) ** 2 * polynomials[l]) / (4 * Math.PI);
		centre += term;
		absoluteTermSum += Math.abs(term);
	}
	const tailAllowance = tail(g, degree),
		arithmeticAllowance = 8192 * Number.EPSILON * absoluteTermSum + 1e-13;
	return {
		value: centre,
		allowance: tailAllowance + arithmeticAllowance,
		tailAllowance,
		arithmeticAllowance,
		absoluteTermSum,
	};
}

/** Product rule on the full polar-cosine interval. Sun frame puts the outgoing
 * projection at azimuth zero; radial frame uses the unchanged source-facing API.
 * @param {SkyVector3} origin @param {SkyVector3} outgoing @param {'sun'|'radial'} frame
 * @param {32|64} polarCount @param {12|256} azimuthCount
 * @returns {{direction:SkyVector3,weight:number}[]}
 */
function productNodes(origin, outgoing, frame, polarCount, azimuthCount) {
	const e1 =
		Math.hypot(outgoing[0], outgoing[1]) === 0
			? /** @type {SkyVector3} */ ([1, 0, 0])
			: unit([outgoing[0], outgoing[1], 0]);
	const e2 = cross(sun, e1),
		step = (2 * Math.PI) / azimuthCount;
	return componentGauss(polarCount).flatMap(({node, weight}) => {
		const radius = Math.sqrt(Math.max(0, 1 - node * node));
		return Array.from({length: azimuthCount}, (_, i) => {
			const phi = (i + 0.5) * step;
			const local = /** @type {SkyVector3} */ ([radius * Math.cos(phi), radius * Math.sin(phi), node]);
			const direction =
				frame === 'radial'
					? incidentWorld(origin, local)
					: unit([0, 1, 2].map((axis) => e1[axis] * local[0] + e2[axis] * local[1] + sun[axis] * local[2]));
			return {direction, weight: weight * step};
		});
	});
}

/** Mirror members are evaluated explicitly, each with its original per-member weight.
 * @param {number} bottom @param {SkyVector3} origin @param {number} radialCount @param {number} azimuthCount
 * @returns {{direction:SkyVector3,weight:number}[]}
 */
function originalNodes(bottom, origin, radialCount, azimuthCount) {
	return volumeJ2Groups(bottom, origin, radialCount, azimuthCount).flatMap(({incident}) => {
		assert.ok(incident.mirror);
		return [incident.direction, incident.mirror].map((local) => ({
			direction: incidentWorld(origin, local),
			weight: incident.weight,
		}));
	});
}

/** Fixed-rule arithmetic allowance is empirical and excludes its angular error.
 * @param {readonly {direction:SkyVector3,weight:number}[]} nodes @param {SkyVector3} outgoing
 * @param {(cosine:number)=>number} density @returns {SkyAngularLobesEstimate}
 */
function integrate(nodes, outgoing, density) {
	let centre = 0,
		absoluteTermSum = 0,
		solidAngle = 0,
		maximumUnitResidual = 0;
	for (const node of nodes) {
		assert.ok(Number.isFinite(node.weight) && node.weight > 0);
		const residual = Math.abs(Math.hypot(...node.direction) - 1);
		maximumUnitResidual = Math.max(maximumUnitResidual, residual);
		assert.ok(residual <= 128 * Number.EPSILON);
		const source = density(clamp(node.direction[2], -1, 1)),
			scatter = density(clamp(dot(outgoing, node.direction), -1, 1));
		assert.ok(source >= 0 && scatter >= 0 && Number.isFinite(source * scatter));
		const term = node.weight * source * scatter;
		centre += term;
		absoluteTermSum += Math.abs(term);
		solidAngle += node.weight;
	}
	assert.ok(Math.abs(solidAngle - 4 * Math.PI) <= 8192 * Number.EPSILON * 4 * Math.PI);
	return {
		value: centre,
		allowance: 8192 * Number.EPSILON * absoluteTermSum + 1e-13,
		directionCount: nodes.length,
		phaseEvaluations: 2 * nodes.length,
		solidAngle,
		maximumUnitResidual,
	};
}

/** @param {SkySourceReconstructionValue} v @returns {SkySourceAuditState} */
function negative(v) {
	return v.value < -v.allowance ? 'passed' : v.value > v.allowance ? 'failed' : 'unresolved';
}

/** Conservative magnitude comparison; an insignificant operand is unresolved.
 * @param {SkySourceReconstructionValue} candidate @param {SkySourceReconstructionValue} control
 * @param {number} fraction @returns {SkySourceAuditState}
 */
function smaller(candidate, control, fraction) {
	if (Math.abs(control.value) <= control.allowance) return 'unresolved';
	return Math.abs(candidate.value) + candidate.allowance <= fraction * (Math.abs(control.value) - control.allowance)
		? 'passed'
		: 'failed';
}

/** @param {SkySourceReconstructionValue} candidate @param {SkySourceReconstructionValue} control @returns {SkySourceAuditState} */
function atLeast(candidate, control) {
	if (Math.abs(candidate.value) <= candidate.allowance || Math.abs(control.value) <= control.allowance)
		return 'unresolved';
	return Math.abs(candidate.value) - candidate.allowance >= Math.abs(control.value) + control.allowance
		? 'passed'
		: 'failed';
}

/** Root's sealed runner supplies the authenticated two original h1000 targets.
 * No atmospheric incident integration or cached incident radiance is used.
 * @param {SkyTransportSpec} spec @param {readonly SkyVolumeJ2Target[]} targets @returns {SkyAngularLobesResult}
 */
export function evaluateAngularLobes(spec, targets) {
	const g = spec.atmosphere.miePhaseFunctionG;
	assert.equal(g, 0.7);
	assert.ok((1 - g) ** 2 > 1e-7, 'The declared phase denominator cap must be inactive over the sphere.');
	assert.deepEqual(
		targets.map((t) => t.probeId),
		['p-0930-5-7', 'p-1230-3-5'],
	);
	const rows = targets.map((target) => {
		assert.equal(target.heightMeters, 1000);
		assert.equal(target.id, target.probeId + ':h1000');
		assert.ok(Math.abs(Math.hypot(...target.direction) - 1) <= 128 * Number.EPSILON);
		const cosine = clamp(target.direction[2], -1, 1),
			referenceSum = analytic(g, cosine, 128);
		/** @param {number} c @returns {number} */ const density = (c) => {
			assert.ok(1 + g * g - 2 * g * c > 1e-7);
			return phase(spec, c)[1];
		};
		const crosscheck = integrate(
			productNodes(target.origin, target.direction, 'sun', 64, 256),
			target.direction,
			density,
		);
		const crosscheckDifference = Math.abs(crosscheck.value - referenceSum.value),
			crosscheckTolerance = 1e-10 + 1e-9 * Math.abs(referenceSum.value);
		const reference = {
			...referenceSum,
			degree: /** @type {const} */ (128),
			crosscheck,
			crosscheckDifference,
			crosscheckTolerance,
			admitted: crosscheckDifference <= crosscheckTolerance,
		};
		/** @type {Partial<Record<SkyAngularLobesRuleId,SkyAngularLobesRule>>} */ const accumulated = {};
		for (const [id, radialCount, azimuthCount] of originalRules) {
			const estimate = integrate(
				originalNodes(spec.planet.bottomRadiusMeters, target.origin, radialCount, azimuthCount),
				target.direction,
				density,
			);
			assert.equal(estimate.directionCount, 3 * radialCount * azimuthCount);
			accumulated[id] = {id, estimate, error: difference(estimate, reference)};
		}
		for (const frame of /** @type {const} */ (['radial', 'sun'])) {
			const id = /** @type {const} */ (`${frame}32-a12`);
			const estimate = integrate(
				productNodes(target.origin, target.direction, frame, 32, 12),
				target.direction,
				density,
			);
			assert.equal(estimate.directionCount, 384);
			accumulated[id] = {id, estimate, error: difference(estimate, reference)};
		}
		assert.equal(Object.keys(accumulated).length, 6);
		const rules = /** @type {Record<SkyAngularLobesRuleId,SkyAngularLobesRule>} */ (accumulated);
		const base = rules['r8-a16'].estimate,
			radial = rules['r16-a16'].estimate,
			azimuth = rules['r8-a32'].estimate,
			combined = rules['r16-a32'].estimate;
		const responses = {
			radial: difference(radial, base),
			azimuth: difference(azimuth, base),
			combined: difference(combined, base),
			interaction: sum([combined, radial, azimuth, base], [1, -1, -1, 1]),
		};
		/** @type {Record<string,SkySourceAuditState>} */ const checks = {};
		if (target.probeId === 'p-0930-5-7') {
			checks.radialNegative = negative(responses.radial);
			checks.azimuthNegative = negative(responses.azimuth);
			checks.combinedNegative = negative(responses.combined);
			checks.azimuthAtLeastRadial = atLeast(responses.azimuth, responses.radial);
		}
		checks.combinedHalfError = reference.admitted
			? smaller(rules['r16-a32'].error, rules['r8-a16'].error, 0.5)
			: 'unresolved';
		checks.sunQuarterRadialError = reference.admitted
			? smaller(rules['sun32-a12'].error, rules['radial32-a12'].error, 0.25)
			: 'unresolved';
		checks.sunRelativeError = reference.admitted
			? smaller(rules['sun32-a12'].error, reference, 0.0001)
			: 'unresolved';
		return {target, cosine, reference, rules, responses, checks};
	});
	const predicates = rows.flatMap((r) => Object.values(r.checks));
	assert.equal(predicates.length, 10);
	return {schemaId: 'sky-angular-lobes-v1', g, rows, predicates};
}

/** Synthetic fixtures only; never evaluates the two retained atmospheric geometries.
 * @returns {{checks:number,scope:string}}
 */
export function angularLobesProof() {
	let checks = 0;
	/** @param {boolean} condition @returns {void} */ function check(condition) {
		assert.ok(condition, 'Angular lobes proof ' + (checks + 1));
		checks++;
	}
	for (const g of [0, 0.3, 0.7, 0.95]) check(Math.abs(moment(g, 0) - 1) <= 4 * Number.EPSILON);
	for (let l = 0; l <= 7; l++) check(moment(0, l) === (l === 0 ? 1 : l === 2 ? 0.1 : 0));
	for (const c of [-1, -0.75, -0.2, 0, 0.2, 0.75, 1]) {
		const result = analytic(0, c, 128),
			exact = (1 + (0.05 * (3 * c * c - 1)) / 2) / (4 * Math.PI);
		check(Math.abs(result.value - exact) <= result.allowance && result.tailAllowance === 0);
		const p = legendre(c, 9),
			reversed = legendre(-c, 9);
		check(p.every((v, l) => Math.abs(reversed[l] - (-1) ** l * v) <= 4 * Number.EPSILON));
	}
	for (const g of [0.3, 0.7, 0.95])
		for (const c of [-1, -0.2, 1]) {
			const coarse = analytic(g, c, 8),
				fine = analytic(g, c, 128);
			check(Math.abs(coarse.value - fine.value) <= coarse.allowance + fine.allowance);
		}
	const origin = /** @type {SkyVector3} */ ([3, 0, 4]),
		outgoing = unit([1, 2, 3]);
	for (const frame of /** @type {const} */ (['sun', 'radial'])) {
		const nodes = productNodes(origin, outgoing, frame, 32, 12);
		const result = integrate(nodes, outgoing, (c) => (3 * (1 + c * c)) / (16 * Math.PI));
		const expected = analytic(0, outgoing[2], 128);
		check(nodes.length === 384);
		check(Math.abs(result.value - expected.value) <= result.allowance + expected.allowance);
		check(result.maximumUnitResidual <= 128 * Number.EPSILON);
		check(Math.abs(result.solidAngle - 4 * Math.PI) <= 8192 * Number.EPSILON * 4 * Math.PI);
	}
	for (const [_id, radialCount, azimuthCount] of originalRules) {
		const nodes = originalNodes(4.9, origin, radialCount, azimuthCount);
		const result = integrate(nodes, outgoing, () => 1 / (4 * Math.PI));
		check(nodes.length === 3 * radialCount * azimuthCount);
		check(Math.abs(result.value - 1 / (4 * Math.PI)) <= result.allowance);
	}
	check(negative(value(-1, 0.1)) === 'passed');
	check(negative(value(1, 0.1)) === 'failed');
	check(negative(value(0, 0.1)) === 'unresolved');
	check(smaller(value(0.1), value(1), 0.25) === 'passed');
	check(smaller(value(0.3), value(1), 0.25) === 'failed');
	check(smaller(value(0), value(0), 0.25) === 'unresolved');
	check(atLeast(value(-2, 0.1), value(-1, 0.1)) === 'passed');
	check(atLeast(value(-1, 0.1), value(-2, 0.1)) === 'failed');
	check(atLeast(value(0, 0.1), value(-1)) === 'unresolved');
	return {
		checks,
		scope: 'CS normalization and g=0 convolution, Legendre parity, uniform truncation bound, synthetic unit frames and solid angle, and uncertainty-aware passed/failed/unresolved predicates. No retained target geometry or atmospheric incident solve.',
	};
}

/** @param {SkyAngularLobesResult} result @returns {string} */
export function angularLobesReport(result) {
	return [
		'# Manufactured Cornette-Shanks angular convolution',
		'',
		'Integral of p(s·w)p(o·w) over the sphere, in inverse steradians. The analytic L128 result retains separate truncation and empirical arithmetic allowances and an independent Sun-aligned 64×256 cross-check.',
		'',
		'| Ray | Reference | Cross-check discrepancy | Reference admitted | Rule | Directions | Value | Error | Error allowance |',
		'| --- | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: |',
		...result.rows.flatMap((r) =>
			Object.values(r.rules).map(
				(q) =>
					'| ' +
					[
						r.target.probeId,
						r.reference.value,
						r.reference.crosscheckDifference,
						r.reference.admitted,
						q.id,
						q.estimate.directionCount,
						q.estimate.value,
						q.error.value,
						q.error.allowance,
					].join(' | ') +
					' |',
			),
		),
		'',
		'| Ray | Predicate | Outcome |',
		'| --- | --- | --- |',
		...result.rows.flatMap((r) =>
			Object.entries(r.checks).map(([id, state]) => '| ' + [r.target.probeId, id, state].join(' | ') + ' |'),
		),
		'',
		'All signed refinement responses, matched-cost rules and allowances remain in JSON. Failed reference admission leaves all dependent accuracy predicates unresolved.',
		'This prescribed incident field isolates phase-lobe sampling. It does not establish atmospheric incident accuracy, a unique explanation of atmospheric responses, production quadrature qualification, full-view accuracy or Kider improvement.',
		'',
	].join('\n');
}
