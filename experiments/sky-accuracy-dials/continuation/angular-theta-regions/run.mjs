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
	readRepository,
	sha256,
	verifyRun,
	outputRelative,
	resolveRepository,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {accountInvalidEvidence} from '../invalid-evidence.mjs';
import {acceptedMechanismInput} from '../mechanisms/registration.mjs';
import {resourceExtensionSources} from '../resource-extension/read.mjs';
import {
	readThetaRegions,
	thetaRegionsPlanPath,
	thetaRegionsPackageId,
	thetaRegionsCaseId,
	thetaRegionsParentSeals,
} from './read.mjs';
import {evaluateThetaRegions, thetaRegionsProof, thetaRegionsReport} from './index.mjs';

/** @param {DialContinuationToolIdentity} expected @returns {Promise<void>} */
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

/** One registered immutable diagnostic, including any failed attempt. Known
 * invalid historical evidence is accounted by its exact existing exception.
 * @param {DialContinuationRegistrationRead} registration @returns {void}
 */
function requireUnexecuted(registration) {
	const start = Number(registration.run.split('/').at(-1).slice(0, 5));
	for (const name of readdirSync(resolveRepository(outputRelative + '/runs')).sort()) {
		if (Number(name.slice(0, 5)) <= start) continue;
		const run = outputRelative + '/runs/' + name,
			excluded = accountInvalidEvidence(run, registration.run);
		const seal = excluded?.seal ?? verifyRun(run);
		const terminal = /** @type {SkyThetaRegionsTerminal} */ (
			JSON.parse(readRepository(seal.path, seal).toString())
		);
		assert.ok(
			terminal.recipe.parameters.caseId !== thetaRegionsCaseId &&
				terminal.recipe.parameters.packageId !== thetaRegionsPackageId,
			'The single registered regional record already exists, including a failed attempt.',
		);
	}
}

/** No atmospheric solver or worker is invoked; scientific failure remains a
 * valid diagnostic. Authentication/execution failures seal a failed record with
 * an unresolved conclusion, never an approximate substitute reference.
 * @param {string} registrationRun @returns {Promise<SkyThetaRegionsRunResult>}
 */
