import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {loadInputs} from '../../execution.mjs';
import {identity, outputRelative, readRepository, resolveRepository, verifyRun} from '../../io/files.mjs';
import {deriveProfile} from '../../numerics/profile.js';
import {workingControls} from '../cases.mjs';
import {accountInvalidEvidence} from '../invalid-evidence.mjs';
import {acceptedMechanismInput, mechanismArtifact, mechanismGroundProbes} from '../mechanisms/registration.mjs';
import {validateChannelDiagnostics} from '../capture/diagnostics.js';
import {
	prepareGroundDensityCapture,
	evaluateGroundDensityCapture,
	validateGroundDensityCapture,
} from '../capture/ground.js';
import {checkedEnvelope} from '../ladder/read.mjs';
import {readMatchedOrdersParent} from '../matched-orders/read.mjs';
import {predictAltitudeConvergence} from './index.mjs';

const planPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/altitude-convergence-plan.md';
const parentRun = 'tmp/experiments/sky-accuracy-dials/runs/00132-c-d55-raw';

/** @param {string} caseId @returns {asserts caseId is SkyAltitudeTargetCase} */
export function assertAltitudeTargetCase(caseId) {
	assert.ok(caseId === 'altitude-p51' || caseId === 'altitude-p63');
}
/** Build exactly the original H controls with only the registered near-ground altitude additions.
 * @param {DialContinuationRegistrationRead} registration @param {SkyAltitudeTargetCase} caseId
 * @returns {SkyGpuControl}
 */
export function altitudeTargetControl(registration, caseId) {
	assertAltitudeTargetCase(caseId);
	const inputs = loadInputs(),
		altitudeCount = caseId === 'altitude-p51' ? 51 : 63;
	const profile = deriveProfile(inputs.native48, {
		...workingControls,
		altitudeCount,
		representations: ['grouped'],
		viewIntervals: [8, 16],
	});
	const original = deriveProfile(inputs.native48, workingControls).buildRequest.transportSpec;
	const spec = profile.buildRequest.transportSpec,
		nodes = spec.domains.position.nodes;
	assert.deepEqual(
		nodes
			.filter((node) => node.altitudeMeters === 0 || node.altitudeMeters >= 1875)
			.map(({index, ...node}) => node),
		original.domains.position.nodes.map(({index, ...node}) => node),
	);
	assert.deepEqual(
		nodes.filter((node) => node.altitudeMeters <= 1875).map((node) => node.altitudeMeters),
		Array.from({length: altitudeCount - 46}, (_, i) => (i * 1875) / (altitudeCount - 47)),
	);
	assert.deepEqual({...spec, domains: {...spec.domains, position: original.domains.position}}, original);
	assert.equal(registration.record.scopes.screen.times.length, 3);
	return {
		buildRequest: profile.buildRequest,
		controls: profile.controls,
		scenes: inputs.scenes.filter((scene) => registration.record.scopes.screen.times.includes(scene.time)),
		channels: [0, 8],
		continuation: {
			finalFirstOrder: 'raw',
			higherRepresentation: 'combined-raw',
			referenceMode: 'component',
			probes: registration.probes,
			probeScenes: registration.probeScenes,
			groundDensityProbes: mechanismGroundProbes,
		},
	};
}
/** Inspect every attempted matched target after the original registration; active/unsealed attempts reject admission.
 * @param {DialContinuationRegistrationRead} registration @returns {SkyAltitudeTargetAttempt[]}
 */
export function altitudeTargetAttempts(registration) {
	const start = Number(path.posix.basename(registration.run).slice(0, 5));
	const attempts = [];
	for (const name of readdirSync(resolveRepository(outputRelative + '/runs')).sort()) {
		if (Number(name.slice(0, 5)) <= start) continue;
		const run = outputRelative + '/runs/' + name,
			excluded = accountInvalidEvidence(run, registration.run),
			seal = excluded?.seal ?? verifyRun(run);
		const terminal = JSON.parse(readRepository(seal.path, seal).toString()),
			parameters = terminal.recipe.parameters;
		if (
			parameters.continuationRegistration !== registration.run ||
			!['altitude-p51', 'altitude-p63'].includes(parameters.caseId)
		)
			continue;
		assert.equal(parameters.jobKind, 'gpu');
		assert.equal(parameters.phase, 'C5');
		attempts.push({run, caseId: parameters.caseId, state: terminal.state});
	}
	return attempts;
}
/** Require a separately sealed exact forecast which predates every attempt of its target case.
 * @param {DialContinuationRegistrationRead} registration @param {string} run
 * @param {SkyAltitudeTargetCase} caseId @param {boolean} [checkAttempts]
 * @returns {SkyAltitudeTargetPredictionRead}
 */
