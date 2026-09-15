import assert from 'node:assert/strict';
import {dot, unit} from '../../numerics/math.js';
import {incidentWorld} from '../j2/angular.mjs';
import {thetaGroups} from '../angular-theta/geometry.mjs';
import {sumVolumeJ2, volumeJ2Weights} from '../volume-j2/angular.mjs';
import {assessVolumeJ2} from '../volume-j2/assess.mjs';
import {backgroundProduct} from '../angular-background/index.mjs';
import {reconstructionValue as value, reconstructionSum as sum} from '../source-reconstruction/index.mjs';

const regions = /** @type {const} */ (['sun', 'horizon', 'other']);
const physical = /** @type {const} */ (['atmosphereRayleigh', 'atmosphereMie', 'groundRayleigh', 'groundMie']);

/** Fixed smooth partition evaluated in each member's own world direction.
 * @param {SkyVector3} radial @param {SkyVector3} world @returns {Record<SkyThetaRegion,number>}
 */
function partition(radial, world) {
	for (const vector of [radial, world])
		assert.ok(vector.length === 3 && vector.every(Number.isFinite) && Math.abs(Math.hypot(...vector) - 1) <= 2e-12);
	assert.ok(Math.abs(world[2]) <= 1);
	const sun = ((1 + world[2]) / 2) ** 32,
		horizon = (1 - sun) * Math.exp(-0.5 * (dot(radial, world) / 0.1) ** 2),
		other = 1 - sun - horizon;
	assert.ok([sun, horizon, other].every((x) => Number.isFinite(x) && x >= 0 && x <= 1));
	assert.ok(Math.abs(sun + horizon + other - 1) <= 8 * Number.EPSILON);
	return {sun, horizon, other};
}

/** @returns {SkyThetaRegionsAccumulator} */
function accumulator() {
	return {value: 0, incident: 0, arithmetic: 0, scale: 0, count: 0};
}

/** Preserve the established product allowance while identifying its incident
 * contribution explicitly. Both mirrored phase/region weights are supplied separately.
 * @param {SkyThetaRegionsAccumulator} into @param {SkySourceReconstructionValue} radiance @param {number} weight @returns {void}
 */
function add(into, radiance, weight) {
	assert.ok(Number.isFinite(weight) && weight >= 0);
	value(radiance.value, radiance.allowance);
	assert.ok(radiance.value >= 0);
	const weighted = backgroundProduct(
		value(radiance.value, radiance.allowance + 256 * Number.EPSILON * Math.abs(radiance.value)),
		value(weight, 1024 * Number.EPSILON * weight),
	);
	const incident = weight * radiance.allowance;
	into.value += weighted.value;
	into.incident += incident;
	into.arithmetic += Math.max(0, weighted.allowance - incident);
	into.scale += Math.abs(weighted.value);
	into.count++;
}

/** @param {SkyThetaRegionsAccumulator} accumulated @returns {SkyThetaRegionsValue} */
function finish(accumulated) {
	const arithmeticAllowance =
		accumulated.arithmetic + 2048 * Number.EPSILON * Math.max(1, accumulated.count) * accumulated.scale;
	return {
		...value(accumulated.value, accumulated.incident + arithmeticAllowance),
		incidentAllowance: accumulated.incident,
		arithmeticAllowance,
	};
}

/** Linear derived components/differences propagate the absolute incident weights.
 * @param {readonly SkyThetaRegionsValue[]} values @param {readonly number[]} weights @returns {SkyThetaRegionsValue}
 */
function linear(values, weights) {
	const result = sum(values, weights);
	const incidentAllowance = values.reduce((total, v, i) => total + Math.abs(weights[i]) * v.incidentAllowance, 0);
	const arithmeticAllowance = Math.max(0, result.allowance - incidentAllowance);
	return {...value(result.value, incidentAllowance + arithmeticAllowance), incidentAllowance, arithmeticAllowance};
}

/** Shared-input accounting identities cannot borrow incident uncertainty.
 * @param {SkyThetaRegionsValue} actual @param {SkyThetaRegionsValue} expected @returns {SkyThetaRegionsArithmeticCheck}
 */
function arithmeticCheck(actual, expected) {
	const residual = actual.value - expected.value;
	const arithmeticAllowance =
		actual.arithmeticAllowance +
		expected.arithmeticAllowance +
		256 * Number.EPSILON * (Math.abs(actual.value) + Math.abs(expected.value));
	return {
		value: residual,
		arithmeticAllowance,
		state: Math.abs(residual) <= arithmeticAllowance ? 'passed' : 'failed',
	};
}

