import assert from 'node:assert/strict';

export const resourceExtensionSchema = 'sky-continuation-resource-extension-v1';
export const resourceExtensionPlanPath =
	'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/resource-extension-plan.md';
export const resourceExtensionBytes = 2 * 1024 ** 2;
/** @type {DialFileIdentity} */
export const resourceExtensionRegistration = Object.freeze({
	path: 'tmp/experiments/sky-accuracy-dials/runs/00099-c0-registration/sealed.json',
	byteLength: 143375,
	sha256: 'fe2345baefe4c7c3ad20f969bd1c98579b7e3d651d167d6e372c930cb15c3b95',
});
/** @type {DialFileIdentity} */
export const resourceExtensionPrevious = Object.freeze({
	path: 'tmp/experiments/sky-accuracy-dials/runs/00106-c-allocation/sealed.json',
	byteLength: 66362,
	sha256: '2cc4df211469bcc9b163cefe62c5945e83ad33bd9ba4369db850871363d96d0a',
});
/** @type {DialFileIdentity} */
export const resourceExtensionThrough = Object.freeze({
	path: 'tmp/experiments/sky-accuracy-dials/runs/00210-angular-lobes/sealed.json',
	byteLength: 249952,
	sha256: '8b3f2728fdc6481f44f8662f9fa346125bd632c1bc01997e43d9d7e65de0e06d',
});
const mib = 1024 ** 2;
const phases = /** @type {const} */ (['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'failure-and-sealing-reserve']);
const priorBytes = [4, 16, 44, 40, 16, 104, 20, 12],
	nextBytes = [4, 16, 44, 28, 16, 124, 12, 12];
const slots = [0, 2, 12, 10, 4, 8, 0, 0],
	fullSlots = [0, 0, 0, 0, 0, 8, 0, 0];

/** Keep only the counters reconstructed before the extension row, never its own recursively embedded admission.
 * @param {SkyResourceExtensionUsage} usage @returns {SkyResourceExtensionUsage}
 */
export function resourceExtensionUsage(usage) {
	return {
		gpuConstructions: usage.gpuConstructions,
		fullCaptures: usage.fullCaptures,
		gpuElapsedMilliseconds: usage.gpuElapsedMilliseconds,
		cpuElapsedMilliseconds: usage.cpuElapsedMilliseconds,
		newRetainedBytes: usage.newRetainedBytes,
		retainedBytesByPhase: {...usage.retainedBytesByPhase},
	};
}

/** Sole allowed transfer, with exact slot identities and conservative amendment/reporting reserves.
 * @param {readonly DialContinuationPhaseAllocation[]} prior @param {SkyResourceExtensionUsage} usage
 * @param {DialContinuationResourceCaps} limits @returns {DialContinuationPhaseAllocation[]}
 */
export function resourceExtensionTransfer(prior, usage, limits) {
	assert.deepEqual(
		prior,
		phases.map((phase, i) => ({
			phase,
			constructionSlots: slots[i],
			fullCaptureSlots: fullSlots[i],
			retainedBytes: priorBytes[i] * mib,
		})),
	);
	assert.deepEqual(Object.keys(usage.retainedBytesByPhase).sort(), [...phases].sort());
	const allCounters = [
		...Object.values(usage.retainedBytesByPhase),
		usage.gpuConstructions,
		usage.fullCaptures,
		usage.gpuElapsedMilliseconds,
		usage.cpuElapsedMilliseconds,
		usage.newRetainedBytes,
	];
	assert.ok(allCounters.every((x) => Number.isSafeInteger(x) && x >= 0));
	assert.equal(
		Object.values(usage.retainedBytesByPhase).reduce((a, b) => a + b, 0),
		usage.newRetainedBytes,
	);
	assert.equal(limits.newRetainedBytes, 256 * mib);
	assert.equal(limits.totalRetainedBytes, 512 * mib);
	assert.equal(limits.constructionSlots, 36);
	assert.equal(limits.fullCaptureSlots, 8);
	assert.ok(usage.gpuConstructions <= limits.constructionSlots && usage.fullCaptures <= limits.fullCaptureSlots);
	assert.ok(usage.gpuElapsedMilliseconds <= limits.gpuJobElapsedMilliseconds);
	assert.ok(usage.cpuElapsedMilliseconds + 300000 <= limits.cpuJobElapsedMilliseconds);
	assert.ok(usage.newRetainedBytes + resourceExtensionBytes <= limits.newRetainedBytes);
	const next = prior.map((a, i) => ({...a, retainedBytes: nextBytes[i] * mib}));
	for (const a of next) {
		const retained = usage.retainedBytesByPhase[a.phase];
		assert.ok(retained <= a.retainedBytes, a.phase + ' is overspent under the fixed transfer.');
		if (a.phase === 'C6')
			assert.ok(
				retained + resourceExtensionBytes + 3 * mib <= a.retainedBytes,
				'C6 must retain the entire amendment forecast and at least 3 MiB for reporting.',
			);
	}
	assert.equal(
		next.reduce((s, a) => s + a.retainedBytes, 0),
		prior.reduce((s, a) => s + a.retainedBytes, 0),
	);
	return next;
}

/** Exact immutable basis supplied by the authenticated reader or chronological ledger.
 * @param {Pick<DialContinuationRegistrationRead,'run'|'seal'|'budgets'>} registration @param {SkyContinuationAllocationAmendmentRead} previous
 * @param {SkyResourceExtensionUsage} usage @param {DialFileIdentity} through @param {DialFileIdentity} plan
 * @returns {SkyContinuationResourceExtensionRecord}
 */
export function resourceExtensionRecord(registration, previous, usage, through, plan) {
	assert.deepEqual(registration.seal, resourceExtensionRegistration);
	assert.equal(registration.run + '/sealed.json', registration.seal.path);
	assert.deepEqual(previous.seal, resourceExtensionPrevious);
	assert.equal(previous.record.schemaId, 'sky-continuation-allocation-amendment-v1');
	assert.deepEqual(previous.record.registration, registration.seal);
	assert.deepEqual(previous.record.registeredLimits, registration.budgets, 'All original limits remain exact.');
	assert.deepEqual(through, resourceExtensionThrough, 'The frozen usage cut is the exact accepted 00210 seal.');
	assert.equal(plan.path, resourceExtensionPlanPath);
	assert.ok(Number.isSafeInteger(plan.byteLength) && plan.byteLength > 0 && /^[a-f0-9]{64}$/.test(plan.sha256));
	const effectivePhaseAllocations = resourceExtensionTransfer(
		previous.record.effectivePhaseAllocations,
		usage,
		registration.budgets,
	);
	return {
		schemaId: resourceExtensionSchema,
		registration: {...registration.seal},
		previousAmendment: {...previous.seal},
		through: {...through},
		plan: {...plan},
		registeredLimits: structuredClone(registration.budgets),
		priorPhaseAllocations: structuredClone(previous.record.effectivePhaseAllocations),
		effectivePhaseAllocations,
		usageBefore: resourceExtensionUsage(usage),
		amendmentPhase: 'C6',
		allocatedBytes: resourceExtensionBytes,
		minimumRemainingC6Bytes: 3 * mib,
		maximumJobMilliseconds: 300000,
		finalizationReserveMilliseconds: 30000,
		equation:
			'C3: 40-12=28 MiB; C6: 20-8=12 MiB; C5: 104+12+8=124 MiB. All other phase bytes, every slot and all original global limits remain unchanged; total phase allocation is 256 MiB.',
	};
}

/** Pure chronology and explicit-parent gate shared by the reader and manufactured proof.
 * @param {DialFileIdentity} seal @param {SkyContinuationAllocationAmendmentRead|SkyContinuationResourceExtensionRead|null} previous
 * @param {DialFileIdentity} lastPriorSeal @param {readonly DialFileIdentity[]} parents @returns {void}
 */
export function resourceExtensionOrder(seal, previous, lastPriorSeal, parents) {
	assert.ok(
		previous && previous.record.schemaId === 'sky-continuation-allocation-amendment-v1',
		'A single resource extension requires the original amendment first.',
	);
	assert.deepEqual(previous.seal, resourceExtensionPrevious);
	assert.deepEqual(
		lastPriorSeal,
		resourceExtensionThrough,
		'No intervening or reordered run may replace the frozen cut.',
	);
	assert.match(seal.path, /^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-c-resource-ext\/sealed\.json$/);
	assert.ok(Number(seal.path.split('/').at(-2).slice(0, 5)) > 210);
	for (const expected of [resourceExtensionRegistration, resourceExtensionPrevious, resourceExtensionThrough]) {
		const matches = parents.filter((p) => p.path === expected.path);
		assert.equal(matches.length, 1, 'One exact extension parent is required.');
		assert.deepEqual(matches[0], expected);
	}
}
