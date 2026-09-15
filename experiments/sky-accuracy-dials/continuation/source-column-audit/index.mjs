import assert from 'node:assert/strict';
import {createPhysicalMethodBudget, integrateColumns, validatePhysicalSpec} from '../reference/physical/columns.mjs';
import {volumeSphereExit} from '../volume-reference/geometry.mjs';
import {volumeAttenuation} from '../volume-reference/method.mjs';

export const sourceAuditPolicy = Object.freeze({
	schemaId: 'sky-source-column-policy-v1',
	baselineIntervals: 80,
	targetIntervals: 160,
	channels: Object.freeze([0, 8]),
	maximumCoordinates: 128,
	maximumMediumEvaluations: 2000000,
	referenceScales: Object.freeze([4, 1]),
	absoluteTauTolerance: 1e-9,
	relativeTauTolerance: 1e-8,
	significanceMultiplier: 5,
	arithmeticFloor: 1e-10,
	maximumRelativeError: 0.25,
	ratioMinimum: 3 / 16,
	ratioMaximum: 5 / 16,
	minimumResolvedSigns: 4,
	minimumSignAgreement: 0.9,
});
/** @param {number} tau @returns {number} */
const tauTolerance = (tau) => 1e-9 + 1e-8 * Math.abs(tau);
/** @param {number} value @returns {void} */
function nonnegative(value) {
	assert.ok(Number.isFinite(value) && value >= 0);
}
/** @param {SkyTransportSpec} spec @param {number} channel @returns {SkyTransportSpec['domains']['spectrum']['channels'][number]} */
function spectral(spec, channel) {
	assert.ok(Number.isInteger(channel) && channel >= 0 && channel < spec.domains.spectrum.channels.length);
	return spec.domains.spectrum.channels[channel];
}
/** Rotate the anchored source ray, preserving its exact stored height and cosine.
 * Only outward, lit source paths are supported by this pilot. This is binary64
 * evaluation of the compiler equation, not a claim about GPU arithmetic parity.
 * @param {SkyTransportSpec} spec @param {Pick<SkySourceAuditCoordinate,'altitudeMeters'|'solarCosine'>} coordinate
 * @returns {SkySourceAuditGeometry}
 */
export function sourceAuditGeometry(spec, coordinate) {
	validatePhysicalSpec(spec);
	const height = coordinate.altitudeMeters,
		mu = coordinate.solarCosine;
	nonnegative(height);
	assert.ok(Number.isFinite(mu) && mu >= 0 && mu <= 1, 'Pilot requires a lit outward source path.');
	const bottom = spec.planet.bottomRadiusMeters,
		top = spec.planet.topRadiusMeters,
		radius = bottom + height,
		projection = radius * mu;
	assert.ok(radius <= top);
	const topTerm = (height - (top - bottom)) * (radius + top),
		root = Math.sqrt(Math.max(0, projection * projection - topTerm)),
		length = projection + root === 0 ? 0 : -topTerm / (projection + root);
	const referenceOrigin = /** @type {SkyVector3} */ ([0, 0, radius]),
		referenceDirection = /** @type {SkyVector3} */ ([Math.sqrt(Math.max(0, 1 - mu * mu)), 0, mu]),
		referenceLength = volumeSphereExit(referenceOrigin, referenceDirection, top);
	const convex = [spec.atmosphere.rayleighScaleHeightMeters, spec.atmosphere.mieScaleHeightMeters].every(
		(scale) => mu * mu >= scale / (radius + scale),
	);
	return {radius, projection, height, length, referenceLength, referenceOrigin, referenceDirection, convex};
}
/** Compiler's anchored, cancellation-resistant altitude expression.
 * @param {SkySourceAuditGeometry} geometry @param {number} distance @returns {number}
 */
