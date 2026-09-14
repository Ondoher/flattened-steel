import assert from 'node:assert/strict';
import {assertGroundDirection} from '../geometry.mjs';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {outputRelative, readRepository, verifyRun} from '../../io/files.mjs';
import {loadInputs} from '../../execution.mjs';
import {loadSpectra, extractBoundary} from '../../processing.mjs';
import {acceptControls, deriveProfile} from '../../numerics/profile.js';
import {benchmarkRay} from '../../numerics/view.js';
import {readRegistration} from '../registration/run.mjs';
import {continuationCase} from '../cases.mjs';
import {mechanismCases, mechanismCase} from '../mechanisms/cases.mjs';
import {
	acceptedMechanismInput,
	mechanismArtifact,
	mechanismAttempts,
	mechanismGroundProbes,
	readMechanismRegistration,
} from '../mechanisms/registration.mjs';
import {validateChannelDiagnostics} from '../capture/diagnostics.js';
import {checkedEnvelope, assertLadderPrefix} from '../ladder/read.mjs';
import {angularEnvelopes} from '../j2/evaluate.mjs';
import {localJ2Rules} from '../j2/angular.mjs';
import {localJ2FiniteControls} from '../j2/finite.mjs';

/** Compare generation settings while projecting explicitly available historical selectors.
 * @param {SkyControlInput} input @returns {SkyControls}
 */
function selectedControls(input) {
	const control = acceptControls(input);
	assert.ok([8, 16].every((n) => control.viewIntervals.includes(n)));
	assert.ok(control.representations.includes('grouped'));
	assert.ok(control.solarInterpolations.includes('monotone-cubic'));
	return {...control, viewIntervals: [8, 16], representations: ['grouped'], solarInterpolations: ['monotone-cubic']};
}

/** Require exact direct ancestry, not a matching label.
 * @param {SkyMechanismAcceptedRun} input @param {readonly DialFileIdentity[]} parents @returns {void}
 */
export function requireMechanismParents(input, parents) {
	for (const parent of parents)
		assert.ok(
			input.terminal.recipe.parents.some(
				(item) =>
					item.path === parent.path && item.byteLength === parent.byteLength && item.sha256 === parent.sha256,
			),
			`Missing exact parent ${parent.path}.`,
		);
}

/** Read only a complete exact screen and reproduce every fixed-field allowance.
 * @param {string} run @param {string} caseId @param {DialContinuationRegistrationRead} registration
 * @param {SkyMechanismRegistrationRead} catalog @param {() => void} progress
 * @returns {SkyMechanismAssessmentCapture}
 */
