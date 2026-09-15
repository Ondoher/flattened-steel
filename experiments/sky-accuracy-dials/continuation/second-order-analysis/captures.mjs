import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {loadInputs} from '../../execution.mjs';
import {readRepository} from '../../io/files.mjs';
import {deriveProfile, acceptControls} from '../../numerics/profile.js';
import {continuationCase} from '../cases.mjs';
import {mechanismCase} from '../mechanisms/cases.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {validateChannelDiagnostics} from '../capture/diagnostics.js';
import {checkedEnvelope} from '../ladder/read.mjs';

/** Eight exact accepted captures covering multiple matched numerical controls.
 * @type {readonly SkySecondOrderDialSelection[]}
 */
export const secondOrderDialSelections = Object.freeze([
	{caseId: 'r0', runName: '00103-c-r0-scr', controlCaseId: null, representation: 'grouped'},
	{caseId: 'r1', runName: '00115-c-r1-scr', controlCaseId: 'r0', representation: 'grouped'},
	{caseId: 'h-t320', runName: '00140-c-h-t320', controlCaseId: 'r0', representation: 'grouped'},
	{caseId: 'i512-end', runName: '00135-c-i512-end', controlCaseId: 'r0', representation: 'grouped'},
	{caseId: 'i512-aspect', runName: '00136-c-i512-aspect', controlCaseId: 'r0', representation: 'grouped'},
	{caseId: 'd48-split', runName: '00130-c-d48-split', controlCaseId: 'r0', representation: 'grouped-split-higher'},
	{
		caseId: 'd48-factored',
		runName: '00131-c-d48-factored',
		controlCaseId: 'd48-split',
		representation: 'grouped-factored-higher',
	},
	{caseId: 'd55-raw', runName: '00132-c-d55-raw', controlCaseId: 'r0', representation: 'grouped'},
]);

/** Reproduce selected historical field envelopes under authenticated matched controls.
 * The saved fixed-field error allowance does not qualify physical P2 accuracy.
 * No new GPU construction or generated artifact is produced by this reader.
 * @param {DialContinuationRegistrationRead} registration - Original C0 geometry/input owner.
 * @param {readonly string[]} [probeIds] - Explicit subset of the two declared physical reference rays.
 * @param {readonly number[]} [channels] - Explicit subset of the two reference channels.
 * @returns {SkySecondOrderDialCapture[]} Complete selected control/field evidence.
 */
export function readSecondOrderDialCaptures(registration, probeIds = ['p-0930-5-7'], channels = [0, 8]) {
	assert.ok(
		probeIds.length &&
			new Set(probeIds).size === probeIds.length &&
			probeIds.every((id) => ['p-0930-5-7', 'p-1230-3-5'].includes(id)),
	);
	assert.ok(
		channels.length &&
			new Set(channels).size === channels.length &&
			channels.every((channel) => [0, 8].includes(channel)),
	);
	readRepository(registration.record.inputs.path, registration.record.inputs);
	const inputs = loadInputs();
	return secondOrderDialSelections.map((selection) => {
		const original = acceptedMechanismInput(`tmp/experiments/sky-accuracy-dials/runs/${selection.runName}`);
		const historical = ['r0', 'r1'].includes(selection.caseId);
		const candidate = historical ? continuationCase(selection.caseId) : mechanismCase(selection.caseId);
		const parameters = original.terminal.recipe.parameters;
		assert.equal(parameters.continuationRegistration, registration.run);
		assert.equal(parameters.caseId, selection.caseId);
		assert.equal(parameters.phase, candidate.phase);
		assert.equal(parameters.jobKind, 'gpu');
		assert.equal(parameters.scope, 'screen');
		const controlArtifact = mechanismArtifact(original, 'control.json');
		/** @type {SkyGpuControl} */ const control = JSON.parse(
			readRepository(controlArtifact.path, controlArtifact).toString(),
		);
		assert.deepEqual(control.buildRequest, deriveProfile(inputs.native48, candidate.controls).buildRequest);
		const actualControls = acceptControls(control.controls),
			expectedControls = acceptControls(candidate.controls);
		assert.ok(
			[8, 16].every((count) => actualControls.viewIntervals.includes(count)) &&
				actualControls.representations.includes('grouped'),
		);
		// Historical H also saved views 1/2/4 and extra representations. Project only
		// the common selectors; all construction and solar controls remain exact.
		assert.deepEqual(
			{...actualControls, viewIntervals: [8, 16], representations: ['grouped']},
			{...expectedControls, viewIntervals: [8, 16], representations: ['grouped']},
		);
		assert.deepEqual(control.channels, registration.record.scopes.screen.channels);
		assert.deepEqual(
			control.scenes,
			registration.probeScenes.filter((scene) => registration.record.scopes.screen.times.includes(scene.time)),
		);
		assert.ok(control.continuation);
		assert.equal(control.continuation.finalFirstOrder, candidate.finalFirstOrder);
		const higherRepresentation = control.continuation.higherRepresentation ?? 'combined-raw';
		assert.equal(
			higherRepresentation,
			historical ? 'combined-raw' : mechanismCase(selection.caseId).higherRepresentation,
		);
		assert.equal(control.continuation.referenceMode, 'component');
		assert.deepEqual(control.continuation.probes, registration.probes);
		assert.deepEqual(control.continuation.probeScenes, registration.probeScenes);
		/** @type {DialFileIdentity[]} */ const identities = [original.seal, controlArtifact];
		/** @type {SkySecondOrderDialRow[]} */ const rows = [];
		for (const channel of channels) {
			const artifact = mechanismArtifact(
				original,
				`channel-${String(channel).padStart(2, '0')}-diagnostics.json.gz`,
			);
			identities.push(artifact);
			const diagnostics = validateChannelDiagnostics(
				JSON.parse(
					gunzipSync(readRepository(artifact.path, artifact), {maxOutputLength: 8 * 1024 ** 2}).toString(),
				),
			);
			for (const probeId of probeIds) {
				const probe = registration.probes.find((value) => value.probeId === probeId);
				assert.ok(probe);
				const envelopes = [1, 2, 3, 4].map((order) => {
					const methods = diagnostics.probes.filter(
						(row) =>
							row.probeId === probeId &&
							row.order === order &&
							row.representationId === selection.representation,
					);
					for (const method of methods) {
						assert.equal(method.time, probe.time);
						assert.equal(method.gridX, probe.gridX);
						assert.equal(method.gridY, probe.gridY);
					}
					return checkedEnvelope(methods);
				});
				const [first, second] = envelopes;
				rows.push({
					probeId,
					time: probe.time,
					channel,
					envelopes,
					secondOrderWatts: second.value - first.value,
					allowanceWatts:
						first.errorAllowance === null || second.errorAllowance === null
							? null
							: first.errorAllowance + second.errorAllowance,
				});
			}
		}
		return {
			selection,
			identities,
			controls: control.controls,
			finalFirstOrder: control.continuation.finalFirstOrder,
			higherRepresentation,
			rows,
		};
	});
}
