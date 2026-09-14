import assert from 'node:assert/strict';
import {createRun, identity, readRepository, verifyRun} from './io/files.mjs';
import {inputRun} from './inputs.mjs';
import {selectCase} from './cases.mjs';
import {loadInputs} from './execution.mjs';
import {baselineParity, measurements, runBoundary, runScores} from './processing.mjs';
import {ALL_RAYS, parseBoundaryTsv, selectBoundary} from './analysis/boundary.mjs';
import {factorialContrast, geometricStrata, scoreBoundary, spectralDelta} from './analysis/metrics.mjs';
import {
	evaluatePrediction,
	mechanisticPrediction,
	midpointRefinementPrediction,
	predictionDigest,
} from './analysis/predictions.mjs';
import {comparisonReport} from './analysis/reports.mjs';
import {runAnalysisProof} from './analysis/proof.mjs';
import {runMechanismProofs} from './probes/mechanisms.mjs';
import {evaluateDensityFactorization} from './probes/density.mjs';
import {deriveProfile} from './numerics/profile.js';
import {
	constructionRefinementCounts,
	cumulativeQ30Controls,
	runPredictionContractProofs,
	viewRefinementCounts,
} from './prediction/contracts.mjs';
import {analyticFirstOrderProbes, benchmarkRay, evaluateOrders, prepareViewPlan} from './numerics/view.js';

/** Record independent manufactured equations and the authenticated historical scorer reproduction.
 * @returns {string}
 */
export function proofRun() {
	const inputs = loadInputs(),
		measured = measurements();
	const oldPath = `${inputRun}/native48-cpu.tsv`;
	const old = parseBoundaryTsv(readRepository(oldPath).toString(), {
		modelId: 'production',
		configId: 'native48-cpu',
		sourceIdentity: identity(oldPath),
	});
	const incoming = [
		inputs.native48.transportSpec.domains.incoming,
		...[
			[4, 8],
			[8, 16],
			[16, 32],
			[32, 64],
		].map(
			([muCount, azimuthCount]) =>
				deriveProfile(inputs.native48, {incoming: {kind: 'gauss-legendre-product', muCount, azimuthCount}})
					.buildRequest.transportSpec.domains.incoming,
		),
	];
	const run = createRun('equation-proofs', {
		parents: [
			identity(`${inputRun}/sealed.json`),
			identity('src/algorithm32/implementation/distant-sun/cache/DistantSunSolarInterpolation.js'),
		],
		operation:
			'Self-verifying analytic phase normalization, Rayleigh moments, cubic grouping, Float32 stress, known-integrand convergence, density factorization, and independent scoring/prediction algebra. These are manufactured proofs, not measured sky convergence.',
	});
	try {
		run.progress('proofs', 'Checking manufactured equations and complete historical score reproduction.');
		const result = {
			analysis: runAnalysisProof(measured, old, 11.419630255451395),
			mechanisms: runMechanismProofs({incomingDomains: incoming}),
			predictionContracts: runPredictionContractProofs(),
		};
		run.write('result.json', result);
		run.finish('accepted', {checksPassed: true});
	} catch (error) {
		run.finish('failed', {message: String(error), stack: error.stack});
		throw error;
	}
	verifyRun(run.path);
	return run.path;
}

/** Retain score rows and required Native48/51 baseline parity checks.
 * @param {string} sourceRun @returns {string}
 */
