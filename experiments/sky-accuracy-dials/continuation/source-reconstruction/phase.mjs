import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {medium, phase} from '../../numerics/direct.js';
import {sourceFrame, localDirection, unit} from '../../numerics/math.js';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {
	evaluateSourceReconstruction,
	groupSourceReconstruction,
	reconstructionValue,
	reconstructionSum,
	reconstructionDifference,
	reconstructionSolar,
} from './index.mjs';

/** Authenticate the earlier attribution and its unchanged numerical evaluator.
 * @param {DialContinuationRegistrationRead} registration @param {string} run
 * @param {string} predictionRun @param {string} targetRun @returns {SkySourcePhaseBaseline}
 */
export function readPhaseBaseline(registration, run, predictionRun, targetRun) {
	const parent = acceptedMechanismInput(run);
	const params = /** @type {SkySourcePhaseParentParameters} */ (
		/** @type {unknown} */ (parent.terminal.recipe.parameters)
	);
	assert.equal(params.continuationRegistration, registration.run);
	assert.equal(params.caseId, 'source-reconstruction');
	assert.equal(params.jobKind, 'cpu');
	assert.equal(params.phase, 'C5');
	assert.equal(params.predictionRun, predictionRun);
	assert.equal(params.targetRun, targetRun);
	const source = params.sourceIdentities.find((id) => id.path.endsWith('/source-reconstruction/index.mjs'));
	assert.ok(source);
	readRepository(source.path, source);
	const artifact = mechanismArtifact(parent, 'decomposition.json');
	const document = /** @type {SkySourcePhaseBaselineDocument} */ (
		JSON.parse(readRepository(artifact.path, artifact).toString())
	);
	assert.equal(document.schemaId, 'sky-source-reconstruction-v1');
	assert.equal(document.rows.length, 64);
	assert.equal(document.groups.length, 4);
	return {document, identities: [parent.seal, artifact, source, mechanismArtifact(parent, 'sources.json.gz')]};
}
/** @param {SkyVector3} point @param {SkyVector3} local @returns {SkyVector3} */
export function phaseWorldDirection(point, local) {
	const frame = sourceFrame(point);
	return unit(
		[0, 1, 2].map((axis) => frame[0][axis] * local[0] + frame[1][axis] * local[1] + frame[2][axis] * local[2]),
	);
}
/** @param {SkySourceReconstructionValue} candidate @param {SkySourceReconstructionValue} control
 * @param {number} fraction @returns {SkySourceAuditState}
 */
export function phaseMagnitudeGate(candidate, control, fraction) {
	assert.ok(fraction > 0 && fraction < 1);
	if (Math.abs(control.value) <= control.allowance) return 'unresolved';
	return Math.abs(candidate.value) + candidate.allowance <= fraction * (Math.abs(control.value) - control.allowance)
		? 'passed'
		: 'failed';
}
/** Remove outgoing interpolation first, then phase coupling in solar interpolation.
 * No source solve or measured value enters this calculation.
 * @param {SkySourceAuditInput} input @param {readonly SkySourceReconstructionColumn[]} columns
 * @param {SkySourcePhaseBaseline} baseline
 * @returns {{rows:SkySourcePhaseRow[],groups:SkySourceReconstructionGroup[]}}
 */
