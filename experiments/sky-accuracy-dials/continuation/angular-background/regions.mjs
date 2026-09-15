import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {unit} from '../../numerics/math.js';
import {incidentWorld} from '../j2/angular.mjs';
import {volumeJ2Weights, sumVolumeJ2} from '../volume-j2/angular.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {reconstructionValue, reconstructionSum, reconstructionDifference} from '../source-reconstruction/index.mjs';
import {phaseMagnitudeGate} from '../source-reconstruction/phase.mjs';
import {backgroundProduct, evaluateAngularBackground} from './index.mjs';

/** @type {readonly SkyAngularRegion[]} */
const regionNames = ['sun', 'horizon', 'other'];
const cellNames = ['r8-a16', 'r16-a16', 'r8-a32', 'r16-a32'];
const contrasts = [
	{name: 'radial', weights: [-1, 1, 0, 0]},
	{name: 'azimuth', weights: [-1, 0, 1, 0]},
	{name: 'joint', weights: [-1, 0, 0, 1]},
	{name: 'interaction', weights: [1, -1, -1, 1]},
];

/** Authenticate only the accepted fixed predecessor and its unchanged evaluator.
 * @param {DialContinuationRegistrationRead} registration @param {string} run
 * @returns {SkyAngularRegionsBaseline}
 */
export function readAngularRegionsBaseline(registration, run) {
	assert.equal(run, 'tmp/experiments/sky-accuracy-dials/runs/00206-angular-bg');
	const parent = acceptedMechanismInput(run),
		params = /** @type {SkySourcePhaseParentParameters} */ (
			/** @type {unknown} */ (parent.terminal.recipe.parameters)
		);
	assert.equal(params.continuationRegistration, registration.run);
	assert.equal(params.caseId, 'angular-background');
	assert.equal(params.jobKind, 'cpu');
	assert.equal(params.phase, 'C5');
	const c0 = parent.terminal.recipe.parents.find((id) => id.path === registration.seal.path);
	assert.deepEqual(c0, registration.seal);
	assert.ok(Array.isArray(params.sourceIdentities));
	const sources = params.sourceIdentities.filter(
		(id) => id.path === 'experiments/sky-accuracy-dials/continuation/angular-background/index.mjs',
	);
	assert.equal(sources.length, 1);
	readRepository(sources[0].path, sources[0]);
	const artifact = mechanismArtifact(parent, 'decomposition.json'),
		document = /** @type {SkyAngularRegionsBaselineDocument} */ (
			JSON.parse(readRepository(artifact.path, artifact).toString())
		);
	assert.equal(document.schemaId, 'sky-angular-background-v1');
	assert.equal(document.components.length, 40);
	assert.equal(document.responses.length, 40);
	assert.equal(new Set(document.components.map((r) => `${r.cell}:${r.channel}:${r.component}`)).size, 40);
	assert.equal(new Set(document.responses.map((r) => `${r.response}:${r.channel}:${r.component}`)).size, 40);
	return {
		document,
		identities: [
			parent.seal,
			artifact,
			sources[0],
			mechanismArtifact(parent, 'sources.json.gz'),
			mechanismArtifact(parent, 'inputs.json'),
			registration.seal,
		],
	};
}

/** Exact registered smooth partition, evaluated independently for every mirror member.
 * @param {SkyVector3} local @param {SkyVector3} world @returns {Record<SkyAngularRegion,number>}
 */
function partition(local, world) {
	for (const vector of [local, world]) {
		assert.ok(vector.length === 3 && vector.every(Number.isFinite));
		assert.ok(Math.abs(Math.hypot(...vector) - 1) <= 2e-12 && Math.abs(vector[2]) <= 1);
	}
	const sun = ((1 + world[2]) / 2) ** 32,
		horizon = (1 - sun) * Math.exp(-0.5 * (local[2] / 0.1) ** 2),
		other = 1 - sun - horizon;
	assert.ok([sun, horizon, other].every((weight) => Number.isFinite(weight) && weight >= 0 && weight <= 1));
	assert.ok(Math.abs(sun + horizon + other - 1) <= 8 * Number.EPSILON);
	return {sun, horizon, other};
}

/** Same incident value/allowance convention as the immutable background evaluator.
 * @param {SkyVolumeComponent} component @returns {SkySourceReconstructionValue}
 */
