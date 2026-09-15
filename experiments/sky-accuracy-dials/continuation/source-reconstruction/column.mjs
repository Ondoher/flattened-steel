import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {medium, phase} from '../../numerics/direct.js';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {volumeAttenuation} from '../volume-reference/method.mjs';
import {reconstructionValue, reconstructionSum, reconstructionDifference, groupSourceReconstruction} from './index.mjs';
import {phaseMagnitudeGate} from './phase.mjs';
import {evaluateTransmissionReconstruction} from './transmission.mjs';

/** @param {DialContinuationRegistrationRead} registration @param {string} run
 * @param {string} sourceRun @param {string} phaseRun @param {string} predictionRun @param {string} targetRun
 * @returns {SkyColumnBaseline}
 */
export function readColumnBaseline(registration, run, sourceRun, phaseRun, predictionRun, targetRun) {
	const parent = acceptedMechanismInput(run);
	const params =
		/** @type {SkySourcePhaseParentParameters & {phaseParentRun:string,transmissionParentRun:string}} */ (
			/** @type {unknown} */ (parent.terminal.recipe.parameters)
		);
	assert.equal(params.caseId, 'transmission-reconstruction');
	assert.equal(params.continuationRegistration, registration.run);
	assert.equal(params.phaseParentRun, sourceRun);
	assert.equal(params.transmissionParentRun, phaseRun);
	assert.equal(params.predictionRun, predictionRun);
	assert.equal(params.targetRun, targetRun);
	assert.equal(params.jobKind, 'cpu');
	assert.equal(params.phase, 'C5');
	const sources = ['index.mjs', 'phase.mjs', 'transmission.mjs'].map((name) => {
		const id = params.sourceIdentities.find((r) => r.path.endsWith('/source-reconstruction/' + name));
		assert.ok(id);
		readRepository(id.path, id);
		return id;
	});
	const artifact = mechanismArtifact(parent, 'decomposition.json');
	const document = /** @type {SkyColumnBaseline['document']} */ (
		JSON.parse(readRepository(artifact.path, artifact).toString())
	);
	assert.equal(document.schemaId, 'sky-transmission-reconstruction-v1');
	const ids = Array.from({length: 64}, (_, i) =>
		mechanismArtifact(parent, 'cross-' + String(i + 1).padStart(2, '0') + '.json'),
	);
	const crosses = ids.map(
		(id) => /** @type {SkyTransmissionCross} */ (JSON.parse(readRepository(id.path, id).toString())),
	);
	return {
		document,
		crosses,
		identities: [parent.seal, artifact, ...sources, ...ids, mechanismArtifact(parent, 'sources.json.gz')],
	};
}

/** Reconstruct geometric columns with a known density factor and optional exact
 * finite-top plane-parallel offset. The spherical input field is unchanged.
 * @param {readonly SkySourceReconstructionValue[]} columns @param {readonly number[]} heights
 * @param {readonly number[]} weights @param {number} height @param {number} scale
 * @param {number} top @param {number} mu @param {SkyColumnMode} mode
 * @returns {SkySourceReconstructionValue}
 */
export function reconstructColumn(columns, heights, weights, height, scale, top, mu, mode) {
	assert.ok(mu > 0 && mu <= 1 && scale > 0 && top >= height);
	assert.equal(columns.length, heights.length);
	assert.equal(columns.length, weights.length);
	assert.ok(weights.every((w) => w >= 0 && w <= 1));
	assert.ok(Math.abs(weights.reduce((a, b) => a + b, 0) - 1) < 1e-14);
	const offset = mode === 'adjusted' ? (scale / mu) * Math.exp(-top / scale) : 0;
	const adjusted = columns.map((c) => reconstructionSum([c, reconstructionValue(offset)], [1, 1]));
	const factoredWeights = weights.map(
		(w, i) => w * (mode === 'linear' ? 1 : Math.exp((heights[i] - height) / scale)),
	);
	return reconstructionDifference(reconstructionSum(adjusted, factoredWeights), reconstructionValue(offset));
}

/** Independent per-species allowance in geometric metres, before spectral weighting.
 * @param {SkyTransmissionCross} cross @param {'rayleigh'|'mie'} species
 * @returns {SkySourceReconstructionValue}
 */
