import assert from 'node:assert/strict';
import {lstatSync, readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {
	checkedAbsolute,
	createRun,
	identity,
	readRepository,
	sha256,
	sourceIdentities,
	storage,
	verifyRun,
} from '../io/files.mjs';
import {allocationBasis, authenticateAllocationAmendment} from './allocations.mjs';
import {readRegistration} from './registration/run.mjs';
import {admitJob} from './resources.mjs';

const ALLOCATED_BYTES = 960 * 1024;
const TERMINAL_RESERVE_BYTES = 256 * 1024;
const PLAN = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/continuation-plan.md';

/** Authenticate the actual registered Node binary without retaining another binary copy.
 * @returns {DialContinuationToolIdentity} Canonical bounded executable identity.
 */
function nodeIdentity() {
	const file = checkedAbsolute(process.execPath),
		facts = lstatSync(file);
	assert.ok(facts.isFile() && facts.size > 0 && facts.size <= 256 * 1024 ** 2);
	const bytes = readFileSync(file);
	assert.equal(bytes.length, facts.size);
	return {path: file, byteLength: bytes.length, sha256: sha256(bytes), version: process.version};
}

/** Register the sole authorized C0/C2-to-C3 byte transfer before later target work.
 * The original registration, all global ceilings and every construction slot stay
 * unchanged. This creates only a compact immutable CPU record, never new spectra.
 * @param {string} registrationRun - Exact original accepted C0 registration.
 * @returns {DialExecutionResult} Strictly verified terminal amendment identity.
 */
export function registerAllocationAmendment(registrationRun) {
	const registration = readRegistration(registrationRun);
	const admission = admitJob(registration, 'cpu', 'component', ALLOCATED_BYTES, 'C1');
	assert.equal(admission.usage.allocationAmendment, null, 'The sole allocation amendment is already registered.');
	const started = Date.now(),
		initialStorage = storage();
	const basis = allocationBasis(registration);
	for (const allocation of basis.effectivePhaseAllocations)
		assert.ok(
			admission.usage.retainedBytesByPhase[allocation.phase] <= allocation.retainedBytes,
			'The amendment cannot lower an allocation below its already retained evidence.',
		);
	const node = nodeIdentity();
	assert.deepEqual(
		node,
		registration.record.host.node,
		'The amendment must use the registered actual Node executable.',
	);
	const plan = identity(PLAN),
		planBytes = readRepository(PLAN, plan);
	const sources = sourceIdentities();
	const sourceRecords = sources.map((source) => ({
		...source,
		base64: readRepository(source.path, source).toString('base64'),
	}));
	const sourceBytes = Buffer.from(JSON.stringify(sourceRecords));
	const compressedSources = gzipSync(sourceBytes, {level: 9});
	assert.ok(
		compressedSources.length + planBytes.length + Buffer.byteLength(JSON.stringify(basis)) + 128 * 1024 <
			ALLOCATED_BYTES - TERMINAL_RESERVE_BYTES,
		'The compact amendment snapshot exceeds its sub-MiB forecast.',
	);
	const parents = [
		basis.registration,
		basis.reusedR0,
		basis.reuseControl,
		basis.reuseExecution,
		registration.record.inputs,
		plan,
		...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
	];
	const recipe = {
		parents,
		operation:
			'Register the single exact phase-allocation transfer supported by the preserved C0 and successful R0 screen, retaining the original ceilings and all construction slots. Invalid parent records are consumed only for resource accounting and remain excluded scientific evidence. No scientific target is generated or altered.',
		parameters: {
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C1',
			allocationAmendmentSchemaId: basis.schemaId,
			allocatedBytes: ALLOCATED_BYTES,
			admission,
			node,
		},
	};
	const run = createRun('c-allocation', recipe);
	/** Check actual job growth while retaining a bounded terminal/failure reserve. */
	function guard() {
		const current = run.guard();
		assert.ok(
			Date.now() - started < admission.timeoutMilliseconds,
			'Allocation amendment exhausted its CPU time allowance.',
		);
		assert.ok(
			current.retainedBytes - initialStorage.retainedBytes < ALLOCATED_BYTES - TERMINAL_RESERVE_BYTES,
			'Allocation amendment exhausted its artifact allowance.',
		);
	}
	/** Write one bounded artifact without spending the terminal reserve.
	 * @param {string} name - Fresh run-relative artifact name.
	 * @param {unknown} value - JSON-compatible value or exact bytes.
	 * @param {DialDerivation} [derivation] - More specific source-snapshot provenance.
	 * @returns {DialFileIdentity} Exact newly retained artifact identity.
	 */
	function write(name, value, derivation) {
		guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
		assert.ok(
			storage().retainedBytes - initialStorage.retainedBytes + bytes.length <
				ALLOCATED_BYTES - TERMINAL_RESERVE_BYTES,
			'Allocation amendment write exceeds its complete artifact forecast.',
		);
		return run.write(name, bytes, derivation);
	}
	let terminal = false;
	try {
		run.progress(
			'allocation-authentication',
			'Authenticated unchanged C0 limits and the exact reusable R0 spectral capture.',
		);
		const amendment = write('amendment.json', basis);
		write('admission.json', admission);
		write('node.json', node);
		write('continuation-plan.md', planBytes, {
			parents: [plan],
			operation:
				'Preserve the exact governing plan observed when the prospective allocation amendment was registered.',
		});
		write('sources.json.gz', compressedSources, {
			parents: sources,
			operation:
				'Snapshot every authored source as JSON records containing exact path, byteLength, sha256 and base64 bytes; encode with Node zlib gzip level9 without editing the original files.',
			parameters: {
				node: process.version,
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		run.progress(
			'allocation-reauthentication',
			'Rechecking the original parents, actual Node executable and all captured source bytes before sealing.',
		);
		for (const parent of parents) readRepository(parent.path, parent);
		for (const source of sources) readRepository(source.path, source);
		assert.deepEqual(nodeIdentity(), node);
		guard();
		run.cleanup();
		const result = {
			amendmentRegistered: true,
			amendment,
			jobElapsedMilliseconds: Date.now() - started,
			gpuJobsExecuted: 0,
			allocatedBytes: ALLOCATED_BYTES,
		};
		assert.ok(
			Buffer.byteLength(JSON.stringify({sources, recipe, result})) * 3 + 32768 < TERMINAL_RESERVE_BYTES,
			'Allocation amendment terminal metadata exceeds its reserve.',
		);
		const seal = run.finish('accepted', result);
		terminal = true;
		assert.deepEqual(verifyRun(run.path), seal);
		assert.deepEqual(authenticateAllocationAmendment(registration, seal).record, basis);
		const completed = JSON.parse(readRepository(seal.path, seal).toString());
		const retainedBytes =
			seal.byteLength + completed.artifacts.reduce((sum, artifact) => sum + artifact.byteLength, 0);
		assert.ok(
			retainedBytes <= ALLOCATED_BYTES && retainedBytes < 1024 ** 2,
			'The sealed amendment exceeds its sub-MiB retained allocation.',
		);
		return {run: run.path, seal, accepted: true};
	} catch (error) {
		if (!terminal) {
			run.progress('allocation-failure', String(error).slice(0, 4096));
			run.finish('failed', {
				message: String(error).slice(0, 8192),
				stack: String(error?.stack ?? '').slice(0, 8192),
				amendmentRegistered: false,
				jobElapsedMilliseconds: Date.now() - started,
				gpuJobsExecuted: 0,
				allocatedBytes: ALLOCATED_BYTES,
			});
		}
		throw error;
	}
}