function incidentValue(component) {
	assert.ok(
		component.resolved &&
			component.gaussWatts !== null &&
			component.simpsonWatts !== null &&
			component.empiricalAllowanceWatts !== null,
	);
	assert.ok(component.gaussWatts >= 0 && component.simpsonWatts >= 0);
	const value = (component.gaussWatts + component.simpsonWatts) / 2;
	return reconstructionValue(value, component.empiricalAllowanceWatts + 256 * Number.EPSILON * Math.abs(value));
}

/** Both candidate and full directional response need a resolved sign.
 * @param {SkySourceReconstructionValue} candidate @param {SkySourceReconstructionValue} control @returns {SkySourceAuditState}
 */
function sameSign(candidate, control) {
	if (Math.abs(control.value) <= control.allowance || Math.abs(candidate.value) <= candidate.allowance)
		return 'unresolved';
	return Math.sign(candidate.value) === Math.sign(control.value) ? 'passed' : 'failed';
}

/** Registered conservative lower-magnitude test, with no fitted threshold.
 * @param {SkySourceReconstructionValue} candidate @param {SkySourceReconstructionValue} control @returns {SkySourceAuditState}
 */
function atLeastHalf(candidate, control) {
	if (Math.abs(control.value) <= control.allowance) return 'unresolved';
	return Math.abs(candidate.value) - candidate.allowance >= 0.5 * (Math.abs(control.value) + control.allowance)
		? 'passed'
		: 'failed';
}

/** Partition the old directional integral without using incident uncertainty to
 * excuse an algebraic mismatch. Positive weight arithmetic is budgeted separately.
 * @param {SkyAngularBackgroundInput} input @param {SkyAngularBackgroundComponent} original
 * @returns {SkyAngularRegionsComponent}
 */
function componentRegions(input, original) {
	const cell = input.cells.find((item) => item.id === original.cell);
	assert.ok(cell);
	const physical = original.component.startsWith('atmosphere')
			? 'atmosphere'
			: original.component.startsWith('ground')
				? 'directGround'
				: 'total',
		species = original.component.endsWith('Rayleigh') ? 0 : original.component.endsWith('Mie') ? 1 : 2;
	/** @type {Record<SkyAngularRegion,SkySourceReconstructionValue[]>} */ const contributions = {
		sun: [],
		horizon: [],
		other: [],
	};
	/** @type {Record<SkyAngularRegion,number>} */ const scales = {sun: 0, horizon: 0, other: 0};
	let unpartitionedScale = 0,
		memberCount = 0;
	const nodes = new Map(cell.nodes.map((node) => [node.index, node]));
	assert.equal(nodes.size, cell.groups.length);
	for (const [index, group] of cell.groups.entries()) {
		const node = nodes.get(index),
			channel = node?.channels.find((value) => value.channel === original.channel);
		assert.ok(node && node.mirrorOf === null && channel);
		assert.ok(group.incident.mirror, 'The frozen rules require both source-plane mirror members.');
		const residual = reconstructionDifference(incidentValue(channel[physical]), original.constant);
		for (const local of [group.incident.direction, group.incident.mirror]) {
			const world = incidentWorld(cell.target.origin, local),
				regions = partition(local, world),
				pair = volumeJ2Weights(input.spec, cell.target, original.channel, {
					...group.incident,
					direction: local,
					mirror: null,
				}),
				weight = species === 2 ? pair[0] + pair[1] : pair[species];
			assert.ok(Number.isFinite(weight) && weight >= 0);
			memberCount++;
			unpartitionedScale += Math.abs(weight * residual.value);
			for (const region of regionNames) {
				const regionalWeight = weight * regions[region],
					weighted = backgroundProduct(
						residual,
						reconstructionValue(regionalWeight, 1024 * Number.EPSILON * regionalWeight),
					);
				contributions[region].push(weighted);
				scales[region] += Math.abs(weighted.value);
			}
		}
	}
	/** @type {Record<SkyAngularRegion,SkySourceReconstructionValue>} */ const regions = {
		sun: reconstructionValue(0),
		horizon: reconstructionValue(0),
		other: reconstructionValue(0),
	};
	/** @type {Record<SkyAngularRegion,number>} */ const arithmeticAllowances = {sun: 0, horizon: 0, other: 0};
	for (const region of regionNames) {
		const sum = reconstructionSum(
			contributions[region],
			contributions[region].map(() => 1),
		);
		const arithmetic = 2048 * Number.EPSILON * Math.max(1, memberCount) * scales[region];
		arithmeticAllowances[region] = arithmetic;
		regions[region] = reconstructionValue(sum.value, sum.allowance + arithmetic);
	}
	const partitionTotal = reconstructionSum(
			regionNames.map((name) => regions[name]),
			[1, 1, 1],
		),
		partitionResidual = partitionTotal.value - original.directional.value,
		partitionArithmeticAllowance =
			2048 *
			Number.EPSILON *
			Math.max(1, memberCount) *
			(unpartitionedScale +
				Math.abs(original.directional.value) +
				regionNames.reduce((sum, name) => sum + Math.abs(regions[name].value), 0));
	assert.ok(
		Math.abs(partitionResidual) <= partitionArithmeticAllowance,
		'Region partition does not reproduce the preceding directional sum within its arithmetic allowance.',
	);
	return {
		...original,
		regions,
		arithmeticAllowances,
		partitionTotal,
		partitionResidual,
		partitionArithmeticAllowance,
	};
}

