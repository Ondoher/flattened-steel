import assert from 'node:assert/strict';
import {phase} from '../../numerics/direct.js';
import {dot, unit, cross, clamp} from '../../numerics/math.js';
import {componentGauss, incidentWorld} from '../j2/angular.mjs';
import {sunFrameGroups} from '../angular-frame/geometry.mjs';
import {reconstructionValue as value, reconstructionDifference as difference} from '../source-reconstruction/index.mjs';

const sun = /** @type {SkyVector3} */ ([0, 0, 1]);
const rules = /** @type {const} */ ([
	['original32x12', 32, 12, false, 'outgoing-projection'],
	['rotated32x12', 32, 12, false, 'radial-projection'],
	['unpartitioned24x16', 24, 16, false, 'radial-projection'],
	['split8x16', 8, 16, true, 'radial-projection'],
	['split16x32', 16, 32, true, 'radial-projection'],
	['split32x64', 32, 64, true, 'radial-projection'],
]);

/** Fixed Gauss24 only; existing component rule admission remains unchanged.
 * @returns {SkyJ2GaussNode[]}
 */
function gauss24() {
	/** @type {SkyJ2GaussNode[]} */ const result = Array(24);
	for (let root = 0; root < 12; root++) {
		let x = Math.cos((Math.PI * (root + 0.75)) / 24.5),
			converged = false;
		/** @returns {{p:number,derivative:number}} */ function polynomial() {
			let previous = 1,
				current = x;
			for (let degree = 2; degree <= 24; degree++) {
				const next = ((2 * degree - 1) * x * current - (degree - 1) * previous) / degree;
				previous = current;
				current = next;
			}
			return {p: current, derivative: (24 * (x * current - previous)) / (x * x - 1)};
		}
		for (let iteration = 0; iteration < 64; iteration++) {
			const {p, derivative} = polynomial(),
				next = x - p / derivative;
			converged = Math.abs(next - x) <= 4 * Number.EPSILON;
			x = next;
			if (converged) break;
		}
		assert.ok(converged, 'Fixed Gauss24 root must converge.');
		const {derivative} = polynomial(),
			weight = 2 / ((1 - x * x) * derivative * derivative);
		assert.ok(Number.isFinite(weight) && weight > 0 && x > 0 && x < 1);
		result[root] = {node: -x, weight};
		result[23 - root] = {node: x, weight};
	}
	return result;
}

/** Match the original outgoing-origin operation order. Radial-origin also keeps
 * the Sun polar axis; it is not the radial-polar construction from 00210.
 * @param {SkyVector3} origin @param {SkyVector3} outgoing @param {number} polarCount
 * @param {number} azimuthCount @param {'outgoing-projection'|'radial-projection'} azimuthOrigin
 * @returns {{direction:SkyVector3,weight:number}[]}
 */
function productNodes(origin, outgoing, polarCount, azimuthCount, azimuthOrigin) {
	assert.ok([24, 32].includes(polarCount) && [12, 16].includes(azimuthCount));
	const projected = azimuthOrigin === 'outgoing-projection' ? outgoing : unit(origin);
	const e1 =
		Math.hypot(projected[0], projected[1]) === 0
			? /** @type {SkyVector3} */ ([1, 0, 0])
			: unit([projected[0], projected[1], 0]);
	const e2 = cross(sun, e1),
		step = (2 * Math.PI) / azimuthCount;
	return (polarCount === 24 ? gauss24() : componentGauss(32)).flatMap(({node, weight}) => {
		const radius = Math.sqrt(Math.max(0, 1 - node * node));
		return Array.from({length: azimuthCount}, (_, i) => {
			const phi = (i + 0.5) * step;
			const local = [radius * Math.cos(phi), radius * Math.sin(phi), node];
			return {
				direction: unit(
					[0, 1, 2].map((axis) => e1[axis] * local[0] + e2[axis] * local[1] + sun[axis] * local[2]),
				),
				weight: weight * step,
			};
		});
	});
}

/** Each mirror member passes through the unchanged local-to-world conversion.
 * @param {number} bottom @param {SkyVector3} origin @param {number} polarCount @param {number} azimuthCount
 * @returns {{direction:SkyVector3,weight:number}[]}
 */