export function columnReferenceValue(cross, species) {
	assert.equal(cross.passes.length, 4);
	const values = cross.passes.map((p) => (species === 'rayleigh' ? p.columns.rayleighMeters : p.columns.mieMeters));
	const errors = cross.passes.map((p) =>
		species === 'rayleigh' ? p.columns.errorRayleighMeters : p.columns.errorMieMeters,
	);
	assert.ok(cross.passes.every((p) => p.columns.converged));
	assert.ok([...values, ...errors].every((v) => Number.isFinite(v) && v >= 0));
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
		Math.abs(cross.geometry.length - cross.geometry.referenceLength) +
		256 * Number.EPSILON * Math.abs(value);
	return reconstructionValue(value, allowance);
}

/** @param {SkySourceAuditInput} input @param {readonly SkySourceReconstructionColumn[]} columns
 * @param {SkySourcePhaseBaseline} sourceBaseline @param {SkyTransmissionBaseline} phaseBaseline
 * @param {SkyColumnBaseline} baseline
 * @returns {{rows:SkySourcePhaseRow[],groups:SkySourceReconstructionGroup[],localChecks:Record<string,SkySourceAuditState>[]}}
 */
export function evaluateColumnReconstruction(input, columns, sourceBaseline, phaseBaseline, baseline) {
	const prior = evaluateTransmissionReconstruction(input, columns, sourceBaseline, phaseBaseline, baseline.crosses);
	assert.deepEqual(prior.rows, baseline.document.rows);
	assert.deepEqual(prior.groups, baseline.document.groups);
	const spec = input.buildRequest.transportSpec;
	/** @type {Record<string,SkySourceAuditState>[]} */ const localChecks = [];
	const rows = prior.rows.map((row) => {
		const sample = input.samples.find((s) => s.probeId === row.probeId && s.sampleIndex === row.sampleIndex);
		const ray = input.rays.find((r) => r.probeId === row.probeId);
		assert.ok(sample && ray);
		const crosses = [0, 1].map((planeIndex) => {
			const c = baseline.crosses.find(
				(c) => c.probeId === row.probeId && c.sampleIndex === row.sampleIndex && c.planeIndex === planeIndex,
			);
			assert.ok(c);
			return c;
		});
		assert.equal(crosses[0].solarCosine, crosses[1].solarCosine);
		const rayleigh = crosses.map((c) => columnReferenceValue(c, 'rayleigh')),
			mie = crosses.map((c) => columnReferenceValue(c, 'mie'));
		const heights = crosses.map((c) => c.altitudeMeters),
			weights = sample.stencil.altitudeWeights;
		const height = heights.reduce((sum, h, i) => sum + h * weights[i], 0);
		assert.ok(Math.abs(height - row.altitudeMeters) < 1e-7);
		const beta = medium(spec, row.channel, row.altitudeMeters),
			phases = phase(spec, ray.ray.direction[2]),
			spectral = spec.domains.spectrum.channels[row.channel];
		const coefficient =
			spectral.sourceIrradianceDensityWattsPerSquareMeterPerNanometer *
			(beta[1] * phases[0] + beta[2] * phases[1]);
		const reconstructed = {...row.reconstructed},
			terms = {...row.terms};
		/** @type {Record<string,SkySourceAuditState>} */ const checks = {};
		for (const mode of /** @type {const} */ (['linear', 'factored', 'adjusted'])) {
			const columnsBySpecies = [rayleigh, mie].map((values, i) =>
				reconstructColumn(
					values,
					heights,
					weights,
					row.altitudeMeters,
					i === 0 ? spec.atmosphere.rayleighScaleHeightMeters : spec.atmosphere.mieScaleHeightMeters,
					spec.planet.topRadiusMeters - spec.planet.bottomRadiusMeters,
					crosses[0].solarCosine,
					mode,
				),
			);
			const tau = reconstructionSum(columnsBySpecies, [
				spectral.rayleighScatteringPerMeter,
				spectral.mieExtinctionPerMeter,
			]);
			assert.ok(tau.value >= 0);
			const transmission = volumeAttenuation(tau.value, tau.allowance);
			const value = reconstructionSum([transmission], [coefficient]);
			reconstructed['columnRayleighMeters:' + mode] = columnsBySpecies[0];
			reconstructed['columnMieMeters:' + mode] = columnsBySpecies[1];
			reconstructed['columnOpticalDepth:' + mode] = tau;
			reconstructed['columnTransmission:' + mode] = transmission;
			reconstructed['column:' + mode] = value;
			terms['column:' + mode] = reconstructionDifference(value, row.direct.reference);
			if (mode !== 'linear')
				checks[mode] = phaseMagnitudeGate(terms['column:' + mode], row.terms.transmissionAltitude, 0.01);
		}
		localChecks.push(checks);
		return {...row, reconstructed, terms};
	});
	const groups = groupSourceReconstruction(rows).map((g) => ({
		...g,
		checks: {
			factored: phaseMagnitudeGate(g.projected['column:factored'], g.projected.transmissionAltitude, 0.01),
			adjusted: phaseMagnitudeGate(g.projected['column:adjusted'], g.projected.transmissionAltitude, 0.01),
		},
	}));
	return {rows, groups, localChecks};
}