export function readAltitudeTargetPrediction(registration, run, caseId, checkAttempts = true) {
	assertAltitudeTargetCase(caseId);
	const source = acceptedMechanismInput(run),
		artifact = mechanismArtifact(source, 'prediction.json'),
		savedPlan = mechanismArtifact(source, 'altitude-convergence-plan.md');
	const record = JSON.parse(readRepository(artifact.path, artifact).toString());
	assert.equal(source.terminal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(source.terminal.recipe.parameters.jobKind, 'cpu');
	assert.equal(source.terminal.recipe.parameters.phase, 'C5');
	assert.equal(source.terminal.recipe.parameters.caseId, caseId + '-predict');
	assert.equal(record.schemaId, 'sky-altitude-held-prediction-v1');
	assert.deepEqual(record.registration, registration.seal);
	assert.equal(record.targetCaseId, caseId);
	assert.equal(record.targetAlreadyExecuted, false);
	assert.equal(record.prediction.inputs.stage, caseId === 'altitude-p51' ? 'p51' : 'p63');
	assert.deepEqual(record.prediction, predictAltitudeConvergence(record.prediction.inputs));
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes);
	assert.deepEqual(record.forecastPlan, plan);
	assert.equal(savedPlan.sha256, plan.sha256);
	assert.equal(savedPlan.byteLength, plan.byteLength);
	assert.ok(
		source.terminal.recipe.parents.some(
			(row) => row.path === plan.path && row.sha256 === plan.sha256 && row.byteLength === plan.byteLength,
		),
	);
	const parameters = /** @type {{sourceIdentities:readonly DialFileIdentity[]}} */ (
		/** @type {unknown} */ (source.terminal.recipe.parameters)
	);
	const model = parameters.sourceIdentities.find(
		(row) => row.path === 'experiments/sky-accuracy-dials/continuation/altitude-convergence/index.mjs',
	);
	assert.ok(model);
	readRepository(model.path, model);
	for (const parent of source.terminal.recipe.parents) readRepository(parent.path, parent);
	if (checkAttempts) {
		const sequence = Number(path.posix.basename(run).slice(0, 5));
		for (const attempt of altitudeTargetAttempts(registration).filter((row) => row.caseId === caseId))
			assert.ok(
				sequence < Number(path.posix.basename(attempt.run).slice(0, 5)),
				'Forecast must precede every target attempt.',
			);
	}
	return {
		run,
		identities: [source.seal, artifact, savedPlan, plan, model, ...source.terminal.recipe.parents],
		prediction: record.prediction,
		plan,
		planBytes,
	};
}
/** Validate every original C0 row and empirical envelope; unresolved numerical outcomes remain retained.
 * @param {unknown} value @param {DialContinuationRegistrationRead} registration
 * @param {SkyGpuControl} control @returns {SkyContinuationChannelDiagnostics}
 */
export function validateAltitudeTargetDiagnostics(value, registration, control) {
	const diagnostic = validateChannelDiagnostics(value);
	assert.equal(diagnostic.probes.length, 40 * 4 * 2 * 7);
	assert.equal(diagnostic.operations, undefined);
	for (const probe of registration.probes)
		for (const order of [1, 2, 3, 4])
			for (const representation of ['cumulative', 'grouped']) {
				const rows = diagnostic.probes.filter(
					(row) =>
						row.probeId === probe.probeId && row.order === order && row.representationId === representation,
				);
				for (const row of rows) {
					assert.equal(row.time, probe.time);
					assert.equal(row.gridX, probe.gridX);
					assert.equal(row.gridY, probe.gridY);
					assert.equal(row.sceneId, registration.probeScenes.find((scene) => scene.time === probe.time).id);
				}
				checkedEnvelope(rows);
			}
	assert.ok(diagnostic.groundDensities);
	const ground = validateGroundDensityCapture(diagnostic.groundDensities),
		expected = prepareGroundDensityCapture(control.buildRequest, control.continuation);
	assert.deepEqual(ground.coordinates, expected.coordinates);
	for (const [i, row] of ground.rows.entries()) {
		assert.deepEqual(row.sample.indices, expected.probes[i].sample.indices);
		assert.deepEqual(row.origin, expected.probes[i].ray.origin);
		assert.equal(row.probeId, expected.probes[i].probe.probeId);
		assert.equal(row.sceneId, expected.probes[i].sceneId);
		// Browser and Node trigonometry can differ by a few ulps. Retained weights
		// are self-validated by the capture decoder; they are not raw-knot identities.
	}
	return diagnostic;
}
/** Compare only raw J1/J2 at physically identical retained P55 ground support.
 * @param {SkyGpuControl} control @param {readonly Pick<SkyContinuationChannelDiagnostics,'groundDensities'>[]} diagnostics
 * @param {SkyMatchedOrdersParent} parent @returns {SkyAltitudeSharedKnotEvidence}
 */
