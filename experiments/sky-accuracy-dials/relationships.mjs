import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {ALL_CHANNELS, CAPTURE_TIMES, SCORE_CHANNELS, selectBoundary} from './analysis/boundary.mjs';
import {
	factorialContrast,
	geometricStrata,
	scoreBoundary,
	scoreDeltaIdentity,
	spectralDelta,
} from './analysis/metrics.mjs';
import {createRun, identity, readRepository, verifyRun} from './io/files.mjs';
import {inputRun} from './inputs.mjs';
import {deriveProfile} from './numerics/profile.js';
import {benchmarkRay} from './numerics/view.js';
import {cumulativeQ30Controls} from './prediction/contracts.mjs';
import {extractBoundary, loadSpectra, measurements} from './processing.mjs';

/** Compact statistics of signed radiance changes; the floor classifies signs only.
 * @param {Float64Array} values - Complete aligned spectral change.
 * @param {number} floorW - Positive authenticated scalar sign floor.
 * @returns {DialRepresentationSpectralStatistics} Norms and signed counts in explicit units.
 */
function statistics(values, floorW) {
	let sum = 0,
		squared = 0,
		maximum = 0,
		positive = 0,
		negative = 0;
	for (const value of values) {
		assert.ok(Number.isFinite(value));
		sum += value;
		squared += value * value;
		maximum = Math.max(maximum, Math.abs(value));
		if (value > floorW) positive++;
		if (value < -floorW) negative++;
	}
	return {
		sampleCount: values.length,
		normW: Math.sqrt(squared),
		rmsMilliwatt: 1000 * Math.sqrt(squared / values.length),
		meanMilliwatt: (1000 * sum) / values.length,
		maximumAbsoluteMilliwatt: 1000 * maximum,
		positiveAboveFloor: positive,
		negativeBelowFloor: negative,
		withinFloor: values.length - positive - negative,
	};
}

/** Difference of equally shaped already authenticated numerical arrays.
 * @param {Float64Array} before - Earlier values. @param {Float64Array} after - Later values.
 * @returns {Float64Array} Signed after-minus-before values.
 */
function difference(before, after) {
	assert.equal(before.length, after.length);
	return Float64Array.from(after, (value, index) => value - before[index]);
}

/** Geometry-only interaction energy, with overlapping elevation and Sun-angle categories.
 * @param {SkyGpuControl} control - Authenticated common scene and physical frame.
 * @param {DialAnalysisBoundary} interaction - Full time/Y-major-ray/channel spectral contrast.
 * @param {number} floorW - Sign-classification floor.
 * @returns {DialRepresentationInteractionGeometry} Per-time and pooled angular summaries.
 */
