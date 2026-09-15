import assert from 'node:assert/strict';
import {
	sourceAuditGeometry,
	sourceAuditTrapezoid,
	evaluateSourceAuditFinite,
	evaluateSourceAuditReference,
	admitSourceAuditReference,
	predictSourceAudit,
	assessSourceAudit,
	sourceAuditGroups,
} from './index.mjs';

/** Manufactured-only proof: never loads C0, a capture, or an actual pilot coordinate.
 * @returns {{schemaId:string,checks:number,physicalPilotEvaluated:false}}
 */
export function sourceColumnAuditProof() {
	let checks = 0;
	const check = (/** @type {unknown} */ value) => {
			assert.ok(value);
			checks++;
		},
		rejects = (/** @type {()=>unknown} */ operation) => {
			assert.throws(operation);
			checks++;
		},
		close = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ epsilon = 1e-12) =>
			check(Math.abs(a - b) <= epsilon * Math.max(1, Math.abs(a), Math.abs(b)));
	// This deliberately minimal manufactured spec supplies every physical-core input.
	const spec = /** @type {SkyTransportSpec} */ (
		/** @type {unknown} */ ({
			planet: {bottomRadiusMeters: 100000, topRadiusMeters: 101000},
			atmosphere: {
				rayleighScaleHeightMeters: 1200,
				mieScaleHeightMeters: 300,
				mieSingleScatteringAlbedo: 0.9,
				miePhaseFunctionG: 0.7,
				ozone: {absorptionEnabled: false},
			},
			domains: {
				spectrum: {
					channels: Array.from({length: 9}, (_, channel) => ({
						rayleighScatteringPerMeter: channel === 8 ? 2e-5 : 1e-5,
						mieExtinctionPerMeter: 3e-6,
						sourceIrradianceDensityWattsPerSquareMeterPerNanometer: 1,
					})),
				},
			},
		})
	);
	const coordinate = /** @type {SkySourceAuditCoordinate} */ ({
			id: 'manufactured:radial',
			kind: 'sample',
			probeIds: [],
			point: [0, 0, 100000],
			altitudeMeters: 0,
			solarCosine: 1,
		}),
		geometry = sourceAuditGeometry(spec, coordinate),
		work = {mediumEvaluations: 0, columnCalls: 0, trapezoidEvaluations: 0};
	close(geometry.length, 1000);
	close(geometry.referenceLength, 1000);
	check(geometry.convex);
	const quadratic80 = sourceAuditTrapezoid((s) => 1 + s * s, 1, 80),
		quadratic160 = sourceAuditTrapezoid((s) => 1 + s * s, 1, 160);
	close(quadratic160 - quadratic80, -2 / (16 * 80 ** 2));
	close((quadratic160 - 4 / 3) / (quadratic80 - 4 / 3), 0.25, 1e-8);
	close(
		sourceAuditTrapezoid(() => 3, 2, 80),
		6,
	);
	close(
		sourceAuditTrapezoid(() => 3, 0, 80),
		0,
	);
	rejects(() => sourceAuditTrapezoid(() => NaN, 1, 80));
	rejects(() => sourceAuditTrapezoid(() => 1, -1, 80));
	rejects(() => sourceAuditGeometry(spec, {...coordinate, solarCosine: -0.1}));
	rejects(() => sourceAuditGeometry(spec, {...coordinate, altitudeMeters: NaN}));
	check(!sourceAuditGeometry(spec, {...coordinate, solarCosine: 0}).convex);
	const baseline = evaluateSourceAuditFinite(spec, geometry, 80, work),
		passes = evaluateSourceAuditReference(spec, geometry, work, () => {});
	check(work.columnCalls === 4);
	check(work.trapezoidEvaluations === 162);
	const reference = admitSourceAuditReference(spec, geometry, passes, 0),
		prediction = predictSourceAudit(spec, coordinate, geometry, baseline, reference);
	check(reference.resolved);
	check(prediction.predictedDeltaTau < 0 && prediction.predictedDeltaTransmission > 0);
	const exactTau = 1e-5 * 1200 * -Math.expm1(-1000 / 1200) + 3e-6 * 300 * -Math.expm1(-1000 / 300);
	check(Math.abs(reference.tau - exactTau) <= reference.allowance + 1e-12);
	// Synthetic target is the exact analytic integral plus a manufactured quarter error.
	const targetTau = exactTau + (prediction.baselineTau - exactTau) / 4,
		assessment = assessSourceAudit(prediction, targetTau);
	check(Object.values(assessment.checks).every((state) => state === 'passed'));
	check(
		assessSourceAudit(prediction, prediction.baselineTau + Math.abs(prediction.predictedDeltaTau)).checks.sign ===
			'failed',
	);
	check(assessSourceAudit(prediction, prediction.baselineTau + 1).checks.improvement === 'failed');
	rejects(() => assessSourceAudit(prediction, NaN));
	rejects(() => predictSourceAudit(spec, coordinate, geometry, {...baseline, intervals: 160}, reference));
	const zero = {
		...prediction,
		baselineTau: 0,
		baselineTransmission: 1,
		predictedDeltaTau: 0,
		predictedDeltaTransmission: 0,
		reference: {...reference, tau: 0, allowance: 0},
	};
	check(assessSourceAudit(zero, 0).checks.ratio === 'unresolved');
	check(assessSourceAudit(zero, 0).checks.sign === 'unresolved');
	const failedPasses = passes.map((pass, i) =>
		i ? pass : {...pass, columns: {...pass.columns, converged: false, reason: 'manufactured failure'}},
	);
	check(!admitSourceAuditReference(spec, geometry, failedPasses, 0).resolved);
	const inconsistent = passes.map((pass, i) =>
		i ? pass : {...pass, columns: {...pass.columns, rayleighMeters: pass.columns.rayleighMeters + 1000}},
	);
	check(!admitSourceAuditReference(spec, geometry, inconsistent, 0).resolved);
	const interruptedWork = {mediumEvaluations: 0, columnCalls: 0, trapezoidEvaluations: 0};
	let guardCalls = 0;
	rejects(() =>
		evaluateSourceAuditReference(spec, geometry, interruptedWork, () => {
			if (++guardCalls === 2) throw new Error('manufactured cancellation');
		}),
	);
	check(interruptedWork.columnCalls === 1 && interruptedWork.mediumEvaluations > 0);
	for (const bad of [-1, NaN, Infinity])
		rejects(() => predictSourceAudit(spec, coordinate, geometry, baseline, {...reference, allowance: bad}));
	const baselineError = Math.abs(prediction.baselineTau - reference.tau);
	check(assessSourceAudit(prediction, reference.tau + baselineError * 0.5).checks.ratio === 'failed');
	check(
		assessSourceAudit(
			{...prediction, reference: {...reference, allowance: baselineError / 10}},
			reference.tau + baselineError / 4,
		).checks.ratio === 'unresolved',
	);
	/** @type {SkySourceAuditPredictionRow[]} */ const groupRows = [];
	for (const probeId of ['p-0930-5-7', 'p-1230-3-5'])
		for (const kind of /** @type {const} */ (['sample', 'knot']))
			for (let i = 0; i < 4; i++) {
				const point = {...coordinate, id: `${kind}:${probeId}:${i}`, probeIds: [probeId], kind};
				groupRows.push({
					coordinate: point,
					geometry,
					baseline,
					passes,
					forecasts: [0, 8].map((channel) => ({
						...prediction,
						coordinateId: point.id,
						channel,
						reference: {...reference, channel},
					})),
				});
			}
	const groupActual = groupRows.flatMap((row) =>
			row.forecasts.map((p) => assessSourceAudit(p, p.baselineTau + p.predictedDeltaTau)),
		),
		groups = sourceAuditGroups(groupRows, groupActual);
	check(groups.length === 8);
	check(groups.every((group) => group.magnitude === 'passed' && group.sign === 'passed'));
	rejects(() => sourceAuditGroups(groupRows, groupActual.slice(1)));
	rejects(() =>
		sourceAuditGroups(
			groupRows,
			groupActual.map(() => groupActual[0]),
		),
	);
	const zeroRows = groupRows.map((row) => ({
			...row,
			forecasts: row.forecasts.map((p) => ({...p, predictedDeltaTau: 0, predictedDeltaTransmission: 0})),
		})),
		zeroActual = zeroRows.flatMap((row) => row.forecasts.map((p) => assessSourceAudit(p, p.baselineTau)));
	check(
		sourceAuditGroups(zeroRows, zeroActual).every(
			(group) => group.magnitude === 'unresolved' && group.sign === 'unresolved',
		),
	);
	return {schemaId: 'sky-source-column-proof-v1', checks, physicalPilotEvaluated: false};
}