function altitude(geometry, distance) {
	const difference = distance * (2 * geometry.projection + distance);
	return Math.max(
		0,
		geometry.height + difference / (Math.sqrt(Math.max(0, geometry.radius ** 2 + difference)) + geometry.radius),
	);
}
/** Complete trapezoid rule, also used by manufactured polynomial proofs.
 * @param {(distance:number)=>number} evaluate @param {number} length @param {number} intervals @returns {number}
 */
export function sourceAuditTrapezoid(evaluate, length, intervals) {
	nonnegative(length);
	assert.ok(Number.isInteger(intervals) && intervals > 0 && intervals <= 160);
	const step = length / intervals;
	let sum = 0;
	for (let index = 0; index <= intervals; index++) {
		const value = evaluate(step * index);
		assert.ok(Number.isFinite(value));
		sum += value * step * (index === 0 || index === intervals ? 0.5 : 1);
	}
	return sum;
}
/** Evaluate the finite source rule only at the explicit requested count.
 * Prediction callers use 80; only the separately authenticated target runner uses 160.
 * @param {SkyTransportSpec} spec @param {SkySourceAuditGeometry} geometry @param {80|160} intervals
 * @param {SkySourceAuditWork} work @returns {SkySourceAuditFinite}
 */
export function evaluateSourceAuditFinite(spec, geometry, intervals, work) {
	assert.ok(intervals === 80 || intervals === 160);
	const evaluate = (/** @type {number} */ scale) =>
		sourceAuditTrapezoid((distance) => Math.exp(-altitude(geometry, distance) / scale), geometry.length, intervals);
	const rayleighMeters = evaluate(spec.atmosphere.rayleighScaleHeightMeters),
		mieMeters = evaluate(spec.atmosphere.mieScaleHeightMeters),
		evaluations = 2 * (intervals + 1);
	work.trapezoidEvaluations += evaluations;
	return {intervals, rayleighMeters, mieMeters, evaluations};
}
/** @param {SkyTransportSpec} spec @param {{rayleighMeters:number,mieMeters:number}} columns @param {number} channel @returns {number} */
export function sourceAuditTau(spec, columns, channel) {
	const coefficients = spectral(spec, channel);
	nonnegative(columns.rayleighMeters);
	nonnegative(columns.mieMeters);
	return (
		coefficients.rayleighScatteringPerMeter * columns.rayleighMeters +
		coefficients.mieExtinctionPerMeter * columns.mieMeters
	);
}
/** Independent adaptive rules retain every pass and share each method's original caps.
 * The global counter is updated even when a deadline guard interrupts a pass.
 * @param {SkyTransportSpec} spec @param {SkySourceAuditGeometry} geometry @param {SkySourceAuditWork} work
 * @param {()=>void} guard @returns {SkySourceAuditPass[]}
 */
export function evaluateSourceAuditReference(spec, geometry, work, guard) {
	/** @type {SkySourceAuditPass[]} */ const passes = [];
	for (const method of /** @type {const} */ (['gauss', 'simpson'])) {
		const budget = createPhysicalMethodBudget(method, 'standard', () => {
			assert.ok(work.mediumEvaluations + budget.mediumEvaluations <= sourceAuditPolicy.maximumMediumEvaluations);
			guard();
		});
		budget.maximumMediumEvaluations = Math.min(
			budget.maximumMediumEvaluations,
			sourceAuditPolicy.maximumMediumEvaluations - work.mediumEvaluations,
		);
		try {
			for (const scale of sourceAuditPolicy.referenceScales) {
				guard();
				budget.toleranceScale = scale;
				passes.push({
					method,
					scale,
					columns: integrateColumns(
						spec,
						geometry.referenceOrigin,
						geometry.referenceDirection,
						geometry.referenceLength,
						method,
						budget,
					),
				});
			}
		} finally {
			work.mediumEvaluations += budget.mediumEvaluations;
			work.columnCalls += budget.columnCalls;
		}
		assert.ok(work.mediumEvaluations <= sourceAuditPolicy.maximumMediumEvaluations);
	}
	return passes;
}
/** Apply the independent column tolerance policy in optical-depth units.
 * Original failed comparisons are never removed. The allowance is empirical.
 * @param {SkyTransportSpec} spec @param {SkySourceAuditGeometry} geometry
 * @param {readonly SkySourceAuditPass[]} passes @param {number} channel @returns {SkySourceAuditReference}
 */
