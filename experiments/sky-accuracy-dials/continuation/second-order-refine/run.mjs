import assert from 'node:assert/strict';
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
import {sumVolumeJ2} from '../volume-j2/angular.mjs';
import {createVolumeWorkerPool} from '../volume-worker/pool.mjs';
import {volumeWorkerProof} from '../volume-worker/proof.mjs';
import {secondOrderAngularGroups, viewAngularRules} from '../second-order-view/geometry.mjs';
import {
	secondOrderViewTransmission,
	integrateSecondOrderView,
	secondOrderPointChecks,
	viewComponents,
} from '../second-order-view/integrate.mjs';
import {secondOrderOuterRule} from '../second-order-rule/geometry.mjs';
import {secondOrderOuterProof} from '../second-order-rule/proof.mjs';
import {secondOrderRefinementProof} from './proof.mjs';
import {readSecondOrderCondition} from '../second-order-transfer/context.mjs';
import {
	readSecondOrderIncidentAdmission,
	readSecondOrderIncidentUse,
	createSecondOrderIncidentCollector,
} from './incident.mjs';

const allocatedBytes = 4 * 1024 ** 2,
	terminalReserveBytes = 768 * 1024;
const extensionId = 'compensation-attribution-v1';
const topicRoot = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials';
const referencePlanPath = `${topicRoot}/second-order-reference-plan.md`;
const refinementPlanOwner = `${topicRoot}/second-order-refinement-plan.md`;

/** Exact numerical reuse inventory selector; old inventories remain immutable.
 * @type {SkySecondOrderNumericalReuseFilter}
 */
export const secondOrderNumericalReuseFilter = Object.freeze({
	version: 'sky-second-order-numerical-reuse-v1',
	directories: ['numerics', 'continuation/volume-reference', 'continuation/reference/physical'],
	files: [
		'continuation/volume-j2/angular.mjs',
		'continuation/j2/angular.mjs',
		'continuation/second-order-view/geometry.mjs',
		'continuation/second-order-view/integrate.mjs',
		'continuation/volume-worker/pool.mjs',
		'continuation/volume-worker/worker.mjs',
	],
	extensions: ['.js', '.mjs'],
	excludedBasenames:
		'run/proof entry files, including hyphenated run/proof names; declarations and README files are excluded by extension',
});

/** Select the exact numerical implementation core from an immutable or current inventory.
 * @param {readonly DialFileIdentity[]} sources - Full original identities, never relabeled.
 * @returns {DialFileIdentity[]} Sorted numerical identities consumed by physical reuse.
 */
export function secondOrderNumericalCore(sources) {
	const prefix = 'experiments/sky-accuracy-dials/';
	return sources
		.filter((source) => {
			if (!source.path.startsWith(prefix) || !/\.m?js$/.test(source.path)) return false;
			const relative = source.path.slice(prefix.length),
				basename = relative.split('/').at(-1);
			if (/(^|[-.])(run|proof)([-.]|$)/.test(basename)) return false;
			return (
				secondOrderNumericalReuseFilter.files.includes(relative) ||
				secondOrderNumericalReuseFilter.directories.some((directory) => relative.startsWith(`${directory}/`))
			);
		})
		.sort((a, b) => a.path.localeCompare(b.path));
}

/** Exact physical and policy identity, excluding only outer-rule addressing and weights.
 * Finite binary64 values, including negative zero, retain their exact identities.
 * @param {SkySecondOrderViewNode} node - Exact original world geometry.
 * @param {SkySecondOrderReusePolicy} policy - Source-authenticated shared numerical controls.
 * @returns {string} Deterministic lossless comparison key; not a new evidence identity.
 */
