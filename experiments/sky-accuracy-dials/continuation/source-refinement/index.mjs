import assert from 'node:assert/strict';
import {medium, phase} from '../../numerics/direct.js';
import {sourceAuditTrapezoid} from '../source-column-audit/index.mjs';
import {sourceGridDelta} from '../source-reconstruction/grid.mjs';
import {
	reconstructionValue as value,
	reconstructionSum as sum,
	reconstructionDifference as difference,
	reconstructionSolar,
	evaluateSourceReconstruction,
	groupSourceReconstruction,
} from '../source-reconstruction/index.mjs';
import {phaseMagnitudeGate} from '../source-reconstruction/phase.mjs';
import {volumeAttenuation} from '../volume-reference/method.mjs';

const valueKeys = /** @type {const} */ (['reference', 'density160', 'error160', 'density320', 'error320', 'response']);

/** Original two-rule, two-tolerance species-column centre and empirical allowance.
 * @param {SkySourceAuditPredictionRow} row @param {0|1} species @returns {SkySourceReconstructionValue}
 */
function referenceColumn(row, species) {
	assert.deepEqual(
		row.passes.map((p) => [p.method, p.scale]),
		[
			['gauss', 4],
			['gauss', 1],
			['simpson', 4],
			['simpson', 1],
		],
	);
	assert.ok(row.passes.every((p) => p.columns.converged));
	const v = row.passes.map((p) => (species === 0 ? p.columns.rayleighMeters : p.columns.mieMeters));
	const e = row.passes.map((p) => (species === 0 ? p.columns.errorRayleighMeters : p.columns.errorMieMeters));
	const centre = (v[1] + v[3]) / 2;
	return value(
		centre,
		2 * Math.max(Math.abs(v[0] - v[1]), Math.abs(v[2] - v[3]), Math.abs(v[1] - v[3]), e[1], e[3]) +
			Math.abs(row.geometry.length - row.geometry.referenceLength) +
			256 * Number.EPSILON * Math.abs(centre),
	);
}

/** Source count is explicit. The forecast branch never calls a finite integrator.
 * @param {SkySourceRefinementInput} data @param {'reference'|'s80'|'s160'|'predicted320'} mode
 * @returns {SkySourceRefinementAnchor[]}
 */
function retainedAnchors(data, mode) {
	const spec = data.input.buildRequest.transportSpec,
		top = spec.planet.topRadiusMeters - spec.planet.bottomRadiusMeters;
	const anchors = data.prediction.rows
		.filter((r) => r.coordinate.kind === 'knot')
		.map((row) => {
			const held = data.target.rows.find((r) => r.coordinateId === row.coordinate.id);
			assert.ok(held);
			assert.equal(row.baseline.intervals, 80);
			assert.equal(held.finite.intervals, 160);
			/** @param {0|1} species @returns {SkySourceReconstructionValue} */
			function column(species) {
				if (mode === 'reference') return referenceColumn(row, species);
				const finite = mode === 's80' ? row.baseline : held.finite;
				const raw = species === 0 ? finite.rayleighMeters : finite.mieMeters;
				const scale =
					species === 0 ? spec.atmosphere.rayleighScaleHeightMeters : spec.atmosphere.mieScaleHeightMeters;
				const delta = mode === 'predicted320' ? 0.25 * sourceGridDelta(row.geometry, scale, top) : 0;
				return value(raw + delta, 256 * Number.EPSILON * (Math.abs(raw) + Math.abs(delta)));
			}
			return {coordinateId: row.coordinate.id, rayleighMeters: column(0), mieMeters: column(1)};
		});
	assert.equal(anchors.length, 16);
	assert.equal(new Set(anchors.map((a) => a.coordinateId)).size, 16);
	return anchors;
}

/** Preserve the original finite-top adjustment and nonlinear solar operation order.
 * Both species use only original altitude/solar support; outgoing interpolation is absent.
 * @param {SkySourceAuditInput} input @param {readonly SkySourceRefinementAnchor[]} anchors
 * @param {SkySourceAuditInput['samples'][number]} sample @param {0|1} species
 * @returns {SkySourceReconstructionValue}
 */
