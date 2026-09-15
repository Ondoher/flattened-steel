import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {medium, phase} from '../../numerics/direct.js';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {volumeAttenuation} from '../volume-reference/method.mjs';
import {
	reconstructionValue,
	reconstructionSum,
	reconstructionDifference,
	reconstructionSolar,
	groupSourceReconstruction,
} from './index.mjs';
import {phaseMagnitudeGate} from './phase.mjs';
import {evaluateColumnReconstruction} from './column.mjs';

/** @param {DialContinuationRegistrationRead} registration @param {string} run @param {string} columnParentRun
 * @param {string} predictionRun @param {string} targetRun @returns {SkySourceGridBaseline}
 */
export function readSourceGridBaseline(registration, run, columnParentRun, predictionRun, targetRun) {
	const parent = acceptedMechanismInput(run),
		predicted = acceptedMechanismInput(predictionRun),
		target = acceptedMechanismInput(targetRun);
	const params = /** @type {SkySourcePhaseParentParameters & {columnParentRun:string}} */ (
		/** @type {unknown} */ (parent.terminal.recipe.parameters)
	);
	assert.equal(params.caseId, 'column-reconstruction');
	assert.equal(params.continuationRegistration, registration.run);
	assert.equal(params.columnParentRun, columnParentRun);
	assert.equal(params.predictionRun, predictionRun);
	assert.equal(params.targetRun, targetRun);
	assert.equal(params.jobKind, 'cpu');
	assert.equal(params.phase, 'C5');
	const sources = ['index.mjs', 'phase.mjs', 'transmission.mjs', 'column.mjs'].map((name) => {
		const id = params.sourceIdentities.find((r) => r.path.endsWith('/source-reconstruction/' + name));
		assert.ok(id);
		readRepository(id.path, id);
		return id;
	});
	const artifact = mechanismArtifact(parent, 'decomposition.json'),
		predictionId = mechanismArtifact(predicted, 'prediction.json'),
		targetId = mechanismArtifact(target, 'target.json');
	const document = /** @type {SkySourceGridBaseline['document']} */ (
		JSON.parse(readRepository(artifact.path, artifact).toString())
	);
	const prediction = /** @type {SkySourceAuditPredictionRecord} */ (
		JSON.parse(readRepository(predictionId.path, predictionId).toString())
	);
	const finite = /** @type {SkySourceReconstructionTarget} */ (
		JSON.parse(readRepository(targetId.path, targetId).toString())
	);
	assert.equal(document.schemaId, 'sky-column-reconstruction-v1');
	assert.equal(prediction.schemaId, 'sky-source-column-prediction-v1');
	assert.equal(finite.schemaId, 'sky-source-column-target-v1');
	assert.equal(finite.predictionRun, predictionRun);
	assert.equal(prediction.rows.length, 48);
	assert.equal(finite.rows.length, 48);
	return {
		document,
		prediction,
		target: finite,
		identities: [
			parent.seal,
			artifact,
			...sources,
			predicted.seal,
			predictionId,
			target.seal,
			targetId,
			mechanismArtifact(parent, 'sources.json.gz'),
		],
	};
}

/** Leading response from the known exponential integrand, without target values.
 * @param {Pick<SkySourceAuditGeometry,'radius'|'projection'|'height'|'length'>} geometry @param {number} scale @param {number} top
 * @returns {number}
 */
export function sourceGridDelta(geometry, scale, top) {
	const mu0 = geometry.projection / geometry.radius;
	const topRadius = geometry.radius + top - geometry.height;
	const mu1 = (geometry.projection + geometry.length) / topRadius;
	const derivative0 = (-Math.exp(-geometry.height / scale) * mu0) / scale;
	const derivative1 = (-Math.exp(-top / scale) * mu1) / scale;
	return (-((geometry.length / 80) ** 2) * (derivative1 - derivative0)) / 16;
}

/** Per-species geometric reference with explicit empirical allowance.
 * @param {SkySourceAuditPredictionRow} row @param {number} species @returns {SkySourceReconstructionValue}
 */
function geometricReference(row, species) {
	const values = row.passes.map((p) => (species === 0 ? p.columns.rayleighMeters : p.columns.mieMeters));
	const errors = row.passes.map((p) => (species === 0 ? p.columns.errorRayleighMeters : p.columns.errorMieMeters));
	assert.ok(row.passes.every((p) => p.columns.converged));
	const value = (values[1] + values[3]) / 2;
	const allowance =
		2 *
			Math.max(
				Math.abs(values[0] - values[1]),
				Math.abs(values[2] - values[3]),
				Math.abs(values[1] - values[3]),
				errors[1],
				errors[3],
			) +
		Math.abs(row.geometry.length - row.geometry.referenceLength) +
		256 * Number.EPSILON * Math.abs(value);
	return reconstructionValue(value, allowance);
}

