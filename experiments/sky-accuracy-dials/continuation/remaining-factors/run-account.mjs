import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {
	createRun,
	identity,
	readRepository,
	outputRelative,
	sourceIdentities,
	sha256,
	verifyRun,
	storage,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob, campaignUsage} from '../resources.mjs';
import {readRemainingInputs, accountRemaining} from './account.mjs';

/** Focused manufactured signed-budget checks; no atmospheric integration.
 * @returns {number} Assertion count.
 */
function proof() {
	let checks = 0;
	for (const [residual, delta] of [
		[2, -1],
		[-2, -1],
		[-2, 1],
		[0, 1],
		[1, -3],
	]) {
		assert.equal((residual + delta) ** 2 - residual ** 2, 2 * residual * delta + delta ** 2);
		checks++;
	}
	assert.ok(3 + 2 - 4 > 0);
	checks++;
	assert.ok([0, 1, 5].every((later) => 3 + 2 + later - 4 >= 3 + 2 - 4));
	checks++;
	return checks;
}

/** Seal one retained-data analysis and its prospective cache-build decision. */
async function main() {
	const proofChecks = proof();
	if (process.argv[2] === 'proof') {
		console.log(JSON.stringify({proofChecks}));
		return;
	}
	assert.equal(process.argv[2], 'execute', 'Use proof or execute.');
	const started = Date.now(),
		deadline = Date.parse('2026-09-15T19:39:00Z');
	assert.ok(started < deadline - 120000);
	const registration = readRegistration(`${outputRelative}/runs/00099-c0-registration`);
	const allocatedBytes = 3 * 1024 ** 2,
		admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	const input = readRemainingInputs(),
		sources = sourceIdentities();
	const plan = identity(
		'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/remaining-factors-plan.md',
	);
	const parents = [
		registration.seal,
		registration.record.inputs,
		plan,
		...input.parents,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((r) => r.seal),
	];
	const maximumJobMilliseconds = Math.min(600000, deadline - started, admission.timeoutMilliseconds);
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Reuse matched retained orders and corrected P1; partition residuals and signed candidate responses, then apply the prospective higher-order GPU priority gate.',
		parameters: {
			caseId: 'remaining-factors-account-v1',
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			phase: 'C5',
			scope: 'component',
			admission,
			sourceIdentities: sources,
			allocatedBytes,
			maximumJobMilliseconds,
			nodeVersion: process.version,
			newRadianceIntegrations: 0,
			physicalCoefficientsFitted: false,
			priorPatchSha256: 'b86d1f302c6cba4f6a6a7c4c35d19428c7c9e087b84417ecb5e4d35549fb9337',
		},
	};
	const run = createRun('remain-account', recipe),
		definition = identity(run.path + '/definition.json');
	console.log(JSON.stringify({run: run.path, phase: 'allocated'}));
	let written = definition.byteLength;
	/** @type {Error|null} */ let failure = null;
	/** @type {SkyRemainingAssessment|null} */ let result = null;
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: 'Compute ' + name + ' by the authenticated remaining-factors accounting source.',
		},
	) {
		assert.ok(Date.now() - started < maximumJobMilliseconds - 30000);
		run.guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value) + '\n');
		assert.ok(written + bytes.length < allocatedBytes - 768 * 1024, 'Accounting allocation exceeded');
		written += run.write(name, bytes, derivation).byteLength;
	}
	try {
		run.progress(
			'account',
			'Replaying retained higher orders and exact original prefixes; no new numerical integration.',
		);
		write('remaining-factors-plan.md', readRepository(plan.path, plan), {
			parents: [plan],
			operation: 'Copy fixed authority, selectors, decision gate and stop.',
		});
		const snapshot = Buffer.from(
			JSON.stringify(sources.map((id) => ({...id, base64: readRepository(id.path, id).toString('base64')}))),
		);
		write('sources.json.gz', gzipSync(snapshot, {level: 9}), {
			parents: sources,
			operation: 'Encode exact source bytes as base64 JSON and gzip level9.',
			parameters: {uncompressedByteLength: snapshot.length, uncompressedSha256: sha256(snapshot)},
		});
		result = accountRemaining(input);
		write('accounting.json.gz', gzipSync(Buffer.from(JSON.stringify(result)), {level: 9}));
		write('groups.json', result.groups);
		write('decision.json', {
			runHigherFactorial: result.runHigherFactorial,
			gates: result.gates,
			meaning: 'Work priority only; untested physical higher-order errors remain unresolved.',
		});
		write('proof.json', {proofChecks, prefixChecks: result.prefixChecks, scalarRows: result.rows.length});
		run.progress('finalize', 'Retaining every signed group and intervention, including score regressions.');
		for (const id of [...parents, ...sources]) readRepository(id.path, id);
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		caseId: 'remaining-factors-account-v1',
		failure: failure?.message ?? null,
		jobElapsedMilliseconds: Date.now() - started,
		gpuJobsExecuted: 0,
		newRadianceIntegrations: 0,
		proofChecks,
		prefixChecks: result?.prefixChecks ?? 0,
		runHigherFactorial: result?.runHigherFactorial ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	assert.ok(
		storage().retainedBytes - admission.usage.newRetainedBytes - registration.initialStorage.retainedBytes <=
			allocatedBytes,
	);
	const usage = campaignUsage(registration);
	console.log(
		JSON.stringify({
			run: run.path,
			seal,
			failure: failure?.message ?? null,
			decision: result?.runHigherFactorial,
			gates: result?.gates,
			retainedBytes: storage().retainedBytes,
			retainedC5: usage.retainedBytesByPhase.C5,
		}),
	);
	if (failure) throw failure;
}

await main();
