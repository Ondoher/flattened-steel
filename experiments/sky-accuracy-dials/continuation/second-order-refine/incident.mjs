import assert from 'node:assert/strict';
import path from 'node:path';
import {gzipSync, gunzipSync} from 'node:zlib';
import {identity, readRepository} from '../../io/files.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {incidentCoordinateSources, refineIncidentRows} from '../incident-coordinate/fallback.mjs';

const witnessRun = 'tmp/experiments/sky-accuracy-dials/runs/00170-incident-map';
export const secondOrderIncidentPlanPath =
	'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/incident-coordinate-plan.md';
const witnessSeal = {
	path: witnessRun + '/sealed.json',
	byteLength: 181348,
	sha256: 'ee564257463ee1bf09297bf7fed46db386d150d5d028e6e8dfa1493e93f48728',
};
const witnessReference = {
	path: witnessRun + '/reference.json',
	byteLength: 43894,
	sha256: '7199a0ab856adc984ebe44b2a260b6e9e927aa203f31ca8ba71840a285c75bac',
};
const planHash = '8f7a3b0a0bd14ab7cec210869230441ba4d628576250230938fa99a0cfe062f7';

/** Authenticate the admitted coordinate witness and unchanged prospective amendment.
 * The three coordinate numerical files match the witness. The separately evolved
 * fallback wrapper is frozen at its actual current identity, never relabeled.
 * @param {string} registrationRun - Exact original C0 owner.
 * @returns {SkySecondOrderIncidentRead} Exact sources, parent identities and raw plan.
 */
export function readSecondOrderIncidentAdmission(registrationRun) {
	const witness = acceptedMechanismInput(witnessRun);
	assert.deepEqual(witness.seal, witnessSeal);
	const reference = mechanismArtifact(witness, 'reference.json');
	assert.deepEqual(reference, witnessReference);
	const definition = mechanismArtifact(witness, 'definition.json');
	/** @type {SkySecondOrderIncidentWitnessDefinition} */
	const original = JSON.parse(readRepository(definition.path, definition).toString());
	assert.equal(original.recipe.parameters.continuationRegistration, registrationRun);
	/** @type {SkySecondOrderIncidentWitnessReference} */
	const result = JSON.parse(readRepository(reference.path, reference).toString());
	assert.equal(result.schemaId, 'sky-incident-coordinate-witness-v1');
	assert.equal(result.checks.length, 80);
	assert.ok(result.checks.every((check) => check.state === 'passed'));
	const frozenPlan = mechanismArtifact(witness, 'plan.md');
	assert.equal(frozenPlan.sha256, planHash);
	const planBytes = readRepository(secondOrderIncidentPlanPath),
		plan = identity(secondOrderIncidentPlanPath, planBytes);
	assert.equal(plan.sha256, planHash);
	assert.deepEqual(planBytes, readRepository(frozenPlan.path, frozenPlan));
	const sources = incidentCoordinateSources();
	const witnessNumericalSources = sources.filter((source) => !source.path.endsWith('/fallback.mjs'));
	assert.equal(sources.length, 4);
	assert.equal(witnessNumericalSources.length, 3);
	for (const source of witnessNumericalSources)
		assert.deepEqual(
			original.recipe.parameters.sourceIdentities.find((item) => item.path === source.path),
			source,
		);
	const admission = {
		schemaId: 'sky-second-order-incident-admission-v1',
		continuationRegistration: registrationRun,
		witnessRun,
		witnessSeal,
		witnessReference,
		plan,
		sources,
		witnessNumericalSources,
	};
	return {admission, planBytes, identities: [witness.seal, reference, definition, frozenPlan, plan, ...sources]};
}

/** Exact coordinate compatibility; old records without coordinate use are unaffected.
 * @param {SkySecondOrderIncidentAdmission} previous - Original metadata, never rewritten.
 * @param {SkySecondOrderIncidentAdmission} current - Currently authenticated admission.
 */
export function assertSecondOrderIncidentAdmission(previous, current) {
	assert.deepEqual(previous, current, 'Incident coordinate witness, plan or numerical sources changed.');
}

/** Validate one preserved coordinate-use pointer against its immutable attempt evidence.
 * Outer addresses may differ after an exact-geometry alias; physical values may not.
 * @param {SkySecondOrderIncidentPoint} point - Original or aliased point carrying optional metadata.
 * @param {SkySecondOrderIncidentAdmission} current - Current authenticated coordinate contract.
 * @returns {DialFileIdentity[]} Additional immutable inputs consumed by reuse.
 */
