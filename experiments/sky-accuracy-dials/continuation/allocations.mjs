import assert from 'node:assert/strict';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {readRepository, verifyRun} from '../io/files.mjs';
import {readRegistration} from './registration/run.mjs';

const MIB = 1024 ** 2;
const SCHEMA = 'sky-continuation-allocation-amendment-v1';
/** @readonly @type {DialFileIdentity} */
const REGISTRATION = {
	path: 'tmp/experiments/sky-accuracy-dials/runs/00099-c0-registration/sealed.json',
	byteLength: 143375,
	sha256: 'fe2345baefe4c7c3ad20f969bd1c98579b7e3d651d167d6e372c930cb15c3b95',
};
/** @readonly @type {DialFileIdentity} */
const REUSED_R0 = {
	path: 'tmp/experiments/sky-accuracy-dials/runs/00103-c-r0-scr/sealed.json',
	byteLength: 214683,
	sha256: '162a0214b66c7576d3ee245c53cb826030ef393a660c6d4287f59cb8fa0aea24',
};
/** The sole original byte allocation eligible for this amendment.
 * @readonly @type {readonly DialContinuationPhaseAllocation[]}
 */
const ORIGINAL_PHASES = [
	{phase: 'C0', constructionSlots: 0, fullCaptureSlots: 0, retainedBytes: 8 * MIB},
	{phase: 'C1', constructionSlots: 2, fullCaptureSlots: 0, retainedBytes: 16 * MIB},
	{phase: 'C2', constructionSlots: 12, fullCaptureSlots: 0, retainedBytes: 48 * MIB},
	{phase: 'C3', constructionSlots: 10, fullCaptureSlots: 0, retainedBytes: 32 * MIB},
	{phase: 'C4', constructionSlots: 4, fullCaptureSlots: 0, retainedBytes: 16 * MIB},
	{phase: 'C5', constructionSlots: 8, fullCaptureSlots: 8, retainedBytes: 104 * MIB},
	{phase: 'C6', constructionSlots: 0, fullCaptureSlots: 0, retainedBytes: 20 * MIB},
	{phase: 'failure-and-sealing-reserve', constructionSlots: 0, fullCaptureSlots: 0, retainedBytes: 12 * MIB},
];

/** Select and authenticate one uniquely retained artifact from a verified parent.
 * @param {readonly DialArtifact[]} artifacts - Immutable verified seal inventory.
 * @param {string} file - Exact repository-relative artifact path.
 * @returns {DialFileIdentity} Plain exact identity without its derivation metadata.
 */
function artifactIdentity(artifacts, file) {
	const matches = artifacts.filter((artifact) => artifact.path === file);
	assert.equal(matches.length, 1, `The sealed parent must contain exactly one ${file}.`);
	const {path: artifactPath, byteLength, sha256} = matches[0];
	const identity = {path: artifactPath, byteLength, sha256};
	readRepository(identity.path, identity);
	return identity;
}

/** Authenticate the fixed C0/R0 evidence and derive the one permitted conserved transfer.
 * @param {DialContinuationRegistrationRead} registration - Original authenticated C0 projection.
 * @returns {SkyContinuationAllocationBasis} Deterministic amendment basis; this function writes nothing.
 */