export function scoreRun(sourceRun) {
	const sourceSeal = verifyRun(sourceRun);
	const run = createRun('score', {
		parents: [sourceSeal, identity(`${inputRun}/sealed.json`)],
		operation:
			'Decode explicitly ordered per-channel Float64 spectra, transpose X-major GPU rays to the scored boundary, and compute registered or explicitly screened Kider RMSE for each representation/view/order.',
	});
	try {
		run.progress('scoring', 'Evaluating retained spectra against the pinned measurement boundary.');
		const scores = runScores(sourceRun);
		const source = JSON.parse(readRepository(sourceSeal.path).toString());
		const hasQ30 = scores.rows.some((row) => row.q === 30);
		const parity =
			['baseline', 'p51'].includes(source.result.caseId) && hasQ30
				? baselineParity(runBoundary(sourceRun), source.result.caseId === 'p51')
				: null;
		run.write('scores.json', {scores, parity});
		const csv =
			[
				'representation,q,solar,order,time,rmse_mW,aggregate_mW',
				...scores.rows.flatMap((row) =>
					row.score.conditions.map((condition) =>
						[
							row.representation,
							row.q,
							row.solar,
							row.order,
							condition.time,
							condition.rmseMilliwatt,
							row.score.aggregateRmseMilliwatt,
						].join(','),
					),
				),
			].join('\n') + '\n';
		run.write('scores.csv', csv);
		run.finish(parity && !parity.passed ? 'rejected' : 'accepted', {
			sourceRun,
			parity,
			fullRegisteredBoundary: scores.fullRegisteredBoundary,
		});
	} catch (error) {
		run.finish('failed', {message: String(error), stack: error.stack});
		throw error;
	}
	verifyRun(run.path);
	return run.path;
}

/** Establish a fixed prediction floor from repeated execution and retained CPU view agreement.
 * @param {string} baselineRun @param {string} repeatedRun @returns {string}
 */
export function calibrateFloor(baselineRun, repeatedRun) {
	const baseline = runBoundary(baselineRun),
		repeated = runBoundary(repeatedRun);
	const selected = selectBoundary(baseline, repeated);
	let repeatMaximum = 0;
	for (let index = 0; index < repeated.values.length; index++)
		repeatMaximum = Math.max(repeatMaximum, Math.abs(repeated.values[index] - selected.values[index]));
	const parity = baselineParity(baseline);
	assert.ok(parity.passed, 'Prediction calibration requires baseline parity.');
	const floorW = Math.max(1e-8, 8 * parity.maximumAbsoluteError, 8 * repeatMaximum);
	const run = createRun('prediction-floor', {
		parents: [baseline.sourceIdentity, repeated.sourceIdentity, parity.expectedIdentity],
		operation:
			'Set scalar prediction negligibility floor to max(1e-8 W, 8*maximum CPU-view parity difference, 8*maximum repeat difference), before any candidate prediction. This measures implementation/repeatability uncertainty, not physical-model accuracy.',
	});
	const result = {floorW, parity, repeatMaximum, baselineRun, repeatedRun};
	run.write('result.json', result);
	run.finish('accepted', result);
	verifyRun(run.path);
	return run.path;
}

/** Create a registration whose uncertainty and inputs predate the target.
 * @param {string} floorRun @param {string} id @param {string} targetConfigId
 * @param {readonly DialAnalysisBoundary[]} development @returns {DialPredictionRegistration}
 */
function registration(floorRun, id, targetConfigId, development) {
	const floorSeal = verifyRun(floorRun);
	const floor = JSON.parse(readRepository(`${floorRun}/result.json`).toString());
	return {
		id,
		targetConfigId,
		scope: 'prospective-intervention',
		floorW: floor.floorW,
		floorEvidence: [floorSeal],
		development: development.map((item) => ({configId: item.configId, artifact: item.sourceIdentity})),
	};
}

/** Seal a complete numeric prediction and its control selector before target execution.
 * @param {DialSpectralPrediction} prediction @param {DialPredictionSelector} selector @returns {string}
 */
function sealPrediction(prediction, selector) {
	const run = createRun('prediction', {
		parents: [...prediction.development.map((item) => item.artifact), ...prediction.floorEvidence],
		operation: prediction.mechanism,
		parameters: {selector, targetConfigId: prediction.targetConfigId, prospectiveIntervention: true},
	});
	run.write('prediction.json', prediction);
	run.write('selector.json', selector);
	run.write('prediction-digest.txt', predictionDigest(prediction));
	run.finish('accepted', {
		predictionId: prediction.id,
		targetConfigId: prediction.targetConfigId,
		predictionSha256: predictionDigest(prediction),
	});
	verifyRun(run.path);
	return run.path;
}

/** Withhold the fourteen conditions outside the declared development screen for full-run predictions.
 * @param {DialAnalysisBoundary} boundary @returns {DialAnalysisBoundary}
 */
