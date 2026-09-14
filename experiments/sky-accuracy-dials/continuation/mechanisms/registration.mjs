import assert from 'node:assert/strict';
import path from 'node:path';
import {readdirSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {
	createRun,
	outputRelative,
	readRepository,
	resolveRepository,
	sha256,
	sourceIdentities,
	storage,
	verifyRun,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {authenticateAllocationAmendment} from '../allocations.mjs';
import {admitJob} from '../resources.mjs';
import {mechanismCases} from './cases.mjs';

export const mechanismAllocationRun = `${outputRelative}/runs/00106-c-allocation`;
const SCHEMA = 'sky-mechanism-registration-v1';
/** Exact ground point identities; these are additional density queries, not extra scored rays.
 * @type {readonly SkyContinuationProbe[]}
 */
export const mechanismGroundProbes = [
	{probeId: 'p-0930-4-7', time: '09:30', gridX: 4, gridY: 7},
	{probeId: 'p-0930-5-7', time: '09:30', gridX: 5, gridY: 7},
	{probeId: 'p-1230-3-5', time: '12:30', gridX: 3, gridY: 5},
	{probeId: 'p-1230-4-4', time: '12:30', gridX: 4, gridY: 4},
];

/** Authenticate a complete immutable input before reading any particular artifact.
 * @param {string} run - Exact repository-relative run path.
 * @returns {SkyMechanismAcceptedRun} Accepted terminal input.
 */
export function acceptedMechanismInput(run) {
	const seal = verifyRun(run);
	const terminal = /** @type {SkyMechanismTerminal} */ (JSON.parse(readRepository(seal.path, seal).toString()));
	assert.equal(terminal.state, 'accepted', 'Mechanism parents must be accepted immutable runs.');
	return {run, seal, terminal};
}

/** Inspect already resource-authenticated continuation attempts without changing them.
 * Callers first run readRegistration/admitJob, which verify the complete ledger.
 * @param {string} registrationRun - Exact original continuation identity.
 * @returns {readonly SkyMechanismAttempt[]} C3/C4 GPU attempts, including failed work.
 */
export function mechanismAttempts(registrationRun) {
	const start = Number(path.posix.basename(registrationRun).slice(0, 5));
	const results = [];
	for (const name of readdirSync(resolveRepository(`${outputRelative}/runs`)).sort()) {
		if (Number(name.slice(0, 5)) <= start) continue;
		const run = `${outputRelative}/runs/${name}`;
		const terminal = /** @type {SkyMechanismTerminal} */ (
			JSON.parse(readRepository(`${run}/sealed.json`).toString())
		);
		const parameters = terminal.recipe.parameters;
		if (
			parameters.continuationRegistration === registrationRun &&
			parameters.jobKind === 'gpu' &&
			['C3', 'C4'].includes(parameters.phase)
		)
			results.push({run, state: terminal.state, phase: parameters.phase, caseId: parameters.caseId});
	}
	return results;
}

/** Require one sealed artifact with its exact inventory identity.
 * @param {SkyMechanismAcceptedRun} input - Verified immutable input.
 * @param {string} name - Run-relative ordinary file name.
 * @returns {DialFileIdentity} Identity without derivation extensions.
 */
export function mechanismArtifact(input, name) {
	assert.equal(path.posix.basename(name), name, 'Artifact names must be local ordinary files.');
	const matches = input.terminal.artifacts.filter((item) => item.path === `${input.run}/${name}`);
	assert.equal(matches.length, 1, `Missing unique mechanism artifact ${name}.`);
	const {path: file, byteLength, sha256: hash} = matches[0];
	const result = {path: file, byteLength, sha256: hash};
	readRepository(result.path, result);
	return result;
}

/** Read and validate a prospective C3/C4 catalog against the unchanged C0 owner.
 * @param {string} registrationRun - Original campaign registration.
 * @param {string} caseRegistrationRun - Accepted mechanism-registration run.
 * @returns {SkyMechanismRegistrationRead} Exact admitted case inventory.
 */
export function readMechanismRegistration(registrationRun, caseRegistrationRun) {
	const registration = readRegistration(registrationRun),
		input = acceptedMechanismInput(caseRegistrationRun),
		artifact = mechanismArtifact(input, 'mechanisms.json');
	const record = /** @type {SkyMechanismRegistration} */ (
		JSON.parse(readRepository(artifact.path, artifact).toString())
	);
	assert.deepEqual(
		Object.keys(record).sort(),
		[
			'schemaId',
			'registration',
			'allocation',
			'reusedH',
			'cases',
			'screen',
			'probes',
			'groundDensityProbes',
			'sourceIdentities',
			'limitations',
		].sort(),
	);
	assert.equal(record.schemaId, SCHEMA);
	assert.deepEqual(record.registration, registration.seal);
	assert.equal(input.terminal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(input.terminal.recipe.parameters.jobKind, 'cpu');
	assert.equal(input.terminal.recipe.parameters.scope, 'component');
	assert.equal(input.terminal.recipe.parameters.phase, 'C3');
	const amendment = authenticateAllocationAmendment(registration, record.allocation);
	assert.equal(path.posix.dirname(record.allocation.path), mechanismAllocationRun);
	assert.deepEqual(record.reusedH, amendment.record.reusedR0);
	assert.deepEqual(record.cases, mechanismCases, 'Mechanism definitions differ from their prospective registration.');
	assert.deepEqual(record.screen, registration.record.scopes.screen);
	assert.deepEqual(record.probes, registration.probes);
	assert.deepEqual(record.groundDensityProbes, mechanismGroundProbes);
	for (const parent of [record.registration, record.allocation, record.reusedH]) {
		const matches = input.terminal.recipe.parents.filter((item) => item.path === parent.path);
		assert.equal(matches.length, 1);
		assert.deepEqual(matches[0], parent);
	}
	assert.equal(record.cases.filter((item) => item.phase === 'C3').length, 10);
	assert.equal(record.cases.filter((item) => item.phase === 'C4').length, 4);
	assert.equal(new Set(record.cases.map((item) => item.id)).size, 14);
	for (const candidate of record.cases) assert.match(`c-${candidate.id}`, /^[a-z][a-z0-9-]{0,15}$/u);
	return {run: input.run, seal: input.seal, artifact, record};
}

/** Seal exact C3/C4 definitions before any mechanism target is generated.
 * This records a prospective extension and does not mutate the C0 catalog.
 * @param {string} registrationRun - Original accepted campaign registration.
 * @returns {Promise<string>} Newly accepted immutable case-registration path.
 */
export async function registerMechanismCases(registrationRun) {
	const registration = readRegistration(registrationRun),
		allocation = acceptedMechanismInput(mechanismAllocationRun),
		amendment = authenticateAllocationAmendment(registration, allocation.seal),
		admission = admitJob(registration, 'cpu', 'component', 2 * 1024 ** 2, 'C3');
	assert.equal(
		mechanismAttempts(registration.run).length,
		0,
		'Register mechanisms before constructing their targets.',
	);
	const sources = sourceIdentities();
	/** @type {SkyMechanismRegistration} */
	const record = {
		schemaId: SCHEMA,
		registration: registration.seal,
		allocation: allocation.seal,
		reusedH: amendment.record.reusedR0,
		cases: structuredClone(mechanismCases),
		screen: structuredClone(registration.record.scopes.screen),
		probes: structuredClone(registration.probes),
		groundDensityProbes: structuredClone(mechanismGroundProbes),
		sourceIdentities: sources,
		limitations: [
			'Ten C3 screens and four C4 screens use the registered H background, grouped outputs, views8/16 and the original six-channel three-time screen. Component references retain the separate forty-probe four-channel scope.',
			'Adaptive support construction and all trial-node work are separately charged. Existing H spectra do not retain the transient fields needed by either new V evaluator.',
			'Split raw versus combined raw measures species grouping/storage/regeneration effects. Factored versus split raw moves physical density to queries while preserving analytic L1; every later order is regenerated.',
			'The three joint C4 targets require exact immutable additive predictions sealed before execution. A failed forecast remains evidence; no success is inferred from registration.',
			'Ground density observations are local J2 evidence in density units, not extra Kider radiance samples. Original ground treatment remains pinned.',
		],
	};
	const sourceBytes = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		),
		compressed = gzipSync(sourceBytes, {level: 9});
	assert.ok(
		compressed.length + Buffer.byteLength(JSON.stringify(record)) < admission.allocatedBytes - 512 * 1024,
		'Mechanism registration exceeds its compact source forecast.',
	);
	const parents = [registration.seal, allocation.seal, amendment.record.reusedR0, registration.record.inputs],
		started = Date.now(),
		initial = storage().retainedBytes;
	const run = createRun('c-mechanisms', {
		parents,
		operation:
			'Freeze the complete C3/C4 mechanism definitions and selectors before their targets; preserve the unchanged original registration and exact allocation amendment.',
		parameters: {
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C3',
			admission,
			sourceIdentities: sources,
		},
	});
	try {
		run.write('mechanisms.json', record);
		run.write('admission.json', admission);
		run.write('sources.json.gz', compressed, {
			parents: sources,
			operation:
				'Snapshot exact authored source bytes as path/hash/size/base64 JSON records, encoded with Node zlib gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				node: process.version,
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		run.guard();
		assert.ok(storage().retainedBytes - initial < admission.allocatedBytes - 512 * 1024);
		run.cleanup();
		run.finish('accepted', {
			mechanismsRegistered: true,
			caseCount: record.cases.length,
			jobElapsedMilliseconds: Date.now() - started,
		});
	} catch (error) {
		run.cleanup();
		run.finish('failed', {failure: String(error), jobElapsedMilliseconds: Date.now() - started});
		throw error;
	}
	readMechanismRegistration(registrationRun, run.path);
	return run.path;
}
