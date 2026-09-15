import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {medium, phase} from '../../numerics/direct.js';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {
	sourceAuditGeometry,
	evaluateSourceAuditReference,
	admitSourceAuditReference,
} from '../source-column-audit/index.mjs';
import {reconstructionValue, reconstructionSum, reconstructionDifference, groupSourceReconstruction} from './index.mjs';
import {evaluatePhaseReconstruction, phaseMagnitudeGate} from './phase.mjs';

/** @param {DialContinuationRegistrationRead} registration @param {string} run
 * @param {string} sourceParent @param {string} predictionRun @param {string} targetRun
 * @returns {SkyTransmissionBaseline}
 */
export function readTransmissionBaseline(registration, run, sourceParent, predictionRun, targetRun) {
	const parent = acceptedMechanismInput(run);
	const params = /** @type {SkySourcePhaseParentParameters & {phaseParentRun:string}} */ (
		/** @type {unknown} */ (parent.terminal.recipe.parameters)
	);
	assert.equal(params.continuationRegistration, registration.run);
	assert.equal(params.caseId, 'phase-reconstruction');
	assert.equal(params.phaseParentRun, sourceParent);
	assert.equal(params.predictionRun, predictionRun);
	assert.equal(params.targetRun, targetRun);
	assert.equal(params.jobKind, 'cpu');
	assert.equal(params.phase, 'C5');
	const sources = ['index.mjs', 'phase.mjs'].map((name) => {
		const id = params.sourceIdentities.find((row) => row.path.endsWith('/source-reconstruction/' + name));
		assert.ok(id);
		readRepository(id.path, id);
		return id;
	});
	const artifact = mechanismArtifact(parent, 'decomposition.json');
	const document = /** @type {SkyTransmissionBaseline['document']} */ (
		JSON.parse(readRepository(artifact.path, artifact).toString())
	);
	assert.equal(document.schemaId, 'sky-phase-reconstruction-v1');
	assert.equal(document.rows.length, 64);
	assert.equal(document.groups.length, 4);
	return {document, identities: [parent.seal, artifact, ...sources, mechanismArtifact(parent, 'sources.json.gz')]};
}

/** Construct only geometry; called before any new optical integration.
 * @param {SkySourceAuditInput} input @returns {Omit<SkyTransmissionCross,'passes'|'references'>[]}
 */
export function transmissionCrossCoordinates(input) {
	const coordinates = input.samples.flatMap((sample) => {
		const query = input.coordinates.find((row) => row.id === sample.coordinateId);
		assert.ok(query);
		assert.equal(sample.stencil.altitudeWeights.length, 2);
		assert.ok(sample.stencil.altitudeWeights.every((weight) => weight >= 0 && weight <= 1));
		assert.ok(Math.abs(sample.stencil.altitudeWeights.reduce((a, b) => a + b, 0) - 1) < 1e-14);
		return sample.stencil.altitudeWeights.map((_, planeIndex) => {
			const knot = input.knots[sample.stencil.indices[planeIndex * 4 * sample.stencil.directionWeights.length]];
			assert.ok(knot);
			const anchor = input.coordinates.find(
				(row) => row.id === 'knot:' + knot.altitudeIndex + ':' + knot.solarIndex,
			);
			assert.ok(anchor);
			const coordinate = {altitudeMeters: anchor.altitudeMeters, solarCosine: query.solarCosine};
			return {
				probeId: sample.probeId,
				sampleIndex: sample.sampleIndex,
				planeIndex,
				...coordinate,
				geometry: sourceAuditGeometry(input.buildRequest.transportSpec, coordinate),
			};
		});
	});
	assert.equal(coordinates.length, 64);
	return coordinates;
}

/** @param {SkySourceAuditInput} input @param {Omit<SkyTransmissionCross,'passes'|'references'>} coordinate
 * @param {SkySourceAuditWork} work @param {()=>void} guard @returns {SkyTransmissionCross}
 */