function splitNodes(bottom, origin, polarCount, azimuthCount) {
	return sunFrameGroups(bottom, origin, polarCount, azimuthCount).flatMap(({incident}) => {
		assert.ok(incident.mirror);
		return [incident.direction, incident.mirror].map((local) => ({
			direction: incidentWorld(origin, local),
			weight: incident.weight,
		}));
	});
}

/** Arithmetic scale matches 00210; solid-angle allowance has no absolute floor.
 * @param {readonly {direction:SkyVector3,weight:number}[]} nodes @param {SkyVector3} outgoing
 * @param {(cosine:number)=>readonly [number,number]} density @returns {SkyAngularFrameControlEstimate}
 */
function integrate(nodes, outgoing, density) {
	let product = 0,
		productScale = 0,
		rayleigh = 0,
		rayleighScale = 0,
		mie = 0,
		mieScale = 0;
	let solidAngle = 0,
		weightScale = 0,
		maximumUnitResidual = 0,
		positiveWeights = true;
	for (const node of nodes) {
		assert.ok(Number.isFinite(node.weight) && node.direction.every(Number.isFinite));
		positiveWeights &&= node.weight > 0;
		maximumUnitResidual = Math.max(maximumUnitResidual, Math.abs(Math.hypot(...node.direction) - 1));
		const source = density(clamp(node.direction[2], -1, 1))[1],
			scatter = density(clamp(dot(outgoing, node.direction), -1, 1));
		assert.ok([source, ...scatter].every((x) => Number.isFinite(x) && x >= 0));
		const term = node.weight * source * scatter[1],
			r = node.weight * scatter[0],
			m = node.weight * scatter[1];
		product += term;
		productScale += Math.abs(term);
		rayleigh += r;
		rayleighScale += Math.abs(r);
		mie += m;
		mieScale += Math.abs(m);
		solidAngle += node.weight;
		weightScale += Math.abs(node.weight);
	}
	const angle = value(solidAngle, 8192 * Number.EPSILON * (weightScale + 4 * Math.PI));
	return {
		product: value(product, 8192 * Number.EPSILON * productScale + 1e-13),
		phaseMass: {
			rayleigh: value(rayleigh, 8192 * Number.EPSILON * rayleighScale + 1e-13),
			mie: value(mie, 8192 * Number.EPSILON * mieScale + 1e-13),
		},
		directionCount: nodes.length,
		phaseEvaluations: 2 * nodes.length,
		solidAngle: angle,
		maximumUnitResidual,
		positiveWeights,
		geometryChecks: {
			positiveWeights: positiveWeights ? 'passed' : 'failed',
			unitDirections: maximumUnitResidual <= 128 * Number.EPSILON ? 'passed' : 'failed',
			solidAngle: Math.abs(angle.value - 4 * Math.PI) <= angle.allowance ? 'passed' : 'failed',
		},
	};
}

/** @param {SkySourceReconstructionValue} candidate @param {SkySourceReconstructionValue} control
 * @param {number} fraction @returns {SkySourceAuditState}
 */
function smaller(candidate, control, fraction) {
	if (Math.abs(control.value) <= control.allowance) return 'unresolved';
	return Math.abs(candidate.value) + candidate.allowance <= fraction * (Math.abs(control.value) - control.allowance)
		? 'passed'
		: 'failed';
}

/** This evaluates only the isolated phase field; no atmospheric integrator is called.
 * @param {SkyAngularFrameControlInput} input @returns {SkyAngularFrameControlResult}
 */