/** Exactly replay the preceding attribution, then locate the retained rule responses.
 * No incident solve, angular oracle, fitted constant or changed phase rule enters.
 * @param {SkyAngularBackgroundInput} input @param {SkyAngularRegionsBaseline} baseline
 * @returns {SkyAngularRegionsResult}
 */
export function evaluateAngularRegions(input, baseline) {
	assert.deepEqual(
		input.cells.map((cell) => cell.id),
		cellNames,
	);
	const original = evaluateAngularBackground(input);
	assert.deepEqual(original.components, baseline.document.components);
	assert.deepEqual(original.responses, baseline.document.responses);
	const components = original.components.map((component) => componentRegions(input, component));
	/** @type {SkySourceAuditState[]} */ const predicates = [];
	const responses = original.responses.map((response) => {
		const contrast = contrasts.find((item) => item.name === response.response),
			selected = components.filter(
				(component) => component.channel === response.channel && component.component === response.component,
			);
		assert.ok(contrast);
		assert.deepEqual(
			selected.map((component) => component.cell),
			cellNames,
		);
		/** @type {Record<SkyAngularRegion,SkySourceReconstructionValue>} */ const regions = {
			sun: reconstructionValue(0),
			horizon: reconstructionValue(0),
			other: reconstructionValue(0),
		};
		/** @type {Record<SkyAngularRegion,number>} */ const arithmeticAllowances = {sun: 0, horizon: 0, other: 0};
		for (const region of regionNames) {
			regions[region] = reconstructionSum(
				selected.map((component) => component.regions[region]),
				contrast.weights,
			);
			arithmeticAllowances[region] = selected.reduce(
				(sum, component, i) =>
					sum +
					Math.abs(contrast.weights[i]) * component.arithmeticAllowances[region] +
					256 * Number.EPSILON * Math.abs(contrast.weights[i] * component.regions[region].value),
				0,
			);
		}
		const partitionTotal = reconstructionSum(
				regionNames.map((region) => regions[region]),
				[1, 1, 1],
			),
			partitionResidual = partitionTotal.value - response.directional.value,
			partitionArithmeticAllowance =
				selected.reduce(
					(sum, component, i) => sum + Math.abs(contrast.weights[i]) * component.partitionArithmeticAllowance,
					0,
				) +
				2048 *
					Number.EPSILON *
					(Math.abs(response.directional.value) +
						selected.reduce(
							(sum, component, i) =>
								sum +
								Math.abs(contrast.weights[i]) *
									(Math.abs(component.directional.value) +
										regionNames.reduce(
											(s, region) => s + Math.abs(component.regions[region].value),
											0,
										)),
							0,
						));
		assert.ok(
			Math.abs(partitionResidual) <= partitionArithmeticAllowance,
			'Region responses do not reproduce the preceding directional contrast within its arithmetic allowance.',
		);
		const registered = response.component === 'combined' && response.response !== 'interaction',
			sunSameSign = registered ? sameSign(regions.sun, response.directional) : null,
			sunAtLeastHalf = registered ? atLeastHalf(regions.sun, response.directional) : null,
			horizonAtMostTenth =
				registered && response.response === 'joint'
					? phaseMagnitudeGate(regions.horizon, response.directional, 0.1)
					: null;
		if (registered) predicates.push(sunSameSign, sunAtLeastHalf);
		if (horizonAtMostTenth !== null) predicates.push(horizonAtMostTenth);
		return {
			...response,
			regions,
			arithmeticAllowances,
			partitionTotal,
			partitionResidual,
			partitionArithmeticAllowance,
			sunSameSign,
			sunAtLeastHalf,
			horizonAtMostTenth,
		};
	});
	assert.equal(components.length, 40);
	assert.equal(responses.length, 40);
	assert.equal(predicates.length, 14);
	return {components, responses, predicates};
}