/** @param {unknown} actual @param {unknown} retained @returns {void} */
function exactReplay(actual, retained) {
	assert.deepEqual(
		actual,
		retained,
		'Unchanged physical row/admission replay must match the retained document exactly.',
	);
}

/** @param {SkyVolumeComponent} v @returns {SkySourceReconstructionValue} */
function radiance(v) {
	assert.ok(v.resolved && v.gaussWatts !== null && v.simpsonWatts !== null && v.empiricalAllowanceWatts !== null);
	assert.ok(v.gaussWatts >= 0 && v.simpsonWatts >= 0);
	return value((v.gaussWatts + v.simpsonWatts) / 2, v.empiricalAllowanceWatts);
}

/** @param {SkyVolumeJ2Row} row @param {SkyAngularFrameComponent} component @returns {SkyThetaRegionsValue} */
function retainedValue(row, component) {
	const selected = row[component];
	assert.ok(selected.resolved && selected.mean !== null && selected.incidentAllowance !== null);
	return {
		...value(selected.mean, selected.incidentAllowance + row.arithmeticAllowance),
		incidentAllowance: selected.incidentAllowance,
		arithmeticAllowance: row.arithmeticAllowance,
	};
}

/** @param {SkyAngularThetaStage} stage @param {number} channel @param {SkyThetaRegionsComponent} component
 * @param {SkyThetaRegionsValue} full @param {SkyThetaRegionsValue} retained
 * @param {Readonly<Record<SkyThetaRegion,SkyThetaRegionsValue>>} values @returns {SkyThetaRegionsRow}
 */
function componentRow(stage, channel, component, full, retained, values) {
	return {
		stage,
		channel,
		component,
		full,
		retained,
		regions: values,
		replay: arithmeticCheck(full, retained),
		partition: arithmeticCheck(
			linear(
				regions.map((name) => values[name]),
				[1, 1, 1],
			),
			full,
		),
	};
}

/** One authenticated complete stage; independent mirror witnesses remain in the
 * original admission replay and are excluded from quadrature accumulation.
 * @param {SkyAngularThetaInput} input @param {SkyAngularThetaDocument} document @param {readonly SkyVolumeJ2Node[]} nodes
 * @returns {{components:SkyThetaRegionsRow[],summary:SkyThetaRegionsResult['stages'][number]}}
 */