export function evaluateAngularFrameControl(input) {
	const {spec, target, original} = input,
		g = spec.atmosphere.miePhaseFunctionG;
	assert.equal(g, 0.7);
	assert.ok((1 - g) ** 2 > 1e-7);
	assert.equal(target.id, 'p-0930-5-7:h1000');
	assert.equal(target.heightMeters, 1000);
	assert.deepEqual(original.target, target);
	assert.equal(original.cosine, clamp(target.direction[2], -1, 1));
	assert.ok(Math.abs(Math.hypot(...target.direction) - 1) <= 128 * Number.EPSILON);
	const reference = original.reference;
	value(reference.value, reference.allowance);
	const referenceAdequate = reference.admitted && reference.crosscheckDifference <= reference.crosscheckTolerance;
	/** @param {number} c @returns {readonly [number,number]} */ const density = (c) => {
		assert.ok(1 + g * g - 2 * g * c > 1e-7);
		const pair = phase(spec, c);
		assert.equal(pair.length, 2);
		return [pair[0], pair[1]];
	};
	const rows = rules.map(([id, polarCount, azimuthCount, partitioned, azimuthOrigin]) => {
		const nodes = partitioned
			? splitNodes(spec.planet.bottomRadiusMeters, target.origin, polarCount, azimuthCount)
			: productNodes(target.origin, target.direction, polarCount, azimuthCount, azimuthOrigin);
		const estimate = integrate(nodes, target.direction, density);
		assert.equal(estimate.directionCount, polarCount * azimuthCount * (partitioned ? 3 : 1));
		return {
			...estimate,
			id,
			polarCount,
			azimuthCount,
			partitioned,
			azimuthOrigin,
			error: difference(estimate.product, reference),
			phaseMassErrors: {
				rayleigh: difference(estimate.phaseMass.rayleigh, value(1)),
				mie: difference(estimate.phaseMass.mie, value(1)),
			},
		};
	});
	const replay = difference(rows[0].product, original.rules['sun32-a12'].estimate);
	/** @type {Record<string,SkySourceAuditState>} */ const implementationChecks = {
		originalReplay: Math.abs(replay.value) <= replay.allowance ? 'passed' : 'failed',
	};
	for (const row of rows)
		for (const [key, state] of Object.entries(row.geometryChecks)) implementationChecks[row.id + ':' + key] = state;
	const usable = referenceAdequate && Object.values(implementationChecks).every((state) => state === 'passed');
	/** @type {Record<string,SkySourceAuditState>} */ const checks = {};
	for (const index of [1, 2, 3])
		checks[rows[index].id + ':relativeProductError'] = usable
			? smaller(rows[index].error, reference, 0.0001)
			: 'unresolved';
	for (const index of [4, 5])
		checks[rows[index].id + ':halfPreviousError'] = usable
			? smaller(rows[index].error, rows[index - 1].error, 0.5)
			: 'unresolved';
	for (const row of rows)
		for (const species of /** @type {const} */ (['rayleigh', 'mie'])) {
			checks[row.id + ':' + species + 'Mass'] = Object.values(row.geometryChecks).every(
				(state) => state === 'passed',
			)
				? smaller(row.phaseMassErrors[species], value(1), 0.0001)
				: 'unresolved';
		}
	const predicates = Object.values(checks);
	assert.equal(predicates.length, 17);
	return {
		schemaId: 'sky-angular-frame-control-v1',
		target,
		g,
		reference,
		referenceAdequate,
		rows,
		replay,
		contrasts: {
			azimuthOrigin: difference(rows[1].product, rows[0].product),
			matchedRedistribution: difference(rows[2].product, rows[1].product),
			polarPartition: difference(rows[3].product, rows[2].product),
			firstRefinement: difference(rows[4].product, rows[3].product),
			secondRefinement: difference(rows[5].product, rows[4].product),
		},
		implementationChecks,
		checks,
		predicates,
	};
}

/** Synthetic polynomial/phase fixtures only; no retained target evaluation.
 * @returns {{checks:number,scope:string}}
 */