export function readMechanismCapture(run, caseId, registration, catalog, progress) {
	const input = acceptedMechanismInput(run),
		loaded = loadSpectra(run);
	const historical = ['r0', 'h-factored'].includes(caseId);
	const candidate = historical ? continuationCase(caseId) : mechanismCase(caseId);
	assert.equal(loaded.caseId, caseId);
	assert.deepEqual(loaded.sealIdentity, input.seal);
	assert.deepEqual(
		loaded.control.buildRequest,
		deriveProfile(loadInputs().native48, candidate.controls).buildRequest,
	);
	assert.deepEqual(selectedControls(loaded.control.controls), selectedControls(candidate.controls));
	assert.deepEqual(loaded.control.channels, registration.record.scopes.screen.channels);
	assert.deepEqual(
		loaded.control.scenes,
		registration.probeScenes.filter((scene) => registration.record.scopes.screen.times.includes(scene.time)),
	);
	const selection = loaded.control.continuation;
	assert.ok(selection);
	assert.equal(selection.finalFirstOrder, candidate.finalFirstOrder);
	assert.equal(
		selection.higherRepresentation ?? 'combined-raw',
		historical ? 'combined-raw' : mechanismCase(caseId).higherRepresentation,
	);
	assert.equal(selection.referenceMode, historical ? 'component' : mechanismCase(caseId).referenceMode);
	assert.deepEqual(selection.probes, registration.probes);
	assert.deepEqual(selection.probeScenes, registration.probeScenes);
	const parameters = input.terminal.recipe.parameters;
	assert.equal(parameters.continuationRegistration, registration.run);
	assert.equal(parameters.caseId, caseId);
	assert.equal(parameters.jobKind, 'gpu');
	assert.equal(parameters.scope, 'screen');
	assert.equal(parameters.phase, candidate.phase);
	if (historical)
		assert.equal(run, `${outputRelative}/runs/${caseId === 'r0' ? '00103-c-r0-scr' : '00104-c-h-factored-scr'}`);
	else {
		assert.deepEqual(
			catalog.record.cases.find((item) => item.id === caseId),
			candidate,
		);
		requireMechanismParents(input, [catalog.seal, catalog.record.allocation]);
		assert.deepEqual(selection.groundDensityProbes, mechanismGroundProbes);
	}
	if (caseId === 'r0') assert.deepEqual(input.seal, catalog.record.reusedH);
	const artifacts = ['control.json', 'execution.json'].map((name) => mechanismArtifact(input, name));
	/** @type {SkyContinuationAnalysisChannel[]} */ const channels = [];
	/** @type {SkyMechanismAssessmentDiagnostic[]} */ const diagnostics = [];
	/** @type {Map<string,SkyContinuationProbeDiagnostic>} */ const envelopes = new Map();
	const species = (selection.higherRepresentation ?? 'combined-raw') !== 'combined-raw';
	const expectedFields = species
		? ['J1', 'J2-rayleigh', 'J2-mie', 'J3-rayleigh', 'J3-mie', 'J4-rayleigh', 'J4-mie']
		: ['J1', 'J2', 'J3', 'J4'];
	const representations = species
		? [selection.higherRepresentation === 'split-raw' ? 'grouped-split-higher' : 'grouped-factored-higher']
		: ['cumulative', selection.finalFirstOrder === 'factored' ? 'grouped-factored-n1' : 'grouped'];
	for (const [ordinal, channel] of loaded.control.channels.entries()) {
		progress();
		const stem = `channel-${String(channel).padStart(2, '0')}`;
		const metadataArtifact = mechanismArtifact(input, `${stem}.json`),
			spectrum = mechanismArtifact(input, `${stem}.f64`);
		/** @type {SkyContinuationAnalysisChannel} */ const metadata = JSON.parse(
			readRepository(metadataArtifact.path, metadataArtifact).toString(),
		);
		assert.equal(metadata.channel, channel);
		assert.deepEqual(metadata.spectra, spectrum);
		assert.deepEqual(
			metadata.fieldChecks.map((item) => item.fieldId),
			expectedFields,
		);
		channels.push(metadata);
		artifacts.push(metadataArtifact, spectrum);
		const values = loaded.spectra[ordinal];
		assert.equal(values.channel, channel);
		assert.equal(values.shape.orderCount, 4);
		assert.equal(values.shape.rayCount, 243);
		assert.equal(
			values.bytes.length,
			values.shape.representationCount *
				values.shape.viewCount *
				values.shape.orderCount *
				values.shape.rayCount *
				8,
			'Every spectrum byte must belong to the declared exact layout.',
		);
		for (let byte = 0; byte < values.bytes.length; byte += 8)
			assert.ok(Number.isFinite(values.bytes.readDoubleLE(byte)) && values.bytes.readDoubleLE(byte) >= 0);
		const componentChannel = registration.record.scopes.probeChannels.includes(channel);
		assert.equal(Boolean(metadata.diagnosticArtifact), componentChannel || selection.referenceMode === 'adaptive');
		if (!metadata.diagnosticArtifact) continue;
		const artifact = mechanismArtifact(input, `${stem}-diagnostics.json.gz`);
		assert.deepEqual(metadata.diagnosticArtifact, artifact);
		const value = validateChannelDiagnostics(
			JSON.parse(
				gunzipSync(readRepository(artifact.path, artifact), {maxOutputLength: 4 * 1024 ** 2}).toString(),
			),
		);
		assert.equal(Boolean(value.operations), selection.referenceMode === 'adaptive');
		if (value.operations) assert.equal(value.operations.firstOrder, selection.finalFirstOrder);
		/** @type {Map<string,SkyContinuationProbeDiagnostic[]>} */ const groups = new Map();
		for (const row of value.probes) {
			assert.ok(componentChannel, 'Reference rows outside the four-channel scope.');
			const probe = registration.probes.find((item) => item.probeId === row.probeId);
			assert.ok(probe);
			assert.equal(row.time, probe.time);
			assert.equal(row.gridX, probe.gridX);
			assert.equal(row.gridY, probe.gridY);
			assert.equal(row.sceneId, registration.probeScenes.find((scene) => scene.time === row.time).id);
			assert.ok(representations.includes(row.representationId));
			const key = `${channel}/${row.probeId}/${row.representationId}/${row.order}`;
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key).push(row);
		}
		assert.equal(groups.size, componentChannel ? registration.probes.length * 4 * representations.length : 0);
		for (const probe of componentChannel ? registration.probes : [])
			for (const representation of representations)
				for (let order = 1; order <= 4; order++) {
					const key = `${channel}/${probe.probeId}/${representation}/${order}`;
					assert.ok(groups.has(key));
					envelopes.set(key, checkedEnvelope(groups.get(key)));
				}
		if (!historical && !species && componentChannel) assert.ok(value.groundDensities);
		if (species)
			assert.equal(
				value.groundDensities,
				undefined,
				'Species values cannot be interpreted as combined raw density witnesses.',
			);
		if (value.groundDensities) {
			assert.deepEqual(
				value.groundDensities.rows.map((row) => row.probeId),
				mechanismGroundProbes.map((probe) => probe.probeId),
			);
			for (const [index, row] of value.groundDensities.rows.entries()) {
				const probe = mechanismGroundProbes[index],
					scene = registration.probeScenes.find((scene) => scene.time === probe.time);
				const ray = benchmarkRay(loaded.control.buildRequest.transportSpec, scene, probe.gridX, probe.gridY);
				assert.equal(row.time, probe.time);
				assert.equal(row.gridX, probe.gridX);
				assert.equal(row.gridY, probe.gridY);
				assert.equal(row.sceneId, scene.id);
				assert.deepEqual(row.origin, ray.origin);
				assertGroundDirection(row.direction, ray.direction);
			}
		}
		diagnostics.push({channel, artifact, value});
		artifacts.push(artifact);
	}
	for (const view of [8, 16])
		for (let order = 1; order <= 4; order++) extractBoundary(loaded, 'grouped', view, 'monotone-cubic', order);
	/** @type {SkyMechanismExecutionRecord} */ const execution = JSON.parse(
		readRepository(artifacts[1].path, artifacts[1]).toString(),
	);
	assert.ok(execution.execution?.executionSucceeded && execution.execution.browser);
	const coordinateSha256 = execution.execution.browser.plan.coordinateSha256;
	assert.match(coordinateSha256, /^[a-f0-9]{64}$/u);
	return {caseId, input, loaded, artifacts, channels, diagnostics, envelopes, coordinateSha256};
}