export function secondOrderPhysicalKey(node, policy) {
	for (const vector of [node.surfaceOrigin, node.origin, node.direction])
		assert.ok(Array.isArray(vector) && vector.length === 3 && vector.every(Number.isFinite));
	assert.ok(
		[node.distanceMeters, node.heightMeters].every(Number.isFinite) &&
			node.distanceMeters >= 0 &&
			node.heightMeters > 0,
	);
	assert.ok(typeof node.probeId === 'string' && node.probeId.length > 0);
	assert.ok(
		policy.channels.length > 0 &&
			policy.channels.every((channel) => Number.isInteger(channel) && channel >= 0) &&
			new Set(policy.channels).size === policy.channels.length,
	);
	assert.ok(
		typeof policy.physicalProfile === 'string' &&
			typeof policy.outerStrategy === 'string' &&
			policy.angularRules.length > 0,
	);
	return JSON.stringify(
		{
			probeId: node.probeId,
			surfaceOrigin: node.surfaceOrigin,
			origin: node.origin,
			direction: node.direction,
			distanceMeters: node.distanceMeters,
			heightMeters: node.heightMeters,
			channels: policy.channels,
			physicalProfile: policy.physicalProfile,
			outerStrategy: policy.outerStrategy,
			angularRules: policy.angularRules,
		},
		(_, value) => (typeof value === 'number' && Object.is(value, -0) ? 'binary64-negative-zero' : value),
	);
}

/** Reject incomplete or unadmitted point data before it enters a reuse inventory.
 * @param {SkySecondOrderPoint} point - Original complete numerical evidence.
 * @param {SkySecondOrderReusePolicy} policy - Exact expected channel/angular controls.
 */