function reconstructColumn(input, anchors, sample, species) {
	const spec = input.buildRequest.transportSpec,
		query = input.coordinates.find((c) => c.id === sample.coordinateId);
	assert.ok(query && query.solarCosine > 0);
	const scale = species === 0 ? spec.atmosphere.rayleighScaleHeightMeters : spec.atmosphere.mieScaleHeightMeters;
	const top = spec.planet.topRadiusMeters - spec.planet.bottomRadiusMeters;
	let offset = 0;
	const planes = sample.stencil.altitudeWeights.map(() => {
		const solar = Array.from({length: 4}, () => {
			const knot = input.knots[sample.stencil.indices[offset]];
			assert.ok(knot);
			offset += sample.stencil.directionWeights.length;
			const id = 'knot:' + knot.altitudeIndex + ':' + knot.solarIndex;
			const coordinate = input.coordinates.find((c) => c.id === id),
				anchor = anchors.find((a) => a.coordinateId === id);
			assert.ok(coordinate && coordinate.solarCosine > 0 && anchor);
			const c = species === 0 ? anchor.rayleighMeters : anchor.mieMeters;
			value(c.value, c.allowance);
			const finiteTop = (scale / coordinate.solarCosine) * Math.exp(-top / scale);
			return sum(
				[sum([c, value(finiteTop)], [1, 1])],
				[Math.exp((coordinate.altitudeMeters - query.altitudeMeters) / scale)],
			);
		});
		return reconstructionSolar(
			solar,
			sample.stencil.solarFraction,
			sample.stencil.firstSolarInterval,
			sample.stencil.lastSolarInterval,
		);
	});
	assert.equal(offset, sample.stencil.indices.length);
	return difference(
		sum(planes, sample.stencil.altitudeWeights),
		value((scale / query.solarCosine) * Math.exp(-top / scale)),
	);
}

/** @param {SkySourceAuditInput} input @param {readonly SkySourceRefinementAnchor[]} anchors
 * @param {SkySourcePhaseRow} row
 * @returns {{density:SkySourceReconstructionValue,rayleighMeters:SkySourceReconstructionValue,mieMeters:SkySourceReconstructionValue,opticalDepth:SkySourceReconstructionValue}}
 */
function reconstructDensity(input, anchors, row) {
	const spec = input.buildRequest.transportSpec;
	const sample = input.samples.find((s) => s.probeId === row.probeId && s.sampleIndex === row.sampleIndex),
		ray = input.rays.find((r) => r.probeId === row.probeId);
	assert.ok(sample && ray && [0, 8].includes(row.channel));
	const beta = medium(spec, row.channel, row.altitudeMeters),
		phases = phase(spec, ray.ray.direction[2]),
		spectral = spec.domains.spectrum.channels[row.channel];
	const coefficient =
		spectral.sourceIrradianceDensityWattsPerSquareMeterPerNanometer * (beta[1] * phases[0] + beta[2] * phases[1]);
	const rayleighMeters = reconstructColumn(input, anchors, sample, 0),
		mieMeters = reconstructColumn(input, anchors, sample, 1);
	const opticalDepth = sum(
		[rayleighMeters, mieMeters],
		[spectral.rayleighScatteringPerMeter, spectral.mieExtinctionPerMeter],
	);
	assert.ok(opticalDepth.value >= 0);
	const density = sum([volumeAttenuation(opticalDepth.value, opticalDepth.allowance)], [coefficient]);
	return {density, rayleighMeters, mieMeters, opticalDepth};
}

/** Replay all old query references, weights and corrected representation values before forecasting.
 * @param {SkySourceRefinementInput} data @returns {SkySourceRefinementForecast['baselineReplay']}
 */