/** Authenticate the pinned completed local J2 matrix; null empirical allowances remain null.
 * @param {string} run @param {DialContinuationRegistrationRead} registration @returns {SkyMechanismLocalJ2Read}
 */
export function readMechanismLocalJ2(run, registration) {
	assert.equal(run, `${outputRelative}/runs/00113-c2-local-j2`);
	const input = acceptedMechanismInput(run),
		artifact = mechanismArtifact(input, 'reference.json'),
		definition = mechanismArtifact(input, 'definition.json');
	const p = input.terminal.recipe.parameters;
	assert.equal(p.continuationRegistration, registration.run);
	assert.equal(p.phase, 'C2');
	assert.equal(p.jobKind, 'cpu');
	assert.equal(p.scope, 'component');
	assert.equal(p.caseId, 'local-j2-reference');
	/** @type {SkyJ2ReferenceDocument} */ const record = JSON.parse(readRepository(artifact.path, artifact).toString());
	/** @type {SkyMechanismJ2Definition} */ const declared = JSON.parse(
		readRepository(definition.path, definition).toString(),
	);
	assert.equal(record.schemaId, 'sky-local-j2-reference-v1');
	assert.equal(record.units, 'W m^-3 sr^-1 nm^-1');
	assert.deepEqual(record.channels, [0, 8, 24, 30]);
	assert.equal(record.matrixComplete, true);
	assert.equal(record.stopReason, null);
	assert.equal(record.finiteFallback, null);
	const spec = loadInputs().native48.transportSpec;
	const targets = mechanismGroundProbes.map((probe) => {
		const scene = registration.probeScenes.find((scene) => scene.time === probe.time),
			ray = benchmarkRay(spec, scene, probe.gridX, probe.gridY);
		return {
			id: probe.probeId,
			time: probe.time,
			gridX: probe.gridX,
			gridY: probe.gridY,
			origin: ray.origin,
			direction: ray.direction,
		};
	});
	assert.deepEqual(record.targets, targets);
	assert.deepEqual(declared.recipe.parameters.targets, targets);
	assert.deepEqual(declared.recipe.parameters.channels, record.channels);
	assert.deepEqual(declared.recipe.parameters.rules, localJ2Rules);
	assert.deepEqual(declared.recipe.parameters.finiteControls, localJ2FiniteControls);
	assert.equal(record.rules.length, 8);
	for (const time of ['09:30', '12:30'])
		for (const [index, rule] of localJ2Rules.entries()) {
			const matches = record.rules.filter((item) => item.time === time && item.ruleId === rule.id);
			assert.equal(matches.length, 1);
			const result = matches[0],
				expectedNodes = [128, 512, 2048, 2080][index];
			assert.equal(result.finiteAngularResolved, true);
			assert.equal(result.expectedNodes, expectedNodes);
			assert.equal(result.completedNodes, expectedNodes);
			assert.equal(result.rows?.length, 8);
			for (const target of targets.filter((target) => target.time === time))
				for (const channel of record.channels) {
					const rows = result.rows.filter((row) => row.targetId === target.id && row.channel === channel);
					assert.equal(rows.length, 1);
					const row = rows[0];
					assert.equal(row.finite.length, index < 2 ? 4 : 0);
					for (const value of [row.gauss, row.simpson, row.allowance, ...row.finite])
						assert.ok(Number.isFinite(value) && value >= 0);
				}
		}
	assert.deepEqual(record.envelopes, angularEnvelopes(targets, record.channels, record.rules));
	assert.equal(record.envelopes.length, 16);
	return {input, artifact, definition, record};
}

