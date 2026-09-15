import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {loadInputs} from '../../execution.mjs';
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
import {volumeJ2Targets} from '../volume-j2/angular.mjs';
import {evaluateAngularLobes, angularLobesProof, angularLobesReport} from './index.mjs';

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

/** @param {DialContinuationRegistrationRead} registration
 * @returns {{spec:SkyTransportSpec,targets:SkyVolumeJ2Target[],identities:DialFileIdentity[]}}
 */
function readAngularLobes(registration) {
	const parent = acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00207-angular-regions');
	const params =
		/** @type {{caseId:string,continuationRegistration:string,sourceIdentities:readonly DialFileIdentity[]}} */ (
			/** @type {unknown} */ (parent.terminal.recipe.parameters)
		);
	assert.equal(params.caseId, 'angular-regions');
	assert.equal(params.continuationRegistration, registration.run);
	const ids = [
		'/numerics/direct.js',
		'/numerics/math.js',
		'/volume-j2/angular.mjs',
		'/j2/angular.mjs',
		'/execution.mjs',
		'/inputs.mjs',
	].map((suffix) => {
		const id = params.sourceIdentities.find((s) => s.path.endsWith(suffix));
		assert.ok(id);
		readRepository(id.path, id);
		return id;
	});
	const inputId = mechanismArtifact(parent, 'inputs.json');
	const prior = /** @type {{spec:SkyTransportSpec}} */ (JSON.parse(readRepository(inputId.path, inputId).toString()));
	readRepository(registration.record.inputs.path, registration.record.inputs);
	const spec = loadInputs().native48.transportSpec;
	assert.deepEqual(spec, prior.spec);
	assert.equal(spec.atmosphere.miePhaseFunctionG, 0.7);
	const targets = volumeJ2Targets(registration, spec).filter((t) => t.heightMeters === 1000);
	assert.equal(targets.length, 2);
	return {
		spec,
		targets,
		identities: [
			parent.seal,
			inputId,
			mechanismArtifact(parent, 'sources.json.gz'),
			registration.record.inputs,
			...ids,
		],
	};
}

/** One bounded comparison against a manufactured angular integral; no atmospheric incident solve.
 * @param {string} registrationRun @returns {Promise<{run:string,seal:DialFileIdentity}>}
 */
export async function runAngularLobes(registrationRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun),
		allocatedBytes = 3 * 1024 ** 2;
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const input = readAngularLobes(registration),
		sources = sourceIdentities();
	const planPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/angular-lobes-plan.md';
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes);
	assert.ok(planBytes.toString().includes('compensation-attribution-v1'));
	const parents = [
		...new Map(
			[
				registration.seal,
				registration.record.inputs,
				plan,
				...input.identities,
				...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
				...(admission.usage.invalidEvidence ?? []).map((r) => r.seal),
			].map((id) => [id.path, id]),
		).values(),
	];
	const maximumJobMilliseconds = Math.min(300000, admission.timeoutMilliseconds),
		caseId = 'angular-lobes';
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Evaluate quadrature of two declared Cornette-Shanks phase lobes against an independently represented Legendre convolution; compare fixed counts and coordinates without atmospheric path or ground structure.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: caseId,
			caseId,
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			admission,
			sourceIdentities: sources,
			node: registration.record.host.node,
			maximumJobMilliseconds,
			finalizationReserveMilliseconds: 30000,
			targets: input.targets,
			physicalPhaseParameter: input.spec.atmosphere.miePhaseFunctionG,
			legendreDegree: 128,
			referenceRule: [64, 256],
			atmosphericRadianceReference: false,
			gpuArithmeticParity: false,
			measurementInputs: false,
		},
	};
	const run = createRun('angular-lobes', recipe),
		definition = identity(run.path + '/definition.json');
	let written = definition.byteLength;
	/** @type {Error|null} */ let failure = null;
	/** @type {ReturnType<typeof evaluateAngularLobes>|null} */ let result = null;
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @param {boolean} [terminal] @returns {DialFileIdentity} */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: 'Derive ' + name + ' from the frozen manufactured angular integral and authenticated inputs.',
		},
		terminal = false,
	) {
		assert.ok(Date.now() - started < maximumJobMilliseconds - (terminal ? 0 : 30000));
		run.guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value) + '\n');
		assert.ok(written + bytes.length < allocatedBytes - 768 * 1024);
		const id = run.write(name, bytes, derivation);
		written += id.byteLength;
		return id;
	}
	try {
		run.progress(
			caseId,
			'Phase parameters and frozen geometry authenticated; evaluating the registered manufactured integral.',
		);
		write('angular-lobes-plan.md', planBytes, {
			parents: [plan],
			operation:
				'Retain the exact prospective hypotheses, analytic derivation, uncertainty criteria and stopping conditions.',
		});
		const packed = Buffer.from(
			JSON.stringify(sources.map((id) => ({...id, base64: readRepository(id.path, id).toString('base64')}))),
		);
		write('sources.json.gz', gzipSync(packed, {level: 9}), {
			parents: sources,
			operation: 'Encode exact implementation bytes as base64 JSON and gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: packed.length,
				uncompressedSha256: sha256(packed),
			},
		});
		write(
			'inputs.json',
			{spec: input.spec, targets: input.targets, identities: input.identities},
			{
				parents: input.identities,
				operation:
					'Retain unchanged phase parameters, physical directions and their provenance; no atmospheric incident radiance is consumed.',
			},
		);
		write('proof.json', angularLobesProof());
		result = evaluateAngularLobes(input.spec, input.targets);
		write('assessment.json', result, {
			parents: [definition, ...input.identities],
			operation:
				'Compare the original split rules and equal-cost radial/Sun product rules against the admitted Legendre-convolution reference; retain all frozen predicates and reference/arithmetic allowances.',
		});
		write('report.md', Buffer.from(angularLobesReport(result)));
		for (const id of [...parents, ...sources]) readRepository(id.path, id);
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
				physicalIntegrationsExecuted: 0,
				gpuJobsExecuted: 0,
				parentsReauthenticated: failure === null,
				sourcesReauthenticated: failure === null,
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
		extensionStage: caseId,
		caseId,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		physicalIntegrationsExecuted: 0,
		gpuJobsExecuted: 0,
		predicateCount: result?.predicates.length ?? 0,
		passedPredicates: result?.predicates.filter((s) => s === 'passed').length ?? 0,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = /** @type {SkyMechanismTerminal} */ (JSON.parse(readRepository(seal.path, seal).toString()));
	assert.ok(seal.byteLength + terminal.artifacts.reduce((sum, a) => sum + a.byteLength, 0) <= allocatedBytes);
	if (failure) throw new Error('Angular lobes failed in ' + run.path + ': ' + failure.message);
	return {run: run.path, seal};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 3);
	console.log(JSON.stringify(await runAngularLobes(process.argv[2])));
}
