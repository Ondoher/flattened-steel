import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {outputRelative, readRepository, resolveRepository, storage, verifyRun} from '../io/files.mjs';
import {accountInvalidEvidence} from './invalid-evidence.mjs';
import {authenticateAllocationAmendment} from './allocations.mjs';
import {authenticateResourceExtension} from './resource-extension/read.mjs';
import {resourceExtensionSchema, resourceExtensionOrder} from './resource-extension/index.mjs';

/** Count every authenticated artifact and the seal exactly once.
 * @param {DialFileIdentity} seal - Exact terminal seal identity.
 * @returns {number} Complete immutable retained bytes.
 */
function retainedBytes(seal) {
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	let bytes = seal.byteLength;
	for (const artifact of terminal.artifacts) {
		assert.ok(Number.isSafeInteger(artifact.byteLength) && artifact.byteLength >= 0);
		bytes += artifact.byteLength;
	}
	assert.ok(Number.isSafeInteger(bytes));
	return bytes;
}

/** Require the exact seal as an explicit consumed parent, not only a descriptive path.
 * @param {readonly DialFileIdentity[]} parents - Current run's frozen derivation parents.
 * @param {DialFileIdentity} expected - Required completed allocation amendment.
 */
function requireParent(parents, expected) {
	assert.ok(Array.isArray(parents));
	assert.ok(
		parents.some(
			(parent) =>
				parent.path === expected.path &&
				parent.byteLength === expected.byteLength &&
				parent.sha256 === expected.sha256,
		),
		'A post-amendment job must retain the exact allocation amendment as a parent.',
	);
}

/** Reconstruct resource use from immutable terminal records; no mutable ledger is authoritative.
 * @param {DialContinuationRegistrationRead} registration - Authenticated C0 control.
 * @returns {DialContinuationResourceCounters} Actual completed debits and retained bytes.
 */