/** Read the exact complete C3 input matrix after resource admission authenticates the ledger.
 * @param {string} c0 @param {string} catalogRun @param {readonly string[]} captureRuns
 * @param {string} localJ2Run @param {string} ladderRun @param {() => void} progress
 * @returns {SkyMechanismAssessmentInputs}
 */
export function readMechanismAssessmentInputs(c0, catalogRun, captureRuns, localJ2Run, ladderRun, progress) {
	const registration = readRegistration(c0),
		catalog = readMechanismRegistration(c0, catalogRun);
	const cases = mechanismCases.filter((item) => item.phase === 'C3');
	assert.equal(captureRuns.length, 10);
	assert.equal(new Set(captureRuns).size, 10);
	const expected = cases.map((item) => item.id),
		attempts = mechanismAttempts(c0);
	const casesByRun = captureRuns.map((run) => ({
		run,
		caseId: acceptedMechanismInput(run).terminal.recipe.parameters.caseId,
	}));
	assert.deepEqual(casesByRun.map((item) => item.caseId).sort(), [...expected].sort());
	for (const {run, caseId} of casesByRun) {
		const accepted = attempts.filter((item) => item.caseId === caseId && item.state === 'accepted');
		assert.equal(
			accepted.length,
			1,
			'Repeated accepted C3 cases require an explicit scientific admission; selecting a favorable repeat is prohibited.',
		);
		assert.equal(accepted[0].run, run);
	}
	const captures = [
		readMechanismCapture(path.posix.dirname(catalog.record.reusedH.path), 'r0', registration, catalog, progress),
		readMechanismCapture(
			`${outputRelative}/runs/00104-c-h-factored-scr`,
			'h-factored',
			registration,
			catalog,
			progress,
		),
		...cases.map((item) =>
			readMechanismCapture(
				casesByRun.find((source) => source.caseId === item.id).run,
				item.id,
				registration,
				catalog,
				progress,
			),
		),
	];
	const localJ2 = readMechanismLocalJ2(localJ2Run, registration),
		ladder = acceptedMechanismInput(ladderRun),
		ladderArtifact = mechanismArtifact(ladder, 'summary.json');
	const p = ladder.terminal.recipe.parameters;
	assert.equal(p.continuationRegistration, c0);
	assert.equal(p.caseId, 'reference-ladder-assessment');
	assert.equal(p.phase, 'C2');
	assert.equal(p.jobKind, 'cpu');
	assert.equal(p.scope, 'component');
	/** @type {SkyMechanismLadderSummary} */ const ladderSummary = JSON.parse(
		readRepository(ladderArtifact.path, ladderArtifact).toString(),
	);
	assert.equal(ladderSummary.schemaId, 'sky-continuation-reference-ladder-assessment-v1');
	assertLadderPrefix(ladderSummary.sources.map((item) => item.caseId));
	assert.equal(ladderSummary.finiteN4ReferenceAdequate, false);
	assert.equal(ladderSummary.totalReferenceAllowanceW, null);
	assert.equal(ladderSummary.fullRegisteredBoundary, false);
	assert.equal(ladderSummary.prospective, false);
	assert.deepEqual(ladderSummary.sources[0].seal, catalog.record.reusedH);
	for (const source of ladderSummary.sources) {
		progress();
		assert.deepEqual(verifyRun(source.run), source.seal);
		requireMechanismParents(ladder, [source.seal]);
	}
	requireMechanismParents(ladder, [registration.seal, catalog.record.allocation]);
	const parents = [
		registration.seal,
		catalog.seal,
		catalog.artifact,
		catalog.record.allocation,
		registration.record.inputs,
		...captures.flatMap((item) => [item.input.seal, ...item.artifacts]),
		localJ2.input.seal,
		localJ2.artifact,
		localJ2.definition,
		ladder.seal,
		ladderArtifact,
	];
	return {
		registration,
		catalog,
		captures,
		localJ2,
		ladder,
		ladderArtifact,
		ladderSummary,
		parents: [...new Map(parents.map((item) => [item.path, item])).values()],
	};
}

