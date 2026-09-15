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
import {
	sourceAuditPolicy,
	sourceAuditGeometry,
	evaluateSourceAuditFinite,
	evaluateSourceAuditReference,
	admitSourceAuditReference,
	predictSourceAudit,
	assessSourceAudit,
	sourceAuditTau,
	sourceAuditGroups,
} from './index.mjs';
import {
	readSourceAuditInput,
	readSourceAuditPrediction,
	sourceAuditAttempts,
	sourceColumnPlanPath,
	sourceColumnTargetCase,
} from './read.mjs';
import {sourceColumnAuditProof} from './proof.mjs';

const allocatedBytes = 3 * 1024 ** 2,
	terminalReserve = 768 * 1024;
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
/** Separate CPU records enforce the held S160 boundary. No GPU is imported or used.
 * Omit predictionRun to seal the baseline/reference/derivative forecast; supply
 * its accepted identity to evaluate S160 and retain every assessment gate.
 * @param {string} registrationRun @param {string|null} [predictionRun]
 * @returns {Promise<{run:string,seal:DialFileIdentity}>}
 */
export async function runSourceColumnAudit(registrationRun, predictionRun = null) {
	const started = Date.now(),
		registration = readRegistration(registrationRun),
		admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const original = readSourceAuditInput(registration),
		input = original.input,
		attempts = sourceAuditAttempts(registration),
		target = predictionRun !== null;
	if (!target) assert.equal(attempts.length, 0, 'Prediction must be sealed before every target attempt.');
	else assert.ok(!attempts.some((attempt) => attempt.state === 'accepted'), 'An accepted target already exists.');
	const held = target ? readSourceAuditPrediction(registration, predictionRun, input) : null,
		planBytes = readRepository(sourceColumnPlanPath),
		plan = identity(sourceColumnPlanPath, planBytes);
	assert.ok(
		planBytes.toString().includes('compensation-attribution-v1') &&
			planBytes.toString().includes('source-column-s160'),
	);
	const compiler = identity('scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js'),
		sources = [...sourceIdentities(), compiler],
		parents = [
			...new Map(
				[
					registration.seal,
					registration.record.inputs,
					plan,
					compiler,
					...original.identities,
					...(held?.identities ?? []),
					...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
					...(admission.usage.invalidEvidence ?? []).map((row) => row.seal),
				].map((id) => [id.path, id]),
			).values(),
		],
		caseId = target ? sourceColumnTargetCase : 'source-column-predict',
		maximumJobMilliseconds = Math.min(300000, admission.timeoutMilliseconds),
		deadline = started + maximumJobMilliseconds - 30000;
	assert.ok(deadline > Date.now() + 1000);
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation: target
			? 'Evaluate held S160 at exact prospectively frozen source columns, then retain endpoint-derivative response, independent-reference bias, sign and rate gates without refitting.'
			: 'Freeze exact bottom-interval view16/source-knot coordinates, S80 composite trapezoid columns, independent adaptive Gauss/Simpson 4/1 references and analytic endpoint-derivative S160 forecasts; do not evaluate S160.',
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
			forecastPlan: plan,
			predictionRun,
			targetCaseId: sourceColumnTargetCase,
			targetAlreadyExecuted: target,
			maximumJobMilliseconds,
			finalizationReserveMilliseconds: 30000,
			policy: sourceAuditPolicy,
			channels: [0, 8],
			interpolationInteraction: 'deferred',
			gpuJobsExecuted: 0,
		},
	};
	const run = createRun(target ? 'src-column-s160' : 'src-column-pred', recipe),
		definition = identity(run.path + '/definition.json');
	let written = definition.byteLength,
		lastGuard = 0,
		failure = /** @type {Error|null} */ (null);
	const work = {mediumEvaluations: 0, columnCalls: 0, trapezoidEvaluations: 0};
	/** @type {SkySourceAuditPredictionRow[]} */ const rows = [];
	/** @type {{coordinateId:string,finite:SkySourceAuditFinite}[]} */ const targetRows = [];
	/** @type {SkySourceAuditAssessment[]} */ const assessments = [];
	/** @type {string|null} */ let activeCoordinate = null;
	/** @returns {void} */ function guard() {
		assert.ok(Date.now() < deadline, 'Source-column job reached its finalization reserve.');
		if (Date.now() - lastGuard >= 1000) {
			run.guard();
			lastGuard = Date.now();
		}
	}
	/** @param {string} name @param {unknown} value @param {boolean} [terminal] @param {DialDerivation} [derivation] @returns {DialFileIdentity} */
	function write(
		name,
		value,
		terminal = false,
		derivation = {
			parents: [definition],
			operation: `Retain ${name} derived from the authenticated source-column recipe.`,
		},
	) {
		if (terminal) assert.ok(Date.now() < started + maximumJobMilliseconds);
		else guard();
		run.guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value) + '\n');
		assert.ok(written + bytes.length < allocatedBytes - terminalReserve);
		const id = run.write(name, bytes, derivation);
		written += id.byteLength;
		return id;
	}
	try {
		run.progress(
			target ? 'target' : 'prediction',
			target
				? 'Evaluating held S160 columns after exact forecast authentication.'
				: 'Computing S80 columns and independent source references before freezing the S160 forecast.',
		);
		write('source-column-plan.md', planBytes, false, {
			parents: [plan],
			operation: 'Retain exact prospective source-column plan bytes.',
		});
		write('inputs.json', input);
		const snapshot = Buffer.from(
			JSON.stringify(sources.map((id) => ({...id, base64: readRepository(id.path, id).toString('base64')}))),
		);
		write('sources.json.gz', gzipSync(snapshot, {level: 9}), false, {
			parents: sources,
			operation: 'Encode exact implementation bytes as base64 JSON and gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: snapshot.length,
				uncompressedSha256: sha256(snapshot),
			},
		});
		write('proof.json', sourceColumnAuditProof());
		for (const [index, coordinate] of input.coordinates.entries()) {
			guard();
			activeCoordinate = coordinate.id;
			const spec = input.buildRequest.transportSpec,
				geometry = sourceAuditGeometry(spec, coordinate);
			if (!target) {
				const baseline = evaluateSourceAuditFinite(spec, geometry, 80, work),
					passes = evaluateSourceAuditReference(spec, geometry, work, guard),
					forecasts = [0, 8].map((channel) =>
						predictSourceAudit(
							spec,
							coordinate,
							geometry,
							baseline,
							admitSourceAuditReference(spec, geometry, passes, channel),
						),
					);
				rows.push({coordinate, geometry, baseline, passes, forecasts});
			} else {
				const finite = evaluateSourceAuditFinite(spec, geometry, 160, work),
					frozen = held.record.rows[index];
				assert.equal(frozen.coordinate.id, coordinate.id);
				targetRows.push({coordinateId: coordinate.id, finite});
				for (const forecast of frozen.forecasts)
					assessments.push(assessSourceAudit(forecast, sourceAuditTau(spec, finite, forecast.channel)));
			}
			activeCoordinate = null;
			if ((index + 1) % 8 === 0)
				run.progress(
					target ? 'target' : 'prediction',
					`${index + 1}/${input.coordinates.length} source coordinates complete.`,
				);
		}
		if (!target) {
			/** @type {SkySourceAuditPredictionRecord} */ const record = {
				schemaId: 'sky-source-column-prediction-v1',
				registration: registration.seal,
				forecastPlan: plan,
				targetCaseId: sourceColumnTargetCase,
				targetAlreadyExecuted: false,
				rows,
			};
			write('prediction.json', record);
			write('reference-summary.json', {
				coordinates: rows.length,
				channels: rows.length * 2,
				referenceAdequate: rows.every((row) => row.forecasts.every((forecast) => forecast.reference.resolved)),
				unresolved: rows.flatMap((row) =>
					row.forecasts
						.filter((forecast) => !forecast.reference.resolved)
						.map((forecast) => ({
							coordinateId: row.coordinate.id,
							channel: forecast.channel,
							reasons: forecast.reference.reasons,
						})),
				),
			});
		} else {
			write('target.json', {schemaId: 'sky-source-column-target-v1', predictionRun, rows: targetRows});
			write('assessment.json', {
				schemaId: 'sky-source-column-assessment-v1',
				predictionRun,
				rows: assessments,
				groups: sourceAuditGroups(held.record.rows, assessments),
				interpolationInteraction: 'deferred',
				fullViewAttribution: false,
				gpuArithmeticParity: false,
			});
		}
		for (const id of [...parents, ...sources]) readRepository(id.path, id);
		await authenticateNode(registration.record.host.node);
		write('execution.json', {
			completed: true,
			work,
			gpuJobsExecuted: 0,
			heldS160Evaluated: target,
			sourcesReauthenticated: true,
			parentsReauthenticated: true,
		});
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
		try {
			write(
				'partial.json',
				{
					schemaId: 'sky-source-column-partial-v1',
					failure: failure.message,
					activeCoordinate,
					rows,
					targetRows,
					assessments,
					work,
					interruptedCoordinateResultUnavailable: activeCoordinate !== null,
				},
				true,
			);
		} catch (partialError) {
			failure = new Error(
				`${failure.message}; partial artifact could not be retained: ${partialError instanceof Error ? partialError.message : String(partialError)}`,
			);
		}
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId: 'compensation-attribution-v1',
		extensionStage: caseId,
		caseId,
		completedCoordinates: target ? targetRows.length : rows.length,
		activeCoordinate,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		gpuJobsExecuted: 0,
		work,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.ok(seal.byteLength + terminal.artifacts.reduce((sum, row) => sum + row.byteLength, 0) <= allocatedBytes);
	if (failure) throw new Error(`Source-column ${caseId} failed in ${run.path}: ${failure.message}`);
	return {run: run.path, seal};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.ok(process.argv.length === 3 || process.argv.length === 4);
	console.log(JSON.stringify(await runSourceColumnAudit(process.argv[2], process.argv[3] ?? null)));
}