function stageRegions(input, document, nodes) {
	assert.equal(document.schemaId, 'sky-angular-theta-stage-v1');
	assert.equal(document.packageId, 'angular-theta-attribution-v1');
	assert.ok(document.matrixComplete && !document.partialCountsUnavailable && document.failure === null);
	assert.deepEqual(document.target, input.target);
	assert.deepEqual(document.channels, [0, 8]);
	assert.equal(document.candidate.stage, document.stage);
	const expectedCounts = document.stage === 'pilot' ? [16, 32] : [32, 64];
	assert.deepEqual([document.candidate.radialCount, document.candidate.azimuthCount], expectedCounts);
	const groups = thetaGroups(
		input.spec.planet.bottomRadiusMeters,
		input.target.origin,
		document.candidate.radialCount,
		document.candidate.azimuthCount,
	);
	const representatives = nodes.filter((node) => node.mirrorOf === null),
		witnesses = nodes.filter((node) => node.mirrorOf !== null);
	assert.equal(representatives.length, groups.length);
	assert.equal(witnesses.length, 2);
	assert.equal(nodes.length, document.expectedCount);
	assert.equal(nodes.length, document.retainedNodeCount);
	assert.equal(document.candidate.fullDirectionCount, 2 * groups.length);
	assert.deepEqual(
		representatives.map((node) => node.index),
		groups.map((_, index) => index),
	);
	assert.deepEqual(
		witnesses.map((node) => node.index),
		[0, groups.length - 1],
	);
	for (const node of nodes) {
		assert.equal(node.targetId, input.target.id);
		const group = groups[node.index];
		assert.ok(group && group.incident.mirror);
		assert.ok(node.mirrorOf === null || node.mirrorOf === node.index);
		assert.equal(node.branch, group.branch);
		assert.deepEqual(
			node.direction,
			incidentWorld(
				input.target.origin,
				node.mirrorOf === null ? group.incident.direction : group.incident.mirror,
			),
		);
	}
	const replayed = sumVolumeJ2(input.spec, input.target, [0, 8], groups, representatives);
	exactReplay(replayed, document.rows);
	const admissionChecks = assessVolumeJ2(
		input.spec,
		[input.target],
		[0, 8],
		nodes,
		[],
		[replayed],
		[[0, groups.length - 1]],
	);
	exactReplay(admissionChecks, document.checks);
	assert.ok(admissionChecks.every((check) => check.state === 'passed'));
	const radial = unit(input.target.origin);
	/** @type {SkyThetaRegionsRow[]} */ const components = [];
	for (const channel of [0, 8]) {
		const old = replayed.find((row) => row.channel === channel);
		assert.ok(old);
		const totals = physical.map(() => accumulator());
		const regional = physical.map(() => ({sun: accumulator(), horizon: accumulator(), other: accumulator()}));
		for (const [index, group] of groups.entries()) {
			const node = representatives[index],
				selected = node.channels.find((c) => c.channel === channel);
			assert.ok(selected && group.incident.mirror);
			const atmosphere = radiance(selected.atmosphere),
				ground = radiance(selected.directGround);
			for (const local of [group.incident.direction, group.incident.mirror]) {
				const weights = volumeJ2Weights(input.spec, input.target, channel, {
					...group.incident,
					direction: local,
					mirror: null,
				});
				const regionsAtMember = partition(radial, incidentWorld(input.target.origin, local));
				for (let part = 0; part < physical.length; part++) {
					const incident = part < 2 ? atmosphere : ground,
						weight = weights[part % 2];
					add(totals[part], incident, weight);
					for (const name of regions) add(regional[part][name], incident, weight * regionsAtMember[name]);
				}
			}
		}
		const parts = physical.map((component, i) =>
			componentRow(document.stage, channel, component, finish(totals[i]), retainedValue(old, component), {
				sun: finish(regional[i].sun),
				horizon: finish(regional[i].horizon),
				other: finish(regional[i].other),
			}),
		);
		components.push(...parts);
		for (const [name, indices] of /** @type {const} */ ([
			['atmosphere', [0, 1]],
			['ground', [2, 3]],
			['combined', [0, 1, 2, 3]],
		])) {
			const selected = indices.map((i) => parts[i]),
				coefficients = selected.map(() => 1);
			components.push(
				componentRow(
					document.stage,
					channel,
					name,
					linear(
						selected.map((row) => row.full),
						coefficients,
					),
					name === 'combined'
						? retainedValue(old, 'combined')
						: linear(
								selected.map((row) => row.retained),
								coefficients,
							),
					{
						sun: linear(
							selected.map((row) => row.regions.sun),
							coefficients,
						),
						horizon: linear(
							selected.map((row) => row.regions.horizon),
							coefficients,
						),
						other: linear(
							selected.map((row) => row.regions.other),
							coefficients,
						),
					},
				),
			);
		}
	}
	return {
		components,
		summary: {
			stage: document.stage,
			representativeCount: representatives.length,
			independentWitnessCount: witnesses.length,
			directionCount: 2 * representatives.length,
			admissionChecks,
		},
	};
}

/** @param {SkySourceReconstructionValue} candidate @param {SkySourceReconstructionValue} full @returns {SkySourceAuditState} */
function sameSign(candidate, full) {
	if (Math.abs(candidate.value) <= candidate.allowance || Math.abs(full.value) <= full.allowance) return 'unresolved';
	return Math.sign(candidate.value) === Math.sign(full.value) ? 'passed' : 'failed';
}

/** Entire magnitude intervals decide pass/fail; overlaps remain unresolved.
 * @param {SkySourceReconstructionValue} candidate @param {SkySourceReconstructionValue} full @returns {SkySourceAuditState}
 */
function atLeastHalf(candidate, full) {
	if (Math.abs(full.value) <= full.allowance) return 'unresolved';
	if (Math.abs(candidate.value) - candidate.allowance >= 0.5 * (Math.abs(full.value) + full.allowance))
		return 'passed';
	if (Math.abs(candidate.value) + candidate.allowance < 0.5 * (Math.abs(full.value) - full.allowance))
		return 'failed';
	return 'unresolved';
}

/** Saved-node response attribution only; all evidence authentication precedes
 * this entry point in the parent reader. No incident integration is performed.
 * @param {SkyAngularThetaInput} input @param {SkyAngularThetaDocument} pilot @param {readonly SkyVolumeJ2Node[]} pilotNodes
 * @param {SkyAngularThetaDocument} fine @param {readonly SkyVolumeJ2Node[]} fineNodes @returns {SkyThetaRegionsResult}
 */