export function allocationBasis(registration) {
	const registrationRun = path.posix.dirname(REGISTRATION.path);
	assert.equal(registration.run, registrationRun);
	assert.deepEqual(registration.seal, REGISTRATION, 'Only the pinned original C0 registration is eligible.');
	const authenticated = readRegistration(registrationRun);
	assert.deepEqual(authenticated.seal, REGISTRATION);
	assert.deepEqual(registration, authenticated, 'The supplied registration projection must remain unchanged.');
	const originalPhaseAllocations = authenticated.budgets.phaseAllocations;
	assert.deepEqual(originalPhaseAllocations, ORIGINAL_PHASES);
	assert.equal(authenticated.budgets.newRetainedBytes, 256 * MIB);
	const registrationTerminal = JSON.parse(readRepository(REGISTRATION.path, REGISTRATION).toString());
	const registrationBytes =
		REGISTRATION.byteLength +
		registrationTerminal.artifacts.reduce((sum, artifact) => sum + artifact.byteLength, 0);
	assert.ok(registrationBytes <= 4 * MIB, 'Actual immutable C0 evidence must fit its reduced allocation.');

	const reusedRun = path.posix.dirname(REUSED_R0.path);
	assert.deepEqual(verifyRun(reusedRun), REUSED_R0, 'Only the pinned accepted R0 capture supplies this reuse.');
	const terminal = JSON.parse(readRepository(REUSED_R0.path, REUSED_R0).toString());
	assert.equal(terminal.state, 'accepted');
	assert.equal(terminal.recipe.parameters.continuationRegistration, registrationRun);
	assert.equal(terminal.recipe.parameters.jobKind, 'gpu');
	assert.equal(terminal.recipe.parameters.scope, 'screen');
	assert.equal(terminal.recipe.parameters.phase, 'C1');
	assert.equal(terminal.recipe.parameters.caseId, 'r0');
	assert.equal(terminal.result.caseId, 'r0');
	assert.equal(terminal.result.scope, 'screen');
	assert.equal(terminal.result.failure, null);
	assert.equal(terminal.result.retainedChannelCount, 6);
	const reuseControl = artifactIdentity(terminal.artifacts, `${reusedRun}/control.json`),
		reuseExecution = artifactIdentity(terminal.artifacts, `${reusedRun}/execution.json`);
	const control = /** @type {SkyGpuControl} */ (
		JSON.parse(readRepository(reuseControl.path, reuseControl).toString())
	);
	const execution = JSON.parse(readRepository(reuseExecution.path, reuseExecution).toString());
	const registeredCases = authenticated.record.constructionCases.filter((candidate) => candidate.id === 'r0');
	assert.equal(registeredCases.length, 1);
	const registeredR0 = registeredCases[0];
	assert.equal(registeredR0.phase, 'C1');
	assert.equal(registeredR0.finalFirstOrder, 'raw');
	assert.deepEqual(registeredR0.controls.viewIntervals, [8, 16]);
	assert.deepEqual(control.controls.viewIntervals, [1, 2, 4, 8, 16]);
	assert.ok(registeredR0.controls.viewIntervals.every((count) => control.controls.viewIntervals.includes(count)));
	assert.deepEqual(
		{...control.controls, viewIntervals: registeredR0.controls.viewIntervals},
		registeredR0.controls,
		'R0 must retain every registered numerical control apart from its larger explicit view union.',
	);
	assert.deepEqual(terminal.recipe.parameters.controls, control.controls);
	assert.deepEqual(control.channels, [0, 8, 16, 24, 30, 39]);
	assert.deepEqual(control.channels, authenticated.record.scopes.screen.channels);
	assert.deepEqual(
		control.scenes.map((scene) => scene.time),
		['09:30', '11:15', '13:30'],
	);
	assert.deepEqual(
		control.scenes.map((scene) => scene.time),
		authenticated.record.scopes.screen.times,
	);
	assert.deepEqual(
		control.scenes,
		authenticated.probeScenes.filter((scene) => authenticated.record.scopes.screen.times.includes(scene.time)),
	);
	assert.equal(control.continuation.finalFirstOrder, registeredR0.finalFirstOrder);
	assert.equal(control.continuation.referenceMode, 'component');
	assert.deepEqual(control.continuation.probes, authenticated.probes);
	assert.deepEqual(control.continuation.probeScenes, authenticated.probeScenes);
	assert.equal(execution.failure, null);
	assert.equal(execution.execution.failure, null);
	assert.equal(execution.execution.executionSucceeded, true);
	assert.deepEqual(execution.execution.browser.channels, control.channels);
	assert.equal(execution.execution.browser.plan.rayCount, 3 * 81);
	assert.equal(execution.execution.browser.plan.viewCount, control.controls.viewIntervals.length);
	assert.deepEqual(
		execution.execution.channels.map((channel) => channel.channel),
		control.channels,
	);
	for (const channel of execution.execution.channels)
		assert.deepEqual(channel.shape, {representationCount: 4, viewCount: 5, orderCount: 4, rayCount: 243});

	const effectivePhaseAllocations = originalPhaseAllocations.map((allocation) => ({
		...allocation,
		retainedBytes:
			allocation.phase === 'C0'
				? 4 * MIB
				: allocation.phase === 'C2'
					? 44 * MIB
					: allocation.phase === 'C3'
						? 40 * MIB
						: allocation.retainedBytes,
	}));
	for (const allocations of [originalPhaseAllocations, effectivePhaseAllocations]) {
		assert.equal(
			allocations.reduce((sum, allocation) => sum + allocation.retainedBytes, 0),
			256 * MIB,
		);
		assert.equal(
			allocations.reduce((sum, allocation) => sum + allocation.constructionSlots, 0),
			authenticated.budgets.constructionSlots,
		);
		assert.equal(
			allocations.reduce((sum, allocation) => sum + allocation.fullCaptureSlots, 0),
			authenticated.budgets.fullCaptureSlots,
		);
	}
	return {
		schemaId: SCHEMA,
		registration: {...REGISTRATION},
		reusedR0: {...REUSED_R0},
		reuseControl,
		reuseExecution,
		registeredLimits: structuredClone(authenticated.budgets),
		originalPhaseAllocations: structuredClone(originalPhaseAllocations),
		effectivePhaseAllocations,
		equation:
			'C0: 8-4=4 MiB; C2: 48-4=44 MiB; C3: 32+4+4=40 MiB. Effective C0/C1/C2/C3/C4/C5/C6/failure bytes: (4+16+44+40+16+104+20+12) MiB = 256 MiB. All construction/full-capture slots and global ceilings remain unchanged.',
		reason: 'Final spectra retain evaluated radiances, not the transient fields needed for new adaptive view queries. Transfer 4 MiB of unused C0 allowance and 4 MiB saved by exact C2 R0 output reuse into C3 for new adaptive construction evidence, within the original total allowance.',
		reuseScope:
			'Reuse only the accepted R0 screen outputs at subdivisions 8 and 16, contained in its original 1/2/4/8/16 view union, with the registered numerical controls, six channels, three screen times and declared component probes. Discarded transient fields are not reusable; this amendment establishes no new reference-convergence or adaptive-query claim.',
	};
}