function predictionSelection(boundary) {
	return boundary.times.length === 17
		? selectBoundary(boundary, {
				...boundary,
				times: boundary.times.filter((time) => !['09:30', '11:15', '13:30'].includes(time)),
			})
		: boundary;
}

/** Predict a further final-view refinement before evaluating its target level.
 * @param {string} controlRun @param {string} floorRun @returns {string}
 */
export function lockViewRefinement(controlRun, floorRun) {
	const config = JSON.parse(readRepository(`${controlRun}/control.json`).toString());
	const segmented = config.controls.viewRule === 'altitude-segmented';
	const {coarse: coarseCount, medium: mediumCount, target: targetCount} = viewRefinementCounts(config.controls);
	const coarse = predictionSelection(runBoundary(controlRun, 'cumulative', coarseCount)),
		medium = predictionSelection(runBoundary(controlRun, 'cumulative', mediumCount));
	const targetConfigId = medium.configId.replace(`/q${mediumCount}/`, `/q${targetCount}/`);
	const prediction = midpointRefinementPrediction(
		coarse,
		medium,
		coarseCount,
		mediumCount,
		targetCount,
		registration(floorRun, `${segmented ? 'segmented' : 'view-q'}-${targetCount}`, targetConfigId, [
			coarse,
			medium,
		]),
	);
	return sealPrediction(prediction, {
		controlRun,
		representation: 'cumulative',
		controlQ: mediumCount,
		targetQ: targetCount,
		solar: 'monotone-cubic',
		order: 4,
	});
}

/** Prospectively test a second-order count model for one independently refined construction axis.
 * @param {string} coarseRun @param {string} mediumRun @param {string} targetCase @param {string} floorRun @returns {string}
 */
export function lockConstructionRefinement(coarseRun, mediumRun, targetCase, floorRun) {
	const coarse = predictionSelection(runBoundary(coarseRun)),
		medium = predictionSelection(runBoundary(mediumRun));
	const coarseControl = JSON.parse(readRepository(`${coarseRun}/control.json`).toString()).controls;
	const mediumControl = JSON.parse(readRepository(`${mediumRun}/control.json`).toString()).controls;
	const target = selectCase(targetCase).controls;
	const counts = constructionRefinementCounts(coarseControl, mediumControl, target);
	const targetConfigId = `${targetCase}/cumulative/q30/monotone-cubic/n4`;
	const prediction = midpointRefinementPrediction(
		coarse,
		medium,
		counts.coarse,
		counts.medium,
		counts.target,
		registration(floorRun, `${targetCase}-refinement`, targetConfigId, [coarse, medium]),
	);
	return sealPrediction(prediction, {
		controlRun: mediumRun,
		representation: 'cumulative',
		controlQ: 30,
		targetQ: 30,
		solar: 'monotone-cubic',
		order: 4,
	});
}

/** Predict a combined intervention from its two independently measured main effects.
 * @param {string} controlRun @param {string} factorARun @param {string} factorBRun
 * @param {string} targetCase @param {string} floorRun @returns {string}
 */
export function lockAdditive(controlRun, factorARun, factorBRun, targetCase, floorRun) {
	const target = deriveProfile(loadInputs().native48, selectCase(targetCase).controls).controls;
	const configurations = [controlRun, factorARun, factorBRun].map(
		(run) => /** @type {SkyControls} */ (JSON.parse(readRepository(`${run}/control.json`).toString()).controls),
	);
	/** @type {readonly (keyof SkyControls)[]} */
	const constructionKeys = [
		'altitudeCount',
		'outgoingWidth',
		'incoming',
		'sourceIntervals',
		'transportIntervals',
		'viewRule',
	];
	for (const key of constructionKeys) {
		const [base, first, second] = configurations.map((item) => JSON.stringify(item[key]));
		assert.ok(first === base || second === base, `Additive main effects must vary disjoint controls: ${key}`);
		assert.equal(
			JSON.stringify(target[key]),
			first !== base ? first : second,
			`Combined target differs from its declared main effects: ${key}`,
		);
	}
	const control = predictionSelection(runBoundary(controlRun));
	const factorA = selectBoundary(runBoundary(factorARun), control);
	const factorB = selectBoundary(runBoundary(factorBRun), control);
	const deltaA = spectralDelta(control, factorA),
		deltaB = spectralDelta(control, factorB);
	const targetConfigId = `${targetCase}/cumulative/q30/monotone-cubic/n4`;
	const prediction = mechanisticPrediction(
		control,
		Float64Array.from(deltaA.values, (value, index) => value + deltaB.values[index]),
		'Predict the combined spectral response as (LA-Lcontrol)+(LB-Lcontrol). The omitted mixed finite difference IAB is the model error. No combined target recurrence or measured target outcome is consumed.',
		registration(floorRun, `additive-${targetCase}`, targetConfigId, [control, factorA, factorB]),
	);
	return sealPrediction(prediction, {
		controlRun,
		representation: 'cumulative',
		controlQ: 30,
		targetQ: 30,
		solar: 'monotone-cubic',
		order: 4,
	});
}