function replayBaseline(data) {
	assert.equal(data.baseline.schemaId, 'sky-source-grid-v1');
	assert.equal(data.input.coordinates.length, 48);
	assert.equal(data.input.samples.length, 32);
	assert.equal(data.baseline.rows.length, 64);
	assert.equal(data.baseline.groups.length, 4);
	const original = evaluateSourceReconstruction(data.input, data.columns);
	assert.equal(original.rows.length, 64);
	let exactComparisons = 0;
	for (let i = 0; i < original.rows.length; i++) {
		const row = data.baseline.rows[i],
			old = original.rows[i];
		assert.equal(row.probeId, old.probeId);
		assert.equal(row.channel, old.channel);
		assert.equal(row.sampleIndex, old.sampleIndex);
		assert.equal(row.altitudeMeters, old.altitudeMeters);
		assert.equal(row.weightMeters, old.weightMeters);
		assert.deepEqual(row.direct, old.direct);
		exactComparisons += 6;
	}
	const modes = /** @type {const} */ (['reference', 's80', 's160']);
	for (const mode of modes) {
		const anchors = retainedAnchors(data, mode);
		for (const row of data.baseline.rows) {
			const replay = reconstructDensity(data.input, anchors, row);
			assert.deepEqual(replay.density, row.reconstructed['grid:' + mode]);
			assert.deepEqual(replay.rayleighMeters, row.reconstructed['gridRayleighMeters:' + mode]);
			assert.deepEqual(replay.mieMeters, row.reconstructed['gridMieMeters:' + mode]);
			assert.deepEqual(replay.opticalDepth, row.reconstructed['gridOpticalDepth:' + mode]);
			assert.deepEqual(difference(replay.density, row.direct.reference), row.terms['grid:' + mode]);
			exactComparisons += 5;
		}
	}
	const groups = groupSourceReconstruction(data.baseline.rows);
	assert.equal(groups.length, 4);
	for (let i = 0; i < groups.length; i++) {
		const g = groups[i],
			old = data.baseline.groups[i];
		assert.equal(g.probeId, old.probeId);
		assert.equal(g.channel, old.channel);
		assert.equal(g.sampleCount, 16);
		assert.deepEqual(g.projected, old.projected);
		assert.deepEqual(g.rms, old.rms);
		assert.deepEqual(g.localSigns, old.localSigns);
		exactComparisons += 6;
	}
	return {rows: 64, groups: 4, modes, exactComparisons};
}

/** @param {SkySourceRefinementInput} data @param {readonly SkySourceRefinementAnchor[]} anchors
 * @returns {SkySourceRefinementPredictionRow[]}
 */
function localValues(data, anchors) {
	return data.baseline.rows.map((row) => {
		const density320 = reconstructDensity(data.input, anchors, row).density;
		const reference = row.direct.reference,
			density160 = row.reconstructed['grid:s160'];
		return {
			probeId: row.probeId,
			channel: row.channel,
			sampleIndex: row.sampleIndex,
			altitudeMeters: row.altitudeMeters,
			weightMeters: row.weightMeters,
			values: {
				reference,
				density160,
				error160: row.terms['grid:s160'],
				density320,
				error320: difference(density320, reference),
				response: difference(density320, density160),
			},
		};
	});
}

/** @param {readonly SkySourceRefinementPredictionRow[]} rows @returns {SkySourceRefinementPredictionGroup[]} */
function project(rows) {
	const keys = [...new Set(rows.map((r) => r.probeId + ':' + r.channel))];
	assert.equal(keys.length, 4);
	return keys.map((key) => {
		const selected = rows.filter((r) => r.probeId + ':' + r.channel === key);
		assert.equal(selected.length, 16);
		const weights = selected.map((r) => r.weightMeters);
		const values = /** @type {SkySourceRefinementValues} */ (
			Object.fromEntries(
				valueKeys.map((k) => [
					k,
					sum(
						selected.map((r) => r.values[k]),
						weights,
					),
				]),
			)
		);
		return {probeId: selected[0].probeId, channel: selected[0].channel, sampleCount: selected.length, values};
	});
}