export function evaluatePhaseReconstruction(input, columns, baseline) {
	const original = evaluateSourceReconstruction(input, columns);
	assert.deepEqual(original.rows, baseline.document.rows);
	assert.deepEqual(original.groups, baseline.document.groups);
	const spec = input.buildRequest.transportSpec;
	const rows = original.rows.map((row) => {
		const sample = input.samples.find((s) => s.probeId === row.probeId && s.sampleIndex === row.sampleIndex);
		const ray = input.rays.find((r) => r.probeId === row.probeId);
		assert.ok(sample && ray);
		const query = columns.find((c) => c.coordinate.id === sample.coordinateId && c.channel === row.channel);
		assert.ok(query);
		const local = localDirection(sample.stencil.point, ray.ray.direction);
		const irradiance =
			spec.domains.spectrum.channels[row.channel].sourceIrradianceDensityWattsPerSquareMeterPerNanometer;
		const beta = medium(spec, row.channel, row.altitudeMeters),
			queryPhases = phase(spec, ray.ray.direction[2]);
		let offset = 0;
		const planes = sample.stencil.altitudeWeights.map(() => {
			const solar = Array.from({length: 4}, () => {
				const anchor = input.knots[sample.stencil.indices[offset]];
				for (let direction = 0; direction < sample.stencil.directionWeights.length; direction++) {
					const other = input.knots[sample.stencil.indices[offset++]];
					assert.equal(other.altitudeIndex, anchor.altitudeIndex);
					assert.equal(other.solarIndex, anchor.solarIndex);
				}
				const column = columns.find(
					(c) =>
						c.channel === row.channel &&
						c.coordinate.id === 'knot:' + anchor.altitudeIndex + ':' + anchor.solarIndex,
				);
				assert.ok(column);
				const phases = phase(spec, phaseWorldDirection(column.coordinate.point, local)[2]);
				return {
					transmission: column.reference,
					rayleigh: reconstructionSum([column.reference], [irradiance * phases[0]]),
					mie: reconstructionSum([column.reference], [irradiance * phases[1]]),
				};
			});
			return {
				transmission: reconstructionSolar(
					solar.map((v) => v.transmission),
					sample.stencil.solarFraction,
					sample.stencil.firstSolarInterval,
					sample.stencil.lastSolarInterval,
				),
				rayleigh: reconstructionSolar(
					solar.map((v) => v.rayleigh),
					sample.stencil.solarFraction,
					sample.stencil.firstSolarInterval,
					sample.stencil.lastSolarInterval,
				),
				mie: reconstructionSolar(
					solar.map((v) => v.mie),
					sample.stencil.solarFraction,
					sample.stencil.firstSolarInterval,
					sample.stencil.lastSolarInterval,
				),
			};
		});
		assert.equal(offset, sample.stencil.indices.length);
		const r = reconstructionSum(
			planes.map((p) => p.rayleigh),
			sample.stencil.altitudeWeights,
		);
		const m = reconstructionSum(
			planes.map((p) => p.mie),
			sample.stencil.altitudeWeights,
		);
		const transmission = reconstructionSum(
			planes.map((p) => p.transmission),
			sample.stencil.altitudeWeights,
		);
		const outgoingExact = reconstructionSum([r, m], [beta[1], beta[2]]);
		const coefficient = irradiance * (beta[1] * queryPhases[0] + beta[2] * queryPhases[1]);
		const phaseExact = reconstructionSum([transmission], [coefficient]);
		const factored = row.reconstructed['reference:binary64:factored'];
		const outgoing = reconstructionDifference(factored, outgoingExact);
		const solar = reconstructionDifference(outgoingExact, phaseExact);
		const transmissionError = reconstructionDifference(phaseExact, row.direct.reference);
		const remainder = reconstructionDifference(factored, row.direct.reference);
		const phaseIdentityResidual = remainder.value - outgoing.value - solar.value - transmissionError.value;
		const columnError = reconstructionSum([reconstructionDifference(transmission, query.reference)], [coefficient]);
		const transmissionIdentityResidual = transmissionError.value - columnError.value;
		const scale =
			Math.abs(factored.value) +
			Math.abs(outgoingExact.value) +
			Math.abs(phaseExact.value) +
			Math.abs(row.direct.reference.value);
		assert.ok(Math.abs(phaseIdentityResidual) <= 128 * Number.EPSILON * scale);
		assert.ok(Math.abs(transmissionIdentityResidual) <= 128 * Number.EPSILON * scale);
		return {
			...row,
			phaseIdentityResidual,
			transmissionIdentityResidual,
			reconstructed: {...row.reconstructed, outgoingExact, phaseExact, interpolatedTransmission: transmission},
			terms: {
				...row.terms,
				phaseFactored: remainder,
				phaseOutgoing: outgoing,
				phaseSolar: solar,
				phaseTransmission: transmissionError,
				phaseAfterOutgoing: reconstructionDifference(outgoingExact, row.direct.reference),
			},
		};
	});
	const groups = groupSourceReconstruction(rows).map((group) => {
		const contribution = group.projected.phaseOutgoing;
		/** @type {Record<string,SkySourceAuditState>} */ const checks = {
			negativeOutgoing:
				contribution.value < -contribution.allowance
					? 'passed'
					: contribution.value > contribution.allowance
						? 'failed'
						: 'unresolved',
		};
		if (group.probeId === 'p-1230-3-5') {
			checks.halfRemainder = phaseMagnitudeGate(
				group.projected.phaseAfterOutgoing,
				group.projected.phaseFactored,
				0.5,
			);
			checks.smallSolarPhase = phaseMagnitudeGate(group.projected.phaseSolar, group.projected.phaseFactored, 0.1);
		}
		return {...group, checks};
	});
	return {rows, groups};
}
/** Manufactured geometry, linearity, conservation of the error identity and
 * failed/unresolved gates; no actual atmospheric target values.
 * @returns {{checks:number,scope:string}}
 */