/** Reconstruct analytic first-order cache samples without executing target recurrence.
 * @param {SkyBuildRequest} buildRequest @param {readonly SkyScene[]} scenes @param {readonly number[]} channels @param {SkyControls} controls
 * @param {(message: string) => void} progress @returns {Float64Array}
 */
function modeledFirstOrder(buildRequest, scenes, channels, controls, progress) {
	const plan = prepareViewPlan(buildRequest, scenes, {
		...controls,
		viewIntervals: [30],
		solarInterpolations: ['monotone-cubic'],
		representations: ['cumulative'],
	});
	const values = new Float64Array(scenes.length * 81 * channels.length);
	for (const [ordinal, channel] of channels.entries()) {
		progress(`Modeling first-order source samples for channel ${channel}.`);
		const pure = analyticFirstOrderProbes(buildRequest, plan, channel);
		const zero = new Float32Array(plan.coordinates.length);
		const evaluation = evaluateOrders(buildRequest, plan, channel, [pure, zero, zero, zero]);
		for (let scene = 0; scene < scenes.length; scene++)
			for (let x = 0; x < 9; x++)
				for (let y = 0; y < 9; y++)
					values[(scene * 81 + y * 9 + x) * channels.length + ordinal] =
						evaluation.values[scene * 81 + x * 9 + y];
	}
	return values;
}

/** Predict an altitude/angular/source intervention using only analytic J1 changes plus an earlier C4 control.
 * @param {string} controlRun @param {string} targetCase @param {string} floorRun @returns {string}
 */
export function lockFirstOrder(controlRun, targetCase, floorRun) {
	const control = predictionSelection(runBoundary(controlRun));
	const inputs = loadInputs();
	const sourceControl = /** @type {SkyGpuControl} */ (
		JSON.parse(readRepository(`${controlRun}/control.json`).toString())
	);
	const candidate = deriveProfile(inputs.native48, selectCase(targetCase).controls);
	const modelRun = createRun('j1-model', {
		parents: [control.sourceIdentity, identity(`${inputRun}/controls.json`)],
		operation:
			'Evaluate direct beam attenuation, physical phase and density at only the requested sparse J1 construction coordinates in binary64; round each J1 to Float32; reconstruct Q30. No candidate recurrence, incoming integration or Kider value is consumed.',
		parameters: {targetCase, control: sourceControl.controls, candidate: candidate.controls},
	});
	let delta;
	try {
		const notify = (message) => modelRun.progress('analytic-j1', message);
		const scenes = sourceControl.scenes.filter((scene) => control.times.includes(scene.time));
		const before = modeledFirstOrder(
			sourceControl.buildRequest,
			scenes,
			control.channels,
			sourceControl.controls,
			notify,
		);
		const after = modeledFirstOrder(candidate.buildRequest, scenes, control.channels, candidate.controls, notify);
		delta = Float64Array.from(after, (value, index) => value - before[index]);
		modelRun.write('modeled-delta.json', Array.from(delta));
		modelRun.finish('accepted', {targetCase, count: delta.length, candidateRecurrenceExecuted: false});
	} catch (error) {
		modelRun.finish('failed', {message: String(error), stack: error.stack});
		throw error;
	}
	const modelSeal = verifyRun(modelRun.path);
	const targetConfigId = `${targetCase}/cumulative/q30/monotone-cubic/n4`;
	const record = registration(floorRun, `j1-${targetCase}`, targetConfigId, [control]);
	const prediction = mechanisticPrediction(
		control,
		delta,
		'Predict target C4 radiance as measured baseline-model C4 plus analytic sparse-cache J1(target)-J1(control). Pure orders2..4 and cubic grouping changes are assumed negligible relative to the predicted main effect; this is explicitly falsifiable. No target GPU recurrence was executed.',
		{
			...record,
			development: [...record.development, {configId: 'analytic-first-order-model', artifact: modelSeal}],
		},
	);
	return sealPrediction(prediction, {
		controlRun,
		representation: 'cumulative',
		controlQ: 30,
		targetQ: 30,
		solar: 'monotone-cubic',
		order: 4,
	});
}

