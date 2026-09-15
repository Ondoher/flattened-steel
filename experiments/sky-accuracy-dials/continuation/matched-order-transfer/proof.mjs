import assert from 'node:assert/strict';
import {predictMatchedAltitudeOrders} from './index.mjs';

/** Exercise exact transient models, propagated uncertainty and held-input rejection.
 * @returns {{schemaId:string,checks:number}} Focused algebraic evidence, no physical execution.
 */
export function matchedOrderTransferProof() {
	let checks = 0;
	const h = [2, 3, 3.5, 3.75, 3.875, 3.9375];
	const p = [1.8];
	for (const [index, ratio] of [-0.2, -0.15, -0.125].map(Math.exp).entries())
		p.push(p.at(-1) + ratio * (h[index + 1] - h[index]));
	/** @type {SkyOrderTransferInput} */ const input = {
		probeId: 'manufactured',
		channel: 0,
		h: h.map((value) => ({value, allowance: 1e-8})),
		p: p.map((value) => ({value, allowance: 1e-8})),
	};
	const predicted = predictMatchedAltitudeOrders(input);
	assert.ok(predicted.admitted);
	checks++;
	assert.ok(Math.abs(predicted.diagnostics.beta - 0.5) < 1e-12);
	checks++;
	const damped = predicted.forecasts[0];
	for (const [index, expected] of [-0.1125, -0.10625].map(Math.exp).entries()) {
		assert.ok(Math.abs(damped.ratios[index] - expected) < 1e-13);
		checks++;
	}
	for (let mask = 0; mask < 1024; mask++) {
		const perturb = (/** @type {SkyOrderTransferValue} */ row, /** @type {number} */ index) => ({
			value: row.value + (mask & (1 << index) ? 1 : -1) * row.allowance,
			allowance: 0,
		});
		const corner = predictMatchedAltitudeOrders({
			...input,
			h: input.h.map(perturb),
			p: input.p.map((row, i) => perturb(row, i + 6)),
		});
		assert.ok(corner.admitted);
		checks++;
		for (const [modelIndex, model] of corner.forecasts.entries())
			for (const [index, row] of [...model.responses, model.tail].entries()) {
				const expected = [...predicted.forecasts[modelIndex].responses, predicted.forecasts[modelIndex].tail][
					index
				].interval;
				assert.ok(row.value >= expected.low && row.value <= expected.high);
				checks++;
			}
	}
	assert.equal(
		predictMatchedAltitudeOrders({
			...input,
			p: input.p.map((row, i) => (i === 0 ? {...row, allowance: null} : row)),
		}).admitted,
		false,
	);
	checks++;
	assert.equal(predictMatchedAltitudeOrders({...input, p: input.h.slice(0, 4)}).admitted, false);
	checks++;
	assert.equal(
		predictMatchedAltitudeOrders({...input, h: input.h.map((row, i) => (i === 1 ? input.h[0] : row))}).admitted,
		false,
	);
	checks++;
	assert.throws(() => predictMatchedAltitudeOrders({...input, p: [...input.p, input.p[3]]}));
	checks++;
	assert.throws(() =>
		predictMatchedAltitudeOrders({...input, h: input.h.map((row, i) => (i === 0 ? {...row, allowance: -1} : row))}),
	);
	checks++;
	return {schemaId: 'sky-matched-altitude-order-prediction-proof-v1', checks};
}