/** Manufactured-only checks; no retained atmospheric values or integrations.
 * @returns {{checks:number,scope:string}}
 */
export function angularRegionsProof() {
	let checks = 0;
	const check = (/** @type {boolean} */ value) => {
			assert.ok(value, 'Angular regions proof ' + (checks + 1));
			checks++;
		},
		rejects = (/** @type {()=>unknown} */ operation) => {
			assert.throws(operation);
			checks++;
		};
	check(partition([0, 0, 1], [0, 0, 1]).sun === 1);
	check(partition([0, 0, -1], [0, 0, -1]).sun === 0);
	check(partition([1, 0, 0], [0, 0, -1]).horizon === 1);
	check(partition([0, 0, 1], [0, 0, -1]).horizon < 2e-22);
	for (let index = 0; index < 64; index++) {
		const local = unit([Math.sin(index + 0.3), Math.cos(index + 0.7), (index - 31.5) / 32]),
			world = unit([local[2], local[0], local[1]]),
			weights = partition(local, world);
		check(regionNames.every((name) => weights[name] >= 0 && weights[name] <= 1));
		check(Math.abs(weights.sun + weights.horizon + weights.other - 1) <= 8 * Number.EPSILON);
	}
	rejects(() => partition([0, 0, NaN], [0, 0, 1]));
	rejects(() => partition([0, 0, 2], [0, 0, 1]));
	const v = reconstructionValue;
	check(sameSign(v(1), v(2)) === 'passed');
	check(sameSign(v(-1), v(2)) === 'failed');
	check(sameSign(v(0, 1), v(2)) === 'unresolved');
	check(sameSign(v(2), v(0, 1)) === 'unresolved');
	check(atLeastHalf(v(1), v(2)) === 'passed');
	check(atLeastHalf(v(1, 0.01), v(2)) === 'failed');
	check(atLeastHalf(v(1), v(0, 1)) === 'unresolved');
	check(phaseMagnitudeGate(v(0.1), v(1), 0.1) === 'passed');
	check(phaseMagnitudeGate(v(0.1, 0.01), v(1), 0.1) === 'failed');
	check(phaseMagnitudeGate(v(0), v(0, 1), 0.1) === 'unresolved');
	// Minimal manufactured physical metadata; all fields consumed by medium/phase are supplied.
	const spec = /** @type {SkyTransportSpec} */ (
		/** @type {unknown} */ ({
			planet: {bottomRadiusMeters: 99900, topRadiusMeters: 190000},
			atmosphere: {
				rayleighScaleHeightMeters: 8000,
				mieScaleHeightMeters: 1200,
				mieSingleScatteringAlbedo: 0.9,
				miePhaseFunctionG: 0.7,
			},
			domains: {
				spectrum: {
					channels: Array.from({length: 9}, () => ({
						rayleighScatteringPerMeter: 1e-5,
						mieExtinctionPerMeter: 2e-5,
					})),
				},
			},
		})
	);
	const origin = /** @type {SkyVector3} */ ([60000, 0, 80000]),
		target = {
			id: 'manufactured',
			probeId: 'manufactured',
			heightMeters: 100,
			distanceMeters: 100,
			surfaceOrigin: /** @type {SkyVector3} */ ([59940, 0, 79920]),
			origin,
			direction: incidentWorld(origin, unit([0.1, 0.8, 0.3])),
		},
		locals = [unit([0.3, 0.4, 0.8]), unit([-0.6, 0.8, 0])];
	/** @param {boolean} zero @returns {SkyAngularBackgroundInput} */ function manufactured(zero) {
		const cells = cellNames.map((id, ordinal) => {
			const fractions = [0.25, 0.4, 0.3, 0.45],
				fraction = fractions[ordinal];
			const groups = locals.map((direction, index) => ({
				branch: /** @type {SkyVolumeBranch} */ ('volume-outward'),
				incident: {
					direction,
					mirror: /** @type {SkyVector3} */ ([direction[0], -direction[1], direction[2]]),
					weight: 2 * Math.PI * (index === 0 ? fraction : 1 - fraction),
				},
			}));
			/** @param {number} value @returns {SkyVolumeComponent} */ const component = (value) => ({
				gaussWatts: value,
				simpsonWatts: value,
				methodDifferenceWatts: 0,
				empiricalAllowanceWatts: 0,
				resolved: true,
				reasons: [],
			});
			const nodes = groups.map((group, index) => ({
				targetId: target.id,
				index,
				mirrorOf: null,
				direction: incidentWorld(origin, group.incident.direction),
				branch: group.branch,
				elapsedMilliseconds: 0,
				mediumEvaluations: 0,
				outerEvaluations: 0,
				channels: [0, 8].map((channel) => ({
					channel,
					atmosphere: component(zero ? 0 : 1 + index),
					directGround: component(zero ? 0 : 0.2 + 0.1 * index),
					total: component(zero ? 0 : 1.2 + 1.1 * index),
				})),
			}));
			return {id, target, groups, nodes, rows: sumVolumeJ2(spec, target, [0, 8], groups, nodes)};
		});
		return {spec, cells, identities: []};
	}
	const input = manufactured(false),
		original = evaluateAngularBackground(input),
		baseline = {
			document: {schemaId: /** @type {const} */ ('sky-angular-background-v1'), ...original},
			identities: [],
		},
		before = JSON.stringify({input, baseline}),
		result = evaluateAngularRegions(input, baseline);
	check(JSON.stringify({input, baseline}) === before);
	check(result.predicates.length === 14 && result.responses.length === 40 && result.components.length === 40);
	for (const row of [...result.components, ...result.responses])
		check(Math.abs(row.partitionResidual) <= row.partitionArithmeticAllowance);
	const g = input.cells[0].groups[0].incident,
		first = volumeJ2Weights(spec, target, 0, {...g, mirror: null}),
		second = volumeJ2Weights(spec, target, 0, {...g, direction: g.mirror, mirror: null}),
		both = volumeJ2Weights(spec, target, 0, g);
	check(Math.abs(both[1] - first[1] - second[1]) <= 8 * Number.EPSILON * both[1]);
	check(Math.abs(first[1] - second[1]) > 0.1 * both[1]);
	const q = partition(g.direction, incidentWorld(origin, g.direction)),
		qm = partition(g.mirror, incidentWorld(origin, g.mirror));
	check(Math.abs(q.sun - qm.sun) < 1e-12 && Math.abs(q.horizon - qm.horizon) < 1e-12);
	const zeroInput = manufactured(true),
		zeroBaseline = {
			document: {
				schemaId: /** @type {const} */ ('sky-angular-background-v1'),
				...evaluateAngularBackground(zeroInput),
			},
			identities: [],
		},
		zero = evaluateAngularRegions(zeroInput, zeroBaseline);
	check(zero.components.every((row) => regionNames.every((name) => row.regions[name].value === 0)));
	check(zero.predicates.every((state) => state === 'unresolved'));
	const broken = structuredClone(baseline);
	broken.document.components[0] = {...broken.document.components[0], directional: v(1e5)};
	rejects(() => evaluateAngularRegions(input, broken));
	return {
		checks,
		scope: 'Smooth partition bounds/unity, Sun/opposite/horizon limits, distinct mirror phases, exact unchanged-background replay, arithmetic-only component/contrast identities, zero and failed/unresolved predicates.',
	};
}

