import assert from 'node:assert/strict';
import {computeTheoreticalSunDirection} from '../../../../scripts/experiments/b1-directional-sky-radiance/benchmark-domain.js';
import {fitGrid, analyticGrid} from './fit.mjs';

/** Wrap a difference without treating distinct half-plane solar axes as equivalent.
 * @param {number} angle @returns {number}
 */
const wrap = (angle) => ((((angle + 180) % 360) + 360) % 360) - 180;

/** Compare fixed global geometry hypotheses with a withheld time split.
 * @param {readonly SkySolarCondition[]} conditions @returns {SkySolarHypothesis[]}
 */
function geometricHypotheses(conditions) {
	/** @param {SkySolarCondition} condition @param {number} offset */
	function solarAt(condition, offset) {
		const [hour, minute] = condition.time.split(':').map(Number),
			minutes = hour * 60 + minute + offset;
		return computeTheoreticalSunDirection(`${Math.floor(minutes / 60)}:${minutes % 60}`);
	}
	/** @type {SkySolarHypothesis[]} */ const result = [];
	for (const model of ['azimuth-zero', 'clock', 'clock-and-zero']) {
		/** @type {SkySolarHypothesis|null} */ let best = null;
		for (let offset = model === 'azimuth-zero' ? 0 : -60; offset <= (model === 'azimuth-zero' ? 0 : 60); offset++) {
			const solar = conditions.map((c) => solarAt(c, offset)),
				train = conditions.map((_, i) => i).filter((i) => i % 2 === 0);
			const zero =
				model === 'clock'
					? 0
					: train.reduce(
							(s, i) => s + wrap(conditions[i].fittedDegrees - solar[i].theoreticalAzimuthDegrees),
							0,
						) / train.length;
			const predictions = conditions.map((c, i) => ({
				time: c.time,
				held: i % 2 === 1,
				azimuthDegrees: solar[i].theoreticalAzimuthDegrees + zero,
				errorDegrees: wrap(solar[i].theoreticalAzimuthDegrees + zero - c.fittedDegrees),
				zenithChangeDegrees: solar[i].zenithDegrees - c.zenithDegrees,
			}));
			/** @param {boolean} held @returns {number} */
			const rms = (held) => {
				const rows = predictions.filter((p) => p.held === held);
				return Math.hypot(...rows.map((p) => p.errorDegrees)) / Math.sqrt(rows.length);
			};
			const candidate = {
				model,
				offsetMinutes: offset,
				zeroDegrees: zero,
				trainingRmsDegrees: rms(false),
				heldRmsDegrees: rms(true),
				predictions,
			};
			if (!best || candidate.trainingRmsDegrees < best.trainingRmsDegrees) best = candidate;
		}
		assert.ok(best);
		result.push(best);
	}
	return result;
}

/** Execute only the frozen registration matrix; all input and model values remain unchanged.
 * @param {SkySolarInputs} input @param {(message?:string)=>void} progress
 * @returns {SkySolarAssessment}
 */
export function assessSolarRegistration(input, progress) {
	/** @type {SkySolarFitRow[]} */ const fits = [];
	/** @type {SkySolarSpectralTransfer[]} */ const spectralTransfers = [];
	let replayChecks = 0;
	for (const condition of input.conditions) {
		progress('Fitting spectral and native-ring checks at ' + condition.time + '.');
		/** @type {Map<string,SkySolarFitCalculation>} */ const byBand = new Map();
		for (const [band, grid] of Object.entries(condition.grids)) {
			const fit = fitGrid(grid, condition, band, progress);
			byBand.set(band, fit);
			fits.push(...fit.rows);
			if (band === 'integrated40') {
				assert.ok(
					Math.abs(fit.rows[0].bestDegrees - condition.fittedDegrees) < 1e-9,
					'Original fitted azimuth replay mismatch: ' + condition.time,
				);
				replayChecks++;
			}
		}
		for (const trainingBand of ['channel-0', 'channel-8'])
			for (const evaluationBand of ['channel-0', 'channel-8', 'channel-24', 'channel-30'].filter(
				(b) => b !== trainingBand,
			)) {
				const trained = byBand.get(trainingBand),
					evaluation = byBand.get(evaluationBand);
				assert.ok(trained && evaluation);
				const axisDegrees = trained.rows[0].bestDegrees,
					index = evaluation.angles.indexOf(axisDegrees);
				assert.ok(index >= 0);
				spectralTransfers.push({
					time: condition.time,
					trainingBand,
					evaluationBand,
					axisDegrees,
					loss: evaluation.losses.all[index],
					originalLoss: evaluation.rows[0].originalLoss,
					evaluationMinimumLoss: evaluation.rows[0].minimumLoss,
				});
			}
		fits.push(...fitGrid(condition.grids.integrated40, condition, 'integrated40', progress, true).rows);
		for (const g of [0.6, 0.9])
			fits.push(...fitGrid(analyticGrid(condition, g), condition, 'analytic-g' + g, progress).rows);
	}
	assert.equal(fits.length, 17 * (25 + 1 + 10));
	assert.equal(spectralTransfers.length, 102);
	assert.equal(replayChecks, 17);
	return {fits, spectralTransfers, replayChecks, hypotheses: geometricHypotheses(input.conditions)};
}
