import assert from 'node:assert/strict';

/** Pad a finite arithmetic result outwards at its operand/result scale.
 * @param {number} low - Lower computed endpoint.
 * @param {number} high - Upper computed endpoint.
 * @param {number} [scale] - Material operand magnitude for cancellation.
 * @returns {SkyOrderTransferInterval} Conservative binary64 arithmetic padding.
 */
function interval(low, high, scale = Math.max(Math.abs(low), Math.abs(high))) {
	assert.ok(Number.isFinite(low) && Number.isFinite(high) && low <= high);
	const pad = Math.max(Number.MIN_VALUE, 32 * Number.EPSILON * scale);
	return {low: low - pad, high: high + pad};
}
/** Add finite intervals.
 * @param {SkyOrderTransferInterval} a - First input.
 * @param {SkyOrderTransferInterval} b - Second input.
 * @returns {SkyOrderTransferInterval} Padded sum.
 */
function add(a, b) {
	return interval(
		a.low + b.low,
		a.high + b.high,
		Math.max(Math.abs(a.low), Math.abs(a.high), Math.abs(b.low), Math.abs(b.high)),
	);
}
/** Subtract finite intervals.
 * @param {SkyOrderTransferInterval} a - First input.
 * @param {SkyOrderTransferInterval} b - Second input.
 * @returns {SkyOrderTransferInterval} Padded difference.
 */
function sub(a, b) {
	return add(a, {low: -b.high, high: -b.low});
}
/** Multiply finite intervals, including signed responses.
 * @param {SkyOrderTransferInterval} a - First input.
 * @param {SkyOrderTransferInterval} b - Second input.
 * @returns {SkyOrderTransferInterval} Padded product.
 */
function mul(a, b) {
	const values = [a.low * b.low, a.low * b.high, a.high * b.low, a.high * b.high];
	return interval(Math.min(...values), Math.max(...values));
}
/** Divide by a strictly positive interval.
 * @param {SkyOrderTransferInterval} a - Numerator.
 * @param {SkyOrderTransferInterval} b - Positive denominator.
 * @returns {SkyOrderTransferInterval} Padded quotient.
 */
function div(a, b) {
	assert.ok(b.low > 0);
	return mul(a, interval(1 / b.high, 1 / b.low));
}
/** Apply the increasing logarithm.
 * @param {SkyOrderTransferInterval} a - Positive input interval.
 * @returns {SkyOrderTransferInterval} Padded logarithm.
 */
function log(a) {
	assert.ok(a.low > 0);
	return interval(Math.log(a.low), Math.log(a.high));
}
/** Apply the increasing exponential.
 * @param {SkyOrderTransferInterval} a - Finite logarithmic input.
 * @returns {SkyOrderTransferInterval} Padded exponential.
 */
function exp(a) {
	return interval(Math.exp(a.low), Math.exp(a.high));
}
/** Preserve a central response and its input-only uncertainty.
 * @param {number} value - Exact nominal model output.
 * @param {SkyOrderTransferInterval} bounds - Propagated parent intervals.
 * @returns {SkyOrderTransferForecastValue} Complete model output.
 */
function forecast(value, bounds) {
	assert.ok(Number.isFinite(value) && value >= bounds.low && value <= bounds.high);
	return {value, allowance: Math.max(value - bounds.low, bounds.high - value), interval: bounds};
}

/** Predict held P55 order-five/six responses from original lower orders and matched H.
 * No P55 order-five/six input is accepted. Interval arithmetic propagates input
 * uncertainty; it does not estimate unknown model bias or recurrence accuracy.
 * @param {SkyOrderTransferInput} input - Exact cumulative H1..H6 and P1..P4.
 * @returns {SkyOrderTransferPrediction} Both frozen models or explicit unresolved admission.
 */
export function predictMatchedAltitudeOrders(input) {
	assert.ok(typeof input.probeId === 'string' && input.probeId.length > 0 && Number.isInteger(input.channel));
	assert.equal(input.h.length, 6);
	assert.equal(input.p.length, 4, 'Held target N5/N6 cannot enter the predictor.');
	const unresolved = (/** @type {string} */ reason) => ({
		probeId: input.probeId,
		channel: input.channel,
		admitted: false,
		reason,
		diagnostics: null,
		forecasts: [],
	});
	for (const row of [...input.h, ...input.p]) {
		assert.ok(Number.isFinite(row.value));
		if (row.allowance === null) return unresolved('A parent fixed-field envelope is unadmitted.');
		assert.ok(Number.isFinite(row.allowance) && row.allowance >= 0);
	}
	const h = input.h.map((row) => interval(row.value - row.allowance, row.value + row.allowance));
	const p = input.p.map((row) => interval(row.value - row.allowance, row.value + row.allowance));
	const hi = h.slice(1).map((row, i) => sub(row, h[i]));
	const pi = p.slice(1).map((row, i) => sub(row, p[i]));
	if ([...hi, ...pi].some((row) => row.low <= 0))
		return unresolved('A required effective increment is not positive beyond its input allowance.');
	const hValues = input.h.slice(1).map((row, i) => row.value - input.h[i].value);
	const pValues = input.p.slice(1).map((row, i) => row.value - input.p[i].value);
	const ratios = pi.map((row, i) => div(row, hi[i]));
	const logs = ratios.map(log),
		d3i = sub(logs[1], logs[0]),
		d4i = sub(logs[2], logs[1]);
	if (d3i.low <= 0 || d4i.low <= 0 || d4i.high >= d3i.low)
		return unresolved('The complete lower-order slope intervals do not establish 0 < d4 < d3.');
	const betaInterval = div(d4i, d3i);
	if (betaInterval.low <= 0 || betaInterval.high >= 1)
		return unresolved('The damping interval does not lie strictly between zero and one.');
	const q = pValues.map((value, i) => value / hValues[i]),
		u = q.map(Math.log);
	const d3 = u[1] - u[0],
		d4 = u[2] - u[1],
		beta = d4 / d3;
	/** @type {SkyOrderTransferForecast[]} */ const forecasts = [];
	for (const model of /** @type {const} */ (['damped-log-ratio', 'last-log-step'])) {
		const damped = model === 'damped-log-ratio';
		const step = damped ? mul(betaInterval, d4i) : d4i;
		const next = damped ? mul(betaInterval, step) : step;
		const first = add(logs[2], step),
			second = add(first, next);
		const n5 = u[2] + (damped ? beta * d4 : d4),
			n6 = n5 + (damped ? beta * beta * d4 : d4);
		const ratioValues = [Math.exp(n5), Math.exp(n6)];
		const responses = [first, second].map((row, i) =>
			forecast((ratioValues[i] - 1) * hValues[i + 3], mul(sub(exp(row), {low: 1, high: 1}), hi[i + 3])),
		);
		forecasts.push({
			model,
			ratios: ratioValues,
			responses,
			tail: forecast(responses[0].value + responses[1].value, add(responses[0].interval, responses[1].interval)),
		});
	}
	return {
		probeId: input.probeId,
		channel: input.channel,
		admitted: true,
		reason: null,
		diagnostics: {ratios: q, d3, d4, beta, betaInterval},
		forecasts,
	};
}
