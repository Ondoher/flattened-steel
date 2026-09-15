import assert from 'node:assert/strict';
import path from 'node:path';
import {readRepository, verifyRun, identity, sourceIdentities} from '../../io/files.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {authenticateAllocationAmendment} from '../allocations.mjs';
import {
	resourceExtensionPrevious,
	resourceExtensionThrough,
	resourceExtensionPlanPath,
	resourceExtensionSchema,
	resourceExtensionRecord,
	resourceExtensionOrder,
	resourceExtensionBytes,
} from './index.mjs';

/** Read the fixed accepted old amendment and usage-cut evidence; no new run is allocated.
 * @param {DialContinuationRegistrationRead} registration @param {DialContinuationResourceCounters} usage
 * @returns {{record:SkyContinuationResourceExtensionRecord,previous:SkyContinuationAllocationAmendmentRead,through:SkyMechanismAcceptedRun,parents:DialFileIdentity[]}}
 */
export function readResourceExtensionBasis(registration, usage) {
	const previous = authenticateAllocationAmendment(registration, resourceExtensionPrevious);
	assert.deepEqual(usage.allocationAmendment, previous, 'Only one extension may follow the original amendment.');
	const through = acceptedMechanismInput(path.posix.dirname(resourceExtensionThrough.path));
	assert.deepEqual(through.seal, resourceExtensionThrough);
	assert.equal(through.terminal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(through.terminal.recipe.parameters.caseId, 'angular-lobes');
	const plan = identity(resourceExtensionPlanPath);
	const record = resourceExtensionRecord(registration, previous, usage, through.seal, plan);
	return {
		record,
		previous,
		through,
		parents: [registration.seal, previous.seal, through.seal, plan, mechanismArtifact(through, 'sources.json.gz')],
	};
}

/** Exact inherited source snapshot plus every changed/new current source forms a complete snapshot.
 * @param {SkyMechanismAcceptedRun} through
 * @returns {{sources:readonly DialFileIdentity[],delta:readonly DialFileIdentity[],baseSnapshot:DialFileIdentity}}
 */
export function resourceExtensionSources(through) {
	assert.deepEqual(through.seal, resourceExtensionThrough);
	const terminal = /** @type {SkyResourceExtensionTerminal} */ (
		JSON.parse(readRepository(through.seal.path, through.seal).toString())
	);
	const sources = sourceIdentities(),
		prior = terminal.sources;
	assert.ok(Array.isArray(prior));
	const currentByPath = new Map(sources.map((id) => [id.path, id]));
	assert.ok(
		prior.every((id) => currentByPath.has(id.path)),
		'Source deletion is not supported by this delta snapshot.',
	);
	const previousByPath = new Map(prior.map((id) => [id.path, id]));
	const delta = sources.filter((id) => {
		const old = previousByPath.get(id.path);
		return !old || old.sha256 !== id.sha256 || old.byteLength !== id.byteLength;
	});
	const changed = new Set(delta.map((id) => id.path));
	for (const id of sources)
		if (!changed.has(id.path)) {
			const old = previousByPath.get(id.path);
			assert.deepEqual(id, old);
			readRepository(id.path, old);
		}
	assert.ok(delta.some((id) => id.path.endsWith('/resource-extension/index.mjs')));
	assert.ok(delta.some((id) => id.path.endsWith('/continuation/resources.mjs')));
	return {sources, delta, baseSnapshot: mechanismArtifact(through, 'sources.json.gz')};
}

/** Chronological verification never invokes campaignUsage recursively.
 * @param {DialContinuationRegistrationRead} registration @param {DialFileIdentity} seal
 * @param {SkyContinuationAllocationAmendmentRead|SkyContinuationResourceExtensionRead|null} previous
 * @param {SkyResourceExtensionUsage} usageBefore @param {DialFileIdentity} lastPriorSeal
 * @returns {SkyContinuationResourceExtensionRead}
 */
export function authenticateResourceExtension(registration, seal, previous, usageBefore, lastPriorSeal) {
	const run = path.posix.dirname(seal.path);
	assert.deepEqual(verifyRun(run), seal);
	const parent = acceptedMechanismInput(run);
	const terminal = /** @type {SkyResourceExtensionTerminal} */ (
		JSON.parse(readRepository(seal.path, seal).toString())
	);
	const params = terminal.recipe.parameters;
	resourceExtensionOrder(seal, previous, lastPriorSeal, parent.terminal.recipe.parents);
	assert.ok(previous && previous.record.schemaId === 'sky-continuation-allocation-amendment-v1');
	assert.equal(params.resourceExtensionSchemaId, resourceExtensionSchema);
	assert.equal(params.allocationAmendmentSchemaId, undefined);
	assert.equal(params.continuationRegistration, registration.run);
	assert.equal(params.caseId, 'resource-extension');
	assert.equal(params.extensionId, 'compensation-attribution-v1');
	assert.equal(params.jobKind, 'cpu');
	assert.equal(params.scope, 'component');
	assert.equal(params.phase, 'C6');
	assert.equal(params.allocatedBytes, resourceExtensionBytes);
	assert.equal(terminal.result.extensionRegistered, true);
	assert.equal(terminal.result.failure, null);
	assert.equal(terminal.result.gpuJobsExecuted, 0);
	assert.ok(terminal.result.jobElapsedMilliseconds <= 300000);
	const artifact = mechanismArtifact(parent, 'extension.json');
	const record = /** @type {SkyContinuationResourceExtensionRecord} */ (
		JSON.parse(readRepository(artifact.path, artifact).toString())
	);
	readRepository(record.plan.path, record.plan);
	const expected = resourceExtensionRecord(
		registration,
		/** @type {SkyContinuationAllocationAmendmentRead} */ (previous),
		usageBefore,
		lastPriorSeal,
		record.plan,
	);
	assert.deepEqual(record, expected, 'Only the closed conserved extension record is accepted.');
	assert.equal(params.admission.phase, 'C6');
	assert.equal(params.admission.allocatedBytes, resourceExtensionBytes);
	assert.equal(params.admission.phaseRetainedLimitBytes, 20 * 1024 ** 2);
	assert.equal(params.admission.phaseRetainedBytes, usageBefore.retainedBytesByPhase.C6);
	assert.deepEqual(params.admission.usage.allocationAmendment, previous);
	assert.deepEqual(params.admission.usage.effectivePhaseAllocations, expected.priorPhaseAllocations);
	assert.deepEqual(params.admission.usage.retainedBytesByPhase, usageBefore.retainedBytesByPhase);
	const matches = parent.terminal.recipe.parents.filter((id) => id.path === expected.plan.path);
	assert.deepEqual(matches, [expected.plan]);
	const retained = seal.byteLength + parent.terminal.artifacts.reduce((sum, a) => sum + a.byteLength, 0);
	assert.ok(retained <= resourceExtensionBytes);
	assert.ok(usageBefore.retainedBytesByPhase.C6 + retained + 3 * 1024 ** 2 <= 12 * 1024 ** 2);
	return {seal: {...seal}, record};
}
