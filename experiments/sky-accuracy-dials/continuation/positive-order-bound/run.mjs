import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {
	checkedAbsolute,
	createRun,
	identity,
	readRepository,
	sha256,
	sourceIdentities,
	verifyRun,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {readSecondOrderOriginal} from '../second-order-analysis/index.mjs';
import {positiveOrderBound, positiveOrderBoundProof} from './index.mjs';

const planPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/positive-order-bound-plan.md';
const allocatedBytes = 3 * 1024 ** 2,
	reserve = 768 * 1024;

/** Authenticate exact original runtime rather than accepting a matching version alone.
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

/** Authenticate a complete admitted P2 reference and the original physical P1 residual.
 * @param {DialContinuationRegistrationRead} registration @param {string} referenceRun
 * @returns {SkyPositiveOrderBoundParent}
 */
export function readPositiveOrderBound(registration, referenceRun) {
	const parent = acceptedMechanismInput(referenceRun);
	const parameters =
		/** @type {{continuationRegistration:string,caseId:string,numericalSources:readonly DialFileIdentity[],condition?:SkySecondOrderCondition}} */
		(/** @type {unknown} */ (parent.terminal.recipe.parameters));
	assert.equal(parameters.continuationRegistration, registration.run);
	assert.equal(parameters.caseId, 'second-order-angular-assessment');
	assert.equal(
		/** @type {SkySecondOrderTransferTerminal} */ (/** @type {unknown} */ (parent.terminal)).result
			.referenceAdequate,
		true,
	);
	assert.equal(parameters.numericalSources.length, 22);
	for (const source of parameters.numericalSources) readRepository(source.path, source);
	const probeId = parameters.condition?.probeId ?? 'p-0930-5-7';
	assert.ok(['p-0930-5-7', 'p-1230-3-5'].includes(probeId));
	if (probeId === 'p-1230-3-5') assert.ok(parameters.condition?.transferPlan);
	const artifact = mechanismArtifact(parent, 'reference-assessment.json');
	const reference = /** @type {SkySecondOrderTransferAdmissionDocument} */ (
		JSON.parse(readRepository(artifact.path, artifact).toString())
	);
	assert.equal(reference.schemaId, 'sky-second-order-reference-assessment-v1');
	assert.equal(reference.outerChecks.length, 12);
	assert.equal(reference.angularChecks.length, 10);
	assert.ok([...reference.outerChecks, ...reference.angularChecks].every((row) => row.state === 'passed'));
	assert.deepEqual(
		reference.channels.map((row) => row.channel),
		[0, 8],
	);
	const original = readSecondOrderOriginal(registration);
	const rows = reference.channels.map((channel) => {
		assert.ok(
			channel.adequate &&
				channel.state === 'passed' &&
				channel.outerAdmissionsComplete &&
				channel.angularAdmissionsComplete,
		);
		assert.ok(channel.referenceWatts !== null && channel.referenceWatts > 0);
		assert.ok(
			channel.allowanceWatts !== null &&
				channel.allowanceWatts >= 0 &&
				channel.allowanceWatts <= 5e-5 &&
				channel.allowanceWatts <= channel.relativeThresholdWatts,
		);
		const matches = original.rows.filter((row) => row.probeId === probeId && row.channel === channel.channel);
		assert.equal(matches.length, 1);
		return positiveOrderBound(matches[0], channel);
	});
	return {
		probeId,
		identities: [parent.seal, artifact, ...parameters.numericalSources, ...original.identities],
		rows,
		reference,
	};
}

/** Seal retrospective positivity accounting; this does not rerun or qualify a physical reference.
 * @param {string} registrationRun @param {string} referenceRun
 * @returns {Promise<{run:string,seal:DialFileIdentity}>}
 */
export async function runPositiveOrderBound(registrationRun, referenceRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const input = readPositiveOrderBound(registration, referenceRun);
	const original = readSecondOrderOriginal(registration);
	const first = original.rows.find((row) => row.probeId === input.probeId && row.channel === 0);
	assert.ok(first);
	const proof = positiveOrderBoundProof(first, input.reference.channels[0]);
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes),
		sources = sourceIdentities();
	assert.ok(planBytes.toString().includes('retrospective diagnostic'));
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
			'Bound the remaining fixed-measurement residual by physical P1+P2-M under nonnegative later physical orders, using complete independently admitted component references and empirical allowances. Retrospective accounting only.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: 'positive-order-bound',
			caseId: 'positive-order-bound',
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			admission,
			sourceIdentities: sources,
			node: registration.record.host.node,
			referenceRun,
			probeId: input.probeId,
			maximumJobMilliseconds: Math.min(300000, admission.timeoutMilliseconds),
			finalizationReserveMilliseconds: 30000,
			nonnegativePhysicalLaterOrders: true,
			measurementUncertainty: 'unquantified',
			retrospective: true,
		},
	};
	const run = createRun('positive-bound', recipe),
		definition = identity(`${run.path}/definition.json`);
	let written = definition.byteLength,
		failure = /** @type {Error|null} */ (null);
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @param {boolean} [terminal] @returns {DialFileIdentity} */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation:
				'Derive ' +
				name +
				' from authenticated physical-order references and the recorded nonnegative-order bound.',
		},
		terminal = false,
	) {
		assert.ok(Date.now() - started < Math.min(300000, admission.timeoutMilliseconds) - (terminal ? 0 : 30000));
		run.guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value) + '\n');
		assert.ok(written + bytes.length < allocatedBytes - (terminal ? reserve / 2 : reserve));
		const id = run.write(name, bytes, derivation);
		written += id.byteLength;
		return id;
	}
	try {
		run.progress(
			'analysis',
			'Computing a retrospective residual lower bound from admitted first and second physical orders.',
		);
		write('positive-order-bound-plan.md', planBytes, {
			parents: [plan],
			operation: 'Retain the exact retrospective diagnostic scope and exclusions.',
		});
		const packed = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		);
		write('sources.json.gz', gzipSync(packed, {level: 9}), {
			parents: sources,
			operation: 'Encode exact source bytes as base64 JSON and gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: packed.length,
				uncompressedSha256: sha256(packed),
			},
		});
		write('proof.json', proof);
		write(
			'bounds.json',
			{
				schemaId: 'sky-positive-order-bound-v1',
				units: 'W m^-2 sr^-1 nm^-1',
				referenceRun,
				assumption:
					'All subsequent physical intensity orders are nonnegative in the declared fixed-medium scalar model.',
				measurementUncertainty:
					'Unquantified; the positive threshold states the shift needed to erase the numerical lower bound, not a measured sensor error.',
				referenceStatus:
					'Conditioned on the admitted empirical component error budgets; not a rigorous bound on shared model/reference bias.',
				rows: input.rows,
			},
			{
				parents: [definition, ...input.identities],
				operation:
					'For Q>=0 compute L1+L2+Q-M >= (L1-M)+L2-U1-U2-Uroundoff. Report squared lower residual only when positive; recover M=(cached L1-first numerical error)-(physical L1-M). Cached J3/J4 do not enter the bound.',
			},
		);
		const lines = [
			'# Nonnegative-order residual bound',
			'',
			'Retrospective component accounting. All values below are W m^-2 sr^-1 nm^-1.',
			'',
			'| Probe | Channel | P1+P2 minus measurement | Lower value including numerical allowances | Required upward measurement shift |',
			'| --- | ---: | ---: | ---: | ---: |',
			...input.rows.map(
				(row) =>
					`| ${row.probeId} | ${row.channel} | ${row.firstTwoResidualWatts} | ${row.lowerResidualWatts} | ${row.requiredUpwardMeasurementShiftFraction === null ? 'unresolved' : 100 * row.requiredUpwardMeasurementShiftFraction + '%'} |`,
			),
			'',
			'A positive lower value cannot be erased by correcting cached later orders to any nonnegative physical later-order solution under these reference allowances. This does not identify a physical parameter, prove measurement error, or supply a complete numerical oracle.',
			'',
			'Unknown measurement uncertainty and shared reference bias outside the admitted empirical budgets remain outside the bound. A nonpositive value gives no bound on the tail.',
			'',
		];
		write('report.md', Buffer.from(lines.join('\n')));
		for (const source of [...parents, ...sources]) readRepository(source.path, source);
		await authenticateNode(registration.record.host.node);
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const cleanup = run.cleanup();
	try {
		write(
			'execution.json',
			{
				completed: failure === null,
				gpuJobsExecuted: 0,
				physicalIntegrationsExecuted: 0,
				cleanup,
				parentsReauthenticated: failure === null,
				sourcesReauthenticated: failure === null,
				failure: failure?.message ?? null,
			},
			undefined,
			true,
		);
	} catch (error) {
		failure = new Error((failure ? failure.message + '; ' : '') + String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId: 'compensation-attribution-v1',
		extensionStage: 'positive-order-bound',
		caseId: 'positive-order-bound',
		probeId: input.probeId,
		positiveGroups: input.rows.filter((row) => row.state === 'positive-lower-bound').length,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		gpuJobsExecuted: 0,
		retrospective: true,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.ok(seal.byteLength + terminal.artifacts.reduce((sum, row) => sum + row.byteLength, 0) <= allocatedBytes);
	if (failure) throw new Error('Positive-order bound failed in ' + run.path + ': ' + failure.message);
	return {run: run.path, seal};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 4);
	console.log(JSON.stringify(await runPositiveOrderBound(process.argv[2], process.argv[3])));
}