/** Validate a sealed prediction on an authenticated later intervention.
 * @param {string} predictionRun @param {string} candidateRun @returns {string}
 */
export function assessPrediction(predictionRun, candidateRun) {
	const predictionSeal = verifyRun(predictionRun),
		candidateSeal = verifyRun(candidateRun);
	const prediction = /** @type {DialSpectralPrediction} */ (
		JSON.parse(readRepository(`${predictionRun}/prediction.json`).toString())
	);
	const selector = /** @type {DialPredictionSelector} */ (
		JSON.parse(readRepository(`${predictionRun}/selector.json`).toString())
	);
	const control = runBoundary(
		selector.controlRun,
		selector.representation,
		selector.controlQ,
		selector.solar,
		selector.order,
	);
	const candidate = runBoundary(
		candidateRun,
		selector.representation,
		selector.targetQ,
		selector.solar,
		selector.order,
	);
	const lock = JSON.parse(readRepository(predictionSeal.path).toString());
	const startedAt = JSON.parse(readRepository(`${candidateRun}/progress.jsonl`).toString().split('\n')[0]).timestamp;
	const candidateDefinition = JSON.parse(readRepository(`${candidateRun}/definition.json`).toString());
	assert.ok(
		candidateDefinition.recipe.parents.some(
			(item) => item.path === predictionSeal.path && item.sha256 === predictionSeal.sha256,
		),
		'Candidate must declare the prior prediction seal as a parent.',
	);
	const sourceControl = /** @type {SkyGpuControl} */ (
		JSON.parse(readRepository(`${candidateRun}/control.json`).toString())
	);
	const strata = sourceControl.scenes
		.filter((scene) => prediction.times.includes(scene.time))
		.flatMap((scene) =>
			geometricStrata(
				scene.time,
				ALL_RAYS.map((rayIndex) => {
					const ray = benchmarkRay(
						sourceControl.buildRequest.transportSpec,
						scene,
						rayIndex % 9,
						Math.floor(rayIndex / 9),
					);
					return {
						rayIndex,
						elevationDegrees:
							(Math.asin(
								Math.max(
									-1,
									Math.min(
										1,
										ray.origin.reduce((sum, value, axis) => sum + value * ray.direction[axis], 0) /
											Math.hypot(...ray.origin),
									),
								),
							) *
								180) /
							Math.PI,
						sunSeparationDegrees: (Math.acos(Math.max(-1, Math.min(1, ray.direction[2]))) * 180) / Math.PI,
					};
				}),
			),
		);
	const evaluation = evaluatePrediction(
		prediction,
		control,
		candidate,
		{
			predictionSha256: predictionDigest(prediction),
			predictionSeal,
			lockedAt: lock.finishedAt,
			candidateStartedAt: startedAt,
			candidateIdentity: candidateSeal,
		},
		strata,
	);
	const run = createRun('prediction-check', {
		parents: [predictionSeal, candidateSeal],
		operation:
			'Authenticate pre-generation prediction timing, evaluate signed spectral prediction errors against each fixed condition/angular stratum, and retain misses without refitting.',
	});
	run.write('result.json', evaluation);
	run.finish(evaluation.passed ? 'accepted' : 'rejected', evaluation);
	verifyRun(run.path);
	return run.path;
}

