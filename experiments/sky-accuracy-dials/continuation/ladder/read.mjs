import assert from 'node:assert/strict';
import {assertGroundDirection} from '../geometry.mjs';
import {gunzipSync} from 'node:zlib';
import {readRepository, verifyRun} from '../../io/files.mjs';
import {loadSpectra} from '../../processing.mjs';
import {deriveProfile} from '../../numerics/profile.js';
import {benchmarkRay} from '../../numerics/view.js';
import {validateChannelDiagnostics} from '../capture/diagnostics.js';

/** Reject missing or reordered ladder cases before interpreting a prefix.
 * @param {readonly string[]} ids @returns {void}
 */
export function assertLadderPrefix(ids) {
	assert.ok(ids.length >= 1 && ids.length <= 12);
	assert.deepEqual(
		ids,
		Array.from({length: ids.length}, (_, index) => `r${index}`),
	);
}

/** Read one exactly declared source artifact. @param {string} run @param {SkyLadderSeal} seal @param {string} name @returns {Buffer} */
function artifact(run, seal, name) {
	const found = seal.artifacts.find((item) => item.path === `${run}/${name}`);
	assert.ok(found, `Missing declared ladder artifact ${name}.`);
	return readRepository(found.path, found);
}

/** Reproduce the finite fixed-field allowance from all six retained integration methods.
 * @param {readonly SkyContinuationProbeDiagnostic[]} rows @returns {SkyContinuationProbeDiagnostic}
 */
export function checkedEnvelope(rows) {
	const rules = ['gauss4', 'gauss8', 'gauss8-split', 'simpson8', 'simpson16', 'simpson32'];
	const methods = new Map(rows.map((row) => [row.methodId, row]));
	assert.equal(rows.length, 7);
	assert.equal(methods.size, 7);
	for (const id of [...rules, 'reference-envelope']) assert.ok(methods.has(id));
	const a = methods.get('gauss8-split'),
		b = methods.get('simpson32'),
		result = methods.get('reference-envelope');
	const g0 = Math.abs(methods.get('gauss8').value - methods.get('gauss4').value),
		g1 = Math.abs(a.value - methods.get('gauss8').value);
	const s0 = Math.abs(methods.get('simpson16').value - methods.get('simpson8').value),
		s1 = Math.abs(b.value - methods.get('simpson16').value);
	const difference = Math.abs(a.value - b.value),
		tolerance = 1e-9 + 1e-6 * Math.max(Math.abs(a.value), Math.abs(b.value));
	const reasons = [];
	if (g1 > Math.max(tolerance, g0)) reasons.push('Gauss correction did not shrink.');
	if (s1 > Math.max(tolerance, s0)) reasons.push('Simpson correction did not shrink.');
	if (difference > 2 * tolerance)
		reasons.push('Independent integration rules disagree above the component tolerance.');
	if (rules.some((id) => methods.get(id).errorAllowance === null))
		reasons.push('At least one optical-depth prefix is unresolved.');
	assert.equal(result.value, a.value);
	assert.deepEqual(result.limitations ?? [], reasons);
	assert.equal(
		result.errorAllowance,
		reasons.length ? null : 2 * Math.max(g1, s1, difference) + Math.max(a.errorAllowance, b.errorAllowance),
	);
	return result;
}

/** Authenticate actual registered controls and compact retained component support.
 * Missing component rows remain unavailable; malformed or forged rows are rejected.
 * @param {string} run @param {number} index @param {DialContinuationRegistrationRead} registration
 * @param {DialInputs} inputs @param {() => void} progress @returns {SkyLadderSource}
 */
