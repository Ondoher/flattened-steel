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
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {resourceExtensionSources} from '../resource-extension/read.mjs';
import {readAngularEndpoint, angularEndpointOriginalRun, angularEndpointPlanPath} from './read.mjs';
import {evaluateAngularEndpointControl, angularEndpointProof, angularEndpointReport} from './index.mjs';

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
		const terminal = /** @type {SkyMechanismTerminal} */ (JSON.parse(readRepository(seal.path, seal).toString()));
		assert.notEqual(
			terminal.recipe.parameters.caseId,
			'angular-endpoint-control',
			'The single registered control record already exists.',
		);
	}
}

/** No atmospheric solver or worker is invoked; scientific failure remains a
 * valid diagnostic. Authentication/execution failures seal a failed record with
 * an unresolved conclusion, never an approximate substitute reference.
 * @param {string} registrationRun @returns {Promise<{run:string,seal:DialFileIdentity}>}
 */
export async function runAngularEndpointControl(registrationRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun),
		allocatedBytes = 2 * 1024 ** 2;
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	assert.equal(admission.usage.allocationAmendment?.record.schemaId, 'sky-continuation-resource-extension-v1');
	await authenticateNode(registration.record.host.node);
	requireUnexecuted(registration);
	const original = acceptedMechanismInput(angularEndpointOriginalRun),
		snapshot = resourceExtensionSources(original);
	const planBytes = readRepository(angularEndpointPlanPath),
		plan = identity(angularEndpointPlanPath, planBytes);
	/** @type {SkyAngularEndpointInput|null} */ let input = null;
	/** @type {Error|null} */ let failure = null;
	try {
		input = readAngularEndpoint(registration);
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
				mechanismArtifact(original, 'inputs.json'),
				mechanismArtifact(original, 'assessment.json'),
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
				target: input.target,
				original: input.original,
				replay: input.replay,
				phaseParameter: input.spec.atmosphere.miePhaseFunctionG,
				bottomRadiusMeters: input.spec.planet.bottomRadiusMeters,
				identities: input.identities,
				specSource: mechanismArtifact(original, 'inputs.json'),
			}
		: {compatibility: 'unresolved', failure: failure?.message};
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Evaluate eight frozen analytic angular controls, separating a zero-integral azimuth component and Cartesian polynomial, predicting a held count from the endpoint error law, and comparing a matched theta coordinate; no atmospheric integration.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: 'angular-endpoint-control',
			caseId: 'angular-endpoint-control',
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
	const run = createRun('af-endpoint', recipe),
		definition = identity(run.path + '/definition.json');
	let written = definition.byteLength;
	/** @type {SkyAngularEndpointResult|null} */ let result = null;
	/** @param {string} name @param {unknown} content @param {DialDerivation} [derivation] @param {boolean} [terminal] @returns {DialFileIdentity} */
	function write(
		name,
		content,
		derivation = {
			parents: [definition],
			operation: 'Derive ' + name + ' from the registered isolated angular control.',
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
			'angular-endpoint-control',
			'Retaining authenticated source delta and the frozen isolated phase-field comparison.',
		);
		write('angular-endpoint-plan.md', planBytes, {
			parents: [plan],
			operation: 'Retain the exact prospective controls, gates and resource boundary.',
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
				'Retain exact morning geometry, admitted analytic convolution, 00218 replay rows and source identities; the unchanged full specification remains in the immutable 00210 inputs artifact.',
		});
		write('proof.json', angularEndpointProof());
		if (failure) throw failure;
		assert.ok(input);
		result = evaluateAngularEndpointControl(input, input.replay);
		write('assessment.json', result, {
			parents: [definition, ...input.identities],
			operation:
				'Evaluate unchanged mu geometry and independently checked theta boundaries/Jacobian; retain F, even/odd decomposition, exact-zero polynomial, replays, fixed formula forecast formed before held64, and every frozen gate with propagated allowances.',
		});
		write('report.md', Buffer.from(angularEndpointReport(result)));
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
		extensionId: 'compensation-attribution-v1',
		extensionStage: 'angular-endpoint-control',
		caseId: 'angular-endpoint-control',
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
	if (failure) throw new Error('Angular endpoint control failed in ' + run.path + ': ' + failure.message);
	return {run: run.path, seal};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 3);
	console.log(JSON.stringify(await runAngularEndpointControl(process.argv[2])));
}
