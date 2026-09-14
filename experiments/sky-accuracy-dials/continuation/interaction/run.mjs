import assert from 'node:assert/strict';
import path from 'node:path';
import {isBuiltin} from 'node:module';
import {gzipSync, gunzipSync} from 'node:zlib';
import {createRun, identity, readRepository, sha256, sourceIdentities, storage, verifyRun} from '../../io/files.mjs';
import {measurements} from '../../processing.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {mechanismCase} from '../mechanisms/cases.mjs';
import {
	acceptedMechanismInput,
	mechanismArtifact,
	mechanismAttempts,
	readMechanismRegistration,
} from '../mechanisms/registration.mjs';
import {interactionVertices, readInteractionSource, additiveSpectrumBytes} from './contracts.mjs';
import {buildInteractionForecasts, evaluateInteractionForecast, interactionStrata} from './metrics.mjs';

const MIB = 1024 ** 2;
const LIMITATIONS = [
	'Only prospective outcomes for the registered three-time six-channel screen are assessed. Measurements were already known; no held14 or full17 intervention claim is made.',
	'All spectral groups use the fixed1e-8W significance floor,90percent sign agreement and25percent vector-error threshold. This floor is an implementation criterion, not a confidence interval.',
	'Kider scores exclude channel39. Positive gain means baseline RMSE minus candidate RMSE; direction and max(25percent of predicted magnitude,0.01mW) forecast-error gates are separate from spectral response gates.',
	'No independently adequate whole-N4 reference is established by this interaction test. Predictable response or lower Kider RMSE does not establish numerical-error reduction or accuracy-control qualification.',
	'The additive model is fixed before the target: Lpred=LA+LB-LH. Spectral interaction is LAB-LA-LB+LH; score interaction also contains2*dA*dB even when radiance is additive.',
	'For j1-higher the additive forecast is a causal invariance prediction to numerical roundoff: final-J1 changes never feed analytic L1 or regenerated higher orders. The two other targets are first-order additive approximations with omitted recurrence/cubic feedback and change incoming placement, not incoming sample count.',
	'Negative additive predictions are retained without clipping, counted and scored by their signed residuals. A scientifically failed prediction remains accepted execution evidence.',
];

/** Capture the full local static import closure plus nearest ambient contracts.
 * Node builtins are identified explicitly; unexpected package imports are rejected.
 * The run contract separately fingerprints the entire experiment source tree.
 * @returns {readonly DialFileIdentity[]} Exact independently replayable CPU sources.
 */
function interactionSources() {
	const queue = ['experiments/sky-accuracy-dials/continuation/interaction/run.mjs'];
	/** @type {Map<string,DialFileIdentity>} */ const found = new Map();
	while (queue.length) {
		const file = queue.shift();
		if (found.has(file)) continue;
		const bytes = readRepository(file);
		found.set(file, identity(file, bytes));
		for (const match of bytes
			.toString()
			.matchAll(/(?:import|export)\s+(?:[^'";]+?\s+from\s*)?['"]([^'"]+)['"]/gu)) {
			if (isBuiltin(match[1])) continue;
			assert.ok(match[1].startsWith('.'), 'Unexpected interaction CPU package import.');
			queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1])));
		}
	}
	const declarations = sourceIdentities().filter((source) => source.path.endsWith('/types.d.ts'));
	for (const file of [...found.keys()]) {
		const nearest = declarations
			.filter((source) => file.startsWith(`${path.posix.dirname(source.path)}/`))
			.sort((a, b) => b.path.length - a.path.length)[0];
		if (nearest) found.set(nearest.path, nearest);
	}
	return [...found.values()].sort((a, b) => a.path.localeCompare(b.path));
}

/** Allocate one frugal immutable CPU record with a protected terminal reserve.
 * @param {string} label - Bounded run name.
 * @param {DialContinuationRegistrationRead} registration - Fixed resource authority.
 * @param {SkyMechanismRegistrationRead} catalog - Exact prospective catalog.
 * @param {SkyContinuationAdmission} admission - Current C4 CPU resource allowance.
 * @param {readonly DialFileIdentity[]} inputParents - Exact consumed artifact graph.
 * @param {number} started - Actual operation start in epoch milliseconds.
 * @param {string} operation - Scientific derivation equation and purpose.
 * @returns {SkyInteractionWriter} One-way owned writer capability.
 */