export function readLadderCapture(run, index, registration, inputs, progress) {
	const sealIdentity = verifyRun(run);
	/** @type {SkyLadderSeal} */ const seal = JSON.parse(readRepository(sealIdentity.path, sealIdentity).toString());
	assert.equal(seal.state, 'accepted');
	assert.equal(seal.run, run);
	assert.equal(seal.result.caseId, `r${index}`);
	assert.equal(seal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(seal.recipe.parameters.jobKind, 'gpu');
	assert.equal(seal.recipe.parameters.scope, 'screen');
	assert.equal(seal.recipe.parameters.phase, index === 0 ? 'C1' : 'C2');
	const loaded = loadSpectra(run),
		control = loaded.control;
	const candidate = registration.record.constructionCases.find((item) => item.id === `r${index}`);
	assert.ok(candidate);
	assert.equal(candidate.finalFirstOrder, 'raw');
	const profile = deriveProfile(inputs.native48, {
		...candidate.controls,
		viewIntervals: control.controls.viewIntervals,
	});
	assert.deepEqual(control.buildRequest, profile.buildRequest);
	assert.deepEqual(control.controls, profile.controls);
	if (index > 0) assert.ok(control.controls.viewIntervals.every((value) => [8, 16].includes(value)));
	assert.ok(control.controls.viewIntervals.some((value) => [8, 16].includes(value)));
	assert.deepEqual(control.channels, registration.record.scopes.screen.channels);
	assert.deepEqual(
		control.scenes,
		inputs.scenes.filter((scene) => registration.record.scopes.screen.times.includes(scene.time)),
	);
	const selection = control.continuation;
	assert.ok(selection);
	assert.equal(selection.finalFirstOrder, 'raw');
	assert.equal(selection.higherRepresentation ?? 'combined-raw', 'combined-raw');
	assert.equal(selection.referenceMode, 'component');
	assert.deepEqual(selection.probes, registration.probes);
	assert.deepEqual(selection.probeScenes, registration.probeScenes);
	const ground = selection.groundDensityProbes ?? [];
	const expectedGround = ['09:30:4:7', '09:30:5:7', '12:30:3:5', '12:30:4:4'].map((key) =>
		registration.probes.find((probe) => `${probe.time}:${probe.gridX}:${probe.gridY}` === key),
	);
	if (ground.length) assert.deepEqual(ground, expectedGround);
	/** @type {Map<string, SkyContinuationProbeDiagnostic>} */ const envelopes = new Map();
	/** @type {DialFileIdentity[]} */ const diagnostics = [];
	/** @type {SkyLadderGround[]} */ const groundEvidence = [];
	for (const channel of control.channels) {
		progress();
		/** @type {SkyContinuationAnalysisChannel} */ const metadata = JSON.parse(
			artifact(run, seal, `channel-${String(channel).padStart(2, '0')}.json`).toString(),
		);
		assert.equal(metadata.channel, channel);
		assert.deepEqual(
			metadata.fieldChecks.map((field) => field.fieldId),
			['J1', 'J2', 'J3', 'J4'],
		);
		if (!metadata.diagnosticArtifact) continue;
		assert.ok(registration.record.scopes.probeChannels.includes(channel));
		const id = metadata.diagnosticArtifact,
			found = seal.artifacts.find((item) => item.path === id.path);
		assert.ok(found && found.sha256 === id.sha256 && found.byteLength === id.byteLength);
		assert.ok(id.path.startsWith(`${run}/`) && id.path.endsWith('-diagnostics.json.gz'));
		const record = validateChannelDiagnostics(
			JSON.parse(gunzipSync(readRepository(id.path, id), {maxOutputLength: 2 * 1024 ** 2}).toString()),
		);
		assert.equal(record.operations, undefined, 'Adaptive operational outputs are outside the raw C2 ladder.');
		diagnostics.push(id);
		/** @type {Map<string, SkyContinuationProbeDiagnostic[]>} */ const methodGroups = new Map();
		for (const row of record.probes) {
			const probe = registration.probes.find((probe) => probe.probeId === row.probeId);
			assert.ok(probe);
			assert.equal(row.time, probe.time);
			assert.equal(row.gridX, probe.gridX);
			assert.equal(row.gridY, probe.gridY);
			assert.equal(row.sceneId, registration.probeScenes.find((scene) => scene.time === row.time).id);
			assert.ok(['grouped', 'cumulative'].includes(row.representationId));
			const key = `${channel}/${row.probeId}/${row.representationId}/${row.order}`;
			if (!methodGroups.has(key)) methodGroups.set(key, []);
			methodGroups.get(key).push(row);
		}
		for (const [key, rows] of methodGroups) {
			if (rows.some((row) => row.methodId === 'reference-envelope')) envelopes.set(key, checkedEnvelope(rows));
		}
		if (record.groundDensities) {
			assert.equal(ground.length, 4, 'Ground evidence lacks its declared control.');
			assert.deepEqual(
				record.groundDensities.rows.map((row) => row.probeId),
				ground.map((probe) => probe.probeId),
			);
			for (const [pointIndex, row] of record.groundDensities.rows.entries()) {
				const probe = ground[pointIndex],
					scene = registration.probeScenes.find((scene) => scene.time === probe.time);
				const ray = benchmarkRay(control.buildRequest.transportSpec, scene, probe.gridX, probe.gridY);
				assert.equal(row.time, probe.time);
				assert.equal(row.gridX, probe.gridX);
				assert.equal(row.gridY, probe.gridY);
				assert.equal(row.sceneId, scene.id);
				assert.deepEqual(row.origin, ray.origin);
				assertGroundDirection(row.direction, ray.direction);
			}
			groundEvidence.push({caseId: loaded.caseId, channel, artifact: id, evidence: record.groundDensities});
		}
	}
	return {run, seal, loaded, envelopes, diagnostics, ground: groundEvidence, boundaries: new Map()};
}