/** @param {SkySourceAuditInput} input @param {SkySourceGridBaseline} baseline
 * @param {SkySourceAuditInput['samples'][number]} sample @param {number} species @param {SkySourceGridMode} mode
 * @returns {SkySourceReconstructionValue}
 */
function sourceGridColumn(input, baseline, sample, species, mode) {
	const spec = input.buildRequest.transportSpec;
	const query = input.coordinates.find((c) => c.id === sample.coordinateId);
	assert.ok(query);
	const scale = species === 0 ? spec.atmosphere.rayleighScaleHeightMeters : spec.atmosphere.mieScaleHeightMeters;
	const top = spec.planet.topRadiusMeters - spec.planet.bottomRadiusMeters;
	let offset = 0;
	const planes = sample.stencil.altitudeWeights.map(() => {
		const solar = Array.from({length: 4}, () => {
			const knot = input.knots[sample.stencil.indices[offset]];
			offset += sample.stencil.directionWeights.length;
			const id = 'knot:' + knot.altitudeIndex + ':' + knot.solarIndex;
			const row = baseline.prediction.rows.find((r) => r.coordinate.id === id),
				held = baseline.target.rows.find((r) => r.coordinateId === id);
			assert.ok(row && held);
			let c;
			if (mode === 'reference') c = geometricReference(row, species);
			else {
				const finite = mode === 's160' ? held.finite : row.baseline;
				const raw = species === 0 ? finite.rayleighMeters : finite.mieMeters;
				const delta = mode === 'predicted160' ? sourceGridDelta(row.geometry, scale, top) : 0;
				c = reconstructionValue(raw + delta, 256 * Number.EPSILON * (Math.abs(raw) + Math.abs(delta)));
			}
			const finiteTop = (scale / row.coordinate.solarCosine) * Math.exp(-top / scale);
			return reconstructionSum(
				[reconstructionSum([c, reconstructionValue(finiteTop)], [1, 1])],
				[Math.exp((row.coordinate.altitudeMeters - query.altitudeMeters) / scale)],
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
	const shifted = reconstructionSum(planes, sample.stencil.altitudeWeights);
	return reconstructionDifference(shifted, reconstructionValue((scale / query.solarCosine) * Math.exp(-top / scale)));
}

/** @param {SkySourceReconstructionValue} coarse @param {SkySourceReconstructionValue} fine @returns {SkySourceAuditState} */
function gridRatioGate(coarse, fine) {
	if (Math.abs(coarse.value) <= coarse.allowance || Math.abs(fine.value) <= fine.allowance) return 'unresolved';
	const low = (Math.abs(fine.value) - fine.allowance) / (Math.abs(coarse.value) + coarse.allowance),
		high = (Math.abs(fine.value) + fine.allowance) / (Math.abs(coarse.value) - coarse.allowance);
	return low >= 3 / 16 && high <= 5 / 16 ? 'passed' : 'failed';
}

/** @param {SkySourceAuditInput} input @param {readonly SkySourceReconstructionColumn[]} columns
 * @param {SkySourcePhaseBaseline} sourceBaseline @param {SkyTransmissionBaseline} phaseBaseline
 * @param {SkyColumnBaseline} columnBaseline @param {SkySourceGridBaseline} baseline
 * @returns {{rows:SkySourcePhaseRow[],groups:SkySourceReconstructionGroup[]}}
 */
export function evaluateSourceGrid(input, columns, sourceBaseline, phaseBaseline, columnBaseline, baseline) {
	const prior = evaluateColumnReconstruction(input, columns, sourceBaseline, phaseBaseline, columnBaseline);
	assert.deepEqual(prior.rows, baseline.document.rows);
	assert.deepEqual(prior.groups, baseline.document.groups);
	assert.deepEqual(prior.localChecks, baseline.document.localChecks);
	const spec = input.buildRequest.transportSpec;
	const rows = prior.rows.map((row) => {
		const sample = input.samples.find((s) => s.probeId === row.probeId && s.sampleIndex === row.sampleIndex),
			ray = input.rays.find((r) => r.probeId === row.probeId);
		assert.ok(sample && ray);
		const beta = medium(spec, row.channel, row.altitudeMeters),
			phases = phase(spec, ray.ray.direction[2]),
			spectral = spec.domains.spectrum.channels[row.channel];
		const coefficient =
			spectral.sourceIrradianceDensityWattsPerSquareMeterPerNanometer *
			(beta[1] * phases[0] + beta[2] * phases[1]);
		const reconstructed = {...row.reconstructed},
			terms = {...row.terms};
		for (const mode of /** @type {const} */ (['reference', 's80', 's160', 'predicted160'])) {
			const values = [0, 1].map((species) => sourceGridColumn(input, baseline, sample, species, mode));
			const tau = reconstructionSum(values, [
				spectral.rayleighScatteringPerMeter,
				spectral.mieExtinctionPerMeter,
			]);
			assert.ok(tau.value >= 0);
			const transmission = volumeAttenuation(tau.value, tau.allowance),
				density = reconstructionSum([transmission], [coefficient]);
			reconstructed['grid:' + mode] = density;
			reconstructed['gridRayleighMeters:' + mode] = values[0];
			reconstructed['gridMieMeters:' + mode] = values[1];
			reconstructed['gridOpticalDepth:' + mode] = tau;
			terms['grid:' + mode] = reconstructionDifference(density, row.direct.reference);
		}
		terms.gridActualResponse = reconstructionDifference(reconstructed['grid:s160'], reconstructed['grid:s80']);
		terms.gridPredictedResponse = reconstructionDifference(
			reconstructed['grid:predicted160'],
			reconstructed['grid:s80'],
		);
		terms.gridPredictionError = reconstructionDifference(terms.gridPredictedResponse, terms.gridActualResponse);
		return {...row, reconstructed, terms};
	});
	const groups = groupSourceReconstruction(rows).map((g) => {
		/** @param {SkySourceReconstructionValue} v @returns {SkySourceAuditState} */ const negative = (v) =>
			v.value < -v.allowance ? 'passed' : v.value > v.allowance ? 'failed' : 'unresolved';
		const projected = g.projected;
		return {
			...g,
			checks: {
				reference: phaseMagnitudeGate(projected['grid:reference'], projected.phaseFactored, 0.01),
				negative80: negative(projected['grid:s80']),
				negative160: negative(projected['grid:s160']),
				ratio: gridRatioGate(projected['grid:s80'], projected['grid:s160']),
				response: phaseMagnitudeGate(projected.gridPredictionError, projected.gridActualResponse, 0.02),
			},
		};
	});
	return {rows, groups};
}

/** @returns {{checks:number,scope:string}} */
export function sourceGridProof() {
	let checks = 0;
	/** @param {boolean} value @returns {void} */ function check(value) {
		assert.ok(value, 'Source grid proof ' + (checks + 1));
		checks++;
	}
	for (const scale of [1, 8])
		for (const top of [4 * scale, 10 * scale])
			for (const h of [0, 0.2 * scale, scale]) {
				const column = scale * (Math.exp(-h / scale) - Math.exp(-top / scale));
				const normalized = Math.exp(h / scale) * (column + scale * Math.exp(-top / scale));
				check(Math.abs(normalized - scale) < 1e-13 * scale);
				const length = top - h,
					rate = (/** @type {number} */ n) => {
						const step = length / n;
						let sum = 0;
						for (let i = 0; i <= n; i++)
							sum += Math.exp(-(h + i * step) / scale) * step * (i === 0 || i === n ? 0.5 : 1);
						return sum;
					};
				const r = 1000 + h;
				const geometry = {radius: r, projection: r, height: h, length};
				const predicted = sourceGridDelta(geometry, scale, top),
					actual = rate(160) - rate(80);
				check(predicted < 0 && actual < 0);
				check(Math.abs(predicted - actual) < 0.01 * Math.abs(actual));
			}
	for (const value of [0, 1, 10])
		for (const fraction of [0, 0.2, 0.5, 1]) {
			const c = reconstructionSolar(
				[0, 1, 2, 3].map(() => reconstructionValue(value)),
				fraction,
				false,
				false,
			);
			check(Math.abs(c.value - value) <= c.allowance);
			check(reconstructionSum([c], [0]).value === 0);
		}
	const v = reconstructionValue;
	check(gridRatioGate(v(-1), v(-0.25)) === 'passed');
	check(gridRatioGate(v(-1), v(-0.5)) === 'failed');
	check(gridRatioGate(v(0, 1), v(0.25)) === 'unresolved');
	return {
		checks,
		scope: 'Finite-top normalization, exponential endpoint-derivative prediction, constant solar reconstruction, zero illumination and failed/unresolved ratio gates.',
	};
}

/** @param {readonly SkySourceReconstructionGroup[]} groups @returns {string} */
export function sourceGridReport(groups) {
	return [
		'# Original source-grid representation and source-count interaction',
		'',
		'Fixed bottom-interval projections in W m^-2 sr^-1 nm^-1. Original altitude/solar anchors; analytic query phase/density; adjusted geometric-column factoring. No new physical integration, GPU work or Kider input.',
		'',
		'| Ray | Channel | Reference-column error | S80 error | S160 error | Actual response | Prediction discrepancy | Reference >=99% | Negative S80 | Negative S160 | Ratio | Response <=2% |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- |',
		...groups.map(
			(g) =>
				'| ' +
				g.probeId +
				' | ' +
				g.channel +
				' | ' +
				['grid:reference', 'grid:s80', 'grid:s160', 'gridActualResponse', 'gridPredictionError']
					.map((k) => g.projected[k].value)
					.join(' | ') +
				' | ' +
				Object.values(g.checks).join(' | ') +
				' |',
		),
		'',
		'The derivative forecast is propagated through the same nonlinear reconstruction. S160 source columns were previously known; this is a registered combination/propagation test, not a new withheld source-count validation. Every local value and empirical allowance remains in JSON.',
		'',
	].join('\n');
}