function openInteraction(label, registration, catalog, admission, inputParents, started, operation) {
	const sources = interactionSources();
	const snapshot = Buffer.from(
		JSON.stringify(
			sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
		),
	);
	const compressed = gzipSync(snapshot, {level: 9});
	assert.ok(compressed.length < 450 * 1024, 'Interaction import closure exceeds its bounded source-pack allocation.');
	const parents = [
		...new Map(
			[
				registration.seal,
				catalog.seal,
				catalog.artifact,
				catalog.record.allocation,
				registration.record.inputs,
				...inputParents,
				...(admission.usage.invalidEvidence ?? []).map((item) => item.seal),
			].map((item) => [item.path, item]),
		).values(),
	];
	assert.deepEqual(admission.usage.allocationAmendment?.seal, catalog.record.allocation);
	const initial = storage().retainedBytes;
	const run = createRun(label, {
		parents,
		operation,
		parameters: {
			continuationRegistration: registration.run,
			mechanismRegistration: catalog.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C4',
			admission,
			sourceIdentities: sources,
			units: 'W m^-2 sr^-1 nm^-1',
			spectrumLayout: 'channel/view8,16/order1..4/scene-x-y;f64le',
			limits: LIMITATIONS,
		},
	});
	let closed = false;
	const reserve = 192 * 1024;
	/** Preflight every irreversible artifact write.
	 * @param {string} name - Fresh run-local file name.
	 * @param {unknown} value - Exact bytes or JSON-ready data.
	 * @param {DialDerivation} [derivation] - Explicit refined artifact equation.
	 * @returns {DialFileIdentity} Immutable artifact identity.
	 */
	const write = (name, value, derivation) => {
		const current = run.guard();
		assert.ok(Date.now() - started < admission.timeoutMilliseconds, 'Interaction CPU elapsed allowance exhausted.');
		assert.ok(
			current.retainedBytes - registration.initialStorage.retainedBytes <= registration.budgets.newRetainedBytes,
		);
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(
			current.retainedBytes - initial + bytes.length < admission.allocatedBytes - reserve,
			'Interaction artifacts would consume the terminal reserve.',
		);
		return run.write(name, bytes, derivation);
	};
	/** Preserve an execution failure without reopening a terminal record.
	 * @param {unknown} error - Original failure.
	 * @returns {never} Rethrows the same failed operation.
	 */
	const fail = (error) => {
		if (!closed) {
			run.cleanup();
			closed = true;
			run.finish('failed', {failure: String(error), jobElapsedMilliseconds: Date.now() - started});
		}
		throw error;
	};
	try {
		write('admission.json', admission);
		write('sources.json.gz', compressed, {
			parents: [...sources],
			operation:
				'Snapshot the complete relative static import closure and nearest ambient declarations as exact path/size/hash/base64 JSON, compressed with Node zlib gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				node: process.version,
				uncompressedByteLength: snapshot.length,
				uncompressedSha256: sha256(snapshot),
				wholeExperimentSourceFingerprintedByRun: true,
			},
		});
	} catch (error) {
		fail(error);
	}
	return {
		run,
		sources,
		write,
		fail,
		finish(result) {
			write('result.json', result);
			run.cleanup();
			closed = true;
			const seal = run.finish('accepted', {...result, jobElapsedMilliseconds: Date.now() - started});
			assert.deepEqual(verifyRun(run.path), seal);
			assert.equal(JSON.parse(readRepository(seal.path, seal).toString()).state, 'accepted');
			assert.ok(
				storage().retainedBytes - initial <= admission.allocatedBytes,
				'Interaction record exceeded its one-MiB allowance.',
			);
			return {run: run.path, seal, accepted: true};
		},
	};
}

/** Validate a sealed interaction prediction without reading its future target.
 * Recompute every forecast solely from its three authenticated original vertices.
 * @param {string} registrationRun - Original campaign registration.
 * @param {string} predictionRun - Accepted immutable prediction.
 * @returns {SkyInteractionPredictionRead} Exact locked data and its full ancestry.
 */
