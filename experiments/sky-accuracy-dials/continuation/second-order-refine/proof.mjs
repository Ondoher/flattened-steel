import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {identity} from '../../io/files.mjs';
import {loadInputs} from '../../execution.mjs';
import {readRegistration} from '../registration/run.mjs';
import {viewAngularRules} from '../second-order-view/geometry.mjs';
import {integrateSecondOrderView} from '../second-order-view/integrate.mjs';
import {secondOrderOuterRule} from '../second-order-rule/geometry.mjs';
import {resolveVolumeGeometry} from '../volume-reference/geometry.mjs';
import {assembleClosestVolumeResult} from '../incident-coordinate/index.mjs';
import {incidentFallbackProof} from '../incident-coordinate/fallback-proof.mjs';
import {
	readSecondOrderIncidentAdmission,
	assertSecondOrderIncidentAdmission,
	readSecondOrderIncidentUse,
	createSecondOrderIncidentCollector,
	secondOrderIncidentWork,
} from './incident.mjs';
import {
	secondOrderPhysicalKey,
	secondOrderNumericalCore,
	assertSecondOrderReusablePoint,
	aliasSecondOrderPoint,
	attachSecondOrderPoints,
	secondOrderRefinementSelection,
} from './run.mjs';

/** Manufacture fully specified admitted constant-source evidence for algebra checks only.
 * @param {SkySecondOrderViewNode} node - Exact physical address; no radiation is evaluated.
 * @param {SkySecondOrderReusePolicy} policy - Declared proof controls.
 * @returns {SkySecondOrderPoint} Manufactured fields, unit transmission and zero numerical work.
 */
function manufacturedPoint(node, policy) {
	/** @param {number} value - Manufactured density. @returns {SkyVolumeJ2Estimate} Exact constant. */
	const estimate = (value) => ({gauss: value, simpson: value, mean: value, incidentAllowance: 0, resolved: true});
	/** @type {SkySecondOrderViewColumns[]} */ const columns = [];
	/** @type {readonly SkyPhysicalReferenceMethod[]} */ const methods = ['gauss', 'simpson'];
	for (const method of methods)
		for (const toleranceScale of [4, 1])
			columns.push({
				method,
				toleranceScale,
				columns: {
					rayleighMeters: 0,
					mieMeters: 0,
					errorRayleighMeters: 0,
					errorMieMeters: 0,
					evaluations: 0,
					converged: true,
					reason: null,
				},
			});
	return {
		node,
		transmission: {
			columns,
			mediumEvaluations: 0,
			channels: policy.channels.map((channel) => ({
				channel,
				gauss: 1,
				simpson: 1,
				mean: 1,
				allowance: 0,
				resolved: true,
			})),
		},
		angular: policy.angularRules.map((rule) => ({
			rule,
			incidentCount: rule === 'ordinary-coarse' ? 192 : 768,
			geometryPassed: true,
			incidentsPassed: true,
			rows: policy.channels.map((channel) => ({
				channel,
				atmosphereRayleigh: estimate(1),
				atmosphereMie: estimate(2),
				groundRayleigh: estimate(3),
				groundMie: estimate(4),
				combined: estimate(10),
				sumDifference: 0,
				arithmeticAllowance: 0,
				sumIdentityPassed: true,
			})),
		})),
		elapsedMilliseconds: 0,
		workerMilliseconds: 0,
		mediumEvaluations: 0,
		outerEvaluations: 0,
	};
}

/** Verify exact reuse, policy rejection, distinct weighted aliases and missing terms.
 * The original geometry provides addresses only. All radiation values in this
 * proof are manufactured constants; no physical solve or evidence run executes.
 * @param {DialContinuationRegistrationRead} registration - Original authenticated C0 geometry.
 * @param {SkyTransportSpec} spec - Matched sphere radii.
 * @returns {SkySecondOrderRefinementProof} Actual local algebra and rejection checks.
 */