/** Manufactured exact finite-top vertical fields, with no atmospheric target reads.
 * @returns {{checks:number,scope:string}}
 */
export function columnReconstructionProof() {
	let checks = 0;
	/** @param {boolean} value @returns {void} */ function check(value) {
		assert.ok(value, 'Column proof ' + (checks + 1));
		checks++;
	}
	for (const scale of [1, 8])
		for (const top of [4 * scale, 10 * scale])
			for (const fraction of [0, 0.1, 0.5, 0.9, 1]) {
				const heights = [0, scale],
					weights = [1 - fraction, fraction],
					height = fraction * scale;
				const exact = (/** @type {number} */ h) => scale * (Math.exp(-h / scale) - Math.exp(-top / scale));
				const cols = heights.map((h) => reconstructionValue(exact(h)));
				const factored = reconstructColumn(cols, heights, weights, height, scale, top, 1, 'factored');
				const adjusted = reconstructColumn(cols, heights, weights, height, scale, top, 1, 'adjusted');
				const expected =
					-scale *
					Math.exp(-top / scale) *
					(weights.reduce((sum, w, i) => sum + w * Math.exp((heights[i] - height) / scale), 0) - 1);
				check(Math.abs(factored.value - exact(height) - expected) <= factored.allowance + 1e-14 * scale);
				check(Math.abs(adjusted.value - exact(height)) <= adjusted.allowance + 1e-14 * scale);
				if (fraction === 0 || fraction === 1)
					for (const mode of /** @type {const} */ (['linear', 'factored', 'adjusted'])) {
						const v = reconstructColumn(cols, heights, weights, height, scale, top, 1, mode);
						check(Math.abs(v.value - exact(height)) <= v.allowance);
					}
				const zero = reconstructionSum(cols, [0, 0]);
				check(volumeAttenuation(zero.value, zero.allowance).value === 1);
			}
	const v = reconstructionValue;
	check(phaseMagnitudeGate(v(0.001), v(1), 0.01) === 'passed');
	check(phaseMagnitudeGate(v(0.1), v(1), 0.01) === 'failed');
	check(phaseMagnitudeGate(v(0), v(0, 1e-8), 0.01) === 'unresolved');
	return {
		checks,
		scope: 'Exact finite-top vertical factoring error, adjusted recovery, endpoint identities, zero extinction and failed/unresolved accuracy predicates.',
	};
}

/** @param {readonly SkySourceReconstructionGroup[]} groups @param {readonly Record<string,SkySourceAuditState>[]} localChecks @returns {string} */
export function columnReconstructionReport(groups, localChecks) {
	const counts = localChecks.flatMap((c) => Object.values(c));
	return [
		'# Density-factored sunlight-column reconstruction',
		'',
		'Fixed bottom-interval density-error projections in W m^-2 sr^-1 nm^-1. Same exact-solar anchors and independent query references; no new optical integration, GPU work or Kider input.',
		'',
		'| Ray | Channel | Transmission interpolation | Linear columns | Factored columns | Finite-top adjusted | Factored >=99% | Adjusted >=99% |',
		'| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |',
		...groups.map(
			(g) =>
				'| ' +
				g.probeId +
				' | ' +
				g.channel +
				' | ' +
				g.projected.transmissionAltitude.value +
				' | ' +
				g.projected['column:linear'].value +
				' | ' +
				g.projected['column:factored'].value +
				' | ' +
				g.projected['column:adjusted'].value +
				' | ' +
				Object.values(g.checks).join(' | ') +
				' |',
		),
		'',
		'Local scalar predicates: ' +
			counts.filter((s) => s === 'passed').length +
			' passed, ' +
			counts.filter((s) => s === 'failed').length +
			' failed, ' +
			counts.filter((s) => s === 'unresolved').length +
			' unresolved.',
		'Column allowances are derived per species from both admitted adaptive rules and scales, then propagated through density factors, spectral optical depth and exponential transmission. The JSON retains every comparison, empirical allowance and local gate. This is not a full-sky, full-cache or GPU arithmetic qualification.',
		'',
	].join('\n');
}