function interactionGeometry(control, interaction, floorW) {
	const channelCount = interaction.channels.length;
	const totalSquared = interaction.values.reduce((sum, value) => sum + value * value, 0);
	/** @type {Map<string, {sampleCount: number, squared: number}>} */
	const pooled = new Map();
	let maximumIndex = 0;
	for (let index = 1; index < interaction.values.length; index++)
		if (Math.abs(interaction.values[index]) > Math.abs(interaction.values[maximumIndex])) maximumIndex = index;
	/** @type {DialRepresentationInteractionPoint|null} */
	let maximumPoint = null;
	const times = control.scenes.map((scene, sceneIndex) => {
		const rays = interaction.rayIndices.map((rayIndex) => {
			const ray = benchmarkRay(control.buildRequest.transportSpec, scene, rayIndex % 9, Math.floor(rayIndex / 9));
			const radius = Math.hypot(...ray.origin);
			const vertical = ray.direction.reduce((sum, value, axis) => sum + (value * ray.origin[axis]) / radius, 0);
			return {
				rayIndex,
				elevationDegrees: (180 * Math.asin(Math.max(-1, Math.min(1, vertical)))) / Math.PI,
				sunSeparationDegrees: (180 * Math.acos(Math.max(-1, Math.min(1, ray.direction[2])))) / Math.PI,
			};
		});
		const begin = sceneIndex * 81 * channelCount,
			end = begin + 81 * channelCount;
		const values = interaction.values.subarray(begin, end),
			timeSquared = values.reduce((sum, value) => sum + value * value, 0);
		if (maximumIndex >= begin && maximumIndex < end) {
			const local = maximumIndex - begin,
				ray = rays[Math.floor(local / channelCount)],
				channel = interaction.channels[local % channelCount];
			maximumPoint = {
				time: scene.time,
				gridX: ray.rayIndex % 9,
				gridY: Math.floor(ray.rayIndex / 9),
				channel,
				wavelengthNanometers:
					control.buildRequest.transportSpec.domains.spectrum.channels[channel].centerNanometers,
				elevationDegrees: ray.elevationDegrees,
				sunSeparationDegrees: ray.sunSeparationDegrees,
				interactionMilliwatt: 1000 * interaction.values[maximumIndex],
			};
		}
		const strata = geometricStrata(scene.time, rays).map((stratum) => {
			let squared = 0;
			for (const ray of stratum.rayIndices)
				for (let channel = 0; channel < channelCount; channel++)
					squared += values[ray * channelCount + channel] ** 2;
			const category = stratum.id.slice(scene.time.length + 1),
				sampleCount = stratum.rayIndices.length * channelCount;
			const previous = pooled.get(category) ?? {sampleCount: 0, squared: 0};
			pooled.set(category, {
				sampleCount: previous.sampleCount + sampleCount,
				squared: previous.squared + squared,
			});
			return {
				id: stratum.id,
				sampleCount,
				squaredNormW: squared,
				fractionOfConditionEnergy: timeSquared > 0 ? squared / timeSquared : null,
			};
		});
		return {time: scene.time, statistics: statistics(values, floorW), strata};
	});
	assert.ok(maximumPoint);
	return {
		overlap:
			'Sun-angle categories partition their axis; elevation categories overlap them. Energy fractions across all categories must not be summed.',
		energyScope:
			'Squared spectral interaction across all 40 channels. Roundoff-only energy fractions are not physically meaningful; consult the absolute interaction statistics and sign floor.',
		times,
		pooled: [...pooled].map(([id, value]) => ({
			id,
			sampleCount: value.sampleCount,
			squaredNormW: value.squared,
			fractionOfTotalEnergy: totalSquared > 0 ? value.squared / totalSquared : null,
		})),
		maximumPoint,
	};
}

/** Retain a full-boundary source/transport by first-order-representation relationship.
 * The source and transport states were already executed. This is retrospective
 * mechanism analysis, not a prospective prediction or a regenerated analytic solver.
 * @param {string} controlRun - Accepted full control GPU run.
 * @param {string} candidateRun - Accepted full run changing only source or transport count.
 * @param {string} floorRun - Accepted empirical scalar sign-floor evidence.
 * @returns {string} Newly sealed compact relationship run, with immutable exact parents.
 */
