import assert from 'node:assert/strict';
import path from 'node:path';
import {readdirSync} from 'node:fs';
import {loadInputs} from '../../execution.mjs';
import {identity, outputRelative, readRepository, resolveRepository, verifyRun} from '../../io/files.mjs';
import {deriveProfile} from '../../numerics/profile.js';
import {createPointStencilBuilder, viewPathIntervals} from '../../numerics/view.js';
import {continuationCase} from '../cases.mjs';
import {accountInvalidEvidence} from '../invalid-evidence.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {sourceAuditPolicy, sourceAuditGeometry, admitSourceAuditReference, predictSourceAudit} from './index.mjs';

export const sourceColumnPlanPath =
	'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/source-column-plan.md';
export const sourceColumnTargetCase = 'source-column-s160';
/** Build the exact bottom-interval midpoint/stencil support without evaluating radiance.
 * @param {DialContinuationRegistrationRead} registration @returns {{input:SkySourceAuditInput,identities:DialFileIdentity[]}}
 */
export function readSourceAuditInput(registration) {
	readRepository(registration.record.inputs.path, registration.record.inputs);
	const native = loadInputs().native48;
	/** @type {DialFileIdentity[]} */ const identities = [registration.record.inputs];
	/** @type {SkyGpuControl[]} */ const controls = [];
	for (const [caseId, name] of [
		['r0', '00103-c-r0-scr'],
		['r1', '00115-c-r1-scr'],
	]) {
		const original = acceptedMechanismInput(outputRelative + '/runs/' + name),
			artifact = mechanismArtifact(original, 'control.json'),
			control = /** @type {SkyGpuControl} */ (JSON.parse(readRepository(artifact.path, artifact).toString())),
			candidate = continuationCase(caseId);
		assert.equal(original.terminal.recipe.parameters.continuationRegistration, registration.run);
		assert.equal(original.terminal.recipe.parameters.caseId, caseId);
		assert.equal(original.terminal.recipe.parameters.jobKind, 'gpu');
		assert.deepEqual(control.buildRequest, deriveProfile(native, candidate.controls).buildRequest);
		assert.equal(control.continuation.finalFirstOrder, 'raw');
		assert.deepEqual(control.continuation.probes, registration.probes);
		identities.push(original.seal, artifact);
		controls.push(control);
	}
	const buildRequest = controls[0].buildRequest,
		spec = buildRequest.transportSpec,
		next = controls[1].buildRequest.transportSpec;
	assert.equal(spec.numerical.sourcePathTransmittanceIntervalCount, 80);
	assert.equal(next.numerical.sourcePathTransmittanceIntervalCount, 160);
	assert.deepEqual({...next, numerical: {...next.numerical, sourcePathTransmittanceIntervalCount: 80}}, spec);
	assert.deepEqual(
		spec.domains.position.nodes.slice(0, 2).map((node) => node.altitudeMeters),
		[0, 1875],
	);
	const builder = createPointStencilBuilder(buildRequest);
	/** @type {SkySourceAuditCoordinate[]} */ const coordinates = [];
	/** @type {SkySourceAuditInput['samples'][number][]} */ const samples = [];
	/** @type {SkySourceAuditInput['rays'][number][]} */ const rays = [];
	for (const probeId of ['p-0930-5-7', 'p-1230-3-5']) {
		const selected = registration.probes.find((probe) => probe.probeId === probeId);
		assert.ok(selected);
		const frozen = registration.record.probeRays.find(
			(ray) => ray.time === selected.time && ray.gridX === selected.gridX && ray.gridY === selected.gridY,
		);
		assert.ok(frozen);
		const ray = {origin: frozen.origin, direction: frozen.direction, length: frozen.lengthMeters};
		rays.push({probeId, ray});
		const intervals = viewPathIntervals(spec, ray, 'altitude-segmented', 16).slice(0, 16);
		assert.equal(intervals.length, 16);
		for (const [sampleIndex, interval] of intervals.entries()) {
			const distance = (interval.start + interval.end) / 2,
				point = /** @type {SkyVector3} */ ([
					ray.origin[0] + distance * ray.direction[0],
					ray.origin[1] + distance * ray.direction[1],
					ray.origin[2] + distance * ray.direction[2],
				]),
				stencil = builder.sample(point, ray.direction, interval.end - interval.start),
				id = `sample:${probeId}:${String(sampleIndex).padStart(2, '0')}`;
			assert.ok(stencil.altitude > 0 && stencil.altitude < 1875);
			coordinates.push({
				id,
				kind: 'sample',
				probeIds: [probeId],
				point,
				altitudeMeters: stencil.altitude,
				solarCosine: point[2] / Math.hypot(...point),
			});
			samples.push({probeId, sampleIndex, ...interval, distance, coordinateId: id, stencil});
		}
	}
	const knotKeys = [...new Set(builder.coordinates.map((knot) => `${knot.altitudeIndex}:${knot.solarIndex}`))].sort();
	for (const key of knotKeys) {
		const [heightIndex, solarIndex] = key.split(':').map(Number),
			altitudeMeters = spec.domains.position.nodes[heightIndex].altitudeMeters,
			angle = (spec.domains.solarZenith.nodes[solarIndex].solarZenithDegrees * Math.PI) / 180,
			solarCosine = Math.cos(angle),
			radius = spec.planet.bottomRadiusMeters + altitudeMeters,
			point = /** @type {SkyVector3} */ ([
				radius * Math.sqrt(Math.max(0, 1 - solarCosine ** 2)),
				0,
				radius * solarCosine,
			]),
			probeIds = [
				...new Set(
					samples
						.filter((sample) =>
							sample.stencil.indices.some((index) => {
								const coordinate = builder.coordinates[index];
								return coordinate.altitudeIndex === heightIndex && coordinate.solarIndex === solarIndex;
							}),
						)
						.map((sample) => sample.probeId),
				),
			];
		assert.ok(probeIds.length);
		coordinates.push({id: `knot:${key}`, kind: 'knot', probeIds, point, altitudeMeters, solarCosine});
	}
	assert.equal(samples.length, 32);
	assert.ok(coordinates.length <= sourceAuditPolicy.maximumCoordinates);
	for (const coordinate of coordinates) sourceAuditGeometry(spec, coordinate);
	return {input: {buildRequest, coordinates, samples, knots: builder.coordinates, rays}, identities};
}
/** Exact known-invalid exception only; every other failed verification rejects admission.
 * @param {DialContinuationRegistrationRead} registration @returns {{run:string,state:string}[]}
 */