export function readInteractionPrediction(registrationRun, predictionRun) {
	const registration = readRegistration(registrationRun),
		input = acceptedMechanismInput(predictionRun),
		artifact = mechanismArtifact(input, 'prediction.json');
	const record = /** @type {SkyMechanismPrediction} */ (
		JSON.parse(readRepository(artifact.path, artifact).toString())
	);
	assert.equal(record.schemaId, 'sky-mechanism-prediction-v1');
	assert.deepEqual(record.registration, registration.seal);
	const catalog = readMechanismRegistration(registrationRun, path.posix.dirname(record.mechanismRegistration.path));
	assert.deepEqual(record.mechanismRegistration, catalog.seal);
	assert.deepEqual(record.targetCase, mechanismCase(record.targetCaseId));
	assert.equal(record.targetCase.predictionRequired, true);
	assert.equal(record.model, 'additive');
	assert.equal(record.scope, 'screen');
	assert.equal(record.targetAlreadyExecuted, false);
	assert.deepEqual(record.viewIntervals, [8, 16]);
	assert.deepEqual(record.representations, ['grouped']);
	assert.deepEqual(record.channels, registration.record.scopes.screen.channels);
	assert.deepEqual(record.times, registration.record.scopes.screen.times);
	assert.equal(input.terminal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(input.terminal.recipe.parameters.jobKind, 'cpu');
	assert.equal(input.terminal.recipe.parameters.phase, 'C4');
	assert.equal(input.terminal.recipe.parameters.scope, 'component');
	assert.deepEqual(record.limitations, LIMITATIONS);
	const vertexIds = interactionVertices(record.targetCaseId),
		vertices = [record.parents.baseline, record.parents.first, record.parents.second];
	const sources = vertices.map((vertex, index) => {
		const source = readInteractionSource(path.posix.dirname(vertex.path), vertexIds[index], registration, catalog);
		assert.deepEqual(source.input.seal, vertex);
		return source;
	});
	for (const parent of [
		registration.seal,
		catalog.seal,
		catalog.record.allocation,
		...vertices,
		...sources.flatMap((source) => source.artifacts),
	])
		assert.ok(
			input.terminal.recipe.parents.some(
				(item) =>
					item.path === parent.path && item.sha256 === parent.sha256 && item.byteLength === parent.byteLength,
			),
			'Interaction prediction omitted an exact consumed parent.',
		);
	assert.equal(record.predictedSpectrumArtifacts.length, record.channels.length);
	const expected = additiveSpectrumBytes(sources);
	const buffers = record.predictedSpectrumArtifacts.map((file, index) => {
		assert.equal(
			path.posix.basename(file.path),
			`predicted-channel-${String(record.channels[index]).padStart(2, '0')}.f64`,
		);
		assert.deepEqual(mechanismArtifact(input, path.posix.basename(file.path)), file);
		const bytes = readRepository(file.path, file);
		assert.ok(bytes.equals(expected[index]), 'Sealed prediction differs from its original additive equation.');
		return bytes;
	});
	assert.deepEqual(mechanismArtifact(input, 'forecasts.json.gz'), record.forecastArtifact);
	const forecastBytes = gunzipSync(readRepository(record.forecastArtifact.path, record.forecastArtifact), {
		maxOutputLength: 2 * MIB,
	});
	const forecasts = /** @type {readonly SkyInteractionForecast[]} */ (JSON.parse(forecastBytes.toString()));
	assert.deepEqual(
		forecasts,
		buildInteractionForecasts(sources, buffers, record.targetCase, registration, measurements()),
	);
	assert.ok(record.sourceIdentities.length > 0);
	assert.deepEqual(
		record.sourceIdentities,
		interactionSources(),
		'Prediction omitted or changed its exact CPU import closure.',
	);
	for (const source of record.sourceIdentities) readRepository(source.path, source);
	const predictionSequence = Number(path.posix.basename(input.run).slice(0, 5));
	for (const attempt of mechanismAttempts(registration.run).filter((item) => item.caseId === record.targetCaseId))
		assert.ok(
			Number(path.posix.basename(attempt.run).slice(0, 5)) > predictionSequence,
			'Prediction followed an earlier target attempt.',
		);
	const terminal = /** @type {SkyInteractionSealTime} */ (
		JSON.parse(readRepository(input.seal.path, input.seal).toString())
	);
	assert.ok(Number.isFinite(Date.parse(terminal.finishedAt)));
	return {input, artifact, record, catalog, sources, buffers, forecasts, lockedAt: terminal.finishedAt};
}

/** Seal the exact additive response before any attempt at the joint target.
 * @param {string} registrationRun - Original accepted C0 authority.
 * @param {string} mechanismRegistrationRun - Prospective mechanism catalog.
 * @param {string} targetCaseId - One of the three mandatory interaction targets.
 * @param {string} baselineRun - Exact registered H source.
 * @param {string} firstRun - Required first-factor vertex.
 * @param {string} secondRun - Required second-factor vertex.
 * @returns {Promise<string>} Newly accepted immutable prediction run.
 */
export async function registerInteractionPrediction(
	registrationRun,
	mechanismRegistrationRun,
	targetCaseId,
	baselineRun,
	firstRun,
	secondRun,
) {
	const started = Date.now(),
		registration = readRegistration(registrationRun),
		catalog = readMechanismRegistration(registrationRun, mechanismRegistrationRun);
	const admission = admitJob(registration, 'cpu', 'component', MIB, 'C4');
	const vertexIds = interactionVertices(targetCaseId),
		target = mechanismCase(targetCaseId);
	assert.equal(target.predictionRequired, true);
	assert.deepEqual(
		catalog.record.cases.find((item) => item.id === targetCaseId),
		target,
	);
	assert.ok(
		!mechanismAttempts(registration.run).some((attempt) => attempt.caseId === targetCaseId),
		'Cannot predict after any attempted joint target.',
	);
	const sources = [baselineRun, firstRun, secondRun].map((run, index) =>
		readInteractionSource(run, vertexIds[index], registration, catalog),
	);
	const writer = openInteraction(
		'c-interact-pred',
		registration,
		catalog,
		admission,
		sources.flatMap((source) => [source.input.seal, ...source.artifacts]),
		started,
		'Freeze Lpred=LA+LB-LH for the exact C4 joint target before any target attempt; retain unchanged numerical/sign gates and known-measurement score forecasts.',
	);
	try {
		writer.run.progress('prediction', 'Computing the fixed additive forecast from the three prior vertices.');
		const buffers = additiveSpectrumBytes(sources),
			measured = measurements();
		const forecasts = buildInteractionForecasts(sources, buffers, target, registration, measured);
		const predictedSpectrumArtifacts = buffers.map((bytes, index) =>
			writer.write(
				`predicted-channel-${String(registration.record.scopes.screen.channels[index]).padStart(2, '0')}.f64`,
				bytes,
			),
		);
		const bytes = Buffer.from(JSON.stringify(forecasts));
		const forecastArtifact = writer.write('forecasts.json.gz', gzipSync(bytes, {level: 9}), {
			parents: [
				...sources.flatMap((source) => [source.input.seal, ...source.artifacts]),
				registration.seal,
				registration.record.inputs,
				...predictedSpectrumArtifacts,
			],
			operation:
				'Freeze signed additive spectral responses and exact score/SSE forecasts for grouped views8/16 and cumulative N1-N4; gzip the complete eight-selector JSON without loss.',
			parameters: {
				uncompressedByteLength: bytes.length,
				uncompressedSha256: sha256(bytes),
				node: process.version,
				signFloorW: 1e-8,
				minimumSignAgreement: 0.9,
				maximumRelativeVectorError: 0.25,
			},
		});
		/** @type {SkyMechanismPrediction} */
		const record = {
			schemaId: 'sky-mechanism-prediction-v1',
			registration: registration.seal,
			mechanismRegistration: catalog.seal,
			targetCaseId,
			targetCase: target,
			model: 'additive',
			scope: 'screen',
			targetAlreadyExecuted: false,
			parents: {baseline: sources[0].input.seal, first: sources[1].input.seal, second: sources[2].input.seal},
			viewIntervals: [8, 16],
			representations: ['grouped'],
			channels: registration.record.scopes.screen.channels,
			times: registration.record.scopes.screen.times,
			sourceIdentities: writer.sources,
			predictedSpectrumArtifacts,
			forecastArtifact,
			limitations: LIMITATIONS,
		};
		writer.write('prediction.json', record);
		const result = writer.finish({
			predictionRegistered: true,
			targetCaseId,
			selectorCount: forecasts.length,
			forecastScalarCount: buffers.reduce((sum, buffer) => sum + buffer.length / 8, 0),
			scope: 'screen',
			numericalAccuracyQualified: false,
		});
		readInteractionPrediction(registrationRun, result.run);
		return result.run;
	} catch (error) {
		return writer.fail(error);
	}
}

/** Assess one later target against its unchanged sealed additive prediction.
 * Scientific rejection is retained as accepted diagnostic execution; no gate is
 * weakened and no whole-N4 accuracy or held-out full-spectrum claim is inferred.
 * @param {string} registrationRun - Original accepted C0 authority.
 * @param {string} predictionRun - Exact earlier sealed forecast.
 * @param {string} targetRun - Accepted joint target declaring that forecast parent.
 * @returns {Promise<DialExecutionResult>} Accepted assessment execution record.
 */
export async function assessInteraction(registrationRun, predictionRun, targetRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const admission = admitJob(registration, 'cpu', 'component', MIB, 'C4');
	const prediction = readInteractionPrediction(registrationRun, predictionRun);
	const target = readInteractionSource(targetRun, prediction.record.targetCaseId, registration, prediction.catalog);
	assert.ok(
		target.input.terminal.recipe.parents.some(
			(item) =>
				item.path === prediction.input.seal.path &&
				item.sha256 === prediction.input.seal.sha256 &&
				item.byteLength === prediction.input.seal.byteLength,
		),
		'Target must name the exact pre-execution prediction seal.',
	);
	const progress = mechanismArtifact(target.input, 'progress.jsonl');
	const firstEvent = /** @type {SkyInteractionProgressTime} */ (
		JSON.parse(readRepository(progress.path, progress).toString().split('\n')[0])
	);
	assert.ok(
		Number.isFinite(Date.parse(firstEvent.timestamp)) &&
			Date.parse(prediction.lockedAt) < Date.parse(firstEvent.timestamp),
		'Prediction must be sealed strictly before target allocation.',
	);
	const sources = [...prediction.sources, target];
	/** @type {SkyInteractionCausalCheck | null} */ let causalCheck = null;
	if (prediction.record.targetCaseId === 'j1-higher') {
		const higher = prediction.sources[2];
		/** Read the accepted capture's sparse coordinate identity.
		 * @param {SkyInteractionSource} source - Authenticated higher-only or joint run.
		 * @returns {SkyGpuPlanSummary} Exact captured coordinate inventory.
		 */
		const plan = (source) => {
			const file = mechanismArtifact(source.input, 'execution.json');
			const execution = /** @type {SkyInteractionGpuExecution} */ (
				JSON.parse(readRepository(file.path, file).toString())
			);
			assert.ok(execution.execution?.executionSucceeded && execution.execution.browser);
			return execution.execution.browser.plan;
		};
		assert.deepEqual(
			plan(higher),
			plan(target),
			'The causal comparison requires exactly matching sparse coordinates.',
		);
		let matchedHigherFields = 0;
		for (const channel of prediction.record.channels) {
			const name = `channel-${String(channel).padStart(2, '0')}.json`;
			const checks = [higher, target].map((source) => {
				const file = mechanismArtifact(source.input, name);
				return /** @type {SkyGpuChannelSummary} */ (JSON.parse(readRepository(file.path, file).toString()))
					.fieldChecks;
			});
			for (const id of ['J2-rayleigh', 'J2-mie', 'J3-rayleigh', 'J3-mie', 'J4-rayleigh', 'J4-mie']) {
				const first = checks[0].find((field) => field.fieldId === id),
					joint = checks[1].find((field) => field.fieldId === id);
				assert.ok(first && joint, 'A required higher species field is absent from the causal capture.');
				assert.equal(first.count, joint.count);
				assert.equal(
					first.pureSha256,
					joint.pureSha256,
					'Final-J1 correction changed a supposedly isolated higher field.',
				);
				matchedHigherFields++;
			}
		}
		causalCheck = {
			matchedHigherFields,
			exactSparseCoordinates: true,
			maximumInteractionW: 0,
			maximumRoundoffAllowanceW: 0,
			withinRoundoff: true,
		};
	}
	const parents = [
		prediction.input.seal,
		prediction.artifact,
		prediction.record.forecastArtifact,
		...prediction.record.predictedSpectrumArtifacts,
		...sources.flatMap((source) => [source.input.seal, ...source.artifacts]),
		progress,
	];
	const writer = openInteraction(
		'c-interact-check',
		registration,
		prediction.catalog,
		admission,
		parents,
		started,
		'Evaluate the unchanged prospective additive forecast against its later joint target; retain every screen spectral/sign/score gate and the full2x2 spectral and SSE expansion.',
	);
	try {
		const measured = measurements(),
			strata = interactionStrata(target.loaded.control);
		/** @type {SkyInteractionAssessmentRow[]} */ const rows = [];
		for (const forecast of prediction.forecasts) {
			writer.run.progress(
				'assessment',
				`Checking grouped view${forecast.view}, cumulative N${forecast.order}.`,
				rows.length,
				prediction.forecasts.length,
			);
			rows.push(
				evaluateInteractionForecast(
					forecast,
					sources,
					measured,
					{
						predictionSeal: prediction.input.seal,
						predictionSha256: forecast.predictionSha256,
						lockedAt: prediction.lockedAt,
						candidateStartedAt: firstEvent.timestamp,
						candidateIdentity: target.input.seal,
					},
					strata,
					registration.record.scientificGates,
				),
			);
		}
		const interactionBytes = prediction.buffers.map((buffer, index) => {
			const metadata = target.loaded.spectra[index],
				values = Buffer.alloc(buffer.length);
			assert.equal(metadata.bytes.length, buffer.length);
			for (let offset = 0; offset < buffer.length; offset += 8) {
				const actual = metadata.bytes.readDoubleLE(offset),
					expected = buffer.readDoubleLE(offset),
					interaction = actual - expected;
				values.writeDoubleLE(interaction, offset);
				if (causalCheck) {
					const allowance = 128 * Number.EPSILON * Math.max(Math.abs(actual), Math.abs(expected)) + 1e-20;
					causalCheck.maximumInteractionW = Math.max(causalCheck.maximumInteractionW, Math.abs(interaction));
					causalCheck.maximumRoundoffAllowanceW = Math.max(causalCheck.maximumRoundoffAllowanceW, allowance);
					causalCheck.withinRoundoff &&= Math.abs(interaction) <= allowance;
				}
			}
			return values;
		});
		for (const [index, bytes] of interactionBytes.entries())
			writer.write(
				`interaction-channel-${String(prediction.record.channels[index]).padStart(2, '0')}.f64`,
				bytes,
				{
					parents: [
						prediction.record.predictedSpectrumArtifacts[index],
						mechanismArtifact(
							target.input,
							`channel-${String(prediction.record.channels[index]).padStart(2, '0')}.f64`,
						),
					],
					operation:
						'Retain every scalar of LAB-(LA+LB-LH) in exact channel/view/order/scene-x-y f64le order.',
					parameters: {channel: prediction.record.channels[index], views: [8, 16], orders: [1, 2, 3, 4]},
				},
			);
		const assessment = {
			schemaId: 'sky-interaction-assessment-v1',
			targetCaseId: prediction.record.targetCaseId,
			prediction: prediction.input.seal,
			target: target.input.seal,
			scope: 'screen',
			knownMeasurements: true,
			held14Assessed: false,
			full17Assessed: false,
			numericalAccuracyQualified: false,
			referenceLimitation:
				'The interaction study has no independently adequate whole-N4 reference; spectral predictability does not certify numerical-error reduction.',
			gates: registration.record.scientificGates,
			rows,
			causalCheck,
			limitations: LIMITATIONS,
		};
		const encoded = Buffer.from(JSON.stringify(assessment));
		writer.write('assessment.json.gz', gzipSync(encoded, {level: 9}), {
			parents,
			operation:
				'Retain complete per-selector,per-condition and angular forecast gates plus full factorial/SSE terms, compressed losslessly with Node zlib level9.',
			parameters: {
				uncompressedByteLength: encoded.length,
				uncompressedSha256: sha256(encoded),
				node: process.version,
			},
		});
		return writer.finish({
			targetCaseId: prediction.record.targetCaseId,
			scope: 'screen',
			selectorCount: rows.length,
			spectralPredictionPassed: rows.every((row) => row.spectralPassed),
			scorePredictionPassed: rows.every((row) => row.scorePassed),
			causalCheck,
			screenN4UsefulGainAtBothViews: rows
				.filter((row) => row.order === 4)
				.every(
					(row) =>
						row.scores.find((score) => score.time === null).actualGainMilliwatt >=
						registration.record.scientificGates.minimumUsefulKiderImprovementMilliwatt,
				),
			numericalAccuracyQualified: false,
			scientificFailurePreservedAsAcceptedDiagnostic: true,
		});
	} catch (error) {
		return writer.fail(error);
	}
}