/** Retained S160 plus the known endpoint-derivative response, with no target execution.
 * @param {SkySourceRefinementInput} data @returns {SkySourceRefinementForecast}
 */
export function predictSourceRefinement(data) {
	const baselineReplay = replayBaseline(data),
		anchors = retainedAnchors(data, 'predicted320');
	const rows = localValues(data, anchors),
		groups = project(rows);
	return {
		schemaId: 'sky-source-refinement-forecast-v1',
		gridRun: data.gridRun,
		baselineIntervals: 160,
		targetIntervals: 320,
		targetAlreadyExecuted: false,
		anchors,
		rows,
		groups,
		baselineReplay,
	};
}

/** Count-generic copy of the established trapezoid and stable altitude equations.
 * Shared geometry changes no per-species summation order. Only synthetic proofs
 * and executeSourceRefinement may call this private helper at 320.
 * @param {Pick<SkySourceAuditGeometry,'height'|'radius'|'projection'|'length'>} geometry
 * @param {number} rayleighScale @param {number} mieScale @param {160|320} intervals
 * @param {SkySourceRefinementWork} work @returns {SkySourceAuditFinite}
 */
function finiteColumns(geometry, rayleighScale, mieScale, intervals, work) {
	assert.ok(intervals === 160 || intervals === 320);
	assert.ok([rayleighScale, mieScale, geometry.radius].every((v) => Number.isFinite(v) && v > 0));
	assert.ok([geometry.height, geometry.projection, geometry.length].every((v) => Number.isFinite(v) && v >= 0));
	const step = geometry.length / intervals;
	let rayleighMeters = 0,
		mieMeters = 0;
	for (let index = 0; index <= intervals; index++) {
		const distance = step * index,
			change = distance * (2 * geometry.projection + distance);
		const altitude = Math.max(
			0,
			geometry.height + change / (Math.sqrt(Math.max(0, geometry.radius ** 2 + change)) + geometry.radius),
		);
		const weight = index === 0 || index === intervals ? 0.5 : 1;
		rayleighMeters += Math.exp(-altitude / rayleighScale) * step * weight;
		mieMeters += Math.exp(-altitude / mieScale) * step * weight;
		work.geometrySamples++;
		work.speciesDensityEvaluations += 2;
	}
	return {intervals, rayleighMeters, mieMeters, evaluations: 2 * (intervals + 1)};
}

/** @param {SkySourceReconstructionValue} coarse @param {SkySourceReconstructionValue} fine
 * @returns {{centre:number|null,interval:readonly [number,number]|null,state:SkySourceAuditState}}
 */
function ratio(coarse, fine) {
	value(coarse.value, coarse.allowance);
	value(fine.value, fine.allowance);
	const centre = coarse.value === 0 ? null : Math.abs(fine.value / coarse.value);
	if (Math.abs(coarse.value) <= coarse.allowance || Math.abs(fine.value) <= fine.allowance)
		return {centre, interval: null, state: 'unresolved'};
	const low = (Math.abs(fine.value) - fine.allowance) / (Math.abs(coarse.value) + coarse.allowance);
	const high = (Math.abs(fine.value) + fine.allowance) / (Math.abs(coarse.value) - coarse.allowance);
	return {centre, interval: [low, high], state: low >= 3 / 16 && high <= 5 / 16 ? 'passed' : 'failed'};
}

/** @param {SkySourceRefinementValues} actual @param {SkySourceRefinementValues} predicted
 * @returns {SkySourceRefinementComparison}
 */
function compare(actual, predicted) {
	const predictedResponse = predicted.response,
		predictionError = difference(predictedResponse, actual.response);
	const checkedRatio = ratio(actual.error160, actual.error320),
		error = actual.error320;
	return {
		predictedResponse,
		predictionError,
		errorRatio: checkedRatio.centre,
		errorRatioInterval: checkedRatio.interval,
		checks: {
			negative:
				error.value < -error.allowance ? 'passed' : error.value > error.allowance ? 'failed' : 'unresolved',
			ratio: checkedRatio.state,
			response: phaseMagnitudeGate(predictionError, actual.response, 0.005),
		},
	};
}