export function sourceAuditAttempts(registration) {
	const after = Number(path.posix.basename(registration.run).slice(0, 5)),
		results = [];
	for (const name of readdirSync(resolveRepository(outputRelative + '/runs')).sort()) {
		if (Number(name.slice(0, 5)) <= after) continue;
		const run = outputRelative + '/runs/' + name,
			excluded = accountInvalidEvidence(run, registration.run),
			seal = excluded?.seal ?? verifyRun(run),
			terminal = JSON.parse(readRepository(seal.path, seal).toString());
		if (
			terminal.recipe.parameters.continuationRegistration !== registration.run ||
			terminal.recipe.parameters.caseId !== sourceColumnTargetCase
		)
			continue;
		assert.equal(terminal.recipe.parameters.jobKind, 'cpu');
		assert.equal(terminal.recipe.parameters.phase, 'C5');
		results.push({run, state: terminal.state});
	}
	return results;
}
/** Authenticate and replay the sealed formula without evaluating held S160.
 * @param {DialContinuationRegistrationRead} registration @param {string} predictionRun @param {SkySourceAuditInput} input
 * @returns {{record:SkySourceAuditPredictionRecord,identities:DialFileIdentity[]}}
 */
export function readSourceAuditPrediction(registration, predictionRun, input) {
	const parent = acceptedMechanismInput(predictionRun),
		artifact = mechanismArtifact(parent, 'prediction.json'),
		savedInput = mechanismArtifact(parent, 'inputs.json'),
		savedPlan = mechanismArtifact(parent, 'source-column-plan.md'),
		record = /** @type {SkySourceAuditPredictionRecord} */ (
			JSON.parse(readRepository(artifact.path, artifact).toString())
		);
	assert.equal(parent.terminal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(parent.terminal.recipe.parameters.caseId, 'source-column-predict');
	assert.equal(parent.terminal.recipe.parameters.jobKind, 'cpu');
	assert.equal(parent.terminal.recipe.parameters.phase, 'C5');
	assert.equal(record.schemaId, 'sky-source-column-prediction-v1');
	assert.deepEqual(record.registration, registration.seal);
	assert.equal(record.targetCaseId, sourceColumnTargetCase);
	assert.equal(record.targetAlreadyExecuted, false);
	assert.deepEqual(JSON.parse(readRepository(savedInput.path, savedInput).toString()), input);
	const plan = identity(sourceColumnPlanPath);
	assert.deepEqual(record.forecastPlan, plan);
	assert.equal(savedPlan.sha256, plan.sha256);
	assert.equal(savedPlan.byteLength, plan.byteLength);
	assert.ok(
		parent.terminal.recipe.parents.some(
			(id) => id.path === plan.path && id.sha256 === plan.sha256 && id.byteLength === plan.byteLength,
		),
	);
	assert.deepEqual(
		record.rows.map((row) => row.coordinate),
		input.coordinates,
	);
	for (const row of record.rows) {
		const spec = input.buildRequest.transportSpec;
		assert.deepEqual(row.geometry, sourceAuditGeometry(spec, row.coordinate));
		assert.equal(row.baseline.intervals, 80);
		assert.equal(row.baseline.evaluations, 162);
		assert.deepEqual(
			row.forecasts.map((item) => item.channel),
			[0, 8],
		);
		for (const forecast of row.forecasts) {
			const reference = admitSourceAuditReference(spec, row.geometry, row.passes, forecast.channel);
			assert.deepEqual(forecast.reference, reference);
			assert.deepEqual(forecast, predictSourceAudit(spec, row.coordinate, row.geometry, row.baseline, reference));
		}
	}
	const parameters = /** @type {{sourceIdentities:readonly DialFileIdentity[]}} */ (
		/** @type {unknown} */ (parent.terminal.recipe.parameters)
	);
	assert.ok(
		Array.isArray(parameters.sourceIdentities) &&
			parameters.sourceIdentities.some((id) => id.path.endsWith('/source-column-audit/index.mjs')),
	);
	for (const id of [...parent.terminal.recipe.parents, ...parameters.sourceIdentities]) readRepository(id.path, id);
	const sequence = Number(path.posix.basename(predictionRun).slice(0, 5));
	for (const attempt of sourceAuditAttempts(registration))
		assert.ok(
			sequence < Number(path.posix.basename(attempt.run).slice(0, 5)),
			'Prediction must precede every target attempt.',
		);
	return {
		record,
		identities: [
			parent.seal,
			artifact,
			savedInput,
			savedPlan,
			plan,
			...parent.terminal.recipe.parents,
			...parameters.sourceIdentities,
		],
	};
}