export function evaluateThetaRegions(input, pilot, pilotNodes, fine, fineNodes) {
	assert.equal(input.target.id, 'p-0930-5-7:h1000');
	assert.equal(pilot.stage, 'pilot');
	assert.equal(fine.stage, 'fine');
	assert.deepEqual(pilot.registration, fine.registration);
	const coarse = stageRegions(input, pilot, pilotNodes),
		refined = stageRegions(input, fine, fineNodes);
	const components = [...coarse.components, ...refined.components];
	/** @type {Record<string,SkySourceAuditState>} */ const implementationChecks = {
		pilotExactReplay: 'passed',
		fineExactReplay: 'passed',
		pilotAdmission: 'passed',
		fineAdmission: 'passed',
		partitionBoundsAndUnity: 'passed',
	};
	for (const row of components) {
		implementationChecks[`${row.stage}:${row.channel}:${row.component}:replay`] = row.replay.state;
		implementationChecks[`${row.stage}:${row.channel}:${row.component}:partition`] = row.partition.state;
	}
	const responses = coarse.components.map((base) => {
		const matches = refined.components.filter((r) => r.channel === base.channel && r.component === base.component);
		assert.equal(matches.length, 1);
		const target = matches[0],
			full = linear([target.full, base.full], [1, -1]),
			retained = linear([target.retained, base.retained], [1, -1]);
		const regional = {
			sun: linear([target.regions.sun, base.regions.sun], [1, -1]),
			horizon: linear([target.regions.horizon, base.regions.horizon], [1, -1]),
			other: linear([target.regions.other, base.regions.other], [1, -1]),
		};
		const replay = arithmeticCheck(full, retained),
			partitionCheck = arithmeticCheck(
				linear(
					regions.map((name) => regional[name]),
					[1, 1, 1],
				),
				full,
			);
		implementationChecks[`response:${base.channel}:${base.component}:replay`] = replay.state;
		implementationChecks[`response:${base.channel}:${base.component}:partition`] = partitionCheck.state;
		return {
			channel: base.channel,
			component: base.component,
			full,
			retained,
			regions: regional,
			replay,
			partition: partitionCheck,
		};
	});
	assert.equal(components.length, 28);
	assert.equal(responses.length, 14);
	const atmosphere = responses.find((r) => r.channel === 8 && r.component === 'atmosphere');
	assert.ok(atmosphere);
	const complete = Object.values(implementationChecks).every((s) => s === 'passed');
	const checks = {
		horizonSameSign: complete
			? sameSign(atmosphere.regions.horizon, atmosphere.full)
			: /** @type {const} */ ('unresolved'),
		horizonAtLeastHalf: complete
			? atLeastHalf(atmosphere.regions.horizon, atmosphere.full)
			: /** @type {const} */ ('unresolved'),
	};
	return {
		schemaId: 'sky-angular-theta-regions-v1',
		packageId: 'angular-theta-regions-v1',
		target: input.target,
		components,
		responses,
		stages: [coarse.summary, refined.summary],
		implementationChecks,
		checks,
		predicates: [checks.horizonSameSign, checks.horizonAtLeastHalf],
	};
}

/** Manufactured partition, distinct mirror weight, zero-field, signed response,
 * exact-replay rejection and complete interval-gate checks. No target values.
 * @returns {{checks:number,scope:string}}
 */