export function campaignUsage(registration) {
	const start = Number(registration.run.split('/').at(-1).slice(0, 5));
	assert.deepEqual(verifyRun(registration.run), registration.seal);
	/** @type {Record<SkyContinuationAllocationPhase, number>} */
	const retainedBytesByPhase = {
		C0: retainedBytes(registration.seal),
		C1: 0,
		C2: 0,
		C3: 0,
		C4: 0,
		C5: 0,
		C6: 0,
		'failure-and-sealing-reserve': 0,
	};
	/** @type {SkyContinuationAllocationAmendmentRead | SkyContinuationResourceExtensionRead | null} */ let allocationAmendment =
		null;
	let resourceExtensionSeen = false;
	let lastPriorSeal = registration.seal;
	let gpuConstructions = 0,
		fullCaptures = 0,
		gpuElapsedMilliseconds = 0,
		cpuElapsedMilliseconds = 0;
	/** @type {SkyContinuationInvalidEvidence[]} */ const invalidEvidence = [];
	for (const name of readdirSync(resolveRepository(`${outputRelative}/runs`)).sort()) {
		if (Number(name.slice(0, 5)) <= start) continue;
		const run = `${outputRelative}/runs/${name}`;
		const excluded = accountInvalidEvidence(run, registration.run);
		if (excluded) invalidEvidence.push(excluded);
		const sealIdentity = excluded ? excluded.seal : verifyRun(run);
		const seal = JSON.parse(readRepository(sealIdentity.path, sealIdentity).toString());
		const parameters = seal.recipe.parameters;
		assert.equal(
			parameters?.continuationRegistration,
			registration.run,
			'An unaccounted run prevents campaign admission.',
		);
		assert.ok(['gpu', 'cpu'].includes(parameters.jobKind));
		assert.ok(['screen', 'full', 'component'].includes(parameters.scope));
		assert.ok(
			['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].includes(parameters.phase),
			'Every job must declare its original phase, including failed attempts.',
		);
		assert.ok(Number.isFinite(seal.result.jobElapsedMilliseconds) && seal.result.jobElapsedMilliseconds >= 0);
		if (allocationAmendment) requireParent(seal.recipe.parents, allocationAmendment.seal);
		const isAmendment = name.endsWith('-c-allocation') || parameters.allocationAmendmentSchemaId !== undefined;
		if (isAmendment) {
			assert.equal(parameters.allocationAmendmentSchemaId, 'sky-continuation-allocation-amendment-v1');
			assert.equal(parameters.jobKind, 'cpu');
			assert.equal(parameters.scope, 'component');
			assert.equal(parameters.phase, 'C1');
			if (seal.state === 'accepted' && !excluded) {
				assert.equal(allocationAmendment, null, 'Duplicate allocation amendments are forbidden.');
				allocationAmendment = authenticateAllocationAmendment(registration, sealIdentity);
			}
		}
		const isExtension = name.endsWith('-c-resource-ext') || parameters.resourceExtensionSchemaId !== undefined;
		if (isExtension) {
			assert.ok(!resourceExtensionSeen, 'Duplicate resource extensions are forbidden.');
			resourceExtensionSeen = true;
			assert.equal(parameters.resourceExtensionSchemaId, resourceExtensionSchema);
			assert.equal(parameters.allocationAmendmentSchemaId, undefined);
			assert.equal(parameters.jobKind, 'cpu');
			assert.equal(parameters.scope, 'component');
			assert.equal(parameters.phase, 'C6');
			resourceExtensionOrder(sealIdentity, allocationAmendment, lastPriorSeal, seal.recipe.parents);
			if (seal.state === 'accepted' && !excluded) {
				allocationAmendment = authenticateResourceExtension(
					registration,
					sealIdentity,
					allocationAmendment,
					{
						gpuConstructions,
						fullCaptures,
						gpuElapsedMilliseconds,
						cpuElapsedMilliseconds,
						newRetainedBytes: Object.values(retainedBytesByPhase).reduce((sum, bytes) => sum + bytes, 0),
						retainedBytesByPhase: {...retainedBytesByPhase},
					},
					lastPriorSeal,
				);
			}
		}
		const phase = /** @type {SkyContinuationAllocationPhase} */ (
			excluded ? 'failure-and-sealing-reserve' : parameters.phase
		);
		// A planned job consumes its declared evidence allocation even when it
		// fails or times out. Only the explicit invalid extra attempt uses the
		// additional failure reserve; this is not a generic retry exemption.
		retainedBytesByPhase[phase] += retainedBytes(sealIdentity);
		if (parameters.jobKind === 'gpu') {
			gpuConstructions++;
			if (parameters.scope === 'full') fullCaptures++;
			gpuElapsedMilliseconds += seal.result.jobElapsedMilliseconds;
		} else cpuElapsedMilliseconds += seal.result.jobElapsedMilliseconds;
		lastPriorSeal = sealIdentity;
	}
	const newRetainedBytes = storage().retainedBytes - registration.initialStorage.retainedBytes;
	assert.equal(
		Object.values(retainedBytesByPhase).reduce((sum, bytes) => sum + bytes, 0),
		newRetainedBytes,
		'Completed phase accounting must cover every retained continuation byte.',
	);
	return {
		gpuConstructions,
		fullCaptures,
		gpuElapsedMilliseconds,
		cpuElapsedMilliseconds,
		newRetainedBytes,
		...(invalidEvidence.length ? {invalidEvidence} : {}),
		allocationAmendment,
		effectivePhaseAllocations: allocationAmendment
			? allocationAmendment.record.effectivePhaseAllocations
			: structuredClone(registration.budgets.phaseAllocations),
		retainedBytesByPhase,
	};
}

/** Admit a bounded job while reserving the mandatory report/failure bytes.
 * @param {DialContinuationRegistrationRead} registration - Frozen limits.
 * @param {SkyContinuationJobKind} kind - Work counter to debit.
 * @param {SkyContinuationJobScope} scope - Declared output scope.
 * @param {number} allocatedBytes - Conservative forecast for this terminal record.
 * @param {SkyContinuationJobPhase} [phase] - Explicit phase receiving the forecast; C6 may consume its own report reserve.
 * @returns {SkyContinuationAdmission} Measured prior usage and bounded allowance.
 */
export function admitJob(registration, kind, scope, allocatedBytes, phase = 'C1') {
	const usage = campaignUsage(registration),
		limits = registration.budgets,
		current = storage();
	assert.ok(Number.isSafeInteger(allocatedBytes) && allocatedBytes > 0);
	assert.ok(['gpu', 'cpu'].includes(kind) && ['screen', 'full', 'component'].includes(scope));
	assert.ok(['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].includes(phase));
	assert.ok(current.freeBytes >= limits.minimumFreeDiskBytes && current.scratchBytes < limits.liveScratchBytes);
	for (const allocation of usage.effectivePhaseAllocations)
		assert.ok(
			usage.retainedBytesByPhase[allocation.phase] <= allocation.retainedBytes,
			`The ${allocation.phase} retained allocation is already exhausted.`,
		);
	const selected = usage.effectivePhaseAllocations.find((allocation) => allocation.phase === phase);
	const failure = usage.effectivePhaseAllocations.find(
		(allocation) => allocation.phase === 'failure-and-sealing-reserve',
	);
	const reporting = usage.effectivePhaseAllocations.find((allocation) => allocation.phase === 'C6');
	assert.ok(selected && failure && reporting);
	const phaseRetainedBytes = usage.retainedBytesByPhase[phase];
	assert.ok(
		phaseRetainedBytes + allocatedBytes <= selected.retainedBytes,
		`The ${phase} retained-byte forecast exceeds its effective phase allocation.`,
	);
	const protectedReserveBytes =
		failure.retainedBytes -
		usage.retainedBytesByPhase['failure-and-sealing-reserve'] +
		(phase === 'C6' ? 0 : reporting.retainedBytes - usage.retainedBytesByPhase.C6);
	assert.ok(current.retainedBytes + allocatedBytes + protectedReserveBytes <= limits.totalRetainedBytes);
	assert.ok(
		usage.newRetainedBytes + allocatedBytes + protectedReserveBytes <= limits.newRetainedBytes,
		'Continuation evidence allowance exhausted.',
	);
	if (kind === 'gpu') {
		assert.ok(usage.gpuConstructions < limits.constructionSlots, 'GPU construction allowance exhausted.');
		assert.ok(
			scope !== 'full' || usage.fullCaptures < limits.fullCaptureSlots,
			'Full capture allowance exhausted.',
		);
	}
	const remaining =
		kind === 'gpu'
			? limits.gpuJobElapsedMilliseconds - usage.gpuElapsedMilliseconds
			: limits.cpuJobElapsedMilliseconds - usage.cpuElapsedMilliseconds;
	const perJob =
		kind === 'gpu'
			? scope === 'full'
				? limits.fullTimeoutMilliseconds
				: limits.screenTimeoutMilliseconds
			: remaining;
	const timeoutMilliseconds = Math.min(perJob, remaining);
	assert.ok(timeoutMilliseconds >= 1000, 'Continuation compute-time allowance exhausted.');
	return {
		usage,
		allocatedBytes,
		timeoutMilliseconds,
		phase,
		phaseRetainedLimitBytes: selected.retainedBytes,
		phaseRetainedBytes,
		protectedReserveBytes,
	};
}