export function admitSourceAuditReference(spec, geometry, passes, channel) {
	assert.deepEqual(
		passes.map(({method, scale}) => [method, scale]),
		[
			['gauss', 4],
			['gauss', 1],
			['simpson', 4],
			['simpson', 1],
		],
	);
	const coefficients = spectral(spec, channel),
		reasons = [];
	const geometryAllowance =
		Math.abs(geometry.length - geometry.referenceLength) *
		(coefficients.rayleighScatteringPerMeter + coefficients.mieExtinctionPerMeter);
	const usable = passes.every(({columns: c}) =>
		[c.rayleighMeters, c.mieMeters, c.errorRayleighMeters, c.errorMieMeters].every(
			(v) => v !== null && Number.isFinite(v) && v >= 0,
		),
	);
	for (const pass of passes)
		if (!pass.columns.converged)
			reasons.push(`${pass.method}/${pass.scale}: ${pass.columns.reason ?? 'unresolved'}`);
	if (!usable) reasons.push('Missing or invalid independent columns.');
	if (!usable)
		return {
			channel,
			tau: null,
			allowance: null,
			transmission: null,
			transmissionAllowance: null,
			geometryAllowance,
			resolved: false,
			reasons,
		};
	const taus = passes.map((pass) => sourceAuditTau(spec, pass.columns, channel)),
		errors = passes.map(
			({columns}) =>
				coefficients.rayleighScatteringPerMeter * columns.errorRayleighMeters +
				coefficients.mieExtinctionPerMeter * columns.errorMieMeters,
		),
		differences = [Math.abs(taus[0] - taus[1]), Math.abs(taus[2] - taus[3]), Math.abs(taus[1] - taus[3])];
	for (const i of [0, 2]) {
		if (Math.abs(taus[i] - taus[i + 1]) > 4 * tauTolerance(taus[i]) + tauTolerance(taus[i + 1]))
			reasons.push(`${passes[i].method} coarse/fine disagreement.`);
		if (errors[i + 1] > tauTolerance(taus[i + 1]))
			reasons.push(`${passes[i].method} fine estimated remainder exceeds tolerance.`);
	}
	if (differences[2] > tauTolerance(taus[1]) + tauTolerance(taus[3]))
		reasons.push('Independent fine rules disagree.');
	const tau = (taus[1] + taus[3]) / 2,
		allowance = reasons.length ? null : 2 * Math.max(...differences, errors[1], errors[3]) + geometryAllowance,
		transmission = Math.exp(-tau),
		transmissionAllowance = allowance === null ? null : volumeAttenuation(tau, allowance).allowance;
	return {
		channel,
		tau,
		allowance,
		transmission,
		transmissionAllowance,
		geometryAllowance,
		resolved: reasons.length === 0,
		reasons,
	};
}
/** Leading Euler-Maclaurin response forecast uses no held S160 evaluation.
 * @param {SkyTransportSpec} spec @param {SkySourceAuditCoordinate} coordinate @param {SkySourceAuditGeometry} geometry
 * @param {SkySourceAuditFinite} baseline @param {SkySourceAuditReference} reference @returns {SkySourceAuditForecast}
 */