export function phaseReconstructionProof() {
	let checks = 0;
	/** @param {boolean} value @returns {void} */ function check(value) {
		assert.ok(value, 'Phase proof ' + (checks + 1));
		checks++;
	}
	for (const angle of [0, 0.1, 0.7, 1.4])
		for (const vector of [
			[0.2, 0.3, 0.8],
			[-0.2, 0.4, 0.7],
			[0, 0, 1],
		]) {
			const point = /** @type {SkyVector3} */ ([10 * Math.sin(angle), 0, 10 * Math.cos(angle)]),
				world = unit(vector);
			const local = localDirection(point, world),
				recovered = phaseWorldDirection(point, local);
			check(Math.abs(Math.hypot(...local) - 1) < 128 * Number.EPSILON);
			check(recovered.every((v, i) => Math.abs(v - world[i]) < 128 * Number.EPSILON));
		}
	for (const coefficient of [0, 1, 3])
		for (const fraction of [0, 0.1, 0.5, 0.9, 1]) {
			const values = [0.2, 0.3, 0.5, 0.7].map((v) => reconstructionValue(v, 1e-8));
			const after = reconstructionSum([reconstructionSolar(values, fraction, false, false)], [coefficient]);
			const before = reconstructionSolar(
				values.map((v) => reconstructionSum([v], [coefficient])),
				fraction,
				false,
				false,
			);
			check(Math.abs(before.value - after.value) <= before.allowance + after.allowance);
			if (coefficient === 0) check(before.value === 0 && after.value === 0);
		}
	const v = reconstructionValue;
	check(phaseMagnitudeGate(v(0.1, 0.01), v(1, 0.01), 0.5) === 'passed');
	check(phaseMagnitudeGate(v(1, 0.01), v(1, 0.01), 0.5) === 'failed');
	check(phaseMagnitudeGate(v(0), v(0, 0.01), 0.1) === 'unresolved');
	for (const values of [
		[1, 2, 3, 4],
		[1, 2, -3, 4],
		[0, 0, 0, 0],
	]) {
		const [f, b, a, d] = values;
		check(f - d === f - b + (b - a) + (a - d));
	}
	return {
		checks,
		scope: 'Source-frame round trip, constant-phase homogeneity, zero illumination, exact decomposition and retained failed/unresolved magnitude gates.',
	};
}
/** @param {readonly SkySourceReconstructionGroup[]} groups @returns {string} */
export function phaseReconstructionReport(groups) {
	return [
		'# Phase and transmission reconstruction attribution',
		'',
		'Fixed bottom-interval density-error projections, in W m^-2 sr^-1 nm^-1. No Kider input or complete viewing integral.',
		'The baseline is binary64 density-factored reconstruction. F-D=(F-B)+(B-A)+(A-D).',
		'',
		'| Ray | Channel | Factored remainder | Outgoing contribution | Solar-phase coupling | Transmission reconstruction | After removing outgoing interpolation |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
		...groups.map(
			(g) =>
				'| ' +
				g.probeId +
				' | ' +
				g.channel +
				' | ' +
				['phaseFactored', 'phaseOutgoing', 'phaseSolar', 'phaseTransmission', 'phaseAfterOutgoing']
					.map((k) => g.projected[k].value)
					.join(' | ') +
				' |',
		),
		'',
		'| Ray | Channel | Outgoing negative | Noon remainder reduced 50% | Noon solar-phase term <=10% |',
		'| --- | ---: | --- | --- | --- |',
		...groups.map(
			(g) =>
				'| ' +
				g.probeId +
				' | ' +
				g.channel +
				' | ' +
				g.checks.negativeOutgoing +
				' | ' +
				(g.checks.halfRemainder ?? 'not registered') +
				' | ' +
				(g.checks.smallSolarPhase ?? 'not registered') +
				' |',
		),
		'',
		'The JSON retains all local contributions and propagated empirical allowances. Sequential intervention terms include their stated interactions; the final transmission term still contains both altitude and solar interpolation. These controls use analytic phase for the declared model, without GPU arithmetic parity or full-cache qualification.',
		'',
	].join('\n');
}