export function evaluateTransmissionCross(input, coordinate, work, guard) {
	const spec = input.buildRequest.transportSpec;
	const passes = evaluateSourceAuditReference(spec, coordinate.geometry, work, guard);
	const references = [0, 8].map((channel) => admitSourceAuditReference(spec, coordinate.geometry, passes, channel));
	return {...coordinate, passes, references};
}

/** @param {SkySourceReconstructionValue} altitude @param {SkySourceReconstructionValue} total
 * @returns {SkySourceAuditState}
 */
export function transmissionDominanceGate(altitude, total) {
	if (Math.abs(total.value) <= total.allowance) return 'unresolved';
	return Math.abs(altitude.value) - altitude.allowance >= 0.9 * (Math.abs(total.value) + total.allowance)
		? 'passed'
		: 'failed';
}

/** Exact sequential split; prior phase and source outputs must replay unchanged.
 * @param {SkySourceAuditInput} input @param {readonly SkySourceReconstructionColumn[]} columns
 * @param {SkySourcePhaseBaseline} sourceBaseline @param {SkyTransmissionBaseline} phaseBaseline
 * @param {readonly SkyTransmissionCross[]} crosses
 * @returns {{rows:SkySourcePhaseRow[],groups:SkySourceReconstructionGroup[]}}
 */
export function evaluateTransmissionReconstruction(input, columns, sourceBaseline, phaseBaseline, crosses) {
	const prior = evaluatePhaseReconstruction(input, columns, sourceBaseline);
	assert.deepEqual(prior.rows, phaseBaseline.document.rows);
	assert.deepEqual(prior.groups, phaseBaseline.document.groups);
	const coordinates = transmissionCrossCoordinates(input);
	assert.equal(crosses.length, coordinates.length);
	for (let i = 0; i < coordinates.length; i++) {
		const {passes, references, ...coordinate} = crosses[i];
		assert.deepEqual(coordinate, coordinates[i]);
		for (const reference of references) {
			assert.deepEqual(
				reference,
				admitSourceAuditReference(
					input.buildRequest.transportSpec,
					coordinate.geometry,
					passes,
					reference.channel,
				),
			);
			assert.ok(reference.resolved, 'Independent crossed column unresolved.');
		}
	}
	const spec = input.buildRequest.transportSpec;
	const rows = prior.rows.map((row) => {
		const sample = input.samples.find((s) => s.probeId === row.probeId && s.sampleIndex === row.sampleIndex);
		const ray = input.rays.find((r) => r.probeId === row.probeId);
		assert.ok(sample && ray);
		const endpoints = [0, 1].map((planeIndex) => {
			const cross = crosses.find(
				(c) => c.probeId === row.probeId && c.sampleIndex === row.sampleIndex && c.planeIndex === planeIndex,
			);
			const reference = cross?.references.find((r) => r.channel === row.channel);
			assert.ok(
				reference &&
					reference.resolved &&
					reference.transmission !== null &&
					reference.transmissionAllowance !== null,
			);
			return reconstructionValue(reference.transmission, reference.transmissionAllowance);
		});
		const transmission = reconstructionSum(endpoints, sample.stencil.altitudeWeights);
		const beta = medium(spec, row.channel, row.altitudeMeters),
			phases = phase(spec, ray.ray.direction[2]);
		const irradiance =
			spec.domains.spectrum.channels[row.channel].sourceIrradianceDensityWattsPerSquareMeterPerNanometer;
		const h = reconstructionSum([transmission], [irradiance * (beta[1] * phases[0] + beta[2] * phases[1])]);
		const r = row.reconstructed.phaseExact;
		const solar = reconstructionDifference(r, h),
			altitude = reconstructionDifference(h, row.direct.reference);
		const total = row.terms.phaseTransmission;
		assert.ok(
			Math.abs(total.value - solar.value - altitude.value) <=
				256 * Number.EPSILON * (Math.abs(r.value) + Math.abs(h.value) + Math.abs(row.direct.reference.value)),
		);
		return {
			...row,
			reconstructed: {...row.reconstructed, solarExact: h, exactSolarAltitudeTransmission: transmission},
			terms: {...row.terms, transmissionSolar: solar, transmissionAltitude: altitude},
		};
	});
	const groups = groupSourceReconstruction(rows).map((group) => {
		const altitude = group.projected.transmissionAltitude,
			total = group.projected.phaseTransmission;
		/** @type {Record<string,SkySourceAuditState>} */ const checks = {
			negativeAltitude:
				altitude.value < -altitude.allowance
					? 'passed'
					: altitude.value > altitude.allowance
						? 'failed'
						: 'unresolved',
			dominantAltitude: transmissionDominanceGate(altitude, total),
			smallSolar: phaseMagnitudeGate(group.projected.transmissionSolar, total, 0.1),
		};
		return {...group, checks};
	});
	return {rows, groups};
}