export function angularFrameControlProof() {
	let checks = 0;
	/** @param {boolean} condition @returns {void} */ function check(condition) {
		assert.ok(condition, 'Angular frame control proof ' + (checks + 1));
		checks++;
	}
	const roots = gauss24();
	check(roots.length === 24 && roots.every((r) => r.weight > 0 && Math.abs(r.node) < 1));
	check(roots.every((r, i) => r.node === -roots[23 - i].node && r.weight === roots[23 - i].weight));
	for (let degree = 0; degree <= 47; degree++) {
		const terms = roots.map((r) => r.weight * r.node ** degree),
			exact = degree % 2 ? 0 : 2 / (degree + 1);
		const centre = terms.reduce((s, x) => s + x, 0),
			scale = terms.reduce((s, x) => s + Math.abs(x), Math.abs(exact));
		check(Math.abs(centre - exact) <= 8192 * Number.EPSILON * scale);
	}
	const origin = /** @type {SkyVector3} */ ([3, 0, 4]),
		outgoing = unit([1, 2, 3]);
	/** @param {number} c @returns {readonly [number,number]} */ const g0 = (c) => {
		const p = (3 * (1 + c * c)) / (16 * Math.PI);
		return [p, p];
	};
	const exact = (1 + (0.05 * (3 * outgoing[2] ** 2 - 1)) / 2) / (4 * Math.PI);
	for (const [id, p, a, partitioned, azimuth] of rules) {
		const nodes = partitioned ? splitNodes(4.9, origin, p, a) : productNodes(origin, outgoing, p, a, azimuth);
		const estimate = integrate(nodes, outgoing, g0);
		check(estimate.directionCount === (id === 'split16x32' ? 1536 : id === 'split32x64' ? 6144 : 384));
		check(Object.values(estimate.geometryChecks).every((s) => s === 'passed'));
		// The physical interval endpoints vary with azimuth, so split rules need not
		// integrate this global polynomial exactly at finite azimuth count.
		if (!partitioned) check(Math.abs(estimate.product.value - exact) <= estimate.product.allowance);
		const constant = integrate(nodes, outgoing, () => [1 / (4 * Math.PI), 1 / (4 * Math.PI)]);
		check(Math.abs(constant.product.value - 1 / (4 * Math.PI)) <= constant.product.allowance);
		check(Math.abs(constant.phaseMass.rayleigh.value - 1) <= constant.phaseMass.rayleigh.allowance);
	}
	const fixture = productNodes(origin, outgoing, 24, 16, 'radial-projection');
	const broken = integrate([{...fixture[0], weight: -fixture[0].weight}, ...fixture.slice(1)], outgoing, g0);
	check(broken.geometryChecks.positiveWeights === 'failed');
	check(broken.geometryChecks.solidAngle === 'failed');
	check(smaller(value(0.1), value(1), 0.5) === 'passed');
	check(smaller(value(0.6), value(1), 0.5) === 'failed');
	check(smaller(value(0), value(0, 1e-15), 0.5) === 'unresolved');
	check(smaller(value(0.49, 0.02), value(1), 0.5) === 'failed');
	check(smaller(value(0.000099, 0.000002), value(1), 0.0001) === 'failed');
	return {
		checks,
		scope: 'Fixed Gauss24 moments through degree47, positive symmetric weights, synthetic Sun frames and explicit mirrors, g=0 polynomial convolution, constant phase mass, geometry failures and allowance-aware gates. No retained geometry or atmospheric integrations.',
	};
}

/** @param {SkyAngularFrameControlResult} result @returns {string} */
export function angularFrameControlReport(result) {
	return [
		'# Isolated angular frame and placement control',
		'',
		'Frozen morning phase-product field only. Reference and empirical arithmetic allowances are retained separately; no atmospheric radiance or measurement is evaluated.',
		'',
		'Reference admitted: ' +
			result.referenceAdequate +
			'. Original replay difference: ' +
			result.replay.value +
			' +/- ' +
			result.replay.allowance +
			'.',
		'',
		'| Rule | Directions | Product | Signed error | Error allowance | Rayleigh mass error | Mie mass error |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
		...result.rows.map(
			(r) =>
				'| ' +
				[
					r.id,
					r.directionCount,
					r.product.value,
					r.error.value,
					r.error.allowance,
					r.phaseMassErrors.rayleigh.value,
					r.phaseMassErrors.mie.value,
				].join(' | ') +
				' |',
		),
		'',
		'| Check | State |',
		'| --- | --- |',
		...Object.entries({...result.implementationChecks, ...result.checks}).map(
			([key, state]) => '| ' + key + ' | ' + state + ' |',
		),
		'',
		'JSON retains every mass allowance, signed contrast and gate. Phase normalization alone does not establish lobe accuracy. These controls cannot uniquely attribute atmospheric residuals to attenuation, visibility or ground reflection, and do not establish Kider improvement.',
		'',
	].join('\n');
}
