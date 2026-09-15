import assert from 'node:assert/strict';
import {predictMatchedAltitudeOrders} from './index.mjs';
import {
	transferResponseNorm,
	compareTransferModels,
	transferResponseSign,
	summarizeTransferSigns,
	transferSseIdentity,
	assessMatchedAltitudeResponse,
} from './assess.mjs';

/** Exercise held gates, invalid evidence, unresolved inputs, exact SSE algebra and model replay.
 * @returns {SkyOrderTransferAssessmentProof} Actual assertions without GPU or evidence writing.
 */
export function matchedOrderTransferAssessmentProof() {
	let checks = 0;
	/** @param {unknown} condition */ const check = (condition) => {
		assert.ok(condition);
		checks++;
	};
	/** @param {() => unknown} operation */ const rejects = (operation) => {
		assert.throws(operation);
		checks++;
	};
	/** @param {number} value @param {number|null} [allowance] @returns {SkyOrderTransferValue} */
	const value = (value, allowance = 0) => ({value, allowance});
	check(transferResponseNorm([value(1)], [value(1.25)]).state === 'passed');
	check(transferResponseNorm([value(1)], [value(1.250001)]).state === 'failed');
	check(transferResponseNorm([value(1, 0.01)], [value(1.26)]).state === 'passed');
	check(transferResponseNorm([value(0)], [value(0)]).state === 'passed');
	check(transferResponseNorm([value(1, null)], [value(1)]).state === 'unresolved');
	check(transferResponseNorm([null], [value(1)]).state === 'unresolved');
	rejects(() => transferResponseNorm([], []));
	rejects(() => transferResponseNorm([value(NaN)], [value(0)]));
	rejects(() => transferResponseNorm([value(1, -1)], [value(0)]));
	// An aggregate pass must not hide a failed two-order group.
	check(
		transferResponseNorm(
			[100, 100, 1, 1].map((v) => value(v)),
			[100, 100, 2, 2].map((v) => value(v)),
		).state === 'passed',
	);
	check(transferResponseNorm([value(1), value(1)], [value(2), value(2)]).state === 'failed');
	const floor = 0.1 + 0.2 + 1e-10;
	check(transferResponseSign(value(floor, 0.1), value(1, 0.2)).state === 'unresolved');
	check(transferResponseSign(value(1, 0.1), value(floor, 0.2)).state === 'unresolved');
	check(transferResponseSign(value(-1), value(-2)).state === 'passed');
	check(transferResponseSign(value(-1), value(2)).state === 'failed');
	check(transferResponseSign(null, value(1)).state === 'unresolved');
	/** @param {SkyVolumeCheckState} state @returns {SkyOrderTransferSign} */ const sign = (state) => ({
		state,
		floorWatts: 0,
	});
	check(summarizeTransferSigns(Array(3).fill(sign('passed'))).state === 'unresolved');
	check(
		summarizeTransferSigns([...Array(4).fill(sign('passed')), ...Array(4).fill(sign('unresolved'))]).state ===
			'passed',
	);
	check(summarizeTransferSigns([...Array(7).fill(sign('passed')), sign('failed')]).state === 'failed');
	check(summarizeTransferSigns([...Array(9).fill(sign('passed')), sign('failed')]).state === 'passed');
	check(summarizeTransferSigns([sign('unresolved')]).agreementRate === null);
	const uncertainComparison = compareTransferModels([value(0)], [value(0.25)], [value(0, 0.2)]);
	check(uncertainComparison.noninferiorityAllowanceWatts === 0.2);
	check(uncertainComparison.superiorityAllowanceWatts === 0.4);
	check(uncertainComparison.noninferiority === 'passed');
	check(uncertainComparison.primarySuperiority === 'unresolved' && uncertainComparison.superiorModel === null);
	check(compareTransferModels([value(0)], [value(1)], [value(0)]).primarySuperiority === 'passed');
	check(compareTransferModels([value(1)], [value(0)], [value(0)]).primarySuperiority === 'failed');
	check(compareTransferModels([value(1)], [value(0)], [value(0)]).noninferiority === 'failed');
	check(compareTransferModels([null], [value(0)], [value(0)]).noninferiority === 'unresolved');
	const h = [10, 11, 11.5, 11.75, 11.875, 11.9375].map((v) => value(v, 1e-10)),
		p = [9, 9.8, 10.25, 10.4875].map((v) => value(v, 1e-10));
	/** @type {SkyOrderTransferAssessmentInput[]} */ const inputs = [];
	for (const [probeId, time] of [
		['p-0930-5-7', '09:30'],
		['p-1230-3-5', '12:30'],
	])
		for (const channel of [0, 8]) {
			const frozen = {probeId, channel, h, p},
				prediction = predictMatchedAltitudeOrders(frozen);
			check(prediction.admitted);
			const forecast = prediction.forecasts[0],
				fifth = p[3].value + h[4].value - h[3].value + forecast.responses[0].value,
				sixth = fifth + h[5].value - h[4].value + forecast.responses[1].value;
			inputs.push({
				frozen,
				prediction,
				target: [...p, value(fifth, 1e-10), value(sixth, 1e-10)],
				original: {
					probeId,
					channel,
					time,
					physicalFirstResidual: -1.05,
					cumulative: h.slice(0, 4).map((r) => r.value),
					contributions: [-1.05, 1, 0.5, 0.25],
					allowances: [1e-10, 2e-10, 2e-10, 2e-10],
					firstNumerical: 0.3,
					remaining: 0.7,
					cancellationContributions: [-0.63, 0.6, 0.3, 0.15],
					identityResidual: 0,
				},
			});
		}
	const before = JSON.stringify(inputs),
		assessment = assessMatchedAltitudeResponse(inputs);
	check(JSON.stringify(inputs) === before);
	check(assessment.primaryQualification === 'passed');
	check(assessment.scalars.length === 8 && assessment.tails.length === 4);
	check(assessment.primaryAggregateNorm.count === 8 && assessment.signs.resolved === 8);
	check(assessment.groups.every((g) => g.primaryNorm.count === 2 && g.primaryNorm.state === 'passed'));
	for (const group of assessment.groups) {
		check(group.sse.knownN4ResponseWatts === p[3].value - h[3].value);
		check(group.sse.measurementWatts === 10.75);
		check(group.sse.sseIdentityResidualWattsSquared < 1e-12);
	}
	for (const residual of [-2, -1, 0, 1, 2]) {
		const input = {
				...inputs[0],
				original: {...inputs[0].original, remaining: residual - inputs[0].original.firstNumerical},
			},
			sse = transferSseIdentity(input);
		check(sse.sseIdentityResidualWattsSquared < 1e-12);
		check(Math.abs(sse.n4.beforeResidualWatts - residual) < 1e-15);
		check(
			Math.abs(
				(sse.pN6Watts - sse.measurementWatts) ** 2 -
					(sse.hN6Watts - sse.measurementWatts) ** 2 -
					sse.n6.deltaSseWattsSquared,
			) < 1e-12,
		);
	}
	const unresolved = structuredClone(inputs);
	unresolved[0] = {
		...unresolved[0],
		target: unresolved[0].target.map((row, i) => (i === 4 ? {...row, allowance: null} : row)),
	};
	const missing = assessMatchedAltitudeResponse(unresolved);
	check(missing.inputAdmission === 'unresolved' && missing.primaryQualification === 'unresolved');
	check(missing.groups[0].primaryNorm.state === 'unresolved');
	// N5 cancels from the endpoint tail allowance even when its separate response is unresolved.
	check(missing.tails[0].observed.allowance !== null);
	const alteredPrefix = structuredClone(inputs);
	alteredPrefix[0] = {
		...alteredPrefix[0],
		target: alteredPrefix[0].target.map((row, i) => (i === 3 ? {...row, value: row.value + 1} : row)),
	};
	rejects(() => assessMatchedAltitudeResponse(alteredPrefix));
	const alteredPrediction = structuredClone(inputs);
	alteredPrediction[0] = {
		...alteredPrediction[0],
		prediction: {...alteredPrediction[0].prediction, reason: 'retuned'},
	};
	rejects(() => assessMatchedAltitudeResponse(alteredPrediction));
	rejects(() => assessMatchedAltitudeResponse([...inputs].reverse()));
	rejects(() => assessMatchedAltitudeResponse(inputs.slice(1)));
	return {schemaId: 'sky-matched-p55-response-assessment-proof-v1', checks};
}