export function predictSourceAudit(spec, coordinate, geometry, baseline, reference) {
	assert.equal(baseline.intervals, 80);
	const channel = reference.channel,
		coefficients = spectral(spec, channel);
	assert.equal(reference.resolved, reference.allowance !== null);
	if (reference.allowance !== null) {
		nonnegative(reference.allowance);
		nonnegative(reference.tau);
	}
	const derivative = (/** @type {number} */ distance) => {
		const height = altitude(geometry, distance),
			radius = spec.planet.bottomRadiusMeters + height,
			mu = (geometry.projection + distance) / radius;
		return (
			-mu *
			((coefficients.rayleighScatteringPerMeter * Math.exp(-height / spec.atmosphere.rayleighScaleHeightMeters)) /
				spec.atmosphere.rayleighScaleHeightMeters +
				(coefficients.mieExtinctionPerMeter * Math.exp(-height / spec.atmosphere.mieScaleHeightMeters)) /
					spec.atmosphere.mieScaleHeightMeters)
		);
	};
	const baselineTau = sourceAuditTau(spec, baseline, channel),
		baselineTransmission = Math.exp(-baselineTau),
		endpointDerivativeDifference = derivative(geometry.length) - derivative(0),
		predictedDeltaTau = (-((geometry.length / 80) ** 2) * endpointDerivativeDifference) / 16,
		predictedDeltaTransmission = baselineTransmission * Math.expm1(-predictedDeltaTau);
	assert.ok(
		[
			baselineTau,
			baselineTransmission,
			endpointDerivativeDifference,
			predictedDeltaTau,
			predictedDeltaTransmission,
		].every(Number.isFinite),
	);
	return {
		coordinateId: coordinate.id,
		channel,
		convex: geometry.convex,
		baselineTau,
		baselineTransmission,
		endpointDerivativeDifference,
		predictedDeltaTau,
		predictedDeltaTransmission,
		expectedErrorRatio: 0.25,
		reference,
	};
}
/** Retain endpoint forecast, source-error ordering, reduction and rate as separate gates.
 * @param {SkySourceAuditForecast} prediction @param {number} targetTau @returns {SkySourceAuditAssessment}
 */
export function assessSourceAudit(prediction, targetTau) {
	nonnegative(targetTau);
	const p = prediction,
		targetTransmission = Math.exp(-targetTau),
		actualDeltaTau = targetTau - p.baselineTau,
		actualDeltaTransmission = p.baselineTransmission * Math.expm1(-actualDeltaTau),
		u = p.reference.allowance,
		floor = sourceAuditPolicy.arithmeticFloor,
		resolved = p.reference.resolved && u !== null,
		significant = resolved && Math.abs(p.predictedDeltaTau) > 5 * u + floor;
	/** @type {Record<string,SkySourceAuditState>} */ const checks = {};
	checks.reference = resolved ? 'passed' : 'unresolved';
	checks.tauMagnitude = !significant
		? 'unresolved'
		: Math.abs(actualDeltaTau - p.predictedDeltaTau) <= 0.25 * Math.abs(p.predictedDeltaTau) + floor
			? 'passed'
			: 'failed';
	checks.transmissionMagnitude = !significant
		? 'unresolved'
		: Math.abs(actualDeltaTransmission - p.predictedDeltaTransmission) <=
			  0.25 * Math.abs(p.predictedDeltaTransmission) + floor
			? 'passed'
			: 'failed';
	checks.sign =
		!significant || Math.abs(actualDeltaTau) <= floor
			? 'unresolved'
			: Math.sign(actualDeltaTau) === Math.sign(p.predictedDeltaTau)
				? 'passed'
				: 'failed';
	const baselineErrorTau = p.reference.tau === null ? null : p.baselineTau - p.reference.tau,
		targetErrorTau = p.reference.tau === null ? null : targetTau - p.reference.tau;
	let errorRatio = null,
		errorRatioInterval = null;
	checks.convexOrdering =
		!resolved || !p.convex
			? 'unresolved'
			: p.baselineTau + floor >= targetTau && targetErrorTau >= -u - floor
				? 'passed'
				: 'failed';
	checks.improvement = !resolved
		? 'unresolved'
		: Math.abs(baselineErrorTau) - Math.abs(targetErrorTau) > 2 * u + floor
			? 'passed'
			: Math.abs(targetErrorTau) - Math.abs(baselineErrorTau) > 2 * u + floor
				? 'failed'
				: 'unresolved';
	checks.ratio = 'unresolved';
	if (resolved && Math.abs(baselineErrorTau) > 5 * u + floor) {
		errorRatio = Math.abs(targetErrorTau) / Math.abs(baselineErrorTau);
		errorRatioInterval = [
			Math.max(0, Math.abs(targetErrorTau) - u) / (Math.abs(baselineErrorTau) + u),
			(Math.abs(targetErrorTau) + u) / (Math.abs(baselineErrorTau) - u),
		];
		checks.ratio =
			errorRatioInterval[0] >= 3 / 16 && errorRatioInterval[1] <= 5 / 16
				? 'passed'
				: errorRatioInterval[1] < 3 / 16 || errorRatioInterval[0] > 5 / 16
					? 'failed'
					: 'unresolved';
	}
	return {
		coordinateId: p.coordinateId,
		channel: p.channel,
		targetTau,
		targetTransmission,
		actualDeltaTau,
		actualDeltaTransmission,
		baselineErrorTau,
		targetErrorTau,
		errorRatio,
		errorRatioInterval,
		checks,
	};
}
/** Fixed ray/channel/scope vector gates never dilute response error with baseline T.
 * Samples and supporting knots remain distinct groups; shared knots are explicit.
 * @param {readonly SkySourceAuditPredictionRow[]} predictions @param {readonly SkySourceAuditAssessment[]} actual
 * @returns {readonly {probeId:string,channel:number,kind:string,count:number,resolvedSigns:number,signAgreement:number|null,relativeResponseError:number|null,magnitude:SkySourceAuditState,sign:SkySourceAuditState}[]}
 */
