import assert from 'node:assert/strict';
import {
	resourceExtensionTransfer,
	resourceExtensionRecord,
	resourceExtensionOrder,
	resourceExtensionRegistration as registrationSeal,
	resourceExtensionPrevious as previousSeal,
	resourceExtensionThrough as through,
	resourceExtensionPlanPath,
} from './index.mjs';

/** Synthetic accounting fixtures only; no amendment is executed or evidence written.
 * @returns {{checks:number,scope:string}}
 */
export function resourceExtensionProof() {
	let checks = 0;
	/** @param {boolean} condition */ function check(condition) {
		assert.ok(condition, 'Resource extension proof ' + (checks + 1));
		checks++;
	}
	/** @param {()=>unknown} action */ function rejects(action) {
		assert.throws(action);
		checks++;
	}
	const mib = 1024 ** 2;
	const phases = /** @type {const} */ (['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'failure-and-sealing-reserve']);
	const bytes = [4, 16, 44, 40, 16, 104, 20, 12],
		slots = [0, 2, 12, 10, 4, 8, 0, 0];
	const prior = phases.map((phase, i) => ({
		phase,
		constructionSlots: slots[i],
		fullCaptureSlots: phase === 'C5' ? 8 : 0,
		retainedBytes: bytes[i] * mib,
	}));
	/** @type {DialContinuationResourceCaps} */ const limits = {
		totalRetainedBytes: 512 * mib,
		newRetainedBytes: 256 * mib,
		liveScratchBytes: 1024 * mib,
		minimumFreeDiskBytes: 40 * 1024 ** 3,
		constructionSlots: 36,
		fullCaptureSlots: 8,
		concurrentGpuJobs: 1,
		gpuJobElapsedMilliseconds: 64800000,
		cpuJobElapsedMilliseconds: 28800000,
		screenTimeoutMilliseconds: 1800000,
		fullTimeoutMilliseconds: 5400000,
		scalarFieldBytes: 1024 * mib,
		hostHeadroomBytes: 2048 * mib,
		processPrivateBytes: 6144 * mib,
		initialAvailableMemoryFraction: 0.5,
		localJ2QueryCount: 16,
		modelRevisionsPerWorkPackage: 1,
		phaseAllocations: prior,
	};
	/** @type {SkyResourceExtensionUsage} */ const usage = {
		gpuConstructions: 35,
		fullCaptures: 0,
		gpuElapsedMilliseconds: 6000000,
		cpuElapsedMilliseconds: 19000000,
		newRetainedBytes: 8 * mib,
		retainedBytesByPhase: {
			C0: mib,
			C1: mib,
			C2: mib,
			C3: mib,
			C4: mib,
			C5: mib,
			C6: mib,
			'failure-and-sealing-reserve': mib,
		},
	};
	const next = resourceExtensionTransfer(prior, usage, limits);
	check(next.reduce((s, a) => s + a.retainedBytes, 0) === 256 * mib);
	check(
		next[3].retainedBytes === 28 * mib && next[5].retainedBytes === 124 * mib && next[6].retainedBytes === 12 * mib,
	);
	for (let i = 0; i < prior.length; i++) {
		check(
			next[i].constructionSlots === prior[i].constructionSlots &&
				next[i].fullCaptureSlots === prior[i].fullCaptureSlots,
		);
		for (const key of /** @type {const} */ (['retainedBytes', 'constructionSlots', 'fullCaptureSlots'])) {
			const broken = structuredClone(prior);
			broken[i][key]++;
			rejects(() => resourceExtensionTransfer(broken, usage, limits));
		}
		const counts = {...usage.retainedBytesByPhase, [phases[i]]: next[i].retainedBytes + 1};
		rejects(() =>
			resourceExtensionTransfer(
				prior,
				{
					...usage,
					retainedBytesByPhase: counts,
					newRetainedBytes: Object.values(counts).reduce((s, n) => s + n, 0),
				},
				limits,
			),
		);
	}
	for (const invalid of [-1, Number.NaN, Infinity, 1.5])
		rejects(() => resourceExtensionTransfer(prior, {...usage, gpuConstructions: invalid}, limits));
	rejects(() => resourceExtensionTransfer([...prior].reverse(), usage, limits));
	rejects(() => resourceExtensionTransfer(prior, {...usage, newRetainedBytes: usage.newRetainedBytes + 1}, limits));
	rejects(() => resourceExtensionTransfer(prior, {...usage, gpuConstructions: 37}, limits));
	rejects(() => resourceExtensionTransfer(prior, {...usage, fullCaptures: 9}, limits));
	rejects(() =>
		resourceExtensionTransfer(prior, {...usage, cpuElapsedMilliseconds: limits.cpuJobElapsedMilliseconds}, limits),
	);
	const registration = {run: registrationSeal.path.slice(0, -12), seal: registrationSeal, budgets: limits};
	/** @type {SkyContinuationAllocationAmendmentRead} */ const previous = {
		seal: previousSeal,
		record: {
			schemaId: 'sky-continuation-allocation-amendment-v1',
			registration: registrationSeal,
			reusedR0: registrationSeal,
			reuseControl: registrationSeal,
			reuseExecution: registrationSeal,
			registeredLimits: limits,
			originalPhaseAllocations: prior,
			effectivePhaseAllocations: prior,
			equation: 'fixture',
			reason: 'fixture',
			reuseScope: 'fixture',
		},
	};
	const plan = {path: resourceExtensionPlanPath, byteLength: 1, sha256: 'a'.repeat(64)};
	const record = resourceExtensionRecord(registration, previous, usage, through, plan);
	check(record.effectivePhaseAllocations[5].retainedBytes === 124 * mib);
	const extensionSeal = {
		path: 'tmp/experiments/sky-accuracy-dials/runs/00211-c-resource-ext/sealed.json',
		byteLength: 1,
		sha256: 'b'.repeat(64),
	};
	const parents = [registrationSeal, previousSeal, through];
	resourceExtensionOrder(extensionSeal, previous, through, parents);
	checks++;
	rejects(() => resourceExtensionOrder(extensionSeal, null, through, parents));
	rejects(() => resourceExtensionOrder(extensionSeal, {seal: extensionSeal, record}, through, parents));
	rejects(() => resourceExtensionOrder(extensionSeal, previous, previousSeal, parents));
	rejects(() =>
		resourceExtensionOrder(
			{...extensionSeal, path: extensionSeal.path.replace('00211', '00105')},
			previous,
			through,
			parents,
		),
	);
	for (const omitted of parents)
		rejects(() =>
			resourceExtensionOrder(
				extensionSeal,
				previous,
				through,
				parents.filter((p) => p !== omitted),
			),
		);
	rejects(() => resourceExtensionOrder(extensionSeal, previous, through, [...parents, previousSeal]));
	rejects(() =>
		resourceExtensionRecord(
			{...registration, budgets: {...limits, liveScratchBytes: limits.liveScratchBytes + 1}},
			previous,
			usage,
			through,
			plan,
		),
	);
	rejects(() => resourceExtensionRecord(registration, previous, usage, {...through, sha256: 'c'.repeat(64)}, plan));
	const reserveUsage = {
		...usage,
		retainedBytesByPhase: {...usage.retainedBytesByPhase, C6: 7 * mib + 1},
		newRetainedBytes: 14 * mib + 1,
	};
	rejects(() => resourceExtensionTransfer(prior, reserveUsage, limits));
	return {
		checks,
		scope: 'Fixed conserved byte transfer, all phase and slot mutations, actual-debit coverage, counters, compute/report reserves, exact prerequisite identities, missing/duplicate/reordered extension parents and rejection of a second extension. No immutable run.',
	};
}