export function compareAltitudeSharedKnots(control, diagnostics, parent) {
	assert.equal(parent.run, parentRun);
	const oldSpec = parent.control.buildRequest.transportSpec,
		spec = control.buildRequest.transportSpec;
	assert.deepEqual(oldSpec.domains.solarZenith, spec.domains.solarZenith);
	assert.deepEqual(oldSpec.domains.outgoing, spec.domains.outgoing);
	/** @type {SkyAltitudeSharedKnotRow[]} */ const rows = [];
	for (const [channelIndex, channel] of [0, 8].entries()) {
		const authority = parent.channels.find((row) => row.channel === channel),
			id = authority.identities.find((row) => row.path.endsWith('-diagnostics.json.gz'));
		const original = validateChannelDiagnostics(
			JSON.parse(gunzipSync(readRepository(id.path, id), {maxOutputLength: 2 * 1024 ** 2}).toString()),
		);
		const oldGround = validateGroundDensityCapture(original.groundDensities),
			ground = validateGroundDensityCapture(diagnostics[channelIndex].groundDensities);
		const expectedOld = prepareGroundDensityCapture(parent.control.buildRequest, parent.control.continuation);
		assert.deepEqual(oldGround.coordinates, expectedOld.coordinates);
		for (const [i, row] of oldGround.rows.entries())
			assert.deepEqual(row.sample.indices, expectedOld.probes[i].sample.indices);
		const oldByKey = new Map(
			oldGround.coordinates.map((coordinate, index) => {
				const altitude = oldSpec.domains.position.nodes[coordinate.altitudeIndex].altitudeMeters;
				return [
					altitude + ':' + coordinate.solarIndex + ':' + coordinate.directionIndex,
					{coordinate, index, altitude},
				];
			}),
		);
		assert.equal(oldByKey.size, oldGround.coordinates.length);
		for (const [index, coordinate] of ground.coordinates.entries()) {
			const altitudeMeters = spec.domains.position.nodes[coordinate.altitudeIndex].altitudeMeters;
			const old = oldByKey.get(altitudeMeters + ':' + coordinate.solarIndex + ':' + coordinate.directionIndex);
			if (!old) continue;
			const parentValues = [oldGround.fields[0][old.index], oldGround.fields[1][old.index]],
				targetValues = [ground.fields[0][index], ground.fields[1][index]];
			rows.push({
				channel,
				altitudeMeters,
				solarIndex: coordinate.solarIndex,
				directionIndex: coordinate.directionIndex,
				parentCoordinate: old.coordinate,
				targetCoordinate: coordinate,
				parentValues,
				targetValues,
				firstExact: parentValues[0] === targetValues[0],
				secondExact: parentValues[1] === targetValues[1],
			});
		}
	}
	return {
		schemaId: 'sky-altitude-shared-ground-knots-v1',
		parentRun,
		rows,
		state:
			rows.length === 0
				? 'unresolved'
				: rows.every((row) => row.firstExact && row.secondExact)
					? 'passed'
					: 'failed',
		scope: 'Physical intersection of original P5500132 and target four-ground-probe raw stencil taps, channels0/8, J1/J2 only.',
		limitations: [
			'Original H00103 has no retained raw tap values. This witness is against original P5500132 only.',
			'Texture row numbers and complete sparse hashes are different across altitude grids and are not invariants.',
			'Unobserved shared heights remain unresolved. Passing this bounded intersection cannot establish full-knot equality or prove that the entire response comes from final reconstruction.',
			'Any failed shared J1/J2 knot must be explained before attributing the response only to final reconstruction.',
		],
	};
}
/** Authenticate a completed target for later prediction assessment without launching any work.
 * @param {DialContinuationRegistrationRead} registration @param {string} run
 * @param {SkyAltitudeTargetCase} caseId @returns {SkyAltitudeTargetRead}
 */