/** Reauthenticate a completed C3 assessment for a closure consumer.
 * @param {string} c0 @param {string} catalogRun @param {string} assessmentRun
 * @returns {SkyMechanismAssessmentRead}
 */
export function readMechanismAssessment(c0, catalogRun, assessmentRun) {
	const registration = readRegistration(c0),
		catalog = readMechanismRegistration(c0, catalogRun),
		input = acceptedMechanismInput(assessmentRun),
		artifact = mechanismArtifact(input, 'summary.json');
	/** @type {SkyMechanismAssessmentSummary} */ const summary = JSON.parse(
		readRepository(artifact.path, artifact).toString(),
	);
	assert.equal(input.terminal.recipe.parameters.continuationRegistration, c0);
	assert.equal(input.terminal.recipe.parameters.caseId, 'mechanism-assessment');
	assert.equal(input.terminal.recipe.parameters.phase, 'C3');
	assert.equal(input.terminal.recipe.parameters.jobKind, 'cpu');
	assert.equal(input.terminal.recipe.parameters.scope, 'component');
	assert.equal(summary.schemaId, 'sky-mechanism-assessment-v1');
	assert.deepEqual(summary.sources.registration, registration.seal);
	assert.deepEqual(summary.sources.catalog, catalog.seal);
	assert.deepEqual(summary.sources.allocation, catalog.record.allocation);
	assert.deepEqual(summary.scope, {
		times: registration.record.scopes.screen.times,
		channels: registration.record.scopes.screen.channels,
		scoreChannels: [0, 8, 16, 24, 30],
		views: [8, 16],
		orders: [1, 2, 3, 4],
		ordinaryRayCount: 243,
	});
	assert.deepEqual(
		summary.sources.captures.map((item) => item.caseId),
		['r0', 'h-factored', ...mechanismCases.filter((item) => item.phase === 'C3').map((item) => item.id)],
	);
	assert.equal(summary.completeRegisteredMatrix, true);
	assert.equal(summary.referenceAdequacy.wholeN4, false);
	assert.equal(summary.referenceAdequacy.localJ2Total, 16);
	assert.equal(summary.c5Decision.status, 'skip-proposed');
	assert.deepEqual(summary.c5Decision.candidateCaseIds, []);
	for (const value of Object.values(summary.packages)) {
		assert.equal(value.combinedAccuracyQualified, false);
		assert.equal(value.prospectivePrediction, 'not-tested-by-C3');
		assert.equal(
			value.localNumericalComparisons.adequate,
			value.localNumericalComparisons.improved + value.localNumericalComparisons.worsened,
		);
		for (const count of Object.values(value.localNumericalComparisons))
			assert.ok(Number.isInteger(count) && count >= 0);
	}
	const parents = [
		registration.seal,
		catalog.seal,
		catalog.record.allocation,
		...summary.sources.captures.map((item) => item.seal),
		summary.sources.localJ2,
		summary.sources.ladderAssessment,
	];
	requireMechanismParents(input, parents);
	for (const parent of parents) assert.deepEqual(verifyRun(path.posix.dirname(parent.path)), parent);
	assert.equal(new Set(summary.artifacts.map((item) => item.path)).size, summary.artifacts.length);
	for (const file of summary.artifacts)
		assert.deepEqual(mechanismArtifact(input, path.posix.basename(file.path)), file);
	return {seal: input.seal, summary, artifacts: [artifact, ...summary.artifacts]};
}