export function retainRepresentationContrast(controlRun, candidateRun, floorRun) {
	const loaded = [loadSpectra(controlRun), loadSpectra(candidateRun)],
		controls = loaded.map((item) => cumulativeQ30Controls(item.control.controls));
	const inputSeal = verifyRun(inputRun);
	const inputs = /** @type {DialInputs} */ (JSON.parse(readRepository(`${inputRun}/controls.json`).toString()));
	for (const [index, item] of loaded.entries()) {
		assert.ok(
			item.control.controls.representations.includes('grouped') &&
				item.control.controls.representations.includes('analytic-n1'),
		);
		assert.deepEqual(item.control.channels, ALL_CHANNELS, 'Relationship requires all 40 numerical channels.');
		assert.deepEqual(
			item.control.scenes.map((scene) => scene.time),
			CAPTURE_TIMES,
			'Relationship requires all 17 times.',
		);
		assert.deepEqual(
			item.control.buildRequest,
			deriveProfile(inputs.native48, controls[index]).buildRequest,
			'Recorded request must match the declared effective physical and numerical controls.',
		);
	}
	assert.deepEqual(loaded[0].control.scenes, loaded[1].control.scenes, 'Physical scenes must match exactly.');
	/** @type {readonly DialRepresentationConstructionFactor[]} */
	const possibleFactors = ['sourceIntervals', 'transportIntervals'];
	const changed = possibleFactors.filter((key) => controls[0][key] !== controls[1][key]);
	assert.equal(changed.length, 1, 'Exactly one source or transport count must change.');
	const factor = changed[0];
	assert.ok(
		isDeepStrictEqual(controls[0], {...controls[1], [factor]: controls[0][factor]}),
		'Every other effective construction and selected-view control must remain fixed.',
	);
	const floorSeal = verifyRun(floorRun),
		floorManifest = JSON.parse(readRepository(floorSeal.path, floorSeal).toString()),
		floorIdentity = identity(`${floorRun}/result.json`);
	assert.equal(floorManifest.state, 'accepted');
	const floor = JSON.parse(readRepository(floorIdentity.path, floorIdentity).toString());
	assert.ok(Number.isFinite(floor.floorW) && floor.floorW > 0, 'Accepted positive sign floor is required.');
	const floorW = floor.floorW,
		measured = measurements();
	const models = loaded.map((item) => ({
		grouped: extractBoundary(item, 'grouped', 30, 'monotone-cubic', 4),
		analytic: extractBoundary(item, 'analytic-n1', 30, 'monotone-cubic', 4),
		cachedJ1: extractBoundary(item, 'grouped', 30, 'monotone-cubic', 1),
		analyticJ1: extractBoundary(item, 'analytic-n1', 30, 'monotone-cubic', 1),
		cumulative: extractBoundary(item, 'cumulative', 30, 'monotone-cubic', 4),
	}));
	const [before, after] = models;
	const groupedDelta = spectralDelta(before.grouped, after.grouped),
		analyticDelta = spectralDelta(before.analytic, after.analytic);
	const cachedJ1Delta = spectralDelta(before.cachedJ1, after.cachedJ1),
		analyticJ1Delta = spectralDelta(before.analyticJ1, after.analyticJ1);
	const higherFields = models.map((item) => difference(item.cachedJ1.values, item.grouped.values));
	const contrast = factorialContrast(
		before.grouped,
		after.grouped,
		before.analytic,
		after.analytic,
		measured,
		floorW,
	);
	const expectedInteraction = difference(cachedJ1Delta.values, analyticJ1Delta.values);
	const identityResidual = statistics(difference(expectedInteraction, contrast.interaction.values), floorW);
	assert.ok(
		identityResidual.maximumAbsoluteMilliwatt < 1e-9,
		'Factorial must equal the direct-minus-cached J1 response difference.',
	);
	const higherIdentityResiduals = models.map((item, index) =>
		statistics(difference(higherFields[index], difference(item.analyticJ1.values, item.analytic.values)), floorW),
	);
	assert.ok(
		higherIdentityResiduals.every((item) => item.maximumAbsoluteMilliwatt < 1e-9),
		'Grouped and analytic representations must use identical higher fields.',
	);
	const selection = {times: CAPTURE_TIMES, rayIndices: before.grouped.rayIndices, channels: SCORE_CHANNELS};
	const selectedMeasured = selectBoundary(measured, selection),
		selectedGrouped = selectBoundary(before.grouped, selection),
		selectedAnalytic = selectBoundary(before.analytic, selection),
		selectedGroupedDelta = selectBoundary(groupedDelta, selection);
	const groupedSse = scoreDeltaIdentity(selectedGrouped, selectedMeasured, selectedGroupedDelta),
		analyticSse = scoreDeltaIdentity(selectedAnalytic, selectedMeasured, selectBoundary(analyticDelta, selection)),
		additiveSse = scoreDeltaIdentity(selectedAnalytic, selectedMeasured, selectedGroupedDelta);
	const scores = models.map((item) => ({
		grouped: scoreBoundary(item.grouped, measured),
		analytic: scoreBoundary(item.analytic, measured),
	}));
	const baselineResidualAlignmentSse =
			additiveSse.predictedSquaredErrorChange - groupedSse.predictedSquaredErrorChange,
		interactionContributionSse = analyticSse.predictedSquaredErrorChange - additiveSse.predictedSquaredErrorChange;
	const scoreContrast = factorialContrast(
		selectedGrouped,
		selectBoundary(after.grouped, selection),
		selectedAnalytic,
		selectBoundary(after.analytic, selection),
		selectedMeasured,
		floorW,
	);
	assert.ok(Math.abs(baselineResidualAlignmentSse - scoreContrast.additiveSquaredErrorCrossTerm) < 1e-10);
	assert.ok(
		Math.abs(baselineResidualAlignmentSse + interactionContributionSse - scoreContrast.squaredErrorInteraction) <
			1e-10,
	);
	const geometry = interactionGeometry(loaded[0].control, contrast.interaction, floorW);
	const parents = [
		...loaded.map((item) => item.sealIdentity),
		inputSeal,
		measured.sourceIdentity,
		floorSeal,
		floorIdentity,
	];
	const equations = {
		models: 'K_s=cached J1 radiance; A_s=same-Q direct J1 radiance; H_s=grouped C4_s-K_s; G_s=K_s+H_s; F_s=A_s+H_s.',
		interaction: 'deltaG=G_1-G_0; deltaF=F_1-F_0; I=F_1-F_0-G_1+G_0=deltaA-deltaK.',
		score: 'eG=G_0-M; eF=F_0-M; B=F_0-G_0. deltaSSE_G=2*eG dot deltaG+||deltaG||^2. deltaSSE_F=2*eF dot (deltaG+I)+||deltaG+I||^2.',
		residualAlignment:
			'At I=0, changing representation changes deltaSSE by 2*B dot deltaG. Actual I adds 2*(eF+deltaG) dot I+||I||^2. These two terms sum to the observed SSE factorial contrast.',
		geometry:
			'Rays use benchmarkRay with exact retained fitted scenes. Sun separation=acos(direction.z), elevation=asin(dot(direction,origin/||origin||)); source is world +Z.',
	};
	const summary = {
		schemaId: 'sky-source-transport-representation-relationship-v1',
		factor,
		counts: {control: controls[0][factor], candidate: controls[1][factor]},
		effectiveControls: controls,
		parents,
		equations,
		selection: {
			times: CAPTURE_TIMES,
			raysPerTime: 81,
			numericalChannels: ALL_CHANNELS,
			scoredChannels: SCORE_CHANNELS,
			numericalSampleCount: before.grouped.values.length,
			scoredSampleCount: selectedMeasured.values.length,
		},
		units: {
			radiance: before.grouped.units,
			displayedRadiance: 'mW m^-2 sr^-1 nm^-1',
			squaredError: '(W m^-2 sr^-1 nm^-1)^2',
		},
		floorW,
		scope: 'Retrospective complete 2x2 relationship at fixed N4 and matched Q30. Direct J1 uses the same finite source/view quadrature; it is not a continuum reference. Each construction state regenerated cached J1-J4, but substituting direct J1 does not regenerate its higher fields. Cached-direct discrepancy includes storage and all reconstruction operators, not altitude interpolation alone.',
		spectral: {
			groupedC4Delta: statistics(groupedDelta.values, floorW),
			analyticC4Delta: statistics(analyticDelta.values, floorW),
			cachedJ1Delta: statistics(cachedJ1Delta.values, floorW),
			analyticJ1Delta: statistics(analyticJ1Delta.values, floorW),
			higherOrdersDelta: statistics(difference(higherFields[0], higherFields[1]), floorW),
			cachedMinusDirectJ1: models.map((item) =>
				statistics(difference(item.analyticJ1.values, item.cachedJ1.values), floorW),
			),
			groupedMinusCumulative: models.map((item) =>
				statistics(difference(item.cumulative.values, item.grouped.values), floorW),
			),
			interaction: statistics(contrast.interaction.values, floorW),
			relativeInteraction: contrast.relativeInteraction,
			interactionToGroupedDeltaNorm:
				contrast.interactionNorm /
				Math.max(statistics(groupedDelta.values, floorW).normW, floorW * Math.sqrt(groupedDelta.values.length)),
			identityResidual,
			higherIdentityResiduals,
		},
		scores,
		registeredSse: {
			grouped: groupedSse,
			analytic: analyticSse,
			additiveAnalyticHypothesis: additiveSse,
			baselineResidualAlignmentSse,
			interactionContributionSse,
			factorialSse: scoreContrast.squaredErrorInteraction,
			additiveAnalyticAggregateRmseMilliwatt:
				1000 *
				Math.sqrt(
					(scores[0].analytic.squaredError + additiveSse.predictedSquaredErrorChange) /
						selectedMeasured.values.length,
				),
		},
		geometry,
	};
	const format = (value) => value.toFixed(6),
		percent = (value) => (value === null ? 'undefined' : `${(100 * value).toFixed(3)}%`);
	const markdown = [
		`# ${factor} by first-order representation`,
		'',
		`Counts ${summary.counts.control} → ${summary.counts.candidate}. ${summary.scope}`,
		'',
		'Numerical contrasts use all 17 × 81 × 40 samples. Kider scores and every SSE term below use the registered channels 0–30 (42,687 samples). Radiance/RMSE tables use mW m^-2 sr^-1 nm^-1; SSE uses (W m^-2 sr^-1 nm^-1)^2.',
		'',
		'| Time | Grouped control | Grouped candidate | Direct J1 + higher control | Direct J1 + higher candidate | Interaction RMS |',
		'| --- | ---: | ---: | ---: | ---: | ---: |',
		...CAPTURE_TIMES.map(
			(time, index) =>
				`| ${time} | ${format(scores[0].grouped.conditions[index].rmseMilliwatt)} | ${format(scores[1].grouped.conditions[index].rmseMilliwatt)} | ${format(scores[0].analytic.conditions[index].rmseMilliwatt)} | ${format(scores[1].analytic.conditions[index].rmseMilliwatt)} | ${format(geometry.times[index].statistics.rmsMilliwatt)} |`,
		),
		`| Aggregate | ${format(scores[0].grouped.aggregateRmseMilliwatt)} | ${format(scores[1].grouped.aggregateRmseMilliwatt)} | ${format(scores[0].analytic.aggregateRmseMilliwatt)} | ${format(scores[1].analytic.aggregateRmseMilliwatt)} | ${format(summary.spectral.interaction.rmsMilliwatt)} |`,
		'',
		`The spectral interaction RMS is ${format(summary.spectral.interaction.rmsMilliwatt)}, ${percent(summary.spectral.interactionToGroupedDeltaNorm)} of the grouped construction-effect norm. Its standard factorial relative norm is ${percent(summary.spectral.relativeInteraction)}. Positive/negative/within-floor counts are ${summary.spectral.interaction.positiveAboveFloor}/${summary.spectral.interaction.negativeBelowFloor}/${summary.spectral.interaction.withinFloor}, with floor ${floorW} W.`,
		'',
		'| Construction response | Spectral RMS | Mean signed response |',
		'| --- | ---: | ---: |',
		...[
			{label: 'Cached J1', value: summary.spectral.cachedJ1Delta},
			{label: 'Direct same-Q J1', value: summary.spectral.analyticJ1Delta},
			{label: 'Matched higher orders', value: summary.spectral.higherOrdersDelta},
			{label: 'Grouped C4', value: summary.spectral.groupedC4Delta},
			{label: 'Direct J1 + higher', value: summary.spectral.analyticC4Delta},
		].map(({label, value}) => `| ${label} | ${format(value.rmsMilliwatt)} | ${format(value.meanMilliwatt)} |`),
		'',
		`Cached-minus-direct J1 RMS: ${format(summary.spectral.cachedMinusDirectJ1[0].rmsMilliwatt)} → ${format(summary.spectral.cachedMinusDirectJ1[1].rmsMilliwatt)}. Grouped-minus-cumulative RMS: ${format(summary.spectral.groupedMinusCumulative[0].rmsMilliwatt)} → ${format(summary.spectral.groupedMinusCumulative[1].rmsMilliwatt)}.`,
		'',
		`Registered deltaSSE: grouped ${groupedSse.predictedSquaredErrorChange}; direct J1 + higher ${analyticSse.predictedSquaredErrorChange}. Changing only the baseline residual changes deltaSSE by ${baselineResidualAlignmentSse}. The actual spectral interaction contributes another ${interactionContributionSse}. Their sum is the SSE factorial contrast ${scoreContrast.squaredErrorInteraction}. A reversed Kider trend alone does not establish a spectral interaction.`,
		'',
		`If the grouped construction response were added unchanged to the direct-J1 control, its hypothetical aggregate RMSE would be ${format(summary.registeredSse.additiveAnalyticAggregateRmseMilliwatt)}; the actual candidate is ${format(scores[1].analytic.aggregateRmseMilliwatt)}. This is a retrospective algebraic diagnostic.`,
		'',
		'| Geometry category | Interaction energy fraction |',
		'| --- | ---: |',
		...geometry.pooled.map((item) => `| ${item.id} | ${percent(item.fractionOfTotalEnergy)} |`),
		'',
		geometry.overlap,
		geometry.energyScope,
		'',
		`Maximum absolute interaction: ${format(geometry.maximumPoint.interactionMilliwatt)} at ${geometry.maximumPoint.time}, grid (${geometry.maximumPoint.gridX}, ${geometry.maximumPoint.gridY}), channel ${geometry.maximumPoint.channel} (${geometry.maximumPoint.wavelengthNanometers} nm), elevation ${format(geometry.maximumPoint.elevationDegrees)}°, Sun separation ${format(geometry.maximumPoint.sunSeparationDegrees)}°. Per-time stratum fractions and all signed summary statistics are retained in result.json.`,
		'',
		...Object.values(equations).map((equation) => `${equation}\n`),
		'Exact immutable parents:',
		'',
		...parents.map((parent) => `- ${parent.path}; SHA-256 ${parent.sha256}; ${parent.byteLength} bytes.`),
		'',
	].join('\n');
	const run = createRun(factor === 'sourceIntervals' ? 'source-repr' : 'transport-repr', {
		parents,
		operation:
			'Authenticate complete fixed-physics states differing only in source or transport count; compare grouped cached versus direct first order, derive complete spectral and registered SSE factorials, separate residual alignment from interaction, and summarize exact geometry without duplicating spectra.',
		parameters: {
			factor,
			counts: summary.counts,
			effectiveControls: controls,
			equations,
			numericalChannels: ALL_CHANNELS,
			scoredChannels: SCORE_CHANNELS,
			floorW,
		},
	});
	try {
		run.progress(
			'retaining',
			'Retaining compact full-boundary representation relationship and exact SSE decomposition.',
		);
		run.write('result.json', summary);
		run.write('report.md', markdown);
		run.finish('accepted', {
			factor,
			counts: summary.counts,
			interactionRmsMilliwatt: summary.spectral.interaction.rmsMilliwatt,
			groupedKiderChangeMilliwatt:
				scores[1].grouped.aggregateRmseMilliwatt - scores[0].grouped.aggregateRmseMilliwatt,
			analyticKiderChangeMilliwatt:
				scores[1].analytic.aggregateRmseMilliwatt - scores[0].analytic.aggregateRmseMilliwatt,
			baselineResidualAlignmentSse,
			interactionContributionSse,
		});
	} catch (error) {
		run.finish('failed', {message: String(error)});
		throw error;
	}
	verifyRun(run.path);
	return run.path;
}