export function sourceAuditGroups(predictions, actual) {
	assert.equal(actual.length, predictions.length * 2);
	assert.equal(new Set(actual.map((r) => `${r.coordinateId}:${r.channel}`)).size, actual.length);
	return ['p-0930-5-7', 'p-1230-3-5'].flatMap((probeId) =>
		[0, 8].flatMap((channel) =>
			['sample', 'knot'].map((kind) => {
				const selected = predictions.filter(
					(row) => row.coordinate.kind === kind && row.coordinate.probeIds.includes(probeId),
				);
				assert.ok(selected.length >= 4);
				let predictedSquare = 0,
					errorSquare = 0,
					uncertaintySquare = 0,
					resolvedSigns = 0,
					passedSigns = 0,
					allReferences = true;
				for (const row of selected) {
					const p = row.forecasts.find((item) => item.channel === channel),
						a = actual.find((item) => item.coordinateId === row.coordinate.id && item.channel === channel);
					assert.ok(p && a);
					allReferences &&= p.reference.resolved;
					predictedSquare += p.predictedDeltaTransmission ** 2;
					errorSquare += (a.actualDeltaTransmission - p.predictedDeltaTransmission) ** 2;
					uncertaintySquare += (p.reference.transmissionAllowance ?? 0) ** 2;
					if (a.checks.sign !== 'unresolved') {
						resolvedSigns++;
						if (a.checks.sign === 'passed') passedSigns++;
					}
				}
				const norm = Math.sqrt(predictedSquare),
					significant = allReferences && norm > 5 * Math.sqrt(uncertaintySquare) + 1e-10,
					relativeResponseError = norm > 0 ? Math.sqrt(errorSquare) / norm : null,
					signAgreement = resolvedSigns ? passedSigns / resolvedSigns : null;
				return {
					probeId,
					channel,
					kind,
					count: selected.length,
					resolvedSigns,
					signAgreement,
					relativeResponseError,
					magnitude: /** @type {SkySourceAuditState} */ (
						!significant
							? 'unresolved'
							: Math.sqrt(errorSquare) <= 0.25 * norm + 1e-10
								? 'passed'
								: 'failed'
					),
					sign: /** @type {SkySourceAuditState} */ (
						!allReferences || resolvedSigns < 4 ? 'unresolved' : signAgreement >= 0.9 ? 'passed' : 'failed'
					),
				};
			}),
		),
	);
}