/** The caller must authenticate a sealed forecast before entering target mode.
 * All sixteen S160 parity checks complete before the first S320 target is computed.
 * @param {SkySourceRefinementInput} data @param {SkySourceRefinementForecast} forecast
 * @returns {SkySourceRefinementTarget}
 */
export function executeSourceRefinement(data, forecast) {
	assert.deepEqual(forecast, predictSourceRefinement(data));
	const spec = data.input.buildRequest.transportSpec,
		work = {geometrySamples: 0, speciesDensityEvaluations: 0};
	const anchors160 = data.prediction.rows
		.filter((r) => r.coordinate.kind === 'knot')
		.map((row) => {
			const held = data.target.rows.find((r) => r.coordinateId === row.coordinate.id);
			assert.ok(held);
			const finite160 = finiteColumns(
				row.geometry,
				spec.atmosphere.rayleighScaleHeightMeters,
				spec.atmosphere.mieScaleHeightMeters,
				160,
				work,
			);
			assert.deepEqual(finite160, held.finite);
			return {coordinateId: row.coordinate.id, geometry: row.geometry, finite160};
		});
	assert.equal(anchors160.length, 16);
	const anchors = anchors160.map((row) => ({
		...row,
		finite320: finiteColumns(
			row.geometry,
			spec.atmosphere.rayleighScaleHeightMeters,
			spec.atmosphere.mieScaleHeightMeters,
			320,
			work,
		),
	}));
	const columns = anchors.map((a) => ({
		coordinateId: a.coordinateId,
		rayleighMeters: value(a.finite320.rayleighMeters, 256 * Number.EPSILON * Math.abs(a.finite320.rayleighMeters)),
		mieMeters: value(a.finite320.mieMeters, 256 * Number.EPSILON * Math.abs(a.finite320.mieMeters)),
	}));
	const local = localValues(data, columns),
		projected = project(local);
	const rows = local.map((row, i) => ({...row, ...compare(row.values, forecast.rows[i].values)}));
	const groups = projected.map((g, i) => ({...g, ...compare(g.values, forecast.groups[i].values)}));
	const predicates = groups.flatMap((g) => Object.values(g.checks)),
		localPredicates = rows.flatMap((r) => Object.values(r.checks));
	assert.equal(predicates.length, 12);
	assert.equal(localPredicates.length, 192);
	assert.equal(work.geometrySamples, 16 * (161 + 321));
	assert.equal(work.speciesDensityEvaluations, 2 * work.geometrySamples);
	assert.ok(work.speciesDensityEvaluations <= 16000);
	return {
		schemaId: 'sky-source-refinement-target-v1',
		gridRun: data.gridRun,
		baselineIntervals: 160,
		targetIntervals: 320,
		anchors,
		rows,
		groups,
		predicates,
		localPredicates,
		work,
	};
}

/** Manufactured mathematics only; no retained atmospheric S320 coordinate is used.
 * @returns {{checks:number,scope:string}}
 */