export function readSecondOrderIncidentUse(point, current) {
	const use = point.incidentCoordinate;
	if (!use) return [];
	assertSecondOrderIncidentAdmission(use.admission, current);
	const sourceRun = path.posix.dirname(use.artifact.path);
	const parent = acceptedMechanismInput(sourceRun);
	assert.deepEqual(mechanismArtifact(parent, path.posix.basename(use.artifact.path)), use.artifact);
	/** @type {SkySecondOrderIncidentBatch} */
	const batch = JSON.parse(
		gunzipSync(readRepository(use.artifact.path, use.artifact), {maxOutputLength: 32 * 1024 ** 2}).toString(),
	);
	assert.equal(batch.schemaId, 'sky-second-order-incident-batch-v1');
	assert.deepEqual(batch.admission, current);
	assert.equal(batch.node.id, use.computedNodeId);
	for (const key of ['probeId', 'surfaceOrigin', 'origin', 'direction', 'distanceMeters', 'heightMeters'])
		assert.deepEqual(batch.node[key], point.node[key], 'Fallback evidence physical geometry changed.');
	assert.ok(batch.complete && batch.interruptions.length === 0);
	assert.deepEqual(
		batch.records.map((record) => record.id),
		use.attemptIds,
	);
	assert.deepEqual(
		batch.records.filter((record) => record.replaced).map((record) => record.id),
		use.replacedIds,
	);
	assert.ok(use.attemptIds.length > 0 && new Set(use.attemptIds).size === use.attemptIds.length);
	for (const record of batch.records) {
		assert.equal(record.schemaId, 'sky-incident-coordinate-fallback-v1');
		assert.equal(record.profile, 'simpson-expanded-medium');
		assert.ok(record.replaced && record.candidateResolved && record.comparisons.every((check) => check.passed));
	}
	for (const source of current.sources) readRepository(source.path, source);
	return [parent.seal, use.artifact, current.witnessSeal, current.witnessReference, current.plan, ...current.sources];
}

/** Count original worker methods plus every new completed method, without replacing costs.
 * @param {readonly SkyVolumeWorkerRow[]} rows - Original completed worker batch.
 * @param {readonly SkyPhysicalMethodResult[]} additional - Every actually completed new Simpson method.
 * @returns {SkySecondOrderIncidentWork} Known fresh work; interrupted method counts stay separately unknown.
 */
export function secondOrderIncidentWork(rows, additional) {
	const methods = rows.flatMap((row) => row.result.methods);
	return {
		returnedRows: rows.length,
		workerMilliseconds: rows.reduce((sum, row) => sum + row.elapsedMilliseconds, 0),
		originalMediumEvaluations: methods.reduce((sum, method) => sum + method.mediumEvaluations, 0),
		originalOuterEvaluations: methods.reduce((sum, method) => sum + method.outerEvaluations, 0),
		mainThreadMediumEvaluations: additional.reduce((sum, method) => sum + method.mediumEvaluations, 0),
		mainThreadOuterEvaluations: additional.reduce((sum, method) => sum + method.outerEvaluations, 0),
	};
}

/** Retain original work before fallback, and each callback before the next guard.
 * No observer throws or invokes a guard. A thrown evaluator/guard keeps its exact
 * identity after completed and interrupted evidence has been retained.
 * @param {SkyTransportSpec} spec - Original physical inputs.
 * @param {readonly number[]} channels - Exact original spectral order.
 * @param {SkySecondOrderIncidentRead} admitted - Authenticated coordinate amendment.
 * @param {SkySecondOrderIncidentWriter} write - Main runner's bounded exclusive artifact writer.
 * @param {SkySecondOrderIncidentCapacity} availableBytes - Remaining evidence capacity before terminal reserve.
 * @returns {SkySecondOrderIncidentCollector} Current-run evidence and known work only.
 */