export async function runThetaRegions(registrationRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun),
		allocatedBytes = 2 * 1024 ** 2;
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	assert.equal(admission.usage.allocationAmendment?.record.schemaId, 'sky-continuation-resource-extension-v1');
	await authenticateNode(registration.record.host.node);
	requireUnexecuted(registration);
	const original = acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00210-angular-lobes'),
		snapshot = resourceExtensionSources(original);
	const planBytes = readRepository(thetaRegionsPlanPath),
		plan = identity(thetaRegionsPlanPath, planBytes);
	/** @type {SkyThetaRegionsRead|null} */ let input = null;
	/** @type {Error|null} */ let failure = null;
	try {
		input = readThetaRegions(registration);
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const parents = [
		...new Map(
			[
				registration.seal,
				registration.record.inputs,
				plan,
				original.seal,
				...thetaRegionsParentSeals,
				snapshot.baseSnapshot,
				...(input?.identities ?? []),
				...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
				...(admission.usage.invalidEvidence ?? []).map((r) => r.seal),
			].map((id) => [id.path, id]),
		).values(),
	];
	const packed = Buffer.from(
		JSON.stringify(snapshot.delta.map((id) => ({...id, base64: readRepository(id.path, id).toString('base64')}))),
	);
	const compressed = gzipSync(packed, {level: 9}),
		maximumJobMilliseconds = Math.min(300000, admission.timeoutMilliseconds);
	const retainedInput = input
		? {
				target: input.input.target,
				channels: [0, 8],
				pilot: {
					candidate: input.pilot.candidate,
					expectedCount: input.pilot.expectedCount,
					nodeBatches: input.pilot.nodeBatches,
				},
				fine: {
					candidate: input.fine.candidate,
					expectedCount: input.fine.expectedCount,
					nodeBatches: input.fine.nodeBatches,
				},
				assessment: input.assessment,
				analyticReplay: input.input.analyticReplay,
				identities: input.identities,
			}
		: {compatibility: 'unresolved', failure: failure?.message};
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Partition only the original accepted theta pilot/fine saved incident nodes into the frozen Sun/horizon/other weights, replay each physical component and assess the two preregistered atmospheric response predicates; no new incident integration.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			packageId: thetaRegionsPackageId,
			extensionStage: thetaRegionsCaseId,
			caseId: thetaRegionsCaseId,
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			allocatedBytes,
			admission,
			sourceIdentities: snapshot.sources,
			sourceSnapshotBase: snapshot.baseSnapshot,
			node: registration.record.host.node,
			maximumJobMilliseconds,
			finalizationReserveMilliseconds: 30000,
			incidentIntegrationsExecuted: 0,
			workerCount: 0,
			atmosphericRadianceReference: false,
			gpuArithmeticParity: false,
			measurementInputs: false,
		},
	};
	// Estimate source/derivation metadata plus a conservative final seal reserve
	// before allocating the one record; actual writes enforce the same cap.
	const forecastBytes =
		Buffer.byteLength(JSON.stringify(recipe)) +
		2 * Buffer.byteLength(JSON.stringify(snapshot.sources)) +
		compressed.length +
		planBytes.length +
		Buffer.byteLength(JSON.stringify(retainedInput)) +
		256 * 1024 +
		768 * 1024;
	assert.ok(forecastBytes < allocatedBytes, 'Source delta and complete metadata must fit the registered 2 MiB cap.');
	const run = createRun('at-regions', recipe),
		definition = identity(run.path + '/definition.json');
	let written = definition.byteLength;
	/** @type {SkyThetaRegionsResult|null} */ let result = null;
	/** @param {string} name @param {unknown} content @param {DialDerivation} [derivation] @param {boolean} [terminal] @returns {DialFileIdentity} */
	function write(
		name,
		content,
		derivation = {
			parents: [definition],
			operation: 'Derive ' + name + ' from the registered saved-node regional attribution.',
		},
		terminal = false,
	) {
		assert.ok(Date.now() - started < maximumJobMilliseconds - (terminal ? 0 : 30000));
		run.guard();
		const bytes = Buffer.isBuffer(content) ? content : Buffer.from(JSON.stringify(content) + '\n');
		assert.ok(written + bytes.length < allocatedBytes - 768 * 1024);
		const id = run.write(name, bytes, derivation);
		written += id.byteLength;
		return id;
	}
	try {
		run.progress(
			thetaRegionsCaseId,
			'Retaining authenticated source delta, accepted theta batches and the frozen regional comparison.',
		);
		write('angular-theta-regions-plan.md', planBytes, {
			parents: [plan],
			operation:
				'Retain the exact prospective partition, two atmospheric predicates and single-record resource boundary.',
		});
		write('sources-delta.json.gz', compressed, {
			parents: [snapshot.baseSnapshot, ...snapshot.delta],
			operation:
				'Inherit the exact 00210 source snapshot and encode every changed/new current source as base64 JSON gzip level9; unchanged current identities are individually verified.',
			parameters: {
				schemaId: 'sky-source-base64-delta-v1',
				baseSnapshot: snapshot.baseSnapshot,
				uncompressedByteLength: packed.length,
				uncompressedSha256: sha256(packed),
				currentSourceIdentities: snapshot.sources,
			},
		});
		write('inputs.json', retainedInput, {
			parents: input ? [...input.identities] : parents,
			operation:
				'Retain exact morning geometry, original admitted theta candidates and batch pointers, prior assessment identity and full source/model parents. Incident arrays remain only in their immutable parent runs.',
		});
		write('proof.json', thetaRegionsProof());
		if (failure) throw failure;
		assert.ok(input);
		run.progress(
			thetaRegionsCaseId,
			'Replaying the original saved quadrature and evaluating the fixed regional partition.',
		);
		result = evaluateThetaRegions(input.input, input.pilot, input.pilotNodes, input.fine, input.fineNodes);
		write('assessment.json', result, {
			parents: [definition, ...input.identities],
			operation:
				'Apply the frozen partition separately to both physical mirror directions with unchanged incident, quadrature and phase values; retain all regional components, signed fine-minus-pilot responses, replay and reconstruction checks and the two fixed predicates with explicit allowances.',
		});
		write('report.md', Buffer.from(thetaRegionsReport(result)));
		for (const id of [...parents, ...snapshot.sources]) readRepository(id.path, id);
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
				conclusion: failure ? 'unresolved' : 'retained-predicates',
				physicalIntegrationsExecuted: 0,
				gpuJobsExecuted: 0,
				parentsReauthenticated: failure === null,
				sourcesReauthenticated: failure === null,
				forecastBytes,
				allocatedBytes,
				cleanup,
				failure: failure?.message ?? null,
			},
			undefined,
			true,
		);
	} catch (error) {
		failure = new Error((failure ? failure.message + '; ' : '') + String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		packageId: thetaRegionsPackageId,
		extensionId: 'compensation-attribution-v1',
		extensionStage: thetaRegionsCaseId,
		caseId: thetaRegionsCaseId,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		physicalIntegrationsExecuted: 0,
		gpuJobsExecuted: 0,
		conclusion: failure ? 'unresolved' : 'retained-predicates',
		predicateCount: result?.predicates.length ?? 0,
		passedPredicates: result?.predicates.filter((s) => s === 'passed').length ?? 0,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = /** @type {SkyMechanismTerminal} */ (JSON.parse(readRepository(seal.path, seal).toString()));
	assert.ok(seal.byteLength + terminal.artifacts.reduce((s, a) => s + a.byteLength, 0) <= allocatedBytes);
	if (failure) throw new Error('Angular theta regional diagnostic failed in ' + run.path + ': ' + failure.message);
	return {run: run.path, seal};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 3);
	console.log(JSON.stringify(await runThetaRegions(process.argv[2])));
}
