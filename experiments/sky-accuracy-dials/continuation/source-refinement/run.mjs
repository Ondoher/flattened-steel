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
import {readSourceRefinement} from './read.mjs';
import {
	predictSourceRefinement,
	executeSourceRefinement,
	sourceRefinementProof,
	sourceRefinementReport,
} from './index.mjs';

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

/** Two separate immutable records keep the atmospheric S320 evaluation behind
 * a previously sealed, authenticated forecast from the unchanged implementation.
 * @param {'predict'|'target'} mode @param {string} registrationRun @param {string} parentRun
 * @returns {Promise<{run:string,seal:DialFileIdentity}>}
 */
export async function runSourceRefinement(mode, registrationRun, parentRun) {
	assert.ok(mode === 'predict' || mode === 'target');
	const started = Date.now(),
		registration = readRegistration(registrationRun),
		allocatedBytes = 3 * 1024 ** 2;
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const sources = sourceIdentities();
	const planPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/source-refinement-plan.md';
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes);
	assert.ok(planBytes.toString().includes('compensation-attribution-v1'));
	let gridRun = parentRun;
	/** @type {SkySourceRefinementForecast|null} */ let forecast = null;
	/** @type {DialFileIdentity[]} */ const forecastParents = [];
	if (mode === 'target') {
		const parent = acceptedMechanismInput(parentRun);
		const params =
			/** @type {{caseId:string,continuationRegistration:string,gridRun:string,sourceIdentities:readonly DialFileIdentity[],jobKind:string,phase:string}} */ (
				/** @type {unknown} */ (parent.terminal.recipe.parameters)
			);
		assert.equal(params.caseId, 'source-refinement-predict');
		assert.equal(params.continuationRegistration, registration.run);
		assert.equal(params.jobKind, 'cpu');
		assert.equal(params.phase, 'C5');
		assert.deepEqual(params.sourceIdentities, sources, 'Forecast implementation changed before target execution.');
		assert.ok(
			parent.terminal.recipe.parents.some(
				(id) => id.path === plan.path && id.sha256 === plan.sha256 && id.byteLength === plan.byteLength,
			),
		);
		gridRun = params.gridRun;
		const forecastId = mechanismArtifact(parent, 'forecast.json');
		forecast = /** @type {SkySourceRefinementForecast} */ (
			JSON.parse(readRepository(forecastId.path, forecastId).toString())
		);
		forecastParents.push(parent.seal, forecastId, mechanismArtifact(parent, 'sources.json.gz'));
	}
	const input = readSourceRefinement(registration, gridRun);
	const parents = [
		...new Map(
			[
				registration.seal,
				registration.record.inputs,
				plan,
				...input.identities,
				...forecastParents,
				...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
				...(admission.usage.invalidEvidence ?? []).map((r) => r.seal),
			].map((id) => [id.path, id]),
		).values(),
	];
	const maximumJobMilliseconds = Math.min(300000, admission.timeoutMilliseconds);
	const caseId = 'source-refinement-' + mode;
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			mode === 'predict'
				? 'Replay the corrected original-grid field; forecast S160-to-S320 from known endpoint derivatives before evaluating the atmospheric target.'
				: 'Authenticate the previously sealed forecast, replay S160, evaluate the held S320 columns and retain every registered component-error prediction outcome.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: caseId,
			caseId,
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			admission,
			gridRun,
			forecastRun: mode === 'target' ? parentRun : null,
			sourceIdentities: sources,
			node: registration.record.host.node,
			baselineIntervals: 160,
			targetIntervals: 320,
			maximumJobMilliseconds,
			finalizationReserveMilliseconds: 30000,
			maximumSpeciesDensityEvaluations: 16000,
			gpuArithmeticParity: false,
			fullViewAccuracy: false,
			measurementInputs: false,
		},
	};
	const run = createRun(mode === 'predict' ? 's320-predict' : 's320-target', recipe);
	const definition = identity(run.path + '/definition.json');
	let written = definition.byteLength;
	/** @type {Error|null} */ let failure = null;
	/** @type {SkySourceRefinementTarget|null} */ let result = null;
	let atmosphericTargetStarted = false;
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @param {boolean} [terminal] @returns {DialFileIdentity} */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: 'Derive ' + name + ' from the authenticated inputs and registered source-refinement equations.',
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
		run.progress(caseId, 'Authenticated retained source columns and original-grid baseline.');
		write('source-refinement-plan.md', planBytes, {
			parents: [plan],
			operation: 'Retain the unchanged prospective predictions and stopping conditions.',
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
			{gridRun, predictionRun: input.predictionRun, targetRun: input.targetRun, identities: input.identities},
			{
				parents: [...input.identities],
				operation:
					'Retain identities of the original coordinates, physical inputs, finite columns and independently admitted references without duplicating their records.',
			},
		);
		write('proof.json', sourceRefinementProof());
		if (mode === 'predict') {
			forecast = predictSourceRefinement(input);
			write('forecast.json', forecast, {
				parents: [definition, ...input.identities],
				operation:
					'Propagate C160 plus the analytic endpoint-derivative increment through the exactly replayed corrected reconstruction; no atmospheric S320 evaluations.',
			});
		} else {
			assert.ok(forecast);
			run.progress(caseId, 'Sealed prediction authenticated; evaluating the held 320-sample columns.');
			atmosphericTargetStarted = true;
			result = executeSourceRefinement(input, forecast);
			assert.ok(result.work.speciesDensityEvaluations <= 16000);
			write('assessment.json', result, {
				parents: [definition, ...input.identities, ...forecastParents],
				operation:
					'Compare the newly integrated S320 field with the existing independent continuous-query reference and the sealed forecast; retain all group and local failed/unresolved outcomes.',
			});
			write('report.md', Buffer.from(sourceRefinementReport(result)));
		}
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
				gpuJobsExecuted: 0,
				adaptiveReferenceSolves: 0,
				atmosphericTargetStarted,
				atmosphericTargetCompleted: result !== null,
				work: result?.work ?? null,
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
		gpuJobsExecuted: 0,
		adaptiveReferenceSolves: 0,
		atmosphericTargetStarted,
		atmosphericTargetCompleted: result !== null,
		work: result?.work ?? null,
		predicateCount: result?.predicates.length ?? 0,
		passedPredicates: result?.predicates.filter((s) => s === 'passed').length ?? 0,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = /** @type {SkyMechanismTerminal} */ (JSON.parse(readRepository(seal.path, seal).toString()));
	assert.ok(seal.byteLength + terminal.artifacts.reduce((sum, a) => sum + a.byteLength, 0) <= allocatedBytes);
	if (failure) throw new Error('Source refinement failed in ' + run.path + ': ' + failure.message);
	return {run: run.path, seal};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 5);
	assert.ok(process.argv[2] === 'predict' || process.argv[2] === 'target');
	console.log(JSON.stringify(await runSourceRefinement(process.argv[2], process.argv[3], process.argv[4])));
}