/** Authenticate a sealed record containing precisely the fixed allocation amendment.
 * @param {DialContinuationRegistrationRead} registration - Unchanged original C0 projection.
 * @param {DialFileIdentity} seal - Claimed accepted c-allocation terminal identity.
 * @returns {SkyContinuationAllocationAmendmentRead} Authenticated immutable amendment and its basis.
 */
export function authenticateAllocationAmendment(registration, seal) {
	assert.match(seal.path, /^tmp\/experiments\/sky-accuracy-dials\/runs\/\d{5}-c-allocation\/sealed\.json$/u);
	const run = path.posix.dirname(seal.path);
	assert.deepEqual(verifyRun(run), seal);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.equal(terminal.state, 'accepted');
	assert.equal(terminal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(terminal.recipe.parameters.jobKind, 'cpu');
	assert.equal(terminal.recipe.parameters.scope, 'component');
	assert.equal(terminal.recipe.parameters.phase, 'C1');
	assert.equal(terminal.recipe.parameters.allocationAmendmentSchemaId, SCHEMA);
	assert.equal(terminal.result.amendmentRegistered, true);
	const amendment = artifactIdentity(terminal.artifacts, `${run}/amendment.json`);
	const record = /** @type {SkyContinuationAllocationBasis} */ (
		JSON.parse(readRepository(amendment.path, amendment).toString())
	);
	const expected = allocationBasis(registration);
	assert.deepEqual(record, expected, 'The amendment must equal the one authenticated fixed transfer.');
	for (const parent of [expected.registration, expected.reusedR0, expected.reuseControl, expected.reuseExecution]) {
		const matches = terminal.recipe.parents.filter((candidate) => candidate.path === parent.path);
		assert.equal(matches.length, 1, `The amendment must name exactly one parent identity for ${parent.path}.`);
		assert.ok(isDeepStrictEqual(matches[0], parent), 'The amendment parent identity must remain exact.');
	}
	return {seal: {...seal}, record};
}
