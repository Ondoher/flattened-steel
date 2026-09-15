import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream, readdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {
	checkedAbsolute,
	createRun,
	identity,
	outputRelative,
	readRepository,
	resolveRepository,
	sha256,
	sourceIdentities,
	verifyRun,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {accountInvalidEvidence} from '../invalid-evidence.mjs';
import {readSecondOrderDialCaptures} from '../second-order-analysis/captures.mjs';
import {predictAltitudeConvergence} from './index.mjs';
import {altitudeConvergenceProof} from './proof.mjs';

const planPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/altitude-convergence-plan.md';
const allocatedBytes = 3 * 1024 ** 2,
	terminalReserve = 768 * 1024;

/** Authenticate the pinned original runtime without shell or path substitution.
 * @param {DialContinuationToolIdentity} expected @returns {Promise<void>}
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

/** Read only original H/P55 envelopes, preserving complete authenticated controls.
 * @param {DialContinuationRegistrationRead} registration
 * @returns {{identities:DialFileIdentity[],input:SkyAltitudePredictionInput}}
 */
export function readOriginalAltitudePrediction(registration) {
	const captures = readSecondOrderDialCaptures(registration, ['p-0930-5-7', 'p-1230-3-5'], [0, 8]);
	const h = captures.find((row) => row.selection.caseId === 'r0'),
		p = captures.find((row) => row.selection.caseId === 'd55-raw');
	assert.ok(h && p);
	/** @type {SkyAltitudeGroup[]} */ const groups = [];
	for (const probeId of /** @type {const} */ (['p-0930-5-7', 'p-1230-3-5']))
		for (const channel of /** @type {const} */ ([0, 8])) {
			const first = h.rows.find((row) => row.probeId === probeId && row.channel === channel),
				eighth = p.rows.find((row) => row.probeId === probeId && row.channel === channel);
			assert.ok(first && eighth);
			assert.ok(first.allowanceWatts !== null && eighth.allowanceWatts !== null);
			groups.push({
				probeId,
				channel,
				f1: {value: first.secondOrderWatts, allowance: first.allowanceWatts},
				f8: {value: eighth.secondOrderWatts, allowance: eighth.allowanceWatts},
			});
		}
	return {identities: [...h.identities, ...p.identities], input: {stage: 'p51', groups}};
}

/** Seal the first altitude-count forecast before any matched target attempt.
 * Target output is never read. Existing unmatched historical altitude runs are
 * comparisons only; the newly declared target identity is altitude-p51.
 * @param {string} registrationRun @returns {Promise<{run:string,seal:DialFileIdentity}>}
 */
export async function runOriginalAltitudePrediction(registrationRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	for (const name of readdirSync(resolveRepository(`${outputRelative}/runs`))) {
		if (Number(name.slice(0, 5)) <= Number(path.posix.basename(registration.run).slice(0, 5))) continue;
		const candidateRun = `${outputRelative}/runs/${name}`,
			excluded = accountInvalidEvidence(candidateRun, registration.run),
			seal = excluded?.seal ?? verifyRun(candidateRun),
			terminal = JSON.parse(readRepository(seal.path, seal).toString());
		assert.notEqual(
			terminal.recipe.parameters.caseId,
			'altitude-p51',
			'The P51 forecast must precede every matched target attempt.',
		);
	}
	const input = readOriginalAltitudePrediction(registration),
		prediction = predictAltitudeConvergence(input.input);
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes);
	assert.ok(
		planBytes.toString().includes('compensation-attribution-v1') &&
			planBytes.toString().includes('F(4) = F(8) + (F(1)-F(8))/21'),
	);
	const sources = sourceIdentities();
	const parents = [
		...new Map(
			[
				registration.seal,
				registration.record.inputs,
				plan,
				...input.identities,
				...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
				...(admission.usage.invalidEvidence ?? []).map((row) => row.seal),
			].map((row) => [row.path, row]),
		).values(),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Authenticate original H/P55 P2 envelopes and seal the preregistered smooth interpolation prediction for the unexecuted matched P51 target, retaining signed responses separately from known absolute radiance.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: 'altitude-p51-predict',
			caseId: 'altitude-p51-predict',
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			admission,
			sourceIdentities: sources,
			node: registration.record.host.node,
			forecastPlan: plan,
			targetCaseId: 'altitude-p51',
			targetAlreadyExecuted: false,
			maximumJobMilliseconds: Math.min(300000, admission.timeoutMilliseconds),
			finalizationReserveMilliseconds: 30000,
			physicalReferenceAdequate: false,
		},
	};
	const run = createRun('alt-p51-predict', recipe),
		definition = identity(`${run.path}/definition.json`);
	let written = definition.byteLength,
		failure = /** @type {Error|null} */ (null);
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @returns {DialFileIdentity} */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} from exact original parent envelopes and the frozen altitude-count model.`,
		},
	) {
		assert.ok(Date.now() - started < Math.min(300000, admission.timeoutMilliseconds) - 30000);
		run.guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(written + bytes.length < allocatedBytes - terminalReserve);
		const id = run.write(name, bytes, derivation);
		written += id.byteLength;
		return id;
	}
	try {
		run.progress('prediction', 'Freezing the original P48/P55 response forecast before matched P51 execution.');
		write('altitude-convergence-plan.md', planBytes, {
			parents: [plan],
			operation: 'Retain exact prospective altitude convergence criteria.',
		});
		const bytes = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		);
		write('sources.json.gz', gzipSync(bytes, {level: 9}), {
			parents: sources,
			operation: 'Encode exact source bytes as base64 JSON and gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: bytes.length,
				uncompressedSha256: sha256(bytes),
			},
		});
		write('proof.json', altitudeConvergenceProof());
		write(
			'prediction.json',
			{
				schemaId: 'sky-altitude-held-prediction-v1',
				registration: registration.seal,
				forecastPlan: plan,
				targetCaseId: 'altitude-p51',
				targetAlreadyExecuted: false,
				prediction,
			},
			{
				parents: [definition, ...input.identities],
				operation:
					'Evaluate F4=F8+(F1-F8)/21 and its signed response using admitted original P48/P55 envelopes; propagate exact linear-coefficient numerical allowances separately from arithmetic roundoff.',
			},
		);
		for (const id of [...parents, ...sources]) readRepository(id.path, id);
		await authenticateNode(registration.record.host.node);
		write('execution.json', {
			completed: true,
			gpuJobsExecuted: 0,
			targetsRead: false,
			parentsReauthenticated: true,
			sourcesReauthenticated: true,
		});
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId: 'compensation-attribution-v1',
		extensionStage: 'altitude-p51-predict',
		caseId: 'altitude-p51-predict',
		groups: prediction.rows.length,
		targetCaseId: 'altitude-p51',
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		gpuJobsExecuted: 0,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.ok(seal.byteLength + terminal.artifacts.reduce((sum, row) => sum + row.byteLength, 0) <= allocatedBytes);
	if (failure) throw new Error(`Altitude prediction failed in ${run.path}: ${failure.message}`);
	return {run: run.path, seal};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 3);
	console.log(JSON.stringify(await runOriginalAltitudePrediction(process.argv[2])));
}