export function sourceRefinementProof() {
	let checks = 0;
	/** @param {boolean} condition @returns {void} */ function check(condition) {
		assert.ok(condition, 'Source refinement proof ' + (checks + 1));
		checks++;
	}
	for (const scale of [1, 8])
		for (const top of [4 * scale, 10 * scale])
			for (const height of [0, 0.2 * scale, scale]) {
				const radius = 1000 + height,
					geometry = {height, radius, projection: radius, length: top - height};
				const work = {geometrySamples: 0, speciesDensityEvaluations: 0};
				const coarse = finiteColumns(geometry, scale, 2 * scale, 160, work),
					fine = finiteColumns(geometry, scale, 2 * scale, 320, work);
				const exact = scale * (Math.exp(-height / scale) - Math.exp(-top / scale));
				const predicted = 0.25 * sourceGridDelta(geometry, scale, top),
					actual = fine.rayleighMeters - coarse.rayleighMeters;
				check(predicted < 0 && actual < 0);
				check(Math.abs(predicted - actual) <= 0.005 * Math.abs(actual));
				check(
					ratio(value(coarse.rayleighMeters - exact), value(fine.rayleighMeters - exact)).state === 'passed',
				);
				check(
					Math.abs(Math.exp(height / scale) * (exact + scale * Math.exp(-top / scale)) - scale) <=
						1e-13 * scale,
				);
				check(work.geometrySamples === 482 && work.speciesDensityEvaluations === 964);
				const old = sourceAuditTrapezoid(
					(distance) => {
						const change = distance * (2 * geometry.projection + distance);
						const altitude = Math.max(
							0,
							height + change / (Math.sqrt(Math.max(0, radius ** 2 + change)) + radius),
						);
						return Math.exp(-altitude / scale);
					},
					geometry.length,
					160,
				);
				check(old === coarse.rayleighMeters);
			}
	for (const constant of [0, 1, 10])
		for (const fraction of [0, 0.25, 0.5, 1]) {
			const reconstructed = reconstructionSolar(
				[0, 1, 2, 3].map(() => value(constant)),
				fraction,
				false,
				false,
			);
			check(Math.abs(reconstructed.value - constant) <= reconstructed.allowance);
			check(sum([reconstructed], [0]).value === 0);
		}
	check(ratio(value(-1), value(-0.25)).state === 'passed');
	check(ratio(value(-1), value(-0.5)).state === 'failed');
	check(ratio(value(0, 1), value(-0.25)).state === 'unresolved');
	check(ratio(value(-1), value(0, 1)).state === 'unresolved');
	check(ratio(value(-1, 0.1), value(-0.25, 0.1)).state === 'failed');
	check(phaseMagnitudeGate(value(0, 1e-10), value(1), 0.005) === 'passed');
	check(phaseMagnitudeGate(value(0.01), value(1), 0.005) === 'failed');
	check(phaseMagnitudeGate(value(0), value(0), 0.005) === 'unresolved');
	assert.throws(() => value(Number.NaN));
	checks++;
	assert.throws(() => value(1, -1));
	checks++;
	const zero = finiteColumns({height: 1, radius: 1001, projection: 1001, length: 0}, 1, 2, 320, {
		geometrySamples: 0,
		speciesDensityEvaluations: 0,
	});
	check(zero.rayleighMeters === 0 && zero.mieMeters === 0 && zero.intervals === 320);
	return {
		checks,
		scope: 'Synthetic vertical exponential columns, finite-top factoring, exact generic S160 parity, held-count endpoint scaling, constant/zero reconstruction, work counts and passed/failed/unresolved uncertainty gates. No atmospheric S320 target.',
	};
}

/** @param {SkySourceRefinementTarget} target @returns {string} */
export function sourceRefinementReport(target) {
	return [
		'# Held S160 to S320 source refinement',
		'',
		'Fixed bottom-interval component projections in W m^-2 sr^-1 nm^-1, with the original sixteen source anchors and analytic query density/phase. Reference allowances remain empirical.',
		'',
		'| Ray | Channel | S160 error | S320 error | Error ratio interval | Actual response | Predicted response | Discrepancy | Negative | Ratio | Response <=0.5% |',
		'| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- | --- | --- |',
		...target.groups.map(
			(g) =>
				'| ' +
				[
					g.probeId,
					g.channel,
					g.values.error160.value,
					g.values.error320.value,
					JSON.stringify(g.errorRatioInterval),
					g.values.response.value,
					g.predictedResponse.value,
					g.predictionError.value,
					...Object.values(g.checks),
				].join(' | ') +
				' |',
		),
		'',
		'All twelve group gates and all 192 local predicates, including failures and unresolved cases, remain in JSON with their propagated allowances. The fixed representation error floor is included in both total errors.',
		'This bounded component test establishes no unlimited count convergence, complete viewing integral, GPU arithmetic parity, later-order recurrence correction or Kider improvement.',
		'',
	].join('\n');
}