/** Manufactured interpolation expectations, independent of atmosphere data.
 * @returns {{checks:number,scope:string}}
 */
export function transmissionReconstructionProof() {
	let checks = 0;
	/** @param {boolean} value @returns {void} */ function check(value) {
		assert.ok(value, 'Transmission proof ' + (checks + 1));
		checks++;
	}
	for (const t of [0, 0.1, 0.5, 0.9, 1]) {
		for (const slope of [0, 0.3, -0.3]) {
			const value = reconstructionSum([reconstructionValue(0.4), reconstructionValue(0.4 + slope)], [1 - t, t]);
			check(Math.abs(value.value - (0.4 + slope * t)) <= value.allowance);
		}
		for (const curvature of [-1, 1]) {
			const error = (1 - t) * 0 + t * curvature - curvature * t * t;
			check(Math.abs(error - curvature * t * (1 - t)) < 1e-14);
			check(t === 0 || t === 1 ? error === 0 : Math.sign(error) === curvature);
		}
	}
	const v = reconstructionValue;
	check(transmissionDominanceGate(v(-1, 0.01), v(-1, 0.01)) === 'passed');
	check(transmissionDominanceGate(v(-0.1, 0.01), v(-1, 0.01)) === 'failed');
	check(transmissionDominanceGate(v(1), v(0, 0.01)) === 'unresolved');
	for (const [r, h, d] of [
		[1, 2, 3],
		[-1, 2, 0],
		[0, 0, 0],
	])
		check(r - d === r - h + (h - d));
	return {
		checks,
		scope: 'Constant/affine zero chord error; concave/convex sign; exact attribution; failed and unresolved dominance.',
	};
}

/** @param {readonly SkySourceReconstructionGroup[]} groups @returns {string} */
export function transmissionReconstructionReport(groups) {
	return [
		'# Altitude and solar transmission reconstruction',
		'',
		'Fixed bottom-interval projections in W m^-2 sr^-1 nm^-1, with exact query phase and density. R-D=(R-H)+(H-D). No Kider input or complete viewing integral.',
		'',
		'| Ray | Channel | Transmission remainder | Solar reconstruction | Altitude reconstruction | Negative altitude | Altitude >=90% | Solar <=10% |',
		'| --- | ---: | ---: | ---: | ---: | --- | --- | --- |',
		...groups.map(
			(g) =>
				'| ' +
				g.probeId +
				' | ' +
				g.channel +
				' | ' +
				g.projected.phaseTransmission.value +
				' | ' +
				g.projected.transmissionSolar.value +
				' | ' +
				g.projected.transmissionAltitude.value +
				' | ' +
				Object.values(g.checks).join(' | ') +
				' |',
		),
		'',
		'Independent crossed-coordinate columns retain both adaptive rules and tolerance scales. Local values, all predicates and propagated empirical allowances are retained in JSON. The solar term includes subsequent altitude interpolation; this is a sequential attribution, not an additive model of mitigation responses.',
		'',
	].join('\n');
}