/** Compact registered outcomes; complete species/ground/interaction partitions remain in JSON.
 * @param {SkyAngularRegionsResult} result @returns {string}
 */
export function angularRegionsReport(result) {
	return [
		'# Regions of the directional angular response',
		'',
		'Frozen p-0930-5-7:h1000, channels0/8. Values are density responses in W m^-3 sr^-1 nm^-1. The original retained-grid diagnostic means and all four angular rules are unchanged.',
		'',
		'| Channel | Change | Full directional response | Sun | Horizon | Other | Sun sign | Sun >=50% | Horizon <=10% |',
		'| ---: | --- | ---: | ---: | ---: | ---: | --- | --- | --- |',
		...result.responses
			.filter((row) => row.component === 'combined')
			.map(
				(row) =>
					`| ${row.channel} | ${row.response} | ${row.directional.value} | ${row.regions.sun.value} | ${row.regions.horizon.value} | ${row.regions.other.value} | ${row.sunSameSign ?? 'not registered'} | ${row.sunAtLeastHalf ?? 'not registered'} | ${row.horizonAtMostTenth ?? 'not registered'} |`,
			),
		'',
		'Both source-plane mirror members use their own phase and partition weights. All component and response partitions reproduce the preceding directional sums within arithmetic-only allowances, separately from incident uncertainty. JSON retains all propagated allowances and all fourteen registered outcomes.',
		'',
		'These smooth weights locate responses of the retained three-interval rules. They do not define hard sky regions, establish absolute angular error, make the fine rule an oracle, or qualify production-H, GPU, complete-view or Kider accuracy.',
		'',
	].join('\n');
}
