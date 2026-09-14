import assert from 'node:assert/strict';
import {ALL_RAYS, selectBoundary} from '../../analysis/boundary.mjs';
import {
	geometricStrata,
	scoreBoundary,
	scoreDeltaIdentity,
	spectralDelta,
	factorialContrast,
} from '../../analysis/metrics.mjs';
import {mechanisticPrediction, evaluatePrediction, predictionDigest} from '../../analysis/predictions.mjs';
import {benchmarkRay} from '../../numerics/view.js';
import {extractBoundary} from '../../processing.mjs';

/** Fixed condition/angular memberships derived solely from registered geometry.
 * @param {SkyGpuControl} control - Exact screen geometry.
 * @returns {readonly DialGeometricStratum[]} Nonempty registered angular groups.
 */
export function interactionStrata(control) {
	return control.scenes
		.flatMap((scene) =>
			geometricStrata(
				scene.time,
				ALL_RAYS.map((rayIndex) => {
					const ray = benchmarkRay(
						control.buildRequest.transportSpec,
						scene,
						rayIndex % 9,
						Math.floor(rayIndex / 9),
					);
					const cosine =
						ray.origin.reduce((sum, value, axis) => sum + value * ray.direction[axis], 0) /
						Math.hypot(...ray.origin);
					return {
						rayIndex,
						elevationDegrees: (Math.asin(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI,
						sunSeparationDegrees: (Math.acos(Math.max(-1, Math.min(1, ray.direction[2]))) * 180) / Math.PI,
					};
				}),
			),
		)
		.filter((group) => group.rayIndices.length > 0);
}

/** Decode predicted channel buffers using the ordinary deterministic transpose.
 * Predicted values may be negative: preserve the additive model without clipping.
 * @param {SkyInteractionSource} baseline - Authenticated H axes.
 * @param {readonly Buffer[]} buffers - Channel-major f64le forecast data.
 * @param {string} target - Exact future case ID.
 * @param {number} view - Eight or sixteen subdivisions.
 * @param {number} order - Cumulative N1 through N4.
 * @returns {Float64Array} Time/ray/channel forecast values in analysis order.
 */
function predictedValues(baseline, buffers, target, view, order) {
	const control = {
		...baseline.loaded.control,
		controls: {
			...baseline.loaded.control.controls,
			representations: /** @type {readonly SkyRepresentation[]} */ (['grouped']),
			viewIntervals: [8, 16],
			solarInterpolations: /** @type {readonly SkySolarInterpolation[]} */ (['monotone-cubic']),
		},
	};
	const shape = {representationCount: 1, viewCount: 2, orderCount: 4, rayCount: control.scenes.length * 81};
	const loaded = {
		...baseline.loaded,
		caseId: target,
		control,
		spectra: buffers.map((bytes, index) => ({channel: control.channels[index], shape, bytes})),
	};
	return extractBoundary(loaded, 'grouped', view, 'monotone-cubic', order).values;
}

/** Forecast the measured-score response from an exact signed spectral response.
 * Negative predicted radiance is not clipped; the squared-residual equation
 * remains defined, and its negative-scalar count is reported separately.
 * @param {DialAnalysisBoundary} baseline - Physical H radiance.
 * @param {DialAnalysisBoundary} measured - Known Kider radiance.
 * @param {readonly number[]} delta - Frozen predicted response.
 * @returns {readonly SkyInteractionScoreForecast[]} Aggregate and each time.
 */
function forecastScores(baseline, measured, delta) {
	const changes = {
		...baseline,
		quantity: /** @type {DialAnalysisQuantity} */ ('delta'),
		values: Float64Array.from(delta),
	};
	const channels = baseline.channels.filter((channel) => channel <= 30);
	return [null, ...baseline.times].map((time) => {
		const selection = {times: time === null ? baseline.times : [time], channels, rayIndices: baseline.rayIndices};
		const h = selectBoundary(baseline, selection),
			m = selectBoundary(measured, selection),
			d = selectBoundary(changes, selection);
		const base = scoreBoundary(h, m, channels),
			sse = scoreDeltaIdentity(h, m, d);
		let predictedSquaredError = 0,
			negativePredictedScalars = 0;
		for (let index = 0; index < h.values.length; index++) {
			const value = h.values[index] + d.values[index];
			predictedSquaredError += (value - m.values[index]) ** 2;
			if (value < 0) negativePredictedScalars++;
		}
		const predictedRmseMilliwatt = 1000 * Math.sqrt(predictedSquaredError / h.values.length);
		assert.ok(Number.isFinite(predictedRmseMilliwatt));
		return {
			time,
			sampleCount: h.values.length,
			baselineRmseMilliwatt: base.aggregateRmseMilliwatt,
			predictedRmseMilliwatt,
			predictedGainMilliwatt: base.aggregateRmseMilliwatt - predictedRmseMilliwatt,
			predictedSquaredError,
			negativePredictedScalars,
			sse,
		};
	});
}

/** Freeze all spectral and measurement-response predictions before the target.
 * @param {readonly SkyInteractionSource[]} sources - Exact H, A, B vertices.
 * @param {readonly Buffer[]} buffers - Unclipped additive channel spectra.
 * @param {SkyMechanismCase} target - Exact prospective case definition.
 * @param {DialContinuationRegistrationRead} registration - Fixed original gates.
 * @param {DialAnalysisBoundary} measured - Known measurements, never fitted here.
 * @returns {readonly SkyInteractionForecast[]} Eight exact view/order forecasts.
 */
export function buildInteractionForecasts(sources, buffers, target, registration, measured) {
	assert.equal(registration.record.scientificGates.implementationFloorW, 1e-8);
	assert.equal(registration.record.scientificGates.minimumSignAgreement, 0.9);
	assert.equal(registration.record.scientificGates.maximumRelativeVectorError, 0.25);
	/** @type {SkyInteractionForecast[]} */ const rows = [];
	for (const view of [8, 16])
		for (let order = 1; order <= 4; order++) {
			const h = extractBoundary(sources[0].loaded, 'grouped', view, 'monotone-cubic', order);
			const values = predictedValues(sources[0], buffers, target.id, view, order);
			const delta = Array.from(values, (value, index) => value - h.values[index]);
			const mechanism =
				target.id === 'j1-higher'
					? 'Lpred = LA + LB - LH should hold to numerical roundoff: final-J1 reconstruction never feeds analytic L1 or regenerated higher orders, and the grouped view integrates J1 separately. Verify the joint and higher-only sparse field identities.'
					: `Lpred = LA + LB - LH is a first-order additive approximation for ${target.id === 'end-t320' ? 'incoming azimuth placement by transport count' : 'higher-density representation by incoming azimuth placement'}. Recurrence feedback and nonlinear cubic reconstruction are omitted; no exact additivity or incoming-count quarter-law is assumed.`;
			const spectral = mechanisticPrediction(h, delta, mechanism, {
				id: `${target.id}-v${view}-n${order}`,
				targetConfigId: `${target.id}/grouped/q${view}/monotone-cubic/n${order}`,
				scope: 'prospective-intervention',
				floorW: 1e-8,
				floorEvidence: [registration.seal],
				development: sources.map((source) => ({
					configId: extractBoundary(source.loaded, 'grouped', view, 'monotone-cubic', order).configId,
					artifact: source.input.seal,
					selection: registration.record.scopes.screen,
				})),
			});
			rows.push({
				view,
				order,
				spectral,
				predictionSha256: predictionDigest(spectral),
				scores: forecastScores(h, measured, spectral.delta),
			});
		}
	return rows;
}

/** Evaluate one sealed view/order forecast and its complete two-factor contrasts.
 * @param {SkyInteractionForecast} forecast - Exact locked spectral and score forecast.
 * @param {readonly SkyInteractionSource[]} sources - H,A,B and the later joint target.
 * @param {DialAnalysisBoundary} measured - Known fixed measurements.
 * @param {DialPredictionEvaluationEvidence} evidence - Authenticated lock/start times.
 * @param {readonly DialGeometricStratum[]} strata - Fixed geometry-only groups.
 * @param {DialContinuationScientificGates} gates - Original unchanged C0 criteria.
 * @returns {SkyInteractionAssessmentRow} Spectral gates, score gates and SSE terms.
 */
export function evaluateInteractionForecast(forecast, sources, measured, evidence, strata, gates) {
	const [h, a, b, t] = sources.map((source) =>
		extractBoundary(source.loaded, 'grouped', forecast.view, 'monotone-cubic', forecast.order),
	);
	assert.equal(predictionDigest(forecast.spectral), forecast.predictionSha256);
	const spectral = evaluatePrediction(
		forecast.spectral,
		h,
		t,
		{...evidence, predictionSha256: forecast.predictionSha256},
		strata,
	);
	const scoreChannels = h.channels.filter((channel) => channel <= 30);
	const scores = forecast.scores.map((prediction) => {
		const selection = {
			times: prediction.time === null ? h.times : [prediction.time],
			channels: scoreChannels,
			rayIndices: h.rayIndices,
		};
		const actual = scoreBoundary(selectBoundary(t, selection), selectBoundary(measured, selection), scoreChannels);
		const actualGainMilliwatt = prediction.baselineRmseMilliwatt - actual.aggregateRmseMilliwatt;
		const forecastErrorMilliwatt = Math.abs(actualGainMilliwatt - prediction.predictedGainMilliwatt);
		const allowanceMilliwatt = Math.max(
			gates.scoreForecastRelativeAllowance * Math.abs(prediction.predictedGainMilliwatt),
			gates.scoreForecastAbsoluteAllowanceMilliwatt,
		);
		const directionPassed = Math.sign(prediction.predictedGainMilliwatt) === Math.sign(actualGainMilliwatt);
		return {
			...prediction,
			actualRmseMilliwatt: actual.aggregateRmseMilliwatt,
			actualGainMilliwatt,
			forecastErrorMilliwatt,
			allowanceMilliwatt,
			directionPassed,
			passed: directionPassed && forecastErrorMilliwatt <= allowanceMilliwatt,
		};
	});
	const definitions = h.times
		.map((time) => ({id: `${time}/all-selected-rays`, time, rayIndices: h.rayIndices}))
		.concat(strata);
	const contrasts = definitions.map((group) => {
		const selection = {times: [group.time], channels: h.channels, rayIndices: group.rayIndices};
		const [hg, ag, bg, tg, mg] = [h, a, b, t, measured].map((boundary) => selectBoundary(boundary, selection));
		const full = factorialContrast(hg, ag, bg, tg, mg, 1e-8);
		const scored = {...selection, channels: scoreChannels};
		const [hs, as, bs, ts, ms] = [h, a, b, t, measured].map((boundary) => selectBoundary(boundary, scored));
		const score = factorialContrast(hs, as, bs, ts, ms, 1e-8);
		let interactionResidualCrossTerm = 0,
			interactionSquaredNorm = 0,
			operandSquaredScale = 0;
		for (let index = 0; index < hs.values.length; index++) {
			const residual = hs.values[index] - ms.values[index],
				first = as.values[index] - hs.values[index],
				second = bs.values[index] - hs.values[index],
				interaction = score.interaction.values[index];
			interactionResidualCrossTerm += 2 * (residual + first + second) * interaction;
			interactionSquaredNorm += interaction * interaction;
			operandSquaredScale +=
				residual * residual +
				(residual + first) ** 2 +
				(residual + second) ** 2 +
				(ts.values[index] - ms.values[index]) ** 2;
		}
		const expanded = score.additiveSquaredErrorCrossTerm + interactionResidualCrossTerm + interactionSquaredNorm;
		const identityResidual = score.squaredErrorInteraction - expanded;
		const scale =
			Math.abs(score.squaredErrorInteraction) +
			Math.abs(score.additiveSquaredErrorCrossTerm) +
			Math.abs(interactionResidualCrossTerm) +
			interactionSquaredNorm;
		assert.ok(
			Math.abs(identityResidual) <= 1e-24 + 1e-10 * scale + 128 * Number.EPSILON * operandSquaredScale,
			'Factorial SSE expansion failed.',
		);
		const actualSse = scoreDeltaIdentity(hs, ms, spectralDelta(hs, ts));
		return {
			id: group.id,
			spectralScalarCount: hg.values.length,
			scoreScalarCount: hs.values.length,
			interactionNormW: full.interactionNorm,
			relativeInteraction: full.relativeInteraction,
			squaredErrorInteraction: score.squaredErrorInteraction,
			additiveSquaredErrorCrossTerm: score.additiveSquaredErrorCrossTerm,
			interactionResidualCrossTerm,
			interactionSquaredNorm,
			identityResidual,
			actualSse,
		};
	});
	return {
		view: forecast.view,
		order: forecast.order,
		spectral,
		scores,
		contrasts,
		spectralPassed: spectral.passed,
		scorePassed: scores.every((row) => row.passed),
	};
}
