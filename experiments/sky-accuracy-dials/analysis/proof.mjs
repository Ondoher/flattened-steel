import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {acceptControls, createProductQuadrature, gaussLegendre} from '../numerics/profile.js';
import {
	ALL_CHANNELS,
	ALL_RAYS,
	CAPTURE_TIMES,
	RADIANCE_UNITS,
	SCORE_CHANNELS,
	SCREEN_SELECTION,
	parseBoundaryTsv,
	selectBoundary,
} from './boundary.mjs';
import {
	factorialContrast,
	geometricStrata,
	scoreBoundary,
	scoreDeltaIdentity,
	spectralDelta,
	transposeNumericsRays,
} from './metrics.mjs';
import {
	evaluatePrediction,
	mechanisticPrediction,
	midpointRefinementPrediction,
	predictionDigest,
} from './predictions.mjs';
import {comparisonReport} from './reports.mjs';

/** Verify exact manufactured identities and strict failure boundaries, plus the supplied authentic historical score. The caller owns all IO. @param {DialAnalysisBoundary} measured @param {DialAnalysisBoundary} baseline @param {number} [expectedAggregateMilliwatt] @returns {DialAnalysisProof} */
export function runAnalysisProof(measured, baseline, expectedAggregateMilliwatt) {
	let checks = 0;
	/** @param {boolean} condition @param {string} message */
	const check = (condition, message) => {
		assert.ok(condition, message);
		checks++;
	};
	/** @param {() => unknown} operation */
	const rejects = (operation) => {
		assert.throws(operation);
		checks++;
	};
	check(
		isDeepStrictEqual(acceptControls(), {
			altitudeCount: 48,
			outgoingWidth: 27,
			incoming: {kind: 'production-f68'},
			sourceIntervals: 20,
			transportIntervals: 40,
			viewRule: 'quadratic',
			viewIntervals: [30],
			solarInterpolations: ['monotone-cubic'],
			representations: ['cumulative'],
		}),
		'Continuation admission preserves every original default, including unchanged F68 selection.',
	);
	check(
		isDeepStrictEqual(acceptControls({incoming: {kind: 'production-f68'}}), acceptControls()),
		'Explicit F68 retains the omitted-selection controls without product-rule metadata.',
	);
	for (const sourceIntervals of [20, 40, 80, 160])
		check(acceptControls({sourceIntervals}).sourceIntervals === sourceIntervals, `Admit S${sourceIntervals}.`);
	for (const transportIntervals of [40, 80, 160, 320])
		check(
			acceptControls({transportIntervals}).transportIntervals === transportIntervals,
			`Admit T${transportIntervals}.`,
		);
	for (const subdivision of [1, 2, 4, 8, 16])
		check(
			isDeepStrictEqual(
				acceptControls({viewRule: 'altitude-segmented', viewIntervals: [subdivision]}).viewIntervals,
				[subdivision],
			),
			`Admit segmented subdivision ${subdivision}.`,
		);
	check(
		isDeepStrictEqual(
			acceptControls({
				sourceIntervals: 160,
				transportIntervals: 320,
				viewRule: 'altitude-segmented',
				viewIntervals: [8, 16],
			}).viewIntervals,
			[8, 16],
		),
		'Combined continuation counts preserve explicit view selection order.',
	);
	for (const sourceIntervals of [0, 159, 161, 320, 1.5, NaN, '160'])
		rejects(() => Reflect.apply(acceptControls, undefined, [{sourceIntervals}]));
	for (const transportIntervals of [0, 319, 321, 640, 1.5, NaN, '320'])
		rejects(() => Reflect.apply(acceptControls, undefined, [{transportIntervals}]));
	for (const viewIntervals of [[], [0], [15], [17], [32], [16, 16], ['16']])
		rejects(() => Reflect.apply(acceptControls, undefined, [{viewRule: 'altitude-segmented', viewIntervals}]));
	for (const viewIntervals of [[16], [240]]) rejects(() => acceptControls({viewIntervals}));
	// Exercise malformed external selections without asserting they satisfy the public control type.
	for (const input of [
		{unknownControl: 1},
		{incoming: {kind: 'unknown'}},
		{incoming: {kind: 'production-f68', muCount: 8}},
		{incoming: {kind: 'production-f68', azimuthCount: 64}},
		{incoming: {kind: 'production-f68', azimuthPlacement: 'midpoint'}},
		{incoming: {kind: 'production-f68', azimuthPlacement: 'endpoint-aware'}},
		{incoming: {kind: 'gauss-legendre-product', muCount: 8, azimuthCount: 64, azimuthPlacement: 'unknown'}},
		{incoming: {kind: 'gauss-legendre-product', muCount: 8, azimuthCount: 64, azimuthPlacement: null}},
		{incoming: {kind: 'gauss-legendre-product', muCount: 8, azimuthCount: 64, unknownControl: 1}},
	])
		rejects(() => Reflect.apply(acceptControls, undefined, [input]));
	for (const muCount of [0, 2, 6, 64, 8.5, NaN]) {
		rejects(() => acceptControls({incoming: {kind: 'gauss-legendre-product', muCount, azimuthCount: 64}}));
		rejects(() => createProductQuadrature(muCount, 64));
	}
	for (const azimuthCount of [0, 4, 12, 128, 8.5, NaN]) {
		rejects(() => acceptControls({incoming: {kind: 'gauss-legendre-product', muCount: 8, azimuthCount}}));
		rejects(() => createProductQuadrature(8, azimuthCount));
	}
	rejects(() => Reflect.apply(createProductQuadrature, undefined, [8, 64, 'unknown']));
	rejects(() => Reflect.apply(createProductQuadrature, undefined, [8, 64, null]));
	/** @type {readonly SkyVector3[]} */
	const outgoingProbes = [
		[1, 0, 0],
		[0, 1, 0],
		[0, 0, 1],
		[1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)],
		[2 / 7, -3 / 7, 6 / 7],
		[-3 / 5, 0, 4 / 5],
	];
	for (const muCount of [4, 8, 16, 32]) {
		const nodes = gaussLegendre(muCount);
		for (const azimuthCount of [8, 16, 32, 64]) {
			const step = (2 * Math.PI) / azimuthCount;
			/** @type {SkyVector3[]} */ const historicalVectors = [];
			const historicalWeights = [];
			// Retain the original midpoint equation and emission order independently of the new placement branch.
			for (const {node, weight} of nodes) {
				const radial = Math.sqrt(Math.max(0, 1 - node * node));
				for (let index = 0; index < azimuthCount / 2; index++) {
					const angle = (index + 0.5) * step,
						x = radial * Math.cos(angle),
						y = radial * Math.sin(angle);
					historicalVectors.push([x, y, node], [x, -y, node]);
					historicalWeights.push(weight * step, weight * step);
				}
			}
			const midpoint = createProductQuadrature(muCount, azimuthCount);
			check(
				isDeepStrictEqual(midpoint, {
					id: `sky-accuracy-dials-gl-${muCount}x${azimuthCount}-v1`,
					directionCount: muCount * azimuthCount,
					unitVectors: historicalVectors,
					integrationWeightsSteradians: historicalWeights,
				}),
				`Omitted placement preserves historical ${muCount}x${azimuthCount} midpoint vectors, weights, order and identity.`,
			);
			check(
				isDeepStrictEqual(createProductQuadrature(muCount, azimuthCount, 'midpoint'), midpoint),
				`Explicit midpoint preserves omitted ${muCount}x${azimuthCount} placement.`,
			);
			/** @type {readonly SkyAzimuthPlacement[]} */
			const placements = ['midpoint', 'endpoint-aware'];
			for (const azimuthPlacement of placements) {
				/** @type {SkyIncomingControl} */
				const incoming = {kind: 'gauss-legendre-product', muCount, azimuthCount, azimuthPlacement};
				const selected = acceptControls({incoming});
				check(
					isDeepStrictEqual(selected.incoming, {
						kind: 'gauss-legendre-product',
						muCount,
						azimuthCount,
						...(azimuthPlacement === 'endpoint-aware' ? {azimuthPlacement} : {}),
					}),
					`Admit ${muCount}x${azimuthCount} ${azimuthPlacement} with canonical historical midpoint controls.`,
				);
				check(
					isDeepStrictEqual(incoming, {
						kind: 'gauss-legendre-product',
						muCount,
						azimuthCount,
						azimuthPlacement,
					}),
					`Admission leaves caller-owned ${muCount}x${azimuthCount} ${azimuthPlacement} controls unchanged.`,
				);
				const quadrature = createProductQuadrature(muCount, azimuthCount, azimuthPlacement),
					label = `${muCount}x${azimuthCount} ${azimuthPlacement}`,
					vectors = quadrature.unitVectors,
					weights = quadrature.integrationWeightsSteradians;
				check(
					quadrature.id ===
						`sky-accuracy-dials-gl-${muCount}x${azimuthCount}${azimuthPlacement === 'midpoint' ? '' : '-endpoint-aware'}-v1` &&
						quadrature.directionCount === muCount * azimuthCount &&
						vectors.length === quadrature.directionCount &&
						weights.length === quadrature.directionCount,
					`${label} has its exact declared count and placement identity.`,
				);
				check(
					weights.every((weight) => Number.isFinite(weight) && weight > 0),
					`${label} retains finite strictly positive solid-angle weights.`,
				);
				check(
					vectors.every(
						(vector) =>
							vector.every(Number.isFinite) &&
							Math.abs(vector.reduce((sum, value) => sum + value * value, 0) - 1) <= 64 * Number.EPSILON,
					),
					`${label} contains finite unit directions.`,
				);
				check(
					new Set(vectors.map((vector) => vector.join(','))).size === vectors.length,
					`${label} never duplicates an incoming direction.`,
				);
				for (const [ring, {node, weight}] of nodes.entries()) {
					const offset = ring * azimuthCount,
						radial = Math.sqrt(Math.max(0, 1 - node * node)),
						pairStart = azimuthPlacement === 'endpoint-aware' ? 2 : 0;
					check(
						vectors.slice(offset, offset + azimuthCount).every((vector) => vector[2] === node) &&
							weights.slice(offset, offset + azimuthCount).every((value) => value === weight * step),
						`${label} ring ${ring} preserves its cosine node and equal azimuth weights.`,
					);
					if (azimuthPlacement === 'endpoint-aware')
						check(
							isDeepStrictEqual(vectors[offset], [radial, 0, node]) &&
								isDeepStrictEqual(vectors[offset + 1], [-radial, 0, node]) &&
								vectors.slice(offset, offset + azimuthCount).filter((vector) => vector[1] === 0)
									.length === 2,
							`${label} ring ${ring} emits azimuth zero and pi once each with canonical positive zero.`,
						);
					else
						check(
							vectors.slice(offset, offset + azimuthCount).every((vector) => vector[1] !== 0),
							`${label} ring ${ring} retains only interior midpoint pairs.`,
						);
					for (let index = pairStart; index < azimuthCount; index += 2) {
						const first = vectors[offset + index],
							reflection = vectors[offset + index + 1];
						check(
							first[1] > 0 &&
								Object.is(reflection[0], first[0]) &&
								Object.is(reflection[1], -first[1]) &&
								Object.is(reflection[2], first[2]) &&
								weights[offset + index] === weights[offset + index + 1],
							`${label} ring ${ring} pair ${index / 2} is an exact weighted source-plane reflection.`,
						);
					}
				}
				/** Integrate a manufactured angular function without changing any quadrature weight.
				 * @param {(direction: SkyVector3) => number} evaluate - Dimensionless angular function.
				 * @returns {number} Integral in steradians.
				 */
				const integrate = (evaluate) =>
					vectors.reduce((sum, direction, index) => sum + weights[index] * evaluate(direction), 0);
				// Roundoff-scale allowance: sequential summation plus 64 local operations per term.
				// This manufactured algebra check is not a measured phase-error or physical-accuracy threshold.
				// It does not certify Newton-root or JavaScript transcendental-function error bounds.
				const operationEpsilon = (quadrature.directionCount + 64) * Number.EPSILON,
					roundoffAllowance = operationEpsilon / (1 - operationEpsilon),
					solidAngle = 4 * Math.PI;
				check(
					Math.abs(integrate(() => 1) - solidAngle) <= solidAngle * roundoffAllowance,
					`${label} integrates constant one over the full sphere.`,
				);
				for (let axis = 0; axis < 3; axis++) {
					check(
						Math.abs(integrate((direction) => direction[axis])) <= solidAngle * roundoffAllowance,
						`${label} first moment ${axis} vanishes.`,
					);
					for (let otherAxis = axis; otherAxis < 3; otherAxis++) {
						const expected = axis === otherAxis ? solidAngle / 3 : 0;
						check(
							Math.abs(integrate((direction) => direction[axis] * direction[otherAxis]) - expected) <=
								solidAngle * roundoffAllowance,
							`${label} second moment ${axis},${otherAxis} matches the isotropic sphere.`,
						);
					}
				}
				for (const outgoing of outgoingProbes) {
					const phaseIntegral = integrate((incoming) => {
						const cosine = incoming.reduce((sum, value, axis) => sum + value * outgoing[axis], 0);
						return (3 / (16 * Math.PI)) * (1 + cosine * cosine);
					});
					check(
						Math.abs(phaseIntegral - 1) <= 1.5 * roundoffAllowance,
						`${label} integrates the unrenormalized Rayleigh phase to one for [${outgoing.join(',')}].`,
					);
				}
			}
		}
	}
	const baselineScore = scoreBoundary(baseline, measured);
	check(
		baselineScore.fullRegisteredBoundary && baselineScore.sampleCount === 17 * 81 * 31,
		'Historical score requires every registered scalar.',
	);
	const aggregateOracleDifference =
		expectedAggregateMilliwatt === undefined
			? null
			: baselineScore.aggregateRmseMilliwatt - expectedAggregateMilliwatt;
	if (aggregateOracleDifference !== null)
		check(Math.abs(aggregateOracleDifference) <= 1e-12, 'Historical aggregate drift.');
	check(
		Math.abs(baselineScore.aggregateRmseMilliwatt - baselineScore.pooledRmseMilliwatt) <= 1e-12,
		'Equal-size condition RMS must equal pooled RMSE.',
	);
	const screen = selectBoundary(baseline, SCREEN_SELECTION);
	check(screen.values.length === 3 * 81 * 6, 'Screen retains the complete declared numerical selection.');
	rejects(() => scoreBoundary(screen, measured));
	const screenScore = scoreBoundary(screen, measured, [0, 8, 16, 24, 30]);
	check(
		!screenScore.fullRegisteredBoundary && screenScore.sampleCount === 3 * 81 * 5,
		'Screen scoring is explicit and excludes diagnostic channel39.',
	);
	const fixtureIdentity = {path: 'manufactured-equations', byteLength: 1, sha256: 'a'.repeat(64)};
	/** @param {string} configId @param {readonly number[]} values @returns {DialAnalysisBoundary} */
	const fixture = (configId, values) => ({
		configId,
		quantity: 'radiance',
		units: RADIANCE_UNITS,
		sourceIdentity: {...fixtureIdentity, path: configId},
		times: ['09:30'],
		rayIndices: [0],
		channels: [0, 1],
		values: Float64Array.from(values),
	});
	const control = fixture('control', [2, 4]),
		measurement = fixture('measurement', [1, 3]),
		first = fixture('factor-a', [3, 6]),
		second = fixture('factor-b', [4, 3]),
		combined = fixture('joint', [5, 5]);
	const identity = scoreDeltaIdentity(control, measurement, spectralDelta(control, first));
	check(
		identity.residualCrossTerm === 6 &&
			identity.deltaSquaredNorm === 5 &&
			identity.actualSquaredErrorChange === 11 &&
			identity.identityResidual === 0,
		'Manufactured quadratic SSE expansion.',
	);
	const interaction = factorialContrast(control, first, second, combined, measurement, 1e-12);
	check(
		interaction.interactionNorm === 0 &&
			interaction.squaredErrorInteraction === 0 &&
			interaction.additiveSquaredErrorCrossTerm === 0,
		'Manufactured additive radiance with orthogonal main effects.',
	);
	const additiveAligned = factorialContrast(
		control,
		first,
		fixture('factor-b-aligned', [4, 8]),
		fixture('joint-aligned', [5, 10]),
		measurement,
		1e-12,
	);
	check(
		additiveAligned.interactionNorm === 0 &&
			additiveAligned.squaredErrorInteraction === 20 &&
			additiveAligned.additiveSquaredErrorCrossTerm === 20,
		'Additive radiance still has an SSE cross term.',
	);
	const nonlinear = factorialContrast(control, first, second, fixture('joint-nonlinear', [6, 4]), measurement, 1e-12);
	check(
		nonlinear.interaction.values[0] === 1 && nonlinear.interaction.values[1] === -1,
		'Signed factorial interaction cannot be replaced by an RMSE difference.',
	);
	const coarse = fixture('q30', [1 + 4 / 30 ** 2, 2 + 9 / 30 ** 2]),
		medium = fixture('q60', [1 + 4 / 60 ** 2, 2 + 9 / 60 ** 2]),
		fine = fixture('q120', [1 + 4 / 120 ** 2, 2 + 9 / 120 ** 2]);
	/** @type {DialPredictionRegistration} */
	const registration = {
		id: 'manufactured-midpoint',
		targetConfigId: fine.configId,
		scope: 'prospective-intervention',
		development: [coarse, medium].map((boundary) => ({
			configId: boundary.configId,
			artifact: boundary.sourceIdentity,
		})),
		floorW: 1e-10,
		floorEvidence: [fixtureIdentity],
	};
	const prediction = midpointRefinementPrediction(coarse, medium, 30, 60, 120, registration);
	/** @type {DialPredictionEvaluationEvidence} */
	const evidence = {
		predictionSha256: predictionDigest(prediction),
		predictionSeal: {...fixtureIdentity, path: 'manufactured-prediction-seal'},
		lockedAt: '2026-09-13T00:00:00.000Z',
		candidateStartedAt: '2026-09-13T00:00:01.000Z',
		candidateIdentity: fine.sourceIdentity,
	};
	const evaluation = evaluatePrediction(prediction, medium, fine, evidence);
	check(
		evaluation.prospective &&
			evaluation.passed &&
			evaluation.groups[0].signAgreement === 1 &&
			evaluation.groups[0].relativeVectorError < 1e-10,
		'Independent Q^-2 manufactured target must match the unfit prediction.',
	);
	rejects(() => evaluatePrediction(prediction, medium, fine, {...evidence, candidateStartedAt: evidence.lockedAt}));
	rejects(() => evaluatePrediction({...prediction, delta: [0, 0]}, medium, fine, evidence));
	rejects(() =>
		mechanisticPrediction(medium, [0, 0], 'invalid target input', {
			...registration,
			development: [...registration.development, {configId: fine.configId, artifact: fine.sourceIdentity}],
		}),
	);
	const priorScreen = {
		configId: fine.configId,
		artifact: {...fine.sourceIdentity, path: 'earlier-disjoint-screen'},
		selection: {times: ['09:45'], channels: [0, 1], rayIndices: [0]},
	};
	const disjoint = mechanisticPrediction(medium, prediction.delta, 'Explicit nonoverlapping prior screen', {
		...registration,
		development: [...registration.development, priorScreen],
	});
	check(
		evaluatePrediction(disjoint, medium, fine, {...evidence, predictionSha256: predictionDigest(disjoint)}).passed,
		'Earlier target screens may inform disjoint prospective coordinates.',
	);
	const missed = fixture('q120', [1.1, 2.2]);
	check(
		!evaluatePrediction(prediction, medium, missed, evidence).passed,
		'A contrary observed response must remain a prediction miss.',
	);
	const development = mechanisticPrediction(medium, prediction.delta, 'Known reconstruction', {
		...registration,
		scope: 'development-reconstruction',
	});
	check(
		!evaluatePrediction(development, medium, fine, {...evidence, predictionSha256: predictionDigest(development)})
			.prospective,
		'Development reconstruction cannot become an unseen-data claim.',
	);
	const nativeOrder = Float64Array.from({length: 162}, (_, index) => index);
	const canonical = transposeNumericsRays(nativeOrder, ['09:30', '09:45']);
	check(
		canonical[5 * 9 + 3] === 3 * 9 + 5 && canonical[81 + 2 * 9 + 7] === 81 + 7 * 9 + 2,
		'Direction-order conversion must explicitly transpose every scene.',
	);
	const strata = geometricStrata(
		'09:30',
		ALL_RAYS.map((rayIndex) => ({rayIndex, elevationDegrees: rayIndex, sunSeparationDegrees: 2 * rayIndex})),
	);
	check(
		strata[0].rayIndices.length === 8 &&
			strata[1].rayIndices.length === 37 &&
			strata[2].rayIndices.length === 36 &&
			strata[3].rayIndices.length === 21 &&
			strata[4].rayIndices.length === 6,
		'Fixed geometric membership is independent of observed error.',
	);
	const header = ['time', 'grid_x', 'grid_y', ...ALL_CHANNELS.map((channel) => `lambda_${channel}`)].join('\t');
	const rows = CAPTURE_TIMES.flatMap((time) =>
		ALL_RAYS.map((ray) =>
			[
				time,
				ray % 9,
				Math.floor(ray / 9),
				...ALL_CHANNELS.map((channel) => 1 + channel / 100 + ray / 10000),
			].join('\t'),
		),
	);
	const options = {configId: 'parser-manufactured', sourceIdentity: fixtureIdentity};
	const tsv = `${header}\n${rows.join('\n')}\n`;
	const parsed = parseBoundaryTsv(tsv, options);
	check(
		parsed.values.length === 55080 && parsed.values[40 + 39] === 1 + 39 / 100 + 1 / 10000,
		'Complete TSV has exact coordinate and wavelength placement.',
	);
	rejects(() => parseBoundaryTsv(`${header}\n${rows.slice(1).join('\n')}`, options));
	rejects(() => parseBoundaryTsv(`${tsv}${rows[0]}\n`, options));
	rejects(() => parseBoundaryTsv(tsv.replace('lambda_39', 'lambda_40'), options));
	rejects(() => parseBoundaryTsv(tsv.replace('\t1\t', '\t\t'), options));
	rejects(() => parseBoundaryTsv(tsv.replace('\t1\t', '\tNaN\t'), options));
	rejects(() => parseBoundaryTsv(tsv.replace('09:30\t0\t0', '09:31\t0\t0'), options));
	const report = comparisonReport(control, first, measurement, {
		title: 'Manufactured equation proof',
		scoreChannels: [0, 1],
		provenance: {operation: 'closed-form manufactured equations'},
	});
	check(
		report.aggregateChangeMilliwatt > 0 &&
			report.interpretation.includes('worsening') &&
			report.csv.split('\n').filter(Boolean).length === 3 &&
			report.scoreSvg.includes('Lower RMSE is better') &&
			report.spectralSvg.includes('No accuracy claim'),
		'Report preserves regression sign and separates numerical response from measurement fit.',
	);
	return {
		checks,
		baselineScore,
		aggregateOracleDifference,
		mechanisms: [
			'explicit continuation count admission and strict unsupported-control rejection',
			'exact historical midpoint compatibility and distinct endpoint-aware incoming geometry',
			'positive angular weights, unique nodes, exact reflections and manufactured sphere/Rayleigh moments',
			'strict complete TSV coordinates and finite spectra',
			'registered score versus explicit screen',
			'historical condition-RMS aggregation',
			'quadratic spectral-delta/SSE identity',
			'full factorial spectral and score interactions',
			'prospective Q^-2 prediction and retained misses',
			'sealed-before-generation and no overlapping target-input gate',
			'known development versus prospective intervention distinction',
			'explicit x-major/y-major transposition',
			'geometry-only strata',
			'separate physical spectral-change and Kider figures',
		],
	};
}