export function createSecondOrderIncidentCollector(spec, channels, admitted, write, availableBytes) {
	/** @type {SkySecondOrderIncidentBatch[]} */ const batches = [];
	/** @type {SkyVolumeResult[]} */ const originalWitnesses = [];
	/** @type {SkySecondOrderIncidentWork} */
	const work = {
		returnedRows: 0,
		workerMilliseconds: 0,
		originalMediumEvaluations: 0,
		originalOuterEvaluations: 0,
		mainThreadMediumEvaluations: 0,
		mainThreadOuterEvaluations: 0,
	};
	let mainThreadMilliseconds = 0;
	return {
		batches,
		originalWitnesses,
		work,
		get mainThreadMilliseconds() {
			return mainThreadMilliseconds;
		},
		evaluate(node, originalRows, guard) {
			const originalWork = secondOrderIncidentWork(originalRows, []);
			for (const key of Object.keys(work)) work[key] += originalWork[key];
			for (const row of originalRows)
				if (!row.result.resolved && originalWitnesses.length < 8) originalWitnesses.push(row.result);
			/** @type {SkySecondOrderIncidentBatch} */
			const batch = {
				schemaId: 'sky-second-order-incident-batch-v1',
				node,
				admission: admitted.admission,
				originalWork,
				records: [],
				interruptions: [],
				extraWork: {mediumEvaluations: 0, outerEvaluations: 0, mainThreadMilliseconds: 0},
				mainThreadMilliseconds: 0,
				complete: false,
				artifact: null,
			};
			batches.push(batch);
			let retainedBytes = 0,
				dirty = false;
			const started = performance.now();
			/** @type {SkyIncidentFallbackResult|undefined} */ let result;
			/** @type {unknown} */ let failure;
			let failed = false;
			try {
				result = refineIncidentRows(
					spec,
					channels,
					originalRows,
					() => {
						guard();
						if (dirty) {
							retainedBytes = gzipSync(Buffer.from(JSON.stringify(batch)), {level: 1}).length;
							dirty = false;
						}
						assert.ok(
							availableBytes() >= retainedBytes + 128 * 1024,
							'Fallback evidence reserve exhausted before the next attempt.',
						);
					},
					(record, returnedRow, extra) => {
						batch.records.push(record);
						batch.extraWork.mediumEvaluations += extra.mediumEvaluations;
						batch.extraWork.outerEvaluations += extra.outerEvaluations;
						batch.extraWork.mainThreadMilliseconds += extra.mainThreadMilliseconds;
						work.mainThreadMediumEvaluations += record.candidateSimpson.mediumEvaluations;
						work.mainThreadOuterEvaluations += record.candidateSimpson.outerEvaluations;
						dirty = true;
					},
					(interruption) => {
						batch.interruptions.push(interruption);
					},
				);
				batch.complete = true;
				batch.extraWork = {...result.extraWork};
			} catch (error) {
				failed = true;
				failure = error;
			} finally {
				batch.mainThreadMilliseconds = performance.now() - started;
				mainThreadMilliseconds += batch.mainThreadMilliseconds;
			}
			if (batch.records.length || batch.interruptions.length) {
				try {
					batch.artifact = write(
						'incident-fallback-' + node.index + '.json.gz',
						gzipSync(Buffer.from(JSON.stringify(batch)), {level: 9}),
						{
							parents: [...admitted.identities],
							operation:
								'Preserve every completed or interrupted alternate-coordinate attempt following the unchanged original worker batch; retain null counters for interrupted methods and exact old numerical failures.',
							parameters: {schemaId: batch.schemaId, node, admission: admitted.admission},
						},
					);
				} catch (error) {
					if (!failed) {
						failed = true;
						failure = error;
					}
				}
			}
			if (failed) throw failure;
			assert.ok(result);
			const known = secondOrderIncidentWork(
				originalRows,
				batch.records.map((record) => record.candidateSimpson),
			);
			const returnedWork = secondOrderIncidentWork(result.rows, []);
			assert.equal(
				returnedWork.originalMediumEvaluations + result.extraWork.mediumEvaluations,
				known.originalMediumEvaluations + known.mainThreadMediumEvaluations,
			);
			assert.equal(
				returnedWork.originalOuterEvaluations + result.extraWork.outerEvaluations,
				known.originalOuterEvaluations + known.mainThreadOuterEvaluations,
			);
			assert.equal(returnedWork.workerMilliseconds, originalWork.workerMilliseconds);
			return {
				rows: result.rows,
				mediumEvaluations: known.originalMediumEvaluations + known.mainThreadMediumEvaluations,
				outerEvaluations: known.originalOuterEvaluations + known.mainThreadOuterEvaluations,
				workerMilliseconds: known.workerMilliseconds,
				...(batch.artifact
					? {
							incidentCoordinate: {
								admission: admitted.admission,
								artifact: batch.artifact,
								computedNodeId: node.id,
								attemptIds: batch.records.map((record) => record.id),
								replacedIds: batch.records
									.filter((record) => record.replaced)
									.map((record) => record.id),
							},
						}
					: {}),
			};
		},
	};
}
