import assert from 'node:assert/strict';
import {readSecondOrderCondition} from '../second-order-transfer/context.mjs';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {freemem, cpus} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {loadInputs} from '../../execution.mjs';
import {
	checkedAbsolute,
	createRun,
	identity,
	readRepository,
	sha256,
	sourceIdentities,
	storage,
	verifyRun,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {incidentWorld} from '../j2/angular.mjs';
import {volumeJ2Groups, sumVolumeJ2} from '../volume-j2/angular.mjs';
import {createVolumeWorkerPool} from '../volume-worker/pool.mjs';
import {volumeWorkerProof} from '../volume-worker/proof.mjs';
import {secondOrderViewNodes, viewAngularRules} from '../second-order-view/geometry.mjs';
import {integrateSecondOrderView, viewComponents} from '../second-order-view/integrate.mjs';
import {
	assertSecondOrderReusablePoint,
	readSecondOrderRefinementParent,
	secondOrderPhysicalKey,
	secondOrderNumericalCore,
	secondOrderNumericalReuseFilter,
} from '../second-order-refine/run.mjs';
import {secondOrderAngularRefinementProof} from './proof.mjs';
import {
	readSecondOrderIncidentAdmission,
	readSecondOrderIncidentUse,
	createSecondOrderIncidentCollector,
} from '../second-order-refine/incident.mjs';

const allocatedBytes = 4 * 1024 ** 2,
	terminalReserveBytes = 768 * 1024;
const extensionId = 'compensation-attribution-v1';
const topicRoot = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials';
const angularPlanOwner = `${topicRoot}/second-order-angular-plan.md`;
const referencePlanPath = `${topicRoot}/second-order-reference-plan.md`;
const angularExecutorPath = 'experiments/sky-accuracy-dials/continuation/second-order-angular-refine/run.mjs';

/** New azimuth policy, separate from all original SkySecondOrderAngularRule identities.
 * @type {SkySecondOrderAzimuthPolicy}
 */
export const secondOrderAzimuthPolicy = Object.freeze({
	radialCount: 16,
	azimuthCount: 64,
	representativeCount: 1536,
	physicalProfile: 'simpson-expanded-medium',
	outerStrategy: 'global',
});

/** Original matched three-rule physical controls.
 * @type {SkySecondOrderReusePolicy}
 */
export const secondOrderAngularBaselinePolicy = Object.freeze({
	channels: Object.freeze([0, 8]),
	physicalProfile: 'simpson-expanded-medium',
	outerStrategy: 'global',
	angularRules: viewAngularRules,
});

/** Require the complete original Gaussian-eight geometry and all three admitted old rules.
 * @param {readonly SkySecondOrderViewNode[]} nodes - Exact constructor's complete target nodes.
 * @param {readonly SkySecondOrderPoint[]} points - Original complete baseline points.
 * @param {SkySecondOrderReusePolicy} policy - Authenticated original controls.
 */
export function assertSecondOrderAngularBaseline(nodes, points, policy) {
	assert.deepEqual(policy, secondOrderAngularBaselinePolicy, 'Original angular/physical policy changed.');
	assert.equal(nodes.length, 32);
	assert.equal(points.length, nodes.length, 'Angular refinement requires a complete baseline view.');
	assert.equal(new Set(nodes.map((node) => node.id)).size, nodes.length);
	assert.equal(new Set(points.map((point) => point.node.id)).size, points.length);
	for (const node of nodes) {
		const point = points.find((value) => value.node.id === node.id);
		assert.ok(point, 'Complete baseline node is missing.');
		assert.deepEqual(point.node, node, 'Baseline geometry or outer metadata changed.');
		assertSecondOrderReusablePoint(point, policy);
	}
}

/** Enforce complete new inner admission while retaining exact original attenuation/comparisons.
 * @param {SkySecondOrderAzimuthPoint} point - New azimuth-64 point record.
 * @param {SkySecondOrderPoint} baseline - Exact matched original physical point.
 * @param {SkySecondOrderAzimuthPolicy} policy - Explicit new placement.
 */
export function assertSecondOrderAzimuthPoint(point, baseline, policy) {
	assert.deepEqual(policy, secondOrderAzimuthPolicy, 'Refined angular policy changed.');
	assert.deepEqual(point.node, baseline.node, 'Refined point differs from its exact baseline geometry.');
	assert.deepEqual(point.transmission, baseline.transmission, 'Original view attenuation must remain unchanged.');
	assert.deepEqual(
		point.baselineAngular,
		baseline.angular,
		'Original angular rows must retain their original identities.',
	);
	assert.equal(point.baselineParent.nodeId, point.node.id);
	assert.equal(
		point.baselineParent.physicalKeySha256,
		sha256(secondOrderPhysicalKey(point.node, secondOrderAngularBaselinePolicy)),
	);
	assert.equal(point.incidentCount, policy.representativeCount);
	assert.ok(point.refinedGeometryPassed && point.refinedIncidentsPassed);
	assert.deepEqual(
		point.refinedRows.map((row) => row.channel),
		secondOrderAngularBaselinePolicy.channels,
	);
	for (const row of point.refinedRows) {
		assert.ok(row.sumIdentityPassed);
		for (const component of viewComponents) {
			const value = row[component];
			assert.ok(
				value.resolved &&
					[value.gauss, value.simpson, value.mean, value.incidentAllowance].every(
						(number) => number !== null && Number.isFinite(number) && number >= 0,
					),
			);
		}
	}
}

/** Integrate matched old/new components and absolute local differences without cancellation.
 * Original baseline values remain available on missing refined intervals, while
 * every refined/correction field for an incomplete interval is explicitly null.
 * No shrinkage or accuracy predicate is inferred from these terms.
 * @param {readonly SkySecondOrderViewNode[]} nodes - Complete original Gaussian-eight rule.
 * @param {readonly SkySecondOrderPoint[]} baselinePoints - Complete admitted original three-rule points.
 * @param {readonly SkySecondOrderAzimuthPoint[]} refinedPoints - Actual admitted new/reused azimuth-64 points.
 * @param {SkySecondOrderAzimuthPolicy} [policy] - Explicit new angular placement.
 * @returns {SkySecondOrderAzimuthIntegral[]} All interval/view, channel and component terms.
 */
export function integrateSecondOrderAzimuth(nodes, baselinePoints, refinedPoints, policy = secondOrderAzimuthPolicy) {
	assertSecondOrderAngularBaseline(nodes, baselinePoints, secondOrderAngularBaselinePolicy);
	assert.deepEqual(policy, secondOrderAzimuthPolicy, 'Refined angular policy changed.');
	assert.equal(new Set(refinedPoints.map((point) => point.node.id)).size, refinedPoints.length);
	for (const point of refinedPoints) {
		const baseline = baselinePoints.find((value) => value.node.id === point.node.id);
		assert.ok(baseline, 'Unexpected refined point.');
		assertSecondOrderAzimuthPoint(point, baseline, policy);
	}
	/** @type {SkySecondOrderAzimuthIntegral[]} */ const integrals = [];
	/** @type {readonly (number|'all')[]} */ const intervals = [0, 1, 2, 3, 'all'];
	for (const interval of intervals)
		for (const channel of secondOrderAngularBaselinePolicy.channels)
			for (const component of viewComponents) {
				let baselineWatts = 0,
					baselineIncidentAllowanceWatts = 0,
					baselineViewAllowanceWatts = 0;
				let refinedWatts = 0,
					refinedIncidentAllowanceWatts = 0,
					refinedViewAllowanceWatts = 0;
				let signedCorrectionWatts = 0,
					absoluteCorrectionWatts = 0,
					correctionIncidentAllowanceWatts = 0,
					correctionViewAllowanceWatts = 0;
				let earlierAbsoluteResponseWatts = 0,
					earlierIncidentAllowanceWatts = 0,
					earlierViewAllowanceWatts = 0,
					complete = true;
				for (const node of nodes.filter((value) => interval === 'all' || value.interval === interval)) {
					const baseline = baselinePoints.find((point) => point.node.id === node.id);
					const original = baseline.angular
						.find((row) => row.rule === 'ordinary-fine')
						.rows.find((row) => row.channel === channel)[component];
					const coarse = baseline.angular
						.find((row) => row.rule === 'ordinary-coarse')
						.rows.find((row) => row.channel === channel)[component];
					const transmission = baseline.transmission.channels.find((row) => row.channel === channel);
					const weight = node.weightMeters,
						transport = transmission.mean,
						viewAllowance = transmission.allowance;
					assert.ok(Number.isFinite(weight) && weight > 0);
					baselineWatts += weight * transport * original.mean;
					baselineIncidentAllowanceWatts += weight * transport * original.incidentAllowance;
					baselineViewAllowanceWatts += weight * (original.mean + original.incidentAllowance) * viewAllowance;
					const earlierDifference = Math.abs(original.mean - coarse.mean),
						earlierIncident = original.incidentAllowance + coarse.incidentAllowance;
					earlierAbsoluteResponseWatts += weight * transport * earlierDifference;
					earlierIncidentAllowanceWatts += weight * transport * earlierIncident;
					earlierViewAllowanceWatts += weight * (earlierDifference + earlierIncident) * viewAllowance;
					const point = refinedPoints.find((value) => value.node.id === node.id);
					if (!point) {
						complete = false;
						continue;
					}
					const refined = point.refinedRows.find((row) => row.channel === channel)[component];
					refinedWatts += weight * transport * refined.mean;
					refinedIncidentAllowanceWatts += weight * transport * refined.incidentAllowance;
					refinedViewAllowanceWatts += weight * (refined.mean + refined.incidentAllowance) * viewAllowance;
					const difference = refined.mean - original.mean,
						incidentAllowance = refined.incidentAllowance + original.incidentAllowance;
					signedCorrectionWatts += weight * transport * difference;
					absoluteCorrectionWatts += weight * transport * Math.abs(difference);
					correctionIncidentAllowanceWatts += weight * transport * incidentAllowance;
					correctionViewAllowanceWatts += weight * (Math.abs(difference) + incidentAllowance) * viewAllowance;
				}
				integrals.push({
					interval,
					channel,
					component,
					baselineWatts,
					baselineIncidentAllowanceWatts,
					baselineViewAllowanceWatts,
					refinedWatts: complete ? refinedWatts : null,
					refinedIncidentAllowanceWatts: complete ? refinedIncidentAllowanceWatts : null,
					refinedViewAllowanceWatts: complete ? refinedViewAllowanceWatts : null,
					signedCorrectionWatts: complete ? signedCorrectionWatts : null,
					absoluteCorrectionWatts: complete ? absoluteCorrectionWatts : null,
					correctionIncidentAllowanceWatts: complete ? correctionIncidentAllowanceWatts : null,
					correctionViewAllowanceWatts: complete ? correctionViewAllowanceWatts : null,
					earlierAbsoluteResponseWatts,
					earlierIncidentAllowanceWatts,
					earlierViewAllowanceWatts,
					complete,
				});
			}
	return integrals;
}

/** Retain physical admission predicates separately from the held shrinkage forecast.
 * @param {readonly SkySecondOrderAzimuthPoint[]} points - Actual completed new points.
 * @returns {SkySecondOrderCheck[]} Explicit inner-admission outcomes.
 */
function pointChecks(points) {
	return points.flatMap((point) => [
		{
			id: `${point.node.id}:az64-geometry`,
			state: /** @type {SkyVolumeCheckState} */ (point.refinedGeometryPassed ? 'passed' : 'failed'),
		},
		{
			id: `${point.node.id}:az64-incident-admission`,
			state: /** @type {SkyVolumeCheckState} */ (point.refinedIncidentsPassed ? 'passed' : 'unresolved'),
		},
		...point.refinedRows.map((row) => ({
			id: `${point.node.id}:az64-ch${row.channel}:component-identity`,
			state: /** @type {SkyVolumeCheckState} */ (
				row.sumIdentityPassed ? 'passed' : row.combined.resolved ? 'failed' : 'unresolved'
			),
		})),
	]);
}

/** Authenticate the pinned original runtime without retaining its binary.
 * @param {DialContinuationToolIdentity} expected - Original C0 runtime identity.
 * @returns {Promise<void>} Rejects any runtime drift.
 */
async function authenticateNode(expected) {
	assert.equal(checkedAbsolute(process.execPath), expected.path);
	assert.equal(process.version, expected.version);
	const hash = createHash('sha256');
	let bytes = 0;
	for await (const chunk of createReadStream(expected.path)) {
		hash.update(chunk);
		bytes += chunk.length;
	}
	assert.equal(bytes, expected.byteLength);
	assert.equal(hash.digest('hex'), expected.sha256);
}

/** Execute a fixed-point radial16/azimuth64 half-view with exact original attenuation reuse.
 * The low stage computes intervals 0/1. The high stage computes intervals 2/3
 * and requires accepted low-stage evidence from the identical complete baseline.
 * @param {string} registrationRun - Original accepted C0 registration.
 * @param {string} attributionPlanPath - Exact owning attribution plan.
 * @param {string} angularPlanPath - Exact prospective angular-plan owner.
 * @param {SkySecondOrderAngularStage} stage - Low or high physical intervals.
 * @param {string} baselineViewRun - Accepted complete original Gaussian-eight view.
 * @param {string} [priorAngularRun] - Accepted low-stage angular record, required only for high.
 * @param {string} [transferAdmissionRun] - Required adequate morning report for noon transfer.
 * @returns {Promise<SkyVolumeRunResult>} Sealed execution and physical admission, not reference adequacy.
 */
export async function runSecondOrderAngularRefinement(
	registrationRun,
	attributionPlanPath,
	angularPlanPath,
	stage,
	baselineViewRun,
	priorAngularRun,
	transferAdmissionRun,
) {
	assert.ok(['low', 'high'].includes(stage));
	assert.equal(typeof priorAngularRun === 'string', stage === 'high');
	assert.equal(attributionPlanPath, `${topicRoot}/attribution-plan.md`);
	assert.equal(angularPlanPath, angularPlanOwner);
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const condition = readSecondOrderCondition(registration, transferAdmissionRun);
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const attributionBytes = readRepository(attributionPlanPath),
		attributionPlan = identity(attributionPlanPath, attributionBytes);
	const angularBytes = readRepository(angularPlanPath),
		angularPlan = identity(angularPlanPath, angularBytes);
	const referenceBytes = readRepository(referencePlanPath),
		referencePlan = identity(referencePlanPath, referenceBytes);
	assert.ok(attributionBytes.toString().includes(extensionId));
	assert.ok(
		angularBytes.toString().includes(extensionId) &&
			new RegExp(`(^|[^a-z0-9-])${stage}($|[^a-z0-9-])`).test(angularBytes.toString()),
		'Angular stage must be prospectively registered as an exact literal.',
	);
	readRepository(registration.record.inputs.path, registration.record.inputs);
	const spec = loadInputs().native48.transportSpec,
		channels = [0, 8],
		nodes = secondOrderViewNodes(registration, spec, condition.probeId, 8);
	const sources = sourceIdentities(),
		numericalSources = secondOrderNumericalCore(sources),
		angularExecutionSources = sources.filter((source) => source.path === angularExecutorPath);
	const coordinate = readSecondOrderIncidentAdmission(registration.run);
	assert.equal(angularExecutionSources.length, 1);
	const baselineRead = readSecondOrderRefinementParent(
		baselineViewRun,
		registration,
		secondOrderAngularBaselinePolicy,
		numericalSources,
	);
	const baselineViewArtifact = baselineRead.identities.find(
		(source) => source.path === `${baselineViewRun}/view.json`,
	);
	assert.ok(baselineViewArtifact);
	/** @type {SkySecondOrderDocument} */ const baselineDocument = JSON.parse(
		readRepository(baselineViewArtifact.path, baselineViewArtifact).toString(),
	);
	assert.deepEqual(baselineDocument.nodes, nodes, 'Baseline must be the exact complete Gaussian-eight outer rule.');
	const baselinePoints = baselineRead.entries.map((entry) => entry.point);
	assertSecondOrderAngularBaseline(nodes, baselinePoints, secondOrderAngularBaselinePolicy);
	const baselineIntegrals = integrateSecondOrderView(nodes, baselinePoints, channels);
	assert.ok(baselineIntegrals.every((row) => row.complete));
	/** @type {SkySecondOrderAzimuthPoint[]} */ const points = [];
	/** @type {DialFileIdentity[]} */ const priorIdentities = [];
	/** @type {SkySecondOrderAliasDerivation[]} */ const priorDerivations = [];
	if (priorAngularRun) {
		const prior = acceptedMechanismInput(priorAngularRun),
			artifact = mechanismArtifact(prior, 'view.json'),
			definitionIdentity = mechanismArtifact(prior, 'definition.json');
		/** @type {SkySecondOrderAngularDocument} */ const previous = JSON.parse(
			readRepository(artifact.path, artifact).toString(),
		);
		/** @type {SkySecondOrderAngularDefinition} */ const previousDefinition = JSON.parse(
			readRepository(definitionIdentity.path, definitionIdentity).toString(),
		);
		const parameters = previousDefinition.recipe.parameters;
		assert.equal(previous.schemaId, 'sky-second-order-angular-view-v1');
		assert.equal(previous.stage, 'low');
		assert.equal(parameters.stage, 'low');
		assert.equal(previous.continuationRegistration, registration.run);
		assert.equal(parameters.continuationRegistration, registration.run);
		assert.equal(previous.baselineViewRun, baselineViewRun);
		assert.equal(parameters.baselineViewRun, baselineViewRun);
		assert.deepEqual(previous.baselineViewArtifact, baselineViewArtifact);
		assert.deepEqual(parameters.baselineViewArtifact, baselineViewArtifact);
		assert.deepEqual(previous.nodes, nodes);
		assert.deepEqual(previous.channels, channels);
		assert.deepEqual(previous.baselinePolicy, secondOrderAngularBaselinePolicy);
		assert.deepEqual(previous.angularPolicy, secondOrderAzimuthPolicy);
		assert.deepEqual(parameters.angularPolicy, secondOrderAzimuthPolicy);
		assert.ok(previous.matrixComplete && previous.predictionsPassed);
		assert.equal(previous.fullViewComplete, false, 'The low-stage source is a partial refined view.');
		assert.deepEqual(previous.baselineIntegrals, baselineIntegrals);
		assert.deepEqual(secondOrderNumericalCore(parameters.numericalSources), numericalSources);
		assert.deepEqual(
			parameters.angularExecutionSources,
			angularExecutionSources,
			'Azimuth executor/integrator changed since the low stage.',
		);
		assert.deepEqual(
			previous.points.map((point) => point.node.id),
			nodes.filter((node) => node.interval < 2).map((node) => node.id),
		);
		for (const point of previous.points) {
			const baseline = baselinePoints.find((value) => value.node.id === point.node.id);
			assertSecondOrderAzimuthPoint(point, baseline, secondOrderAzimuthPolicy);
			priorIdentities.push(...readSecondOrderIncidentUse(point, coordinate.admission));
			assert.equal(point.baselineParent.run, baselineViewRun);
			assert.deepEqual(point.baselineParent.artifact, baselineViewArtifact);
			priorDerivations.push({
				targetNodeId: point.node.id,
				physicalKeySha256: point.baselineParent.physicalKeySha256,
				sourceKind: 'parent',
				parentRun: priorAngularRun,
				parentArtifact: artifact,
				originalNodeId: point.node.id,
				currentComputedNodeId: null,
				operation:
					'Copy the admitted radial16/azimuth64 low-stage point unchanged, including its original baseline attenuation pointer; no baseline azimuth32 source value substitutes for the refined result.',
			});
		}
		assert.deepEqual(previous.integrals, integrateSecondOrderAzimuth(nodes, baselinePoints, previous.points));
		points.push(...previous.points);
		priorIdentities.push(prior.seal, artifact, definitionIdentity);
	}
	const selected = nodes.filter((node) => (stage === 'low' ? node.interval < 2 : node.interval >= 2));
	assert.equal(selected.length, 16);
	const expectedCount = selected.length * 1536,
		extensionStage = condition.transferPlan ? `transfer-az64-${stage}` : `second-order-angular-${stage}`;
	const parents = [
		registration.seal,
		registration.record.inputs,
		attributionPlan,
		angularPlan,
		referencePlan,
		...condition.identities,
		...coordinate.identities,
		...baselineRead.identities,
		...priorIdentities,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'At the exact complete original Gaussian-eight viewing nodes, newly evaluate radial16/azimuth64 incident representatives. Reuse only original geometry, view attenuation and explicitly separate comparison rows; retain matched component integrals and positive path integrals of absolute local angular differences. The prospective response-shrinkage and reference-adequacy gates are assessed separately.',
		parameters: {
			extensionId,
			extensionStage,
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			caseId: extensionStage,
			admission,
			stage,
			condition,
			channels,
			nodes,
			selectedIds: selected.map((node) => node.id),
			baselineViewRun,
			baselineViewArtifact,
			baselinePolicy: secondOrderAngularBaselinePolicy,
			angularPolicy: secondOrderAzimuthPolicy,
			physicalProfile: 'simpson-expanded-medium',
			outerStrategy: 'global',
			expectedCount,
			workerCount: 4,
			logicalCpus: cpus().length,
			node: registration.record.host.node,
			sourceIdentities: sources,
			numericalSources,
			incidentCoordinateAdmission: coordinate.admission,
			numericalReuseFilter: secondOrderNumericalReuseFilter,
			baselineNumericalReuseCheck: baselineRead.sourceCheck,
			angularExecutionSources,
			priorAngularDerivations: priorDerivations,
			maximumJobMilliseconds: 3600000,
			finalizationReserveMilliseconds: 60000,
			prediction:
				'All selected new azimuth64 incidents, geometry and component identities pass unchanged physical admission. The locked pathwise shrinkage envelope and reference adequacy remain separate prospective assessments.',
			forecast:
				'After each complete new point, twice the largest observed whole-point wall milliseconds per incident times remaining new incidents must fit the scientific deadline.',
			retention:
				'Complete geometry/control/source snapshots, original comparison/attenuation data with exact parent pointers, separate new azimuth64 rows, uncancelled correction integrals, fresh-only work and at most eight unresolved full incident witnesses.',
		},
	};
	const before = storage(),
		run = createRun(`${condition.transferPlan ? 'tr' : 'p2'}-az64-${stage}`, recipe),
		definition = identity(`${run.path}/definition.json`);
	const deadline = started + Math.min(3600000, admission.timeoutMilliseconds) - 60000;
	let writtenBytes = definition.byteLength,
		lastPulse = 0,
		lastMemory = 0,
		completedCount = 0,
		batchBase = 0,
		slowestPointPerIncident = 0;
	let message = 'Preparing registered fixed-point azimuth refinement.';
	let stopReason = /** @type {string|null} */ (null),
		failure = /** @type {Error|null} */ (null),
		pool = /** @type {SkyVolumeWorkerPool|null} */ (null);
	/** @type {SkyJ2Memory[]} */ const memory = [];
	/** @type {SkyVolumeResult[]} */ const unresolvedWitnesses = [];
	/** @type {SkySecondOrderAzimuthPoint[]} */ const freshPoints = [];
	/** @type {SkySecondOrderAzimuthPoint[]} */ const unresolvedPoints = [];
	const resourceSignal = new Error('Azimuth refinement deadline, conservative forecast or host headroom reached.');
	/** Observe execution resources and flush progress while workers compute.
	 * @param {boolean} [force] - Observe a stage or point boundary immediately.
	 */
	function guard(force = false) {
		const now = Date.now();
		if (now >= deadline) throw resourceSignal;
		if (!force && now - lastMemory < 1000) return;
		lastMemory = now;
		const availableBytes = freemem(),
			residentSetBytes = process.memoryUsage().rss;
		if (availableBytes < registration.budgets.hostHeadroomBytes) throw resourceSignal;
		if (force || now - lastPulse >= 20000) {
			const current = run.guard();
			assert.ok(current.retainedBytes - before.retainedBytes < allocatedBytes - terminalReserveBytes);
			assert.ok(
				current.retainedBytes - registration.initialStorage.retainedBytes <
					registration.budgets.newRetainedBytes,
			);
			run.progress('second-order-azimuth64', message, completedCount, expectedCount);
			memory.push({elapsedMilliseconds: now - started, availableBytes, residentSetBytes});
			lastPulse = now;
		}
	}
	/** Retain one exclusive artifact with reserved terminal capacity.
	 * @param {string} name - Artifact basename.
	 * @param {unknown} value - JSON or exact encoded bytes.
	 * @param {DialDerivation} [derivation] - Exact derivation inputs and operation.
	 * @returns {DialFileIdentity} Closed artifact identity.
	 */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} from the frozen azimuth64 recipe, authenticated baseline and actual new incident evaluations.`,
		},
	) {
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(writtenBytes + bytes.length < allocatedBytes - terminalReserveBytes);
		const output = run.write(name, bytes, derivation);
		writtenBytes += output.byteLength;
		return output;
	}
	const incident = createSecondOrderIncidentCollector(
		spec,
		channels,
		coordinate,
		write,
		() => allocatedBytes - terminalReserveBytes - writtenBytes,
	);
	try {
		guard(true);
		if (condition.transferPlan)
			write('transfer-plan.md', Buffer.from(condition.transferBytes), {
				parents: [condition.transferPlan],
				operation: 'Preserve the exact second-condition transfer criteria.',
			});
		write('incident-coordinate-plan.md', Buffer.from(coordinate.planBytes), {
			parents: [coordinate.admission.plan],
			operation: 'Freeze the admitted coordinate amendment without changing the original angular predictions.',
		});
		write('attribution-plan.md', attributionBytes, {
			parents: [attributionPlan],
			operation: 'Retain the exact governing attribution plan before evaluation.',
		});
		write('second-order-reference-plan.md', referenceBytes, {
			parents: [referencePlan],
			operation: 'Retain the exact physical reference design.',
		});
		write('second-order-angular-plan.md', angularBytes, {
			parents: [angularPlan],
			operation: 'Freeze original angular predictions before any new target evaluation.',
		});
		const sourceBytes = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		);
		write('sources.json.gz', gzipSync(sourceBytes, {level: 9}), {
			parents: sources,
			operation: 'Encode exact source bytes as base64 JSON and gzip level 9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		write('proof.json', secondOrderAngularRefinementProof(registration, spec));
		write('worker-proof.json', await volumeWorkerProof());
		pool = createVolumeWorkerPool(spec, channels, {
			workerCount: 4,
			deadlineEpochMilliseconds: deadline,
			guard,
			onComplete: (count) => {
				completedCount = batchBase + count;
			},
		});
		for (const node of selected) {
			const pointStarted = performance.now();
			message = `Evaluating ${node.id} with radial16/azimuth64.`;
			guard(true);
			const baseline = baselinePoints.find((value) => value.node.id === node.id);
			const groups = volumeJ2Groups(spec.planet.bottomRadiusMeters, node.origin, 16, 64);
			assert.equal(groups.length, 1536);
			const tasks = groups.map((group, index) => ({
				id: `az64:${index}`,
				origin: node.origin,
				direction: incidentWorld(node.origin, group.incident.direction),
			}));
			batchBase = completedCount;
			const originalRows = await pool.evaluate(tasks);
			const processed = incident.evaluate(node, originalRows, guard),
				returned = processed.rows;
			const compact = returned.map((value, index) => {
				assert.equal(value.id, tasks[index].id);
				assert.deepEqual(value.result.geometry.origin, node.origin);
				assert.deepEqual(value.result.geometry.direction, tasks[index].direction);
				if (!value.result.resolved && unresolvedWitnesses.length < 8) unresolvedWitnesses.push(value.result);
				return {
					targetId: node.id,
					index,
					mirrorOf: null,
					direction: value.result.geometry.direction,
					channels: value.result.channels,
					branch: value.result.geometry.branch,
					elapsedMilliseconds: value.elapsedMilliseconds,
					mediumEvaluations: value.result.methods.reduce((sum, method) => sum + method.mediumEvaluations, 0),
					outerEvaluations: value.result.methods.reduce((sum, method) => sum + method.outerEvaluations, 0),
				};
			});
			const point = {
				node,
				transmission: structuredClone(baseline.transmission),
				baselineAngular: structuredClone(baseline.angular),
				refinedRows: sumVolumeJ2(spec, node, channels, groups, compact),
				refinedGeometryPassed: compact.every((row, index) => row.branch === groups[index].branch),
				refinedIncidentsPassed: returned.every((row) => row.result.resolved),
				incidentCount: returned.length,
				baselineParent: {
					run: baselineViewRun,
					artifact: baselineViewArtifact,
					nodeId: node.id,
					physicalKeySha256: sha256(secondOrderPhysicalKey(node, secondOrderAngularBaselinePolicy)),
				},
				elapsedMilliseconds: performance.now() - pointStarted,
				workerMilliseconds: processed.workerMilliseconds,
				mediumEvaluations: processed.mediumEvaluations,
				outerEvaluations: processed.outerEvaluations,
				...(processed.incidentCoordinate ? {incidentCoordinate: processed.incidentCoordinate} : {}),
			};
			freshPoints.push(point);
			slowestPointPerIncident = Math.max(slowestPointPerIncident, point.elapsedMilliseconds / tasks.length);
			guard(true);
			if (pointChecks([point]).some((check) => check.state !== 'passed')) {
				unresolvedPoints.push(point);
				stopReason = `Unresolved azimuth64 incident, geometry or component identity at ${node.id}.`;
				break;
			}
			try {
				assertSecondOrderAzimuthPoint(point, baseline, secondOrderAzimuthPolicy);
			} catch (error) {
				unresolvedPoints.push(point);
				throw error;
			}
			points.push(point);
			if (2 * slowestPointPerIncident * (expectedCount - completedCount) > deadline - Date.now())
				throw resourceSignal;
		}
	} catch (error) {
		if (error === resourceSignal) stopReason = resourceSignal.message;
		else failure = error instanceof Error ? error : new Error(String(error));
	} finally {
		try {
			await pool?.close();
		} catch (error) {
			failure ??= error instanceof Error ? error : new Error(String(error));
		}
	}
	const orderedPoints = nodes.flatMap((node) => points.filter((point) => point.node.id === node.id));
	const matrixComplete =
		!failure && !stopReason && selected.every((node) => orderedPoints.some((point) => point.node.id === node.id));
	const checks = [...pointChecks(orderedPoints), ...pointChecks(unresolvedPoints)],
		integrals = integrateSecondOrderAzimuth(nodes, baselinePoints, orderedPoints);
	const fullViewComplete = orderedPoints.length === nodes.length && integrals.every((row) => row.complete),
		predictionsPassed = matrixComplete && checks.every((check) => check.state === 'passed');
	try {
		/** @type {SkySecondOrderAngularDocument} */ const document = {
			schemaId: 'sky-second-order-angular-view-v1',
			continuationRegistration: registration.run,
			stage,
			baselineViewRun,
			baselineViewArtifact,
			nodes,
			channels,
			angularPolicy: secondOrderAzimuthPolicy,
			baselinePolicy: secondOrderAngularBaselinePolicy,
			points: orderedPoints,
			integrals,
			baselineIntegrals,
			checks,
			matrixComplete,
			fullViewComplete,
			predictionsPassed,
		};
		write(
			'view.json',
			{
				...document,
				reusedAngularPoints: priorDerivations,
				stopReason,
				predictionScope:
					'Physical inner admission only; the prospective response-shrinkage and reference-adequacy gates are separate.',
				limitations: [
					'Refined rows are newly evaluated radial16/azimuth64 values and never relabeled as ordinary-fine baseline data.',
					'Every correction magnitude is integrated after taking the local absolute difference, so path cancellation cannot hide angular change.',
					'The earlier ordinary-coarse-to-fine response changes both radial and azimuth counts; its comparison does not establish an isolated azimuth convergence exponent.',
					'Incident and shared view-transmission allowances exclude angular and outer quadrature error. Missing refined intervals remain null.',
					'No whole-N4, frozen-increment or Kider qualification is inferred.',
				],
			},
			{
				parents: [definition, ...baselineRead.identities, ...priorIdentities],
				operation:
					'Retain new azimuth64 rows separately from original comparison rows and exact reused attenuation. Sum matched components and local absolute corrections in original node order; retain null refined values where points are missing.',
			},
		);
		write('unresolved-witnesses.json', unresolvedWitnesses);
		write(
			'original-incident-witnesses.json.gz',
			gzipSync(Buffer.from(JSON.stringify(incident.originalWitnesses)), {level: 9}),
		);
		write('unresolved-points.json', unresolvedPoints);
		write('work.json', {
			incidentCoordinate: {
				admission: coordinate.admission,
				batches: incident.batches.map((batch) => ({
					nodeId: batch.node.id,
					artifact: batch.artifact,
					complete: batch.complete,
					originalWork: batch.originalWork,
					attemptCount: batch.records.length,
					interruptionCount: batch.interruptions.length,
					extraWork: batch.extraWork,
					mainThreadMilliseconds: batch.mainThreadMilliseconds,
				})),
				knownWork: incident.work,
				mainThreadMilliseconds: incident.mainThreadMilliseconds,
				accounting:
					'Original worker methods plus every completed additional Simpson method. Interrupted candidate counters remain null; work is a known lower bound when any batch is interrupted.',
			},
			scope: 'Only current-run azimuth64 physical computations; all original view attenuation is reused.',
			points: freshPoints.map((point) => ({
				nodeId: point.node.id,
				elapsedMilliseconds: point.elapsedMilliseconds,
				workerMilliseconds: point.workerMilliseconds,
				mediumEvaluations: point.mediumEvaluations,
				outerEvaluations: point.outerEvaluations,
				admitted: !unresolvedPoints.includes(point),
			})),
		});
		write('costs.json', {
			expectedCount,
			returnedCount: completedCount,
			plannedFreshPoints: selected.length,
			completedFreshPoints: freshPoints.length,
			reusedRefinedPoints: priorDerivations.length,
			originalTransmissionComputations: 0,
			originalTransmissionAliases: orderedPoints.length,
			workerCount: 4,
			workerMilliseconds: incident.work.workerMilliseconds,
			mediumEvaluations: incident.work.originalMediumEvaluations + incident.work.mainThreadMediumEvaluations,
			outerEvaluations: incident.work.originalOuterEvaluations + incident.work.mainThreadOuterEvaluations,
			incidentCoordinateWork: {...incident.work, mainThreadMilliseconds: incident.mainThreadMilliseconds},
			slowestPointMillisecondsPerIncident: slowestPointPerIncident,
			memory,
			maximumResidentSetBytes: Math.max(0, ...memory.map((row) => row.residentSetBytes)),
			memoryMetric: 'Process resident set including owned worker threads, not private bytes',
			partialWorkCountsUnavailable:
				completedCount !== incident.work.returnedRows ||
				incident.batches.some((batch) => batch.interruptions.length > 0),
			scratchBytes: 0,
		});
		write('execution.json', {
			matrixComplete,
			fullViewComplete,
			predictionsPassed,
			predictionScope: 'Physical inner admission only; held angular predictions are assessed separately.',
			stopReason,
			failure: failure ? {message: failure.message, stack: failure.stack} : null,
			gpuJobsExecuted: 0,
		});
		for (const parent of parents) readRepository(parent.path, parent);
		for (const source of sources) readRepository(source.path, source);
		await authenticateNode(registration.record.host.node);
	} catch (error) {
		failure ??= error instanceof Error ? error : new Error(String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId,
		extensionStage,
		caseId: extensionStage,
		matrixComplete,
		fullViewComplete,
		predictionsPassed,
		stopReason,
		failure: failure?.message ?? null,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		gpuJobsExecuted: 0,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.ok(
		seal.byteLength + terminal.artifacts.reduce((sum, artifact) => sum + artifact.byteLength, 0) <= allocatedBytes,
	);
	if (terminal.state !== 'accepted')
		throw new Error(`Second-order angular refinement infrastructure failed in ${run.path}: ${failure?.message}`);
	return {run: run.path, seal, matrixComplete, predictionsPassed, stopReason};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const [stage, registration, attributionPlan, angularPlan, baselineView, priorAngular] = process.argv.slice(2);
	assert.equal(
		process.argv.length,
		stage === 'high' ? 8 : 7,
		'Expected low/high C0 attributionPlan angularPlan baselineView [priorAngular].',
	);
	console.log(
		JSON.stringify(
			await runSecondOrderAngularRefinement(
				registration,
				attributionPlan,
				angularPlan,
				/** @type {SkySecondOrderAngularStage} */ (stage),
				baselineView,
				priorAngular,
			),
			null,
			2,
		),
	);
}