export function secondOrderRefinementProof(registration, spec) {
	let checks = 0;
	/** @type {SkySecondOrderReusePolicy} */ const policy = {
		channels: [0, 8],
		physicalProfile: 'simpson-expanded-medium',
		outerStrategy: 'global',
		angularRules: viewAngularRules,
	};
	const rule = secondOrderOuterRule(registration, spec, 'p-0930-5-7', 'simpson-height', 4);
	const shared = rule.nodes.filter((node) => node.heightMeters === 1875),
		node = shared[0];
	assert.equal(shared.length, 2);
	checks++;
	const point = manufacturedPoint(node, policy);
	/** @type {SkySecondOrderReuseEntry} */ const entry = {point, policy, parentRun: null, artifact: null};
	assertSecondOrderReusablePoint(point, policy);
	checks++;
	const key = secondOrderPhysicalKey(node, policy);
	assert.equal(
		secondOrderPhysicalKey(shared[1], policy),
		key,
		'Only outer term metadata differs at a shared endpoint.',
	);
	checks++;
	const alias = aliasSecondOrderPoint(shared[1], entry, policy);
	assert.deepEqual(alias.node, shared[1]);
	checks++;
	assert.deepEqual(alias.angular, point.angular);
	checks++;
	assert.deepEqual(alias.transmission, point.transmission);
	checks++;
	assert.notEqual(alias.angular, point.angular, 'Alias copies do not expose mutable parent numerical arrays.');
	checks++;
	assert.notEqual(
		alias.node.weightMeters,
		point.node.weightMeters,
		'Shared endpoint terms preserve their own interval weights.',
	);
	checks++;
	const metadataOnly = {...node, id: 'different-id', index: 777, interval: 3, weightMeters: node.weightMeters * 2};
	assert.equal(secondOrderPhysicalKey(metadataOnly, policy), key);
	checks++;
	const changedOrigin = /** @type {SkyVector3} */ ([node.origin[0] + 1, node.origin[1], node.origin[2]]);
	const changedSurface = /** @type {SkyVector3} */ ([
		node.surfaceOrigin[0] + 1,
		node.surfaceOrigin[1],
		node.surfaceOrigin[2],
	]);
	const changedDirection = /** @type {SkyVector3} */ ([
		node.direction[0],
		node.direction[1] + 1e-6,
		node.direction[2],
	]);
	for (const changed of [
		{...node, origin: changedOrigin},
		{...node, surfaceOrigin: changedSurface},
		{...node, direction: changedDirection},
		{...node, distanceMeters: node.distanceMeters + 1},
		{...node, heightMeters: node.heightMeters + 1},
		{...node, probeId: 'p-1230-3-5'},
	]) {
		assert.notEqual(secondOrderPhysicalKey(changed, policy), key);
		checks++;
		assert.throws(() => aliasSecondOrderPoint(changed, entry, policy), /reuse is forbidden/);
		checks++;
	}
	/** @type {SkySecondOrderReusePolicy[]} */ const changedPolicies = [
		{...policy, channels: [8, 0]},
		{...policy, physicalProfile: 'standard'},
		{...policy, outerStrategy: 'local'},
		{...policy, angularRules: ['ordinary-fine', 'ordinary-coarse', 'mapped-fine']},
	];
	for (const changed of changedPolicies) {
		assert.notEqual(secondOrderPhysicalKey(node, changed), key);
		checks++;
		assert.throws(() => aliasSecondOrderPoint(node, entry, changed), /reuse is forbidden/);
		checks++;
	}
	const inventory = new Map([[key, entry]]),
		attached = attachSecondOrderPoints(rule.nodes, inventory, policy);
	assert.equal(attached.points.length, 2);
	checks++;
	assert.deepEqual(
		attached.points.map((value) => value.node.id),
		shared.map((value) => value.id),
	);
	checks++;
	assert.equal(new Set(attached.derivations.map((value) => value.physicalKeySha256)).size, 1);
	checks++;
	assert.ok(
		attached.derivations.every(
			(value) => value.currentComputedNodeId === node.id && value.sourceKind === 'current',
		),
	);
	checks++;
	const subset = integrateSecondOrderView(shared, attached.points, policy.channels);
	const expected = 10 * (shared[0].weightMeters + shared[1].weightMeters);
	assert.ok(
		subset
			.filter((value) => value.interval === 'all' && value.component === 'combined')
			.every(
				(value) => value.complete && Math.abs(value.valueWatts - expected) <= 16 * Number.EPSILON * expected,
			),
	);
	checks++;
	const incomplete = integrateSecondOrderView(rule.nodes, attached.points, policy.channels);
	assert.ok(
		incomplete
			.filter((value) => value.interval === 'all' || value.interval === 2 || value.interval === 3)
			.every(
				(value) =>
					!value.complete &&
					value.valueWatts === null &&
					value.incidentAllowanceWatts === null &&
					value.viewAllowanceWatts === null,
			),
	);
	checks++;
	const unavailable = attachSecondOrderPoints(rule.nodes, new Map(), policy);
	assert.equal(unavailable.points.length, 0);
	checks++;
	assert.ok(
		integrateSecondOrderView(rule.nodes, unavailable.points, policy.channels).every(
			(value) => !value.complete && value.valueWatts === null,
		),
	);
	checks++;
	assert.throws(() => assertSecondOrderReusablePoint({...point, angular: []}, policy));
	checks++;
	assert.throws(() =>
		assertSecondOrderReusablePoint({...point, transmission: {...point.transmission, channels: []}}, policy),
	);
	checks++;
	assert.throws(() =>
		assertSecondOrderReusablePoint({...point, transmission: {...point.transmission, columns: []}}, policy),
	);
	checks++;
	const unresolved = {
		...point,
		transmission: {
			...point.transmission,
			channels: point.transmission.channels.map((channel, index) =>
				index === 0 ? {...channel, resolved: false} : channel,
			),
		},
	};
	assert.throws(() => assertSecondOrderReusablePoint(unresolved, policy));
	checks++;
	const parentArtifact = {
		path: 'tmp/experiments/sky-accuracy-dials/runs/manufactured/view.json',
		byteLength: 1,
		sha256: '0'.repeat(64),
	};
	const parentAttached = attachSecondOrderPoints(
		shared,
		new Map([[key, {...entry, parentRun: 'manufactured-parent', artifact: parentArtifact}]]),
		policy,
	);
	assert.ok(
		parentAttached.derivations.every(
			(value) =>
				value.parentRun === 'manufactured-parent' &&
				value.parentArtifact === parentArtifact &&
				value.originalNodeId === node.id &&
				value.currentComputedNodeId === null,
		),
	);
	checks++;
	const complete = new Map(
		rule.nodes.map((value) => [
			secondOrderPhysicalKey(value, policy),
			{point: manufacturedPoint(value, policy), policy, parentRun: null, artifact: null},
		]),
	);
	assert.equal(complete.size, 16, 'The coarse Simpson rule requires only sixteen unique physical solves.');
	checks++;
	const refined = secondOrderOuterRule(registration, spec, 'p-0930-5-7', 'simpson-height', 8);
	assert.equal(
		attachSecondOrderPoints(refined.nodes, complete, policy).points.length,
		19,
		'Nested physical solves supply every original endpoint term.',
	);
	checks++;
	const fresh = new Set(
		refined.nodes.map((value) => secondOrderPhysicalKey(value, policy)).filter((value) => !complete.has(value)),
	);
	assert.equal(fresh.size, 16, 'Only sixteen newly inserted unique points need physical evaluation.');
	checks++;
	/** @type {readonly SkySecondOrderRefinementStage[]} */ const stages = [
		'simpson4',
		'gauss8-low',
		'gauss8-high',
		'simpson8',
	];
	for (const stage of stages) {
		const selection = secondOrderRefinementSelection(registration, spec, stage);
		assert.equal(selection.rule.nodes.length, stage === 'simpson4' ? 19 : stage === 'simpson8' ? 35 : 32);
		checks++;
		assert.equal(selection.selected.length, stage.startsWith('gauss') ? 16 : selection.rule.nodes.length);
		checks++;
		assert.ok(selection.selected.every((value) => selection.intervals.includes(value.interval)));
		checks++;
	}
	const selected = [
		'numerics/math.js',
		'continuation/volume-reference/method.mjs',
		'continuation/reference/physical/columns.mjs',
		'continuation/j2/angular.mjs',
		'continuation/second-order-view/integrate.mjs',
		'continuation/volume-worker/pool.mjs',
	];
	const excluded = [
		'numerics/types.d.ts',
		'continuation/volume-reference/proof.mjs',
		'continuation/reference/physical/global-proof.mjs',
		'continuation/second-order-view/run.mjs',
		'continuation/volume-worker/proof.mjs',
		'continuation/volume-worker/README.md',
		'continuation/second-order-refine/run.mjs',
	];
	const sources = [...selected, ...excluded].map((relative) => ({
		path: `experiments/sky-accuracy-dials/${relative}`,
		byteLength: 1,
		sha256: '0'.repeat(64),
	}));
	assert.deepEqual(
		secondOrderNumericalCore(sources)
			.map((source) => source.path)
			.sort(),
		selected.map((relative) => `experiments/sky-accuracy-dials/${relative}`).sort(),
	);
	checks++;
	checks += secondOrderIncidentCollectorProof(registration, spec).checks;
	return {schemaId: 'sky-second-order-refinement-proof-v1', checks};
}