export function readAltitudeTarget(registration, run, caseId) {
	const source = acceptedMechanismInput(run);
	assert.equal(source.terminal.recipe.parameters.caseId, caseId);
	assert.equal(source.terminal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(source.terminal.recipe.parameters.jobKind, 'gpu');
	assert.equal(source.terminal.recipe.parameters.phase, 'C5');
	const parameters = /** @type {{predictionRun:string}} */ (
		/** @type {unknown} */ (source.terminal.recipe.parameters)
	);
	const prediction = readAltitudeTargetPrediction(registration, parameters.predictionRun, caseId),
		parent = readMatchedOrdersParent(registration, parentRun),
		expectedControl = altitudeTargetControl(registration, caseId),
		controlId = mechanismArtifact(source, 'control.json'),
		executionId = mechanismArtifact(source, 'execution.json'),
		knotsId = mechanismArtifact(source, 'shared-knots.json'),
		componentsId = mechanismArtifact(source, 'component-values.json');
	const control = /** @type {SkyGpuControl} */ (JSON.parse(readRepository(controlId.path, controlId).toString()));
	assert.deepEqual(control, expectedControl);
	for (const id of [...prediction.identities, ...parent.identities])
		assert.ok(
			source.terminal.recipe.parents.some(
				(row) => row.path === id.path && row.sha256 === id.sha256 && row.byteLength === id.byteLength,
			),
		);
	const execution = JSON.parse(readRepository(executionId.path, executionId).toString()).execution;
	assert.ok(
		execution.executionSucceeded &&
			execution.servedSourcesReauthenticated &&
			execution.cleanup.childExited &&
			execution.cleanup.serverClosed,
	);
	const identities = [
		source.seal,
		controlId,
		executionId,
		knotsId,
		componentsId,
		...prediction.identities,
		...parent.identities,
	];
	const diagnostics = [0, 8].map((channel) => {
		const stem = 'channel-' + String(channel).padStart(2, '0'),
			metadataId = mechanismArtifact(source, stem + '.json'),
			spectraId = mechanismArtifact(source, stem + '.f64'),
			diagnosticId = mechanismArtifact(source, stem + '-diagnostics.json.gz');
		identities.push(metadataId, spectraId, diagnosticId);
		const metadata = JSON.parse(readRepository(metadataId.path, metadataId).toString());
		assert.equal(metadata.schemaId, 'sky-altitude-target-channel-v1');
		assert.equal(metadata.channel, channel);
		assert.deepEqual(metadata.shape, {representationCount: 1, viewCount: 2, orderCount: 4, rayCount: 243});
		assert.deepEqual(metadata.spectra, spectraId);
		assert.equal(metadata.spectraSha256, spectraId.sha256);
		assert.deepEqual(metadata.diagnosticArtifact, diagnosticId);
		assert.equal(spectraId.byteLength, 1 * 2 * 4 * 243 * 8);
		const bytes = readRepository(spectraId.path, spectraId);
		for (let i = 0; i < bytes.length; i += 8)
			assert.ok(Number.isFinite(bytes.readDoubleLE(i)) && bytes.readDoubleLE(i) >= 0);
		assert.deepEqual(
			metadata.fieldChecks.map((row) => row.fieldId),
			['J1', 'J2', 'J3', 'J4'],
		);
		assert.ok(metadata.fieldChecks.every((row) => row.count === execution.browser.plan.coordinateCount));
		return validateAltitudeTargetDiagnostics(
			JSON.parse(
				gunzipSync(readRepository(diagnosticId.path, diagnosticId), {
					maxOutputLength: 2 * 1024 ** 2,
				}).toString(),
			),
			registration,
			control,
		);
	});
	const sharedKnots = compareAltitudeSharedKnots(control, diagnostics, parent);
	assert.deepEqual(JSON.parse(readRepository(knotsId.path, knotsId).toString()), sharedKnots);
	const components = diagnostics.flatMap((diagnostic, i) =>
		diagnostic.probes
			.filter((row) => row.methodId === 'reference-envelope' && row.representationId === 'grouped')
			.map((row) => ({...row, channel: [0, 8][i]})),
	);
	assert.deepEqual(JSON.parse(readRepository(componentsId.path, componentsId).toString()).rows, components);
	const targets = prediction.prediction.inputs.groups.map((group) => {
		const rows = components.filter((row) => row.probeId === group.probeId && row.channel === group.channel),
			a = rows.find((row) => row.order === 1),
			b = rows.find((row) => row.order === 2);
		assert.ok(a && b);
		return {
			probeId: group.probeId,
			channel: group.channel,
			value: b.value - a.value,
			allowance:
				a.errorAllowance === null || b.errorAllowance === null ? null : a.errorAllowance + b.errorAllowance,
		};
	});
	return {
		run,
		caseId,
		identities: [...new Map(identities.map((id) => [id.path, id])).values()],
		control,
		prediction,
		diagnostics,
		targets,
		sharedKnots,
	};
}

/** Manufacture target tap arrays from authenticated shared P55 values, then perturb one J2 tap.
 * This checks the physical address join and failure retention; no target recurrence is executed.
 * @param {DialContinuationRegistrationRead} registration @returns {SkyAltitudeTargetProof}
 */
export function altitudeTargetProof(registration) {
	const parent = readMatchedOrdersParent(registration, parentRun);
	let checks = 0;
	/** @type {number[]} */ const sharedSurfaceTaps = [];
	for (const caseId of /** @type {const} */ (['altitude-p51', 'altitude-p63'])) {
		const control = altitudeTargetControl(registration, caseId),
			plan = prepareGroundDensityCapture(control.buildRequest, control.continuation);
		/** @type {Float32Array[][]} */ const fieldSets = [];
		const diagnostics = [0, 8].map((channel) => {
			const id = parent.channels
				.find((row) => row.channel === channel)
				.identities.find((row) => row.path.endsWith('-diagnostics.json.gz'));
			const original = validateChannelDiagnostics(
				JSON.parse(gunzipSync(readRepository(id.path, id), {maxOutputLength: 2 * 1024 ** 2}).toString()),
			).groundDensities;
			const byKey = new Map(
				original.coordinates.map((point, index) => [
					parent.control.buildRequest.transportSpec.domains.position.nodes[point.altitudeIndex]
						.altitudeMeters +
						':' +
						point.solarIndex +
						':' +
						point.directionIndex,
					index,
				]),
			);
			const fields = [0, 1, 2, 3].map((order) =>
				Float32Array.from(plan.coordinates, (point) => {
					const index = byKey.get(
						control.buildRequest.transportSpec.domains.position.nodes[point.altitudeIndex].altitudeMeters +
							':' +
							point.solarIndex +
							':' +
							point.directionIndex,
					);
					return index === undefined ? 0 : original.fields[order][index];
				}),
			);
			fieldSets.push(fields);
			return {groundDensities: evaluateGroundDensityCapture(plan, fields, 'monotone-cubic')};
		});
		const result = compareAltitudeSharedKnots(control, diagnostics, parent);
		assert.equal(result.state, 'passed');
		checks++;
		assert.ok(result.rows.length > 0 && result.rows.every((row) => row.altitudeMeters === 0));
		checks++;
		assert.ok(result.rows.some((row) => row.parentCoordinate.y !== row.targetCoordinate.y));
		checks++;
		sharedSurfaceTaps.push(result.rows.length);
		const row = result.rows.find((item) => item.channel === 0),
			index = plan.coordinates.findIndex(
				(point) => point.x === row.targetCoordinate.x && point.y === row.targetCoordinate.y,
			);
		fieldSets[0][1][index] = Math.fround(fieldSets[0][1][index] + 1);
		diagnostics[0] = {groundDensities: evaluateGroundDensityCapture(plan, fieldSets[0], 'monotone-cubic')};
		assert.equal(compareAltitudeSharedKnots(control, diagnostics, parent).state, 'failed');
		checks++;
	}
	return {schemaId: 'sky-altitude-target-proof-v1', checks, sharedSurfaceTaps, physicalTargetExecuted: false};
}