export function thetaRegionsProof() {
	let checks = 0;
	/** @param {boolean} condition @returns {void} */ function check(condition) {
		assert.ok(condition, 'Theta regions proof ' + (checks + 1));
		checks++;
	}
	for (const radial of [
		[0, 0, 1],
		[3, 0, 4],
		[1, 2, 3],
	])
		for (const world of [
			[0, 0, 1],
			[0, 0, -1],
			[1, 0, 0],
			[1, 2, 3],
			[-2, 3, -1],
		]) {
			const weights = partition(unit(radial), unit(world));
			check(Object.values(weights).every((x) => x >= 0 && x <= 1));
			check(Math.abs(weights.sun + weights.horizon + weights.other - 1) <= 8 * Number.EPSILON);
		}
	const total = accumulator(),
		regional = {sun: accumulator(), horizon: accumulator(), other: accumulator()};
	const radial = unit([3, 0, 4]);
	// Distinct phase weights expose an accidental doubled-representative shortcut.
	for (const [world, weight] of /** @type {const} */ ([
		[[1, 2, 3], 2],
		[[1, -2, 3], 5],
	])) {
		const weights = partition(radial, unit(world));
		add(total, value(3, 0.1), weight);
		for (const name of regions) add(regional[name], value(3, 0.1), weight * weights[name]);
	}
	const summed = finish(total),
		split = linear(
			regions.map((name) => finish(regional[name])),
			[1, 1, 1],
		);
	check(summed.value === 21 && summed.incidentAllowance === 0.7);
	check(arithmeticCheck(split, summed).state === 'passed');
	check(arithmeticCheck({...split, value: split.value + 1}, summed).state === 'failed');
	check(summed.value !== 2 * 2 * 3);
	const empty = accumulator();
	add(empty, value(0), 4);
	check(finish(empty).value === 0 && finish(empty).allowance === 0);
	const fine = {...value(8, 0.1), incidentAllowance: 0.09, arithmeticAllowance: 0.01},
		coarse = {...value(10, 0.2), incidentAllowance: 0.18, arithmeticAllowance: 0.02};
	const response = linear([fine, coarse], [1, -1]);
	check(response.value === -2 && response.incidentAllowance === 0.27 && response.allowance >= 0.3);
	check(arithmeticCheck(linear([fine, coarse, response], [1, -1, -1]), finish(accumulator())).state === 'passed');
	exactReplay({gauss: 2, simpson: 3}, {gauss: 2, simpson: 3});
	checks++;
	assert.throws(() => exactReplay({gauss: 2, simpson: 3}, {gauss: 2, simpson: 4}));
	checks++;
	const witnesses = [
		{index: 0, mirrorOf: null},
		{index: 1, mirrorOf: null},
		{index: 0, mirrorOf: 0},
		{index: 1, mirrorOf: 1},
	];
	check(witnesses.filter((node) => node.mirrorOf === null).length === 2);
	check(sameSign(value(-2, 0.1), value(-1, 0.1)) === 'passed');
	check(sameSign(value(2, 0.1), value(-1, 0.1)) === 'failed');
	check(sameSign(value(0, 0.1), value(-1, 0.1)) === 'unresolved');
	check(atLeastHalf(value(-0.7, 0.01), value(-1, 0.01)) === 'passed');
	check(atLeastHalf(value(-0.3, 0.01), value(-1, 0.01)) === 'failed');
	check(atLeastHalf(value(-0.5, 0.01), value(-1, 0.01)) === 'unresolved');
	check(atLeastHalf(value(0), value(0, 0.1)) === 'unresolved');
	check(atLeastHalf(value(0, 0.01), value(-1, 0.01)) === 'failed');
	check(atLeastHalf(value(-1.2, 0.01), value(-1, 0.01)) === 'passed');
	assert.throws(() => partition([0, 0, 2], [0, 0, 1]));
	checks++;
	return {
		checks,
		scope: 'Partition bounds/unity, separate reflected phase weights, zero fields, signed linear identities, arithmetic-only replay failures, witness exclusion and all sign/magnitude interval outcomes. No saved target nodes or atmospheric integration.',
	};
}

/** @param {SkyThetaRegionsResult} result @returns {string} */
export function thetaRegionsReport(result) {
	return [
		'# Remaining theta refinement response by angular region',
		'',
		'Fine minus pilot, in W m^-3 sr^-1 nm^-1. Full retained incident radiance is partitioned with fixed Sun/horizon/other weights; both physical mirrors retain their own phase weights.',
		'',
		'| Channel | Component | Full response | Full allowance | Sun | Horizon | Horizon allowance | Other |',
		'| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |',
		...result.responses.map(
			(r) =>
				'| ' +
				[
					r.channel,
					r.component,
					r.full.value,
					r.full.allowance,
					r.regions.sun.value,
					r.regions.horizon.value,
					r.regions.horizon.allowance,
					r.regions.other.value,
				].join(' | ') +
				' |',
		),
		'',
		'| Registered ch8 atmospheric-sum gate | State |',
		'| --- | --- |',
		...Object.entries(result.checks).map(([key, state]) => '| ' + key + ' | ' + state + ' |'),
		'',
		'Implementation checks passed: ' +
			Object.values(result.implementationChecks).filter((s) => s === 'passed').length +
			'/' +
			Object.keys(result.implementationChecks).length +
			'.',
		'JSON retains all stage values, regions, incident/arithmetic allowances, independent mirror admission and accounting residuals. This attributes the response of two retained rules; it does not establish absolute angular error or isolate polar from azimuth refinement. Earlier reference admission remains unchanged.',
		'',
	].join('\n');
}