export function assertSecondOrderReusablePoint(point, policy) {
	secondOrderPhysicalKey(point.node, policy);
	assert.deepEqual(
		point.angular.map((row) => row.rule),
		policy.angularRules,
	);
	assert.deepEqual(
		point.transmission.channels.map((row) => row.channel),
		policy.channels,
	);
	assert.deepEqual(
		point.transmission.columns.map((row) => [row.method, row.toleranceScale]),
		[
			['gauss', 4],
			['gauss', 1],
			['simpson', 4],
			['simpson', 1],
		],
	);
	for (const {columns} of point.transmission.columns) {
		assert.ok(columns.converged);
		assert.ok(
			[columns.rayleighMeters, columns.mieMeters, columns.errorRayleighMeters, columns.errorMieMeters].every(
				(value) => value !== null && Number.isFinite(value) && value >= 0,
			),
		);
	}
	for (const row of point.transmission.channels)
		assert.ok(
			row.resolved &&
				[row.gauss, row.simpson, row.mean, row.allowance].every(
					(value) => value !== null && Number.isFinite(value) && value >= 0,
				),
		);
	for (const angular of point.angular) {
		assert.ok(angular.geometryPassed && angular.incidentsPassed);
		assert.equal(angular.incidentCount, angular.rule === 'ordinary-coarse' ? 192 : 768);
		assert.deepEqual(
			angular.rows.map((row) => row.channel),
			policy.channels,
		);
		for (const row of angular.rows) {
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
	assert.ok(secondOrderPointChecks([point]).every((check) => check.state === 'passed'));
}

/** Copy admitted numerical evidence onto one exactly matching outer term.
 * @param {SkySecondOrderViewNode} node - Target term with its own id, interval and weight.
 * @param {SkySecondOrderReuseEntry} entry - Original admitted parent/current point.
 * @param {SkySecondOrderReusePolicy} policy - Target controls.
 * @returns {SkySecondOrderFallbackPoint} Independent copy preserving all numerical and historical work values.
 */
export function aliasSecondOrderPoint(node, entry, policy) {
	assert.equal(
		secondOrderPhysicalKey(node, policy),
		secondOrderPhysicalKey(entry.point.node, entry.policy),
		'Physical geometry or numerical policy changed; reuse is forbidden.',
	);
	assertSecondOrderReusablePoint(entry.point, entry.policy);
	return {...structuredClone(entry.point), node: structuredClone(node)};
}

/** Attach every available physical solve to all matching terms; never invent missing points.
 * @param {readonly SkySecondOrderViewNode[]} nodes - Complete frozen outer rule.
 * @param {ReadonlyMap<string, SkySecondOrderReuseEntry>} available - Exact admitted physical inventory.
 * @param {SkySecondOrderReusePolicy} policy - Target controls.
 * @returns {SkySecondOrderAttachedPoints} Available terms and their complete alias derivations.
 */
export function attachSecondOrderPoints(nodes, available, policy) {
	/** @type {SkySecondOrderFallbackPoint[]} */ const points = [];
	/** @type {SkySecondOrderAliasDerivation[]} */ const derivations = [];
	for (const node of nodes) {
		const key = secondOrderPhysicalKey(node, policy),
			entry = available.get(key);
		if (!entry) continue;
		points.push(aliasSecondOrderPoint(node, entry, policy));
		derivations.push({
			targetNodeId: node.id,
			physicalKeySha256: sha256(key),
			sourceKind: entry.parentRun ? 'parent' : 'current',
			parentRun: entry.parentRun,
			parentArtifact: entry.artifact,
			originalNodeId: entry.point.node.id,
			currentComputedNodeId: entry.parentRun ? null : entry.point.node.id,
			operation:
				'Require exact physical/control key and admitted source; copy numerical fields unchanged and replace only node id, index, interval and outer weight with the frozen target term metadata.',
		});
	}
	return {points, derivations};
}

/** Freeze the entire original morning-view rule, then select the stage's bounded intervals.
 * @param {DialContinuationRegistrationRead} registration - Original C0 geometry.
 * @param {SkyTransportSpec} spec - Matched atmosphere radii.
 * @param {SkySecondOrderRefinementStage} stage - Declared bounded batch.
 * @param {SkySecondOrderProbeId} [probeId] - Exact registered physical condition.
 * @returns {SkySecondOrderRefinementSelection} Complete rule and selected terms.
 */
export function secondOrderRefinementSelection(registration, spec, stage, probeId = 'p-0930-5-7') {
	assert.ok(['gauss4', 'simpson4', 'gauss8-low', 'gauss8-high', 'simpson8'].includes(stage));
	assert.ok(['p-0930-5-7', 'p-1230-3-5'].includes(probeId));
	const gaussian = stage.startsWith('gauss');
	const rule = secondOrderOuterRule(
		registration,
		spec,
		probeId,
		gaussian ? 'gauss-height' : 'simpson-height',
		['gauss4', 'simpson4'].includes(stage) ? 4 : 8,
	);
	const intervals = stage === 'gauss8-low' ? [0, 1] : stage === 'gauss8-high' ? [2, 3] : [0, 1, 2, 3];
	return {rule, intervals, selected: rule.nodes.filter((node) => intervals.includes(node.interval))};
}

/** Authenticate one immutable admitted parent and its exact unchanged numerical core.
 * @param {string} parentRun - Exact original source run.
 * @param {DialContinuationRegistrationRead} registration - Original C0 owner.
 * @param {SkySecondOrderReusePolicy} policy - Target physical controls.
 * @param {readonly DialFileIdentity[]} numericalSources - Current selected numerical core.
 * @returns {SkySecondOrderRefinementParent} Validated reusable points and source checks.
 */
export function readSecondOrderRefinementParent(parentRun, registration, policy, numericalSources) {
	const parent = acceptedMechanismInput(parentRun),
		artifact = mechanismArtifact(parent, 'view.json'),
		definitionIdentity = mechanismArtifact(parent, 'definition.json');
	/** @type {SkySecondOrderRefinementDocument} */ const previous = JSON.parse(
		readRepository(artifact.path, artifact).toString(),
	);
	/** @type {SkySecondOrderReuseDefinition} */ const definition = JSON.parse(
		readRepository(definitionIdentity.path, definitionIdentity).toString(),
	);
	assert.equal(previous.schemaId, 'sky-second-order-view-v1');
	assert.equal(previous.continuationRegistration, registration.run);
	assert.ok(previous.matrixComplete && previous.predictionsPassed);
	assert.deepEqual(previous.channels, policy.channels);
	const parameters = definition.recipe.parameters;
	assert.equal(parameters.continuationRegistration, registration.run);
	const parentPolicy = {
		channels: parameters.channels,
		physicalProfile: parameters.physicalProfile,
		outerStrategy: parameters.outerStrategy,
		angularRules: parameters.angularRules,
	};
	assert.deepEqual(parentPolicy, policy, 'Parent physical profile or angular policy changed.');
	assert.ok(Array.isArray(parameters.numericalSources) && numericalSources.length > 0);
	assert.deepEqual(
		secondOrderNumericalCore(parameters.numericalSources),
		numericalSources,
		'Original numerical core changed or is incomplete.',
	);
	for (const source of numericalSources) readRepository(source.path, source);
	assert.ok(
		previous.points.length > 0 &&
			new Set(previous.points.map((point) => point.node.id)).size === previous.points.length,
	);
	const coordinateIdentities = [];
	const coordinate = previous.points.some((point) => point.incidentCoordinate)
		? readSecondOrderIncidentAdmission(registration.run)
		: null;
	for (const point of previous.points) {
		assert.deepEqual(
			point.node,
			previous.nodes.find((node) => node.id === point.node.id),
		);
		assertSecondOrderReusablePoint(point, parentPolicy);
		if (coordinate) coordinateIdentities.push(...readSecondOrderIncidentUse(point, coordinate.admission));
	}
	return {
		identities: [parent.seal, artifact, definitionIdentity, ...coordinateIdentities],
		entries: previous.points.map((point) => ({point, policy: parentPolicy, parentRun, artifact})),
		sourceCheck: {
			parentDefinition: definitionIdentity,
			originalInventoryCount: parameters.numericalSources.length,
			checkedCount: numericalSources.length,
			unchanged: true,
		},
	};
}

/** Verify the pinned original executable, retaining only its exact identity.
 * @param {DialContinuationToolIdentity} expected - Original C0 Node identity.
 * @returns {Promise<void>} Rejection on executable drift.
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

/** Execute only the missing unique physical points of a prospectively registered batch.
 * Full outer-rule integration retains null missing intervals. Inner admission does
 * not assess the held refinement forecast, angular/outer accuracy, or Kider score.
 * @param {string} registrationRun - Original accepted C0 registration.
 * @param {string} attributionPlanPath - Exact owning attribution plan.
 * @param {string} refinementPlanPath - Exact prospective refinement plan owner.
 * @param {SkySecondOrderRefinementStage} stage - Bounded declared refinement batch.
 * @param {readonly string[]} parentRuns - Explicit accepted reusable view records.
 * @param {string} [transferAdmissionRun] - Required adequate morning report for the registered noon transfer.
 * @returns {Promise<SkyVolumeRunResult>} Immutable execution and inner-admission outcome only.
 */
export async function runSecondOrderRefinement(
	registrationRun,
	attributionPlanPath,
	refinementPlanPath,
	stage,
	parentRuns,
	transferAdmissionRun,
) {
	assert.equal(attributionPlanPath, `${topicRoot}/attribution-plan.md`);
	assert.equal(refinementPlanPath, refinementPlanOwner);
	assert.ok(
		Array.isArray(parentRuns) &&
			(parentRuns.length > 0 || (stage === 'gauss4' && transferAdmissionRun)) &&
			parentRuns.length <= 16 &&
			new Set(parentRuns).size === parentRuns.length,
	);
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const condition = readSecondOrderCondition(registration, transferAdmissionRun);
	assert.ok(
		stage !== 'gauss4' || condition.transferPlan,
		'Fresh Gauss4 execution is registered only for noon transfer.',
	);
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const attributionBytes = readRepository(attributionPlanPath),
		attributionPlan = identity(attributionPlanPath, attributionBytes);
	const referenceBytes = readRepository(referencePlanPath),
		referencePlan = identity(referencePlanPath, referenceBytes);
	const refinementBytes = readRepository(refinementPlanPath),
		refinementPlan = identity(refinementPlanPath, refinementBytes);
	assert.ok(attributionBytes.toString().includes(extensionId));
	assert.ok(
		refinementBytes.toString().includes(extensionId) &&
			(stage === 'gauss4' || refinementBytes.toString().includes(stage)),
		'Refinement stage must be prospectively registered.',
	);
	assert.ok(referenceBytes.toString().includes('second-order-view-pilot'));
	readRepository(registration.record.inputs.path, registration.record.inputs);
	const spec = loadInputs().native48.transportSpec,
		channels = [0, 8];
	/** @type {SkySecondOrderReusePolicy} */ const policy = {
		channels,
		physicalProfile: 'simpson-expanded-medium',
		outerStrategy: 'global',
		angularRules: viewAngularRules,
	};
	const selection = secondOrderRefinementSelection(registration, spec, stage, condition.probeId),
		nodes = selection.rule.nodes;
	const sources = sourceIdentities(),
		numericalSources = secondOrderNumericalCore(sources);
	const coordinate = readSecondOrderIncidentAdmission(registration.run);
	const parentRecords = parentRuns.map((parent) =>
		readSecondOrderRefinementParent(parent, registration, policy, numericalSources),
	);
	for (const record of parentRecords)
		assert.ok(
			record.entries.every((entry) => entry.point.node.probeId === condition.probeId),
			'Parent physical condition differs.',
		);
	/** @type {Map<string, SkySecondOrderReuseEntry>} */ const available = new Map();
	for (const record of parentRecords)
		for (const entry of record.entries) {
			const key = secondOrderPhysicalKey(entry.point.node, entry.policy),
				previous = available.get(key);
			if (previous)
				assert.deepEqual(
					{transmission: entry.point.transmission, angular: entry.point.angular},
					{transmission: previous.point.transmission, angular: previous.point.angular},
					'Conflicting admitted numerical evidence for the same exact physical point.',
				);
			else available.set(key, entry);
		}
	/** @type {Map<string, SkySecondOrderViewNode>} */ const missing = new Map();
	for (const node of selection.selected) {
		const key = secondOrderPhysicalKey(node, policy);
		if (!available.has(key) && !missing.has(key)) missing.set(key, node);
	}
	const freshNodes = [...missing.values()],
		expectedCount = freshNodes.length * 1728;
	const extensionStage = condition.transferPlan ? `transfer-${stage}` : `second-order-refine-${stage}`;
	const parents = [
		registration.seal,
		registration.record.inputs,
		attributionPlan,
		referencePlan,
		refinementPlan,
		...condition.identities,
		...coordinate.identities,
		...parentRecords.flatMap((record) => record.identities),
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Freeze the complete registered physical-condition outer rule and declared interval batch. Reuse only admitted exact physical/control identities; solve each unavailable selected geometry once, derive every shared interval term with its own weight, and preserve null values for missing full-view terms. Held scientific predictions are assessed separately from this execution.',
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
			...policy,
			outerRule: selection.rule,
			nodes,
			selectedIntervals: selection.intervals,
			selectedIds: selection.selected.map((node) => node.id),
			freshUniqueIds: freshNodes.map((node) => node.id),
			initialAliases: attachSecondOrderPoints(nodes, available, policy).derivations,
			expectedCount,
			workerCount: 4,
			logicalCpus: cpus().length,
			node: registration.record.host.node,
			sourceIdentities: sources,
			numericalSources,
			incidentCoordinateAdmission: coordinate.admission,
			numericalReuseFilter: secondOrderNumericalReuseFilter,
			numericalReuseChecks: parentRecords.map((record) => record.sourceCheck),
			maximumJobMilliseconds: 3600000,
			finalizationReserveMilliseconds: 60000,
			prediction:
				'Every selected physical point completes all three angular rules, incident/geometry/component admissions and independent view attenuation. This inner-admission result does not evaluate the prospective outcome gates frozen in the refinement plan.',
			forecast:
				'After each new complete point, twice the slowest observed whole-point wall milliseconds per incident times remaining new incidents must fit the scientific deadline.',
			retention:
				'Complete controls, original source inventory/snapshot, all target aliases, admitted point values and view columns, fresh-only work, proofs and at most eight unresolved incident witnesses; no retained full incident arrays.',
		},
	};
	const before = storage(),
		run = createRun(`${condition.transferPlan ? 'tr' : 'p2'}-${stage}`, recipe),
		definition = identity(`${run.path}/definition.json`);
	const deadline = started + Math.min(3600000, admission.timeoutMilliseconds) - 60000;
	let writtenBytes = definition.byteLength,
		lastPulse = 0,
		lastMemory = 0,
		completedCount = 0,
		batchBase = 0,
		slowestPointPerIncident = 0;
	let message = 'Preparing prospectively registered second-order refinement.';
	let stopReason = /** @type {string|null} */ (null),
		failure = /** @type {Error|null} */ (null),
		pool = /** @type {SkyVolumeWorkerPool|null} */ (null);
	/** @type {SkyJ2Memory[]} */ const memory = [];
	/** @type {SkyVolumeResult[]} */ const unresolvedWitnesses = [];
	/** @type {SkySecondOrderFallbackPoint[]} */ const freshPoints = [];
	/** @type {SkySecondOrderFallbackPoint[]} */ const unresolvedPoints = [];
	let viewMediumEvaluations = 0;
	const resourceSignal = new Error(
		'Second-order refinement deadline, conservative forecast or host headroom reached.',
	);
	/** Enforce resources and progress while worker threads compute.
	 * @param {boolean} [force] - Observe a stage/point boundary immediately.
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
			run.progress('second-order-refinement', message, completedCount, expectedCount);
			memory.push({elapsedMilliseconds: now - started, availableBytes, residentSetBytes});
			lastPulse = now;
		}
	}
	/** Write one exclusive compact artifact while preserving terminal headroom.
	 * @param {string} name - New artifact basename.
	 * @param {unknown} value - JSON or encoded bytes.
	 * @param {DialDerivation} [derivation] - Exact source/operation identity.
	 * @returns {DialFileIdentity} Closed retained identity.
	 */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} from the frozen refinement controls, authenticated parent aliases and actual new evaluations.`,
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
				operation: 'Freeze the registered second physical condition and unchanged admission criteria.',
			});
		write('incident-coordinate-plan.md', Buffer.from(coordinate.planBytes), {
			parents: [coordinate.admission.plan],
			operation: 'Freeze the admitted coordinate amendment without changing the original outer predictions.',
		});
		write('attribution-plan.md', attributionBytes, {
			parents: [attributionPlan],
			operation: 'Retain the exact governing attribution plan before numerical evaluation.',
		});
		write('second-order-reference-plan.md', referenceBytes, {
			parents: [referencePlan],
			operation: 'Retain the exact physical order and reference-design owner.',
		});
		write('second-order-refinement-plan.md', refinementBytes, {
			parents: [refinementPlan],
			operation:
				'Freeze the original preregistered stage forecasts and outcome gates before new numerical evaluation.',
		});
		const sourceBytes = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		);
		write('sources.json.gz', gzipSync(sourceBytes, {level: 9}), {
			parents: sources,
			operation: 'Encode exact original source bytes as base64 JSON and gzip level 9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		write('proof.json', {
			reuse: secondOrderRefinementProof(registration, spec),
			outer: secondOrderOuterProof(registration, spec),
		});
		write('worker-proof.json', await volumeWorkerProof());
		if (freshNodes.length)
			pool = createVolumeWorkerPool(spec, channels, {
				workerCount: 4,
				deadlineEpochMilliseconds: deadline,
				guard,
				onComplete: (count) => {
					completedCount = batchBase + count;
				},
			});
		for (const node of freshNodes) {
			const pointStarted = performance.now();
			message = `Evaluating unique ${node.id} at ${node.heightMeters.toFixed(3)} m with three angular rules.`;
			guard(true);
			const transmission = secondOrderViewTransmission(spec, node, channels, guard);
			viewMediumEvaluations += transmission.mediumEvaluations;
			const groupSets = viewAngularRules.map((rule) =>
				secondOrderAngularGroups(spec.planet.bottomRadiusMeters, node.origin, rule),
			);
			const tasks = groupSets.flatMap((groups, ruleIndex) =>
				groups.map((group, index) => ({
					id: `${viewAngularRules[ruleIndex]}:${index}`,
					origin: node.origin,
					direction: incidentWorld(node.origin, group.incident.direction),
				})),
			);
			assert.equal(tasks.length, 1728);
			batchBase = completedCount;
			const originalRows = await pool.evaluate(tasks);
			const processed = incident.evaluate(node, originalRows, guard),
				returned = processed.rows;
			/** @type {SkySecondOrderAngularResult[]} */ const angular = [];
			let offset = 0;
			for (const [ruleIndex, groups] of groupSets.entries()) {
				const values = returned.slice(offset, offset + groups.length);
				const compact = values.map((value, index) => {
					assert.equal(value.id, tasks[offset + index].id);
					assert.deepEqual(value.result.geometry.origin, node.origin);
					assert.deepEqual(value.result.geometry.direction, tasks[offset + index].direction);
					if (!value.result.resolved && unresolvedWitnesses.length < 8)
						unresolvedWitnesses.push(value.result);
					return {
						targetId: node.id,
						index,
						mirrorOf: null,
						direction: value.result.geometry.direction,
						channels: value.result.channels,
						branch: value.result.geometry.branch,
						elapsedMilliseconds: value.elapsedMilliseconds,
						mediumEvaluations: value.result.methods.reduce(
							(sum, method) => sum + method.mediumEvaluations,
							0,
						),
						outerEvaluations: value.result.methods.reduce(
							(sum, method) => sum + method.outerEvaluations,
							0,
						),
					};
				});
				angular.push({
					rule: viewAngularRules[ruleIndex],
					rows: sumVolumeJ2(spec, node, channels, groups, compact),
					incidentCount: groups.length,
					geometryPassed: compact.every((row, index) => row.branch === groups[index].branch),
					incidentsPassed: values.every((row) => row.result.resolved),
				});
				offset += groups.length;
			}
			const point = {
				node,
				transmission,
				angular,
				elapsedMilliseconds: performance.now() - pointStarted,
				workerMilliseconds: processed.workerMilliseconds,
				mediumEvaluations: processed.mediumEvaluations,
				outerEvaluations: processed.outerEvaluations,
				...(processed.incidentCoordinate ? {incidentCoordinate: processed.incidentCoordinate} : {}),
			};
			freshPoints.push(point);
			slowestPointPerIncident = Math.max(slowestPointPerIncident, point.elapsedMilliseconds / tasks.length);
			guard(true);
			if (secondOrderPointChecks([point]).some((check) => check.state !== 'passed')) {
				unresolvedPoints.push(point);
				stopReason = `Unresolved incident, geometry or final-view admission at ${node.id}.`;
				break;
			}
			try {
				assertSecondOrderReusablePoint(point, policy);
			} catch (error) {
				unresolvedPoints.push(point);
				throw error;
			}
			available.set(secondOrderPhysicalKey(node, policy), {point, policy, parentRun: null, artifact: null});
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
	const attached = attachSecondOrderPoints(nodes, available, policy),
		points = attached.points;
	const matrixComplete =
		!failure &&
		!stopReason &&
		selection.selected.every((node) => points.some((point) => point.node.id === node.id));
	const checks = [...secondOrderPointChecks(points), ...secondOrderPointChecks(unresolvedPoints)];
	const integrals = integrateSecondOrderView(nodes, points, channels),
		fullViewComplete = points.length === nodes.length && integrals.every((row) => row.complete);
	const predictionsPassed = matrixComplete && checks.every((check) => check.state === 'passed');
	try {
		/** @type {SkySecondOrderRefinementDocument} */ const document = {
			schemaId: 'sky-second-order-view-v1',
			continuationRegistration: registration.run,
			channels,
			nodes,
			points,
			outerRule: selection.rule,
			stage,
			integrals,
			checks,
			derivations: attached.derivations,
			matrixComplete,
			predictionsPassed,
			fullViewComplete,
		};
		write(
			'view.json',
			{
				...document,
				selectedIntervals: selection.intervals,
				physicalPolicy: policy,
				stopReason,
				predictionScope:
					'Physical inner admission and selected-batch completion only; the prospective refinement outcome gates are not assessed here.',
				limitations: [
					'Full-view and per-interval integrals remain null wherever the complete frozen outer rule lacks admitted points.',
					'Incident and view-column allowances exclude unqualified outer and angular quadrature error.',
					'Alias copies retain original numerical work records, while costs.json counts only current-run physical computations.',
					'No frozen-increment, whole-N4 or Kider qualification is inferred from this execution.',
				],
			},
			{
				parents: [definition, ...parentRecords.flatMap((record) => record.identities)],
				operation:
					'Attach exact admitted parent/current physical solves to every matching frozen outer term with its own weight; retain alias derivations and integrate only complete terms in caller order.',
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
			scope: 'Current-run unique physical computations only; parent and shared-term aliases incur no new physical work.',
			points: freshPoints.map((point) => ({
				nodeId: point.node.id,
				physicalKeySha256: sha256(secondOrderPhysicalKey(point.node, policy)),
				elapsedMilliseconds: point.elapsedMilliseconds,
				workerMilliseconds: point.workerMilliseconds,
				mediumEvaluations: point.mediumEvaluations,
				viewMediumEvaluations: point.transmission.mediumEvaluations,
				outerEvaluations: point.outerEvaluations,
				admitted: !unresolvedPoints.includes(point),
			})),
		});
		write('costs.json', {
			expectedCount,
			returnedCount: completedCount,
			plannedFreshUniquePoints: freshNodes.length,
			completedFreshUniquePoints: freshPoints.length,
			parentAliasTerms: attached.derivations.filter((item) => item.sourceKind === 'parent').length,
			parentUniquePhysicalPoints: new Set(
				attached.derivations
					.filter((item) => item.sourceKind === 'parent')
					.map((item) => item.physicalKeySha256),
			).size,
			currentAliasTerms: attached.derivations.filter((item) => item.sourceKind === 'current').length,
			currentSharedAliasTerms: attached.derivations.filter(
				(item) => item.sourceKind === 'current' && item.targetNodeId !== item.currentComputedNodeId,
			).length,
			freshComputedIds: freshPoints.map((point) => point.node.id),
			workerCount: 4,
			workerMilliseconds: incident.work.workerMilliseconds,
			mediumEvaluations:
				incident.work.originalMediumEvaluations +
				incident.work.mainThreadMediumEvaluations +
				viewMediumEvaluations,
			outerEvaluations: incident.work.originalOuterEvaluations + incident.work.mainThreadOuterEvaluations,
			incidentCoordinateWork: {...incident.work, mainThreadMilliseconds: incident.mainThreadMilliseconds},
			viewMediumEvaluations,
			slowestPointMillisecondsPerIncident: slowestPointPerIncident,
			memory,
			maximumResidentSetBytes: Math.max(0, ...memory.map((row) => row.residentSetBytes)),
			memoryMetric: 'Process resident set including all owned worker threads, not private bytes',
			partialWorkCountsUnavailable:
				completedCount !== incident.work.returnedRows ||
				incident.batches.some((batch) => batch.interruptions.length > 0),
			scratchBytes: 0,
		});
		write('execution.json', {
			matrixComplete,
			fullViewComplete,
			predictionsPassed,
			predictionScope: 'Physical inner admission only; prospective outcome assessment is separate.',
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
		throw new Error(`Second-order refinement infrastructure failed in ${run.path}: ${failure?.message}`);
	return {run: run.path, seal, matrixComplete, predictionsPassed, stopReason};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const [stage, registration, attributionPlan, refinementPlan, parentCsv, transferAdmissionRun] =
		process.argv.slice(2);
	assert.ok(
		process.argv.length === 7 || process.argv.length === 8,
		'Expected stage C0 attributionPlan refinementPlan parentsCSV-or-dash [transferAdmissionRun].',
	);
	console.log(
		JSON.stringify(
			await runSecondOrderRefinement(
				registration,
				attributionPlan,
				refinementPlan,
				/** @type {SkySecondOrderRefinementStage} */ (stage),
				parentCsv === '-' ? [] : parentCsv.split(','),
				transferAdmissionRun,
			),
			null,
			2,
		),
	);
}