/** Retain a human-readable comparison with separate spectral-response and Kider figures.
 * @param {string} controlRun @param {string} candidateRun @param {SkyRepresentation} [representation]
 * @param {number} [targetQ] @returns {string}
 */
export function compareRuns(controlRun, candidateRun, representation = 'cumulative', targetQ = 30) {
	const control = runBoundary(controlRun),
		candidate = runBoundary(candidateRun, representation, targetQ);
	const parents = [control.sourceIdentity, candidate.sourceIdentity, identity(`${inputRun}/sealed.json`)];
	const report = comparisonReport(control, candidate, measurements(), {
		title: `${candidate.configId} versus ${control.configId}`,
		scoreChannels: control.channels.filter((channel) => channel <= 30),
		provenance: {
			parents,
			operation: 'Decode authenticated spectra; compute spectral changes and Kider RMSE separately.',
		},
	});
	const run = createRun('comparison', {
		parents,
		operation:
			'Produce complete condition score table and standalone spectral-response and Kider-score figures from compact spectra.',
	});
	const {markdown, csv, spectralSvg, scoreSvg, ...result} = report;
	run.write('result.json', result);
	run.write('report.md', markdown);
	run.write('scores.csv', csv);
	run.write('spectral-response.svg', spectralSvg);
	run.write('kider-rmse.svg', scoreSvg);
	run.finish('accepted', {
		control: control.configId,
		candidate: candidate.configId,
		aggregateChangeMilliwatt: result.aggregateChangeMilliwatt,
	});
	verifyRun(run.path);
	return run.path;
}

/** Verify the predicted exact J1 invariance for changes confined to incoming and recurrence quadrature.
 * @param {string} controlRun @param {string} candidateRun @returns {string}
 */
export function firstOrderInvariance(controlRun, candidateRun) {
	const paths = [controlRun, candidateRun];
	const seals = paths.map((path) => verifyRun(path));
	const inputs = loadInputs();
	const configs = paths.map(
		(path) => /** @type {SkyGpuControl} */ (JSON.parse(readRepository(`${path}/control.json`).toString())),
	);
	const effective = configs.map((config) => cumulativeQ30Controls(config.controls));
	for (let index = 0; index < configs.length; index++) {
		assert.deepEqual(
			configs[index].buildRequest,
			deriveProfile(inputs.native48, configs[index].controls).buildRequest,
		);
		assert.deepEqual(configs[index].scenes, configs[0].scenes);
		assert.deepEqual(configs[index].channels, configs[0].channels);
	}
	for (const key of Object.keys(effective[0]))
		if (!['incoming', 'transportIntervals'].includes(key)) assert.deepEqual(effective[0][key], effective[1][key]);
	const plans = paths.map(
		(path) => JSON.parse(readRepository(`${path}/execution.json`).toString()).execution.browser.plan,
	);
	assert.equal(plans[0].coordinateSha256, plans[1].coordinateSha256);
	assert.equal(plans[0].coordinateCount, plans[1].coordinateCount);
	const first = paths.map((path) => runBoundary(path, 'cumulative', 30, 'monotone-cubic', 1));
	assert.deepEqual(first[0].values, first[1].values, 'Incoming/transport refinement must preserve C1 exactly.');
	const checks = configs[0].channels.map((channel) => {
		const metadata = paths.map(
			(path) =>
				/** @type {SkyGpuChannelSummary} */ (
					JSON.parse(readRepository(`${path}/channel-${String(channel).padStart(2, '0')}.json`).toString())
				),
		);
		const fields = metadata.map((item) => item.fieldChecks.find((field) => field.fieldId === 'J1'));
		assert.ok(fields[0] && fields[1]);
		assert.equal(fields[0].count, plans[0].coordinateCount);
		assert.deepEqual(fields[0], fields[1], 'Pure and cumulative Float32 J1 identities must remain exact.');
		return {channel, count: fields[0].count, sha256: fields[0].pureSha256};
	});
	const run = createRun('j1-invariance', {
		parents: [...seals, identity(`${inputRun}/sealed.json`)],
		operation:
			'Authenticate matched controls and sparse coordinates; require bit-exact retained Float32 J1 hashes and binary64 C1 spectra when only incoming and/or recurrence quadrature changes.',
	});
	run.write('result.json', {
		controlRun,
		candidateRun,
		exact: true,
		spectralScalarCount: first[0].values.length,
		checks,
	});
	run.finish('accepted', {exact: true, spectralScalarCount: first[0].values.length});
	verifyRun(run.path);
	return run.path;
}