/** Exercise real callback retention on manufactured empty rays, without radiation evaluation.
 * @param {DialContinuationRegistrationRead} registration - Authenticated original C0.
 * @param {SkyTransportSpec} spec - Original radii; empty rays query no medium.
 * @returns {SkySecondOrderRefinementProof} Actual source rejection, work and interruption checks.
 */
export function secondOrderIncidentCollectorProof(registration, spec) {
	let checks = incidentFallbackProof().checks;
	const admitted = readSecondOrderIncidentAdmission(registration.run);
	for (const key of /** @type {const} */ (['witnessSeal', 'witnessReference', 'plan'])) {
		const changed = structuredClone(admitted.admission);
		changed[key].sha256 = '0'.repeat(64);
		assert.throws(() => assertSecondOrderIncidentAdmission(changed, admitted.admission));
		checks++;
	}
	const changedSources = structuredClone(admitted.admission);
	changedSources.sources[0].sha256 = '0'.repeat(64);
	assert.throws(() => assertSecondOrderIncidentAdmission(changedSources, admitted.admission));
	checks++;
	const geometry = resolveVolumeGeometry(spec, [0, 0, spec.planet.topRadiusMeters], [0, 0, 1]);
	/** @param {SkyPhysicalReferenceMethod} method - Manufactured independent method.
	 * @param {boolean} inconsistent - Manufacture only the eligible old Simpson failure.
	 * @returns {SkyPhysicalMethodResult} Complete empty-ray method with declared historical work.
	 */
	function method(method, inconsistent) {
		const values = [0, 0, 0, 0, 0, 0],
			coarseValues = inconsistent ? [0.01, 0, 0, 0, 0.01, 0] : [...values];
		return {
			method,
			values,
			coarseValues,
			refinementDifferences: coarseValues.map(Math.abs),
			outerErrors: [...values],
			innerAllowances: [...values],
			mediumEvaluations: 20,
			outerEvaluations: 4,
			converged: true,
			reasons: [],
			passes: [4, 1].map((toleranceScale) => ({
				toleranceScale,
				elapsedMilliseconds: 0,
				mediumEvaluations: 10,
				outerEvaluations: 2,
				columnCalls: 2,
				maximumColumnEvaluationsUsed: 5,
				converged: true,
				reason: null,
			})),
		};
	}
	const original = {
		...assembleClosestVolumeResult(geometry, [0, 8], method('gauss', false), method('simpson', true), {
			profile: 'simpson-expanded-medium',
			outerStrategy: 'global',
		}),
		schemaId: 'sky-independent-volume-l1-v1',
	};
	const originalRow = {id: 'manufactured-empty', result: original, elapsedMilliseconds: 123.5};
	const snapshot = JSON.stringify(originalRow);
	const node = {
		...secondOrderOuterRule(registration, spec, 'p-0930-5-7', 'gauss-height', 4).nodes[0],
		origin: geometry.origin,
		direction: geometry.direction,
	};
	/** @type {SkySecondOrderIncidentBatch[]} */ const artifacts = [];
	/** @type {SkySecondOrderIncidentWriter} */
	const write = (name, bytes) => {
		artifacts.push(JSON.parse(gunzipSync(bytes).toString()));
		return identity('manufactured/' + name, Buffer.from(bytes));
	};
	const collector = createSecondOrderIncidentCollector(spec, [0, 8], admitted, write, () => 1024 ** 2);
	const result = collector.evaluate(node, [originalRow], () => {});
	assert.ok(result.rows[0].result.resolved && result.incidentCoordinate);
	checks++;
	assert.equal(result.workerMilliseconds, 123.5);
	checks++;
	assert.equal(result.mediumEvaluations, 40);
	checks++;
	assert.equal(result.outerEvaluations, 8);
	checks++;
	assert.equal(collector.work.originalMediumEvaluations, 40);
	checks++;
	assert.equal(collector.work.mainThreadMediumEvaluations, 0);
	checks++;
	assert.equal(collector.batches[0].extraWork.mediumEvaluations, 20);
	checks++;
	assert.equal(JSON.stringify(originalRow), snapshot);
	checks++;
	assert.deepEqual(result.incidentCoordinate.attemptIds, [originalRow.id]);
	checks++;
	assert.equal(artifacts[0].records.length, 1);
	checks++;
	assert.deepEqual(readSecondOrderIncidentUse({node}, admitted.admission), []);
	checks++;
	const additional = {...method('simpson', false), mediumEvaluations: 17, outerEvaluations: 9};
	const work = secondOrderIncidentWork([originalRow], [additional]);
	assert.equal(work.originalMediumEvaluations + work.mainThreadMediumEvaluations, 57);
	checks++;
	assert.equal(work.originalOuterEvaluations + work.mainThreadOuterEvaluations, 17);
	checks++;
	const sentinel = new Error('Manufactured post-attempt cancellation');
	const cancelled = createSecondOrderIncidentCollector(spec, [0, 8], admitted, write, () => 1024 ** 2);
	assert.throws(
		() =>
			cancelled.evaluate(node, [originalRow], () => {
				if (cancelled.batches[0].records.length) throw sentinel;
			}),
		(error) => error === sentinel,
	);
	checks++;
	assert.equal(cancelled.batches[0].records.length, 1);
	checks++;
	assert.ok(cancelled.batches[0].artifact && !cancelled.batches[0].complete);
	checks++;
	assert.equal(cancelled.work.originalMediumEvaluations, 40);
	checks++;
	assert.equal(cancelled.originalWitnesses.length, 1);
	checks++;
	const interrupted = createSecondOrderIncidentCollector(spec, [0, 8], admitted, write, () => 1024 ** 2);
	let guards = 0;
	assert.throws(
		() =>
			interrupted.evaluate(node, [originalRow], () => {
				if (++guards === 3) throw sentinel;
			}),
		(error) => error === sentinel,
	);
	checks++;
	assert.equal(interrupted.batches[0].interruptions.length, 1);
	checks++;
	assert.equal(interrupted.batches[0].records.length, 0);
	checks++;
	assert.equal(interrupted.batches[0].interruptions[0].mediumEvaluations, null);
	checks++;
	assert.equal(interrupted.batches[0].interruptions[0].outerEvaluations, null);
	checks++;
	assert.ok(interrupted.batches[0].artifact);
	checks++;
	assert.equal(interrupted.work.originalMediumEvaluations, 40);
	checks++;
	const bounded = createSecondOrderIncidentCollector(spec, [0, 8], admitted, write, () => 1024 ** 2);
	assert.throws(
		() =>
			bounded.evaluate(
				node,
				Array.from({length: 9}, (_, index) => ({...originalRow, id: String(index)})),
				() => {
					throw sentinel;
				},
			),
		(error) => error === sentinel,
	);
	checks++;
	assert.equal(bounded.originalWitnesses.length, 8);
	checks++;
	assert.equal(bounded.work.returnedRows, 9);
	checks++;
	return {schemaId: 'sky-second-order-incident-collector-proof-v1', checks};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 3, 'Pass the immutable original C0 registration path.');
	console.log(
		JSON.stringify(
			secondOrderRefinementProof(readRegistration(process.argv[2]), loadInputs().native48.transportSpec),
			null,
			2,
		),
	);
}