/** Measure complete two-factor contrasts in radiance before interpreting score nonadditivity.
 * @param {string} controlRun @param {string} factorARun @param {string} factorBRun @param {string} combinedRun
 * @param {string} floorRun @returns {string}
 */
export function factorialRun(controlRun, factorARun, factorBRun, combinedRun, floorRun) {
	const models = [controlRun, factorARun, factorBRun, combinedRun].map((run) => runBoundary(run));
	const floorSeal = verifyRun(floorRun),
		floor = JSON.parse(readRepository(`${floorRun}/result.json`).toString());
	const run = createRun('factorial', {
		parents: [...models.map((model) => model.sourceIdentity), floorSeal],
		operation:
			'Measure I_AB=L_AB-L_A-L_B+L_0 and separately SSE nonadditivity. Nonzero score cross terms alone do not imply a radiance interaction.',
	});
	const contrast = factorialContrast(
		models[0],
		models[1],
		models[2],
		models[3],
		selectBoundary(measurements(), models[0]),
		floor.floorW,
	);
	const {interaction, ...metrics} = contrast;
	run.write('interaction.json', {...interaction, values: Array.from(interaction.values)});
	run.write('result.json', {...metrics, models: models.map((model) => model.configId), floorW: floor.floorW});
	run.finish('accepted', metrics);
	verifyRun(run.path);
	return run.path;
}

/** Separate altitude sensitivity with cached or continuous first order, controlling cubic grouping.
 * @param {string} controlRun @param {string} altitudeRun @param {string} floorRun @returns {string}
 */
export function representationFactorial(controlRun, altitudeRun, floorRun) {
	const base = runBoundary(controlRun, 'grouped'),
		altitude = runBoundary(altitudeRun, 'grouped');
	const analytic = runBoundary(controlRun, 'analytic-n1'),
		combined = runBoundary(altitudeRun, 'analytic-n1');
	const floorSeal = verifyRun(floorRun),
		floor = JSON.parse(readRepository(`${floorRun}/result.json`).toString());
	const contrast = factorialContrast(
		base,
		altitude,
		analytic,
		combined,
		selectBoundary(measurements(), base),
		floor.floorW,
	);
	const cachedDelta = spectralDelta(base, altitude),
		analyticDelta = spectralDelta(analytic, combined);
	const norm = (values) => Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
	const ratio =
		norm(analyticDelta.values) /
		Math.max(norm(cachedDelta.values), floor.floorW * Math.sqrt(cachedDelta.values.length));
	const run = createRun('representation', {
		parents: [base.sourceIdentity, altitude.sourceIdentity, floorSeal],
		operation:
			'Complete altitude by first-order-representation factorial. Use grouped J1 and higher fields as control so nonlinear cubic grouping is not mistaken for a physical effect.',
	});
	const {interaction, ...metrics} = contrast;
	run.write('result.json', {
		...metrics,
		analyticToCachedAltitudeSensitivity: ratio,
		cachedAltitudeDeltaNorm: norm(cachedDelta.values),
		analyticAltitudeDeltaNorm: norm(analyticDelta.values),
	});
	run.write('interaction.json', {...interaction, values: Array.from(interaction.values)});
	run.finish('accepted', {analyticToCachedAltitudeSensitivity: ratio, ...metrics});
	verifyRun(run.path);
	return run.path;
}

/** Retain a first-order species-factorization experiment with explicitly frozen later increments.
 * @param {string} sourceRun @returns {string}
 */
export function densityRun(sourceRun) {
	const control = runBoundary(sourceRun),
		cachedFirst = runBoundary(sourceRun, 'cumulative', 30, 'monotone-cubic', 1);
	const sourceControl = /** @type {SkyGpuControl} */ (
		JSON.parse(readRepository(`${sourceRun}/control.json`).toString())
	);
	const run = createRun('density-n1', {
		parents: [control.sourceIdentity, identity(`${inputRun}/sealed.json`)],
		operation:
			'Construct separate analytic Rayleigh/Mie first-order lighting fields, reconstruct them and apply physical density at each midpoint. Compare to same-Q continuous first order, control species grouping, and substitute into C4-C1. Later increments remain frozen; this is not regenerated higher-order factorization.',
	});
	try {
		const result = evaluateDensityFactorization(
			sourceControl.buildRequest,
			sourceControl.scenes,
			{...sourceControl.controls, viewIntervals: [30], solarInterpolations: ['monotone-cubic']},
			control.channels,
			(progress) => run.progress(progress.phase, progress.message, progress.completed, progress.total),
		);
		/** @param {Float64Array} source @returns {Float64Array} */
		const transpose = (source) => {
			const target = new Float64Array(source.length);
			for (let scene = 0; scene < control.times.length; scene++)
				for (let x = 0; x < 9; x++)
					for (let y = 0; y < 9; y++)
						for (let channel = 0; channel < control.channels.length; channel++)
							target[(scene * 81 + y * 9 + x) * control.channels.length + channel] =
								source[(scene * 81 + x * 9 + y) * control.channels.length + channel];
			return target;
		};
		const raw = transpose(result.rawJ1),
			split = transpose(result.splitSpeciesJ1),
			factored = transpose(result.factoredJ1),
			continuous = transpose(result.continuousJ1);
		/** @param {Float64Array} left @param {Float64Array} right @returns {number} */
		const rms = (left, right) =>
			Math.sqrt(left.reduce((sum, value, index) => sum + (value - right[index]) ** 2, 0) / left.length) * 1000;
		const candidate = {
			...control,
			configId: `${control.configId}/density-factored-frozen-n1`,
			values: Float64Array.from(
				control.values,
				(value, index) => value - cachedFirst.values[index] + factored[index],
			),
		};
		const report = comparisonReport(control, candidate, measurements(), {
			title: 'Physical first-order density factorization with frozen later increments',
			scoreChannels: control.channels.filter((channel) => channel <= 30),
			provenance: {
				parents: [control.sourceIdentity],
				operation: 'C4candidate=C4cached-C1cached+C1factored; same-Q reference, no higher recurrence change.',
			},
		});
		const numerical = {
			rawFirstOrderRmseMilliwatt: rms(raw, continuous),
			factoredFirstOrderRmseMilliwatt: rms(factored, continuous),
			speciesGroupingRmsMilliwatt: rms(raw, split),
			analyticGridVersusGpuJ1RmsMilliwatt: rms(raw, cachedFirst.values),
			numericalChannels: control.channels,
			scoredChannels: control.channels.filter((channel) => channel <= 30),
		};
		run.write('numerical.json', numerical);
		run.write('spectra.json', {
			times: control.times,
			channels: control.channels,
			rayIndices: control.rayIndices,
			layout: 'time-y-major-ray-channel',
			raw: Array.from(raw),
			split: Array.from(split),
			factored: Array.from(factored),
			continuous: Array.from(continuous),
			frozenCandidate: Array.from(candidate.values),
		});
		const {rawJ1, splitSpeciesJ1, factoredJ1, continuousJ1, ...metadata} = result;
		run.write('method.json', metadata);
		const {markdown, csv, spectralSvg, scoreSvg, ...scores} = report;
		run.write('scores.json', scores);
		run.write('report.md', markdown);
		run.write('scores.csv', csv);
		run.write('spectral-response.svg', spectralSvg);
		run.write('kider-rmse.svg', scoreSvg);
		run.finish('accepted', {
			numerical,
			aggregateKiderChangeMilliwatt: report.aggregateChangeMilliwatt,
			higherOrdersRegenerated: false,
		});
	} catch (error) {
		run.finish('failed', {message: String(error), stack: error.stack});
		throw error;
	}
	verifyRun(run.path);
	return run.path;
}
